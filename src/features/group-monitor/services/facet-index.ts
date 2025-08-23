import { TypedFastBitSet } from "typedfastbitset";

// Local definitions to avoid depending on external modules during testing
export type FilterField = "source" | "destination" | "direction" | "telegramtype";
export type FilterMap = Record<FilterField, ReadonlySet<string>>;

// Minimal telegram representation used by the index
export interface TelegramLike {
  id: string;
  sourceAddress: string;
  destinationAddress: string;
  direction: string;
  type: string;
}

/**
 * Faceted index for distinct counts and fast filtering.
 *
 * Implementation detail: uses bitsets internally for performance.
 */
export class FacetIndex {
  private _bitsets = new Map<FilterField, Map<string, TypedFastBitSet>>();

  // Map telegram ID to bit index for efficient removals
  private _idToIndex = new Map<string, number>();

  // Bitset containing all telegram indices for quick "no filter" handling
  private _allBitset = new TypedFastBitSet();

  // Monotonically increasing index to avoid shifting bit positions
  private _nextIndex = 0;

  // Pool of freed indices to avoid unbounded growth
  private _freeIndices: number[] = [];

  constructor() {
    const fields: FilterField[] = ["source", "destination", "direction", "telegramtype"];
    for (const field of fields) {
      this._bitsets.set(field, new Map());
    }
  }

  /**
   * Clears all data and resets internal mappings
   */
  public clear(): void {
    for (const map of this._bitsets.values()) {
      map.clear();
    }
    this._idToIndex.clear();
    this._allBitset = new TypedFastBitSet();
    this._nextIndex = 0;
    this._freeIndices = [];
  }

  /**
   * Rebuilds the index from the provided telegram array
   */
  public rebuild(telegrams: readonly TelegramLike[]): void {
    this.clear();
    telegrams.forEach((telegram) => this.add(telegram));
  }

  /**
   * Adds telegrams incrementally to the index
   */
  public add(telegrams: TelegramLike | TelegramLike[]): void {
    const array = Array.isArray(telegrams) ? telegrams : [telegrams];
    for (const telegram of array) {
      const index =
        this._freeIndices.length > 0 ? (this._freeIndices.pop() as number) : this._nextIndex++;
      this._idToIndex.set(telegram.id, index);
      this._addToBitsets(telegram, index);
      this._allBitset.add(index);
    }
  }

  /**
   * Removes telegrams from the index
   */
  public remove(telegrams: readonly TelegramLike[]): void {
    for (const telegram of telegrams) {
      const index = this._idToIndex.get(telegram.id);
      if (index === undefined) continue;

      const mapping: Record<FilterField, string> = {
        source: telegram.sourceAddress,
        destination: telegram.destinationAddress,
        direction: telegram.direction,
        telegramtype: telegram.type,
      };

      for (const [field, val] of Object.entries(mapping) as [FilterField, string][]) {
        const bitset = this._bitsets.get(field)?.get(val);
        bitset?.remove(index);
        if (bitset && bitset.isEmpty()) {
          this._bitsets.get(field)?.delete(val);
        }
      }

      this._idToIndex.delete(telegram.id);
      this._allBitset.remove(index);
      // Recycle the freed index for future additions
      this._freeIndices.push(index);
    }
  }

  /**
   * Pre-computes filter bitsets for all fields excluding a specific field
   * Returns the intersection of unions for other fields
   */
  private _computeFiltersExcludingField(
    filters: FilterMap,
    excludeField: FilterField,
  ): TypedFastBitSet | null {
    let result: TypedFastBitSet | null = null;

    for (const [f, values] of Object.entries(filters) as [FilterField, ReadonlySet<string>][]) {
      // Skip the excluded field
      if (f === excludeField) continue;

      if (values.size === 0) continue;

      const union = new TypedFastBitSet();
      for (const v of values) {
        const bs = this._bitsets.get(f)?.get(v);
        if (bs) {
          union.union(bs);
        }
      }

      if (result === null) {
        result = union;
      } else {
        result.intersection(union);
      }

      if (result.isEmpty()) {
        return new TypedFastBitSet(); // Return empty bitset for short-circuit
      }
    }

    return result;
  }

  /**
   * Efficiently computes distinct counts for all values in a field with filtering.
   * Optimized for batch processing by pre-computing filter bitsets once per field.
   */
  public getDistinctCountsForField(
    field: FilterField,
    filters?: FilterMap,
  ): Record<string, { crossFilteredCount: number }> {
    const result: Record<string, { crossFilteredCount: number }> = {};

    const fieldMap = this._bitsets.get(field);
    if (!fieldMap) return result;

    // If no filters, all counts are the same as total counts
    if (!filters) {
      for (const [id, bitset] of fieldMap) {
        const totalCount = bitset.size();
        result[id] = {
          crossFilteredCount: totalCount,
        };
      }
      return result;
    }

    // Pre-compute filter bitsets once per field
    const filtersExcludingField = this._computeFiltersExcludingField(filters, field);

    // Process all IDs in the field
    for (const [id, baseBitset] of fieldMap) {
      const totalCount = baseBitset.size();

      // Calculate cross-filtered count (ignoring same-field filters)
      let crossFilteredCount = 0;
      if (filtersExcludingField === null) {
        // No other field filters exist
        crossFilteredCount = totalCount;
      } else if (filtersExcludingField.isEmpty()) {
        // Other field filters result in empty set
        crossFilteredCount = 0;
      } else {
        // Intersect with other field filters
        const tempResult = baseBitset.clone();
        tempResult.intersection(filtersExcludingField);
        crossFilteredCount = tempResult.size();
      }

      result[id] = {
        crossFilteredCount,
      };
    }

    return result;
  }

