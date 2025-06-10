/**
 * 💾 CONFIGURACIÓN ALMACENAMIENTO - Sistema Portafolio Docente UNSAAC
 * 
 * Gestión del almacenamiento de archivos, incluyendo:
 * - Organización de directorios
 * - Gestión de espacio en disco
 * - Respaldos y archivado
 * - Optimización de almacenamiento
 * 
 * @author Sistema Portafolio Docente UNSAAC
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

/**
 * 🗂️ Configuración principal de almacenamiento
 */
const configuracionAlmacenamiento = {
    // 📁 Rutas principales
    rutaBase: process.env.UPLOAD_PATH || './subidas',
    rutaTemporales: process.env.TEMP_PATH || './temp',
    rutaRespaldos: process.env.BACKUP_PATH || './respaldos',
    rutaArchivos: process.env.ARCHIVE_PATH || './archivo',
    
    // 📊 Límites de almacenamiento
    limites: {
        tamañoMaximoDirectorio: parseInt(process.env.MAX_DIRECTORY_SIZE) || 1024 * 1024 * 1024, // 1GB
        espacioMinimoLibre: parseInt(process.env.MIN_FREE_SPACE) || 500 * 1024 * 1024, // 500MB
        archivosMaximosPorDirectorio: parseInt(process.env.MAX_FILES_PER_DIR) || 1000,
        diasRetencionTemporales: parseInt(process.env.TEMP_RETENTION_DAYS) || 7,
        diasRetencionArchivos: parseInt(process.env.FILE_RETENTION_DAYS) || 365
    },
    
    // 🏗️ Estructura de directorios
    estructura: {
        documentos: 'documentos',
        portafolios: 'portafolios',
        avatares: 'avatares',
        excel: 'excel',
        reportes: 'reportes',
        temporales: 'temp',
        respaldos: 'backups',
        archivo: 'archive'
    },
    
    // 🔄 Configuración de respaldos
    respaldos: {
        habilitado: process.env.BACKUP_ENABLED === 'true',
        frecuencia: process.env.BACKUP_FREQUENCY || 'daily', // daily, weekly, monthly
        compresion: process.env.BACKUP_COMPRESSION === 'true',
        mantenimiento: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30
    }
};

/**
 * 📁 Inicializar estructura de directorios
 */
async function inicializarEstructura() {
    try {
        console.log('🏗️  Inicializando estructura de directorios...');
        
        const directoriosBase = [
            configuracionAlmacenamiento.rutaBase,
            configuracionAlmacenamiento.rutaTemporales,
            configuracionAlmacenamiento.rutaRespaldos,
            configuracionAlmacenamiento.rutaArchivos
        ];
        
        // Crear directorios base
        for (const directorio of directoriosBase) {
            if (!fs.existsSync(directorio)) {
                fs.mkdirSync(directorio, { recursive: true });
                console.log(`✅ Directorio creado: ${directorio}`);
            }
        }
        
        // Crear subdirectorios en ruta base
        for (const [nombre, ruta] of Object.entries(configuracionAlmacenamiento.estructura)) {
            const rutaCompleta = path.join(configuracionAlmacenamiento.rutaBase, ruta);
            if (!fs.existsSync(rutaCompleta)) {
                fs.mkdirSync(rutaCompleta, { recursive: true });
                console.log(`✅ Subdirectorio creado: ${rutaCompleta}`);
            }
        }
        
        // Crear estructura por años y meses
        const añoActual = new Date().getFullYear();
        const mesesAnio = 12;
        
        for (const tipoDocumento of ['documentos', 'portafolios']) {
            for (let mes = 1; mes <= mesesAnio; mes++) {
                const mesFormateado = String(mes).padStart(2, '0');
                const rutaMes = path.join(
                    configuracionAlmacenamiento.rutaBase,
                    tipoDocumento,
                    String(añoActual),
                    mesFormateado
                );
                
                if (!fs.existsSync(rutaMes)) {
                    fs.mkdirSync(rutaMes, { recursive: true });
                }
            }
        }
        
        console.log('✅ Estructura de directorios inicializada correctamente');
        return { exito: true, mensaje: 'Estructura inicializada' };
        
    } catch (error) {
        console.error('❌ Error al inicializar estructura:', error);
        throw error;
    }
}

/**
 * 📍 Generar ruta para archivo
 */
