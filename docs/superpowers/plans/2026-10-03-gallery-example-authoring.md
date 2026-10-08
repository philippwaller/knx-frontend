# Gallery example authoring implementation plan

Status: Implemented, verified and finally reviewed on 2026-10-04. Full TypeScript verification retains the unchanged pinned frontend TS2551 limitation.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for
> inline execution, or superpowers:subagent-driven-development if the user selects
> delegation. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make gallery examples inexpensive to add and maintain, migrate all
existing examples, and deliver the repository skill as part of component work.

**Architecture:** A named `defineExample` definition compiles to the existing
catalog/preview contract. Keep actual usage templates and shared hosts, move
example-specific preparation and KNX interaction declarations to their owners,
and derive inspector/reference information from the same localized definition.

**Tech Stack:** Existing TypeScript, Lit, gallery fixtures, Vitest, Playwright,
Yarn and production build tooling. No new dependencies.

**Spec:** [Approved design](../specs/2026-10-03-gallery-example-authoring-design.md).

## Global constraints

- Work in `knx-frontend/.worktrees/component-gallery`, branch `feat/gallery`.
  Inspect status before each mutation; preserve unrelated work and signing.
- Use Node 24.19.0 from `.nvmrc`; put its bin directory in PATH for commands
  and commit hooks. Do not switch branches, update submodules or run `dev update`.
- The gallery works offline. Keep product imports lazy and data fresh per
  preview; unknown backend calls fail visibly, with no live fallback.
- Preserve component/scenario URLs, category order, relationships, slot examples,
  documented interfaces, callbacks, responsive behavior and supported state.
- Example options must not masquerade as product properties or enter inferred
  synchronization. Services, callbacks and viewport state remain local.
- Gallery text belongs in `gallery/src/localize/en.json`; use current host and
  event/callback helpers. Product components gain no gallery-specific behavior.
- Complete all existing examples and the skill in this package; transitional
  compatibility is removed before completion. No hosting/publication changes.
- Run TypeScript checks without file arguments. Exclude `**/.worktrees/**` from
  unit discovery. Tests verify meaningful behavior, not generated wording.
- Scoped local commits are allowed by this workflow; pushing or creating a PR
  requires the user's delivery instruction.

## Review focus

1. Example option names can coincide with plausible product names: reject
   duplicate controls and exclude options from API/bindings (tasks 1 and 3).
2. Null/empty collections and optional object fields can be valid product data:
   do not use one sample as an exhaustive schema (tasks 1 and 3).
3. Opening the application router can mount components beyond the selected
   entry: retain catalog-wide binding lookup and peer-local dialogs (task 3).
4. Reset during pending fixture work and monitor streaming can leak old state:
   abort and isolate callbacks/data; freeze thumbnail telemetry (tasks 2 and 5).
5. Skills can generate a convincing but incomplete example: evaluate actual
   addition/update output, registration, API and interactions (task 4).

## File responsibilities

| Files                                                                       | Responsibility                                                          |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `gallery/src/types.ts`                                                      | Authored definition and normalized metadata types                       |
| `gallery/src/examples/helpers.ts`                                           | `defineExample`, validation and existing event helpers                  |
| `gallery/src/examples/helpers.test.ts`                                      | Definition and validation behavior                                      |
| `gallery/src/controls.ts`, `localize/en.json`                               | Property/example-option descriptions and localized distinction          |
| `gallery/src/examples/*.ts`                                                 | All actual definitions, usage and scenario-specific runtime preparation |
| `gallery/src/examples/view.ts`, `fixtures/views.ts`                         | Shared explicit host/data preparation contracts                         |
| `gallery/src/fixtures/views.test.ts`                                        | Fixture isolation, responses and cleanup                                |
| `gallery/src/sync-bindings.ts`, `sync-bindings.test.ts`                     | Compose entry-owned and shared HA interaction bindings                  |
| `gallery/src/catalog.test.ts`                                               | Source-based coverage and metadata-only catalog invariants              |
| `gallery/src/state.test.ts`, `test/gallery.e2e.ts`                          | Value validation and observable inspector/interaction regressions       |
| `.agents/skills/knx-frontend-gallery/SKILL.md`                              | Add/update workflow using real repository references                    |
| `.github/copilot-instructions.md`, `README.md`                              | Integrate skill into component work and explain authoring               |
| `docs/superpowers/plans/2026-10-03-gallery-example-authoring-validation.md` | Baseline comparison and final verification evidence                     |

