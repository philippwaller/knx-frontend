import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata, observe } from "./helpers";

const copy = en.components["knx-tabs-subpage-data-toolbar"];
export const entry: GalleryEntry = {
  meta: metadata(
    "knx-tabs-subpage-data-toolbar",
    copy,
    {},
    ["leading", "search", "trailing", "summary"],
    ["click", "input"],
    ["search-hidden"],
    [],
    {},
  ),
  covers: ["knx-tabs-subpage-data-toolbar"],
  async load() {
    const [{ html, nothing }] = await Promise.all([
      import("lit"),
      import("../../../src/layouts/knx-tabs-subpage-data-toolbar"),
      import("@ha/components/chips/ha-assist-chip"),
      import("@ha/components/input/ha-input-search"),
    ]);

    return {
      render: (_env, _values, slots, emit) => {
        const on = observe(emit);
        return html`<knx-tabs-subpage-data-toolbar
          >${slots.includes("leading") ? html`<ha-assist-chip slot="leading" .label=${en.sample.action} @click=${on}></ha-assist-chip>` : nothing}${slots.includes("search") ? html`<ha-input-search slot="search" .placeholder=${en.sample.search} @input=${on}></ha-input-search>` : nothing}${slots.includes("trailing") ? html`<ha-assist-chip slot="trailing" .label=${en.sample.action} @click=${on}></ha-assist-chip>` : nothing}${slots.includes("summary") ? html`<ha-assist-chip slot="summary" .label=${en.sample.action} @click=${on}></ha-assist-chip>` : nothing}</knx-tabs-subpage-data-toolbar
        >`;
      },
    };
  },
};
