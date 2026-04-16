import pool from '../config/database';
import { CrearReservaRequest, Reserva, NotFoundError, ForbiddenError, ReservaStatus, ValidationError } from '../types';

export async function crearReservaConTransaccion(data: CrearReservaRequest & { estudianteId: number }) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [salas] = await connection.query(
            'SELECT 1 FROM Sala WHERE ubicacion = ? AND numero = ?',
            [data.salaUbicacion, data.salaNumero]
        );

        if ((salas as any[]).length === 0) {
            throw new ValidationError(`La sala ${data.salaNumero} en ${data.salaUbicacion} no existe`);
        }

        const [conflicts] = await connection.query(
            `SELECT id FROM Reserva
                WHERE sala_ubicacion = ? AND sala_numero = ? AND status = ?
                AND NOT (
                    TIMESTAMP(fechaFin, horaFin) <= TIMESTAMP(?, ?) OR
                    TIMESTAMP(fechaInicio, horaInicio) >= TIMESTAMP(?, ?)
                )`,
            [
                data.salaUbicacion,
                data.salaNumero,
                ReservaStatus.ACTIVA,
                data.fechaInicio,
                data.horaInicio,
                data.fechaFin,
                data.horaFin
            ]
        );

        if ((conflicts as any[]).length > 0) {
            throw new ValidationError('La sala ya está reservada en el rango seleccionado');
        }

        const [result] = await connection.query(
            'INSERT INTO Reserva (estudiante_id, sala_ubicacion, sala_numero, fechaInicio, fechaFin, horaInicio, horaFin, numPersonas, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ',
            [
                data.estudianteId,
                data.salaUbicacion,
                data.salaNumero,
                data.fechaInicio,
                data.fechaFin,
                data.horaInicio,
                data.horaFin,
                data.numPersonas ?? null,
                ReservaStatus.ACTIVA
            ]
        );

        await connection.commit();

        return (result as any).insertId as number;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

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


