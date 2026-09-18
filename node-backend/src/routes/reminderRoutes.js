import express from 'express';
import {
  getReminders,
  createReminder,
  markReminderDone,
  deleteReminder
} from '../controllers/reminderController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/', getReminders);
router.post('/', createReminder);
router.patch('/:id/done', markReminderDone);
router.delete('/:id', deleteReminder);

export default router;
