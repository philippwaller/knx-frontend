import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata, observe } from "./helpers";

const copy = en.components["knx-sticky-expansion-panel"];
export const entry: GalleryEntry = {
  meta: metadata(
    "knx-sticky-expansion-panel",
    copy,
    { expanded: true, noCollapse: false },
    ["", "header"],
    ["expanded-will-change", "expanded-changed"],
    [],
    [{ id: "collapsed", label: en.scenarios["collapsed"], values: { expanded: false } }],
    {},
  ),
  covers: ["knx-sticky-expansion-panel"],
  async load() {
    const [{ html, nothing }] = await Promise.all([
      import("lit"),
      import("../../../src/components/knx-sticky-expansion-panel"),
    ]);

    return {
      render: (_env, values, slots, emit) => {
        const on = observe(emit);
        return html`<div style="height: var(--gallery-example-height, 360px); overflow: auto">
          <knx-sticky-expansion-panel
            .expanded=${values.expanded as boolean}
            .noCollapse=${values.noCollapse as boolean}
            @expanded-will-change=${on}
            @expanded-changed=${on}
            >${slots.includes("") ? html`<div>${en.sample.content}</div>` : nothing}${slots.includes("header") ? html`<div slot="header">${en.sample.content}</div>` : nothing}</knx-sticky-expansion-panel
          >
        </div>`;
      },
    };
  },
};
