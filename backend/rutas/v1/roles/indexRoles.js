// ============================================================
// 🎭 RUTAS DE GESTIÓN DE ROLES
// Sistema Portafolio Docente UNSAAC
// ============================================================

const express = require('express');
const router = express.Router();

// Controladores
const asignacionControlador = require('../../../controladores/roles/asignacion.controlador');
const cambioControlador = require('../../../controladores/roles/cambio.controlador');
const permisosControlador = require('../../../controladores/roles/permisos.controlador');

// Middlewares
const { verificarRol, verificarPermisos } = require('../../../middleware/autorizacion/roles.middleware');
const { validarEsquema } = require('../../../middleware/validacion/esquemas.middleware');

// Esquemas de validación
const { esquemaAsignacionRol } = require('../../../validadores/roles/asignacion.validador');
const { esquemaAsignacionPermisos } = require('../../../validadores/usuarios/permisos.validador');

// ===================================================
// 🎯 RUTAS DE ASIGNACIÓN DE ROLES
// ===================================================

/**
 * @route GET /api/v1/roles/disponibles
 * @desc Obtener roles disponibles en el sistema
 * @access Privado (Admin)
 */
router.get('/disponibles', 
    verificarRol(['administrador']),
    asignacionControlador.obtenerRolesDisponibles
);

/**
 * @route GET /api/v1/roles/usuario/:userId
 * @desc Obtener roles de un usuario específico
 * @access Privado (Admin, Propio)
 */
router.get('/usuario/:userId', 
    asignacionControlador.obtenerRolesUsuario
);

/**
 * @route POST /api/v1/roles/asignar
 * @desc Asignar rol a un usuario
 * @access Privado (Solo Admin)
 */
router.post('/asignar', 
    verificarRol(['administrador']),
    validarEsquema(esquemaAsignacionRol),
    asignacionControlador.asignarRol
);

/**
 * @route DELETE /api/v1/roles/revocar
 * @desc Revocar rol de un usuario
 * @access Privado (Solo Admin)
 */
router.delete('/revocar', 
    verificarRol(['administrador']),
    asignacionControlador.revocarRol
);

/**
 * @route GET /api/v1/roles/asignaciones
 * @desc Obtener todas las asignaciones de roles
 * @access Privado (Solo Admin)
 */
router.get('/asignaciones', 
    verificarRol(['administrador']),
    asignacionControlador.obtenerAsignaciones
);

/**
 * @route POST /api/v1/roles/asignacion-masiva
 * @desc Asignar roles de forma masiva
 * @access Privado (Solo Admin)
 */
router.post('/asignacion-masiva', 
    verificarRol(['administrador']),
    asignacionControlador.asignacionMasiva
);

/**
 * @route GET /api/v1/roles/estadisticas
 * @desc Obtener estadísticas de roles
 * @access Privado (Solo Admin)
 */
router.get('/estadisticas', 
    verificarRol(['administrador']),
    asignacionControlador.obtenerEstadisticasRoles
);

// ===================================================
// 🔄 RUTAS DE CAMBIO DE ROL
// ===================================================

/**
 * @route GET /api/v1/roles/mis-roles
 * @desc Obtener mis roles disponibles
 * @access Privado
 */
router.get('/mis-roles', 
    cambioControlador.obtenerMisRoles
);

/**
 * @route POST /api/v1/roles/cambiar
 * @desc Cambiar rol activo (sistema multi-rol)
 * @access Privado
 */
router.post('/cambiar', 
    cambioControlador.cambiarRolActivo
);

/**
 * @route GET /api/v1/roles/rol-actual
 * @desc Obtener información del rol actual
 * @access Privado
 */
router.get('/rol-actual', 
    cambioControlador.obtenerRolActual
);

/**
 * @route GET /api/v1/roles/historial-cambios
 * @desc Obtener historial de cambios de rol
 * @access Privado
 */
router.get('/historial-cambios', 
    cambioControlador.obtenerHistorialCambios
);

/**
 * @route POST /api/v1/roles/solicitar-rol
 * @desc Solicitar asignación de un nuevo rol
 * @access Privado
 */
router.post('/solicitar-rol', 
    cambioControlador.solicitarNuevoRol
);

/**
 * @route GET /api/v1/roles/solicitudes
 * @desc Obtener solicitudes de roles pendientes
 * @access Privado (Admin)
 */
router.get('/solicitudes', 
    verificarRol(['administrador']),
    cambioControlador.obtenerSolicitudesPendientes
);

