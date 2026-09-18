import express from 'express';
import { updateProfile, updatePassword } from '../controllers/profileController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.put('/', updateProfile);
router.put('/password', updatePassword);

export default router;
