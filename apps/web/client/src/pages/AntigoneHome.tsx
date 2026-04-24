import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Archive,
  ArrowRight,
  Bot,
  Brain,
  ChevronDown,
  Clock3,
  Database,
  FileText,
  HeartPulse,
  ListTodo,
  Moon,
  PlusCircle,
  RefreshCw,
  Save,
  Sparkles,
  SunMedium,
  Target,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  DEFAULT_ROUTINE_TIMES,
  PROFILE_MEMORY_TYPES,
  SAVED_ITEM_TYPES,
  type DailyContextRecord,
  type ProfileMemoryItem,
  type RoutineEventRecord,
  type SavedItemRecord,
} from "@shared/antigoneMemory";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const PROFILE_TYPE_LABELS: Record<(typeof PROFILE_MEMORY_TYPES)[number], string> = {
  preferred_voice_tone: "Preferred voice / tone",
  medication_basic: "Medication basics",
  recurring_reminder: "Recurring reminder",
  leaving_home_reminder: "Leaving-home reminder",
  friction_point: "Known friction point",
  stable_preference: "Stable preference",
};

const SAVED_ITEM_LABELS: Record<(typeof SAVED_ITEM_TYPES)[number], string> = {
  thought: "Thought",
  idea: "Idea",
  reminder: "Reminder",
  carry_forward: "Carry forward",
  reflection_followup: "Reflection follow-up",
};

const ROUTINE_LABELS: Record<RoutineEventRecord["eventType"], string> = {
  morning_checkin: "Morning check-in",
  midday_checkin: "Midday check-in",
  evening_reflection: "Evening reflection",
};

const COMPLETION_LABELS: Record<RoutineEventRecord["completionStatus"], string> = {
  pending: "Pending",
  completed: "Completed",
  skipped: "Skipped",
};

const ROUTINE_BADGE_CLASSNAMES: Record<RoutineEventRecord["completionStatus"], string> = {
  pending: "bg-slate-100 text-slate-700",
  completed: "bg-emerald-50 text-emerald-700",
  skipped: "bg-amber-50 text-amber-700",
};

type RatingFieldProps = {
  id: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
};

function formatShortDate(value: string | null | undefined) {
  if (!value) return "No date";
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return `${date.toLocaleDateString("de-DE")} ${date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`;
}

function buildMorningState(record: DailyContextRecord | null | undefined) {
  return {
    priority1: record?.priority1 ?? "",
    priority2: record?.priority2 ?? "",
    priority3: record?.priority3 ?? "",
    smallestNextStep: record?.smallestNextStep ?? "",
    deprioritizedToday: record?.deprioritizedToday ?? "",
    stateMood: record?.stateMood ?? 3,
    stateEnergy: record?.stateEnergy ?? 3,
    stateStress: record?.stateStress ?? 3,
  };
}

function RatingField({ id, label, value, onChange }: RatingFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value ? String(value) : "unset"} onValueChange={(next) => onChange(next === "unset" ? null : Number(next))}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unset">Unset</SelectItem>
          <SelectItem value="1">1 · Very low</SelectItem>
          <SelectItem value="2">2 · Low</SelectItem>
          <SelectItem value="3">3 · Steady</SelectItem>
          <SelectItem value="4">4 · Good</SelectItem>
          <SelectItem value="5">5 · Strong</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function EmptyBlock({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
      <div className="font-medium text-foreground">{title}</div>
      <div className="mt-1 leading-6">{detail}</div>
    </div>
  );
}

function PresenceStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "default" | "alert";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-4",
        accent === "alert" ? "border-amber-200 bg-amber-50/80" : "border-white/60 bg-white/70"
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-sm font-medium leading-6 text-foreground">{value}</div>
    </div>
  );
}

