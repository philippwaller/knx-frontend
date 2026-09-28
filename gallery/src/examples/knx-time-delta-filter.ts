import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata, observe } from "./helpers";

const copy = en.components["knx-time-delta-filter"];
export const entry: GalleryEntry = {
  meta: metadata(
    "knx-time-delta-filter",
    copy,
    { expanded: true, deltaBefore: 100, deltaAfter: 500, addedCount: 2, disabled: false },
    [],
    ["expanded-changed", "time-delta-changed"],
    ["hass", "knx"],
    [
      { id: "disabled", label: en.scenarios["disabled"], values: { disabled: true } },
      { id: "collapsed", label: en.scenarios["collapsed"], values: { expanded: false } },
    ],
    {},
  ),
  covers: ["knx-time-delta-filter"],
  async load() {
    const [{ html }] = await Promise.all([
      import("lit"),
      import("../../../src/components/data-table/filter/knx-time-delta-filter"),
    ]);

    return {
      render: (env, values, _slots, emit) => {
        const on = observe(emit);
        return html`<knx-time-delta-filter
          .expanded=${values.expanded as boolean}
          .deltaBefore=${values.deltaBefore as number}
          .deltaAfter=${values.deltaAfter as number}
          .addedCount=${values.addedCount as number}
          .disabled=${values.disabled as boolean}
          .hass=${env.hass}
          .knx=${env.knx}
          @expanded-changed=${on}
          @time-delta-changed=${on}
        ></knx-time-delta-filter>`;
      },
    };
  },
};
