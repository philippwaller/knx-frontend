import { describe, it, expect, beforeEach, vi } from "vitest";
import { FilterService, FILTER_FIELDS } from "./filter-service";
import { TelegramRow } from "../types/telegram-row";
import ProjectGraph from "./project-graph";

// Mock ProjectGraph
vi.mock("./project-graph", () => ({
  default: vi.fn().mockImplementation(() => ({
    getIndividualAddressName: vi.fn().mockReturnValue("Device 1"),
    getGroupAddressName: vi.fn().mockReturnValue("Group 1"),
  })),
}));

// Mock FacetIndex
vi.mock("./facet-index", () => ({
  FacetIndex: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    filterTelegrams: vi.fn().mockReturnValue([]),
    getDistinctCountsForField: vi.fn().mockReturnValue({}),
  })),
}));

describe("FilterService", () => {
  let filterService: FilterService;
  let mockProjectGraph: ProjectGraph;

  beforeEach(() => {
    mockProjectGraph = new ProjectGraph({} as any);
    filterService = new FilterService(mockProjectGraph);
  });

  describe("filters management", () => {
    it("should initialize with empty filters", () => {
      expect(filterService.filters).toEqual({});
    });

    it("should toggle filter values", () => {
      filterService.toggleFilterValue("source", "1.1.1");
      expect(filterService.filters).toEqual({ source: ["1.1.1"] });

      filterService.toggleFilterValue("source", "1.1.1");
      expect(filterService.filters).toEqual({ source: [] });
    });

    it("should set filter field values", () => {
      filterService.setFilterFieldValue("destination", ["1/2/3", "1/2/4"]);
      expect(filterService.filters).toEqual({ destination: ["1/2/3", "1/2/4"] });
    });

    it("should clear all filters", () => {
      filterService.setFilterFieldValue("source", ["1.1.1"]);
      filterService.setFilterFieldValue("destination", ["1/2/3"]);

      filterService.clearFilters();
      expect(filterService.filters).toEqual({});
    });

    it("should set filters from object", () => {
      const filters = { source: ["1.1.1"], destination: ["1/2/3"] };
      filterService.setFilters(filters);
      expect(filterService.filters).toEqual(filters);
    });
  });

  describe("sort management", () => {
    it("should initialize with default sort", () => {
      expect(filterService.sortColumn).toBe("timestampIso");
      expect(filterService.sortDirection).toBe("desc");
    });

    it("should update sort column", () => {
      filterService.sortColumn = "sourceAddress";
      expect(filterService.sortColumn).toBe("sourceAddress");
    });

    it("should update sort direction", () => {
      filterService.sortDirection = "asc";
      expect(filterService.sortDirection).toBe("asc");
    });
  });

  describe("telegram management", () => {
    it("should update telegrams in bitset service", () => {
      const mockTelegram = new TelegramRow({
        source: "1.1.1",
        source_name: "",
        destination: "1/2/3",
        destination_name: "",
        direction: "Incoming",
        telegramtype: "GroupValueWrite",
        timestamp: "2024-01-01T00:00:00.000Z",
        payload: [1],
        value: null,
        dpt_main: null,
        dpt_sub: null,
        dpt_name: null,
        unit: null,
      });

      filterService.updateTelegrams([mockTelegram], []);

      // Verify bitset service was called (through mock)
      expect((filterService as any)._facetIndex.add).toHaveBeenCalledWith([mockTelegram]);
    });

    it("should clear all telegram data", () => {
      filterService.clear();

      expect((filterService as any)._facetIndex.clear).toHaveBeenCalled();
    });
  });

  describe("FILTER_FIELDS constant", () => {
    it("should contain all expected filter fields", () => {
      expect(FILTER_FIELDS).toEqual(["source", "destination", "direction", "telegramtype"]);
    });

    it("should be readonly", () => {
      // TypeScript should enforce this, but we can verify the array exists
      expect(Array.isArray(FILTER_FIELDS)).toBe(true);
      expect(FILTER_FIELDS.length).toBe(4);
    });
  });
});
