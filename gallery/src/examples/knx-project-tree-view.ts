import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata, observe } from "./helpers";

const copy = en.components["knx-project-tree-view"];
export const entry: GalleryEntry = {
  meta: metadata(
    "knx-project-tree-view",
    copy,
    { multiselect: false },
    [],
    ["knx-group-range-selection-changed"],
    ["data"],
    [
      { id: "multiple", label: en.scenarios["multiple"], values: { multiselect: true } },
      { id: "empty", label: en.scenarios["empty"], values: {} },
    ],
    {},
  ),
  covers: ["knx-project-tree-view"],
  async load() {
    const [{ html }] = await Promise.all([
      import("lit"),
      import("../../../src/components/knx-project-tree-view"),
    ]);
    const { createKnxFixtures } = await import("../fixtures/knx");
    const project = createKnxFixtures().project;
    return {
      async prepare(_env, scenarioId) {
        if (scenarioId === "empty") project.group_ranges = {};
      },
      render: (_env, values, _slots, emit) => {
        const on = observe(emit);
        return html`<knx-project-tree-view
          .multiselect=${values.multiselect as boolean}
          .data=${project}
          @knx-group-range-selection-changed=${on}
        ></knx-project-tree-view>`;
      },
    };
  },
};
