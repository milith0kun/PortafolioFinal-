/**
 * 📚 SERVICIO DE ASIGNATURAS
 * Sistema Portafolio Docente UNSAAC
 * 
 * Servicio especializado para gestión completa de asignaturas
 * CRUD, asignaciones docente-asignatura, reportes y estadísticas
 */

class ServicioAsignaturas {
   constructor() {
       this.baseURL = '/api/v1/asignaturas';
       this.clienteAPI = window.clienteAPI;
       
       // Cache para optimizar consultas
       this.cache = {
           asignaturas: new Map(),
           asignaciones: new Map(),
           carreras: new Map(),
           estadisticas: new Map(),
           ttl: 5 * 60 * 1000 // 5 minutos
       };

       // Configuración de asignaturas
       this.config = {
           // Tipos de asignatura
           tipos: {
               'teoria': {
                   etiqueta: 'Teoría',
                   descripcion: 'Asignatura teórica',
                   icono: 'fa-book',
                   color: 'primary'
               },
               'practica': {
                   etiqueta: 'Práctica',
                   descripcion: 'Asignatura práctica',
                   icono: 'fa-tools',
                   color: 'success'
               },
               'laboratorio': {
                   etiqueta: 'Laboratorio',
                   descripcion: 'Asignatura de laboratorio',
                   icono: 'fa-flask',
                   color: 'warning'
               },
               'teoria_practica': {
                   etiqueta: 'Teoría-Práctica',
                   descripcion: 'Asignatura mixta',
                   icono: 'fa-graduation-cap',
                   color: 'info'
               }
           },

           // Modalidades
           modalidades: {
               'presencial': {
                   etiqueta: 'Presencial',
                   descripcion: 'Modalidad presencial',
                   icono: 'fa-users'
               },
               'virtual': {
                   etiqueta: 'Virtual',
                   descripcion: 'Modalidad virtual',
                   icono: 'fa-laptop'
               },
               'semipresencial': {
                   etiqueta: 'Semipresencial',
                   descripcion: 'Modalidad semipresencial',
                   icono: 'fa-user-friends'
               }
           },

           // Estados de asignatura
           estados: {
               'activa': {
                   etiqueta: 'Activa',
                   descripcion: 'Asignatura activa en el ciclo',
                   color: 'success'
               },
               'inactiva': {
                   etiqueta: 'Inactiva',
                   descripcion: 'Asignatura temporalmente inactiva',
                   color: 'warning'
               },
               'archivada': {
                   etiqueta: 'Archivada',
                   descripcion: 'Asignatura archivada',
                   color: 'secondary'
               }
           },

           // Validaciones
           validaciones: {
               minCreditos: 1,
               maxCreditos: 10,
               minCodigoLength: 3,
               maxCodigoLength: 10,
               minNombreLength: 5,
               maxNombreLength: 255
           }
       };

       // Carreras y facultades (se cargan dinámicamente)
       this.datosAcademicos = {
           carreras: [],
           facultades: [],
           semestres: [],
           ultimaActualizacion: null
       };
   }

   // ==========================================
   // MÉTODOS CRUD DE ASIGNATURAS
   // ==========================================

   /**
    * 📋 Obtener asignaturas con filtros
    */
   async obtenerAsignaturas(filtros = {}) {
       try {
           const parametros = this.construirParametrosFiltro(filtros);
           
           const respuesta = await this.clienteAPI.get(this.baseURL, {
               params: parametros
           });

           // Actualizar cache
           if (respuesta.data.asignaturas) {
               respuesta.data.asignaturas.forEach(asignatura => {
                   this.cache.asignaturas.set(asignatura.id, {
                       data: asignatura,
                       timestamp: Date.now()
                   });
               });
           }

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo asignaturas:', error);
           throw error;
       }
   }

