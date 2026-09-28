import type {
  CommunicationObject,
  DPT,
  GroupAddress,
  KNXProject,
} from "../../../../../src/types/websocket";
import { projectInfo } from "./base-data";

const SWITCH: DPT = { main: 1, sub: 1 };
const PERCENT: DPT = { main: 5, sub: 1 };
const TEMPERATURE: DPT = { main: 9, sub: 1 };

// 3-level address a/b/c is stored as (a << 11) | (b << 8) | c.
const groupAddress = (
  address: string,
  rawAddress: number,
  name: string,
  dpt: DPT,
  communicationObjectIds: string[],
): GroupAddress => ({
  name,
  identifier: `GA-${rawAddress}`,
  raw_address: rawAddress,
  address,
  project_uid: rawAddress,
  dpt,
  communication_object_ids: communicationObjectIds,
  description: "",
  comment: "",
});

const communicationObject = (
  deviceAddress: string,
  number: number,
  name: string,
  functionText: string,
  dpt: DPT,
  objectSize: string,
  groupAddressLinks: string[],
): CommunicationObject => ({
  name,
  number,
  text: name,
  function_text: functionText,
  description: "",
  device_address: deviceAddress,
  device_application: null,
  module: null,
  channel: null,
  dpts: [dpt],
  object_size: objectSize,
  group_address_links: groupAddressLinks,
  flags: {
    read: false,
    write: true,
    communication: true,
    transmit: true,
    update: false,
    readOnInit: false,
  },
});

export const project: KNXProject = {
  info: projectInfo,
  group_addresses: {
    "1/0/1": groupAddress("1/0/1", 2049, "Living room light switch", SWITCH, ["1.1.1/O-0_R-1"]),
    "1/0/2": groupAddress("1/0/2", 2050, "Living room light state", SWITCH, ["1.1.1/O-1_R-2"]),
    "1/1/1": groupAddress("1/1/1", 2305, "Living room light brightness", PERCENT, [
      "1.1.1/O-2_R-3",
    ]),
    "2/0/1": groupAddress("2/0/1", 4097, "Living room temperature", TEMPERATURE, ["1.1.2/O-0_R-1"]),
  },
  group_ranges: {
    "1": {
      name: "Lighting",
      address_start: 2048,
      address_end: 4095,
      comment: "",
      group_addresses: [],
      group_ranges: {
        "1/0": {
          name: "Switching",
          address_start: 2048,
          address_end: 2303,
          comment: "",
          group_addresses: ["1/0/1", "1/0/2"],
          group_ranges: {},
        },
        "1/1": {
          name: "Dimming",
          address_start: 2304,
          address_end: 2559,
          comment: "",
          group_addresses: ["1/1/1"],
          group_ranges: {},
        },
      },
    },
    "2": {
      name: "Climate",
      address_start: 4096,
      address_end: 6143,
      comment: "",
      group_addresses: [],
      group_ranges: {
        "2/0": {
          name: "Temperatures",
          address_start: 4096,
          address_end: 4351,
          comment: "",
          group_addresses: ["2/0/1"],
          group_ranges: {},
        },
      },
    },
  },
  devices: {
    "1.1.1": {
      name: "Switch actuator 4-fold",
      hardware_name: "SA/S4.16.6.2",
      description: "",
      manufacturer_name: "ABB",
      individual_address: "1.1.1",
      application: "Switch actuator",
      project_uid: 11,
      communication_object_ids: ["1.1.1/O-0_R-1", "1.1.1/O-1_R-2", "1.1.1/O-2_R-3"],
      channels: {},
    },
    "1.1.2": {
      name: "Room temperature sensor",
      hardware_name: "RTS 1",
      description: "",
      manufacturer_name: "MDT",
      individual_address: "1.1.2",
      application: "Temperature sensor",
      project_uid: 12,
      communication_object_ids: ["1.1.2/O-0_R-1"],
      channels: {},
    },
  },
  communication_objects: {
    "1.1.1/O-0_R-1": communicationObject("1.1.1", 0, "Switch", "Channel A", SWITCH, "1 Bit", [
      "1/0/1",
    ]),
    "1.1.1/O-1_R-2": communicationObject("1.1.1", 1, "Status", "Channel A", SWITCH, "1 Bit", [
      "1/0/2",
    ]),
    "1.1.1/O-2_R-3": communicationObject("1.1.1", 2, "Brightness", "Channel A", PERCENT, "1 Byte", [
      "1/1/1",
    ]),
    "1.1.2/O-0_R-1": communicationObject(
      "1.1.2",
      0,
      "Temperature",
      "Sensor",
      TEMPERATURE,
      "2 Bytes",
      ["2/0/1"],
    ),
  },
  topology: {
    "1": {
      name: "Area 1",
      description: null,
      lines: {
        "1.1": {
          name: "Line 1",
          medium_type: "TP",
          description: null,
          devices: ["1.1.1", "1.1.2"],
        },
      },
    },
  },
};
