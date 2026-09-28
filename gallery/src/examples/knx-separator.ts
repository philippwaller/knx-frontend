import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry, JsonValue } from "../types";

const copy = en.examples.separator;

export const entry: GalleryEntry = {
  meta: {
    id: "knx-separator",
    tag: "knx-separator",
    title: en.separator,
    description: copy.description,
    category: "components",
    controls: [
      ...(
        [
          ["height", copy.height, 1],
          ["minHeight", copy.minHeight, 1],
          ["maxHeight", copy.maxHeight, 50],
          ["animationDuration", copy.animationDuration, 150],
        ] as const
      ).map(([key, label, defaultValue]) => ({
        key,
        label,
        kind: "number" as const,
        defaultValue,
        validate: (value: JsonValue) =>
          typeof value === "number" && value >= 0 ? undefined : en.validation.nonNegative,
      })),
      {
        key: "customClass",
        label: copy.customClass,
        kind: "text",
        defaultValue: "",
        validate: () => undefined,
      },
    ],
    slots: [{ name: "", label: copy.content }],
    scenarios: [
      { id: "default", label: copy.default, values: {} },
      { id: "expanded", label: copy.expanded, values: { height: 50 } },
    ],
    api: [
      {
        name: "height",
        kind: "property",
        description: copy.api.height,
        details: copy.api.heightDetails,
      },
      { name: "minHeight", kind: "property", description: copy.api.minHeight },
      { name: "maxHeight", kind: "property", description: copy.api.maxHeight },
      { name: "animationDuration", kind: "property", description: copy.api.animationDuration },
      { name: "customClass", kind: "property", description: copy.api.customClass },
      { name: "expansionRatio", kind: "property", description: copy.api.expansionRatio },
      { name: "setHeight(newHeight, animate?)", kind: "method", description: copy.api.setHeight },
      { name: "expand()", kind: "method", description: copy.api.expand },
      { name: "collapse()", kind: "method", description: copy.api.collapse },
      { name: "toggle()", kind: "method", description: copy.api.toggle },
      { name: "default", kind: "slot", description: copy.api.content },
    ],
  },
  covers: ["knx-separator"],
  async load() {
    const [{ html, nothing }] = await Promise.all([
      import("lit"),
      import("../../../src/components/knx-separator"),
    ]);
    return {
      render: (_env, values, slots) =>
        html`<knx-separator
          .height=${values.height as number}
          .minHeight=${values.minHeight as number}
          .maxHeight=${values.maxHeight as number}
          .animationDuration=${values.animationDuration as number}
          .customClass=${values.customClass as string}
          >${slots.includes("") ? copy.sampleContent : nothing}</knx-separator
        >`,
    };
  },
};
