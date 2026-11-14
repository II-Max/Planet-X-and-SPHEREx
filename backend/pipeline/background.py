"""
backend/pipeline/background.py
──────────────────────────────
2D astronomical background estimation and sigma-clipped noise characterization.
Uses a SExtractor-inspired sliding grid with iterative outlier rejection.
"""

import logging
from typing import Tuple
import numpy as np
from scipy.ndimage import zoom as ndzoom

logger = logging.getLogger("BackgroundEstimator")


def estimate_background_2d(
    image: np.ndarray,
    box_size: int = 64,
    sigma_clip_iters: int = 3,
    sigma_clip_thresh: float = 3.0,
) -> Tuple[np.ndarray, float]:
    """
    Estimate smooth background map and noise sigma using iterative sigma-clipping.

    Parameters:
      image: (H, W) 2D array
      box_size: block side length (pixels)

    Returns:
      (background_map, noise_sigma)
    """
    h, w = image.shape
    ny = max(1, h // box_size)
    nx = max(1, w // box_size)
    block_medians = np.zeros((ny, nx), dtype=np.float64)

    for iy in range(ny):
        y0, y1 = iy * box_size, min((iy + 1) * box_size, h)
        for ix in range(nx):
            x0, x1 = ix * box_size, min((ix + 1) * box_size, w)
            tile = image[y0:y1, x0:x1].copy().ravel()

            for _ in range(sigma_clip_iters):
                med = np.median(tile)
                mad = np.median(np.abs(tile - med))
                sig = 1.4826 * mad
                if sig == 0:
                    break
                mask = np.abs(tile - med) < sigma_clip_thresh * sig
                tile = tile[mask]
                if tile.size == 0:
                    break

            block_medians[iy, ix] = np.median(tile) if tile.size > 0 else 0.0

    zoom_y = h / ny
    zoom_x = w / nx
    background = ndzoom(block_medians, (zoom_y, zoom_x), order=1).astype(np.float32)
    background = background[:h, :w]

    residual = image - background
    sigma = float(1.4826 * np.median(np.abs(residual - np.median(residual))))
    return background, sigma

