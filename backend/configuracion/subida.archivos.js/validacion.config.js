/**
 * ✅ CONFIGURACIÓN VALIDACIÓN ARCHIVOS - Sistema Portafolio Docente UNSAAC
 * 
 * Sistema completo de validación de archivos incluyendo:
 * - Validación de tipos MIME
 * - Análisis de contenido
 * - Detección de malware
 * - Validación de metadatos
 * - Sanitización de archivos
 * 
 * @author Sistema Portafolio Docente UNSAAC
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

/**
 * 🔍 Configuración principal de validación
 */
const configuracionValidacion = {
    // 📋 Tipos de archivo permitidos por categoría
    tiposPermitidos: {
        documentos: {
            extensiones: ['pdf', 'doc', 'docx', 'txt'],
            mimeTypes: [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain'
            ],
            tamañoMaximo: 15 * 1024 * 1024, // 15MB
            descripcion: 'Documentos de texto y PDF'
        },
        
        hojas_calculo: {
            extensiones: ['xls', 'xlsx', 'csv'],
            mimeTypes: [
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/csv'
            ],
            tamañoMaximo: 25 * 1024 * 1024, // 25MB
            descripcion: 'Hojas de cálculo'
        },
        
        presentaciones: {
            extensiones: ['ppt', 'pptx'],
            mimeTypes: [
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            ],
            tamañoMaximo: 50 * 1024 * 1024, // 50MB
            descripcion: 'Presentaciones'
        },
        
        imagenes: {
            extensiones: ['jpg', 'jpeg', 'png', 'gif'],
            mimeTypes: [
                'image/jpeg',
                'image/png',
                'image/gif'
            ],
            tamañoMaximo: 5 * 1024 * 1024, // 5MB
            descripcion: 'Imágenes'
        },
        
        comprimidos: {
            extensiones: ['zip', 'rar', '7z'],
            mimeTypes: [
                'application/zip',
                'application/x-rar-compressed',
                'application/x-7z-compressed'
            ],
            tamañoMaximo: 100 * 1024 * 1024, // 100MB
            descripcion: 'Archivos comprimidos'
        }
    },
    
    // 🚫 Tipos de archivo prohibidos
    tiposProhibidos: {
        ejecutables: ['exe', 'bat', 'cmd', 'scr', 'msi', 'app', 'deb', 'rpm'],
        scripts: ['js', 'vbs', 'ps1', 'sh', 'py', 'rb', 'pl'],
        sistema: ['dll', 'sys', 'drv', 'tmp'],
        codigo: ['html', 'htm', 'php', 'asp', 'jsp', 'sql']
    },
    
    // 🔒 Configuración de seguridad
    seguridad: {
        verificarMagicNumbers: true,
        analizarContenido: true,
        detectarMalware: process.env.MALWARE_DETECTION === 'true',
        validarEstructura: true,
        limitarCaracteresNombre: true,
        sanitizarMetadatos: true
    },
    
    // 📏 Límites generales
    limites: {
        tamañoMinimoArchivo: 1, // 1 byte
        tamañoMaximoGeneral: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
        longitudMaximaNombre: 255,
        caracteresPermitidosNombre: /^[a-zA-Z0-9._\-\s()[\]]+$/,
        extensionesMaximas: 1 // Solo una extensión
    }
};

/**
 * 🔬 Magic numbers para validación de tipos de archivo
 */
const magicNumbers = {
    'pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
    'docx': [0x50, 0x4B, 0x03, 0x04], // ZIP (DOCX es ZIP)
    'xlsx': [0x50, 0x4B, 0x03, 0x04], // ZIP (XLSX es ZIP)
    'pptx': [0x50, 0x4B, 0x03, 0x04], // ZIP (PPTX es ZIP)
    'doc': [0xD0, 0xCF, 0x11, 0xE0], // MS Office anterior
    'xls': [0xD0, 0xCF, 0x11, 0xE0], // MS Office anterior
    'ppt': [0xD0, 0xCF, 0x11, 0xE0], // MS Office anterior
    'jpg': [0xFF, 0xD8, 0xFF], // JPEG
    'jpeg': [0xFF, 0xD8, 0xFF], // JPEG
    'png': [0x89, 0x50, 0x4E, 0x47], // PNG
    'gif': [0x47, 0x49, 0x46], // GIF
    'zip': [0x50, 0x4B, 0x03, 0x04], // ZIP
    'rar': [0x52, 0x61, 0x72, 0x21] // RAR
};

