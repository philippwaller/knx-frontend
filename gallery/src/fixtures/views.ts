import { ContextEvent } from "@lit/context";
import type { MockHomeAssistant } from "@ha/fake_data/provide_hass";
import { exposeGroupsContext } from "../../../src/data/knx-expose-groups-context";
import type {
  CreateEntityData,
  CreateEntityResult,
  ExposeConfigData,
  ExposeResult,
  GASchema,
  TimeServerData,
} from "../../../src/types/entity_data";
import type { TelegramQueryParameters } from "../../../src/types/websocket";
import type { GalleryEnvironment } from "../types";
import { createKnxFixtures } from "./knx";
import { createRegistries } from "./registries";
import { createTelegrams } from "./telegrams";
import en from "../localize/en.json";

/** Named responses mirror websocket.service.ts and the pinned HA registry/flow APIs. */
export async function prepareViews(
  env: GalleryEnvironment,
  tag: string,
  scenario: string,
  thumbnail: boolean,
) {
  const fixtures = createKnxFixtures();
  let project = scenario === "no-project" ? null : fixtures.project;
  let entity: CreateEntityData = {
    platform: "light",
    data: {
      entity: { name: "Living room light", device_info: "1.1.1", entity_category: null },
      knx: { switch: { write: "1/0/1" } },
    },
  };
  let expose: ExposeConfigData = structuredClone(fixtures.expose);
  let exposed = scenario === "empty" ? {} : { "sensor.room_temperature": ["1/0/2"] };
  const registry = createRegistries();
  let entityPresent = !(scenario === "empty" && tag === "knx-entities-view");
  env.mockWS("config/entity_registry/list", () =>
    registry.entityRegistry.filter(
      (item) => item.entity_id !== "light.living_room" || entityPresent,
    ),
  );
  env.mockWS("knx/get_entities_by_group", () =>
    entityPresent
      ? { "1/0/1": [{ platform: "light", unique_id: "light.living_room", ui: true }] }
      : {},
  );
  const hass = env.hass as MockHomeAssistant;
  if (scenario === "empty" && tag === "knx-entities-view") {
    hass.updateHass({ entities: {}, states: {} });
    env.mockWS("config/entity_registry/list", () => []);
  }
  if (scenario === "no-project") env.knx.projectInfo = null;
  if (scenario === "empty" && tag === "knx-dpt-reference") env.knx.dptMetadata = {};
  env.mockWS("knx/get_base_data", () => ({
    ...fixtures.base,
    project_info: project?.info ?? null,
  }));
  env.mockWS("knx/get_knx_project", () => project);
  env.mockWS("config_entries/subscribe", (_message, _hass, callback) => {
    callback?.([{ type: null, entry: fixtures.configEntry }]);
    return () => undefined;
  });
  env.mockWS("config/entity_registry/get", ({ entity_id }) => {
    const entry = registry.entityRegistry.find((item) => item.entity_id === entity_id);
    if (!entry) throw new Error(en.views.fetchError);
    return entry;
  });
  env.mockWS("knx/get_entity_config", ({ entity_id }) => {
    if (scenario === "fetch-error" || entity_id !== "light.living_room") {
      throw new Error(en.views.fetchError);
    }
    return structuredClone(entity);
  });
  const invalid = {
    success: false as const,
    error_base: en.views.validationError,
    errors: [
      {
        path: ["knx", "switch", "write"],
        code: "invalid_address",
        message: en.views.validationError,
      },
    ],
  };
  const validate = (message: CreateEntityData): CreateEntityResult => {
    const [group, field] =
      message.platform === "sensor"
        ? (["state", "state"] as const)
        : (["switch", "write"] as const);
    const address = (message.data?.knx?.[group] as GASchema | undefined)?.[field];
    return scenario === "validation-error" || !address
      ? { ...invalid, errors: [{ ...invalid.errors[0], path: ["data", "knx", group, field] }] }
      : { success: true, entity_id: null };
  };
  env.mockWS("knx/validate_entity", validate);
  env.mockWS("knx/update_entity", (message): CreateEntityResult => {
    const result = validate(message);
    if (result.success) {
      entity = structuredClone({ platform: message.platform, data: message.data });
      registry.entityRegistry.find((item) => item.entity_id === message.entity_id)!.name =
        entity.data.entity.name;
      hass.updateHass({
        entities: {
          ...env.hass.entities,
          "light.living_room": {
            ...env.hass.entities["light.living_room"],
            name: entity.data.entity.name,
          },
        },
        states: {
          ...env.hass.states,
          "light.living_room": {
            ...env.hass.states["light.living_room"],
            attributes: {
              ...env.hass.states["light.living_room"].attributes,
              friendly_name: entity.data.entity.name,
            },
          },
        },
      });
    }
    return result;
  });
  env.mockWS("knx/create_entity", (message): CreateEntityResult => {
    const result = validate(message);
    if (!result.success) return result;
    entity = structuredClone({ platform: message.platform, data: message.data });
    return {
      success: true,
      entity_id: message.platform === "sensor" ? "sensor.room_temperature" : "light.living_room",
    };
  });
  env.mockWS("knx/delete_entity", ({ entity_id }) => {
    if (entity_id !== "light.living_room") throw new Error(en.views.fetchError);
    entityPresent = false;
    hass.updateHass({
      entities: { "sensor.room_temperature": registry.entities["sensor.room_temperature"] },
    });
    return null;
  });
  env.mockWS("knx/get_expose_groups", () => exposed);
  env.mockWS("knx/get_expose_config", ({ entity_id }) => {
    if (scenario === "fetch-error" || entity_id !== "sensor.room_temperature") {
      throw new Error(en.views.fetchError);
    }
    return structuredClone(expose);
  });
  const validateExpose = ({ data }: { data: ExposeConfigData }): ExposeResult =>
    scenario === "validation-error" ||
    !data.options.every((option) => option.ga.write && option.ga.dpt)
      ? { ...invalid, errors: [{ ...invalid.errors[0], path: ["options", "0", "ga", "write"] }] }
      : { success: true };
  env.mockWS("knx/validate_expose", validateExpose);
  env.mockWS("knx/update_expose", (message): ExposeResult => {
    const result = validateExpose(message);
    if (result.success) {
      expose = structuredClone(message.data);
      exposed = { [message.entity_id]: expose.options.map((option) => option.ga.write!) };
    }
    return result;
  });
  env.mockWS("knx/delete_expose", ({ entity_id }) => {
    if (entity_id !== "sensor.room_temperature") throw new Error(en.views.fetchError);
    exposed = {};
    return null;
  });
  env.mockWS("knx/project_file_remove", () => {
    project = null;
    env.knx.projectInfo = null;
    return null;
  });
  env.mockWS("knx/project_file_process", ({ file_id }) => {
    if (file_id !== "gallery-upload") throw new Error(en.views.fetchError);
    project = fixtures.project;
    env.knx.projectInfo = project.info;
    return null;
  });
  let time: TimeServerData = {};
  env.mockWS("knx/get_time_server_config", () => time);
  env.mockWS("knx/update_time_server_config", ({ config }) => {
    time = structuredClone(config);
    return { success: true, entity_id: null };
  });
  env.mockWS("knx/create_device", ({ name, area_id }) => {
    if (typeof name !== "string" || !name.trim()) throw new Error(en.validation.invalidValue);
    return { ...registry.devices["gallery-actuator"], name, area_id: area_id ?? null };
  });
  env.mockWS("manifest/get", () => ({
    domain: "knx",
    name: "KNX",
    config_flow: true,
    integration_type: "hub",
  }));
  // Show a local completed HA flow; no live connection settings are requested.
  for (const endpoint of ["config/config_entries/options/flow", "config/config_entries/flow"]) {
    env.mockAPI(endpoint, (_hass, method) => {
      if (method !== "POST") throw new Error(en.views.fetchError);
      return {
        type: "abort",
        flow_id: "gallery-flow",
        handler: "knx",
        reason: "already_configured",
      };
    });
  }
  if (tag === "knx-expose-view" && scenario === "empty") {
    // The real context reload consumes the overridden endpoint before first render.
    const host = document.querySelector("knx-gallery-preview")!;
    const child = document.createElement("span");
    host.append(child);
    let reload: (() => Promise<void>) | undefined;
    child.dispatchEvent(
      new ContextEvent(exposeGroupsContext, child, (value) => {
        reload = value?.reload;
      }),
    );
    await reload?.();
    child.remove();
  }
  const telegrams =
    scenario === "empty"
      ? []
      : createTelegrams().map((telegram) => ({ ...telegram, timestamp: new Date().toISOString() }));
  if (tag === "knx-group-monitor" || tag === "knx-frontend") {
    env.mockWS("knx/group_monitor_info", () => {
      if (scenario === "fetch-error") throw new Error(en.views.fetchError);
      return { project_loaded: !!project, recent_telegrams: [...telegrams] };
    });
    env.mockWS("knx/query_telegrams", (params: TelegramQueryParameters) => {
      const filtered = telegrams.filter(
        (telegram) =>
          (!params.start_time || telegram.timestamp >= params.start_time) &&
          (!params.end_time || telegram.timestamp <= params.end_time) &&
          (!params.destinations?.length || params.destinations.includes(telegram.destination)),
      );
      return { telegrams: filtered, total_count: filtered.length, limit_reached: false };
    });
    // Captures must not depend on how soon a CI worker reaches the screenshot.
    if (scenario !== "empty" && scenario !== "fetch-error" && !thumbnail) {
      let count = 0;
      const timer = setInterval(() => {
        if (env.signal.aborted) return;
        void env.hass
          .callService(
            "knx",
            "send",
            count++ % 2
              ? { address: "1/0/2", payload: 21.5 }
              : { address: "1/0/1", payload: count % 2 },
          )
          .catch(() => undefined);
      }, 1200);
      env.signal.addEventListener("abort", () => clearInterval(timer), { once: true });
    }
  }
  if (tag === "knx-project-view" && scenario === "fetch-error") {
    env.mockWS("knx/group_telegrams", () => {
      throw new Error(en.views.fetchError);
    });
  }
}
