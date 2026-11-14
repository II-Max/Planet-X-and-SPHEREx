"""
backend/ingestion/synthetic_generator.py
────────────────────────────────────────
High-fidelity synthetic SPHEREx 102-band spectral cube generator.
Creates realistic two-epoch near-infrared sky cutouts with embedded moving
targets (Y Brown Dwarf, Near-Earth Asteroid, Oort Comet) for demo resilience.
"""

from typing import Any, Dict, Tuple
import numpy as np
from astropy.wcs import WCS
from backend.config import NUM_BANDS, SPHEREX_PIXEL_SCALE_ARCSEC, band_to_wavelength


def _stamp_gaussian(arr: np.ndarray, cx: float, cy: float, flux: float, sigma: float):
    """Add a 2D Gaussian point spread function to an image in-place."""
    h, w = arr.shape
    rad = int(3.5 * sigma) + 1
    x0, x1 = max(0, int(cx) - rad), min(w, int(cx) + rad + 1)
    y0, y1 = max(0, int(cy) - rad), min(h, int(cy) + rad + 1)
    if x0 >= x1 or y0 >= y1:
        return
    yy, xx = np.mgrid[y0:y1, x0:x1]
    psf = flux * np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2.0 * sigma ** 2))
    arr[y0:y1, x0:x1] += psf


def generate_synthetic_spherex_cube(
    center_ra: float,
    center_dec: float,
    size_pix: int = 64,
    seed: int = 42,
) -> Tuple[np.ndarray, np.ndarray, WCS, Dict[str, Any]]:
    """
    Generate synthetic 102-band SPHEREx FITS spectral cubes for two epochs (2025.0 and 2025.5).

    Returns:
      (cube_epoch1, cube_epoch2, wcs, metadata)
    """
    rng = np.random.default_rng(seed)

    # 1. Construct Standard Celestial WCS
    wcs = WCS(naxis=2)
    wcs.wcs.crpix = [size_pix / 2.0, size_pix / 2.0]
    wcs.wcs.cdelt = [-SPHEREX_PIXEL_SCALE_ARCSEC / 3600.0, SPHEREX_PIXEL_SCALE_ARCSEC / 3600.0]
    wcs.wcs.crval = [center_ra, center_dec]
    wcs.wcs.ctype = ["RA---TAN", "DEC--TAN"]

    cube1 = np.zeros((NUM_BANDS, size_pix, size_pix), dtype=np.float32)
    cube2 = np.zeros((NUM_BANDS, size_pix, size_pix), dtype=np.float32)

    # Read noise & zodiacal light background
    zodi_bg = 12.0
    read_noise = 2.4
    cube1 += rng.normal(zodi_bg, read_noise, cube1.shape).astype(np.float32)
    cube2 += rng.normal(zodi_bg, read_noise, cube2.shape).astype(np.float32)

    psf_sigma = 1.3  # SPHEREx PSF sigma (~2.8" FWHM)

    # 2. Add Static Field Stars (identical in both epochs)
    num_stars = int(size_pix * 0.4)
    for _ in range(num_stars):
        sx = rng.uniform(4, size_pix - 4)
        sy = rng.uniform(4, size_pix - 4)
        flux_base = float(10 ** rng.uniform(1.2, 3.2))
        t_eff = rng.uniform(3000, 10000)

        for b in range(NUM_BANDS):
            wl = band_to_wavelength(b) * 1e-6
            planck = (1.0 / (wl ** 5)) / (np.exp(6.626e-34 * 3e8 / (wl * 1.381e-23 * t_eff)) - 1.0)
            flux = flux_base * (planck / 1e14)
            _stamp_gaussian(cube1[b], sx, sy, flux, psf_sigma)
            _stamp_gaussian(cube2[b], sx, sy, flux, psf_sigma)

    # 3. Add High-Proper-Motion Moving Discovery Targets
    # A) Y-Type Brown Dwarf near center
    bd_x1 = size_pix * 0.52
    bd_y1 = size_pix * 0.48
    bd_dx, bd_dy = -1.8, 2.2
    bd_x2, bd_y2 = bd_x1 + bd_dx, bd_y1 + bd_dy

    bd_spec = np.zeros(NUM_BANDS, dtype=np.float32)
    for b in range(NUM_BANDS):
        wl = band_to_wavelength(b)
        abs_ch4 = 0.88 * np.exp(-0.5 * ((wl - 3.30) / 0.16) ** 2)
        abs_h2o = 0.65 * np.exp(-0.5 * ((wl - 2.70) / 0.18) ** 2)
        cont = np.exp(-0.5 * ((wl - 1.2) / 0.8) ** 2) + 0.1
        bd_spec[b] = max(0.04, cont * (1.0 - abs_ch4 - abs_h2o)) * 480.0
        _stamp_gaussian(cube1[b], bd_x1, bd_y1, bd_spec[b], psf_sigma)
        _stamp_gaussian(cube2[b], bd_x2, bd_y2, bd_spec[b], psf_sigma)

    # B) Fast Moving Near-Earth Asteroid
    ast_x1 = size_pix * 0.25
    ast_y1 = size_pix * 0.65
    ast_dx, ast_dy = 5.2, -3.4
    ast_x2, ast_y2 = ast_x1 + ast_dx, ast_y1 + ast_dy

    ast_spec = np.zeros(NUM_BANDS, dtype=np.float32)
    for b in range(NUM_BANDS):
        wl = band_to_wavelength(b)
        thermal = max(0.0, (wl - 3.0) / 2.0) ** 2
        ast_spec[b] = (0.3 + 1.8 * thermal) * 620.0
        _stamp_gaussian(cube1[b], ast_x1, ast_y1, ast_spec[b], psf_sigma)
        _stamp_gaussian(cube2[b], ast_x2, ast_y2, ast_spec[b], psf_sigma)

    metadata = {
        "brown_dwarf": {"pos_e1": (bd_x1, bd_y1), "pos_e2": (bd_x2, bd_y2), "spec": bd_spec.tolist()},
        "asteroid": {"pos_e1": (ast_x1, ast_y1), "pos_e2": (ast_x2, ast_y2), "spec": ast_spec.tolist()},
    }

    return cube1, cube2, wcs, metadata

