/**
 * 👥 RUTAS DE GESTIÓN DE USUARIOS
 * 
 * CRUD completo de usuarios del sistema:
 * 
 * GET /api/v1/usuarios
 * - Listar usuarios con paginación
 * - Filtros por rol, estado, programa
 * - Ordenamiento configurable
 * 
 * POST /api/v1/usuarios
 * - Crear nuevo usuario (solo admin)
 * - Validar datos requeridos
 * - Asignar rol inicial
 * 
 * GET /api/v1/usuarios/:id
 * - Obtener detalles de usuario específico
 * - Incluir roles y estadísticas
 * 
 * PUT /api/v1/usuarios/:id
 * - Actualizar información de usuario
 * - Validar permisos de modificación
 * 
 * DELETE /api/v1/usuarios/:id
 * - Desactivar usuario (soft delete)
 * - Validar dependencias antes de eliminar
 */

// TODO: Paginación con limit/offset y total count
// TODO: Filtros múltiples combinables
// TODO: Validación de permisos por acción
// TODO: Encriptación automática de passwords
// TODO: Logs de auditoría para cambios críticos
/**
 * 👥 RUTAS GESTIÓN USUARIOS - Sistema Portafolio Docente UNSAAC
 * CRUD completo de usuarios
 */

const express = require('express');
const router = express.Router();

const usuariosController = require('../../../controladores/usuarios/gestion.controlador');
const { verificarToken, verificarRol } = require('../../../middleware/autenticacion/jwt.middleware');

// ============================================
// RUTAS PROTEGIDAS - Solo administradores
// ============================================

/**
 * GET /api/v1/usuarios
 * Listar usuarios con filtros y paginación
 */
router.get('/', 
    verificarToken, 
    verificarRol(['administrador']), 
    usuariosController.listar
);

/**
 * GET /api/v1/usuarios/:id
 * Obtener usuario por ID
 */
router.get('/:id', 
    verificarToken, 
    verificarRol(['administrador']), 
    usuariosController.obtenerPorId
);

/**
 * POST /api/v1/usuarios
 * Crear nuevo usuario
 */
router.post('/', 
    verificarToken, 
    verificarRol(['administrador']), 
    usuariosController.crear
);

/**
 * PUT /api/v1/usuarios/:id
 * Actualizar usuario
 */
router.put('/:id', 
    verificarToken, 
    verificarRol(['administrador']), 
    usuariosController.actualizar
);

/**
 * DELETE /api/v1/usuarios/:id
 * Eliminar usuario (soft delete)
 */
router.delete('/:id', 
    verificarToken, 
    verificarRol(['administrador']), 
    usuariosController.eliminar
);

/**
 * PUT /api/v1/usuarios/:id/estado
 * Cambiar estado del usuario (activar/desactivar)
 */
router.put('/:id/estado', 
    verificarToken, 
    verificarRol(['administrador']), 
    usuariosController.cambiarEstado
);

/**
 * GET /api/v1/usuarios/estadisticas/generales
 * Obtener estadísticas de usuarios
 */
router.get('/estadisticas/generales', 
    verificarToken, 
    verificarRol(['administrador']), 
    usuariosController.obtenerEstadisticas
);

module.exports = router;