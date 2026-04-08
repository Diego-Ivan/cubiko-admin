

CREATE DATABASE biblioteca;
USE biblioteca;

CREATE TABLE Estudiante (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    status ENUM('Activo', 'Inactivo', 'Egresado') NOT NULL,
    bloqueado BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE Material (
    matId VARCHAR(50) PRIMARY KEY,
    tipo VARCHAR(100) NOT NULL
);

CREATE TABLE Sala (
    numero INT NOT NULL,
    ubicacion VARCHAR(255) NOT NULL,
    maxPersonas INT NOT NULL,
    minPersonas INT NOT NULL,
    PRIMARY KEY (ubicacion, numero),
    CHECK (minPersonas <= maxPersonas)
);


CREATE TABLE PrestamoMaterial (
    id INT PRIMARY KEY AUTO_INCREMENT,
    estudiante_id INT NOT NULL,
    material_id VARCHAR(50) NOT NULL,
    fechaInicio DATE NOT NULL,
    fechaFin DATE,

    FOREIGN KEY (estudiante_id) REFERENCES Estudiante(id)
        ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES Material(matId)
        ON DELETE CASCADE
);


CREATE TABLE Reserva (
    id INT PRIMARY KEY AUTO_INCREMENT,
    estudiante_id INT NOT NULL,
    sala_ubicacion VARCHAR(255),
    sala_numero INT,
    fechaInicio DATE NOT NULL,
    fechaFin DATE,

    FOREIGN KEY (estudiante_id) REFERENCES Estudiante(id)
        ON DELETE CASCADE,
    FOREIGN KEY (sala_ubicacion, sala_numero) REFERENCES Sala(ubicacion, numero)
        ON DELETE SET NULL
);


CREATE TABLE Multa (
    id INT PRIMARY KEY AUTO_INCREMENT,
    estudiante_id INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fechaAplicacion DATE NOT NULL,
    pagado BOOLEAN NOT NULL DEFAULT FALSE,

    FOREIGN KEY (estudiante_id) REFERENCES Estudiante(id)
        ON DELETE CASCADE
);


CREATE TABLE Pago (
    id INT PRIMARY KEY AUTO_INCREMENT,
    multa_id INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha DATE NOT NULL,

    FOREIGN KEY (multa_id) REFERENCES Multa(id)
        ON DELETE CASCADE,

    CHECK (monto >= 0)
);


ALTER TABLE Estudiante 
ADD COLUMN email VARCHAR(255) UNIQUE NOT NULL,
ADD COLUMN password_hash VARCHAR(255) NOT NULL,
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE PersonalBiblioteca (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('Bibliotecario', 'Admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE Reserva
ADD COLUMN horaInicio TIME,
ADD COLUMN horaFin TIME,
ADD COLUMN numPersonas INT,
ADD COLUMN status ENUM('Activa', 'Completada', 'Cancelada') DEFAULT 'Activa';


CREATE TABLE SolicitudExtension (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reserva_id INT NOT NULL,
    fechaSolicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('Pendiente', 'Aprobada', 'Rechazada') NOT NULL DEFAULT 'Pendiente',
    extensionHoras DECIMAL(3,1) NOT NULL,
    notas TEXT,
    fechaAprobacion TIMESTAMP,
    personal_id INT,

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
