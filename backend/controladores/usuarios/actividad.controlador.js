/**
 * 📊 CONTROLADOR DE ACTIVIDAD DE USUARIOS
 * 
 * Rastrea y muestra la actividad de los usuarios:
 * - Historial de acciones del usuario
 * - Últimos accesos al sistema
 * - Estadísticas de uso personal
 * - Log de cambios realizados
 * - Tiempo de permanencia en el sistema
 * 
 * Rutas que maneja:
 * GET /api/v1/usuarios/:id/actividad - Historial de actividad
 * GET /api/v1/usuarios/mi-actividad - Mi actividad
 * GET /api/v1/usuarios/:id/estadisticas - Estadísticas de uso
 */

// TODO: Registrar todas las acciones importantes del usuario
// TODO: Mostrar historial paginado de actividades
// TODO: Generar estadísticas de uso (documentos subidos, tiempo en sistema)
// TODO: Filtros por tipo de actividad y rango de fechas
// ============================================================
// 📊 CONTROLADOR DE ACTIVIDAD DE USUARIOS
// Sistema Portafolio Docente UNSAAC
// ============================================================

const actividadServicio = require('../../servicios/gestion-usuarios/actividad.servicio');
const { manejarError, respuestaExitosa } = require('../../utilidades/formato/datos.util');
const { validarRangoFechas, validarPaginacion } = require('../../validadores/comunes/generales.validador');
const { registrarAccion } = require('../../utilidades/base-datos/auditoria.util');

class ActividadUsuariosControlador {

