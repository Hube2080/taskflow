/**
 * Legacy note:
 * This screen represents the older custom voice-memo workflow.
 * It stays available during the Antigone transition but is no longer the target
 * architecture for the main assistant experience.
 */
import { useDeferredValue, useEffect, useMemo, useState, startTransition, type ReactNode } from "react";
import { useLocation } from "wouter";
import { AudioLines, Brain, FileAudio, FolderSync, Link2, Loader2, Search, Sparkles, TriangleAlert } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useApp } from "@/contexts/AppContext";
import { createIdea } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { VoiceMemoRecord, VoiceMemoSearchResult } from "@shared/voiceMemos";

const STATUS_STYLES: Record<VoiceMemoRecord["status"], string> = {
  pending: "bg-slate-100 text-slate-700",
  processing: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
  skipped: "bg-slate-100 text-slate-700",
};

function MemoStatusBadge({ status }: { status: VoiceMemoRecord["status"] }) {
  return (
    <Badge variant="secondary" className={cn("capitalize", STATUS_STYLES[status])}>
      {status.replace("_", " ")}
    </Badge>
  );
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VoiceMemosView() {
  const { state, dispatch } = useApp();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [selectedMemoId, setSelectedMemoId] = useState<string | null>(null);

  const statusQuery = trpc.voiceMemos.status.useQuery();
  const listQuery = trpc.voiceMemos.list.useQuery({ query: deferredSearch || undefined });
  const detailQuery = trpc.voiceMemos.byId.useQuery(
    { memoId: selectedMemoId ?? "" },
    { enabled: Boolean(selectedMemoId) }
  );

  const importMutation = trpc.voiceMemos.importFromDirectory.useMutation({
    onSuccess: async (result) => {
      await Promise.all([utils.voiceMemos.status.invalidate(), utils.voiceMemos.list.invalidate()]);
      toast.success(`${result.imported} Sprachmemos importiert, ${result.skipped} übersprungen.`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const linkMutation = trpc.voiceMemos.link.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.voiceMemos.list.invalidate(), detailQuery.refetch()]);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const memos = listQuery.data ?? [];
  const selectedMemo = detailQuery.data ?? memos.find((memo) => memo.id === selectedMemoId) ?? null;
  const currentProject = state.projects.find((project) => project.id === state.currentProjectId) ?? null;

  useEffect(() => {
    if (!selectedMemoId && memos[0]) {
      setSelectedMemoId(memos[0].id);
      return;
    }

    if (selectedMemoId && !memos.some((memo) => memo.id === selectedMemoId)) {
      setSelectedMemoId(memos[0]?.id ?? null);
    }
  }, [memos, selectedMemoId]);

  const stats = useMemo(() => {
    const completed = memos.filter((memo) => memo.status === "completed").length;
    const failed = memos.filter((memo) => memo.status === "failed").length;
    return {
      total: statusQuery.data?.totalMemos ?? memos.length,
      completed: statusQuery.data?.completedMemos ?? completed,
      failed: statusQuery.data?.failedMemos ?? failed,
    };
  }, [memos, statusQuery.data]);

  const handleCreateIdea = async (memo: VoiceMemoRecord) => {
    const idea = createIdea({
      title: memo.title || memo.fileName,
      description: [memo.summary, "", memo.transcript].filter(Boolean).join("\n"),
      category: "automation",
      status: "inbox",
      impact: 3,
      effort: 2,
      linkedProjectId: currentProject?.id ?? null,
    });

    dispatch({ type: "ADD_IDEA", idea });

    try {
      await linkMutation.mutateAsync({
        memoId: memo.id,
        projectId: currentProject?.id ?? null,
        ideaId: idea.id,
      });
      toast.success("Sprachmemo wurde als Idea abgelegt.");
      setLocation("/ideas");
    } catch {
      // Error toast comes from the mutation handler.
    }
  };

  const handleLinkProject = async (memo: VoiceMemoRecord) => {
    if (!currentProject) {
      toast.error("Kein aktives Projekt ausgewählt.");
      return;
    }

    try {
      await linkMutation.mutateAsync({
        memoId: memo.id,
        projectId: currentProject.id,
      });
      toast.success(`Mit Projekt „${currentProject.title}“ verknüpft.`);
    } catch {
      // Error toast comes from the mutation handler.
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="max-w-[1380px] p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <AudioLines size={13} />
              Personal Memory
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">Sprachmemos</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Importiere Apple-Sprachnotizen, lasse sie automatisch strukturieren und verknüpfe die Ergebnisse mit
              Projekten oder Ideen.
            </p>
          </div>

          <Button onClick={() => importMutation.mutate({})} disabled={importMutation.isPending}>
            {importMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <FolderSync className="mr-2 size-4" />}
            Ordner importieren
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <StatCard label="Gesamt" value={stats.total} icon={<FileAudio size={16} />} />
          <StatCard label="Analysiert" value={stats.completed} icon={<Brain size={16} />} />
          <StatCard label="Fehler" value={stats.failed} icon={<TriangleAlert size={16} />} />
        </div>

        {statusQuery.data && (!statusQuery.data.hasAiConfig || !statusQuery.data.hasDirectoryAccess) && (
          <Card className="mt-4 border-amber-200 bg-amber-50/70">
            <CardContent className="flex flex-col gap-2 p-4 text-sm text-amber-900">
              {!statusQuery.data.hasAiConfig && (
                <div>`OPENAI_API_KEY` fehlt. Der Import ist eingebaut, kann aber noch nicht gegen OpenAI laufen.</div>
              )}
              {!statusQuery.data.hasDirectoryAccess && (
                <div>
                  Kein Zugriff auf den Voice-Memos-Ordner: <code>{statusQuery.data.directory}</code>
                </div>
              )}
              <div className="text-amber-800/80">Store-Datei: <code>{statusQuery.data.storePath}</code></div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-[360px_minmax(0,1fr)] gap-6 mt-6 items-start">
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between gap-3 text-[15px] font-semibold">
                <span>Memos</span>
                <div className="relative w-[180px]">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Suchen..." />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {listQuery.isLoading && <ListPlaceholder />}
                {!listQuery.isLoading && memos.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    Noch keine Sprachmemos importiert.
                  </div>
                )}
                {memos.map((memo) => (
                  <MemoListItem
                    key={memo.id}
                    memo={memo}
                    active={memo.id === selectedMemoId}
                    onSelect={() => {
                      startTransition(() => setSelectedMemoId(memo.id));
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border min-h-[640px]">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between gap-4 text-[15px] font-semibold">
                <span>Details</span>
                {selectedMemo && <MemoStatusBadge status={selectedMemo.status} />}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {!selectedMemo && <div className="py-12 text-sm text-muted-foreground">Wähle links ein Memo aus.</div>}
              {selectedMemo && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight">
                        {selectedMemo.title || selectedMemo.fileName}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">{selectedMemo.summary || "Noch keine Zusammenfassung vorhanden."}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => handleLinkProject(selectedMemo)} disabled={linkMutation.isPending}>
                        <Link2 className="mr-2 size-4" />
                        Mit Projekt verknüpfen
                      </Button>
                      <Button onClick={() => handleCreateIdea(selectedMemo)} disabled={linkMutation.isPending}>
                        <Sparkles className="mr-2 size-4" />
                        Als Idea speichern
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <InfoCard label="Thema" value={selectedMemo.topic || "Nicht erkannt"} />
                    <InfoCard label="Unterthema" value={selectedMemo.subtopic || "Nicht erkannt"} />
                    <InfoCard label="Datei" value={selectedMemo.fileName} />
                    <InfoCard label="Größe" value={formatBytes(selectedMemo.fileSizeBytes)} />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedMemo.entities.map((entity) => (
                      <Badge key={`${entity.type}-${entity.label}`} variant="secondary">
                        {entity.label}
                      </Badge>
                    ))}
                    {selectedMemo.entities.length === 0 && (
                      <span className="text-sm text-muted-foreground">Keine Entitäten erkannt.</span>
                    )}
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Verknüpfungen
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                      <InfoCard label="Projekt" value={selectedMemo.links.projectId || "Nicht verknüpft"} />
                      <InfoCard label="Idea" value={selectedMemo.links.ideaId || "Nicht verknüpft"} />
                      <InfoCard label="Task" value={selectedMemo.links.taskId || "Nicht verknüpft"} />
                    </div>
                  </div>

                  <Section label="Offene Fragen">
                    {selectedMemo.openQuestions.length > 0 ? (
                      <ul className="space-y-2 text-sm leading-6 text-foreground">
                        {selectedMemo.openQuestions.map((question) => (
                          <li key={question} className="rounded-lg border border-border bg-background px-3 py-2">
                            {question}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">Keine offenen Fragen extrahiert.</p>
                    )}
                  </Section>

                  <Separator />

                  <Section label="Transkript">
                    <div className="rounded-xl border border-border bg-background px-4 py-4 text-sm leading-7 text-foreground whitespace-pre-wrap">
                      {selectedMemo.transcript || "Noch kein Transkript vorhanden."}
                    </div>
                  </Section>

                  {selectedMemo.errorMessage && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {selectedMemo.errorMessage}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <Card className="border border-border">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
        </div>
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</div>
      </CardContent>
    </Card>
  );
}

function MemoListItem({
  memo,
  active,
  onSelect,
}: {
  memo: VoiceMemoSearchResult;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl border px-4 py-3 text-left transition-colors",
        active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{memo.title || memo.fileName}</div>
          <div className="mt-1 text-xs leading-5 text-muted-foreground">
            {memo.summary || memo.transcript || "Noch ohne Inhalt."}
          </div>
        </div>
        <MemoStatusBadge status={memo.status} />
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{memo.topic || "Kein Thema"}</span>
        <span>{Math.round(memo.score * 100)}%</span>
      </div>
    </button>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      {children}
    </section>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium text-foreground break-words">{value}</div>
    </div>
  );
}

function ListPlaceholder() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border px-4 py-3">
          <div className="h-4 w-3/5 rounded bg-muted" />
          <div className="mt-3 h-3 w-full rounded bg-muted/70" />
          <div className="mt-2 h-3 w-4/5 rounded bg-muted/70" />
        </div>
      ))}
    </div>
  );
}
