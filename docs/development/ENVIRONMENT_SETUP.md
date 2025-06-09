# Environment Setup Guide

Complete guide for setting up Rival Outranker in different environments.

## Table of Contents

- [Quick Start](#quick-start)
- [Environment Overview](#environment-overview)
- [Local Development Setup](#local-development-setup)
- [Staging Environment Setup](#staging-environment-setup)
- [Production Environment Setup](#production-environment-setup)
- [Security Guidelines](#security-guidelines)
- [API Setup Guides](#api-setup-guides)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Minimal Setup (Core Features Only)

```bash
# 1. Copy environment template
cp .env.local.example .env

# 2. Set up local database
docker run --name rival-outranker-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=rival_outranker \
  -p 5432:5432 -d postgres:15

# 3. Update .env with database URL
echo "DATABASE_URL=postgresql://postgres:password@localhost:5432/rival_outranker" >> .env

# 4. Install dependencies and setup database
npm install
npm run db:push

# 5. Start development server
npm run dev
```

### Full Featured Setup

Add these to your `.env` file for enhanced features:

```bash
# For AI-powered content analysis
OPENAI_API_KEY=sk-proj-your-openai-key

# For real keyword data
DATAFORSEO_API_LOGIN=your_username
DATAFORSEO_API_PASSWORD=your_password

# For real PageSpeed data
GOOGLE_API_KEY=your_google_api_key
```

## Environment Overview

### Environment Types

| Environment | Purpose | API Keys | Database | Security |
|------------|---------|----------|----------|----------|
| **Local Development** | Development and testing | Optional/Mock | Local PostgreSQL | Minimal |
| **Staging** | Pre-production testing | Test/Limited | Cloud Database | Medium |
| **Production** | Live application | Production | Managed Database | Maximum |

### Feature Availability by Setup

| Feature | No API Keys | Basic APIs | Full APIs |
|---------|-------------|------------|-----------|
| SEO Analysis | ✅ Mock data | ✅ Real data | ✅ Full features |
| Keyword Research | ✅ Sample data | ✅ Limited data | ✅ Real-time data |
| AI Content Analysis | ❌ Disabled | ✅ Basic | ✅ Advanced |
| Competitor Analysis | ✅ Mock data | ✅ Real data | ✅ Full features |
| User Accounts | Requires DATABASE_URL | ✅ Full | ✅ Full |
| PDF/Excel Export | ✅ Available | ✅ Available | ✅ Available |

## Local Development Setup

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+ (or Docker)
- Git

### Step-by-Step Setup

#### 1. Clone and Install

```bash
git clone https://github.com/your-username/rival-outranker.git
cd rival-outranker
npm install
```

#### 2. Database Setup

**Option A: Docker (Recommended)**
```bash
docker run --name rival-outranker-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=rival_outranker \
  -p 5432:5432 -d postgres:15
```

**Option B: Local PostgreSQL Installation**
```bash
# macOS with Homebrew
brew install postgresql@15
brew services start postgresql@15
createdb rival_outranker

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-15
sudo -u postgres createdb rival_outranker
```

#### 3. Environment Configuration

```bash
# Copy local development template
cp .env.local.example .env

# Edit .env file with your settings
vim .env  # or your preferred editor
```

**Minimum Required Variables:**
```bash
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/rival_outranker
```

#### 4. Database Schema Setup

```bash
# Push database schema
npm run db:push

# Verify database connection
npm run check:db
```

#### 5. Start Development Server

```bash
# Start both frontend and backend
npm run dev

# Or start separately
npm run dev:client    # Frontend on http://localhost:5173
npm run dev:server    # Backend on http://localhost:5001
```

### Development Tools

```bash
# Type checking
npm run check

# Database management
npm run db:push      # Push schema changes
npm run db:pull      # Pull schema from database
npm run db:studio    # Open Drizzle Studio

# Environment validation
npm run check:env    # Validate environment variables
```

## Staging Environment Setup

### Railway Deployment

#### 1. Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway init
```

#### 2. Add PostgreSQL Database

```bash
# Add PostgreSQL plugin
railway add postgresql

# Get database URL
railway variables
```

#### 3. Configure Environment Variables

In Railway dashboard, add these variables:

```bash
NODE_ENV=staging
FRONTEND_URL=https://staging-rival-outranker.netlify.app
JWT_SECRET=staging_jwt_secret_generate_secure_random_string
SESSION_SECRET=staging_session_secret_generate_different_random_string

# Optional: Add test API keys
OPENAI_API_KEY=sk-proj-staging-key
DATAFORSEO_API_LOGIN=staging_username
DATAFORSEO_API_PASSWORD=staging_password
```

#### 4. Deploy to Railway

```bash
# Deploy from current directory
railway up

# Or connect GitHub repository
railway connect
```

### Netlify Frontend Deployment

#### 1. Connect Repository

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "New site from Git"
3. Connect your repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

#### 2. Environment Variables

Add in Netlify dashboard:

```bash
VITE_API_URL=https://your-railway-app.railway.app
VITE_ENVIRONMENT=staging
```

#### 3. Configure Redirects

Netlify automatically uses `config/netlify.toml` for redirects.

## Production Environment Setup

### Platform Recommendations

| Platform | Best For | Pros | Cons |
|----------|----------|------|------|
| **Railway** | Full-stack apps | Easy setup, managed DB | Limited customization |
| **Vercel** | Frontend + Serverless | Great performance | Function limits |
| **AWS** | Enterprise | Full control | Complex setup |
| **DigitalOcean** | Balanced | Good value | Manual setup |

### Production Deployment Checklist

#### Pre-Deployment Security

- [ ] Generate cryptographically secure secrets
- [ ] Review all environment variables
- [ ] Set up SSL certificates
- [ ] Configure proper CORS origins
- [ ] Set up error monitoring
- [ ] Configure database backups

#### Generate Secure Secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate session secret  
openssl rand -base64 32

# Generate API keys rotation schedule
```

#### Production Environment Variables

Copy `.env.production.example` and configure:

```bash
NODE_ENV=production
API_BASE_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
DATABASE_URL=postgresql://user:pass@prod-db.com:5432/db
JWT_SECRET=YOUR_CRYPTOGRAPHICALLY_SECURE_SECRET
SESSION_SECRET=YOUR_DIFFERENT_SECURE_SECRET
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

#### Post-Deployment Verification

- [ ] Test user registration/login
- [ ] Verify SEO analysis works
- [ ] Test PDF/Excel exports
- [ ] Check error monitoring
- [ ] Verify all API integrations
- [ ] Performance testing
- [ ] Security scanning

## Security Guidelines

### Environment Variable Security

#### Development
- Use placeholder values in `.env.example`
- Never commit real secrets to Git
- Use different secrets for each environment

#### Staging
- Use test/limited API keys
- Mirror production security settings
- Separate database from production

#### Production
- Use cryptographically secure secrets (min 32 chars)
- Implement secret rotation schedule
- Use managed secret services when available
- Monitor access to environment variables

### Secret Generation

```bash
# JWT Secret (32 chars minimum)
openssl rand -base64 32

# Session Secret (different from JWT)
openssl rand -base64 32

# Database Password (complex)
openssl rand -base64 24 | tr '+/' '-_'

# API Key Rotation
# Set up quarterly rotation for all production secrets
```

### Access Control

1. **Principle of Least Privilege**
   - Only grant necessary permissions
   - Separate dev/staging/prod access
   - Use service accounts for automation

2. **Secret Storage**
   - Use platform secret management (Railway Variables, AWS Secrets Manager)
   - Never store secrets in code or logs
   - Implement secret rotation

3. **Monitoring**
   - Monitor authentication failures
   - Track API usage and costs
   - Set up alerts for unusual activity

## API Setup Guides

### OpenAI API Setup

1. **Get API Key**
   - Go to [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create new secret key
   - Set usage limits

2. **Configure in Environment**
   ```bash
   OPENAI_API_KEY=sk-proj-your-api-key
   OPENAI_MODEL=gpt-3.5-turbo
   OPENAI_MAX_TOKENS=2000
   ```

3. **Monitor Costs**
   - Set up billing alerts
   - Monitor token usage
   - Implement rate limiting

### DataForSEO API Setup

1. **Create Account**
   - Sign up at [DataForSEO](https://dataforseo.com/)
   - Choose appropriate plan
   - Get credentials

2. **Configure in Environment**
   ```bash
   DATAFORSEO_API_LOGIN=your_username
   DATAFORSEO_API_PASSWORD=your_password
   ```

3. **Test Connection**
   ```bash
   npm run test:dataforseo
   ```

### Google APIs Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project
   - Enable required APIs

2. **Required APIs**
   - PageSpeed Insights API
   - Custom Search JSON API
   - Google Ads API (optional)

3. **Get API Keys**
   - Go to Credentials section
   - Create API key
   - Restrict key to specific APIs

4. **Configure in Environment**
   ```bash
   GOOGLE_API_KEY=your_google_api_key
   GOOGLE_SEARCH_API_KEY=your_search_key
   GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
   ```

### Database Setup

#### Local Development
```bash
# PostgreSQL with Docker
docker run --name rival-outranker-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=rival_outranker \
  -p 5432:5432 -d postgres:15

# Update .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/rival_outranker
```

#### Production Options

**Railway PostgreSQL**
- Automatically configured
- Managed backups
- SSL enabled

**AWS RDS**
```bash
# Example connection string
DATABASE_URL=postgresql://username:password@rds-endpoint.region.rds.amazonaws.com:5432/dbname
```

**DigitalOcean Managed Database**
```bash
# Example connection string  
DATABASE_URL=postgresql://username:password@db-cluster.db.ondigitalocean.com:25060/dbname?sslmode=require
```

## Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check if PostgreSQL is running
docker ps  # Look for postgres container

# Check connection string format
# Correct: postgresql://user:pass@host:port/db
# Wrong: postgres://user:pass@host:port/db (missing 'ql')

# Test connection
psql "postgresql://postgres:password@localhost:5432/rival_outranker"
```

#### OpenAI API Errors
```bash
# Check API key format
echo $OPENAI_API_KEY | cut -c1-7  # Should show: sk-proj

# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Check quota and billing
# Visit: https://platform.openai.com/usage
```

#### CORS Errors
```bash
# Check CORS_ORIGIN setting
echo $CORS_ORIGIN

# Should include your frontend URL
CORS_ORIGIN=http://localhost:5173,https://yourdomain.com

# Clear browser cache and retry
```

#### Rate Limiting Issues
```bash
# Check rate limit settings
echo $RATE_LIMIT_MAX_REQUESTS
echo $RATE_LIMIT_WINDOW_MS

# Increase limits for development
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=60000
```

### Environment Validation

```bash
# Check all environment variables
npm run check:env

# Test database connection
npm run check:db

# Test API connections
npm run check:apis

# Validate configuration
npm run validate:config
```

### Logging and Debugging

```bash
# Enable debug mode
DEBUG_MODE=true
LOG_LEVEL=debug

# Check logs
npm run logs

# Monitor API usage
npm run monitor:apis
```

### Performance Issues

```bash
# Database query optimization
DEBUG_DATABASE_QUERIES=true

# Monitor API response times
ENABLE_REQUEST_LOGGING=true

# Check memory usage
node --inspect server/index.js
```

## Environment Migration

### From Replit to Railway

1. **Export Data**
   ```bash
   # Export database
   npm run export:db

   # Export environment variables
   npm run export:env
   ```

2. **Set Up Railway**
   ```bash
   railway init
   railway add postgresql
   ```

3. **Import Data**
   ```bash
   # Import database
   npm run import:db

   # Set environment variables in Railway dashboard
   ```

### Environment Sync

```bash
# Compare environments
npm run env:compare staging production

# Sync non-sensitive variables
npm run env:sync --from staging --to production --exclude secrets
```

## Best Practices

### Development
- Use `.env.local.example` template
- Never commit `.env` files
- Use Docker for consistent database setup
- Enable debug logging
- Use mock APIs for faster development

### Staging
- Mirror production security settings
- Use separate API keys/accounts
- Test all integrations
- Automate deployment from Git

### Production
- Use managed services (database, monitoring)
- Implement comprehensive monitoring
- Set up automated backups
- Use CDN for static assets
- Implement proper error handling
- Regular security audits

### Monitoring
- Set up error tracking (Sentry)
- Monitor API usage and costs
- Track performance metrics
- Set up uptime monitoring
- Implement log aggregation

### Security
- Regular secret rotation
- Implement least privilege access
- Monitor authentication failures
- Use HTTPS everywhere
- Regular security scans
- Keep dependencies updated

## Support

For additional help:

1. Check existing documentation in `docs/`
2. Review error logs with `npm run logs`
3. Test individual components with `npm run test`
4. Validate environment with `npm run check:env`

### Common Commands

```bash
# Development
npm run dev              # Start development server
npm run check           # Type checking
npm run db:push         # Push database schema

# Environment
npm run check:env       # Validate environment variables
npm run check:db        # Test database connection
npm run check:apis      # Test API connections

# Production
npm run build          # Build for production
npm run start          # Start production server
npm run monitor        # Monitor application
```