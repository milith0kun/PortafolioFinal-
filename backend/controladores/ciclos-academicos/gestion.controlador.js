/**
 * 📅 CONTROLADOR DE GESTIÓN DE CICLOS ACADÉMICOS
 * 
 * Maneja los períodos académicos (semestres/cuatrimestres):
 * - Crear nuevos ciclos académicos
 * - Listar ciclos activos e históricos
 * - Actualizar información de ciclos
 * - Activar/desactivar ciclos
 * - Configurar fechas importantes
 * 
 * Rutas que maneja:
 * GET /api/v1/ciclos - Listar ciclos
 * POST /api/v1/ciclos - Crear ciclo
 * PUT /api/v1/ciclos/:id - Actualizar ciclo
 * DELETE /api/v1/ciclos/:id - Eliminar ciclo
 */

// TODO: Solo un ciclo puede estar activo a la vez
// TODO: Validar que fechas de inicio/fin sean coherentes
// TODO: Migrar datos al cambiar de ciclo académico
// TODO: Generar reportes por ciclo académico
/**
 * 🔄 CONTROLADOR GESTIÓN CICLOS ACADÉMICOS - Sistema Portafolio Docente UNSAAC
 * CRUD completo de ciclos académicos
 */
/**
 * 📅 CONTROLADOR DE GESTIÓN DE CICLOS ACADÉMICOS
 * 
 * Maneja operaciones CRUD para ciclos académicos:
 * - Crear, leer, actualizar, eliminar ciclos
 * - Validación de fechas y estados
 * - Transiciones de estado automáticas
 * - Historial de cambios
 * 
 * Rutas que maneja:
 * GET /api/v1/ciclos - Listar todos los ciclos
 * GET /api/v1/ciclos/:id - Obtener ciclo específico
 * POST /api/v1/ciclos - Crear nuevo ciclo
 * PUT /api/v1/ciclos/:id - Actualizar ciclo
 * DELETE /api/v1/ciclos/:id - Eliminar ciclo
 * PATCH /api/v1/ciclos/:id/estado - Cambiar estado
 * GET /api/v1/ciclos/activo - Obtener ciclo activo
 * 
 * @author Sistema Portafolio Docente UNSAAC
 * @version 1.0.0
 */

const poolConexion = require('../../base_datos/conexiones/pool.conexion');
const moment = require('moment');
const Joi = require('joi');

// ==========================================
// 📋 ESQUEMAS DE VALIDACIÓN
// ==========================================

const esquemaCrearCiclo = Joi.object({
    nombre: Joi.string().required().min(6).max(20).pattern(/^[0-9]{4}-(I|II|III)$/),
    descripcion: Joi.string().allow('').max(500),
    estado: Joi.string().valid('preparacion', 'activo', 'cerrado', 'archivado').default('preparacion'),
    fecha_inicio: Joi.date().required(),
    fecha_fin: Joi.date().required().greater(Joi.ref('fecha_inicio')),
    semestre_actual: Joi.string().valid('I', 'II', 'III').required(),
    anio_actual: Joi.number().integer().min(2020).max(2030).required()
});

const esquemaActualizarCiclo = Joi.object({
    nombre: Joi.string().min(6).max(20).pattern(/^[0-9]{4}-(I|II|III)$/),
    descripcion: Joi.string().allow('').max(500),
    fecha_inicio: Joi.date(),
    fecha_fin: Joi.date(),
    semestre_actual: Joi.string().valid('I', 'II', 'III'),
    anio_actual: Joi.number().integer().min(2020).max(2030)
}).min(1);

const esquemaCambiarEstado = Joi.object({
    estado: Joi.string().valid('preparacion', 'activo', 'cerrado', 'archivado').required(),
    observaciones: Joi.string().allow('').max(1000)
});

// ==========================================
// 🔍 FUNCIONES DE CONSULTA
// ==========================================

/**
 * 📋 Listar todos los ciclos académicos
 * GET /api/v1/ciclos
 */
