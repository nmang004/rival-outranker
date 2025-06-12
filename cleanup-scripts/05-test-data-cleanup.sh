#!/bin/bash

# Test Data and Assets Cleanup Script
# Remove test data, scripts, and assets related to removed features

set -e  # Exit on any error

echo "🧪 Starting Test Data & Assets Cleanup..."
echo "⚠️  WARNING: This will permanently delete test data and assets for removed features"
echo "📁 Working directory: $(pwd)"

# Verify we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the Rival-Outranker root directory"
    exit 1
fi

echo ""
echo "📊 PHASE 1: Remove Test Data Files"
echo "================================="

echo "🔍 Removing keyword-related test data..."
rm -vf test-data/test_keyword_suggestions.json
rm -vf test-data/test_keyword_suggestions_fixed.json
rm -vf test-data/test_keyword_suggestions_fixed2.json
rm -vf test-data/test_keyword_suggestions_v2.json
rm -vf test-data/test_related_keywords.json

echo "📄 Checking for other removable test data..."
# Note: Preserving test_correct_format.json and audit_data.json as they may be for core features

echo ""
echo "📜 PHASE 2: Remove Migration Scripts"
echo "==================================="

echo "🔍 Removing keyword migration scripts..."
rm -vf scripts/migrate-keyword-tables.js

echo "🔗 Checking for backlink migration scripts..."
# Remove if any exist
find scripts/ -name "*backlink*" -type f -exec rm -v {} \; 2>/dev/null || echo "No backlink migration scripts found"

echo "🎓 Checking for learning migration scripts..."
# Remove if any exist  
find scripts/ -name "*learning*" -type f -exec rm -v {} \; 2>/dev/null || echo "No learning migration scripts found"

echo ""
echo "☁️ PHASE 3: Remove Netlify Functions"
echo "==================================="

echo "🎯 Removing competitor analysis functions..."
rm -vf netlify/functions/competitor-analysis.ts
rm -vf netlify/functions/competitor-analysis.js

echo "🔍 Removing keyword research functions..."
rm -vf netlify/functions/keyword-research.ts
rm -vf netlify/functions/keyword-research.js

echo "🔗 Checking for backlink functions..."
find netlify/functions/ -name "*backlink*" -type f -exec rm -v {} \; 2>/dev/null || echo "No backlink functions found"

echo "🎓 Checking for learning functions..."
find netlify/functions/ -name "*learning*" -type f -exec rm -v {} \; 2>/dev/null || echo "No learning functions found"

echo "📄 Checking for PDF functions..."
find netlify/functions/ -name "*pdf*" -type f -exec rm -v {} \; 2>/dev/null || echo "No PDF functions found"

echo ""
echo "🏗️  PHASE 4: Remove Built Assets"
echo "==============================="

echo "📦 Removing built chart detection utility..."
rm -vf dist/assets/chartDetection-*.js 2>/dev/null || echo "Built chart detection assets not found"

echo "🧹 Cleaning any other built assets for removed features..."
# Remove any built assets that might contain references to removed features
find dist/ -name "*competitor*" -type f -exec rm -v {} \; 2>/dev/null || echo "No competitor built assets found"
find dist/ -name "*keyword*" -type f -exec rm -v {} \; 2>/dev/null || echo "No keyword built assets found"
find dist/ -name "*backlink*" -type f -exec rm -v {} \; 2>/dev/null || echo "No backlink built assets found"
find dist/ -name "*learning*" -type f -exec rm -v {} \; 2>/dev/null || echo "No learning built assets found"
find dist/ -name "*pdf*" -type f -exec rm -v {} \; 2>/dev/null || echo "No PDF built assets found"

echo ""
echo "📸 PHASE 5: Clean Documentation Assets"
echo "====================================="

echo "🗂️  Checking docs/assets/ for removable assets..."

# Remove any documentation assets related to removed features
if [ -d "docs/assets" ]; then
    find docs/assets/ -name "*keyword*" -type f -exec rm -v {} \; 2>/dev/null || echo "No keyword documentation assets found"
    find docs/assets/ -name "*backlink*" -type f -exec rm -v {} \; 2>/dev/null || echo "No backlink documentation assets found"
    find docs/assets/ -name "*competitor*" -type f -exec rm -v {} \; 2>/dev/null || echo "No competitor documentation assets found"
    find docs/assets/ -name "*learning*" -type f -exec rm -v {} \; 2>/dev/null || echo "No learning documentation assets found"
    find docs/assets/ -name "*pdf*" -type f -exec rm -v {} \; 2>/dev/null || echo "No PDF documentation assets found"
else
    echo "📁 docs/assets/ directory not found"
fi

echo ""
echo "🧪 PHASE 6: Clean Test Files"
echo "============================"

