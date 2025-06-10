/**
 * 👤 RUTAS DE SESIÓN Y PERFIL
 * 
 * Rutas:
 * GET  /api/v1/auth/me               - Obtener perfil del usuario autenticado
 * PUT  /api/v1/auth/me               - Actualizar perfil del usuario autenticado
 * GET  /api/v1/auth/estadisticas     - Obtener estadísticas de sesión
 * PUT  /api/v1/auth/change-role      - Cambiar rol activo
 * GET  /api/v1/auth/historial        - Ver historial de accesos
 */

const express = require('express');
const router = express.Router();

const sesionController = require('../../../controladores/autenticacion/sesion.controlador');
const { verificarJWT } = require('../../../middleware/autenticacion/jwt.middleware');

// ✅ Obtener perfil del usuario autenticado
router.get('/me', verificarJWT, sesionController.obtenerPerfil);

// ✅ Actualizar perfil del usuario autenticado
router.put('/me', verificarJWT, sesionController.actualizarPerfil);

// ✅ Obtener estadísticas de la sesión actual
router.get('/estadisticas', verificarJWT, sesionController.obtenerEstadisticasSesion);

// ✅ Cambiar el rol activo del usuario (si tiene varios)
router.put('/change-role', verificarJWT, sesionController.cambiarRolActivo);

// ✅ Obtener historial de accesos (último acceso, etc.)
router.get('/historial', verificarJWT, sesionController.obtenerHistorialAccesos);

module.exports = router;
