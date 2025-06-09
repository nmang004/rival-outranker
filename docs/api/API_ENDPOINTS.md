# API ENDPOINTS DOCUMENTATION

## Overview
Complete documentation of all API endpoints, routes, and their functionality in the Rival Outranker application.

## Base URL Structure
- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Authentication
- **Optional Auth**: Many endpoints work without authentication (public access)
- **Enhanced Features**: Authenticated users get history tracking and extended features
- **Auth Methods**: Replit Auth (primary) + JWT/Passport.js (fallback)

## Route Organization

### 1. Authentication Routes (`/api/auth`)
**File**: `server/routes/auth.ts`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/auth/user` | Get current user info | ✅ |
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | User login | ❌ |
| POST | `/api/auth/logout` | User logout | ✅ |
| PUT | `/api/auth/change-password` | Change password | ✅ |

### 2. User Management (`/api/user`)
**File**: `server/routes/user.ts`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/user/profile` | Get user profile | ✅ |
| PUT | `/api/user/profile` | Update user profile | ✅ |
| GET | `/api/user/analyses` | Get user analysis history | ✅ |
| DELETE | `/api/user/analyses/:id` | Delete analysis | ✅ |

### 3. Core SEO Analysis (`/api/analyze`)
**File**: `server/routes.ts` (main routes)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/analyze` | Main SEO analysis | ❌ (enhanced with auth) |
| GET | `/api/analyze/:id` | Get analysis by ID | ❌ |
| POST | `/api/competitor-analysis` | Competitor analysis | ❌ (enhanced with auth) |
| POST | `/api/deep-content-analysis` | AI-powered content analysis | ❌ (enhanced with auth) |

### 4. Rival Audit System (`/api/rival-audit`)
**File**: `server/routes.ts` (main routes)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/rival-audit` | Start rival audit crawl | ❌ (enhanced with auth) |
| GET | `/api/rival-audit/:id` | Get audit status | ❌ |
| GET | `/api/rival-audit/:id/results` | Get audit results | ❌ |
| GET | `/api/rival-audit/:id/export/excel` | Export to Excel | ❌ |
| GET | `/api/rival-audit/:id/export/csv` | Export to CSV | ❌ |
| PUT | `/api/rival-audit/:id/status` | Update audit status | ❌ |

### 5. Keyword Research (`/api/keywords`)
**File**: `server/routes/keywords.ts`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/keywords/research` | Keyword research & suggestions | ❌ (enhanced with auth) |
| POST | `/api/keywords/suggestions` | Get keyword suggestions | ❌ |
| GET | `/api/keywords/user-keywords` | Get user's tracked keywords | ✅ |
| POST | `/api/keywords/track` | Start tracking keyword | ✅ |
| DELETE | `/api/keywords/:id` | Stop tracking keyword | ✅ |
| GET | `/api/keywords/:id/rankings` | Get keyword rankings history | ✅ |
| PUT | `/api/keywords/:id` | Update keyword settings | ✅ |

### 6. Backlink Analysis (`/api/backlinks`)
**File**: `server/routes/backlinks.ts`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/backlinks/analyze` | Analyze backlinks | ❌ (enhanced with auth) |
| GET | `/api/backlinks/user-domains` | Get user's tracked domains | ✅ |
| POST | `/api/backlinks/track` | Track domain backlinks | ✅ |
| DELETE | `/api/backlinks/:id` | Stop tracking domain | ✅ |
| GET | `/api/backlinks/:id/history` | Get backlink history | ✅ |

### 7. Admin Dashboard (`/api/admin`)
**File**: `server/routes/admin.ts`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/usage-stats` | API usage statistics | ✅ Admin |
| GET | `/api/admin/users` | User management | ✅ Admin |
| GET | `/api/admin/analyses` | All analyses overview | ✅ Admin |
| GET | `/api/admin/system-health` | System health metrics | ✅ Admin |

### 8. Google Ads Integration (`/api/google-ads`)
**File**: `server/routes/googleAdsAuth.ts`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/google-ads/auth` | Start Google Ads OAuth | ✅ |
| GET | `/api/google-ads/callback` | OAuth callback | ❌ |
| GET | `/api/google-ads/status` | Check auth status | ✅ |
| POST | `/api/google-ads/keywords` | Get keyword data | ✅ |
| DELETE | `/api/google-ads/auth` | Revoke access | ✅ |

### 9. PageSpeed Analysis (`/api/pagespeed`)
**File**: `server/routes/pagespeed.ts`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/pagespeed/analyze` | PageSpeed analysis | ❌ (enhanced with auth) |
| GET | `/api/pagespeed/:id` | Get PageSpeed results | ❌ |

### 10. Learning System (`/api/learning`)
**Files**: `server/routes/learningPath.ts`, `server/routes/learningPathRouter.ts`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/learning/paths` | Get learning paths | ❌ |
| GET | `/api/learning/modules` | Get learning modules | ❌ |
| GET | `/api/learning/modules/:id` | Get module details | ❌ |
| GET | `/api/learning/lessons/:id` | Get lesson content | ❌ |
| POST | `/api/learning/progress` | Update progress | ✅ |
| GET | `/api/learning/user-progress` | Get user progress | ✅ |

