/**
 * 📊 SERVICIO DE REPORTES
 * Sistema Portafolio Docente UNSAAC
 * 
 * Servicio especializado para generación de reportes
 * PDF, Excel, estadísticas avanzadas y dashboards ejecutivos
 */

class ServicioReportes {
   constructor() {
       this.baseURL = '/api/v1/reportes';
       this.clienteAPI = window.clienteAPI;
       
       // Cache para reportes y estadísticas
       this.cache = {
           reportes: new Map(),
           estadisticas: new Map(),
           plantillas: new Map(),
           ttl: 5 * 60 * 1000 // 5 minutos
       };

       // Configuración de reportes
       this.config = {
           // Tipos de reporte disponibles
           tipos: {
               'docentes': {
                   nombre: 'Reporte de Docentes',
                   descripcion: 'Análisis completo por docente',
                   icono: 'fa-user-tie',
                   formatos: ['pdf', 'excel'],
                   parametros: ['ciclo_id', 'docente_id', 'carrera', 'incluir_estadisticas']
               },
               'asignaturas': {
                   nombre: 'Reporte de Asignaturas',
                   descripcion: 'Estado de asignaturas por ciclo',
                   icono: 'fa-book',
                   formatos: ['pdf', 'excel'],
                   parametros: ['ciclo_id', 'carrera', 'semestre', 'tipo']
               },
               'verificacion': {
                   nombre: 'Reporte de Verificación',
                   descripcion: 'Análisis del proceso de verificación',
                   icono: 'fa-check-circle',
                   formatos: ['pdf', 'excel'],
                   parametros: ['ciclo_id', 'verificador_id', 'fecha_inicio', 'fecha_fin']
               },
               'progreso': {
                   nombre: 'Reporte de Progreso',
                   descripcion: 'Progreso de portafolios por docente',
                   icono: 'fa-chart-line',
                   formatos: ['pdf', 'excel'],
                   parametros: ['ciclo_id', 'docente_id', 'umbral_progreso']
               },
               'observaciones': {
                   nombre: 'Reporte de Observaciones',
                   descripcion: 'Análisis de observaciones y comunicación',
                   icono: 'fa-comments',
                   formatos: ['pdf', 'excel'],
                   parametros: ['ciclo_id', 'tipo', 'estado', 'fecha_inicio', 'fecha_fin']
               },
               'ejecutivo': {
                   nombre: 'Reporte Ejecutivo',
                   descripcion: 'Dashboard ejecutivo completo',
                   icono: 'fa-chart-bar',
                   formatos: ['pdf'],
                   parametros: ['ciclo_id', 'incluir_graficos', 'incluir_recomendaciones']
               },
               'cumplimiento': {
                   nombre: 'Reporte de Cumplimiento',
                   descripcion: 'Análisis de cumplimiento institucional',
                   icono: 'fa-tasks',
                   formatos: ['pdf', 'excel'],
                   parametros: ['ciclo_id', 'nivel_detalle', 'incluir_alertas']
               }
           },

           // Formatos de salida
           formatos: {
               'pdf': {
                   nombre: 'PDF',
                   icono: 'fa-file-pdf',
                   mimeType: 'application/pdf',
                   extension: 'pdf'
               },
               'excel': {
                   nombre: 'Excel',
                   icono: 'fa-file-excel',
                   mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                   extension: 'xlsx'
               },
               'csv': {
                   nombre: 'CSV',
                   icono: 'fa-file-csv',
                   mimeType: 'text/csv',
                   extension: 'csv'
               },
               'json': {
                   nombre: 'JSON',
                   icono: 'fa-file-code',
                   mimeType: 'application/json',
                   extension: 'json'
               }
           },

           // Estados de reporte
           estados: {
               'generando': {
                   etiqueta: 'Generando',
                   descripcion: 'El reporte se está generando',
                   color: 'info',
                   icono: 'fa-spinner fa-spin'
               },
               'completado': {
                   etiqueta: 'Completado',
                   descripcion: 'Reporte generado correctamente',
                   color: 'success',
                   icono: 'fa-check'
               },
               'error': {
                   etiqueta: 'Error',
                   descripcion: 'Error al generar el reporte',
                   color: 'danger',
                   icono: 'fa-exclamation-triangle'
               },
               'expirado': {
                   etiqueta: 'Expirado',
                   descripcion: 'El reporte ha expirado',
                   color: 'secondary',
                   icono: 'fa-clock'
               }
           },

           // Configuración de generación
           generacion: {
               timeout: 300000, // 5 minutos
               intentosMaximos: 3,
               intervaloConsulta: 2000, // 2 segundos
               expiracionReporte: 24 * 60 * 60 * 1000 // 24 horas
           }
       };

       // Estado de reportes en progreso
       this.reportesEnProgreso = new Map();
   }

