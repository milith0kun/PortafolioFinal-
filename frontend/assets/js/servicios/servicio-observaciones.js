/**
 * 💬 SERVICIO DE OBSERVACIONES
 * Sistema Portafolio Docente UNSAAC
 * 
 * Servicio especializado para gestión completa de observaciones
 * Comunicación entre verificadores y docentes, respuestas y seguimiento
 */

class ServicioObservaciones {
   constructor() {
       this.baseURL = '/api/v1/observaciones';
       this.clienteAPI = window.clienteAPI;
       
       // Cache para optimizar consultas
       this.cache = {
           observaciones: new Map(),
           conversaciones: new Map(),
           estadisticas: new Map(),
           ttl: 3 * 60 * 1000 // 3 minutos
       };

       // Configuración de observaciones
       this.config = {
           // Tipos de observación
           tipos: {
               'general': {
                   etiqueta: 'General',
                   descripcion: 'Observación general sobre el documento',
                   icono: 'fa-comment',
                   color: 'info'
               },
               'correccion': {
                   etiqueta: 'Corrección',
                   descripcion: 'Requiere corrección del documento',
                   icono: 'fa-edit',
                   color: 'warning'
               },
               'aprobacion': {
                   etiqueta: 'Aprobación',
                   descripcion: 'Documento aprobado con observaciones',
                   icono: 'fa-check-circle',
                   color: 'success'
               },
               'rechazo': {
                   etiqueta: 'Rechazo',
                   descripcion: 'Documento rechazado',
                   icono: 'fa-times-circle',
                   color: 'danger'
               }
           },

           // Prioridades
           prioridades: {
               'baja': {
                   etiqueta: 'Baja',
                   descripcion: 'No requiere atención inmediata',
                   color: 'success',
                   icono: 'fa-arrow-down'
               },
               'media': {
                   etiqueta: 'Media',
                   descripcion: 'Requiere atención moderada',
                   color: 'warning',
                   icono: 'fa-minus'
               },
               'alta': {
                   etiqueta: 'Alta',
                   descripcion: 'Requiere atención pronta',
                   color: 'danger',
                   icono: 'fa-arrow-up'
               },
               'critica': {
                   etiqueta: 'Crítica',
                   descripcion: 'Requiere atención inmediata',
                   color: 'danger',
                   icono: 'fa-exclamation-triangle'
               }
           },

           // Estados de observación
           estados: {
               'pendiente': {
                   etiqueta: 'Pendiente',
                   descripcion: 'Esperando respuesta del docente',
                   color: 'warning'
               },
               'respondida': {
                   etiqueta: 'Respondida',
                   descripcion: 'El docente ha respondido',
                   color: 'info'
               },
               'resuelta': {
                   etiqueta: 'Resuelta',
                   descripcion: 'Observación resuelta satisfactoriamente',
                   color: 'success'
               },
               'cerrada': {
                   etiqueta: 'Cerrada',
                   descripcion: 'Observación cerrada sin resolución',
                   color: 'secondary'
               }
           },

           // Límites
           maxCaracteres: 2000,
           maxArchivosAdjuntos: 5,
           tamañoMaximoArchivo: 10 * 1024 * 1024 // 10MB
       };

       // Estado de tiempo real
       this.tiempoReal = {
           activo: false,
           subscripciones: new Set(),
           ultimaActualizacion: null
       };
   }

   // ==========================================
   // MÉTODOS CRUD DE OBSERVACIONES
   // ==========================================

   /**
    * 📋 Obtener observaciones con filtros
    */
   async obtenerObservaciones(filtros = {}) {
       try {
           const parametros = this.construirParametrosFiltro(filtros);
           
           const respuesta = await this.clienteAPI.get(this.baseURL, {
               params: parametros
           });

           // Actualizar cache
           if (respuesta.data.observaciones) {
               respuesta.data.observaciones.forEach(observacion => {
                   this.cache.observaciones.set(observacion.id, {
                       data: observacion,
                       timestamp: Date.now()
                   });
               });
           }

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo observaciones:', error);
           throw error;
       }
   }

