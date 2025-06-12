# File Breakdown Execution Plan

## Overview
Systematic refactoring of 7 large files (18,851 lines) into 35+ focused, maintainable services. Estimated timeline: 8-10 days with proper testing and validation.

## Phase 1: Schema Reorganization (Day 1-2)
**Priority: Critical Foundation**
*Start with schema to establish clean type boundaries for all other refactoring*

### Step 1.1: Schema Domain Separation (Day 1, Morning)
**File:** `shared/schema.ts` (1,419 lines → 9 domain files)

**Pre-refactoring Checklist:**
- [ ] Backup current schema.ts file
- [ ] Run all tests to establish baseline
- [ ] Document all current exports for compatibility verification
- [ ] Create comprehensive integration test for schema integrity

**Breakdown Sequence:**
```bash
# Create new schema directory structure
mkdir -p shared/schema
cd shared/schema

# Create domain-specific schema files
touch index.ts core.ts projects.ts backlinks.ts seo-analysis.ts
touch competitor-analysis.ts rival-audit.ts keywords.ts learning.ts crawling.ts
```

**1. Extract Core Domain** (2 hours)
```typescript
// shared/schema/core.ts (150 lines)
export const apiUsage = pgTable(/* ... */);
export const sessions = pgTable(/* ... */);
export const users = pgTable(/* ... */);
export const anonChatUsage = pgTable(/* ... */);

// Include related Zod schemas and insert schemas
export const insertUserSchema = createInsertSchema(users);
export const loginUserSchema = /* ... */;
```

**2. Extract Projects Domain** (1 hour)
```typescript
// shared/schema/projects.ts (100 lines)
export const analyses = pgTable(/* ... */);
export const projects = pgTable(/* ... */);
export const projectAnalyses = pgTable(/* ... */);
```

**3. Extract Keywords Domain** (2 hours)
```typescript
// shared/schema/keywords.ts (150 lines)
export const keywords = pgTable(/* ... */);
export const keywordMetrics = pgTable(/* ... */);
export const keywordRankings = pgTable(/* ... */);
export const competitorRankings = pgTable(/* ... */);
export const keywordSuggestions = pgTable(/* ... */);
```

**4. Continue with remaining domains** (4 hours)
- Backlinks domain (200 lines)
- SEO Analysis domain (250 lines)
- Competitor Analysis domain (200 lines)
- Rival Audit domain (180 lines)
- Learning domain (170 lines)
- Crawling domain (169 lines)

**5. Create Barrel Export** (30 minutes)
```typescript
// shared/schema/index.ts (50 lines)
export * from './core';
export * from './projects';
export * from './backlinks';
export * from './seo-analysis';
export * from './competitor-analysis';
export * from './rival-audit';
export * from './keywords';
export * from './learning';
export * from './crawling';
```

**Post-Step Validation:**
```bash
# Verify no broken imports
npm run type-check

# Run all tests to ensure schema integrity
npm test

# Verify database operations still work
npm run db:push
```

### Step 1.2: Update All Schema Imports (Day 1, Afternoon)
**Update import statements across codebase:**
```bash
# Find all files importing from shared/schema
rg "from.*shared/schema" --type ts --type tsx -l

# Update imports to use new structure (maintain compatibility)
# Example: Change specific imports to use barrel export
# Most imports can remain unchanged due to barrel export
```

## Phase 2: Service Layer Breakdown (Day 2-5)
**Priority: High - Core Business Logic**

### Step 2.1: Crawler Service Breakdown (Day 2)
**File:** `server/services/audit/crawler.service.ts` (2,781 lines → 6 services)

**Morning: Extract CMS Detection (2 hours)**
```bash
# Create new service
touch server/services/audit/crawling/cms-detection.service.ts
```

```typescript
// Extract 300 lines of CMS detection logic
export class CMSDetectionService {
  async detectCMSAndFingerprint(pageData: any): Promise<CMSFingerprint> { /* ... */ }
  getCMSOptimizations(cms: string): CrawlOptimizations { /* ... */ }
  applyCMSFiltering(urls: string[], cms: string): string[] { /* ... */ }
}
```

