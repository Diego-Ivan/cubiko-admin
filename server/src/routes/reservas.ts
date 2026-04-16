import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { cancelarReserva, generarQrCodeInvitacion, generarQrCodeAcceso } from '../controllers/reservasController'

const router = Router();

// All room endpoints require authentication
router.use(authenticate);

router.patch('/:reservaId/cancel', cancelarReserva)
router.get('/:reservaId/qrCode/invite', generarQrCodeInvitacion)
router.get('/:reservaId/qrCode/acceso', generarQrCodeAcceso)

export default router;
