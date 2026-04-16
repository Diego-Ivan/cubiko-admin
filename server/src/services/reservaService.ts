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

export async function solicitarExtension(reservaId: number, estudianteId: number, horas: number) {
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
            throw new ValidationError(`No se pudo extender la reserva ${reservaId}. La reserva no está activa.`);
        }

        // Check if there's already a pending request
        const [pendingResults] = await connection.query(
            'SELECT * FROM ExtensionRequest WHERE reserva_id = ? AND status = "PENDING"',
            [reservaId]
        );

        if ((pendingResults as any[]).length > 0) {
            throw new ValidationError(`Ya existe una solicitud pendiente para la reserva ${reservaId}.`);
        }

        const [insertResult] = await connection.query(
            'INSERT INTO ExtensionRequest (reserva_id, extensionHoras, status) VALUES (?, ?, "PENDING")',
            [reservaId, horas]
        );
        
        return {
            id: (insertResult as any).insertId,
            reserva_id: reservaId,
            extensionHoras: horas,
            status: "PENDING",
            estudianteId: estudianteId
        };
    }
    finally {
        connection.release();
    }
}

export async function resolverExtension(requestId: number, newStatus: 'APPROVED' | 'REJECTED') {
    const connection = await pool.getConnection();

    try {
        const [requestResult] = await connection.query(
            'SELECT * FROM ExtensionRequest WHERE id = ?',
            [requestId]
        );

        const requests = requestResult as any[];
        if (requests.length === 0) {
            throw new NotFoundError(`Request with id ${requestId} not found`);
        }

        const request = requests[0];

        if (request.status !== 'PENDING') {
            throw new ValidationError(`Request ${requestId} is already resolved`);
        }

        await connection.query(
            'UPDATE ExtensionRequest SET status = ? WHERE id = ?',
            [newStatus, requestId]
        );

        if (newStatus === 'APPROVED') {
            await connection.query(
                'UPDATE Reserva SET horaFin = ADDTIME(horaFin, SEC_TO_TIME(? * 3600)) WHERE id = ?',
                [request.extensionHoras, request.reserva_id]
            );
        }

        return request; // contains reserva_id so we can look up who requested
    } finally {
        connection.release();
    }
}

