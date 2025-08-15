import type {
  CallbackDataParams,
  TopLevelFormatterParams,
} from "echarts/types/dist/shared";
import type { CSSResultGroup } from "lit";
import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators";
import memoizeOne from "memoize-one";

import type {
  NetworkData,
  NetworkLink,
  NetworkNode,
} from "@ha/components/chart/ha-network-graph";
import "@ha/components/chart/ha-network-graph";
import "@ha/layouts/hass-tabs-subpage";
import type { HomeAssistant, Route } from "@ha/types";
import { PageNavigation } from "@ha/layouts/hass-tabs-subpage";

import type { KNX } from "../types/knx";
import type { Device, GroupAddress } from "../types/websocket";

@customElement("knx-network-visualization")
export class KnxNetworkVisualization extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public knx!: KNX;

  @property({ attribute: false }) public route!: Route;

  @property({ type: Array, reflect: false }) public tabs!: PageNavigation[];

  @property({ type: Boolean, reflect: true }) public narrow = false;

  @property({ attribute: "is-wide", type: Boolean }) public isWide = false;

  @state() private _devices: Record<string, Device> = {};

  @state() private _groupAddresses: Record<string, GroupAddress> = {};

  public connectedCallback(): void {
    super.connectedCallback();
    if (this.knx.project?.project_loaded) {
      this._devices = this.knx.project.knxproject.devices || {};
      this._groupAddresses = this.knx.project.knxproject.group_addresses || {};
    }
  }

  protected render() {
    if (!this.knx.project?.project_loaded) {
      return html`
        <hass-tabs-subpage
          .tabs=${this.tabs}
          .hass=${this.hass}
          .narrow=${this.narrow}
          .isWide=${this.isWide}
          .route=${this.route}
          header=${this.knx.localize("network_visualization_title")}
        >
          <div class="content">
            <p>No KNX project loaded.</p>
          </div>
        </hass-tabs-subpage>
      `;
    }

    return html`
      <hass-tabs-subpage
        .tabs=${this.tabs}
        .hass=${this.hass}
        .narrow=${this.narrow}
        .isWide=${this.isWide}
        .route=${this.route}
        header=${this.knx.localize("network_visualization_title")}
      >
        <ha-network-graph
          .hass=${this.hass}
          .data=${this._formatNetworkData(this._devices, this._groupAddresses)}
          .tooltipFormatter=${this._tooltipFormatter}
          @chart-click=${this._handleChartClick}
        ></ha-network-graph>
      </hass-tabs-subpage>
    `;
  }

  private _formatNetworkData = memoizeOne(
    (
      devices: Record<string, Device>,
      groupAddresses: Record<string, GroupAddress>
    ): NetworkData => {
      const style = getComputedStyle(this);
      const categories = [
        {
          name: this.knx.localize("network_visualization_devices"),
          symbol: "roundRect",
          itemStyle: {
            color: style.getPropertyValue("--primary-color"),
          },
        },
        {
          name: this.knx.localize("network_visualization_group_addresses"),
          symbol: "circle",
          itemStyle: {
            color: style.getPropertyValue("--accent-color"),
          },
        },
      ];

      const nodes: NetworkNode[] = [];
      const links: NetworkLink[] = [];

      // Add device nodes
      Object.entries(devices).forEach(([deviceId, device]) => {
        nodes.push({
          id: deviceId,
          name: device.name || device.individual_address,
          category: 0,
          symbolSize: 30,
          symbol: "roundRect",
          value: device.communication_object_ids.length,
        });
      });

      // Add group address nodes and create links to devices
      Object.entries(groupAddresses).forEach(([gaId, groupAddress]) => {
        nodes.push({
          id: gaId,
          name: groupAddress.name || groupAddress.address,
          category: 1,
          symbolSize: 20,
          symbol: "circle",
          value: groupAddress.communication_object_ids.length,
        });

        // Create links between group addresses and devices through communication objects
        groupAddress.communication_object_ids.forEach(coId => {
          Object.entries(devices).forEach(([deviceId, device]) => {
            if (device.communication_object_ids.includes(coId)) {
              const existingLink = links.find(
                link =>
                  (link.source === deviceId && link.target === gaId) ||
                  (link.source === gaId && link.target === deviceId)
              );

              if (!existingLink) {
                links.push({
                  source: deviceId,
                  target: gaId,
                  lineStyle: {
                    color: style.getPropertyValue("--divider-color"),
                    width: 1,
                    type: "solid",
                  },
                });
              }
            }
          });
        });
      });

      return { nodes, links, categories };
    }
  );

  private _tooltipFormatter = (params: TopLevelFormatterParams): string => {
    const { dataType, data } = params as CallbackDataParams;

    if (dataType === "edge") {
      const { source, target } = data as any;
      const sourceName = this._getNodeName(source);
      const targetName = this._getNodeName(target);
      return `${sourceName} → ${targetName}`;
    }

    const nodeId = (data as any).id;
    const device = this._devices[nodeId];
    if (device) {
      let label = `<b>${this.knx.localize("network_visualization_device")}: </b>${device.name}`;
      label += `<br><b>${this.knx.localize("network_visualization_individual_address")}: </b>${device.individual_address}`;
      if (device.manufacturer_name) {
        label += `<br><b>${this.knx.localize("network_visualization_manufacturer")}: </b>${device.manufacturer_name}`;
      }
      if (device.hardware_name) {
        label += `<br><b>${this.knx.localize("network_visualization_hardware")}: </b>${device.hardware_name}`;
      }
      if (device.description) {
        label += `<br><b>${this.knx.localize("network_visualization_description")}: </b>${device.description}`;
      }
      return label;
    }

    const groupAddress = this._groupAddresses[nodeId];
    if (groupAddress) {
      let label = `<b>${this.knx.localize("network_visualization_group_address")}: </b>${groupAddress.name}`;
      label += `<br><b>${this.knx.localize("network_visualization_address")}: </b>${groupAddress.address}`;
      if (groupAddress.dpt) {
        label += `<br><b>DPT: </b>${groupAddress.dpt.main}${groupAddress.dpt.sub ? `.${groupAddress.dpt.sub}` : ""}`;
      }
      if (groupAddress.description) {
        label += `<br><b>${this.knx.localize("network_visualization_description")}: </b>${groupAddress.description}`;
      }
      return label;
    }

    return nodeId;
  };

  private _getNodeName(id: string): string {
    const device = this._devices[id];
    if (device) {
      return device.name || device.individual_address;
    }
    const groupAddress = this._groupAddresses[id];
    if (groupAddress) {
      return groupAddress.name || groupAddress.address;
    }
    return id;
  }

  private _handleChartClick(e: CustomEvent): void {
    if (e.detail.dataType === "node" && e.detail.event.target.cursor === "pointer") {
      const { id } = e.detail.data;

      const device = this._devices[id];
      if (device) {
        // Device clicked
        return;
      }

      const groupAddress = this._groupAddresses[id];
      if (groupAddress) {
        // Group address clicked
        return;
      }
    }
  }

  static get styles(): CSSResultGroup {
    return [
      css`
        ha-network-graph {
          height: 100%;
        }

        .content {
          padding: 16px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "knx-network-visualization": KnxNetworkVisualization;
  }
}
