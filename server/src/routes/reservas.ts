import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { cancelarReserva, crearReserva } from '../controllers/reservasController'

const router = Router();

// All room endpoints require authentication
router.use(authenticate);

router.patch('/:reservaId/cancel', cancelarReserva)

router.put('/create', crearReserva)
export default router;
