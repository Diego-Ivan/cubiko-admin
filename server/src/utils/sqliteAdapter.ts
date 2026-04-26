import sqlite3 from 'sqlite3';

// ==================
// SQLite Connection Adapter
// ==================
// This adapter wraps sqlite3 to provide a mysql2/promise-like interface
// with [rows] tuple return format and proper transaction support

export interface PoolConnection {
  query: (sql: string, params?: any[]) => Promise<any[]>;
  beginTransaction: () => Promise<void>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
  release: () => void;
}

export interface Pool {
  getConnection: () => Promise<PoolConnection>;
}

/**
 * Promisify sqlite3.Database.run method
 */
function dbRun(db: sqlite3.Database, sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

/**
 * Promisify sqlite3.Database.all method
 */
function dbAll(db: sqlite3.Database, sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

/**
 * Create a SQLite connection adapter
 */
function createConnection(db: sqlite3.Database): PoolConnection {
  let inTransaction = false;

  return {
    query: async (sql: string, params: any[] = []): Promise<any[]> => {
      if (sql.toLowerCase().trim().startsWith('select')) {
        // SELECT query
        const rows = await dbAll(db, sql, params);
        return [rows, []] as any[];
      } else {
        // INSERT, UPDATE, DELETE query
        const result = await dbRun(db, sql, params);
        return [result, []] as any[];
      }
    },

    beginTransaction: async (): Promise<void> => {
      if (!inTransaction) {
        await dbRun(db, 'BEGIN TRANSACTION');
        inTransaction = true;
      }
    },

    commit: async (): Promise<void> => {
      if (inTransaction) {
        await dbRun(db, 'COMMIT');
        inTransaction = false;
      }
    },

    rollback: async (): Promise<void> => {
      if (inTransaction) {
        await dbRun(db, 'ROLLBACK');
        inTransaction = false;
      }
    },

    release: (): void => {
      // SQLite doesn't need connection release, but we keep it for API compatibility
    }
  };
}

/**
 * Create a SQLite pool (single connection for SQLite)
 */
export function createPool(dbPath: string): Pool {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err);
    }
  });

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  return {
    getConnection: async (): Promise<PoolConnection> => {
      return createConnection(db);
    }
  };
}

/**
 * Initialize database schema
 */
export async function initializeDatabase(db: sqlite3.Database, schemaPath: string): Promise<void> {
  const fs = await import('fs').then(m => m.promises);
  const schema = await fs.readFile(schemaPath, 'utf-8');

  // Split schema by semicolon and filter empty statements
  const statements = schema
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  for (const statement of statements) {
    await new Promise<void>((resolve, reject) => {
      db.exec(statement, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
