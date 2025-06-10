/**
 * 📈 CONTROLADOR DE PROGRESO DE PORTAFOLIOS
 * 
 * Calcula y muestra el progreso de completitud:
 * - Porcentaje de completitud por portafolio
 * - Progreso por sección/carpeta
 * - Documentos pendientes y completados
 * - Métricas de avance temporal
 * - Comparativas entre docentes
 * 
 * Rutas que maneja:
 * GET /api/v1/portafolios/:id/progreso - Progreso específico
 * GET /api/v1/portafolios/progreso/resumen - Resumen general
 * GET /api/v1/portafolios/progreso/comparativa - Comparativa
 */

// TODO: Cálculo dinámico basado en documentos obligatorios
// TODO: Progreso ponderado por importancia de documentos
// TODO: Alertas de documentos próximos a vencer
// TODO: Gráficos de progreso temporal
// ============================================================
// 📈 CONTROLADOR DE PROGRESO DE PORTAFOLIOS
// Sistema Portafolio Docente UNSAAC
// ============================================================

const progresoServicio = require('../../servicios/gestion-portafolios/progreso.servicio');
const { manejarError, respuestaExitosa } = require('../../utilidades/formato/datos.util');
const { validarRangoFechas } = require('../../validadores/comunes/generales.validador');
const { registrarAccion } = require('../../utilidades/base-datos/auditoria.util');

class ProgresoPortafoliosControlador {

