/**
 * ⚙️ CONTROLADOR DE PROCESAMIENTO DE EXCEL
 * 
 * Procesa los datos del Excel y los inserta en la base de datos:
 * - Mapeo de columnas
 * - Transformación de datos
 * - Inserción en lotes
 * - Manejo de duplicados
 * - Rollback en caso de error
 * 
 * Rutas que maneja:
 * POST /api/v1/excel/:id/procesar - Procesar datos
 * GET /api/v1/excel/:id/progreso - Ver progreso
 * POST /api/v1/excel/:id/rollback - Deshacer cambios
 */

// TODO: Procesamiento asíncrono con progress tracking
// TODO: Transacciones para garantizar integridad
// TODO: Manejo inteligente de duplicados
// TODO: Mapeo flexible de columnas
// TODO: Logs detallados del procesamiento
/**
 * 📊 ARCHIVO 1: ESTRUCTURA_BASE.XLSX - Sistema Portafolio Docente UNSAAC
 * 
 * Primer archivo Excel para carga masiva del sistema.
 * Contiene los datos fundamentales que deben cargarse PRIMERO:
 * 
 * 🏗️ ESTRUCTURA DEL ARCHIVO:
 * - Hoja 1: Usuarios (docentes, verificadores, administradores)
 * - Hoja 2: Ciclos académicos
 * - Hoja 3: Semestres por ciclo
 * - Hoja 4: Estructura base de portafolios
 * 
 * Este archivo debe procesarse ANTES que los otros dos archivos.
 */

progreso: {
    porcentaje: progreso,
    total_registros: registro.total_registros,
    procesados: registro.registros_procesados,
    fallidos: registro.registros_fallidos,
    pendientes: registro.total_registros - registro.registros_procesados
},
tiempos: {
    subido: tiempoSubida.format('DD/MM/YYYY HH:mm:ss'),
    procesado: tiempoProcesamiento ? tiempoProcesamiento.format('DD/MM/YYYY HH:mm:ss') : null,
    transcurrido: tiempoActual.diff(tiempoSubida, 'minutes') + ' minutos',
    duracion_procesamiento: tiempoProcesamiento ? 
        tiempoProcesamiento.diff(tiempoSubida, 'seconds') + ' segundos' : null
},
subido_por: registro.subido_por,
errores: registro.errores ? JSON.parse(registro.errores) : null,
resumen: registro.resumen ? JSON.parse(registro.resumen) : null,
observaciones: registro.observaciones
},
timestamp: new Date().toISOString()
});

} catch (error) {
console.error('Error al obtener estado de procesamiento:', error);
res.status(500).json({
success: false,
message: 'Error interno del servidor',
error: error.message,
timestamp: new Date().toISOString()
});
}
}

/**
* 📄 Descargar reporte de procesamiento
* GET /api/v1/sistema/excel/reporte/:id
*/
async function descargarReporteProcesamiento(req, res) {
try {
const { id } = req.params;
const { formato = 'json' } = req.query;

const informacion = await obtenerInformacionCompletaCarga(id);

if (!informacion) {
return res.status(404).json({
success: false,
message: 'Reporte no encontrado',
timestamp: new Date().toISOString()
});
}

if (formato === 'excel') {
// Generar reporte Excel
const reporteExcel = await generarReporteExcel(informacion);
res.download(reporteExcel.ruta, reporteExcel.nombre);
} else {
// Devolver JSON detallado
res.json({
success: true,
message: 'Reporte de procesamiento',
data: informacion,
timestamp: new Date().toISOString()
});
}

} catch (error) {
console.error('Error al generar reporte:', error);
res.status(500).json({
success: false,
message: 'Error interno del servidor',
error: error.message,
timestamp: new Date().toISOString()
});
}
}

// ==========================================
// 🔧 FUNCIONES DE PROCESAMIENTO ESPECÍFICO
// ==========================================

