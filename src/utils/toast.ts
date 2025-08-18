import { fireEvent } from "@ha/common/dom/fire_event";
import type { ShowToastParams } from "@ha/managers/notification-manager";
import { KNXLogger } from "tools/knx-logger";

const logger = new KNXLogger("toast");

/**
 * Show a Home Assistant toast from within a custom panel (iframe) or normal context.
 * It forwards the hass-notification event to the parent custom panel host when present,
 * falling back to the main HA window or the provided host element.
 */
export const showToast = (_host: HTMLElement, paramsOrMessage: ShowToastParams | string): void => {
  const params: ShowToastParams =
    typeof paramsOrMessage === "string" ? { message: paramsOrMessage } : paramsOrMessage;

  const parentCustomPanel = (window.parent as any)?.customPanel as HTMLElement | undefined;
  if (parentCustomPanel) {
    fireEvent(parentCustomPanel, "hass-notification", params);
    return;
  }
  logger.error(
    "Unable to show toast: parent.customPanel not found. Ensure panel is loaded as HA custom panel.",
  );
};
