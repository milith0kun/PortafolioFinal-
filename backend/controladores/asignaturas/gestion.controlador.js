/**
 * 📚 CONTROLADOR DE GESTIÓN DE ASIGNATURAS
 * 
 * Maneja las materias/cursos del sistema:
 * - CRUD completo de asignaturas
 * - Organización por programas académicos
 * - Configuración de créditos y horas
 * - Estados de asignaturas (activa/inactiva)
 * - Prerrequisitos y correquisitos
 * 
 * Rutas que maneja:
 * GET /api/v1/asignaturas - Listar asignaturas
 * POST /api/v1/asignaturas - Crear asignatura
 * PUT /api/v1/asignaturas/:id - Actualizar asignatura
 * DELETE /api/v1/asignaturas/:id - Eliminar asignatura
 */

// TODO: Validar códigos únicos de asignatura
// TODO: Gestionar prerrequisitos y dependencias
// TODO: Filtros por programa, nivel, estado
// TODO: Importación masiva desde Excel
/**
 * 📚 CONTROLADOR GESTIÓN ASIGNATURAS - Sistema Portafolio Docente UNSAAC
 * CRUD completo de asignaturas del sistema
 */

const { ejecutarConsulta } = require('../../base_datos/conexiones/mysql.conexion');

/**
 * 📋 Listar asignaturas con filtros y paginación
 */