/**
* 🏗️ Procesar archivo Estructura_Base.xlsx
*/
async function procesarEstructuraBase(informacionArchivo, validarSolo, continuarConErrores) {
console.log('🏗️ Procesando Estructura_Base.xlsx');

const workbook = XLSX.readFile(informacionArchivo.ruta_archivo);
const resultado = {
total_registros: 0,
procesados_exitosos: 0,
errores_totales: 0,
errores_criticos: 0,
errores_principales: [],
warnings: [],
detalles_hojas: {}
};

try {
// Procesar en orden: Usuarios → Ciclos → Semestres → Estructura

// 1. USUARIOS
console.log('👥 Procesando usuarios...');
const resultadoUsuarios = await procesarHojaUsuarios(workbook, validarSolo);
resultado.detalles_hojas.usuarios = resultadoUsuarios;
resultado.total_registros += resultadoUsuarios.total;
resultado.procesados_exitosos += resultadoUsuarios.exitosos;
resultado.errores_totales += resultadoUsuarios.errores;

// 2. CICLOS ACADÉMICOS
console.log('📅 Procesando ciclos académicos...');
const resultadoCiclos = await procesarHojaCiclos(workbook, validarSolo);
resultado.detalles_hojas.ciclos = resultadoCiclos;
resultado.total_registros += resultadoCiclos.total;
resultado.procesados_exitosos += resultadoCiclos.exitosos;
resultado.errores_totales += resultadoCiclos.errores;

// 3. SEMESTRES
console.log('📚 Procesando semestres...');
const resultadoSemestres = await procesarHojaSemestres(workbook, validarSolo);
resultado.detalles_hojas.semestres = resultadoSemestres;
resultado.total_registros += resultadoSemestres.total;
resultado.procesados_exitosos += resultadoSemestres.exitosos;
resultado.errores_totales += resultadoSemestres.errores;

// 4. ESTRUCTURA PORTAFOLIO
console.log('🗂️ Procesando estructura de portafolio...');
const resultadoEstructura = await procesarHojaEstructura(workbook, validarSolo);
resultado.detalles_hojas.estructura = resultadoEstructura;
resultado.total_registros += resultadoEstructura.total;
resultado.procesados_exitosos += resultadoEstructura.exitosos;
resultado.errores_totales += resultadoEstructura.errores;

// Compilar errores principales
resultado.errores_principales = [
...resultadoUsuarios.errores_lista,
...resultadoCiclos.errores_lista,
...resultadoSemestres.errores_lista,
...resultadoEstructura.errores_lista
].slice(0, 10); // Solo los primeros 10

console.log('✅ Estructura_Base.xlsx procesado completamente');

} catch (error) {
resultado.errores_criticos++;
resultado.errores_principales.push(`Error crítico: ${error.message}`);
console.error('❌ Error crítico en procesamiento:', error);
}

return resultado;
}

