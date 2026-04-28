import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { updateInvitationStatus } from '../controllers/invitationsController';

const router = Router();

// All invitation endpoints require authentication
router.use(authenticate);

router.patch('/:id/status', updateInvitationStatus);

export default router;