# Netlify Deployment Setup Guide

This guide provides step-by-step instructions for deploying the Rival Outranker frontend to Netlify with optimal configuration.

## Prerequisites

- Netlify account
- GitHub repository linked to Netlify
- Railway backend deployed and accessible
- Environment variables configured

## Deployment Configuration

### 1. Site Setup

1. **Connect Repository**
   ```bash
   # Link your GitHub repository to Netlify
   # Go to Netlify Dashboard > New site from Git
   # Select your repository
   ```

2. **Build Settings**
   - Build command: `npm run build:netlify`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

### 2. Environment Variables

Configure the following environment variables in Netlify Dashboard > Site settings > Environment variables:

#### Required Variables
```env
# Backend API URL (Replace with your Railway app URL)
VITE_API_BASE_URL=https://rival-outranker-production.up.railway.app

# Environment identifier
VITE_ENVIRONMENT=production

# Optional: OpenAI API Key (for client-side features)
VITE_OPENAI_API_KEY=sk-your-key-here
```

#### Branch-Specific Variables
- **Production (main branch)**: Uses production Railway URL
- **Staging (develop branch)**: Uses staging Railway URL  
- **Deploy Previews**: Uses staging Railway URL

### 3. Domain Configuration

1. **Custom Domain Setup**
   ```bash
   # In Netlify Dashboard > Domain settings
   # Add custom domain: your-domain.com
   # Configure DNS records as provided by Netlify
   ```

2. **SSL Certificate**
   - Automatically provisioned by Netlify
   - Enforces HTTPS redirects
   - Includes HSTS headers for security

### 4. Build Optimization

#### Build Commands
```json
{
  "build:netlify": "npm run build:clean && npm run build:optimize",
  "build:clean": "rm -rf dist",
  "build:optimize": "vite build --mode production",
  "build:analyze": "npm run build && npx vite-bundle-analyzer dist/stats.html"
}
```

#### Performance Features
- **Asset Optimization**: Automatic minification and compression
- **Cache Headers**: Aggressive caching for static assets
- **Bundle Analysis**: Use `npm run build:analyze` to optimize bundle size

### 5. Security Configuration

#### Headers Applied
- **X-Frame-Options**: Prevents clickjacking
- **X-XSS-Protection**: XSS filtering
- **X-Content-Type-Options**: MIME type sniffing protection
- **Content-Security-Policy**: Restricts resource loading
- **Strict-Transport-Security**: Enforces HTTPS
- **Permissions-Policy**: Restricts browser features

#### API Security
- All API requests proxied to Railway backend
- CORS configured on backend
- Rate limiting applied on backend

### 6. Deployment Process

#### Automatic Deployments
```bash
# Production deployment (main branch)
git push origin main

# Staging deployment (develop branch)  
git push origin develop

# Deploy preview (pull requests)
# Automatically created for all PRs
```

#### Manual Deployments
```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

### 7. Monitoring and Debugging

#### Build Logs
- Access build logs in Netlify Dashboard > Deploys
- Check for TypeScript errors or build failures
- Verify environment variables are injected

#### Performance Monitoring
```bash
# Check bundle size
npm run build:analyze

# Test build locally
npm run preview
```

#### Common Issues
1. **Environment Variables**: Ensure all VITE_ prefixed variables are set
2. **API Calls**: Verify Railway backend URL is accessible
3. **Routing**: SPA routing handled by catch-all redirect to index.html
4. **CORS**: Backend must allow frontend domain in CORS settings

### 8. Branch Strategy

#### Production (main)
- **URL**: `https://your-app.netlify.app`
- **Backend**: Production Railway app
- **Auto-deploy**: Enabled

#### Staging (develop)
- **URL**: `https://develop--your-app.netlify.app`
- **Backend**: Staging Railway app
- **Auto-deploy**: Enabled

#### Pull Requests
- **URL**: `https://deploy-preview-{PR#}--your-app.netlify.app`
- **Backend**: Staging Railway app
- **Auto-deploy**: Enabled for PRs

### 9. Form Handling (if applicable)

```html
<!-- Contact forms with Netlify handling -->
<form name="contact" method="POST" data-netlify="true">
  <input type="hidden" name="form-name" value="contact" />
  <!-- form fields -->
</form>
```

### 10. Advanced Configuration

#### Build Hooks
- Set up build hooks for external triggers
- Useful for CMS content updates or scheduled rebuilds

#### Edge Functions
- Implement serverless functions for enhanced functionality
- A/B testing, personalization, or API integrations

#### Analytics
- Enable Netlify Analytics for traffic insights
- Configure Google Analytics or other tracking

## Troubleshooting

### Build Failures
```bash
# Check Node.js version
node --version  # Should be 18.x

# Clear cache and rebuild
npm run build:clean
npm install
npm run build:netlify
```

### Environment Issues
```bash
# Verify environment variables
echo $VITE_API_BASE_URL

# Check build logs for missing variables
# Ensure all VITE_ prefixed variables are set in Netlify
```

### API Connection Issues
```bash
# Test backend connectivity
curl https://your-railway-app.railway.app/health

# Check CORS configuration on backend
# Ensure frontend domain is allowed
```

## Security Checklist

- [ ] HTTPS enforced with HSTS headers
- [ ] Content Security Policy configured
- [ ] XSS protection enabled
- [ ] Clickjacking protection enabled
- [ ] Environment variables secured
- [ ] API endpoints properly proxied
- [ ] Rate limiting configured on backend

## Performance Checklist

- [ ] Static assets cached aggressively
- [ ] Bundle size optimized
- [ ] Images optimized and cached
- [ ] Fonts cached properly
- [ ] HTML files not cached
- [ ] Gzip compression enabled
- [ ] CDN distribution active

## Next Steps

1. **Monitor Performance**: Use Netlify Analytics and Lighthouse
2. **Set Up Alerts**: Configure build failure notifications
3. **Implement CI/CD**: Add automated testing before deployment
4. **Optimize Assets**: Implement image optimization and lazy loading
5. **Security Audit**: Regular security header and dependency updates

For additional support, refer to [Netlify Documentation](https://docs.netlify.com/) or contact your development team.