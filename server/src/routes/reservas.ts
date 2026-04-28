import { Router } from 'express';
import { authenticate, authorizePersonnel } from '../middleware/auth';
import { cancelarReserva, crearReserva, generarQrCodeInvitacion, generarQrCodeAcceso, reprogramarReserva, obtenerMisReservas, listReservas, listExtensionRequests, adminResolverExtension } from '../controllers/reservasController'

const router = Router();

// All room endpoints require authentication
router.use(authenticate);

router.get('/all', authorizePersonnel, listReservas);
router.get('/extensions/all', authorizePersonnel, listExtensionRequests);
router.patch('/extensions/:requestId/resolve', authorizePersonnel, adminResolverExtension);

router.patch('/:reservaId/cancel', cancelarReserva)
router.put('/:reservaId/reschedule', reprogramarReserva)
router.get('/:reservaId/qrCode/invite', generarQrCodeInvitacion)
router.get('/:reservaId/qrCode/acceso', generarQrCodeAcceso)
router.get('/mis-reservas', obtenerMisReservas)

router.put('/create', crearReserva)
export default router;
