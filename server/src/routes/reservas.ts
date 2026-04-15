import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { cancelarReserva, generarQrCode } from '../controllers/reservasController'

const router = Router();

// All room endpoints require authentication
router.use(authenticate);

router.patch('/:reservaId/cancel', cancelarReserva)
router.get('/:reservaId/qrCode', generarQrCode)

export default router;
