"""
backend/api/schemas.py
──────────────────────
Pydantic schemas for request validation and response serialization.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SkySectorRequest(BaseModel):
    ra: float = Field(..., ge=0.0, le=360.0, description="Right Ascension in degrees (ICRS)")
    dec: float = Field(..., ge=-90.0, le=90.0, description="Declination in degrees (ICRS)")
    radius_arcsec: float = Field(30.0, ge=5.0, le=300.0, description="Search radius in arcseconds")
    epoch1_date: str = Field("2025-01-01", description="Observation date for Epoch 1")
    epoch2_date: str = Field("2025-07-01", description="Observation date for Epoch 2")
    cutout_size_pix: int = Field(64, ge=32, le=256, description="Size of cutout window (pixels)")


class GaiaPropagatedStar(BaseModel):
    source_id: str
    g_mag: float
    parallax_mas: float
    pm_ra_mas_yr: float
    pm_dec_mas_yr: float
    pm_total_mas_yr: float
    ra_j2016_deg: float
    dec_j2016_deg: float
    ra_epoch1_deg: float
    dec_epoch1_deg: float
    ra_epoch2_deg: float
    dec_epoch2_deg: float
    displacement_arcsec: float
    pixel_x_epoch1: float
    pixel_y_epoch1: float
    pixel_x_epoch2: float
    pixel_y_epoch2: float
    mask_radius_pix: float
    is_fast_mover: bool


class NEOSSatObservation(BaseModel):
    observation_id: str
    target_name: str
    target_type: str
    time_utc: str
    exposure_sec: float
    apparent_rate_arcsec_hr: float
    v_magnitude: Optional[float]
    cadc_preview_url: str
    orbital_hazard_flag: str


class SpectralProfile(BaseModel):
    wavelengths_um: List[float]
    flux_epoch1_ujy: List[float]
    flux_epoch2_ujy: List[float]
    ch4_trough_depth: float
    co2_line_excess: float
    thermal_excess_slope: float
    inferred_class: str


class SkySectorInspectionResponse(BaseModel):
    target_ra_deg: float
    target_dec_deg: float
    pixel_scale_arcsec: float
    epoch1_timestamp: str
    epoch2_timestamp: str
    tiles_base64: Dict[str, str] = Field(
        ...,
        description="Base64 WebP images for: 'epoch1', 'epoch2', 'difference', 'dipole_composite'"
    )
    spectral_profile: SpectralProfile
    gaia_dr3_crossmatch: List[GaiaPropagatedStar]
    neossat_crossmatch: List[NEOSSatObservation]
    summary_diagnostics: Dict[str, Any]


class CandidateItem(BaseModel):
    id: str
    ra: float
    dec: float
    shift_arcsec: float
    angular_speed_arcsec_yr: float
    snr: float
    ai_classification: str
    ai_confidence: float
    best_preset: str
    status: str
    votes: Dict[str, int]


class VoteRequest(BaseModel):
    candidate_id: str
    user_id: str
    classification: str  # "asteroid" | "browndwarf" | "comet" | "artifact"
    comment: Optional[str] = None


class VoteResponse(BaseModel):
    vote_id: str
    candidate_id: str
    recorded_at: str
    new_totals: Dict[str, int]
    consensus_status: str

