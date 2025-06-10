/**
 * 🌐 MIDDLEWARE DE CONFIGURACIÓN CORS
 * 
 * Configura Cross-Origin Resource Sharing:
 * - Origins permitidos por ambiente
 * - Headers personalizados permitidos
 * - Métodos HTTP habilitados
 * - Credenciales en requests cross-origin
 * - Preflight requests
 * 
 * Uso: Controlar acceso desde frontend
 */

// TODO: Origins dinámicos según ambiente
// TODO: Headers específicos del dominio
// TODO: Whitelist de métodos por endpoint
// TODO: Manejo de credenciales seguro
// TODO: Cache de preflight requests
// ==========================================
// 🛡️ CORS MIDDLEWARE - cors.middleware.js
// ==========================================

/**
 * 🌐 MIDDLEWARE CORS - Sistema Portafolio Docente UNSAAC
 * Configuración de Cross-Origin Resource Sharing
 */

const cors = require('cors');

const corsOptions = {
    origin: function (origin, callback) {
        // Permitir requests sin origin (aplicaciones móviles, Postman, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            process.env.FRONTEND_URL || 'http://localhost:4200',
            process.env.CORS_ORIGIN || 'http://localhost:4200',
            'http://localhost:3000', // Para desarrollo del backend
            'http://localhost:4200', // Para desarrollo del frontend
            'https://portafolio.unsaac.edu.pe', // Producción
        ];
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`🚫 Origen bloqueado por CORS: ${origin}`);
            callback(new Error('No permitido por CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'X-API-Key'
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    maxAge: 86400 // 24 horas
};

module.exports = cors(corsOptions);
