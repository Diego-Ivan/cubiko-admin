import app from './app';
import { createServer } from 'http';
import { initializeSocket } from './socket/socketHandler';

const PORT = process.env.PORT || 3001;

// Define HTTP server encapsulating Express app
const httpServer = createServer(app);

// Initialize Socket.io on the HTTP server
initializeSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`si funciona?: http://localhost:${PORT}/health`);
});
