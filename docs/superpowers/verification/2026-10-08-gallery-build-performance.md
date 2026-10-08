# Gallery build performance verification — 2026-10-08

## Scope and environment

Thumbnail capture now uses `fullyParallel: true` and two workers. The capture test
body is unchanged. README documents parallel capture, retained readiness, compiler
cache policy and the complete publication regression requirement; its CRLF endings
are preserved. No dependencies or production component/example interfaces changed.

Measured in the existing `component-gallery` worktree on macOS 26.7.1 arm64,
MacBookPro18,2, 10 logical CPUs and 32 GiB RAM, using Node 24.21.0 from `.nvmrc`,
pnpm 11.28.0 and Playwright 1.63.0. The serial baseline and optimized capture used
exactly the same existing production bundle at `/demo/pr/42/`, with no simultaneous
heavy local project jobs. Desktop/system background processes remained present.

## Capture benchmark

Both measurements used `GALLERY_BASE_PATH=/demo/pr/42/ pnpm gallery:thumbnails`.
Elapsed time includes command startup and the managed static server.

| Configuration               | Checks    | Wall-clock seconds |
| --------------------------- | --------- | -----------------: |
| Original single worker      | 97 passed |             88.172 |
| Fully parallel, two workers | 97 passed |             48.129 |

Elapsed time fell by 40.043 seconds
(45.41%). This is one paired local
measurement, not a guaranteed hosted-runner improvement. No compiler cache change
was included in this capture comparison.

## Readiness and equivalence

Retained `networkidle`: this task changes worker scheduling only. The rendered
protocol acknowledgement, dialog visibility, screenshot font waiting, fixed
clock/locale/timezone, animation disabling, request/console failure checks and the
monitor's delayed static-image assertion remain unchanged. No capture sleep or
new readiness algorithm was added.

Before editing capture configuration, an external harness copied the real capture
body and delayed actual local `.woff`/`.woff2` and `static/mdi/*.json` requests by
1500 ms before continuing them. All 97 harness cases passed. Fourteen captures
requested MDI JSON, including views, related-entity labels and an information
dialog; all 96 resulting PNGs matched the baseline. Actual previews used platform
fonts and issued zero font-file requests, so this is delayed real-icon coverage,
not evidence of a delayed rendered webfont. Playwright's unchanged screenshot
font readiness remains in place. No artificial FontFace fixture or readiness
removal experiment was introduced because readiness was retained.

For serial, delayed, parallel and final rebuilt outputs: exactly the same 96 PNG
filenames exist, dimensions match, and every decoded RGBA pixel is identical.
The 48-entry `catalog.json` is byte-identical. The SHA-256 over sorted image names,
dimensions and decoded pixels is identical for all four output sets:
`fa2923c9f7b960d8398499c021df6d2b328e6bbf32a38b0cd158e9b9f7305fe9`.

Visually inspected light/dark `knx-dpt-option-selector`, `knx-dpt-select-dialog`
and `knx-project-view` images: component selection/text, opened dialog, view rows,
MDI icons and both themes render correctly.

## Complete production verification

| Check                                                   | Result                                                                           |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Serial capture, before configuration edits              | 97 passed; 96 PNGs and catalog retained                                          |
| Actual delayed local MDI capture                        | 97 passed; 96 decoded images and catalog identical                               |
| Two-worker capture                                      | 97 passed; 96 decoded images and catalog identical                               |
| `GALLERY_BASE_PATH=/demo/pr/42/ pnpm gallery:build`     | Passed, including all 97 thumbnail checks                                        |
| Prefixed Pages browser check                            | 1 passed                                                                         |
| Production `gallery:test --workers=2` at `/demo/pr/42/` | All 266 passed; no skipped cases                                                 |
| Complete `pnpm test --exclude '**/.worktrees/**'`       | All 58 files / 744 tests passed                                                  |
| Complete Python Gallery policy suite                    | All 83 passed                                                                    |
| `pnpm gallery:lint`                                     | Passed; Lit analyzer 0 problems in 92 files                                      |
| `pnpm lint:types`                                       | Passed, without file arguments                                                   |
| `pnpm lint:prettier`                                    | Passed                                                                           |
| `KNX_BUILD_STATS=1 pnpm build`                          | Both production targets built successfully                                       |
| Source distribution and wheel build                     | Passed with temporary `VERSION=0.0.0.dev0`; original bytes restored in `finally` |
| Unpacked-wheel exclusion                                | Passed: 2 production module graphs and 4862 wheel files checked                  |
| Rebuilt image comparison                                | All 96 decoded images and catalog still identical                                |

The first full unit invocation accidentally inherited `GALLERY_BASE_PATH` from the
production browser runner, causing the default-root build test to receive a
prefixed script URL. This was an orchestration mistake: no source change was
needed. The entire 744-test suite was rerun with `GALLERY_BASE_PATH` and
`GALLERY_E2E_PRODUCTION` removed and passed. Both logs are retained.

Production command environment for the Gallery build and browser tests:
`GALLERY_BASE_PATH=/demo/pr/42/`; the interactive suite additionally used
`GALLERY_E2E_PRODUCTION=1`. Pages check command:
`pnpm exec playwright test --config test/playwright.gallery-pages.config.ts`.
Policy command:
`python3 -m unittest discover -s test -p 'test_gallery_pages*.py'`.

Packaging reused an already-installed cached Python/build environment and the
project's existing setuptools build requirements, added no repository dependency,
built both sdist and wheel, extracted the resulting wheel, then ran:
`node build-scripts/check-gallery-exclusion.mjs build/checks/production.json <unpacked>`.
The real Gallery output remained present throughout the release build and check.

## Existing warnings and retained safeguards

