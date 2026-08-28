"""
RailBlock Seed Data Script — Uses REAL Indian Railways datasets.

Reads from:
  - data/raw/stations/india_railway_stations.csv   (8,990 stations)
  - data/raw/trains/SF-TRAINS.json                 (1,412 Superfast trains)
  - data/raw/trains/EXP-TRAINS.json                (2,533 Express trains)
  - data/raw/trains/PASS-TRAINS.json               (4,545 Passenger/Mail/Local trains)
  - data/raw/datameet/stations.json                 (GeoJSON, coordinates)

Synthetic (no public dataset exists):
  - Maintenance requests (using real IR activity types from P-Way/S&T/TRD manuals)
  - Resources (realistic equipment names)
  - Compatibility rules (real domain logic)

Usage:
    cd backend
    python -m data.seed_all
    python -m data.seed_all --zone SR --max-sections 40
"""

from __future__ import annotations

import asyncio
import csv
import json
import random
import re
import uuid
from datetime import date, time, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# ── Paths ────────────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent
RAW_DIR = BASE_DIR / "raw"

STATIONS_CSV = RAW_DIR / "stations" / "india_railway_stations.csv"
DATAMEET_JSON = RAW_DIR / "datameet" / "stations.json"
SF_TRAINS_JSON = RAW_DIR / "trains" / "SF-TRAINS.json"
EXP_TRAINS_JSON = RAW_DIR / "trains" / "EXP-TRAINS.json"
PASS_TRAINS_JSON = RAW_DIR / "trains" / "PASS-TRAINS.json"

# ── Config ───────────────────────────────────────────────────────────────────

TARGET_ZONE = "SR"          # Southern Railway — change to CR, NR, etc. as needed
MAX_SECTIONS = 40           # Top N busiest sections by train count
MAX_TRAINS = 200            # Max trains to seed (keeps DB manageable)

# ── Zone Reference ───────────────────────────────────────────────────────────

ZONE_NAMES = {
    "SR": "Southern Railway",
    "CR": "Central Railway",
    "WR": "Western Railway",
    "NR": "Northern Railway",
    "ER": "Eastern Railway",
    "SCR": "South Central Railway",
    "SWR": "South Western Railway",
    "SER": "South Eastern Railway",
    "ECR": "East Central Railway",
    "ECoR": "East Coast Railway",
    "NCR": "North Central Railway",
    "NER": "North Eastern Railway",
    "NFR": "Northeast Frontier Railway",
    "NWR": "North Western Railway",
    "SECR": "South East Central Railway",
    "WCR": "West Central Railway",
    "KR": "Konkan Railway",
}

# Division lookup for SR zone (hardcoded — stable reference data)
SR_DIVISIONS = {
    "MAS": "Chennai", "MS": "Chennai", "BBQ": "Chennai", "PER": "Chennai",
    "TBM": "Chennai", "AJJ": "Chennai", "CGL": "Chennai", "VLK": "Chennai",
    "ABU": "Chennai", "AVD": "Chennai", "TRL": "Chennai", "MSB": "Chennai",
    "VRI": "Villupuram", "SA": "Salem", "TPJ": "Tiruchirappalli",
    "MDU": "Madurai", "TEN": "Madurai", "ED": "Salem",
    "CBE": "Salem", "PGT": "Salem", "JTJ": "Salem", "KPD": "Chennai",
    "RU": "Chennai", "WJR": "Chennai", "GPD": "Chennai",
    "MV": "Tiruchirappalli", "TCN": "Madurai", "NCJ": "Madurai",
    "TJ": "Tiruchirappalli", "SRR": "Tiruchirappalli",
    "MEJ": "Villupuram", "VM": "Villupuram", "KDU": "Villupuram",
    "QLN": "Thiruvananthapuram", "TVC": "Thiruvananthapuram",
    "ERS": "Thiruvananthapuram", "SRR": "Thiruvananthapuram",
    "PGT": "Palakkad", "TCR": "Thiruvananthapuram",
}

# ── Maintenance Activities (real IR activity types) ──────────────────────────

