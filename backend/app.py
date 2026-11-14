"""
backend/app.py
──────────────
FastAPI Application Entry Point for the SPHEREx Time-Domain Backend.
"""

from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes_inspect import router as inspect_router
from backend.api.routes_candidates import router as candidates_router

app = FastAPI(
    title="SPHEREx ChronoSpectra Multi-Mission API",
    version="2.4.0",
    description="Scientific data pipeline connecting NASA IRSA, ESA Gaia DR3, and CSA CADC.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(inspect_router)
app.include_router(candidates_router)


@app.get("/health")
def health_check():
    """Service health and diagnostic status."""
    return {
        "status": "healthy",
        "service": "SPHEREx ChronoSpectra Backend",
        "version": "2.4.0",
        "archives": ["NASA/IPAC IRSA", "ESA Gaia DR3", "CSA CADC NEOSSat"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

