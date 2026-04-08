# API de Cubiko

## Features

- [x] Auth basada en JWT para personal y usuarios
- [x] Enlistar disponibilidad de salas
- [ ] Crear Reservaciones
- [ ] Modificar reservaciones
- [ ]

## Prerequisitos

- **Node.js** 20+
- **npm** or **yarn**
- **MySQL** 8.0+ (or use Docker)

## Variables de Environment

Configura el environment como se muestra a continuación

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=biblioteca

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRY=24h

# Server Configuration
NODE_ENV=development
PORT=3001

# Password Configuration
PASSWORD_MIN_LENGTH=10
```

## Available Scripts

```bash
# Development
npm run dev           # Start development server with ts-node

# Production
npm run build         # Compile TypeScript to JavaScript
npm start             # Run compiled JavaScript

# Testing
npm test              # Run Jest tests
npm run test:watch   # Run tests in watch mode
```

## API Endpoints

### Authentication

#### Registrar Estudiante

```http
POST /api/auth/register
Content-Type: application/json

{
  "nombre": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass@123",
  "status": "Activo"
}
```

#### Registrar Personal

```http
POST /api/auth/register
Content-Type: application/json

{
  "nombre": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass@123",
  "rol": "Bibliotecario"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": "24h"
  },
  "message": "Student registered successfully"
}
```

#### Login Estudiante

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass@123"
}
```

#### Login Personal

```http
POST /api/auth/login-personnel
Content-Type: application/json

{
  "email": "librarian@example.com",
  "password": "SecurePass@123"
}
```

### Rooms

#### Enlistar salas disponibles

```http
GET /api/rooms/available?fecha=2026-04-15&horaInicio=14:00&horaFin=16:00&capacidad=3
Authorization: Bearer {token}
```

#### Enlistar salas usadas

```http
GET /api/rooms/used
Authorization: Bearer {token}
```

## Base de Datos

### Estudiante

- `id` (INT, PK)
- `nombre` (VARCHAR)
- `email` (VARCHAR, UNIQUE)
- `password_hash` (VARCHAR)
- `status` (ENUM: 'Activo', 'Inactivo', 'Egresado')
- `bloqueado` (BOOLEAN)
- `created_at` (TIMESTAMP)

### PersonalBiblioteca

- `id` (INT, PK)
- `nombre` (VARCHAR)
- `email` (VARCHAR, UNIQUE)
- `password_hash` (VARCHAR)
- `rol` (ENUM: 'Bibliotecario', 'Admin')
- `created_at` (TIMESTAMP)

### Reserva

- `id` (INT, PK)
- `estudiante_id` (INT, FK)
- `sala_numero` (INT, FK)
- `fechaInicio` (DATE)
- `horaInicio` (TIME)
- `fechaFin` (DATE)
- `horaFin` (TIME)
- `numPersonas` (INT)
- `status` (ENUM: 'Activa', 'Completada', 'Cancelada')

### SolicitudExtension

- `id` (INT, PK)
- `reserva_id` (INT, FK)
- `fechaSolicitud` (TIMESTAMP)
- `estado` (ENUM: 'Pendiente', 'Aprobada', 'Rechazada')
- `extensionHoras` (DECIMAL(3,1), max 1.5)
- `notas` (TEXT)
- `fechaAprobacion` (TIMESTAMP)
- `personal_id` (INT, FK)

### PrestamoMaterial

- `id` (INT, PK)
- `estudiante_id` (INT, FK)
- `material_id` (VARCHAR, FK)
- `fechaInicio` (DATE)
- `fechaFin` (DATE)

## Testing

Ejecutar los tests:

```bash
npm test
```

Ejecutar los tests watch mode:

```bash
npm run test:watch
```

Test Coverage:

```bash
npm test -- --coverage
```

## Reglas de Validación

### Contraseña

- Mínimo 10 characters
- Al menos un 1 number
- Al menos un special character (e.g., @, #, $, %, !, &)
