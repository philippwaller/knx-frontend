"""Exercise mutations with a real temporary Git store and mocked GitHub transport."""
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
import urllib.error
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'build-scripts'))
import gallery_pages as pages
from test_gallery_pages import SHA, pull, comment


class ControlFlowTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)
        env = patch.dict(os.environ, {
            'RUNNER_TEMP': tmp.name, 'GITHUB_REPOSITORY': 'owner/repo',
            'GITHUB_REF': 'refs/heads/main', 'GITHUB_EVENT_NAME': 'workflow_dispatch',
            'GALLERY_PAGES_ENABLED': 'true', 'GITHUB_RUN_ID': '123',
            'GITHUB_OUTPUT': str(self.root / 'outputs'), 'GH_TOKEN': 'test-only-token',
            # Tests have their own Git identity/configuration, independent of the developer.
            'GIT_CONFIG_GLOBAL': os.devnull, 'GIT_CONFIG_NOSYSTEM': '1',
        })
        env.start(); self.addCleanup(env.stop)
        remote = self.root / 'remote.git'
        pages.git('init', '--bare', str(remote))
        self.store = pages.Store.__new__(pages.Store)
        self.store.root = self.root / 'store'
        pages.git('init', '-b', 'gh-pages', str(self.store.root))
        pages.git('config', 'user.name', 'Test', cwd=self.store.root)
        pages.git('config', 'user.email', 'test@example.invalid', cwd=self.store.root)
        pages.git('remote', 'add', 'origin', str(remote), cwd=self.store.root)
        self.store.state = pages.site.empty_state('owner/repo')
        self.old = self.store.save('Initial state')
        self.store.state['published_commit'] = self.old
        self.store.save('Confirm initial state')
        self.entry = dict(sha=SHA, run_id=10, run_attempt=1, artifact_id=20, comment_id=7, actor_id=2)
        self.store.state['previews']['12'] = self.entry.copy()
        preview = self.store.root / 'pr/12'
        preview.mkdir(parents=True)
        (preview / 'index.html').write_text('candidate')
        (preview / 'preview.html').write_text('interactive')
        self.candidate = self.store.save('Prepare candidate')
        factory = patch.object(pages, 'Store', return_value=self.store)
        factory.start(); self.addCleanup(factory.stop)

    def test_failed_deploy_keeps_published_pointer(self):
        with patch.object(pages, 'github_request', return_value=pull()), patch.object(pages, 'update_status'):
            pages.finish('failure', self.candidate, '')
        self.assertEqual(self.store.state['published_commit'], self.old)
        self.assertEqual(self.store.published()[1]['previews'], {})
        self.assertTrue((self.store.root / 'pr/12/index.html').exists())

    def test_failed_comment_update_preserves_deploy_success_and_can_retry(self):
        with patch.object(pages, 'github_request', return_value=pull()), patch.object(pages, 'update_status', side_effect=TimeoutError):
            with self.assertRaises(TimeoutError):
                pages.finish('success', self.candidate, '55')
        self.assertEqual(self.store.state['published_commit'], self.candidate)
        self.assertEqual(self.store.published()[1]['previews']['12']['sha'], SHA)
        with patch.object(pages, 'github_request', return_value=pull()), patch.object(pages, 'update_status') as status:
            pages.finish('success', self.candidate, '55')
            status.assert_called_once()
        head = pages.git('rev-parse', 'HEAD', cwd=self.store.root)
        with patch.object(pages, 'github_request', return_value=pull()), patch.object(pages, 'update_status'):
            pages.finish('success', self.candidate, '55')
        self.assertEqual(pages.git('rev-parse', 'HEAD', cwd=self.store.root), head)

    def test_failed_confirmation_push_can_retry_from_remote_snapshot(self):
        real_git = pages.git
        def fail_push(*args, **kwargs):
            if args[0] == "push":
                raise pages.subprocess.CalledProcessError(1, ["git", "push"])
            return real_git(*args, **kwargs)
        with patch.object(pages, "git", side_effect=fail_push):
            with self.assertRaises(pages.subprocess.CalledProcessError):
                pages.finish("success", self.candidate, "123/1")
        remote = self.root / "remote.git"
        data = json.loads(real_git("--git-dir", str(remote), "show", "gh-pages:" + pages.site.STATE))
        self.assertEqual(data["published_commit"], self.old)
        fresh = self.root / "fresh"
        real_git("clone", "--branch", "gh-pages", str(remote), str(fresh))
        real_git("config", "user.name", "Test", cwd=fresh)
        real_git("config", "user.email", "test@example.invalid", cwd=fresh)
        self.store.root = fresh
        self.store.state = pages.site.read_state(fresh, "owner/repo")
        with patch.object(pages, "github_request", return_value=pull()), patch.object(pages, "update_status"):
            pages.finish("success", self.candidate, "123/1")
        data = json.loads(real_git("--git-dir", str(remote), "show", "gh-pages:" + pages.site.STATE))
        self.assertEqual(data["published_commit"], self.candidate)

    def test_closed_unconfirmed_deployment_is_removed_even_without_confirmed_preview(self):
        # Pages may already serve this candidate although the confirmation push failed.
        # The confirmed snapshot predates the PR, so cleanup must still publish it.
        closed = pull(); closed["state"] = "closed"
        with patch.dict(os.environ, {"GITHUB_EVENT_NAME": "pull_request_target"}), patch.object(pages, "resolve_build_run", return_value=None), patch.object(pages, "github_request", return_value=closed):
            pages.prepare({"number": 12})
        self.assertIn("deploy=true", (self.root / "outputs").read_text())
        self.assertFalse((self.root / "gallery-pages-public/pr/12").exists())
        self.assertEqual(self.store.state["published_commit"], self.old)

    def test_failed_cleanup_deployment_stays_retryable(self):
        closed = pull(); closed["state"] = "closed"
        with patch.object(pages, "resolve_build_run", return_value=None), patch.object(pages, "github_request", return_value=closed), patch.object(pages, "update_status"):
            pages.prepare({})
            cleanup = pages.git("rev-parse", "HEAD", cwd=self.store.root)
            pages.finish("failure", cleanup, "123/1")
            pages.shutil.rmtree(self.root / "gallery-pages-public")
            (self.root / "outputs").unlink()
            pages.prepare({})
        self.assertIn("deploy=true", (self.root / "outputs").read_text())
        self.assertFalse((self.root / "gallery-pages-public/pr/12").exists())

    def test_skipped_or_failed_same_head_run_does_not_regress_published_status(self):
        self.store.state["published_commit"] = self.candidate
        self.store.save("Confirm published preview")
        for conclusion in ["success", "failure"]:
            with self.subTest(conclusion=conclusion):
                pages.shutil.rmtree(self.root / "gallery-pages-public", ignore_errors=True)
                run = dict(self.entry, target="pr", pr_number=12, conclusion=conclusion, status="completed")
                with patch.dict(os.environ, {"GITHUB_EVENT_NAME":"workflow_run"}), patch.object(pages, "resolve_build_run", return_value=run), patch.object(pages, "github_request", return_value=pull()), patch.object(pages, "run_artifact", return_value=None), patch.object(pages, "update_status") as status:
                    pages.prepare({"workflow_run": {"id":10,"run_attempt":1}})
                    status.assert_not_called()
                pages.shutil.rmtree(self.root / "gallery-pages-public", ignore_errors=True)

    def test_stale_pending_candidate_is_not_reused(self):
        with patch.object(pages, 'resolve_build_run', return_value=None):
            pages.prepare({})
        self.assertIn('deploy=true', (self.root / 'outputs').read_text())
        self.assertFalse((self.root / "gallery-pages-public/pr/12").exists())
        self.assertEqual(self.store.state['published_commit'], self.old)

    def test_unconfirmed_success_is_safe_to_retry(self):
        run = dict(self.entry, target='pr', pr_number=12, conclusion='success', status='completed')
        with patch.object(pages, 'resolve_build_run', return_value=run), patch.object(pages, 'github_request', return_value=pull()):
            pages.prepare({})
        self.assertIn('deploy=true', (self.root / 'outputs').read_text())
        self.assertEqual(self.store.state['published_commit'], self.old)
        self.assertEqual((self.root / 'gallery-pages-public/pr/12/index.html').read_text(), 'candidate')

    def test_head_change_during_composition_is_rejected(self):
        run = dict(self.entry, target='pr', pr_number=12, conclusion='success', status='completed')
        with patch.object(pages, 'resolve_build_run', side_effect=[run, run, None]), patch.object(pages, 'github_request', return_value=pull()):
            with self.assertRaises(ValueError):
                pages.prepare({})
        self.assertEqual(self.store.state['published_commit'], self.old)
        self.assertNotIn('deploy=true', (self.root / 'outputs').read_text())

    def test_deploy_rechecks_approval_after_environment_wait(self):
        with patch.object(pages, "github_request", return_value=pull()), patch.object(pages, "resolve_build_run", return_value=None):
            with self.assertRaises(ValueError):
                pages.verify_deployment(self.candidate)
        self.assertEqual(self.store.state["published_commit"], self.old)

    def test_comment_during_gate_reruns_once(self):
        self.store.state['previews'] = {}
        run = dict(id=10, run_attempt=1, status='in_progress', head_repository={'id':99})
        posts = []
        def api(method, path, body=None):
            if method == 'POST':
                self.assertTrue(self.store.state['requests']['12']['rerun'])
                stored = json.loads(pages.git('show', 'HEAD:' + pages.site.STATE, cwd=self.store.root))
                self.assertTrue(stored['requests']['12']['rerun'])
                posts.append(path); return None
            return {'workflow_runs': [run]}
        with patch.object(pages, 'permission', return_value='write'), patch.object(pages, 'github_request', side_effect=api):
            self.assertEqual(pages.request_preview(pull(), comment(), self.store, pages.site.empty_state('owner/repo')), 'running')
            run['status'] = 'completed'
            self.assertEqual(pages.request_preview(pull(), comment(), self.store, pages.site.empty_state('owner/repo')), 'started')
            self.assertEqual(pages.request_preview(pull(), comment(), self.store, pages.site.empty_state('owner/repo')), 'waiting')
        self.assertEqual(posts, ['/repos/owner/repo/actions/runs/10/rerun'])

    def test_rerun_http_failure_is_visible_without_automatic_retry(self):
        self.store.state['previews'] = {}
        def api(method, path, body=None):
            if method == 'POST': raise urllib.error.HTTPError('https://api.github.com', 422, 'expired', {}, None)
            return {'workflow_runs': [dict(id=10, run_attempt=1, status='completed', head_repository={'id':99})]}
        with patch.object(pages, 'permission', return_value='write'), patch.object(pages, 'github_request', side_effect=api):
            self.assertEqual(pages.request_preview(pull(), comment(), self.store, pages.site.empty_state('owner/repo')), 'retry_failed')
            self.assertEqual(pages.request_preview(pull(), comment(), self.store, pages.site.empty_state('owner/repo')), 'waiting')

    def test_download_redirect_drops_authorization(self):
        data = b'archive'
        artifact = {'id': 20, 'digest': 'sha256:' + pages.hashlib.sha256(data).hexdigest()}
        class Opener:
            def open(inner, request, timeout):
                self.assertEqual(request.get_header('Authorization'), 'Bearer test-only-token')
                raise urllib.error.HTTPError(request.full_url, 302, '', {'Location': 'https://storage.example/signed'}, None)
        def download(request, timeout):
            self.assertIsNone(request.get_header('Authorization'))
            return io.BytesIO(data)
        with patch.object(pages.urllib.request, 'build_opener', return_value=Opener()), patch.object(pages.urllib.request, 'urlopen', side_effect=download):
            pages.download_artifact(artifact, self.root / 'artifact.zip')
            artifact['digest'] = 'sha256:' + '0' * 64
            with self.assertRaisesRegex(ValueError, 'digest'):
                pages.download_artifact(artifact, self.root / 'bad.zip')


if __name__ == '__main__':
    unittest.main()
