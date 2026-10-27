'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PlaygroundPage() {
  const [url, setUrl] = useState('https://example.com');
  const [apiKey, setApiKey] = useState('');
  const [format, setFormat] = useState('PNG');
  const [viewport, setViewport] = useState('DESKTOP');
  const [fullPage, setFullPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; imageUrl?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/v1/screenshot', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          format,
          viewportType: viewport,
          fullPage,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setResult({
          success: true,
          message: 'Screenshot captured successfully!',
          imageUrl,
        });
      } else {
        const error = await response.json();
        setResult({
          success: false,
          message: error.message || 'Failed to capture screenshot',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Network error: ' + (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    try {
      const response = await fetch('/api/admin/setup', { method: 'POST' });
      const data = await response.json();
      setApiKey(data.apiKey.key);
      alert('API Key created! It has been filled in the form.');
    } catch (error) {
      alert('Failed to create API key');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-white">
                ScreenAPI
              </Link>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/playground" className="text-white font-semibold">
                Playground
              </Link>
              <Link href="/docs" className="text-gray-300 hover:text-white transition">
                Docs
              </Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-white transition">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">API Playground</h1>
          <p className="text-gray-300">Test the screenshot API directly from your browser</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* API Key */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk_test_xxxxxxxxxxxxxxxx"
                    className="flex-1 bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleCreateApiKey}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition font-semibold whitespace-nowrap"
                  >
                    Create Key
                  </button>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  Don't have a key? Click "Create Key"
                </p>
              </div>

              {/* URL */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  URL to Capture
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              {/* Format */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="PNG">PNG</option>
                  <option value="JPEG">JPEG</option>
                  <option value="WEBP">WEBP</option>
                </select>
              </div>

              {/* Viewport */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Viewport
                </label>
                <select
                  value={viewport}
                  onChange={(e) => setViewport(e.target.value)}
                  className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="DESKTOP">Desktop (1920x1080)</option>
                  <option value="MOBILE">Mobile (375x667)</option>
                  <option value="TABLET">Tablet (768x1024)</option>
                </select>
              </div>

              {/* Full Page */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="fullPage"
                  checked={fullPage}
                  onChange={(e) => setFullPage(e.target.checked)}
                  className="w-5 h-5 rounded border-white/20 bg-black/30 text-purple-600 focus:ring-2 focus:ring-purple-500"
                />
                <label htmlFor="fullPage" className="ml-3 text-white font-semibold">
                  Capture Full Page
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-4 rounded-lg font-semibold transition text-lg"
              >
                {loading ? 'Capturing...' : 'Capture Screenshot 📸'}
              </button>
            </form>

            {/* Result Message */}
            {result && (
              <div
                className={`mt-6 p-4 rounded-lg ${
                  result.success
                    ? 'bg-green-500/20 border border-green-500/30'
                    : 'bg-red-500/20 border border-red-500/30'
                }`}
              >
                <p className={result.success ? 'text-green-400' : 'text-red-400'}>
                  {result.message}
                </p>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Preview</h2>
            
            {loading && (
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
              </div>
            )}

            {result?.imageUrl && !loading && (
              <div className="space-y-4">
                <img
                  src={result.imageUrl}
                  alt="Screenshot"
                  className="w-full rounded-lg border border-white/20"
                />
                <a
                  href={result.imageUrl}
                  download={`screenshot.${format.toLowerCase()}`}
                  className="block w-full bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-semibold text-center transition"
                >
                  Download Screenshot
                </a>
              </div>
            )}

            {!loading && !result?.imageUrl && (
              <div className="flex items-center justify-center h-96 text-gray-400">
                <div className="text-center">
                  <div className="text-6xl mb-4">📸</div>
                  <p>Your screenshot will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Examples */}
        <div className="mt-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Try These URLs</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              'https://example.com',
              'https://github.com',
              'https://stackoverflow.com',
            ].map((exampleUrl) => (
              <button
                key={exampleUrl}
                onClick={() => setUrl(exampleUrl)}
                className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-4 text-left transition"
              >
                <p className="text-white font-semibold mb-1">Example</p>
                <p className="text-gray-400 text-sm break-all">{exampleUrl}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
