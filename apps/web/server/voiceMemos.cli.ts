import "./_core/loadEnv";
import { voiceMemoService } from "./voiceMemos.service";

async function main() {
  const directory = process.argv[2];
  const result = await voiceMemoService.importFromDirectory(directory);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
