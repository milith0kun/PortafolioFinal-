/**
 * 📚 RUTAS DE GESTIÓN DE ASIGNATURAS
 * 
 * CRUD de materias y cursos:
 * 
 * GET /api/v1/asignaturas
 * - Listar asignaturas activas
 * - Filtros por programa, nivel, código
 * - Incluir estadísticas de asignación
 * 
 * POST /api/v1/asignaturas
 * - Crear nueva asignatura
 * - Validar código único
 * - Configurar estructura de portafolio
 * 
 * GET /api/v1/asignaturas/:id
 * - Obtener detalles de asignatura
 * - Incluir docentes asignados
 * - Estadísticas y métricas
 * 
 * PUT /api/v1/asignaturas/:id
 * - Actualizar información de asignatura
 * - Validar cambios en prerrequisitos
 * 
 * DELETE /api/v1/asignaturas/:id
 * - Desactivar asignatura
 * - Validar asignaciones activas
 * 
 * POST /api/v1/asignaturas/importar-excel
 * - Importar asignaturas desde Excel
 * - Validar formato y datos
 * - Procesamiento en lotes
 */

// TODO: Códigos únicos por asignatura
// TODO: Gestión de prerrequisitos complejos
// TODO: Organización por programa académico
// TODO: Importación masiva desde Excel
// TODO: Configuración de portafolio por materia
/**
 * 📚 RUTAS ASIGNATURAS - Sistema Portafolio Docente UNSAAC
 * CRUD de asignaturas
 */

/**
 * 📚 RUTAS ASIGNATURAS - Sistema Portafolio Docente UNSAAC
 * CRUD de asignaturas
 */

const express = require('express');
const router = express.Router();

const asignaturasController = require('../../../controladores/asignaturas/gestion.controlador');
const { verificarToken, verificarRol } = require('../../../middleware/autenticacion/jwt.middleware');

// ============================================
// RUTAS PÚBLICAS (con autenticación básica)
// ============================================

/**
 * GET /api/v1/academico/asignaturas
 * Listar asignaturas con filtros y paginación
 */
router.get('/', 
    verificarToken, 
    asignaturasController.listar
);

/**
 * GET /api/v1/academico/asignaturas/:id
 * Obtener asignatura por ID
 */
router.get('/:id', 
    verificarToken, 
    asignaturasController.obtenerPorId
);

/**
 * GET /api/v1/academico/asignaturas/carrera/:carrera
 * Obtener asignaturas por carrera
 */
router.get('/carrera/:carrera', 
    verificarToken, 
    asignaturasController.obtenerPorCarrera
);

/**
 * GET /api/v1/academico/asignaturas/estadisticas/generales
 * Obtener estadísticas de asignaturas
 */
router.get('/estadisticas/generales', 
    verificarToken, 
    verificarRol(['administrador']), 
    asignaturasController.obtenerEstadisticas
);

// ============================================
// RUTAS PROTEGIDAS - Solo administradores
// ============================================

/**
 * POST /api/v1/academico/asignaturas
 * Crear nueva asignatura
 */
router.post('/', 
    verificarToken, 
    verificarRol(['administrador']), 
    asignaturasController.crear
);

/**
 * PUT /api/v1/academico/asignaturas/:id
 * Actualizar asignatura
 */
router.put('/:id', 
    verificarToken, 
    verificarRol(['administrador']), 
    asignaturasController.actualizar
);

/**
 * DELETE /api/v1/academico/asignaturas/:id
 * Eliminar asignatura (soft delete)
 */
router.delete('/:id', 
    verificarToken, 
    verificarRol(['administrador']), 
    asignaturasController.eliminar
);

module.exports = router;