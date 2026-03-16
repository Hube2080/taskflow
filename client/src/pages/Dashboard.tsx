/*
 * Dashboard – Swiss Precision Design
 * Overview of all projects, upcoming deadlines, recent activity
 * Warm off-white background, indigo accent, mathematical spacing
 */

import { useApp } from "@/contexts/AppContext";
import { getProjectStats, getTopLevelTasks, getProjectMilestones, getUserById, type Task } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Calendar,
  MessageSquare,
  FolderKanban,
  Target,
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { state, dispatch } = useApp();

  const allStats = state.projects.map((p) => ({
    project: p,
    stats: getProjectStats(state, p.id),
  }));

  const totalTasks = allStats.reduce((sum, s) => sum + s.stats.total, 0);
  const totalDone = allStats.reduce((sum, s) => sum + s.stats.done, 0);
  const totalInProgress = allStats.reduce((sum, s) => sum + s.stats.inProgress, 0);
  const totalOverdue = allStats.reduce((sum, s) => sum + s.stats.overdue, 0);

  // Upcoming deadlines (next 14 days)
  const now = new Date();
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const upcomingTasks = state.tasks
    .filter(
      (t) =>
        t.dueDate &&
        t.parentId === null &&
        t.status !== "done" &&
        new Date(t.dueDate) <= twoWeeks &&
        new Date(t.dueDate) >= new Date(now.toISOString().split("T")[0])
    )
    .sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1))
    .slice(0, 6);

  // Recent comments
  const recentComments = [...state.comments]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  // Upcoming milestones
  const upcomingMilestones = state.milestones
    .filter((m) => !m.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);

  return (
    <ScrollArea className="h-full">
      <div className="p-8 max-w-[1200px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Willkommen zurück, {state.users[0].name}. Hier ist dein Überblick.
            </p>
          </div>
          <div className="text-[12px] text-muted-foreground font-mono tabular-nums">
            {new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          className="grid grid-cols-4 gap-4 mt-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <StatCard
            label="Aufgaben gesamt"
            value={totalTasks}
            icon={<FolderKanban size={18} />}
            color="text-primary"
            bgColor="bg-primary/8"
          />
          <StatCard
            label="Erledigt"
            value={totalDone}
            icon={<CheckCircle2 size={18} />}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <StatCard
            label="In Arbeit"
            value={totalInProgress}
            icon={<TrendingUp size={18} />}
            color="text-amber-600"
            bgColor="bg-amber-50"
          />
          <StatCard
            label="Überfällig"
            value={totalOverdue}
            icon={<AlertTriangle size={18} />}
            color="text-red-600"
            bgColor="bg-red-50"
          />
        </motion.div>

        {/* Projects */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <h2 className="text-[15px] font-semibold text-foreground mb-3">Projekte</h2>
          <div className="grid grid-cols-2 gap-4">
            {allStats.map(({ project, stats }) => (
              <Link
                key={project.id}
                href={`/project/${project.id}/board`}
                onClick={() => dispatch({ type: "SET_CURRENT_PROJECT", projectId: project.id })}
              >
                <Card className="group hover:shadow-md transition-shadow duration-200 cursor-pointer border border-border">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: project.color }}
                        >
                          {project.title.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-[14px] group-hover:text-primary transition-colors">
                            {project.title}
                          </h3>
                          <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-1">
                            {project.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight
                        size={16}
                        className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                      />
                    </div>

                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex-1">
                        <Progress value={stats.progress} className="h-1.5" />
                      </div>
                      <span className="text-[12px] font-mono text-muted-foreground tabular-nums">
                        {stats.progress}%
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-[12px] text-muted-foreground">
                      <span>{stats.total} Aufgaben</span>
                      <span className="text-green-600">{stats.done} erledigt</span>
                      <span className="text-amber-600">{stats.inProgress} in Arbeit</span>
                      {stats.overdue > 0 && <span className="text-red-600">{stats.overdue} überfällig</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-5 gap-6 mt-8">
          {/* Upcoming Deadlines */}
          <motion.div
            className="col-span-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.15 }}
          >
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                  <Clock size={16} className="text-muted-foreground" />
                  Anstehende Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {upcomingTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">Keine anstehenden Deadlines.</p>
                ) : (
                  <div className="space-y-1">
                    {upcomingTasks.map((task) => {
                      const assignee = task.assigneeId ? getUserById(state, task.assigneeId) : null;
                      const project = state.projects.find((p) => p.id === task.projectId);
                      const daysLeft = Math.ceil(
                        (new Date(task.dueDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <Link
                          key={task.id}
                          href={`/project/${task.projectId}/board`}
                          onClick={() => {
                            dispatch({ type: "SET_CURRENT_PROJECT", projectId: task.projectId });
                            dispatch({ type: "SELECT_TASK", taskId: task.id });
                          }}
                        >
                          <div className="flex items-center gap-3 py-2.5 px-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer group">
                            <div
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: project?.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-medium truncate group-hover:text-primary transition-colors">
                                {task.title}
                              </div>
                              <div className="text-[11px] text-muted-foreground">{project?.title}</div>
                            </div>
                            {assignee && (
                              <Avatar className="h-6 w-6">
                                <AvatarFallback
                                  className="text-[9px] font-semibold"
                                  style={{
                                    backgroundColor: assignee.color + "18",
                                    color: assignee.color,
                                  }}
                                >
                                  {assignee.initials}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <span
                              className={`text-[11px] font-mono tabular-nums ${
                                daysLeft <= 2 ? "text-red-600" : daysLeft <= 5 ? "text-amber-600" : "text-muted-foreground"
                              }`}
                            >
                              {daysLeft === 0 ? "Heute" : daysLeft === 1 ? "Morgen" : `${daysLeft} Tage`}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Milestones */}
          <motion.div
            className="col-span-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.2 }}
          >
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                  <Target size={16} className="text-muted-foreground" />
                  Nächste Meilensteine
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {upcomingMilestones.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">Alle Meilensteine erreicht.</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingMilestones.map((m) => {
                      const project = state.projects.find((p) => p.id === m.projectId);
                      return (
                        <div key={m.id} className="flex items-start gap-3">
                          <div
                            className="mt-1 h-3 w-3 rounded-full border-2 shrink-0"
                            style={{ borderColor: project?.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-medium">{m.title}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {new Date(m.dueDate).toLocaleDateString("de-DE", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border border-border mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                  <MessageSquare size={16} className="text-muted-foreground" />
                  Letzte Kommentare
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {recentComments.map((comment) => {
                    const user = getUserById(state, comment.userId);
                    const task = state.tasks.find((t) => t.id === comment.taskId);
                    return (
                      <div key={comment.id} className="flex items-start gap-2.5">
                        <Avatar className="h-6 w-6 mt-0.5">
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
                          <div className="text-[12px]">
                            <span className="font-medium">{user?.name}</span>
                            <span className="text-muted-foreground"> zu </span>
                            <span className="font-medium">{task?.title}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </ScrollArea>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  bgColor,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="border border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold tracking-tight mt-1 font-mono tabular-nums">{value}</p>
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${bgColor} ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
