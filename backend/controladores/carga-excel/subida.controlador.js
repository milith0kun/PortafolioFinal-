/**
 * 📊 CONTROLADOR DE SUBIDA DE ARCHIVOS EXCEL
 * 
 * Gestiona la subida de archivos Excel para carga masiva:
 * - Validar formato de archivo Excel
 * - Procesar archivos grandes
 * - Vista previa de datos
 * - Validación de estructura
 * - Manejo de errores de formato
 * 
 * Rutas que maneja:
 * POST /api/v1/excel/subir - Subir archivo Excel
 * GET /api/v1/excel/:id/preview - Vista previa datos
 * POST /api/v1/excel/:id/validar - Validar estructura
 */

// TODO: Soporte para múltiples hojas de Excel
// TODO: Streaming para archivos grandes
// TODO: Validación de estructura antes de procesar
// TODO: Vista previa con primeras N filas
// TODO: Detección automática de formato
/**
 * 📤 CONTROLADOR DE SUBIDA DE ARCHIVOS EXCEL
 * 
 * Maneja la subida y procesamiento inicial de archivos Excel:
 * - Estructura_Base.xlsx (usuarios, ciclos, semestres, estructura)
 * - Carga_Academica.xlsx (asignaturas, configuraciones)
 * - Asignaciones.xlsx (relaciones docente-asignatura, verificador-docente)
 * 
 * Rutas que maneja:
 * POST /api/v1/sistema/excel/subir - Subir archivo Excel
 * GET /api/v1/sistema/excel/tipos - Tipos de archivo soportados
 * GET /api/v1/sistema/excel/plantillas - Descargar plantillas
 * 
 * @author Sistema Portafolio Docente UNSAAC
 * @version 1.0.0
 */

const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const poolConexion = require('../../base_datos/conexiones/pool.conexion');
const { ESTRUCTURA_BASE_CONFIG } = require('./../../plantillas/estructura_base_generator');

/**
 * 📋 CONFIGURACIÓN DE TIPOS DE ARCHIVO SOPORTADOS
 */
const TIPOS_ARCHIVO_EXCEL = {
    estructura_base: {
        nombre: 'Estructura_Base.xlsx',
        descripcion: 'Datos fundamentales: usuarios, ciclos, semestres, estructura portafolios',
        orden: 1,
        requerido: true,
        hojas_esperadas: ['Usuarios', 'Ciclos_Academicos', 'Semestres', 'Estructura_Portafolio'],
        dependencias: [],
        siguiente: 'carga_academica'
    },
    carga_academica: {
        nombre: 'Carga_Academica.xlsx',
        descripcion: 'Información académica: asignaturas, tipos de carga, configuraciones',
        orden: 2,
        requerido: true,
        hojas_esperadas: ['Asignaturas', 'Tipos_Carga_Excel', 'Configuraciones'],
        dependencias: ['estructura_base'],
        siguiente: 'asignaciones'
    },
    asignaciones: {
        nombre: 'Asignaciones.xlsx',
        descripcion: 'Relaciones: docentes-asignaturas, verificadores-docentes',
        orden: 3,
        requerido: true,
        hojas_esperadas: ['Docentes_Asignaturas', 'Verificadores_Docentes', 'Estados_Sistema'],
        dependencias: ['estructura_base', 'carga_academica'],
        siguiente: null
    }
};

/**
 * 📁 CONFIGURACIÓN DE ALMACENAMIENTO MULTER
 */
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(process.cwd(), 'subidas', 'excel', 'pendientes');
        
        // Crear directorio si no existe
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generar nombre único con timestamp
        const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
        const extension = path.extname(file.originalname);
        const nombreBase = path.basename(file.originalname, extension);
        const nombreFinal = `${nombreBase}_${timestamp}${extension}`;
        
        cb(null, nombreFinal);
    }
});

/**
 * 🛡️ FILTRO DE ARCHIVOS
 */
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel' // .xls
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'), false);
    }
};

/**
 * ⚙️ CONFIGURACIÓN DE MULTER
 */
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo
        files: 1 // Solo un archivo por vez
    }
});

/**
 * 📤 Subir archivo Excel para procesamiento
 * POST /api/v1/sistema/excel/subir
 */
