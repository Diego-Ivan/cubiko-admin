import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

let io: SocketIOServer;

const JWT_SECRET = process.env.JWT_SECRET || 'secret'; // Normally pulled from env

export function initializeSocket(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // Adjust based on your CORS policy
      methods: ["GET", "POST", "PATCH"]
    }
  });

  io.use((socket, next) => {
    // Authenticate the socket via token provided in handshake auth
    const token = socket.handshake.auth?.token as string;
    
    if (!token) {
      return next(new Error('Authentication error: Token is required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as JWTPayload;

    console.log(`User connected: ${user.email} (Type: ${user.tipo}) - Socket ID: ${socket.id}`);

    // Allow admins to join an 'admins' room
    if (user.tipo === 'personal') {
      socket.join('admins');
      console.log(`Admin ${user.email} joined admins room`);
    }

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.email}`);
    });
  });
}

// Function to broadcast new extension requests to all connected admins
export function notifyAdminsNewExtension(requestData: any) {
  if (io) {
    io.to('admins').emit('new_extension_request', requestData);
  }
}

// Function to notify a specific user (student) that their request was updated
// Because users might not be easily queryable by ID in sockets unless we track them,
// We could emit globally and the client filters, or we keep track of socket map.
// For simplicity, we emit a global event that clients can filter by their student ID.
export function notifyExtensionResolved(estudianteId: number, requestData: any) {
  if (io) {
    io.emit('extension_resolved', { estudianteId, requestData });
  }
}
