import { fireEvent } from "@ha/common/dom/fire_event";
import type { AutomationConfig } from "@ha/data/automation";

export interface KnxTelegramTrigger {
  trigger: "knx.telegram";
  destination: string;
  type?: string;
  group_value_write?: boolean;
  group_value_read?: boolean;
  group_value_response?: boolean;
  incoming?: boolean;
  outgoing?: boolean;
}

export interface KnxAutomationOptions extends Omit<KnxTelegramTrigger, "trigger"> {
  alias?: string;
}

export function buildAutomationFromKnx({
  alias,
  ...trigger
}: KnxAutomationOptions): Partial<AutomationConfig> {
  return {
    alias: alias ?? `KNX: ${trigger.destination}`,
    description: "",
    mode: "single",
    triggers: [{ trigger: "knx.telegram", ...trigger } as KnxTelegramTrigger],
    conditions: [],
    actions: [],
  };
}

export function openAutomationEditor(data: Partial<AutomationConfig>, expanded = true): void {
  const customPanel = (window.parent as { customPanel?: HTMLElement }).customPanel;
  if (customPanel) {
    fireEvent(customPanel, "hass-automation-editor", { data, expanded });
  }
}
