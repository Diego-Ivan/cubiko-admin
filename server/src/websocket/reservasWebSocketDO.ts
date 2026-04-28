import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

interface AdminConnection {
  id: string;
  email: string;
  tipo: string;
}

/**
 * Durable Object for managing WebSocket connections and broadcasting notifications
 * Handles:
 * - WebSocket connection management with JWT authentication
 * - Admin room tracking for extension request notifications
 * - Student notifications for extension resolution
 */
export class ReservasWebSocketDO {
  state: any;
  env: any;
  adminConnections: Map<string, AdminConnection> = new Map();
  studentConnections: Map<string, JWTPayload> = new Map();
  webSocketConnections: Map<string, any> = new Map();

  constructor(state: any, env: any) {
    this.state = state;
    this.env = env;
  }

  /**
   * Handle incoming WebSocket upgrade requests
   */
  async fetch(request: Request): Promise<Response> {
    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 400 });
    }

    // Extract JWT token from query parameters
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Authentication error: Token is required' }),
        { status: 401 }
      );
    }

    // Verify JWT token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Authentication error: Invalid token' }),
        { status: 401 }
      );
    }

    // Accept WebSocket connection
    const webSocketPair = new (globalThis as any).WebSocketPair();
    const [client, server] = Object.values(webSocketPair) as any[];

    // Handle server-side WebSocket events
    this.handleWebSocket(server, decoded);

    return new Response(null, {
      status: 101,
      webSocket: client
    } as any);
  }

  /**
   * Handle WebSocket connection lifecycle
   */
  private handleWebSocket(webSocket: any, user: JWTPayload) {
    webSocket.accept();

    const socketId = `${user.id}-${Date.now()}-${Math.random()}`;
    const connection = { id: socketId, email: user.email, tipo: user.tipo };

    console.log(
      `[WebSocket] User connected: ${user.email} (Type: ${user.tipo}) - Socket ID: ${socketId}`
    );

    // Track admin connections in "admin" room
    if (user.tipo === 'personal') {
      this.adminConnections.set(socketId, connection);
      this.webSocketConnections.set(socketId, webSocket);
      console.log(`[WebSocket] Admin ${user.email} joined admin room`);
    } else {
      this.studentConnections.set(socketId, user);
      this.webSocketConnections.set(socketId, webSocket);
    }

    // Handle incoming WebSocket messages (for future extensibility)
    webSocket.addEventListener('message', (event: any) => {
      try {
        const data = JSON.parse(event.data as string);
        console.log(`[WebSocket] Message from ${user.email}:`, data);
      } catch (err) {
        console.error(`[WebSocket] Failed to parse message:`, err);
      }
    });

    // Handle WebSocket closure
    webSocket.addEventListener('close', () => {
      console.log(`[WebSocket] User disconnected: ${user.email}`);
      this.adminConnections.delete(socketId);
      this.studentConnections.delete(socketId);
      this.webSocketConnections.delete(socketId);
    });

    // Handle WebSocket errors
    webSocket.addEventListener('error', (err: any) => {
      console.error(`[WebSocket] Error for ${user.email}:`, err);
    });
  }

  /**
   * Notify all connected admins about a new extension request
   */
  async notifyAdminsNewExtension(requestData: any) {
    const message = JSON.stringify({
      event: 'new_extension_request',
      data: requestData
    });

    const failedConnections: string[] = [];

    for (const [socketId, admin] of this.adminConnections.entries()) {
      try {
        const ws = this.webSocketConnections.get(socketId);
        if (ws) {
          ws.send(message);
          console.log(
            `[Notification] Sending extension request to admin: ${admin.email}`
          );
        }
      } catch (err) {
        console.error(`[Notification] Failed to notify admin ${admin.email}:`, err);
        failedConnections.push(socketId);
      }
    }

    // Clean up failed connections
    failedConnections.forEach((socketId) => {
      this.adminConnections.delete(socketId);
      this.webSocketConnections.delete(socketId);
    });

    return {
      success: true,
      message: 'Extension request notification sent to admins',
      adminCount: this.adminConnections.size
    };
  }

  /**
   * Notify a specific student about extension resolution
   */
  async notifyExtensionResolved(requestData: any) {
    const message = JSON.stringify({
      event: 'extension_resolved',
      data: requestData
    });

    const failedConnections: string[] = [];

    for (const [socketId, student] of this.studentConnections.entries()) {
      try {
        const ws = this.webSocketConnections.get(socketId);
        if (ws) {
          ws.send(message);
          console.log(
            `[Notification] Sending extension resolution to student: ${student.email}`
          );
        }
      } catch (err) {
        console.error(
          `[Notification] Failed to notify student ${student.email}:`,
          err
        );
        failedConnections.push(socketId);
      }
    }

    // Clean up failed connections
    failedConnections.forEach((socketId) => {
      this.studentConnections.delete(socketId);
      this.webSocketConnections.delete(socketId);
    });

    return {
      success: true,
      message: 'Extension resolution notification sent to students',
      studentCount: this.studentConnections.size
    };
  }
}
