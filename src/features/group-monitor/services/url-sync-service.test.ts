import { describe, it, expect, vi, beforeEach } from "vitest";

import { navigate } from "@ha/common/navigate";
import { mainWindow } from "@ha/common/dom/get_main_window";
import { UrlSyncService } from "./url-sync-service";

// Mock the KNXLogger
vi.mock("../../../tools/knx-logger", () => ({
  KNXLogger: vi.fn().mockImplementation(() => ({
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  })),
}));

// Mock the navigate function
vi.mock("@ha/common/navigate", () => ({
  navigate: vi.fn(),
}));

// Mock the main window
vi.mock("@ha/common/dom/get_main_window", () => ({
  mainWindow: {
    location: {
      search: "",
    },
  },
}));

describe("UrlSyncService", () => {
  let urlSyncService: UrlSyncService;

  beforeEach(() => {
    urlSyncService = new UrlSyncService();
    (mainWindow.location as any).search = "";
    vi.clearAllMocks();
  });

  describe("getFiltersFromUrl", () => {
    it("should return empty object when no URL parameters", () => {
      (mainWindow.location as any).search = "";

      const result = urlSyncService.getFiltersFromUrl();

      expect(result).toEqual({});
    });

    it("should parse valid URL parameters correctly", () => {
      (mainWindow.location as any).search =
        "?source=1.2.3,4.5.6&destination=1/2/3&direction=Incoming&telegramtype=GroupValueWrite";

      const result = urlSyncService.getFiltersFromUrl();

      expect(result).toEqual({
        source: ["1.2.3", "4.5.6"],
        destination: ["1/2/3"],
        direction: ["Incoming"],
        telegramtype: ["GroupValueWrite"],
      });
    });

    it("should handle single values in URL parameters", () => {
      (mainWindow.location as any).search = "?source=1.2.3&direction=Outgoing";

      const result = urlSyncService.getFiltersFromUrl();

      expect(result).toEqual({
        source: ["1.2.3"],
        direction: ["Outgoing"],
      });
    });

    it("should sanitize invalid values and keep valid ones", () => {
      (mainWindow.location as any).search =
        "?source=1.2.3,invalid,4.5.6&direction=Incoming,invalid,Outgoing";

      const result = urlSyncService.getFiltersFromUrl();

      expect(result).toEqual({
        source: ["1.2.3", "4.5.6"],
        direction: ["Incoming", "Outgoing"],
      });
    });

    it("should return empty object when all values are invalid", () => {
      (mainWindow.location as any).search =
        "?source=invalid&direction=invalid&telegramtype=invalid";

      const result = urlSyncService.getFiltersFromUrl();

      expect(result).toEqual({});
    });

    it("should handle mixed valid and invalid parameters", () => {
      (mainWindow.location as any).search =
        "?source=invalid&destination=1/2/3&direction=invalid&telegramtype=GroupValueWrite";

      const result = urlSyncService.getFiltersFromUrl();

      expect(result).toEqual({
        destination: ["1/2/3"],
        telegramtype: ["GroupValueWrite"],
      });
    });

    it("should handle URL encoded values", () => {
      (mainWindow.location as any).search = "?source=1.2.3&destination=1%2F2%2F3";

      const result = urlSyncService.getFiltersFromUrl();

      expect(result).toEqual({
        source: ["1.2.3"],
        destination: ["1/2/3"],
      });
    });

    it("should remove empty arrays from result", () => {
      (mainWindow.location as any).search = "?source=&destination=1/2/3&direction=";

      const result = urlSyncService.getFiltersFromUrl();

      expect(result).toEqual({
        destination: ["1/2/3"],
      });
    });

    it("should handle duplicate values in comma-separated lists", () => {
      (mainWindow.location as any).search = "?source=1.2.3,1.2.3,4.5.6&direction=Incoming,Incoming";

      const result = urlSyncService.getFiltersFromUrl();

      // The FilterValidationUtils.sanitizeFilters removes duplicates
      expect(result).toEqual({
        source: ["1.2.3", "4.5.6"],
        direction: ["Incoming"],
      });
    });

    it("should handle whitespace in values", () => {
      (mainWindow.location as any).search = "?source= 1.2.3 , 4.5.6 &direction= Incoming ";

      const result = urlSyncService.getFiltersFromUrl();

      expect(result).toEqual({
        source: ["1.2.3", "4.5.6"],
        direction: ["Incoming"],
      });
    });

    it("should handle invalid telegram type values", () => {
      (mainWindow.location as any).search =
        "?telegramtype=groupvalueread,Write,Invalid,GroupValueWrite";

      const result = urlSyncService.getFiltersFromUrl();

      expect(result).toEqual({
        telegramtype: ["GroupValueWrite"],
      });
    });
  });

  describe("updateUrlFromFilters", () => {
    const mockRoute = {
      prefix: "/knx",
      path: "/group-monitor",
    };

    it("should warn and return early when no route provided", () => {
      const filters = { source: ["1.2.3"] };

      urlSyncService.updateUrlFromFilters(filters);

      expect(navigate).not.toHaveBeenCalled();
    });

    it("should construct URL with filters", () => {
      const filters = {
        source: ["1.2.3", "4.5.6"],
        destination: ["1/2/3"],
        direction: ["Incoming"],
        telegramtype: ["GroupValueWrite"],
      };

      urlSyncService.updateUrlFromFilters(filters, mockRoute);

      expect(navigate).toHaveBeenCalledWith(
        "/knx/group-monitor?source=1.2.3,4.5.6&destination=1/2/3&direction=Incoming&telegramtype=GroupValueWrite",
        { replace: true },
      );
    });

    it("should construct URL without query parameters when filters are empty", () => {
      const filters = {};

      urlSyncService.updateUrlFromFilters(filters, mockRoute);

      expect(navigate).toHaveBeenCalledWith("/knx/group-monitor", { replace: true });
    });

    it("should skip empty filter arrays", () => {
      const filters = {
        source: ["1.2.3"],
        destination: [],
        direction: ["Incoming"],
        telegramtype: [],
      };

      urlSyncService.updateUrlFromFilters(filters, mockRoute);

      expect(navigate).toHaveBeenCalledWith("/knx/group-monitor?source=1.2.3&direction=Incoming", {
        replace: true,
      });
    });
  });
});
