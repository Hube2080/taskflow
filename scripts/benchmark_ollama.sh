#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/.antigone-runtime"
RESULTS_DIR="$RUNTIME_DIR/benchmarks"
MODEL_NAME="qwen2.5:3b"
TAGS_URL="http://localhost:11434/api/tags"
GENERATE_URL="http://localhost:11434/api/generate"
PROMPT="Reply with one short sentence confirming that Antigone local inference is working."
TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"
OUTPUT_FILE="$RESULTS_DIR/ollama-benchmark-$TIMESTAMP.txt"

mkdir -p "$RESULTS_DIR"

if ! curl -sS -m 3 "$TAGS_URL" >/dev/null 2>&1; then
  echo "FAIL Ollama is not reachable at $TAGS_URL"
  exit 1
fi

if ! curl -sS -m 3 "$TAGS_URL" 2>/dev/null | jq -e --arg model "$MODEL_NAME" '.models[]? | select(.name == $model)' >/dev/null; then
  echo "FAIL Model $MODEL_NAME is not available in Ollama"
  exit 1
fi

echo "Benchmarking Ollama model $MODEL_NAME"

python3 - "$GENERATE_URL" "$MODEL_NAME" "$PROMPT" "$OUTPUT_FILE" <<'PY'
import json
import sys
import time
import urllib.request

generate_url, model_name, prompt, output_file = sys.argv[1:5]
payload = json.dumps({
    "model": model_name,
    "prompt": prompt,
    "stream": True,
}).encode("utf-8")

request = urllib.request.Request(
    generate_url,
    data=payload,
    headers={"Content-Type": "application/json"},
    method="POST",
)

start = time.perf_counter()
first_chunk_at = None
first_useful_output_at = None
response_text_parts = []

with urllib.request.urlopen(request, timeout=120) as response:
    for raw_line in response:
        now = time.perf_counter()
        if first_chunk_at is None:
            first_chunk_at = now
        line = raw_line.decode("utf-8").strip()
        if not line:
            continue
        try:
            item = json.loads(line)
        except json.JSONDecodeError:
            continue
        token = item.get("response", "")
        if token:
            response_text_parts.append(token)
            if first_useful_output_at is None and token.strip():
                first_useful_output_at = now
        if item.get("done") is True:
            break

end = time.perf_counter()
ttfb = None if first_chunk_at is None else first_chunk_at - start
ttfu = None if first_useful_output_at is None else first_useful_output_at - start
total = end - start
response_text = "".join(response_text_parts).strip()

lines = [
    f"Model: {model_name}",
    "Reachable: yes",
    f"Time to first chunk: {ttfb:.3f}s" if ttfb is not None else "Time to first chunk: unavailable",
    f"Time to first useful output: {ttfu:.3f}s" if ttfu is not None else "Time to first useful output: unavailable",
    f"Total response time: {total:.3f}s",
    f"Prompt: {prompt}",
    f"Response: {response_text or '[empty]'}",
]

report = "\n".join(lines)
print(report)

with open(output_file, "w", encoding="utf-8") as handle:
    handle.write(report + "\n")
PY

echo "Saved benchmark report to $OUTPUT_FILE"
