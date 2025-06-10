/**
 * 🔐 CONTROLADOR DE LOGIN
 * 
 * Maneja todas las operaciones relacionadas con el inicio y cierre de sesión:
 * - Autenticación de usuarios con email/password
 * - Generación de tokens JWT
 * - Logout y invalidación de sesiones
 * - Renovación de tokens (refresh)
 * - Control de intentos fallidos de login
 * 
 * Rutas que maneja:
 * POST /api/v1/auth/login - Iniciar sesión
 * POST /api/v1/auth/logout - Cerrar sesión
 * POST /api/v1/auth/refresh - Renovar token
 */

// TODO: Implementar login con validación de credenciales
// TODO: Generar JWT con información del usuario y sus roles
// TODO: Implementar logout con blacklist de tokens
// TODO: Sistema de refresh tokens
// TODO: Control de intentos fallidos (rate limiting por usuario)


/**
 * 🔐 CONTROLADOR LOGIN - Sistema Portafolio Docente UNSAAC
 * Maneja login, logout y verificación de credenciales
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ejecutarConsulta } = require('../../base_datos/conexiones/pool.conexion');
const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_secreta_temporal';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '2h';

/**
 * 🔑 Login de usuario
 */
async function login(req, res) {
    try {
        const { correo, contrasena } = req.body;

        // Validar datos
        if (!correo || !contrasena) {
            return res.status(400).json({
                success: false,
                message: 'Correo y contraseña son obligatorios'
            });
        }

        // Buscar usuario con sus roles activos
        const usuarios = await ejecutarConsulta(
            `SELECT 
                u.id, u.nombres, u.apellidos, u.correo, u.contrasena, u.activo,
                GROUP_CONCAT(ur.rol) as roles
             FROM usuarios u
             LEFT JOIN usuarios_roles ur ON u.id = ur.usuario_id AND ur.activo = 1
             WHERE u.correo = ? AND u.activo = 1
             GROUP BY u.id`,
            [correo]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const usuario = usuarios[0];

        // Verificar contraseña
        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!contrasenaValida) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Actualizar último acceso
        await ejecutarConsulta(
            'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?',
            [usuario.id]
        );

        // Generar token JWT
        const rolesArray = usuario.roles ? usuario.roles.split(',') : [];
        const token = jwt.sign(
            { 
                id: usuario.id, 
                correo: usuario.correo,
                roles: rolesArray
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRE }
        );

        // Remover contraseña de la respuesta
        delete usuario.contrasena;

        res.json({
            success: true,
            message: 'Login exitoso',
            token,
            usuario: {
                ...usuario,
                roles: rolesArray
            }
        });

    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * 🔄 Logout de usuario
 */
async function logout(req, res) {
    try {
        // En una implementación más completa, aquí invalidarías el token
        // Por ahora solo enviamos respuesta exitosa
        
        res.json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });

    } catch (error) {
        console.error('❌ Error en logout:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * ✅ Verificar token
 */
async function verificarToken(req, res) {
    try {
        // El middleware ya verificó el token, solo retornamos éxito
        res.json({
            success: true,
            message: 'Token válido',
            usuario: req.usuario
        });

    } catch (error) {
        console.error('❌ Error al verificar token:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

module.exports = {
    login,
    logout,
    verificarToken
};