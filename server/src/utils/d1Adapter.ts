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
 * 
 * Note: D1 doesn't support explicit SQL transactions (BEGIN/COMMIT/ROLLBACK).
 * Instead, we execute queries immediately with automatic atomicity per statement.
 * The transaction pattern is simulated: queries execute immediately, and rollback
 * simply prevents sending remaining queued statements.
 */
function createConnection(db: D1Binding): PoolConnection {
  let inTransaction = false;
  let shouldRollback = false;
  let queuedStatements: Array<{ sql: string; params: any[] }> = [];

  return {
    query: async (sql: string, params: any[] = []): Promise<any[]> => {
      try {
        // If rollback was triggered, discard remaining queries except reads
        if (shouldRollback && !sql.toLowerCase().trim().startsWith('select')) {
          console.warn(`Query discarded due to transaction rollback: ${sql}`);
          return [{ lastID: undefined, changes: 0 }, []] as any[];
        }

        // Queue writes during transaction but execute immediately
        if (inTransaction && !sql.toLowerCase().trim().startsWith('select')) {
          queuedStatements.push({ sql, params });
        }

        // Execute immediately
        const statement = db.prepare(sql);
        let boundStatement = statement;
        if (params.length > 0) {
          boundStatement = statement.bind(...params);
        }

        const isSelect = sql.toLowerCase().trim().startsWith('select');
        const result = isSelect ? await boundStatement.all() : await boundStatement.run();
        
        if (!result.success) {
          // If we're in a transaction and a query fails, mark for rollback
          if (inTransaction) {
            shouldRollback = true;
          }
          const errorMsg = `D1 query failed: ${JSON.stringify(result)} [SQL: ${sql}] [Params: ${JSON.stringify(params)}]`;
          console.error('D1 Error:', errorMsg);
          throw new Error(errorMsg);
        }

        if (isSelect) {
          return [result.results || [], []] as any[];
        } else {
          const meta = result.meta || {} as any;
          return [{
            lastID: meta.last_row_id,
            changes: meta.changes || 0
          }, []] as any[];
        }
      } catch (error) {
        console.error('D1 query error:', { sql, params, error });
        // Mark transaction as failed
        if (inTransaction) {
          shouldRollback = true;
        }
        throw error;
      }
    },

    beginTransaction: async (): Promise<void> => {
      if (inTransaction) {
        throw new Error('Transaction already in progress');
      }
      inTransaction = true;
      shouldRollback = false;
      queuedStatements = [];
      console.debug('Transaction started (D1 immediate mode)');
    },

    commit: async (): Promise<void> => {
      if (!inTransaction) {
        return;
      }

      try {
        if (shouldRollback) {
          throw new Error('Cannot commit - transaction was marked for rollback due to previous errors');
        }

        inTransaction = false;
        queuedStatements = [];
        console.debug('Transaction committed');
      } catch (error) {
        inTransaction = false;
        queuedStatements = [];
        shouldRollback = false;
        console.error('Failed to commit transaction:', error);
        throw error;
      }
    },

    rollback: async (): Promise<void> => {
      if (!inTransaction) {
        return;
      }
      inTransaction = false;
      shouldRollback = false;
      queuedStatements = [];
      console.debug('Transaction rolled back');
    },

    release: (): void => {
      if (inTransaction) {
        console.warn('Connection released while transaction still in progress - rolling back');
        inTransaction = false;
        shouldRollback = false;
        queuedStatements = [];
      }
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

