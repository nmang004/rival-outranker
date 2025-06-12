# Modular Architecture Guidelines

## Overview
This document defines the new file organization patterns and architectural standards for Rival Outranker following the large file breakdown initiative. All guidelines aim to maintain files under 400 lines while ensuring clear separation of concerns and optimal maintainability.

## File Size Standards

### Strict Size Limits
- **Components**: 50-200 lines (complex components max 300 lines)
- **Custom Hooks**: 20-100 lines
- **Services**: 100-400 lines (single domain responsibility)
- **Utilities**: 50-150 lines (focused functionality)
- **Types/Schemas**: 50-200 lines (single domain)
- **API Routes**: 50-200 lines (single endpoint group)

### Size Monitoring
```bash
# Add to CI/CD pipeline
npm run lint:file-size-check

# Weekly monitoring command
find . -name "*.ts" -o -name "*.tsx" | xargs wc -l | awk '$1 > 400' | sort -nr
```

## Directory Structure Patterns

### Backend Service Organization
```
server/
├── controllers/              # HTTP request handlers (50-150 lines each)
│   ├── analysis.controller.ts
│   ├── audit.controller.ts
│   └── auth.controller.ts
├── services/                 # Business logic services (100-400 lines each)
│   ├── analysis/
│   │   ├── seo-analysis-orchestrator.service.ts    (300 lines)
│   │   ├── meta-tags-analyzer.service.ts           (150 lines)
│   │   ├── content-structure-analyzer.service.ts   (200 lines)
│   │   ├── score-calculator.service.ts             (150 lines)
│   │   └── default-data-factory.service.ts         (400 lines)
│   ├── audit/
│   │   ├── crawling/
│   │   │   ├── crawler-orchestrator.service.ts     (400 lines)
│   │   │   ├── cms-detection.service.ts            (300 lines)
│   │   │   ├── content-similarity.service.ts       (250 lines)
│   │   │   ├── url-management.service.ts           (400 lines)
│   │   │   ├── puppeteer-handler.service.ts        (350 lines)
│   │   │   └── sitemap-discovery.service.ts        (300 lines)
│   │   └── analyzers/
│   │       ├── enhanced-audit-orchestrator.service.ts (200 lines)
│   │       ├── content-quality-analyzer.service.ts    (400 lines)
│   │       ├── technical-seo-analyzer.service.ts      (280 lines)
│   │       ├── local-seo-analyzer.service.ts          (280 lines)
│   │       ├── ux-performance-analyzer.service.ts     (380 lines)
│   │       └── result-merger.service.ts               (150 lines)
│   ├── external/             # External API integrations (200-300 lines each)
│   ├── auth/                 # Authentication services
│   └── common/               # Shared utilities
├── repositories/             # Data access layer (100-300 lines each)
├── middleware/               # Express middleware (50-150 lines each)
└── lib/                      # Utilities and factories
    ├── utils/                # Utility functions (50-150 lines each)
    ├── factories/            # Object factories (100-200 lines each)
    └── validators/           # Input validation (50-100 lines each)
```

### Frontend Component Organization
```
client/src/
├── components/
│   ├── ui/                   # Reusable UI primitives (20-50 lines each)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   └── dialog.tsx
│   ├── features/             # Feature-specific components
│   │   ├── analysis/
│   │   │   ├── AnalysisCard.tsx              (100-150 lines)
│   │   │   ├── ScoreDisplay.tsx              (80-120 lines)
│   │   │   ├── ResultsTable.tsx              (150-200 lines)
│   │   │   ├── content/                      # Content analysis components
│   │   │   │   ├── StructureAnalysisSection.tsx    (200 lines)
│   │   │   │   ├── ReadabilitySection.tsx           (180 lines)
│   │   │   │   ├── SemanticAnalysisSection.tsx      (190 lines)
│   │   │   │   └── EngagementSection.tsx            (170 lines)
│   │   │   └── technical/                    # Technical analysis components
│   │   │       ├── PageSpeedSection.tsx             (220 lines)
│   │   │       ├── MobileAnalysisSection.tsx        (180 lines)
│   │   │       ├── StructuredDataSection.tsx        (160 lines)
│   │   │       └── SecuritySection.tsx              (140 lines)
│   │   ├── audit/
│   │   │   ├── AuditDashboard.tsx            (200-250 lines)
│   │   │   ├── ProgressTracker.tsx           (100-150 lines)
│   │   │   └── ExportPanel.tsx               (150-200 lines)
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx                 (100-150 lines)
│   │   │   ├── RegisterForm.tsx              (120-180 lines)
│   │   │   └── ProfileSettings.tsx           (150-200 lines)
│   │   └── chatbot/
│   │       ├── ChatInterface.tsx             (200-250 lines)
│   │       ├── MessageList.tsx               (100-150 lines)
│   │       └── InputPanel.tsx                (80-120 lines)
│   └── layout/               # Layout components (100-200 lines each)
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── hooks/                    # Custom hooks organized by domain
│   ├── api/                  # API interaction hooks (50-100 lines each)
│   │   ├── useAnalysis.ts
│   │   ├── useAudit.ts
│   │   └── useAuth.ts
│   ├── ui/                   # UI state hooks (20-80 lines each)
│   │   ├── useModal.ts
│   │   ├── useToast.ts
│   │   └── useLocalStorage.ts
│   └── business/             # Business logic hooks (50-150 lines each)
│       ├── useScoreCalculation.ts
│       └── useDataExport.ts
├── services/                 # Frontend services (100-200 lines each)
│   ├── api.service.ts
│   ├── export.service.ts
│   └── validation.service.ts
└── utils/                    # Utility functions (50-100 lines each)
    ├── formatting.utils.ts
    ├── validation.utils.ts
    └── constants.ts
```

