import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata, valueChanged, localizeCallback } from "./helpers";

const copy = en.components["knx-sync-state-selector-row"];
export const entry: GalleryEntry = {
  meta: metadata(
    "knx-sync-state-selector-row",
    copy,
    { key: "sync_state", value: true, allowFalse: true },
    [],
    ["value-changed"],
    ["localizeFunction", "hass"],
    [
      { id: "periodic", label: en.scenarios["periodic"], values: { value: "every 30" } },
      { id: "never", label: en.scenarios["never"], values: { value: false } },
    ],
    { value: [true, false, "init", "expire 60", "every 30"] },
  ),
  covers: ["knx-sync-state-selector-row"],
  async load() {
    const [{ html }] = await Promise.all([
      import("lit"),
      import("../../../src/components/knx-sync-state-selector-row"),
    ]);

    return {
      render: (env, values, _slots, emit) => {
        const changed = valueChanged(emit);
        const localize = localizeCallback(
          env,
          emit,
          "component.knx.config_panel.entities.create.light.knx",
        );
        return html`<knx-sync-state-selector-row
          .key=${values.key}
          .value=${values.value as string | boolean}
          .allowFalse=${values.allowFalse as boolean}
          .hass=${env.hass}
          .localizeFunction=${localize}
          @value-changed=${changed}
        ></knx-sync-state-selector-row>`;
      },
    };
  },
};
