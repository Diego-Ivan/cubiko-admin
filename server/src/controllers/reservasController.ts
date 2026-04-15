import { Request, Response } from 'express';
import { validateRequest, cancelarReservaSchema, crearQrSchema } from '../utils/validators';
import { cancelarReservaConId, generarQrConId } from '../services/reservaService';
import { ApiError, CancelarReservaRequest, CrearQrRequest, ValidationError } from '../types';

export async function crearReserva(_req: Request, _res: Response) {}

export async function cancelarReserva(req: Request, res: Response) {
  try {
    // Extract and validate reservaId from route params
    const validatedParams = await validateRequest<CancelarReservaRequest>(
      cancelarReservaSchema,
      { reservaId: req.params.reservaId }
    );

    const reservaId = Number(validatedParams.reservaId);
    const userId = req.user?.id;
    const tipo = req.user?.tipo;

    // Ensure user is authenticated
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    if (!tipo || tipo !== 'estudiante') {
        res.status(400).json({
            success: false,
            error: 'Esta ruta solo permite cancelaciones para estudiantes. Utilice la ruta adecuada para cancelaciones administrativas.'
        });
        return;
    }

    // Call the service to cancel the reservation
    await cancelarReservaConId(reservaId, userId);

    res.status(200).json({
      success: true,
      message: 'La reservación ha sido cancelada con éxito'
    });
  } catch (error) {
    if (error instanceof ApiError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message
        })
    } else {
        throw Error;
    }
  }
}

/* Solamente si el usuario es un bibliotecario o administrador */
export async function listReservas(_req: Request, _res: Response) {}

export async function generarQrCode(req: Request, res: Response) {
  try {
    // Extract and validate reservaId from route params
    const validatedParams = await validateRequest<CrearQrRequest>(
      crearQrSchema,
      { reservaId: req.params.reservaId }
    );

    const reservaId = Number(validatedParams.reservaId);
    const userId = req.user?.id;
    const tipoUsuario = req.user?.tipo;

    if (!userId || !tipoUsuario) {
      res.status(401).json({
        success: false,
        error: "Unauthorized"
      })
      return;
    }

    const qr = await generarQrConId(reservaId, userId, tipoUsuario);
    res.status(200).json({
      success: false,
      obj: qr,
    })
  }
  catch (error) {
    if (error instanceof ApiError || error instanceof ValidationError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message
        })
    } else {
        throw Error;
    }
  }
}
