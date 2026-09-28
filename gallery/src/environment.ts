import { ContextProvider } from "@lit/context";
import type { LitElement } from "lit";
import type { HomeAssistant } from "@ha/types";
import { provideHass, type MockHomeAssistant } from "@ha/fake_data/provide_hass";
import { demoConfig } from "@ha/fake_data/demo_config";
import { themeStyles } from "@ha/resources/theme/theme";
import { knxProjectContext } from "../../src/data/knx-project-context";
import { exposeGroupsContext } from "../../src/data/knx-expose-groups-context";
import { entitiesByGroupContext } from "../../src/data/knx-entities-by-group-context";
import { localize } from "../../src/localize/localize";
import type { KNX } from "../../src/types/knx";
import type { KNXEntityIdentifier, TelegramDict } from "../../src/types/websocket";
import { createKnxFixtures } from "./fixtures/knx";
import { createRegistries } from "./fixtures/registries";
import { createSchemas } from "./fixtures/schemas";
import { createTelegrams } from "./fixtures/telegrams";
import en from "./localize/en.json";
import backendEn from "./localize/backend-en.json";
import { applyGalleryTheme, knxTheme } from "./theme";
import type { GalleryEnvironment, GalleryEvent, GalleryTheme, JsonValue } from "./types";

/** Backend text: config_panel subset of Home Assistant Core's public
 * homeassistant/components/knx/strings.json (2026-09-26). Committed locally;
 * References resolved from public Core strings.json resources; unused DPTs
 * and platform schemas omitted. No sibling checkout is required at runtime. */