function generarRutaArchivo(tipoDocumento, usuarioId, nombreArchivo) {
    try {
        const fechaActual = new Date();
        const año = fechaActual.getFullYear();
        const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
        const dia = String(fechaActual.getDate()).padStart(2, '0');
        
        const rutaRelativa = path.join(
            configuracionAlmacenamiento.estructura[tipoDocumento] || 'documentos',
            String(año),
            mes,
            dia,
            `usuario_${usuarioId}`
        );
        
        const rutaCompleta = path.join(configuracionAlmacenamiento.rutaBase, rutaRelativa);
        
        // Crear directorio si no existe
        if (!fs.existsSync(rutaCompleta)) {
            fs.mkdirSync(rutaCompleta, { recursive: true });
        }
        
        return {
            rutaCompleta,
            rutaRelativa,
            nombreArchivo: generarNombreUnico(nombreArchivo)
        };
        
    } catch (error) {
        console.error('❌ Error al generar ruta de archivo:', error);
        throw error;
    }
}

/**
 * 🔤 Generar nombre único para archivo
 */
function generarNombreUnico(nombreOriginal) {
    const extension = path.extname(nombreOriginal);
    const nombreBase = path.basename(nombreOriginal, extension);
    const timestamp = Date.now();
    const hash = crypto.randomBytes(6).toString('hex');
    
    // Limpiar nombre base
    const nombreLimpio = nombreBase
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 50);
    
    return `${nombreLimpio}_${timestamp}_${hash}${extension}`;
}

/**
 * 💾 Mover archivo a ubicación final
 */
async function moverArchivoFinal(rutaTemporal, tipoDocumento, usuarioId, metadatos = {}) {
    try {
        const nombreOriginal = path.basename(rutaTemporal);
        const infoRuta = generarRutaArchivo(tipoDocumento, usuarioId, nombreOriginal);
        const rutaFinal = path.join(infoRuta.rutaCompleta, infoRuta.nombreArchivo);
        
        // Verificar que el archivo temporal existe
        if (!fs.existsSync(rutaTemporal)) {
            throw new Error(`Archivo temporal no encontrado: ${rutaTemporal}`);
        }
        
        // Mover archivo
        fs.renameSync(rutaTemporal, rutaFinal);
        
        // Crear archivo de metadatos
        const metadatosCompletos = {
            ...metadatos,
            nombreOriginal: nombreOriginal,
            nombreGuardado: infoRuta.nombreArchivo,
            rutaRelativa: path.join(infoRuta.rutaRelativa, infoRuta.nombreArchivo),
            rutaCompleta: rutaFinal,
            fechaSubida: new Date().toISOString(),
            tamaño: fs.statSync(rutaFinal).size,
            hash: await calcularHashArchivo(rutaFinal)
        };
        
        const rutaMetadatos = rutaFinal + '.meta.json';
        fs.writeFileSync(rutaMetadatos, JSON.stringify(metadatosCompletos, null, 2));
        
        console.log(`✅ Archivo movido exitosamente: ${rutaFinal}`);
        
        return {
            exito: true,
            ruta: rutaFinal,
            rutaRelativa: metadatosCompletos.rutaRelativa,
            metadatos: metadatosCompletos
        };
        
    } catch (error) {
        console.error('❌ Error al mover archivo:', error);
        throw error;
    }
}

/**
 * 🔍 Calcular hash SHA-256 del archivo
 */
async function calcularHashArchivo(rutaArchivo) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(rutaArchivo);
        
        stream.on('data', data => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', error => reject(error));
    });
}

/**
 * 🗑️ Eliminar archivo y metadatos
 */
async function eliminarArchivo(rutaArchivo) {
    try {
        const rutaMetadatos = rutaArchivo + '.meta.json';
        
        // Eliminar archivo principal
        if (fs.existsSync(rutaArchivo)) {
            fs.unlinkSync(rutaArchivo);
            console.log(`🗑️  Archivo eliminado: ${rutaArchivo}`);
        }
        
        // Eliminar metadatos
        if (fs.existsSync(rutaMetadatos)) {
            fs.unlinkSync(rutaMetadatos);
            console.log(`🗑️  Metadatos eliminados: ${rutaMetadatos}`);
        }
        
        return { exito: true, mensaje: 'Archivo eliminado correctamente' };
        
    } catch (error) {
        console.error('❌ Error al eliminar archivo:', error);
        throw error;
    }
}

/**
 * 📊 Verificar espacio en disco
 */
