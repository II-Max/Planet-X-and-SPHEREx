/**
 * frontend/js/core/SkyRenderer.js
 * High-performance astronomical canvas renderer.
 * Supports: Normal composite, Red/Cyan dipole, Difference |E2-E1|, and Invert.
 */

import { AppState } from "./AppState.js";

export class SkyRenderer {
  constructor(canvas, stars, targets) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { willReadFrequently: true });
    this.stars = stars;
    this.targets = targets;

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
    const mode = AppState.get("renderMode");
    const zoom = AppState.get("zoom");
    const panX = AppState.get("panX");
    const panY = AppState.get("panY");
    const epoch = AppState.get("epoch");
    const band = AppState.get("selectedBand");
    const contrast = AppState.get("contrast");
    const maskGaia = AppState.get("gaiaMaskActive");

    ctx.save();
    ctx.fillStyle = mode === "invert" ? "#f2f4f8" : "#020408";
    ctx.fillRect(0, 0, w, h);

    // Apply viewport camera
    ctx.translate(w / 2 + panX, h / 2 + panY);
    ctx.scale(zoom, zoom);
    ctx.translate(-256, -256);

    if (mode === "dipole") {
      this._renderDipole(ctx, maskGaia);
    } else if (mode === "diff") {
      this._renderDifference(ctx);
    } else {
      this._renderStandard(ctx, epoch, band, contrast, mode === "invert", maskGaia);
    }

    if (AppState.get("gaiaVectorsActive")) {
      this._renderGaiaOverlay(ctx, epoch);
    }

    this._renderReticle(ctx, epoch);

    ctx.restore();
  }

  _renderStandard(ctx, epoch, band, contrast, isInvert, maskGaia) {
    // 1. Static field stars
    for (const s of this.stars) {
      ctx.globalAlpha = maskGaia && s.isGaia ? 0.12 : 1.0;
      let flux = s.mag * (band > 0 ? (s.spectrum[band - 1] || 0.2) : 1.0) * contrast;
      const r = Math.max(0.7, s.radius * Math.min(2.0, flux * 1.5));

      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isInvert ? `rgba(15,20,30,${Math.min(1, flux * 1.5)})` : `rgba(235,245,255,${Math.min(1, flux * 1.4)})`;
      ctx.fill();

      if (r > 2.0) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 2.4, 0, Math.PI * 2);
        ctx.fillStyle = isInvert ? "rgba(40,50,80,0.12)" : "rgba(100,160,255,0.15)";
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1.0;

    // 2. Moving discovery targets
    for (const t of this.targets) {
      const curX = t.baseX + t.dxEpoch * epoch;
      const curY = t.baseY + t.dyEpoch * epoch;
      let flux = (band > 0 ? (t.spectrum[band - 1] || 0.1) * 1.8 : 1.0) * contrast;

      if (t.isDiffuse) {
        const comaR = t.radius * 2.2 * flux;
        const grd = ctx.createRadialGradient(curX, curY, 0, curX, curY, comaR);
        grd.addColorStop(0, isInvert ? "rgba(0,100,60,0.8)" : "rgba(0,245,155,0.7)");
        grd.addColorStop(0.5, isInvert ? "rgba(0,100,60,0.25)" : "rgba(0,245,155,0.2)");
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(curX, curY, comaR, 0, Math.PI * 2);
        ctx.fill();
      }

      const r = Math.max(1.2, t.radius * Math.min(2.5, flux));
      ctx.beginPath();
      ctx.arc(curX, curY, r, 0, Math.PI * 2);
      ctx.fillStyle = isInvert ? "#080c14" : "#ffffff";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(curX, curY, r * 2.0, 0, Math.PI * 2);
      if (t.type === "browndwarf") ctx.fillStyle = isInvert ? "rgba(180,0,50,0.2)" : "rgba(255,51,102,0.35)";
      else if (t.type === "asteroid") ctx.fillStyle = isInvert ? "rgba(180,100,0,0.2)" : "rgba(255,183,3,0.35)";
      else if (t.type === "comet") ctx.fillStyle = isInvert ? "rgba(0,150,80,0.2)" : "rgba(0,245,155,0.35)";
      else ctx.fillStyle = "rgba(70,140,255,0.3)";
      ctx.fill();
    }
  }

  _renderDipole(ctx, maskGaia) {
    for (const s of this.stars) {
      ctx.globalAlpha = maskGaia && s.isGaia ? 0.15 : 1.0;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius * 1.1, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    for (const t of this.targets) {
      ctx.beginPath();
      ctx.arc(t.baseX, t.baseY, t.radius * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,30,80,0.95)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(t.baseX + t.dxEpoch, t.baseY + t.dyEpoch, t.radius * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,240,255,0.95)";
      ctx.fill();
    }
  }

  _renderDifference(ctx) {
    ctx.fillStyle = "#020306";
    ctx.fillRect(0, 0, 512, 512);

    for (const t of this.targets) {
      ctx.beginPath();
      ctx.arc(t.baseX, t.baseY, t.radius * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(30,60,140,0.85)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(t.baseX + t.dxEpoch, t.baseY + t.dyEpoch, t.radius * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,255,150,0.95)";
      ctx.fill();
    }
  }

  _renderGaiaOverlay(ctx, epoch) {
    for (const s of this.stars) {
      if (!s.isGaia) continue;
      ctx.strokeStyle = "rgba(0,240,255,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius + 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    const star = this.targets.find(t => t.id === "GAIA-DR3-4108");
    if (star) {
      const curX = star.baseX + star.dxEpoch * epoch;
      const curY = star.baseY + star.dyEpoch * epoch;
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(curX - 8, curY - 8, 16, 16);

      const angle = Math.atan2(star.dyEpoch, star.dxEpoch);
      const toX = curX + Math.cos(angle) * 24;
      const toY = curY + Math.sin(angle) * 24;

      ctx.beginPath();
      ctx.moveTo(curX, curY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      ctx.font = "9px 'JetBrains Mono'";
      ctx.fillStyle = "#00f0ff";
      ctx.fillText("Gaia DR3 (776 mas/yr)", curX + 12, curY - 4);
    }
  }

  _renderReticle(ctx, epoch) {
    const t = AppState.get("selectedTarget");
    if (!t) return;
    const curX = t.baseX + t.dxEpoch * epoch;
    const curY = t.baseY + t.dyEpoch * epoch;

    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(curX, curY, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

