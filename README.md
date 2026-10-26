# B2B SaaS Monorepo - Clean Architecture

Professional B2B SaaS products built with Clean Architecture, TDD, and modern TypeScript.

## 🎯 Products

### 1. **ScreenAPI** - Professional Screenshot API
- High-quality website screenshots via REST API
- Multiple formats (PNG, JPEG, WEBP)
- Anti-SSRF protection
- Rate limiting & credit system
- Production-ready

### 2. **URL Shortener** (Coming Soon)
- Premium URL shortening service
- Custom domains & slugs
- Advanced analytics
- Password protection
- QR code generation

---

## 🏗️ Architecture

### Clean Architecture Layers

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Next.js API Routes, React Pages)      │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│       Application Layer                 │
│  (Use Cases / Business Logic)           │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│         Domain Layer                    │
│  (Entities, Value Objects)              │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│      Infrastructure Layer               │
│  (Databases, External Services)         │
└─────────────────────────────────────────┘
```

### Monorepo Structure

```
/
├── apps/
│   ├── screenapi/          # Screenshot API service
│   ├── urlshortener/       # URL shortener service
│   └── web/                # Marketing website
│
├── packages/
│   ├── shared-types/       # Common TypeScript types
│   ├── shared-ui/          # Reusable React components
│   ├── shared-config/      # Shared configs (TS, ESLint)
│   ├── database/           # Prisma schema & client
│   └── testing/            # Test utilities
│
└── turbo.json              # Turborepo configuration
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- PostgreSQL 15+
- Redis 7+ (optional, has mock fallback)

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm --filter @repo/database db:generate

# Setup database
pnpm --filter @repo/database db:push

# Start development servers
pnpm dev
```

### Running Tests

```bash
# Run all tests
pnpm test

# Unit tests only
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# With coverage
pnpm test:unit --coverage
```

---

## 📦 Packages

### `@repo/shared-types`
Common TypeScript types and utilities:
- `Result<T, E>` - Functional error handling
- Domain primitives (UUID, Email, URL, etc.)
- Common enums and interfaces

### `@repo/database`
Prisma-based database layer:
- User & authentication
- API keys
- Subscriptions & billing
- Screenshots & analytics
- URL shortening

### `@repo/shared-config`
Shared configurations:
- TypeScript configs (base, Next.js, React)
- ESLint configs
- Prettier config

---

## 🧪 Testing Strategy

### Unit Tests (70% of tests)
- Pure domain logic
- Entities, Value Objects
- Validators
- TDD approach

Example:
```typescript
describe('UrlValidator', () => {
  it('should reject localhost URLs', () => {
    const result = UrlValidator.validate('http://localhost');
    expect(result.success).toBe(false);
  });
});
```

### Integration Tests (20%)
- Repository implementations
- External services
- Database operations

### E2E Tests (10%)
- Full API workflows
- User journeys
- Playwright tests

---

## 📱 ScreenAPI - Quick Reference

### Capture Screenshot

```bash
curl -X POST https://api.screenapi.com/v1/screenshot \
  -H "x-api-key: sk_live_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "format": "PNG",
    "viewportType": "DESKTOP",
    "fullPage": false
  }' \
  --output screenshot.png
```

### Domain Model

```typescript
// Screenshot Entity
class Screenshot {
  id: ScreenshotId
  url: string
  format: ImageFormat
  dimensions: Dimensions
  viewportType: ViewportType
  metadata: ScreenshotMetadata
}

