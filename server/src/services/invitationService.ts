import pool from '../config/database';
import { NotFoundError, ForbiddenError, ValidationError, ReservaStatus, Reserva } from '../types';
import { PoolConnection } from '../utils/d1Adapter';
import { obtenerReservaConId } from './reservaService';

interface ConflictoReservas {
  fechaInicio: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
}

/**
 * Converts a Reserva object to ConflictoReservas format for conflict checking
 */
function reservaToConflictoReservas(reserva: Reserva): ConflictoReservas {
  const formatDate = (date: Date): string => {
    return date instanceof Date 
      ? date.toISOString().split('T')[0]
      : date;
  };

  return {
    fechaInicio: formatDate(reserva.fechaInicio),
    fechaFin: formatDate(reserva.fechaFin),
    horaInicio: reserva.horaInicio,
    horaFin: reserva.horaFin
  };
}

export async function actualizarEstadoInvitacion(
  invitationId: number,
  userId: number,
  status: 'aceptada' | 'rechazada'
) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Obtener invitación
    const [rows] = await connection.query(
      'SELECT * FROM Invitacion WHERE id = ?',
      [invitationId]
    );

    const invitaciones = rows as any[];

    if (invitaciones.length === 0) {
      throw new NotFoundError('Invitación no encontrada');
    }

    const invitacion = invitaciones[0];

    // 2. Validar que es del usuario
    if (invitacion.estudiante_id !== userId) {
      throw new ForbiddenError('No puedes modificar esta invitación');
    }

    // 3. Si acepta → validar conflictos
    if (status === 'aceptada') {
      if (await invitacionTieneConflictos(connection, userId, invitacion)) {
        throw new ValidationError("Ya tienes una reserva en este horario");
      }
    }

    // 4. Actualizar estado
    await connection.query(
      'UPDATE Invitacion SET status = ? WHERE id = ?',
      [status, invitationId]
    );

    await connection.commit();

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function usuarioYaEnReserva(connection: PoolConnection, userId: number, reservaId: number) {
  const conflictos = await connection.query("SELECT * FROM UsuarioEnReserva WHERE estudianteId = ? AND reservaId = ?", [userId, reservaId]);
  return (conflictos as any[]).length > 0;
}

export async function aceptarInvitacionConQr(userId: number, reservaId: number) {
  const connection = await pool.getConnection();
  try {
    const reserva = await obtenerReservaConId(connection, reservaId);
    const conflicto = reservaToConflictoReservas(reserva);

    if (await invitacionTieneConflictos(connection, userId, conflicto)) {
      throw new ValidationError("Ya tienes una reserva a esta hora!")
    }

    if (await usuarioYaEnReserva(connection, userId, reservaId)) {
      throw new ValidationError("Tú ya estás registrado en esta reserva");
    }

    await connection.query("INSERT INTO UsuarioEnReserva (estudianteId, reservaId) VALUES (?, ?)", [
      reservaId, userId
    ]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function invitacionTieneConflictos(connection: PoolConnection, userId: number, invitacion: ConflictoReservas) {
  const [conflicts] = await connection.query(
    `SELECT * FROM Reserva
      WHERE estudiante_id = ?
      AND status = ?
      AND NOT (
        datetime(fechaFin || 'T' || horaFin) <= datetime(? || 'T' || ?) OR
        datetime(fechaInicio || 'T' || horaInicio) >= datetime(? || 'T' || ?)
      )`,
    [
      userId,
      ReservaStatus.ACTIVA,
      invitacion.fechaInicio,
      invitacion.horaInicio,
      invitacion.fechaFin,
      invitacion.horaFin
    ]
  );

  return (conflicts as any[]).length > 0;
}