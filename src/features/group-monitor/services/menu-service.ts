import type { IconOverflowMenuItem } from "@ha/components/ha-icon-overflow-menu";
import { mdiFilterVariant, mdiPencilOutline } from "@mdi/js";

import type { KNX } from "../../../types/knx";
import type { TelegramRow } from "../types/telegram-row";

/**
 * Service responsible for creating menu items for telegram actions
 */
export class MenuService {
  constructor(
    private _knx?: KNX,
    private _isProjectLoaded = false,
  ) {}

  /**
   * Updates the KNX instance for localization
   */
  public updateKnx(knx: KNX): void {
    this._knx = knx;
  }

  /**
   * Updates the project loaded state
   */
  public updateProjectLoaded(isProjectLoaded: boolean): void {
    this._isProjectLoaded = isProjectLoaded;
  }

  /**
   * Creates the overflow menu items for telegram rows
   */
  public getTelegramActionsMenuItems(
    row: TelegramRow,
    onRelatedAddresses: (address: string) => void,
    onCreateAutomation: (row: TelegramRow) => void,
  ): IconOverflowMenuItem[] {
    const items: IconOverflowMenuItem[] = [];

    // Add related addresses option only if a project is loaded
    if (this._isProjectLoaded) {
      items.push({
        path: mdiFilterVariant,
        label: this._knx?.localize("group_monitor_menu_related_addresses") || "",
        action: () => {
          onRelatedAddresses(row.destinationAddress);
        },
      });
    }

    // Add create automation option
    items.push({
      path: mdiPencilOutline,
      label: this._knx?.localize("group_monitor_menu_create_automation") || "",
      action: () => onCreateAutomation(row),
    });

    return items;
  }
}
