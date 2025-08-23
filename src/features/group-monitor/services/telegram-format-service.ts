import type { HomeAssistant } from "@ha/types";
import memoize from "memoize-one";
import { isMobileClient } from "@ha/util/is_mobile";
import { isTouch } from "@ha/util/is_touch";

import { formatTimeDelta } from "../../../utils/format";
import type { KNX } from "../../../types/knx";
import type { Config as ListFilterConfig } from "../../../components/data-table/filter/knx-list-filter";
import type { DistinctValueInfo } from "./filter-service";

/**
 * Service responsible for telegram formatting and UI configuration
 */
export class TelegramFormatService {
  constructor(
    private _hass?: HomeAssistant,
    private _knx?: KNX,
  ) {}

  /**
   * Updates the Home Assistant instance for localization
   */
  public updateHass(hass: HomeAssistant): void {
    this._hass = hass;
  }

  /**
   * Updates the KNX instance for localization
   */
  public updateKnx(knx: KNX): void {
    this._knx = knx;
  }

  /**
   * Gets the localized search label showing telegram count
   */
  public getSearchLabel(narrow: boolean, telegramCount: number): string {
    if (narrow) {
      return this._knx?.localize("group_monitor_search_label_narrow") || "";
    }
    const key =
      telegramCount === 1 ? "group_monitor_search_label_singular" : "group_monitor_search_label";
    return this._knx?.localize(key, { count: telegramCount }) || "";
  }

  /**
   * Detects if the current device is a mobile touch device
   */
  public get isMobileTouchDevice(): boolean {
    return isMobileClient && isTouch;
  }

  /**
   * Formats the telegram offset with appropriate precision
   */
  public formatOffsetWithPrecision(offsetMicros: number | null): string {
    if (offsetMicros === null) {
      return formatTimeDelta(offsetMicros);
    }

    // Convert to milliseconds to check if it's exactly 0
    const offsetMs = Math.round(offsetMicros / 1000);

    // If millisecond part is 0 (e.g., 00:00.000), use microsecond precision
    if (offsetMs === 0 && offsetMicros !== 0) {
      return formatTimeDelta(offsetMicros, "microseconds");
    }

    // Otherwise use default millisecond precision
    return formatTimeDelta(offsetMicros, "milliseconds");
  }

  /**
   * Gets column configuration data for the data table
   * This provides the configuration without templates, which are handled by the view
   */
  public getColumnConfig(narrow: boolean, projectLoaded: boolean) {
    return {
      narrow,
      projectLoaded,
      language: this._hass?.language || "en",
      localizedLabels: {
        time: this._knx?.localize("group_monitor_time") || "",
        source: this._knx?.localize("group_monitor_source") || "",
        sourceName: this._knx?.localize("group_monitor_source_name") || "",
        destination: this._knx?.localize("group_monitor_destination") || "",
        destinationName: this._knx?.localize("group_monitor_destination_name") || "",
        type: this._knx?.localize("group_monitor_type") || "",
        direction: this._knx?.localize("group_monitor_direction") || "",
        payload: this._knx?.localize("group_monitor_payload") || "",
        value: this._knx?.localize("group_monitor_value") || "",
      },
    };
  }

  /**
   * Gets the filter configuration for source addresses
   */
  public getSourceFilterConfig(): ListFilterConfig<DistinctValueInfo> {
    return this._sourceFilterConfig(this._hass?.language || "en");
  }

  /**
   * Gets the filter configuration for destination addresses
   */
  public getDestinationFilterConfig(): ListFilterConfig<DistinctValueInfo> {
    return this._destinationFilterConfig(this._hass?.language || "en");
  }

  /**
   * Gets the filter configuration for direction
   */
  public getDirectionFilterConfig(): ListFilterConfig<DistinctValueInfo> {
    return this._directionFilterConfig(this._hass?.language || "en");
  }

  /**
   * Gets the filter configuration for telegram type
   */
  public getTelegramTypeFilterConfig(): ListFilterConfig<DistinctValueInfo> {
    return this._telegramTypeFilterConfig(this._hass?.language || "en");
  }

  // ============================================================================
  // Memoized Configuration Methods
  // ============================================================================

