import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-white">ScreenAPI</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/playground" className="text-gray-300 hover:text-white transition">
                Playground
              </Link>
              <Link href="/docs" className="text-gray-300 hover:text-white transition">
                Documentation
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

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Capture Any Website
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              In Milliseconds
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Professional screenshot API built with Playwright. Fast, reliable, and scalable. 
            Perfect for automation, testing, and monitoring.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/api/admin/setup"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition transform hover:scale-105"
            >
              Start Free Trial
            </Link>
            <Link 
              href="/docs"
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg text-lg font-semibold transition backdrop-blur-sm border border-white/20"
            >
              View Documentation
            </Link>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">&lt;800ms</div>
              <div className="text-gray-400">Average Response</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">99.9%</div>
              <div className="text-gray-400">Uptime SLA</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">5000+</div>
              <div className="text-gray-400">API Calls/Day</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Powerful Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🚀",
                title: "Lightning Fast",
                desc: "Browser pooling and smart caching for sub-second responses"
              },
              {
                icon: "🎨",
                title: "Multiple Formats",
                desc: "PNG, JPEG, WEBP with customizable quality settings"
              },
              {
                icon: "📱",
                title: "Responsive Viewports",
                desc: "Desktop, mobile, tablet, or custom viewport sizes"
              },
              {
                icon: "🛡️",
                title: "Anti-SSRF Protection",
                desc: "Built-in security against server-side request forgery"
              },
              {
                icon: "🍪",
                title: "Cookie Banner Blocking",
                desc: "Automatically removes cookie consent popups"
              },
              {
                icon: "⚡",
                title: "Rate Limiting",
                desc: "Redis-backed rate limiting with in-memory fallback"
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/15 transition">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Simple, Transparent Pricing
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Free",
                price: "$0",
                credits: "1,000",
                rate: "10 req/min",
                features: ["Basic screenshots", "PNG format", "Desktop viewport", "Community support"]
              },
              {
                name: "Pro",
                price: "$29",
                credits: "5,000",
                rate: "60 req/min",
                features: ["All formats", "All viewports", "Cookie blocking", "Ad blocking", "Priority support"],
                popular: true
              },
              {
                name: "Enterprise",
                price: "$99",
                credits: "20,000",
                rate: "300 req/min",
                features: ["Everything in Pro", "Custom domains", "SLA guarantee", "Dedicated support", "Custom integrations"]
              }
            ].map((plan, i) => (
              <div 
                key={i} 
                className={`rounded-xl p-8 ${
                  plan.popular 
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 transform scale-105' 
                    : 'bg-white/10 backdrop-blur-sm border border-white/20'
                }`}
              >
                {plan.popular && (
                  <div className="text-sm font-semibold text-white/90 mb-2">MOST POPULAR</div>
                )}
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-white mb-1">{plan.price}<span className="text-xl text-gray-300">/mo</span></div>
                <div className="text-gray-300 mb-6">{plan.credits} credits/month</div>
                <div className="text-sm text-gray-300 mb-6">Rate limit: {plan.rate}</div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center text-gray-200">
                      <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-lg font-semibold transition ${
                  plan.popular 
                    ? 'bg-white text-purple-600 hover:bg-gray-100' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="py-20 px-4 bg-white/5 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Simple to Integrate
          </h2>
          <div className="bg-slate-900 rounded-xl p-8 border border-white/20 overflow-hidden">
            <div className="flex items-center mb-4">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="ml-4 text-gray-400 text-sm">curl</span>
            </div>
            <pre className="text-green-400 text-sm overflow-x-auto">
{`curl -X POST http://localhost:43210/api/v1/screenshot \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "format": "PNG",
    "viewportType": "DESKTOP"
  }' \\
  --output screenshot.png`}
            </pre>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Create your free account and start capturing screenshots in minutes.
          </p>
          <Link 
            href="/api/admin/setup"
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition transform hover:scale-105"
          >
            Start Free Trial →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold mb-4">ScreenAPI</h3>
            <p className="text-gray-400 text-sm">Professional screenshot API for developers</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/docs" className="hover:text-white transition">Documentation</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition">Dashboard</Link></li>
              <li><Link href="/api/health" className="hover:text-white transition">Status</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-white transition">About</a></li>
              <li><a href="#" className="hover:text-white transition">Blog</a></li>
              <li><a href="#" className="hover:text-white transition">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-white transition">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition">Terms</a></li>
              <li><a href="#" className="hover:text-white transition">Security</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-white/10 text-center text-gray-400 text-sm">
          © 2026 ScreenAPI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
