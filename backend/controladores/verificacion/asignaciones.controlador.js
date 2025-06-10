/**
 * 📋 CONTROLADOR DE ASIGNACIONES DE VERIFICACIÓN
 * 
 * Gestiona las asignaciones entre verificadores y docentes:
 * - Asignar verificadores a docentes
 * - Carga de trabajo de verificadores
 * - Rotación automática de asignaciones
 * - Especialización por área
 * - Estadísticas de asignaciones
 * 
 * Rutas que maneja:
 * POST /api/v1/verificacion/asignar - Asignar verificador
 * GET /api/v1/verificacion/mis-asignaciones - Mis docentes asignados
 * GET /api/v1/verificacion/carga-trabajo - Carga por verificador
 */

// TODO: Balanceador automático de carga de trabajo
// TODO: Especialización de verificadores por área
// TODO: Rotación periódica para evitar sesgos
// TODO: Métricas de rendimiento por verificador
// TODO: Alertas de sobrecarga de trabajo
// ============================================================
// 📋 CONTROLADOR DE ASIGNACIONES DE VERIFICACIÓN
// Sistema Portafolio Docente UNSAAC
// ============================================================

const asignacionesServicio = require('../../servicios/verificacion/asignaciones.servicio');
const { manejarError, respuestaExitosa } = require('../../utilidades/formato/datos.util');
const { validarAsignacionVerificador } = require('../../validadores/verificacion/asignaciones.validador');
const { registrarAccion } = require('../../utilidades/base-datos/auditoria.util');

class AsignacionesVerificacionControlador {

