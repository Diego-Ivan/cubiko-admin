import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { cancelarReserva, crearReserva, generarQrCodeInvitacion, generarQrCodeAcceso, extenderReserva, adminResolverExtension } from '../controllers/reservasController'


const router = Router();

// All room endpoints require authentication
router.use(authenticate);

router.patch('/:reservaId/cancel', cancelarReserva)
router.patch('/:reservaId/extend', extenderReserva)
router.patch('/extensions/:requestId/resolve', adminResolverExtension)
router.get('/:reservaId/qrCode/invite', generarQrCodeInvitacion)
router.get('/:reservaId/qrCode/acceso', generarQrCodeAcceso)

router.put('/create', crearReserva)
export default router;
