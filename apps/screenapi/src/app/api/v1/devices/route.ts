import { NextResponse } from 'next/server';
import { DEVICE_PRESETS, getDevicesByCategory } from '@/core/screenshot/domain/device-presets';

/**
 * GET /api/v1/devices
 * Get all available device presets
 */
export async function GET() {
  const devicesByCategory = getDevicesByCategory();
  
  return NextResponse.json({
    success: true,
    devices: Object.entries(DEVICE_PRESETS).map(([key, device]) => ({
      id: key,
      name: device.name,
      width: device.width,
      height: device.height,
      category: device.category,
      deviceScaleFactor: device.deviceScaleFactor,
    })),
    categories: devicesByCategory,
    total: Object.keys(DEVICE_PRESETS).length,
  });
}