**Morning: Extract URL Management (2 hours)**
```bash
touch server/services/audit/crawling/url-management.service.ts
```

```typescript
// Extract 400 lines of URL processing logic
export class URLManagementService {
  normalizeUrl(url: string): string { /* ... */ }
  shouldSkipUrl(url: string, cms: string): boolean { /* ... */ }
  prioritizeUrlsByImportance(urls: string[]): string[] { /* ... */ }
  prefilterUrls(urls: string[], options: FilterOptions): string[] { /* ... */ }
}
```

**Afternoon: Extract Content Similarity (2 hours)**
```bash
touch server/services/audit/crawling/content-similarity.service.ts
```

```typescript
// Extract 250 lines of similarity detection
export class ContentSimilarityService {
  generateContentHash(content: string): string { /* ... */ }
  calculateContentSimilarity(hash1: string, hash2: string): number { /* ... */ }
  checkContentSimilarity(newContent: string, existingHashes: Map<string, string>): boolean { /* ... */ }
}
```

**Afternoon: Extract Puppeteer Handler (2 hours)**
```bash
touch server/services/audit/crawling/puppeteer-handler.service.ts
```

**Day 2 End: Update Main Crawler (1 hour)**
```typescript
// server/services/audit/crawler.service.ts (now ~400 lines)
import { CMSDetectionService } from './crawling/cms-detection.service';
import { URLManagementService } from './crawling/url-management.service';
import { ContentSimilarityService } from './crawling/content-similarity.service';

export class Crawler {
  constructor(
    private cmsDetection = new CMSDetectionService(),
    private urlManagement = new URLManagementService(),
    private contentSimilarity = new ContentSimilarityService()
  ) {}
}
```

### Step 2.2: Enhanced Analyzer Breakdown (Day 3)
**File:** `server/services/audit/enhanced-analyzer.service.ts` (2,520 lines → 6 services)

**Morning: Extract Individual Analyzers (4 hours)**
```bash
mkdir -p server/services/audit/analyzers
touch server/services/audit/analyzers/content-quality-analyzer.service.ts
touch server/services/audit/analyzers/technical-seo-analyzer.service.ts
touch server/services/audit/analyzers/local-seo-analyzer.service.ts
touch server/services/audit/analyzers/ux-performance-analyzer.service.ts
```

**Extract each analyzer class to its own file:**
```typescript
// server/services/audit/analyzers/content-quality-analyzer.service.ts (470 lines)
export class ContentQualityAnalyzer {
  analyzeContentQuality(pageData: PageCrawlResult): ContentQualityResult { /* ... */ }
  analyzeEATFactors(pageData: PageCrawlResult): EATAnalysis { /* ... */ }
  analyzeContentDepth(content: string): ContentDepthMetrics { /* ... */ }
}
```

**Afternoon: Create Result Merger Service (2 hours)**
```bash
touch server/services/audit/analyzers/result-merger.service.ts
```

**Afternoon: Update Enhanced Analyzer Orchestrator (2 hours)**
```typescript
// server/services/audit/enhanced-analyzer.service.ts (now ~200 lines)
import { ContentQualityAnalyzer } from './analyzers/content-quality-analyzer.service';
import { TechnicalSEOAnalyzer } from './analyzers/technical-seo-analyzer.service';
// ... other imports

export class EnhancedAuditAnalyzer {
  constructor(
    private contentAnalyzer = new ContentQualityAnalyzer(),
    private technicalAnalyzer = new TechnicalSEOAnalyzer(),
    // ... other analyzers
  ) {}
}
```

### Step 2.3: Core Analyzer Breakdown (Day 4)
**File:** `server/services/analysis/analyzer.service.ts` (1,593 lines → 6 services)

**Morning: Extract Default Data Factory (3 hours)**
```bash
touch server/services/analysis/default-data-factory.service.ts
```

