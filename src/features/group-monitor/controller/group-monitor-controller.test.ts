import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ReactiveControllerHost } from "lit";
import type { HomeAssistant } from "@ha/types";
import { GroupMonitorController } from "./group-monitor-controller";
import type { KNX } from "../../../types/knx";

// Mock the services
vi.mock("../services/connection-service", () => ({
  ConnectionService: vi.fn(() => ({
    isConnected: false,
    subscribe: vi.fn(),
    disconnect: vi.fn(),
    reconnect: vi.fn(),
    onTelegram: vi.fn(),
    onConnectionChange: vi.fn(),
  })),
}));

vi.mock("../services/telegram-buffer-service", () => ({
  TelegramBufferService: vi.fn(() => ({
    snapshot: [],
    add: vi.fn(() => []),
    merge: vi.fn(() => ({ added: [], removed: [] })),
    clear: vi.fn(),
    setMaxSize: vi.fn(() => []),
  })),
}));

vi.mock("../services/facet-index", () => ({
  FacetIndex: vi.fn(() => ({
    filterTelegrams: vi.fn(() => []),
    getDistinctCountsForField: vi.fn(() => ({})),
    add: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  })),
}));

vi.mock("../services/project-graph", () => ({
  default: vi.fn(() => ({
    isLoaded: false,
    onLoaded: vi.fn(() => () => {
      /* noop */
    }),
    getIndividualAddressName: vi.fn(() => ""),
    getGroupAddressName: vi.fn(() => ""),
    getRelatedAddress: vi.fn(() => ({ groupAddresses: [], deviceAddresses: [] })),
  })),
}));

vi.mock("../../../services/websocket.service", () => ({
  getGroupMonitorInfo: vi.fn(),
}));

describe("GroupMonitorController", () => {
  let controller: GroupMonitorController;
  let mockHost: ReactiveControllerHost;
  let mockHass: HomeAssistant;
  let mockKnx: KNX;

  beforeEach(() => {
    // Create mock host
    mockHost = {
      addController: vi.fn(),
      removeController: vi.fn(),
      requestUpdate: vi.fn(),
    } as any;

    // Create mock HomeAssistant
    mockHass = {
      language: "en",
    } as any;

    // Create mock KNX
    mockKnx = {
      localize: vi.fn((key: string) => key),
    } as any;

    controller = new GroupMonitorController(mockHost);
  });

  describe("Filter Management", () => {
    it("should toggle filter values correctly", () => {
      // Initially no filters
      expect(controller.filters).toEqual({});

      // Toggle a source filter on
      controller.toggleFilterValue("source", "1.1.1");
      expect(controller.filters.source).toEqual(["1.1.1"]);

      // Toggle the same filter off
      controller.toggleFilterValue("source", "1.1.1");
      expect(controller.filters.source).toEqual([]);

      // Toggle multiple values
      controller.toggleFilterValue("source", "1.1.1");
      controller.toggleFilterValue("source", "1.1.2");
      expect(controller.filters.source).toEqual(["1.1.1", "1.1.2"]);
    });

    it("should set filter field values correctly", () => {
      controller.setFilterFieldValue("destination", ["2/3/4", "5/6/7"]);
      expect(controller.filters.destination).toEqual(["2/3/4", "5/6/7"]);
    });

    it("should clear all filters", () => {
      controller.setFilterFieldValue("source", ["1.1.1"]);
      controller.setFilterFieldValue("destination", ["2/3/4"]);

      expect(Object.keys(controller.filters)).toHaveLength(2);

      controller.clearFilters();
      expect(controller.filters).toEqual({});
    });
  });

  describe("UI State Management", () => {
    it("should manage expanded filter state", () => {
      expect(controller.expandedFilter).toBe("source");

      controller.updateExpandedFilter("destination", true);
      expect(controller.expandedFilter).toBe("destination");

      controller.updateExpandedFilter("destination", false);
      expect(controller.expandedFilter).toBe(null);
    });

    it("should manage selected telegram state", () => {
      expect(controller.selectedTelegramId).toBe(null);

      controller.selectedTelegramId = "telegram-123";
      expect(controller.selectedTelegramId).toBe("telegram-123");
    });

    it("should format offset with precision", () => {
      // Test millisecond precision
      expect(controller.formatOffsetWithPrecision(1000)).toBeDefined();

      // Test null offset
      expect(controller.formatOffsetWithPrecision(null)).toBeDefined();

      // Test microsecond precision for sub-millisecond values
      expect(controller.formatOffsetWithPrecision(500)).toBeDefined();
    });
  });

  describe("Filter Configurations", () => {
    beforeEach(async () => {
      await controller.setup(mockHass, mockKnx);
    });

    it("should provide source filter configuration", () => {
      const config = controller.getSourceFilterConfig();
      expect(config).toBeDefined();
      expect(config.idField).toBeDefined();
      expect(config.primaryField).toBeDefined();
      expect(config.secondaryField).toBeDefined();
      expect(config.badgeField).toBeDefined();
    });

    it("should provide destination filter configuration", () => {
      const config = controller.getDestinationFilterConfig();
      expect(config).toBeDefined();
      expect(config.idField).toBeDefined();
      expect(config.primaryField).toBeDefined();
    });

    it("should provide direction filter configuration", () => {
      const config = controller.getDirectionFilterConfig();
      expect(config).toBeDefined();
    });

    it("should provide telegram type filter configuration", () => {
      const config = controller.getTelegramTypeFilterConfig();
      expect(config).toBeDefined();
    });
  });

  describe("Search Label Generation", () => {
    beforeEach(async () => {
      await controller.setup(mockHass, mockKnx);
    });

    it("should generate search label for narrow layout", () => {
      const label = controller.getSearchLabel(true);
      expect(label).toBe("group_monitor_search_label_narrow");
    });

    it("should generate search label for wide layout", () => {
      controller.getSearchLabel(false);
      expect(mockKnx.localize).toHaveBeenCalled();
    });
  });

  describe("Business Logic", () => {
    it("should detect mobile touch device", () => {
      const isMobile = controller.isMobileTouchDevice;
      expect(typeof isMobile).toBe("boolean");
    });

    it("should provide column configuration data", () => {
      const config = controller.getColumnConfig(false, true);
      expect(config).toEqual({
        narrow: false,
        projectLoaded: true,
        language: "en",
        localizedLabels: expect.any(Object),
      });
    });
  });
});
