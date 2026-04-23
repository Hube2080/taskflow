from __future__ import annotations

from collections import Counter
from datetime import date, datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from .storage import append_jsonl, read_jsonl, resolve_root


MEDICATION_STATUSES = ("taken", "skipped", "delayed")


def medications_path(root: str | Path | None = None) -> Path:
    return resolve_root(root) / "data" / "medications" / "medications.jsonl"


def normalize_status(status: str) -> str:
    normalized = status.strip().lower()
    if normalized not in MEDICATION_STATUSES:
        raise ValueError(f"status must be one of {', '.join(MEDICATION_STATUSES)}")
    return normalized


def add_medication_event(
    *,
    medication_name: str,
    dose: str,
    planned_time: str,
    actual_time: str,
    status: str,
    notes: str = "",
    event_date: str | None = None,
    root: str | Path | None = None,
) -> dict[str, Any]:
    now = datetime.now()
    record = {
        "id": f"med_{uuid4().hex}",
        "created_at": now.isoformat(),
        "date": event_date or date.today().isoformat(),
        "medication_name": medication_name.strip(),
        "dose": dose.strip(),
        "planned_time": planned_time.strip(),
        "actual_time": actual_time.strip(),
        "status": normalize_status(status),
        "notes": notes.strip(),
    }
    append_jsonl(medications_path(root), record)
    return record


def list_medication_events(root: str | Path | None = None, limit: int | None = None) -> list[dict[str, Any]]:
    records = read_jsonl(medications_path(root))
    records.sort(key=lambda item: item.get("created_at", ""), reverse=True)
    if limit is not None:
        return records[:limit]
    return records


def medication_summary(root: str | Path | None = None) -> dict[str, Any]:
    records = list_medication_events(root)
    today = date.today().isoformat()
    today_records = [record for record in records if record.get("date") == today]
    status_counts = Counter(record.get("status", "unknown") for record in records)
    adherence_scores = {"taken": 1.0, "delayed": 0.5, "skipped": 0.0}
    scored = [adherence_scores[record.get("status", "")] for record in records if record.get("status") in adherence_scores]
    return {
        "total": len(records),
        "today_count": len(today_records),
        "status_counts": dict(status_counts),
        "adherence_average": round(sum(scored) / len(scored), 3) if scored else None,
        "latest": records[0] if records else None,
    }
