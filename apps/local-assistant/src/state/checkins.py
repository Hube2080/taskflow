from __future__ import annotations

from datetime import date, datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from .storage import append_jsonl, read_jsonl, resolve_root


CHECKIN_SLOTS = ("morning", "midday", "evening")
CHECKIN_MEDICATION_STATUSES = ("not_logged", "taken", "skipped", "delayed")


def checkins_path(root: str | Path | None = None) -> Path:
    return resolve_root(root) / "data" / "checkins" / "checkins.jsonl"


def clamp_scale(value: int | float | str | None, default: int = 3) -> int:
    try:
        numeric = int(value) if value is not None else default
    except (TypeError, ValueError):
        numeric = default
    return max(1, min(5, numeric))


def normalize_slot(slot: str) -> str:
    normalized = slot.strip().lower()
    if normalized not in CHECKIN_SLOTS:
        raise ValueError(f"slot must be one of {', '.join(CHECKIN_SLOTS)}")
    return normalized


def normalize_medication_status(status: str | None) -> str:
    normalized = (status or "not_logged").strip().lower()
    if normalized not in CHECKIN_MEDICATION_STATUSES:
        raise ValueError(f"medication_status must be one of {', '.join(CHECKIN_MEDICATION_STATUSES)}")
    return normalized


def add_checkin(
    *,
    slot: str,
    mood: int,
    energy: int,
    stress: int,
    focus: int,
    sleep_quality: int,
    medication_status: str = "not_logged",
    food_eaten: str = "",
    water_intake: int | float = 0,
    notes: str = "",
    checkin_date: str | None = None,
    root: str | Path | None = None,
) -> dict[str, Any]:
    now = datetime.now()
    record = {
        "id": f"checkin_{uuid4().hex}",
        "created_at": now.isoformat(),
        "date": checkin_date or date.today().isoformat(),
        "slot": normalize_slot(slot),
        "mood": clamp_scale(mood),
        "energy": clamp_scale(energy),
        "stress": clamp_scale(stress),
        "focus": clamp_scale(focus),
        "sleep_quality": clamp_scale(sleep_quality),
        "medication_status": normalize_medication_status(medication_status),
        "food_eaten": food_eaten.strip(),
        "water_intake": max(0.0, float(water_intake or 0)),
        "notes": notes.strip(),
    }
    append_jsonl(checkins_path(root), record)
    return record


def list_checkins(root: str | Path | None = None, limit: int | None = None) -> list[dict[str, Any]]:
    records = read_jsonl(checkins_path(root))
    records.sort(key=lambda item: item.get("created_at", ""), reverse=True)
    if limit is not None:
        return records[:limit]
    return records


def checkin_summary(root: str | Path | None = None) -> dict[str, Any]:
    records = list_checkins(root)
    today = date.today().isoformat()
    today_records = [record for record in records if record.get("date") == today]
    latest = records[0] if records else None
    return {
        "total": len(records),
        "today_count": len(today_records),
        "today_slots": sorted({record.get("slot") for record in today_records if record.get("slot")}),
        "latest": latest,
    }
