import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { upload, uploadImageFile } from '../middleware/upload.js';

const router = Router();

// ─── Upload Image (Product, Receipt, or QR Code) ───
router.post('/', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file was provided.' });
    }

    const folder = req.body.folder || 'jpop';
    const result = await uploadImageFile(req.file, folder);

    res.json({
      url: result.url,
      publicId: result.publicId,
    });
  } catch (err) {
    console.error('Image upload error:', err);
    res.status(500).json({ error: 'Failed to upload image file.' });
  }
});

export default router;
