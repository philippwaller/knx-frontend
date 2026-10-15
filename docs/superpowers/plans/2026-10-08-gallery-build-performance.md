# Gallery Build Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Reduce Gallery CI work and latency while retaining complete regression and publishing checks.

**Architecture:** Extend the existing Actions workflow with explicit compiler caches and PR-only cancellation. Compare Main pushes to the confirmed published Gallery SHA. Parallelize independent thumbnail captures and shorten waits only after complete pixel-equivalence evidence.

**Tech Stack:** GitHub Actions, Python standard library, pnpm/Node 24.21.0, Babel/Rspack, Vitest, Playwright Chromium.

**Spec:** `docs/superpowers/specs/2026-10-08-gallery-build-performance-design.md`

## Global Constraints

- Work only in `/Users/PWALLER/Development/Privat/home-assistant-dev/knx-frontend/.worktrees/component-gallery`; preserve unrelated checkouts and the pinned submodule.
- No new dependencies and no reduction in the 266-test interactive regression suite or publishing safeguards.
- Use `.nvmrc` Node 24.21.0; run TypeScript checking without file arguments.
- New external Actions are pinned to verified commit SHAs. Untrusted jobs have only `contents: read`, exact gated SHA checkouts and no persisted credentials.
- Only successful push-to-Main jobs explicitly save compiler caches; the publisher never restores caches.
- Gallery artifacts retain names `gallery-${{ github.run_id }}-${{ github.run_attempt }}`; Main runs and the publisher queue are not cancelled.
- Main relevance compares against the confirmed published Main SHA, never only `event.before`.
- Retain the actual Gallery output during the release build and wheel exclusion check.
- Preserve fixed thumbnail fixture/time/locale/theme behavior and all 96 unique PNGs plus catalog metadata.
- Keep README CRLF line endings. Commit only scoped files with signing enabled. Never spawn worker-owned subagents or reviewers.
- Spec and plan review prompts are waived by the user's explicit uninterrupted execution request. Delivery remains limited to the previously authorized fork `philippwaller/knx-frontend`.

## Review Focus

- A new PR attempt must cancel only that PR's prior validation and preserve the exact-attempt artifact/publication checks (Task 1 workflow test).
- A PR compiler cache restore cannot add explicit cache writes or publisher cache execution (Task 1 workflow test).
- A documentation push following a failed UI deployment must build the unpublished UI delta (Task 2 real Git diff regression).
- First publication, absent baseline and missing Git objects must run the build rather than skip validation (Task 2 gate regressions).
- Delayed fonts/icons/assets and parallel captures must retain the serial thumbnails' pixels, including the monitor (Task 3 full capture comparison and delayed-local-asset check).

---

### Task 1: Explicit compiler caches and superseded PR cancellation

**Files:**
- Modify: `.github/workflows/gallery-build.yml`
- Modify/Test: `build-scripts/gallery-workflows.test.ts`
- Modify: `build-scripts/README.md`

**Interfaces:**
- Consumes: gate outputs `build`, `sha`, `base_path`; regular CI cache prefix `babel-loader-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}-`.
- Produces: workflow-level PR-only concurrency and per-role compiler cache restore/save in existing `build` and `release-check` jobs; no change to the job graph or artifact contract.

