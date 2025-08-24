import { describe, it, expect, beforeEach, vi } from "vitest";
import { HAEvents } from "./ha-events";

// Mock the KNXLogger
vi.mock("../tools/knx-logger", () => ({
  KNXLogger: vi.fn().mockImplementation(() => ({
    debug: vi.fn(),
    error: vi.fn(),
  })),
}));

describe("HAEvents", () => {
  let mockCustomPanel: HTMLElement;
  let mockDispatchEvent: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockDispatchEvent = vi.fn();
    mockCustomPanel = {
      dispatchEvent: mockDispatchEvent,
    } as any;

    // Mock window.parent.customPanel
    Object.defineProperty(window, "parent", {
      value: {
        customPanel: mockCustomPanel,
      },
      writable: true,
    });

    vi.clearAllMocks();
  });

  describe("showNotification", () => {
    it("should fire hass-notification event with correct parameters", () => {
      const result = HAEvents.showNotification("Test message", 3000);

      expect(result).toBe(true);
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "hass-notification",
          detail: {
            message: "Test message",
            duration: 3000,
          },
        })
      );
    });

    it("should use default duration when not provided", () => {
      HAEvents.showNotification("Test message");

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            duration: 5000,
          }),
        })
      );
    });
  });

  describe("openAutomationEditor", () => {
    it("should fire hass-automation-editor event with automation data", () => {
      const automation = {
        alias: "Test Automation",
        triggers: [],
        conditions: [],
        actions: [],
      };

      const result = HAEvents.openAutomationEditor({
        data: automation,
        expanded: true,
      });

      expect(result).toBe(true);
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "hass-automation-editor",
          detail: {
            data: automation,
            expanded: true,
          },
        })
      );
    });

    it("should default expanded to true when not provided", () => {
      const automation = { alias: "Test" };

      HAEvents.openAutomationEditor({ data: automation });

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            expanded: true,
          }),
        })
      );
    });
  });

  describe("navigate", () => {
    it("should fire hass-location-changed event with path", () => {
      const result = HAEvents.navigate("/config/integrations");

      expect(result).toBe(true);
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "hass-location-changed",
          detail: {
            path: "/config/integrations",
            replace: false,
          },
        })
      );
    });
  });

  describe("showMoreInfo", () => {
    it("should fire hass-more-info event with entity ID", () => {
      const result = HAEvents.showMoreInfo("sensor.temperature");

      expect(result).toBe(true);
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "hass-more-info",
          detail: {
            entityId: "sensor.temperature",
          },
        })
      );
    });
  });

  describe("error handling", () => {
    it("should return false when custom panel is not available", () => {
      // Mock missing custom panel
      Object.defineProperty(window, "parent", {
        value: {},
        writable: true,
      });

      const result = HAEvents.showNotification("Test message");

      expect(result).toBe(false);
      expect(mockDispatchEvent).not.toHaveBeenCalled();
    });

    it("should return false when dispatchEvent throws an error", () => {
      mockDispatchEvent.mockImplementation(() => {
        throw new Error("Dispatch failed");
      });

      const result = HAEvents.showNotification("Test message");

      expect(result).toBe(false);
    });
  });

  describe("notification types", () => {
    it("should show error notification with correct type", () => {
      HAEvents.showError("Error message");

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            type: "error",
            duration: 8000,
          }),
        })
      );
    });

    it("should show success notification with correct type", () => {
      HAEvents.showSuccess("Success message");

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            type: "success",
            duration: 4000,
          }),
        })
      );
    });

    it("should show warning notification with correct type", () => {
      HAEvents.showWarning("Warning message");

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            type: "warning",
            duration: 6000,
          }),
        })
      );
    });
  });

  describe("fireCustomEvent", () => {
    it("should fire custom event with provided type and data", () => {
      const customData = { test: "data" };
      const result = HAEvents.fireCustomEvent("custom-event", customData);

      expect(result).toBe(true);
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "custom-event",
          detail: customData,
        })
      );
    });
  });
});