/**
* 👥 Procesar hoja de usuarios
*/
async function procesarHojaUsuarios(workbook, validarSolo) {
const worksheet = workbook.Sheets['Usuarios'];
if (!worksheet) {
return { total: 0, exitosos: 0, errores: 1, errores_lista: ['Hoja Usuarios no encontrada'] };
}

const datos = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
if (datos.length < 2) {
return { total: 0, exitosos: 0, errores: 1, errores_lista: ['Hoja Usuarios está vacía'] };
}

const encabezados = datos[0];
const filas = datos.slice(1).filter(fila => fila.some(celda => celda)); // Filtrar filas vacías

const resultado = {
total: filas.length,
exitosos: 0,
errores: 0,
errores_lista: [],
detalles: []
};

for (let i = 0; i < filas.length; i++) {
const fila = filas[i];
const numeroFila = i + 2; // +2 porque empezamos en fila 1 (índice 0) y saltamos encabezados

try {
// Mapear datos de la fila
const usuario = {
nombres: fila[0]?.toString().trim(),
apellidos: fila[1]?.toString().trim(),
correo: fila[2]?.toString().trim().toLowerCase(),
contrasena: fila[3]?.toString().trim(),
telefono: fila[4]?.toString().trim(),
rol_principal: fila[5]?.toString().trim().toLowerCase(),
roles_adicionales: fila[6]?.toString().trim(),
activo: parseInt(fila[7]) || 0
};

// Validaciones básicas
const erroresFila = [];

if (!usuario.nombres) erroresFila.push('Nombres requerido');
if (!usuario.apellidos) erroresFila.push('Apellidos requerido');
if (!usuario.correo || !usuario.correo.includes('@')) erroresFila.push('Correo inválido');
if (!usuario.contrasena || usuario.contrasena.length < 8) erroresFila.push('Contraseña muy corta');
if (!['docente', 'verificador', 'administrador'].includes(usuario.rol_principal)) {
erroresFila.push('Rol principal inválido');
}

if (erroresFila.length > 0) {
resultado.errores++;
resultado.errores_lista.push(`Fila ${numeroFila}: ${erroresFila.join(', ')}`);
continue;
}

if (!validarSolo) {
// Verificar si el correo ya existe
const sqlVerificar = 'SELECT id FROM usuarios WHERE correo = ?';
const { resultado: usuarioExistente } = await poolConexion.ejecutarLectura(sqlVerificar, [usuario.correo]);

if (usuarioExistente.length > 0) {
    resultado.errores++;
    resultado.errores_lista.push(`Fila ${numeroFila}: Correo ${usuario.correo} ya existe`);
    continue;
}

// Encriptar contraseña
const contrasenaEncriptada = await bcrypt.hash(usuario.contrasena, 12);

// Insertar usuario
const sqlUsuario = `
    INSERT INTO usuarios (nombres, apellidos, correo, contrasena, telefono, activo)
    VALUES (?, ?, ?, ?, ?, ?)
`;

const { resultado: resultadoUsuario } = await poolConexion.ejecutarEscritura(sqlUsuario, [
    usuario.nombres,
    usuario.apellidos,
    usuario.correo,
    contrasenaEncriptada,
    usuario.telefono || null,
    usuario.activo
]);

const usuarioId = resultadoUsuario.insertId;

// Insertar rol principal
await insertarRolUsuario(usuarioId, usuario.rol_principal, usuarioId);

// Insertar roles adicionales si existen
if (usuario.roles_adicionales) {
    const rolesAdicionales = usuario.roles_adicionales.split(',').map(r => r.trim().toLowerCase());
    for (const rol of rolesAdicionales) {
        if (['docente', 'verificador', 'administrador'].includes(rol) && rol !== usuario.rol_principal) {
            await insertarRolUsuario(usuarioId, rol, usuarioId);
        }
    }
}
}

resultado.exitosos++;
resultado.detalles.push({
fila: numeroFila,
correo: usuario.correo,
rol: usuario.rol_principal,
estado: 'procesado'
});

} catch (error) {
resultado.errores++;
resultado.errores_lista.push(`Fila ${numeroFila}: Error - ${error.message}`);
}
}

return resultado;
}

