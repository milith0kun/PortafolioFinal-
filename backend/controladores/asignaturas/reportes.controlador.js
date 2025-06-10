/**
 * 📊 CONTROLADOR DE REPORTES DE ASIGNATURAS
 * 
 * Genera reportes relacionados con las asignaturas:
 * - Reporte de asignaciones por ciclo
 * - Estadísticas de carga docente
 * - Asignaturas sin docente asignado
 * - Rendimiento por asignatura
 * - Exportación de datos
 * 
 * Rutas que maneja:
 * GET /api/v1/asignaturas/reportes/carga-docente - Carga por docente
 * GET /api/v1/asignaturas/reportes/sin-asignar - Sin docente
 * GET /api/v1/asignaturas/reportes/estadisticas - Estadísticas generales
 */

// TODO: Reportes en PDF y Excel
// TODO: Gráficos de distribución de carga
// TODO: Filtros por programa, ciclo, estado
// TODO: Alertas de asignaturas críticas
/**
 * 📊 CONTROLADOR DE REPORTES DE ASIGNATURAS
 * 
 * Genera reportes relacionados con las asignaturas:
 * - Reporte de asignaciones por ciclo
 * - Estadísticas de carga docente
 * - Asignaturas sin docente asignado
 * - Rendimiento por asignatura
 * - Exportación de datos
 * 
 * Rutas que maneja:
 * GET /api/v1/asignaturas/reportes/carga-docente - Carga por docente
 * GET /api/v1/asignaturas/reportes/sin-asignar - Sin docente
 * GET /api/v1/asignaturas/reportes/estadisticas - Estadísticas generales
 * GET /api/v1/asignaturas/reportes/distribucion - Distribución por carrera
 * GET /api/v1/asignaturas/reportes/rendimiento - Rendimiento por asignatura
 * POST /api/v1/asignaturas/reportes/exportar - Exportar datos
 * 
 * @author Sistema Portafolio Docente UNSAAC
 * @version 1.0.0
 */

const poolConexion = require('../../base_datos/conexiones/pool.conexion');
const moment = require('moment');

/**
 * 📈 Obtener carga docente por ciclo académico
 * GET /api/v1/asignaturas/reportes/carga-docente
 */
