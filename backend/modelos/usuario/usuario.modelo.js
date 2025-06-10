/**
 * 👤 MODELO DE USUARIO
 * 
 * Define la estructura y comportamiento de usuarios:
 * - Información personal (nombre, email, teléfono)
 * - Credenciales de acceso
 * - Estados del usuario (activo, inactivo, bloqueado)
 * - Timestamps de actividad
 * - Relaciones con roles y portafolios
 * 
 * Campos principales:
 * - id, email, password_hash
 * - nombres, apellidos, telefono
 * - estado, email_verificado
 * - created_at, updated_at, last_login
 */

// TODO: Definir esquema completo de usuario
// TODO: Métodos de encriptación de password
// TODO: Validaciones de email único
// TODO: Soft delete para usuarios
// TODO: Relaciones con roles y sesiones


/**
 * 👤 MODELO USUARIO - Sistema Portafolio Docente UNSAAC
 * 
 * Modelo para gestionar usuarios del sistema con soporte multi-rol,
 * validaciones, encriptación de contraseñas y auditoría completa.
 * 
 * @author Sistema Portafolio Docente UNSAAC
 * @version 1.0.0
 */

const { ejecutarConsulta, ejecutarTransaccion } = require('../../base_datos/conexiones/mysql.conexion');
const { ejecutarLectura, ejecutarEscritura } = require('../../base_datos/conexiones/pool.conexion');
const bcrypt = require('bcryptjs');
const moment = require('moment');

/**
 * 🏗️ Clase modelo Usuario
 */
class UsuarioModelo {
    constructor() {
        this.tabla = 'usuarios';
        this.tablaRoles = 'usuario_roles';
        this.tablaSesiones = 'sesiones_usuario';
        this.tablaAuditoria = 'auditoria_usuarios';
    }