   // ==========================================
   // GENERACIÓN DE REPORTES
   // ==========================================

   /**
    * 📊 Generar reporte
    */
   async generarReporte(tipoReporte, parametros = {}, formato = 'pdf') {
       try {
           console.log(`📊 Generando reporte: ${tipoReporte} en formato ${formato}`);

           // Validar tipo de reporte
           if (!this.config.tipos[tipoReporte]) {
               throw new Error(`Tipo de reporte no válido: ${tipoReporte}`);
           }

           // Validar formato
           if (!this.config.formatos[formato]) {
               throw new Error(`Formato no válido: ${formato}`);
           }

           // Validar parámetros requeridos
           const validacion = this.validarParametros(tipoReporte, parametros);
           if (!validacion.valido) {
               throw new Error(`Parámetros inválidos: ${validacion.errores.join(', ')}`);
           }

           // Iniciar generación
           const respuesta = await this.clienteAPI.post(`${this.baseURL}/generar`, {
               tipo: tipoReporte,
               formato,
               parametros,
               opciones: {
                   incluir_graficos: parametros.incluirGraficos !== false,
                   incluir_estadisticas: parametros.incluirEstadisticas !== false,
                   incluir_recomendaciones: parametros.incluirRecomendaciones || false
               }
           });

           const reporteId = respuesta.data.reporte_id;

           // Si es generación asíncrona, monitorear progreso
           if (respuesta.data.asincrono) {
               return await this.monitorearGeneracion(reporteId);
           } else {
               // Generación síncrona, descargar directamente
               return await this.descargarReporte(reporteId);
           }

       } catch (error) {
           console.error('❌ Error generando reporte:', error);
           throw error;
       }
   }

   /**
    * 🔄 Monitorear generación asíncrona
    */
   async monitorearGeneracion(reporteId) {
       return new Promise((resolve, reject) => {
           const inicioMonitoreo = Date.now();
           
           // Agregar a reportes en progreso
           this.reportesEnProgreso.set(reporteId, {
               inicio: inicioMonitoreo,
               estado: 'generando'
           });

           const consultarEstado = async () => {
               try {
                   // Verificar timeout
                   if (Date.now() - inicioMonitoreo > this.config.generacion.timeout) {
                       this.reportesEnProgreso.delete(reporteId);
                       reject(new Error('Timeout en la generación del reporte'));
                       return;
                   }

                   const estado = await this.consultarEstadoReporte(reporteId);
                   
                   // Actualizar estado local
                   if (this.reportesEnProgreso.has(reporteId)) {
                       this.reportesEnProgreso.get(reporteId).estado = estado.estado;
                   }

                   // Emitir evento de progreso
                   this.emitirEvento('reporte:progreso', {
                       reporteId,
                       estado: estado.estado,
                       progreso: estado.progreso || 0
                   });

                   switch (estado.estado) {
                       case 'completado':
                           this.reportesEnProgreso.delete(reporteId);
                           resolve(await this.descargarReporte(reporteId));
                           break;
                           
                       case 'error':
                           this.reportesEnProgreso.delete(reporteId);
                           reject(new Error(estado.mensaje || 'Error en la generación del reporte'));
                           break;
                           
                       case 'generando':
                           // Continuar monitoreando
                           setTimeout(consultarEstado, this.config.generacion.intervaloConsulta);
                           break;
                           
                       default:
                           // Estado desconocido, continuar monitoreando
                           setTimeout(consultarEstado, this.config.generacion.intervaloConsulta);
                   }

               } catch (error) {
                   this.reportesEnProgreso.delete(reporteId);
                   reject(error);
               }
           };

           // Iniciar monitoreo
           consultarEstado();
       });
   }

