import { Request, Response } from 'express'; /*lo que envia el cliente y lo que se responde*/
import { ApiError, UnauthorizedError } from '../types'; /*errores controlados*/
import { aceptarInvitacionConQr, actualizarEstadoInvitacion } from '../services/invitationService';

export async function updateInvitationStatus(req: Request, res: Response) { /* se define el endpoint*/
    /*PUT, con ruta: /api/invitations/:id/status*/  
  try {
    const invitationId = Number(req.params.id); /*toma el ID, si esta en string lo convierte a numero*/
    const { status } = req.body; 

    const userId = req.user?.id; /*si el usuario esta autenticado, toma su ID*/

    if (!userId) {
      throw new UnauthorizedError(); /*si no esta autenticado, lanza un error*/
    }

    await actualizarEstadoInvitacion(invitationId, userId, status); /*Envía invitationId, userId y status; valida y actualiza en BD*/

    res.status(200).json({ /*si todo va bien, responde con éxito*/
      success: true,
      message: 'Estado de invitación actualizado'
    });

  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({ /*error genérico*/
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

export async function aceptarInvitacionDeQr(req: Request, res: Response) {
  try {
    const reservaId = Number(req.params.reservaId); /*toma el ID, si esta en string lo convierte a numero*/
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError(); /*si no esta autenticado, lanza un error*/
    }

    await aceptarInvitacionConQr(reservaId, userId); /*Envía invitationId, userId y status; valida y actualiza en BD*/

    res.status(200).json({ /*si todo va bien, responde con éxito*/
      success: true,
      message: 'Estado de invitación actualizado'
    });

  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({ /*error genérico*/
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
