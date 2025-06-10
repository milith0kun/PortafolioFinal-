/**
 * ✅ CONTROLADOR DE REVISIÓN DE DOCUMENTOS
 * 
 * Gestiona el proceso de verificación de documentos:
 * - Asignar documentos para revisión
 * - Aprobar/rechazar documentos
 * - Generar observaciones
 * - Estados de verificación
 * - Workflow de aprobación
 * 
 * Rutas que maneja:
 * GET /api/v1/verificacion/pendientes - Documentos pendientes
 * PUT /api/v1/verificacion/:id/rechazar - Rechazar documento
 * POST /api/v1/verificacion/:id/observacion - Crear observación
 */

// TODO: Queue de documentos pendientes por verificar
// TODO: Sistema de estados (pendiente, en revisión, aprobado, rechazado)
// TODO: Asignación automática de verificadores
// TODO: Notificaciones automáticas al docente
// TODO: Historial completo de revisiones
// ============================================================
// ✅ CONTROLADOR DE REVISIÓN DE DOCUMENTOS
// Sistema Portafolio Docente UNSAAC
// ============================================================

const revisionServicio = require('../../servicios/verificacion/revision.servicio');
const { manejarError, respuestaExitosa } = require('../../utilidades/formato/datos.util');
const { validarRevisionDocumento, validarObservacion } = require('../../validadores/verificacion/revision.validador');
const { registrarAccion } = require('../../utilidades/base-datos/auditoria.util');

class RevisionDocumentosControlador {

    // ===================================================
    // 📋 OBTENER DOCUMENTOS PENDIENTES DE VERIFICACIÓN
    // ===================================================
    async obtenerDocumentosPendientes(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar que el usuario es verificador
            if (!usuarioActual.roles_activos.includes('verificador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver documentos pendientes de verificación',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                filtro = 'mis_asignados', // 'mis_asignados', 'todos', 'sin_asignar'
                prioridad = 'todas', // 'alta', 'media', 'baja', 'todas'
                tipo_documento = 'todos',
                docente_id = '',
                ordenar_por = 'fecha_subida', // 'fecha_subida', 'prioridad', 'docente', 'tipo'
                limite = 50,
                incluir_detalles = 'true'
            } = req.query;

            // Construir filtros
            const filtros = {
                verificador_id: usuarioActual.id,
                filtro,
                prioridad,
                tipo_documento,
                docente_id: docente_id ? parseInt(docente_id) : null,
                ordenar_por,
                limite: Math.min(parseInt(limite) || 50, 100),
                incluir_detalles: incluir_detalles === 'true',
                usuario_verificador: usuarioActual
            };

            // Obtener documentos pendientes
            const documentos = await revisionServicio.obtenerDocumentosPendientes(filtros);

            return respuestaExitosa(res, {
                documentos_pendientes: documentos.pendientes,
                documentos_prioritarios: documentos.prioritarios,
                resumen_cola: documentos.resumen_cola,
                tiempo_estimado_revision: documentos.tiempo_estimado,
                distribucion_tipos: documentos.distribucion_tipos,
                docentes_con_pendientes: documentos.docentes_pendientes,
                sugerencias_revision: documentos.sugerencias,
                estadisticas_personales: documentos.estadisticas_personales
            }, 'Documentos pendientes obtenidos correctamente');

        } catch (error) {
            console.error('Error al obtener documentos pendientes:', error);
            return manejarError(res, error, 'Error al obtener documentos pendientes');
        }
    }

