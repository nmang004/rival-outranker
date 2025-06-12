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

### 3. Core SEO Analysis (`/api/analysis`)
**File**: `server/routes/analysis.routes.ts`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/analysis/analyze` | Main SEO analysis | ❌ (enhanced with auth) |
| GET | `/api/analysis/:id` | Get analysis by ID | ❌ |
| POST | `/api/analysis/deep-content` | AI-powered content analysis | ❌ (enhanced with auth) |

### 4. Rival Audit System (`/api/audit`)
**File**: `server/routes/audit.routes.ts`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/audit/start` | Start rival audit crawl | ❌ (enhanced with auth) |
| GET | `/api/audit/:id` | Get audit status | ❌ |
| GET | `/api/audit/:id/results` | Get audit results | ❌ |
| GET | `/api/audit/:id/export/excel` | Export to Excel | ❌ |
| GET | `/api/audit/:id/export/csv` | Export to CSV | ❌ |
| PUT | `/api/audit/:id/update-item` | Update audit item status | ❌ |
| PUT | `/api/audit/:id/priority-status` | Update Priority OFI status | ❌ |

### 5. SEO Buddy Chatbot (`/api/chatbot`)
**File**: `server/routes/chatbot.routes.ts`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/chatbot/message` | Send message to SEO Buddy | ❌ (enhanced with auth) |
| GET | `/api/chatbot/history` | Get conversation history | ✅ |
| DELETE | `/api/chatbot/reset` | Reset conversation | ❌ |

### 6. Admin Dashboard (`/api/admin`)
**File**: `server/routes/admin.ts`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/usage-stats` | API usage statistics | ✅ Admin |
| GET | `/api/admin/users` | User management | ✅ Admin |
| GET | `/api/admin/analyses` | All analyses overview | ✅ Admin |
| GET | `/api/admin/system-health` | System health metrics | ✅ Admin |

### 7. Direct Admin Tools (`/api/direct-admin`)
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

### SEO Buddy Chatbot Request
```json
{
  "message": "How can I improve my website's SEO?",
  "conversation_id": "optional-uuid",
  "context": {
    "url": "https://example.com",
    "analysis_id": "optional-analysis-id"
  }
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

### Google APIs
- PageSpeed Insights
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
GET /api/audit/:id/stream
Content-Type: text/event-stream
```

### WebSocket Endpoints
Currently not implemented but planned for:
- Real-time audit updates
- Live chatbot features
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

**Last Updated**: December 12, 2025
**Total Endpoints**: 25+ endpoints across 7 route groups
**Authentication**: Optional for most, required for user features
**External APIs**: 2 major integrations with fallbacks (OpenAI, Google PageSpeed)