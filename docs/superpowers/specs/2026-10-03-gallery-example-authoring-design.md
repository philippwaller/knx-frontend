# Gallery example authoring and component development skill

Date: 2026-10-03
Status: Implemented, verified and finally reviewed on 2026-10-04. Full TypeScript verification retains the unchanged pinned frontend TS2551 limitation.

## Purpose and agreed scope

Adding a component to the KNX Frontend Gallery should require a small, readable
example definition, useful fixture data and a short real usage template. Common
gallery behavior should be reusable, and examples should explain meaningful
component behavior rather than merely prove that an element mounts.

The user approved one implementation package covering the shared authoring
structure, migration of all existing examples and a repository-owned skill.
The skill is an integral deliverable and must be considered during component
implementation and maintenance, including updates to affected existing examples.
It is not an optional follow-up after the authoring work.

Success means that an agent can add or update an example by following the same
small contract as a human contributor. Repeated framework wiring belongs in
shared helpers; component-specific usage remains clear in the example itself.

## Current implementation and ownership

Work in `knx-frontend/.worktrees/component-gallery` on the existing `feat/gallery`
branch. This is independent of the root KNX frontend checkout and its pinned
Home Assistant frontend submodule.

The current catalog has 48 entries: 30 reusable components, seven dialogs and
11 view entries. Coverage includes 51 production custom-element registrations.
These numbers describe the starting point, not constraints on future additions.

Relevant implementation:

- `gallery/src/types.ts` defines the catalog and preview contracts.
- `gallery/src/examples/helpers.ts` builds metadata using positional arguments
  and provides common event/value-change helpers.
- `gallery/src/examples/` owns individual descriptors and lazy runtime adapters.
- `gallery/src/examples/dialog.ts` and `view.ts` provide shared application hosts.
- `gallery/src/fixtures/` supplies offline KNX data and backend responses.
- `gallery/src/catalog.ts` owns navigation groups and curated relationships.
- `gallery/src/sync-bindings.ts` combines explicit interaction bindings with
  control-derived property names and contains dialog opener bindings.
- `gallery/src/controls.ts` currently obtains a control's description from a
  matching property API entry.
- `gallery/src/code.ts` produces usage code from the evaluated template.
- Catalog unit tests, browser tests and thumbnail capture provide verification.

The existing positional metadata helper creates API properties from all editable
defaults. Some defaults actually represent example options, such as showing
related entities, and should not be documented as product properties. Callback
classification also relies partly on name heuristics. View fixture and host
helpers contain scenario-specific decisions keyed by component and scenario IDs.
These are the concrete sources of authoring and maintenance overhead addressed
by this design.

## Authoring contract

Introduce a small gallery-only `defineExample` helper with named fields. It
normalizes an authored definition into the existing `GalleryEntry`/`GalleryMeta`
shape used by catalog consumers. Extend runtime metadata only for the information
needed to distinguish example controls and declare interaction bindings.

The definition owns these concepts:

| Field                         | Responsibility                                                   |
| ----------------------------- | ---------------------------------------------------------------- |
| Identity and copy             | Stable ID, tag, title, description and example kind              |
| Properties                    | Public component properties, descriptions and optional controls  |
| Example options               | Editable demonstration settings that are not public properties   |
| Slots                         | Slot names, labels and descriptions                              |
| Methods, events and callbacks | Explicitly classified public interfaces                          |
| Scenarios                     | Stable IDs, labels and overrides of editable defaults            |
| Interaction                   | Component-owned state paths and supported dialog opener bindings |
| Coverage                      | Production elements demonstrated by this entry                   |
| Lazy runtime loader           | Product imports, fixture setup and usage rendering               |

A property is declared once. Its description serves the API reference and, if
editable, the inspector control. Supplied properties such as `hass`, `knx` and
callback functions can be documented without being editable. Events, methods
and callbacks are explicitly classified; their names do not determine their kind.

Example options have their own descriptions and appear as editable settings in
the inspector. They do not create public-property API entries or inferred
synchronization paths. Search, filtering, reset and accessible labels must work
for both property controls and example options. The inspector must identify
example options as such through localized copy; a new inspector subsystem is
unnecessary.

Primitive control kinds may be inferred from defaults. Explicit choices,
validation, labels and details override inference. JSON values still require
the existing serialization, forbidden-key and value validation. Support the
valid shapes actually required by each example, including optional values and
empty collections. A sample object's shape must not silently become a stricter
product schema than the component's real contract.

