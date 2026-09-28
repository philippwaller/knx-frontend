#!/usr/bin/env node
// Collects the blob reports of the given suites into one staging directory so
// `playwright merge-reports` can consume them from a single path.
//
// Usage: node test/e2e/collect-blob-reports.mjs <suite> [<suite> ...]

import { cpSync, mkdirSync, readdirSync, rmSync } from "fs";
import { join, relative } from "path";

const findBlobReports = (dir) => {
  const files = [];
  const walk = (currentDir) => {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const entryPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
      } else if (entry.name.endsWith(".zip")) {
        files.push(entryPath);
      }
    }
  };

  try {
    walk(dir);
  } catch {
    return undefined;
  }

  return files;
};

const suites = process.argv.slice(2);
if (!suites.length) {
  process.stderr.write("Usage: collect-blob-reports.mjs <suite> [<suite> ...]\n");
  process.exit(1);
}

const dest = "test/e2e/reports/blob";
rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });

for (const suite of suites) {
  const src = `test/e2e/reports/${suite}`;
  const files = findBlobReports(src);
  if (!files?.length) {
    // The suite's job was skipped or failed before uploading a report.
    process.stderr.write(
      `Warning: no blob reports found for suite "${suite}" in ${src}, skipping.\n`,
    );
    continue;
  }
  for (const file of files) {
    const name = relative(src, file).replace(/[\\/]/g, "-");
    cpSync(file, join(dest, `${suite}-${name}`));
  }
}
