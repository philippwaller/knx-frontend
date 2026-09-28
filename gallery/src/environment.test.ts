import { ContextEvent } from "@lit/context";
import { LitElement } from "lit";
import type { HomeAssistant } from "@ha/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  entitiesByGroupContext,
  type EntitiesByGroupContextValue,
} from "../../src/data/knx-entities-by-group-context";
import { createEnvironment } from "./environment";
import type { GalleryEnvironment, GalleryEvent } from "./types";

vi.hoisted(() => {
  vi.stubGlobal("__STATIC_PATH__", "/static/");
});

// Only replace the asset fetch. The real provideHass and its context/update logic run.
vi.mock("@ha/util/common-translation", () => ({
  getLocalLanguage: () => "en",
  getTranslation: async () => ({ language: "en", data: { "ui.common.save": "Save" } }),
}));

class EnvironmentHost extends LitElement {
  hass!: HomeAssistant;
}
customElements.define("gallery-environment-test", EnvironmentHost);
const environments: GalleryEnvironment[] = [];
let media: EventTarget & { matches: boolean };
async function setup() {
  const host = new EnvironmentHost();
  document.body.append(host);
  const events: GalleryEvent[] = [];
  const env = await createEnvironment(host, (event) => events.push(event));
  environments.push(env);
  return { host, env, events };
}
beforeEach(() => {
  media = Object.assign(new EventTarget(), { matches: false });
  vi.stubGlobal("matchMedia", () => media);
});
afterEach(async () => {
  vi.useRealTimers();
  // provideHass starts lazy formatting imports; let them finish before jsdom teardown.
  await vi.dynamicImportSettled();
  environments.splice(0).forEach((env) => env.dispose());
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe("offline environment", () => {
  it("isolates mutable demo data and reads the current host hass", async () => {
    const first = await setup();
    const second = await setup();
    first.env.hass.config.components.push("gallery-test");
    first.env.hass.states["light.living_room"].attributes.friendly_name = "Changed";
    const project = await first.env.hass.callWS<{ info: { name: string } }>({
      type: "knx/get_knx_project",
    });
    project.info.name = "Changed";
    expect(second.env.hass.config.components).not.toContain("gallery-test");
    expect(second.env.hass.states["light.living_room"].attributes.friendly_name).toBe(
      "Living room light",
    );
    expect(await second.env.hass.callWS({ type: "knx/get_knx_project" })).not.toEqual(project);
    first.env.applyTheme({ mode: "dark", theme: "knx" });
    expect(first.env.hass).toBe(first.host.hass);
    expect(first.env.hass.themes.darkMode).toBe(true);
    expect(second.env.hass.themes.darkMode).toBe(false);
  });
  it("logs and rejects unknown public APIs and services without network access", async () => {
    const { env, events } = await setup();
    await expect(env.hass.callWS({ type: "unknown/ws" })).rejects.toBeDefined();
    await expect(env.hass.callApi("GET", "unknown/rest")).rejects.toBeDefined();
    await expect(env.hass.callService("unknown", "service")).rejects.toBeDefined();
    await expect(env.hass.fetchWithAuth("https://example.com")).rejects.toBeDefined();
    await expect(
      env.hass.connection.subscribeEvents(() => undefined, "unknown/event"),
    ).rejects.toBeDefined();
    await expect(env.hass.callApiRaw("GET", "unknown/raw")).rejects.toBeDefined();
    expect(() => env.hass.sendWS({ type: "unknown/one-way" })).toThrow();
    expect(events.filter((event) => event.kind === "error")).toHaveLength(7);
  });
  it("stops delayed subscription deliveries on unsubscribe and dispose", async () => {
    const { env } = await setup();
    vi.useFakeTimers();
    const callback = vi.fn();
    const unsubscribe = await env.hass.connection.subscribeMessage(callback, {
      type: "knx/subscribe_telegrams",
    });
    await env.hass.callService("knx", "send", { address: "1/0/1", payload: 1 });
    await vi.runAllTimersAsync();
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        direction: "Outgoing",
        telegramtype: "GroupValueWrite",
        dpt_main: 1,
        dpt_sub: 1,
        dpt_name: "Switch",
        unit: null,
      }),
    );
    callback.mockClear();
    await env.hass.callService("knx", "send", { address: "1/0/2", payload: 21.5 });
    await vi.runAllTimersAsync();
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: "1/0/2",
        dpt_main: 9,
        dpt_sub: 1,
        dpt_name: "Temperature",
        unit: "°C",
      }),
    );
    callback.mockClear();
    await env.hass.callService("knx", "read", { address: "1/0/1" });
    await unsubscribe();
    await vi.runAllTimersAsync();
    expect(callback).not.toHaveBeenCalled();
    await env.hass.connection.subscribeMessage(callback, { type: "knx/subscribe_telegrams" });
    await env.hass.callService("knx", "read", { address: "1/0/1" });
    env.dispose();
    await vi.runAllTimersAsync();
    expect(callback).not.toHaveBeenCalled();
    expect(env.signal.aborted).toBe(true);
  });
  it("reloads group contexts from an explicit scenario mock", async () => {
    const { env, host } = await setup();
    const child = document.createElement("span");
    host.append(child);
    let context: EntitiesByGroupContextValue | null = null;
    child.dispatchEvent(
      new ContextEvent(
        entitiesByGroupContext,
        child,
        (value) => {
          context = value;
        },
        true,
      ),
    );
    env.mockWS("knx/get_entities_by_group", () => ({
      "1/0/2": [{ platform: "light", unique_id: "light.living_room", ui: false }],
    }));
    await context!.reload();
    expect(context!.groups).toEqual({ "1/0/2": { ui: [], yaml: ["light.living_room"] } });
  });
  it("updates CSS and HA dark mode on system changes only while selected", async () => {
    const { env, host } = await setup();
    env.applyTheme({ mode: "system", theme: "knx" });
    media.matches = true;
    media.dispatchEvent(new Event("change"));
    expect(env.hass.themes.darkMode).toBe(true);
    expect(host.style.getPropertyValue("--primary-color")).toBe("#5e8a3a");
    env.applyTheme({ mode: "light", theme: "default" });
    media.dispatchEvent(new Event("change"));
    expect(env.hass.themes.darkMode).toBe(false);
    expect(host.style.getPropertyValue("--primary-color")).not.toBe("#5e8a3a");
    env.dispose();
    media.dispatchEvent(new Event("change"));
    expect(env.hass.themes.darkMode).toBe(false);
  });
});

declare global {
  interface HTMLElementTagNameMap {
    "gallery-environment-test": EnvironmentHost;
  }
}
