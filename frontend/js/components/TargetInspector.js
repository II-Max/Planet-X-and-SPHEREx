/**
 * frontend/js/components/TargetInspector.js
 * Target telemetry inspection card & citizen science consensus voting panel.
 */

import { AppState } from "../core/AppState.js";
import { ApiClient } from "../services/ApiClient.js";

export class TargetInspector {
  constructor(renderer, spectrumChart) {
    this.renderer = renderer;
    this.spectrumChart = spectrumChart;
    this.bindEvents();
    AppState.subscribe("selectedTarget", (t) => this.renderTarget(t));
  }

  bindEvents() {
    document.querySelectorAll(".btn-vote").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".btn-vote").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const target = AppState.get("selectedTarget");
        if (target) {
          ApiClient.submitVote(target.id, btn.dataset.vote);
        }
        this.showToast(`Logged Citizen Science Classification: ${btn.textContent}`);
      });
    });

    document.getElementById("btnToggleGaiaVectors").addEventListener("click", (e) => {
      const active = !AppState.get("gaiaVectorsActive");
      AppState.set("gaiaVectorsActive", active);
      e.currentTarget.classList.toggle("active", active);
      this.renderer.draw();
    });

    document.getElementById("btnToggleGaiaMask").addEventListener("click", (e) => {
      const active = !AppState.get("gaiaMaskActive");
      AppState.set("gaiaMaskActive", active);
      e.currentTarget.classList.toggle("active", active);
      this.showToast(active ? "Masking Gaia Stars — Infrared Movers Isolated!" : "Gaia Star Mask Removed");
      this.renderer.draw();
    });
  }

  renderTarget(t) {
    if (!t) return;
    const card = document.getElementById("targetCard");
    card.className = `target-summary-card type-${t.type}`;

    document.getElementById("targName").textContent = t.name;
    document.getElementById("targBadge").textContent = t.typeLabel;
    document.getElementById("targBadge").className = `target-badge ${t.type}`;
    document.getElementById("targPM").textContent = t.pmTotal;
    document.getElementById("targTemp").textContent = t.tempEst;

    // Molecular Indicators
    const spec = t.spectrum;
    const ch4Flux = spec ? spec[60].toFixed(2) : "0.00";
    const co2Flux = spec ? spec[83].toFixed(2) : "0.00";
    const thermFlux = spec ? spec[97].toFixed(2) : "0.00";

    document.getElementById("diagCH4").textContent = `${ch4Flux} μJy (${t.type === 'browndwarf' ? 'DEEP ABSORPTION' : 'NORMAL'})`;
    document.getElementById("diagCO2").textContent = `${co2Flux} μJy (${t.type === 'comet' ? 'STRONG EMISSION' : 'FLAT'})`;
    document.getElementById("diagThermal").textContent = `${thermFlux} μJy (${t.type === 'asteroid' ? 'THERMAL EXCESS' : 'COOL'})`;

    // Gaia DR3 Status Box
    const gaiaPill = document.getElementById("gaiaMatchPill");
    const gaiaDesc = document.getElementById("gaiaMatchDesc");
    if (t.gaiaMatch) {
      gaiaPill.className = "status-pill matched";
      gaiaPill.textContent = `MATCHED: GAIA DR3 ${t.gaiaMatch.sourceId}`;
      gaiaDesc.textContent = `Known optical star. G=${t.gaiaMatch.gMag}, Parallax=${t.gaiaMatch.parallax}, μ=(${t.gaiaMatch.pmRA}, ${t.gaiaMatch.pmDec}). Flagged as known stellar background.`;
      document.getElementById("targGaiaQuick").textContent = "Cataloged Star";
    } else {
      gaiaPill.className = "status-pill unmatched";
      gaiaPill.textContent = "UNMATCHED IN GAIA DR3";
      gaiaDesc.textContent = t.desc;
      document.getElementById("targGaiaQuick").textContent = "No Optical Match (Discovery!)";
    }

    this.spectrumChart.draw();
    this.renderer.draw();
  }

  showToast(msg) {
    const t = document.getElementById("toastNotice");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2600);
  }
}

