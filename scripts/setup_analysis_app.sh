#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VENV_LINK="$ROOT_DIR/.venv"
VENV_TARGET="${ANTIGONE_VENV_DIR:-$HOME/.cache/antigone-taskflow-venv}"
INSTALL_MODE="${1:-}"
DEFAULT_CONDA_PYTHON="/Users/hubertusvonhaller/anaconda3/bin/python"

if [ -n "${PYTHON_BIN:-}" ]; then
  : # Use explicit caller override.
elif [ -x "$DEFAULT_CONDA_PYTHON" ]; then
  PYTHON_BIN="$DEFAULT_CONDA_PYTHON"
else
  PYTHON_BIN="python3"
fi

cd "$ROOT_DIR"

if [ -L "$VENV_LINK" ]; then
  VENV_DIR="$(readlink "$VENV_LINK")"
elif [ -d "$VENV_LINK" ]; then
  VENV_DIR="$VENV_LINK"
else
  VENV_DIR="$VENV_TARGET"
  "$PYTHON_BIN" -m venv --system-site-packages "$VENV_DIR"
  ln -s "$VENV_DIR" "$VENV_LINK"
fi

if [ ! -x "$VENV_DIR/bin/streamlit" ] || [ "$INSTALL_MODE" = "--force" ] || [ "$INSTALL_MODE" = "--with-ml" ]; then
  "$VENV_DIR/bin/python" -m pip install --disable-pip-version-check -r "$ROOT_DIR/apps/local-assistant/requirements.txt"
else
  echo "Core dependencies already installed; skipping pip install. Use --force to reinstall."
fi

if [ "$INSTALL_MODE" = "--with-ml" ]; then
  "$VENV_DIR/bin/python" -m pip install --disable-pip-version-check -r "$ROOT_DIR/apps/local-assistant/requirements-ml.txt"
fi

mkdir -p \
  "$ROOT_DIR/data/raw_transcripts" \
  "$ROOT_DIR/data/unzipped_imports" \
  "$ROOT_DIR/data/processed" \
  "$ROOT_DIR/outputs/wordclouds" \
  "$ROOT_DIR/outputs/graphs" \
  "$ROOT_DIR/outputs/analysis" \
  "$ROOT_DIR/.antigone-runtime"

echo "Antigone analysis app is ready."
echo "Run: ./scripts/run_analysis_dashboard.sh"
