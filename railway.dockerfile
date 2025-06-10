# Railway-optimized Dockerfile for backend-only deployment
FROM node:18-alpine

# Install Chrome dependencies and Chrome itself
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl

# Set working directory
WORKDIR /app

# Copy only necessary package files first for better caching
COPY package.json package-lock.json ./

# Install all dependencies (production and dev)
RUN npm ci --no-audit --no-fund

# Install Chrome for Puppeteer (skip download since we use system Chrome)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set additional Puppeteer configuration for Alpine Linux
ENV PUPPETEER_CACHE_DIR=/home/nodejs/.cache/puppeteer

# Copy only backend-related files
COPY server/ ./server/
COPY shared/ ./shared/
COPY config/ ./config/
COPY railway.json ./
COPY scripts/ ./scripts/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create cache directory and change ownership of app directory
RUN mkdir -p /home/nodejs/.cache/puppeteer && \
    chown -R nodejs:nodejs /app /home/nodejs/.cache

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the application
CMD ["npm", "run", "railway:start"]