import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { HomeAssistant, Route } from "@ha/types";
import { navigate } from "@ha/common/navigate";
import { mainWindow } from "@ha/common/dom/get_main_window";
import memoize from "memoize-one";
import type { SortingDirection } from "@ha/components/data-table/ha-data-table";

import { getGroupMonitorInfo } from "../../../services/websocket.service";
import { TelegramBufferService } from "../services/telegram-buffer-service";
import { ConnectionService } from "../services/connection-service";
import { DistinctCountBitsetService } from "../services/distinct-count-bitset-service";
import { KNXLogger } from "../../../tools/knx-logger";
import { TelegramRow, type OffsetMicros } from "../types/telegram-row";
import type { TelegramDict } from "../../../types/websocket";
import { extractMicrosecondsFromIso } from "../../../utils/format";
import AddressNameService from "../services/address-name-service";
import type { KNX } from "../../../types/knx";

const logger = new KNXLogger("group_monitor_controller");

// Filter and distinct values types for type safety
export type FilterField = "source" | "destination" | "direction" | "telegramtype";

// All filter fields as a constant array
export const FILTER_FIELDS: readonly FilterField[] = [
  "source",
  "destination",
  "direction",
  "telegramtype",
] as const;

export type FilterMap = Record<FilterField, ReadonlySet<string>>;

export interface DistinctValueInfo {
  id: string;
  name: string;
  totalCount: number;
  filteredCount?: number;
  crossFilteredCount?: number;
}

export type DistinctValues = Record<FilterField, Record<string, DistinctValueInfo>>;

/**
 * Combined result of telegram filtering and distinct values calculation
 */
export interface FilteredTelegramsResult {
  filteredTelegrams: TelegramRow[];
  distinctValues: DistinctValues;
}

/**
 * GroupMonitor ReactiveController
 *
 * Manages all business logic for the KNX Group Monitor:
 * - WebSocket telegram subscriptions
 * - Telegram data management with array buffer
 * - Filter state and URL synchronization
 * - High-performance distinct values calculation for filters
 * - Connection state management
 */
export class GroupMonitorController implements ReactiveController {
  /** Minimum buffer size for telegram storage beyond recent telegrams length */
  private static readonly MIN_TELEGRAM_STORAGE_BUFFER = 1000;

  private host: ReactiveControllerHost;

  // Connection service for WebSocket telegram subscriptions
  private _connectionService = new ConnectionService();

  // Telegram buffer service
  private _telegramBuffer = new TelegramBufferService(2000);

  // Bitset-based distinct count service
  private _bitsetService = new DistinctCountBitsetService();

  // Name resolution service using KNX project data
  private _nameService = new AddressNameService();

  // KNX context for project data access
  private _knx?: KNX;

  // UI state
  private _selectedTelegramId: string | null = null;

  private _filters: Record<string, string[]> = {};

  private _sortColumn?: string = "timestampIso";

  private _sortDirection: SortingDirection = "desc";

  private _expandedFilter: string | null = "source";

  private _isReloadEnabled = false;

  private _isPaused = false;

  // undefined until initial info is fetched; then true/false
  private _isProjectLoaded: boolean | undefined = undefined;

  private _connectionError: string | null = null;

