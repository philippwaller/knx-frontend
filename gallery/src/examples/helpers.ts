import en from "../localize/en.json" with { type: "json" };
import type {
  GalleryEnvironment,
  GalleryEvent,
  GalleryMeta,
  GalleryValues,
  JsonValue,
} from "../types";

interface Copy {
  title: string;
  description: string;
  api: Record<string, string>;
  labels: Record<string, string>;
}

// Metadata only: importing the catalog must never register product elements.
export function metadata(
  tag: string,
  copy: Copy,
  defaults: GalleryValues,
  slots: string[] = [],
  events: string[] = [],
  supplied: string[] = [],
  scenarios: GalleryMeta["scenarios"] = [],
  choices: Record<string, JsonValue[]> = {},
): GalleryMeta {
  return {
    id: tag,
    tag,
    title: copy.title,
    description: copy.description,
    category: "components",
    controls: Object.entries(defaults).map(([key, defaultValue]) => ({
      key,
      label: copy.labels[key],
      defaultValue,
      kind: choices[key]
        ? "select"
        : typeof defaultValue === "boolean"
          ? "boolean"
          : typeof defaultValue === "number"
            ? "number"
            : typeof defaultValue === "string"
              ? "text"
              : "json",
      options: choices[key]?.map((value) => ({ label: String(value), value })),
      validate: (value) =>
        choices[key] || sameShape(value, defaultValue) ? undefined : en.validation.invalidValue,
    })),
    slots: slots.map((name) => ({ name, label: copy.labels[name || "default"] })),
    scenarios: [{ id: "default", label: en.sample.default, values: {} }, ...scenarios],
    api: [
      ...[...Object.keys(defaults), ...supplied].map((name) => ({
        name,
        kind:
          !Object.prototype.hasOwnProperty.call(defaults, name) && /localize/i.test(name)
            ? ("callback" as const)
            : ("property" as const),
        description: copy.api[name],
      })),
      ...slots.map((name) => ({
        name: name || "default",
        kind: "slot" as const,
        description: copy.api[name || "default"],
      })),
      ...events.map((name) => ({ name, kind: "event" as const, description: copy.api[name] })),
    ],
  };
}

function sameShape(value: JsonValue, sample: JsonValue): boolean {
  if (sample === null) return value === null;
  if (Array.isArray(sample)) {
    return (
      Array.isArray(value) && value.every((item) => !sample.length || sameShape(item, sample[0]))
    );
  }
  if (typeof sample === "object") {
    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).every((key) => key in sample) &&
      Object.keys(sample).every((key) => key in value && sameShape(value[key], sample[key]))
    );
  }
  return typeof value === typeof sample && (typeof value !== "number" || Number.isFinite(value));
}

export function observe(emit: (event: GalleryEvent) => void) {
  return (event: Event) =>
    emit({
      kind: "event",
      name: event.type,
      timestamp: Date.now(),
      args:
        "detail" in event
          ? JSON.parse(
              JSON.stringify(event.detail ?? null, (_key, value) =>
                typeof value === "function" ? "[callback]" : value,
              ),
            )
          : null,
    });
}

/** Controlled selectors report a value; the example owns the public value property. */
export function valueChanged(emit: (event: GalleryEvent) => void) {
  const report = observe(emit);
  return (event: CustomEvent<{ value: unknown }>) => {
    report(event);
    Object.assign(event.currentTarget!, { value: event.detail.value });
  };
}

export function localizeCallback(
  env: GalleryEnvironment,
  emit: (event: GalleryEvent) => void,
  prefix: "component.knx.config_panel.entities.create.light.knx",
) {
  return (key: string) => {
    const result =
      env.hass.localize(`${prefix}.${key}`) ||
      env.hass.localize(`component.knx.config_panel.entities.create._.knx.${key}`) ||
      (key.endsWith("description") ? en.sample.helper : en.sample.header);
    emit({ kind: "callback", name: "localize", timestamp: Date.now(), args: { key, result } });
    return result;
  };
}
