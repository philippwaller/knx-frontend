import en from "../localize/en.json" with { type: "json" };
import { defineExample, valueChanged } from "./helpers";

export const entry = defineExample({
  tag: "knx-duration-selector",
  copy: en.components["knx-duration-selector"],
  properties: { value: 90_001.5, disabled: false },
  suppliedProperties: ["hass", "selector"],
  events: ["value-changed"],
  scenarios: [
    { id: "zero", label: en.scenarios["zero"], values: { value: 0 } },
    { id: "disabled", label: en.scenarios["disabled"], values: { disabled: true } },
  ],
  interaction: { state: ["value"] },
  async load() {
    const [{ html }] = await Promise.all([
      import("lit"),
      import("../../../src/components/knx-duration-selector"),
    ]);

    return {
      render: (env, values, _slots, emit) =>
        html`<knx-duration-selector
          .hass=${env.hass}
          .selector=${{
            duration: { allow_negative: false, enable_day: true, enable_millisecond: true },
          }}
          .value=${values.value as number}
          .disabled=${values.disabled as boolean}
          @value-changed=${valueChanged(emit)}
        ></knx-duration-selector>`,
    };
  },
});
