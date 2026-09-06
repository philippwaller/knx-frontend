import { fireEvent } from "@ha/common/dom/fire_event";
import { mainWindow } from "@ha/common/dom/get_main_window";
import { navigate } from "@ha/common/navigate";
import type { AutomationConfig } from "@ha/data/automation";
import { formatDateTime } from "../../../utils/format";
import type { TelegramRow } from "../types/telegram-row";

export interface KnxTelegramTrigger {
  trigger: "knx.telegram";
  destination: string;
  alias?: string;
  note?: string;
  type?: string;
  group_value_write?: boolean;
  group_value_read?: boolean;
  group_value_response?: boolean;
  incoming?: boolean;
  outgoing?: boolean;
}

/**
 * Builds a partial Home Assistant AutomationConfig prefilled with a knx.telegram trigger
 * matching the selected telegram's destination, APCI type, direction, and DPT (if known).
 */
export function buildAutomationFromTelegram(
  telegram: TelegramRow,
  localize?: (key: string, values?: Record<string, any>) => string,
): Partial<AutomationConfig> {
  const typeFilters: Record<
    string,
    Partial<Record<"group_value_write" | "group_value_read" | "group_value_response", boolean>>
  > = {
    GroupValueWrite: { group_value_read: false, group_value_response: false },
    GroupValueRead: { group_value_write: false, group_value_response: false },
    GroupValueResponse: { group_value_write: false, group_value_read: false },
  };

  const directionFilter =
    telegram.direction === "Incoming" ? { outgoing: false } : { incoming: false };

  const getLabel = (key: string, fallback: string) => (localize ? localize(key) : fallback);

  const typeTitle = getLabel("group_monitor_automation_description_type", "Type");
  const sourceTitle = getLabel("group_monitor_automation_description_source", "Source");
  const destTitle = getLabel("group_monitor_automation_description_destination", "Destination");
  const dptTitle = getLabel("group_monitor_automation_description_dpt", "DPT");

  const localizedDirection = telegram.direction
    ? getLabel(telegram.direction, telegram.direction)
    : "";

  // DPT type for decoding payload in trigger: technical dptId (e.g. "1.001")
  const dptFilter = telegram.dptId ? { type: telegram.dptId } : {};

  const typeSuffix = telegram.type !== "GroupValueWrite" ? ` (${telegram.type})` : "";

  const directionSuffix =
    telegram.direction === "Outgoing" && localizedDirection ? ` (${localizedDirection})` : "";

  const baseAlias = telegram.destinationText
    ? `KNX: ${telegram.destinationAddress} ${telegram.destinationText}`
    : `KNX: ${telegram.destinationAddress}`;
  const automationAlias = `${baseAlias}${typeSuffix}${directionSuffix}`;

  const plainSource = telegram.sourceText
    ? `${telegram.sourceAddress} (${telegram.sourceText})`
    : telegram.sourceAddress;
  const plainDest = telegram.destinationText
    ? `${telegram.destinationAddress} (${telegram.destinationText})`
    : telegram.destinationAddress;

  const isOutgoing = telegram.direction === "Outgoing";

  const triggerAliasKey = isOutgoing
    ? "group_monitor_automation_trigger_alias_outgoing"
    : "group_monitor_automation_trigger_alias_incoming";

  const triggerAlias = localize
    ? localize(triggerAliasKey, { type: telegram.type, destination: plainDest })
    : isOutgoing
      ? `a KNX telegram (${telegram.type}) is sent for ${plainDest}`
      : `a KNX telegram (${telegram.type}) is received for ${plainDest}`;

  const dateTimeStr =
    telegram.timestamp instanceof Date && !isNaN(telegram.timestamp.getTime())
      ? formatDateTime(telegram.timestamp)
      : telegram.timestampIso || "";

  const noteHeader = localize
    ? localize("group_monitor_automation_note_created_from", {
        time: dateTimeStr,
        datetime: dateTimeStr,
      })
    : `Created from KNX telegram (${dateTimeStr})`;

  const noteSource = `${sourceTitle}: ${plainSource}`;
  const noteDest = `${destTitle}: ${plainDest}`;
  const noteType = localizedDirection
    ? `${typeTitle}: ${telegram.type} (${localizedDirection})`
    : `${typeTitle}: ${telegram.type}`;

  const valueTitle = getLabel("group_monitor_automation_note_value", "Value");
  const dptDisplay = telegram.dpt || telegram.dptId;
  const hasValue = telegram.type !== "GroupValueRead" && Boolean(telegram.value);
  let noteValue = "";
  if (hasValue) {
    noteValue = dptDisplay
      ? `\n${valueTitle}: ${telegram.value} (${dptDisplay})`
      : `\n${valueTitle}: ${telegram.value}`;
  } else if (dptDisplay) {
    noteValue = `\n${dptTitle}: ${dptDisplay}`;
  }

  const note = `${noteHeader}\n${noteSource}\n${noteDest}\n${noteType}${noteValue}`;

  const trigger: KnxTelegramTrigger = {
    trigger: "knx.telegram",
    destination: telegram.destinationAddress,
    alias: triggerAlias,
    note,
    ...dptFilter,
    ...(typeFilters[telegram.type] || {}),
    ...directionFilter,
  };

  return {
    alias: automationAlias,
    description: "",
    mode: "single",
    triggers: [trigger as any],
    conditions: [],
    actions: [],
  };
}

/**
 * Opens Home Assistant's automation editor with the given config prefilled.
 * Dispatches the standard "hass-automation-editor" event to the customPanel element
 * or mainWindow, falling back to URL navigation if needed.
 */
export function openAutomationEditor(data: Partial<AutomationConfig>, expanded = true): boolean {
  const parentCustomPanel = (window.parent as any)?.customPanel as HTMLElement | undefined;
  const target = parentCustomPanel || mainWindow || window;

  if (target) {
    fireEvent(target, "hass-automation-editor", {
      data,
      expanded,
    });
    return true;
  }

  navigate(`/config/automation/edit/new${expanded ? "?expanded=1" : ""}`);
  return false;
}
