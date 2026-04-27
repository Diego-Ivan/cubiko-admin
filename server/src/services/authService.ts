import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { JWTPayload, TokenResponse, UnauthorizedError } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

// ==================
// Password Management
// ==================
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ==================
// JWT Token Management
// ==================
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your_super_secret_refresh_key_change_this_in_production';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

export function generateToken(payload: JWTPayload): TokenResponse {
  const signOptions: SignOptions = {
    expiresIn: JWT_EXPIRY as any
  };
  const refreshSignOptions: SignOptions = {
    expiresIn: REFRESH_TOKEN_EXPIRY as any
  };
  
  const token = jwt.sign(payload, JWT_SECRET, signOptions);
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, refreshSignOptions);

  return {
    access_token: token,
    refresh_token: refreshToken,
    expires_in: JWT_EXPIRY
  };
}

export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
}

export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export function extractToken(authHeader: string | undefined): string {
  if (!authHeader) {
    throw new UnauthorizedError('Missing authorization header');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    throw new UnauthorizedError('Invalid authorization header format');
  }

  return parts[1];
}
