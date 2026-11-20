'use client';

import { useEffect, useRef, useState } from 'react';

export function TryIt() {
  const [url, setUrl] = useState('');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const prev = useRef<string | null>(null);

  useEffect(() => () => { if (prev.current) URL.revokeObjectURL(prev.current); }, []);

  async function capture(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setState('loading');
    setMessage('');
    const started = performance.now();
    try {
      const res = await fetch(`/api/demo?url=${encodeURIComponent(url.trim())}&device=${device}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error || 'This page could not be captured.');
        setState('error');
        return;
      }
      const blob = await res.blob();
      if (prev.current) URL.revokeObjectURL(prev.current);
      prev.current = URL.createObjectURL(blob);
      setImage(prev.current);
      setTime(Math.round(performance.now() - started));
      setState('done');
    } catch {
      setMessage('Network error, please retry.');
      setState('error');
    }
  }

  return (
    <div>
      <form onSubmit={capture} className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="try-url" className="sr-only">Web address to capture</label>
        <input
          id="try-url"
          type="text"
          inputMode="url"
          autoComplete="url"
          placeholder="example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-ink px-4 py-3 text-base outline-none focus:ring-2 focus:ring-accent"
        />
        <div className="flex gap-2">
          <select
            aria-label="Device"
            value={device}
            onChange={(e) => setDevice(e.target.value as 'desktop' | 'mobile')}
            className="rounded-md border border-line bg-white px-3 py-3 text-sm"
          >
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
          </select>
          <button
            type="submit"
            disabled={state === 'loading'}
            className="flex-1 whitespace-nowrap rounded-md bg-accent px-5 py-3 font-medium text-white hover:brightness-95 disabled:opacity-70 sm:flex-none"
          >
            {state === 'loading' ? 'Capturing…' : 'Take screenshot'}
          </button>
        </div>
      </form>
      <p className="mt-2 text-sm text-muted" aria-live="polite">
        {state === 'error' ? <span className="text-red-700">{message}</span>
          : state === 'done' && time ? `Done in ${(time / 1000).toFixed(1)} s. This demo allows 5 tries an hour.`
          : 'No account needed for this demo.'}
      </p>

      <div className="viewfinder mt-8">
        <span className="vf-b" />
        <div className={`flex aspect-[16/10] items-center justify-center overflow-hidden rounded-sm border border-line bg-surface ${device === 'mobile' && image ? 'bg-surface' : ''}`}>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={image}
              src={image}
              alt={`Screenshot of ${url}`}
              className={`shutter max-h-full ${device === 'mobile' ? 'h-full w-auto' : 'h-full w-full object-cover object-top'}`}
            />
          ) : (
            <p className="px-6 text-center text-sm text-muted">
              {state === 'loading' ? 'Opening the page in Chrome…' : 'Your screenshot will appear here.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
