# Railway Deployment Setup Guide

## Overview

This guide provides step-by-step instructions for deploying Rival Outranker to Railway, a modern application deployment platform. Railway provides seamless PostgreSQL database hosting, automatic deployments, and excellent developer experience.

## Prerequisites

- Node.js 18+ installed locally
- Railway CLI installed
- Git repository with your code
- Railway account (free tier available)

## Step 1: Install and Setup Railway CLI

### Install Railway CLI
```bash
# Using npm
npm install -g @railway/cli

# Using curl (macOS/Linux)
curl -fsSL https://railway.app/install.sh | sh

# Using homebrew (macOS)
brew install railway
```

### Authenticate with Railway
```bash
railway login
```

This opens your browser for authentication. Complete the OAuth flow.

## Step 2: Create Railway Project

### Initialize Railway Project
```bash
# In your project directory
railway init

# Follow the prompts:
# - Project name: "rival-outranker" or your preferred name
# - Template: "Empty Project" (we'll configure manually)
```

### Alternative: Create from Railway Dashboard
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Connect your GitHub repository

## Step 3: Database Setup

### Add PostgreSQL Service
```bash
# Add PostgreSQL to your project
railway add --database postgres

# This provisions a PostgreSQL database and sets DATABASE_URL automatically
```

### Verify Database Connection
```bash
# Check your environment variables
railway variables

# You should see DATABASE_URL listed
```

## Step 4: Environment Variables Configuration

### Required Environment Variables
```bash
# Core application variables
railway variables set NODE_ENV=production
railway variables set PORT=3000

# Database (automatically set when you add PostgreSQL)
# DATABASE_URL is automatically configured

# API Keys (replace with your actual keys)
railway variables set OPENAI_API_KEY=sk-your-openai-key
railway variables set DATAFORSEO_API_LOGIN=your-dataforseo-login
railway variables set DATAFORSEO_API_PASSWORD=your-dataforseo-password

# Google APIs
railway variables set GOOGLE_API_KEY=your-google-api-key
railway variables set GOOGLE_SEARCH_API_KEY=your-google-search-key
railway variables set GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id

# Security
railway variables set JWT_SECRET=your-super-secure-jwt-secret-at-least-32-chars
railway variables set SESSION_SECRET=your-super-secure-session-secret-at-least-32-chars

# CORS (replace with your actual domain)
railway variables set CORS_ORIGIN=https://your-domain.railway.app,https://www.your-domain.com
```

### Optional Environment Variables
```bash
# Google Ads API (if using)
railway variables set GOOGLE_ADS_CLIENT_ID=your-client-id
railway variables set GOOGLE_ADS_CLIENT_SECRET=your-client-secret
railway variables set GOOGLE_ADS_REFRESH_TOKEN=your-refresh-token
railway variables set GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token

# Monitoring and Analytics
railway variables set SENTRY_DSN=your-sentry-dsn
railway variables set ANALYTICS_ID=your-analytics-id
```

## Step 5: Deploy to Railway

### Deploy Current Code
```bash
# Deploy from current directory
railway up

# Or deploy specific branch
railway up --branch main
```

### Monitor Deployment
```bash
# Check deployment status
railway status

# View logs
railway logs

# Follow logs in real-time
railway logs --follow
```

## Step 6: Database Migration

### Run Database Migrations
```bash
# Connect to your Railway project
railway link

# Run database migrations
railway run npm run db:push

# Or run directly in Railway environment
railway shell
npm run db:push
exit
```

## Step 7: Custom Domain Setup (Optional)

### Add Custom Domain
```bash
# Add domain through CLI
railway domain add your-domain.com

# Or through dashboard:
# 1. Go to your project dashboard
# 2. Click on "Settings"
# 3. Go to "Domains"
# 4. Add your custom domain
```

### DNS Configuration
Point your domain to Railway:
- **CNAME**: `your-project.up.railway.app`
- **A Record**: Use Railway's IP (check dashboard)

## Step 8: Environment-Specific Configuration

### Production Environment
```bash
# Create production environment (if not default)
railway environment create production

# Switch to production environment
railway environment use production

# Set production-specific variables
railway variables set NODE_ENV=production
railway variables set LOG_LEVEL=error
```

