export default function DocsPage() {
  return (
    <div style={{ fontFamily: 'system-ui', padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>ScreenAPI Documentation</h1>
      
      <section style={{ marginTop: '2rem' }}>
        <h2>Getting Started</h2>
        <p>ScreenAPI is a professional screenshot API service built with Clean Architecture principles.</p>
        
        <h3>1. Create an API Key</h3>
        <p>In development mode, create a test user:</p>
        <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
{`curl -X POST http://localhost:43210/api/admin/setup`}
        </pre>
        
        <p>You'll receive a response with your API key:</p>
        <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
{`{
  "apiKey": {
    "key": "sk_test_xxx...",
    "rateLimit": 60
  },
  "subscription": {
    "plan": "PRO",
    "creditsRemaining": 5000
  }
}`}
        </pre>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>API Endpoint</h2>
        <p><code>POST /api/v1/screenshot</code></p>
        
        <h3>Request Headers</h3>
        <ul>
          <li><code>x-api-key</code> - Your API key (required)</li>
          <li><code>Content-Type: application/json</code></li>
        </ul>
        
        <h3>Request Body</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Parameter</th>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Type</th>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Required</th>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '0.5rem' }}><code>url</code></td>
              <td style={{ padding: '0.5rem' }}>string</td>
              <td style={{ padding: '0.5rem' }}>✅</td>
              <td style={{ padding: '0.5rem' }}>URL to capture</td>
            </tr>
            <tr style={{ background: '#f9f9f9' }}>
              <td style={{ padding: '0.5rem' }}><code>format</code></td>
              <td style={{ padding: '0.5rem' }}>PNG | JPEG | WEBP</td>
              <td style={{ padding: '0.5rem' }}>❌</td>
              <td style={{ padding: '0.5rem' }}>Image format (default: PNG)</td>
            </tr>
            <tr>
              <td style={{ padding: '0.5rem' }}><code>quality</code></td>
              <td style={{ padding: '0.5rem' }}>number (1-100)</td>
              <td style={{ padding: '0.5rem' }}>❌</td>
              <td style={{ padding: '0.5rem' }}>JPEG quality</td>
            </tr>
            <tr style={{ background: '#f9f9f9' }}>
              <td style={{ padding: '0.5rem' }}><code>viewportType</code></td>
              <td style={{ padding: '0.5rem' }}>DESKTOP | MOBILE | TABLET | CUSTOM</td>
              <td style={{ padding: '0.5rem' }}>❌</td>
              <td style={{ padding: '0.5rem' }}>Viewport preset (default: DESKTOP)</td>
            </tr>
            <tr>
              <td style={{ padding: '0.5rem' }}><code>fullPage</code></td>
              <td style={{ padding: '0.5rem' }}>boolean</td>
              <td style={{ padding: '0.5rem' }}>❌</td>
              <td style={{ padding: '0.5rem' }}>Capture full page (default: false)</td>
            </tr>
            <tr style={{ background: '#f9f9f9' }}>
              <td style={{ padding: '0.5rem' }}><code>blockCookies</code></td>
              <td style={{ padding: '0.5rem' }}>boolean</td>
              <td style={{ padding: '0.5rem' }}>❌</td>
              <td style={{ padding: '0.5rem' }}>Hide cookie banners (default: true)</td>
            </tr>
            <tr>
              <td style={{ padding: '0.5rem' }}><code>blockAds</code></td>
              <td style={{ padding: '0.5rem' }}>boolean</td>
              <td style={{ padding: '0.5rem' }}>❌</td>
              <td style={{ padding: '0.5rem' }}>Block ads (default: false)</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Examples</h2>
        
        <h3>cURL</h3>
        <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
{`curl -X POST http://localhost:43210/api/v1/screenshot \\
  -H "x-api-key: sk_test_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "format": "PNG",
    "viewportType": "DESKTOP",
    "fullPage": false
  }' \\
  --output screenshot.png`}
        </pre>
        
        <h3>JavaScript/TypeScript</h3>
        <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
{`const response = await fetch('http://localhost:43210/api/v1/screenshot', {
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
// Save or process the screenshot buffer`}
        </pre>
        
        <h3>Python</h3>
        <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
{`import requests

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
    f.write(response.content)`}
        </pre>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Response Headers</h2>
        <ul>
          <li><code>Content-Type</code> - image/png, image/jpeg, or image/webp</li>
          <li><code>X-Screenshot-Width</code> - Screenshot width in pixels</li>
          <li><code>X-Screenshot-Height</code> - Screenshot height in pixels</li>
          <li><code>X-Processing-Time-Ms</code> - Total processing time</li>
          <li><code>X-Capture-Duration-Ms</code> - Capture duration</li>
        </ul>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Error Codes</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Code</th>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>HTTP Status</th>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '0.5rem' }}><code>MISSING_API_KEY</code></td>
              <td style={{ padding: '0.5rem' }}>401</td>
              <td style={{ padding: '0.5rem' }}>API key not provided</td>
            </tr>
            <tr style={{ background: '#f9f9f9' }}>
              <td style={{ padding: '0.5rem' }}><code>INVALID_API_KEY</code></td>
              <td style={{ padding: '0.5rem' }}>401</td>
              <td style={{ padding: '0.5rem' }}>Invalid or expired API key</td>
            </tr>
            <tr>
              <td style={{ padding: '0.5rem' }}><code>RATE_LIMIT_EXCEEDED</code></td>
              <td style={{ padding: '0.5rem' }}>429</td>
              <td style={{ padding: '0.5rem' }}>Rate limit exceeded</td>
            </tr>
            <tr style={{ background: '#f9f9f9' }}>
              <td style={{ padding: '0.5rem' }}><code>INSUFFICIENT_CREDITS</code></td>
              <td style={{ padding: '0.5rem' }}>402</td>
              <td style={{ padding: '0.5rem' }}>Not enough credits</td>
            </tr>
            <tr>
              <td style={{ padding: '0.5rem' }}><code>VALIDATION_ERROR</code></td>
              <td style={{ padding: '0.5rem' }}>400</td>
              <td style={{ padding: '0.5rem' }}>Invalid request parameters</td>
            </tr>
            <tr style={{ background: '#f9f9f9' }}>
              <td style={{ padding: '0.5rem' }}><code>TIMEOUT</code></td>
              <td style={{ padding: '0.5rem' }}>504</td>
              <td style={{ padding: '0.5rem' }}>Request timeout</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Rate Limits</h2>
        <ul>
          <li><strong>FREE:</strong> 10 requests/minute</li>
          <li><strong>PRO:</strong> 60 requests/minute</li>
          <li><strong>ENTERPRISE:</strong> 300 requests/minute</li>
        </ul>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Security</h2>
        <h3>Anti-SSRF Protection</h3>
        <p>The API automatically blocks dangerous URLs:</p>
        <ul>
          <li>❌ Localhost (127.0.0.1, ::1)</li>
          <li>❌ Private IPs (10.x, 172.16.x, 192.168.x)</li>
          <li>❌ Link-local (169.254.x.x)</li>
          <li>❌ Internal domains (.internal, .flycast, .local)</li>
          <li>❌ Cloud metadata services</li>
        </ul>
      </section>

      <section style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        <h2>Support</h2>
        <p>
          Need help? Check the <a href="/">homepage</a> or <a href="/api/health">health status</a>.
        </p>
      </section>
    </div>
  );
}
