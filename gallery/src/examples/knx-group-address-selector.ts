import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata, observe, localizeCallback } from "./helpers";

const copy = en.components["knx-group-address-selector"];
export const entry: GalleryEntry = {
  meta: metadata(
    "knx-group-address-selector",
    copy,
    {
      key: "ga_switch",
      label: "Switch",
      config: { write: "1/0/1", state: "1/0/1", passive: ["1/0/2"], dpt: "1.001" },
      required: true,
      invalid: false,
    },
    [],
    ["value-changed", "knx-dpt-selector-changed", "show-dialog"],
    [
      "validationErrors",
      "localizeFunction",
      "knx",
      "options",
      "validGroupAddresses",
      "filteredGroupAddresses",
      "dptSelectorDisabled",
      "getValidGroupAddresses(validDPTs)",
      "getDptByValue(value)",
      "getFilteredGroupAddresses(dpt, addresses, project)",
    ],
    [{ id: "invalid", label: en.scenarios["invalid"], values: { invalid: true } }],
    {},
  ),
  covers: ["knx-group-address-selector"],
  async load() {
    const [{ html }] = await Promise.all([
      import("lit"),
      import("../../../src/components/knx-group-address-selector"),
    ]);

    return {
      render: (env, values, _slots, emit) => {
        const on = observe(emit);
        const localize = localizeCallback(
          env,
          emit,
          "component.knx.config_panel.entities.create.light.knx",
        );
        const configChanged = (event: CustomEvent<{ value: unknown }>) => {
          on(event);
          Object.assign(event.currentTarget!, { config: event.detail.value });
        };
        return html`<knx-group-address-selector
          .key=${values.key}
          .label=${values.label as string}
          .config=${values.config as HTMLElementTagNameMap["knx-group-address-selector"]["config"]}
          .required=${values.required as boolean}
          .knx=${env.knx}
          .options=${{ write: { required: true }, state: { required: false }, passive: true, dptClasses: ["numeric"] }}
          .validationErrors=${values.invalid ? [{ path: [], message: en.sample.invalid, code: null }] : undefined}
          .localizeFunction=${localize}
          @value-changed=${configChanged}
          @knx-dpt-selector-changed=${on}
          @show-dialog=${on}
        ></knx-group-address-selector>`;
      },
    };
  },
};
