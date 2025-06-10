/**
 * 🔑 RUTAS DE RECUPERACIÓN DE CONTRASEÑAS
 * 
 * Rutas disponibles:
 * POST /api/v1/auth/forgot-password      - Solicitar recuperación
 * GET  /api/v1/auth/verify-token/:token  - Verificar token de recuperación
 * POST /api/v1/auth/reset-password       - Restablecer contraseña
 * POST /api/v1/auth/change-password      - Cambiar contraseña (requiere login)
 */

const express = require('express');
const router = express.Router();

const recuperacionController = require('../../../controladores/autenticacion/recuperacion.controlador');
const { verificarJWT } = require('../../../middleware/autenticacion/jwt.middleware');

// ============================================
// RUTAS PÚBLICAS
// ============================================

/**
 * Solicitar recuperación de contraseña
 */
router.post('/forgot-password', recuperacionController.solicitarRecuperacion);

/**
 * Verificar token de recuperación
 */
router.get('/verify-token/:token', recuperacionController.verificarTokenRecuperacion);

/**
 * Restablecer contraseña usando token
 */
router.post('/reset-password', recuperacionController.restablecerContrasena);

// ============================================
// RUTAS PROTEGIDAS
// ============================================

/**
 * Cambiar contraseña actual (requiere login)
 */
router.post('/change-password', verificarJWT, recuperacionController.cambiarContrasena);

// ============================================
// EXPORTAR RUTAS
// ============================================

module.exports = router;
