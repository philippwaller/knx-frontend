import type { SelectorSchema } from "../../../src/types/schema";

export function createSchemas(): Record<string, SelectorSchema[]> {
  return {
    light: [
      {
        name: "switch",
        type: "knx_group_address",
        required: true,
        options: {
          write: { required: true },
          state: { required: false },
          validDPTs: [{ main: 1, sub: 1 }],
        },
      },
    ],
    sensor: [
      {
        name: "state",
        type: "knx_group_address",
        required: true,
        options: {
          state: { required: true },
          dptSelect: [{ value: "9.001", translation_key: "9_001", dpt: { main: 9, sub: 1 } }],
        },
      },
    ],
  };
}
