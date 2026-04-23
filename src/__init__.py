from __future__ import annotations

from pathlib import Path
from pkgutil import extend_path


__path__ = extend_path(__path__, __name__)

LOCAL_ASSISTANT_SRC = (
    Path(__file__).resolve().parents[1]
    / "apps"
    / "local-assistant"
    / "src"
)

local_src = str(LOCAL_ASSISTANT_SRC)
if local_src not in __path__:
    __path__.append(local_src)
