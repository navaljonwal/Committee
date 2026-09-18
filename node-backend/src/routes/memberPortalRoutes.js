import express from 'express';
import {
  getMemberDashboard,
  getMemberCommittee,
  getLiveBids,
  submitBid
} from '../controllers/memberPortalController.js';
import { authenticate, requireMember } from '../middleware/auth.js';
import { decodeHash } from '../middleware/decodeHash.js';

const router = express.Router();

router.use(authenticate);

// Live bids can be polled by both admin & member
router.get('/committees/:committeeId/live-bids', decodeHash('committeeId'), getLiveBids);

// Member-specific routes
router.get('/dashboard', requireMember, getMemberDashboard);
router.get('/committees/:committeeId', decodeHash('committeeId'), requireMember, getMemberCommittee);
router.post('/schedules/:scheduleId/bid', decodeHash('scheduleId'), requireMember, submitBid);

export default router;
