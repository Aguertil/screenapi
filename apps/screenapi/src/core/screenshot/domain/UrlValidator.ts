import { Result, success, failure, ValidationError } from '@/lib/types';

export class UrlValidator {
  /**
   * Validates URL and checks for SSRF attempts
   */
  static validate(urlString: string): Result<URL, ValidationError> {
    let url: URL;

    // Parse URL
    try {
      url = new URL(urlString);
    } catch {
      return failure(new ValidationError('Invalid URL format'));
    }

    // Check protocol
    if (!['http:', 'https:'].includes(url.protocol)) {
      return failure(
        new ValidationError(
          `Protocol ${url.protocol} is not allowed. Only HTTP and HTTPS are supported.`,
        ),
      );
    }

    // Check for SSRF vulnerabilities
    const ssrfCheck = this.checkSSRF(url);
    if (!ssrfCheck.success) {
      return ssrfCheck;
    }

    return success(url);
  }

  private static checkSSRF(url: URL): Result<void, ValidationError> {
    const hostname = url.hostname.toLowerCase();

    // Block cloud metadata services FIRST (most specific)
    const blockedMetadata = [
      '169.254.169.254', // AWS, Azure, GCP, etc.
      'metadata.google.internal',
      'metadata',
    ];

    if (blockedMetadata.includes(hostname)) {
      return failure(new ValidationError('Metadata service URLs are not allowed'));
    }

    // Block localhost and loopback
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === '127.0.0.1' ||
      /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)
    ) {
      return failure(new ValidationError('Localhost URLs are not allowed'));
    }

    // Block 0.0.0.0
    if (hostname === '0.0.0.0') {
      return failure(new ValidationError('Invalid host address'));
    }

    // Block private IPv4 ranges
    // 10.0.0.0/8
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return failure(new ValidationError('Private IP addresses are not allowed'));
    }

    // 172.16.0.0/12
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return failure(new ValidationError('Private IP addresses are not allowed'));
    }

    // 192.168.0.0/16
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return failure(new ValidationError('Private IP addresses are not allowed'));
    }

    // 169.254.0.0/16 (link-local) - after metadata check
    if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return failure(new ValidationError('Link-local addresses are not allowed'));
    }

    // Block IPv6 private ranges
    if (hostname.includes(':')) {
      // IPv6 localhost
      if (hostname === '::1' || hostname === '[::1]') {
        return failure(new ValidationError('Localhost IPv6 addresses are not allowed'));
      }

      // IPv6 link-local (fe80::/10)
      if (hostname.startsWith('fe80:') || hostname.startsWith('[fe80:')) {
        return failure(new ValidationError('Link-local IPv6 addresses are not allowed'));
      }

      // IPv6 unique local (fc00::/7)
      if (
        hostname.startsWith('fc') ||
        hostname.startsWith('fd') ||
        hostname.startsWith('[fc') ||
        hostname.startsWith('[fd')
      ) {
        return failure(new ValidationError('Private IPv6 addresses are not allowed'));
      }
    }

    // Block internal infrastructure domains
    if (
      hostname.endsWith('.internal') ||
      hostname.endsWith('.flycast') ||
      hostname.endsWith('.local')
    ) {
      return failure(new ValidationError('Internal infrastructure domains are not allowed'));
    }

    // Block @ in URL (potential bypass attempt)
    if (url.href.includes('@') && !url.href.match(/^https?:\/\/[^@]+@/)) {
      return failure(new ValidationError('URLs with @ are not allowed'));
    }

    return success(undefined);
  }
}
