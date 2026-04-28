// ==================
// Workers→Express Request/Response Adapter
// ==================
// Converts Cloudflare Workers Fetch API requests to Node.js-compatible
// request/response objects that Express can handle

import { Readable } from 'stream';
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Convert Fetch API Request to Node.js-like IncomingMessage
 */
export function createNodeRequest(request: Request): IncomingMessage & { body?: any } {
  const url = new URL(request.url);

  // Create a readable stream from the request body
  const bodyStream = new Readable({
    async read() {
      const body = await request.clone().text();
      this.push(body);
      this.push(null);
    }
  });

  // Create a mock IncomingMessage
  const req = {
    ...bodyStream,

    // HTTP properties
    method: request.method,
    url: `${url.pathname}${url.search}`,
    httpVersion: '1.1',
    httpVersionMajor: 1,
    httpVersionMinor: 1,

    // Headers
    headers: (() => {
      const headersObj: Record<string, string> = {};
      request.headers.forEach((value, key) => {
        headersObj[key.toLowerCase()] = value;
      });
      return headersObj;
    })(),
    headersDistinct: undefined,
    rawHeaders: (() => {
      const headers: string[] = [];
      request.headers.forEach((value, key) => {
        headers.push(key, value);
      });
      return headers;
    })(),

    // Socket properties (mocked for Fetch API)
    socket: {
      remoteAddress: request.headers.get('cf-connecting-ip') || '127.0.0.1',
    },

    // HTTP method aliases
    // eslint-disable-next-line @typescript-eslint/ban-types
    on: function (this: any, event: string, listener: Function) {
      if (event === 'data') {
        bodyStream.on('data', listener as any);
      } else if (event === 'end') {
        bodyStream.on('end', listener as any);
      }
      return this;
    },
    // eslint-disable-next-line @typescript-eslint/ban-types
    once: function (this: any, event: string, listener: Function) {
      if (event === 'data') {
        bodyStream.once('data', listener as any);
      } else if (event === 'end') {
        bodyStream.once('end', listener as any);
      }
      return this;
    },

    // Additional properties
    destroy: () => { },
    destroyed: false,

    // For Express compatibility
    body: undefined,
  } as any;

  return req;
}

/**
 * Create a Node.js-like ServerResponse that collects response data
 */
export function createNodeResponse(): ServerResponse & {
  statusCode?: number;
  _headers?: Record<string, string>;
  _body?: string | Buffer;
  toFetchResponse: () => Response;
} {
  const chunks: (string | Buffer)[] = [];

  const res: any = {
    statusCode: 200,
    statusMessage: 'OK',
    _headers: {} as Record<string, string>,
    _body: '' as string | Buffer,

    // Methods
    write: function (this: any, chunk: string | Buffer | null, _encoding?: string | ((error?: Error | null) => void) | null, _callback?: (error?: Error | null) => void): boolean {
      if (chunk !== null && chunk !== undefined) {
        chunks.push(chunk);
      }
      return true;
    },

    end: function (this: any, chunk?: string | Buffer | (() => void) | null, _encoding?: string | (() => void) | null, _callback?: (() => void) | null): any {
      if (chunk !== null && chunk !== undefined && typeof chunk !== 'function') {
        chunks.push(chunk);
      }
      this._body = Buffer.concat(chunks.map(c =>
        typeof c === 'string' ? Buffer.from(c) : c
      ));
      return this;
    },

    setHeader: function (this: any, name: string, value: string | string[]) {
      this._headers[name.toLowerCase()] = Array.isArray(value) ? value.join(', ') : value;
      return this;
    },

    getHeader: function (this: any, name: string) {
      return this._headers[name.toLowerCase()];
    },

    removeHeader: function (this: any, name: string) {
      delete this._headers[name.toLowerCase()];
      return this;
    },

    hasHeader: function (this: any, name: string) {
      return name.toLowerCase() in this._headers;
    },

    // Response conversion
    toFetchResponse: function (this: any): Response {
      return new Response(this._body || '', {
        status: this.statusCode || 200,
        statusText: this.statusMessage,
        headers: this._headers,
      });
    },

    // Event handling for Express
    // eslint-disable-next-line @typescript-eslint/ban-types
    on: function (this: any, _event: string, _listener: Function) {
      return this;
    },

    // eslint-disable-next-line @typescript-eslint/ban-types
    once: function (this: any, _event: string, _listener: Function) {
      return this;
    },

    // Additional properties for Express
    headersSent: false,
    finished: false,
  } as any;

  return res;
}

/**
 * Streamlined adapter: directly call Express app with minimal overhead
 */
export function createExpressHandler(app: any) {
  return async (request: Request): Promise<Response> => {
    try {
      const req: any = createNodeRequest(request);
      const res: any = createNodeResponse();

      return new Promise<Response>((resolve, reject) => {
        app(req, res, (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(res.toFetchResponse());
          }
        });
      });
    } catch (error) {
      console.error('Express handler error:', error);
      throw error;
    }
  };
}
