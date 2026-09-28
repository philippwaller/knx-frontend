import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata } from "./helpers";

export const entry: GalleryEntry = {
  meta: {
    ...metadata(
      "knx-entities-view",
      en.views["knx-entities-view"],
      {},
      [],
      [],
      ["hass", "knx", "route", "narrow"],
      [
        { id: "empty", label: en.scenarios["empty"], values: {} },
        { id: "fetch-error", label: en.scenarios["fetch-error"], values: {} },
      ],
    ),
    category: "views",
  },
  covers: ["knx-entities-view"],
  async load() {
    const [{ viewExample }] = await Promise.all([
      import("./view"),
      import("../../../src/views/entities_view"),
    ]);
    return viewExample("knx-entities-view", "/entities");
  },
};
