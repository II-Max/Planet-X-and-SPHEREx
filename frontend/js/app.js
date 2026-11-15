/**
 * frontend/js/app.js
 * SPHEREx Explorer — Giao diện Khám Phá Vũ Trụ Dành Cho Người Phổ Thông
 * Phong cách Dark Mode Design - Gray | Tinh giản, Dễ hiểu, Tương tác 1-chạm
 */

// ── 1. Cấu hình & Dữ liệu Thiên văn Mặc định (Đảm bảo không bao giờ trắng trang) ──
const CONFIG = {
  DEFAULT_RTDB_URL: "https://aboutme-iimax-default-rtdb.asia-southeast1.firebasedatabase.app",
  LAMBDA_MIN: 0.75,
  LAMBDA_MAX: 5.00
};

function bandToWavelength(b) {
  return CONFIG.LAMBDA_MIN + (b / 101) * (CONFIG.LAMBDA_MAX - CONFIG.LAMBDA_MIN);
}

// Bộ tạo dữ liệu phổ SED trực quan
function createSimplifiedSED(type) {
  const points = [];
  for (let i = 0; i < 102; i++) {
    const wl = bandToWavelength(i);
    let val = 0.2;
    if (type === "browndwarf") {
      const base = 0.55 * Math.exp(-0.5 * Math.pow((wl - 1.25) / 0.3, 2)) + 0.35 * Math.exp(-0.5 * Math.pow((wl - 4.6) / 0.5, 2));
      const ch4 = 0.85 * Math.exp(-0.5 * Math.pow((wl - 3.3) / 0.2, 2));
      val = Math.max(0.04, base - ch4);
    } else if (type === "asteroid") {
      val = 0.15 + 0.02 * (wl - 0.75) + 0.95 / (1.0 + Math.exp(-(wl - 3.8) * 3));
    } else if (type === "comet") {
      val = 0.22 + 0.05 * wl + 1.15 * Math.exp(-0.5 * Math.pow((wl - 4.26) / 0.15, 2));
    } else {
      val = 0.08 + 0.04 * (wl - 0.75);
    }
    points.push(parseFloat(val.toFixed(4)));
  }
  return points;
}

