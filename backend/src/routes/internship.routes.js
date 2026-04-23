const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  acceptOffer,
  rejectOffer,
  acceptOfferPlatform,
  rejectOfferPlatform,
  getMyOffer,
} = require('../controllers/offerPipeline.controller');

// Magic link routes (from email — unauthenticated)
router.get('/accept', acceptOffer);
router.get('/reject', rejectOffer);

// Platform button routes (authenticated)
router.get('/my-offer', protect, getMyOffer);
router.post('/:id/accept', protect, acceptOfferPlatform);
router.post('/:id/reject', protect, rejectOfferPlatform);

module.exports = router;