/**
 * @route PUT /api/v1/roles/solicitudes/:solicitudId
 * @desc Aprobar/rechazar solicitud de rol
 * @access Privado (Admin)
 */
router.put('/solicitudes/:solicitudId', 
    verificarRol(['administrador']),
    cambioControlador.procesarSolicitudRol
);

// ===================================================
// 🔐 RUTAS DE GESTIÓN DE PERMISOS
// ===================================================

/**
 * @route GET /api/v1/roles/permisos/disponibles
 * @desc Obtener todos los permisos disponibles
 * @access Privado (Admin)
 */
router.get('/permisos/disponibles', 
    verificarRol(['administrador']),
    permisosControlador.obtenerPermisosDisponibles
);

/**
 * @route GET /api/v1/roles/permisos/usuario/:userId
 * @desc Obtener permisos de un usuario específico
 * @access Privado (Admin, Verificador, Propio)
 */
router.get('/permisos/usuario/:userId', 
    permisosControlador.obtenerPermisosUsuario
);

/**
 * @route GET /api/v1/roles/permisos/rol/:rol
 * @desc Obtener permisos por rol
 * @access Privado (Admin)
 */
router.get('/permisos/rol/:rol', 
    verificarRol(['administrador']),
    permisosControlador.obtenerPermisosPorRol
);

/**
 * @route POST /api/v1/roles/permisos/asignar/:userId
 * @desc Asignar permisos a usuario
 * @access Privado (Solo Admin)
 */
router.post('/permisos/asignar/:userId', 
    verificarRol(['administrador']),
    validarEsquema(esquemaAsignacionPermisos),
    permisosControlador.asignarPermisosUsuario
);

/**
 * @route DELETE /api/v1/roles/permisos/revocar/:userId
 * @desc Revocar permisos de usuario
 * @access Privado (Solo Admin)
 */
router.delete('/permisos/revocar/:userId', 
    verificarRol(['administrador']),
    permisosControlador.revocarPermisosUsuario
);

/**
 * @route GET /api/v1/roles/permisos/verificar/:userId/:permiso
 * @desc Verificar permiso específico de usuario
 * @access Privado (Admin, Verificador, Propio)
 */
router.get('/permisos/verificar/:userId/:permiso', 
    permisosControlador.verificarPermiso
);

/**
 * @route GET /api/v1/roles/permisos/estadisticas
 * @desc Obtener estadísticas de permisos
 * @access Privado (Solo Admin)
 */
router.get('/permisos/estadisticas', 
    verificarRol(['administrador']),
    permisosControlador.obtenerEstadisticasPermisos
);

/**
 * @route GET /api/v1/roles/permisos/historial/:userId?
 * @desc Obtener historial de cambios de permisos
 * @access Privado (Admin, Propio)
 */
router.get('/permisos/historial/:userId?', 
    permisosControlador.obtenerHistorialPermisos
);

/**
 * @route POST /api/v1/roles/permisos/sincronizar
 * @desc Sincronizar permisos con roles
 * @access Privado (Solo Admin)
 */
router.post('/permisos/sincronizar', 
    verificarRol(['administrador']),
    permisosControlador.sincronizarPermisosRoles
);

// ===================================================
// 📊 RUTAS DE ANÁLISIS Y REPORTES
// ===================================================

/**
 * @route GET /api/v1/roles/analisis/distribucion
 * @desc Obtener análisis de distribución de roles
 * @access Privado (Solo Admin)
 */
router.get('/analisis/distribucion', 
    verificarRol(['administrador']),
    asignacionControlador.obtenerAnalisisDistribucion
);

/**
 * @route GET /api/v1/roles/reportes/asignaciones
 * @desc Generar reporte de asignaciones de roles
 * @access Privado (Solo Admin)
 */
router.get('/reportes/asignaciones', 
    verificarRol(['administrador']),
    asignacionControlador.generarReporteAsignaciones
);

/**
 * @route GET /api/v1/roles/exportar/configuracion
 * @desc Exportar configuración de roles y permisos
 * @access Privado (Solo Admin)
 */
router.get('/exportar/configuracion', 
    verificarRol(['administrador']),
    permisosControlador.exportarConfiguracion
);

/**
 * @route POST /api/v1/roles/importar/configuracion
 * @desc Importar configuración de roles y permisos
 * @access Privado (Solo Admin)
 */
router.post('/importar/configuracion', 
    verificarRol(['administrador']),
    permisosControlador.importarConfiguracion
);

module.exports = router;