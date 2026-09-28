import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata } from "./helpers";

export const entry: GalleryEntry = {
  meta: {
    ...metadata(
      "knx-dashboard",
      en.views["knx-dashboard"],
      {},
      [],
      [],
      ["hass", "knx", "route", "narrow"],
      [{ id: "no-project", label: en.scenarios["no-project"], values: {} }],
    ),
    category: "views",
  },
  covers: ["knx-dashboard"],
  async load() {
    const [{ viewExample }] = await Promise.all([
      import("./view"),
      import("../../../src/views/dashboard"),
    ]);
    return viewExample("knx-dashboard", "/dashboard");
  },
};
