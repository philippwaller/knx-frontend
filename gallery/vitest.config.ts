import { defineConfig } from "vitest/config";
import shared from "../vitest.config.js";

export default defineConfig({
  ...shared,
  test: {
    ...shared.test,
    include: ["gallery/src/**/*.{test,spec}.ts", "gallery/test/**/*.{test,spec}.ts"],
    coverage: {
      ...shared.test?.coverage,
      include: ["gallery/src/**/*.ts"],
      reportsDirectory: "gallery/test/coverage",
    },
  },
});
