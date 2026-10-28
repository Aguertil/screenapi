'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DevicePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  category: string;
}

export default function PlaygroundPage() {
  const [activeTab, setActiveTab] = useState<'screenshot' | 'scrape'>('screenshot');
  
  // Screenshot state
  const [url, setUrl] = useState('https://example.com');
  const [apiKey, setApiKey] = useState('');
  const [format, setFormat] = useState('PNG');
  const [devicePreset, setDevicePreset] = useState('');
  const [fullPage, setFullPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; imageUrl?: string; data?: any } | null>(null);
  const [devices, setDevices] = useState<DevicePreset[]>([]);

  // Scraping state
  const [scrapeUrl, setScrapeUrl] = useState('https://example.com');
  const [extractMetadata, setExtractMetadata] = useState(true);
  const [extractText, setExtractText] = useState(true);
  const [extractLinks, setExtractLinks] = useState(false);
  const [extractImages, setExtractImages] = useState(false);
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<any>(null);

  // Load device presets
  useEffect(() => {
    fetch('/api/v1/devices')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDevices(data.devices);
        }
      })
      .catch(err => console.error('Failed to load devices:', err));
  }, []);

  const handleCreateApiKey = async () => {
    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'demo@screenapi.local',
          fullName: 'Demo User',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setApiKey(data.apiKey);
        alert(`API Key created: ${data.apiKey}`);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create API key');
      }
    } catch (error) {
      alert('Error creating API key');
    }
  };

  const handleScreenshotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const body: any = {
        url,
        format,
        fullPage,
      };

      if (devicePreset) {
        body.devicePreset = devicePreset;
      }

      const response = await fetch('/api/v1/screenshot', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
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
        message: 'Network error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScrapeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setScrapeLoading(true);
    setScrapeResult(null);

    try {
      const response = await fetch('/api/v1/scrape', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: scrapeUrl,
          extractMetadata,
          extractText,
          extractLinks,
          extractImages,
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setScrapeResult({ success: true, data: data.data });
      } else {
        setScrapeResult({
          success: false,
          message: data.message || 'Failed to scrape webpage',
        });
      }
    } catch (error) {
      setScrapeResult({
        success: false,
        message: 'Network error occurred',
      });
    } finally {
      setScrapeLoading(false);
    }
  };

  const downloadScreenshot = () => {
    if (result?.imageUrl) {
      const a = document.createElement('a');
      a.href = result.imageUrl;
      a.download = `screenshot-${Date.now()}.${format.toLowerCase()}`;
      a.click();
    }
  };

  const phoneDevices = devices.filter(d => d.category === 'phone');
  const tabletDevices = devices.filter(d => d.category === 'tablet');
  const desktopDevices = devices.filter(d => d.category === 'desktop');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-4 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          
          <h1 className="text-4xl font-bold text-white mb-2">
            🎮 API Playground
          </h1>
          <p className="text-purple-200">
            Test screenshots and web scraping in real-time
          </p>
        </div>

        {/* API Key Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="block text-sm font-medium text-purple-200 mb-2">
                API Key
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key or create one"
                className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={handleCreateApiKey}
              className="ml-4 mt-7 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              Create API Key
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('screenshot')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'screenshot'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-white/10 text-purple-200 hover:bg-white/20'
            }`}
          >
            📸 Screenshots
          </button>
          <button
            onClick={() => setActiveTab('scrape')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'scrape'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-white/10 text-purple-200 hover:bg-white/20'
            }`}
          >
            🕷️ Web Scraping
          </button>
        </div>

        {/* Screenshot Tab */}
        {activeTab === 'screenshot' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Screenshot Configuration</h2>
              
              <form onSubmit={handleScreenshotSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Target URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Device Preset
                  </label>
                  <select
                    value={devicePreset}
                    onChange={(e) => setDevicePreset(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Desktop (Default)</option>
                    {phoneDevices.length > 0 && (
                      <optgroup label="📱 Phones">
                        {phoneDevices.map((device) => (
                          <option key={device.id} value={device.id}>
                            {device.name} ({device.width}×{device.height})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {tabletDevices.length > 0 && (
                      <optgroup label="📱 Tablets">
                        {tabletDevices.map((device) => (
                          <option key={device.id} value={device.id}>
                            {device.name} ({device.width}×{device.height})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {desktopDevices.length > 0 && (
                      <optgroup label="💻 Desktop">
                        {desktopDevices.map((device) => (
                          <option key={device.id} value={device.id}>
                            {device.name} ({device.width}×{device.height})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Image Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="PNG">PNG</option>
                    <option value="JPEG">JPEG</option>
                    <option value="WEBP">WEBP</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="fullPage"
                    checked={fullPage}
                    onChange={(e) => setFullPage(e.target.checked)}
                    className="w-5 h-5 rounded border-purple-500/30 bg-slate-800/50 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="fullPage" className="ml-3 text-purple-200">
                    Capture full page (scroll entire page)
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || !apiKey}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? 'Capturing...' : '📸 Capture Screenshot'}
                </button>
              </form>
            </div>

            {/* Result */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Result</h2>
              
              {!result && (
                <div className="text-center text-purple-300 py-12">
                  <svg className="w-24 h-24 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>Your screenshot will appear here</p>
                </div>
              )}

              {result?.success && result.imageUrl && (
                <div>
                  <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
                    <p className="text-green-300">✅ {result.message}</p>
                  </div>
                  
                  <div className="mb-4 bg-slate-800/50 rounded-xl p-2">
                    <img 
                      src={result.imageUrl} 
                      alt="Screenshot" 
                      className="w-full h-auto rounded-lg"
                    />
                  </div>

                  <button
                    onClick={downloadScreenshot}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
                  >
                    💾 Download Screenshot
                  </button>
                </div>
              )}

              {result && !result.success && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                  <p className="text-red-300">❌ {result.message}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scrape Tab */}
        {activeTab === 'scrape' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Web Scraping Configuration</h2>
              
              <form onSubmit={handleScrapeSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Target URL
                  </label>
                  <input
                    type="url"
                    value={scrapeUrl}
                    onChange={(e) => setScrapeUrl(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Extract Data
                  </label>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="extractMetadata"
                      checked={extractMetadata}
                      onChange={(e) => setExtractMetadata(e.target.checked)}
                      className="w-5 h-5 rounded border-purple-500/30 bg-slate-800/50 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="extractMetadata" className="ml-3 text-purple-200">
                      Meta tags (title, description, Open Graph, Twitter Cards)
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="extractText"
                      checked={extractText}
                      onChange={(e) => setExtractText(e.target.checked)}
                      className="w-5 h-5 rounded border-purple-500/30 bg-slate-800/50 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="extractText" className="ml-3 text-purple-200">
                      Text content
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="extractLinks"
                      checked={extractLinks}
                      onChange={(e) => setExtractLinks(e.target.checked)}
                      className="w-5 h-5 rounded border-purple-500/30 bg-slate-800/50 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="extractLinks" className="ml-3 text-purple-200">
                      All links
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="extractImages"
                      checked={extractImages}
                      onChange={(e) => setExtractImages(e.target.checked)}
                      className="w-5 h-5 rounded border-purple-500/30 bg-slate-800/50 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="extractImages" className="ml-3 text-purple-200">
                      All images
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={scrapeLoading || !apiKey}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {scrapeLoading ? 'Scraping...' : '🕷️ Scrape Webpage'}
                </button>
              </form>
            </div>

            {/* Result */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Scraped Data</h2>
              
              {!scrapeResult && (
                <div className="text-center text-purple-300 py-12">
                  <svg className="w-24 h-24 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>Scraped data will appear here</p>
                </div>
              )}

              {scrapeResult?.success && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
                    <p className="text-green-300">✅ Data extracted successfully!</p>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-xl p-4 max-h-[600px] overflow-auto">
                    <pre className="text-sm text-purple-200 whitespace-pre-wrap">
                      {JSON.stringify(scrapeResult.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {scrapeResult && !scrapeResult.success && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                  <p className="text-red-300">❌ {scrapeResult.message}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