## Task 1: Named authoring contract, inspector and reference selector

**Files:** Modify `gallery/src/types.ts`, `gallery/src/examples/helpers.ts`,
`gallery/src/controls.ts`, `gallery/src/localize/en.json`,
`gallery/src/examples/knx-dpt-option-selector.ts`, `gallery/src/state.test.ts`,
`gallery/src/catalog.test.ts`, `test/gallery.e2e.ts`.
Create `gallery/src/examples/helpers.test.ts`.

**Interfaces:**

```ts
interface GalleryCopy {
  title: string;
  description: string;
  api: Record<string, string>;
  labels: Record<string, string>;
}
interface GalleryControlOptions {
  kind?: GalleryControl["kind"];
  choices?: JsonValue[];
  validate?(value: JsonValue): string | undefined;
}
interface GalleryInteraction {
  state?: readonly string[];
  dialogOpeners?: Readonly<Record<string, string>>;
  localProperties?: readonly string[];
}
interface GalleryDefinition {
  tag: string;
  id?: string;
  category?: GalleryMeta["category"];
  copy: GalleryCopy;
  properties?: GalleryValues;
  exampleOptions?: GalleryValues;
  suppliedProperties?: readonly string[];
  methods?: readonly string[];
  events?: readonly string[];
  callbacks?: readonly string[];
  slots?: readonly string[];
  scenarios?: GalleryMeta["scenarios"];
  controls?: Record<string, GalleryControlOptions>;
  apiDetails?: Record<string, string>;
  interaction?: GalleryInteraction;
  covers?: string[];
  load(): Promise<GalleryExample>;
}
function defineExample(definition: GalleryDefinition): GalleryEntry;
```

`properties` declares editable real properties and their fixture defaults once.
`suppliedProperties` documents noneditable properties. Callbacks/methods/events
are explicit lists. Descriptions and labels resolve through `copy.api` and
`copy.labels` by name; the default slot uses the `default` copy key. Control
options customize an existing property/example-option key, not a second default.

Normalized controls add `description`, optional `details`, and
`target: "property" | "example"`. Entries add optional `interaction`.
Default ID/coverage is the tag; default kind is components. Prepend the localized
default scenario unless an explicit `default` entry is supplied, which preserves
its own label/values and is placed first. Preserve other scenario order.

- [ ] Record baseline authored lines and repeated wiring for the three reference
      files before editing; record catalog/scenario IDs in a temporary inventory.
- [ ] Write tests for documented boolean/number/text/select/JSON controls,
      noneditable properties, explicit callbacks, default slot and explicit
      default scenario. Assert an example option has a description/control but
      no matching property API entry; mismatched property/option keys throw.
- [ ] Write invalid-definition tests: blank identity/copy, missing label/API
      description, duplicate supplied/property names, duplicate slots/scenarios,
      unknown control customization/overrides, invalid choices/defaults and
      custom-validator rejection. Errors include tag and field/scenario name.
- [ ] Run `yarn test gallery/src/examples/helpers.test.ts --exclude '**/.worktrees/**'`;
      expect failures for the missing normalizer/new semantics, then implement it.
- [ ] Reuse `isJsonValue`, `resolveValues` and existing choice validation. Infer
      primitive kind and JSON root collection kind; null defaults accept valid
      JSON. Deep or domain constraints use explicit validators. Test empty arrays,
      optional object fields and rejection of the wrong root collection kind.
- [ ] Update the inspector to read a control's normalized description/details
      and display localized `en.ui.exampleOption = "Example option"` for target
      `example`. Keep property reference deduplication, search, drafts and reset.
      During migration only, fall back to old property API metadata for old entries.
- [ ] Migrate `knx-dpt-option-selector` with `defineExample`. Classify
      `localizeValue` as callback, keep `options` supplied and preserve its actual
      render, value-change behavior and disabled/invalid scenarios.
- [ ] Extend browser coverage using `knx-payload-selector` once converted in
      task 3: `raw` is described/searchable as an example option, changing/resetting
      it changes actual payload usage, and it is absent from Interfaces.
