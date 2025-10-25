import { BustijdenCard } from "./buscard";

customElements.define("bustijden-card", BustijdenCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "bustijden-card",
  name: "Bustijden Card",
  description: "Shows upcoming bus departures",
});
