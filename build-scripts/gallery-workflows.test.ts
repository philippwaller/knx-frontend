// @vitest-environment node
import { readFileSync } from "node:fs";
import { load } from "js-yaml";
import { expect, it } from "vitest";

const workflow = (name: string): any => load(readFileSync(`.github/workflows/${name}.yml`, "utf8"));

it("keeps PR execution outside privileged jobs", () => {
  const build = workflow("gallery-build");
  const publisher = workflow("gallery-pages");
  expect(build.on.pull_request.types).toContain("synchronize");
  expect(build.jobs.gate.steps[0].with.ref).toBe("main");
  // Until main contains the gate, the PR introducing it builds like ordinary PR CI.
  const gate = build.jobs.gate.steps[1];
  expect(gate.run).toMatch(/if \[ -f build-scripts\/gallery_pages\.py \]/);
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
