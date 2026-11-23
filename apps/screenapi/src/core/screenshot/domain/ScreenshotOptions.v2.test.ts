import { describe, it, expect } from 'vitest';
import { ScreenshotOptions } from './ScreenshotOptions';

const ok = (p: Parameters<typeof ScreenshotOptions.create>[0]) => ScreenshotOptions.create(p).success;

describe('Options v2', () => {
  it('HTML à la place d’une URL', () => {
    expect(ok({ html: '<h1>Bonjour</h1>' })).toBe(true);
    expect(ok({ html: '<h1>x</h1>', url: 'https://example.com' })).toBe(false);
    expect(ok({ html: '   ' })).toBe(false);
  });
  it('fond transparent interdit en JPEG', () => {
    expect(ok({ url: 'https://example.com', omitBackground: true })).toBe(true);
    expect(ok({ url: 'https://example.com', omitBackground: true, format: 'JPEG' })).toBe(false);
  });
  it('fuseau horaire et langue vérifiés', () => {
    expect(ok({ url: 'https://example.com', timezone: 'Europe/Paris', locale: 'fr-FR' })).toBe(true);
    expect(ok({ url: 'https://example.com', timezone: 'Mars/Olympus' })).toBe(false);
    expect(ok({ url: 'https://example.com', locale: 'pas une langue!' })).toBe(false);
  });
  it('géolocalisation bornée', () => {
    expect(ok({ url: 'https://example.com', geolocation: { latitude: 48.85, longitude: 2.35 } })).toBe(true);
    expect(ok({ url: 'https://example.com', geolocation: { latitude: 95, longitude: 2 } })).toBe(false);
  });
  it('la clé de cache change avec les nouvelles options', () => {
    const a = ScreenshotOptions.create({ url: 'https://example.com' });
    const b = ScreenshotOptions.create({ url: 'https://example.com', styles: 'body{color:red}' });
    if (!a.success || !b.success) throw new Error();
    expect(a.value.cacheKey()).not.toBe(b.value.cacheKey());
  });
});