async function subirArchivoExcel(req, res) {
    try {
        // Usar middleware de multer
        upload.single('archivo_excel')(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({
                    success: false,
                    message: 'Error al subir archivo',
                    error: err.message,
                    codigo: err.code,
                    timestamp: new Date().toISOString()
                });
            } else if (err) {
                return res.status(400).json({
                    success: false,
                    message: 'Archivo no válido',
                    error: err.message,
                    timestamp: new Date().toISOString()
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No se ha subido ningún archivo',
                    timestamp: new Date().toISOString()
                });
            }

            try {
                // Obtener información adicional del request
                const { tipo_archivo, descripcion = '', forzar_procesamiento = false } = req.body;
                const usuario_id = req.usuario.id; // Del middleware JWT

                console.log(`📤 Archivo subido: ${req.file.originalname} por usuario ${usuario_id}`);

                // Determinar tipo de archivo si no se especificó
                const tipoDetectado = tipo_archivo || detectarTipoArchivo(req.file.originalname);
                
                if (!TIPOS_ARCHIVO_EXCEL[tipoDetectado]) {
                    return res.status(400).json({
                        success: false,
                        message: 'Tipo de archivo no reconocido',
                        archivo: req.file.originalname,
                        tipos_soportados: Object.keys(TIPOS_ARCHIVO_EXCEL),
                        timestamp: new Date().toISOString()
                    });
                }

                // Validar dependencias
                const validacionDependencias = await validarDependencias(tipoDetectado);
                if (!validacionDependencias.valido && !forzar_procesamiento) {
                    return res.status(400).json({
                        success: false,
                        message: 'Dependencias no cumplidas',
                        dependencias_faltantes: validacionDependencias.faltantes,
                        solucion: `Debe cargar primero: ${validacionDependencias.faltantes.join(', ')}`,
                        timestamp: new Date().toISOString()
                    });
                }

                // Leer y validar estructura del archivo Excel
                const validacionArchivo = await validarEstructuraExcel(req.file.path, tipoDetectado);
                
                if (!validacionArchivo.valido) {
                    // Eliminar archivo si la validación falla
                    fs.unlinkSync(req.file.path);
                    
                    return res.status(400).json({
                        success: false,
                        message: 'Estructura del archivo Excel no válida',
                        errores: validacionArchivo.errores,
                        timestamp: new Date().toISOString()
                    });
                }

                // Registrar la carga en la base de datos
                const registroCarga = await registrarCargaAcademica({
                    usuario_id,
                    tipo_archivo: tipoDetectado,
                    nombre_archivo: req.file.originalname,
                    ruta_archivo: req.file.path,
                    tamaño_archivo: req.file.size,
                    descripcion,
                    hojas_detectadas: validacionArchivo.hojas,
                    total_registros: validacionArchivo.total_registros
                });

                res.json({
                    success: true,
                    message: 'Archivo Excel subido exitosamente',
                    data: {
                        id_carga: registroCarga.id,
                        archivo_original: req.file.originalname,
                        archivo_guardado: req.file.filename,
                        tipo_archivo: tipoDetectado,
                        tamaño_mb: (req.file.size / 1024 / 1024).toFixed(2),
                        hojas_detectadas: validacionArchivo.hojas,
                        total_registros: validacionArchivo.total_registros,
                        estado: 'pendiente_procesamiento',
                        siguiente_paso: 'procesar',
                        url_procesamiento: `/api/v1/sistema/excel/procesar/${registroCarga.id}`
                    },
                    warnings: validacionDependencias.warnings || [],
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                // Limpiar archivo en caso de error
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                
                console.error('Error al procesar archivo subido:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error interno al procesar archivo',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

    } catch (error) {
        console.error('Error en subirArchivoExcel:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * 📋 Obtener tipos de archivo soportados
 * GET /api/v1/sistema/excel/tipos
 */
async function obtenerTiposSoportados(req, res) {
    try {
        // Verificar estado de dependencias para cada tipo
        const tiposConEstado = {};
        
        for (const [tipo, config] of Object.entries(TIPOS_ARCHIVO_EXCEL)) {
            const validacionDeps = await validarDependencias(tipo);
            
            tiposConEstado[tipo] = {
                ...config,
                puede_cargar: validacionDeps.valido,
                dependencias_cumplidas: validacionDeps.cumplidas,
                dependencias_faltantes: validacionDeps.faltantes,
                recomendacion: validacionDeps.valido ? 'Listo para cargar' : `Cargar primero: ${validacionDeps.faltantes.join(', ')}`
            };
        }

        res.json({
            success: true,
            message: 'Tipos de archivo soportados',
            data: {
                tipos_archivo: tiposConEstado,
                orden_recomendado: Object.entries(TIPOS_ARCHIVO_EXCEL)
                    .sort((a, b) => a[1].orden - b[1].orden)
                    .map(([tipo, config]) => ({
                        tipo,
                        nombre: config.nombre,
                        orden: config.orden
                    })),
                configuracion_subida: {
                    tamaño_maximo_mb: 10,
                    formatos_soportados: ['.xlsx', '.xls'],
                    archivos_simultaneos: 1
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error al obtener tipos soportados:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * 📥 Descargar plantillas Excel
 * GET /api/v1/sistema/excel/plantillas
 */
async function descargarPlantillas(req, res) {
    try {
        const { tipo } = req.query;
        
        const directorioPlantillas = path.join(process.cwd(), 'plantillas', 'excel');
        
        if (tipo && TIPOS_ARCHIVO_EXCEL[tipo]) {
            // Descargar plantilla específica
            const nombreArchivo = TIPOS_ARCHIVO_EXCEL[tipo].nombre;
            const rutaArchivo = path.join(directorioPlantillas, nombreArchivo);
            
            if (!fs.existsSync(rutaArchivo)) {
                return res.status(404).json({
                    success: false,
                    message: 'Plantilla no encontrada',
                    archivo: nombreArchivo,
                    timestamp: new Date().toISOString()
                });
            }
            
            res.download(rutaArchivo, nombreArchivo, (err) => {
                if (err) {
                    console.error('Error al descargar plantilla:', err);
                    res.status(500).json({
                        success: false,
                        message: 'Error al descargar plantilla',
                        error: err.message
                    });
                }
            });
            
        } else {
            // Listar todas las plantillas disponibles
            const plantillasDisponibles = [];
            
            for (const [tipo, config] of Object.entries(TIPOS_ARCHIVO_EXCEL)) {
                const rutaArchivo = path.join(directorioPlantillas, config.nombre);
                const existe = fs.existsSync(rutaArchivo);
                
                plantillasDisponibles.push({
                    tipo,
                    nombre: config.nombre,
                    descripcion: config.descripcion,
                    orden: config.orden,
                    disponible: existe,
                    url_descarga: existe ? `/api/v1/sistema/excel/plantillas?tipo=${tipo}` : null,
                    tamaño_kb: existe ? Math.round(fs.statSync(rutaArchivo).size / 1024) : null
                });
            }
            
            res.json({
                success: true,
                message: 'Plantillas Excel disponibles',
                data: {
                    plantillas: plantillasDisponibles.sort((a, b) => a.orden - b.orden),
                    total_plantillas: plantillasDisponibles.length,
                    plantillas_disponibles: plantillasDisponibles.filter(p => p.disponible).length
                },
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.error('Error al gestionar plantillas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

// ==========================================
// 🔧 FUNCIONES AUXILIARES
// ==========================================

/**
 * 🔍 Detectar tipo de archivo por nombre
 */
function detectarTipoArchivo(nombreArchivo) {
    const nombreLimpio = nombreArchivo.toLowerCase();
    
    for (const [tipo, config] of Object.entries(TIPOS_ARCHIVO_EXCEL)) {
        if (nombreLimpio.includes(tipo.toLowerCase()) || 
            nombreLimpio.includes(config.nombre.toLowerCase())) {
            return tipo;
        }
    }
    
    // Por defecto, asumir estructura_base si no se puede detectar
    return 'estructura_base';
}

/**
 * ✅ Validar dependencias antes de cargar
 */
async function validarDependencias(tipoArchivo) {
    try {
        const config = TIPOS_ARCHIVO_EXCEL[tipoArchivo];
        const dependencias = config.dependencias || [];
        
        if (dependencias.length === 0) {
            return { valido: true, cumplidas: [], faltantes: [], warnings: [] };
        }
        
        const cumplidas = [];
        const faltantes = [];
        const warnings = [];
        
        for (const dependencia of dependencias) {
            // Verificar si ya se cargó este tipo de archivo
            const sql = `
                SELECT COUNT(*) as total 
                FROM cargas_academicas ca
                INNER JOIN tipos_carga_excel tce ON ca.tipo_carga_id = tce.id
                WHERE tce.nombre = ? AND ca.estado = 'completado'
            `;
            
            const { resultado } = await poolConexion.ejecutarLectura(sql, [dependencia]);
            
            if (resultado[0].total > 0) {
                cumplidas.push(dependencia);
            } else {
                faltantes.push(dependencia);
            }
        }
        
        return {
            valido: faltantes.length === 0,
            cumplidas,
            faltantes,
            warnings
        };
        
    } catch (error) {
        console.error('Error al validar dependencias:', error);
        return {
            valido: false,
            cumplidas: [],
            faltantes: config.dependencias || [],
            warnings: ['Error al verificar dependencias']
        };
    }
}

/**
 * 📊 Validar estructura del archivo Excel
 */
async function validarEstructuraExcel(rutaArchivo, tipoArchivo) {
    try {
        // Leer archivo Excel
        const workbook = XLSX.readFile(rutaArchivo);
        const nombresHojas = workbook.SheetNames;
        
        const config = TIPOS_ARCHIVO_EXCEL[tipoArchivo];
        const hojasEsperadas = config.hojas_esperadas;
        
        const errores = [];
        const hojas = [];
        let totalRegistros = 0;
        
        // Verificar que existan todas las hojas esperadas
        for (const hojaEsperada of hojasEsperadas) {
            if (!nombresHojas.includes(hojaEsperada)) {
                errores.push(`Hoja faltante: ${hojaEsperada}`);
            }
        }
        
        // Validar contenido de cada hoja
        for (const nombreHoja of nombresHojas) {
            if (hojasEsperadas.includes(nombreHoja)) {
                const worksheet = workbook.Sheets[nombreHoja];
                const datos = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                // Verificar que tenga al menos encabezados y una fila de datos
                if (datos.length < 2) {
                    errores.push(`Hoja "${nombreHoja}" está vacía o solo tiene encabezados`);
                } else {
                    const registros = datos.length - 1; // -1 por los encabezados
                    totalRegistros += registros;
                    
                    hojas.push({
                        nombre: nombreHoja,
                        registros: registros,
                        columnas: datos[0].length
                    });
                }
            }
        }
        
        return {
            valido: errores.length === 0,
            errores,
            hojas,
            total_registros: totalRegistros
        };
        
    } catch (error) {
        return {
            valido: false,
            errores: [`Error al leer archivo Excel: ${error.message}`],
            hojas: [],
            total_registros: 0
        };
    }
}

/**
 * 💾 Registrar carga académica en base de datos
 */
async function registrarCargaAcademica(datosRegistro) {
    try {
        // Primero, obtener o crear el tipo de carga Excel
        let tipoId = await obtenerTipoIdCarga(datosRegistro.tipo_archivo);
        
        // Registrar la carga
        const sql = `
            INSERT INTO cargas_academicas (
                ciclo_id, tipo_carga_id, nombre_archivo, ruta_archivo, 
                estado, total_registros, subido_por
            ) VALUES (?, ?, ?, ?, 'pendiente', ?, ?)
        `;
        
        // Por ahora usar ciclo_id = 1, después se mejorará
        const { resultado } = await poolConexion.ejecutarEscritura(sql, [
            1, // ciclo_id temporal
            tipoId,
            datosRegistro.nombre_archivo,
            datosRegistro.ruta_archivo,
            datosRegistro.total_registros,
            datosRegistro.usuario_id
        ]);
        
        return {
            id: resultado.insertId,
            tipo_id: tipoId
        };
        
    } catch (error) {
        console.error('Error al registrar carga académica:', error);
        throw error;
    }
}

/**
 * 🔍 Obtener o crear tipo de carga Excel
 */
async function obtenerTipoIdCarga(tipoArchivo) {
    try {
        // Buscar si existe el tipo
        const sqlBuscar = 'SELECT id FROM tipos_carga_excel WHERE nombre = ?';
        const { resultado } = await poolConexion.ejecutarLectura(sqlBuscar, [tipoArchivo]);
        
        if (resultado.length > 0) {
            return resultado[0].id;
        }
        
        // Crear el tipo si no existe
        const config = TIPOS_ARCHIVO_EXCEL[tipoArchivo];
        const sqlCrear = `
            INSERT INTO tipos_carga_excel (
                nombre, descripcion, columnas_requeridas, activo
            ) VALUES (?, ?, ?, 1)
        `;
        
        const { resultado: resultadoCrear } = await poolConexion.ejecutarEscritura(sqlCrear, [
            tipoArchivo,
            config.descripcion,
            JSON.stringify(config.hojas_esperadas)
        ]);
        
        return resultadoCrear.insertId;
        
    } catch (error) {
        console.error('Error al obtener tipo de carga:', error);
        throw error;
    }
}

// ==========================================
// 📤 EXPORTAR CONTROLADORES
// ==========================================

module.exports = {
    subirArchivoExcel,
    obtenerTiposSoportados,
    descargarPlantillas,
    
    // Exportar configuración para otros módulos
    TIPOS_ARCHIVO_EXCEL,
    upload
};