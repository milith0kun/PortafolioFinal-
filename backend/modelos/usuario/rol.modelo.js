/**
 * 🎭 MODELO DE ROL
 * 
 * Define roles y permisos del sistema:
 * - Tipos de rol (administrador, docente, verificador)
 * - Permisos asociados a cada rol
 * - Jerarquía de roles
 * - Estados del rol
 * - Configuraciones específicas por rol
 * 
 * Campos principales:
 * - id, nombre, descripcion
 * - permisos (JSON), jerarquia
 * - estado, configuracion
 * - created_at, updated_at
 */

// TODO: Definir roles base del sistema
// TODO: Sistema flexible de permisos
// TODO: Jerarquía de roles con herencia
// TODO: Configuraciones específicas por rol
// TODO: Relación many-to-many con usuarios

/**
 * 🎭 MODELO ROL - Sistema Portafolio Docente UNSAAC
 * 
 * Modelo para gestionar roles del sistema con permisos granulares,
 * jerarquías y validaciones de seguridad.
 * 
 * @author Sistema Portafolio Docente UNSAAC
 * @version 1.0.0
 */

const { ejecutarLectura, ejecutarEscritura, ejecutarTransaccionCompleja } = require('../../base_datos/conexiones/pool.conexion');

/**
 * 🏗️ Clase modelo Rol
 */
class RolModelo {
    constructor() {
        this.tabla = 'roles';
        this.tablaPermisos = 'permisos';
        this.tablaRolPermisos = 'rol_permisos';
        this.tablaUsuarioRoles = 'usuario_roles';
    }