/**
* 📅 Procesar hoja de ciclos académicos
*/
async function procesarHojaCiclos(workbook, validarSolo) {
const worksheet = workbook.Sheets['Ciclos_Academicos'];
if (!worksheet) {
return { total: 0, exitosos: 0, errores: 1, errores_lista: ['Hoja Ciclos_Academicos no encontrada'] };
}

const datos = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
if (datos.length < 2) {
return { total: 0, exitosos: 0, errores: 1, errores_lista: ['Hoja Ciclos_Academicos está vacía'] };
}

const filas = datos.slice(1).filter(fila => fila.some(celda => celda));

const resultado = {
total: filas.length,
exitosos: 0,
errores: 0,
errores_lista: [],
detalles: []
};

for (let i = 0; i < filas.length; i++) {
const fila = filas[i];
const numeroFila = i + 2;

try {
const ciclo = {
nombre: fila[0]?.toString().trim(),
descripcion: fila[1]?.toString().trim(),
estado: fila[2]?.toString().trim().toLowerCase(),
fecha_inicio: fila[3]?.toString().trim(),
fecha_fin: fila[4]?.toString().trim(),
semestre_actual: fila[5]?.toString().trim(),
anio_actual: parseInt(fila[6]),
correo_creador: fila[7]?.toString().trim().toLowerCase()
};

// Validaciones
const erroresFila = [];

if (!ciclo.nombre) erroresFila.push('Nombre requerido');
if (!['preparacion', 'activo', 'cerrado', 'archivado'].includes(ciclo.estado)) {
erroresFila.push('Estado inválido');
}
if (!ciclo.fecha_inicio || !ciclo.fecha_fin) erroresFila.push('Fechas requeridas');
if (!['I', 'II', 'III'].includes(ciclo.semestre_actual)) erroresFila.push('Semestre inválido');
if (!ciclo.anio_actual || ciclo.anio_actual < 2020) erroresFila.push('Año inválido');

if (erroresFila.length > 0) {
resultado.errores++;
resultado.errores_lista.push(`Fila ${numeroFila}: ${erroresFila.join(', ')}`);
continue;
}

if (!validarSolo) {
// Verificar que el creador exista
const sqlCreador = 'SELECT id FROM usuarios WHERE correo = ?';
const { resultado: creador } = await poolConexion.ejecutarLectura(sqlCreador, [ciclo.correo_creador]);

if (creador.length === 0) {
    resultado.errores++;
    resultado.errores_lista.push(`Fila ${numeroFila}: Creador ${ciclo.correo_creador} no existe`);
    continue;
}

// Verificar que el ciclo no exista
const sqlVerificar = 'SELECT id FROM ciclos_academicos WHERE nombre = ?';
const { resultado: cicloExistente } = await poolConexion.ejecutarLectura(sqlVerificar, [ciclo.nombre]);

if (cicloExistente.length > 0) {
    resultado.errores++;
    resultado.errores_lista.push(`Fila ${numeroFila}: Ciclo ${ciclo.nombre} ya existe`);
    continue;
}

// Insertar ciclo académico
const sqlCiclo = `
    INSERT INTO ciclos_academicos (
        nombre, descripcion, estado, fecha_inicio, fecha_fin,
        semestre_actual, anio_actual, creado_por
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

await poolConexion.ejecutarEscritura(sqlCiclo, [
    ciclo.nombre,
    ciclo.descripcion,
    ciclo.estado,
    ciclo.fecha_inicio,
    ciclo.fecha_fin,
    ciclo.semestre_actual,
    ciclo.anio_actual,
    creador[0].id
]);
}

resultado.exitosos++;
resultado.detalles.push({
fila: numeroFila,
nombre: ciclo.nombre,
estado: ciclo.estado,
estado: 'procesado'
});

} catch (error) {
resultado.errores++;
resultado.errores_lista.push(`Fila ${numeroFila}: Error - ${error.message}`);
}
}

return resultado;
}

/**
* 📚 Procesar hoja de semestres
*/
async function procesarHojaSemestres(workbook, validarSolo) {
const worksheet = workbook.Sheets['Semestres'];
if (!worksheet) {
return { total: 0, exitosos: 0, errores: 1, errores_lista: ['Hoja Semestres no encontrada'] };
}

const datos = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
if (datos.length < 2) {
return { total: 0, exitosos: 0, errores: 1, errores_lista: ['Hoja Semestres está vacía'] };
}

const filas = datos.slice(1).filter(fila => fila.some(celda => celda));

const resultado = {
total: filas.length,
exitosos: 0,
errores: 0,
errores_lista: [],
detalles: []
};

for (let i = 0; i < filas.length; i++) {
const fila = filas[i];
const numeroFila = i + 2;

try {
const semestre = {
nombre: fila[0]?.toString().trim(),
ciclo_nombre: fila[1]?.toString().trim(),
fecha_inicio: fila[2]?.toString().trim(),
fecha_fin: fila[3]?.toString().trim(),
activo: parseInt(fila[4]) || 0
};

// Validaciones
const erroresFila = [];

if (!semestre.nombre) erroresFila.push('Nombre requerido');
if (!semestre.ciclo_nombre) erroresFila.push('Ciclo requerido');

if (erroresFila.length > 0) {
resultado.errores++;
resultado.errores_lista.push(`Fila ${numeroFila}: ${erroresFila.join(', ')}`);
continue;
}

if (!validarSolo) {
// Verificar que el ciclo exista
const sqlCiclo = 'SELECT id FROM ciclos_academicos WHERE nombre = ?';
const { resultado: ciclo } = await poolConexion.ejecutarLectura(sqlCiclo, [semestre.ciclo_nombre]);

if (ciclo.length === 0) {
    resultado.errores++;
    resultado.errores_lista.push(`Fila ${numeroFila}: Ciclo ${semestre.ciclo_nombre} no existe`);
    continue;
}

// Verificar duplicado
const sqlVerificar = 'SELECT id FROM semestres WHERE nombre = ? AND ciclo_id = ?';
const { resultado: semestreExistente } = await poolConexion.ejecutarLectura(sqlVerificar, [
    semestre.nombre, ciclo[0].id
]);

if (semestreExistente.length > 0) {
    resultado.errores++;
    resultado.errores_lista.push(`Fila ${numeroFila}: Semestre ${semestre.nombre} ya existe en ciclo ${semestre.ciclo_nombre}`);
    continue;
}

// Insertar semestre
const sqlSemestre = `
    INSERT INTO semestres (nombre, ciclo_id, fecha_inicio, fecha_fin, activo)
    VALUES (?, ?, ?, ?, ?)
`;

await poolConexion.ejecutarEscritura(sqlSemestre, [
    semestre.nombre,
    ciclo[0].id,
    semestre.fecha_inicio || null,
    semestre.fecha_fin || null,
    semestre.activo
]);
}

resultado.exitosos++;
resultado.detalles.push({
fila: numeroFila,
nombre: semestre.nombre,
ciclo: semestre.ciclo_nombre,
estado: 'procesado'
});

} catch (error) {
resultado.errores++;
resultado.errores_lista.push(`Fila ${numeroFila}: Error - ${error.message}`);
}
}

return resultado;
}

/**
* 🗂️ Procesar hoja de estructura de portafolio
*/
async function procesarHojaEstructura(workbook, validarSolo) {
const worksheet = workbook.Sheets['Estructura_Portafolio'];
if (!worksheet) {
return { total: 0, exitosos: 0, errores: 1, errores_lista: ['Hoja Estructura_Portafolio no encontrada'] };
}

const datos = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
if (datos.length < 2) {
return { total: 0, exitosos: 0, errores: 1, errores_lista: ['Hoja Estructura_Portafolio está vacía'] };
}

const filas = datos.slice(1).filter(fila => fila.some(celda => celda));

const resultado = {
total: filas.length,
exitosos: 0,
errores: 0,
errores_lista: [],
detalles: []
};

// Procesar por niveles (primero nivel 1, luego 2, etc.)
const filasPorNivel = {};

for (let i = 0; i < filas.length; i++) {
const fila = filas[i];
const nivel = parseInt(fila[2]) || 1;

if (!filasPorNivel[nivel]) {
filasPorNivel[nivel] = [];
}

filasPorNivel[nivel].push({ fila, index: i });
}

// Procesar niveles en orden
const nivelesOrdenados = Object.keys(filasPorNivel).sort((a, b) => parseInt(a) - parseInt(b));

for (const nivelStr of nivelesOrdenados) {
const nivel = parseInt(nivelStr);
const filasNivel = filasPorNivel[nivel];

for (const { fila, index } of filasNivel) {
const numeroFila = index + 2;

try {
const estructura = {
    nombre: fila[0]?.toString().trim(),
    descripcion: fila[1]?.toString().trim(),
    nivel: parseInt(fila[2]) || 1,
    orden: parseInt(fila[3]) || 1,
    requiere_credito: parseInt(fila[4]) || 0,
    carpeta_padre: fila[5]?.toString().trim(),
    pertenece_presentacion: parseInt(fila[6]) || 0,
    icono: fila[7]?.toString().trim() || 'folder',
    color: fila[8]?.toString().trim() || '#007bff',
    activo: parseInt(fila[9]) || 1
};

// Validaciones
const erroresFila = [];

if (!estructura.nombre) erroresFila.push('Nombre requerido');
if (estructura.nivel < 1 || estructura.nivel > 5) erroresFila.push('Nivel debe estar entre 1 y 5');

if (erroresFila.length > 0) {
    resultado.errores++;
    resultado.errores_lista.push(`Fila ${numeroFila}: ${erroresFila.join(', ')}`);
    continue;
}

if (!validarSolo) {
    let carpetaPadreId = null;

    // Buscar carpeta padre si se especificó
    if (estructura.carpeta_padre) {
        const sqlPadre = 'SELECT id FROM estructura_portafolio_base WHERE nombre = ?';
        const { resultado: padre } = await poolConexion.ejecutarLectura(sqlPadre, [estructura.carpeta_padre]);

        if (padre.length === 0) {
            resultado.errores++;
            resultado.errores_lista.push(`Fila ${numeroFila}: Carpeta padre '${estructura.carpeta_padre}' no encontrada`);
            continue;
        }

        carpetaPadreId = padre[0].id;
    }

    // Verificar duplicado
    const sqlVerificar = 'SELECT id FROM estructura_portafolio_base WHERE nombre = ?';
    const { resultado: existente } = await poolConexion.ejecutarLectura(sqlVerificar, [estructura.nombre]);

    if (existente.length > 0) {
        resultado.errores++;
        resultado.errores_lista.push(`Fila ${numeroFila}: Estructura '${estructura.nombre}' ya existe`);
        continue;
    }

    // Insertar estructura
    const sqlEstructura = `
        INSERT INTO estructura_portafolio_base (
            nombre, descripcion, nivel, orden, requiere_credito,
            carpeta_padre_id, pertenece_presentacion, icono, color, activo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await poolConexion.ejecutarEscritura(sqlEstructura, [
        estructura.nombre,
        estructura.descripcion,
        estructura.nivel,
        estructura.orden,
        estructura.requiere_credito,
        carpetaPadreId,
        estructura.pertenece_presentacion,
        estructura.icono,
        estructura.color,
        estructura.activo
    ]);
}

resultado.exitosos++;
resultado.detalles.push({
    fila: numeroFila,
    nombre: estructura.nombre,
    nivel: estructura.nivel,
    estado: 'procesado'
});

} catch (error) {
resultado.errores++;
resultado.errores_lista.push(`Fila ${numeroFila}: Error - ${error.message}`);
}
}
}

return resultado;
}

