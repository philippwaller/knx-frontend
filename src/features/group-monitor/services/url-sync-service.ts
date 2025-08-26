import type { Route } from "@ha/types";
import { navigate } from "@ha/common/navigate";
import { mainWindow } from "@ha/common/dom/get_main_window";

import { KNXLogger } from "../../../tools/knx-logger";
import { sanitizeFilters } from "../controller/filter-validation";

const logger = new KNXLogger("url_sync_service");

/**
 * Service responsible for URL synchronization with filter state
 */
export class UrlSyncService {
  /**
   * Updates the URL with current filter state
   */
  public updateUrlFromFilters(filters: Record<string, string[]>, route?: Route): void {
    if (!route) {
      logger.warn("Route not available, cannot update URL");
      return;
    }

    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        params.set(key, values.join(","));
      }
    });

    const newPath = params.toString()
      ? `${route.prefix}${route.path}?${params.toString()}`
      : `${route.prefix}${route.path}`;

    navigate(decodeURIComponent(newPath), { replace: true });
  }

  /**
   * Gets filters from URL query parameters with validation
   */
  public getFiltersFromUrl(): Record<string, string[]> {
    const searchParams = new URLSearchParams(mainWindow.location.search);
    const source = searchParams.get("source");
    const destination = searchParams.get("destination");
    const direction = searchParams.get("direction");
    const telegramtype = searchParams.get("telegramtype");

    if (!source && !destination && !direction && !telegramtype) {
      return {};
    }

    // Parse parameters into arrays and create filter object
    const rawFilters: Record<string, string[]> = {
      source: source ? source.split(",").sort() : [],
      destination: destination ? destination.split(",").sort() : [],
      direction: direction ? direction.split(",").sort() : [],
      telegramtype: telegramtype ? telegramtype.split(",").sort() : [],
    };

    // Always sanitize filters to remove invalid values, trim whitespace, and remove duplicates
    const sanitizedFilters = sanitizeFilters(rawFilters);

    // Log warning if any values were invalid and removed
    const originalCount = Object.values(rawFilters)
      .flat()
      .filter((v) => v.length > 0).length;
    const sanitizedCount = Object.values(sanitizedFilters).flat().length;

    if (originalCount > sanitizedCount) {
      logger.warn(`Removed ${originalCount - sanitizedCount} invalid filter parameter(s) from URL`);
    }

    // Remove empty arrays from sanitized filters
    const cleanedFilters: Record<string, string[]> = {};
    Object.entries(sanitizedFilters).forEach(([key, values]) => {
      if (values.length > 0) {
        cleanedFilters[key] = values;
      }
    });

    return cleanedFilters;
  }
}
