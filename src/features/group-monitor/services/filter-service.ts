import type { SortingDirection } from "@ha/components/data-table/ha-data-table";
import memoize from "memoize-one";

import type { TelegramRow, OffsetMicros } from "../types/telegram-row";
import { FacetIndex } from "./facet-index";
import { extractMicrosecondsFromIso } from "../../../utils/format";
import type ProjectGraph from "./project-graph";

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
 * Service responsible for all filtering operations on telegrams
 */
export class FilterService {
  private _facetIndex = new FacetIndex();

  private _filters: Record<string, string[]> = {};

  private _sortColumn?: string = "timestampIso";

  private _sortDirection: SortingDirection = "desc";

  constructor(private _projectGraph?: ProjectGraph) {}

  // ============================================================================
  // Public API
  // ============================================================================

  public get filters(): Record<string, string[]> {
    return this._filters;
  }

  public get sortColumn(): string | undefined {
    return this._sortColumn;
  }

  public set sortColumn(value: string | undefined) {
    this._sortColumn = value;
  }

  public get sortDirection(): SortingDirection {
    return this._sortDirection;
  }

  public set sortDirection(value: SortingDirection) {
    this._sortDirection = value;
  }

  /**
   * Updates the bitset service when telegrams are added or removed
   */
  public updateTelegrams(added: TelegramRow[], removed: TelegramRow[]): void {
    if (removed.length > 0) {
      this._facetIndex.remove(removed);
    }
    if (added.length > 0) {
      this._facetIndex.add(added);
    }
  }

  /**
   * Clears all telegram data from the filter service
   */
  public clear(): void {
    this._facetIndex.clear();
  }

  /**
   * Gets both filtered telegrams and distinct values in a single synchronized call
   */
  public getFilteredTelegramsAndDistinctValues(
    projectVersion: number,
    bufferVersion: number,
    telegrams: readonly TelegramRow[],
  ): FilteredTelegramsResult {
    return this._getFilteredTelegramsAndDistinctValues(
      projectVersion,
      bufferVersion,
      JSON.stringify(this._filters),
      telegrams,
      this._sortColumn,
      this._sortDirection,
    );
  }

  /**
   * Toggles a filter value on/off for a specific field
   */
  public toggleFilterValue(field: string, value: string): void {
    const currentFilters = this._filters[field] ?? [];
    if (currentFilters.includes(value)) {
      this._filters = {
        ...this._filters,
        [field]: currentFilters.filter((item) => item !== value),
      };
    } else {
      this._filters = { ...this._filters, [field]: [...currentFilters, value] };
    }
  }

  /**
   * Updates filter values for a specific field
   */
  public setFilterFieldValue(field: string, value: string[]): void {
    this._filters = { ...this._filters, [field]: value };
  }

  /**
   * Clears all active filters
   */
  public clearFilters(): void {
    this._filters = {};
  }

  /**
   * Sets filters from an object (used for URL parsing)
   */
  public setFilters(filters: Record<string, string[]>): void {
    this._filters = { ...filters };
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  /**
   * Combined computation of filtered telegrams and distinct values with filtered counts
   * Ensures both states are always synchronized and computed together
   */
  private _getFilteredTelegramsAndDistinctValues = memoize(
    (
      _projectVersion: number,
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
      const filteredTelegrams = this._facetIndex.filterTelegrams(allTelegrams, filtersMap);

      // Sort telegrams if a sort column and direction are specified
      if (sortColumn && sortDirection) {
        this._sortTelegrams(filteredTelegrams, sortColumn, sortDirection);
      }

      // Calculate relative time offsets
      this._calculateOffsets(filteredTelegrams, sortColumn, sortDirection);

      const distinctValuesWithFilteredCounts: DistinctValues = {
        source: {},
        destination: {},
        direction: {},
        telegramtype: {},
      };

      for (const field of FILTER_FIELDS) {
        // Use optimized batch processing to get all counts for this field at once
        const fieldCounts = this._facetIndex.getDistinctCountsForField(field, filtersMap);

        // Convert to the expected format with names
        for (const [id, counts] of Object.entries(fieldCounts)) {
          const name = this._getNameForFieldValue(field, id);
          distinctValuesWithFilteredCounts[field][id] = {
            id,
            name,
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
              crossFilteredCount: 0,
            };
          }
        }
      }

      return { filteredTelegrams, distinctValues: distinctValuesWithFilteredCounts };
    },
  );

  /**
   * Sorts telegrams by the specified column and direction
   */
  private _sortTelegrams(
    telegrams: TelegramRow[],
    sortColumn: string,
    sortDirection: SortingDirection,
  ): void {
    telegrams.sort((a, b) => {
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

  /**
   * Calculates relative time offsets for telegrams
   */
  private _calculateOffsets(
    telegrams: TelegramRow[],
    sortColumn?: string,
    sortDirection?: SortingDirection,
  ): void {
    for (let i = 0; i < telegrams.length; i++) {
      const telegram = telegrams[i];

      if ((sortColumn === "timestampIso" && sortDirection) || !sortColumn) {
        let previousTelegram: TelegramRow | null = null;

        if (sortDirection === "desc" && sortColumn) {
          previousTelegram = i < telegrams.length - 1 ? telegrams[i + 1] : null;
        } else {
          previousTelegram = i > 0 ? telegrams[i - 1] : null;
        }

        telegram.offset = this._calculateTelegramOffset(telegram, previousTelegram);
      } else {
        telegram.offset = null;
      }
    }
  }

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
        return this._projectGraph?.getIndividualAddressName(id) || "";
      case "destination":
        return this._projectGraph?.getGroupAddressName(id) || "";
      case "direction":
      case "telegramtype":
        return "";
      default:
        return "";
    }
  }
}
