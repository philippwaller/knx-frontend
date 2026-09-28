import type { MockHomeAssistant } from "@ha/fake_data/provide_hass";
import type { HomeAssistant } from "@ha/types";
import type { TemplateResult } from "lit";
import type { PreviewState } from "./preview-state";
import type { KNX } from "../../src/types/knx";

export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type GalleryValues = Record<string, JsonValue>;
export interface GalleryTheme {
  mode: "system" | "light" | "dark";
  theme: "default" | "knx";
}
export interface GalleryControl {
  key: string;
  label: string;
  kind: "boolean" | "number" | "text" | "select" | "json";
  defaultValue: JsonValue;
  options?: { label: string; value: JsonValue }[];
  validate(value: JsonValue): string | undefined;
}
export interface GalleryEvent {
  kind: "event" | "callback" | "api" | "error";
  name: string;
  timestamp: number;
  args: JsonValue;
}
export interface GalleryMeta {
  id: string;
  tag: string;
  title: string;
  description: string;
  category: "components" | "dialogs" | "views";
  controls: GalleryControl[];
  slots: { name: string; label: string }[];
  scenarios: { id: string; label: string; shortLabel?: string; values: GalleryValues }[];
  api: {
    name: string;
    kind: "property" | "method" | "slot" | "event" | "callback";
    description: string;
    details?: string;
  }[];
}
export interface GalleryEnvironment {
  hass: HomeAssistant;
  knx: KNX;
  signal: AbortSignal;
  mockWS: MockHomeAssistant["mockWS"];
  mockAPI: MockHomeAssistant["mockAPI"];
  mockService(
    domain: string,
    service: string,
    handler: (data: Record<string, unknown>) => Promise<void>,
  ): void;
  applyTheme(theme: GalleryTheme): void;
  dispose(): void;
}
export interface GalleryExample {
  render(
    env: GalleryEnvironment,
    values: GalleryValues,
    slots: string[],
    emit: (event: GalleryEvent) => void,
  ): TemplateResult;
  prepare?(env: GalleryEnvironment, scenarioId: string): Promise<void>;
  dispose?(): void;
}
export interface GalleryEntry {
  meta: GalleryMeta;
  load(): Promise<GalleryExample>;
  covers: string[];
}

interface GalleryMessageBase {
  channel: "knx-gallery";
  sessionId: string;
}
export interface GalleryConfigureMessage extends GalleryMessageBase {
  type: "configure";
  autoHeight: boolean;
  componentId: string;
  scenarioId: string;
  overrides: GalleryValues;
  slots: string[];
  theme: GalleryTheme;
}
export type GalleryMessage =
  | (GalleryMessageBase & { type: "ready" | "rendered" })
  | GalleryConfigureMessage
  | (GalleryMessageBase & { type: "code"; code: string })
  | (GalleryMessageBase & { type: "appearance"; theme: GalleryTheme })
  | (GalleryMessageBase & { type: "interaction-start"; revision: number })
  | (GalleryMessageBase & {
      type: "preview-state";
      state: PreviewState;
      interaction: boolean;
      revision: number;
    })
  | (GalleryMessageBase & { type: "resize"; height: number | null })
  | (GalleryMessageBase & { type: "auto-height"; enabled: boolean })
  | (GalleryMessageBase & { type: "event"; event: GalleryEvent })
  | (GalleryMessageBase & { type: "error"; error: string });
