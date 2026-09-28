import type { TelegramDict } from "../../../src/types/websocket";

export function createTelegrams(): TelegramDict[] {
  return [
    {
      data_secure: false,
      destination: "1/0/1",
      destination_name: "Living room light",
      direction: "Incoming",
      dpt_main: 1,
      dpt_sub: 1,
      dpt_name: "Switch",
      source: "1.1.1",
      source_name: "Living room actuator",
      payload: 1,
      telegramtype: "GroupValueWrite",
      timestamp: "2026-01-01T12:00:00+00:00",
      unit: null,
      value: true,
    },
  ];
}

/** A fixed pair for Previous/Next in the telegram information dialog. */
export function createDialogTelegrams(): TelegramDict[] {
  const telegram = createTelegrams()[0];
  return [
    telegram,
    { ...telegram, timestamp: "2026-01-01T12:00:01+00:00", payload: 0, value: false },
  ];
}
