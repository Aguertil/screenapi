import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

/** Secret des URL signées (affiché dans le tableau de bord, régénérable). */
export const generateSigningSecret = () => `ss_${randomBytes(24).toString('hex')}`;

/**
 * Chaîne signée : la requête telle qu'envoyée, sans « ? » et sans le paramètre signature.
 * Exemple : url=https%3A%2F%2Fexample.com&full_page=true&key_id=abc
 */
export function canonicalQuery(rawSearch: string): string {
  return rawSearch
    .replace(/^\?/, '')
    .split('&')
    .filter((part) => part && !part.startsWith('signature='))
    .join('&');
}

export function sign(secret: string, query: string): string {
  return createHmac('sha256', secret).update(query).digest('hex');
}

export function verifySignature(secret: string, rawSearch: string, signature: string): boolean {
  const expected = Buffer.from(sign(secret, canonicalQuery(rawSearch)), 'hex');
  const given = Buffer.from(signature.toLowerCase(), 'hex');
  return given.length === expected.length && timingSafeEqual(given, expected);
}
