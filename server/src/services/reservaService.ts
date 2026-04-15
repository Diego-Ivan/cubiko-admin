import { PoolConnection } from 'mysql2/promise';
import pool from '../config/database';
import { Reserva, NotFoundError, ForbiddenError, ReservaStatus, ValidationError, TipoUsuario } from '../types';
import QRCode  from 'qrcode';

// TODO: Optimizar a una cache más eficiente
const qrCache = new Map<number, string>();

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

export async function generarQrConId(reservaId: number, estudianteId: number, tipoUsuario: TipoUsuario): Promise<string> {
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

    const cachedQr = qrCache.get(reservaId);

    if (cachedQr) {
        return cachedQr;
    }

    const qrCode = await QRCode.toDataURL(`${reservaId}`, {
        errorCorrectionLevel: "H",
        type: 'image/png',
        margin: 1,
        scale: 10,
        color: {
            dark: "#134734",
            light: "#FFFFFF"
        }
    });
    qrCache.set(reservaId, qrCode);
    connection.release();
    return qrCode;
}
    