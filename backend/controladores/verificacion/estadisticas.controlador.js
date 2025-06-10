/**
 * 📊 CONTROLADOR DE ESTADÍSTICAS DE VERIFICACIÓN
 * 
 * Genera métricas y estadísticas del proceso de verificación:
 * - Tiempos promedio de verificación
 * - Tasas de aprobación/rechazo
 * - Rendimiento por verificador
 * - Tendencias de calidad
 * - Reportes de eficiencia
 * 
 * Rutas que maneja:
 * GET /api/v1/verificacion/estadisticas/general - Estadísticas generales
 * GET /api/v1/verificacion/estadisticas/verificador/:id - Por verificador
 * GET /api/v1/verificacion/estadisticas/tendencias - Tendencias temporales
 */

// TODO: Dashboard en tiempo real de métricas
// TODO: Alertas de desviaciones en tiempos
// TODO: Comparativas entre períodos
// TODO: Indicadores de calidad del proceso
// TODO: Exportación de estadísticas
// ============================================================
// 📊 CONTROLADOR DE ESTADÍSTICAS DE VERIFICACIÓN
// Sistema Portafolio Docente UNSAAC
// ============================================================

const estadisticasServicio = require('../../servicios/verificacion/estadisticas.servicio');
const { manejarError, respuestaExitosa } = require('../../utilidades/formato/datos.util');
const { validarRangoFechas } = require('../../validadores/comunes/generales.validador');
const { registrarAccion } = require('../../utilidades/base-datos/auditoria.util');

class EstadisticasVerificacionControlador {

    // ===================================================
    // 📊 ESTADÍSTICAS GENERALES DE VERIFICACIÓN
    // ===================================================
    async obtenerEstadisticasGenerales(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar permisos (administradores y verificadores)
            if (!usuarioActual.roles_activos.includes('administrador') && 
                !usuarioActual.roles_activos.includes('verificador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver estadísticas de verificación',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                ciclo_id = '',
                fecha_inicio = '',
                fecha_fin = '',
                incluir_graficos = 'true',
                nivel_detalle = 'medio', // 'alto', 'medio', 'bajo'
                comparar_con_anterior = 'true'
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
                ciclo_id: ciclo_id ? parseInt(ciclo_id) : null,
                ...fechasValidadas,
                incluir_graficos: incluir_graficos === 'true',
                nivel_detalle,
                comparar_con_anterior: comparar_con_anterior === 'true',
                usuario_consultor: usuarioActual
            };

            // Obtener estadísticas generales
            const estadisticas = await estadisticasServicio.obtenerEstadisticasGenerales(parametros);

            // Registrar consulta si es administrador
            if (usuarioActual.roles_activos.includes('administrador')) {
                await registrarAccion({
                    usuario_id: usuarioActual.id,
                    accion: 'consultar',
                    modulo: 'estadisticas_verificacion',
                    descripcion: 'Consultó estadísticas generales de verificación',
                    datos_adicionales: { ciclo_id, nivel_detalle },
                    ip: req.ip,
                    user_agent: req.get('User-Agent')
                });
            }

            return respuestaExitosa(res, {
                resumen_general: estadisticas.resumen,
                metricas_clave: estadisticas.metricas_clave,
                distribucion_estados: estadisticas.distribucion_estados,
                tiempos_verificacion: estadisticas.tiempos_verificacion,
                tasas_aprobacion: estadisticas.tasas_aprobacion,
                rendimiento_verificadores: estadisticas.rendimiento_verificadores,
                tendencias_temporales: estadisticas.tendencias,
                comparativas: estadisticas.comparativas || null,
                graficos: estadisticas.graficos || null,
                alertas_rendimiento: estadisticas.alertas
            }, 'Estadísticas generales obtenidas correctamente');

        } catch (error) {
            console.error('Error al obtener estadísticas generales:', error);
            return manejarError(res, error, 'Error al obtener estadísticas generales');
        }
    }

