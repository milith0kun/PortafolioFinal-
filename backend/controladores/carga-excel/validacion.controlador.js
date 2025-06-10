/**
 * ✅ CONTROLADOR DE VALIDACIÓN DE EXCEL
 * 
 * Valida los datos del Excel antes del procesamiento:
 * - Validar tipos de datos
 * - Verificar valores requeridos
 * - Detectar duplicados
 * - Validar referencias foráneas
 * - Generar reporte de errores
 * 
 * Rutas que maneja:
 * POST /api/v1/excel/:id/validar-datos - Validar datos
 * GET /api/v1/excel/:id/errores - Obtener errores
 * GET /api/v1/excel/:id/estadisticas - Estadísticas validación
 */

// TODO: Validaciones personalizadas por tipo de entidad
// TODO: Sugerencias de corrección automática
// TODO: Validación incremental por lotes
// TODO: Reporte detallado con líneas de error
// TODO: Validación de integridad referencial
/**
 * ✅ CONTROLADOR DE VALIDACIÓN DE ARCHIVOS EXCEL
 * 
 * Valida la estructura y contenido de archivos Excel antes del procesamiento:
 * - Validación de estructura (hojas, columnas)
 * - Validación de datos (tipos, formatos, unicidad)
 * - Validación de dependencias entre datos
 * - Generación de reportes de validación
 * 
 * Rutas que maneja:
 * POST /api/v1/sistema/excel/validar/:id - Validar archivo específico
 * GET /api/v1/sistema/excel/preview/:id - Vista previa de datos
 * GET /api/v1/sistema/excel/conflictos/:id - Detectar conflictos
 * 
 * @author Sistema Portafolio Docente UNSAAC
 * @version 1.0.0
 */

const XLSX = require('xlsx');
const moment = require('moment');
const poolConexion = require('../../base_datos/conexiones/pool.conexion');
const { TIPOS_ARCHIVO_EXCEL } = require('./subida.controlador');

/**
 * ✅ Validar archivo Excel específico
 * POST /api/v1/sistema/excel/validar/:id
 */
