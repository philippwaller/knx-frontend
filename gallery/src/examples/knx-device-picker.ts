import type { Ref } from "lit/directives/ref";
import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata, observe } from "./helpers";

const copy = en.components["knx-device-picker"];
export const entry: GalleryEntry = {
  meta: metadata(
    "knx-device-picker",
    copy,
    { label: "KNX device", helper: "Choose a device from the offline project.", value: "1.1.1" },
    [],
    ["value-changed", "show-dialog"],
    ["hass", "picker", "open()", "focus()"],
    [{ id: "empty", label: en.scenarios["empty"], values: { value: "" } }],
    {},
  ),
  covers: ["knx-device-picker"],
  async load() {
    const [{ html }] = await Promise.all([
      import("lit"),
      import("../../../src/components/knx-device-picker"),
    ]);

    const { createRef, ref } = await import("lit/directives/ref");
    const picker: Ref<HTMLElementTagNameMap["knx-device-picker"]> = createRef();

    return {
      async prepare(env) {
        const { createRegistries } = await import("../fixtures/registries");
        env.mockWS("knx/create_device", () => Object.values(createRegistries().devices)[0]);
      },
      render: (env, values, _slots, emit) => {
        const on = observe(emit);
        const pickerAction = async (_event: Event, method: "open" | "focus") => {
          await picker.value![method]();
          emit({ kind: "callback", name: method, timestamp: Date.now(), args: null });
        };
        const openPicker = (event: Event) => pickerAction(event, "open");
        const focusPicker = (event: Event) => pickerAction(event, "focus");
        return html`<knx-device-picker
            ${ref(picker)}
            .label=${values.label as string}
            .helper=${values.helper as string}
            .value=${values.value as string}
            .hass=${env.hass}
            @value-changed=${on}
            @show-dialog=${on}
          ></knx-device-picker
          ><button @click=${openPicker}>${en.sample.open}</button
          ><button @click=${focusPicker}>${en.sample.focus}</button>`;
      },
    };
  },
};
