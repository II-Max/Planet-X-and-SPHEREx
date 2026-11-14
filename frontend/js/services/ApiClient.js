/**
 * frontend/js/services/ApiClient.js
 * Asynchronous HTTP client communicating with FastAPI multi-mission backend.
 */

import { CONFIG } from "../config.js";

export class ApiClient {
  static async inspectSkySector(ra, dec, radiusArcsec = 30.0) {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/inspect-sky-sector`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ra: parseFloat(ra),
          dec: parseFloat(dec),
          radius_arcsec: parseFloat(radiusArcsec),
          epoch1_date: "2025-01-01",
          epoch2_date: "2025-07-01",
          cutout_size_pix: 64
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      console.warn("Backend API unavailable; operating in autonomous client-side mode.", err);
      return null;
    }
  }

  static async submitVote(candidateId, classification) {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: candidateId,
          user_id: "citizen_analyst_01",
          classification: classification
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      console.warn("Backend vote API offline; logging locally.", err);
      return { status: "local_logged", candidate_id: candidateId };
    }
  }
}

