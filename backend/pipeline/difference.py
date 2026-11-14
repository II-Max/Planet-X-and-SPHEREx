"""
backend/pipeline/difference.py
──────────────────────────────
PSF-normalized astronomical difference imaging.
Matches resolution between observation epochs and computes residual map:
  ΔI = Epoch_2 - α · Epoch_1
"""

from typing import Tuple
import numpy as np
from scipy.ndimage import gaussian_filter, uniform_filter


def compute_difference_map(
    epoch1: np.ndarray,
    epoch2: np.ndarray,
    psf_match_sigma: float = 1.2,
) -> Tuple[np.ndarray, float, float]:
    """
    Compute PSF-matched difference image and noise sigma.

    Returns:
      (diff_image, sigma_diff, alpha)
    """
    smooth1 = gaussian_filter(epoch1, sigma=psf_match_sigma)
    smooth2 = gaussian_filter(epoch2, sigma=psf_match_sigma)

    med1 = np.median(smooth1)
    med2 = np.median(smooth2)
    alpha = med2 / (med1 + 1e-12)

    diff = smooth2 - alpha * smooth1
    residual = diff - uniform_filter(diff, size=31)
    sigma_diff = float(1.4826 * np.median(np.abs(residual)))

    return diff, sigma_diff, alpha

