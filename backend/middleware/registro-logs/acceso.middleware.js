/**
 * 📝 MIDDLEWARE DE LOGS DE ACCESO
 * 
 * Registra accesos al sistema:
 * - Logs de todas las requests HTTP
 * - IP, user agent, timestamp
 * - Tiempo de respuesta
 * - Códigos de estado
 * - Rotación automática de logs
 * 
 * Uso: Auditoría y monitoreo de accesos
 */

// TODO: Format personalizado de logs
// TODO: Rotación automática diaria/semanal
// TODO: Compresión de logs antiguos
// TODO: Filtrado de rutas sensibles
// TODO: Integración con sistemas de monitoreo

// ==========================================
// 📊 ACCESS MIDDLEWARE - acceso.middleware.js
// ==========================================

/**
 * 📊 MIDDLEWARE DE LOGGING DE ACCESO - Sistema Portafolio Docente UNSAAC
 * Registra todos los accesos al sistema
 */

const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Crear directorio de logs si no existe
const logsDir = path.join(process.cwd(), 'logs', 'acceso');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Stream para escribir logs de acceso
const accessLogStream = fs.createWriteStream(
    path.join(logsDir, `access-${new Date().toISOString().split('T')[0]}.log`),
    { flags: 'a' }
);

// Formato personalizado de log
morgan.token('usuario', (req) => {
    return req.usuario ? req.usuario.correo : 'No autenticado';
});

morgan.token('timestamp', () => {
    return new Date().toISOString();
});

const formatoLog = ':timestamp :remote-addr ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :usuario :response-time ms';

// Middleware de logging
const accesoMiddleware = morgan(formatoLog, { 
    stream: accessLogStream,
    skip: (req, res) => {
        // No logear health checks en producción
        return process.env.NODE_ENV === 'production' && req.url === '/health';
    }
});

// También log en consola en desarrollo
if (process.env.NODE_ENV === 'development') {
    const consoleMorgan = morgan('🌐 :method :url :status :response-time ms - :usuario');
    
    module.exports = [accesoMiddleware, consoleMorgan];
} else {
    module.exports = accesoMiddleware;
}