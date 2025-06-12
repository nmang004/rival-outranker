import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ResultsPage from "@/pages/ResultsPage";
import History from "@/pages/History";
import DeepContentAnalysisPage from "@/pages/DeepContentAnalysisPage";
import DeepContentResultsPage from "@/pages/DeepContentResultsPage";
import RivalAuditPage from "@/pages/RivalAuditPage";
import RivalAuditResultsPage from "@/pages/RivalAuditResultsPage";
import ProfilePage from "@/pages/ProfilePage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import AdminDashboard from "@/pages/AdminDashboard";
import DirectAdminDashboard from "@/pages/DirectAdminDashboard";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import SeoBuddy from "@/components/SeoBuddy";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/results" component={ResultsPage} />
            <Route path="/history" component={History} />
            <Route path="/deep-content" component={DeepContentAnalysisPage} />
            <Route path="/deep-content-results" component={DeepContentResultsPage} />
            <Route path="/rival-audit" component={RivalAuditPage} />
            <Route path="/rival-audit-results" component={RivalAuditResultsPage} />
            <Route path="/profile" component={ProfilePage} />
            <Route path="/profile/:tab" component={ProfilePage} />
            <Route path="/project/:id" component={ProjectDetailPage} />
            <Route path="/admin/dashboard" component={AdminDashboard} />
            <Route path="/direct-admin" component={DirectAdminDashboard} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
      <Footer />
      {/* SEO Buddy AI Assistant */}
      <SeoBuddy />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
