import express from 'express';
import {
  getAllMembers,
  createMember,
  updateMember,
  deleteMember
} from '../controllers/memberController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { decodeHash } from '../middleware/decodeHash.js';

const router = express.Router();

router.use(authenticate);

// Admin-only member management
router.get('/', requireAdmin, getAllMembers);
router.post('/', requireAdmin, createMember);
router.put('/:id', requireAdmin, decodeHash('id'), updateMember);
router.delete('/:id', requireAdmin, decodeHash('id'), deleteMember);

export default router;
