/**
 * 🔧 CONFIGURADOR DE SERVIDOR - Sistema Portafolio Docente UNSAAC
 * 
 * Solo configura el servidor Express sin rutas:
 * - Configuración de middleware básico
 * - Conexión a base de datos
 * - Monitoreo del sistema
 * - Archivos estáticos
 * - Graceful shutdown
 * 
 * NO maneja rutas API (eso es responsabilidad de index.js)
 * 
 * @author Sistema Portafolio Docente UNSAAC
 * @version 1.0.0
 */

// ==========================================
// 📦 IMPORTACIONES BÁSICAS
// ==========================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const fs = require('fs');
const path = require('path');

// Importar pool de conexiones
const poolConexion = require('./base_datos/conexiones/pool.conexion');

// Importar middlewares
const middlewareErrores = require('./middleware/registro-logs/errores.middleware');
const middlewareAcceso = require('./middleware/registro-logs/acceso.middleware');
const middlewareAuditoria = require('./middleware/registro-logs/auditoria.middleware');

// Importar configuraciones
const corsConfig = require('./configuracion/autenticacion/cors.config');
const helmetConfig = require('./configuracion/seguridad/helmet.config');
const limitadorConfig = require('./configuracion/seguridad/limitador.config');

// ==========================================
// 🌍 CONFIGURACIÓN DEL SISTEMA
// ==========================================

const CONFIG = {
    // Servidor
    PORT: process.env.PORT || 3000,
    HOST: process.env.HOST || 'localhost',
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // Base de datos
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || 3306,
    DB_NAME: process.env.DB_NAME || 'portafolio_docente_carga_academica',
    DB_USER: process.env.DB_USER || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    
    // Sistema
    SYSTEM_NAME: process.env.SYSTEM_NAME || 'Sistema Portafolio Docente UNSAAC',
    API_VERSION: process.env.API_VERSION || '1.0.0',
    TIMEZONE: process.env.TIMEZONE || 'America/Lima',
    
    // Directorios
    UPLOAD_PATH: process.env.UPLOAD_PATH || './subidas',
    LOGS_PATH: process.env.LOGS_PATH || './logs',
    TEMPLATES_PATH: process.env.TEMPLATES_PATH || './plantillas',
    
    // Seguridad
    JWT_SECRET: process.env.JWT_SECRET || 'your_super_secret_jwt_key_here',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '2h',
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    
    // Archivos
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    ALLOWED_FORMATS: process.env.ALLOWED_FORMATS || 'pdf,docx,xlsx,pptx,txt,jpg,png'
};

// ==========================================
// 📁 CREAR DIRECTORIOS NECESARIOS
// ==========================================

function crearDirectoriosNecesarios() {
    const directorios = [
        CONFIG.UPLOAD_PATH,
        CONFIG.LOGS_PATH,
        CONFIG.TEMPLATES_PATH,
        path.join(CONFIG.UPLOAD_PATH, 'documentos'),
        path.join(CONFIG.UPLOAD_PATH, 'excel'),
        path.join(CONFIG.UPLOAD_PATH, 'temp'),
        path.join(CONFIG.UPLOAD_PATH, 'avatares'),
        path.join(CONFIG.LOGS_PATH, 'aplicacion'),
        path.join(CONFIG.LOGS_PATH, 'errores'),
        path.join(CONFIG.LOGS_PATH, 'acceso'),
        path.join(CONFIG.LOGS_PATH, 'auditoria'),
        path.join(CONFIG.TEMPLATES_PATH, 'email'),
        path.join(CONFIG.TEMPLATES_PATH, 'pdf'),
        path.join(CONFIG.TEMPLATES_PATH, 'excel'),
        './documentacion'
    ];

    directorios.forEach(directorio => {
        if (!fs.existsSync(directorio)) {
            fs.mkdirSync(directorio, { recursive: true });
            console.log(`📁 Directorio creado: ${directorio}`);
        }
    });
}

// ==========================================
// 🗄️ VERIFICAR CONEXIÓN BASE DE DATOS
// ==========================================

async function verificarBaseDatos() {
    try {
        console.log('🔍 Verificando conexión a base de datos...');
        
        const saludPool = await poolConexion.verificarSalud();
        
        if (saludPool.estado === 'error') {
            throw new Error(saludPool.mensaje);
        }
        
        console.log('✅ Conexión a base de datos exitosa');
        console.log(`📊 Servidor BD: ${CONFIG.DB_HOST}:${CONFIG.DB_PORT}`);
        console.log(`🗃️  Base de datos: ${CONFIG.DB_NAME}`);
        
        return true;
        
    } catch (error) {
        console.error('❌ Error al conectar con base de datos:', error.message);
        console.error('🔧 Verifica la configuración en el archivo .env');
        console.error('💡 Asegúrate de que MySQL esté ejecutándose');
        return false;
    }
}

