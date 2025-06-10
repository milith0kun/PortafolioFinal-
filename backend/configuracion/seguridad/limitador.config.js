/**
 * ⚡ CONFIGURACIÓN RATE LIMITING - Sistema Portafolio Docente UNSAAC
 * 
 * Configuración de límites de solicitudes para proteger la API
 * contra ataques de fuerza bruta y abuso de recursos.
 * 
 * @author Sistema Portafolio Docente UNSAAC
 * @version 1.0.0
 */

const rateLimit = require('express-rate-limit');

/**
 * 🛡️ Configuración general de rate limiting
 */
const configuracionGeneral = {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,                  // 100 solicitudes por ventana
    message: {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Demasiadas solicitudes. Intente nuevamente en unos minutos.',
        retryAfter: Math.ceil(15 * 60 / 60), // en minutos
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    
    // Función personalizada para generar clave
    keyGenerator: (req) => {
        // Combinar IP + User-Agent para mejor identificación
        return `${req.ip}_${Buffer.from(req.get('User-Agent') || '').toString('base64').slice(0, 20)}`;
    },
    
    // Handler personalizado para límite excedido
    handler: (req, res) => {
        console.warn(`🚨 Rate limit excedido para IP: ${req.ip}, Ruta: ${req.path}`);
        
        res.status(429).json({
            success: false,
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Demasiadas solicitudes desde esta IP. Intente nuevamente más tarde.',
            details: {
                limite: req.rateLimit.limit,
                intentos: req.rateLimit.current,
                resetea_en: new Date(Date.now() + req.rateLimit.resetTime).toISOString(),
                retry_after: Math.ceil(req.rateLimit.resetTime / 1000 / 60) // minutos
            },
            timestamp: new Date().toISOString()
        });
    },
    
    // Skip certain requests
    skip: (req) => {
        // Skip para health checks
        if (req.path === '/api/health') return true;
        
        // Skip para IPs de confianza (opcional)
        const ipsConfianza = process.env.TRUSTED_IPS ? process.env.TRUSTED_IPS.split(',') : [];
        return ipsConfianza.includes(req.ip);
    }
};

/**
 * 🔐 Rate limiting específico para autenticación (más estricto)
 */
const limitadorAutenticacion = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5,                    // Solo 5 intentos de login por IP
    message: {
        success: false,
        error: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Demasiados intentos de autenticación. Su IP ha sido bloqueada temporalmente.',
        bloqueado_hasta: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        timestamp: new Date().toISOString()
    },
    
    // Incrementar contador solo en fallos de autenticación
    skipSuccessfulRequests: true,
    
    keyGenerator: (req) => `auth_${req.ip}`,
    
    handler: (req, res) => {
        console.error(`🚨 Múltiples intentos de login fallidos desde IP: ${req.ip}`);
        
        res.status(429).json({
            success: false,
            error: 'AUTH_RATE_LIMIT_EXCEEDED',
            message: 'Demasiados intentos de autenticación fallidos. IP bloqueada temporalmente.',
            security_notice: 'Este incidente ha sido registrado por seguridad.',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 📄 Rate limiting para subida de archivos
 */
const limitadorSubidaArchivos = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 50,                   // 50 archivos por hora
    message: {
        success: false,
        error: 'UPLOAD_RATE_LIMIT_EXCEEDED',
        message: 'Límite de subida de archivos excedido. Intente nuevamente en una hora.',
        timestamp: new Date().toISOString()
    },
    
    keyGenerator: (req) => `upload_${req.user?.id || req.ip}`,
    
    handler: (req, res) => {
        console.warn(`📄 Límite de subida excedido para usuario: ${req.user?.id || 'Anónimo'}, IP: ${req.ip}`);
        
        res.status(429).json({
            success: false,
            error: 'UPLOAD_RATE_LIMIT_EXCEEDED',
            message: 'Ha excedido el límite de archivos que puede subir por hora.',
            limite_diario: 50,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 📊 Rate limiting para reportes y consultas pesadas
 */
const limitadorReportes = rateLimit({
    windowMs: 5 * 60 * 1000,  // 5 minutos
    max: 3,                    // 3 reportes por 5 minutos
    message: {
        success: false,
        error: 'REPORT_RATE_LIMIT_EXCEEDED',
        message: 'Límite de generación de reportes excedido. Los reportes consumen muchos recursos.',
        timestamp: new Date().toISOString()
    },
    
    keyGenerator: (req) => `report_${req.user?.id || req.ip}`,
    
    handler: (req, res) => {
        console.warn(`📊 Límite de reportes excedido para usuario: ${req.user?.id || 'Anónimo'}`);
        
        res.status(429).json({
            success: false,
            error: 'REPORT_RATE_LIMIT_EXCEEDED',
            message: 'Ha excedido el límite de reportes que puede generar. Espere unos minutos.',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 📧 Rate limiting para envío de emails
 */
const limitadorEmails = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10,                   // 10 emails por hora por usuario
    message: {
        success: false,
        error: 'EMAIL_RATE_LIMIT_EXCEEDED',
        message: 'Límite de envío de emails excedido.',
        timestamp: new Date().toISOString()
    },
    
    keyGenerator: (req) => `email_${req.user?.id || req.ip}`,
    
    handler: (req, res) => {
        console.warn(`📧 Límite de emails excedido para usuario: ${req.user?.id || 'Anónimo'}`);
        
        res.status(429).json({
            success: false,
            error: 'EMAIL_RATE_LIMIT_EXCEEDED',
            message: 'Ha excedido el límite de emails que puede enviar por hora.',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 🔍 Rate limiting para búsquedas
 */
const limitadorBusquedas = rateLimit({
    windowMs: 1 * 60 * 1000,  // 1 minuto
    max: 30,                   // 30 búsquedas por minuto
    message: {
        success: false,
        error: 'SEARCH_RATE_LIMIT_EXCEEDED',
        message: 'Demasiadas búsquedas. Intente nuevamente en un minuto.',
        timestamp: new Date().toISOString()
    },
    
    keyGenerator: (req) => `search_${req.user?.id || req.ip}`,
    
    skip: (req) => {
        // Skip búsquedas muy simples
        const query = req.query.q || req.body.query || '';
        return query.length < 2;
    }
});

/**
 * 🚀 Configuración para producción (más estricta)
 */
const configuracionProduccion = {
    ...configuracionGeneral,
    windowMs: 15 * 60 * 1000,
    max: 60,  // Más restrictivo en producción
    
    // Store en Redis para producción (si está disponible)
    store: process.env.REDIS_URL ? undefined : undefined, // Configurar Redis store aquí
    
    handler: (req, res) => {
        // Log más detallado en producción
        console.error(`🚨 [PRODUCCIÓN] Rate limit excedido - IP: ${req.ip}, Ruta: ${req.path}, User-Agent: ${req.get('User-Agent')}`);
        
        res.status(429).json({
            success: false,
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Demasiadas solicitudes. Su IP ha sido limitada temporalmente.',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * 🧪 Configuración para desarrollo (más permisiva)
 */
const configuracionDesarrollo = {
    ...configuracionGeneral,
    max: 1000,  // Muy permisivo para desarrollo
    
    handler: (req, res) => {
        console.log(`⚠️  [DESARROLLO] Rate limit excedido - IP: ${req.ip}, Ruta: ${req.path}`);
        
        res.status(429).json({
            success: false,
            error: 'RATE_LIMIT_EXCEEDED',
            message: '[DESARROLLO] Rate limit excedido - límite aumentado para desarrollo',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * 🔧 Función para obtener configuración según entorno
 */
function obtenerConfiguracionLimitador() {
    const entorno = process.env.NODE_ENV || 'development';
    
    switch (entorno) {
        case 'production':
            console.log('🔒 Usando rate limiting de PRODUCCIÓN (estricto)');
            return configuracionProduccion;
            
        case 'development':
            console.log('🔧 Usando rate limiting de DESARROLLO (permisivo)');
            return configuracionDesarrollo;
            
        case 'test':
            console.log('🧪 Rate limiting DESHABILITADO para testing');
            return { max: 0 }; // Sin límites en testing
            
        default:
            return configuracionGeneral;
    }
}

/**
 * 📊 Middleware para tracking de rate limits
 */
function middlewareTrackingRateLimit(req, res, next) {
    const original = res.json;
    
    res.json = function(data) {
        // Agregar headers de rate limit info
        if (req.rateLimit) {
            res.set({
                'X-RateLimit-Limit': req.rateLimit.limit,
                'X-RateLimit-Remaining': req.rateLimit.remaining,
                'X-RateLimit-Reset': new Date(Date.now() + req.rateLimit.resetTime).toISOString()
            });
        }
        
        return original.call(this, data);
    };
    
    next();
}

/**
 * 🚨 Sistema de alertas para rate limiting
 */
const alertasRateLimit = {
    contadores: {},
    umbralAlerta: 50, // Alertar si una IP excede el límite 50 veces
    
    registrarExceso(ip, ruta) {
        const clave = `${ip}_${ruta}`;
        this.contadores[clave] = (this.contadores[clave] || 0) + 1;
        
        if (this.contadores[clave] >= this.umbralAlerta) {
            console.error(`🚨 ALERTA: IP ${ip} ha excedido rate limit ${this.contadores[clave]} veces en ruta ${ruta}`);
            
            // Aquí podrías enviar una notificación, bloquear la IP, etc.
            this.procesarAlerta(ip, ruta, this.contadores[clave]);
        }
    },
    
    procesarAlerta(ip, ruta, excesos) {
        // Implementar acciones como:
        // - Enviar email al administrador
        // - Bloquear IP en firewall
        // - Registrar en sistema de monitoreo
        console.warn(`🔒 Considerando bloqueo permanente para IP: ${ip}`);
    },
    
    limpiarContadores() {
        this.contadores = {};
        console.log('🧹 Contadores de rate limit limpiados');
    }
};

/**
 * 📈 Obtener estadísticas de rate limiting
 */
function obtenerEstadisticasRateLimit() {
    return {
        alertas_configuradas: Object.keys(alertasRateLimit.contadores).length,
        umbral_alerta: alertasRateLimit.umbralAlerta,
        contadores_activos: alertasRateLimit.contadores,
        configuracion_actual: process.env.NODE_ENV || 'development'
    };
}

/**
 * 📤 Exportaciones
 */
module.exports = {
    // Configuración principal
    configuracionLimitador: obtenerConfiguracionLimitador(),
    
    // Limitadores específicos
    limitadorAutenticacion,
    limitadorSubidaArchivos,
    limitadorReportes,
    limitadorEmails,
    limitadorBusquedas,
    
    // Configuraciones por entorno
    configuracionProduccion,
    configuracionDesarrollo,
    configuracionGeneral,
    
    // Middlewares y utilidades
    middlewareTrackingRateLimit,
    obtenerConfiguracionLimitador,
    obtenerEstadisticasRateLimit,
    
    // Sistema de alertas
    alertasRateLimit
};