/*
 * ProjectOverview – Swiss Precision Design
 * Project summary with stats, milestones, team, recent activity
 */

import { useApp } from "@/contexts/AppContext";
import {
  getProjectStats,
  getProjectSections,
  getProjectMilestones,
  getTopLevelTasks,
  getUserById,
  STATUS_CONFIG,
  type TaskStatus,
} from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Target,
  Users,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";

export default function ProjectOverview() {
  const { state, dispatch } = useApp();
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId || state.currentProjectId || "p1";
  const project = state.projects.find((p) => p.id === projectId);

  if (!project) return <div className="p-8 text-muted-foreground">Projekt nicht gefunden.</div>;

  const stats = getProjectStats(state, projectId);
  const sections = getProjectSections(state, projectId);
  const milestones = getProjectMilestones(state, projectId);
  const tasks = getTopLevelTasks(state, projectId);

  // Status distribution
  const statusCounts: Record<TaskStatus, number> = {
    backlog: 0,
    todo: 0,
    in_progress: 0,
    review: 0,
    done: 0,
  };
  tasks.forEach((t) => {
    statusCounts[t.status]++;
  });

  // Team members involved
  const teamIds = new Set(tasks.map((t) => t.assigneeId).filter(Boolean));
  const team = Array.from(teamIds).map((id) => getUserById(state, id!)).filter(Boolean);

  return (
    <ScrollArea className="h-full">
      <div className="p-8 max-w-[1100px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                style={{ backgroundColor: project.color }}
              >
                {project.title.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{project.title}</h1>
                <p className="text-sm text-muted-foreground mt-0.5 max-w-xl">{project.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/project/${projectId}/board`}>
                <Button variant="outline" size="sm" className="gap-1.5 text-[13px]">
                  <LayoutGrid size={14} /> Board
                </Button>
              </Link>
              <Link href={`/project/${projectId}/list`}>
                <Button variant="outline" size="sm" className="gap-1.5 text-[13px]">
                  <List size={14} /> Liste
                </Button>
              </Link>
              <Link href="/import">
                <Button variant="outline" size="sm" className="gap-1.5 text-[13px]">
                  <FileSpreadsheet size={14} /> Import
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <Card className="border border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-medium">Projektfortschritt</span>
                <span className="text-[13px] font-mono font-semibold tabular-nums text-primary">
                  {stats.progress}%
                </span>
              </div>
              <Progress value={stats.progress} className="h-2" />
              <div className="flex items-center gap-6 mt-3 text-[12px] text-muted-foreground">
                <span>{stats.total} Aufgaben</span>
                <span className="text-green-600">{stats.done} erledigt</span>
                <span className="text-amber-600">{stats.inProgress} in Arbeit</span>
                {stats.overdue > 0 && <span className="text-red-600">{stats.overdue} überfällig</span>}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {tasks.length === 0 && sections.length === 0 && milestones.length === 0 ? (
          <motion.div
            className="mt-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <Card className="border border-dashed border-border bg-card/80">
              <CardContent className="p-8">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Neues Projekt
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight">Dieses Projekt ist angelegt und bereit für den ersten Inhalt.</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Du kannst jetzt direkt Aufgaben per CSV importieren oder anschließend im Board die ersten Spalten und Aufgaben anlegen.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href="/import">
                      <Button className="gap-2 text-[13px]">
                        <FileSpreadsheet size={14} /> CSV importieren
                      </Button>
                    </Link>
                    <Link href={`/project/${projectId}/board`}>
                      <Button variant="outline" className="gap-2 text-[13px]">
                        <LayoutGrid size={14} /> Zum Board
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
        <>
        {/* Status Distribution + Team */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <motion.div
            className="col-span-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <Card className="border border-border h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
                  <BarChart3 size={15} className="text-muted-foreground" />
                  Status-Verteilung
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2.5">
                  {(Object.keys(statusCounts) as TaskStatus[]).map((status) => {
                    const config = STATUS_CONFIG[status];
                    const count = statusCounts[status];
                    const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <span className="text-[12px] w-20 text-muted-foreground">{config.label}</span>
                        <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
                          <div
                            className="h-full rounded-sm transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor:
                                status === "done"
                                  ? "#059669"
                                  : status === "in_progress"
                                  ? "#D97706"
                                  : status === "review"
                                  ? "#7C3AED"
                                  : status === "todo"
                                  ? "#3B82F6"
                                  : "#9CA3AF",
                            }}
                          />
                        </div>
                        <span className="text-[12px] font-mono tabular-nums text-muted-foreground w-12 text-right">
                          {count} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.15 }}
          >
            <Card className="border border-border h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
                  <Users size={15} className="text-muted-foreground" />
                  Team
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2.5">
                  {team.map((user) => {
                    if (!user) return null;
                    const userTasks = tasks.filter((t) => t.assigneeId === user.id);
                    const userDone = userTasks.filter((t) => t.status === "done").length;
                    return (
                      <div key={user.id} className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback
                            className="text-[10px] font-semibold"
                            style={{ backgroundColor: user.color + "18", color: user.color }}
                          >
                            {user.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-medium truncate">{user.name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {userDone}/{userTasks.length} erledigt
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Milestones + Sections */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.2 }}
          >
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
                  <Target size={15} className="text-muted-foreground" />
                  Meilensteine
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {milestones.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 py-1.5"
                    >
                      <Checkbox
                        checked={m.completed}
                        onCheckedChange={() => dispatch({ type: "TOGGLE_MILESTONE", milestoneId: m.id })}
                        className="h-4 w-4"
                      />
                      <div className="flex-1 min-w-0">
                        <span
                          className={`text-[13px] ${m.completed ? "line-through text-muted-foreground" : "font-medium"}`}
                        >
                          {m.title}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                        {new Date(m.dueDate).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.25 }}
          >
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
                  <Calendar size={15} className="text-muted-foreground" />
                  Phasen
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {sections.map((section) => {
                    const sectionTasks = tasks.filter((t) => t.sectionId === section.id);
                    const sectionDone = sectionTasks.filter((t) => t.status === "done").length;
                    const pct = sectionTasks.length > 0 ? Math.round((sectionDone / sectionTasks.length) * 100) : 0;
                    return (
                      <div key={section.id} className="flex items-center gap-3 py-1.5">
                        <div
                          className="h-3 w-3 rounded-sm shrink-0"
                          style={{ backgroundColor: section.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium">{section.title}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-1 w-16" />
                          <span className="text-[11px] font-mono text-muted-foreground tabular-nums w-8 text-right">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        </>
        )}
      </div>
    </ScrollArea>
  );
}
