# ScreenAPI - Professional Screenshot & Web Scraping Platform

**A production-ready B2B SaaS API for screenshots and web scraping, built with Clean Architecture and modern TypeScript.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.1-black.svg)](https://nextjs.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.64-green.svg)](https://playwright.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-brightgreen.svg)](https://www.prisma.io/)

---

## 🚀 Quick Start (Docker)

```bash
# 1. Clone and navigate
git clone https://github.com/Aguertil/screenapi.git
cd screenapi

# 2. Start with Docker Compose
docker-compose up --build

# 3. Access the app
# → http://localhost:43210
# → Playground: http://localhost:43210/playground
# → Docs: http://localhost:43210/docs
```

**Done!** 🎉 Your API is running locally with PostgreSQL and Redis.

---

## ✨ Features

### 📸 Screenshot API
- **20+ Device Presets** - iPhone 12/13/14/15, Samsung Galaxy, Pixel, iPad, MacBook
- **Multiple Formats** - PNG, JPEG, WEBP
- **Full-Page Capture** - Capture entire scrollable pages
- **Custom Viewports** - Any width×height combination
- **Wait for Elements** - Wait for specific selectors before capture
- **Cookie Banner Blocking** - Auto-hide common cookie banners
- **Ad Blocking** - Optional ad blocking

### 🕷️ Web Scraping API
- **Extract Metadata** - Title, description, Open Graph, Twitter Cards
- **Extract Text** - Full page text or specific selectors
- **Extract Links** - All links with text and href
- **Extract Images** - All images with alt text and src
- **Custom Selectors** - Target specific page elements
- **Wait for Content** - Wait for dynamic content to load

### 🔐 Security & Performance
- **API Key Authentication** - Secure access control
- **Rate Limiting** - Redis-backed with configurable limits
- **Credit Management** - Usage tracking per user
- **Anti-SSRF Protection** - Blocks localhost, private IPs, cloud metadata
- **Browser Pooling** - Reuse browser instances for speed
- **Request Logging** - Complete audit trail

### 🎯 Developer Experience
- **Interactive Playground** - Test API directly in browser
- **Complete Documentation** - Examples in 7+ languages
- **Live Dashboard** - Monitor usage and credits
- **Type-Safe** - Full TypeScript support
- **70+ Tests** - Unit + E2E coverage
- **Health Checks** - Monitor service status

---

## 📱 Device Presets

### iPhones
- `iphone-15-pro-max` (430×932)
- `iphone-15-pro` (393×852)
- `iphone-14-pro-max` (430×932)
- `iphone-14` (390×844)
- `iphone-13` (390×844)
- `iphone-12` (390×844)
- `iphone-se` (375×667)

### Android
- `galaxy-s24-ultra` (412×915)
- `galaxy-s23` (360×780)
- `galaxy-a54` (412×915)
- `pixel-8-pro` (412×915)
- `pixel-7` (412×915)

### Tablets
- `ipad-pro-12.9` (1024×1366)
- `ipad-air` (820×1180)
- `galaxy-tab-s9` (800×1280)

### Desktop
- `desktop-1920` (1920×1080 Full HD)
- `desktop-1440` (2560×1440 2K)
- `macbook-pro-16` (1728×1117)

---

## 📚 API Endpoints

### Screenshot API

```bash
POST /api/v1/screenshot
```

**Request:**
```json
{
  "url": "https://example.com",
  "devicePreset": "iphone-15-pro",
  "format": "PNG",
  "fullPage": false
}
```

**Response:** Binary image data (PNG/JPEG/WEBP)

### Web Scraping API

```bash
POST /api/v1/scrape
```

**Request:**
```json
{
  "url": "https://example.com",
  "extractMetadata": true,
  "extractText": true,
  "extractLinks": false,
  "extractImages": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://example.com",
    "title": "Example Domain",
    "metadata": {
      "description": "Example page",
      "ogTitle": "Example Domain",
      "ogImage": "https://example.com/og.jpg"
    },
    "text": "This domain is for use in...",
    "timestamp": "2026-10-28T09:00:00.000Z"
  }
}
```

### Device List

```bash
GET /api/v1/devices
```

Returns all available device presets grouped by category (phone, tablet, desktop).

---

## 💻 Code Examples

### JavaScript

```javascript
const response = await fetch('http://localhost:43210/api/v1/screenshot', {
  method: 'POST',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com',
    devicePreset: 'iphone-15-pro',
    format: 'PNG'
  })
});

const blob = await response.blob();
// Save or display the screenshot
```

### Python

```python
import requests

response = requests.post(
    'http://localhost:43210/api/v1/screenshot',
    headers={'x-api-key': 'YOUR_API_KEY'},
    json={
        'url': 'https://example.com',
        'devicePreset': 'iphone-15-pro',
        'format': 'PNG'
    }
)

with open('screenshot.png', 'wb') as f:
    f.write(response.content)
```

### cURL

```bash
curl -X POST http://localhost:43210/api/v1/screenshot \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","devicePreset":"iphone-15-pro"}' \
  --output screenshot.png
```

**More examples:** See [EXAMPLES.md](./EXAMPLES.md) for Go, PHP, Ruby, TypeScript, and more.

---

## 🏗️ Architecture

Built with **Clean Architecture** principles:

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

**Tech Stack:**
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.3
- **Browser Automation:** Playwright 1.64
- **Database:** PostgreSQL + Prisma ORM
- **Caching:** Redis (ioredis)
- **Styling:** Tailwind CSS
- **Testing:** Vitest + Playwright Test
- **Monorepo:** Turborepo + pnpm workspaces

---

## 📁 Project Structure

```
screenapi/
├── apps/
│   └── screenapi/              # Main Next.js application
│       ├── src/
│       │   ├── app/            # Next.js App Router
│       │   │   ├── api/        # API routes
│       │   │   │   ├── v1/
│       │   │   │   │   ├── screenshot/  # Screenshot endpoint
│       │   │   │   │   ├── scrape/      # Web scraping endpoint
│       │   │   │   │   └── devices/     # Device presets endpoint
│       │   │   ├── playground/ # Interactive playground
│       │   │   ├── docs/       # Documentation page
│       │   │   └── dashboard/  # Usage dashboard
│       │   └── core/           # Clean Architecture layers
│       │       └── screenshot/
│       │           ├── domain/          # Entities & Value Objects
│       │           │   └── device-presets.ts  # 20+ device presets
│       │           ├── application/     # Use Cases
│       │           └── infrastructure/  # Implementations
├── packages/
│   ├── database/               # Prisma schema & migrations
│   └── shared-types/           # Shared TypeScript types
├── docker-compose.yml          # PostgreSQL + Redis + App
├── Dockerfile.local            # Docker build config
├── DEVELOPER_GUIDE.md          # Detailed developer guide
└── EXAMPLES.md                 # Code examples in 7+ languages
```

---

## 🚀 Deployment

### Local Development

```bash
# With Docker (recommended)
docker-compose up --build

# Without Docker
pnpm install
pnpm --filter @repo/database db:push
pnpm --filter screenapi dev
```

### Environment Variables

Create `.env.local`:

```env
DATABASE_URL="postgresql://screenapi:password@localhost:5432/screenapi"
REDIS_URL="redis://localhost:6379"
NODE_ENV="development"
NEXT_PUBLIC_API_URL="http://localhost:43210"
```

### Production

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel, Render, Fly.io, and Railway deployment guides.

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# With coverage
pnpm test:coverage
```

---

## 📖 Documentation

- **Developer Guide:** [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
- **Code Examples:** [EXAMPLES.md](./EXAMPLES.md)
- **Deployment:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Interactive Docs:** http://localhost:43210/docs
- **API Playground:** http://localhost:43210/playground

---

## 🎯 Use Cases

### 1. Responsive Design Testing
Test your website on 20+ real device dimensions automatically.

### 2. Visual Regression Testing
Capture screenshots before/after code changes to detect UI breaks.

### 3. SEO Monitoring
Extract Open Graph and Twitter Card metadata from any page.

### 4. Price Monitoring
Scrape product prices and get alerts when they change.

### 5. Content Extraction
Extract article text, links, and images for analysis or archiving.

### 6. Competitive Analysis
Monitor competitor websites for changes in content or design.

---

## 📊 Subscription Tiers

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Screenshots/day | 100 | 10,000 | Unlimited |
| Scraping requests/day | 50 | 5,000 | Unlimited |
| Device presets | ✅ All | ✅ All | ✅ All |
| Rate limits | 10/min | 100/min | Custom |
| Support | Community | Email | Priority + SLA |
| Price | $0 | $49/mo | Contact |

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Browser automation by [Playwright](https://playwright.dev/)
- Database ORM by [Prisma](https://www.prisma.io/)
- UI components with [Tailwind CSS](https://tailwindcss.com/)

---

## 📞 Support

- 📖 **Documentation:** http://localhost:43210/docs
- 🎮 **Playground:** http://localhost:43210/playground
- 📊 **Dashboard:** http://localhost:43210/dashboard
- 💬 **Issues:** [GitHub Issues](https://github.com/Aguertil/screenapi/issues)

---

**Made with ❤️ for developers who need reliable screenshots and web scraping**
