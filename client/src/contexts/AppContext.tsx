import { createContext, useContext, useEffect, useReducer, type ReactNode, type Dispatch } from "react";
import { initialState, appReducer, type AppState, type Action } from "@/lib/store";

interface AppContextType {
  state: AppState;
  dispatch: Dispatch<Action>;
}

const AppContext = createContext<AppContextType | null>(null);
const STORAGE_KEY = "taskflow-app-state";
const STORAGE_VERSION = "antigone-v1";
const META_KEY = "taskflow-app-meta";

type PersistedMeta = {
  version?: string;
};

function isValidCurrentProjectId(projects: AppState["projects"], currentProjectId: string | null | undefined) {
  return typeof currentProjectId === "string" && projects.some((project) => project.id === currentProjectId);
}

function loadPersistedState(): AppState {
  if (typeof window === "undefined") return initialState;

  try {
    const metaRaw = window.localStorage.getItem(META_KEY);
    const meta = metaRaw ? (JSON.parse(metaRaw) as PersistedMeta) : null;
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw || meta?.version !== STORAGE_VERSION) {
      window.localStorage.removeItem(STORAGE_KEY);
      return initialState;
    }

    const parsed = JSON.parse(raw) as Partial<AppState>;
    const projects = Array.isArray(parsed.projects) && parsed.projects.length > 0 ? parsed.projects : initialState.projects;
    const sections = Array.isArray(parsed.sections) ? parsed.sections : initialState.sections;
    const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : initialState.tasks;
    const comments = Array.isArray(parsed.comments) ? parsed.comments : initialState.comments;
    const milestones = Array.isArray(parsed.milestones) ? parsed.milestones : initialState.milestones;
    const users = Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : initialState.users;
    const importRuns = Array.isArray(parsed.importRuns) ? parsed.importRuns : initialState.importRuns;

    const hydratedState: AppState = {
      ...initialState,
      ...parsed,
      projects,
      sections,
      tasks,
      comments,
      milestones,
      users,
      importRuns,
      currentProjectId: isValidCurrentProjectId(projects, parsed.currentProjectId) ? parsed.currentProjectId! : initialState.currentProjectId,
      selectedTaskId:
        typeof parsed.selectedTaskId === "string" || parsed.selectedTaskId === null
          ? parsed.selectedTaskId
          : initialState.selectedTaskId,
    };

    const hasAntigoneProject = hydratedState.projects.some((project) => project.id === initialState.currentProjectId);
    if (!hasAntigoneProject) {
      window.localStorage.removeItem(STORAGE_KEY);
      return initialState;
    }

    return hydratedState;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return initialState;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState, loadPersistedState);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.localStorage.setItem(META_KEY, JSON.stringify({ version: STORAGE_VERSION }));
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
