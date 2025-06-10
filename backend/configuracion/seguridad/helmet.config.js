/**
 * 🛡️ CONFIGURACIÓN HELMET - Sistema Portafolio Docente UNSAAC
 * 
 * Configuración de headers de seguridad HTTP para proteger
 * la aplicación contra vulnerabilidades comunes.
 * 
 * @author Sistema Portafolio Docente UNSAAC
 * @version 1.0.0
 */

require('dotenv').config();

/**
 * 🔒 Configuración principal de Helmet
 */
const configuracionHelmet = {
    // Content Security Policy
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            
            // Scripts permitidos
            scriptSrc: [
                "'self'",
                "'unsafe-inline'", // Para desarrollo - remover en producción
                "'unsafe-eval'",   // Para desarrollo - remover en producción
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com",
                "https://code.jquery.com"
            ],
            
            // Estilos permitidos
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com"
            ],
            
            // Fuentes permitidas
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://cdn.jsdelivr.net"
            ],
            
            // Imágenes permitidas
            imgSrc: [
                "'self'",
                "data:",
                "blob:",
                "https:",
                "*.unsaac.edu.pe"
            ],
            
            // Conexiones permitidas
            connectSrc: [
                "'self'",
                "https://api.unsaac.edu.pe",
                "wss://portafolio.unsaac.edu.pe"
            ],
            
            // Marcos permitidos
            frameSrc: ["'none'"],
            
            // Objetos permitidos
            objectSrc: ["'none'"],
            
            // Medios permitidos
            mediaSrc: ["'self'"],
            
            // Workers permitidos
            workerSrc: ["'self'", "blob:"],
            
            // Formularios permitidos
            formAction: ["'self'"],
            
            // Recursos de manifest
            manifestSrc: ["'self'"],
            
            // Base URI
            baseUri: ["'self'"]
        },
        
        // Reportar violaciones CSP
        reportOnly: process.env.NODE_ENV === 'development'
    },

    // Cross-Origin Embedder Policy
    crossOriginEmbedderPolicy: {
        policy: "require-corp"
    },

    // Cross-Origin Opener Policy
    crossOriginOpenerPolicy: {
        policy: "same-origin"
    },

    // Cross-Origin Resource Policy
    crossOriginResourcePolicy: {
        policy: "cross-origin"
    },

    // DNS Prefetch Control
    dnsPrefetchControl: {
        allow: false
    },

    // Expect-CT
    expectCt: {
        enforce: true,
        maxAge: 86400, // 24 horas
        reportUri: process.env.CSP_REPORT_URI || undefined
    },

    // Feature Policy / Permissions Policy
    permissionsPolicy: {
        features: {
            accelerometer: [],
            ambientLightSensor: [],
            autoplay: [],
            battery: [],
            camera: [],
            displayCapture: [],
            documentDomain: [],
            encryptedMedia: [],
            executionWhileNotRendered: [],
            executionWhileOutOfViewport: [],
            fontDisplayLateSwap: [],
            fullscreen: ["'self'"],
            geolocation: [],
            gyroscope: [],
            layoutAnimations: [],
            legacyImageFormats: [],
            loadingFrameDefaultEager: [],
            magnetometer: [],
            microphone: [],
            midi: [],
            navigationOverride: [],
            notifications: [],
            oversizedImages: [],
            payment: [],
            pictureInPicture: [],
            publickeyCredentialsGet: [],
            speaker: [],
            syncScript: [],
            unoptimizedImages: [],
            unoptimizedLosslessImages: [],
            unoptimizedLossyImages: [],
            unsizedMedia: [],
            usb: [],
            verticalScroll: [],
            vibrate: [],
            vr: [],
            wakeLock: [],
            xr: []
        }
    },

    // Frame Options
    frameguard: {
        action: 'deny'
    },

    // Hide Powered By
    hidePoweredBy: true,

    // HTTP Strict Transport Security
    hsts: {
        maxAge: 31536000, // 1 año
        includeSubDomains: true,
        preload: true
    },

    // IE No Open
    ieNoOpen: true,

    // No Sniff
    noSniff: true,

    // Origin Agent Cluster
    originAgentCluster: true,

    // Referrer Policy
    referrerPolicy: {
        policy: "strict-origin-when-cross-origin"
    },

    // X-XSS-Protection
    xssFilter: true
};

/**
 * 🚀 Configuración para producción (más estricta)
 */
const configuracionProduccion = {
    ...configuracionHelmet,
    
    contentSecurityPolicy: {
        directives: {
            ...configuracionHelmet.contentSecurityPolicy.directives,
            
            // Remover unsafe-inline y unsafe-eval en producción
            scriptSrc: [
                "'self'",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com"
            ],
            
            styleSrc: [
                "'self'",
                "https://fonts.googleapis.com",
                "https://cdn.jsdelivr.net"
            ],
            
            // Más restrictivo en producción
            connectSrc: [
                "'self'",
                "https://api.unsaac.edu.pe",
                "https://portafolio.unsaac.edu.pe"
            ]
        },
        
        // No modo reportOnly en producción
        reportOnly: false
    },

    // HSTS más estricto
    hsts: {
        maxAge: 63072000, // 2 años
        includeSubDomains: true,
        preload: true
    }
};

/**
 * 🧪 Configuración para desarrollo (más permisiva)
 */
