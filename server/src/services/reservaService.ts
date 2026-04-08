import pool from '../config/database';
import { Reserva, NotFoundError, ForbiddenError, ReservaStatus, ValidationError } from '../types';

export async function cancelarReservaConId(reservaId: number, estudianteId: number) {
    const connection = await pool.getConnection();

    try {
        const [resultado] = await connection.query(
            'SELECT * FROM Reserva WHERE id = ?',
            [reservaId]
        );

        const reservaciones = resultado as any[];
        if (reservaciones.length == 0) {
            throw new NotFoundError(`La reservación con id ${reservaId} no fue encontrada`);
        }

        const reservacion = reservaciones[0] as Reserva;
        if (reservacion.estudiante_id != estudianteId) {
            throw new ForbiddenError(`La reservación con id ${reservaId} no pertenece al estudiante ${estudianteId}`);
        }

        if (reservacion.status != ReservaStatus.ACTIVA) {
            throw new ValidationError(`No se pudo cancelar la reserva ${reservaId}. Se hizo la solicitud para cancelar una reserva ${reservacion.status}`)
        }

        await connection.query(
            'UPDATE Reserva SET status = \'Cancelada\' WHERE id = ?',
            [reservaId]
        )
    }
    finally {
        connection.release()
    }
}
