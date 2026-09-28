import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata } from "./helpers";

const copy = en.components["knx-data-table-ga-label"];
export const entry: GalleryEntry = {
  meta: metadata(
    "knx-data-table-ga-label",
    copy,
    { groupAddresses: [{ address: "1/0/1", name: "Living room light" }] },
    [],
    [],
    [],
    [
      {
        id: "multiple",
        label: en.scenarios["multiple"],
        values: {
          groupAddresses: [
            { address: "1/0/1", name: "Living room light" },
            { address: "1/0/2", name: "Room temperature" },
          ],
        },
      },
      { id: "empty", label: en.scenarios["empty"], values: { groupAddresses: [] } },
    ],
    {},
  ),
  covers: ["knx-data-table-ga-label"],
  async load() {
    const [{ html }] = await Promise.all([
      import("lit"),
      import("../../../src/components/data-table/knx-data-table-ga-label"),
    ]);

    return {
      render: (_env, values, _slots, _emit) => {
        return html`<knx-data-table-ga-label
          .groupAddresses=${values.groupAddresses as { address: string; name: string }[]}
        ></knx-data-table-ga-label>`;
      },
    };
  },
};
