/**
 * 📅 RUTAS DE GESTIÓN DE CICLOS ACADÉMICOS
 * 
 * CRUD de períodos académicos:
 * 
 * GET /api/v1/ciclos
 * - Listar ciclos académicos
 * - Filtrar por estado y fechas
 * - Incluir estadísticas básicas
 * 
 * POST /api/v1/ciclos
 * - Crear nuevo ciclo académico
 * - Validar fechas coherentes
 * - Configurar estructura inicial
 * 
 * GET /api/v1/ciclos/:id
 * - Obtener detalles de ciclo específico
 * - Incluir configuraciones y métricas
 * 
 * PUT /api/v1/ciclos/:id
 * - Actualizar información del ciclo
 * - Validar cambios de estado
 * 
 * DELETE /api/v1/ciclos/:id
 * - Eliminar ciclo (solo si sin datos)
 * - Validar dependencias
 * 
 * PUT /api/v1/ciclos/:id/activar
 * - Activar ciclo académico
 * - Desactivar ciclo anterior
 * - Migrar datos necesarios
 */

// TODO: Solo un ciclo activo simultáneamente
// TODO: Validación de fechas de inicio/fin
// TODO: Estados con transiciones válidas
// TODO: Migración automática entre ciclos
// TODO: Configuración heredable de ciclos anteriores
/**
 * 🔄 RUTAS CICLOS ACADÉMICOS - Sistema Portafolio Docente UNSAAC
 * CRUD de ciclos académicos
 */

const express = require('express');
const router = express.Router();

const ciclosController = require('../../../controladores/ciclos-academicos/gestion.controlador');
const { verificarToken, verificarRol } = require('../../../middleware/autenticacion/jwt.middleware');

// ============================================
// RUTAS PÚBLICAS (con autenticación básica)
// ============================================

/**
 * GET /api/v1/academico/ciclos
 * Listar ciclos académicos
 */
router.get('/', 
    verificarToken, 
    ciclosController.listar
);

/**
 * GET /api/v1/academico/ciclos/activo
 * Obtener ciclo académico activo
 */
router.get('/activo', 
    verificarToken, 
    ciclosController.obtenerActivo
);

/**
 * GET /api/v1/academico/ciclos/estadisticas
 * Obtener estadísticas de ciclos
 */
router.get('/estadisticas', 
    verificarToken, 
    verificarRol(['administrador']), 
    ciclosController.obtenerEstadisticas
);

/**
 * GET /api/v1/academico/ciclos/:id
 * Obtener ciclo por ID
 */
router.get('/:id', 
    verificarToken, 
    ciclosController.obtenerPorId
);

// ============================================
// RUTAS PROTEGIDAS - Solo administradores
// ============================================

/**
 * POST /api/v1/academico/ciclos
 * Crear nuevo ciclo académico
 */
router.post('/', 
    verificarToken, 
    verificarRol(['administrador']), 
    ciclosController.crear
);

/**
 * PUT /api/v1/academico/ciclos/:id
 * Actualizar ciclo académico
 */
router.put('/:id', 
    verificarToken, 
    verificarRol(['administrador']), 
    ciclosController.actualizar
);

/**
 * DELETE /api/v1/academico/ciclos/:id
 * Eliminar ciclo académico
 */
router.delete('/:id', 
    verificarToken, 
    verificarRol(['administrador']), 
    ciclosController.eliminar
);

/**
 * POST /api/v1/academico/ciclos/:id/duplicar
 * Duplicar ciclo académico
 */
router.post('/:id/duplicar', 
    verificarToken, 
    verificarRol(['administrador']), 
    ciclosController.duplicar
);

module.exports = router;