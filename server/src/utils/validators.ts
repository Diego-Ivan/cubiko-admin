import { z } from 'zod';

// Regex para validar contraseña
export const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters long')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 'Password must contain at least one special character');
  

// Validación de registro de estudiante y personal
// TODO: Me gustaría que la validación pudiera usar los valores de los enums en vez de reescribirlos
export const registerSchema = z.object({
  nombre: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  status: z.enum(['Activo', 'Inactivo', 'Egresado']).optional().default('Activo')
});

export const registerPersonnelSchema = z.object({
  nombre: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  rol: z.enum(['Bibliotecario', 'Admin'], { errorMap: () => ({ message: 'Role must be Bibliotecario or Admin' }) })
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Disponibilidad de salas
export const roomAvailabilitySchema = z.object({
  fecha: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid date'),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be HH:MM format'),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be HH:MM format'),
  capacidad: z.number().int().positive().optional()
});

// Cancelar reserva
export const cancelarReservaSchema = z.object({
  reservaId: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, 'Reserva ID must be a positive number')
});

// Parámetros de extender reserva
export const extenderReservaParamSchema = z.object({
  reservaId: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, 'Reserva ID must be a positive number')
});

// Extender reserva
export const extenderReservaBodySchema = z.object({
  extensionHoras: z.number().positive('Extension must be a positive number').optional().default(1)
});

// Request
export async function validateRequest<T>(schema: z.ZodSchema, data: unknown): Promise<T> {
  try {
    return schema.parse(data) as T;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map(e => {
        const path = e.path.length > 0 ? e.path.join('.') : 'root';
        return `${path}: ${e.message}`;
      }).join('; ');
      throw new Error(fieldErrors);
    }
    throw error;
  }
}
