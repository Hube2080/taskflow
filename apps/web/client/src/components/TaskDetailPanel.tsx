import { useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { CalendarDays, CheckSquare, Clock, FileUp, Loader2, MessageSquare, Paperclip, Plus, Send, Tag, Trash2, User } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import {
  createTask,
  getSubtasks,
  getTaskById,
  getTaskComments,
  getUserById,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  type Priority,
  type Task,
  type TaskStatus,
} from "@/lib/store";
import { trpc } from "@/lib/trpc";
import { IS_STATIC_PUBLISH } from "@/lib/runtime";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

function formatTimestamp(dateString: string) {
  return new Date(dateString).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString("de-DE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function fileToBase64(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const base64 = result.includes(",") ? result.split(",")[1] ?? "" : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Datei konnte nicht gelesen werden"));
    reader.readAsDataURL(file);
  });
}

export default function TaskDetailPanel() {
  const { state, dispatch } = useApp();
  const task = state.selectedTaskId ? getTaskById(state, state.selectedTaskId) : null;
  const isOpen = !!task;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && dispatch({ type: "SELECT_TASK", taskId: null })}>
      <SheetContent className="w-[560px] sm:max-w-[560px] p-0 border-l border-border">
        {task ? <TaskDetailContent task={task} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function TaskDetailContent({ task }: { task: Task }) {
  const { state, dispatch } = useApp();
  const subtasks = getSubtasks(state, task.id);
  const comments = getTaskComments(state, task.id);
  const parentTask = task.parentId ? getTaskById(state, task.parentId) : null;
  const section = state.sections.find((entry) => entry.id === task.sectionId);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [newComment, setNewComment] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState(task.description);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [showAddSubtask, setShowAddSubtask] = useState(false);

  const trpcUtils = trpc.useUtils();
  const filesQuery = trpc.files.list.useQuery(
    { projectId: task.projectId, taskId: task.id },
    { enabled: !IS_STATIC_PUBLISH }
  );
  const uploadMutation = trpc.files.upload.useMutation({
    onSuccess: async () => {
      await trpcUtils.files.list.invalidate({ projectId: task.projectId, taskId: task.id });
      toast.success("Datei wurde gespeichert.");
    },
    onError: (error) => {
      toast.error(error.message || "Datei konnte nicht hochgeladen werden.");
    },
  });

  const completedSubtasks = useMemo(
    () => subtasks.filter((subtask) => subtask.status === "done").length,
    [subtasks]
  );

  const handleAddComment = () => {
    if (!newComment.trim()) return;

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
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;

    const newTask = createTask(task.projectId, task.sectionId, newSubtaskTitle.trim(), task.id);
    dispatch({ type: "ADD_TASK", task: newTask });
    setNewSubtaskTitle("");
    setShowAddSubtask(false);
    toast.success("Unteraufgabe wurde hinzugefügt.");
  };

  const handleDeleteTask = () => {
    const label = task.parentId ? "Unteraufgabe" : "Aufgabe";
    const confirmed = window.confirm(
      `${label} "${task.title}" wirklich löschen? Zugehörige Unteraufgaben und Kommentare werden ebenfalls entfernt.`
    );

    if (!confirmed) return;

    dispatch({ type: "DELETE_TASK", taskId: task.id });
    toast.success(`${label} wurde gelöscht.`);
  };

  const handleUploadClick = () => {
    if (IS_STATIC_PUBLISH) {
      toast.message("Datei-Upload ist in der statischen GitHub-Pages-Version deaktiviert.");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;

    if (selected.size > 15 * 1024 * 1024) {
      toast.error("Bitte eine Datei bis maximal 15 MB auswählen.");
      return;
    }

    try {
      const base64 = await fileToBase64(selected);
      await uploadMutation.mutateAsync({
        projectId: task.projectId,
        taskId: task.id,
        fileName: selected.name,
        mimeType: selected.type || "application/octet-stream",
        base64,
        sizeBytes: selected.size,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Datei konnte nicht gelesen werden.");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 pb-4 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {parentTask ? (
              <button
                onClick={() => dispatch({ type: "SELECT_TASK", taskId: parentTask.id })}
                className="mb-1 block text-[11px] text-primary hover:underline"
              >
                ← {parentTask.title}
              </button>
            ) : null}
            {section ? (
              <div className="mb-2 flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: section.color }} />
                <span className="text-[11px] text-muted-foreground">{section.title}</span>
              </div>
            ) : null}
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleDeleteTask}>
            <Trash2 size={15} />
            <span className="sr-only">Aufgabe löschen</span>
          </Button>
        </div>

        {isEditingTitle ? (
          <Input
            value={editTitle}
            onChange={(event) => setEditTitle(event.target.value)}
            onBlur={() => {
              dispatch({ type: "UPDATE_TASK", taskId: task.id, updates: { title: editTitle } });
              setIsEditingTitle(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                dispatch({ type: "UPDATE_TASK", taskId: task.id, updates: { title: editTitle } });
                setIsEditingTitle(false);
              }
            }}
            className="h-auto border-0 p-0 text-lg font-bold shadow-none focus-visible:ring-0"
            autoFocus
          />
        ) : (
          <h2
            className="cursor-text text-lg font-bold tracking-tight transition-colors hover:text-primary/80"
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
        <div className="space-y-5 px-6 py-4">
          <div className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-3 text-[13px]">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock size={14} /> Status
            </span>
            <Select
              value={task.status}
              onValueChange={(value) =>
                dispatch({ type: "UPDATE_TASK", taskId: task.id, updates: { status: value as TaskStatus } })
              }
            >
              <SelectTrigger className="h-8 w-[180px] text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((status) => (
                  <SelectItem key={status} value={status} className="text-[13px]">
                    {STATUS_CONFIG[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Tag size={14} /> Priorität
            </span>
            <Select
              value={task.priority}
              onValueChange={(value) =>
                dispatch({ type: "UPDATE_TASK", taskId: task.id, updates: { priority: value as Priority } })
              }
            >
              <SelectTrigger className="h-8 w-[180px] text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((priority) => (
                  <SelectItem key={priority} value={priority} className="text-[13px]">
                    {PRIORITY_CONFIG[priority].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="flex items-center gap-1.5 text-muted-foreground">
              <User size={14} /> Zuständig
            </span>
            <Select
              value={task.assigneeId || "unassigned"}
              onValueChange={(value) =>
                dispatch({
                  type: "UPDATE_TASK",
                  taskId: task.id,
                  updates: { assigneeId: value === "unassigned" ? null : value },
                })
              }
            >
              <SelectTrigger className="h-8 w-[180px] text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned" className="text-[13px]">
                  Nicht zugewiesen
                </SelectItem>
                {state.users.map((user) => (
                  <SelectItem key={user.id} value={user.id} className="text-[13px]">
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarDays size={14} /> Fällig
            </span>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={task.dueDate || ""}
                onChange={(event) =>
                  dispatch({ type: "UPDATE_TASK", taskId: task.id, updates: { dueDate: event.target.value || null } })
                }
                className="h-8 w-[180px] text-[13px]"
              />
              {task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done" ? (
                <span className="text-[10px] font-medium text-red-600">Überfällig</span>
              ) : null}
            </div>

            <span className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarDays size={14} /> Start
            </span>
            <Input
              type="date"
              value={task.startDate || ""}
              onChange={(event) =>
                dispatch({ type: "UPDATE_TASK", taskId: task.id, updates: { startDate: event.target.value || null } })
              }
              className="h-8 w-[180px] text-[13px]"
            />
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Beschreibung</h3>
            {isEditingDesc ? (
              <div>
                <Textarea
                  value={editDesc}
                  onChange={(event) => setEditDesc(event.target.value)}
                  className="min-h-[100px] text-[13px]"
                  autoFocus
                />
                <div className="mt-2 flex gap-2">
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
                className="-mx-2 min-h-[40px] cursor-text rounded-md p-2 text-[13px] leading-relaxed text-muted-foreground transition-colors hover:bg-muted/30"
                onClick={() => {
                  setEditDesc(task.description);
                  setIsEditingDesc(true);
                }}
              >
                {task.description || "Klicke, um eine Beschreibung hinzuzufügen..."}
              </div>
            )}
          </div>

          <Separator />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                <CheckSquare size={13} /> Unteraufgaben
                <span className="font-mono">({completedSubtasks}/{subtasks.length})</span>
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-[12px]"
                onClick={() => setShowAddSubtask((current) => !current)}
              >
                <Plus size={14} /> Unteraufgabe hinzufügen
              </Button>
            </div>

            {subtasks.length > 0 ? (
              <div className="space-y-1">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="group flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/30"
                  >
                    <Checkbox
                      checked={subtask.status === "done"}
                      onCheckedChange={(checked) =>
                        dispatch({
                          type: "UPDATE_TASK",
                          taskId: subtask.id,
                          updates: { status: checked ? "done" : "todo" },
                        })
                      }
                      className="h-3.5 w-3.5"
                    />
                    <span
                      className={`flex-1 cursor-pointer text-[13px] ${subtask.status === "done" ? "line-through text-muted-foreground" : ""}`}
                      onClick={() => dispatch({ type: "SELECT_TASK", taskId: subtask.id })}
                    >
                      {subtask.title}
                    </span>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        const confirmed = window.confirm(`Unteraufgabe "${subtask.title}" wirklich löschen?`);
                        if (!confirmed) return;
                        dispatch({ type: "DELETE_TASK", taskId: subtask.id });
                        toast.success("Unteraufgabe wurde gelöscht.");
                      }}
                      className="text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-[13px] text-muted-foreground">
                Für diese Aufgabe gibt es noch keine Unteraufgaben.
              </div>
            )}

            {showAddSubtask ? (
              <div className="mt-3 rounded-xl border border-border bg-muted/20 p-3">
                <div className="mb-2 text-[12px] font-medium text-foreground">Neue Unteraufgabe</div>
                <div className="flex items-center gap-2">
                  <Input
                    value={newSubtaskTitle}
                    onChange={(event) => setNewSubtaskTitle(event.target.value)}
                    placeholder="Zum Beispiel: Hardwarecheck dokumentieren"
                    className="h-9 flex-1 text-[13px]"
                    autoFocus
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleAddSubtask();
                      if (event.key === "Escape") {
                        setShowAddSubtask(false);
                        setNewSubtaskTitle("");
                      }
                    }}
                  />
                  <Button size="sm" className="h-9 text-[12px]" onClick={handleAddSubtask}>
                    Hinzufügen
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <Separator />

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Paperclip size={13} /> Dateien
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-[12px]"
                onClick={handleUploadClick}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
                Datei hochladen
              </Button>
            </div>

            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelection} />

            <div className="rounded-xl border border-border bg-muted/15 p-3">
              <div className="mb-3 text-[12px] text-muted-foreground">
                {IS_STATIC_PUBLISH
                  ? "In der statischen Publish-Version ist Datei-Upload deaktiviert. Lokal im Full-Stack-Betrieb bleibt diese Funktion erhalten."
                  : "Dateien werden jetzt serverseitig gespeichert und bleiben projektbezogen verfügbar."}
              </div>

              {IS_STATIC_PUBLISH ? (
                <div className="rounded-lg border border-dashed border-border bg-background px-4 py-4 text-[13px] text-muted-foreground">
                  Datei-Upload steht in der GitHub-Pages-Version nicht zur Verfügung.
                </div>
              ) : filesQuery.isLoading ? (
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" /> Dateien werden geladen...
                </div>
              ) : filesQuery.data && filesQuery.data.length > 0 ? (
                <div className="space-y-2">
                  {filesQuery.data.map((file) => (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 transition-colors hover:bg-muted/30"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-foreground">{file.originalName}</div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {Math.max(1, Math.round(file.sizeBytes / 1024))} KB · {formatDateTime(String(file.createdAt))}
                        </div>
                      </div>
                      <Badge variant="secondary" className="ml-3 shrink-0">
                        {file.mimeType.split("/")[1] || "Datei"}
                      </Badge>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-background px-4 py-4 text-[13px] text-muted-foreground">
                  Noch keine Dateien vorhanden. Lade hier Briefings, Screenshots oder Dokumente direkt zu dieser Aufgabe hoch.
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              <MessageSquare size={13} /> Kommentare ({comments.length})
            </h3>

            <div className="space-y-3">
              {comments.map((comment) => {
                const user = getUserById(state, comment.userId);
                return (
                  <div key={comment.id} className="flex items-start gap-2.5">
                    <Avatar className="mt-0.5 h-7 w-7">
                      <AvatarFallback
                        className="text-[9px] font-semibold"
                        style={{
                          backgroundColor: `${user?.color || "#888"}18`,
                          color: user?.color || "#888",
                        }}
                      >
                        {user?.initials || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold">{user?.name}</span>
                        <span className="text-[10px] text-muted-foreground">{formatDateTime(comment.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-foreground/80">{comment.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-start gap-2.5">
              <Avatar className="mt-0.5 h-7 w-7">
                <AvatarFallback
                  className="text-[9px] font-semibold"
                  style={{ backgroundColor: `${state.users[0].color}18`, color: state.users[0].color }}
                >
                  {state.users[0].initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 items-end gap-2">
                <Textarea
                  value={newComment}
                  onChange={(event) => setNewComment(event.target.value)}
                  placeholder="Kommentar schreiben..."
                  className="min-h-[60px] flex-1 resize-none text-[13px]"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) handleAddComment();
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

      <div className="flex items-center justify-between border-t border-border px-6 py-3 text-[11px] text-muted-foreground">
        <span>Erstellt: {formatTimestamp(task.createdAt)}</span>
        <span>Aktualisiert: {formatTimestamp(task.updatedAt)}</span>
      </div>
    </div>
  );
}
