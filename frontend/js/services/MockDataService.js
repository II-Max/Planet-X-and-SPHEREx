/**
 * frontend/js/services/MockDataService.js
 * Generates verified astronomical ground truth targets and background stars.
 */

import { CONFIG, bandToWavelength } from "../config.js";

function synthesizePlanck(T, norm = 1.0) {
  const spec = new Float32Array(CONFIG.NUM_BANDS);
  const h = 6.626e-34, c = 2.998e8, k = 1.381e-23;
  let maxVal = 0;
  for (let i = 0; i < CONFIG.NUM_BANDS; i++) {
    const lam = bandToWavelength(i) * 1e-6;
    const exp = (h * c) / (lam * k * T);
    const B = exp > 300 ? 0 : (2 * h * c * c) / (Math.pow(lam, 5) * (Math.exp(exp) - 1));
    spec[i] = B;
    if (B > maxVal) maxVal = B;
  }
  if (maxVal > 0) {
    for (let i = 0; i < CONFIG.NUM_BANDS; i++) spec[i] = (spec[i] / maxVal) * norm;
  }
  return spec;
}

export function getDiscoveryTargets() {
  // 1. Ultra-Cool Y-Type Brown Dwarf (3.3um CH4 absorption)
  const bdSpec = new Float32Array(CONFIG.NUM_BANDS);
  const bdBase = synthesizePlanck(450, 1.2);
  for (let i = 0; i < CONFIG.NUM_BANDS; i++) {
    const w = bandToWavelength(i);
    let abs = 1.0;
    abs *= (1.0 - 0.88 * Math.exp(-0.5 * Math.pow((w - 3.30) / 0.16, 2))); // CH4 trough
    abs *= (1.0 - 0.70 * Math.exp(-0.5 * Math.pow((w - 2.70) / 0.18, 2))); // H2O ice
    abs *= (1.0 - 0.45 * Math.exp(-0.5 * Math.pow((w - 1.40) / 0.10, 2))); // H2O vapor
    bdSpec[i] = bdBase[i] * Math.max(0.04, abs);
  }

  // 2. Near-Earth Asteroid (Thermal excess > 4.0um)
  const astSpec = new Float32Array(CONFIG.NUM_BANDS);
  const astRefl = synthesizePlanck(5778, 0.35);
  const astTherm = synthesizePlanck(295, 1.6);
  for (let i = 0; i < CONFIG.NUM_BANDS; i++) {
    const w = bandToWavelength(i);
    const thermWeight = Math.max(0, (w - 3.2) / 1.8);
    astSpec[i] = astRefl[i] * 0.4 + astTherm[i] * thermWeight;
  }

  // 3. Oort Cloud Comet (4.26um CO2 emission line)
  const cmtSpec = new Float32Array(CONFIG.NUM_BANDS);
  const cmtCont = synthesizePlanck(210, 0.5);
  for (let i = 0; i < CONFIG.NUM_BANDS; i++) {
    const w = bandToWavelength(i);
    cmtSpec[i] = cmtCont[i] * 0.3 + 
      0.95 * Math.exp(-0.5 * Math.pow((w - 4.26) / 0.07, 2)) +
      0.65 * Math.exp(-0.5 * Math.pow((w - 4.67) / 0.09, 2));
  }

  // 4. Known Optical Star in Gaia DR3
  const starSpec = synthesizePlanck(3400, 1.0);

  return [
    {
      id: "SPX-J0600-6633",
      name: "SPX-J0600-6633 (Y0 Dwarf)",
      type: "browndwarf",
      typeLabel: "Ultra-Cool Y Dwarf",
      baseX: 380, baseY: 180,
      dxEpoch: -4.5, dyEpoch: 5.5,
      radius: 3.2,
      spectrum: bdSpec,
      gaiaMatch: null,
      pmTotal: "1,420 mas/yr",
      tempEst: "~420 K (Sub-stellar)",
      desc: "Spectacular ultra-cool brown dwarf discovery candidate. Zero optical counterpart in Gaia DR3, massive methane absorption dip at 3.3 μm."
    },
    {
      id: "2025-XP4",
      name: "2025 XP4 (Near-Earth Asteroid)",
      type: "asteroid",
      typeLabel: "Near-Earth Asteroid",
      baseX: 160, baseY: 340,
      dxEpoch: 18.0, dyEpoch: -8.0,
      radius: 3.0,
      spectrum: astSpec,
      gaiaMatch: null,
      pmTotal: "22,800 mas/yr (High Velocity)",
      tempEst: "~295 K (Solar Equilibrium)",
      desc: "Fast moving solar system transient with bright thermal radiation >4.0 μm. Verified through CSA NEOSSat optical tracking."
    },
    {
      id: "C/2025-X1",
      name: "C/2025 X1 (SPHEREx-Comet)",
      type: "comet",
      typeLabel: "Oort Cloud Comet",
      baseX: 120, baseY: 130,
      dxEpoch: 7.0, dyEpoch: 4.0,
      radius: 6.5,
      isDiffuse: true,
      spectrum: cmtSpec,
      gaiaMatch: null,
      pmTotal: "4,950 mas/yr",
      tempEst: "~210 K (Outgassing Volatiles)",
      desc: "Diffuse fuzzy coma structure showing unmistakable 4.26 μm CO₂ gas outgassing signature."
    },
    {
      id: "GAIA-DR3-4108",
      name: "Gaia DR3 4108429188 (M-Star)",
      type: "star",
      typeLabel: "High-PM Known Star",
      baseX: 320, baseY: 360,
      dxEpoch: 8.0, dyEpoch: -6.0,
      radius: 4.0,
      spectrum: starSpec,
      gaiaMatch: {
        sourceId: "41084291882949",
        gMag: "12.4 mag",
        bpRp: "+2.14",
        parallax: "42.8 mas",
        pmRA: "-480 mas/yr",
        pmDec: "+610 mas/yr"
      },
      pmTotal: "776 mas/yr",
      tempEst: "~3,400 K (M4V Photosphere)",
      desc: "False-positive candidate: Moves across SPHEREx epochs, but immediately recognized as a cataloged optical star in Gaia DR3."
    }
  ];
}

export function generateStarfield(count = 350) {
  const stars = [];
  let s = 421985;
  const rand = () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (let i = 0; i < count; i++) {
    const x = 20 + rand() * 472;
    const y = 20 + rand() * 472;
    const mag = Math.pow(rand(), 3.5) * 0.9 + 0.05;
    const isGaia = rand() < 0.65;
    stars.push({
      x, y, mag,
      radius: 0.6 + mag * 3.2,
      spectrum: synthesizePlanck(3000 + rand() * 9000, mag),
      isGaia
    });
  }
  return stars;
}