async function obtenerCargaDocente(req, res) {
    try {
        const { ciclo_id, docente_id, formato = 'json' } = req.query;
        
        // Construir consulta dinámica
        let whereClause = '1=1';
        let params = [];
        
        if (ciclo_id) {
            whereClause += ' AND da.ciclo_id = ?';
            params.push(ciclo_id);
        }
        
        if (docente_id) {
            whereClause += ' AND da.docente_id = ?';
            params.push(docente_id);
        }
        
        const sql = `
            SELECT 
                u.id as docente_id,
                CONCAT(u.nombres, ' ', u.apellidos) as nombre_docente,
                u.correo,
                ca.nombre as ciclo,
                COUNT(da.id) as total_asignaturas,
                SUM(a.creditos) as total_creditos,
                GROUP_CONCAT(
                    CONCAT(a.codigo, ' - ', a.nombre) 
                    ORDER BY a.codigo 
                    SEPARATOR '; '
                ) as asignaturas_asignadas,
                AVG(a.creditos) as promedio_creditos,
                GROUP_CONCAT(DISTINCT a.carrera SEPARATOR '; ') as carreras,
                GROUP_CONCAT(DISTINCT a.tipo SEPARATOR '; ') as tipos_asignatura,
                da.fecha_asignacion,
                CONCAT(asignador.nombres, ' ', asignador.apellidos) as asignado_por
            FROM docentes_asignaturas da
            INNER JOIN usuarios u ON da.docente_id = u.id
            INNER JOIN asignaturas a ON da.asignatura_id = a.id
            INNER JOIN ciclos_academicos ca ON da.ciclo_id = ca.id
            LEFT JOIN usuarios asignador ON da.asignado_por = asignador.id
            WHERE da.activo = 1 AND ${whereClause}
            GROUP BY da.docente_id, da.ciclo_id, u.nombres, u.apellidos, u.correo, ca.nombre
            ORDER BY total_creditos DESC, nombre_docente
        `;
        
        const { resultado } = await poolConexion.ejecutarLectura(sql, params);
        
        // Calcular estadísticas adicionales
        const estadisticas = {
            total_docentes: resultado.length,
            total_asignaturas_asignadas: resultado.reduce((sum, doc) => sum + doc.total_asignaturas, 0),
            total_creditos_asignados: resultado.reduce((sum, doc) => sum + doc.total_creditos, 0),
            promedio_carga_por_docente: resultado.length > 0 
                ? (resultado.reduce((sum, doc) => sum + doc.total_creditos, 0) / resultado.length).toFixed(2)
                : 0,
            docente_mayor_carga: resultado.length > 0 ? resultado[0] : null,
            distribucion_por_creditos: {
                carga_baja: resultado.filter(d => d.total_creditos <= 12).length,
                carga_media: resultado.filter(d => d.total_creditos > 12 && d.total_creditos <= 18).length,
                carga_alta: resultado.filter(d => d.total_creditos > 18).length
            }
        };
        
        res.json({
            success: true,
            message: 'Reporte de carga docente obtenido exitosamente',
            data: {
                carga_docente: resultado,
                estadisticas,
                filtros_aplicados: {
                    ciclo_id: ciclo_id || 'todos',
                    docente_id: docente_id || 'todos'
                }
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error al obtener carga docente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * 🚫 Obtener asignaturas sin docente asignado
 * GET /api/v1/asignaturas/reportes/sin-asignar
 */
async function obtenerAsignaturasSinAsignar(req, res) {
    try {
        const { ciclo_id, carrera, tipo } = req.query;
        
        let whereClause = 'da.id IS NULL AND a.activo = 1';
        let params = [];
        
        if (ciclo_id) {
            whereClause += ' AND a.ciclo_id = ?';
            params.push(ciclo_id);
        }
        
        if (carrera) {
            whereClause += ' AND a.carrera = ?';
            params.push(carrera);
        }
        
        if (tipo) {
            whereClause += ' AND a.tipo = ?';
            params.push(tipo);
        }
        
        const sql = `
            SELECT 
                a.id,
                a.codigo,
                a.nombre,
                a.carrera,
                a.semestre,
                a.anio,
                a.creditos,
                a.tipo,
                a.prerequisitos,
                ca.nombre as ciclo,
                ca.estado as estado_ciclo,
                s.nombre as semestre_nombre,
                DATEDIFF(ca.fecha_fin, CURDATE()) as dias_restantes,
                CASE 
                    WHEN DATEDIFF(ca.fecha_fin, CURDATE()) <= 30 THEN 'critica'
                    WHEN DATEDIFF(ca.fecha_fin, CURDATE()) <= 60 THEN 'urgente'
                    ELSE 'normal'
                END as prioridad
            FROM asignaturas a
            INNER JOIN ciclos_academicos ca ON a.ciclo_id = ca.id
            LEFT JOIN semestres s ON s.ciclo_id = a.ciclo_id AND s.nombre = a.semestre
            LEFT JOIN docentes_asignaturas da ON a.id = da.asignatura_id AND da.activo = 1
            WHERE ${whereClause}
            ORDER BY 
                CASE 
                    WHEN DATEDIFF(ca.fecha_fin, CURDATE()) <= 30 THEN 1
                    WHEN DATEDIFF(ca.fecha_fin, CURDATE()) <= 60 THEN 2
                    ELSE 3
                END,
                a.carrera, a.semestre, a.codigo
        `;
        
        const { resultado } = await poolConexion.ejecutarLectura(sql, params);
        
        // Agrupar por carrera y calcular estadísticas
        const porCarrera = resultado.reduce((acc, asignatura) => {
            if (!acc[asignatura.carrera]) {
                acc[asignatura.carrera] = {
                    carrera: asignatura.carrera,
                    total_asignaturas: 0,
                    total_creditos: 0,
                    criticas: 0,
                    urgentes: 0,
                    asignaturas: []
                };
            }
            
            acc[asignatura.carrera].total_asignaturas++;
            acc[asignatura.carrera].total_creditos += asignatura.creditos;
            acc[asignatura.carrera].asignaturas.push(asignatura);
            
            if (asignatura.prioridad === 'critica') {
                acc[asignatura.carrera].criticas++;
            } else if (asignatura.prioridad === 'urgente') {
                acc[asignatura.carrera].urgentes++;
            }
            
            return acc;
        }, {});
        
        const estadisticas = {
            total_sin_asignar: resultado.length,
            total_creditos_sin_asignar: resultado.reduce((sum, a) => sum + a.creditos, 0),
            por_prioridad: {
                criticas: resultado.filter(a => a.prioridad === 'critica').length,
                urgentes: resultado.filter(a => a.prioridad === 'urgente').length,
                normales: resultado.filter(a => a.prioridad === 'normal').length
            },
            por_tipo: {
                teoria: resultado.filter(a => a.tipo === 'teoria').length,
                practica: resultado.filter(a => a.tipo === 'practica').length,
                laboratorio: resultado.filter(a => a.tipo === 'laboratorio').length
            },
            carreras_afectadas: Object.keys(porCarrera).length
        };
        
        res.json({
            success: true,
            message: 'Asignaturas sin asignar obtenidas exitosamente',
            data: {
                asignaturas_sin_asignar: resultado,
                por_carrera: Object.values(porCarrera),
                estadisticas,
                alertas: {
                    criticas: resultado.filter(a => a.prioridad === 'critica'),
                    urgentes: resultado.filter(a => a.prioridad === 'urgente')
                }
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error al obtener asignaturas sin asignar:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * 📊 Obtener estadísticas generales de asignaturas
 * GET /api/v1/asignaturas/reportes/estadisticas
 */
async function obtenerEstadisticasGenerales(req, res) {
    try {
        const { ciclo_id } = req.query;
        
        // Parámetros para filtrar por ciclo si se especifica
        let filtroClause = '';
        let params = [];
        
        if (ciclo_id) {
            filtroClause = 'WHERE a.ciclo_id = ?';
            params.push(ciclo_id);
        }
        
        // Consulta principal de estadísticas
        const sqlEstadisticas = `
            SELECT 
                COUNT(DISTINCT a.id) as total_asignaturas,
                COUNT(DISTINCT a.carrera) as total_carreras,
                COUNT(DISTINCT da.docente_id) as total_docentes_asignados,
                SUM(a.creditos) as total_creditos,
                AVG(a.creditos) as promedio_creditos,
                COUNT(DISTINCT CASE WHEN da.id IS NULL THEN a.id END) as asignaturas_sin_asignar,
                COUNT(DISTINCT CASE WHEN da.id IS NOT NULL THEN a.id END) as asignaturas_asignadas,
                COUNT(DISTINCT CASE WHEN a.tipo = 'teoria' THEN a.id END) as total_teoria,
                COUNT(DISTINCT CASE WHEN a.tipo = 'practica' THEN a.id END) as total_practica,
                COUNT(DISTINCT CASE WHEN a.tipo = 'laboratorio' THEN a.id END) as total_laboratorio
            FROM asignaturas a
            LEFT JOIN docentes_asignaturas da ON a.id = da.asignatura_id AND da.activo = 1
            ${filtroClause}
        `;
        
        // Distribución por carrera
        const sqlPorCarrera = `
            SELECT 
                a.carrera,
                COUNT(a.id) as total_asignaturas,
                SUM(a.creditos) as total_creditos,
                COUNT(da.id) as asignadas,
                COUNT(a.id) - COUNT(da.id) as sin_asignar,
                ROUND((COUNT(da.id) / COUNT(a.id)) * 100, 2) as porcentaje_asignacion
            FROM asignaturas a
            LEFT JOIN docentes_asignaturas da ON a.id = da.asignatura_id AND da.activo = 1
            ${filtroClause}
            GROUP BY a.carrera
            ORDER BY total_asignaturas DESC
        `;
        
        // Distribución por semestre
        const sqlPorSemestre = `
            SELECT 
                a.semestre,
                a.anio,
                COUNT(a.id) as total_asignaturas,
                SUM(a.creditos) as total_creditos,
                COUNT(da.id) as asignadas,
                COUNT(a.id) - COUNT(da.id) as sin_asignar,
                AVG(a.creditos) as promedio_creditos
            FROM asignaturas a
            LEFT JOIN docentes_asignaturas da ON a.id = da.asignatura_id AND da.activo = 1
            ${filtroClause}
            GROUP BY a.semestre, a.anio
            ORDER BY a.anio, a.semestre
        `;
        
        // Top docentes con más carga
        const sqlTopDocentes = `
            SELECT 
                CONCAT(u.nombres, ' ', u.apellidos) as nombre_docente,
                COUNT(da.id) as total_asignaturas,
                SUM(a.creditos) as total_creditos,
                GROUP_CONCAT(DISTINCT a.carrera SEPARATOR ', ') as carreras,
                GROUP_CONCAT(DISTINCT a.tipo SEPARATOR ', ') as tipos
            FROM docentes_asignaturas da
            INNER JOIN usuarios u ON da.docente_id = u.id
            INNER JOIN asignaturas a ON da.asignatura_id = a.id
            WHERE da.activo = 1 ${ciclo_id ? 'AND da.ciclo_id = ?' : ''}
            GROUP BY da.docente_id, u.nombres, u.apellidos
            ORDER BY total_creditos DESC
            LIMIT 10
        `;
        
        // Ejecutar todas las consultas
        const [
            { resultado: estadisticas },
            { resultado: porCarrera },
            { resultado: porSemestre },
            { resultado: topDocentes }
        ] = await Promise.all([
            poolConexion.ejecutarLectura(sqlEstadisticas, params),
            poolConexion.ejecutarLectura(sqlPorCarrera, params),
            poolConexion.ejecutarLectura(sqlPorSemestre, params),
            poolConexion.ejecutarLectura(sqlTopDocentes, ciclo_id ? [ciclo_id] : [])
        ]);
        
        const stats = estadisticas[0];
        
        // Calcular métricas adicionales
        const metricas = {
            porcentaje_asignacion: stats.total_asignaturas > 0 
                ? ((stats.asignaturas_asignadas / stats.total_asignaturas) * 100).toFixed(2)
                : 0,
            promedio_carga_docente: stats.total_docentes_asignados > 0
                ? (stats.total_creditos / stats.total_docentes_asignados).toFixed(2)
                : 0,
            distribucion_tipos: {
                teoria: stats.total_teoria,
                practica: stats.total_practica,
                laboratorio: stats.total_laboratorio
            }
        };
        
        res.json({
            success: true,
            message: 'Estadísticas generales obtenidas exitosamente',
            data: {
                resumen: {
                    ...stats,
                    ...metricas
                },
                distribucion: {
                    por_carrera: porCarrera,
                    por_semestre: porSemestre,
                    por_tipo: [
                        { tipo: 'Teoría', cantidad: stats.total_teoria },
                        { tipo: 'Práctica', cantidad: stats.total_practica },
                        { tipo: 'Laboratorio', cantidad: stats.total_laboratorio }
                    ]
                },
                top_docentes: topDocentes,
                alertas: {
                    asignaturas_sin_asignar: stats.asignaturas_sin_asignar,
                    carreras_criticas: porCarrera.filter(c => c.porcentaje_asignacion < 50),
                    necesita_atencion: stats.asignaturas_sin_asignar > (stats.total_asignaturas * 0.2)
                }
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error al obtener estadísticas generales:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * 📈 Obtener distribución de asignaturas por carrera y tipo
 * GET /api/v1/asignaturas/reportes/distribucion
 */
async function obtenerDistribucion(req, res) {
    try {
        const { ciclo_id } = req.query;
        
        let filtroClause = '';
        let params = [];
        
        if (ciclo_id) {
            filtroClause = 'WHERE a.ciclo_id = ?';
            params.push(ciclo_id);
        }
        
        // Distribución detallada por carrera y tipo
        const sqlDistribucion = `
            SELECT 
                a.carrera,
                a.tipo,
                a.semestre,
                COUNT(a.id) as cantidad,
                SUM(a.creditos) as total_creditos,
                COUNT(da.id) as asignadas,
                COUNT(a.id) - COUNT(da.id) as sin_asignar,
                ROUND(AVG(a.creditos), 2) as promedio_creditos,
                MIN(a.creditos) as min_creditos,
                MAX(a.creditos) as max_creditos
            FROM asignaturas a
            LEFT JOIN docentes_asignaturas da ON a.id = da.asignatura_id AND da.activo = 1
            ${filtroClause}
            GROUP BY a.carrera, a.tipo, a.semestre
            ORDER BY a.carrera, a.semestre, a.tipo
        `;
        
        const { resultado } = await poolConexion.ejecutarLectura(sqlDistribucion, params);
        
        // Procesar datos para diferentes visualizaciones
        const porCarrera = {};
        const porTipo = {};
        const matrizDistribucion = {};
        
        resultado.forEach(item => {
            // Por carrera
            if (!porCarrera[item.carrera]) {
                porCarrera[item.carrera] = {
                    carrera: item.carrera,
                    total_asignaturas: 0,
                    total_creditos: 0,
                    asignadas: 0,
                    sin_asignar: 0,
                    tipos: {}
                };
            }
            
            porCarrera[item.carrera].total_asignaturas += item.cantidad;
            porCarrera[item.carrera].total_creditos += item.total_creditos;
            porCarrera[item.carrera].asignadas += item.asignadas;
            porCarrera[item.carrera].sin_asignar += item.sin_asignar;
            
            if (!porCarrera[item.carrera].tipos[item.tipo]) {
                porCarrera[item.carrera].tipos[item.tipo] = 0;
            }
            porCarrera[item.carrera].tipos[item.tipo] += item.cantidad;
            
            // Por tipo
            if (!porTipo[item.tipo]) {
                porTipo[item.tipo] = {
                    tipo: item.tipo,
                    total_asignaturas: 0,
                    total_creditos: 0,
                    carreras: new Set()
                };
            }
            
            porTipo[item.tipo].total_asignaturas += item.cantidad;
            porTipo[item.tipo].total_creditos += item.total_creditos;
            porTipo[item.tipo].carreras.add(item.carrera);
            
            // Matriz carrera-tipo
            const key = `${item.carrera}-${item.tipo}`;
            matrizDistribucion[key] = {
                carrera: item.carrera,
                tipo: item.tipo,
                cantidad: item.cantidad,
                creditos: item.total_creditos,
                asignadas: item.asignadas,
                sin_asignar: item.sin_asignar,
                porcentaje_asignacion: item.cantidad > 0 ? ((item.asignadas / item.cantidad) * 100).toFixed(2) : 0
            };
        });
        
        // Convertir Sets a arrays
        Object.values(porTipo).forEach(tipo => {
            tipo.carreras = Array.from(tipo.carreras);
        });
        
        res.json({
            success: true,
            message: 'Distribución de asignaturas obtenida exitosamente',
            data: {
                distribucion_detallada: resultado,
                resumen_por_carrera: Object.values(porCarrera),
                resumen_por_tipo: Object.values(porTipo),
                matriz_carrera_tipo: Object.values(matrizDistribucion),
                totales: {
                    carreras: Object.keys(porCarrera).length,
                    tipos: Object.keys(porTipo).length,
                    total_asignaturas: resultado.reduce((sum, item) => sum + item.cantidad, 0),
                    total_creditos: resultado.reduce((sum, item) => sum + item.total_creditos, 0)
                }
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error al obtener distribución:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * 📋 Obtener rendimiento por asignatura (basado en documentos del portafolio)
 * GET /api/v1/asignaturas/reportes/rendimiento
 */
async function obtenerRendimientoPorAsignatura(req, res) {
    try {
        const { ciclo_id, carrera } = req.query;
        
        let whereClause = '1=1';
        let params = [];
        
        if (ciclo_id) {
            whereClause += ' AND a.ciclo_id = ?';
            params.push(ciclo_id);
        }
        
        if (carrera) {
            whereClause += ' AND a.carrera = ?';
            params.push(carrera);
        }
        
        const sql = `
            SELECT 
                a.id as asignatura_id,
                a.codigo,
                a.nombre as asignatura,
                a.carrera,
                a.creditos,
                a.tipo,
                CONCAT(u.nombres, ' ', u.apellidos) as docente,
                COUNT(DISTINCT p.id) as portafolios_creados,
                COUNT(DISTINCT ar.id) as documentos_subidos,
                COUNT(DISTINCT CASE WHEN ar.estado = 'aprobado' THEN ar.id END) as documentos_aprobados,
                COUNT(DISTINCT CASE WHEN ar.estado = 'rechazado' THEN ar.id END) as documentos_rechazados,
                COUNT(DISTINCT CASE WHEN ar.estado = 'pendiente' THEN ar.id END) as documentos_pendientes,
                AVG(p.progreso_completado) as promedio_progreso,
                COUNT(DISTINCT o.id) as total_observaciones,
                COUNT(DISTINCT CASE WHEN o.tipo = 'correccion' THEN o.id END) as observaciones_correccion,
                MAX(ar.fecha_subida) as ultima_actividad,
                CASE 
                    WHEN AVG(p.progreso_completado) >= 90 THEN 'excelente'
                    WHEN AVG(p.progreso_completado) >= 70 THEN 'bueno'
                    WHEN AVG(p.progreso_completado) >= 50 THEN 'regular'
                    ELSE 'bajo'
                END as nivel_rendimiento
            FROM asignaturas a
            LEFT JOIN docentes_asignaturas da ON a.id = da.asignatura_id AND da.activo = 1
            LEFT JOIN usuarios u ON da.docente_id = u.id
            LEFT JOIN portafolios p ON a.id = p.asignatura_id
            LEFT JOIN archivos_subidos ar ON p.id = ar.portafolio_id
            LEFT JOIN observaciones o ON ar.id = o.archivo_id
            WHERE ${whereClause}
            GROUP BY a.id, a.codigo, a.nombre, a.carrera, a.creditos, a.tipo, u.nombres, u.apellidos
            ORDER BY promedio_progreso DESC, a.carrera, a.codigo
        `;
        
        const { resultado } = await poolConexion.ejecutarLectura(sql, params);
        
        // Calcular métricas de rendimiento
        const metricas = {
            total_asignaturas: resultado.length,
            promedio_general_progreso: resultado.length > 0 
                ? (resultado.reduce((sum, a) => sum + (a.promedio_progreso || 0), 0) / resultado.length).toFixed(2)
                : 0,
            distribucion_rendimiento: {
                excelente: resultado.filter(a => a.nivel_rendimiento === 'excelente').length,
                bueno: resultado.filter(a => a.nivel_rendimiento === 'bueno').length,
                regular: resultado.filter(a => a.nivel_rendimiento === 'regular').length,
                bajo: resultado.filter(a => a.nivel_rendimiento === 'bajo').length
            },
            totales: {
                portafolios: resultado.reduce((sum, a) => sum + a.portafolios_creados, 0),
                documentos: resultado.reduce((sum, a) => sum + a.documentos_subidos, 0),
                observaciones: resultado.reduce((sum, a) => sum + a.total_observaciones, 0)
            }
        };
        
        // Asignaturas con alertas
        const alertas = {
            sin_actividad: resultado.filter(a => a.documentos_subidos === 0),
            bajo_rendimiento: resultado.filter(a => a.nivel_rendimiento === 'bajo'),
            muchas_observaciones: resultado.filter(a => a.total_observaciones > 10),
            sin_docente: resultado.filter(a => !a.docente)
        };
        
        res.json({
            success: true,
            message: 'Rendimiento por asignatura obtenido exitosamente',
            data: {
                rendimiento_asignaturas: resultado,
                metricas_generales: metricas,
                alertas: {
                    asignaturas_sin_actividad: alertas.sin_actividad.length,
                    bajo_rendimiento: alertas.bajo_rendimiento.length,
                    muchas_observaciones: alertas.muchas_observaciones.length,
                    sin_docente_asignado: alertas.sin_docente.length
                },
                detalles_alertas: alertas
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error al obtener rendimiento por asignatura:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * 📤 Exportar datos de reportes
 * POST /api/v1/asignaturas/reportes/exportar
 */
async function exportarReportes(req, res) {
    try {
        const { 
            tipo_reporte, 
            formato = 'excel', 
            ciclo_id, 
            carrera,
            incluir_graficos = false 
        } = req.body;
        
        if (!tipo_reporte) {
            return res.status(400).json({
                success: false,
                message: 'Tipo de reporte es requerido',
                tipos_disponibles: [
                    'carga_docente',
                    'sin_asignar', 
                    'estadisticas',
                    'distribucion',
                    'rendimiento'
                ]
            });
        }
        
        // Obtener datos según el tipo de reporte
        let datos = {};
        const filtros = { ciclo_id, carrera };
        
        switch (tipo_reporte) {
            case 'carga_docente':
                datos = await obtenerDatosCargaDocente(filtros);
                break;
            case 'sin_asignar':
                datos = await obtenerDatosAsignaturasSinAsignar(filtros);
                break;
            case 'estadisticas':
                datos = await obtenerDatosEstadisticas(filtros);
                break;
            case 'distribucion':
                datos = await obtenerDatosDistribucion(filtros);
                break;
            case 'rendimiento':
                datos = await obtenerDatosRendimiento(filtros);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de reporte no válido'
                });
        }
        
        // Generar archivo según formato
        let resultado;
        if (formato === 'excel') {
            resultado = await generarExcel(tipo_reporte, datos, incluir_graficos);
        } else if (formato === 'pdf') {
            resultado = await generarPDF(tipo_reporte, datos, incluir_graficos);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Formato no válido. Use: excel o pdf'
            });
        }
        
        res.json({
            success: true,
            message: `Reporte ${tipo_reporte} exportado exitosamente`,
            data: {
                archivo_generado: resultado.nombre_archivo,
                ruta_descarga: resultado.url_descarga,
                tamaño_archivo: resultado.tamaño,
                formato,
                tipo_reporte,
                filtros_aplicados: filtros,
                fecha_generacion: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error al exportar reportes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

// ==========================================
// 🔧 FUNCIONES AUXILIARES PARA EXPORTACIÓN
// ==========================================

/**
 * Obtener datos de carga docente para exportación
 */
async function obtenerDatosCargaDocente(filtros) {
    let whereClause = '1=1';
    let params = [];
    
    if (filtros.ciclo_id) {
        whereClause += ' AND da.ciclo_id = ?';
        params.push(filtros.ciclo_id);
    }
    
    const sql = `
        SELECT 
            u.id as docente_id,
            CONCAT(u.nombres, ' ', u.apellidos) as nombre_docente,
            u.correo,
            ca.nombre as ciclo,
            COUNT(da.id) as total_asignaturas,
            SUM(a.creditos) as total_creditos,
            GROUP_CONCAT(CONCAT(a.codigo, ' - ', a.nombre) SEPARATOR '; ') as asignaturas,
            GROUP_CONCAT(DISTINCT a.carrera SEPARATOR '; ') as carreras
        FROM docentes_asignaturas da
        INNER JOIN usuarios u ON da.docente_id = u.id
        INNER JOIN asignaturas a ON da.asignatura_id = a.id
        INNER JOIN ciclos_academicos ca ON da.ciclo_id = ca.id
        WHERE da.activo = 1 AND ${whereClause}
        GROUP BY da.docente_id, da.ciclo_id
        ORDER BY total_creditos DESC
    `;
    
    const { resultado } = await poolConexion.ejecutarLectura(sql, params);
    return resultado;
}

/**
 * Obtener datos de asignaturas sin asignar para exportación
 */
async function obtenerDatosAsignaturasSinAsignar(filtros) {
    let whereClause = 'da.id IS NULL AND a.activo = 1';
    let params = [];
    
    if (filtros.ciclo_id) {
        whereClause += ' AND a.ciclo_id = ?';
        params.push(filtros.ciclo_id);
    }
    
    if (filtros.carrera) {
        whereClause += ' AND a.carrera = ?';
        params.push(filtros.carrera);
    }
    
    const sql = `
        SELECT 
            a.codigo,
            a.nombre,
            a.carrera,
            a.semestre,
            a.creditos,
            a.tipo,
            ca.nombre as ciclo,
            DATEDIFF(ca.fecha_fin, CURDATE()) as dias_restantes
        FROM asignaturas a
        INNER JOIN ciclos_academicos ca ON a.ciclo_id = ca.id
        LEFT JOIN docentes_asignaturas da ON a.id = da.asignatura_id AND da.activo = 1
        WHERE ${whereClause}
        ORDER BY a.carrera, a.semestre, a.codigo
    `;
    
    const { resultado } = await poolConexion.ejecutarLectura(sql, params);
    return resultado;
}

/**
 * Obtener datos de estadísticas para exportación
 */
async function obtenerDatosEstadisticas(filtros) {
    // Implementar lógica similar a obtenerEstadisticasGenerales
    // pero devolviendo solo los datos sin formato de respuesta
    let filtroClause = '';
    let params = [];
    
    if (filtros.ciclo_id) {
        filtroClause = 'WHERE a.ciclo_id = ?';
        params.push(filtros.ciclo_id);
    }
    
    const sqlPorCarrera = `
        SELECT 
            a.carrera,
            COUNT(a.id) as total_asignaturas,
            SUM(a.creditos) as total_creditos,
            COUNT(da.id) as asignadas,
            COUNT(a.id) - COUNT(da.id) as sin_asignar
        FROM asignaturas a
        LEFT JOIN docentes_asignaturas da ON a.id = da.asignatura_id AND da.activo = 1
        ${filtroClause}
        GROUP BY a.carrera
        ORDER BY total_asignaturas DESC
    `;
    
    const { resultado } = await poolConexion.ejecutarLectura(sqlPorCarrera, params);
    return resultado;
}

/**
 * Obtener datos de distribución para exportación
 */
async function obtenerDatosDistribucion(filtros) {
    let filtroClause = '';
    let params = [];
    
    if (filtros.ciclo_id) {
        filtroClause = 'WHERE a.ciclo_id = ?';
        params.push(filtros.ciclo_id);
    }
    
    const sql = `
        SELECT 
            a.carrera,
            a.tipo,
            a.semestre,
            COUNT(a.id) as cantidad,
            SUM(a.creditos) as total_creditos,
            COUNT(da.id) as asignadas,
            COUNT(a.id) - COUNT(da.id) as sin_asignar
        FROM asignaturas a
        LEFT JOIN docentes_asignaturas da ON a.id = da.asignatura_id AND da.activo = 1
        ${filtroClause}
        GROUP BY a.carrera, a.tipo, a.semestre
        ORDER BY a.carrera, a.semestre, a.tipo
    `;
    
    const { resultado } = await poolConexion.ejecutarLectura(sql, params);
    return resultado;
}

/**
 * Obtener datos de rendimiento para exportación
 */
async function obtenerDatosRendimiento(filtros) {
    let whereClause = '1=1';
    let params = [];
    
    if (filtros.ciclo_id) {
        whereClause += ' AND a.ciclo_id = ?';
        params.push(filtros.ciclo_id);
    }
    
    if (filtros.carrera) {
        whereClause += ' AND a.carrera = ?';
        params.push(filtros.carrera);
    }
    
    const sql = `
        SELECT 
            a.codigo,
            a.nombre as asignatura,
            a.carrera,
            a.creditos,
            CONCAT(u.nombres, ' ', u.apellidos) as docente,
            COUNT(DISTINCT p.id) as portafolios_creados,
            COUNT(DISTINCT ar.id) as documentos_subidos,
            AVG(p.progreso_completado) as promedio_progreso
        FROM asignaturas a
        LEFT JOIN docentes_asignaturas da ON a.id = da.asignatura_id AND da.activo = 1
        LEFT JOIN usuarios u ON da.docente_id = u.id
        LEFT JOIN portafolios p ON a.id = p.asignatura_id
        LEFT JOIN archivos_subidos ar ON p.id = ar.portafolio_id
        WHERE ${whereClause}
        GROUP BY a.id, a.codigo, a.nombre, a.carrera, a.creditos, u.nombres, u.apellidos
        ORDER BY a.carrera, a.codigo
    `;
    
    const { resultado } = await poolConexion.ejecutarLectura(sql, params);
    return resultado;
}

/**
 * Generar archivo Excel
 */
async function generarExcel(tipoReporte, datos, incluirGraficos) {
    // TODO: Implementar generación de Excel usando xlsx
    const XLSX = require('xlsx');
    const path = require('path');
    const fs = require('fs');
    
    try {
        const workbook = XLSX.utils.book_new();
        
        // Crear hoja principal con datos
        const worksheet = XLSX.utils.json_to_sheet(datos);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
        
        // Generar nombre de archivo único
        const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
        const nombreArchivo = `reporte_${tipoReporte}_${timestamp}.xlsx`;
        const rutaArchivo = path.join(process.cwd(), 'subidas', 'reportes', nombreArchivo);
        
        // Asegurar que el directorio existe
        const directorioReportes = path.dirname(rutaArchivo);
        if (!fs.existsSync(directorioReportes)) {
            fs.mkdirSync(directorioReportes, { recursive: true });
        }
        
        // Escribir archivo
        XLSX.writeFile(workbook, rutaArchivo);
        
        // Obtener tamaño del archivo
        const stats = fs.statSync(rutaArchivo);
        
        return {
            nombre_archivo: nombreArchivo,
            url_descarga: `/uploads/reportes/${nombreArchivo}`,
            tamaño: `${(stats.size / 1024).toFixed(2)} KB`
        };
        
    } catch (error) {
        throw new Error(`Error al generar Excel: ${error.message}`);
    }
}

/**
 * Generar archivo PDF
 */
async function generarPDF(tipoReporte, datos, incluirGraficos) {
    // TODO: Implementar generación de PDF usando puppeteer
    const puppeteer = require('puppeteer');
    const path = require('path');
    const fs = require('fs');
    
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        // Generar HTML para el reporte
        const html = generarHTMLReporte(tipoReporte, datos);
        
        await page.setContent(html);
        
        // Generar nombre de archivo único
        const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
        const nombreArchivo = `reporte_${tipoReporte}_${timestamp}.pdf`;
        const rutaArchivo = path.join(process.cwd(), 'subidas', 'reportes', nombreArchivo);
        
        // Asegurar que el directorio existe
        const directorioReportes = path.dirname(rutaArchivo);
        if (!fs.existsSync(directorioReportes)) {
            fs.mkdirSync(directorioReportes, { recursive: true });
        }
        
        // Generar PDF
        await page.pdf({
            path: rutaArchivo,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '1cm',
                right: '1cm',
                bottom: '1cm',
                left: '1cm'
            }
        });
        
        await browser.close();
        
        // Obtener tamaño del archivo
        const stats = fs.statSync(rutaArchivo);
        
        return {
            nombre_archivo: nombreArchivo,
            url_descarga: `/uploads/reportes/${nombreArchivo}`,
            tamaño: `${(stats.size / 1024).toFixed(2)} KB`
        };
        
    } catch (error) {
        throw new Error(`Error al generar PDF: ${error.message}`);
    }
}

/**
 * Generar HTML para reporte PDF
 */
function generarHTMLReporte(tipoReporte, datos) {
    const fecha = moment().format('DD/MM/YYYY HH:mm');
    
    let contenido = '';
    
    switch (tipoReporte) {
        case 'carga_docente':
            contenido = `
                <table>
                    <thead>
                        <tr>
                            <th>Docente</th>
                            <th>Correo</th>
                            <th>Asignaturas</th>
                            <th>Créditos</th>
                            <th>Carreras</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${datos.map(item => `
                            <tr>
                                <td>${item.nombre_docente}</td>
                                <td>${item.correo}</td>
                                <td>${item.total_asignaturas}</td>
                                <td>${item.total_creditos}</td>
                                <td>${item.carreras}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            break;
        
        case 'sin_asignar':
            contenido = `
                <table>
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Asignatura</th>
                            <th>Carrera</th>
                            <th>Semestre</th>
                            <th>Créditos</th>
                            <th>Tipo</th>
                            <th>Días Restantes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${datos.map(item => `
                            <tr>
                                <td>${item.codigo}</td>
                                <td>${item.nombre}</td>
                                <td>${item.carrera}</td>
                                <td>${item.semestre}</td>
                                <td>${item.creditos}</td>
                                <td>${item.tipo}</td>
                                <td>${item.dias_restantes || 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            break;
        
        default:
            contenido = '<p>Tipo de reporte no implementado para PDF</p>';
    }
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Reporte ${tipoReporte}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #2c3e50; text-align: center; }
                .header { text-align: center; margin-bottom: 30px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Sistema Portafolio Docente UNSAAC</h1>
                <h2>Reporte: ${tipoReporte.replace('_', ' ').toUpperCase()}</h2>
                <p>Generado el: ${fecha}</p>
            </div>
            
            ${contenido}
            
            <div class="footer">
                <p>Universidad Nacional de San Antonio Abad del Cusco</p>
                <p>Sistema de Gestión de Portafolios Docentes</p>
            </div>
        </body>
        </html>
    `;
}

// ==========================================
// 📤 EXPORTAR CONTROLADORES
// ==========================================

module.exports = {
    obtenerCargaDocente,
    obtenerAsignaturasSinAsignar,
    obtenerEstadisticasGenerales,
    obtenerDistribucion,
    obtenerRendimientoPorAsignatura,
    exportarReportes
};