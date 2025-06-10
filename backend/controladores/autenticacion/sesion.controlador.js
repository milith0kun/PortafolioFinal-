/**
 * 👤 CONTROLADOR DE GESTIÓN DE SESIONES
 * 
 * Maneja la información de la sesión actual del usuario:
 * - Obtener datos del usuario autenticado
 * - Gestionar cambio de rol activo
 * - Verificar permisos del usuario
 * - Actualizar última actividad
 * - Gestionar sesiones múltiples
 * 
 * Rutas que maneja:
 * GET /api/v1/auth/me - Obtener usuario actual
 * PUT /api/v1/auth/change-role - Cambiar rol activo
 * GET /api/v1/auth/permissions - Obtener permisos actuales
 */

// TODO: Obtener información completa del usuario autenticado
// TODO: Permitir cambio de rol cuando usuario tiene múltiples roles
// TODO: Devolver permisos específicos del rol activo
// TODO: Actualizar timestamp de última actividad
/**
 * 👤 CONTROLADOR SESIÓN - Sistema Portafolio Docente UNSAAC
 * Maneja información de sesión actual y perfil del usuario
 */

const { ejecutarConsulta } = require('../../base_datos/conexiones/mysql.conexion');

/**
 * 👤 Obtener perfil del usuario actual
 */
async function obtenerPerfil(req, res) {
    try {
        const usuarios = await ejecutarConsulta(
            `SELECT 
                u.id, u.nombres, u.apellidos, u.correo, u.telefono, 
                u.avatar, u.activo, u.ultimo_acceso, u.creado_en,
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

        res.json({
            success: true,
            usuario: {
                ...usuario,
                roles: usuario.roles ? usuario.roles.split(',') : []
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
 * ✏️ Actualizar perfil del usuario actual
 */
async function actualizarPerfil(req, res) {
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
                u.avatar, u.activo, u.ultimo_acceso,
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
            usuario: {
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
 * 📊 Obtener estadísticas de sesión
 */
async function obtenerEstadisticasSesion(req, res) {
    try {
        // Obtener información de la sesión actual
        const estadisticas = {
            usuario_id: req.usuario.id,
            tiempo_sesion: new Date() - new Date(req.usuario.ultimo_acceso || new Date()),
            roles_activos: req.usuario.roles || [],
            permisos: [] // TODO: Implementar sistema de permisos
        };

        // Obtener conteo de notificaciones no leídas
        const notificaciones = await ejecutarConsulta(
            'SELECT COUNT(*) as no_leidas FROM notificaciones WHERE usuario_id = ? AND visto = 0',
            [req.usuario.id]
        );

        estadisticas.notificaciones_no_leidas = notificaciones[0].no_leidas;

        // Si es docente, obtener estadísticas de portafolios
        if (req.usuario.roles.includes('docente')) {
            const portafolios = await ejecutarConsulta(
                `SELECT 
                    COUNT(*) as total_portafolios,
                    AVG(progreso_completado) as progreso_promedio
                 FROM portafolios 
                 WHERE docente_id = ? AND estado = 'activo'`,
                [req.usuario.id]
            );

            estadisticas.portafolios = portafolios[0];
        }

        // Si es verificador, obtener documentos pendientes
        if (req.usuario.roles.includes('verificador')) {
            const documentos = await ejecutarConsulta(
                `SELECT COUNT(*) as documentos_pendientes
                 FROM archivos_subidos a
                 JOIN portafolios p ON a.portafolio_id = p.id
                 JOIN verificadores_docentes vd ON p.docente_id = vd.docente_id
                 WHERE vd.verificador_id = ? AND a.estado = 'pendiente' AND vd.activo = 1`,
                [req.usuario.id]
            );

            estadisticas.documentos_pendientes = documentos[0].documentos_pendientes;
        }

        res.json({
            success: true,
            estadisticas
        });

    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * 🔄 Cambiar rol activo (para usuarios multi-rol)
 */
async function cambiarRolActivo(req, res) {
    try {
        const { rol } = req.body;

        if (!rol) {
            return res.status(400).json({
                success: false,
                message: 'El rol es obligatorio'
            });
        }

        // Verificar que el usuario tiene ese rol
        const rolesUsuario = await ejecutarConsulta(
            'SELECT rol FROM usuarios_roles WHERE usuario_id = ? AND rol = ? AND activo = 1',
            [req.usuario.id, rol]
        );

        if (rolesUsuario.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No tienes asignado ese rol'
            });
        }

        // En una implementación completa, aquí actualizarías el token
        // Por ahora solo confirmamos el cambio
        res.json({
            success: true,
            message: `Rol cambiado a ${rol} exitosamente`,
            rol_activo: rol
        });

    } catch (error) {
        console.error('❌ Error al cambiar rol:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * 📋 Obtener historial de accesos
 */
async function obtenerHistorialAccesos(req, res) {
    try {
        // En una implementación completa, tendrías una tabla de historial de accesos
        // Por ahora solo retornamos el último acceso
        const accesos = await ejecutarConsulta(
            'SELECT ultimo_acceso, creado_en FROM usuarios WHERE id = ?',
            [req.usuario.id]
        );

        res.json({
            success: true,
            historial: {
                ultimo_acceso: accesos[0].ultimo_acceso,
                fecha_registro: accesos[0].creado_en,
                total_accesos: 1 // TODO: Implementar contador real
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener historial:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

module.exports = {
    obtenerPerfil,
    actualizarPerfil,
    obtenerEstadisticasSesion,
    cambiarRolActivo,
    obtenerHistorialAccesos
};