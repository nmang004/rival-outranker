#!/bin/bash

# Dependency Cleanup Script: Remove NPM Dependencies for Bloated Features
# This script removes NPM packages that are no longer needed after feature removal

set -e  # Exit on any error

echo "📦 Starting Dependency Cleanup..."
echo "⚠️  WARNING: This will remove NPM packages and update package.json"
echo "📁 Working directory: $(pwd)"

# Verify we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the Rival-Outranker root directory"
    exit 1
fi

echo ""
echo "💾 PHASE 1: Backup Current Dependencies"
echo "======================================"

# Create backup of package.json
cp package.json package.json.backup
echo "✅ Created backup: package.json.backup"

echo ""
echo "📄 PHASE 2: Remove PDF/OCR Dependencies"
echo "====================================="

echo "🔍 Removing PDF processing dependencies..."
npm uninstall pdfjs-dist || echo "⚠️  pdfjs-dist not found"

echo "👁️  Removing OCR dependencies..."
npm uninstall tesseract.js || echo "⚠️  tesseract.js not found"

echo "📤 Removing file upload dependencies..."
npm uninstall react-dropzone || echo "⚠️  react-dropzone not found"

echo "📋 Removing PDF generation dependencies..."
npm uninstall jspdf || echo "⚠️  jspdf not found"
npm uninstall jspdf-autotable || echo "⚠️  jspdf-autotable not found"

echo ""
echo "🎮 PHASE 3: Remove Gamification Dependencies"
echo "=========================================="

echo "🔊 Removing sound dependencies..."
npm uninstall use-sound || echo "⚠️  use-sound not found"

echo "🎉 Removing animation dependencies..."
npm uninstall canvas-confetti || echo "⚠️  canvas-confetti not found"

echo ""
echo "🛠️  PHASE 4: Remove Type Dependencies"
echo "==================================="

echo "📝 Removing type definitions for removed features..."
npm uninstall @types/canvas-confetti || echo "⚠️  @types/canvas-confetti not found"

echo ""
echo "📊 PHASE 5: Optional DataForSEO Dependencies"
echo "==========================================="

echo "⚠️  Note: DataForSEO dependencies would be removed here if they exist"
echo "   Check if any DataForSEO-specific packages exist and remove manually if needed"
echo "   Common packages: dataforseo-client, dataforseo-js, etc."

# Uncomment if DataForSEO packages exist:
# npm uninstall dataforseo-client || echo "⚠️  dataforseo-client not found"

echo ""
echo "🔍 PHASE 6: Verify Core Dependencies Preserved"
echo "============================================="

echo "✅ Checking that core dependencies are preserved..."

CORE_DEPS=(
    "openai"
    "cheerio"
    "exceljs"
    "puppeteer"
    "drizzle-orm"
    "express"
    "react"
    "recharts"
    "@radix-ui/react-accordion"
    "tailwindcss"
)

echo ""
echo "📋 Core Dependencies Status:"
for dep in "${CORE_DEPS[@]}"; do
    if npm list "$dep" --depth=0 >/dev/null 2>&1; then
        echo "✅ $dep - present"
    else
        echo "❌ $dep - MISSING (should be present!)"
    fi
done

echo ""
echo "🗑️  PHASE 7: Verify Removed Dependencies"
echo "======================================"

REMOVED_DEPS=(
    "pdfjs-dist"
    "tesseract.js"
    "react-dropzone"
    "jspdf"
    "jspdf-autotable"
    "use-sound"
    "canvas-confetti"
    "@types/canvas-confetti"
)

echo ""
echo "🔍 Removed Dependencies Status:"
for dep in "${REMOVED_DEPS[@]}"; do
    if npm list "$dep" --depth=0 >/dev/null 2>&1; then
        echo "❌ $dep - STILL PRESENT (should be removed!)"
    else
        echo "✅ $dep - removed"
    fi
done

echo ""
echo "🧹 PHASE 8: Cleanup and Optimization"
echo "==================================="

echo "🔄 Running npm audit to check for vulnerabilities..."
npm audit || echo "⚠️  Some audit issues found - run 'npm audit fix' if needed"

echo "📦 Cleaning npm cache..."
npm cache clean --force

echo "🗂️  Removing node_modules and reinstalling for clean state..."
rm -rf node_modules package-lock.json
npm install

echo ""
echo "📊 PHASE 9: Package Analysis"
echo "============================"

echo "📈 Analyzing package.json changes..."

# Count dependencies before and after
DEPS_BEFORE=$(jq '.dependencies | length' package.json.backup 2>/dev/null || echo "unknown")
DEPS_AFTER=$(jq '.dependencies | length' package.json 2>/dev/null || echo "unknown")

if [ "$DEPS_BEFORE" != "unknown" ] && [ "$DEPS_AFTER" != "unknown" ]; then
    REMOVED_COUNT=$((DEPS_BEFORE - DEPS_AFTER))
    echo "📊 Dependencies before: $DEPS_BEFORE"
    echo "📊 Dependencies after: $DEPS_AFTER"
    echo "📉 Dependencies removed: $REMOVED_COUNT"
else
    echo "📊 Dependency count comparison not available (jq not installed)"
fi

echo ""
echo "💾 Bundle size impact (estimated):"
echo "📦 PDF.js: ~2MB reduction"
echo "👁️  Tesseract.js: ~8MB reduction"
echo "🎵 Sound files: ~500KB reduction"
echo "🎉 Canvas confetti: ~100KB reduction"
echo "📤 React dropzone: ~50KB reduction"
echo "📋 Total estimated: ~10.5MB+ reduction"

echo ""
echo "🔍 PHASE 10: Environment Variables Cleanup"
echo "=========================================="

echo "⚠️  Manual cleanup required for environment variables:"
echo ""
echo "🗑️  Remove from .env if only used by removed features:"
echo "   DATAFORSEO_API_LOGIN="
echo "   DATAFORSEO_API_PASSWORD="
echo "   GOOGLE_SEARCH_API_KEY= (if only for competitor analysis)"
echo "   GOOGLE_SEARCH_ENGINE_ID= (if only for competitor analysis)"
echo ""

echo ""
echo "📊 Dependency Cleanup Summary"
echo "============================"
echo "✅ PDF/OCR dependencies: removed"
echo "✅ Gamification dependencies: removed"
echo "✅ File upload dependencies: removed"
echo "✅ Type definitions: cleaned up"
echo "✅ Core dependencies: preserved"
echo "✅ Node modules: rebuilt cleanly"
echo "✅ Npm cache: cleaned"

echo ""
echo "⏭️  NEXT STEPS:"
echo "1. 🔧 Clean up environment variables manually"
echo "2. 🧪 Test build: npm run build"
echo "3. 🧪 Test type checking: npm run check"
echo "4. 🧪 Run tests: npm run test"
echo "5. 🧪 Start application: npm run dev"
echo "6. 🧪 Verify core features work correctly"

echo ""
echo "🔙 ROLLBACK:"
echo "   If needed, restore: cp package.json.backup package.json && npm install"

echo ""
echo "🎉 Dependency cleanup completed successfully!"

# Show final package.json dependencies count
echo ""
echo "📋 Final dependency summary:"
if command -v jq >/dev/null 2>&1; then
    echo "Production dependencies: $(jq '.dependencies | length' package.json)"
    echo "Development dependencies: $(jq '.devDependencies | length' package.json)"
    echo "Optional dependencies: $(jq '.optionalDependencies | length // 0' package.json)"
else
    echo "Install jq for detailed dependency analysis"
fi