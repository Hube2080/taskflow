import { useMemo, useState } from "react";
import { Aperture, Boxes, Lightbulb, Orbit, Sparkles, Waypoints } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { getKnowledgeGraph } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

type UniverseMode = "map" | "clusters" | "future3d";

export default function UniverseView() {
  const { state, dispatch } = useApp();
  const [, setLocation] = useLocation();
  const graph = useMemo(() => getKnowledgeGraph(state), [state]);
  const [mode, setMode] = useState<UniverseMode>("map");

  const ideaNodes = graph.nodes.filter((node) => node.type === "idea");
  const projectNodes = graph.nodes.filter((node) => node.type === "project");
  const taskNodes = graph.nodes.filter((node) => node.type === "task");

  const clusters = useMemo(() => {
    return [
      {
        id: "ideas",
        label: "Ideenraum",
        description: "Rohideen, Integrationen, AI- und Workflow-Wünsche",
        nodes: ideaNodes,
      },
      {
        id: "projects",
        label: "Projektwelt",
        description: "Aktive oder geplante Projekte als stabile Planeten",
        nodes: projectNodes,
      },
      {
        id: "tasks",
        label: "Delivery-Layer",
        description: "Top-Level-Aufgaben, die bereits in operativer Arbeit gelandet sind",
        nodes: taskNodes,
      },
    ];
  }, [ideaNodes, projectNodes, taskNodes]);

  return (
    <ScrollArea className="h-full">
      <div className="max-w-[1260px] p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <Orbit size={13} />
              Universe
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">Vernetzte Ideenlandschaft</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Diese Ansicht zeigt dein System als verknüpftes Universum aus Ideen, Projekten und Tasks. Sie ist die
              visuelle Grundlage für spätere 3D-Netzwerke und KI-Assistenten-Dashboards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="gap-2 text-[13px]" onClick={() => setLocation("/ideas")}>
              <Lightbulb size={14} />
              Zu den Ideas
            </Button>
            <Button
              variant="outline"
              className="gap-2 text-[13px]"
              onClick={() => {
                dispatch({ type: "SET_CURRENT_PROJECT", projectId: state.currentProjectId });
                setLocation(`/project/${state.currentProjectId}/overview`);
              }}
            >
              <Aperture size={14} />
              Aktuelles Projekt
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <UniverseStat label="Nodes" value={graph.nodes.length} hint="Alle sichtbaren Objekte" />
          <UniverseStat label="Edges" value={graph.edges.length} hint="Aktuelle Beziehungen" />
          <UniverseStat label="Ideas" value={ideaNodes.length} hint="Produkt- und Use-Case-Ideen" />
          <UniverseStat label="Projects / Tasks" value={projectNodes.length + taskNodes.length} hint="Delivery-Layer" />
        </div>

        <Tabs value={mode} onValueChange={(value) => setMode(value as UniverseMode)} className="mt-6">
          <TabsList className="grid w-full grid-cols-3 md:w-[520px]">
            <TabsTrigger value="map" className="gap-1.5">
              <Waypoints size={14} />
              Netzwerk
            </TabsTrigger>
            <TabsTrigger value="clusters" className="gap-1.5">
              <Boxes size={14} />
              Cluster
            </TabsTrigger>
            <TabsTrigger value="future3d" className="gap-1.5">
              <Sparkles size={14} />
              3D bereit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-4">
            <Card className="overflow-hidden border border-border">
              <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.5fr)_340px]">
                <UniverseCanvas graph={graph} />
                <Card className="border border-border bg-card/70">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[15px] font-semibold">Graph-Legende</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0 text-sm text-muted-foreground">
                    <LegendItem color="#7C3AED" label="Ideen" />
                    <LegendItem color="#4F46E5" label="Projekte" />
                    <LegendItem color="#6366F1" label="Tasks / operativer Layer" />
                    <div className="rounded-xl border border-dashed border-border bg-background px-4 py-3 text-[12px] leading-6">
                      Linien zeigen aktuell Herkunft und Zuordnung. Die 3D-Version kann später dieselben Nodes und Edges
                      direkt verwenden.
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clusters" className="mt-4">
            <div className="grid gap-4 lg:grid-cols-3">
              {clusters.map((cluster) => (
                <Card key={cluster.id} className="border border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[16px] font-semibold">{cluster.label}</CardTitle>
                    <p className="text-sm leading-6 text-muted-foreground">{cluster.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {cluster.nodes.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
                        Noch keine Knoten in diesem Cluster.
                      </div>
                    ) : (
                      cluster.nodes.map((node) => (
                        <div
                          key={node.id}
                          className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2"
                        >
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: node.color }} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-foreground">{node.label}</div>
                            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{node.type}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="future3d" className="mt-4">
            <Card className="border border-border">
              <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.9fr)]">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    <Sparkles size={13} />
                    3D Roadmap
                  </div>
                  <h2 className="mt-3 text-xl font-semibold tracking-tight">Dein neuronales Universum ist vorbereitet.</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Die Daten liegen jetzt bereits als Graph vor. Für eine echte 3D-Ansicht brauchen wir im nächsten Schritt
                    nur noch einen Renderer, zum Beispiel auf Basis von `react-force-graph` oder `three.js`.
                  </p>
                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <RoadmapCard title="Graph Data" body="Knoten, Kanten, Typen und Farben sind da." ready />
                    <RoadmapCard title="Universe View" body="2D-Netzwerk und Cluster sind bereits sichtbar." ready />
                    <RoadmapCard title="3D Renderer" body="Als nächster Ausbau anschließbar, ohne Datenmodell-Umbau." />
                  </div>
                </div>

                <div className="rounded-3xl border border-border bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.22),rgba(255,255,255,0.96)_58%)] p-6">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Rendering Targets
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                    <p>2D Force Graph für erste Exploration</p>
                    <p>3D Sternenfeld für dein Ideen-Universum</p>
                    <p>Agenten- und Tool-Knoten für den KI-Assistenten</p>
                    <p>Filter nach Status, Kategorie, Cluster und Priorität</p>
                  </div>
                  <div className="mt-5 rounded-2xl border border-dashed border-border bg-background/90 px-4 py-4 text-[12px] leading-6 text-muted-foreground">
                    Diese Ansicht ist absichtlich kein Fake-3D. Sie schafft die echte Grundlage, damit wir als Nächstes
                    eine überzeugende, interaktive 3D-Version bauen können.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}

function UniverseCanvas({
  graph,
}: {
  graph: ReturnType<typeof getKnowledgeGraph>;
}) {
  const positions = useMemo(() => {
    return graph.nodes.map((node, index) => {
      const lane =
        node.type === "idea"
          ? 0
          : node.type === "project"
          ? 1
          : 2;
      const x = 110 + (index % 4) * 150 + (lane === 1 ? 30 : lane === 2 ? 60 : 0);
      const y = 90 + lane * 130 + Math.floor(index / 4) * 64;

      return { ...node, x, y };
    });
  }, [graph.nodes]);

  const positionById = new Map(positions.map((node) => [node.id, node]));

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-[radial-gradient(circle_at_top,rgba(224,231,255,0.7),rgba(250,250,248,0.95)_45%,rgba(250,250,248,1)_100%)] p-4">
      <svg viewBox="0 0 760 470" className="h-[470px] w-full">
        <defs>
          <linearGradient id="universe-line" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(99,102,241,0.45)" />
            <stop offset="100%" stopColor="rgba(15,118,110,0.24)" />
          </linearGradient>
        </defs>

        {graph.edges.map((edge) => {
          const source = positionById.get(edge.source);
          const target = positionById.get(edge.target);
          if (!source || !target) return null;

          const midX = (source.x + target.x) / 2;
          const midY = Math.min(source.y, target.y) - 24;

          return (
            <path
              key={edge.id}
              d={`M ${source.x} ${source.y} Q ${midX} ${midY} ${target.x} ${target.y}`}
              fill="none"
              stroke="url(#universe-line)"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.9"
            />
          );
        })}

        {positions.map((node) => (
          <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
            <circle r="26" fill={node.color} opacity="0.12" />
            <circle r="11" fill={node.color} />
            <text
              x="0"
              y="36"
              textAnchor="middle"
              className="fill-foreground text-[10px] font-medium"
              style={{ fontSize: "11px" }}
            >
              {truncate(node.label, 18)}
            </text>
          </g>
        ))}

        <UniverseLane label="Ideas" y={80} />
        <UniverseLane label="Projects" y={210} />
        <UniverseLane label="Tasks" y={340} />
      </svg>
    </div>
  );
}

function UniverseLane({ label, y }: { label: string; y: number }) {
  return (
    <g>
      <line x1="40" y1={y} x2="720" y2={y} stroke="rgba(120,113,108,0.15)" strokeDasharray="6 8" />
      <text x="42" y={y - 12} style={{ fontSize: "11px", letterSpacing: "0.2em" }} className="fill-muted-foreground">
        {label.toUpperCase()}
      </text>
    </g>
  );
}

function UniverseStat({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <Card className="border border-border">
      <CardContent className="p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
        <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
        <div className="mt-1 text-sm text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}

function RoadmapCard({ title, body, ready = false }: { title: string; body: string; ready?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-4",
        ready ? "border-emerald-200 bg-emerald-50/70" : "border-border bg-background"
      )}
    >
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={ready ? "border-emerald-200 text-emerald-700 bg-white" : ""}>
          {ready ? "Ready" : "Next"}
        </Badge>
        <span className="font-medium text-foreground">{title}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}
