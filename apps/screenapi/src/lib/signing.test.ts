import { describe, it, expect } from 'vitest';
import { canonicalQuery, sign, verifySignature, generateSigningSecret } from './signing';

describe('URL signées', () => {
  const secret = generateSigningSecret();
  const q = 'url=https%3A%2F%2Fexample.com&full_page=true&key_id=abc';

  it('retire signature et le point d’interrogation', () => {
    expect(canonicalQuery(`?${q}&signature=deadbeef`)).toBe(q);
  });
  it('accepte la bonne signature', () => {
    expect(verifySignature(secret, `?${q}&signature=${sign(secret, q)}`, sign(secret, q))).toBe(true);
  });
  it('refuse une URL modifiée', () => {
    const sig = sign(secret, q);
    expect(verifySignature(secret, `?${q.replace('true', 'false')}&signature=${sig}`, sig)).toBe(false);
  });
  it('refuse une signature mal formée', () => {
    expect(verifySignature(secret, `?${q}`, 'zz')).toBe(false);
  });
});
