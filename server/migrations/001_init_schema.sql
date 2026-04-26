-- D1 Database Migration: Initial Schema
-- Created: 2026-04-25
-- Description: Initialize all tables for biblioteca API

-- Enable foreign keys (note: D1 requires explicit enablement)
PRAGMA foreign_keys = ON;

-- Students/Users table
CREATE TABLE IF NOT EXISTS Estudiante (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo', 'Egresado')),
    bloqueado INTEGER NOT NULL DEFAULT 0 CHECK (bloqueado IN (0, 1)),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Materials/Resources table
CREATE TABLE IF NOT EXISTS Material (
    matId TEXT PRIMARY KEY,
    tipo TEXT NOT NULL
);

-- Rooms table
CREATE TABLE IF NOT EXISTS Sala (
    numero INTEGER NOT NULL,
    ubicacion TEXT NOT NULL,
    maxPersonas INTEGER NOT NULL,
    minPersonas INTEGER NOT NULL,
    PRIMARY KEY (ubicacion, numero),
    CHECK (minPersonas <= maxPersonas)
);

-- Material Loans table
CREATE TABLE IF NOT EXISTS PrestamoMaterial (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estudiante_id INTEGER NOT NULL,
    material_id TEXT NOT NULL,
    fechaInicio TEXT NOT NULL,
    fechaFin TEXT,
    FOREIGN KEY (estudiante_id) REFERENCES Estudiante(id)
        ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES Material(matId)
        ON DELETE CASCADE
);

-- Room Reservations table
CREATE TABLE IF NOT EXISTS Reserva (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estudiante_id INTEGER NOT NULL,
    sala_ubicacion TEXT,
    sala_numero INTEGER,
    fechaInicio TEXT NOT NULL,
    fechaFin TEXT,
    horaInicio TEXT,
    horaFin TEXT,
    numPersonas INTEGER,
    status TEXT DEFAULT 'Activa'
        CHECK (status IN ('Activa', 'Completada', 'Cancelada')),
    FOREIGN KEY (estudiante_id) REFERENCES Estudiante(id)
        ON DELETE CASCADE,
    FOREIGN KEY (sala_ubicacion, sala_numero) REFERENCES Sala(ubicacion, numero)
        ON DELETE SET NULL
);

-- Fines table
CREATE TABLE IF NOT EXISTS Multa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estudiante_id INTEGER NOT NULL,
    monto NUMERIC NOT NULL,
    fechaAplicacion TEXT NOT NULL,
    pagado INTEGER NOT NULL DEFAULT 0 CHECK (pagado IN (0, 1)),
    FOREIGN KEY (estudiante_id) REFERENCES Estudiante(id)
        ON DELETE CASCADE
);

-- Payments table
CREATE TABLE IF NOT EXISTS Pago (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    multa_id INTEGER NOT NULL,
    monto NUMERIC NOT NULL,
    fecha TEXT NOT NULL,
    FOREIGN KEY (multa_id) REFERENCES Multa(id)
        ON DELETE CASCADE,
    CHECK (monto >= 0)
);

-- Library Staff/Personnel table
CREATE TABLE IF NOT EXISTS PersonalBiblioteca (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'Bibliotecario' CHECK (rol IN ('Bibliotecario', 'Admin')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Reservation Extension Requests table
CREATE TABLE IF NOT EXISTS SolicitudExtension (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reserva_id INTEGER NOT NULL,
    fechaSolicitud TEXT DEFAULT CURRENT_TIMESTAMP,
    estado TEXT NOT NULL DEFAULT 'Pendiente'
        CHECK (estado IN ('Pendiente', 'Aprobada', 'Rechazada')),
    extensionHoras NUMERIC NOT NULL,
    notas TEXT,
    fechaAprobacion TEXT,
    personal_id INTEGER,
    FOREIGN KEY (reserva_id) REFERENCES Reserva(id)
        ON DELETE CASCADE,
    FOREIGN KEY (personal_id) REFERENCES PersonalBiblioteca(id)
        ON DELETE SET NULL,
    CHECK (extensionHoras <= 1.5)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_estudiante_email ON Estudiante(email);
CREATE INDEX IF NOT EXISTS idx_personal_email ON PersonalBiblioteca(email);
CREATE INDEX IF NOT EXISTS idx_reserva_estudiante ON Reserva(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_reserva_sala ON Reserva(sala_ubicacion, sala_numero);
CREATE INDEX IF NOT EXISTS idx_prestamo_estudiante ON PrestamoMaterial(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_extension_reserva ON SolicitudExtension(reserva_id);
CREATE INDEX IF NOT EXISTS idx_extension_estado ON SolicitudExtension(estado);
