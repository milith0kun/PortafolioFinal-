/**
 * í³‹ INDEX - SISTEMA Y UTILIDADES
 * 
 * ExportaciÃ³n centralizada de todas las rutas del mÃ³dulo
 * 
 * @author Sistema Portafolio Docente UNSAAC
 * @version 1.0.0
 */

// ==========================================
// í³¥ IMPORTAR TODAS LAS RUTAS DEL MÃ“DULO
// ==========================================

const fs = require('fs');
const path = require('path');

// Obtener todos los archivos .rutas.js de la carpeta actual
const rutasModulo = {};

fs.readdirSync(__dirname)
    .filter(archivo => archivo.endsWith('.rutas.js'))
    .forEach(archivo => {
        const nombreRuta = path.basename(archivo, '.rutas.js');
        rutasModulo[nombreRuta] = require(path.join(__dirname, archivo));
    });

// ==========================================
// í³¤ EXPORTAR TODAS LAS RUTAS
// ==========================================

module.exports = rutasModulo;

// ==========================================
// í³Š INFORMACIÃ“N DEL MÃ“DULO
// ==========================================

module.exports.info = {
    modulo: 'sistema',
    descripcion: 'SISTEMA Y UTILIDADES',
    rutas_disponibles: Object.keys(rutasModulo),
    total_rutas: Object.keys(rutasModulo).length,
    timestamp: new Date().toISOString()
};
