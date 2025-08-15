import { TypedFastBitSet } from "typedfastbitset";

// Local definitions to avoid depending on external modules during testing
export type FilterField = "source" | "destination" | "direction" | "telegramtype";
export type FilterMap = Record<FilterField, ReadonlySet<string>>;

// Minimal telegram representation used by the bitset service
export interface TelegramLike {
  id: string;
  sourceAddress: string;
  destinationAddress: string;
  direction: string;
  type: string;
}

/**
 * Service for calculating distinct counts using bitsets
 */
export class DistinctCountBitsetService {
  private _bitsets = new Map<FilterField, Map<string, TypedFastBitSet>>();

  // Map telegram ID to bit index for efficient removals
  private _idToIndex = new Map<string, number>();

  // Bitset containing all telegram indices for quick "no filter" handling
  private _allBitset = new TypedFastBitSet();

  // Monotonically increasing index to avoid shifting bit positions
  private _nextIndex = 0;

  constructor() {
    const fields: FilterField[] = ["source", "destination", "direction", "telegramtype"];
    for (const field of fields) {
      this._bitsets.set(field, new Map());
    }
  }

  /**
   * Clears all bitsets and resets internal mappings
   */
  public clear(): void {
    for (const map of this._bitsets.values()) {
      map.clear();
    }
    this._idToIndex.clear();
    this._allBitset = new TypedFastBitSet();
    this._nextIndex = 0;
  }

  /**
   * Rebuilds all bitsets from the provided telegram array
   */
  public rebuild(telegrams: readonly TelegramLike[]): void {
    this.clear();
    telegrams.forEach((telegram) => this.add(telegram));
  }

  /**
   * Adds telegrams incrementally to the bitsets
   */
  public add(telegrams: TelegramLike | TelegramLike[]): void {
    const array = Array.isArray(telegrams) ? telegrams : [telegrams];
    for (const telegram of array) {
      const index = this._nextIndex++;
      this._idToIndex.set(telegram.id, index);
      this._addToBitsets(telegram, index);
      this._allBitset.add(index);
    }
  }

  /**
   * Removes telegrams from the bitsets
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
    }
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

    const result = base.clone();

    for (const [f, values] of Object.entries(filters) as [FilterField, ReadonlySet<string>][]) {
      // If same field has filters and does not include the value, result is 0
      if (f === field) {
        if (values.size > 0 && !values.has(value)) {
          return 0;
        }
        continue;
      }

      if (values.size === 0) continue;

      const union = new TypedFastBitSet();
      for (const v of values) {
        const bs = this._bitsets.get(f)?.get(v);
        if (bs) {
          union.union(bs);
        }
      }
      result.intersection(union);
      if (result.isEmpty()) {
        return 0;
      }
    }

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
   * Filters the provided telegram array using the current bitset filters
   */
  public filterTelegrams<T extends TelegramLike>(telegrams: readonly T[], filters: FilterMap): T[] {
    const bitset = this.getFilteredBitset(filters);

    // If bitset represents all telegrams, return a shallow copy of the array
    if (bitset.size() === this._allBitset.size()) {
      return [...telegrams];
    }

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

export default DistinctCountBitsetService;
