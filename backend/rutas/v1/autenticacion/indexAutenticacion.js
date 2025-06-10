// ============================================================
// 🔐 RUTAS DE AUTENTICACIÓN
// Sistema Portafolio Docente UNSAAC
// ============================================================

const express = require('express');
const router = express.Router();

// Controladores
const loginControlador = require('../../../controladores/autenticacion/login.controlador');
const recuperacionControlador = require('../../../controladores/autenticacion/recuperacion.controlador');
const sesionControlador = require('../../../controladores/autenticacion/sesion.controlador');

// Middlewares
const { verificarToken } = require('../../../middleware/autenticacion/jwt.middleware');
const { validarEsquema } = require('../../../middleware/validacion/esquemas.middleware');
const { limitarVelocidad } = require('../../../middleware/seguridad/limitador.middleware');

// Esquemas de validación
const { esquemaLogin, esquemaRecuperacion, esquemaCambioPassword } = require('../../../validadores/autenticacion/login.validador');

// ===================================================
// 🔑 RUTAS DE LOGIN Y LOGOUT
// ===================================================

/**
 * @route POST /api/v1/auth/login
 * @desc Iniciar sesión
 * @access Público
 */
router.post('/login', 
    limitarVelocidad({ max: 5, windowMs: 15 * 60 * 1000 }), // 5 intentos por 15 minutos
    validarEsquema(esquemaLogin),
    loginControlador.iniciarSesion
);

/**
 * @route POST /api/v1/auth/logout
 * @desc Cerrar sesión
 * @access Privado
 */
router.post('/logout', 
    verificarToken,
    loginControlador.cerrarSesion
);

/**
 * @route POST /api/v1/auth/refresh
 * @desc Renovar token de acceso
 * @access Privado (con refresh token)
 */
router.post('/refresh', 
    loginControlador.renovarToken
);

/**
 * @route POST /api/v1/auth/logout-all
 * @desc Cerrar todas las sesiones activas
 * @access Privado
 */
router.post('/logout-all', 
    verificarToken,
    loginControlador.cerrarTodasLasSesiones
);

// ===================================================
// 🔄 RUTAS DE RECUPERACIÓN DE CONTRASEÑA
// ===================================================

/**
 * @route POST /api/v1/auth/forgot-password
 * @desc Solicitar recuperación de contraseña
 * @access Público
 */
router.post('/forgot-password', 
    limitarVelocidad({ max: 3, windowMs: 60 * 60 * 1000 }), // 3 intentos por hora
    validarEsquema(esquemaRecuperacion),
    recuperacionControlador.solicitarRecuperacion
);

/**
 * @route POST /api/v1/auth/reset-password
 * @desc Restablecer contraseña con token
 * @access Público
 */
router.post('/reset-password', 
    limitarVelocidad({ max: 5, windowMs: 60 * 60 * 1000 }),
    recuperacionControlador.restablecerPassword
);

/**
 * @route GET /api/v1/auth/verify-reset-token/:token
 * @desc Verificar validez del token de recuperación
 * @access Público
 */
router.get('/verify-reset-token/:token', 
    recuperacionControlador.verificarTokenRecuperacion
);

/**
 * @route POST /api/v1/auth/change-password
 * @desc Cambiar contraseña (usuario autenticado)
 * @access Privado
 */
router.post('/change-password', 
    verificarToken,
    validarEsquema(esquemaCambioPassword),
    recuperacionControlador.cambiarPassword
);

// ===================================================
// 👤 RUTAS DE GESTIÓN DE SESIÓN
// ===================================================

/**
 * @route GET /api/v1/auth/me
 * @desc Obtener información del usuario actual
 * @access Privado
 */
router.get('/me', 
    verificarToken,
    sesionControlador.obtenerUsuarioActual
);

/**
 * @route GET /api/v1/auth/sessions
 * @desc Obtener sesiones activas del usuario
 * @access Privado
 */
router.get('/sessions', 
    verificarToken,
    sesionControlador.obtenerSesionesActivas
);

/**
 * @route DELETE /api/v1/auth/sessions/:sessionId
 * @desc Cerrar una sesión específica
 * @access Privado
 */
router.delete('/sessions/:sessionId', 
    verificarToken,
    sesionControlador.cerrarSesionEspecifica
);

/**
 * @route POST /api/v1/auth/verify-password
 * @desc Verificar contraseña actual (para operaciones sensibles)
 * @access Privado
 */
router.post('/verify-password', 
    verificarToken,
    sesionControlador.verificarPasswordActual
);

/**
 * @route GET /api/v1/auth/permissions
 * @desc Obtener permisos del usuario actual
 * @access Privado
 */
router.get('/permissions', 
    verificarToken,
    sesionControlador.obtenerPermisosActuales
);

/**
 * @route POST /api/v1/auth/switch-role
 * @desc Cambiar rol activo (sistema multi-rol)
 * @access Privado
 */
router.post('/switch-role', 
    verificarToken,
    sesionControlador.cambiarRolActivo
);

// ===================================================
// 🔒 RUTAS DE SEGURIDAD
// ===================================================

/**
 * @route GET /api/v1/auth/security-events
 * @desc Obtener eventos de seguridad del usuario
 * @access Privado
 */
router.get('/security-events', 
    verificarToken,
    sesionControlador.obtenerEventosSeguridad
);

/**
 * @route POST /api/v1/auth/report-suspicious
 * @desc Reportar actividad sospechosa
 * @access Privado
 */
router.post('/report-suspicious', 
    verificarToken,
    sesionControlador.reportarActividadSospechosa
);

module.exports = router;