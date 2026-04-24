import { nanoid } from "nanoid";
import { ANTIGONE_COMMENTS, ANTIGONE_IMPORT_RUNS, ANTIGONE_MILESTONES, ANTIGONE_PROJECT, ANTIGONE_SECTIONS, ANTIGONE_TASKS } from "../../../antigone_seed";

export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";
export type Priority = "none" | "low" | "medium" | "high";
export type IdeaStatus = "inbox" | "reviewing" | "planned" | "rejected" | "shipped";
export type IdeaCategory = "integration" | "automation" | "ai" | "research" | "workflow" | "other";

export interface User {
  id: string;
  name: string;
  initials: string;
  email: string;
  color: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  projectId: string;
  title: string;
  order: number;
  color: string;
}

export interface Task {
  id: string;
  projectId: string;
  sectionId: string;
  parentId: string | null;
  sourceIdeaId: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId: string | null;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  order: number;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface ImportRun {
  id: string;
  projectId: string;
  fileName: string;
  rowCount: number;
  taskCount: number;
  subtaskCount: number;
  importedAt: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: IdeaCategory;
  status: IdeaStatus;
  impact: number;
  effort: number;
  linkedProjectId: string | null;
  linkedTaskId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: "idea" | "project" | "task";
  color: string;
  group: string;
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
  relation: "idea_to_project" | "idea_to_task" | "project_to_task";
}

export interface AppState {
  projects: Project[];
  sections: Section[];
  tasks: Task[];
  comments: Comment[];
  milestones: Milestone[];
  users: User[];
  importRuns: ImportRun[];
  ideas: Idea[];
  currentProjectId: string;
  selectedTaskId: string | null;
}

const USERS: User[] = [
  {
    id: "u1",
    name: "Hube",
    initials: "HU",
    email: "hube@taskflow.local",
    color: "#4F46E5",
  },
  {
    id: "u2",
    name: "Antigone Ops",
    initials: "AO",
    email: "ops@antigone.local",
    color: "#0F766E",
  },
];

const PROJECT: Project = ANTIGONE_PROJECT as unknown as Project;
const SECTIONS: Section[] = ANTIGONE_SECTIONS as unknown as Section[];
const TASKS: Task[] = ANTIGONE_TASKS as unknown as Task[];

const COMMENTS: Comment[] = [];

const MILESTONES: Milestone[] = [
  { id: "milestone_001", projectId: "p_antigone", title: "00 – Projektsteuerung und ADHS-Leitplanken aufsetzen", dueDate: "2026-03-21", completed: false },
  { id: "milestone_002", projectId: "p_antigone", title: "01 – Zielarchitektur finalisieren und Risiken früh testen", dueDate: "2026-03-27", completed: false },
  { id: "milestone_003", projectId: "p_antigone", title: "02 – Pilot-Hardware für das Wohnzimmer beschaffen", dueDate: "2026-04-01", completed: false },
  { id: "milestone_004", projectId: "p_antigone", title: "03 – Mac mini als stabilen 24/7-AI-Server vorbereiten", dueDate: "2026-04-08", completed: false },
  { id: "milestone_005", projectId: "p_antigone", title: "04 – Lokalen AI-Stack auf dem Mac mini installieren", dueDate: "2026-04-16", completed: false },
  { id: "milestone_006", projectId: "p_antigone", title: "05 – Sprachpipeline Ende-zu-Ende aufbauen", dueDate: "2026-04-23", completed: false },
  { id: "milestone_007", projectId: "p_antigone", title: "06 – Sprach-Ausgabe über Sonos und lokale TTS aufbauen", dueDate: "2026-04-30", completed: false },
  { id: "milestone_008", projectId: "p_antigone", title: "07 – Dashboard, Memory und Logs nutzbar machen", dueDate: "2026-05-08", completed: false },
  { id: "milestone_009", projectId: "p_antigone", title: "08 – Sicheren Remote-Zugriff von iPhone und Laptop einrichten", dueDate: "2026-05-15", completed: false },
  { id: "milestone_010", projectId: "p_antigone", title: "09 – Wohnzimmer-Pilot vollständig integrieren und testen", dueDate: "2026-05-24", completed: false },
  { id: "milestone_011", projectId: "p_antigone", title: "10 – Erste sofort nützliche Produktiv-Features umsetzen", dueDate: "2026-06-02", completed: false },
  { id: "milestone_012", projectId: "p_antigone", title: "12 – Betrieb, Wartung und Dokumentation absichern", dueDate: "2026-06-18", completed: false },
  { id: "milestone_013", projectId: "p_antigone", title: "13 – Backlog V2 / Nice-to-have sauber parken", dueDate: "2026-06-25", completed: false },
];

const IMPORT_RUNS: ImportRun[] = [
  {
    id: "import_antigone_001",
    projectId: "p_antigone",
    fileName: "antigone_asana_projektplan.csv",
    rowCount: 154,
    taskCount: 14,
    subtaskCount: 140,
    importedAt: "2026-03-17T08:00:00Z",
  },
];

export const initialState: AppState = {
  projects: [PROJECT],
  sections: SECTIONS,
  tasks: TASKS,
  comments: COMMENTS,
  milestones: MILESTONES,
  users: USERS,
  importRuns: IMPORT_RUNS,
  ideas: [],
  currentProjectId: "p_antigone",
  selectedTaskId: null,
};

export type Action =
  | { type: "SET_CURRENT_PROJECT"; projectId: string }
  | { type: "SELECT_TASK"; taskId: string | null }
  | { type: "UPDATE_TASK"; taskId: string; updates: Partial<Task> }
  | { type: "ADD_TASK"; task: Task }
  | { type: "DELETE_TASK"; taskId: string }
  | { type: "ADD_COMMENT"; comment: Comment }
  | { type: "MOVE_TASK"; taskId: string; sectionId: string; status: TaskStatus }
  | { type: "IMPORT_TASKS"; projectId: string; tasks: Task[]; sections: Section[]; importRun: ImportRun }
  | { type: "ADD_PROJECT"; project: Project; sections: Section[] }
  | { type: "ADD_IDEA"; idea: Idea }
  | { type: "UPDATE_IDEA"; ideaId: string; updates: Partial<Idea> }
  | { type: "DELETE_IDEA"; ideaId: string }
  | { type: "TOGGLE_MILESTONE"; milestoneId: string };

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_CURRENT_PROJECT":
      return { ...state, currentProjectId: action.projectId, selectedTaskId: null };
    case "SELECT_TASK":
      return { ...state, selectedTaskId: action.taskId };
    case "UPDATE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? { ...task, ...action.updates, updatedAt: new Date().toISOString() }
            : task
        ),
      };
    case "ADD_TASK":
      return { ...state, tasks: [...state.tasks, action.task] };
    case "DELETE_TASK":
      {
        const deletedTaskIds = new Set(
          state.tasks
            .filter((task) => task.id === action.taskId || task.parentId === action.taskId)
            .map((task) => task.id)
        );

      return {
        ...state,
        tasks: state.tasks.filter((task) => !deletedTaskIds.has(task.id)),
        comments: state.comments.filter((comment) => !deletedTaskIds.has(comment.taskId)),
        selectedTaskId:
          state.selectedTaskId && deletedTaskIds.has(state.selectedTaskId) ? null : state.selectedTaskId,
      };
      }
    case "ADD_COMMENT":
      return { ...state, comments: [...state.comments, action.comment] };
    case "MOVE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? { ...task, sectionId: action.sectionId, status: action.status, updatedAt: new Date().toISOString() }
            : task
        ),
      };
    case "IMPORT_TASKS": {
      const existingSectionIds = state.sections.map((section) => section.id);
      const newSections = action.sections.filter((section) => !existingSectionIds.includes(section.id));
      return {
        ...state,
        tasks: [...state.tasks, ...action.tasks],
        sections: [...state.sections, ...newSections],
        importRuns: [...state.importRuns, action.importRun],
        currentProjectId: action.projectId,
      };
    }
    case "ADD_PROJECT":
      return {
        ...state,
        projects: [...state.projects, action.project],
        sections: [...state.sections, ...action.sections],
        currentProjectId: action.project.id,
        selectedTaskId: null,
      };
    case "ADD_IDEA":
      return {
        ...state,
        ideas: [action.idea, ...state.ideas],
      };
    case "UPDATE_IDEA":
      return {
        ...state,
        ideas: state.ideas.map((idea) =>
          idea.id === action.ideaId
            ? { ...idea, ...action.updates, updatedAt: new Date().toISOString() }
            : idea
        ),
      };
    case "DELETE_IDEA":
      return {
        ...state,
        ideas: state.ideas.filter((idea) => idea.id !== action.ideaId),
      };
    case "TOGGLE_MILESTONE":
      return {
        ...state,
        milestones: state.milestones.map((milestone) =>
          milestone.id === action.milestoneId
            ? { ...milestone, completed: !milestone.completed }
            : milestone
        ),
      };
    default:
      return state;
  }
}

