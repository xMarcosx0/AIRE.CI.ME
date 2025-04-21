-- seeds.sql
-- Datos iniciales para la base de datos Air-e

-- Insertar PRST
INSERT INTO PrstList (nombre_completo, nombre_corto) VALUES 
('AIRTEK CARRIER SERVICES S.A.S.', 'AIRTEK CARRIER SERVICES'),
('ALIADOS EN COMUNICACION NET', 'TOTAL CONEXION'),
('HB TV NET S.A.S.', 'TVNET'),
('HOGARNET COMUNICACIONES S.A.S.', 'HOGARNET'),
('INTELEXA DE COLOMBIA S.A.S', 'INTELEXA DE COLOMBIA'),
('INTER REDES DEL MAGDALENA S.A.S', 'INTER REDES DEL MAGDALENA'),
('INTERNEXT COLOMBIA S.A.S', 'INTERNEXT'),
('INTERTEL SATELITAL S.A.S', 'INTERTEL SATELITAL'),
('MACITEL S.A.S', 'MACITEL'),
('MEDIA COMMERCE PARTNERS S.A.S.', 'MEDIA COMMERCE'),
('MEGATEL DE COLOMBIA S.A.S', 'MEGATEL'),
('NOVACLICK S.A.S', 'NOVACLICK'),
('PROMOTORA DE TELEVISION, INTERNET Y COMUNICACIONES S.A.S.', 'PROMO VISIÓN'),
('R&R TELECOMUNICACIONES S.A.S', 'R&R TELECOMUNICACIONES'),
('RAPILINK S.A.S', 'RAPILINK'),
('REDES TELECOMUNICACIONES DIGITALES DE COLOMBIA S.A.S.', 'REDES TELECOMUNICACIONES DIGITALES DE COLOMBIA'),
('SAVASA SOLUCIONES INTEGRALES S.A.S', 'SAVASA SOLUCIONES INTEGRALES'),
('WAYIRANET S.A.S', 'WAYIRANET'),
('WIPLUS COMUNICACIONES DE COLOMBIA S.A.S', 'WIPLUS COMUNICACIONES DE COLOMBIA'),
('TUNORTETV TELECOMUNICACIONES S.A.S.', 'TUNORTETV TELECOMUNICACIONES'),
('INTERCONEXIONES TECNOLOGICAS DEL CARIBE SAS (INTERCON)', 'INTERCON'),
('UNE EPM TELECOMUNICACIONES S.A.', 'TIGO'),
('QUEST TELECOM COLOMBIA S.A.S', 'QUEST TELECOM'),
('BITEL DE COLOMBIA SAS', 'DIGITAL COAST'),
('DIGITAL COAST S.A.S', 'MEGA TV'),
('JR REDES DEL CARIBE S.A.S.', 'JR REDES'),
('FENIX SOLUTION WIRELESS S.A.S.', 'FENIX');

-- Insertar usuarios de ejemplo
INSERT INTO Users (id, nombre, apellido, usuario, correo, password, rol, activo) VALUES
('1', 'Jorge', 'Ditta', 'jditta', 'jditta@aire.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrYV7ZRHH3XjNiQ7JTHQ7z3Q9Q1qHyW', 'admin', TRUE),
('2', 'Juan', 'Pérez', 'jperez', 'jperez@aire.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrYV7ZRHH3XjNiQ7JTHQ7z3Q9Q1qHyW', 'prst', TRUE),
('4', 'Maria Isabel', 'Jimenez Beleño', 'mjimenez', 'mjimenez@aire.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrYV7ZRHH3XjNiQ7JTHQ7z3Q9Q1qHyW', 'ejecutiva', TRUE),
('8', 'Herbert Ale', 'Petano Baleta', 'hpetano', 'hpetano@aire.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrYV7ZRHH3XjNiQ7JTHQ7z3Q9Q1qHyW', 'coordinador', TRUE),
('11', 'Marcos', 'Márquez', 'mmarquez', 'mmarquez@aire.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrYV7ZRHH3XjNiQ7JTHQ7z3Q9Q1qHyW', 'analista', TRUE),
('13', 'Richard', 'de Lima Guette', 'rlima', 'rlima@aire.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrYV7ZRHH3XjNiQ7JTHQ7z3Q9Q1qHyW', 'brigada', TRUE);

-- Insertar relaciones ejecutiva-PRST
INSERT INTO UserPrstResponsibility (user_id, prst_id) VALUES
('4', (SELECT id FROM PrstList WHERE nombre_corto = 'AIRTEK CARRIER SERVICES')),
('4', (SELECT id FROM PrstList WHERE nombre_corto = 'TOTAL CONEXION')),
('4', (SELECT id FROM PrstList WHERE nombre_corto = 'TVNET'));

-- Insertar contadores iniciales
INSERT INTO Counters (tipo, valor) VALUES 
('projects', 1000),
('notifications', 1000),
('census', 1000),
('users', 16);