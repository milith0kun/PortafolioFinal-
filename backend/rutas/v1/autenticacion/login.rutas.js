/**
 * 🔐 RUTAS DE LOGIN Y AUTENTICACIÓN
 * 
 * Rutas disponibles:
 * POST /api/v1/auth/login     - Autenticación de usuario
 * POST /api/v1/auth/logout    - Cerrar sesión
 * GET  /api/v1/auth/verificar - Verificar validez del token
 */

const express = require('express');
const router = express.Router();

// Importar controlador de autenticación
const loginController = require('../../../controladores/autenticacion/login.controlador');

// Importar middleware de verificación JWT
const { verificarJWT } = require('../../../middleware/autenticacion/jwt.middleware');

// ============================================
// RUTAS PÚBLICAS
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
// RUTAS PROTEGIDAS
// ============================================

/**
 * GET /api/v1/auth/verificar
 * Verificar validez del token
 */
router.get('/verificar', verificarJWT, loginController.verificarToken);

// ============================================
// EXPORTAR
// ============================================

module.exports = router;
