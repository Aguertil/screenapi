import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import type { BrowserContext } from 'playwright-core';

/**
 * Protection SSRF au niveau réseau.
 *
 * UrlValidator ne regarde que le texte de l'URL : un domaine qui pointe vers
 * 127.0.0.1, une iframe vers 169.254.169.254 ou une redirection le contournent.
 * Ici on résout le DNS de CHAQUE requête du navigateur et on bloque les IP privées.
 */

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}

const BLOCKED_V4: Array<[string, number]> = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];

export function isPrivateIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const n = ipv4ToInt(ip);
    return BLOCKED_V4.some(([base, bits]) => {
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
      return (n & mask) === (ipv4ToInt(base) & mask);
    });
  }
  if (version === 6) {
    const v6 = ip.toLowerCase();
    if (v6 === '::' || v6 === '::1') return true;
    const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(v6);
  }
  return true; // pas une IP : refuser par prudence
}

export async function isPublicUrl(rawUrl: string): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  // data:, blob: et about: ne sortent pas sur le réseau
  if (['data:', 'blob:', 'about:'].includes(url.protocol)) return true;
  if (!['http:', 'https:'].includes(url.protocol)) return false;

  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (isIP(host)) return !isPrivateIp(host);
  try {
    const addresses = await lookup(host, { all: true, verbatim: true });
    return addresses.length > 0 && addresses.every((a) => !isPrivateIp(a.address));
  } catch {
    return false;
  }
}

/**
 * À appeler APRÈS les autres context.route() : Playwright exécute le dernier
 * gestionnaire enregistré en premier, puis fallback() passe aux précédents.
 */
export async function installNetworkGuard(context: BrowserContext): Promise<void> {
  await context.route('**/*', async (route) => {
    if (await isPublicUrl(route.request().url())) {
      await route.fallback();
    } else {
      await route.abort('blockedbyclient');
    }
  });
}
