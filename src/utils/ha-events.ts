import type { AutomationConfig } from "@ha/data/automation";

import { KNXLogger } from "../tools/knx-logger";

const logger = new KNXLogger("ha_events");

/**
 * Interface for notification message parameters
 */
export interface NotificationMessage {
  message: string;
  duration?: number;
  action?: {
    text: string;
    action: () => void;
  };
}

/**
 * Interface for automation editor parameters
 */
export interface AutomationEditorParams {
  data: Partial<AutomationConfig>;
  expanded?: boolean;
}

/**
 * Interface for navigation parameters
 */
export interface NavigationParams {
  path: string;
  replace?: boolean;
}

/**
 * Generic function to fire events on the parent Home Assistant custom panel
 */
function fireParentEvent(eventType: string, eventData?: any): boolean {
  const parentCustomPanel = (window.parent as any)?.customPanel as HTMLElement | undefined;

  if (!parentCustomPanel) {
    logger.error(`Failed to find parent custom panel for event: ${eventType}`);
    return false;
  }

  try {
    // Use dispatchEvent for custom events to bypass TypeScript restrictions
    const customEvent = new CustomEvent(eventType, {
      detail: eventData,
      bubbles: true,
      composed: true,
    });
    parentCustomPanel.dispatchEvent(customEvent);
    logger.debug(`Successfully fired event: ${eventType}`, eventData);
    return true;
  } catch (error) {
    logger.error(`Failed to fire event: ${eventType}`, error);
    return false;
  }
}

/**
 * Shows a notification message in the main Home Assistant interface
 */
export function showNotification(message: string, duration?: number): boolean {
  return fireParentEvent("hass-notification", {
    message,
    duration: duration || 5000,
  });
}

/**
 * Shows a notification message with an action button
 */
export function showNotificationWithAction(params: NotificationMessage): boolean {
  return fireParentEvent("hass-notification", {
    message: params.message,
    duration: params.duration || 5000,
    action: params.action,
  });
}

/**
 * Opens the automation editor with pre-filled data
 */
export function openAutomationEditor(params: AutomationEditorParams): boolean {
  return fireParentEvent("hass-automation-editor", {
    data: params.data,
    expanded: params.expanded !== false, // Default to true
  });
}

/**
 * Navigates to a specific path in Home Assistant
 */
export function navigate(path: string, replace?: boolean): boolean {
  return fireParentEvent("hass-location-changed", {
    path,
    replace: replace || false,
  });
}

/**
 * Opens the more info dialog for an entity
 */
export function showMoreInfo(entityId: string): boolean {
  return fireParentEvent("hass-more-info", {
    entityId,
  });
}

/**
 * Shows an error message to the user
 */
export function showError(message: string): boolean {
  return fireParentEvent("hass-notification", {
    message,
    type: "error",
    duration: 8000,
  });
}

/**
 * Shows a success message to the user
 */
export function showSuccess(message: string): boolean {
  return fireParentEvent("hass-notification", {
    message,
    type: "success",
    duration: 4000,
  });
}

/**
 * Shows a warning message to the user
 */
export function showWarning(message: string): boolean {
  return fireParentEvent("hass-notification", {
    message,
    type: "warning",
    duration: 6000,
  });
}

/**
 * Opens the KNX integration config flow
 */
export function openKNXConfig(): boolean {
  return fireParentEvent("hass-location-changed", {
    path: "/config/integrations/integration/knx",
  });
}

/**
 * Reloads the KNX integration
 */
export function reloadKNXIntegration(): boolean {
  return fireParentEvent("hass-service-call", {
    domain: "homeassistant",
    service: "reload_config_entry",
    service_data: {
      entry_id: "knx", // This would need to be the actual config entry ID
    },
  });
}

/**
 * Shows a generic dialog
 */
export function showDialog(dialogTag: string, dialogParams?: any): boolean {
  return fireParentEvent("show-dialog", {
    dialogTag,
    dialogParams,
  });
}

/**
 * Generic method to fire any custom event
 */
export function fireCustomEvent(eventType: string, eventData?: any): boolean {
  return fireParentEvent(eventType, eventData);
}