    // ===================================================
    // 📈 OBTENER HISTORIAL DE ACTIVIDAD DE UN USUARIO
    // ===================================================
    async obtenerActividadUsuario(req, res) {
        try {
            const { id } = req.params;
            const usuarioActual = req.usuario;
            
            const {
                pagina = 1,
                limite = 20,
                tipo_actividad = '',
                fecha_inicio = '',
                fecha_fin = '',
                modulo = ''
            } = req.query;

            // Validar ID de usuario
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'ID de usuario inválido',
                    codigo: 'ID_INVALIDO'
                });
            }

            const usuarioId = parseInt(id);

            // Verificar permisos para ver actividad
            if (!this.puedeVerActividad(usuarioActual, usuarioId)) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver la actividad de este usuario',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            // Validar parámetros de paginación
            const { error: errorPaginacion, value: paginacionValidada } = validarPaginacion({
                pagina: parseInt(pagina),
                limite: parseInt(limite)
            });

            if (errorPaginacion) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Parámetros de paginación inválidos',
                    errores: errorPaginacion.details.map(det => det.message),
                    codigo: 'PAGINACION_INVALIDA'
                });
            }

            // Validar rango de fechas si se proporciona
            let fechasValidadas = null;
            if (fecha_inicio || fecha_fin) {
                const { error: errorFechas, value: fechas } = validarRangoFechas({
                    fecha_inicio,
                    fecha_fin
                });

                if (errorFechas) {
                    return res.status(400).json({
                        exito: false,
                        mensaje: 'Rango de fechas inválido',
                        errores: errorFechas.details.map(det => det.message),
                        codigo: 'FECHAS_INVALIDAS'
                    });
                }
                fechasValidadas = fechas;
            }

            // Construir filtros
            const filtros = {
                usuario_id: usuarioId,
                ...paginacionValidada,
                tipo_actividad: tipo_actividad.trim(),
                modulo: modulo.trim(),
                ...fechasValidadas
            };

            // Obtener actividad del usuario
            const resultado = await actividadServicio.obtenerActividadUsuario(filtros, usuarioActual);

            // Registrar consulta de actividad (solo para administradores consultando otros usuarios)
            if (usuarioActual.id !== usuarioId && usuarioActual.roles_activos.includes('administrador')) {
                await registrarAccion({
                    usuario_id: usuarioActual.id,
                    accion: 'consultar',
                    modulo: 'usuarios',
                    descripcion: `Consultó actividad del usuario ID: ${usuarioId}`,
                    datos_adicionales: { usuario_consultado: usuarioId, filtros },
                    ip: req.ip,
                    user_agent: req.get('User-Agent')
                });
            }

            return respuestaExitosa(res, {
                actividades: resultado.actividades,
                paginacion: resultado.paginacion,
                resumen: resultado.resumen,
                filtros_aplicados: filtros
            }, 'Historial de actividad obtenido correctamente');

        } catch (error) {
            console.error('Error al obtener actividad del usuario:', error);
            return manejarError(res, error, 'Error al obtener historial de actividad');
        }
    }

    // ===================================================
    // 👤 OBTENER MI PROPIA ACTIVIDAD
    // ===================================================
    async obtenerMiActividad(req, res) {
        try {
            const usuarioActual = req.usuario;
            
            const {
                pagina = 1,
                limite = 15,
                tipo_actividad = '',
                dias = 30,
                modulo = ''
            } = req.query;

            // Validar parámetros
            const { error: errorPaginacion, value: paginacionValidada } = validarPaginacion({
                pagina: parseInt(pagina),
                limite: parseInt(limite)
            });

            if (errorPaginacion) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Parámetros de paginación inválidos',
                    codigo: 'PAGINACION_INVALIDA'
                });
            }

            // Calcular fecha de inicio basada en días
            const diasNumero = parseInt(dias) || 30;
            const fechaInicio = new Date();
            fechaInicio.setDate(fechaInicio.getDate() - diasNumero);

            // Construir filtros
            const filtros = {
                usuario_id: usuarioActual.id,
                ...paginacionValidada,
                tipo_actividad: tipo_actividad.trim(),
                modulo: modulo.trim(),
                fecha_inicio: fechaInicio.toISOString().split('T')[0],
                fecha_fin: new Date().toISOString().split('T')[0]
            };

            // Obtener mi actividad
            const resultado = await actividadServicio.obtenerMiActividad(filtros, usuarioActual);

            return respuestaExitosa(res, {
                actividades: resultado.actividades,
                paginacion: resultado.paginacion,
                resumen_personal: resultado.resumen_personal,
                estadisticas_rapidas: resultado.estadisticas_rapidas
            }, 'Tu actividad obtenida correctamente');

        } catch (error) {
            console.error('Error al obtener mi actividad:', error);
            return manejarError(res, error, 'Error al obtener tu actividad');
        }
    }

    // ===================================================
    // 📊 OBTENER ESTADÍSTICAS DE USO DE UN USUARIO
    // ===================================================
    async obtenerEstadisticasUsuario(req, res) {
        try {
            const { id } = req.params;
            const usuarioActual = req.usuario;
            
            const {
                periodo = 'mes',
                incluir_comparativa = 'false',
                ciclo_id = ''
            } = req.query;

            // Validar ID de usuario
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'ID de usuario inválido',
                    codigo: 'ID_INVALIDO'
                });
            }

            const usuarioId = parseInt(id);

            // Verificar permisos
            if (!this.puedeVerEstadisticas(usuarioActual, usuarioId)) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver las estadísticas de este usuario',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            // Validar período
            const periodosValidos = ['semana', 'mes', 'trimestre', 'semestre', 'año'];
            if (!periodosValidos.includes(periodo)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Período inválido. Use: ' + periodosValidos.join(', '),
                    codigo: 'PERIODO_INVALIDO'
                });
            }

            // Construir parámetros
            const parametros = {
                usuario_id: usuarioId,
                periodo,
                incluir_comparativa: incluir_comparativa === 'true',
                ciclo_id: ciclo_id ? parseInt(ciclo_id) : null
            };

            // Obtener estadísticas completas
            const estadisticas = await actividadServicio.obtenerEstadisticasUsuario(parametros, usuarioActual);

            // Registrar consulta de estadísticas (si es administrador consultando otro usuario)
            if (usuarioActual.id !== usuarioId && usuarioActual.roles_activos.includes('administrador')) {
                await registrarAccion({
                    usuario_id: usuarioActual.id,
                    accion: 'consultar',
                    modulo: 'usuarios',
                    descripcion: `Consultó estadísticas del usuario ID: ${usuarioId}`,
                    datos_adicionales: { usuario_consultado: usuarioId, periodo },
                    ip: req.ip,
                    user_agent: req.get('User-Agent')
                });
            }

            return respuestaExitosa(res, {
                estadisticas: estadisticas.metricas,
                graficos: estadisticas.graficos,
                comparativas: estadisticas.comparativas,
                resumen_ejecutivo: estadisticas.resumen_ejecutivo,
                periodo_analizado: periodo
            }, 'Estadísticas de usuario obtenidas correctamente');

        } catch (error) {
            console.error('Error al obtener estadísticas del usuario:', error);
            return manejarError(res, error, 'Error al obtener estadísticas del usuario');
        }
    }

    // ===================================================
    // ⏰ OBTENER SESIONES ACTIVAS DEL USUARIO
    // ===================================================
    async obtenerSesionesActivas(req, res) {
        try {
            const { id } = req.params;
            const usuarioActual = req.usuario;

            // Validar ID
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'ID de usuario inválido',
                    codigo: 'ID_INVALIDO'
                });
            }

            const usuarioId = parseInt(id);

            // Verificar permisos (solo el propio usuario o administradores)
            if (usuarioActual.id !== usuarioId && !usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver las sesiones de este usuario',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            // Obtener sesiones activas
            const sesiones = await actividadServicio.obtenerSesionesActivas(usuarioId, usuarioActual);

            return respuestaExitosa(res, {
                sesiones_activas: sesiones.activas,
                sesion_actual: sesiones.actual,
                historial_reciente: sesiones.historial_reciente
            }, 'Sesiones activas obtenidas correctamente');

        } catch (error) {
            console.error('Error al obtener sesiones activas:', error);
            return manejarError(res, error, 'Error al obtener sesiones activas');
        }
    }

    // ===================================================
    // 📱 CERRAR SESIÓN REMOTA
    // ===================================================
    async cerrarSesionRemota(req, res) {
        try {
            const { id } = req.params;
            const { session_id } = req.body;
            const usuarioActual = req.usuario;

            // Validaciones
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'ID de usuario inválido',
                    codigo: 'ID_INVALIDO'
                });
            }

            if (!session_id) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'ID de sesión requerido',
                    codigo: 'SESSION_ID_REQUERIDO'
                });
            }

            const usuarioId = parseInt(id);

            // Verificar permisos (solo el propio usuario o administradores)
            if (usuarioActual.id !== usuarioId && !usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para cerrar sesiones de este usuario',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            // Cerrar sesión remota
            const resultado = await actividadServicio.cerrarSesionRemota(usuarioId, session_id, usuarioActual);

            // Registrar acción
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'cerrar_sesion_remota',
                modulo: 'usuarios',
                descripcion: `Cerró sesión remota del usuario ID: ${usuarioId}, Sesión: ${session_id}`,
                datos_adicionales: { usuario_afectado: usuarioId, session_id },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, resultado, 'Sesión cerrada remotamente');

        } catch (error) {
            console.error('Error al cerrar sesión remota:', error);
            return manejarError(res, error, 'Error al cerrar sesión remota');
        }
    }

    // ===================================================
    // 📈 OBTENER RESUMEN DE ACTIVIDAD RECIENTE
    // ===================================================
    async obtenerResumenActividad(req, res) {
        try {
            const { id } = req.params;
            const usuarioActual = req.usuario;
            
            const { dias = 7 } = req.query;

            // Validar ID
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'ID de usuario inválido',
                    codigo: 'ID_INVALIDO'
                });
            }

            const usuarioId = parseInt(id);

            // Verificar permisos
            if (!this.puedeVerActividad(usuarioActual, usuarioId)) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver el resumen de actividad',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            // Validar días
            const diasNumero = Math.min(Math.max(parseInt(dias) || 7, 1), 90);

            // Obtener resumen de actividad
            const resumen = await actividadServicio.obtenerResumenActividad(usuarioId, diasNumero, usuarioActual);

            return respuestaExitosa(res, {
                resumen_actividad: resumen.resumen,
                tendencias: resumen.tendencias,
                actividades_destacadas: resumen.destacadas,
                periodo_analizado: `${diasNumero} días`
            }, 'Resumen de actividad obtenido correctamente');

        } catch (error) {
            console.error('Error al obtener resumen de actividad:', error);
            return manejarError(res, error, 'Error al obtener resumen de actividad');
        }
    }

    // ===================================================
    // 🔒 MÉTODOS DE VERIFICACIÓN DE PERMISOS
    // ===================================================
    puedeVerActividad(usuario, usuarioId) {
        // Administradores pueden ver toda la actividad
        if (usuario.roles_activos.includes('administrador')) return true;
        
        // Verificadores pueden ver actividad de sus docentes asignados
        if (usuario.roles_activos.includes('verificador')) {
            // TODO: Verificar si el usuario es un docente asignado al verificador
            return true;
        }
        
        // Usuarios pueden ver su propia actividad
        return usuario.id === usuarioId;
    }

    puedeVerEstadisticas(usuario, usuarioId) {
        // Administradores pueden ver todas las estadísticas
        if (usuario.roles_activos.includes('administrador')) return true;
        
        // Verificadores pueden ver estadísticas básicas de sus docentes
        if (usuario.roles_activos.includes('verificador')) {
            // TODO: Verificar si el usuario es un docente asignado al verificador
            return true;
        }
        
        // Usuarios pueden ver sus propias estadísticas
        return usuario.id === usuarioId;
    }

    // ===================================================
    // 🗂️ EXPORTAR ACTIVIDAD A EXCEL/PDF
    // ===================================================
    async exportarActividad(req, res) {
        try {
            const { id } = req.params;
            const { formato = 'excel', periodo = 'mes' } = req.query;
            const usuarioActual = req.usuario;

            // Validaciones
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'ID de usuario inválido',
                    codigo: 'ID_INVALIDO'
                });
            }

            const usuarioId = parseInt(id);

            // Verificar permisos
            if (!this.puedeVerActividad(usuarioActual, usuarioId)) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para exportar la actividad',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            // Validar formato
            if (!['excel', 'pdf'].includes(formato)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Formato inválido. Use: excel o pdf',
                    codigo: 'FORMATO_INVALIDO'
                });
            }

            // Generar exportación
            const archivo = await actividadServicio.exportarActividad(usuarioId, formato, periodo, usuarioActual);

            // Registrar exportación
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'exportar',
                modulo: 'usuarios',
                descripcion: `Exportó actividad del usuario ID: ${usuarioId} en formato ${formato}`,
                datos_adicionales: { usuario_exportado: usuarioId, formato, periodo },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            // Configurar headers para descarga
            const extension = formato === 'excel' ? 'xlsx' : 'pdf';
            const mimeType = formato === 'excel' ? 
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 
                'application/pdf';

            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="actividad_usuario_${usuarioId}.${extension}"`);

            return res.send(archivo.buffer);

        } catch (error) {
            console.error('Error al exportar actividad:', error);
            return manejarError(res, error, 'Error al exportar actividad');
        }
    }
}

module.exports = new ActividadUsuariosControlador();