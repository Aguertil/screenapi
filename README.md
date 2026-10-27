# ScreenAPI - Professional Screenshot API Service

**A production-ready B2B SaaS screenshot API built with Clean Architecture, TDD, and modern TypeScript.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.1-black.svg)](https://nextjs.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.64-green.svg)](https://playwright.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-brightgreen.svg)](https://www.prisma.io/)
[![Tests](https://img.shields.io/badge/tests-70%2B%20passing-success.svg)]()
[![Architecture](https://img.shields.io/badge/architecture-clean-blue.svg)]()

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd workspace

# 2. Install dependencies
pnpm install

# 3. Setup database
pnpm --filter @repo/database db:push

# 4. Start development server
pnpm --filter screenapi dev
# → http://localhost:43210

# 5. Create test user and API key
curl -X POST http://localhost:43210/api/admin/setup

# 6. Capture your first screenshot
curl -X POST http://localhost:43210/api/v1/screenshot \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}' \
  --output screenshot.png
```

**Done!** You now have a screenshot at `screenshot.png` 🎉

---

## ✨ Features

### Core Capabilities
- 📸 **Screenshot Capture** - Capture any public URL
- 🎨 **Multiple Formats** - PNG, JPEG, WEBP support
- 📱 **Responsive Viewports** - Desktop, Mobile, Tablet, Custom
- 📄 **Full-Page Capture** - Capture entire scrollable pages
- 🍪 **Cookie Banner Blocking** - Auto-hide 12+ cookie banners
- 🚫 **Ad Blocking** - Optional ad blocking
- 🎯 **Element Targeting** - Hide specific elements
- 🔐 **Custom User Agents** - Customize browser identity

### Security & Performance
- 🛡️ **Anti-SSRF Protection** - Blocks localhost, private IPs, cloud metadata
- ⚡ **Browser Pooling** - Reuse browser instances (~1.7s faster)
- 🔑 **API Key Authentication** - Secure access control
- ⏱️ **Rate Limiting** - Redis-backed with in-memory fallback
- 💳 **Credit Management** - Usage tracking and limits
- 📊 **Request Logging** - Complete audit trail

### Developer Experience
- 📚 **Complete Documentation** - Interactive docs at `/docs`
- 💻 **Code Examples** - cURL, JavaScript, Python
- 🎯 **Type-Safe API** - Full TypeScript support
- 🧪 **70+ Tests** - Unit + E2E test coverage
- 📊 **Live Dashboard** - Monitor usage at `/dashboard`
- 🏥 **Health Checks** - Monitor service status at `/api/health`

---

## 🏗️ Architecture

**Clean Architecture** - Domain, Application, Infrastructure, API, Frontend layers.

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Next.js API Routes + React Pages)     │
├─────────────────────────────────────────┤
│         Application Layer               │
│   (Use Cases + Business Logic)          │
├─────────────────────────────────────────┤
│         Domain Layer                    │
│  (Entities + Value Objects + Rules)     │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
│  (Playwright, Prisma, Redis, etc.)      │
└─────────────────────────────────────────┘
```

**Principles:**
- ✅ Dependency Inversion (interfaces everywhere)
- ✅ Single Responsibility (one job per class)
- ✅ Open/Closed (extend, don't modify)
- ✅ Liskov Substitution (interface contracts)
- ✅ Interface Segregation (small interfaces)
- ✅ Result Monad (type-safe error handling)
- ✅ Test-Driven Development (tests first)

---

## 📦 Tech Stack

### Backend
- [**Next.js 15**](https://nextjs.org/) - App Router + API Routes
- [**Playwright**](https://playwright.dev/) - Browser automation
- [**Prisma**](https://www.prisma.io/) - Type-safe ORM
- [**PostgreSQL**](https://www.postgresql.org/) - Primary database
- [**Redis**](https://redis.io/) - Rate limiting + caching
- [**Zod**](https://zod.dev/) - Runtime validation

### Frontend
- [**React 19**](https://react.dev/) - Server Components
- [**TypeScript**](https://www.typescriptlang.org/) - Type safety
- Next.js SSR - Server-side rendering

### Infrastructure
- [**Turborepo**](https://turbo.build/repo) - Monorepo build system
- [**pnpm**](https://pnpm.io/) - Fast package manager
- [**Vitest**](https://vitest.dev/) - Unit testing
- [**Playwright Test**](https://playwright.dev/) - E2E testing

---

## 📂 Project Structure

```
workspace/
├── apps/
│   └── screenapi/                  # Main API application
│       ├── src/
│       │   ├── core/screenshot/
│       │   │   ├── domain/         # Business entities & rules
│       │   │   ├── application/    # Use cases & interfaces
│       │   │   ├── infrastructure/ # External services
│       │   │   └── tests/          # Unit tests
│       │   │
│       │   └── app/                # Next.js App Router
│       │       ├── page.tsx        # Homepage
│       │       ├── dashboard/      # User dashboard
│       │       ├── docs/           # API documentation
│       │       └── api/            # API routes
│       │
│       ├── tests/e2e/              # E2E tests
│       ├── next.config.ts
│       ├── playwright.config.ts
│       └── vitest.config.ts
│
├── packages/
│   ├── shared-types/               # Common TypeScript types
│   ├── shared-config/              # Shared TS configs
│   └── database/                   # Prisma schema
│
├── turbo.json                      # Turborepo config
└── pnpm-workspace.yaml             # pnpm workspaces
```

---

## 🔧 Configuration

### Environment Variables

Create `.env` at the project root:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/screenapi?schema=public"

# Redis (optional - uses in-memory fallback if not set)
REDIS_URL="redis://localhost:6379"

# Node Environment
NODE_ENV="development"
```

### Database Setup

```bash
# Generate Prisma Client
pnpm --filter @repo/database db:generate

# Push schema to database
pnpm --filter @repo/database db:push

# Or run migrations (production)
pnpm --filter @repo/database db:migrate
```

---

## 🧪 Testing

### Run All Tests

```bash
# Unit tests
pnpm --filter screenapi test:unit

# With coverage
pnpm --filter screenapi test:unit --coverage

# E2E tests
pnpm --filter screenapi test:e2e

# Type checking
pnpm --filter screenapi typecheck
```

### Test Coverage

```
Domain Layer:        84.10%
Application Layer:   91.07%
Infrastructure:      22.79%
Overall:            36.14%
```

60+ unit tests + 10 E2E scenarios = **70+ tests total**

---

## 📖 API Documentation

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/screenshot` | Capture a screenshot |
| `GET` | `/api/v1/screenshot` | Get API info |
| `GET` | `/api/health` | Health check |
| `POST` | `/api/admin/setup` | Create test user (dev only) |

### Example Request

**cURL:**
```bash
curl -X POST http://localhost:43210/api/v1/screenshot \
  -H "x-api-key: sk_test_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "format": "PNG",
    "viewportType": "DESKTOP",
    "fullPage": false,
    "blockCookies": true
  }' \
  --output screenshot.png
```

**JavaScript:**
```javascript
const response = await fetch('http://localhost:43210/api/v1/screenshot', {
  method: 'POST',
  headers: {
    'x-api-key': 'sk_test_xxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com',
    format: 'PNG',
    viewportType: 'MOBILE'
  })
});

const buffer = await response.arrayBuffer();
```

**Python:**
```python
import requests

response = requests.post(
    'http://localhost:43210/api/v1/screenshot',
    headers={'x-api-key': 'sk_test_xxx'},
    json={
        'url': 'https://example.com',
        'format': 'PNG',
        'viewportType': 'DESKTOP'
    }
)

with open('screenshot.png', 'wb') as f:
    f.write(response.content)
```

**Full documentation:** http://localhost:43210/docs

---

## 📊 Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | ✅ | - | URL to capture |
| `format` | `PNG\|JPEG\|WEBP` | ❌ | `PNG` | Image format |
| `quality` | number (1-100) | ❌ | 90 | JPEG quality |
| `viewportType` | `DESKTOP\|MOBILE\|TABLET\|CUSTOM` | ❌ | `DESKTOP` | Viewport preset |
| `viewportWidth` | number | ❌ | (preset) | Custom width |
| `viewportHeight` | number | ❌ | (preset) | Custom height |
| `fullPage` | boolean | ❌ | `false` | Capture full page |
| `waitForSelector` | string | ❌ | - | Wait for CSS selector |
| `waitForTimeout` | number (ms) | ❌ | 30000 | Wait timeout |
| `hideElements` | string[] | ❌ | `[]` | Hide CSS selectors |
| `blockCookies` | boolean | ❌ | `true` | Hide cookie banners |
| `blockAds` | boolean | ❌ | `false` | Block ads |
| `userAgent` | string | ❌ | (default) | Custom user agent |

---

## 🔒 Security

### Anti-SSRF Protection

The API automatically blocks dangerous URLs:

- ❌ Localhost (`127.0.0.1`, `::1`)
- ❌ Private IPs (`10.x`, `172.16.x`, `192.168.x`)
- ❌ Link-local (`169.254.x.x`)
- ❌ Cloud metadata (`169.254.169.254`, `metadata.google.internal`)
- ❌ Internal domains (`.internal`, `.flycast`, `.local`)

### Rate Limiting

Per-user rate limits enforced via Redis (with in-memory fallback):

- **FREE:** 10 requests/minute
- **PRO:** 60 requests/minute
- **ENTERPRISE:** 300 requests/minute

### Authentication

All API requests require a valid API key in the `x-api-key` header.

---

## 💻 Development

### Project Commands

```bash
# Install dependencies
pnpm install

# Development mode
pnpm --filter screenapi dev

# Build for production
pnpm --filter screenapi build

# Start production server
pnpm --filter screenapi start

# Run tests
pnpm --filter screenapi test:unit
pnpm --filter screenapi test:e2e

# Type check
pnpm --filter screenapi typecheck

# Database commands
pnpm --filter @repo/database db:generate
pnpm --filter @repo/database db:push
pnpm --filter @repo/database db:migrate

# Clean build artifacts
pnpm --filter screenapi clean
```

### Creating Test Users

**Development only:**

```bash
curl -X POST http://localhost:43210/api/admin/setup
```

Returns:
```json
{
  "user": {
    "id": "uuid",
    "email": "test-xxx@example.com",
    "name": "Test User"
  },
  "apiKey": {
    "key": "sk_test_xxx...",
    "rateLimit": 60
  },
  "subscription": {
    "plan": "PRO",
    "creditsTotal": 5000,
    "creditsRemaining": 5000
  }
}
```

---

## 🎯 Use Cases

### 1. Web Scraping & Monitoring
- Monitor website changes
- Archive web pages
- Track competitor updates

### 2. Testing & QA
- Visual regression testing
- Cross-browser compatibility
- Responsive design validation

### 3. Content Generation
- Social media previews
- Email thumbnails
- PDF reports

### 4. Documentation
- Product screenshots
- Tutorial images
- API examples

### 5. SEO & Marketing
- Meta image generation
- Landing page previews
- A/B testing snapshots

---

## 🚀 Deployment

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Redis (optional)

### Environment Setup

1. Set production environment variables
2. Run database migrations
3. Build the application
4. Start the production server

```bash
# Build
pnpm --filter screenapi build

# Start
pnpm --filter screenapi start
```

### Recommended Platforms
- [Vercel](https://vercel.com/) (Next.js native)
- [Fly.io](https://fly.io/) (full control)
- [Railway](https://railway.app/) (easy setup)
- [Render](https://render.com/) (batteries included)

---

## 📈 Performance

### Browser Pooling

Browser instances are reused for ~5 minutes of idle time:

- **Without pooling:** ~2.5s per screenshot
- **With pooling:** ~0.8s per screenshot
- **Improvement:** ~1.7s saved (68% faster)

### Resource Management

- Auto-cleanup on idle timeout
- Connection pooling (Prisma)
- Redis TTL management
- Process memory limits

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`pnpm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- TypeScript strict mode
- Clean Architecture principles
- 100% test coverage for new features
- No console.log in production code

---

## 📝 License

MIT License - feel free to use this project commercially.

---

## 🆘 Support

- **Documentation:** http://localhost:43210/docs
- **Dashboard:** http://localhost:43210/dashboard
- **Health Check:** http://localhost:43210/api/health
- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions

---

## 🎉 Credits

Built with ❤️ using:

- [Next.js](https://nextjs.org/)
- [Playwright](https://playwright.dev/)
- [Prisma](https://www.prisma.io/)
- [Turborepo](https://turbo.build/)
- [TypeScript](https://www.typescriptlang.org/)

---

## 📚 Learn More

- [Clean Architecture Guide](./CLEAN_ARCHITECTURE_PLAN.md)
- [Final Report](./FINAL_REPORT.md)
- [Sprint Progress](./PROGRESS.md)
- [API Documentation](http://localhost:43210/docs)

---

**Made with Clean Architecture, TDD, and modern TypeScript** 🚀
