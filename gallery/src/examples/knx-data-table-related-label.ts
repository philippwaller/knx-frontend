import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata } from "./helpers";

const copy = en.components["knx-data-table-related-label"];
export const entry: GalleryEntry = {
  meta: metadata(
    "knx-data-table-related-label",
    copy,
    {
      entities: ["light.living_room"],
      entitiesYaml: ["sensor.room_temperature"],
      exposes: ["sensor.room_temperature"],
    },
    [],
    [],
    ["hass"],
    [
      { id: "single", label: en.scenarios["single"], values: { entitiesYaml: [], exposes: [] } },
      {
        id: "empty",
        label: en.scenarios["empty"],
        values: { entities: [], entitiesYaml: [], exposes: [] },
      },
    ],
    {},
  ),
  covers: ["knx-data-table-related-label"],
  async load() {
    const [{ html }] = await Promise.all([
      import("lit"),
      import("../../../src/components/data-table/knx-data-table-related-label"),
    ]);

    return {
      render: (env, values, _slots, _emit) => {
        return html`<knx-data-table-related-label
          .entities=${values.entities as string[]}
          .entitiesYaml=${values.entitiesYaml as string[]}
          .exposes=${values.exposes as string[]}
          .hass=${env.hass}
        ></knx-data-table-related-label>`;
      },
    };
  },
};
