import {
  registerSchema,
  loginSchema,
  passwordSchema,
  createReservationSchema,
  modifyReservationSchema,
  extensionRequestSchema
} from '../src/utils/validators';

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

  describe('Reservation Validation', () => {
    it('should validate correct reservation data', async () => {
      const data = {
        sala_numero: 101,
        fechaInicio: '2026-04-15',
        horaInicio: '14:00',
        fechaFin: '2026-04-15',
        horaFin: '16:00',
        numPersonas: 2
      };

      const result = createReservationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid time format', async () => {
      const data = {
        sala_numero: 101,
        fechaInicio: '2026-04-15',
        horaInicio: '14',
        fechaFin: '2026-04-15',
        horaFin: '16:00',
        numPersonas: 2
      };

      const result = createReservationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate modify reservation data', async () => {
      const data = {
        numPersonas: 3
      };

      const result = modifyReservationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Extension Validation', () => {
    it('should validate correct extension request', async () => {
      const data = {
        reserva_id: 1,
        extensionHoras: 1.5
      };

      const result = extensionRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject extension over 1.5 hours', async () => {
      const data = {
        reserva_id: 1,
        extensionHoras: 2
      };

      const result = extensionRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
