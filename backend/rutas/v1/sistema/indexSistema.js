/**
 * � INDEX - SISTEMA Y UTILIDADES
 * 
 * Exportación centralizada de todas las rutas del módulo
 * 
 * @author Sistema Portafolio Docente UNSAAC
 * @version 1.0.0
 */

// ==========================================
// � IMPORTAR TODAS LAS RUTAS DEL MÓDULO
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
// � EXPORTAR TODAS LAS RUTAS
// ==========================================

module.exports = rutasModulo;

// ==========================================
// � INFORMACIÓN DEL MÓDULO
// ==========================================

module.exports.info = {
    modulo: 'sistema',
    descripcion: 'SISTEMA Y UTILIDADES',
    rutas_disponibles: Object.keys(rutasModulo),
    total_rutas: Object.keys(rutasModulo).length,
    timestamp: new Date().toISOString()
};
