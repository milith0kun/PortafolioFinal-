/**
 * 🔐 CONTROLADOR DE GESTIÓN DE PERMISOS
 * 
 * Maneja los permisos asociados a cada rol:
 * - Listar permisos por rol
 * - Verificar permisos específicos
 * - Actualizar permisos de roles
 * - Crear permisos personalizados
 * - Matriz de permisos del sistema
 * 
 * Rutas que maneja:
 * GET /api/v1/roles/:rol/permisos - Permisos de rol
 * PUT /api/v1/roles/:rol/permisos - Actualizar permisos
 * GET /api/v1/permisos - Listar todos los permisos
 */

// TODO: Sistema flexible de permisos basado en recursos y acciones
// TODO: Herencia de permisos entre roles
// TODO: Permisos dinámicos según contexto (ej: solo mis documentos)
// TODO: Cache de permisos para optimizar rendimiento
// ============================================================
// 🔐 CONTROLADOR DE GESTIÓN DE PERMISOS
// Sistema Portafolio Docente UNSAAC
// ============================================================

const permisosServicio = require('../../servicios/gestion-usuarios/permisos.servicio');
const { manejarError, respuestaExitosa } = require('../../utilidades/formato/datos.util');
const { validarPermisos, validarAsignacionPermisos } = require('../../validadores/usuarios/permisos.validador');
const { registrarAccion } = require('../../utilidades/base-datos/auditoria.util');

class PermisosControlador {

