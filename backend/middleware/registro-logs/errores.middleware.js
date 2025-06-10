/**
 * ❌ MIDDLEWARE DE MANEJO DE ERRORES
 * 
 * Maneja y registra errores de la aplicación:
 * - Captura de errores no manejados
 * - Logs detallados de errores
 * - Respuestas de error estructuradas
 * - Notificaciones de errores críticos
 * - Stack traces en desarrollo
 * 
 * Uso: Manejo centralizado de errores
 */

// TODO: Logs estructurados de errores
// TODO: Diferentes niveles de error
// TODO: Notificaciones para errores críticos
// TODO: Sanitización de información sensible
// TODO: Stack traces solo en desarrollo

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

// ==========================================
// 📝 ERROR MIDDLEWARE - errores.middleware.js
// ==========================================

/**
 * 🚨 MIDDLEWARE DE ERRORES - Sistema Portafolio Docente UNSAAC
 * Manejo centralizado de errores con logging
 */

const fs = require('fs');
const path = require('path');

/**
 * 📝 Logger de errores
 */
function logError(error, req) {
    const timestamp = new Date().toISOString();
    const errorLog = {
        timestamp,
        error: {
            message: error.message,
            stack: error.stack,
            name: error.name
        },
        request: {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            usuario: req.usuario ? req.usuario.correo : 'No autenticado'
        }
    };

    // Escribir a archivo de log
    const logPath = path.join(process.cwd(), 'logs', 'errores', `error-${new Date().toISOString().split('T')[0]}.log`);
    
    // Crear directorio si no existe
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    fs.appendFileSync(logPath, JSON.stringify(errorLog) + '\n');
    
    // Log en consola también
    console.error('❌ Error capturado:', errorLog);
}

/**
 * 🚨 Middleware principal de manejo de errores
 */
function manejarErrores(error, req, res, next) {
    // Log del error
    logError(error, req);

    // Respuesta según el tipo de error
    let statusCode = 500;
    let mensaje = 'Error interno del servidor';
    let codigoError = 'ERROR_INTERNO';

    // Errores de validación
    if (error.name === 'ValidationError') {
        statusCode = 400;
        mensaje = 'Error de validación';
        codigoError = 'ERROR_VALIDACION';
    }

    // Errores de base de datos
    if (error.code === 'ER_DUP_ENTRY') {
        statusCode = 409;
        mensaje = 'El recurso ya existe';
        codigoError = 'RECURSO_DUPLICADO';
    }

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        statusCode = 400;
        mensaje = 'Referencia inválida en los datos';
        codigoError = 'REFERENCIA_INVALIDA';
    }

    // Error de archivo muy grande
    if (error.code === 'LIMIT_FILE_SIZE') {
        statusCode = 413;
        mensaje = 'Archivo demasiado grande';
        codigoError = 'ARCHIVO_MUY_GRANDE';
    }

    // En desarrollo, incluir stack trace
    const respuesta = {
        success: false,
        message: mensaje,
        codigo_error: codigoError,
        timestamp: new Date().toISOString()
    };

    if (process.env.NODE_ENV === 'development') {
        respuesta.error_details = {
            message: error.message,
            stack: error.stack
        };
    }

    res.status(statusCode).json(respuesta);
}

/**
 * 🚫 Middleware para rutas no encontradas
 */
function manejarRutaNoEncontrada(req, res) {
    const errorLog = {
        timestamp: new Date().toISOString(),
        type: 'RUTA_NO_ENCONTRADA',
        request: {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        }
    };

    console.warn('🚫 Ruta no encontrada:', errorLog);

    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        codigo_error: 'RUTA_NO_ENCONTRADA',
        ruta_solicitada: req.originalUrl,
        metodo: req.method,
        timestamp: new Date().toISOString()
    });
}

module.exports = {
    manejarErrores,
    manejarRutaNoEncontrada,
    logError
};
