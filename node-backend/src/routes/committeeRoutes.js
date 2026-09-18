import express from 'express';
import {
  getCommitteesDashboard,
  previewCalculation,
  createCommittee,
  getCommitteeDetail,
  updateCommittee,
  deleteCommittee,
  updateWinner,
  updateScheduleDate,
  updatePayout,
  updateAuctionBid,
  lockFormulaDefault,
  approveMemberBid,
  updateMembersSync
} from '../controllers/committeeController.js';
import { exportCsv } from '../controllers/exportController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

// Dashboard & Preview
router.get('/', getCommitteesDashboard);
router.post('/preview', previewCalculation);

// CRUD
router.post('/', createCommittee);
router.get('/:id', getCommitteeDetail);
router.put('/:id', updateCommittee);
router.delete('/:id', deleteCommittee);

// Committee member sync
router.post('/:committeeId/members', updateMembersSync);

// Schedules, winners, dates, and bidding actions
router.post('/schedules/:scheduleId/winner', updateWinner);
router.post('/schedules/:scheduleId/date', updateScheduleDate);
router.post('/schedules/:scheduleId/payout', updatePayout);
router.post('/schedules/:scheduleId/bid', updateAuctionBid);
router.post('/schedules/:scheduleId/lock-default', lockFormulaDefault);
router.post('/schedules/bids/:bidId/approve', approveMemberBid);

// Export CSV
router.get('/:id/export/csv', exportCsv);

export default router;
