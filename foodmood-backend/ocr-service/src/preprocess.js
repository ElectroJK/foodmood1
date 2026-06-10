import sharp from 'sharp';

// Receipts are often skewed/low-contrast. Tesseract is sensitive to that, so we:
// - convert to grayscale
// - normalize contrast
// - upscale slightly (improves accuracy on small print)
// - threshold to pure black-on-white
export async function preprocessReceipt(buffer) {
  return sharp(buffer)
    .rotate() // honour EXIF orientation
    .grayscale()
    .normalize()
    .resize({ width: 1600, withoutEnlargement: false })
    .sharpen()
    .threshold(160)
    .toBuffer();
}
