// ============================================================
// ✅ RUTAS DE VERIFICACIÓN DE DOCUMENTOS
// Sistema Portafolio Docente UNSAAC
// ============================================================

const express = require('express');
const router = express.Router();

// Controladores
const asignacionesControlador = require('../../../controladores/verificacion/asignaciones.controlador');
const estadisticasControlador = require('../../../controladores/verificacion/estadisticas.controlador');
const revisionControlador = require('../../../controladores/verificacion/revision.controlador');

// Middlewares
const { verificarRol, verificarPermisos } = require('../../../middleware/autorizacion/roles.middleware');
const { validarEsquema } = require('../../../middleware/validacion/esquemas.middleware');

// Esquemas de validación
const { esquemaAsignacionVerificador } = require('../../../validadores/verificacion/asignaciones.validador');
const { esquemaRevisionDocumento, esquemaObservacion } = require('../../../validadores/verificacion/revision.validador');

// ===================================================
// 📋 RUTAS DE ASIGNACIONES DE VERIFICACIÓN
// ===================================================

/**
 * @route POST /api/v1/verificacion/asignar
 * @desc Asignar verificador a docente(s)
 * @access Privado (Solo Admin)
 */
router.post('/asignar', 
    verificarRol(['administrador']),
    validarEsquema(esquemaAsignacionVerificador),
    asignacionesControlador.asignarVerificador
);

/**
 * @route GET /api/v1/verificacion/mis-asignaciones
 * @desc Obtener mis asignaciones (verificador)
 * @access Privado (Solo Verificador)
 */
router.get('/mis-asignaciones', 
    verificarRol(['verificador']),
    asignacionesControlador.obtenerMisAsignaciones
);

/**
 * @route GET /api/v1/verificacion/carga-trabajo
 * @desc Obtener carga de trabajo por verificador
 * @access Privado (Admin, Verificador propio)
 */
router.get('/carga-trabajo', 
    verificarPermisos(['verificacion.ver_carga']),
    asignacionesControlador.obtenerCargaTrabajo
);

/**
 * @route PUT /api/v1/verificacion/reasignar/:asignacionId
 * @desc Reasignar docente a otro verificador
 * @access Privado (Solo Admin)
 */
router.put('/reasignar/:asignacionId', 
    verificarRol(['administrador']),
    asignacionesControlador.reasignarDocente
);

/**
 * @route POST /api/v1/verificacion/asignacion-automatica
 * @desc Asignación automática balanceada
 * @access Privado (Solo Admin)
 */
router.post('/asignacion-automatica', 
    verificarRol(['administrador']),
    asignacionesControlador.asignacionAutomatica
);

/**
 * @route GET /api/v1/verificacion/estadisticas/asignaciones
 * @desc Obtener estadísticas de asignaciones
 * @access Privado (Solo Admin)
 */
router.get('/estadisticas/asignaciones', 
    verificarRol(['administrador']),
    asignacionesControlador.obtenerEstadisticasAsignaciones
);

/**
 * @route POST /api/v1/verificacion/rotacion
 * @desc Ejecutar rotación de asignaciones
 * @access Privado (Solo Admin)
 */
router.post('/rotacion', 
    verificarRol(['administrador']),
    asignacionesControlador.ejecutarRotacionAsignaciones
);

/**
 * @route DELETE /api/v1/verificacion/desactivar/:asignacionId
 * @desc Desactivar asignación
 * @access Privado (Solo Admin)
 */
router.delete('/desactivar/:asignacionId', 
    verificarRol(['administrador']),
    asignacionesControlador.desactivarAsignacion
);

// ===================================================
// 📊 RUTAS DE ESTADÍSTICAS DE VERIFICACIÓN
// ===================================================

/**
 * @route GET /api/v1/verificacion/estadisticas/general
 * @desc Obtener estadísticas generales de verificación
 * @access Privado (Admin, Verificador)
 */
router.get('/estadisticas/general', 
    verificarPermisos(['verificacion.ver_estadisticas']),
    estadisticasControlador.obtenerEstadisticasGenerales
);

/**
 * @route GET /api/v1/verificacion/estadisticas/verificador/:verificadorId
 * @desc Obtener estadísticas por verificador específico
 * @access Privado (Admin, Verificador propio)
 */
