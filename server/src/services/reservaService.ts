import { PoolConnection } from '../utils/d1Adapter';
import pool from '../config/database';
import { CrearReservaRequest, Reserva, NotFoundError, ForbiddenError, ReservaStatus, ValidationError, TipoUsuario } from '../types';
import { generateQRDataURL } from '../utils/qrCodeGenerator';

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

export async function obtenerReservasDeEstudiante(estudianteId: number): Promise<Reserva[]> {
    const connection = await pool.getConnection();

    try {
        const [resultado] = await connection.query(
            'SELECT * FROM Reserva WHERE estudiante_id = ? ORDER BY fechaInicio DESC, horaInicio DESC',
            [estudianteId]
        );

        return resultado as Reserva[];
    } finally {
        connection.release();
    }
}

// Helper function to validate date/time format
function validateDateTimeFormat(fecha: string, hora: string): void {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^\d{2}:\d{2}$/;
    
    if (!dateRegex.test(fecha)) {
        throw new ValidationError(`Formato de fecha inválido: ${fecha}. Use YYYY-MM-DD`);
    }
    if (!timeRegex.test(hora)) {
        throw new ValidationError(`Formato de hora inválido: ${hora}. Use HH:MM`);
    }
}

export async function crearReservaConTransaccion(data: CrearReservaRequest & { estudianteId: number }) {
    const connection = await pool.getConnection();

    try {
        // Validate input formats before transaction
        validateDateTimeFormat(data.fechaInicio, data.horaInicio);
        validateDateTimeFormat(data.fechaFin, data.horaFin);
        
        console.debug('Creating reservation:', {
            estudianteId: data.estudianteId,
            salaNumero: data.salaNumero,
            salaUbicacion: data.salaUbicacion,
            fechaInicio: data.fechaInicio,
            horaInicio: data.horaInicio,
            fechaFin: data.fechaFin,
            horaFin: data.horaFin
        });

        await connection.beginTransaction();

        const [salas] = await connection.query(
            'SELECT 1 FROM Sala WHERE ubicacion = ? AND numero = ?',
            [data.salaUbicacion, data.salaNumero]
        );

        if ((salas as any[]).length === 0) {
            await connection.rollback();
            throw new ValidationError(`La sala ${data.salaNumero} en ${data.salaUbicacion} no existe`);
        }

        const [conflicts] = await connection.query(
            `SELECT id FROM Reserva
                WHERE sala_ubicacion = ? AND sala_numero = ? AND status = ?
                AND NOT (
                    datetime(fechaFin || 'T' || horaFin) <= datetime(? || 'T' || ?) OR
                    datetime(fechaInicio || 'T' || horaInicio) >= datetime(? || 'T' || ?)
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
            await connection.rollback();
            throw new ValidationError('La sala ya está reservada en el rango seleccionado');
        }

        const [result] = await connection.query(
            'INSERT INTO Reserva (estudiante_id, sala_ubicacion, sala_numero, fechaInicio, fechaFin, horaInicio, horaFin, numPersonas, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
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

        const lastID = (result as any).lastID;
        if (!lastID || lastID === 0) {
            await connection.rollback();
            throw new Error('Failed to insert reservation - no lastID returned');
        }

        await connection.commit();
        console.debug(`Reservation created successfully with ID: ${lastID}`);
        
        return lastID;
    } catch (error) {
        console.error('Error creating reservation:', error);
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error('Error during rollback:', rollbackError);
        }
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
            'UPDATE Reserva SET status = ? WHERE id = ?',
            [ReservaStatus.CANCELADA, reservaId]
        );
        
        console.debug(`Reservation ${reservaId} cancelled successfully`);
    }
    finally {
        connection.release()
    }
}

async function crearQr(tipo: TipoQr, reservaId: number): Promise<string> {
    const formatoQr = `${tipo};${reservaId}`;

    try {
        const qrCode = await generateQRDataURL(formatoQr, 'svg');
        console.debug(`QR code created for: ${formatoQr}`);
        
        return qrCode;
    } catch (error) {
        console.error('Error generating QR code:', { formatoQr, error });
        throw error;
    }
}

export async function generarQrCodeConId(reservaId: number, estudianteId: number, tipoUsuario: TipoUsuario, tipoQr: TipoQr): Promise<string> {
    const connection = await pool.getConnection();

    try {
        const reservacion = await obtenerReservaConId(connection, reservaId);

        if (reservacion.status !== ReservaStatus.ACTIVA) {
            throw new ValidationError(`No se puede generar un QR para la reserva ${reservaId}. Se hizo la solicitud para una reserva ${reservacion.status}`)
        }

        if (estudianteId !== reservacion.estudiante_id && tipoUsuario !== 'personal') {
            throw new ForbiddenError(`La reservación con id ${reservaId} no pertenece al estudiante ${estudianteId}`);
        }

        const qrCode = await crearQr(tipoQr, reservaId);
        console.debug(`QR code generated for reservation ${reservaId}`);
        
        return qrCode;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw error;
    } finally {
        connection.release();
    }
}

export async function reprogramarReservaConTransaccion(reservaId: number, estudianteId: number, data: CrearReservaRequest) {
    const connection = await pool.getConnection();

    try {
        // Validate input formats before transaction
        validateDateTimeFormat(data.fechaInicio, data.horaInicio);
        validateDateTimeFormat(data.fechaFin, data.horaFin);
        
        console.debug('Rescheduling reservation:', {
            reservaId,
            estudianteId,
            fechaInicio: data.fechaInicio,
            horaInicio: data.horaInicio,
            fechaFin: data.fechaFin,
            horaFin: data.horaFin
        });

        await connection.beginTransaction();

        const reservacion = await obtenerReservaConId(connection, reservaId);

        if (reservacion.estudiante_id != estudianteId) {
            await connection.rollback();
            throw new ForbiddenError(`La reservación con id ${reservaId} no pertenece al estudiante ${estudianteId}`);
        }

        if (reservacion.status != ReservaStatus.ACTIVA) {
            await connection.rollback();
            throw new ValidationError(`No se pudo reprogramar la reserva ${reservaId}. La reserva está ${reservacion.status}`);
        }

        const [salas] = await connection.query(
            'SELECT 1 FROM Sala WHERE ubicacion = ? AND numero = ?',
            [data.salaUbicacion, data.salaNumero]
        );

        if ((salas as any[]).length === 0) {
            await connection.rollback();
            throw new ValidationError(`La sala ${data.salaNumero} en ${data.salaUbicacion} no existe`);
        }

        const [conflicts] = await connection.query(
            `SELECT id FROM Reserva
                WHERE sala_ubicacion = ? AND sala_numero = ? AND status = ? AND id != ?
                AND NOT (
                    datetime(fechaFin || 'T' || horaFin) <= datetime(? || 'T' || ?) OR
                    datetime(fechaInicio || 'T' || horaInicio) >= datetime(? || 'T' || ?)
                )`,
            [
                data.salaUbicacion,
                data.salaNumero,
                ReservaStatus.ACTIVA,
                reservaId,
                data.fechaInicio,
                data.horaInicio,
                data.fechaFin,
                data.horaFin
            ]
        );

        if ((conflicts as any[]).length > 0) {
            await connection.rollback();
            throw new ValidationError('La sala ya está reservada en el rango seleccionado');
        }

        await connection.query(
            'UPDATE Reserva SET sala_ubicacion = ?, sala_numero = ?, fechaInicio = ?, horaInicio = ?, fechaFin = ?, horaFin = ?, numPersonas = ? WHERE id = ?',
            [
                data.salaUbicacion,
                data.salaNumero,
                data.fechaInicio,
                data.horaInicio,
                data.fechaFin,
                data.horaFin,
                data.numPersonas ?? null,
                reservaId
            ]
        );

        await connection.commit();
        console.debug(`Reservation ${reservaId} rescheduled successfully`);
    } catch (error) {
        console.error('Error rescheduling reservation:', error);
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error('Error during rollback:', rollbackError);
        }
        throw error;
    } finally {
        connection.release();
    }
}

export async function obtenerTodasLasReservas(): Promise<any[]> {
    const connection = await pool.getConnection();
    try {
        const [resultado] = await connection.query(`
            SELECT r.*, e.nombre as estudiante_nombre, e.email as estudiante_email 
            FROM Reserva r
            LEFT JOIN Estudiante e ON r.estudiante_id = e.id
            ORDER BY r.fechaInicio DESC, r.horaInicio DESC
        `);
        return resultado as any[];
    } finally {
        connection.release();
    }
}

export async function obtenerTodasLasSolicitudesExtension(): Promise<any[]> {
    const connection = await pool.getConnection();
    try {
        const [resultado] = await connection.query(`
            SELECT se.*, r.sala_ubicacion, r.sala_numero, r.fechaInicio, r.horaInicio, r.fechaFin, r.horaFin, e.nombre as estudiante_nombre
            FROM SolicitudExtension se
            JOIN Reserva r ON se.reserva_id = r.id
            LEFT JOIN Estudiante e ON r.estudiante_id = e.id
            ORDER BY se.id DESC
        `);
        return resultado as any[];
    } finally {
        connection.release();
    }
}

export async function resolverExtension(requestId: number, newStatus: 'Aprobada' | 'Rechazada') {
    const connection = await pool.getConnection();
    try {
        const [requestResult] = await connection.query(
            'SELECT * FROM SolicitudExtension WHERE id = ?',
            [requestId]
        );
        const requests = requestResult as any[];
        if (requests.length === 0) {
            throw new NotFoundError(`Request with id ${requestId} not found`);
        }
        const request = requests[0];
        if (request.estado !== 'Pendiente') {
            throw new ValidationError(`La solicitud ${requestId} ya fue resuelta`);
        }
        await connection.query(
            'UPDATE SolicitudExtension SET estado = ? WHERE id = ?',
            [newStatus, requestId]
        );
        if (newStatus === 'Aprobada') {
            await connection.query(
                'UPDATE Reserva SET horaFin = ADDTIME(horaFin, SEC_TO_TIME(? * 3600)) WHERE id = ?',
                [request.extensionHoras, request.reserva_id]
            );
        }
        return request;
    } finally {
        connection.release();
    }
}
