import type { Route } from "@ha/types";
import { navigate } from "@ha/common/navigate";
import { mainWindow } from "@ha/common/dom/get_main_window";

import { KNXLogger } from "../../../tools/knx-logger";

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
   * Gets filters from URL query parameters
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

    return {
      source: source ? source.split(",") : [],
      destination: destination ? destination.split(",") : [],
      direction: direction ? direction.split(",") : [],
      telegramtype: telegramtype ? telegramtype.split(",") : [],
    };
  }
}