router.get('/estadisticas/verificador/:verificadorId', 
    estadisticasControlador.obtenerEstadisticasVerificador
);

/**
 * @route GET /api/v1/verificacion/estadisticas/tendencias
 * @desc Obtener tendencias temporales de verificación
 * @access Privado (Admin, Verificador)
 */
router.get('/estadisticas/tendencias', 
    verificarPermisos(['verificacion.ver_estadisticas']),
    estadisticasControlador.obtenerTendenciasTemporales
);

/**
 * @route GET /api/v1/verificacion/estadisticas/tiempo-real
 * @desc Obtener métricas de rendimiento en tiempo real
 * @access Privado (Admin, Verificador)
 */
router.get('/estadisticas/tiempo-real', 
    verificarPermisos(['verificacion.ver_estadisticas']),
    estadisticasControlador.obtenerMetricasTiempoReal
);

/**
 * @route GET /api/v1/verificacion/estadisticas/comparativo
 * @desc Obtener análisis comparativo de rendimiento
 * @access Privado (Solo Admin)
 */
router.get('/estadisticas/comparativo', 
    verificarRol(['administrador']),
    estadisticasControlador.obtenerAnalisisComparativo
);

/**
 * @route GET /api/v1/verificacion/estadisticas/calidad
 * @desc Obtener indicadores de calidad de verificación
 * @access Privado (Admin, Verificador)
 */
router.get('/estadisticas/calidad', 
    verificarPermisos(['verificacion.ver_estadisticas']),
    estadisticasControlador.obtenerIndicadoresCalidad
);

/**
 * @route GET /api/v1/verificacion/estadisticas/reporte-ejecutivo
 * @desc Generar reporte ejecutivo
 * @access Privado (Solo Admin)
 */
router.get('/estadisticas/reporte-ejecutivo', 
    verificarRol(['administrador']),
    estadisticasControlador.generarReporteEjecutivo
);

/**
 * @route POST /api/v1/verificacion/estadisticas/configurar-alertas
 * @desc Configurar alertas de rendimiento
 * @access Privado (Solo Admin)
 */
router.post('/estadisticas/configurar-alertas', 
    verificarRol(['administrador']),
    estadisticasControlador.configurarAlertasRendimiento
);

/**
 * @route GET /api/v1/verificacion/estadisticas/exportar
 * @desc Exportar datos de estadísticas
 * @access Privado (Solo Admin)
 */
router.get('/estadisticas/exportar', 
    verificarRol(['administrador']),
    estadisticasControlador.exportarDatosEstadisticas
);

// ===================================================
// ✅ RUTAS DE REVISIÓN DE DOCUMENTOS
// ===================================================

/**
 * @route GET /api/v1/verificacion/pendientes
 * @desc Obtener documentos pendientes de verificación
 * @access Privado (Solo Verificador)
 */
router.get('/pendientes', 
    verificarRol(['verificador']),
    revisionControlador.obtenerDocumentosPendientes
);

/**
 * @route PUT /api/v1/verificacion/:documentoId/aprobar
 * @desc Aprobar documento
 * @access Privado (Solo Verificador)
 */
router.put('/:documentoId/aprobar', 
    verificarRol(['verificador']),
    revisionControlador.aprobarDocumento
);

/**
 * @route PUT /api/v1/verificacion/:documentoId/rechazar
 * @desc Rechazar documento
 * @access Privado (Solo Verificador)
 */
router.put('/:documentoId/rechazar', 
    verificarRol(['verificador']),
    validarEsquema(esquemaRevisionDocumento),
    revisionControlador.rechazarDocumento
);

/**
 * @route POST /api/v1/verificacion/:documentoId/observacion
 * @desc Crear observación sin cambiar estado
 * @access Privado (Solo Verificador)
 */
router.post('/:documentoId/observacion', 
    verificarRol(['verificador']),
    validarEsquema(esquemaObservacion),
    revisionControlador.crearObservacion
);

/**
 * @route PUT /api/v1/verificacion/:documentoId/solicitar-correccion
 * @desc Solicitar corrección
 * @access Privado (Solo Verificador)
 */
