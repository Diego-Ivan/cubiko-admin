import { Request, Response } from 'express';
import { ApiError, UnauthorizedError, ValidationError } from '../types';
import { buscarEstudiantes } from '../services/estudianteService'; /*importa la función del service que realiza la consulta dentro de la base de datos*/

export async function searchEstudiantes(req: Request, res: Response) { /*Define el endpoint que maneja la búsqueda de estudiantes*/
  try {
    const { q } = req.query; /*extrae el parámetro de consulta "q" que se espera que haya dentro de la URL*/

    if (!q || typeof q !== 'string' || q.trim() === '') { /*verifica que "q" exista, sea string y no esté vacía*/
      throw new ValidationError('El parámetro de consulta "q" es requerido y debe ser una cadena no vacía.');
    }

    const userId = req.user?.id; /*toma el ID del usuario autenticado, si no hay usuario autenticado, userId será undefined*/

    if (!userId) {
      throw new UnauthorizedError();
    }

    const resultados = await buscarEstudiantes(q.trim()); /*envía el valor de "q" al service, realiza la consulta en la base de datos y devuelve los resultados*/
    /*trim, elimina espacios extra en "q"*/
    res.status(200).json({ /*responde con éxito, al igual que con  los resultados de la búsqueda*/
      success: true,
      data: resultados
    });

  } catch (error) {
    console.error('Error en searchEstudiantes:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}