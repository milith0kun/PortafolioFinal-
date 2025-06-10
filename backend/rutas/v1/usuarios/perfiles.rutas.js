/**
 * 🏷️ RUTAS DE PERFILES PERSONALES
 * 
 * Gestión del perfil personal del usuario:
 * 
 * GET /api/v1/usuarios/mi-perfil
 * - Obtener mi información personal
 * - Configuraciones y preferencias
 * - Estadísticas personales
 * 
 * PUT /api/v1/usuarios/mi-perfil
 * - Actualizar mi información personal
 * - Cambiar configuraciones
 * - Subir foto de perfil
 * 
 * PUT /api/v1/usuarios/cambiar-password
 * - Cambiar mi contraseña
 * - Validar contraseña actual
 * - Aplicar políticas de seguridad
 * 
 * POST /api/v1/usuarios/foto-perfil
 * - Subir nueva foto de perfil
 * - Redimensionar automáticamente
 * - Eliminar foto anterior
 */

// TODO: Validación de contraseña actual antes de cambios
// TODO: Políticas de contraseña configurables
// TODO: Procesamiento de imágenes de perfil
// TODO: Notificación de cambios importantes
// TODO: Historial de cambios en perfil
/**
 * 👤 RUTAS PERFILES USUARIOS - Sistema Portafolio Docente UNSAAC
 * Gestión de perfiles personales
 */

const express = require('express');
const router = express.Router();

const perfilesController = require('../../../controladores/usuarios/perfiles.controlador');
const { verificarToken } = require('../../../middleware/autenticacion/jwt.middleware');

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

/**
 * GET /api/v1/usuarios/mi-perfil
 * Obtener mi perfil completo
 */
router.get('/mi-perfil', 
    verificarToken, 
    perfilesController.obtenerMiPerfil
);

/**
 * PUT /api/v1/usuarios/mi-perfil
 * Actualizar mi perfil
 */
router.put('/mi-perfil', 
    verificarToken, 
    perfilesController.actualizarMiPerfil
);

/**
 * GET /api/v1/usuarios/mi-perfil/actividad
 * Obtener resumen de actividad
 */
router.get('/mi-perfil/actividad', 
    verificarToken, 
    perfilesController.obtenerResumenActividad
);

/**
 * GET /api/v1/usuarios/mi-perfil/notificaciones-config
 * Obtener configuración de notificaciones
 */
router.get('/mi-perfil/notificaciones-config', 
    verificarToken, 
    perfilesController.obtenerConfiguracionNotificaciones
);

/**
 * PUT /api/v1/usuarios/mi-perfil/notificaciones-config
 * Actualizar configuración de notificaciones
 */
router.put('/mi-perfil/notificaciones-config', 
    verificarToken, 
    perfilesController.actualizarConfiguracionNotificaciones
);

module.exports = router;