- [ ] **Step 1: Add meaningful failing workflow invariants.** Assert concurrency group is `${{ github.workflow }}-${{ github.event_name }}-${{ github.event.pull_request.number || github.run_id }}` and `cancel-in-progress` is `${{ github.event_name == 'pull_request' }}`. Assert the publisher retains `{group: "gallery-pages", queue: "max"}`. For each compiling job, assert explicit Babel directory, cache restore preceding compilation, OS/runtime/lock/role/gated-SHA key, and Main-push-only save after successful compilation. Check PR jobs cannot save through a permissive condition and all added external Action references are pinned.
- [ ] **Step 2: Run the focused test and record the expected failure.** `pnpm test build-scripts/gallery-workflows.test.ts --exclude '**/.worktrees/**'` must fail because concurrency/compiler-cache steps do not exist yet.
- [ ] **Step 3: Implement the existing workflow changes.** Use `BABEL_CACHE_DIR: ${{ runner.temp }}/babel-loader` in both compiling jobs. Use restore/save Actions from the current verified `actions/cache` release, separate role keys `gallery-babel-loader-${{ runner.os }}-${{ github.job }}-${{ hashFiles('.nvmrc', 'pnpm-lock.yaml', 'pnpm-workspace.yaml') }}-${{ needs.gate.outputs.sha }}`, a matching role prefix, then the regular CI prefix as fallback. Prune files older than 30 days before saves. Save only with `github.event_name == 'push' && github.ref == 'refs/heads/main'`, relying on normal successful-step semantics. Preserve existing read-only permissions and all full-suite commands.
- [ ] **Step 4: Verify focused tests, then the complete unit suite.** Run the focused command and `pnpm test --exclude '**/.worktrees/**'`; record exact totals and any pre-existing Vite warnings. Validate modified YAML with the installed parser/Action validator if available. Document cache behavior and why release build deduplication is retained: regular CI's merge SHA differs from Gallery's gated head, and the exclusion proof requires actual Gallery files present.
- [ ] **Step 5: Self-review and signed commit.** Stage only this task's files. Commit message: `perf: cache Gallery compilers and cancel superseded PR runs`.

### Task 2: Skip unaffected Main publications safely

**Files:**
- Modify: `build-scripts/gallery_pages.py`
- Create/Test: `test/test_gallery_pages_gate.py`
- Modify/Test: `test/test_gallery_pages_changes.py` if its existing path-policy tests own the relevant inputs.
- Modify: `README.md` (Main rebuild policy paragraph only)

**Interfaces:**
- Consumes: existing `published_remote_state()` confirmed snapshot, `has_gallery_changes(paths: list[str]) -> bool`, `git(...)`, and gate output contract.
- Produces: `relevant_main(sha: str, old_sha: str) -> bool`; Main push gate skips a proven irrelevant diff, otherwise returns the unchanged build output contract.

- [ ] **Step 1: Write failing gate regressions.** Use isolated real Git commits for documentation-only, source, browser-test-only, dependency and submodule-path diffs. Pin these expectations in `test_gallery_pages_gate.py`: docs after confirmed source baseline skip; relevant change builds; source change followed by docs still builds when the confirmed SHA predates the source change; missing published Main builds; missing baseline object builds; disabled publication builds; same confirmed SHA skips; invalid/non-Main pushes skip as before. Mock only the remote API/state boundary, not the actual changed-path predicate. Add path-policy cases for `test/gallery.e2e.ts`, `test/gallery-pages.e2e.ts`, and all `test/playwright.gallery*.config.ts` inputs.
- [ ] **Step 2: Run `python3 -m unittest discover -s test -p 'test_gallery_pages_gate.py'`.** Record expected failures on the currently unconditional Main build path.
- [ ] **Step 3: Implement the smallest Main gate change.** Validate push ref/SHA as currently. With publication enabled, read the confirmed Main baseline. Use a Git-object diff with disabled hooks and no recursive submodule fetching, similar to existing PR `relevant`. Build if no valid confirmed baseline can be read, or Git fetch/diff fails. Do not use `event.before`. Keep PR maintainer rerun override and authorization untouched. Extend path relevance only to the browser inputs specified above.
- [ ] **Step 4: Run the full policy and unit suites.** `python3 -m unittest discover -s test -p 'test_gallery_pages*.py'` and `pnpm test --exclude '**/.worktrees/**'` must pass. Document that Main may keep the previous confirmed Gallery on a documentation-only push and will retry unpublished relevant changes. Preserve README line endings.
- [ ] **Step 5: Self-review and signed commit.** Stage only this task's files. Commit message: `perf: skip Main Gallery builds with unchanged published inputs`.

### Task 3: Faster thumbnail capture with equivalent images

