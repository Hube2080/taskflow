#!/bin/zsh

set -u

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/.antigone-runtime"
OLLAMA_PID_FILE="$RUNTIME_DIR/ollama.pid"
OPEN_WEBUI_CONTAINER="open-webui"

info() {
  printf '%s\n' "$1"
}

stopped() {
  printf 'STOPPED %s\n' "$1"
}

warn() {
  printf 'WARN %s\n' "$1"
}

if docker info >/dev/null 2>&1; then
  if docker ps --format '{{.Names}}' | grep -qx "$OPEN_WEBUI_CONTAINER"; then
    if docker stop "$OPEN_WEBUI_CONTAINER" >/dev/null 2>&1; then
      stopped "Open WebUI container $OPEN_WEBUI_CONTAINER"
    else
      warn "Could not stop container $OPEN_WEBUI_CONTAINER"
    fi
  else
    info "Open WebUI container is not running"
  fi
else
  warn "Docker is not reachable, skipping container stop"
fi

if [ -f "$OLLAMA_PID_FILE" ]; then
  OLLAMA_PID="$(cat "$OLLAMA_PID_FILE")"
  if [ -n "$OLLAMA_PID" ] && kill -0 "$OLLAMA_PID" >/dev/null 2>&1; then
    kill "$OLLAMA_PID" >/dev/null 2>&1 || true
    stopped "Ollama process started by scripts/start_services.sh"
  else
    info "Tracked Ollama process is no longer running"
  fi
  rm -f "$OLLAMA_PID_FILE"
else
  info "No script-managed Ollama process found"
fi

info "Home Assistant VM was intentionally left untouched."
