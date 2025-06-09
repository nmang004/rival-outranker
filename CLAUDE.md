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

### Development Workflow
- Development server runs both frontend (Vite on client/) and backend (Express on server/) concurrently
- Frontend builds to `dist/public/` directory
- Backend uses ESBuild for TypeScript compilation
- Database migrations handled via Drizzle Kit

## Architecture Overview

Rival Outranker is a full-stack SEO analysis platform with a React frontend, Express backend, and PostgreSQL database.

### Key Architectural Patterns

**Monorepo Structure**: Single repository with separate client/server directories sharing types via `shared/schema.ts`

**API Design**: RESTful Express.js API with optional authentication - many endpoints work without login for public access, authenticated endpoints provide enhanced features and history tracking

**Database Pattern**: Drizzle ORM with Zod validation schemas that serve dual purpose:
- Runtime validation for API endpoints
- Type generation for TypeScript interfaces
- Database schema definition

**State Management**: TanStack Query on frontend for server state caching, no global client state management

**Authentication**: Dual auth system:
- Primary: Replit Auth for hosted deployment
- Fallback: JWT with Passport.js for local development

### Core Service Architecture

**Layered Architecture**: The application follows a clean layered architecture with clear separation of concerns:
- **Controllers** (`server/controllers/`): Handle HTTP requests/responses only
- **Services** (`server/services/`): Contain business logic, organized by domain
- **Repositories** (`server/repositories/`): Handle data access abstraction
- **Models/Schemas** (`shared/schema.ts`): Define data structures and validation

**Analysis Engine (`server/services/analysis/analyzer.service.ts`)**: Central SEO analysis orchestrator that coordinates multiple specialized analyzers:
- Fetches website content via Cheerio
- Runs parallel analysis modules (keyword, meta, content, technical)
- Aggregates results into unified score and recommendations

**Rival Audit System (`server/services/audit/rival-audit-crawler.service.ts`)**: Sophisticated website crawler for professional audits:
- Multi-page crawling with intelligent page type detection
- Real-time progress updates via server-sent events pattern
- Excel/CSV export generation for client delivery

**AI Integration (`server/services/analysis/content-analyzer.service.ts`)**: OpenAI-powered content analysis:
- Section-by-section content evaluation
- GPT-generated improvement recommendations
- Fallback to rule-based analysis when API unavailable

**External API Services** (`server/services/external/`): All external API calls wrapped in organized service classes:
- OpenAI, DataForSEO, Google APIs, PageSpeed services
- Usage tracking and cost estimation
- Automatic fallback to sample data when APIs fail
- Rate limiting and error handling

### Frontend Architecture

**Feature-Based Component Organization**:
- `components/ui/` - Radix UI-based design system components
- `components/features/analysis/` - SEO analysis result displays
- `components/features/audit/` - Professional audit dashboard
- `components/features/keywords/` - Keyword research and rank tracking
- `components/features/backlinks/` - Backlink analysis components
- `components/features/learning/` - Educational content system
- `components/features/auth/` - Authentication components

**Organized Hooks Structure**:
- `hooks/api/` - API interaction hooks
- `hooks/auth/` - Authentication hooks
- `hooks/ui/` - UI state and interaction hooks

**Page-Level Components**: Each major feature has dedicated page component in `pages/` that orchestrates multiple sub-components

**Data Flow**: API calls via React Query → cached results → component props → UI updates

### Database Design Patterns

**User-Centric**: Most tables link to `users.id` for multi-tenant data isolation

**Analysis Storage**: SEO results stored as JSONB in `analyses.results` with Zod schema validation

**Progress Tracking**: Separate tables for user learning progress, keyword rankings, backlink history

**API Usage Monitoring**: Comprehensive tracking table for all external API calls with cost estimation

### External API Integration Strategy

**Graceful Degradation**: Application functions with core features even when external APIs are unavailable

**Sample Data Fallbacks**: Realistic sample responses for development and when APIs fail

**Usage Tracking**: All API calls logged with metadata for cost monitoring and optimization

### Key Implementation Details

**File Upload Handling**: 50MB limit for PDF uploads, client-side OCR processing with Tesseract.js

**Real-time Updates**: Server-sent events for long-running analysis tasks (rival audits, deep content analysis)

**Export System**: Multiple export formats (PDF, Excel, CSV) with jsPDF and ExcelJS libraries

**Learning System**: Gamified educational content with achievement tracking and sound effects

## Environment Configuration

### Required Environment Variables
```env
# Database (Required)
DATABASE_URL=postgresql://username:password@host:port/database

# OpenAI (Required for AI features)
OPENAI_API_KEY=sk-...

# DataForSEO (Recommended for keyword research)
DATAFORSEO_API_LOGIN=your_username
DATAFORSEO_API_PASSWORD=your_password

# Google APIs (Optional but recommended)
GOOGLE_API_KEY=your_google_api_key
GOOGLE_SEARCH_API_KEY=your_search_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
```

