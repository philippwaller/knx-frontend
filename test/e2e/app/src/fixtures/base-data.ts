import type { KNXBaseData, KNXProjectInfo } from "../../../../../src/types/websocket";

export const projectInfo: KNXProjectInfo = {
  name: "E2E test project",
  last_modified: "2026-09-01T10:00:00.000000",
  tool_version: "6.2.1",
  xknxproject_version: "3.8.2",
};

export const baseData: KNXBaseData = {
  connection_info: {
    version: "3.10.0",
    connected: true,
    current_address: "1.1.250",
    telegram_backend: "memory",
    telegram_retention: 7,
    telegram_max_count: 50000,
  },
  dpt_metadata: {
    "1.001": {
      dpt_class: "enum",
      main: 1,
      sub: 1,
      name: "switch",
      unit: null,
      sensor_device_class: null,
      sensor_state_class: null,
      payload_length: 0,
      options: ["off", "on"],
    },
    "5.001": {
      dpt_class: "numeric",
      main: 5,
      sub: 1,
      name: "percent",
      unit: "%",
      sensor_device_class: null,
      sensor_state_class: "measurement",
      payload_length: 1,
      min: 0,
      max: 100,
      step: 1,
    },
    "9.001": {
      dpt_class: "numeric",
      main: 9,
      sub: 1,
      name: "temperature",
      unit: "°C",
      sensor_device_class: "temperature",
      sensor_state_class: "measurement",
      payload_length: 2,
      min: -273,
      max: 670760,
      step: 0.01,
    },
  },
  project_info: projectInfo,
  supported_platforms: ["binary_sensor", "climate", "cover", "light", "sensor", "switch"],
};
