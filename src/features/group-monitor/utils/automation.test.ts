import { describe, it, expect, vi } from "vitest";
import { formatDateTime } from "../../../utils/format";
import { TelegramRow } from "../types/telegram-row";
import { buildAutomationFromTelegram, openAutomationEditor } from "./automation";

describe("automation utilities", () => {
  const createTestTelegram = (overrides = {}) =>
    new TelegramRow({
      timestamp: "2026-09-05T12:00:00.000000Z",
      source: "1.1.1",
      source_name: "Living Room Switch",
      destination: "1/2/3",
      destination_name: "Ceiling Light",
      telegramtype: "GroupValueWrite",
      direction: "Incoming",
      payload: [1],
      dpt_main: 1,
      dpt_sub: 1,
      dpt_name: "switch",
      value: "On",
      unit: null,
      ...overrides,
    });

  describe("buildAutomationFromTelegram", () => {
    it("builds a single mode automation with a knx.telegram trigger for GroupValueWrite Incoming", () => {
      const telegram = createTestTelegram();
      const config = buildAutomationFromTelegram(telegram);
      const expectedDateTime = formatDateTime(telegram.timestamp);

      expect(config.mode).toBe("single");
      expect(config.alias).toBe("KNX: 1/2/3 Ceiling Light");
      expect(config.description).toBe("");
      expect(config.conditions).toEqual([]);
      expect(config.actions).toEqual([]);

      expect(config.triggers).toHaveLength(1);
      const trigger = (config.triggers as any[])[0];
      expect(trigger.trigger).toBe("knx.telegram");
      expect(trigger.destination).toBe("1/2/3");
      expect(trigger.alias).toBe(
        "a KNX telegram (GroupValueWrite) is received for 1/2/3 (Ceiling Light)",
      );
      expect(trigger.note).toBe(
        `Created from KNX telegram (${expectedDateTime})\nSource: 1.1.1 (Living Room Switch)\nDestination: 1/2/3 (Ceiling Light)\nType: GroupValueWrite (Incoming)\nValue: On (DPT 1.001 switch)`,
      );
      expect(trigger.group_value_read).toBe(false);
      expect(trigger.group_value_response).toBe(false);
      expect(trigger.outgoing).toBe(false);
      expect(trigger.group_value_write).toBeUndefined();
      expect(trigger.incoming).toBeUndefined();
    });

    it("handles GroupValueRead Outgoing correctly when DPT is unknown and addresses have no names", () => {
      const telegram = createTestTelegram({
        telegramtype: "GroupValueRead",
        direction: "Outgoing",
        source_name: null,
        destination_name: null,
        dpt_main: null,
        dpt_sub: null,
        dpt_name: null,
        payload: null,
        value: null,
      });

      const config = buildAutomationFromTelegram(telegram);
      const trigger = (config.triggers as any[])[0];
      const expectedDateTime = formatDateTime(telegram.timestamp);

      expect(config.alias).toBe("KNX: 1/2/3 (GroupValueRead) (Outgoing)");
      expect(trigger.alias).toBe("a KNX telegram (GroupValueRead) is sent for 1/2/3");
      expect(trigger.note).toBe(
        `Created from KNX telegram (${expectedDateTime})\nSource: 1.1.1\nDestination: 1/2/3\nType: GroupValueRead (Outgoing)`,
      );
      expect(trigger.trigger).toBe("knx.telegram");
      expect(trigger.group_value_write).toBe(false);
      expect(trigger.group_value_response).toBe(false);
      expect(trigger.incoming).toBe(false);
      expect(trigger.group_value_read).toBeUndefined();
      expect(trigger.type).toBeUndefined();
      expect(config.description).toBe("");
    });

    it("passes dptId to trigger type and formats DPT in note", () => {
      const telegram = createTestTelegram({
        dpt_main: 1,
        dpt_sub: 1,
        payload: null,
        value: null,
      });

      const config = buildAutomationFromTelegram(telegram);
      const trigger = (config.triggers as any[])[0];

      expect(trigger.type).toBe("1.001");
      expect(trigger.note).toContain(`DPT: DPT 1.001`);
      expect(config.description).toBe("");
    });

    it("formats note with value but without DPT when DPT is unknown", () => {
      const telegram = createTestTelegram({
        dpt_main: null,
        dpt_sub: null,
        dpt_name: null,
        value: "0x01",
      });

      const config = buildAutomationFromTelegram(telegram);
      const trigger = (config.triggers as any[])[0];

      expect(trigger.note).toContain("\nValue: 0x01");
      expect(trigger.note).not.toContain("\nValue: 0x01 (");
      expect(config.description).toBe("");
    });

    it("handles GroupValueResponse correctly", () => {
      const telegram = createTestTelegram({
        telegramtype: "GroupValueResponse",
      });

      const config = buildAutomationFromTelegram(telegram);
      const trigger = (config.triggers as any[])[0];

      expect(config.alias).toBe("KNX: 1/2/3 Ceiling Light (GroupValueResponse)");
      expect(trigger.group_value_write).toBe(false);
      expect(trigger.group_value_read).toBe(false);
      expect(trigger.group_value_response).toBeUndefined();
    });

    it("uses custom localize function if provided", () => {
      const telegram = createTestTelegram();
      const mockTranslations: Record<string, string> = {
        group_monitor_automation_description_type: "Typ",
        group_monitor_automation_description_direction: "Richtung",
        group_monitor_automation_description_source: "Quelle",
        group_monitor_automation_description_destination: "Ziel",
        group_monitor_automation_description_dpt: "DPT",
        group_monitor_automation_trigger_alias_incoming:
          "ein KNX-Telegramm ({type}) an {destination} empfangen wird",
        group_monitor_automation_trigger_alias_outgoing:
          "ein KNX-Telegramm ({type}) an {destination} gesendet wird",
        group_monitor_automation_note_created_from: "Erstellt aus KNX-Telegramm ({time})",
        group_monitor_automation_note_value: "Wert",
        Incoming: "Eingehend",
        Outgoing: "Ausgehend",
      };
      const localize = vi.fn((key: string, values?: Record<string, any>) => {
        let text = mockTranslations[key] || key;
        if (values) {
          for (const [k, v] of Object.entries(values)) {
            text = text.replace(`{${k}}`, String(v));
          }
        }
        return text;
      });
      const config = buildAutomationFromTelegram(telegram, localize);
      const trigger = (config.triggers as any[])[0];
      const expectedDateTime = formatDateTime(telegram.timestamp);

      expect(config.alias).toBe("KNX: 1/2/3 Ceiling Light");
      expect(config.description).toBe("");
      expect(trigger.alias).toBe(
        "ein KNX-Telegramm (GroupValueWrite) an 1/2/3 (Ceiling Light) empfangen wird",
      );
      expect(trigger.note).toBe(
        `Erstellt aus KNX-Telegramm (${expectedDateTime})\nQuelle: 1.1.1 (Living Room Switch)\nZiel: 1/2/3 (Ceiling Light)\nTyp: GroupValueWrite (Eingehend)\nWert: On (DPT 1.001 switch)`,
      );

      // Localized read outgoing
      const readTelegram = createTestTelegram({
        telegramtype: "GroupValueRead",
        direction: "Outgoing",
      });
      const readConfig = buildAutomationFromTelegram(readTelegram, localize);
      expect(readConfig.alias).toBe("KNX: 1/2/3 Ceiling Light (GroupValueRead) (Ausgehend)");
    });
  });

  describe("openAutomationEditor", () => {
    it("dispatches hass-automation-editor event on parent customPanel if present", () => {
      const fakePanel = document.createElement("div");
      const dispatchSpy = vi.spyOn(fakePanel, "dispatchEvent");
      (window.parent as any).customPanel = fakePanel;

      const dummyConfig = { alias: "Test" };
      const result = openAutomationEditor(dummyConfig, true);

      expect(result).toBe(true);
      expect(dispatchSpy).toHaveBeenCalled();
      const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(event.type).toBe("hass-automation-editor");
      expect(event.detail).toEqual({
        data: dummyConfig,
        expanded: true,
      });

      delete (window.parent as any).customPanel;
    });
  });
});
