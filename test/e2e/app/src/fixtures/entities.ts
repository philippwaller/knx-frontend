import type { HassEntities, HassEntity } from "home-assistant-js-websocket";

import type { EntityRegistryEntry } from "@ha/data/entity/entity_registry";

import type { KNXEntityIdentifier } from "../../../../../src/types/websocket";
import { KNX_CONFIG_ENTRY_ID } from "./config-entry";

const TIMESTAMP = "2026-09-28T10:00:00.000000+00:00";

const registryEntry = (entityId: string, uniqueId: string): EntityRegistryEntry => ({
  id: uniqueId,
  entity_id: entityId,
  name: null,
  icon: null,
  platform: "knx",
  config_entry_id: KNX_CONFIG_ENTRY_ID,
  config_subentry_id: null,
  device_id: null,
  area_id: null,
  labels: [],
  disabled_by: null,
  hidden_by: null,
  entity_category: null,
  has_entity_name: false,
  unique_id: uniqueId,
  options: null,
  categories: {},
  created_at: 0,
  modified_at: 0,
});

const state = (
  entityId: string,
  value: string,
  attributes: HassEntity["attributes"],
): HassEntity => ({
  entity_id: entityId,
  state: value,
  attributes,
  last_changed: TIMESTAMP,
  last_updated: TIMESTAMP,
  context: { id: entityId, parent_id: null, user_id: null },
});

/** Entities created in the KNX UI (`ui: true`); the entities view lists exactly these. */
export const entityRegistry: EntityRegistryEntry[] = [
  registryEntry("light.living_room", "knx_light_living_room"),
  registryEntry("sensor.living_room_temperature", "knx_sensor_living_room_temperature"),
];

export const entitiesByGroup: Record<string, KNXEntityIdentifier[]> = {
  "1/0/1": [{ platform: "light", unique_id: "knx_light_living_room", ui: true }],
  "1/0/2": [{ platform: "light", unique_id: "knx_light_living_room", ui: true }],
  "1/1/1": [{ platform: "light", unique_id: "knx_light_living_room", ui: true }],
  "2/0/1": [{ platform: "sensor", unique_id: "knx_sensor_living_room_temperature", ui: true }],
};

/** Exposed entity → group addresses it is sent to. */
export const exposeGroups: Record<string, string[]> = {
  "sensor.outdoor_temperature": ["3/0/1"],
};

export const states: HassEntities = {
  "light.living_room": state("light.living_room", "on", {
    friendly_name: "Living room light",
    brightness: 180,
  }),
  "sensor.living_room_temperature": state("sensor.living_room_temperature", "21.5", {
    friendly_name: "Living room temperature",
    unit_of_measurement: "°C",
    device_class: "temperature",
  }),
  "sensor.outdoor_temperature": state("sensor.outdoor_temperature", "12.0", {
    friendly_name: "Outdoor temperature",
    unit_of_measurement: "°C",
    device_class: "temperature",
  }),
};
