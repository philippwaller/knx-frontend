# Gallery Multi-Device Canvas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show several interactive device previews, mirror them in Light/Dark Compare, and navigate their fixed board with shared zoom and panning, without new dependencies.

**Architecture:** Extend the existing gallery shell from two role-specific records to runtime records for each device/role. Render stable iframe instances in a CSS grid and scale the whole grid inside a native scroll surface. A small gallery-only navigation module owns zoom calculations and document-bound pan gestures; existing preview synchronization, fixtures and alignment guides remain authoritative.

**Tech Stack:** Existing TypeScript, Lit, Home Assistant controls, CSS grid/transforms, Pointer Events, ResizeObserver, native scrolling, Vitest and Playwright. Node 24.19.0 from `.nvmrc`; existing Yarn 4.18.0.

**Spec:** [Approved gallery multi-device canvas design](../specs/2026-09-29-gallery-multi-device-canvas-design.md).

## Global Constraints

- Worktree: `/Users/PWALLER/Development/Privat/home-assistant-dev/knx-frontend/.worktrees/component-gallery`; current branch `feat/gallery`. Recheck its state before execution; do not switch branches, stash or absorb unrelated work.
- No new dependencies are permitted for this feature.
- The in-app PNG export is explicitly deferred at the user's request.
- Initial selection remains Phone, with a 390px CSS viewport.
- Presets remain Phone 390, Large phone 430, Tablet 768, Landscape tablet 1024 and Desktop 1280, in that order.
- At least one device is selected. A valid custom width replaces the selection with one custom preview; invalid drafts preserve the last valid view.
- Compare has Light in the upper row and Dark in the lower row; columns do not wrap.
- Normal unscaled iframe height retains the existing 240px minimum and stage-based sizing. Auto height is independent per preview.
- Manual zoom uses 10 percentage-point steps between 10% and 200%. Fit considers the entire board, never exceeds 100%, and may go below 10%.
- Preserve origin/source/session validation, supported interaction state, originating-only actions, and the current revision rules.
- Localize new UI text in the existing gallery English strings. Keep product components, backend, submodule, dependency/lockfiles and release pipelines untouched.
- Use the existing test infrastructure. Check project types without supplying file arguments. Preserve configured Git signing; never disable it to obtain a commit.

## Review Focus

1. Late or removed iframe messages: a newly mounted pane cannot replace current edits, and removed panes cannot contribute messages or host actions. Tests belong to Task 1.
2. Removing the first primary pane: state and the shared usage-code panel transfer to a retained primary without resetting it. Tests belong to Task 1.
3. Zero-size/hidden stages and very wide custom widths: Fit stays finite, resumes on reveal, and does not impose its minimum manual zoom. Tests belong to Task 2.
4. Pointer capture crossing iframe boundaries: panning uses parent CSS-pixel coordinates at the current scale and ends cleanly on blur, cancellation or document removal. Tests belong to Task 3.
5. Space in focused controls and alignment inspection: normal activation/editing remains intact, inspection wins inside iframes, and no pan gesture emits product actions. Tests belong to Task 3.

## File Map

- Modify `gallery/src/gallery.ts`: selection, per-pane runtime, configuration/state routing, fixed-board rendering and the shared navigation UI.
- Modify `gallery/src/styles.ts`: fixed columns/rows, scaled scroll extent, reachable navigation controls and pan cursors.
- Create `gallery/src/canvas-navigation.ts`: two pure zoom calculations plus one concrete native-scroll gesture controller. No framework, generic adapter or new UI component.
- Create `gallery/src/canvas-navigation.test.ts`: finite Fit and manual zoom boundaries using existing Vitest.
- Modify `gallery/src/localize/en.json`: device-selection hints/summary and shared zoom/pan labels.
- Modify `test/gallery.e2e.ts`: reuse its checked-page fixture; add multi-device and canvas regressions, adapt assertions for intentionally replaced controls.
- Modify `README.md`: document the resulting gallery workflow.
- Expected unchanged: `preview.ts`, `preview-state.ts`, `protocol.ts`, `sync-bindings.ts`, `alignment-guides.ts`. Change one only if a failing regression demonstrates a necessary gallery integration fix; preserve the wire contract and binding scope.

