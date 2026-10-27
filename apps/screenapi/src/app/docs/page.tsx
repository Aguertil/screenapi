import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-white">ScreenAPI</Link>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/docs" className="text-white font-semibold">
                Docs
              </Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-white transition">
                Dashboard
              </Link>
              <Link href="/api/admin/setup" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-12">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 sticky top-8">
              <h3 className="text-white font-bold mb-4">On This Page</h3>
              <nav className="space-y-2">
                {[
                  "Quick Start",
                  "Authentication",
                  "Endpoints",
                  "Parameters",
                  "Examples",
                  "Error Codes",
                  "Rate Limits"
                ].map((item) => (
                  <a 
                    key={item}
                    href={`#${item.toLowerCase().replace(' ', '-')}`}
                    className="block text-gray-300 hover:text-white transition text-sm"
                  >
                    {item}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <h1 className="text-5xl font-bold text-white mb-6">Documentation</h1>
            <p className="text-xl text-gray-300 mb-12">
              Everything you need to integrate ScreenAPI into your application
            </p>

            {/* Quick Start */}
            <section id="quick-start" className="mb-16">
              <h2 className="text-3xl font-bold text-white mb-6">Quick Start</h2>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">1. Get Your API Key</h3>
                    <p className="text-gray-300 mb-4">Create a test account to get started</p>
                    <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                      <code className="text-green-400 text-sm">
                        curl -X POST http://localhost:43210/api/admin/setup
                      </code>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">2. Make Your First Request</h3>
                    <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-green-400 text-sm">
{`curl -X POST http://localhost:43210/api/v1/screenshot \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}' \\
  --output screenshot.png`}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">3. View Your Screenshot</h3>
                    <p className="text-gray-300">Open <code className="bg-black/30 px-2 py-1 rounded">screenshot.png</code> - Done! 🎉</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Authentication */}
            <section id="authentication" className="mb-16">
              <h2 className="text-3xl font-bold text-white mb-6">Authentication</h2>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8">
                <p className="text-gray-300 mb-4">
                  All API requests require an API key in the <code className="bg-black/30 px-2 py-1 rounded">x-api-key</code> header:
                </p>
                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                  <code className="text-green-400 text-sm">
                    -H "x-api-key: sk_test_xxxxxxxxxxxxx"
                  </code>
                </div>
              </div>
            </section>

            {/* Endpoints */}
            <section id="endpoints" className="mb-16">
              <h2 className="text-3xl font-bold text-white mb-6">API Endpoints</h2>
              <div className="space-y-6">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Capture Screenshot</h3>
                      <div className="flex items-center space-x-3">
                        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-sm font-semibold">POST</span>
                        <code className="text-gray-300">/api/v1/screenshot</code>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-4">Captures a screenshot of the specified URL</p>
                  <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm">
{`{
  "url": "https://example.com",
  "format": "PNG",
  "viewportType": "DESKTOP",
  "fullPage": false
}`}
                    </pre>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Health Check</h3>
                      <div className="flex items-center space-x-3">
                        <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded text-sm font-semibold">GET</span>
                        <code className="text-gray-300">/api/health</code>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300">Returns the API health status and system checks</p>
                </div>
              </div>
            </section>

            {/* Parameters */}
            <section id="parameters" className="mb-16">
              <h2 className="text-3xl font-bold text-white mb-6">Request Parameters</h2>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="text-left px-6 py-4 text-white font-semibold">Parameter</th>
                        <th className="text-left px-6 py-4 text-white font-semibold">Type</th>
                        <th className="text-left px-6 py-4 text-white font-semibold">Required</th>
                        <th className="text-left px-6 py-4 text-white font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {[
                        ["url", "string", "✅", "URL to capture"],
                        ["format", "PNG | JPEG | WEBP", "❌", "Image format (default: PNG)"],
                        ["quality", "number (1-100)", "❌", "JPEG quality"],
                        ["viewportType", "DESKTOP | MOBILE | TABLET", "❌", "Viewport preset"],
                        ["fullPage", "boolean", "❌", "Capture full page"],
                        ["blockCookies", "boolean", "❌", "Hide cookie banners"],
                        ["blockAds", "boolean", "❌", "Block advertisements"]
                      ].map(([param, type, req, desc], i) => (
                        <tr key={i} className="hover:bg-white/5">
                          <td className="px-6 py-4"><code className="text-purple-400">{param}</code></td>
                          <td className="px-6 py-4 text-gray-300 text-sm">{type}</td>
                          <td className="px-6 py-4 text-gray-300 text-sm">{req}</td>
                          <td className="px-6 py-4 text-gray-300 text-sm">{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Examples */}
            <section id="examples" className="mb-16">
              <h2 className="text-3xl font-bold text-white mb-6">Code Examples</h2>
              <div className="space-y-6">
                {/* cURL */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">cURL</h3>
                  <div className="bg-slate-900 rounded-xl p-6 overflow-x-auto">
                    <pre className="text-green-400 text-sm">
{`curl -X POST http://localhost:43210/api/v1/screenshot \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "format": "PNG",
    "viewportType": "MOBILE"
  }' \\
  --output screenshot.png`}
                    </pre>
                  </div>
                </div>

                {/* JavaScript */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">JavaScript</h3>
                  <div className="bg-slate-900 rounded-xl p-6 overflow-x-auto">
                    <pre className="text-blue-400 text-sm">
{`const response = await fetch('http://localhost:43210/api/v1/screenshot', {
  method: 'POST',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com',
    format: 'PNG',
    viewportType: 'DESKTOP'
  })
});

const buffer = await response.arrayBuffer();
// Save or process the screenshot`}
                    </pre>
                  </div>
                </div>

                {/* Python */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Python</h3>
                  <div className="bg-slate-900 rounded-xl p-6 overflow-x-auto">
                    <pre className="text-yellow-400 text-sm">
{`import requests

response = requests.post(
    'http://localhost:43210/api/v1/screenshot',
    headers={'x-api-key': 'YOUR_API_KEY'},
    json={
        'url': 'https://example.com',
        'format': 'PNG',
        'viewportType': 'DESKTOP'
    }
)

with open('screenshot.png', 'wb') as f:
    f.write(response.content)`}
                    </pre>
                  </div>
                </div>
              </div>
            </section>

            {/* Error Codes */}
            <section id="error-codes" className="mb-16">
              <h2 className="text-3xl font-bold text-white mb-6">Error Codes</h2>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="text-left px-6 py-4 text-white font-semibold">Code</th>
                        <th className="text-left px-6 py-4 text-white font-semibold">Status</th>
                        <th className="text-left px-6 py-4 text-white font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {[
                        ["MISSING_API_KEY", "401", "API key not provided"],
                        ["INVALID_API_KEY", "401", "Invalid or expired API key"],
                        ["RATE_LIMIT_EXCEEDED", "429", "Rate limit exceeded"],
                        ["INSUFFICIENT_CREDITS", "402", "Not enough credits"],
                        ["VALIDATION_ERROR", "400", "Invalid request parameters"],
                        ["TIMEOUT", "504", "Request timeout"]
                      ].map(([code, status, desc], i) => (
                        <tr key={i} className="hover:bg-white/5">
                          <td className="px-6 py-4"><code className="text-red-400">{code}</code></td>
                          <td className="px-6 py-4 text-gray-300">{status}</td>
                          <td className="px-6 py-4 text-gray-300">{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Rate Limits */}
            <section id="rate-limits" className="mb-16">
              <h2 className="text-3xl font-bold text-white mb-6">Rate Limits</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { plan: "Free", rate: "10 req/min", color: "blue" },
                  { plan: "Pro", rate: "60 req/min", color: "purple" },
                  { plan: "Enterprise", rate: "300 req/min", color: "pink" }
                ].map((item, i) => (
                  <div key={i} className={`bg-${item.color}-500/10 border border-${item.color}-500/30 rounded-xl p-6`}>
                    <h3 className={`text-${item.color}-400 font-semibold mb-2`}>{item.plan}</h3>
                    <div className="text-2xl font-bold text-white">{item.rate}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Support */}
            <section className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Need Help?</h2>
              <p className="text-white/90 mb-6">Check out our dashboard or view the system status</p>
              <div className="flex justify-center space-x-4">
                <Link 
                  href="/dashboard"
                  className="bg-white text-purple-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold transition"
                >
                  Go to Dashboard
                </Link>
                <Link 
                  href="/api/health"
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  API Status
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
