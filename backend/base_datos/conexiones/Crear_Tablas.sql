-- =============================================================
-- 🗂️ Base de Datos: Sistema Portafolio Docente (VERSIÓN COMPLETA CORREGIDA)
-- Versión con Multi-Rol, Gestión de Ciclos y Seguridad Mejorada
-- =============================================================

CREATE DATABASE IF NOT EXISTS portafolio_docente_carga_academica CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE portafolio_docente_carga_academica;

-- =======================================
-- TABLAS BASE DEL SISTEMA (MEJORADAS)
-- =======================================

-- Usuarios con contraseña encriptada y mejoras
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) NULL,
    telefono VARCHAR(20) NULL,
    activo TINYINT(1) DEFAULT 1,
    ultimo_acceso DATETIME NULL,
    token_recuperacion VARCHAR(255) NULL,
    expiracion_token DATETIME NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_correo (correo),
    INDEX idx_activo (activo)
);

-- Tabla para múltiples roles por usuario
CREATE TABLE usuarios_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    rol ENUM('docente','verificador','administrador') NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    asignado_por INT NOT NULL,
    fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_revocacion DATETIME NULL,
    observaciones TEXT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (asignado_por) REFERENCES usuarios(id),
    UNIQUE KEY unique_usuario_rol_activo (usuario_id, rol, activo),
    INDEX idx_usuario_rol (usuario_id, rol)
);

-- Gestión de ciclos académicos
CREATE TABLE ciclos_academicos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT NULL,
    estado ENUM('preparacion','activo','cerrado','archivado') DEFAULT 'preparacion',
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    fecha_cierre_real DATETIME NULL,
    semestre_actual VARCHAR(50) NOT NULL,
    anio_actual INT NOT NULL,
    creado_por INT NOT NULL,
    cerrado_por INT NULL,
    configuracion JSON NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id),
    FOREIGN KEY (cerrado_por) REFERENCES usuarios(id),
    INDEX idx_estado (estado),
    INDEX idx_fecha_inicio (fecha_inicio),
    INDEX idx_semestre_anio (semestre_actual, anio_actual)
);

-- Estados del sistema por módulo
CREATE TABLE estados_sistema (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ciclo_id INT NOT NULL,
    modulo ENUM('carga_datos','gestion_documentos','verificacion','reportes') NOT NULL,
    habilitado TINYINT(1) DEFAULT 1,
    fecha_habilitacion DATETIME NULL,
    fecha_deshabilitacion DATETIME NULL,
    observaciones TEXT NULL,
    actualizado_por INT NOT NULL,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ciclo_id) REFERENCES ciclos_academicos(id) ON DELETE CASCADE,
    FOREIGN KEY (actualizado_por) REFERENCES usuarios(id),
    UNIQUE KEY unique_ciclo_modulo (ciclo_id, modulo),
    INDEX idx_ciclo_modulo (ciclo_id, modulo)
);

-- Semestres mejorados con relación a ciclos
CREATE TABLE semestres (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    ciclo_id INT NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    fecha_inicio DATE NULL,
    fecha_fin DATE NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ciclo_id) REFERENCES ciclos_academicos(id),
    UNIQUE KEY unique_nombre_ciclo (nombre, ciclo_id),
    INDEX idx_ciclo_activo (ciclo_id, activo)
);

-- Asignaturas mejoradas
CREATE TABLE asignaturas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    carrera VARCHAR(255) NOT NULL,
    semestre VARCHAR(50) NOT NULL,
    anio INT NOT NULL,
    creditos INT NOT NULL,
    tipo ENUM('teoria','practica','laboratorio') NOT NULL,
    ciclo_id INT NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    prerequisitos JSON NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ciclo_id) REFERENCES ciclos_academicos(id),
    UNIQUE KEY unique_codigo_ciclo (codigo, ciclo_id),
    INDEX idx_codigo (codigo),
    INDEX idx_carrera (carrera),
    INDEX idx_ciclo_activo (ciclo_id, activo)
);

-- Relación docentes-asignaturas mejorada
CREATE TABLE docentes_asignaturas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    docente_id INT NOT NULL,
    asignatura_id INT NOT NULL,
    ciclo_id INT NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    asignado_por INT NOT NULL,
    FOREIGN KEY (docente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id) ON DELETE CASCADE,
    FOREIGN KEY (ciclo_id) REFERENCES ciclos_academicos(id),
    FOREIGN KEY (asignado_por) REFERENCES usuarios(id),
    UNIQUE KEY unique_docente_asignatura_ciclo (docente_id, asignatura_id, ciclo_id),
    INDEX idx_docente_ciclo (docente_id, ciclo_id),
    INDEX idx_asignatura_ciclo (asignatura_id, ciclo_id)
);