export async function createEnvironment(
  host: LitElement & { hass: HomeAssistant },
  emit: (event: GalleryEvent) => void,
): Promise<GalleryEnvironment> {
  const controller = new AbortController();
  const cleanups = new Set<() => void>();
  const fixtures = createKnxFixtures();
  const registries = createRegistries();
  const schemas = createSchemas();
  const telegrams = createTelegrams();
  const subscribers = new Set<(telegram: TelegramDict) => void>();
  const services = new Map<string, (data: Record<string, unknown>) => Promise<void>>();
  const wsTypes = new Set(["frontend/get_icons"]);
  const apiPaths: (string | RegExp)[] = [];
  const report = (kind: GalleryEvent["kind"], name: string, args: unknown) => {
    if (!controller.signal.aborted) {
      emit({
        kind,
        name,
        timestamp: Date.now(),
        args: JSON.parse(JSON.stringify(args ?? null)) as JsonValue,
      });
    }
  };
  const observe = async <T>(
    name: string,
    args: unknown,
    action: () => T | Promise<T>,
  ): Promise<T> => {
    controller.signal.throwIfAborted();
    report("api", name, args);
    try {
      return await action();
    } catch (error) {
      report("error", name, error instanceof Error ? error.message : String(error));
      throw error;
    }
  };
  const unknown = (name: string): never => {
    throw new Error(`${en.environment.unhandled} ${name}`);
  };
  const mock = provideHass(
    host,
    {
      ...registries,
      config: { ...structuredClone(demoConfig), components: ["knx", "light", "sensor"] },
      panels: {},
      services: {},
      language: "en",
      selectedLanguage: "en",
    },
    true,
  );
  const current = () => host.hass as MockHomeAssistant;
  // provideHass replaces hass on every update; never capture an old copy.
  const connection = mock.connection;
  const send = connection.sendMessagePromise.bind(connection);
  connection.sendMessagePromise = (message) =>
    observe(String(message.type), message, () => {
      if (!wsTypes.has(String(message.type))) unknown(String(message.type));
      return send(message);
    });
  connection.sendMessage = (message) => {
    controller.signal.throwIfAborted();
    report("api", String(message.type), message);
    if (!wsTypes.has(String(message.type))) {
      const error = new Error(`${en.environment.unhandled} ${message.type}`);
      report("error", String(message.type), error.message);
      throw error;
    }
    // One-way calls still report asynchronous mock failures.
    void send(message).catch((error: unknown) =>
      report("error", String(message.type), String(error)),
    );
  };
  const subscribe = connection.subscribeMessage.bind(connection);
  connection.subscribeMessage = <Result>(
    callback: (value: Result) => void,
    message: Parameters<typeof connection.subscribeMessage>[1],
  ) =>
    observe(String(message.type), message, async () => {
      if (!wsTypes.has(String(message.type))) unknown(String(message.type));
      let active = true;
      const unsubscribe = await subscribe<Result>((value) => {
        if (active && !controller.signal.aborted) callback(value);
      }, message);
      const cleanup = async () => {
        active = false;
        cleanups.delete(cleanup);
        await unsubscribe();
      };
      if (controller.signal.aborted) cleanup();
      else cleanups.add(cleanup);
      return cleanup;
    });
  const subscribeEvents = connection.subscribeEvents.bind(connection);
  connection.subscribeEvents = <EventType>(
    callback: (event: EventType) => void,
    eventType?: string,
  ) =>
    observe(`subscribe ${eventType}`, null, async () => {
      if (
        !eventType ||
        ![
          "entity_registry_updated",
          "device_registry_updated",
          "area_registry_updated",
          "floor_registry_updated",
          "label_registry_updated",
          "config_entry_changed",
        ].includes(eventType)
      ) {
        unknown(`event ${eventType}`);
      }
      let active = true;
      const unsubscribe = await subscribeEvents<EventType>((event) => {
        if (active && !controller.signal.aborted) callback(event);
      }, eventType);
      const cleanup = async () => {
        active = false;
        cleanups.delete(cleanup);
        await unsubscribe();
      };
      if (controller.signal.aborted) cleanup();
      else cleanups.add(cleanup);
      return cleanup;
    });
  const api = mock.callApi.bind(mock);
  const callApi: HomeAssistant["callApi"] = (method, path, parameters, headers) =>
    observe(`${method} ${path}`, parameters, () => {
      if (
        !apiPaths.some((pattern) =>
          typeof pattern === "string"
            ? pattern === path
            : new RegExp(pattern.source, pattern.flags).test(path),
        )
      ) {
        unknown(path);
      }
      return api(method, path, parameters, headers);
    });
  mock.updateHass({
    locale: { ...mock.locale, language: "en" },
    translationMetadata: structuredClone(mock.translationMetadata),
    callApi,
    callApiRaw: async (method, path, parameters, headers) => {
      const result = await callApi(method, path, parameters, headers);
      return result instanceof Response ? result : Response.json(result ?? null);
    },
    callService: (domain, service, data) =>
      observe(`${domain}.${service}`, data, async () => {
        const handler = services.get(`${domain}.${service}`);
        if (!handler) unknown(`${domain}.${service}`);
        await handler!(data ?? {});
        return { context: { id: "gallery" } };
      }),
    fetchWithAuth: (path, init) =>
      observe(`fetch ${path}`, { method: init?.method ?? "GET" }, async () => {
        if (
          path !== "/api/file_upload" ||
          init?.method !== "POST" ||
          !(init.body instanceof FormData) ||
          !(init.body.get("file") instanceof File)
        ) {
          unknown(path);
        }
        return Response.json({ file_id: "gallery-upload" });
      }),
  });
  const mockWS: GalleryEnvironment["mockWS"] = (type, callback) => {
    wsTypes.add(type);
    mock.mockWS(type, callback);
  };
  const mockAPI: GalleryEnvironment["mockAPI"] = (path, callback) => {
    apiPaths.push(path);
    mock.mockAPI(path, callback);
  };
  const mockService: GalleryEnvironment["mockService"] = (domain, service, handler) => {
    services.set(`${domain}.${service}`, handler);
  };
  // The KNX root requests a brands token at startup; demo mode builds brand URLs without it.
  mockWS("brands/access_token", () => ({ token: "gallery" }));
  mockWS("knx/get_base_data", () => fixtures.base);
  mockWS("knx/get_knx_project", () => fixtures.project);
  mockWS(
    "knx/get_schema",
    ({ platform }) => schemas[String(platform)] ?? unknown(`schema ${platform}`),
  );
  mockWS("knx/group_monitor_info", () => ({ project_loaded: true, recent_telegrams: telegrams }));
  mockWS("knx/group_telegrams", () =>
    Object.fromEntries(telegrams.map((telegram) => [telegram.destination, telegram])),
  );
  mockWS("knx/get_expose_groups", () => ({ "sensor.room_temperature": ["1/0/2"] }));
  mockWS("knx/get_expose_config", ({ entity_id }) =>
    entity_id === "sensor.room_temperature" ? fixtures.expose : unknown(`expose ${entity_id}`),
  );
  mockWS("knx/get_entities_by_group", () => ({
    "1/0/1": [{ platform: "light", unique_id: "light.living_room", ui: true }],
  }));
  mockWS("knx/subscribe_telegrams", (_message, _hass, callback) => {
    if (!callback) throw new Error(en.environment.subscriptionCallback);
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  });
  mockWS("config/entity_registry/list", () => registries.entityRegistry);
  mockWS("config/device_registry/list", () => Object.values(registries.devices));
  mockWS("config/area_registry/list", () => Object.values(registries.areas));
  mockWS("config/floor_registry/list", () => []);
  mockWS("config/label_registry/list", () => []);
  mockWS("config_entries/get", () => [fixtures.configEntry]);
  const transmit = async (service: "send" | "read", data: Record<string, unknown>) => {
    const addresses = Array.isArray(data.address) ? data.address : [data.address];
    if (
      !addresses.length ||
      addresses.some(
        (address) => typeof address !== "string" || !fixtures.project.group_addresses[address],
      )
    ) {
      throw new Error(en.environment.groupAddress);
    }
    if (service === "send" && data.payload === undefined) throw new Error(en.environment.payload);
    for (const address of addresses as string[]) {
      const destination = fixtures.project.group_addresses[address];
      const dpt = destination.dpt;
      const metadata = dpt
        ? fixtures.base.dpt_metadata[`${dpt.main}.${String(dpt.sub).padStart(3, "0")}`]
        : undefined;
      const telegram: TelegramDict = {
        ...telegrams[0],
        destination: address,
        destination_name: destination.name,
        dpt_main: dpt?.main ?? null,
        dpt_sub: dpt?.sub ?? null,
        dpt_name: metadata?.name ?? null,
        unit: metadata?.unit ?? null,
        direction: "Outgoing",
        source: fixtures.base.connection_info.current_address,
        source_name: "Home Assistant",
        timestamp: new Date().toISOString(),
        telegramtype: service === "read" ? "GroupValueRead" : "GroupValueWrite",
        payload: service === "read" ? null : (data.payload as TelegramDict["payload"]),
        value: service === "read" ? null : (data.payload as TelegramDict["value"]),
      };
      const timer = setTimeout(() => {
        cleanups.delete(cleanup);
        if (controller.signal.aborted) return;
        telegrams.push(telegram);
        subscribers.forEach((callback) => callback(telegram));
      }, 30);
      const cleanup = () => clearTimeout(timer);
      cleanups.add(cleanup);
    }
  };
  mockService("knx", "send", (data) => transmit("send", data));
  mockService("knx", "read", (data) => transmit("read", data));
  mockAPI("file_upload", (_hass, method, _path, data) => {
    if (method !== "DELETE" || data?.file_id !== "gallery-upload") unknown(`${method} file_upload`);
    return null;
  });
  const knx: KNX = {
    language: "en",
    config_entry: fixtures.configEntry,
    localize: (key, replace) => localize(host.hass, key, replace),
    log: {
      debug: (...args: unknown[]) => report("event", "knx.debug", args),
      error: (...args: unknown[]) => report("error", "knx.error", args),
    },
    connectionInfo: fixtures.base.connection_info,
    dptMetadata: fixtures.base.dpt_metadata,
    projectInfo: fixtures.project.info,
    supportedPlatforms: fixtures.base.supported_platforms,
    schema: {},
    async loadSchema(platform) {
      knx.schema[platform] ??= await host.hass.callWS({ type: "knx/get_schema", platform });
    },
  };
  new ContextProvider(host, { context: knxProjectContext, initialValue: fixtures.project });
  const exposes = new ContextProvider(host, {
    context: exposeGroupsContext,
    initialValue: {
      groups: { "sensor.room_temperature": ["1/0/2"] },
      loading: false,
      error: null,
      reload: async () => {
        const groups = await host.hass.callWS<Record<string, string[]>>({
          type: "knx/get_expose_groups",
        });
        if (!controller.signal.aborted) exposes.setValue({ ...exposes.value!, groups });
      },
    },
  });
  const entities = new ContextProvider(host, {
    context: entitiesByGroupContext,
    initialValue: {
      groups: { "1/0/1": { ui: ["light.living_room"], yaml: [] } },
      loading: false,
      error: null,
      reload: async () => {
        const identifiers = await host.hass.callWS<Record<string, KNXEntityIdentifier[]>>({
          type: "knx/get_entities_by_group",
        });
        const groups = Object.fromEntries(
          Object.entries(identifiers).map(([address, ids]) => {
            const resolveIds = (ui: boolean) =>
              registries.entityRegistry
                .filter(
                  (entry) =>
                    entry.platform === "knx" &&
                    ids.some(
                      (id) =>
                        id.ui === ui &&
                        id.unique_id === entry.unique_id &&
                        id.platform === entry.entity_id.split(".")[0],
                    ),
                )
                .map((entry) => entry.entity_id);
            return [address, { ui: resolveIds(true), yaml: resolveIds(false) }];
          }),
        );
        if (!controller.signal.aborted) entities.setValue({ ...entities.value!, groups });
      },
    },
  });
  if (!document.getElementById("gallery-ha-theme")) {
    const style = document.createElement("style");
    style.id = "gallery-ha-theme";
    style.textContent = themeStyles;
    document.head.append(style);
  }
  const media = matchMedia("(prefers-color-scheme: dark)");
  let theme: GalleryTheme = { mode: "system", theme: "default" };
  const applyTheme = (value: GalleryTheme) => {
    if (controller.signal.aborted) return;
    theme = { ...value };
    const dark = theme.mode === "dark" || (theme.mode === "system" && media.matches);
    current().updateHass({
      themes: {
        ...host.hass.themes,
        themes: { knx: { ...knxTheme } },
        theme: theme.theme,
        darkMode: dark,
      },
      selectedTheme: { theme: theme.theme, dark },
    });
    applyGalleryTheme(host, theme);
    applyGalleryTheme(document.documentElement, theme);
  };
  const systemChanged = () => {
    if (theme.mode === "system") applyTheme(theme);
  };
  media.addEventListener("change", systemChanged);
  cleanups.add(() => media.removeEventListener("change", systemChanged));
  applyTheme(theme);
  const dispose = () => {
    controller.abort();
    cleanups.forEach((cleanup) => cleanup());
    cleanups.clear();
    subscribers.clear();
  };
  try {
    await current().updateTranslations(null, "en");
    await current().updateTranslations("config", "en");
    await current().addTranslations(backendEn, "en");
  } catch (error) {
    dispose();
    throw error;
  }
  return {
    get hass() {
      return host.hass;
    },
    knx,
    signal: controller.signal,
    mockWS,
    mockAPI,
    mockService,
    applyTheme,
    dispose,
  };
}
