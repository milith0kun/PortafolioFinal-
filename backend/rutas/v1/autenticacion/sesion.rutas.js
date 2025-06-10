/**
 * 👤 RUTAS DE GESTIÓN DE SESIÓN
 * 
 * Maneja información de sesión del usuario actual:
 * 
 * GET /api/v1/auth/me
 * - Obtener información del usuario autenticado
 * - Incluir roles y permisos actuales
 * - Estado de la sesión
 * 
 * PUT /api/v1/auth/change-role
 * - Cambiar rol activo (si tiene múltiples)
 * - Regenerar token con nuevo rol
 * - Actualizar permisos
 * 
 * GET /api/v1/auth/permissions
 * - Obtener permisos del rol activo
 * - Lista de recursos accesibles
 * - Matriz de permisos actual
 */

// TODO: Middleware de autenticación JWT requerido
// TODO: Serialización consistente de datos de usuario
// TODO: Cache de permisos para performance
// TODO: Logs de cambios de rol
// TODO: Validación de disponibilidad de rol
/**
 * 👤 RUTAS SESIÓN - Sistema Portafolio Docente UNSAAC
 * Rutas para gestión de sesión actual
 */

const express = require('express');
const router = express.Router();

const sesionController = require('../../../controladores/autenticacion/sesion.controlador');
const { verificarToken } = require('../../../middleware/autenticacion/jwt.middleware');

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

/**
 * GET /api/v1/auth/perfil
 * Obtener perfil del usuario actual
 */
router.get('/perfil', verificarToken, sesionController.obtenerPerfil);

/**
 * PUT /api/v1/auth/perfil
 * Actualizar perfil del usuario actual
 */
router.put('/perfil', verificarToken, sesionController.actualizarPerfil);

/**
 * GET /api/v1/auth/estadisticas
 * Obtener estadísticas de sesión
 */
router.get('/estadisticas', verificarToken, sesionController.obtenerEstadisticasSesion);

/**
 * POST /api/v1/auth/cambiar-rol
 * Cambiar rol activo (para usuarios multi-rol)
 */
router.post('/cambiar-rol', verificarToken, sesionController.cambiarRolActivo);

/**
 * GET /api/v1/auth/historial-accesos
 * Obtener historial de accesos
 */
router.get('/historial-accesos', verificarToken, sesionController.obtenerHistorialAccesos);

module.exports = router;