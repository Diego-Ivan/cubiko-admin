import { Router } from 'express';
import { activarReserva } from '../controllers/reservasController';

const router = Router();

router.put('/:reservaId/activarReserva', activarReserva);

export default router;