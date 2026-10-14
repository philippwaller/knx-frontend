import en from "../localize/en.json" with { type: "json" };
import { defineExample, valueChanged, localizeCallback } from "./helpers";

const copy = en.components["knx-selector-row"];
export const entry = defineExample({
  tag: "knx-selector-row",
  copy,
  properties: { key: "brightness", value: 40 },
  exampleOptions: { required: true, invalid: false, duration: false },
  slots: [""],
  events: ["value-changed"],
  suppliedProperties: ["validationErrors", "hass", "selector"],
  callbacks: ["localizeFunction"],
  scenarios: [
    { id: "optional", label: en.scenarios["optional"], values: { required: false } },
    { id: "invalid", label: en.scenarios["invalid"], values: { invalid: true } },
    {
      id: "duration",
      label: en.scenarios["duration"],
      values: { key: "cooldown", value: 90_001.5, required: false, duration: true },
    },
  ],
  interaction: { state: ["value", "_enabled", "_haSelectorValue"] },
  async load() {
    const [{ html, nothing }] = await Promise.all([
      import("lit"),
      import("../../../src/components/knx-selector-row"),
    ]);

    return {
      render: (env, values, slots, emit) => {
        const changed = valueChanged(emit);
        const localize = localizeCallback(env, emit);
        return html`<knx-selector-row
          .key=${values.key}
          .value=${values.value}
          .hass=${env.hass}
          .selector=${{ type: values.duration ? ("knx_duration" as const) : ("ha_selector" as const), name: values.key as string, required: values.required as boolean, selector: values.duration ? { duration: { allow_negative: false, enable_day: true, enable_millisecond: true } } : { number: { min: 0, max: 100, mode: "box" as const } } }}
          .validationErrors=${values.invalid ? [{ path: [], message: en.sample.invalid, code: null }] : undefined}
          .localizeFunction=${localize}
          @value-changed=${changed}
          >${slots.includes("") ? html`<div>${en.sample.content}</div>` : nothing}</knx-selector-row
        >`;
      },
    };
  },
});