// ==========================================
// 🏗️ CONFIGURAR SERVIDOR EXPRESS (SIN RUTAS)
// ==========================================

function configurarServidor() {
    const app = express();

    // ==========================================
    // 🛡️ CONFIGURACIÓN DE SEGURIDAD
    // ==========================================

    app.use(helmet(helmetConfig));
    app.use(cors(corsConfig));
    app.use(compression());
    app.use(limitadorConfig.limitadorGeneral);

    // ==========================================
    // 📊 LOGGING Y PARSING
    // ==========================================

    app.use(morgan('combined', {
        stream: middlewareAcceso.stream,
        skip: (req) => req.url === '/health'
    }));

    app.use(express.json({ 
        limit: '50mb',
        verify: (req, res, buf) => {
            req.rawBody = buf;
        }
    }));
    app.use(express.urlencoded({ 
        extended: true, 
        limit: '50mb' 
    }));

    app.use(middlewareAcceso.registrarAcceso);
    app.use(middlewareAuditoria.prepararAuditoria);

    // ==========================================
    // 📁 ARCHIVOS ESTÁTICOS
    // ==========================================

    app.use('/uploads', express.static(path.join(__dirname, 'subidas'), {
        maxAge: '1d',
        etag: false
    }));
    app.use('/plantillas', express.static(path.join(__dirname, 'plantillas')));
    app.use('/docs', express.static(path.join(__dirname, 'documentacion')));

    // ==========================================
    // 📊 RUTAS BÁSICAS DE MONITOREO
    // ==========================================

    /**
     * 🏥 Health Check
     */
    app.get('/health', async (req, res) => {
        try {
            const saludPool = await poolConexion.verificarSalud();
            
            res.json({
                status: saludPool.estado === 'saludable' ? 'OK' : 'WARNING',
                service: CONFIG.SYSTEM_NAME,
                version: CONFIG.API_VERSION,
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: CONFIG.NODE_ENV,
                database: {
                    status: saludPool.estado,
                    message: saludPool.mensaje
                },
                memory: {
                    rss_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
                    heap_used_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
                }
            });
        } catch (error) {
            res.status(503).json({
                status: 'ERROR',
                service: CONFIG.SYSTEM_NAME,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    /**
     * 🧪 Test de base de datos
     */
    app.get('/test-db', async (req, res) => {
        try {
            const prueba = await poolConexion.probarConexion();
            const estadisticas = poolConexion.obtenerEstadisticas();
            
            res.json({
                success: true,
                message: 'Conexión a base de datos exitosa',
                prueba,
                estadisticas,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(503).json({
                success: false,
                message: 'Error al conectar con base de datos',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    /**
     * 📈 Métricas del sistema
     */
    app.get('/metrics', async (req, res) => {
        try {
            const memoria = process.memoryUsage();
            const uptime = process.uptime();
            const estadisticasDB = poolConexion.obtenerEstadisticas();
            
            res.json({
                sistema: {
                    nombre: CONFIG.SYSTEM_NAME,
                    version: CONFIG.API_VERSION,
                    entorno: CONFIG.NODE_ENV,
                    uptime_segundos: Math.floor(uptime),
                    uptime_legible: formatearTiempo(uptime),
                    timezone: CONFIG.TIMEZONE
                },
                memoria: {
                    rss_mb: Math.round(memoria.rss / 1024 / 1024),
                    heap_total_mb: Math.round(memoria.heapTotal / 1024 / 1024),
                    heap_usado_mb: Math.round(memoria.heapUsed / 1024 / 1024),
                    heap_porcentaje: Math.round((memoria.heapUsed / memoria.heapTotal) * 100),
                    external_mb: Math.round(memoria.external / 1024 / 1024)
                },
                proceso: {
                    pid: process.pid,
                    ppid: process.ppid,
                    node_version: process.version,
                    plataforma: process.platform,
                    arquitectura: process.arch
                },
                base_datos: estadisticasDB,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                error: 'Error al obtener métricas',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    /**
     * 🗄️ Estado de base de datos
     */
    app.get('/db-status', async (req, res) => {
        try {
            const saludPool = await poolConexion.verificarSalud();
            const estadisticas = poolConexion.obtenerEstadisticas();
            
            res.json({
                ...saludPool,
                estadisticas_detalladas: estadisticas,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            res.status(503).json({
                status: 'error',
                message: 'Error al obtener estado de base de datos',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    /**
     * 📋 Información del sistema
     */
    app.get('/system-info', (req, res) => {
        const memoria = process.memoryUsage();
        const os = require('os');
        
        res.json({
            sistema: {
                nombre: CONFIG.SYSTEM_NAME,
                version: CONFIG.API_VERSION,
                entorno: CONFIG.NODE_ENV,
                timezone: CONFIG.TIMEZONE,
                uptime: {
                    segundos: Math.floor(process.uptime()),
                    legible: formatearTiempo(process.uptime())
                }
            },
            servidor: {
                host: CONFIG.HOST,
                puerto: CONFIG.PORT,
                url: `http://${CONFIG.HOST}:${CONFIG.PORT}`
            },
            proceso: {
                pid: process.pid,
                node_version: process.version,
                plataforma: process.platform,
                arquitectura: process.arch,
                memoria: {
                    rss_mb: Math.round(memoria.rss / 1024 / 1024),
                    heap_total_mb: Math.round(memoria.heapTotal / 1024 / 1024),
                    heap_usado_mb: Math.round(memoria.heapUsed / 1024 / 1024)
                }
            },
            sistema_operativo: {
                hostname: os.hostname(),
                tipo: os.type(),
                release: os.release(),
                memoria_total_gb: Math.round(os.totalmem() / 1024 / 1024 / 1024),
                memoria_libre_gb: Math.round(os.freemem() / 1024 / 1024 / 1024),
                cpus: os.cpus().length
            },
            configuracion: {
                upload_path: CONFIG.UPLOAD_PATH,
                logs_path: CONFIG.LOGS_PATH,
                templates_path: CONFIG.TEMPLATES_PATH,
                max_file_size_mb: Math.round(CONFIG.MAX_FILE_SIZE / 1024 / 1024),
                allowed_formats: CONFIG.ALLOWED_FORMATS.split(',')
            },
            timestamp: new Date().toISOString()
        });
    });

    /**
     * 🔄 Limpiar pool de conexiones
     */
    app.post('/admin/clean-pool', async (req, res) => {
        try {
            const resultado = await poolConexion.limpiarConexiones();
            
            res.json({
                success: true,
                message: 'Pool de conexiones limpiado',
                resultado,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al limpiar pool',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    // Endpoint de desarrollo
    if (CONFIG.NODE_ENV === 'development') {
        app.post('/dev/restart-db-pool', async (req, res) => {
            try {
                await poolConexion.cerrarPool();
                await poolConexion.obtenerPool();
                
                res.json({
                    success: true,
                    message: 'Pool de conexiones reiniciado',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Error al reiniciar pool',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    // Middleware de manejo de errores (debe ir al final)
    app.use(middlewareErrores);

    return app;
}

// ==========================================
// 🔄 GRACEFUL SHUTDOWN
// ==========================================

function configurarGracefulShutdown(servidor) {
    
    async function shutdown(signal) {
        console.log(`\n🛑 Recibida señal ${signal}, iniciando shutdown graceful...`);
        
        servidor.close(async () => {
            console.log('✅ Servidor HTTP cerrado');
            
            try {
                await poolConexion.cerrarPool();
                console.log('✅ Pool de conexiones cerrado');
                console.log('✅ Shutdown graceful completado');
                process.exit(0);
                
            } catch (error) {
                console.error('❌ Error durante shutdown:', error);
                process.exit(1);
            }
        });
        
        setTimeout(() => {
            console.error('⚠️  Shutdown forzado por timeout');
            process.exit(1);
        }, 15000);
    }
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    process.on('uncaughtException', (error) => {
        console.error('❌ Excepción no capturada:', error);
        shutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ Promise rechazada no manejada:', reason);
        shutdown('unhandledRejection');
    });
}

// ==========================================
// 🔧 FUNCIONES AUXILIARES
// ==========================================

function formatearTiempo(segundos) {
    const dias = Math.floor(segundos / 86400);
    const horas = Math.floor((segundos % 86400) / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = Math.floor(segundos % 60);
    
    if (dias > 0) {
        return `${dias}d ${horas}h ${minutos}m ${segs}s`;
    } else if (horas > 0) {
        return `${horas}h ${minutos}m ${segs}s`;
    } else if (minutos > 0) {
        return `${minutos}m ${segs}s`;
    } else {
        return `${segs}s`;
    }
}

function validarVariablesEntorno() {
    const requeridas = [
        'DB_HOST', 
        'DB_NAME', 
        'DB_USER', 
        'JWT_SECRET'
    ];
    
    const faltantes = requeridas.filter(variable => !process.env[variable]);
    
    if (faltantes.length > 0) {
        console.error('❌ Variables de entorno faltantes:', faltantes);
        console.error('💡 Crea un archivo .env con las variables necesarias');
        return false;
    }
    
    if (process.env.JWT_SECRET === 'your_super_secret_jwt_key_here') {
        console.warn('⚠️  ADVERTENCIA: Cambia JWT_SECRET en producción');
    }
    
    return true;
}

function mostrarInformacionSistema() {
    const memoria = process.memoryUsage();
    const os = require('os');
    
    console.log(`
🚀 ========================================
   ${CONFIG.SYSTEM_NAME}
========================================
📋 Información del Sistema:
   • Versión: ${CONFIG.API_VERSION}
   • Entorno: ${CONFIG.NODE_ENV}
   • Node.js: ${process.version}
   • Plataforma: ${process.platform} ${process.arch}
   • PID: ${process.pid}
   • Zona horaria: ${CONFIG.TIMEZONE}

🌐 Configuración del Servidor:
   • Host: ${CONFIG.HOST}
   • Puerto: ${CONFIG.PORT}
   • URL: http://${CONFIG.HOST}:${CONFIG.PORT}

🗄️ Base de Datos:
   • Host: ${CONFIG.DB_HOST}:${CONFIG.DB_PORT}
   • Base de datos: ${CONFIG.DB_NAME}
   • Usuario: ${CONFIG.DB_USER}

💾 Memoria:
   • RSS: ${Math.round(memoria.rss / 1024 / 1024)} MB
   • Heap Total: ${Math.round(memoria.heapTotal / 1024 / 1024)} MB
   • Heap Usado: ${Math.round(memoria.heapUsed / 1024 / 1024)} MB

🔐 Seguridad:
   • JWT configurado: ✅
   • CORS habilitado: ✅
   • Rate limiting: ✅
   • Helmet headers: ✅

⏰ Iniciado: ${new Date().toLocaleString('es-PE', { timeZone: CONFIG.TIMEZONE })}
========================================
    `);
}

// ==========================================
// 🚀 FUNCIÓN PRINCIPAL DE INICIALIZACIÓN
// ==========================================

async function inicializarServidor() {
    try {
        console.log('🔧 Inicializando configuración del servidor...');
        
        // 1. Validar variables de entorno
        if (!validarVariablesEntorno()) {
            process.exit(1);
        }
        
        // 2. Crear directorios necesarios
        crearDirectoriosNecesarios();
        
        // 3. Verificar conexión a base de datos
        const dbConectada = await verificarBaseDatos();
        if (!dbConectada) {
            console.error('❌ No se pudo conectar a la base de datos');
            process.exit(1);
        }
        
        // 4. Configurar servidor Express (sin rutas)
        const app = configurarServidor();
        
        console.log('✅ Servidor configurado exitosamente');
        console.log('📄 Listo para recibir configuración de rutas desde index.js');
        
        return app;
        
    } catch (error) {
        console.error('❌ Error al inicializar servidor:', error);
        throw error;
    }
}

async function iniciarServidor(app) {
    try {
        const servidor = app.listen(CONFIG.PORT, CONFIG.HOST, () => {
            mostrarInformacionSistema();
            
            console.log('🔗 URLs de Monitoreo:');
            console.log(`   • Health Check: http://${CONFIG.HOST}:${CONFIG.PORT}/health`);
            console.log(`   • Test BD: http://${CONFIG.HOST}:${CONFIG.PORT}/test-db`);
            console.log(`   • Métricas: http://${CONFIG.HOST}:${CONFIG.PORT}/metrics`);
            console.log(`   • Estado BD: http://${CONFIG.HOST}:${CONFIG.PORT}/db-status`);
            console.log(`   • Info Sistema: http://${CONFIG.HOST}:${CONFIG.PORT}/system-info`);
            
            if (CONFIG.NODE_ENV === 'development') {
                console.log(`   • Reiniciar BD: POST http://${CONFIG.HOST}:${CONFIG.PORT}/dev/restart-db-pool`);
            }
            
            console.log('\n✅ Servidor iniciado correctamente');
            
            if (CONFIG.NODE_ENV === 'development') {
                console.log('🔧 Modo desarrollo activo');
                console.log('💡 Usa Ctrl+C para detener el servidor');
            } else {
                console.log('🛡️  Modo producción activo');
            }
            
            console.log('\n========================================\n');
        });
        
        // Configurar shutdown graceful
        configurarGracefulShutdown(servidor);
        
        // Configuraciones del servidor
        servidor.timeout = 120000;
        servidor.keepAliveTimeout = 65000;
        servidor.headersTimeout = 66000;
        
        return servidor;
        
    } catch (error) {
        console.error('❌ Error al iniciar servidor:', error);
        throw error;
    }
}

// ==========================================
// 📤 EXPORTAR FUNCIONES
// ==========================================

module.exports = {
    inicializarServidor,
    iniciarServidor,
    CONFIG,
    verificarBaseDatos,
    formatearTiempo
};