Validate authored definitions for duplicate IDs/keys, conflicting control names,
missing descriptions or labels, invalid defaults, unknown scenario overrides
and duplicate scenario IDs. Errors identify the example and offending field.

Default the ID and coverage to the main tag when applicable, with explicit
overrides for entries demonstrating additional registered elements. Keep the
existing default scenario and all existing scenario IDs. No runtime schema
library, universal component renderer or source-code inference engine is needed.

Gallery-only text continues to live in `gallery/src/localize/en.json`. A
definition references localized copy instead of duplicating text inside a
second documentation structure. Existing useful API details remain available.

## Usage templates and reusable runtime helpers

Each example retains an explicit usage template or the appropriate existing
dialog/view adapter. This preserves readable product usage and the current
evaluated code output. Do not create a second handcrafted code string alongside
the rendered example.

Product imports stay inside the lazy loader. Importing metadata and the catalog
must not register production elements, initialize fixtures with side effects or
load the application host.

Reuse the current helpers for event observation, controlled value changes,
callback adaptation, dialog opening and view hosting. Add a helper only for
demonstrated repetition across examples. Host dependencies and application
callbacks remain supplied by the environment rather than editable JavaScript.

Three representative migrations establish the authoring contract before the
remaining entries are converted:

1. `knx-dpt-option-selector`: real editable properties, a controlled value,
   callback documentation and meaningful disabled/invalid scenarios.
2. `knx-dpt-select-dialog`: shared dialog hosting, fixture parameters and
   empty/callback-rejection scenarios.
3. `knx-project-view`: application hosting, project data, navigation and
   distinct data/error states.

Preserve all demonstrated behavior. Intentional error scenarios must have
accurate descriptions and remain distinguishable from unexpected failures.

## Scenarios, fixtures and lifecycle

Most scenarios consist only of overrides applied in the existing order:
control defaults, selected scenario values, then inspector overrides. Reset
restores the selected scenario's fixture defaults. Invalid edits preserve the
last valid rendered state.

Data preparation and simulated responses belong to the example's lazy runtime
setup and can depend on the selected scenario. Metadata remains serializable
data and does not carry executable fixture callbacks across iframe messages.
Reuse the existing `prepare(env, scenarioId)` lifecycle where it meets this need.

Shared view helpers receive explicit data/state options and reusable response
handlers. Move example-specific decisions currently triggered by tags or scenario
names into the owning example. Shared helpers implement application-host
contracts and common behavior; they do not accumulate knowledge of every future
example's scenario names. Use small typed inputs and existing environment mock
methods rather than a generic scenario interpreter or dependency-injection layer.

Fixtures are fresh per preview session. Scenario/reset changes dispose the old
environment, listeners, subscriptions and asynchronous work through the existing
abort signal. Data and callback closures are local to each iframe. Offline
behavior remains strict: unknown calls fail visibly and no backend fallback is
introduced. Retain real response semantics used by save/create flows.

## Catalog and interaction synchronization

Keep the explicit grouped catalog and its curated relationships. Adding an
example requires one descriptor import and one insertion in the appropriate
group, alongside its localized copy. Automatic file discovery is not required;
explicit order and lazy-loading boundaries remain easy to review.

Move KNX component-specific interaction paths and dialog opener declarations
into their owning example definitions. The synchronization module composes
these declarations with shared Home Assistant element bindings. Definitions
depend on types/helpers; the composer can depend on the catalog without
creating a reverse import cycle.

When navigation in an example loads other KNX components, the existing
catalog-wide binding lookup remains available. Interaction paths represent
actual component state, including the existing explicitly supported private
paths. Metadata and example options are not a license to synchronize services,
callback objects, fixture ownership or viewport-derived properties. Any public
control-derived paths must come only from actual product properties suitable
for synchronization.

Preserve convergence across device widths and light/dark previews without
replaying submissions, API calls or callback side effects. Dialog peers use
their local UI-only opener to reconstruct their own parameters and callbacks.
Special continuation adapters remain explicit where required. Browser-owned
files, focus and hover retain their current semantics.

## Repository skill and development integration

