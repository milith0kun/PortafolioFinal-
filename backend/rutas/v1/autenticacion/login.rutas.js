/**
 * 🔐 RUTAS DE LOGIN Y AUTENTICACIÓN
 * 
 * Define endpoints para autenticación de usuarios:
 * 
 * POST /api/v1/auth/login
 * - Autenticar usuario con email/password
 * - Generar token JWT
 * - Registrar sesión activa
 * 
 * POST /api/v1/auth/logout
 * - Cerrar sesión actual
 * - Invalidar token
 * - Limpiar datos de sesión
 * 
 * POST /api/v1/auth/refresh
 * - Renovar token expirado
 * - Validar refresh token
 * - Generar nuevo par de tokens
 */

// TODO: Definir rutas con express.Router()
// TODO: Aplicar middlewares de validación
// TODO: Conectar con controladores correspondientes
// TODO: Configurar rate limiting específico
// TODO: Documentar endpoints con JSDoc
/**
 * 🔐 RUTAS LOGIN - Sistema Portafolio Docente UNSAAC
 * Rutas para autenticación básica
 */

const express = require('express');
const router = express.Router();

const loginController = require('../../../controladores/autenticacion/login.controlador');
const { verificarToken } = require('../../../middleware/autenticacion/jwt.middleware');

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================

/**
 * POST /api/v1/auth/login
 * Iniciar sesión
 */
router.post('/login', loginController.login);

/**
 * POST /api/v1/auth/logout
 * Cerrar sesión
 */
router.post('/logout', loginController.logout);

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

/**
 * GET /api/v1/auth/verificar
 * Verificar validez del token
 */
router.get('/verificar', verificarToken, loginController.verificarToken);

module.exports = router;