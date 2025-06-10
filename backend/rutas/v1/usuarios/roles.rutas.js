/**
 * 🎭 RUTAS DE GESTIÓN DE ROLES DE USUARIO
 * 
 * Asignación y gestión de roles:
 * 
 * POST /api/v1/usuarios/:id/asignar-rol
 * - Asignar rol específico a usuario
 * - Validar permisos de asignación
 * - Notificar al usuario
 * 
 * DELETE /api/v1/usuarios/:id/revocar-rol
 * - Revocar rol específico de usuario
 * - Validar dependencias
 * - Logs de auditoría
 * 
 * GET /api/v1/usuarios/:id/roles
 * - Obtener roles del usuario
 * - Incluir fechas de asignación
 * - Estado de cada rol
 * 
 * GET /api/v1/roles/:rol/usuarios
 * - Listar usuarios con rol específico
 * - Filtros y paginación
 * - Estadísticas del rol
 */

// TODO: Validación de jerarquía de roles
// TODO: Prevenir auto-asignación de admin
// TODO: Notificaciones automáticas de cambios
// TODO: Logs detallados para auditoría
// TODO: Validación de dependencias antes de revocar
/**
 * 🎭 RUTAS ROLES USUARIOS - Sistema Portafolio Docente UNSAAC
 * Gestión de roles de usuarios (delegada a controladores de roles)
 */

const express = require('express');
const router = express.Router();

const asignacionController = require('../../../controladores/roles/asignacion.controlador');
const cambioController = require('../../../controladores/roles/cambio.controlador');
const { verificarToken, verificarRol } = require('../../../middleware/autenticacion/jwt.middleware');

// ============================================
// RUTAS PROTEGIDAS - Solo administradores
// ============================================

/**
 * POST /api/v1/usuarios/asignar-rol
 * Asignar rol a usuario
 */
router.post('/asignar-rol', 
    verificarToken, 
    verificarRol(['administrador']), 
    asignacionController.asignarRol
);

/**
 * POST /api/v1/usuarios/revocar-rol
 * Revocar rol de usuario
 */
router.post('/revocar-rol', 
    verificarToken, 
    verificarRol(['administrador']), 
    asignacionController.revocarRol
);

/**
 * GET /api/v1/usuarios/asignaciones-roles
 * Listar asignaciones de roles
 */
router.get('/asignaciones-roles', 
    verificarToken, 
    verificarRol(['administrador']), 
    asignacionController.listarAsignaciones
);

/**
 * GET /api/v1/usuarios/por-rol/:rol
 * Obtener usuarios por rol específico
 */
router.get('/por-rol/:rol', 
    verificarToken, 
    verificarRol(['administrador']), 
    asignacionController.obtenerUsuariosPorRol
);

/**
 * POST /api/v1/usuarios/asignacion-masiva
 * Asignación masiva de roles
 */
router.post('/asignacion-masiva', 
    verificarToken, 
    verificarRol(['administrador']), 
    asignacionController.asignacionMasiva
);

/**
 * GET /api/v1/usuarios/estadisticas-roles
 * Obtener estadísticas de roles
 */
router.get('/estadisticas-roles', 
    verificarToken, 
    verificarRol(['administrador']), 
    asignacionController.obtenerEstadisticasRoles
);

// ============================================
// RUTAS PROTEGIDAS - Usuarios autenticados
// ============================================

/**
 * GET /api/v1/usuarios/mis-roles
 * Obtener mis roles disponibles
 */
router.get('/mis-roles', 
    verificarToken, 
    cambioController.obtenerRolesDisponibles
);

/**
 * POST /api/v1/usuarios/cambiar-rol
 * Cambiar rol activo
 */
router.post('/cambiar-rol', 
    verificarToken, 
    cambioController.cambiarRolActivo
);

/**
 * GET /api/v1/usuarios/contexto-rol
 * Obtener contexto del rol actual
 */
router.get('/contexto-rol', 
    verificarToken, 
    cambioController.obtenerContextoRol
);

/**
 * GET /api/v1/usuarios/verificar-permisos
 * Verificar permisos específicos
 */
router.get('/verificar-permisos', 
    verificarToken, 
    cambioController.verificarPermisos
);

module.exports = router;