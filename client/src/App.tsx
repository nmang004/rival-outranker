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
import ProfilePage from "@/pages/ProfilePage";
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
            {/* Redirecting all deep-content-results to main results page */}
            <Route path="/deep-content-results">
              {(params) => {
                const url = new URLSearchParams(window.location.search).get('url');
                if (url) {
                  window.location.href = `/results?url=${encodeURIComponent(url)}`;
                  return <div>Redirecting...</div>;
                }
                return <ResultsPage />;
              }}
            </Route>
            <Route path="/competitor-analysis" component={CompetitorAnalysisPage} />
            <Route path="/competitor-results" component={CompetitorResultsPage} />
            <Route path="/profile" component={ProfilePage} />
            <Route path="/profile/:tab" component={ProfilePage} />
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