  // Buffer version counter for memoization cache invalidation
  private _bufferVersion = 0;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);

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
    this._setFiltersFromUrl();
  }

  hostDisconnected(): void {
    this._connectionService.disconnect();
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
    return this._filters;
  }

  public get sortColumn(): string | undefined {
    return this._sortColumn;
  }

  public set sortColumn(value: string | undefined) {
    this._sortColumn = value;
    this.host.requestUpdate();
  }

  public get sortDirection(): SortingDirection | undefined {
    return this._sortDirection;
  }

  public set sortDirection(value: SortingDirection | undefined) {
    this._sortDirection = value || "desc";
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

  /**
   * Gets both filtered telegrams and distinct values in a single synchronized call
   */
  public getFilteredTelegramsAndDistinctValues(): FilteredTelegramsResult {
    return this._getFilteredTelegramsAndDistinctValues(
      this._bufferVersion,
      JSON.stringify(this._filters),
      this._telegramBuffer.snapshot,
      this._sortColumn,
      this._sortDirection,
    );
  }

  /**
   * Combined computation of filtered telegrams and distinct values with filtered counts
   * Ensures both states are always synchronized and computed together
   */
  private _getFilteredTelegramsAndDistinctValues = memoize(
    (
      _bufferVersion: number,
      _filtersJson: string,
      allTelegrams: readonly TelegramRow[],
      sortColumn?: string,
      sortDirection?: SortingDirection,
    ): FilteredTelegramsResult => {
      const filtersMap: FilterMap = {
        source: new Set(this._filters.source || []),
        destination: new Set(this._filters.destination || []),
        direction: new Set(this._filters.direction || []),
        telegramtype: new Set(this._filters.telegramtype || []),
      };

      // Filter telegrams using bitset service
      const filteredTelegrams = this._bitsetService.filterTelegrams(allTelegrams, filtersMap);

      // Sort telegrams if a sort column and direction are specified
      if (sortColumn && sortDirection) {
        filteredTelegrams.sort((a, b) => {
          let aValue: any;
          let bValue: any;

          switch (sortColumn) {
            case "timestampIso":
              // Sort by ISO timestamp string directly to preserve microsecond precision
              aValue = a.timestampIso;
              bValue = b.timestampIso;
              break;
            case "sourceAddress":
              aValue = a.sourceAddress;
              bValue = b.sourceAddress;
              break;
            case "destinationAddress":
              aValue = a.destinationAddress;
              bValue = b.destinationAddress;
              break;
            case "sourceText":
              aValue = a.sourceText || "";
              bValue = b.sourceText || "";
              break;
            case "destinationText":
              aValue = a.destinationText || "";
              bValue = b.destinationText || "";
              break;
            default:
              // For other columns, use string comparison on the property
              aValue = (a as any)[sortColumn] || "";
              bValue = (b as any)[sortColumn] || "";
          }

          let result: number;
          if (typeof aValue === "string" && typeof bValue === "string") {
            result = aValue.localeCompare(bValue);
          } else {
            result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          }

          return sortDirection === "asc" ? result : -result;
        });
      }

      // Calculate relative time offsets
      for (let i = 0; i < filteredTelegrams.length; i++) {
        const telegram = filteredTelegrams[i];

        if ((sortColumn === "timestampIso" && sortDirection) || !sortColumn) {
          let previousTelegram: TelegramRow | null = null;

          if (sortDirection === "desc" && sortColumn) {
            previousTelegram = i < filteredTelegrams.length - 1 ? filteredTelegrams[i + 1] : null;
          } else {
            previousTelegram = i > 0 ? filteredTelegrams[i - 1] : null;
          }

          telegram.offset = this._calculateTelegramOffset(telegram, previousTelegram);
        } else {
          telegram.offset = null;
        }
      }

      const distinctValuesWithFilteredCounts: DistinctValues = {
        source: {},
        destination: {},
        direction: {},
        telegramtype: {},
      };

      for (const field of FILTER_FIELDS) {
        // Use optimized batch processing to get all counts for this field at once
        const fieldCounts = this._bitsetService.getDistinctCountsForField(field, filtersMap);

        // Convert to the expected format with names
        for (const [id, counts] of Object.entries(fieldCounts)) {
          const name = this._getNameForFieldValue(field, id);
          distinctValuesWithFilteredCounts[field][id] = {
            id,
            name,
            totalCount: counts.totalCount,
            filteredCount: counts.filteredCount,
            crossFilteredCount: counts.crossFilteredCount,
          };
        }

        // Add selected filter values that are not in the data (with count 0)
        const activeFilterValues = this._filters[field] || [];
        for (const filterId of activeFilterValues) {
          if (!distinctValuesWithFilteredCounts[field][filterId]) {
            const name = this._getNameForFieldValue(field, filterId);
            distinctValuesWithFilteredCounts[field][filterId] = {
              id: filterId,
              name,
              totalCount: 0,
              filteredCount: 0,
              crossFilteredCount: 0,
            };
          }
        }
      }

      return { filteredTelegrams, distinctValues: distinctValuesWithFilteredCounts };
    },
  );

  // ============================================================================
  // Filter methods
  // ============================================================================

  /**
   * Toggles a filter value on/off for a specific field
   */
  public toggleFilterValue(field: string, value: string, route?: Route): void {
    const currentFilters = this._filters[field] ?? [];
    if (currentFilters.includes(value)) {
      this._filters = {
        ...this._filters,
        [field]: currentFilters.filter((item) => item !== value),
      };
    } else {
      this._filters = { ...this._filters, [field]: [...currentFilters, value] };
    }

    this._updateUrlFromFilters(route);

    this.host.requestUpdate();
  }

  /**
   * Updates filter values for a specific field
   */
  public setFilterFieldValue(field: string, value: string[], route?: Route): void {
    this._filters = { ...this._filters, [field]: value };
    this._updateUrlFromFilters(route);

    this.host.requestUpdate();
  }

  /**
   * Clears all active filters
   */
  public clearFilters(route?: Route): void {
    this._filters = {};
    this._updateUrlFromFilters(route);

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
    this._bitsetService.clear();
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
  public navigateTelegram(step: number, filteredRows: TelegramRow[]): void {
    if (!this._selectedTelegramId) return;

    const currentIndex = filteredRows.findIndex((row) => row.id === this._selectedTelegramId);
    const targetIndex = currentIndex + step;

    if (targetIndex >= 0 && targetIndex < filteredRows.length) {
      this._selectedTelegramId = filteredRows[targetIndex].id;
      this.host.requestUpdate();
    }
  }

  // ============================================================================
  // Distinct values management
  // ============================================================================

  /**
   * Calculates the relative time offset between two telegrams in microseconds
   * @param currentTelegram - The telegram to calculate offset for
   * @param previousTelegram - The previous telegram to calculate offset from (null for first telegram)
   * @returns The calculated offset in microseconds (null for first telegram)
   */
  private _calculateTelegramOffset(
    currentTelegram: TelegramRow,
    previousTelegram: TelegramRow | null,
  ): OffsetMicros {
    if (!previousTelegram) {
      // First telegram gets null to indicate no previous telegram
      return null;
    }

    const currentMicros = extractMicrosecondsFromIso(currentTelegram.timestampIso);
    const previousMicros = extractMicrosecondsFromIso(previousTelegram.timestampIso);

    // Always calculate the time difference to get positive values
    // For both sort directions, we now pass the chronologically earlier telegram as "previous"
    return currentMicros - previousMicros;
  }

  /**
   * Gets the name for a specific field value
   */
  private _getNameForFieldValue(field: FilterField, id: string): string {
    switch (field) {
      case "source":
        return this._nameService.getIndividualAddressName(id);
      case "destination":
        return this._nameService.getGroupAddressName(id);
      case "direction":
      case "telegramtype":
        return "";
      default:
        return "";
    }
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

      if (info.project_loaded) {
        if (this._knx && !this._knx.project) {
          await this._knx.loadProject();
        }
        this._nameService.setProject(this._knx?.project?.knxproject ?? null);
      } else {
        this._nameService.setProject(null);
      }

      // Calculate dynamic telegram storage limit
      const telegramsLength = info.recent_telegrams.length;
      const buffer = this._calculateTelegramStorageBuffer(telegramsLength);
      const telegramStorageLimit = telegramsLength + buffer;

      // Update max telegram count if needed
      if (this._telegramBuffer.maxSize !== telegramStorageLimit) {
        const removedTelegrams = this._telegramBuffer.setMaxSize(telegramStorageLimit);

        // Remove telegrams from bitset service
        if (removedTelegrams.length > 0) {
          this._bitsetService.remove(removedTelegrams);
          this._bufferVersion++;
        }
      }

      // Merge new telegrams with existing ones, avoiding duplicates
      const newTelegramRows = info.recent_telegrams.map((t) => new TelegramRow(t));
      const { added, removed } = this._telegramBuffer.merge(newTelegramRows);

      // Update bitset service incrementally
      if (removed.length > 0) {
        this._bitsetService.remove(removed);
        this._bufferVersion++;
      }

      if (added.length > 0) {
        this._bitsetService.add(added);
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
      if (removedTelegrams.length > 0) {
        this._bitsetService.remove(removedTelegrams);
        this._bufferVersion++;
      }

      this._bitsetService.add(telegramRow);
      this._bufferVersion++;

      this.host.requestUpdate();
    } else if (!this._isReloadEnabled) {
      this._isReloadEnabled = true;
      this.host.requestUpdate();
    }
  }

  /**
   * Updates the URL with current filter state
   */
  private _updateUrlFromFilters(route?: Route): void {
    if (!route) {
      logger.warn("Route not available, cannot update URL");
      return;
    }

    const params = new URLSearchParams();

    Object.entries(this._filters).forEach(([key, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        params.set(key, values.join(","));
      }
    });

    const newPath = params.toString()
      ? `${route.prefix}${route.path}?${params.toString()}`
      : `${route.prefix}${route.path}`;

    navigate(decodeURIComponent(newPath), { replace: true });
  }

  /**
   * Sets filters from URL query parameters
   */
  private _setFiltersFromUrl(): void {
    const searchParams = new URLSearchParams(mainWindow.location.search);
    const source = searchParams.get("source");
    const destination = searchParams.get("destination");
    const direction = searchParams.get("direction");
    const telegramtype = searchParams.get("telegramtype");

    if (!source && !destination && !direction && !telegramtype) {
      return;
    }

    this._filters = {
      source: source ? source.split(",") : [],
      destination: destination ? destination.split(",") : [],
      direction: direction ? direction.split(",") : [],
      telegramtype: telegramtype ? telegramtype.split(",") : [],
    };

    this.host.requestUpdate();
  }
}
