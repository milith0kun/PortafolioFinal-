/**
 * 🔄 CONTROLADOR DE CAMBIO DE ROL ACTIVO
 * 
 * Permite a usuarios con múltiples roles cambiar su rol activo:
 * - Listar roles disponibles del usuario
 * - Cambiar rol activo en la sesión
 * - Actualizar permisos después del cambio
 * - Registrar cambios de rol
 * - Validar disponibilidad del rol
 * 
 * Rutas que maneja:
 * GET /api/v1/roles/mis-roles - Obtener mis roles
 * PUT /api/v1/roles/cambiar-activo - Cambiar rol activo
 */

// TODO: Listar todos los roles asignados al usuario actual
// TODO: Cambiar rol activo y regenerar token JWT
// TODO: Actualizar permisos en la sesión
// TODO: Registrar cambio en log de actividad
/**
 * 🔄 CONTROLADOR CAMBIO ROLES - Sistema Portafolio Docente UNSAAC
 * Cambio dinámico de roles para usuarios multi-rol
 */

const jwt = require('jsonwebtoken');
const { ejecutarConsulta } = require('../../base_datos/conexiones/mysql.conexion');

const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_secreta_temporal';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '2h';

/**
 * 📋 Obtener roles disponibles del usuario
 */
async function obtenerRolesDisponibles(req, res) {
    try {
        const rolesDisponibles = await ejecutarConsulta(
            `SELECT 
                ur.rol, ur.fecha_asignacion, ur.observaciones,
                CONCAT(ua.nombres, ' ', ua.apellidos) as asignado_por_nombre
             FROM usuarios_roles ur
             LEFT JOIN usuarios ua ON ur.asignado_por = ua.id
             WHERE ur.usuario_id = ? AND ur.activo = 1
             ORDER BY ur.fecha_asignacion ASC`,
            [req.usuario.id]
        );

        // Agregar información adicional sobre cada rol
        const rolesConInfo = rolesDisponibles.map(rol => ({
            ...rol,
            descripcion: obtenerDescripcionRol(rol.rol),
            permisos: obtenerPermisosRol(rol.rol)
        }));

        res.json({
            success: true,
            roles_disponibles: rolesConInfo,
            total_roles: rolesDisponibles.length,
            es_multi_rol: rolesDisponibles.length > 1
        });

    } catch (error) {
        console.error('❌ Error al obtener roles disponibles:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * 🔄 Cambiar rol activo
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

        // Verificar que el usuario tiene ese rol asignado y activo
        const rolValido = await ejecutarConsulta(
            'SELECT rol FROM usuarios_roles WHERE usuario_id = ? AND rol = ? AND activo = 1',
            [req.usuario.id, rol]
        );

        if (rolValido.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No tienes asignado este rol o está inactivo'
            });
        }

        // Obtener información completa del usuario
        const usuarios = await ejecutarConsulta(
            `SELECT 
                u.id, u.nombres, u.apellidos, u.correo,
                GROUP_CONCAT(ur.rol) as todos_los_roles
             FROM usuarios u
             LEFT JOIN usuarios_roles ur ON u.id = ur.usuario_id AND ur.activo = 1
             WHERE u.id = ?
             GROUP BY u.id`,
            [req.usuario.id]
        );

        const usuario = usuarios[0];
        const todosLosRoles = usuario.todos_los_roles ? usuario.todos_los_roles.split(',') : [];

        // Generar nuevo token con el rol activo especificado
        const nuevoToken = jwt.sign(
            { 
                id: usuario.id, 
                correo: usuario.correo,
                roles: todosLosRoles,
                rol_activo: rol // Rol específico que está usando ahora
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRE }
        );

        // Registrar el cambio de rol
        await registrarCambioRol(req.usuario.id, rol);

        res.json({
            success: true,
            message: `Rol cambiado a '${rol}' exitosamente`,
            nuevo_token: nuevoToken,
            rol_activo: rol,
            todos_los_roles: todosLosRoles,
            descripcion_rol: obtenerDescripcionRol(rol),
            permisos: obtenerPermisosRol(rol)
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
 * 📊 Obtener contexto del rol actual
 */
async function obtenerContextoRol(req, res) {
    try {
        const rolActual = req.usuario.rol_activo || req.usuario.roles[0];
        
        const contexto = {
            rol_actual: rolActual,
            descripcion: obtenerDescripcionRol(rolActual),
            permisos: obtenerPermisosRol(rolActual),
            todos_los_roles: req.usuario.roles
        };

        // Obtener información específica según el rol
        if (rolActual === 'docente') {
            // Información de docente
            const infoDocente = await ejecutarConsulta(
                `SELECT 
                    COUNT(DISTINCT da.asignatura_id) as total_asignaturas,
                    COUNT(DISTINCT p.id) as total_portafolios,
                    AVG(p.progreso_completado) as progreso_promedio
                 FROM docentes_asignaturas da
                 LEFT JOIN portafolios p ON da.docente_id = p.docente_id
                 WHERE da.docente_id = ? AND da.activo = 1`,
                [req.usuario.id]
            );

            contexto.informacion_especifica = {
                asignaturas: infoDocente[0].total_asignaturas || 0,
                portafolios: infoDocente[0].total_portafolios || 0,
                progreso_promedio: parseFloat(infoDocente[0].progreso_promedio) || 0
            };

        } else if (rolActual === 'verificador') {
            // Información de verificador
            const infoVerificador = await ejecutarConsulta(
                `SELECT 
                    COUNT(DISTINCT vd.docente_id) as docentes_asignados,
                    COUNT(DISTINCT a.id) as documentos_pendientes
                 FROM verificadores_docentes vd
                 LEFT JOIN portafolios p ON vd.docente_id = p.docente_id
                 LEFT JOIN archivos_subidos a ON p.id = a.portafolio_id AND a.estado = 'pendiente'
                 WHERE vd.verificador_id = ? AND vd.activo = 1`,
                [req.usuario.id]
            );

            contexto.informacion_especifica = {
                docentes_asignados: infoVerificador[0].docentes_asignados || 0,
                documentos_pendientes: infoVerificador[0].documentos_pendientes || 0
            };

        } else if (rolActual === 'administrador') {
            // Información de administrador
            const infoAdmin = await ejecutarConsulta(`
                SELECT 
                    (SELECT COUNT(*) FROM usuarios WHERE activo = 1) as total_usuarios,
                    (SELECT COUNT(*) FROM ciclos_academicos WHERE estado = 'activo') as ciclos_activos,
                    (SELECT COUNT(*) FROM asignaturas WHERE activo = 1) as total_asignaturas
            `);

            contexto.informacion_especifica = {
                usuarios_activos: infoAdmin[0].total_usuarios || 0,
                ciclos_activos: infoAdmin[0].ciclos_activos || 0,
                asignaturas_activas: infoAdmin[0].total_asignaturas || 0
            };
        }

        res.json({
            success: true,
            contexto
        });

    } catch (error) {
        console.error('❌ Error al obtener contexto:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * 📈 Historial de cambios de rol
 */
async function obtenerHistorialCambios(req, res) {
    try {
        // En una implementación completa, tendrías una tabla de historial de cambios
        // Por ahora simularemos algunos datos
        const historial = [
            {
                fecha: new Date().toISOString(),
                rol_anterior: 'docente',
                rol_nuevo: req.usuario.rol_activo || req.usuario.roles[0],
                motivo: 'Cambio manual de usuario'
            }
        ];

        res.json({
            success: true,
            historial,
            total_cambios: historial.length
        });

    } catch (error) {
        console.error('❌ Error al obtener historial:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * 🔍 Verificar permisos específicos
 */
async function verificarPermisos(req, res) {
    try {
        const { permiso } = req.query;

        if (!permiso) {
            return res.status(400).json({
                success: false,
                message: 'El permiso a verificar es obligatorio'
            });
        }

        const rolActual = req.usuario.rol_activo || req.usuario.roles[0];
        const permisosRol = obtenerPermisosRol(rolActual);
        
        const tienePermiso = permisosRol.includes(permiso);

        res.json({
            success: true,
            tiene_permiso: tienePermiso,
            rol_actual: rolActual,
            permiso_consultado: permiso,
            todos_los_permisos: permisosRol
        });

    } catch (error) {
        console.error('❌ Error al verificar permisos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * 📝 Funciones auxiliares
 */

function obtenerDescripcionRol(rol) {
    const descripciones = {
        'docente': 'Gestiona sus portafolios académicos y documentos',
        'verificador': 'Revisa y aprueba documentos de docentes asignados',
        'administrador': 'Control total del sistema y gestión de usuarios'
    };
    return descripciones[rol] || 'Rol del sistema';
}

function obtenerPermisosRol(rol) {
    const permisos = {
        'docente': [
            'portafolios.ver_propios',
            'portafolios.gestionar_propios',
            'documentos.subir',
            'documentos.editar_propios',
            'observaciones.responder',
            'notificaciones.ver_propias'
        ],
        'verificador': [
            'portafolios.ver_asignados',
            'documentos.revisar',
            'documentos.aprobar',
            'documentos.rechazar',
            'observaciones.crear',
            'observaciones.gestionar',
            'reportes.verificacion'
        ],
        'administrador': [
            'usuarios.gestionar',
            'ciclos.gestionar',
            'asignaturas.gestionar',
            'portafolios.ver_todos',
            'verificadores.asignar',
            'excel.cargar',
            'reportes.todos',
            'sistema.configurar'
        ]
    };
    return permisos[rol] || [];
}

async function registrarCambioRol(usuarioId, nuevoRol) {
    try {
        // En una implementación completa, registrarías esto en una tabla de auditoría
        console.log(`📝 Cambio de rol registrado: Usuario ${usuarioId} cambió a rol ${nuevoRol}`);
    } catch (error) {
        console.error('Error al registrar cambio de rol:', error);
    }
}

module.exports = {
    obtenerRolesDisponibles,
    cambiarRolActivo,
    obtenerContextoRol,
    obtenerHistorialCambios,
    verificarPermisos
};