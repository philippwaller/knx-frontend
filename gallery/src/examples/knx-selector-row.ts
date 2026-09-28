import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata, valueChanged, localizeCallback } from "./helpers";

const copy = en.components["knx-selector-row"];
export const entry: GalleryEntry = {
  meta: metadata(
    "knx-selector-row",
    copy,
    { key: "brightness", value: 40, required: true, invalid: false },
    [""],
    ["value-changed"],
    ["validationErrors", "localizeFunction", "hass", "selector"],
    [
      { id: "optional", label: en.scenarios["optional"], values: { required: false } },
      { id: "invalid", label: en.scenarios["invalid"], values: { invalid: true } },
    ],
    {},
  ),
  covers: ["knx-selector-row"],
  async load() {
    const [{ html, nothing }] = await Promise.all([
      import("lit"),
      import("../../../src/components/knx-selector-row"),
    ]);

    return {
      render: (env, values, slots, emit) => {
        const changed = valueChanged(emit);
        const localize = localizeCallback(
          env,
          emit,
          "component.knx.config_panel.entities.create.light.knx",
        );
        return html`<knx-selector-row
          .key=${values.key}
          .value=${values.value}
          .hass=${env.hass}
          .selector=${{ type: "ha_selector" as const, name: "brightness", required: values.required as boolean, selector: { number: { min: 0, max: 100, mode: "box" as const } } }}
          .validationErrors=${values.invalid ? [{ path: [], message: en.sample.invalid, code: null }] : undefined}
          .localizeFunction=${localize}
          @value-changed=${changed}
          >${slots.includes("") ? html`<div>${en.sample.content}</div>` : nothing}</knx-selector-row
        >`;
      },
    };
  },
};