    /**
     * 📋 Crear nuevo usuario
     */
    async crear(datosUsuario) {
        try {
            const {
                codigo_docente,
                nombres,
                apellidos,
                email,
                password,
                telefono = null,
                direccion = null,
                fecha_nacimiento = null,
                genero = null,
                estado = 'activo',
                creado_por
            } = datosUsuario;

            // Encriptar contraseña
            const passwordHash = await bcrypt.hash(password, 12);

            // Verificar si ya existe el usuario
            const usuarioExistente = await this.buscarPorEmail(email);
            if (usuarioExistente) {
                throw new Error('Ya existe un usuario con este email');
            }

            const usuarioExistenteCodigo = await this.buscarPorCodigo(codigo_docente);
            if (usuarioExistenteCodigo) {
                throw new Error('Ya existe un usuario con este código docente');
            }

            const sql = `
                INSERT INTO ${this.tabla} (
                    codigo_docente, nombres, apellidos, email, password,
                    telefono, direccion, fecha_nacimiento, genero, estado,
                    fecha_creacion, creado_por, fecha_actualizacion
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())
            `;

            const parametros = [
                codigo_docente, nombres, apellidos, email, passwordHash,
                telefono, direccion, fecha_nacimiento, genero, estado,
                creado_por
            ];

            const { resultado } = await ejecutarEscritura(sql, parametros);

            // Registrar en auditoría
            await this.registrarAuditoria(resultado.insertId, 'CREAR', null, datosUsuario, creado_por);

            // Obtener usuario creado
            const usuarioCreado = await this.obtenerPorId(resultado.insertId);

            console.log(`✅ Usuario creado: ${usuarioCreado.email} (ID: ${resultado.insertId})`);

            return {
                id: resultado.insertId,
                usuario: usuarioCreado,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error al crear usuario:', error);
            throw error;
        }
    }

    /**
     * 📖 Obtener usuario por ID
     */
    async obtenerPorId(id) {
        try {
            const sql = `
                SELECT 
                    u.id, u.codigo_docente, u.nombres, u.apellidos, u.email,
                    u.telefono, u.direccion, u.fecha_nacimiento, u.genero,
                    u.estado, u.ultimo_acceso, u.intentos_fallidos,
                    u.fecha_creacion, u.fecha_actualizacion,
                    CONCAT(u.nombres, ' ', u.apellidos) as nombre_completo,
                    GROUP_CONCAT(ur.rol_id) as roles,
                    COUNT(s.id) as sesiones_activas
                FROM ${this.tabla} u
                LEFT JOIN ${this.tablaRoles} ur ON u.id = ur.usuario_id AND ur.estado = 'activo'
                LEFT JOIN ${this.tablaSesiones} s ON u.id = s.usuario_id AND s.estado = 'activa'
                WHERE u.id = ?
                GROUP BY u.id
            `;

            const { resultado } = await ejecutarLectura(sql, [id]);

            if (resultado.length === 0) {
                return null;
            }

            const usuario = resultado[0];
            
            // Procesar roles
            usuario.roles = usuario.roles ? usuario.roles.split(',').map(r => parseInt(r)) : [];
            
            // Convertir fechas
            usuario.fecha_nacimiento = usuario.fecha_nacimiento ? moment(usuario.fecha_nacimiento).format('YYYY-MM-DD') : null;
            usuario.ultimo_acceso = usuario.ultimo_acceso ? moment(usuario.ultimo_acceso).toISOString() : null;

            return usuario;

        } catch (error) {
            console.error('❌ Error al obtener usuario por ID:', error);
            throw error;
        }
    }

    /**
     * 📧 Obtener usuario por email
     */
    async obtenerPorEmail(email) {
        try {
            const sql = `
                SELECT 
                    u.*, 
                    CONCAT(u.nombres, ' ', u.apellidos) as nombre_completo
                FROM ${this.tabla} u
                WHERE u.email = ? AND u.estado != 'eliminado'
            `;

            const { resultado } = await ejecutarLectura(sql, [email]);

            return resultado.length > 0 ? resultado[0] : null;

        } catch (error) {
            console.error('❌ Error al obtener usuario por email:', error);
            throw error;
        }
    }

    /**
     * 🔢 Obtener usuario por código docente
     */
    async obtenerPorCodigo(codigo_docente) {
        try {
            const sql = `
                SELECT 
                    u.*, 
                    CONCAT(u.nombres, ' ', u.apellidos) as nombre_completo
                FROM ${this.tabla} u
                WHERE u.codigo_docente = ? AND u.estado != 'eliminado'
            `;

            const { resultado } = await ejecutarLectura(sql, [codigo_docente]);

            return resultado.length > 0 ? resultado[0] : null;

        } catch (error) {
            console.error('❌ Error al obtener usuario por código:', error);
            throw error;
        }
    }

    /**
     * 📋 Listar usuarios con filtros
     */
    async listar(filtros = {}, paginacion = {}) {
        try {
            const {
                estado = null,
                rol = null,
                busqueda = null,
                fecha_desde = null,
                fecha_hasta = null
            } = filtros;

            const {
                pagina = 1,
                limite = 20,
                orden_campo = 'fecha_creacion',
                orden_direccion = 'DESC'
            } = paginacion;

            let sql = `
                SELECT 
                    u.id, u.codigo_docente, u.nombres, u.apellidos, u.email,
                    u.telefono, u.estado, u.ultimo_acceso, u.fecha_creacion,
                    CONCAT(u.nombres, ' ', u.apellidos) as nombre_completo,
                    GROUP_CONCAT(DISTINCT r.nombre) as roles_nombres,
                    COUNT(DISTINCT ur.rol_id) as total_roles
                FROM ${this.tabla} u
                LEFT JOIN ${this.tablaRoles} ur ON u.id = ur.usuario_id AND ur.estado = 'activo'
                LEFT JOIN roles r ON ur.rol_id = r.id
                WHERE u.estado != 'eliminado'
            `;

            const parametros = [];

            // Aplicar filtros
            if (estado) {
                sql += ` AND u.estado = ?`;
                parametros.push(estado);
            }

            if (rol) {
                sql += ` AND EXISTS (
                    SELECT 1 FROM ${this.tablaRoles} ur2 
                    JOIN roles r2 ON ur2.rol_id = r2.id 
                    WHERE ur2.usuario_id = u.id AND r2.nombre = ? AND ur2.estado = 'activo'
                )`;
                parametros.push(rol);
            }

            if (busqueda) {
                sql += ` AND (
                    u.nombres LIKE ? OR u.apellidos LIKE ? OR 
                    u.email LIKE ? OR u.codigo_docente LIKE ?
                )`;
                const termino = `%${busqueda}%`;
                parametros.push(termino, termino, termino, termino);
            }

            if (fecha_desde) {
                sql += ` AND u.fecha_creacion >= ?`;
                parametros.push(fecha_desde);
            }

            if (fecha_hasta) {
                sql += ` AND u.fecha_creacion <= ?`;
                parametros.push(fecha_hasta);
            }

            sql += ` GROUP BY u.id`;
            
            // Ordenamiento
            const camposValidos = ['id', 'nombres', 'apellidos', 'email', 'estado', 'fecha_creacion'];
            const direccionesValidas = ['ASC', 'DESC'];
            
            if (camposValidos.includes(orden_campo) && direccionesValidas.includes(orden_direccion)) {
                sql += ` ORDER BY u.${orden_campo} ${orden_direccion}`;
            }

            // Paginación
            const offset = (pagina - 1) * limite;
            sql += ` LIMIT ? OFFSET ?`;
            parametros.push(limite, offset);

            // Ejecutar consulta principal
            const { resultado: usuarios } = await ejecutarLectura(sql, parametros);

            // Consulta para contar total
            let sqlCount = `
                SELECT COUNT(DISTINCT u.id) as total
                FROM ${this.tabla} u
                LEFT JOIN ${this.tablaRoles} ur ON u.id = ur.usuario_id AND ur.estado = 'activo'
                LEFT JOIN roles r ON ur.rol_id = r.id
                WHERE u.estado != 'eliminado'
            `;

            const parametrosCount = parametros.slice(0, -2); // Quitar LIMIT y OFFSET

            // Aplicar los mismos filtros para el count
            let indexParam = 0;
            if (estado) {
                sqlCount += ` AND u.estado = ?`;
                indexParam++;
            }
            if (rol) {
                sqlCount += ` AND EXISTS (
                    SELECT 1 FROM ${this.tablaRoles} ur2 
                    JOIN roles r2 ON ur2.rol_id = r2.id 
                    WHERE ur2.usuario_id = u.id AND r2.nombre = ? AND ur2.estado = 'activo'
                )`;
                indexParam++;
            }
            if (busqueda) {
                sqlCount += ` AND (
                    u.nombres LIKE ? OR u.apellidos LIKE ? OR 
                    u.email LIKE ? OR u.codigo_docente LIKE ?
                )`;
                indexParam += 4;
            }
            if (fecha_desde) {
                sqlCount += ` AND u.fecha_creacion >= ?`;
                indexParam++;
            }
            if (fecha_hasta) {
                sqlCount += ` AND u.fecha_creacion <= ?`;
                indexParam++;
            }

            const { resultado: totalResult } = await ejecutarLectura(sqlCount, parametrosCount);
            const total = totalResult[0].total;

            return {
                usuarios,
                paginacion: {
                    pagina_actual: pagina,
                    total_paginas: Math.ceil(total / limite),
                    total_registros: total,
                    limite,
                    tiene_siguiente: pagina < Math.ceil(total / limite),
                    tiene_anterior: pagina > 1
                },
                filtros_aplicados: filtros
            };

        } catch (error) {
            console.error('❌ Error al listar usuarios:', error);
            throw error;
        }
    }

    /**
     * ✏️ Actualizar usuario
     */
    async actualizar(id, datosActualizacion, actualizadoPor) {
        try {
            // Obtener datos actuales para auditoría
            const usuarioAnterior = await this.obtenerPorId(id);
            if (!usuarioAnterior) {
                throw new Error('Usuario no encontrado');
            }

            const {
                nombres,
                apellidos,
                email,
                telefono,
                direccion,
                fecha_nacimiento,
                genero,
                estado
            } = datosActualizacion;

            // Verificar email único si se está cambiando
            if (email && email !== usuarioAnterior.email) {
                const emailExistente = await this.buscarPorEmail(email);
                if (emailExistente && emailExistente.id !== id) {
                    throw new Error('El email ya está en uso por otro usuario');
                }
            }

            const sql = `
                UPDATE ${this.tabla} 
                SET nombres = ?, apellidos = ?, email = ?, telefono = ?,
                    direccion = ?, fecha_nacimiento = ?, genero = ?, estado = ?,
                    fecha_actualizacion = NOW(), actualizado_por = ?
                WHERE id = ?
            `;

            const parametros = [
                nombres, apellidos, email, telefono,
                direccion, fecha_nacimiento, genero, estado,
                actualizadoPor, id
            ];

            const { resultado } = await ejecutarEscritura(sql, parametros);

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo actualizar el usuario');
            }

            // Registrar en auditoría
            await this.registrarAuditoria(id, 'ACTUALIZAR', usuarioAnterior, datosActualizacion, actualizadoPor);

            // Obtener usuario actualizado
            const usuarioActualizado = await this.obtenerPorId(id);

            console.log(`✅ Usuario actualizado: ${usuarioActualizado.email} (ID: ${id})`);

            return {
                usuario: usuarioActualizado,
                cambios: this.compararCambios(usuarioAnterior, datosActualizacion),
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error al actualizar usuario:', error);
            throw error;
        }
    }

    /**
     * 🔒 Actualizar contraseña
     */
    async actualizarPassword(id, nuevaPassword, actualizadoPor) {
        try {
            const passwordHash = await bcrypt.hash(nuevaPassword, 12);

            const sql = `
                UPDATE ${this.tabla} 
                SET password = ?, fecha_actualizacion = NOW(), actualizado_por = ?
                WHERE id = ?
            `;

            const { resultado } = await ejecutarEscritura(sql, [passwordHash, actualizadoPor, id]);

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo actualizar la contraseña');
            }

            // Registrar en auditoría
            await this.registrarAuditoria(id, 'CAMBIO_PASSWORD', null, { accion: 'Cambio de contraseña' }, actualizadoPor);

            console.log(`🔒 Contraseña actualizada para usuario ID: ${id}`);

            return {
                success: true,
                mensaje: 'Contraseña actualizada correctamente',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error al actualizar contraseña:', error);
            throw error;
        }
    }

    /**
     * 🗑️ Eliminar usuario (soft delete)
     */
    async eliminar(id, eliminadoPor) {
        try {
            const usuario = await this.obtenerPorId(id);
            if (!usuario) {
                throw new Error('Usuario no encontrado');
            }

            const sql = `
                UPDATE ${this.tabla} 
                SET estado = 'eliminado', fecha_actualizacion = NOW(), actualizado_por = ?
                WHERE id = ?
            `;

            const { resultado } = await ejecutarEscritura(sql, [eliminadoPor, id]);

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo eliminar el usuario');
            }

            // Desactivar roles
            await this.desactivarTodosRoles(id, eliminadoPor);

            // Registrar en auditoría
            await this.registrarAuditoria(id, 'ELIMINAR', usuario, { estado: 'eliminado' }, eliminadoPor);

            console.log(`🗑️ Usuario eliminado: ${usuario.email} (ID: ${id})`);

            return {
                success: true,
                mensaje: 'Usuario eliminado correctamente',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error al eliminar usuario:', error);
            throw error;
        }
    }

    /**
     * 🔍 Validar credenciales de login
     */
    async validarCredenciales(email, password) {
        try {
            const sql = `
                SELECT 
                    u.id, u.codigo_docente, u.nombres, u.apellidos, u.email,
                    u.password, u.estado, u.intentos_fallidos, u.bloqueado_hasta,
                    CONCAT(u.nombres, ' ', u.apellidos) as nombre_completo
                FROM ${this.tabla} u
                WHERE u.email = ? AND u.estado = 'activo'
            `;

            const { resultado } = await ejecutarLectura(sql, [email]);

            if (resultado.length === 0) {
                return { valido: false, motivo: 'Usuario no encontrado o inactivo' };
            }

            const usuario = resultado[0];

            // Verificar si está bloqueado
            if (usuario.bloqueado_hasta && new Date() < new Date(usuario.bloqueado_hasta)) {
                return { 
                    valido: false, 
                    motivo: 'Usuario bloqueado temporalmente',
                    bloqueado_hasta: usuario.bloqueado_hasta
                };
            }

            // Verificar contraseña
            const passwordValida = await bcrypt.compare(password, usuario.password);

            if (!passwordValida) {
                await this.incrementarIntentosFallidos(usuario.id);
                return { valido: false, motivo: 'Contraseña incorrecta' };
            }

            // Reset intentos fallidos y actualizar último acceso
            await this.resetearIntentosFallidos(usuario.id);

            // Obtener roles del usuario
            const roles = await this.obtenerRolesUsuario(usuario.id);

            delete usuario.password; // No retornar password hash

            return {
                valido: true,
                usuario: {
                    ...usuario,
                    roles
                }
            };

        } catch (error) {
            console.error('❌ Error al validar credenciales:', error);
            throw error;
        }
    }

    /**
     * 🎭 Obtener roles de usuario
     */
    async obtenerRolesUsuario(usuarioId) {
        try {
            const sql = `
                SELECT 
                    r.id, r.nombre, r.descripcion, r.permisos,
                    ur.fecha_asignacion, ur.asignado_por
                FROM ${this.tablaRoles} ur
                JOIN roles r ON ur.rol_id = r.id
                WHERE ur.usuario_id = ? AND ur.estado = 'activo' AND r.estado = 'activo'
                ORDER BY r.prioridad ASC
            `;

            const { resultado } = await ejecutarLectura(sql, [usuarioId]);

            return resultado.map(rol => ({
                ...rol,
                permisos: rol.permisos ? JSON.parse(rol.permisos) : []
            }));

        } catch (error) {
            console.error('❌ Error al obtener roles:', error);
            throw error;
        }
    }

    /**
     * ➕ Asignar rol a usuario
     */
    async asignarRol(usuarioId, rolId, asignadoPor) {
        try {
            // Verificar si ya tiene el rol
            const rolExistente = await this.verificarRolUsuario(usuarioId, rolId);
            if (rolExistente) {
                throw new Error('El usuario ya tiene este rol asignado');
            }

            const sql = `
                INSERT INTO ${this.tablaRoles} (usuario_id, rol_id, estado, fecha_asignacion, asignado_por)
                VALUES (?, ?, 'activo', NOW(), ?)
            `;

            const { resultado } = await ejecutarEscritura(sql, [usuarioId, rolId, asignadoPor]);

            // Registrar en auditoría
            await this.registrarAuditoria(usuarioId, 'ASIGNAR_ROL', null, { rol_id: rolId }, asignadoPor);

            console.log(`👤 Rol ${rolId} asignado a usuario ${usuarioId}`);

            return {
                id: resultado.insertId,
                usuario_id: usuarioId,
                rol_id: rolId,
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
    async revocarRol(usuarioId, rolId, revocadoPor) {
        try {
            const sql = `
                UPDATE ${this.tablaRoles} 
                SET estado = 'inactivo', fecha_revocacion = NOW(), revocado_por = ?
                WHERE usuario_id = ? AND rol_id = ? AND estado = 'activo'
            `;

            const { resultado } = await ejecutarEscritura(sql, [revocadoPor, usuarioId, rolId]);

            if (resultado.affectedRows === 0) {
                throw new Error('No se encontró el rol asignado al usuario');
            }

            // Registrar en auditoría
            await this.registrarAuditoria(usuarioId, 'REVOCAR_ROL', null, { rol_id: rolId }, revocadoPor);

            console.log(`👤 Rol ${rolId} revocado de usuario ${usuarioId}`);

            return {
                success: true,
                mensaje: 'Rol revocado correctamente',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error al revocar rol:', error);
            throw error;
        }
    }

    /**
     * ⚠️ Incrementar intentos fallidos
     */
    async incrementarIntentosFallidos(usuarioId) {
        try {
            const sql = `
                UPDATE ${this.tabla} 
                SET intentos_fallidos = intentos_fallidos + 1,
                    bloqueado_hasta = CASE 
                        WHEN intentos_fallidos + 1 >= 5 
                        THEN DATE_ADD(NOW(), INTERVAL 30 MINUTE)
                        ELSE bloqueado_hasta 
                    END
                WHERE id = ?
            `;

            await ejecutarEscritura(sql, [usuarioId]);

        } catch (error) {
            console.error('❌ Error al incrementar intentos fallidos:', error);
        }
    }

    /**
     * ✅ Resetear intentos fallidos
     */
    async resetearIntentosFallidos(usuarioId) {
        try {
            const sql = `
                UPDATE ${this.tabla} 
                SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_acceso = NOW()
                WHERE id = ?
            `;

            await ejecutarEscritura(sql, [usuarioId]);

        } catch (error) {
            console.error('❌ Error al resetear intentos fallidos:', error);
        }
    }

    /**
     * 🔍 Verificar si usuario tiene rol específico
     */
    async verificarRolUsuario(usuarioId, rolId) {
        try {
            const sql = `
                SELECT id FROM ${this.tablaRoles} 
                WHERE usuario_id = ? AND rol_id = ? AND estado = 'activo'
            `;

            const { resultado } = await ejecutarLectura(sql, [usuarioId, rolId]);
            return resultado.length > 0;

        } catch (error) {
            console.error('❌ Error al verificar rol:', error);
            return false;
        }
    }

    /**
     * 🚫 Desactivar todos los roles de un usuario
     */
    async desactivarTodosRoles(usuarioId, desactivadoPor) {
        try {
            const sql = `
                UPDATE ${this.tablaRoles} 
                SET estado = 'inactivo', fecha_revocacion = NOW(), revocado_por = ?
                WHERE usuario_id = ? AND estado = 'activo'
            `;

            await ejecutarEscritura(sql, [desactivadoPor, usuarioId]);

        } catch (error) {
            console.error('❌ Error al desactivar roles:', error);
        }
    }

    /**
     * 📊 Registrar auditoría
     */
    async registrarAuditoria(usuarioId, accion, datosAnteriores, datosNuevos, realizadoPor) {
        try {
            const sql = `
                INSERT INTO ${this.tablaAuditoria} (
                    usuario_id, accion, datos_anteriores, datos_nuevos, 
                    realizado_por, fecha_accion, ip_address
                ) VALUES (?, ?, ?, ?, ?, NOW(), ?)
            `;

            const parametros = [
                usuarioId,
                accion,
                datosAnteriores ? JSON.stringify(datosAnteriores) : null,
                datosNuevos ? JSON.stringify(datosNuevos) : null,
                realizadoPor,
                null // IP se puede obtener del request en el controlador
            ];

            await ejecutarEscritura(sql, parametros);

        } catch (error) {
            console.error('❌ Error al registrar auditoría:', error);
        }
    }

    /**
     * 🔍 Comparar cambios entre datos anteriores y nuevos
     */
    compararCambios(datosAnteriores, datosNuevos) {
        const cambios = {};
        
        Object.keys(datosNuevos).forEach(campo => {
            if (datosAnteriores[campo] !== datosNuevos[campo]) {
                cambios[campo] = {
                    anterior: datosAnteriores[campo],
                    nuevo: datosNuevos[campo]
                };
            }
        });

        return cambios;
    }

    /**
     * 📊 Estadísticas de usuarios
     */
    async obtenerEstadisticas() {
        try {
            const sql = `
                SELECT 
                    COUNT(*) as total_usuarios,
                    SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END) as activos,
                    SUM(CASE WHEN estado = 'inactivo' THEN 1 ELSE 0 END) as inactivos,
                    SUM(CASE WHEN estado = 'eliminado' THEN 1 ELSE 0 END) as eliminados,
                    SUM(CASE WHEN ultimo_acceso >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as activos_semana,
                    SUM(CASE WHEN intentos_fallidos > 0 THEN 1 ELSE 0 END) as con_intentos_fallidos,
                    SUM(CASE WHEN bloqueado_hasta > NOW() THEN 1 ELSE 0 END) as bloqueados
                FROM ${this.tabla}
                WHERE estado != 'eliminado'
            `;

            const { resultado } = await ejecutarLectura(sql);
            return resultado[0];

        } catch (error) {
            console.error('❌ Error al obtener estadísticas:', error);
            throw error;
        }
    }

    /**
     * 🔍 Buscar usuarios (métodos auxiliares)
     */
    async buscarPorEmail(email) {
        return await this.obtenerPorEmail(email);
    }

    async buscarPorCodigo(codigo_docente) {
        return await this.obtenerPorCodigo(codigo_docente);
    }
}

/**
 * 📤 Exportar instancia única del modelo
 */
module.exports = new UsuarioModelo();