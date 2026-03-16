/*
 * TaskFlow Data Store
 * Swiss Precision Design – All data models and state management
 * Uses React context + useReducer for local-first state
 */

import { nanoid } from "nanoid";

// ─── Types ───────────────────────────────────────────────────────────

export type Priority = "high" | "medium" | "low" | "none";
export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  color: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  sectionId: string;
  parentId: string | null;
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

export interface Section {
  id: string;
  projectId: string;
  title: string;
  order: number;
  color: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  color: string;
  createdAt: string;
  updatedAt: string;
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

export interface AppState {
  projects: Project[];
  sections: Section[];
  tasks: Task[];
  comments: Comment[];
  milestones: Milestone[];
  users: User[];
  importRuns: ImportRun[];
  currentProjectId: string | null;
  selectedTaskId: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  high: { label: "Hoch", color: "text-red-600", bg: "bg-red-50 text-red-700 border-red-200" },
  medium: { label: "Mittel", color: "text-amber-600", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  low: { label: "Niedrig", color: "text-blue-600", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  none: { label: "Keine", color: "text-muted-foreground", bg: "bg-muted text-muted-foreground border-border" },
};

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; icon: string }> = {
  backlog: { label: "Backlog", color: "text-gray-400", icon: "circle-dashed" },
  todo: { label: "To Do", color: "text-blue-500", icon: "circle" },
  in_progress: { label: "In Arbeit", color: "text-amber-500", icon: "loader" },
  review: { label: "Review", color: "text-purple-500", icon: "eye" },
  done: { label: "Erledigt", color: "text-green-500", icon: "check-circle-2" },
};

// ─── Sample Data ─────────────────────────────────────────────────────

const USERS: User[] = [
  { id: "u1", name: "Hube", email: "hube@taskflow.app", initials: "HU", color: "#4F46E5" },
  { id: "u2", name: "Sarah Chen", email: "sarah@taskflow.app", initials: "SC", color: "#0891B2" },
  { id: "u3", name: "Max Weber", email: "max@taskflow.app", initials: "MW", color: "#7C3AED" },
  { id: "u4", name: "Lisa Müller", email: "lisa@taskflow.app", initials: "LM", color: "#059669" },
  { id: "u5", name: "Tom Fischer", email: "tom@taskflow.app", initials: "TF", color: "#DC2626" },
];

const PROJECT: Project = {
  id: "p1",
  title: "Website Relaunch 2026",
  description: "Kompletter Relaunch der Unternehmenswebsite mit neuem Design-System, verbesserter Performance und modernem Tech-Stack. Ziel ist eine Steigerung der Conversion-Rate um 40% und eine Verbesserung der Core Web Vitals auf grün.",
  color: "#4F46E5",
  createdAt: "2026-01-15T10:00:00Z",
  updatedAt: "2026-03-16T14:30:00Z",
};

const SECTIONS: Section[] = [
  { id: "s1", projectId: "p1", title: "Planung & Konzept", order: 0, color: "#6366F1" },
  { id: "s2", projectId: "p1", title: "Design", order: 1, color: "#8B5CF6" },
  { id: "s3", projectId: "p1", title: "Entwicklung", order: 2, color: "#0891B2" },
  { id: "s4", projectId: "p1", title: "Content & SEO", order: 3, color: "#059669" },
  { id: "s5", projectId: "p1", title: "Testing & Launch", order: 4, color: "#DC2626" },
];

const MILESTONES: Milestone[] = [
  { id: "m1", projectId: "p1", title: "Konzept abgeschlossen", dueDate: "2026-02-01", completed: true },
  { id: "m2", projectId: "p1", title: "Design-System fertig", dueDate: "2026-03-01", completed: true },
  { id: "m3", projectId: "p1", title: "MVP Development Done", dueDate: "2026-04-15", completed: false },
  { id: "m4", projectId: "p1", title: "Content Migration", dueDate: "2026-05-01", completed: false },
  { id: "m5", projectId: "p1", title: "Go-Live", dueDate: "2026-06-01", completed: false },
];

const TASKS: Task[] = [
  // Planung & Konzept
  { id: "t1", projectId: "p1", sectionId: "s1", parentId: null, title: "Wettbewerbsanalyse durchführen", description: "Analyse der Top-5 Wettbewerber hinsichtlich Design, UX, Performance und Content-Strategie. Ergebnisse in einem Benchmark-Report zusammenfassen.", status: "done", priority: "high", assigneeId: "u2", startDate: "2026-01-15", dueDate: "2026-01-25", createdAt: "2026-01-15T10:00:00Z", updatedAt: "2026-01-25T16:00:00Z", order: 0 },
  { id: "t1a", projectId: "p1", sectionId: "s1", parentId: "t1", title: "Wettbewerber identifizieren", description: "", status: "done", priority: "none", assigneeId: "u2", startDate: "2026-01-15", dueDate: "2026-01-17", createdAt: "2026-01-15T10:00:00Z", updatedAt: "2026-01-17T16:00:00Z", order: 0 },
  { id: "t1b", projectId: "p1", sectionId: "s1", parentId: "t1", title: "UX-Audit der Wettbewerber", description: "", status: "done", priority: "none", assigneeId: "u2", startDate: "2026-01-17", dueDate: "2026-01-22", createdAt: "2026-01-15T10:00:00Z", updatedAt: "2026-01-22T16:00:00Z", order: 1 },
  { id: "t1c", projectId: "p1", sectionId: "s1", parentId: "t1", title: "Benchmark-Report erstellen", description: "", status: "done", priority: "none", assigneeId: "u2", startDate: "2026-01-22", dueDate: "2026-01-25", createdAt: "2026-01-15T10:00:00Z", updatedAt: "2026-01-25T16:00:00Z", order: 2 },
  { id: "t2", projectId: "p1", sectionId: "s1", parentId: null, title: "Informationsarchitektur definieren", description: "Sitemap und Navigation für die neue Website erstellen. Berücksichtigung der SEO-Anforderungen und User-Journey-Analyse.", status: "done", priority: "high", assigneeId: "u1", startDate: "2026-01-20", dueDate: "2026-02-01", createdAt: "2026-01-15T10:00:00Z", updatedAt: "2026-02-01T16:00:00Z", order: 1 },
  { id: "t3", projectId: "p1", sectionId: "s1", parentId: null, title: "Technologie-Stack festlegen", description: "Evaluierung und Entscheidung für Frontend-Framework, CMS, Hosting und Build-Tools. Dokumentation der Architektur-Entscheidungen.", status: "done", priority: "medium", assigneeId: "u3", startDate: "2026-01-25", dueDate: "2026-02-05", createdAt: "2026-01-15T10:00:00Z", updatedAt: "2026-02-05T16:00:00Z", order: 2 },

  // Design
  { id: "t4", projectId: "p1", sectionId: "s2", parentId: null, title: "Design-System erstellen", description: "Aufbau eines vollständigen Design-Systems mit Farben, Typografie, Spacing, Komponenten und Patterns. Dokumentation in Figma und als Code-Bibliothek.", status: "done", priority: "high", assigneeId: "u4", startDate: "2026-02-01", dueDate: "2026-02-28", createdAt: "2026-02-01T10:00:00Z", updatedAt: "2026-02-28T16:00:00Z", order: 0 },
  { id: "t4a", projectId: "p1", sectionId: "s2", parentId: "t4", title: "Farbpalette & Typografie", description: "", status: "done", priority: "none", assigneeId: "u4", startDate: "2026-02-01", dueDate: "2026-02-07", createdAt: "2026-02-01T10:00:00Z", updatedAt: "2026-02-07T16:00:00Z", order: 0 },
  { id: "t4b", projectId: "p1", sectionId: "s2", parentId: "t4", title: "UI-Komponenten designen", description: "", status: "done", priority: "none", assigneeId: "u4", startDate: "2026-02-07", dueDate: "2026-02-20", createdAt: "2026-02-01T10:00:00Z", updatedAt: "2026-02-20T16:00:00Z", order: 1 },
  { id: "t4c", projectId: "p1", sectionId: "s2", parentId: "t4", title: "Design-Tokens exportieren", description: "", status: "done", priority: "none", assigneeId: "u4", startDate: "2026-02-20", dueDate: "2026-02-28", createdAt: "2026-02-01T10:00:00Z", updatedAt: "2026-02-28T16:00:00Z", order: 2 },
  { id: "t5", projectId: "p1", sectionId: "s2", parentId: null, title: "Homepage-Design", description: "Wireframes und High-Fidelity-Mockups für die Homepage. Hero-Bereich, Feature-Showcase, Testimonials und CTA-Bereiche.", status: "done", priority: "high", assigneeId: "u4", startDate: "2026-02-15", dueDate: "2026-03-05", createdAt: "2026-02-15T10:00:00Z", updatedAt: "2026-03-05T16:00:00Z", order: 1 },
  { id: "t6", projectId: "p1", sectionId: "s2", parentId: null, title: "Responsive Breakpoints testen", description: "Alle Designs auf Mobile, Tablet und Desktop testen und optimieren.", status: "review", priority: "medium", assigneeId: "u4", startDate: "2026-03-01", dueDate: "2026-03-20", createdAt: "2026-03-01T10:00:00Z", updatedAt: "2026-03-15T16:00:00Z", order: 2 },

  // Entwicklung
  { id: "t7", projectId: "p1", sectionId: "s3", parentId: null, title: "Frontend-Architektur aufsetzen", description: "Projekt-Setup mit Next.js 15, TypeScript, Tailwind CSS 4. CI/CD-Pipeline, Linting, Testing-Framework und Deployment-Konfiguration.", status: "done", priority: "high", assigneeId: "u3", startDate: "2026-02-10", dueDate: "2026-02-20", createdAt: "2026-02-10T10:00:00Z", updatedAt: "2026-02-20T16:00:00Z", order: 0 },
  { id: "t8", projectId: "p1", sectionId: "s3", parentId: null, title: "Komponentenbibliothek implementieren", description: "Umsetzung aller Design-System-Komponenten als React-Komponenten mit Storybook-Dokumentation.", status: "in_progress", priority: "high", assigneeId: "u3", startDate: "2026-02-25", dueDate: "2026-03-25", createdAt: "2026-02-25T10:00:00Z", updatedAt: "2026-03-15T16:00:00Z", order: 1 },
  { id: "t8a", projectId: "p1", sectionId: "s3", parentId: "t8", title: "Basis-Komponenten (Button, Input, Card)", description: "", status: "done", priority: "none", assigneeId: "u3", startDate: "2026-02-25", dueDate: "2026-03-05", createdAt: "2026-02-25T10:00:00Z", updatedAt: "2026-03-05T16:00:00Z", order: 0 },
  { id: "t8b", projectId: "p1", sectionId: "s3", parentId: "t8", title: "Layout-Komponenten (Header, Footer, Nav)", description: "", status: "in_progress", priority: "none", assigneeId: "u3", startDate: "2026-03-05", dueDate: "2026-03-15", createdAt: "2026-02-25T10:00:00Z", updatedAt: "2026-03-15T16:00:00Z", order: 1 },
  { id: "t8c", projectId: "p1", sectionId: "s3", parentId: "t8", title: "Komplexe Komponenten (Carousel, Modal, Tabs)", description: "", status: "todo", priority: "none", assigneeId: "u3", startDate: "2026-03-15", dueDate: "2026-03-25", createdAt: "2026-02-25T10:00:00Z", updatedAt: "2026-03-15T16:00:00Z", order: 2 },
  { id: "t9", projectId: "p1", sectionId: "s3", parentId: null, title: "CMS-Integration", description: "Headless CMS anbinden (Sanity oder Contentful). Content-Modelle definieren, API-Anbindung und Preview-Modus implementieren.", status: "todo", priority: "medium", assigneeId: "u5", startDate: "2026-03-20", dueDate: "2026-04-10", createdAt: "2026-03-01T10:00:00Z", updatedAt: "2026-03-15T16:00:00Z", order: 2 },
  { id: "t10", projectId: "p1", sectionId: "s3", parentId: null, title: "Performance-Optimierung", description: "Lazy Loading, Image Optimization, Code Splitting, Caching-Strategie. Ziel: Lighthouse Score > 95 in allen Kategorien.", status: "backlog", priority: "high", assigneeId: "u3", startDate: null, dueDate: "2026-04-30", createdAt: "2026-03-01T10:00:00Z", updatedAt: "2026-03-15T16:00:00Z", order: 3 },

  // Content & SEO
  { id: "t11", projectId: "p1", sectionId: "s4", parentId: null, title: "Content-Audit durchführen", description: "Bestehenden Content analysieren, bewerten und Migrationsstrategie festlegen. Identifikation von Content-Lücken.", status: "in_progress", priority: "medium", assigneeId: "u2", startDate: "2026-03-01", dueDate: "2026-03-25", createdAt: "2026-03-01T10:00:00Z", updatedAt: "2026-03-15T16:00:00Z", order: 0 },
  { id: "t12", projectId: "p1", sectionId: "s4", parentId: null, title: "SEO-Strategie entwickeln", description: "Keyword-Recherche, Meta-Tags, Schema Markup, Sitemap und Redirect-Mapping für den Relaunch.", status: "todo", priority: "high", assigneeId: "u2", startDate: "2026-03-15", dueDate: "2026-04-05", createdAt: "2026-03-01T10:00:00Z", updatedAt: "2026-03-15T16:00:00Z", order: 1 },
  { id: "t13", projectId: "p1", sectionId: "s4", parentId: null, title: "Neue Texte schreiben", description: "Copywriting für alle Hauptseiten: Homepage, About, Services, Kontakt. Tonalität: professionell, klar, einladend.", status: "backlog", priority: "medium", assigneeId: "u2", startDate: null, dueDate: "2026-04-20", createdAt: "2026-03-01T10:00:00Z", updatedAt: "2026-03-15T16:00:00Z", order: 2 },

  // Testing & Launch
  { id: "t14", projectId: "p1", sectionId: "s5", parentId: null, title: "Cross-Browser-Testing", description: "Systematisches Testing auf Chrome, Firefox, Safari, Edge. Mobile Testing auf iOS und Android.", status: "backlog", priority: "high", assigneeId: "u5", startDate: null, dueDate: "2026-05-15", createdAt: "2026-03-01T10:00:00Z", updatedAt: "2026-03-15T16:00:00Z", order: 0 },
  { id: "t15", projectId: "p1", sectionId: "s5", parentId: null, title: "Accessibility-Audit", description: "WCAG 2.1 AA Compliance sicherstellen. Screen-Reader-Tests, Keyboard-Navigation, Farbkontraste prüfen.", status: "backlog", priority: "medium", assigneeId: "u5", startDate: null, dueDate: "2026-05-20", createdAt: "2026-03-01T10:00:00Z", updatedAt: "2026-03-15T16:00:00Z", order: 1 },
  { id: "t16", projectId: "p1", sectionId: "s5", parentId: null, title: "Launch-Checkliste abarbeiten", description: "DNS-Umstellung, SSL-Zertifikat, Redirects, Analytics, Cookie-Banner, Monitoring-Setup.", status: "backlog", priority: "high", assigneeId: "u1", startDate: null, dueDate: "2026-06-01", createdAt: "2026-03-01T10:00:00Z", updatedAt: "2026-03-15T16:00:00Z", order: 2 },
];

const COMMENTS: Comment[] = [
  { id: "c1", taskId: "t1", userId: "u2", content: "Benchmark-Report ist fertig. Die wichtigsten Erkenntnisse: Wettbewerber A hat die beste Mobile-Experience, Wettbewerber C die stärkste Content-Strategie.", createdAt: "2026-01-25T14:30:00Z" },
  { id: "c2", taskId: "t1", userId: "u1", content: "Super Arbeit! Können wir die Ergebnisse im nächsten Sprint-Review vorstellen?", createdAt: "2026-01-25T15:00:00Z" },
  { id: "c3", taskId: "t4", userId: "u4", content: "Design-System v1.0 ist in Figma verfügbar. Bitte alle einmal drüberschauen und Feedback geben.", createdAt: "2026-02-28T10:00:00Z" },
  { id: "c4", taskId: "t4", userId: "u3", content: "Sieht großartig aus! Die Token-Struktur ist sehr gut für die Code-Umsetzung geeignet.", createdAt: "2026-02-28T11:30:00Z" },
  { id: "c5", taskId: "t8", userId: "u3", content: "Basis-Komponenten sind fertig und in Storybook dokumentiert. Starte jetzt mit den Layout-Komponenten.", createdAt: "2026-03-05T16:00:00Z" },
  { id: "c6", taskId: "t8", userId: "u1", content: "Bitte achte darauf, dass alle Komponenten die Design-Tokens verwenden und nicht hart-codierte Werte.", createdAt: "2026-03-06T09:00:00Z" },
  { id: "c7", taskId: "t11", userId: "u2", content: "Erster Durchgang zeigt: 40% des bestehenden Contents kann übernommen werden, 30% muss überarbeitet werden, 30% ist neu zu erstellen.", createdAt: "2026-03-10T14:00:00Z" },
  { id: "c8", taskId: "t6", userId: "u4", content: "Mobile Breakpoints sehen gut aus. Tablet braucht noch Feinarbeit bei der Navigation.", createdAt: "2026-03-14T11:00:00Z" },
];

const IMPORT_RUNS: ImportRun[] = [
  { id: "ir1", projectId: "p1", fileName: "website-relaunch-plan.csv", rowCount: 28, taskCount: 16, subtaskCount: 10, importedAt: "2026-01-15T10:30:00Z" },
];

// ─── Second Project ──────────────────────────────────────────────────

const PROJECT2: Project = {
  id: "p2",
  title: "Mobile App v2.0",
  description: "Entwicklung der nächsten Version unserer Mobile App mit neuen Features, verbesserter Performance und Cross-Platform-Support.",
  color: "#0891B2",
  createdAt: "2026-02-01T10:00:00Z",
  updatedAt: "2026-03-10T14:30:00Z",
};

const SECTIONS_P2: Section[] = [
  { id: "s2_1", projectId: "p2", title: "Research", order: 0, color: "#6366F1" },
  { id: "s2_2", projectId: "p2", title: "UI/UX Design", order: 1, color: "#8B5CF6" },
  { id: "s2_3", projectId: "p2", title: "Development", order: 2, color: "#0891B2" },
  { id: "s2_4", projectId: "p2", title: "QA & Release", order: 3, color: "#059669" },
];

const TASKS_P2: Task[] = [
  { id: "t2_1", projectId: "p2", sectionId: "s2_1", parentId: null, title: "User Research durchführen", description: "Interviews mit 15 bestehenden Nutzern. Fokus auf Pain Points und Feature-Wünsche.", status: "done", priority: "high", assigneeId: "u2", startDate: "2026-02-01", dueDate: "2026-02-15", createdAt: "2026-02-01T10:00:00Z", updatedAt: "2026-02-15T16:00:00Z", order: 0 },
  { id: "t2_2", projectId: "p2", sectionId: "s2_2", parentId: null, title: "Neues Navigation-Konzept", description: "Bottom-Tab-Navigation mit kontextuellen Aktionen.", status: "in_progress", priority: "high", assigneeId: "u4", startDate: "2026-02-20", dueDate: "2026-03-15", createdAt: "2026-02-20T10:00:00Z", updatedAt: "2026-03-10T16:00:00Z", order: 0 },
  { id: "t2_3", projectId: "p2", sectionId: "s2_3", parentId: null, title: "React Native Upgrade", description: "Migration auf React Native 0.76 mit der neuen Architektur.", status: "todo", priority: "high", assigneeId: "u3", startDate: "2026-03-15", dueDate: "2026-04-01", createdAt: "2026-03-01T10:00:00Z", updatedAt: "2026-03-10T16:00:00Z", order: 0 },
  { id: "t2_4", projectId: "p2", sectionId: "s2_3", parentId: null, title: "Push-Notifications implementieren", description: "Firebase Cloud Messaging Integration für iOS und Android.", status: "backlog", priority: "medium", assigneeId: "u5", startDate: null, dueDate: "2026-04-15", createdAt: "2026-03-01T10:00:00Z", updatedAt: "2026-03-10T16:00:00Z", order: 1 },
  { id: "t2_5", projectId: "p2", sectionId: "s2_4", parentId: null, title: "Beta-Test organisieren", description: "TestFlight und Google Play Beta mit 100 Testern.", status: "backlog", priority: "medium", assigneeId: "u5", startDate: null, dueDate: "2026-05-01", createdAt: "2026-03-01T10:00:00Z", updatedAt: "2026-03-10T16:00:00Z", order: 0 },
];

const MILESTONES_P2: Milestone[] = [
  { id: "m2_1", projectId: "p2", title: "Research abgeschlossen", dueDate: "2026-02-15", completed: true },
  { id: "m2_2", projectId: "p2", title: "Design Freeze", dueDate: "2026-03-20", completed: false },
  { id: "m2_3", projectId: "p2", title: "Beta Release", dueDate: "2026-05-01", completed: false },
];

// ─── Initial State ───────────────────────────────────────────────────

export const initialState: AppState = {
  projects: [PROJECT, PROJECT2],
  sections: [...SECTIONS, ...SECTIONS_P2],
  tasks: [...TASKS, ...TASKS_P2],
  comments: COMMENTS,
  milestones: [...MILESTONES, ...MILESTONES_P2],
  users: USERS,
  importRuns: IMPORT_RUNS,
  currentProjectId: "p1",
  selectedTaskId: null,
};

// ─── Actions ─────────────────────────────────────────────────────────

export type Action =
  | { type: "SET_CURRENT_PROJECT"; projectId: string }
  | { type: "SELECT_TASK"; taskId: string | null }
  | { type: "UPDATE_TASK"; taskId: string; updates: Partial<Task> }
  | { type: "ADD_TASK"; task: Task }
  | { type: "DELETE_TASK"; taskId: string }
  | { type: "ADD_COMMENT"; comment: Comment }
  | { type: "MOVE_TASK"; taskId: string; sectionId: string; status: TaskStatus }
  | { type: "IMPORT_TASKS"; projectId: string; tasks: Task[]; sections: Section[]; importRun: ImportRun }
  | { type: "ADD_PROJECT"; project: Project }
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
        tasks: state.tasks.map((t) =>
          t.id === action.taskId ? { ...t, ...action.updates, updatedAt: new Date().toISOString() } : t
        ),
      };
    case "ADD_TASK":
      return { ...state, tasks: [...state.tasks, action.task] };
    case "DELETE_TASK":
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.taskId && t.parentId !== action.taskId),
        selectedTaskId: state.selectedTaskId === action.taskId ? null : state.selectedTaskId,
      };
    case "ADD_COMMENT":
      return { ...state, comments: [...state.comments, action.comment] };
    case "MOVE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? { ...t, sectionId: action.sectionId, status: action.status, updatedAt: new Date().toISOString() }
            : t
        ),
      };
    case "IMPORT_TASKS": {
      const existingSectionIds = state.sections.map((s) => s.id);
      const newSections = action.sections.filter((s) => !existingSectionIds.includes(s.id));
      return {
        ...state,
        tasks: [...state.tasks, ...action.tasks],
        sections: [...state.sections, ...newSections],
        importRuns: [...state.importRuns, action.importRun],
      };
    }
    case "ADD_PROJECT":
      return { ...state, projects: [...state.projects, action.project] };
    case "TOGGLE_MILESTONE":
      return {
        ...state,
        milestones: state.milestones.map((m) =>
          m.id === action.milestoneId ? { ...m, completed: !m.completed } : m
        ),
      };
    default:
      return state;
  }
}