  /**
   * Memoized configuration for source address filter
   */
  private _sourceFilterConfig = memoize(
    (_language: string): ListFilterConfig<DistinctValueInfo> => ({
      idField: {
        filterable: false,
        sortable: false,
        mapper: (item: DistinctValueInfo) => item.id,
      },
      primaryField: {
        fieldName: this._knx?.localize("telegram_filter_source_sort_by_primaryText") || "",
        filterable: true,
        sortable: true,
        sortAscendingText: this._knx?.localize("telegram_filter_sort_ascending") || "",
        sortDescendingText: this._knx?.localize("telegram_filter_sort_descending") || "",
        sortDefaultDirection: "asc",
        mapper: (item: DistinctValueInfo) => item.id,
      },
      secondaryField: {
        fieldName: this._knx?.localize("telegram_filter_source_sort_by_secondaryText") || "",
        filterable: true,
        sortable: true,
        sortAscendingText: this._knx?.localize("telegram_filter_sort_ascending") || "",
        sortDescendingText: this._knx?.localize("telegram_filter_sort_descending") || "",
        sortDefaultDirection: "asc",
        mapper: (item: DistinctValueInfo) => item.name,
      },
      badgeField: {
        fieldName: this._knx?.localize("telegram_filter_source_sort_by_badge") || "",
        filterable: false,
        sortable: true,
        sortDefaultDirection: "desc",
        mapper: (item: DistinctValueInfo) => `${item.crossFilteredCount}`,
      },
    }),
  );

  /**
   * Memoized configuration for destination address filter
   */
  private _destinationFilterConfig = memoize(
    (_language: string): ListFilterConfig<DistinctValueInfo> => ({
      idField: {
        filterable: false,
        sortable: false,
        mapper: (item: DistinctValueInfo) => item.id,
      },
      primaryField: {
        fieldName: this._knx?.localize("telegram_filter_destination_sort_by_primaryText") || "",
        filterable: true,
        sortable: true,
        sortAscendingText: this._knx?.localize("telegram_filter_sort_ascending") || "",
        sortDescendingText: this._knx?.localize("telegram_filter_sort_descending") || "",
        sortDefaultDirection: "asc",
        mapper: (item: DistinctValueInfo) => item.id,
      },
      secondaryField: {
        fieldName: this._knx?.localize("telegram_filter_destination_sort_by_secondaryText") || "",
        filterable: true,
        sortable: true,
        sortAscendingText: this._knx?.localize("telegram_filter_sort_ascending") || "",
        sortDescendingText: this._knx?.localize("telegram_filter_sort_descending") || "",
        sortDefaultDirection: "asc",
        mapper: (item: DistinctValueInfo) => item.name,
      },
      badgeField: {
        fieldName: this._knx?.localize("telegram_filter_destination_sort_by_badge") || "",
        filterable: false,
        sortable: true,
        sortDefaultDirection: "desc",
        mapper: (item: DistinctValueInfo) => `${item.crossFilteredCount}`,
      },
    }),
  );

  /**
   * Memoized configuration for direction filter (Incoming/Outgoing)
   */
  private _directionFilterConfig = memoize(
    (_language: string): ListFilterConfig<DistinctValueInfo> => ({
      idField: {
        filterable: false,
        sortable: false,
        mapper: (item: DistinctValueInfo) => item.id,
      },
      primaryField: {
        filterable: false,
        sortable: false,
        mapper: (item: DistinctValueInfo) => item.id,
      },
      secondaryField: {
        filterable: false,
        sortable: false,
        mapper: (item: DistinctValueInfo) => item.name,
      },
      badgeField: {
        filterable: false,
        sortable: false,
        mapper: (item: DistinctValueInfo) => `${item.crossFilteredCount}`,
      },
    }),
  );

  /**
   * Memoized configuration for telegram type filter
   */
  private _telegramTypeFilterConfig = memoize(
    (_language: string): ListFilterConfig<DistinctValueInfo> => ({
      idField: {
        filterable: false,
        sortable: false,
        mapper: (item: DistinctValueInfo) => item.id,
      },
      primaryField: {
        filterable: false,
        sortable: false,
        mapper: (item: DistinctValueInfo) => item.id,
      },
      secondaryField: {
        filterable: false,
        sortable: false,
        mapper: (item: DistinctValueInfo) => item.name,
      },
      badgeField: {
        filterable: false,
        sortable: false,
        mapper: (item: DistinctValueInfo) => `${item.crossFilteredCount}`,
      },
    }),
  );
}
