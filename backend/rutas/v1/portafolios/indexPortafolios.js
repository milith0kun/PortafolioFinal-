// ============================================================
// 📁 RUTAS DE GESTIÓN DE PORTAFOLIOS
// Sistema Portafolio Docente UNSAAC
// ============================================================

const express = require('express');
const router = express.Router();

// Controladores
const estructuraControlador = require('../../../controladores/portafolios/estructura.controlador');
const navegacionControlador = require('../../../controladores/portafolios/navegacion.controlador');
const progresoControlador = require('../../../controladores/portafolios/progreso.controlador');

// Middlewares
const { verificarRol, verificarPermisos } = require('../../../middleware/autorizacion/roles.middleware');
const { validarEsquema } = require('../../../middleware/validacion/esquemas.middleware');

// Esquemas de validación
const { esquemaGenerarEstructura, esquemaPersonalizarEstructura } = require('../../../validadores/portafolios/estructura.validador');
const { esquemaBusquedaPortafolios } = require('../../../validadores/portafolios/navegacion.validador');

// ===================================================
// 🏗️ RUTAS DE ESTRUCTURA DE PORTAFOLIOS
// ===================================================

/**
 * @route POST /api/v1/portafolios/estructura/generar
 * @desc Generar estructura de portafolio
 * @access Privado (Admin, Docente propio)
 */
router.post('/estructura/generar', 
    verificarPermisos(['portafolios.crear']),
    validarEsquema(esquemaGenerarEstructura),
    estructuraControlador.generarEstructura
);

/**
 * @route GET /api/v1/portafolios/estructura/administrador
 * @desc Obtener árbol de estructura para administrador
 * @access Privado (Solo Admin)
 */
router.get('/estructura/administrador', 
    verificarRol(['administrador']),
    estructuraControlador.obtenerArbolAdmin
);

/**
 * @route GET /api/v1/portafolios/estructura/docente
 * @desc Obtener árbol de estructura para docente
 * @access Privado (Solo Docente)
 */
router.get('/estructura/docente', 
    verificarRol(['docente']),
    estructuraControlador.obtenerArbolDocente
);

/**
 * @route GET /api/v1/portafolios/estructura/verificador
 * @desc Obtener árbol de estructura para verificador
 * @access Privado (Solo Verificador)
 */
router.get('/estructura/verificador', 
    verificarRol(['verificador']),
    estructuraControlador.obtenerArbolVerificador
);

/**
 * @route POST /api/v1/portafolios/estructura/personalizar
 * @desc Personalizar estructura de portafolio
 * @access Privado (Admin, Docente propio)
 */
router.post('/estructura/personalizar', 
    verificarPermisos(['portafolios.editar']),
    validarEsquema(esquemaPersonalizarEstructura),
    estructuraControlador.personalizarEstructura
);

/**
 * @route GET /api/v1/portafolios/estructura/base
 * @desc Obtener estructura base del sistema
 * @access Privado (Admin)
 */
router.get('/estructura/base', 
    verificarRol(['administrador']),
    estructuraControlador.obtenerEstructuraBase
);

/**
 * @route GET /api/v1/portafolios/estructura/estadisticas
 * @desc Obtener estadísticas de estructura
 * @access Privado (Admin)
 */
router.get('/estructura/estadisticas', 
    verificarRol(['administrador']),
    estructuraControlador.obtenerEstadisticasEstructura
);

/**
 * @route POST /api/v1/portafolios/estructura/clonar
 * @desc Clonar estructura entre ciclos
 * @access Privado (Solo Admin)
 */
router.post('/estructura/clonar', 
    verificarRol(['administrador']),
    estructuraControlador.clonarEstructura
);

// ===================================================
// 🧭 RUTAS DE NAVEGACIÓN DE PORTAFOLIOS
// ===================================================

/**
 * @route GET /api/v1/portafolios
 * @desc Listar mis portafolios
 * @access Privado
 */
router.get('/', 
    navegacionControlador.listarMisPortafolios
);

/**
 * @route GET /api/v1/portafolios/:id/arbol
 * @desc Obtener árbol de navegación de un portafolio
 * @access Privado (Con permisos de acceso)
 */
router.get('/:id/arbol', 
    navegacionControlador.obtenerArbolNavegacion
);

/**
 * @route GET /api/v1/portafolios/buscar
 * @desc Buscar contenido en portafolios
 * @access Privado
 */
router.get('/buscar', 
    validarEsquema(esquemaBusquedaPortafolios),
    navegacionControlador.buscarContenido
);

/**
 * @route GET /api/v1/portafolios/carpeta/:carpetaId
 * @desc Obtener contenido de una carpeta específica
 * @access Privado (Con permisos de acceso)
 */
router.get('/carpeta/:carpetaId', 
    navegacionControlador.obtenerContenidoCarpeta
);

/**
 * @route POST /api/v1/portafolios/favoritos
 * @desc Gestionar favoritos de portafolios
 * @access Privado
 */
router.post('/favoritos', 
    navegacionControlador.gestionarFavoritos
);

/**
 * @route GET /api/v1/portafolios/accesos-rapidos
 * @desc Obtener accesos rápidos personalizados
 * @access Privado
 */
router.get('/accesos-rapidos', 
    navegacionControlador.obtenerAccesosRapidos
);

/**
 * @route PUT /api/v1/portafolios/configurar-vista
 * @desc Configurar vista personalizada
 * @access Privado
 */
