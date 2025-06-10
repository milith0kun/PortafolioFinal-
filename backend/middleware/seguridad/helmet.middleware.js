/**
 * 🛡️ MIDDLEWARE DE HEADERS DE SEGURIDAD
 * 
 * Configura headers de seguridad con Helmet:
 * - Content Security Policy
 * - X-Frame-Options
 * - X-XSS-Protection
 * - Strict-Transport-Security
 * - X-Content-Type-Options
 * 
 * Uso: Proteger contra vulnerabilidades web comunes
 */

// TODO: CSP específico para la aplicación
// TODO: HSTS para HTTPS forzado
// TODO: Protección contra clickjacking
// TODO: Prevención de MIME sniffing
// TODO: Headers personalizados de seguridad

// ==========================================
// 🔒 HELMET MIDDLEWARE - helmet.middleware.js
// ==========================================

/**
 * 🛡️ MIDDLEWARE HELMET - Sistema Portafolio Docente UNSAAC
 * Headers de seguridad para proteger la aplicación
 */

const helmet = require('helmet');

const helmetOptions = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
};

module.exports = helmet(helmetOptions);