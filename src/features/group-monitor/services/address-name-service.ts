import type { KNXProject } from "../../../types/websocket";

/**
 * Service to resolve human readable names for KNX addresses
 * using project data loaded from the backend.
 */
export class AddressNameService {
  private _project: KNXProject | null = null;

  /**
   * Update current project data used for name resolution
   */
  public setProject(project: KNXProject | null): void {
    this._project = project;
  }

  /**
   * Resolve a group address name from the project data
   */
  public getGroupAddressName(address: string): string {
    if (!this._project) return "";
    return this._project.group_addresses[address]?.name || "";
  }

  /**
   * Resolve an individual address name from the project data
   */
  public getIndividualAddressName(address: string): string {
    if (!this._project) return "";
    for (const device of Object.values(this._project.devices)) {
      if (device.individual_address === address) {
        return device.name || "";
      }
    }
    return "";
  }
}

export default AddressNameService;
