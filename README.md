# Rival Outranker - Professional SEO Analysis Platform

Rival Outranker is a comprehensive SEO analysis and audit platform that helps digital marketers, agencies, and website owners improve their search engine rankings through detailed technical analysis, competitor research, and AI-powered recommendations.

## 🚀 Key Features

### Core SEO Analysis
- **Comprehensive URL Analysis** - 50+ SEO factors analyzed including meta tags, content quality, technical SEO, and more
- **Real-time Scoring** - Get instant SEO scores with detailed breakdowns across multiple categories
- **AI-Powered Insights** - OpenAI integration for intelligent content recommendations
- **Multi-format Support** - Analyze standard web pages and PDF documents with OCR capabilities

### Professional Audit Tools
- **Rival Audit System** - 140+ factor professional SEO audit with multi-page crawling
- **Priority OFI Classification** - Advanced issue prioritization system for agencies
- **Real-time Progress Tracking** - Live updates during audit crawling
- **Bulk Export Options** - Excel, CSV, and PDF export for client deliverables

### Competitive Intelligence
- **Competitor Discovery** - Automatically find and analyze competitors
- **Keyword Gap Analysis** - Identify keyword opportunities competitors are ranking for
- **Backlink Comparison** - Compare link profiles and identify link building opportunities
- **Content Analysis** - Deep content comparison with AI-powered insights

### Keyword Research & Tracking
- **Keyword Suggestions** - Get relevant keyword ideas with search volume and difficulty
- **Rank Tracking** - Monitor keyword positions across search engines over time
- **Historical Data** - Track ranking changes and identify trends
- **SERP Analysis** - Analyze search results for target keywords

### Backlink Analysis
- **Link Profile Monitoring** - Track backlinks pointing to any domain
- **Link Quality Metrics** - Analyze domain authority and link value
- **New/Lost Link Alerts** - Monitor changes in backlink profile
- **Competitor Backlinks** - Discover competitor link building strategies

### Educational Platform
- **Learning Paths** - Structured SEO education with modules and lessons
- **Interactive Quizzes** - Test knowledge with gamified assessments
- **Achievement System** - Earn badges and track learning progress
- **SEO Buddy Assistant** - AI chatbot for instant SEO guidance

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript for type-safe development
- **Vite** for lightning-fast development and builds
- **Tailwind CSS** for responsive, utility-first styling
- **Radix UI** for accessible component primitives
- **TanStack Query** for efficient server state management
- **Recharts** for beautiful data visualizations

### Backend
- **Express.js** with TypeScript for robust API development
- **PostgreSQL** for reliable data storage
- **Drizzle ORM** for type-safe database operations
- **JWT Authentication** with refresh tokens
- **Cheerio & Puppeteer** for web scraping
- **OpenAI API** for AI-powered analysis

### External Integrations
- **OpenAI** - Content analysis and recommendations
- **DataForSEO** - Keyword research and SERP data
- **Google APIs** - PageSpeed, Search Console, Custom Search
- **Tesseract.js** - OCR for PDF content extraction

## 📁 Project Structure

```
Rival-Outranker/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # UI components organized by feature
│   │   │   ├── ui/       # Design system components
│   │   │   └── features/ # Feature-specific components
│   │   ├── pages/        # Page-level components
│   │   ├── hooks/        # Custom React hooks
│   │   └── services/     # API client services
├── server/                # Backend Express application
│   ├── controllers/      # HTTP request handlers
│   ├── services/         # Business logic by domain
│   ├── repositories/     # Data access layer
│   ├── routes/           # API route definitions
│   └── middleware/       # Express middleware
├── shared/               # Shared code between client/server
│   ├── schema.ts         # Database schema & validation
│   ├── constants/        # Shared constants
│   └── types/            # TypeScript type definitions
└── docs/                 # Comprehensive documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- API keys for external services (see Environment Configuration)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/rival-outranker.git
cd rival-outranker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
npm run db:push
```

5. Start development server:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Environment Configuration

Create a `.env` file with the following variables:

```env
# Database (Required)
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication (Auto-generated if not provided)
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret

# OpenAI (Required for AI features)
OPENAI_API_KEY=sk-...

# DataForSEO (Required for keyword research)
DATAFORSEO_API_LOGIN=your_username
DATAFORSEO_API_PASSWORD=your_password

# Google APIs (Optional but recommended)
GOOGLE_API_KEY=your_google_api_key
GOOGLE_SEARCH_API_KEY=your_search_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
```

## 📦 Available Scripts

### Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - TypeScript type checking

### Database
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio for database management

### Security
- `npm run security:audit` - Audit dependencies for vulnerabilities
- `npm run security:test` - Run security tests
- `npm run security:headers` - Test security headers

### Testing
- `npm test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:coverage` - Generate test coverage report

## 🔌 API Endpoints

### Core Analysis
- `POST /api/analyze` - Analyze a URL for SEO factors
- `GET /api/analysis` - Retrieve analysis results
- `POST /api/competitor-analysis` - Analyze competitors
- `POST /api/deep-content-analysis` - AI-powered content analysis

### Rival Audit
- `POST /api/rival-audit` - Start comprehensive audit
- `GET /api/rival-audit/:id/results` - Get audit results
- `PUT /api/rival-audit/:id/update-item` - Update audit item status
- `GET /api/rival-audit/:id/export/excel` - Export to Excel

### Keywords
- `POST /api/keywords/research` - Get keyword suggestions
- `POST /api/keywords/track` - Start tracking keywords
- `GET /api/keywords/:id/rankings` - Get ranking history

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user

## 🎯 Use Cases

### For Digital Agencies
- Conduct comprehensive SEO audits for clients
- Generate professional PDF reports
- Track client website rankings
- Monitor competitor strategies

### For In-House SEO Teams
- Regular technical SEO monitoring
- Content optimization recommendations
- Keyword research and tracking
- Team education and training

### For Website Owners
- DIY SEO analysis and improvements
- Learn SEO best practices
- Monitor search visibility
- Identify technical issues

## 🔒 Security Features

- **JWT Authentication** with secure refresh tokens
- **Rate Limiting** to prevent abuse
- **Input Sanitization** for XSS prevention
- **SQL Injection Protection** via parameterized queries
- **CORS Configuration** for API security
- **Security Headers** (CSP, HSTS, X-Frame-Options)
- **Password Hashing** with bcrypt
- **Session Management** with fingerprinting

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:
- Code of Conduct
- Development setup
- Coding standards
- Pull request process

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com) for AI capabilities
- [DataForSEO](https://dataforseo.com) for SEO data
- [Radix UI](https://radix-ui.com) for accessible components
- [Tailwind CSS](https://tailwindcss.com) for styling
- All contributors and supporters of this project

## 📞 Support

- **Documentation**: See the [/docs](./docs) directory
- **Issues**: [GitHub Issues](https://github.com/yourusername/rival-outranker/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/rival-outranker/discussions)

---

Built with ❤️ by the Rival Outranker team