// ==========================================
// 🔧 FUNCIONES AUXILIARES
// ==========================================

/**
* 👤 Insertar rol de usuario
*/
async function insertarRolUsuario(usuarioId, rol, asignadoPor) {
const sql = `
INSERT INTO usuarios_roles (usuario_id, rol, activo, asignado_por)
VALUES (?, ?, 1, ?)
ON DUPLICATE KEY UPDATE activo = 1
`;

await poolConexion.ejecutarEscritura(sql, [usuarioId, rol, asignadoPor]);
}

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
* ⏰ Actualizar estado de carga
*/
async function actualizarEstadoCarga(id, estado, usuarioId, datosExtra = null) {
const sql = `
UPDATE cargas_academicas 
SET estado = ?, 
fecha_procesamiento = CURRENT_TIMESTAMP,
errores = ?,
observaciones = ?
WHERE id = ?
`;

await poolConexion.ejecutarEscritura(sql, [
estado,
datosExtra ? JSON.stringify(datosExtra) : null,
`Actualizado por usuario ${usuarioId}`,
id
]);
}

/**
* ✅ Finalizar procesamiento
*/
async function finalizarProcesamiento(id, estadoFinal, resultado) {
const sql = `
UPDATE cargas_academicas 
SET estado = ?,
registros_procesados = ?,
registros_fallidos = ?,
errores = ?,
resumen = ?,
fecha_procesamiento = CURRENT_TIMESTAMP
WHERE id = ?
`;

await poolConexion.ejecutarEscritura(sql, [
estadoFinal,
resultado.procesados_exitosos,
resultado.errores_totales,
JSON.stringify({
errores_principales: resultado.errores_principales,
warnings: resultado.warnings
}),
JSON.stringify({
total_registros: resultado.total_registros,
procesados_exitosos: resultado.procesados_exitosos,
errores_totales: resultado.errores_totales,
errores_criticos: resultado.errores_criticos,
detalles_hojas: resultado.detalles_hojas
}),
id
]);
}