### Optional Configuration
- Google Ads API variables (uses sample data if missing)
- JWT_SECRET/SESSION_SECRET (have development defaults)
- Replit-specific variables (only for Replit deployment)

### Setup Process
1. `npm install`
2. Create `.env` with required variables (see REPLIT_TRANSFER_GUIDE.md for details)
3. `npm run db:push` (sets up database schema)
4. `npm run dev` (starts development server)

### Post-Replit Transfer Notes
- ✅ Core SEO analysis and Rival Audit tools are fully functional
- ⚠️ Requires manual environment variable setup (DATABASE_URL, API keys)  
- 🔧 Enhanced error logging added for troubleshooting
- 📖 See REPLIT_TRANSFER_GUIDE.md for complete setup instructions

## Key Files for Development

### Central Architecture Files
- `shared/schema.ts` - Database schema + Zod validation (shared between client/server)
- `server/index.ts` - Express server setup with middleware and route mounting
- `server/routes.ts` - Central route aggregation
- `client/src/App.tsx` - React app with routing and query client setup

### Core Business Logic (New Organized Structure)
- `server/controllers/` - HTTP request handlers with clean separation from business logic
- `server/services/analysis/` - SEO analysis services (analyzer, keyword analyzer, content analyzer, etc.)
- `server/services/audit/` - Professional audit system and crawling services
- `server/services/external/` - External API integrations (OpenAI, DataForSEO, Google APIs)
- `server/services/auth/` - Authentication and user management services
- `server/services/keywords/` - Keyword research and tracking services
- `server/services/backlinks/` - Backlink analysis services
- `server/services/common/` - Shared utilities (exports, admin, API usage tracking)
- `server/repositories/` - Data access layer abstraction

### API Routes by Feature
- `server/routes/keywords.ts` - Keyword research and rank tracking
- `server/routes/backlinks.ts` - Backlink analysis and monitoring  
- `server/routes/admin.ts` - Admin dashboard and API usage monitoring
- `server/routes/auth.ts` - User authentication and registration

### Frontend Pages
- `client/src/pages/Home.tsx` - Main SEO analysis dashboard
- `client/src/pages/RivalAuditPage.tsx` - Professional audit interface
- `client/src/pages/KeywordResearch.tsx` - Keyword research tools
- `client/src/pages/LearningPathsPage.tsx` - Educational content system

## Tech Stack Summary

**Frontend**: React + TypeScript + Vite + Tailwind CSS + TanStack Query + Radix UI  
**Backend**: Express.js + TypeScript + Drizzle ORM + PostgreSQL  
**External APIs**: OpenAI, DataForSEO, Google APIs (PageSpeed, Search, Ads)  
**Key Libraries**: Cheerio (web scraping), jsPDF (exports), Tesseract.js (OCR)

## Architecture Refactoring (2025)

The codebase has been completely restructured following industry best practices for improved maintainability, scalability, and developer experience.

### Key Improvements Made

**Backend Reorganization**:
- ✅ Implemented layered architecture (Controllers → Services → Repositories)
- ✅ Organized services by domain (analysis, audit, external, auth, keywords, backlinks, common)
- ✅ Extracted controllers from route files for clean separation of concerns
- ✅ Moved existing repositories and factories to organized structure
- ✅ Updated all service imports across the codebase

**Frontend Reorganization**:
- ✅ Reorganized components by feature domain instead of type
- ✅ Organized hooks by category (api, auth, ui)
- ✅ Created barrel exports for clean import paths
- ✅ Updated all component and hook imports across pages and components

**Shared Code Improvements**:
- ✅ Expanded shared structure with organized types, constants, and utilities
- ✅ Maintained backward compatibility with existing schema exports

### Benefits Achieved

1. **Improved Maintainability**: Clear responsibility for each file and directory
2. **Better Scalability**: Easy to add new features within organized domains
3. **Enhanced Developer Experience**: Intuitive file organization and clean import paths
4. **Separation of Concerns**: Clear boundaries between presentation, business logic, and data layers
5. **Code Reusability**: Shared utilities and consistent patterns across features

### Migration Impact

- **Zero Breaking Changes**: All functionality preserved during restructuring
- **Clean Import Paths**: All imports updated to use new organized structure
- **Type Safety Maintained**: Full TypeScript compatibility throughout
- **Build Success**: Application builds and runs without issues

The new structure follows the proposed architecture in `NEW_STRUCTURE.md` and significantly improves the codebase organization while maintaining full backward compatibility.