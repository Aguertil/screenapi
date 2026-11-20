import { createHash, randomBytes } from 'crypto';

/**
 * Les clés API ne sont jamais stockées en clair : la base ne garde que leur
 * empreinte SHA-256 et un préfixe pour les reconnaître dans le tableau de bord.
 * La clé complète n'est montrée qu'une fois, à sa création.
 */
export const hashApiKey = (key: string) => createHash('sha256').update(key).digest('hex');

export function generateApiKey() {
  const key = `sk_live_${randomBytes(24).toString('hex')}`;
  return { key, hash: hashApiKey(key), prefix: key.slice(0, 14) };
}
