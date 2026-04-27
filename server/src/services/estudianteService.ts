import pool from '../config/database'; /*Importa la conexión a la base de datos*/
import { Estudiante } from '../types';

export async function buscarEstudiantes(q: string): Promise<Estudiante[]> { /*Busca estudiantes por nombre o email*/
  /*Consulta SQL para obtener datos de estudiantes que coincidan con la búsqueda*/
  const connection = await pool.getConnection();
  const query = `
    SELECT id, nombre, email, status, bloqueado
    FROM Estudiante
    WHERE nombre LIKE ? OR email LIKE ?
  `;
  const [rows] = await connection.query(query, [`%${q}%`, `%${q}%`]); /*%${q}% permite buscar coincidencias parciales*/
  return rows as Estudiante[]; /*Devuelve resultados como un array de objetos Estudiante*/
}