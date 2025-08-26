import { KNXLogger } from "../../../tools/knx-logger";
import {
  validateArray,
  sanitizeArray,
  isDeviceAddress,
  isGroupAddress,
  isValidDirection,
  isValidTelegramType,
  type ValidationResult,
} from "../../../utils/address-validation";

const logger = new KNXLogger("group_monitor_filter_validation");

/**
 * Supported filter field types for the group monitor
 */
export type FilterFieldType = "source" | "destination" | "direction" | "telegramtype";

/**
 * Known valid directions for KNX telegrams
 */
const VALID_DIRECTIONS = ["Incoming", "Outgoing"] as const;

/**
 * Known valid telegram types for KNX communication
 */
const VALID_TELEGRAM_TYPES = ["GroupValueRead", "GroupValueWrite", "GroupValueResponse"] as const;

/**
 * Validates filter parameters from URL query parameters
 */
export function validateFilters(filters: Record<string, string[]>): ValidationResult {
  const errors: string[] = [];
  const supportedFields = ["source", "destination", "direction", "telegramtype"];

  // Check for unsupported filter fields
  for (const fieldName of Object.keys(filters)) {
    if (!supportedFields.includes(fieldName)) {
      errors.push(
        `Unsupported filter field: "${fieldName}". Supported fields: ${supportedFields.join(", ")}`,
      );
    }
  }

  // Validate each filter field
  if (filters.source) {
    const result = validateArray(filters.source, isDeviceAddress, "Sources");
    if (!result.isValid) {
      errors.push(...result.errors);
    }
  }

  if (filters.destination) {
    const result = validateArray(filters.destination, isGroupAddress, "Destinations");
    if (!result.isValid) {
      errors.push(...result.errors);
    }
  }

  if (filters.direction) {
    const result = validateArray(
      filters.direction,
      (value: string) => isValidDirection(value, VALID_DIRECTIONS),
      "Directions",
    );
    if (!result.isValid) {
      errors.push(...result.errors);
    }
  }

  if (filters.telegramtype) {
    const result = validateArray(
      filters.telegramtype,
      (value: string) => isValidTelegramType(value, VALID_TELEGRAM_TYPES),
      "TelegramTypes",
    );
    if (!result.isValid) {
      errors.push(...result.errors);
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Sanitizes and validates filters, removing invalid values and logging warnings
 */
export function sanitizeFilters(filters: Record<string, string[]>): Record<string, string[]> {
  const sanitized: Record<string, string[]> = {};

  if (filters.source) {
    const validSources = sanitizeArray(filters.source, isDeviceAddress, (value, errors) =>
      logger.warn(`Removing invalid source address: ${value}`, errors),
    );
    if (validSources.length > 0) {
      sanitized.source = validSources;
    }
  }

  if (filters.destination) {
    const validDestinations = sanitizeArray(filters.destination, isGroupAddress, (value, errors) =>
      logger.warn(`Removing invalid destination address: ${value}`, errors),
    );
    if (validDestinations.length > 0) {
      sanitized.destination = validDestinations;
    }
  }

  if (filters.direction) {
    const validDirections = sanitizeArray(
      filters.direction,
      (value: string) => isValidDirection(value, VALID_DIRECTIONS),
      (value, errors) => logger.warn(`Removing invalid direction: ${value}`, errors),
    );
    if (validDirections.length > 0) {
      sanitized.direction = validDirections;
    }
  }

  if (filters.telegramtype) {
    const validTelegramTypes = sanitizeArray(
      filters.telegramtype,
      (value: string) => isValidTelegramType(value, VALID_TELEGRAM_TYPES),
      (value, errors) => logger.warn(`Removing invalid telegram type: ${value}`, errors),
    );
    if (validTelegramTypes.length > 0) {
      sanitized.telegramtype = validTelegramTypes;
    }
  }

  return sanitized;
}

/**
 * Gets all valid direction values
 */
export function getValidDirections(): readonly string[] {
  return VALID_DIRECTIONS;
}

/**
 * Gets all valid telegram type values
 */
export function getValidTelegramTypes(): readonly string[] {
  return VALID_TELEGRAM_TYPES;
}
