import { hashPassword, verifyPassword, generateToken, verifyToken } from '../src/services/authService';

import {expect, describe, it} from '@jest/globals';

describe('Auth Service', () => {
  describe('Password Management', () => {
    it('should hash password', async () => {
      const password = 'Test@1234';
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should verify correct password', async () => {
      const password = 'Test@1234';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'Test@1234';
      const wrongPassword = 'Wrong@5678';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token Management', () => {
    it('should generate valid token', () => {
      const payload = {
        id: 1,
        tipo: 'estudiante' as const,
        email: 'test@example.com'
      };

      const response = generateToken(payload);

      expect(response).toHaveProperty('access_token');
      expect(response).toHaveProperty('expires_in');
      expect(response.access_token.length).toBeGreaterThan(0);
    });

    it('should verify valid token', () => {
      const payload = {
        id: 1,
        tipo: 'estudiante' as const,
        email: 'test@example.com'
      };

      const { access_token } = generateToken(payload);
      const decoded = verifyToken(access_token);

      expect(decoded.id).toBe(payload.id);
      expect(decoded.tipo).toBe(payload.tipo);
      expect(decoded.email).toBe(payload.email);
    });

    it('should reject invalid token', () => {
      expect(() => {
        verifyToken('invalid.token.here');
      }).toThrow();
    });
  });
});
