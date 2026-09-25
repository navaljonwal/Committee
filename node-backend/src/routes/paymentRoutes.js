import express from 'express';
import {
  getSchedulePayments,
  togglePayment,
  toggleMemberPayments,
  updatePenalty,
  markAllPaid
} from '../controllers/paymentController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { decodeHash } from '../middleware/decodeHash.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/schedules/:scheduleId/payments', decodeHash('scheduleId'), getSchedulePayments);
router.post('/schedules/:scheduleId/mark-all-paid', decodeHash('scheduleId'), markAllPaid);
router.post('/schedules/:scheduleId/members/:memberId/toggle', decodeHash('scheduleId', 'memberId'), toggleMemberPayments);
router.post('/:paymentId/toggle', decodeHash('paymentId'), togglePayment);
router.post('/:paymentId/penalty', decodeHash('paymentId'), updatePenalty);

export default router;
