/**
 * 🎭 CONTROLADOR DE ASIGNACIÓN DE ROLES
 * 
 * Gestiona la asignación y revocación de roles:
 * - Asignar roles a usuarios
 * - Revocar roles específicos
 * - Listar usuarios por rol
 * - Validar permisos para asignación
 * - Historial de cambios de roles
 * 
 * Rutas que maneja:
 * POST /api/v1/roles/asignar - Asignar rol a usuario
 * DELETE /api/v1/roles/revocar - Revocar rol de usuario
 * GET /api/v1/roles/:rol/usuarios - Usuarios con rol específico
 */

// TODO: Validar que solo administradores puedan asignar roles
// TODO: Evitar auto-asignación de roles de administrador
// TODO: Registrar cambios en log de auditoría
// TODO: Notificar al usuario sobre cambios de rol


/**
 * 🎭 MODELO ROL - Sistema Portafolio Docente UNSAAC
 * 
 * Modelo para gestionar roles del sistema basado en usuarios_roles
 * con soporte multi-rol y validaciones de seguridad.
 * 
 * @author Sistema Portafolio Docente UNSAAC
 * @version 1.0.0
 */

const { 
    ejecutarLectura, 
    ejecutarEscritura, 
    ejecutarTransaccionCompleja 
} = require('../../base_datos/conexiones/pool.conexion');

/**
 * 🏗️ Clase modelo Rol
 */
class RolModelo {
    constructor() {
        this.tablaUsuarios = 'usuarios';
        this.tablaUsuarioRoles = 'usuarios_roles';
        this.rolesDisponibles = ['docente', 'verificador', 'administrador'];
        this.jerarquiaRoles = {
            'administrador': 3,
            'verificador': 2,
            'docente': 1
        };
    }

    /**
     * 📋 Obtener todos los roles disponibles del sistema
     */
    async obtenerRolesDisponibles() {
        try {
            const roles = this.rolesDisponibles.map((rol, index) => ({
                id: index + 1,
                nombre: rol,
                descripcion: this.obtenerDescripcionRol(rol),
                permisos: this.obtenerPermisosRol(rol),
                jerarquia: this.jerarquiaRoles[rol],
                icono: this.obtenerIconoRol(rol),
                color: this.obtenerColorRol(rol)
            }));

            return roles;

        } catch (error) {
            console.error('❌ Error al obtener roles disponibles:', error);
            throw error;
        }
    }

    /**
     * 📝 Obtener descripción de rol
     */
    obtenerDescripcionRol(rol) {
        const descripciones = {
            'docente': 'Gestiona sus portafolios académicos y documentos',
            'verificador': 'Revisa y aprueba documentos de docentes asignados',
            'administrador': 'Control total del sistema y gestión de usuarios'
        };
        return descripciones[rol] || 'Rol del sistema';
    }

    /**
     * 🎨 Obtener icono de rol
     */
    obtenerIconoRol(rol) {
        const iconos = {
            'docente': 'user-graduate',
            'verificador': 'user-check',
            'administrador': 'user-shield'
        };
        return iconos[rol] || 'user';
    }

    /**
     * 🌈 Obtener color de rol
     */
    obtenerColorRol(rol) {
        const colores = {
            'docente': '#3b82f6',
            'verificador': '#10b981',
            'administrador': '#ef4444'
        };
        return colores[rol] || '#6b7280';
    }

    /**
     * 🔑 Obtener permisos por rol
     */
    obtenerPermisosRol(rol) {
        const permisos = {
            'docente': [
                'portafolios.ver_propios',
                'portafolios.gestionar_propios',
                'documentos.subir',
                'documentos.editar_propios',
                'documentos.eliminar_propios',
                'observaciones.responder',
                'observaciones.ver_propias',
                'notificaciones.ver_propias',
                'perfil.editar_propio'
            ],
            'verificador': [
                'portafolios.ver_asignados',
                'documentos.revisar',
                'documentos.aprobar',
                'documentos.rechazar',
                'observaciones.crear',
                'observaciones.gestionar',
                'observaciones.ver_asignadas',
                'docentes.ver_asignados',
                'reportes.verificacion',
                'notificaciones.ver_propias',
                'perfil.editar_propio'
            ],
            'administrador': [
                'usuarios.gestionar',
                'usuarios.crear',
                'usuarios.editar',
                'usuarios.eliminar',
                'roles.asignar',
                'roles.revocar',
                'ciclos.gestionar',
                'asignaturas.gestionar',
                'portafolios.ver_todos',
                'portafolios.gestionar_todos',
                'verificadores.asignar',
                'excel.cargar',
                'reportes.todos',
                'sistema.configurar',
                'auditoria.ver',
                'notificaciones.gestionar_todas'
            ]
        };
        return permisos[rol] || [];
    }

