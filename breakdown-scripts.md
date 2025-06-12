# Automated Breakdown Scripts

## Overview
This document provides executable scripts and tools for automating the file breakdown process, ensuring consistency and reducing manual effort during refactoring.

## Core Breakdown Scripts

### 1. Component Breakdown Script
```bash
#!/bin/bash
# breakdown-component.sh
# Usage: ./breakdown-component.sh <component-file> <output-directory>

set -e

COMPONENT_FILE=$1
OUTPUT_DIR=$2

if [ -z "$COMPONENT_FILE" ] || [ -z "$OUTPUT_DIR" ]; then
    echo "Usage: $0 <component-file> <output-directory>"
    echo "Example: $0 ./src/components/LargeComponent.tsx ./src/components/large-component"
    exit 1
fi

echo "🔍 Analyzing component: $COMPONENT_FILE"
LINES=$(wc -l < "$COMPONENT_FILE")
echo "📏 Lines: $LINES"

if [ $LINES -lt 300 ]; then
    echo "✅ Component is already appropriately sized ($LINES lines)"
    exit 0
fi

echo "📁 Creating output directory structure..."
mkdir -p "$OUTPUT_DIR/components"
mkdir -p "$OUTPUT_DIR/hooks" 
mkdir -p "$OUTPUT_DIR/types"
mkdir -p "$OUTPUT_DIR/utils"

echo "🔍 Identifying extraction points..."
echo "=== Functions and Components Found ==="
grep -n "^const \|^function \|^export \|^interface \|^type " "$COMPONENT_FILE" | head -20

echo ""
echo "=== useState and useEffect Hooks ==="
grep -n "useState\|useEffect\|useCallback\|useMemo" "$COMPONENT_FILE" | wc -l | xargs echo "Hook count:"

echo ""
echo "=== Suggested Breakdown Strategy ==="
echo "1. Extract custom hooks (useState, useEffect, business logic)"
echo "2. Extract sub-components (JSX sections with clear boundaries)"
echo "3. Extract types and interfaces"
echo "4. Extract utility functions"

echo ""
echo "🛠️  Manual extraction points to consider:"
echo "   - Look for JSX sections that can become separate components"
echo "   - Extract state management into custom hooks"
echo "   - Move utility functions to separate files"
echo "   - Create index.ts for clean imports"

echo ""
echo "📋 Checklist for manual extraction:"
echo "   □ Identify JSX sections for sub-components"
echo "   □ Extract useState/useEffect into custom hooks"
echo "   □ Move interfaces/types to types file"
echo "   □ Extract utility functions"
echo "   □ Create barrel export (index.ts)"
echo "   □ Update imports in parent component"
echo "   □ Run tests to verify functionality"
```

### 2. Service Breakdown Script
```bash
#!/bin/bash
# breakdown-service.sh
# Usage: ./breakdown-service.sh <service-file> <domain-name>

set -e

SERVICE_FILE=$1
DOMAIN_NAME=$2

if [ -z "$SERVICE_FILE" ] || [ -z "$DOMAIN_NAME" ]; then
    echo "Usage: $0 <service-file> <domain-name>"
    echo "Example: $0 ./server/services/large-service.ts crawler"
    exit 1
fi

echo "🔍 Analyzing service: $SERVICE_FILE"
LINES=$(wc -l < "$SERVICE_FILE")
echo "📏 Lines: $LINES"

if [ $LINES -lt 400 ]; then
    echo "✅ Service is appropriately sized ($LINES lines)"
    exit 0
fi

echo "📁 Creating domain-specific service directory..."
mkdir -p "server/services/$DOMAIN_NAME"

echo "🔍 Identifying service boundaries..."
echo "=== Class and Function Boundaries ==="
grep -n "^export class\|^class \|^export function\|^async function\|^function " "$SERVICE_FILE"

echo ""
echo "=== Method Boundaries ==="
grep -n "^\s*async \|^\s*public \|^\s*private \|^\s*protected " "$SERVICE_FILE" | head -15

echo ""
echo "=== Import Dependencies ==="
grep -n "^import " "$SERVICE_FILE"

echo ""
echo "🛠️  Suggested breakdown for $DOMAIN_NAME domain:"
echo "   1. Extract helper methods into utility services"
echo "   2. Split by logical business concerns"
echo "   3. Create orchestrator service for coordination"
echo "   4. Extract interfaces and types"

echo ""
echo "📋 Manual extraction checklist:"
echo "   □ Identify groups of related methods"
echo "   □ Extract helper/utility methods first"
echo "   □ Create separate services for distinct concerns"
echo "   □ Update main service to use dependency injection"
echo "   □ Create index.ts for clean exports"
echo "   □ Update all import statements"
echo "   □ Run tests to verify functionality"
```

