#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VENV_DIR="$ROOT_DIR/.venv"

if [ ! -x "$VENV_DIR/bin/python" ]; then
  echo "Missing .venv. Run ./scripts/setup_analysis_app.sh first."
  exit 1
fi

cd "$ROOT_DIR"

if [ "${1:-}" = "--demo" ] || [ $# -eq 0 ]; then
  "$VENV_DIR/bin/python" -m src.cli demo
else
  "$VENV_DIR/bin/python" -m src.cli import "$1"
fi