- Unit tests report existing Vite native-config `__dirname`/tsconfig-path plugin
  advisories, an upstream dynamic-import-extension warning and Material dependency
  sourcemaps pointing to missing source files.
- Python policy tests retain the known HTTP-302 fixture cleanup `ResourceWarning`.
- Gallery/release builds report upstream unsafeHTML/unsafeCSS minification skips
  and a CSS pseudo-element-selector minification warning. Release Rspack reports
  asset-size advisories (one modern warning, two legacy warnings including entrypoint
  size); these unchanged bundles are not changed by capture scheduling.
- Playwright emits the existing `NO_COLOR`/`FORCE_COLOR` environment warning.
- Packaging reports that no previously included `*.py[cod]` files matched the
  existing exclusion rule.

No tests were skipped or reduced. Regular CI's merge-commit build does not replace
Gallery's gated-head release check; the actual Gallery-output exclusion proof is
retained. Cache misses still compile, the publisher remains cache-free, artifact
attempt identity and full successful-workflow publication guards remain intact,
and Main runs/publisher queue are not cancelled by PR concurrency.

## Complete image result inventory

Every row below passed light and dark pixel equality for delayed, parallel and
rebuilt capture against the serial baseline.

| Catalog ID                               | Light pixels | Dark pixels | Size (each mode) |
| ---------------------------------------- | ------------ | ----------- | ---------------- |
| `knx-group-monitor`                      | identical    | identical   | 1280 × 717       |
| `knx-dashboard`                          | identical    | identical   | 1280 × 717       |
| `knx-dpt-reference`                      | identical    | identical   | 1280 × 717       |
| `knx-create-entity`                      | identical    | identical   | 1280 × 717       |
| `knx-entities-view`                      | identical    | identical   | 1280 × 717       |
| `knx-error`                              | identical    | identical   | 1280 × 717       |
| `knx-create-expose`                      | identical    | identical   | 1280 × 717       |
| `knx-expose-view`                        | identical    | identical   | 1280 × 717       |
| `knx-info`                               | identical    | identical   | 1280 × 717       |
| `knx-project-view`                       | identical    | identical   | 1280 × 717       |
| `knx-frontend`                           | identical    | identical   | 1280 × 717       |
| `knx-separator`                          | identical    | identical   | 400 × 224        |
| `flex-content-expansion-panel`           | identical    | identical   | 400 × 224        |
| `knx-sticky-expansion-panel`             | identical    | identical   | 400 × 224        |
| `knx-tabs-subpage-data`                  | identical    | identical   | 400 × 224        |
| `knx-tabs-subpage-data-filter-pane`      | identical    | identical   | 400 × 224        |
| `knx-tabs-subpage-data-toolbar`          | identical    | identical   | 400 × 224        |
| `knx-expose-template-preview`            | identical    | identical   | 400 × 224        |
| `knx-project-device-tree`                | identical    | identical   | 400 × 224        |
| `knx-project-tree-view`                  | identical    | identical   | 400 × 224        |
| `knx-project-devices-view`               | identical    | identical   | 400 × 224        |
| `knx-form`                               | identical    | identical   | 400 × 224        |
| `knx-selector-row`                       | identical    | identical   | 400 × 224        |
| `knx-sync-state-selector-row`            | identical    | identical   | 400 × 224        |
| `knx-single-address-selector`            | identical    | identical   | 400 × 224        |
| `knx-group-address-selector`             | identical    | identical   | 400 × 224        |
| `knx-dpt-option-selector`                | identical    | identical   | 400 × 224        |
| `knx-dpt-dialog-selector`                | identical    | identical   | 400 × 224        |
| `knx-payload-selector`                   | identical    | identical   | 400 × 224        |
| `knx-select-options-list`                | identical    | identical   | 400 × 224        |
| `knx-device-picker`                      | identical    | identical   | 400 × 224        |
| `knx-configure-entity`                   | identical    | identical   | 400 × 224        |
| `knx-table-cell`                         | identical    | identical   | 400 × 224        |
| `knx-table-cell-filterable`              | identical    | identical   | 400 × 224        |
| `knx-data-table-ga-label`                | identical    | identical   | 400 × 224        |
| `knx-data-table-related-label`           | identical    | identical   | 400 × 224        |
| `knx-list-filter`                        | identical    | identical   | 400 × 224        |
| `knx-time-delta-filter`                  | identical    | identical   | 400 × 224        |
| `knx-time-range-filter`                  | identical    | identical   | 400 × 224        |
| `knx-sort-menu`                          | identical    | identical   | 400 × 224        |
| `knx-sort-menu-item`                     | identical    | identical   | 400 × 224        |
| `knx-device-create-dialog`               | identical    | identical   | 800 × 448        |
| `knx-dpt-select-dialog`                  | identical    | identical   | 800 × 448        |
| `knx-ga-select-dialog`                   | identical    | identical   | 800 × 448        |
| `knx-project-upload-dialog`              | identical    | identical   | 800 × 448        |
| `knx-send-dialog`                        | identical    | identical   | 800 × 448        |
| `knx-time-server-dialog`                 | identical    | identical   | 800 × 448        |
| `knx-group-monitor-telegram-info-dialog` | identical    | identical   | 800 × 448        |

## Evidence and delivery status

Complete local logs, timing JSON, external harness, asset request inventory,
comparison results and all serial/delayed/parallel PNGs are retained in the ignored
`.superpowers/sdd/2026-10-08-gallery-build-performance/task-3-evidence/` workspace.
The full implementer report is `task-3-report.md` beside that directory.

Implementation and local production verification are complete. Nothing was staged
or committed by this task; signed delivery remains controller-owned while signing
is unresolved. No branch, push, PR, merge, publication or subagent actions were taken.
