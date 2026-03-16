/*
 * TaskDetailPanel – Swiss Precision Design
 * Slides in from right, shows full task details
 * Title, description, status, priority, dates, subtasks, comments
 */

import { useApp } from "@/contexts/AppContext";
import {
  getTaskById,
  getSubtasks,
  getTaskComments,
  getUserById,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  createTask,
  type Task,
  type TaskStatus,
  type Priority,
} from "@/lib/store";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays,
  CheckSquare,
  Clock,
  MessageSquare,
  Paperclip,
  Send,
  Tag,
  User,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { nanoid } from "nanoid";
import { motion, AnimatePresence } from "framer-motion";

export default function TaskDetailPanel() {
  const { state, dispatch } = useApp();
  const task = state.selectedTaskId ? getTaskById(state, state.selectedTaskId) : null;
  const isOpen = !!task;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && dispatch({ type: "SELECT_TASK", taskId: null })}>
      <SheetContent className="w-[520px] sm:max-w-[520px] p-0 border-l border-border">
        {task && <TaskDetailContent task={task} />}
      </SheetContent>
    </Sheet>
  );
}

function TaskDetailContent({ task }: { task: Task }) {
  const { state, dispatch } = useApp();
  const subtasks = getSubtasks(state, task.id);
  const comments = getTaskComments(state, task.id);
  const assignee = task.assigneeId ? getUserById(state, task.assigneeId) : null;
  const parentTask = task.parentId ? getTaskById(state, task.parentId) : null;
  const section = state.sections.find((s) => s.id === task.sectionId);

  const [newComment, setNewComment] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState(task.description);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [showAddSubtask, setShowAddSubtask] = useState(false);

  const handleAddComment = () => {
    if (newComment.trim()) {
      dispatch({
        type: "ADD_COMMENT",
        comment: {
          id: nanoid(8),
          taskId: task.id,
          userId: "u1",
          content: newComment.trim(),
          createdAt: new Date().toISOString(),
        },
      });
      setNewComment("");
    }
  };

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      const newTask = createTask(task.projectId, task.sectionId, newSubtaskTitle.trim(), task.id);
      dispatch({ type: "ADD_TASK", task: newTask });
      setNewSubtaskTitle("");
      setShowAddSubtask(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-border">
        {parentTask && (
          <button
            onClick={() => dispatch({ type: "SELECT_TASK", taskId: parentTask.id })}
            className="text-[11px] text-primary hover:underline mb-1 block"
          >
            ← {parentTask.title}
          </button>
        )}
        {section && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: section.color }} />
            <span className="text-[11px] text-muted-foreground">{section.title}</span>
          </div>
        )}

        {isEditingTitle ? (
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={() => {
              dispatch({ type: "UPDATE_TASK", taskId: task.id, updates: { title: editTitle } });
              setIsEditingTitle(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                dispatch({ type: "UPDATE_TASK", taskId: task.id, updates: { title: editTitle } });
                setIsEditingTitle(false);
              }
            }}
            className="text-lg font-bold border-0 p-0 h-auto focus-visible:ring-0 shadow-none"
            autoFocus
          />
        ) : (
          <h2
            className="text-lg font-bold tracking-tight cursor-text hover:text-primary/80 transition-colors"
            onClick={() => {
              setEditTitle(task.title);
              setIsEditingTitle(true);
            }}
          >
            {task.title}
          </h2>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="px-6 py-4 space-y-5">
          {/* Properties Grid */}
          <div className="grid grid-cols-[100px_1fr] gap-y-3 gap-x-4 text-[13px]">
            {/* Status */}
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Clock size={14} /> Status
            </span>
            <Select
              value={task.status}
              onValueChange={(val) =>
                dispatch({ type: "UPDATE_TASK", taskId: task.id, updates: { status: val as TaskStatus } })
              }
            >
              <SelectTrigger className="h-8 text-[13px] w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => (
                  <SelectItem key={s} value={s} className="text-[13px]">
                    {STATUS_CONFIG[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority */}
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Tag size={14} /> Priorität
            </span>
            <Select
              value={task.priority}
              onValueChange={(val) =>
                dispatch({ type: "UPDATE_TASK", taskId: task.id, updates: { priority: val as Priority } })
              }
            >
              <SelectTrigger className="h-8 text-[13px] w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
                  <SelectItem key={p} value={p} className="text-[13px]">
                    {PRIORITY_CONFIG[p].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Assignee */}
            <span className="text-muted-foreground flex items-center gap-1.5">
              <User size={14} /> Zuständig
            </span>
            <Select
              value={task.assigneeId || "unassigned"}
              onValueChange={(val) =>
                dispatch({
                  type: "UPDATE_TASK",
                  taskId: task.id,
                  updates: { assigneeId: val === "unassigned" ? null : val },
                })
              }
            >
              <SelectTrigger className="h-8 text-[13px] w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned" className="text-[13px]">
                  Nicht zugewiesen
                </SelectItem>
                {state.users.map((u) => (
                  <SelectItem key={u.id} value={u.id} className="text-[13px]">
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Due Date */}
            <span className="text-muted-foreground flex items-center gap-1.5">
              <CalendarDays size={14} /> Fällig
            </span>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={task.dueDate || ""}
                onChange={(e) =>
                  dispatch({ type: "UPDATE_TASK", taskId: task.id, updates: { dueDate: e.target.value || null } })
                }
                className="h-8 text-[13px] w-[160px]"
              />
              {task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done" && (
                <span className="text-[10px] text-red-600 font-medium">Überfällig</span>
              )}
            </div>

            {/* Start Date */}
            <span className="text-muted-foreground flex items-center gap-1.5">
              <CalendarDays size={14} /> Start
            </span>
            <Input
              type="date"
              value={task.startDate || ""}
              onChange={(e) =>
                dispatch({ type: "UPDATE_TASK", taskId: task.id, updates: { startDate: e.target.value || null } })
              }
              className="h-8 text-[13px] w-[160px]"
            />
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Beschreibung
            </h3>
            {isEditingDesc ? (
              <div>
                <Textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="text-[13px] min-h-[100px]"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    className="h-7 text-[12px]"
                    onClick={() => {
                      dispatch({ type: "UPDATE_TASK", taskId: task.id, updates: { description: editDesc } });
                      setIsEditingDesc(false);
                    }}
                  >
                    Speichern
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-[12px]" onClick={() => setIsEditingDesc(false)}>
                    Abbrechen
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="text-[13px] text-muted-foreground leading-relaxed cursor-text hover:bg-muted/30 rounded-md p-2 -mx-2 transition-colors min-h-[40px]"
                onClick={() => {
                  setEditDesc(task.description);
                  setIsEditingDesc(true);
                }}
              >
                {task.description || "Klicke, um eine Beschreibung hinzuzufügen..."}
              </div>
            )}
          </div>

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CheckSquare size={13} />
                Unteraufgaben
                {subtasks.length > 0 && (
                  <span className="font-mono">
                    ({subtasks.filter((s) => s.status === "done").length}/{subtasks.length})
                  </span>
                )}
              </h3>
              <button
                onClick={() => setShowAddSubtask(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-1">
                {subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-2.5 py-1.5 px-2 rounded-md hover:bg-muted/30 transition-colors group"
                  >
                    <Checkbox
                      checked={sub.status === "done"}
                      onCheckedChange={(checked) =>
                        dispatch({
                          type: "UPDATE_TASK",
                          taskId: sub.id,
                          updates: { status: checked ? "done" : "todo" },
                        })
                      }
                      className="h-3.5 w-3.5"
                    />
                    <span
                      className={`text-[13px] flex-1 cursor-pointer ${
                        sub.status === "done" ? "line-through text-muted-foreground" : ""
                      }`}
                      onClick={() => dispatch({ type: "SELECT_TASK", taskId: sub.id })}
                    >
                      {sub.title}
                    </span>
                    <button
                      onClick={() => dispatch({ type: "DELETE_TASK", taskId: sub.id })}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showAddSubtask && (
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Neue Unteraufgabe..."
                  className="text-[13px] h-8 flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddSubtask();
                    if (e.key === "Escape") {
                      setShowAddSubtask(false);
                      setNewSubtaskTitle("");
                    }
                  }}
                />
                <Button size="sm" className="h-8 text-[12px]" onClick={handleAddSubtask}>
                  Hinzufügen
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Comments */}
          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
              <MessageSquare size={13} />
              Kommentare ({comments.length})
            </h3>

            <div className="space-y-3">
              {comments.map((comment) => {
                const user = getUserById(state, comment.userId);
                return (
                  <div key={comment.id} className="flex items-start gap-2.5">
                    <Avatar className="h-7 w-7 mt-0.5">
                      <AvatarFallback
                        className="text-[9px] font-semibold"
                        style={{
                          backgroundColor: (user?.color || "#888") + "18",
                          color: user?.color || "#888",
                        }}
                      >
                        {user?.initials || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold">{user?.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-[13px] text-foreground/80 mt-0.5 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Comment */}
            <div className="flex items-start gap-2.5 mt-4">
              <Avatar className="h-7 w-7 mt-0.5">
                <AvatarFallback
                  className="text-[9px] font-semibold"
                  style={{ backgroundColor: state.users[0].color + "18", color: state.users[0].color }}
                >
                  {state.users[0].initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex items-end gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Kommentar schreiben..."
                  className="text-[13px] min-h-[60px] resize-none flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddComment();
                  }}
                />
                <Button
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  title="Senden (Cmd+Enter)"
                >
                  <Send size={14} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          Erstellt: {new Date(task.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
        <span>
          Aktualisiert: {new Date(task.updatedAt).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      </div>
    </div>
  );
}
