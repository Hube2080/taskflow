#!/bin/zsh

set -u

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/.antigone-runtime"
MODEL_NAME="qwen2.5:3b"
OLLAMA_URL="http://localhost:11434/api/tags"
WEBUI_URL="http://localhost:3000"
OPEN_WEBUI_CONTAINER="open-webui"

mkdir -p "$RUNTIME_DIR"

pass() {
  printf 'PASS %s\n' "$1"
}

warn() {
  printf 'WARN %s\n' "$1"
}

fail() {
  printf 'FAIL %s\n' "$1"
}

print_section() {
  printf '\n[%s]\n' "$1"
}

print_section "Antigone status"

if docker info >/dev/null 2>&1; then
  pass "Docker is reachable"
else
  fail "Docker is not reachable"
fi

if curl -sS -m 3 "$OLLAMA_URL" >/dev/null 2>&1; then
  pass "Ollama API is reachable"
else
  fail "Ollama API is not reachable at $OLLAMA_URL"
fi

if curl -sS -I -m 3 "$WEBUI_URL" >/dev/null 2>&1; then
  pass "Open WebUI responds on $WEBUI_URL"
else
  fail "Open WebUI is not reachable on $WEBUI_URL"
fi

if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$OPEN_WEBUI_CONTAINER"; then
  pass "Docker container $OPEN_WEBUI_CONTAINER is running"
elif docker ps -a --format '{{.Names}}' 2>/dev/null | grep -qx "$OPEN_WEBUI_CONTAINER"; then
  warn "Docker container $OPEN_WEBUI_CONTAINER exists but is not running"
else
  warn "Docker container $OPEN_WEBUI_CONTAINER was not found"
fi

if curl -sS -m 3 "$OLLAMA_URL" 2>/dev/null | jq -e --arg model "$MODEL_NAME" '.models[]? | select(.name == $model)' >/dev/null; then
  pass "Model $MODEL_NAME is available in Ollama"
else
  fail "Model $MODEL_NAME is not available in Ollama"
fi
