export interface BarcodeFormat {
  format: string;
  rawValue: string;
}

export function isBarcodeDetectorSupported(): boolean {
  return 'BarcodeDetector' in globalThis;
}

export async function detectBarcode(
  imageData: ImageData | HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<BarcodeFormat[]> {
  if (!isBarcodeDetectorSupported()) {
    throw new Error('BarcodeDetector not supported');
  }

  const BarcodeDetector = (globalThis as any).BarcodeDetector;
  const detector = new BarcodeDetector({
    formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e']
  });

  const barcodes = await detector.detect(imageData);

  return barcodes.map((barcode: any) => ({
    format: barcode.format,
    rawValue: barcode.rawValue
  }));
}