import { describe, it, expect, beforeEach } from "vitest";
import { DistinctCountBitsetService, type FilterMap } from "./distinct-count-bitset-service";

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

describe("DistinctCountBitsetService", () => {
  let service: DistinctCountBitsetService;
  let filters: FilterMap;

  beforeEach(() => {
    service = new DistinctCountBitsetService();
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

    filters.direction.add("Outgoing");
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

    filters.direction.add("Incoming");
    let result = service.filterTelegrams([t1, t2, t3], filters);
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).toEqual(["2", "3"]);

    filters.telegramtype.add("GroupValueRead");
    result = service.filterTelegrams([t1, t2, t3], filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("3");
  });
});