   /**
    * 📄 Obtener asignatura específica
    */
   async obtenerAsignatura(asignaturaId) {
       try {
           // Verificar cache
           if (this.cache.asignaturas.has(asignaturaId)) {
               const cached = this.cache.asignaturas.get(asignaturaId);
               if (Date.now() - cached.timestamp < this.cache.ttl) {
                   return cached.data;
               }
           }

           const respuesta = await this.clienteAPI.get(`${this.baseURL}/${asignaturaId}`);
           
           // Guardar en cache
           this.cache.asignaturas.set(asignaturaId, {
               data: respuesta.data,
               timestamp: Date.now()
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo asignatura:', error);
           throw error;
       }
   }

   /**
    * ➕ Crear nueva asignatura
    */
   async crearAsignatura(datosAsignatura) {
       try {
           // Validar datos antes de enviar
           const validacion = this.validarDatosAsignatura(datosAsignatura);
           if (!validacion.valido) {
               throw new Error(validacion.errores.join(', '));
           }

           const respuesta = await this.clienteAPI.post(this.baseURL, {
               nombre: datosAsignatura.nombre,
               codigo: datosAsignatura.codigo,
               carrera: datosAsignatura.carrera,
               semestre: datosAsignatura.semestre,
               anio: datosAsignatura.anio,
               creditos: datosAsignatura.creditos,
               tipo: datosAsignatura.tipo,
               modalidad: datosAsignatura.modalidad || 'presencial',
               prerequisitos: datosAsignatura.prerequisitos || [],
               descripcion: datosAsignatura.descripcion || '',
               competencias: datosAsignatura.competencias || [],
               ciclo_id: datosAsignatura.cicloId
           });

           // Limpiar cache
           this.limpiarCache();

           // Emitir evento
           this.emitirEvento('asignatura:creada', {
               asignatura: respuesta.data
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error creando asignatura:', error);
           throw error;
       }
   }

   /**
    * ✏️ Actualizar asignatura
    */
   async actualizarAsignatura(asignaturaId, datosActualizacion) {
       try {
           // Validar datos antes de enviar
           const validacion = this.validarDatosAsignatura(datosActualizacion, false);
           if (!validacion.valido) {
               throw new Error(validacion.errores.join(', '));
           }

           const respuesta = await this.clienteAPI.put(
               `${this.baseURL}/${asignaturaId}`,
               datosActualizacion
           );

           // Limpiar cache específico
           this.cache.asignaturas.delete(asignaturaId);

           // Emitir evento
           this.emitirEvento('asignatura:actualizada', {
               asignaturaId,
               asignatura: respuesta.data
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error actualizando asignatura:', error);
           throw error;
       }
   }

   /**
    * 🗑️ Eliminar asignatura
    */
   async eliminarAsignatura(asignaturaId, motivo = '') {
       try {
           const respuesta = await this.clienteAPI.delete(`${this.baseURL}/${asignaturaId}`, {
               data: { motivo }
           });

           // Limpiar cache
           this.cache.asignaturas.delete(asignaturaId);

           // Emitir evento
           this.emitirEvento('asignatura:eliminada', {
               asignaturaId
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error eliminando asignatura:', error);
           throw error;
       }
   }

   /**
    * 📦 Archivar asignatura
    */
   async archivarAsignatura(asignaturaId) {
       try {
           const respuesta = await this.clienteAPI.put(
               `${this.baseURL}/${asignaturaId}/archivar`
           );

           // Limpiar cache
           this.cache.asignaturas.delete(asignaturaId);

           // Emitir evento
           this.emitirEvento('asignatura:archivada', {
               asignaturaId
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error archivando asignatura:', error);
           throw error;
       }
   }

   // ==========================================
   // GESTIÓN DE ASIGNACIONES DOCENTE-ASIGNATURA
   // ==========================================

   /**
    * 👨‍🏫 Asignar docente a asignatura
    */
   async asignarDocente(asignaturaId, docenteId, cicloId) {
       try {
           const respuesta = await this.clienteAPI.post(
               `${this.baseURL}/${asignaturaId}/asignar-docente`,
               {
                   docente_id: docenteId,
                   ciclo_id: cicloId
               }
           );

           // Limpiar cache de asignaciones
           this.cache.asignaciones.clear();

           // Emitir evento
           this.emitirEvento('docente:asignado', {
               asignaturaId,
               docenteId,
               cicloId
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error asignando docente:', error);
           throw error;
       }
   }

   /**
    * 🔄 Cambiar docente de asignatura
    */
   async cambiarDocente(asignaturaId, docenteActualId, nuevoDocenteId, cicloId) {
       try {
           const respuesta = await this.clienteAPI.put(
               `${this.baseURL}/${asignaturaId}/cambiar-docente`,
               {
                   docente_actual_id: docenteActualId,
                   nuevo_docente_id: nuevoDocenteId,
                   ciclo_id: cicloId
               }
           );

           // Limpiar cache
           this.cache.asignaciones.clear();

           // Emitir evento
           this.emitirEvento('docente:cambiado', {
               asignaturaId,
               docenteAnterior: docenteActualId,
               docenteNuevo: nuevoDocenteId,
               cicloId
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error cambiando docente:', error);
           throw error;
       }
   }

   /**
    * ❌ Desasignar docente de asignatura
    */
   async desasignarDocente(asignaturaId, docenteId, cicloId, motivo = '') {
       try {
           const respuesta = await this.clienteAPI.delete(
               `${this.baseURL}/${asignaturaId}/desasignar-docente`,
               {
                   data: {
                       docente_id: docenteId,
                       ciclo_id: cicloId,
                       motivo
                   }
               }
           );

           // Limpiar cache
           this.cache.asignaciones.clear();

           // Emitir evento
           this.emitirEvento('docente:desasignado', {
               asignaturaId,
               docenteId,
               cicloId,
               motivo
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error desasignando docente:', error);
           throw error;
       }
   }

   /**
    * 📋 Obtener asignaciones de docente
    */
   async obtenerAsignacionesDocente(docenteId, cicloId = null) {
       try {
           const cacheKey = `asignaciones_docente_${docenteId}_${cicloId || 'all'}`;
           
           // Verificar cache
           if (this.cache.asignaciones.has(cacheKey)) {
               const cached = this.cache.asignaciones.get(cacheKey);
               if (Date.now() - cached.timestamp < this.cache.ttl) {
                   return cached.data;
               }
           }

           const parametros = cicloId ? { ciclo_id: cicloId } : {};
           
           const respuesta = await this.clienteAPI.get(
               `${this.baseURL}/docente/${docenteId}/asignaciones`,
               { params: parametros }
           );

           // Guardar en cache
           this.cache.asignaciones.set(cacheKey, {
               data: respuesta.data,
               timestamp: Date.now()
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo asignaciones del docente:', error);
           throw error;
       }
   }

   /**
    * 📚 Obtener docentes de asignatura
    */
   async obtenerDocentesAsignatura(asignaturaId, cicloId = null) {
       try {
           const parametros = cicloId ? { ciclo_id: cicloId } : {};
           
           const respuesta = await this.clienteAPI.get(
               `${this.baseURL}/${asignaturaId}/docentes`,
               { params: parametros }
           );

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo docentes de asignatura:', error);
           throw error;
       }
   }

   // ==========================================
   // CONSULTAS ESPECIALIZADAS
   // ==========================================

   /**
    * 🎓 Obtener asignaturas por carrera
    */
   async obtenerAsignaturasPorCarrera(carrera, filtros = {}) {
       try {
           const parametros = {
               ...this.construirParametrosFiltro(filtros),
               carrera
           };

           const respuesta = await this.clienteAPI.get(`${this.baseURL}/carrera/${carrera}`, {
               params: parametros
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo asignaturas por carrera:', error);
           throw error;
       }
   }

   /**
    * 📅 Obtener asignaturas por semestre
    */
   async obtenerAsignaturasPorSemestre(semestre, anio, filtros = {}) {
       try {
           const parametros = {
               ...this.construirParametrosFiltro(filtros),
               semestre,
               anio
           };

           const respuesta = await this.clienteAPI.get(`${this.baseURL}/semestre`, {
               params: parametros
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo asignaturas por semestre:', error);
           throw error;
       }
   }

   /**
    * 🔍 Buscar asignaturas
    */
   async buscarAsignaturas(termino, filtros = {}) {
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
           console.error('❌ Error buscando asignaturas:', error);
           throw error;
       }
   }

   /**
    * 📊 Obtener estadísticas de asignaturas
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

   // ==========================================
   // DATOS ACADÉMICOS AUXILIARES
   // ==========================================

   /**
    * 🎓 Obtener carreras disponibles
    */
   async obtenerCarreras() {
       try {
           // Verificar cache
           if (this.datosAcademicos.carreras.length > 0 &&
               this.datosAcademicos.ultimaActualizacion &&
               Date.now() - this.datosAcademicos.ultimaActualizacion < this.cache.ttl) {
               return this.datosAcademicos.carreras;
           }

           const respuesta = await this.clienteAPI.get(`${this.baseURL}/carreras`);
           
           // Actualizar cache
           this.datosAcademicos.carreras = respuesta.data;
           this.datosAcademicos.ultimaActualizacion = Date.now();

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo carreras:', error);
           throw error;
       }
   }

   /**
    * 🏛️ Obtener facultades disponibles
    */
   async obtenerFacultades() {
       try {
           // Verificar cache
           if (this.datosAcademicos.facultades.length > 0 &&
               this.datosAcademicos.ultimaActualizacion &&
               Date.now() - this.datosAcademicos.ultimaActualizacion < this.cache.ttl) {
               return this.datosAcademicos.facultades;
           }

           const respuesta = await this.clienteAPI.get(`${this.baseURL}/facultades`);
           
           // Actualizar cache
           this.datosAcademicos.facultades = respuesta.data;
           this.datosAcademicos.ultimaActualizacion = Date.now();

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo facultades:', error);
           throw error;
       }
   }

   /**
    * 📅 Obtener semestres disponibles
    */
   async obtenerSemestres(cicloId = null) {
       try {
           const parametros = cicloId ? { ciclo_id: cicloId } : {};
           
           const respuesta = await this.clienteAPI.get(`${this.baseURL}/semestres`, {
               params: parametros
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo semestres:', error);
           throw error;
       }
   }

   // ==========================================
   // CARGA MASIVA
   // ==========================================

   /**
    * 📊 Validar Excel de asignaturas
    */
   async validarExcelAsignaturas(archivo) {
       try {
           const formData = new FormData();
           formData.append('archivo', archivo);

           const respuesta = await this.clienteAPI.post(
               `${this.baseURL}/validar-excel`,
               formData,
               {
                   headers: {
                       'Content-Type': 'multipart/form-data'
                   }
               }
           );

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error validando Excel:', error);
           throw error;
       }
   }

   /**
    * 📥 Importar asignaturas desde Excel
    */
   async importarDesdeExcel(archivo, configuracion = {}) {
       try {
           const formData = new FormData();
           formData.append('archivo', archivo);
           formData.append('ciclo_id', configuracion.cicloId);
           formData.append('sobreescribir', configuracion.sobreescribir || false);
           formData.append('validar_prerequisitos', configuracion.validarPrerequisitos !== false);

           const respuesta = await this.clienteAPI.post(
               `${this.baseURL}/importar-excel`,
               formData,
               {
                   headers: {
                       'Content-Type': 'multipart/form-data'
                   }
               }
           );

           // Limpiar cache después de importación masiva
           this.limpiarCache();

           // Emitir evento
           this.emitirEvento('asignaturas:importadas', {
               resultado: respuesta.data
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error importando desde Excel:', error);
           throw error;
       }
   }

   /**
    * 📤 Exportar asignaturas a Excel
    */
   async exportarAExcel(filtros = {}) {
       try {
           const parametros = this.construirParametrosFiltro(filtros);
           
           const respuesta = await this.clienteAPI.get(`${this.baseURL}/exportar-excel`, {
               params: parametros,
               responseType: 'blob'
           });

           // Crear URL temporal y descargar
           const url = window.URL.createObjectURL(new Blob([respuesta.data]));
           const enlace = document.createElement('a');
           enlace.href = url;
           enlace.download = `asignaturas_${new Date().toISOString().split('T')[0]}.xlsx`;
           document.body.appendChild(enlace);
           enlace.click();
           document.body.removeChild(enlace);
           window.URL.revokeObjectURL(url);

           return true;
       } catch (error) {
           console.error('❌ Error exportando a Excel:', error);
           throw error;
       }
   }

   // ==========================================
   // MÉTODOS DE VALIDACIÓN
   // ==========================================

   /**
    * ✅ Validar datos de asignatura
    */
   validarDatosAsignatura(datos, esCreacion = true) {
       const errores = [];
       const validaciones = this.config.validaciones;

       // Validar campos requeridos solo en creación
       if (esCreacion) {
           if (!datos.nombre || datos.nombre.trim().length === 0) {
               errores.push('El nombre de la asignatura es requerido');
           }

           if (!datos.codigo || datos.codigo.trim().length === 0) {
               errores.push('El código de la asignatura es requerido');
           }

           if (!datos.carrera) {
               errores.push('La carrera es requerida');
           }

           if (!datos.semestre) {
               errores.push('El semestre es requerido');
           }

           if (!datos.anio) {
               errores.push('El año académico es requerido');
           }

           if (!datos.creditos) {
               errores.push('El número de créditos es requerido');
           }

           if (!datos.tipo) {
               errores.push('El tipo de asignatura es requerido');
           }
       }

       // Validar longitudes de campos
       if (datos.nombre) {
           if (datos.nombre.length < validaciones.minNombreLength) {
               errores.push(`El nombre debe tener al menos ${validaciones.minNombreLength} caracteres`);
           }
           if (datos.nombre.length > validaciones.maxNombreLength) {
               errores.push(`El nombre no puede exceder ${validaciones.maxNombreLength} caracteres`);
           }
       }

       if (datos.codigo) {
           if (datos.codigo.length < validaciones.minCodigoLength) {
               errores.push(`El código debe tener al menos ${validaciones.minCodigoLength} caracteres`);
           }
           if (datos.codigo.length > validaciones.maxCodigoLength) {
               errores.push(`El código no puede exceder ${validaciones.maxCodigoLength} caracteres`);
           }
           
           // Validar formato de código (letras y números)
           if (!/^[A-Z0-9]+$/.test(datos.codigo.toUpperCase())) {
               errores.push('El código solo puede contener letras y números');
           }
       }

       // Validar créditos
       if (datos.creditos !== undefined) {
           const creditos = parseInt(datos.creditos);
           if (isNaN(creditos) || creditos < validaciones.minCreditos || creditos > validaciones.maxCreditos) {
               errores.push(`Los créditos deben estar entre ${validaciones.minCreditos} y ${validaciones.maxCreditos}`);
           }
       }

       // Validar tipo
       if (datos.tipo && !this.config.tipos[datos.tipo]) {
           errores.push('Tipo de asignatura no válido');
       }

       // Validar modalidad
       if (datos.modalidad && !this.config.modalidades[datos.modalidad]) {
           errores.push('Modalidad no válida');
       }

       // Validar año
       if (datos.anio) {
           const anioActual = new Date().getFullYear();
           if (datos.anio < anioActual - 5 || datos.anio > anioActual + 2) {
               errores.push('El año académico no es válido');
           }
       }

       // Validar prerequisitos (debe ser un array)
       if (datos.prerequisitos && !Array.isArray(datos.prerequisitos)) {
           errores.push('Los prerequisitos deben ser un array');
       }

       return {
           valido: errores.length === 0,
           errores
       };
   }

   /**
    * ✅ Validar código único
    */
   async validarCodigoUnico(codigo, cicloId, asignaturaId = null) {
       try {
           const parametros = {
               codigo,
               ciclo_id: cicloId
           };

           if (asignaturaId) {
               parametros.excluir_id = asignaturaId;
           }

           const respuesta = await this.clienteAPI.get(`${this.baseURL}/validar-codigo`, {
               params: parametros
           });

           return respuesta.data.unico;
       } catch (error) {
           console.error('❌ Error validando código único:', error);
           return false;
       }
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
       return this.config.tipos[tipo]?.icono || 'fa-book';
   }

   /**
    * 🏷️ Obtener etiqueta de modalidad
    */
   obtenerEtiquetaModalidad(modalidad) {
       return this.config.modalidades[modalidad]?.etiqueta || modalidad;
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
    * 📊 Calcular carga académica
    */
   calcularCargaAcademica(asignaturas) {
       if (!Array.isArray(asignaturas)) return 0;
       
       return asignaturas.reduce((total, asignatura) => {
           return total + (parseInt(asignatura.creditos) || 0);
       }, 0);
   }

   /**
    * 🔍 Construir parámetros de filtro
    */
   construirParametrosFiltro(filtros) {
       const parametros = {};

       if (filtros.carrera) parametros.carrera = filtros.carrera;
       if (filtros.semestre) parametros.semestre = filtros.semestre;
       if (filtros.anio) parametros.anio = filtros.anio;
       if (filtros.tipo) parametros.tipo = filtros.tipo;
       if (filtros.modalidad) parametros.modalidad = filtros.modalidad;
       if (filtros.estado) parametros.estado = filtros.estado;
       if (filtros.cicloId) parametros.ciclo_id = filtros.cicloId;
       if (filtros.docenteId) parametros.docente_id = filtros.docenteId;
       if (filtros.conDocente !== undefined) parametros.con_docente = filtros.conDocente;
       if (filtros.sinDocente !== undefined) parametros.sin_docente = filtros.sinDocente;
       if (filtros.creditos) parametros.creditos = filtros.creditos;
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
           window.aplicacion.emitirEvento(`asignaturas:${tipo}`, datos);
       }
   }

   /**
    * 🧹 Limpiar cache
    */
   limpiarCache() {
       this.cache.asignaturas.clear();
       this.cache.asignaciones.clear();
       this.cache.estadisticas.clear();
       this.datosAcademicos.ultimaActualizacion = null;
   }

   /**
    * 📊 Obtener información del cache
    */
   obtenerInfoCache() {
       return {
           asignaturas: this.cache.asignaturas.size,
           asignaciones: this.cache.asignaciones.size,
           estadisticas: this.cache.estadisticas.size,
           carreras: this.datosAcademicos.carreras.length,
           facultades: this.datosAcademicos.facultades.length,
           total: this.cache.asignaturas.size + this.cache.asignaciones.size + this.cache.estadisticas.size
       };
   }

   /**
    * 📈 Generar reporte de asignaturas
    */
   async generarReporte(tipoReporte, filtros = {}) {
       try {
           const respuesta = await this.clienteAPI.post(`${this.baseURL}/generar-reporte`, {
               tipo: tipoReporte,
               filtros,
               formato: 'pdf'
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error generando reporte:', error);
           throw error;
       }
   }

   /**
    * 🔄 Duplicar asignatura
    */
   async duplicarAsignatura(asignaturaId, nuevosDatos = {}) {
       try {
           const respuesta = await this.clienteAPI.post(
               `${this.baseURL}/${asignaturaId}/duplicar`,
               nuevosDatos
           );

           // Limpiar cache
           this.limpiarCache();

           // Emitir evento
           this.emitirEvento('asignatura:duplicada', {
               asignaturaOriginal: asignaturaId,
               asignaturaNueva: respuesta.data
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error duplicando asignatura:', error);
           throw error;
       }
   }
}

// ==========================================
// INICIALIZACIÓN GLOBAL
// ==========================================

// Crear instancia global del servicio
window.servicioAsignaturas = new ServicioAsignaturas();

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
   module.exports = ServicioAsignaturas;
}