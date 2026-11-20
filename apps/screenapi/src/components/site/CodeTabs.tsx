'use client';

import { useState } from 'react';

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://screenapi.example';

const SAMPLES: Record<string, string> = {
  curl: `curl "${BASE}/api/v1/screenshot?url=https://example.com&full_page=true" \\
  -H "x-api-key: YOUR_KEY" \\
  -o screenshot.png`,
  'Node.js': `const res = await fetch("${BASE}/api/v1/screenshot", {
  method: "POST",
  headers: { "x-api-key": process.env.SCREENAPI_KEY, "content-type": "application/json" },
  body: JSON.stringify({ url: "https://example.com", format: "webp", device: "iphone-15-pro" }),
});
await fs.promises.writeFile("shot.webp", Buffer.from(await res.arrayBuffer()));`,
  Python: `import requests

r = requests.post(
    "${BASE}/api/v1/screenshot",
    headers={"x-api-key": "YOUR_KEY"},
    json={"url": "https://example.com", "format": "pdf"},
)
open("page.pdf", "wb").write(r.content)`,
  PHP: `$png = file_get_contents("${BASE}/api/v1/screenshot?" . http_build_query([
    "url" => "https://example.com",
    "dark_mode" => "true",
    "access_key" => getenv("SCREENAPI_KEY"),
]));
file_put_contents("shot.png", $png);`,
};

export function CodeTabs() {
  const [tab, setTab] = useState('curl');
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-lg border border-ink bg-ink text-sm text-white">
      <div role="tablist" aria-label="Code language" className="flex flex-wrap border-b border-white/15">
        {Object.keys(SAMPLES).map((name) => (
          <button
            key={name}
            role="tab"
            aria-selected={tab === name}
            onClick={() => { setTab(name); setCopied(false); }}
            className={`px-4 py-2.5 ${tab === name ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
          >
            {name}
          </button>
        ))}
        <button
          onClick={() => { navigator.clipboard.writeText(SAMPLES[tab]); setCopied(true); }}
          className="ml-auto px-4 py-2.5 text-white/60 hover:text-white"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 leading-relaxed"><code>{SAMPLES[tab]}</code></pre>
    </div>
  );
}
