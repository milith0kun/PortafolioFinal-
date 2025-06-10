/**
 * 🎛️ CONTROLADOR DE DASHBOARD DE ADMINISTRADOR
 * 
 * Dashboard específico para administradores del sistema:
 * - Métricas generales del sistema
 * - Estado de todos los portafolios
 * - Actividad de usuarios
 * - Alertas del sistema
 * - Métricas de rendimiento
 * 
 * Rutas que maneja:
 * GET /api/v1/tableros/administrador - Dashboard principal
 * GET /api/v1/tableros/administrador/metricas - Métricas detalladas
 * GET /api/v1/tableros/administrador/alertas - Alertas sistema
 */

// TODO: Vista panorámica de todo el sistema
// TODO: Métricas en tiempo real
// TODO: Alertas de sistema críticas
// TODO: Gestión de usuarios desde dashboard
// TODO: Accesos rápidos a funciones admin
// ============================================================
// 🎛️ CONTROLADOR DE DASHBOARD DE ADMINISTRADOR
// Sistema Portafolio Docente UNSAAC
// ============================================================

const tableroAdminServicio = require('../../servicios/tableros/administrador.servicio');
const { manejarError, respuestaExitosa } = require('../../utilidades/formato/datos.util');
const { validarRangoFechas } = require('../../validadores/comunes/generales.validador');
const { registrarAccion } = require('../../utilidades/base-datos/auditoria.util');

class TableroAdministradorControlador {

    // ===================================================
    // 🎛️ DASHBOARD PRINCIPAL DE ADMINISTRADOR
    // ===================================================
    async obtenerDashboardPrincipal(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar permisos de administrador
            if (!usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para acceder al dashboard de administrador',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const { 
                ciclo_id = '', 
                periodo = 'mes',
                incluir_historico = 'false' 
            } = req.query;

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
                ciclo_id: ciclo_id ? parseInt(ciclo_id) : null,
                periodo,
                incluir_historico: incluir_historico === 'true',
                usuario_admin: usuarioActual
            };

            // Obtener datos del dashboard
            const dashboard = await tableroAdminServicio.obtenerDashboardCompleto(parametros);

            // Registrar acceso al dashboard
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'consultar',
                modulo: 'tableros',
                descripcion: 'Accedió al dashboard de administrador',
                datos_adicionales: { periodo, ciclo_id },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                // Métricas principales
                metricas_generales: dashboard.metricas_generales,
                
                // Estado del sistema
                estado_sistema: dashboard.estado_sistema,
                
                // Actividad reciente
                actividad_reciente: dashboard.actividad_reciente,
                
                // Usuarios activos
                usuarios_activos: dashboard.usuarios_activos,
                
                // Portafolios
                resumen_portafolios: dashboard.resumen_portafolios,
                
                // Verificaciones
                estado_verificaciones: dashboard.estado_verificaciones,
                
                // Gráficos y tendencias
                graficos: dashboard.graficos,
                
                // Alertas críticas
                alertas_criticas: dashboard.alertas_criticas,
                
                // Accesos rápidos
                accesos_rapidos: dashboard.accesos_rapidos,
                
