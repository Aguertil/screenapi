# Architecture Propre - 2 Produits B2B SaaS

## 📦 **STRUCTURE MONOREPO:**

```
/
├── apps/
│   ├── screenapi/              # API Screenshots (Next.js)
│   │   ├── src/
│   │   │   ├── app/           # App Router
│   │   │   ├── core/          # Business Logic
│   │   │   │   ├── screenshot/
│   │   │   │   │   ├── domain/      # Entities
│   │   │   │   │   ├── application/ # Use Cases
│   │   │   │   │   ├── infrastructure/ # Playwright, Storage
│   │   │   │   │   └── tests/
│   │   │   │   ├── auth/
│   │   │   │   ├── billing/
│   │   │   │   └── rate-limit/
│   │   │   └── lib/           # Utilities
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   ├── integration/
│   │   │   └── e2e/
│   │   ├── prisma/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── urlshortener/          # URL Shortener (Next.js)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── core/
│   │   │   │   ├── shorturl/
│   │   │   │   │   ├── domain/
│   │   │   │   │   ├── application/
│   │   │   │   │   ├── infrastructure/
│   │   │   │   │   └── tests/
│   │   │   │   ├── analytics/
│   │   │   │   ├── auth/
│   │   │   │   └── qrcode/
│   │   │   └── lib/
│   │   ├── tests/
│   │   ├── prisma/
│   │   └── package.json
│   │
│   └── web/                   # Landing Pages (Next.js)
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx           # Homepage
│       │   │   ├── screenapi/         # ScreenAPI marketing
│       │   │   ├── urlshortener/      # URLShortener marketing
│       │   │   └── pricing/
│       │   └── components/
│       └── package.json
│
├── packages/
│   ├── shared-types/          # TypeScript types partagés
│   ├── shared-ui/             # Composants React partagés
│   ├── shared-config/         # ESLint, TypeScript configs
│   ├── database/              # Prisma schema partagé
│   └── testing/               # Test utilities
│
├── infra/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   └── docker-compose.prod.yml
│   ├── k8s/                   # Kubernetes (optionnel)
│   └── terraform/             # IaC (optionnel)
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-screenapi.yml
│       └── deploy-urlshortener.yml
│
├── turbo.json                 # Turborepo config
├── package.json               # Root package
└── pnpm-workspace.yaml
```

---

## 🏗️ **1. SCREENAPI - Architecture Clean**

### **Clean Architecture Layers:**

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Next.js API Routes, React Pages)      │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│       Application Layer                 │
│  (Use Cases / Services)                 │
│  - CaptureScreenshotUseCase             │
│  - ValidateApiKeyUseCase                │
│  - DeductCreditsUseCase                 │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│         Domain Layer                    │
│  (Business Logic, Entities)             │
│  - Screenshot (Entity)                  │
│  - ApiKey (Value Object)                │
│  - Subscription (Aggregate)             │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│      Infrastructure Layer               │
│  (External Services)                    │
│  - PlaywrightService                    │
│  - PrismaRepository                     │
│  - RedisRateLimiter                     │
│  - S3StorageService                     │
└─────────────────────────────────────────┘
```

### **Domain Entities:**

```typescript
// Screenshot Entity
class Screenshot {
  constructor(
    public readonly id: ScreenshotId,
    public readonly url: URL,
    public readonly format: ImageFormat,
    public readonly dimensions: Dimensions,
    public readonly metadata: ScreenshotMetadata,
  ) {}

  static create(params: CreateScreenshotParams): Result<Screenshot, DomainError>
  isExpired(): boolean
  validate(): Result<void, ValidationError>
}

// ApiKey Value Object
class ApiKey {
  private constructor(private readonly value: string) {}
  
  static create(env: Environment): ApiKey
  static fromString(value: string): Result<ApiKey, InvalidApiKeyError>
  toString(): string
  verify(): boolean
}

// Subscription Aggregate
class Subscription {
  constructor(
    public readonly id: SubscriptionId,
    private plan: Plan,
    private credits: Credits,
    private status: SubscriptionStatus,
  ) {}

  deductCredits(amount: number): Result<void, InsufficientCreditsError>
  upgrade(newPlan: Plan): void
  cancel(): void
  isActive(): boolean
}
```

### **Use Cases:**

```typescript
// CaptureScreenshotUseCase.ts
export class CaptureScreenshotUseCase {
  constructor(
    private screenshotService: IScreenshotService,
    private apiKeyRepository: IApiKeyRepository,
    private subscriptionRepository: ISubscriptionRepository,
    private usageLogger: IUsageLogger,
    private rateLimiter: IRateLimiter,
  ) {}

