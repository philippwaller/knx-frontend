import { buildAutomationFromKnx } from "../../../utils/automation";
import type { TelegramRow } from "../types/telegram-row";

export function buildAutomationFromTelegram(telegram: TelegramRow) {
  const typeFilters = {
    GroupValueWrite: { group_value_read: false, group_value_response: false },
    GroupValueRead: { group_value_write: false, group_value_response: false },
    GroupValueResponse: { group_value_write: false, group_value_read: false },
  };

  return buildAutomationFromKnx({
    alias: `KNX: ${telegram.destinationAddress}${telegram.destinationText ? ` ${telegram.destinationText}` : ""}`,
    destination: telegram.destinationAddress,
    ...(telegram.dptId ? { type: telegram.dptId } : {}),
    ...(typeFilters[telegram.type] ?? {}),
    ...(telegram.direction === "Incoming" ? { outgoing: false } : { incoming: false }),
  });
}