MAINTENANCE_ACTIVITIES = {
    "TRACK": [
        ("TRK_TAMP", "Machine Tamping", 120, 240, "HIGH"),
        ("TRK_GRIND", "Rail Grinding (RGM)", 180, 360, "MEDIUM"),
        ("TRK_DSTRS", "Rail Destressing (LWR/CWR)", 120, 180, "HIGH"),
        ("TRK_BCLEAN", "Ballast Cleaning (BCM)", 240, 480, "MEDIUM"),
        ("TRK_WELD", "Thermit/Flash Butt Welding", 60, 120, "CRITICAL"),
        ("TRK_INSP", "USFD Rail Inspection", 60, 90, "HIGH"),
        ("TRK_PACK", "Manual Spot Packing", 30, 60, "LOW"),
        ("TRK_RENEW", "Sleeper/Fastener Renewal", 120, 240, "MEDIUM"),
        ("TRK_GAUGE", "Gauge Correction", 60, 90, "HIGH"),
        ("TRK_DTS", "Dynamic Track Stabilization", 60, 120, "MEDIUM"),
    ],
    "SIGNAL": [
        ("SIG_RELAY", "Relay Room Maintenance", 60, 120, "MEDIUM"),
        ("SIG_POINT", "Point Machine Overhaul", 90, 180, "HIGH"),
        ("SIG_CABLE", "Signal Cable Replacement", 120, 240, "CRITICAL"),
        ("SIG_AXLE", "Axle Counter Calibration", 60, 90, "HIGH"),
        ("SIG_BLOCK", "Block Instrument Testing", 30, 60, "MEDIUM"),
        ("SIG_LED", "LED Signal Lamp Replacement", 30, 45, "LOW"),
        ("SIG_INTLK", "Interlocking Testing", 120, 180, "CRITICAL"),
        ("SIG_TCKT", "Track Circuit Maintenance", 60, 120, "HIGH"),
    ],
    "TRACTION": [
        ("TRC_OHE", "OHE Wire Adjustment", 90, 180, "HIGH"),
        ("TRC_MAST", "Mast/Foundation Inspection", 60, 120, "MEDIUM"),
        ("TRC_INS", "Insulator Cleaning/Replacement", 60, 90, "MEDIUM"),
        ("TRC_PANTO", "Pantograph Clearance Check", 30, 60, "LOW"),
        ("TRC_FEED", "Feeder Line Maintenance", 120, 180, "HIGH"),
        ("TRC_EARTH", "Earthing/Bonding Check", 60, 90, "MEDIUM"),
        ("TRC_SSP", "Sub-Station Power Check", 60, 120, "MEDIUM"),
        ("TRC_SCADA", "SCADA System Maintenance", 90, 120, "HIGH"),
    ],
}

RESOURCES_DATA = {
    "TRACK": [
        "Tamping Machine Unit (09-3X DTE)",
        "Rail Grinding Machine (RGM)",
        "Ballast Cleaning Machine (BCM)",
        "USFD Testing Car",
        "P-Way Gang Unit Alpha",
        "P-Way Gang Unit Beta",
        "Dynamic Track Stabilizer (DTS)",
    ],
    "SIGNAL": [
        "S&T Maintenance Gang A",
        "S&T Maintenance Gang B",
        "Signal Cable Testing Unit",
        "Relay Testing Equipment",
        "Axle Counter Calibration Unit",
    ],
    "TRACTION": [
        "OHE Maintenance Tower Wagon",
        "OHE Inspection Car (Motor Trolley)",
        "Insulator Testing Unit",
        "SCADA Monitoring Team",
        "TRD Gang Unit A",
    ],
}

