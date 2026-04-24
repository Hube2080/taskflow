import { AntigoneMemoryStore, createDefaultAntigoneMemoryPath } from "./store";

let singletonStore: AntigoneMemoryStore | null = null;

export function getAntigoneMemoryStore() {
  if (!singletonStore) {
    singletonStore = new AntigoneMemoryStore(
      process.env.ANTIGONE_MEMORY_DB_PATH ?? createDefaultAntigoneMemoryPath()
    );
  }

  return singletonStore;
}

export { AntigoneMemoryStore, createDefaultAntigoneMemoryPath } from "./store";
