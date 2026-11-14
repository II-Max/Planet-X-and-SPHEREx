/**
 * frontend/js/components/NEOSSatModal.js
 * CSA NEOSSat optical tracking strip modal drawer.
 */

import { AppState } from "../core/AppState.js";

export class NEOSSatModal {
  constructor(modalElement, canvasElement) {
    this.modal = modalElement;
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext("2d");
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById("btnQueryNEOSSat").addEventListener("click", () => {
      this.open();
    });
    document.getElementById("btnCloseModal").addEventListener("click", () => {
      this.close();
    });
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.close();
    });
  }

  open() {
    this.modal.classList.add("open");
    this.renderTrackingStrip();
  }

  close() {
    this.modal.classList.remove("open");
  }

  renderTrackingStrip() {
    const ctx = this.ctx;
    const w = this.canvas.width = 460;
    const h = this.canvas.height = 220;
    const target = AppState.get("selectedTarget");

    ctx.fillStyle = "#020306";
    ctx.fillRect(0, 0, w, h);

    // Optical background stars
    let s = 9921;
    const rand = () => {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    for (let i = 0; i < 45; i++) {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.arc(10 + rand() * (w - 20), 10 + rand() * (h - 20), 0.8 + rand() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (target && target.type === "asteroid") {
      const startX = 140, startY = 160;
      const endX = 320, endY = 60;

      ctx.strokeStyle = "#ff4d6d";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      [0.0, 0.5, 1.0].forEach((f, idx) => {
        const px = startX + (endX - startX) * f;
        const py = startY + (endY - startY) * f;
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(px, py, 3.5, 0, Math.PI * 2); ctx.fill();

        ctx.strokeStyle = "#00f0ff";
        ctx.strokeRect(px - 7, py - 7, 14, 14);

        ctx.font = "9px 'JetBrains Mono'";
        ctx.fillStyle = "#00f0ff";
        ctx.fillText(`T+${idx * 56}s`, px + 10, py - 4);
      });

      document.getElementById("neoTargID").textContent = "NEOSSat-2025-XP4";
      document.getElementById("neoOrbitClass").textContent = "Apollo Near-Earth";
      document.getElementById("neoSpeed").textContent = "18.4″/hr";
      document.getElementById("neoMag").textContent = "17.8 V";
    } else {
      ctx.font = "11px 'JetBrains Mono'";
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.textAlign = "center";
      ctx.fillText("NO OPTICAL STREAK DETECTED (POINT SOURCE STANDARD)", w / 2, h / 2);

      document.getElementById("neoTargID").textContent = target ? target.name : "N/A";
      document.getElementById("neoOrbitClass").textContent = "Non-Solar System";
      document.getElementById("neoSpeed").textContent = "0.0″/hr";
      document.getElementById("neoMag").textContent = "N/A (V > 21)";
    }
  }
}

