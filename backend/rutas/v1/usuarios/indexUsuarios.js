// ============================================================
// 👥 RUTAS DE GESTIÓN DE USUARIOS
// Sistema Portafolio Docente UNSAAC
// ============================================================

const express = require('express');
const router = express.Router();

// Controladores
const gestionControlador = require('../../../controladores/usuarios/gestion.controlador');
const actividadControlador = require('../../../controladores/usuarios/actividad.controlador');
const perfilesControlador = require('../../../controladores/usuarios/perfiles.controlador');

// Middlewares
const { verificarRol, verificarPermisos } = require('../../../middleware/autorizacion/roles.middleware');
const { validarEsquema } = require('../../../middleware/validacion/esquemas.middleware');
const { subirAvatar } = require('../../../middleware/subida-archivos/multer.middleware');

// Esquemas de validación
const { esquemaCreacionUsuario, esquemaActualizacionUsuario } = require('../../../validadores/usuarios/creacion.validador');
const { esquemaActualizacionPerfil } = require('../../../validadores/usuarios/perfil.validador');

// ===================================================
// 👥 RUTAS DE GESTIÓN CRUD DE USUARIOS
// ===================================================

/**
 * @route GET /api/v1/usuarios
 * @desc Obtener lista de usuarios con filtros
 * @access Privado (Admin, Verificador)
 */
router.get('/', 
    verificarPermisos(['usuarios.ver']),
    gestionControlador.obtenerUsuarios
);

/**
 * @route GET /api/v1/usuarios/buscar
 * @desc Buscar usuarios por término
 * @access Privado (Admin, Verificador)
 */
router.get('/buscar', 
    verificarPermisos(['usuarios.ver']),
    gestionControlador.buscarUsuarios
);

/**
 * @route GET /api/v1/usuarios/:id
 * @desc Obtener usuario específico por ID
 * @access Privado (Admin, Verificador, Propio)
 */
router.get('/:id', 
    gestionControlador.obtenerUsuarioPorId
);

/**
 * @route POST /api/v1/usuarios
 * @desc Crear nuevo usuario
 * @access Privado (Solo Admin)
 */
router.post('/', 
    verificarRol(['administrador']),
    validarEsquema(esquemaCreacionUsuario),
    gestionControlador.crearUsuario
);

/**
 * @route PUT /api/v1/usuarios/:id
 * @desc Actualizar usuario
 * @access Privado (Admin, Propio limitado)
 */
router.put('/:id', 
    validarEsquema(esquemaActualizacionUsuario),
    gestionControlador.actualizarUsuario
);

/**
 * @route DELETE /api/v1/usuarios/:id
 * @desc Eliminar usuario (soft delete)
 * @access Privado (Solo Admin)
 */
router.delete('/:id', 
    verificarRol(['administrador']),
    gestionControlador.eliminarUsuario
);

/**
 * @route PATCH /api/v1/usuarios/:id/estado
 * @desc Cambiar estado de usuario (activar/desactivar)
 * @access Privado (Solo Admin)
 */
router.patch('/:id/estado', 
    verificarRol(['administrador']),
    gestionControlador.cambiarEstadoUsuario
);

// ===================================================
// 📊 RUTAS DE ACTIVIDAD DE USUARIOS
// ===================================================

/**
 * @route GET /api/v1/usuarios/:id/actividad
 * @desc Obtener historial de actividad de un usuario
 * @access Privado (Admin, Verificador, Propio)
 */
router.get('/:id/actividad', 
    actividadControlador.obtenerActividadUsuario
);

/**
 * @route GET /api/v1/usuarios/mi-actividad
 * @desc Obtener mi propia actividad
 * @access Privado
 */
router.get('/mi/actividad', 
    actividadControlador.obtenerMiActividad
);

/**
 * @route GET /api/v1/usuarios/:id/estadisticas
 * @desc Obtener estadísticas de un usuario
 * @access Privado (Admin, Verificador, Propio)
 */
router.get('/:id/estadisticas', 
    actividadControlador.obtenerEstadisticasUsuario
);

/**
 * @route GET /api/v1/usuarios/:id/sesiones
 * @desc Obtener sesiones activas de un usuario
 * @access Privado (Admin, Propio)
 */
router.get('/:id/sesiones', 
    actividadControlador.obtenerSesionesActivas
);

