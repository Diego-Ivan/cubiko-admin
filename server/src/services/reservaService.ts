import { PoolConnection } from 'mysql2/promise';
import pool from '../config/database';
import { CrearReservaRequest, Reserva, NotFoundError, ForbiddenError, ReservaStatus, ValidationError, TipoUsuario } from '../types';
import QRCode  from 'qrcode';

// TODO: Optimizar a una cache más eficiente
const qrCache = new Map<string, string>();

export enum TipoQr {
    Invitacion = "invitacion",
    Acceso = "acceso"
}

async function obtenerReservaConId(connection: PoolConnection, reservaId: number) {
    const [resultado] = await connection.query(
        'SELECT * FROM Reserva WHERE id = ?',
        [reservaId]
    );

    const reservaciones = resultado as Reserva[];
    if (reservaciones.length == 0) {
        throw new NotFoundError(`La reservación con id ${reservaId} no fue encontrada`);
    }

    return reservaciones[0];
}

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
        const reservacion = await obtenerReservaConId(connection, reservaId);

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

async function crearQr(tipo: TipoQr, reservaId: number): Promise<string> {
    const formatoQr = `${tipo};${reservaId}`;

    const cachedQr = qrCache.get(formatoQr);
    if (cachedQr) {
        return cachedQr;
    }


    const qrCode = await QRCode.toDataURL(formatoQr, {
        errorCorrectionLevel: "H",
        type: 'image/png',
        margin: 1,
        scale: 10
    });
    qrCache.set(formatoQr, qrCode);

    return qrCode;
}

export async function generarQrCodeConId(reservaId: number, estudianteId: number, tipoUsuario: TipoUsuario, tipoQr: TipoQr): Promise<string> {
    const connection = await pool.getConnection();

    const reservacion = await obtenerReservaConId(connection, reservaId);

    if (reservacion.status !== ReservaStatus.ACTIVA) {
        connection.release();
        throw new ValidationError(`No se puede generar un QR para la reserva ${reservaId}. Se hizo la solicitud para una reserva ${reservacion.status}`)
    }

    if (estudianteId !== reservacion.estudiante_id && tipoUsuario !== 'personal') {
        connection.release();
        throw new ForbiddenError(`La reservación con id ${reservaId} no pertenece al estudiante ${estudianteId}`);
    }

    const qrCode = crearQr(tipoQr, reservaId);
    
    connection.release();
    return qrCode;
}
