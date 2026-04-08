import { Router } from 'express';
import { registerStudent, registerPersonnel, loginStudent, loginPersonnel } from '../controllers/authController';

const router = Router();

// Student routes
router.post('/register', registerStudent);
router.post('/login', loginStudent);

// Personnel routes
router.post('/register-personnel', registerPersonnel);
router.post('/login-personnel', loginPersonnel);

export default router;
