import type { GroupMonitorInfoData, TelegramDict } from "../../../../../src/types/websocket";

export const telegrams: TelegramDict[] = [
  {
    destination: "1/0/1",
    destination_name: "Living room light switch",
    direction: "Outgoing",
    dpt_main: 1,
    dpt_sub: 1,
    dpt_name: "switch",
    source: "1.1.250",
    source_name: "",
    payload: 1,
    telegramtype: "GroupValueWrite",
    timestamp: "2026-09-28T10:00:00.000000+00:00",
    unit: null,
    value: true,
  },
  {
    destination: "1/0/2",
    destination_name: "Living room light state",
    direction: "Incoming",
    dpt_main: 1,
    dpt_sub: 1,
    dpt_name: "switch",
    source: "1.1.1",
    source_name: "Switch actuator 4-fold",
    payload: 1,
    telegramtype: "GroupValueResponse",
    timestamp: "2026-09-28T10:00:00.120000+00:00",
    unit: null,
    value: true,
  },
  {
    destination: "2/0/1",
    destination_name: "Living room temperature",
    direction: "Incoming",
    dpt_main: 9,
    dpt_sub: 1,
    dpt_name: "temperature",
    source: "1.1.2",
    source_name: "Room temperature sensor",
    // DPT 9.001 encoding of 21.5 °C.
    payload: [12, 51],
    telegramtype: "GroupValueWrite",
    timestamp: "2026-09-28T10:01:00.000000+00:00",
    unit: "°C",
    value: 21.5,
  },
];

export const groupMonitorInfo: GroupMonitorInfoData = {
  project_loaded: true,
  recent_telegrams: telegrams,
};

/** Latest telegram per destination, as `knx/group_telegrams` returns it. */
export const groupTelegrams: Record<string, TelegramDict> = Object.fromEntries(
  telegrams.map((telegram) => [telegram.destination, telegram]),
);
