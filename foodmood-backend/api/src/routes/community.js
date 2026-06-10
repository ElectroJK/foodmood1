import { Router } from 'express';
import { z } from 'zod';
import CommunityListing from '../models/CommunityListing.js';
import { authRequired } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authRequired);

const createSchema = {
  body: z.object({
    itemName: z.string().min(1).max(120),
    quantity: z.string().min(1).max(40),
    image: z.string().url().optional(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    expiresAt: z.string().optional(),
  }),
};

// GET /api/community?lat=..&lng=..&radius=5000
router.get('/', async (req, res) => {
  const { lat, lng, radius } = req.query;

  let query = CommunityListing.find({ status: 'available' }).populate('user', 'name');
  let withDistances = false;

  if (lat && lng) {
    const r = parseInt(radius || '5000', 10);
    query = CommunityListing.find({
      status: 'available',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: r,
        },
      },
    }).populate('user', 'name');
    withDistances = true;
  }

  const docs = await query.limit(50).exec();

  // Compute approximate haversine distance for display
  function haversine(la1, lo1, la2, lo2) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(la2 - la1);
    const dLon = toRad(lo2 - lo1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(la1)) * Math.cos(toRad(la2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  const listings = docs.map((d) => {
    const distance =
      withDistances && lat && lng
        ? haversine(parseFloat(lat), parseFloat(lng), d.location.coordinates[1], d.location.coordinates[0])
        : undefined;
    return d.toDTO(d.user?.name, distance);
  });
  res.json({ listings });
});

router.post('/', validate(createSchema), async (req, res) => {
  const doc = await CommunityListing.create({
    user: req.userId,
    itemName: req.body.itemName,
    quantity: req.body.quantity,
    image: req.body.image,
    location: { type: 'Point', coordinates: [req.body.lng, req.body.lat] },
    expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
  });
  res.status(201).json({ listing: doc.toDTO(req.user.name) });
});

router.delete('/:id', async (req, res) => {
  const doc = await CommunityListing.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!doc) return res.status(404).json({ error: 'Listing not found' });
  res.json({ ok: true });
});

router.post('/:id/claim', async (req, res) => {
  const doc = await CommunityListing.findOneAndUpdate(
    { _id: req.params.id, status: 'available' },
    { status: 'claimed' },
    { new: true }
  );
  if (!doc) return res.status(404).json({ error: 'Listing not available' });
  res.json({ listing: doc.toDTO() });
});

export default router;
