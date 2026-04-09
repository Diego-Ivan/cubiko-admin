import {
  registerSchema,
  loginSchema,
  passwordSchema,
} from '../src/utils/validators';

import {expect, describe, it} from '@jest/globals';

describe('Validators', () => {
  describe('Password Validation', () => {
    it('should accept valid password', async () => {
      const result = passwordSchema.safeParse('Secure@12345');
      expect(result.success).toBe(true);
    });

    it('should reject password without number', async () => {
      const result = passwordSchema.safeParse('Secure@Password');
      expect(result.success).toBe(false);
    });

    it('should reject password without special character', async () => {
      const result = passwordSchema.safeParse('SecurePassword123');
      expect(result.success).toBe(false);
    });

    it('should reject password shorter than 10 chars', async () => {
      const result = passwordSchema.safeParse('Sec@123');
      expect(result.success).toBe(false);
    });
  });

  describe('Register Validation', () => {
    it('should validate correct register data', async () => {
      const data = {
        nombre: 'John Doe',
        email: 'john@example.com',
        password: 'Secure@12345'
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', async () => {
      const data = {
        nombre: 'John Doe',
        email: 'invalid-email',
        password: 'Secure@12345'
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject short name', async () => {
      const data = {
        nombre: 'J',
        email: 'john@example.com',
        password: 'Secure@12345'
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Login Validation', () => {
    it('should validate correct login data', async () => {
      const data = {
        email: 'john@example.com',
        password: 'Secure@12345'
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', async () => {
      const data = {
        email: 'not-an-email',
        password: 'Secure@12345'
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
