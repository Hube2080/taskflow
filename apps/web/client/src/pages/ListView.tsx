/*
 * ListView – Swiss Precision Design
 * Elegant compact table with sortable columns
 * Powerful but not heavy
 */

import { useApp } from "@/contexts/AppContext";
import {
  getProjectSections,
  getTopLevelTasks,
  getSubtasks,
  getUserById,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  type Task,
  type TaskStatus,
  type Priority,
} from "@/lib/store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowUpDown,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CheckSquare,
} from "lucide-react";
import { useParams } from "wouter";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";

type SortKey = "title" | "status" | "priority" | "assignee" | "dueDate" | "section";
type SortDir = "asc" | "desc";

export default function ListView() {
  const { state, dispatch } = useApp();
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId || state.currentProjectId || "p1";
  const project = state.projects.find((p) => p.id === projectId);
  const sections = getProjectSections(state, projectId);
  const tasks = getTopLevelTasks(state, projectId);

  const [sortKey, setSortKey] = useState<SortKey>("section");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2, none: 3 };
  const statusOrder: Record<TaskStatus, number> = { backlog: 0, todo: 1, in_progress: 2, review: 3, done: 4 };

  const sortedTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "status":
          cmp = statusOrder[a.status] - statusOrder[b.status];
          break;
        case "priority":
          cmp = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case "assignee": {
          const aName = a.assigneeId ? getUserById(state, a.assigneeId)?.name || "" : "";
          const bName = b.assigneeId ? getUserById(state, b.assigneeId)?.name || "" : "";
          cmp = aName.localeCompare(bName);
          break;
        }
        case "dueDate":
          cmp = (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
          break;
        case "section": {
          const aSection = sections.find((s) => s.id === a.sectionId);
          const bSection = sections.find((s) => s.id === b.sectionId);
          cmp = (aSection?.order || 0) - (bSection?.order || 0);
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [tasks, sortKey, sortDir, state, sections]);

  if (!project) return <div className="p-8 text-muted-foreground">Projekt nicht gefunden.</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{project.title}</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Listen-Ansicht &middot; {tasks.length} Aufgaben
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="flex-1">
        <div className="px-6 py-4">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8"></TableHead>
                <TableHead>
                  <SortButton label="Aufgabe" sortKey="title" current={sortKey} dir={sortDir} onSort={toggleSort} />
                </TableHead>
                <TableHead className="w-[120px]">
                  <SortButton label="Phase" sortKey="section" current={sortKey} dir={sortDir} onSort={toggleSort} />
                </TableHead>
                <TableHead className="w-[100px]">
                  <SortButton label="Status" sortKey="status" current={sortKey} dir={sortDir} onSort={toggleSort} />
                </TableHead>
                <TableHead className="w-[100px]">
                  <SortButton label="Priorität" sortKey="priority" current={sortKey} dir={sortDir} onSort={toggleSort} />
                </TableHead>
                <TableHead className="w-[120px]">
                  <SortButton label="Zuständig" sortKey="assignee" current={sortKey} dir={sortDir} onSort={toggleSort} />
                </TableHead>
                <TableHead className="w-[100px]">
                  <SortButton label="Fällig" sortKey="dueDate" current={sortKey} dir={sortDir} onSort={toggleSort} />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  sections={sections}
                  expanded={expandedTasks.has(task.id)}
                  onToggle={() => toggleExpand(task.id)}
                  depth={0}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
}

function TaskRow({
  task,
  sections,
  expanded,
  onToggle,
  depth,
}: {
  task: Task;
  sections: ReturnType<typeof getProjectSections>;
  expanded: boolean;
  onToggle: () => void;
  depth: number;
}) {
  const { state, dispatch } = useApp();
  const subtasks = getSubtasks(state, task.id);
  const hasSubtasks = subtasks.length > 0;
  const assignee = task.assigneeId ? getUserById(state, task.assigneeId) : null;
  const section = sections.find((s) => s.id === task.sectionId);
  const statusConfig = STATUS_CONFIG[task.status];
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  return (
    <>
      <TableRow
        className="cursor-pointer group"
        onClick={() => dispatch({ type: "SELECT_TASK", taskId: task.id })}
      >
        <TableCell className="py-2 w-8">
          {hasSubtasks && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
        </TableCell>
        <TableCell className="py-2">
          <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
            <Checkbox
              checked={task.status === "done"}
              onCheckedChange={(checked) => {
                dispatch({
                  type: "UPDATE_TASK",
                  taskId: task.id,
                  updates: { status: checked ? "done" : "todo" },
                });
              }}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4"
            />
            <span
              className={`text-[13px] font-medium group-hover:text-primary transition-colors ${
                task.status === "done" ? "line-through text-muted-foreground" : ""
              }`}
            >
              {task.title}
            </span>
            {hasSubtasks && (
              <span className="text-[10px] text-muted-foreground font-mono">
                {subtasks.filter((s) => s.status === "done").length}/{subtasks.length}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="py-2">
          {section && (
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: section.color }} />
              <span className="text-[12px] text-muted-foreground truncate">{section.title}</span>
            </div>
          )}
        </TableCell>
        <TableCell className="py-2">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal">
            {statusConfig.label}
          </Badge>
        </TableCell>
        <TableCell className="py-2">
          {task.priority !== "none" && (
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${priorityConfig.bg}`}>
              {priorityConfig.label}
            </Badge>
          )}
        </TableCell>
        <TableCell className="py-2">
          {assignee && (
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarFallback
                  className="text-[8px] font-semibold"
                  style={{ backgroundColor: assignee.color + "18", color: assignee.color }}
                >
                  {assignee.initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-[12px] text-muted-foreground">{assignee.name.split(" ")[0]}</span>
            </div>
          )}
        </TableCell>
        <TableCell className="py-2">
          {task.dueDate && (
            <span
              className={`text-[12px] font-mono tabular-nums ${
                isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
              }`}
            >
              {new Date(task.dueDate).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
            </span>
          )}
        </TableCell>
      </TableRow>

      {/* Subtasks */}
      {expanded &&
        subtasks.map((sub) => (
          <TaskRow
            key={sub.id}
            task={sub}
            sections={sections}
            expanded={false}
            onToggle={() => {}}
            depth={depth + 1}
          />
        ))}
    </>
  );
}

function SortButton({
  label,
  sortKey,
  current,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  return (
    <button
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
    >
      {label}
      {current === sortKey && (
        <ArrowUpDown size={12} className={dir === "desc" ? "rotate-180" : ""} />
      )}
    </button>
  );
}