## Execution and Commands

Run from the worktree above. Prefix every Node/Yarn command with
`PATH=/Users/PWALLER/.nvm/versions/node/v24.19.0/bin:$PATH` or set this PATH once in
the execution shell. Verify `node --version` is `v24.19.0` first. Keep any existing
gallery server/process intact; Playwright's configured port 8092 is its own server.
Read root `./dev status --format json` before runtime actions; do not start/restart
the workspace or run `./dev update` for this gallery-only feature.

Read the local KNX and pinned Home Assistant agent instructions and relevant
frontend event/Lit/styling/testing skills before implementation. Record the initial
`yarn lint:types` result so existing upstream diagnostics are not confused with this
change. Run a meaningful failing check before each implementation step; final
product verification happens after all three tasks.

---

### Task 1: Device selection and multiple live preview sessions

**Files:** Modify `gallery/src/gallery.ts` (current fields/lifecycle at lines 109–238, reset/configuration/messages at 336–495, preview rendering at 618–697, width/selection handlers at 738–754 and 920–931, toolbar at 1248–1283), `gallery/src/styles.ts`, `gallery/src/localize/en.json`, and `test/gallery.e2e.ts`.

**Interfaces:**

- Define local `PreviewDevice = { id: (typeof devices)[number]["id"] | "custom"; width: number }` and `PreviewPane = { frame?: HTMLIFrameElement; ready: boolean; status: string; error: string; height?: number; code: string }`.
- Shell fields: reactive `_selectedDevices: PreviewDevice[]`, initially Phone; runtime `_panes: Map<string, PreviewPane>`; retain one `_sessionId`, `_previewState`, `_writer`, `_revisions`, `_overrides` and `_enabledSlots`.
- Shell methods: `_paneKey(deviceId: PreviewDevice["id"], comparison: boolean): string`, `_selectDevice(width: number, toggle: boolean): void`, `_syncPanes(): void`, `_renderPreview(device: PreviewDevice, comparison: boolean): TemplateResult`.
- Preserve `data-pane="primary" | "comparison"`; add `data-device` with the preset/custom id and a stable `data-preview-key` to each iframe/card. Later tasks consume these identities and `_iframes`.
- Per-pane caches include latest usage code so changing the first selected primary can select its cached code without reconfiguring it.

