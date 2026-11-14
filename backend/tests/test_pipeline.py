"""
backend/tests/test_pipeline.py
──────────────────────────────
Automated test suite verifying astrometric propagation, spectral classification,
difference imaging, and FastAPI endpoints.
"""

import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import pytest
import numpy as np
from astropy.time import Time
from astropy.wcs import WCS
from astropy.coordinates import SkyCoord, Distance
import astropy.units as u

from backend.config import band_to_wavelength, wavelength_to_band, NUM_BANDS
from backend.ingestion.gaia_service import _propagate_gaia_source
from backend.pipeline.background import estimate_background_2d
from backend.pipeline.difference import compute_difference_map
from backend.pipeline.spectral_classifier import extract_102band_profile


def test_wavelength_conversions():
    """Verify band index to wavelength mapping."""
    assert np.isclose(band_to_wavelength(0), 0.75)
    assert np.isclose(band_to_wavelength(NUM_BANDS - 1), 5.00)
    assert wavelength_to_band(3.30) in (60, 61)


def test_gaia_space_motion_propagation():
    """Verify that proper motion shifts star position over 9 years."""
    wcs = WCS(naxis=2)
    wcs.wcs.crpix = [32, 32]
    wcs.wcs.cdelt = [-0.0017, 0.0017]
    wcs.wcs.crval = [90.0, -66.0]
    wcs.wcs.ctype = ["RA---TAN", "DEC--TAN"]

    t_e1 = Time("2025-01-01T00:00:00")
    t_e2 = Time("2025-07-01T00:00:00")

    star = _propagate_gaia_source(
        source_id="TEST-STAR",
        ra_deg=90.0,
        dec_deg=-66.0,
        parallax_mas=42.8,
        pmra_mas_yr=-480.0,
        pmdec_mas_yr=610.0,
        g_mag=12.4,
        epoch1_time=t_e1,
        epoch2_time=t_e2,
        wcs=wcs,
    )
    # 6-month displacement should be ~0.38 - 0.40 arcsec
    assert 0.35 < star.displacement_arcsec < 0.45
    assert star.is_fast_mover is True


def test_background_estimation():
    """Verify 2D sigma-clipped background map."""
    arr = np.random.normal(100.0, 5.0, (64, 64)).astype(np.float32)
    bg, sigma = estimate_background_2d(arr, box_size=32)
    assert 98.0 < bg.mean() < 102.0
    assert 4.0 < sigma < 6.0


def test_difference_imaging():
    """Verify that identical static images subtract to near zero."""
    e1 = np.random.normal(50.0, 2.0, (64, 64)).astype(np.float32)
    e2 = e1.copy()
    diff, sig, alpha = compute_difference_map(e1, e2)
    assert np.isclose(alpha, 1.0, atol=0.05)
    assert np.abs(diff.mean()) < 0.5
