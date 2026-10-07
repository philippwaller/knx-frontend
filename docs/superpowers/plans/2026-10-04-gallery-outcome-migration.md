# Gallery Outcome Migration Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development. This continues the approved Gallery/Compare design and the user's explicit request to migrate all Gallery components to the new logic.

**Goal:** All 48 authored Gallery entries use accepted component state and locally restored successful fixture outcomes, including peers and newly added devices.

**Architecture:** Reuse `defineExample`, `PreviewState.fixtures`, and the existing writer/session/revision transport. Consolidate actual mutable fixture data and notify the existing capture path when a successful mutation has no DOM effect. Restore local data and context readers without replaying submissions or application callbacks.

**Tech Stack:** TypeScript, Lit, existing HA contexts, Vitest and Playwright; Node 24.19.0.

**Spec:** `docs/superpowers/specs/2026-09-29-gallery-multi-device-canvas-design.md` and `docs/superpowers/specs/2026-10-03-gallery-example-authoring-design.md`, plus the accepted fixture-outcome implementation in the preceding correction wave.

## Global Constraints

- All 48 entries already use `defineExample`; migrate remaining behavior, preserve IDs, scenarios, coverage and examples that already comply.
- Keep independent local environments, services, subscriptions, callbacks, providers and typed row instances. Copy only plain successful data.
- Exactly one originating user submission; peer state application must not submit, invoke application callbacks or fetch data to refresh an already mounted provider.
- Keep one existing synchronization transport; no new dependency, backend/product change or pinned submodule mutation.
- Reset/disposal abort old work; repeated restoration is harmless; failure must leave accepted model unchanged.
- Native files, focus/hover, viewport geometry and genuine local application continuations retain the existing ownership contract.
- Preserve the preceding uncommitted Compare correction and staged skill-path instruction fix. No staging, commit, signing bypass, push, PR, branch switch, stash or reset in this migration.

## Review Focus

- Empty scenarios become populated after successful creation; deleted records disappear from every reader.
- Real registry/context consumers below router providers receive accepted data, not stale outer snapshots.
- Successful closure-only and delayed outcomes publish even without DOM changes; peer application produces no echo.
- Automatic stream has one producer across Compare, survives writer/device changes, and cannot overwrite newer shared edits with stale local history.
- Reopening, late devices, accepted empty/null data, failure and pending reset preserve consistent model ownership.

### Task 1: Migrate the complete authored outcome flow

One integration task owns the common state contract and every actual consumer. Splitting fixtures, notification and standalone handlers before that contract works would duplicate stores and create incompatible interfaces.

**Files:**

- Modify `gallery/src/environment.ts`, `gallery/src/fixtures/views.ts`, `gallery/src/examples/view.ts`, `gallery/src/types.ts`, `gallery/src/preview.ts`; modify `preview-state.ts`, `gallery.ts`, or `protocol.ts` only when necessary to keep async/background outcomes in the existing writer/session flow.
- Create at most a small common fixture helper where it removes actual repeated ownership or adapter-composition logic.
- Migrate standalone `knx-device-picker.ts`, `knx-device-create-dialog.ts`, `knx-time-server-dialog.ts`, and `knx-project-upload-dialog.ts`; other descriptors change only when a demonstrated authored state path requires it.
- Extend `gallery/src/environment.test.ts`, `gallery/src/fixtures/views.test.ts`, `gallery/src/preview-state.test.ts`, relevant protocol/helper tests and `test/gallery.e2e.ts`.
- Update `.agents/skills/knx-frontend-gallery/SKILL.md`, README authoring instructions and this plan's validation record to match the actual finished helper contract.

**Interface:** Preserve optional `GalleryEnvironment.fixtureState` capture/apply and `PreviewState.fixtures` as the transport boundary. Domain adapters or one local fixture owner must retain all environment/view/standalone outcomes together. Expose only the narrow shared preparation/publication API the existing consumers need; keep runtime owners out of snapshots.

- [x] Read the complete 48-entry catalog and shared-fixture inventories; trace actual product readers before changing fixtures.
- [x] Write and run meaningful RED readback/visible regressions for missing entity create/delete, expose outcomes, project, time, device, and delayed telegram/history behavior. Browser assertions inspect actual labels, rows, groups, reopened values and exact origin submission count.
- [x] Consolidate actual successful fixture data, represent deletion/null/empty outcomes unambiguously, clone captures/applies, validate before committing and guard abort/idempotence.
- [x] Publish successful non-DOM and asynchronous outcomes through existing PreviewSync scheduling; restore local contexts/readers without API or callback replay.
- [x] Give all actual service/history/latest-telegram readers the same local history and synchronize accepted raw outcomes; preserve real local row reconstruction, paused/filter/clear behavior and one automatic stream producer.
- [x] Reuse shared device/time/project handlers in standalone examples; new devices honor name/area and retain unique IDs. Bind picker plain cache state where immediate visible label depends on it.
- [x] Verify GREEN readbacks, peer isolation, late-device restoration, accepted empty state, rejection and pending/reset behavior; preserve existing chip and saved-name regressions.
- [x] Run the full unit suite once after functional changes, Gallery lint, typecheck, a fresh optimized build, full Gallery browser suite and thumbnail capture. Inspect changed rendered examples and record exact counts, warnings and limits.
- [x] Validate the skill and links, and reconcile the 48-entry inventory with actual migrated/shared/compliant ownership. Do not add unsupported product scenarios just to enlarge the migration.
- [x] Self-review and hand off exact diff/hashes/evidence for a fresh independent review of the migration. Address substantiated findings using the normal scoped fix/re-review loop.