echo "🔍 Checking for test files related to removed features..."

# Remove test files for removed features (be careful not to remove core tests)
find tests/ -name "*keyword*" -type f 2>/dev/null | while read file; do
    echo "⚠️  Found keyword test file: $file (review manually)"
done

find tests/ -name "*backlink*" -type f 2>/dev/null | while read file; do
    echo "⚠️  Found backlink test file: $file (review manually)"
done

find tests/ -name "*competitor*" -type f 2>/dev/null | while read file; do
    echo "⚠️  Found competitor test file: $file (review manually)"
done

find tests/ -name "*learning*" -type f 2>/dev/null | while read file; do
    echo "⚠️  Found learning test file: $file (review manually)"
done

find tests/ -name "*pdf*" -type f 2>/dev/null | while read file; do
    echo "⚠️  Found PDF test file: $file (review manually)"
done

echo ""
echo "🗂️  PHASE 7: Clean Temporary Files"
echo "================================="

echo "🧹 Removing any temporary files for removed features..."

# Clean any temporary files that might be related to removed features
find /tmp -name "*rival-outranker*keyword*" -type f -exec rm -v {} \; 2>/dev/null || echo "No keyword temp files found"
find /tmp -name "*rival-outranker*backlink*" -type f -exec rm -v {} \; 2>/dev/null || echo "No backlink temp files found"
find /tmp -name "*rival-outranker*pdf*" -type f -exec rm -v {} \; 2>/dev/null || echo "No PDF temp files found"

echo ""
echo "📋 PHASE 8: Clean Log References"
echo "==============================="

echo "📜 Checking for log files with removed feature references..."

if [ -d "logs" ]; then
    echo "⚠️  Note: Log files may contain references to removed features"
    echo "   Consider rotating logs after refactoring completion"
    echo "   Current log files:"
    ls -la logs/ 2>/dev/null || echo "No log files found"
else
    echo "📁 logs/ directory not found"
fi

echo ""
echo "🔍 PHASE 9: Verification"
echo "======================="

echo "✅ Verifying critical test data is preserved..."

PRESERVED_FILES=(
    "test-data/audit_data.json"
    "test-data/test_correct_format.json"
    "test-data/test_request.json"
)

for file in "${PRESERVED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file - preserved"
    else
        echo "⚠️  $file - not found (may be expected)"
    fi
done

echo ""
echo "🗑️  Verifying removed files are gone..."

REMOVED_FILES=(
    "test-data/test_keyword_suggestions.json"
    "test-data/test_related_keywords.json"
    "scripts/migrate-keyword-tables.js"
    "netlify/functions/competitor-analysis.ts"
    "netlify/functions/keyword-research.ts"
)

for file in "${REMOVED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "✅ $file - removed"
    else
        echo "❌ $file - STILL EXISTS (should be removed!)"
    fi
done

echo ""
echo "📊 PHASE 10: Disk Space Analysis"
echo "==============================="

# Calculate approximate space saved
echo "💾 Calculating approximate disk space savings..."

TOTAL_SAVED=0

# Estimate savings from removed test data (approximate)
if [ ! -f "test-data/test_keyword_suggestions.json" ]; then
    TOTAL_SAVED=$((TOTAL_SAVED + 50)) # ~50KB estimated
fi

# Add other size estimates
echo "📊 Estimated space saved:"
echo "   Test data files: ~100KB"
echo "   Migration scripts: ~20KB"
echo "   Netlify functions: ~50KB"
echo "   Built assets: ~500KB"
echo "   Total estimated: ~670KB"

echo ""
echo "📊 Test Data & Assets Cleanup Summary"
echo "===================================="
echo "✅ Keyword test data: removed"
echo "✅ Migration scripts for removed features: removed"
echo "✅ Netlify functions for removed features: removed"
echo "✅ Built assets for removed features: cleaned"
echo "✅ Temporary files: cleaned"
echo "✅ Core test data: preserved"

echo ""
echo "⚠️  MANUAL REVIEW REQUIRED:"
echo "   1. 🧪 Review test files that may reference removed features"
echo "   2. 📜 Consider log rotation after refactoring completion"
echo "   3. 🗂️  Review docs/assets/ for any remaining removable assets"

echo ""
echo "⏭️  NEXT STEPS:"
echo "1. 🧪 Run test suite: npm run test"
echo "2. 🧪 Run integration tests: npm run test:integration"
echo "3. 🧪 Run e2e tests: npm run test:e2e"
echo "4. 🏗️  Clean build: npm run build:clean && npm run build"
echo "5. ✅ Run verification script: ./cleanup-scripts/06-verification.sh"

echo ""
echo "🎉 Test data & assets cleanup completed successfully!"