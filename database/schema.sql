-- schema.sql
-- Script de creación de la base de datos Air-e

CREATE DATABASE IF NOT EXISTS aire_db;
USE aire_db;

-- Tabla de PRST (Proveedores de Servicios de Telecomunicaciones)
CREATE TABLE IF NOT EXISTS PrstList (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    nombre_corto VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (nombre_completo),
    UNIQUE KEY (nombre_corto)
);

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS Users (
    id VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    correo VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    rol ENUM('admin', 'prst', 'ejecutiva', 'coordinador', 'analista', 'brigada') NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    nombre_prst VARCHAR(100) NULL,
    cedula VARCHAR(20) NULL,
    matricula_profesional VARCHAR(50) NULL,
    direccion VARCHAR(255) NULL,
    barrio VARCHAR(100) NULL,
    ciudad VARCHAR(100) NULL,
    celular VARCHAR(20) NULL,
    tipo_coordinador ENUM('administrativo', 'operativo', 'censo') NULL,
    departamento VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (nombre_prst) REFERENCES PrstList(nombre_corto) ON DELETE SET NULL
);

-- Tabla intermedia para relación muchos-a-muchos entre Usuarios (ejecutivas) y PRST
CREATE TABLE IF NOT EXISTS UserPrstResponsibility (
    user_id VARCHAR(20) NOT NULL,
    prst_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, prst_id),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (prst_id) REFERENCES PrstList(id) ON DELETE CASCADE
);

-- Tabla de Proyectos
CREATE TABLE IF NOT EXISTS Projects (
    id VARCHAR(100) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT NULL,
    prst_nombre VARCHAR(100) NOT NULL,
    estado ENUM(
        'Nuevo',
        'En Revision por Ejecutiva',
        'En Revisión por Ejecutiva',
        'Documentación Errada',
        'En Asignación',
        'Asignado',
        'En Gestion por Analista',
        'En Gestion por Brigada',
        'En Revision de Verificacion',
        'Verificado',
        'Finalizado',
        'completado',
        'inactivo',
        'activo'
    ) NOT NULL,
    fecha_creacion DATETIME NOT NULL,
    fecha_actualizacion DATETIME NOT NULL,
    creador_id VARCHAR(20) NOT NULL,
    ejecutiva_id VARCHAR(20) NULL,
    coordinador_id VARCHAR(20) NULL,
    analista_id VARCHAR(20) NULL,
    brigada_id VARCHAR(20) NULL,
    kml_data JSON NULL,
    num_poste INT NULL,
    sector VARCHAR(100) NULL,
    departamento VARCHAR(100) NULL,
    comentario_cambio_estado TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (prst_nombre) REFERENCES PrstList(nombre_corto) ON DELETE CASCADE,
    FOREIGN KEY (creador_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (ejecutiva_id) REFERENCES Users(id) ON DELETE SET NULL,
    FOREIGN KEY (coordinador_id) REFERENCES Users(id) ON DELETE SET NULL,
    FOREIGN KEY (analista_id) REFERENCES Users(id) ON DELETE SET NULL,
    FOREIGN KEY (brigada_id) REFERENCES Users(id) ON DELETE SET NULL
);

-- Tabla de Historial de Estados de Proyectos
CREATE TABLE IF NOT EXISTS ProjectStatusHistory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(100) NOT NULL,
    fecha DATETIME NOT NULL,
    estado_anterior VARCHAR(50) NOT NULL,
    nuevo_estado VARCHAR(50) NOT NULL,
    usuario_id VARCHAR(20) NULL,
    comentario TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES Users(id) ON DELETE SET NULL
);

-- Tabla de Notificaciones
CREATE TABLE IF NOT EXISTS Notifications (
    id VARCHAR(20) PRIMARY KEY,
    usuario_id VARCHAR(20) NOT NULL,
    fecha DATETIME NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    leido BOOLEAN DEFAULT FALSE,
    tipo ENUM('estado_proyecto', 'nuevo_proyecto', 'otro') NOT NULL,
    project_id VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE SET NULL
);

-- Tabla de Censos
CREATE TABLE IF NOT EXISTS Census (
    id VARCHAR(20) PRIMARY KEY,
    project_id VARCHAR(100) NOT NULL,
    num_poste VARCHAR(50) NOT NULL,
    datos JSON NOT NULL,
    fecha_creacion DATETIME NOT NULL,
    usuario_id VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Tabla de Solicitudes de Cambio de Contraseña
CREATE TABLE IF NOT EXISTS PasswordRequests (
    id VARCHAR(20) PRIMARY KEY,
    nombre_usuario VARCHAR(50) NOT NULL,
    fecha_solicitud DATETIME NOT NULL,
    estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nombre_usuario) REFERENCES Users(usuario) ON DELETE CASCADE
);

-- Tabla de Contadores (para generar IDs secuenciales)
CREATE TABLE IF NOT EXISTS Counters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL UNIQUE,
    valor INT NOT NULL DEFAULT 1000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_projects_estado ON Projects(estado);
CREATE INDEX idx_projects_prst ON Projects(prst_nombre);
CREATE INDEX idx_users_rol ON Users(rol);