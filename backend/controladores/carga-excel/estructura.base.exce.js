const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

/**
 * 📋 CONFIGURACIÓN DEL ARCHIVO 1: ESTRUCTURA_BASE.XLSX
 */
const ESTRUCTURA_BASE_CONFIG = {
    nombre_archivo: 'Estructura_Base.xlsx',
    descripcion: 'Datos fundamentales del sistema (usuarios, ciclos, estructura)',
    orden_procesamiento: 1,
    
    hojas: {
        // ==========================================
        // 🏠 HOJA 1: USUARIOS
        // ==========================================
        usuarios: {
            nombre_hoja: 'Usuarios',
            descripcion: 'Todos los usuarios del sistema con sus roles',
            orden: 1,
            columnas: [
                { 
                    key: 'nombres', 
                    header: 'Nombres*', 
                    width: 20, 
                    tipo: 'texto',
                    ejemplo: 'Juan Carlos',
                    validacion: 'requerido|min:2|max:100'
                },
                { 
                    key: 'apellidos', 
                    header: 'Apellidos*', 
                    width: 20, 
                    tipo: 'texto',
                    ejemplo: 'García López',
                    validacion: 'requerido|min:2|max:100'
                },
                { 
                    key: 'correo', 
                    header: 'Correo Electrónico*', 
                    width: 35, 
                    tipo: 'email',
                    ejemplo: 'juan.garcia@unsaac.edu.pe',
                    validacion: 'requerido|email|unico'
                },
                { 
                    key: 'contrasena', 
                    header: 'Contraseña*', 
                    width: 15, 
                    tipo: 'texto',
                    ejemplo: 'TempPass123',
                    validacion: 'requerido|min:8'
                },
                { 
                    key: 'telefono', 
                    header: 'Teléfono', 
                    width: 15, 
                    tipo: 'texto',
                    ejemplo: '984123456',
                    validacion: 'opcional|regex:/^[0-9]{9,15}$/'
                },
                { 
                    key: 'rol_principal', 
                    header: 'Rol Principal*', 
                    width: 15, 
                    tipo: 'lista',
                    ejemplo: 'docente',
                    validacion: 'requerido|en:docente,verificador,administrador'
                },
                { 
                    key: 'roles_adicionales', 
                    header: 'Roles Adicionales', 
                    width: 25, 
                    tipo: 'texto',
                    ejemplo: 'verificador',
                    validacion: 'opcional|roles_validos'
                },
                { 
                    key: 'activo', 
                    header: 'Activo*', 
                    width: 10, 
                    tipo: 'booleano',
                    ejemplo: '1',
                    validacion: 'requerido|en:0,1'
                }
            ],
            validaciones_especiales: {
                rol_principal: ['docente', 'verificador', 'administrador'],
                roles_adicionales: ['docente', 'verificador', 'administrador'],
                activo: ['0', '1']
            },
            observaciones: [
                '* CAMPOS OBLIGATORIOS',
                '• Correo debe ser único en todo el sistema',
                '• Roles disponibles: docente, verificador, administrador',
                '• Roles adicionales separados por coma (ej: verificador,administrador)',
                '• Activo: 1 = Usuario activo, 0 = Usuario inactivo',
                '• Contraseña será encriptada automáticamente',
                '• Teléfono: solo números, entre 9 y 15 dígitos',
                '• Se creará automáticamente en tabla usuarios_roles'
            ],
            datos_ejemplo: [
                ['Juan Carlos', 'García López', 'juan.garcia@unsaac.edu.pe', 'TempPass123', '984123456', 'docente', '', '1'],
                ['María Elena', 'Rodríguez Paz', 'maria.rodriguez@unsaac.edu.pe', 'SecurePass456', '987654321', 'verificador', 'docente', '1'],
                ['Pedro Luis', 'Mamani Quispe', 'pedro.mamani@unsaac.edu.pe', 'AdminPass789', '999888777', 'administrador', '', '1'],
                ['Ana Sofía', 'Huamán Torres', 'ana.huaman@unsaac.edu.pe', 'DocentePass321', '955444333', 'docente', '', '1']
            ]
        },

        // ==========================================
        // 📅 HOJA 2: CICLOS ACADÉMICOS
        // ==========================================
        ciclos_academicos: {
            nombre_hoja: 'Ciclos_Academicos',
            descripcion: 'Períodos académicos del sistema',
            orden: 2,
            columnas: [
                { 
                    key: 'nombre', 
                    header: 'Nombre del Ciclo*', 
                    width: 20, 
                    tipo: 'texto',
                    ejemplo: '2024-I',
                    validacion: 'requerido|unico|regex:/^[0-9]{4}-(I|II|III)$/'
                },
                { 
                    key: 'descripcion', 
                    header: 'Descripción', 
                    width: 50, 
                    tipo: 'texto',
                    ejemplo: 'Primer semestre del año académico 2024',
                    validacion: 'opcional|max:500'
                },
                { 
                    key: 'estado', 
                    header: 'Estado*', 
                    width: 15, 
                    tipo: 'lista',
                    ejemplo: 'preparacion',
                    validacion: 'requerido|en:preparacion,activo,cerrado,archivado'
                },
                { 
                    key: 'fecha_inicio', 
                    header: 'Fecha Inicio*', 
                    width: 15, 
                    tipo: 'fecha',
                    ejemplo: '2024-03-18',
                    validacion: 'requerido|fecha|formato:YYYY-MM-DD'
                },
                { 
                    key: 'fecha_fin', 
                    header: 'Fecha Fin*', 
                    width: 15, 
                    tipo: 'fecha',
                    ejemplo: '2024-08-02',
                    validacion: 'requerido|fecha|despues:fecha_inicio'
                },
                { 
                    key: 'semestre_actual', 
                    header: 'Semestre*', 
                    width: 12, 
                    tipo: 'lista',
                    ejemplo: 'I',
                    validacion: 'requerido|en:I,II,III'
                },
                { 
                    key: 'anio_actual', 
                    header: 'Año*', 
                    width: 10, 
                    tipo: 'numero',
                    ejemplo: '2024',
                    validacion: 'requerido|numero|min:2020|max:2030'
                },
                { 
                    key: 'correo_creador', 
                    header: 'Creado Por (Correo)*', 
                    width: 30, 
                    tipo: 'email',
                    ejemplo: 'admin@unsaac.edu.pe',
                    validacion: 'requerido|email|existe_usuario'
                }
            ],
            validaciones_especiales: {
                estado: ['preparacion', 'activo', 'cerrado', 'archivado'],
                semestre_actual: ['I', 'II', 'III']
            },
            observaciones: [
                '* CAMPOS OBLIGATORIOS',
                '• Nombre debe seguir formato: YYYY-I, YYYY-II, YYYY-III',
                '• Estados: preparacion (inicial), activo (en curso), cerrado (finalizado), archivado',
                '• Fechas en formato YYYY-MM-DD',
                '• Fecha fin debe ser posterior a fecha inicio',
                '• Creado Por debe ser un correo de usuario administrador existente',
                '• El ciclo se usará para crear semestres automáticamente'
            ],
            datos_ejemplo: [
                ['2024-I', 'Primer semestre académico 2024', 'preparacion', '2024-03-18', '2024-08-02', 'I', '2024', 'admin@unsaac.edu.pe'],
                ['2024-II', 'Segundo semestre académico 2024', 'preparacion', '2024-08-26', '2025-01-17', 'II', '2024', 'admin@unsaac.edu.pe'],
                ['2025-I', 'Primer semestre académico 2025', 'preparacion', '2025-03-17', '2025-08-01', 'I', '2025', 'admin@unsaac.edu.pe']
            ]
        },

        // ==========================================
        // 📚 HOJA 3: SEMESTRES
        // ==========================================
        semestres: {
            nombre_hoja: 'Semestres',
            descripcion: 'Semestres académicos por ciclo',
            orden: 3,
            columnas: [
                { 
                    key: 'nombre', 
                    header: 'Nombre Semestre*', 
                    width: 15, 
                    tipo: 'texto',
                    ejemplo: 'I',
                    validacion: 'requerido|en:I,II,III,IV,V,VI,VII,VIII,IX,X'
                },
                { 
                    key: 'ciclo_nombre', 
                    header: 'Ciclo Académico*', 
                    width: 20, 
                    tipo: 'texto',
                    ejemplo: '2024-I',
                    validacion: 'requerido|existe_ciclo'
                },
                { 
                    key: 'fecha_inicio', 
                    header: 'Fecha Inicio', 
                    width: 15, 
                    tipo: 'fecha',
                    ejemplo: '2024-03-18',
                    validacion: 'opcional|fecha'
                },
                { 
                    key: 'fecha_fin', 
                    header: 'Fecha Fin', 
                    width: 15, 
                    tipo: 'fecha',
                    ejemplo: '2024-08-02',
                    validacion: 'opcional|fecha|despues:fecha_inicio'
                },
                { 
                    key: 'activo', 
                    header: 'Activo*', 
                    width: 10, 
                    tipo: 'booleano',
                    ejemplo: '1',
                    validacion: 'requerido|en:0,1'
                }
            ],
            validaciones_especiales: {
                nombre: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'],
                activo: ['0', '1']
            },
            observaciones: [
                '* CAMPOS OBLIGATORIOS',
                '• Nombre: semestres académicos (I, II, III, etc.)',
                '• Ciclo académico debe existir en la hoja anterior',
                '• Fechas opcionales, heredan del ciclo si están vacías',
                '• Activo: 1 = Semestre activo, 0 = Inactivo',
                '• Se puede crear el mismo semestre en diferentes ciclos',
                '• Útil para organizar asignaturas por semestre'
            ],
            datos_ejemplo: [
                ['I', '2024-I', '2024-03-18', '2024-08-02', '1'],
                ['II', '2024-I', '2024-03-18', '2024-08-02', '1'],
                ['III', '2024-I', '2024-03-18', '2024-08-02', '1'],
                ['IV', '2024-I', '2024-03-18', '2024-08-02', '1'],
                ['V', '2024-I', '2024-03-18', '2024-08-02', '1'],
                ['I', '2024-II', '2024-08-26', '2025-01-17', '1'],
                ['II', '2024-II', '2024-08-26', '2025-01-17', '1']
            ]
        },

        // ==========================================
        // 🗂️ HOJA 4: ESTRUCTURA BASE PORTAFOLIOS
        // ==========================================
        estructura_portafolio: {
            nombre_hoja: 'Estructura_Portafolio',
            descripcion: 'Estructura base para todos los portafolios',
            orden: 4,
            columnas: [
                { 
                    key: 'nombre', 
                    header: 'Nombre Carpeta/Sección*', 
                    width: 30, 
                    tipo: 'texto',
                    ejemplo: 'I. Información General',
                    validacion: 'requerido|max:150'
                },
                { 
                    key: 'descripcion', 
                    header: 'Descripción', 
                    width: 50, 
                    tipo: 'texto',
                    ejemplo: 'Información general del docente y la asignatura',
                    validacion: 'opcional|max:500'
                },
                { 
                    key: 'nivel', 
                    header: 'Nivel*', 
                    width: 10, 
                    tipo: 'numero',
                    ejemplo: '1',
                    validacion: 'requerido|numero|min:1|max:5'
                },
                { 
                    key: 'orden', 
                    header: 'Orden*', 
                    width: 10, 
                    tipo: 'numero',
                    ejemplo: '1',
                    validacion: 'requerido|numero|min:1'
                },
                { 
                    key: 'requiere_credito', 
                    header: 'Requiere Crédito', 
                    width: 15, 
                    tipo: 'numero',
                    ejemplo: '0',
                    validacion: 'opcional|numero|min:0'
                },
                { 
                    key: 'carpeta_padre', 
                    header: 'Carpeta Padre', 
                    width: 30, 
                    tipo: 'texto',
                    ejemplo: '',
                    validacion: 'opcional|existe_carpeta_padre'
                },
                { 
                    key: 'pertenece_presentacion', 
                    header: 'Para Presentación*', 
                    width: 18, 
                    tipo: 'booleano',
                    ejemplo: '0',
                    validacion: 'requerido|en:0,1'
                },
                { 
                    key: 'icono', 
                    header: 'Icono', 
                    width: 15, 
                    tipo: 'texto',
                    ejemplo: 'folder',
                    validacion: 'opcional|max:50'
                },
                { 
                    key: 'color', 
                    header: 'Color', 
                    width: 12, 
                    tipo: 'texto',
                    ejemplo: '#007bff',
                    validacion: 'opcional|color_hex'
                },
                { 
                    key: 'activo', 
                    header: 'Activo*', 
                    width: 10, 
                    tipo: 'booleano',
                    ejemplo: '1',
                    validacion: 'requerido|en:0,1'
                }
            ],
            validaciones_especiales: {
                pertenece_presentacion: ['0', '1'],
                activo: ['0', '1']
            },
            observaciones: [
                '* CAMPOS OBLIGATORIOS',
                '• Estructura jerárquica: nivel 1 = raíz, nivel 2 = subcarpetas, etc.',
                '• Orden: determina la posición dentro del mismo nivel',
                '• Carpeta Padre: nombre exacto de la carpeta contenedora (vacío si es raíz)',
                '• Para Presentación: 1 = se incluye en presentaciones, 0 = solo interno',
                '• Iconos sugeridos: folder, file, document, image, etc.',
                '• Color en formato hexadecimal (#007bff)',
                '• Esta estructura se aplicará a TODOS los portafolios'
            ],
            datos_ejemplo: [
                ['I. Información General', 'Datos del docente y asignatura', '1', '1', '0', '', '1', 'info', '#17a2b8', '1'],
                ['II. Planificación Curricular', 'Documentos de planificación', '1', '2', '0', '', '1', 'calendar', '#28a745', '1'],
                ['III. Ejecución Curricular', 'Desarrollo de clases y actividades', '1', '3', '0', '', '1', 'play', '#ffc107', '1'],
                ['IV. Evaluación', 'Instrumentos y resultados de evaluación', '1', '4', '0', '', '1', 'check', '#dc3545', '1'],
                ['V. Extensión y Proyección', 'Actividades de extensión universitaria', '1', '5', '0', '', '1', 'globe', '#6f42c1', '1'],
                ['1.1 Datos Personales', 'CV y datos del docente', '2', '1', '0', 'I. Información General', '1', 'user', '#17a2b8', '1'],
                ['1.2 Datos de la Asignatura', 'Información de la materia', '2', '2', '0', 'I. Información General', '1', 'book', '#17a2b8', '1']
            ]
        }
    }
};

