/*
 * AppLayout – Swiss Precision Design
 * Fixed sidebar + main content area
 * Clean, mathematical spacing, warm neutrals, indigo accent
 */

import { useApp } from "@/contexts/AppContext";
import { createDefaultSections, createProject, getProjectStats } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  ChevronDown,
  FileSpreadsheet,
  FolderKanban,
  Home,
  LayoutGrid,
  Lightbulb,
  List,
  Orbit,
  Plus,
  Settings,
  Target,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { state, dispatch } = useApp();
  const [location, setLocation] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const projectColors = useMemo(() => ["#4F46E5", "#0F766E", "#B45309", "#7C3AED", "#DC2626", "#2563EB"], []);

  const currentProject = state.projects.find((p) => p.id === state.currentProjectId);

  const handleCreateProject = () => {
    const trimmedTitle = projectTitle.trim();
    if (!trimmedTitle) {
      toast.error("Bitte gib zuerst einen Projektnamen ein.");
      return;
    }

    const nextColor = projectColors[state.projects.length % projectColors.length];
    const newProject = createProject(
      trimmedTitle,
      projectDescription.trim() || "Neues Projekt ohne Beschreibung.",
      nextColor
    );
    const defaultSections = createDefaultSections(newProject.id);

    dispatch({ type: "ADD_PROJECT", project: newProject, sections: defaultSections });
    dispatch({ type: "SET_CURRENT_PROJECT", projectId: newProject.id });
    setProjectTitle("");
    setProjectDescription("");
    setProjectDialogOpen(false);
    toast.success(`Projekt „${trimmedTitle}“ wurde angelegt.`);
    setLocation(`/project/${newProject.id}/overview`);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-sidebar transition-all duration-200 ease-out",
          sidebarCollapsed ? "w-[60px]" : "w-[260px]"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 px-4 border-b border-border">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            T
          </div>
          {!sidebarCollapsed && (
            <span className="font-semibold text-[15px] tracking-tight text-foreground">
              TaskFlow
            </span>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3">
            {/* Main Navigation */}
            <nav className="space-y-0.5">
              <SidebarLink
                href="/"
                icon={<Home size={18} />}
                label="Dashboard"
                active={location === "/"}
                collapsed={sidebarCollapsed}
              />
              <SidebarLink
                href="/import"
                icon={<FileSpreadsheet size={18} />}
                label="CSV Import"
                active={location === "/import"}
                collapsed={sidebarCollapsed}
              />
              <SidebarLink
                href="/ideas"
                icon={<Lightbulb size={18} />}
                label="Ideas"
                active={location === "/ideas"}
                collapsed={sidebarCollapsed}
              />
              <SidebarLink
                href="/universe"
                icon={<Orbit size={18} />}
                label="Universe"
                active={location === "/universe"}
                collapsed={sidebarCollapsed}
              />
            </nav>

            {!sidebarCollapsed && (
              <>
                <Separator className="my-3" />

                {/* Projects */}
                <div className="mb-2">
                  <div className="flex items-center justify-between px-2 mb-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Projekte
                    </span>
                    <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
                      <DialogTrigger asChild>
                        <button
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Neues Projekt anlegen"
                        >
                          <Plus size={14} />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[440px]">
                        <DialogHeader>
                          <DialogTitle>Neues Projekt anlegen</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="project-title">Projektname</Label>
                            <Input
                              id="project-title"
                              value={projectTitle}
                              onChange={(event) => setProjectTitle(event.target.value)}
                              placeholder="z. B. Antigone Pilot"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="project-description">Kurzbeschreibung</Label>
                            <Textarea
                              id="project-description"
                              value={projectDescription}
                              onChange={(event) => setProjectDescription(event.target.value)}
                              placeholder="Worum geht es in diesem Projekt?"
                              className="min-h-[110px]"
                            />
                          </div>
                          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
                            <span>Direkt nach dem Anlegen landest du in der Projektübersicht.</span>
                            <span className="font-mono">{state.projects.length + 1}. Projekt</span>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setProjectDialogOpen(false)}>
                              Abbrechen
                            </Button>
                            <Button onClick={handleCreateProject}>Projekt erstellen</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-0.5">
                    {state.projects.map((project) => {
                      const stats = getProjectStats(state, project.id);
                      const isActive = state.currentProjectId === project.id;
                      return (
                        <button
                          key={project.id}
                          onClick={() => {
                            dispatch({ type: "SET_CURRENT_PROJECT", projectId: project.id });
                            setLocation(`/project/${project.id}/board`);
                          }}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-left transition-colors text-sm",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                          )}
                        >
                          <div
                            className="h-5 w-5 shrink-0 rounded"
                            style={{ backgroundColor: project.color + "18", border: `1.5px solid ${project.color}40` }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="truncate font-medium text-[13px]">{project.title}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Progress value={stats.progress} className="h-1 flex-1" />
                              <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                                {stats.progress}%
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Project Views */}
                {currentProject && (
                  <>
                    <Separator className="my-3" />
                    <div className="mb-2">
                      <span className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Ansichten
                      </span>
                    </div>
                    <nav className="space-y-0.5">
                      <SidebarLink
                        href={`/project/${currentProject.id}/overview`}
                        icon={<Target size={18} />}
                        label="Übersicht"
                        active={location === `/project/${currentProject.id}/overview`}
                        collapsed={false}
                      />
                      <SidebarLink
                        href={`/project/${currentProject.id}/board`}
                        icon={<LayoutGrid size={18} />}
                        label="Board"
                        active={location === `/project/${currentProject.id}/board`}
                        collapsed={false}
                      />
                      <SidebarLink
                        href={`/project/${currentProject.id}/list`}
                        icon={<List size={18} />}
                        label="Liste"
                        active={location === `/project/${currentProject.id}/list`}
                        collapsed={false}
                      />
                    </nav>
                  </>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* User */}
        <div className="border-t border-border p-3">
          <div className={cn("flex items-center gap-2.5", sidebarCollapsed && "justify-center")}>
            <Avatar className="h-8 w-8">
              <AvatarFallback
                className="text-xs font-semibold"
                style={{ backgroundColor: state.users[0].color + "18", color: state.users[0].color }}
              >
                {state.users[0].initials}
              </AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate">{state.users[0].name}</div>
                <div className="text-[11px] text-muted-foreground truncate">{state.users[0].email}</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}

function SidebarLink({
  href,
  icon,
  label,
  active,
  collapsed,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 px-2 py-1.5 rounded-md transition-colors text-[13px]",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50",
        collapsed && "justify-center px-0"
      )}
    >
      <span className={cn("shrink-0", active ? "text-primary" : "text-muted-foreground")}>{icon}</span>
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}
