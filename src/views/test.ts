import { HomeAssistant } from "@ha/types";
import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { getEntitySchemas } from "services/websocket.service";
import { DPTOption, GASchemaOptions, Schema } from "utils/schema";

// Custom Elements importieren
import "../components/knx-group-address-selector";
import type { KNX } from "../types/knx";
import { GASchema } from "types/entity_data";
import { localizeSchema } from "services/schema-localize.service";

@customElement("simple-greeting")
export class SimpleGreeting extends LitElement {
  // Define scoped styles right with your component, in plain CSS
  static styles = css`
    :host {
      color: blue;
    }
    .schema-container {
      font-family: monospace;
      max-width: 800px;
      margin: 0 auto;
    }
    .schema-item {
      border-left: 1px solid #ccc;
      margin: 4px 0;
      padding-left: 8px;
    }
    .schema-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
      cursor: pointer;
      user-select: none;
    }
    .schema-children {
      margin-left: 16px;
    }
    .schema-type {
      font-weight: bold;
      color: #2a4691;
    }
    .schema-name {
      color: #5e8a3a;
    }
    .schema-value {
      color: #666;
    }
    .schema-required {
      font-size: 0.8em;
      padding: 1px 4px;
      border-radius: 3px;
      background-color: #ff9800;
      color: white;
    }
    .schema-optional {
      font-size: 0.8em;
      padding: 1px 4px;
      border-radius: 3px;
      background-color: #8bc34a;
      color: white;
    }
    .type-renderer {
      border: 1px dashed #ccc;
      padding: 4px;
      margin-top: 4px;
      background-color: #f8f8f8;
    }
  `;

  @property({ type: Object }) public hass!: HomeAssistant;

  @property({ type: Object }) public knx!: KNX;

  @property() name?: string = "World";

  @property() schema?: Schema;

  firstUpdated() {
    getEntitySchemas(this.hass).then((schemas) => {
      for (const schema of schemas) {
        let platformEl = schema.properties?.find((prop) => prop.name === "platform");
        if (platformEl?.value === "sensor") {
          this.schema = schema;
          break;
        }
      }
      console.log("SENSOR Schema:", this.schema);
    });
  }

  /**
   * Renders a custom element based on the schema type
   * @param prop The schema property
   * @returns HTML template for the custom element
   */
  private renderTypeSpecificElement(prop: Schema): any {
    if (!prop || !prop.type) return null;

    switch (prop.type) {
      case "group_address_config":
        // { required: prop.properties?.find((p) => p.name === "state")?.required ?? false}
        let options: GASchemaOptions = ((prop: Schema) => {
          let writeOption = prop.properties?.find((p) => p.name === "write");
          const writeOptionFinal = writeOption
            ? { required: writeOption.required ?? false }
            : undefined;

          let stateOption = prop.properties?.find((p) => p.name === "state");
          const stateOptionFinal = stateOption
            ? { required: stateOption.required ?? false }
            : undefined;

          let passiveOption = prop.properties?.find((p) => p.name === "passive");
          const passiveOptionFinal = passiveOption ? true : false;

          let dptOptions: DPTOption[] = [];
          let dptOption = prop.properties?.find((p) => p.name === "dpt");
          if (dptOption?.options) {
            for (const option of dptOption.options) {
                const main = option[0].split(".")[0];
                const sub = option[0].includes(".") ? option[0].split(".")[1] : null;
              dptOptions.push({
                value: option[0],
                label: localizeSchema(this.hass, "config_panel.options.dpt." + option[0].replace(".","") + ".label") ?? option[0],
                description: localizeSchema(this.hass, "config_panel.options.dpt." + option[0].replace(".","") + ".description"),
                dpt: {
                  main: parseInt(main, 10),
                  sub: parseInt(sub, 10),
                },
              });
            }
          }
          console.log("DPT Options:", dptOptions);
          return {
            write: writeOptionFinal,
            state: stateOptionFinal,
            passive: passiveOptionFinal,
            dptSelect: dptOptions,
          };
        })(prop);


        console.log("Group Address Options:", options);

        // Echtes knx-group-address-selector Element rendern
        return html`
          <knx-group-address-selector
            .hass=${this.hass}
            .knx=${this.knx}
            .key=${prop.name}
            .label="Test Selector"
            .options=${options}
            .config=${{}}
          ></knx-group-address-selector>
        `;
      case "selector":
        return html`
          <div class="type-renderer">
            <strong>knx-selector-row</strong>
            <pre>
${JSON.stringify(
                {
                  name: prop.name,
                  selector: prop.selector,
                  required: prop.required,
                },
                null,
                2,
              )}</pre
            >
          </div>
        `;
      case "sync_state":
        return html`
          <div class="type-renderer">
            <strong>knx-sync-state-selector-row</strong>
            <pre>
${JSON.stringify(
                {
                  name: prop.name,
                  required: prop.required,
                },
                null,
                2,
              )}</pre
            >
          </div>
        `;
      case "settings_group":
        return html`
          <div class="type-renderer">
            <strong>ha-expansion-panel</strong>
            <pre>
${JSON.stringify(
                {
                  heading: prop.heading,
                  description: prop.description,
                  collapsible: prop.collapsible,
                },
                null,
                2,
              )}</pre
            >
          </div>
        `;
      case "group_select":
        return html`
          <div class="type-renderer">
            <strong>ha-control-select</strong>
            <pre>
${JSON.stringify(
                {
                  name: prop.name,
                  options: prop.options?.map((option: any) => option.value),
                },
                null,
                2,
              )}</pre
            >
          </div>
        `;
      default:
        return null;
    }
  }

