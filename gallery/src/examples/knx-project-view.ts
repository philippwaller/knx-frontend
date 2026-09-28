import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata } from "./helpers";

export const entry: GalleryEntry = {
  meta: {
    ...metadata(
      "knx-project-view",
      en.views["knx-project-view"],
      {},
      [],
      [],
      ["hass", "knx", "route", "narrow"],
      [
        { id: "no-project", label: en.scenarios["no-project"], values: {} },
        { id: "empty", label: en.scenarios["empty"], values: {} },
        { id: "fetch-error", label: en.scenarios["fetch-error"], values: {} },
      ],
    ),
    category: "views",
  },
  covers: ["knx-project-view"],
  async load() {
    const [{ viewExample }] = await Promise.all([
      import("./view"),
      import("../../../src/views/project_view"),
    ]);
    return viewExample("knx-project-view", "/project");
  },
};