- [ ] Run helper/catalog/state/code unit tests, `yarn lint:types` and focused
      browser checks for `knx-dpt-option-selector`. Commit only this task's files.

## Task 2: Explicit fixture/host preparation and reference dialog/view

**Files:** Modify `gallery/src/fixtures/views.ts`,
`gallery/src/examples/view.ts`, `gallery/src/examples/knx-project-view.ts`,
`gallery/src/examples/knx-dpt-select-dialog.ts`, remaining view descriptors that
call the changed host interface, and `test/gallery.e2e.ts`.
Create `gallery/src/fixtures/views.test.ts`.

**Interfaces:** Consume `defineExample` and existing environment/mock methods.
Define/export these runtime-only interfaces from `fixtures/views.ts` and `view.ts`:

```ts
interface ViewFixtureOptions {
  project?: KNXProject | null;
  dptMetadata?: KNXBaseData["dpt_metadata"];
  emptyEntities?: boolean;
  emptyExposes?: boolean;
  emptyTelegrams?: boolean;
  enableMonitor?: boolean;
  streamTelegrams?: boolean;
  failCalls?: readonly (
    | "knx/get_entity_config"
    | "knx/get_expose_config"
    | "knx/group_monitor_info"
    | "knx/group_telegrams"
  )[];
  failEntityValidation?: boolean;
  failExposeValidation?: boolean;
  reloadExposeContext?: boolean;
}
function prepareViews(
  env: GalleryEnvironment,
  options: ViewFixtureOptions,
  thumbnail: boolean,
): Promise<void>;
interface ViewScenarioOptions {
  path?: string;
  fixtures?: ViewFixtureOptions;
  projectContext?: KNXProject | null;
  entityGroupsError?: string;
  paused?: boolean;
}
interface ViewExampleOptions {
  fixtures?: ViewFixtureOptions;
  scenarios?: Record<string, ViewScenarioOptions>;
  resetMonitorCache?: boolean;
}
function viewExample(
  tag: string,
  initialPath: string,
  options?: ViewExampleOptions,
): Promise<GalleryExample>;
```

Undefined fixture project means fresh normal data; null means no project. For
an empty project use a fresh normal project's info with empty address/range/
device/object collections. Merge base/scenario options by named fields; scenario
error lists replace base lists. All configuration remains inside lazy `load()`.

- [ ] Test normal/missing/empty project responses, fresh entity/expose data in two
      environments, successful update followed by fetch, rejected validation and
      explicit endpoint failures. Assert reset starts from fresh fixture data.
- [ ] Test monitor telemetry with fake timers: enabled normal previews stream
      every 1200ms, thumbnails never stream, explicit empty/failing monitor data
      does not start streaming, and abort stops work and isolates another preview.
- [ ] Run fixture tests to demonstrate missing explicit-option behavior, then
      change `prepareViews` to named options. Retain current endpoint response
      types, save/create semantics and local completed HA flow responses.
- [ ] Change `viewExample` to select scenario paths/fixture/context/pause options.
      Shared routing/dialog/host contracts remain there; remove the scenario-ID
      route table and example-specific empty/error/pause switches from shared code.
      Use `emptyEntities` for the initial full-entities context. Keep abort cleanup
      and monitor cache clearing controlled by `resetMonitorCache`.
- [ ] Translate existing view behavior into explicit per-descriptor options:
      entity/expose create/edit paths, no-project/empty project contexts, entity
      grouping errors, expose context reload and monitor pause/empty/error/stream.
      Keep every existing scenario ID and the parent catalog URL on local navigation.
- [ ] Migrate the reference dialog and project view to `defineExample`. The dialog
      retains its local callback adapter and rejection behavior; the project view
      owns its empty/missing project and group-telegram failure configuration.
- [ ] Run fixture and environment unit checks, `yarn lint:types`, and
      `yarn gallery:test --workers=2 --grep 'dialogs|views'`. Verify the existing
      editor save/create, monitor pause/resume and router tests pass. Commit scope.

## Task 3: All examples, entry-owned interaction and extensible coverage

