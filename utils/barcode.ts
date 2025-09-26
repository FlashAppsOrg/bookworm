import Quagga from "quagga";

export interface BarcodeFormat {
  format: string;
  rawValue: string;
}

interface QuaggaResult {
  codeResult?: {
    format: string;
    code: string;
  };
}

export function isBarcodeDetectorSupported(): boolean {
  return true;
}

export function detectBarcode(
  canvas: HTMLCanvasElement
): Promise<BarcodeFormat[]> {
  return new Promise((resolve) => {
    Quagga.decodeSingle({
      src: canvas.toDataURL(),
      numOfWorkers: 0,
      decoder: {
        readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader"]
      },
      locate: true,
    }, (result: QuaggaResult) => {
      if (result && result.codeResult) {
        resolve([{
          format: result.codeResult.format,
          rawValue: result.codeResult.code
        }]);
      } else {
        resolve([]);
      }
    });
  });
}