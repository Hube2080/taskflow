#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VENV_DIR="$ROOT_DIR/.venv"

if [ ! -x "$VENV_DIR/bin/streamlit" ]; then
  echo "Missing Streamlit environment. Run ./scripts/setup_analysis_app.sh first."
  exit 1
fi

cd "$ROOT_DIR"
export STREAMLIT_BROWSER_GATHER_USAGE_STATS=false
export STREAMLIT_SERVER_HEADLESS=true

exec "$VENV_DIR/bin/streamlit" run "$ROOT_DIR/apps/local-assistant/app/antigone_dashboard.py" \
  --server.address localhost \
  --server.port 8501 \
  --server.headless true \
  --browser.gatherUsageStats false
