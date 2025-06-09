# Railway-optimized Dockerfile for backend-only deployment
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy only necessary package files first for better caching
COPY package.json package-lock.json ./

# Install all dependencies (production and dev)
RUN npm ci --no-audit --no-fund

# Copy only backend-related files
COPY server/ ./server/
COPY shared/ ./shared/
COPY config/ ./config/
COPY railway.json ./
COPY scripts/ ./scripts/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

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