# End-to-end tests

Playwright tests for the KNX panel. They run the production `<knx-frontend>` element in
Chromium (desktop and a Pixel 7 profile) against a fake Home Assistant, so no server is needed.
The setup follows the `app` suite of the Home Assistant frontend (`homeassistant-frontend/test/e2e`).

## Layout

| Path                        | Purpose                                                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/src/knx-test.ts`       | `<knx-test>` harness: creates the fake `hass`, registers the mocks, mounts `<knx-frontend>` with `route` and `narrow` like Home Assistant does          |
| `app/src/mock-ws.ts`        | A mock for every WebSocket command the panel sends while its views load                                                                                 |
| `app/src/fixtures/`         | Typed data the mocks answer with: one small installation (4 group addresses, 2 devices, 2 entities, 1 expose)                                           |
| `app/src/scenarios.ts`      | Variants of the fixtures, selected with `?scenario=<name>`                                                                                              |
| `app/src/unmocked-calls.ts` | Records commands sent without a mock in `window.__unmockedCalls`, and WebSocket activity (in-flight count, last activity time) in `window.__wsActivity` |
| `app/helpers.ts`            | Test-side helpers: `goToKnxRoute`, `expectKnxViewReady`, `waitForWebSocketIdle`, `unmockedCalls`                                                        |
| `helpers.ts`                | Shared timeouts, page-error tracking and `defineParallelSmokeTests`                                                                                     |
| `app.spec.ts`               | Route smoke tests and harness self-tests                                                                                                                |
| `playwright.app.config.ts`  | Suite config: port 8095, projects, reporters, web server                                                                                                |

The harness is built by `gulp build-e2e-test-app` (defined in
`build-scripts/gulp/e2e-test-app.js`) into `app/dist`. It uses the same rspack configuration and
module stubs as the shipped panel, so console errors like `[KNX] "…" is stubbed out in this
build` are expected.

## How the fake Home Assistant works

`provideHass()` from the Home Assistant frontend (`@ha/fake_data/provide_hass`) creates `hass`.
`hass.callWS()` and `hass.connection.subscribeMessage()` are answered by handlers registered with
`hass.mockWS(type, handler)`:

- A request handler returns the response: `hass.mockWS("knx/get_base_data", () => fixtures.baseData)`.
- A subscription handler receives `onChange` as third argument, may push data through it, and
  must return an unsubscribe function.
- A command without a handler is rejected. The harness records it, and every smoke test fails
  with `WebSocket commands without a mock` naming it. A missing mock therefore never passes as an
  empty table.

Some views (the group monitor, for example) send their first command only after async work such
as an IndexedDB restore, once the view itself is already rendered, so `unmockedCalls` first waits
until the WebSocket connection has had no command in flight and no activity for a second before
reading `window.__unmockedCalls`.

Backend translations are not loaded, so views show translation keys instead of English text.
Assert on elements and roles, not on translated text.

`window.__mockHass` gives tests access to the fake, for example
`page.evaluate(() => window.__mockHass.updateStates({...}))`.

## Adding a test for a new view or command

1. Add the route to `ROUTE_SMOKE_TESTS` in `app.spec.ts` with the element the router renders.
2. Run it: `yarn test:e2e:app -g "<path>" --project=chromium`.
3. For every command listed under `WebSocket commands without a mock`, add a mock to
   `registerMocks` in `app/src/mock-ws.ts`. Answer with fixture data typed with the response type
   from `src/services/websocket.service.ts` (KNX) or `homeassistant-frontend/src/data/` (Home
   Assistant). Put new data in `app/src/fixtures/` and add it to `KnxFixtures`.
4. If the view needs a different backend state, add a scenario to `app/src/scenarios.ts` and a
   group with that scenario to `ROUTE_SMOKE_TESTS`.
5. Interaction tests go in their own `test()` next to the smoke tests. Use `goToKnxRoute` and
   `expectKnxViewReady` first, then Playwright locators. CSS selectors pierce shadow roots, so a
   tag name such as `page.locator("knx-group-monitor ha-data-table")` is enough.

Use the timeouts from `helpers.ts` instead of literal numbers, never `page.waitForTimeout`, and
keep `trackPageErrors`/`expectNoPageErrors` in every test that loads a page. Do not add patterns
to `IGNORED_PAGE_ERRORS` to make a test pass; fix the fixture or the code.

## Debugging

- `yarn test:e2e:app --ui` or `--debug` opens Playwright's inspector.
- Failed tests keep a screenshot in `test-results/app/`; in CI, retried tests also record a trace
  and a video. Open the merged report with `yarn test:e2e:show-report`, or download the
  `playwright-report` artifact of the CI run.
- `yarn playwright install chromium` fixes `Executable doesn't exist` errors after a Playwright
  update.