export function getProjectTasks(state: AppState, projectId: string): Task[] {
  return state.tasks.filter((task) => task.projectId === projectId);
}

export function getTopLevelTasks(state: AppState, projectId: string): Task[] {
  return state.tasks.filter((task) => task.projectId === projectId && task.parentId === null);
}

export function getSubtasks(state: AppState, parentId: string): Task[] {
  return state.tasks.filter((task) => task.parentId === parentId).sort((a, b) => a.order - b.order);
}

export function getTaskComments(state: AppState, taskId: string): Comment[] {
  return state.comments.filter((comment) => comment.taskId === taskId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getSectionTasks(state: AppState, sectionId: string): Task[] {
  return state.tasks.filter((task) => task.sectionId === sectionId && task.parentId === null).sort((a, b) => a.order - b.order);
}

export function getProjectSections(state: AppState, projectId: string): Section[] {
  return state.sections.filter((section) => section.projectId === projectId).sort((a, b) => a.order - b.order);
}

export function getProjectMilestones(state: AppState, projectId: string): Milestone[] {
  return state.milestones.filter((milestone) => milestone.projectId === projectId);
}

export function getUserById(state: AppState, userId: string): User | undefined {
  return state.users.find((user) => user.id === userId);
}

export function getTaskById(state: AppState, taskId: string): Task | undefined {
  return state.tasks.find((task) => task.id === taskId);
}

export function getProjectStats(state: AppState, projectId: string) {
  const tasks = getTopLevelTasks(state, projectId);
  const total = tasks.length;
  const done = tasks.filter((task) => task.status === "done").length;
  const inProgress = tasks.filter((task) => task.status === "in_progress").length;
  const overdue = tasks.filter(
    (task) => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done"
  ).length;

  return {
    total,
    done,
    inProgress,
    overdue,
    progress: total > 0 ? Math.round((done / total) * 100) : 0,
  };
}

export function createTask(projectId: string, sectionId: string, title: string, parentId: string | null = null): Task {
  return {
    id: nanoid(8),
    projectId,
    sectionId,
    parentId,
    sourceIdeaId: null,
    title,
    description: "",
    status: "todo",
    priority: "none",
    assigneeId: null,
    startDate: null,
    dueDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    order: 999,
  };
}

export function createProject(title: string, description: string, color: string): Project {
  const now = new Date().toISOString();

  return {
    id: `p_${nanoid(8)}`,
    title,
    description,
    color,
    createdAt: now,
    updatedAt: now,
  };
}

export function createDefaultSections(projectId: string): Section[] {
  const baseSections: Array<{ title: string; color: string }> = [
    { title: "Backlog", color: "#94A3B8" },
    { title: "To Do", color: "#6366F1" },
    { title: "In Arbeit", color: "#F59E0B" },
    { title: "Review", color: "#7C3AED" },
    { title: "Erledigt", color: "#10B981" },
  ];

  return baseSections.map((section, index) => ({
    id: `section_${projectId}_${index + 1}`,
    projectId,
    title: section.title,
    order: index,
    color: section.color,
  }));
}

export function createIdea(input: {
  title: string;
  description: string;
  category: IdeaCategory;
  status: IdeaStatus;
  impact: number;
  effort: number;
  linkedProjectId?: string | null;
}): Idea {
  const now = new Date().toISOString();

  return {
    id: `idea_${nanoid(8)}`,
    title: input.title,
    description: input.description,
    category: input.category,
    status: input.status,
    impact: input.impact,
    effort: input.effort,
    linkedProjectId: input.linkedProjectId ?? null,
    linkedTaskId: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function getProjectDefaultSectionId(state: AppState, projectId: string): string | null {
  const sections = getProjectSections(state, projectId);
  return sections[0]?.id ?? null;
}

export function getKnowledgeGraph(state: AppState): { nodes: KnowledgeGraphNode[]; edges: KnowledgeGraphEdge[] } {
  const nodes: KnowledgeGraphNode[] = [
    ...state.projects.map((project) => ({
      id: project.id,
      label: project.title,
      type: "project" as const,
      color: project.color,
      group: "projects",
    })),
    ...state.ideas.map((idea) => ({
      id: idea.id,
      label: idea.title,
      type: "idea" as const,
      color:
        idea.status === "planned"
          ? "#2563EB"
          : idea.status === "shipped"
          ? "#059669"
          : idea.status === "rejected"
          ? "#E11D48"
          : "#7C3AED",
      group: "ideas",
    })),
    ...state.tasks
      .filter((task) => task.parentId === null)
      .map((task) => ({
        id: task.id,
        label: task.title,
        type: "task" as const,
        color: STATUS_CONFIG[task.status].color,
        group: "tasks",
      })),
  ];

  const edges: KnowledgeGraphEdge[] = [
    ...state.ideas.flatMap((idea) => {
      const linkedEdges: KnowledgeGraphEdge[] = [];
      if (idea.linkedProjectId) {
        linkedEdges.push({
          id: `edge_${idea.id}_${idea.linkedProjectId}`,
          source: idea.id,
          target: idea.linkedProjectId,
          relation: "idea_to_project",
        });
      }
      if (idea.linkedTaskId) {
        linkedEdges.push({
          id: `edge_${idea.id}_${idea.linkedTaskId}`,
          source: idea.id,
          target: idea.linkedTaskId,
          relation: "idea_to_task",
        });
      }
      return linkedEdges;
    }),
    ...state.tasks
      .filter((task) => task.parentId === null)
      .map((task) => ({
        id: `edge_${task.projectId}_${task.id}`,
        source: task.projectId,
        target: task.id,
        relation: "project_to_task" as const,
      })),
  ];

  return { nodes, edges };
}

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  backlog: { label: "Backlog", color: "#94A3B8" },
  todo: { label: "To Do", color: "#6366F1" },
  in_progress: { label: "In Arbeit", color: "#F59E0B" },
  review: { label: "Review", color: "#7C3AED" },
  done: { label: "Erledigt", color: "#10B981" },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  none: { label: "Keine", color: "#94A3B8", bg: "border-slate-200 text-slate-500 bg-slate-50" },
  low: { label: "Niedrig", color: "#22C55E", bg: "border-emerald-200 text-emerald-700 bg-emerald-50" },
  medium: { label: "Mittel", color: "#F59E0B", bg: "border-amber-200 text-amber-700 bg-amber-50" },
  high: { label: "Hoch", color: "#EF4444", bg: "border-red-200 text-red-700 bg-red-50" },
};

export const IDEA_STATUS_CONFIG: Record<IdeaStatus, { label: string; badgeClassName: string }> = {
  inbox: { label: "Inbox", badgeClassName: "border-slate-200 text-slate-600 bg-slate-50" },
  reviewing: { label: "Bewerten", badgeClassName: "border-amber-200 text-amber-700 bg-amber-50" },
  planned: { label: "Geplant", badgeClassName: "border-blue-200 text-blue-700 bg-blue-50" },
  rejected: { label: "Verworfen", badgeClassName: "border-rose-200 text-rose-700 bg-rose-50" },
  shipped: { label: "Umgesetzt", badgeClassName: "border-emerald-200 text-emerald-700 bg-emerald-50" },
};

export const IDEA_CATEGORY_CONFIG: Record<IdeaCategory, { label: string }> = {
  integration: { label: "Integration" },
  automation: { label: "Automation" },
  ai: { label: "AI" },
  research: { label: "Research" },
  workflow: { label: "Workflow" },
  other: { label: "Sonstiges" },
};