router.put('/:documentoId/solicitar-correccion', 
    verificarRol(['verificador']),
    revisionControlador.solicitarCorreccion
);

/**
 * @route POST /api/v1/verificacion/revision-lotes
 * @desc Revisión por lotes (múltiples documentos)
 * @access Privado (Solo Verificador)
 */
router.post('/revision-lotes', 
    verificarRol(['verificador']),
    revisionControlador.revisionPorLotes
);

/**
 * @route GET /api/v1/verificacion/historial
 * @desc Obtener historial de revisiones
 * @access Privado (Admin, Verificador)
 */
router.get('/historial', 
    verificarPermisos(['verificacion.ver_historial']),
    revisionControlador.obtenerHistorialRevisiones
);

/**
 * @route POST /api/v1/verificacion/asignar-documento
 * @desc Asignar documento para revisión
 * @access Privado (Solo Admin)
 */
router.post('/asignar-documento', 
    verificarRol(['administrador']),
    revisionControlador.asignarDocumentoRevision
);

/**
 * @route PUT /api/v1/verificacion/:documentoId/marcar-revision
 * @desc Marcar documento como en revisión
 * @access Privado (Solo Verificador)
 */
router.put('/:documentoId/marcar-revision', 
    verificarRol(['verificador']),
    revisionControlador.marcarEnRevision
);

// ===================================================
// 🔍 RUTAS DE CONSULTA Y FILTROS
// ===================================================

/**
 * @route GET /api/v1/verificacion/documentos/filtrar
 * @desc Filtrar documentos por criterios
 * @access Privado (Admin, Verificador)
 */
router.get('/documentos/filtrar', 
    verificarPermisos(['verificacion.ver_documentos']),
    revisionControlador.filtrarDocumentos
);

/**
 * @route GET /api/v1/verificacion/docentes/asignados
 * @desc Obtener docentes asignados al verificador
 * @access Privado (Solo Verificador)
 */
router.get('/docentes/asignados', 
    verificarRol(['verificador']),
    asignacionesControlador.obtenerDocentesAsignados
);

/**
 * @route GET /api/v1/verificacion/cola/priorizada
 * @desc Obtener cola de verificación priorizada
 * @access Privado (Solo Verificador)
 */
router.get('/cola/priorizada', 
    verificarRol(['verificador']),
    revisionControlador.obtenerColaPriorizada
);

// ===================================================
// 📈 RUTAS DE MÉTRICAS PERSONALES
// ===================================================

/**
 * @route GET /api/v1/verificacion/mis-metricas
 * @desc Obtener mis métricas de verificación
 * @access Privado (Solo Verificador)
 */
router.get('/mis-metricas', 
    verificarRol(['verificador']),
    estadisticasControlador.obtenerMisMetricas
);

/**
 * @route GET /api/v1/verificacion/mi-rendimiento
 * @desc Obtener mi rendimiento comparativo
 * @access Privado (Solo Verificador)
 */
router.get('/mi-rendimiento', 
    verificarRol(['verificador']),
    estadisticasControlador.obtenerMiRendimiento
);

/**
 * @route GET /api/v1/verificacion/mis-objetivos
 * @desc Obtener mis objetivos y metas
 * @access Privado (Solo Verificador)
 */
router.get('/mis-objetivos', 
    verificarRol(['verificador']),
    asignacionesControlador.obtenerMisObjetivos
);

/**
 * @route PUT /api/v1/verificacion/configurar-preferencias
 * @desc Configurar preferencias de verificación
 * @access Privado (Solo Verificador)
 */
router.put('/configurar-preferencias', 
    verificarRol(['verificador']),
    revisionControlador.configurarPreferencias
);

// ===================================================
// 🚨 RUTAS DE ALERTAS Y NOTIFICACIONES
// ===================================================

/**
 * @route GET /api/v1/verificacion/alertas
 * @desc Obtener alertas de verificación
 * @access Privado (Admin, Verificador)
 */
router.get('/alertas', 
    verificarPermisos(['verificacion.ver_alertas']),
    estadisticasControlador.obtenerAlertasVerificacion
);

/**
 * @route POST /api/v1/verificacion/alertas/marcar-leida/:alertaId
 * @desc Marcar alerta como leída
 * @access Privado (Admin, Verificador)
 */
