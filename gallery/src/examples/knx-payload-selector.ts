import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata, valueChanged, localizeCallback } from "./helpers";

const copy = en.components["knx-payload-selector"];
export const entry: GalleryEntry = {
  meta: metadata(
    "knx-payload-selector",
    copy,
    {
      key: "payload",
      gaKey: "ga_switch",
      dpt: "9.001",
      required: true,
      disableRaw: false,
      rawLength: 2,
      externalLength: false,
      raw: false,
      numberValue: 21.5,
      invalid: false,
    },
    [],
    ["value-changed"],
    ["hass", "knx", "validationErrors", "localizeFunction", "value"],
    [
      { id: "raw", label: en.scenarios["raw"], values: { raw: true } },
      { id: "no-dpt", label: en.scenarios["no-dpt"], values: { dpt: "", raw: true } },
      { id: "invalid", label: en.scenarios["invalid"], values: { invalid: true } },
    ],
    { dpt: ["9.001", "1.001", ""] },
  ),
  covers: ["knx-payload-selector"],
  async load() {
    const [{ html }] = await Promise.all([
      import("lit"),
      import("../../../src/components/knx-payload-selector"),
    ]);

    return {
      render: (env, values, _slots, emit) => {
        const changed = valueChanged(emit);
        const localize = localizeCallback(
          env,
          emit,
          "component.knx.config_panel.entities.create.light.knx",
        );
        return html`<knx-payload-selector
          .key=${values.key}
          .gaKey=${values.gaKey as string}
          .required=${values.required as boolean}
          .disableRaw=${values.disableRaw as boolean}
          .hass=${env.hass}
          .knx=${env.knx}
          .dpt=${(values.dpt as string) || undefined}
          .rawLength=${values.externalLength ? (values.rawLength as number) : undefined}
          .value=${values.raw ? { payload: "0x0800", payload_length: 2 } : { value: values.numberValue as number }}
          .validationErrors=${values.invalid ? [{ path: [], message: en.sample.invalid, code: null }] : undefined}
          .localizeFunction=${localize}
          @value-changed=${changed}
        ></knx-payload-selector>`;
      },
    };
  },
};
