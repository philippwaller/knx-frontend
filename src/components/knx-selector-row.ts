import { LitElement, html, css, nothing } from "lit";
import type { TemplateResult, CSSResultGroup } from "lit";
import { customElement, property, state } from "lit/decorators";
import { classMap } from "lit/directives/class-map";

import { fireEvent } from "@ha/common/dom/fire_event";
import "@ha/components/ha-checkbox";
import "@ha/components/ha-selector/ha-selector";
import "@ha/components/ha-switch";
import type { HomeAssistant } from "@ha/types";
import type { KnxHaSelector } from "../utils/schema";

@customElement("knx-selector-row")
export class KnxSelectorRow extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property() public key!: string;

  @property({ attribute: false }) public selector!: KnxHaSelector;

  @property() public value?: any;

  @state() private _disabled: boolean = false;

  private _haSelectorValue: any = null;

  public connectedCallback() {
    super.connectedCallback();
    this._disabled = !!this.selector.optional && this.value === undefined;
    // apply default value if available or no value is set yet
    this._haSelectorValue = this.value ?? this.selector.default ?? null;
  }

  protected render(): TemplateResult {
    const possibleInlineSelector =
      "boolean" in this.selector.selector || "number" in this.selector.selector;
    const inlineSelector = !this.selector.optional && possibleInlineSelector;

    const haSelector = html`<ha-selector
      class=${classMap({ "newline-selector": !inlineSelector })}
      .hass=${this.hass}
      .selector=${this.selector.selector}
      .disabled=${this._disabled}
      .value=${this._haSelectorValue}
      @value-changed=${this._valueChange}
    ></ha-selector>`;

    return html`
      <div class="body">
        <div class="text">
          <p class="heading">${this.selector.label}</p>
          <p class="description">${this.selector.helper}</p>
        </div>
        ${this.selector.optional
          ? html`<ha-selector
              class="optional-switch"
              .selector=${{ boolean: {} }}
              .value=${!this._disabled}
              @value-changed=${this._toggleDisabled}
            ></ha-selector>`
          : inlineSelector
            ? haSelector
            : nothing}
      </div>
      ${inlineSelector ? nothing : haSelector}
    `;
  }

  private _toggleDisabled(ev: Event) {
    ev.stopPropagation();
    this._disabled = !this._disabled;
    this._propagateValue();
  }

  private _valueChange(ev: Event) {
    ev.stopPropagation();
    this._haSelectorValue = ev.detail.value;
    this._propagateValue();
  }

  private _propagateValue() {
    fireEvent(this, "value-changed", { value: this._disabled ? undefined : this._haSelectorValue });
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
        padding: 8px 16px 8px 0;
        border-top: 1px solid var(--divider-color);
      }
      .newline-selector {
        display: block;
        padding-top: 8px;
      }
      .body {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        row-gap: 8px;
      }
      .body > * {
        flex-grow: 1;
      }
      .text {
        flex-basis: 260px; /* min size of text - if inline selector is too big it will be pushed to next row */
      }
      .heading {
        margin: 0;
      }
      .description {
        margin: 0;
        display: block;
        padding-top: 4px;
        font-family: var(
          --mdc-typography-body2-font-family,
          var(--mdc-typography-font-family, Roboto, sans-serif)
        );
        -webkit-font-smoothing: antialiased;
        font-size: var(--mdc-typography-body2-font-size, 0.875rem);
        font-weight: var(--mdc-typography-body2-font-weight, 400);
        line-height: normal;
        color: var(--secondary-text-color);
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "knx-selector-row": KnxSelectorRow;
  }
}
