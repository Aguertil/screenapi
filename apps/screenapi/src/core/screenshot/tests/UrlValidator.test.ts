import { describe, it, expect } from 'vitest';
import { UrlValidator } from '../domain/UrlValidator';

describe('UrlValidator', () => {
  describe('validate', () => {
    describe('when URL is valid', () => {
      it('should accept https URLs', () => {
        const result = UrlValidator.validate('https://example.com');
        expect(result.success).toBe(true);
      });

      it('should accept http URLs', () => {
        const result = UrlValidator.validate('http://example.com');
        expect(result.success).toBe(true);
      });

      it('should accept URLs with paths', () => {
        const result = UrlValidator.validate('https://example.com/path/to/page');
        expect(result.success).toBe(true);
      });

      it('should accept URLs with query params', () => {
        const result = UrlValidator.validate('https://example.com?foo=bar&baz=qux');
        expect(result.success).toBe(true);
      });
    });

    describe('when URL format is invalid', () => {
      it('should reject invalid URL format', () => {
        const result = UrlValidator.validate('not-a-url');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBe('Invalid URL format');
        }
      });

      it('should reject empty string', () => {
        const result = UrlValidator.validate('');
        expect(result.success).toBe(false);
      });
    });

    describe('when protocol is not allowed', () => {
      it.each([
        'ftp://example.com',
        'file:///etc/passwd',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
      ])('should reject %s', (url) => {
        const result = UrlValidator.validate(url);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toContain('Protocol');
        }
      });
    });

    describe('SSRF protection', () => {
      describe('localhost', () => {
        it.each([
          'http://localhost',
          'http://localhost:8080',
          'http://test.localhost',
          'http://127.0.0.1',
          'http://127.0.0.2',
          'http://127.255.255.255',
        ])('should reject %s', (url) => {
          const result = UrlValidator.validate(url);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.message).toContain('Localhost');
          }
        });
      });

      describe('private IPv4 ranges', () => {
        it.each([
          'http://10.0.0.1',
          'http://10.255.255.255',
          'http://172.16.0.1',
          'http://172.31.255.255',
          'http://192.168.0.1',
          'http://192.168.255.255',
        ])('should reject private IP %s', (url) => {
          const result = UrlValidator.validate(url);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.message).toContain('Private IP');
          }
        });
      });

      describe('link-local addresses', () => {
        it.each(['http://169.254.0.1', 'http://169.254.169.254'])('should reject %s', (url) => {
          const result = UrlValidator.validate(url);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.message).toContain('Link-local');
          }
        });
      });

      describe('IPv6 private ranges', () => {
        it.each([
          'http://[::1]',
          'http://[fe80::1]',
          'http://[fc00::1]',
          'http://[fd00::1]',
        ])('should reject %s', (url) => {
          const result = UrlValidator.validate(url);
          expect(result.success).toBe(false);
        });
      });

      describe('internal domains', () => {
        it.each([
          'http://api.internal',
          'http://db.flycast',
          'http://service.local',
        ])('should reject %s', (url) => {
          const result = UrlValidator.validate(url);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.message).toContain('Internal');
          }
        });
      });

      describe('cloud metadata services', () => {
        it.each([
          'http://169.254.169.254/latest/meta-data/',
          'http://metadata.google.internal',
          'http://metadata',
        ])('should reject metadata service %s', (url) => {
          const result = UrlValidator.validate(url);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.message).toContain('Metadata');
          }
        });
      });
    });
  });
});
