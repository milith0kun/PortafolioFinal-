/**
 * 🧭 CONTROLADOR DE NAVEGACIÓN DE PORTAFOLIOS
 * 
 * Maneja la navegación y visualización de portafolios:
 * - Árbol de navegación por usuario
 * - Filtros de portafolios
 * - Búsqueda dentro de portafolios
 * - Estados de carpetas y documentos
 * - Breadcrumbs de navegación
 * 
 * Rutas que maneja:
 * GET /api/v1/portafolios - Listar mis portafolios
 * GET /api/v1/portafolios/:id/arbol - Árbol de navegación
 * GET /api/v1/portafolios/buscar - Buscar contenido
 */

// TODO: Navegación optimizada con lazy loading
// TODO: Estados visuales (completo, incompleto, en revisión)
// TODO: Permisos de acceso por carpeta
// TODO: Favoritos y accesos rápidos
// ============================================================
// 🧭 CONTROLADOR DE NAVEGACIÓN DE PORTAFOLIOS
// Sistema Portafolio Docente UNSAAC
// ============================================================

const navegacionServicio = require('../../servicios/gestion-portafolios/navegacion.servicio');
const { manejarError, respuestaExitosa } = require('../../utilidades/formato/datos.util');
const { validarBusquedaPortafolios } = require('../../validadores/portafolios/navegacion.validador');
const { registrarAccion } = require('../../utilidades/base-datos/auditoria.util');

class NavegacionPortafoliosControlador {

    // ===================================================
    // 📂 LISTAR MIS PORTAFOLIOS
    // ===================================================
    async listarMisPortafolios(req, res) {
        try {
            const usuarioActual = req.usuario;

            const {
                ciclo_id = '',
                asignatura_id = '',
                estado = 'activo',
                vista = 'tarjetas', // 'tarjetas', 'lista', 'arbol'
                ordenar_por = 'fecha_creacion', // 'fecha_creacion', 'progreso', 'nombre', 'asignatura'
                incluir_estadisticas = 'true',
                pagina = 1,
                limite = 20
            } = req.query;

            // Construir filtros según el rol del usuario
            const filtros = {
                usuario_id: usuarioActual.id,
                roles_activos: usuarioActual.roles_activos,
                ciclo_id: ciclo_id ? parseInt(ciclo_id) : null,
                asignatura_id: asignatura_id ? parseInt(asignatura_id) : null,
                estado,
                vista,
                ordenar_por,
                incluir_estadisticas: incluir_estadisticas === 'true',
                pagina: parseInt(pagina),
                limite: Math.min(parseInt(limite) || 20, 50)
            };

            // Obtener portafolios según el rol
            const resultado = await navegacionServicio.obtenerPortafoliosUsuario(filtros);

            return respuestaExitosa(res, {
                portafolios: resultado.portafolios,
                paginacion: resultado.paginacion,
                estadisticas_generales: resultado.estadisticas || null,
                filtros_disponibles: resultado.filtros_disponibles,
                vista_actual: vista,
                accesos_rapidos: resultado.accesos_rapidos
            }, 'Portafolios obtenidos correctamente');

        } catch (error) {
            console.error('Error al listar portafolios:', error);
            return manejarError(res, error, 'Error al obtener portafolios');
        }
    }