async function listar(req, res) {
    try {
        const { 
            ciclo_id = '', 
            carrera = '', 
            semestre = '', 
            tipo = '', 
            busqueda = '',
            pagina = 1,
            limite = 20 
        } = req.query;

        const offset = (pagina - 1) * limite;

        let sql = `
            SELECT 
                a.id, a.nombre, a.codigo, a.carrera, a.semestre, a.anio,
                a.creditos, a.tipo, a.activo, a.creado_en,
                ca.nombre as ciclo_nombre, ca.estado as ciclo_estado,
                COUNT(DISTINCT da.docente_id) as total_docentes,
                COUNT(DISTINCT p.id) as total_portafolios
            FROM asignaturas a
            LEFT JOIN ciclos_academicos ca ON a.ciclo_id = ca.id
            LEFT JOIN docentes_asignaturas da ON a.id = da.asignatura_id AND da.activo = 1
            LEFT JOIN portafolios p ON a.id = p.asignatura_id
            WHERE a.activo = 1
        `;
        
        const parametros = [];

        // Filtros
        if (ciclo_id) {
            sql += ` AND a.ciclo_id = ?`;
            parametros.push(ciclo_id);
        }

        if (carrera) {
            sql += ` AND a.carrera LIKE ?`;
            parametros.push(`%${carrera}%`);
        }

        if (semestre) {
            sql += ` AND a.semestre = ?`;
            parametros.push(semestre);
        }

        if (tipo) {
            sql += ` AND a.tipo = ?`;
            parametros.push(tipo);
        }

        if (busqueda) {
            sql += ` AND (a.nombre LIKE ? OR a.codigo LIKE ?)`;
            const termino = `%${busqueda}%`;
            parametros.push(termino, termino);
        }

        sql += ` GROUP BY a.id ORDER BY a.carrera, a.semestre, a.nombre LIMIT ? OFFSET ?`;
        parametros.push(parseInt(limite), parseInt(offset));

        const asignaturas = await ejecutarConsulta(sql, parametros);

        // Contar total para paginación
        let sqlCount = `
            SELECT COUNT(*) as total
            FROM asignaturas a
            WHERE a.activo = 1
        `;
        
        const parametrosCount = [];

        if (ciclo_id) {
            sqlCount += ` AND a.ciclo_id = ?`;
            parametrosCount.push(ciclo_id);
        }

        if (carrera) {
            sqlCount += ` AND a.carrera LIKE ?`;
            parametrosCount.push(`%${carrera}%`);
        }

        if (semestre) {
            sqlCount += ` AND a.semestre = ?`;
            parametrosCount.push(semestre);
        }

        if (tipo) {
            sqlCount += ` AND a.tipo = ?`;
            parametrosCount.push(tipo);
        }

        if (busqueda) {
            sqlCount += ` AND (a.nombre LIKE ? OR a.codigo LIKE ?)`;
            const termino = `%${busqueda}%`;
            parametrosCount.push(termino, termino);
        }

        const [{ total }] = await ejecutarConsulta(sqlCount, parametrosCount);

        res.json({
            success: true,
            asignaturas,
            paginacion: {
                pagina_actual: parseInt(pagina),
                limite: parseInt(limite),
                total,
                total_paginas: Math.ceil(total / limite)
            }
        });

    } catch (error) {
        console.error('❌ Error al listar asignaturas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * 👁️ Obtener asignatura por ID
 */
async function obtenerPorId(req, res) {
    try {
        const { id } = req.params;

        const asignaturas = await ejecutarConsulta(
            `SELECT 
                a.*,
                ca.nombre as ciclo_nombre,
                ca.estado as ciclo_estado
             FROM asignaturas a
             LEFT JOIN ciclos_academicos ca ON a.ciclo_id = ca.id
             WHERE a.id = ? AND a.activo = 1`,
            [id]
        );

        if (asignaturas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Asignatura no encontrada'
            });
        }

        const asignatura = asignaturas[0];

        // Obtener docentes asignados
        const docentes = await ejecutarConsulta(
            `SELECT 
                u.id, u.nombres, u.apellidos, u.correo,
                da.fecha_asignacion,
                CONCAT(u.nombres, ' ', u.apellidos) as nombre_completo
             FROM docentes_asignaturas da
             JOIN usuarios u ON da.docente_id = u.id
             WHERE da.asignatura_id = ? AND da.activo = 1`,
            [id]
        );

        // Obtener portafolios asociados
        const portafolios = await ejecutarConsulta(
            `SELECT 
                p.id, p.nombre, p.estado, p.progreso_completado,
                CONCAT(u.nombres, ' ', u.apellidos) as docente_nombre
             FROM portafolios p
             JOIN usuarios u ON p.docente_id = u.id
             WHERE p.asignatura_id = ?`,
            [id]
        );

        asignatura.docentes = docentes;
        asignatura.portafolios = portafolios;

        res.json({
            success: true,
            asignatura
        });

    } catch (error) {
        console.error('❌ Error al obtener asignatura:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * ➕ Crear nueva asignatura
 */
async function crear(req, res) {
    try {
        const {
            nombre,
            codigo,
            carrera,
            semestre,
            anio,
            creditos,
            tipo,
            ciclo_id,
            prerequisitos = null
        } = req.body;

        // Validar datos básicos
        if (!nombre || !codigo || !carrera || !semestre || !anio || !creditos || !tipo || !ciclo_id) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos obligatorios deben ser completados'
            });
        }

        // Validar tipo de asignatura
        const tiposValidos = ['teoria', 'practica', 'laboratorio'];
        if (!tiposValidos.includes(tipo)) {
            return res.status(400).json({
                success: false,
                message: 'Tipo de asignatura inválido'
            });
        }

        // Verificar que el código no exista en el mismo ciclo
        const asignaturaExistente = await ejecutarConsulta(
            'SELECT id FROM asignaturas WHERE codigo = ? AND ciclo_id = ?',
            [codigo, ciclo_id]
        );

        if (asignaturaExistente.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una asignatura con este código en el ciclo'
            });
        }

        // Verificar que el ciclo existe y está activo o en preparación
        const cicloExistente = await ejecutarConsulta(
            'SELECT id, estado FROM ciclos_academicos WHERE id = ?',
            [ciclo_id]
        );

        if (cicloExistente.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El ciclo académico no existe'
            });
        }

        if (!['preparacion', 'activo'].includes(cicloExistente[0].estado)) {
            return res.status(400).json({
                success: false,
                message: 'No se pueden crear asignaturas en un ciclo cerrado o archivado'
            });
        }

        const resultado = await ejecutarConsulta(
            `INSERT INTO asignaturas (
                nombre, codigo, carrera, semestre, anio, creditos, 
                tipo, ciclo_id, prerequisitos
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nombre, codigo, carrera, semestre, anio, creditos,
                tipo, ciclo_id,
                prerequisitos ? JSON.stringify(prerequisitos) : null
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Asignatura creada exitosamente',
            asignatura_id: resultado.insertId
        });

    } catch (error) {
        console.error('❌ Error al crear asignatura:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * ✏️ Actualizar asignatura
 */
async function actualizar(req, res) {
    try {
        const { id } = req.params;
        const {
            nombre,
            codigo,
            carrera,
            semestre,
            anio,
            creditos,
            tipo,
            prerequisitos
        } = req.body;

        // Verificar que la asignatura existe
        const asignaturaExistente = await ejecutarConsulta(
            'SELECT id, codigo, ciclo_id FROM asignaturas WHERE id = ? AND activo = 1',
            [id]
        );

        if (asignaturaExistente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Asignatura no encontrada'
            });
        }

        // Validar tipo si se proporciona
        if (tipo) {
            const tiposValidos = ['teoria', 'practica', 'laboratorio'];
            if (!tiposValidos.includes(tipo)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de asignatura inválido'
                });
            }
        }

        // Si se está cambiando el código, verificar que no exista otro igual
        if (codigo && codigo !== asignaturaExistente[0].codigo) {
            const codigoExistente = await ejecutarConsulta(
                'SELECT id FROM asignaturas WHERE codigo = ? AND ciclo_id = ? AND id != ?',
                [codigo, asignaturaExistente[0].ciclo_id, id]
            );

            if (codigoExistente.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe otra asignatura con este código en el ciclo'
                });
            }
        }

        await ejecutarConsulta(
            `UPDATE asignaturas 
             SET nombre = ?, codigo = ?, carrera = ?, semestre = ?, 
                 anio = ?, creditos = ?, tipo = ?, prerequisitos = ?
             WHERE id = ?`,
            [
                nombre, codigo, carrera, semestre, anio, creditos, tipo,
                prerequisitos ? JSON.stringify(prerequisitos) : null,
                id
            ]
        );

        res.json({
            success: true,
            message: 'Asignatura actualizada exitosamente'
        });

    } catch (error) {
        console.error('❌ Error al actualizar asignatura:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * 🗑️ Eliminar asignatura (soft delete)
 */
async function eliminar(req, res) {
    try {
        const { id } = req.params;

        // Verificar que la asignatura existe
        const asignaturaExistente = await ejecutarConsulta(
            'SELECT id, nombre FROM asignaturas WHERE id = ? AND activo = 1',
            [id]
        );

        if (asignaturaExistente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Asignatura no encontrada'
            });
        }

        // Verificar que no tenga docentes asignados activos
        const docentesAsignados = await ejecutarConsulta(
            'SELECT id FROM docentes_asignaturas WHERE asignatura_id = ? AND activo = 1',
            [id]
        );

        if (docentesAsignados.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar la asignatura porque tiene docentes asignados'
            });
        }

        // Verificar que no tenga portafolios asociados
        const portafolios = await ejecutarConsulta(
            'SELECT id FROM portafolios WHERE asignatura_id = ?',
            [id]
        );

        if (portafolios.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar la asignatura porque tiene portafolios asociados'
            });
        }

        // Soft delete
        await ejecutarConsulta(
            'UPDATE asignaturas SET activo = 0 WHERE id = ?',
            [id]
        );

        const asignatura = asignaturaExistente[0];

        res.json({
            success: true,
            message: `Asignatura '${asignatura.nombre}' eliminada exitosamente`
        });

    } catch (error) {
        console.error('❌ Error al eliminar asignatura:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

/**
 * 📊 Obtener estadísticas de asignaturas
 */
async function obtenerEstadisticas(req, res) {
    try {
        const estadisticasGenerales = await ejecutarConsulta(`
            SELECT 
                COUNT(*) as total_asignaturas,
                COUNT(DISTINCT carrera) as total_carreras,
                AVG(creditos) as promedio_creditos
            FROM asignaturas 
            WHERE activo = 1
        `);

        const estadisticasPorTipo = await ejecutarConsulta(`
            SELECT 
                tipo,
                COUNT(*) as total,
                AVG(creditos) as promedio_creditos
            FROM asignaturas 
            WHERE activo = 1
            GROUP BY tipo
        `);

        const estadisticasPorCarrera = await ejecutarConsulta(`
            SELECT 
                carrera,
                COUNT(*) as total_asignaturas,
                COUNT(DISTINCT da.docente_id) as docentes_asignados
            FROM asignaturas a
            LEFT JOIN docentes_asignaturas da ON a.id = da.asignatura_id AND da.activo = 1
            WHERE a.activo = 1
            GROUP BY carrera
            ORDER BY total_asignaturas DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            estadisticas: {
                generales: estadisticasGenerales[0],
                por_tipo: estadisticasPorTipo,
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
 * 📚 Obtener asignaturas por carrera
 */
async function obtenerPorCarrera(req, res) {
    try {
        const { carrera } = req.params;
        const { ciclo_id = null } = req.query;

        let sql = `
            SELECT 
                a.id, a.nombre, a.codigo, a.semestre, a.anio, 
                a.creditos, a.tipo,
                ca.nombre as ciclo_nombre,
                COUNT(DISTINCT da.docente_id) as total_docentes
            FROM asignaturas a
            JOIN ciclos_academicos ca ON a.ciclo_id = ca.id
            LEFT JOIN docentes_asignaturas da ON a.id = da.asignatura_id AND da.activo = 1
            WHERE a.carrera = ? AND a.activo = 1
        `;

        const parametros = [carrera];

        if (ciclo_id) {
            sql += ` AND a.ciclo_id = ?`;
            parametros.push(ciclo_id);
        }

        sql += ` GROUP BY a.id ORDER BY a.semestre, a.anio, a.nombre`;

        const asignaturas = await ejecutarConsulta(sql, parametros);

        res.json({
            success: true,
            carrera,
            total_asignaturas: asignaturas.length,
            asignaturas
        });

    } catch (error) {
        console.error('❌ Error al obtener asignaturas por carrera:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

module.exports = {
    listar,
    obtenerPorId,
    crear,
    actualizar,
    eliminar,
    obtenerEstadisticas,
    obtenerPorCarrera
};