import { describe, it, expect, beforeEach } from "vitest";
import { ProjectGraph } from "./project-graph";
import type { KNX } from "../../../types/knx";
import type { KNXProject } from "../../../types/websocket";

// Mock KNX project data for testing
const mockProject: KNXProject = {
  info: {
    name: "Test Project",
    last_modified: "2024-01-01",
    tool_version: "5.0",
    xknxproject_version: "3.3.0",
  },
  group_addresses: {
    "1/0/1": {
      name: "Living Room Light",
      identifier: "light_living",
      raw_address: 513,
      address: "1/0/1",
      project_uid: 1,
      dpt: { main: 1, sub: 1 },
      communication_object_ids: ["co1"],
      description: "Main light",
      comment: "",
    },
    "1/0/2": {
      name: "Living Room Dimmer",
      identifier: "dim_living",
      raw_address: 514,
      address: "1/0/2",
      project_uid: 2,
      dpt: { main: 5, sub: 1 },
      communication_object_ids: ["co2"],
      description: "Dimmer control",
      comment: "",
    },
    "1/1/1": {
      name: "Kitchen Light",
      identifier: "light_kitchen",
      raw_address: 769,
      address: "1/1/1",
      project_uid: 3,
      dpt: { main: 1, sub: 1 },
      communication_object_ids: ["co3"],
      description: "Kitchen light",
      comment: "",
    },
  },
  group_ranges: {},
  devices: {
    "1.1.1": {
      name: "Living Room Switch",
      hardware_name: "Switch Actor",
      description: "2-channel switch",
      manufacturer_name: "KNX Corp",
      individual_address: "1.1.1",
      application: "app1",
      project_uid: 10,
      communication_object_ids: ["co1", "co2"],
      channels: {
        ch1: {
          identifier: "ch1",
          name: "Channel 1",
        },
        ch2: {
          identifier: "ch2",
          name: "Channel 2",
        },
      },
    },
    "1.1.2": {
      name: "Kitchen Switch",
      hardware_name: "Switch Actor",
      description: "1-channel switch",
      manufacturer_name: "KNX Corp",
      individual_address: "1.1.2",
      application: "app2",
      project_uid: 11,
      communication_object_ids: ["co3"],
      channels: {},
    },
  },
  communication_objects: {
    co1: {
      name: "Switch 1",
      number: 1,
      text: "On/Off",
      function_text: "Switch",
      description: "Main switch",
      device_address: "1.1.1",
      device_application: "app1",
      module: null,
      channel: "ch1",
      dpts: [{ main: 1, sub: 1 }],
      object_size: "1 Bit",
      group_address_links: ["1/0/1"],
      flags: {
        read: true,
        write: true,
        communication: true,
        transmit: true,
        update: true,
        readOnInit: false,
      },
    },
    co2: {
      name: "Dimmer 1",
      number: 2,
      text: "Brightness",
      function_text: "Dimmer",
      description: "Dimmer control",
      device_address: "1.1.1",
      device_application: "app1",
      module: null,
      channel: "ch1", // Same channel as co1
      dpts: [{ main: 5, sub: 1 }],
      object_size: "1 Byte",
      group_address_links: ["1/0/2"],
      flags: {
        read: true,
        write: true,
        communication: true,
        transmit: true,
        update: true,
        readOnInit: false,
      },
    },
    co3: {
      name: "Kitchen Switch",
      number: 1,
      text: "On/Off",
      function_text: "Switch",
      description: "Kitchen switch",
      device_address: "1.1.2",
      device_application: "app2",
      module: null,
      channel: null, // No channel
      dpts: [{ main: 1, sub: 1 }],
      object_size: "1 Bit",
      group_address_links: ["1/1/1"],
      flags: {
        read: true,
        write: true,
        communication: true,
        transmit: true,
        update: true,
        readOnInit: false,
      },
    },
  },
};

const mockKNX: KNX = {
  language: "en",
  config_entry: {} as any,
  project: {
    project_loaded: true,
    knxproject: mockProject,
  },
  info: {
    version: "1.0.0",
    connected: true,
    current_address: "1.1.100",
    project: {
      name: "Test Project",
      last_modified: "2024-01-01",
      tool_version: "5.0",
      xknxproject_version: "3.3.0",
    },
  },
  localize: (key: string) => key,
  log: {
    info: (..._args: any[]) => undefined,
    debug: (..._args: any[]) => undefined,
    warn: (..._args: any[]) => undefined,
    error: (..._args: any[]) => undefined,
  },
  loadProject: () => Promise.resolve(),
};

describe("ProjectGraph", () => {
  let projectGraph: ProjectGraph;

  beforeEach(() => {
    projectGraph = new ProjectGraph(mockKNX, false); // Don't load proactively for tests
    // Manually set the project for testing
    (projectGraph as any)._project = mockProject;
  });

  describe("getRelatedAddress", () => {
    it("should return related addresses from same channel", () => {
      // Test with 1/0/1 (channel ch1) - should find 1/0/2 (also channel ch1)
      const related = projectGraph.getRelatedAddress("1/0/1");
      expect(related.groupAddresses).toEqual(["1/0/2"]);
      expect(related.deviceAddresses).toEqual(["1.1.1"]);
    });

    it("should return related addresses from same channel (reverse)", () => {
      // Test with 1/0/2 (channel ch1) - should find 1/0/1 (also channel ch1)
      const related = projectGraph.getRelatedAddress("1/0/2");
      expect(related.groupAddresses).toEqual(["1/0/1"]);
      expect(related.deviceAddresses).toEqual(["1.1.1"]);
    });

    it("should return empty array when no related addresses found", () => {
      // Test with 1/1/1 (device has no channels) - should find no related addresses
      const related = projectGraph.getRelatedAddress("1/1/1");
      expect(related.groupAddresses).toEqual([]);
      expect(related.deviceAddresses).toEqual(["1.1.2"]);
    });

    it("should return empty array for non-existent group address", () => {
      const related = projectGraph.getRelatedAddress("9/9/9");
      expect(related.groupAddresses).toEqual([]);
      expect(related.deviceAddresses).toEqual([]);
    });

    it("should handle device without channels", () => {
      // Kitchen switch device has no channels, so should return all addresses from same device
      const related = projectGraph.getRelatedAddress("1/1/1");
      expect(related.groupAddresses).toEqual([]);
      expect(related.deviceAddresses).toEqual(["1.1.2"]);
    });
  });

  describe("optional proactive loading", () => {
    it("should not trigger network load when disabled, but cache existing project", () => {
      const mockKNXWithProject = { ...mockKNX };
      const graph = new ProjectGraph(mockKNXWithProject, false);
      expect(graph.isLoaded).toBe(true);
    });

    it("should load proactively when enabled (default)", () => {
      const mockKNXWithProject = { ...mockKNX };
      const graph = new ProjectGraph(mockKNXWithProject, true);
      expect(graph.isLoaded).toBe(true);
    });
  });
});
