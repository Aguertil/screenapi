/**
 * Device presets for popular mobile devices and screen sizes
 * Based on most sold devices and common developer testing needs
 */

export interface DevicePreset {
  name: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
  userAgent: string;
  category: 'phone' | 'tablet' | 'desktop';
}

export const DEVICE_PRESETS: Record<string, DevicePreset> = {
  // iPhone (iOS) - Most Popular
  'iphone-15-pro-max': {
    name: 'iPhone 15 Pro Max',
    width: 430,
    height: 932,
    deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    category: 'phone',
  },
  'iphone-15-pro': {
    name: 'iPhone 15 Pro',
    width: 393,
    height: 852,
    deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    category: 'phone',
  },
  'iphone-14-pro-max': {
    name: 'iPhone 14 Pro Max',
    width: 430,
    height: 932,
    deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    category: 'phone',
  },
  'iphone-14': {
    name: 'iPhone 14',
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    category: 'phone',
  },
  'iphone-13': {
    name: 'iPhone 13',
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1',
    category: 'phone',
  },
  'iphone-12': {
    name: 'iPhone 12',
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    category: 'phone',
  },
  'iphone-se': {
    name: 'iPhone SE (3rd gen)',
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1',
    category: 'phone',
  },

  // Samsung Galaxy (Android) - Best Sellers
  'galaxy-s24-ultra': {
    name: 'Samsung Galaxy S24 Ultra',
    width: 412,
    height: 915,
    deviceScaleFactor: 3.5,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    category: 'phone',
  },
  'galaxy-s23': {
    name: 'Samsung Galaxy S23',
    width: 360,
    height: 780,
    deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
    category: 'phone',
  },
  'galaxy-a54': {
    name: 'Samsung Galaxy A54',
    width: 412,
    height: 915,
    deviceScaleFactor: 2.5,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
    category: 'phone',
  },

  // Google Pixel
  'pixel-8-pro': {
    name: 'Google Pixel 8 Pro',
    width: 412,
    height: 915,
    deviceScaleFactor: 2.625,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
    category: 'phone',
  },
  'pixel-7': {
    name: 'Google Pixel 7',
    width: 412,
    height: 915,
    deviceScaleFactor: 2.625,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Mobile Safari/537.36',
    category: 'phone',
  },

  // Tablets
  'ipad-pro-12.9': {
    name: 'iPad Pro 12.9"',
    width: 1024,
    height: 1366,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    category: 'tablet',
  },
  'ipad-air': {
    name: 'iPad Air',
    width: 820,
    height: 1180,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    category: 'tablet',
  },
  'galaxy-tab-s9': {
    name: 'Samsung Galaxy Tab S9',
    width: 800,
    height: 1280,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
    category: 'tablet',
  },

  // Desktop Common Resolutions
  'desktop-1920': {
    name: 'Desktop 1920x1080 (Full HD)',
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    category: 'desktop',
  },
  'desktop-1440': {
    name: 'Desktop 2560x1440 (2K)',
    width: 2560,
    height: 1440,
    deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    category: 'desktop',
  },
  'macbook-pro-16': {
    name: 'MacBook Pro 16"',
    width: 1728,
    height: 1117,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    category: 'desktop',
  },
};

/**
 * Get all available device presets grouped by category
 */
export function getDevicesByCategory(): Record<string, DevicePreset[]> {
  const grouped: Record<string, DevicePreset[]> = {
    phone: [],
    tablet: [],
    desktop: [],
  };

  Object.entries(DEVICE_PRESETS).forEach(([key, device]) => {
    grouped[device.category].push({ ...device, name: key });
  });

  return grouped;
}

/**
 * Get device preset by key
 */
export function getDevicePreset(key: string): DevicePreset | undefined {
  return DEVICE_PRESETS[key];
}