                // Metadatos
                ultima_actualizacion: dashboard.ultima_actualizacion,
                tiempo_respuesta: dashboard.tiempo_respuesta
            }, 'Dashboard de administrador obtenido correctamente');

        } catch (error) {
            console.error('Error al obtener dashboard de administrador:', error);
            return manejarError(res, error, 'Error al cargar dashboard de administrador');
        }
    }

    // ===================================================
    // 📊 MÉTRICAS DETALLADAS DEL SISTEMA
    // ===================================================
    async obtenerMetricasDetalladas(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar permisos
            if (!usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver métricas detalladas',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                categoria = 'todas', // 'usuarios', 'portafolios', 'documentos', 'verificaciones', 'sistema'
                periodo = 'mes',
                comparar_con_anterior = 'true',
                ciclo_id = '',
                formato_datos = 'completo' // 'completo', 'resumen'
            } = req.query;

            // Validar categoría
            const categoriasValidas = ['todas', 'usuarios', 'portafolios', 'documentos', 'verificaciones', 'sistema'];
            if (!categoriasValidas.includes(categoria)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Categoría inválida. Use: ' + categoriasValidas.join(', '),
                    codigo: 'CATEGORIA_INVALIDA'
                });
            }

            // Construir filtros
            const filtros = {
                categoria,
                periodo,
                comparar_con_anterior: comparar_con_anterior === 'true',
                ciclo_id: ciclo_id ? parseInt(ciclo_id) : null,
                formato_datos,
                usuario_admin: usuarioActual
            };

            // Obtener métricas detalladas
            const metricas = await tableroAdminServicio.obtenerMetricasDetalladas(filtros);

            return respuestaExitosa(res, {
                categoria_analizada: categoria,
                periodo_analizado: periodo,
                metricas_principales: metricas.principales,
                tendencias: metricas.tendencias,
                comparativas: metricas.comparativas,
                distribucion: metricas.distribucion,
                indicadores_clave: metricas.indicadores_clave,
                alertas_metricas: metricas.alertas,
                recomendaciones: metricas.recomendaciones
            }, 'Métricas detalladas obtenidas correctamente');

        } catch (error) {
            console.error('Error al obtener métricas detalladas:', error);
            return manejarError(res, error, 'Error al obtener métricas detalladas');
        }
    }

    // ===================================================
    // 🚨 ALERTAS Y NOTIFICACIONES DEL SISTEMA
    // ===================================================
    async obtenerAlertasSistema(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar permisos
            if (!usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver alertas del sistema',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                prioridad = 'todas', // 'critica', 'alta', 'media', 'baja', 'todas'
                estado = 'todas', // 'activas', 'resueltas', 'ignoradas', 'todas'
                categoria = 'todas', // 'sistema', 'seguridad', 'rendimiento', 'usuarios', 'datos'
                limite = 50
            } = req.query;

            // Validar parámetros
            const prioridadesValidas = ['critica', 'alta', 'media', 'baja', 'todas'];
            const estadosValidos = ['activas', 'resueltas', 'ignoradas', 'todas'];
            const categoriasValidas = ['sistema', 'seguridad', 'rendimiento', 'usuarios', 'datos', 'todas'];

            if (!prioridadesValidas.includes(prioridad)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Prioridad inválida',
                    codigo: 'PRIORIDAD_INVALIDA'
                });
            }

            // Construir filtros
            const filtros = {
                prioridad,
                estado,
                categoria,
                limite: Math.min(parseInt(limite) || 50, 100),
                usuario_admin: usuarioActual
            };

            // Obtener alertas del sistema
            const alertas = await tableroAdminServicio.obtenerAlertasSistema(filtros);

            return respuestaExitosa(res, {
                alertas_activas: alertas.activas,
                alertas_criticas: alertas.criticas,
                resumen_alertas: alertas.resumen,
                alertas_por_categoria: alertas.por_categoria,
                tendencias_alertas: alertas.tendencias,
                acciones_recomendadas: alertas.acciones_recomendadas
            }, 'Alertas del sistema obtenidas correctamente');

        } catch (error) {
            console.error('Error al obtener alertas del sistema:', error);
            return manejarError(res, error, 'Error al obtener alertas del sistema');
        }
    }

    // ===================================================
    // 👥 ACTIVIDAD RECIENTE DE USUARIOS
    // ===================================================
    async obtenerActividadReciente(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar permisos
            if (!usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver actividad reciente',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                horas = 24,
                tipo_actividad = 'todas', // 'login', 'documentos', 'verificacion', 'sistema'
                rol_usuario = 'todos', // 'administrador', 'verificador', 'docente'
                limite = 100,
                incluir_detalles = 'true'
            } = req.query;

            // Validar parámetros
            const horasNumero = Math.min(Math.max(parseInt(horas) || 24, 1), 168); // máximo 1 semana
            const limiteNumero = Math.min(parseInt(limite) || 100, 500);

            // Construir filtros
            const filtros = {
                horas: horasNumero,
                tipo_actividad,
                rol_usuario,
                limite: limiteNumero,
                incluir_detalles: incluir_detalles === 'true',
                usuario_admin: usuarioActual
            };

            // Obtener actividad reciente
            const actividad = await tableroAdminServicio.obtenerActividadReciente(filtros);

            return respuestaExitosa(res, {
                actividades: actividad.actividades,
                resumen_actividad: actividad.resumen,
                usuarios_mas_activos: actividad.usuarios_mas_activos,
                picos_actividad: actividad.picos_actividad,
                estadisticas_por_hora: actividad.estadisticas_por_hora,
                periodo_analizado: `${horasNumero} horas`
            }, 'Actividad reciente obtenida correctamente');

        } catch (error) {
            console.error('Error al obtener actividad reciente:', error);
            return manejarError(res, error, 'Error al obtener actividad reciente');
        }
    }

    // ===================================================
    // 📈 ESTADÍSTICAS DE RENDIMIENTO
    // ===================================================
    async obtenerEstadisticasRendimiento(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar permisos
            if (!usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver estadísticas de rendimiento',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                periodo = 'semana',
                incluir_predicciones = 'false',
                detallar_por_modulo = 'true'
            } = req.query;

            // Construir parámetros
            const parametros = {
                periodo,
                incluir_predicciones: incluir_predicciones === 'true',
                detallar_por_modulo: detallar_por_modulo === 'true',
                usuario_admin: usuarioActual
            };

            // Obtener estadísticas de rendimiento
            const rendimiento = await tableroAdminServicio.obtenerEstadisticasRendimiento(parametros);

            return respuestaExitosa(res, {
                metricas_sistema: rendimiento.sistema,
                rendimiento_base_datos: rendimiento.base_datos,
                uso_recursos: rendimiento.recursos,
                tiempos_respuesta: rendimiento.tiempos_respuesta,
                carga_usuarios: rendimiento.carga_usuarios,
                predicciones: rendimiento.predicciones || null,
                recomendaciones_optimizacion: rendimiento.recomendaciones
            }, 'Estadísticas de rendimiento obtenidas correctamente');

        } catch (error) {
            console.error('Error al obtener estadísticas de rendimiento:', error);
            return manejarError(res, error, 'Error al obtener estadísticas de rendimiento');
        }
    }

    // ===================================================
    // 🔧 ACCIONES RÁPIDAS DE ADMINISTRACIÓN
    // ===================================================
    async ejecutarAccionRapida(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar permisos
            if (!usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ejecutar acciones de administración',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const { accion, parametros = {} } = req.body;

            // Validar acción
            const accionesValidas = [
                'limpiar_cache',
                'optimizar_base_datos',
                'generar_backup',
                'enviar_notificaciones_masivas',
                'actualizar_estadisticas',
                'cerrar_sesiones_inactivas',
                'verificar_integridad_datos'
            ];

            if (!accionesValidas.includes(accion)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Acción inválida. Acciones válidas: ' + accionesValidas.join(', '),
                    codigo: 'ACCION_INVALIDA'
                });
            }

            // Ejecutar acción rápida
            const resultado = await tableroAdminServicio.ejecutarAccionRapida(accion, parametros, usuarioActual);

            // Registrar acción crítica
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'accion_rapida',
                modulo: 'tableros',
                descripcion: `Ejecutó acción rápida: ${accion}`,
                datos_nuevos: { accion, parametros, resultado: resultado.resumen },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                accion_ejecutada: accion,
                resultado: resultado.detalle,
                tiempo_ejecucion: resultado.tiempo,
                mensaje_resultado: resultado.mensaje,
                alertas_generadas: resultado.alertas || []
            }, `Acción ${accion} ejecutada correctamente`);

        } catch (error) {
            console.error('Error al ejecutar acción rápida:', error);
            return manejarError(res, error, 'Error al ejecutar acción rápida');
        }
    }

    // ===================================================
    // 📊 RESUMEN EJECUTIVO PARA REPORTES
    // ===================================================
    async obtenerResumenEjecutivo(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar permisos
            if (!usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver resumen ejecutivo',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                fecha_inicio = '',
                fecha_fin = '',
                incluir_graficos = 'true',
                nivel_detalle = 'medio' // 'alto', 'medio', 'bajo'
            } = req.query;

            // Validar rango de fechas si se proporciona
            let fechasValidadas = null;
            if (fecha_inicio || fecha_fin) {
                const { error, value } = validarRangoFechas({ fecha_inicio, fecha_fin });
                if (error) {
                    return res.status(400).json({
                        exito: false,
                        mensaje: 'Rango de fechas inválido',
                        errores: error.details.map(det => det.message),
                        codigo: 'FECHAS_INVALIDAS'
                    });
                }
                fechasValidadas = value;
            }

            // Construir parámetros
            const parametros = {
                ...fechasValidadas,
                incluir_graficos: incluir_graficos === 'true',
                nivel_detalle,
                usuario_admin: usuarioActual
            };

            // Obtener resumen ejecutivo
            const resumen = await tableroAdminServicio.obtenerResumenEjecutivo(parametros);

            return respuestaExitosa(res, {
                periodo_analizado: resumen.periodo,
                resumen_ejecutivo: resumen.ejecutivo,
                indicadores_clave: resumen.indicadores,
                tendencias_principales: resumen.tendencias,
                areas_atencion: resumen.areas_atencion,
                logros_destacados: resumen.logros,
                recomendaciones_estrategicas: resumen.recomendaciones,
                graficos: resumen.graficos || null
            }, 'Resumen ejecutivo obtenido correctamente');

        } catch (error) {
            console.error('Error al obtener resumen ejecutivo:', error);
            return manejarError(res, error, 'Error al obtener resumen ejecutivo');
        }
    }

    // ===================================================
    // 🔄 ACTUALIZAR DATOS DEL DASHBOARD
    // ===================================================
    async actualizarDatosDashboard(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar permisos
            if (!usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para actualizar datos del dashboard',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const { 
                forzar_actualizacion = false,
                componentes = [] // array de componentes específicos a actualizar
            } = req.body;

            // Actualizar datos del dashboard
            const actualizacion = await tableroAdminServicio.actualizarDatosDashboard({
                forzar_actualizacion,
                componentes,
                usuario_admin: usuarioActual
            });

            // Registrar actualización
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'actualizar_dashboard',
                modulo: 'tableros',
                descripcion: 'Actualizó datos del dashboard de administrador',
                datos_adicionales: { 
                    forzar_actualizacion, 
                    componentes_actualizados: actualizacion.componentes_procesados 
                },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                componentes_actualizados: actualizacion.componentes_procesados,
                tiempo_actualizacion: actualizacion.tiempo,
                cache_limpiado: actualizacion.cache_limpiado,
                errores: actualizacion.errores || [],
                siguiente_actualizacion: actualizacion.siguiente_actualizacion
            }, 'Datos del dashboard actualizados correctamente');

        } catch (error) {
            console.error('Error al actualizar datos del dashboard:', error);
            return manejarError(res, error, 'Error al actualizar datos del dashboard');
        }
    }
}

module.exports = new TableroAdministradorControlador();