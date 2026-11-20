import { createHash } from 'crypto';
import type { ScreenshotResult } from '../application/interfaces/IScreenshotService';

/**
 * Cache mémoire des captures, par client. Une capture servie depuis le cache
 * ne coûte aucun crédit et répond en quelques millisecondes.
 * Taille plafonnée (CACHE_MAX_MB, 200 Mo par défaut) : les plus anciennes sortent d'abord.
 */
interface Entry {
  value: ScreenshotResult;
  expiresAt: number;
}

const MAX_BYTES = (Number(process.env.CACHE_MAX_MB) || 200) * 1024 * 1024;
const store = new Map<string, Entry>();
let bytes = 0;

const keyOf = (userId: string, renderKey: string) =>
  createHash('sha256').update(userId + '\u0000' + renderKey).digest('hex');

function remove(key: string) {
  const e = store.get(key);
  if (e) {
    bytes -= e.value.fileSizeBytes;
    store.delete(key);
  }
}

export const screenshotCache = {
  get(userId: string, renderKey: string): ScreenshotResult | null {
    const key = keyOf(userId, renderKey);
    const e = store.get(key);
    if (!e) return null;
    if (e.expiresAt < Date.now()) {
      remove(key);
      return null;
    }
    // LRU : remettre en fin de file
    store.delete(key);
    store.set(key, e);
    return e.value;
  },

  set(userId: string, renderKey: string, value: ScreenshotResult, ttlSeconds: number) {
    if (ttlSeconds <= 0 || value.fileSizeBytes > MAX_BYTES / 10) return;
    const key = keyOf(userId, renderKey);
    remove(key);
    store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    bytes += value.fileSizeBytes;
    for (const oldest of store.keys()) {
      if (bytes <= MAX_BYTES) break;
      remove(oldest);
    }
  },
};
