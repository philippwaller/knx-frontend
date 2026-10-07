# Gallery multi-device canvas

Date: 2026-09-29
Status: Approved, implemented and verified locally.

## Purpose and agreed scope

The KNX Frontend Gallery should show the same component and scenario at several
device widths simultaneously. The main use is reviewing responsive UI changes and
preparing clear images for GitHub pull requests. Phone, tablet and desktop together
produce three previews, or six previews in Light/Dark Compare.

The user approved a fixed arrangement of devices with a shared zoom and movable
view. Moving the view never changes device positions or viewport widths.
No new dependencies are permitted for this feature. The in-app PNG export is
explicitly deferred at the user's request. Existing Playwright screenshot tooling
remains available; this change adds neither an export button nor a capture service.

## Existing implementation and ownership

Work in the existing `knx-frontend/.worktrees/component-gallery` checkout. The
gallery is a standalone, offline application that renders real product components
with fixtures. Product components, the Home Assistant submodule, backend APIs,
thumbnail generation and Pages publication do not need changes.

`gallery/src/gallery.ts` currently owns a single width, two preview roles,
scenario configuration, synchronization, status and sizing. `gallery/src/styles.ts`
owns the canvas and its responsive toolbar. Each preview is a same-origin iframe
running `gallery/src/preview.ts`; the existing message protocol and `PreviewSync`
carry configuration and supported interactive state. Alignment inspection already
tracks individual iframe documents. The gallery has browser regressions in
`test/gallery.e2e.ts` and local English UI strings in `gallery/src/localize/en.json`.

Extend these existing flows. Use the installed Home Assistant controls, CSS,
Pointer Events, ResizeObserver and native scrolling rather than adding a canvas or
gesture library.

## Device selection

- Initial selection remains Phone, with a 390px CSS viewport.
- Keep all five current presets: Phone 390, Large phone 430, Tablet 768,
  Landscape tablet 1024 and Desktop 1280.
- An ordinary preset click replaces the selection with that device.
- Command-click on macOS or Ctrl-click toggles membership. Removing the final
  selected device is a no-op; an empty canvas is not a valid state.
- Device order is always the preset order above, regardless of click order.
- The compact device menu uses checked items to toggle membership without a
  modifier key. Keep it open during selection so touch and keyboard users can
  select multiple devices. A concise selection summary appears on its trigger.
- Selected preset buttons expose their pressed state accessibly. The UI provides
  a short modifier-key hint; the menu remains a fully equivalent selection path.
- Committing a valid custom width replaces the selection with one custom preview.
  Preserve the existing positive, finite-width validation and last valid view
  while invalid text is being edited. Do not add custom-device management.
- Selection persists across component/scenario navigation and scenario reset,
  following the current persistence of viewport settings. Removing and later
  re-adding a device restores shared current state, not its old private session.

## Arrangement and viewport geometry

The canvas contains a board with one fixed-width column for each selected device.
Columns keep their real CSS viewport width, with consistent gaps and top-aligned
cards. Light or Dark mode has one row. Compare has Light in the upper row and Dark
in the lower row, with each device vertically aligned with its counterpart. It
does not wrap columns when the application window becomes narrower.

Cards retain device, theme, dimensions, loading status and error information.
Replace the repeated per-card zoom dropdowns with one shared canvas zoom control.
The application theme remains independent from preview themes.

Viewport geometry is calculated before applying board zoom. Normal iframe height
continues to follow the usable stage height, with the existing 240px minimum; it
does not shrink because the board is zoomed out. Auto height remains a shared
setting with independently reported content height for every preview. Existing
overlay behavior restores normal viewport height while a dialog or menu is open.
Each row accommodates its tallest card; Dark starts below the complete Light row.
Dimension captions report actual unscaled iframe dimensions.

## Canvas navigation

- Default to Fit all. Fit considers both board width and height, including both
  Compare rows, captions, gaps and padding, and never enlarges beyond 100%.
- Keep Fit active as the stage, selection or content geometry changes. Hidden or
  zero-size stages must not overwrite the last valid geometry.
- Provide zoom out, a readable percentage, zoom in, Fit all and 100% in a compact
  shared control. Manual zoom uses 10 percentage-point steps between 10% and 200%.
  Fit may go below 10% when needed to show the complete arrangement; the first
  manual adjustment clamps to the manual range.
- Manual zoom preserves the logical point at the center of the visible canvas.
  Fit and 100% recenter the board. Stage resizing does not discard a manual zoom.
- Scale the whole board visually, without changing iframe CSS viewport widths,
  triggering responsive breakpoints or reloading previews. A correctly sized
  outer scroll area represents the scaled board's dimensions.
- Use native canvas scrolling for overflow, including trackpad and touch scrolling
  on canvas space. Normal scrolling inside a component remains component scrolling.
- Dragging unused canvas background pans the view. Space + primary-button drag
  also pans when starting over an iframe, unless an editable field or actionable
  control has focus. A grab/grabbing cursor makes the gesture visible.
