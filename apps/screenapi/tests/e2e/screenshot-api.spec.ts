import { test, expect } from '@playwright/test';

test.describe('Screenshot API E2E', () => {
  let apiKey: string;

  test.beforeAll(async ({ request }) => {
    // Create test user
    const response = await request.post('/api/admin/setup');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    apiKey = data.apiKey.key;
    expect(apiKey).toBeTruthy();
    expect(apiKey).toMatch(/^sk_test_/);
  });

  test('GET /api/v1/screenshot - should return API info', async ({ request }) => {
    const response = await request.get('/api/v1/screenshot');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.service).toBe('ScreenAPI Screenshot Service');
    expect(data.version).toBe('1.0.0');
    expect(data.status).toBe('operational');
  });

  test('POST /api/v1/screenshot - should fail without API key', async ({ request }) => {
    const response = await request.post('/api/v1/screenshot', {
      data: { url: 'https://example.com' },
    });
    
    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.code).toBe('MISSING_API_KEY');
  });

  test('POST /api/v1/screenshot - should fail with invalid URL', async ({ request }) => {
    const response = await request.post('/api/v1/screenshot', {
      headers: { 'x-api-key': apiKey },
      data: { url: 'not-a-url' },
    });
    
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  test('POST /api/v1/screenshot - should reject SSRF attempts', async ({ request }) => {
    const ssrfUrls = [
      'http://localhost',
      'http://127.0.0.1',
      'http://10.0.0.1',
      'http://169.254.169.254',
    ];

    for (const url of ssrfUrls) {
      const response = await request.post('/api/v1/screenshot', {
        headers: { 'x-api-key': apiKey },
        data: { url },
      });
      
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.message).toContain('not allowed');
    }
  });

  test('POST /api/v1/screenshot - should capture screenshot successfully', async ({ request }) => {
    const response = await request.post('/api/v1/screenshot', {
      headers: { 'x-api-key': apiKey },
      data: {
        url: 'https://example.com',
        format: 'PNG',
        viewportType: 'DESKTOP',
      },
    });
    
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toBe('image/png');
    
    const buffer = await response.body();
    expect(buffer.length).toBeGreaterThan(0);
    
    // Check headers
    expect(response.headers()['x-screenshot-width']).toBeTruthy();
    expect(response.headers()['x-screenshot-height']).toBeTruthy();
    expect(response.headers()['x-processing-time-ms']).toBeTruthy();
  });

  test('POST /api/v1/screenshot - should support different formats', async ({ request }) => {
    const formats = ['PNG', 'JPEG', 'WEBP'];

    for (const format of formats) {
      const response = await request.post('/api/v1/screenshot', {
        headers: { 'x-api-key': apiKey },
        data: {
          url: 'https://example.com',
          format,
        },
      });
      
      expect(response.ok()).toBeTruthy();
      expect(response.headers()['content-type']).toBe(`image/${format.toLowerCase()}`);
    }
  });

  test('POST /api/v1/screenshot - should support mobile viewport', async ({ request }) => {
    const response = await request.post('/api/v1/screenshot', {
      headers: { 'x-api-key': apiKey },
      data: {
        url: 'https://example.com',
        viewportType: 'MOBILE',
      },
    });
    
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['x-screenshot-width']).toBe('375');
  });

  test('GET /api/health - should return health status', async ({ request }) => {
    const response = await request.get('/api/health');
    
    const data = await response.json();
    expect(data.status).toBeTruthy();
    expect(data.checks).toBeTruthy();
    expect(data.checks.database).toBeTruthy();
    expect(data.checks.playwright).toBeTruthy();
  });

  test('POST /api/v1/screenshot - should handle timeout gracefully', async ({ request }) => {
    const response = await request.post('/api/v1/screenshot', {
      headers: { 'x-api-key': apiKey },
      data: {
        url: 'https://httpstat.us/200?sleep=70000', // Will timeout
        waitForTimeout: 5000,
      },
    });
    
    // Should fail with timeout or succeed quickly
    if (!response.ok()) {
      const data = await response.json();
      expect(['TIMEOUT', 'CAPTURE_FAILED']).toContain(data.code);
    }
  });
});
