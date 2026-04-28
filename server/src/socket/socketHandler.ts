/**
 * Socket Handler for Cloudflare Workers + Durable Objects
 * Replaces Socket.io with WebSocket connections managed by Durable Objects
 */

let doStub: any; // Stub for accessing the Durable Object

/**
 * Initialize socket handler with Durable Object binding
 * Called once at worker startup to set up notification routing
 */
export async function initializeSocket(env: any) {
  // Get reference to the Durable Object namespace
  const doNamespace = env.RESERVAS_WEBSOCKET_DO;
  
  if (!doNamespace) {
    console.warn(
      '[Socket] Durable Object binding not found. WebSocket notifications will be unavailable.'
    );
    return;
  }

  // Use a deterministic ID for the singleton Durable Object instance
  // All notification calls will route through this instance
  const id = doNamespace.idFromName('reservas-notifications');
  doStub = doNamespace.get(id);
  
  console.log('[Socket] Initialized Durable Object stub for notifications');
}

/**
 * Broadcast new extension request to all connected admins
 * Delegates to Durable Object to handle WebSocket broadcast
 */
export async function notifyAdminsNewExtension(requestData: any) {
  if (!doStub) {
    console.warn(
      '[Socket] Durable Object not initialized. Extension notification not sent.'
    );
    return;
  }

  try {
    const response = await doStub.fetch(new Request('https://do.local/notify-admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestData })
    }));
    
    const result = await response.json();
    console.log('[Socket] Admin notification sent:', result);
  } catch (err) {
    console.error('[Socket] Failed to send admin notification:', err);
  }
}

/**
 * Notify students about extension resolution
 * Delegates to Durable Object to handle WebSocket broadcast
 */
export async function notifyExtensionResolved(
  estudianteId: number,
  requestData: any
) {
  if (!doStub) {
    console.warn(
      '[Socket] Durable Object not initialized. Resolution notification not sent.'
    );
    return;
  }

  try {
    const response = await doStub.fetch(new Request('https://do.local/notify-students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estudianteId, requestData })
    }));
    
    const result = await response.json();
    console.log('[Socket] Student notification sent:', result);
  } catch (err) {
    console.error('[Socket] Failed to send student notification:', err);
  }
}