  async execute(
    request: CaptureScreenshotRequest
  ): Promise<Result<ScreenshotResult, UseCaseError>> {
    // 1. Validate API key
    const apiKeyResult = await this.apiKeyRepository.findByKey(request.apiKey);
    if (apiKeyResult.isFailure()) {
      return failure(new InvalidApiKeyError());
    }

    // 2. Check rate limit
    const rateLimitResult = await this.rateLimiter.check(apiKeyResult.value);
    if (!rateLimitResult.allowed) {
      return failure(new RateLimitExceededError());
    }

    // 3. Check credits
    const subscription = await this.subscriptionRepository.findByUser(
      apiKeyResult.value.userId
    );
    if (subscription.credits.remaining === 0) {
      return failure(new InsufficientCreditsError());
    }

    // 4. Validate URL (Anti-SSRF)
    const urlValidation = UrlValidator.validate(request.url);
    if (urlValidation.isFailure()) {
      return failure(new InvalidUrlError(urlValidation.error));
    }

    // 5. Capture screenshot
    const screenshotResult = await this.screenshotService.capture({
      url: request.url,
      options: request.options,
    });

    if (screenshotResult.isFailure()) {
      await this.usageLogger.logFailure({
        userId: apiKeyResult.value.userId,
        error: screenshotResult.error,
      });
      return failure(screenshotResult.error);
    }

    // 6. Deduct credits
    await subscription.deductCredits(1);
    await this.subscriptionRepository.save(subscription);

    // 7. Log usage
    await this.usageLogger.logSuccess({
      userId: apiKeyResult.value.userId,
      screenshot: screenshotResult.value,
    });

    return success(screenshotResult.value);
  }
}
```

### **Tests:**

```typescript
// CaptureScreenshotUseCase.test.ts
describe('CaptureScreenshotUseCase', () => {
  let useCase: CaptureScreenshotUseCase;
  let mockScreenshotService: MockScreenshotService;
  let mockApiKeyRepository: MockApiKeyRepository;
  let mockSubscriptionRepository: MockSubscriptionRepository;

  beforeEach(() => {
    mockScreenshotService = new MockScreenshotService();
    mockApiKeyRepository = new MockApiKeyRepository();
    mockSubscriptionRepository = new MockSubscriptionRepository();
    
    useCase = new CaptureScreenshotUseCase(
      mockScreenshotService,
      mockApiKeyRepository,
      mockSubscriptionRepository,
      new MockUsageLogger(),
      new MockRateLimiter()
    );
  });

  describe('when API key is valid', () => {
    it('should capture screenshot successfully', async () => {
      // Arrange
      const request = CaptureScreenshotRequestBuilder
        .create()
        .withUrl('https://example.com')
        .withFormat('PNG')
        .build();

      mockApiKeyRepository.setApiKey(validApiKey);
      mockSubscriptionRepository.setSubscription(activeSubscription);
      mockScreenshotService.setResponse(successResult);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.value.format).toBe('PNG');
      expect(mockSubscriptionRepository.lastSaved.credits.remaining).toBe(99);
    });
  });

  describe('when API key is invalid', () => {
    it('should return InvalidApiKeyError', async () => {
      // Arrange
      mockApiKeyRepository.setApiKey(null);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.error).toBeInstanceOf(InvalidApiKeyError);
    });
  });

  describe('when rate limit is exceeded', () => {
    it('should return RateLimitExceededError', async () => {
      // Test implementation
    });
  });

  describe('when credits are insufficient', () => {
    it('should return InsufficientCreditsError', async () => {
      // Test implementation
    });
  });

  describe('when URL is SSRF attempt', () => {
    it.each([
      'http://localhost',
      'http://127.0.0.1',
      'http://169.254.169.254',
      'http://10.0.0.1',
    ])('should reject %s', async (url) => {
      // Test implementation
    });
  });
});
```

---

## 🔗 **2. URL SHORTENER - Architecture Clean**

### **Domain Entities:**

```typescript
// ShortUrl Entity
class ShortUrl {
  constructor(
    public readonly id: ShortUrlId,
    private originalUrl: URL,
    private slug: Slug,
    private customDomain: CustomDomain | null,
    private expiresAt: Date | null,
    private password: Password | null,
    private clicks: ClickCounter,
  ) {}

  static create(params: CreateShortUrlParams): Result<ShortUrl, DomainError>
  isExpired(): boolean
  requiresPassword(): boolean
  verifyPassword(password: string): boolean
  recordClick(visitor: Visitor): void
  getDestinationUrl(): URL
}

// Slug Value Object
class Slug {
  private constructor(private readonly value: string) {}
  
  static generate(): Slug
  static fromString(value: string): Result<Slug, InvalidSlugError>
  static validateCustom(value: string): Result<void, ValidationError>
  toString(): string
}

// Analytics Aggregate
class Analytics {
  constructor(
    public readonly shortUrlId: ShortUrlId,
    private clicks: Click[],
  ) {}