    /**
     * 👤 Obtener roles de un usuario
     */
    async obtenerRolesUsuario(usuarioId) {
        try {
            const sql = `
                SELECT 
                    ur.id,
                    ur.rol,
                    ur.activo,
                    ur.fecha_asignacion,
                    ur.fecha_revocacion,
                    ur.observaciones,
                    CONCAT(ua.nombres, ' ', ua.apellidos) as asignado_por_nombre,
                    ua.correo as asignado_por_correo
                FROM ${this.tablaUsuarioRoles} ur
                LEFT JOIN ${this.tablaUsuarios} ua ON ur.asignado_por = ua.id
                WHERE ur.usuario_id = ?
                ORDER BY ur.fecha_asignacion DESC
            `;

            const { resultado } = await ejecutarLectura(sql, [usuarioId]);

            return resultado.map(rol => ({
                ...rol,
                descripcion: this.obtenerDescripcionRol(rol.rol),
                permisos: this.obtenerPermisosRol(rol.rol),
                jerarquia: this.jerarquiaRoles[rol.rol],
                icono: this.obtenerIconoRol(rol.rol),
                color: this.obtenerColorRol(rol.rol)
            }));

        } catch (error) {
            console.error('❌ Error al obtener roles del usuario:', error);
            throw error;
        }
    }

    /**
     * ✅ Obtener roles activos de un usuario
     */
    async obtenerRolesActivosUsuario(usuarioId) {
        try {
            const sql = `
                SELECT 
                    ur.id,
                    ur.rol,
                    ur.fecha_asignacion,
                    ur.observaciones
                FROM ${this.tablaUsuarioRoles} ur
                WHERE ur.usuario_id = ? AND ur.activo = 1
                ORDER BY ur.fecha_asignacion ASC
            `;

            const { resultado } = await ejecutarLectura(sql, [usuarioId]);

            return resultado.map(rol => ({
                ...rol,
                descripcion: this.obtenerDescripcionRol(rol.rol),
                permisos: this.obtenerPermisosRol(rol.rol),
                jerarquia: this.jerarquiaRoles[rol.rol],
                icono: this.obtenerIconoRol(rol.rol),
                color: this.obtenerColorRol(rol.rol)
            }));

        } catch (error) {
            console.error('❌ Error al obtener roles activos:', error);
            throw error;
        }
    }

    /**
     * 🔝 Obtener rol con mayor jerarquía de un usuario
     */
    async obtenerRolPrincipal(usuarioId) {
        try {
            const rolesActivos = await this.obtenerRolesActivosUsuario(usuarioId);
            
            if (rolesActivos.length === 0) {
                return null;
            }

            // Buscar el rol con mayor jerarquía
            let rolPrincipal = rolesActivos[0];
            for (const rol of rolesActivos) {
                if (rol.jerarquia > rolPrincipal.jerarquia) {
                    rolPrincipal = rol;
                }
            }

            return rolPrincipal;

        } catch (error) {
            console.error('❌ Error al obtener rol principal:', error);
            throw error;
        }
    }

