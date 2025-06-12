# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands
```bash
npm run dev        # Start development server with hot reload (Vite frontend + Express backend)
npm run build      # Build production assets (frontend + backend compilation)
npm start          # Start production server
npm run check      # TypeScript type checking across entire codebase
npm run db:push    # Push database schema changes to PostgreSQL (Drizzle ORM)
```

### Security Commands
```bash
npm run security:audit     # Audit dependencies for vulnerabilities
npm run security:test      # Run comprehensive security tests
npm run security:headers   # Test security headers implementation
npm run security:fix       # Fix known security vulnerabilities
npm run security:deps      # Check for outdated dependencies
```

### Development Workflow
- Development server runs both frontend (Vite on client/) and backend (Express on server/) concurrently
- Frontend builds to `dist/public/` directory
- Backend uses ESBuild for TypeScript compilation
- Database migrations handled via Drizzle Kit

## Architecture Overview

Rival Outranker is a professional-grade SEO analysis platform with a modular React frontend, Express backend, and PostgreSQL database.

### Key Architectural Patterns

**Modular Monorepo**: Single repository with domain-organized services sharing types via `shared/schema/`

**Layered Architecture**: Clean separation of concerns across all layers:
- **Controllers** (`server/controllers/`): HTTP request/response handling
- **Services** (`server/services/`): Business logic organized by domain
- **Repositories** (`server/repositories/`): Data access abstraction
- **Schemas** (`shared/schema/`): Domain-organized validation and types

**API Design**: RESTful Express.js API with optional authentication - public access for core features, enhanced capabilities for authenticated users

**Database Pattern**: Drizzle ORM with domain-specific Zod schemas:
- Runtime validation for API endpoints
- TypeScript type generation
- Database schema definition and migrations

**State Management**: TanStack Query for server state caching, minimal client state

**Security**: Production-grade implementation:
- JWT authentication with refresh tokens
- Advanced rate limiting and DDoS protection
- Input sanitization and XSS prevention
- Security headers (CSP, HSTS, X-Frame-Options)
- Account lockout and session management

### Modular Service Architecture

**Analysis Services** (`server/services/analysis/`):
- `analyzer.service.ts` - Core SEO analysis orchestrator (50+ factors)
- `content-analyzer.service.ts` - OpenAI-powered content analysis
- Modular analyzers with dependency injection

**Audit Services** (`server/services/audit/`):
- `crawler-orchestrator.service.ts` - Professional audit crawler
- `enhanced-analyzer.service.ts` - 140+ factor audit analysis
- `cms-detection.service.ts`, `content-similarity.service.ts` - Specialized crawling
- Real-time progress via server-sent events

**External API Services** (`server/services/external/`):
- OpenAI, DataForSEO, Google APIs integration
- Automatic fallback to sample data
- Usage tracking and cost estimation

**Common Services** (`server/services/common/`):
- Export utilities (Excel, CSV)
- Admin functions and API monitoring
- Shared business logic

### Frontend Architecture

**Feature-Based Organization**:
- `components/features/analysis/` - SEO analysis displays
- `components/features/audit/` - Professional audit interface
- `components/features/auth/` - Authentication components
- `components/ui/` - Radix UI design system

**Organized Hooks**:
- `hooks/api/` - API interaction patterns
- `hooks/auth/` - Authentication state
- `hooks/ui/` - UI state and interactions

**Clean Import Patterns**: Barrel exports for streamlined imports

### Database Design

**Domain Organization**: Schema files organized by business domain:
- `core.ts` - Users, sessions, API usage
- `projects.ts` - Analysis and project data
- `rival-audit.ts` - Professional audit schemas
- `crawling.ts` - Web crawling and CMS data

**User-Centric**: Multi-tenant data isolation via `users.id` foreign keys

**JSONB Storage**: Analysis results with Zod validation

**API Monitoring**: Comprehensive external API call tracking

## Environment Configuration

### Required Variables
```env
# Database (Required)
DATABASE_URL=postgresql://username:password@host:port/database

# OpenAI (Required for AI features)
OPENAI_API_KEY=sk-...
```

### Recommended Variables
```env
# DataForSEO (for enhanced keyword data)
DATAFORSEO_API_LOGIN=your_username
DATAFORSEO_API_PASSWORD=your_password

# Google APIs (for PageSpeed, Search data)
GOOGLE_API_KEY=your_google_api_key
GOOGLE_SEARCH_API_KEY=your_search_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
```

