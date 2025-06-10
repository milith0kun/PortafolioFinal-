/**
 * 🔐 MIDDLEWARE DE VERIFICACIÓN JWT
 * 
 * Verifica la validez de los tokens JWT en las peticiones:
 * - Extraer token del header Authorization
 * - Verificar firma y expiración
 * - Decodificar información del usuario
 * - Verificar si token está en blacklist
 * - Inyectar datos del usuario en req.user
 * 
 * Uso: Proteger rutas que requieren autenticación
 */

// TODO: Verificar token JWT válido
// TODO: Manejar tokens expirados
// TODO: Verificar blacklist de tokens
// TODO: Extraer información del usuario
// TODO: Manejar diferentes tipos de errores JWT
/**
 * 🔐 MIDDLEWARE JWT - Sistema Portafolio Docente UNSAAC
 * 
 * Middleware para verificar tokens JWT en rutas protegidas:
 * - Validación de tokens de acceso
 * - Extracción de información del usuario
 * - Manejo de tokens expirados
 * - Logging de acceso
 * 
 * @author Sistema Portafolio Docente UNSAAC
 * @version 1.0.0
 */

const jwt = require('jsonwebtoken');
const { ejecutarLectura } = require('../../base_datos/conexiones/pool.conexion');

/**
 * 🔐 Middleware principal de verificación JWT
 */
async function verificarJWT(req, res, next) {
    try {
        // Extraer token del header Authorization
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Token de acceso requerido',
                codigo_error: 'TOKEN_REQUERIDO'
            });
        }
        
        // Verificar formato: "Bearer TOKEN"
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({
                success: false,
                message: 'Formato de token inválido. Debe ser: Bearer <token>',
                codigo_error: 'FORMATO_TOKEN_INVALIDO'
            });
        }
        
        const token = parts[1];
        
        // Verificar y decodificar token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expirado',
                    codigo_error: 'TOKEN_EXPIRADO'
                });
            } else if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token inválido',
                    codigo_error: 'TOKEN_INVALIDO'
                });
            } else {
                throw error;
            }
        }
        
        // Verificar que el usuario existe y está activo
        const { resultado: usuarios } = await ejecutarLectura(`
            SELECT 
                u.id, u.nombres, u.apellidos, u.correo, u.activo,
                u.ultimo_acceso, u.avatar, u.telefono
            FROM usuarios u 
            WHERE u.id = ? AND u.activo = 1
        `, [decoded.userId]);
        
        if (usuarios.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado o inactivo',
                codigo_error: 'USUARIO_NO_ENCONTRADO'
            });
        }
        
        const usuario = usuarios[0];
        
        // Obtener roles activos del usuario
        const { resultado: roles } = await ejecutarLectura(`
            SELECT ur.rol, ur.fecha_asignacion
            FROM usuarios_roles ur
            WHERE ur.usuario_id = ? AND ur.activo = 1
            ORDER BY ur.fecha_asignacion ASC
        `, [usuario.id]);
        
        // Agregar información del usuario a la request
        req.usuario = {
            id: usuario.id,
            nombres: usuario.nombres,
            apellidos: usuario.apellidos,
            correo: usuario.correo,
            nombre_completo: `${usuario.nombres} ${usuario.apellidos}`,
            avatar: usuario.avatar,
            telefono: usuario.telefono,
            ultimo_acceso: usuario.ultimo_acceso,
            roles: roles.map(r => r.rol),
            rol_principal: roles.length > 0 ? roles[0].rol : null,
            token_info: {
                iat: decoded.iat,
                exp: decoded.exp,
                tiempo_restante: decoded.exp - Math.floor(Date.now() / 1000)
            }
        };
        
        // Actualizar último acceso (async, no bloquea)
        ejecutarLectura(`
            UPDATE usuarios 
            SET ultimo_acceso = NOW() 
            WHERE id = ?
        `, [usuario.id]).catch(error => {
            console.error('Error al actualizar último acceso:', error);
        });
        
        // Log de acceso en desarrollo
        if (process.env.NODE_ENV === 'development') {
            console.log(`🔐 Usuario autenticado: ${usuario.correo} (${roles.map(r => r.rol).join(', ')})`);
        }
        
        next();
        
    } catch (error) {
        console.error('❌ Error en middleware JWT:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al verificar token',
            codigo_error: 'ERROR_INTERNO_JWT'
        });
    }
}

/**
 * 🔐 Middleware opcional JWT (no falla si no hay token)
 */
async function verificarJWTOpcional(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            // No hay token, continuar sin usuario
            req.usuario = null;
            return next();
        }
        
        // Si hay token, usar la verificación normal
        await verificarJWT(req, res, next);
        
    } catch (error) {
        // En caso de error, continuar sin usuario
        req.usuario = null;
        next();
    }
}

/**
 * 🔄 Middleware para refrescar token
 */
async function refrescarToken(req, res, next) {
    try {
        const { refresh_token } = req.body;
        
        if (!refresh_token) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token requerido',
                codigo_error: 'REFRESH_TOKEN_REQUERIDO'
            });
        }
        
        // Verificar refresh token
        let decoded;
        try {
            decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token inválido o expirado',
                codigo_error: 'REFRESH_TOKEN_INVALIDO'
            });
        }
        
        // Verificar usuario
        const { resultado: usuarios } = await ejecutarLectura(`
            SELECT id, nombres, apellidos, correo, activo
            FROM usuarios 
            WHERE id = ? AND activo = 1
        `, [decoded.userId]);
        
        if (usuarios.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado',
                codigo_error: 'USUARIO_NO_ENCONTRADO'
            });
        }
        
        // Agregar usuario a request para que el controlador pueda generar nuevos tokens
        req.usuario = usuarios[0];
        next();
        
    } catch (error) {
        console.error('❌ Error al refrescar token:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al refrescar token',
            codigo_error: 'ERROR_INTERNO_REFRESH'
        });
    }
}

/**
 * 📊 Middleware para extraer información de token sin validar
 */
function extraerInfoToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            req.token_info = null;
            return next();
        }
        
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            req.token_info = null;
            return next();
        }
        
        const token = parts[1];
        
        // Decodificar sin verificar (para obtener info aunque esté expirado)
        try {
            const decoded = jwt.decode(token);
            req.token_info = {
                userId: decoded.userId,
                correo: decoded.correo,
                iat: decoded.iat,
                exp: decoded.exp,
                expirado: decoded.exp < Math.floor(Date.now() / 1000),
                tiempo_restante: decoded.exp - Math.floor(Date.now() / 1000)
            };
        } catch (error) {
            req.token_info = null;
        }
        
        next();
        
    } catch (error) {
        req.token_info = null;
        next();
    }
}

// ==========================================
// 📤 EXPORTAR MIDDLEWARE
// ==========================================

module.exports = {
    verificarJWT,
    verificarJWTOpcional,
    refrescarToken,
    extraerInfoToken,
    
    // Alias para compatibilidad
    autenticar: verificarJWT,
    autenticarOpcional: verificarJWTOpcional
};