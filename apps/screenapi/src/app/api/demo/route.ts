import { NextRequest, NextResponse } from 'next/server';
import { PlaywrightScreenshotService } from '@/core/screenshot/infrastructure/PlaywrightScreenshotService';
import { ScreenshotOptions } from '@/core/screenshot/domain/ScreenshotOptions';
import { UrlValidator } from '@/core/screenshot/domain/UrlValidator';
import { screenshotCache } from '@/core/screenshot/infrastructure/ScreenshotCache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/demo?url=… — essai sans compte depuis la page d'accueil.
 * 5 captures par heure et par adresse IP, format fixe (1280×800, JPEG),
 * résultat partagé en cache une heure. Aucun crédit, aucune donnée gardée.
 */
const PER_HOUR = 5;
const hits = new Map<string, number[]>();
let service: PlaywrightScreenshotService | null = null;

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url')?.trim() || '';
  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const mobile = request.nextUrl.searchParams.get('device') === 'mobile';

  const valid = UrlValidator.validate(url);
  if (!raw || !valid.success) {
    return NextResponse.json({ error: 'Enter a public web address, e.g. example.com' }, { status: 400 });
  }

  const opts = ScreenshotOptions.create({
    url,
    format: 'JPEG',
    quality: 70,
    viewportType: mobile ? 'MOBILE' : 'DESKTOP',
    deviceScaleFactor: mobile ? 2 : 1,
    blockCookies: true,
    blockAds: true,
    waitForTimeout: 20000,
  });
  if (!opts.success) return NextResponse.json({ error: opts.error.message }, { status: 400 });

  const cached = screenshotCache.get('demo', opts.value.cacheKey());
  if (!cached) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter((t) => now - t < 3600_000);
    if (recent.length >= PER_HOUR) {
      return NextResponse.json(
        { error: 'You have used the 5 free tries for this hour. Create a free account for 100 screenshots a month.' },
        { status: 429 },
      );
    }
    recent.push(now);
    hits.set(ip, recent);
    if (hits.size > 10_000) hits.clear();
  }

  let shot = cached;
  if (!shot) {
    service ||= new PlaywrightScreenshotService();
    const result = await service.capture(opts.value);
    if (!result.success) {
      return NextResponse.json({ error: `Could not capture this page: ${result.error.message}` }, { status: 502 });
    }
    shot = result.value;
    screenshotCache.set('demo', opts.value.cacheKey(), shot, 3600);
  }

  return new Response(new Uint8Array(shot.buffer), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'no-store',
      'X-Processing-Time-Ms': String(shot.durationMs),
    },
  });
}