- [ ] **Step 1: Add failing multi-device browser checks to the existing fixture.**

  First add the following regression (reuse the file's existing `test` and `expect`):

  ```ts
  test("multi-device selection keeps canonical widths and the final device", async ({ page }) => {
    await page.setViewportSize({ width: 2160, height: 1000 });
    await page.goto("./?component=knx-single-address-selector&scenario=default");
    await page.getByRole("button", { name: /^Desktop · 1280/ }).click({ modifiers: ["Meta"] });
    await page.getByRole("button", { name: /^Tablet · 768/ }).click({ modifiers: ["Meta"] });
    await expect(page.locator("iframe")).toHaveCount(3);
    await expect
      .poll(() =>
        page
          .locator("iframe")
          .evaluateAll((frames) =>
            frames.map((frame) => (frame as HTMLIFrameElement).contentWindow!.innerWidth),
          ),
      )
      .toEqual([390, 768, 1280]);
    await page.getByRole("button", { name: /^Tablet · 768/ }).click();
    await expect(page.locator("iframe")).toHaveCount(1);
    await page.getByRole("button", { name: /^Tablet · 768/ }).click({ modifiers: ["Meta"] });
    await expect(page.locator("iframe")).toHaveCount(1);
  });
  ```

  Add named checks `multi-device late joins preserve inputs and removed sources are ignored`,
  `multi-device compare shares six panes and transfers primary code`, and
  `multi-device menu supports keyboard and touch selection`. Assert: three/six
  panes; primary iframe identity retained when adding devices/Compare; an edited
  `knx-single-address-selector input` reaches newly mounted peers and survives
  removal of Phone; stale source/session messages leave state/log unchanged;
  one Lit-usage panel remains populated after first-primary removal; menu items
  expose checked state, remain open and cannot uncheck the last device. Exercise
  both Meta and Ctrl membership handling, canonical order and a valid 820px custom
  width followed by an invalid draft. For cross-width filter/dialog state, reuse
  `knx-tabs-subpage-data` and `knx-send-dialog` scenarios already covered below.

- [ ] **Step 2: Run the new checks and observe the missing multi-device behavior.**

  Run: `yarn gallery:test --workers=1 --grep 'multi-device'`.
  Expected: FAIL because modifier selection still produces one iframe.

- [ ] **Step 3: Implement the local interfaces and extend the existing shell.**

  Preserve the presets; derive selected/pressed state and trigger summary from
  `_selectedDevices`. Preset MouseEvents use `metaKey || ctrlKey`; the menu uses
  existing `ha-dropdown-item type="checkbox"` and `.checked`. Its `wa-select`
  handler calls `preventDefault()` to keep the menu open, toggles the selection,
  and explicitly restores the item's checked property on a rejected final removal.
  Ordinary preset clicks and valid custom-width commits replace selection.
  Toggling a preset from a custom selection starts a preset-only selection;
  custom widths never join a multi-preset board. Sort selected presets by their
  existing catalog order, not insertion order.
  Keep the width editor numeric using the first selected device's width; editing
  it deliberately exits multi-selection. Add a localized hint and summary.

  Use Lit `repeat` with device/role keys inside the scenario's existing `keyed`
  boundary; do not nest separate positional lists that replace retained frames.
  `_syncPanes()` reconciles actual mounted frames with the selected manifest and
  prunes observers, guides, revisions and writer references for removed frames.
  Runtime record updates call `requestUpdate()`; do not duplicate readiness or
  status in global primary/comparison booleans. Make host-event readiness depend
  on any ready live pane and validate source against both the manifest and frame.

  Update `_configure`, `_message`, reset, theme/Compare and auto-height routing to
  use records. Baseline state is accepted only from the first primary when no
  authoritative state exists. Every rendered joiner gets the latest state; initial
  captures never overwrite it. Preserve current writer/revision arbitration and
  originating-only fixture actions. Maintain per-pane height/error/code, display
  errors locally, and prefix multi-preview logs with device and theme. Retain the
  current single-preview log format where there is no ambiguity.

  Use per-card width variables under the existing canvas layout for this task;
  the common board replaces that layout in Task 2. Adapt existing device tests
  that equate changing device identity with preserving the same DOM iframe:
  the scenario session and supported state persist, while only retained device
  identities must preserve iframe elements. Do not weaken Compare/theme/input,
  stale-realm, auto-height or no-echo assertions.

- [ ] **Step 4: Verify selection/lifecycle and existing synchronization.**

  Run: `yarn gallery:test --workers=1 --grep 'multi-device|compare mirrors|compare converges|rapid typing|auto height|device presets|replaced iframe realms|late messages'`.
  Run: `yarn test gallery/src/preview-state.test.ts gallery/src/protocol.test.ts`.
  Expected: zero failing cases and no checked-page console/network failures.

- [ ] **Step 5: Commit only the Task 1 files.**

  ```bash
  git add -- gallery/src/gallery.ts gallery/src/styles.ts gallery/src/localize/en.json test/gallery.e2e.ts
  git commit -m "feat(gallery): support multiple synchronized device previews"
  ```

### Task 2: Fixed board and shared zoom

**Files:** Create `gallery/src/canvas-navigation.ts` and `gallery/src/canvas-navigation.test.ts`; modify `gallery/src/gallery.ts`, `gallery/src/styles.ts`, `gallery/src/localize/en.json`, and `test/gallery.e2e.ts` (including old per-card zoom and touch-toolbar assertions at current lines 3070–3082 and 3138–3187).

**Interfaces:**

- Consume Task 1's `_selectedDevices`, pane identities/runtime and `_renderPreview`.
- Export `CanvasSize = { width: number; height: number }`, `fitScale(available: CanvasSize, board: CanvasSize, previous: number): number`, and `stepScale(current: number, direction: -1 | 1): number` from `canvas-navigation.ts`.
- Shell methods: `_fitCanvas(): void`, `_actualCanvas(): void`, `_stepCanvasZoom(direction: -1 | 1): void`, `_renderCanvasNavigation(): TemplateResult`.
- Shell state: `_zoomMode: "fit" | "manual"`, `_manualScale = 1`, positive stage/board sizes retained across hidden layouts. Navigation controller in Task 3 consumes the native `.canvas` surface and current `.canvas-board` scale.

- [ ] **Step 1: Add failing calculation and layout checks.**

  Unit-test the exported calculations with exact assertions:

  ```ts
  expect(fitScale({ width: 800, height: 500 }, { width: 2000, height: 2000 }, 1)).toBe(0.25);
  expect(fitScale({ width: 800, height: 500 }, { width: 200, height: 100 }, 0.5)).toBe(1);
  expect(fitScale({ width: 0, height: 500 }, { width: 200, height: 100 }, 0.5)).toBe(0.5);
  expect(fitScale({ width: 200, height: 200 }, { width: 10000, height: 100 }, 1)).toBe(0.02);
  expect(stepScale(1, 1)).toBe(1.1);
  expect(stepScale(1.1, -1)).toBe(1);
  expect(stepScale(0.04, -1)).toBe(0.1);
  expect(stepScale(2, 1)).toBe(2);
  ```

  Cover non-finite dimensions and non-positive board sizes by returning the prior
  valid Fit scale. Add browser tests `canvas board aligns six panes without changing
viewport geometry` and `canvas zoom preserves center and hidden-stage geometry`.
  At 2160×1000 and 390×844, assert canonical columns, vertically aligned Light/Dark
  counterparts and all board bounds inside the padded surface in Fit. Check actual
  iframe `innerWidth` values `[390, 768, 1280]` at Fit, 100% and 200%, and unchanged
  retained iframe sources/inputs. At manual zoom, resize panels and switch
  Preview/Code/Split; returning to Preview keeps a finite scale and edited state.
  Reproduce a 10000px custom width to verify Fit below 10%. Under auto height,
  changing separator height moves the Dark row below the tallest Light card;
  opening a dialog restores normal height without affecting other pane widths.

- [ ] **Step 2: Run both new calculation/layout checks before implementation.**

  Run: `yarn test gallery/src/canvas-navigation.test.ts`.
  Run: `yarn gallery:test --workers=1 --grep 'canvas board|canvas zoom'`.
  Expected: FAIL for missing exports/shared board navigation.

- [ ] **Step 3: Implement the calculations and the shared board.**

  Fit is `min(1, available.width / board.width, available.height / board.height)`
  after validation; `available` already excludes the 24px margin on each side.
  `stepScale` adds/subtracts 0.1, rounds away floating-point noise and clamps to
  `[0.1, 2]`. Keep board-size measurement independent of its CSS transform.

  Give `.canvas` native overflow, `tabindex="0"`, a localized accessible label and
  no intrinsic board-driven stage sizing. A `.canvas-scroll-content` sizer has
  extent `max(surface size, scaled board size + 48px)` on each axis. Its absolutely
  positioned `.canvas-board` has the unscaled CSS grid width and `transform-origin:
top left`; center small boards and use a 24px inset on overflowing axes. Grid
  columns are the selected viewport widths plus card borders, with 24px gaps.
  Flatten render order as all primaries followed by all counterparts so grid rows
  align while keyed identities remain stable. Remove per-iframe scaling and
  per-card zoom menus. Measure actual card/board geometry rather than guessing
  caption heights. The stage-based iframe height uses the retained unscaled
  stage size and existing `max(240, stageHeight - 116)` sizing constant.

  Apply Fit when positive stage/board geometry changes. Manual zoom preserves the
  logical board point at the visible surface center: measure the old board origin
  and scale, update scale, then scroll to that point using the new origin/scale.
  Let native scrolling clamp impossible offsets. Fit and 100% recenter. Reject
  zero/non-finite observer measurements instead of treating hidden stages as a
  resize. Keep manual scale through stage resizing.

  Render one separate, unscaled canvas navigation strip so it does not crowd the
  existing four-control narrow toolbar. Use installed HA buttons/icons for −,
  percentage, +, `Fit all` and `100%`; percentage is text/status, not another menu.
  Keep touch targets at least 44px and the strip reachable with hidden panels.
  Stack Split code below the board when Compare or multiple devices are selected.
  Existing single-device wide Split keeps its current two-column option.

- [ ] **Step 4: Verify board/zoom and update obsolete UI expectations.**

  Run: `yarn test gallery/src/canvas-navigation.test.ts`.
  Run: `yarn gallery:test --workers=1 --grep 'canvas board|canvas zoom|canvas captions|fit zoom|code split|touch toolbar|canvas toolbar'`.
  Expected: all checks pass. Rewrite the old per-card Fit dropdown regression to
  assert one shared Fit/100% control and both-axis fitting; preserve its real
  viewport, retained session, mirrored state and no local overflow assertions.
  Touch checks still protect the original toolbar and now also the new strip.

- [ ] **Step 5: Commit only the Task 2 files.**

  ```bash
  git add -- gallery/src/canvas-navigation.ts gallery/src/canvas-navigation.test.ts gallery/src/gallery.ts gallery/src/styles.ts gallery/src/localize/en.json test/gallery.e2e.ts
  git commit -m "feat(gallery): add a fixed device board with shared zoom"
  ```

### Task 3: Native panning, integration QA and documentation

**Files:** Modify `gallery/src/canvas-navigation.ts`, `gallery/src/gallery.ts`, `gallery/src/styles.ts`, `gallery/src/localize/en.json`, `test/gallery.e2e.ts`, and `README.md`.

**Interfaces:**

- Export `class CanvasNavigation` with `constructor(surface: HTMLElement, iframePanningEnabled: () => boolean)`, `syncFrames(frames: readonly HTMLIFrameElement[]): void`, `cancel(): void`, and `dispose(): void`.
- It controls native surface scroll offsets and gesture listeners only; the shell
  retains rendering/zoom/selection state. `iframePanningEnabled` returns false
  during alignment inspection and Code-only presentation. Call `syncFrames` from
  shell updates and iframe readiness; call `cancel` when changing inspection/view
  mode and `dispose` on surface replacement/disconnect.
- Temporary surface attributes `data-pan-ready` and `data-panning` control cursors.
  No preview-state message or product callback is introduced for navigation.

- [ ] **Step 1: Add failing panning and interference regressions.**

  Add browser tests `canvas panning crosses iframe edges and cancels cleanly` and
  `canvas panning preserves focused controls and alignment actions`. Use the
  three-device Compare board at 100% so it overflows. A 100px background drag changes
  native scroll by approximately 100px; Space-drag inside a non-actionable part of
  an iframe works at 50%, 100% and 200% using parent CSS-pixel distances. Use a
  1280×900 stage and scroll offsets away from clamped edges for those scaled drag
  checks, so the board still overflows horizontally even at 50%. Crossing
  an iframe edge must continue the drag. Assert unchanged iframe widths, sources,
  inputs and event-log action count. Check Escape, Space release, blur,
  `pointercancel`, lost capture and removing the source pane; no stale panning
  attribute/suppression remains and a following real component action succeeds.

  Focus a `knx-single-address-selector input` and verify Space/input is not
  intercepted. Focus a button and verify Space activation still works. During
  alignment, click to pin inside the iframe, then zoom/scroll and verify the guide
  still follows its element; iframe Space gestures cannot pan or activate product
  actions while inspection owns them. Native scrolling over a long component
  changes its internal scroll position, while scrolling on background changes
  only the canvas. Repeat selection/navigation reachability at 320px with touch.

  Add `multi-device pane failure leaves healthy peers usable`: emit a validated
  gallery error message from one real pane (avoid artificial console errors that
  the checked-page fixture correctly rejects), assert its local alert/log entry,
  then edit another healthy pane and verify other healthy peers still converge.
  Reset must remove the pane error and recreate the scenario sessions while
  preserving device selection and zoom choice.

- [ ] **Step 2: Run the new checks and observe missing gesture handling.**

  Run: `yarn gallery:test --workers=1 --grep 'canvas panning|multi-device pane failure'`.
  Expected: FAIL on missing pan behavior before adding the controller.

- [ ] **Step 3: Implement the concrete navigation controller and lifecycle hooks.**

  Attach capture-phase listeners to the shell document and each live iframe
  document, ahead of component/PreviewSync handling. Bind each document once and
  detach it when a frame is removed, navigates or disconnects. For cross-realm
  targets, inspect node type/localName and composed paths rather than relying on
  parent-window `instanceof HTMLElement`. Ignore editable/contenteditable and
  actionable focus before claiming Space. Background primary-button drags need
  no modifier; iframe drags require Space and the enabled callback. Leave touch
  gestures to native scrolling rather than adding custom inertia or pinch zoom.

  Convert iframe pointer coordinates to parent CSS pixels using its current rect
  and actual scale. Capture the pointer in its originating document, translate
  deltas into native `scrollLeft`/`scrollTop`, and use capture listeners so canceled
  gestures never reach product handlers or `PreviewSync`. Suppress only the click
  generated by that claimed sequence, not a later independent user click.
  Release capture and temporary cursor/Space state on all cancellation paths.
  Account for iframe focus transfer separately from loss of the browser window:
  crossing into an owned document must not inadvertently cancel a valid gesture.
  Keep keyboard/native scrolling available on the focusable surface.

  Integrate with `_syncGuides` and disconnect/update hooks; inspection takes
  precedence within frames. Keep its overlay geometry callback based on actual
  frame rect / unscaled client width, which now includes board scale. Place the
  shared navigation strip separately from the floating alignment bar. Add the
  localized concise panning hint. Update README device selection, custom width,
  fixed Compare rows, Fit/100%, manual zoom, keyboard/menu/touch access and state
  preservation; remove obsolete wrapping/per-card zoom descriptions. Document no
  in-app screenshot export and do not add a new capture helper.

- [ ] **Step 4: Run final checks and inspect the resulting UI.**

  Run: `yarn test gallery/src`.
  Run: `yarn gallery:lint`.
  Run: `yarn lint:types`.
  Run: `yarn gallery:test --workers=2`.
  Run: `GALLERY_BASE_PATH=/demo/ yarn gallery:build`.
  Run: `GALLERY_E2E_PRODUCTION=1 GALLERY_BASE_PATH=/demo/ yarn gallery:test --workers=2 --grep 'multi-device|canvas board|canvas zoom|canvas panning'`.
  Expected: zero new unit/browser/lint/type failures. Investigate genuine failures;
  preserve and report any demonstrated pre-existing type issue without weakening
  checks or editing unrelated upstream code. Existing all-gallery browser coverage
  includes synchronization, dialogs, stale realms, responsiveness and code modes.
  The optimized-build pass specifically verifies new behavior below a Pages-style
  base path; it does not repeat the entire development browser suite.

  Generate QA images with the existing Playwright `page.screenshot` workflow under
  its ignored output directory. Visually inspect 2160×1000, 1280×900, 390×844 and
  touch 320×740; three devices/six panes; application Light/Dark; Fit and 100%;
  hidden panels; stacked Split; auto height/open dialogs; alignment during zoom.
  Confirm no page-wide horizontal overflow, reachable native canvas overflow,
  no overlay/navigation collisions and at least 44px touch controls. Save a
  six-pane overview screenshot with the existing test runner for review; this is
  a QA artifact, not an in-app export feature.

  Finish with `git diff --check` and inspect changed paths. Neither `package.json`
  nor `yarn.lock`, backend, submodule or pipeline files may change. Re-run only
  checks affected by any subsequent repair. Request one whole-change review before
  delivery, using the execution method selected after this plan review.

- [ ] **Step 5: Commit the verified Task 3 changes and report results.**

  ```bash
  git add -- gallery/src/canvas-navigation.ts gallery/src/gallery.ts gallery/src/styles.ts gallery/src/localize/en.json test/gallery.e2e.ts README.md
  git commit -m "feat(gallery): support native canvas panning"
  ```

  Report implemented behavior, actual checks/visual evidence and any remaining
  limitation. Do not push, publish or open a PR without explicit authorization.

## Handoff

Execution recommendation: **Native**, because all three tasks sequentially modify
the same gallery session/geometry flow, and the existing browser suite supplies
the main regression protection. The same agent implements the tasks here, followed
by one independent whole-change review. Subagent-driven execution remains an option
if the user prefers independent implementation/review gates per task.

Implementation starts only after the user reviews this written plan and selects
the execution method. No implementation or test execution is claimed by this plan.
