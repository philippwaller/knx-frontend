import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { HomeAssistant, Route } from "@ha/types";
import type { SortingDirection } from "@ha/components/data-table/ha-data-table";
import type { IconOverflowMenuItem } from "@ha/components/ha-icon-overflow-menu";
import { mdiFilterVariant, mdiPencilOutline } from "@mdi/js";

import type { AutomationConfig } from "@ha/data/automation";
import { getGroupMonitorInfo } from "../../../services/websocket.service";
import { showWarning, showNotification, openAutomationEditor } from "../../../utils/ha-events";
import { TelegramBufferService } from "../services/telegram-buffer-service";
import { ConnectionService } from "../services/connection-service";
import {
  FilterService,
  type FilteredTelegramsResult,
  type DistinctValueInfo,
} from "../services/filter-service";
import { TelegramFormatService } from "../services/telegram-format-service";
import { UrlSyncService } from "../services/url-sync-service";
import { KNXLogger } from "../../../tools/knx-logger";
import { TelegramRow } from "../types/telegram-row";
import type { TelegramDict } from "../../../types/websocket";
import ProjectGraph from "../services/project-graph";
import type { KNX } from "../../../types/knx";
import type { Config as ListFilterConfig } from "../../../components/data-table/filter/knx-list-filter";

const logger = new KNXLogger("group_monitor_controller");

// Filter and distinct values types for type safety - re-export from filter service
export type {
  FilterField,
  FilterMap,
  DistinctValueInfo,
  DistinctValues,
  FilteredTelegramsResult,
} from "../services/filter-service";

/**
 * GroupMonitor ReactiveController
 */
export class GroupMonitorController implements ReactiveController {
  /** Minimum buffer size for telegram storage beyond recent telegrams length */
  private static readonly MIN_TELEGRAM_STORAGE_BUFFER = 100;

  private host: ReactiveControllerHost;

  // Core services
  private _connectionService = new ConnectionService();

  private _telegramBuffer = new TelegramBufferService(2000);

  private _filterService: FilterService;

  private _formatService = new TelegramFormatService();

  private _urlSyncService = new UrlSyncService();

  // Navigation state
  private _selectedTelegramId: string | null = null;

  // Project graph encapsulating project data + lookups
  private _projectGraph?: ProjectGraph;

  // KNX instance for localization
  private _knx?: KNX;

  // UI state
  private _expandedFilter: string | null = "source";

  private _isReloadEnabled = false;

  private _isPaused = false;

  // undefined until initial info is fetched; then true/false
  private _isProjectLoaded: boolean | undefined = undefined;

  private _connectionError: string | null = null;

  // Buffer version counter for memoization cache invalidation
  private _bufferVersion = 0;

  // Project version counter to trigger recomputation when names become available
  private _projectVersion = 0;

