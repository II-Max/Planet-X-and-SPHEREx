"""
backend/pipeline/dipole_detector.py
───────────────────────────────────
Positive/Negative Dipole Extrema Detection & Velocity Vector Extraction.
Identifies moving point sources in difference images and measures proper motion.
"""

from typing import List, Tuple
import numpy as np
from astropy.wcs import WCS
from scipy.ndimage import label as ndlabel, maximum_filter, minimum_filter

from backend.config import SPHEREX_PIXEL_SCALE_ARCSEC


def _find_peaks(
    image: np.ndarray,
    threshold: float,
    footprint_size: int = 7,
    positive: bool = True,
) -> List[Tuple[float, float, float]]:
    """Find local maxima or minima above or below threshold."""
    if positive:
        filtered = maximum_filter(image, size=footprint_size)
        peak_mask = (image == filtered) & (image > threshold)
    else:
        filtered = minimum_filter(image, size=footprint_size)
        peak_mask = (image == filtered) & (image < -threshold)

    labelled, n_features = ndlabel(peak_mask)
    peaks = []
    for feat_id in range(1, n_features + 1):
        ys, xs = np.where(labelled == feat_id)
        weights = image[ys, xs] if positive else -image[ys, xs]
        total_w = weights.sum()
        if total_w <= 0:
            continue
        yc = float(np.sum(ys * weights) / total_w)
        xc = float(np.sum(xs * weights) / total_w)
        pv = float(image[ys, xs].max() if positive else image[ys, xs].min())
        peaks.append((yc, xc, pv))
    return peaks


def detect_dipole_candidates(
    diff_image: np.ndarray,
    sigma_diff: float,
    wcs: WCS,
    detection_nsigma: float = 5.0,
    max_separation_pix: float = 25.0,
) -> List[dict]:
    """
    Match positive and negative peaks in difference image into candidate moving sources.
    """
    threshold = detection_nsigma * sigma_diff
    pos_peaks = _find_peaks(diff_image, threshold, positive=True)
    neg_peaks = _find_peaks(diff_image, threshold, positive=False)

    if not pos_peaks or not neg_peaks:
        return []

    neg_arr = np.array([(y, x) for y, x, _ in neg_peaks])
    candidates = []

    for idx, (py, px, p_val) in enumerate(pos_peaks):
        dists = np.hypot(neg_arr[:, 0] - py, neg_arr[:, 1] - px)
        within = np.where((dists > 1.0) & (dists < max_separation_pix))[0]
        if within.size == 0:
            continue

        best_idx = within[np.argmax(np.abs([neg_peaks[j][2] for j in within]))]
        ny, nx, n_val = neg_peaks[best_idx]

        dx_pix = px - nx
        dy_pix = py - ny
        disp_pix = np.hypot(dx_pix, dy_pix)
        disp_arcsec = disp_pix * SPHEREX_PIXEL_SCALE_ARCSEC
        pa_deg = float(np.degrees(np.arctan2(dx_pix, -dy_pix)) % 360)

        snr_pos = float(abs(p_val) / sigma_diff)
        snr_neg = float(abs(n_val) / sigma_diff)
        snr_combined = float(np.hypot(snr_pos, snr_neg))

        ra_pos, dec_pos = wcs.pixel_to_world_values(px, py)
        ra_neg, dec_neg = wcs.pixel_to_world_values(nx, ny)
        delta_ra = float((ra_pos - ra_neg) * np.cos(np.radians(dec_pos)) * 3600)
        delta_dec = float((dec_pos - dec_neg) * 3600)

        candidates.append({
            "id": f"CAND-{idx + 1:04d}",
            "ra_e1": float(ra_neg),
            "dec_e1": float(dec_neg),
            "ra_e2": float(ra_pos),
            "dec_e2": float(dec_pos),
            "delta_ra_arcsec": delta_ra,
            "delta_dec_arcsec": delta_dec,
            "displacement_arcsec": disp_arcsec,
            "position_angle_deg": pa_deg,
            "snr": round(snr_combined, 2),
        })

    candidates.sort(key=lambda c: c["snr"], reverse=True)
    return candidates

