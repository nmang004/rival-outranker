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
import RivalRankTrackerResults from "@/pages/RivalRankTrackerResults";
import RivalRankTrackerResultsPage from "@/pages/RivalRankTrackerResultsPage";
// New simplified components for Rival Rank Tracker
import SimpleRivalRankTracker from "@/pages/SimpleRivalRankTracker";
import SimpleRivalRankTrackerResults from "@/pages/SimpleRivalRankTrackerResults";
import BasicRankTracker from "@/pages/BasicRankTracker";
// New consolidated rank tracker
import { ModernBasicRankTracker, ModernSimpleRankTracker, ModernAdvancedRankTracker } from "@/pages/ModernRankTracker";
import KeywordResearch from "@/pages/KeywordResearch";
import TestExportPage from "@/pages/TestExportPage";
import ProfilePage from "@/pages/ProfilePage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import PdfAnalyzerPage from "@/pages/FixedPdfAnalyzerPage";
import KeywordsPage from "@/pages/KeywordsPage";
import KeywordDetailsPage from "@/pages/KeywordDetailsPage";
import KeywordSuggestionsPage from "@/pages/KeywordSuggestionsPage";
import BacklinksPage from "@/pages/BacklinksPage";
import AdminDashboard from "@/pages/AdminDashboard";
import DirectAdminDashboard from "@/pages/DirectAdminDashboard";
// Learning Path Pages
import LearningPathsPage from "@/pages/LearningPathsPage";
import ModuleDetailPage from "@/pages/ModuleDetailPage";
import AchievementDemoPage from "@/pages/AchievementDemoPage";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import SeoBuddy from "@/components/SeoBuddy";
import LearningCompanion from "@/components/features/learning/LearningCompanion";

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
            <Route path="/competitor-analysis" component={CompetitorAnalysisPage} />
            <Route path="/competitor-results" component={CompetitorResultsPage} />
            <Route path="/rival-audit" component={RivalAuditPage} />
            <Route path="/rival-audit-results" component={RivalAuditResultsPage} />
            <Route path="/pdf-analyzer" component={PdfAnalyzerPage} />
            <Route path="/test-export" component={TestExportPage} />
            <Route path="/profile" component={ProfilePage} />
            <Route path="/profile/:tab" component={ProfilePage} />
            <Route path="/project/:id" component={ProjectDetailPage} />
            <Route path="/keywords" component={KeywordsPage} />
            <Route path="/keywords/:id" component={KeywordDetailsPage} />
            <Route path="/keyword-suggestions" component={KeywordSuggestionsPage} />
            {/* Original Rank Tracker Routes */}
            <Route path="/basic-rank-tracker" component={BasicRankTracker} />
            <Route path="/rival-rank-tracker" component={RivalRankTrackerPage} />
            <Route path="/rival-rank-tracker-results/:id" component={RivalRankTrackerResults} />
            <Route path="/rival-rank-tracker-results-page/:id" component={RivalRankTrackerResultsPage} />
            <Route path="/simple-rival-rank-tracker" component={SimpleRivalRankTracker} />
            <Route path="/simple-rival-rank-tracker-results/:id" component={SimpleRivalRankTrackerResults} />
            
            {/* New Consolidated Rank Tracker Routes */}
            <Route path="/modern-basic-rank-tracker" component={ModernBasicRankTracker} />
            <Route path="/modern-simple-rank-tracker" component={ModernSimpleRankTracker} />
            <Route path="/modern-advanced-rank-tracker" component={ModernAdvancedRankTracker} />
            
            <Route path="/keyword-research" component={KeywordResearch} />
            <Route path="/backlinks" component={BacklinksPage} />
            <Route path="/admin/dashboard" component={AdminDashboard} />
            <Route path="/direct-admin" component={DirectAdminDashboard} />
            {/* Learning Path Routes */}
            <Route path="/learning" component={LearningPathsPage} />
            <Route path="/modules/:slug" component={ModuleDetailPage} />
            <Route path="/achievement-demo" component={AchievementDemoPage} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
      <Footer />
      {/* Conditionally show SEO Buddy or Learning Companion */}
      <LearningCompanion />
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
