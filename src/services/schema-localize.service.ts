import type { HomeAssistant } from "@ha/types";
import { KNXLogger } from "../tools/knx-logger";
import schema_en from "../localize/languages/schema_en.json";

const logger = new KNXLogger("schema-localize");
const DEFAULT_LANGUAGE = "en";
const languages = {
  en: schema_en,
};

// Stores additional languages that might be loaded dynamically
const _schemaLocalizationCache: Record<string, any> = {};

/**
 * Synchronous version of the schema translator.
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
  const langData = languages[lang] || _schemaLocalizationCache[lang];

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
  const value = getValueByPath(langData || languages[DEFAULT_LANGUAGE], path);
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
 * Load schema translations for a given language.
 * This now primarily uses imported files but maintains compatibility
 * with any additional languages that might be loaded dynamically.
 * 
 * @param hass Home Assistant instance to get the language from
 * @param path The dot-notation path to the translation value (e.g. "config_panel.config.sensor.config.label")
 * @returns The translated string or undefined if no translation was found
 */
export async function getSchemaTranslation(
  hass: HomeAssistant, 
  path: string
): Promise<string | undefined> {
  // Get the language using the same logic as in localize.ts
  let lang = (hass.language || localStorage.getItem("selectedLanguage") || DEFAULT_LANGUAGE)
    .replace(/['"]+/g, "")
    .replace("-", "_");

  // If language is available directly in the imported languages, use it
  if (languages[lang]) {
    const value = getValueByPath(languages[lang], path);
    if (value !== undefined) {
      return value;
    }
  } 
  // If language is cached but not part of the imports, use it from cache
  else if (_schemaLocalizationCache[lang]) {
    const value = getValueByPath(_schemaLocalizationCache[lang], path);
    if (value !== undefined) {
      return value;
    }
  }
  
  // Try fallback to default language
  if (lang !== DEFAULT_LANGUAGE) {
    return getValueByPath(languages[DEFAULT_LANGUAGE], path);
  }
  
  // If nothing found, return undefined
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

/**
 * Preload schema translations for given language to make them available for synchronous use.
 * This function is kept for compatibility but does very little now that translations
 * are imported directly.
 * 
 * @param hass Home Assistant instance to get the language from
 * @returns A promise that resolves when loading is complete
 */
export async function preloadSchemaTranslations(hass: HomeAssistant): Promise<void> {
  // Most languages are now loaded directly via import, so this function
  // doesn't need to do anything for those languages.
  // We keep it for potential future compatibility with dynamically added languages.
  
  // Nothing to preload for already imported languages
  const lang = (hass.language || localStorage.getItem("selectedLanguage") || DEFAULT_LANGUAGE)
    .replace(/['"]+/g, "")
    .replace("-", "_");
    
  // Only languages that are not part of the direct imports might need loading
  if (!languages[lang] && !_schemaLocalizationCache[lang]) {
    logger.info(`Language ${lang} is not available as direct import for schema translations`);
  }
}