/**
* 📋 Obtener información completa de carga
*/
async function obtenerInformacionCompletaCarga(id) {
const sql = `
SELECT 
ca.*,
tce.nombre as tipo_nombre,
tce.descripcion as tipo_descripcion,
CONCAT(u.nombres, ' ', u.apellidos) as subido_por_nombre
FROM cargas_academicas ca
INNER JOIN tipos_carga_excel tce ON ca.tipo_carga_id = tce.id
INNER JOIN usuarios u ON ca.subido_por = u.id
WHERE ca.id = ?
`;

const { resultado } = await poolConexion.ejecutarLectura(sql, [id]);

if (resultado.length > 0) {
const registro = resultado[0];
return {
...registro,
errores: registro.errores ? JSON.parse(registro.errores) : null,
resumen: registro.resumen ? JSON.parse(registro.resumen) : null
};
}

return null;
}

/**
* 📊 Generar reporte Excel
*/
async function generarReporteExcel(informacion) {
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

try {
const workbook = XLSX.utils.book_new();

// Hoja 1: Resumen del procesamiento
const resumen = informacion.resumen ? JSON.parse(informacion.resumen) : {};
const resumenData = [
['REPORTE DE PROCESAMIENTO'],
[''],
['Archivo:', informacion.nombre_archivo],
['Tipo:', informacion.tipo_descripcion],
['Subido por:', informacion.subido_por_nombre],
['Fecha subida:', moment(informacion.fecha_subida).format('DD/MM/YYYY HH:mm:ss')],
['Fecha procesamiento:', informacion.fecha_procesamiento ? 
moment(informacion.fecha_procesamiento).format('DD/MM/YYYY HH:mm:ss') : 'No procesado'],
['Estado final:', informacion.estado],
[''],
['ESTADÍSTICAS'],
['Total registros:', informacion.total_registros],
['Procesados exitosamente:', informacion.registros_procesados],
['Con errores:', informacion.registros_fallidos],
[''],
['DETALLES POR HOJA'],
];

// Agregar detalles de cada hoja
if (resumen.detalles_hojas) {
for (const [nombreHoja, detalles] of Object.entries(resumen.detalles_hojas)) {
resumenData.push([`Hoja: ${nombreHoja}`]);
resumenData.push(['  Total:', detalles.total]);
resumenData.push(['  Exitosos:', detalles.exitosos]);
resumenData.push(['  Errores:', detalles.errores]);
resumenData.push(['']);
}
}

const worksheetResumen = XLSX.utils.aoa_to_sheet(resumenData);
XLSX.utils.book_append_sheet(workbook, worksheetResumen, 'Resumen');

// Hoja 2: Errores detallados
const errores = informacion.errores ? JSON.parse(informacion.errores) : {};
const erroresData = [
['ERRORES DETALLADOS'],
['Número', 'Descripción del Error'],
];

if (errores.errores_principales) {
errores.errores_principales.forEach((error, index) => {
erroresData.push([index + 1, error]);
});
}

const worksheetErrores = XLSX.utils.aoa_to_sheet(erroresData);
XLSX.utils.book_append_sheet(workbook, worksheetErrores, 'Errores');

// Generar archivo
const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
const nombreArchivo = `Reporte_${informacion.tipo_nombre}_${timestamp}.xlsx`;
const directorioReportes = path.join(process.cwd(), 'subidas', 'reportes');

if (!fs.existsSync(directorioReportes)) {
fs.mkdirSync(directorioReportes, { recursive: true });
}

const rutaArchivo = path.join(directorioReportes, nombreArchivo);
XLSX.writeFile(workbook, rutaArchivo);

return {
nombre: nombreArchivo,
ruta: rutaArchivo
};

} catch (error) {
console.error('Error al generar reporte Excel:', error);
throw error;
}
}

