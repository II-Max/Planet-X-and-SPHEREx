"""
backend/pipeline/spectral_classifier.py
───────────────────────────────────────
SPHEREx 102-Band Spectral Diagnostic Analysis.
Calculates molecular absorption and emission indices:
  - Methane Absorption Depth (MAD) at 3.3 μm -> Brown Dwarfs
  - Carbon Dioxide Emission Index (CEI) at 4.26 μm -> Comets
  - Thermal Excess Slope (TES) > 4.0 μm -> Near-Earth Asteroids
"""

import numpy as np
from backend.config import NUM_BANDS, band_to_wavelength, wavelength_to_band
from backend.api.schemas import SpectralProfile


def extract_102band_profile(
    cube1: np.ndarray,
    cube2: np.ndarray,
    pixel_x: int,
    pixel_y: int,
) -> SpectralProfile:
    """
    Extract 102-band flux spectrum at given coordinate and perform automated
    astrophysical diagnostic classification.
    """
    h, w = cube1.shape[1], cube1.shape[2]
    px = int(np.clip(pixel_x, 1, w - 2))
    py = int(np.clip(pixel_y, 1, h - 2))

    # 3x3 pixel box aperture extraction
    spec1 = np.mean(cube1[:, py - 1 : py + 2, px - 1 : px + 2], axis=(1, 2))
    spec2 = np.mean(cube2[:, py - 1 : py + 2, px - 1 : px + 2], axis=(1, 2))

    wls = [round(band_to_wavelength(b), 3) for b in range(NUM_BANDS)]

    # Compute diagnostic spectral indices
    b_ch4 = wavelength_to_band(3.30)
    b_ref1 = wavelength_to_band(3.00)
    b_ref2 = wavelength_to_band(3.60)
    ch4_cont = (spec1[b_ref1] + spec1[b_ref2]) / 2.0
    ch4_depth = float(max(0.0, 1.0 - (spec1[b_ch4] / (ch4_cont + 1e-6))))

    b_co2 = wavelength_to_band(4.26)
    b_co2_ref = wavelength_to_band(4.00)
    co2_excess = float(spec1[b_co2] / (spec1[b_co2_ref] + 1e-6))

    b_therm_lo = wavelength_to_band(1.20)
    b_therm_hi = wavelength_to_band(4.80)
    thermal_slope = float(spec1[b_therm_hi] / (spec1[b_therm_lo] + 1e-6))

    # Astrophysical classification logic
    if ch4_depth > 0.45:
        inferred = "Ultra-Cool Y/T Brown Dwarf (Deep CH4 Methane Trough)"
    elif co2_excess > 1.8:
        inferred = "Comet / Active Volatile (CO2 Outgassing Peak)"
    elif thermal_slope > 2.0:
        inferred = "Near-Earth Asteroid (Warm Thermal Blackbody Slope)"
    else:
        inferred = "Stellar Photosphere (Continuum Radiation)"

    return SpectralProfile(
        wavelengths_um=wls,
        flux_epoch1_ujy=[round(float(v), 2) for v in spec1],
        flux_epoch2_ujy=[round(float(v), 2) for v in spec2],
        ch4_trough_depth=round(ch4_depth, 3),
        co2_line_excess=round(co2_excess, 3),
        thermal_excess_slope=round(thermal_slope, 3),
        inferred_class=inferred,
    )

