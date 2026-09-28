import type { ConfigEntryUpdate } from "@ha/data/config_entries";
import type { MockHomeAssistant } from "@ha/fake_data/provide_hass";

import type { KnxFixtures } from "./fixtures";

// Subscriptions must hand back an unsubscribe function: views call it when they disconnect.
const unsubscribe = async () => undefined;

/**
 * Mocks every WebSocket command the panel sends while its views load. Commands sent only on user
 * interaction (create entity, upload project, …) are added when a test needs them.
 */
export const registerMocks = (hass: MockHomeAssistant, fixtures: KnxFixtures) => {
  // Home Assistant core
  hass.mockWS("config_entries/get", (msg: { domain?: string }) =>
    msg.domain === undefined || msg.domain === fixtures.configEntry.domain
      ? [fixtures.configEntry]
      : [],
  );
  hass.mockWS("config_entries/subscribe", (_msg, _hass, onChange) => {
    const updates: ConfigEntryUpdate[] = [{ type: null, entry: fixtures.configEntry }];
    onChange?.(updates);
    return unsubscribe;
  });
  hass.mockWS("config/entity_registry/list", () => fixtures.entityRegistry);
  hass.mockWS("config/label_registry/list", () => []);
  // Without a token the dashboard retries for about 30 s.
  hass.mockWS("brands/access_token", () => ({ token: "e2e-brands-token" }));

  // KNX integration (src/services/websocket.service.ts)
  hass.mockWS("knx/get_base_data", () => fixtures.baseData);
  hass.mockWS("knx/get_knx_project", () => fixtures.project);
  hass.mockWS("knx/group_monitor_info", () => fixtures.groupMonitorInfo);
  hass.mockWS("knx/group_telegrams", () => fixtures.groupTelegrams);
  hass.mockWS("knx/subscribe_telegrams", () => unsubscribe);
  hass.mockWS("knx/get_entities_by_group", () => fixtures.entitiesByGroup);
  hass.mockWS("knx/get_expose_groups", () => fixtures.exposeGroups);
};