// 4 Thiên thể khám phá tiêu biểu được diễn giải bằng tiếng Việt dễ hiểu
const DEFAULT_TARGETS = [
  {
    id: "SPX-J0600",
    name: "Sao Lùn Nâu Siêu Lạnh (Y0 Dwarf)",
    category: "browndwarf",
    category_label: "Sao Lùn Nâu",
    color: "#a855f7",
    ra: "06h 00m 14s",
    dec: "-66° 34′ 12″",
    speed_label: "0.71\" / 6 tháng (1,420 mas/năm)",
    temp_label: "~420 K (~147°C · Siêu Lạnh)",
    explanation: "Một 'ngôi sao thất bại' có khối lượng quá nhỏ để duy trì phản ứng nhiệt hạch. Nó hoàn toàn vô hình trên các kính quang học thông thường (như Gaia DR3), nhưng phát sáng ấm áp trong dải cận hồng ngoại của SPHEREx với hố hấp thụ khí Mê-tan (CH₄) đặc trưng.",
    spectrum_note: "Đồ thị phổ lõm sâu tại bước sóng 3.3 μm do khí Mê-tan (CH₄) trong bầu khí quyển sao lùn nâu hấp thụ ánh sáng.",
    positions: [
      { epoch: 0, x: 190, y: 240 },
      { epoch: 1, x: 204, y: 248 },
      { epoch: 2, x: 218, y: 256 }
    ],
    sed: createSimplifiedSED("browndwarf")
  },
  {
    id: "NEO-2025",
    name: "Tiểu Hành Tinh Gần Trái Đất (Apollo)",
    category: "asteroid",
    category_label: "Tiểu Hành Tinh",
    color: "#f59e0b",
    ra: "06h 00m 48s",
    dec: "-66° 31′ 05″",
    speed_label: "9.20\" / 6 tháng (18.4\" / giờ)",
    temp_label: "~295 K (~22°C · Đá ấm)",
    explanation: "Một khối đá vũ trụ đang bay nhanh qua Hệ Mặt Trời. Vì bay gần Trái Đất, nó dịch chuyển một khoảng rất xa giữa 2 lần chụp. Kính viễn vọng vệ tinh NEOSSat đã bắt được vệt quang học xác nhận quỹ đạo an toàn.",
    spectrum_note: "Đồ thị phổ tăng vọt ở bước sóng dài > 4.0 μm do bề mặt đá tiểu hành tinh được Mặt Trời sưởi ấm và phát ra bức xạ nhiệt.",
    positions: [
      { epoch: 0, x: 310, y: 140 },
      { epoch: 1, x: 338, y: 178 },
      { epoch: 2, x: 366, y: 216 }
    ],
    has_neossat: true,
    sed: createSimplifiedSED("asteroid")
  },
  {
    id: "C-2025-S1",
    name: "Sao Chổi Đám Mây Oort",
    category: "comet",
    category_label: "Sao Chổi",
    color: "#10b981",
    ra: "05h 59m 33s",
    dec: "-66° 37′ 50″",
    speed_label: "2.05\" / 6 tháng",
    temp_label: "~180 K (-93°C)",
    explanation: "Khối băng bụi khổng lồ bay vào từ Đám mây Oort ở rìa Hệ Mặt Trời. Khi lại gần Mặt Trời, nhiệt lượng làm thăng hoa băng carbonic, tạo nên quầng khí mờ ảo (coma) với vạch phát xạ khí CO₂ rực rỡ.",
    spectrum_note: "Đỉnh nhọn nổi bật tại bước sóng 4.26 μm là dấu hiệu thăng hoa của khí Carbonic (CO₂) và khí CO trong đầu sao chổi.",
    positions: [
      { epoch: 0, x: 120, y: 380 },
      { epoch: 1, x: 134, y: 372 },
      { epoch: 2, x: 148, y: 364 }
    ],
    sed: createSimplifiedSED("comet")
  },
  {
    id: "TNO-2025",
    name: "Thiên Thể Vành Đai Kuiper (TNO)",
    category: "tno",
    category_label: "Vành Đai Ngoài",
    color: "#06b6d4",
    ra: "06h 00m 52s",
    dec: "-66° 39′ 18″",
    speed_label: "0.34\" / 6 tháng (Rất chậm)",
    temp_label: "~45 K (-228°C · Băng giá)",
    explanation: "Thiên thể nằm ở khoảng cách cực xa ngoài quỹ đạo Sao Hải Vương (> 42 AU). Do khoảng cách quá lớn, chuyển động thị sai của nó rất nhỏ và bề mặt phản xạ ánh sáng rất mờ nhạt.",
    spectrum_note: "Đường phổ tương đối phẳng và thông lượng thấp, phản ánh bề mặt đóng băng lạnh giá của vùng rìa Hệ Mặt Trời.",
    positions: [
      { epoch: 0, x: 420, y: 410 },
      { epoch: 1, x: 425, y: 413 },
      { epoch: 2, x: 430, y: 416 }
    ],
    sed: createSimplifiedSED("tno")
  }
];

// Sinh danh sách sao nền tĩnh
function generateBackgroundStars(count = 320) {
  const stars = [];
  let s = 12345;
  function rnd() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  }
  for (let i = 0; i < count; i++) {
    stars.push({
      x: 15 + rnd() * 482,
      y: 15 + rnd() * 482,
      brightness: 0.2 + rnd() * 0.8,
      size: 0.8 + rnd() * 1.8
    });
  }
  return stars;
}