### 3. Schema Breakdown Script
```bash
#!/bin/bash
# breakdown-schema.sh
# Usage: ./breakdown-schema.sh <schema-file>

set -e

SCHEMA_FILE=$1

if [ -z "$SCHEMA_FILE" ]; then
    echo "Usage: $0 <schema-file>"
    echo "Example: $0 ./shared/schema.ts"
    exit 1
fi

echo "🔍 Analyzing schema file: $SCHEMA_FILE"
LINES=$(wc -l < "$SCHEMA_FILE")
echo "📏 Lines: $LINES"

echo "📁 Creating schema domain structure..."
mkdir -p "shared/schema"
mkdir -p "shared/types"

echo "🔍 Identifying schema domains..."
echo "=== Table Definitions Found ==="
grep -n "pgTable\|export const.*=" "$SCHEMA_FILE" | head -20

echo ""
echo "=== Zod Schema Definitions ==="
grep -n "Schema\|\.object\|\.string\|\.number" "$SCHEMA_FILE" | wc -l | xargs echo "Schema count:"

echo ""
echo "🏗️  Suggested domain organization:"
echo "   core.ts        - Users, sessions, API usage"
echo "   projects.ts    - Projects and analyses"  
echo "   keywords.ts    - Keyword research and tracking"
echo "   backlinks.ts   - Backlink analysis"
echo "   learning.ts    - Learning management"
echo "   crawling.ts    - Web crawling system"

echo ""
echo "📋 Schema breakdown checklist:"
echo "   □ Group related tables by business domain"
echo "   □ Maintain foreign key relationships"
echo "   □ Create domain-specific type exports"
echo "   □ Create barrel export (index.ts)"
echo "   □ Update all import statements"
echo "   □ Verify database operations still work"
echo "   □ Run migration tests"
```

### 4. Bundle Analysis Script
```bash
#!/bin/bash
# analyze-bundle.sh
# Usage: ./analyze-bundle.sh [function-name]

set -e

FUNCTION_NAME=${1:-"all"}

echo "📦 Analyzing bundle composition..."

if [ "$FUNCTION_NAME" = "all" ]; then
    echo "🔍 Analyzing all Netlify functions..."
    for func in netlify/functions/*.js; do
        if [ -f "$func" ]; then
            filename=$(basename "$func")
            size=$(wc -c < "$func")
            lines=$(wc -l < "$func")
            echo "   $filename: ${size} bytes, ${lines} lines"
        fi
    done
else
    FUNC_FILE="netlify/functions/${FUNCTION_NAME}.js"
    if [ -f "$FUNC_FILE" ]; then
        echo "🔍 Analyzing $FUNCTION_NAME function..."
        size=$(wc -c < "$FUNC_FILE")
        lines=$(wc -l < "$FUNC_FILE")
        echo "   Size: ${size} bytes"
        echo "   Lines: ${lines}"
        
        echo ""
        echo "📊 Top dependencies by size estimate:"
        grep -o "from [\"'][^\"']*[\"']" "$FUNC_FILE" | sort | uniq -c | sort -nr | head -10
    else
        echo "❌ Function file not found: $FUNC_FILE"
        exit 1
    fi
fi

echo ""
echo "💡 Bundle optimization suggestions:"
echo "   - Split large functions by feature"
echo "   - Use dynamic imports for optional dependencies"
echo "   - Implement code splitting for shared utilities"
echo "   - Consider serverless function layers for common code"
```

## Validation Scripts

