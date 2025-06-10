/**
 * 🏷️ CONTROLADOR DE PERFILES DE USUARIO
 * 
 * Gestiona los perfiles personales de los usuarios:
 * - Obtener perfil propio del usuario
 * - Actualizar información personal
 * - Cambiar contraseña personal
 * - Subir foto de perfil
 * - Configurar preferencias personales
 * 
 * Rutas que maneja:
 * GET /api/v1/usuarios/mi-perfil - Obtener mi perfil
 * PUT /api/v1/usuarios/mi-perfil - Actualizar mi perfil
 * PUT /api/v1/usuarios/cambiar-password - Cambiar contraseña
 * POST /api/v1/usuarios/foto-perfil - Subir foto
 */

// TODO: Permitir que usuarios actualicen su propia información
// TODO: Validar contraseña actual antes de cambiarla
// TODO: Subida y redimensionamiento de fotos de perfil
// TODO: Configuraciones de notificaciones personales
/**
 * 👤 CONTROLADOR PERFILES USUARIOS - Sistema Portafolio Docente UNSAAC
 * Gestión de perfiles personales y información adicional
 */

const { ejecutarConsulta } = require('../../base_datos/conexiones/mysql.conexion');

/**
 * 👤 Obtener mi perfil completo
 */
async function obtenerMiPerfil(req, res) {
    try {
        const usuarios = await ejecutarConsulta(
            `SELECT 
                u.id, u.nombres, u.apellidos, u.correo, u.telefono, 
                u.avatar, u.activo, u.ultimo_acceso, u.creado_en,
                CONCAT(u.nombres, ' ', u.apellidos) as nombre_completo,
                GROUP_CONCAT(ur.rol) as roles
             FROM usuarios u
             LEFT JOIN usuarios_roles ur ON u.id = ur.usuario_id AND ur.activo = 1
             WHERE u.id = ?
             GROUP BY u.id`,
            [req.usuario.id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const usuario = usuarios[0];
        const roles = usuario.roles ? usuario.roles.split(',') : [];

        // Obtener información específica según los roles
        const informacionAdicional = {};

        // Si es docente, obtener sus asignaturas
        if (roles.includes('docente')) {
            const asignaturas = await ejecutarConsulta(
                `SELECT 
                    a.id, a.nombre, a.codigo, a.carrera, a.semestre,
                    ca.nombre as ciclo_nombre
                 FROM docentes_asignaturas da
                 JOIN asignaturas a ON da.asignatura_id = a.id
                 JOIN ciclos_academicos ca ON da.ciclo_id = ca.id
                 WHERE da.docente_id = ? AND da.activo = 1
                 ORDER BY ca.anio_actual DESC, ca.semestre_actual DESC`,
                [req.usuario.id]
            );

            informacionAdicional.asignaturas = asignaturas;

            // Obtener estadísticas de portafolios
            const estadisticasPortafolios = await ejecutarConsulta(
                `SELECT 
                    COUNT(*) as total_portafolios,
                    AVG(progreso_completado) as progreso_promedio,
                    SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END) as portafolios_activos
                 FROM portafolios 
                 WHERE docente_id = ?`,
                [req.usuario.id]
            );

            informacionAdicional.estadisticas_portafolios = estadisticasPortafolios[0];
        }

        // Si es verificador, obtener docentes asignados
        if (roles.includes('verificador')) {
            const docentesAsignados = await ejecutarConsulta(
                `SELECT 
                    u.id, u.nombres, u.apellidos, u.correo,
                    ca.nombre as ciclo_nombre,
                    vd.fecha_asignacion
                 FROM verificadores_docentes vd
                 JOIN usuarios u ON vd.docente_id = u.id
                 JOIN ciclos_academicos ca ON vd.ciclo_id = ca.id
                 WHERE vd.verificador_id = ? AND vd.activo = 1
                 ORDER BY vd.fecha_asignacion DESC`,
                [req.usuario.id]
            );

            informacionAdicional.docentes_asignados = docentesAsignados;

            // Obtener documentos pendientes de verificación
            const documentosPendientes = await ejecutarConsulta(
                `SELECT COUNT(*) as documentos_pendientes
                 FROM archivos_subidos a
                 JOIN portafolios p ON a.portafolio_id = p.id
                 JOIN verificadores_docentes vd ON p.docente_id = vd.docente_id
                 WHERE vd.verificador_id = ? AND a.estado = 'pendiente' AND vd.activo = 1`,
                [req.usuario.id]
            );

            informacionAdicional.documentos_pendientes = documentosPendientes[0].documentos_pendientes;
        }

        res.json({
            success: true,
            perfil: {
                ...usuario,
                roles,
                informacion_adicional: informacionAdicional
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * ✏️ Actualizar mi perfil
 */
async function actualizarMiPerfil(req, res) {
    try {
        const { nombres, apellidos, telefono } = req.body;

        // Validar datos básicos
        if (!nombres || !apellidos) {
            return res.status(400).json({
                success: false,
                message: 'Nombres y apellidos son obligatorios'
            });
        }

        // Actualizar perfil
        await ejecutarConsulta(
            'UPDATE usuarios SET nombres = ?, apellidos = ?, telefono = ? WHERE id = ?',
            [nombres, apellidos, telefono, req.usuario.id]
        );

        // Obtener datos actualizados
        const usuarios = await ejecutarConsulta(
            `SELECT 
                u.id, u.nombres, u.apellidos, u.correo, u.telefono, 
                u.avatar, u.ultimo_acceso,
                CONCAT(u.nombres, ' ', u.apellidos) as nombre_completo,
                GROUP_CONCAT(ur.rol) as roles
             FROM usuarios u
             LEFT JOIN usuarios_roles ur ON u.id = ur.usuario_id AND ur.activo = 1
             WHERE u.id = ?
             GROUP BY u.id`,
            [req.usuario.id]
        );

        const usuarioActualizado = usuarios[0];

        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            perfil: {
                ...usuarioActualizado,
                roles: usuarioActualizado.roles ? usuarioActualizado.roles.split(',') : []
            }
        });

    } catch (error) {
        console.error('❌ Error al actualizar perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * 📊 Obtener resumen de actividad
 */
async function obtenerResumenActividad(req, res) {
    try {
        const resumen = {
            usuario_id: req.usuario.id,
            fecha_consulta: new Date().toISOString()
        };

        // Obtener roles del usuario
        const roles = await ejecutarConsulta(
            'SELECT rol FROM usuarios_roles WHERE usuario_id = ? AND activo = 1',
            [req.usuario.id]
        );

        const rolesUsuario = roles.map(r => r.rol);

        // Si es docente
        if (rolesUsuario.includes('docente')) {
            // Documentos subidos recientemente
            const documentosRecientes = await ejecutarConsulta(
                `SELECT COUNT(*) as documentos_recientes
                 FROM archivos_subidos a
                 JOIN portafolios p ON a.portafolio_id = p.id
                 WHERE p.docente_id = ? AND a.fecha_subida >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
                [req.usuario.id]
            );

            resumen.documentos_subidos_semana = documentosRecientes[0].documentos_recientes;

            // Observaciones pendientes de respuesta
            const observacionesPendientes = await ejecutarConsulta(
                `SELECT COUNT(*) as observaciones_pendientes
                 FROM observaciones o
                 JOIN archivos_subidos a ON o.archivo_id = a.id
                 JOIN portafolios p ON a.portafolio_id = p.id
                 WHERE p.docente_id = ? AND o.requiere_respuesta = 1 AND o.respondida = 0`,
                [req.usuario.id]
            );

            resumen.observaciones_pendientes = observacionesPendientes[0].observaciones_pendientes;
        }

        // Si es verificador
        if (rolesUsuario.includes('verificador')) {
            // Documentos verificados esta semana
            const documentosVerificados = await ejecutarConsulta(
                `SELECT COUNT(*) as documentos_verificados
                 FROM archivos_subidos a
                 JOIN portafolios p ON a.portafolio_id = p.id
                 JOIN verificadores_docentes vd ON p.docente_id = vd.docente_id
                 WHERE vd.verificador_id = ? AND a.verificado_por = ? 
                 AND a.fecha_verificacion >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                 AND vd.activo = 1`,
                [req.usuario.id, req.usuario.id]
            );

            resumen.documentos_verificados_semana = documentosVerificados[0].documentos_verificados;

            // Observaciones creadas esta semana
            const observacionesCreadas = await ejecutarConsulta(
                `SELECT COUNT(*) as observaciones_creadas
                 FROM observaciones
                 WHERE verificador_id = ? AND creado_en >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
                [req.usuario.id]
            );

            resumen.observaciones_creadas_semana = observacionesCreadas[0].observaciones_creadas;
        }

        // Notificaciones no leídas
        const notificaciones = await ejecutarConsulta(
            'SELECT COUNT(*) as no_leidas FROM notificaciones WHERE usuario_id = ? AND visto = 0',
            [req.usuario.id]
        );

        resumen.notificaciones_no_leidas = notificaciones[0].no_leidas;

        res.json({
            success: true,
            resumen
        });

    } catch (error) {
        console.error('❌ Error al obtener resumen:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * 🔔 Obtener configuración de notificaciones
 */
async function obtenerConfiguracionNotificaciones(req, res) {
    try {
        // En una implementación completa, tendrías una tabla de configuraciones de usuario
        // Por ahora retornamos configuración por defecto
        const configuracion = {
            email_documentos_aprobados: true,
            email_documentos_rechazados: true,
            email_nuevas_observaciones: true,
            email_respuestas_observaciones: true,
            email_asignaciones: true,
            notificaciones_sistema: true,
            notificaciones_push: false
        };

        res.json({
            success: true,
            configuracion
        });

    } catch (error) {
        console.error('❌ Error al obtener configuración:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * ⚙️ Actualizar configuración de notificaciones
 */
async function actualizarConfiguracionNotificaciones(req, res) {
    try {
        const configuracion = req.body;

        // En una implementación completa, guardarías esto en una tabla
        // Por ahora solo confirmamos la actualización
        
        res.json({
            success: true,
            message: 'Configuración de notificaciones actualizada',
            configuracion
        });

    } catch (error) {
        console.error('❌ Error al actualizar configuración:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

module.exports = {
    obtenerMiPerfil,
    actualizarMiPerfil,
    obtenerResumenActividad,
    obtenerConfiguracionNotificaciones,
    actualizarConfiguracionNotificaciones
};