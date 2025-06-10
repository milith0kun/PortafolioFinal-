/**
 * 📄 SERVICIO DE DOCUMENTOS
 * Sistema Portafolio Docente UNSAAC
 * 
 * Servicio especializado para gestión completa de documentos
 * Subida, versionado, validación, búsqueda y gestión de archivos
 */

class ServicioDocumentos {
   constructor() {
       this.baseURL = '/api/v1/documentos';
       this.clienteAPI = window.clienteAPI;
       
       // Configuración de documentos
       this.config = {
           // Tipos de archivo permitidos
           tiposPermitidos: {
               'pdf': 'application/pdf',
               'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
               'doc': 'application/msword',
               'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
               'xls': 'application/vnd.ms-excel',
               'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
               'ppt': 'application/vnd.ms-powerpoint',
               'txt': 'text/plain',
               'jpg': 'image/jpeg',
               'jpeg': 'image/jpeg',
               'png': 'image/png',
               'gif': 'image/gif'
           },
           
           // Tamaños máximos por tipo (en bytes)
           tamañosMaximos: {
               'pdf': 50 * 1024 * 1024,    // 50MB
               'docx': 25 * 1024 * 1024,   // 25MB
               'doc': 25 * 1024 * 1024,    // 25MB
               'xlsx': 15 * 1024 * 1024,   // 15MB
               'xls': 15 * 1024 * 1024,    // 15MB
               'pptx': 100 * 1024 * 1024,  // 100MB
               'ppt': 100 * 1024 * 1024,   // 100MB
               'txt': 1 * 1024 * 1024,     // 1MB
               'jpg': 10 * 1024 * 1024,    // 10MB
               'jpeg': 10 * 1024 * 1024,   // 10MB
               'png': 10 * 1024 * 1024,    // 10MB
               'gif': 5 * 1024 * 1024      // 5MB
           },

           // Estados de documentos
           estados: {
               'pendiente': 'Pendiente de revisión',
               'en_revision': 'En proceso de revisión',
               'aprobado': 'Aprobado',
               'rechazado': 'Rechazado',
               'requiere_correccion': 'Requiere corrección'
           },

           // Chunk size para subidas grandes
           chunkSize: 1024 * 1024, // 1MB chunks
           maxReintentos: 3
       };

       // Cache para metadatos y previsualizaciones
       this.cache = {
           metadatos: new Map(),
           previsualizaciones: new Map(),
           ttl: 5 * 60 * 1000 // 5 minutos
       };
   }

   // ==========================================
   // MÉTODOS DE SUBIDA DE DOCUMENTOS
   // ==========================================

   /**
    * 📤 Subir documento con progreso
    */
   async subirDocumento(archivo, configuracion = {}) {
       try {
           // Validar archivo
           const validacion = this.validarArchivo(archivo);
           if (!validacion.valido) {
               throw new Error(validacion.mensaje);
           }

           // Preparar datos para subida
           const datosSubida = {
               portafolio_id: configuracion.portafolioId,
               tipo_documento: configuracion.tipoDocumento || this.detectarTipoDocumento(archivo),
               descripcion: configuracion.descripcion || '',
               es_obligatorio: configuracion.esObligatorio || false,
               categoria: configuracion.categoria || 'general',
               tags: configuracion.tags || []
           };

           // Determinar método de subida según tamaño
           if (archivo.size > this.config.chunkSize * 5) {
               return await this.subirArchivoEnChunks(archivo, datosSubida, configuracion.onProgress);
           } else {
               return await this.subirArchivoDirecto(archivo, datosSubida, configuracion.onProgress);
           }

       } catch (error) {
           console.error('❌ Error subiendo documento:', error);
           throw error;
       }
   }

