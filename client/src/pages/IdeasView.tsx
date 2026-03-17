import { useMemo, useState, type ReactNode } from "react";
import { Aperture, Lightbulb, Link2, Orbit, Plus, Sparkles, Target, Trash2, Wand2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import {
  createDefaultSections,
  createIdea,
  createProject,
  createTask,
  getKnowledgeGraph,
  getProjectDefaultSectionId,
  IDEA_CATEGORY_CONFIG,
  IDEA_STATUS_CONFIG,
  type IdeaCategory,
  type IdeaStatus,
} from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLocation } from "wouter";

type FilterStatus = IdeaStatus | "all";
type FilterCategory = IdeaCategory | "all";

const DEFAULT_FORM = {
  title: "",
  description: "",
  category: "integration" as IdeaCategory,
  status: "inbox" as IdeaStatus,
  impact: "3",
  effort: "2",
  linkedProjectId: "none",
};

export default function IdeasView() {
  const { state, dispatch } = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(DEFAULT_FORM);

  const filteredIdeas = useMemo(() => {
    return state.ideas.filter((idea) => {
      const matchesStatus = statusFilter === "all" || idea.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || idea.category === categoryFilter;
      const normalizedSearch = search.trim().toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        idea.title.toLowerCase().includes(normalizedSearch) ||
        idea.description.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [categoryFilter, search, state.ideas, statusFilter]);

  const ideaStats = useMemo(() => {
    return {
      total: state.ideas.length,
      inbox: state.ideas.filter((idea) => idea.status === "inbox").length,
      planned: state.ideas.filter((idea) => idea.status === "planned").length,
      shipped: state.ideas.filter((idea) => idea.status === "shipped").length,
    };
  }, [state.ideas]);
  const graph = useMemo(() => getKnowledgeGraph(state), [state]);

  const resetForm = () => setForm(DEFAULT_FORM);

  const handleCreateIdea = () => {
    const title = form.title.trim();
    const description = form.description.trim();

    if (!title) {
      toast.error("Bitte gib der Idee zuerst einen Titel.");
      return;
    }

    const idea = createIdea({
      title,
      description,
      category: form.category,
      status: form.status,
      impact: clampScore(form.impact),
      effort: clampScore(form.effort),
      linkedProjectId: form.linkedProjectId === "none" ? null : form.linkedProjectId,
    });

    dispatch({ type: "ADD_IDEA", idea });
    resetForm();
    setDialogOpen(false);
    toast.success("Idee wurde gespeichert.");
  };

  return (
    <ScrollArea className="h-full">
      <div className="max-w-[1180px] p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <Sparkles size={13} />
              Product Discovery
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">Ideas & Use Cases</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Sammle hier Produktideen, Integrationen und Automationen, bevor sie in echte Projekte oder Aufgaben
              wandern. So bleibt dein Delivery-Plan sauber und du verlierst trotzdem nichts.
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 text-[13px]">
                <Plus size={14} />
                Neue Idee
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px]">
              <DialogHeader>
                <DialogTitle>Neue Idee erfassen</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="idea-title">Titel</Label>
                  <Input
                    id="idea-title"
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="z. B. Kalender-Integration mit Tagesbriefing"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idea-description">Beschreibung</Label>
                  <Textarea
                    id="idea-description"
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Was soll es können, für wen ist es nützlich und warum ist es wichtig?"
                    className="min-h-[140px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Kategorie</Label>
                    <Select
                      value={form.category}
                      onValueChange={(value) => setForm((current) => ({ ...current, category: value as IdeaCategory }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(IDEA_CATEGORY_CONFIG) as IdeaCategory[]).map((category) => (
                          <SelectItem key={category} value={category}>
                            {IDEA_CATEGORY_CONFIG[category].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(value) => setForm((current) => ({ ...current, status: value as IdeaStatus }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(IDEA_STATUS_CONFIG) as IdeaStatus[]).map((status) => (
                          <SelectItem key={status} value={status}>
                            {IDEA_STATUS_CONFIG[status].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Nutzen (1-5)</Label>
                    <Select
                      value={form.impact}
                      onValueChange={(value) => setForm((current) => ({ ...current, impact: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["1", "2", "3", "4", "5"].map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Aufwand (1-5)</Label>
                    <Select
                      value={form.effort}
                      onValueChange={(value) => setForm((current) => ({ ...current, effort: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["1", "2", "3", "4", "5"].map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Verknüpftes Projekt</Label>
                  <Select
                    value={form.linkedProjectId}
                    onValueChange={(value) => setForm((current) => ({ ...current, linkedProjectId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Noch nicht zugeordnet</SelectItem>
                      {state.projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setDialogOpen(false);
                    }}
                  >
                    Abbrechen
                  </Button>
                  <Button type="button" onClick={handleCreateIdea}>
                    Idee speichern
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <StatCard label="Gesamt" value={ideaStats.total} icon={<Lightbulb size={16} />} />
          <StatCard label="Inbox" value={ideaStats.inbox} icon={<Sparkles size={16} />} />
          <StatCard label="Geplant" value={ideaStats.planned} icon={<Target size={16} />} />
          <StatCard label="Umgesetzt" value={ideaStats.shipped} icon={<Link2 size={16} />} />
        </div>

        <Card className="mt-6 overflow-hidden border border-border">
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <Orbit size={13} />
                Universe Ready
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight">Graph-Grundlage für dein Ideen-Universum</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Ideen, Projekte und Top-Level-Tasks sind jetzt schon als verknüpfter Graph modelliert. Damit können wir
                als Nächstes ein 2D- oder 3D-Netzwerk, ein KI-Assistenten-Dashboard oder thematische Cluster-Ansichten
                auf dieselbe Datenbasis aufsetzen.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[12px] text-muted-foreground">
                <span className="rounded-full border border-border px-3 py-1">Nodes: {graph.nodes.length}</span>
                <span className="rounded-full border border-border px-3 py-1">Edges: {graph.edges.length}</span>
                <span className="rounded-full border border-border px-3 py-1">Typen: Ideas, Projects, Tasks</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-[radial-gradient(circle_at_top,#e0e7ff_0%,rgba(224,231,255,0.32)_18%,rgba(250,250,248,0.12)_48%,rgba(250,250,248,1)_100%)] p-5">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <Aperture size={13} />
                Dashboard Hooks
              </div>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <p>Die aktuelle Struktur trägt bereits:</p>
                <p>{"Idee -> Projekt"}</p>
                <p>{"Idee -> Task"}</p>
                <p>{"Projekt -> Task"}</p>
              </div>
              <div className="mt-5 rounded-xl border border-dashed border-border bg-background/80 p-4 text-[12px] leading-6 text-muted-foreground">
                Nächster Ausbauschritt möglich: Force-Graph, 3D-Sternenkarte, thematische Cluster, Agenten-Status,
                Tool-Integrationen und Routing für deinen KI-Assistenten.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 border border-border">
          <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_180px_180px]">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Suche nach Idee, Nutzen oder Integrationswunsch"
            />

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as FilterStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Status filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                {(Object.keys(IDEA_STATUS_CONFIG) as IdeaStatus[]).map((status) => (
                  <SelectItem key={status} value={status}>
                    {IDEA_STATUS_CONFIG[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as FilterCategory)}>
              <SelectTrigger>
                <SelectValue placeholder="Kategorie filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {(Object.keys(IDEA_CATEGORY_CONFIG) as IdeaCategory[]).map((category) => (
                  <SelectItem key={category} value={category}>
                    {IDEA_CATEGORY_CONFIG[category].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {filteredIdeas.length === 0 ? (
          <Card className="mt-6 border border-dashed border-border bg-card/70">
            <CardContent className="p-10 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Leerer Ideenraum</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">Hier sammelst du alles, was später wichtig werden könnte.</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Lege hier zuerst Use Cases, Integrationen und AI-Funktionen ab. Sobald eine Idee konkret genug ist,
                können wir sie später in Projekte oder Tasks übersetzen.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {filteredIdeas.map((idea) => (
              <IdeaCard key={idea.id} ideaId={idea.id} />
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function IdeaCard({ ideaId }: { ideaId: string }) {
  const { state, dispatch } = useApp();
  const [, setLocation] = useLocation();
  const idea = state.ideas.find((entry) => entry.id === ideaId);
  const [isEditing, setIsEditing] = useState(false);

  if (!idea) return null;

  const linkedProject = idea.linkedProjectId ? state.projects.find((project) => project.id === idea.linkedProjectId) : null;
  const linkedTask = idea.linkedTaskId ? state.tasks.find((task) => task.id === idea.linkedTaskId) : null;
  const statusConfig = IDEA_STATUS_CONFIG[idea.status];
  const categoryConfig = IDEA_CATEGORY_CONFIG[idea.category];
  const score = Math.max(1, idea.impact) - Math.max(1, idea.effort);

  const handleConvertToTask = () => {
    if (linkedTask) {
      toast.message("Diese Idee ist bereits mit einem Task verknüpft.");
      setLocation(`/project/${linkedTask.projectId}/board`);
      return;
    }

    const targetProjectId = idea.linkedProjectId ?? state.currentProjectId;
    const sectionId = getProjectDefaultSectionId(state, targetProjectId);

    if (!sectionId) {
      toast.error("Für dieses Projekt gibt es noch keine Spalten. Bitte zuerst ein Projekt mit Standardstruktur anlegen.");
      return;
    }

    const newTask = createTask(targetProjectId, sectionId, idea.title);
    newTask.description = idea.description;
    newTask.priority = idea.impact >= 4 ? "high" : idea.impact >= 3 ? "medium" : "low";
    newTask.sourceIdeaId = idea.id;

    dispatch({ type: "ADD_TASK", task: newTask });
    dispatch({
      type: "UPDATE_IDEA",
      ideaId: idea.id,
      updates: {
        status: "planned",
        linkedProjectId: targetProjectId,
        linkedTaskId: newTask.id,
      },
    });

    toast.success("Idee wurde als Aufgabe geplant.");
    setLocation(`/project/${targetProjectId}/board`);
  };

  const handleConvertToProject = () => {
    if (linkedProject) {
      toast.message("Diese Idee ist bereits einem Projekt zugeordnet.");
      setLocation(`/project/${linkedProject.id}/overview`);
      return;
    }

    const projectColor = linkedProject?.color ?? ["#4F46E5", "#0F766E", "#B45309", "#7C3AED"][state.projects.length % 4];
    const newProject = createProject(idea.title, idea.description || "Aus einer Idee entstandenes Projekt.", projectColor);
    const sections = createDefaultSections(newProject.id);
    const kickoffTask = createTask(newProject.id, sections[0].id, `Kickoff: ${idea.title}`);
    kickoffTask.description = idea.description;
    kickoffTask.sourceIdeaId = idea.id;

    dispatch({ type: "ADD_PROJECT", project: newProject, sections });
    dispatch({ type: "ADD_TASK", task: kickoffTask });
    dispatch({ type: "SET_CURRENT_PROJECT", projectId: newProject.id });
    dispatch({
      type: "UPDATE_IDEA",
      ideaId: idea.id,
      updates: {
        status: "planned",
        linkedProjectId: newProject.id,
        linkedTaskId: kickoffTask.id,
      },
    });

    toast.success("Idee wurde in ein neues Projekt überführt.");
    setLocation(`/project/${newProject.id}/overview`);
  };

  return (
    <Card className="border border-border">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={statusConfig.badgeClassName}>
                {statusConfig.label}
              </Badge>
              <Badge variant="outline" className="border-border bg-background text-muted-foreground">
                {categoryConfig.label}
              </Badge>
            </div>
            <CardTitle className="mt-3 text-lg tracking-tight">{idea.title}</CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing((current) => !current)}>
              {isEditing ? "Fertig" : "Bearbeiten"}
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleConvertToTask}>
              <Wand2 size={14} />
              Als Task
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleConvertToProject}>
              <Link2 size={14} />
              Als Projekt
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                const confirmed = window.confirm(`Idee "${idea.title}" wirklich löschen?`);
                if (!confirmed) return;
                dispatch({ type: "DELETE_IDEA", ideaId: idea.id });
                toast.success("Idee wurde gelöscht.");
              }}
            >
              <Trash2 size={14} />
              <span className="sr-only">Idee löschen</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isEditing ? (
          <IdeaEditor ideaId={idea.id} onDone={() => setIsEditing(false)} />
        ) : (
          <>
            <p className="text-sm leading-6 text-muted-foreground">
              {idea.description || "Noch keine Detailbeschreibung hinterlegt."}
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              <MiniMetric label="Nutzen" value={`${idea.impact}/5`} />
              <MiniMetric label="Aufwand" value={`${idea.effort}/5`} />
              <MiniMetric label="Score" value={score >= 0 ? `+${score}` : `${score}`} />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
              <span>Erstellt: {formatIdeaDate(idea.createdAt)}</span>
              {linkedProject ? (
                <span className="rounded-full border border-border px-2 py-1">
                  Verknüpft mit {linkedProject.title}
                </span>
              ) : (
                <span className="rounded-full border border-dashed border-border px-2 py-1">
                  Noch keinem Projekt zugeordnet
                </span>
              )}
              {linkedTask ? (
                <span className="rounded-full border border-border px-2 py-1">
                  Task: {linkedTask.title}
                </span>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function IdeaEditor({ ideaId, onDone }: { ideaId: string; onDone: () => void }) {
  const { state, dispatch } = useApp();
  const idea = state.ideas.find((entry) => entry.id === ideaId);

  const [title, setTitle] = useState(idea?.title ?? "");
  const [description, setDescription] = useState(idea?.description ?? "");
  const [category, setCategory] = useState<IdeaCategory>(idea?.category ?? "integration");
  const [status, setStatus] = useState<IdeaStatus>(idea?.status ?? "inbox");
  const [impact, setImpact] = useState(String(idea?.impact ?? 3));
  const [effort, setEffort] = useState(String(idea?.effort ?? 2));
  const [linkedProjectId, setLinkedProjectId] = useState(idea?.linkedProjectId ?? "none");

  if (!idea) return null;

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("Bitte gib der Idee einen Titel.");
      return;
    }

    dispatch({
      type: "UPDATE_IDEA",
      ideaId: idea.id,
      updates: {
        title: trimmedTitle,
        description: description.trim(),
        category,
        status,
        impact: clampScore(impact),
        effort: clampScore(effort),
        linkedProjectId: linkedProjectId === "none" ? null : linkedProjectId,
      },
    });

    toast.success("Idee wurde aktualisiert.");
    onDone();
  };

  return (
    <div className="space-y-3">
      <Input value={title} onChange={(event) => setTitle(event.target.value)} />
      <Textarea value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-[120px]" />

      <div className="grid gap-3 sm:grid-cols-2">
        <Select value={category} onValueChange={(value) => setCategory(value as IdeaCategory)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(IDEA_CATEGORY_CONFIG) as IdeaCategory[]).map((entry) => (
              <SelectItem key={entry} value={entry}>
                {IDEA_CATEGORY_CONFIG[entry].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(value) => setStatus(value as IdeaStatus)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(IDEA_STATUS_CONFIG) as IdeaStatus[]).map((entry) => (
              <SelectItem key={entry} value={entry}>
                {IDEA_STATUS_CONFIG[entry].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={impact} onValueChange={setImpact}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["1", "2", "3", "4", "5"].map((value) => (
              <SelectItem key={value} value={value}>
                Nutzen {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={effort} onValueChange={setEffort}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["1", "2", "3", "4", "5"].map((value) => (
              <SelectItem key={value} value={value}>
                Aufwand {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Select value={linkedProjectId} onValueChange={setLinkedProjectId}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Noch nicht zugeordnet</SelectItem>
          {state.projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Abbrechen
        </Button>
        <Button type="button" onClick={handleSave}>
          Speichern
        </Button>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <Card className="border border-border">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 text-primary">{icon}</div>
      </CardContent>
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-3 py-2">
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function clampScore(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(5, Math.max(1, Math.round(parsed)));
}

function formatIdeaDate(value: string) {
  return new Date(value).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
