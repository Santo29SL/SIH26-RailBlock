"""Integration tests for Optimizer APIs, What-If Simulation, and Statutory Exports.

Ticket 06 Test Suite covering:
- POST /api/v1/optimizer/run (MILP solver execution and DB persistence)
- POST /api/v1/optimizer/simulate (In-memory simulation with HMAC commit token)
- POST /api/v1/optimizer/commit-simulation (Verified commit with valid, expired, and tampered tokens)
- POST /api/v1/optimizer/reschedule (Real-time fast rescheduling & SLW fallback)
- POST /api/v1/blocks/{id}/transition (Form T/351 Private Number state machine)
- GET /api/v1/blocks/{id}/export-bdms (CRIS BDMS standard JSON export)
- GET /api/v1/blocks/{id}/t351-notice (Statutory Form T/351 notice payload)
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
from datetime import date, datetime, time, timedelta, timezone
from typing import Any, Dict
from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.core.config import settings

# ── API Route Constants ──────────────────────────────────────

OPTIMIZER_RUN_URL = "/api/v1/optimizer/run"
OPTIMIZER_SIMULATE_URL = "/api/v1/optimizer/simulate"
OPTIMIZER_COMMIT_URL = "/api/v1/optimizer/commit-simulation"
OPTIMIZER_RESCHEDULE_URL = "/api/v1/optimizer/reschedule"
BLOCKS_URL = "/api/v1/blocks"
SECTIONS_URL = "/api/v1/sections"
TRAINS_URL = "/api/v1/trains"
MOVEMENTS_URL = "/api/v1/train-movements"
MAINTENANCE_URL = "/api/v1/maintenance"
COMPATIBILITY_URL = "/api/v1/compatibility-rules"


# ── Test Seed Helper Fixtures ────────────────────────────────


async def _setup_test_corridor(client: AsyncClient, target_date: date) -> Dict[str, Any]:
    """Helper to set up a complete realistic test corridor with section, trains, movements, and requests."""
    # 1. Create Section
    sec_payload = {
        "section_code": f"MAS-AJJ-{uuid4().hex[:4].upper()}",
        "section_name": "Chennai Central - Arakkonam",
        "division": "Chennai",
        "zone": "Southern Railway",
        "length_km": 68.5,
        "line_type": "DOUBLE",
    }
    sec_resp = await client.post(SECTIONS_URL, json=sec_payload)
    assert sec_resp.status_code == 201
    section_data = sec_resp.json()
    section_id = section_data["id"]

    # 2. Create Trains: VIP (Rajdhani) and Normal Express
    train_vip_resp = await client.post(
        TRAINS_URL,
        json={
            "train_number": f"22691-{uuid4().hex[:3]}",
            "train_name": "Bengaluru Rajdhani Express",
            "train_type": "SUPERFAST",
            "priority": "HIGH",
        },
    )
    assert train_vip_resp.status_code == 201
    vip_train_id = train_vip_resp.json()["id"]

    train_exp_resp = await client.post(
        TRAINS_URL,
        json={
            "train_number": f"12621-{uuid4().hex[:3]}",
            "train_name": "Tamil Nadu Express",
            "train_type": "EXPRESS",
            "priority": "MEDIUM",
        },
    )
    assert train_exp_resp.status_code == 201
    exp_train_id = train_exp_resp.json()["id"]

    # 3. Create Movements:
    # VIP train: 08:00 - 08:30
    # Express train: 16:00 - 16:30
    # Leaves large gap: 08:45 to 15:45 (420 mins)
    dow = target_date.weekday()
    await client.post(
        MOVEMENTS_URL,
        json={
            "train_id": vip_train_id,
            "section_id": section_id,
            "departure_time": "08:00:00",
            "arrival_time": "08:30:00",
            "day_of_week": dow,
            "is_active": True,
        },
    )
    await client.post(
        MOVEMENTS_URL,
        json={
            "train_id": exp_train_id,
            "section_id": section_id,
            "departure_time": "16:00:00",
            "arrival_time": "16:30:00",
            "day_of_week": dow,
            "is_active": True,
        },
    )

    # 4. Create Maintenance Requests (Track + Signal)
    req_trk_resp = await client.post(
        MAINTENANCE_URL,
        json={
            "request_code": f"MR-TRK-{uuid4().hex[:4].upper()}",
            "section_id": section_id,
            "department": "TRACK",
            "activity_type": "Machine Tamping",
            "duration_minutes": 120,
            "priority": "HIGH",
            "deadline": (target_date + timedelta(days=5)).isoformat(),
            "status": "PENDING",
            "metadata_json": {"chainage_km": 24.5, "criticality_index": 80.0},
        },
    )
    assert req_trk_resp.status_code == 201
    req_trk_id = req_trk_resp.json()["id"]

    req_sig_resp = await client.post(
        MAINTENANCE_URL,
        json={
            "request_code": f"MR-SIG-{uuid4().hex[:4].upper()}",
            "section_id": section_id,
            "department": "SIGNAL",
            "activity_type": "Point Machine Testing",
            "duration_minutes": 90,
            "priority": "MEDIUM",
            "deadline": (target_date + timedelta(days=5)).isoformat(),
            "status": "PENDING",
            "metadata_json": {"chainage_km": 25.0, "criticality_index": 65.0},
        },
    )
    assert req_sig_resp.status_code == 201
    req_sig_id = req_sig_resp.json()["id"]

    # 5. Create Compatibility Rule allowing Machine Tamping + Point Machine Testing
    await client.post(
        COMPATIBILITY_URL,
        json={
            "dept_a": "TRACK",
            "activity_a": "Machine Tamping",
            "dept_b": "SIGNAL",
            "activity_b": "Point Machine Testing",
            "is_compatible": True,
            "reason": "Permitted with coordination under G&SR",
        },
    )

    return {
        "section_id": section_id,
        "section_code": section_data["section_code"],
        "vip_train_id": vip_train_id,
        "exp_train_id": exp_train_id,
        "req_trk_id": req_trk_id,
        "req_sig_id": req_sig_id,
    }


# ── 1. Optimizer Run API Tests ───────────────────────────────


@pytest.mark.asyncio
async def test_optimizer_run_endpoint_persists_to_db(client: AsyncClient):
    """Test POST /api/v1/optimizer/run persists Block & BlockJobs to DB."""
    target_date = date(2026, 8, 25)
    setup = await _setup_test_corridor(client, target_date)
    section_id = setup["section_id"]

    payload = {
        "target_date": target_date.isoformat(),
        "section_ids": [section_id],
        "horizon_days": 1,
        "safety_buffer_minutes": 15,
        "min_gap_minutes": 60,
        "alpha_shadow_weight": 1.5,
        "beta_detention_weight": 0.8,
        "persist_to_db": True,
    }

    response = await client.post(OPTIMIZER_RUN_URL, json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["solver_status"] in ("OPTIMAL", "FEASIBLE")
    assert data["total_blocks_scheduled"] >= 1
    assert data["total_maintenance_requests_covered"] >= 1
    assert len(data["scheduled_blocks"]) >= 1

    first_block = data["scheduled_blocks"][0]
    assert first_block["section_id"] == section_id
    assert first_block["status"] == "PROPOSED"
    assert len(first_block["jobs"]) >= 1

    # Verify Block is queryable via GET /blocks
    block_id = first_block["id"]
    block_get = await client.get(f"{BLOCKS_URL}/{block_id}")
    assert block_get.status_code == 200
    b_data = block_get.json()
    assert b_data["id"] == block_id
    assert b_data["status"] == "PROPOSED"
    assert len(b_data["block_jobs"]) >= 1

    # Verify maintenance request status was updated to SCHEDULED
    req_check = await client.get(f"{MAINTENANCE_URL}/{setup['req_trk_id']}")
    assert req_check.status_code == 200
    assert req_check.json()["status"] == "SCHEDULED"


@pytest.mark.asyncio
async def test_optimizer_run_dry_run_does_not_persist(client: AsyncClient):
    """Test POST /api/v1/optimizer/run with persist_to_db=False does not write to DB."""
    target_date = date(2026, 8, 26)
    setup = await _setup_test_corridor(client, target_date)

    payload = {
        "target_date": target_date.isoformat(),
        "section_ids": [setup["section_id"]],
        "persist_to_db": False,
    }

    response = await client.post(OPTIMIZER_RUN_URL, json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_blocks_scheduled"] >= 1

    # Check that block was NOT persisted
    first_block_id = data["scheduled_blocks"][0]["id"]
    block_get = await client.get(f"{BLOCKS_URL}/{first_block_id}")
    assert block_get.status_code == 404

    # Check that maintenance request remains PENDING
    req_check = await client.get(f"{MAINTENANCE_URL}/{setup['req_trk_id']}")
    assert req_check.json()["status"] == "PENDING"


# ── 2. What-If Simulation API Tests ──────────────────────────


@pytest.mark.asyncio
async def test_what_if_simulation_feasible_window(client: AsyncClient):
    """Test POST /api/v1/optimizer/simulate for an unoccupied corridor window."""
    target_date = date(2026, 8, 25)
    setup = await _setup_test_corridor(client, target_date)

    # Simulate window 10:00 - 13:00 (completely unoccupied)
    sim_payload = {
        "simulation_name": "Midday Track & Signal Window",
        "section_id": setup["section_id"],
        "target_date": target_date.isoformat(),
        "start_time": "10:00:00",
        "end_time": "13:00:00",
        "maintenance_request_ids": [setup["req_trk_id"], setup["req_sig_id"]],
        "allow_slw_fallback": False,
    }

    response = await client.post(OPTIMIZER_SIMULATE_URL, json=sim_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["is_feasible"] is True
    assert data["has_vip_train_conflict"] is False
    assert data["conflicting_trains_count"] == 0
    assert data["detention_delta_minutes"] == 0
    assert data["shadow_efficiency_score"] >= 0.0
    assert data["commit_token"] is not None
    assert len(data["commit_token"].split(".")) == 2
    assert "expires_at" in data


@pytest.mark.asyncio
async def test_what_if_simulation_vip_train_conflict(client: AsyncClient):
    """Test POST /api/v1/optimizer/simulate detects Tier 1 VIP conflict and SLW fallback."""
    target_date = date(2026, 8, 25)
    setup = await _setup_test_corridor(client, target_date)

    # Simulate window 07:30 - 09:30 directly encroaching on Rajdhani (08:00 - 08:30)
    sim_payload_no_slw = {
        "simulation_name": "Conflicting Morning Window",
        "section_id": setup["section_id"],
        "target_date": target_date.isoformat(),
        "start_time": "07:30:00",
        "end_time": "09:30:00",
        "maintenance_request_ids": [setup["req_trk_id"]],
        "allow_slw_fallback": False,
    }

    resp1 = await client.post(OPTIMIZER_SIMULATE_URL, json=sim_payload_no_slw)
    assert resp1.status_code == 200
    d1 = resp1.json()
    assert d1["has_vip_train_conflict"] is True
    assert d1["is_feasible"] is False
    assert d1["conflicting_trains_count"] >= 1
    assert any(c["is_hard_conflict"] for c in d1["conflicting_trains"])

    # Now allow SLW fallback on double line -> becomes feasible with advisory
    sim_payload_slw = {**sim_payload_no_slw, "allow_slw_fallback": True}
    resp2 = await client.post(OPTIMIZER_SIMULATE_URL, json=sim_payload_slw)
    assert resp2.status_code == 200
    d2 = resp2.json()
    assert d2["is_feasible"] is True
    assert d2["slw_advisory_required"] is True


# ── 3. Commit Simulation API Tests ───────────────────────────


@pytest.mark.asyncio
async def test_commit_simulation_valid_token(client: AsyncClient):
    """Test POST /api/v1/optimizer/commit-simulation with verified token commits to DB."""
    target_date = date(2026, 8, 25)
    setup = await _setup_test_corridor(client, target_date)

    # 1. Run simulation to obtain signed token
    sim_payload = {
        "section_id": setup["section_id"],
        "target_date": target_date.isoformat(),
        "start_time": "10:00:00",
        "end_time": "12:00:00",
        "maintenance_request_ids": [setup["req_trk_id"]],
    }
    sim_resp = await client.post(OPTIMIZER_SIMULATE_URL, json=sim_payload)
    token = sim_resp.json()["commit_token"]

    # 2. Commit simulation using token
    commit_payload = {
        "commit_token": token,
        "approved_by": "Sr. DOM / Chennai Division",
        "notes": "Approved under daily corridor maintenance slot.",
    }
    commit_resp = await client.post(OPTIMIZER_COMMIT_URL, json=commit_payload)
    assert commit_resp.status_code == 201
    c_data = commit_resp.json()
    assert c_data["success"] is True
    assert c_data["block_id"] is not None
    assert c_data["block_code"].startswith("BLK-")

    # 3. Verify block exists in DB
    block_id = c_data["block_id"]
    get_block = await client.get(f"{BLOCKS_URL}/{block_id}")
    assert get_block.status_code == 200
    assert get_block.json()["status"] == "APPROVED"


@pytest.mark.asyncio
async def test_commit_simulation_tampered_token_rejected(client: AsyncClient):
    """Test POST /api/v1/optimizer/commit-simulation rejects tampered commit tokens."""
    target_date = date(2026, 8, 25)
    setup = await _setup_test_corridor(client, target_date)

    sim_payload = {
        "section_id": setup["section_id"],
        "target_date": target_date.isoformat(),
        "start_time": "10:00:00",
        "end_time": "12:00:00",
        "maintenance_request_ids": [setup["req_trk_id"]],
    }
    sim_resp = await client.post(OPTIMIZER_SIMULATE_URL, json=sim_payload)
    token = sim_resp.json()["commit_token"]

    # Tamper with token signature
    parts = token.split(".")
    tampered_token = f"{parts[0]}.badsignature12345"

    commit_resp = await client.post(
        OPTIMIZER_COMMIT_URL, json={"commit_token": tampered_token}
    )
    assert commit_resp.status_code == 400
    assert "Invalid simulation commit token" in commit_resp.json()["detail"]


@pytest.mark.asyncio
async def test_commit_simulation_expired_token_rejected(client: AsyncClient):
    """Test POST /api/v1/optimizer/commit-simulation rejects expired tokens."""
    target_date = date(2026, 8, 25)
    setup = await _setup_test_corridor(client, target_date)

    # Craft an expired token manually
    expired_payload = {
        "simulation_id": str(uuid4()),
        "section_id": setup["section_id"],
        "target_date": target_date.isoformat(),
        "start_time": "10:00:00",
        "end_time": "12:00:00",
        "duration_minutes": 120,
        "maintenance_request_ids": [setup["req_trk_id"]],
        "total_detention_minutes": 0,
        "allow_slw_fallback": False,
        "expires_at": (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat(),
    }
    payload_json = json.dumps(expired_payload, sort_keys=True, separators=(",", ":"))
    b64_p = base64.urlsafe_b64encode(payload_json.encode("utf-8")).decode("utf-8")
    sig = hmac.new(
        settings.SECRET_KEY.encode("utf-8"), b64_p.encode("utf-8"), hashlib.sha256
    ).hexdigest()
    expired_token = f"{b64_p}.{sig}"

    commit_resp = await client.post(
        OPTIMIZER_COMMIT_URL, json={"commit_token": expired_token}
    )
    assert commit_resp.status_code == 400
    assert "expired" in commit_resp.json()["detail"].lower()


# ── 4. Real-Time Rescheduling API Tests ───────────────────────


@pytest.mark.asyncio
async def test_optimizer_reschedule_major_delay(client: AsyncClient):
    """Test POST /api/v1/optimizer/reschedule shifts block time for delays > 20 mins."""
    sec_id = uuid4()
    active_block_payload = {
        "id": str(uuid4()),
        "block_code": "BLK-20260825-001",
        "section_id": str(sec_id),
        "section_code": "MAS-AJJ",
        "block_date": "2026-08-25",
        "start_time": "10:00:00",
        "end_time": "12:00:00",
        "duration_minutes": 120,
        "is_joint_shadow_block": False,
        "primary_department": "TRACK",
        "participating_departments": ["TRACK"],
        "total_criticality_index": 80.0,
        "shadow_overlap_hours": 0.0,
        "estimated_train_detention_minutes": 0,
        "status": "APPROVED",
        "jobs": [
            {
                "maintenance_request_id": str(uuid4()),
                "request_code": "MR-TRK-001",
                "department": "TRACK",
                "activity_type": "Machine Tamping",
                "duration_minutes": 120,
                "start_offset_minutes": 0,
                "end_offset_minutes": 120,
                "criticality_index": 80.0,
                "is_primary": True,
            }
        ],
    }

    reschedule_payload = {
        "active_block": active_block_payload,
        "delay_minutes": 35,
        "impacted_train_number": "12621",
        "impacted_train_name": "Tamil Nadu Express",
        "is_block_overrun": False,
    }

    resp = await client.post(OPTIMIZER_RESCHEDULE_URL, json=reschedule_payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["action_taken"] == "TIME_SHIFT"
    assert data["success"] is True
    assert data["delay_minutes"] == 35
    assert data["new_start_time"] == "10:35:00"
    assert data["new_end_time"] == "12:35:00"
    assert data["shifted_block"] is not None


@pytest.mark.asyncio
async def test_optimizer_reschedule_block_overrun_slw_advisory(client: AsyncClient):
    """Test POST /api/v1/optimizer/reschedule issues G&SR Chapter 5/15 SLW advisory on overrun."""
    sec_id = uuid4()
    active_block_payload = {
        "id": str(uuid4()),
        "block_code": "BLK-20260825-002",
        "section_id": str(sec_id),
        "section_code": "MAS-AJJ",
        "block_date": "2026-08-25",
        "start_time": "10:00:00",
        "end_time": "12:00:00",
        "duration_minutes": 120,
        "is_joint_shadow_block": False,
        "primary_department": "TRACK",
        "participating_departments": ["TRACK"],
        "total_criticality_index": 85.0,
        "shadow_overlap_hours": 0.0,
        "estimated_train_detention_minutes": 0,
        "status": "ACTIVE",
        "jobs": [],
    }

    reschedule_payload = {
        "active_block": active_block_payload,
        "delay_minutes": 25,
        "impacted_train_number": "12621",
        "impacted_train_name": "Tamil Nadu Express",
        "is_block_overrun": True,
        "has_queued_trains": True,
        "parallel_line_available": True,
        "line_type": "DOUBLE",
        "section_code": "MAS-AJJ",
        "section_name": "Chennai Central - Arakkonam",
        "division": "Chennai",
        "zone": "Southern Railway",
        "private_number": "PN-7744",
    }

    resp = await client.post(OPTIMIZER_RESCHEDULE_URL, json=reschedule_payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["action_taken"] == "SLW_ADVISORY"
    assert data["slw_advisory"] is not None
    assert data["slw_advisory"]["first_pilot_speed_kmph"] == 25
    assert data["slw_advisory"]["facing_points_speed_kmph"] == 15
    assert data["slw_advisory"]["subsequent_train_speed_kmph"] == 45
    assert "SINGLE LINE WORKING" in data["slw_advisory"]["advisory_text"]


# ── 5. Form T/351 State Machine Transition API Tests ─────────


@pytest.mark.asyncio
async def test_block_transition_state_machine(client: AsyncClient):
    """Test full statutory state machine: PROPOSED -> APPROVED -> ACTIVE (with PN) -> COMPLETED (with Reconnection PN)."""
    target_date = date(2026, 8, 25)
    setup = await _setup_test_corridor(client, target_date)

    # 1. Run optimizer to create a PROPOSED block
    run_resp = await client.post(
        OPTIMIZER_RUN_URL,
        json={
            "target_date": target_date.isoformat(),
            "section_ids": [setup["section_id"]],
            "persist_to_db": True,
        },
    )
    scheduled_blk = run_resp.json()["scheduled_blocks"][0]
    block_id = scheduled_blk["id"]
    bundled_req_id = scheduled_blk["jobs"][0]["maintenance_request_id"]

    # Step 1: PROPOSED -> APPROVED
    t1_resp = await client.post(
        f"{BLOCKS_URL}/{block_id}/transition",
        json={
            "target_status": "APPROVED",
            "approved_by": "Sr. DOM / Chennai",
            "remarks": "Approved for possession execution.",
        },
    )
    assert t1_resp.status_code == 200
    assert t1_resp.json()["status"] == "APPROVED"

    # Step 2: Transition APPROVED -> ACTIVE without Private Number (Must Fail with 400)
    t2_fail = await client.post(
        f"{BLOCKS_URL}/{block_id}/transition",
        json={"target_status": "ACTIVE"},
    )
    assert t2_fail.status_code == 400
    assert "Private Number" in t2_fail.json()["detail"]

    # Step 3: Transition APPROVED -> ACTIVE with valid Station Master Private Number
    t2_resp = await client.post(
        f"{BLOCKS_URL}/{block_id}/transition",
        json={
            "target_status": "ACTIVE",
            "disconnection_private_number": "PN-4821",
            "station_master_name": "R. K. Sharma",
            "field_engineer_name": "P. V. Nair",
            "field_engineer_designation": "SSE/Permanent Way/MAS",
        },
    )
    assert t2_resp.status_code == 200
    assert t2_resp.json()["status"] == "ACTIVE"

    # Step 4: Transition ACTIVE -> COMPLETED without Reconnection PN (Must Fail with 400)
    t3_fail = await client.post(
        f"{BLOCKS_URL}/{block_id}/transition",
        json={"target_status": "COMPLETED"},
    )
    assert t3_fail.status_code == 400
    assert "Reconnection Private Number" in t3_fail.json()["detail"]

    # Step 5: Transition ACTIVE -> COMPLETED with valid Reconnection PN + TSR
    t3_resp = await client.post(
        f"{BLOCKS_URL}/{block_id}/transition",
        json={
            "target_status": "COMPLETED",
            "reconnection_private_number": "PN-4899",
            "tsr_imposed": True,
            "tsr_speed_kmph": 45,
            "remarks": "Track restored with 45 km/h caution order for 24 hours.",
        },
    )
    assert t3_resp.status_code == 200
    assert t3_resp.json()["status"] == "COMPLETED"

    # Verify associated MaintenanceRequest status was updated to COMPLETED
    req_check = await client.get(f"{MAINTENANCE_URL}/{bundled_req_id}")
    assert req_check.json()["status"] == "COMPLETED"


@pytest.mark.asyncio
async def test_block_transition_invalid_jump(client: AsyncClient):
    """Test invalid status transition jump (PROPOSED -> COMPLETED) is rejected with 400."""
    target_date = date(2026, 8, 25)
    setup = await _setup_test_corridor(client, target_date)

    run_resp = await client.post(
        OPTIMIZER_RUN_URL,
        json={
            "target_date": target_date.isoformat(),
            "section_ids": [setup["section_id"]],
            "persist_to_db": True,
        },
    )
    block_id = run_resp.json()["scheduled_blocks"][0]["id"]

    # Invalid jump
    resp = await client.post(
        f"{BLOCKS_URL}/{block_id}/transition",
        json={
            "target_status": "COMPLETED",
            "reconnection_private_number": "PN-9999",
        },
    )
    assert resp.status_code == 400
    assert "Invalid transition" in resp.json()["detail"]


# ── 6. Statutory Export API Tests ────────────────────────────


@pytest.mark.asyncio
async def test_export_bdms_payload(client: AsyncClient):
    """Test GET /api/v1/blocks/{block_id}/export-bdms returns CRIS BDMS draft format."""
    target_date = date(2026, 8, 25)
    setup = await _setup_test_corridor(client, target_date)

    run_resp = await client.post(
        OPTIMIZER_RUN_URL,
        json={
            "target_date": target_date.isoformat(),
            "section_ids": [setup["section_id"]],
            "persist_to_db": True,
        },
    )
    block_id = run_resp.json()["scheduled_blocks"][0]["id"]

    resp = await client.get(f"{BLOCKS_URL}/{block_id}/export-bdms")
    assert resp.status_code == 200
    data = resp.json()

    assert data["bdms_message_id"].startswith("BDMS-")
    assert data["division"] == "Chennai"
    assert data["zone"] == "Southern Railway"
    assert data["section_code"] == setup["section_code"]
    assert data["block_code"].startswith("BLK-")
    assert data["total_duration_minutes"] > 0
    assert data["primary_department"] in ("TRACK", "SIGNAL", "TRACTION")
    assert isinstance(data["participating_departments"], list)
    assert data["status"] == "PROPOSED"


@pytest.mark.asyncio
async def test_export_t351_notice(client: AsyncClient):
    """Test GET /api/v1/blocks/{block_id}/t351-notice returns Form T/351 Disconnection payload."""
    target_date = date(2026, 8, 25)
    setup = await _setup_test_corridor(client, target_date)

    run_resp = await client.post(
        OPTIMIZER_RUN_URL,
        json={
            "target_date": target_date.isoformat(),
            "section_ids": [setup["section_id"]],
            "persist_to_db": True,
        },
    )
    block_id = run_resp.json()["scheduled_blocks"][0]["id"]

    # Transition to ACTIVE with PN
    await client.post(
        f"{BLOCKS_URL}/{block_id}/transition",
        json={"target_status": "APPROVED", "approved_by": "Sr. DOM"},
    )
    await client.post(
        f"{BLOCKS_URL}/{block_id}/transition",
        json={
            "target_status": "ACTIVE",
            "disconnection_private_number": "PN-5511",
            "station_master_name": "R. K. Sharma",
        },
    )

    resp = await client.get(f"{BLOCKS_URL}/{block_id}/t351-notice")
    assert resp.status_code == 200
    data = resp.json()

    assert data["form_type"] == "T/351"
    assert data["notice_number"].startswith("T351/")
    assert data["section_code"] == setup["section_code"]
    assert data["disconnection_private_number"] == "PN-5511"
    assert data["station_master_name"] == "R. K. Sharma"
    assert data["status"] == "DISCONNECTED"


@pytest.mark.asyncio
async def test_export_t351_notice_reconnected_form_t351_b(client: AsyncClient):
    """Test GET /api/v1/blocks/{block_id}/t351-notice returns Form T/351-B Reconnection payload when COMPLETED."""
    target_date = date(2026, 8, 25)
    setup = await _setup_test_corridor(client, target_date)

    run_resp = await client.post(
        OPTIMIZER_RUN_URL,
        json={
            "target_date": target_date.isoformat(),
            "section_ids": [setup["section_id"]],
            "persist_to_db": True,
        },
    )
    block_id = run_resp.json()["scheduled_blocks"][0]["id"]

    # Transition through to COMPLETED
    await client.post(
        f"{BLOCKS_URL}/{block_id}/transition",
        json={"target_status": "APPROVED", "approved_by": "Sr. DOM"},
    )
    await client.post(
        f"{BLOCKS_URL}/{block_id}/transition",
        json={
            "target_status": "ACTIVE",
            "disconnection_private_number": "PN-1122",
            "station_master_name": "R. K. Sharma",
        },
    )
    await client.post(
        f"{BLOCKS_URL}/{block_id}/transition",
        json={
            "target_status": "COMPLETED",
            "reconnection_private_number": "PN-9988",
            "tsr_imposed": True,
            "tsr_speed_kmph": 30,
        },
    )

    resp = await client.get(f"{BLOCKS_URL}/{block_id}/t351-notice")
    assert resp.status_code == 200
    data = resp.json()

    assert data["form_type"] == "T/351-B"
    assert data["reconnection_private_number"] == "PN-9988"
    assert data["tsr_imposed"] is True
    assert data["tsr_speed_kmph"] == 30
    assert data["status"] == "RECONNECTED"


@pytest.mark.asyncio
async def test_block_cancellation_resets_requests_to_pending(client: AsyncClient):
    """Test transitioning a block to CANCELLED resets associated MaintenanceRequests to PENDING."""
    target_date = date(2026, 8, 25)
    setup = await _setup_test_corridor(client, target_date)

    run_resp = await client.post(
        OPTIMIZER_RUN_URL,
        json={
            "target_date": target_date.isoformat(),
            "section_ids": [setup["section_id"]],
            "persist_to_db": True,
        },
    )
    scheduled_blk = run_resp.json()["scheduled_blocks"][0]
    block_id = scheduled_blk["id"]
    bundled_req_id = scheduled_blk["jobs"][0]["maintenance_request_id"]

    # Cancel block
    cancel_resp = await client.post(
        f"{BLOCKS_URL}/{block_id}/transition",
        json={"target_status": "CANCELLED", "remarks": "Cancelled due to emergency rake movement."},
    )
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "CANCELLED"

    # Verify maintenance request was reset to PENDING
    req_check = await client.get(f"{MAINTENANCE_URL}/{bundled_req_id}")
    assert req_check.json()["status"] == "PENDING"


@pytest.mark.asyncio
async def test_what_if_simulation_invalid_inputs(client: AsyncClient):
    """Test What-If simulation with non-existent section or empty requests returns appropriate errors."""
    target_date = date(2026, 8, 25)

    # 1. Non-existent section
    resp_bad_sec = await client.post(
        OPTIMIZER_SIMULATE_URL,
        json={
            "section_id": str(uuid4()),
            "target_date": target_date.isoformat(),
            "start_time": "10:00:00",
            "end_time": "12:00:00",
            "maintenance_request_ids": [str(uuid4())],
        },
    )
    assert resp_bad_sec.status_code == 404

    # 2. Non-existent request IDs
    setup = await _setup_test_corridor(client, target_date)
    resp_bad_req = await client.post(
        OPTIMIZER_SIMULATE_URL,
        json={
            "section_id": setup["section_id"],
            "target_date": target_date.isoformat(),
            "start_time": "10:00:00",
            "end_time": "12:00:00",
            "maintenance_request_ids": [str(uuid4())],
        },
    )
    assert resp_bad_req.status_code == 400


@pytest.mark.asyncio
async def test_optimizer_run_empty_section(client: AsyncClient):
    """Test optimizer run when section has no pending requests returns 0 scheduled blocks gracefully."""
    target_date = date(2026, 8, 25)
    sec_resp = await client.post(
        SECTIONS_URL,
        json={
            "section_code": f"EMPTY-{uuid4().hex[:4].upper()}",
            "section_name": "Empty Test Section",
            "division": "Chennai",
            "zone": "Southern Railway",
            "length_km": 40.0,
            "line_type": "DOUBLE",
        },
    )
    sec_id = sec_resp.json()["id"]

    run_resp = await client.post(
        OPTIMIZER_RUN_URL,
        json={
            "target_date": target_date.isoformat(),
            "section_ids": [sec_id],
            "persist_to_db": True,
        },
    )
    assert run_resp.status_code == 200
    data = run_resp.json()
    assert data["total_blocks_scheduled"] == 0
    assert data["total_maintenance_requests_covered"] == 0

