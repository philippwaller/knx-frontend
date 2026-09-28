import type { DeviceRegistryEntry } from "@ha/data/device/device_registry";
import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata } from "./helpers";

const copy = en.dialogs["knx-device-create-dialog"];
export const entry: GalleryEntry = {
  meta: {
    ...metadata("knx-device-create-dialog", copy, {}, [], [], ["params", "onClose"], []),
    category: "dialogs",
    api: [
      { name: "params", kind: "property", description: copy.api.params },
      { name: "onClose", kind: "callback", description: copy.api.onClose },
    ],
  },
  covers: ["knx-device-create-dialog"],
  async load() {
    const [{ dialogButton }, { callbackAdapter }, { createRegistries }] = await Promise.all([
      import("./dialog"),
      import("../protocol"),
      import("../fixtures/registries"),
      import("../../../src/dialogs/knx-device-create-dialog"),
    ]);
    return {
      async prepare(env) {
        env.mockWS("knx/create_device", ({ name, area_id }) => {
          if (typeof name !== "string" || !name.trim()) throw new Error(en.validation.invalidValue);
          return {
            ...Object.values(createRegistries().devices)[0],
            name,
            area_id: area_id ?? null,
          };
        });
      },
      render: (env, _values, _slots, emit) =>
        dialogButton(env, emit, "knx-device-create-dialog", {
          onClose: callbackAdapter(
            "onClose",
            emit,
            (device: DeviceRegistryEntry | undefined) => device,
            (device) => JSON.parse(JSON.stringify(device ?? null)),
          ),
        }),
    };
  },
};