### Schema Organization
```
shared/
├── schema/                   # Domain-organized schemas
│   ├── index.ts              # Barrel exports (50 lines)
│   ├── core.ts               # Auth, sessions, API usage (150 lines)
│   ├── projects.ts           # Projects and analyses (100 lines)
│   ├── backlinks.ts          # Backlink tracking (200 lines)
│   ├── seo-analysis.ts       # SEO analysis schemas (250 lines)
│   ├── competitor-analysis.ts # Competitor schemas (200 lines)
│   ├── rival-audit.ts        # Audit system (180 lines)
│   ├── keywords.ts           # Keyword tracking (150 lines)
│   ├── learning.ts           # Learning system (170 lines)
│   └── crawling.ts           # Crawling system (169 lines)
├── types/                    # Shared TypeScript types
│   ├── index.ts              # Type re-exports
│   ├── common.ts             # Common types and enums
│   ├── api.ts                # API request/response types
│   └── business.ts           # Business domain types
└── constants/                # Application constants
    ├── index.ts
    ├── seo.constants.ts
    ├── ui.constants.ts
    └── api.constants.ts
```

### Netlify Functions Organization
```
netlify/functions/            # Serverless functions (300-800 lines each after bundling)
├── seo-analyze.ts            # Core SEO analysis
├── keyword-analyze.ts        # Keyword analysis
├── technical-analyze.ts      # Technical SEO analysis
├── content-analyze.ts        # Content optimization
├── crawler.ts                # Web crawling
├── auth-login.ts             # User login
├── auth-register.ts          # User registration
├── auth-verify.ts            # Email verification
├── auth-reset.ts             # Password reset
└── auth-profile.ts           # Profile management
```

## Service Design Patterns

### Single Responsibility Principle
Each service should have one clear, focused responsibility:

```typescript
// ✅ Good: Focused responsibility
export class CMSDetectionService {
  async detectCMS(pageData: PageData): Promise<CMSType> { }
  getCMSOptimizations(cms: CMSType): CrawlOptimizations { }
  applyCMSFiltering(urls: string[], cms: CMSType): string[] { }
}

// ❌ Bad: Multiple responsibilities
export class AnalysisService {
  async detectCMS() { }
  async analyzeKeywords() { }
  async checkPageSpeed() { }
  async generateReport() { }
}
```

### Dependency Injection Pattern
Use constructor injection for better testability:

```typescript
export class SEOAnalysisOrchestrator {
  constructor(
    private metaAnalyzer = new MetaTagsAnalyzer(),
    private contentAnalyzer = new ContentStructureAnalyzer(),
    private scoreCalculator = new ScoreCalculatorService(),
    private dataFactory = new DefaultDataFactory()
  ) {}

  async analyzeWebsite(url: string): Promise<SEOAnalysisResult> {
    // Orchestration logic using injected services
  }
}
```

### Error Handling Pattern
Consistent error handling across all services:

```typescript
export class AnalysisService {
  async analyzeContent(url: string): Promise<Result<ContentAnalysis, AnalysisError>> {
    try {
      const result = await this.performAnalysis(url);
      return { success: true, data: result };
    } catch (error) {
      console.error(`Content analysis failed for ${url}:`, error);
      return { 
        success: false, 
        error: { code: 'ANALYSIS_FAILED', message: error.message }
      };
    }
  }
}
```

## Component Design Patterns

### Component Composition
Break large components into smaller, composable parts:

```tsx
// ✅ Good: Composed from smaller components
export function DeepContentAnalysis({ analysis }: Props) {
  return (
    <div className="space-y-6">
      <StructureAnalysisSection data={analysis.structure} />
      <ReadabilitySection data={analysis.readability} />
      <SemanticAnalysisSection data={analysis.semantic} />
      <EngagementSection data={analysis.engagement} />
    </div>
  );
}

// ❌ Bad: Monolithic component
export function DeepContentAnalysis({ analysis }: Props) {
  return (
    <div>
      {/* 1000+ lines of JSX for all sections */}
    </div>
  );
}
```

### Custom Hook Extraction
Extract complex state logic into reusable hooks:

