/**
 * ✅ CONTROLADOR DE DASHBOARD DE VERIFICADOR
 * 
 * Dashboard específico para verificadores:
 * - Documentos asignados para verificar
 * - Cola de verificación
 * - Estadísticas de verificación
 * - Docentes asignados
 * - Métricas de rendimiento
 * 
 * Rutas que maneja:
 * GET /api/v1/tableros/verificador - Dashboard principal
 * GET /api/v1/tableros/verificador/cola - Cola verificación
 * GET /api/v1/tableros/verificador/estadisticas - Mis estadísticas
 */

// TODO: Cola de trabajo organizada por prioridad
// TODO: Métricas personales de verificación
// TODO: Acceso rápido a herramientas de verificación
// TODO: Comunicación directa con docentes
// TODO: Historial de verificaciones realizadas
// ============================================================
// ✅ CONTROLADOR DE DASHBOARD DE VERIFICADOR
// Sistema Portafolio Docente UNSAAC
// ============================================================

const tableroVerificadorServicio = require('../../servicios/tableros/verificador.servicio');
const { manejarError, respuestaExitosa } = require('../../utilidades/formato/datos.util');
const { registrarAccion } = require('../../utilidades/base-datos/auditoria.util');

class TableroVerificadorControlador {

    // ===================================================
    // ✅ DASHBOARD PRINCIPAL DE VERIFICADOR
    // ===================================================
    async obtenerDashboardPrincipal(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar que el usuario tenga rol de verificador
            if (!usuarioActual.roles_activos.includes('verificador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para acceder al dashboard de verificador',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const { 
                ciclo_id = '',
                vista = 'completa', // 'completa', 'resumen'
                incluir_estadisticas = 'true'
            } = req.query;

            // Construir parámetros
            const parametros = {
                verificador_id: usuarioActual.id,
                ciclo_id: ciclo_id ? parseInt(ciclo_id) : null,
                vista,
                incluir_estadisticas: incluir_estadisticas === 'true',
                usuario_verificador: usuarioActual
            };

            // Obtener dashboard del verificador
            const dashboard = await tableroVerificadorServicio.obtenerDashboardCompleto(parametros);

            // Registrar acceso
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'consultar',
                modulo: 'tableros',
                descripcion: 'Accedió a su dashboard de verificador',
                datos_adicionales: { ciclo_id, vista },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                // Información del verificador
                perfil_verificador: dashboard.perfil_verificador,
                
                // Cola de trabajo
                cola_verificacion: dashboard.cola_verificacion,
                
                // Documentos asignados
                documentos_asignados: dashboard.documentos_asignados,
                
                // Docentes asignados
                docentes_asignados: dashboard.docentes_asignados,
                
                // Estadísticas de rendimiento
                estadisticas_rendimiento: dashboard.estadisticas_rendimiento,
                
                // Actividad reciente
                actividad_reciente: dashboard.actividad_reciente,
                
                // Observaciones activas
                observaciones_activas: dashboard.observaciones_activas,
                
                // Métricas personales
                metricas_personales: dashboard.metricas_personales,
                
                // Alertas y recordatorios
                alertas_verificacion: dashboard.alertas_verificacion,
                
                // Herramientas rápidas
                herramientas_rapidas: dashboard.herramientas_rapidas,
                
                // Metadatos
                ultima_actualizacion: dashboard.ultima_actualizacion,
                ciclo_activo: dashboard.ciclo_activo
            }, 'Dashboard de verificador obtenido correctamente');

        } catch (error) {
            console.error('Error al obtener dashboard de verificador:', error);
            return manejarError(res, error, 'Error al cargar dashboard de verificador');
        }
    }

    // ===================================================
    // 📋 COLA DE VERIFICACIÓN ORGANIZADA
    // ===================================================
    async obtenerColaVerificacion(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar rol de verificador
            if (!usuarioActual.roles_activos.includes('verificador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver observaciones',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                estado = 'todas', // 'pendientes', 'respondidas', 'resueltas', 'todas'
                docente_id = '',
                tipo = 'todas', // 'correccion', 'aprobacion', 'rechazo', 'general', 'todas'
                dias = 30,
                incluir_conversaciones = 'true'
            } = req.query;

            // Construir filtros
            const filtros = {
                verificador_id: usuarioActual.id,
                estado,
                docente_id: docente_id ? parseInt(docente_id) : null,
                tipo,
                dias: Math.min(parseInt(dias) || 30, 90),
                incluir_conversaciones: incluir_conversaciones === 'true',
                usuario_verificador: usuarioActual
            };

            // Obtener observaciones activas
            const observaciones = await tableroVerificadorServicio.obtenerObservacionesActivas(filtros);

            return respuestaExitosa(res, {
                observaciones_pendientes_respuesta: observaciones.pendientes_respuesta,
                conversaciones_activas: observaciones.conversaciones_activas,
                observaciones_recientes: observaciones.recientes,
                estadisticas_observaciones: observaciones.estadisticas,
                docentes_mas_observaciones: observaciones.docentes_frecuentes,
                tipos_observaciones_comunes: observaciones.tipos_comunes,
                tiempo_respuesta_promedio: observaciones.tiempo_respuesta,
                seguimiento_requerido: observaciones.seguimiento_requerido
            }, 'Observaciones activas obtenidas correctamente');

        } catch (error) {
            console.error('Error al obtener observaciones activas:', error);
            return manejarError(res, error, 'Error al obtener tus observaciones activas');
        }
    }

    // ===================================================
    // ⚡ HERRAMIENTAS DE VERIFICACIÓN RÁPIDA
    // ===================================================
    async obtenerHerramientasRapidas(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar rol de verificador
            if (!usuarioActual.roles_activos.includes('verificador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver herramientas de verificación',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            // Obtener herramientas y accesos rápidos
            const herramientas = await tableroVerificadorServicio.obtenerHerramientasRapidas(usuarioActual.id);

            return respuestaExitosa(res, {
                acciones_rapidas: herramientas.acciones_rapidas,
                plantillas_observaciones: herramientas.plantillas_observaciones,
                criterios_verificacion: herramientas.criterios_verificacion,
                atajos_frecuentes: herramientas.atajos_frecuentes,
                herramientas_colaboracion: herramientas.colaboracion,
                documentos_referencia: herramientas.documentos_referencia,
                configuracion_personal: herramientas.configuracion
            }, 'Herramientas rápidas obtenidas correctamente');

        } catch (error) {
            console.error('Error al obtener herramientas rápidas:', error);
            return manejarError(res, error, 'Error al obtener herramientas de verificación');
        }
    }

    // ===================================================
    // 📈 RENDIMIENTO Y MÉTRICAS COMPARATIVAS
    // ===================================================
    async obtenerRendimientoComparativo(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar rol de verificador
            if (!usuarioActual.roles_activos.includes('verificador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver rendimiento comparativo',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                periodo = 'mes',
                comparar_con = 'promedio_verificadores', // 'promedio_verificadores', 'mejor_verificador', 'historico_personal'
                mostrar_ranking = 'false',
                incluir_metas = 'true'
            } = req.query;

            // Construir parámetros
            const parametros = {
                verificador_id: usuarioActual.id,
                periodo,
                comparar_con,
                mostrar_ranking: mostrar_ranking === 'true',
                incluir_metas: incluir_metas === 'true',
                usuario_verificador: usuarioActual
            };

            // Obtener rendimiento comparativo
            const rendimiento = await tableroVerificadorServicio.obtenerRendimientoComparativo(parametros);

            return respuestaExitosa(res, {
                metricas_personales: rendimiento.personales,
                comparativas_sistema: rendimiento.comparativas,
                ranking_verificadores: rendimiento.ranking || null,
                metas_establecidas: rendimiento.metas || null,
                progreso_metas: rendimiento.progreso_metas || null,
                areas_destacadas: rendimiento.areas_destacadas,
                oportunidades_mejora: rendimiento.oportunidades_mejora,
                reconocimientos_obtenidos: rendimiento.reconocimientos
            }, 'Rendimiento comparativo obtenido correctamente');

        } catch (error) {
            console.error('Error al obtener rendimiento comparativo:', error);
            return manejarError(res, error, 'Error al obtener tu rendimiento comparativo');
        }
    }

    // ===================================================
    // 🎯 CONFIGURAR PREFERENCIAS DE VERIFICACIÓN
    // ===================================================
    async configurarPreferenciasVerificacion(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar rol de verificador
            if (!usuarioActual.roles_activos.includes('verificador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para configurar preferencias',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                criterios_priorizacion = {},
                plantillas_personalizadas = [],
                notificaciones_verificacion = {},
                layout_verificacion = 'default',
                herramientas_favoritas = [],
                configuracion_cola = {}
            } = req.body;

            // Construir configuración
            const preferencias = {
                criterios_priorizacion,
                plantillas_personalizadas,
                notificaciones_verificacion,
                layout_verificacion,
                herramientas_favoritas,
                configuracion_cola
            };

            // Actualizar preferencias
            const resultado = await tableroVerificadorServicio.configurarPreferencias(
                usuarioActual.id, 
                preferencias
            );

            // Registrar cambio de configuración
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'configurar',
                modulo: 'tableros',
                descripcion: 'Configuró preferencias de verificación',
                datos_nuevos: preferencias,
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                preferencias_actualizadas: resultado.preferencias,
                plantillas_disponibles: resultado.plantillas_disponibles,
                criterios_disponibles: resultado.criterios_disponibles,
                layouts_disponibles: resultado.layouts_disponibles
            }, 'Preferencias de verificación configuradas correctamente');

        } catch (error) {
            console.error('Error al configurar preferencias:', error);
            return manejarError(res, error, 'Error al configurar preferencias de verificación');
        }
    }

    // ===================================================
    // 📊 GENERAR REPORTE DE ACTIVIDAD
    // ===================================================
    async generarReporteActividad(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar rol de verificador
            if (!usuarioActual.roles_activos.includes('verificador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para generar reportes',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                periodo = 'mes',
                formato = 'pdf', // 'pdf', 'excel'
                incluir_graficos = 'true',
                incluir_observaciones = 'true',
                incluir_comparativas = 'false',
                tipo_reporte = 'completo' // 'completo', 'resumen', 'personalizado'
            } = req.query;

            // Validar formato
            if (!['pdf', 'excel'].includes(formato)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Formato inválido. Use: pdf o excel',
                    codigo: 'FORMATO_INVALIDO'
                });
            }

            // Construir parámetros de reporte
            const parametros = {
                verificador_id: usuarioActual.id,
                periodo,
                formato,
                incluir_graficos: incluir_graficos === 'true',
                incluir_observaciones: incluir_observaciones === 'true',
                incluir_comparativas: incluir_comparativas === 'true',
                tipo_reporte,
                usuario_verificador: usuarioActual
            };

            // Generar reporte
            const reporte = await tableroVerificadorServicio.generarReporteActividad(parametros);

            // Registrar generación de reporte
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'generar_reporte',
                modulo: 'tableros',
                descripcion: `Generó reporte de actividad en formato ${formato}`,
                datos_adicionales: { formato, periodo, tipo_reporte },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            // Configurar headers para descarga
            const extension = formato;
            const mimeType = formato === 'pdf' ? 
                'application/pdf' : 
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Disposition', 
                `attachment; filename="reporte_verificacion_${periodo}.${extension}"`);

            return res.send(reporte.buffer);

        } catch (error) {
            console.error('Error al generar reporte de actividad:', error);
            return manejarError(res, error, 'Error al generar tu reporte de actividad');
        }
    }

    // ===================================================
    // 🚨 ALERTAS Y RECORDATORIOS ESPECÍFICOS
    // ===================================================
    async obtenerAlertasVerificacion(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar rol de verificador
            if (!usuarioActual.roles_activos.includes('verificador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver alertas de verificación',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                tipo_alerta = 'todas', // 'urgentes', 'fechas_limite', 'carga_trabajo', 'todas'
                prioridad = 'todas', // 'critica', 'alta', 'media', 'todas'
                incluir_resueltas = 'false'
            } = req.query;

            // Construir filtros
            const filtros = {
                verificador_id: usuarioActual.id,
                tipo_alerta,
                prioridad,
                incluir_resueltas: incluir_resueltas === 'true',
                usuario_verificador: usuarioActual
            };

            // Obtener alertas específicas
            const alertas = await tableroVerificadorServicio.obtenerAlertasVerificacion(filtros);

            return respuestaExitosa(res, {
                alertas_criticas: alertas.criticas,
                alertas_fechas_limite: alertas.fechas_limite,
                alertas_carga_trabajo: alertas.carga_trabajo,
                recordatorios_importantes: alertas.recordatorios,
                alertas_sistema: alertas.sistema,
                configuracion_alertas: alertas.configuracion,
                acciones_recomendadas: alertas.acciones_recomendadas
            }, 'Alertas de verificación obtenidas correctamente');

        } catch (error) {
            console.error('Error al obtener alertas de verificación:', error);
            return manejarError(res, error, 'Error al obtener alertas de verificación');
        }
    }

    // ===================================================
    // 📅 PLANIFICACIÓN Y GESTIÓN DE TIEMPO
    // ===================================================
    async obtenerPlanificacionTiempo(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar rol de verificador
            if (!usuarioActual.roles_activos.includes('verificador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver planificación de tiempo',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                vista_tiempo = 'semana', // 'dia', 'semana', 'mes'
                incluir_estimaciones = 'true',
                optimizar_carga = 'false'
            } = req.query;

            // Construir parámetros
            const parametros = {
                verificador_id: usuarioActual.id,
                vista_tiempo,
                incluir_estimaciones: incluir_estimaciones === 'true',
                optimizar_carga: optimizar_carga === 'true',
                usuario_verificador: usuarioActual
            };

            // Obtener planificación de tiempo
            const planificacion = await tableroVerificadorServicio.obtenerPlanificacionTiempo(parametros);

            return respuestaExitosa(res, {
                distribucion_tiempo_actual: planificacion.distribucion_actual,
                tiempo_estimado_pendientes: planificacion.tiempo_estimado,
                sugerencias_planificacion: planificacion.sugerencias,
                carga_trabajo_optima: planificacion.carga_optima,
                bloques_tiempo_disponible: planificacion.bloques_disponibles,
                metas_tiempo: planificacion.metas_tiempo,
                historial_rendimiento: planificacion.historial_rendimiento
            }, 'Planificación de tiempo obtenida correctamente');

        } catch (error) {
            console.error('Error al obtener planificación de tiempo:', error);
            return manejarError(res, error, 'Error al obtener planificación de tiempo');
        }
    }

    // ===================================================
    // 🎓 RECURSOS DE CAPACITACIÓN Y MEJORA
    // ===================================================
    async obtenerRecursosCapacitacion(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar rol de verificador
            if (!usuarioActual.roles_activos.includes('verificador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver recursos de capacitación',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                categoria = 'todas', // 'criterios', 'herramientas', 'comunicacion', 'todas'
                nivel = 'todos', // 'basico', 'intermedio', 'avanzado', 'todos'
                personalizado = 'true'
            } = req.query;

            // Construir parámetros
            const parametros = {
                verificador_id: usuarioActual.id,
                categoria,
                nivel,
                personalizado: personalizado === 'true',
                usuario_verificador: usuarioActual
            };

            // Obtener recursos de capacitación
            const recursos = await tableroVerificadorServicio.obtenerRecursosCapacitacion(parametros);

            return respuestaExitosa(res, {
                recursos_recomendados: recursos.recomendados,
                capacitaciones_disponibles: recursos.capacitaciones,
                guias_verificacion: recursos.guias,
                videos_tutoriales: recursos.videos,
                documentos_referencia: recursos.documentos,
                areas_mejora_detectadas: recursos.areas_mejora,
                progreso_capacitacion: recursos.progreso_personal
            }, 'Recursos de capacitación obtenidos correctamente');

        } catch (error) {
            console.error('Error al obtener recursos de capacitación:', error);
            return manejarError(res, error, 'Error al obtener recursos de capacitación');
        }
    }
}