/**
* 🔄 Procesar otros tipos de archivos (placeholders)
*/
async function procesarCargaAcademica(informacionArchivo, validarSolo, continuarConErrores) {
// TODO: Implementar procesamiento de Carga_Academica.xlsx
console.log('🎓 Procesando Carga_Academica.xlsx - En desarrollo');

return {
total_registros: 0,
procesados_exitosos: 0,
errores_totales: 0,
errores_criticos: 0,
errores_principales: ['Procesamiento de Carga_Academica.xlsx aún no implementado'],
warnings: ['Este tipo de archivo estará disponible en la próxima versión'],
detalles_hojas: {}
};
}

async function procesarAsignaciones(informacionArchivo, validarSolo, continuarConErrores) {
// TODO: Implementar procesamiento de Asignaciones.xlsx
console.log('🔗 Procesando Asignaciones.xlsx - En desarrollo');

return {
total_registros: 0,
procesados_exitosos: 0,
errores_totales: 0,
errores_criticos: 0,
errores_principales: ['Procesamiento de Asignaciones.xlsx aún no implementado'],
warnings: ['Este tipo de archivo estará disponible en la próxima versión'],
detalles_hojas: {}
};
}

// ==========================================
// 📤 EXPORTAR CONTROLADORES
// ==========================================

