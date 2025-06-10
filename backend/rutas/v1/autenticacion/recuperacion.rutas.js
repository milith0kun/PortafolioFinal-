/**
 * 🔑 RUTAS DE RECUPERACIÓN DE CONTRASEÑA
 * 
 * Gestiona el proceso de recuperación de contraseñas:
 * 
 * POST /api/v1/auth/forgot-password
 * - Solicitar recuperación por email
 * - Generar token de recuperación
 * - Enviar email con enlace
 * 
 * POST /api/v1/auth/reset-password
 * - Verificar token de recuperación
 * - Establecer nueva contraseña
 * - Invalidar token usado
 * 
 * GET /api/v1/auth/verify-reset-token/:token
 * - Verificar validez del token
 * - Retornar estado del token
 */

// TODO: Validación de email para recuperación
// TODO: Rate limiting estricto para prevenir abuso
// TODO: Tokens con expiración corta
// TODO: Logs de seguridad para recuperaciones
// TODO: Notificación de cambio exitoso
/**
 * 🔑 RUTAS RECUPERACIÓN - Sistema Portafolio Docente UNSAAC
 * Rutas para recuperación de contraseñas
 */

const express = require('express');
const router = express.Router();

const recuperacionController = require('../../../controladores/autenticacion/recuperacion.controlador');
const { verificarToken } = require('../../../middleware/autenticacion/jwt.middleware');

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================

/**
 * POST /api/v1/auth/solicitar-recuperacion
 * Solicitar recuperación de contraseña
 */
router.post('/solicitar-recuperacion', recuperacionController.solicitarRecuperacion);

/**
 * GET /api/v1/auth/verificar-token/:token
 * Verificar token de recuperación
 */
router.get('/verificar-token/:token', recuperacionController.verificarTokenRecuperacion);

/**
 * POST /api/v1/auth/restablecer-contrasena
 * Restablecer contraseña con token
 */
router.post('/restablecer-contrasena', recuperacionController.restablecerContrasena);

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

/**
 * POST /api/v1/auth/cambiar-contrasena
 * Cambiar contraseña (usuario autenticado)
 */
router.post('/cambiar-contrasena', verificarToken, recuperacionController.cambiarContrasena);

module.exports = router;