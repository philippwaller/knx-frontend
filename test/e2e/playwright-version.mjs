#!/usr/bin/env node
// Prints the exact @playwright/test version from package.json. CI uses it to pick the Playwright
// container image, so the browsers in the container always match the library. The version comes
// from the homeassistant-frontend submodule through script/upgrade-frontend: never pin the image
// tag by hand.
//
// Usage: node test/e2e/playwright-version.mjs [path/to/package.json]

import { readFileSync } from "fs";

const file = process.argv[2] ?? "package.json";
const version = JSON.parse(readFileSync(file, "utf-8")).devDependencies?.["@playwright/test"];

if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) {
  process.stderr.write(
    `@playwright/test in ${file} must be an exact version (x.y.z) to select the Playwright ` +
      `container image, got "${version}".\n`,
  );
  process.exit(1);
}

process.stdout.write(`${version}\n`);
