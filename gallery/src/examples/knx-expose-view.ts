import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata } from "./helpers";

export const entry: GalleryEntry = {
  meta: {
    ...metadata(
      "knx-expose-view",
      en.views["knx-expose-view"],
      {},
      [],
      [],
      ["hass", "knx", "route", "narrow"],
      [{ id: "empty", label: en.scenarios["empty"], values: {} }],
    ),
    category: "views",
  },
  covers: ["knx-expose-view"],
  async load() {
    const [{ viewExample }] = await Promise.all([
      import("./view"),
      import("../../../src/views/expose_view"),
    ]);
    return viewExample("knx-expose-view", "/expose");
  },
};
