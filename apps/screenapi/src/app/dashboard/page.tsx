'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
  rateLimit: number;
  lastUsedAt: string | null;
  createdAt: string;
}

interface Usage {
  subscription: {
    plan: string;
    status: string;
    creditsTotal: number;
    creditsUsed: number;
    creditsRemaining: number;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  };
  usage: {
    today: { total: number; successful: number; failed: number };
    thisMonth: { total: number; successful: number; failed: number };
    last7Days: Array<{ date: string; count: number; successful: number; failed: number }>;
  };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
    fetchUsage();
  }, []);

  const fetchKeys = async () => {
    try {
      const response = await fetch('/api/keys');
      const data = await response.json();
      if (data.success) {
        setKeys(data.keys);
      }
    } catch (error) {
      console.error('Failed to fetch keys:', error);
    }
  };

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage');
      const data = await response.json();
      if (data.success) {
        setUsage(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;

    setCreatingKey(true);
    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });

      const data = await response.json();
      if (data.success) {
        setKeys([data.key, ...keys]);
        setNewKeyName('');
        setShowNewKeyDialog(false);
        alert('API Key created successfully! Make sure to copy it now - you won\'t be able to see it again.');
      } else {
        alert(data.error || 'Failed to create API key');
      }
    } catch (error) {
      alert('Failed to create API key');
    } finally {
      setCreatingKey(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/keys/${keyId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setKeys(keys.filter((k) => k.id !== keyId));
      } else {
        alert(data.error || 'Failed to delete API key');
      }
    } catch (error) {
      alert('Failed to delete API key');
    }
  };

  const handleToggleKey = async (keyId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/keys/${keyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      const data = await response.json();
      if (data.success) {
        setKeys(keys.map((k) => (k.id === keyId ? data.key : k)));
      } else {
        alert(data.error || 'Failed to update API key');
      }
    } catch (error) {
      alert('Failed to update API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/portal', {
        method: 'POST',
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to open billing portal');
      }
    } catch (error) {
      alert('Failed to open billing portal');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const creditsPercentage = usage
    ? (usage.subscription.creditsRemaining / usage.subscription.creditsTotal) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <nav className="border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-white">
              ScreenAPI
            </Link>
            <div className="flex items-center space-x-6">
              <Link href="/docs" className="text-gray-300 hover:text-white transition">
                Docs
              </Link>
              <Link href="/playground" className="text-gray-300 hover:text-white transition">
                Playground
              </Link>
              <Link href="/pricing" className="text-gray-300 hover:text-white transition">
                Pricing
              </Link>
              <Link href="/account" className="text-gray-300 hover:text-white transition">
                Account
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-gray-300 hover:text-white transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {session?.user?.name || 'User'}!
          </h1>
          <p className="text-purple-200">
            Manage your API keys, monitor usage, and upgrade your plan.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Plan */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Current Plan</h3>
              <div className="px-3 py-1 bg-purple-600 rounded-full text-white text-sm font-semibold">
                {usage?.subscription.plan || 'FREE'}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-purple-200">Credits Used</span>
                <span className="text-white font-semibold">
                  {usage?.subscription.creditsUsed || 0} / {usage?.subscription.creditsTotal || 100}
                </span>
              </div>
              
              <div className="w-full bg-slate-800/50 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                  style={{ width: `${100 - creditsPercentage}%` }}
                ></div>
              </div>

              <div className="text-sm text-purple-300">
                {usage?.subscription.creditsRemaining || 0} credits remaining
              </div>
            </div>

            {usage?.subscription.plan === 'FREE' && (
              <Link
                href="/pricing"
                className="mt-4 block w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold text-center hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Upgrade Plan
              </Link>
            )}

            {usage?.subscription.plan !== 'FREE' && (
              <button
                onClick={handleManageBilling}
                className="mt-4 w-full px-4 py-2 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all"
              >
                Manage Billing
              </button>
            )}
          </div>

          {/* Today's Usage */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Today's Usage</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-purple-200">Total Requests</span>
                <span className="text-white font-bold text-2xl">
                  {usage?.usage.today.total || 0}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-green-400">✓ Successful</span>
                <span className="text-green-400 font-semibold">
                  {usage?.usage.today.successful || 0}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-red-400">✗ Failed</span>
                <span className="text-red-400 font-semibold">
                  {usage?.usage.today.failed || 0}
                </span>
              </div>
            </div>
          </div>

          {/* This Month */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">This Month</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-purple-200">Total Requests</span>
                <span className="text-white font-bold text-2xl">
                  {usage?.usage.thisMonth.total || 0}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-green-400">✓ Successful</span>
                <span className="text-green-400 font-semibold">
                  {usage?.usage.thisMonth.successful || 0}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-red-400">✗ Failed</span>
                <span className="text-red-400 font-semibold">
                  {usage?.usage.thisMonth.failed || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* API Keys Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">API Keys</h2>
            <button
              onClick={() => setShowNewKeyDialog(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              + Create New Key
            </button>
          </div>

          {keys.length === 0 ? (
            <div className="text-center py-12 text-purple-300">
              <p>No API keys yet. Create your first one to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-semibold">{key.name}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            key.isActive
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {key.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-purple-300 text-sm bg-black/30 px-3 py-1 rounded">
                          {key.key.substring(0, 20)}...{key.key.substring(key.key.length - 4)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(key.key)}
                          className="text-purple-400 hover:text-purple-300 transition"
                        >
                          {copiedKey === key.key ? '✓ Copied!' : 'Copy'}
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-purple-300">
                        <span>Rate Limit: {key.rateLimit}/min</span>
                        <span>
                          Last used: {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                        </span>
                        <span>
                          Created: {new Date(key.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleKey(key.id, key.isActive)}
                        className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
                      >
                        {key.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDeleteKey(key.id)}
                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/playground"
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-purple-500/50 transition group"
          >
            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-400 transition">
              🎮 Playground
            </h3>
            <p className="text-purple-200">
              Test the API directly in your browser
            </p>
          </Link>

          <Link
            href="/docs"
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-purple-500/50 transition group"
          >
            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-400 transition">
              📚 Documentation
            </h3>
            <p className="text-purple-200">
              Complete API reference and examples
            </p>
          </Link>

          <Link
            href="/pricing"
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-purple-500/50 transition group"
          >
            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-400 transition">
              💳 Pricing
            </h3>
            <p className="text-purple-200">
              View plans and upgrade your account
            </p>
          </Link>
        </div>
      </div>

      {/* Create Key Dialog */}
      {showNewKeyDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl p-8 max-w-md w-full border border-purple-500/30">
            <h2 className="text-2xl font-bold text-white mb-4">Create New API Key</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Key Name
              </label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Production API Key"
                className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowNewKeyDialog(false)}
                className="flex-1 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateKey}
                disabled={!newKeyName.trim() || creatingKey}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {creatingKey ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