-- Verificadores-docentes mejorada
CREATE TABLE verificadores_docentes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    verificador_id INT NOT NULL,
    docente_id INT NOT NULL,
    ciclo_id INT NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    asignado_por INT NOT NULL,
    observaciones TEXT NULL,
    FOREIGN KEY (verificador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (docente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (ciclo_id) REFERENCES ciclos_academicos(id),
    FOREIGN KEY (asignado_por) REFERENCES usuarios(id),
    UNIQUE KEY unique_verificador_docente_ciclo (verificador_id, docente_id, ciclo_id),
    INDEX idx_verificador_ciclo (verificador_id, ciclo_id),
    INDEX idx_docente_ciclo (docente_id, ciclo_id)
);

-- Estructura base mejorada
CREATE TABLE estructura_portafolio_base (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    nivel INT NOT NULL DEFAULT 1,
    orden INT NOT NULL,
    requiere_credito INT DEFAULT 0,
    carpeta_padre_id INT DEFAULT NULL,
    pertenece_presentacion TINYINT(1) DEFAULT 0,
    icono VARCHAR(50) DEFAULT 'folder',
    color VARCHAR(20) DEFAULT '#007bff',
    activo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (carpeta_padre_id) REFERENCES estructura_portafolio_base(id),
    INDEX idx_nivel_orden (nivel, orden),
    INDEX idx_padre_orden (carpeta_padre_id, orden)
);

-- Portafolios mejorados
CREATE TABLE portafolios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    docente_id INT NOT NULL,
    asignatura_id INT NULL,
    semestre_id INT NOT NULL,
    ciclo_id INT NOT NULL,
    estructura_id INT NULL,
    carpeta_padre_id INT DEFAULT NULL,
    nivel INT DEFAULT 0,
    ruta VARCHAR(500) NULL,
    estado ENUM('activo','bloqueado','archivado') DEFAULT 'activo',
    progreso_completado DECIMAL(5,2) DEFAULT 0.00,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (docente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id) ON DELETE SET NULL,
    FOREIGN KEY (semestre_id) REFERENCES semestres(id),
    FOREIGN KEY (ciclo_id) REFERENCES ciclos_academicos(id),
    FOREIGN KEY (estructura_id) REFERENCES estructura_portafolio_base(id),
    FOREIGN KEY (carpeta_padre_id) REFERENCES portafolios(id),
    INDEX idx_docente_ciclo (docente_id, ciclo_id),
    INDEX idx_asignatura_ciclo (asignatura_id, ciclo_id),
    INDEX idx_estructura (estructura_id),
    INDEX idx_estado (estado)
);

-- Archivos subidos mejorados
CREATE TABLE archivos_subidos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    portafolio_id INT NOT NULL,
    nombre_archivo VARCHAR(300) NOT NULL,
    nombre_original VARCHAR(300) NOT NULL,
    tipo_documento VARCHAR(100) NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    formato ENUM('pdf','docx','xlsx','pptx','txt','jpg','png') NOT NULL,
    tamaño_archivo BIGINT NULL,
    hash_archivo VARCHAR(64) NULL,
    estado ENUM('pendiente','en_revision','aprobado','rechazado','requiere_correccion') DEFAULT 'pendiente',
    usuario_id INT NOT NULL,
    verificado_por INT NULL,
    fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_verificacion DATETIME NULL,
    version INT DEFAULT 1,
    archivo_anterior_id INT NULL,
    metadatos JSON NULL,
    FOREIGN KEY (portafolio_id) REFERENCES portafolios(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (verificado_por) REFERENCES usuarios(id),
    FOREIGN KEY (archivo_anterior_id) REFERENCES archivos_subidos(id),
    INDEX idx_portafolio_estado (portafolio_id, estado),
    INDEX idx_usuario_fecha (usuario_id, fecha_subida),
    INDEX idx_estado_fecha (estado, fecha_subida)
);