- Shared navigation controls and a focusable, labeled native scroll area provide
  keyboard access. Do not replace ordinary browser wheel behavior with custom
  wheel zoom, or require pinch gestures.
- End temporary gestures on pointer-up, pointer cancellation, lost capture,
  Space release, window blur, Escape or document replacement. Gesture suppression
  ends with the gesture and does not emit product actions.
- During alignment inspection, iframe inspection takes precedence over panning.
  Background panning and zoom controls remain available. Keep guides positioned
  correctly under the common board scale and native scrolling.
- Keep navigation controls accessible when catalog/inspector panels are hidden,
  and avoid overlapping the existing alignment bar on compact screens.

## Preview lifecycle and shared state

Give each mounted preview a stable identity based on device and role
(`primary` or `comparison`), scoped to the current scenario session. Keep readiness,
loading/error state, content height and iframe association per preview rather than
in global Light/Dark booleans. Keep the existing origin/source/session validation.
Removed frames cannot contribute messages or host actions.

Render previews with stable Lit keys. Adding or removing devices, changing zoom,
panning, showing panels and switching Preview/Split/Code preserve retained frames
and their local input. Entering Compare retains all primary frames and mounts their
Dark counterparts. Leaving Compare retains primary frames, applies the chosen
Light/Dark appearance and removes counterparts. Scenario changes and explicit
reset retain their existing session-reset behavior.

Reuse one shared configured scenario and the existing synchronization bindings.
An accepted interaction from any device/theme becomes the authoritative state and
is applied to all peers without replaying callbacks, submissions or API actions.
The originating frame alone logs those actions. Preserve the existing writer and
revision rules for simultaneous edits. Every newly rendered preview receives the
latest accepted state before its initial state can replace it.

There remains one usage-code panel. Take its output from the first selected primary
preview in canonical device order. When that preview is removed, another retained
primary supplies the code without resetting the scenario. Multiple-preview event
logs identify both device and theme, making the originating pane unambiguous.

Dispose observers, revision entries, alignment guides and gesture handlers when
frames are removed or their documents change. One preview's error remains visible
on that card and in the event log; it does not unmount healthy peers. Theme, bounds,
auto-height and alignment operations address all applicable mounted previews.

Preview/Split/Code retain the same mounted board. Compare continues to use one
shared code panel below the board; multiple selected devices also use that stacked
Split arrangement so a narrow code column does not unnecessarily reduce the canvas.

## Implementation boundaries

Keep session orchestration in `gallery.ts` and layout in `styles.ts`. Introduce
small local helpers only where they keep board geometry or selection logic clear
and directly testable; do not create a generalized canvas framework. A focused
gallery-only navigation helper is acceptable if document-bound gesture cleanup
would otherwise obscure the existing shell. Reuse `AlignmentGuides` and existing
preview state/protocol types instead of creating a second synchronization system.

Localize new user-facing text through the gallery's existing English strings.
Update the gallery README to describe selection, Compare layout, zoom and panning.
No dependency, lockfile, backend, submodule or release-pipeline changes belong in
this feature.

## Verification and acceptance

Use existing Vitest and Playwright infrastructure rather than introducing a test
framework. Meaningful unit checks cover selection invariants and board/zoom geometry
if those calculations are extracted. Browser regressions cover the actual flow:

1. Select Phone, Tablet and Desktop with modifiers; verify three actual iframe
   widths and canonical order. Check removal, ordinary replacement, custom-width
   validation and the final-selection guard.
2. Repeat multi-selection through the menu with keyboard and compact/touch layouts.
   Confirm accessible checked/pressed state and reachable navigation controls.
3. Enter Compare and verify six previews in two aligned rows. Type or select in
   several devices/themes and verify convergence with only the originating action
   recorded. Add/remove devices after editing and preserve retained iframe sessions.
4. Check Light/Dark/Compare transitions, scenario/reset behavior, theme, auto height,
   dialogs, error isolation and one shared usage-code panel.
5. Check Fit all and manual zoom at wide, narrow and split stage sizes. Verify that
   zoom/pan leave iframe viewport widths and responsive layouts intact, and that
   oversized boards remain reachable through native scrolling.
6. Exercise background drag and Space-drag over an iframe; verify that normal inputs,
   button keyboard activation and component scrolling still work. Check cleanup on
   blur, Escape, cancellation and frame removal, plus alignment under zoom/pan.
7. Visually inspect desktop and mobile layouts, application Light/Dark, three devices
   and six Compare panes, toolbar overflow and navigation/alignment-bar placement.

Run the affected gallery regressions, gallery lint/format/type checks and the
existing synchronization/iframe lifecycle checks with the repository's pinned Node
version. Product build and wheel boundaries remain covered by existing checks.
Completion requires a usable six-pane canvas with no new dependencies, preservation
of existing supported state, and no in-app screenshot functionality.
