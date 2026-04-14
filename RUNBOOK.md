# Runbook

## Expected local endpoints

- Ollama API: `http://localhost:11434`
- Open WebUI: `http://localhost:3000`
- Docker container name: `open-webui`

Note: port `8080` is the internal container port for Open WebUI in the current setup. The verified host port is `3000`.

## Scripts

- `scripts/check_status.sh`
  - runs local health checks for Docker, Ollama, Open WebUI, and `qwen2.5:3b`
- `scripts/start_services.sh`
  - starts only what can be started conservatively and reversibly
- `scripts/stop_services.sh`
  - stops only the tracked local services this repo can identify safely
- `scripts/benchmark_ollama.sh`
  - runs a small benchmark against `qwen2.5:3b`

## Common commands

```bash
./scripts/check_status.sh
./scripts/start_services.sh
./scripts/stop_services.sh
./scripts/benchmark_ollama.sh
```

## Failure hints

### Docker not reachable

- Open Docker Desktop manually
- Wait until `docker info` succeeds
- Re-run `./scripts/check_status.sh`

### Ollama not reachable

- Check `ollama list`
- If Ollama is installed but not serving, run `./scripts/start_services.sh`
- If needed, inspect `.antigone-runtime/ollama.log`

### Open WebUI not reachable

- Confirm Docker is healthy
- Check whether container `open-webui` exists
- If it exists but is stopped, run `./scripts/start_services.sh`
- After a container start, allow a short warm-up window before concluding that port `3000` failed
- If it does not exist, recreate it manually using the known image and port mapping instead of improvising from this repo

## Do not automate yet

- Home Assistant VM actions inside UTM
- Device-pairing or Apple-account related steps
- Any file operations against personal cloud-storage paths
- Any broad host cleanup or host-wide Docker shutdown
