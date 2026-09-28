import { test } from "@playwright/test";

import { expectNoPageErrors, trackPageErrors } from "./helpers";
import { expectKnxViewReady, goToKnxRoute } from "./app/helpers";

test("/knx/dpt_reference renders", async ({ page }) => {
  const errors = trackPageErrors(page);
  await goToKnxRoute(page, "dpt_reference");
  await expectKnxViewReady(page, "knx-dpt-reference");
  expectNoPageErrors(errors, "/knx/dpt_reference");
});
