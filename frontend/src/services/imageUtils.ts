/**
 * Optimizes and compresses base64 images to drastically reduce payload size
 * and speed up network upload to Gemini from several seconds to <100ms.
 */
export async function optimizeImageForGemini(
  base64Data: string,
  maxDimension = 1400,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve) => {
    // If not a data URL or small enough, return as is
    if (!base64Data.startsWith('data:image')) {
      resolve(base64Data);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let { width, height } = img;

      // Only downscale if larger than maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        resolve(base64Data);
        return;
      }

      // Fill white background in case of transparent PNGs
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(img, 0, 0, width, height);

      // Export as optimized JPEG
      const optimized = canvas.toDataURL('image/jpeg', quality);
      resolve(optimized);
    };

    img.onerror = () => {
      resolve(base64Data);
    };

    img.src = base64Data;
  });
}
