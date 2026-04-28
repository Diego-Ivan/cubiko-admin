import { Request, Response } from 'express';
import { validateRequest, cancelarReservaSchema, extenderReservaBodySchema, extenderReservaParamSchema, crearReservaSchema, crearQrSchema, resolverExtensionSchema } from '../utils/validators';
import { notifyAdminsNewExtension, notifyExtensionResolved } from '../socket/socketHandler';
import { cancelarReservaConId, crearReservaConTransaccion, solicitarExtension, resolverExtension, generarQrCodeConId, TipoQr, reprogramarReservaConTransaccion, obtenerReservasDeEstudiante } from '../services/reservaService';
import { ApiError, CancelarReservaRequest, CrearReservaRequest, ForbiddenError, UnauthorizedError, ExtenderReservaRequest, CrearQrRequest, ValidationError, ResolverExtensionRequest } from '../types';

export async function crearReserva(req: Request, res: Response) {
  try {
    const validatedBody = await validateRequest<CrearReservaRequest>(crearReservaSchema, req.body); /*valida los datos*/
    const userId = req.user?.id; /*datos usuario*/
    const tipo = req.user?.tipo;

    if (!userId) {
      throw new UnauthorizedError();
    }

    if (!tipo || tipo !== 'estudiante') { /*solo estudiantes pueden crear reservas*/
      throw new ForbiddenError('Solo los estudiantes pueden crear reservas');
    }

    const reservaId = await crearReservaConTransaccion({
      ...validatedBody, /*copia los datos validados*/
      estudianteId: userId /*agrega el id del estudiante a los datos para crear la reserva*/
    });

    res.status(201).json({ /*respuesta exitosa con la reserva creada*/
      success: true,
      message: 'Reservación creada con éxito',
      data: {
        reservaId
      }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message /*respuesta de error con el mensaje del error*/
      });
    } else {
      res.status(500).json({ /*error genérico */
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

export async function obtenerMisReservas(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const tipo = req.user?.tipo;

    if (!userId) {
      throw new UnauthorizedError();
    }

    if (!tipo || tipo !== 'estudiante') {
      throw new ForbiddenError('Solo los estudiantes pueden ver sus reservas');
    }

    const reservas = await obtenerReservasDeEstudiante(userId);

    res.status(200).json({
      success: true,
      data: reservas
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

export async function reprogramarReserva(req: Request, res: Response) {
  try {
    const validatedParams = await validateRequest<CancelarReservaRequest>(cancelarReservaSchema, { reservaId: req.params.reservaId });
    const validatedBody = await validateRequest<CrearReservaRequest>(crearReservaSchema, req.body);
    const userId = req.user?.id;
    const tipo = req.user?.tipo;

    if (!userId) {
      throw new UnauthorizedError();
    }

    if (!tipo || tipo !== 'estudiante') {
      throw new ForbiddenError('Solo los estudiantes pueden reprogramar reservas');
    }

    const reservaId = Number(validatedParams.reservaId);

    await reprogramarReservaConTransaccion(reservaId, userId, validatedBody);

    res.status(200).json({
      success: true,
      message: 'Reservación reprogramada con éxito'
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

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
      throw error;
    }
  }
}

/* Solamente si el usuario es un bibliotecario o administrador */
export async function listReservas(_req: Request, _res: Response) { }

export async function extenderReserva(req: Request, res: Response) {
  try {
    const validatedParams = await validateRequest<ExtenderReservaRequest>(
      extenderReservaParamSchema,
      { reservaId: req.params.reservaId }
    );

    const validatedBody = await validateRequest<{ extensionHoras: number, notas?: string }>(
      extenderReservaBodySchema,
      req.body
    );

    const reservaId = Number(validatedParams.reservaId);
    const userId = req.user?.id;
    const tipo = req.user?.tipo;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (!tipo || tipo !== 'estudiante') {
      res.status(400).json({
        success: false,
        error: 'Esta ruta solo permite extender reservas para estudiantes.'
      });
      return;
    }

    const requestData = await solicitarExtension(reservaId, userId, validatedBody.extensionHoras);

    // Notify admins
    notifyAdminsNewExtension(requestData);

    res.status(201).json({
      success: true,
      message: 'La solicitud de extensión ha sido enviada con éxito',
      data: requestData
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      throw error;
    }
  }
}



export async function adminResolverExtension(req: Request, res: Response) {
  try {
    const requestId = Number(req.params.requestId);

    if (isNaN(requestId) || requestId <= 0) {
      res.status(400).json({ success: false, error: 'Invalid Request ID' });
      return;
    }

    const userId = req.user?.id;
    const tipo = req.user?.tipo;
    if (!userId || !tipo || tipo !== 'personal') {
      res.status(403).json({
        success: false,
        error: 'Solo el personal puede resolver solicitudes de extensión.'
      });
      return;
    }

    const validatedBody = await validateRequest<ResolverExtensionRequest>(
      resolverExtensionSchema,
      req.body
    );

    const requestData = await resolverExtension(requestId, validatedBody.status);

    // Notify student globally (each client can filter by 'estudianteId')
    // We typically want the original student's userId so we have to get it.
    // Usually it can be stored in the request or queried. But the notification event broadcasts it.
    notifyExtensionResolved(requestId, requestData);

    res.status(200).json({
      success: true,
      message: `La solicitud fue ${validatedBody.status} exitosamente.`,
      data: requestData
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      throw error;
    }
  }
}


export async function generarQrCodeInvitacion(req: Request, res: Response) {
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

    const qr = await generarQrCodeConId(reservaId, userId, tipoUsuario, TipoQr.Invitacion);
    res.status(200).json({
      success: true,
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
      throw error;
    }
  }
}

export async function generarQrCodeAcceso(req: Request, res: Response) {
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

    const qr = await generarQrCodeConId(reservaId, userId, tipoUsuario, TipoQr.Acceso);
    res.status(200).json({
      success: true,
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
