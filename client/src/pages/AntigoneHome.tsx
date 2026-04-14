import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Cpu, ExternalLink, HomeIcon, Server, TriangleAlert } from "lucide-react";

const architectureCards = [
  {
    title: "Ollama",
    description: "Lokale Modelllaufzeit fuer Antigone. Verifiziert mit qwen2.5:3b.",
    href: "http://localhost:11434",
    status: "Working",
    icon: Cpu,
  },
  {
    title: "Open WebUI",
    description: "Aktuelle Hauptoberflaeche fuer Chat. Laeuft lokal ueber Docker auf Port 3000.",
    href: "http://localhost:3000",
    status: "Working",
    icon: Bot,
  },
  {
    title: "Home Assistant",
    description: "Ziel fuer Sprach- und Geraete-Orchestrierung in der UTM-VM. Noch manuell weiterzufuehren.",
    href: "#manual",
    status: "Partial",
    icon: HomeIcon,
  },
];

const futureItems = [
  "Home Assistant mit Whisper und Piper validiert anbinden",
  "Sprachfluss ueber Home Assistant statt Custom-Monolith aufbauen",
  "Leichtes Antigone-Frontend fuer Status, Links und Runbook-Aufrufe erweitern",
];

export default function AntigoneHome() {
  return (
    <ScrollArea className="h-full">
      <div className="max-w-[1100px] p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Antigone Transition
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">Antigone Control Surface</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Minimaler Platzhalter fuer die neue Antigone-Architektur. Diese Seite dokumentiert den
              lokalen Ziel-Stack, ohne den bestehenden Legacy-Sprachpfad weiter auszubauen.
            </p>
          </div>
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
            Placeholder UI
          </Badge>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {architectureCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className="border border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <Icon size={18} />
                      </div>
                      <CardTitle className="text-[15px]">{card.title}</CardTitle>
                    </div>
                    <Badge variant={card.status === "Working" ? "default" : "secondary"}>{card.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>{card.description}</p>
                  <a
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    href={card.href}
                    target={card.href.startsWith("http") ? "_blank" : undefined}
                    rel={card.href.startsWith("http") ? "noreferrer" : undefined}
                  >
                    {card.href.startsWith("http") ? "Open local endpoint" : "See manual next steps"}
                    <ExternalLink size={14} />
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[15px]">
                <TriangleAlert size={16} className="text-amber-700" />
                Legacy path kept in place
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-amber-950">
              <p>
                The current custom voice-memo flow remains available for reference and continuity, but it is
                no longer the target Antigone architecture.
              </p>
              <p>
                Sensitive defaults like personal cloud-storage paths and OpenAI-backed memo processing are
                intentionally left untouched in this transition pass.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border" id="manual">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[15px]">
                <Server size={16} />
                Not yet implemented
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {futureItems.map((item) => (
                <div key={item} className="rounded-md border border-dashed border-border px-3 py-2">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}
