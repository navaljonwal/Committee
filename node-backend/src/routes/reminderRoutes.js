import express from 'express';
import {
  getReminders,
  createReminder,
  markReminderDone,
  deleteReminder
} from '../controllers/reminderController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { decodeHash } from '../middleware/decodeHash.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/', getReminders);
router.post('/', createReminder);
router.patch('/:id/done', decodeHash('id'), markReminderDone);
router.delete('/:id', decodeHash('id'), deleteReminder);

export default router;
