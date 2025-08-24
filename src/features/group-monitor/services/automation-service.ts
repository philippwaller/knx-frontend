import type { AutomationConfig } from "@ha/data/automation";

import { KNXLogger } from "../../../tools/knx-logger";
import { HAEvents } from "../../../utils/ha-events";
import type { KNX } from "../../../types/knx";
import type { TelegramRow } from "../types/telegram-row";
import type ProjectGraph from "./project-graph";

const logger = new KNXLogger("automation_service");

/**
 * Service responsible for creating automations from telegrams
 */
export class AutomationService {
  constructor(
    private _knx?: KNX,
    private _projectGraph?: ProjectGraph,
  ) {}

  /**
   * Updates the KNX instance for localization
   */
  public updateKnx(knx: KNX): void {
    this._knx = knx;
  }

  /**
   * Updates the project graph instance
   */
  public updateProjectGraph(projectGraph: ProjectGraph): void {
    this._projectGraph = projectGraph;
  }

  /**
   * Creates an automation from a telegram's context
   */
  public createAutomationFromTelegram(row: TelegramRow): void {
    // Map telegram type to boolean filters: keep matching type default true, disable others
    const typeFilters: Record<
      string,
      Partial<Record<"group_value_write" | "group_value_read" | "group_value_response", boolean>>
    > = {
      GroupValueWrite: { group_value_read: false, group_value_response: false },
      GroupValueRead: { group_value_write: false, group_value_response: false },
      GroupValueResponse: { group_value_write: false, group_value_read: false },
    };

    const directionFilter =
      row.direction === "Incoming" ? { outgoing: false } : { incoming: false };

    const newAutomation: Partial<AutomationConfig> = {
      alias: `KNX ${row.type} ${row.destinationAddress}`,
      description: `${this._knx?.localize("group_monitor_telegram") || ""}: ${row.sourceAddress} ${row.sourceText ? this._projectGraph?.getIndividualAddressName(row.sourceAddress) : ``} → ${row.destinationAddress} ${row.destinationText ? ` - ${this._projectGraph?.getGroupAddressName(row.destinationAddress)}` : ``}}`,
      mode: "single",
      triggers: [
        {
          alias: `KNX ${row.type} ${row.destinationAddress}${row.destinationName ? ` - ${row.destinationText}` : ``}`,
          trigger: "knx.telegram",
          destination: row.destinationAddress,
          ...(typeFilters[row.type] || {}),
          ...directionFilter,
        } as any,
      ],
      conditions: [],
      actions: [],
    };

    logger.debug("Creating automation", newAutomation);

    // Use the new HAEvents utility to open the automation editor
    const success = HAEvents.openAutomationEditor({
      data: newAutomation,
      expanded: true,
    });

    if (!success) {
      logger.error("Failed to open automation editor");
    }
  }
}
