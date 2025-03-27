import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators";
import "@ha/components/ha-formfield";
import "@ha/components/ha-selector/ha-selector-select";
import "@ha/components/ha-radio";
import { fireEvent } from "@ha/common/dom/fire_event";
import type { HomeAssistant } from "@ha/types";
import type { DPTOption } from "../utils/schema";

@customElement("knx-dpt-selector")
class KnxDptSelector extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;

  @property({ type: String }) mode?: "list" | "dropdown" = "dropdown";

  @property({ type: Array }) options: ReadonlyArray<DPTOption> = [];

  @property() value?: string;

  // Label property is used over a static fallback ("DPT Type")
  @property() label?: string;

  @property({ type: Boolean }) disabled = false;

  @property({ type: Boolean, reflect: true }) invalid = false;

  // Optional invalid message to be shown when invalid is true
  @property({ attribute: false }) invalidMessage?: string;

  // Determines how many items we handle before switching from list to dropdown mode
  private static readonly LIST_MODE_THRESHOLD = 2;

  render() {
    // Fallback if no options have been provided
    if (!this.options || this.options.length === 0) {
      return html`
        <div>
          <p class="no-options">No DPT options available</p>
          ${this.invalidMessage
            ? html`<p class="invalid-message" role="alert">${this.invalidMessage}</p>`
            : nothing}
        </div>
      `;
    }

    return html`
      <div>
        ${this._computedMode === "list" ? this._renderListMode() : this._renderDropdownMode()}
        ${this.invalidMessage
          ? html`<p class="invalid-message" role="alert">${this.invalidMessage}</p>`
          : nothing}
      </div>
    `;
  }

  private _renderListMode() {
    return html`
      <h3>${this._computedLabel}</h3>
      ${this.options.map((item) => this._renderListOption(item))}
    `;
  }

  private _renderListOption(item: DPTOption) {
    return html`
      <div class="formfield">
        <ha-radio
          .checked=${item.value === this.value}
          .value=${item.value}
          .disabled=${this.disabled}
          @change=${this._valueChanged}
        ></ha-radio>
        <label @click=${this._valueChanged} aria-label=${item.label}>
          <p>${item.label}</p>
          ${item.description ? html`<p class="secondary">${item.description}</p>` : nothing}
        </label>
      </div>
    `;
  }

  private _renderDropdownMode() {
    return html`
      <ha-selector-select
        .hass=${this.hass}
        .label=${this._computedLabel}
        .value=${this.value}
        .disabled=${this.disabled}
        @change=${this._valueChanged}
        .selector=${{
          select: {
            mode: "dropdown" as const,
            options: this.options.map((item) => ({
              value: item.value,
              label: `${item.description} - ${item.label}`,
            })),
          },
        }}
      ></ha-selector-select>
    `;
  }

  // Fires "value-changed" event if the new value differs and is not disabled
  private _valueChanged(ev: Event) {
    const value = (ev.target as HTMLInputElement).value;
    if (!this.disabled && value !== this.value) {
      fireEvent(this, "value-changed", { value });
    }
  }

  // Determines if we use list or dropdown mode based on threshold
  private get _computedMode() {
    if (this.mode) {
      return this.mode;
    }
    return this.options.length <= KnxDptSelector.LIST_MODE_THRESHOLD ? "list" : "dropdown";
  }

  // If label property is given, use it; otherwise, use "DPT Type" as fallback
  private get _computedLabel() {
    return this.label || "DPT Type";
  }

  static styles = css`
    :host([invalid]) div {
      color: var(--error-color);
    }

    .formfield {
      display: flex;
      align-items: center;
    }

    /* Minimum label width can be customized via CSS var */
    label {
      min-width: var(--form-label-min-width, 200px);
      cursor: pointer;
    }

    p {
      margin: 0;
      color: var(--primary-text-color);
    }

    .secondary {
      font-size: var(--mdc-typography-body2-font-size, 0.875rem);
      color: var(--secondary-text-color);
    }

    .invalid-message {
      font-size: 0.75rem;
      color: var(--error-color);
      padding-left: 16px;
    }

    .no-options {
      color: var(--secondary-text-color);
      font-style: italic;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "knx-dpt-selector": KnxDptSelector;
  }
}
