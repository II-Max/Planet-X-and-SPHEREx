"""
backend/api/routes_candidates.py
────────────────────────────────
Endpoints for candidate retrieval and citizen-science voting:
GET  /api/v1/candidates
POST /api/v1/vote
"""

from datetime import datetime, timezone
import uuid
from typing import List
from fastapi import APIRouter, HTTPException

from backend.api.schemas import CandidateItem, VoteRequest, VoteResponse

router = APIRouter(prefix="/api/v1", tags=["Citizen Science"])

# In-memory candidate storage for demo
CANDIDATES_DB = [
    CandidateItem(
        id="SPX-J0600-6633",
        ra=90.0625,
        dec=-66.5700,
        shift_arcsec=1.42,
        angular_speed_arcsec_yr=2.84,
        snr=24.5,
        ai_classification="Ultra-Cool Y Brown Dwarf",
        ai_confidence=0.94,
        best_preset="CH4 Methane Hunter (3.3um)",
        status="unclassified",
        votes={"browndwarf": 142, "asteroid": 12, "comet": 3, "artifact": 0},
    ),
    CandidateItem(
        id="2025-XP4",
        ra=89.9200,
        dec=-66.5450,
        shift_arcsec=11.4,
        angular_speed_arcsec_yr=22.8,
        snr=38.2,
        ai_classification="Near-Earth Asteroid",
        ai_confidence=0.91,
        best_preset="Thermal Asteroid (4.8um)",
        status="unclassified",
        votes={"browndwarf": 2, "asteroid": 184, "comet": 8, "artifact": 1},
    ),
    CandidateItem(
        id="C/2025-X1",
        ra=89.8800,
        dec=-66.6200,
        shift_arcsec=4.95,
        angular_speed_arcsec_yr=9.9,
        snr=19.8,
        ai_classification="Oort Cloud Comet",
        ai_confidence=0.88,
        best_preset="CO2 Ice & Volatiles (4.26um)",
        status="unclassified",
        votes={"browndwarf": 1, "asteroid": 6, "comet": 95, "artifact": 2},
    ),
]


@router.get("/candidates", response_model=List[CandidateItem])
def list_candidates():
    """Retrieve pre-filtered moving object candidates."""
    return CANDIDATES_DB


@router.post("/vote", response_model=VoteResponse)
def submit_vote(vote: VoteRequest):
    """Submit a citizen science classification vote for a candidate."""
    cand = next((c for c in CANDIDATES_DB if c.id == vote.candidate_id), None)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if vote.classification in cand.votes:
        cand.votes[vote.classification] += 1
    else:
        cand.votes[vote.classification] = 1

    total = sum(cand.votes.values())
    top_class, top_count = max(cand.votes.items(), key=lambda x: x[1])
    consensus = "likely_" + top_class if (top_count / total) > 0.7 else "evaluating"

    return VoteResponse(
        vote_id=f"VOTE-{uuid.uuid4().hex[:8].upper()}",
        candidate_id=vote.candidate_id,
        recorded_at=datetime.now(timezone.utc).isoformat(),
        new_totals=cand.votes,
        consensus_status=consensus,
    )