// ── 2. Quản Lý Trạng Thái Ứng Dụng (AppState) ──
const AppState = {
  stars: generateBackgroundStars(320),
  targets: DEFAULT_TARGETS,
  selectedTarget: DEFAULT_TARGETS[0],
  epoch: 0, // 0: 2025.0, 1: 2025.5, 2: 2026.0
  isPlaying: false,
  playTimer: null,
  renderMode: "standard", // standard, dipole, diff
  zoom: 1.0,
  panX: 0,
  panY: 0,
  firebaseUrl: localStorage.getItem("spherex_rtdb_url") || CONFIG.DEFAULT_RTDB_URL
};

// ── 3. Trình Vẽ Bầu Trời Canvas (SkyRenderer) ──
class SkyRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.initSize();
    window.addEventListener("resize", () => this.initSize());
  }

  initSize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const dpr = window.devicePixelRatio || 1;
    this.w = parent.clientWidth || 700;
    this.h = parent.clientHeight || 550;
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
    if (!w || !h) return;

    const mode = AppState.renderMode;
    const epoch = AppState.epoch;
    const zoom = AppState.zoom;
    const panX = AppState.panX;
    const panY = AppState.panY;

    ctx.save();
    // Nền xám than chì sâu
    ctx.fillStyle = "#090b0e";
    ctx.fillRect(0, 0, w, h);

    // Di chuyển tâm camera
    ctx.translate(w / 2 + panX, h / 2 + panY);
    ctx.scale(zoom, zoom);
    ctx.translate(-256, -256);

    // Lưới tọa độ xám mờ nhẹ
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    for (let c = 0; c <= 512; c += 64) {
      ctx.beginPath();
      ctx.moveTo(c, 0); ctx.lineTo(c, 512);
      ctx.moveTo(0, c); ctx.lineTo(512, c);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.strokeRect(0, 0, 512, 512);

    if (mode === "dipole") {
      this._drawDipole(ctx);
    } else if (mode === "diff") {
      this._drawDifference(ctx);
    } else {
      this._drawStandard(ctx, epoch);
    }

    // Vẽ vòng khóa tiêu điểm cho vật thể đang chọn
    if (AppState.selectedTarget) {
      this._drawTargetLock(ctx, AppState.selectedTarget, epoch);
    }

    ctx.restore();
  }

  _drawStandard(ctx, epoch) {
    // 1. Sao nền tĩnh đứng yên
    for (const s of AppState.stars) {
      ctx.fillStyle = `rgba(226, 232, 240, ${s.brightness * 0.7})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Các thiên thể di chuyển
    for (const t of AppState.targets) {
      const pos = t.positions[epoch] || t.positions[0];

      // Hào quang màu đại diện
      const grad = ctx.createRadialGradient(pos.x, pos.y, 1, pos.x, pos.y, 14);
      grad.addColorStop(0, t.color);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 14, 0, Math.PI * 2);
      ctx.fill();

      // Tâm điểm sáng trắng
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Đường vết di chuyển 3 thời kỳ (nét đứt thanh lịch)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(t.positions[0].x, t.positions[0].y);
      ctx.lineTo(t.positions[1].x, t.positions[1].y);
      ctx.lineTo(t.positions[2].x, t.positions[2].y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  _drawDipole(ctx) {
    ctx.globalCompositeOperation = "screen";

    // Thời kỳ 1: Màu Đỏ
    ctx.fillStyle = "rgb(239, 68, 68)";
    for (const s of AppState.stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const t of AppState.targets) {
      ctx.beginPath();
      ctx.arc(t.positions[0].x, t.positions[0].y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Thời kỳ 2: Màu Xanh Cyan
    ctx.fillStyle = "rgb(6, 182, 212)";
    for (const s of AppState.stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const t of AppState.targets) {
      ctx.beginPath();
      ctx.arc(t.positions[1].x, t.positions[1].y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over";
  }

  _drawDifference(ctx) {
    // Trừ nền triệt tiêu toàn bộ sao đứng yên, chỉ còn cặp chấm của vật thể bay
    ctx.fillStyle = "#090b0e";
    ctx.fillRect(0, 0, 512, 512);

    for (const t of AppState.targets) {
      const p1 = t.positions[0];
      const p2 = t.positions[1];

      // Đốm âm (thời kỳ 1)
      ctx.fillStyle = "rgba(59, 130, 246, 0.85)";
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Đốm dương (thời kỳ 2)
      ctx.fillStyle = "rgba(245, 158, 11, 0.9)";
      ctx.beginPath();
      ctx.arc(p2.x, p2.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  _drawTargetLock(ctx, targ, epoch) {
    const pos = targ.positions[epoch] || targ.positions[0];
    const r = 16;
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1.5;

    // Vòng tròn tiêu điểm
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.stroke();

    // Dấu thập nhẹ
    ctx.beginPath();
    ctx.moveTo(pos.x - r - 4, pos.y); ctx.lineTo(pos.x - r + 3, pos.y);
    ctx.moveTo(pos.x + r - 3, pos.y); ctx.lineTo(pos.x + r + 4, pos.y);
    ctx.moveTo(pos.x, pos.y - r - 4); ctx.lineTo(pos.x, pos.y - r + 3);
    ctx.moveTo(pos.x, pos.y + r - 3); ctx.lineTo(pos.x, pos.y + r + 4);
    ctx.stroke();

    // Tên nhãn nổi
    ctx.fillStyle = "#ffffff";
    ctx.font = "11px 'Inter', sans-serif";
    ctx.fillText(targ.name.split('(')[0].trim(), pos.x + r + 6, pos.y + 4);
  }
}

// ── 4. Trình Vẽ Đồ Thị Phổ Hồng Ngoại Tinh Giản (SpectrumChart) ──
class SimplifiedSpectrumChart {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.initSize();
    window.addEventListener("resize", () => this.initSize());
  }

  initSize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const dpr = window.devicePixelRatio || 1;
    this.w = parent.clientWidth || 330;
    this.h = parent.clientHeight || 120;
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
    if (!w || !h) return;

    ctx.clearRect(0, 0, w, h);

    const padL = 28, padR = 10, padT = 12, padB = 20;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    // Đường lưới ngang xám mờ
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const y = padT + (plotH / 3) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y); ctx.lineTo(w - padR, y);
      ctx.stroke();
    }

    const xPos = (wl) => padL + ((wl - 0.75) / (5.00 - 0.75)) * plotW;

    // Vùng chú thích phân tử trực quan
    // 1. CH4 Methane (3.3 μm)
    const ch4X = xPos(3.3);
    ctx.fillStyle = "rgba(168, 85, 247, 0.12)";
    ctx.fillRect(ch4X - 12, padT, 24, plotH);

    // 2. CO2 Comet (4.26 μm)
    const co2X = xPos(4.26);
    ctx.fillStyle = "rgba(16, 185, 129, 0.12)";
    ctx.fillRect(co2X - 10, padT, 20, plotH);

    // Vẽ đường cong quang phổ của thiên thể đang chọn
    const targ = AppState.selectedTarget;
    if (targ && targ.sed) {
      const sed = targ.sed;
      const maxVal = Math.max(1.4, ...sed);

      ctx.beginPath();
      for (let i = 0; i < 102; i++) {
        const wl = bandToWavelength(i);
        const x = xPos(wl);
        const y = padT + plotH - (sed[i] / maxVal) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.strokeStyle = targ.color || "#3b82f6";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Nhãn trục bước sóng đơn giản
    ctx.fillStyle = "rgba(156, 163, 175, 0.8)";
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.fillText("0.75μm", padL, h - 4);
    ctx.fillText("3.3μm CH₄", ch4X - 16, padT - 2);
    ctx.fillText("4.26μm CO₂", co2X - 16, padT - 2);
    ctx.fillText("5.0μm", w - padR - 26, h - 4);
  }
}

// ── 5. Cập Nhật Giao Diện Người Dùng (UI Controller) ──
function updateInspector(target) {
  if (!target) return;
  document.getElementById("targName").textContent = target.name;
  document.getElementById("targCoords").textContent = `Tọa độ: RA ${target.ra} · Dec ${target.dec}`;

  const badge = document.getElementById("targBadge");
  badge.textContent = target.category_label || target.category;
  badge.className = `target-badge color-${target.category}`;

  document.getElementById("targExplanation").textContent = target.explanation;
  document.getElementById("targSpeed").textContent = target.speed_label;
  document.getElementById("targTemp").textContent = target.temp_label;
  document.getElementById("spectrumNotes").textContent = target.spectrum_note;

  // Hiển thị nút NEOSSat nếu là tiểu hành tinh
  const neoSec = document.getElementById("neossatSection");
  if (neoSec) {
    neoSec.style.display = target.has_neossat ? "block" : "none";
  }
}

function renderTargetCards(renderer, specChart) {
  const container = document.getElementById("targetList");
  if (!container) return;
  container.innerHTML = "";

  AppState.targets.forEach((t) => {
    const card = document.createElement("div");
    card.className = `target-card ${AppState.selectedTarget?.id === t.id ? 'active' : ''}`;
    card.innerHTML = `
      <div class="target-info-row">
        <span class="target-dot" style="background-color:${t.color};"></span>
        <div>
          <div class="target-title">${t.name.split('(')[0].trim()}</div>
          <div class="target-sub">${t.category_label} · ${t.speed_label.split('(')[0].trim()}</div>
        </div>
      </div>
      <span class="target-badge color-${t.category}">${t.category_label}</span>
    `;

    card.addEventListener("click", () => {
      AppState.selectedTarget = t;
      document.querySelectorAll(".target-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      updateInspector(t);
      renderer.draw();
      specChart.draw();
    });

    container.appendChild(card);
  });
}

// ── 6. Dịch Vụ Đồng Bộ Firebase Realtime Database ──
function initFirebaseSync(onUpdateCallback) {
  const url = AppState.firebaseUrl;
  const statusDot = document.getElementById("firebaseDot");
  const statusText = document.getElementById("firebaseStatusText");

  console.log("[FirebaseSync] Đang lắng nghe Realtime Database:", url);

  if (typeof firebase !== "undefined" && firebase.database) {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp({ databaseURL: url });
      }
      const db = firebase.database();
      db.ref("spherex").on("value", (snapshot) => {
        const val = snapshot.val();
        if (val) {
          console.log("[FirebaseSync] Nhận dữ liệu cập nhật từ Backend:", val);
          if (val.candidates && val.candidates.length) {
            // Chuẩn hóa dữ liệu Firebase sang định dạng giao diện
            AppState.targets = val.candidates.map(c => ({
              id: c.id,
              name: c.name,
              category: c.type || "asteroid",
              category_label: c.type_label || c.type,
              color: c.type === "browndwarf" ? "#a855f7" : (c.type === "comet" ? "#10b981" : (c.type === "tno" ? "#06b6d4" : "#f59e0b")),
              ra: c.ra,
              dec: c.dec,
              speed_label: `${c.speed_arcsec_6mo || 1.2}" / 6 tháng`,
              temp_label: c.est_temp_k ? `~${c.est_temp_k} K` : "—",
              explanation: c.gaia_match?.description || "Thiên thể được phát hiện qua thuật toán trừ ảnh đa thời kỳ SPHEREx.",
              spectrum_note: "Dữ liệu phổ 102 băng năng lượng cập nhật trực tiếp từ Python Pipeline.",
              positions: c.positions || [{x: 200, y: 200}, {x: 210, y: 210}, {x: 220, y: 220}],
              has_neossat: c.type === "asteroid",
              sed: c.sed_102_bands || createSimplifiedSED(c.type)
            }));
            AppState.selectedTarget = AppState.targets[0];
          }
          if (statusDot && statusText) {
            statusDot.className = "status-dot";
            statusText.textContent = "Firebase Trực Tuyến";
          }
          onUpdateCallback();
        }
      }, (err) => {
        console.warn("[FirebaseSync] RTDB listener fallback:", err.message);
        if (statusDot && statusText) {
          statusDot.className = "status-dot demo";
          statusText.textContent = "Chế Độ Độc Lập";
        }
      });
    } catch (e) {
      console.warn("[FirebaseSync] Init failed:", e);
    }
  }
}

