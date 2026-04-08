import { Request, Response, NextFunction } from 'express';
import { ApiError, ValidationError } from '../types';

export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
    return;
  }

  if (err instanceof ValidationError) {
    res.status(400).json({
      success: false,
      error: err.message
    });
    return;
  }

  // Handle Zod validation errors
  if (err.message && err.message.includes('validation')) {
    res.status(400).json({
      success: false,
      error: err.message
    });
    return;
  }

  // Default error
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};
