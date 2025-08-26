import { describe, it, expect, vi } from "vitest";
import { AddressValidationUtils } from "./address-validation";

describe("AddressValidationUtils", () => {
  describe("isDeviceAddress", () => {
    it("should validate correct individual addresses", () => {
      const validAddresses = ["1.2.3", "0.0.0", "15.15.255", "1.1.1"];

      for (const address of validAddresses) {
        const result = AddressValidationUtils.isDeviceAddress(address);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it("should reject invalid individual address formats", () => {
      const invalidAddresses = [
        "1/2/3", // Wrong separator
        "1.2", // Too few parts
        "1.2.3.4", // Too many parts
        "a.b.c", // Non-numeric
        "1..3", // Empty part
        "", // Empty string
        "  ", // Whitespace only
      ];

      for (const address of invalidAddresses) {
        const result = AddressValidationUtils.isDeviceAddress(address);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it("should reject out-of-range values", () => {
      const outOfRangeAddresses = [
        "16.0.0", // Area too high
        "0.16.0", // Line too high
        "0.0.256", // Device too high
        "-1.0.0", // Negative area
        "0.-1.0", // Negative line
        "0.0.-1", // Negative device
      ];

      for (const address of outOfRangeAddresses) {
        const result = AddressValidationUtils.isDeviceAddress(address);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it("should handle non-string input", () => {
      const invalidInputs = [null, undefined, 123, [], {}];

      for (const input of invalidInputs) {
        const result = AddressValidationUtils.isDeviceAddress(input as any);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Device address must be a non-empty string");
      }
    });

    it("should trim whitespace from input", () => {
      const result = AddressValidationUtils.isDeviceAddress("  1.2.3  ");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("isGroupAddress", () => {
    it("should validate correct group addresses", () => {
      const validAddresses = ["1/2/3", "0/0/0", "31/7/255", "1/1/1"];

      for (const address of validAddresses) {
        const result = AddressValidationUtils.isGroupAddress(address);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it("should reject invalid group address formats", () => {
      const invalidAddresses = [
        "1.2.3", // Wrong separator
        "1/2", // Too few parts
        "1/2/3/4", // Too many parts
        "a/b/c", // Non-numeric
        "1//3", // Empty part
        "", // Empty string
        "  ", // Whitespace only
      ];

      for (const address of invalidAddresses) {
        const result = AddressValidationUtils.isGroupAddress(address);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it("should reject out-of-range values", () => {
      const outOfRangeAddresses = [
        "32/0/0", // Main too high
        "0/8/0", // Middle too high
        "0/0/256", // Sub too high
        "-1/0/0", // Negative main
        "0/-1/0", // Negative middle
        "0/0/-1", // Negative sub
      ];

      for (const address of outOfRangeAddresses) {
        const result = AddressValidationUtils.isGroupAddress(address);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it("should handle non-string input", () => {
      const invalidInputs = [null, undefined, 123, [], {}];

      for (const input of invalidInputs) {
        const result = AddressValidationUtils.isGroupAddress(input as any);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Group address must be a non-empty string");
      }
    });

    it("should trim whitespace from input", () => {
      const result = AddressValidationUtils.isGroupAddress("  1/2/3  ");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("isValidDirection", () => {
    const validDirections = ["Incoming", "Outgoing"];

    it("should validate correct directions", () => {
      for (const direction of validDirections) {
        const result = AddressValidationUtils.isValidDirection(direction, validDirections);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it("should reject invalid directions", () => {
      const invalidDirections = ["Invalid", "incoming", "OUTGOING", ""];

      for (const direction of invalidDirections) {
        const result = AddressValidationUtils.isValidDirection(direction, validDirections);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it("should handle non-string input", () => {
      const invalidInputs = [null, undefined, 123, [], {}];

      for (const input of invalidInputs) {
        const result = AddressValidationUtils.isValidDirection(input as any, validDirections);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Direction must be a non-empty string");
      }
    });

    it("should trim whitespace from input", () => {
      const result = AddressValidationUtils.isValidDirection("  Incoming  ", validDirections);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("isValidTelegramType", () => {
    const validTelegramTypes = ["GroupValueRead", "GroupValueWrite", "GroupValueResponse"];

    it("should validate correct telegram types", () => {
      for (const telegramType of validTelegramTypes) {
        const result = AddressValidationUtils.isValidTelegramType(telegramType, validTelegramTypes);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it("should reject invalid telegram types", () => {
      const invalidTelegramTypes = ["Invalid", "groupvalueread", "GROUP_VALUE_WRITE", ""];

      for (const telegramType of invalidTelegramTypes) {
        const result = AddressValidationUtils.isValidTelegramType(telegramType, validTelegramTypes);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it("should handle non-string input", () => {
      const invalidInputs = [null, undefined, 123, [], {}];

      for (const input of invalidInputs) {
        const result = AddressValidationUtils.isValidTelegramType(input as any, validTelegramTypes);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Telegram type must be a non-empty string");
      }
    });

    it("should trim whitespace from input", () => {
      const result = AddressValidationUtils.isValidTelegramType(
        "  GroupValueRead  ",
        validTelegramTypes,
      );
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("validateArray", () => {
    it("should validate arrays correctly", () => {
      const validator = (value: string) =>
        value === "valid"
          ? { isValid: true, errors: [] }
          : { isValid: false, errors: ["Invalid value"] };

      const validArray = ["valid", "valid"];
      const result = AddressValidationUtils.validateArray(validArray, validator, "TestField");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle arrays with invalid values", () => {
      const validator = (value: string) =>
        value === "valid"
          ? { isValid: true, errors: [] }
          : { isValid: false, errors: ["Invalid value"] };

      const mixedArray = ["valid", "invalid", "valid"];
      const result = AddressValidationUtils.validateArray(mixedArray, validator, "TestField");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("TestField[1]: Invalid value");
    });

    it("should handle empty arrays", () => {
      const validator = () => ({ isValid: false, errors: ["Should not be called"] });

      const result = AddressValidationUtils.validateArray([], validator, "TestField");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle non-array input", () => {
      const validator = () => ({ isValid: true, errors: [] });

      const result = AddressValidationUtils.validateArray(
        "not an array" as any,
        validator,
        "TestField",
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("TestField must be an array");
    });
  });

  describe("sanitizeArray", () => {
    it("should remove invalid values and deduplicate", () => {
      const validator = (value: string) =>
        value.startsWith("valid")
          ? { isValid: true, errors: [] }
          : { isValid: false, errors: ["Invalid"] };

      const mixedArray = ["valid1", "invalid", "valid2", "valid1"]; // Contains invalid and duplicate
      const invalidCallback = vi.fn();

      const result = AddressValidationUtils.sanitizeArray(mixedArray, validator, invalidCallback);

      expect(result).toEqual(["valid1", "valid2"]); // Invalid removed, duplicates removed
      expect(invalidCallback).toHaveBeenCalledWith("invalid", ["Invalid"]);
    });

    it("should trim whitespace from values", () => {
      const validator = (value: string) =>
        value === "valid" ? { isValid: true, errors: [] } : { isValid: false, errors: ["Invalid"] };

      const arrayWithWhitespace = ["  valid  ", "valid"];

      const result = AddressValidationUtils.sanitizeArray(arrayWithWhitespace, validator);

      expect(result).toEqual(["valid"]); // Trimmed and deduplicated
    });

    it("should handle empty arrays", () => {
      const validator = () => ({ isValid: true, errors: [] });

      const result = AddressValidationUtils.sanitizeArray([], validator);

      expect(result).toEqual([]);
    });

    it("should work without invalid callback", () => {
      const validator = (value: string) =>
        value === "valid" ? { isValid: true, errors: [] } : { isValid: false, errors: ["Invalid"] };

      const mixedArray = ["valid", "invalid"];

      // Should not throw without callback
      expect(() => {
        const result = AddressValidationUtils.sanitizeArray(mixedArray, validator);
        expect(result).toEqual(["valid"]);
      }).not.toThrow();
    });
  });
});
