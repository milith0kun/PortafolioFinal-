/**
 * 👥 CONTROLADOR DE GESTIÓN DE USUARIOS
 * 
 * Maneja todas las operaciones CRUD de usuarios:
 * - Crear nuevos usuarios (solo administradores)
 * - Listar usuarios con filtros y paginación
 * - Obtener detalles de usuario específico
 * - Actualizar información de usuarios
 * - Activar/desactivar usuarios
 * - Eliminar usuarios (soft delete)
 * 
 * Rutas que maneja:
 * GET /api/v1/usuarios - Listar usuarios
 * POST /api/v1/usuarios - Crear usuario
 * GET /api/v1/usuarios/:id - Obtener usuario
 * PUT /api/v1/usuarios/:id - Actualizar usuario
 * DELETE /api/v1/usuarios/:id - Eliminar usuario
 */

// TODO: Implementar CRUD completo de usuarios
// TODO: Filtros por rol, estado, fecha de creación
// TODO: Paginación y ordenamiento
// TODO: Validar permisos según rol del usuario autenticado
// TODO: Hashear contraseñas antes de guardar
/**
 * 👥 CONTROLADOR GESTIÓN USUARIOS - Sistema Portafolio Docente UNSAAC
 * CRUD completo de usuarios del sistema
 */

const bcrypt = require('bcryptjs');
const { ejecutarConsulta } = require('../../base_datos/conexiones/pool.conexion');

/**
 * 📋 Listar usuarios con filtros y paginación
 */
