
import Quagga from 'quagga';
import jsQR from 'jsqr';

export async function scanBarcode(imageUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    Quagga.decodeSingle({
      decoder: {
        readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "codabar_reader"]
      },
      locate: true,
      src: imageUrl
    }, (result) => {
      if (result && result.codeResult) {
        resolve(result.codeResult.code);
      } else {
        resolve(null);
      }
    });
  });
}

export async function scanQrCode(imageUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(null);
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        resolve(code.data);
      } else {
        resolve(null);
      }
    };
    
    img.onerror = () => {
      resolve(null);
    };
    
    img.src = imageUrl;
  });
}

export async function identifyStudentFromImage(imageUrl: string): Promise<string | null> {
  // Try QR code first
  const qrData = await scanQrCode(imageUrl);
  if (qrData) {
    return qrData;
  }
  
  // Fall back to barcode
  const barcodeData = await scanBarcode(imageUrl);
  return barcodeData;
}
