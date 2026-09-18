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

// Member-specific routes
router.get('/dashboard', requireMember, getMemberDashboard);
router.get('/committees/:committeeId', decodeHash('committeeId'), requireMember, getMemberCommittee);
router.post('/schedules/:scheduleId/bid', decodeHash('scheduleId'), requireMember, submitBid);

export default router;