async function listar(req, res) {
    try {
        const { 
            pagina = 1, 
            limite = 20, 
            busqueda = '', 
            rol = '', 
            estado = 'activo' 
        } = req.query;

        const offset = (pagina - 1) * limite;

        let sql = `
            SELECT 
                u.id, u.nombres, u.apellidos, u.correo, u.telefono, 
                u.activo, u.ultimo_acceso, u.creado_en,
                CONCAT(u.nombres, ' ', u.apellidos) as nombre_completo,
                GROUP_CONCAT(ur.rol) as roles,
                COUNT(DISTINCT ur.id) as total_roles
            FROM usuarios u
            LEFT JOIN usuarios_roles ur ON u.id = ur.usuario_id AND ur.activo = 1
            WHERE 1=1
        `;
        
        const parametros = [];

        // Filtro por estado
        if (estado === 'activo') {
            sql += ` AND u.activo = 1`;
        } else if (estado === 'inactivo') {
            sql += ` AND u.activo = 0`;
        }

        // Filtro por búsqueda
        if (busqueda) {
            sql += ` AND (u.nombres LIKE ? OR u.apellidos LIKE ? OR u.correo LIKE ?)`;
            const termino = `%${busqueda}%`;
            parametros.push(termino, termino, termino);
        }

        // Filtro por rol
        if (rol) {
            sql += ` AND EXISTS (
                SELECT 1 FROM usuarios_roles ur2 
                WHERE ur2.usuario_id = u.id AND ur2.rol = ? AND ur2.activo = 1
            )`;
            parametros.push(rol);
        }

        sql += ` GROUP BY u.id ORDER BY u.creado_en DESC LIMIT ? OFFSET ?`;
        parametros.push(parseInt(limite), parseInt(offset));

        const usuarios = await ejecutarConsulta(sql, parametros);

        // Contar total para paginación
        let sqlCount = `
            SELECT COUNT(DISTINCT u.id) as total
            FROM usuarios u
            LEFT JOIN usuarios_roles ur ON u.id = ur.usuario_id AND ur.activo = 1
            WHERE 1=1
        `;
        
        const parametrosCount = [];
        
        if (estado === 'activo') {
            sqlCount += ` AND u.activo = 1`;
        } else if (estado === 'inactivo') {
            sqlCount += ` AND u.activo = 0`;
        }

        if (busqueda) {
            sqlCount += ` AND (u.nombres LIKE ? OR u.apellidos LIKE ? OR u.correo LIKE ?)`;
            const termino = `%${busqueda}%`;
            parametrosCount.push(termino, termino, termino);
        }

        if (rol) {
            sqlCount += ` AND EXISTS (
                SELECT 1 FROM usuarios_roles ur2 
                WHERE ur2.usuario_id = u.id AND ur2.rol = ? AND ur2.activo = 1
            )`;
            parametrosCount.push(rol);
        }

        const [{ total }] = await ejecutarConsulta(sqlCount, parametrosCount);

        res.json({
            success: true,
            usuarios: usuarios.map(u => ({
                ...u,
                roles: u.roles ? u.roles.split(',') : []
            })),
            paginacion: {
                pagina_actual: parseInt(pagina),
                limite: parseInt(limite),
                total,
                total_paginas: Math.ceil(total / limite)
            }
        });

    } catch (error) {
        console.error('❌ Error al listar usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * 👤 Obtener usuario por ID
 */
async function obtenerPorId(req, res) {
    try {
        const { id } = req.params;

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
            [id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const usuario = usuarios[0];

        // Obtener historial de roles
        const historialRoles = await ejecutarConsulta(
            `SELECT 
                ur.rol, ur.activo, ur.fecha_asignacion, ur.fecha_revocacion,
                CONCAT(ua.nombres, ' ', ua.apellidos) as asignado_por_nombre
             FROM usuarios_roles ur
             LEFT JOIN usuarios ua ON ur.asignado_por = ua.id
             WHERE ur.usuario_id = ?
             ORDER BY ur.fecha_asignacion DESC`,
            [id]
        );

        res.json({
            success: true,
            usuario: {
                ...usuario,
                roles: usuario.roles ? usuario.roles.split(',') : [],
                historial_roles: historialRoles
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * ➕ Crear nuevo usuario
 */
async function crear(req, res) {
    try {
        const { nombres, apellidos, correo, contrasena, telefono, roles = [] } = req.body;

        // Validar datos básicos
        if (!nombres || !apellidos || !correo || !contrasena) {
            return res.status(400).json({
                success: false,
                message: 'Nombres, apellidos, correo y contraseña son obligatorios'
            });
        }

        // Validar formato de correo
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de correo inválido'
            });
        }

        // Verificar que el correo no exista
        const usuarioExistente = await ejecutarConsulta(
            'SELECT id FROM usuarios WHERE correo = ?',
            [correo]
        );

        if (usuarioExistente.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un usuario con este correo'
            });
        }

        // Encriptar contraseña
        const contrasenaHash = await bcrypt.hash(contrasena, 12);

        // Crear usuario
        const resultado = await ejecutarConsulta(
            `INSERT INTO usuarios (nombres, apellidos, correo, contrasena, telefono) 
             VALUES (?, ?, ?, ?, ?)`,
            [nombres, apellidos, correo, contrasenaHash, telefono]
        );

        const usuarioId = resultado.insertId;

        // Asignar roles si se proporcionaron
        if (roles.length > 0) {
            for (const rol of roles) {
                if (['docente', 'verificador', 'administrador'].includes(rol)) {
                    await ejecutarConsulta(
                        `INSERT INTO usuarios_roles (usuario_id, rol, asignado_por) 
                         VALUES (?, ?, ?)`,
                        [usuarioId, rol, req.usuario.id]
                    );
                }
            }
        }

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            usuario_id: usuarioId
        });

    } catch (error) {
        console.error('❌ Error al crear usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * ✏️ Actualizar usuario
 */
async function actualizar(req, res) {
    try {
        const { id } = req.params;
        const { nombres, apellidos, telefono, activo } = req.body;

        // Verificar que el usuario existe
        const usuarioExistente = await ejecutarConsulta(
            'SELECT id FROM usuarios WHERE id = ?',
            [id]
        );

        if (usuarioExistente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Actualizar usuario
        await ejecutarConsulta(
            `UPDATE usuarios 
             SET nombres = ?, apellidos = ?, telefono = ?, activo = ?
             WHERE id = ?`,
            [nombres, apellidos, telefono, activo !== undefined ? activo : 1, id]
        );

        // Obtener usuario actualizado
        const usuarios = await ejecutarConsulta(
            `SELECT 
                u.id, u.nombres, u.apellidos, u.correo, u.telefono, u.activo,
                GROUP_CONCAT(ur.rol) as roles
             FROM usuarios u
             LEFT JOIN usuarios_roles ur ON u.id = ur.usuario_id AND ur.activo = 1
             WHERE u.id = ?
             GROUP BY u.id`,
            [id]
        );

        const usuarioActualizado = usuarios[0];

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            usuario: {
                ...usuarioActualizado,
                roles: usuarioActualizado.roles ? usuarioActualizado.roles.split(',') : []
            }
        });

    } catch (error) {
        console.error('❌ Error al actualizar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * 🗑️ Eliminar usuario (soft delete)
 */
async function eliminar(req, res) {
    try {
        const { id } = req.params;

        // Verificar que el usuario existe
        const usuarioExistente = await ejecutarConsulta(
            'SELECT id FROM usuarios WHERE id = ?',
            [id]
        );

        if (usuarioExistente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // No permitir eliminar el propio usuario
        if (parseInt(id) === req.usuario.id) {
            return res.status(400).json({
                success: false,
                message: 'No puedes eliminar tu propia cuenta'
            });
        }

        // Soft delete
        await ejecutarConsulta(
            'UPDATE usuarios SET activo = 0 WHERE id = ?',
            [id]
        );

        // Desactivar todos los roles
        await ejecutarConsulta(
            'UPDATE usuarios_roles SET activo = 0, fecha_revocacion = NOW() WHERE usuario_id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error al eliminar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * 🔄 Activar/desactivar usuario
 */
async function cambiarEstado(req, res) {
    try {
        const { id } = req.params;
        const { activo } = req.body;

        if (activo === undefined) {
            return res.status(400).json({
                success: false,
                message: 'El estado es obligatorio'
            });
        }

        // Verificar que el usuario existe
        const usuarioExistente = await ejecutarConsulta(
            'SELECT id FROM usuarios WHERE id = ?',
            [id]
        );

        if (usuarioExistente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // No permitir desactivar el propio usuario
        if (parseInt(id) === req.usuario.id && !activo) {
            return res.status(400).json({
                success: false,
                message: 'No puedes desactivar tu propia cuenta'
            });
        }

        await ejecutarConsulta(
            'UPDATE usuarios SET activo = ? WHERE id = ?',
            [activo ? 1 : 0, id]
        );

        res.json({
            success: true,
            message: `Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`
        });

    } catch (error) {
        console.error('❌ Error al cambiar estado:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * 📊 Obtener estadísticas de usuarios
 */
async function obtenerEstadisticas(req, res) {
    try {
        const estadisticas = await ejecutarConsulta(`
            SELECT 
                COUNT(*) as total_usuarios,
                SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) as usuarios_activos,
                SUM(CASE WHEN activo = 0 THEN 1 ELSE 0 END) as usuarios_inactivos,
                SUM(CASE WHEN ultimo_acceso >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as activos_ultima_semana,
                SUM(CASE WHEN ultimo_acceso >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as activos_ultimo_mes
            FROM usuarios
        `);

        const estadisticasRoles = await ejecutarConsulta(`
            SELECT 
                ur.rol,
                COUNT(*) as total_usuarios
            FROM usuarios_roles ur
            JOIN usuarios u ON ur.usuario_id = u.id
            WHERE ur.activo = 1 AND u.activo = 1
            GROUP BY ur.rol
        `);

        res.json({
            success: true,
            estadisticas: {
                ...estadisticas[0],
                por_roles: estadisticasRoles
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

module.exports = {
    listar,
    obtenerPorId,
    crear,
    actualizar,
    eliminar,
    cambiarEstado,
    obtenerEstadisticas
};