   /**
    * 📤 Subida directa para archivos pequeños
    */
   async subirArchivoDirecto(archivo, datos, onProgress) {
       const formData = new FormData();
       
       // Agregar archivo
       formData.append('archivo', archivo);
       
       // Agregar metadatos
       Object.keys(datos).forEach(key => {
           if (datos[key] !== undefined && datos[key] !== null) {
               formData.append(key, typeof datos[key] === 'object' ? 
                   JSON.stringify(datos[key]) : datos[key]);
           }
       });

       const respuesta = await this.clienteAPI.post(`${this.baseURL}/subir`, formData, {
           headers: {
               'Content-Type': 'multipart/form-data'
           },
           onUploadProgress: (progressEvent) => {
               if (onProgress) {
                   const porcentaje = Math.round(
                       (progressEvent.loaded * 100) / progressEvent.total
                   );
                   onProgress(porcentaje, progressEvent.loaded, progressEvent.total);
               }
           }
       });

       return respuesta.data;
   }

   /**
    * 📤 Subida en chunks para archivos grandes
    */
   async subirArchivoEnChunks(archivo, datos, onProgress) {
       const totalChunks = Math.ceil(archivo.size / this.config.chunkSize);
       const sessionId = this.generarSessionId();
       let bytesSubidos = 0;

       try {
           // Inicializar sesión de subida
           await this.clienteAPI.post(`${this.baseURL}/iniciar-sesion`, {
               session_id: sessionId,
               nombre_archivo: archivo.name,
               tamaño_archivo: archivo.size,
               total_chunks: totalChunks,
               metadatos: datos
           });

           // Subir chunks
           for (let i = 0; i < totalChunks; i++) {
               const inicio = i * this.config.chunkSize;
               const fin = Math.min(inicio + this.config.chunkSize, archivo.size);
               const chunk = archivo.slice(inicio, fin);

               const formData = new FormData();
               formData.append('chunk', chunk);
               formData.append('session_id', sessionId);
               formData.append('chunk_index', i);
               formData.append('total_chunks', totalChunks);

               let reintentos = 0;
               let chunkSubido = false;

               while (!chunkSubido && reintentos < this.config.maxReintentos) {
                   try {
                       await this.clienteAPI.post(`${this.baseURL}/subir-chunk`, formData);
                       chunkSubido = true;
                       bytesSubidos += chunk.size;

                       // Reportar progreso
                       if (onProgress) {
                           const porcentaje = Math.round((bytesSubidos * 100) / archivo.size);
                           onProgress(porcentaje, bytesSubidos, archivo.size);
                       }

                   } catch (error) {
                       reintentos++;
                       if (reintentos >= this.config.maxReintentos) {
                           throw error;
                       }
                       // Esperar antes del reintento
                       await this.esperar(1000 * reintentos);
                   }
               }
           }

           // Finalizar subida
           const respuesta = await this.clienteAPI.post(`${this.baseURL}/finalizar-sesion`, {
               session_id: sessionId
           });

           return respuesta.data;

       } catch (error) {
           // Cancelar sesión en caso de error
           await this.cancelarSesionSubida(sessionId);
           throw error;
       }
   }

   /**
    * 📤 Subir múltiples documentos
    */
   async subirMultiplesDocumentos(archivos, configuracionGlobal = {}) {
       const resultados = [];
       const total = archivos.length;
       
       for (let i = 0; i < archivos.length; i++) {
           const archivo = archivos[i];
           
           try {
               const configuracionArchivo = {
                   ...configuracionGlobal,
                   onProgress: (porcentaje, cargado, total) => {
                       // Calcular progreso global
                       const progresoGlobal = Math.round(
                           ((i * 100) + porcentaje) / archivos.length
                       );
                       
                       if (configuracionGlobal.onProgressGlobal) {
                           configuracionGlobal.onProgressGlobal(
                               progresoGlobal, 
                               i + 1, 
                               archivos.length,
                               archivo.name
                           );
                       }
                   }
               };

               const resultado = await this.subirDocumento(archivo, configuracionArchivo);
               resultados.push({
                   archivo: archivo.name,
                   exito: true,
                   resultado
               });

           } catch (error) {
               console.error(`❌ Error subiendo ${archivo.name}:`, error);
               resultados.push({
                   archivo: archivo.name,
                   exito: false,
                   error: error.message
               });
           }
       }

       return resultados;
   }

