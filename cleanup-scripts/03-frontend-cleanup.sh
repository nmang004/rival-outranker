#!/bin/bash

# Frontend Cleanup Script: Remove Frontend Files for Bloated Features  
# This script removes all frontend pages, components, and assets for removed features

set -e  # Exit on any error

echo "🎨 Starting Frontend Cleanup..."
echo "⚠️  WARNING: This will permanently delete frontend files for removed features"
echo "📁 Working directory: $(pwd)"

# Verify we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "client" ]; then
    echo "❌ Error: Please run this script from the Rival-Outranker root directory"
    exit 1
fi

echo ""
echo "📄 PHASE 1: Remove Page Components"
echo "================================="

echo "🎯 Removing competitor analysis pages..."
rm -vf client/src/pages/CompetitorAnalysisPage.tsx
rm -vf client/src/pages/CompetitorResultsPage.tsx

echo "🔍 Removing keyword research pages..."
rm -vf client/src/pages/KeywordResearch.tsx
rm -vf client/src/pages/KeywordsPage.tsx
rm -vf client/src/pages/KeywordDetailsPage.tsx
rm -vf client/src/pages/KeywordSuggestionsPage.tsx
rm -vf client/src/pages/BasicRankTracker.tsx
rm -vf client/src/pages/RivalRankTrackerPage.tsx
rm -vf client/src/pages/RivalRankTrackerResults.tsx
rm -vf client/src/pages/RivalRankTrackerResultsPage.tsx
rm -vf client/src/pages/SimpleRivalRankTracker.tsx
rm -vf client/src/pages/SimpleRivalRankTrackerResults.tsx
rm -vf client/src/pages/ModernRankTracker.tsx

echo "🔗 Removing backlink pages..."
rm -vf client/src/pages/BacklinksPage.tsx

echo "🎓 Removing learning platform pages (preserving chatbot)..."
rm -vf client/src/pages/LearningPathsPage.tsx
rm -vf client/src/pages/ModuleDetailPage.tsx
rm -vf client/src/pages/AchievementDemoPage.tsx

echo "📄 Removing PDF analyzer pages..."
rm -vf client/src/pages/PdfAnalyzerPage.tsx
rm -vf client/src/pages/FixedPdfAnalyzerPage.tsx
rm -vf client/src/pages/PdfAnalyzerPage.tsx.bak

echo ""
echo "🧩 PHASE 2: Remove Component Directories"
echo "======================================="

echo "🔍 Removing keyword components..."
rm -rvf client/src/components/features/keywords/

echo "🔗 Removing backlink components..."
rm -rvf client/src/components/features/backlinks/

echo "🎓 Removing learning platform components..."
rm -rvf client/src/components/features/learning/

echo "🎯 Removing competitor analysis components..."
rm -vf client/src/components/features/analysis/CompetitorAnalysis.tsx
rm -vf client/src/components/features/analysis/FullCompetitorResults.tsx
rm -vf client/src/components/features/analysis/KeywordTab.tsx

echo "📄 Removing PDF-related components..."
rm -vf client/src/components/features/analysis/ExportPdfButton.tsx
rm -vf client/src/components/PdfViewer.tsx
rm -vf client/src/components/EnhancedChartAnalysis.tsx

echo "📊 Removing keyword chart components..."
rm -vf client/src/components/report/KeywordChart.tsx

echo ""
echo "⚙️ PHASE 3: Remove Services and Libraries"
echo "========================================"

echo "📄 Removing PDF analysis service..."
rm -vf client/src/services/pdfAnalysisService.ts

echo "📚 Removing export libraries..."
rm -vf client/src/lib/competitorPdfExport.ts
rm -vf client/src/lib/pdfExport.ts
rm -vf client/src/lib/deepContentPdfExport.ts

echo "🔧 Removing utilities..."
rm -vf client/src/utils/chartDetection.ts

echo ""
echo "🔌 PHASE 4: Remove API Hooks"
echo "============================"

echo "🔍 Removing keyword API hooks..."
rm -vf client/src/hooks/api/useKeywordApi.ts

echo "🎓 Removing learning API hooks..."
rm -vf client/src/hooks/api/useLearningApi.ts

echo ""
echo "📊 PHASE 5: Remove Data Files"
echo "============================="

echo "📚 Removing learning content data..."
rm -vf client/src/data/onPageSEOLessons.ts
rm -vf client/src/data/technicalSEOLessons.ts
rm -vf client/src/data/keywordResearchLessons.ts
rm -vf client/src/data/localBusinessSEOLessons.ts
rm -vf client/src/data/internationalSEOLessons.ts
rm -vf client/src/data/analyticsSEOLessons.ts

echo "📝 Removing type definitions..."
rm -vf client/src/types/learningTypes.ts
rm -vf client/src/types/rival-rank-tracker.d.ts

echo ""
echo "🎵 PHASE 6: Remove Static Assets"
echo "==============================="

echo "🔊 Removing gamification sounds..."
rm -rvf public/sounds/