  recordClick(click: Click): void
  getStats(period: TimePeriod): AnalyticsStats
  getTopCountries(limit: number): CountryStats[]
  getTopReferrers(limit: number): ReferrerStats[]
  getDeviceBreakdown(): DeviceStats
}
```

### **Use Cases:**

```typescript
// CreateShortUrlUseCase.ts
export class CreateShortUrlUseCase {
  constructor(
    private shortUrlRepository: IShortUrlRepository,
    private slugGenerator: ISlugGenerator,
    private urlValidator: IUrlValidator,
    private subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(
    request: CreateShortUrlRequest
  ): Promise<Result<ShortUrlDto, UseCaseError>> {
    // 1. Validate original URL
    const urlValidation = await this.urlValidator.validate(request.originalUrl);
    if (urlValidation.isFailure()) {
      return failure(new InvalidUrlError());
    }

    // 2. Generate or validate custom slug
    let slug: Slug;
    if (request.customSlug) {
      const slugValidation = Slug.validateCustom(request.customSlug);
      if (slugValidation.isFailure()) {
        return failure(new InvalidSlugError());
      }
      
      const exists = await this.shortUrlRepository.existsBySlug(request.customSlug);
      if (exists) {
        return failure(new SlugAlreadyExistsError());
      }
      
      slug = Slug.fromString(request.customSlug).value;
    } else {
      slug = await this.slugGenerator.generate();
    }

    // 3. Check subscription limits
    const subscription = await this.subscriptionRepository.findByUser(request.userId);
    if (!subscription.canCreateShortUrl()) {
      return failure(new SubscriptionLimitExceededError());
    }

    // 4. Create short URL
    const shortUrl = ShortUrl.create({
      originalUrl: request.originalUrl,
      slug,
      customDomain: request.customDomain,
      expiresAt: request.expiresAt,
      password: request.password,
      userId: request.userId,
    });

    if (shortUrl.isFailure()) {
      return failure(shortUrl.error);
    }

    // 5. Save
    await this.shortUrlRepository.save(shortUrl.value);

    return success(ShortUrlMapper.toDto(shortUrl.value));
  }
}

// RedirectShortUrlUseCase.ts
export class RedirectShortUrlUseCase {
  constructor(
    private shortUrlRepository: IShortUrlRepository,
    private analyticsService: IAnalyticsService,
  ) {}

  async execute(
    request: RedirectRequest
  ): Promise<Result<RedirectResult, UseCaseError>> {
    // 1. Find short URL
    const shortUrl = await this.shortUrlRepository.findBySlug(request.slug);
    if (!shortUrl) {
      return failure(new ShortUrlNotFoundError());
    }

    // 2. Check expiration
    if (shortUrl.isExpired()) {
      return failure(new ShortUrlExpiredError());
    }

    // 3. Check password
    if (shortUrl.requiresPassword()) {
      if (!request.password) {
        return failure(new PasswordRequiredError());
      }
      if (!shortUrl.verifyPassword(request.password)) {
        return failure(new InvalidPasswordError());
      }
    }

    // 4. Record analytics
    const visitor = Visitor.fromRequest(request);
    shortUrl.recordClick(visitor);
    await this.analyticsService.recordClick({
      shortUrlId: shortUrl.id,
      visitor,
      timestamp: new Date(),
    });

    // 5. Return destination
    return success({
      destinationUrl: shortUrl.getDestinationUrl(),
      statusCode: 307, // Temporary redirect
    });
  }
}
```

### **Features Premium:**

1. **Custom Slugs** - `/my-custom-link`
2. **Custom Domains** - `go.mycompany.com/link`
3. **Password Protection** - Liens protégés
4. **Link Expiration** - Auto-expiration
5. **Analytics Avancées** - Géolocalisation, devices, referrers
6. **QR Codes** - Génération automatique
7. **Link Bundles** - Groupes de liens
8. **Team Management** - Multi-utilisateurs
9. **API Access** - Intégration programmatique
10. **Branded Pages** - Pages de redirection customisées

---

## 🧪 **STRATÉGIE DE TESTS:**

### **Tests Unitaires (70%):**

```typescript
// Domain logic pure
describe('Screenshot Entity', () => {
  it('should create valid screenshot', () => {});
  it('should reject invalid dimensions', () => {});
  it('should validate format', () => {});
});

describe('ApiKey Value Object', () => {
  it('should generate valid key', () => {});
  it('should validate format', () => {});
});
```

### **Tests d'Intégration (20%):**

```typescript
// Repository + Database
describe('ScreenshotRepository', () => {
  it('should save and retrieve screenshot', async () => {
    const screenshot = ScreenshotFactory.create();
    await repository.save(screenshot);
    const found = await repository.findById(screenshot.id);
    expect(found).toEqual(screenshot);
  });
});

// External services
describe('PlaywrightService', () => {
  it('should capture real screenshot', async () => {
    const result = await service.capture({
      url: 'https://example.com',
    });
    expect(result.isSuccess()).toBe(true);
    expect(result.value.buffer).toBeInstanceOf(Buffer);
  });
});
```

### **Tests E2E (10%):**

```typescript
// Full API flows
describe('POST /api/v1/screenshot', () => {
  it('should capture screenshot with valid API key', async () => {
    const response = await request(app)
      .post('/api/v1/screenshot')
      .set('x-api-key', validApiKey)
      .send({ url: 'https://example.com' });
      
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.body).toBeInstanceOf(Buffer);
  });

  it('should reject SSRF attempt', async () => {
    const response = await request(app)
      .post('/api/v1/screenshot')
      .set('x-api-key', validApiKey)
      .send({ url: 'http://localhost' });
      
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid URL');
  });
});
```

---

## 🚀 **CI/CD PIPELINE:**

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm lint
      
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm typecheck
      
  test-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:unit --coverage
      - uses: codecov/codecov-action@v3
      
  test-integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:integration
      
  test-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: npx playwright install
      - run: pnpm test:e2e
      
  build:
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test-unit, test-integration, test-e2e]
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm build
      
  deploy-staging:
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/develop'
    steps:
      - name: Deploy to Fly.io staging
        run: flyctl deploy -a screenapi-staging
```

