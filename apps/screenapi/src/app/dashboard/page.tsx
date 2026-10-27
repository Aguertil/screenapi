import { prisma } from '@repo/database';

async function getDashboardData() {
  try {
    // Get first user (for demo)
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

    // Count requests today
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
        keyPrefix: key.key.substring(0, 20) + '...',
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
      <div style={{ fontFamily: 'system-ui', padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Dashboard</h1>
        <div style={{ background: '#fff3cd', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
          <p><strong>No user found.</strong></p>
          <p>Create a test user first:</p>
          <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px', marginTop: '1rem', overflow: 'auto' }}>
{`curl -X POST http://localhost:43210/api/admin/setup`}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui', padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dashboard</h1>
        <a href="/" style={{ color: '#0066cc' }}>← Home</a>
      </div>

      {data.user && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
          <p><strong>{data.user.name || data.user.email}</strong></p>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
        <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
          <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem' }}>Requests Today</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#212529' }}>{data.requestsToday}</div>
        </div>

        <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
          <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem' }}>Credits Remaining</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#212529' }}>{data.creditsRemaining.toLocaleString()}</div>
        </div>

        <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
          <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem' }}>Active API Keys</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#212529' }}>{data.apiKeys.length}</div>
        </div>
      </div>

      {/* Subscription */}
      {data.subscription && (
        <section style={{ marginTop: '2rem' }}>
          <h2>Subscription</h2>
          <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '4px', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>{data.subscription.plan}</strong>
                <span style={{ marginLeft: '1rem', padding: '0.25rem 0.5rem', background: data.subscription.status === 'ACTIVE' ? '#d4edda' : '#f8d7da', borderRadius: '4px', fontSize: '0.875rem' }}>
                  {data.subscription.status}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                  {data.subscription.creditsUsed.toLocaleString()} / {data.subscription.creditsTotal.toLocaleString()} credits used
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* API Keys */}
      <section style={{ marginTop: '2rem' }}>
        <h2>API Keys</h2>
        {data.apiKeys.length === 0 ? (
          <div style={{ padding: '1rem', background: '#fff3cd', borderRadius: '4px', marginTop: '1rem' }}>
            <p>No API keys found. Create one using <code>/api/admin/setup</code></p>
          </div>
        ) : (
          <div style={{ marginTop: '1rem' }}>
            {data.apiKeys.map((key) => (
              <div key={key.id} style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '4px', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{key.name}</div>
                    <code style={{ fontSize: '0.875rem', color: '#6c757d' }}>{key.keyPrefix}</code>
                    <div style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '0.5rem' }}>
                      Created: {new Date(key.createdAt).toLocaleDateString()}
                      {key.lastUsedAt && ` • Last used: ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem' }}>Rate Limit:</div>
                    <div style={{ fontWeight: 'bold' }}>{key.rateLimit} req/min</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Links */}
      <section style={{ marginTop: '2rem' }}>
        <h2>Quick Links</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <a href="/docs" style={{ padding: '1rem', background: '#007bff', color: 'white', borderRadius: '4px', textDecoration: 'none', textAlign: 'center' }}>
            📚 Documentation
          </a>
          <a href="/api/health" style={{ padding: '1rem', background: '#28a745', color: 'white', borderRadius: '4px', textDecoration: 'none', textAlign: 'center' }}>
            💚 Health Check
          </a>
          <a href="/api/admin/setup" style={{ padding: '1rem', background: '#ffc107', color: 'black', borderRadius: '4px', textDecoration: 'none', textAlign: 'center' }}>
            🔑 Create API Key
          </a>
        </div>
      </section>
    </div>
  );
}
