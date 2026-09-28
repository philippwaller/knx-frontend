import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata } from "./helpers";

export const entry: GalleryEntry = {
  meta: {
    ...metadata(
      "knx-error",
      en.views["knx-error"],
      {},
      [],
      [],
      ["hass", "knx", "route", "narrow"],
      [],
    ),
    category: "views",
  },
  covers: ["knx-error"],
  async load() {
    const [{ viewExample }] = await Promise.all([
      import("./view"),
      import("../../../src/views/error"),
    ]);
    return viewExample("knx-error", "/error");
  },
};
