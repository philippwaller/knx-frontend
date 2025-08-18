import type { KNX } from "../../../types/knx";
import type { KNXProject } from "../../../types/websocket";
import { KNXLogger } from "../../../tools/knx-logger";

/**
 * ProjectGraph
 *
 * Central access layer for KNX project data with internal lazy loading.
 * Pass a `KNX` instance; the graph handles loading project data on demand
 * and exposes convenience lookups.
 */
export class ProjectGraph {
  private _logger = new KNXLogger("project_graph");

  private _knx: KNX;

  private _project: KNXProject | null = null;

  private _loading: Promise<void> | null = null;

  private _onLoaded = new Set<() => void>();

  /**
   * Create a ProjectGraph
   * @param knx KNX instance to use
   * @param proactivelyLoad Whether to start loading project data immediately when
   *   KNX reports a project. Default true to preserve existing behavior.
   */
  constructor(knx: KNX, proactivelyLoad = true) {
    this._knx = knx;
    // If project already present in KNX, cache synchronously so isLoaded reflects immediately
    if (this._knx.project?.knxproject) {
      this._project = this._knx.project.knxproject;
    } else if (proactivelyLoad && this._knx.info?.project) {
      // Optionally proactively load if a project is configured in KNX info
      this._startLoading();
    }
  }

  /** Ensure the project data is loaded (loads on demand). */
  public async ensureLoaded(): Promise<void> {
    await this._startLoading();
  }

  private _startLoading(): Promise<void> {
    if (this._project) {
      return Promise.resolve();
    }
    if (this._loading) {
      return this._loading;
    }
    this._loading = (async () => {
      // If KNX already has the project, just cache it
      if (this._knx.project?.knxproject) {
        this._project = this._knx.project.knxproject;
        this._logger.info("project loaded (cached)", this._project ?? "<unknown>");
        this._notifyLoaded();
        return;
      }
      try {
        await this._knx.loadProject();
        this._project = this._knx.project?.knxproject ?? null;
        if (this._project) {
          this._logger.info("project loaded", this._project);
          this._notifyLoaded();
        }
      } catch (_e) {
        this._project = null;
      }
    })().finally(() => {
      // Keep last resolved state, but clear loading flag
      this._loading = null;
    });
    return this._loading;
  }

  /** Subscribe to a onevent when project is available. Returns an unsubscribe. */
  public onLoaded(cb: () => void): () => void {
    this._onLoaded.add(cb);
    return () => this._onLoaded.delete(cb);
  }

  private _notifyLoaded(): void {
    for (const cb of Array.from(this._onLoaded)) {
      try {
        cb();
      } catch (_e) {
        // ignore callback errors
      }
    }
  }

  /** Whether project data is available */
  public get isLoaded(): boolean {
    return this._project !== null;
  }

  /** Resolve a group address name from the project data */
  public getGroupAddressName(address: string): string {
    if (!this._project && this._knx.info?.project) {
      this._startLoading();
    }
    if (!this._project) return "";
    return this._project.group_addresses[address]?.name || "";
  }

  /** Resolve an individual address name from the project data */
  public getIndividualAddressName(address: string): string {
    if (!this._project && this._knx.info?.project) {
      this._startLoading();
    }
    if (!this._project) return "";
    for (const device of Object.values(this._project.devices)) {
      if (device.individual_address === address) {
        return device.name || "";
      }
    }
    return "";
  }

  /**
   * Find related addresses based on device channels and communication objects.
   * Returns both related group addresses and device (individual) addresses separately.
   * If devices have channels, only include group addresses from the same channel.
   * Otherwise, include all group addresses linked to the same devices.
   */
  public getRelatedAddress(groupAddress: string): {
    groupAddresses: string[];
    deviceAddresses: string[];
  } {
    if (!this._project) {
      this._logger.debug("No project loaded, cannot find related group addresses");
      return { groupAddresses: [], deviceAddresses: [] };
    }

    const targetGA = this._project.group_addresses[groupAddress];
    if (!targetGA) {
      this._logger.debug("Group address not found in project:", groupAddress);
      return { groupAddresses: [], deviceAddresses: [] };
    }

    this._logger.debug(
      "Finding related group addresses for:",
      groupAddress,
      "with",
      targetGA.communication_object_ids.length,
      "communication objects",
    );

    const relatedAddresses = new Set<string>();
    const relatedDeviceAddresses = new Set<string>();
    const processedDevices = new Set<string>();

    // Get all communication objects linked to the target group address
    for (const coId of targetGA.communication_object_ids) {
      const commObj = this._project.communication_objects[coId];
      if (!commObj) continue;

      const deviceAddress = commObj.device_address;
      if (processedDevices.has(deviceAddress)) continue;
      processedDevices.add(deviceAddress);

      const device = this._project.devices[deviceAddress];
      if (!device) continue;

      // Always include the device's individual address as related
      if (device.individual_address) {
        relatedDeviceAddresses.add(device.individual_address);
      }

      // Check if device has channels and the communication object belongs to a specific channel
      const hasChannels = Object.keys(device.channels).length > 0;
      let targetChannel: string | null = null;

      if (hasChannels && commObj.channel) {
        targetChannel = commObj.channel;
        this._logger.debug("Device has channels, filtering by channel:", targetChannel);
      }

      // Find all communication objects on this device
      for (const deviceCoId of device.communication_object_ids) {
        const deviceCommObj = this._project.communication_objects[deviceCoId];
        if (!deviceCommObj) continue;

        // If we're filtering by channel, only include objects from the same channel
        if (targetChannel && deviceCommObj.channel !== targetChannel) {
          continue;
        }

        // Add all group addresses linked to this communication object
        for (const linkedGA of deviceCommObj.group_address_links) {
          if (linkedGA !== groupAddress) {
            // Don't include the original address
            relatedAddresses.add(linkedGA);
          }
        }
      }
    }

    const groupAddresses = Array.from(relatedAddresses);
    const deviceAddresses = Array.from(relatedDeviceAddresses);
    this._logger.debug(
      "Found",
      groupAddresses.length + deviceAddresses.length,
      "related addresses for",
      groupAddress,
    );
    for (const addr of groupAddresses) {
      this._logger.debug("Related GA:", this.getGroupAddressName(addr));
    }
    for (const addr of deviceAddresses) {
      this._logger.debug("Related IA:", addr);
    }
    return { groupAddresses, deviceAddresses };
  }
}

export default ProjectGraph;
