#!/bin/bash

# Backend Cleanup Script: Remove Backend Files for Bloated Features
# This script removes all backend services, routes, and repositories for removed features

set -e  # Exit on any error

echo "🔥 Starting Backend Cleanup..."
echo "⚠️  WARNING: This will permanently delete backend files for removed features"
echo "📁 Working directory: $(pwd)"

# Verify we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "server" ]; then
    echo "❌ Error: Please run this script from the Rival-Outranker root directory"
    exit 1
fi

echo ""
echo "🗂️  PHASE 1: Remove Service Files"
echo "================================="

# Remove competitor analysis services
echo "🎯 Removing competitor analysis services..."
rm -vf server/services/analysis/competitor-analyzer.service.ts

# Remove keyword services
echo "🔍 Removing keyword services..."
rm -rvf server/services/keywords/
rm -vf server/services/interfaces/keyword.service.interface.ts

# Remove backlink services  
echo "🔗 Removing backlink services..."
rm -rvf server/services/backlinks/

# Remove learning services (preserve chatbot)
echo "🎓 Removing learning platform services..."
rm -vf server/services/common/learning-path.service.ts

# Remove PDF services
echo "📄 Removing PDF/OCR services..."
rm -rvf server/services/pdf/

echo ""
echo "📚 PHASE 2: Remove Repository Files"
echo "================================="

# Remove repositories for removed features
echo "🗄️  Removing repositories..."
rm -vf server/repositories/keyword.repository.ts
rm -vf server/repositories/backlink.repository.ts  
rm -vf server/repositories/learning.repository.ts

echo ""
echo "🛣️  PHASE 3: Remove Route Files"
echo "==============================="

# Remove API routes
echo "🔌 Removing API routes..."
rm -vf server/routes/competitor.routes.ts
rm -vf server/routes/keywords.ts
rm -vf server/routes/keyword-research.routes.ts
rm -vf server/routes/rank-tracker.routes.ts
rm -vf server/routes/backlinks.ts
rm -vf server/routes/learningPath.ts
rm -vf server/routes/learningPathRouter.ts
rm -vf server/routes/pdfAnalyzerRoutes.ts
rm -vf server/routes/pdf.routes.ts

echo ""
echo "📊 PHASE 4: Remove Data Files"
echo "============================="

# Remove mock data files
echo "🗃️  Removing mock data files..."
rm -vf server/data/mockLearningData.ts

echo ""
echo "🎯 PHASE 5: Manual File Updates Required"
echo "========================================"

echo "⚠️  The following files require manual updates:"
echo ""
echo "📝 server/routes/index.ts"
echo "   - Remove imports for deleted route files"
echo "   - Remove route registrations for removed features"
echo ""
echo "📝 server/repositories/index.ts"  
echo "   - Remove exports for deleted repository files"
echo "   - Remove repository registry entries"
echo ""
echo "📝 server/services/analysis/index.ts"
echo "   - Remove exports for competitor-analyzer.service.ts"
echo ""
echo "📝 server/services/external/index.ts"
echo "   - Remove DataForSEO exports if only used for keywords"
echo ""

echo ""
echo "🔍 PHASE 6: Verification"
echo "======================="

# Check that core files are preserved
echo "✅ Verifying core backend files are preserved..."

CORE_FILES=(
    "server/services/analysis/analyzer.service.ts"
    "server/services/audit/rival-audit-crawler.service.ts"
    "server/services/external/openai.service.ts"
    "server/routes/analysis.routes.ts"
    "server/routes/audit.routes.ts"
    "server/routes/auth.ts"
    "server/controllers/analysis.controller.ts"
    "server/repositories/analysis.repository.ts"
    "server/repositories/rival-audit.repository.ts"
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
    "server/services/analysis/competitor-analyzer.service.ts"
    "server/services/keywords/"
    "server/services/backlinks/"
    "server/routes/competitor.routes.ts"
    "server/routes/keywords.ts"
    "server/repositories/keyword.repository.ts"
    "server/repositories/backlink.repository.ts"
)

for file in "${REMOVED_FILES[@]}"; do
    if [ ! -e "$file" ]; then
        echo "✅ $file - removed"
    else
        echo "❌ $file - STILL EXISTS (should be removed!)"
    fi
done

echo ""
echo "📊 Backend Cleanup Summary"
echo "========================="
echo "✅ Competitor analysis services: removed"
echo "✅ Keyword research services: removed"  
echo "✅ Backlink analysis services: removed"
echo "✅ Learning platform services: removed (chatbot preserved)"
echo "✅ PDF/OCR services: removed"
echo "✅ Related repositories: removed"
echo "✅ API routes: removed"
echo "✅ Mock data files: removed"

echo ""
echo "⏭️  NEXT STEPS:"
echo "1. 🛠️  Manually update server/routes/index.ts"
echo "2. 🛠️  Manually update server/repositories/index.ts"  
echo "3. 🛠️  Run frontend cleanup: ./cleanup-scripts/03-frontend-cleanup.sh"
echo "4. 🧪 Test backend builds: npm run check"

echo ""
echo "🎉 Backend cleanup completed successfully!"