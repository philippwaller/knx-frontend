// @vitest-environment node
/* eslint-disable no-template-curly-in-string -- GitHub Actions expressions are literal workflow data. */
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { load } from "js-yaml";
import { expect, it } from "vitest";

const workflow = (name: string): any => load(readFileSync(`.github/workflows/${name}.yml`, "utf8"));

it("cancels only superseded validation runs for the same PR", () => {
  expect(workflow("gallery-build").concurrency).toEqual({
    group:
      "${{ github.workflow }}-${{ github.event_name }}-${{ github.event.pull_request.number || github.run_id }}",
    "cancel-in-progress": "${{ github.event_name == 'pull_request' }}",
  });
  expect(workflow("gallery-pages").concurrency).toEqual({ group: "gallery-pages", queue: "max" });
});

it.each([
  ["build", "pnpm gallery:build"],
  ["release-check", "KNX_BUILD_STATS=1 pnpm build"],
])(
  "restores a role-specific Babel cache before %s compilation and saves only on Main pushes",
  (role, command) => {
    const job = workflow("gallery-build").jobs[role];
    // The runner context is available in step env, but forbidden in job env.
    expect(job.env?.BABEL_CACHE_DIR).toBeUndefined();
    const restoreIndex = job.steps.findIndex(({ uses }: { uses?: string }) =>
      uses?.startsWith("actions/cache/restore@"),
    );
    const compileIndex = job.steps.findIndex(({ run }: { run?: string }) => run === command);
    const pruneIndex = job.steps.findIndex(
      ({ name }: { name?: string }) => name === "Prune old Babel cache entries",
    );
    const saveIndex = job.steps.findIndex(({ uses }: { uses?: string }) =>
      uses?.startsWith("actions/cache/save@"),
    );
    expect(restoreIndex).toBeGreaterThan(-1);
    expect(restoreIndex).toBeLessThan(compileIndex);
    expect(pruneIndex).toBeGreaterThan(compileIndex);
    expect(saveIndex).toBeGreaterThan(pruneIndex);
    expect(job.steps[compileIndex].env?.BABEL_CACHE_DIR).toBe("${{ runner.temp }}/babel-loader");
    expect(job.steps[pruneIndex].env?.BABEL_CACHE_DIR).toBe("${{ runner.temp }}/babel-loader");
    const restore = job.steps[restoreIndex];
    expect(restore.with).toEqual({
      path: "${{ runner.temp }}/babel-loader",
      key: "gallery-babel-loader-${{ runner.os }}-${{ github.job }}-${{ hashFiles('.nvmrc', 'pnpm-lock.yaml', 'pnpm-workspace.yaml') }}-${{ needs.gate.outputs.sha }}",
      "restore-keys":
        "gallery-babel-loader-${{ runner.os }}-${{ github.job }}-${{ hashFiles('.nvmrc', 'pnpm-lock.yaml', 'pnpm-workspace.yaml') }}-\n" +
        "babel-loader-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}-\n",
    });
    const mainPush = "github.event_name == 'push' && github.ref == 'refs/heads/main'";
    expect(job.steps[pruneIndex].if).toBe(mainPush);
    expect(job.steps[pruneIndex].run).toBe('find "$BABEL_CACHE_DIR" -type f -mtime +30 -delete');
    expect(job.steps[saveIndex].if).toBe(mainPush);
    expect(job.steps[saveIndex].with).toEqual({
      path: "${{ runner.temp }}/babel-loader",
      key: "${{ steps.babel-cache.outputs.cache-primary-key }}",
    });
    expect(
      job.steps.filter(({ uses }: { uses?: string }) => uses?.startsWith("actions/cache/")),
    ).toHaveLength(2);
  },
);

it("pins every external Gallery validation Action to a commit", () => {
  for (const job of Object.values(workflow("gallery-build").jobs) as any[]) {
    for (const step of job.steps) {
      if (step.uses && !step.uses.startsWith("./")) {
        expect(step.uses).toMatch(/@[a-f0-9]{40}$/);
      }
    }
  }
});