echo "📄 Removing sample files..."
rm -vf client/public/samples/keyword-trend.png
rm -vf client/public/samples/seo-audit-sample.pdf 2>/dev/null || echo "📄 seo-audit-sample.pdf not found (ok)"

echo ""
echo "📁 PHASE 7: Remove Directories if Empty"
echo "======================================"

# Remove directories if they're empty
echo "🧹 Cleaning up empty directories..."

DIRS_TO_CHECK=(
    "client/src/components/features/keywords"
    "client/src/components/features/backlinks"  
    "client/src/components/features/learning"
    "client/src/components/rank-tracker"
    "client/src/components/learning"
    "public/sounds"
)

for dir in "${DIRS_TO_CHECK[@]}"; do
    if [ -d "$dir" ]; then
        if [ -z "$(ls -A "$dir")" ]; then
            rmdir "$dir"
            echo "🗑️  Removed empty directory: $dir"
        else
            echo "⚠️  Directory not empty: $dir"
        fi
    fi
done

echo ""
echo "🎯 PHASE 8: Manual File Updates Required"
echo "========================================"

echo "⚠️  The following files require manual updates:"
echo ""
echo "📝 client/src/App.tsx"
echo "   - Remove imports for deleted page components"
echo "   - Remove route definitions for removed features"
echo "   - Remove LearningCompanion component"
echo ""
echo "📝 client/src/components/NavBar.tsx"
echo "   - Remove navigation items for removed features"
echo ""
echo "📝 client/src/components/MobileNavMenu.tsx"
echo "   - Remove mobile navigation items"
echo ""
echo "📝 client/src/components/SimpleMobileNav.tsx"
echo "   - Remove simplified navigation items"
echo ""
echo "📝 client/src/components/features/analysis/index.ts"
echo "   - Remove exports for deleted components"
echo ""
echo "📝 client/src/hooks/api/index.ts"
echo "   - Remove exports for deleted API hooks"
echo ""

echo ""
echo "🔍 PHASE 9: Verification"
echo "======================="

# Check that SEO Buddy chatbot components are preserved
echo "✅ Verifying SEO Buddy chatbot is preserved..."

CHATBOT_FILES=(
    "client/src/components/SeoBuddy.tsx"
    "client/src/components/SeoBuddyChatbot.tsx"
    "client/src/components/SeoBuddyChatInterface.tsx"
    "client/src/data/seoKnowledgeBase.ts"
)

for file in "${CHATBOT_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file - preserved"
    else
        echo "❌ $file - MISSING (should be preserved!)"
    fi
done

echo ""
echo "✅ Verifying core analysis components are preserved..."

CORE_FILES=(
    "client/src/pages/Home.tsx"
    "client/src/pages/ResultsPage.tsx"
    "client/src/pages/RivalAuditPage.tsx"
    "client/src/pages/RivalAuditResultsPage.tsx"
    "client/src/components/features/analysis/OverallScore.tsx"
    "client/src/components/features/analysis/AssessmentTabs.tsx"
    "client/src/components/features/audit/RivalAuditDashboard.tsx"
)

for file in "${CORE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file - preserved"
    else
        echo "❌ $file - MISSING (should be preserved!)"
    fi
done

echo ""
echo "🔍 Checking removed files are gone..."

REMOVED_FILES=(
    "client/src/pages/KeywordResearch.tsx"
    "client/src/pages/BacklinksPage.tsx"
    "client/src/pages/LearningPathsPage.tsx"
    "client/src/pages/PdfAnalyzerPage.tsx"
    "client/src/components/features/keywords/"
    "client/src/components/features/backlinks/"
    "client/src/hooks/api/useKeywordApi.ts"
)

for file in "${REMOVED_FILES[@]}"; do
    if [ ! -e "$file" ]; then
        echo "✅ $file - removed"
    else
        echo "❌ $file - STILL EXISTS (should be removed!)"
    fi
done

echo ""
echo "📊 Frontend Cleanup Summary"
echo "=========================="
echo "✅ Competitor analysis pages & components: removed"
echo "✅ Keyword research pages & components: removed"
echo "✅ Backlink analysis pages & components: removed"
echo "✅ Learning platform pages & components: removed"
echo "✅ PDF/OCR pages & components: removed"
echo "✅ SEO Buddy chatbot: preserved"
echo "✅ Core analysis & audit components: preserved"
echo "✅ API hooks for removed features: removed"
echo "✅ Data files for removed features: removed"
echo "✅ Static assets for removed features: removed"

echo ""
echo "⏭️  NEXT STEPS:"
echo "1. 🛠️  Manually update client/src/App.tsx"
echo "2. 🛠️  Manually update navigation components"
echo "3. 🛠️  Manually update component index files"
echo "4. 🛠️  Run dependency cleanup: ./cleanup-scripts/04-dependency-cleanup.sh"
echo "5. 🧪 Test frontend builds: npm run build"

echo ""
echo "🎉 Frontend cleanup completed successfully!"