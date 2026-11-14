"""
backend/pipeline/tiling.py
──────────────────────────
Astronomical tile rendering and image stretching.
Encodes multi-epoch sky maps into base64 WebP tiles for web rendering.
"""

import base64
import io
from typing import Dict
import numpy as np
from PIL import Image


def render_tiles_base64(
    cube1: np.ndarray,
    cube2: np.ndarray,
) -> Dict[str, str]:
    """
    Render 4 scientific multi-epoch display tiles encoded directly into base64 WebP:
      - 'epoch1': Wide-band NIR composite for Epoch 1
      - 'epoch2': Wide-band NIR composite for Epoch 2
      - 'difference': Normalized residual |Epoch 2 - Epoch 1|
      - 'dipole_composite': Red (Epoch 1) + Cyan (Epoch 2) chromatic blink
    """
    img1 = np.median(cube1, axis=0)
    img2 = np.median(cube2, axis=0)

    def stretch(arr: np.ndarray) -> np.ndarray:
        p1, p99 = np.percentile(arr, (1.0, 99.5))
        scaled = np.clip((arr - p1) / (p99 - p1 + 1e-8), 0.0, 1.0)
        return (scaled * 255).astype(np.uint8)

    s1 = stretch(img1)
    s2 = stretch(img2)

    # Difference Map
    diff = np.abs(img2.astype(np.float32) - img1.astype(np.float32))
    p1_d, p99_d = np.percentile(diff, (5.0, 99.8))
    diff_stretched = np.clip((diff - p1_d) / (p99_d - p1_d + 1e-8), 0.0, 1.0)
    s_diff = (diff_stretched * 255).astype(np.uint8)

    # Red-Cyan Dipole (R = Epoch 1, G=B = Epoch 2)
    h, w = s1.shape
    dipole = np.zeros((h, w, 3), dtype=np.uint8)
    dipole[:, :, 0] = s1  # Red channel
    dipole[:, :, 1] = s2  # Green channel
    dipole[:, :, 2] = s2  # Blue channel

    def to_b64(img_array: np.ndarray) -> str:
        pil_img = Image.fromarray(img_array)
        buf = io.BytesIO()
        pil_img.save(buf, format="WEBP", quality=90)
        return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

    return {
        "epoch1": to_b64(s1),
        "epoch2": to_b64(s2),
        "difference": to_b64(s_diff),
        "dipole_composite": to_b64(dipole),
    }

