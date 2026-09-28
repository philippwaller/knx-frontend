import { describe, expect, it } from "vitest";
import { applyElements, captureElements, isPreviewState } from "./preview-state";

describe("preview state", () => {
  it("preserves Sets and cleared values through JSON in nested shadow roots", async () => {
    const make = () => {
      const root = document.createElement("div");
      const tree = document.createElement("knx-project-devices-view");
      Object.assign(tree, { _expanded: new Set(["device-1"]), searchText: "Kitchen" });
      const shadow = tree.attachShadow({ mode: "open" });
      const selector = document.createElement("knx-single-address-selector");
      Object.assign(selector, { value: undefined });
      shadow.append(selector);
      root.append(tree);
      return { root, tree, selector };
    };
    const source = make();
    const target = make();
    Object.assign(target.tree, { _expanded: new Set(), searchText: "Bedroom" });
    Object.assign(target.selector, { value: "1/2/3" });
    const state = JSON.parse(
      JSON.stringify({ elements: captureElements(source.root), dialogs: [], route: "" }),
    );
    expect(isPreviewState(state)).toBe(true);
    await applyElements(target.root, state.elements);
    expect(Reflect.get(target.tree, "_expanded")).toEqual(new Set(["device-1"]));
    expect(Reflect.get(target.tree, "searchText")).toBe("Kitchen");
    expect(Reflect.get(target.selector, "value")).toBeUndefined();
  });

  it("rejects arbitrary property paths and skips replaced nodes and file inputs", async () => {
    const root = document.createElement("div");
    const field = document.createElement("input");
    field.type = "file";
    root.append(field);
    expect(captureElements(root)).toEqual([]);
    const state = {
      elements: [{ path: [0], tag: "input", values: { value: { kind: "json", value: "text" } } }],
      dialogs: [],
      route: "",
    };
    expect(isPreviewState(state)).toBe(true);
    expect(
      isPreviewState({
        ...state,
        elements: [
          { ...state.elements[0], values: { innerHTML: { kind: "json", value: "<script>" } } },
        ],
      }),
    ).toBe(false);
    expect(isPreviewState({ ...state, route: "https://other.example/" })).toBe(false);
    await applyElements(root, state.elements as Parameters<typeof applyElements>[1]);
    expect(field.value).toBe("");
    const replacement = document.createElement("textarea");
    replacement.value = "preserved";
    field.replaceWith(replacement);
    await applyElements(root, state.elements as Parameters<typeof applyElements>[1]);
    expect(replacement.value).toBe("preserved");
  });
});
