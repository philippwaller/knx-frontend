import { describe, it, expect, beforeEach } from "vitest";
import { FacetIndex, type FilterMap } from "./facet-index";

interface TelegramLike {
  id: string;
  sourceAddress: string;
  destinationAddress: string;
  direction: string;
  type: string;
}

function createTelegram(id: string, overrides: Partial<TelegramLike> = {}): TelegramLike {
  return {
    id,
    sourceAddress: overrides.sourceAddress ?? `1.2.${id}`,
    destinationAddress: overrides.destinationAddress ?? `1/2/${id}`,
    direction: overrides.direction ?? "Outgoing",
    type: overrides.type ?? "GroupValueWrite",
  };
}

describe("FacetIndex", () => {
  let service: FacetIndex;
  let filters: FilterMap;

  beforeEach(() => {
    service = new FacetIndex();
    filters = {
      source: new Set(),
      destination: new Set(),
      direction: new Set(),
      telegramtype: new Set(),
    };
  });

  it("tracks counts incrementally", () => {
    const t1 = createTelegram("1");
    const t2 = createTelegram("2", { direction: "Incoming" });

    service.add([t1, t2]);
    expect(service.getDistinctCount("source", "1.2.1", filters)).toBe(1);

    filters.direction = new Set(["Outgoing"]);
    expect(service.getDistinctCount("source", "1.2.1", filters)).toBe(1);

    filters.direction = new Set(["Incoming"]);
    expect(service.getDistinctCount("source", "1.2.1", filters)).toBe(0);

    filters.direction = new Set();
    service.remove([t1]);
    expect(service.getDistinctCount("source", "1.2.1", filters)).toBe(0);

    service.add(t1);
    expect(service.getDistinctCount("source", "1.2.1", filters)).toBe(1);
  });

  it("filters telegrams using bitsets", () => {
    const t1 = createTelegram("1");
    const t2 = createTelegram("2", { direction: "Incoming" });
    const t3 = createTelegram("3", { direction: "Incoming", type: "GroupValueRead" });

    service.add([t1, t2, t3]);

    filters.direction = new Set(["Incoming"]);
    let result = service.filterTelegrams([t1, t2, t3], filters);
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).toEqual(["2", "3"]);

    filters.telegramtype = new Set(["GroupValueRead"]);
    result = service.filterTelegrams([t1, t2, t3], filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("3");
  });

  it("computes cross-filtered counts ignoring self-field filters", () => {
    const t1 = createTelegram("1", { sourceAddress: "1.2.1", direction: "Outgoing" });
    const t2 = createTelegram("2", { sourceAddress: "1.2.2", direction: "Outgoing" });
    const t3 = createTelegram("3", { sourceAddress: "1.2.1", direction: "Incoming" });

    service.add([t1, t2, t3]);

    // Case A: Only same-field filter (source) set to a different value
    const fA: FilterMap = {
      source: new Set(["1.2.2"]),
      destination: new Set(),
      direction: new Set(),
      telegramtype: new Set(),
    };

    // Standard semantics: self-filter excludes other values
    expect(service.getDistinctCount("source", "1.2.1", fA)).toBe(0);
    // Ignoring self-filter: returns total for that value (no other filters)
    expect(service.getDistinctCountIgnoringSelf("source", "1.2.1", fA)).toBe(2);

    // Case B: Same-field filter plus another field filter
    const fB: FilterMap = {
      source: new Set(["1.2.2"]),
      destination: new Set(),
      direction: new Set(["Outgoing"]),
      telegramtype: new Set(),
    };

    // Standard semantics still zero
    expect(service.getDistinctCount("source", "1.2.1", fB)).toBe(0);
    // Ignoring self-filter: intersect with direction=Outgoing only => only t1 matches
    expect(service.getDistinctCountIgnoringSelf("source", "1.2.1", fB)).toBe(1);
  });
});
