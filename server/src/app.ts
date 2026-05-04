import express, { Express } from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import roomRoutes from './routes/rooms';
import reservasRoutes from './routes/reservas';
import estudiantesRoutes from './routes/estudiantes';
import invitationsRoutes from './routes/invitations';
import morganMiddleware from './middleware/morgan';

const app: Express = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morganMiddleware);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/invitations', invitationsRoutes);
app.use('/api/estudiantes', estudiantesRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;

