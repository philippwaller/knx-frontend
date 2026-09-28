import type { HassEntities } from "home-assistant-js-websocket";

import type { ConfigEntry } from "@ha/data/config_entries";
import type { EntityRegistryEntry } from "@ha/data/entity/entity_registry";

import type {
  GroupMonitorInfoData,
  KNXBaseData,
  KNXEntityIdentifier,
  KNXProject,
  TelegramDict,
} from "../../../../../src/types/websocket";
import { baseData } from "./base-data";
import { knxConfigEntry } from "./config-entry";
import { entitiesByGroup, entityRegistry, exposeGroups, states } from "./entities";
import { project } from "./project";
import { groupMonitorInfo, groupTelegrams } from "./telegrams";

/** Everything the mocks answer with. A scenario adjusts a copy of the defaults. */
export interface KnxFixtures {
  configEntry: ConfigEntry;
  baseData: KNXBaseData;
  project: KNXProject | null;
  groupMonitorInfo: GroupMonitorInfoData;
  groupTelegrams: Record<string, TelegramDict>;
  entityRegistry: EntityRegistryEntry[];
  entitiesByGroup: Record<string, KNXEntityIdentifier[]>;
  exposeGroups: Record<string, string[]>;
  states: HassEntities;
}

export const defaultFixtures = (): KnxFixtures => ({
  configEntry: knxConfigEntry,
  baseData,
  project,
  groupMonitorInfo,
  groupTelegrams,
  entityRegistry,
  entitiesByGroup,
  exposeGroups,
  states,
});
