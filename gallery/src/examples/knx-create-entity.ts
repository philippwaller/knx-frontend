import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata } from "./helpers";

export const entry: GalleryEntry = {
  meta: {
    ...metadata(
      "knx-create-entity",
      en.views["knx-create-entity"],
      {},
      [],
      [],
      ["hass", "knx", "route", "narrow"],
      [
        { id: "create", label: en.scenarios["create"], values: {} },
        { id: "empty", label: en.scenarios["empty"], values: {} },
        { id: "validation-error", label: en.scenarios["validation-error"], values: {} },
        { id: "fetch-error", label: en.scenarios["fetch-error"], values: {} },
      ],
    ),
    category: "views",
  },
  covers: ["knx-create-entity"],
  async load() {
    const [{ viewExample }] = await Promise.all([
      import("./view"),
      import("../../../src/views/entities_create"),
    ]);
    return viewExample("knx-create-entity", "/entities/edit/light.living_room");
  },
};
