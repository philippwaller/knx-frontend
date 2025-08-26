import { describe, it, expect, vi } from "vitest";
import {
  validateFilters,
  sanitizeFilters,
  getValidDirections,
  getValidTelegramTypes,
} from "./filter-validation";
import {
  isDeviceAddress,
  isGroupAddress,
  isValidDirection,
  isValidTelegramType,
} from "../../../utils/address-validation";

// Mock the KNXLogger
vi.mock("../../../tools/knx-logger", () => ({
  KNXLogger: vi.fn().mockImplementation(() => ({
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  })),
}));

describe("Filter validation functions", () => {
  describe("direct usage of address validation for source validation", () => {
    it("should validate correct individual addresses via isDeviceAddress", () => {
      const validSources = ["1.2.3", "0.0.0", "15.15.255", "1.1.1"];

      for (const source of validSources) {
        const result = isDeviceAddress(source);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it("should reject invalid individual address formats via isDeviceAddress", () => {
      const invalidSources = [
        "1/2/3", // Wrong separator
        "1.2", // Too few parts
        "1.2.3.4", // Too many parts
        "a.b.c", // Non-numeric
        "1..3", // Empty part
        "", // Empty string
        "  ", // Whitespace only
      ];

      for (const source of invalidSources) {
        const result = isDeviceAddress(source);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe("direct usage of address validation for destination validation", () => {
    it("should validate correct group addresses via isGroupAddress", () => {
      const validDestinations = ["1/2/3", "0/0/0", "31/7/255", "1/1/1"];

      for (const destination of validDestinations) {
        const result = isGroupAddress(destination);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it("should reject invalid group address formats via isGroupAddress", () => {
      const invalidDestinations = [
        "1.2.3", // Wrong separator
        "1/2", // Too few parts
        "1/2/3/4", // Too many parts
        "a/b/c", // Non-numeric
        "1//3", // Empty part
        "", // Empty string
        "  ", // Whitespace only
      ];

      for (const destination of invalidDestinations) {
        const result = isGroupAddress(destination);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe("direct usage of address validation for direction validation", () => {
    it("should validate correct directions via isValidDirection", () => {
      const validDirections = ["Incoming", "Outgoing"];
      const validDirectionsList = getValidDirections();

      for (const direction of validDirections) {
        const result = isValidDirection(direction, validDirectionsList);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it("should reject invalid directions via isValidDirection", () => {
      const invalidDirections = [
        "incoming", // Wrong case
        "OUTGOING", // Wrong case
        "Invalid", // Not in list
        "", // Empty string
        "  ", // Whitespace only
      ];
      const validDirectionsList = getValidDirections();

      for (const direction of invalidDirections) {
        const result = isValidDirection(direction, validDirectionsList);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe("direct usage of address validation for telegram type validation", () => {
    it("should validate correct telegram types via isValidTelegramType", () => {
      const validTelegramTypesList = getValidTelegramTypes();
      const validTelegramTypes = ["GroupValueRead", "GroupValueWrite", "GroupValueResponse"];

      for (const telegramType of validTelegramTypes) {
        const result = isValidTelegramType(telegramType, validTelegramTypesList);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it("should reject invalid telegram types via isValidTelegramType", () => {
      const invalidTelegramTypes = [
        "groupvalueread", // Wrong case
        "GROUP_VALUE_WRITE", // Wrong case
        "Invalid", // Not in list
        "", // Empty string
        "  ", // Whitespace only
      ];
      const validTelegramTypesList = getValidTelegramTypes();

      for (const telegramType of invalidTelegramTypes) {
        const result = isValidTelegramType(telegramType, validTelegramTypesList);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe("validateFilters", () => {
    it("should validate correct filter object", () => {
      const validFilters = {
        source: ["1.2.3"],
        destination: ["1/2/3"],
        direction: ["Incoming"],
        telegramtype: ["GroupValueRead"],
      };

      const result = validateFilters(validFilters);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject unsupported filter fields", () => {
      const invalidFilters = {
        source: ["1.2.3"],
        unsupported: ["value"],
      };

      const result = validateFilters(invalidFilters);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((error) => error.includes("Unsupported filter field"))).toBe(true);
    });

    it("should validate individual filter field arrays", () => {
      const invalidFilters = {
        source: ["invalid.source"],
        destination: ["invalid/destination"],
        direction: ["InvalidDirection"],
        telegramtype: ["InvalidTelegramType"],
      };

      const result = validateFilters(invalidFilters);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should handle empty filter object", () => {
      const result = validateFilters({});
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("sanitizeFilters", () => {
    it("should remove invalid values and keep valid ones", () => {
      const mixedFilters = {
        source: ["1.2.3", "invalid.source", "4.5.6"],
        destination: ["1/2/3", "invalid/destination", "4/5/6"],
        direction: ["Incoming", "InvalidDirection", "Outgoing"],
        telegramtype: ["GroupValueRead", "InvalidType", "GroupValueWrite"],
      };

      const result = sanitizeFilters(mixedFilters);

      expect(result.source).toEqual(["1.2.3", "4.5.6"]);
      expect(result.destination).toEqual(["1/2/3", "4/5/6"]);
      expect(result.direction).toEqual(["Incoming", "Outgoing"]);
      expect(result.telegramtype).toEqual(["GroupValueRead", "GroupValueWrite"]);
    });

    it("should handle filters with all invalid values", () => {
      const invalidFilters = {
        source: ["invalid.source"],
        destination: ["invalid/destination"],
        direction: ["InvalidDirection"],
        telegramtype: ["InvalidType"],
      };

      const result = sanitizeFilters(invalidFilters);

      expect(result.source).toBeUndefined();
      expect(result.destination).toBeUndefined();
      expect(result.direction).toBeUndefined();
      expect(result.telegramtype).toBeUndefined();
    });

    it("should handle empty filter object", () => {
      const result = sanitizeFilters({});
      expect(result).toEqual({});
    });

    it("should trim whitespace and remove duplicates", () => {
      const filtersWithWhitespace = {
        source: ["  1.2.3  ", "1.2.3", "  4.5.6  "],
        direction: ["  Incoming  ", "Incoming", "  Outgoing  "],
      };

      const result = sanitizeFilters(filtersWithWhitespace);

      expect(result.source).toEqual(["1.2.3", "4.5.6"]);
      expect(result.direction).toEqual(["Incoming", "Outgoing"]);
    });
  });

  describe("getValidDirections", () => {
    it("should return valid directions", () => {
      const directions = getValidDirections();
      expect(directions).toEqual(["Incoming", "Outgoing"]);
    });
  });

  describe("getValidTelegramTypes", () => {
    it("should return valid telegram types", () => {
      const telegramTypes = getValidTelegramTypes();
      expect(telegramTypes.length).toBeGreaterThan(0);
      expect(telegramTypes).toContain("GroupValueRead");
      expect(telegramTypes).toContain("GroupValueWrite");
      expect(telegramTypes).toContain("GroupValueResponse");
    });
  });
});
