/**
 * 🔑 CONTROLADOR DE RECUPERACIÓN DE CONTRASEÑAS
 * 
 * Gestiona el proceso completo de recuperación de contraseñas:
 * - Solicitud de recuperación por email
 * - Generación de tokens de recuperación
 * - Envío de emails con enlaces de recuperación
 * - Validación de tokens de recuperación
 * - Restablecimiento de contraseñas
 * 
 * Rutas que maneja:
 * POST /api/v1/auth/forgot-password - Solicitar recuperación
 * POST /api/v1/auth/reset-password - Restablecer contraseña
 */

// TODO: Generar token único de recuperación con expiración
// TODO: Enviar email con enlace de recuperación
// TODO: Validar token de recuperación
// TODO: Permitir establecer nueva contraseña
// TODO: Invalidar tokens usados
/**
 * 🔑 CONTROLADOR RECUPERACIÓN - Sistema Portafolio Docente UNSAAC
 * Maneja recuperación y restablecimiento de contraseñas
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { ejecutarConsulta } = require('../../base_datos/conexiones/pool.conexion');
/**
 * 📧 Solicitar recuperación de contraseña
 */
async function solicitarRecuperacion(req, res) {
    try {
        const { correo } = req.body;

        if (!correo) {
            return res.status(400).json({
                success: false,
                message: 'El correo es obligatorio'
            });
        }

        // Verificar que el usuario existe
        const usuarios = await ejecutarConsulta(
            'SELECT id, nombres, apellidos FROM usuarios WHERE correo = ? AND activo = 1',
            [correo]
        );

        // Siempre responder exitosamente por seguridad (no revelar si el email existe)
        if (usuarios.length === 0) {
            return res.json({
                success: true,
                message: 'Si el correo existe, recibirás instrucciones para recuperar tu contraseña'
            });
        }

        const usuario = usuarios[0];

        // Generar token de recuperación
        const token = crypto.randomBytes(32).toString('hex');
        const expiracion = new Date(Date.now() + 3600000); // 1 hora

        // Guardar token en base de datos
        await ejecutarConsulta(
            'UPDATE usuarios SET token_recuperacion = ?, expiracion_token = ? WHERE id = ?',
            [token, expiracion, usuario.id]
        );

        // TODO: Aquí enviarías el email con el token
        console.log(`🔑 Token de recuperación para ${correo}: ${token}`);

        res.json({
            success: true,
            message: 'Si el correo existe, recibirás instrucciones para recuperar tu contraseña',
            // Solo en desarrollo - remover en producción
            debug_token: process.env.NODE_ENV === 'development' ? token : undefined
        });

    } catch (error) {
        console.error('❌ Error al solicitar recuperación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * ✅ Verificar token de recuperación
 */
async function verificarTokenRecuperacion(req, res) {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token requerido'
            });
        }

        // Buscar usuario con token válido
        const usuarios = await ejecutarConsulta(
            `SELECT id, nombres, apellidos, correo 
             FROM usuarios 
             WHERE token_recuperacion = ? 
             AND expiracion_token > NOW() 
             AND activo = 1`,
            [token]
        );

        if (usuarios.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }

        res.json({
            success: true,
            message: 'Token válido',
            usuario: {
                id: usuarios[0].id,
                nombres: usuarios[0].nombres,
                apellidos: usuarios[0].apellidos,
                correo: usuarios[0].correo
            }
        });

    } catch (error) {
        console.error('❌ Error al verificar token:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * 🔄 Restablecer contraseña
 */
async function restablecerContrasena(req, res) {
    try {
        const { token, nueva_contrasena } = req.body;

        if (!token || !nueva_contrasena) {
            return res.status(400).json({
                success: false,
                message: 'Token y nueva contraseña son obligatorios'
            });
        }

        // Validar longitud de contraseña
        if (nueva_contrasena.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Buscar usuario con token válido
        const usuarios = await ejecutarConsulta(
            `SELECT id FROM usuarios 
             WHERE token_recuperacion = ? 
             AND expiracion_token > NOW() 
             AND activo = 1`,
            [token]
        );

        if (usuarios.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }

        const usuario = usuarios[0];

        // Encriptar nueva contraseña
        const contrasenaHash = await bcrypt.hash(nueva_contrasena, 12);

        // Actualizar contraseña y limpiar token
        await ejecutarConsulta(
            `UPDATE usuarios 
             SET contrasena = ?, token_recuperacion = NULL, expiracion_token = NULL 
             WHERE id = ?`,
            [contrasenaHash, usuario.id]
        );

        res.json({
            success: true,
            message: 'Contraseña restablecida exitosamente'
        });

    } catch (error) {
        console.error('❌ Error al restablecer contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * 🔒 Cambiar contraseña (usuario autenticado)
 */
async function cambiarContrasena(req, res) {
    try {
        const { contrasena_actual, nueva_contrasena } = req.body;

        if (!contrasena_actual || !nueva_contrasena) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña actual y nueva contraseña son obligatorias'
            });
        }

        // Validar longitud de nueva contraseña
        if (nueva_contrasena.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }

        // Obtener contraseña actual del usuario
        const usuarios = await ejecutarConsulta(
            'SELECT contrasena FROM usuarios WHERE id = ?',
            [req.usuario.id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar contraseña actual
        const contrasenaValida = await bcrypt.compare(contrasena_actual, usuarios[0].contrasena);
        if (!contrasenaValida) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña actual es incorrecta'
            });
        }

        // Encriptar nueva contraseña
        const contrasenaHash = await bcrypt.hash(nueva_contrasena, 12);

        // Actualizar contraseña
        await ejecutarConsulta(
            'UPDATE usuarios SET contrasena = ? WHERE id = ?',
            [contrasenaHash, req.usuario.id]
        );

        res.json({
            success: true,
            message: 'Contraseña cambiada exitosamente'
        });

    } catch (error) {
        console.error('❌ Error al cambiar contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

module.exports = {
    solicitarRecuperacion,
    verificarTokenRecuperacion,
    restablecerContrasena,
    cambiarContrasena
};