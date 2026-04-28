import dotenv from 'dotenv';
import { Pool, createPoolFromD1 } from '../utils/d1Adapter';

dotenv.config();

let pool: Pool;

// Check if we're in a Workers environment (D1 is available in context)
if (typeof globalThis !== 'undefined' && (globalThis as any).DB) {
  // Production or Local Wrangler: Using Cloudflare D1
  pool = createPoolFromD1((globalThis as any).DB);
  console.log('Database: Using Cloudflare D1');
} else {
  // Gracefully enforce Wrangler
  throw new Error('D1 database binding not found. Please run the application using `npm run dev:worker` to ensure the Cloudflare Workers environment and D1 are properly injected.');
}

export default pool;