function SavedItemRow({
  item,
  onArchive,
  archiving,
}: {
  item: SavedItemRecord;
  onArchive: (item: SavedItemRecord) => void;
  archiving: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{SAVED_ITEM_LABELS[item.itemType]}</Badge>
            <span className="text-xs text-muted-foreground">
              {item.targetDate ? `For ${formatShortDate(item.targetDate)}` : "Untargeted"}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-foreground">{item.content}</p>
          <p className="mt-2 text-xs text-muted-foreground">Saved {formatDateTime(item.createdAt)}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onArchive(item)} disabled={archiving} aria-label="Archive item">
          <Archive className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function ProfileMemoryRow({
  item,
  onToggle,
  saving,
}: {
  item: ProfileMemoryItem;
  onToggle: (item: ProfileMemoryItem) => void;
  saving: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{PROFILE_TYPE_LABELS[item.memoryType]}</Badge>
            <Badge variant={item.isActive ? "default" : "outline"}>{item.isActive ? "Active" : "Paused"}</Badge>
          </div>
          <div className="text-sm font-medium text-foreground">{item.label}</div>
          <div className="text-sm leading-6 text-muted-foreground">{item.valueText}</div>
        </div>
        <Button variant="outline" size="sm" onClick={() => onToggle(item)} disabled={saving}>
          {item.isActive ? "Pause" : "Restore"}
        </Button>
      </div>
    </div>
  );
}

export default function AntigoneHome() {
  const utils = trpc.useUtils();
  const presenceQuery = trpc.antigone.presence.useQuery(undefined, { refetchOnWindowFocus: false });
  const dailyContextQuery = trpc.antigone.dailyContext.byDate.useQuery({}, { refetchOnWindowFocus: false });
  const profileQuery = trpc.antigone.profile.list.useQuery(undefined, { refetchOnWindowFocus: false });
  const routineQuery = trpc.antigone.routine.list.useQuery({ limit: 18 }, { refetchOnWindowFocus: false });
  const savedItemsQuery = trpc.antigone.savedItems.list.useQuery({ status: "active", limit: 24 }, { refetchOnWindowFocus: false });
  const historyQuery = trpc.antigone.insights.history.useQuery({ limit: 7 }, { refetchOnWindowFocus: false });

  const saveMorningPlanMutation = trpc.antigone.dailyContext.saveMorningPlan.useMutation();
  const recordRoutineMutation = trpc.antigone.routine.record.useMutation();
  const saveThoughtMutation = trpc.antigone.savedItems.saveThought.useMutation();
  const archiveSavedItemMutation = trpc.antigone.savedItems.archive.useMutation();
  const upsertProfileMutation = trpc.antigone.profile.upsert.useMutation();

  const [morningPlan, setMorningPlan] = useState(buildMorningState(null));
  const [morningSeeded, setMorningSeeded] = useState(false);
  const [middayForm, setMiddayForm] = useState({
    completionStatus: "completed" as RoutineEventRecord["completionStatus"],
    mood: 3 as number | null,
    energy: 3 as number | null,
    stress: 3 as number | null,
    focus: 3 as number | null,
    medicationStatus: "",
    foodText: "",
    waterGlasses: 2,
    notes: "",
  });
  const [eveningForm, setEveningForm] = useState({
    completionStatus: "completed" as RoutineEventRecord["completionStatus"],
    mood: 3 as number | null,
    energy: 3 as number | null,
    stress: 3 as number | null,
    focus: 3 as number | null,
    sleepQuality: 3 as number | null,
    reflectionText: "",
    notes: "",
    followUpContent: "",
    followUpTargetDate: "",
  });
  const [thoughtForm, setThoughtForm] = useState({
    content: "",
    itemType: "thought" as SavedItemRecord["itemType"],
    targetDate: "",
  });
  const [profileForm, setProfileForm] = useState({
    memoryType: "preferred_voice_tone" as ProfileMemoryItem["memoryType"],
    label: "",
    valueText: "",
  });
  const [debugOpen, setDebugOpen] = useState(false);

  useEffect(() => {
    if (morningSeeded) return;
    if (!dailyContextQuery.data) return;
    setMorningPlan(buildMorningState(dailyContextQuery.data));
    setMorningSeeded(true);
  }, [dailyContextQuery.data, morningSeeded]);

  const refreshAntigone = async () => {
    await Promise.all([
      utils.antigone.presence.invalidate(),
      utils.antigone.dailyContext.byDate.invalidate(),
      utils.antigone.routine.list.invalidate(),
      utils.antigone.savedItems.list.invalidate(),
      utils.antigone.profile.list.invalidate(),
      utils.antigone.insights.history.invalidate(),
    ]);
  };

  const activeCarryForwardItems = useMemo(
    () =>
      (savedItemsQuery.data ?? []).filter(
        (item) => item.itemType === "carry_forward" || item.itemType === "reflection_followup"
      ),
    [savedItemsQuery.data]
  );

  const routineChartData = useMemo(() => {
    const buckets = new Map<string, { date: string; completed: number; skipped: number }>();

    for (const event of historyQuery.data?.recentRoutineEvents ?? []) {
      const bucket = buckets.get(event.scheduledDate) ?? { date: event.scheduledDate, completed: 0, skipped: 0 };
      if (event.completionStatus === "completed") {
        bucket.completed += 1;
      }
      if (event.completionStatus === "skipped") {
        bucket.skipped += 1;
      }
      buckets.set(event.scheduledDate, bucket);
    }

    return [...buckets.values()]
      .sort((left, right) => left.date.localeCompare(right.date))
      .slice(-7)
      .map((bucket) => ({
        ...bucket,
        label: bucket.date.slice(5),
      }));
  }, [historyQuery.data]);

  const recentDailyContext = historyQuery.data?.recentDailyContext ?? [];
  const recentRoutineEvents = routineQuery.data ?? [];
  const recentSavedItems = historyQuery.data?.recentSavedItems ?? [];
  const profileItems = profileQuery.data ?? [];

  const handleSaveMorningPlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await saveMorningPlanMutation.mutateAsync({
        priority1: morningPlan.priority1 || null,
        priority2: morningPlan.priority2 || null,
        priority3: morningPlan.priority3 || null,
        smallestNextStep: morningPlan.smallestNextStep || null,
        deprioritizedToday: morningPlan.deprioritizedToday || null,
        stateMood: morningPlan.stateMood,
        stateEnergy: morningPlan.stateEnergy,
        stateStress: morningPlan.stateStress,
      });
      toast.success("Morning planning saved to Antigone memory.");
      await refreshAntigone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Morning planning could not be saved.");
    }
  };

  const handleRecordMidday = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await recordRoutineMutation.mutateAsync({
        eventType: "midday_checkin",
        scheduledTimeLocal: DEFAULT_ROUTINE_TIMES.midday_checkin,
        completionStatus: middayForm.completionStatus,
        mood: middayForm.mood,
        energy: middayForm.energy,
        stress: middayForm.stress,
        focus: middayForm.focus,
        medicationStatus: middayForm.medicationStatus || null,
        foodText: middayForm.foodText || null,
        waterGlasses: middayForm.waterGlasses,
        notes: middayForm.notes || null,
      });
      toast.success("Midday check-in recorded.");
      setMiddayForm((current) => ({ ...current, notes: "" }));
      await refreshAntigone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Midday check-in could not be saved.");
    }
  };

  const handleRecordEvening = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const routineEvent = await recordRoutineMutation.mutateAsync({
        eventType: "evening_reflection",
        scheduledTimeLocal: DEFAULT_ROUTINE_TIMES.evening_reflection,
        completionStatus: eveningForm.completionStatus,
        mood: eveningForm.mood,
        energy: eveningForm.energy,
        stress: eveningForm.stress,
        focus: eveningForm.focus,
        sleepQuality: eveningForm.sleepQuality,
        reflectionText: eveningForm.reflectionText || null,
        notes: eveningForm.notes || null,
      });

      if (eveningForm.followUpContent.trim()) {
        await saveThoughtMutation.mutateAsync({
          content: eveningForm.followUpContent,
          itemType: "reflection_followup",
          targetDate: eveningForm.followUpTargetDate || null,
          sourceEventId: routineEvent?.id ?? null,
        });
      }

      toast.success("Evening reflection saved.");
      setEveningForm({
        completionStatus: "completed",
        mood: 3,
        energy: 3,
        stress: 3,
        focus: 3,
        sleepQuality: 3,
        reflectionText: "",
        notes: "",
        followUpContent: "",
        followUpTargetDate: "",
      });
      await refreshAntigone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Evening reflection could not be saved.");
    }
  };

  const handleSaveThought = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await saveThoughtMutation.mutateAsync({
        content: thoughtForm.content,
        itemType: thoughtForm.itemType,
        targetDate: thoughtForm.targetDate || null,
      });
      toast.success("Thought saved for later.");
      setThoughtForm({
        content: "",
        itemType: "thought",
        targetDate: "",
      });
      await refreshAntigone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Thought could not be saved.");
    }
  };

  const handleAddProfileItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await upsertProfileMutation.mutateAsync(profileForm);
      toast.success("Profile memory saved.");
      setProfileForm({
        memoryType: "preferred_voice_tone",
        label: "",
        valueText: "",
      });
      await refreshAntigone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Profile memory could not be saved.");
    }
  };

  const handleToggleProfileItem = async (item: ProfileMemoryItem) => {
    try {
      await upsertProfileMutation.mutateAsync({
        id: item.id,
        memoryType: item.memoryType,
        label: item.label,
        valueText: item.valueText,
        sortOrder: item.sortOrder,
        isActive: !item.isActive,
      });
      toast.success(item.isActive ? "Profile item paused." : "Profile item restored.");
      await refreshAntigone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Profile item could not be updated.");
    }
  };

  const handleArchiveSavedItem = async (item: SavedItemRecord) => {
    try {
      await archiveSavedItemMutation.mutateAsync({ id: item.id });
      toast.success("Saved item archived.");
      await refreshAntigone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Saved item could not be archived.");
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-[1480px] p-8">
        <div className="rounded-[28px] border border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(253,246,236,0.95),rgba(248,247,243,0.98)_46%,rgba(255,255,255,1)_100%)] p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                <Bot className="size-3.5" />
                Antigone Memory Layer
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Presence, Flow, and continuity</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                This workspace now keeps Antigone grounded in what matters today: current priorities, the next small step,
                routine check-ins, and saved items that should not vanish between reloads.
              </p>
            </div>
            <Button variant="outline" onClick={refreshAntigone} disabled={presenceQuery.isFetching || historyQuery.isFetching}>
              <RefreshCw className={cn("mr-2 size-4", (presenceQuery.isFetching || historyQuery.isFetching) && "animate-spin")} />
              Refresh memory
            </Button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <PresenceStat
              label="Today's priorities"
              value={
                presenceQuery.data?.priorities.length
                  ? presenceQuery.data.priorities.join(" · ")
                  : "No priorities saved yet. Morning planning will anchor the day here."
              }
            />
            <PresenceStat
              label="Smallest next step"
              value={presenceQuery.data?.smallestNextStep || "No next step saved yet."}
            />
            <PresenceStat
              label="Next due routine"
              accent={presenceQuery.data?.nextDueRoutine.overdue ? "alert" : "default"}
              value={
                presenceQuery.data
                  ? `${presenceQuery.data.nextDueRoutine.label} · ${formatShortDate(
                      presenceQuery.data.nextDueRoutine.scheduledDate
                    )} · ${presenceQuery.data.nextDueRoutine.scheduledTimeLocal}${
                      presenceQuery.data.nextDueRoutine.overdue ? " · overdue" : ""
                    }`
                  : "Loading routine cadence..."
              }
            />
            <PresenceStat
              label="Relevant saved item"
              value={
                presenceQuery.data?.relevantSavedItem
                  ? presenceQuery.data.relevantSavedItem.content
                  : "Nothing urgent is waiting in saved items."
              }
            />
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-[16px]">
                  <SunMedium className="size-4.5 text-amber-600" />
                  Morning Planning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-5" onSubmit={handleSaveMorningPlan}>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="priority-1">Priority 1</Label>
                      <Input
                        id="priority-1"
                        value={morningPlan.priority1}
                        onChange={(event) => setMorningPlan((current) => ({ ...current, priority1: event.target.value }))}
                        placeholder="What truly matters first?"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority-2">Priority 2</Label>
                      <Input
                        id="priority-2"
                        value={morningPlan.priority2}
                        onChange={(event) => setMorningPlan((current) => ({ ...current, priority2: event.target.value }))}
                        placeholder="What comes second?"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority-3">Priority 3</Label>
                      <Input
                        id="priority-3"
                        value={morningPlan.priority3}
                        onChange={(event) => setMorningPlan((current) => ({ ...current, priority3: event.target.value }))}
                        placeholder="Optional third anchor"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
                    <div className="space-y-2">
                      <Label htmlFor="smallest-next-step">Smallest next step</Label>
                      <Textarea
                        id="smallest-next-step"
                        value={morningPlan.smallestNextStep}
                        onChange={(event) =>
                          setMorningPlan((current) => ({ ...current, smallestNextStep: event.target.value }))
                        }
                        placeholder="Make the next move concrete and small."
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deprioritized-today">What should be deprioritized today?</Label>
                      <Textarea
                        id="deprioritized-today"
                        value={morningPlan.deprioritizedToday}
                        onChange={(event) =>
                          setMorningPlan((current) => ({ ...current, deprioritizedToday: event.target.value }))
                        }
                        placeholder="What can safely stay lighter today?"
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <RatingField
                      id="morning-mood"
                      label="Current mood"
                      value={morningPlan.stateMood}
                      onChange={(value) => setMorningPlan((current) => ({ ...current, stateMood: value }))}
                    />
                    <RatingField
                      id="morning-energy"
                      label="Energy"
                      value={morningPlan.stateEnergy}
                      onChange={(value) => setMorningPlan((current) => ({ ...current, stateEnergy: value }))}
                    />
                    <RatingField
                      id="morning-stress"
                      label="Stress"
                      value={morningPlan.stateStress}
                      onChange={(value) => setMorningPlan((current) => ({ ...current, stateStress: value }))}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                    <span>
                      Morning planning writes into <code>daily_context</code> and marks today&apos;s morning routine as complete.
                    </span>
                    <Button type="submit" disabled={saveMorningPlanMutation.isPending}>
                      <Save className="mr-2 size-4" />
                      Save morning plan
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-[16px]">
                    <HeartPulse className="size-4.5 text-emerald-600" />
                    Midday Check-In
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleRecordMidday}>
                    <div className="space-y-2">
                      <Label htmlFor="midday-status">Completion status</Label>
                      <Select
                        value={middayForm.completionStatus}
                        onValueChange={(value) =>
                          setMiddayForm((current) => ({
                            ...current,
                            completionStatus: value as RoutineEventRecord["completionStatus"],
                          }))
                        }
                      >
                        <SelectTrigger id="midday-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="skipped">Skipped</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <RatingField
                        id="midday-mood"
                        label="Mood"
                        value={middayForm.mood}
                        onChange={(value) => setMiddayForm((current) => ({ ...current, mood: value }))}
                      />
                      <RatingField
                        id="midday-energy"
                        label="Energy"
                        value={middayForm.energy}
                        onChange={(value) => setMiddayForm((current) => ({ ...current, energy: value }))}
                      />
                      <RatingField
                        id="midday-stress"
                        label="Stress"
                        value={middayForm.stress}
                        onChange={(value) => setMiddayForm((current) => ({ ...current, stress: value }))}
                      />
                      <RatingField
                        id="midday-focus"
                        label="Focus"
                        value={middayForm.focus}
                        onChange={(value) => setMiddayForm((current) => ({ ...current, focus: value }))}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="midday-medication">Medication status</Label>
                        <Input
                          id="midday-medication"
                          value={middayForm.medicationStatus}
                          onChange={(event) =>
                            setMiddayForm((current) => ({ ...current, medicationStatus: event.target.value }))
                          }
                          placeholder="Taken, delayed, skipped..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="midday-water">Water glasses</Label>
                        <Input
                          id="midday-water"
                          type="number"
                          min={0}
                          max={20}
                          value={middayForm.waterGlasses}
                          onChange={(event) =>
                            setMiddayForm((current) => ({ ...current, waterGlasses: Number(event.target.value || 0) }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="midday-food">Food / nourishment</Label>
                      <Textarea
                        id="midday-food"
                        value={middayForm.foodText}
                        onChange={(event) => setMiddayForm((current) => ({ ...current, foodText: event.target.value }))}
                        placeholder="What actually happened around food?"
                        className="min-h-[84px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="midday-notes">Short notes</Label>
                      <Textarea
                        id="midday-notes"
                        value={middayForm.notes}
                        onChange={(event) => setMiddayForm((current) => ({ ...current, notes: event.target.value }))}
                        placeholder="What feels relevant right now?"
                        className="min-h-[84px]"
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={recordRoutineMutation.isPending}>
                      <Save className="mr-2 size-4" />
                      Record midday check-in
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-[16px]">
                    <Moon className="size-4.5 text-indigo-600" />
                    Evening Reflection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleRecordEvening}>
                    <div className="space-y-2">
                      <Label htmlFor="evening-status">Completion status</Label>
                      <Select
                        value={eveningForm.completionStatus}
                        onValueChange={(value) =>
                          setEveningForm((current) => ({
                            ...current,
                            completionStatus: value as RoutineEventRecord["completionStatus"],
                          }))
                        }
                      >
                        <SelectTrigger id="evening-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="skipped">Skipped</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <RatingField
                        id="evening-mood"
                        label="Mood"
                        value={eveningForm.mood}
                        onChange={(value) => setEveningForm((current) => ({ ...current, mood: value }))}
                      />
                      <RatingField
                        id="evening-energy"
                        label="Energy"
                        value={eveningForm.energy}
                        onChange={(value) => setEveningForm((current) => ({ ...current, energy: value }))}
                      />
                      <RatingField
                        id="evening-stress"
                        label="Stress"
                        value={eveningForm.stress}
                        onChange={(value) => setEveningForm((current) => ({ ...current, stress: value }))}
                      />
                      <RatingField
                        id="evening-focus"
                        label="Focus"
                        value={eveningForm.focus}
                        onChange={(value) => setEveningForm((current) => ({ ...current, focus: value }))}
                      />
                      <RatingField
                        id="evening-sleep"
                        label="Sleep quality"
                        value={eveningForm.sleepQuality}
                        onChange={(value) => setEveningForm((current) => ({ ...current, sleepQuality: value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="evening-reflection">Reflection / debrief</Label>
                      <Textarea
                        id="evening-reflection"
                        value={eveningForm.reflectionText}
                        onChange={(event) =>
                          setEveningForm((current) => ({ ...current, reflectionText: event.target.value }))
                        }
                        placeholder="What actually happened, what drained or helped, what matters tomorrow?"
                        className="min-h-[120px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="evening-notes">Notes</Label>
                      <Textarea
                        id="evening-notes"
                        value={eveningForm.notes}
                        onChange={(event) => setEveningForm((current) => ({ ...current, notes: event.target.value }))}
                        placeholder="Short observations, tensions, or friction."
                        className="min-h-[80px]"
                      />
                    </div>

                    <Separator />

                    <div className="rounded-2xl border border-border bg-muted/20 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <ArrowRight className="size-4" />
                        Optional carry-forward item
                      </div>
                      <div className="mt-3 grid gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="follow-up-content">Save this for tomorrow or later</Label>
                          <Textarea
                            id="follow-up-content"
                            value={eveningForm.followUpContent}
                            onChange={(event) =>
                              setEveningForm((current) => ({ ...current, followUpContent: event.target.value }))
                            }
                            placeholder="Capture the one thing that should survive the night."
                            className="min-h-[84px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="follow-up-date">Target date</Label>
                          <Input
                            id="follow-up-date"
                            type="date"
                            value={eveningForm.followUpTargetDate}
                            onChange={(event) =>
                              setEveningForm((current) => ({ ...current, followUpTargetDate: event.target.value }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={recordRoutineMutation.isPending || saveThoughtMutation.isPending}>
                      <Save className="mr-2 size-4" />
                      Save evening reflection
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-[16px]">
                  <FileText className="size-4.5 text-rose-600" />
                  Save Thought
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="grid gap-4 lg:grid-cols-[1fr_auto_auto]" onSubmit={handleSaveThought}>
                  <div className="space-y-2 lg:col-span-3">
                    <Label htmlFor="save-thought-content">Thought, reminder, or idea</Label>
                    <Textarea
                      id="save-thought-content"
                      value={thoughtForm.content}
                      onChange={(event) => setThoughtForm((current) => ({ ...current, content: event.target.value }))}
                      placeholder="Save this thought for tomorrow so it does not need to stay in your head."
                      className="min-h-[90px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="save-thought-type">Type</Label>
                    <Select
                      value={thoughtForm.itemType}
                      onValueChange={(value) =>
                        setThoughtForm((current) => ({ ...current, itemType: value as SavedItemRecord["itemType"] }))
                      }
                    >
                      <SelectTrigger id="save-thought-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SAVED_ITEM_TYPES.map((itemType) => (
                          <SelectItem key={itemType} value={itemType}>
                            {SAVED_ITEM_LABELS[itemType]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="save-thought-date">Target date</Label>
                    <Input
                      id="save-thought-date"
                      type="date"
                      value={thoughtForm.targetDate}
                      onChange={(event) => setThoughtForm((current) => ({ ...current, targetDate: event.target.value }))}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full" disabled={saveThoughtMutation.isPending}>
                      <PlusCircle className="mr-2 size-4" />
                      Save
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-[16px]">
                  <Sparkles className="size-4.5 text-orange-600" />
                  Profile Memory
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form className="space-y-4" onSubmit={handleAddProfileItem}>
                  <div className="space-y-2">
                    <Label htmlFor="profile-type">Category</Label>
                    <Select
                      value={profileForm.memoryType}
                      onValueChange={(value) =>
                        setProfileForm((current) => ({
                          ...current,
                          memoryType: value as ProfileMemoryItem["memoryType"],
                        }))
                      }
                    >
                      <SelectTrigger id="profile-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROFILE_MEMORY_TYPES.map((memoryType) => (
                          <SelectItem key={memoryType} value={memoryType}>
                            {PROFILE_TYPE_LABELS[memoryType]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile-label">Label</Label>
                    <Input
                      id="profile-label"
                      value={profileForm.label}
                      onChange={(event) => setProfileForm((current) => ({ ...current, label: event.target.value }))}
                      placeholder="Short name for the memory"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile-value">Value</Label>
                    <Textarea
                      id="profile-value"
                      value={profileForm.valueText}
                      onChange={(event) => setProfileForm((current) => ({ ...current, valueText: event.target.value }))}
                      placeholder="What should Antigone remember here?"
                      className="min-h-[96px]"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={upsertProfileMutation.isPending}>
                    <Save className="mr-2 size-4" />
                    Save profile memory
                  </Button>
                </form>

                <Separator />

                <div className="space-y-3">
                  {profileItems.length === 0 ? (
                    <EmptyBlock
                      title="No profile memory yet"
                      detail="Start by saving a preferred tone, medication basic, or a recurring reminder."
                    />
                  ) : (
                    profileItems.map((item) => (
                      <ProfileMemoryRow
                        key={item.id}
                        item={item}
                        onToggle={handleToggleProfileItem}
                        saving={upsertProfileMutation.isPending}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-[16px]">
                  <ListTodo className="size-4.5 text-sky-600" />
                  Carry-Forward Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeCarryForwardItems.length === 0 ? (
                  <EmptyBlock
                    title="Nothing currently carried forward"
                    detail="Evening reflections and Save Thought entries can create tomorrow-safe items here."
                  />
                ) : (
                  activeCarryForwardItems.map((item) => (
                    <SavedItemRow
                      key={item.id}
                      item={item}
                      onArchive={handleArchiveSavedItem}
                      archiving={archiveSavedItemMutation.isPending}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-[16px]">
                  <Target className="size-4.5 text-violet-600" />
                  Memory Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Today</div>
                  <div className="mt-3 grid gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Morning planning</div>
                      <div className="mt-1 font-medium text-foreground">
                        {presenceQuery.data?.morningPlanningCompleted ? "Completed" : "Not completed yet"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Next due routine</div>
                      <div className="mt-1 font-medium text-foreground">
                        {presenceQuery.data
                          ? `${presenceQuery.data.nextDueRoutine.label} · ${presenceQuery.data.nextDueRoutine.scheduledTimeLocal}`
                          : "Loading"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Active saved items</div>
                      <div className="mt-1 font-medium text-foreground">{savedItemsQuery.data?.length ?? 0}</div>
                    </div>
                  </div>
                </div>

                <Collapsible open={debugOpen} onOpenChange={setDebugOpen}>
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-2xl border border-border px-4 py-3 text-left">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <Database className="size-4" />
                      Memory Debug
                    </div>
                    <ChevronDown className={cn("size-4 transition-transform", debugOpen && "rotate-180")} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-3">
                    <div className="rounded-2xl border border-border bg-background/70 p-4 text-xs leading-6 text-muted-foreground">
                      <div><span className="font-medium text-foreground">DB path:</span> {historyQuery.data?.dbPath ?? "Loading..."}</div>
                      <div><span className="font-medium text-foreground">Profile rows:</span> {historyQuery.data?.counts.profileMemory ?? 0}</div>
                      <div><span className="font-medium text-foreground">Daily context rows:</span> {historyQuery.data?.counts.dailyContext ?? 0}</div>
                      <div><span className="font-medium text-foreground">Routine rows:</span> {historyQuery.data?.counts.routineEvents ?? 0}</div>
                      <div><span className="font-medium text-foreground">Saved items rows:</span> {historyQuery.data?.counts.savedItems ?? 0}</div>
                    </div>
                    <div className="rounded-2xl border border-border bg-background/70 p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Latest records</div>
                      <pre className="mt-3 overflow-x-auto text-[11px] leading-5 text-muted-foreground">
                        {JSON.stringify(
                          {
                            dailyContext: historyQuery.data?.recentDailyContext[0] ?? null,
                            routineEvent: historyQuery.data?.recentRoutineEvents[0] ?? null,
                            savedItem: historyQuery.data?.recentSavedItems[0] ?? null,
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-[16px]">
                <Brain className="size-4.5 text-slate-700" />
                Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {routineChartData.length === 0 ? (
                <EmptyBlock
                  title="Not enough routine history yet"
                  detail="As morning, midday, and evening events accumulate, Antigone will start showing a clear rhythm here."
                />
              ) : (
                <div className="rounded-2xl border border-border bg-background/70 p-4">
                  <div className="mb-3 text-sm font-medium text-foreground">Routine completion over recent days</div>
                  <ChartContainer
                    className="h-[230px] w-full"
                    config={{
                      completed: { label: "Completed", color: "#0f766e" },
                      skipped: { label: "Skipped", color: "#d97706" },
                    }}
                  >
                    <BarChart data={routineChartData}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="completed" fill="var(--color-completed)" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="skipped" fill="var(--color-skipped)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Clock3 className="size-4" />
                    Recent routine events
                  </div>
                  <div className="mt-3 space-y-3">
                    {recentRoutineEvents.length === 0 ? (
                      <EmptyBlock title="No routine events yet" detail="Use the midday and evening forms to start building continuity." />
                    ) : (
                      recentRoutineEvents.slice(0, 6).map((event) => (
                        <div key={event.id} className="rounded-xl border border-border px-3 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium text-foreground">{ROUTINE_LABELS[event.eventType]}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatShortDate(event.scheduledDate)} · {event.scheduledTimeLocal}
                              </div>
                            </div>
                            <Badge className={ROUTINE_BADGE_CLASSNAMES[event.completionStatus]}>
                              {COMPLETION_LABELS[event.completionStatus]}
                            </Badge>
                          </div>
                          {(event.notes || event.reflectionText) && (
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {event.reflectionText || event.notes}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Bot className="size-4" />
                    Daily context history
                  </div>
                  <div className="mt-3 space-y-3">
                    {recentDailyContext.length === 0 ? (
                      <EmptyBlock title="No daily context yet" detail="Morning Planning writes the anchors that will show up here." />
                    ) : (
                      recentDailyContext.map((entry) => (
                        <div key={entry.id} className="rounded-xl border border-border px-3 py-3">
                          <div className="text-sm font-medium text-foreground">{formatShortDate(entry.contextDate)}</div>
                          <div className="mt-2 text-sm leading-6 text-muted-foreground">
                            {[entry.priority1, entry.priority2, entry.priority3].filter(Boolean).join(" · ") || "No priorities recorded"}
                          </div>
                          {entry.smallestNextStep && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">Next step:</span> {entry.smallestNextStep}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-[16px]">
                <Target className="size-4.5 text-emerald-700" />
                Saved Items and Carry-Forward History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentSavedItems.length === 0 ? (
                <EmptyBlock
                  title="No saved items yet"
                  detail="Save Thought and evening follow-ups create the memory objects that keep Antigone from resetting to zero."
                />
              ) : (
                recentSavedItems.map((item) => (
                  <SavedItemRow
                    key={item.id}
                    item={item}
                    onArchive={handleArchiveSavedItem}
                    archiving={archiveSavedItemMutation.isPending}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}