/**
 * 🏗️ Generar el archivo Estructura_Base.xlsx
 */
async function generarEstructuraBase() {
    try {
        console.log('📊 Generando archivo: Estructura_Base.xlsx');
        
        const directorioPlantillas = path.join(process.cwd(), 'plantillas', 'excel');
        
        // Crear directorio si no existe
        if (!fs.existsSync(directorioPlantillas)) {
            fs.mkdirSync(directorioPlantillas, { recursive: true });
        }

        const rutaArchivo = path.join(directorioPlantillas, ESTRUCTURA_BASE_CONFIG.nombre_archivo);
        const workbook = XLSX.utils.book_new();

        // Generar cada hoja del archivo
        for (const [nombreHoja, configHoja] of Object.entries(ESTRUCTURA_BASE_CONFIG.hojas)) {
            console.log(`  📋 Generando hoja: ${configHoja.nombre_hoja}`);
            
            // Datos para la hoja
            const datosHoja = [
                // Fila 1: Encabezados
                configHoja.columnas.map(col => col.header),
                // Fila 2: Ejemplos/Tipos
                configHoja.columnas.map(col => `(${col.tipo}) ${col.ejemplo}`),
                // Filas 3+: Datos de ejemplo
                ...configHoja.datos_ejemplo
            ];

            // Crear worksheet
            const worksheet = XLSX.utils.aoa_to_sheet(datosHoja);

            // Configurar ancho de columnas
            worksheet['!cols'] = configHoja.columnas.map(col => ({ width: col.width }));

            // Estilo para encabezados (fila 1)
            const range = XLSX.utils.decode_range(worksheet['!ref']);
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
                if (!worksheet[cellAddress]) worksheet[cellAddress] = {};
                worksheet[cellAddress].s = {
                    font: { bold: true, color: { rgb: "FFFFFF" } },
                    fill: { fgColor: { rgb: "366092" } },
                    alignment: { horizontal: "center" }
                };
            }

            // Estilo para fila de ejemplos (fila 2)
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: 1, c: col });
                if (!worksheet[cellAddress]) worksheet[cellAddress] = {};
                worksheet[cellAddress].s = {
                    font: { italic: true },
                    fill: { fgColor: { rgb: "F0F0F0" } }
                };
            }

            XLSX.utils.book_append_sheet(workbook, worksheet, configHoja.nombre_hoja);
        }

        // Generar hoja de instrucciones
        await generarHojaInstrucciones(workbook);

        // Escribir archivo
        XLSX.writeFile(workbook, rutaArchivo);

        console.log(`✅ Archivo generado exitosamente: ${rutaArchivo}`);
        
        return {
            archivo: ESTRUCTURA_BASE_CONFIG.nombre_archivo,
            ruta: rutaArchivo,
            hojas: Object.keys(ESTRUCTURA_BASE_CONFIG.hojas).length + 1, // +1 por instrucciones
            descripcion: ESTRUCTURA_BASE_CONFIG.descripcion
        };

    } catch (error) {
        console.error('❌ Error al generar Estructura_Base.xlsx:', error);
        throw error;
    }
}

