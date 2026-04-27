/**
 * QR Code Generator for Cloudflare Workers
 * Uses qrcode-svg for pure JavaScript QR code generation
 * Compatible with Cloudflare Workers environment (no native dependencies)
 */

import QRCode from 'qrcode-svg';

// In-memory cache for generated QR codes
const qrCache = new Map<string, string>();

/**
 * Generate a QR code as a data URL
 * @param data - The data to encode in the QR code
 * @param format - Output format: 'svg' or 'png'
 * @returns Data URL string
 */
export async function generateQRDataURL(
  data: string,
  format: 'svg' | 'png' = 'svg'
): Promise<string> {
  const cacheKey = `${data}:${format}`;
  
  // Check cache first
  const cached = qrCache.get(cacheKey);
  if (cached) {
    console.debug(`QR code retrieved from cache: ${cacheKey}`);
    return cached;
  }

  try {
    const qrSvg = new QRCode({
      content: data,
      padding: 10,
      width: 300,
      height: 300,
      color: '#000000',
      background: '#ffffff',
      ecl: 'H'
    });

    let dataUrl: string;
    
    if (format === 'svg') {
      // Return SVG as data URL
      const svgString = qrSvg.svg();
      dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`;
    } else if (format === 'png') {
      // Convert SVG to PNG using canvas
      // Note: In Cloudflare Workers, we'll use SVG instead since canvas may not be available
      // If PNG is critical, consider using a third-party service or client-side generation
      const svgString = qrSvg.svg();
      dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`;
      console.warn('PNG format requested but using SVG instead for Worker compatibility');
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }

    // Cache the result
    qrCache.set(cacheKey, dataUrl);
    console.debug(`QR code generated and cached: ${cacheKey}`);

    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', { data, format, error });
    throw error;
  }
}

/**
 * Clear the QR code cache
 * Useful for memory management in long-running processes
 */
export function clearQRCache(): void {
  qrCache.clear();
  console.debug('QR code cache cleared');
}

/**
 * Get cache statistics
 * @returns Cache size and keys
 */
export function getQRCacheStats(): { size: number; keys: string[] } {
  return {
    size: qrCache.size,
    keys: Array.from(qrCache.keys())
  };
}