### 5. Post-Breakdown Validation Script
```bash
#!/bin/bash
# validate-breakdown.sh
# Comprehensive validation after file breakdown

set -e

echo "🧪 Running post-breakdown validation..."

# Check for file size compliance
echo "📏 Checking file sizes..."
LARGE_FILES=$(find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs wc -l | awk '$1 > 400 {print $1, $2}' | sort -nr)

if [ -n "$LARGE_FILES" ]; then
    echo "⚠️  Files still over 400 lines:"
    echo "$LARGE_FILES"
else
    echo "✅ All files are appropriately sized"
fi

# Check for broken imports
echo ""
echo "🔗 Checking for TypeScript errors..."
if npm run type-check > /dev/null 2>&1; then
    echo "✅ No TypeScript errors found"
else
    echo "❌ TypeScript errors detected - run 'npm run type-check' for details"
fi

# Run tests
echo ""
echo "🧪 Running test suite..."
if npm test > /dev/null 2>&1; then
    echo "✅ All tests passing"
else
    echo "❌ Test failures detected - run 'npm test' for details"
fi

# Check build
echo ""
echo "🏗️  Testing build process..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Build successful"
    
    # Analyze bundle size
    echo "📦 Analyzing bundle size..."
    ls -la dist/ | awk '{print $5, $9}' | grep -E '\.(js|css)$' | sort -nr
else
    echo "❌ Build failed - run 'npm run build' for details"
fi

# Check for circular dependencies
echo ""
echo "🔄 Checking for circular dependencies..."
if command -v madge > /dev/null; then
    CIRCULAR=$(madge --circular --extensions ts,tsx,js,jsx src/)
    if [ -n "$CIRCULAR" ]; then
        echo "⚠️  Circular dependencies found:"
        echo "$CIRCULAR"
    else
        echo "✅ No circular dependencies detected"
    fi
else
    echo "ℹ️  Install 'madge' to check for circular dependencies: npm install -g madge"
fi

echo ""
echo "📊 Breakdown validation complete!"
```

### 6. Performance Comparison Script
```bash
#!/bin/bash
# performance-comparison.sh
# Compare performance metrics before and after breakdown

set -e

echo "📊 Performance comparison analysis..."

# File count comparison
echo "📁 File statistics:"
TOTAL_FILES=$(find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | wc -l)
LARGE_FILES=$(find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs wc -l | awk '$1 > 400' | wc -l)
AVG_SIZE=$(find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs wc -l | awk '{sum+=$1; count++} END {print int(sum/count)}')

echo "   Total TypeScript files: $TOTAL_FILES"
echo "   Files over 400 lines: $LARGE_FILES"
echo "   Average file size: $AVG_SIZE lines"

# Build time measurement
echo ""
echo "⏱️  Measuring build performance..."
BUILD_START=$(date +%s)
npm run build > /dev/null 2>&1
BUILD_END=$(date +%s)
BUILD_TIME=$((BUILD_END - BUILD_START))
echo "   Build time: ${BUILD_TIME} seconds"

# Bundle size analysis
echo ""
echo "📦 Bundle analysis:"
if [ -d "dist" ]; then
    TOTAL_SIZE=$(du -sh dist/ | awk '{print $1}')
    echo "   Total bundle size: $TOTAL_SIZE"
    
    echo "   Largest files:"
    find dist/ -name "*.js" -exec ls -la {} + | sort -k5 -nr | head -5 | awk '{print "     " $9 ": " $5 " bytes"}'
fi

# Type checking performance
echo ""
echo "🔍 Type checking performance..."
TYPE_START=$(date +%s)
npm run type-check > /dev/null 2>&1
TYPE_END=$(date +%s)
TYPE_TIME=$((TYPE_END - TYPE_START))
echo "   Type check time: ${TYPE_TIME} seconds"

echo ""
echo "💡 Performance recommendations:"
if [ $LARGE_FILES -gt 0 ]; then
    echo "   - Continue breaking down $LARGE_FILES remaining large files"
fi
if [ $BUILD_TIME -gt 30 ]; then
    echo "   - Consider implementing incremental builds"
fi
if [ $TYPE_TIME -gt 15 ]; then
    echo "   - Consider using project references for faster type checking"
fi
```

## Automated Quality Checks

### 7. Code Quality Scanner
```bash
#!/bin/bash
# quality-scanner.sh
# Automated code quality checks for broken down files

set -e

echo "🔍 Running code quality analysis..."

# Function to check file complexity
check_complexity() {
    local file=$1
    local lines=$(wc -l < "$file")
    local functions=$(grep -c "function\|const.*=.*(" "$file" 2>/dev/null || echo 0)
    local classes=$(grep -c "class\|interface" "$file" 2>/dev/null || echo 0)
    
    echo "$file,$lines,$functions,$classes"
}

# Create CSV report
echo "file,lines,functions,classes" > quality-report.csv

echo "📊 Analyzing file complexity..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | while read file; do
    check_complexity "$file" >> quality-report.csv
done

# Analyze results
echo ""
echo "📈 Quality metrics summary:"
awk -F',' 'NR>1 {
    if($2>400) large++; 
    if($2>200) medium++; 
    total++; 
    sum+=$2
} END {
    avg=sum/total;
    printf "   Total files analyzed: %d\n", total;
    printf "   Files over 400 lines: %d\n", large;
    printf "   Files over 200 lines: %d\n", medium;
    printf "   Average file size: %.0f lines\n", avg;
}' quality-report.csv

# Check for naming conventions
echo ""
echo "📝 Checking naming conventions..."
NAMING_ISSUES=$(find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -E '(PascalCase\.service\.|snake_case\.component\.|UPPERCASE\.ts)' | wc -l)
if [ $NAMING_ISSUES -eq 0 ]; then
    echo "✅ Naming conventions are consistent"
else
    echo "⚠️  $NAMING_ISSUES files may have naming convention issues"
fi

# Check for proper exports
echo ""
echo "📤 Checking export patterns..."
MISSING_EXPORTS=$(find . -name "index.ts" | xargs grep -L "export" 2>/dev/null | wc -l)
if [ $MISSING_EXPORTS -eq 0 ]; then
    echo "✅ All index files have proper exports"
else
    echo "⚠️  $MISSING_EXPORTS index files may be missing exports"
fi

echo ""
echo "📋 Quality scan complete! Check quality-report.csv for detailed metrics."
```