```tsx
// Custom hook for analysis data management
export function useAnalysisData(url: string) {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeUrl = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analysisService.analyze(url);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  return { data, loading, error, analyzeUrl };
}

// Component using the hook
export function AnalysisComponent({ url }: Props) {
  const { data, loading, error, analyzeUrl } = useAnalysisData(url);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <AnalysisResults data={data} />;
}
```

## File Organization Rules

### Naming Conventions
- **Services**: `kebab-case.service.ts` (e.g., `cms-detection.service.ts`)
- **Components**: `PascalCase.tsx` (e.g., `AnalysisCard.tsx`)
- **Hooks**: `camelCase.ts` with `use` prefix (e.g., `useAnalysis.ts`)
- **Utils**: `kebab-case.utils.ts` (e.g., `score-calculation.utils.ts`)
- **Types**: `kebab-case.types.ts` (e.g., `seo-analysis.types.ts`)

### Import Organization
Organize imports in consistent order:

```typescript
// 1. External libraries
import React from 'react';
import axios from 'axios';

// 2. Internal utilities and types
import { ScoreUtils } from '../../lib/utils/score.utils';
import { AnalysisResult } from '../../types/analysis.types';

// 3. Components (for React files)
import { Button } from '../ui/button';
import { Card } from '../ui/card';

// 4. Relative imports
import './component.styles.css';
```

### Barrel Exports
Use index.ts files for clean imports:

```typescript
// services/analysis/index.ts
export { SEOAnalysisOrchestrator } from './seo-analysis-orchestrator.service';
export { MetaTagsAnalyzer } from './meta-tags-analyzer.service';
export { ContentStructureAnalyzer } from './content-structure-analyzer.service';
export { ScoreCalculatorService } from './score-calculator.service';

// Usage
import { 
  SEOAnalysisOrchestrator, 
  MetaTagsAnalyzer 
} from '../services/analysis';
```

## Breakdown Decision Matrix

Use this matrix to determine when and how to break down files:

| File Type | Lines | Action Required | Breakdown Strategy |
|-----------|-------|-----------------|-------------------|
| Component | 50-200 | ✅ Maintain | Well-sized component |
| Component | 200-300 | ⚠️ Monitor | Consider extracting hooks |
| Component | 300-400 | 🔄 Refactor | Extract sub-components + hooks |
| Component | 400+ | 🚨 Critical | Immediate breakdown required |
| Service | 100-200 | ✅ Maintain | Focused service |
| Service | 200-300 | ⚠️ Monitor | Check for multiple responsibilities |
| Service | 300-400 | 🔄 Refactor | Split by business concerns |
| Service | 400+ | 🚨 Critical | Immediate breakdown required |
| Schema | 50-150 | ✅ Maintain | Single domain |
| Schema | 150-200 | ⚠️ Monitor | Consider domain splitting |
| Schema | 200+ | 🔄 Refactor | Split by business domain |

## Quality Gates

### Pre-commit Checks
```bash
# File size validation
npm run lint:file-size

# Type checking
npm run type-check

# Unit tests
npm test

# Build verification
npm run build
```

### Code Review Checklist
- [ ] No file exceeds 400 lines
- [ ] Each file has single, clear responsibility
- [ ] Proper dependency injection used
- [ ] Error handling implemented consistently
- [ ] TypeScript types properly defined
- [ ] Unit tests provided for new services
- [ ] Documentation updated for public APIs

### Architecture Validation
- [ ] Services follow single responsibility principle
- [ ] Components are properly composed
- [ ] No circular dependencies exist
- [ ] Clear separation between business logic and presentation
- [ ] Consistent naming conventions followed
- [ ] Proper abstraction levels maintained

## Performance Considerations

### Bundle Size Impact
- **Before**: 7 large files, average 2,122 lines
- **After**: 35+ focused files, average 250 lines
- **Benefits**: Better tree shaking, code splitting, and caching

### Development Performance
- **Faster hot reload**: Smaller files load quicker
- **Improved IDE performance**: Better IntelliSense and navigation
- **Parallel development**: Multiple developers can work simultaneously

### Runtime Performance
- **Lazy loading**: Components can be loaded on demand
- **Better caching**: Smaller files cache more efficiently
- **Reduced memory usage**: Only necessary code loaded

## Migration Guidelines

### Incremental Approach
1. **Start with schema separation** - Foundation for all other work
2. **Extract services by domain** - Business logic refactoring
3. **Optimize bundle splitting** - Performance improvements
4. **Refactor large components** - UI improvements

### Backward Compatibility
- Maintain all existing exports through barrel files
- Preserve public API interfaces during refactoring
- Use feature flags for gradual rollout

### Testing Strategy
- Create integration tests before refactoring
- Implement unit tests for each extracted service
- Use contract testing for service interactions
- Validate performance metrics throughout

This modular architecture ensures maintainable, scalable code while providing clear guidelines for future development and preventing the accumulation of large, unwieldy files.