**Files:**
- Modify: `test/playwright.gallery-thumbnails.config.ts`
- Modify: `test/gallery-thumbnails.ts` only if measured explicit readiness safely replaces networkidle.
- Modify: `README.md` (thumbnail/cache/regression policy paragraphs)
- Create: `docs/superpowers/verification/2026-10-08-gallery-build-performance.md`

**Interfaces:**
- Consumes: existing production bundle at `/demo/pr/42/`, configure/rendered protocol, per-component/mode PNG paths and catalog metadata.
- Produces: `fullyParallel: true`, `workers: 2`, unchanged complete catalog/PNG outputs; measured serial/parallel timing and image equivalence report.

- [ ] **Step 1: Capture a serial baseline before editing.** Run `GALLERY_BASE_PATH=/demo/pr/42/ pnpm gallery:thumbnails` against the existing production bundle. Save all 96 PNGs and catalog JSON in this plan's ignored workspace, plus complete capture timing. No simultaneous heavy local jobs. If the bundle is absent/stale, compile it once with `GALLERY_BASE_PATH=/demo/pr/42/ node build-scripts/gallery.mjs build` before measuring.
- [ ] **Step 2: Create the readiness regression evidence before changing capture.** Exercise actual thumbnail capture with a delayed local font/icon asset and compare its decoded PNG pixels to the serial baseline. If replacing `networkidle`, demonstrate that removing readiness fails this check before implementing its replacement. Do not introduce a test that simply mirrors configuration values; retain the external comparison harness/results as evidence.
- [ ] **Step 3: Enable two independent capture workers.** Add `fullyParallel: true` and set `workers: 2`. Shorten `networkidle` only after the real rendered/font/asset readiness check proves all capture pixels unchanged. The task may retain networkidle if explicit readiness is not equivalently correct; explain the measured decision. Preserve all error detection, dialog and delayed monitor checks. No new dependency or fixed capture sleep.
- [ ] **Step 4: Measure and compare all outputs.** Run the same full `gallery:thumbnails` capture without concurrent heavy jobs. Require all 97 tests to pass, catalog equality, exactly 96 expected PNGs, and decoded pixel equality against serial capture. Investigate any difference before acceptance. Inspect representative component/dialog/view light/dark PNGs. Record baseline/optimized seconds and measured percentage, command/environment, image comparison and retained exclusions in the tracked verification report.
- [ ] **Step 5: Run complete production verification.** Run `GALLERY_BASE_PATH=/demo/pr/42/ pnpm gallery:build`, prefixed Pages tests, and `GALLERY_E2E_PRODUCTION=1 GALLERY_BASE_PATH=/demo/pr/42/ pnpm gallery:test --workers=2` (all 266 cases). Run full unit/policy suites, `pnpm gallery:lint`, `pnpm lint:types`, `pnpm lint:prettier`, and `KNX_BUILD_STATS=1 pnpm build`. Build/unpack the wheel with temporary `VERSION=0.0.0.dev0`, restoring VERSION in `finally`, then run `node build-scripts/check-gallery-exclusion.mjs build/checks/production.json <unpacked>`. Record any pre-existing warnings. Keep full browser coverage before publication.
- [ ] **Step 6: Self-review and signed commit.** Stage only this task's files. Commit message: `perf: capture Gallery thumbnails in parallel`.

## Final integration and measurement

The controller runs the task reviews, final whole-branch review, and any scoped fix
reviews. It verifies the committed tree and uses the existing session's fork-only
push/PR/Main testing authorization. Preserve the Gallery feature branch and primary
dirty checkout. Use a scoped integration branch in `philippwaller/knx-frontend`,
attach the created PR, wait for all required checks, merge only the exact reviewed
head, and verify Main publication. Record observed CI durations and compiler-cache
hits; do not attribute runner variance to this change as a guaranteed speedup.
If live validation reveals a concrete defect, route one scoped fix to an implementer
and review it. Do not create an upstream PR or extra test/comment spam.
