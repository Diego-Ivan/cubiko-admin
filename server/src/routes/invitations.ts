import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { updateInvitationStatus, aceptarInvitacionDeQr } from '../controllers/invitationsController';

const router = Router();

// All invitation endpoints require authentication
router.use(authenticate);

router.patch('/:id/status', updateInvitationStatus);
router.put('/:reservaId/aceptarConQr', aceptarInvitacionDeQr);

export default router;