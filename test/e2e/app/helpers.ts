import { expect, type Page } from "@playwright/test";

import { NAVIGATION_TIMEOUT, PANEL_TIMEOUT } from "../helpers";
import type { ScenarioName } from "./src/scenarios";

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

/** WebSocket command types the page sent without a registered mock. */
export const unmockedCalls = (page: Page) => page.evaluate(() => [...window.__unmockedCalls]);
