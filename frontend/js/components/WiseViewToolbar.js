/**
 * frontend/js/components/WiseViewToolbar.js
 * Epoch blink comparator controls, rate adjust, and rendering mode toggles.
 */

import { AppState } from "../core/AppState.js";

export class WiseViewToolbar {
  constructor(renderer) {
    this.renderer = renderer;
    this.blinkTimer = null;
    this.bindControls();
    this.startBlinkLoop();
  }

  bindControls() {
    const btnPlay = document.getElementById("btnPlayPause");
    btnPlay.addEventListener("click", () => {
      const isPlaying = !AppState.get("isPlaying");
      AppState.set("isPlaying", isPlaying);
      btnPlay.textContent = isPlaying ? "❚❚" : "▶";
    });

    document.getElementById("btnStepPrev").addEventListener("click", () => {
      AppState.set("isPlaying", false);
      btnPlay.textContent = "▶";
      const cur = AppState.get("epoch");
      AppState.set("epoch", (cur + 2) % 3);
      this.renderer.draw();
    });

    document.getElementById("btnStepNext").addEventListener("click", () => {
      AppState.set("isPlaying", false);
      btnPlay.textContent = "▶";
      const cur = AppState.get("epoch");
      AppState.set("epoch", (cur + 1) % 3);
      this.renderer.draw();
    });

    document.querySelectorAll(".epoch-btn[data-epoch]").forEach(b => {
      b.addEventListener("click", () => {
        AppState.set("isPlaying", false);
        btnPlay.textContent = "▶";
        AppState.set("epoch", parseInt(b.dataset.epoch));
        this.syncEpochUI();
        this.renderer.draw();
      });
    });

    const rateSlider = document.getElementById("blinkRateSlider");
    rateSlider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      AppState.set("blinkRate", val);
      document.getElementById("blinkRateVal").textContent = val.toFixed(1) + " Hz";
      this.startBlinkLoop();
    });

    document.querySelectorAll(".mode-toggle").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".mode-toggle").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        AppState.set("renderMode", btn.dataset.mode);
        this.renderer.draw();
      });
    });

    document.getElementById("contrastSlider").addEventListener("input", (e) => {
      AppState.set("contrast", parseFloat(e.target.value));
      this.renderer.draw();
    });

    document.getElementById("btnZScale").addEventListener("click", () => {
      AppState.set("contrast", 1.45);
      document.getElementById("contrastSlider").value = 1.45;
      this.renderer.draw();
    });
  }

  startBlinkLoop() {
    if (this.blinkTimer) clearInterval(this.blinkTimer);
    this.blinkTimer = setInterval(() => {
      if (!AppState.get("isPlaying")) return;
      const nextEpoch = (AppState.get("epoch") + 1) % 3;
      AppState.set("epoch", nextEpoch);
      this.syncEpochUI();
      this.renderer.draw();
    }, 1000 / AppState.get("blinkRate"));
  }

  syncEpochUI() {
    const cur = AppState.get("epoch");
    document.querySelectorAll(".epoch-btn[data-epoch]").forEach(b => {
      b.classList.toggle("active", parseInt(b.dataset.epoch) === cur);
    });
  }
}