**Files:** Modify every remaining descriptor in `gallery/src/examples/`,
`gallery/src/examples/helpers.ts`, `gallery/src/types.ts`, `controls.ts`,
`localize/en.json`, `sync-bindings.ts`, `catalog.test.ts`, `state.test.ts` and
affected tests/fixtures with authored metadata literals. Create
`gallery/src/sync-bindings.test.ts`; extend `test/gallery.e2e.ts`.

**Interfaces:** Entry definitions use task 1's contract. In `sync-bindings.ts`
export `composeBindings(entries: readonly GalleryEntry[]):` an object containing
`syncBindings: Record<string, readonly string[]>` and
`dialogOpeners: Record<string, Record<string, string>>`.
The module retains its existing named exports by composing the actual catalog.

- [ ] Write composition tests: entry-owned state and editable real properties are
      deduplicated; example options, callbacks and host/viewport-local fields are
      excluded. Honor `interaction.localProperties`. Shared HA state remains
      available; declaring conflicting owners fails rather than silently overwrites.
- [ ] Keep host-local exclusions for `hass`, `knx`, `narrow`, `isWide`,
      `isMobileDevice`, and `filterPaneNarrow`. Preserve explicit existing state
      paths, including paths that differ from demonstration control names.
      Move every KNX state/dialog opener declaration to its owning entry; keep
      shared HA bindings centralized. Use global catalog lookup after view routing.
- [ ] Migrate by existing navigation group: layouts, inputs, data, widgets, dialogs,
      views. Match each editable key to the real component/call-site contract.
      Mark synthesized settings such as `raw`, `numberValue`, `externalLength`,
      `openEnded`, `twoTabs`, `customLocalize`, `showRelated` and `showTelegrams`
      as example options when the owning component has no such public property.
      A transformed control for a real property stays a property and can be
      excluded from inferred sync via `localProperties` when needed.
- [ ] Preserve all API details and methods, including the manually authored
      separator; explicitly classify callbacks in all definitions. Retain slot
      content, fresh fixture factories, usage templates and per-example cleanup.
      Add actual data validators where a renderer requires a specific JSON shape,
      accepting valid empty collections/optional fields rather than copying a sample.
- [ ] Replace fixed catalog counts and component/dialog lists with discovered
      source registrations, unique coverage, valid categories and documentation
      invariants. Every control is described; only target `property` must match
      property API. Assert catalog import leaves product registrations unloaded.
- [ ] Compare catalog/scenario IDs with the starting inventory. Remove positional
      `metadata`, obsolete shape inference, inspector fallback and transitional
      optional normalized fields. All controls require description/target.
      Check remaining calls with `rg -n 'metadata\(' gallery/src/examples`;
      expected no matches. This is a completion check, not a string-matching test.
- [ ] Complete task 1's example-option browser regression. Exercise Compare and
      multiple devices with selector/dialog edits, router-mounted components,
      simultaneous edits and reset during pending work. Assert peer state converges
      and only the originating pane records callbacks/submissions/API actions.
- [ ] Run full units with `yarn test --exclude '**/.worktrees/**'`,
      `yarn gallery:lint`, `yarn lint:types`, and focused browser checks matching
      `components|dialogs|views|compare|multi-device|inspector|usage code`.
      Commit exact migration/synchronization scope; no dependency changes.

## Task 4: Repository skill and component-development integration

**Files:** Create `.agents/skills/knx-frontend-gallery/SKILL.md`.
Modify `.github/copilot-instructions.md` and README's gallery authoring section.
Record baseline/skill evaluation in the validation report from task 5.

**Interfaces:** The skill consumes task 1's normalizer, task 2's host options,
task 3's interaction declarations and the three real migrated references.
Skill name: `knx-frontend-gallery`. The project instruction source links its
exact repository path and requires consideration during new/changed component,
dialog and view implementations. `AGENTS.md`, `CLAUDE.md` and `GEMINI.md` are
ignored local links in this repository. Preserve any existing link/file; when
`AGENTS.md` is entirely absent, create the README's local symlink to
`.github/copilot-instructions.md` so future Codex component work reads the skill
requirement. Do not force-add the ignored link or alter other agent configuration.

- [ ] Read skill-creator and writing-skills guidance at execution time. Before
      writing the skill, run a fresh-context baseline on an isolated temporary
      copy with a small temporary selector and an existing-component update.
      Give actual source/call sites and the authoring contract; record observed
      output and omissions rather than inventing failures. Keep temporary product
      files out of this worktree and omit the future skill from baseline context.
