import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppProvider } from "./contexts/AppContext";
import AppLayout from "./components/AppLayout";
import TaskDetailPanel from "./components/TaskDetailPanel";
import Dashboard from "./pages/Dashboard";
import ProjectOverview from "./pages/ProjectOverview";
import BoardView from "./pages/BoardView";
import ListView from "./pages/ListView";
import CsvImport from "./pages/CsvImport";
import IdeasView from "./pages/IdeasView";
import UniverseView from "./pages/UniverseView";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/project/:projectId/overview" component={ProjectOverview} />
        <Route path="/project/:projectId/board" component={BoardView} />
        <Route path="/project/:projectId/list" component={ListView} />
        <Route path="/import" component={CsvImport} />
        <Route path="/ideas" component={IdeasView} />
        <Route path="/universe" component={UniverseView} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
      <TaskDetailPanel />
    </AppLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