  private _unsubscribeProjectLoaded?: () => void;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);

    // Initialize FilterService (depends on project graph, so initialized in setup)
    this._filterService = new FilterService();

    // Set up connection service callbacks
    this._connectionService.onTelegram((telegram) => this._handleIncomingTelegram(telegram));
    this._connectionService.onConnectionChange((_connected, error) => {
      this._connectionError = error || null;
      this.host.requestUpdate();
    });
  }

  // ============================================================================
  // ReactiveController interface
  // ============================================================================

  hostConnected(): void {
    // Initialize filters from URL when controller is connected
    const urlFilters = this._urlSyncService.getFiltersFromUrl();
    if (urlFilters && Object.keys(urlFilters).length > 0) {
      this._filterService.setFilters(urlFilters);
      this.host.requestUpdate();
    }
  }

  hostDisconnected(): void {
    this._connectionService.disconnect();
    if (this._unsubscribeProjectLoaded) {
      this._unsubscribeProjectLoaded();
      this._unsubscribeProjectLoaded = undefined;
    }
  }

  // ============================================================================
  // Public API for the host component
  // ============================================================================

  /**
   * Setup method to be called from the host's firstUpdated
   */
  public async setup(hass: HomeAssistant, knx: KNX): Promise<void> {
    if (this._connectionService.isConnected) return;

    this._knx = knx;
    this._projectGraph = new ProjectGraph(knx);

    // Update all services with instances
    this._filterService = new FilterService(this._projectGraph);
    this._formatService.updateHass(hass);
    this._formatService.updateKnx(knx);

    // Re-apply URL filters after FilterService recreation
    const urlFilters = this._urlSyncService.getFiltersFromUrl();
    if (urlFilters && Object.keys(urlFilters).length > 0) {
      this._filterService.setFilters(urlFilters);
    }

    // When the project becomes available later, refresh to resolve names
    this._unsubscribeProjectLoaded = this._projectGraph.onLoaded(() => {
      this._projectVersion++;
      this.host.requestUpdate();
    });
    if (this._projectGraph.isLoaded) {
      this._projectVersion++;
      this.host.requestUpdate();
    }

    if (!(await this._loadRecentTelegrams(hass))) return;

    try {
      await this._connectionService.subscribe(hass);
    } catch (err) {
      logger.error("Failed to setup connection", err);
      this._connectionError = err instanceof Error ? err.message : String(err);
      this.host.requestUpdate();
    }
  }

  // ============================================================================
  // Getters for component state
  // ============================================================================

  public get telegrams(): readonly TelegramRow[] {
    return this._telegramBuffer.snapshot;
  }

  public get selectedTelegramId(): string | null {
    return this._selectedTelegramId;
  }

  public set selectedTelegramId(value: string | null) {
    this._selectedTelegramId = value;
    this.host.requestUpdate();
  }

  public get filters(): Record<string, string[]> {
    return this._filterService.filters;
  }

  public get sortColumn(): string | undefined {
    return this._filterService.sortColumn;
  }

  public set sortColumn(value: string | undefined) {
    this._filterService.sortColumn = value;
    this.host.requestUpdate();
  }

  public get sortDirection(): SortingDirection | undefined {
    return this._filterService.sortDirection;
  }

  public set sortDirection(value: SortingDirection | undefined) {
    this._filterService.sortDirection = value || "desc";
    this.host.requestUpdate();
  }

  public get expandedFilter(): string | null {
    return this._expandedFilter;
  }

  public get isReloadEnabled(): boolean {
    return this._isReloadEnabled;
  }

  public get isPaused(): boolean {
    return this._isPaused;
  }

  public get isProjectLoaded(): boolean | undefined {
    return this._isProjectLoaded;
  }

  public get connectionError(): string | null {
    return this._connectionError;
  }

  public get projectGraph(): ProjectGraph | undefined {
    return this._projectGraph;
  }

  /**
   * Gets both filtered telegrams and distinct values in a single synchronized call
   */
  public getFilteredTelegramsAndDistinctValues(): FilteredTelegramsResult {
    return this._filterService.getFilteredTelegramsAndDistinctValues(
      this._projectVersion,
      this._bufferVersion,
      this._telegramBuffer.snapshot,
    );
  }

  // ============================================================================
  // Filter methods (delegate to FilterService)
  // ============================================================================

  /**
   * Toggles a filter value on/off for a specific field
   */
  public toggleFilterValue(field: string, value: string, route?: Route): void {
    this._filterService.toggleFilterValue(field, value);
    this._urlSyncService.updateUrlFromFilters(this._filterService.filters, route);
    this.host.requestUpdate();
  }

  /**
   * Updates filter values for a specific field
   */
  public setFilterFieldValue(field: string, value: string[], route?: Route): void {
    this._filterService.setFilterFieldValue(field, value);
    this._urlSyncService.updateUrlFromFilters(this._filterService.filters, route);
    this.host.requestUpdate();
  }

  /**
   * Clears all active filters
   */
  public clearFilters(route?: Route): void {
    this._filterService.clearFilters();
    this._urlSyncService.updateUrlFromFilters(this._filterService.filters, route);
    this.host.requestUpdate();
  }

  /**
   * Updates which filter panel is currently expanded
   */
  public updateExpandedFilter(id: string, expanded: boolean): void {
    this._expandedFilter = expanded
      ? id
      : this._expandedFilter === id
        ? null
        : this._expandedFilter;
    this.host.requestUpdate();
  }

  // ============================================================================
  // Control methods
  // ============================================================================

  /**
   * Toggles the pause state of telegram monitoring
   */
  public async togglePause(): Promise<void> {
    this._isPaused = !this._isPaused;
    this.host.requestUpdate();
  }

  /**
   * Reloads recent telegrams from the server
   */
  public async reload(hass: HomeAssistant): Promise<void> {
    await this._loadRecentTelegrams(hass);
  }

  /**
   * Attempts to reconnect after a connection error
   */
  public async retryConnection(hass: HomeAssistant): Promise<void> {
    await this._connectionService.reconnect(hass);
  }

  /**
   * Clears all telegrams from the display and resets filter data
   */
  public clearTelegrams(): void {
    this._telegramBuffer.clear();
    this._filterService.clear();
    this._bufferVersion++;
    this._isReloadEnabled = true;
    this.host.requestUpdate();
  }

  // ============================================================================
  // Navigation methods
  // ============================================================================

  /**
   * Navigates through the filtered telegram list
   */
  private _navigateTelegram(
    direction: "next" | "previous",
    filteredRows: TelegramRow[],
  ): string | null {
    if (!this._selectedTelegramId) return null;

    const currentIndex = filteredRows.findIndex((row) => row.id === this._selectedTelegramId);

    // Calculate step based on direction and sort order
    // "next" = to newer telegram, "previous" = to older telegram
    // For descending sort (newest first): next = -1 (up to newer), previous = +1 (down to older)
    // For ascending sort (oldest first): next = +1 (down to newer), previous = -1 (up to older)
    const isDescending = this.sortDirection === "desc";
    const step =
      direction === "next"
        ? isDescending
          ? -1
          : 1 // next: to newer = up in desc, down in asc
        : isDescending
          ? 1
          : -1; // previous: to older = down in desc, up in asc

    const targetIndex = currentIndex + step;

    if (targetIndex >= 0 && targetIndex < filteredRows.length) {
      this._selectedTelegramId = filteredRows[targetIndex].id;
      return this._selectedTelegramId;
    }

    return null;
  }

  /**
   * Selects the next telegram in the filtered list (always goes to newer telegram)
   */
  public selectNextTelegram(): void {
    const { filteredTelegrams } = this.getFilteredTelegramsAndDistinctValues();
    const newId = this._navigateTelegram("next", filteredTelegrams);
    if (newId) {
      this.host.requestUpdate();
    }
  }

  /**
   * Selects the previous telegram in the filtered list (always goes to older telegram)
   */
  public selectPreviousTelegram(): void {
    const { filteredTelegrams } = this.getFilteredTelegramsAndDistinctValues();
    const newId = this._navigateTelegram("previous", filteredTelegrams);
    if (newId) {
      this.host.requestUpdate();
    }
  }

  /**
   * Clears the telegram selection
   */
  public clearSelection(): void {
    this._selectedTelegramId = null;
    this.host.requestUpdate();
  }

  /**
   * Gets the navigation disable states for the current selection and sort direction
   */
  public getNavigationDisableStates(filteredTelegrams: TelegramRow[]): {
    disableNext: boolean;
    disablePrevious: boolean;
  } {
    if (!this._selectedTelegramId) {
      return { disableNext: true, disablePrevious: true };
    }

    const currentIndex = filteredTelegrams.findIndex((row) => row.id === this._selectedTelegramId);

    if (currentIndex === -1) {
      return { disableNext: true, disablePrevious: true };
    }

    const isDescending = this.sortDirection === "desc";

    // "next" = to newer telegram, "previous" = to older telegram
    // For descending sort (newest first): next = -1 (up), previous = +1 (down)
    // For ascending sort (oldest first): next = +1 (down), previous = -1 (up)
    const disableNext = isDescending
      ? currentIndex <= 0 // Can't go to newer in desc (already at newest)
      : currentIndex + 1 >= filteredTelegrams.length; // Can't go to newer in asc (already at newest)

    const disablePrevious = isDescending
      ? currentIndex + 1 >= filteredTelegrams.length // Can't go to older in desc (already at oldest)
      : currentIndex <= 0; // Can't go to older in asc (already at oldest)

    return { disableNext, disablePrevious };
  } // ============================================================================
  // UI Configuration Methods (delegate to FormatService)
  // ============================================================================

  /**
   * Gets the localized search label showing telegram count
   */
  public getSearchLabel(narrow: boolean): string {
    const { filteredTelegrams } = this.getFilteredTelegramsAndDistinctValues();
    return this._formatService.getSearchLabel(narrow, filteredTelegrams.length);
  }

  /**
   * Detects if the current device is a mobile touch device
   */
  public get isMobileTouchDevice(): boolean {
    return this._formatService.isMobileTouchDevice;
  }

  /**
   * Gets the filter configuration for source addresses
   */
  public getSourceFilterConfig(): ListFilterConfig<DistinctValueInfo> {
    return this._formatService.getSourceFilterConfig();
  }

  /**
   * Gets the filter configuration for destination addresses
   */
  public getDestinationFilterConfig(): ListFilterConfig<DistinctValueInfo> {
    return this._formatService.getDestinationFilterConfig();
  }

  /**
   * Gets the filter configuration for direction
   */
  public getDirectionFilterConfig(): ListFilterConfig<DistinctValueInfo> {
    return this._formatService.getDirectionFilterConfig();
  }

  /**
   * Gets the filter configuration for telegram type
   */
  public getTelegramTypeFilterConfig(): ListFilterConfig<DistinctValueInfo> {
    return this._formatService.getTelegramTypeFilterConfig();
  }

  /**
   * Formats the telegram offset with appropriate precision
   */
  public formatOffsetWithPrecision(offsetMicros: number | null): string {
    return this._formatService.formatOffsetWithPrecision(offsetMicros);
  }

  /**
   * Gets column configuration data for the data table
   */
  public getColumnConfig(narrow: boolean, projectLoaded: boolean) {
    return this._formatService.getColumnConfig(narrow, projectLoaded);
  }

  // ============================================================================
  // Menu and Action Methods (delegate to various services)
  // ============================================================================

  /**
   * Creates the overflow menu items for telegram rows
   */
  public getTelegramActionsMenuItems(row: TelegramRow, route?: Route): IconOverflowMenuItem[] {
    const items: IconOverflowMenuItem[] = [];

    // Add related addresses option only if a project is loaded
    if (this._isProjectLoaded) {
      items.push({
        path: mdiFilterVariant,
        label: this._knx?.localize("group_monitor_menu_related_addresses") || "",
        action: () => {
          this.applyRelatedAddressesFilter(row.destinationAddress, route);
        },
      });
    }

    // Add create automation option
    items.push({
      path: mdiPencilOutline,
      label: this._knx?.localize("group_monitor_menu_create_automation") || "",
      action: () => this.createAutomationFromTelegram(row),
    });

    return items;
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
    const success = openAutomationEditor({
      data: newAutomation,
      expanded: true,
    });

    if (!success) {
      logger.error("Failed to open automation editor");
    }
  }

  /**
   * Gets related addresses for a group address without UI interactions
   * @returns Object with results or null if no related addresses found
   */
  private _getRelatedAddresses(groupAddress: string): {
    destinationAddresses: string[];
    sourceAddresses: string[];
  } | null {
    if (!this._projectGraph) {
      return null;
    }

    const related = this._projectGraph.getRelatedAddress(groupAddress);
    const relatedGroupAddresses = related.groupAddresses ?? [];
    const relatedDeviceAddresses = related.deviceAddresses ?? [];

    if (relatedGroupAddresses.length === 0 && relatedDeviceAddresses.length === 0) {
      return null;
    }

    // Include the original group address for destination filtering
    const destinationAddresses = [groupAddress, ...relatedGroupAddresses];
    const sourceAddresses = relatedDeviceAddresses;

    return {
      destinationAddresses,
      sourceAddresses,
    };
  }

  /**
   * Applies related addresses based filtering with UI feedback
   * @returns Object with results or null if no related addresses found
   */
  public applyRelatedAddressesFilter(
    groupAddress: string,
    route?: Route,
  ): {
    destinationAddresses: string[];
    sourceAddresses: string[];
  } | null {
    const result = this._getRelatedAddresses(groupAddress);

    if (!result) {
      if (this._knx) {
        const messageKey = !this._projectGraph
          ? "group_monitor_related_addresses_no_project"
          : "group_monitor_related_addresses_no_relations";

        showWarning(this._knx.localize(messageKey, { address: groupAddress }) || "");
      }
      return null;
    }

    // Clear all filters and set destination + source filters
    this.clearFilters(route);
    if (result.destinationAddresses.length) {
      this.setFilterFieldValue("destination", result.destinationAddresses, route);
    }
    if (result.sourceAddresses.length) {
      this.setFilterFieldValue("source", result.sourceAddresses, route);
    }

    // Show a toast notification that related addresses were applied

    if (this._knx) {
      showNotification(
        this._knx.localize("group_monitor_related_addresses_applied", {
          groupAddress,
          destinationCount: result.destinationAddresses.length,
          sourceCount: result.sourceAddresses.length,
        }) || "",
        7000,
      );
    }

    return result;
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  /**
   * Calculates the buffer size for telegram storage
   */
  private _calculateTelegramStorageBuffer(recentTelegramsLength: number): number {
    const tenPercentBuffer = Math.ceil(recentTelegramsLength * 0.1);
    const roundedBuffer = Math.ceil(tenPercentBuffer / 100) * 100;
    return Math.max(roundedBuffer, GroupMonitorController.MIN_TELEGRAM_STORAGE_BUFFER);
  }

  /**
   * Loads recent telegrams from the server
   */
  private async _loadRecentTelegrams(hass: HomeAssistant): Promise<boolean> {
    try {
      const info = await getGroupMonitorInfo(hass);
      this._isProjectLoaded = info.project_loaded;

      // Calculate dynamic telegram storage limit
      const telegramsLength = info.recent_telegrams.length;
      const buffer = this._calculateTelegramStorageBuffer(telegramsLength);
      const telegramStorageLimit = telegramsLength + buffer;

      // Update max telegram count if needed
      if (this._telegramBuffer.maxSize !== telegramStorageLimit) {
        const removedTelegrams = this._telegramBuffer.setMaxSize(telegramStorageLimit);

        // Remove telegrams from filter service
        if (removedTelegrams.length > 0) {
          this._filterService.updateTelegrams([], removedTelegrams);
          this._bufferVersion++;
        }
      }

      // Merge new telegrams with existing ones, avoiding duplicates
      const newTelegramRows = info.recent_telegrams.map((t) => new TelegramRow(t));
      const { added, removed } = this._telegramBuffer.merge(newTelegramRows);

      // Update filter service incrementally
      if (removed.length > 0 || added.length > 0) {
        this._filterService.updateTelegrams(added, removed);
        this._bufferVersion++;
      }

      if (this._connectionError !== null) {
        this._connectionError = null;
      }

      this._isReloadEnabled = false;

      // Trigger re-render if new telegrams were added or if we're recovering from an error
      if (added.length > 0 || this._connectionError === null) {
        this.host.requestUpdate();
      }
      return true;
    } catch (err) {
      logger.error("getGroupMonitorInfo failed", err);
      this._connectionError = err instanceof Error ? err.message : String(err);
      this.host.requestUpdate();
      return false;
    }
  }

  /**
   * Handles new telegram data from WebSocket subscription
   */
  private _handleIncomingTelegram(telegram: TelegramDict): void {
    const telegramRow = new TelegramRow(telegram);

    if (!this._isPaused) {
      const removedTelegrams = this._telegramBuffer.add(telegramRow);
      this._filterService.updateTelegrams([telegramRow], removedTelegrams);
      this._bufferVersion++;

      this.host.requestUpdate();
    } else if (!this._isReloadEnabled) {
      this._isReloadEnabled = true;
      this.host.requestUpdate();
    }
  }
}