    // ===================================================
    // ➕ ASIGNAR VERIFICADOR A DOCENTE(S)
    // ===================================================
    async asignarVerificador(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Solo administradores pueden hacer asignaciones
            if (!usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para asignar verificadores',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            // Validar datos de entrada
            const { error, value: datosValidados } = validarAsignacionVerificador(req.body);
            if (error) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Datos de asignación inválidos',
                    errores: error.details.map(det => ({
                        campo: det.path.join('.'),
                        mensaje: det.message
                    })),
                    codigo: 'DATOS_INVALIDOS'
                });
            }

            const {
                verificador_id,
                docentes_ids,
                ciclo_id,
                tipo_asignacion = 'manual', // 'manual', 'automatica', 'balanceada'
                especialidad = null,
                observaciones = '',
                fecha_inicio = null,
                fecha_fin = null
            } = datosValidados;

            // Verificar que el verificador existe y está activo
            const verificadorValido = await asignacionesServicio.verificarVerificadorValido(verificador_id);
            if (!verificadorValido.es_valido) {
                return res.status(400).json({
                    exito: false,
                    mensaje: verificadorValido.razon,
                    codigo: 'VERIFICADOR_INVALIDO'
                });
            }

            // Verificar carga de trabajo actual del verificador
            const cargaActual = await asignacionesServicio.obtenerCargaVerificador(verificador_id, ciclo_id);
            if (cargaActual.excede_limite) {
                return res.status(400).json({
                    exito: false,
                    mensaje: `El verificador excedería su límite de carga de trabajo (${cargaActual.limite_maximo} docentes)`,
                    carga_actual: cargaActual.docentes_asignados,
                    docentes_a_asignar: docentes_ids.length,
                    codigo: 'CARGA_EXCEDIDA'
                });
            }

            // Verificar que los docentes existen y no tienen verificador asignado
            const docentesValidacion = await asignacionesServicio.validarDocentes(docentes_ids, ciclo_id);
            if (!docentesValidacion.todos_validos) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Algunos docentes no son válidos para asignación',
                    docentes_invalidos: docentesValidacion.docentes_invalidos,
                    codigo: 'DOCENTES_INVALIDOS'
                });
            }

            // Realizar asignación
            const resultado = await asignacionesServicio.asignarVerificadorDocentes({
                verificador_id,
                docentes_ids,
                ciclo_id,
                tipo_asignacion,
                especialidad,
                observaciones,
                fecha_inicio,
                fecha_fin,
                asignado_por: usuarioActual.id
            });

            // Registrar auditoría
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'asignar',
                modulo: 'verificacion',
                descripcion: `Asignó verificador ${verificadorValido.nombre} a ${docentes_ids.length} docente(s)`,
                datos_nuevos: {
                    verificador_id,
                    docentes_ids,
                    ciclo_id,
                    tipo_asignacion,
                    asignaciones_creadas: resultado.asignaciones_ids
                },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                asignaciones_creadas: resultado.asignaciones_creadas,
                verificador: resultado.verificador_info,
                docentes_asignados: resultado.docentes_asignados,
                nueva_carga_trabajo: resultado.nueva_carga,
                notificaciones_enviadas: resultado.notificaciones
            }, 'Asignaciones creadas correctamente', 201);

        } catch (error) {
            console.error('Error al asignar verificador:', error);
            return manejarError(res, error, 'Error al crear asignaciones');
        }
    }

    // ===================================================
    // 📋 OBTENER MIS ASIGNACIONES (VERIFICADOR)
    // ===================================================
    async obtenerMisAsignaciones(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar que el usuario es verificador
            if (!usuarioActual.roles_activos.includes('verificador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver asignaciones de verificador',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                ciclo_id = '',
                estado = 'activas', // 'activas', 'inactivas', 'todas'
                incluir_estadisticas = 'true',
                ordenar_por = 'fecha_asignacion' // 'fecha_asignacion', 'nombre_docente', 'progreso'
            } = req.query;

            // Construir filtros
            const filtros = {
                verificador_id: usuarioActual.id,
                ciclo_id: ciclo_id ? parseInt(ciclo_id) : null,
                estado,
                incluir_estadisticas: incluir_estadisticas === 'true',
                ordenar_por,
                usuario_verificador: usuarioActual
            };

            // Obtener asignaciones del verificador
            const asignaciones = await asignacionesServicio.obtenerAsignacionesVerificador(filtros);

            return respuestaExitosa(res, {
                mis_asignaciones: asignaciones.asignaciones,
                resumen_carga: asignaciones.resumen_carga,
                docentes_activos: asignaciones.docentes_activos,
                estadisticas_trabajo: asignaciones.estadisticas || null,
                documentos_pendientes: asignaciones.documentos_pendientes,
                alertas_asignaciones: asignaciones.alertas,
                ciclo_actual: asignaciones.ciclo_info
            }, 'Asignaciones obtenidas correctamente');

        } catch (error) {
            console.error('Error al obtener asignaciones:', error);
            return manejarError(res, error, 'Error al obtener tus asignaciones');
        }
    }

    // ===================================================
    // ⚖️ OBTENER CARGA DE TRABAJO POR VERIFICADOR
    // ===================================================
    async obtenerCargaTrabajo(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Solo administradores y verificadores pueden ver cargas de trabajo
            if (!usuarioActual.roles_activos.includes('administrador') && 
                !usuarioActual.roles_activos.includes('verificador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver carga de trabajo',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                ciclo_id = '',
                verificador_id = '',
                incluir_historico = 'false',
                mostrar_detalles = 'true'
            } = req.query;

            // Si no es administrador, solo puede ver su propia carga
            let verificadorIdFiltro = verificador_id;
            if (!usuarioActual.roles_activos.includes('administrador')) {
                verificadorIdFiltro = usuarioActual.id;
            }

            // Construir parámetros
            const parametros = {
                ciclo_id: ciclo_id ? parseInt(ciclo_id) : null,
                verificador_id: verificadorIdFiltro ? parseInt(verificadorIdFiltro) : null,
                incluir_historico: incluir_historico === 'true',
                mostrar_detalles: mostrar_detalles === 'true',
                usuario_consultor: usuarioActual
            };

            // Obtener carga de trabajo
            const cargaTrabajo = await asignacionesServicio.obtenerCargaTrabajoVerificadores(parametros);

            return respuestaExitosa(res, {
                carga_verificadores: cargaTrabajo.cargas,
                estadisticas_generales: cargaTrabajo.estadisticas_generales,
                distribucion_equilibrio: cargaTrabajo.distribucion,
                verificadores_sobrecargados: cargaTrabajo.sobrecargados,
                verificadores_subcargados: cargaTrabajo.subcargados,
                recomendaciones_balanceo: cargaTrabajo.recomendaciones,
                historico: cargaTrabajo.historico || null
            }, 'Carga de trabajo obtenida correctamente');

        } catch (error) {
            console.error('Error al obtener carga de trabajo:', error);
            return manejarError(res, error, 'Error al obtener carga de trabajo');
        }
    }

    // ===================================================
    // 🔄 REASIGNAR DOCENTE A OTRO VERIFICADOR
    // ===================================================
    async reasignarDocente(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Solo administradores pueden reasignar
            if (!usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para reasignar docentes',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const { asignacion_id } = req.params;
            const {
                nuevo_verificador_id,
                razon_reasignacion,
                transferir_observaciones = true,
                notificar_involucrados = true
            } = req.body;

            // Validar parámetros
            if (!asignacion_id || isNaN(parseInt(asignacion_id))) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'ID de asignación inválido',
                    codigo: 'ID_INVALIDO'
                });
            }

            if (!nuevo_verificador_id || !razon_reasignacion) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Nuevo verificador y razón de reasignación son requeridos',
                    codigo: 'DATOS_REQUERIDOS'
                });
            }

            // Verificar que la asignación existe
            const asignacionActual = await asignacionesServicio.obtenerAsignacionPorId(parseInt(asignacion_id));
            if (!asignacionActual) {
                return res.status(404).json({
                    exito: false,
                    mensaje: 'Asignación no encontrada',
                    codigo: 'ASIGNACION_NO_ENCONTRADA'
                });
            }

            // Verificar que el nuevo verificador es válido
            const nuevoVerificador = await asignacionesServicio.verificarVerificadorValido(nuevo_verificador_id);
            if (!nuevoVerificador.es_valido) {
                return res.status(400).json({
                    exito: false,
                    mensaje: nuevoVerificador.razon,
                    codigo: 'VERIFICADOR_INVALIDO'
                });
            }

            // Realizar reasignación
            const resultado = await asignacionesServicio.reasignarDocente({
                asignacion_id: parseInt(asignacion_id),
                nuevo_verificador_id,
                razon_reasignacion: razon_reasignacion.trim(),
                transferir_observaciones,
                notificar_involucrados,
                reasignado_por: usuarioActual.id
            });

            // Registrar auditoría
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'reasignar',
                modulo: 'verificacion',
                descripcion: `Reasignó docente ${asignacionActual.docente_nombre} a verificador ${nuevoVerificador.nombre}`,
                datos_anteriores: {
                    verificador_anterior: asignacionActual.verificador_id,
                    asignacion_id: parseInt(asignacion_id)
                },
                datos_nuevos: {
                    nuevo_verificador_id,
                    razon_reasignacion,
                    nueva_asignacion_id: resultado.nueva_asignacion_id
                },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                reasignacion_exitosa: true,
                nueva_asignacion: resultado.nueva_asignacion,
                asignacion_anterior: resultado.asignacion_anterior,
                observaciones_transferidas: resultado.observaciones_transferidas,
                notificaciones_enviadas: resultado.notificaciones
            }, 'Docente reasignado correctamente');

        } catch (error) {
            console.error('Error al reasignar docente:', error);
            return manejarError(res, error, 'Error al reasignar docente');
        }
    }

    // ===================================================
    // ⚡ ASIGNACIÓN AUTOMÁTICA BALANCEADA
    // ===================================================
    async asignacionAutomatica(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Solo administradores pueden ejecutar asignación automática
            if (!usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ejecutar asignación automática',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                ciclo_id,
                algoritmo = 'balanceado', // 'balanceado', 'especialidad', 'aleatorio'
                forzar_redistribucion = false,
                respetar_asignaciones_existentes = true,
                limite_docentes_por_verificador = null
            } = req.body;

            // Validar ciclo
            if (!ciclo_id) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'ID de ciclo es requerido',
                    codigo: 'CICLO_REQUERIDO'
                });
            }

            // Validar algoritmo
            const algoritmosValidos = ['balanceado', 'especialidad', 'aleatorio'];
            if (!algoritmosValidos.includes(algoritmo)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Algoritmo inválido. Use: ' + algoritmosValidos.join(', '),
                    codigo: 'ALGORITMO_INVALIDO'
                });
            }

            // Ejecutar asignación automática
            const resultado = await asignacionesServicio.ejecutarAsignacionAutomatica({
                ciclo_id,
                algoritmo,
                forzar_redistribucion,
                respetar_asignaciones_existentes,
                limite_docentes_por_verificador,
                ejecutado_por: usuarioActual.id
            });

            // Registrar auditoría
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'asignacion_automatica',
                modulo: 'verificacion',
                descripcion: `Ejecutó asignación automática con algoritmo ${algoritmo}`,
                datos_nuevos: {
                    ciclo_id,
                    algoritmo,
                    asignaciones_creadas: resultado.asignaciones_creadas,
                    asignaciones_modificadas: resultado.asignaciones_modificadas
                },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                asignacion_completada: true,
                asignaciones_creadas: resultado.asignaciones_creadas,
                asignaciones_modificadas: resultado.asignaciones_modificadas,
                docentes_procesados: resultado.docentes_procesados,
                verificadores_utilizados: resultado.verificadores_utilizados,
                distribucion_final: resultado.distribucion_final,
                tiempo_procesamiento: resultado.tiempo_procesamiento,
                errores: resultado.errores || []
            }, 'Asignación automática completada');

        } catch (error) {
            console.error('Error en asignación automática:', error);
            return manejarError(res, error, 'Error en asignación automática');
        }
    }

    // ===================================================
    // 📊 ESTADÍSTICAS DE ASIGNACIONES
    // ===================================================
    async obtenerEstadisticasAsignaciones(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Solo administradores pueden ver estadísticas completas
            if (!usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver estadísticas de asignaciones',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                ciclo_id = '',
                periodo = 'actual', // 'actual', 'historico', 'comparativo'
                incluir_tendencias = 'true',
                nivel_detalle = 'medio' // 'alto', 'medio', 'bajo'
            } = req.query;

            // Construir parámetros
            const parametros = {
                ciclo_id: ciclo_id ? parseInt(ciclo_id) : null,
                periodo,
                incluir_tendencias: incluir_tendencias === 'true',
                nivel_detalle,
                usuario_admin: usuarioActual
            };

            // Obtener estadísticas
            const estadisticas = await asignacionesServicio.obtenerEstadisticasAsignaciones(parametros);

            return respuestaExitosa(res, {
                resumen_general: estadisticas.resumen,
                distribucion_verificadores: estadisticas.distribucion,
                eficiencia_asignaciones: estadisticas.eficiencia,
                balance_cargas: estadisticas.balance,
                tendencias_temporales: estadisticas.tendencias || null,
                metricas_rendimiento: estadisticas.rendimiento,
                areas_mejora: estadisticas.areas_mejora,
                recomendaciones: estadisticas.recomendaciones
            }, 'Estadísticas de asignaciones obtenidas correctamente');

        } catch (error) {
            console.error('Error al obtener estadísticas de asignaciones:', error);
            return manejarError(res, error, 'Error al obtener estadísticas de asignaciones');
        }
    }

    // ===================================================
    // 🔄 ROTACIÓN DE ASIGNACIONES
    // ===================================================
    async ejecutarRotacionAsignaciones(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Solo administradores pueden ejecutar rotación
            if (!usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ejecutar rotación de asignaciones',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                ciclo_id,
                tipo_rotacion = 'parcial', // 'parcial', 'completa', 'por_especialidad'
                porcentaje_rotacion = 30,
                mantener_especialidades = true,
                razon_rotacion = 'Rotación programada del sistema'
            } = req.body;

            // Validar parámetros
            if (!ciclo_id) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'ID de ciclo es requerido',
                    codigo: 'CICLO_REQUERIDO'
                });
            }

            const porcentaje = Math.min(Math.max(parseInt(porcentaje_rotacion) || 30, 10), 100);

            // Ejecutar rotación
            const resultado = await asignacionesServicio.ejecutarRotacionAsignaciones({
                ciclo_id,
                tipo_rotacion,
                porcentaje_rotacion: porcentaje,
                mantener_especialidades,
                razon_rotacion: razon_rotacion.trim(),
                ejecutado_por: usuarioActual.id
            });

            // Registrar auditoría
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'rotacion_asignaciones',
                modulo: 'verificacion',
                descripcion: `Ejecutó rotación ${tipo_rotacion} de asignaciones (${porcentaje}%)`,
                datos_nuevos: {
                    ciclo_id,
                    tipo_rotacion,
                    porcentaje_rotacion: porcentaje,
                    asignaciones_rotadas: resultado.asignaciones_rotadas
                },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                rotacion_completada: true,
                asignaciones_rotadas: resultado.asignaciones_rotadas,
                nuevas_asignaciones: resultado.nuevas_asignaciones,
                verificadores_afectados: resultado.verificadores_afectados,
                docentes_reasignados: resultado.docentes_reasignados,
                notificaciones_enviadas: resultado.notificaciones,
                resumen_cambios: resultado.resumen_cambios
            }, 'Rotación de asignaciones completada');

        } catch (error) {
            console.error('Error en rotación de asignaciones:', error);
            return manejarError(res, error, 'Error en rotación de asignaciones');
        }
    }

    // ===================================================
    // ❌ DESACTIVAR ASIGNACIÓN
    // ===================================================
    async desactivarAsignacion(req, res) {
        try {
            const usuarioActual = req.usuario;
            const { asignacion_id } = req.params;

            // Solo administradores pueden desactivar asignaciones
            if (!usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para desactivar asignaciones',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                razon_desactivacion,
                transferir_pendientes = true,
                nuevo_verificador_id = null
            } = req.body;

            // Validar parámetros
            if (!asignacion_id || isNaN(parseInt(asignacion_id))) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'ID de asignación inválido',
                    codigo: 'ID_INVALIDO'
                });
            }

            if (!razon_desactivacion) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Razón de desactivación es requerida',
                    codigo: 'RAZON_REQUERIDA'
                });
            }

            // Desactivar asignación
            const resultado = await asignacionesServicio.desactivarAsignacion({
                asignacion_id: parseInt(asignacion_id),
                razon_desactivacion: razon_desactivacion.trim(),
                transferir_pendientes,
                nuevo_verificador_id,
                desactivado_por: usuarioActual.id
            });

            // Registrar auditoría
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'desactivar',
                modulo: 'verificacion',
                descripcion: `Desactivó asignación ID: ${asignacion_id}`,
                datos_anteriores: {
                    asignacion_id: parseInt(asignacion_id),
                    estado_anterior: 'activa'
                },
                datos_nuevos: {
                    razon_desactivacion,
                    transferir_pendientes,
                    nuevo_verificador_id
                },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                asignacion_desactivada: true,
                asignacion_info: resultado.asignacion_info,
                documentos_transferidos: resultado.documentos_transferidos,
                nueva_asignacion: resultado.nueva_asignacion || null,
                notificaciones_enviadas: resultado.notificaciones
            }, 'Asignación desactivada correctamente');

        } catch (error) {
            console.error('Error al desactivar asignación:', error);
            return manejarError(res, error, 'Error al desactivar asignación');
        }
    }
}

module.exports = new AsignacionesVerificacionControlador();