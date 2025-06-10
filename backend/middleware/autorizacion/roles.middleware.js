/**
 * 🎭 MIDDLEWARE DE VERIFICACIÓN DE ROLES
 * 
 * Verifica que el usuario tenga el rol requerido:
 * - Verificar rol específico requerido
 * - Manejar múltiples roles del usuario
 * - Jerarquía de roles (admin > verificador > docente)
 * - Roles contextuales por recurso
 * - Cache de verificación de roles
 * 
 * Uso: Proteger rutas por rol específico
 */

// TODO: Verificar rol específico del usuario
// TODO: Manejar jerarquía de roles
// TODO: Verificar múltiples roles permitidos
// TODO: Cache de verificación para performance
// TODO: Logs de acceso por rol
/**
 * 🎭 MIDDLEWARE DE ROLES - Sistema Portafolio Docente UNSAAC
 * 
 * Middleware para verificar roles y permisos de usuarios:
 * - Validación de roles requeridos
 * - Verificación de permisos específicos
 * - Control de acceso por jerarquía
 * - Logging de intentos de acceso
 * 
 * @author Sistema Portafolio Docente UNSAAC
 * @version 1.0.0
 */

const { ejecutarLectura } = require('../../base_datos/conexiones/pool.conexion');

/**
 * 🎭 Definición de roles y jerarquías
 */
const ROLES_SISTEMA = {
    'administrador': {
        nivel: 3,
        descripcion: 'Control total del sistema',
        puede_actuar_como: ['verificador', 'docente']
    },
    'verificador': {
        nivel: 2,
        descripcion: 'Revisa y aprueba documentos',
        puede_actuar_como: ['docente']
    },
    'docente': {
        nivel: 1,
        descripcion: 'Gestiona portafolios propios',
        puede_actuar_como: []
    }
};

/**
 * 🔑 Definición de permisos por rol
 */
const PERMISOS_POR_ROL = {
    'administrador': [
        'usuarios.gestionar',
        'usuarios.crear',
        'usuarios.editar',
        'usuarios.eliminar',
        'roles.asignar',
        'roles.revocar',
        'ciclos.gestionar',
        'asignaturas.gestionar',
        'portafolios.ver_todos',
        'portafolios.gestionar_todos',
        'verificadores.asignar',
        'excel.cargar',
        'reportes.todos',
        'sistema.configurar',
        'auditoria.ver'
    ],
    'verificador': [
        'portafolios.ver_asignados',
        'documentos.revisar',
        'documentos.aprobar',
        'documentos.rechazar',
        'observaciones.crear',
        'observaciones.gestionar',
        'docentes.ver_asignados',
        'reportes.verificacion'
    ],
    'docente': [
        'portafolios.ver_propios',
        'portafolios.gestionar_propios',
        'documentos.subir',
        'documentos.editar_propios',
        'observaciones.responder',
        'perfil.editar_propio'
    ]
};

/**
 * 🛡️ Middleware principal de verificación de roles
 */
