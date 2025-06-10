/**
 * 📁 CONFIGURACIÓN MULTER - Sistema Portafolio Docente UNSAAC
 * 
 * Configuración para la subida de archivos usando Multer.
 * Incluye validación de tipos, tamaños y configuración por entorno.
 * 
 * @author Sistema Portafolio Docente UNSAAC
 * @version 1.0.0
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

/**
 * 🔧 Configuración principal de Multer
 */
const configuracionMulter = {
    // 📏 Límites de archivos
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB por defecto
        files: parseInt(process.env.MAX_FILES_PER_REQUEST) || 5,   // 5 archivos máximo
        fieldSize: 1024 * 1024, // 1MB para campos de texto
        fields: 20              // Máximo 20 campos
    },
    
    // 📂 Configuración de almacenamiento
    uploadPath: process.env.UPLOAD_PATH || './subidas',
    
    // 📋 Extensiones permitidas
    allowedExtensions: (process.env.ALLOWED_EXTENSIONS || 'pdf,doc,docx,xls,xlsx').split(','),
    
    // 🔒 Tipos MIME permitidos
    allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif'
    ]
};

/**
 * 🗂️ Configuración de almacenamiento
 */
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        try {
            // Crear estructura de carpetas por fecha y usuario
            const fechaActual = new Date();
            const anio = fechaActual.getFullYear();
            const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
            const dia = String(fechaActual.getDate()).padStart(2, '0');
            
            const usuarioId = req.user?.id || 'anonimo';
            const tipoDocumento = req.body?.tipo_documento || 'general';
            
            const rutaDestino = path.join(
                configuracionMulter.uploadPath,
                String(anio),
                mes,
                dia,
                `usuario_${usuarioId}`,
                tipoDocumento
            );
            
            // Crear directorio si no existe
            fs.mkdirSync(rutaDestino, { recursive: true });
            
            // Log en desarrollo
            if (process.env.NODE_ENV === 'development') {
                console.log(`📁 Guardando en: ${rutaDestino}`);
            }
            
            cb(null, rutaDestino);
            
        } catch (error) {
            console.error('❌ Error al crear directorio de destino:', error);
            cb(error);
        }
    },
    
    filename: function (req, file, cb) {
        try {
            // Generar nombre único para el archivo
            const extension = path.extname(file.originalname).toLowerCase();
            const nombreBase = path.basename(file.originalname, extension);
            const timestamp = Date.now();
            const hash = crypto.randomBytes(6).toString('hex');
            
            // Limpiar nombre del archivo
            const nombreLimpio = nombreBase
                .replace(/[^a-zA-Z0-9_-]/g, '_')
                .substring(0, 50); // Limitar longitud
            
            const nombreFinal = `${nombreLimpio}_${timestamp}_${hash}${extension}`;
            
            // Guardar información del archivo en el request
            req.archivoInfo = {
                nombreOriginal: file.originalname,
                nombreGuardado: nombreFinal,
                extension: extension,
                timestamp: timestamp
            };
            
            cb(null, nombreFinal);
            
        } catch (error) {
            console.error('❌ Error al generar nombre de archivo:', error);
            cb(error);
        }
    }
});

/**
 * 🔍 Filtro de archivos para validación
 */