router.post('/alertas/marcar-leida/:alertaId', 
    verificarPermisos(['verificacion.gestionar_alertas']),
    estadisticasControlador.marcarAlertaLeida
);

/**
 * @route GET /api/v1/verificacion/notificaciones/configuracion
 * @desc Obtener configuración de notificaciones
 * @access Privado (Verificador)
 */
router.get('/notificaciones/configuracion', 
    verificarRol(['verificador']),
    revisionControlador.obtenerConfiguracionNotificaciones
);

/**
 * @route PUT /api/v1/verificacion/notificaciones/configuracion
 * @desc Actualizar configuración de notificaciones
 * @access Privado (Verificador)
 */
router.put('/notificaciones/configuracion', 
    verificarRol(['verificador']),
    revisionControlador.actualizarConfiguracionNotificaciones
);

// ===================================================
// 🔧 RUTAS DE HERRAMIENTAS Y UTILIDADES
// ===================================================

/**
 * @route GET /api/v1/verificacion/plantillas/observaciones
 * @desc Obtener plantillas de observaciones
 * @access Privado (Verificador)
 */
router.get('/plantillas/observaciones', 
    verificarRol(['verificador']),
    revisionControlador.obtenerPlantillasObservaciones
);

/**
 * @route POST /api/v1/verificacion/plantillas/observaciones
 * @desc Crear plantilla de observación personalizada
 * @access Privado (Verificador)
 */
router.post('/plantillas/observaciones', 
    verificarRol(['verificador']),
    revisionControlador.crearPlantillaObservacion
);

/**
 * @route GET /api/v1/verificacion/criterios/evaluacion
 * @desc Obtener criterios de evaluación
 * @access Privado (Verificador)
 */
router.get('/criterios/evaluacion', 
    verificarRol(['verificador']),
    revisionControlador.obtenerCriteriosEvaluacion
);

/**
 * @route GET /api/v1/verificacion/herramientas/rapidas
 * @desc Obtener herramientas de verificación rápida
 * @access Privado (Verificador)
 */
router.get('/herramientas/rapidas', 
    verificarRol(['verificador']),
    revisionControlador.obtenerHerramientasRapidas
);

// ===================================================
// 📋 RUTAS DE GESTIÓN DE CARGA DE TRABAJO
// ===================================================

/**
 * @route GET /api/v1/verificacion/carga/distribucion
 * @desc Obtener distribución de carga de trabajo
 * @access Privado (Admin)
 */
router.get('/carga/distribucion', 
    verificarRol(['administrador']),
    asignacionesControlador.obtenerDistribucionCarga
);

/**
 * @route POST /api/v1/verificacion/carga/balancear
 * @desc Balancear carga de trabajo automáticamente
 * @access Privado (Admin)
 */
router.post('/carga/balancear', 
    verificarRol(['administrador']),
    asignacionesControlador.balancearCargaTrabajo
);

/**
 * @route GET /api/v1/verificacion/carga/prediccion
 * @desc Obtener predicción de carga de trabajo
 * @access Privado (Admin)
 */
router.get('/carga/prediccion', 
    verificarRol(['administrador']),
    asignacionesControlador.obtenerPrediccionCarga
);

// ===================================================
// 📊 RUTAS DE EXPORTACIÓN Y REPORTES
// ===================================================

/**
 * @route GET /api/v1/verificacion/exportar/mis-verificaciones
 * @desc Exportar mis verificaciones
 * @access Privado (Verificador)
 */
router.get('/exportar/mis-verificaciones', 
    verificarRol(['verificador']),
    revisionControlador.exportarMisVerificaciones
);

/**
 * @route GET /api/v1/verificacion/reportes/consolidado
 * @desc Generar reporte consolidado de verificación
 * @access Privado (Admin)
 */
router.get('/reportes/consolidado', 
    verificarRol(['administrador']),
    estadisticasControlador.generarReporteConsolidado
);

/**
 * @route GET /api/v1/verificacion/analisis/eficiencia
 * @desc Análisis de eficiencia del proceso
 * @access Privado (Admin)
 */
router.get('/analisis/eficiencia', 
    verificarRol(['administrador']),
    estadisticasControlador.analizarEficienciaProceso
);

module.exports = router;