## IDE Integration Scripts

### 8. VSCode Workspace Setup
```bash
#!/bin/bash
# setup-vscode-workspace.sh
# Configure VSCode for optimal modular development

set -e

echo "⚙️  Setting up VSCode workspace for modular development..."

# Create .vscode directory if it doesn't exist
mkdir -p .vscode

# Create settings for better file navigation
cat > .vscode/settings.json << 'EOF'
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "typescript.preferences.organizeImports": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "explorer.fileNesting.enabled": true,
  "explorer.fileNesting.patterns": {
    "*.ts": "${capture}.*.ts,${capture}.types.ts,${capture}.utils.ts,${capture}.service.ts",
    "*.tsx": "${capture}.*.tsx,${capture}.styles.css,${capture}.module.css"
  },
  "files.associations": {
    "*.service.ts": "typescript",
    "*.types.ts": "typescript",
    "*.utils.ts": "typescript"
  }
}
EOF

# Create useful code snippets
cat > .vscode/typescript.json << 'EOF'
{
  "Service Class": {
    "prefix": "service-class",
    "body": [
      "/**",
      " * ${1:Service} - ${2:Description}",
      " */",
      "export class ${1:Service} {",
      "  constructor() {",
      "    // Initialize service",
      "  }",
      "",
      "  async ${3:methodName}(${4:params}): Promise<${5:ReturnType}> {",
      "    try {",
      "      $0",
      "    } catch (error) {",
      "      console.error('Error in ${1:Service}.${3:methodName}:', error);",
      "      throw new Error('${3:methodName} failed: ' + error.message);",
      "    }",
      "  }",
      "}"
    ],
    "description": "Create a new service class with error handling"
  },
  "React Component with Hook": {
    "prefix": "component-hook",
    "body": [
      "import React from 'react';",
      "import { use${1:Name} } from './use${1:Name}';",
      "",
      "interface ${1:Name}Props {",
      "  $2",
      "}",
      "",
      "export function ${1:Name}({ $3 }: ${1:Name}Props) {",
      "  const { $4 } = use${1:Name}();",
      "",
      "  return (",
      "    <div>",
      "      $0",
      "    </div>",
      "  );",
      "}"
    ],
    "description": "Create a React component with custom hook"
  }
}
EOF

echo "✅ VSCode workspace configured for modular development"
echo "   - File nesting enabled for better organization"
echo "   - Auto-imports and organize imports configured"
echo "   - Code snippets added for services and components"
```

## Usage Examples

### Breaking Down a Large Component
```bash
# 1. Analyze the component
./breakdown-component.sh src/components/LargeComponent.tsx src/components/large-component

# 2. Manually extract based on analysis
# 3. Validate the breakdown
./validate-breakdown.sh

# 4. Check quality metrics
./quality-scanner.sh
```

### Breaking Down a Service File
```bash
# 1. Analyze the service
./breakdown-service.sh server/services/large-service.ts crawler

# 2. Perform manual extraction
# 3. Validate functionality
./validate-breakdown.sh

# 4. Compare performance
./performance-comparison.sh
```

### Complete Workflow
```bash
# 1. Set up development environment
./setup-vscode-workspace.sh

# 2. Analyze current state
./analyze-bundle.sh

# 3. Break down files systematically
./breakdown-schema.sh shared/schema.ts
# ... break down other files

# 4. Validate all changes
./validate-breakdown.sh

# 5. Generate quality report
./quality-scanner.sh

# 6. Compare performance
./performance-comparison.sh
```

These scripts provide automated assistance for the file breakdown process while maintaining quality and ensuring no functionality is lost during refactoring.