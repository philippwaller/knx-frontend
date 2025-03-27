import type { HomeAssistant } from "@ha/types";
import { KNXLogger } from "../tools/knx-logger";
import schema_en from "../localize/languages/schema_en.json";

const logger = new KNXLogger("schema-localize");
const DEFAULT_LANGUAGE = "en";
const languages = {
  en: schema_en,
};

/**
 * Synchronous schema translator that returns localized strings based on path.
 * 
 * @param hass Home Assistant instance to get the language from
 * @param path The dot-notation path to the translation value (e.g. "config_panel.config.sensor.config.label")
 * @returns The translated string or undefined if no translation was found
 */
export function localizeSchema(hass: HomeAssistant, path: string): string | undefined {
  // Get the language using the same logic as in localize.ts
  let lang = (hass.language || localStorage.getItem("selectedLanguage") || DEFAULT_LANGUAGE)
    .replace(/['"]+/g, "")
    .replace("-", "_");

  // Check if we have the language available
  const langData = languages[lang];

  // If the language is not available, fallback to default
  if (!langData) {
    // If requested language is already the default, log warning
    if (lang === DEFAULT_LANGUAGE) {
      logger.warn(`No schema translation loaded for ${DEFAULT_LANGUAGE}, path not found: ${path}`);
      return undefined;
    }
    
    // Use default language
    lang = DEFAULT_LANGUAGE;
  }

  // Get the value from the current language
  const value = getValueByPath(languages[lang] || languages[DEFAULT_LANGUAGE], path);
  if (value !== undefined) {
    return value;
  }
  
  // Try fallback to default language if the current language is not default
  if (lang !== DEFAULT_LANGUAGE) {
    return getValueByPath(languages[DEFAULT_LANGUAGE], path);
  }
  
  // If nothing is found, return undefined
  return undefined;
}

/**
 * Navigate through an object using a dot-notation path
 * 
 * @param obj The object to navigate
 * @param path The dot-notation path (e.g. "config.sensor.config.label")
 * @returns The value at the specified path or undefined if not found
 */
function getValueByPath(obj: any, path: string): string | undefined {
  const pathParts = path.split('.');
  let current = obj;

  for (const part of pathParts) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[part];
  }

  return typeof current === 'string' ? current : undefined;
}
