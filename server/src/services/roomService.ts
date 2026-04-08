import pool from '../config/database';
import { Sala, NotFoundError } from '../types';

// ==================
// Get Room by Number
// ==================
export async function getRoomByNumber(roomNumber: number): Promise<Sala> {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.query(
      'SELECT numero, ubicacion, maxPersonas, minPersonas FROM Sala WHERE numero = ?',
      [roomNumber]
    );

    const rooms = results as any[];
    if (rooms.length === 0) {
      throw new NotFoundError(`Room ${roomNumber} not found`);
    }

    return rooms[0];
  } finally {
    connection.release();
  }
}

// ==================
// Get All Rooms
// ==================
export async function getAllRooms(): Promise<Sala[]> {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.query(
      'SELECT numero, ubicacion, maxPersonas, minPersonas FROM Sala ORDER BY ubicacion, numero'
    );

    return results as Sala[];
  } finally {
    connection.release();
  }
}

// ==================
// Get Available Rooms
// ==================
export async function getAvailableRooms(
  fecha: string,
  horaInicio: string,
  horaFin: string,
  capacidad?: number
): Promise<Sala[]> {
  const connection = await pool.getConnection();
  try {
    let query = `
      SELECT DISTINCT s.numero, s.ubicacion, s.maxPersonas, s.minPersonas
      FROM Sala s
      WHERE (s.ubicacion, s.numero) NOT IN (
        SELECT DISTINCT sala_ubicacion, sala_numero
        FROM Reserva
        WHERE sala_ubicacion IS NOT NULL
        AND sala_numero IS NOT NULL
        AND fechaInicio = ?
        AND (
          (horaInicio < ? AND horaFin > ?)
          OR (horaInicio >= ? AND horaInicio < ?)
        )
        AND status != 'Cancelada'
      )
    `;

    const params: any[] = [fecha, horaFin, horaInicio, horaInicio, horaFin];

    if (capacidad) {
      query += ' AND s.maxPersonas >= ? AND s.minPersonas <= ?';
      params.push(capacidad, capacidad);
    }

    query += ' ORDER BY s.ubicacion, s.numero';

    const [results] = await connection.query(query, params);

    return results as Sala[];
  } finally {
    connection.release();
  }
}

// ==================
// Get Used Rooms
// ==================
export async function getUsedRooms(): Promise<(Sala & { reserva_id: number; estudiante_id: number })[]> {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.query(`
      SELECT DISTINCT s.numero, s.ubicacion, s.maxPersonas, s.minPersonas, r.id as reserva_id, r.estudiante_id
      FROM Sala s
      INNER JOIN Reserva r ON s.ubicacion = r.sala_ubicacion AND s.numero = r.sala_numero
      WHERE r.status = 'Activa'
      AND r.fechaInicio <= CURDATE()
      AND r.fechaFin >= CURDATE()
      ORDER BY s.ubicacion, s.numero
    `);

    return results as (Sala & { reserva_id: number; estudiante_id: number })[];
  } finally {
    connection.release();
  }
}

// ==================
// Check Room Availability
// ==================
export async function isRoomAvailable(
  roomNumber: number,
  fecha: string,
  horaInicio: string,
  horaFin: string
): Promise<boolean> {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.query(
      `SELECT COUNT(*) as count FROM Reserva
       WHERE sala_numero = ?
       AND fechaInicio = ?
       AND (
         (horaInicio < ? AND horaFin > ?)
         OR (horaInicio >= ? AND horaInicio < ?)
       )
       AND status != 'Cancelada'`,
      [roomNumber, fecha, horaFin, horaInicio, horaInicio, horaFin]
    );

    const counted = results as any[];
    return counted[0].count === 0;
  } finally {
    connection.release();
  }
}

// ==================
// Validate Room Capacity
// ==================
export async function validateRoomCapacity(roomNumber: number, numPersonas: number): Promise<boolean> {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.query(
      `SELECT minPersonas, maxPersonas FROM Sala WHERE numero = ?`,
      [roomNumber]
    );

    const rooms = results as any[];
    if (rooms.length === 0) {
      return false;
    }

    const room = rooms[0];
    return numPersonas >= room.minPersonas && numPersonas <= room.maxPersonas;
  } finally {
    connection.release();
  }
}
