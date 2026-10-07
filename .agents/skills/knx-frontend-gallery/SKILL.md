---
name: knx-frontend-gallery
description: Use when adding or changing KNX frontend components, dialogs, views, or their gallery examples, especially public interfaces, supported states, fixtures, or interaction behavior.
---

# KNX frontend gallery

Keep the gallery useful for trying the actual component offline. For every component,
dialog or view implementation, inspect the affected examples and update them when
interfaces, supported states or behavior change. Read the product source and actual
callers before choosing scenarios; demonstrate a realistic KNX task with meaningful
data rather than every possible property combination.

## Authoring references

Use the smallest matching maintained example:

- [DPT option selector](../../../gallery/src/examples/knx-dpt-option-selector.ts):
  controlled selection, supplied options, localized callback and observed events.
- [DPT select dialog](../../../gallery/src/examples/knx-dpt-select-dialog.ts):
  dialog host, local callback adapter, empty data and callback rejection.
- [Project view](../../../gallery/src/examples/knx-project-view.ts):
  view host with explicit missing/empty project and endpoint failure options.

The authoring contract is [GalleryDefinition](../../../gallery/src/types.ts) and
[defineExample](../../../gallery/src/examples/helpers.ts). Export one
`entry = defineExample(...)`; the helper derives metadata, controls, documented API,
default scenario and default coverage. Keep existing IDs, scenario URLs, relationships
and slot examples when maintaining an entry.

- Put gallery copy in [en.json](../../../gallery/src/localize/en.json). Use
  `properties` for editable real inputs, `suppliedProperties` for host/fixture inputs,
  and the callback/event/method/slot declarations for the actual interfaces.
  Use `exampleOptions` for gallery-only switches; never bind them as invented product
  properties or document them as product API. Add JSON shape validation where a
  renderer assumes structured data.
  `backend-en.json` is a copied Core subset. The explicit `backendFixtures` entry in
  `en.json` supplies the payload base label currently missing in Core d8668bb;
  remove that supplement when the Core snapshot provides it.
- Import product components and runtime fixtures inside `load()`. Create fresh data
  per preview and stop asynchronous work with `env.signal`. Use the existing
  [dialog host](../../../gallery/src/examples/dialog.ts),
  [view host](../../../gallery/src/examples/view.ts) and
  [fixture options](../../../gallery/src/fixtures/views.ts) as needed. Select host
  behavior through explicit options in the entry, keeping scenario-specific behavior
  out of shared hosts. Unknown backend calls must fail visibly without live fallback.
- Register the entry explicitly in the appropriate group of
  [catalog.ts](../../../gallery/src/catalog.ts). `covers` defaults to the tag;
  override only to describe actual additional registrations owned by the example.
  Every production custom element needs exactly one coverage owner.
  The thumbnail build exports these IDs, titles and coverage tags to `catalog.json`;
  PR preview comments use that build's catalog to link changed source registrations
  and example definitions to their owning examples. Keep IDs stable for shared links.
- Use `observe`, `valueChanged` and existing callback adapters for local interactions.
  Editable product properties are inferred by
  [composeBindings](../../../gallery/src/sync-bindings.ts); declare additional
  supported state paths/dialog openers in the entry's `interaction`, and use
  `localProperties` when a real property must stay local. Example options, callbacks,
  services and viewport state stay local; submissions must not be replayed.
- Derive example-owned DOM (such as filter chip slots) from accepted component state,
  including peer-applied property updates. Do not rely only on origin event handlers.
  Successful fixture mutations use the environment-owned
  [FixtureOutcomes](../../../gallery/src/fixtures/outcomes.ts): `env.fixtures.commit(change)`
  clones and validates the complete plain model, updates local registries/providers, and
  schedules the existing preview capture even after a dialog closes or a timer completes.
  Use `env.fixtures.prepare(change)` once for initial scenario data; it starts from defaults
  and does not publish. Reuse the common device/time/project handlers in
  [environment.ts](../../../gallery/src/environment.ts) and the entity/expose handlers in
  [view fixtures](../../../gallery/src/fixtures/views.ts). Do not replace `env.fixtureState`
  with an independent outcome store.
- `env.fixtureState.capture/apply` remains the plain transport boundary. Complete snapshots
  include explicit empty/null outcomes; apply validates before updating local data and
  never calls APIs, submissions, subscriptions, or application callbacks. The preview also
  installs fixtures before a late pane's first render and restores mounted contexts and
  typed monitor rows locally. Services, native files and continuations stay local.
  Background producers must check `env.canProduce()` and `env.signal`; only the current
  writer produces demo telegrams. Use `env.produceTelegram(data)` for automatic fixture
  traffic; it rechecks writer ownership when delayed delivery completes. Explicit user
  services retain their own local continuation. If their delayed telegram completes after
  writer handoff, the existing `fixture-telegrams` message transfers validated raw history
  using the same session/source/revision guards. The parent merges accepted history before
  late configuration; `env.fixtures.receiveTelegrams(history)` merges idempotently and
  updates local readers without subscriber/API replay or an old UI snapshot. Paused
  monitors keep their visible rows while raw history advances. This is a narrow telegram
  outcome path, not a general mutation protocol. Verify actual peer labels/rows, reopened
  values, late panes, rejected saves, pending reset, and exact originating action counts.
- View examples keep entity/expose flow exits local: their existing HA `history.state.from`
  routes are resolved within the originating iframe, because late panes share browser
  history. The bridge preserves the preview URL/query, restores `history.back` on abort,
  and leaves dialogs and other route predecessors on the existing fallback. Do not turn
  this into a shared history stack or replay an application continuation in peers.

## Verify the changed examples

Use Node from `.nvmrc`. Existing entry points include:

```sh
pnpm test gallery/src/catalog.test.ts gallery/src/examples/helpers.test.ts gallery/src/sync-bindings.test.ts --exclude '**/.worktrees/**'
pnpm gallery:lint
pnpm lint:types
pnpm gallery:test --workers=2
```

Type checking takes no file arguments. Focus browser runs with `--grep` on affected
catalog tags and relevant tests in [gallery.e2e.ts](../../../test/gallery.e2e.ts).
Inspect actual rendering, interface/usage copy and changed behavior, including
selection/events, reset, disabled/error states and Compare when relevant. The existing
browser harness checks console errors and accidental backend traffic. Report completed
checks and unresolved errors accurately. Use `pnpm gallery:build` when validating the
standalone output and refreshing overview thumbnails; it includes thumbnail capture.