const configuracionDesarrollo = {
    ...configuracionHelmet,
    
    contentSecurityPolicy: {
        directives: {
            ...configuracionHelmet.contentSecurityPolicy.directives,
            
            // Más permisivo para desarrollo
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-eval'",
                "https:",
                "http:",
                "localhost:*",
                "127.0.0.1:*"
            ],
            
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https:",
                "http:"
            ],
            
            connectSrc: [
                "'self'",
                "http://localhost:*",
                "http://127.0.0.1:*",
                "ws://localhost:*",
                "wss://localhost:*"
            ]
        },
        
        // Solo reportar en desarrollo
        reportOnly: true
    },

    // HSTS deshabilitado en desarrollo
    hsts: false
};

/**
 * 🧪 Configuración para testing
 */
const configuracionTesting = {
    contentSecurityPolicy: false,
    hsts: false,
    frameguard: false,
    hidePoweredBy: true,
    noSniff: true,
    xssFilter: true
};

/**
 * 🔧 Función para obtener configuración según entorno
 */
function obtenerConfiguracionHelmet() {
    const entorno = process.env.NODE_ENV || 'development';
    
    switch (entorno) {
        case 'production':
            console.log('🔒 Usando configuración Helmet de PRODUCCIÓN (máxima seguridad)');
            return configuracionProduccion;
            
        case 'test':
            console.log('🧪 Usando configuración Helmet de TESTING (mínima)');
            return configuracionTesting;
            
        case 'development':
        default:
            console.log('🔧 Usando configuración Helmet de DESARROLLO');
            return configuracionDesarrollo;
    }
}

/**
 * 📋 Headers de seguridad personalizados adicionales
 */
const headersPersonalizados = {
    // Headers de la aplicación
    'X-Application': 'Portafolio-Docente-UNSAAC',
    'X-Version': '1.0.0',
    'X-Environment': process.env.NODE_ENV || 'development',
    
    // Headers de seguridad adicionales
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    
    // Cache Control para archivos estáticos
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
};

/**
 * 🛡️ Middleware para headers personalizados
 */
function middlewareHeadersPersonalizados(req, res, next) {
    // Aplicar headers personalizados
    Object.entries(headersPersonalizados).forEach(([header, value]) => {
        res.setHeader(header, value);
    });
    
    // Headers específicos para archivos subidos
    if (req.path.startsWith('/uploads/')) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Disposition', 'attachment');
    }
    
    // Headers para API
    if (req.path.startsWith('/api/')) {
        res.setHeader('X-API-Version', 'v1');
        res.setHeader('X-Rate-Limit-Policy', 'enabled');
    }
    
    next();
}

/**
 * 🚨 Middleware para detectar violaciones CSP
 */
function middlewareCSPReporter(req, res, next) {
    if (req.path === '/api/csp-report' && req.method === 'POST') {
        console.warn('🚨 Violación CSP detectada:', req.body);
        
        // Aquí podrías enviar el reporte a un servicio de monitoreo
        // como Sentry, LogRocket, etc.
        
        return res.status(204).end();
    }
    next();
}

/**
 * 📊 Configuración de CSP para reportes
 */
function configurarCSPReporting() {
    const reportUri = process.env.CSP_REPORT_URI || '/api/csp-report';
    
    return {
        ...configuracionHelmet.contentSecurityPolicy,
        directives: {
            ...configuracionHelmet.contentSecurityPolicy.directives,
            reportUri: [reportUri]
        }
    };
}

/**
 * 🔍 Validar configuración de seguridad
 */
function validarConfiguracionSeguridad() {
    const warnings = [];
    const entorno = process.env.NODE_ENV;
    
    if (entorno === 'production') {
        // Verificaciones para producción
        if (!process.env.CSP_REPORT_URI) {
            warnings.push('CSP_REPORT_URI no configurado para producción');
        }
        
        const config = configuracionProduccion.contentSecurityPolicy.directives;
        if (config.scriptSrc.includes("'unsafe-inline'")) {
            warnings.push("'unsafe-inline' detectado en scriptSrc para producción");
        }
        
        if (config.scriptSrc.includes("'unsafe-eval'")) {
            warnings.push("'unsafe-eval' detectado en scriptSrc para producción");
        }
    }
    
    if (warnings.length > 0) {
        console.warn('⚠️  Advertencias de configuración de seguridad:');
        warnings.forEach(warning => console.warn(`   - ${warning}`));
    } else {
        console.log('✅ Configuración de seguridad validada correctamente');
    }
    
    return { warnings, esSeguro: warnings.length === 0 };
}

/**
 * 📋 Obtener resumen de configuración actual
 */
function obtenerResumenConfiguracion() {
    const config = obtenerConfiguracionHelmet();
    const entorno = process.env.NODE_ENV || 'development';
    
    return {
        entorno,
        csp_habilitado: config.contentSecurityPolicy !== false,
        hsts_habilitado: config.hsts !== false,
        frameguard_habilitado: config.frameguard !== false,
        xss_protection: config.xssFilter !== false,
        content_type_nosniff: config.noSniff !== false,
        headers_personalizados: Object.keys(headersPersonalizados).length,
        validacion: validarConfiguracionSeguridad()
    };
}

/**
 * 📤 Exportaciones
 */
module.exports = {
    // Configuración principal
    configuracionHelmet: obtenerConfiguracionHelmet(),
    
    // Configuraciones por entorno
    configuracionProduccion,
    configuracionDesarrollo,
    configuracionTesting,
    
    // Middlewares
    middlewareHeadersPersonalizados,
    middlewareCSPReporter,
    
    // Utilidades
    obtenerConfiguracionHelmet,
    configurarCSPReporting,
    validarConfiguracionSeguridad,
    obtenerResumenConfiguracion,
    
    // Headers personalizados
    headersPersonalizados
};