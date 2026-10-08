# Gallery build performance

## Intent and scope

Reduce the time and redundant work in Gallery CI while retaining the complete
browser regression suite and the current publishing safeguards. The user approved
the proposed optimizations and explicitly requested an uninterrupted specification,
plan, and subagent-driven implementation. Intermediate specification/plan approval
prompts are therefore omitted; both documents remain reviewable in Git.

Work only in the existing `component-gallery` worktree. Preserve unrelated
checkouts, the pinned Home Assistant submodule, Gallery UI behavior, native
maintainer reruns, and publication authorization. No new dependencies.

## Measured baseline

Main workflow run `37787505576` completed in 552 seconds. Gallery compilation,
thumbnails and setup took 231 seconds; the parallel release/wheel job took 304
seconds; the browser shards took 270 and 228 seconds. The release job was the
critical path after Gallery compilation. The preceding PR run took 618 seconds.
These are observations of individual hosted runners, not a promised speedup.

Thumbnail generation currently captures 96 PNGs and one catalog with a single
worker. Every capture waits for `networkidle`. Playwright also runs the separate
266-test interactive suite in two shards with two workers each.

## Selected approach

Use native Actions caching and concurrency, extend the existing input relevance
gate to Main, and improve thumbnail capture only with measured image equivalence.
Do not reduce interactive test coverage or add a cross-workflow orchestration layer.

Alternatives considered: smoke-only browser checks would remove useful regression
coverage without eliminating the current critical path; cross-workflow reuse of
the regular CI release would require reconciling its PR merge SHA with the Gallery
head SHA and its artifact provenance. Neither is selected.

## Compiler cache

The Gallery build and release-check jobs use explicit Babel directories under
`runner.temp`, outside the immutable dependency cache. Restore a dedicated
role-specific Gallery cache, with a compatible regular-CI Babel cache as a fallback.
Keys include runner OS, `.nvmrc`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, job role,
and the exact gated SHA. Save only successful push-to-Main jobs. PR jobs restore
but never explicitly save these compiler caches. Cache hits remain an optimization;
an absent cache must compile normally.

Prune entries older than 30 days before a Main save. Pin newly added external
Actions to verified commit SHAs. The privileged publisher never restores caches
or executes PR code.

## Superseded PR runs

Add workflow-level concurrency keyed by workflow and PR number. Cancel an older
Gallery validation run when a new run for the same PR starts. Use a unique run ID
for non-PR events, so pushes to Main cannot cancel each other. Do not change the
publisher's `gallery-pages` queue or cancellation behavior.

Keep artifact names tied to both run ID and run attempt. A cancelled or failed
validation run cannot authorize publication. Native maintainer reruns still approve
only the exact current PR head and attempt.

## Main relevance gate

When publishing is enabled, compare the push's exact Main SHA with the Main SHA
in the **confirmed published snapshot**, using Git objects and the existing
`has_gallery_changes` policy. Skip only when a confirmed baseline exists and the
entire diff contains no relevant inputs. Comparing only `event.before` could miss
an earlier failed UI deployment and is not permitted.

Build on first publication, disabled publishing, missing/unavailable baseline,
unavailable Git objects or diff errors. A rerun of an unpublished relevant Main SHA
must still build. Existing PR permission checks and the explicit maintainer rerun
override remain intact.

Include interactive browser test files and Playwright configurations in relevant
inputs, as well as existing source, examples, build scripts, dependencies and the
pinned submodule. A test-only regression repair must be validated. Documentation
alone may skip; a publishing-template change under `build-scripts/` remains relevant
because it can affect the catalog/deployment contract.

## Thumbnail performance and correctness

Enable `fullyParallel` and two workers for the isolated capture tests. Each PNG
has a unique component/mode filename; only one test writes catalog metadata.
Keep fixed clock, locale, timezone, reduced motion, protocol validation, dialog
visibility checks, console/backend failure detection, and the monitor's delayed
static-image assertion.

Replace `networkidle` only if explicit readiness produces the same decoded image
pixels for every capture, including delayed local fonts/icons/assets. Start from
the existing rendered acknowledgement and browser font readiness; include any
additional actual asset readiness discovered by the comparison. Do not add fixed
sleep delays or a general-purpose asset loader. If readiness cannot be shortened
without changing thumbnails, retain the original wait and document that outcome.

Measure serial baseline and optimized capture against the same production bundle
and base path, without concurrent heavy local jobs. Save timing and complete image
comparison results to a reviewable verification report. Inspect representative
component, dialog and view images visually.

## Release build investigation

Regular CI and Gallery both build the product/wheel. They are not interchangeable:
regular PR CI checks the merge commit, whereas Gallery validates the gated PR head,
and Gallery intentionally builds/packages with the real Gallery output present.
Retain both until there is a simple same-SHA design that preserves that exclusion
proof. Document this investigation rather than remove or weaken the guard. The
explicit compiler cache is the selected optimization of the release critical path.

## Acceptance and delivery

- Complete unit and publishing-policy suites pass, including meaningful new gate
  regressions and workflow trust/concurrency/cache invariants.
- Gallery builds at `/demo/pr/42/`; all 97 thumbnail checks and all 266 interactive
  browser tests pass against the resulting production bundle.
- Pages prefix checks, lint/types, regular release build and unpacked-wheel
  Gallery exclusion pass.
- Capture timing and pixel comparison show the actual result, with no unsupported
  promise about hosted CI speed. Existing unrelated tool warnings are disclosed.
- Fresh task reviews and a whole-branch review approve the changes. Commit only
  scoped files with signing enabled. Preserve the reusable Gallery worktree.
- Existing session authorization permits integration/testing only in
  `philippwaller/knx-frontend`; do not create or merge an upstream XKNX PR.

## Documentation

Update the README's Main rebuild behavior, thumbnail parallelism, compiler cache
and regression policy. Keep its existing CRLF line endings. Retain the Gallery
authoring skill as part of the implementation contract; no example interfaces or
skill guidance need changing unless the actual capture contract changes.