    // ===================================================
    // 📊 OBTENER PROGRESO ESPECÍFICO DE UN PORTAFOLIO
    // ===================================================
    async obtenerProgresoEspecifico(req, res) {
        try {
            const { id } = req.params;
            const usuarioActual = req.usuario;

            // Validar ID del portafolio
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'ID de portafolio inválido',
                    codigo: 'ID_INVALIDO'
                });
            }

            const portafolioId = parseInt(id);

            const {
                nivel_detalle = 'completo', // 'basico', 'completo', 'avanzado'
                incluir_historico = 'true',
                incluir_proyecciones = 'false',
                incluir_comparativas = 'false',
                periodo_historico = 30 // días
            } = req.query;

            // Verificar permisos de acceso al portafolio
            const permisos = await progresoServicio.verificarPermisosProgreso(portafolioId, usuarioActual);
            if (!permisos.puede_ver) {
                return res.status(403).json({
                    exito: false,
                    mensaje: permisos.razon,
                    codigo: 'ACCESO_DENEGADO'
                });
            }

            // Construir parámetros de análisis
            const parametros = {
                portafolio_id: portafolioId,
                usuario_actual: usuarioActual,
                nivel_detalle,
                incluir_historico: incluir_historico === 'true',
                incluir_proyecciones: incluir_proyecciones === 'true',
                incluir_comparativas: incluir_comparativas === 'true',
                periodo_historico: Math.min(parseInt(periodo_historico) || 30, 365),
                permisos_usuario: permisos.permisos
            };

            // Obtener análisis completo de progreso
            const analisisProgreso = await progresoServicio.analizarProgresoPortafolio(parametros);

            // Registrar consulta de progreso para analytics
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'consultar_progreso',
                modulo: 'portafolios',
                descripcion: `Consultó progreso del portafolio: ${analisisProgreso.info_portafolio.nombre}`,
                datos_adicionales: { 
                    portafolio_id: portafolioId, 
                    nivel_detalle,
                    progreso_actual: analisisProgreso.progreso_general.porcentaje_completitud
                },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                informacion_portafolio: analisisProgreso.info_portafolio,
                progreso_general: analisisProgreso.progreso_general,
                progreso_por_seccion: analisisProgreso.progreso_secciones,
                documentos_estadisticas: analisisProgreso.documentos_estadisticas,
                historico_progreso: analisisProgreso.historico || null,
                proyecciones: analisisProgreso.proyecciones || null,
                comparativas: analisisProgreso.comparativas || null,
                alertas_progreso: analisisProgreso.alertas,
                recomendaciones: analisisProgreso.recomendaciones,
                siguiente_meta: analisisProgreso.siguiente_meta,
                tiempo_analisis: analisisProgreso.tiempo_procesamiento
            }, 'Análisis de progreso obtenido correctamente');

        } catch (error) {
            console.error('Error al obtener progreso específico:', error);
            return manejarError(res, error, 'Error al obtener progreso del portafolio');
        }
    }

    // ===================================================
    // 📋 OBTENER RESUMEN GENERAL DE PROGRESO
    // ===================================================
    async obtenerResumenGeneral(req, res) {
        try {
            const usuarioActual = req.usuario;

            const {
                ciclo_id = '',
                asignatura_id = '',
                vista = 'general', // 'general', 'detallada', 'comparativa'
                incluir_tendencias = 'true',
                incluir_alertas = 'true',
                periodo_analisis = 'ciclo_actual' // 'ciclo_actual', 'mes', 'trimestre'
            } = req.query;

            // Construir filtros según el rol del usuario
            const filtros = {
                usuario_id: usuarioActual.id,
                roles_activos: usuarioActual.roles_activos,
                ciclo_id: ciclo_id ? parseInt(ciclo_id) : null,
                asignatura_id: asignatura_id ? parseInt(asignatura_id) : null,
                vista,
                incluir_tendencias: incluir_tendencias === 'true',
                incluir_alertas: incluir_alertas === 'true',
                periodo_analisis
            };

            // Obtener resumen según el rol del usuario
            let resumenProgreso;
            
            if (usuarioActual.roles_activos.includes('administrador')) {
                resumenProgreso = await progresoServicio.obtenerResumenAdministrador(filtros);
            } else if (usuarioActual.roles_activos.includes('verificador')) {
                resumenProgreso = await progresoServicio.obtenerResumenVerificador(filtros);
            } else if (usuarioActual.roles_activos.includes('docente')) {
                resumenProgreso = await progresoServicio.obtenerResumenDocente(filtros);
            } else {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes un rol válido para ver el progreso',
                    codigo: 'ROL_INVALIDO'
                });
            }

            return respuestaExitosa(res, {
                resumen_general: resumenProgreso.resumen,
                estadisticas_clave: resumenProgreso.estadisticas_clave,
                portafolios_destacados: resumenProgreso.destacados,
                tendencias_progreso: resumenProgreso.tendencias || null,
                alertas_atencion: resumenProgreso.alertas || null,
                distribucion_progreso: resumenProgreso.distribucion,
                metas_objetivos: resumenProgreso.metas,
                periodo_analizado: periodo_analisis,
                filtros_aplicados: filtros
            }, 'Resumen general de progreso obtenido correctamente');

        } catch (error) {
            console.error('Error al obtener resumen general:', error);
            return manejarError(res, error, 'Error al obtener resumen de progreso');
        }
    }

    // ===================================================
    // ⚖️ OBTENER COMPARATIVA DE PROGRESO
    // ===================================================
    async obtenerComparativaProgreso(req, res) {
        try {
            const usuarioActual = req.usuario;

            const {
                tipo_comparacion = 'docentes', // 'docentes', 'asignaturas', 'ciclos', 'periodos'
                grupo_referencia = '',
                incluir_anonimizado = 'true',
                mostrar_ranking = 'false',
                limite_elementos = 20,
                incluir_estadisticas = 'true'
            } = req.query;

            // Verificar permisos para ver comparativas
            if (!this.puedeVerComparativas(usuarioActual, tipo_comparacion)) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver comparativas de progreso',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            // Validar tipo de comparación
            const tiposValidos = ['docentes', 'asignaturas', 'ciclos', 'periodos'];
            if (!tiposValidos.includes(tipo_comparacion)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Tipo de comparación inválido',
                    codigo: 'TIPO_INVALIDO'
                });
            }

            // Construir parámetros de comparación
            const parametros = {
                tipo_comparacion,
                usuario_actual: usuarioActual,
                grupo_referencia,
                incluir_anonimizado: incluir_anonimizado === 'true',
                mostrar_ranking: mostrar_ranking === 'true' && usuarioActual.roles_activos.includes('administrador'),
                limite_elementos: Math.min(parseInt(limite_elementos) || 20, 50),
                incluir_estadisticas: incluir_estadisticas === 'true'
            };

            // Obtener datos comparativos
            const comparativa = await progresoServicio.generarComparativaProgreso(parametros);

            // Registrar consulta comparativa
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'consultar_comparativa',
                modulo: 'portafolios',
                descripcion: `Consultó comparativa de progreso tipo: ${tipo_comparacion}`,
                datos_adicionales: { tipo_comparacion, grupo_referencia },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                tipo_comparacion,
                datos_comparativos: comparativa.datos,
                estadisticas_comparativas: comparativa.estadisticas || null,
                ranking: comparativa.ranking || null,
                promedios_referencia: comparativa.promedios_referencia,
                insights_automaticos: comparativa.insights,
                graficos_comparativos: comparativa.graficos,
                recomendaciones_mejora: comparativa.recomendaciones
            }, 'Comparativa de progreso obtenida correctamente');

        } catch (error) {
            console.error('Error al obtener comparativa:', error);
            return manejarError(res, error, 'Error al obtener comparativa de progreso');
        }
    }

    // ===================================================
    // 📅 OBTENER PROGRESO TEMPORAL (TENDENCIAS)
    // ===================================================
    async obtenerProgresoTemporal(req, res) {
        try {
            const usuarioActual = req.usuario;

            const {
                portafolio_id = '',
                fecha_inicio = '',
                fecha_fin = '',
                granularidad = 'semanal', // 'diaria', 'semanal', 'mensual'
                incluir_predicciones = 'false',
                incluir_eventos = 'true'
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

            // Validar granularidad
            const granularidadesValidas = ['diaria', 'semanal', 'mensual'];
            if (!granularidadesValidas.includes(granularidad)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Granularidad inválida',
                    codigo: 'GRANULARIDAD_INVALIDA'
                });
            }

            // Construir parámetros temporales
            const parametros = {
                usuario_actual: usuarioActual,
                portafolio_id: portafolio_id ? parseInt(portafolio_id) : null,
                ...fechasValidadas,
                granularidad,
                incluir_predicciones: incluir_predicciones === 'true',
                incluir_eventos: incluir_eventos === 'true'
            };

            // Verificar permisos si es portafolio específico
            if (parametros.portafolio_id) {
                const permisos = await progresoServicio.verificarPermisosProgreso(parametros.portafolio_id, usuarioActual);
                if (!permisos.puede_ver) {
                    return res.status(403).json({
                        exito: false,
                        mensaje: permisos.razon,
                        codigo: 'ACCESO_DENEGADO'
                    });
                }
            }

            // Obtener serie temporal de progreso
            const serieTemporal = await progresoServicio.generarSerieTemporalProgreso(parametros);

            return respuestaExitosa(res, {
                periodo_analizado: {
                    fecha_inicio: serieTemporal.periodo.inicio,
                    fecha_fin: serieTemporal.periodo.fin,
                    granularidad
                },
                serie_temporal: serieTemporal.datos,
                tendencias_detectadas: serieTemporal.tendencias,
                eventos_importantes: serieTemporal.eventos || null,
                predicciones: serieTemporal.predicciones || null,
                estadisticas_periodo: serieTemporal.estadisticas,
                patrones_identificados: serieTemporal.patrones
            }, 'Serie temporal de progreso obtenida correctamente');

        } catch (error) {
            console.error('Error al obtener progreso temporal:', error);
            return manejarError(res, error, 'Error al obtener progreso temporal');
        }
    }

    // ===================================================
    // 🎯 CONFIGURAR METAS DE PROGRESO
    // ===================================================
    async configurarMetas(req, res) {
        try {
            const usuarioActual = req.usuario;

            const {
                portafolio_id = null,
                tipo_meta = 'completitud', // 'completitud', 'tiempo', 'calidad', 'custom'
                valor_objetivo,
                fecha_limite = null,
                descripcion = '',
                es_publica = false,
                notificaciones_activadas = true,
                hitos_intermedios = []
            } = req.body;

            // Validar datos básicos
            if (!valor_objetivo) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Valor objetivo es requerido',
                    codigo: 'VALOR_OBJETIVO_REQUERIDO'
                });
            }

            // Verificar permisos para configurar metas
            if (portafolio_id) {
                const permisos = await progresoServicio.verificarPermisosProgreso(portafolio_id, usuarioActual);
                if (!permisos.puede_modificar) {
                    return res.status(403).json({
                        exito: false,
                        mensaje: 'No tienes permisos para configurar metas en este portafolio',
                        codigo: 'PERMISOS_INSUFICIENTES'
                    });
                }
            }

            // Construir configuración de meta
            const configuracionMeta = {
                usuario_id: usuarioActual.id,
                portafolio_id: portafolio_id ? parseInt(portafolio_id) : null,
                tipo_meta,
                valor_objetivo: parseFloat(valor_objetivo),
                fecha_limite,
                descripcion: descripcion.trim(),
                es_publica: es_publica && usuarioActual.roles_activos.includes('administrador'),
                notificaciones_activadas,
                hitos_intermedios: Array.isArray(hitos_intermedios) ? hitos_intermedios : []
            };

            // Crear meta de progreso
            const metaCreada = await progresoServicio.crearMetaProgreso(configuracionMeta);

            // Registrar creación de meta
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'crear_meta',
                modulo: 'portafolios',
                descripcion: `Configuró meta de ${tipo_meta} con objetivo ${valor_objetivo}`,
                datos_nuevos: {
                    meta_id: metaCreada.id,
                    tipo_meta,
                    valor_objetivo,
                    portafolio_id
                },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                meta_creada: metaCreada,
                seguimiento_automatico: metaCreada.seguimiento_configurado,
                notificaciones_programadas: metaCreada.notificaciones_programadas
            }, 'Meta de progreso configurada correctamente', 201);

        } catch (error) {
            console.error('Error al configurar metas:', error);
            return manejarError(res, error, 'Error al configurar meta de progreso');
        }
    }

    // ===================================================
    // 📊 GENERAR REPORTE DE PROGRESO
    // ===================================================
    async generarReporteProgreso(req, res) {
        try {
            const usuarioActual = req.usuario;

            const {
                tipo_reporte = 'personal', // 'personal', 'asignatura', 'ciclo', 'general'
                formato = 'pdf', // 'pdf', 'excel', 'json'
                incluir_graficos = 'true',
                incluir_comparativas = 'false',
                incluir_historico = 'true',
                periodo_reporte = 'ciclo_actual',
                portafolios_especificos = []
            } = req.query;

            // Validar formato
            const formatosValidos = ['pdf', 'excel', 'json'];
            if (!formatosValidos.includes(formato)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Formato de reporte inválido',
                    codigo: 'FORMATO_INVALIDO'
                });
            }

            // Verificar permisos según tipo de reporte
            if (!this.puedeGenerarReporte(usuarioActual, tipo_reporte)) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para generar este tipo de reporte',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            // Construir parámetros del reporte
            const parametrosReporte = {
                usuario_actual: usuarioActual,
                tipo_reporte,
                formato,
                incluir_graficos: incluir_graficos === 'true',
                incluir_comparativas: incluir_comparativas === 'true',
                incluir_historico: incluir_historico === 'true',
                periodo_reporte,
                portafolios_especificos: Array.isArray(portafolios_especificos) ? 
                    portafolios_especificos.map(id => parseInt(id)) : []
            };

            // Generar reporte
            const reporte = await progresoServicio.generarReporteProgreso(parametrosReporte);

            // Registrar generación de reporte
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'generar_reporte',
                modulo: 'portafolios',
                descripcion: `Generó reporte de progreso tipo ${tipo_reporte} en formato ${formato}`,
                datos_adicionales: { 
                    tipo_reporte, 
                    formato, 
                    periodo_reporte,
                    portafolios_incluidos: parametrosReporte.portafolios_especificos.length
                },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            // Si es formato json, devolver datos directamente
            if (formato === 'json') {
                return respuestaExitosa(res, {
                    reporte_datos: reporte.datos,
                    metadatos_reporte: reporte.metadatos,
                    estadisticas_generacion: reporte.estadisticas
                }, 'Reporte de progreso generado correctamente');
            }

            // Para PDF/Excel, configurar headers de descarga
            const mimeTypes = {
                'pdf': 'application/pdf',
                'excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            };

            const extensiones = {
                'pdf': 'pdf',
                'excel': 'xlsx'
            };

            res.setHeader('Content-Type', mimeTypes[formato]);
            res.setHeader('Content-Disposition', 
                `attachment; filename="reporte_progreso_${periodo_reporte}.${extensiones[formato]}"`);

            return res.send(reporte.buffer);

        } catch (error) {
            console.error('Error al generar reporte:', error);
            return manejarError(res, error, 'Error al generar reporte de progreso');
        }
    }

    // ===================================================
    // 🚨 OBTENER ALERTAS DE PROGRESO
    // ===================================================
    async obtenerAlertasProgreso(req, res) {
        try {
            const usuarioActual = req.usuario;

            const {
                tipo_alerta = 'todas', // 'retrasos', 'metas', 'calidad', 'todas'
                prioridad = 'todas', // 'baja', 'media', 'alta', 'critica', 'todas'
                incluir_resueltas = 'false',
                limite = 50
            } = req.query;

            // Construir filtros
            const filtros = {
                usuario_id: usuarioActual.id,
                roles_activos: usuarioActual.roles_activos,
                tipo_alerta,
                prioridad,
                incluir_resueltas: incluir_resueltas === 'true',
                limite: Math.min(parseInt(limite) || 50, 100)
            };

            // Obtener alertas según el rol
            const alertas = await progresoServicio.obtenerAlertasProgreso(filtros);

            return respuestaExitosa(res, {
                alertas_activas: alertas.activas,
                alertas_por_prioridad: alertas.por_prioridad,
                resumen_alertas: alertas.resumen,
                acciones_recomendadas: alertas.acciones_recomendadas,
                configuracion_alertas: alertas.configuracion_usuario
            }, 'Alertas de progreso obtenidas correctamente');

        } catch (error) {
            console.error('Error al obtener alertas:', error);
            return manejarError(res, error, 'Error al obtener alertas de progreso');
        }
    }

    // ===================================================
    // 🎮 ACTUALIZAR PROGRESO MANUAL
    // ===================================================
    async actualizarProgresoManual(req, res) {
        try {
            const { portafolio_id } = req.params;
            const usuarioActual = req.usuario;

            // Validar ID
            if (!portafolio_id || isNaN(parseInt(portafolio_id))) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'ID de portafolio inválido',
                    codigo: 'ID_INVALIDO'
                });
            }

            const portafolioIdNum = parseInt(portafolio_id);

            const {
                forzar_recalculo = false,
                actualizar_estadisticas = true,
                notificar_cambios = false
            } = req.body;

            // Verificar permisos
            const permisos = await progresoServicio.verificarPermisosProgreso(portafolioIdNum, usuarioActual);
            if (!permisos.puede_modificar) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para actualizar el progreso de este portafolio',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            // Actualizar progreso
            const resultado = await progresoServicio.actualizarProgresoPortafolio({
                portafolio_id: portafolioIdNum,
                forzar_recalculo,
                actualizar_estadisticas,
                notificar_cambios,
                actualizado_por: usuarioActual.id
            });

            // Registrar actualización
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'actualizar_progreso',
                modulo: 'portafolios',
                descripcion: `Actualizó progreso del portafolio ${portafolioIdNum}`,
                datos_nuevos: {
                    portafolio_id: portafolioIdNum,
                    progreso_anterior: resultado.progreso_anterior,
                    progreso_nuevo: resultado.progreso_nuevo,
                    forzar_recalculo
                },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                actualizacion_exitosa: true,
                progreso_anterior: resultado.progreso_anterior,
                progreso_actualizado: resultado.progreso_nuevo,
                cambios_detectados: resultado.cambios_detectados,
                notificaciones_enviadas: resultado.notificaciones_enviadas,
                tiempo_procesamiento: resultado.tiempo_procesamiento
            }, 'Progreso actualizado correctamente');

        } catch (error) {
            console.error('Error al actualizar progreso:', error);
            return manejarError(res, error, 'Error al actualizar progreso');
        }
    }

    // ===================================================
    // 🔐 MÉTODOS DE VERIFICACIÓN DE PERMISOS
    // ===================================================
    puedeVerComparativas(usuario, tipoComparacion) {
        // Administradores pueden ver todas las comparativas
        if (usuario.roles_activos.includes('administrador')) return true;
        
        // Verificadores pueden ver comparativas limitadas
        if (usuario.roles_activos.includes('verificador')) {
            return ['docentes', 'asignaturas'].includes(tipoComparacion);
        }
        
        // Docentes solo pueden ver sus propias comparativas básicas
        if (usuario.roles_activos.includes('docente')) {
            return tipoComparacion === 'periodos';
        }
        
        return false;
    }

    puedeGenerarReporte(usuario, tipoReporte) {
        // Administradores pueden generar cualquier reporte
        if (usuario.roles_activos.includes('administrador')) return true;
        
        // Verificadores pueden generar reportes de sus asignados
        if (usuario.roles_activos.includes('verificador')) {
            return ['personal', 'asignatura'].includes(tipoReporte);
        }
        
        // Docentes solo pueden generar reportes personales
        if (usuario.roles_activos.includes('docente')) {
            return tipoReporte === 'personal';
        }
        
        return false;
    }
}

module.exports = new ProgresoPortafoliosControlador();