COMPATIBILITY_RULES = [
    ("TRACK", "Machine Tamping", "TRACK", "Dynamic Track Stabilization", True,
     "DTS follows tamping in standard procedure"),
    ("TRACK", "Machine Tamping", "TRACK", "Gauge Correction", True,
     "Can be done in same block as tamping"),
    ("TRACK", "Machine Tamping", "TRACK", "Rail Grinding (RGM)", False,
     "Different heavy machines cannot operate simultaneously"),
    ("TRACK", "USFD Rail Inspection", "TRACK", "Manual Spot Packing", True,
     "Inspection and minor repairs compatible"),
    ("TRACK", "Machine Tamping", "SIGNAL", "Signal Cable Replacement", True,
     "Cable work alongside tamping if in different sub-sections"),
    ("TRACK", "Machine Tamping", "SIGNAL", "Point Machine Overhaul", False,
     "Tamping near points requires signal to be locked"),
    ("TRACK", "USFD Rail Inspection", "SIGNAL", "Axle Counter Calibration", True,
     "Both are inspection activities, compatible"),
    ("TRACK", "Ballast Cleaning (BCM)", "SIGNAL", "Track Circuit Maintenance", False,
     "BCM disrupts track circuits"),
    ("TRACK", "Machine Tamping", "TRACTION", "OHE Wire Adjustment", False,
     "Safety hazard: OHE work requires power block, tamping requires traffic block"),
    ("TRACK", "USFD Rail Inspection", "TRACTION", "Pantograph Clearance Check", True,
     "Both are inspection activities on different systems"),
    ("TRACK", "Rail Destressing (LWR/CWR)", "TRACTION", "OHE Wire Adjustment", False,
     "Both require full block with different safety protocols"),
    ("TRACK", "Manual Spot Packing", "TRACTION", "Earthing/Bonding Check", True,
     "Minor works compatible with inspection"),
    ("SIGNAL", "Relay Room Maintenance", "TRACTION", "SCADA System Maintenance", True,
     "Both are indoor/control room activities"),
    ("SIGNAL", "Point Machine Overhaul", "TRACTION", "OHE Wire Adjustment", True,
     "Different systems, can work in parallel with coordination"),
    ("SIGNAL", "Signal Cable Replacement", "TRACTION", "Feeder Line Maintenance", False,
     "Both involve cable work, risk of interference"),
    ("SIGNAL", "Interlocking Testing", "TRACTION", "Sub-Station Power Check", False,
     "Interlocking test requires stable power supply"),
    ("SIGNAL", "Relay Room Maintenance", "SIGNAL", "Block Instrument Testing", True,
     "Both S&T routine maintenance"),
    ("SIGNAL", "Point Machine Overhaul", "SIGNAL", "Interlocking Testing", False,
     "Cannot test interlocking while modifying point machines"),
    ("TRACTION", "OHE Wire Adjustment", "TRACTION", "Insulator Cleaning/Replacement", True,
     "Both OHE maintenance activities"),
    ("TRACTION", "OHE Wire Adjustment", "TRACTION", "Sub-Station Power Check", False,
     "Power check requires OHE to be live"),
]


# ══════════════════════════════════════════════════════════════════════════════
#  DATA LOADING
# ══════════════════════════════════════════════════════════════════════════════

