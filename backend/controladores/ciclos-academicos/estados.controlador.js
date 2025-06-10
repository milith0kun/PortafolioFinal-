/**
 * 🔄 CONTROLADOR DE ESTADOS DE CICLOS
 * 
 * Maneja los estados y transiciones de los ciclos académicos:
 * - Historial de cambios de estado
 * - Validaciones de transición
 * - Automatización de cambios
 * - Reportes de estado
 * 
 * Rutas que maneja:
 * GET /api/v1/ciclos/:id/estados/historial - Historial de estados
 * GET /api/v1/ciclos/estados/resumen - Resumen de estados
 * POST /api/v1/ciclos/:id/estados/automatizar - Automatizar transiciones
 * PATCH /api/v1/ciclos/:id/estado - Cambiar estado manualmente
 * GET /api/v1/ciclos/estados/dashboard - Dashboard de estados
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

const esquemaCambiarEstado = Joi.object({
    estado: Joi.string().valid('preparacion', 'activo', 'cerrado', 'archivado').required(),
    observaciones: Joi.string().allow('').max(1000),
    forzar_cambio: Joi.boolean().default(false)
});

const esquemaAutomatizar = Joi.object({
    tipo_automatizacion: Joi.string().valid('por_fecha', 'por_condicion', 'manual').default('por_fecha'),
    verificar_requisitos: Joi.boolean().default(true),
    notificar_usuarios: Joi.boolean().default(true)
});

// ==========================================
// 🔍 FUNCIONES DE CONSULTA DE ESTADOS
// ==========================================

/**
 * 📋 Obtener historial de estados del ciclo
 * GET /api/v1/ciclos/:id/estados/historial
 */