   /**
    * 📋 Consultar estado de reporte
    */
   async consultarEstadoReporte(reporteId) {
       try {
           const respuesta = await this.clienteAPI.get(`${this.baseURL}/${reporteId}/estado`);
           return respuesta.data;
       } catch (error) {
           console.error('❌ Error consultando estado del reporte:', error);
           throw error;
       }
   }

   /**
    * 📥 Descargar reporte generado
    */
   async descargarReporte(reporteId) {
       try {
           const respuesta = await this.clienteAPI.get(
               `${this.baseURL}/${reporteId}/descargar`,
               { responseType: 'blob' }
           );

           // Obtener información del reporte
           const infoReporte = await this.obtenerInfoReporte(reporteId);
           const formato = this.config.formatos[infoReporte.formato];
           const nombreArchivo = `${infoReporte.tipo}_${new Date().toISOString().split('T')[0]}.${formato.extension}`;

           // Crear URL temporal y descargar
           const url = window.URL.createObjectURL(new Blob([respuesta.data], { 
               type: formato.mimeType 
           }));
           const enlace = document.createElement('a');
           enlace.href = url;
           enlace.download = nombreArchivo;
           document.body.appendChild(enlace);
           enlace.click();
           document.body.removeChild(enlace);
           window.URL.revokeObjectURL(url);

           // Emitir evento de descarga completa
           this.emitirEvento('reporte:descargado', {
               reporteId,
               nombreArchivo,
               formato: infoReporte.formato
           });

           return {
               success: true,
               reporteId,
               nombreArchivo,
               tamaño: respuesta.data.size
           };

       } catch (error) {
           console.error('❌ Error descargando reporte:', error);
           throw error;
       }
   }

   /**
    * ℹ️ Obtener información del reporte
    */
   async obtenerInfoReporte(reporteId) {
       try {
           const respuesta = await this.clienteAPI.get(`${this.baseURL}/${reporteId}/info`);
           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo info del reporte:', error);
           throw error;
       }
   }

   // ==========================================
   // GESTIÓN DE REPORTES HISTORIAL
   // ==========================================