// ── 7. Khởi Chạy Ứng Dụng (DOM Ready) ──
window.addEventListener("DOMContentLoaded", () => {
  const skyCanvas = document.getElementById("skyCanvas");
  const renderer = new SkyRenderer(skyCanvas);

  const specCanvas = document.getElementById("spectrumChart");
  const specChart = new SimplifiedSpectrumChart(specCanvas);

  // Khởi tạo hiển thị ban đầu
  renderTargetCards(renderer, specChart);
  updateInspector(AppState.selectedTarget);

  // Kết nối Firebase Realtime Database
  initFirebaseSync(() => {
    renderTargetCards(renderer, specChart);
    updateInspector(AppState.selectedTarget);
    renderer.draw();
    specChart.draw();
  });

  // Điều khiển Phát chuyển động (Blink)
  const btnPlay = document.getElementById("btnPlayPause");
  const playIcon = document.getElementById("playIcon");
  const playText = document.getElementById("playText");
  const epochBtns = document.querySelectorAll(".seg-btn[data-epoch]");

  function setEpoch(idx) {
    AppState.epoch = parseInt(idx);
    epochBtns.forEach(b => b.classList.toggle("active", parseInt(b.dataset.epoch) === AppState.epoch));
    renderer.draw();
  }

  function togglePlay() {
    AppState.isPlaying = !AppState.isPlaying;
    btnPlay.classList.toggle("playing", AppState.isPlaying);
    playIcon.textContent = AppState.isPlaying ? "❚❚" : "▶";
    playText.textContent = AppState.isPlaying ? "Tạm Dừng" : "Phát Chuyển Động";

    if (AppState.isPlaying) {
      AppState.playTimer = setInterval(() => {
        setEpoch((AppState.epoch + 1) % 3);
      }, 450); // Nháy 2.2 Hz mượt mà
    } else {
      clearInterval(AppState.playTimer);
      AppState.playTimer = null;
    }
  }

  btnPlay.addEventListener("click", togglePlay);

  epochBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      if (AppState.isPlaying) togglePlay();
      setEpoch(btn.dataset.epoch);
    });
  });

  // Bấm phím Space để tạm dừng / phát chuyển động
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && e.target.tagName !== "INPUT") {
      e.preventDefault();
      togglePlay();
    }
  });

  // Chế độ xem (Ảnh thường, Đỏ/Xanh, Trừ nền)
  document.querySelectorAll(".seg-btn[data-mode]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".seg-btn[data-mode]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      AppState.renderMode = btn.dataset.mode;
      renderer.draw();
    });
  });

  // Kéo & Thu phóng Canvas
  let isPanning = false;
  let lastM = { x: 0, y: 0 };
  skyCanvas.addEventListener("mousedown", (e) => {
    isPanning = true;
    lastM = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener("mousemove", (e) => {
    if (!isPanning) return;
    AppState.panX += e.clientX - lastM.x;
    AppState.panY += e.clientY - lastM.y;
    lastM = { x: e.clientX, y: e.clientY };
    renderer.draw();
  });
  window.addEventListener("mouseup", () => { isPanning = false; });

  skyCanvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.88;
    AppState.zoom = Math.max(0.6, Math.min(5.0, AppState.zoom * factor));
    renderer.draw();
  }, { passive: false });

  // Nút Căn giữa góc nhìn
  document.getElementById("btnResetView").addEventListener("click", () => {
    AppState.zoom = 1.0;
    AppState.panX = 0;
    AppState.panY = 0;
    renderer.draw();
  });

  // Chọn vật thể bằng cách nhấp trực tiếp trên Canvas
  skyCanvas.addEventListener("click", (e) => {
    const rect = skyCanvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const w = renderer.w, h = renderer.h;

    const canX = (clickX - (w / 2 + AppState.panX)) / AppState.zoom + 256;
    const canY = (clickY - (h / 2 + AppState.panY)) / AppState.zoom + 256;

    let closest = null;
    let minD = 30; // Bán kính nhấp chuột dễ chịu
    for (const t of AppState.targets) {
      const pos = t.positions[AppState.epoch] || t.positions[0];
      const d = Math.hypot(pos.x - canX, pos.y - canY);
      if (d < minD) {
        minD = d;
        closest = t;
      }
    }
    if (closest) {
      AppState.selectedTarget = closest;
      updateInspector(closest);
      renderTargetCards(renderer, specChart);
      renderer.draw();
      specChart.draw();
    }
  });

  // ── Các Hộp Thoại (Modals) ──
  // 1. Hộp thoại Hướng dẫn
  const guideModal = document.getElementById("guideModal");
  document.getElementById("btnOpenGuide").addEventListener("click", () => guideModal.classList.add("active"));
  document.getElementById("btnCloseGuide").addEventListener("click", () => guideModal.classList.remove("active"));
  document.getElementById("btnUnderstand").addEventListener("click", () => guideModal.classList.remove("active"));

  // 2. Hộp thoại Firebase
  const fbModal = document.getElementById("firebaseModal");
  document.getElementById("btnFirebaseStatus").addEventListener("click", () => fbModal.classList.add("active"));
  document.getElementById("btnCloseFirebase").addEventListener("click", () => fbModal.classList.remove("active"));
  document.getElementById("btnSaveFirebase").addEventListener("click", () => {
    const newUrl = document.getElementById("fbUrlInput").value.trim();
    if (newUrl) {
      AppState.firebaseUrl = newUrl;
      localStorage.setItem("spherex_rtdb_url", newUrl);
      fbModal.classList.remove("active");
      initFirebaseSync(() => {
        renderTargetCards(renderer, specChart);
        renderer.draw();
      });
    }
  });

  // 3. Hộp thoại NEOSSat
  const neoModal = document.getElementById("neossatModal");
  const btnOpenNeo = document.getElementById("btnOpenNEOSSat");
  if (btnOpenNeo) {
    btnOpenNeo.addEventListener("click", () => {
      neoModal.classList.add("active");
      drawNEOSSatStrip();
    });
  }
  document.getElementById("btnCloseNEOSSat").addEventListener("click", () => neoModal.classList.remove("active"));

  function drawNEOSSatStrip() {
    const c = document.getElementById("neossatCanvas");
    if (!c) return;
    const ctx = c.getContext("2d");
    c.width = c.parentElement.clientWidth || 580;
    c.height = 130;
    ctx.fillStyle = "#0a0d14";
    ctx.fillRect(0, 0, c.width, c.height);

    for (let i = 0; i < 7; i++) {
      const x = 30 + i * ((c.width - 60) / 6);
      const y = 65 + (i - 3) * 10;
      ctx.fillStyle = i === 3 ? "#f59e0b" : "rgba(255, 255, 255, 0.4)";
      ctx.beginPath();
      ctx.arc(x, y, i === 3 ? 4 : 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(30, 65 - 30);
    ctx.lineTo(c.width - 30, 65 + 30);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Xuất dữ liệu JSON
  document.getElementById("btnExportCatalog").addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(AppState.targets, null, 2));
    const dl = document.createElement("a");
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", "SPHEREx_Discoveries.json");
    dl.click();

    const toast = document.getElementById("toastMsg");
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
  });
});