// Value Objects
class ScreenshotOptions {
  url: string
  format: ImageFormat
  viewport: Dimensions
  fullPage: boolean
  // ... more options
}
```

---

## 🔒 Security Features

### Anti-SSRF Protection
Blocks:
- ✅ Localhost (127.0.0.1, ::1)
- ✅ Private IPs (10.x, 172.16.x, 192.168.x)
- ✅ Link-local (169.254.x.x)
- ✅ Internal domains (.internal, .flycast, .local)
- ✅ Cloud metadata services (169.254.169.254)

### Rate Limiting
- Redis-based distributed rate limiting
- Per-plan limits (FREE: 10/min, PRO: 60/min, ENTERPRISE: 300/min)
- Automatic fallback to in-memory store

### API Key Authentication
- Cryptographically secure key generation
- Format: `sk_live_{64_hex_chars}`
- Expiration support
- Usage tracking

---

## 🛠️ Tech Stack

### Core
- **Turborepo** - Monorepo build system
- **pnpm** - Fast package manager
- **TypeScript 5** - Type safety

### Backend
- **Next.js 15** - App Router
- **Prisma 6** - Type-safe ORM
- **Zod** - Runtime validation
- **Playwright** - Browser automation

### Testing
- **Vitest** - Unit & integration tests
- **Playwright Test** - E2E tests
- **Coverage v8** - Code coverage

### Infrastructure
- **PostgreSQL** - Primary database
- **Redis** - Cache & rate limiting
- **Fly.io** - Hosting (recommended)

---

## 📊 Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/my-feature
```

### 2. Write Tests First (TDD)
```typescript
// Write failing test
describe('MyUseCase', () => {
  it('should do something', () => {
    expect(result).toBe(expected);
  });
});
```

### 3. Implement Feature
```typescript
// Make test pass
export class MyUseCase {
  execute() {
    // Implementation
  }
}
```

### 4. Run Tests
```bash
pnpm test:unit
```

### 5. Commit & Push
```bash
git add .
git commit -m "feat: add new feature"
git push origin feature/my-feature
```

---

## 🚢 Deployment

### Build for Production

```bash
pnpm build
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Redis
REDIS_URL="redis://..."

# Next.js
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# Stripe (optional)
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Deploy to Fly.io

```bash
# ScreenAPI
cd apps/screenapi
flyctl deploy

# URL Shortener
cd apps/urlshortener
flyctl deploy
```

---

## 📈 Monitoring

### Logging
- Structured JSON logs
- Request/response tracking
- Error tracking with Sentry

### Metrics
- Request latency (P50, P95, P99)
- Error rates
- Rate limit hits
- Credit consumption

### Observability
- OpenTelemetry traces
- Axiom for log aggregation
- Custom dashboards

---

## 🤝 Contributing

### Code Style
- Follow TypeScript strict mode
- Use functional programming patterns
- Write tests first (TDD)
- Keep functions pure when possible

### Commit Messages
Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `test:` Tests
- `refactor:` Code refactoring
- `chore:` Maintenance

### Pull Request Process
1. Create feature branch
2. Write tests
3. Implement feature
4. All tests pass
5. Update documentation
6. Submit PR

---

## 📚 Documentation

- [Clean Architecture Guide](./docs/CLEAN_ARCHITECTURE.md)
- [Testing Guide](./docs/TESTING.md)
- [API Reference](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

---

## 🎯 Project Status

### ✅ Completed
- [x] Monorepo setup with Turborepo
- [x] Shared packages (types, database, config)
- [x] ScreenAPI domain layer
- [x] ScreenAPI entities & value objects
- [x] Anti-SSRF URL validation
- [x] Unit tests setup with Vitest
- [x] PostgreSQL schema with Prisma

### 🚧 In Progress
- [ ] ScreenAPI application layer (Use Cases)
- [ ] ScreenAPI infrastructure layer (Playwright, Redis)
- [ ] ScreenAPI API routes
- [ ] Integration tests
- [ ] E2E tests

### 📋 Planned
- [ ] URL Shortener domain layer
- [ ] URL Shortener application layer
- [ ] URL Shortener infrastructure
- [ ] Marketing website
- [ ] CI/CD pipelines
- [ ] Production deployment

---

**Built with ❤️ using Clean Architecture & TDD**