    /**
     * ➕ Asignar rol a usuario
     */
    async asignarRol(usuarioId, rol, asignadoPor, observaciones = null) {
        try {
            // Validar que el rol existe
            if (!this.rolesDisponibles.includes(rol)) {
                throw new Error(`Rol '${rol}' no es válido. Roles disponibles: ${this.rolesDisponibles.join(', ')}`);
            }

            // Verificar que el usuario existe y está activo
            const usuario = await this.verificarUsuarioExiste(usuarioId);
            if (!usuario) {
                throw new Error('Usuario no encontrado o inactivo');
            }

            // Verificar si ya tiene el rol activo
            const rolExistente = await this.verificarRolActivo(usuarioId, rol);
            if (rolExistente) {
                throw new Error(`El usuario ya tiene el rol '${rol}' asignado y activo`);
            }

            const sql = `
                INSERT INTO ${this.tablaUsuarioRoles} (
                    usuario_id, rol, activo, asignado_por, 
                    fecha_asignacion, observaciones
                ) VALUES (?, ?, 1, ?, NOW(), ?)
            `;

            const { resultado } = await ejecutarEscritura(sql, [
                usuarioId, rol, asignadoPor, observaciones
            ]);

            console.log(`✅ Rol '${rol}' asignado a usuario ${usuarioId} por usuario ${asignadoPor}`);

            return {
                id: resultado.insertId,
                usuario_id: usuarioId,
                rol,
                descripcion: this.obtenerDescripcionRol(rol),
                permisos: this.obtenerPermisosRol(rol),
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error al asignar rol:', error);
            throw error;
        }
    }

    /**
     * ➖ Revocar rol de usuario
     */
    async revocarRol(usuarioId, rol, revocadoPor, motivo = null) {
        try {
            // Verificar que el rol está activo
            const rolActivo = await this.verificarRolActivo(usuarioId, rol);
            if (!rolActivo) {
                throw new Error(`El usuario no tiene el rol '${rol}' activo`);
            }

            const sql = `
                UPDATE ${this.tablaUsuarioRoles} 
                SET activo = 0, fecha_revocacion = NOW(), observaciones = CONCAT(
                    COALESCE(observaciones, ''), 
                    '\nRevocado: ', NOW(), ' por usuario ', ?, 
                    CASE WHEN ? IS NOT NULL THEN CONCAT(' - Motivo: ', ?) ELSE '' END
                )
                WHERE usuario_id = ? AND rol = ? AND activo = 1
            `;

            const { resultado } = await ejecutarEscritura(sql, [
                revocadoPor, motivo, motivo, usuarioId, rol
            ]);

            if (resultado.affectedRows === 0) {
                throw new Error(`No se pudo revocar el rol '${rol}' del usuario`);
            }

            console.log(`➖ Rol '${rol}' revocado del usuario ${usuarioId} por usuario ${revocadoPor}`);

            return {
                success: true,
                mensaje: `Rol '${rol}' revocado correctamente`,
                usuario_id: usuarioId,
                rol,
                motivo,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error al revocar rol:', error);
            throw error;
        }
    }

    /**
     * 🔄 Cambiar estado de rol (activar/desactivar)
     */
    async cambiarEstadoRol(usuarioId, rol, nuevoEstado, modificadoPor, motivo = null) {
        try {
            const estadoNumerico = nuevoEstado ? 1 : 0;
            const campoFecha = nuevoEstado ? 'fecha_asignacion' : 'fecha_revocacion';

            const sql = `
                UPDATE ${this.tablaUsuarioRoles} 
                SET activo = ?, ${campoFecha} = NOW(), observaciones = CONCAT(
                    COALESCE(observaciones, ''), 
                    '\n', ?, ': ', NOW(), ' por usuario ', ?,
                    CASE WHEN ? IS NOT NULL THEN CONCAT(' - Motivo: ', ?) ELSE '' END
                )
                WHERE usuario_id = ? AND rol = ?
            `;

            const accion = nuevoEstado ? 'Activado' : 'Desactivado';
            const { resultado } = await ejecutarEscritura(sql, [
                estadoNumerico, accion, modificadoPor, motivo, motivo, usuarioId, rol
            ]);

            if (resultado.affectedRows === 0) {
                throw new Error(`No se encontró el rol '${rol}' para el usuario`);
            }

            console.log(`🔄 Rol '${rol}' ${accion.toLowerCase()} para usuario ${usuarioId}`);

            return {
                success: true,
                mensaje: `Rol '${rol}' ${accion.toLowerCase()} correctamente`,
                usuario_id: usuarioId,
                rol,
                nuevo_estado: nuevoEstado,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error al cambiar estado del rol:', error);
            throw error;
        }
    }

    /**
     * 🔍 Verificar si usuario tiene rol activo
     */
    async verificarRolActivo(usuarioId, rol) {
        try {
            const sql = `
                SELECT id FROM ${this.tablaUsuarioRoles} 
                WHERE usuario_id = ? AND rol = ? AND activo = 1
            `;

            const { resultado } = await ejecutarLectura(sql, [usuarioId, rol]);
            return resultado.length > 0;

        } catch (error) {
            console.error('❌ Error al verificar rol activo:', error);
            return false;
        }
    }

    /**
     * 👤 Verificar que el usuario existe
     */
    async verificarUsuarioExiste(usuarioId) {
        try {
            const sql = `
                SELECT id, nombres, apellidos, correo, activo 
                FROM ${this.tablaUsuarios} 
                WHERE id = ? AND activo = 1
            `;

            const { resultado } = await ejecutarLectura(sql, [usuarioId]);
            return resultado.length > 0 ? resultado[0] : null;

        } catch (error) {
            console.error('❌ Error al verificar usuario:', error);
            return null;
        }
    }

    /**
     * 👥 Listar usuarios por rol
     */
    async listarUsuariosPorRol(rol, activos = true) {
        try {
            if (!this.rolesDisponibles.includes(rol)) {
                throw new Error(`Rol '${rol}' no es válido`);
            }

            let sql = `
                SELECT 
                    u.id,
                    u.nombres,
                    u.apellidos,
                    u.correo,
                    u.telefono,
                    u.ultimo_acceso,
                    ur.fecha_asignacion,
                    ur.fecha_revocacion,
                    ur.activo,
                    ur.observaciones,
                    CONCAT(u.nombres, ' ', u.apellidos) as nombre_completo,
                    CONCAT(ua.nombres, ' ', ua.apellidos) as asignado_por_nombre
                FROM ${this.tablaUsuarios} u
                JOIN ${this.tablaUsuarioRoles} ur ON u.id = ur.usuario_id
                LEFT JOIN ${this.tablaUsuarios} ua ON ur.asignado_por = ua.id
                WHERE ur.rol = ? AND u.activo = 1
            `;

            const parametros = [rol];

            if (activos) {
                sql += ` AND ur.activo = 1`;
            }

            sql += ` ORDER BY ur.fecha_asignacion DESC`;

            const { resultado } = await ejecutarLectura(sql, parametros);

            return {
                rol,
                descripcion: this.obtenerDescripcionRol(rol),
                usuarios: resultado,
                total: resultado.length,
                activos: resultado.filter(u => u.activo === 1).length,
                inactivos: resultado.filter(u => u.activo === 0).length
            };

        } catch (error) {
            console.error('❌ Error al listar usuarios por rol:', error);
            throw error;
        }
    }

    /**
     * 📊 Obtener estadísticas de roles
     */
    async obtenerEstadisticasRoles() {
        try {
            const sql = `
                SELECT 
                    ur.rol,
                    COUNT(*) as total_asignaciones,
                    SUM(CASE WHEN ur.activo = 1 THEN 1 ELSE 0 END) as activos,
                    SUM(CASE WHEN ur.activo = 0 THEN 1 ELSE 0 END) as inactivos,
                    COUNT(DISTINCT ur.usuario_id) as usuarios_unicos,
                    MIN(ur.fecha_asignacion) as primera_asignacion,
                    MAX(ur.fecha_asignacion) as ultima_asignacion
                FROM ${this.tablaUsuarioRoles} ur
                JOIN ${this.tablaUsuarios} u ON ur.usuario_id = u.id
                WHERE u.activo = 1
                GROUP BY ur.rol
                ORDER BY activos DESC
            `;

            const { resultado } = await ejecutarLectura(sql);

            const estadisticas = {};
            resultado.forEach(stat => {
                estadisticas[stat.rol] = {
                    total_asignaciones: stat.total_asignaciones,
                    activos: stat.activos,
                    inactivos: stat.inactivos,
                    usuarios_unicos: stat.usuarios_unicos,
                    primera_asignacion: stat.primera_asignacion,
                    ultima_asignacion: stat.ultima_asignacion,
                    descripcion: this.obtenerDescripcionRol(stat.rol),
                    icono: this.obtenerIconoRol(stat.rol),
                    color: this.obtenerColorRol(stat.rol)
                };
            });

            // Agregar roles sin asignaciones
            this.rolesDisponibles.forEach(rol => {
                if (!estadisticas[rol]) {
                    estadisticas[rol] = {
                        total_asignaciones: 0,
                        activos: 0,
                        inactivos: 0,
                        usuarios_unicos: 0,
                        primera_asignacion: null,
                        ultima_asignacion: null,
                        descripcion: this.obtenerDescripcionRol(rol),
                        icono: this.obtenerIconoRol(rol),
                        color: this.obtenerColorRol(rol)
                    };
                }
            });

            const resumen = {
                total_roles: this.rolesDisponibles.length,
                total_asignaciones: Object.values(estadisticas).reduce((sum, stat) => sum + stat.total_asignaciones, 0),
                total_activos: Object.values(estadisticas).reduce((sum, stat) => sum + stat.activos, 0),
                total_usuarios_con_roles: Object.values(estadisticas).reduce((sum, stat) => sum + stat.usuarios_unicos, 0)
            };

            return {
                estadisticas,
                resumen,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error al obtener estadísticas de roles:', error);
            throw error;
        }
    }

    /**
     * 🔍 Validar permisos de usuario
     */
    async validarPermiso(usuarioId, permiso) {
        try {
            const rolesActivos = await this.obtenerRolesActivosUsuario(usuarioId);
            
            for (const rol of rolesActivos) {
                if (rol.permisos.includes(permiso)) {
                    return true;
                }
            }

            return false;

        } catch (error) {
            console.error('❌ Error al validar permiso:', error);
            return false;
        }
    }

    /**
     * 🔍 Validar múltiples permisos de usuario
     */
    async validarPermisos(usuarioId, permisos, requiereTodos = false) {
        try {
            const resultados = {};
            let permisosValidados = 0;

            for (const permiso of permisos) {
                const tienePermiso = await this.validarPermiso(usuarioId, permiso);
                resultados[permiso] = tienePermiso;
                if (tienePermiso) permisosValidados++;
            }

            const esValido = requiereTodos 
                ? permisosValidados === permisos.length 
                : permisosValidados > 0;

            return {
                valido: esValido,
                detalles: resultados,
                permisos_validados: permisosValidados,
                total_permisos: permisos.length
            };

        } catch (error) {
            console.error('❌ Error al validar permisos:', error);
            return {
                valido: false,
                detalles: {},
                error: error.message
            };
        }
    }

    /**
     * 📋 Obtener todos los permisos de un usuario
     */
    async obtenerPermisosUsuario(usuarioId) {
        try {
            const rolesActivos = await this.obtenerRolesActivosUsuario(usuarioId);
            
            const todosPermisos = new Set();
            const permisosPorRol = {};

            rolesActivos.forEach(rol => {
                permisosPorRol[rol.rol] = rol.permisos;
                rol.permisos.forEach(permiso => todosPermisos.add(permiso));
            });

            return {
                usuario_id: usuarioId,
                roles: rolesActivos.map(r => r.rol),
                permisos: Array.from(todosPermisos),
                permisos_por_rol: permisosPorRol,
                total_permisos: todosPermisos.size,
                rol_principal: await this.obtenerRolPrincipal(usuarioId)
            };

        } catch (error) {
            console.error('❌ Error al obtener permisos del usuario:', error);
            throw error;
        }
    }

    /**
     * 🔄 Sincronizar roles de usuario (para migraciones)
     */
    async sincronizarRolesUsuario(usuarioId, rolesDeseados, asignadoPor, motivo = 'Sincronización automática') {
        try {
            // Validar roles deseados
            const rolesInvalidos = rolesDeseados.filter(rol => !this.rolesDisponibles.includes(rol));
            if (rolesInvalidos.length > 0) {
                throw new Error(`Roles inválidos: ${rolesInvalidos.join(', ')}`);
            }

            const operaciones = [];

            // Obtener roles actuales
            const rolesActuales = await this.obtenerRolesActivosUsuario(usuarioId);
            const rolesActualesNombres = rolesActuales.map(r => r.rol);

            // Roles a agregar
            const rolesAgregar = rolesDeseados.filter(rol => !rolesActualesNombres.includes(rol));
            
            // Roles a quitar
            const rolesQuitar = rolesActualesNombres.filter(rol => !rolesDeseados.includes(rol));

            // Agregar nuevos roles
            for (const rol of rolesAgregar) {
                operaciones.push({
                    sql: `INSERT INTO ${this.tablaUsuarioRoles} (usuario_id, rol, activo, asignado_por, fecha_asignacion, observaciones) VALUES (?, ?, 1, ?, NOW(), ?)`,
                    parametros: [usuarioId, rol, asignadoPor, motivo],
                    punto: `agregar_rol_${rol}`
                });
            }

            // Quitar roles obsoletos
            for (const rol of rolesQuitar) {
                operaciones.push({
                    sql: `UPDATE ${this.tablaUsuarioRoles} SET activo = 0, fecha_revocacion = NOW(), observaciones = CONCAT(COALESCE(observaciones, ''), '\nRevocado automáticamente: ', NOW(), ' - ', ?) WHERE usuario_id = ? AND rol = ? AND activo = 1`,
                    parametros: [motivo, usuarioId, rol],
                    punto: `quitar_rol_${rol}`
                });
            }

            if (operaciones.length > 0) {
                await ejecutarTransaccionCompleja(operaciones);
            }

            console.log(`🔄 Roles sincronizados para usuario ${usuarioId}: +${rolesAgregar.length}, -${rolesQuitar.length}`);

            return {
                success: true,
                usuario_id: usuarioId,
                roles_agregados: rolesAgregar,
                roles_quitados: rolesQuitar,
                operaciones: operaciones.length,
                estado_final: rolesDeseados,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error al sincronizar roles:', error);
            throw error;
        }
    }

    /**
     * 📈 Historial de cambios de roles de un usuario
     */
    async obtenerHistorialRoles(usuarioId, limite = 50) {
        try {
            const sql = `
                SELECT 
                    ur.id,
                    ur.rol,
                    ur.activo,
                    ur.fecha_asignacion,
                    ur.fecha_revocacion,
                    ur.observaciones,
                    CONCAT(ua.nombres, ' ', ua.apellidos) as asignado_por_nombre,
                    ua.correo as asignado_por_correo
                FROM ${this.tablaUsuarioRoles} ur
                LEFT JOIN ${this.tablaUsuarios} ua ON ur.asignado_por = ua.id
                WHERE ur.usuario_id = ?
                ORDER BY ur.fecha_asignacion DESC
                LIMIT ?
            `;

            const { resultado } = await ejecutarLectura(sql, [usuarioId, limite]);

            return resultado.map(item => ({
                ...item,
                descripcion_rol: this.obtenerDescripcionRol(item.rol),
                estado_texto: item.activo ? 'Activo' : 'Revocado',
                duracion: item.fecha_revocacion 
                    ? Math.floor((new Date(item.fecha_revocacion) - new Date(item.fecha_asignacion)) / (1000 * 60 * 60 * 24))
                    : Math.floor((new Date() - new Date(item.fecha_asignacion)) / (1000 * 60 * 60 * 24))
            }));

        } catch (error) {
            console.error('❌ Error al obtener historial de roles:', error);
            throw error;
        }
    }

    /**
     * 🔍 Buscar usuarios con roles específicos
     */
    async buscarUsuariosConRoles(criterios) {
        try {
            const {
                roles = [],
                activos = true,
                nombre = null,
                correo = null,
                limite = 100
            } = criterios;

            let sql = `
                SELECT DISTINCT
                    u.id,
                    u.nombres,
                    u.apellidos,
                    u.correo,
                    u.ultimo_acceso,
                    CONCAT(u.nombres, ' ', u.apellidos) as nombre_completo,
                    GROUP_CONCAT(DISTINCT ur.rol ORDER BY ur.rol ASC) as roles_activos
                FROM ${this.tablaUsuarios} u
                JOIN ${this.tablaUsuarioRoles} ur ON u.id = ur.usuario_id
                WHERE u.activo = 1
            `;

            const parametros = [];

            if (roles.length > 0) {
                sql += ` AND ur.rol IN (${roles.map(() => '?').join(',')})`;
                parametros.push(...roles);
            }

            if (activos) {
                sql += ` AND ur.activo = 1`;
            }

            if (nombre) {
                sql += ` AND (u.nombres LIKE ? OR u.apellidos LIKE ?)`;
                const termino = `%${nombre}%`;
                parametros.push(termino, termino);
            }

            if (correo) {
                sql += ` AND u.correo LIKE ?`;
                parametros.push(`%${correo}%`);
            }

            sql += ` GROUP BY u.id ORDER BY u.nombres ASC, u.apellidos ASC LIMIT ?`;
            parametros.push(limite);

            const { resultado } = await ejecutarLectura(sql, parametros);

            return {
                usuarios: resultado,
                total: resultado.length,
                criterios,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error al buscar usuarios con roles:', error);
            throw error;
        }
    }
}

/**
 * 📤 Exportar instancia única del modelo
 */
module.exports = new RolModelo();