function verificarRoles(rolesRequeridos, opciones = {}) {
    const {
        permitirJerarquia = true,
        requireTodos = false,
        mensaje_personalizado = null
    } = opciones;

    return async (req, res, next) => {
        try {
            // Verificar que el usuario esté autenticado
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                    codigo_error: 'USUARIO_NO_AUTENTICADO'
                });
            }

            const { id: usuarioId, roles: rolesUsuario } = req.usuario;

            // Verificar que el usuario tenga roles
            if (!rolesUsuario || rolesUsuario.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Usuario sin roles asignados',
                    codigo_error: 'SIN_ROLES'
                });
            }

            // Normalizar roles requeridos a array
            const rolesRequeridosArray = Array.isArray(rolesRequeridos) 
                ? rolesRequeridos 
                : [rolesRequeridos];

            // Verificar acceso por roles
            const tieneAcceso = verificarAccesoRoles(
                rolesUsuario, 
                rolesRequeridosArray, 
                { permitirJerarquia, requireTodos }
            );

            if (!tieneAcceso) {
                // Log del intento de acceso no autorizado
                console.warn(`🚫 Acceso denegado: Usuario ${req.usuario.correo} intentó acceder con roles [${rolesUsuario.join(', ')}] pero requiere [${rolesRequeridosArray.join(', ')}]`);

                return res.status(403).json({
                    success: false,
                    message: mensaje_personalizado || `Acceso denegado. Roles requeridos: ${rolesRequeridosArray.join(', ')}`,
                    codigo_error: 'ACCESO_DENEGADO',
                    roles_usuario: rolesUsuario,
                    roles_requeridos: rolesRequeridosArray
                });
            }

            // Log en desarrollo
            if (process.env.NODE_ENV === 'development') {
                console.log(`✅ Acceso autorizado: ${req.usuario.correo} [${rolesUsuario.join(', ')}]`);
            }

            next();

        } catch (error) {
            console.error('❌ Error en middleware de roles:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al verificar roles',
                codigo_error: 'ERROR_INTERNO_ROLES'
            });
        }
    };
}

/**
 * 🔑 Middleware de verificación de permisos específicos
 */
function verificarPermisos(permisosRequeridos, opciones = {}) {
    const {
        requireTodos = false,
        mensaje_personalizado = null
    } = opciones;

    return async (req, res, next) => {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                    codigo_error: 'USUARIO_NO_AUTENTICADO'
                });
            }

            const { roles: rolesUsuario } = req.usuario;
            
            // Obtener todos los permisos del usuario
            const permisosUsuario = obtenerPermisosUsuario(rolesUsuario);

            // Normalizar permisos requeridos
            const permisosRequeridosArray = Array.isArray(permisosRequeridos)
                ? permisosRequeridos
                : [permisosRequeridos];

            // Verificar permisos
            const tienePermisos = verificarAccesoPermisos(
                permisosUsuario,
                permisosRequeridosArray,
                requireTodos
            );

            if (!tienePermisos) {
                console.warn(`🚫 Permisos insuficientes: Usuario ${req.usuario.correo} requiere [${permisosRequeridosArray.join(', ')}]`);

                return res.status(403).json({
                    success: false,
                    message: mensaje_personalizado || `Permisos insuficientes. Requeridos: ${permisosRequeridosArray.join(', ')}`,
                    codigo_error: 'PERMISOS_INSUFICIENTES',
                    permisos_requeridos: permisosRequeridosArray
                });
            }

            next();

        } catch (error) {
            console.error('❌ Error en middleware de permisos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al verificar permisos',
                codigo_error: 'ERROR_INTERNO_PERMISOS'
            });
        }
    };
}

/**
 * 👑 Middleware para solo administradores
 */
const soloAdministrador = verificarRoles(['administrador'], {
    mensaje_personalizado: 'Solo los administradores pueden acceder a este recurso'
});

/**
 * 👨‍💼 Middleware para verificadores y administradores
 */
const soloVerificadorOAdmin = verificarRoles(['verificador', 'administrador'], {
    permitirJerarquia: true
});

/**
 * 👨‍🏫 Middleware para docentes (y superiores)
 */
const soloDocente = verificarRoles(['docente'], {
    permitirJerarquia: true
});

/**
 * 🔒 Middleware para verificar propiedad de recurso
 */
function verificarPropietarioOAdmin(campoUsuario = 'docente_id') {
    return async (req, res, next) => {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                    codigo_error: 'USUARIO_NO_AUTENTICADO'
                });
            }

            // Los administradores pueden acceder a todo
            if (req.usuario.roles.includes('administrador')) {
                return next();
            }

            // Obtener ID del recurso desde parámetros o body
            const recursoId = req.params.id || req.body.id;
            const usuarioIdRecurso = req.params[campoUsuario] || req.body[campoUsuario];

            // Si se proporciona directamente el usuario del recurso
            if (usuarioIdRecurso) {
                if (parseInt(usuarioIdRecurso) !== req.usuario.id) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tienes permisos para acceder a este recurso',
                        codigo_error: 'RECURSO_NO_PROPIO'
                    });
                }
                return next();
            }

            // TODO: Aquí se podría agregar lógica para verificar propiedad
            // consultando la base de datos según el tipo de recurso

            next();

        } catch (error) {
            console.error('❌ Error al verificar propietario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al verificar propiedad',
                codigo_error: 'ERROR_INTERNO_PROPIETARIO'
            });
        }
    };
}

