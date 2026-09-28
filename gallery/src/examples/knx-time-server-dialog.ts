import type { CreateEntityResult, TimeServerData } from "../../../src/types/entity_data";
import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata } from "./helpers";

const copy = en.dialogs["knx-time-server-dialog"];
export const entry: GalleryEntry = {
  meta: {
    ...metadata(
      "knx-time-server-dialog",
      copy,
      {},
      [],
      [],
      ["params"],
      [{ id: "validation-error", label: en.scenarios["validation-error"], values: {} }],
    ),
    category: "dialogs",
  },
  covers: ["knx-time-server-dialog"],
  async load() {
    const { dialogButton } = await import("./dialog");
    await import("../../../src/dialogs/knx-time-server-dialog");
    return {
      async prepare(env, scenario) {
        let config: TimeServerData = {
          time: { write: "1/0/3" },
          date: { write: "1/0/4" },
          datetime: { write: "1/0/5" },
        };
        env.mockWS("knx/get_time_server_config", () => structuredClone(config));
        env.mockWS("knx/update_time_server_config", (message): CreateEntityResult => {
          if (scenario === "validation-error") {
            return {
              success: false,
              error_base: "invalid_address",
              errors: [{ path: [], message: en.dialogs.validationError, code: "invalid_address" }],
            };
          }
          config = structuredClone(message.config) as TimeServerData;
          return { success: true, entity_id: null };
        });
      },
      render: (env, _values, _slots, emit) =>
        dialogButton(env, emit, "knx-time-server-dialog", { hass: env.hass, knx: env.knx }),
    };
  },
};
