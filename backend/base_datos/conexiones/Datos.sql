USE portafolio_docente_carga_academica;
-- =======================================
-- SOLO DATOS EN ORDEN CORRECTO
-- =======================================

-- PASO 1: Usuarios PRIMERO
INSERT INTO usuarios (nombres, apellidos, correo, contrasena) VALUES
('Admin', 'Sistema', 'admin@unsaac.edu.pe', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Carlos Ramón', 'Quispe Condori', 'carlos@unsaac.edu.pe', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Lisha Sabah', 'Diaz Caceres', 'lisha@unsaac.edu.pe', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('NILA ZONIA', 'ACURIO USCA', 'nila.acurio@unsaac.edu.pe', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('WILLIAN', 'ZAMALLOA PARO', 'willian.zamalloa@unsaac.edu.pe', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('GABRIELA', 'ZUÑIGA ROJAS', 'gabriela.zuniga@unsaac.edu.pe', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('DIANA', 'CONDORI VILCA', 'diana.condori@unsaac.edu.pe', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('JULIO CESAR', 'VALENCIA MONTILLA', 'julio.valencia@unsaac.edu.pe', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('ANA MARIA', 'TORRES HUAMÁN', 'ana.torres@unsaac.edu.pe', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('LUIS ALBERTO', 'MENDOZA QUISPE', 'luis.mendoza@unsaac.edu.pe', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- PASO 2: Ciclo académico
INSERT INTO ciclos_academicos (nombre, descripcion, estado, fecha_inicio, fecha_fin, semestre_actual, anio_actual, creado_por) VALUES
('2025-I', 'Primer semestre académico 2025', 'preparacion', '2025-03-01', '2025-07-31', '2025-1', 2025, 1);

-- PASO 3: Roles de usuarios
INSERT INTO usuarios_roles (usuario_id, rol, asignado_por) VALUES
(1, 'administrador', 1),
(2, 'docente', 1),
(4, 'docente', 1),
(5, 'docente', 1),
(6, 'docente', 1),
(7, 'docente', 1),
(8, 'docente', 1),
(9, 'docente', 1),
(10, 'docente', 1),
(3, 'verificador', 1),
(9, 'verificador', 1),
(2, 'verificador', 1),
(3, 'administrador', 1),
(10, 'verificador', 1),
(10, 'administrador', 1);

-- PASO 4: Estados del sistema
INSERT INTO estados_sistema (ciclo_id, modulo, habilitado, actualizado_por) VALUES
(1, 'carga_datos', 1, 1),
(1, 'gestion_documentos', 0, 1),
(1, 'verificacion', 0, 1),
(1, 'reportes', 1, 1);

-- PASO 5: Semestres
INSERT INTO semestres (nombre, ciclo_id) VALUES
('2025-1', 1),
('2025-2', 1);

-- PASO 6: Asignaturas
INSERT INTO asignaturas (nombre, codigo, carrera, semestre, anio, creditos, tipo, ciclo_id) VALUES
('Metodología de Desarrollo de Software', 'IF611AIN', 'Ingeniería Informática', '2025-1', 2025, 4, 'teoria', 1),
('Modelado y Simulación', 'IF669AIN', 'Ingeniería Informática', '2025-1', 2025, 3, 'teoria', 1),
('Base de Datos II', 'IF612AIN', 'Ingeniería Informática', '2025-1', 2025, 4, 'teoria', 1),
('Redes de Computadoras', 'IF613AIN', 'Ingeniería Informática', '2025-1', 2025, 3, 'practica', 1),
('Inteligencia Artificial', 'IF614AIN', 'Ingeniería Informática', '2025-1', 2025, 4, 'teoria', 1),
('Seguridad Informática', 'IF615AIN', 'Ingeniería Informática', '2025-1', 2025, 3, 'teoria', 1),
('Desarrollo Web Avanzado', 'IF616AIN', 'Ingeniería Informática', '2025-1', 2025, 4, 'practica', 1),
('Gestión de Proyectos TI', 'IF617AIN', 'Ingeniería Informática', '2025-1', 2025, 3, 'teoria', 1),
('Cálculo Diferencial', 'MAT101', 'Ingeniería Civil', '2025-1', 2025, 4, 'teoria', 1),
('Física General', 'FIS101', 'Ingeniería Civil', '2025-1', 2025, 4, 'teoria', 1),
('Mecánica de Suelos', 'CIV201', 'Ingeniería Civil', '2025-1', 2025, 3, 'practica', 1),
('Estructuras I', 'CIV301', 'Ingeniería Civil', '2025-1', 2025, 4, 'teoria', 1),
('Química General', 'QUI101', 'Ingeniería Química', '2025-1', 2025, 4, 'practica', 1),
('Termodinámica', 'QUI201', 'Ingeniería Química', '2025-1', 2025, 4, 'teoria', 1),
('Procesos Químicos', 'QUI301', 'Ingeniería Química', '2025-1', 2025, 3, 'teoria', 1),
('Microeconomía', 'ECO201', 'Administración', '2025-1', 2025, 3, 'teoria', 1),
('Marketing Estratégico', 'ADM301', 'Administración', '2025-1', 2025, 3, 'teoria', 1),
('Finanzas Corporativas', 'FIN401', 'Administración', '2025-1', 2025, 4, 'teoria', 1);

-- PASO 7: Asignaciones docente-asignatura
INSERT INTO docentes_asignaturas (docente_id, asignatura_id, ciclo_id, asignado_por) VALUES
(2, 1, 1, 1),
(2, 3, 1, 1),
(4, 2, 1, 1),
(4, 6, 1, 1),
(5, 4, 1, 1),
(5, 8, 1, 1),
(6, 5, 1, 1),
(6, 7, 1, 1),
(7, 1, 1, 1),
(7, 9, 1, 1),
(7, 10, 1, 1),
(8, 2, 1, 1),
(8, 11, 1, 1),
(8, 12, 1, 1),
(9, 13, 1, 1),
(9, 16, 1, 1),
(9, 14, 1, 1),
(10, 3, 1, 1),
(10, 5, 1, 1),
(10, 17, 1, 1),
(10, 18, 1, 1);

-- PASO 8: Asignaciones verificador-docente
INSERT INTO verificadores_docentes (verificador_id, docente_id, ciclo_id, asignado_por) VALUES
(3, 4, 1, 1),
(3, 5, 1, 1),
(3, 6, 1, 1),
(2, 7, 1, 1),
(2, 8, 1, 1),
(9, 2, 1, 1),
(9, 10, 1, 1),
(10, 4, 1, 1),
(10, 9, 1, 1);

-- PASO 9: Notificaciones
INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, prioridad, enlace) VALUES
(1, 'sistema', 'Sistema Inicializado', 'El sistema de portafolio docente ha sido configurado correctamente.', 'alta', '/admin/dashboard'),
(2, 'sistema', 'Bienvenido al Sistema', 'Su cuenta ha sido activada con roles de Docente y Verificador.', 'media', '/dashboard'),
(4, 'documento', 'Portafolio Pendiente', 'Debe completar la estructura de su portafolio para el semestre 2025-1.', 'alta', '/upload'),
(5, 'documento', 'Documentos Requeridos', 'Faltan documentos por subir en sus asignaturas asignadas.', 'media', '/upload'),
(6, 'sistema', 'Nuevas Asignaciones', 'Se le han asignado nuevas materias para el semestre actual.', 'media', '/dashboard'),
(7, 'documento', 'Revisar Sílabos', 'Debe subir los sílabos de sus asignaturas antes del 15 de marzo.', 'alta', '/upload'),
(8, 'sistema', 'Activación Completa', 'Su cuenta ha sido activada. Complete su perfil docente.', 'media', '/dashboard'),
(3, 'ciclo', 'Nuevo Ciclo Académico', 'Se ha iniciado el ciclo académico 2025-I.', 'alta', '/review'),
(9, 'asignacion', 'Nueva Asignación', 'Se le han asignado nuevos docentes para verificar.', 'alta', '/review'),
(10, 'sistema', 'Múltiples Roles', 'Tiene acceso como Docente, Verificador y Administrador.', 'media', '/dashboard');

-- PASO 10: Tipos de carga Excel (FALTABA ESTO)
INSERT INTO tipos_carga_excel (nombre, descripcion, columnas_requeridas, validaciones) VALUES
('carga_academica', 'Carga de docentes y asignaturas', 
 '["CÓDIGO","CARRERA","CURSO","CRÉDITOS","TIPO","DOCENTE"]',
 '{"CRÉDITOS":{"tipo":"numero","min":1,"max":8},"TIPO":{"valores":["T","P","L"]}}'),
('carga_verificadores', 'Asignación de verificadores a docentes',
 '["VERIFICADOR","CORREO_VERIFICADOR","DOCENTE","CORREO_DOCENTE"]',
 '{"CORREO_VERIFICADOR":{"formato":"email","dominio":"unsaac.edu.pe"},"CORREO_DOCENTE":{"formato":"email","dominio":"unsaac.edu.pe"}}'),
('carga_roles', 'Asignación múltiple de roles',
 '["USUARIO","CORREO","ROLES"]',
 '{"CORREO":{"formato":"email","dominio":"unsaac.edu.pe"},"ROLES":{"valores":["docente","verificador","administrador"]}}');

-- PASO 11: Configuraciones adicionales
INSERT INTO configuraciones (clave, valor, tipo, descripcion, categoria) VALUES
('portafolio_auto_crear', 'true', 'boolean', 'Crear estructura de portafolio automáticamente', 'portafolios'),
('portafolio_backup_dias', '30', 'number', 'Días para mantener backup de portafolios', 'portafolios'),
('verificacion_tiempo_limite', '7', 'number', 'Días límite para verificar documentos', 'verificacion'),
('documentos_version_max', '5', 'number', 'Máximo número de versiones por documento', 'archivos'),
('notif_documento_aprobado', 'true', 'boolean', 'Enviar notificación cuando documento es aprobado', 'notificaciones'),
('notif_documento_rechazado', 'true', 'boolean', 'Enviar notificación cuando documento es rechazado', 'notificaciones'),
('notif_asignacion_verificador', 'true', 'boolean', 'Notificar asignaciones a verificadores', 'notificaciones'),
('ciclo_cierre_automatico', 'false', 'boolean', 'Cerrar ciclo automáticamente en fecha fin', 'ciclos'),
('ciclo_notificar_vencimiento', 'true', 'boolean', 'Notificar 30 días antes del cierre', 'ciclos'),
('rol_cambio_libre', 'true', 'boolean', 'Permitir cambio libre entre roles asignados', 'roles'),
('rol_admin_ver_todo', 'true', 'boolean', 'Administradores pueden ver todos los portafolios', 'roles');

-- PASO 12: Cargas académicas de ejemplo
INSERT INTO cargas_academicas (ciclo_id, tipo_carga_id, nombre_archivo, ruta_archivo, estado, total_registros, registros_procesados, registros_fallidos, subido_por) VALUES
(1, 1, 'carga_academica_2025_1.xlsx', '/uploads/cargas/carga_academica_2025_1.xlsx', 'completado', 18, 18, 0, 1),
(1, 2, 'verificadores_2025_1.xlsx', '/uploads/cargas/verificadores_2025_1.xlsx', 'completado', 10, 10, 0, 1);

-- PASO 13: Acciones de administrador
INSERT INTO acciones_admin (admin_id, accion, modulo, descripcion, datos_nuevos) VALUES
(1, 'crear', 'ciclos', 'Creación del ciclo académico 2025-I', '{"nombre":"2025-I","estado":"preparacion"}'),
(1, 'cargar_excel', 'usuarios', 'Carga inicial de docentes desde Excel', '{"archivo":"carga_academica_2025_1.xlsx","registros":18}'),
(1, 'asignar', 'verificaciones', 'Asignación inicial de verificadores a docentes', '{"total_asignaciones":10}'),
(3, 'asignar', 'usuarios', 'Asignación de rol administrador a Lisha Díaz', '{"usuario_id":3,"rol":"administrador"}'),
(1, 'activar', 'sistema', 'Activación del módulo de carga de datos', '{"modulo":"carga_datos","estado":"habilitado"}');

-- Mensaje final
SELECT '✅ DATOS INSERTADOS CORRECTAMENTE' as resultado;