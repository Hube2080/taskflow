from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any


STYLE_MODES: dict[str, dict[str, Any]] = {
    "calm and clear": {
        "description": "Steady, precise, uncluttered support for overloaded moments.",
        "best_for": "When the user needs orientation, fewer words, and low cognitive load.",
        "avoid": ["dramatic reassurance", "therapy clichés", "long lists", "false certainty"],
        "prefer": ["plain language", "one next step", "specific observations", "low-shame framing"],
        "prompt_guidance": "Answer with calm precision. Reduce noise. Offer one or two practical next steps without moralizing.",
    },
    "warm and encouraging": {
        "description": "Human, kind, and confidence-building without becoming sentimental.",
        "best_for": "When momentum is low but the user still wants a supportive partner.",
        "avoid": ["cheerleading", "patronizing praise", "generic productivity language"],
        "prefer": ["grounded encouragement", "acknowledging effort", "small achievable steps"],
        "prompt_guidance": "Be warm and steady. Name progress concretely. Keep suggestions autonomy-preserving.",
    },
    "concise and direct": {
        "description": "Minimal, decisive, and useful.",
        "best_for": "When the user wants action, not explanation.",
        "avoid": ["overexplaining", "soft hedging", "repeated caveats"],
        "prefer": ["short answers", "clear tradeoffs", "direct next action"],
        "prompt_guidance": "Use brief, direct phrasing. Prioritize the action or decision. Do not pad.",
    },
    "reflective": {
        "description": "Pattern-aware and thoughtful, while staying non-clinical.",
        "best_for": "When the user is making sense of notes, emotions, or recurring friction.",
        "avoid": ["diagnosis", "therapist voice", "premature conclusions"],
        "prefer": ["careful hypotheses", "mirroring patterns", "gentle distinctions"],
        "prompt_guidance": "Reflect patterns as possibilities, not verdicts. Keep language precise and non-pathologizing.",
    },
    "energizing": {
        "description": "Forward-moving, crisp, and activation-oriented.",
        "best_for": "When the user wants to restart momentum without pressure.",
        "avoid": ["hype", "urgency theater", "shame-based motivation"],
        "prefer": ["clear first move", "bounded action", "light momentum"],
        "prompt_guidance": "Create momentum with one bounded action. Keep the tone alive but not performative.",
    },
    "neutral/practical": {
        "description": "Matter-of-fact, operational, and low-emotion.",
        "best_for": "When the user wants a clean systems view.",
        "avoid": ["emotional interpretation", "unneeded empathy statements", "decorative language"],
        "prefer": ["facts", "steps", "interfaces", "clear status"],
        "prompt_guidance": "Stay practical and neutral. Explain only what helps the user decide or act.",
    },
}


def settings_path(root: str | Path | None = None) -> Path:
    repo_root = Path(root).expanduser().resolve() if root is not None else Path(__file__).resolve().parents[4]
    return repo_root / "data" / "settings" / "interaction_style.json"


def default_style_config() -> dict[str, Any]:
    return {
        "selected_mode": "calm and clear",
        "updated_at": datetime.now().isoformat(),
        "custom_notes": "",
        "modes": STYLE_MODES,
    }


def load_style_config(root: str | Path | None = None) -> dict[str, Any]:
    path = settings_path(root)
    if not path.exists():
        return default_style_config()
    try:
        loaded = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return default_style_config()
    config = default_style_config()
    config.update({key: value for key, value in loaded.items() if key != "modes"})
    config["modes"] = STYLE_MODES
    if config["selected_mode"] not in STYLE_MODES:
        config["selected_mode"] = "calm and clear"
    return config


def save_style_config(selected_mode: str, custom_notes: str = "", root: str | Path | None = None) -> dict[str, Any]:
    if selected_mode not in STYLE_MODES:
        raise ValueError(f"Unknown style mode: {selected_mode}")
    config = {
        "selected_mode": selected_mode,
        "updated_at": datetime.now().isoformat(),
        "custom_notes": custom_notes.strip(),
        "modes": STYLE_MODES,
    }
    path = settings_path(root)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(config, indent=2, ensure_ascii=False), encoding="utf-8")
    return config
