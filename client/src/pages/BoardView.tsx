/*
 * BoardView – Swiss Precision Design
 * Kanban board with sections as columns
 * Task cards with priority, assignee, due date, subtask count
 */

import { useApp } from "@/contexts/AppContext";
import {
  getProjectSections,
  getSectionTasks,
  getSubtasks,
  getUserById,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  createTask,
  type Task,
  type Section,
  type TaskStatus,
} from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CalendarDays,
  CheckSquare,
  GripVertical,
  MessageSquare,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { useParams } from "wouter";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function BoardView() {
  const { state, dispatch } = useApp();
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId || state.currentProjectId || "p1";
  const project = state.projects.find((p) => p.id === projectId);
  const sections = getProjectSections(state, projectId);

  if (!project) return <div className="p-8 text-muted-foreground">Projekt nicht gefunden.</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{project.title}</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Board-Ansicht</p>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-6 h-full min-h-0">
          {sections.map((section) => (
            <BoardColumn key={section.id} section={section} projectId={projectId} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BoardColumn({ section, projectId }: { section: Section; projectId: string }) {
  const { state, dispatch } = useApp();
  const tasks = getSectionTasks(state, section.id);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    if (newTitle.trim()) {
      const task = createTask(projectId, section.id, newTitle.trim());
      dispatch({ type: "ADD_TASK", task });
      setNewTitle("");
      setIsAdding(false);
    }
  };

  return (
    <div className="w-[280px] shrink-0 flex flex-col max-h-full">
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: section.color }} />
        <h3 className="text-[13px] font-semibold text-foreground">{section.title}</h3>
        <span className="text-[11px] font-mono text-muted-foreground tabular-nums ml-1">
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-2 pb-2 bg-muted/30 rounded-lg p-2">
          <AnimatePresence>
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15, delay: index * 0.02 }}
              >
                <TaskCard task={task} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add Task */}
          {isAdding ? (
            <Card className="border border-primary/30 shadow-sm">
              <CardContent className="p-3">
                <Input
                  ref={inputRef}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Aufgabentitel..."
                  className="text-[13px] h-8 border-0 p-0 focus-visible:ring-0 shadow-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                    if (e.key === "Escape") {
                      setIsAdding(false);
                      setNewTitle("");
                    }
                  }}
                />
                <div className="flex items-center gap-2 mt-2">
                  <Button size="sm" className="h-7 text-[12px]" onClick={handleAdd}>
                    Hinzufügen
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[12px]"
                    onClick={() => {
                      setIsAdding(false);
                      setNewTitle("");
                    }}
                  >
                    Abbrechen
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center gap-1.5 px-2 py-2 text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
            >
              <Plus size={14} />
              <span>Aufgabe hinzufügen</span>
            </button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const { state, dispatch } = useApp();
  const subtasks = getSubtasks(state, task.id);
  const subtasksDone = subtasks.filter((s) => s.status === "done").length;
  const assignee = task.assigneeId ? getUserById(state, task.assigneeId) : null;
  const comments = state.comments.filter((c) => c.taskId === task.id);
  const priorityConfig = PRIORITY_CONFIG[task.priority];

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  return (
    <Card
      className="border border-border hover:border-border/80 hover:shadow-sm transition-all duration-150 cursor-pointer group"
      onClick={() => dispatch({ type: "SELECT_TASK", taskId: task.id })}
    >
      <CardContent className="p-3">
        {/* Priority Badge */}
        {task.priority !== "none" && (
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 mb-2 ${priorityConfig.bg}`}>
            {priorityConfig.label}
          </Badge>
        )}

        {/* Title */}
        <h4 className="text-[13px] font-medium leading-snug group-hover:text-primary transition-colors">
          {task.title}
        </h4>

        {/* Meta Row */}
        <div className="flex items-center gap-3 mt-2.5 flex-wrap">
          {/* Due Date */}
          {task.dueDate && (
            <span
              className={`flex items-center gap-1 text-[11px] ${
                isOverdue ? "text-red-600" : "text-muted-foreground"
              }`}
            >
              <CalendarDays size={12} />
              {new Date(task.dueDate).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
            </span>
          )}

          {/* Subtasks */}
          {subtasks.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <CheckSquare size={12} />
              {subtasksDone}/{subtasks.length}
            </span>
          )}

          {/* Comments */}
          {comments.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MessageSquare size={12} />
              {comments.length}
            </span>
          )}

          {/* Spacer + Assignee */}
          <div className="flex-1" />
          {assignee && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-6 w-6">
                  <AvatarFallback
                    className="text-[9px] font-semibold"
                    style={{ backgroundColor: assignee.color + "18", color: assignee.color }}
                  >
                    {assignee.initials}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[11px]">
                {assignee.name}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
