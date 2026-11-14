/**
 * frontend/js/config.js
 * Central frontend astronomical constants and mission profiles.
 */

export const CONFIG = {
  NUM_BANDS: 102,
  LAMBDA_MIN: 0.75,
  LAMBDA_MAX: 5.00,
  PIXEL_SCALE: 6.2, // arcsec/pixel
  FIELD_CENTER: {
    name: "Ecliptic Pole South",
    ra: "06h 00m 00.0s",
    dec: "-66° 33′ 38″",
    ra_deg: 90.0,
    dec_deg: -66.5606
  },
  API_BASE_URL: "http://127.0.0.1:8000/api/v1"
};

export function bandToWavelength(b) {
  return CONFIG.LAMBDA_MIN + (b / (CONFIG.NUM_BANDS - 1)) * (CONFIG.LAMBDA_MAX - CONFIG.LAMBDA_MIN);
}

export function wavelengthToBand(wl) {
  const frac = (wl - CONFIG.LAMBDA_MIN) / (CONFIG.LAMBDA_MAX - CONFIG.LAMBDA_MIN);
  return Math.min(CONFIG.NUM_BANDS - 1, Math.max(0, Math.round(frac * (CONFIG.NUM_BANDS - 1))));
}

