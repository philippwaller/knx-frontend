import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata } from "./helpers";

export const entry: GalleryEntry = {
  meta: {
    ...metadata(
      "knx-frontend",
      en.views["knx-frontend"],
      {},
      [],
      [],
      ["hass", "knx", "route", "narrow"],
      [
        {
          id: "route-entities",
          label: en.scenarios["route-entities"],
          shortLabel: en.scenarioShortLabels["route-entities"],
          values: {},
        },
        {
          id: "route-expose",
          label: en.scenarios["route-expose"],
          shortLabel: en.scenarioShortLabels["route-expose"],
          values: {},
        },
        {
          id: "route-project",
          label: en.scenarios["route-project"],
          shortLabel: en.scenarioShortLabels["route-project"],
          values: {},
        },
        {
          id: "route-monitor",
          label: en.scenarios["route-monitor"],
          shortLabel: en.scenarioShortLabels["route-monitor"],
          values: {},
        },
        {
          id: "route-entity-create",
          label: en.scenarios["route-entity-create"],
          shortLabel: en.scenarioShortLabels["route-entity-create"],
          values: {},
        },
        {
          id: "route-expose-create",
          label: en.scenarios["route-expose-create"],
          shortLabel: en.scenarioShortLabels["route-expose-create"],
          values: {},
        },
      ],
    ),
    category: "views",
  },
  covers: ["knx-frontend", "knx-router", "knx-entities-router", "knx-expose-router"],
  async load() {
    const [{ viewExample }] = await Promise.all([import("./view"), import("../../../src/main")]);
    return viewExample("knx-frontend", "/dashboard");
  },
};
