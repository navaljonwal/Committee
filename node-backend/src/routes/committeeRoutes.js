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
  updateMembersSync,
  toggleFutureVisibility,
  toggleScheduleInstallmentVisibility
} from '../controllers/committeeController.js';
import { exportCsv } from '../controllers/exportController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { decodeHash } from '../middleware/decodeHash.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

// Dashboard & Preview
router.get('/', getCommitteesDashboard);
router.post('/preview', previewCalculation);

// CRUD — decode hashed :id param back to numeric DB id
router.post('/', createCommittee);
router.get('/:id', decodeHash('id'), getCommitteeDetail);
router.put('/:id', decodeHash('id'), updateCommittee);
router.delete('/:id', decodeHash('id'), deleteCommittee);

// Committee member sync
router.post('/:committeeId/members', decodeHash('committeeId'), updateMembersSync);

// Schedules, winners, dates, and bidding actions — decode :scheduleId and :bidId
router.post('/schedules/:scheduleId/winner', decodeHash('scheduleId'), updateWinner);
router.post('/schedules/:scheduleId/date', decodeHash('scheduleId'), updateScheduleDate);
router.post('/schedules/:scheduleId/payout', decodeHash('scheduleId'), updatePayout);
router.post('/schedules/:scheduleId/bid', decodeHash('scheduleId'), updateAuctionBid);
router.post('/schedules/:scheduleId/lock-default', decodeHash('scheduleId'), lockFormulaDefault);
router.post('/schedules/bids/:bidId/approve', decodeHash('bidId'), approveMemberBid);

// Export CSV
router.get('/:id/export/csv', decodeHash('id'), exportCsv);

// Member visibility toggles
router.post('/:id/toggle-future-visibility', decodeHash('id'), toggleFutureVisibility);
router.post('/schedules/:scheduleId/toggle-installment-visibility', decodeHash('scheduleId'), toggleScheduleInstallmentVisibility);

export default router;