def load_stations() -> Dict[str, Dict[str, Any]]:
    """Load stations from CSV → dict keyed by station_code."""
    stations = {}
    with open(STATIONS_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = row["station_code"].strip().upper()
            if not code:
                continue
            stations[code] = {
                "name": row["station_name"].strip(),
                "state": row.get("state", "").strip(),
                "zone": row.get("railway_zone_code", "").strip(),
                "lat": _safe_float(row.get("latitude")),
                "lng": _safe_float(row.get("longitude")),
                "is_junction": row.get("is_junction", "False").strip() == "True",
                "route_count": int(float(row.get("route_count", "0") or "0")),
            }
    print(f"📂 Loaded {len(stations)} stations from CSV")
    return stations


def load_trains() -> List[Dict[str, Any]]:
    """Load all trains from the 3 JSON files with type classification."""
    all_trains = []

    # Superfast trains
    with open(SF_TRAINS_JSON, encoding="utf-8") as f:
        sf_data = json.load(f)
    for t in sf_data:
        t["_type"] = "SUPERFAST"
        t["_priority"] = "HIGH"
    all_trains.extend(sf_data)
    print(f"📂 Loaded {len(sf_data)} Superfast trains")

    # Express trains
    with open(EXP_TRAINS_JSON, encoding="utf-8") as f:
        exp_data = json.load(f)
    for t in exp_data:
        t["_type"] = "EXPRESS"
        t["_priority"] = "MEDIUM"
    all_trains.extend(exp_data)
    print(f"📂 Loaded {len(exp_data)} Express trains")

    # Passenger/Mail/Local trains
    with open(PASS_TRAINS_JSON, encoding="utf-8") as f:
        pass_data = json.load(f)
    for t in pass_data:
        name = t.get("trainName", "").upper()
        number = t.get("trainNumber", "")
        # Classify passenger trains
        if "MAIL" in name:
            t["_type"] = "MAIL"
            t["_priority"] = "MEDIUM"
        elif number.startswith("6") or "LOCAL" in name or "MEMU" in name or "DEMU" in name:
            t["_type"] = "LOCAL"
            t["_priority"] = "LOW"
        else:
            t["_type"] = "LOCAL"
            t["_priority"] = "LOW"
    all_trains.extend(pass_data)
    print(f"📂 Loaded {len(pass_data)} Passenger/Mail/Local trains")
    print(f"📊 Total trains loaded: {len(all_trains)}")

    return all_trains


# ══════════════════════════════════════════════════════════════════════════════
#  PARSING HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _extract_station_code(station_name_str: str) -> Optional[str]:
    """
    Extract station code from route entry.
    Format: 'CHENNAI CENTRAL - MAS' → 'MAS'
    """
    if not station_name_str:
        return None
    parts = station_name_str.rsplit(" - ", 1)
    if len(parts) == 2:
        return parts[1].strip().upper()
    return None


def _parse_time_str(time_str: str) -> Optional[time]:
    """Parse 'HH:MM' time string. Returns None for 'Source'/'Destination'."""
    if not time_str or time_str in ("Source", "Destination", "--", ""):
        return None
    try:
        parts = time_str.strip().split(":")
        h, m = int(parts[0]), int(parts[1])
        return time(hour=h % 24, minute=m)
    except (ValueError, IndexError):
        return None


def _parse_distance(dist_str: str) -> float:
    """Parse '79 kms' → 79.0"""
    if not dist_str:
        return 0.0
    match = re.search(r"([\d.]+)", dist_str)
    return float(match.group(1)) if match else 0.0


def _safe_float(val: Any) -> Optional[float]:
    """Safely convert to float."""
    try:
        return float(val) if val else None
    except (ValueError, TypeError):
        return None


def _running_days_to_list(running_days: Dict[str, bool]) -> List[int]:
    """Convert {'SUN': True, 'MON': False, ...} → [6, ...] (0=Mon, 6=Sun)."""
    day_map = {"MON": 0, "TUE": 1, "WED": 2, "THU": 3, "FRI": 4, "SAT": 5, "SUN": 6}
    return [day_map[d] for d, runs in running_days.items() if runs and d in day_map]


def _normalize_section_key(code_a: str, code_b: str) -> str:
    """Create a normalized section key (alphabetically sorted to avoid A-B / B-A dups)."""
    return f"{min(code_a, code_b)}-{max(code_a, code_b)}"


def _section_display_key(code_a: str, code_b: str) -> str:
    """Display key preserving route direction."""
    return f"{code_a}-{code_b}"


# ══════════════════════════════════════════════════════════════════════════════
#  PROCESSING
# ══════════════════════════════════════════════════════════════════════════════

def process_data(
    stations: Dict[str, Dict],
    all_trains: List[Dict],
    target_zone: str,
    max_sections: int,
    max_trains: int,
) -> Tuple[
    List[Dict],   # sections
    List[Dict],   # trains
    List[Dict],   # movements
]:
    """
    Process raw data into DB-ready records.

    1. Find all trains that pass through target_zone stations
    2. Extract section pairs (consecutive station stops) in that zone
    3. Rank sections by train frequency → keep top N
    4. Build train movement records from real timetable data
    """
    # Identify zone stations
    zone_station_codes: Set[str] = {
        code for code, info in stations.items()
        if info["zone"] == target_zone
    }
    print(f"\n🔍 {target_zone} zone has {len(zone_station_codes)} stations")

    # ── Step 1: Find trains passing through zone + extract section data ──

    # section_key → { code_a, code_b, name, distance_km, train_count, directions }
    section_stats: Dict[str, Dict] = {}
    # train_number → train_data (only trains that touch the zone)
    zone_trains: Dict[str, Dict] = {}
    # (train_number, section_key) → list of movement records
    movement_records: List[Dict] = []

    for train in all_trains:
        route = train.get("trainRoute", [])
        if len(route) < 2:
            continue

        train_number = train.get("trainNumber", "")
        running_days = _running_days_to_list(train.get("runningDays", {}))
        if not running_days:
            continue

        # Parse all stops
        stops = []
        for stop in route:
            code = _extract_station_code(stop.get("stationName", ""))
            if not code:
                continue
            stops.append({
                "code": code,
                "arrives": _parse_time_str(stop.get("arrives", "")),
                "departs": _parse_time_str(stop.get("departs", "")),
                "distance": _parse_distance(stop.get("distance", "")),
                "day": int(stop.get("day", "1")),
            })

        # Check if train has >= 2 stops in the target zone
        zone_stops = [s for s in stops if s["code"] in zone_station_codes]
        if len(zone_stops) < 2:
            continue

        # This train touches the zone — record it
        zone_trains[train_number] = train

        # Extract consecutive section pairs WITHIN the zone
        for i in range(len(stops) - 1):
            s_a = stops[i]
            s_b = stops[i + 1]

            # Both must be in zone
            if s_a["code"] not in zone_station_codes or s_b["code"] not in zone_station_codes:
                continue

            norm_key = _normalize_section_key(s_a["code"], s_b["code"])
            display_key = _section_display_key(s_a["code"], s_b["code"])

            # Calculate section length from distances
            section_length = abs(s_b["distance"] - s_a["distance"])
            if section_length <= 0:
                section_length = 5.0  # fallback

            if norm_key not in section_stats:
                station_a = stations.get(s_a["code"], {})
                station_b = stations.get(s_b["code"], {})
                section_stats[norm_key] = {
                    "code_a": s_a["code"],
                    "code_b": s_b["code"],
                    "name_a": station_a.get("name", s_a["code"]),
                    "name_b": station_b.get("name", s_b["code"]),
                    "display_key": display_key,
                    "distance_km": section_length,
                    "train_count": 0,
                    "train_numbers": set(),
                }

            section_stats[norm_key]["train_count"] += 1
            section_stats[norm_key]["train_numbers"].add(train_number)
            # Update distance if we get a better estimate
            if section_length > 0 and section_stats[norm_key]["distance_km"] <= 5.0:
                section_stats[norm_key]["distance_km"] = section_length

    print(f"🔍 Found {len(section_stats)} unique sections in {target_zone} zone")
    print(f"🔍 Found {len(zone_trains)} trains passing through {target_zone} zone")

    # ── Step 2: Select top sections by train frequency ───────────────────

    sorted_sections = sorted(
        section_stats.values(),
        key=lambda s: s["train_count"],
        reverse=True,
    )
    selected_sections = sorted_sections[:max_sections]

    selected_section_keys = {
        _normalize_section_key(s["code_a"], s["code_b"])
        for s in selected_sections
    }

    # Collect all station codes used in selected sections
    selected_station_codes = set()
    for s in selected_sections:
        selected_station_codes.add(s["code_a"])
        selected_station_codes.add(s["code_b"])

    print(f"✂️  Selected top {len(selected_sections)} sections ({len(selected_station_codes)} stations)")
    for s in selected_sections[:5]:
        print(f"   {s['display_key']}: {s['name_a']} → {s['name_b']} "
              f"({s['distance_km']:.1f} km, {s['train_count']} trains)")
    if len(selected_sections) > 5:
        print(f"   ... and {len(selected_sections) - 5} more")

    # ── Step 3: Filter trains to those using selected sections ────────────

    selected_train_numbers = set()
    for s in selected_sections:
        selected_train_numbers.update(s["train_numbers"])

    # Limit total trains
    if len(selected_train_numbers) > max_trains:
        # Prioritize: keep all SF > EXP > PASS
        prioritized = []
        for tn in selected_train_numbers:
            t = zone_trains[tn]
            prio = {"SUPERFAST": 0, "EXPRESS": 1, "MAIL": 2, "LOCAL": 3}
            prioritized.append((prio.get(t["_type"], 3), tn))
        prioritized.sort()
        selected_train_numbers = {tn for _, tn in prioritized[:max_trains]}

    print(f"✂️  Selected {len(selected_train_numbers)} trains")

    # ── Step 4: Build DB-ready records ───────────────────────────────────

    # Sections
    section_id_map: Dict[str, uuid.UUID] = {}
    db_sections = []

    for sec in selected_sections:
        section_id = uuid.uuid4()
        norm_key = _normalize_section_key(sec["code_a"], sec["code_b"])
        section_id_map[norm_key] = section_id

        station_a = stations.get(sec["code_a"], {})
        station_b = stations.get(sec["code_b"], {})

        # Determine line type from traffic density
        tc = sec["train_count"]
        if tc >= 80:
            line_type = "QUADRUPLE"
        elif tc >= 40:
            line_type = "DOUBLE"
        elif tc >= 15:
            line_type = "DOUBLE"
        else:
            line_type = "SINGLE"

        # Get division from lookup or default
        division = (
            SR_DIVISIONS.get(sec["code_a"])
            or SR_DIVISIONS.get(sec["code_b"])
            or station_a.get("state", "Unknown")
        )

        db_sections.append({
            "id": section_id,
            "section_code": sec["display_key"],
            "section_name": f"{sec['name_a']} - {sec['name_b']}",
            "division": division,
            "zone": ZONE_NAMES.get(target_zone, target_zone),
            "length_km": round(sec["distance_km"], 1),
            "line_type": line_type,
        })

    # Trains
    train_id_map: Dict[str, uuid.UUID] = {}
    db_trains = []

    for tn in selected_train_numbers:
        t = zone_trains[tn]
        train_id = uuid.uuid4()
        train_id_map[tn] = train_id

        db_trains.append({
            "id": train_id,
            "train_number": t["trainNumber"],
            "train_name": t.get("trainName", f"Train {tn}"),
            "train_type": t["_type"],
            "priority": t["_priority"],
        })

    # Train Movements — parse real timetable data
    db_movements = []

    for tn in selected_train_numbers:
        t = zone_trains[tn]
        route = t.get("trainRoute", [])
        running_days = _running_days_to_list(t.get("runningDays", {}))
        train_id = train_id_map[tn]

        stops = []
        for stop in route:
            code = _extract_station_code(stop.get("stationName", ""))
            if not code:
                continue
            stops.append({
                "code": code,
                "arrives": _parse_time_str(stop.get("arrives", "")),
                "departs": _parse_time_str(stop.get("departs", "")),
                "day": int(stop.get("day", "1")),
            })

        for i in range(len(stops) - 1):
            s_a = stops[i]
            s_b = stops[i + 1]
            norm_key = _normalize_section_key(s_a["code"], s_b["code"])

            if norm_key not in section_id_map:
                continue

            section_id = section_id_map[norm_key]

            # Departure from station A
            dep_time = s_a["departs"] or s_a["arrives"] or time(0, 0)
            # Arrival at station B
            arr_time = s_b["arrives"] or s_b["departs"] or time(0, 0)

            # Day offset for multi-day journeys
            day_offset = s_a.get("day", 1) - 1  # day 1 → offset 0

            for base_day in running_days:
                actual_day = (base_day + day_offset) % 7
                db_movements.append({
                    "id": uuid.uuid4(),
                    "train_id": train_id,
                    "section_id": section_id,
                    "departure_time": dep_time,
                    "arrival_time": arr_time,
                    "day_of_week": actual_day,
                    "movement_type": "SCHEDULED",
                    "is_active": True,
                })

    # ── Forecast Freight Movements (Control Office Goods Trains Forecast) ──
    # Generate >= 40 forecast freight train movements across freight sections
    forecast_freight_trains = [
        {
            "train_number": f"FRT-{i:03d}",
            "train_name": f"Anticipated Goods Rake {i:02d} (BOXN Freight)",
            "train_type": "FREIGHT",
            "priority": "LOW",
        }
        for i in range(1, 11)
    ]
    forecast_mov_count = 0
    for ft in forecast_freight_trains:
        ft_id = uuid.uuid4()
        db_trains.append({
            "id": ft_id,
            "train_number": ft["train_number"],
            "train_name": ft["train_name"],
            "train_type": ft["train_type"],
            "priority": ft["priority"],
        })
        # Generate 5 movements per freight rake across sections and days (50 total >= 40)
        for d in range(5):
            sec = random.choice(db_sections)
            dep_h = (d * 4 + 2) % 24
            dep_m = random.choice([0, 15, 30, 45])
            dur = random.randint(45, 90)
            dep_t = time(dep_h, dep_m)
            arr_dt = datetime.combine(date.today(), dep_t) + timedelta(minutes=dur)
            arr_t = arr_dt.time()
            day_dow = (d * 2) % 7

            db_movements.append({
                "id": uuid.uuid4(),
                "train_id": ft_id,
                "section_id": sec["id"],
                "departure_time": dep_t,
                "arrival_time": arr_t,
                "day_of_week": day_dow,
                "movement_type": "FORECAST_FREIGHT",
                "is_active": True,
            })
            forecast_mov_count += 1

    print(f"📊 Built {len(db_sections)} sections, {len(db_trains)} trains, "
          f"{len(db_movements)} movements ({forecast_mov_count} FORECAST_FREIGHT)")

    return db_sections, db_trains, db_movements


def generate_maintenance_requests(
    sections: List[Dict], resources: List[Dict]
) -> List[Dict]:
    """Generate synthetic maintenance requests using real IR activity types."""
    requests = []
    counter = {"TRACK": 0, "SIGNAL": 0, "TRACTION": 0}
    dept_prefix = {"TRACK": "TRK", "SIGNAL": "SIG", "TRACTION": "TRC"}
    today = date.today()

    resource_map: Dict[str, List[uuid.UUID]] = {}
    for r in resources:
        dept = r["department"]
        resource_map.setdefault(dept, []).append(r["id"])

    for section in sections:
        num_requests = random.randint(1, 4)
        departments = random.choices(
            ["TRACK", "SIGNAL", "TRACTION"],
            weights=[0.5, 0.3, 0.2],
            k=num_requests,
        )

        for dept in departments:
            activities = MAINTENANCE_ACTIVITIES[dept]
            activity = random.choice(activities)
            code, name, min_dur, max_dur, default_priority = activity

            counter[dept] += 1
            request_code = f"MR-{dept_prefix[dept]}-{counter[dept]:03d}"

            duration = random.randint(min_dur, max_dur)
            priority_choices = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
            priority_weights = {
                "LOW": [0.1, 0.3, 0.4, 0.2],
                "MEDIUM": [0.05, 0.2, 0.5, 0.25],
                "HIGH": [0.02, 0.1, 0.4, 0.48],
                "CRITICAL": [0.01, 0.05, 0.24, 0.7],
            }
            priority = random.choices(
                priority_choices, weights=priority_weights[default_priority], k=1
            )[0]

            deadline_days = {
                "CRITICAL": random.randint(1, 5),
                "HIGH": random.randint(3, 14),
                "MEDIUM": random.randint(7, 21),
                "LOW": random.randint(14, 30),
            }
            deadline = today + timedelta(days=deadline_days[priority])

            dept_resources = resource_map.get(dept, [])
            resource_id = random.choice(dept_resources) if dept_resources else None

            requests.append({
                "id": uuid.uuid4(),
                "request_code": request_code,
                "section_id": section["id"],
                "department": dept,
                "activity_type": name,
                "duration_minutes": duration,
                "priority": priority,
                "deadline": deadline,
                "status": random.choices(
                    ["PENDING", "SCHEDULED"], weights=[0.8, 0.2], k=1
                )[0],
                "resource_id": resource_id,
                "metadata_json": {
                    "activity_code": code,
                    "section_code": section["section_code"],
                },
            })

    return requests


# ══════════════════════════════════════════════════════════════════════════════
#  DATABASE SEEDING
# ══════════════════════════════════════════════════════════════════════════════

async def seed_database(database_url: str):
    """Seed the database with real + synthetic data."""
    from app.core.database import Base
    import app.models  # noqa: ensure all models loaded

    engine = create_async_engine(database_url, echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    # Create tables (idempotent)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tables ready\n")

    # ── Load raw data ────────────────────────────────────────────────────
    stations = load_stations()
    all_trains = load_trains()

    # ── Process into DB records ──────────────────────────────────────────
    db_sections, db_trains, db_movements = process_data(
        stations, all_trains,
        target_zone=TARGET_ZONE,
        max_sections=MAX_SECTIONS,
        max_trains=MAX_TRAINS,
    )

    async with async_session() as session:
        # ── 1. Sections ──────────────────────────────────────────────────
        from app.models.section import Section
        for s in db_sections:
            session.add(Section(**s))
        await session.flush()
        print(f"✅ {len(db_sections)} sections seeded")

        # ── 2. Trains ────────────────────────────────────────────────────
        from app.models.train import Train
        for t in db_trains:
            session.add(Train(**t))
        await session.flush()
        print(f"✅ {len(db_trains)} trains seeded")

        # ── 3. Resources ─────────────────────────────────────────────────
        from app.models.resource import Resource
        resources = []
        for dept, names in RESOURCES_DATA.items():
            for rname in names:
                r = {
                    "id": uuid.uuid4(),
                    "resource_name": rname,
                    "department": dept,
                    "capacity": random.randint(1, 3),
                    "is_available": random.random() > 0.15,
                }
                resources.append(r)
                session.add(Resource(**r))
        await session.flush()
        print(f"✅ {len(resources)} resources seeded")

        # ── 4. Train Movements ───────────────────────────────────────────
        from app.models.train_movement import TrainMovement
        for m in db_movements:
            session.add(TrainMovement(**m))
        await session.flush()
        print(f"✅ {len(db_movements)} train movements seeded")

        # ── 5. Maintenance Requests ──────────────────────────────────────
        maint_requests = generate_maintenance_requests(db_sections, resources)
        from app.models.maintenance_request import MaintenanceRequest
        for mr in maint_requests:
            session.add(MaintenanceRequest(**mr))
        await session.flush()
        print(f"✅ {len(maint_requests)} maintenance requests seeded")

        # ── 6. Compatibility Rules ───────────────────────────────────────
        from app.models.compatibility_rule import CompatibilityRule
        for rule_data in COMPATIBILITY_RULES:
            dept_a, act_a, dept_b, act_b, is_compat, reason = rule_data
            session.add(CompatibilityRule(
                id=uuid.uuid4(),
                dept_a=dept_a,
                activity_a=act_a,
                dept_b=dept_b,
                activity_b=act_b,
                is_compatible=is_compat,
                reason=reason,
            ))
        await session.flush()
        print(f"✅ {len(COMPATIBILITY_RULES)} compatibility rules seeded")

        await session.commit()

    await engine.dispose()

    print(f"\n{'='*60}")
    print(f"🎉 Database seeding complete!")
    print(f"{'='*60}")
    print(f"   Zone:              {ZONE_NAMES.get(TARGET_ZONE, TARGET_ZONE)} ({TARGET_ZONE})")
    print(f"   Sections:          {len(db_sections)}")
    print(f"   Trains:            {len(db_trains)}")
    print(f"   Resources:         {len(resources)}")
    print(f"   Train Movements:   {len(db_movements)}")
    print(f"   Maint. Requests:   {len(maint_requests)}")
    print(f"   Compat. Rules:     {len(COMPATIBILITY_RULES)}")
    print(f"{'='*60}")


if __name__ == "__main__":
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from app.core.config import settings
    asyncio.run(seed_database(settings.DATABASE_URL))
