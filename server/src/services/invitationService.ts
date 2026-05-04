import pool from '../config/database';
import { NotFoundError, ForbiddenError } from '../types'; /*importa errores*/

export async function actualizarEstadoInvitacion(invitationId: number, userId: number, status: string) { 
    /*Recibe invitationId, userId y nuevo status ("aceptada" o "rechazada")*/
  const connection = await pool.getConnection();

  try {
    // Verificar que la invitación existe y pertenece al usuario
    const [invitations] = await connection.query(
      'SELECT id, user_id FROM Invitacion WHERE id = ?',
      [invitationId]
    );

    if ((invitations as any[]).length === 0) { /*si no encuentra la invitación, lanza un error*/
      throw new NotFoundError('Invitación no encontrada');
    }

    const invitation = (invitations as any[])[0]; /*toma el primer valor del array*/

    if (invitation.user_id !== userId) { /*verifica que el usario logueado sea el propietario de la invitación, si no lo es, lanza un error*/
      throw new ForbiddenError('No tienes permiso para actualizar esta invitación');
    }

    // Actualizar el estado: aceptado o rechazado 
    await connection.query(
      'UPDATE Invitacion SET status = ? WHERE id = ?',
      [status, invitationId]
    );

  } finally {
    connection.release();
  }
}