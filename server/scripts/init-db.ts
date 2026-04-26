import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

/**
 * Initialize SQLite database with schema
 * This script reads the schema from schema-migration.sql and initializes the database
 */
async function initDatabase() {
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'biblioteca.db');
  const schemaPath = path.join(process.cwd(), 'schema-migration.sql');

  // Ensure directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  return new Promise<void>((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        // Enable foreign keys
        await new Promise<void>((res, rej) => {
          db.run('PRAGMA foreign_keys = ON', (e) => e ? rej(e) : res());
        });

        // Check if tables exist
        const tableCheckQuery = `
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name='Estudiante'
        `;

        const tables = await new Promise<any[]>((res, rej) => {
          db.all(tableCheckQuery, (err, rows) => {
            if (err) rej(err);
            else res(rows || []);
          });
        });

        if (tables.length === 0) {
          console.log('Initializing database schema...');

          // Read schema file
          const schema = fs.readFileSync(schemaPath, 'utf-8');

          // Split by semicolon and execute each statement
          const statements = schema
            .split(';')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

          for (const statement of statements) {
            await new Promise<void>((res, rej) => {
              db.run(statement, (err) => {
                if (err) {
                  console.error(`Error executing statement: ${statement}`, err);
                  rej(err);
                } else {
                  res();
                }
              });
            });
          }

          console.log('Database schema initialized successfully!');
        } else {
          console.log('Database schema already exists.');
        }

        db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } catch (error) {
        db.close();
        reject(error);
      }
    });
  });
}

// Run if this is the main module
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('Database initialization complete!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Database initialization failed:', err);
      process.exit(1);
    });
}

export { initDatabase };
