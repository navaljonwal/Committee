import express from 'express';
import {
  getAllMembers,
  createMember,
  updateMember,
  deleteMember
} from '../controllers/memberController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Admin-only member management
router.get('/', requireAdmin, getAllMembers);
router.post('/', requireAdmin, createMember);
router.put('/:id', requireAdmin, updateMember);
router.delete('/:id', requireAdmin, deleteMember);

export default router;