  /**
   * Gets the distinct count for a field/value combination under the given filters
   * If no filters are provided, returns the total count for the field/value combination
   */
  public getDistinctCount(field: FilterField, value: string, filters?: FilterMap): number {
    const base = this._bitsets.get(field)?.get(value);
    if (!base) return 0;

    // If no filters provided, return total count
    if (!filters) {
      return base.size();
    }

    // Check if same field has filters and does not include the value
    const sameFieldValues = filters[field];
    if (sameFieldValues && sameFieldValues.size > 0 && !sameFieldValues.has(value)) {
      return 0;
    }

    // Compute filters excluding this field once
    const filtersExcludingField = this._computeFiltersExcludingField(filters, field);

    // If no other field filters exist, return base size
    if (filtersExcludingField === null) {
      return base.size();
    }

    // If other field filters result in empty set, return 0
    if (filtersExcludingField.isEmpty()) {
      return 0;
    }

    // Intersect base with the pre-computed filter bitset
    const result = base.clone();
    result.intersection(filtersExcludingField);
    return result.size();
  }

  /**
   * Gets the distinct count for a field/value combination while ignoring filters on the same field.
   * Useful for UI facet counts where we want to see the effect of other filters,
   * but not self-filtering on the field being enumerated.
   */
  public getDistinctCountIgnoringSelf(
    field: FilterField,
    value: string,
    filters?: FilterMap,
  ): number {
    const base = this._bitsets.get(field)?.get(value);
    if (!base) return 0;

    if (!filters) return base.size();

    // Compute filters excluding this field once (ignoring same-field filters entirely)
    const filtersExcludingField = this._computeFiltersExcludingField(filters, field);

    // If no other field filters exist, return base size
    if (filtersExcludingField === null) {
      return base.size();
    }

    // If other field filters result in empty set, return 0
    if (filtersExcludingField.isEmpty()) {
      return 0;
    }

    // Intersect base with the pre-computed filter bitset
    const result = base.clone();
    result.intersection(filtersExcludingField);
    return result.size();
  }

  /**
   * Computes a bitset representing all telegram indices that match the given filters
   */
  public getFilteredBitset(filters: FilterMap): TypedFastBitSet {
    let result: TypedFastBitSet | null = null;

    for (const [field, values] of Object.entries(filters) as [FilterField, ReadonlySet<string>][]) {
      if (values.size === 0) continue;

      const union = new TypedFastBitSet();
      for (const value of values) {
        const bs = this._bitsets.get(field)?.get(value);
        if (bs) {
          union.union(bs);
        }
      }

      if (result === null) {
        result = union;
      } else {
        result.intersection(union);
      }

      if (result.isEmpty()) {
        return new TypedFastBitSet();
      }
    }

    return result || this._allBitset.clone();
  }

  /**
   * Gets all distinct IDs for a given field
   */
  public getDistinctIds(field: FilterField): string[] {
    const fieldMap = this._bitsets.get(field);
    return fieldMap ? Array.from(fieldMap.keys()) : [];
  }

  /**
   * Filters the provided telegram array using the current filters
   */
  public filterTelegrams<T extends TelegramLike>(telegrams: readonly T[], filters: FilterMap): T[] {
    // Early exit if no filter values are set in any field
    const hasAnyFilter = Object.values(filters).some((set) => set.size > 0);
    if (!hasAnyFilter) return [...telegrams];

    const bitset = this.getFilteredBitset(filters);

    const result: T[] = [];
    for (const telegram of telegrams) {
      const index = this._idToIndex.get(telegram.id);
      if (index !== undefined && bitset.has(index)) {
        result.push(telegram);
      }
    }
    return result;
  }

  private _addToBitsets(telegram: TelegramLike, index: number): void {
    const mapping: Record<FilterField, string> = {
      source: telegram.sourceAddress,
      destination: telegram.destinationAddress,
      direction: telegram.direction,
      telegramtype: telegram.type,
    };

    for (const [field, val] of Object.entries(mapping) as [FilterField, string][]) {
      const fieldMap = this._bitsets.get(field)!;
      let bitset = fieldMap.get(val);
      if (!bitset) {
        bitset = new TypedFastBitSet();
        fieldMap.set(val, bitset);
      }
      bitset.add(index);
    }
  }
}

export default FacetIndex;