-- Observaciones mejoradas
CREATE TABLE observaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    archivo_id INT NOT NULL,
    verificador_id INT NOT NULL,
    tipo ENUM('general','correccion','aprobacion','rechazo') DEFAULT 'general',
    contenido TEXT NOT NULL,
    es_publica TINYINT(1) DEFAULT 1,
    requiere_respuesta TINYINT(1) DEFAULT 0,
    respondida TINYINT(1) DEFAULT 0,
    prioridad ENUM('baja','media','alta','critica') DEFAULT 'media',
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (archivo_id) REFERENCES archivos_subidos(id) ON DELETE CASCADE,
    FOREIGN KEY (verificador_id) REFERENCES usuarios(id),
    INDEX idx_archivo_tipo (archivo_id, tipo),
    INDEX idx_verificador_fecha (verificador_id, creado_en)
);

-- Respuestas a observaciones
CREATE TABLE respuestas_observaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    observacion_id INT NOT NULL,
    usuario_id INT NOT NULL,
    contenido TEXT NOT NULL,
    es_solucion TINYINT(1) DEFAULT 0,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (observacion_id) REFERENCES observaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    INDEX idx_observacion_fecha (observacion_id, creado_en)
);

-- Notificaciones mejoradas
CREATE TABLE notificaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    tipo ENUM('sistema','documento','observacion','ciclo','asignacion') DEFAULT 'sistema',
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    enlace VARCHAR(500) NULL,
    datos_adicionales JSON NULL,
    visto TINYINT(1) DEFAULT 0,
    archivada TINYINT(1) DEFAULT 0,
    prioridad ENUM('baja','media','alta','urgente') DEFAULT 'media',
    fecha_expiracion DATETIME NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_lectura DATETIME NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_visto (usuario_id, visto),
    INDEX idx_tipo_prioridad (tipo, prioridad),
    INDEX idx_fecha_expiracion (fecha_expiracion)
);

-- Acciones de admin mejoradas (auditoría)
CREATE TABLE acciones_admin (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    accion ENUM('crear','editar','eliminar','activar','desactivar','asignar','cargar_excel','generar_reporte','cerrar_ciclo') NOT NULL,
    modulo ENUM('usuarios','asignaturas','portafolios','ciclos','verificaciones','sistema') NOT NULL,
    descripcion TEXT NOT NULL,
    datos_anteriores JSON NULL,
    datos_nuevos JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    resultado ENUM('exitoso','fallido','parcial') DEFAULT 'exitoso',
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES usuarios(id),
    INDEX idx_admin_fecha (admin_id, fecha),
    INDEX idx_accion_modulo (accion, modulo),
    INDEX idx_fecha (fecha)
);

-- Tipos de carga Excel soportados
CREATE TABLE tipos_carga_excel (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT NULL,
    plantilla_ruta VARCHAR(500) NULL,
    columnas_requeridas JSON NOT NULL,
    validaciones JSON NULL,
    activo TINYINT(1) DEFAULT 1,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cargas académicas mejoradas
CREATE TABLE cargas_academicas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ciclo_id INT NOT NULL,
    tipo_carga_id INT NOT NULL,
    nombre_archivo VARCHAR(300) NOT NULL,
    ruta_archivo TEXT NOT NULL,
    estado ENUM('procesando','completado','fallido','parcial') DEFAULT 'procesando',
    total_registros INT DEFAULT 0,
    registros_procesados INT DEFAULT 0,
    registros_fallidos INT DEFAULT 0,
    errores JSON NULL,
    resumen JSON NULL,
    observaciones TEXT NULL,
    fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_procesamiento DATETIME NULL,
    subido_por INT NOT NULL,
    FOREIGN KEY (ciclo_id) REFERENCES ciclos_academicos(id),
    FOREIGN KEY (tipo_carga_id) REFERENCES tipos_carga_excel(id),
    FOREIGN KEY (subido_por) REFERENCES usuarios(id),
    INDEX idx_ciclo_estado (ciclo_id, estado),
    INDEX idx_fecha_subida (fecha_subida)
);

-- Configuraciones del sistema
CREATE TABLE configuraciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    tipo ENUM('string','number','boolean','json') DEFAULT 'string',
    descripcion TEXT NULL,
    categoria VARCHAR(50) DEFAULT 'general',
    modificable TINYINT(1) DEFAULT 1,
    actualizado_por INT NULL,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (actualizado_por) REFERENCES usuarios(id),
    INDEX idx_categoria (categoria)
);