async function verificarEspacioDisco() {
    try {
        const stats = fs.statSync(configuracionAlmacenamiento.rutaBase);
        
        // Función para obtener espacio libre (simplificada)
        const obtenerEspacioLibre = () => {
            try {
                // En un entorno real, usarías una librería como 'check-disk-space'
                return 1024 * 1024 * 1024; // 1GB simulado
            } catch {
                return configuracionAlmacenamiento.limites.espacioMinimoLibre * 2;
            }
        };
        
        const espacioLibre = obtenerEspacioLibre();
        const espacioMinimo = configuracionAlmacenamiento.limites.espacioMinimoLibre;
        
        return {
            espacioLibre,
            espacioMinimoRequerido: espacioMinimo,
            espacioSuficiente: espacioLibre > espacioMinimo,
            porcentajeUso: Math.round((1 - espacioLibre / (espacioLibre + 1024*1024*1024)) * 100),
            alerta: espacioLibre < espacioMinimo * 2 ? 'Espacio en disco bajo' : null
        };
        
    } catch (error) {
        console.error('❌ Error al verificar espacio en disco:', error);
        return {
            espacioSuficiente: false,
            error: error.message
        };
    }
}

/**
 * 🧹 Limpiar archivos temporales
 */
async function limpiarTemporales() {
    try {
        const rutaTemporales = configuracionAlmacenamiento.rutaTemporales;
        const diasRetencion = configuracionAlmacenamiento.limites.diasRetencionTemporales;
        
        if (!fs.existsSync(rutaTemporales)) {
            return { limpiados: 0, mensaje: 'Directorio temporal no existe' };
        }
        
        const ahora = Date.now();
        const umbralTiempo = diasRetencion * 24 * 60 * 60 * 1000;
        let archivosLimpiados = 0;
        let espacioLiberado = 0;
        
        function limpiarDirectorio(directorio) {
            const elementos = fs.readdirSync(directorio);
            
            for (const elemento of elementos) {
                const rutaElemento = path.join(directorio, elemento);
                const stats = fs.statSync(rutaElemento);
                
                if (stats.isDirectory()) {
                    limpiarDirectorio(rutaElemento);
                    
                    // Eliminar directorio si está vacío
                    try {
                        fs.rmdirSync(rutaElemento);
                    } catch (error) {
                        // Directorio no vacío, ignorar
                    }
                } else {
                    if (ahora - stats.mtime.getTime() > umbralTiempo) {
                        espacioLiberado += stats.size;
                        fs.unlinkSync(rutaElemento);
                        archivosLimpiados++;
                    }
                }
            }
        }
        
        limpiarDirectorio(rutaTemporales);
        
        console.log(`🧹 Limpieza temporal completada: ${archivosLimpiados} archivos, ${Math.round(espacioLiberado/1024/1024)}MB liberados`);
        
        return {
            archivosLimpiados,
            espacioLiberadoMB: Math.round(espacioLiberado / 1024 / 1024),
            mensaje: `${archivosLimpiados} archivos temporales eliminados`
        };
        
    } catch (error) {
        console.error('❌ Error en limpieza temporal:', error);
        throw error;
    }
}

/**
 * 📦 Archivar archivos antiguos
 */
async function archivarArchivosAntiguos() {
    try {
        const rutaBase = configuracionAlmacenamiento.rutaBase;
        const rutaArchivo = configuracionAlmacenamiento.rutaArchivos;
        const diasRetencion = configuracionAlmacenamiento.limites.diasRetencionArchivos;
        
        if (!fs.existsSync(rutaArchivo)) {
            fs.mkdirSync(rutaArchivo, { recursive: true });
        }
        
        const ahora = Date.now();
        const umbralArchivado = diasRetencion * 24 * 60 * 60 * 1000;
        let archivosMovidos = 0;
        
        function archivarDirectorio(directorio, rutaRelativa = '') {
            const elementos = fs.readdirSync(directorio);
            
            for (const elemento of elementos) {
                const rutaElemento = path.join(directorio, elemento);
                const stats = fs.statSync(rutaElemento);
                
                if (stats.isDirectory()) {
                    archivarDirectorio(rutaElemento, path.join(rutaRelativa, elemento));
                } else if (ahora - stats.mtime.getTime() > umbralArchivado) {
                    // Mover archivo al directorio de archivo
                    const rutaDestinoArchivo = path.join(rutaArchivo, rutaRelativa);
                    
                    if (!fs.existsSync(rutaDestinoArchivo)) {
                        fs.mkdirSync(rutaDestinoArchivo, { recursive: true });
                    }
                    
                    const rutaFinalArchivo = path.join(rutaDestinoArchivo, elemento);
                    fs.renameSync(rutaElemento, rutaFinalArchivo);
                    archivosMovidos++;
                    
                    // Mover metadatos si existen
                    const rutaMetadatos = rutaElemento + '.meta.json';
                    if (fs.existsSync(rutaMetadatos)) {
                        const rutaMetadatosDestino = rutaFinalArchivo + '.meta.json';
                        fs.renameSync(rutaMetadatos, rutaMetadatosDestino);
                    }
                }
            }
        }
        
        // Solo archivar documentos y portafolios
        for (const tipo of ['documentos', 'portafolios']) {
            const rutaTipo = path.join(rutaBase, tipo);
            if (fs.existsSync(rutaTipo)) {
                archivarDirectorio(rutaTipo, tipo);
            }
        }
        
        console.log(`📦 Archivado completado: ${archivosMovidos} archivos movidos al archivo`);
        
        return {
            archivosMovidos,
            mensaje: `${archivosMovidos} archivos archivados`
        };
        
    } catch (error) {
        console.error('❌ Error en archivado:', error);
        throw error;
    }
}