```typescript
// Extract 400 lines of default creation methods
export class DefaultDataFactory {
  static createErrorAnalysisResult(url: string, error: string): SeoAnalysisResult { /* ... */ }
  static createDefaultKeywordAnalysis(keyword: string): KeywordAnalysis { /* ... */ }
  static createDefaultMetaTagsAnalysis(): MetaTagsAnalysis { /* ... */ }
  // ... 10+ more default creation methods
}
```

**Morning: Extract Score Calculator (1 hour)**
```bash
touch server/services/analysis/score-calculator.service.ts
```

**Afternoon: Extract Meta Tags Analyzer (2 hours)**
```bash
touch server/services/analysis/meta-tags-analyzer.service.ts
```

**Afternoon: Extract Content Structure Analyzer (2 hours)**
```bash
touch server/services/analysis/content-structure-analyzer.service.ts
```

**Day 4 End: Update Main Analyzer (1 hour)**
```typescript
// server/services/analysis/analyzer.service.ts (now ~300 lines)
import { DefaultDataFactory } from './default-data-factory.service';
import { ScoreCalculatorService } from './score-calculator.service';

export class Analyzer {
  constructor(
    private scoreCalculator = new ScoreCalculatorService(),
    // ... other services
  ) {}

  async analyzeWebsite(url: string): Promise<SeoAnalysisResult> {
    try {
      // Main orchestration logic only
    } catch (error) {
      return DefaultDataFactory.createErrorAnalysisResult(url, error.message);
    }
  }
}
```

### Step 2.4: Content Analyzer Breakdown (Day 5)
**File:** `server/services/analysis/content-analyzer.service.ts` (1,317 lines → 6 services)

**Morning: Extract Structure Analyzer (2 hours)**
```bash
mkdir -p server/services/analysis/content
touch server/services/analysis/content/structure-analyzer.service.ts
```

**Morning: Extract Readability Calculator (2 hours)**
```bash
touch server/services/analysis/content/readability-calculator.service.ts
```

**Afternoon: Extract Semantic Analyzer (2 hours)**
```bash
touch server/services/analysis/content/semantic-analyzer.service.ts
```

**Afternoon: Extract Engagement Detector (2 hours)**
```bash
touch server/services/analysis/content/engagement-detector.service.ts
touch server/services/analysis/content/content-annotator.service.ts
```

**Day 5 End: Update Content Analyzer Orchestrator (1 hour)**

## Phase 3: Bundle Optimization (Day 6-7)
**Priority: Medium - Performance Optimization**

### Step 3.1: Netlify Functions Splitting (Day 6)

**Morning: Analyze Bundle Dependencies (2 hours)**
```bash
# Analyze current bundle composition
npm run build
npx webpack-bundle-analyzer dist/analyze.js

# Identify shared dependencies
npx depcheck
```

**Morning: Create Shared Function Layer (2 hours)**
```bash
mkdir -p netlify/layers/shared
touch netlify/layers/shared/database.js
touch netlify/layers/shared/auth.js
touch netlify/layers/shared/utils.js
```

**Afternoon: Split analyze.js Function (4 hours)**
```bash
# Create feature-specific functions
touch netlify/functions/seo-analyze.ts
touch netlify/functions/keyword-analyze.ts
touch netlify/functions/technical-analyze.ts
touch netlify/functions/content-analyze.ts
touch netlify/functions/crawler.ts
```

**Implementation Pattern:**
```typescript
// netlify/functions/seo-analyze.ts
import { analyzer } from '../../server/services/analysis/analyzer.service';

export const handler = async (event, context) => {
  // Focus only on core SEO analysis
  const result = await analyzer.analyzeCore(url);
  return { statusCode: 200, body: JSON.stringify(result) };
};
```

### Step 3.2: Auth Functions Splitting (Day 6 Evening)
```bash
touch netlify/functions/auth-login.ts
touch netlify/functions/auth-register.ts
touch netlify/functions/auth-verify.ts
touch netlify/functions/auth-reset.ts
touch netlify/functions/auth-profile.ts
```

