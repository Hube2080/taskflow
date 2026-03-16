import { nanoid } from "nanoid";

export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";
export type Priority = "none" | "low" | "medium" | "high";

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

export interface AppState {
  projects: Project[];
  sections: Section[];
  tasks: Task[];
  comments: Comment[];
  milestones: Milestone[];
  users: User[];
  importRuns: ImportRun[];
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

const PROJECT: Project = {
  id: "p_antigone",
  title: "Antigone",
  description:
    "Direkt aus der bereitgestellten CSV erzeugter Projektplan mit Aufgaben, Unteraufgaben und Phasen für die Umsetzung.",
  color: "#4F46E5",
  createdAt: "2026-03-17T08:00:00Z",
  updatedAt: "2026-03-17T08:00:00Z",
};

const SECTIONS: Section[] = [
  { id: "sec_00-projektsteuerung", projectId: "p_antigone", title: "00 – Projektsteuerung", order: 0, color: "#6366F1" },
  { id: "sec_ohne-phase", projectId: "p_antigone", title: "Ohne Phase", order: 1, color: "#8B5CF6" },
  { id: "sec_01-architektur-risiken", projectId: "p_antigone", title: "01 – Architektur & Risiken", order: 2, color: "#0891B2" },
  { id: "sec_02-beschaffung", projectId: "p_antigone", title: "02 – Beschaffung", order: 3, color: "#059669" },
  { id: "sec_03-mac-mini-basis", projectId: "p_antigone", title: "03 – Mac mini Basis", order: 4, color: "#DC2626" },
  { id: "sec_04-kernsoftware", projectId: "p_antigone", title: "04 – Kernsoftware", order: 5, color: "#D97706" },
  { id: "sec_05-sprache-routing", projectId: "p_antigone", title: "05 – Sprache & Routing", order: 6, color: "#6366F1" },
  { id: "sec_06-tts-sonos", projectId: "p_antigone", title: "06 – TTS & Sonos", order: 7, color: "#8B5CF6" },
  { id: "sec_07-dashboard-memory", projectId: "p_antigone", title: "07 – Dashboard & Memory", order: 8, color: "#0891B2" },
  { id: "sec_08-remote-sicherheit", projectId: "p_antigone", title: "08 – Remote & Sicherheit", order: 9, color: "#059669" },
  { id: "sec_09-wohnzimmer-pilot", projectId: "p_antigone", title: "09 – Wohnzimmer Pilot", order: 10, color: "#DC2626" },
  { id: "sec_10-sofort-nutzbare-features", projectId: "p_antigone", title: "10 – Sofort nutzbare Features", order: 11, color: "#D97706" },
  { id: "sec_11-rollout-weitere-raeume", projectId: "p_antigone", title: "11 – Rollout weitere Räume", order: 12, color: "#6366F1" },
  { id: "sec_12-betrieb-doku", projectId: "p_antigone", title: "12 – Betrieb & Doku", order: 13, color: "#8B5CF6" },
  { id: "sec_13-backlog-v2", projectId: "p_antigone", title: "13 – Backlog V2", order: 14, color: "#0891B2" },
];

const TASKS: Task[] = [
  {
    id: "task_0001",
    projectId: "p_antigone",
    sectionId: "sec_00-projektsteuerung",
    parentId: null,
    title: "00 – Projektsteuerung und ADHS-Leitplanken aufsetzen",
    description: "Priorität: Hoch\n\nZiel: Das Projekt so strukturieren, dass du jeden Tag ohne Reibung weißt, was als Nächstes dran ist.\n\nKonkrete Schritte:\n- CSV in ein neues Asana-Projekt importieren.\n- Ansichten anlegen: Liste, Board nach Section, Timeline.\n- Nur 1–3 aktive Tasks gleichzeitig zulassen.\n- Tägliches Mini-Check-in und wöchentlichen Review fest einplanen.\n\nDefinition of Done:\n- Projekt ist importiert.\n- Du siehst die Sections in sinnvoller Reihenfolge.\n- Es gibt ein einfaches persönliches Arbeitsritual.\n\nHinweis: Diese Phase ist absichtlich klein. Sie verhindert, dass das Projekt zu groß und diffus wird.",
    status: "todo",
    priority: "high",
    assigneeId: null,
    startDate: "2026-03-17",
    dueDate: "2026-03-21",
    createdAt: "2026-03-17T08:00:00Z",
    updatedAt: "2026-03-17T08:00:00Z",
    order: 0,
  },
  {
    id: "task_0002",
    projectId: "p_antigone",
    sectionId: "sec_01-architektur-risiken",
    parentId: null,
    title: "01 – Zielarchitektur finalisieren und Risiken früh testen",
    description: "Priorität: Hoch\n\nZiel: Die entscheidenden technischen Risiken so früh klären, dass du kein Geld und keine Wochen in die falsche Richtung investierst.\n\nKonkrete Schritte:\n- Mac mini inventarisieren und reale Grenzen prüfen.\n- Pi-5/ReSpeaker-Kompatibilität als Spike testen.\n- Fallback-Pfade schon jetzt definieren.\n\nDefinition of Done:\n- Mac mini Ausgangslage dokumentiert.\n- Pi5 + ReSpeaker Risiko klar bewertet.\n- Fallback-Plan ist explizit festgelegt.\n\nHinweis: Wichtig: ReSpeaker 6-Mic + Raspberry Pi 5 ist nicht risikofrei. Das muss vor der Serienbeschaffung getestet werden.",
    status: "todo",
    priority: "high",
    assigneeId: null,
    startDate: "2026-03-22",
    dueDate: "2026-03-27",
    createdAt: "2026-03-17T08:00:00Z",
    updatedAt: "2026-03-17T08:00:00Z",
    order: 1,
  },
  {
    id: "task_0003",
    projectId: "p_antigone",
    sectionId: "sec_02-beschaffung",
    parentId: null,
    title: "02 – Pilot-Hardware für das Wohnzimmer beschaffen",
    description: "Priorität: Hoch\n\nZiel: Nur den Pilot kaufen, nicht gleich das ganze Haus.\n\nKonkrete Schritte:\n- Pilot-BOM erstellen.\n- Genau 1 Raum komplett beschaffen.\n- Erst nach Pilotfreigabe die restlichen 4 Räume kaufen.\n\nDefinition of Done:\n- Pilot-Hardware ist bestellt oder vorhanden.\n- Es wurde bewusst noch keine Vollausstattung gekauft.",
    status: "todo",
    priority: "high",
    assigneeId: null,
    startDate: "2026-03-28",
    dueDate: "2026-04-01",
    createdAt: "2026-03-17T08:00:00Z",
    updatedAt: "2026-03-17T08:00:00Z",
    order: 2,
  },
  {
    id: "task_0004",
    projectId: "p_antigone",
    sectionId: "sec_03-mac-mini-basis",
    parentId: null,
    title: "03 – Mac mini als stabilen 24/7-AI-Server vorbereiten",
    description: "Priorität: Hoch\n\nZiel: Den alten Mac mini in einen langweilig-stabilen Server verwandeln.\n\nKonkrete Schritte:\n- Updates, Energiesettings und Autostart sauber setzen.\n- Basis-Tooling und Projektstruktur installieren.\n- Backups und Logs von Anfang an mitdenken.\n\nDefinition of Done:\n- Mac mini läuft stabil im Dauerbetrieb.\n- Basis-Tools sind installiert.\n- Ordnerstruktur und Backup-Basis stehen.",
    status: "todo",
    priority: "high",
    assigneeId: null,
    startDate: "2026-04-02",
    dueDate: "2026-04-08",
    createdAt: "2026-03-17T08:00:00Z",
    updatedAt: "2026-03-17T08:00:00Z",
    order: 3,
  },
  {
    id: "task_0005",
    projectId: "p_antigone",
    sectionId: "sec_04-kernsoftware",
    parentId: null,
    title: "04 – Lokalen AI-Stack auf dem Mac mini installieren",
    description: "Priorität: Hoch\n\nZiel: Die Kernkomponenten LLM, STT, API und Datenhaltung auf dem Server zum Laufen bringen.\n\nKonkrete Schritte:\n- Ollama installieren und Modelle testen.\n- Whisper/whisper.cpp einrichten.\n- FastAPI + SQLite-Grundgerüst aufbauen.\n\nDefinition of Done:\n- Ein lokaler Text-Request funktioniert.\n- Ein lokaler Audio-zu-Text-Request funktioniert.\n- API-Grundgerüst steht.",
    status: "todo",
    priority: "high",
    assigneeId: null,
    startDate: "2026-04-09",
    dueDate: "2026-04-16",
    createdAt: "2026-03-17T08:00:00Z",
    updatedAt: "2026-03-17T08:00:00Z",
    order: 4,
  },
  {
    id: "task_0006",
    projectId: "p_antigone",
    sectionId: "sec_05-sprache-routing",
    parentId: null,
    title: "05 – Sprachpipeline Ende-zu-Ende aufbauen",
    description: "Priorität: Hoch\n\nZiel: Aus Mikrofon-Audio eine verwertbare Anfrage machen und die Antwort wieder ausgeben können.\n\nKonkrete Schritte:\n- Wake Word, Audioaufnahme, Transkription, Intent/Chat und Antwortpfad zusammensetzen.\n- Zuerst lokal auf dem Mac testen, dann auf den Raumknoten.\n\nDefinition of Done:\n- Eine gesprochene Anfrage kann end-to-end verarbeitet werden.",
    status: "todo",
    priority: "high",
    assigneeId: null,
    startDate: "2026-04-17",
    dueDate: "2026-04-23",
    createdAt: "2026-03-17T08:00:00Z",
    updatedAt: "2026-03-17T08:00:00Z",
    order: 5,
  },
  {
    id: "task_0007",
    projectId: "p_antigone",
    sectionId: "sec_06-tts-sonos",
    parentId: null,
    title: "06 – Sprach-Ausgabe über Sonos und lokale TTS aufbauen",
    description: "Priorität: Hoch\n\nZiel: Die Antwort des Assistenten hörbar im richtigen Raum ausgeben.\n\nKonkrete Schritte:\n- Lokale TTS einrichten.\n- Audio an Sonos im richtigen Raum schicken.\n- Fallback-Ausgabe lokal auf dem Server oder Testlautsprecher vorsehen.\n\nDefinition of Done:\n- Der Assistent kann im Pilot-Raum laut antworten.",
    status: "todo",
    priority: "high",
    assigneeId: null,
    startDate: "2026-04-24",
    dueDate: "2026-04-30",
    createdAt: "2026-03-17T08:00:00Z",
    updatedAt: "2026-03-17T08:00:00Z",
    order: 6,
  },
  {
    id: "task_0008",
    projectId: "p_antigone",
    sectionId: "sec_07-dashboard-memory",
    parentId: null,
    title: "07 – Dashboard, Memory und Logs nutzbar machen",
    description: "Priorität: Hoch\n\nZiel: Ein alltagstaugliches Kontrollzentrum schaffen, damit das System nicht zur Black Box wird.\n\nKonkrete Schritte:\n- Ein schlichtes Admin-Dashboard bauen.\n- Services, Logs, Erinnerungen und Memory sichtbar machen.\n- Prompt- und Konfigurationsstellen erreichbar machen.\n\nDefinition of Done:\n- Du kannst den Zustand des Systems im Browser prüfen und kleine Korrekturen vornehmen.",
    status: "todo",
    priority: "high",
    assigneeId: null,
    startDate: "2026-05-01",
    dueDate: "2026-05-08",
    createdAt: "2026-03-17T08:00:00Z",
    updatedAt: "2026-03-17T08:00:00Z",
    order: 7,
  },
  {
    id: "task_0009",
    projectId: "p_antigone",
    sectionId: "sec_08-remote-sicherheit",
    parentId: null,
    title: "08 – Sicheren Remote-Zugriff von iPhone und Laptop einrichten",
    description: "Priorität: Hoch\n\nZiel: Den Assistenten von unterwegs nutzen, ohne unsichere Ports ins Internet zu öffnen.\n\nKonkrete Schritte:\n- Tailscale auf Server und Clients einrichten.\n- Dashboard und API über das Tailnet testen.\n- Optional einen internen Reverse Proxy hinzufügen.\n\nDefinition of Done:\n- Dashboard und mindestens ein API-Endpunkt sind unterwegs erreichbar.",
    status: "todo",
    priority: "high",
    assigneeId: null,
    startDate: "2026-05-09",
    dueDate: "2026-05-15",
    createdAt: "2026-03-17T08:00:00Z",
    updatedAt: "2026-03-17T08:00:00Z",
    order: 8,
  },
  {
    id: "task_0010",
    projectId: "p_antigone",
    sectionId: "sec_09-wohnzimmer-pilot",
    parentId: null,
    title: "09 – Wohnzimmer-Pilot vollständig integrieren und testen",
    description: "Priorität: Hoch\n\nZiel: Einen ersten Raum so weit bringen, dass er im Alltag benutzbar wird.\n\nKonkrete Schritte:\n- Hardware aufbauen.\n- Node-Software verbinden.\n- Wake Word, STT, LLM, TTS, Sonos im Wohnzimmer testen.\n- Latenz und Sprachqualität bewerten.\n\nDefinition of Done:\n- Pilot-Raum funktioniert Ende-zu-Ende in einer echten Testsituation.",
    status: "todo",
    priority: "high",
    assigneeId: null,
    startDate: "2026-05-16",
    dueDate: "2026-05-24",
    createdAt: "2026-03-17T08:00:00Z",
    updatedAt: "2026-03-17T08:00:00Z",
    order: 9,
  },
  {
    id: "task_0011",
    projectId: "p_antigone",
    sectionId: "sec_10-sofort-nutzbare-features",
    parentId: null,
    title: "10 – Erste sofort nützliche Produktiv-Features umsetzen",
    description: "Priorität: Hoch\n\nZiel: Möglichst früh echten Alltagseffekt erzeugen, statt nur Infrastruktur zu bauen.\n\nKonkrete Schritte:\n- Einkaufslisten / Notizen.\n- Timer / Erinnerungen.\n- Statusabfragen und kleine Haus-Kommandos.\n\nDefinition of Done:\n- Mindestens 3 alltagstaugliche Features laufen im Pilot-Raum.",
    status: "todo",
    priority: "high",
    assigneeId: null,
    startDate: "2026-05-25",
    dueDate: "2026-06-02",
    createdAt: "2026-03-17T08:00:00Z",
    updatedAt: "2026-03-17T08:00:00Z",
    order: 10,
  },
  {
    id: "task_0012",
    projectId: "p_antigone",
    sectionId: "sec_11-rollout-weitere-raeume",
    parentId: null,
    title: "11 – Rollout auf weitere Räume vorbereiten und staffeln",
    description: "Priorität: Mittel\n\nZiel: Erst nach Pilot-Lernen systematisch auf weitere Räume erweitern.\n\nKonkrete Schritte:\n- Rollout-Reihenfolge festlegen.\n- BOM und Druckteile nach Pilot anpassen.\n- Installations-Checkliste standardisieren.\n\nDefinition of Done:\n- Es gibt einen klaren Rollout-Plan für die weiteren Räume.",
    status: "todo",
    priority: "medium",
    assigneeId: null,
    startDate: "2026-06-03",
    dueDate: "2026-06-10",
    createdAt: "2026-03-17T08:00:00Z",
    updatedAt: "2026-03-17T08:00:00Z",
    order: 11,
  },
  {
    id: "task_0013",
    projectId: "p_antigone",
    sectionId: "sec_12-betrieb-doku",
    parentId: null,
    title: "12 – Betrieb, Wartung und Dokumentation absichern",
    description: "Priorität: Mittel\n\nZiel: Das System nachhaltig betreibbar machen, damit es nicht an dir allein hängt.\n\nKonkrete Schritte:\n- Runbooks schreiben.\n- Backup/Restore testen.\n- Update-Strategie definieren.\n- Fehler- und Neustartpfade dokumentieren.\n\nDefinition of Done:\n- Die wichtigsten Betriebsabläufe sind dokumentiert und testbar.",
    status: "todo",
    priority: "medium",
    assigneeId: null,
    startDate: "2026-06-11",
    dueDate: "2026-06-18",
    createdAt: "2026-03-17T08:00:00Z",
    updatedAt: "2026-03-17T08:00:00Z",
    order: 12,
  },
  {
    id: "task_0014",
    projectId: "p_antigone",
    sectionId: "sec_13-backlog-v2",
    parentId: null,
    title: "13 – Backlog V2 / Nice-to-have sauber parken",
    description: "Priorität: Niedrig\n\nZiel: Spätere Ideen sicher parken, ohne den Pilot zu verwässern.\n\nKonkrete Schritte:\n- Multiuser-Stimmen.\n- Automationen.\n- Erweiterte Wissensbasis.\n- Bessere Wake Word-Personalisierung.\n\nDefinition of Done:\n- Spätere Ideen sind dokumentiert, aber blockieren den Pilot nicht.",
    status: "todo",
    priority: "low",
    assigneeId: null,
    startDate: "2026-06-19",
    dueDate: "2026-06-25",
    createdAt: "2026-03-17T08:00:00Z",
    updatedAt: "2026-03-17T08:00:00Z",
    order: 13,
  },
  {
    id: "subtask_0001",
    projectId: "p_antigone",
    sectionId: "sec_00-projektsteuerung",
    parentId: "task_0001",
    title: "00.1 – CSV in Asana importieren",
    description: "Priorität: Hoch\n\nZiel: Die Planungsbasis in Asana nutzbar machen.\n\nKonkrete Schritte:\n- Neues Projekt in Asana anlegen.\n- CSV importieren.\n- Beim Import die Felder Task Name, Description, Section/Column, Start Date, Due Date und Parent Task korrekt zuordnen.\n\nDefinition of Done:\n- Import ohne Fehler abgeschlossen.\n- Stichprobe: mindestens 5 Parent-Tasks und 5 Subtasks stimmen.\n\nLinks:\n- https://help.asana.com/s/article/project-importing-and-exporting?language=en_US",
    status: "todo",
    priority: "high",
    assigneeId: null,
    startDate: "2026-03-17",
    dueDate: "2026-03-17",
    createdAt: "2026-03-17T08:00:00Z",
    updatedAt: "2026-03-17T08:00:00Z",
    order: 0,
  },
  {
    id: "subtask_0002",
    projectId: "p_antigone",
    sectionId: "sec_00-projektsteuerung",
    parentId: "task_0001",
    title: "00.2 – Asana-Ansichten und Sortierung einrichten",
    description: "Priorität: Mittel\n\nZiel: Das Projekt so darstellen, dass du täglich schnell einsteigen kannst.\n\nKonkrete Schritte:\n- Listenansicht für Umsetzung.\n- Board nach Sections für Überblick.\n- Timeline/Gantt für Rhythmus.\n- Heute-Ansicht bzw. Meine Aufgaben für den Tagesfokus.\n\nDefinition of Done:\n- Mindestens 2 nutzbare Ansichten vorhanden.\n- Du kannst heute/fokussiert vs. Gesamtüberblick unterscheiden.",
    status: "todo",
    priority: "medium",
    assigneeId: null,
    startDate: "2026-03-18",
    dueDate: "2026-03-18",
    createdAt: "2026-03-17T08:00:00Z",
    updatedAt: "2026-03-17T08:00:00Z",
    order: 1,
  },
  {
    id: "subtask_0003",
    projectId: "p_antigone",
    sectionId: "sec_00-projektsteuerung",
    parentId: "task_0001",
    title: "00.3 – Persönliche Fokusregeln festlegen",
    description: "Priorität: Hoch\n\nZiel: ADHS-freundliche Regeln definieren, damit du nicht zu viele Baustellen gleichzeitig öffnest.\n\nKonkrete Schritte:\n- Regel festlegen: maximal 3 parallele aktive Tasks.\n- Regel festlegen: Fokusblock 45–90 Minuten, danach kurze Pause.\n- Regel festlegen: erst Pilot im Wohnzimmer stabilisieren, dann nächste Räume.\n\nDefinition of Done:\n- Die 3 Regeln sind im Projekt oder in einer Projektbeschreibung festgehalten.",
    status: "todo",
    priority: "high",
    assigneeId: null,
    startDate: "2026-03-18",
    dueDate: "2026-03-19",
    createdAt: "2026-03-17T08:00:00Z",
    updatedAt: "2026-03-17T08:00:00Z",
    order: 2,
  },
  {
    id: "subtask_0004",
    projectId: "p_antigone",
    sectionId: "sec_00-projektsteuerung",
    parentId: "task_0001",
    title: "00.4 – Tägliches Check-in Ritual definieren",
    description: "Priorität: Mittel\n\nZiel: Jeden Arbeitstag mit einem klaren Start und Ende versehen.\n\nKonkrete Schritte:\n- Morgens 3 wichtigste Tasks markieren.\n- Abends Done-Liste schreiben: Was wurde wirklich abgeschlossen?\n- Wenn du stecken bleibst: nächsten kleineren Task wählen, nicht den größten.\n\nDefinition of Done:\n- Ritual als kurze Vorlage im Projekt abgelegt.",
    status: "todo",
    priority: "medium",
    assigneeId: null,
    startDate: "2026-03-19",
    dueDate: "2026-03-20",
    createdAt: "2026-03-17T08:00:00Z",
    updatedAt: "2026-03-17T08:00:00Z",
    order: 3,
  },
  {
    id: "subtask_0005",
    projectId: "p_antigone",
    sectionId: "sec_00-projektsteuerung",
    parentId: "task_0001",
    title: "00.5 – Wöchentlichen Review-Termin blocken",
    description: "Priorität: Hoch\n\nZiel: Jede Woche einmal sauber ausmisten, priorisieren und nachziehen.\n\nKonkrete Schritte:\n- Fixen 30–45-Minuten-Slot im Kalender blocken.\n- Review-Checkliste erstellen: offen, blockiert, gekauft, getestet, entschieden.\n\nDefinition of Done:\n- Wöchentlicher Review-Termin steht.\n- Checkliste existiert.",
    status: "todo",
    priority: "high",
    assigneeId: null,
    startDate: "2026-03-20",
    dueDate: "2026-03-21",
    createdAt: "2026-03-17T08:00:00Z",
    updatedAt: "2026-03-17T08:00:00Z",
    order: 4,
  },
  {
    id: "subtask_0006",
    projectId: "p_antigone",
    sectionId: "sec_01-architektur-risiken",
    parentId: "task_0002",
    title: "01.1 – Mac mini inventarisieren",
    description: "Priorität: Hoch\n\nZiel: Reale Hardwarebasis kennen.\n\nKonkrete Schritte:\n- Mac mini Modell, CPU, RAM, macOS-Version und freien Speicher dokumentieren.\n- Netzwerkanschluss, WLAN, Audio-Ausgänge und Dauerbetrieb prüfen.\n\nDefinition of Done:\n- Eine kleine Inventarliste liegt im Projekt vor.",
    status: "todo",
    priority: "high",
    assigneeId: null,
    startDate: "2026-03-22",
    dueDate: "2026-03-22",
    createdAt: "2026-03-17T08:00:00Z",
    updatedAt: "2026-03-17T08:00:00Z",
    order: 5,
  },
  {
    id: "subtask_0007",
    projectId: "p_antigone",
    sectionId: "sec_01-architektur-risiken",
    parentId: "task_0002",
    title: "01.2 – macOS-Kompatibilität für Ollama und Tailscale prüfen",
    description: "Priorität: Hoch\n\nZiel: Verhindern, dass die Grundsoftware am Betriebssystem scheitert.\n\nKonkrete Schritte:\n- Prüfen, ob der alte Mac mini die benötigte macOS-Version für Ollama noch unterstützt.\n- Falls nein: entscheiden, ob Linux, anderer Runtime-Pfad oder Hardwarewechsel nötig ist.\n\nDefinition of Done:\n- Ollama-Pfad ist bestätigt oder es gibt einen klaren Ersatzpfad.\n\nHinweis: Aktuell nennt Ollama für den Mac-Download macOS 14 Sonoma oder neuer; Tailscale nennt macOS 12 Monterey oder neuer.\n\nLinks:\n- https://ollama.com/download/mac\n- https://tailscale.com/docs/install/mac",
    status: "todo",
    priority: "high",
    assigneeId: null,
    startDate: "2026-03-23",
    dueDate: "2026-03-23",
    createdAt: "2026-03-17T08:00:00Z",
    updatedAt: "2026-03-17T08:00:00Z",
    order: 6,
  },
  {
    id: "subtask_0008",
    projectId: "p_antigone",
    sectionId: "sec_01-architektur-risiken",
    parentId: "task_0002",
    title: "01.3 – Raum- und Gerätenamen festlegen",
    description: "Priorität: Mittel\n\nZiel: Eine saubere Namensstruktur verhindert später Chaos im Multiroom-Betrieb.\n\nKonkrete Schritte:\n- Konvention definieren, z. B. room-living, room-kitchen, room-bedroom, room-office, room-bath.\n- Mac mini Hostname und API-Ports benennen.\n- Sonos-Zonen konsistent benennen.\n\nDefinition of Done:\n- Namenskonvention dokumentiert.",
    status: "todo",
    priority: "medium",
    assigneeId: null,
    startDate: "2026-03-23",
    dueDate: "2026-03-24",
    createdAt: "2026-03-17T08:00:00Z",
    updatedAt: "2026-03-17T08:00:00Z",
    order: 7,
  },
  {
    id: "subtask_0009",
    projectId: "p_antigone",
    sectionId: "sec_01-architektur-risiken",
    parentId: "task_0002",
    title: "01.4 – Kompatibilitätsspike: Raspberry Pi 5 + ReSpeaker 6-Mic",
    description: "Priorität: Hoch\n\nZiel: Prüfen, ob dein Wunsch-Node technisch tragfähig ist.\n\nKonkrete Schritte:\n- Nur 1 Pilot-Set kaufen und testen.\n- Treiber/Audio-Device auf dem Pi 5 initial zum Laufen bringen.\n- Testaufnahme mit mehreren Kanälen machen.\n- Dokumentieren, wo es bricht oder funktioniert.\n\nDefinition of Done:\n- Es gibt eine klare Entscheidung: Pi 5 beibehalten oder auf Pi 4/Fallback ausweichen.\n\nHinweis: Community-Hinweise nennen den AC108-Codec bzw. das Voicecard-Setup auf Raspberry Pi 5 als potenziell problematisch. Genau deshalb gehört dieser Spike ganz nach vorne.\n\nLinks:\n- https://wiki.seeedstudio.com/ReSpeaker_6-Mic_Circular_Array_kit_for_Raspberry_Pi/\n- https://github.com/respeaker/seeed-voicecard",
    status: "todo",
    priority: "high",
    assigneeId: null,
    startDate: "2026-03-24",
    dueDate: "2026-03-26",
    createdAt: "2026-03-17T08:00:00Z",
    updatedAt: "2026-03-17T08:00:00Z",
    order: 8,
  },
  {
    id: "subtask_0010",
    projectId: "p_antigone",
    sectionId: "sec_01-architektur-risiken",
    parentId: "task_0002",
    title: "01.5 – Fallback-Pfad definieren",
    description: "Priorität: Hoch\n\nZiel: Nicht festhängen, falls der Wunschstack auf dem Pi 5 scheitert.\n\nKonkrete Schritte:\n- Entscheiden: Fallback A = Raspberry Pi 4, Fallback B = anderes USB-Mikrofon-Array, Fallback C = Wohnzimmer erst ohne ReSpeaker.\n- Abbruchkriterium definieren: maximal 2 Fokusblöcke Debugging, dann Fallback.\n\nDefinition of Done:\n- Es gibt ein schriftliches Stop-Loss-Kriterium.",
    status: "todo",
    priority: "high",
    assigneeId: null,
    startDate: "2026-03-26",
    dueDate: "2026-03-27",
    createdAt: "2026-03-17T08:00:00Z",
    updatedAt: "2026-03-17T08:00:00Z",
    order: 9,
  },
  {
    id: "subtask_0011",
    projectId: "p_antigone",
    sectionId: "sec_01-architektur-risiken",
    parentId: "task_0002",
    title: "01.6 – Wake-Word als spätere Entscheidung markieren",
    description: "Priorität: Niedrig\n\nZiel: Nicht an der Wake-Word-Frage hängenbleiben, bevor das System überhaupt lebt.\n\nKonkrete Schritte:\n- Platzhalter 'Antigone' dokumentieren.\n- Wake Word bewusst als spätere Optimierung notieren.\n\nDefinition of Done:\n- Wake Word ist kein Blocker mehr.",
    status: "todo",
    priority: "low",
    assigneeId: null,
    startDate: "2026-03-27",
    dueDate: "2026-03-27",
    createdAt: "2026-03-17T08:00:00Z",
    updatedAt: "2026-03-17T08:00:00Z",
    order: 10,
  }
];

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
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? { ...task, ...action.updates, updatedAt: new Date().toISOString() }
            : task
        ),
      };
    case "ADD_TASK":
      return { ...state, tasks: [...state.tasks, action.task] };
    case "DELETE_TASK":
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.taskId && task.parentId !== action.taskId),
        selectedTaskId: state.selectedTaskId === action.taskId ? null : state.selectedTaskId,
      };
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
        currentProjectId: action.project.id,
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
