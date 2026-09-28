import type { HASSDomEvent } from "@ha/common/dom/fire_event";
import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata, observe } from "./helpers";

const copy = en.components["knx-sort-menu-item"];
export const entry: GalleryEntry = {
  meta: metadata(
    "knx-sort-menu-item",
    copy,
    {
      criterion: "name",
      displayName: "Name",
      defaultDirection: "asc",
      direction: "asc",
      active: true,
      ascendingText: "Ascending",
      descendingText: "Descending",
      ascendingIcon: "M12 4l-7 7h4v9h6v-9h4z",
      descendingIcon: "M12 20l-7-7h4V4h6v9h4z",
      isMobileDevice: false,
      disabled: false,
    },
    [],
    ["sort-option-selected"],
    ["knx"],
    [
      { id: "disabled", label: en.scenarios["disabled"], values: { disabled: true } },
      { id: "mobile", label: en.scenarios["mobile"], values: { isMobileDevice: true } },
    ],
    { defaultDirection: ["asc", "desc"], direction: ["asc", "desc"] },
  ),
  covers: ["knx-sort-menu-item"],
  async load() {
    const [{ html }] = await Promise.all([
      import("lit"),
      import("../../../src/components/knx-sort-menu-item"),
    ]);

    return {
      render: (env, values, _slots, emit) => {
        const on = observe(emit);
        const selectSort = (event: HASSDomEvent<HASSDomEvents["sort-option-selected"]>) => {
          on(event);
          Object.assign(event.currentTarget!, { active: true, direction: event.detail.direction });
        };
        return html`<knx-sort-menu-item
          .criterion=${values.criterion as string}
          .displayName=${values.displayName as string}
          .defaultDirection=${values.defaultDirection as "asc" | "desc"}
          .direction=${values.direction as "asc" | "desc"}
          .active=${values.active as boolean}
          .ascendingText=${values.ascendingText as string}
          .descendingText=${values.descendingText as string}
          .ascendingIcon=${values.ascendingIcon as string}
          .descendingIcon=${values.descendingIcon as string}
          .isMobileDevice=${values.isMobileDevice as boolean}
          .disabled=${values.disabled as boolean}
          .knx=${env.knx}
          @sort-option-selected=${selectSort}
        ></knx-sort-menu-item>`;
      },
    };
  },
};
