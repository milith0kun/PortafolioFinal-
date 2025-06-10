/**
 * 🏗️ CONTROLADOR DE ESTRUCTURA DE PORTAFOLIOS
 * 
 * Gestiona la estructura jerárquica de los portafolios:
 * - Generar estructura base por rol
 * - Crear carpetas y subcarpetas
 * - Definir tipos de documentos requeridos
 * - Personalizar estructura por asignatura
 * - Clonar estructuras entre ciclos
 * 
 * Rutas que maneja:
 * GET /api/v1/portafolios/estructura/administrador - Estructura admin
 * GET /api/v1/portafolios/estructura/docente - Estructura docente  
 * GET /api/v1/portafolios/estructura/verificador - Estructura verificador
 * POST /api/v1/portafolios/estructura/personalizar - Personalizar
 */

// TODO: Estructura diferente según rol (admin/docente/verificador)
// TODO: Estructura base configurable por administrador
// TODO: Herencia de estructuras padre a hijo
// TODO: Validar integridad de estructura antes de crear
/**
 * 🗂️ CONTROLADOR ESTRUCTURA PORTAFOLIOS - Sistema Portafolio Docente UNSAAC
 * Generación y gestión de estructuras de portafolios
 */

/**
 * 🏗️ CONTROLADOR DE ESTRUCTURA DE PORTAFOLIOS
 * 
 * Gestiona la estructura jerárquica de los portafolios:
 * - Generar estructura base por rol
 * - Crear carpetas y subcarpetas
 * - Definir tipos de documentos requeridos
 * - Personalizar estructura por asignatura
 * - Clonar estructuras entre ciclos
 * 
 * Rutas que maneja:
 * GET /api/v1/portafolios/estructura/administrador - Estructura admin
 * GET /api/v1/portafolios/estructura/docente - Estructura docente  
 * GET /api/v1/portafolios/estructura/verificador - Estructura verificador
 * POST /api/v1/portafolios/estructura/personalizar - Personalizar
 * POST /api/v1/portafolios/estructura/generar - Generar estructura
 */

// ============================================================
// 🏗️ CONTROLADOR DE ESTRUCTURA DE PORTAFOLIOS
// Sistema Portafolio Docente UNSAAC
// ============================================================

const { ejecutarLectura, ejecutarEscritura, ejecutarTransaccionCompleja } = require('../../base_datos/conexiones/pool.conexion');
const estructuraServicio = require('../../servicios/gestion-portafolios/estructura.servicio');
const navegacionServicio = require('../../servicios/gestion-portafolios/navegacion.servicio');
const { manejarError, respuestaExitosa } = require('../../utilidades/formato/datos.util');
const { registrarAccion } = require('../../utilidades/base-datos/auditoria.util');

class EstructuraPortafoliosControlador {