   // ==========================================
   // MÉTODOS DE GESTIÓN DE DOCUMENTOS
   // ==========================================

   /**
    * 📋 Obtener documentos con filtros
    */
   async obtenerDocumentos(filtros = {}) {
       try {
           const parametros = this.construirParametrosFiltro(filtros);
           
           const respuesta = await this.clienteAPI.get(`${this.baseURL}`, {
               params: parametros
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo documentos:', error);
           throw error;
       }
   }

   /**
    * 📄 Obtener documento específico
    */
   async obtenerDocumento(documentoId) {
       try {
           // Verificar cache
           const cacheKey = `documento_${documentoId}`;
           if (this.cache.metadatos.has(cacheKey)) {
               const cached = this.cache.metadatos.get(cacheKey);
               if (Date.now() - cached.timestamp < this.cache.ttl) {
                   return cached.data;
               }
           }

           const respuesta = await this.clienteAPI.get(`${this.baseURL}/${documentoId}`);
           
           // Guardar en cache
           this.cache.metadatos.set(cacheKey, {
               data: respuesta.data,
               timestamp: Date.now()
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo documento:', error);
           throw error;
       }
   }

   /**
    * ✏️ Actualizar metadatos de documento
    */
   async actualizarDocumento(documentoId, datosActualizacion) {
       try {
           const respuesta = await this.clienteAPI.put(
               `${this.baseURL}/${documentoId}`, 
               datosActualizacion
           );

           // Limpiar cache
           this.limpiarCacheDocumento(documentoId);

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error actualizando documento:', error);
           throw error;
       }
   }

   /**
    * 🗑️ Eliminar documento
    */
   async eliminarDocumento(documentoId, motivo = '') {
       try {
           const respuesta = await this.clienteAPI.delete(`${this.baseURL}/${documentoId}`, {
               data: { motivo }
           });

           // Limpiar cache
           this.limpiarCacheDocumento(documentoId);

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error eliminando documento:', error);
           throw error;
       }
   }

   // ==========================================
   // MÉTODOS DE DESCARGA Y VISUALIZACIÓN
   // ==========================================

   /**
    * 📥 Descargar documento
    */
   async descargarDocumento(documentoId, nombreArchivo) {
       try {
           const respuesta = await this.clienteAPI.get(
               `${this.baseURL}/${documentoId}/descargar`,
               { responseType: 'blob' }
           );

           // Crear URL temporal y descargar
           const url = window.URL.createObjectURL(new Blob([respuesta.data]));
           const enlace = document.createElement('a');
           enlace.href = url;
           enlace.download = nombreArchivo || `documento_${documentoId}`;
           document.body.appendChild(enlace);
           enlace.click();
           document.body.removeChild(enlace);
           window.URL.revokeObjectURL(url);

           return true;
       } catch (error) {
           console.error('❌ Error descargando documento:', error);
           throw error;
       }
   }

   /**
    * 👁️ Obtener URL de previsualización
    */
   async obtenerURLPreview(documentoId) {
       try {
           const respuesta = await this.clienteAPI.get(
               `${this.baseURL}/${documentoId}/preview`
           );

           return respuesta.data.url;
       } catch (error) {
           console.error('❌ Error obteniendo preview:', error);
           throw error;
       }
   }

   /**
    * 🖼️ Generar thumbnail
    */
   async generarThumbnail(documentoId) {
       try {
           const respuesta = await this.clienteAPI.post(
               `${this.baseURL}/${documentoId}/thumbnail`
           );

           return respuesta.data.thumbnail_url;
       } catch (error) {
           console.error('❌ Error generando thumbnail:', error);
           throw error;
       }
   }

   // ==========================================
   // MÉTODOS DE VERSIONADO
   // ==========================================

   /**
    * 🔄 Subir nueva versión
    */
   async subirNuevaVersion(documentoId, archivo, comentario = '') {
       try {
           const formData = new FormData();
           formData.append('archivo', archivo);
           formData.append('comentario', comentario);

           const respuesta = await this.clienteAPI.post(
               `${this.baseURL}/${documentoId}/nueva-version`,
               formData,
               {
                   headers: {
                       'Content-Type': 'multipart/form-data'
                   }
               }
           );

           // Limpiar cache
           this.limpiarCacheDocumento(documentoId);

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error subiendo nueva versión:', error);
           throw error;
       }
   }

   /**
    * 📚 Obtener historial de versiones
    */
   async obtenerVersiones(documentoId) {
       try {
           const respuesta = await this.clienteAPI.get(
               `${this.baseURL}/${documentoId}/versiones`
           );

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo versiones:', error);
           throw error;
       }
   }

   /**
    * ↩️ Revertir a versión anterior
    */
   async revertirVersion(documentoId, versionId, comentario = '') {
       try {
           const respuesta = await this.clienteAPI.post(
               `${this.baseURL}/${documentoId}/revertir`,
               {
                   version_id: versionId,
                   comentario
               }
           );

           // Limpiar cache
           this.limpiarCacheDocumento(documentoId);

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error revirtiendo versión:', error);
           throw error;
       }
   }

   // ==========================================
   // MÉTODOS DE BÚSQUEDA Y FILTRADO
   // ==========================================

   /**
    * 🔍 Buscar documentos
    */
   async buscarDocumentos(termino, filtros = {}) {
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
           console.error('❌ Error buscando documentos:', error);
           throw error;
       }
   }

   /**
    * 🏷️ Obtener documentos por etiquetas
    */
   async obtenerPorEtiquetas(etiquetas) {
       try {
           const respuesta = await this.clienteAPI.get(`${this.baseURL}/por-etiquetas`, {
               params: {
                   tags: Array.isArray(etiquetas) ? etiquetas.join(',') : etiquetas
               }
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo documentos por etiquetas:', error);
           throw error;
       }
   }

   /**
    * 📊 Obtener estadísticas de documentos
    */
   async obtenerEstadisticas(filtros = {}) {
       try {
           const respuesta = await this.clienteAPI.get(`${this.baseURL}/estadisticas`, {
               params: filtros
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo estadísticas:', error);
           throw error;
       }
   }

   // ==========================================
   // MÉTODOS DE VALIDACIÓN
   // ==========================================

   /**
    * ✅ Validar archivo antes de subir
    */
   validarArchivo(archivo) {
       // Verificar que existe el archivo
       if (!archivo) {
           return { valido: false, mensaje: 'No se ha seleccionado ningún archivo' };
       }

       // Obtener extensión
       const extension = this.obtenerExtension(archivo.name).toLowerCase();
       
       // Verificar tipo permitido
       if (!this.config.tiposPermitidos[extension]) {
           return { 
               valido: false, 
               mensaje: `Tipo de archivo no permitido: ${extension}. Tipos permitidos: ${Object.keys(this.config.tiposPermitidos).join(', ')}`
           };
       }

       // Verificar tamaño
       const tamañoMaximo = this.config.tamañosMaximos[extension];
       if (archivo.size > tamañoMaximo) {
           return { 
               valido: false, 
               mensaje: `El archivo es demasiado grande. Tamaño máximo para ${extension}: ${Utilidades.formatearBytes(tamañoMaximo)}`
           };
       }

       // Verificar tipo MIME
       const tipoMimeEsperado = this.config.tiposPermitidos[extension];
       if (archivo.type && archivo.type !== tipoMimeEsperado) {
           console.warn(`⚠️ Tipo MIME no coincide. Esperado: ${tipoMimeEsperado}, Recibido: ${archivo.type}`);
       }

       return { valido: true, mensaje: 'Archivo válido' };
   }

   /**
    * 🔍 Detectar tipo de documento
    */
   detectarTipoDocumento(archivo) {
       const extension = this.obtenerExtension(archivo.name).toLowerCase();
       const nombre = archivo.name.toLowerCase();

       // Detectar basado en nombre del archivo
       if (nombre.includes('silabo') || nombre.includes('sílabo')) {
           return 'silabo';
       } else if (nombre.includes('cv') || nombre.includes('curriculum')) {
           return 'curriculum';
       } else if (nombre.includes('sesion') || nombre.includes('clase')) {
           return 'sesion_aprendizaje';
       } else if (nombre.includes('evaluacion') || nombre.includes('examen')) {
           return 'evaluacion';
       } else if (nombre.includes('practica') || nombre.includes('laboratorio')) {
           return 'practica';
       }

       // Detectar basado en extensión
       switch (extension) {
           case 'pdf':
               return 'documento_pdf';
           case 'docx':
           case 'doc':
               return 'documento_word';
           case 'xlsx':
           case 'xls':
               return 'hoja_calculo';
           case 'pptx':
           case 'ppt':
               return 'presentacion';
           case 'jpg':
           case 'jpeg':
           case 'png':
           case 'gif':
               return 'imagen';
           default:
               return 'otro';
       }
   }

   // ==========================================
   // MÉTODOS AUXILIARES
   // ==========================================

   obtenerExtension(nombreArchivo) {
       return nombreArchivo.split('.').pop() || '';
   }

   generarSessionId() {
       return 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
   }

   async cancelarSesionSubida(sessionId) {
       try {
           await this.clienteAPI.delete(`${this.baseURL}/cancelar-sesion/${sessionId}`);
       } catch (error) {
           console.error('❌ Error cancelando sesión:', error);
       }
   }

   async esperar(ms) {
       return new Promise(resolve => setTimeout(resolve, ms));
   }

   construirParametrosFiltro(filtros) {
       const parametros = {};
       
       if (filtros.portafolioId) parametros.portafolio_id = filtros.portafolioId;
       if (filtros.estado) parametros.estado = filtros.estado;
       if (filtros.tipo) parametros.tipo = filtros.tipo;
       if (filtros.fechaInicio) parametros.fecha_inicio = filtros.fechaInicio;
       if (filtros.fechaFin) parametros.fecha_fin = filtros.fechaFin;
       if (filtros.docenteId) parametros.docente_id = filtros.docenteId;
       if (filtros.verificadorId) parametros.verificador_id = filtros.verificadorId;
       if (filtros.limit) parametros.limit = filtros.limit;
       if (filtros.offset) parametros.offset = filtros.offset;
       if (filtros.ordenPor) parametros.orden_por = filtros.ordenPor;
       if (filtros.direccion) parametros.direccion = filtros.direccion;

       return parametros;
   }

   limpiarCacheDocumento(documentoId) {
       const cacheKey = `documento_${documentoId}`;
       this.cache.metadatos.delete(cacheKey);
       
       // Limpiar también previsualizaciones relacionadas
       for (const [key, value] of this.cache.previsualizaciones) {
           if (key.includes(documentoId)) {
               this.cache.previsualizaciones.delete(key);
           }
       }
   }

   /**
    * 🧹 Limpiar cache completo
    */
   limpiarCache() {
       this.cache.metadatos.clear();
       this.cache.previsualizaciones.clear();
   }

   /**
    * 📊 Obtener información del cache
    */
   obtenerInfoCache() {
       return {
           metadatos: this.cache.metadatos.size,
           previsualizaciones: this.cache.previsualizaciones.size,
           total: this.cache.metadatos.size + this.cache.previsualizaciones.size
       };
   }
}

// ==========================================
// INICIALIZACIÓN GLOBAL
// ==========================================

// Crear instancia global del servicio
window.servicioDocumentos = new ServicioDocumentos();

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
   module.exports = ServicioDocumentos;
}