async function validarArchivoExcel(req, res) {
    try {
        const { id } = req.params;
        const { 
            validacion_profunda = true, 
            incluir_preview = true,
            detectar_conflictos = true 
        } = req.body;

        // Obtener información del archivo
        const informacionArchivo = await obtenerInformacionCarga(id);
        
        if (!informacionArchivo) {
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado',
                timestamp: new Date().toISOString()
            });
        }

        console.log(`✅ Validando archivo: ${informacionArchivo.nombre_archivo}`);

        const resultadoValidacion = await ejecutarValidacionCompleta(
            informacionArchivo, 
            validacion_profunda, 
            incluir_preview, 
            detectar_conflictos
        );

        // Actualizar estado del archivo si hay errores críticos
        if (resultadoValidacion.errores_criticos > 0) {
            await actualizarEstadoValidacion(id, 'validacion_fallida', resultadoValidacion);
        } else if (resultadoValidacion.warnings.length > 0) {
            await actualizarEstadoValidacion(id, 'validacion_con_warnings', resultadoValidacion);
        } else {
            await actualizarEstadoValidacion(id, 'validacion_exitosa', resultadoValidacion);
        }

        res.json({
            success: resultadoValidacion.errores_criticos === 0,
            message: resultadoValidacion.errores_criticos > 0 ? 
                'Validación falló con errores críticos' : 
                'Validación completada',
            data: {
                archivo: {
                    id: informacionArchivo.id,
                    nombre: informacionArchivo.nombre_archivo,
                    tipo: informacionArchivo.tipo_nombre
                },
                validacion: {
                    estado: resultadoValidacion.errores_criticos > 0 ? 'fallida' : 
                            resultadoValidacion.warnings.length > 0 ? 'con_warnings' : 'exitosa',
                    ...resultadoValidacion
                },
                recomendaciones: generarRecomendaciones(resultadoValidacion),
                puede_procesar: resultadoValidacion.errores_criticos === 0
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error al validar archivo Excel:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno durante la validación',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * 👁️ Vista previa de datos del archivo
 * GET /api/v1/sistema/excel/preview/:id
 */
async function obtenerVistaPrevia(req, res) {
    try {
        const { id } = req.params;
        const { hoja, limite = 10 } = req.query;

        const informacionArchivo = await obtenerInformacionCarga(id);
        
        if (!informacionArchivo) {
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado',
                timestamp: new Date().toISOString()
            });
        }

        const vistaPrevia = await generarVistaPrevia(informacionArchivo, hoja, parseInt(limite));

        res.json({
            success: true,
            message: 'Vista previa generada',
            data: {
                archivo: informacionArchivo.nombre_archivo,
                tipo: informacionArchivo.tipo_nombre,
                ...vistaPrevia
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error al generar vista previa:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * ⚠️ Detectar conflictos con datos existentes
 * GET /api/v1/sistema/excel/conflictos/:id
 */
async function detectarConflictos(req, res) {
    try {
        const { id } = req.params;

        const informacionArchivo = await obtenerInformacionCarga(id);
        
        if (!informacionArchivo) {
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado',
                timestamp: new Date().toISOString()
            });
        }

        const conflictos = await analizarConflictos(informacionArchivo);

        res.json({
            success: true,
            message: 'Análisis de conflictos completado',
            data: {
                archivo: informacionArchivo.nombre_archivo,
                ...conflictos
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error al detectar conflictos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

// ==========================================
// 🔧 FUNCIONES DE VALIDACIÓN ESPECÍFICA
// ==========================================

/**
 * 🔍 Ejecutar validación completa
 */
async function ejecutarValidacionCompleta(informacionArchivo, validacionProfunda, incluirPreview, detectarConflictos) {
    const resultado = {
        estructura: null,
        contenido: null,
        dependencias: null,
        conflictos: null,
        preview: null,
        errores_criticos: 0,
        errores_totales: 0,
        warnings: [],
        estadisticas: {}
    };

    try {
        // 1. Validación de estructura
        console.log('📋 Validando estructura del archivo...');
        resultado.estructura = await validarEstructuraArchivo(informacionArchivo);
        resultado.errores_criticos += resultado.estructura.errores_criticos;
        resultado.errores_totales += resultado.estructura.errores_totales;

        if (resultado.estructura.errores_criticos > 0) {
            resultado.warnings.push('Estructura del archivo tiene errores críticos');
            return resultado; // No continuar si hay errores de estructura
        }

        // 2. Validación de contenido
        if (validacionProfunda) {
            console.log('📊 Validando contenido de datos...');
            resultado.contenido = await validarContenidoDatos(informacionArchivo);
            resultado.errores_criticos += resultado.contenido.errores_criticos;
            resultado.errores_totales += resultado.contenido.errores_totales;
            resultado.warnings.push(...resultado.contenido.warnings);
        }

        // 3. Validación de dependencias
        console.log('🔗 Validando dependencias...');
        resultado.dependencias = await validarDependenciasDatos(informacionArchivo);
        resultado.errores_totales += resultado.dependencias.errores;
        resultado.warnings.push(...resultado.dependencias.warnings);

        // 4. Detectar conflictos con BD
        if (detectarConflictos) {
            console.log('⚠️ Detectando conflictos...');
            resultado.conflictos = await analizarConflictos(informacionArchivo);
            resultado.warnings.push(...resultado.conflictos.warnings);
        }

        // 5. Generar vista previa
        if (incluirPreview) {
            console.log('👁️ Generando vista previa...');
            resultado.preview = await generarVistaPrevia(informacionArchivo, null, 5);
        }

        // 6. Estadísticas generales
        resultado.estadisticas = calcularEstadisticasValidacion(resultado);

        console.log('✅ Validación completa finalizada');

    } catch (error) {
        resultado.errores_criticos++;
        resultado.warnings.push(`Error durante validación: ${error.message}`);
        console.error('❌ Error en validación completa:', error);
    }

    return resultado;
}

/**
 * 📋 Validar estructura del archivo
 */
async function validarEstructuraArchivo(informacionArchivo) {
    const resultado = {
        valida: true,
        errores_criticos: 0,
        errores_totales: 0,
        hojas_encontradas: [],
        hojas_faltantes: [],
        columnas_por_hoja: {},
        warnings: []
    };

    try {
        const workbook = XLSX.readFile(informacionArchivo.ruta_archivo);
        const nombresHojas = workbook.SheetNames;
        
        const tipoConfig = TIPOS_ARCHIVO_EXCEL[informacionArchivo.tipo_nombre];
        const hojasEsperadas = tipoConfig.hojas_esperadas;

        // Verificar hojas esperadas
        for (const hojaEsperada of hojasEsperadas) {
            if (nombresHojas.includes(hojaEsperada)) {
                resultado.hojas_encontradas.push(hojaEsperada);
                
                // Validar columnas de cada hoja
                const worksheet = workbook.Sheets[hojaEsperada];
                const datos = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                if (datos.length > 0) {
                    resultado.columnas_por_hoja[hojaEsperada] = {
                        encabezados: datos[0],
                        total_columnas: datos[0].length,
                        filas_con_datos: datos.length - 1
                    };
                    
                    // Validar columnas específicas según el tipo
                    const validacionColumnas = validarColumnasHoja(hojaEsperada, datos[0], informacionArchivo.tipo_nombre);
                    if (!validacionColumnas.valida) {
                        resultado.errores_totales += validacionColumnas.errores.length;
                        resultado.warnings.push(...validacionColumnas.errores);
                    }
                } else {
                    resultado.errores_criticos++;
                    resultado.warnings.push(`Hoja '${hojaEsperada}' está vacía`);
                }
            } else {
                resultado.hojas_faltantes.push(hojaEsperada);
                resultado.errores_criticos++;
                resultado.warnings.push(`Hoja faltante: '${hojaEsperada}'`);
            }
        }

        // Verificar hojas extra
        const hojasExtra = nombresHojas.filter(hoja => 
            !hojasEsperadas.includes(hoja) && 
            !['INSTRUCCIONES', 'Validaciones', 'Instrucciones'].includes(hoja)
        );
        
        if (hojasExtra.length > 0) {
            resultado.warnings.push(`Hojas no esperadas encontradas: ${hojasExtra.join(', ')}`);
        }

        resultado.valida = resultado.errores_criticos === 0;

    } catch (error) {
        resultado.errores_criticos++;
        resultado.valida = false;
        resultado.warnings.push(`Error al leer archivo: ${error.message}`);
    }

    return resultado;
}

/**
 * 📊 Validar contenido de datos
 */
async function validarContenidoDatos(informacionArchivo) {
    const resultado = {
        valida: true,
        errores_criticos: 0,
        errores_totales: 0,
        warnings: [],
        estadisticas_por_hoja: {}
    };

    try {
        const workbook = XLSX.readFile(informacionArchivo.ruta_archivo);
        
        // Validar según el tipo de archivo
        switch (informacionArchivo.tipo_nombre) {
            case 'estructura_base':
                await validarContenidoEstructuraBase(workbook, resultado);
                break;
            case 'carga_academica':
                await validarContenidoCargaAcademica(workbook, resultado);
                break;
            case 'asignaciones':
                await validarContenidoAsignaciones(workbook, resultado);
                break;
        }

        resultado.valida = resultado.errores_criticos === 0;

    } catch (error) {
        resultado.errores_criticos++;
        resultado.valida = false;
        resultado.warnings.push(`Error al validar contenido: ${error.message}`);
    }

    return resultado;
}

/**
 * 👥 Validar contenido específico de Estructura_Base
 */
async function validarContenidoEstructuraBase(workbook, resultado) {
    // Validar hoja Usuarios
    if (workbook.Sheets['Usuarios']) {
        const datosUsuarios = XLSX.utils.sheet_to_json(workbook.Sheets['Usuarios'], { header: 1 });
        const validacionUsuarios = validarDatosUsuarios(datosUsuarios);
        
        resultado.estadisticas_por_hoja.usuarios = validacionUsuarios;
        resultado.errores_totales += validacionUsuarios.errores;
        resultado.warnings.push(...validacionUsuarios.errores_lista);
    }

    // Validar hoja Ciclos_Academicos
    if (workbook.Sheets['Ciclos_Academicos']) {
        const datosCiclos = XLSX.utils.sheet_to_json(workbook.Sheets['Ciclos_Academicos'], { header: 1 });
        const validacionCiclos = validarDatosCiclos(datosCiclos);
        
        resultado.estadisticas_por_hoja.ciclos = validacionCiclos;
        resultado.errores_totales += validacionCiclos.errores;
        resultado.warnings.push(...validacionCiclos.errores_lista);
    }

    // Validar hoja Semestres
    if (workbook.Sheets['Semestres']) {
        const datosSemestres = XLSX.utils.sheet_to_json(workbook.Sheets['Semestres'], { header: 1 });
        const validacionSemestres = validarDatosSemestres(datosSemestres);
        
        resultado.estadisticas_por_hoja.semestres = validacionSemestres;
        resultado.errores_totales += validacionSemestres.errores;
        resultado.warnings.push(...validacionSemestres.errores_lista);
    }

    // Validar hoja Estructura_Portafolio
    if (workbook.Sheets['Estructura_Portafolio']) {
        const datosEstructura = XLSX.utils.sheet_to_json(workbook.Sheets['Estructura_Portafolio'], { header: 1 });
        const validacionEstructura = validarDatosEstructura(datosEstructura);
        
        resultado.estadisticas_por_hoja.estructura = validacionEstructura;
        resultado.errores_totales += validacionEstructura.errores;
        resultado.warnings.push(...validacionEstructura.errores_lista);
    }
}

/**
 * 👥 Validar datos de usuarios
 */
function validarDatosUsuarios(datos) {
    const resultado = {
        total: datos.length - 1, // -1 por encabezados
        errores: 0,
        errores_lista: [],
        correos_duplicados: [],
        roles_invalidos: []
    };

    if (datos.length < 2) {
        resultado.errores_lista.push('Hoja Usuarios vacía');
        return resultado;
    }

    const correosEncontrados = new Set();
    const filas = datos.slice(1); // Sin encabezados

    for (let i = 0; i < filas.length; i++) {
        const fila = filas[i];
        const numeroFila = i + 2;

        // Validar campos obligatorios
        if (!fila[0] || !fila[1]) { // nombres, apellidos
            resultado.errores++;
            resultado.errores_lista.push(`Fila ${numeroFila}: Nombres y apellidos requeridos`);
        }

        // Validar correo
        const correo = fila[2]?.toString().trim().toLowerCase();
        if (!correo || !correo.includes('@')) {
            resultado.errores++;
            resultado.errores_lista.push(`Fila ${numeroFila}: Correo inválido`);
        } else if (correosEncontrados.has(correo)) {
            resultado.errores++;
            resultado.correos_duplicados.push(correo);
            resultado.errores_lista.push(`Fila ${numeroFila}: Correo duplicado - ${correo}`);
        } else {
            correosEncontrados.add(correo);
        }

        // Validar contraseña
        const contrasena = fila[3]?.toString().trim();
        if (!contrasena || contrasena.length < 8) {
            resultado.errores++;
            resultado.errores_lista.push(`Fila ${numeroFila}: Contraseña debe tener al menos 8 caracteres`);
        }

        // Validar rol principal
        const rolPrincipal = fila[5]?.toString().trim().toLowerCase();
        if (!['docente', 'verificador', 'administrador'].includes(rolPrincipal)) {
            resultado.errores++;
            resultado.roles_invalidos.push(rolPrincipal);
            resultado.errores_lista.push(`Fila ${numeroFila}: Rol principal inválido - ${rolPrincipal}`);
        }
    }

    return resultado;
}

/**
 * 📅 Validar datos de ciclos académicos
 */
function validarDatosCiclos(datos) {
    const resultado = {
        total: datos.length - 1,
        errores: 0,
        errores_lista: [],
        nombres_duplicados: [],
        fechas_invalidas: []
    };

    if (datos.length < 2) {
        resultado.errores_lista.push('Hoja Ciclos_Academicos vacía');
        return resultado;
    }

    const nombresEncontrados = new Set();
    const filas = datos.slice(1);

    for (let i = 0; i < filas.length; i++) {
        const fila = filas[i];
        const numeroFila = i + 2;

        // Validar nombre único
        const nombre = fila[0]?.toString().trim();
        if (!nombre) {
            resultado.errores++;
            resultado.errores_lista.push(`Fila ${numeroFila}: Nombre de ciclo requerido`);
        } else if (nombresEncontrados.has(nombre)) {
            resultado.errores++;
            resultado.nombres_duplicados.push(nombre);
            resultado.errores_lista.push(`Fila ${numeroFila}: Nombre de ciclo duplicado - ${nombre}`);
        } else {
            nombresEncontrados.add(nombre);
        }

        // Validar estado
        const estado = fila[2]?.toString().trim().toLowerCase();
        if (!['preparacion', 'activo', 'cerrado', 'archivado'].includes(estado)) {
            resultado.errores++;
            resultado.errores_lista.push(`Fila ${numeroFila}: Estado inválido - ${estado}`);
        }

        // Validar fechas
        const fechaInicio = fila[3]?.toString().trim();
        const fechaFin = fila[4]?.toString().trim();
        
        if (!fechaInicio || !fechaFin) {
            resultado.errores++;
            resultado.errores_lista.push(`Fila ${numeroFila}: Fechas de inicio y fin requeridas`);
        } else {
            const momentoInicio = moment(fechaInicio, 'YYYY-MM-DD', true);
            const momentoFin = moment(fechaFin, 'YYYY-MM-DD', true);
            
            if (!momentoInicio.isValid() || !momentoFin.isValid()) {
                resultado.errores++;
                resultado.fechas_invalidas.push({ fila: numeroFila, fechas: [fechaInicio, fechaFin] });
                resultado.errores_lista.push(`Fila ${numeroFila}: Formato de fecha inválido (usar YYYY-MM-DD)`);
            } else if (momentoFin.isBefore(momentoInicio)) {
                resultado.errores++;
                resultado.errores_lista.push(`Fila ${numeroFila}: Fecha fin debe ser posterior a fecha inicio`);
            }
        }

        // Validar semestre
        const semestre = fila[5]?.toString().trim();
        if (!['I', 'II', 'III'].includes(semestre)) {
            resultado.errores++;
            resultado.errores_lista.push(`Fila ${numeroFila}: Semestre inválido - ${semestre}`);
        }

        // Validar año
        const anio = parseInt(fila[6]);
        if (!anio || anio < 2020 || anio > 2030) {
            resultado.errores++;
            resultado.errores_lista.push(`Fila ${numeroFila}: Año inválido - ${anio}`);
        }
    }

    return resultado;
}

/**
 * 📚 Validar datos de semestres
 */
function validarDatosSemestres(datos) {
    const resultado = {
        total: datos.length - 1,
        errores: 0,
        errores_lista: []
    };

    if (datos.length < 2) {
        resultado.errores_lista.push('Hoja Semestres vacía');
        return resultado;
    }

    const filas = datos.slice(1);

    for (let i = 0; i < filas.length; i++) {
        const fila = filas[i];
        const numeroFila = i + 2;

        // Validar nombre semestre
        const nombre = fila[0]?.toString().trim();
        if (!['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'].includes(nombre)) {
            resultado.errores++;
            resultado.errores_lista.push(`Fila ${numeroFila}: Nombre de semestre inválido - ${nombre}`);
        }

        // Validar que el ciclo esté especificado
        const cicloNombre = fila[1]?.toString().trim();
        if (!cicloNombre) {
            resultado.errores++;
            resultado.errores_lista.push(`Fila ${numeroFila}: Ciclo académico requerido`);
        }
    }

    return resultado;
}

/**
 * 🗂️ Validar datos de estructura
 */
function validarDatosEstructura(datos) {
    const resultado = {
        total: datos.length - 1,
        errores: 0,
        errores_lista: [],
        nombres_duplicados: []
    };

    if (datos.length < 2) {
        resultado.errores_lista.push('Hoja Estructura_Portafolio vacía');
        return resultado;
    }

    const nombresEncontrados = new Set();
    const filas = datos.slice(1);

    for (let i = 0; i < filas.length; i++) {
        const fila = filas[i];
        const numeroFila = i + 2;

        // Validar nombre único
        const nombre = fila[0]?.toString().trim();
        if (!nombre) {
            resultado.errores++;
            resultado.errores_lista.push(`Fila ${numeroFila}: Nombre de estructura requerido`);
        } else if (nombresEncontrados.has(nombre)) {
            resultado.errores++;
            resultado.nombres_duplicados.push(nombre);
            resultado.errores_lista.push(`Fila ${numeroFila}: Nombre duplicado - ${nombre}`);
        } else {
            nombresEncontrados.add(nombre);
        }

        // Validar nivel
        const nivel = parseInt(fila[2]);
        if (!nivel || nivel < 1 || nivel > 5) {
            resultado.errores++;
            resultado.errores_lista.push(`Fila ${numeroFila}: Nivel debe estar entre 1 y 5`);
        }

        // Validar orden
        const orden = parseInt(fila[3]);
        if (!orden || orden < 1) {
            resultado.errores++;
            resultado.errores_lista.push(`Fila ${numeroFila}: Orden debe ser mayor a 0`);
        }
    }

    return resultado;
}

/**
 * 🔗 Validar dependencias entre datos
 */
async function validarDependenciasDatos(informacionArchivo) {
    const resultado = {
        validas: true,
        errores: 0,
        warnings: [],
        dependencias_internas: [],
        dependencias_externas: []
    };

    try {
        const workbook = XLSX.readFile(informacionArchivo.ruta_archivo);

        switch (informacionArchivo.tipo_nombre) {
            case 'estructura_base':
                await validarDependenciasEstructuraBase(workbook, resultado);
                break;
            case 'carga_academica':
                await validarDependenciasCargaAcademica(workbook, resultado);
                break;
            case 'asignaciones':
                await validarDependenciasAsignaciones(workbook, resultado);
                break;
        }

        resultado.validas = resultado.errores === 0;

    } catch (error) {
        resultado.errores++;
        resultado.warnings.push(`Error al validar dependencias: ${error.message}`);
    }

    return resultado;
}

/**
 * 🏗️ Validar dependencias internas de Estructura_Base
 */
async function validarDependenciasEstructuraBase(workbook, resultado) {
    // Validar que los creadores de ciclos existan en usuarios
    if (workbook.Sheets['Usuarios'] && workbook.Sheets['Ciclos_Academicos']) {
        const datosUsuarios = XLSX.utils.sheet_to_json(workbook.Sheets['Usuarios'], { header: 1 });
        const datosCiclos = XLSX.utils.sheet_to_json(workbook.Sheets['Ciclos_Academicos'], { header: 1 });

        const correosUsuarios = new Set();
        datosUsuarios.slice(1).forEach(fila => {
            const correo = fila[2]?.toString().trim().toLowerCase();
            if (correo) correosUsuarios.add(correo);
        });

        datosCiclos.slice(1).forEach((fila, index) => {
            const correoCreador = fila[7]?.toString().trim().toLowerCase();
            if (correoCreador && !correosUsuarios.has(correoCreador)) {
                resultado.errores++;
                resultado.warnings.push(`Ciclo fila ${index + 2}: Creador ${correoCreador} no existe en hoja Usuarios`);
            }
        });
    }

    // Validar que los ciclos referenciados en semestres existan
    if (workbook.Sheets['Ciclos_Academicos'] && workbook.Sheets['Semestres']) {
        const datosCiclos = XLSX.utils.sheet_to_json(workbook.Sheets['Ciclos_Academicos'], { header: 1 });
        const datosSemestres = XLSX.utils.sheet_to_json(workbook.Sheets['Semestres'], { header: 1 });

        const nombresCiclos = new Set();
        datosCiclos.slice(1).forEach(fila => {
            const nombre = fila[0]?.toString().trim();
            if (nombre) nombresCiclos.add(nombre);
        });

        datosSemestres.slice(1).forEach((fila, index) => {
            const cicloNombre = fila[1]?.toString().trim();
            if (cicloNombre && !nombresCiclos.has(cicloNombre)) {
                resultado.errores++;
                resultado.warnings.push(`Semestre fila ${index + 2}: Ciclo ${cicloNombre} no existe en hoja Ciclos_Academicos`);
            }
        });
    }

    // Validar jerarquía de estructura de portafolio
    if (workbook.Sheets['Estructura_Portafolio']) {
        const datosEstructura = XLSX.utils.sheet_to_json(workbook.Sheets['Estructura_Portafolio'], { header: 1 });
        
        const nombresEstructura = new Set();
        datosEstructura.slice(1).forEach(fila => {
            const nombre = fila[0]?.toString().trim();
            if (nombre) nombresEstructura.add(nombre);
        });

        datosEstructura.slice(1).forEach((fila, index) => {
            const carpetaPadre = fila[5]?.toString().trim();
            if (carpetaPadre && !nombresEstructura.has(carpetaPadre)) {
                resultado.errores++;
                resultado.warnings.push(`Estructura fila ${index + 2}: Carpeta padre '${carpetaPadre}' no existe`);
            }
        });
    }
}

/**
 * ⚠️ Analizar conflictos con datos existentes en BD
 */
async function analizarConflictos(informacionArchivo) {
    const resultado = {
        conflictos_encontrados: 0,
        warnings: [],
        detalles: {
            usuarios_existentes: [],
            ciclos_existentes: [],
            estructuras_existentes: []
        }
    };

    try {
        const workbook = XLSX.readFile(informacionArchivo.ruta_archivo);

        switch (informacionArchivo.tipo_nombre) {
            case 'estructura_base':
                await analizarConflictosEstructuraBase(workbook, resultado);
                break;
            case 'carga_academica':
                // TODO: Implementar análisis de conflictos para carga académica
                break;
            case 'asignaciones':
                // TODO: Implementar análisis de conflictos para asignaciones
                break;
        }

    } catch (error) {
        resultado.warnings.push(`Error al analizar conflictos: ${error.message}`);
    }

    return resultado;
}

/**
 * 🏗️ Analizar conflictos específicos de Estructura_Base
 */
async function analizarConflictosEstructuraBase(workbook, resultado) {
    // Verificar usuarios existentes
    if (workbook.Sheets['Usuarios']) {
        const datosUsuarios = XLSX.utils.sheet_to_json(workbook.Sheets['Usuarios'], { header: 1 });
        
        for (let i = 1; i < datosUsuarios.length; i++) {
            const fila = datosUsuarios[i];
            const correo = fila[2]?.toString().trim().toLowerCase();
            
            if (correo) {
                const sqlVerificar = 'SELECT id, nombres, apellidos FROM usuarios WHERE correo = ?';
                const { resultado: usuarioExistente } = await poolConexion.ejecutarLectura(sqlVerificar, [correo]);
                
                if (usuarioExistente.length > 0) {
                    resultado.conflictos_encontrados++;
                    resultado.detalles.usuarios_existentes.push({
                        fila: i + 1,
                        correo,
                        usuario_bd: usuarioExistente[0]
                    });
                    resultado.warnings.push(`Usuario ${correo} ya existe en la base de datos`);
                }
            }
        }
    }

    // Verificar ciclos existentes
    if (workbook.Sheets['Ciclos_Academicos']) {
        const datosCiclos = XLSX.utils.sheet_to_json(workbook.Sheets['Ciclos_Academicos'], { header: 1 });
        
        for (let i = 1; i < datosCiclos.length; i++) {
            const fila = datosCiclos[i];
            const nombre = fila[0]?.toString().trim();
            
            if (nombre) {
                const sqlVerificar = 'SELECT id, estado FROM ciclos_academicos WHERE nombre = ?';
                const { resultado: cicloExistente } = await poolConexion.ejecutarLectura(sqlVerificar, [nombre]);
                
                if (cicloExistente.length > 0) {
                    resultado.conflictos_encontrados++;
                    resultado.detalles.ciclos_existentes.push({
                        fila: i + 1,
                        nombre,
                        ciclo_bd: cicloExistente[0]
                    });
                    resultado.warnings.push(`Ciclo ${nombre} ya existe en la base de datos`);
                }
            }
        }
    }

    // Verificar estructuras existentes
    if (workbook.Sheets['Estructura_Portafolio']) {
        const datosEstructura = XLSX.utils.sheet_to_json(workbook.Sheets['Estructura_Portafolio'], { header: 1 });
        
        for (let i = 1; i < datosEstructura.length; i++) {
            const fila = datosEstructura[i];
            const nombre = fila[0]?.toString().trim();
            
            if (nombre) {
                const sqlVerificar = 'SELECT id, nivel FROM estructura_portafolio_base WHERE nombre = ?';
                const { resultado: estructuraExistente } = await poolConexion.ejecutarLectura(sqlVerificar, [nombre]);
                
                if (estructuraExistente.length > 0) {
                    resultado.conflictos_encontrados++;
                    resultado.detalles.estructuras_existentes.push({
                        fila: i + 1,
                        nombre,
                        estructura_bd: estructuraExistente[0]
                    });
                    resultado.warnings.push(`Estructura '${nombre}' ya existe en la base de datos`);
                }
            }
        }
    }
}

/**
 * 👁️ Generar vista previa de datos
 */
async function generarVistaPrevia(informacionArchivo, hojaEspecifica, limite) {
    const resultado = {
        hojas: [],
        estadisticas: {}
    };

    try {
        const workbook = XLSX.readFile(informacionArchivo.ruta_archivo);
        const hojasAProcesar = hojaEspecifica ? [hojaEspecifica] : workbook.SheetNames;

        for (const nombreHoja of hojasAProcesar) {
            if (workbook.Sheets[nombreHoja] && 
                !['INSTRUCCIONES', 'Validaciones', 'Instrucciones'].includes(nombreHoja)) {
                
                const worksheet = workbook.Sheets[nombreHoja];
                const datos = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                const hojaInfo = {
                    nombre: nombreHoja,
                    total_filas: datos.length,
                    total_columnas: datos.length > 0 ? datos[0].length : 0,
                    encabezados: datos.length > 0 ? datos[0] : [],
                    muestra_datos: datos.slice(1, limite + 1), // Primeras N filas sin encabezados
                    filas_con_datos: Math.max(0, datos.length - 1)
                };

                resultado.hojas.push(hojaInfo);
            }
        }

        // Estadísticas generales
        resultado.estadisticas = {
            total_hojas: resultado.hojas.length,
            total_registros: resultado.hojas.reduce((sum, hoja) => sum + hoja.filas_con_datos, 0),
            hojas_con_datos: resultado.hojas.filter(hoja => hoja.filas_con_datos > 0).length
        };

    } catch (error) {
        resultado.error = `Error al generar vista previa: ${error.message}`;
    }

    return resultado;
}

/**
 * ✅ Validar columnas específicas de cada hoja
 */
function validarColumnasHoja(nombreHoja, encabezados, tipoArchivo) {
    const resultado = {
        valida: true,
        errores: []
    };

    // Definir columnas esperadas por hoja y tipo
    const columnasEsperadas = {
        estructura_base: {
            'Usuarios': ['Nombres*', 'Apellidos*', 'Correo Electrónico*', 'Contraseña*', 'Teléfono', 'Rol Principal*', 'Roles Adicionales', 'Activo*'],
            'Ciclos_Academicos': ['Nombre del Ciclo*', 'Descripción', 'Estado*', 'Fecha Inicio*', 'Fecha Fin*', 'Semestre*', 'Año*', 'Creado Por (Correo)*'],
            'Semestres': ['Nombre Semestre*', 'Ciclo Académico*', 'Fecha Inicio', 'Fecha Fin', 'Activo*'],
            'Estructura_Portafolio': ['Nombre Carpeta/Sección*', 'Descripción', 'Nivel*', 'Orden*', 'Requiere Crédito', 'Carpeta Padre', 'Para Presentación*', 'Icono', 'Color', 'Activo*']
        }
    };

    if (columnasEsperadas[tipoArchivo] && columnasEsperadas[tipoArchivo][nombreHoja]) {
        const esperadas = columnasEsperadas[tipoArchivo][nombreHoja];
        
        // Verificar columnas obligatorias
        for (const columnaEsperada of esperadas) {
            if (!encabezados.includes(columnaEsperada)) {
                resultado.errores.push(`Columna faltante en ${nombreHoja}: '${columnaEsperada}'`);
            }
        }

        resultado.valida = resultado.errores.length === 0;
    }

    return resultado;
}

/**
 * 💡 Generar recomendaciones basadas en validación
 */
function generarRecomendaciones(resultadoValidacion) {
    const recomendaciones = [];

    if (resultadoValidacion.errores_criticos > 0) {
        recomendaciones.push({
            tipo: 'critico',
            mensaje: 'Corrija los errores críticos antes de procesar el archivo',
            acciones: [
                'Verifique que todas las hojas requeridas estén presentes',
                'Asegúrese de que las columnas obligatorias existan',
                'Corrija los errores de estructura del archivo'
            ]
        });
    }

    if (resultadoValidacion.conflictos && resultadoValidacion.conflictos.conflictos_encontrados > 0) {
        recomendaciones.push({
            tipo: 'advertencia',
            mensaje: 'Se encontraron datos que ya existen en la base de datos',
            acciones: [
                'Revise los conflictos detectados',
                'Considere actualizar los datos existentes en lugar de duplicarlos',
                'Use la opción "continuar con errores" si desea omitir duplicados'
            ]
        });
    }

    if (resultadoValidacion.errores_totales > 0 && resultadoValidacion.errores_criticos === 0) {
        recomendaciones.push({
            tipo: 'mejora',
            mensaje: 'Se pueden procesar los datos pero hay errores menores',
            acciones: [
                'Corrija los errores de validación para un procesamiento óptimo',
                'Revise los formatos de fecha y email',
                'Verifique que los datos requeridos estén completos'
            ]
        });
    }

    if (recomendaciones.length === 0) {
        recomendaciones.push({
            tipo: 'exito',
            mensaje: 'El archivo está listo para procesar',
            acciones: [
                'Puede proceder con el procesamiento del archivo',
                'Todos los datos han sido validados correctamente'
            ]
        });
    }

    return recomendaciones;
}

/**
 * 📊 Calcular estadísticas de validación
 */
function calcularEstadisticasValidacion(resultado) {
    return {
        total_validaciones: Object.keys(resultado).filter(key => 
            resultado[key] && typeof resultado[key] === 'object'
        ).length,
        estado_estructura: resultado.estructura ? 
            (resultado.estructura.errores_criticos === 0 ? 'valida' : 'invalida') : 'no_validada',
        estado_contenido: resultado.contenido ? 
            (resultado.contenido.errores_criticos === 0 ? 'valido' : 'invalido') : 'no_validado',
        estado_dependencias: resultado.dependencias ? 
            (resultado.dependencias.errores === 0 ? 'validas' : 'invalidas') : 'no_validadas',
        conflictos_detectados: resultado.conflictos ? 
            resultado.conflictos.conflictos_encontrados : 0,
        total_warnings: resultado.warnings.length,
        puntuacion_calidad: calcularPuntuacionCalidad(resultado)
    };
}

/**
 * 🏆 Calcular puntuación de calidad
 */
function calcularPuntuacionCalidad(resultado) {
    let puntuacion = 100;

    // Penalizar errores críticos
    puntuacion -= resultado.errores_criticos * 30;

    // Penalizar errores totales
    puntuacion -= resultado.errores_totales * 5;

    // Penalizar warnings
    puntuacion -= resultado.warnings.length * 2;

    // Penalizar conflictos
    if (resultado.conflictos) {
        puntuacion -= resultado.conflictos.conflictos_encontrados * 3;
    }

    return Math.max(0, Math.min(100, puntuacion));
}

// ==========================================
// 🔧 FUNCIONES AUXILIARES
// ==========================================

/**
 * 📊 Obtener información de carga
 */
async function obtenerInformacionCarga(id) {
    const sql = `
        SELECT 
            ca.*,
            tce.nombre as tipo_nombre,
            tce.descripcion as tipo_descripcion
        FROM cargas_academicas ca
        INNER JOIN tipos_carga_excel tce ON ca.tipo_carga_id = tce.id
        WHERE ca.id = ?
    `;

    const { resultado } = await poolConexion.ejecutarLectura(sql, [id]);
    return resultado.length > 0 ? resultado[0] : null;
}

/**
 * ⏰ Actualizar estado de validación
 */
async function actualizarEstadoValidacion(id, estado, resultadoValidacion) {
    const sql = `
        UPDATE cargas_academicas 
        SET observaciones = ?,
            errores = ?
        WHERE id = ?
    `;

    const observaciones = `Validación: ${estado} - ${resultadoValidacion.errores_totales} errores, ${resultadoValidacion.warnings.length} warnings`;
    const errores = JSON.stringify({
        estado_validacion: estado,
        errores_criticos: resultadoValidacion.errores_criticos,
        errores_totales: resultadoValidacion.errores_totales,
        warnings: resultadoValidacion.warnings.slice(0, 10) // Solo primeros 10
    });

    await poolConexion.ejecutarEscritura(sql, [observaciones, errores, id]);
}

/**
 * 🔄 Placeholder para otros tipos (implementar después)
 */
async function validarContenidoCargaAcademica(workbook, resultado) {
    resultado.warnings.push('Validación de Carga_Academica.xlsx en desarrollo');
}

async function validarContenidoAsignaciones(workbook, resultado) {
    resultado.warnings.push('Validación de Asignaciones.xlsx en desarrollo');
}

async function validarDependenciasCargaAcademica(workbook, resultado) {
    resultado.warnings.push('Validación de dependencias para Carga_Academica.xlsx en desarrollo');
}

async function validarDependenciasAsignaciones(workbook, resultado) {
    resultado.warnings.push('Validación de dependencias para Asignaciones.xlsx en desarrollo');
}

// ==========================================
// 📤 EXPORTAR CONTROLADORES
// ==========================================

module.exports = {
    validarArchivoExcel,
    obtenerVistaPrevia,
    detectarConflictos
};