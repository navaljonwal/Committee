import express from 'express';
import {
  getMemberDashboard,
  getMemberCommittee,
  getLiveBids,
  subscribeLiveBids,
  submitBid
} from '../controllers/memberPortalController.js';
import { authenticate, requireMember } from '../middleware/auth.js';
import { decodeHash } from '../middleware/decodeHash.js';

const router = express.Router();

router.use(authenticate);

// Live bids can be polled by both admin & member
router.get('/committees/:committeeId/live-bids', decodeHash('committeeId'), getLiveBids);

// Real-time SSE Live Stream (Instant push updates to all members without page refresh)
router.get('/committees/:committeeId/live-stream', decodeHash('committeeId'), subscribeLiveBids);

// Member-specific routes disabled — always return 404 Page Not Found
router.get('/dashboard', (req, res) => res.status(404).json({ success: false, message: 'Page not found' }));
router.get('/committees/:committeeId', (req, res) => res.status(404).json({ success: false, message: 'Page not found' }));
router.post('/schedules/:scheduleId/bid', (req, res) => res.status(404).json({ success: false, message: 'Page not found' }));

export default router;