   /**
    * 📋 Obtener historial de reportes
    */
   async obtenerHistorialReportes(filtros = {}) {
       try {
           const parametros = this.construirParametrosFiltro(filtros);
           
           const respuesta = await this.clienteAPI.get(`${this.baseURL}/historial`, {
               params: parametros
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo historial de reportes:', error);
           throw error;
       }
   }

   /**
    * 🗑️ Eliminar reporte del historial
    */
   async eliminarReporte(reporteId) {
       try {
           const respuesta = await this.clienteAPI.delete(`${this.baseURL}/${reporteId}`);
           
           // Emitir evento
           this.emitirEvento('reporte:eliminado', { reporteId });
           
           return respuesta.data;
       } catch (error) {
           console.error('❌ Error eliminando reporte:', error);
           throw error;
       }
   }

   /**
    * 🔄 Regenerar reporte existente
    */
   async regenerarReporte(reporteId) {
       try {
           // Obtener configuración del reporte original
           const infoReporte = await this.obtenerInfoReporte(reporteId);
           
           // Generar nuevo reporte con la misma configuración
           return await this.generarReporte(
               infoReporte.tipo,
               infoReporte.parametros,
               infoReporte.formato
           );
       } catch (error) {
           console.error('❌ Error regenerando reporte:', error);
           throw error;
       }
   }

   // ==========================================
   // ESTADÍSTICAS RÁPIDAS
   // ==========================================

   /**
    * 📊 Obtener estadísticas rápidas del dashboard
    */
   async obtenerEstadisticasDashboard(cicloId = null) {
       try {
           // Verificar cache
           const cacheKey = `dashboard_${cicloId || 'all'}`;
           if (this.cache.estadisticas.has(cacheKey)) {
               const cached = this.cache.estadisticas.get(cacheKey);
               if (Date.now() - cached.timestamp < this.cache.ttl) {
                   return cached.data;
               }
           }

           const parametros = cicloId ? { ciclo_id: cicloId } : {};
           
           const respuesta = await this.clienteAPI.get(`${this.baseURL}/estadisticas/dashboard`, {
               params: parametros
           });

           // Guardar en cache
           this.cache.estadisticas.set(cacheKey, {
               data: respuesta.data,
               timestamp: Date.now()
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo estadísticas del dashboard:', error);
           throw error;
       }
   }

   /**
    * 📈 Obtener métricas de rendimiento
    */
   async obtenerMetricasRendimiento(periodo = '30d', cicloId = null) {
       try {
           const parametros = {
               periodo,
               ...(cicloId && { ciclo_id: cicloId })
           };
           
           const respuesta = await this.clienteAPI.get(`${this.baseURL}/metricas/rendimiento`, {
               params: parametros
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo métricas de rendimiento:', error);
           throw error;
       }
   }

   /**
    * 🎯 Obtener indicadores clave (KPIs)
    */
   async obtenerKPIs(cicloId = null) {
       try {
           const parametros = cicloId ? { ciclo_id: cicloId } : {};
           
           const respuesta = await this.clienteAPI.get(`${this.baseURL}/kpis`, {
               params: parametros
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo KPIs:', error);
           throw error;
       }
   }

   /**
    * 📊 Obtener datos para gráficos
    */
   async obtenerDatosGraficos(tipoGrafico, filtros = {}) {
       try {
           const parametros = {
               tipo: tipoGrafico,
               ...this.construirParametrosFiltro(filtros)
           };
           
           const respuesta = await this.clienteAPI.get(`${this.baseURL}/graficos/datos`, {
               params: parametros
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo datos para gráficos:', error);
           throw error;
       }
   }

   // ==========================================
   // PLANTILLAS DE REPORTES
   // ==========================================

   /**
    * 📄 Obtener plantillas disponibles
    */
   async obtenerPlantillas() {
       try {
           // Verificar cache
           if (this.cache.plantillas.has('todas')) {
               const cached = this.cache.plantillas.get('todas');
               if (Date.now() - cached.timestamp < this.cache.ttl) {
                   return cached.data;
               }
           }

           const respuesta = await this.clienteAPI.get(`${this.baseURL}/plantillas`);
           
           // Guardar en cache
           this.cache.plantillas.set('todas', {
               data: respuesta.data,
               timestamp: Date.now()
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo plantillas:', error);
           throw error;
       }
   }

   /**
    * 📝 Crear plantilla personalizada
    */
   async crearPlantilla(datosPlantilla) {
       try {
           const respuesta = await this.clienteAPI.post(`${this.baseURL}/plantillas`, {
               nombre: datosPlantilla.nombre,
               descripcion: datosPlantilla.descripcion,
               tipo_reporte: datosPlantilla.tipoReporte,
               configuracion: datosPlantilla.configuracion,
               es_publica: datosPlantilla.esPublica || false
           });

           // Limpiar cache de plantillas
           this.cache.plantillas.delete('todas');

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error creando plantilla:', error);
           throw error;
       }
   }

   /**
    * 📊 Generar reporte desde plantilla
    */
   async generarDesdeePlantilla(plantillaId, parametrosPersonalizados = {}) {
       try {
           const respuesta = await this.clienteAPI.post(
               `${this.baseURL}/plantillas/${plantillaId}/generar`,
               {
                   parametros_personalizados: parametrosPersonalizados
               }
           );

           const reporteId = respuesta.data.reporte_id;

           // Si es asíncrono, monitorear
           if (respuesta.data.asincrono) {
               return await this.monitorearGeneracion(reporteId);
           } else {
               return await this.descargarReporte(reporteId);
           }

       } catch (error) {
           console.error('❌ Error generando reporte desde plantilla:', error);
           throw error;
       }
   }

   // ==========================================
   // REPORTES PROGRAMADOS
   // ==========================================

   /**
    * ⏰ Crear reporte programado
    */
   async crearReporteProgramado(configuracion) {
       try {
           const respuesta = await this.clienteAPI.post(`${this.baseURL}/programados`, {
               nombre: configuracion.nombre,
               descripcion: configuracion.descripcion,
               tipo_reporte: configuracion.tipoReporte,
               formato: configuracion.formato,
               parametros: configuracion.parametros,
               cronograma: configuracion.cronograma, // Expresión cron
               destinatarios: configuracion.destinatarios,
               activo: configuracion.activo !== false
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error creando reporte programado:', error);
           throw error;
       }
   }

   /**
    * 📋 Obtener reportes programados
    */
   async obtenerReportesProgramados() {
       try {
           const respuesta = await this.clienteAPI.get(`${this.baseURL}/programados`);
           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo reportes programados:', error);
           throw error;
       }
   }

   /**
    * ✏️ Actualizar reporte programado
    */
   async actualizarReporteProgramado(reporteId, configuracion) {
       try {
           const respuesta = await this.clienteAPI.put(
               `${this.baseURL}/programados/${reporteId}`,
               configuracion
           );

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error actualizando reporte programado:', error);
           throw error;
       }
   }

   // ==========================================
   // MÉTODOS DE VALIDACIÓN
   // ==========================================

   /**
    * ✅ Validar parámetros de reporte
    */
   validarParametros(tipoReporte, parametros) {
       const errores = [];
       const tipoConfig = this.config.tipos[tipoReporte];
       
       if (!tipoConfig) {
           errores.push('Tipo de reporte no válido');
           return { valido: false, errores };
       }

       // Validar parámetros requeridos según el tipo
       switch (tipoReporte) {
           case 'docentes':
               if (!parametros.ciclo_id) {
                   errores.push('El ID del ciclo es requerido para reportes de docentes');
               }
               break;
               
           case 'verificacion':
               if (!parametros.ciclo_id) {
                   errores.push('El ID del ciclo es requerido para reportes de verificación');
               }
               if (parametros.fecha_inicio && parametros.fecha_fin) {
                   const inicio = new Date(parametros.fecha_inicio);
                   const fin = new Date(parametros.fecha_fin);
                   if (inicio >= fin) {
                       errores.push('La fecha de inicio debe ser anterior a la fecha de fin');
                   }
               }
               break;
               
           case 'ejecutivo':
               if (!parametros.ciclo_id) {
                   errores.push('El ID del ciclo es requerido para reportes ejecutivos');
               }
               break;
       }

       // Validar formato de fechas
       ['fecha_inicio', 'fecha_fin'].forEach(campo => {
           if (parametros[campo] && !this.validarFecha(parametros[campo])) {
               errores.push(`Formato de fecha inválido en ${campo}`);
           }
       });

       return {
           valido: errores.length === 0,
           errores
       };
   }

   /**
    * 📅 Validar formato de fecha
    */
   validarFecha(fecha) {
       const fechaObj = new Date(fecha);
       return fechaObj instanceof Date && !isNaN(fechaObj);
   }

   // ==========================================
   // MÉTODOS AUXILIARES
   // ==========================================

   /**
    * 🏷️ Obtener nombre del tipo de reporte
    */
   obtenerNombreTipo(tipo) {
       return this.config.tipos[tipo]?.nombre || tipo;
   }

   /**
    * 🎯 Obtener icono del tipo de reporte
    */
   obtenerIconoTipo(tipo) {
       return this.config.tipos[tipo]?.icono || 'fa-file';
   }

   /**
    * 🏷️ Obtener nombre del formato
    */
   obtenerNombreFormato(formato) {
       return this.config.formatos[formato]?.nombre || formato;
   }

   /**
    * 🎯 Obtener icono del formato
    */
   obtenerIconoFormato(formato) {
       return this.config.formatos[formato]?.icono || 'fa-file';
   }

   /**
    * 🏷️ Obtener etiqueta del estado
    */
   obtenerEtiquetaEstado(estado) {
       return this.config.estados[estado]?.etiqueta || estado;
   }

   /**
    * 🎨 Obtener clase CSS del estado
    */
   obtenerClaseEstado(estado) {
       const estadoConfig = this.config.estados[estado];
       return estadoConfig ? `badge badge-${estadoConfig.color}` : 'badge badge-secondary';
   }

   /**
    * 🔍 Construir parámetros de filtro
    */
   construirParametrosFiltro(filtros) {
       const parametros = {};

       if (filtros.tipo) parametros.tipo = filtros.tipo;
       if (filtros.formato) parametros.formato = filtros.formato;
       if (filtros.estado) parametros.estado = filtros.estado;
       if (filtros.cicloId) parametros.ciclo_id = filtros.cicloId;
       if (filtros.usuarioId) parametros.usuario_id = filtros.usuarioId;
       if (filtros.fechaInicio) parametros.fecha_inicio = filtros.fechaInicio;
       if (filtros.fechaFin) parametros.fecha_fin = filtros.fechaFin;
       if (filtros.limit) parametros.limit = filtros.limit;
       if (filtros.offset) parametros.offset = filtros.offset;
       if (filtros.ordenPor) parametros.orden_por = filtros.ordenPor;
       if (filtros.direccion) parametros.direccion = filtros.direccion;

       return parametros;
   }

   /**
    * 📡 Emitir evento global
    */
   emitirEvento(tipo, datos = {}) {
       if (window.aplicacion) {
           window.aplicacion.emitirEvento(`reportes:${tipo}`, datos);
       }
   }

   /**
    * 🧹 Limpiar cache
    */
   limpiarCache() {
       this.cache.reportes.clear();
       this.cache.estadisticas.clear();
       this.cache.plantillas.clear();
   }

   /**
    * 📊 Obtener información del cache
    */
   obtenerInfoCache() {
       return {
           reportes: this.cache.reportes.size,
           estadisticas: this.cache.estadisticas.size,
           plantillas: this.cache.plantillas.size,
           enProgreso: this.reportesEnProgreso.size,
           total: this.cache.reportes.size + this.cache.estadisticas.size + this.cache.plantillas.size
       };
   }

   /**
    * ❌ Cancelar reporte en progreso
    */
   async cancelarReporte(reporteId) {
       try {
           const respuesta = await this.clienteAPI.delete(`${this.baseURL}/${reporteId}/cancelar`);
           
           // Eliminar del tracking local
           this.reportesEnProgreso.delete(reporteId);
           
           // Emitir evento
           this.emitirEvento('reporte:cancelado', { reporteId });
           
           return respuesta.data;
       } catch (error) {
           console.error('❌ Error cancelando reporte:', error);
           throw error;
       }
   }

   /**
    * 📊 Obtener vista previa de datos
    */
   async obtenerVistaPrevia(tipoReporte, parametros, limite = 10) {
       try {
           const respuesta = await this.clienteAPI.post(`${this.baseURL}/vista-previa`, {
               tipo: tipoReporte,
               parametros,
               limite
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo vista previa:', error);
           throw error;
       }
   }

   /**
    * 📈 Calcular estimación de tiempo de generación
    */
   async estimarTiempoGeneracion(tipoReporte, parametros) {
       try {
           const respuesta = await this.clienteAPI.post(`${this.baseURL}/estimar-tiempo`, {
               tipo: tipoReporte,
               parametros
           });

           return respuesta.data.tiempo_estimado_segundos;
       } catch (error) {
           console.warn('⚠️ No se pudo estimar el tiempo de generación:', error);
           return null;
       }
   }
}

// ==========================================
// INICIALIZACIÓN GLOBAL
// ==========================================

// Crear instancia global del servicio
window.servicioReportes = new ServicioReportes();

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
   module.exports = ServicioReportes;
}