    // ===================================================
    // 📋 OBTENER TODOS LOS PERMISOS DISPONIBLES
    // ===================================================
    async obtenerPermisosDisponibles(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Solo administradores pueden ver todos los permisos
            if (!usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver la lista de permisos',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const { 
                modulo = '', 
                categoria = '', 
                incluir_descripcion = 'true' 
            } = req.query;

            // Obtener permisos disponibles organizados
            const permisos = await permisosServicio.obtenerPermisosDisponibles({
                modulo: modulo.trim(),
                categoria: categoria.trim(),
                incluir_descripcion: incluir_descripcion === 'true'
            });

            return respuestaExitosa(res, {
                permisos: permisos.permisos,
                estructura: permisos.estructura,
                estadisticas: permisos.estadisticas
            }, 'Permisos disponibles obtenidos correctamente');

        } catch (error) {
            console.error('Error al obtener permisos disponibles:', error);
            return manejarError(res, error, 'Error al obtener permisos disponibles');
        }
    }

    // ===================================================
    // 👤 OBTENER PERMISOS DE UN USUARIO ESPECÍFICO
    // ===================================================
    async obtenerPermisosUsuario(req, res) {
        try {
            const { usuario_id } = req.params;
            const usuarioActual = req.usuario;

            // Validar ID de usuario
            if (!usuario_id || isNaN(parseInt(usuario_id))) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'ID de usuario inválido',
                    codigo: 'ID_INVALIDO'
                });
            }

            const usuarioIdNum = parseInt(usuario_id);

            // Verificar permisos para consultar
            if (!this.puedeVerPermisosUsuario(usuarioActual, usuarioIdNum)) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver los permisos de este usuario',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const { rol_activo = '', incluir_heredados = 'true' } = req.query;

            // Obtener permisos del usuario
            const resultado = await permisosServicio.obtenerPermisosUsuario(usuarioIdNum, {
                rol_activo: rol_activo.trim(),
                incluir_heredados: incluir_heredados === 'true',
                usuario_consultor: usuarioActual
            });

            // Registrar consulta si es administrador viendo otro usuario
            if (usuarioActual.id !== usuarioIdNum && usuarioActual.roles_activos.includes('administrador')) {
                await registrarAccion({
                    usuario_id: usuarioActual.id,
                    accion: 'consultar',
                    modulo: 'permisos',
                    descripcion: `Consultó permisos del usuario ID: ${usuarioIdNum}`,
                    datos_adicionales: { usuario_consultado: usuarioIdNum },
                    ip: req.ip,
                    user_agent: req.get('User-Agent')
                });
            }

            return respuestaExitosa(res, {
                usuario_id: usuarioIdNum,
                permisos_directos: resultado.permisos_directos,
                permisos_por_rol: resultado.permisos_por_rol,
                permisos_efectivos: resultado.permisos_efectivos,
                roles_activos: resultado.roles_activos,
                resumen: resultado.resumen
            }, 'Permisos del usuario obtenidos correctamente');

        } catch (error) {
            console.error('Error al obtener permisos del usuario:', error);
            return manejarError(res, error, 'Error al obtener permisos del usuario');
        }
    }

    // ===================================================
    // 🎭 OBTENER PERMISOS POR ROL
    // ===================================================
    async obtenerPermisosPorRol(req, res) {
        try {
            const { rol } = req.params;
            const usuarioActual = req.usuario;

            // Validar rol
            const rolesValidos = ['administrador', 'verificador', 'docente'];
            if (!rolesValidos.includes(rol)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Rol inválido. Roles válidos: ' + rolesValidos.join(', '),
                    codigo: 'ROL_INVALIDO'
                });
            }

            // Solo administradores pueden ver permisos por rol
            if (!usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver permisos por rol',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const { incluir_usuarios = 'false' } = req.query;

            // Obtener permisos del rol
            const permisos = await permisosServicio.obtenerPermisosPorRol(rol, {
                incluir_usuarios: incluir_usuarios === 'true'
            });

            return respuestaExitosa(res, {
                rol,
                permisos: permisos.permisos,
                descripcion_rol: permisos.descripcion,
                usuarios_con_rol: permisos.usuarios || null,
                estadisticas: permisos.estadisticas
            }, `Permisos del rol ${rol} obtenidos correctamente`);

        } catch (error) {
            console.error('Error al obtener permisos por rol:', error);
            return manejarError(res, error, 'Error al obtener permisos por rol');
        }
    }

    // ===================================================
    // ➕ ASIGNAR PERMISOS A USUARIO
    // ===================================================
    async asignarPermisosUsuario(req, res) {
        try {
            const { usuario_id } = req.params;
            const usuarioActual = req.usuario;

            // Validar ID de usuario
            if (!usuario_id || isNaN(parseInt(usuario_id))) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'ID de usuario inválido',
                    codigo: 'ID_INVALIDO'
                });
            }

            const usuarioIdNum = parseInt(usuario_id);

            // Solo administradores pueden asignar permisos
            if (!usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para asignar permisos',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            // Validar datos de entrada
            const { error, value: datosValidados } = validarAsignacionPermisos(req.body);
            if (error) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Datos de asignación de permisos inválidos',
                    errores: error.details.map(det => ({
                        campo: det.path.join('.'),
                        mensaje: det.message
                    })),
                    codigo: 'DATOS_INVALIDOS'
                });
            }

            // Verificar que el usuario objetivo existe
            const usuarioObjetivo = await permisosServicio.verificarUsuarioExiste(usuarioIdNum);
            if (!usuarioObjetivo) {
                return res.status(404).json({
                    exito: false,
                    mensaje: 'Usuario no encontrado',
                    codigo: 'USUARIO_NO_ENCONTRADO'
                });
            }

            // Obtener permisos anteriores para auditoría
            const permisosAnteriores = await permisosServicio.obtenerPermisosUsuario(usuarioIdNum, {
                incluir_heredados: false,
                usuario_consultor: usuarioActual
            });

            // Asignar permisos
            const resultado = await permisosServicio.asignarPermisosUsuario(usuarioIdNum, {
                permisos: datosValidados.permisos,
                tipo_operacion: datosValidados.tipo_operacion, // 'agregar', 'reemplazar', 'quitar'
                razon: datosValidados.razon,
                vigencia_hasta: datosValidados.vigencia_hasta
            }, usuarioActual);

            // Registrar auditoría
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'asignar_permisos',
                modulo: 'permisos',
                descripcion: `Asignó permisos al usuario ${usuarioObjetivo.nombres} ${usuarioObjetivo.apellidos}`,
                datos_anteriores: {
                    permisos_directos: permisosAnteriores.permisos_directos
                },
                datos_nuevos: {
                    permisos: datosValidados.permisos,
                    tipo_operacion: datosValidados.tipo_operacion,
                    razon: datosValidados.razon
                },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                usuario_id: usuarioIdNum,
                permisos_actualizados: resultado.permisos_nuevos,
                permisos_removidos: resultado.permisos_removidos,
                permisos_efectivos: resultado.permisos_efectivos,
                resumen_cambios: resultado.resumen
            }, 'Permisos asignados correctamente', 201);

        } catch (error) {
            console.error('Error al asignar permisos:', error);
            return manejarError(res, error, 'Error al asignar permisos');
        }
    }

    // ===================================================
    // ❌ REVOCAR PERMISOS DE USUARIO
    // ===================================================
    async revocarPermisosUsuario(req, res) {
        try {
            const { usuario_id } = req.params;
            const usuarioActual = req.usuario;

            // Validar ID de usuario
            if (!usuario_id || isNaN(parseInt(usuario_id))) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'ID de usuario inválido',
                    codigo: 'ID_INVALIDO'
                });
            }

            const usuarioIdNum = parseInt(usuario_id);

            // Solo administradores pueden revocar permisos
            if (!usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para revocar permisos',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const { 
                permisos_a_revocar = [], 
                revocar_todos = false, 
                razon = '' 
            } = req.body;

            // Validar datos
            if (!revocar_todos && (!permisos_a_revocar || permisos_a_revocar.length === 0)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Debe especificar permisos a revocar o marcar revocar_todos',
                    codigo: 'PERMISOS_NO_ESPECIFICADOS'
                });
            }

            // Verificar usuario existe
            const usuarioObjetivo = await permisosServicio.verificarUsuarioExiste(usuarioIdNum);
            if (!usuarioObjetivo) {
                return res.status(404).json({
                    exito: false,
                    mensaje: 'Usuario no encontrado',
                    codigo: 'USUARIO_NO_ENCONTRADO'
                });
            }

            // Obtener permisos antes de revocar para auditoría
            const permisosAnteriores = await permisosServicio.obtenerPermisosUsuario(usuarioIdNum, {
                incluir_heredados: false,
                usuario_consultor: usuarioActual
            });

            // Revocar permisos
            const resultado = await permisosServicio.revocarPermisosUsuario(usuarioIdNum, {
                permisos_a_revocar,
                revocar_todos,
                razon: razon.trim()
            }, usuarioActual);

            // Registrar auditoría
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'revocar_permisos',
                modulo: 'permisos',
                descripcion: `Revocó permisos del usuario ${usuarioObjetivo.nombres} ${usuarioObjetivo.apellidos}`,
                datos_anteriores: {
                    permisos_directos: permisosAnteriores.permisos_directos
                },
                datos_nuevos: {
                    permisos_revocados: resultado.permisos_revocados,
                    revocar_todos,
                    razon
                },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                usuario_id: usuarioIdNum,
                permisos_revocados: resultado.permisos_revocados,
                permisos_restantes: resultado.permisos_restantes,
                permisos_efectivos: resultado.permisos_efectivos
            }, 'Permisos revocados correctamente');

        } catch (error) {
            console.error('Error al revocar permisos:', error);
            return manejarError(res, error, 'Error al revocar permisos');
        }
    }

    // ===================================================
    // 🔍 VERIFICAR PERMISO ESPECÍFICO
    // ===================================================
    async verificarPermiso(req, res) {
        try {
            const { usuario_id, permiso } = req.params;
            const usuarioActual = req.usuario;

            // Validar parámetros
            if (!usuario_id || isNaN(parseInt(usuario_id))) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'ID de usuario inválido',
                    codigo: 'ID_INVALIDO'
                });
            }

            if (!permiso || permiso.trim().length === 0) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Permiso a verificar requerido',
                    codigo: 'PERMISO_REQUERIDO'
                });
            }

            const usuarioIdNum = parseInt(usuario_id);

            // Verificar permisos para consultar
            if (!this.puedeVerPermisosUsuario(usuarioActual, usuarioIdNum)) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para verificar permisos de este usuario',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const { contexto = '' } = req.query;

            // Verificar permiso específico
            const resultado = await permisosServicio.verificarPermisoEspecifico(usuarioIdNum, permiso.trim(), {
                contexto: contexto.trim(),
                usuario_consultor: usuarioActual
            });

            return respuestaExitosa(res, {
                usuario_id: usuarioIdNum,
                permiso: permiso.trim(),
                tiene_permiso: resultado.tiene_permiso,
                origen_permiso: resultado.origen, // 'directo', 'rol', 'heredado'
                rol_origen: resultado.rol_origen,
                restricciones: resultado.restricciones,
                vigencia: resultado.vigencia
            }, 'Verificación de permiso completada');

        } catch (error) {
            console.error('Error al verificar permiso:', error);
            return manejarError(res, error, 'Error al verificar permiso');
        }
    }

    // ===================================================
    // 📊 OBTENER ESTADÍSTICAS DE PERMISOS
    // ===================================================
    async obtenerEstadisticasPermisos(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Solo administradores pueden ver estadísticas
            if (!usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver estadísticas de permisos',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const { 
                incluir_usuarios = 'false',
                agrupar_por = 'rol' // 'rol', 'modulo', 'categoria'
            } = req.query;

            // Validar parámetro de agrupación
            const agrupacionesValidas = ['rol', 'modulo', 'categoria'];
            if (!agrupacionesValidas.includes(agrupar_por)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Agrupación inválida. Use: ' + agrupacionesValidas.join(', '),
                    codigo: 'AGRUPACION_INVALIDA'
                });
            }

            // Obtener estadísticas
            const estadisticas = await permisosServicio.obtenerEstadisticasPermisos({
                incluir_usuarios: incluir_usuarios === 'true',
                agrupar_por
            });

            return respuestaExitosa(res, {
                resumen_general: estadisticas.resumen,
                distribucion: estadisticas.distribucion,
                permisos_mas_usados: estadisticas.mas_usados,
                permisos_menos_usados: estadisticas.menos_usados,
                usuarios_con_mas_permisos: estadisticas.usuarios_destacados,
                tendencias: estadisticas.tendencias
            }, 'Estadísticas de permisos obtenidas correctamente');

        } catch (error) {
            console.error('Error al obtener estadísticas de permisos:', error);
            return manejarError(res, error, 'Error al obtener estadísticas de permisos');
        }
    }

    // ===================================================
    // 📋 OBTENER HISTORIAL DE CAMBIOS DE PERMISOS
    // ===================================================
    async obtenerHistorialPermisos(req, res) {
        try {
            const { usuario_id } = req.params;
            const usuarioActual = req.usuario;

            // Validar ID si se proporciona
            let usuarioIdNum = null;
            if (usuario_id) {
                if (isNaN(parseInt(usuario_id))) {
                    return res.status(400).json({
                        exito: false,
                        mensaje: 'ID de usuario inválido',
                        codigo: 'ID_INVALIDO'
                    });
                }
                usuarioIdNum = parseInt(usuario_id);
            }

            // Solo administradores pueden ver historial completo
            if (!usuarioActual.roles_activos.includes('administrador') && usuarioIdNum !== usuarioActual.id) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver el historial de permisos',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                pagina = 1,
                limite = 20,
                fecha_inicio = '',
                fecha_fin = '',
                tipo_accion = '' // 'asignar', 'revocar', 'modificar'
            } = req.query;

            // Construir filtros
            const filtros = {
                usuario_id: usuarioIdNum,
                pagina: parseInt(pagina),
                limite: parseInt(limite),
                fecha_inicio: fecha_inicio.trim(),
                fecha_fin: fecha_fin.trim(),
                tipo_accion: tipo_accion.trim()
            };

            // Obtener historial
            const historial = await permisosServicio.obtenerHistorialPermisos(filtros, usuarioActual);

            return respuestaExitosa(res, {
                historial: historial.registros,
                paginacion: historial.paginacion,
                resumen: historial.resumen,
                filtros_aplicados: filtros
            }, 'Historial de permisos obtenido correctamente');

        } catch (error) {
            console.error('Error al obtener historial de permisos:', error);
            return manejarError(res, error, 'Error al obtener historial de permisos');
        }
    }

    // ===================================================
    // 🔐 MÉTODOS DE VERIFICACIÓN DE PERMISOS
    // ===================================================
    puedeVerPermisosUsuario(usuario, usuarioId) {
        // Administradores pueden ver permisos de cualquier usuario
        if (usuario.roles_activos.includes('administrador')) return true;
        
        // Verificadores pueden ver permisos básicos de sus docentes asignados
        if (usuario.roles_activos.includes('verificador')) {
            // TODO: Verificar si el usuario es un docente asignado al verificador
            return true;
        }
        
        // Usuarios pueden ver sus propios permisos
        return usuario.id === usuarioId;
    }

    // ===================================================
    // 🔄 SINCRONIZAR PERMISOS CON ROLES
    // ===================================================
    async sincronizarPermisosRoles(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Solo administradores pueden sincronizar
            if (!usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para sincronizar permisos',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const { 
                forzar_sincronizacion = false,
                incluir_usuarios_inactivos = false 
            } = req.body;

            // Sincronizar permisos
            const resultado = await permisosServicio.sincronizarPermisosRoles({
                forzar_sincronizacion,
                incluir_usuarios_inactivos
            }, usuarioActual);

            // Registrar auditoría
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'sincronizar_permisos',
                modulo: 'permisos',
                descripcion: 'Sincronizó permisos con roles del sistema',
                datos_nuevos: {
                    usuarios_afectados: resultado.usuarios_afectados,
                    permisos_actualizados: resultado.permisos_actualizados
                },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                usuarios_procesados: resultado.usuarios_procesados,
                usuarios_afectados: resultado.usuarios_afectados,
                permisos_actualizados: resultado.permisos_actualizados,
                errores: resultado.errores,
                tiempo_procesamiento: resultado.tiempo_procesamiento
            }, 'Sincronización de permisos completada');

        } catch (error) {
            console.error('Error al sincronizar permisos:', error);
            return manejarError(res, error, 'Error al sincronizar permisos');
        }
    }
}

module.exports = new PermisosControlador();