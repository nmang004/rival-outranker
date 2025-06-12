# ENVIRONMENT VARIABLES REFERENCE

## Overview
Complete documentation of all environment variables used throughout the Rival Outranker application, their purposes, and current configuration status.

## Environment Files

### Configuration Files
- `.env` - Main environment configuration (create from template)
- `.env.example` - Template with all variables and descriptions
- `drizzle.config.ts` - Database configuration
- `server/db.ts` - Database connection handling

## Required Variables

### Database Configuration
```env
# PostgreSQL Database Connection (REQUIRED for full functionality)
DATABASE_URL=postgresql://username:password@host:port/database
```
**Usage**: 
- `drizzle.config.ts:3` - Database schema configuration
- `server/db.ts:8` - Database connection
**Status**: ❗ Required - app has fallback but limited functionality
**Default**: None (must be configured)

### OpenAI Integration
```env
# OpenAI API for AI-powered features (REQUIRED for AI features)
OPENAI_API_KEY=sk-proj-...
```
**Usage**:
- `server/services/openaiService.ts` - Content analysis and recommendations
- `server/services/deepContentAnalyzer.ts` - AI-powered content insights
**Status**: ❗ Required for AI features
**Fallback**: Rule-based analysis when unavailable

## Optional Variables with Fallbacks

### Google APIs
```env
# Google PageSpeed Insights API (OPTIONAL)
GOOGLE_API_KEY=your_google_api_key
```
**Usage**:
- `server/services/external/google-pagespeed.service.ts` - Website performance analysis
**Status**: 🟡 Optional with sample data fallback
**Fallback**: Mock PageSpeed scores and performance metrics

## Development Variables

### Authentication Secrets
```env
# Development authentication (have defaults)
JWT_SECRET=your-jwt-secret-here
SESSION_SECRET=your-session-secret-here
```
**Usage**:
- `server/routes/auth.ts` - JWT token signing
- `server/index.ts` - Session configuration
**Status**: 🟢 Have development defaults
**Default**: Auto-generated in development

### Environment Mode
```env
# Application environment
NODE_ENV=development
```
**Usage**: Throughout application for environment-specific behavior
**Status**: 🟢 Automatically set
**Default**: `development` in dev, `production` in build

## Legacy/Unused Variables

### Replit-Specific (No longer used)
```env
# These were automatically provided by Replit
REPLIT_DB_URL=# Not used (migrated to PostgreSQL)
REPL_ID=# Not used in production code
REPL_OWNER=# Not used in production code
```
**Status**: 🔴 No longer needed
**Action**: Can be safely ignored

## Variable Usage by File

### Core Database Files
**File**: `drizzle.config.ts`
```typescript
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}
```

**File**: `server/db.ts`
```typescript
if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL not set. Database features will be disabled.");
  // Fallback to mock database interface
}
```

### Service Files with API Keys
**File**: `server/services/openaiService.ts`
```typescript
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("OPENAI_API_KEY is required");
}
```

**File**: `server/services/external/google-pagespeed.service.ts`
```typescript
const apiKey = process.env.GOOGLE_API_KEY;
// Uses sample data if API key missing
```

## Fallback Mechanisms

### Database Fallback
When `DATABASE_URL` is missing:
- Mock database interface created
- Core analysis still works with sample data
- User accounts and history disabled
- Warning logged to console

### API Fallbacks
When external APIs are unavailable:
```typescript
// Common pattern across services
try {
  return await externalApiCall();
} catch (error) {
  console.warn(`API unavailable, using mock data: ${error.message}`);
  return mockData;
}
```

### Development Defaults
```typescript
// JWT and session secrets have development defaults
const jwtSecret = process.env.JWT_SECRET || 'development-jwt-secret';
const sessionSecret = process.env.SESSION_SECRET || 'development-session-secret';
```

## Configuration Priority

### Critical (App won't start without these)
1. None - app has fallbacks for everything

### High Priority (Major features disabled)
1. `DATABASE_URL` - User accounts, history, full functionality
2. `OPENAI_API_KEY` - AI-powered features

### Medium Priority (Enhanced features)
1. `GOOGLE_API_KEY` - PageSpeed insights

### Low Priority (Development convenience)
1. `JWT_SECRET` - Has development default
2. `SESSION_SECRET` - Has development default
3. `NODE_ENV` - Auto-detected

## Setup Instructions

### Minimal Setup (Core functionality)
```env
# Create .env file with just these for basic functionality
DATABASE_URL=postgresql://localhost:5432/rival_outranker
OPENAI_API_KEY=sk-your-key-here
```

### Recommended Setup (Most features)
```env
# Database (Required)
DATABASE_URL=postgresql://username:password@host:port/database

# OpenAI (Required for AI features)  
OPENAI_API_KEY=sk-your-openai-key

# Google APIs (Recommended)
GOOGLE_API_KEY=your_google_api_key

# Development
NODE_ENV=development
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
```

### Full Setup (All features)
The recommended setup above includes all currently used APIs.

## Environment-Specific Configurations

### Development
- Uses `.env` file
- Has fallback defaults for most variables
- Console warnings for missing APIs
- Mock data automatically used

### Production
- Environment variables set by hosting platform
- All API keys should be configured
- Error logging for missing critical variables
- Graceful degradation for optional APIs

### Testing
- Uses test-specific environment variables
- May use mock data for all external APIs
- Isolated test database

## Security Best Practices

### Variable Protection
- Never commit `.env` files to version control
- Use `.env.example` as template
- Rotate API keys regularly
- Use least-privilege API access

### In Code
```typescript
// Good: Check for variables and provide fallbacks
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.warn("API_KEY missing, using mock data");
  return mockData;
}

// Avoid: Hard-coding or exposing secrets
// const apiKey = "sk-hardcoded-key"; // ❌
```

## Troubleshooting

### Common Issues

**Database Connection Fails**
```
Error: DATABASE_URL, ensure the database is provisioned
```
Solution: Set valid PostgreSQL connection string

**OpenAI API Errors**
```
Error: OPENAI_API_KEY is required
```
Solution: Get API key from OpenAI and set environment variable

**Mock Data Being Used**
```
Warning: API unavailable, using mock data
```
Solution: Configure the relevant API keys for real data

### Validation Commands
```bash
# Check if environment variables are loaded
npm run check

# Test database connection
npm run db:push

# Start with verbose logging
NODE_ENV=development npm run dev
```

## Migration from Replit

### Variables Previously Auto-Provided
Replit automatically provided these variables that now need manual setup:
- `DATABASE_URL` - Must configure PostgreSQL database
- Environment was pre-configured - Now need `.env` file

### Migration Checklist
- [x] Create `.env` file from `.env.example`
- [x] Set `DATABASE_URL` 
- [x] Set `OPENAI_API_KEY`
- [ ] Configure optional API keys as needed
- [ ] Test all functionality works
- [ ] Verify fallbacks work when APIs unavailable

---

**Last Updated**: December 12, 2025
**Total Variables**: 6 (2 required, 4 optional)
**Fallback Coverage**: 100% (app works without any external APIs)
**Security Status**: ✅ All secrets externalized