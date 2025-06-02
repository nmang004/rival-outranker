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

**Analysis Engine (`server/services/analyzer.ts`)**: Central SEO analysis orchestrator that coordinates multiple specialized analyzers:
- Fetches website content via Cheerio
- Runs parallel analysis modules (keyword, meta, content, technical)
- Aggregates results into unified score and recommendations

**Rival Audit System (`server/services/rivalAuditCrawler.ts`)**: Sophisticated website crawler for professional audits:
- Multi-page crawling with intelligent page type detection
- Real-time progress updates via server-sent events pattern
- Excel/CSV export generation for client delivery

**AI Integration (`server/services/deepContentAnalyzer.ts`)**: OpenAI-powered content analysis:
- Section-by-section content evaluation
- GPT-generated improvement recommendations
- Fallback to rule-based analysis when API unavailable

**API Service Layer**: All external API calls (DataForSEO, Google APIs, OpenAI) wrapped in service classes with:
- Usage tracking and cost estimation
- Automatic fallback to sample data when APIs fail
- Rate limiting and error handling

### Frontend Architecture

**Component Organization**:
- `components/ui/` - Radix UI-based design system components
- `components/assessment/` - SEO analysis result displays
- `components/rival/` - Professional audit dashboard
- `components/learning/` - Educational content system

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
2. Create `.env` with required variables
3. `npm run db:push` (sets up database schema)
4. `npm run dev` (starts development server)

## Key Files for Development

### Central Architecture Files
- `shared/schema.ts` - Database schema + Zod validation (shared between client/server)
- `server/index.ts` - Express server setup with middleware and route mounting
- `server/routes.ts` - Central route aggregation
- `client/src/App.tsx` - React app with routing and query client setup

### Core Business Logic
- `server/services/analyzer.ts` - Main SEO analysis engine (orchestrates all analyzers)
- `server/services/rivalAuditCrawler.ts` - Professional audit system with crawling
- `server/services/deepContentAnalyzer.ts` - AI-powered content analysis
- `server/services/dataForSeoService.ts` - External API integration with fallbacks

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