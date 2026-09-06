import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "lit";
import { KNXGroupMonitor, migrateStoredColumns } from "./group-monitor-view";

vi.mock("@lit-labs/virtualizer", () => ({}));

describe("KNXGroupMonitor", () => {
  let element: KNXGroupMonitor;

  beforeEach(() => {
    vi.clearAllMocks();
    element = new KNXGroupMonitor();
    element.knx = {
      localize: vi.fn((key) => key),
      connectionInfo: { telegram_retention: 10 },
      projectInfo: null,
    } as any;
    element.hass = {
      callWS: vi.fn(),
      connected: true,
      localize: vi.fn((key) => key),
    } as any;
  });

  it("opens the ETS project upload dialog from the missing-project alert", () => {
    let dialogEvent: CustomEvent | undefined;
    element.addEventListener("show-dialog", (event) => {
      dialogEvent = event as CustomEvent;
    });
    const container = document.createElement("div");
    render((element as any).render(), container, { host: element });

    const uploadButton = container.querySelector("ha-alert ha-button") as HTMLElement | null;
    expect(uploadButton).not.toBeNull();
    uploadButton!.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));

    expect(dialogEvent?.detail).toMatchObject({
      dialogTag: "knx-project-upload-dialog",
      dialogParams: { hass: element.hass },
    });
  });

  it("dismisses the missing-project alert", () => {
    const container = document.createElement("div");
    render((element as any).render(), container, { host: element });

    const dismissButton = container.querySelector("ha-alert ha-icon-button") as HTMLElement | null;
    expect(dismissButton).not.toBeNull();
    dismissButton!.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
    render((element as any).render(), container, { host: element });

    expect(container.querySelector("ha-alert")).toBeNull();
  });

  it("applies a selected time range with the configured retention", () => {
    const mockController = { applyTimeRangeFilter: vi.fn() };
    (element as any).controller = mockController;

    (element as any)._handleTimeRangeChanged({ detail: { startMs: 1000, endMs: 2000 } });

    expect(mockController.applyTimeRangeFilter).toHaveBeenCalledWith(element.hass, 1000, 2000, 10);
  });

  it("releases the time-range filter when cleared", () => {
    const mockController = { clearTimeRangeFilter: vi.fn() };
    (element as any).controller = mockController;

    (element as any)._handleTimeRangeCleared();

    expect(mockController.clearTimeRangeFilter).toHaveBeenCalled();
  });

  it("pause button clears the absolute time range instead of toggling pause", async () => {
    const mockController = {
      hasAbsoluteTimeRange: true,
      clearTimeRangeFilter: vi.fn(),
      togglePause: vi.fn(),
    };
    (element as any).controller = mockController;

    await (element as any)._handlePauseToggle();

    expect(mockController.clearTimeRangeFilter).toHaveBeenCalled();
    expect(mockController.togglePause).not.toHaveBeenCalled();
  });

  it("pause button toggles pause normally without an absolute range", async () => {
    const mockController = {
      hasAbsoluteTimeRange: false,
      clearTimeRangeFilter: vi.fn(),
      togglePause: vi.fn(),
    };
    (element as any).controller = mockController;

    await (element as any)._handlePauseToggle();

    expect(mockController.togglePause).toHaveBeenCalled();
    expect(mockController.clearTimeRangeFilter).not.toHaveBeenCalled();
  });

  it("maps history warning codes to localized text", () => {
    expect((element as any)._historyWarningText("retention_clamped")).toBe(
      "group_monitor_time_range_retention_clamped",
    );
    expect((element as any)._historyWarningText("partial_load")).toBe(
      "group_monitor_time_range_partial",
    );
    expect((element as any)._historyWarningText(null)).toBeUndefined();
  });

  it("should clear telegrams when _handleClearRows is called", () => {
    const mockController = {
      clearTelegrams: vi.fn(),
    };
    (element as any).controller = mockController;

    (element as any)._handleClearRows();

    expect(mockController.clearTelegrams).toHaveBeenCalled();
  });

  describe("migrateStoredColumns", () => {
    it("inserts the offset column right after timestampIso for both layouts", () => {
      const migrated = migrateStoredColumns({
        wide: { columnOrder: ["timestampIso", "sourceAddress", "value"] },
        narrow: { columnOrder: ["sourceAddress", "timestampIso", "type"] },
      });

      expect(migrated?.wide?.columnOrder).toEqual([
        "timestampIso",
        "offset",
        "sourceAddress",
        "value",
      ]);
      expect(migrated?.narrow?.columnOrder).toEqual([
        "sourceAddress",
        "timestampIso",
        "offset",
        "type",
      ]);
    });

    it("preserves hiddenColumns while migrating the order", () => {
      const migrated = migrateStoredColumns({
        wide: { columnOrder: ["timestampIso", "value"], hiddenColumns: ["payload"] },
      });

      expect(migrated?.wide?.hiddenColumns).toEqual(["payload"]);
    });

    it("does not add offset again if it is already present", () => {
      const stored = { wide: { columnOrder: ["timestampIso", "offset", "sourceAddress"] } };

      const migrated = migrateStoredColumns(stored);

      // Unchanged input is returned by reference (no rewrite to storage).
      expect(migrated).toBe(stored);
    });

    it("leaves a column order without timestampIso untouched", () => {
      const stored = { wide: { columnOrder: ["sourceAddress", "value"] } };

      const migrated = migrateStoredColumns(stored);

      expect(migrated).toBe(stored);
    });

    it("is a no-op when nothing is stored", () => {
      expect(migrateStoredColumns(undefined)).toBeUndefined();
    });
  });

  describe("actions column", () => {
    it("includes an actions column with type overflow-menu", () => {
      const columns = (element as any)._columns(false, true, "en");
      expect(columns.actions).toBeDefined();
      expect(columns.actions.type).toBe("overflow-menu");
    });
  });
});
