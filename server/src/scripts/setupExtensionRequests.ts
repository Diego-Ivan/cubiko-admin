import pool from '../config/database';

async function createExtensionRequestTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS ExtensionRequest (
      id INT AUTO_INCREMENT PRIMARY KEY,
      reserva_id INT NOT NULL,
      extensionHoras INT NOT NULL DEFAULT 1,
      status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reserva_id) REFERENCES Reserva(id) ON DELETE CASCADE
    );
  `;

  try {
    const connection = await pool.getConnection();
    console.log("Connected to DB, running create table query...");
    await connection.query(query);
    console.log("Table ExtensionRequest created or already exists.");
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error("Failed to create table:", error);
    process.exit(1);
  }
}

createExtensionRequestTable();