    // ===================================================
    // ✅ APROBAR DOCUMENTO
    // ===================================================
    async aprobarDocumento(req, res) {
        try {
            const { documento_id } = req.params;
            const usuarioActual = req.usuario;

            // Verificar que el usuario es verificador
            if (!usuarioActual.roles_activos.includes('verificador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para aprobar documentos',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            // Validar ID del documento
            if (!documento_id || isNaN(parseInt(documento_id))) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'ID de documento inválido',
                    codigo: 'ID_INVALIDO'
                });
            }

            const documentoId = parseInt(documento_id);

            const {
                observaciones_aprobacion = '',
                calificacion_calidad = null, // 1-5 escala de calidad
                destacar_documento = false,
                notificar_docente = true
            } = req.body;

            // Verificar que el documento existe y está asignado al verificador
            const documento = await revisionServicio.verificarDocumentoAsignado(documentoId, usuarioActual.id);
            if (!documento.es_valido) {
                return res.status(400).json({
                    exito: false,
                    mensaje: documento.razon,
                    codigo: 'DOCUMENTO_NO_ASIGNADO'
                });
            }

            // Verificar que el documento está en estado pendiente
            if (documento.estado !== 'pendiente' && documento.estado !== 'en_revision') {
                return res.status(400).json({
                    exito: false,
                    mensaje: `El documento ya fue ${documento.estado}`,
                    codigo: 'ESTADO_INVALIDO'
                });
            }

            // Aprobar documento
            const resultado = await revisionServicio.aprobarDocumento({
                documento_id: documentoId,
                verificador_id: usuarioActual.id,
                observaciones_aprobacion: observaciones_aprobacion.trim(),
                calificacion_calidad,
                destacar_documento,
                notificar_docente
            });

            // Registrar auditoría
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'aprobar',
                modulo: 'verificacion',
                descripcion: `Aprobó documento: ${documento.nombre_archivo}`,
                datos_anteriores: {
                    documento_id: documentoId,
                    estado_anterior: documento.estado
                },
                datos_nuevos: {
                    estado_nuevo: 'aprobado',
                    calificacion_calidad,
                    destacar_documento
                },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                documento_aprobado: true,
                documento_info: resultado.documento_info,
                fecha_aprobacion: resultado.fecha_aprobacion,
                notificacion_enviada: resultado.notificacion_enviada,
                estadisticas_actualizadas: resultado.estadisticas_verificador,
                siguiente_documento: resultado.siguiente_documento || null
            }, 'Documento aprobado correctamente');

        } catch (error) {
            console.error('Error al aprobar documento:', error);
            return manejarError(res, error, 'Error al aprobar documento');
        }
    }

    // ===================================================
    // ❌ RECHAZAR DOCUMENTO
    // ===================================================
    async rechazarDocumento(req, res) {
        try {
            const { documento_id } = req.params;
            const usuarioActual = req.usuario;

            // Verificar que el usuario es verificador
            if (!usuarioActual.roles_activos.includes('verificador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para rechazar documentos',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            // Validar datos de entrada
            const { error, value: datosValidados } = validarRevisionDocumento(req.body);
            if (error) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Datos de rechazo inválidos',
                    errores: error.details.map(det => ({
                        campo: det.path.join('.'),
                        mensaje: det.message
                    })),
                    codigo: 'DATOS_INVALIDOS'
                });
            }

            const documentoId = parseInt(documento_id);

            // Verificar que el documento existe y está asignado al verificador
            const documento = await revisionServicio.verificarDocumentoAsignado(documentoId, usuarioActual.id);
            if (!documento.es_valido) {
                return res.status(400).json({
                    exito: false,
                    mensaje: documento.razon,
                    codigo: 'DOCUMENTO_NO_ASIGNADO'
                });
            }

            const {
                razon_rechazo,
                observaciones_detalladas,
                requiere_resubida = true,
                categoria_problema = 'formato', // 'contenido', 'formato', 'calidad', 'completitud'
                prioridad_correccion = 'media',
                sugerencias_mejora = '',
                notificar_docente = true
            } = datosValidados;

            // Rechazar documento
            const resultado = await revisionServicio.rechazarDocumento({
                documento_id: documentoId,
                verificador_id: usuarioActual.id,
                razon_rechazo,
                observaciones_detalladas,
                requiere_resubida,
                categoria_problema,
                prioridad_correccion,
                sugerencias_mejora,
                notificar_docente
            });

            // Registrar auditoría
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'rechazar',
                modulo: 'verificacion',
                descripcion: `Rechazó documento: ${documento.nombre_archivo}`,
                datos_anteriores: {
                    documento_id: documentoId,
                    estado_anterior: documento.estado
                },
                datos_nuevos: {
                    estado_nuevo: 'rechazado',
                    razon_rechazo,
                    categoria_problema
                },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                documento_rechazado: true,
                documento_info: resultado.documento_info,
                observacion_creada: resultado.observacion_creada,
                fecha_rechazo: resultado.fecha_rechazo,
                notificacion_enviada: resultado.notificacion_enviada,
                requiere_accion_docente: resultado.requiere_accion_docente,
                siguiente_documento: resultado.siguiente_documento || null
            }, 'Documento rechazado correctamente');

        } catch (error) {
            console.error('Error al rechazar documento:', error);
            return manejarError(res, error, 'Error al rechazar documento');
        }
    }

    // ===================================================
    // 💬 CREAR OBSERVACIÓN SIN CAMBIAR ESTADO
    // ===================================================
    async crearObservacion(req, res) {
        try {
            const { documento_id } = req.params;
            const usuarioActual = req.usuario;

            // Verificar que el usuario es verificador
            if (!usuarioActual.roles_activos.includes('verificador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para crear observaciones',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            // Validar datos de la observación
            const { error, value: datosValidados } = validarObservacion(req.body);
            if (error) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Datos de observación inválidos',
                    errores: error.details.map(det => ({
                        campo: det.path.join('.'),
                        mensaje: det.message
                    })),
                    codigo: 'DATOS_INVALIDOS'
                });
            }

            const documentoId = parseInt(documento_id);

            // Verificar que el documento existe y está asignado al verificador
            const documento = await revisionServicio.verificarDocumentoAsignado(documentoId, usuarioActual.id);
            if (!documento.es_valido) {
                return res.status(400).json({
                    exito: false,
                    mensaje: documento.razon,
                    codigo: 'DOCUMENTO_NO_ASIGNADO'
                });
            }

            const {
                tipo_observacion = 'general', // 'general', 'correccion', 'sugerencia', 'pregunta'
                contenido,
                es_publica = true,
                requiere_respuesta = false,
                prioridad = 'media', // 'baja', 'media', 'alta', 'critica'
                seccion_documento = null,
                pagina_referencia = null,
                notificar_docente = true
            } = datosValidados;

            // Crear observación
            const resultado = await revisionServicio.crearObservacion({
                documento_id: documentoId,
                verificador_id: usuarioActual.id,
                tipo_observacion,
                contenido,
                es_publica,
                requiere_respuesta,
                prioridad,
                seccion_documento,
                pagina_referencia,
                notificar_docente
            });

            // Registrar auditoría
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'crear_observacion',
                modulo: 'verificacion',
                descripcion: `Creó observación para documento: ${documento.nombre_archivo}`,
                datos_nuevos: {
                    documento_id: documentoId,
                    tipo_observacion,
                    prioridad,
                    observacion_id: resultado.observacion_id
                },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                observacion_creada: true,
                observacion_info: resultado.observacion_info,
                documento_info: resultado.documento_info,
                notificacion_enviada: resultado.notificacion_enviada,
                conversacion_actualizada: resultado.conversacion_actualizada
            }, 'Observación creada correctamente', 201);

        } catch (error) {
            console.error('Error al crear observación:', error);
            return manejarError(res, error, 'Error al crear observación');
        }
    }

    // ===================================================
    // 🔄 SOLICITAR CORRECCIÓN
    // ===================================================
    async solicitarCorreccion(req, res) {
        try {
            const { documento_id } = req.params;
            const usuarioActual = req.usuario;

            // Verificar que el usuario es verificador
            if (!usuarioActual.roles_activos.includes('verificador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para solicitar correcciones',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const documentoId = parseInt(documento_id);

            const {
                observaciones_correccion,
                fecha_limite_correccion = null,
                mantener_en_revision = true,
                prioridad_correccion = 'media',
                areas_mejora = [],
                recursos_ayuda = [],
                notificar_docente = true
            } = req.body;

            // Validar observaciones requeridas
            if (!observaciones_correccion || observaciones_correccion.trim().length === 0) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Las observaciones de corrección son requeridas',
                    codigo: 'OBSERVACIONES_REQUERIDAS'
                });
            }

            // Verificar documento asignado
            const documento = await revisionServicio.verificarDocumentoAsignado(documentoId, usuarioActual.id);
            if (!documento.es_valido) {
                return res.status(400).json({
                    exito: false,
                    mensaje: documento.razon,
                    codigo: 'DOCUMENTO_NO_ASIGNADO'
                });
            }

            // Solicitar corrección
            const resultado = await revisionServicio.solicitarCorreccion({
                documento_id: documentoId,
                verificador_id: usuarioActual.id,
                observaciones_correccion: observaciones_correccion.trim(),
                fecha_limite_correccion,
                mantener_en_revision,
                prioridad_correccion,
                areas_mejora,
                recursos_ayuda,
                notificar_docente
            });

            // Registrar auditoría
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'solicitar_correccion',
                modulo: 'verificacion',
                descripcion: `Solicitó corrección para documento: ${documento.nombre_archivo}`,
                datos_nuevos: {
                    documento_id: documentoId,
                    prioridad_correccion,
                    fecha_limite: fecha_limite_correccion,
                    areas_mejora: areas_mejora.length
                },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                correccion_solicitada: true,
                documento_info: resultado.documento_info,
                observacion_correccion: resultado.observacion_correccion,
                fecha_limite: resultado.fecha_limite,
                notificacion_enviada: resultado.notificacion_enviada,
                recursos_proporcionados: resultado.recursos_proporcionados
            }, 'Corrección solicitada correctamente');

        } catch (error) {
            console.error('Error al solicitar corrección:', error);
            return manejarError(res, error, 'Error al solicitar corrección');
        }
    }

    // ===================================================
    // 📊 REVISIÓN POR LOTES (MÚLTIPLES DOCUMENTOS)
    // ===================================================
    async revisionPorLotes(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar que el usuario es verificador
            if (!usuarioActual.roles_activos.includes('verificador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para hacer revisión por lotes',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                documentos_ids = [],
                accion = 'aprobar', // 'aprobar', 'rechazar', 'solicitar_correccion'
                razon_comun = '',
                observaciones_comunes = '',
                configuracion_individual = [],
                notificar_docentes = true
            } = req.body;

            // Validar que se proporcionaron documentos
            if (!Array.isArray(documentos_ids) || documentos_ids.length === 0) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Debe proporcionar al menos un documento para revisar',
                    codigo: 'DOCUMENTOS_REQUERIDOS'
                });
            }

            // Limitar cantidad de documentos por lote
            if (documentos_ids.length > 50) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'No se pueden procesar más de 50 documentos por lote',
                    codigo: 'LIMITE_EXCEDIDO'
                });
            }

            // Validar acción
            const accionesValidas = ['aprobar', 'rechazar', 'solicitar_correccion'];
            if (!accionesValidas.includes(accion)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Acción inválida. Use: ' + accionesValidas.join(', '),
                    codigo: 'ACCION_INVALIDA'
                });
            }

            // Procesar revisión por lotes
            const resultado = await revisionServicio.procesarRevisionLotes({
                documentos_ids: documentos_ids.map(id => parseInt(id)),
                verificador_id: usuarioActual.id,
                accion,
                razon_comun: razon_comun.trim(),
                observaciones_comunes: observaciones_comunes.trim(),
                configuracion_individual,
                notificar_docentes
            });

            // Registrar auditoría
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'revision_lotes',
                modulo: 'verificacion',
                descripcion: `Procesó ${documentos_ids.length} documentos por lotes con acción: ${accion}`,
                datos_nuevos: {
                    documentos_procesados: documentos_ids.length,
                    accion,
                    exitosos: resultado.documentos_exitosos.length,
                    fallidos: resultado.documentos_fallidos.length
                },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                lote_procesado: true,
                documentos_exitosos: resultado.documentos_exitosos,
                documentos_fallidos: resultado.documentos_fallidos,
                resumen_procesamiento: resultado.resumen,
                notificaciones_enviadas: resultado.notificaciones_enviadas,
                tiempo_procesamiento: resultado.tiempo_procesamiento,
                errores_detallados: resultado.errores_detallados
            }, 'Revisión por lotes completada');

        } catch (error) {
            console.error('Error en revisión por lotes:', error);
            return manejarError(res, error, 'Error en revisión por lotes');
        }
    }

    // ===================================================
    // 🔍 OBTENER HISTORIAL DE REVISIONES
    // ===================================================
    async obtenerHistorialRevisiones(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Verificar permisos
            if (!usuarioActual.roles_activos.includes('verificador') && 
                !usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver historial de revisiones',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                verificador_id = '',
                documento_id = '',
                docente_id = '',
                fecha_inicio = '',
                fecha_fin = '',
                tipo_accion = 'todas', // 'aprobar', 'rechazar', 'observacion', 'todas'
                pagina = 1,
                limite = 50,
                incluir_detalles = 'true'
            } = req.query;

            // Si no es administrador, solo puede ver su propio historial
            let verificadorIdFiltro = verificador_id;
            if (!usuarioActual.roles_activos.includes('administrador')) {
                verificadorIdFiltro = usuarioActual.id;
            }

            // Construir filtros
            const filtros = {
                verificador_id: verificadorIdFiltro ? parseInt(verificadorIdFiltro) : null,
                documento_id: documento_id ? parseInt(documento_id) : null,
                docente_id: docente_id ? parseInt(docente_id) : null,
                fecha_inicio,
                fecha_fin,
                tipo_accion,
                pagina: parseInt(pagina),
                limite: Math.min(parseInt(limite) || 50, 100),
                incluir_detalles: incluir_detalles === 'true',
                usuario_consultor: usuarioActual
            };

            // Obtener historial
            const historial = await revisionServicio.obtenerHistorialRevisiones(filtros);

            return respuestaExitosa(res, {
                historial_revisiones: historial.revisiones,
                paginacion: historial.paginacion,
                estadisticas_periodo: historial.estadisticas,
                filtros_aplicados: filtros,
                resumen_actividad: historial.resumen_actividad
            }, 'Historial de revisiones obtenido correctamente');

        } catch (error) {
            console.error('Error al obtener historial de revisiones:', error);
            return manejarError(res, error, 'Error al obtener historial de revisiones');
        }
    }

    // ===================================================
    // ⚡ ASIGNAR DOCUMENTO PARA REVISIÓN
    // ===================================================
    async asignarDocumentoRevision(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Solo administradores pueden asignar documentos manualmente
            if (!usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para asignar documentos para revisión',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const {
                documento_id,
                verificador_id,
                prioridad = 'media',
                fecha_limite = null,
                observaciones_asignacion = '',
                notificar_verificador = true
            } = req.body;

            // Validar datos requeridos
            if (!documento_id || !verificador_id) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'ID de documento y verificador son requeridos',
                    codigo: 'DATOS_REQUERIDOS'
                });
            }

            // Asignar documento
            const resultado = await revisionServicio.asignarDocumentoRevision({
                documento_id: parseInt(documento_id),
                verificador_id: parseInt(verificador_id),
                prioridad,
                fecha_limite,
                observaciones_asignacion: observaciones_asignacion.trim(),
                asignado_por: usuarioActual.id,
                notificar_verificador
            });

            // Registrar auditoría
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'asignar_revision',
                modulo: 'verificacion',
                descripcion: `Asignó documento ID: ${documento_id} para revisión`,
                datos_nuevos: {
                    documento_id: parseInt(documento_id),
                    verificador_id: parseInt(verificador_id),
                    prioridad
                },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                asignacion_exitosa: true,
                documento_info: resultado.documento_info,
                verificador_info: resultado.verificador_info,
                fecha_asignacion: resultado.fecha_asignacion,
                notificacion_enviada: resultado.notificacion_enviada,
                nueva_carga_verificador: resultado.nueva_carga_verificador
            }, 'Documento asignado para revisión correctamente');

        } catch (error) {
            console.error('Error al asignar documento para revisión:', error);
            return manejarError(res, error, 'Error al asignar documento para revisión');
        }
    }

    // ===================================================
    // 📱 MARCAR DOCUMENTO COMO EN REVISIÓN
    // ===================================================
    async marcarEnRevision(req, res) {
        try {
            const { documento_id } = req.params;
            const usuarioActual = req.usuario;

            // Verificar que el usuario es verificador
            if (!usuarioActual.roles_activos.includes('verificador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para marcar documentos en revisión',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            const documentoId = parseInt(documento_id);

            const {
                tiempo_estimado_revision = null,
                observaciones_inicio = '',
                notificar_docente = false
            } = req.body;

            // Verificar documento asignado
            const documento = await revisionServicio.verificarDocumentoAsignado(documentoId, usuarioActual.id);
            if (!documento.es_valido) {
                return res.status(400).json({
                    exito: false,
                    mensaje: documento.razon,
                    codigo: 'DOCUMENTO_NO_ASIGNADO'
                });
            }

            // Marcar como en revisión
            const resultado = await revisionServicio.marcarEnRevision({
                documento_id: documentoId,
                verificador_id: usuarioActual.id,
                tiempo_estimado_revision,
                observaciones_inicio: observaciones_inicio.trim(),
                notificar_docente
            });

            // Registrar auditoría
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'iniciar_revision',
                modulo: 'verificacion',
                descripcion: `Inició revisión del documento: ${documento.nombre_archivo}`,
                datos_nuevos: {
                    documento_id: documentoId,
                    tiempo_estimado: tiempo_estimado_revision
                },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                revision_iniciada: true,
                documento_info: resultado.documento_info,
                fecha_inicio_revision: resultado.fecha_inicio,
                tiempo_estimado: resultado.tiempo_estimado,
                notificacion_enviada: resultado.notificacion_enviada
            }, 'Documento marcado como en revisión');

        } catch (error) {
            console.error('Error al marcar documento en revisión:', error);
            return manejarError(res, error, 'Error al marcar documento en revisión');
        }
    }
}

module.exports = new RevisionDocumentosControlador();