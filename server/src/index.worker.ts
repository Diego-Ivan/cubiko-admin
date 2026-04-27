// ==================
// Cloudflare Workers Entry Point
// ==================
// This file is the main handler for Cloudflare Workers
// It adapts the Express app to work with the Workers fetch API

import type { D1Binding } from './utils/d1Adapter';

// Extend global scope to include D1 binding
declare global {
  //eslint-disable-next-line no-var
  var DB: D1Binding;
}

// Hack to prevent iconv-lite (used by express body-parser) from crashing in Cloudflare Workers
// because Esbuild bundles the browser version (where streams is empty) but Cloudflare provides a mock `process` object.
if (typeof process !== 'undefined') {
  (process as any).versions = undefined;
}

// ExecutionContext type for TypeScript
interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

/**
 * Express adapter for Cloudflare Workers
 * Uses Node.js compatibility mode to run Express on Workers
 */
export interface Env {
  DB: D1Binding;
  ENVIRONMENT?: string;
  DB_ENV?: string;
}

let app: any;

/**
 * Initialize Express app with D1 binding injected
 */
async function initializeApp(db: D1Binding) {
  // Inject D1 into globalThis so database.ts can access it
  globalThis.DB = db;

  // Import Express app (loads after D1 is available)
  const appModule = await import('./app');
  return appModule.default;
}

/**
 * Main fetch handler for Workers
 */
export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    try {
      // Initialize app on first request
      if (!app) {
        app = await initializeApp(env.DB);
      }

      // Create a mock Node.js req/res for Express
      // We'll use a library approach: convert fetch request to Express-compatible request

      // For now, use a simple approach: delegate to fetch event listener
      // This requires using the nodejs_compat compatibility flag in wrangler.toml

      // Alternative: use a proper adapter library
      // For production, consider using one of these:
      // - itty-router + manual routing
      // - cf-request-adapter
      // - express-on-workers

      // Simple delegation using Node.js compatibility mode
      const url = new URL(request.url);

      // Simpler approach: parse request and delegate to Express routes

      const pathname = url.pathname;
      // Re-export handling using the fetch event
      // Since Express expects Node.js request/response, we simulate them
      return handleRequest(request, app, pathname);

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }
};

/**
 * Handle incoming requests by delegating to Express app
 * Note: This requires proper Node.js compatibility setup
 */
async function handleRequest(request: Request, app: any, _pathname: string): Promise<Response> {
  // Import the adapter to convert Fetch to Express
  const { createNodeRequest, createNodeResponse } = await import('./utils/workersAdapter');

  const nodereq = createNodeRequest(request);
  const nodeRes = createNodeResponse();

  return new Promise<Response>((resolve, reject) => {
    // Intercept the end() call which Express uses when a route is successfully resolved
    const originalEnd: any = nodeRes.end;
    nodeRes.end = function (this: any, ...args: any[]) {
      const result = originalEnd.apply(this, args);
      resolve(nodeRes.toFetchResponse());
      return result;
    } as any;

    // Delegate to Express app
    app(nodereq, nodeRes, (err: any) => {
      // This callback is only hit if Express falls through all routes (e.g. 404 or unhandled errors)
      if (err) {
        reject(err);
      } else {
        resolve(nodeRes.toFetchResponse());
      }
    });
  });
}
