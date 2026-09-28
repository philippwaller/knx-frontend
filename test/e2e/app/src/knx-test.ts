import { html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";

import type { MockHomeAssistant } from "@ha/fake_data/provide_hass";
import { provideHass } from "@ha/fake_data/provide_hass";
import type { Route } from "@ha/types";

import { defaultFixtures } from "./fixtures";
import { registerMocks } from "./mock-ws";

declare global {
  interface Window {
    /** The fake `hass` behind the panel; tests use it to change state or send commands. */
    __mockHass: MockHomeAssistant;
  }
}

const PANEL_PREFIX = "/knx";
// Breakpoint below which Home Assistant renders panels narrow.
const NARROW_QUERY = "(max-width: 870px)";

const currentRoute = (): Route => ({
  prefix: PANEL_PREFIX,
  path: location.pathname.slice(PANEL_PREFIX.length),
});

/**
 * Hosts the KNX panel the way Home Assistant does, backed by a fake `hass` instead of a server.
 * Renders into its light DOM because `<knx-frontend>` styles its parent element.
 */
@customElement("knx-test")
export class KnxTest extends LitElement {
  @property({ attribute: false }) public hass?: MockHomeAssistant;

  @state() private _route = currentRoute();

  @state() private _narrow = false;

  private _narrowQuery = matchMedia(NARROW_QUERY);

  public connectedCallback() {
    super.connectedCallback();
    if (!location.pathname.startsWith(PANEL_PREFIX)) {
      history.replaceState(null, "", `${PANEL_PREFIX}${location.search}`);
      this._route = currentRoute();
    }
    if (!this.hass) {
      this._initializeHass();
    }
    this._narrow = this._narrowQuery.matches;
    this._narrowQuery.addEventListener("change", this._narrowChanged);
    // HA's navigate() fires location-changed; the panel's own URL changes arrive this way.
    window.addEventListener("location-changed", this._locationChanged);
    window.addEventListener("popstate", this._locationChanged);
  }

  public disconnectedCallback() {
    super.disconnectedCallback();
    this._narrowQuery.removeEventListener("change", this._narrowChanged);
    window.removeEventListener("location-changed", this._locationChanged);
    window.removeEventListener("popstate", this._locationChanged);
  }

  protected createRenderRoot() {
    return this;
  }

  protected render() {
    if (!this.hass) {
      return nothing;
    }
    return html`<knx-frontend
      .hass=${this.hass}
      .route=${this._route}
      .narrow=${this._narrow}
    ></knx-frontend>`;
  }

  private _initializeHass() {
    const fixtures = defaultFixtures();
    // `false`: <knx-frontend> provides the HA contexts itself through contextMixin.
    const hass = provideHass(this, { panelUrl: "knx" }, true, false);
    registerMocks(hass, fixtures);
    hass.updateStates(fixtures.states);
    window.__mockHass = hass;
  }

  private _locationChanged = () => {
    this._route = currentRoute();
  };

  private _narrowChanged = (ev: MediaQueryListEvent) => {
    this._narrow = ev.matches;
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "knx-test": KnxTest;
  }
}