router.put('/configurar-vista', 
    navegacionControlador.configurarVistaPersonalizada
);

/**
 * @route GET /api/v1/portafolios/estadisticas/navegacion
 * @desc Obtener estadísticas de navegación
 * @access Privado
 */
router.get('/estadisticas/navegacion', 
    navegacionControlador.obtenerEstadisticasNavegacion
);

/**
 * @route PUT /api/v1/portafolios/reordenar
 * @desc Actualizar orden de elementos
 * @access Privado (Con permisos de edición)
 */
router.put('/reordenar', 
    verificarPermisos(['portafolios.editar']),
    navegacionControlador.actualizarOrdenElementos
);

// ===================================================
// 📈 RUTAS DE PROGRESO DE PORTAFOLIOS
// ===================================================

/**
 * @route GET /api/v1/portafolios/:id/progreso
 * @desc Obtener progreso específico de un portafolio
 * @access Privado (Con permisos de acceso)
 */
router.get('/:id/progreso', 
    progresoControlador.obtenerProgresoEspecifico
);

/**
 * @route GET /api/v1/portafolios/progreso/resumen
 * @desc Obtener resumen general de progreso
 * @access Privado
 */
router.get('/progreso/resumen', 
    progresoControlador.obtenerResumenGeneral
);

/**
 * @route GET /api/v1/portafolios/progreso/comparativa
 * @desc Obtener comparativa de progreso
 * @access Privado (Con permisos según tipo)
 */
router.get('/progreso/comparativa', 
    progresoControlador.obtenerComparativaProgreso
);

/**
 * @route GET /api/v1/portafolios/progreso/temporal
 * @desc Obtener progreso temporal (tendencias)
 * @access Privado
 */
router.get('/progreso/temporal', 
    progresoControlador.obtenerProgresoTemporal
);

/**
 * @route POST /api/v1/portafolios/progreso/metas
 * @desc Configurar metas de progreso
 * @access Privado (Con permisos de edición)
 */
router.post('/progreso/metas', 
    verificarPermisos(['portafolios.editar']),
    progresoControlador.configurarMetas
);

/**
 * @route GET /api/v1/portafolios/progreso/reporte
 * @desc Generar reporte de progreso
 * @access Privado
 */
router.get('/progreso/reporte', 
    progresoControlador.generarReporteProgreso
);

/**
 * @route GET /api/v1/portafolios/progreso/alertas
 * @desc Obtener alertas de progreso
 * @access Privado
 */
router.get('/progreso/alertas', 
    progresoControlador.obtenerAlertasProgreso
);

/**
 * @route PUT /api/v1/portafolios/:id/progreso/actualizar
 * @desc Actualizar progreso manual
 * @access Privado (Con permisos de edición)
 */
router.put('/:id/progreso/actualizar', 
    verificarPermisos(['portafolios.editar']),
    progresoControlador.actualizarProgresoManual
);

// ===================================================
// 📊 RUTAS DE ANÁLISIS Y REPORTES
// ===================================================

/**
 * @route GET /api/v1/portafolios/analisis/general
 * @desc Obtener análisis general de portafolios
 * @access Privado (Admin, Verificador)
 */
router.get('/analisis/general', 
    verificarPermisos(['reportes.ver']),
    progresoControlador.obtenerAnalisisGeneral
);

/**
 * @route GET /api/v1/portafolios/exportar/datos
 * @desc Exportar datos de portafolios
 * @access Privado (Admin)
 */
router.get('/exportar/datos', 
    verificarRol(['administrador']),
    navegacionControlador.exportarDatosPortafolios
);

/**
 * @route GET /api/v1/portafolios/metricas/sistema
 * @desc Obtener métricas del sistema de portafolios
 * @access Privado (Admin)
 */
router.get('/metricas/sistema', 
    verificarRol(['administrador']),
    estructuraControlador.obtenerMetricasSistema
);

// ===================================================
// 🔧 RUTAS DE CONFIGURACIÓN Y MANTENIMIENTO
// ===================================================

/**
 * @route POST /api/v1/portafolios/mantenimiento/optimizar
 * @desc Optimizar estructuras de portafolios
 * @access Privado (Solo Admin)
 */
router.post('/mantenimiento/optimizar', 
    verificarRol(['administrador']),
    estructuraControlador.optimizarEstructuras
);

/**
 * @route POST /api/v1/portafolios/mantenimiento/recalcular-progreso
 * @desc Recalcular progreso de todos los portafolios
 * @access Privado (Solo Admin)
 */
router.post('/mantenimiento/recalcular-progreso', 
    verificarRol(['administrador']),
    progresoControlador.recalcularProgresoMasivo
);

/**
 * @route GET /api/v1/portafolios/configuracion/sistema
 * @desc Obtener configuración del sistema de portafolios
 * @access Privado (Admin)
 */
router.get('/configuracion/sistema', 
    verificarRol(['administrador']),
    estructuraControlador.obtenerConfiguracionSistema
);

/**
 * @route PUT /api/v1/portafolios/configuracion/sistema
 * @desc Actualizar configuración del sistema de portafolios
 * @access Privado (Solo Admin)
 */
router.put('/configuracion/sistema', 
    verificarRol(['administrador']),
    estructuraControlador.actualizarConfiguracionSistema
);

module.exports = router;