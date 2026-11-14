/**
 * frontend/js/components/SpectrumChart.js
 * 102-Band SPHEREx calibrated flux spectrum plotter with molecular diagnostics.
 */

import { CONFIG, bandToWavelength } from "../config.js";
import { AppState } from "../core/AppState.js";

export class SpectrumChart {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.initCanvasSize();
    window.addEventListener("resize", () => this.initCanvasSize());
  }

  initCanvasSize() {
    const dpr = window.devicePixelRatio || 1;
    const parent = this.canvas.parentElement;
    this.w = parent.clientWidth;
    this.h = parent.clientHeight;
    this.canvas.width = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.canvas.style.width = this.w + "px";
    this.canvas.style.height = this.h + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    const w = this.w, h = this.h;
    const target = AppState.get("selectedTarget");
    const activeBand = AppState.get("selectedBand");

    ctx.clearRect(0, 0, w, h);

    const padL = 45, padR = 15, padT = 15, padB = 25;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    // Grid lines & wavelength tick marks
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (plotH / 4) * i;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
    }
    for (let wl = 1.0; wl <= 5.0; wl += 0.5) {
      const x = padL + ((wl - CONFIG.LAMBDA_MIN) / (CONFIG.LAMBDA_MAX - CONFIG.LAMBDA_MIN)) * plotW;
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "9px 'JetBrains Mono'";
      ctx.textAlign = "center";
      ctx.fillText(wl.toFixed(1) + "μm", x, h - 8);
    }

    // Molecular Highlights
    const highlights = [
      { wl: 3.30, label: "CH₄ Trough", color: "rgba(255, 51, 102, 0.2)" },
      { wl: 4.26, label: "CO₂ Line", color: "rgba(0, 245, 155, 0.2)" },
      { wl: 4.80, label: "Thermal Slope", color: "rgba(255, 183, 3, 0.2)" },
      { wl: 2.70, label: "H₂O Ice", color: "rgba(0, 229, 255, 0.15)" }
    ];
    for (const hl of highlights) {
      const hx = padL + ((hl.wl - CONFIG.LAMBDA_MIN) / (CONFIG.LAMBDA_MAX - CONFIG.LAMBDA_MIN)) * plotW;
      ctx.fillStyle = hl.color;
      ctx.fillRect(hx - 8, padT, 16, plotH);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "8px 'JetBrains Mono'";
      ctx.textAlign = "center";
      ctx.fillText(hl.label, hx, padT + 10);
    }

    // Target Spectrum Curve
    if (target && target.spectrum) {
      const spec = target.spectrum;
      ctx.beginPath();
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 1.8;
      for (let i = 0; i < CONFIG.NUM_BANDS; i++) {
        const x = padL + (i / (CONFIG.NUM_BANDS - 1)) * plotW;
        const y = padT + plotH - (spec[i] * plotH * 0.85);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.lineTo(padL + plotW, padT + plotH);
      ctx.lineTo(padL, padT + plotH);
      ctx.fillStyle = "rgba(0, 240, 255, 0.08)";
      ctx.fill();
    }

    // Active Selected Band Indicator
    if (activeBand > 0) {
      const curWl = bandToWavelength(activeBand - 1);
      const bx = padL + ((curWl - CONFIG.LAMBDA_MIN) / (CONFIG.LAMBDA_MAX - CONFIG.LAMBDA_MIN)) * plotW;
      ctx.strokeStyle = "#ffb703";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(bx, padT); ctx.lineTo(bx, padT + plotH); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#ffb703";
      ctx.font = "9px 'JetBrains Mono'";
      ctx.textAlign = "center";
      ctx.fillText(`Band ${activeBand}`, bx, padT + 22);
    }
  }
}

