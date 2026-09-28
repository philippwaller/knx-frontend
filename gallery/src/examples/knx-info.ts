import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata } from "./helpers";

export const entry: GalleryEntry = {
  meta: {
    ...metadata(
      "knx-info",
      en.views["knx-info"],
      {},
      [],
      [],
      ["hass", "knx", "route", "narrow"],
      [{ id: "no-project", label: en.scenarios["no-project"], values: {} }],
    ),
    category: "views",
  },
  covers: ["knx-info"],
  async load() {
    const [{ viewExample }] = await Promise.all([
      import("./view"),
      import("../../../src/views/info"),
    ]);
    return viewExample("knx-info", "/info");
  },
};