module.exports = {
procesarArchivoExcel,
obtenerEstadoProcesamiento,
descargarReporteProcesamiento
};/**
* ⚙️ CONTROLADOR DE PROCESAMIENTO DE ARCHIVOS EXCEL
* 
* Procesa los archivos Excel subidos e inserta los datos en la base de datos:
* - Estructura_Base.xlsx → usuarios, ciclos, semestres, estructura portafolios
* - Carga_Academica.xlsx → asignaturas, configuraciones
* - Asignaciones.xlsx → relaciones entre entidades
* 
* Rutas que maneja:
* POST /api/v1/sistema/excel/procesar/:id - Procesar archivo específico
* GET /api/v1/sistema/excel/estado/:id - Ver estado de procesamiento
* GET /api/v1/sistema/excel/reporte/:id - Descargar reporte de procesamiento
* 
* @author Sistema Portafolio Docente UNSAAC
* @version 1.0.0
*/

const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const poolConexion = require('../../base_datos/conexiones/pool.conexion');
const { TIPOS_ARCHIVO_EXCEL } = require('./subida.controlador');

/**
* ⚙️ Procesar archivo Excel específico
* POST /api/v1/sistema/excel/procesar/:id
*/
async function procesarArchivoExcel(req, res) {
try {
const { id } = req.params;
const { validar_solo = false, continuar_con_errores = false } = req.body;
const usuario_id = req.usuario.id;

// Obtener información del archivo
const informacionArchivo = await obtenerInformacionCarga(id);

if (!informacionArchivo) {
return res.status(404).json({
success: false,
message: 'Archivo no encontrado',
timestamp: new Date().toISOString()
});
}

if (informacionArchivo.estado === 'procesando') {
return res.status(400).json({
success: false,
message: 'El archivo ya se está procesando',
estado_actual: informacionArchivo.estado,
timestamp: new Date().toISOString()
});
}

// Actualizar estado a procesando
await actualizarEstadoCarga(id, 'procesando', usuario_id);

console.log(`⚙️ Iniciando procesamiento del archivo: ${informacionArchivo.nombre_archivo}`);

let resultado;

try {
// Procesar según el tipo de archivo
switch (informacionArchivo.tipo_nombre) {
case 'estructura_base':
    resultado = await procesarEstructuraBase(informacionArchivo, validar_solo, continuar_con_errores);
    break;
case 'carga_academica':
    resultado = await procesarCargaAcademica(informacionArchivo, validar_solo, continuar_con_errores);
    break;
case 'asignaciones':
    resultado = await procesarAsignaciones(informacionArchivo, validar_solo, continuar_con_errores);
    break;
default:
    throw new Error(`Tipo de archivo no soportado: ${informacionArchivo.tipo_nombre}`);
}

// Determinar estado final
const estadoFinal = resultado.errores_criticos > 0 ? 'fallido' : 
               resultado.errores_totales > 0 ? 'parcial' : 'completado';

// Actualizar registro con resultados
await finalizarProcesamiento(id, estadoFinal, resultado);

res.json({
success: estadoFinal !== 'fallido',
message: `Procesamiento ${estadoFinal}`,
data: {
    id_carga: id,
    estado_final: estadoFinal,
    resumen: {
        total_registros: resultado.total_registros,
        procesados_exitosamente: resultado.procesados_exitosos,
        con_errores: resultado.errores_totales,
        criticos: resultado.errores_criticos
    },
    detalles_por_hoja: resultado.detalles_hojas,
    errores_principales: resultado.errores_principales,
    warnings: resultado.warnings,
    url_reporte_completo: `/api/v1/sistema/excel/reporte/${id}`
},
timestamp: new Date().toISOString()
});

} catch (processingError) {
// Error durante el procesamiento
await actualizarEstadoCarga(id, 'fallido', usuario_id, {
error: processingError.message,
stack: processingError.stack
});

throw processingError;
}

} catch (error) {
console.error('Error al procesar archivo Excel:', error);
res.status(500).json({
success: false,
message: 'Error interno durante el procesamiento',
error: error.message,
timestamp: new Date().toISOString()
});