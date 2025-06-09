# Rival Outranker Documentation

Welcome to the comprehensive documentation for Rival Outranker, a full-stack SEO analysis platform.

## 📁 Documentation Structure

### 🏗️ Architecture
- [NEW_STRUCTURE.md](./architecture/NEW_STRUCTURE.md) - Complete architectural refactoring plan and new structure
- [ARCHITECTURE_REFACTOR.md](./architecture/ARCHITECTURE_REFACTOR.md) - Architectural improvements and refactoring details

### 🚀 Development
- [CODING_STANDARDS.md](./development/CODING_STANDARDS.md) - Code style and development standards
- [ENVIRONMENT_VARIABLES.md](./development/ENVIRONMENT_VARIABLES.md) - Environment setup and configuration variables

### 🔄 Migration & Deployment
- [MIGRATION.md](./migration/MIGRATION.md) - Migration guides and deployment processes
- [REPLIT_TRANSFER_GUIDE.md](./migration/REPLIT_TRANSFER_GUIDE.md) - Guide for transferring from Replit to other platforms
- [REPLIT_DEPENDENCIES.md](./migration/REPLIT_DEPENDENCIES.md) - Replit-specific dependencies and configurations

### 🔌 API Reference
- [API_ENDPOINTS.md](./api/API_ENDPOINTS.md) - Complete API endpoint documentation

### 📊 Project Analysis
- [PROJECT_AUDIT.md](./PROJECT_AUDIT.md) - Comprehensive project audit and analysis
- [DEDUPLICATION_REPORT.md](./DEDUPLICATION_REPORT.md) - Code deduplication analysis and report
- [OPTIMIZATION_RESULTS.md](./OPTIMIZATION_RESULTS.md) - Performance optimization results and metrics
- [MOCK_DATA_INVENTORY.md](./MOCK_DATA_INVENTORY.md) - Inventory of mock data and testing resources

### 🖼️ Assets
- [attached_assets/](./assets/attached_assets/) - Project screenshots, diagrams, and sample files

## 🚀 Quick Start

1. **Setup**: Start with [ENVIRONMENT_VARIABLES.md](./development/ENVIRONMENT_VARIABLES.md) for environment configuration
2. **Architecture**: Review [NEW_STRUCTURE.md](./architecture/NEW_STRUCTURE.md) to understand the codebase organization
3. **Development**: Follow [CODING_STANDARDS.md](./development/CODING_STANDARDS.md) for consistent development practices
4. **API Integration**: Reference [API_ENDPOINTS.md](./api/API_ENDPOINTS.md) for API usage

## 📋 Development Workflow

```bash
# Environment setup
npm install
cp .env.example .env  # Configure your environment variables

# Development
npm run dev           # Start development server
npm run check         # TypeScript checking
npm run build         # Production build
npm run db:push       # Database schema updates
```

## 🏗️ Architecture Overview

Rival Outranker follows a modern, layered architecture:

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + TypeScript + PostgreSQL
- **State Management**: TanStack Query
- **Database**: Drizzle ORM with PostgreSQL
- **External APIs**: OpenAI, DataForSEO, Google APIs

## 📈 Project Status

✅ **Completed Major Refactoring (2025)**
- Implemented layered architecture (Controllers → Services → Repositories)
- Organized services by domain (analysis, audit, external, auth, keywords, backlinks)
- Feature-based component organization
- Comprehensive documentation structure

## 🤝 Contributing

When contributing to the project:

1. Follow the [CODING_STANDARDS.md](./development/CODING_STANDARDS.md)
2. Review the [NEW_STRUCTURE.md](./architecture/NEW_STRUCTURE.md) for architectural guidelines
3. Update documentation as needed
4. Ensure all tests pass and TypeScript compiles without errors

## 📞 Support

For detailed setup and troubleshooting:
- Review [MIGRATION.md](./migration/MIGRATION.md) for deployment issues
- Check [PROJECT_AUDIT.md](./PROJECT_AUDIT.md) for known issues and solutions
- Refer to [API_ENDPOINTS.md](./api/API_ENDPOINTS.md) for API integration help