/**
 * @route DELETE /api/v1/usuarios/:id/sesiones/:sessionId
 * @desc Cerrar sesión remota de un usuario
 * @access Privado (Admin, Propio)
 */
router.delete('/:id/sesiones/:sessionId', 
    actividadControlador.cerrarSesionRemota
);

/**
 * @route GET /api/v1/usuarios/:id/resumen
 * @desc Obtener resumen de actividad reciente
 * @access Privado (Admin, Verificador, Propio)
 */
router.get('/:id/resumen', 
    actividadControlador.obtenerResumenActividad
);

/**
 * @route GET /api/v1/usuarios/:id/exportar
 * @desc Exportar actividad de usuario
 * @access Privado (Admin, Propio)
 */
router.get('/:id/exportar', 
    actividadControlador.exportarActividad
);

// ===================================================
// 👤 RUTAS DE GESTIÓN DE PERFILES
// ===================================================

/**
 * @route GET /api/v1/usuarios/mi-perfil
 * @desc Obtener mi perfil personal
 * @access Privado
 */
router.get('/mi/perfil', 
    perfilesControlador.obtenerMiPerfil
);

/**
 * @route PUT /api/v1/usuarios/mi-perfil
 * @desc Actualizar mi perfil personal
 * @access Privado
 */
router.put('/mi/perfil', 
    validarEsquema(esquemaActualizacionPerfil),
    perfilesControlador.actualizarMiPerfil
);

/**
 * @route POST /api/v1/usuarios/mi-perfil/avatar
 * @desc Subir/actualizar avatar
 * @access Privado
 */
router.post('/mi/perfil/avatar', 
    subirAvatar.single('avatar'),
    perfilesControlador.subirAvatar
);

/**
 * @route DELETE /api/v1/usuarios/mi-perfil/avatar
 * @desc Eliminar avatar
 * @access Privado
 */
router.delete('/mi/perfil/avatar', 
    perfilesControlador.eliminarAvatar
);

/**
 * @route GET /api/v1/usuarios/:id/perfil-publico
 * @desc Obtener perfil público de un usuario
 * @access Privado
 */
router.get('/:id/perfil-publico', 
    perfilesControlador.obtenerPerfilPublico
);

/**
 * @route PUT /api/v1/usuarios/mi-perfil/configuracion
 * @desc Actualizar configuraciones de perfil
 * @access Privado
 */
router.put('/mi/perfil/configuracion', 
    perfilesControlador.actualizarConfiguracion
);

/**
 * @route GET /api/v1/usuarios/mi-perfil/notificaciones
 * @desc Obtener configuración de notificaciones
 * @access Privado
 */
router.get('/mi/perfil/notificaciones', 
    perfilesControlador.obtenerConfiguracionNotificaciones
);

/**
 * @route PUT /api/v1/usuarios/mi-perfil/notificaciones
 * @desc Actualizar configuración de notificaciones
 * @access Privado
 */
router.put('/mi/perfil/notificaciones', 
    perfilesControlador.actualizarConfiguracionNotificaciones
);

/**
 * @route GET /api/v1/usuarios/mi-perfil/privacidad
 * @desc Obtener configuración de privacidad
 * @access Privado
 */
router.get('/mi/perfil/privacidad', 
    perfilesControlador.obtenerConfiguracionPrivacidad
);

/**
 * @route PUT /api/v1/usuarios/mi-perfil/privacidad
 * @desc Actualizar configuración de privacidad
 * @access Privado
 */
router.put('/mi/perfil/privacidad', 
    perfilesControlador.actualizarConfiguracionPrivacidad
);

// ===================================================
// 📋 RUTAS DE INFORMACIÓN ADICIONAL
// ===================================================

/**
 * @route GET /api/v1/usuarios/estadisticas/generales
 * @desc Obtener estadísticas generales de usuarios
 * @access Privado (Solo Admin)
 */
router.get('/estadisticas/generales', 
    verificarRol(['administrador']),
    gestionControlador.obtenerEstadisticasGenerales
);

/**
 * @route GET /api/v1/usuarios/exportar/lista
 * @desc Exportar lista de usuarios
 * @access Privado (Solo Admin)
 */
router.get('/exportar/lista', 
    verificarRol(['administrador']),
    gestionControlador.exportarListaUsuarios
);

module.exports = router;