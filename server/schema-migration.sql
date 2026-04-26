PRAGMA foreign_keys = ON;

-- SQLite no usa CREATE DATABASE / USE

CREATE TABLE Estudiante (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Activo', 'Inactivo', 'Egresado')),
    bloqueado INTEGER NOT NULL DEFAULT 0 CHECK (bloqueado IN (0, 1)),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Material (
    matId TEXT PRIMARY KEY,
    tipo TEXT NOT NULL
);

CREATE TABLE Sala (
    numero INTEGER NOT NULL,
    ubicacion TEXT NOT NULL,
    maxPersonas INTEGER NOT NULL,
    minPersonas INTEGER NOT NULL,
    PRIMARY KEY (ubicacion, numero),
    CHECK (minPersonas <= maxPersonas)
);

CREATE TABLE PrestamoMaterial (
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

CREATE TABLE Reserva (
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

CREATE TABLE Multa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estudiante_id INTEGER NOT NULL,
    monto NUMERIC NOT NULL,
    fechaAplicacion TEXT NOT NULL,
    pagado INTEGER NOT NULL DEFAULT 0 CHECK (pagado IN (0, 1)),
    FOREIGN KEY (estudiante_id) REFERENCES Estudiante(id)
        ON DELETE CASCADE
);

CREATE TABLE Pago (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    multa_id INTEGER NOT NULL,
    monto NUMERIC NOT NULL,
    fecha TEXT NOT NULL,
    FOREIGN KEY (multa_id) REFERENCES Multa(id)
        ON DELETE CASCADE,
    CHECK (monto >= 0)
);

CREATE TABLE PersonalBiblioteca (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('Bibliotecario', 'Admin')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE SolicitudExtension (
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

CREATE INDEX idx_estudiante_email ON Estudiante(email);
CREATE INDEX idx_personal_email ON PersonalBiblioteca(email);
CREATE INDEX idx_reserva_estudiante ON Reserva(estudiante_id);
CREATE INDEX idx_reserva_sala ON Reserva(sala_ubicacion, sala_numero);
CREATE INDEX idx_prestamo_estudiante ON PrestamoMaterial(estudiante_id);
CREATE INDEX idx_extension_reserva ON SolicitudExtension(reserva_id);
CREATE INDEX idx_extension_estado ON SolicitudExtension(estado);