const fileFilter = function (req, file, cb) {
    try {
        // Validar extensión
        const extension = path.extname(file.originalname).toLowerCase().substring(1);
        const esExtensionValida = configuracionMulter.allowedExtensions.includes(extension);
        
        // Validar tipo MIME
        const esTipoMimeValido = configuracionMulter.allowedMimeTypes.includes(file.mimetype);
        
        if (!esExtensionValida) {
            const error = new Error(`Extensión no permitida: ${extension}`);
            error.code = 'INVALID_EXTENSION';
            error.field = file.fieldname;
            return cb(error, false);
        }
        
        if (!esTipoMimeValido) {
            const error = new Error(`Tipo MIME no permitido: ${file.mimetype}`);
            error.code = 'INVALID_MIME_TYPE';
            error.field = file.fieldname;
            return cb(error, false);
        }
        
        // Validar nombre del archivo
        if (file.originalname.length > 255) {
            const error = new Error('Nombre de archivo demasiado largo');
            error.code = 'FILENAME_TOO_LONG';
            error.field = file.fieldname;
            return cb(error, false);
        }
        
        // Log en desarrollo
        if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Archivo válido: ${file.originalname} (${file.mimetype})`);
        }
        
        cb(null, true);
        
    } catch (error) {
        console.error('❌ Error en filtro de archivos:', error);
        cb(error, false);
    }
};

/**
 * 🚀 Configuración para diferentes tipos de subida
 */
const configuracionesPorTipo = {
    // Documentos generales
    documentos: multer({
        storage: storage,
        fileFilter: fileFilter,
        limits: configuracionMulter.limits
    }),
    
    // Documentos del portafolio (más estricto)
    portafolio: multer({
        storage: storage,
        fileFilter: (req, file, cb) => {
            // Solo PDFs y documentos de Office para portafolios
            const extensionesPortafolio = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
            const extension = path.extname(file.originalname).toLowerCase().substring(1);
            
            if (!extensionesPortafolio.includes(extension)) {
                const error = new Error('Solo se permiten documentos PDF y Office para portafolios');
                error.code = 'INVALID_PORTFOLIO_FILE';
                return cb(error, false);
            }
            
            return fileFilter(req, file, cb);
        },
        limits: {
            ...configuracionMulter.limits,
            fileSize: 15 * 1024 * 1024 // 15MB para documentos de portafolio
        }
    }),
    
    // Imágenes de perfil
    avatares: multer({
        storage: multer.diskStorage({
            destination: function (req, file, cb) {
                const rutaAvatares = path.join(configuracionMulter.uploadPath, 'avatares');
                fs.mkdirSync(rutaAvatares, { recursive: true });
                cb(null, rutaAvatares);
            },
            filename: function (req, file, cb) {
                const extension = path.extname(file.originalname).toLowerCase();
                const nombreAvatar = `avatar_${req.user.id}_${Date.now()}${extension}`;
                cb(null, nombreAvatar);
            }
        }),
        fileFilter: (req, file, cb) => {
            // Solo imágenes para avatares
            const tiposImagenPermitidos = ['image/jpeg', 'image/png', 'image/gif'];
            
            if (!tiposImagenPermitidos.includes(file.mimetype)) {
                const error = new Error('Solo se permiten imágenes JPEG, PNG o GIF para avatares');
                error.code = 'INVALID_AVATAR_TYPE';
                return cb(error, false);
            }
            
            cb(null, true);
        },
        limits: {
            fileSize: 2 * 1024 * 1024, // 2MB para avatares
            files: 1
        }
    }),
    
    // Carga masiva Excel
    excel: multer({
        storage: multer.diskStorage({
            destination: function (req, file, cb) {
                const rutaExcel = path.join(configuracionMulter.uploadPath, 'excel', 'temporal');
                fs.mkdirSync(rutaExcel, { recursive: true });
                cb(null, rutaExcel);
            },
            filename: function (req, file, cb) {
                const timestamp = Date.now();
                const hash = crypto.randomBytes(8).toString('hex');
                const nombreExcel = `carga_${timestamp}_${hash}.xlsx`;
                cb(null, nombreExcel);
            }
        }),
        fileFilter: (req, file, cb) => {
            // Solo archivos Excel
            const tiposExcelPermitidos = [
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ];
            
            if (!tiposExcelPermitidos.includes(file.mimetype)) {
                const error = new Error('Solo se permiten archivos Excel (.xls, .xlsx)');
                error.code = 'INVALID_EXCEL_TYPE';
                return cb(error, false);
            }
            
            cb(null, true);
        },
        limits: {
            fileSize: 25 * 1024 * 1024, // 25MB para Excel
            files: 1
        }
    })
};

/**
 * 🛡️ Configuración para producción (más restrictiva)
 */
const configuracionProduccion = {
    ...configuracionMulter,
    limits: {
        ...configuracionMulter.limits,
        fileSize: 8 * 1024 * 1024, // 8MB en producción
        files: 3 // Menos archivos simultáneos
    }
};

/**
 * 🧪 Configuración para desarrollo (más permisiva)
 */
const configuracionDesarrollo = {
    ...configuracionMulter,
    limits: {
        ...configuracionMulter.limits,
        fileSize: 20 * 1024 * 1024, // 20MB en desarrollo
        files: 10 // Más archivos para testing
    }
};

/**
 * 🔧 Función para obtener configuración según entorno
 */
function obtenerConfiguracionMulter() {
    const entorno = process.env.NODE_ENV || 'development';
    
    switch (entorno) {
        case 'production':
            console.log('🔒 Usando configuración Multer de PRODUCCIÓN (restrictiva)');
            return configuracionProduccion;
            
        case 'development':
            console.log('🔧 Usando configuración Multer de DESARROLLO (permisiva)');
            return configuracionDesarrollo;
            
        case 'test':
            console.log('🧪 Usando configuración Multer de TESTING');
            return {
                ...configuracionMulter,
                uploadPath: './test-uploads'
            };
            
        default:
            return configuracionMulter;
    }
}

/**
 * ⚠️ Middleware para manejo de errores de Multer
 */
function middlewareErroresMulter(error, req, res, next) {
    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    success: false,
                    error: 'FILE_TOO_LARGE',
                    message: `Archivo demasiado grande. Máximo permitido: ${Math.round(configuracionMulter.limits.fileSize / 1024 / 1024)}MB`,
                    limite_mb: Math.round(configuracionMulter.limits.fileSize / 1024 / 1024)
                });
                
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    success: false,
                    error: 'TOO_MANY_FILES',
                    message: `Demasiados archivos. Máximo permitido: ${configuracionMulter.limits.files}`,
                    limite_archivos: configuracionMulter.limits.files
                });
                
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    success: false,
                    error: 'UNEXPECTED_FILE',
                    message: 'Campo de archivo no esperado',
                    campo: error.field
                });
                
            default:
                return res.status(400).json({
                    success: false,
                    error: 'UPLOAD_ERROR',
                    message: 'Error en la subida del archivo',
                    detalles: error.message
                });
        }
    }
    
    // Errores personalizados de validación
    if (error.code === 'INVALID_EXTENSION' || error.code === 'INVALID_MIME_TYPE') {
        return res.status(400).json({
            success: false,
            error: error.code,
            message: error.message,
            extensiones_permitidas: configuracionMulter.allowedExtensions,
            campo: error.field
        });
    }
    
    next(error);
}

/**
 * 🧹 Función para limpiar archivos temporales
 */
async function limpiarArchivosTemporales(diasAntiguedad = 7) {
    try {
        const rutaTemporal = path.join(configuracionMulter.uploadPath, 'temporal');
        
        if (!fs.existsSync(rutaTemporal)) {
            return { limpiados: 0, mensaje: 'Directorio temporal no existe' };
        }
        
        const ahora = Date.now();
        const umbralTiempo = diasAntiguedad * 24 * 60 * 60 * 1000;
        let archivosLimpiados = 0;
        
        const archivos = fs.readdirSync(rutaTemporal);
        
        for (const archivo of archivos) {
            const rutaArchivo = path.join(rutaTemporal, archivo);
            const stats = fs.statSync(rutaArchivo);
            
            if (ahora - stats.mtime.getTime() > umbralTiempo) {
                fs.unlinkSync(rutaArchivo);
                archivosLimpiados++;
            }
        }
        
        console.log(`🧹 Limpieza temporal completada: ${archivosLimpiados} archivos eliminados`);
        
        return {
            limpiados: archivosLimpiados,
            mensaje: `${archivosLimpiados} archivos temporales eliminados`
        };
        
    } catch (error) {
        console.error('❌ Error al limpiar archivos temporales:', error);
        throw error;
    }
}

/**
 * 📊 Obtener estadísticas de archivos
 */
async function obtenerEstadisticasArchivos() {
    try {
        const rutaUploads = configuracionMulter.uploadPath;
        
        if (!fs.existsSync(rutaUploads)) {
            return { total: 0, tamaño_total: 0, mensaje: 'Directorio de uploads no existe' };
        }
        
        let totalArchivos = 0;
        let tamañoTotal = 0;
        
        function recorrerDirectorio(directorio) {
            const elementos = fs.readdirSync(directorio);
            
            for (const elemento of elementos) {
                const rutaElemento = path.join(directorio, elemento);
                const stats = fs.statSync(rutaElemento);
                
                if (stats.isDirectory()) {
                    recorrerDirectorio(rutaElemento);
                } else {
                    totalArchivos++;
                    tamañoTotal += stats.size;
                }
            }
        }
        
        recorrerDirectorio(rutaUploads);
        
        return {
            total_archivos: totalArchivos,
            tamaño_total_bytes: tamañoTotal,
            tamaño_total_mb: Math.round(tamañoTotal / 1024 / 1024 * 100) / 100,
            ruta_uploads: rutaUploads,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        throw error;
    }
}

/**
 * 📤 Exportaciones
 */
module.exports = {
    // Configuración principal
    configuracionMulter: obtenerConfiguracionMulter(),
    
    // Configuraciones por tipo
    upload: configuracionesPorTipo.documentos,
    uploadPortafolio: configuracionesPorTipo.portafolio,
    uploadAvatar: configuracionesPorTipo.avatares,
    uploadExcel: configuracionesPorTipo.excel,
    
    // Configuraciones específicas
    storage,
    fileFilter,
    
    // Middlewares
    middlewareErroresMulter,
    
    // Utilidades
    obtenerConfiguracionMulter,
    limpiarArchivosTemporales,
    obtenerEstadisticasArchivos,
    
    // Configuraciones por entorno
    configuracionProduccion,
    configuracionDesarrollo,
    
    // Constantes
    allowedExtensions: configuracionMulter.allowedExtensions,
    allowedMimeTypes: configuracionMulter.allowedMimeTypes,
    maxFileSize: configuracionMulter.limits.fileSize
};