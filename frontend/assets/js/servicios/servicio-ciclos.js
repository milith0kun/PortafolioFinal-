/**
 * 📅 SERVICIO DE CICLOS ACADÉMICOS
 * Sistema Portafolio Docente UNSAAC
 * 
 * Servicio especializado para gestión completa de ciclos académicos
 * Creación, activación, cierre, configuración y estados del sistema
 */

class ServicioCiclos {
   constructor() {
       this.baseURL = '/api/v1/ciclos';
       this.clienteAPI = window.clienteAPI;
       
       // Cache para ciclos
       this.cache = {
           ciclos: new Map(),
           cicloActivo: null,
           configuraciones: new Map(),
           estadosModulos: new Map(),
           ttl: 10 * 60 * 1000 // 10 minutos
       };

       // Estados posibles de ciclos
       this.estados = {
           'preparacion': {
               etiqueta: 'En Preparación',
               descripcion: 'Ciclo en configuración inicial',
               color: 'warning',
               icono: 'fa-cog'
           },
           'activo': {
               etiqueta: 'Activo',
               descripcion: 'Ciclo en funcionamiento',
               color: 'success',
               icono: 'fa-play-circle'
           },
           'cerrado': {
               etiqueta: 'Cerrado',
               descripcion: 'Ciclo finalizado',
               color: 'secondary',
               icono: 'fa-stop-circle'
           },
           'archivado': {
               etiqueta: 'Archivado',
               descripcion: 'Ciclo archivado',
               color: 'dark',
               icono: 'fa-archive'
           }
       };

       // Módulos del sistema
       this.modulos = {
           'carga_datos': {
               nombre: 'Carga de Datos',
               descripcion: 'Carga académica y asignaciones',
               icono: 'fa-upload'
           },
           'gestion_documentos': {
               nombre: 'Gestión de Documentos',
               descripcion: 'Subida y organización de archivos',
               icono: 'fa-files'
           },
           'verificacion': {
               nombre: 'Verificación',
               descripcion: 'Revisión y aprobación de documentos',
               icono: 'fa-check-circle'
           },
           'reportes': {
               nombre: 'Reportes',
               descripcion: 'Generación de reportes finales',
               icono: 'fa-chart-bar'
           }
       };
   }

   // ==========================================
   // MÉTODOS CRUD DE CICLOS
   // ==========================================

