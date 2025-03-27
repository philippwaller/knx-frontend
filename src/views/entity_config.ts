
import type { TemplateResult, PropertyValues } from "lit";
import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators";

import "@ha/layouts/hass-loading-screen";
import "@ha/layouts/hass-subpage";
import "@ha/components/ha-alert";
import "@ha/components/ha-card";
import "@ha/components/ha-fab";
import "@ha/components/ha-svg-icon";
import type { HomeAssistant, Route } from "@ha/types";

import { KNXLogger } from "../tools/knx-logger";
import type { KNX } from "../types/knx";

const logger = new KNXLogger("knx-entity-config");

@customElement("knx-entity-config")
export class KNXEntityConfig extends LitElement {
  @property({ type: Object }) public hass!: HomeAssistant;

  @property({ attribute: false }) public knx!: KNX;

  @property({ type: Object }) public route!: Route;

  @property({ type: Boolean, reflect: true }) public narrow!: boolean;

  @property({ type: String, attribute: "back-path" }) public backPath?: string;

  @state() private _loading = false;

  protected async firstUpdated() {
    if (!this.knx.project) {
      this.knx.loadProject().then(() => {
        this.requestUpdate();
      });
    }
  }

  protected willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("route")) {
      // Handle route changes here
      logger.debug("Route changed", this.route);
    }
  }

  protected render(): TemplateResult {
    if (!this.hass || !this.knx.project || this._loading) {
      return html` <hass-loading-screen></hass-loading-screen> `;
    }

    return html`<hass-subpage
      .hass=${this.hass}
      .narrow=${this.narrow}
      .back-path=${this.backPath}
      .header=${"Entity Configuration"}
    >
      <div class="content">
        <ha-card outlined>
          <div class="card-content">
            <p>This is the new entity configuration view.</p>
          </div>
        </ha-card>
      </div>
    </hass-subpage>`;
  }

  static styles = css`
    hass-loading-screen {
      --app-header-background-color: var(--sidebar-background-color);
      --app-header-text-color: var(--sidebar-text-color);
    }

    .content {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    ha-card {
      margin-bottom: 16px;
    }

    .card-content {
      padding: 16px;
    }

    ha-fab {
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 1;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "knx-entity-config": KNXEntityConfig;
  }
}