    // ===================================================
    // 👤 ESTADÍSTICAS POR VERIFICADOR ESPECÍFICO
    // ===================================================
    async obtenerEstadisticasVerificador(req, res) {
        try {
            const { verificador_id } = req.params;
            const usuarioActual = req.usuario;

            // Validar ID de verificador
            if (!verificador_id || isNaN(parseInt(verificador_id))) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'ID de verificador inválido',
                    codigo: 'ID_INVALIDO'
                });
            }

            const verificadorIdNum = parseInt(verificador_id);

            // Verificar permisos
            if (!this.puedeVerEstadisticasVerificador(usuarioActual, verificadorIdNum)) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver estadísticas de este verificador',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                periodo = 'mes', // 'semana', 'mes', 'trimestre', 'ciclo', 'año'
                incluir_comparativas = 'true',
                incluir_tendencias = 'true',
                detalle_documentos = 'false'
            } = req.query;

            // Construir parámetros
            const parametros = {
                verificador_id: verificadorIdNum,
                periodo,
                incluir_comparativas: incluir_comparativas === 'true',
                incluir_tendencias: incluir_tendencias === 'true',
                detalle_documentos: detalle_documentos === 'true',
                usuario_consultor: usuarioActual
            };

            // Obtener estadísticas del verificador
            const estadisticas = await estadisticasServicio.obtenerEstadisticasVerificador(parametros);

            // Registrar consulta si es administrador viendo otro verificador
            if (usuarioActual.id !== verificadorIdNum && usuarioActual.roles_activos.includes('administrador')) {
                await registrarAccion({
                    usuario_id: usuarioActual.id,
                    accion: 'consultar',
                    modulo: 'estadisticas_verificacion',
                    descripcion: `Consultó estadísticas del verificador ID: ${verificadorIdNum}`,
                    datos_adicionales: { verificador_consultado: verificadorIdNum, periodo },
                    ip: req.ip,
                    user_agent: req.get('User-Agent')
                });
            }

            return respuestaExitosa(res, {
                verificador_info: estadisticas.verificador_info,
                resumen_actividad: estadisticas.resumen_actividad,
                metricas_rendimiento: estadisticas.metricas_rendimiento,
                distribucion_verificaciones: estadisticas.distribucion_verificaciones,
                tiempo_promedio_verificacion: estadisticas.tiempo_promedio,
                calidad_verificacion: estadisticas.calidad_verificacion,
                comparativas_sistema: estadisticas.comparativas || null,
                tendencias_temporales: estadisticas.tendencias || null,
                areas_fortaleza: estadisticas.areas_fortaleza,
                areas_mejora: estadisticas.areas_mejora,
                reconocimientos: estadisticas.reconocimientos,
                documentos_detalle: estadisticas.documentos_detalle || null
            }, 'Estadísticas del verificador obtenidas correctamente');

        } catch (error) {
            console.error('Error al obtener estadísticas del verificador:', error);
            return manejarError(res, error, 'Error al obtener estadísticas del verificador');
        }
    }

    // ===================================================
    // 📈 TENDENCIAS TEMPORALES DE VERIFICACIÓN
    // ===================================================
    async obtenerTendenciasTemporales(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar permisos
            if (!usuarioActual.roles_activos.includes('administrador') && 
                !usuarioActual.roles_activos.includes('verificador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver tendencias de verificación',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                periodo_analisis = 'ultimo_trimestre', // 'ultimo_mes', 'ultimo_trimestre', 'ultimo_semestre', 'ultimo_año'
                granularidad = 'semanal', // 'diaria', 'semanal', 'mensual'
                metricas = 'todas', // 'tiempos', 'aprobaciones', 'calidad', 'todas'
                verificador_id = '',
                incluir_predicciones = 'false'
            } = req.query;

            // Validar parámetros
            const periodosValidos = ['ultimo_mes', 'ultimo_trimestre', 'ultimo_semestre', 'ultimo_año'];
            const granularidadesValidas = ['diaria', 'semanal', 'mensual'];

            if (!periodosValidos.includes(periodo_analisis)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Período de análisis inválido',
                    codigo: 'PERIODO_INVALIDO'
                });
            }

            if (!granularidadesValidas.includes(granularidad)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Granularidad inválida',
                    codigo: 'GRANULARIDAD_INVALIDA'
                });
            }

            // Construir parámetros
            const parametros = {
                periodo_analisis,
                granularidad,
                metricas,
                verificador_id: verificador_id ? parseInt(verificador_id) : null,
                incluir_predicciones: incluir_predicciones === 'true',
                usuario_consultor: usuarioActual
            };

            // Obtener tendencias temporales
            const tendencias = await estadisticasServicio.obtenerTendenciasTemporales(parametros);

            return respuestaExitosa(res, {
                periodo_analizado: periodo_analisis,
                granularidad_datos: granularidad,
                serie_temporal: tendencias.serie_temporal,
                tendencias_principales: tendencias.tendencias_principales,
                patrones_detectados: tendencias.patrones_detectados,
                estacionalidad: tendencias.estacionalidad,
                anomalias_detectadas: tendencias.anomalias,
                predicciones: tendencias.predicciones || null,
                correlaciones: tendencias.correlaciones,
                insights_automaticos: tendencias.insights
            }, 'Tendencias temporales obtenidas correctamente');

        } catch (error) {
            console.error('Error al obtener tendencias temporales:', error);
            return manejarError(res, error, 'Error al obtener tendencias temporales');
        }
    }

    // ===================================================
    // ⚡ MÉTRICAS DE RENDIMIENTO EN TIEMPO REAL
    // ===================================================
    async obtenerMetricasTiempoReal(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar permisos
            if (!usuarioActual.roles_activos.includes('administrador') && 
                !usuarioActual.roles_activos.includes('verificador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver métricas en tiempo real',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                intervalo = 'hora', // 'hora', 'dia', 'semana'
                metricas_activas = 'basicas', // 'basicas', 'avanzadas', 'todas'
                alertas_activas = 'true'
            } = req.query;

            // Construir parámetros
            const parametros = {
                intervalo,
                metricas_activas,
                alertas_activas: alertas_activas === 'true',
                usuario_consultor: usuarioActual
            };

            // Obtener métricas en tiempo real
            const metricas = await estadisticasServicio.obtenerMetricasTiempoReal(parametros);

            return respuestaExitosa(res, {
                timestamp_actualizacion: metricas.timestamp,
                metricas_instantaneas: metricas.instantaneas,
                indicadores_rendimiento: metricas.indicadores,
                cola_verificacion_actual: metricas.cola_actual,
                verificadores_activos: metricas.verificadores_activos,
                alertas_criticas: metricas.alertas_criticas,
                tendencia_hora_actual: metricas.tendencia_hora,
                proyeccion_fin_dia: metricas.proyeccion_dia,
                recomendaciones_tiempo_real: metricas.recomendaciones
            }, 'Métricas en tiempo real obtenidas correctamente');

        } catch (error) {
            console.error('Error al obtener métricas en tiempo real:', error);
            return manejarError(res, error, 'Error al obtener métricas en tiempo real');
        }
    }

    // ===================================================
    // 📊 ANÁLISIS COMPARATIVO DE RENDIMIENTO
    // ===================================================
    async obtenerAnalisisComparativo(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Solo administradores pueden ver análisis comparativo completo
            if (!usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver análisis comparativo',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                tipo_comparacion = 'verificadores', // 'verificadores', 'ciclos', 'periodos'
                periodo_base = 'ciclo_actual',
                periodo_comparacion = 'ciclo_anterior',
                metricas_comparacion = 'principales', // 'principales', 'detalladas', 'todas'
                incluir_rankings = 'true'
            } = req.query;

            // Validar tipo de comparación
            const tiposValidos = ['verificadores', 'ciclos', 'periodos'];
            if (!tiposValidos.includes(tipo_comparacion)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Tipo de comparación inválido',
                    codigo: 'TIPO_INVALIDO'
                });
            }

            // Construir parámetros
            const parametros = {
                tipo_comparacion,
                periodo_base,
                periodo_comparacion,
                metricas_comparacion,
                incluir_rankings: incluir_rankings === 'true',
                usuario_admin: usuarioActual
            };

            // Obtener análisis comparativo
            const analisis = await estadisticasServicio.obtenerAnalisisComparativo(parametros);

            return respuestaExitosa(res, {
                tipo_analisis: tipo_comparacion,
                periodos_comparados: analisis.periodos_comparados,
                metricas_comparativas: analisis.metricas_comparativas,
                diferencias_significativas: analisis.diferencias_significativas,
                rankings: analisis.rankings || null,
                mejores_rendimientos: analisis.mejores_rendimientos,
                areas_mejora_detectadas: analisis.areas_mejora,
                recomendaciones_estrategicas: analisis.recomendaciones,
                graficos_comparativos: analisis.graficos
            }, 'Análisis comparativo obtenido correctamente');

        } catch (error) {
            console.error('Error al obtener análisis comparativo:', error);
            return manejarError(res, error, 'Error al obtener análisis comparativo');
        }
    }

    // ===================================================
    // 🎯 INDICADORES DE CALIDAD DE VERIFICACIÓN
    // ===================================================
    async obtenerIndicadoresCalidad(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar permisos
            if (!usuarioActual.roles_activos.includes('administrador') && 
                !usuarioActual.roles_activos.includes('verificador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver indicadores de calidad',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                periodo = 'mes',
                verificador_id = '',
                incluir_detalles = 'true',
                benchmark_sistema = 'true'
            } = req.query;

            // Construir parámetros
            const parametros = {
                periodo,
                verificador_id: verificador_id ? parseInt(verificador_id) : null,
                incluir_detalles: incluir_detalles === 'true',
                benchmark_sistema: benchmark_sistema === 'true',
                usuario_consultor: usuarioActual
            };

            // Obtener indicadores de calidad
            const indicadores = await estadisticasServicio.obtenerIndicadoresCalidad(parametros);

            return respuestaExitosa(res, {
                indicadores_principales: indicadores.principales,
                consistencia_verificacion: indicadores.consistencia,
                precision_observaciones: indicadores.precision_observaciones,
                tiempo_respuesta_docentes: indicadores.tiempo_respuesta,
                satisfaccion_proceso: indicadores.satisfaccion,
                escalabilidad_proceso: indicadores.escalabilidad,
                benchmarks: indicadores.benchmarks || null,
                alertas_calidad: indicadores.alertas_calidad,
                recomendaciones_mejora: indicadores.recomendaciones
            }, 'Indicadores de calidad obtenidos correctamente');

        } catch (error) {
            console.error('Error al obtener indicadores de calidad:', error);
            return manejarError(res, error, 'Error al obtener indicadores de calidad');
        }
    }

    // ===================================================
    // 📱 GENERAR REPORTE EJECUTIVO
    // ===================================================
    async generarReporteEjecutivo(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Solo administradores pueden generar reportes ejecutivos
            if (!usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para generar reportes ejecutivos',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                periodo = 'ciclo_actual',
                formato = 'pdf', // 'pdf', 'excel', 'pptx'
                incluir_graficos = 'true',
                incluir_recomendaciones = 'true',
                audiencia = 'direccion' // 'direccion', 'coordinacion', 'tecnico'
            } = req.query;

            // Validar formato
            const formatosValidos = ['pdf', 'excel', 'pptx'];
            if (!formatosValidos.includes(formato)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Formato inválido. Use: ' + formatosValidos.join(', '),
                    codigo: 'FORMATO_INVALIDO'
                });
            }

            // Construir parámetros del reporte
            const parametros = {
                periodo,
                formato,
                incluir_graficos: incluir_graficos === 'true',
                incluir_recomendaciones: incluir_recomendaciones === 'true',
                audiencia,
                generado_por: usuarioActual.id
            };

            // Generar reporte ejecutivo
            const reporte = await estadisticasServicio.generarReporteEjecutivo(parametros);

            // Registrar generación del reporte
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'generar_reporte',
                modulo: 'estadisticas_verificacion',
                descripcion: `Generó reporte ejecutivo de verificación en formato ${formato}`,
                datos_adicionales: { periodo, formato, audiencia },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            // Configurar headers para descarga
            const mimeTypes = {
                'pdf': 'application/pdf',
                'excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            };

            const extensiones = {
                'pdf': 'pdf',
                'excel': 'xlsx',
                'pptx': 'pptx'
            };

            res.setHeader('Content-Type', mimeTypes[formato]);
            res.setHeader('Content-Disposition', 
                `attachment; filename="reporte_verificacion_${periodo}.${extensiones[formato]}"`);

            return res.send(reporte.buffer);

        } catch (error) {
            console.error('Error al generar reporte ejecutivo:', error);
            return manejarError(res, error, 'Error al generar reporte ejecutivo');
        }
    }

    // ===================================================
    // 🚨 CONFIGURAR ALERTAS DE RENDIMIENTO
    // ===================================================
    async configurarAlertasRendimiento(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Solo administradores pueden configurar alertas del sistema
            if (!usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para configurar alertas del sistema',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                alertas_tiempo_verificacion = {},
                alertas_cola_pendientes = {},
                alertas_calidad_proceso = {},
                alertas_rendimiento_verificadores = {},
                notificaciones_email = true,
                notificaciones_sistema = true
            } = req.body;

            // Construir configuración de alertas
            const configuracion = {
                alertas_tiempo_verificacion,
                alertas_cola_pendientes,
                alertas_calidad_proceso,
                alertas_rendimiento_verificadores,
                notificaciones_email,
                notificaciones_sistema
            };

            // Guardar configuración
            const resultado = await estadisticasServicio.configurarAlertasRendimiento(
                configuracion, 
                usuarioActual.id
            );

            // Registrar cambio de configuración
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'configurar',
                modulo: 'estadisticas_verificacion',
                descripcion: 'Configuró alertas de rendimiento del sistema',
                datos_nuevos: configuracion,
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                configuracion_guardada: resultado.configuracion,
                alertas_activas: resultado.alertas_activas,
                umbrales_configurados: resultado.umbrales,
                canales_notificacion: resultado.canales_notificacion,
                prueba_alertas: resultado.prueba_alertas
            }, 'Alertas de rendimiento configuradas correctamente');

        } catch (error) {
            console.error('Error al configurar alertas:', error);
            return manejarError(res, error, 'Error al configurar alertas de rendimiento');
        }
    }

    // ===================================================
    // 🔐 MÉTODOS DE VERIFICACIÓN DE PERMISOS
    // ===================================================
    puedeVerEstadisticasVerificador(usuario, verificadorId) {
        // Administradores pueden ver estadísticas de cualquier verificador
        if (usuario.roles_activos.includes('administrador')) return true;
        
        // Verificadores solo pueden ver sus propias estadísticas
        return usuario.id === verificadorId && usuario.roles_activos.includes('verificador');
    }

    // ===================================================
    // 📊 EXPORTAR DATOS DE ESTADÍSTICAS
    // ===================================================
    async exportarDatosEstadisticas(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar permisos
            if (!usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para exportar datos de estadísticas',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                formato = 'excel', // 'excel', 'csv', 'json'
                tipo_datos = 'completo', // 'completo', 'resumen', 'raw'
                periodo = 'ciclo_actual',
                incluir_metadatos = 'true'
            } = req.query;

            // Validar formato
            const formatosValidos = ['excel', 'csv', 'json'];
            if (!formatosValidos.includes(formato)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Formato inválido. Use: ' + formatosValidos.join(', '),
                    codigo: 'FORMATO_INVALIDO'
                });
            }

            // Construir parámetros de exportación
            const parametros = {
                formato,
                tipo_datos,
                periodo,
                incluir_metadatos: incluir_metadatos === 'true',
                exportado_por: usuarioActual.id
            };

            // Exportar datos
            const archivo = await estadisticasServicio.exportarDatosEstadisticas(parametros);

            // Registrar exportación
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'exportar',
                modulo: 'estadisticas_verificacion',
                descripcion: `Exportó datos de estadísticas en formato ${formato}`,
                datos_adicionales: { formato, tipo_datos, periodo },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            // Configurar headers para descarga
            const mimeTypes = {
                'excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'csv': 'text/csv',
                'json': 'application/json'
            };

            res.setHeader('Content-Type', mimeTypes[formato]);
            res.setHeader('Content-Disposition', 
                `attachment; filename="estadisticas_verificacion_${periodo}.${formato}"`);

            return res.send(archivo.buffer);

        } catch (error) {
            console.error('Error al exportar datos de estadísticas:', error);
            return manejarError(res, error, 'Error al exportar datos de estadísticas');
        }
    }
}

module.exports = new EstadisticasVerificacionControlador();