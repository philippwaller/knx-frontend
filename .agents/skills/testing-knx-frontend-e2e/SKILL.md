---
name: testing-knx-frontend-e2e
description: Use when adding, changing or running tests in knx-frontend, choosing between Vitest and the Playwright end-to-end suite, adding a view, route or WebSocket command that the e2e harness must mock, or when an e2e test fails locally or in the E2E workflow.
---

# Testing knx-frontend end to end

## Overview

The Playwright suite in `test/e2e/` runs the production `<knx-frontend>` in Chromium against a
fake Home Assistant (`<knx-test>` harness, `provideHass()` plus `hass.mockWS`). It catches what
Vitest in jsdom cannot: routing, lazy view loading, real rendering, missing backend calls. Details
of the harness live in `test/e2e/README.md`; read it before changing the harness.

## Choosing the test

| Change                                                           | Test                                                    |
| ---------------------------------------------------------------- | ------------------------------------------------------- |
| Pure logic, utils, data transforms, controllers                  | Vitest (`*.test.ts` next to the code)                   |
| A component's rendering or events in isolation                   | Vitest                                                  |
| A view, routing, navigation, or what a view sends to the backend | Playwright                                              |
| A new route                                                      | Add it to `ROUTE_SMOKE_TESTS` in `test/e2e/app.spec.ts` |
| A view starts using a new WebSocket command                      | Mock it in `test/e2e/app/src/mock-ws.ts`                |
| Documentation only                                               | No test                                                 |

## Extending the harness

1. Write or extend the test first and run it:
   `yarn test:e2e:app -g "<title>" --project=chromium`.
2. Read the failure. `WebSocket commands without a mock: [...]` lists commands to add to
   `registerMocks`. Type the answer with the command's response type and put the data in
   `test/e2e/app/src/fixtures/`.
3. Need another backend state? Add a scenario in `test/e2e/app/src/scenarios.ts`; never branch
   on test names inside the harness.
4. Run the whole suite on both projects: `yarn test:e2e:app`.

## Rules

- Never point a test at a real Home Assistant, and never mock at the network layer for panel
  views; mock through `hass.mockWS`.
- Reuse `test/e2e/helpers.ts` (timeouts, `trackPageErrors`, `expectNoPageErrors`,
  `defineParallelSmokeTests`) and `test/e2e/app/helpers.ts`. No `page.waitForTimeout`.
- Assert on elements and roles, not translated text: backend translations are not loaded.
- Do not add to `IGNORED_PAGE_ERRORS` to get green; fix the fixture or the code.
- `[KNX] "…" is stubbed out` console errors are expected; page errors are not.

## Fast loop

Start `yarn test:e2e:app:dev` (port 8095, rebuilds on save) in the background, then run narrow
tests with `-g` and `--project=chromium`. Playwright reuses the running server. Run commands
directly; piping through `head` or `tail` hides progress and failures.

## Pitfalls

- A green run against the dev server is not CI. CI builds once from scratch, runs two shards in
  the Playwright container with one worker and one retry. Check the `E2E` workflow before calling
  e2e work verified.
- `Executable doesn't exist`: run `yarn playwright install chromium`.
- The container image tag comes from `@playwright/test` in `package.json`
  (`test/e2e/playwright-version.mjs`). Never write an image version into the workflow.
- After `script/upgrade-frontend`, harness failures are expected signal: `provideHass()` and HA
  components come from the submodule. Fix the harness in the upgrade pull request.
- Port 8095 already taken by something else makes Playwright reuse the wrong server; stop it.
- `unmockedCalls` only waits for a second of WebSocket quiet before reading the recorded calls: a
  view that sends its first command more than a second after the last WebSocket activity escapes
  the check. Assert on the rendered data in such a test instead.

## Verification

- Harness or test change: `yarn test:e2e:app` passes on both projects, then `yarn lint`.
- Build-script change: `yarn gulp build-e2e-test-app` and `yarn build` both succeed.
- Workflow change: the `E2E` workflow passes on the pull request.
