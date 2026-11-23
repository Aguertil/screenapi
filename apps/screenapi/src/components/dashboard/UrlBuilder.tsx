'use client';

import { useEffect, useMemo, useState } from 'react';

export interface SigningKey { id: string; name: string; isActive: boolean; signingSecret?: string | null }

async function hmacHex(secret: string, message: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

const DEVICES = { desktop: [1280, 800], tablet: [768, 1024], mobile: [390, 844] } as const;

/** Construit une URL signée : publique, utilisable dans un <img>, la clé ne circule jamais. */
export function UrlBuilder({ keys, base, onRotate }: { keys: SigningKey[]; base: string; onRotate: (id: string) => void }) {
  const usable = keys.filter((k) => k.isActive && k.signingSecret);
  const [keyId, setKeyId] = useState('');
  const [url, setUrl] = useState('https://example.com');
  const [format, setFormat] = useState('png');
  const [device, setDevice] = useState<keyof typeof DEVICES>('desktop');
  const [fullPage, setFullPage] = useState(false);
  const [blockCookies, setBlockCookies] = useState(true);
  const [blockAds, setBlockAds] = useState(true);
  const [blockChats, setBlockChats] = useState(true);
  const [lazyLoad, setLazyLoad] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [cacheTtl, setCacheTtl] = useState('86400');
  const [signed, setSigned] = useState('');
  const [preview, setPreview] = useState('');
  const [copied, setCopied] = useState(false);

  const key = usable.find((k) => k.id === keyId) || usable[0];

  const query = useMemo(() => {
    if (!key) return '';
    const [w, h] = DEVICES[device];
    const p = new URLSearchParams({ url, format, viewport_width: String(w), viewport_height: String(h) });
    if (fullPage) p.set('full_page', 'true');
    if (blockCookies) p.set('block_cookie_banners', 'true');
    if (blockAds) p.set('block_ads', 'true');
    if (blockChats) p.set('block_chats', 'true');
    if (lazyLoad) p.set('lazy_load', 'true');
    if (darkMode) p.set('dark_mode', 'true');
    if (cacheTtl !== '0') p.set('cache_ttl', cacheTtl);
    p.set('key_id', key.id);
    return p.toString();
  }, [key, url, format, device, fullPage, blockCookies, blockAds, blockChats, lazyLoad, darkMode, cacheTtl]);

  useEffect(() => {
    let live = true;
    if (!key?.signingSecret || !query) { setSigned(''); return; }
    hmacHex(key.signingSecret, query).then((sig) => {
      if (live) { setSigned(`${base}/api/v1/screenshot?${query}&signature=${sig}`); setCopied(false); }
    });
    return () => { live = false; };
  }, [key, query, base]);

  if (!usable.length) return <p className="mt-4 text-sm text-muted">Create a key first to build signed URLs.</p>;

  const toggle = (label: string, value: boolean, set: (v: boolean) => void) => (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={value} onChange={(e) => set(e.target.checked)} /> {label}
    </label>
  );
  const field = 'rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none';

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <label className="block text-sm font-medium">Page to capture
          <input value={url} onChange={(e) => setUrl(e.target.value)} className={`${field} mt-1 w-full font-normal`} />
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="text-sm font-medium">Key
            <select value={key?.id} onChange={(e) => setKeyId(e.target.value)} className={`${field} mt-1 w-full font-normal`}>
              {usable.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Format
            <select value={format} onChange={(e) => setFormat(e.target.value)} className={`${field} mt-1 w-full font-normal`}>
              {['png', 'jpeg', 'webp', 'pdf'].map((f) => <option key={f}>{f}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Device
            <select value={device} onChange={(e) => setDevice(e.target.value as keyof typeof DEVICES)} className={`${field} mt-1 w-full font-normal`}>
              {Object.keys(DEVICES).map((d) => <option key={d}>{d}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Cache
            <select value={cacheTtl} onChange={(e) => setCacheTtl(e.target.value)} className={`${field} mt-1 w-full font-normal`}>
              <option value="0">none</option><option value="3600">1 hour</option><option value="86400">1 day</option><option value="2592000">30 days</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {toggle('Full page', fullPage, setFullPage)}
          {toggle('Hide cookie banners', blockCookies, setBlockCookies)}
          {toggle('Block ads', blockAds, setBlockAds)}
          {toggle('Hide chats and popups', blockChats, setBlockChats)}
          {toggle('Load lazy images', lazyLoad, setLazyLoad)}
          {toggle('Dark mode', darkMode, setDarkMode)}
        </div>
        <div>
          <p className="text-sm font-medium">Signed URL</p>
          <p className="text-xs text-muted">Safe to put in an &lt;img&gt; tag or share: it carries no API key, and any change to it breaks the signature.</p>
          <code className="mt-2 block max-h-32 overflow-auto break-all rounded-md bg-surface px-3 py-2 text-xs">{signed}</code>
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={() => { navigator.clipboard.writeText(signed); setCopied(true); }} className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white">
              {copied ? 'Copied' : 'Copy URL'}
            </button>
            <button onClick={() => setPreview(signed)} className="rounded-md border border-line px-4 py-2 text-sm font-medium">Preview (uses 1 capture)</button>
            <button onClick={() => key && confirm('Old signed URLs for this key will stop working. Continue?') && onRotate(key.id)}
              className="px-2 py-2 text-sm text-muted hover:text-red-700">New signing secret</button>
          </div>
        </div>
      </div>
      <div className="min-h-48 rounded-lg border border-line bg-surface p-2">
        {preview
          ? (format === 'pdf'
            ? <a href={preview} target="_blank" rel="noreferrer" className="text-sm underline">Open the PDF</a>
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={preview} alt={`Capture of ${url}`} className="w-full rounded" />)
          : <p className="p-4 text-sm text-muted">The preview shows here.</p>}
      </div>
    </div>
  );
}
