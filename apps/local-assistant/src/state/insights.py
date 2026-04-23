from __future__ import annotations

from collections import Counter, defaultdict
from typing import Any

import pandas as pd


ADHERENCE_SCORE = {"taken": 1.0, "delayed": 0.5, "skipped": 0.0}
LOW_MOOD_TERMS = {
    "low",
    "sad",
    "heavy",
    "overload",
    "overloaded",
    "shame",
    "ashamed",
    "stress",
    "stressed",
    "erschöpft",
    "ueberfordert",
    "überfordert",
    "scham",
    "stress",
    "traurig",
    "druck",
}


def records_frame(records: list[dict[str, Any]]) -> pd.DataFrame:
    frame = pd.DataFrame(records)
    if frame.empty:
        return frame
    if "date" in frame:
        frame["date"] = pd.to_datetime(frame["date"], errors="coerce").dt.date.astype("string")
    for column in ["mood", "energy", "stress", "focus", "sleep_quality", "water_intake"]:
        if column in frame:
            frame[column] = pd.to_numeric(frame[column], errors="coerce")
    return frame


def daily_checkin_frame(checkins: list[dict[str, Any]]) -> pd.DataFrame:
    frame = records_frame(checkins)
    if frame.empty or "date" not in frame:
        return pd.DataFrame()
    numeric_columns = ["mood", "energy", "stress", "focus", "sleep_quality", "water_intake"]
    available = [column for column in numeric_columns if column in frame]
    grouped = frame.groupby("date", as_index=False)[available].mean()
    if "food_eaten" in frame:
        food = frame.groupby("date")["food_eaten"].apply(lambda values: any(str(value).strip() for value in values)).reset_index()
        food = food.rename(columns={"food_eaten": "food_logged"})
        grouped = grouped.merge(food, on="date", how="left")
    return grouped


def daily_medication_frame(medications: list[dict[str, Any]]) -> pd.DataFrame:
    frame = pd.DataFrame(medications)
    if frame.empty or "date" not in frame:
        return pd.DataFrame()
    frame["date"] = pd.to_datetime(frame["date"], errors="coerce").dt.date.astype("string")
    frame["adherence_score"] = frame["status"].map(ADHERENCE_SCORE)
    return frame.groupby("date", as_index=False).agg(
        adherence_score=("adherence_score", "mean"),
        medication_events=("status", "count"),
        skipped_count=("status", lambda values: int((values == "skipped").sum())),
        delayed_count=("status", lambda values: int((values == "delayed").sum())),
    )


def correlation_summary(checkins: list[dict[str, Any]], medications: list[dict[str, Any]]) -> dict[str, Any]:
    daily_checkins = daily_checkin_frame(checkins)
    daily_meds = daily_medication_frame(medications)
    result: dict[str, Any] = {
        "daily_checkins": daily_checkins.to_dict("records") if not daily_checkins.empty else [],
        "daily_medications": daily_meds.to_dict("records") if not daily_meds.empty else [],
        "correlations": [],
    }
    if daily_checkins.empty:
        return result

    pairs = [
        ("mood", "sleep_quality", "Mood vs sleep"),
        ("focus", "water_intake", "Focus vs water"),
    ]
    for left, right, label in pairs:
        if left in daily_checkins and right in daily_checkins:
            valid = daily_checkins[[left, right]].dropna()
            if len(valid) >= 3 and valid[left].nunique() > 1 and valid[right].nunique() > 1:
                result["correlations"].append(
                    {
                        "label": label,
                        "x": right,
                        "y": left,
                        "n": int(len(valid)),
                        "correlation": round(float(valid[left].corr(valid[right])), 3),
                    }
                )
            else:
                result["correlations"].append({"label": label, "x": right, "y": left, "n": int(len(valid)), "correlation": None})

    if not daily_meds.empty:
        merged = daily_checkins.merge(daily_meds, on="date", how="inner")
        valid = merged[["mood", "adherence_score"]].dropna()
        result["mood_medication_frame"] = merged.to_dict("records")
        if len(valid) >= 3 and valid["mood"].nunique() > 1 and valid["adherence_score"].nunique() > 1:
            result["correlations"].append(
                {
                    "label": "Mood vs medication adherence",
                    "x": "adherence_score",
                    "y": "mood",
                    "n": int(len(valid)),
                    "correlation": round(float(valid["mood"].corr(valid["adherence_score"])), 3),
                }
            )
        else:
            result["correlations"].append(
                {
                    "label": "Mood vs medication adherence",
                    "x": "adherence_score",
                    "y": "mood",
                    "n": int(len(valid)),
                    "correlation": None,
                }
            )
    return result


def low_mood_note_patterns(checkins: list[dict[str, Any]], bundle: dict[str, Any] | None) -> dict[str, Any]:
    low_dates = {
        record.get("date")
        for record in checkins
        if record.get("date") and isinstance(record.get("mood"), (int, float)) and record.get("mood") <= 2
    }
    notes = (bundle or {}).get("notes", [])
    matches: list[dict[str, Any]] = []
    term_counter: Counter[str] = Counter()
    for note in notes:
        text = f"{note.get('title', '')} {note.get('text', '')}".lower()
        hit_terms = sorted(term for term in LOW_MOOD_TERMS if term in text)
        note_date = str(note.get("timestamp", ""))[:10] if note.get("timestamp") else None
        if hit_terms or (note_date and note_date in low_dates):
            term_counter.update(hit_terms)
            matches.append(
                {
                    "title": note.get("title"),
                    "source_file": note.get("source_file"),
                    "timestamp": note.get("timestamp"),
                    "matched_terms": hit_terms,
                    "near_low_mood_date": bool(note_date and note_date in low_dates),
                    "excerpt": note.get("excerpt") or str(note.get("text", ""))[:260],
                }
            )
    return {
        "low_mood_dates": sorted(date for date in low_dates if date),
        "terms": [{"term": term, "count": count} for term, count in term_counter.most_common(20)],
        "matches": matches[:20],
    }
