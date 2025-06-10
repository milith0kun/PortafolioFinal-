/**
 * 👨‍🏫 RUTAS ASIGNACIONES - Sistema Portafolio Docente UNSAAC
 * Gestión de asignaciones docente ↔ asignatura
 */

const express = require('express');
const router = express.Router();

const asignacionesController = require('../../../controladores/asignaturas/asignaciones.controlador');
const { verificarToken, verificarRol } = require('../../../middleware/autenticacion/jwt.middleware');

// ============================================
// RUTAS PROTEGIDAS - Consultas (todos los roles)
// ============================================

/**
 * GET /api/v1/academico/asignaciones
 * Listar asignaciones con filtros
 */
router.get('/', 
    verificarToken, 
    asignacionesController.listarAsignaciones
);

/**
 * GET /api/v1/academico/asignaciones/docente/:docente_id
 * Obtener asignaturas de un docente
 */
router.get('/docente/:docente_id', 
    verificarToken, 
    asignacionesController.obtenerAsignaturasDocente
);

/**
 * GET /api/v1/academico/asignaciones/asignatura/:asignatura_id
 * Obtener docentes de una asignatura
 */
router.get('/asignatura/:asignatura_id', 
    verificarToken, 
    asignacionesController.obtenerDocentesAsignatura
);

/**
 * GET /api/v1/academico/asignaciones/estadisticas
 * Obtener estadísticas de asignaciones
 */
router.get('/estadisticas', 
    verificarToken, 
    verificarRol(['administrador']), 
    asignacionesController.obtenerEstadisticasAsignaciones
);

/**
 * GET /api/v1/academico/asignaciones/docentes-disponibles
 * Buscar docentes disponibles para asignar
 */
router.get('/docentes-disponibles', 
    verificarToken, 
    verificarRol(['administrador']), 
    asignacionesController.buscarDocentesDisponibles
);

// ============================================
// RUTAS PROTEGIDAS - Solo administradores
// ============================================

/**
 * POST /api/v1/academico/asignaciones/asignar
 * Asignar docente a asignatura
 */
router.post('/asignar', 
    verificarToken, 
    verificarRol(['administrador']), 
    asignacionesController.asignarDocente
);

/**
 * POST /api/v1/academico/asignaciones/revocar
 * Revocar asignación docente-asignatura
 */
router.post('/revocar', 
    verificarToken, 
    verificarRol(['administrador']), 
    asignacionesController.revocarAsignacion
);

/**
 * POST /api/v1/academico/asignaciones/asignacion-masiva
 * Asignación masiva de docentes
 */
router.post('/asignacion-masiva', 
    verificarToken, 
    verificarRol(['administrador']), 
    asignacionesController.asignacionMasiva
);

module.exports = router;