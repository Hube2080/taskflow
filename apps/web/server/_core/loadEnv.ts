import { config } from "dotenv";
import { existsSync } from "fs";
import path from "path";
import { getRepoRoot } from "./repoRoot";

const cwd = path.resolve(process.cwd());
const repoRoot = getRepoRoot(cwd);
const envDirs = cwd === repoRoot ? [repoRoot] : [repoRoot, cwd];

for (const dir of envDirs) {
  const envPath = path.join(dir, ".env");
  const envLocalPath = path.join(dir, ".env.local");

  if (existsSync(envPath)) {
    config({ path: envPath, override: true });
  }

  if (existsSync(envLocalPath)) {
    config({ path: envLocalPath, override: true });
  }
}
