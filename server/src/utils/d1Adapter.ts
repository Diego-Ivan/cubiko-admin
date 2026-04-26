// ==================
// D1 (Cloudflare) Database Adapter
// ==================
// This adapter wraps Cloudflare D1 client to provide a mysql2/promise-like interface
// matching our sqliteAdapter for drop-in compatibility across environments

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

// D1Binding type - this is what Cloudflare Workers injects
export interface D1Binding {
  prepare: (sql: string) => D1PreparedStatement;
  batch: (statements: D1PreparedStatement[]) => Promise<any[]>;
  exec: (sql: string) => Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind: (...params: any[]) => D1PreparedStatement;
  first: (columnName?: string) => Promise<any>;
  all: () => Promise<D1Result>;
  raw: (options?: { columnNames?: boolean }) => Promise<any>;
  run: () => Promise<D1Result>;
}

export interface D1Result {
  success: boolean;
  results?: any[];
  meta?: {
    duration: number;
    last_row_id?: number;
    changes?: number;
    served_by?: string;
    internal_stats?: string;
  };
}

export interface D1ExecResult {
  success: boolean;
  results: any[];
}

/**
 * Create a D1 connection adapter
 */
function createConnection(db: D1Binding): PoolConnection {
  let inTransaction = false;

  return {
    query: async (sql: string, params: any[] = []): Promise<any[]> => {
      try {
        const statement = db.prepare(sql);
        
        // Bind parameters
        const boundStatement = params.length > 0 
          ? statement.bind(...params)
          : statement;

        if (sql.toLowerCase().trim().startsWith('select')) {
          // SELECT query - return [rows, columns]
          const result = await boundStatement.all();
          
          if (!result.success) {
            throw new Error(`D1 query failed: ${JSON.stringify(result)}`);
          }

          return [result.results || [], []] as any[];
        } else {
          // INSERT, UPDATE, DELETE query - return [{ lastID, changes }, []]
          const result = await boundStatement.run();

          if (!result.success) {
            throw new Error(`D1 query failed: ${JSON.stringify(result)}`);
          }

          const meta = result.meta || {} as any;
          return [{
            lastID: meta.last_row_id || 0,
            changes: meta.changes || 0
          }, []] as any[];
        }
      } catch (error) {
        console.error('D1 query error:', { sql, params, error });
        throw error;
      }
    },

    beginTransaction: async (): Promise<void> => {
      if (!inTransaction) {
        await db.exec('BEGIN TRANSACTION');
        inTransaction = true;
      }
    },

    commit: async (): Promise<void> => {
      if (inTransaction) {
        await db.exec('COMMIT');
        inTransaction = false;
      }
    },

    rollback: async (): Promise<void> => {
      if (inTransaction) {
        await db.exec('ROLLBACK');
        inTransaction = false;
      }
    },

    release: (): void => {
      // D1 doesn't require explicit connection release
      // but reset transaction state if needed
      inTransaction = false;
    }
  };
}

/**
 * Create a D1 pool (single connection for D1 since it handles concurrency)
 */
export function createPoolFromD1(db: D1Binding): Pool {
  return {
    getConnection: async (): Promise<PoolConnection> => {
      return createConnection(db);
    }
  };
}

