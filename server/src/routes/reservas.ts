import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { cancelarReserva, extenderReserva, adminResolverExtension } from '../controllers/reservasController'

const router = Router();

// All room endpoints require authentication
router.use(authenticate);

router.patch('/:reservaId/cancel', cancelarReserva)
router.patch('/:reservaId/extend', extenderReserva)
router.patch('/extensions/:requestId/resolve', adminResolverExtension)

export default router;
