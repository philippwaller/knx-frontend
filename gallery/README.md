# KNX Frontend Gallery

Offline previews of the actual product components, dialogs and views.
Local fixtures need no Home Assistant login or KNX connection; unknown backend
calls fail visibly. Product code and builds must never import Gallery tooling.

## Run and build

Run commands from the repository root, using Node from `.nvmrc` and the existing
`script/bootstrap` setup. Install Chromium with `pnpm exec playwright install chromium`
(add `--with-deps` on Linux CI).

```sh
pnpm gallery                 # http://127.0.0.1:8091; accepts --port
pnpm gallery:build           # optimized build/gallery/ plus light/dark thumbnails
pnpm gallery:thumbnails      # refresh thumbnails from the existing build
```

Build once before local development to populate overview images; detail previews
update live, while thumbnails show the last build. The catalog opens scenarios;
Compare shares accepted component and fixture state across devices and color modes.

## Author examples

Create an example for each new production custom element and maintain affected
examples whenever public interfaces, supported states or interactions change.
Read product sources and callers; demonstrate a realistic KNX task.

- Export one `entry = defineExample(...)` using [helpers](src/examples/helpers.ts)
  and [GalleryDefinition](src/types.ts); register it in [catalog.ts](src/catalog.ts).
  Each production custom element has exactly one coverage owner. Preserve existing
  IDs, scenario URLs, relationships and slot examples.
- Use [DPT option selector](src/examples/knx-dpt-option-selector.ts) for controlled
  inputs/events, [DPT select dialog](src/examples/knx-dpt-select-dialog.ts) for
  callbacks/dialog hosting, and [project view](src/examples/knx-project-view.ts)
  for explicit missing, empty and failed backend scenarios.
- Put copy in [en.json](src/localize/en.json). Declare real inputs as `properties`,
  host inputs as `suppliedProperties`, and local switches as `exampleOptions`.
  Document actual events/callbacks/methods/slots; validate structured JSON inputs.
  `backend-en.json` is a Core snapshot; remove the payload-label supplement in
  `backendFixtures` when Core supplies it.
- Import components and runtime fixtures inside `load()`, create fresh fixtures,
  cancel asynchronous work with `env.signal`, and reuse [dialog](src/examples/dialog.ts),
  [view](src/examples/view.ts) and [view fixtures](src/fixtures/views.ts) hosts.
- Reuse `observe`, `valueChanged` and callback adapters. [composeBindings](src/sync-bindings.ts)
  infers editable properties; declare additional supported state/dialog openers in
  `interaction`, and keep real local inputs in `localProperties`. Options, callbacks,
  services, viewport state, native files and application continuations stay local.
- Derive example-owned DOM from accepted state, including peer updates. Prepare initial
  outcomes once with `env.fixtures.prepare(change)` and commit successful mutations
  with `env.fixtures.commit(change)`; reuse [environment](src/environment.ts) and view
  handlers. [FixtureOutcomes](src/fixtures/outcomes.ts) owns the plain model;
  `fixtureState.capture/apply` transports complete validated snapshots without
  replaying APIs, subscriptions or callbacks, including before a late pane renders.
- Background producers check `env.canProduce()` and `env.signal`; automatic traffic
  uses `env.produceTelegram(data)`. Delayed explicit sends after writer handoff transfer
  validated raw history through existing `fixture-telegrams` guards; peers receive it
  idempotently without subscriber replay or old UI state. Paused rows stay paused.
  Known entity/expose navigation predecessors resolve inside the originating iframe.

## Checks

```sh
pnpm gallery:unit            # Gallery Vitest; accepts focused file/name filters
pnpm gallery:policy          # standard-library Python publishing/security tests
pnpm gallery:lint            # TS/config/tool formatting, syntax and Lit templates
pnpm gallery:types           # shared compiler options; separate incremental cache
pnpm gallery:test --workers=2 --grep 'components knx-dpt-option-selector'
GALLERY_BASE_PATH=/demo/pr/42/ pnpm gallery:build
GALLERY_BASE_PATH=/demo/pr/42/ pnpm exec playwright test --config gallery/test/playwright.gallery-pages.config.ts
```

Inspect rendering, usage, events, reset/errors, Compare and late panes; verify action counts.
The browser harness checks console errors and backend traffic. Keep the complete
browser suite before publication, split into two shards with two workers each.
Production `pnpm test` and `pnpm lint` have independent scopes. Optional production
statistics use `KNX_BUILD_STATS=1 pnpm build`; check a real unpacked wheel with
`node gallery/script/check-gallery-exclusion.mjs build/checks/production.json /path/to/unpacked-wheel`.

## GitHub Pages

Choose **GitHub Actions** in Settings → Pages, restrict the `github-pages` deployment
environment to `main`, allow Actions PR comments and writes to the dedicated
`gh-pages` data branch, then set `GALLERY_PAGES_ENABLED=true` as an Actions variable.
An unrelated existing `gh-pages` branch is not adopted. Configure custom domains
before building; the Pages API supplies the URL prefix. Verify permissions and
fork approvals in the first repository before enabling another.

Main publishes at the Pages URL; PR previews use `/pr/<number>/`. Authors with
write/maintain/admin access get previews automatically. A maintainer's **Re-run all
jobs** in Gallery build approves the exact external PR SHA and run attempt; each
new SHA needs approval. Edit the PR description for a fresh run if reruns expired.
One sticky comment tracks status/links; failures retain the last published preview.
Closing a PR removes its preview on the next successful deployment; **Gallery Pages
→ Run workflow** reconciles closed previews and retries saved authorized candidates.

PR checks use read-only permissions without secrets; publishing executes Main code
and validates artifacts as data. Publication waits for all required checks and official
deployment. Main and previews share an origin; approval reviews the hosted code.
The publisher keeps its serialized queue and append-only state.
