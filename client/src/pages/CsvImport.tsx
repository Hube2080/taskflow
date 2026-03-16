/*
 * CsvImport – Swiss Precision Design
 * Multi-step import: Upload → Mapping → Preview → Confirm → Success
 * Trustworthy, professional, clear hierarchy preview
 */

import { useApp } from "@/contexts/AppContext";
import { createTask, type Task, type Section, type ImportRun, type Priority, type TaskStatus } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  Upload,
  X,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { nanoid } from "nanoid";
import { motion, AnimatePresence } from "framer-motion";

const EMPTY_STATE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663408581627/ZjqY3urez3ktbmb44tfhgb/empty-state-import-2jWtkTvXQkFn4ijhier6XB.webp";

type Step = "upload" | "mapping" | "preview" | "confirm" | "success";

interface CsvRow {
  [key: string]: string;
}

interface ColumnMapping {
  taskName: string;
  description: string;
  section: string;
  assignee: string;
  startDate: string;
  dueDate: string;
  parentTask: string;
}

interface ParsedTask {
  title: string;
  description: string;
  section: string;
  assignee: string;
  startDate: string;
  dueDate: string;
  parentTask: string;
  priority: Priority;
  isSubtask: boolean;
  errors: string[];
}

export default function CsvImport() {
  const { state, dispatch } = useApp();
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    taskName: "",
    description: "",
    section: "",
    assignee: "",
    startDate: "",
    dueDate: "",
    parentTask: "",
  });
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
  const [targetProjectId, setTargetProjectId] = useState(state.currentProjectId || "p1");
  const [importResult, setImportResult] = useState<{ tasks: number; subtasks: number; sections: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV
  const parseCsv = (text: string) => {
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return;

    // Detect delimiter
    const firstLine = lines[0];
    const delimiter = firstLine.includes(";") ? ";" : ",";

    const headers = parseCsvLine(firstLine, delimiter);
    setCsvHeaders(headers);

    const rows: CsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i], delimiter);
      const row: CsvRow = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });
      rows.push(row);
    }
    setCsvRows(rows);

    // Auto-map columns
    const autoMapping: ColumnMapping = {
      taskName: findBestMatch(headers, ["task name", "aufgabe", "title", "name", "task"]),
      description: findBestMatch(headers, ["description", "beschreibung", "desc", "details"]),
      section: findBestMatch(headers, ["section", "column", "phase", "abschnitt", "spalte", "section/column"]),
      assignee: findBestMatch(headers, ["assignee", "zuständig", "verantwortlich", "assigned", "owner"]),
      startDate: findBestMatch(headers, ["start date", "startdatum", "start", "beginn"]),
      dueDate: findBestMatch(headers, ["due date", "fällig", "deadline", "end date", "enddatum"]),
      parentTask: findBestMatch(headers, ["parent task", "übergeordnet", "parent", "elternaufgabe"]),
    };
    setMapping(autoMapping);
  };

  const parseCsvLine = (line: string, delimiter: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const findBestMatch = (headers: string[], candidates: string[]): string => {
    for (const candidate of candidates) {
      const match = headers.find((h) => h.toLowerCase().includes(candidate.toLowerCase()));
      if (match) return match;
    }
    return "";
  };

  // Handle file
  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCsv(text);
      setStep("mapping");
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  // Parse tasks from mapping
  const parseTasksFromMapping = () => {
    const tasks: ParsedTask[] = csvRows.map((row) => {
      const errors: string[] = [];
      const title = row[mapping.taskName] || "";
      const parentTask = row[mapping.parentTask] || "";
      const dueDate = row[mapping.dueDate] || "";
      const startDate = row[mapping.startDate] || "";

      if (!title) errors.push("Kein Aufgabentitel");
      if (dueDate && isNaN(Date.parse(dueDate))) errors.push("Ungültiges Fälligkeitsdatum");
      if (startDate && isNaN(Date.parse(startDate))) errors.push("Ungültiges Startdatum");

      // Parse priority from description
      const desc = row[mapping.description] || "";
      let priority: Priority = "none";
      const descLower = desc.toLowerCase();
      if (descLower.includes("high") || descLower.includes("hoch")) priority = "high";
      else if (descLower.includes("medium") || descLower.includes("mittel")) priority = "medium";
      else if (descLower.includes("low") || descLower.includes("niedrig")) priority = "low";

      return {
        title,
        description: desc,
        section: row[mapping.section] || "",
        assignee: row[mapping.assignee] || "",
        startDate,
        dueDate,
        parentTask,
        priority,
        isSubtask: !!parentTask,
        errors,
      };
    });
    setParsedTasks(tasks);
    setStep("preview");
  };

  // Execute import
  const executeImport = () => {
    const sectionMap = new Map<string, string>();
    const taskMap = new Map<string, string>();
    const project = state.projects.find((p) => p.id === targetProjectId);
    if (!project) return;

    // Create sections
    const existingSections = state.sections.filter((s) => s.projectId === targetProjectId);
    const newSections: Section[] = [];
    const sectionColors = ["#6366F1", "#8B5CF6", "#0891B2", "#059669", "#DC2626", "#D97706"];

    parsedTasks.forEach((pt) => {
      if (pt.section && !sectionMap.has(pt.section)) {
        const existing = existingSections.find((s) => s.title.toLowerCase() === pt.section.toLowerCase());
        if (existing) {
          sectionMap.set(pt.section, existing.id);
        } else {
          const id = nanoid(8);
          sectionMap.set(pt.section, id);
          newSections.push({
            id,
            projectId: targetProjectId,
            title: pt.section,
            order: existingSections.length + newSections.length,
            color: sectionColors[(existingSections.length + newSections.length) % sectionColors.length],
          });
        }
      }
    });

    // Default section
    const defaultSectionId = existingSections[0]?.id || (newSections[0]?.id ?? nanoid(8));
    if (existingSections.length === 0 && newSections.length === 0) {
      newSections.push({
        id: defaultSectionId,
        projectId: targetProjectId,
        title: "Importiert",
        order: 0,
        color: "#6366F1",
      });
    }

    // Create top-level tasks first
    const newTasks: Task[] = [];
    const topLevel = parsedTasks.filter((pt) => !pt.isSubtask && pt.title);

    topLevel.forEach((pt, idx) => {
      const sectionId = pt.section ? (sectionMap.get(pt.section) || defaultSectionId) : defaultSectionId;
      const task: Task = {
        id: nanoid(8),
        projectId: targetProjectId,
        sectionId,
        parentId: null,
        title: pt.title,
        description: pt.description,
        status: "todo" as TaskStatus,
        priority: pt.priority,
        assigneeId: null,
        startDate: pt.startDate && !isNaN(Date.parse(pt.startDate)) ? pt.startDate : null,
        dueDate: pt.dueDate && !isNaN(Date.parse(pt.dueDate)) ? pt.dueDate : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: idx,
      };
      taskMap.set(pt.title, task.id);
      newTasks.push(task);
    });

    // Create subtasks
    const subtaskEntries = parsedTasks.filter((pt) => pt.isSubtask && pt.title);
    subtaskEntries.forEach((pt, idx) => {
      const parentId = taskMap.get(pt.parentTask) || null;
      const parentTask = newTasks.find((t) => t.id === parentId);
      const sectionId = pt.section
        ? (sectionMap.get(pt.section) || (parentTask?.sectionId ?? defaultSectionId))
        : (parentTask?.sectionId ?? defaultSectionId);

      const task: Task = {
        id: nanoid(8),
        projectId: targetProjectId,
        sectionId,
        parentId,
        title: pt.title,
        description: pt.description,
        status: "todo" as TaskStatus,
        priority: pt.priority,
        assigneeId: null,
        startDate: pt.startDate && !isNaN(Date.parse(pt.startDate)) ? pt.startDate : null,
        dueDate: pt.dueDate && !isNaN(Date.parse(pt.dueDate)) ? pt.dueDate : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: idx,
      };
      newTasks.push(task);
    });

    const importRun: ImportRun = {
      id: nanoid(8),
      projectId: targetProjectId,
      fileName,
      rowCount: csvRows.length,
      taskCount: topLevel.length,
      subtaskCount: subtaskEntries.length,
      importedAt: new Date().toISOString(),
    };

    dispatch({ type: "IMPORT_TASKS", projectId: targetProjectId, tasks: newTasks, sections: newSections, importRun });
    setImportResult({ tasks: topLevel.length, subtasks: subtaskEntries.length, sections: newSections.length });
    setStep("success");
  };

  const errorCount = parsedTasks.filter((t) => t.errors.length > 0).length;
  const topLevelCount = parsedTasks.filter((t) => !t.isSubtask && t.title).length;
  const subtaskCount = parsedTasks.filter((t) => t.isSubtask && t.title).length;
  const uniqueSections = new Set(parsedTasks.map((t) => t.section).filter(Boolean));
  const orphanSubtasks = parsedTasks.filter(
    (t) => t.isSubtask && t.parentTask && !parsedTasks.some((candidate) => !candidate.isSubtask && candidate.title === t.parentTask)
  );

  return (
    <ScrollArea className="h-full">
      <div className="p-8 max-w-[900px]">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">CSV Import</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Importiere einen bestehenden Projektplan aus einer CSV-Datei.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              Hierarchie-Vorschau vor Bestätigung aktiviert
            </div>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mt-6 mb-8">
          {(["upload", "mapping", "preview", "confirm", "success"] as Step[]).map((s, i) => {
            const labels = ["Hochladen", "Zuordnung", "Vorschau", "Bestätigen", "Fertig"];
            const stepIndex = ["upload", "mapping", "preview", "confirm", "success"].indexOf(step);
            const isActive = i === stepIndex;
            const isDone = i < stepIndex;
            return (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <div className={`h-px w-8 ${isDone ? "bg-primary" : "bg-border"}`} />}
                <div className="flex items-center gap-1.5">
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                      isDone
                        ? "bg-primary text-primary-foreground"
                        : isActive
                        ? "bg-primary/10 text-primary border border-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? <Check size={12} /> : i + 1}
                  </div>
                  <span
                    className={`text-[12px] ${
                      isActive ? "font-semibold text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {labels[i]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Upload */}
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border border-border">
                <CardContent className="p-8">
                  <div
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                      isDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    <img
                      src={EMPTY_STATE_IMG}
                      alt="Import"
                      className="w-32 h-32 mx-auto mb-4 opacity-80"
                    />
                    <h3 className="text-[15px] font-semibold mb-1">CSV-Datei hochladen</h3>
                    <p className="text-[13px] text-muted-foreground mb-4">
                      Ziehe eine CSV-Datei hierher oder klicke zum Auswählen
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2"
                    >
                      <Upload size={16} />
                      Datei auswählen
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                      }}
                    />
                    <div className="mt-6 text-[11px] text-muted-foreground">
                      <p className="font-medium mb-1">Erwartete Spalten:</p>
                      <p>Task Name, Description, Section/Column, Assignee, Start Date, Due Date, Parent Task</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Column Mapping */}
          {step === "mapping" && (
            <motion.div
              key="mapping"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="text-[15px] font-semibold">Spalten zuordnen</CardTitle>
                  <p className="text-[13px] text-muted-foreground">
                    {fileName} &middot; {csvRows.length} Zeilen &middot; {csvHeaders.length} Spalten
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {([
                      { key: "taskName" as const, label: "Aufgabentitel *", required: true },
                      { key: "description" as const, label: "Beschreibung" },
                      { key: "section" as const, label: "Phase / Spalte" },
                      { key: "assignee" as const, label: "Zuständig" },
                      { key: "startDate" as const, label: "Startdatum" },
                      { key: "dueDate" as const, label: "Fälligkeitsdatum" },
                      { key: "parentTask" as const, label: "Übergeordnete Aufgabe" },
                    ] as const).map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">
                          {label}
                        </label>
                        <Select
                          value={mapping[key] || "none"}
                          onValueChange={(val) =>
                            setMapping((prev) => ({ ...prev, [key]: val === "none" ? "" : val }))
                          }
                        >
                          <SelectTrigger className="h-9 text-[13px]">
                            <SelectValue placeholder="Spalte wählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" className="text-[13px]">
                              — Nicht zuordnen —
                            </SelectItem>
                            {csvHeaders.map((h) => (
                              <SelectItem key={h} value={h} className="text-[13px]">
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}

                    <div>
                      <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">
                        Zielprojekt
                      </label>
                      <Select value={targetProjectId} onValueChange={setTargetProjectId}>
                        <SelectTrigger className="h-9 text-[13px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {state.projects.map((p) => (
                            <SelectItem key={p.id} value={p.id} className="text-[13px]">
                              {p.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <Button variant="ghost" onClick={() => setStep("upload")} className="gap-1.5">
                      <ArrowLeft size={14} /> Zurück
                    </Button>
                    <Button
                      onClick={parseTasksFromMapping}
                      disabled={!mapping.taskName}
                      className="gap-1.5"
                    >
                      Vorschau <ArrowRight size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Preview */}
          {step === "preview" && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Summary */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <Card className="col-span-4 border-primary/15 bg-primary/[0.035] shadow-sm">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <h3 className="text-[13px] font-semibold text-foreground">Sicherheitsprüfung vor dem Import</h3>
                      <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                        Vor dem Import siehst du hier genau, wie Aufgaben, Unteraufgaben und Phasen angelegt werden. Fehlerhafte Zeilen werden markiert, damit die Struktur vor der Bestätigung nachvollziehbar bleibt.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-border">
                  <CardContent className="p-3 text-center">
                    <div className="text-xl font-bold font-mono">{topLevelCount}</div>
                    <div className="text-[11px] text-muted-foreground">Aufgaben</div>
                  </CardContent>
                </Card>
                <Card className="border border-border">
                  <CardContent className="p-3 text-center">
                    <div className="text-xl font-bold font-mono">{subtaskCount}</div>
                    <div className="text-[11px] text-muted-foreground">Unteraufgaben</div>
                  </CardContent>
                </Card>
                <Card className="border border-border">
                  <CardContent className="p-3 text-center">
                    <div className="text-xl font-bold font-mono">{uniqueSections.size}</div>
                    <div className="text-[11px] text-muted-foreground">Phasen</div>
                  </CardContent>
                </Card>
                <Card className={`border ${errorCount > 0 ? "border-red-200 bg-red-50/50" : "border-border"}`}>
                  <CardContent className="p-3 text-center">
                    <div className={`text-xl font-bold font-mono ${errorCount > 0 ? "text-red-600" : ""}`}>
                      {errorCount}
                    </div>
                    <div className="text-[11px] text-muted-foreground">Fehler</div>
                  </CardContent>
                </Card>
              </div>

              {orphanSubtasks.length > 0 && (
                <Card className="mb-4 border-amber-200 bg-amber-50/60 shadow-sm">
                  <CardContent className="flex items-start gap-3 p-4">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                    <div>
                      <h3 className="text-[13px] font-semibold text-amber-900">Unteraufgaben ohne gefundenes Parent-Element</h3>
                      <p className="mt-1 text-[12px] leading-5 text-amber-800/90">
                        Diese Einträge referenzieren ein Parent Task, das in der Datei nicht als Top-Level-Aufgabe erkannt wurde. Beim Import werden sie ohne eindeutige Zuordnung in die passende Phase übernommen.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {orphanSubtasks.map((task, index) => (
                          <Badge key={`${task.title}-${index}`} variant="outline" className="border-amber-300 bg-white/70 text-[11px] text-amber-900">
                            {task.title} → {task.parentTask}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Hierarchy Preview */}
              <Card className="border border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[14px] font-semibold">Hierarchie-Vorschau</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="max-h-[400px] overflow-y-auto">
                    {Array.from(uniqueSections).map((sectionName) => {
                      const sectionTasks = parsedTasks.filter(
                        (t) => t.section === sectionName && !t.isSubtask
                      );
                      return (
                        <div key={sectionName} className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                            <span className="text-[13px] font-semibold">{sectionName || "Ohne Phase"}</span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {sectionTasks.length}
                            </span>
                          </div>
                          <div className="ml-5 space-y-1">
                            {sectionTasks.map((task, i) => {
                              const children = parsedTasks.filter(
                                (t) => t.isSubtask && t.parentTask === task.title
                              );
                              const hasDates = Boolean(task.startDate || task.dueDate);
                              return (
                                <div key={i}>
                                  <div className="flex flex-wrap items-center gap-2 py-1">
                                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                                    <span
                                      className={`text-[13px] ${
                                        task.errors.length > 0 ? "text-red-600" : ""
                                      }`}
                                    >
                                      {task.title || "(Kein Titel)"}
                                    </span>
                                    {task.priority !== "none" && (
                                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 capitalize">
                                        {task.priority}
                                      </Badge>
                                    )}
                                    {hasDates && (
                                      <span className="text-[10px] font-mono text-muted-foreground">
                                        {task.startDate || "—"} → {task.dueDate || "—"}
                                      </span>
                                    )}
                                    {task.errors.length > 0 && (
                                      <>
                                        <AlertTriangle size={12} className="text-red-500" />
                                        <span className="text-[10px] text-red-600">{task.errors.join(" · ")}</span>
                                      </>
                                    )}
                                  </div>
                                  {children.length > 0 && (
                                    <div className="ml-5 space-y-0.5">
                                      {children.map((child, j) => (
                                        <div key={j} className="flex items-center gap-2 py-0.5">
                                          <ChevronRight size={10} className="text-muted-foreground/40" />
                                          <span
                                            className={`text-[12px] text-muted-foreground ${
                                              child.errors.length > 0 ? "text-red-500" : ""
                                            }`}
                                          >
                                            {child.title}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Tasks without section */}
                    {parsedTasks.filter((t) => !t.section && !t.isSubtask && t.title).length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                          <span className="text-[13px] font-semibold text-muted-foreground">Ohne Phase</span>
                        </div>
                        <div className="ml-5 space-y-1">
                          {parsedTasks
                            .filter((t) => !t.section && !t.isSubtask && t.title)
                            .map((task, i) => (
                              <div key={i} className="flex items-center gap-2 py-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                                <span className="text-[13px]">{task.title}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between mt-4">
                <Button variant="ghost" onClick={() => setStep("mapping")} className="gap-1.5">
                  <ArrowLeft size={14} /> Zurück
                </Button>
                <Button onClick={() => setStep("confirm")} className="gap-1.5">
                  Weiter zur Bestätigung <ArrowRight size={14} />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Confirm */}
          {step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border border-border">
                <CardContent className="p-8 text-center">
                  <FileSpreadsheet size={48} className="mx-auto text-primary mb-4" />
                  <h3 className="text-lg font-bold mb-2">Import bestätigen</h3>
                  <p className="text-[13px] text-muted-foreground max-w-md mx-auto mb-6">
                    Es werden <strong>{topLevelCount} Aufgaben</strong> und{" "}
                    <strong>{subtaskCount} Unteraufgaben</strong> in{" "}
                    <strong>{uniqueSections.size} Phasen</strong> zum Projekt{" "}
                    <strong>"{state.projects.find((p) => p.id === targetProjectId)?.title}"</strong>{" "}
                    importiert.
                  </p>
                  {errorCount > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 max-w-md mx-auto">
                      <p className="text-[12px] text-amber-700">
                        <AlertTriangle size={12} className="inline mr-1" />
                        {errorCount} Zeilen haben Warnungen. Diese werden trotzdem importiert.
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-3">
                    <Button variant="outline" onClick={() => setStep("preview")} className="gap-1.5">
                      <ArrowLeft size={14} /> Zurück
                    </Button>
                    <Button onClick={executeImport} className="gap-1.5">
                      <Check size={14} /> Jetzt importieren
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 5: Success */}
          {step === "success" && importResult && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border border-green-200 bg-green-50/30">
                <CardContent className="p-8 text-center">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} className="text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Import erfolgreich!</h3>
                  <p className="text-[13px] text-muted-foreground mb-6">
                    {importResult.tasks} Aufgaben und {importResult.subtasks} Unteraufgaben wurden importiert.
                    {importResult.sections > 0 && ` ${importResult.sections} neue Phasen wurden erstellt.`}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStep("upload");
                        setCsvHeaders([]);
                        setCsvRows([]);
                        setParsedTasks([]);
                        setFileName("");
                        setImportResult(null);
                      }}
                    >
                      Weiteren Import starten
                    </Button>
                    <Button
                      onClick={() => {
                        dispatch({ type: "SET_CURRENT_PROJECT", projectId: targetProjectId });
                        window.location.href = `/project/${targetProjectId}/board`;
                      }}
                      className="gap-1.5"
                    >
                      Zum Projekt <ArrowRight size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
}