module.exports = new TableroVerificadorControlador();
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver cola de verificación',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                prioridad = 'todas', // 'alta', 'media', 'baja', 'todas'
                tipo_documento = 'todos',
                docente_id = '',
                ordenar_por = 'fecha_subida', // 'fecha_subida', 'prioridad', 'docente', 'tipo'
                limite = 50,
                incluir_detalles = 'true'
            } = req.query;

            // Validar parámetros
            const ordenacionesValidas = ['fecha_subida', 'prioridad', 'docente', 'tipo'];
            if (!ordenacionesValidas.includes(ordenar_por)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Ordenación inválida',
                    codigo: 'ORDENACION_INVALIDA'
                });
            }

            // Construir filtros
            const filtros = {
                verificador_id: usuarioActual.id,
                prioridad,
                tipo_documento,
                docente_id: docente_id ? parseInt(docente_id) : null,
                ordenar_por,
                limite: Math.min(parseInt(limite) || 50, 100),
                incluir_detalles: incluir_detalles === 'true',
                usuario_verificador: usuarioActual
            };

            // Obtener cola de verificación
            const cola = await tableroVerificadorServicio.obtenerColaVerificacion(filtros);

            return respuestaExitosa(res, {
                documentos_pendientes: cola.pendientes,
                documentos_urgentes: cola.urgentes,
                documentos_prioritarios: cola.prioritarios,
                resumen_cola: cola.resumen,
                tiempo_estimado_total: cola.tiempo_estimado,
                distribucion_por_tipo: cola.distribucion_tipo,
                distribucion_por_docente: cola.distribucion_docente,
                sugerencias_orden: cola.sugerencias_orden
            }, 'Cola de verificación obtenida correctamente');

        } catch (error) {
            console.error('Error al obtener cola de verificación:', error);
            return manejarError(res, error, 'Error al obtener tu cola de verificación');
        }
    }

    // ===================================================
    // 📊 MIS ESTADÍSTICAS DE VERIFICACIÓN
    // ===================================================
    async obtenerMisEstadisticas(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar rol de verificador
            if (!usuarioActual.roles_activos.includes('verificador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver estadísticas de verificación',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                periodo = 'mes', // 'semana', 'mes', 'trimestre', 'ciclo', 'año'
                comparar_con = 'promedio_sistema', // 'promedio_sistema', 'periodo_anterior', 'ninguno'
                incluir_graficos = 'true',
                nivel_detalle = 'medio' // 'alto', 'medio', 'bajo'
            } = req.query;

            // Validar período
            const periodosValidos = ['semana', 'mes', 'trimestre', 'ciclo', 'año'];
            if (!periodosValidos.includes(periodo)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Período inválido',
                    codigo: 'PERIODO_INVALIDO'
                });
            }

            // Construir parámetros
            const parametros = {
                verificador_id: usuarioActual.id,
                periodo,
                comparar_con,
                incluir_graficos: incluir_graficos === 'true',
                nivel_detalle,
                usuario_verificador: usuarioActual
            };

            // Obtener estadísticas personales
            const estadisticas = await tableroVerificadorServicio.obtenerEstadisticasPersonales(parametros);

            return respuestaExitosa(res, {
                resumen_general: estadisticas.resumen,
                documentos_verificados: estadisticas.documentos_verificados,
                tiempo_promedio_verificacion: estadisticas.tiempo_promedio,
                tipos_documento_verificados: estadisticas.tipos_documento,
                observaciones_realizadas: estadisticas.observaciones,
                tendencias_rendimiento: estadisticas.tendencias,
                comparativas: estadisticas.comparativas || null,
                areas_fortaleza: estadisticas.areas_fortaleza,
                areas_mejora: estadisticas.areas_mejora,
                graficos: estadisticas.graficos || null,
                reconocimientos: estadisticas.reconocimientos
            }, 'Estadísticas personales obtenidas correctamente');

        } catch (error) {
            console.error('Error al obtener estadísticas del verificador:', error);
            return manejarError(res, error, 'Error al obtener tus estadísticas');
        }
    }

    // ===================================================
    // 👥 MIS DOCENTES ASIGNADOS
    // ===================================================
    async obtenerDocentesAsignados(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar rol de verificador
            if (!usuarioActual.roles_activos.includes('verificador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver docentes asignados',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                ciclo_id = '',
                estado_portafolio = 'todos', // 'activo', 'completado', 'retrasado', 'todos'
                incluir_estadisticas = 'true',
                ordenar_por = 'nombre' // 'nombre', 'progreso', 'pendientes', 'ultima_actividad'
            } = req.query;

            // Construir filtros
            const filtros = {
                verificador_id: usuarioActual.id,
                ciclo_id: ciclo_id ? parseInt(ciclo_id) : null,
                estado_portafolio,
                incluir_estadisticas: incluir_estadisticas === 'true',
                ordenar_por,
                usuario_verificador: usuarioActual
            };

            // Obtener docentes asignados
            const docentes = await tableroVerificadorServicio.obtenerDocentesAsignados(filtros);

            return respuestaExitosa(res, {
                docentes_activos: docentes.activos,
                resumen_asignaciones: docentes.resumen,
                progreso_por_docente: docentes.progreso_docentes,
                docentes_con_pendientes: docentes.con_pendientes,
                docentes_destacados: docentes.destacados,
                docentes_necesitan_atencion: docentes.necesitan_atencion,
                estadisticas_generales: docentes.estadisticas || null,
                carga_trabajo_distribucion: docentes.distribucion_carga
            }, 'Docentes asignados obtenidos correctamente');

        } catch (error) {
            console.error('Error al obtener docentes asignados:', error);
            return manejarError(res, error, 'Error al obtener tus docentes asignados');
        }
    }

    // ===================================================
    // 💬 OBSERVACIONES Y COMUNICACIONES ACTIVAS
    // ===================================================
    async obtenerObservacionesActivas(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar rol de verificador
            if (!usuarioActual.roles_activos.includes('verificador')) {