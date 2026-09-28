import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata } from "./helpers";

const copy = en.dialogs["knx-send-dialog"];
export const entry: GalleryEntry = {
  meta: {
    ...metadata("knx-send-dialog", copy, {}, [], ["value-changed"], ["params"], []),
    category: "dialogs",
  },
  covers: ["knx-send-dialog"],
  async load() {
    const { dialogButton } = await import("./dialog");
    await import("../../../src/dialogs/knx-send-dialog");
    return {
      render: (env, _values, _slots, emit) =>
        dialogButton(env, emit, "knx-send-dialog", { hass: env.hass, knx: env.knx }),
    };
  },
};