/**
 * 📊 Obtener estadísticas de almacenamiento
 */
async function obtenerEstadisticasAlmacenamiento() {
    try {
        const rutaBase = configuracionAlmacenamiento.rutaBase;
        const estadisticas = {
            directorios: {},
            total: {
                archivos: 0,
                tamaño: 0,
                directorios: 0
            }
        };
        
        function analizarDirectorio(directorio, nombre) {
            if (!fs.existsSync(directorio)) {
                return { archivos: 0, tamaño: 0, directorios: 0 };
            }
            
            const elementos = fs.readdirSync(directorio);
            let archivos = 0;
            let tamaño = 0;
            let directorios = 0;
            
            for (const elemento of elementos) {
                const rutaElemento = path.join(directorio, elemento);
                const stats = fs.statSync(rutaElemento);
                
                if (stats.isDirectory()) {
                    directorios++;
                    const subEstats = analizarDirectorio(rutaElemento, `${nombre}/${elemento}`);
                    archivos += subEstats.archivos;
                    tamaño += subEstats.tamaño;
                    directorios += subEstats.directorios;
                } else {
                    archivos++;
                    tamaño += stats.size;
                }
            }
            
            return { archivos, tamaño, directorios };
        }
        
        // Analizar cada tipo de directorio
        for (const [tipo, ruta] of Object.entries(configuracionAlmacenamiento.estructura)) {
            const rutaCompleta = path.join(rutaBase, ruta);
            estadisticas.directorios[tipo] = analizarDirectorio(rutaCompleta, tipo);
            
            estadisticas.total.archivos += estadisticas.directorios[tipo].archivos;
            estadisticas.total.tamaño += estadisticas.directorios[tipo].tamaño;
            estadisticas.total.directorios += estadisticas.directorios[tipo].directorios;
        }
        
        // Información de espacio
        const infoEspacio = await verificarEspacioDisco();
        
        return {
            estadisticas,
            espacio: infoEspacio,
            configuracion: {
                rutaBase: configuracionAlmacenamiento.rutaBase,
                limites: configuracionAlmacenamiento.limites
            },
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        throw error;
    }
}

/**
 * 🔧 Optimizar almacenamiento
 */
async function optimizarAlmacenamiento() {
    try {
        console.log('🔧 Iniciando optimización de almacenamiento...');
        
        const resultados = {
            limpieza: await limpiarTemporales(),
            archivado: await archivarArchivosAntiguos(),
            espacio: await verificarEspacioDisco()
        };
        
        console.log('✅ Optimización completada');
        
        return {
            exito: true,
            resultados,
            mensaje: 'Optimización de almacenamiento completada',
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ Error en optimización:', error);
        throw error;
    }
}

/**
 * 📤 Exportaciones
 */
module.exports = {
    // Configuración
    configuracionAlmacenamiento,
    
    // Funciones principales
    inicializarEstructura,
    generarRutaArchivo,
    moverArchivoFinal,
    eliminarArchivo,
    
    // Utilidades
    generarNombreUnico,
    calcularHashArchivo,
    
    // Gestión de espacio
    verificarEspacioDisco,
    limpiarTemporales,
    archivarArchivosAntiguos,
    optimizarAlmacenamiento,
    
    // Estadísticas
    obtenerEstadisticasAlmacenamiento,
    
    // Constantes
    rutaBase: configuracionAlmacenamiento.rutaBase,
    estructura: configuracionAlmacenamiento.estructura,
    limites: configuracionAlmacenamiento.limites
};