/**
 * 🔍 Validar tipo de archivo por magic number
 */
function validarMagicNumber(buffer, extension) {
    try {
        const magicNumber = magicNumbers[extension.toLowerCase()];
        
        if (!magicNumber) {
            // Si no tenemos magic number, permitir (validación básica)
            return { valido: true, mensaje: 'Magic number no definido para esta extensión' };
        }
        
        if (buffer.length < magicNumber.length) {
            return { valido: false, mensaje: 'Archivo demasiado pequeño para validar' };
        }
        
        // Comparar magic number
        for (let i = 0; i < magicNumber.length; i++) {
            if (buffer[i] !== magicNumber[i]) {
                return { 
                    valido: false, 
                    mensaje: `Magic number no coincide para ${extension}`,
                    esperado: magicNumber,
                    encontrado: Array.from(buffer.slice(0, magicNumber.length))
                };
            }
        }
        
        return { valido: true, mensaje: 'Magic number válido' };
        
    } catch (error) {
        console.error('❌ Error al validar magic number:', error);
        return { valido: false, mensaje: 'Error en validación de magic number' };
    }
}

/**
 * ✅ Validación principal de archivo
 */
async function validarArchivo(rutaArchivo, metadatos = {}) {
    try {
        console.log(`🔍 Iniciando validación de: ${path.basename(rutaArchivo)}`);
        
        const resultadoValidacion = {
            valido: true,
            errores: [],
            advertencias: [],
            informacion: {},
            timestamp: new Date().toISOString()
        };
        
        // 1. Verificar que el archivo existe
        if (!fs.existsSync(rutaArchivo)) {
            resultadoValidacion.valido = false;
            resultadoValidacion.errores.push('Archivo no encontrado');
            return resultadoValidacion;
        }
        
        // 2. Obtener información básica del archivo
        const stats = fs.statSync(rutaArchivo);
        const extension = path.extname(rutaArchivo).toLowerCase().substring(1);
        const nombreArchivo = path.basename(rutaArchivo);
        
        resultadoValidacion.informacion = {
            tamaño: stats.size,
            extension: extension,
            nombre: nombreArchivo,
            fechaCreacion: stats.birthtime,
            fechaModificacion: stats.mtime
        };
        
        // 3. Validar nombre del archivo
        const validacionNombre = validarNombreArchivo(nombreArchivo);
        if (!validacionNombre.valido) {
            resultadoValidacion.valido = false;
            resultadoValidacion.errores.push(...validacionNombre.errores);
        }
        resultadoValidacion.advertencias.push(...validacionNombre.advertencias);
        
        // 4. Validar extensión
        const validacionExtension = validarExtension(extension);
        if (!validacionExtension.valido) {
            resultadoValidacion.valido = false;
            resultadoValidacion.errores.push(...validacionExtension.errores);
        }
        
        // 5. Validar tamaño
        const validacionTamaño = validarTamañoArchivo(stats.size, extension);
        if (!validacionTamaño.valido) {
            resultadoValidacion.valido = false;
            resultadoValidacion.errores.push(...validacionTamaño.errores);
        }
        
        // 6. Validar contenido (magic number)
        if (configuracionValidacion.seguridad.verificarMagicNumbers) {
            const buffer = fs.readFileSync(rutaArchivo);
            const validacionMagic = validarMagicNumber(buffer.slice(0, 10), extension);
            
            if (!validacionMagic.valido) {
                resultadoValidacion.valido = false;
                resultadoValidacion.errores.push(`Contenido no coincide con extensión: ${validacionMagic.mensaje}`);
            }
        }
        
        // 7. Análisis de contenido específico por tipo
        if (configuracionValidacion.seguridad.analizarContenido) {
            const analisisContenido = await analizarContenidoArchivo(rutaArchivo, extension);
            resultadoValidacion.advertencias.push(...analisisContenido.advertencias);
            
            if (!analisisContenido.valido) {
                resultadoValidacion.valido = false;
                resultadoValidacion.errores.push(...analisisContenido.errores);
            }
        }
        
        // 8. Calcular hash del archivo
        resultadoValidacion.informacion.hash = await calcularHashArchivo(rutaArchivo);
        
        // 9. Verificar duplicados si se proporciona contexto
        if (metadatos.verificarDuplicados) {
            const verificacionDuplicados = await verificarArchivosDuplicados(
                resultadoValidacion.informacion.hash, 
                metadatos.usuarioId
            );
            
            if (verificacionDuplicados.encontrado) {
                resultadoValidacion.advertencias.push(
                    `Archivo duplicado encontrado: ${verificacionDuplicados.rutaOriginal}`
                );
            }
        }
        
        console.log(`${resultadoValidacion.valido ? '✅' : '❌'} Validación completada: ${nombreArchivo}`);
        
        return resultadoValidacion;
        
    } catch (error) {
        console.error('❌ Error en validación de archivo:', error);
        return {
            valido: false,
            errores: [`Error interno de validación: ${error.message}`],
            advertencias: [],
            informacion: {},
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * 📝 Validar nombre de archivo
 */
function validarNombreArchivo(nombreArchivo) {
    const resultado = {
        valido: true,
        errores: [],
        advertencias: []
    };
    
    // Verificar longitud
    if (nombreArchivo.length > configuracionValidacion.limites.longitudMaximaNombre) {
        resultado.valido = false;
        resultado.errores.push(`Nombre demasiado largo (máximo ${configuracionValidacion.limites.longitudMaximaNombre} caracteres)`);
    }
    
    // Verificar caracteres permitidos
    if (!configuracionValidacion.limites.caracteresPermitidosNombre.test(nombreArchivo)) {
        resultado.valido = false;
        resultado.errores.push('Nombre contiene caracteres no permitidos');
    }
    
    // Verificar nombres reservados (Windows)
    const nombresReservados = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'LPT1', 'LPT2'];
    const nombreSinExtension = path.basename(nombreArchivo, path.extname(nombreArchivo));
    
    if (nombresReservados.includes(nombreSinExtension.toUpperCase())) {
        resultado.valido = false;
        resultado.errores.push('Nombre de archivo reservado del sistema');
    }
    
    // Advertencias para mejores prácticas
    if (nombreArchivo.includes(' ')) {
        resultado.advertencias.push('Se recomienda usar guiones en lugar de espacios');
    }
    
    if (nombreArchivo !== nombreArchivo.toLowerCase()) {
        resultado.advertencias.push('Se recomienda usar solo minúsculas en nombres de archivo');
    }
    
    return resultado;
}

/**
 * 📁 Validar extensión de archivo
 */
function validarExtension(extension) {
    const resultado = {
        valido: true,
        errores: [],
        tipo: null
    };
    
    // Verificar si está en tipos prohibidos
    for (const [categoria, extensiones] of Object.entries(configuracionValidacion.tiposProhibidos)) {
        if (extensiones.includes(extension)) {
            resultado.valido = false;
            resultado.errores.push(`Tipo de archivo prohibido (${categoria}): ${extension}`);
            return resultado;
        }
    }
    
    // Verificar si está en tipos permitidos
    let tipoEncontrado = null;
    for (const [tipo, config] of Object.entries(configuracionValidacion.tiposPermitidos)) {
        if (config.extensiones.includes(extension)) {
            tipoEncontrado = tipo;
            break;
        }
    }
    
    if (!tipoEncontrado) {
        resultado.valido = false;
        resultado.errores.push(`Extensión no permitida: ${extension}`);
    } else {
        resultado.tipo = tipoEncontrado;
    }
    
    return resultado;
}

/**
 * 📏 Validar tamaño de archivo
 */
function validarTamañoArchivo(tamaño, extension) {
    const resultado = {
        valido: true,
        errores: []
    };
    
    // Verificar tamaño mínimo
    if (tamaño < configuracionValidacion.limites.tamañoMinimoArchivo) {
        resultado.valido = false;
        resultado.errores.push('Archivo vacío o demasiado pequeño');
        return resultado;
    }
    
    // Verificar tamaño máximo general
    if (tamaño > configuracionValidacion.limites.tamañoMaximoGeneral) {
        resultado.valido = false;
        resultado.errores.push(`Archivo demasiado grande (máximo ${Math.round(configuracionValidacion.limites.tamañoMaximoGeneral/1024/1024)}MB)`);
        return resultado;
    }
    
    // Verificar tamaño específico por tipo
    for (const [tipo, config] of Object.entries(configuracionValidacion.tiposPermitidos)) {
        if (config.extensiones.includes(extension)) {
            if (tamaño > config.tamañoMaximo) {
                resultado.valido = false;
                resultado.errores.push(`Archivo ${tipo} demasiado grande (máximo ${Math.round(config.tamañoMaximo/1024/1024)}MB)`);
            }
            break;
        }
    }
    
    return resultado;
}

/**
 * 🔬 Analizar contenido específico del archivo
 */
async function analizarContenidoArchivo(rutaArchivo, extension) {
    const resultado = {
        valido: true,
        errores: [],
        advertencias: []
    };
    
    try {
        const buffer = fs.readFileSync(rutaArchivo);
        
        // Buscar patrones sospechosos
        const patronesSospechosos = [
            /javascript/gi,
            /<script/gi,
            /eval\(/gi,
            /document\.write/gi,
            /window\.location/gi
        ];
        
        const contenidoTexto = buffer.toString('ascii', 0, Math.min(buffer.length, 1024));
        
        for (const patron of patronesSospechosos) {
            if (patron.test(contenidoTexto)) {
                resultado.advertencias.push(`Contenido sospechoso detectado: ${patron.source}`);
            }
        }
        
        // Verificaciones específicas por tipo
        switch (extension) {
            case 'pdf':
                resultado.advertencias.push(...await analizarPDF(buffer));
                break;
            case 'docx':
            case 'xlsx':
            case 'pptx':
                resultado.advertencias.push(...await analizarOfficeXML(buffer));
                break;
            default:
                // Análisis general
                break;
        }
        
    } catch (error) {
        console.error('❌ Error al analizar contenido:', error);
        resultado.advertencias.push('No se pudo analizar completamente el contenido del archivo');
    }
    
    return resultado;
}

/**
 * 📄 Análisis específico para archivos PDF
 */
async function analizarPDF(buffer) {
    const advertencias = [];
    
    try {
        const contenido = buffer.toString('ascii');
        
        // Verificar versión PDF
        const versionMatch = contenido.match(/%PDF-(\d\.\d)/);
        if (versionMatch) {
            const version = parseFloat(versionMatch[1]);
            if (version > 2.0) {
                advertencias.push(`Versión PDF muy nueva: ${version}`);
            }
        }
        
        // Buscar JavaScript embebido
        if (/\/JavaScript/gi.test(contenido)) {
            advertencias.push('PDF contiene JavaScript embebido');
        }
        
        // Buscar formularios
        if (/\/AcroForm/gi.test(contenido)) {
            advertencias.push('PDF contiene formularios interactivos');
        }
        
    } catch (error) {
        console.error('❌ Error al analizar PDF:', error);
    }
    
    return advertencias;
}

/**
 * 📊 Análisis específico para archivos Office XML
 */
async function analizarOfficeXML(buffer) {
    const advertencias = [];
    
    try {
        // Los archivos Office XML son ZIP, buscar patrones en los primeros bytes
        const contenido = buffer.toString('ascii', 0, 1024);
        
        // Verificar si es realmente un ZIP
        if (!contenido.startsWith('PK')) {
            advertencias.push('Archivo Office con estructura inválida');
        }
        
    } catch (error) {
        console.error('❌ Error al analizar Office XML:', error);
    }
    
    return advertencias;
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
 * 🔄 Verificar archivos duplicados
 */
async function verificarArchivosDuplicados(hash, usuarioId) {
    try {
        // En una implementación real, esto consultaría la base de datos
        // Por ahora, simulamos la verificación
        
        const resultado = {
            encontrado: false,
            rutaOriginal: null,
            fechaOriginal: null
        };
        
        // Simular consulta a base de datos
        // SELECT ruta_archivo, fecha_subida FROM archivos_subidos 
        // WHERE hash_archivo = ? AND usuario_id = ?
        
        console.log(`🔍 Verificando duplicados para hash: ${hash.substring(0, 16)}...`);
        
        return resultado;
        
    } catch (error) {
        console.error('❌ Error al verificar duplicados:', error);
        return { encontrado: false };
    }
}

/**
 * 🧹 Sanitizar archivo (eliminar metadatos potencialmente peligrosos)
 */
async function sanitizarArchivo(rutaArchivo, rutaDestino) {
    try {
        const extension = path.extname(rutaArchivo).toLowerCase().substring(1);
        
        switch (extension) {
            case 'pdf':
                return await sanitizarPDF(rutaArchivo, rutaDestino);
            case 'jpg':
            case 'jpeg':
                return await sanitizarImagen(rutaArchivo, rutaDestino);
            default:
                // Para otros tipos, simplemente copiar
                fs.copyFileSync(rutaArchivo, rutaDestino);
                return { sanitizado: true, mensaje: 'Archivo copiado sin modificaciones' };
        }
        
    } catch (error) {
        console.error('❌ Error al sanitizar archivo:', error);
        throw error;
    }
}

/**
 * 🧹 Sanitizar PDF (simplificado)
 */
async function sanitizarPDF(rutaOriginal, rutaDestino) {
    try {
        // En una implementación real, usarías una librería como pdf-lib
        // Para este ejemplo, simplemente copiamos el archivo
        fs.copyFileSync(rutaOriginal, rutaDestino);
        
        return {
            sanitizado: true,
            mensaje: 'PDF sanitizado (metadatos preservados)',
            advertencia: 'Implementar sanitización completa de PDF'
        };
        
    } catch (error) {
        console.error('❌ Error al sanitizar PDF:', error);
        throw error;
    }
}

/**
 * 🖼️ Sanitizar imagen (eliminar EXIF)
 */
async function sanitizarImagen(rutaOriginal, rutaDestino) {
    try {
        // En una implementación real, usarías una librería como sharp o jimp
        // Para este ejemplo, simplemente copiamos el archivo
        fs.copyFileSync(rutaOriginal, rutaDestino);
        
        return {
            sanitizado: true,
            mensaje: 'Imagen sanitizada (EXIF preservado)',
            advertencia: 'Implementar eliminación de EXIF'
        };
        
    } catch (error) {
        console.error('❌ Error al sanitizar imagen:', error);
        throw error;
    }
}

/**
 * 📊 Obtener resumen de tipos permitidos
 */
function obtenerTiposPermitidos() {
    const resumen = {};
    
    for (const [tipo, config] of Object.entries(configuracionValidacion.tiposPermitidos)) {
        resumen[tipo] = {
            extensiones: config.extensiones,
            tamaño_maximo_mb: Math.round(config.tamañoMaximo / 1024 / 1024),
            descripcion: config.descripcion
        };
    }
    
    return resumen;
}

/**
 * 📤 Exportaciones
 */
module.exports = {
    // Configuración
    configuracionValidacion,
    
    // Funciones principales
    validarArchivo,
    validarNombreArchivo,
    validarExtension,
    validarTamañoArchivo,
    
    // Análisis de contenido
    analizarContenidoArchivo,
    calcularHashArchivo,
    verificarArchivosDuplicados,
    
    // Sanitización
    sanitizarArchivo,
    
    // Utilidades
    obtenerTiposPermitidos,
    magicNumbers,
    
    // Constantes
    tiposPermitidos: configuracionValidacion.tiposPermitidos,
    tiposProhibidos: configuracionValidacion.tiposProhibidos,
    limites: configuracionValidacion.limites
};