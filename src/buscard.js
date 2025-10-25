import { html, LitElement } from "lit";
import { styles, timeIcon } from "./buscard.styles.js";

export class BustijdenCard extends LitElement {
  static styles = styles;

  static get properties() {
    return {
      stops: { type: Array, state: true },
      entity: { type: String },
      _hass: { type: Object },
      valid_entity: { type: Boolean, state: true },
      stop_name: { type: String, state: true },
      available: { type: Boolean, state: true },
      lastUpdated: { type: String, state: true },
    };
  }

  constructor() {
    super();
    this.stops = [];
    this.available = false;
    this.valid_entity = false;
  }

  static getStubConfig(hass) {
    const firstSensor = Object.keys(hass.entities).find((entityId) =>
      entityId.startsWith("sensor.bus_stop_")
    );
    return {
      entity: firstSensor || "",
    };
  }

  setConfig(config) {
    this.entity = config.entity;
  }

  set hass(hass) {
    this._hass = hass;
    // Validate entity
    this.valid_entity = this.entity.includes("bus_stop_");
    if (!this.valid_entity) {
      return;
    }
    // Get state attributes
    const state = hass["states"]?.[this.entity];
    if (!state) {
      return;
    }
    this.stop_name = state["attributes"]["friendly_name"];
    this.stops = state["attributes"]["stops"];
    this.lastUpdated = state["last_updated"];

    // Check availability
    this.available = state["state"] != "unavailable";
  }

  static getConfigForm() {
    return {
      schema: [
        {
          name: "entity",
          required: true,
          selector: { entity: { domain: "sensor" } },
        },
      ],
    };
  }

  stripTime(timeString) {
    return timeString.split(":").slice(0, 2).join(":");
  }

  render() {
    if (!this.valid_entity) {
      return html`<div>
        Ongeldige entity. Zorg ervoor dat je een sensor met het juiste formaat
        gebruikt.
      </div>`;
    }

    if (this.available === false) {
      return html`<div>
        Geen busgegevens beschikbaar. Controleer je internetverbinding.
      </div>`;
    }

    if (!this.stop_name) {
      return html`<div>
        Halte naam niet beschikbaar. Controleer of de haltecode goed in je
        configuratie staat.
      </div>`;
    }

    if (this.stop_name.endsWith("None")) {
      return html`<div>
        Deze halte is niet gevonden. Controleer of de haltecode goed in je
        configuratie staat.
      </div>`;
    }
    if (!this.stops || this.stops.length === 0) {
      return html`<div>
        Er zijn momenteel geen aankomende bussen voor deze halte.
      </div>`;
    }
    return html`
      <div>
        ${this.stops.map((stop) => {
          let className = "bus-card";
          if (stop.canceled) {
            className += " canceled";
          } else if (stop.delayInSeconds > 0) {
            className += " changed";
          }
          return html`
            <div class="${className}">
              <div class="bus-card-head">
                <span class="line-number">${stop.routeShortName}</span>

                <div class="bus-card-details">
                  <span class="bus-time"
                    >${this.stripTime(stop.arrivalTime)}</span
                  >
                  <span class="bus-time-changed"
                    >${this.stripTime(stop.calculatedArrivalTime)}</span
                  >
                  <span class="bus-time-canceled">Geannuleerd</span>
                  <span class="stop-text">${stop.tripHeadsign}</span>
                  <div class="bus-card-details-time">
                    <span class="bus-direction">${stop.routeLongName}</span>
                  </div>
                </div>
                <span class="live-time">${stop.minutesUntil} min</span>
                ${timeIcon}
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }
}