// ==========================================
// 🔧 FUNCIONES AUXILIARES
// ==========================================

/**
 * ✅ Verificar acceso por roles
 */
function verificarAccesoRoles(rolesUsuario, rolesRequeridos, opciones = {}) {
    const { permitirJerarquia = true, requireTodos = false } = opciones;

    if (requireTodos) {
        // Requiere TODOS los roles
        return rolesRequeridos.every(rolRequerido => {
            return rolesUsuario.includes(rolRequerido) ||
                (permitirJerarquia && tieneJerarquiaSuperior(rolesUsuario, rolRequerido));
        });
    } else {
        // Requiere AL MENOS UNO de los roles
        return rolesRequeridos.some(rolRequerido => {
            return rolesUsuario.includes(rolRequerido) ||
                (permitirJerarquia && tieneJerarquiaSuperior(rolesUsuario, rolRequerido));
        });
    }
}

/**
 * 📊 Verificar jerarquía superior
 */
function tieneJerarquiaSuperior(rolesUsuario, rolRequerido) {
    const nivelRequerido = ROLES_SISTEMA[rolRequerido]?.nivel || 0;
    
    return rolesUsuario.some(rolUsuario => {
        const nivelUsuario = ROLES_SISTEMA[rolUsuario]?.nivel || 0;
        return nivelUsuario > nivelRequerido;
    });
}

/**
 * 🔑 Obtener permisos de un usuario
 */
function obtenerPermisosUsuario(rolesUsuario) {
    const permisosUnicos = new Set();
    
    rolesUsuario.forEach(rol => {
        const permisos = PERMISOS_POR_ROL[rol] || [];
        permisos.forEach(permiso => permisosUnicos.add(permiso));
    });
    
    return Array.from(permisosUnicos);
}

/**
 * ✅ Verificar acceso por permisos
 */
function verificarAccesoPermisos(permisosUsuario, permisosRequeridos, requireTodos = false) {
    if (requireTodos) {
        return permisosRequeridos.every(permiso => permisosUsuario.includes(permiso));
    } else {
        return permisosRequeridos.some(permiso => permisosUsuario.includes(permiso));
    }
}

/**
 * 📋 Obtener información de roles del sistema
 */
function obtenerInfoRoles() {
    return {
        roles_disponibles: ROLES_SISTEMA,
        permisos_por_rol: PERMISOS_POR_ROL,
        timestamp: new Date().toISOString()
    };
}

/**
 * 🔍 Verificar si usuario puede actuar como otro rol
 */
function puedeActuarComo(rolUsuario, rolObjetivo) {
    const infoRol = ROLES_SISTEMA[rolUsuario];
    return infoRol && infoRol.puede_actuar_como.includes(rolObjetivo);
}

// ==========================================
// 📤 EXPORTAR MIDDLEWARE Y FUNCIONES
// ==========================================

module.exports = {
    // Middleware principales
    verificarRoles,
    verificarPermisos,
    verificarPropietarioOAdmin,
    
    // Middleware predefinidos
    soloAdministrador,
    soloVerificadorOAdmin,
    soloDocente,
    
    // Funciones auxiliares
    verificarAccesoRoles,
    verificarAccesoPermisos,
    obtenerPermisosUsuario,
    obtenerInfoRoles,
    puedeActuarComo,
    tieneJerarquiaSuperior,
    
    // Constantes
    ROLES_SISTEMA,
    PERMISOS_POR_ROL
};