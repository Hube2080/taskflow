import { config } from "dotenv";
import { existsSync } from "fs";
import path from "path";

const cwd = process.cwd();
const envLocalPath = path.join(cwd, ".env.local");
const envPath = path.join(cwd, ".env");

if (existsSync(envPath)) {
  config({ path: envPath });
}

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath, override: true });
}
