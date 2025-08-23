import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import type { ReactiveControllerHost } from "lit";
import { GroupMonitorController } from "./group-monitor-controller";

// Mock der benötigten Services und Module
vi.mock("../services/websocket.service", () => ({
  getGroupMonitorInfo: vi.fn().mockResolvedValue({
    project_loaded: false,
    recent_telegrams: [],
  }),
}));

vi.mock("../services/connection-service", () => ({
  ConnectionService: vi.fn().mockImplementation(() => ({
    isConnected: false,
    onTelegram: vi.fn(),
    onConnectionChange: vi.fn(),
    subscribe: vi.fn(),
    disconnect: vi.fn(),
    reconnect: vi.fn(),
  })),
}));

vi.mock("../services/telegram-buffer-service", () => ({
  TelegramBufferService: vi.fn().mockImplementation(() => ({
    snapshot: [],
    clear: vi.fn(),
    merge: vi.fn().mockReturnValue({ added: [], removed: [] }),
    add: vi.fn().mockReturnValue([]),
    setMaxSize: vi.fn().mockReturnValue([]),
    maxSize: 2000,
  })),
}));

vi.mock("../services/filter-service", () => ({
  FilterService: vi.fn().mockImplementation(() => ({
    filters: {},
    sortColumn: "timestampIso",
    sortDirection: "desc",
    setFilters: vi.fn(),
    clear: vi.fn(),
    updateTelegrams: vi.fn(),
    toggleFilterValue: vi.fn(),
    clearFilters: vi.fn(),
    setFilterFieldValue: vi.fn(),
    getFilteredTelegramsAndDistinctValues: vi.fn().mockReturnValue({
      filteredTelegrams: [],
      distinctValues: { source: {}, destination: {}, direction: {}, telegramtype: {} },
    }),
  })),
}));

vi.mock("../services/telegram-format-service", () => ({
  TelegramFormatService: vi.fn().mockImplementation(() => ({
    updateHass: vi.fn(),
    updateKnx: vi.fn(),
  })),
}));

vi.mock("../services/telegram-navigation-service", () => ({
  TelegramNavigationService: vi.fn().mockImplementation(() => ({
    selectedTelegramId: null,
  })),
}));

vi.mock("../services/url-sync-service", () => ({
  UrlSyncService: vi.fn().mockImplementation(() => ({
    getFiltersFromUrl: vi.fn(),
    updateUrlFromFilters: vi.fn(),
  })),
}));

vi.mock("../services/automation-service", () => ({
  AutomationService: vi.fn().mockImplementation(() => ({
    updateKnx: vi.fn(),
    updateProjectGraph: vi.fn(),
  })),
}));

vi.mock("../services/related-address-service", () => ({
  RelatedAddressService: vi.fn().mockImplementation(() => ({
    updateKnx: vi.fn(),
    updateProjectGraph: vi.fn(),
  })),
}));

vi.mock("../services/menu-service", () => ({
  MenuService: vi.fn().mockImplementation(() => ({
    updateKnx: vi.fn(),
    updateProjectLoaded: vi.fn(),
  })),
}));

vi.mock("../services/project-graph", () => ({
  default: vi.fn().mockImplementation(() => ({
    onLoaded: vi.fn().mockReturnValue(() => {
      /* noop */
    }),
    isLoaded: false,
  })),
}));

