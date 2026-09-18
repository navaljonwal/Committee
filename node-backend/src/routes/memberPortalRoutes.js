import express from 'express';
import {
  getMemberDashboard,
  getMemberCommittee,
  getLiveBids,
  submitBid
} from '../controllers/memberPortalController.js';
import { authenticate, requireMember } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Live bids can be polled by both admin & member
router.get('/committees/:committeeId/live-bids', getLiveBids);

// Member-specific routes
router.get('/dashboard', requireMember, getMemberDashboard);
router.get('/committees/:committeeId', requireMember, getMemberCommittee);
router.post('/schedules/:scheduleId/bid', requireMember, submitBid);

export default router;
