/**
 * 🚦 MIDDLEWARE DE RATE LIMITING
 * 
 * Implementa límites de velocidad por endpoint:
 * - Límites por IP y por usuario
 * - Ventanas deslizantes de tiempo
 * - Límites diferentes por endpoint
 * - Whitelist para administradores
 * - Logs de intentos bloqueados
 * 
 * Uso: Prevenir abuso y DoS
 */

// TODO: Rate limiting por IP y usuario
// TODO: Límites específicos por endpoint crítico
// TODO: Ventanas deslizantes con Redis
// TODO: Whitelist de IPs administrativas
// TODO: Alertas de intentos de abuso
// ==========================================
// ⏱️ RATE LIMITING MIDDLEWARE - limitador.middleware.js
// ==========================================

/**
 * 🚦 MIDDLEWARE RATE LIMITING - Sistema Portafolio Docente UNSAAC
 * Control de límites de requests para prevenir ataques
 */

const rateLimit = require('express-rate-limit');

/**
 * 🌐 Rate limit global
 */
const globalRateLimit = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // máximo 100 requests por ventana
    message: {
        success: false,
        message: 'Demasiadas solicitudes desde esta IP, intenta nuevamente más tarde',
        codigo_error: 'RATE_LIMIT_EXCEDIDO',
        retry_after: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`🚫 Rate limit excedido para IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Demasiadas solicitudes desde esta IP, intenta nuevamente más tarde',
            codigo_error: 'RATE_LIMIT_EXCEDIDO',
            retry_after: req.rateLimit.resetTime
        });
    }
});

/**
 * 🔐 Rate limit para autenticación (más estricto)
 */
const autenticacionRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 intentos de login por IP
    message: {
        success: false,
        message: 'Demasiados intentos de login, intenta nuevamente en 15 minutos',
        codigo_error: 'LOGIN_RATE_LIMIT_EXCEDIDO'
    },
    skipSuccessfulRequests: true, // No contar requests exitosos
    handler: (req, res) => {
        console.warn(`🚫 Rate limit de autenticación excedido para IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Demasiados intentos de login, intenta nuevamente en 15 minutos',
            codigo_error: 'LOGIN_RATE_LIMIT_EXCEDIDO',
            retry_after: '15 minutos'
        });
    }
});

/**
 * 📁 Rate limit para subida de archivos
 */
const subidaArchivosRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 50, // máximo 50 subidas por hora
    message: {
        success: false,
        message: 'Límite de subidas por hora excedido, intenta más tarde',
        codigo_error: 'SUBIDA_RATE_LIMIT_EXCEDIDO'
    }
});

/**
 * 📊 Rate limit para reportes (recursos intensivos)
 */
const reportesRateLimit = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutos
    max: 10, // máximo 10 reportes por 10 minutos
    message: {
        success: false,
        message: 'Límite de generación de reportes excedido',
        codigo_error: 'REPORTES_RATE_LIMIT_EXCEDIDO'
    }
});

/**
 * 📈 Rate limit para carga masiva Excel
 */
const cargaExcelRateLimit = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutos
    max: 3, // máximo 3 cargas masivas por 30 minutos
    message: {
        success: false,
        message: 'Límite de cargas masivas excedido, intenta en 30 minutos',
        codigo_error: 'EXCEL_RATE_LIMIT_EXCEDIDO'
    }
});

module.exports = {
    global: globalRateLimit,
    autenticacion: autenticacionRateLimit,
    subidaArchivos: subidaArchivosRateLimit,
    reportes: reportesRateLimit,
    cargaExcel: cargaExcelRateLimit
};