### Staging Environment
```bash
# Create staging environment
railway environment create staging

# Switch to staging environment
railway environment use staging

# Set staging-specific variables
railway variables set NODE_ENV=staging
railway variables set LOG_LEVEL=debug
```

## Configuration Files

### railway.json
Already created in the project root with optimal settings for deployment.

### Procfile
Simple process definition:
```
web: npm start
```

## Monitoring and Health Checks

### Health Check Endpoint
The application includes a comprehensive health check at `/health`:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "production",
  "version": "1.0.0",
  "uptime": 3600,
  "memory": {
    "used": "125MB",
    "total": "150MB"
  },
  "database": {
    "connected": true,
    "poolSize": 5,
    "idleConnections": 2,
    "totalConnections": 5
  }
}
```

### Monitoring Commands
```bash
# Check application health
railway run curl -f http://localhost:5000/health

# View application metrics
railway metrics

# Check resource usage
railway ps
```

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build logs
railway logs --deployment

# Common solutions:
# - Ensure all dependencies are in package.json
# - Check TypeScript compilation errors
# - Verify environment variables are set
```

#### 2. Database Connection Issues
```bash
# Verify DATABASE_URL is set
railway variables | grep DATABASE_URL

# Test database connection
railway shell
node -e "console.log(process.env.DATABASE_URL)"
```

#### 3. Application Not Starting
```bash
# Check start command
railway logs --follow

# Verify Procfile exists and is correct
cat Procfile

# Check if port binding is correct (should be process.env.PORT)
```

#### 4. CORS Issues
```bash
# Update CORS_ORIGIN environment variable
railway variables set CORS_ORIGIN=https://your-new-domain.railway.app

# Redeploy
railway up
```

### Debug Commands
```bash
# Access Railway shell
railway shell

# Run commands in Railway environment
railway run <command>

# Check environment variables
railway variables

# View recent deployments
railway deployments

# Restart application
railway redeploy
```

## Performance Optimization

### Resource Limits
Railway automatically manages resources, but you can optimize:

1. **Database Connection Pooling**: Already configured in `server/lib/database.ts`
2. **Memory Management**: Graceful shutdown handling implemented
3. **Request Timeouts**: 30-second timeout configured

### Scaling
```bash
# Check current usage
railway metrics

# Scale vertically through dashboard:
# 1. Go to project settings
# 2. Upgrade plan if needed for more resources
```

## Security Considerations

### Environment Variables
- Never commit secrets to Git
- Use Railway's secure variable storage
- Rotate secrets regularly

### HTTPS
- Railway provides automatic HTTPS
- Certificate renewal is handled automatically

### Database Security
- Database is private by default
- Only accessible from your Railway services
- Automated backups included

## Maintenance

### Regular Tasks
```bash
# Update dependencies
npm update

# Deploy updates
railway up

# Check health
railway run npm run health

# View metrics
railway metrics
```

### Backup Strategy
- Railway provides automatic database backups
- Export important data regularly:
```bash
# Database backup
railway run pg_dump $DATABASE_URL > backup.sql

# Upload to cloud storage or download locally
```

## Cost Management

### Free Tier Limits
- 500 hours/month compute time
- 1GB RAM
- 1GB storage
- Multiple projects allowed

### Monitoring Usage
```bash
# Check current usage
railway usage

# View billing dashboard
railway billing
```

## Support and Resources

### Railway Resources
- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app)

### Project-Specific Help
- Check application logs: `railway logs`
- Health check: `https://your-app.railway.app/health`
- Database status: Check health endpoint for database info

## Quick Reference Commands

```bash
# Essential Railway commands
railway login                    # Authenticate
railway init                     # Initialize project
railway up                       # Deploy
railway logs                     # View logs
railway variables               # List environment variables
railway shell                   # Access shell
railway status                  # Check project status
railway metrics                 # View metrics
railway domain add <domain>     # Add custom domain

# Project management
railway environment create <name>  # Create environment
railway environment use <name>     # Switch environment
railway service create             # Add new service
railway service delete <name>      # Remove service

# Database operations
railway add -d postgresql          # Add PostgreSQL
railway run npm run db:push        # Run migrations
railway run npm run db:migrate     # Run specific migrations
```

This comprehensive setup guide ensures a smooth deployment process and provides ongoing maintenance guidance for your Rival Outranker application on Railway.