/**
 * frontend/js/main.js
 * Application bootstrap, event wiring, and lifecycle manager.
 */

import { CONFIG, bandToWavelength } from "./config.js";
import { AppState } from "./core/AppState.js";
import { SkyRenderer } from "./core/SkyRenderer.js";
import { WiseViewToolbar } from "./components/WiseViewToolbar.js";
import { SpectrumChart } from "./components/SpectrumChart.js";
import { NEOSSatModal } from "./components/NEOSSatModal.js";
import { TargetInspector } from "./components/TargetInspector.js";
import { getDiscoveryTargets, generateStarfield } from "./services/MockDataService.js";

window.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Datasets
  const targets = getDiscoveryTargets();
  const stars = generateStarfield(350);

  // 2. Initialize Core Renderers
  const skyCanvas = document.getElementById("skyCanvas");
  const renderer = new SkyRenderer(skyCanvas, stars, targets);

  const specCanvas = document.getElementById("spectrumChart");
  const spectrumChart = new SpectrumChart(specCanvas);

  // 3. Initialize Interactive Components
  const toolbar = new WiseViewToolbar(renderer);
  const inspector = new TargetInspector(renderer, spectrumChart);
  const neossatModal = new NEOSSatModal(
    document.getElementById("neossatModal"),
    document.getElementById("neossatCanvas")
  );

  // Set Initial Target (Brown Dwarf)
  AppState.set("selectedTarget", targets[0]);

  // 4. Band Slider & Preset Buttons
  const bandSlider = document.getElementById("bandSlider");
  bandSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    AppState.set("selectedBand", val);
    if (val === 0) {
      document.getElementById("bandNumberLabel").textContent = "ALL";
      document.getElementById("currentWavelength").textContent = "λ = All Bands";
      document.getElementById("hudBandName").textContent = "RGB Full Composite";
    } else {
      const wl = bandToWavelength(val - 1);
      document.getElementById("bandNumberLabel").textContent = val;
      document.getElementById("currentWavelength").textContent = `λ = ${wl.toFixed(2)} μm`;
      document.getElementById("hudBandName").textContent = `SPHEREx Band ${val} (${wl.toFixed(2)}μm)`;
    }
    renderer.draw();
    spectrumChart.draw();
  });

  document.querySelectorAll(".preset-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const p = btn.dataset.preset;
      if (p === "all") bandSlider.value = 0;
      else if (p === "methane") bandSlider.value = 60;
      else if (p === "comet") bandSlider.value = 83;
      else if (p === "thermal") bandSlider.value = 97;
      bandSlider.dispatchEvent(new Event("input"));
    });
  });

  // 5. Canvas Pan & Zoom Events
  let isPanning = false;
  let lastMouse = { x: 0, y: 0 };

  skyCanvas.addEventListener("mousedown", (e) => {
    isPanning = true;
    lastMouse = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener("mousemove", (e) => {
    if (!isPanning) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    AppState.set("panX", AppState.get("panX") + dx);
    AppState.set("panY", AppState.get("panY") + dy);
    lastMouse = { x: e.clientX, y: e.clientY };
    renderer.draw();
  });

  window.addEventListener("mouseup", () => { isPanning = false; });

  skyCanvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    const curZoom = AppState.get("zoom");
    AppState.set("zoom", Math.max(0.6, Math.min(6.0, curZoom * factor)));
    renderer.draw();
  }, { passive: false });

  // 6. Canvas Target Selection by Proximity
  skyCanvas.addEventListener("click", (e) => {
    const rect = skyCanvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const zoom = AppState.get("zoom");
    const panX = AppState.get("panX");
    const panY = AppState.get("panY");
    const epoch = AppState.get("epoch");

    const worldX = (clickX - (renderer.w / 2 + panX)) / zoom + 256;
    const worldY = (clickY - (renderer.h / 2 + panY)) / zoom + 256;

    let nearest = null;
    let minDist = 24;
    for (const t of targets) {
      const curX = t.baseX + t.dxEpoch * epoch;
      const curY = t.baseY + t.dyEpoch * epoch;
      const d = Math.hypot(worldX - curX, worldY - curY);
      if (d < minDist) {
        minDist = d;
        nearest = t;
      }
    }
    if (nearest) {
      AppState.set("selectedTarget", nearest);
    }
  });

  // 7. Reset View & Export
  document.getElementById("btnResetView").addEventListener("click", () => {
    AppState.set("zoom", 1.0);
    AppState.set("panX", 0);
    AppState.set("panY", 0);
    renderer.draw();
    inspector.showToast("Centered Field of View");
  });

  document.getElementById("btnExportCatalog").addEventListener("click", () => {
    const data = {
      mission: "NASA SPHEREx / CSA NEOSSat / ESA Gaia DR3",
      field: CONFIG.FIELD_CENTER.name,
      pixel_scale_arcsec: CONFIG.PIXEL_SCALE,
      bands: CONFIG.NUM_BANDS,
      targets: targets.map(t => ({
        name: t.name,
        type: t.type,
        pm: t.pmTotal,
        gaia_match: t.gaiaMatch ? t.gaiaMatch.sourceId : null
      }))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SPHEREx_ChronoSpectra_Catalog.json";
    a.click();
    URL.revokeObjectURL(url);
    inspector.showToast("Catalog Downloaded: SPHEREx_ChronoSpectra_Catalog.json");
  });

  // 8. Keyboard Shortcuts
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      document.getElementById("btnPlayPause").click();
    } else if (e.code === "ArrowLeft") {
      document.getElementById("btnStepPrev").click();
    } else if (e.code === "ArrowRight") {
      document.getElementById("btnStepNext").click();
    }
  });
});

