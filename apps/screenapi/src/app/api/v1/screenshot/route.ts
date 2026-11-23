import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createCaptureScreenshotUseCase } from '@/core/screenshot/infrastructure';
import { getDevicePreset } from '@/core/screenshot/domain/device-presets';
import { PrismaApiKeyRepository } from '@/core/screenshot/infrastructure/PrismaApiKeyRepository';
import { verifySignature } from '@/lib/signing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bool = z.preprocess((v) => (v === 'true' || v === '1' ? true : v === 'false' || v === '0' ? false : v), z.boolean());
const num = z.coerce.number();

const schema = z.object({
  url: z.string().url('Invalid URL format').optional(),
  html: z.string().max(2 * 1024 * 1024).optional(),
  format: z.preprocess((v) => (typeof v === 'string' ? v.toUpperCase().replace('JPG', 'JPEG') : v), z.enum(['PNG', 'JPEG', 'WEBP', 'PDF'])).default('PNG'),
  quality: num.int().min(1).max(100).optional(),
  viewportType: z.preprocess((v) => (typeof v === 'string' ? v.toUpperCase() : v), z.enum(['DESKTOP', 'MOBILE', 'TABLET', 'CUSTOM'])).optional(),
  devicePreset: z.string().optional(),
  viewportWidth: num.int().min(200).max(3840).optional(),
  viewportHeight: num.int().min(200).max(2160).optional(),
  fullPage: bool.optional().default(false),
  waitForSelector: z.string().max(500).optional(),
  waitForTimeout: num.int().min(1000).max(60000).optional(),
  hideElements: z.preprocess((v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : v), z.array(z.string().max(500)).max(50)).optional(),
  blockCookies: bool.optional().default(true),
  blockAds: bool.optional().default(false),
  userAgent: z.string().max(500).optional(),
  darkMode: bool.optional().default(false),
  deviceScaleFactor: num.min(1).max(3).optional(),
  selector: z.string().max(500).optional(),
  delay: num.int().min(0).max(10000).optional(),
  cacheTtl: num.int().min(0).max(2592000).optional(),
  click: z.string().max(500).optional(),
  styles: z.string().max(100 * 1024).optional(),
  scripts: z.string().max(100 * 1024).optional(),
  lazyLoad: bool.optional().default(false),
  omitBackground: bool.optional().default(false),
  reducedMotion: bool.optional().default(false),
  blockChats: bool.optional().default(false),
  latitude: num.min(-90).max(90).optional(),
  longitude: num.min(-180).max(180).optional(),
  accuracy: num.min(0).max(100000).optional(),
  timezone: z.string().max(64).optional(),
  locale: z.string().max(35).optional(),
}).refine((d) => Boolean(d.url) !== Boolean(d.html), { message: 'Send either url or html', path: ['url'] })
  .refine((d) => (d.latitude === undefined) === (d.longitude === undefined), { message: 'latitude and longitude go together', path: ['latitude'] });

/** Accepte aussi les noms courts et en snake_case (full_page, width, dark_mode…). */
const ALIASES: Record<string, string> = {
  full_page: 'fullPage', width: 'viewportWidth', height: 'viewportHeight', viewport_width: 'viewportWidth',
  viewport_height: 'viewportHeight', viewport: 'viewportType', viewport_type: 'viewportType', device: 'devicePreset',
  device_preset: 'devicePreset', wait_for_selector: 'waitForSelector', timeout: 'waitForTimeout',
  wait_for_timeout: 'waitForTimeout', hide: 'hideElements', hide_elements: 'hideElements',
  block_cookies: 'blockCookies', block_cookie_banners: 'blockCookies', block_ads: 'blockAds',
  user_agent: 'userAgent', dark_mode: 'darkMode', scale: 'deviceScaleFactor', device_scale_factor: 'deviceScaleFactor',
  retina: 'deviceScaleFactor', element: 'selector', cache_ttl: 'cacheTtl', cache: 'cacheTtl', type: 'format',
  styles_css: 'styles', css: 'styles', js: 'scripts', script: 'scripts', lazy_load: 'lazyLoad', scroll: 'lazyLoad',
  omit_background: 'omitBackground', transparent: 'omitBackground', reduced_motion: 'reducedMotion',
  block_chats: 'blockChats', block_popups: 'blockChats', block_chats_and_popups: 'blockChats',
  geolocation_latitude: 'latitude', geolocation_longitude: 'longitude', geolocation_accuracy: 'accuracy',
  time_zone: 'timezone', lang: 'locale', language: 'locale',
};