Create `.agents/skills/knx-frontend-gallery/SKILL.md` in this repository. Reference
it from `.github/copilot-instructions.md`, the existing shared project instruction
source, for adding or changing KNX components, dialogs, views and their examples.
This makes gallery maintenance part of component work. It does not introduce a
filesystem watcher or claim that a skill executes outside an agent task.

The skill's concise discovery description covers new components, behavior/API
changes and explicit gallery-example work. Its body explains the local contract
and directs the agent to:

- Read the actual component and representative production call sites.
- Find affected catalog entries and use existing fixtures and host helpers.
- Create or update the definition, usage and localized API descriptions.
- Select realistic normal data and only the special states useful for that
  component; there is no mandatory scenario count.
- Maintain coverage, catalog placement, relationships when applicable and
  explicit interaction/dialog bindings.
- Run relevant checks and inspect the rendered example, including responsive
  or comparison behavior where the change can affect it.
- Report completed checks and any actual limitations.

Reference the three migrated examples as executable authoring references. Do
not maintain copied starter templates or duplicate the full schema and general
project instructions in the skill. Supporting resources or scripts are added
only if they solve a demonstrated repeated task.

Validate the skill's frontmatter, links and discovery integration. Exercise its
guidance against an addition and an update using the migrated examples. A fresh
agent evaluation, when used, works in an isolated temporary checkout and adds
no production component to the main working tree. Evaluate observable outputs
and checks rather than exact wording of generated instructions.

## Complete migration and boundaries

After the representative cases establish the contract, migrate every existing
descriptor to it. Remove the positional authoring helper and obsolete special
cases once all callers have moved. Completion requires one authoring path; a
permanent legacy/new split does not fulfill this package.

Preserve stable component/scenario URLs, grouping, curated relationship links,
API documentation, slot examples, validation, interaction behavior and fixture
isolation. Correctly reclassifying example options is the intended inspector
change. Preserve thumbnail coverage and evaluated usage-code behavior.

Changes belong in gallery definitions, types/helpers, affected inspector and
fixture/synchronization adapters, tests, README and repository skill/instructions.
Product components and the Home Assistant submodule do not gain gallery-specific
properties or imports. No backend, dependency/lockfile, gallery shell redesign,
new hosting or publication flow is part of this package.

## Verification and acceptance

Use the pinned Node version from `.nvmrc`, currently 24.19.0, and existing Vitest,
Playwright and build tooling. No new test framework is needed.

Verification must protect the following behavior:

1. Definition normalization creates documented property controls, supplied
   interfaces and separately described example options without misclassifying
   callbacks or demonstration flags as product API.
2. Defaults, choices, validation, scenario overrides, reset and inspector search
   work with valid data and reject malformed definitions or unknown overrides.
3. Every production custom-element registration is covered exactly once by an
   example. Remove fixed component counts/lists as addition barriers while
   preserving actual source-discovery and unique-coverage assertions.
4. Importing the catalog remains metadata-only, and each migrated example and
   scenario renders offline with fresh fixtures and cleanup on reset/navigation.
5. Representative selector, dialog and view interactions work, including
   intentional error states and updates to fixtures after save/create actions.
6. Synchronization preserves supported state across devices/themes, excludes
   example-only and host-local values, rebuilds supported dialogs locally and
   invokes action side effects only in the originating preview.
7. Code output represents the evaluated usage; thumbnails capture every default
   entry in both themes. Existing accessibility and responsive behavior survive.
8. The repository skill is discoverable through project instructions, refers to
   real migrated examples and guides both addition and maintenance successfully.

Run focused normalization/catalog/inspector/state checks while establishing the
contract, then existing unit checks with `**/.worktrees/**` excluded, gallery
lint, TypeScript checks and gallery browser regressions after the complete
migration. Build the standalone gallery and thumbnails; use existing production
module-graph/wheel exclusion checks to verify the gallery and skill stay outside
the shipped Python/frontend artifacts.

Visually inspect the representative examples in light/dark and narrow/wide
previews. Record authored code and integration points before and after those
three migrations, with an explanation of remaining individual logic. Acceptance
requires reduced repeated wiring and a clear addition/update procedure, not an
arbitrary line-count threshold.

The final deliverable includes all migrated examples, the shared authoring
contract, updated contributor guidance and the working repository skill with
verification evidence. Commits remain scoped to this repository. Publishing or
opening a pull request requires the user's delivery instruction.
