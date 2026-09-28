import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata } from "./helpers";

export const entry: GalleryEntry = {
  meta: {
    ...metadata(
      "knx-create-expose",
      en.views["knx-create-expose"],
      {},
      [],
      [],
      ["hass", "knx", "route", "narrow"],
      [
        { id: "empty", label: en.scenarios["empty"], values: {} },
        { id: "validation-error", label: en.scenarios["validation-error"], values: {} },
        { id: "fetch-error", label: en.scenarios["fetch-error"], values: {} },
      ],
    ),
    category: "views",
  },
  covers: ["knx-create-expose"],
  async load() {
    const [{ viewExample }] = await Promise.all([
      import("./view"),
      import("../../../src/views/expose_create"),
    ]);
    return viewExample("knx-create-expose", "/expose/edit/sensor.room_temperature");
  },
};