async function listarCiclos(req, res) {
    try {
        const { 
            estado, 
            anio, 
            activo_solo = false,
            pagina = 1, 
            limite = 50,
            ordenar_por = 'fecha_inicio',
            orden = 'DESC'
        } = req.query;

        // Construir filtros dinámicos
        let condicionesWhere = ['1=1'];
        let parametros = [];

        if (estado) {
            condicionesWhere.push('ca.estado = ?');
            parametros.push(estado);
        }

        if (anio) {
            condicionesWhere.push('ca.anio_actual = ?');
            parametros.push(parseInt(anio));
        }

        if (activo_solo === 'true') {
            condicionesWhere.push('ca.estado = ?');
            parametros.push('activo');
        }

        // Calcular offset para paginación
        const offset = (parseInt(pagina) - 1) * parseInt(limite);

        // Consulta principal con información adicional
        const sqlPrincipal = `
            SELECT 
                ca.*,
                CONCAT(u.nombres, ' ', u.apellidos) as creado_por_nombre,
                u.correo as creado_por_correo,
                (SELECT COUNT(*) FROM portafolios p WHERE p.ciclo_id = ca.id) as total_portafolios,
                (SELECT COUNT(*) FROM docentes_asignaturas da WHERE da.ciclo_id = ca.id) as total_asignaciones,
                (SELECT COUNT(*) FROM semestres s WHERE s.ciclo_id = ca.id) as total_semestres,
                CASE 
                    WHEN ca.estado = 'activo' AND CURDATE() > ca.fecha_fin THEN 'vencido'
                    WHEN ca.estado = 'preparacion' AND CURDATE() >= ca.fecha_inicio THEN 'debe_activar'
                    ELSE ca.estado
                END as estado_calculado,
                DATEDIFF(ca.fecha_fin, CURDATE()) as dias_restantes
            FROM ciclos_academicos ca
            INNER JOIN usuarios u ON ca.creado_por = u.id
            WHERE ${condicionesWhere.join(' AND ')}
            ORDER BY ca.${ordenar_por} ${orden}
            LIMIT ? OFFSET ?
        `;

        parametros.push(parseInt(limite), offset);

        // Consulta para contar total
        const sqlTotal = `
            SELECT COUNT(*) as total
            FROM ciclos_academicos ca
            WHERE ${condicionesWhere.join(' AND ')}
        `;

        // Ejecutar consultas
        const { resultado: ciclos } = await poolConexion.ejecutarLectura(sqlPrincipal, parametros);
        const { resultado: totalRegistros } = await poolConexion.ejecutarLectura(sqlTotal, parametros.slice(0, -2));

        // Formatear fechas y calcular estadísticas
        const ciclosFormateados = ciclos.map(ciclo => ({
            ...ciclo,
            fecha_inicio: moment(ciclo.fecha_inicio).format('YYYY-MM-DD'),
            fecha_fin: moment(ciclo.fecha_fin).format('YYYY-MM-DD'),
            fecha_creacion: moment(ciclo.fecha_creacion).format('DD/MM/YYYY HH:mm:ss'),
            fecha_actualizacion: ciclo.fecha_actualizacion ? 
                moment(ciclo.fecha_actualizacion).format('DD/MM/YYYY HH:mm:ss') : null,
            duracion_dias: moment(ciclo.fecha_fin).diff(moment(ciclo.fecha_inicio), 'days'),
            porcentaje_transcurrido: calcularPorcentajeTranscurrido(ciclo.fecha_inicio, ciclo.fecha_fin),
            estadisticas: {
                portafolios: parseInt(ciclo.total_portafolios),
                asignaciones: parseInt(ciclo.total_asignaciones),
                semestres: parseInt(ciclo.total_semestres)
            }
        }));

        // Metadatos de paginación
        const totalPaginas = Math.ceil(totalRegistros[0].total / parseInt(limite));

        res.json({
            exito: true,
            mensaje: 'Ciclos académicos obtenidos exitosamente',
            datos: ciclosFormateados,
            metadatos: {
                pagina_actual: parseInt(pagina),
                total_paginas: totalPaginas,
                total_registros: totalRegistros[0].total,
                registros_por_pagina: parseInt(limite),
                tiene_pagina_anterior: parseInt(pagina) > 1,
                tiene_pagina_siguiente: parseInt(pagina) < totalPaginas
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error al listar ciclos académicos:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * 🔍 Obtener ciclo específico por ID
 * GET /api/v1/ciclos/:id
 */
async function obtenerCicloPorId(req, res) {
    try {
        const { id } = req.params;
        const { incluir_estadisticas = true } = req.query;

        // Validar ID
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                exito: false,
                mensaje: 'ID de ciclo inválido',
                timestamp: new Date().toISOString()
            });
        }

        // Consulta principal
        let sql = `
            SELECT 
                ca.*,
                CONCAT(u.nombres, ' ', u.apellidos) as creado_por_nombre,
                u.correo as creado_por_correo
            FROM ciclos_academicos ca
            INNER JOIN usuarios u ON ca.creado_por = u.id
            WHERE ca.id = ?
        `;

        const { resultado: ciclos } = await poolConexion.ejecutarLectura(sql, [id]);

        if (ciclos.length === 0) {
            return res.status(404).json({
                exito: false,
                mensaje: 'Ciclo académico no encontrado',
                timestamp: new Date().toISOString()
            });
        }

        let ciclo = ciclos[0];

        // Incluir estadísticas detalladas si se solicita
        if (incluir_estadisticas === 'true') {
            const estadisticas = await obtenerEstadisticasCiclo(id);
            ciclo.estadisticas_detalladas = estadisticas;
        }

        // Formatear ciclo
        const cicloFormateado = {
            ...ciclo,
            fecha_inicio: moment(ciclo.fecha_inicio).format('YYYY-MM-DD'),
            fecha_fin: moment(ciclo.fecha_fin).format('YYYY-MM-DD'),
            fecha_creacion: moment(ciclo.fecha_creacion).format('DD/MM/YYYY HH:mm:ss'),
            fecha_actualizacion: ciclo.fecha_actualizacion ? 
                moment(ciclo.fecha_actualizacion).format('DD/MM/YYYY HH:mm:ss') : null,
            duracion_dias: moment(ciclo.fecha_fin).diff(moment(ciclo.fecha_inicio), 'days'),
            porcentaje_transcurrido: calcularPorcentajeTranscurrido(ciclo.fecha_inicio, ciclo.fecha_fin),
            estado_calculado: calcularEstadoReal(ciclo)
        };

        res.json({
            exito: true,
            mensaje: 'Ciclo académico obtenido exitosamente',
            datos: cicloFormateado,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error al obtener ciclo académico:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * ✨ Crear nuevo ciclo académico
 * POST /api/v1/ciclos
 */
async function crearCiclo(req, res) {
    try {
        // Validar datos de entrada
        const { error, value } = esquemaCrearCiclo.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Datos de entrada inválidos',
                errores: error.details.map(e => e.message),
                timestamp: new Date().toISOString()
            });
        }

        const datosNuevoCiclo = value;
        const usuario_id = req.usuario.id;

        // Verificar que no exista un ciclo con el mismo nombre
        const sqlVerificar = 'SELECT id FROM ciclos_academicos WHERE nombre = ?';
        const { resultado: cicloExistente } = await poolConexion.ejecutarLectura(sqlVerificar, [datosNuevoCiclo.nombre]);

        if (cicloExistente.length > 0) {
            return res.status(409).json({
                exito: false,
                mensaje: `Ya existe un ciclo académico con el nombre: ${datosNuevoCiclo.nombre}`,
                timestamp: new Date().toISOString()
            });
        }

        // Verificar conflictos de fechas con otros ciclos activos
        const conflictoFechas = await verificarConflictoFechas(datosNuevoCiclo.fecha_inicio, datosNuevoCiclo.fecha_fin);
        if (conflictoFechas.hayConflicto) {
            return res.status(409).json({
                exito: false,
                mensaje: 'Las fechas del ciclo se superponen con otro ciclo existente',
                conflicto: conflictoFechas.cicloConflictivo,
                timestamp: new Date().toISOString()
            });
        }

        // Insertar nuevo ciclo
        const sqlInsertar = `
            INSERT INTO ciclos_academicos (
                nombre, descripcion, estado, fecha_inicio, fecha_fin, 
                semestre_actual, anio_actual, creado_por
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const { resultado } = await poolConexion.ejecutarEscritura(sqlInsertar, [
            datosNuevoCiclo.nombre,
            datosNuevoCiclo.descripcion || null,
            datosNuevoCiclo.estado,
            moment(datosNuevoCiclo.fecha_inicio).format('YYYY-MM-DD'),
            moment(datosNuevoCiclo.fecha_fin).format('YYYY-MM-DD'),
            datosNuevoCiclo.semestre_actual,
            datosNuevoCiclo.anio_actual,
            usuario_id
        ]);

        const nuevoCicloId = resultado.insertId;

        // Crear semestres automáticamente
        await crearSemestresAutomaticos(nuevoCicloId, datosNuevoCiclo);

        // Registrar acción en auditoría
        await registrarAccionAuditoria(usuario_id, 'crear_ciclo', nuevoCicloId, {
            nombre: datosNuevoCiclo.nombre,
            accion: 'creacion_ciclo_academico'
        });

        // Obtener el ciclo creado completo
        const cicloCreado = await obtenerCicloCompleto(nuevoCicloId);

        res.status(201).json({
            exito: true,
            mensaje: 'Ciclo académico creado exitosamente',
            datos: cicloCreado,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error al crear ciclo académico:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * 📝 Actualizar ciclo académico
 * PUT /api/v1/ciclos/:id
 */
async function actualizarCiclo(req, res) {
    try {
        const { id } = req.params;
        const usuario_id = req.usuario.id;

        // Validar ID
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                exito: false,
                mensaje: 'ID de ciclo inválido',
                timestamp: new Date().toISOString()
            });
        }

        // Validar datos de entrada
        const { error, value } = esquemaActualizarCiclo.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Datos de entrada inválidos',
                errores: error.details.map(e => e.message),
                timestamp: new Date().toISOString()
            });
        }

        const datosActualizar = value;

        // Verificar que el ciclo existe
        const sqlExiste = 'SELECT * FROM ciclos_academicos WHERE id = ?';
        const { resultado: cicloExistente } = await poolConexion.ejecutarLectura(sqlExiste, [id]);

        if (cicloExistente.length === 0) {
            return res.status(404).json({
                exito: false,
                mensaje: 'Ciclo académico no encontrado',
                timestamp: new Date().toISOString()
            });
        }

        const cicloActual = cicloExistente[0];

        // Verificar si el ciclo puede ser modificado
        if (cicloActual.estado === 'cerrado' || cicloActual.estado === 'archivado') {
            return res.status(403).json({
                exito: false,
                mensaje: 'No se puede modificar un ciclo cerrado o archivado',
                estado_actual: cicloActual.estado,
                timestamp: new Date().toISOString()
            });
        }

        // Construir consulta de actualización dinámica
        const camposActualizar = [];
        const valores = [];

        Object.keys(datosActualizar).forEach(campo => {
            if (datosActualizar[campo] !== undefined) {
                camposActualizar.push(`${campo} = ?`);
                if (campo === 'fecha_inicio' || campo === 'fecha_fin') {
                    valores.push(moment(datosActualizar[campo]).format('YYYY-MM-DD'));
                } else {
                    valores.push(datosActualizar[campo]);
                }
            }
        });

        camposActualizar.push('fecha_actualizacion = CURRENT_TIMESTAMP');
        valores.push(id);

        const sqlActualizar = `
            UPDATE ciclos_academicos 
            SET ${camposActualizar.join(', ')}
            WHERE id = ?
        `;

        await poolConexion.ejecutarEscritura(sqlActualizar, valores);

        // Registrar acción en auditoría
        await registrarAccionAuditoria(usuario_id, 'actualizar_ciclo', id, {
            campos_modificados: Object.keys(datosActualizar),
            valores_anteriores: cicloActual,
            valores_nuevos: datosActualizar
        });

        // Obtener el ciclo actualizado
        const cicloActualizado = await obtenerCicloCompleto(id);

        res.json({
            exito: true,
            mensaje: 'Ciclo académico actualizado exitosamente',
            datos: cicloActualizado,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error al actualizar ciclo académico:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * 🎯 Obtener ciclo activo
 * GET /api/v1/ciclos/activo
 */
async function obtenerCicloActivo(req, res) {
    try {
        const { incluir_estadisticas = true } = req.query;

        const sql = `
            SELECT 
                ca.*,
                CONCAT(u.nombres, ' ', u.apellidos) as creado_por_nombre,
                u.correo as creado_por_correo
            FROM ciclos_academicos ca
            INNER JOIN usuarios u ON ca.creado_por = u.id
            WHERE ca.estado = 'activo'
        `;

        const { resultado: ciclos } = await poolConexion.ejecutarLectura(sql);

        if (ciclos.length === 0) {
            return res.status(404).json({
                exito: false,
                mensaje: 'No hay ciclo académico activo',
                timestamp: new Date().toISOString()
            });
        }

        let cicloActivo = ciclos[0];

        // Incluir estadísticas si se solicita
        if (incluir_estadisticas === 'true') {
            const estadisticas = await obtenerEstadisticasCiclo(cicloActivo.id);
            cicloActivo.estadisticas_detalladas = estadisticas;
        }

        // Formatear ciclo
        const cicloFormateado = {
            ...cicloActivo,
            fecha_inicio: moment(cicloActivo.fecha_inicio).format('YYYY-MM-DD'),
            fecha_fin: moment(cicloActivo.fecha_fin).format('YYYY-MM-DD'),
            fecha_creacion: moment(cicloActivo.fecha_creacion).format('DD/MM/YYYY HH:mm:ss'),
            fecha_actualizacion: cicloActivo.fecha_actualizacion ? 
                moment(cicloActivo.fecha_actualizacion).format('DD/MM/YYYY HH:mm:ss') : null,
            duracion_dias: moment(cicloActivo.fecha_fin).diff(moment(cicloActivo.fecha_inicio), 'days'),
            porcentaje_transcurrido: calcularPorcentajeTranscurrido(cicloActivo.fecha_inicio, cicloActivo.fecha_fin),
            dias_restantes: moment(cicloActivo.fecha_fin).diff(moment(), 'days')
        };

        res.json({
            exito: true,
            mensaje: 'Ciclo académico activo obtenido exitosamente',
            datos: cicloFormateado,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error al obtener ciclo activo:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * 🗑️ Eliminar ciclo académico
 * DELETE /api/v1/ciclos/:id
 */
async function eliminarCiclo(req, res) {
    try {
        const { id } = req.params;
        const { confirmar = false } = req.body;
        const usuario_id = req.usuario.id;

        // Verificar que el ciclo existe
        const sqlObtener = 'SELECT * FROM ciclos_academicos WHERE id = ?';
        const { resultado: ciclos } = await poolConexion.ejecutarLectura(sqlObtener, [id]);

        if (ciclos.length === 0) {
            return res.status(404).json({
                exito: false,
                mensaje: 'Ciclo académico no encontrado',
                timestamp: new Date().toISOString()
            });
        }

        const ciclo = ciclos[0];

        // Verificar si el ciclo puede ser eliminado
        if (ciclo.estado === 'activo') {
            return res.status(403).json({
                exito: false,
                mensaje: 'No se puede eliminar un ciclo académico activo',
                estado_actual: ciclo.estado,
                timestamp: new Date().toISOString()
            });
        }

        // Verificar dependencias
        const dependencias = await verificarDependenciasCiclo(id);
        
        if (dependencias.tieneDependencias && !confirmar) {
            return res.status(409).json({
                exito: false,
                mensaje: 'El ciclo tiene dependencias que deben ser eliminadas primero',
                dependencias: dependencias.detalles,
                solucion: 'Envíe "confirmar: true" para forzar eliminación con todas las dependencias',
                timestamp: new Date().toISOString()
            });
        }

        // Eliminar ciclo y dependencias en transacción
        await poolConexion.ejecutarTransaccionCompleja(async (conexion) => {
            if (dependencias.tieneDependencias && confirmar) {
                // Eliminar en orden correcto
                await conexion.execute('DELETE FROM archivos_subidos WHERE portafolio_id IN (SELECT id FROM portafolios WHERE ciclo_id = ?)', [id]);
                await conexion.execute('DELETE FROM observaciones WHERE portafolio_id IN (SELECT id FROM portafolios WHERE ciclo_id = ?)', [id]);
                await conexion.execute('DELETE FROM portafolios WHERE ciclo_id = ?', [id]);
                await conexion.execute('DELETE FROM docentes_asignaturas WHERE ciclo_id = ?', [id]);
                await conexion.execute('DELETE FROM verificadores_docentes WHERE ciclo_id = ?', [id]);
                await conexion.execute('DELETE FROM semestres WHERE ciclo_id = ?', [id]);
            }
            
            // Eliminar el ciclo
            await conexion.execute('DELETE FROM ciclos_academicos WHERE id = ?', [id]);
        });

        // Registrar acción en auditoría
        await registrarAccionAuditoria(usuario_id, 'eliminar_ciclo', id, {
            ciclo_eliminado: ciclo,
            dependencias_eliminadas: dependencias.detalles,
            confirmacion_forzada: confirmar
        });

        res.json({
            exito: true,
            mensaje: 'Ciclo académico eliminado exitosamente',
            datos: {
                id: parseInt(id),
                nombre: ciclo.nombre,
                dependencias_eliminadas: dependencias.tieneDependencias ? dependencias.detalles : null
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error al eliminar ciclo académico:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

// ==========================================
// 🔧 FUNCIONES AUXILIARES
// ==========================================

/**
 * 📊 Calcular porcentaje transcurrido del ciclo
 */
function calcularPorcentajeTranscurrido(fechaInicio, fechaFin) {
    const inicio = moment(fechaInicio);
    const fin = moment(fechaFin);
    const ahora = moment();
    
    if (ahora.isBefore(inicio)) return 0;
    if (ahora.isAfter(fin)) return 100;
    
    const totalDias = fin.diff(inicio, 'days');
    const diasTranscurridos = ahora.diff(inicio, 'days');
    
    return Math.round((diasTranscurridos / totalDias) * 100);
}

/**
 * 🔍 Verificar conflictos de fechas
 */
async function verificarConflictoFechas(fechaInicio, fechaFin, excluirId = null) {
    let sql = `
        SELECT id, nombre, fecha_inicio, fecha_fin
        FROM ciclos_academicos 
        WHERE estado IN ('activo', 'preparacion')
        AND (
            (? BETWEEN fecha_inicio AND fecha_fin) OR
            (? BETWEEN fecha_inicio AND fecha_fin) OR
            (fecha_inicio BETWEEN ? AND ?) OR
            (fecha_fin BETWEEN ? AND ?)
        )
    `;
    
    let parametros = [fechaInicio, fechaFin, fechaInicio, fechaFin, fechaInicio, fechaFin];
    
    if (excluirId) {
        sql += ' AND id != ?';
        parametros.push(excluirId);
    }
    
    const { resultado: conflictos } = await poolConexion.ejecutarLectura(sql, parametros);
    
    return {
        hayConflicto: conflictos.length > 0,
        cicloConflictivo: conflictos[0] || null
    };
}

/**
 * 📈 Obtener estadísticas detalladas del ciclo
 */
async function obtenerEstadisticasCiclo(cicloId) {
    const consultas = [
        `SELECT COUNT(*) as total FROM portafolios WHERE ciclo_id = ?`,
        `SELECT COUNT(*) as completados FROM portafolios WHERE ciclo_id = ? AND estado = 'completado'`,
        `SELECT COUNT(*) as total FROM docentes_asignaturas WHERE ciclo_id = ?`,
        `SELECT COUNT(DISTINCT docente_id) as docentes_unicos FROM docentes_asignaturas WHERE ciclo_id = ?`
    ];
    
    const resultados = await Promise.all(
        consultas.map(sql => poolConexion.ejecutarLectura(sql, [cicloId]))
    );
    
    return {
        portafolios: {
            total: resultados[0].resultado[0].total,
            completados: resultados[1].resultado[0].completados,
            pendientes: resultados[0].resultado[0].total - resultados[1].resultado[0].completados
        },
        asignaciones: {
            total: resultados[2].resultado[0].total,
            docentes_unicos: resultados[3].resultado[0].docentes_unicos
        }
    };
}

/**
 * 🔄 Crear semestres automáticamente
 */
async function crearSemestresAutomaticos(cicloId, datosCiclo) {
    const semestresBase = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    
    for (const semestre of semestresBase) {
        const sqlInsertar = `
            INSERT INTO semestres (nombre, ciclo_id, fecha_inicio, fecha_fin, activo)
            VALUES (?, ?, ?, ?, 1)
        `;
        
        await poolConexion.ejecutarEscritura(sqlInsertar, [
            semestre,
            cicloId,
            datosCiclo.fecha_inicio,
            datosCiclo.fecha_fin
        ]);
    }
}

/**
 * 📋 Obtener ciclo completo
 */
async function obtenerCicloCompleto(cicloId) {
    const sql = `
        SELECT 
            ca.*,
            CONCAT(u.nombres, ' ', u.apellidos) as creado_por_nombre,
            u.correo as creado_por_correo
        FROM ciclos_academicos ca
        INNER JOIN usuarios u ON ca.creado_por = u.id
        WHERE ca.id = ?
    `;
    
    const { resultado: ciclos } = await poolConexion.ejecutarLectura(sql, [cicloId]);
    
    if (ciclos.length === 0) return null;
    
    const ciclo = ciclos[0];
    
    return {
        ...ciclo,
        fecha_inicio: moment(ciclo.fecha_inicio).format('YYYY-MM-DD'),
        fecha_fin: moment(ciclo.fecha_fin).format('YYYY-MM-DD'),
        fecha_creacion: moment(ciclo.fecha_creacion).format('DD/MM/YYYY HH:mm:ss'),
        fecha_actualizacion: ciclo.fecha_actualizacion ? 
            moment(ciclo.fecha_actualizacion).format('DD/MM/YYYY HH:mm:ss') : null,
        duracion_dias: moment(ciclo.fecha_fin).diff(moment(ciclo.fecha_inicio), 'days'),
        porcentaje_transcurrido: calcularPorcentajeTranscurrido(ciclo.fecha_inicio, ciclo.fecha_fin)
    };
}

/**
 * 🔍 Verificar dependencias del ciclo
 */
async function verificarDependenciasCiclo(cicloId) {
    const consultas = [
        { tabla: 'portafolios', sql: 'SELECT COUNT(*) as total FROM portafolios WHERE ciclo_id = ?' },
        { tabla: 'docentes_asignaturas', sql: 'SELECT COUNT(*) as total FROM docentes_asignaturas WHERE ciclo_id = ?' },
        { tabla: 'verificadores_docentes', sql: 'SELECT COUNT(*) as total FROM verificadores_docentes WHERE ciclo_id = ?' },
        { tabla: 'semestres', sql: 'SELECT COUNT(*) as total FROM semestres WHERE ciclo_id = ?' }
    ];
    
    const dependencias = {};
    let tieneDependencias = false;
    
    for (const consulta of consultas) {
        const { resultado } = await poolConexion.ejecutarLectura(consulta.sql, [cicloId]);
        const total = resultado[0].total;
        dependencias[consulta.tabla] = total;
        if (total > 0) tieneDependencias = true;
    }
    
    return {
        tieneDependencias,
        detalles: dependencias
    };
}

/**
 * 📈 Calcular estado real del ciclo
 */
function calcularEstadoReal(ciclo) {
    const hoy = moment();
    const inicio = moment(ciclo.fecha_inicio);
    const fin = moment(ciclo.fecha_fin);
    
    if (ciclo.estado === 'activo' && hoy.isAfter(fin)) {
        return 'vencido';
    }
    
    if (ciclo.estado === 'preparacion' && hoy.isSameOrAfter(inicio)) {
        return 'debe_activar';
    }
    
    return ciclo.estado;
}

/**
 * 📝 Registrar acción de auditoría
 */
async function registrarAccionAuditoria(usuarioId, accion, entidadId, detalles) {
    try {
        const sql = `
            INSERT INTO acciones_admin (
                usuario_id, accion, entidad_tipo, entidad_id, 
                detalles, fecha_accion
            ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;
        
        await poolConexion.ejecutarEscritura(sql, [
            usuarioId,
            accion,
            'ciclo_academico',
            entidadId,
            JSON.stringify(detalles)
        ]);
    } catch (error) {
        console.error('Error al registrar auditoría:', error);
        // No lanzar error para no afectar la operación principal
    }
}

// ==========================================
// 📤 EXPORTAR CONTROLADORES
// ==========================================

module.exports = {
    listarCiclos,
    obtenerCicloPorId,
    crearCiclo,
    actualizarCiclo,
    obtenerCicloActivo,
    eliminarCiclo
};