### Setup Process
1. `npm install`
2. Create `.env` with required variables
3. `npm run db:push` (initialize database)
4. `npm run dev` (start development)

## Key Files for Development

### Central Architecture
- `shared/schema/index.ts` - Barrel export for all domain schemas
- `server/index.ts` - Express server with middleware and routes
- `server/routes/index.ts` - Central route aggregation
- `client/src/App.tsx` - React app with routing and query setup

### Core Services
- `server/services/analysis/analyzer.service.ts` - Main SEO analysis engine
- `server/services/audit/crawler-orchestrator.service.ts` - Professional audit system
- `server/services/audit/enhanced-analyzer.service.ts` - 140+ factor analyzer
- `server/services/external/` - External API integrations

### Key Controllers
- `server/controllers/analysis.controller.ts` - SEO analysis endpoints
- `server/controllers/audit.controller.ts` - Professional audit endpoints
- `server/controllers/auth.controller.ts` - Authentication endpoints

### Essential Frontend
- `client/src/pages/Home.tsx` - Main SEO analysis interface
- `client/src/pages/RivalAuditPage.tsx` - Professional audit dashboard
- `client/src/components/SeoBuddy.tsx` - AI chatbot assistant

## Tech Stack

**Frontend**: React + TypeScript + Vite + Tailwind CSS + TanStack Query + Radix UI  
**Backend**: Express.js + TypeScript + Drizzle ORM + PostgreSQL  
**External APIs**: OpenAI, DataForSEO, Google APIs (PageSpeed, Search, Ads)  
**Key Libraries**: Cheerio (scraping), ExcelJS (exports), Zod (validation)

## Modular Architecture (2025 Refactoring)

### Transformation Results

**File Breakdown Success**:
- **Zero files over 1,250 lines** (was 7 monolithic files)
- **85%+ complexity reduction** through modularization
- **20+ focused services** with single responsibilities
- **100% backward compatibility** maintained

**Schema Organization**:
- Broke down 1,419-line monolithic schema into 9 domain files
- Maintained all existing functionality
- Clean import paths with barrel exports

**Service Modularization**:
- `crawler.service.ts`: 2,781 → 146 lines (orchestrator pattern)
- `enhanced-analyzer.service.ts`: 2,520 → 1,105 lines (dependency injection)
- Created 6 specialized crawling services
- Created 4 specialized analyzer services

### Core Preserved Features

**SEO Analysis Engine**: 50+ ranking factors with real-time scoring
**Professional Audit System**: 140+ factors for client deliverables  
**AI Assistant**: OpenAI-powered SEO guidance and recommendations
**Export Tools**: Excel/CSV generation for professional reports
**Authentication**: JWT-based user management with security features

### Development Benefits

1. **Maintainability**: Clear file responsibilities and boundaries
2. **Testability**: Isolated services with dependency injection
3. **Scalability**: Easy feature additions within domain structure  
4. **Developer Experience**: Intuitive organization and clean imports
5. **Performance**: Reduced bundle size and faster builds

### Implementation Patterns

**Dependency Injection**:
```typescript
// Services accept dependencies via constructor
const analyzer = new EnhancedAuditAnalyzer(
  contentAnalyzer,
  technicalAnalyzer,
  localAnalyzer,
  uxAnalyzer
);
```

**Domain Organization**:
```typescript
// Clean imports from organized domains
import { users, analyses } from '../shared/schema/core';
import { rivalAudits } from '../shared/schema/rival-audit';
```

**Service Composition**:
```typescript
// Orchestrator pattern for complex workflows
class CrawlerOrchestrator {
  constructor(
    private cmsDetection: CMSDetectionService,
    private contentSimilarity: ContentSimilarityService,
    // ... other specialized services
  ) {}
}
```

## Development Guidelines

### Adding New Features
1. Create services in appropriate domain directories
2. Use dependency injection for service composition
3. Add schema definitions in relevant domain files
4. Implement frontend components in feature directories
5. Follow the established patterns for imports and exports

### Service Principles
- **Single Responsibility**: Each service has one clear purpose
- **Dependency Injection**: Constructor-based dependencies
- **Interface Segregation**: Clean service boundaries
- **Domain Organization**: Group by business domain, not technical layer

### File Organization
- Domain-first organization over technical layers
- Barrel exports for clean import paths
- Consistent naming conventions across all layers
- Clear separation between presentation, business, and data layers

The codebase now represents a **modular architecture** built for maintainability, scalability, and developer productivity while preserving all core SEO analysis and audit functionality.