import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { searchEstudiantes } from '../controllers/estudiantesController';

const router = Router();

router.use(authenticate);

router.get('/search', searchEstudiantes); /*Define la ruta GET /search que ejecuta el controlador de búsqueda*/

export default router;