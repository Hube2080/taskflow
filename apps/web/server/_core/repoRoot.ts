import { existsSync } from "fs";
import path from "path";

function isRepoRoot(candidate: string) {
  return existsSync(path.join(candidate, "pnpm-workspace.yaml")) || existsSync(path.join(candidate, ".git"));
}

export function getRepoRoot(startDir: string = process.cwd()) {
  let current = path.resolve(startDir);

  while (true) {
    if (isRepoRoot(current)) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return path.resolve(import.meta.dirname, "../../../");
    }
    current = parent;
  }
}

export function getRepoDataPath(...parts: string[]) {
  return path.join(getRepoRoot(), ...parts);
}
