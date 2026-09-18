import express from 'express';
import {
  getSchedulePayments,
  togglePayment,
  updatePenalty,
  markAllPaid
} from '../controllers/paymentController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/schedules/:scheduleId/payments', getSchedulePayments);
router.post('/schedules/:scheduleId/mark-all-paid', markAllPaid);
router.post('/:paymentId/toggle', togglePayment);
router.post('/:paymentId/penalty', updatePenalty);

export default router;
