// Proxy to the OCR microservice. Forwards a multipart image and returns parsed items.
//
// Uses Node's built-in FormData + Blob (Node 20+) which integrate properly with
// the native global fetch. The `form-data` npm package is intentionally NOT used
// here because its streams are not consumed correctly by native fetch and cause
// "Unexpected end of form" on the receiving side.

import { env } from '../config/env.js';

export async function forwardToOCR(fileBuffer, mimeType = 'image/jpeg', originalName = 'receipt.jpg') {
  const form = new FormData();
  const blob = new Blob([fileBuffer], { type: mimeType });
  form.append('image', blob, originalName);

  const res = await fetch(`${env.OCR_SERVICE_URL.replace(/\/$/, '')}/ocr/scan`, {
    method: 'POST',
    body: form,
    // No headers — fetch sets multipart Content-Type with boundary automatically.
  });

  if (!res.ok) {
    const text = await res.text();
    throw Object.assign(new Error(`OCR service error (${res.status}): ${text}`), { status: 502 });
  }
  return res.json();
}