describe("GroupMonitorController URL Filter Integration", () => {
  let controller: GroupMonitorController;
  let mockHost: ReactiveControllerHost;
  let originalLocation: Location;
  let mockHass: any;
  let mockKnx: any;

  beforeEach(() => {
    // Mock Host
    mockHost = {
      addController: vi.fn(),
      requestUpdate: vi.fn(),
    } as any;

    // Mock HomeAssistant
    mockHass = {
      callWS: vi.fn().mockResolvedValue({
        telegrams: [],
        info: {
          recent_telegrams_max_count: 2000,
        },
      }),
      localize: vi.fn().mockImplementation((key: string) => key),
    };

    // Mock KNX
    mockKnx = {
      config_entry: { entry_id: "test-entry-id" },
    };

    // Store original location
    originalLocation = window.location;

    controller = new GroupMonitorController(mockHost);
  });

  afterEach(() => {
    // Restore original location
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  describe("URL Filter Parameter Loading", () => {
    it("should load filter parameters from URL on hostConnected", () => {
      // Arrange: Mock URL with filter parameters
      const mockSearch =
        "?source=1.1.1,1.1.2&destination=1/2/3&direction=Incoming&telegramtype=GroupValueWrite";
      Object.defineProperty(window, "location", {
        value: {
          ...originalLocation,
          search: mockSearch,
        },
        writable: true,
      });

      // Mock UrlSyncService to return expected filters
      const expectedFilters = {
        source: ["1.1.1", "1.1.2"],
        destination: ["1/2/3"],
        direction: ["Incoming"],
        telegramtype: ["GroupValueWrite"],
      };

      const mockUrlSyncService = controller._urlSyncService;
      vi.mocked(mockUrlSyncService.getFiltersFromUrl).mockReturnValue(expectedFilters);

      // Act: Call hostConnected (simulates component connection)
      controller.hostConnected();

      // Assert: FilterService should be called with URL filters
      const mockFilterService = controller._filterService;
      expect(mockUrlSyncService.getFiltersFromUrl).toHaveBeenCalled();
      expect(mockFilterService.setFilters).toHaveBeenCalledWith(expectedFilters);
      expect(mockHost.requestUpdate).toHaveBeenCalled();
    });

    it("should handle empty URL parameters gracefully", () => {
      // Arrange: Mock URL without filter parameters
      Object.defineProperty(window, "location", {
        value: {
          ...originalLocation,
          search: "",
        },
        writable: true,
      });

      const mockUrlSyncService = controller._urlSyncService;
      vi.mocked(mockUrlSyncService.getFiltersFromUrl).mockReturnValue({});

      // Act
      controller.hostConnected();

      // Assert: No filters should be set
      const mockFilterService = controller._filterService;
      expect(mockUrlSyncService.getFiltersFromUrl).toHaveBeenCalled();
      expect(mockFilterService.setFilters).not.toHaveBeenCalled();
      expect(mockHost.requestUpdate).not.toHaveBeenCalled();
    });

    it("should handle partial URL parameters", () => {
      // Arrange: Mock URL with only some filter parameters
      const mockSearch = "?source=1.1.1&destination=1/2/3";
      Object.defineProperty(window, "location", {
        value: {
          ...originalLocation,
          search: mockSearch,
        },
        writable: true,
      });

      const expectedFilters = {
        source: ["1.1.1"],
        destination: ["1/2/3"],
      };

      const mockUrlSyncService = controller._urlSyncService;
      vi.mocked(mockUrlSyncService.getFiltersFromUrl).mockReturnValue(expectedFilters);

      // Act
      controller.hostConnected();

      // Assert
      const mockFilterService = controller._filterService;
      expect(mockFilterService.setFilters).toHaveBeenCalledWith(expectedFilters);
      expect(mockHost.requestUpdate).toHaveBeenCalled();
    });

    it("should handle malformed URL parameters", () => {
      // Arrange: Mock URL with malformed parameters
      const mockSearch = "?source=&destination=invalid&direction=&telegramtype=";
      Object.defineProperty(window, "location", {
        value: {
          ...originalLocation,
          search: mockSearch,
        },
        writable: true,
      });

      const mockUrlSyncService = controller._urlSyncService;
      vi.mocked(mockUrlSyncService.getFiltersFromUrl).mockReturnValue({});

      // Act: Connect controller
      controller.hostConnected();

      // Assert: Should not set any filters
      const mockFilterService = controller._filterService;
      expect(mockFilterService.setFilters).not.toHaveBeenCalled();
    });

    it("should preserve URL filters after setup() recreates FilterService", async () => {
      // Arrange: Mock URL with filter parameters
      const mockSearch = "?source=1.1.1&destination=2/3/4";
      Object.defineProperty(window, "location", {
        value: {
          ...originalLocation,
          search: mockSearch,
        },
        writable: true,
      });

      const urlFilters = {
        source: ["1.1.1"],
        destination: ["2/3/4"],
      };

      const mockUrlSyncService = controller._urlSyncService;
      vi.mocked(mockUrlSyncService.getFiltersFromUrl).mockReturnValue(urlFilters);

      // Act: hostConnected loads filters, then setup() recreates FilterService
      controller.hostConnected();
      await controller.setup(mockHass, mockKnx);

      // Assert: Filters should be reapplied after setup()
      // Note: The first FilterService is replaced by setup(), so we check the final one
      const mockFilterService = controller._filterService;
      expect(mockFilterService.setFilters).toHaveBeenCalledWith(urlFilters);
      // Should be called once in setup (the hostConnected call was on the old instance)
      expect(mockFilterService.setFilters).toHaveBeenCalledTimes(1);
    });
  });

  describe("Filter to URL Synchronization", () => {
    it("should update URL when filters are changed", async () => {
      // Arrange: Setup controller and services
      const mockRoute = {
        prefix: "/knx",
        path: "/group-monitor",
      };

      // Mock empty URL filters for setup
      const mockUrlSyncService = controller._urlSyncService;
      vi.mocked(mockUrlSyncService.getFiltersFromUrl).mockReturnValue({});

      await controller.setup(mockHass, mockKnx);

      const mockFilterService = controller._filterService;

      // Mock current filters in FilterService
      Object.defineProperty(mockFilterService, "filters", {
        get: vi.fn().mockReturnValue({
          source: ["1.1.1"],
          destination: ["1/2/3"],
        }),
      });

      // Act: Change filter via controller
      controller.toggleFilterValue("source", "1.1.2", mockRoute);

      // Assert: UrlSyncService should be called to update URL
      expect(mockUrlSyncService.updateUrlFromFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          source: expect.any(Array),
          destination: expect.any(Array),
        }),
        mockRoute,
      );
    });

    it("should update URL when filters are cleared", async () => {
      // Arrange
      const mockRoute = {
        prefix: "/knx",
        path: "/group-monitor",
      };

      // Mock empty URL filters for setup
      const mockUrlSyncService = controller._urlSyncService;
      vi.mocked(mockUrlSyncService.getFiltersFromUrl).mockReturnValue({});

      await controller.setup(mockHass, mockKnx);

      const mockFilterService = controller._filterService;

      // Mock empty filters after clearing
      Object.defineProperty(mockFilterService, "filters", {
        get: vi.fn().mockReturnValue({}),
      });

      // Act
      controller.clearFilters(mockRoute);

      // Assert
      expect(mockUrlSyncService.updateUrlFromFilters).toHaveBeenCalledWith({}, mockRoute);
    });
  });

  describe("End-to-End URL Filter Flow", () => {
    it("should maintain filter state across page reload simulation", () => {
      // Arrange: Simulate page with existing filters in URL
      const mockSearch = "?source=1.1.1&destination=1/2/3,1/2/4&direction=Incoming";
      Object.defineProperty(window, "location", {
        value: {
          ...originalLocation,
          search: mockSearch,
        },
        writable: true,
      });

      const urlFilters = {
        source: ["1.1.1"],
        destination: ["1/2/3", "1/2/4"],
        direction: ["Incoming"],
      };

      const mockUrlSyncService = controller._urlSyncService;
      vi.mocked(mockUrlSyncService.getFiltersFromUrl).mockReturnValue(urlFilters);

      // Act: Simulate component mounting
      controller.hostConnected();

      // Assert: Filters should be loaded from URL
      const mockFilterService = controller._filterService;
      expect(mockFilterService.setFilters).toHaveBeenCalledWith(urlFilters);

      // Verify controller returns the correct filters
      Object.defineProperty(mockFilterService, "filters", {
        get: vi.fn().mockReturnValue(urlFilters),
      });
      expect(controller.filters).toEqual(urlFilters);
    });
  });
});
