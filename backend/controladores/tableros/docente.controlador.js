/**
 * 📚 CONTROLADOR DE DASHBOARD DE DOCENTE
 * 
 * Dashboard específico para docentes:
 * - Estado de mis portafolios
 * - Documentos pendientes
 * - Observaciones recientes
 * - Progreso personal
 * - Notificaciones importantes
 * 
 * Rutas que maneja:
 * GET /api/v1/tableros/docente - Dashboard principal
 * GET /api/v1/tableros/docente/progreso - Mi progreso
 * GET /api/v1/tableros/docente/pendientes - Tareas pendientes
 */

// TODO: Vista centrada en progreso personal
// TODO: Recordatorios de fechas límite
// TODO: Acceso rápido a subir documentos
// TODO: Resumen de observaciones
// TODO: Calendario de actividades
// ============================================================
// 📚 CONTROLADOR DE DASHBOARD DE DOCENTE
// Sistema Portafolio Docente UNSAAC
// ============================================================

const tableroDocenteServicio = require('../../servicios/tableros/docente.servicio');
const { manejarError, respuestaExitosa } = require('../../utilidades/formato/datos.util');
const { registrarAccion } = require('../../utilidades/base-datos/auditoria.util');

class TableroDocenteControlador {

    // ===================================================
    // 📚 DASHBOARD PRINCIPAL DE DOCENTE
    // ===================================================
    async obtenerDashboardPrincipal(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar que el usuario tenga rol de docente
            if (!usuarioActual.roles_activos.includes('docente')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para acceder al dashboard de docente',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const { 
                ciclo_id = '',
                incluir_historico = 'false',
                vista = 'completa' // 'completa', 'resumen'
            } = req.query;

            // Construir parámetros
            const parametros = {
                docente_id: usuarioActual.id,
                ciclo_id: ciclo_id ? parseInt(ciclo_id) : null,
                incluir_historico: incluir_historico === 'true',
                vista,
                usuario_docente: usuarioActual
            };

            // Obtener dashboard del docente
            const dashboard = await tableroDocenteServicio.obtenerDashboardCompleto(parametros);

            // Registrar acceso
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'consultar',
                modulo: 'tableros',
                descripcion: 'Accedió a su dashboard de docente',
                datos_adicionales: { ciclo_id, vista },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                // Información personal del docente
                perfil_docente: dashboard.perfil_docente,
                
                // Estado de mis portafolios
                mis_portafolios: dashboard.mis_portafolios,
                
                // Progreso general
                progreso_general: dashboard.progreso_general,
                
                // Tareas pendientes
                tareas_pendientes: dashboard.tareas_pendientes,
                
                // Observaciones recientes
                observaciones_recientes: dashboard.observaciones_recientes,
                
                // Notificaciones importantes
                notificaciones_importantes: dashboard.notificaciones_importantes,
                
                // Calendario de fechas importantes
                calendario_fechas: dashboard.calendario_fechas,
                
                // Estadísticas personales
                estadisticas_personales: dashboard.estadisticas_personales,
                
                // Accesos rápidos
                accesos_rapidos: dashboard.accesos_rapidos,
                
                // Recordatorios
                recordatorios: dashboard.recordatorios,
                
                // Metadatos
                ultima_actualizacion: dashboard.ultima_actualizacion,
                ciclo_activo: dashboard.ciclo_activo
            }, 'Dashboard de docente obtenido correctamente');

        } catch (error) {
            console.error('Error al obtener dashboard de docente:', error);
            return manejarError(res, error, 'Error al cargar dashboard de docente');
        }
    }

    // ===================================================
    // 📈 MI PROGRESO DETALLADO
    // ===================================================
    async obtenerMiProgreso(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar rol de docente
            if (!usuarioActual.roles_activos.includes('docente')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver progreso de docente',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                ciclo_id = '',
                asignatura_id = '',
                nivel_detalle = 'medio', // 'alto', 'medio', 'bajo'
                incluir_comparativas = 'true',
                incluir_proyecciones = 'false'
            } = req.query;

            // Construir filtros
            const filtros = {
                docente_id: usuarioActual.id,
                ciclo_id: ciclo_id ? parseInt(ciclo_id) : null,
                asignatura_id: asignatura_id ? parseInt(asignatura_id) : null,
                nivel_detalle,
                incluir_comparativas: incluir_comparativas === 'true',
                incluir_proyecciones: incluir_proyecciones === 'true',
                usuario_docente: usuarioActual
            };

            // Obtener progreso detallado
            const progreso = await tableroDocenteServicio.obtenerProgresoDetallado(filtros);

            return respuestaExitosa(res, {
                progreso_general: progreso.general,
                progreso_por_portafolio: progreso.por_portafolio,
                progreso_por_seccion: progreso.por_seccion,
                tendencias: progreso.tendencias,
                comparativas: progreso.comparativas || null,
                proyecciones: progreso.proyecciones || null,
                areas_mejora: progreso.areas_mejora,
                logros_destacados: progreso.logros,
                siguiente_meta: progreso.siguiente_meta
            }, 'Progreso detallado obtenido correctamente');

        } catch (error) {
            console.error('Error al obtener progreso del docente:', error);
            return manejarError(res, error, 'Error al obtener tu progreso');
        }
    }

    // ===================================================
    // ✅ TAREAS PENDIENTES Y RECORDATORIOS
    // ===================================================
    async obtenerTareasPendientes(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar rol de docente
            if (!usuarioActual.roles_activos.includes('docente')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver tareas de docente',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                prioridad = 'todas', // 'alta', 'media', 'baja', 'todas'
                tipo = 'todas', // 'documentos', 'observaciones', 'fechas_limite', 'sistema'
                dias_limite = 30,
                incluir_completadas = 'false'
            } = req.query;

            // Validar prioridad
            const prioridadesValidas = ['alta', 'media', 'baja', 'todas'];
            if (!prioridadesValidas.includes(prioridad)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Prioridad inválida',
                    codigo: 'PRIORIDAD_INVALIDA'
                });
            }

            // Construir filtros
            const filtros = {
                docente_id: usuarioActual.id,
                prioridad,
                tipo,
                dias_limite: Math.min(parseInt(dias_limite) || 30, 90),
                incluir_completadas: incluir_completadas === 'true',
                usuario_docente: usuarioActual
            };

            // Obtener tareas pendientes
            const tareas = await tableroDocenteServicio.obtenerTareasPendientes(filtros);

            return respuestaExitosa(res, {
                tareas_urgentes: tareas.urgentes,
                tareas_importantes: tareas.importantes,
                tareas_normales: tareas.normales,
                recordatorios_fechas: tareas.recordatorios_fechas,
                observaciones_pendientes: tareas.observaciones_pendientes,
                documentos_rechazados: tareas.documentos_rechazados,
                resumen_tareas: tareas.resumen,
                sugerencias_accion: tareas.sugerencias
            }, 'Tareas pendientes obtenidas correctamente');

        } catch (error) {
            console.error('Error al obtener tareas pendientes:', error);
            return manejarError(res, error, 'Error al obtener tus tareas pendientes');
        }
    }

    // ===================================================
    // 💬 MIS OBSERVACIONES Y COMUNICACIONES
    // ===================================================
    async obtenerMisObservaciones(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar rol de docente
            if (!usuarioActual.roles_activos.includes('docente')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver observaciones de docente',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                estado = 'todas', // 'pendientes', 'respondidas', 'resueltas', 'todas'
                verificador_id = '',
                documento_id = '',
                dias = 30,
                incluir_respuestas = 'true'
            } = req.query;

            // Construir filtros
            const filtros = {
                docente_id: usuarioActual.id,
                estado,
                verificador_id: verificador_id ? parseInt(verificador_id) : null,
                documento_id: documento_id ? parseInt(documento_id) : null,
                dias: Math.min(parseInt(dias) || 30, 90),
                incluir_respuestas: incluir_respuestas === 'true',
                usuario_docente: usuarioActual
            };

            // Obtener observaciones
            const observaciones = await tableroDocenteServicio.obtenerMisObservaciones(filtros);

            return respuestaExitosa(res, {
                observaciones_pendientes: observaciones.pendientes,
                observaciones_recientes: observaciones.recientes,
                conversaciones_activas: observaciones.conversaciones_activas,
                estadisticas_observaciones: observaciones.estadisticas,
                verificadores_frecuentes: observaciones.verificadores_frecuentes,
                temas_comunes: observaciones.temas_comunes,
                tiempo_respuesta_promedio: observaciones.tiempo_respuesta
            }, 'Observaciones obtenidas correctamente');

        } catch (error) {
            console.error('Error al obtener observaciones del docente:', error);
            return manejarError(res, error, 'Error al obtener tus observaciones');
        }
    }

    // ===================================================
    // 📁 ESTADO DE MIS PORTAFOLIOS
    // ===================================================
    async obtenerEstadoPortafolios(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar rol de docente
            if (!usuarioActual.roles_activos.includes('docente')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver portafolios de docente',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                ciclo_id = '',
                incluir_estadisticas = 'true',
                vista = 'completa' // 'completa', 'resumen'
            } = req.query;

            // Construir parámetros
            const parametros = {
                docente_id: usuarioActual.id,
                ciclo_id: ciclo_id ? parseInt(ciclo_id) : null,
                incluir_estadisticas: incluir_estadisticas === 'true',
                vista,
                usuario_docente: usuarioActual
            };

            // Obtener estado de portafolios
            const portafolios = await tableroDocenteServicio.obtenerEstadoPortafolios(parametros);

            return respuestaExitosa(res, {
                portafolios_activos: portafolios.activos,
                resumen_por_asignatura: portafolios.por_asignatura,
                progreso_completitud: portafolios.progreso,
                documentos_por_estado: portafolios.documentos_por_estado,
                verificaciones_pendientes: portafolios.verificaciones_pendientes,
                alertas_portafolios: portafolios.alertas,
                estadisticas_generales: portafolios.estadisticas || null,
                acciones_recomendadas: portafolios.acciones_recomendadas
            }, 'Estado de portafolios obtenido correctamente');

        } catch (error) {
            console.error('Error al obtener estado de portafolios:', error);
            return manejarError(res, error, 'Error al obtener estado de tus portafolios');
        }
    }

    // ===================================================
    // 📅 CALENDARIO Y FECHAS IMPORTANTES
    // ===================================================
    async obtenerCalendarioFechas(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar rol de docente
            if (!usuarioActual.roles_activos.includes('docente')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver calendario de docente',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                mes = '',
                año = '',
                tipo_eventos = 'todos', // 'fechas_limite', 'reuniones', 'capacitaciones', 'todos'
                incluir_pasados = 'false'
            } = req.query;

            // Validar y construir fechas
            const fechaActual = new Date();
            const mesNum = mes ? parseInt(mes) : fechaActual.getMonth() + 1;
            const añoNum = año ? parseInt(año) : fechaActual.getFullYear();

            if (mesNum < 1 || mesNum > 12) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Mes inválido. Use valores del 1 al 12',
                    codigo: 'MES_INVALIDO'
                });
            }

            // Construir parámetros
            const parametros = {
                docente_id: usuarioActual.id,
                mes: mesNum,
                año: añoNum,
                tipo_eventos,
                incluir_pasados: incluir_pasados === 'true',
                usuario_docente: usuarioActual
            };

            // Obtener calendario
            const calendario = await tableroDocenteServicio.obtenerCalendarioFechas(parametros);

            return respuestaExitosa(res, {
                mes_consultado: mesNum,
                año_consultado: añoNum,
                eventos_mes: calendario.eventos,
                fechas_limite_proximas: calendario.fechas_limite,
                reuniones_programadas: calendario.reuniones,
                capacitaciones_disponibles: calendario.capacitaciones,
                recordatorios_importantes: calendario.recordatorios,
                estadisticas_mes: calendario.estadisticas,
                navegacion_calendario: calendario.navegacion
            }, 'Calendario obtenido correctamente');

        } catch (error) {
            console.error('Error al obtener calendario:', error);
            return manejarError(res, error, 'Error al obtener tu calendario');
        }
    }

    // ===================================================
    // 🔔 MIS NOTIFICACIONES IMPORTANTES
    // ===================================================
    async obtenerMisNotificaciones(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar rol de docente
            if (!usuarioActual.roles_activos.includes('docente')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver notificaciones de docente',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                tipo = 'todas', // 'sistema', 'documento', 'observacion', 'ciclo', 'todas'
                estado = 'no_leidas', // 'leidas', 'no_leidas', 'todas'
                prioridad = 'todas', // 'urgente', 'alta', 'media', 'baja', 'todas'
                limite = 50
            } = req.query;

            // Construir filtros
            const filtros = {
                usuario_id: usuarioActual.id,
                tipo,
                estado,
                prioridad,
                limite: Math.min(parseInt(limite) || 50, 100),
                usuario_docente: usuarioActual
            };

            // Obtener notificaciones
            const notificaciones = await tableroDocenteServicio.obtenerMisNotificaciones(filtros);

            return respuestaExitosa(res, {
                notificaciones_urgentes: notificaciones.urgentes,
                notificaciones_importantes: notificaciones.importantes,
                notificaciones_recientes: notificaciones.recientes,
                resumen_no_leidas: notificaciones.resumen_no_leidas,
                configuracion_notificaciones: notificaciones.configuracion,
                canales_disponibles: notificaciones.canales
            }, 'Notificaciones obtenidas correctamente');

        } catch (error) {
            console.error('Error al obtener notificaciones:', error);
            return manejarError(res, error, 'Error al obtener tus notificaciones');
        }
    }

    // ===================================================
    // 📊 MIS ESTADÍSTICAS PERSONALES
    // ===================================================
    async obtenerEstadisticasPersonales(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar rol de docente
            if (!usuarioActual.roles_activos.includes('docente')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver estadísticas de docente',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                periodo = 'ciclo_actual', // 'mes', 'ciclo_actual', 'año', 'historico'
                comparar_con = 'promedio', // 'promedio', 'periodo_anterior', 'ninguno'
                incluir_graficos = 'true'
            } = req.query;

            // Construir parámetros
            const parametros = {
                docente_id: usuarioActual.id,
                periodo,
                comparar_con,
                incluir_graficos: incluir_graficos === 'true',
                usuario_docente: usuarioActual
            };

            // Obtener estadísticas personales
            const estadisticas = await tableroDocenteServicio.obtenerEstadisticasPersonales(parametros);

            return respuestaExitosa(res, {
                resumen_actividad: estadisticas.actividad,
                metricas_documentos: estadisticas.documentos,
                metricas_verificacion: estadisticas.verificacion,
                tiempo_en_sistema: estadisticas.tiempo_sistema,
                progreso_temporal: estadisticas.progreso_temporal,
                comparativas: estadisticas.comparativas || null,
                logros_obtenidos: estadisticas.logros,
                areas_mejora: estadisticas.areas_mejora,
                graficos: estadisticas.graficos || null
            }, 'Estadísticas personales obtenidas correctamente');

        } catch (error) {
            console.error('Error al obtener estadísticas personales:', error);
            return manejarError(res, error, 'Error al obtener tus estadísticas');
        }
    }

    // ===================================================
    // 🚀 ACCIONES RÁPIDAS PARA DOCENTE
    // ===================================================
    async obtenerAccionesRapidas(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar rol de docente
            if (!usuarioActual.roles_activos.includes('docente')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver acciones de docente',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            // Obtener acciones rápidas personalizadas
            const acciones = await tableroDocenteServicio.obtenerAccionesRapidas(usuarioActual.id);

            return respuestaExitosa(res, {
                acciones_documentos: acciones.documentos,
                acciones_observaciones: acciones.observaciones,
                acciones_portafolios: acciones.portafolios,
                atajos_frecuentes: acciones.atajos_frecuentes,
                enlaces_utiles: acciones.enlaces_utiles,
                herramientas_recomendadas: acciones.herramientas
            }, 'Acciones rápidas obtenidas correctamente');

        } catch (error) {
            console.error('Error al obtener acciones rápidas:', error);
            return manejarError(res, error, 'Error al obtener acciones rápidas');
        }
    }

    // ===================================================
    // 🎯 CONFIGURAR PREFERENCIAS DE DASHBOARD
    // ===================================================
    async configurarPreferencias(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar rol de docente
            if (!usuarioActual.roles_activos.includes('docente')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para configurar preferencias',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                widgets_visibles = [],
                layout_dashboard = 'default',
                notificaciones_dashboard = true,
                actualizar_automatico = true,
                mostrar_ayudas = true,
                tema_visual = 'claro'
            } = req.body;

            // Validar configuración
            if (!Array.isArray(widgets_visibles)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'widgets_visibles debe ser un array',
                    codigo: 'WIDGETS_INVALIDOS'
                });
            }

            // Configurar preferencias
            const preferencias = {
                widgets_visibles,
                layout_dashboard,
                notificaciones_dashboard,
                actualizar_automatico,
                mostrar_ayudas,
                tema_visual
            };

            const resultado = await tableroDocenteServicio.configurarPreferencias(
                usuarioActual.id, 
                preferencias
            );

            // Registrar cambio de configuración
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'configurar',
                modulo: 'tableros',
                descripcion: 'Configuró preferencias de dashboard',
                datos_nuevos: preferencias,
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                preferencias_actualizadas: resultado.preferencias,
                widgets_disponibles: resultado.widgets_disponibles,
                layouts_disponibles: resultado.layouts_disponibles
            }, 'Preferencias configuradas correctamente');

        } catch (error) {
            console.error('Error al configurar preferencias:', error);
            return manejarError(res, error, 'Error al configurar preferencias');
        }
    }

    // ===================================================
    // 📤 EXPORTAR RESUMEN PERSONAL
    // ===================================================
    async exportarResumenPersonal(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar rol de docente
            if (!usuarioActual.roles_activos.includes('docente')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para exportar resumen',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                formato = 'pdf', // 'pdf', 'excel'
                periodo = 'ciclo_actual',
                incluir_graficos = 'true',
                incluir_observaciones = 'false'
            } = req.query;

            // Validar formato
            if (!['pdf', 'excel'].includes(formato)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Formato inválido. Use: pdf o excel',
                    codigo: 'FORMATO_INVALIDO'
                });
            }

            // Construir parámetros de exportación
            const parametros = {
                docente_id: usuarioActual.id,
                formato,
                periodo,
                incluir_graficos: incluir_graficos === 'true',
                incluir_observaciones: incluir_observaciones === 'true',
                usuario_docente: usuarioActual
            };

            // Generar archivo de exportación
            const archivo = await tableroDocenteServicio.exportarResumenPersonal(parametros);

            // Registrar exportación
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'exportar',
                modulo: 'tableros',
                descripcion: `Exportó resumen personal en formato ${formato}`,
                datos_adicionales: { formato, periodo },
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
                `attachment; filename="mi_resumen_${periodo}.${extension}"`);

            return res.send(archivo.buffer);

        } catch (error) {
            console.error('Error al exportar resumen personal:', error);
            return manejarError(res, error, 'Error al exportar tu resumen');
        }
    }
}

module.exports = new TableroDocenteControlador();