    // ===================================================
    // 🏗️ GENERAR ESTRUCTURA DE PORTAFOLIO PARA DOCENTE
    // ===================================================
    async generarEstructura(req, res) {
        try {
            const { docente_id, asignatura_id, ciclo_id } = req.body;
            const usuarioCreador = req.usuario.id;

            // Validar datos básicos
            if (!docente_id || !asignatura_id || !ciclo_id) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Docente, asignatura y ciclo son obligatorios',
                    codigo: 'DATOS_INCOMPLETOS'
                });
            }

            // Verificar que la asignación docente-asignatura existe
            const sqlAsignacion = `
                SELECT 
                    da.id, 
                    u.nombres, u.apellidos, u.correo,
                    a.nombre as asignatura_nombre, a.codigo,
                    ca.nombre as ciclo_nombre, ca.estado as ciclo_estado
                FROM docentes_asignaturas da
                JOIN usuarios u ON da.docente_id = u.id
                JOIN asignaturas a ON da.asignatura_id = a.id
                JOIN ciclos_academicos ca ON da.ciclo_id = ca.id
                WHERE da.docente_id = ? AND da.asignatura_id = ? AND da.ciclo_id = ? 
                AND da.activo = 1 AND u.activo = 1 AND a.activo = 1
            `;

            const { resultado: asignaciones } = await ejecutarLectura(sqlAsignacion, [docente_id, asignatura_id, ciclo_id]);

            if (asignaciones.length === 0) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'No existe asignación válida del docente a esta asignatura en este ciclo',
                    codigo: 'ASIGNACION_NO_ENCONTRADA'
                });
            }

            const asignacion = asignaciones[0];

            // Verificar que el ciclo esté en estado válido para crear portafolios
            if (asignacion.ciclo_estado === 'cerrado' || asignacion.ciclo_estado === 'archivado') {
                return res.status(400).json({
                    exito: false,
                    mensaje: `No se pueden crear portafolios en un ciclo con estado: ${asignacion.ciclo_estado}`,
                    codigo: 'CICLO_NO_VALIDO'
                });
            }

            // Verificar que no exista ya un portafolio principal
            const sqlPortafolioExistente = `
                SELECT id, nombre, estado FROM portafolios 
                WHERE docente_id = ? AND asignatura_id = ? AND ciclo_id = ? 
                AND carpeta_padre_id IS NULL
            `;

            const { resultado: portafoliosExistentes } = await ejecutarLectura(sqlPortafolioExistente, [docente_id, asignatura_id, ciclo_id]);

            if (portafoliosExistentes.length > 0) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Ya existe un portafolio para esta combinación docente-asignatura-ciclo',
                    codigo: 'PORTAFOLIO_EXISTENTE',
                    portafolio_existente: portafoliosExistentes[0]
                });
            }

            // Obtener estructura base del sistema
            const sqlEstructuraBase = `
                SELECT * FROM estructura_portafolio_base 
                WHERE activo = 1 
                ORDER BY nivel ASC, orden ASC
            `;

            const { resultado: estructuraBase } = await ejecutarLectura(sqlEstructuraBase);

            if (estructuraBase.length === 0) {
                return res.status(500).json({
                    exito: false,
                    mensaje: 'No se encontró estructura base del portafolio en el sistema',
                    codigo: 'ESTRUCTURA_BASE_NO_ENCONTRADA'
                });
            }

            // Crear o verificar semestre
            const semestreNombre = `${asignacion.codigo}-${new Date().getFullYear()}`;
            let semestreId;

            const sqlSemestreExistente = `
                SELECT id FROM semestres 
                WHERE nombre = ? AND ciclo_id = ? AND activo = 1
            `;

            const { resultado: semestresExistentes } = await ejecutarLectura(sqlSemestreExistente, [semestreNombre, ciclo_id]);

            if (semestresExistentes.length > 0) {
                semestreId = semestresExistentes[0].id;
            } else {
                const sqlCrearSemestre = `
                    INSERT INTO semestres (nombre, ciclo_id, activo, fecha_inicio, fecha_fin) 
                    VALUES (?, ?, 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 6 MONTH))
                `;
                const { resultado: nuevoSemestre } = await ejecutarEscritura(sqlCrearSemestre, [semestreNombre, ciclo_id]);
                semestreId = nuevoSemestre.insertId;
            }

            // Generar estructura usando transacción compleja
            const nombrePortafolio = `Portafolio ${asignacion.asignatura_nombre} - ${asignacion.nombres} ${asignacion.apellidos}`;
            
            const operaciones = [];
            
            // 1. Crear portafolio principal
            operaciones.push({
                sql: `
                    INSERT INTO portafolios (
                        nombre, docente_id, asignatura_id, semestre_id, ciclo_id, 
                        nivel, ruta, estado, progreso_completado, creado_en
                    ) VALUES (?, ?, ?, ?, ?, 0, ?, 'activo', 0.00, NOW())
                `,
                parametros: [nombrePortafolio, docente_id, asignatura_id, semestreId, ciclo_id, nombrePortafolio],
                punto: 'crear_portafolio_principal'
            });

            // 2. Crear estructura jerárquica
            const niveles = [...new Set(estructuraBase.map(item => item.nivel))].sort((a, b) => a - b);
            
            for (const nivel of niveles) {
                const elementosNivel = estructuraBase.filter(item => item.nivel === nivel);
                
                for (const elemento of elementosNivel) {
                    const rutaCompleta = nivel === 1 ? 
                        `${nombrePortafolio}/${elemento.nombre}` : 
                        `${nombrePortafolio}/${elemento.nombre}`;

                    operaciones.push({
                        sql: `
                            INSERT INTO portafolios (
                                nombre, docente_id, asignatura_id, semestre_id, ciclo_id,
                                estructura_id, nivel, ruta, estado, progreso_completado, creado_en
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'activo', 0.00, NOW())
                        `,
                        parametros: [
                            elemento.nombre, docente_id, asignatura_id,
                            semestreId, ciclo_id, elemento.id,
                            elemento.nivel, rutaCompleta
                        ],
                        punto: `crear_carpeta_${elemento.nombre.replace(/\s+/g, '_').toLowerCase()}`
                    });
                }
            }

            // Ejecutar transacción
            const { resultados } = await ejecutarTransaccionCompleja(operaciones);
            const portafolioId = resultados[0].resultado.insertId;

            // Actualizar relaciones padre-hijo en una segunda transacción
            const operacionesRelaciones = [];
            const mapaPortafolios = new Map();

            // Mapear IDs creados
            let indiceOperacion = 1; // Empezar desde 1 porque 0 es el portafolio principal
            for (const nivel of niveles) {
                const elementosNivel = estructuraBase.filter(item => item.nivel === nivel);
                
                for (const elemento of elementosNivel) {
                    const portafolioCreado = resultados[indiceOperacion].resultado.insertId;
                    mapaPortafolios.set(elemento.id, portafolioCreado);
                    
                    // Si tiene padre, actualizar carpeta_padre_id
                    if (elemento.carpeta_padre_id) {
                        const padreId = mapaPortafolios.get(elemento.carpeta_padre_id);
                        if (padreId) {
                            operacionesRelaciones.push({
                                sql: `UPDATE portafolios SET carpeta_padre_id = ? WHERE id = ?`,
                                parametros: [padreId, portafolioCreado],
                                punto: `actualizar_padre_${elemento.id}`
                            });
                        }
                    } else if (elemento.nivel > 1) {
                        // Si es nivel > 1 sin padre específico, usar el portafolio principal
                        operacionesRelaciones.push({
                            sql: `UPDATE portafolios SET carpeta_padre_id = ? WHERE id = ?`,
                            parametros: [portafolioId, portafolioCreado],
                            punto: `actualizar_padre_principal_${elemento.id}`
                        });
                    }
                    
                    indiceOperacion++;
                }
            }

            if (operacionesRelaciones.length > 0) {
                await ejecutarTransaccionCompleja(operacionesRelaciones);
            }

            // Obtener estructura creada completa
            const estructuraCreada = await estructuraServicio.obtenerEstructuraCompleta(portafolioId);

            // Registrar auditoría
            await registrarAccion({
                usuario_id: usuarioCreador,
                accion: 'generar_estructura',
                modulo: 'portafolios',
                descripcion: `Generó estructura de portafolio para ${asignacion.nombres} ${asignacion.apellidos} - ${asignacion.asignatura_nombre}`,
                datos_nuevos: {
                    portafolio_id: portafolioId,
                    docente_id,
                    asignatura_id,
                    ciclo_id,
                    total_carpetas: estructuraBase.length
                },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            console.log(`✅ Estructura de portafolio generada para ${asignacion.nombres} ${asignacion.apellidos} - ${asignacion.asignatura_nombre}`);

            return respuestaExitosa(res, {
                portafolio_principal: {
                    id: portafolioId,
                    nombre: nombrePortafolio,
                    docente: `${asignacion.nombres} ${asignacion.apellidos}`,
                    asignatura: asignacion.asignatura_nombre,
                    ciclo: asignacion.ciclo_nombre,
                    total_carpetas: estructuraBase.length
                },
                estructura_creada: estructuraCreada
            }, 'Estructura de portafolio generada exitosamente', 201);

        } catch (error) {
            console.error('❌ Error al generar estructura:', error);
            return manejarError(res, error, 'Error al generar estructura de portafolio');
        }
    }

    // ===================================================
    // 🌳 OBTENER ÁRBOL DE ESTRUCTURA PARA ADMINISTRADOR
    // ===================================================
    async obtenerArbolAdmin(req, res) {
        try {
            const { 
                ciclo_id = null, 
                docente_id = null, 
                asignatura_id = null,
                estado = null,
                incluir_estadisticas = true 
            } = req.query;

            let sql = `
                SELECT 
                    p.id, p.nombre, p.nivel, p.ruta, p.estado, p.progreso_completado,
                    p.carpeta_padre_id, p.estructura_id, p.creado_en, p.actualizado_en,
                    CONCAT(u.nombres, ' ', u.apellidos) as docente_nombre,
                    u.correo as docente_correo,
                    a.nombre as asignatura_nombre, a.codigo as asignatura_codigo,
                    ca.nombre as ciclo_nombre, ca.estado as ciclo_estado,
                    eb.descripcion as descripcion_estructura, eb.icono, eb.color,
                    COUNT(DISTINCT arch.id) as total_archivos,
                    COUNT(DISTINCT CASE WHEN arch.estado = 'aprobado' THEN arch.id END) as archivos_aprobados,
                    COUNT(DISTINCT CASE WHEN arch.estado = 'pendiente' THEN arch.id END) as archivos_pendientes,
                    COUNT(DISTINCT CASE WHEN arch.estado = 'rechazado' THEN arch.id END) as archivos_rechazados
                FROM portafolios p
                JOIN usuarios u ON p.docente_id = u.id
                LEFT JOIN asignaturas a ON p.asignatura_id = a.id
                JOIN ciclos_academicos ca ON p.ciclo_id = ca.id
                LEFT JOIN estructura_portafolio_base eb ON p.estructura_id = eb.id
                LEFT JOIN archivos_subidos arch ON p.id = arch.portafolio_id
                WHERE u.activo = 1
            `;

            const parametros = [];

            if (ciclo_id) {
                sql += ` AND p.ciclo_id = ?`;
                parametros.push(ciclo_id);
            }

            if (docente_id) {
                sql += ` AND p.docente_id = ?`;
                parametros.push(docente_id);
            }

            if (asignatura_id) {
                sql += ` AND p.asignatura_id = ?`;
                parametros.push(asignatura_id);
            }

            if (estado) {
                sql += ` AND p.estado = ?`;
                parametros.push(estado);
            }

            sql += ` GROUP BY p.id ORDER BY ca.anio_actual DESC, u.apellidos, u.nombres, p.nivel, p.id`;

            const { resultado: portafolios } = await ejecutarLectura(sql, parametros);

            // Construir árbol jerárquico
            const arbol = this.construirArbolJerarquico(portafolios);

            // Obtener estadísticas generales si se solicita
            let estadisticas = null;
            if (incluir_estadisticas === 'true') {
                estadisticas = await this.obtenerEstadisticasGenerales(parametros.length > 0 ? { ciclo_id, docente_id, asignatura_id, estado } : {});
            }

            return respuestaExitosa(res, {
                total_portafolios: portafolios.length,
                arbol_portafolios: arbol,
                estadisticas,
                filtros_aplicados: { ciclo_id, docente_id, asignatura_id, estado }
            }, 'Árbol de estructura para administrador obtenido correctamente');

        } catch (error) {
            console.error('❌ Error al obtener árbol admin:', error);
            return manejarError(res, error, 'Error al obtener estructura de administrador');
        }
    }

    // ===================================================
    // 👨‍🏫 OBTENER ÁRBOL DE ESTRUCTURA PARA DOCENTE
    // ===================================================
    async obtenerArbolDocente(req, res) {
        try {
            const { ciclo_id = null, asignatura_id = null } = req.query;
            const docenteId = req.usuario.id;

            let sql = `
                SELECT 
                    p.id, p.nombre, p.nivel, p.ruta, p.estado, p.progreso_completado,
                    p.carpeta_padre_id, p.estructura_id, p.creado_en, p.actualizado_en,
                    a.nombre as asignatura_nombre, a.codigo as asignatura_codigo,
                    ca.nombre as ciclo_nombre, ca.estado as ciclo_estado,
                    eb.descripcion as descripcion_estructura,
                    eb.requiere_credito, eb.icono, eb.color, eb.pertenece_presentacion,
                    COUNT(DISTINCT arch.id) as total_archivos,
                    COUNT(DISTINCT CASE WHEN arch.estado = 'aprobado' THEN arch.id END) as archivos_aprobados,
                    COUNT(DISTINCT CASE WHEN arch.estado = 'pendiente' THEN arch.id END) as archivos_pendientes,
                    COUNT(DISTINCT CASE WHEN arch.estado = 'rechazado' THEN arch.id END) as archivos_rechazados,
                    COUNT(DISTINCT CASE WHEN arch.estado = 'en_revision' THEN arch.id END) as archivos_en_revision,
                    COUNT(DISTINCT obs.id) as total_observaciones,
                    COUNT(DISTINCT CASE WHEN obs.respondida = 0 THEN obs.id END) as observaciones_pendientes
                FROM portafolios p
                LEFT JOIN asignaturas a ON p.asignatura_id = a.id
                JOIN ciclos_academicos ca ON p.ciclo_id = ca.id
                LEFT JOIN estructura_portafolio_base eb ON p.estructura_id = eb.id
                LEFT JOIN archivos_subidos arch ON p.id = arch.portafolio_id
                LEFT JOIN observaciones obs ON arch.id = obs.archivo_id
                WHERE p.docente_id = ?
            `;

            const parametros = [docenteId];

            if (ciclo_id) {
                sql += ` AND p.ciclo_id = ?`;
                parametros.push(ciclo_id);
            }

            if (asignatura_id) {
                sql += ` AND p.asignatura_id = ?`;
                parametros.push(asignatura_id);
            }

            sql += ` GROUP BY p.id ORDER BY ca.anio_actual DESC, p.nivel, p.id`;

            const { resultado: portafolios } = await ejecutarLectura(sql, parametros);

            // Construir árbol jerárquico
            const arbol = this.construirArbolJerarquico(portafolios);

            // Calcular progreso general
            const progresoGeneral = this.calcularProgresoGeneral(portafolios);

            return respuestaExitosa(res, {
                docente_id: docenteId,
                total_portafolios: portafolios.length,
                mis_portafolios: arbol,
                progreso_general: progresoGeneral,
                filtros_aplicados: { ciclo_id, asignatura_id }
            }, 'Árbol de estructura para docente obtenido correctamente');

        } catch (error) {
            console.error('❌ Error al obtener árbol docente:', error);
            return manejarError(res, error, 'Error al obtener estructura de docente');
        }
    }

    // ===================================================
    // 👨‍💼 OBTENER ÁRBOL DE ESTRUCTURA PARA VERIFICADOR
    // ===================================================
    async obtenerArbolVerificador(req, res) {
        try {
            const { ciclo_id = null, docente_id = null } = req.query;
            const verificadorId = req.usuario.id;

            let sql = `
                SELECT 
                    p.id, p.nombre, p.nivel, p.ruta, p.estado, p.progreso_completado,
                    p.carpeta_padre_id, p.estructura_id, p.creado_en,
                    CONCAT(u.nombres, ' ', u.apellidos) as docente_nombre,
                    u.correo as docente_correo, u.id as docente_id,
                    a.nombre as asignatura_nombre, a.codigo as asignatura_codigo,
                    ca.nombre as ciclo_nombre,
                    COUNT(DISTINCT arch.id) as total_archivos,
                    COUNT(DISTINCT CASE WHEN arch.estado = 'pendiente' THEN arch.id END) as archivos_pendientes,
                    COUNT(DISTINCT CASE WHEN arch.estado = 'en_revision' THEN arch.id END) as archivos_en_revision,
                    COUNT(DISTINCT CASE WHEN arch.estado = 'aprobado' THEN arch.id END) as archivos_aprobados,
                    COUNT(DISTINCT CASE WHEN arch.estado = 'rechazado' THEN arch.id END) as archivos_rechazados,
                    MAX(arch.fecha_subida) as ultima_subida,
                    COUNT(DISTINCT obs.id) as total_observaciones_realizadas
                FROM portafolios p
                JOIN usuarios u ON p.docente_id = u.id
                JOIN verificadores_docentes vd ON p.docente_id = vd.docente_id AND p.ciclo_id = vd.ciclo_id
                LEFT JOIN asignaturas a ON p.asignatura_id = a.id
                JOIN ciclos_academicos ca ON p.ciclo_id = ca.id
                LEFT JOIN archivos_subidos arch ON p.id = arch.portafolio_id
                LEFT JOIN observaciones obs ON arch.id = obs.archivo_id AND obs.verificador_id = ?
                WHERE vd.verificador_id = ? AND vd.activo = 1 AND u.activo = 1
            `;

            const parametros = [verificadorId, verificadorId];

            if (ciclo_id) {
                sql += ` AND p.ciclo_id = ?`;
                parametros.push(ciclo_id);
            }

            if (docente_id) {
                sql += ` AND p.docente_id = ?`;
                parametros.push(docente_id);
            }

            sql += ` GROUP BY p.id ORDER BY ca.anio_actual DESC, u.apellidos, u.nombres, p.nivel, p.id`;

            const { resultado: portafolios } = await ejecutarLectura(sql, parametros);

            // Construir árbol jerárquico agrupado por docente
            const arbolPorDocente = {};
            const estadisticasVerificacion = {
                total_docentes: 0,
                total_portafolios: portafolios.length,
                archivos_por_revisar: 0,
                archivos_en_revision: 0,
                archivos_finalizados: 0
            };
            
            portafolios.forEach(portafolio => {
                const docenteKey = `${portafolio.docente_id}_${portafolio.docente_nombre}`;
                
                if (!arbolPorDocente[docenteKey]) {
                    arbolPorDocente[docenteKey] = {
                        docente_id: portafolio.docente_id,
                        docente_nombre: portafolio.docente_nombre,
                        docente_correo: portafolio.docente_correo,
                        portafolios: [],
                        estadisticas: {
                            total_archivos: 0,
                            archivos_pendientes: 0,
                            archivos_en_revision: 0,
                            archivos_aprobados: 0,
                            archivos_rechazados: 0
                        }
                    };
                    estadisticasVerificacion.total_docentes++;
                }
                
                arbolPorDocente[docenteKey].portafolios.push(portafolio);
                
                // Acumular estadísticas por docente
                arbolPorDocente[docenteKey].estadisticas.total_archivos += portafolio.total_archivos;
                arbolPorDocente[docenteKey].estadisticas.archivos_pendientes += portafolio.archivos_pendientes;
                arbolPorDocente[docenteKey].estadisticas.archivos_en_revision += portafolio.archivos_en_revision;
                arbolPorDocente[docenteKey].estadisticas.archivos_aprobados += portafolio.archivos_aprobados;
                arbolPorDocente[docenteKey].estadisticas.archivos_rechazados += portafolio.archivos_rechazados;
                
                // Acumular estadísticas generales
                estadisticasVerificacion.archivos_por_revisar += portafolio.archivos_pendientes;
                estadisticasVerificacion.archivos_en_revision += portafolio.archivos_en_revision;
                estadisticasVerificacion.archivos_finalizados += (portafolio.archivos_aprobados + portafolio.archivos_rechazados);
            });

            // Convertir objeto a array y construir árboles jerárquicos para cada docente
            const docentesAsignados = Object.values(arbolPorDocente).map(docente => {
                docente.arbol_portafolios = this.construirArbolJerarquico(docente.portafolios);
                delete docente.portafolios; // Limpiar array original
                return docente;
            });

            return respuestaExitosa(res, {
                verificador_id: verificadorId,
                total_docentes_asignados: estadisticasVerificacion.total_docentes,
                total_portafolios: estadisticasVerificacion.total_portafolios,
                docentes_asignados: docentesAsignados,
                estadisticas_verificacion: estadisticasVerificacion,
                filtros_aplicados: { ciclo_id, docente_id }
            }, 'Árbol de estructura para verificador obtenido correctamente');

        } catch (error) {
            console.error('❌ Error al obtener árbol verificador:', error);
            return manejarError(res, error, 'Error al obtener estructura de verificador');
        }
    }

    // ===================================================
    // 🎨 PERSONALIZAR ESTRUCTURA DE PORTAFOLIO
    // ===================================================
    async personalizarEstructura(req, res) {
        try {
            const { 
                portafolio_id, 
                personalizaciones,
                mantener_estructura_base = true 
            } = req.body;
            const usuarioId = req.usuario.id;

            // Validar datos
            if (!portafolio_id || !personalizaciones || !Array.isArray(personalizaciones)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'ID de portafolio y personalizaciones son obligatorios',
                    codigo: 'DATOS_INCOMPLETOS'
                });
            }

            // Verificar que el portafolio existe y el usuario tiene permisos
            const sqlVerificarPortafolio = `
                SELECT p.*, CONCAT(u.nombres, ' ', u.apellidos) as docente_nombre
                FROM portafolios p
                JOIN usuarios u ON p.docente_id = u.id
                WHERE p.id = ? AND (p.docente_id = ? OR ? IN (
                    SELECT ur.usuario_id FROM usuarios_roles ur 
                    WHERE ur.rol = 'administrador' AND ur.activo = 1
                ))
            `;

            const { resultado: portafolios } = await ejecutarLectura(sqlVerificarPortafolio, [portafolio_id, usuarioId, usuarioId]);

            if (portafolios.length === 0) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para personalizar este portafolio',
                    codigo: 'SIN_PERMISOS'
                });
            }

            const portafolio = portafolios[0];

            // Aplicar personalizaciones usando transacción
            const operaciones = [];

            for (const personalizacion of personalizaciones) {
                const { 
                    accion, // 'agregar', 'eliminar', 'modificar', 'reordenar'
                    carpeta_id = null,
                    nombre = null,
                    descripcion = null,
                    icono = 'folder',
                    color = '#007bff',
                    nuevo_orden = null,
                    carpeta_padre_id = null
                } = personalizacion;

                switch (accion) {
                    case 'agregar':
                        if (!nombre) {
                            return res.status(400).json({
                                exito: false,
                                mensaje: 'El nombre es obligatorio para agregar carpetas',
                                codigo: 'NOMBRE_REQUERIDO'
                            });
                        }

                        operaciones.push({
                            sql: `
                                INSERT INTO portafolios (
                                    nombre, docente_id, asignatura_id, semestre_id, ciclo_id,
                                    carpeta_padre_id, nivel, ruta, estado, creado_en
                                ) VALUES (?, ?, ?, ?, ?, ?, 
                                    COALESCE((SELECT MAX(nivel) + 1 FROM portafolios p2 WHERE p2.carpeta_padre_id = ?), 1),
                                    CONCAT(?, '/', ?), 'activo', NOW())
                            `,
                            parametros: [
                                nombre, portafolio.docente_id, portafolio.asignatura_id, 
                                portafolio.semestre_id, portafolio.ciclo_id,
                                carpeta_padre_id || portafolio_id, carpeta_padre_id || portafolio_id,
                                portafolio.ruta, nombre
                            ],
                            punto: `agregar_carpeta_${nombre.replace(/\s+/g, '_').toLowerCase()}`
                        });
                        break;

                    case 'eliminar':
                        if (!carpeta_id) {
                            return res.status(400).json({
                                exito: false,
                                mensaje: 'ID de carpeta es obligatorio para eliminar',
                                codigo: 'ID_CARPETA_REQUERIDO'
                            });
                        }

                        // Verificar que no tenga archivos
                        operaciones.push({
                            sql: `
                                UPDATE portafolios SET estado = 'eliminado', actualizado_en = NOW()
                                WHERE id = ? AND docente_id = ? 
                                AND NOT EXISTS (SELECT 1 FROM archivos_subidos WHERE portafolio_id = ?)
                            `,
                            parametros: [carpeta_id, portafolio.docente_id, carpeta_id],
                            punto: `eliminar_carpeta_${carpeta_id}`
                        });
                        break;

                    case 'modificar':
                        if (!carpeta_id) {
                            return res.status(400).json({
                                exito: false,
                                mensaje: 'ID de carpeta es obligatorio para modificar',
                                codigo: 'ID_CARPETA_REQUERIDO'
                            });
                        }

                        const camposActualizar = [];
                        const valoresActualizar = [];

                        if (nombre) {
                            camposActualizar.push('nombre = ?');
                            valoresActualizar.push(nombre);
                        }

                        if (camposActualizar.length > 0) {
                            valoresActualizar.push(carpeta_id, portafolio.docente_id);
                            operaciones.push({
                                sql: `
                                    UPDATE portafolios 
                                    SET ${camposActualizar.join(', ')}, actualizado_en = NOW()
                                    WHERE id = ? AND docente_id = ?
                                `,
                                parametros: valoresActualizar,
                                punto: `modificar_carpeta_${carpeta_id}`
                            });
                        }
                        break;

                    case 'reordenar':
                        if (!carpeta_id || nuevo_orden === null) {
                            return res.status(400).json({
                                exito: false,
                                mensaje: 'ID de carpeta y nuevo orden son obligatorios para reordenar',
                                codigo: 'DATOS_REORDEN_INCOMPLETOS'
                            });
                        }

                        operaciones.push({
                            sql: `
                                UPDATE portafolios 
                                SET nivel = ?, actualizado_en = NOW()
                                WHERE id = ? AND docente_id = ?
                            `,
                            parametros: [nuevo_orden, carpeta_id, portafolio.docente_id],
                            punto: `reordenar_carpeta_${carpeta_id}`
                        });
                        break;

                    default:
                        return res.status(400).json({
                            exito: false,
                            mensaje: `Acción '${accion}' no es válida`,
                            codigo: 'ACCION_INVALIDA'
                        });
                }
            }

            // Ejecutar todas las operaciones
            if (operaciones.length > 0) {
                await ejecutarTransaccionCompleja(operaciones);
            }

            // Obtener estructura actualizada
            const estructuraActualizada = await estructuraServicio.obtenerEstructuraCompleta(portafolio_id);

            // Registrar auditoría
            await registrarAccion({
                usuario_id: usuarioId,
                accion: 'personalizar_estructura',
                modulo: 'portafolios',
                descripcion: `Personalizó estructura del portafolio ${portafolio_id}`,
                datos_nuevos: {
                    portafolio_id,
                    personalizaciones_aplicadas: personalizaciones.length,
                    tipos_personalizacion: personalizaciones.map(p => p.accion)
                },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            console.log(`✅ Estructura personalizada para portafolio ${portafolio_id} por usuario ${usuarioId}`);

            return respuestaExitosa(res, {
                portafolio: {
                    id: portafolio_id,
                    nombre: portafolio.nombre,
                    docente: portafolio.docente_nombre
                },
                personalizaciones_aplicadas: personalizaciones.length,
                estructura_actualizada: estructuraActualizada
            }, 'Estructura personalizada exitosamente');

        } catch (error) {
            console.error('❌ Error al personalizar estructura:', error);
            return manejarError(res, error, 'Error al personalizar estructura');
        }
    }

    // ===================================================
    // 📋 OBTENER ESTRUCTURA BASE DEL SISTEMA
    // ===================================================
    async obtenerEstructuraBase(req, res) {
        try {
            const sql = `
                SELECT 
                    id, nombre, descripcion, nivel, orden, 
                    requiere_credito, carpeta_padre_id, 
                    pertenece_presentacion, icono, color, activo,
                    creado_en, actualizado_en
                FROM estructura_portafolio_base 
                WHERE activo = 1 
                ORDER BY nivel ASC, orden ASC
            `;

            const { resultado: estructura } = await ejecutarLectura(sql);

            // Construir árbol jerárquico de la estructura base
            const arbolEstructura = this.construirArbolJerarquico(estructura, 'carpeta_padre_id');

            return respuestaExitosa(res, {
                total_elementos: estructura.length,
                estructura_base: estructura,
                arbol_estructura: arbolEstructura
            }, 'Estructura base obtenida correctamente');

        } catch (error) {
            console.error('❌ Error al obtener estructura base:', error);
            return manejarError(res, error, 'Error al obtener estructura base');
        }
    }

    // ===================================================
    // 📊 OBTENER ESTADÍSTICAS DE ESTRUCTURA
    // ===================================================
    async obtenerEstadisticasEstructura(req, res) {
        try {
            const { ciclo_id = null } = req.query;

            // Estadísticas generales
            let sqlGeneral = `
                SELECT 
                    COUNT(DISTINCT p.id) as total_portafolios,
                    COUNT(DISTINCT p.docente_id) as total_docentes,
                    COUNT(DISTINCT CASE WHEN p.carpeta_padre_id IS NULL THEN p.id END) as portafolios_principales,
                    COUNT(DISTINCT CASE WHEN p.carpeta_padre_id IS NOT NULL THEN p.id END) as carpetas_secundarias,
                    AVG(p.progreso_completado) as progreso_promedio,
                    COUNT(DISTINCT CASE WHEN p.estado = 'activo' THEN p.id END) as portafolios_activos,
                    COUNT(DISTINCT CASE WHEN p.estado = 'bloqueado' THEN p.id END) as portafolios_bloqueados
                FROM portafolios p
                JOIN usuarios u ON p.docente_id = u.id
                WHERE u.activo = 1
            `;

            const parametros = [];
            if (ciclo_id) {
                sqlGeneral += ` AND p.ciclo_id = ?`;
                parametros.push(ciclo_id);
            }

            const { resultado: estadisticasGenerales } = await ejecutarLectura(sqlGeneral, parametros);

            // Estadísticas por nivel
            let sqlPorNivel = `
                SELECT 
                    p.nivel,
                    COUNT(*) as total_carpetas,
                    AVG(p.progreso_completado) as progreso_promedio_nivel,
                    COUNT(DISTINCT arch.id) as total_archivos_nivel
                FROM portafolios p
                LEFT JOIN archivos_subidos arch ON p.id = arch.portafolio_id
                JOIN usuarios u ON p.docente_id = u.id
                WHERE u.activo = 1
            `;

            if (ciclo_id) {
                sqlPorNivel += ` AND p.ciclo_id = ?`;
            }

            sqlPorNivel += ` GROUP BY p.nivel ORDER BY p.nivel`;

            const { resultado: estadisticasPorNivel } = await ejecutarLectura(sqlPorNivel, parametros);

            // Estadísticas de elementos más utilizados
            let sqlElementosPopulares = `
                SELECT 
                    eb.nombre as elemento_nombre,
                    eb.descripcion,
                    eb.icono,
                    eb.color,
                    COUNT(p.id) as veces_utilizado,
                    AVG(p.progreso_completado) as progreso_promedio_elemento
                FROM estructura_portafolio_base eb
                LEFT JOIN portafolios p ON eb.id = p.estructura_id
                LEFT JOIN usuarios u ON p.docente_id = u.id
                WHERE eb.activo = 1 AND (u.activo = 1 OR u.id IS NULL)
            `;

            if (ciclo_id) {
                sqlElementosPopulares += ` AND (p.ciclo_id = ? OR p.id IS NULL)`;
            }

            sqlElementosPopulares += ` 
                GROUP BY eb.id 
                ORDER BY veces_utilizado DESC, progreso_promedio_elemento DESC
                LIMIT 10
            `;

            const { resultado: elementosPopulares } = await ejecutarLectura(sqlElementosPopulares, parametros);

            return respuestaExitosa(res, {
                estadisticas_generales: estadisticasGenerales[0],
                estadisticas_por_nivel: estadisticasPorNivel,
                elementos_mas_utilizados: elementosPopulares,
                filtros_aplicados: { ciclo_id }
            }, 'Estadísticas de estructura obtenidas correctamente');

        } catch (error) {
            console.error('❌ Error al obtener estadísticas de estructura:', error);
            return manejarError(res, error, 'Error al obtener estadísticas');
        }
    }

    // ===================================================
    // 🔄 CLONAR ESTRUCTURA ENTRE CICLOS
    // ===================================================
    async clonarEstructura(req, res) {
        try {
            const { 
                ciclo_origen_id, 
                ciclo_destino_id, 
                docentes_seleccionados = null, // null = todos los docentes
                mantener_progreso = false 
            } = req.body;
            const usuarioId = req.usuario.id;

            // Validar datos
            if (!ciclo_origen_id || !ciclo_destino_id) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Ciclo origen y destino son obligatorios',
                    codigo: 'CICLOS_REQUERIDOS'
                });
            }

            if (ciclo_origen_id === ciclo_destino_id) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'El ciclo origen y destino no pueden ser el mismo',
                    codigo: 'CICLOS_IGUALES'
                });
            }

            // Verificar que los ciclos existen
            const sqlVerificarCiclos = `
                SELECT id, nombre, estado FROM ciclos_academicos 
                WHERE id IN (?, ?) AND estado != 'eliminado'
            `;

            const { resultado: ciclos } = await ejecutarLectura(sqlVerificarCiclos, [ciclo_origen_id, ciclo_destino_id]);

            if (ciclos.length !== 2) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Uno o ambos ciclos no existen o están eliminados',
                    codigo: 'CICLOS_NO_ENCONTRADOS'
                });
            }

            // Obtener portafolios del ciclo origen
            let sqlPortafoliosOrigen = `
                SELECT DISTINCT
                    p.docente_id, p.asignatura_id, p.semestre_id,
                    CONCAT(u.nombres, ' ', u.apellidos) as docente_nombre,
                    a.nombre as asignatura_nombre, a.codigo
                FROM portafolios p
                JOIN usuarios u ON p.docente_id = u.id
                JOIN asignaturas a ON p.asignatura_id = a.id
                WHERE p.ciclo_id = ? AND p.carpeta_padre_id IS NULL
                AND u.activo = 1 AND a.activo = 1
            `;

            const parametrosOrigen = [ciclo_origen_id];

            if (docentes_seleccionados && Array.isArray(docentes_seleccionados) && docentes_seleccionados.length > 0) {
                sqlPortafoliosOrigen += ` AND p.docente_id IN (${docentes_seleccionados.map(() => '?').join(',')})`;
                parametrosOrigen.push(...docentes_seleccionados);
            }

            const { resultado: portafoliosOrigen } = await ejecutarLectura(sqlPortafoliosOrigen, parametrosOrigen);

            if (portafoliosOrigen.length === 0) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'No se encontraron portafolios en el ciclo origen con los criterios especificados',
                    codigo: 'SIN_PORTAFOLIOS_ORIGEN'
                });
            }

            // Verificar asignaciones en el ciclo destino
            const resultadosClonacion = [];
            let totalExitosos = 0;
            let totalFallidos = 0;

            for (const portafolio of portafoliosOrigen) {
                try {
                    // Verificar que existe la asignación en el ciclo destino
                    const sqlVerificarAsignacion = `
                        SELECT id FROM docentes_asignaturas 
                        WHERE docente_id = ? AND asignatura_id = ? AND ciclo_id = ? AND activo = 1
                    `;

                    const { resultado: asignacionDestino } = await ejecutarLectura(sqlVerificarAsignacion, [
                        portafolio.docente_id, portafolio.asignatura_id, ciclo_destino_id
                    ]);

                    if (asignacionDestino.length === 0) {
                        resultadosClonacion.push({
                            docente: portafolio.docente_nombre,
                            asignatura: portafolio.asignatura_nombre,
                            estado: 'fallido',
                            motivo: 'No existe asignación en el ciclo destino'
                        });
                        totalFallidos++;
                        continue;
                    }

                    // Verificar que no existe ya un portafolio en el destino
                    const sqlPortafolioExistente = `
                        SELECT id FROM portafolios 
                        WHERE docente_id = ? AND asignatura_id = ? AND ciclo_id = ? 
                        AND carpeta_padre_id IS NULL
                    `;

                    const { resultado: portafolioExistente } = await ejecutarLectura(sqlPortafolioExistente, [
                        portafolio.docente_id, portafolio.asignatura_id, ciclo_destino_id
                    ]);

                    if (portafolioExistente.length > 0) {
                        resultadosClonacion.push({
                            docente: portafolio.docente_nombre,
                            asignatura: portafolio.asignatura_nombre,
                            estado: 'omitido',
                            motivo: 'Ya existe un portafolio en el ciclo destino'
                        });
                        continue;
                    }

                    // Clonar estructura usando el método generarEstructura
                    const mockReq = {
                        body: {
                            docente_id: portafolio.docente_id,
                            asignatura_id: portafolio.asignatura_id,
                            ciclo_id: ciclo_destino_id
                        },
                        usuario: { id: usuarioId },
                        ip: req.ip,
                        get: req.get.bind(req)
                    };

                    const mockRes = {
                        status: () => ({ json: () => {} }),
                        json: () => {}
                    };

                    await this.generarEstructura(mockReq, mockRes);

                    resultadosClonacion.push({
                        docente: portafolio.docente_nombre,
                        asignatura: portafolio.asignatura_nombre,
                        estado: 'exitoso',
                        motivo: 'Estructura clonada correctamente'
                    });
                    totalExitosos++;

                } catch (error) {
                    console.error(`❌ Error al clonar portafolio de ${portafolio.docente_nombre}:`, error);
                    resultadosClonacion.push({
                        docente: portafolio.docente_nombre,
                        asignatura: portafolio.asignatura_nombre,
                        estado: 'fallido',
                        motivo: 'Error interno durante la clonación'
                    });
                    totalFallidos++;
                }
            }

            // Registrar auditoría de clonación
            await registrarAccion({
                usuario_id: usuarioId,
                accion: 'clonar_estructura',
                modulo: 'portafolios',
                descripcion: `Clonó estructuras del ciclo ${ciclo_origen_id} al ${ciclo_destino_id}`,
                datos_nuevos: {
                    ciclo_origen_id,
                    ciclo_destino_id,
                    total_procesados: portafoliosOrigen.length,
                    exitosos: totalExitosos,
                    fallidos: totalFallidos
                },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            console.log(`✅ Clonación completada: ${totalExitosos} exitosos, ${totalFallidos} fallidos`);

            return respuestaExitosa(res, {
                resumen: {
                    total_procesados: portafoliosOrigen.length,
                    exitosos: totalExitosos,
                    fallidos: totalFallidos,
                    omitidos: portafoliosOrigen.length - totalExitosos - totalFallidos
                },
                resultados_detallados: resultadosClonacion,
                ciclo_origen: ciclos.find(c => c.id == ciclo_origen_id),
                ciclo_destino: ciclos.find(c => c.id == ciclo_destino_id)
            }, 'Proceso de clonación completado');

        } catch (error) {
            console.error('❌ Error al clonar estructura:', error);
            return manejarError(res, error, 'Error al clonar estructura');
        }
    }

    // ===================================================
    // 🔧 FUNCIONES AUXILIARES
    // ===================================================

    /**
     * 🌳 Construir árbol jerárquico de portafolios
     */
    construirArbolJerarquico(portafolios, campoPadre = 'carpeta_padre_id') {
        const mapa = new Map();
        const raices = [];

        // Crear mapa de todos los elementos
        portafolios.forEach(portafolio => {
            portafolio.hijos = [];
            mapa.set(portafolio.id, portafolio);
        });

        // Construir relaciones padre-hijo
        portafolios.forEach(portafolio => {
            const padreId = portafolio[campoPadre];
            if (padreId && mapa.has(padreId)) {
                mapa.get(padreId).hijos.push(portafolio);
            } else {
                raices.push(portafolio);
            }
        });

        return raices;
    }

    /**
     * 📊 Calcular progreso general
     */
    calcularProgresoGeneral(portafolios) {
        if (portafolios.length === 0) {
            return {
                progreso_promedio: 0,
                total_archivos: 0,
                archivos_aprobados: 0,
                archivos_pendientes: 0
            };
        }

        const totalArchivos = portafolios.reduce((sum, p) => sum + (p.total_archivos || 0), 0);
        const archivosAprobados = portafolios.reduce((sum, p) => sum + (p.archivos_aprobados || 0), 0);
        const archivosPendientes = portafolios.reduce((sum, p) => sum + (p.archivos_pendientes || 0), 0);
        const progresoPromedio = portafolios.reduce((sum, p) => sum + (p.progreso_completado || 0), 0) / portafolios.length;

        return {
            progreso_promedio: Math.round(progresoPromedio * 100) / 100,
            total_archivos: totalArchivos,
            archivos_aprobados: archivosAprobados,
            archivos_pendientes: archivosPendientes,
            porcentaje_aprobados: totalArchivos > 0 ? Math.round((archivosAprobados / totalArchivos) * 100) : 0
        };
    }

    /**
     * 📈 Obtener estadísticas generales
     */
    async obtenerEstadisticasGenerales(filtros = {}) {
        try {
            let sql = `
                SELECT 
                    COUNT(DISTINCT p.id) as total_portafolios,
                    COUNT(DISTINCT p.docente_id) as total_docentes_con_portafolios,
                    COUNT(DISTINCT p.asignatura_id) as total_asignaturas_con_portafolios,
                    AVG(p.progreso_completado) as progreso_promedio_sistema,
                    COUNT(DISTINCT CASE WHEN p.estado = 'activo' THEN p.id END) as portafolios_activos,
                    COUNT(DISTINCT CASE WHEN p.estado = 'bloqueado' THEN p.id END) as portafolios_bloqueados,
                    COUNT(DISTINCT arch.id) as total_archivos_sistema,
                    COUNT(DISTINCT CASE WHEN arch.estado = 'aprobado' THEN arch.id END) as archivos_aprobados_sistema
                FROM portafolios p
                LEFT JOIN archivos_subidos arch ON p.id = arch.portafolio_id
                JOIN usuarios u ON p.docente_id = u.id
                WHERE u.activo = 1
            `;

            const parametros = [];
            
            if (filtros.ciclo_id) {
                sql += ` AND p.ciclo_id = ?`;
                parametros.push(filtros.ciclo_id);
            }

            const { resultado } = await ejecutarLectura(sql, parametros);
            return resultado[0];

        } catch (error) {
            console.error('❌ Error al obtener estadísticas generales:', error);
            return null;
        }
    }
}

module.exports = new EstructuraPortafoliosControlador();