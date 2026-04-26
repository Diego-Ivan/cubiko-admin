import dotenv from 'dotenv';
import path from 'path';
import { createPool } from '../utils/sqliteAdapter';

dotenv.config();

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'biblioteca.db');

// Create directory if it doesn't exist
import fs from 'fs';
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const pool = createPool(dbPath);

export default pool;