---

## 📊 **TECH STACK:**

### **Monorepo:**
- **Turborepo** - Build system optimisé
- **pnpm** - Package manager performant

### **Backend:**
- **Next.js 15** - App Router + Server Actions
- **TypeScript 5** - Strict mode
- **Prisma 6** - ORM type-safe
- **Zod** - Runtime validation
- **Playwright** - Browser automation

### **Frontend:**
- **React 19** - Server Components
- **Tailwind CSS 4** - Utility-first
- **shadcn/ui** - Component library
- **TanStack Query** - Data fetching

### **Testing:**
- **Vitest** - Test runner (fast)
- **Playwright Test** - E2E
- **MSW** - API mocking
- **Testing Library** - React testing

### **Infrastructure:**
- **PostgreSQL 15** - Database
- **Redis 7** - Cache + rate limiting
- **S3** - Screenshot storage
- **Fly.io** - Hosting

### **Observability:**
- **Sentry** - Error tracking
- **Axiom** - Structured logging
- **OpenTelemetry** - Traces + metrics

---

## 🎯 **AVANTAGES ARCHITECTURE CLEAN:**

✅ **Testabilité** - 90%+ coverage facile
✅ **Maintenabilité** - Code découplé
✅ **Scalabilité** - Couches indépendantes
✅ **Flexibilité** - Swap infra facilement
✅ **Documentation** - Domain explicite
✅ **Onboarding** - Structure claire
✅ **Performance** - Optimisations ciblées
✅ **Sécurité** - Validation centralisée

---

## ⏱️ **PLAN D'IMPLÉMENTATION:**

### **Sprint 1 - Foundation (Core)**
- Setup monorepo Turborepo
- Shared packages (types, ui, config)
- Database schema Prisma
- CI/CD pipeline
- **Tests:** Infrastructure tests

### **Sprint 2 - ScreenAPI Domain**
- Entities + Value Objects
- Use Cases
- Repository interfaces
- **Tests:** Domain unit tests (TDD)

### **Sprint 3 - ScreenAPI Infrastructure**
- Playwright service
- Prisma repositories
- Redis rate limiter
- S3 storage
- **Tests:** Integration tests

### **Sprint 4 - ScreenAPI API**
- Next.js routes
- API validation
- Error handling
- **Tests:** E2E tests

### **Sprint 5 - URL Shortener Domain**
- Entities + Value Objects
- Use Cases
- **Tests:** Domain unit tests

### **Sprint 6 - URL Shortener Infrastructure**
- Repositories
- Analytics service
- QR code generator
- **Tests:** Integration tests

### **Sprint 7 - URL Shortener API**
- Next.js routes
- Redirect handler
- Analytics endpoints
- **Tests:** E2E tests

### **Sprint 8 - Frontend**
- Landing pages
- Dashboards
- Documentation
- **Tests:** Component tests

### **Sprint 9 - Monitoring**
- Sentry integration
- Logging
- Metrics
- Alerts

### **Sprint 10 - Production**
- Load testing
- Security audit
- Performance optimization
- Documentation

---

**Cette architecture garantit:**
- 🧪 Couverture de tests >80%
- 📝 Code documenté et maintenable
- 🚀 Performance optimale
- 🔒 Sécurité robuste
- 📈 Scalabilité illimitée

**Voulez-vous que je commence l'implémentation?**
