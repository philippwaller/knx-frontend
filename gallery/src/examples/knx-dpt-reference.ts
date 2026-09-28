import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata } from "./helpers";

export const entry: GalleryEntry = {
  meta: {
    ...metadata(
      "knx-dpt-reference",
      en.views["knx-dpt-reference"],
      {},
      [],
      [],
      ["hass", "knx", "route", "narrow"],
      [{ id: "empty", label: en.scenarios["empty"], values: {} }],
    ),
    category: "views",
  },
  covers: ["knx-dpt-reference"],
  async load() {
    const [{ viewExample }] = await Promise.all([
      import("./view"),
      import("../../../src/views/dpt_reference"),
    ]);
    return viewExample("knx-dpt-reference", "/dpt_reference");
  },
};
