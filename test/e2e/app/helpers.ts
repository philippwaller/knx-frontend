import { expect, type Page } from "@playwright/test";

import { NAVIGATION_TIMEOUT, PANEL_TIMEOUT } from "../helpers";
import type { ScenarioName } from "./src/scenarios";

/** How long the WebSocket connection must be quiet before we trust `__unmockedCalls`. */
const WS_IDLE_MS = 1_000;

/** Opens a KNX panel route in the harness and waits until the fake `hass` exists. */
export const goToKnxRoute = async (
  page: Page,
  path: string,
  scenario: ScenarioName = "default",
) => {
  const query = scenario === "default" ? "" : `?scenario=${scenario}`;
  await page.goto(`/knx/${path}${query}`, { timeout: NAVIGATION_TIMEOUT });
  await page.waitForFunction(() => window.__mockHass !== undefined, undefined, {
    timeout: NAVIGATION_TIMEOUT,
  });
};

/**
 * Waits until the view element is in the DOM, every loading screen is gone and no error page is
 * shown. Playwright's CSS selectors pierce shadow roots, so plain tag names are enough.
 */
export const expectKnxViewReady = async (page: Page, viewTag: string) => {
  await expect(page.locator(viewTag), `<${viewTag}> is rendered`).toBeAttached({
    timeout: PANEL_TIMEOUT,
  });
  await expect(page.locator("hass-loading-screen"), "no loading screen is left").toHaveCount(0, {
    timeout: PANEL_TIMEOUT,
  });
  await expect(
    page.locator("knx-error, knx-not-found, hass-error-screen"),
    "no error page is shown",
  ).toHaveCount(0);
};

/**
 * Waits until no WebSocket command is in flight and none has started or settled for
 * `WS_IDLE_MS`. Some views (for example the group monitor) send their first commands only after
 * async work like an IndexedDB restore, once the view itself is already rendered, so a
 * single readiness check can race ahead of a rejection that would otherwise reveal a missing
 * mock.
 */
export const waitForWebSocketIdle = async (page: Page) => {
  await expect
    .poll(
      () =>
        page.evaluate((idleMs) => {
          const activity = window.__wsActivity;
          const idle =
            activity.inFlight === 0 && performance.now() - activity.lastActivity >= idleMs;
          return idle ? "idle" : `WebSocket stays busy (in flight: ${activity.inFlight})`;
        }, WS_IDLE_MS),
      { timeout: PANEL_TIMEOUT, intervals: [250] },
    )
    .toBe("idle");
};

/** WebSocket command types the page sent without a registered mock. */
export const unmockedCalls = async (page: Page) => {
  await waitForWebSocketIdle(page);
  return page.evaluate(() => [...window.__unmockedCalls]);
};