  /**
   * Recursively renders a schema property and its children
   * @param prop The schema property to render
   * @param depth Current nesting depth
   * @returns HTML template for the property
   */
  private renderSchemaProperty(prop: any, depth = 0): any {
    if (!prop) return null;

    const isRequired = prop.required === true;
    const typeName = prop.type || "object";

    // Handle primitive values
    if (typeof prop === "string" || typeof prop === "number" || typeof prop === "boolean") {
      return html`<div class="schema-item">
        <div class="schema-header">
          <span class="schema-value">${String(prop)}</span>
        </div>
      </div>`;
    }

    const typeSpecificElement = this.renderTypeSpecificElement(prop);

    return html`
      <div class="schema-item">
        <div class="schema-header">
          <span class="schema-type">${typeName}</span>
          ${prop.name ? html`<span class="schema-name">${prop.name}</span>` : ""}
          ${prop.value !== undefined
            ? html`<span class="schema-value">${String(prop.value)}</span>`
            : ""}
          <span class="${isRequired ? "schema-required" : "schema-optional"}"
            >${isRequired ? "required" : "optional"}</span
          >
        </div>

        ${typeSpecificElement}

        <div class="schema-children">
          ${prop.properties
            ? html`${prop.properties.map((child: any) =>
                this.renderSchemaProperty(child, depth + 1),
              )}`
            : ""}
          ${prop.schema ? html`${this.renderSchemaProperty(prop.schema, depth + 1)}` : ""}
          ${prop.selectors
            ? html`${prop.selectors.map((selector: any) =>
                this.renderSchemaProperty(selector, depth + 1),
              )}`
            : ""}
          ${prop.options && prop.type === "group_select"
            ? html`${prop.options.map(
                (option: any) => html`
                  <div class="schema-item">
                    <div class="schema-header">
                      <span class="schema-type">option</span>
                      <span class="schema-name">${option.value}</span>
                      <span class="schema-value">${option.description || ""}</span>
                    </div>
                    ${option.schema
                      ? html`
                          <div class="schema-children">
                            ${option.schema.map((schemaItem: any) =>
                              this.renderSchemaProperty(schemaItem, depth + 1),
                            )}
                          </div>
                        `
                      : ""}
                  </div>
                `,
              )}`
            : ""}
        </div>
      </div>
    `;
  }

  // Render the UI as a function of component state
  render() {
    return html`
      <p>Hello, ${this.name}!</p>

      ${this.schema
        ? html`<div class="schema-container">
            <h3>Schema Hierarchy</h3>
            ${this.renderSchemaProperty(this.schema)}
          </div>`
        : html`<p>Loading schema...</p>`}
    `;
  }
}