### Step 3.3: Update Build Configuration (Day 7)
**Update build configs for code splitting and shared layers**

## Phase 4: Frontend Component Optimization (Day 7-8)
**Priority: Medium - Large React Components**

### Step 4.1: DeepContentAnalysis Component Breakdown (Day 7)
**File:** `client/src/components/features/analysis/DeepContentAnalysis.tsx` (1,141 lines)

**Extract into focused components:**
```bash
mkdir -p client/src/components/features/analysis/content
touch client/src/components/features/analysis/content/StructureAnalysisSection.tsx
touch client/src/components/features/analysis/content/ReadabilitySection.tsx
touch client/src/components/features/analysis/content/SemanticAnalysisSection.tsx
touch client/src/components/features/analysis/content/EngagementSection.tsx
```

### Step 4.2: TechnicalTab Component Breakdown (Day 8)
**File:** `client/src/components/features/analysis/TechnicalTab.tsx` (1,049 lines)

**Extract technical analysis components:**
```bash
mkdir -p client/src/components/features/analysis/technical
touch client/src/components/features/analysis/technical/PageSpeedSection.tsx
touch client/src/components/features/analysis/technical/MobileAnalysisSection.tsx
touch client/src/components/features/analysis/technical/StructuredDataSection.tsx
touch client/src/components/features/analysis/technical/SecuritySection.tsx
```

## Phase 5: Testing & Validation (Day 8-10)

### Step 5.1: Comprehensive Testing (Day 8)
```bash
# Run full test suite
npm test

# Run type checking
npm run type-check

# Run build process
npm run build

# Test all API endpoints
npm run test:integration

# Performance testing
npm run test:performance
```

### Step 5.2: Bundle Analysis (Day 9)
```bash
# Analyze new bundle sizes
npm run build:analyze

# Compare before/after metrics
npm run benchmark

# Verify no functionality regression
npm run test:e2e
```

### Step 5.3: Documentation & Cleanup (Day 10)
```bash
# Update README with new architecture
# Update CLAUDE.md with new structure
# Clean up old files and imports
# Update deployment configurations
```

## Validation Checklist

### Functionality Validation
- [ ] All existing API endpoints work correctly
- [ ] SEO analysis produces identical results
- [ ] User authentication functions properly
- [ ] Database operations complete successfully
- [ ] All tests pass without modification

### Performance Validation
- [ ] Bundle sizes reduced by target percentages
- [ ] Build time improved or maintained
- [ ] Runtime performance maintained or improved
- [ ] Memory usage optimized
- [ ] Cold start times improved for functions

### Code Quality Validation
- [ ] No file exceeds 400 lines
- [ ] All services have single, clear responsibility
- [ ] Dependency injection properly implemented
- [ ] Error handling preserved throughout
- [ ] TypeScript types maintained and improved

## Rollback Strategy

### Immediate Rollback (If Critical Issues Found)
```bash
# Revert to previous working state
git checkout main
git revert <commit-range>

# Quick deployment of previous version
npm run deploy:rollback
```

### Partial Rollback (If Specific Service Issues)
```bash
# Revert specific service changes
git checkout main -- server/services/specific-service/
npm run test:specific-service
npm run deploy:incremental
```

## Success Metrics

### Quantitative Targets
- [ ] **File Count**: 7 large files → 35+ focused files
- [ ] **Average File Size**: 2,122 lines → 250 lines
- [ ] **Bundle Size**: Reduce by 15-20%
- [ ] **Build Time**: Maintain or improve by 10%
- [ ] **Test Coverage**: Maintain 80%+ coverage

### Qualitative Improvements
- [ ] **Developer Experience**: Faster code navigation and understanding
- [ ] **Maintainability**: Easier to modify specific functionality
- [ ] **Testability**: Each service can be tested in isolation
- [ ] **Collaboration**: Multiple developers can work on different services
- [ ] **Debugging**: Issues can be traced to specific, focused services

This systematic approach ensures safe, incremental refactoring with comprehensive validation at each step, transforming a complex codebase into a maintainable, modular architecture.