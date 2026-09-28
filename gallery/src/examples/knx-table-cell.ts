import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata } from "./helpers";

const copy = en.components["knx-table-cell"];
export const entry: GalleryEntry = {
  meta: metadata("knx-table-cell", copy, {}, ["primary", "secondary"], [], [], [], {}),
  covers: ["knx-table-cell"],
  async load() {
    const [{ html, nothing }] = await Promise.all([
      import("lit"),
      import("../../../src/components/data-table/cell/knx-table-cell"),
    ]);

    return {
      render: (_env, _values, slots, _emit) => {
        return html`<knx-table-cell
          >${slots.includes("primary") ? html`<div slot="primary">${en.sample.content}</div>` : nothing}${slots.includes("secondary") ? html`<div slot="secondary">${en.sample.content}</div>` : nothing}</knx-table-cell
        >`;
      },
    };
  },
};
