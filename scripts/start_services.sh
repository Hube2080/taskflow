#!/bin/zsh

set -u

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/.antigone-runtime"
OLLAMA_LOG="$RUNTIME_DIR/ollama.log"
OLLAMA_PID_FILE="$RUNTIME_DIR/ollama.pid"
OLLAMA_URL="http://localhost:11434/api/tags"
WEBUI_URL="http://localhost:3000"
OPEN_WEBUI_CONTAINER="open-webui"

mkdir -p "$RUNTIME_DIR"

info() {
  printf '%s\n' "$1"
}

started() {
  printf 'STARTED %s\n' "$1"
}

warn() {
  printf 'WARN %s\n' "$1"
}

wait_for_http() {
  local url="$1"
  local attempts="${2:-10}"
  local delay_seconds="${3:-1}"
  local attempt=1

  while [ "$attempt" -le "$attempts" ]; do
    if curl -sS -I -m 3 "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep "$delay_seconds"
    attempt=$((attempt + 1))
  done

  return 1
}

if curl -sS -m 3 "$OLLAMA_URL" >/dev/null 2>&1; then
  info "Ollama already reachable"
else
  if command -v ollama >/dev/null 2>&1; then
    info "Ollama not reachable, attempting local start via 'ollama serve'"
    nohup ollama serve >"$OLLAMA_LOG" 2>&1 &
    echo $! >"$OLLAMA_PID_FILE"
    sleep 2
    if curl -sS -m 3 "$OLLAMA_URL" >/dev/null 2>&1; then
      started "Ollama"
    else
      warn "Ollama did not become reachable automatically. Check $OLLAMA_LOG"
    fi
  else
    warn "Ollama command not found. Start it manually."
  fi
fi

if curl -sS -I -m 3 "$WEBUI_URL" >/dev/null 2>&1; then
  info "Open WebUI already reachable on $WEBUI_URL"
else
  if docker info >/dev/null 2>&1; then
    if docker ps -a --format '{{.Names}}' | grep -qx "$OPEN_WEBUI_CONTAINER"; then
      info "Attempting to start existing Docker container $OPEN_WEBUI_CONTAINER"
      if docker start "$OPEN_WEBUI_CONTAINER" >/dev/null 2>&1; then
        if wait_for_http "$WEBUI_URL" 15 1; then
          started "Open WebUI container $OPEN_WEBUI_CONTAINER"
        else
          warn "Container started but $WEBUI_URL is still not responding"
        fi
      else
        warn "Docker could not start container $OPEN_WEBUI_CONTAINER"
      fi
    else
      warn "No existing Open WebUI container was found. Create it manually rather than guessing from this repo."
    fi
  else
    warn "Docker is not reachable. Start Docker Desktop manually first."
  fi
fi

info "Home Assistant in UTM remains manual by design. No VM actions were attempted."