- [ ] Write concise frontmatter and instructions covering addition and maintenance,
      realistic scenario selection, fixtures/hosts, API/option distinction,
      registration/coverage, interaction and rendering checks. Link the three
      migrated examples and exact existing verification entry points. No copied
      example templates, generic policies, new watcher or redundant schema manual.
- [ ] Update shared project instructions so component work reads the skill and
      creates/updates affected examples as part of implementation. README documents
      one definition, lazy loader, localized copy, explicit catalog registration
      and appropriate interaction checks using the actual migrated selector.
      Verify the local `AGENTS.md` routing described above without replacing an
      existing file or symlink.
- [ ] Run `python3 /Users/PWALLER/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/knx-frontend-gallery`;
      expect valid skill frontmatter/name with no unfinished scaffold.
- [ ] Repeat addition/update evaluation with a fresh agent and the skill in an
      isolated copy. The addition covers its temporary registration, has meaningful
      data/states and works offline; the update changes affected API/scenarios and
      verifies interaction without adding unnecessary helpers. Inspect actual
      rendered results and relevant check output. Correct only demonstrated gaps.
      Delegate these evaluations only when the chosen workflow or applicable skill
      authorizes it; do not message other Codex tasks or publish artifacts.
- [ ] Verify skill links resolve, the shared instruction source points to it,
      and README uses the final contract. Commit skill, guidance and evaluation
      record together; this task is mandatory for completion.

## Task 5: Complete verification and authoring comparison

**Files:** Create/update
`docs/superpowers/plans/2026-10-03-gallery-example-authoring-validation.md`.
Use existing build/test configurations; change them only for a demonstrated gap.

**Interfaces:** Verify the complete catalog, task 4's skill and existing production
build/exclusion pipeline. Do not introduce a second capture or packaging system.

- [ ] Run full units with worktrees excluded, gallery lint, TypeScript and the
      repository ESLint/Prettier checks. A successful exit proves only that check;
      investigate failures before changing scope or claiming success.
- [ ] Run `yarn gallery:build` once to compile and generate all default light/dark
      thumbnails. Then run `GALLERY_E2E_PRODUCTION=1 yarn gallery:test --workers=2`
      against immutable production files and
      `yarn playwright test --config test/playwright.gallery-pages.config.ts`.
      Use the existing servers on ports 8092/8093; do not restart a user's process.
- [ ] Run `KNX_BUILD_STATS=1 yarn build` with gallery output still present, then
      the wheel/exclusion procedure from `.github/workflows/gallery-build.yml`.
      Use a unique temporary output directory in place of `dist` globbing; restore
      VERSION bytes in `finally` and unpack only the newly built wheel.
      Run `node build-scripts/check-gallery-exclusion.mjs build/checks/production.json <temporary-unpacked-wheel>`.
      Ensure neither gallery code nor `.agents/skills/` is shipped.
- [ ] Visually inspect selector/dialog/project view in light/dark at widths 390
      and 1280, with inspector examples/options, meaningful states, usage code,
      keyboard controls, nested dialogs and multiple-device comparison. Confirm
      default thumbnails render the expected actual components.
- [ ] Record before/after authoring lines and integration points for the three
      references. Explain where individual logic remains and count shared helper
      additions too. If definitions become harder to author, simplify the named
      contract before reporting completion; no arbitrary line-count target.
- [ ] Record exact commands, outcomes, preserved IDs/scenarios, skill addition/update
      evaluation, and any actual limitations. Update spec/plan status only after
      required work and checks are complete. Review the scoped diff against every
      acceptance item, then obtain the workflow's independent final review when
      authorized. Commit the validation record and verified changes with signing.

## Self-review and handoff

Spec coverage: authoring/inspector/validation is task 1; scenario ownership,
runtime isolation and the reference dialog/view are task 2; full migration,
catalog extensibility and synchronization are task 3; the integrated skill is
task 4; build, packaging, visual evidence and authoring comparison are task 5.
All five review-focus conditions have owning tests or observable evaluations.

Recommended execution is inline in this session with an independent final review.
The tasks share one evolving contract and the same catalog, so sequential work
keeps migrations consistent. The user reviews this plan and selects the execution
method before implementation begins.