/**
 * 📖 Generar hoja de instrucciones
 */
async function generarHojaInstrucciones(workbook) {
    const instrucciones = [
        ['INSTRUCCIONES - ESTRUCTURA_BASE.XLSX'],
        [''],
        ['🎯 PROPÓSITO DEL ARCHIVO'],
        ['Este archivo contiene los datos fundamentales que deben cargarse PRIMERO en el sistema.'],
        [''],
        ['📋 HOJAS INCLUIDAS'],
        ['1. Usuarios - Todos los usuarios del sistema con sus roles'],
        ['2. Ciclos_Academicos - Períodos académicos (semestres)'],
        ['3. Semestres - Divisiones por semestre dentro de cada ciclo'],
        ['4. Estructura_Portafolio - Estructura base para todos los portafolios'],
        [''],
        ['🔄 ORDEN DE PROCESAMIENTO'],
        ['Este archivo se procesa en el siguiente orden:'],
        ['1° Usuarios (se crean primero)'],
        ['2° Ciclos Académicos (requieren usuarios)'],
        ['3° Semestres (requieren ciclos)'],
        ['4° Estructura Portafolio (independiente)'],
        [''],
        ['⚠️ IMPORTANTE - ANTES DE CARGAR'],
        ['• Verificar que TODOS los campos marcados con * estén completos'],
        ['• Eliminar las filas de ejemplo (fila 2 en cada hoja)'],
        ['• Verificar formatos de fecha (YYYY-MM-DD)'],
        ['• Confirmar que los correos sean únicos'],
        ['• Revisar que las referencias entre hojas sean correctas'],
        [''],
        ['📧 CAMPO ESPECIAL: CORREOS'],
        ['• Deben ser únicos en todo el sistema'],
        ['• Formato válido de email'],
        ['• Preferiblemente del dominio @unsaac.edu.pe'],
        [''],
        ['🔐 ROLES DISPONIBLES'],
        ['• docente - Profesores que subirán portafolios'],
        ['• verificador - Supervisores que revisarán documentos'],
        ['• administrador - Gestores del sistema'],
        [''],
        ['📅 FORMATOS DE FECHA'],
        ['• Todas las fechas en formato: YYYY-MM-DD'],
        ['• Ejemplo: 2024-03-18'],
        ['• La fecha fin debe ser posterior a la fecha inicio'],
        [''],
        ['🗂️ ESTRUCTURA DE PORTAFOLIOS'],
        ['• Nivel 1 = Carpetas principales'],
        ['• Nivel 2 = Subcarpetas'],
        ['• Nivel 3+ = Sub-subcarpetas'],
        ['• El orden determina la posición visual'],
        [''],
        ['✅ DESPUÉS DE CARGAR ESTE ARCHIVO'],
        ['1. Verificar que todos los datos se importaron correctamente'],
        ['2. Proceder con el archivo "Carga_Academica.xlsx"'],
        ['3. Finalmente cargar "Asignaciones.xlsx"'],
        [''],
        ['📞 SOPORTE'],
        ['Si tiene problemas con este archivo:'],
        ['• Verificar el formato de los datos'],
        ['• Revisar el log de errores del sistema'],
        ['• Contactar al administrador técnico']
    ];

    const worksheetInstrucciones = XLSX.utils.aoa_to_sheet(instrucciones);
    worksheetInstrucciones['!cols'] = [{ width: 80 }];
    
    // Estilo para el título
    if (worksheetInstrucciones['A1']) {
        worksheetInstrucciones['A1'].s = {
            font: { bold: true, size: 14, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "D32F2F" } },
            alignment: { horizontal: "center" }
        };
    }

    XLSX.utils.book_append_sheet(workbook, worksheetInstrucciones, 'INSTRUCCIONES');
}

/**
 * 🔧 Obtener configuración para validación
 */
function obtenerConfigValidacion() {
    return ESTRUCTURA_BASE_CONFIG;
}

// ==========================================
// 📤 EXPORTAR FUNCIONES
// ==========================================

module.exports = {
    generarEstructuraBase,
    obtenerConfigValidacion,
    ESTRUCTURA_BASE_CONFIG
};

// ==========================================
// 🚀 EJECUTAR SI ES ARCHIVO PRINCIPAL
// ==========================================

if (require.main === module) {
    generarEstructuraBase()
        .then(resultado => {
            console.log('🎉 Generación completada:', resultado);
        })
        .catch(error => {
            console.error('💥 Error:', error);
        });
}