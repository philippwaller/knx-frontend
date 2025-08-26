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

  describe("Menu Actions", () => {
    beforeEach(async () => {
      await controller.setup(mockHass, mockKnx);
    });

    it("should create telegram action menu items when project is loaded", () => {
      // Mock that project is loaded
      controller.isProjectLoaded = true;

      const mockTelegram = {
        destinationAddress: "1/2/3",
        sourceAddress: "1.1.1",
        direction: "Incoming",
      } as any;

      const menuItems = controller.getTelegramActionsMenuItems(mockTelegram);

      expect(menuItems).toHaveLength(2);
      expect(menuItems[0].label).toBe("group_monitor_menu_related_addresses");
      expect(menuItems[1].label).toBe("group_monitor_menu_create_automation");
      expect(typeof menuItems[0].action).toBe("function");
      expect(typeof menuItems[1].action).toBe("function");
    });

    it("should create telegram action menu items without related addresses when project is not loaded", () => {
      // Mock that project is not loaded
      controller.isProjectLoaded = false;

      const mockTelegram = {
        destinationAddress: "1/2/3",
        sourceAddress: "1.1.1",
        direction: "Incoming",
      } as any;

      const menuItems = controller.getTelegramActionsMenuItems(mockTelegram);

      expect(menuItems).toHaveLength(1);
      expect(menuItems[0].label).toBe("group_monitor_menu_create_automation");
      expect(typeof menuItems[0].action).toBe("function");
    });

    it("should pass route parameter to applyRelatedAddressesFilter when provided", () => {
      // Mock that project is loaded
      controller.isProjectLoaded = true;

      const mockTelegram = {
        destinationAddress: "1/2/3",
        sourceAddress: "1.1.1",
        direction: "Incoming",
      } as any;

      const mockRoute = {
        prefix: "/knx",
        path: "/group-monitor",
      } as any;

      // Spy on the applyRelatedAddressesFilter method
      const spy = vi.spyOn(controller, "applyRelatedAddressesFilter");

      const menuItems = controller.getTelegramActionsMenuItems(mockTelegram, mockRoute);

      // Execute the first menu item action (related addresses filter)
      menuItems[0].action();

      // Verify that the method was called with both parameters
      expect(spy).toHaveBeenCalledWith("1/2/3", mockRoute);
    });
  });
});