function normalize(input: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (k === 'access_key' || k === 'api_key' || k === 'key_id' || k === 'signature') continue;
    const key = ALIASES[k] || k;
    out[key] = key === 'deviceScaleFactor' && k === 'retina' ? (v === 'true' || v === true ? 2 : 1) : v;
  }
  return out;
}

const STATUS: Record<string, number> = {
  MISSING_API_KEY: 401, INVALID_API_KEY: 401, RATE_LIMIT_EXCEEDED: 429, INSUFFICIENT_CREDITS: 402,
  NO_ACTIVE_SUBSCRIPTION: 403, INVALID_SIGNATURE: 401, SCRIPT_ERROR: 422, VALIDATION_ERROR: 400, INVALID_URL: 400, SELECTOR_NOT_FOUND: 422,
  TIMEOUT: 504, NETWORK_ERROR: 502, NAVIGATION_FAILED: 502, BUSY: 503, CAPTURE_FAILED: 500,
};

const HINTS: Record<string, string> = {
  INSUFFICIENT_CREDITS: 'Your monthly quota is used up. Upgrade your plan at /pricing.',
  RATE_LIMIT_EXCEEDED: 'Too many requests per minute for your plan. Slow down or upgrade.',
  TIMEOUT: 'The page took too long to load. Try a longer timeout or a simpler page.',
  BUSY: 'All capture slots are busy. Retry in a few seconds.',
  NO_ACTIVE_SUBSCRIPTION: 'Your account is inactive or suspended. Contact support.',
};

function errorResponse(code: string, message: string, extra: Record<string, unknown> = {}, headers: Record<string, string> = {}) {
  return NextResponse.json(
    { error: { code, message, ...(HINTS[code] ? { hint: HINTS[code] } : {}), ...extra } },
    { status: STATUS[code] || 500, headers },
  );
}

function apiKeyFrom(request: NextRequest, query: URLSearchParams) {
  const auth = request.headers.get('authorization');
  return (
    request.headers.get('x-api-key') ||
    (auth?.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : null) ||
    query.get('access_key') ||
    query.get('api_key')
  );
}

