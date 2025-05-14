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
import CompetitorAnalysisPage from "@/pages/CompetitorAnalysisPage";
import CompetitorResultsPage from "@/pages/CompetitorResultsPage";
import RivalAuditPage from "@/pages/RivalAuditPage";
import RivalAuditResultsPage from "@/pages/RivalAuditResultsPage";
import RivalRankTrackerPage from "@/pages/RivalRankTrackerPage";
import RivalRankTrackerResultsPage from "@/pages/RivalRankTrackerResultsPage";
import TestExportPage from "@/pages/TestExportPage";
import ProfilePage from "@/pages/ProfilePage";
import KeywordsPage from "@/pages/KeywordsPage";
import KeywordDetailsPage from "@/pages/KeywordDetailsPage";
import KeywordSuggestionsPage from "@/pages/KeywordSuggestionsPage";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/results" component={ResultsPage} />
            <Route path="/history" component={History} />
            <Route path="/deep-content" component={DeepContentAnalysisPage} />
            {/* Route for deep content analysis results */}
            <Route path="/deep-content-results" component={DeepContentResultsPage} />
            <Route path="/competitor-analysis" component={CompetitorAnalysisPage} />
            <Route path="/competitor-results" component={CompetitorResultsPage} />
            <Route path="/rival-audit" component={RivalAuditPage} />
            <Route path="/rival-audit-results" component={RivalAuditResultsPage} />
            <Route path="/test-export" component={TestExportPage} />
            <Route path="/profile" component={ProfilePage} />
            <Route path="/profile/:tab" component={ProfilePage} />
            <Route path="/keywords" component={KeywordsPage} />
            <Route path="/keywords/:id" component={KeywordDetailsPage} />
            <Route path="/keyword-suggestions" component={KeywordSuggestionsPage} />
            <Route path="/rival-rank-tracker" component={RivalRankTrackerPage} />
            <Route path="/rival-rank-tracker-results/:id" component={RivalRankTrackerResultsPage} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
      <Footer />
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
