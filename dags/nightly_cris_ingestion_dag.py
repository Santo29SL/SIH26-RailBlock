"""Nightly CRIS Multi-Department Ingestion DAG.

Orchestrates automated batch ingestion from Indian Railways legacy databases:
- TMS (Track Management System)
- SMMS (Signal Maintenance Management System)
- TDMS (Traction Distribution Management System)

Runs every night at 02:00 AM IST (20:30 UTC).
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
import urllib.request
import json
import logging

logger = logging.getLogger("airflow.task")

default_args = {
    "owner": "cris_railblock",
    "depends_on_past": False,
    "email": ["control.office@railblock.gov.in"],
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=3),
}

BACKEND_API_BASE = "http://backend:8000/api/v1"


def ping_backend_health():
    """Verify FastAPI backend is reachable before starting batch ingest."""
    req = urllib.request.Request(f"http://backend:8000/health")
    with urllib.request.urlopen(req, timeout=10) as response:
        status_code = response.getcode()
        if status_code != 200:
            raise RuntimeError(f"Backend healthcheck failed with HTTP {status_code}")
    logger.info("FastAPI backend health verified.")


def ingest_department_defects(department: str):
    """Simulate batch ingestion of legacy records into RailBlock."""
    logger.info(f"Ingesting daily batch for department: {department}")
    sample_records = [
        {
            "section_code": "PER-TRL",
            "activity_type": f"Scheduled {department} Inspection",
            "duration_minutes": 120,
            "days_overdue": 5,
            "priority": "HIGH",
        },
        {
            "section_code": "TRL-AJJ",
            "activity_type": f"Routine {department} Asset Check",
            "duration_minutes": 90,
            "days_overdue": 2,
            "priority": "MEDIUM",
        },
    ]

    for rec in sample_records:
        endpoint = f"{BACKEND_API_BASE}/ingestion/{department.lower()}"
        try:
            payload = json.dumps(rec).encode("utf-8")
            req = urllib.request.Request(
                endpoint,
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=15) as res:
                logger.info(f"Ingested record into {endpoint}: HTTP {res.getcode()}")
        except Exception as e:
            logger.warning(f"Simulated fallback: {e}")


def recompute_backlog_metrics():
    """Trigger AI risk scoring engine to update divisional backlog percentiles."""
    logger.info("Triggering AI risk engine backlog refresh...")
    try:
        req = urllib.request.Request(f"{BACKEND_API_BASE}/maintenance")
        with urllib.request.urlopen(req, timeout=15) as res:
            logger.info("Divisional defect backlog refreshed.")
    except Exception as e:
        logger.warning(f"Simulated backlog refresh: {e}")


with DAG(
    dag_id="nightly_cris_multi_department_ingestion",
    default_args=default_args,
    description="Nightly batch ingestion from CRIS TMS, SMMS, and TDMS portals",
    schedule_interval="30 20 * * *",  # 02:00 AM IST (20:30 UTC)
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=["cris", "ingestion", "tms", "smms", "tdms"],
) as dag:

    check_health = PythonOperator(
        task_id="verify_backend_connectivity",
        python_callable=ping_backend_health,
    )

    tms_task = PythonOperator(
        task_id="ingest_tms_track_defects",
        python_callable=ingest_department_defects,
        op_kwargs={"department": "tms"},
    )

    smms_task = PythonOperator(
        task_id="ingest_smms_signal_defects",
        python_callable=ingest_department_defects,
        op_kwargs={"department": "smms"},
    )

    tdms_task = PythonOperator(
        task_id="ingest_tdms_traction_defects",
        python_callable=ingest_department_defects,
        op_kwargs={"department": "tdms"},
    )

    refresh_backlog = PythonOperator(
        task_id="recompute_divisional_criticality",
        python_callable=recompute_backlog_metrics,
    )

    # Execution graph: healthcheck -> parallel ingestion -> backlog re-scoring
    check_health >> [tms_task, smms_task, tdms_task] >> refresh_backlog
