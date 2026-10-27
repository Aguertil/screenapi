import { prisma } from '@repo/database';
import Link from 'next/link';

async function getDashboardData() {
  try {
    const user = await prisma.user.findFirst({
      include: {
        apiKeys: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            key: true,
            rateLimit: true,
            createdAt: true,
            lastUsedAt: true,
          },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return {
        hasUser: false,
        requestsToday: 0,
        creditsRemaining: 0,
        apiKeys: [],
        subscription: null,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const requestsToday = await prisma.screenshotUsageLog.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: today,
        },
      },
    });

    return {
      hasUser: true,
      user: {
        email: user.email,
        name: user.name,
      },
      requestsToday,
      creditsRemaining: user.subscriptions[0]?.creditsRemaining || 0,
      apiKeys: user.apiKeys.map(key => ({
        ...key,
        keyPrefix: key.key.substring(0, 25) + '...',
      })),
      subscription: user.subscriptions[0] || null,
    };
  } catch (error) {
    console.error('Dashboard error:', error);
    return {
      hasUser: false,
      requestsToday: 0,
      creditsRemaining: 0,
      apiKeys: [],
      subscription: null,
    };
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data.hasUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8">
            <h1 className="text-3xl font-bold text-white mb-4">Welcome to ScreenAPI</h1>
            <p className="text-gray-300 mb-6">Create your first account to get started</p>
            <Link 
              href="/api/admin/setup"
              className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Create Account →
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              <Link href="/docs" className="text-gray-300 hover:text-white transition">
                Docs
              </Link>
              <Link href="/dashboard" className="text-white font-semibold">
                Dashboard
              </Link>
              <div className="bg-white/10 px-3 py-1 rounded-lg">
                <span className="text-sm text-gray-300">{data.user?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-300">Monitor your API usage and manage your account</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-300 text-sm font-medium">Requests Today</h3>
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-white mb-2">{data.requestsToday}</div>
            <div className="text-green-400 text-sm">+12% from yesterday</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-300 text-sm font-medium">Credits Remaining</h3>
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-white mb-2">{data.creditsRemaining.toLocaleString()}</div>
            <div className="text-gray-400 text-sm">of {data.subscription?.creditsTotal.toLocaleString()} total</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-300 text-sm font-medium">Active Keys</h3>
              <div className="bg-green-500/20 p-2 rounded-lg">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-white mb-2">{data.apiKeys.length}</div>
            <div className="text-gray-400 text-sm">API keys configured</div>
          </div>
        </div>

        {/* Subscription Card */}
        {data.subscription && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 mb-12">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white text-2xl font-bold mb-2">{data.subscription.plan} Plan</h3>
                <p className="text-white/80">
                  {data.subscription.creditsUsed.toLocaleString()} of {data.subscription.creditsTotal.toLocaleString()} credits used
                </p>
                <div className="mt-4 bg-white/20 rounded-full h-3 w-64">
                  <div 
                    className="bg-white h-3 rounded-full transition-all"
                    style={{ width: `${(data.subscription.creditsUsed / data.subscription.creditsTotal) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-block px-4 py-2 rounded-lg font-semibold ${
                  data.subscription.status === 'ACTIVE' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {data.subscription.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* API Keys */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">API Keys</h2>
            <Link 
              href="/api/admin/setup"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
            >
              Create New Key
            </Link>
          </div>

          {data.apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-300 mb-4">No API keys yet</p>
              <Link 
                href="/api/admin/setup"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition"
              >
                Create Your First Key
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {data.apiKeys.map((key) => (
                <div key={key.id} className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-2">{key.name}</h3>
                      <code className="text-sm text-gray-300 bg-black/30 px-3 py-1 rounded">{key.keyPrefix}</code>
                      <div className="mt-3 flex items-center space-x-6 text-sm text-gray-400">
                        <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                        {key.lastUsedAt && (
                          <span>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold mb-1">{key.rateLimit} req/min</div>
                      <div className="text-gray-400 text-sm">Rate limit</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Link 
            href="/docs"
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/15 transition group"
          >
            <div className="text-3xl mb-3">📚</div>
            <h3 className="text-white font-semibold mb-2 group-hover:text-purple-400 transition">Documentation</h3>
            <p className="text-gray-400 text-sm">Learn how to integrate ScreenAPI</p>
          </Link>

          <Link 
            href="/api/health"
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/15 transition group"
          >
            <div className="text-3xl mb-3">💚</div>
            <h3 className="text-white font-semibold mb-2 group-hover:text-purple-400 transition">API Status</h3>
            <p className="text-gray-400 text-sm">Check system health and uptime</p>
          </Link>

          <a 
            href="https://github.com/Aguertil/screenapi"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/15 transition group"
          >
            <div className="text-3xl mb-3">💻</div>
            <h3 className="text-white font-semibold mb-2 group-hover:text-purple-400 transition">GitHub</h3>
            <p className="text-gray-400 text-sm">View source code and contribute</p>
          </a>
        </div>
      </div>
    </div>
  );
}
