import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata } from "./helpers";

export const entry: GalleryEntry = {
  meta: {
    ...metadata(
      "knx-group-monitor",
      en.views["knx-group-monitor"],
      {},
      [],
      [],
      ["hass", "knx", "route", "narrow"],
      [
        { id: "paused", label: en.scenarios["paused"], values: {} },
        { id: "empty", label: en.scenarios["empty"], values: {} },
        { id: "fetch-error", label: en.scenarios["fetch-error"], values: {} },
      ],
    ),
    category: "views",
  },
  covers: ["knx-group-monitor"],
  async load() {
    const [{ viewExample }] = await Promise.all([
      import("./view"),
      import("../../../src/features/group-monitor/views/group-monitor-view"),
    ]);
    return viewExample("knx-group-monitor", "/group_monitor");
  },
};
