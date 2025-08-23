import { showAlertDialog } from "@ha/dialogs/generic/show-dialog-box";

import type { KNX } from "../../../types/knx";
import { showToast } from "../../../utils/toast";
import type ProjectGraph from "./project-graph";

/**
 * Service responsible for handling related address filtering
 */
export class RelatedAddressService {
  constructor(
    private _knx?: KNX,
    private _projectGraph?: ProjectGraph,
  ) {}

  /**
   * Updates the KNX instance for localization
   */
  public updateKnx(knx: KNX): void {
    this._knx = knx;
  }

  /**
   * Updates the project graph instance
   */
  public updateProjectGraph(projectGraph: ProjectGraph): void {
    this._projectGraph = projectGraph;
  }

  /**
   * Applies related addresses based filtering
   * @returns The addresses to filter by or null if no related addresses found
   */
  public getRelatedAddresses(
    groupAddress: string,
    hostElement?: any,
  ): {
    destinationAddresses: string[];
    sourceAddresses: string[];
  } | null {
    if (!this._projectGraph) {
      if (hostElement) {
        showAlertDialog(hostElement, {
          title: this._knx?.localize("group_monitor_related_addresses_title") || "",
          text: this._knx?.localize("group_monitor_related_addresses_no_project") || "",
        });
      }
      return null;
    }

    const related = this._projectGraph.getRelatedAddress(groupAddress);
    const relatedGroupAddresses = related.groupAddresses ?? [];
    const relatedDeviceAddresses = related.deviceAddresses ?? [];

    if (relatedGroupAddresses.length === 0 && relatedDeviceAddresses.length === 0) {
      if (hostElement) {
        showAlertDialog(hostElement, {
          title: this._knx?.localize("group_monitor_related_addresses_title") || "",
          text:
            this._knx?.localize("group_monitor_related_addresses_no_relations", {
              address: groupAddress,
            }) || "",
        });
      }
      return null;
    }

    // Include the original group address for destination filtering
    const destinationAddresses = [groupAddress, ...relatedGroupAddresses];
    const sourceAddresses = relatedDeviceAddresses;

    // Show a toast notification that related addresses were applied
    if (hostElement) {
      showToast(hostElement, {
        message:
          this._knx?.localize("group_monitor_related_addresses_applied", {
            groupAddress,
            destinationCount: destinationAddresses.length,
            sourceCount: sourceAddresses.length,
          }) || "",
      });
    }

    return {
      destinationAddresses,
      sourceAddresses,
    };
  }
}