async function obtenerHistorialEstados(req, res) {
    try {
        const { id } = req.params;
        const { limite = 20, pagina = 1, incluir_detalles = true } = req.query;

        // Verificar que el ciclo existe
        const sqlVerificar = 'SELECT nombre FROM ciclos_academicos WHERE id = ?';
        const { resultado: ciclo } = await poolConexion.ejecutarLectura(sqlVerificar, [id]);

        if (ciclo.length === 0) {
            return res.status(404).json({
                exito: false,
                mensaje: 'Ciclo académico no encontrado',
                timestamp: new Date().toISOString()
            });
        }

        const offset = (parseInt(pagina) - 1) * parseInt(limite);

        // Obtener historial de estados
        const sqlHistorial = `
            SELECT 
                es.*,
                CONCAT(u.nombres, ' ', u.apellidos) as cambiado_por_nombre,
                u.correo as cambiado_por_correo,
                u.id as cambiado_por_id
            FROM estados_sistema es
            INNER JOIN usuarios u ON es.cambiado_por = u.id
            WHERE es.entidad_tipo = 'ciclo_academico' AND es.entidad_id = ?
            ORDER BY es.fecha_cambio DESC
            LIMIT ? OFFSET ?
        `;

        const { resultado: historial } = await poolConexion.ejecutarLectura(sqlHistorial, [id, parseInt(limite), offset]);

        // Contar total de registros
        const sqlTotal = `
            SELECT COUNT(*) as total
            FROM estados_sistema 
            WHERE entidad_tipo = 'ciclo_academico' AND entidad_id = ?
        `;
        const { resultado: total } = await poolConexion.ejecutarLectura(sqlTotal, [id]);

        // Formatear historial con información adicional
        const historialFormateado = await Promise.all(historial.map(async (registro, index) => {
            const siguienteRegistro = historial[index + 1] || null;
            const duracionEstado = siguienteRegistro ? 
                moment(registro.fecha_cambio).diff(moment(siguienteRegistro.fecha_cambio), 'days') : 
                moment().diff(moment(registro.fecha_cambio), 'days');

            let detallesAdicionales = {};

            if (incluir_detalles === 'true') {
                // Obtener estadísticas del estado en esa fecha
                detallesAdicionales = await obtenerEstadisticasEstadoEnFecha(id, registro.estado_nuevo, registro.fecha_cambio);
            }

            return {
                ...registro,
                fecha_cambio: moment(registro.fecha_cambio).format('DD/MM/YYYY HH:mm:ss'),
                duracion_estado_dias: duracionEstado,
                es_estado_actual: index === 0,
                transicion: {
                    desde: registro.estado_anterior,
                    hacia: registro.estado_nuevo,
                    descripcion: obtenerDescripcionTransicion(registro.estado_anterior, registro.estado_nuevo)
                },
                ...detallesAdicionales
            };
        }));

        const totalPaginas = Math.ceil(total[0].total / parseInt(limite));

        res.json({
            exito: true,
            mensaje: 'Historial de estados obtenido exitosamente',
            datos: {
                ciclo: ciclo[0],
                historial: historialFormateado,
                metadatos: {
                    pagina_actual: parseInt(pagina),
                    total_paginas: totalPaginas,
                    total_registros: total[0].total,
                    registros_por_pagina: parseInt(limite)
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error al obtener historial de estados:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * 📊 Resumen de estados de todos los ciclos
 * GET /api/v1/ciclos/estados/resumen
 */
async function obtenerResumenEstados(req, res) {
    try {
        const { anio, incluir_estadisticas = true } = req.query;

        let condicionWhere = '1=1';
        let parametros = [];

        if (anio) {
            condicionWhere = 'anio_actual = ?';
            parametros.push(parseInt(anio));
        }

        // Resumen por estado con información detallada
        const sqlResumen = `
            SELECT 
                ca.estado,
                COUNT(*) as cantidad,
                GROUP_CONCAT(ca.nombre ORDER BY ca.fecha_inicio DESC SEPARATOR '|') as ciclos_nombres,
                GROUP_CONCAT(ca.id ORDER BY ca.fecha_inicio DESC SEPARATOR ',') as ciclos_ids,
                AVG(DATEDIFF(ca.fecha_fin, ca.fecha_inicio)) as duracion_promedio,
                MIN(ca.fecha_inicio) as fecha_inicio_mas_antigua,
                MAX(ca.fecha_fin) as fecha_fin_mas_reciente
            FROM ciclos_academicos ca
            WHERE ${condicionWhere}
            GROUP BY ca.estado
            ORDER BY 
                CASE ca.estado
                    WHEN 'activo' THEN 1
                    WHEN 'preparacion' THEN 2
                    WHEN 'cerrado' THEN 3
                    WHEN 'archivado' THEN 4
                    ELSE 5
                END
        `;

        const { resultado: resumenEstados } = await poolConexion.ejecutarLectura(sqlResumen, parametros);

        // Ciclos con alertas o problemas
        const sqlProblemas = `
            SELECT 
                ca.id, ca.nombre, ca.estado, ca.fecha_inicio, ca.fecha_fin,
                CASE 
                    WHEN ca.estado = 'activo' AND CURDATE() > ca.fecha_fin THEN 'ciclo_vencido'
                    WHEN ca.estado = 'preparacion' AND CURDATE() >= ca.fecha_inicio THEN 'debe_activar'
                    WHEN ca.estado = 'activo' AND DATEDIFF(ca.fecha_fin, CURDATE()) <= 7 THEN 'proximo_vencimiento'
                    WHEN ca.estado = 'activo' AND DATEDIFF(ca.fecha_fin, CURDATE()) <= 30 THEN 'vence_pronto'
                    ELSE NULL
                END as tipo_problema,
                DATEDIFF(ca.fecha_fin, CURDATE()) as dias_restantes,
                (SELECT COUNT(*) FROM portafolios p WHERE p.ciclo_id = ca.id) as total_portafolios,
                (SELECT COUNT(*) FROM portafolios p WHERE p.ciclo_id = ca.id AND p.estado != 'completado') as portafolios_pendientes
            FROM ciclos_academicos ca
            WHERE ${condicionWhere}
            HAVING tipo_problema IS NOT NULL
            ORDER BY 
                CASE tipo_problema
                    WHEN 'ciclo_vencido' THEN 1
                    WHEN 'debe_activar' THEN 2
                    WHEN 'proximo_vencimiento' THEN 3
                    WHEN 'vence_pronto' THEN 4
                    ELSE 5
                END, ca.fecha_fin ASC
        `;

        const { resultado: ciclosProblemas } = await poolConexion.ejecutarLectura(sqlProblemas, parametros);

        // Estadísticas generales
        const sqlEstadisticas = `
            SELECT 
                COUNT(*) as total_ciclos,
                COUNT(CASE WHEN estado = 'activo' THEN 1 END) as ciclos_activos,
                COUNT(CASE WHEN estado = 'preparacion' THEN 1 END) as ciclos_preparacion,
                COUNT(CASE WHEN estado = 'cerrado' THEN 1 END) as ciclos_cerrados,
                COUNT(CASE WHEN estado = 'archivado' THEN 1 END) as ciclos_archivados,
                AVG(DATEDIFF(fecha_fin, fecha_inicio)) as duracion_promedio_dias,
                MIN(fecha_inicio) as ciclo_mas_antiguo,
                MAX(fecha_fin) as ciclo_mas_reciente,
                COUNT(CASE WHEN CURDATE() BETWEEN fecha_inicio AND fecha_fin THEN 1 END) as ciclos_en_curso
            FROM ciclos_academicos ca
            WHERE ${condicionWhere}
        `;

        const { resultado: estadisticas } = await poolConexion.ejecutarLectura(sqlEstadisticas, parametros);

        // Formatear datos
        const resumenFormateado = resumenEstados.map(estado => ({
            ...estado,
            ciclos: estado.ciclos_nombres ? estado.ciclos_nombres.split('|') : [],
            ids_ciclos: estado.ciclos_ids ? estado.ciclos_ids.split(',').map(id => parseInt(id)) : [],
            duracion_promedio_dias: Math.round(estado.duracion_promedio || 0),
            fecha_inicio_mas_antigua: estado.fecha_inicio_mas_antigua ? 
                moment(estado.fecha_inicio_mas_antigua).format('DD/MM/YYYY') : null,
            fecha_fin_mas_reciente: estado.fecha_fin_mas_reciente ? 
                moment(estado.fecha_fin_mas_reciente).format('DD/MM/YYYY') : null,
            descripcion_estado: obtenerDescripcionEstado(estado.estado)
        }));

        const problemasFormateados = ciclosProblemas.map(ciclo => ({
            ...ciclo,
            fecha_inicio: moment(ciclo.fecha_inicio).format('DD/MM/YYYY'),
            fecha_fin: moment(ciclo.fecha_fin).format('DD/MM/YYYY'),
            descripcion_problema: obtenerDescripcionProblema(ciclo.tipo_problema),
            nivel_urgencia: obtenerNivelUrgencia(ciclo.tipo_problema),
            accion_recomendada: obtenerAccionRecomendada(ciclo.tipo_problema)
        }));

        // Incluir estadísticas adicionales si se solicita
        let estadisticasAdicionales = {};
        if (incluir_estadisticas === 'true') {
            estadisticasAdicionales = await obtenerEstadisticasAvanzadas(parametros, condicionWhere);
        }

        res.json({
            exito: true,
            mensaje: 'Resumen de estados obtenido exitosamente',
            datos: {
                resumen_por_estado: resumenFormateado,
                ciclos_con_alertas: problemasFormateados,
                estadisticas_generales: {
                    ...estadisticas[0],
                    duracion_promedio_dias: Math.round(estadisticas[0].duracion_promedio_dias || 0),
                    ciclo_mas_antiguo: estadisticas[0].ciclo_mas_antiguo ? 
                        moment(estadisticas[0].ciclo_mas_antiguo).format('DD/MM/YYYY') : null,
                    ciclo_mas_reciente: estadisticas[0].ciclo_mas_reciente ? 
                        moment(estadisticas[0].ciclo_mas_reciente).format('DD/MM/YYYY') : null
                },
                ...estadisticasAdicionales
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error al obtener resumen de estados:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * 🔄 Cambiar estado de ciclo académico
 * PATCH /api/v1/ciclos/:id/estado
 */
async function cambiarEstadoCiclo(req, res) {
    try {
        const { id } = req.params;
        const usuario_id = req.usuario.id;

        // Validar datos de entrada
        const { error, value } = esquemaCambiarEstado.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Datos de entrada inválidos',
                errores: error.details.map(e => e.message),
                timestamp: new Date().toISOString()
            });
        }

        const { estado: nuevoEstado, observaciones, forzar_cambio } = value;

        // Obtener ciclo actual
        const sqlObtener = 'SELECT * FROM ciclos_academicos WHERE id = ?';
        const { resultado: ciclos } = await poolConexion.ejecutarLectura(sqlObtener, [id]);

        if (ciclos.length === 0) {
            return res.status(404).json({
                exito: false,
                mensaje: 'Ciclo académico no encontrado',
                timestamp: new Date().toISOString()
            });
        }

        const cicloActual = ciclos[0];
        const estadoActual = cicloActual.estado;

        // Verificar si el estado ya es el solicitado
        if (estadoActual === nuevoEstado) {
            return res.status(400).json({
                exito: false,
                mensaje: `El ciclo ya está en estado: ${nuevoEstado}`,
                estado_actual: estadoActual,
                timestamp: new Date().toISOString()
            });
        }

        // Validar transición de estado
        const transicionValida = validarTransicionEstado(estadoActual, nuevoEstado);
        if (!transicionValida.esValida && !forzar_cambio) {
            return res.status(400).json({
                exito: false,
                mensaje: transicionValida.mensaje,
                estado_actual: estadoActual,
                estado_solicitado: nuevoEstado,
                transiciones_validas: transicionValida.transicionesPermitidas,
                solucion: 'Use "forzar_cambio: true" para omitir validaciones',
                timestamp: new Date().toISOString()
            });
        }

        // Validaciones específicas por estado (si no se fuerza)
        if (!forzar_cambio) {
            const validacionEspecifica = await validarCambioEstadoEspecifico(id, cicloActual, nuevoEstado);
            if (!validacionEspecifica.esValido) {
                return res.status(400).json({
                    exito: false,
                    mensaje: validacionEspecifica.mensaje,
                    requisitos_faltantes: validacionEspecifica.requisitosFaltantes,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Ejecutar cambio de estado en transacción
        await poolConexion.ejecutarTransaccionCompleja(async (conexion) => {
            // Actualizar estado del ciclo
            await conexion.execute(
                'UPDATE ciclos_academicos SET estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?',
                [nuevoEstado, id]
            );

            // Registrar cambio en historial
            await conexion.execute(`
                INSERT INTO estados_sistema (
                    entidad_tipo, entidad_id, estado_anterior, estado_nuevo, 
                    observaciones, cambiado_por, fecha_cambio
                ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, ['ciclo_academico', id, estadoActual, nuevoEstado, observaciones, usuario_id]);

            // Registrar en auditoría
            await conexion.execute(`
                INSERT INTO acciones_admin (
                    usuario_id, accion, entidad_tipo, entidad_id, 
                    detalles, fecha_accion
                ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [
                usuario_id,
                'cambiar_estado_ciclo',
                'ciclo_academico',
                id,
                JSON.stringify({
                    estado_anterior: estadoActual,
                    estado_nuevo: nuevoEstado,
                    observaciones,
                    forzado: forzar_cambio
                })
            ]);
        });

        // Ejecutar acciones post-cambio de estado
        await ejecutarAccionesPostCambioEstado(id, nuevoEstado, estadoActual);

        // Obtener ciclo actualizado
        const cicloActualizado = await obtenerCicloCompleto(id);

        res.json({
            exito: true,
            mensaje: `Estado del ciclo cambiado exitosamente a: ${nuevoEstado}`,
            datos: cicloActualizado,
            transicion: {
                estado_anterior: estadoActual,
                estado_nuevo: nuevoEstado,
                observaciones,
                forzado: forzar_cambio,
                fecha_cambio: moment().format('DD/MM/YYYY HH:mm:ss')
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error al cambiar estado del ciclo:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * 🤖 Automatizar transiciones de estado
 * POST /api/v1/ciclos/:id/estados/automatizar
 */
async function automatizarTransiciones(req, res) {
    try {
        const { id } = req.params;
        const usuario_id = req.usuario.id;

        // Validar datos de entrada
        const { error, value } = esquemaAutomatizar.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Datos de entrada inválidos',
                errores: error.details.map(e => e.message),
                timestamp: new Date().toISOString()
            });
        }

        const { tipo_automatizacion, verificar_requisitos, notificar_usuarios } = value;

        // Obtener ciclo actual
        const sqlCiclo = 'SELECT * FROM ciclos_academicos WHERE id = ?';
        const { resultado: ciclos } = await poolConexion.ejecutarLectura(sqlCiclo, [id]);

        if (ciclos.length === 0) {
            return res.status(404).json({
                exito: false,
                mensaje: 'Ciclo académico no encontrado',
                timestamp: new Date().toISOString()
            });
        }

        const ciclo = ciclos[0];
        const estadoActual = ciclo.estado;

        // Determinar nuevo estado según automatización
        const analisisAutomatizacion = await analizarAutomatizacionNecesaria(ciclo, tipo_automatizacion);

        if (!analisisAutomatizacion.requiereAutomatizacion) {
            return res.json({
                exito: true,
                mensaje: 'No se requiere automatización en este momento',
                datos: {
                    ciclo_id: parseInt(id),
                    estado_actual: estadoActual,
                    razon: analisisAutomatizacion.razon,
                    proxima_revision: analisisAutomatizacion.proximaRevision
                },
                timestamp: new Date().toISOString()
            });
        }

        const nuevoEstado = analisisAutomatizacion.estadoSugerido;

        // Verificar requisitos si está habilitado
        if (verificar_requisitos) {
            const validacionRequisitos = await validarRequisitosAutomatizacion(id, estadoActual, nuevoEstado);
            if (!validacionRequisitos.cumpleRequisitos) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'No se cumplen los requisitos para automatización',
                    requisitos_faltantes: validacionRequisitos.requisitosFaltantes,
                    recomendacion: validacionRequisitos.recomendacion,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Ejecutar automatización
        const resultadoAutomatizacion = await ejecutarAutomatizacion(
            id, 
            estadoActual, 
            nuevoEstado, 
            usuario_id, 
            analisisAutomatizacion.motivo
        );

        // Notificar usuarios si está habilitado
        if (notificar_usuarios) {
            await notificarCambioEstadoAutomatico(id, estadoActual, nuevoEstado, analisisAutomatizacion.motivo);
        }

        res.json({
            exito: true,
            mensaje: 'Automatización ejecutada exitosamente',
            datos: {
                ciclo_id: parseInt(id),
                automatizacion: {
                    tipo: tipo_automatizacion,
                    estado_anterior: estadoActual,
                    estado_nuevo: nuevoEstado,
                    motivo: analisisAutomatizacion.motivo,
                    fecha_ejecucion: moment().format('DD/MM/YYYY HH:mm:ss'),
                    usuarios_notificados: notificar_usuarios
                },
                resultado: resultadoAutomatizacion
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error en automatización de transiciones:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * 📊 Dashboard de estados
 * GET /api/v1/ciclos/estados/dashboard
 */
async function obtenerDashboardEstados(req, res) {
    try {
        const { incluir_graficos = true, incluir_alertas = true } = req.query;

        // Métricas principales
        const sqlMetricas = `
            SELECT 
                COUNT(*) as total_ciclos,
                COUNT(CASE WHEN estado = 'activo' THEN 1 END) as activos,
                COUNT(CASE WHEN estado = 'preparacion' THEN 1 END) as en_preparacion,
                COUNT(CASE WHEN estado = 'cerrado' THEN 1 END) as cerrados,
                COUNT(CASE WHEN estado = 'archivado' THEN 1 END) as archivados,
                COUNT(CASE WHEN estado = 'activo' AND CURDATE() > fecha_fin THEN 1 END) as vencidos,
                COUNT(CASE WHEN estado = 'activo' AND DATEDIFF(fecha_fin, CURDATE()) <= 7 THEN 1 END) as vencen_pronto
            FROM ciclos_academicos
        `;

        const { resultado: metricas } = await poolConexion.ejecutarLectura(sqlMetricas);

        // Actividad reciente (últimos cambios de estado)
        const sqlActividadReciente = `
            SELECT 
                es.*,
                ca.nombre as ciclo_nombre,
                CONCAT(u.nombres, ' ', u.apellidos) as usuario_nombre
            FROM estados_sistema es
            INNER JOIN ciclos_academicos ca ON es.entidad_id = ca.id
            INNER JOIN usuarios u ON es.cambiado_por = u.id
            WHERE es.entidad_tipo = 'ciclo_academico'
            ORDER BY es.fecha_cambio DESC
            LIMIT 10
        `;

        const { resultado: actividadReciente } = await poolConexion.ejecutarLectura(sqlActividadReciente);

        let datosGraficos = {};
        let alertas = [];

        // Incluir datos para gráficos si se solicita
        if (incluir_graficos === 'true') {
            datosGraficos = await obtenerDatosGraficos();
        }

        // Incluir alertas si se solicita
        if (incluir_alertas === 'true') {
            alertas = await obtenerAlertasEstados();
        }

        // Formatear actividad reciente
        const actividadFormateada = actividadReciente.map(actividad => ({
            ...actividad,
            fecha_cambio: moment(actividad.fecha_cambio).format('DD/MM/YYYY HH:mm'),
            tiempo_transcurrido: moment(actividad.fecha_cambio).fromNow(),
            descripcion_cambio: `${actividad.ciclo_nombre}: ${actividad.estado_anterior} → ${actividad.estado_nuevo}`
        }));

        res.json({
            exito: true,
            mensaje: 'Dashboard de estados obtenido exitosamente',
            datos: {
                metricas_principales: metricas[0],
                actividad_reciente: actividadFormateada,
                alertas_activas: alertas,
                datos_graficos: datosGraficos,
                ultima_actualizacion: moment().format('DD/MM/YYYY HH:mm:ss')
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error al obtener dashboard de estados:', error);
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
 * ✅ Validar transición de estado
 */
function validarTransicionEstado(estadoActual, estadoNuevo) {
    const transicionesValidas = {
        'preparacion': ['activo', 'archivado'],
        'activo': ['cerrado'],
        'cerrado': ['archivado'],
        'archivado': []
    };
    
    if (!transicionesValidas[estadoActual]) {
        return { 
            esValida: false, 
            mensaje: 'Estado actual inválido',
            transicionesPermitidas: []
        };
    }
    
    if (!transicionesValidas[estadoActual].includes(estadoNuevo)) {
        return { 
            esValida: false, 
            mensaje: `No se puede cambiar de '${estadoActual}' a '${estadoNuevo}'`,
            transicionesPermitidas: transicionesValidas[estadoActual]
        };
    }
    
    return { esValida: true };
}

/**
 * 🔍 Validar cambio de estado específico
 */
async function validarCambioEstadoEspecifico(cicloId, cicloActual, nuevoEstado) {
    const requisitos = [];
    
    switch (nuevoEstado) {
        case 'activo':
            // Verificar que no hay otro ciclo activo
            const sqlOtroActivo = 'SELECT id, nombre FROM ciclos_academicos WHERE estado = ? AND id != ?';
            const { resultado: otroActivo } = await poolConexion.ejecutarLectura(sqlOtroActivo, ['activo', cicloId]);
            
            if (otroActivo.length > 0) {
                requisitos.push(`Ya existe un ciclo activo: ${otroActivo[0].nombre}`);
            }
            
            // Verificar estructura de portafolio
            const sqlEstructura = 'SELECT COUNT(*) as total FROM estructura_portafolio_base WHERE activo = 1';
            const { resultado: estructura } = await poolConexion.ejecutarLectura(sqlEstructura);
            
            if (estructura[0].total === 0) {
                requisitos.push('Debe existir estructura base de portafolio activa');
            }
            
            break;
            
        case 'cerrado':
            // Verificar que todos los portafolios estén completados o verificados
            const sqlPortafoliosPendientes = `
                SELECT COUNT(*) as pendientes 
                FROM portafolios 
                WHERE ciclo_id = ? AND estado NOT IN ('completado', 'verificado')
            `;
            const { resultado: pendientes } = await poolConexion.ejecutarLectura(sqlPortafoliosPendientes, [cicloId]);
            
            if (pendientes[0].pendientes > 0) {
                requisitos.push(`Hay ${pendientes[0].pendientes} portafolios sin completar`);
            }
            
            break;
    }
    
    return {
        esValido: requisitos.length === 0,
        requisitosFaltantes: requisitos,
        mensaje: requisitos.length > 0 ? 
            'No se cumplen los requisitos para el cambio de estado' : 
            'Todos los requisitos se cumplen'
    };
}

/**
 * 📊 Obtener estadísticas de estado en fecha específica
 */
async function obtenerEstadisticasEstadoEnFecha(cicloId, estado, fecha) {
    // Esta función podría expandirse para obtener estadísticas históricas
    return {
        estado_en_fecha: estado,
        fecha_analizada: moment(fecha).format('DD/MM/YYYY'),
        // Aquí se podrían agregar más estadísticas históricas
    };
}

/**
 * 📈 Obtener estadísticas avanzadas
 */
async function obtenerEstadisticasAvanzadas(parametros, condicionWhere) {
    // Tiempo promedio en cada estado
    const sqlTiempoEstados = `
        SELECT 
            estado_nuevo as estado,
            AVG(DATEDIFF(
                COALESCE(siguiente.fecha_cambio, CURRENT_TIMESTAMP),
                actual.fecha_cambio
            )) as tiempo_promedio_dias
        FROM estados_sistema actual
        LEFT JOIN estados_sistema siguiente ON (
            siguiente.entidad_id = actual.entidad_id 
            AND siguiente.entidad_tipo = actual.entidad_tipo
            AND siguiente.fecha_cambio > actual.fecha_cambio
            AND siguiente.id = (
                SELECT MIN(id) FROM estados_sistema s2 
                WHERE s2.entidad_id = actual.entidad_id 
                AND s2.entidad_tipo = actual.entidad_tipo
                AND s2.fecha_cambio > actual.fecha_cambio
            )
        )
        WHERE actual.entidad_tipo = 'ciclo_academico'
        GROUP BY estado_nuevo
    `;
    
    const { resultado: tiempoEstados } = await poolConexion.ejecutarLectura(sqlTiempoEstados);
    
    return {
        tiempo_promedio_por_estado: tiempoEstados.map(t => ({
            estado: t.estado,
            tiempo_promedio_dias: Math.round(t.tiempo_promedio_dias || 0)
        }))
    };
}

/**
 * 🔄 Analizar automatización necesaria
 */
async function analizarAutomatizacionNecesaria(ciclo, tipoAutomatizacion) {
    const hoy = moment();
    const fechaInicio = moment(ciclo.fecha_inicio);
    const fechaFin = moment(ciclo.fecha_fin);
    
    let requiereAutomatizacion = false;
    let estadoSugerido = ciclo.estado;
    let motivo = '';
    let razon = '';
    
    switch (tipoAutomatizacion) {
        case 'por_fecha':
            if (ciclo.estado === 'preparacion' && hoy.isSameOrAfter(fechaInicio)) {
                requiereAutomatizacion = true;
                estadoSugerido = 'activo';
                motivo = 'Fecha de inicio alcanzada';
            } else if (ciclo.estado === 'activo' && hoy.isAfter(fechaFin)) {
                requiereAutomatizacion = true;
                estadoSugerido = 'cerrado';
                motivo = 'Fecha de fin superada';
            } else {
                razon = 'Las fechas del ciclo no requieren cambio de estado automático';
            }
            break;
            
        case 'por_condicion':
            // Verificar condiciones específicas del negocio
            const analisisCondicion = await analizarCondicionesNegocio(ciclo.id, ciclo.estado);
            requiereAutomatizacion = analisisCondicion.requiereCambio;
            estadoSugerido = analisisCondicion.estadoSugerido;
            motivo = analisisCondicion.motivo;
            razon = analisisCondicion.razon;
            break;
            
        default:
            razon = 'Tipo de automatización no reconocido';
    }
    
    return {
        requiereAutomatizacion,
        estadoSugerido,
        motivo,
        razon,
        proximaRevision: requiereAutomatizacion ? null : moment().add(1, 'day').format('DD/MM/YYYY')
    };
}

/**
 * 🧠 Analizar condiciones de negocio
 */
async function analizarCondicionesNegocio(cicloId, estadoActual) {
    // Aquí se implementarían reglas de negocio específicas
    // Por ejemplo: verificar porcentaje de completitud de portafolios
    
    const sqlCompletitud = `
        SELECT 
            COUNT(*) as total_portafolios,
            COUNT(CASE WHEN estado = 'completado' THEN 1 END) as completados,
            (COUNT(CASE WHEN estado = 'completado' THEN 1 END) * 100.0 / COUNT(*)) as porcentaje_completitud
        FROM portafolios 
        WHERE ciclo_id = ?
    `;
    
    const { resultado: completitud } = await poolConexion.ejecutarLectura(sqlCompletitud, [cicloId]);
    
    if (completitud.length === 0) {
        return {
            requiereCambio: false,
            razon: 'No hay portafolios para analizar'
        };
    }
    
    const stats = completitud[0];
    
    // Regla: si más del 90% de portafolios están completados y el ciclo está activo
    if (estadoActual === 'activo' && stats.porcentaje_completitud >= 90) {
        return {
            requiereCambio: true,
            estadoSugerido: 'cerrado',
            motivo: `${stats.porcentaje_completitud.toFixed(1)}% de portafolios completados`,
            razon: 'Alto porcentaje de completitud alcanzado'
        };
    }
    
    return {
        requiereCambio: false,
        razon: `Solo ${stats.porcentaje_completitud.toFixed(1)}% de portafolios completados`
    };
}

/**
 * ✅ Validar requisitos de automatización
 */
async function validarRequisitosAutomatizacion(cicloId, estadoActual, estadoNuevo) {
    // Reutilizar validación específica
    return await validarCambioEstadoEspecifico(cicloId, { estado: estadoActual }, estadoNuevo);
}

/**
 * ⚙️ Ejecutar automatización
 */
async function ejecutarAutomatizacion(cicloId, estadoActual, estadoNuevo, usuarioId, motivo) {
    return await poolConexion.ejecutarTransaccionCompleja(async (conexion) => {
        // Actualizar estado
        await conexion.execute(
            'UPDATE ciclos_academicos SET estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?',
            [estadoNuevo, cicloId]
        );
        
        // Registrar en historial
        await conexion.execute(`
            INSERT INTO estados_sistema (
                entidad_tipo, entidad_id, estado_anterior, estado_nuevo, 
                observaciones, cambiado_por, fecha_cambio
            ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, ['ciclo_academico', cicloId, estadoActual, estadoNuevo, `Automatización: ${motivo}`, usuarioId]);
        
        return {
            estado_anterior: estadoActual,
            estado_nuevo: estadoNuevo,
            motivo,
            ejecutado_por: 'sistema_automatico',
            fecha_ejecucion: moment().format('DD/MM/YYYY HH:mm:ss')
        };
    });
}

/**
 * 📢 Notificar cambio de estado automático
 */
async function notificarCambioEstadoAutomatico(cicloId, estadoAnterior, estadoNuevo, motivo) {
    try {
        // Aquí se implementaría el sistema de notificaciones
        // Por ahora solo registramos que se debe notificar
        console.log(`Notificación pendiente: Ciclo ${cicloId} cambió de ${estadoAnterior} a ${estadoNuevo}. Motivo: ${motivo}`);
    } catch (error) {
        console.error('Error al enviar notificación:', error);
    }
}

/**
 * 📊 Obtener datos para gráficos
 */
async function obtenerDatosGraficos() {
    // Distribución por estado
    const sqlDistribucion = `
        SELECT estado, COUNT(*) as cantidad
        FROM ciclos_academicos
        GROUP BY estado
    `;
    
    // Evolución temporal (últimos 6 meses)
    const sqlEvolucion = `
        SELECT 
            DATE_FORMAT(fecha_cambio, '%Y-%m') as mes,
            estado_nuevo,
            COUNT(*) as cambios
        FROM estados_sistema
        WHERE entidad_tipo = 'ciclo_academico'
        AND fecha_cambio >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
        GROUP BY mes, estado_nuevo
        ORDER BY mes DESC
    `;
    
    const [distribucion, evolucion] = await Promise.all([
        poolConexion.ejecutarLectura(sqlDistribucion),
        poolConexion.ejecutarLectura(sqlEvolucion)
    ]);
    
    return {
        distribucion_estados: distribucion.resultado,
        evolucion_temporal: evolucion.resultado
    };
}

/**
 * 🚨 Obtener alertas de estados
 */
async function obtenerAlertasEstados() {
    const sqlAlertas = `
        SELECT 
            ca.id, ca.nombre, ca.estado, ca.fecha_inicio, ca.fecha_fin,
            CASE 
                WHEN ca.estado = 'activo' AND CURDATE() > ca.fecha_fin THEN 'critica'
                WHEN ca.estado = 'preparacion' AND CURDATE() >= ca.fecha_inicio THEN 'alta'
                WHEN ca.estado = 'activo' AND DATEDIFF(ca.fecha_fin, CURDATE()) <= 7 THEN 'media'
                WHEN ca.estado = 'activo' AND DATEDIFF(ca.fecha_fin, CURDATE()) <= 30 THEN 'baja'
                ELSE NULL
            END as prioridad_alerta,
            CASE 
                WHEN ca.estado = 'activo' AND CURDATE() > ca.fecha_fin THEN 'Ciclo vencido'
                WHEN ca.estado = 'preparacion' AND CURDATE() >= ca.fecha_inicio THEN 'Debe activarse'
                WHEN ca.estado = 'activo' AND DATEDIFF(ca.fecha_fin, CURDATE()) <= 7 THEN 'Vence en menos de 7 días'
                WHEN ca.estado = 'activo' AND DATEDIFF(ca.fecha_fin, CURDATE()) <= 30 THEN 'Vence en menos de 30 días'
            END as mensaje_alerta,
            DATEDIFF(ca.fecha_fin, CURDATE()) as dias_restantes
        FROM ciclos_academicos ca
        HAVING prioridad_alerta IS NOT NULL
        ORDER BY 
            CASE prioridad_alerta
                WHEN 'critica' THEN 1
                WHEN 'alta' THEN 2
                WHEN 'media' THEN 3
                WHEN 'baja' THEN 4
            END, dias_restantes ASC
    `;
    
    const { resultado: alertas } = await poolConexion.ejecutarLectura(sqlAlertas);
    
    return alertas.map(alerta => ({
        ...alerta,
        fecha_fin: moment(alerta.fecha_fin).format('DD/MM/YYYY'),
        icono_prioridad: obtenerIconoPrioridad(alerta.prioridad_alerta),
        color_prioridad: obtenerColorPrioridad(alerta.prioridad_alerta)
    }));
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
            moment(ciclo.fecha_actualizacion).format('DD/MM/YYYY HH:mm:ss') : null
    };
}

/**
 * 🔄 Ejecutar acciones post-cambio de estado
 */
async function ejecutarAccionesPostCambioEstado(cicloId, estadoNuevo, estadoAnterior) {
    try {
        switch (estadoNuevo) {
            case 'activo':
                // Crear portafolios automáticamente para docentes asignados
                await crearPortafoliosAutomaticos(cicloId);
                break;
                
            case 'cerrado':
                // Finalizar verificaciones pendientes
                await finalizarVerificacionesPendientes(cicloId);
                break;
                
            case 'archivado':
                // Archivar documentos
                await archivarDocumentosCiclo(cicloId);
                break;
        }
    } catch (error) {
        console.error('Error en acciones post-cambio de estado:', error);
    }
}

/**
 * 📂 Crear portafolios automáticamente
 */
async function crearPortafoliosAutomaticos(cicloId) {
    const sqlDocentes = `
        SELECT DISTINCT da.docente_id
        FROM docentes_asignaturas da
        WHERE da.ciclo_id = ? AND da.activo = 1
    `;
    
    const { resultado: docentes } = await poolConexion.ejecutarLectura(sqlDocentes, [cicloId]);
    
    for (const docente of docentes) {
        const sqlVerificar = 'SELECT id FROM portafolios WHERE docente_id = ? AND ciclo_id = ?';
        const { resultado: portafolioExistente } = await poolConexion.ejecutarLectura(sqlVerificar, [docente.docente_id, cicloId]);
        
        if (portafolioExistente.length === 0) {
            const sqlCrear = `
                INSERT INTO portafolios (docente_id, ciclo_id, estado, fecha_creacion)
                VALUES (?, ?, 'en_progreso', CURRENT_TIMESTAMP)
            `;
            await poolConexion.ejecutarEscritura(sqlCrear, [docente.docente_id, cicloId]);
        }
    }
}

/**
 * ✅ Finalizar verificaciones pendientes
 */
async function finalizarVerificacionesPendientes(cicloId) {
    const sql = `
        UPDATE archivos_subidos 
        SET estado = 'verificado_automatico', 
            fecha_verificacion = CURRENT_TIMESTAMP,
            observaciones_verificacion = 'Verificado automáticamente al cerrar ciclo'
        WHERE estado = 'pendiente_verificacion' 
        AND portafolio_id IN (SELECT id FROM portafolios WHERE ciclo_id = ?)
    `;
    
    await poolConexion.ejecutarEscritura(sql, [cicloId]);
}

/**
 * 📦 Archivar documentos del ciclo
 */
async function archivarDocumentosCiclo(cicloId) {
    const sql = `
        UPDATE archivos_subidos 
        SET archivado = 1, 
            fecha_archivado = CURRENT_TIMESTAMP
        WHERE portafolio_id IN (SELECT id FROM portafolios WHERE ciclo_id = ?)
    `;
    
    await poolConexion.ejecutarEscritura(sql, [cicloId]);
}

// ==========================================
// 🎨 FUNCIONES DE FORMATO Y DESCRIPCIÓN
// ==========================================

function obtenerDescripcionTransicion(estadoAnterior, estadoNuevo) {
    const transiciones = {
        'preparacion_activo': 'Ciclo activado y en funcionamiento',
        'activo_cerrado': 'Ciclo finalizado y cerrado',
        'cerrado_archivado': 'Ciclo archivado para consulta histórica',
        'preparacion_archivado': 'Ciclo cancelado antes de iniciar'
    };
    
    return transiciones[`${estadoAnterior}_${estadoNuevo}`] || 'Cambio de estado';
}

function obtenerDescripcionEstado(estado) {
    const descripciones = {
        'preparacion': 'En preparación para iniciar',
        'activo': 'Activo y en funcionamiento',
        'cerrado': 'Finalizado y cerrado',
        'archivado': 'Archivado para consulta histórica'
    };
    
    return descripciones[estado] || 'Estado desconocido';
}

function obtenerDescripcionProblema(tipoProblema) {
    const descripciones = {
        'ciclo_vencido': 'El ciclo ha superado su fecha de finalización',
        'debe_activar': 'El ciclo debería estar activo según su fecha de inicio',
        'proximo_vencimiento': 'El ciclo vence en menos de 7 días',
        'vence_pronto': 'El ciclo vence en menos de 30 días'
    };
    
    return descripciones[tipoProblema] || 'Problema no identificado';
}

function obtenerNivelUrgencia(tipoProblema) {
    const niveles = {
        'ciclo_vencido': 'critica',
        'debe_activar': 'alta',
        'proximo_vencimiento': 'media',
        'vence_pronto': 'baja'
    };
    
    return niveles[tipoProblema] || 'baja';
}

function obtenerAccionRecomendada(tipoProblema) {
    const acciones = {
        'ciclo_vencido': 'Cerrar el ciclo inmediatamente',
        'debe_activar': 'Activar el ciclo ahora',
        'proximo_vencimiento': 'Preparar cierre del ciclo',
        'vence_pronto': 'Monitorear progreso del ciclo'
    };
    
    return acciones[tipoProblema] || 'Revisar estado';
}

function obtenerIconoPrioridad(prioridad) {
    const iconos = {
        'critica': '🔴',
        'alta': '🟠',
        'media': '🟡',
        'baja': '🟢'
    };
    
    return iconos[prioridad] || '⚪';
}

function obtenerColorPrioridad(prioridad) {
    const colores = {
        'critica': '#dc3545',
        'alta': '#fd7e14',
        'media': '#ffc107',
        'baja': '#28a745'
    };
    
    return colores[prioridad] || '#6c757d';
}

// ==========================================
// 📤 EXPORTAR CONTROLADORES
// ==========================================

module.exports = {
    obtenerHistorialEstados,
    obtenerResumenEstados,
    cambiarEstadoCiclo,
    automatizarTransiciones,
    obtenerDashboardEstados
};