## Verification and delivery

Use Node 24.19.0. Units: `yarn test --exclude '**/.worktrees/**'`. Lint: `yarn gallery:lint`. Types: `yarn lint:types` with no file arguments. Browser: `yarn gallery:test --workers=2` against a freshly compiled production build; overview: thumbnail capture against that build. The existing upstream `HuiViewBackgroundEditor._config` TS2551 must remain disclosed if unchanged.

Existing build outputs may be preserved with external output/config paths. Full browser/thumbnail coverage is appropriate because shared fixtures serve all entries; no release wheel/Pages deployment or unrelated CI rebuild is required without a concrete changed boundary.

Work remains in the existing user-owned `feat/gallery` worktree. Preserve the real Git index and all earlier changes. Evidence may live in a temporary external directory; record that retention limit and do not imply permanent archival.

## Implementation validation record (review freeze)

One environment-owned `FixtureOutcomes` model now combines entity/expose CRUD, project
null/import, time config, unique devices, raw telegram history and the monitor's visible
raw subset. Public authoring API: `env.fixtures.prepare(change)` for initial scenario
state, `env.fixtures.commit(change)` for accepted origin mutations, existing
`env.fixtureState.capture/apply` for plain transport, and direct local
`refresh(root)` for mounted readers. Automatic fixture traffic uses
`env.produceTelegram(data)` with `env.canProduce()`/abort checks before scheduling
and at delayed delivery; explicit user services retain their local continuation.
The existing PreviewSync writer/session/revision transport remains the only channel.
After writer handoff, successful delayed explicit user telegrams transfer only validated
raw history through `fixture-telegrams`; the parent merges accepted history immediately,
and `env.fixtures.receiveTelegrams(history)` restores local readers idempotently without
services/subscriber callbacks or old UI state. Paused monitor rows remain unchanged.
Late fixtures are installed before first render; unupgraded product readers are deferred.
Entity/expose flow exits use a narrow local predecessor bridge to avoid joint iframe
history consuming another pane's Save/Back after late-pane creation.

All 48 authored descriptors remain `defineExample`: 15 entries now use the shared outcome
owner and 33 compliant entries are preserved. The report retains the complete ownership
matrix and distinguishes fixture readback assertions from mounted peer/late/reopen checks.

Meaningful initial fixture/time, lazy-reader and pending-stream RED evidence is retained
externally. Independent review found one delayed explicit-user handoff loss: source history
advanced after another pane became writer, while peer and late history stayed empty.
The integrated browser RED asserted that actual missing peer read. The scoped raw-history
transfer fix preserves the current draft, rejects stale messages and restores an immediate
late pane even before the current writer captures again. The independent reviewer's original
unsuppressed UI reproduction also passes: source/peer/late contain the same single read,
the newer peer draft remains intact, exactly one service runs, and no browser errors occur.
Scoped source re-review approved the fix; final documentation reconciliation follows it.

Final frozen-source verification (Node 24.19.0):

- Full units: 563 passed across 43 files, 10.57s, exit 0.
- Gallery lint: Prettier clean; Lit analyzer 0 problems across 92 files, exit 0.
- Typecheck: exit 2, solely the pre-existing pinned Home Assistant
  `HuiViewBackgroundEditor._config` TS2551 at line 168; no Gallery diagnostics.
- Fresh optimized external build: 26.96s, exit 0; existing CSS-minifier and bundle-size
  warnings remain disclosed in the report.
- Thumbnails: all 96 passed, 1.4m, exit 0; all 96 copies and matching hashes verified
  before starting the full browser suite on the same stable build.
- Full production Gallery browser suite: all 262 passed, 3.0m, exit 0, with
  `GALLERY_E2E_PRODUCTION=1`. Earlier failed harness attempts remain separately recorded.
- Skill structural validation passes and all 15 local links resolve. No separate skill
  efficacy benchmark was run or claimed. Relevant final send-dialog/monitor renders and
  earlier device/time/entity/expose/project renders were inspected.

Reviewed implementation tree: `66b1f2ade3966b551db979fe901e86be1e04460f`.
Frozen 22-file manifest SHA256:
`4e3b2ac403a95edac48a7ff3923e2c154d27471d5aa170f7276c715126dc10fd`.
Only this validation record/checklist changes after that freeze; production, tests,
Skill and README remain byte-identical. Real index remains
`87fafbe404d84bf79127134a84bcf613140bb719`; no commit, push or deployment occurred.

Exact commands, logs, warnings, coverage split and the complete 48-entry ownership table:
[implementation report](../../../.superpowers/sdd/2026-10-04-gallery-outcome-migration/task-1-report.md).
External evidence (temporary system directory, not a permanent archive): `/var/folders/2d/g1sxqygx77gfvdfrjwb_p4hw0000gn/T/knx-gallery-component-migration-2026-10-04-o35z5u_d`.
No independent skill-efficacy benchmark was added; structural validation and 15 local
links were checked. The controller owns the final documentation-only re-review and delivery decision.
