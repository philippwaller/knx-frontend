import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata, observe } from "./helpers";

const copy = en.components["knx-table-cell-filterable"];
export const entry: GalleryEntry = {
  meta: metadata(
    "knx-table-cell-filterable",
    copy,
    {
      filterValue: "1/0/1",
      filterDisplayText: "Living room light",
      filterActive: false,
      filterDisabled: false,
    },
    ["primary", "secondary"],
    ["toggle-filter"],
    ["knx"],
    [
      { id: "active", label: en.scenarios["active"], values: { filterActive: true } },
      { id: "disabled", label: en.scenarios["disabled"], values: { filterDisabled: true } },
    ],
    {},
  ),
  covers: ["knx-table-cell-filterable"],
  async load() {
    const [{ html, nothing }] = await Promise.all([
      import("lit"),
      import("../../../src/components/data-table/cell/knx-table-cell-filterable"),
    ]);

    return {
      render: (env, values, slots, emit) => {
        const on = observe(emit);
        return html`<knx-table-cell-filterable
          .filterValue=${values.filterValue as string}
          .filterDisplayText=${values.filterDisplayText as string}
          .filterActive=${values.filterActive as boolean}
          .filterDisabled=${values.filterDisabled as boolean}
          .knx=${env.knx}
          @toggle-filter=${on}
          >${slots.includes("primary") ? html`<div slot="primary">${en.sample.content}</div>` : nothing}${slots.includes("secondary") ? html`<div slot="secondary">${en.sample.content}</div>` : nothing}</knx-table-cell-filterable
        >`;
      },
    };
  },
};
