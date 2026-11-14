"""
backend/config.py
─────────────────
Central configuration, physical constants, and mission specifications
for NASA SPHEREx, ESA Gaia DR3, and CSA NEOSSat data processing.
"""

from typing import Final

# SPHEREx Spectrophotometric Survey Specifications
NUM_BANDS: Final[int] = 102
LAMBDA_MIN_UM: Final[float] = 0.75
LAMBDA_MAX_UM: Final[float] = 5.00
SPHEREX_PIXEL_SCALE_ARCSEC: Final[float] = 6.2       # Native spatial resolution
PSF_FWHM_PIX: Final[float] = 2.8                     # Optical point-spread function FWHM
DEFAULT_CUTOUT_SIZE_PIX: Final[int] = 64             # 64x64 px cutout (~6.6 x 6.6 arcmin)
EPOCH_BASELINE_MONTHS: Final[float] = 6.0            # Cadence between full-sky scans

# Astrometric Reference Epochs
GAIA_REF_EPOCH_STR: Final[str] = "2016-01-01T00:00:00"  # Gaia DR3 J2016.0
DEFAULT_EPOCH1_DATE: Final[str] = "2025-01-01T00:00:00" # SPHEREx Pass 1
DEFAULT_EPOCH2_DATE: Final[str] = "2025-07-01T00:00:00" # SPHEREx Pass 2

# Archive Endpoints
IRSA_TAP_URL: Final[str] = "https://irsa.ipac.caltech.edu/TAP"
CADC_TAP_URL: Final[str] = "https://ws.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/argus/tap"
GAIA_TAP_URL: Final[str] = "https://gea.esac.esa.int/tap-server/tap"

# Network Timeout Controls (Seconds)
REMOTE_QUERY_TIMEOUT_SEC: Final[float] = 2.5


def band_to_wavelength(band_idx: int) -> float:
    """Convert 0-based band index (0..101) to central wavelength in microns."""
    return LAMBDA_MIN_UM + (band_idx / (NUM_BANDS - 1)) * (LAMBDA_MAX_UM - LAMBDA_MIN_UM)


def wavelength_to_band(wl_um: float) -> int:
    """Convert wavelength in microns to nearest 0-based band index (0..101)."""
    frac = (wl_um - LAMBDA_MIN_UM) / (LAMBDA_MAX_UM - LAMBDA_MIN_UM)
    import numpy as np
    return int(np.clip(np.round(frac * (NUM_BANDS - 1)), 0, NUM_BANDS - 1))

