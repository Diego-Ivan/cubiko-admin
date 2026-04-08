// ==================
// User Types
// ==================

export enum EstudianteStatus {
  ACTIVO = 'Activo',
  INACTIVO = 'Inactivo',
  EGRESADO = 'Egresado'
}

export enum PersonalRol {
  BIBLIOTECARIO = 'Bibliotecario',
  ADMIN = 'Admin'
}

export interface Estudiante {
  id: number;
  nombre: string;
  email: string;
  password_hash: string;
  status: EstudianteStatus;
  bloqueado: boolean;
  created_at: Date;
}

export interface PersonalBiblioteca {
  id: number;
  nombre: string;
  email: string;
  password_hash: string;
  rol: PersonalRol;
  created_at: Date;
}

export type AuthUser = Estudiante | PersonalBiblioteca;

// ==================
// Room Types
// ==================

export interface Sala {
  numero: number;
  ubicacion: string;
  maxPersonas: number;
  minPersonas: number;
}

// ==================
// Material Types
// ==================

export interface Material {
  matId: string;
  tipo: string;
}

// ==================
// Reservation Types
// ==================

export enum ReservaStatus {
  ACTIVA = 'Activa',
  COMPLETADA = 'Completada',
  CANCELADA = 'Cancelada'
}

export interface Reserva {
  id: number;
  estudiante_id: number;
  sala_numero: number | null;
  fechaInicio: Date;
  horaInicio: string; // HH:MM format
  fechaFin: Date;
  horaFin: string; // HH:MM format
  numPersonas?: number;
  status?: ReservaStatus;
}

export interface ReservaWithRoom extends Reserva {
  sala?: Sala;
}

export interface JWTPayload {
  id: number;
  tipo: 'estudiante' | 'personal';
  email: string;
  rol?: PersonalRol;
}

export interface TokenResponse {
  access_token: string;
  expires_in: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
  status?: EstudianteStatus;
}

export interface RegisterPersonnelRequest {
  nombre: string;
  email: string;
  password: string;
  rol: PersonalRol;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RoomAvailabilityQuery {
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:MM
  horaFin: string; // HH:MM
  capacidad?: number;
}

export interface ExtensionRequestBody {
  reserva_id: number;
  extensionHoras: number;
}


// Respuesta de la API

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ==================
// Error Types
// ==================

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(400, message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Not Found') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message);
    this.name = 'ConflictError';
  }
}
