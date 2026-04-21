import pool from '../config/database';
import { NotFoundError, ForbiddenError, ValidationError, ReservaStatus } from '../types';

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
      const [conflicts] = await connection.query(
        `SELECT * FROM Reserva
         WHERE estudiante_id = ?
         AND status = ?
         AND NOT (
            TIMESTAMP(fechaFin, horaFin) <= TIMESTAMP(?, ?) OR
            TIMESTAMP(fechaInicio, horaInicio) >= TIMESTAMP(?, ?)
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

      const conflictos = conflicts as any[];

      if (conflictos.length > 0) {
        throw new ValidationError('Ya tienes una reserva en ese horario');
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