   /**
    * 📄 Obtener observación específica
    */
   async obtenerObservacion(observacionId) {
       try {
           // Verificar cache
           if (this.cache.observaciones.has(observacionId)) {
               const cached = this.cache.observaciones.get(observacionId);
               if (Date.now() - cached.timestamp < this.cache.ttl) {
                   return cached.data;
               }
           }

           const respuesta = await this.clienteAPI.get(`${this.baseURL}/${observacionId}`);
           
           // Guardar en cache
           this.cache.observaciones.set(observacionId, {
               data: respuesta.data,
               timestamp: Date.now()
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo observación:', error);
           throw error;
       }
   }

   /**
    * ➕ Crear nueva observación
    */
   async crearObservacion(datosObservacion) {
       try {
           // Validar datos antes de enviar
           const validacion = this.validarDatosObservacion(datosObservacion);
           if (!validacion.valido) {
               throw new Error(validacion.errores.join(', '));
           }

           const respuesta = await this.clienteAPI.post(this.baseURL, {
               archivo_id: datosObservacion.archivoId,
               tipo: datosObservacion.tipo || 'general',
               contenido: datosObservacion.contenido,
               es_publica: datosObservacion.esPublica !== false,
               requiere_respuesta: datosObservacion.requiereRespuesta || false,
               prioridad: datosObservacion.prioridad || 'media'
           });

           // Limpiar cache relacionado
           this.limpiarCacheRelacionado(datosObservacion.archivoId);

           // Emitir evento
           this.emitirEvento('observacion:creada', {
               observacion: respuesta.data
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error creando observación:', error);
           throw error;
       }
   }

   /**
    * ✏️ Actualizar observación
    */
   async actualizarObservacion(observacionId, datosActualizacion) {
       try {
           const respuesta = await this.clienteAPI.put(
               `${this.baseURL}/${observacionId}`,
               datosActualizacion
           );

           // Limpiar cache específico
           this.cache.observaciones.delete(observacionId);

           // Emitir evento
           this.emitirEvento('observacion:actualizada', {
               observacionId,
               observacion: respuesta.data
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error actualizando observación:', error);
           throw error;
       }
   }

   /**
    * 🗑️ Eliminar observación
    */
   async eliminarObservacion(observacionId, motivo = '') {
       try {
           const respuesta = await this.clienteAPI.delete(`${this.baseURL}/${observacionId}`, {
               data: { motivo }
           });

           // Limpiar cache
           this.cache.observaciones.delete(observacionId);

           // Emitir evento
           this.emitirEvento('observacion:eliminada', {
               observacionId
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error eliminando observación:', error);
           throw error;
       }
   }

   // ==========================================
   // GESTIÓN DE RESPUESTAS
   // ==========================================

   /**
    * 💬 Crear respuesta a observación
    */
   async crearRespuesta(observacionId, contenidoRespuesta, esSolucion = false) {
       try {
           // Validar contenido
           if (!contenidoRespuesta || contenidoRespuesta.trim().length === 0) {
               throw new Error('El contenido de la respuesta es requerido');
           }

           if (contenidoRespuesta.length > this.config.maxCaracteres) {
               throw new Error(`La respuesta no puede exceder ${this.config.maxCaracteres} caracteres`);
           }

           const respuesta = await this.clienteAPI.post(
               `${this.baseURL}/${observacionId}/respuestas`,
               {
                   contenido: contenidoRespuesta,
                   es_solucion: esSolucion
               }
           );

           // Limpiar cache de la observación
           this.cache.observaciones.delete(observacionId);

           // Emitir evento
           this.emitirEvento('respuesta:creada', {
               observacionId,
               respuesta: respuesta.data
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error creando respuesta:', error);
           throw error;
       }
   }

   /**
    * 📋 Obtener respuestas de una observación
    */
   async obtenerRespuestas(observacionId) {
       try {
           const respuesta = await this.clienteAPI.get(
               `${this.baseURL}/${observacionId}/respuestas`
           );

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo respuestas:', error);
           throw error;
       }
   }

   /**
    * ✅ Marcar respuesta como solución
    */
   async marcarComoSolucion(observacionId, respuestaId) {
       try {
           const respuesta = await this.clienteAPI.put(
               `${this.baseURL}/${observacionId}/respuestas/${respuestaId}/marcar-solucion`
           );

           // Limpiar cache
           this.cache.observaciones.delete(observacionId);

           // Emitir evento
           this.emitirEvento('respuesta:marcadaSolucion', {
               observacionId,
               respuestaId
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error marcando como solución:', error);
           throw error;
       }
   }

   // ==========================================
   // GESTIÓN DE ESTADO DE OBSERVACIONES
   // ==========================================

   /**
    * ✅ Resolver observación
    */
   async resolverObservacion(observacionId, comentarioResolucion = '') {
       try {
           const respuesta = await this.clienteAPI.put(
               `${this.baseURL}/${observacionId}/resolver`,
               {
                   comentario: comentarioResolucion
               }
           );

           // Limpiar cache
           this.cache.observaciones.delete(observacionId);

           // Emitir evento
           this.emitirEvento('observacion:resuelta', {
               observacionId,
               comentario: comentarioResolucion
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error resolviendo observación:', error);
           throw error;
       }
   }

   /**
    * 🔒 Cerrar observación
    */
   async cerrarObservacion(observacionId, motivoCierre) {
       try {
           if (!motivoCierre || motivoCierre.trim().length === 0) {
               throw new Error('El motivo de cierre es requerido');
           }

           const respuesta = await this.clienteAPI.put(
               `${this.baseURL}/${observacionId}/cerrar`,
               {
                   motivo: motivoCierre
               }
           );

           // Limpiar cache
           this.cache.observaciones.delete(observacionId);

           // Emitir evento
           this.emitirEvento('observacion:cerrada', {
               observacionId,
               motivo: motivoCierre
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error cerrando observación:', error);
           throw error;
       }
   }

   /**
    * 🔄 Reabrir observación
    */
   async reabrirObservacion(observacionId, motivoReapertura) {
       try {
           const respuesta = await this.clienteAPI.put(
               `${this.baseURL}/${observacionId}/reabrir`,
               {
                   motivo: motivoReapertura
               }
           );

           // Limpiar cache
           this.cache.observaciones.delete(observacionId);

           // Emitir evento
           this.emitirEvento('observacion:reabierta', {
               observacionId,
               motivo: motivoReapertura
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error reabriendo observación:', error);
           throw error;
       }
   }

   // ==========================================
   // CONSULTAS ESPECIALIZADAS
   // ==========================================

   /**
    * 📋 Obtener observaciones por archivo
    */
   async obtenerObservacionesPorArchivo(archivoId) {
       try {
           const respuesta = await this.clienteAPI.get(
               `${this.baseURL}/archivo/${archivoId}`
           );

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo observaciones por archivo:', error);
           throw error;
       }
   }

   /**
    * 👨‍🏫 Obtener observaciones del docente
    */
   async obtenerObservacionesDocente(docenteId, filtros = {}) {
       try {
           const parametros = this.construirParametrosFiltro(filtros);
           
           const respuesta = await this.clienteAPI.get(
               `${this.baseURL}/docente/${docenteId}`,
               { params: parametros }
           );

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo observaciones del docente:', error);
           throw error;
       }
   }

   /**
    * 🔍 Obtener observaciones del verificador
    */
   async obtenerObservacionesVerificador(verificadorId, filtros = {}) {
       try {
           const parametros = this.construirParametrosFiltro(filtros);
           
           const respuesta = await this.clienteAPI.get(
               `${this.baseURL}/verificador/${verificadorId}`,
               { params: parametros }
           );

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo observaciones del verificador:', error);
           throw error;
       }
   }

   /**
    * 💬 Obtener conversación completa
    */
   async obtenerConversacion(observacionId) {
       try {
           // Verificar cache
           const cacheKey = `conversacion_${observacionId}`;
           if (this.cache.conversaciones.has(cacheKey)) {
               const cached = this.cache.conversaciones.get(cacheKey);
               if (Date.now() - cached.timestamp < this.cache.ttl) {
                   return cached.data;
               }
           }

           const respuesta = await this.clienteAPI.get(
               `${this.baseURL}/${observacionId}/conversacion`
           );

           // Guardar en cache
           this.cache.conversaciones.set(cacheKey, {
               data: respuesta.data,
               timestamp: Date.now()
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo conversación:', error);
           throw error;
       }
   }

   // ==========================================
   // BÚSQUEDA Y FILTRADO
   // ==========================================

   /**
    * 🔍 Buscar observaciones
    */
   async buscarObservaciones(termino, filtros = {}) {
       try {
           const parametros = {
               q: termino,
               ...this.construirParametrosFiltro(filtros)
           };

           const respuesta = await this.clienteAPI.get(`${this.baseURL}/buscar`, {
               params: parametros
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error buscando observaciones:', error);
           throw error;
       }
   }

   /**
    * 📊 Obtener estadísticas de observaciones
    */
   async obtenerEstadisticas(filtros = {}) {
       try {
           // Verificar cache
           const cacheKey = `estadisticas_${JSON.stringify(filtros)}`;
           if (this.cache.estadisticas.has(cacheKey)) {
               const cached = this.cache.estadisticas.get(cacheKey);
               if (Date.now() - cached.timestamp < this.cache.ttl) {
                   return cached.data;
               }
           }

           const respuesta = await this.clienteAPI.get(`${this.baseURL}/estadisticas`, {
               params: filtros
           });

           // Guardar en cache
           this.cache.estadisticas.set(cacheKey, {
               data: respuesta.data,
               timestamp: Date.now()
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo estadísticas:', error);
           throw error;
       }
   }

   /**
    * 📈 Obtener métricas de rendimiento
    */
   async obtenerMetricas(periodo = '30d') {
       try {
           const respuesta = await this.clienteAPI.get(`${this.baseURL}/metricas`, {
               params: { periodo }
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo métricas:', error);
           throw error;
       }
   }

   // ==========================================
   // GESTIÓN DE ARCHIVOS ADJUNTOS
   // ==========================================

   /**
    * 📎 Subir archivo adjunto a observación
    */
   async subirAdjunto(observacionId, archivo) {
       try {
           // Validar archivo
           const validacion = this.validarArchivo(archivo);
           if (!validacion.valido) {
               throw new Error(validacion.mensaje);
           }

           const formData = new FormData();
           formData.append('archivo', archivo);

           const respuesta = await this.clienteAPI.post(
               `${this.baseURL}/${observacionId}/adjuntos`,
               formData,
               {
                   headers: {
                       'Content-Type': 'multipart/form-data'
                   }
               }
           );

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error subiendo adjunto:', error);
           throw error;
       }
   }

   /**
    * 🗑️ Eliminar archivo adjunto
    */
   async eliminarAdjunto(observacionId, adjuntoId) {
       try {
           const respuesta = await this.clienteAPI.delete(
               `${this.baseURL}/${observacionId}/adjuntos/${adjuntoId}`
           );

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error eliminando adjunto:', error);
           throw error;
       }
   }

   // ==========================================
   // MÉTODOS DE VALIDACIÓN
   // ==========================================

   /**
    * ✅ Validar datos de observación
    */
   validarDatosObservacion(datos) {
       const errores = [];

       // Validar campos requeridos
       if (!datos.archivoId) {
           errores.push('El ID del archivo es requerido');
       }

       if (!datos.contenido || datos.contenido.trim().length === 0) {
           errores.push('El contenido de la observación es requerido');
       }

       // Validar longitud del contenido
       if (datos.contenido && datos.contenido.length > this.config.maxCaracteres) {
           errores.push(`El contenido no puede exceder ${this.config.maxCaracteres} caracteres`);
       }

       // Validar tipo
       if (datos.tipo && !this.config.tipos[datos.tipo]) {
           errores.push('Tipo de observación no válido');
       }

       // Validar prioridad
       if (datos.prioridad && !this.config.prioridades[datos.prioridad]) {
           errores.push('Prioridad no válida');
       }

       return {
           valido: errores.length === 0,
           errores
       };
   }

   /**
    * ✅ Validar archivo adjunto
    */
   validarArchivo(archivo) {
       if (!archivo) {
           return { valido: false, mensaje: 'No se ha seleccionado ningún archivo' };
       }

       // Validar tamaño
       if (archivo.size > this.config.tamañoMaximoArchivo) {
           return { 
               valido: false, 
               mensaje: `El archivo es demasiado grande. Tamaño máximo: ${Utilidades.formatearBytes(this.config.tamañoMaximoArchivo)}`
           };
       }

       // Validar tipo (permitir imágenes y PDFs principalmente)
       const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
       if (!tiposPermitidos.includes(archivo.type)) {
           return { 
               valido: false, 
               mensaje: 'Tipo de archivo no permitido. Formatos permitidos: JPG, PNG, GIF, PDF, TXT'
           };
       }

       return { valido: true, mensaje: 'Archivo válido' };
   }

   // ==========================================
   // MÉTODOS AUXILIARES
   // ==========================================

   /**
    * 🏷️ Obtener etiqueta de tipo
    */
   obtenerEtiquetaTipo(tipo) {
       return this.config.tipos[tipo]?.etiqueta || tipo;
   }

   /**
    * 🎨 Obtener clase CSS de tipo
    */
   obtenerClaseTipo(tipo) {
       const tipoConfig = this.config.tipos[tipo];
       return tipoConfig ? `badge badge-${tipoConfig.color}` : 'badge badge-secondary';
   }

   /**
    * 🎯 Obtener icono de tipo
    */
   obtenerIconoTipo(tipo) {
       return this.config.tipos[tipo]?.icono || 'fa-comment';
   }

   /**
    * 🏷️ Obtener etiqueta de prioridad
    */
   obtenerEtiquetaPrioridad(prioridad) {
       return this.config.prioridades[prioridad]?.etiqueta || prioridad;
   }

   /**
    * 🎨 Obtener clase CSS de prioridad
    */
   obtenerClasePrioridad(prioridad) {
       const prioridadConfig = this.config.prioridades[prioridad];
       return prioridadConfig ? `badge badge-${prioridadConfig.color}` : 'badge badge-secondary';
   }

   /**
    * 🏷️ Obtener etiqueta de estado
    */
   obtenerEtiquetaEstado(estado) {
       return this.config.estados[estado]?.etiqueta || estado;
   }

   /**
    * 🎨 Obtener clase CSS de estado
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
       if (filtros.prioridad) parametros.prioridad = filtros.prioridad;
       if (filtros.estado) parametros.estado = filtros.estado;
       if (filtros.archivoId) parametros.archivo_id = filtros.archivoId;
       if (filtros.docenteId) parametros.docente_id = filtros.docenteId;
       if (filtros.verificadorId) parametros.verificador_id = filtros.verificadorId;
       if (filtros.requiereRespuesta !== undefined) parametros.requiere_respuesta = filtros.requiereRespuesta;
       if (filtros.respondida !== undefined) parametros.respondida = filtros.respondida;
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
           window.aplicacion.emitirEvento(`observaciones:${tipo}`, datos);
       }
   }

   /**
    * 🧹 Limpiar cache relacionado
    */
   limpiarCacheRelacionado(archivoId) {
       // Limpiar observaciones relacionadas con el archivo
       for (const [key, cached] of this.cache.observaciones) {
           if (cached.data.archivo_id === archivoId) {
               this.cache.observaciones.delete(key);
           }
       }

       // Limpiar conversaciones relacionadas
       this.cache.conversaciones.clear();
       
       // Limpiar estadísticas
       this.cache.estadisticas.clear();
   }

   /**
    * 🧹 Limpiar cache completo
    */
   limpiarCache() {
       this.cache.observaciones.clear();
       this.cache.conversaciones.clear();
       this.cache.estadisticas.clear();
   }

   /**
    * 📊 Obtener información del cache
    */
   obtenerInfoCache() {
       return {
           observaciones: this.cache.observaciones.size,
           conversaciones: this.cache.conversaciones.size,
           estadisticas: this.cache.estadisticas.size,
           total: this.cache.observaciones.size + this.cache.conversaciones.size + this.cache.estadisticas.size
       };
   }

   /**
    * 📈 Calcular métricas locales
    */
   calcularMetricasLocales(observaciones) {
       if (!Array.isArray(observaciones)) return null;

       const metricas = {
           total: observaciones.length,
           porTipo: {},
           porPrioridad: {},
           porEstado: {},
           tiempoPromedioRespuesta: 0,
           tasaResolucion: 0
       };

       let tiempoTotalRespuesta = 0;
       let observacionesRespondidas = 0;
       let observacionesResueltas = 0;

       observaciones.forEach(obs => {
           // Contar por tipo
           metricas.porTipo[obs.tipo] = (metricas.porTipo[obs.tipo] || 0) + 1;
           
           // Contar por prioridad
           metricas.porPrioridad[obs.prioridad] = (metricas.porPrioridad[obs.prioridad] || 0) + 1;
           
           // Contar por estado
           metricas.porEstado[obs.estado] = (metricas.porEstado[obs.estado] || 0) + 1;

           // Calcular métricas de tiempo
           if (obs.respondida) {
               observacionesRespondidas++;
               if (obs.fecha_respuesta && obs.creado_en) {
                   const tiempoRespuesta = new Date(obs.fecha_respuesta) - new Date(obs.creado_en);
                   tiempoTotalRespuesta += tiempoRespuesta;
               }
           }

           if (obs.estado === 'resuelta') {
               observacionesResueltas++;
           }
       });

       // Calcular promedios
       if (observacionesRespondidas > 0) {
           metricas.tiempoPromedioRespuesta = Math.round(tiempoTotalRespuesta / observacionesRespondidas / (1000 * 60 * 60)); // En horas
       }

       if (metricas.total > 0) {
           metricas.tasaResolucion = Math.round((observacionesResueltas / metricas.total) * 100);
       }

       return metricas;
   }
}

// ==========================================
// INICIALIZACIÓN GLOBAL
// ==========================================

// Crear instancia global del servicio
window.servicioObservaciones = new ServicioObservaciones();

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
   module.exports = ServicioObservaciones;
}