import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { catalog } from "./catalog";
import { resolveValues } from "./state";
import { observe } from "./examples/helpers";
import type { GalleryEvent } from "./types";

const components =
  `knx-separator flex-content-expansion-panel knx-sticky-expansion-panel knx-tabs-subpage-data knx-tabs-subpage-data-filter-pane knx-tabs-subpage-data-toolbar knx-table-cell knx-table-cell-filterable knx-data-table-ga-label knx-data-table-related-label knx-list-filter knx-time-delta-filter knx-time-range-filter knx-sort-menu knx-sort-menu-item knx-form knx-selector-row knx-sync-state-selector-row knx-single-address-selector knx-group-address-selector knx-dpt-option-selector knx-dpt-dialog-selector knx-payload-selector knx-select-options-list knx-device-picker knx-configure-entity knx-expose-template-preview knx-project-device-tree knx-project-tree-view knx-project-devices-view`.split(
    " ",
  );

describe("component catalog", () => {
  it("contains the 30 real reusable components", () => {
    expect(
      catalog
        .filter(({ meta }) => meta.category === "components")
        .map(({ meta }) => meta.tag)
        .sort(),
    ).toEqual(components.sort());
  });
  it("has unique identities and documented, valid controls and scenarios", () => {
    expect(new Set(catalog.map(({ meta }) => meta.id)).size).toBe(catalog.length);
    for (const { meta } of catalog) {
      expect(meta.description).not.toBe("");
      expect(meta.scenarios.length).toBeGreaterThan(0);
      expect(new Set(meta.controls.map(({ key }) => key)).size).toBe(meta.controls.length);
      for (const control of meta.controls) {
        expect(control.label).not.toBe("");
        expect(
          meta.api.find(({ name, description }) => name === control.key && description),
        ).toBeDefined();
      }
      for (const scenario of meta.scenarios) {
        expect(() => resolveValues(meta, scenario.id, {})).not.toThrow();
      }
    }
  });
});

it("observes Event-with-detail payloads while keeping plain events target-free", () => {
  const events: GalleryEvent[] = [];
  const target = new EventTarget();
  target.addEventListener(
    "sample",
    observe((event) => events.push(event)),
  );
  target.dispatchEvent(new Event("sample"));
  target.dispatchEvent(Object.assign(new Event("sample"), { detail: { direction: "desc" } }));
  expect(events).toEqual([
    { kind: "event", name: "sample", timestamp: expect.any(Number), args: null },
    { kind: "event", name: "sample", timestamp: expect.any(Number), args: { direction: "desc" } },
  ]);
});

it("contains seven offline dialogs with correctly documented callbacks", () => {
  const dialogs = catalog.filter(({ meta }) => meta.category === "dialogs");
  expect(dialogs.map(({ meta }) => meta.tag).sort()).toEqual([
    "knx-device-create-dialog",
    "knx-dpt-select-dialog",
    "knx-ga-select-dialog",
    "knx-group-monitor-telegram-info-dialog",
    "knx-project-upload-dialog",
    "knx-send-dialog",
    "knx-time-server-dialog",
  ]);
  for (const { meta } of dialogs) {
    for (const api of meta.api) expect(api.description).toBeTruthy();
    const callback = meta.api.find(({ name }) => name === "onClose");
    if (callback) expect(callback.kind).toBe("callback");
  }
});

it("assigns every permanent source registration to exactly one example", () => {
  const sourceRoot = join(import.meta.dirname, "../../src");
  const registeredTags = new Set<string>();
  for (const path of readdirSync(sourceRoot, { recursive: true }) as string[]) {
    if (!path.endsWith(".ts") || /\.(?:test|stub)\./.test(path)) continue;
    const source = readFileSync(join(sourceRoot, path), "utf8");
    for (const match of source.matchAll(
      /@customElement\(["']([^"']+)["']\)|customElements\.define\(["']([^"']+)["']/g,
    )) {
      registeredTags.add(match[1] ?? match[2]);
    }
  }
  expect(registeredTags.size).toBe(51);
  expect(catalog).toHaveLength(48);
  const covered = catalog.flatMap(({ covers }) => covers);
  expect(new Set(covered).size).toBe(covered.length);
  expect(new Set(covered)).toEqual(registeredTags);
});