   /**
    * 📋 Obtener todos los ciclos con filtros
    */
   async obtenerCiclos(filtros = {}) {
       try {
           const parametros = this.construirParametrosFiltro(filtros);
           
           const respuesta = await this.clienteAPI.get(this.baseURL, {
               params: parametros
           });

           // Actualizar cache
           respuesta.data.ciclos?.forEach(ciclo => {
               this.cache.ciclos.set(ciclo.id, {
                   data: ciclo,
                   timestamp: Date.now()
               });
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo ciclos:', error);
           throw error;
       }
   }

   /**
    * 📄 Obtener ciclo específico
    */
   async obtenerCiclo(cicloId) {
       try {
           // Verificar cache
           if (this.cache.ciclos.has(cicloId)) {
               const cached = this.cache.ciclos.get(cicloId);
               if (Date.now() - cached.timestamp < this.cache.ttl) {
                   return cached.data;
               }
           }

           const respuesta = await this.clienteAPI.get(`${this.baseURL}/${cicloId}`);
           
           // Guardar en cache
           this.cache.ciclos.set(cicloId, {
               data: respuesta.data,
               timestamp: Date.now()
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo ciclo:', error);
           throw error;
       }
   }

   /**
    * ➕ Crear nuevo ciclo académico
    */
   async crearCiclo(datosCiclo) {
       try {
           const respuesta = await this.clienteAPI.post(this.baseURL, {
               nombre: datosCiclo.nombre,
               descripcion: datosCiclo.descripcion,
               fecha_inicio: datosCiclo.fechaInicio,
               fecha_fin: datosCiclo.fechaFin,
               semestre_actual: datosCiclo.semestreActual,
               anio_actual: datosCiclo.anioActual,
               configuracion: datosCiclo.configuracion || {}
           });

           // Limpiar cache
           this.limpiarCache();

           // Emitir evento
           window.aplicacion?.emitirEvento('ciclo:creado', {
               ciclo: respuesta.data
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error creando ciclo:', error);
           throw error;
       }
   }

   /**
    * ✏️ Actualizar ciclo académico
    */
   async actualizarCiclo(cicloId, datosActualizacion) {
       try {
           const respuesta = await this.clienteAPI.put(
               `${this.baseURL}/${cicloId}`, 
               datosActualizacion
           );

           // Limpiar cache específico
           this.cache.ciclos.delete(cicloId);

           // Emitir evento
           window.aplicacion?.emitirEvento('ciclo:actualizado', {
               cicloId,
               ciclo: respuesta.data
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error actualizando ciclo:', error);
           throw error;
       }
   }

   /**
    * 🗑️ Eliminar ciclo académico
    */
   async eliminarCiclo(cicloId, motivo = '') {
       try {
           const respuesta = await this.clienteAPI.delete(`${this.baseURL}/${cicloId}`, {
               data: { motivo }
           });

           // Limpiar cache
           this.cache.ciclos.delete(cicloId);

           // Emitir evento
           window.aplicacion?.emitirEvento('ciclo:eliminado', {
               cicloId
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error eliminando ciclo:', error);
           throw error;
       }
   }

   // ==========================================
   // GESTIÓN DE ESTADOS DE CICLO
   // ==========================================

   /**
    * ▶️ Activar ciclo académico
    */
   async activarCiclo(cicloId) {
       try {
           const respuesta = await this.clienteAPI.post(
               `${this.baseURL}/${cicloId}/activar`
           );

           // Actualizar cache de ciclo activo
           this.cache.cicloActivo = respuesta.data;
           
           // Limpiar cache general
           this.limpiarCache();

           // Emitir evento
           window.aplicacion?.emitirEvento('ciclo:activado', {
               ciclo: respuesta.data
           });

           // Actualizar estado global de la aplicación
           if (window.aplicacion) {
               window.aplicacion.actualizarEstado('cicloActivo', respuesta.data);
           }

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error activando ciclo:', error);
           throw error;
       }
   }

   /**
    * ⏸️ Cerrar ciclo académico
    */
   async cerrarCiclo(cicloId, configuracionCierre = {}) {
       try {
           const respuesta = await this.clienteAPI.post(
               `${this.baseURL}/${cicloId}/cerrar`,
               {
                   generar_reportes: configuracionCierre.generarReportes !== false,
                   archivar_documentos: configuracionCierre.archivarDocumentos !== false,
                   notificar_usuarios: configuracionCierre.notificarUsuarios !== false,
                   comentarios: configuracionCierre.comentarios || ''
               }
           );

           // Limpiar cache
           this.limpiarCache();
           this.cache.cicloActivo = null;

           // Emitir evento
           window.aplicacion?.emitirEvento('ciclo:cerrado', {
               ciclo: respuesta.data
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error cerrando ciclo:', error);
           throw error;
       }
   }

   /**
    * 📦 Archivar ciclo académico
    */
   async archivarCiclo(cicloId) {
       try {
           const respuesta = await this.clienteAPI.post(
               `${this.baseURL}/${cicloId}/archivar`
           );

           // Limpiar cache
           this.cache.ciclos.delete(cicloId);

           // Emitir evento
           window.aplicacion?.emitirEvento('ciclo:archivado', {
               cicloId
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error archivando ciclo:', error);
           throw error;
       }
   }

   // ==========================================
   // GESTIÓN DE ESTADOS DE MÓDULOS
   // ==========================================

   /**
    * 📊 Obtener estado de módulos del ciclo
    */
   async obtenerEstadosModulos(cicloId) {
       try {
           // Verificar cache
           const cacheKey = `estados_${cicloId}`;
           if (this.cache.estadosModulos.has(cacheKey)) {
               const cached = this.cache.estadosModulos.get(cacheKey);
               if (Date.now() - cached.timestamp < this.cache.ttl) {
                   return cached.data;
               }
           }

           const respuesta = await this.clienteAPI.get(
               `${this.baseURL}/${cicloId}/estados-modulos`
           );

           // Guardar en cache
           this.cache.estadosModulos.set(cacheKey, {
               data: respuesta.data,
               timestamp: Date.now()
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo estados de módulos:', error);
           throw error;
       }
   }

   /**
    * 🔄 Actualizar estado de módulo
    */
   async actualizarEstadoModulo(cicloId, modulo, habilitado, observaciones = '') {
       try {
           const respuesta = await this.clienteAPI.put(
               `${this.baseURL}/${cicloId}/modulo/${modulo}`,
               {
                   habilitado,
                   observaciones
               }
           );

           // Limpiar cache de estados
           const cacheKey = `estados_${cicloId}`;
           this.cache.estadosModulos.delete(cacheKey);

           // Emitir evento
           window.aplicacion?.emitirEvento('ciclo:moduloActualizado', {
               cicloId,
               modulo,
               habilitado,
               observaciones
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error actualizando estado de módulo:', error);
           throw error;
       }
   }

   /**
    * 🔒 Bloquear todos los módulos del ciclo
    */
   async bloquearModulos(cicloId, motivo = '') {
       try {
           const respuesta = await this.clienteAPI.post(
               `${this.baseURL}/${cicloId}/bloquear-modulos`,
               { motivo }
           );

           // Limpiar cache
           const cacheKey = `estados_${cicloId}`;
           this.cache.estadosModulos.delete(cacheKey);

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error bloqueando módulos:', error);
           throw error;
       }
   }

   /**
    * 🔓 Habilitar todos los módulos del ciclo
    */
   async habilitarModulos(cicloId) {
       try {
           const respuesta = await this.clienteAPI.post(
               `${this.baseURL}/${cicloId}/habilitar-modulos`
           );

           // Limpiar cache
           const cacheKey = `estados_${cicloId}`;
           this.cache.estadosModulos.delete(cacheKey);

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error habilitando módulos:', error);
           throw error;
       }
   }

   // ==========================================
   // GESTIÓN DE CONFIGURACIONES
   // ==========================================

   /**
    * ⚙️ Obtener configuración del ciclo
    */
   async obtenerConfiguracion(cicloId) {
       try {
           // Verificar cache
           const cacheKey = `config_${cicloId}`;
           if (this.cache.configuraciones.has(cacheKey)) {
               const cached = this.cache.configuraciones.get(cacheKey);
               if (Date.now() - cached.timestamp < this.cache.ttl) {
                   return cached.data;
               }
           }

           const respuesta = await this.clienteAPI.get(
               `${this.baseURL}/${cicloId}/configuracion`
           );

           // Guardar en cache
           this.cache.configuraciones.set(cacheKey, {
               data: respuesta.data,
               timestamp: Date.now()
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo configuración:', error);
           throw error;
       }
   }

   /**
    * 🔧 Actualizar configuración del ciclo
    */
   async actualizarConfiguracion(cicloId, configuracion) {
       try {
           const respuesta = await this.clienteAPI.put(
               `${this.baseURL}/${cicloId}/configuracion`,
               configuracion
           );

           // Limpiar cache
           const cacheKey = `config_${cicloId}`;
           this.cache.configuraciones.delete(cacheKey);

           // Emitir evento
           window.aplicacion?.emitirEvento('ciclo:configuracionActualizada', {
               cicloId,
               configuracion: respuesta.data
           });

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error actualizando configuración:', error);
           throw error;
       }
   }

   // ==========================================
   // MÉTODOS DE CONSULTA ESPECÍFICOS
   // ==========================================

   /**
    * 🎯 Obtener ciclo activo
    */
   async obtenerCicloActivo() {
       try {
           // Verificar cache
           if (this.cache.cicloActivo && 
               Date.now() - this.cache.cicloActivo.timestamp < this.cache.ttl) {
               return this.cache.cicloActivo.data;
           }

           const respuesta = await this.clienteAPI.get(`${this.baseURL}/activo`);
           
           // Guardar en cache
           this.cache.cicloActivo = {
               data: respuesta.data,
               timestamp: Date.now()
           };

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo ciclo activo:', error);
           throw error;
       }
   }

   /**
    * 📈 Obtener estadísticas del ciclo
    */
   async obtenerEstadisticas(cicloId) {
       try {
           const respuesta = await this.clienteAPI.get(
               `${this.baseURL}/${cicloId}/estadisticas`
           );

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo estadísticas:', error);
           throw error;
       }
   }

   /**
    * 📋 Obtener resumen ejecutivo del ciclo
    */
   async obtenerResumenEjecutivo(cicloId) {
       try {
           const respuesta = await this.clienteAPI.get(
               `${this.baseURL}/${cicloId}/resumen-ejecutivo`
           );

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo resumen ejecutivo:', error);
           throw error;
       }
   }

   /**
    * 🔄 Obtener progreso general del ciclo
    */
   async obtenerProgreso(cicloId) {
       try {
           const respuesta = await this.clienteAPI.get(
               `${this.baseURL}/${cicloId}/progreso`
           );

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo progreso:', error);
           throw error;
       }
   }

   // ==========================================
   // MÉTODOS DE VALIDACIÓN
   // ==========================================

   /**
    * ✅ Validar si se puede activar ciclo
    */
   async validarActivacion(cicloId) {
       try {
           const respuesta = await this.clienteAPI.get(
               `${this.baseURL}/${cicloId}/validar-activacion`
           );

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error validando activación:', error);
           throw error;
       }
   }

   /**
    * ✅ Validar si se puede cerrar ciclo
    */
   async validarCierre(cicloId) {
       try {
           const respuesta = await this.clienteAPI.get(
               `${this.baseURL}/${cicloId}/validar-cierre`
           );

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error validando cierre:', error);
           throw error;
       }
   }

   /**
    * 🔍 Validar datos de ciclo
    */
   validarDatosCiclo(datos) {
       const errores = [];

       // Validar campos requeridos
       if (!datos.nombre || datos.nombre.trim().length === 0) {
           errores.push('El nombre del ciclo es requerido');
       }

       if (!datos.fechaInicio) {
           errores.push('La fecha de inicio es requerida');
       }

       if (!datos.fechaFin) {
           errores.push('La fecha de fin es requerida');
       }

       if (!datos.semestreActual) {
           errores.push('El semestre actual es requerido');
       }

       if (!datos.anioActual) {
           errores.push('El año actual es requerido');
       }

       // Validar fechas
       if (datos.fechaInicio && datos.fechaFin) {
           const inicio = new Date(datos.fechaInicio);
           const fin = new Date(datos.fechaFin);

           if (inicio >= fin) {
               errores.push('La fecha de inicio debe ser anterior a la fecha de fin');
           }

           // Validar que las fechas no sean muy antiguas
           const ahora = new Date();
           const unAñoAtras = new Date(ahora.getFullYear() - 1, ahora.getMonth(), ahora.getDate());

           if (fin < unAñoAtras) {
               errores.push('La fecha de fin no puede ser anterior a un año');
           }
       }

       // Validar año
       if (datos.anioActual) {
           const anioActual = new Date().getFullYear();
           if (datos.anioActual < anioActual - 2 || datos.anioActual > anioActual + 2) {
               errores.push('El año debe estar entre ' + (anioActual - 2) + ' y ' + (anioActual + 2));
           }
       }

       // Validar nombre único (esto se validaría en el backend)
       if (datos.nombre && datos.nombre.length > 100) {
           errores.push('El nombre del ciclo no puede exceder 100 caracteres');
       }

       return {
           valido: errores.length === 0,
           errores
       };
   }

   // ==========================================
   // MÉTODOS AUXILIARES
   // ==========================================

   /**
    * 🏷️ Obtener etiqueta de estado
    */
   obtenerEtiquetaEstado(estado) {
       return this.estados[estado]?.etiqueta || estado;
   }

   /**
    * 🎨 Obtener clase CSS de estado
    */
   obtenerClaseEstado(estado) {
       return `badge badge-${this.estados[estado]?.color || 'secondary'}`;
   }

   /**
    * 🔢 Calcular duración del ciclo en días
    */
   calcularDuracion(fechaInicio, fechaFin) {
       const inicio = new Date(fechaInicio);
       const fin = new Date(fechaFin);
       const diferencia = fin.getTime() - inicio.getTime();
       return Math.ceil(diferencia / (1000 * 3600 * 24));
   }

   /**
    * 📊 Calcular progreso temporal del ciclo
    */
   calcularProgresoTemporal(fechaInicio, fechaFin) {
       const ahora = new Date();
       const inicio = new Date(fechaInicio);
       const fin = new Date(fechaFin);

       if (ahora < inicio) return 0;
       if (ahora > fin) return 100;

       const duracionTotal = fin.getTime() - inicio.getTime();
       const transcurrido = ahora.getTime() - inicio.getTime();

       return Math.round((transcurrido / duracionTotal) * 100);
   }

   /**
    * 🔍 Construir parámetros de filtro
    */
   construirParametrosFiltro(filtros) {
       const parametros = {};

       if (filtros.estado) parametros.estado = filtros.estado;
       if (filtros.anio) parametros.anio = filtros.anio;
       if (filtros.semestre) parametros.semestre = filtros.semestre;
       if (filtros.activo !== undefined) parametros.activo = filtros.activo;
       if (filtros.limit) parametros.limit = filtros.limit;
       if (filtros.offset) parametros.offset = filtros.offset;
       if (filtros.ordenPor) parametros.orden_por = filtros.ordenPor;
       if (filtros.direccion) parametros.direccion = filtros.direccion;

       return parametros;
   }

   /**
    * 🧹 Limpiar cache
    */
   limpiarCache() {
       this.cache.ciclos.clear();
       this.cache.configuraciones.clear();
       this.cache.estadosModulos.clear();
   }

   /**
    * 📊 Obtener información del cache
    */
   obtenerInfoCache() {
       return {
           ciclos: this.cache.ciclos.size,
           configuraciones: this.cache.configuraciones.size,
           estadosModulos: this.cache.estadosModulos.size,
           cicloActivo: this.cache.cicloActivo ? 'Cargado' : 'No cargado'
       };
   }

   /**
    * 🔄 Forzar recarga del ciclo activo
    */
   async recargarCicloActivo() {
       this.cache.cicloActivo = null;
       return await this.obtenerCicloActivo();
   }
}

// ==========================================
// INICIALIZACIÓN GLOBAL
// ==========================================

// Crear instancia global del servicio
window.servicioCiclos = new ServicioCiclos();

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
   module.exports = ServicioCiclos;
}