    // ===================================================
    // 🌳 OBTENER ÁRBOL DE NAVEGACIÓN DE UN PORTAFOLIO
    // ===================================================
    async obtenerArbolNavegacion(req, res) {
        try {
            const { id } = req.params;
            const usuarioActual = req.usuario;

            // Validar ID del portafolio
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'ID de portafolio inválido',
                    codigo: 'ID_INVALIDO'
                });
            }

            const portafolioId = parseInt(id);

            const {
                nivel_profundidad = 'completo', // 'completo', 'primer_nivel', 'dos_niveles'
                incluir_archivos = 'true',
                incluir_estadisticas = 'true',
                mostrar_vacios = 'true',
                incluir_metadatos = 'false'
            } = req.query;

            // Verificar permisos de acceso al portafolio
            const permisos = await navegacionServicio.verificarPermisosPortafolio(portafolioId, usuarioActual);
            if (!permisos.puede_acceder) {
                return res.status(403).json({
                    exito: false,
                    mensaje: permisos.razon,
                    codigo: 'ACCESO_DENEGADO'
                });
            }

            // Construir parámetros para el árbol
            const parametros = {
                portafolio_id: portafolioId,
                usuario_actual: usuarioActual,
                nivel_profundidad,
                incluir_archivos: incluir_archivos === 'true',
                incluir_estadisticas: incluir_estadisticas === 'true',
                mostrar_vacios: mostrar_vacios === 'true',
                incluir_metadatos: incluir_metadatos === 'true',
                permisos_usuario: permisos.permisos
            };

            // Obtener árbol de navegación
            const arbolNavegacion = await navegacionServicio.construirArbolNavegacion(parametros);

            // Generar breadcrumbs
            const breadcrumbs = await navegacionServicio.generarBreadcrumbs(portafolioId, usuarioActual);

            // Registrar acceso si es necesario
            if (permisos.registrar_acceso) {
                await registrarAccion({
                    usuario_id: usuarioActual.id,
                    accion: 'acceder_portafolio',
                    modulo: 'portafolios',
                    descripcion: `Accedió al portafolio: ${arbolNavegacion.nombre}`,
                    datos_adicionales: { portafolio_id: portafolioId },
                    ip: req.ip,
                    user_agent: req.get('User-Agent')
                });
            }

            return respuestaExitosa(res, {
                portafolio_info: arbolNavegacion.info_principal,
                arbol_navegacion: arbolNavegacion.estructura,
                breadcrumbs,
                estadisticas_navegacion: arbolNavegacion.estadisticas || null,
                permisos_usuario: permisos.permisos,
                configuracion_vista: arbolNavegacion.configuracion_vista,
                acciones_disponibles: arbolNavegacion.acciones_disponibles
            }, 'Árbol de navegación obtenido correctamente');

        } catch (error) {
            console.error('Error al obtener árbol de navegación:', error);
            return manejarError(res, error, 'Error al obtener árbol de navegación');
        }
    }

    // ===================================================
    // 🔍 BUSCAR CONTENIDO EN PORTAFOLIOS
    // ===================================================
    async buscarContenido(req, res) {
        try {
            const usuarioActual = req.usuario;

            // Validar parámetros de búsqueda
            const { error, value: datosValidados } = validarBusquedaPortafolios(req.query);
            if (error) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Parámetros de búsqueda inválidos',
                    errores: error.details.map(det => ({
                        campo: det.path.join('.'),
                        mensaje: det.message
                    })),
                    codigo: 'PARAMETROS_INVALIDOS'
                });
            }

            const {
                q: termino_busqueda,
                portafolio_id = null,
                tipo_contenido = 'todo', // 'todo', 'carpetas', 'archivos', 'observaciones'
                filtros_avanzados = {},
                ordenar_por = 'relevancia', // 'relevancia', 'fecha', 'nombre', 'tipo'
                pagina = 1,
                limite = 25,
                incluir_contenido_relacionado = 'false'
            } = datosValidados;

            // Verificar que el término de búsqueda sea válido
            if (!termino_busqueda || termino_busqueda.trim().length < 2) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'El término de búsqueda debe tener al menos 2 caracteres',
                    codigo: 'TERMINO_MUY_CORTO'
                });
            }

            // Construir parámetros de búsqueda
            const parametrosBusqueda = {
                termino_busqueda: termino_busqueda.trim(),
                usuario_actual: usuarioActual,
                portafolio_id: portafolio_id ? parseInt(portafolio_id) : null,
                tipo_contenido,
                filtros_avanzados,
                ordenar_por,
                pagina: parseInt(pagina),
                limite: Math.min(parseInt(limite) || 25, 50),
                incluir_contenido_relacionado: incluir_contenido_relacionado === 'true'
            };

            // Realizar búsqueda
            const resultadosBusqueda = await navegacionServicio.buscarContenidoPortafolios(parametrosBusqueda);

            // Registrar búsqueda para analytics
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'buscar',
                modulo: 'portafolios',
                descripcion: `Buscó: "${termino_busqueda}"`,
                datos_adicionales: {
                    termino: termino_busqueda,
                    tipo_contenido,
                    resultados_encontrados: resultadosBusqueda.total_resultados,
                    portafolio_id
                },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                termino_busqueda,
                total_resultados: resultadosBusqueda.total_resultados,
                resultados: resultadosBusqueda.resultados,
                paginacion: resultadosBusqueda.paginacion,
                filtros_aplicados: resultadosBusqueda.filtros_aplicados,
                sugerencias_busqueda: resultadosBusqueda.sugerencias,
                contenido_relacionado: resultadosBusqueda.contenido_relacionado || null,
                estadisticas_busqueda: resultadosBusqueda.estadisticas,
                tiempo_busqueda: resultadosBusqueda.tiempo_busqueda
            }, 'Búsqueda completada correctamente');

        } catch (error) {
            console.error('Error al buscar contenido:', error);
            return manejarError(res, error, 'Error al realizar búsqueda');
        }
    }

    // ===================================================
    // 📁 OBTENER CONTENIDO DE UNA CARPETA ESPECÍFICA
    // ===================================================
    async obtenerContenidoCarpeta(req, res) {
        try {
            const { carpeta_id } = req.params;
            const usuarioActual = req.usuario;

            // Validar ID de carpeta
            if (!carpeta_id || isNaN(parseInt(carpeta_id))) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'ID de carpeta inválido',
                    codigo: 'ID_INVALIDO'
                });
            }

            const carpetaId = parseInt(carpeta_id);

            const {
                vista = 'lista', // 'lista', 'galeria', 'detalles'
                ordenar_por = 'nombre', // 'nombre', 'fecha', 'tipo', 'tamaño', 'estado'
                filtro_tipo = 'todos', // 'todos', 'documentos', 'imagenes', 'videos'
                incluir_subcarpetas = 'true',
                mostrar_ocultos = 'false'
            } = req.query;

            // Verificar permisos de acceso a la carpeta
            const permisosCarpeta = await navegacionServicio.verificarPermisosCarpeta(carpetaId, usuarioActual);
            if (!permisosCarpeta.puede_acceder) {
                return res.status(403).json({
                    exito: false,
                    mensaje: permisosCarpeta.razon,
                    codigo: 'ACCESO_DENEGADO'
                });
            }

            // Construir parámetros
            const parametros = {
                carpeta_id: carpetaId,
                usuario_actual: usuarioActual,
                vista,
                ordenar_por,
                filtro_tipo,
                incluir_subcarpetas: incluir_subcarpetas === 'true',
                mostrar_ocultos: mostrar_ocultos === 'true',
                permisos: permisosCarpeta.permisos
            };

            // Obtener contenido de la carpeta
            const contenidoCarpeta = await navegacionServicio.obtenerContenidoCarpeta(parametros);

            return respuestaExitosa(res, {
                carpeta_info: contenidoCarpeta.informacion_carpeta,
                contenido: contenidoCarpeta.elementos,
                subcarpetas: contenidoCarpeta.subcarpetas,
                archivos: contenidoCarpeta.archivos,
                estadisticas_carpeta: contenidoCarpeta.estadisticas,
                breadcrumbs: contenidoCarpeta.breadcrumbs,
                acciones_disponibles: contenidoCarpeta.acciones_disponibles,
                configuracion_vista: {
                    vista_actual: vista,
                    ordenamiento: ordenar_por,
                    filtros_activos: { tipo: filtro_tipo }
                }
            }, 'Contenido de carpeta obtenido correctamente');

        } catch (error) {
            console.error('Error al obtener contenido de carpeta:', error);
            return manejarError(res, error, 'Error al obtener contenido de carpeta');
        }
    }

    // ===================================================
    // ⭐ GESTIONAR FAVORITOS DE PORTAFOLIOS
    // ===================================================
    async gestionarFavoritos(req, res) {
        try {
            const usuarioActual = req.usuario;
            const { accion, portafolio_id, carpeta_id = null } = req.body;

            // Validar acción
            const accionesValidas = ['agregar', 'quitar', 'listar'];
            if (!accionesValidas.includes(accion)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Acción inválida. Use: ' + accionesValidas.join(', '),
                    codigo: 'ACCION_INVALIDA'
                });
            }

            // Validar portafolio_id para agregar/quitar
            if ((accion === 'agregar' || accion === 'quitar') && (!portafolio_id || isNaN(parseInt(portafolio_id)))) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'ID de portafolio requerido para esta acción',
                    codigo: 'PORTAFOLIO_ID_REQUERIDO'
                });
            }

            let resultado;

            switch (accion) {
                case 'agregar':
                    resultado = await navegacionServicio.agregarFavorito(
                        usuarioActual.id,
                        parseInt(portafolio_id),
                        carpeta_id ? parseInt(carpeta_id) : null
                    );
                    break;

                case 'quitar':
                    resultado = await navegacionServicio.quitarFavorito(
                        usuarioActual.id,
                        parseInt(portafolio_id),
                        carpeta_id ? parseInt(carpeta_id) : null
                    );
                    break;

                case 'listar':
                    resultado = await navegacionServicio.listarFavoritos(usuarioActual.id);
                    break;
            }

            // Registrar acción si no es listar
            if (accion !== 'listar') {
                await registrarAccion({
                    usuario_id: usuarioActual.id,
                    accion: `${accion}_favorito`,
                    modulo: 'portafolios',
                    descripcion: `${accion === 'agregar' ? 'Agregó' : 'Quitó'} favorito`,
                    datos_adicionales: { portafolio_id, carpeta_id },
                    ip: req.ip,
                    user_agent: req.get('User-Agent')
                });
            }

            return respuestaExitosa(res, {
                accion_realizada: accion,
                resultado,
                total_favoritos: resultado.total_favoritos || null
            }, `Acción "${accion}" realizada correctamente`);

        } catch (error) {
            console.error('Error al gestionar favoritos:', error);
            return manejarError(res, error, 'Error al gestionar favoritos');
        }
    }

    // ===================================================
    // 🔄 OBTENER ACCESOS RÁPIDOS PERSONALIZADOS
    // ===================================================
    async obtenerAccesosRapidos(req, res) {
        try {
            const usuarioActual = req.usuario;

            const {
                incluir_recientes = 'true',
                incluir_favoritos = 'true',
                incluir_frecuentes = 'true',
                incluir_sugeridos = 'false',
                limite_por_categoria = 5
            } = req.query;

            // Construir configuración
            const configuracion = {
                incluir_recientes: incluir_recientes === 'true',
                incluir_favoritos: incluir_favoritos === 'true',
                incluir_frecuentes: incluir_frecuentes === 'true',
                incluir_sugeridos: incluir_sugeridos === 'true',
                limite_por_categoria: Math.min(parseInt(limite_por_categoria) || 5, 10),
                usuario_actual: usuarioActual
            };

            // Obtener accesos rápidos
            const accesosRapidos = await navegacionServicio.obtenerAccesosRapidos(configuracion);

            return respuestaExitosa(res, {
                accesos_recientes: accesosRapidos.recientes || null,
                favoritos: accesosRapidos.favoritos || null,
                mas_frecuentes: accesosRapidos.frecuentes || null,
                sugeridos: accesosRapidos.sugeridos || null,
                configuracion_activa: configuracion,
                ultima_actualizacion: accesosRapidos.ultima_actualizacion
            }, 'Accesos rápidos obtenidos correctamente');

        } catch (error) {
            console.error('Error al obtener accesos rápidos:', error);
            return manejarError(res, error, 'Error al obtener accesos rápidos');
        }
    }

    // ===================================================
    // 🎨 CONFIGURAR VISTA PERSONALIZADA
    // ===================================================
    async configurarVistaPersonalizada(req, res) {
        try {
            const usuarioActual = req.usuario;

            const {
                vista_por_defecto = 'tarjetas',
                ordenamiento_por_defecto = 'fecha_creacion',
                elementos_por_pagina = 20,
                mostrar_estadisticas = true,
                mostrar_breadcrumbs = true,
                tema_visual = 'claro',
                columnas_visibles = [],
                filtros_guardados = []
            } = req.body;

            // Validar configuración
            const vistasValidas = ['tarjetas', 'lista', 'arbol', 'galeria'];
            if (!vistasValidas.includes(vista_por_defecto)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Vista por defecto inválida',
                    codigo: 'VISTA_INVALIDA'
                });
            }

            // Construir configuración
            const configuracion = {
                vista_por_defecto,
                ordenamiento_por_defecto,
                elementos_por_pagina: Math.min(Math.max(parseInt(elementos_por_pagina) || 20, 5), 50),
                mostrar_estadisticas,
                mostrar_breadcrumbs,
                tema_visual,
                columnas_visibles: Array.isArray(columnas_visibles) ? columnas_visibles : [],
                filtros_guardados: Array.isArray(filtros_guardados) ? filtros_guardados : []
            };

            // Guardar configuración
            const resultado = await navegacionServicio.guardarConfiguracionVista(usuarioActual.id, configuracion);

            // Registrar cambio de configuración
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'configurar_vista',
                modulo: 'portafolios',
                descripcion: 'Configuró vista personalizada de portafolios',
                datos_nuevos: configuracion,
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                configuracion_guardada: resultado.configuracion,
                vistas_disponibles: resultado.vistas_disponibles,
                temas_disponibles: resultado.temas_disponibles
            }, 'Configuración de vista guardada correctamente');

        } catch (error) {
            console.error('Error al configurar vista:', error);
            return manejarError(res, error, 'Error al configurar vista personalizada');
        }
    }

    // ===================================================
    // 📊 OBTENER ESTADÍSTICAS DE NAVEGACIÓN
    // ===================================================
    async obtenerEstadisticasNavegacion(req, res) {
        try {
            const usuarioActual = req.usuario;

            const {
                periodo = 'mes', // 'semana', 'mes', 'trimestre'
                incluir_patrones_uso = 'true',
                incluir_rendimiento = 'false'
            } = req.query;

            // Solo administradores pueden ver estadísticas de rendimiento
            if (incluir_rendimiento === 'true' && !usuarioActual.roles_activos.includes('administrador')) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'No tienes permisos para ver estadísticas de rendimiento',
                    codigo: 'PERMISOS_INSUFICIENTES'
                });
            }

            // Construir parámetros
            const parametros = {
                usuario_id: usuarioActual.id,
                periodo,
                incluir_patrones_uso: incluir_patrones_uso === 'true',
                incluir_rendimiento: incluir_rendimiento === 'true' && usuarioActual.roles_activos.includes('administrador'),
                roles_usuario: usuarioActual.roles_activos
            };

            // Obtener estadísticas
            const estadisticas = await navegacionServicio.obtenerEstadisticasNavegacion(parametros);

            return respuestaExitosa(res, {
                periodo_analizado: periodo,
                estadisticas_personales: estadisticas.personales,
                patrones_uso: estadisticas.patrones_uso || null,
                portafolios_mas_visitados: estadisticas.mas_visitados,
                tendencias_navegacion: estadisticas.tendencias,
                rendimiento_sistema: estadisticas.rendimiento || null,
                recomendaciones: estadisticas.recomendaciones
            }, 'Estadísticas de navegación obtenidas correctamente');

        } catch (error) {
            console.error('Error al obtener estadísticas de navegación:', error);
            return manejarError(res, error, 'Error al obtener estadísticas de navegación');
        }
    }

    // ===================================================
    // 🔄 ACTUALIZAR ORDEN DE ELEMENTOS
    // ===================================================
    async actualizarOrdenElementos(req, res) {
        try {
            const usuarioActual = req.usuario;
            const { elementos_ordenados, carpeta_padre_id = null } = req.body;

            // Validar datos
            if (!Array.isArray(elementos_ordenados) || elementos_ordenados.length === 0) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Lista de elementos ordenados es requerida',
                    codigo: 'ELEMENTOS_REQUERIDOS'
                });
            }

            // Verificar permisos para modificar el orden
            if (carpeta_padre_id) {
                const permisos = await navegacionServicio.verificarPermisosCarpeta(carpeta_padre_id, usuarioActual);
                if (!permisos.puede_modificar) {
                    return res.status(403).json({
                        exito: false,
                        mensaje: 'No tienes permisos para modificar el orden en esta carpeta',
                        codigo: 'PERMISOS_INSUFICIENTES'
                    });
                }
            }

            // Actualizar orden
            const resultado = await navegacionServicio.actualizarOrdenElementos(
                elementos_ordenados,
                carpeta_padre_id,
                usuarioActual.id
            );

            // Registrar cambio
            await registrarAccion({
                usuario_id: usuarioActual.id,
                accion: 'reordenar_elementos',
                modulo: 'portafolios',
                descripcion: 'Actualizó orden de elementos en portafolio',
                datos_adicionales: {
                    carpeta_padre_id,
                    elementos_reordenados: elementos_ordenados.length
                },
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            return respuestaExitosa(res, {
                orden_actualizado: true,
                elementos_procesados: resultado.elementos_procesados,
                errores: resultado.errores || []
            }, 'Orden de elementos actualizado correctamente');

        } catch (error) {
            console.error('Error al actualizar orden:', error);
            return manejarError(res, error, 'Error al actualizar orden de elementos');
        }
    }
}

module.exports = new NavegacionPortafoliosControlador();