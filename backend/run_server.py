# /// script
# dependencies = [
#     "astropy>=6.0.0",
#     "numpy>=1.26.0",
#     "scipy>=1.12.0",
#     "astroquery>=0.4.7",
#     "pyvo>=1.5.0",
#     "fastapi>=0.110.0",
#     "uvicorn>=0.28.0",
#     "pydantic>=2.6.0",
#     "pillow>=10.2.0",
#     "httpx>=0.27.0",
# ]
# ///
"""
backend/run_server.py
─────────────────────
Server launcher and CLI runner for the SPHEREx ChronoSpectra backend.
Usage:
  uv run backend/run_server.py --serve --port 8000
  uv run backend/run_server.py --ra 90.0 --dec -66.56 --radius 30.0
"""

import argparse
import sys
from pathlib import Path

# Ensure root workspace is in sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import uvicorn
from backend.app import app
from backend.api.schemas import SkySectorRequest
from backend.api.routes_inspect import inspect_sky_sector


def main():
    parser = argparse.ArgumentParser(description="SPHEREx ChronoSpectra Server & CLI Runner")
    parser.add_argument("--serve", action="store_true", help="Launch FastAPI server on port 8000")
    parser.add_argument("--port", type=int, default=8000, help="Port for server")
    parser.add_argument("--ra", type=float, default=90.0000, help="Right Ascension in degrees")
    parser.add_argument("--dec", type=float, default=-66.5606, help="Declination in degrees")
    parser.add_argument("--radius", type=float, default=30.0, help="Search radius in arcseconds")
    args = parser.parse_args()

    if args.serve:
        print("\n🚀 Starting SPHEREx ChronoSpectra REST API on http://127.0.0.1:8000 ...")
        print("📖 Interactive Swagger API Docs at http://127.0.0.1:8000/docs\n")
        uvicorn.run(app, host="0.0.0.0", port=args.port)
    else:
        req = SkySectorRequest(ra=args.ra, dec=args.dec, radius_arcsec=args.radius)
        res = inspect_sky_sector(req)
        print("\n" + "═" * 70)
        print(f"  SPHEREx ChronoSpectra Inspection Results [CLI Mode]")
        print("═" * 70)
        print(f"  Target Coordinates : RA {res.target_ra_deg:.4f}°, Dec {res.target_dec_deg:.4f}°")
        print(f"  Spectral Class     : {res.spectral_profile.inferred_class}")
        print(f"  CH4 Trough Depth   : {res.spectral_profile.ch4_trough_depth}")
        print(f"  CO2 Line Excess    : {res.spectral_profile.co2_line_excess}")
        print(f"  Thermal Slope      : {res.spectral_profile.thermal_excess_slope}")
        print(f"\n  Gaia DR3 Matches ({len(res.gaia_dr3_crossmatch)}):")
        for g in res.gaia_dr3_crossmatch:
            print(f"    • Source ID {g.source_id}: G={g.g_mag} mag, μ={g.pm_total_mas_yr} mas/yr, Shift={g.displacement_arcsec}\"")
        print(f"\n  CSA NEOSSat Matches ({len(res.neossat_crossmatch)}):")
        for n in res.neossat_crossmatch:
            print(f"    • {n.observation_id}: {n.target_name} ({n.target_type}), Speed={n.apparent_rate_arcsec_hr}\"/hr")
        print(f"\n  Processing Time    : {res.summary_diagnostics['elapsed_ms']} ms")
        print("═" * 70 + "\n")


if __name__ == "__main__":
    main()

