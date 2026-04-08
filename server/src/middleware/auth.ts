import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractToken } from '../services/authService';
import { UnauthorizedError, JWTPayload, PersonalRol } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// ==================
// Auth Middleware
// ==================
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = extractToken(req.headers.authorization);
    req.user = verifyToken(token);
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      res.status(401).json({
        success: false,
        error: error.message
      });
      return;
    }
    next(error);
  }
};

// ==================
// Authorization Middleware
// ==================
export const authorizeStudent = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
    return;
  }

  if (req.user.tipo !== 'estudiante') {
    res.status(403).json({
      success: false,
      error: 'Only students can access this resource'
    });
    return;
  }

  next();
};

export const authorizePersonnel = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
    return;
  }

  if (req.user.tipo !== 'personal') {
    res.status(403).json({
      success: false,
      error: 'Only library personnel can access this resource'
    });
    return;
  }

  next();
};

export const authorizeRole = (allowedRoles: PersonalRol[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.tipo !== 'personal') {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
      return;
    }

    if (!req.user.rol || !allowedRoles.includes(req.user.rol)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};
