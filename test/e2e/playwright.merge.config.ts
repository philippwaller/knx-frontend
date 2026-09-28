import { defineConfig } from "@playwright/test";

// Used by `playwright merge-reports`: one HTML report for people, JUnit for Codecov Test
// Analytics. JUnit stays outside the HTML folder, which the HTML reporter replaces.
export default defineConfig({
  reporter: [
    ["html", { outputFolder: "reports/combined", open: "never" }],
    ["junit", { outputFile: "reports/junit.xml" }],
  ],
});
