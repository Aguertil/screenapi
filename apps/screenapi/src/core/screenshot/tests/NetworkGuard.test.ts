import { describe, it, expect } from 'vitest';
import { isPrivateIp, isPublicUrl } from '../infrastructure/NetworkGuard';

describe('NetworkGuard', () => {
  it.each([
    '127.0.0.1', '10.1.2.3', '172.20.0.1', '192.168.1.10', '169.254.169.254',
    '100.64.0.1', '0.0.0.0', '::1', '::ffff:127.0.0.1', 'fd00::1', 'fe80::1',
  ])('bloque %s', (ip) => {
    expect(isPrivateIp(ip)).toBe(true);
  });

  it.each(['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111'])('autorise %s', (ip) => {
    expect(isPrivateIp(ip)).toBe(false);
  });

  it('refuse les protocoles non http(s)', async () => {
    expect(await isPublicUrl('file:///etc/passwd')).toBe(false);
    expect(await isPublicUrl('ftp://example.com')).toBe(false);
  });

  it('refuse un domaine qui résout vers localhost', async () => {
    expect(await isPublicUrl('http://localhost:3000/')).toBe(false);
  });

  it('refuse une IP privée écrite directement', async () => {
    expect(await isPublicUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
    expect(await isPublicUrl('http://[::1]/')).toBe(false);
  });

  it('laisse passer data: (pas de réseau)', async () => {
    expect(await isPublicUrl('data:image/png;base64,AAAA')).toBe(true);
  });
});
