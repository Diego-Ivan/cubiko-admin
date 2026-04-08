import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { cancelarReserva } from '../controllers/reservasController'

const router = Router();

// All room endpoints require authentication
router.use(authenticate);

router.post('/:reservaId/cancel', cancelarReserva)

export default router;
