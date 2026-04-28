import { Router } from 'express';
import { aceptarInvitacionDeQr } from '../controllers/invitationsController';
import { activarReserva } from '../controllers/reservasController';

const router = Router();

router.put('/:reservaId/:userId/aceptarConQr', aceptarInvitacionDeQr);
router.put('/:reservaId/activarReserva', activarReserva);

export default router;