it("keeps PR execution outside privileged jobs", () => {
  const build = workflow("gallery-build");
  const publisher = workflow("gallery-pages");
  expect(build.on.pull_request.types).toContain("synchronize");
  expect(build.jobs.gate.steps[0].with.ref).toBe("main");
  // Until main contains the gate, the PR introducing it builds like ordinary PR CI.
  const gate = build.jobs.gate.steps[1];
  expect(gate.run).toMatch(/if \[ -f gallery\/script\/gallery_pages\.py \]/);
  expect(gate.run).toContain("base_path=/");
  expect(gate.run).not.toContain("${{");
  for (const job of [build.jobs.build, build.jobs["browser-tests"], build.jobs["release-check"]]) {
    expect(job.permissions).toEqual({ contents: "read" });
    expect(job.steps[0].with["persist-credentials"]).toBe(false);
    expect(job.steps[0].with.ref).toBe("${{ needs.gate.outputs.sha }}");
  }
  for (const job of [build.jobs["browser-tests"], build.jobs["release-check"]]) {
    expect(job.needs).toEqual(["gate", "build"]);
    const artifact = job.steps.find(({ uses }: { uses?: string }) =>
      uses?.startsWith("actions/download-artifact@"),
    );
    expect(artifact.with).toEqual({
      name: "gallery-${{ github.run_id }}-${{ github.run_attempt }}",
      path: "build/gallery/",
    });
    expect(job.steps.some(({ run }: { run?: string }) => run?.includes("gallery:build"))).toBe(
      false,
    );
  }
  expect(build.jobs["browser-tests"].strategy.matrix.shard).toEqual([1, 2]);
  // The interactive tests reuse the built gallery at its Pages base path.
  const interactive = build.jobs["browser-tests"].steps.find(
    ({ name }: { name?: string }) => name === "Test interactive gallery",
  );
  expect(interactive.env).toEqual({ GALLERY_E2E_PRODUCTION: "1" });
  expect(interactive.run).toBe("pnpm gallery:test --workers=2 --shard=${{ matrix.shard }}/2");
  expect(publisher.on.pull_request_target.types).toContain("closed");
  expect(publisher.jobs.prepare.if).not.toContain("startsWith");
  expect(publisher.on.issue_comment).toBeUndefined();
  expect(publisher.on.workflow_run.types).toEqual(["in_progress", "completed"]);
  expect(build.jobs.gate.permissions.actions).toBe("read");
  expect(publisher.jobs.prepare.permissions.actions).toBe("read");
  expect(publisher.jobs.finish.permissions.actions).toBe("read");
  expect(publisher.concurrency).toEqual({ group: "gallery-pages", queue: "max" });
  expect(publisher.jobs.deploy.permissions).toEqual({
    contents: "read",
    actions: "read",
    "pull-requests": "read",
    pages: "write",
    "id-token": "write",
  });
  for (const name of ["prepare", "deploy", "finish"]) {
    const job = publisher.jobs[name];
    expect(job.steps[0].with.ref).toBe("main");
    expect(job.steps[0].with.submodules).toBeUndefined();
    expect(job.steps[0].with["persist-credentials"]).toBe(false);
    expect(JSON.stringify(job)).not.toMatch(
      /npm |yarn |actions\/cache|\.\/\.github\/actions\/setup/,
    );
  }
  for (const job of Object.values(publisher.jobs) as any[]) {
    for (const step of job.steps) {
      if (step.uses) expect(step.uses).toMatch(/@[a-f0-9]{40}$/);
      if (step.run) expect(step.run).not.toContain("${{ github.event.");
    }
  }
});

it("runs read-only exact-head Gallery checks without a preview gate dependency", () => {
  const build = workflow("gallery-build");
  expect(build.permissions).toEqual({});
  const checks = build.jobs.checks;
  expect(checks).toBeDefined();
  expect(checks.needs).toBeUndefined();
  expect(checks.if).toBeUndefined();
  expect(checks.permissions).toEqual({ contents: "read" });
  expect(checks.steps[0].with).toEqual({
    ref: "${{ github.event.pull_request.head.sha || github.sha }}",
    submodules: "recursive",
    "persist-credentials": false,
  });
  const runs = checks.steps.map(({ run }: { run?: string }) => run).filter(Boolean);
  expect(runs).toEqual([
    "SKIP_FETCH_NIGHTLY_TRANSLATIONS=1 pnpm exec gulp gen-icons-json build-translations build-locale-data",
    "pnpm gallery:policy",
    "pnpm gallery:lint",
    "pnpm gallery:types",
    "pnpm gallery:unit",
  ]);
  expect(JSON.stringify(checks)).not.toMatch(/secrets\.|needs\.gate/);
});

it("requires successful checks as well as preview approval before building", () => {
  const build = workflow("gallery-build").jobs.build;
  expect(build.needs).toEqual(["gate", "checks"]);
  expect(build.if).toBe("needs.gate.outputs.build == 'true'");
});

it.each([
  ["new", ["gallery/script/gallery_pages.py"], "new\n"],
  ["legacy", ["build-scripts/gallery_pages.py"], "legacy\n"],
  ["both", ["gallery/script/gallery_pages.py", "build-scripts/gallery_pages.py"], "new\n"],
  ["bootstrap", [], "build=true\nsha=fixture-head\nbase_path=/\n"],
])("selects the %s trusted Main gate", (_name, paths, expected) => {
  const gate = workflow("gallery-build").jobs.gate;
  expect(gate.steps[0].with.ref).toBe("main");
  expect(gate.steps[0].with["persist-credentials"]).toBe(false);
  const root = mkdtempSync(join(tmpdir(), "gallery-gate-"));
  const output = join(root, "output");
  try {
    for (const path of paths) {
      const target = join(root, path);
      mkdirSync(join(target, ".."), { recursive: true });
      writeFileSync(
        target,
        `import os, sys\nassert sys.argv[1:] == ["gate"]\nwith open(os.environ["GITHUB_OUTPUT"], "a") as f: f.write("${path.startsWith("gallery/") ? "new" : "legacy"}\\n")\n`,
      );
    }
    execFileSync("bash", ["-eu", "-c", gate.steps[1].run], {
      cwd: root,
      env: { ...process.env, GITHUB_OUTPUT: output, HEAD_SHA: "fixture-head" },
    });
    expect(readFileSync(output, "utf8")).toBe(expected);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("keeps product CI free of Gallery-only checks while retaining wheel and size checks", () => {
  const ci = workflow("ci");
  expect(JSON.stringify(ci)).not.toMatch(/gallery|build-locale-data|KNX_BUILD_STATS/);
  expect(ci.jobs.build.steps.some(({ run }: { run?: string }) => run === "pnpm build")).toBe(true);
  expect(ci.jobs.build.steps.some(({ name }: { name?: string }) => name === "Build wheel")).toBe(
    true,
  );
  expect(ci.jobs.size.needs).toBe("build");
  expect(
    ci.jobs.types.steps.some(
      ({ run }: { run?: string }) => run === "pnpm exec gulp gen-icons-json build-translations",
    ),
  ).toBe(true);
  expect(
    ci.jobs.coverage.steps.find(({ uses }: { uses?: string }) => uses?.startsWith("codecov/")).with
      .directory,
  ).toBe("./test/coverage");
});
