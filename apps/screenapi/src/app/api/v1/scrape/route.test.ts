import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = {
  key: null as any,
  rate: { allowed: true, limit: 60, remaining: 59, resetAt: new Date() } as any,
  sub: null as any,
};

vi.mock('@/core/screenshot/infrastructure', () => ({
  PrismaApiKeyRepository: class {
    findByKey = async () => state.key;
    updateLastUsed = async () => {};
  },
  PrismaSubscriptionRepository: class {
    findByUserId = async () => state.sub;
    deductCredits = async () => {};
  },
  RedisRateLimiter: class {
    check = async () => state.rate;
    increment = async () => {};
  },
}));
vi.mock('playwright-core', () => ({ chromium: { launch: vi.fn(() => { throw new Error('browser should not start'); }) } }));

const { POST } = await import('./route');

function req(body: any, key = 'sk_test_x') {
  return new Request('http://localhost/api/v1/scrape', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key },
    body: JSON.stringify(body),
  }) as any;
}

describe('POST /api/v1/scrape', () => {
  beforeEach(() => {
    state.key = { id: 'k1', userId: 'u1', isActive: true, rateLimit: 60, expiresAt: null };
    state.rate = { allowed: true, limit: 60, remaining: 59, resetAt: new Date() };
    state.sub = { id: 's1', status: 'ACTIVE', creditsRemaining: 10 };
  });

  it('refuse une clé inconnue', async () => {
    state.key = null;
    const r = await POST(req({ url: 'https://example.com' }));
    expect(r.status).toBe(401);
  });

  it('refuse au-delà de la limite de débit', async () => {
    state.rate = { allowed: false, limit: 60, remaining: 0, resetAt: new Date(), retryAfter: 30 };
    const r = await POST(req({ url: 'https://example.com' }));
    expect(r.status).toBe(429);
    expect(r.headers.get('Retry-After')).toBe('30');
  });

  it('refuse sans crédits', async () => {
    state.sub.creditsRemaining = 0;
    const r = await POST(req({ url: 'https://example.com' }));
    expect(r.status).toBe(402);
    expect((await r.json()).code).toBe('INSUFFICIENT_CREDITS');
  });

  it('refuse une URL interne même avec une clé valide', async () => {
    const r = await POST(req({ url: 'http://169.254.169.254/latest/meta-data' }));
    expect(r.status).toBe(400);
  });

  it('refuse file://', async () => {
    const r = await POST(req({ url: 'file:///etc/passwd' }));
    expect(r.status).toBe(400);
  });
});
