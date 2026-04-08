import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { listAllRooms, listAvailableRooms, listUsedRooms } from '../controllers/roomController';

const router = Router();

// All room endpoints require authentication
router.use(authenticate);

// GET all rooms
router.get('/', listAllRooms);

// GET available rooms
router.get('/available', listAvailableRooms);

// GET used rooms
router.get('/used', listUsedRooms);

export default router;
