import { Request, Response } from 'express';
import pool from '../config/database';
import { hashPassword, verifyPassword, generateToken } from '../services/authService';
import { validateRequest, registerSchema, registerPersonnelSchema, loginSchema } from '../utils/validators';
import { EstudianteStatus, RegisterRequest, RegisterPersonnelRequest, LoginRequest, UnauthorizedError, ConflictError } from '../types';

// ==================
// Register Student
// ==================
export async function registerStudent(req: Request, res: Response): Promise<void> {
  try {
    // Validate request
    const body = await validateRequest<RegisterRequest>(registerSchema, req.body);

    // Check if email already exists
    const connection = await pool.getConnection();
    try {
      const [existing] = await connection.query(
        'SELECT id FROM Estudiante WHERE email = ?',
        [body.email]
      );

      if (Array.isArray(existing) && existing.length > 0) {
        throw new ConflictError('Email already registered');
      }

      // Hash password
      const passwordHash = await hashPassword(body.password);

      // Insert student
      const [result] = await connection.query(
        'INSERT INTO Estudiante (nombre, email, password_hash, status, bloqueado, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [body.nombre, body.email, passwordHash, body.status || EstudianteStatus.ACTIVO, false]
      );

      // Generate token
      const insertResult = result as any;
      const token = generateToken({
        id: insertResult.insertId,
        tipo: 'estudiante',
        email: body.email
      });

      res.status(201).json({
        success: true,
        data: token,
        message: 'Student registered successfully'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Email already registered')) {
        res.status(409).json({
          success: false,
          error: error.message
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

// ==================
// Login Student
// ==================
export async function loginStudent(req: Request, res: Response): Promise<void> {
  try {
    // Validate request
    const body = await validateRequest<LoginRequest>(loginSchema, req.body);

    const connection = await pool.getConnection();
    try {
      // Get student by email
      const [results] = await connection.query(
        'SELECT id, email, password_hash FROM Estudiante WHERE email = ?',
        [body.email]
      );

      const students = results as any[];
      if (students.length === 0) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const student = students[0];

      // Verify password
      const passwordMatch = await verifyPassword(body.password, student.password_hash);
      if (!passwordMatch) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Generate token
      const token = generateToken({
        id: student.id,
        tipo: 'estudiante',
        email: student.email
      });

      res.status(201).json({
        success: true,
        data: token,
        message: 'Login successful'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      res.status(401).json({
        success: false,
        error: error.message
      });
    } else if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

// ==================
// Register Personnel
// ==================
export async function registerPersonnel(req: Request, res: Response): Promise<void> {
  try {
    // Validate request
    const body = await validateRequest<RegisterPersonnelRequest>(registerPersonnelSchema, req.body);

    // Check if email already exists
    const connection = await pool.getConnection();
    try {
      const [existing] = await connection.query(
        'SELECT id FROM PersonalBiblioteca WHERE email = ?',
        [body.email]
      );

      if (Array.isArray(existing) && existing.length > 0) {
        throw new ConflictError('Email already registered');
      }

      // Hash password
      const passwordHash = await hashPassword(body.password);

      // Insert personnel
      const [result] = await connection.query(
        'INSERT INTO PersonalBiblioteca (nombre, email, password_hash, rol, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [body.nombre, body.email, passwordHash, body.rol]
      );

      // Generate token
      const insertResult = result as any;
      const token = generateToken({
        id: insertResult.insertId,
        tipo: 'personal',
        email: body.email,
        rol: body.rol
      });

      res.status(201).json({
        success: true,
        data: token,
        message: 'Personnel registered successfully'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Email already registered')) {
        res.status(409).json({
          success: false,
          error: error.message
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

// ==================
// Login Personnel
// ==================
export async function loginPersonnel(req: Request, res: Response): Promise<void> {
  try {
    // Validate request
    const body = await validateRequest<LoginRequest>(loginSchema, req.body);

    const connection = await pool.getConnection();
    try {
      // Get personnel by email
      const [results] = await connection.query(
        'SELECT id, email, password_hash, rol FROM PersonalBiblioteca WHERE email = ?',
        [body.email]
      );

      const personnel = results as any[];
      if (personnel.length === 0) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const person = personnel[0];

      // Verify password
      const passwordMatch = await verifyPassword(body.password, person.password_hash);
      if (!passwordMatch) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Generate token
      const token = generateToken({
        id: person.id,
        tipo: 'personal',
        email: person.email,
        rol: person.rol
      });

      res.status(200).json({
        success: true,
        data: token,
        message: 'Login successful'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      res.status(401).json({
        success: false,
        error: error.message
      });
    } else if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}
