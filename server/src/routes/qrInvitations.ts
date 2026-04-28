import { Router } from 'express';
import { aceptarInvitacionDeQr } from '../controllers/invitationsController';

const router = Router();

router.put('/:reservaId/:userId/aceptarConQr', aceptarInvitacionDeQr);

export default router;