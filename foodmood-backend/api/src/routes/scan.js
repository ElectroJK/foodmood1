import { Router } from 'express';
import multer from 'multer';
import { authRequired } from '../middleware/auth.js';
import { forwardToOCR } from '../services/ocrClient.js';
import { filterReceiptItemsWithML } from '../services/mlClient.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Frontend Scanner.tsx posts FormData with field name "image".
// Returns the same shape (ScannedItem[]) that the frontend already expects:
//   { items: [{ name, price, expiryDate, confidence }], rawText, meanConfidence }
router.post('/', authRequired, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded (field: image)' });
    
    // 1. Get raw OCR items
    const result = await forwardToOCR(req.file.buffer, req.file.mimetype, req.file.originalname);
    
    // 2. Filter out non-food items via ML if available
    if (result && result.items && result.items.length > 0) {
      const filtered = await filterReceiptItemsWithML(result.items);
      if (filtered && filtered.filteredItems) {
        // Replace items with the filtered list
        result.items = filtered.filteredItems.map(f => ({
          name: f.name,
          price: f.price,
          expiryDate: f.expiryDate,
          confidence: f.confidence,
        }));
        result.filteredOutCount = filtered.rejectedItems.length;
      }
    }
    
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
