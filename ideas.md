# TaskFlow – Design Brainstorming

## Ziel
Eine Premium Projekt- und Aufgabenverwaltungs-App, die sich auf Apple-Geräten besonders gut anfühlt. Inspiriert von Asana, Monday und Linear – aber kein Klon. Ruhig, elegant, vertrauenswürdig.

---

<response>

## Idee 1: "Swiss Precision"

<text>

**Design Movement:** Schweizer Typografie / International Typographic Style, kombiniert mit modernem Apple HIG

**Core Principles:**
1. Mathematische Präzision in Layout und Spacing – ein striktes 8px-Grid
2. Typografie als primäres Gestaltungselement – Kontrast durch Gewicht, nicht durch Farbe
3. Reduktion auf das Wesentliche – jedes Element hat eine klare Funktion
4. Vertrauen durch Konsistenz – gleiche Patterns überall

**Color Philosophy:** 
- Hintergrund: Warmes Off-White (#FAFAF8) statt kaltem Weiß – weniger steril, mehr einladend
- Akzentfarbe: Tiefes Indigo (#4F46E5) – professionell, ruhig, nicht aggressiv
- Sekundär: Warmes Grau (#78716C) für Metadaten
- Erfolg/Warnung/Fehler: Gedämpfte, natürliche Töne statt schreiender Farben
- Oberflächen: Leicht getönte Karten (#FFFFFF) auf warmem Hintergrund

**Layout Paradigm:** 
- Feste Sidebar links (240px) mit klarer Hierarchie
- Content-Bereich mit maximal 3 Ebenen Tiefe
- Panels gleiten von rechts ein (Task-Detail)
- Kein zentriertes Layout – alles linksbündig, lesefreundlich

**Signature Elements:**
1. Subtile horizontale Linien als Strukturgeber (wie in Schweizer Plakaten)
2. Monospace-Zahlen für Daten und Metriken – technische Präzision
3. Großzügige Leerräume als bewusstes Gestaltungsmittel

**Interaction Philosophy:** Direkte Manipulation – Klick zum Bearbeiten, Inline-Editing, keine unnötigen Modals. Jede Aktion fühlt sich sofort an.

**Animation:** Schnelle, präzise Übergänge (150-200ms). Ease-out für Einblendungen. Keine Bounce-Effekte. Sidebar-Collapse smooth. Karten-Hover mit subtiler Elevation.

**Typography System:**
- Display: SF Pro Display / Inter (700) für Überschriften
- Body: SF Pro Text / Inter (400, 500) für Fließtext
- Mono: JetBrains Mono für Zahlen, Codes, IDs
- Strikte Hierarchie: 32/24/18/15/13px

</text>
<probability>0.08</probability>

</response>

---

<response>

## Idee 2: "Warm Craft"

<text>

**Design Movement:** Scandinavian Design meets Digital Craft – inspiriert von Notion, Things 3, und Bear App

**Core Principles:**
1. Wärme und Menschlichkeit – die App fühlt sich wie ein gut gemachtes Werkzeug an
2. Layered Surfaces – Tiefe durch subtile Schatten und Glasmorphismus
3. Organische Rundungen – weiche Ecken, aber nicht kindlich
4. Fokus auf Content – UI verschwindet, wenn man arbeitet

**Color Philosophy:**
- Basis: Cremiges Warm-White (#FAF9F7) mit sanftem Beige-Unterton
- Akzent: Warmes Terracotta-Orange (#E07A5F) – einladend, energetisch aber nicht aggressiv
- Sidebar: Leicht getöntes Beige (#F5F3EF) 
- Text: Tiefes Braun-Schwarz (#2D2A26) statt reinem Schwarz
- Karten: Reines Weiß mit warmem Schatten (0 2px 8px rgba(45,42,38,0.06))

**Layout Paradigm:**
- Collapsible Sidebar mit Icon-only-Modus
- Asymmetrisches 2-Panel-Layout: Hauptbereich + kontextuelles Seitenpanel
- Floating Action Buttons für schnelle Aktionen
- Board-View nutzt volle Breite, List-View hat zentrierte max-width

**Signature Elements:**
1. Handschrift-artige Akzente für leere Zustände (illustrierte Empty States)
2. Subtile Grain-Textur auf Hintergrundflächen
3. Abgerundete Badges mit sanften Pastellfarben für Prioritäten

**Interaction Philosophy:** Sanft und einladend – Hover-States mit warmem Glow, Drag-and-Drop mit physikalischem Feedback, Übergänge die sich natürlich anfühlen.

**Animation:** Spring-basierte Animationen (Framer Motion). Karten heben sich beim Hover leicht an. Seitenwechsel mit Fade + leichtem Slide. Skeleton-Loading mit warmem Shimmer.

**Typography System:**
- Display: Instrument Serif für große Überschriften – elegant, warm
- Body: Inter (400, 500, 600) für alles andere
- Kontrast zwischen Serif-Headlines und Sans-Body schafft visuelle Spannung
- Hierarchie: 36/28/20/16/14/12px

</text>
<probability>0.06</probability>

</response>

---

<response>

## Idee 3: "Linear Noir"

<text>

**Design Movement:** Neo-Brutalism meets Linear App Aesthetic – technisch, präzise, developer-friendly

**Core Principles:**
1. Kontrast und Klarheit – scharfe Kanten, klare Grenzen
2. Informationsdichte ohne Chaos – kompakte aber lesbare Layouts
3. Keyboard-first Design – alles per Tastatur erreichbar
4. Monochrom mit einem einzigen Akzent

**Color Philosophy:**
- Hintergrund: Sehr helles Grau (#F8F9FA) fast weiß
- Oberflächen: Reines Weiß (#FFFFFF) mit 1px Borders
- Akzent: Elektrisches Violett (#7C3AED) – modern, tech-forward
- Text: Reines Schwarz (#09090B) für maximalen Kontrast
- Borders: Sichtbar aber nicht dominant (#E5E7EB)

**Layout Paradigm:**
- Schmale Sidebar (56px icons + 200px expanded)
- Command Palette (⌘K) als zentrales Navigationselement
- Split-View: Liste links, Detail rechts
- Tabellen-first statt Karten-first

**Signature Elements:**
1. Command Palette mit Fuzzy-Search
2. Keyboard Shortcuts überall sichtbar
3. Monospace-Font für Task-IDs und technische Daten

**Interaction Philosophy:** Schnell und effizient. Keyboard-Shortcuts für alles. Hover zeigt Aktionen. Rechtsklick-Kontextmenüs. Minimale Klicks zum Ziel.

**Animation:** Ultra-schnell (100-150ms). Keine überflüssigen Animationen. Fade-in für neue Elemente. Smooth Scroll. Keine Bounce oder Spring.

**Typography System:**
- Alles: Inter (400, 500, 600, 700)
- Mono: Fira Code für IDs, Daten, Code
- Kompakte Hierarchie: 28/22/16/14/13/11px
- Enge Line-Heights für Informationsdichte

</text>
<probability>0.07</probability>

</response>

---

## Entscheidung

**Gewählt: Idee 1 – "Swiss Precision"**

Diese Richtung passt am besten zum Briefing: premium, ruhig, Apple-freundlich, vertrauenswürdig. Die Kombination aus mathematischer Präzision, warmen Neutraltönen und tiefem Indigo als Akzent schafft eine Oberfläche, die sich professionell und durchdacht anfühlt – ohne generisch zu wirken.

Die Schweizer Typografie-Tradition bietet eine starke Grundlage für die Informationshierarchie, die bei einer Projektmanagement-App entscheidend ist. Die warmen Off-White-Töne verhindern die sterile SaaS-Ästhetik, während das strikte Grid-System für visuelle Ruhe sorgt.