// ─── Selectors ───────────────────────────────────────────────────────

export function getProjectTasks(state: AppState, projectId: string): Task[] {
  return state.tasks.filter((t) => t.projectId === projectId);
}

export function getTopLevelTasks(state: AppState, projectId: string): Task[] {
  return state.tasks.filter((t) => t.projectId === projectId && t.parentId === null);
}

export function getSubtasks(state: AppState, parentId: string): Task[] {
  return state.tasks.filter((t) => t.parentId === parentId).sort((a, b) => a.order - b.order);
}

export function getTaskComments(state: AppState, taskId: string): Comment[] {
  return state.comments.filter((c) => c.taskId === taskId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getSectionTasks(state: AppState, sectionId: string): Task[] {
  return state.tasks.filter((t) => t.sectionId === sectionId && t.parentId === null).sort((a, b) => a.order - b.order);
}

export function getProjectSections(state: AppState, projectId: string): Section[] {
  return state.sections.filter((s) => s.projectId === projectId).sort((a, b) => a.order - b.order);
}

export function getProjectMilestones(state: AppState, projectId: string): Milestone[] {
  return state.milestones.filter((m) => m.projectId === projectId);
}

export function getUserById(state: AppState, userId: string): User | undefined {
  return state.users.find((u) => u.id === userId);
}

export function getTaskById(state: AppState, taskId: string): Task | undefined {
  return state.tasks.find((t) => t.id === taskId);
}

export function getProjectStats(state: AppState, projectId: string) {
  const tasks = getTopLevelTasks(state, projectId);
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const overdue = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done").length;
  return { total, done, inProgress, overdue, progress: total > 0 ? Math.round((done / total) * 100) : 0 };
}

export function createTask(projectId: string, sectionId: string, title: string, parentId: string | null = null): Task {
  return {
    id: nanoid(8),
    projectId,
    sectionId,
    parentId,
    title,
    description: "",
    status: "todo" as TaskStatus,
    priority: "none" as Priority,
    assigneeId: null,
    startDate: null,
    dueDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    order: 999,
  };
}
