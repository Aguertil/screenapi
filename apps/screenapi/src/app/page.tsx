export default function Home() {
  return (
    <div style={{ fontFamily: 'system-ui', padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>ScreenAPI</h1>
      <p>Professional Screenshot API Service</p>
      
      <h2>API Endpoints</h2>
      <ul>
        <li><code>POST /api/v1/screenshot</code> - Capture screenshot</li>
        <li><code>GET /api/health</code> - Health check</li>
        <li><code>POST /api/admin/setup</code> - Create test user (dev only)</li>
      </ul>

      <h2>Quick Start</h2>
      <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
{`# 1. Create test user
curl -X POST http://localhost:43210/api/admin/setup

# 2. Use the returned API key
curl -X POST http://localhost:43210/api/v1/screenshot \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}' \\
  --output screenshot.png`}
      </pre>

      <h2>Documentation</h2>
      <p>
        Full API documentation available at <code>/docs</code>
      </p>
    </div>
  );
}
