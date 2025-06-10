/**
 * ⚙️ CONFIGURACIÓN MYSQL - Sistema Portafolio Docente UNSAAC
 * 
 * Configuración principal para la conexión a la base de datos MySQL
 * incluyendo configuraciones de pool, timeouts y opciones de seguridad.
 * 
 * @author Sistema Portafolio Docente UNSAAC
 * @version 1.0.0
 */

require('dotenv').config();

/**
 * 🔧 Configuración principal de MySQL
 */
const configuracionMySQL = {
    // 🏠 Configuración de conexión
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'portafolio_docente_carga_academica',

    // 🔐 Configuraciones de seguridad
    ssl: {
        rejectUnauthorized: false
    },
    
    // ⏱️ Configuraciones de tiempo
    connectTimeout: 60000,          // 60 segundos para conectar
    acquireTimeout: 60000,          // 60 segundos para adquirir conexión
    timeout: 60000,                 // 60 segundos timeout general
    
    // 🔄 Configuraciones de reconexión
    reconnect: true,
    reconnectDelay: 2000,           // 2 segundos entre reintentos
    
    // 📝 Configuraciones de charset
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
    
    // 🔧 Configuraciones adicionales
    multipleStatements: false,      // Prevenir inyección SQL
    dateStrings: false,             // Manejar fechas como objetos Date
    debug: false,                   // Deshabilitar debug en producción
    trace: true,                    // Habilitar trazas para debugging
    
    // 🛡️ Configuraciones de seguridad adicionales
    flags: [
        'PROTOCOL_41',
        'TRANSACTIONS',
        'SECURE_CONNECTION'
    ]
};

/**
 * 🏊 Configuración del Pool de Conexiones
 */
const configuracionPool = {
    // Heredar configuración base
    ...configuracionMySQL,
    
    // 🔢 Configuraciones específicas del pool
    connectionLimit: 10,            // Máximo 10 conexiones simultáneas
    acquireTimeout: 60000,          // 60 segundos para obtener conexión
    timeout: 60000,                 // 60 segundos timeout de consulta
    
    // 🔄 Gestión de conexiones
    reconnect: true,
    reconnectDelay: 2000,
    
    // 🧹 Limpieza de conexiones
    removeNodeErrorCount: 5,        // Remover nodo después de 5 errores
    restoreNodeTimeout: 30000,      // 30 segundos para restaurar nodo
    
    // 📊 Eventos del pool
    handleDisconnects: true,
    
    // 🔧 Configuraciones avanzadas
    idleTimeout: 300000,            // 5 minutos de inactividad
    maxRetriesPerRequest: 3         // 3 reintentos por consulta
};

/**
 * 🧪 Configuración para Testing
 */
const configuracionTesting = {
    ...configuracionMySQL,
    database: process.env.DB_NAME_TEST || 'portafolio_docente_test',
    connectionLimit: 5,
    acquireTimeout: 30000,
    timeout: 30000
};

/**
 * 🚀 Configuración para Producción
 */
const configuracionProduccion = {
    ...configuracionPool,
    
    // 🔢 Pool más grande para producción
    connectionLimit: 20,
    
    // ⏱️ Timeouts más largos
    acquireTimeout: 120000,
    timeout: 120000,
    
    // 🔐 Seguridad reforzada
    ssl: {
        rejectUnauthorized: true,
        ca: process.env.DB_SSL_CA,
        cert: process.env.DB_SSL_CERT,
        key: process.env.DB_SSL_KEY
    },
    
    // 📝 Logging reducido
    debug: false,
    trace: false
};

/**
 * 🔧 Función para obtener configuración según entorno
 */
function obtenerConfiguracion() {
    const entorno = process.env.NODE_ENV || 'development';
    
    switch (entorno) {
        case 'production':
            console.log('🚀 Usando configuración de PRODUCCIÓN');
            return configuracionProduccion;
            
        case 'test':
            console.log('🧪 Usando configuración de TESTING');
            return configuracionTesting;
            
        case 'development':
        default:
            console.log('🔧 Usando configuración de DESARROLLO');
            return configuracionPool;
    }
}

/**
 * 📋 Configuraciones de consultas predeterminadas
 */
const configuracionConsultas = {
    // ⏱️ Timeouts por tipo de consulta
    timeouts: {
        select: 30000,      // 30 segundos para SELECT
        insert: 60000,      // 60 segundos para INSERT
        update: 60000,      // 60 segundos para UPDATE
        delete: 30000,      // 30 segundos para DELETE
        transaction: 120000 // 2 minutos para transacciones
    },
    
    // 🔢 Límites de resultados
    limites: {
        defaultLimit: 100,          // Límite por defecto
        maxLimit: 1000,            // Límite máximo
        exportLimit: 10000         // Límite para exportaciones
    },
    
    // 📊 Configuraciones de paginación
    paginacion: {
        defaultPage: 1,
        defaultSize: 20,
        maxSize: 100
    }
};

/**
 * 🔍 Configuración de logs de base de datos
 */
const configuracionLogs = {
    // 📝 Tipos de logs a registrar
    registrar: {
        consultas: process.env.NODE_ENV !== 'production',
        errores: true,
        conexiones: true,
        transacciones: true
    },
    
    // ⏱️ Umbral para consultas lentas (ms)
    consultaLentaUmbral: 5000,
    
    // 📍 Ubicación de archivos de log
    archivos: {
        consultas: './logs/database-queries.log',
        errores: './logs/database-errors.log',
        conexiones: './logs/database-connections.log'
    }
};

/**
 * 🛡️ Configuración de seguridad avanzada
 */
const configuracionSeguridad = {
    // 🔐 Encriptación de conexión
    encriptacion: {
        habilitada: process.env.NODE_ENV === 'production',
        algoritmo: 'AES-256-CBC'
    },
    
    // 🚫 Prevención de inyección SQL
    prevencionSQL: {
        escaparParametros: true,
        validarConsultas: true,
        bloquearConsultasMultiples: true
    },
    
    // 🔒 Validación de permisos
    validacionPermisos: {
        verificarUsuario: true,
        verificarBaseDatos: true,
        verificarTablas: true
    }
};

/**
 * 📤 Exportaciones
 */
module.exports = {
    // Configuraciones principales
    configuracionMySQL,
    configuracionPool,
    configuracionTesting,
    configuracionProduccion,
    
    // Función principal
    obtenerConfiguracion,
    
    // Configuraciones adicionales
    configuracionConsultas,
    configuracionLogs,
    configuracionSeguridad,
    
    // 🔧 Configuración activa basada en entorno
    configuracionActiva: obtenerConfiguracion()
};