    /**
     * 📋 Crear nuevo rol
     */
    async crear(datosRol) {
        try {
            const {
                nombre,
                descripcion,
                color = '#6366f1',
                icono = 'user',
                prioridad = 1,
                permisos = [],
                estado = 'activo',
                creado_por
            } = datosRol;

            // Verificar que el nombre no exista
            const rolExistente = await this.obtenerPorNombre(nombre);
            if (rolExistente) {
                throw new Error('Ya existe un rol con este nombre');
            }

            const operaciones = [
                {
                    sql: `
                        INSERT INTO ${this.tabla} (
                            nombre, descripcion, color, icono, prioridad, estado,
                            fecha_creacion, creado_por
                        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
                    `,
                    parametros: [nombre, descripcion, color, icono, prioridad, estado, creado_por],
                    punto: 'crear_rol'
                }
            ];

            const { resultados } = await ejecutarTransaccionCompleja(operaciones);
            const rolId = resultados[0].resultado.insertId;

            // Asignar permisos si se proporcionaron
            if (permisos.length > 0) {
                await this.asignarPermisos(rolId, permisos, creado_por);
            }

            const rolCreado = await this.obtenerPorId(rolId);

            console.log(`✅ Rol creado: ${nombre} (ID: ${rolId})`);

            return {
                id: rolId,
                rol: rolCreado,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error al crear rol:', error);
            throw error;
        }
    }

    /**
     * 📖 Obtener rol por ID
     */
    async obtenerPorId(id) {
        try {
            const sql = `
                SELECT 
                    r.*,
                    COUNT(DISTINCT ur.usuario_id) as total_usuarios,
                    COUNT(DISTINCT rp.permiso_id) as total_permisos
                FROM ${this.tabla} r
                LEFT JOIN ${this.tablaUsuarioRoles} ur ON r.id = ur.rol_id AND ur.estado = 'activo'
                LEFT JOIN ${this.tablaRolPermisos} rp ON r.id = rp.rol_id AND rp.estado = 'activo'
                WHERE r.id = ?
                GROUP BY r.id
            `;

            const { resultado } = await ejecutarLectura(sql, [id]);

            if (resultado.length === 0) {
                return null;
            }

            const rol = resultado[0];

            // Obtener permisos detallados
            rol.permisos = await this.obtenerPermisosRol(id);

            return rol;

        } catch (error) {
            console.error('❌ Error al obtener rol por ID:', error);
            throw error;
        }
    }

    /**
     * 📖 Obtener rol por nombre
     */
    async obtenerPorNombre(nombre) {
        try {
            const sql = `
                SELECT * FROM ${this.tabla} 
                WHERE nombre = ? AND estado != 'eliminado'
            `;

            const { resultado } = await ejecutarLectura(sql, [nombre]);
            return resultado.length > 0 ? resultado[0] : null;

        } catch (error) {
            console.error('❌ Error al obtener rol por nombre:', error);
            throw error;
        }
    }

    /**
     * 📋 Listar todos los roles
     */
    async listar(filtros = {}) {
        try {
            const {
                estado = null,
                busqueda = null,
                incluir_usuarios = false,
                incluir_permisos = false
            } = filtros;

            let sql = `
                SELECT 
                    r.*,
                    COUNT(DISTINCT ur.usuario_id) as total_usuarios,
                    COUNT(DISTINCT rp.permiso_id) as total_permisos
                FROM ${this.tabla} r
                LEFT JOIN ${this.tablaUsuarioRoles} ur ON r.id = ur.rol_id AND ur.estado = 'activo'
                LEFT JOIN ${this.tablaRolPermisos} rp ON r.id = rp.rol_id AND rp.estado = 'activo'
                WHERE r.estado != 'eliminado'
            `;

            const parametros = [];

            // Aplicar filtros
            if (estado) {
                sql += ` AND r.estado = ?`;
                parametros.push(estado);
            }

            if (busqueda) {
                sql += ` AND (r.nombre LIKE ? OR r.descripcion LIKE ?)`;
                const termino = `%${busqueda}%`;
                parametros.push(termino, termino);
            }

            sql += ` GROUP BY r.id ORDER BY r.prioridad ASC, r.nombre ASC`;

            const { resultado: roles } = await ejecutarLectura(sql, parametros);

            // Incluir información adicional si se solicita
            if (incluir_usuarios || incluir_permisos) {
                for (const rol of roles) {
                    if (incluir_usuarios) {
                        rol.usuarios = await this.obtenerUsuariosRol(rol.id);
                    }
                    if (incluir_permisos) {
                        rol.permisos = await this.obtenerPermisosRol(rol.id);
                    }
                }
            }

            return roles;

        } catch (error) {
            console.error('❌ Error al listar roles:', error);
            throw error;
        }
    }

    /**
     * ✏️ Actualizar rol
     */
    async actualizar(id, datosActualizacion, actualizadoPor) {
        try {
            const rolAnterior = await this.obtenerPorId(id);
            if (!rolAnterior) {
                throw new Error('Rol no encontrado');
            }

            const {
                nombre,
                descripcion,
                color,
                icono,
                prioridad,
                estado
            } = datosActualizacion;

            // Verificar nombre único si se está cambiando
            if (nombre && nombre !== rolAnterior.nombre) {
                const nombreExistente = await this.obtenerPorNombre(nombre);
                if (nombreExistente && nombreExistente.id !== id) {
                    throw new Error('Ya existe un rol con este nombre');
                }
            }

            const sql = `
                UPDATE ${this.tabla} 
                SET nombre = ?, descripcion = ?, color = ?, icono = ?, 
                    prioridad = ?, estado = ?, fecha_actualizacion = NOW(), 
                    actualizado_por = ?
                WHERE id = ?
            `;

            const parametros = [
                nombre, descripcion, color, icono, prioridad, estado,
                actualizadoPor, id
            ];

            const { resultado } = await ejecutarEscritura(sql, parametros);

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo actualizar el rol');
            }

            const rolActualizado = await this.obtenerPorId(id);

            console.log(`✅ Rol actualizado: ${rolActualizado.nombre} (ID: ${id})`);

            return {
                rol: rolActualizado,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error al actualizar rol:', error);
            throw error;
        }
    }

    /**
     * 🗑️ Eliminar rol (soft delete)
     */
    async eliminar(id, eliminadoPor) {
        try {
            const rol = await this.obtenerPorId(id);
            if (!rol) {
                throw new Error('Rol no encontrado');
            }

            // Verificar que no sea un rol del sistema
            const rolesSistema = ['administrador', 'docente', 'verificador'];
            if (rolesSistema.includes(rol.nombre.toLowerCase())) {
                throw new Error('No se puede eliminar un rol del sistema');
            }

            // Verificar que no tenga usuarios asignados
            if (rol.total_usuarios > 0) {
                throw new Error('No se puede eliminar un rol que tiene usuarios asignados');
            }

            const operaciones = [
                {
                    sql: `UPDATE ${this.tabla} SET estado = 'eliminado', fecha_actualizacion = NOW(), actualizado_por = ? WHERE id = ?`,
                    parametros: [eliminadoPor, id],
                    punto: 'eliminar_rol'
                },
                {
                    sql: `UPDATE ${this.tablaRolPermisos} SET estado = 'inactivo' WHERE rol_id = ?`,
                    parametros: [id],
                    punto: 'desactivar_permisos'
                }
            ];

            await ejecutarTransaccionCompleja(operaciones);

            console.log(`🗑️ Rol eliminado: ${rol.nombre} (ID: ${id})`);

            return {
                success: true,
                mensaje: 'Rol eliminado correctamente',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error al eliminar rol:', error);
            throw error;
        }
    }

    /**
     * 🔑 Obtener permisos de un rol
     */
    async obtenerPermisosRol(rolId) {
        try {
            const sql = `
                SELECT 
                    p.id, p.nombre, p.descripcion, p.modulo, p.accion,
                    rp.fecha_asignacion, rp.asignado_por
                FROM ${this.tablaRolPermisos} rp
                JOIN ${this.tablaPermisos} p ON rp.permiso_id = p.id
                WHERE rp.rol_id = ? AND rp.estado = 'activo' AND p.estado = 'activo'
                ORDER BY p.modulo ASC, p.accion ASC
            `;

            const { resultado } = await ejecutarLectura(sql, [rolId]);

            // Agrupar permisos por módulo
            const permisosPorModulo = {};
            resultado.forEach(permiso => {
                if (!permisosPorModulo[permiso.modulo]) {
                    permisosPorModulo[permiso.modulo] = [];
                }
                permisosPorModulo[permiso.modulo].push(permiso);
            });

            return {
                lista: resultado,
                por_modulo: permisosPorModulo,
                total: resultado.length
            };

        } catch (error) {
            console.error('❌ Error al obtener permisos del rol:', error);
            throw error;
        }
    }

/**
 * 🎭 MODELO ROL - Sistema Portafolio Docente UNSAAC
 * 
 * Modelo para gestionar roles del sistema basado en usuarios_roles
 * con soporte multi-rol y validaciones de seguridad.
 * 
 * @author Sistema Portafolio Docente UNSAAC
 * @version 1.0.0
 */

// Import database connection utilities
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
                permisos: this.obtenerPermisosRol(rol)
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
     * 🔑 Obtener permisos por rol
     */
    obtenerPermisosRol(rol) {
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
                    CONCAT(ua.nombres, ' ', ua.apellidos) as asignado_por_nombre
                FROM ${this.tablaUsuarioRoles} ur
                LEFT JOIN ${this.tablaUsuarios} ua ON ur.asignado_por = ua.id
                WHERE ur.usuario_id = ?
                ORDER BY ur.fecha_asignacion DESC
            `;

            const { resultado } = await ejecutarLectura(sql, [usuarioId]);

            return resultado.map(rol => ({
                ...rol,
                descripcion: this.obtenerDescripcionRol(rol.rol),
                permisos: this.obtenerPermisosRol(rol.rol)
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
                    ur.rol,
                    ur.fecha_asignacion
                FROM ${this.tablaUsuarioRoles} ur
                WHERE ur.usuario_id = ? AND ur.activo = 1
                ORDER BY ur.fecha_asignacion ASC
            `;

            const { resultado } = await ejecutarLectura(sql, [usuarioId]);

            return resultado.map(rol => ({
                ...rol,
                descripcion: this.obtenerDescripcionRol(rol.rol),
                permisos: this.obtenerPermisosRol(rol.rol)
            }));

        } catch (error) {
            console.error('❌ Error al obtener roles activos:', error);
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
                throw new Error(`Rol '${rol}' no es válido`);
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

            console.log(`✅ Rol '${rol}' asignado a usuario ${usuarioId}`);

            return {
                id: resultado.insertId,
                usuario_id: usuarioId,
                rol,
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
    async revocarRol(usuarioId, rol, revocadoPor) {
        try {
            const sql = `
                UPDATE ${this.tablaUsuarioRoles} 
                SET activo = 0, fecha_revocacion = NOW()
                WHERE usuario_id = ? AND rol = ? AND activo = 1
            `;

            const { resultado } = await ejecutarEscritura(sql, [usuarioId, rol]);

            if (resultado.affectedRows === 0) {
                throw new Error(`No se encontró el rol '${rol}' activo para el usuario`);
            }

            console.log(`➖ Rol '${rol}' revocado del usuario ${usuarioId}`);

            return {
                success: true,
                mensaje: `Rol '${rol}' revocado correctamente`,
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
    async cambiarEstadoRol(usuarioId, rol, nuevoEstado, modificadoPor) {
        try {
            const estadoNumerico = nuevoEstado ? 1 : 0;
            const campoFecha = nuevoEstado ? 'fecha_asignacion' : 'fecha_revocacion';

            const sql = `
                UPDATE ${this.tablaUsuarioRoles} 
                SET activo = ?, ${campoFecha} = NOW()
                WHERE usuario_id = ? AND rol = ?
            `;

            const { resultado } = await ejecutarEscritura(sql, [estadoNumerico, usuarioId, rol]);

            if (resultado.affectedRows === 0) {
                throw new Error(`No se encontró el rol '${rol}' para el usuario`);
            }

            const accion = nuevoEstado ? 'activado' : 'desactivado';
            console.log(`🔄 Rol '${rol}' ${accion} para usuario ${usuarioId}`);

            return {
                success: true,
                mensaje: `Rol '${rol}' ${accion} correctamente`,
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
                    ur.fecha_asignacion,
                    ur.activo,
                    ur.observaciones,
                    CONCAT(u.nombres, ' ', u.apellidos) as nombre_completo
                FROM ${this.tablaUsuarios} u
                JOIN ${this.tablaUsuarioRoles} ur ON u.id = ur.usuario_id
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
                usuarios: resultado,
                total: resultado.length
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
                    SUM(CASE WHEN ur.activo = 0 THEN 1 ELSE 0 END) as inactivos
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
                    descripcion: this.obtenerDescripcionRol(stat.rol)
                };
            });

            // Agregar roles sin asignaciones
            this.rolesDisponibles.forEach(rol => {
                if (!estadisticas[rol]) {
                    estadisticas[rol] = {
                        total_asignaciones: 0,
                        activos: 0,
                        inactivos: 0,
                        descripcion: this.obtenerDescripcionRol(rol)
                    };
                }
            });

            return {
                estadisticas,
                resumen: {
                    total_roles: this.rolesDisponibles.length,
                    total_asignaciones: Object.values(estadisticas).reduce((sum, stat) => sum + stat.total_asignaciones, 0),
                    total_activos: Object.values(estadisticas).reduce((sum, stat) => sum + stat.activos, 0)
                }
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
     * 📋 Obtener todos los permisos de un usuario
     */
    async obtenerPermisosUsuario(usuarioId) {
        try {
            const rolesActivos = await this.obtenerRolesActivosUsuario(usuarioId);
            
            const todosPermisos = new Set();
            rolesActivos.forEach(rol => {
                rol.permisos.forEach(permiso => todosPermisos.add(permiso));
            });

            return {
                roles: rolesActivos.map(r => r.rol),
                permisos: Array.from(todosPermisos),
                total_permisos: todosPermisos.size
            };

        } catch (error) {
            console.error('❌ Error al obtener permisos del usuario:', error);
            throw error;
        }
    }

    /**
     * 🔄 Sincronizar roles de usuario (para migraciones)
     */
    async sincronizarRolesUsuario(usuarioId, rolesDeseados, asignadoPor) {
        try {
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
                    sql: `INSERT INTO ${this.tablaUsuarioRoles} (usuario_id, rol, activo, asignado_por, fecha_asignacion) VALUES (?, ?, 1, ?, NOW())`,
                    parametros: [usuarioId, rol, asignadoPor],
                    punto: `agregar_rol_${rol}`
                });
            }

            // Quitar roles obsoletos
            for (const rol of rolesQuitar) {
                operaciones.push({
                    sql: `UPDATE ${this.tablaUsuarioRoles} SET activo = 0, fecha_revocacion = NOW() WHERE usuario_id = ? AND rol = ? AND activo = 1`,
                    parametros: [usuarioId, rol],
                    punto: `quitar_rol_${rol}`
                });
            }

            if (operaciones.length > 0) {
                await ejecutarTransaccionCompleja(operaciones);
            }

            console.log(`🔄 Roles sincronizados para usuario ${usuarioId}: +${rolesAgregar.length}, -${rolesQuitar.length}`);

            return {
                success: true,
                roles_agregados: rolesAgregar,
                roles_quitados: rolesQuitar,
                operaciones: operaciones.length
            };

        } catch (error) {
            console.error('❌ Error al sincronizar roles:', error);
            throw error;
        }
    }
}

/**
 * 📤 Exportar instancia única del modelo
 */
module.exports = new RolModelo();