async function handle(request: NextRequest, raw: Record<string, unknown>) {
  const startTime = Date.now();
  const query = request.nextUrl.searchParams;
  let apiKey: string | null = null;
  let apiKeyId: string | undefined;

  // URL signée : key_id public + signature HMAC, la clé ne circule pas
  const keyId = query.get('key_id');
  const signature = query.get('signature');
  if (keyId || signature) {
    if (!keyId || !signature) return errorResponse('INVALID_SIGNATURE', 'Signed URLs need both key_id and signature.');
    const key = await new PrismaApiKeyRepository().findById(keyId);
    if (!key?.signingSecret || !verifySignature(key.signingSecret, request.nextUrl.search, signature)) {
      return errorResponse('INVALID_SIGNATURE', 'The signature does not match this URL. Sign the exact query string, without the signature parameter.');
    }
    apiKeyId = key.id;
  } else {
    apiKey = apiKeyFrom(request, query);
    if (!apiKey) {
      return errorResponse('MISSING_API_KEY', 'Send your API key in the x-api-key header or the access_key parameter, or use a signed URL.');
    }
  }

  const parsed = schema.safeParse(normalize(raw));
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', 'Invalid parameters', {
      details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }
  const body = parsed.data;

  let width = body.viewportWidth;
  let height = body.viewportHeight;
  let userAgent = body.userAgent;
  let scale = body.deviceScaleFactor;
  if (body.devicePreset) {
    const preset = getDevicePreset(body.devicePreset);
    if (!preset) return errorResponse('VALIDATION_ERROR', `Unknown device preset: ${body.devicePreset}. See GET /api/v1/devices.`);
    width = preset.width;
    height = preset.height;
    userAgent = userAgent || preset.userAgent;
    scale = scale ?? (preset as { deviceScaleFactor?: number }).deviceScaleFactor;
  }

  const result = await createCaptureScreenshotUseCase(process.env.REDIS_URL).execute({
    apiKey: apiKey || undefined,
    apiKeyId,
    url: body.url,
    html: body.html,
    format: body.format,
    quality: body.quality,
    viewportType: body.viewportType ?? (width || height ? 'CUSTOM' : 'DESKTOP'),
    viewportWidth: width,
    viewportHeight: height,
    fullPage: body.fullPage,
    waitForSelector: body.waitForSelector,
    waitForTimeout: body.waitForTimeout,
    hideElements: body.hideElements,
    blockCookies: body.blockCookies,
    blockAds: body.blockAds,
    userAgent,
    darkMode: body.darkMode,
    deviceScaleFactor: scale,
    selector: body.selector,
    delay: body.delay,
    cacheTtl: body.cacheTtl,
    click: body.click,
    styles: body.styles,
    scripts: body.scripts,
    lazyLoad: body.lazyLoad,
    omitBackground: body.omitBackground,
    reducedMotion: body.reducedMotion,
    blockChats: body.blockChats,
    geolocation: body.latitude !== undefined && body.longitude !== undefined
      ? { latitude: body.latitude, longitude: body.longitude, accuracy: body.accuracy }
      : undefined,
    timezone: body.timezone,
    locale: body.locale,
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || undefined,
    userAgentHeader: request.headers.get('user-agent') || undefined,
  });

  if (!result.success) {
    const err = result.error as { code?: string; message: string; limit?: number; retryAfter?: number; resetAt?: Date };
    const code = err.code || 'CAPTURE_FAILED';
    if (code === 'RATE_LIMIT_EXCEEDED') {
      return errorResponse(code, err.message, { limit: err.limit }, {
        'Retry-After': String(err.retryAfter || 60),
        'X-RateLimit-Limit': String(err.limit ?? ''),
        'X-RateLimit-Remaining': '0',
      });
    }
    return errorResponse(code, err.message);
  }

  const shot = result.value;
  const contentType = body.format === 'PDF' ? 'application/pdf' : `image/${body.format.toLowerCase()}`;
  return new Response(new Uint8Array(shot.buffer), {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(shot.fileSizeBytes),
      // URL signée : les navigateurs et CDN peuvent garder l'image (même URL = même image)
      'Cache-Control': body.cacheTtl ? `${apiKeyId ? 'public' : 'private'}, max-age=${body.cacheTtl}` : 'no-store',
      ...(apiKeyId ? { 'Access-Control-Allow-Origin': '*' } : {}),
      'X-Cache': shot.cached ? 'HIT' : 'MISS',
      'X-Credits-Remaining': String(shot.creditsRemaining ?? ''),
      'X-Screenshot-Width': String(shot.width),
      'X-Screenshot-Height': String(shot.height),
      'X-Processing-Time-Ms': String(Date.now() - startTime),
    },
  });
}

/** POST /api/v1/screenshot — paramètres en JSON. */
export async function POST(request: NextRequest) {
  let raw: Record<string, unknown>;
  try {
    raw = await request.json();
  } catch {
    return errorResponse('VALIDATION_ERROR', 'Body must be JSON, e.g. {"url": "https://example.com"}');
  }
  try {
    return await handle(request, raw);
  } catch (error) {
    console.error('Screenshot API error:', error);
    return errorResponse('CAPTURE_FAILED', 'Unexpected error, please retry.');
  }
}

/**
 * GET /api/v1/screenshot?url=…&access_key=… — paramètres dans l'URL,
 * pratique pour une balise <img> ou un test dans le navigateur.
 */
export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  if (!params.url && !params.html) {
    return NextResponse.json({
      service: 'ScreenAPI',
      usage: 'GET /api/v1/screenshot?url=https://example.com&access_key=YOUR_KEY or POST with a JSON body',
      docs: '/docs',
    });
  }
  try {
    return await handle(request, params);
  } catch (error) {
    console.error('Screenshot API error:', error);
    return errorResponse('CAPTURE_FAILED', 'Unexpected error, please retry.');
  }
}
