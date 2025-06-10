/**
 * 🌐 CONFIGURACIÓN CORS - Sistema Portafolio Docente UNSAAC
 * 
 * Configuración de Cross-Origin Resource Sharing para permitir
 * peticiones desde el frontend y otros dominios autorizados
 * 
 * @author Sistema Portafolio Docente UNSAAC
 * @version 1.0.0
 */

// ==========================================
// 📦 CONFIGURACIÓN CORS
// ==========================================

const corsConfig = {
   // Orígenes permitidos
   origin: function (origin, callback) {
       // Lista de dominios permitidos
       const allowedOrigins = [
           'http://localhost:3000',      // Backend
           'http://localhost:3001',      // Frontend desarrollo
           'http://localhost:5000',      // Frontend alternativo
           'http://127.0.0.1:3000',     // Localhost IP
           'http://127.0.0.1:3001',     // Frontend IP
           'http://127.0.0.1:5500',     // Live Server
           'http://127.0.0.1:8080',     // Servidor local
           'https://unsaac.edu.pe',     // Dominio oficial UNSAAC
           'https://www.unsaac.edu.pe', // WWW UNSAAC
       ];

       // En desarrollo, permitir todas las conexiones
       if (process.env.NODE_ENV === 'development') {
           // Permitir peticiones sin origin (Postman, apps móviles, etc.)
           if (!origin) return callback(null, true);
           
           // Permitir localhost en cualquier puerto
           if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
               return callback(null, true);
           }
       }

       // Verificar si el origin está en la lista permitida
       if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
           callback(null, true);
       } else {
           console.warn(`🚫 CORS bloqueó petición desde origen no permitido: ${origin}`);
           callback(new Error('No permitido por política CORS'));
       }
   },

   // Métodos HTTP permitidos
   methods: [
       'GET',
       'POST', 
       'PUT',
       'PATCH',
       'DELETE',
       'OPTIONS',
       'HEAD'
   ],

   // Headers permitidos
   allowedHeaders: [
       'Origin',
       'X-Requested-With',
       'Content-Type',
       'Accept',
       'Authorization',
       'Cache-Control',
       'X-Access-Token',
       'X-Key',
       'X-CSRF-Token',
       'X-Forwarded-For',
       'X-Real-IP',
       'User-Agent',
       'Keep-Alive',
       'Host',
       'Accept-Language',
       'Connection',
       'Cookie',
       'DNT'
   ],

   // Headers expuestos al cliente
   exposedHeaders: [
       'X-Total-Count',
       'X-Page-Count',
       'X-Current-Page',
       'X-Rate-Limit-Limit',
       'X-Rate-Limit-Remaining',
       'X-Rate-Limit-Reset',
       'Content-Disposition',
       'X-File-Name',
       'X-File-Size'
   ],

   // Permitir cookies y credenciales
   credentials: true,

   // Cache de preflight requests (24 horas)
   maxAge: 86400,

   // No manejar OPTIONS automáticamente
   preflightContinue: false,

   // Responder a OPTIONS exitosamente
   optionsSuccessStatus: 200
};

// ==========================================
// 🔧 CONFIGURACIÓN POR ENTORNO
// ==========================================

// Configuración específica para producción
if (process.env.NODE_ENV === 'production') {
   corsConfig.origin = function (origin, callback) {
       const productionOrigins = [
           'https://unsaac.edu.pe',
           'https://www.unsaac.edu.pe',
           'https://portafolio.unsaac.edu.pe',
           'https://academico.unsaac.edu.pe'
       ];

       if (productionOrigins.indexOf(origin) !== -1 || !origin) {
           callback(null, true);
       } else {
           console.error(`🚫 [PRODUCCIÓN] CORS bloqueó: ${origin}`);
           callback(new Error('No permitido por política CORS en producción'));
       }
   };
}

// ==========================================
// 🛡️ VALIDACIÓN DE CONFIGURACIÓN
// ==========================================

function validarConfiguracionCORS() {
   try {
       console.log('🔍 Validando configuración CORS...');
       
       if (!corsConfig.methods || corsConfig.methods.length === 0) {
           throw new Error('Métodos HTTP no definidos');
       }
       
       if (!corsConfig.allowedHeaders || corsConfig.allowedHeaders.length === 0) {
           throw new Error('Headers permitidos no definidos');
       }
       
       console.log('✅ Configuración CORS válida');
       console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
       console.log(`🔧 Métodos permitidos: ${corsConfig.methods.join(', ')}`);
       console.log(`🍪 Credenciales habilitadas: ${corsConfig.credentials}`);
       
       return true;
       
   } catch (error) {
       console.error('❌ Error en configuración CORS:', error.message);
       return false;
   }
}

// ==========================================
// 📊 FUNCIÓN DE DIAGNÓSTICO
// ==========================================

function diagnosticoCORS(req) {
   return {
       origin: req.get('Origin') || 'Sin origin',
       method: req.method,
       headers: {
           authorization: req.get('Authorization') ? 'Presente' : 'Ausente',
           content_type: req.get('Content-Type') || 'No especificado',
           user_agent: req.get('User-Agent') || 'No especificado'
       },
       allowed: true,
       timestamp: new Date().toISOString()
   };
}

// ==========================================
// 📤 EXPORTAR CONFIGURACIÓN
// ==========================================

module.exports = corsConfig;

// Exportar funciones adicionales si es necesario
module.exports.validarConfiguracionCORS = validarConfiguracionCORS;
module.exports.diagnosticoCORS = diagnosticoCORS;

// ==========================================
// ✅ VALIDAR AL IMPORTAR
// ==========================================

// Validar configuración al cargar el módulo
if (!validarConfiguracionCORS()) {
   console.error('❌ Configuración CORS inválida');
   process.exit(1);
}

/**
* 📋 CONFIGURACIÓN CORS EXPLICADA:
* 
* 🌐 Origins:
*   • Desarrollo: Permite localhost en cualquier puerto
*   • Producción: Solo dominios oficiales UNSAAC
* 
* 🔧 Métodos:
*   • GET, POST, PUT, PATCH, DELETE para API REST completa
*   • OPTIONS para preflight requests
*   • HEAD para verificaciones
* 
* 📋 Headers:
*   • Authorization para JWT
*   • Content-Type para JSON/FormData
*   • Headers personalizados para el sistema
* 
* 🍪 Credenciales:
*   • Habilitadas para permitir cookies y auth headers
*   • Necesario para autenticación basada en sesiones
* 
* ⏱️ Cache:
*   • 24 horas para preflight requests
*   • Mejora performance en producción
* 
* 🛡️ Seguridad:
*   • Logs de intentos bloqueados
*   • Configuración estricta en producción
*   • Validación de configuración al inicio
*/