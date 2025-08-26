/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates an individual address (device address) format
 * Individual addresses follow the format: x.x.x (area.line.device)
 *
 * @param address - The individual address to validate
 * @returns ValidationResult with validation status and any errors
 */
export function isDeviceAddress(address: string): ValidationResult {
  const errors: string[] = [];

  if (!address || typeof address !== "string") {
    errors.push("Device address must be a non-empty string");
    return { isValid: false, errors };
  }

  // Trim whitespace
  const trimmedAddress = address.trim();
  if (!trimmedAddress) {
    errors.push("Device address cannot be empty or only whitespace");
    return { isValid: false, errors };
  }

  // Check for individual address format (x.x.x)
  const individualAddressPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  if (!individualAddressPattern.test(trimmedAddress)) {
    errors.push(
      `Invalid device address format: "${address}". Expected format: x.x.x (e.g., 1.2.3)`,
    );
    return { isValid: false, errors };
  }

  // Validate ranges for individual address parts
  const parts = trimmedAddress.split(".");
  const [area, line, device] = parts.map((part) => parseInt(part, 10));

  if (area < 0 || area > 15) {
    errors.push(`Device address area must be between 0-15, got: ${area}`);
  }
  if (line < 0 || line > 15) {
    errors.push(`Device address line must be between 0-15, got: ${line}`);
  }
  if (device < 0 || device > 255) {
    errors.push(`Device address device must be between 0-255, got: ${device}`);
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates a group address format
 * Group addresses follow the format: x/x/x (main/middle/sub)
 *
 * @param address - The group address to validate
 * @returns ValidationResult with validation status and any errors
 */
export function isGroupAddress(address: string): ValidationResult {
  const errors: string[] = [];

  if (!address || typeof address !== "string") {
    errors.push("Group address must be a non-empty string");
    return { isValid: false, errors };
  }

  // Trim whitespace
  const trimmedAddress = address.trim();
  if (!trimmedAddress) {
    errors.push("Group address cannot be empty or only whitespace");
    return { isValid: false, errors };
  }

  // Check for group address format (x/x/x)
  const groupAddressPattern = /^\d{1,2}\/\d{1,2}\/\d{1,3}$/;
  if (!groupAddressPattern.test(trimmedAddress)) {
    errors.push(`Invalid group address format: "${address}". Expected format: x/x/x (e.g., 1/2/3)`);
    return { isValid: false, errors };
  }

  // Validate ranges for group address parts
  const parts = trimmedAddress.split("/");
  const [main, middle, sub] = parts.map((part) => parseInt(part, 10));

  if (main < 0 || main > 31) {
    errors.push(`Group address main group must be between 0-31, got: ${main}`);
  }
  if (middle < 0 || middle > 7) {
    errors.push(`Group address middle group must be between 0-7, got: ${middle}`);
  }
  if (sub < 0 || sub > 255) {
    errors.push(`Group address sub group must be between 0-255, got: ${sub}`);
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates a direction value against known valid directions
 *
 * @param direction - The direction to validate
 * @param validDirections - Array of valid direction values
 * @returns ValidationResult with validation status and any errors
 */
export function isValidDirection(
  direction: string,
  validDirections: readonly string[],
): ValidationResult {
  const errors: string[] = [];

  if (!direction || typeof direction !== "string") {
    errors.push("Direction must be a non-empty string");
    return { isValid: false, errors };
  }

  // Trim whitespace
  const trimmedDirection = direction.trim();
  if (!trimmedDirection) {
    errors.push("Direction cannot be empty or only whitespace");
    return { isValid: false, errors };
  }

  if (!validDirections.includes(trimmedDirection)) {
    errors.push(`Invalid direction: "${direction}". Valid values: ${validDirections.join(", ")}`);
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates a telegram type value against known valid telegram types
 *
 * @param telegramType - The telegram type to validate
 * @param validTelegramTypes - Array of valid telegram type values
 * @returns ValidationResult with validation status and any errors
 */
export function isValidTelegramType(
  telegramType: string,
  validTelegramTypes: readonly string[],
): ValidationResult {
  const errors: string[] = [];

  if (!telegramType || typeof telegramType !== "string") {
    errors.push("Telegram type must be a non-empty string");
    return { isValid: false, errors };
  }

  // Trim whitespace
  const trimmedType = telegramType.trim();
  if (!trimmedType) {
    errors.push("Telegram type cannot be empty or only whitespace");
    return { isValid: false, errors };
  }

  if (!validTelegramTypes.includes(trimmedType)) {
    errors.push(
      `Invalid telegram type: "${telegramType}". Valid values: ${validTelegramTypes.join(", ")}`,
    );
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates an array of values using a provided validation function
 *
 * @param values - Array of values to validate
 * @param validator - Function to validate individual values
 * @param fieldName - Name of the field for error messages
 * @returns ValidationResult with validation status and any errors
 */
export function validateArray<T>(
  values: T[],
  validator: (value: T) => ValidationResult,
  fieldName: string,
): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(values)) {
    errors.push(`${fieldName} must be an array`);
    return { isValid: false, errors };
  }

  if (values.length === 0) {
    return { isValid: true, errors: [] };
  }

  for (const [index, value] of values.entries()) {
    const result = validator(value);
    if (!result.isValid) {
      errors.push(`${fieldName}[${index}]: ${result.errors.join(", ")}`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Sanitizes an array of values, removing invalid ones and logging warnings
 *
 * @param values - Array of values to sanitize
 * @param validator - Function to validate individual values
 * @param onInvalid - Callback function called for each invalid value
 * @returns Array of valid values, trimmed and deduplicated
 */
export function sanitizeArray<T extends string>(
  values: T[],
  validator: (value: T) => ValidationResult,
  onInvalid?: (value: T, errors: string[]) => void,
): T[] {
  const validValues = values
    .map((value) => value.trim() as T) // Trim whitespace
    .filter((value) => {
      const result = validator(value);
      if (!result.isValid) {
        onInvalid?.(value, result.errors);
        return false;
      }
      return true;
    });

  // Remove duplicates while preserving order
  return Array.from(new Set(validValues));
}
