/**
 * 👨‍🏫 CONTROLADOR DE ASIGNACIONES DOCENTE-ASIGNATURA
 * 
 * Gestiona la relación entre docentes y las materias que imparten:
 * - Asignar docentes a asignaturas
 * - Manejar múltiples asignaciones por docente
 * - Asignaciones por ciclo académico
 * - Historial de asignaciones
 * - Validar disponibilidad y competencias
 * 
 * Rutas que maneja:
 * POST /api/v1/asignaturas/asignar-docente - Asignar docente
 * GET /api/v1/asignaturas/:id/docentes - Docentes asignados
 * GET /api/v1/docentes/:id/asignaturas - Asignaturas del docente
 */

// TODO: Un docente puede tener múltiples asignaturas
// TODO: Una asignatura puede tener múltiples docentes
// TODO: Validar competencias del docente para la materia
// TODO: Notificar al docente sobre nuevas asignaciones
/**
 * 👨‍🏫 CONTROLADOR ASIGNACIONES - Sistema Portafolio Docente UNSAAC
 * Gestión de asignaciones docente ↔ asignatura
 */

const { ejecutarConsulta } = require('../../base_datos/conexiones/pool.conexion');

/**
 * ➕ Asignar docente a asignatura
 */
async function asignarDocente(req, res) {
    try {
        const { docente_id, asignatura_id, ciclo_id } = req.body;

        // Validar datos básicos
        if (!docente_id || !asignatura_id || !ciclo_id) {
            return res.status(400).json({
                success: false,
                message: 'Docente, asignatura y ciclo son obligatorios'
            });
        }

        // Verificar que el docente tiene el rol correspondiente
        const docenteValido = await ejecutarConsulta(
            `SELECT u.id, u.nombres, u.apellidos
             FROM usuarios u
             JOIN usuarios_roles ur ON u.id = ur.usuario_id
             WHERE u.id = ? AND ur.rol = 'docente' AND ur.activo = 1 AND u.activo = 1`,
            [docente_id]
        );

        if (docenteValido.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El usuario no es un docente válido'
            });
        }

        // Verificar que la asignatura existe
        const asignaturaExistente = await ejecutarConsulta(
            'SELECT id, nombre, codigo FROM asignaturas WHERE id = ? AND activo = 1',
            [asignatura_id]
        );

        if (asignaturaExistente.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Asignatura no encontrada'
            });
        }

        // Verificar que el ciclo existe
        const cicloExistente = await ejecutarConsulta(
            'SELECT id, nombre FROM ciclos_academicos WHERE id = ?',
            [ciclo_id]
        );

        if (cicloExistente.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Ciclo académico no encontrado'
            });
        }

        // Verificar que no esté ya asignado
        const asignacionExistente = await ejecutarConsulta(
            'SELECT id FROM docentes_asignaturas WHERE docente_id = ? AND asignatura_id = ? AND ciclo_id = ? AND activo = 1',
            [docente_id, asignatura_id, ciclo_id]
        );

        if (asignacionExistente.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El docente ya está asignado a esta asignatura en este ciclo'
            });
        }

        // Crear asignación
        await ejecutarConsulta(
            `INSERT INTO docentes_asignaturas (docente_id, asignatura_id, ciclo_id, asignado_por)
             VALUES (?, ?, ?, ?)`,
            [docente_id, asignatura_id, ciclo_id, req.usuario.id]
        );

        const docente = docenteValido[0];
        const asignatura = asignaturaExistente[0];
        const ciclo = cicloExistente[0];

        res.json({
            success: true,
            message: `${docente.nombres} ${docente.apellidos} asignado exitosamente a ${asignatura.nombre}`,
            asignacion: {
                docente: `${docente.nombres} ${docente.apellidos}`,
                asignatura: `${asignatura.codigo} - ${asignatura.nombre}`,
                ciclo: ciclo.nombre
            }
        });

    } catch (error) {
        console.error('❌ Error al asignar docente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * ➖ Revocar asignación docente-asignatura
 */
async function revocarAsignacion(req, res) {
    try {
        const { docente_id, asignatura_id, ciclo_id } = req.body;

        // Validar datos básicos
        if (!docente_id || !asignatura_id || !ciclo_id) {
            return res.status(400).json({
                success: false,
                message: 'Docente, asignatura y ciclo son obligatorios'
            });
        }

        // Verificar que la asignación existe
        const asignacionExistente = await ejecutarConsulta(
            `SELECT da.id, 
                    CONCAT(u.nombres, ' ', u.apellidos) as docente_nombre,
                    a.nombre as asignatura_nombre,
                    ca.nombre as ciclo_nombre
             FROM docentes_asignaturas da
             JOIN usuarios u ON da.docente_id = u.id
             JOIN asignaturas a ON da.asignatura_id = a.id
             JOIN ciclos_academicos ca ON da.ciclo_id = ca.id
             WHERE da.docente_id = ? AND da.asignatura_id = ? AND da.ciclo_id = ? AND da.activo = 1`,
            [docente_id, asignatura_id, ciclo_id]
        );

        if (asignacionExistente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró la asignación especificada'
            });
        }

        // Verificar que no tenga portafolios activos
        const portafoliosActivos = await ejecutarConsulta(
            `SELECT id FROM portafolios 
             WHERE docente_id = ? AND asignatura_id = ? AND ciclo_id = ? AND estado = 'activo'`,
            [docente_id, asignatura_id, ciclo_id]
        );

        if (portafoliosActivos.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede revocar la asignación porque existen portafolios activos'
            });
        }

        // Revocar asignación
        await ejecutarConsulta(
            'UPDATE docentes_asignaturas SET activo = 0 WHERE docente_id = ? AND asignatura_id = ? AND ciclo_id = ?',
            [docente_id, asignatura_id, ciclo_id]
        );

        const asignacion = asignacionExistente[0];

        res.json({
            success: true,
            message: `Asignación revocada: ${asignacion.docente_nombre} ya no está asignado a ${asignacion.asignatura_nombre}`
        });

    } catch (error) {
        console.error('❌ Error al revocar asignación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * 📋 Listar asignaciones
 */
async function listarAsignaciones(req, res) {
    try {
        const { 
            ciclo_id = '', 
            docente_id = '', 
            asignatura_id = '',
            carrera = '',
            activo = 1,
            pagina = 1,
            limite = 20 
        } = req.query;

        const offset = (pagina - 1) * limite;

        let sql = `
            SELECT 
                da.id, da.fecha_asignacion, da.activo,
                u.id as docente_id,
                CONCAT(u.nombres, ' ', u.apellidos) as docente_nombre,
                u.correo as docente_correo,
                a.id as asignatura_id,
                a.nombre as asignatura_nombre,
                a.codigo as asignatura_codigo,
                a.carrera, a.semestre, a.creditos,
                ca.id as ciclo_id,
                ca.nombre as ciclo_nombre,
                CONCAT(ua.nombres, ' ', ua.apellidos) as asignado_por_nombre
            FROM docentes_asignaturas da
            JOIN usuarios u ON da.docente_id = u.id
            JOIN asignaturas a ON da.asignatura_id = a.id
            JOIN ciclos_academicos ca ON da.ciclo_id = ca.id
            LEFT JOIN usuarios ua ON da.asignado_por = ua.id
            WHERE 1=1
        `;

        const parametros = [];

        // Filtros
        if (ciclo_id) {
            sql += ` AND da.ciclo_id = ?`;
            parametros.push(ciclo_id);
        }

        if (docente_id) {
            sql += ` AND da.docente_id = ?`;
            parametros.push(docente_id);
        }

        if (asignatura_id) {
            sql += ` AND da.asignatura_id = ?`;
            parametros.push(asignatura_id);
        }

        if (carrera) {
            sql += ` AND a.carrera LIKE ?`;
            parametros.push(`%${carrera}%`);
        }

        if (activo !== null) {
            sql += ` AND da.activo = ?`;
            parametros.push(activo);
        }

        sql += ` ORDER BY da.fecha_asignacion DESC LIMIT ? OFFSET ?`;
        parametros.push(parseInt(limite), parseInt(offset));

        const asignaciones = await ejecutarConsulta(sql, parametros);

        // Contar total
        let sqlCount = `
            SELECT COUNT(*) as total
            FROM docentes_asignaturas da
            JOIN usuarios u ON da.docente_id = u.id
            JOIN asignaturas a ON da.asignatura_id = a.id
            JOIN ciclos_academicos ca ON da.ciclo_id = ca.id
            WHERE 1=1
        `;

        const parametrosCount = parametros.slice(0, -2);

        if (ciclo_id) parametrosCount.push(ciclo_id);
        if (docente_id) parametrosCount.push(docente_id);
        if (asignatura_id) parametrosCount.push(asignatura_id);
        if (carrera) parametrosCount.push(`%${carrera}%`);
        if (activo !== null) parametrosCount.push(activo);

        // Reconstruir la consulta de conteo con los mismos filtros
        let countIndex = 0;
        if (ciclo_id) {
            sqlCount += ` AND da.ciclo_id = ?`;
            countIndex++;
        }
        if (docente_id) {
            sqlCount += ` AND da.docente_id = ?`;
            countIndex++;
        }
        if (asignatura_id) {
            sqlCount += ` AND da.asignatura_id = ?`;
            countIndex++;
        }
        if (carrera) {
            sqlCount += ` AND a.carrera LIKE ?`;
            countIndex++;
        }
        if (activo !== null) {
            sqlCount += ` AND da.activo = ?`;
            countIndex++;
        }

        const [{ total }] = await ejecutarConsulta(sqlCount, parametrosCount);

        res.json({
            success: true,
            asignaciones,
            paginacion: {
                pagina_actual: parseInt(pagina),
                limite: parseInt(limite),
                total,
                total_paginas: Math.ceil(total / limite)
            }
        });

    } catch (error) {
        console.error('❌ Error al listar asignaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * 📚 Obtener asignaturas de un docente
 */
async function obtenerAsignaturasDocente(req, res) {
    try {
        const { docente_id } = req.params;
        const { ciclo_id = null, activo = 1 } = req.query;

        let sql = `
            SELECT 
                a.id, a.nombre, a.codigo, a.carrera, a.semestre, 
                a.creditos, a.tipo,
                ca.id as ciclo_id, ca.nombre as ciclo_nombre,
                da.fecha_asignacion,
                COUNT(DISTINCT p.id) as total_portafolios,
                AVG(p.progreso_completado) as progreso_promedio
            FROM docentes_asignaturas da
            JOIN asignaturas a ON da.asignatura_id = a.id
            JOIN ciclos_academicos ca ON da.ciclo_id = ca.id
            LEFT JOIN portafolios p ON da.docente_id = p.docente_id AND da.asignatura_id = p.asignatura_id
            WHERE da.docente_id = ? AND da.activo = ?
        `;

        const parametros = [docente_id, activo];

        if (ciclo_id) {
            sql += ` AND da.ciclo_id = ?`;
            parametros.push(ciclo_id);
        }

        sql += ` GROUP BY da.id ORDER BY ca.anio_actual DESC, ca.semestre_actual DESC, a.nombre`;

        const asignaturas = await ejecutarConsulta(sql, parametros);

        res.json({
            success: true,
            docente_id: parseInt(docente_id),
            total_asignaturas: asignaturas.length,
            asignaturas
        });

    } catch (error) {
        console.error('❌ Error al obtener asignaturas del docente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * 👥 Obtener docentes de una asignatura
 */
async function obtenerDocentesAsignatura(req, res) {
    try {
        const { asignatura_id } = req.params;
        const { ciclo_id = null, activo = 1 } = req.query;

        let sql = `
            SELECT 
                u.id, u.nombres, u.apellidos, u.correo, u.telefono,
                CONCAT(u.nombres, ' ', u.apellidos) as nombre_completo,
                da.fecha_asignacion,
                ca.id as ciclo_id, ca.nombre as ciclo_nombre,
                COUNT(DISTINCT p.id) as total_portafolios
            FROM docentes_asignaturas da
            JOIN usuarios u ON da.docente_id = u.id
            JOIN ciclos_academicos ca ON da.ciclo_id = ca.id
            LEFT JOIN portafolios p ON da.docente_id = p.docente_id AND da.asignatura_id = p.asignatura_id
            WHERE da.asignatura_id = ? AND da.activo = ?
        `;

        const parametros = [asignatura_id, activo];

        if (ciclo_id) {
            sql += ` AND da.ciclo_id = ?`;
            parametros.push(ciclo_id);
        }

        sql += ` GROUP BY da.id ORDER BY da.fecha_asignacion DESC`;

        const docentes = await ejecutarConsulta(sql, parametros);

        res.json({
            success: true,
            asignatura_id: parseInt(asignatura_id),
            total_docentes: docentes.length,
            docentes
        });

    } catch (error) {
        console.error('❌ Error al obtener docentes de la asignatura:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * 🔄 Asignación masiva de docentes
 */
async function asignacionMasiva(req, res) {
    try {
        const { docentes_ids, asignatura_id, ciclo_id } = req.body;

        // Validar datos básicos
        if (!docentes_ids || !Array.isArray(docentes_ids) || docentes_ids.length === 0 || !asignatura_id || !ciclo_id) {
            return res.status(400).json({
                success: false,
                message: 'Lista de docentes, asignatura y ciclo son obligatorios'
            });
        }

        // Verificar que la asignatura y ciclo existen
        const asignaturaExistente = await ejecutarConsulta(
            'SELECT id, nombre FROM asignaturas WHERE id = ? AND activo = 1',
            [asignatura_id]
        );

        if (asignaturaExistente.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Asignatura no encontrada'
            });
        }

        const cicloExistente = await ejecutarConsulta(
            'SELECT id, nombre FROM ciclos_academicos WHERE id = ?',
            [ciclo_id]
        );

        if (cicloExistente.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Ciclo académico no encontrado'
            });
        }

        const resultados = {
            exitosos: [],
            fallidos: [],
            ya_asignados: []
        };

        for (const docente_id of docentes_ids) {
            try {
                // Verificar que el docente existe y tiene el rol
                const docenteValido = await ejecutarConsulta(
                    `SELECT u.id, u.nombres, u.apellidos
                     FROM usuarios u
                     JOIN usuarios_roles ur ON u.id = ur.usuario_id
                     WHERE u.id = ? AND ur.rol = 'docente' AND ur.activo = 1 AND u.activo = 1`,
                    [docente_id]
                );

                if (docenteValido.length === 0) {
                    resultados.fallidos.push({
                        docente_id,
                        motivo: 'No es un docente válido'
                    });
                    continue;
                }

                // Verificar si ya está asignado
                const asignacionExistente = await ejecutarConsulta(
                    'SELECT id FROM docentes_asignaturas WHERE docente_id = ? AND asignatura_id = ? AND ciclo_id = ? AND activo = 1',
                    [docente_id, asignatura_id, ciclo_id]
                );

                if (asignacionExistente.length > 0) {
                    resultados.ya_asignados.push({
                        docente_id,
                        nombre: `${docenteValido[0].nombres} ${docenteValido[0].apellidos}`
                    });
                    continue;
                }

                // Crear asignación
                await ejecutarConsulta(
                    `INSERT INTO docentes_asignaturas (docente_id, asignatura_id, ciclo_id, asignado_por)
                     VALUES (?, ?, ?, ?)`,
                    [docente_id, asignatura_id, ciclo_id, req.usuario.id]
                );

                resultados.exitosos.push({
                    docente_id,
                    nombre: `${docenteValido[0].nombres} ${docenteValido[0].apellidos}`
                });

            } catch (error) {
                resultados.fallidos.push({
                    docente_id,
                    motivo: 'Error al procesar asignación'
                });
            }
        }

        res.json({
            success: true,
            message: 'Asignación masiva completada',
            asignatura: asignaturaExistente[0].nombre,
            ciclo: cicloExistente[0].nombre,
            resumen: {
                total_procesados: docentes_ids.length,
                exitosos: resultados.exitosos.length,
                fallidos: resultados.fallidos.length,
                ya_asignados: resultados.ya_asignados.length
            },
            resultados
        });

    } catch (error) {
        console.error('❌ Error en asignación masiva:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * 📊 Estadísticas de asignaciones
 */
async function obtenerEstadisticasAsignaciones(req, res) {
    try {
        const { ciclo_id = null } = req.query;

        // Estadísticas generales
        let sql = `
            SELECT 
                COUNT(*) as total_asignaciones,
                COUNT(DISTINCT docente_id) as docentes_con_asignaciones,
                COUNT(DISTINCT asignatura_id) as asignaturas_asignadas,
                AVG(asignaciones_por_docente.total) as promedio_asignaturas_por_docente
            FROM docentes_asignaturas da
            JOIN (
                SELECT docente_id, COUNT(*) as total
                FROM docentes_asignaturas
                WHERE activo = 1
                GROUP BY docente_id
            ) as asignaciones_por_docente ON da.docente_id = asignaciones_por_docente.docente_id
            WHERE da.activo = 1
        `;

        const parametros = [];

        if (ciclo_id) {
            sql += ` AND da.ciclo_id = ?`;
            parametros.push(ciclo_id);
        }

        const estadisticasGenerales = await ejecutarConsulta(sql, parametros);

        // Docentes con más asignaturas
        let sqlTopDocentes = `
            SELECT 
                CONCAT(u.nombres, ' ', u.apellidos) as docente_nombre,
                COUNT(*) as total_asignaturas,
                GROUP_CONCAT(DISTINCT a.carrera) as carreras
            FROM docentes_asignaturas da
            JOIN usuarios u ON da.docente_id = u.id
            JOIN asignaturas a ON da.asignatura_id = a.id
            WHERE da.activo = 1
        `;

        if (ciclo_id) {
            sqlTopDocentes += ` AND da.ciclo_id = ?`;
        }

        sqlTopDocentes += `
            GROUP BY da.docente_id
            ORDER BY total_asignaturas DESC
            LIMIT 10
        `;

        const topDocentes = await ejecutarConsulta(sqlTopDocentes, ciclo_id ? [ciclo_id] : []);

        // Asignaturas por carrera
        let sqlPorCarrera = `
            SELECT 
                a.carrera,
                COUNT(*) as total_asignaciones,
                COUNT(DISTINCT da.docente_id) as docentes_distintos
            FROM docentes_asignaturas da
            JOIN asignaturas a ON da.asignatura_id = a.id
            WHERE da.activo = 1
        `;

        if (ciclo_id) {
            sqlPorCarrera += ` AND da.ciclo_id = ?`;
        }

        sqlPorCarrera += `
            GROUP BY a.carrera
            ORDER BY total_asignaciones DESC
        `;

        const estadisticasPorCarrera = await ejecutarConsulta(sqlPorCarrera, ciclo_id ? [ciclo_id] : []);

        res.json({
            success: true,
            estadisticas: {
                generales: estadisticasGenerales[0],
                top_docentes: topDocentes,
                por_carrera: estadisticasPorCarrera
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * 🔍 Buscar docentes disponibles para asignar
 */
async function buscarDocentesDisponibles(req, res) {
    try {
        const { asignatura_id, ciclo_id, busqueda = '' } = req.query;

        if (!asignatura_id || !ciclo_id) {
            return res.status(400).json({
                success: false,
                message: 'Asignatura y ciclo son obligatorios'
            });
        }

        let sql = `
            SELECT 
                u.id, u.nombres, u.apellidos, u.correo,
                CONCAT(u.nombres, ' ', u.apellidos) as nombre_completo,
                COUNT(DISTINCT da.asignatura_id) as asignaturas_actuales
            FROM usuarios u
            JOIN usuarios_roles ur ON u.id = ur.usuario_id
            LEFT JOIN docentes_asignaturas da ON u.id = da.docente_id AND da.ciclo_id = ? AND da.activo = 1
            WHERE ur.rol = 'docente' AND ur.activo = 1 AND u.activo = 1
            AND NOT EXISTS (
                SELECT 1 FROM docentes_asignaturas da2 
                WHERE da2.docente_id = u.id 
                AND da2.asignatura_id = ? 
                AND da2.ciclo_id = ? 
                AND da2.activo = 1
            )
        `;

        const parametros = [ciclo_id, asignatura_id, ciclo_id];

        if (busqueda) {
            sql += ` AND (u.nombres LIKE ? OR u.apellidos LIKE ? OR u.correo LIKE ?)`;
            const termino = `%${busqueda}%`;
            parametros.push(termino, termino, termino);
        }

        sql += ` GROUP BY u.id ORDER BY u.nombres, u.apellidos`;

        const docentesDisponibles = await ejecutarConsulta(sql, parametros);

        res.json({
            success: true,
            docentes_disponibles: docentesDisponibles,
            total: docentesDisponibles.length
        });

    } catch (error) {
        console.error('❌ Error al buscar docentes disponibles:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

module.exports = {
    asignarDocente,
    revocarAsignacion,
    listarAsignaciones,
    obtenerAsignaturasDocente,
    obtenerDocentesAsignatura,
    asignacionMasiva,
    obtenerEstadisticasAsignaciones,
    buscarDocentesDisponibles
};