### 11. PDF Analysis (`/api/pdf`)
**File**: `server/routes/pdfAnalyzerRoutes.ts`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/pdf/upload` | Upload and analyze PDF | ❌ (enhanced with auth) |
| GET | `/api/pdf/:id/results` | Get PDF analysis results | ❌ |
| POST | `/api/pdf/extract-text` | Extract text from PDF | ❌ |

### 12. Direct Admin Tools (`/api/direct-admin`)
**File**: `server/routes/directAdmin.ts`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/direct-admin/stats` | Direct admin statistics | ✅ Admin |
| POST | `/api/direct-admin/actions` | Admin actions | ✅ Admin |

## Serverless Functions (Netlify)

### Netlify Functions (`/.netlify/functions/`)
**Files**: `netlify/functions/*.ts`

| Function | Description | Auth Required |
|----------|-------------|---------------|
| `analyze` | Main SEO analysis function | ❌ |
| `competitor-analysis` | Competitor analysis function | ❌ |
| `keyword-research` | Keyword research function | ❌ |
| `auth-user` | User authentication function | ❌ |

## Request/Response Formats

### Standard Response Format
```json
{
  "success": boolean,
  "data": any,
  "message": string,
  "error": string | null,
  "timestamp": string
}
```

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {},
  "timestamp": "2025-12-08T10:00:00Z"
}
```

## Common Request Patterns

### SEO Analysis Request
```json
{
  "url": "https://example.com",
  "options": {
    "includeCompetitor": boolean,
    "deepAnalysis": boolean
  }
}
```

### Keyword Research Request
```json
{
  "seed_keyword": "seo tools",
  "location": "US",
  "language": "en",
  "limit": 50
}
```

### Rival Audit Request
```json
{
  "url": "https://example.com",
  "options": {
    "maxPages": 50,
    "includeImages": true,
    "checkBrokenLinks": true
  }
}
```

## Authentication Flow

### 1. Optional Authentication
Most endpoints work without authentication but provide enhanced features for authenticated users:

```javascript
// Without auth: Basic analysis
// With auth: Analysis + history saving + enhanced features
```

### 2. Admin Endpoints
Admin endpoints require both authentication and admin role:

```javascript
middleware: [authenticate, requireAdmin]
```

### 3. Session Management
Sessions stored in PostgreSQL with Express sessions:

```javascript
// Session configuration
store: new PostgreSQLStore({
  pool: db,
  tableName: 'sessions'
})
```

## Rate Limiting and Usage Tracking

### API Usage Tracking
All endpoints are tracked in the `api_usage` table:

```sql
INSERT INTO api_usage (
  user_id, endpoint, method, status_code,
  response_time, api_provider, estimated_cost
) VALUES (...)
```

### Rate Limiting
- **Anonymous users**: Basic rate limiting
- **Authenticated users**: Higher limits
- **Admin users**: No limits

## External API Integration

### DataForSEO Endpoints
- Keyword research
- SERP analysis
- Competitor data
- **Fallback**: Mock data when API unavailable

### Google APIs
- PageSpeed Insights
- Search Console data
- Ads API integration
- **Fallback**: Sample data when API unavailable

### OpenAI Integration
- Content analysis
- Recommendation generation
- **Fallback**: Rule-based analysis when API unavailable

## Real-time Features

### Server-Sent Events (SSE)
For long-running operations:

```javascript
// Rival audit progress updates
GET /api/rival-audit/:id/stream
Content-Type: text/event-stream
```

### WebSocket Endpoints
Currently not implemented but planned for:
- Real-time crawling updates
- Live chat features
- Collaborative audit sessions

## Error Handling

### Standard Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error
- `502` - Bad Gateway (external API failure)
- `503` - Service Unavailable (maintenance mode)

### Graceful Degradation
When external APIs fail:
1. Log the error
2. Return mock/sample data
3. Notify user of limited functionality
4. Continue with core features

## Security Considerations

### Input Validation
All endpoints use Zod schemas for validation:

```typescript
const urlSchema = z.object({
  url: z.string().url(),
  options: z.object({...}).optional()
});
```

### CORS Configuration
```typescript
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
```

### Session Security
- Secure cookies in production
- Session expiration
- CSRF protection (where applicable)

## Performance Optimization

### Caching Strategy
- In-memory caching for frequently accessed data
- Database query optimization
- CDN for static assets

### Response Compression
```typescript
app.use(compression());
```

### Database Connection Pooling
```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20
});
```

## Monitoring and Logging

### API Usage Analytics
- Request/response times
- Success/error rates
- User activity patterns
- Cost estimation per API call

### Health Check Endpoints
```
GET /api/health - Basic health check
GET /api/admin/system-health - Detailed system metrics
```

---

**Last Updated**: December 8, 2025
**Total Endpoints**: 50+ endpoints across 12 route groups
**Authentication**: Optional for most, required for user features
**External APIs**: 4 major integrations with fallbacks