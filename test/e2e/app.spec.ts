import { expect, test } from "@playwright/test";

import {
  defineParallelSmokeTests,
  expectNoPageErrors,
  NAVIGATION_TIMEOUT,
  trackPageErrors,
} from "./helpers";
import { expectKnxViewReady, goToKnxRoute, unmockedCalls } from "./app/helpers";
import type { ScenarioName } from "./app/src/scenarios";

interface RouteCase {
  /** Path below /knx/; "" is the bare panel URL. */
  path: string;
  /** Element the router renders for it. */
  tag: string;
}

interface ScenarioRoutes {
  scenario: ScenarioName;
  routes: readonly RouteCase[];
}

const ROUTE_SMOKE_TESTS: readonly ScenarioRoutes[] = [
  {
    scenario: "default",
    routes: [
      { path: "", tag: "knx-dashboard" },
      { path: "dashboard", tag: "knx-dashboard" },
      { path: "info", tag: "knx-info" },
      { path: "group_monitor", tag: "knx-group-monitor" },
      { path: "project", tag: "knx-project-view" },
      { path: "entities", tag: "knx-entities-router" },
      { path: "expose", tag: "knx-expose-router" },
      { path: "dpt_reference", tag: "knx-dpt-reference" },
    ],
  },
  {
    scenario: "no-project",
    routes: [{ path: "project", tag: "knx-project-view" }],
  },
];

defineParallelSmokeTests({
  groups: ROUTE_SMOKE_TESTS,
  groupName: ({ scenario }) => `route smoke tests (${scenario})`,
  cases: ({ routes }) => routes,
  testName: ({ path }) => `/knx/${path} renders`,
  run: async ({ page, group, smokeCase }) => {
    const errors = trackPageErrors(page);
    await goToKnxRoute(page, smokeCase.path, group.scenario);
    await expectKnxViewReady(page, smokeCase.tag);
    expectNoPageErrors(errors, `/knx/${smokeCase.path}`);
    expect(await unmockedCalls(page), "WebSocket commands without a mock").toEqual([]);
  },
});

test.describe("harness", () => {
  test("records WebSocket commands that have no mock", async ({ page }) => {
    await goToKnxRoute(page, "dpt_reference");
    await expectKnxViewReady(page, "knx-dpt-reference");
    await page.evaluate(() =>
      window.__mockHass.callWS({ type: "e2e/not_mocked" }).catch(() => undefined),
    );
    expect(await unmockedCalls(page)).toEqual(["e2e/not_mocked"]);
  });

  test("rejects an unknown scenario", async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto("/knx/dashboard?scenario=does-not-exist", { timeout: NAVIGATION_TIMEOUT });
    await expect
      .poll(() => errors.map((error) => (typeof error === "string" ? error : error.message)))
      .toContainEqual(expect.stringContaining('Unknown e2e scenario "does-not-exist"'));
  });
});
