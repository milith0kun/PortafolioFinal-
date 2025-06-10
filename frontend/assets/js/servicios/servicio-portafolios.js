/**
 * 📁 SERVICIO DE PORTAFOLIOS
 * Sistema Portafolio Docente UNSAAC
 * 
 * Servicio especializado para gestión de portafolios
 * Estructura, navegación, progreso y documentos
 */

class ServicioPortafolios {
   constructor() {
       this.baseURL = '/portafolios';
       this.endpoints = {
           // Estructura
           GENERAR_ESTRUCTURA: '/estructura/generar',
           VISTA_ADMINISTRADOR: '/estructura/administrador',
           VISTA_DOCENTE: '/estructura/docente',
           VISTA_VERIFICADOR: '/estructura/verificador',
           PERSONALIZAR: '/estructura/personalizar',
           ESTRUCTURA_BASE: '/estructura/base',
           ESTADISTICAS_ESTRUCTURA: '/estructura/estadisticas',
           CLONAR_ESTRUCTURA: '/estructura/clonar',
           
           // Navegación
           LISTAR: '',
           ARBOL: '/:id/arbol',
           BUSCAR: '/buscar',
           CARPETA: '/carpeta/:carpetaId',
           FAVORITOS: '/favoritos',
           ACCESOS_RAPIDOS: '/accesos-rapidos',
           CONFIGURAR_VISTA: '/configurar-vista',
           ESTADISTICAS_NAVEGACION: '/estadisticas/navegacion',
           REORDENAR: '/reordenar',
           
           // Progreso
           PROGRESO_ESPECIFICO: '/:id/progreso',
           RESUMEN_PROGRESO: '/progreso/resumen',
           COMPARATIVA: '/progreso/comparativa',
           TEMPORAL: '/progreso/temporal',
           METAS: '/progreso/metas',
           REPORTE_PROGRESO: '/progreso/reporte',
           ALERTAS: '/progreso/alertas',
           ACTUALIZAR_PROGRESO: '/:id/progreso/actualizar',
           
           // CRUD Básico
           OBTENER: '/:id',
           CREAR: '',
           ACTUALIZAR: '/:id',
           ELIMINAR: '/:id',
           DUPLICAR: '/:id/duplicar',
           ARCHIVAR: '/:id/archivar',
           RESTAURAR: '/:id/restaurar'
       };
   }

   // ==========================================
   // 🏗️ ESTRUCTURA DE PORTAFOLIOS
   // ==========================================

   /**
    * 🏗️ Generar estructura de portafolio
    */
   async generarEstructura(datosGeneracion) {
       try {
           // Validar datos requeridos
           this.validarDatosGeneracion(datosGeneracion);

           console.log('🏗️ Generando estructura de portafolio...');

           const response = await window.api.post(this.baseURL + this.endpoints.GENERAR_ESTRUCTURA, {
               docenteId: datosGeneracion.docenteId,
               asignaturaId: datosGeneracion.asignaturaId,
               semestreId: datosGeneracion.semestreId,
               cicloId: datosGeneracion.cicloId,
               plantilla: datosGeneracion.plantilla || 'estandar',
               personalizaciones: datosGeneracion.personalizaciones || {},
               copiarDe: datosGeneracion.copiarDe, // ID de otro portafolio
               timestamp: Date.now()
           });

           if (response.data.success) {
               console.log('✅ Estructura generada exitosamente');

               return {
                   success: true,
                   portafolio: response.data.portafolio,
                   estructura: response.data.estructura,
                   carpetas: response.data.carpetas,
                   mensaje: response.data.message || 'Estructura de portafolio generada exitosamente'
               };
           } else {
               throw new Error(response.data.message || 'Error al generar estructura');
           }

       } catch (error) {
           console.error('❌ Error al generar estructura:', error);
           throw error;
       }
   }

   /**
    * 👨‍💼 Obtener vista de administrador
    */
   async obtenerVistaAdministrador(filtros = {}) {
       try {
           const params = {
               cicloId: filtros.cicloId,
               carrera: filtros.carrera,
               departamento: filtros.departamento,
               estado: filtros.estado,
               docente: filtros.docente,
               asignatura: filtros.asignatura,
               incluirEstadisticas: filtros.incluirEstadisticas !== false
           };

           console.log('👨‍💼 Obteniendo vista de administrador...');

           const response = await window.api.get(this.baseURL + this.endpoints.VISTA_ADMINISTRADOR, params);

           if (response.data.success) {
               return {
                   success: true,
                   portafolios: response.data.portafolios,
                   estadisticas: response.data.estadisticas,
                   resumen: response.data.resumen,
                   alertas: response.data.alertas
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener vista de administrador');
           }

       } catch (error) {
           console.error('❌ Error al obtener vista de administrador:', error);
           throw error;
       }
   }

   /**
    * 👨‍🏫 Obtener vista de docente
    */
   async obtenerVistaDocente(docenteId = null) {
       try {
           const params = docenteId ? { docenteId: docenteId } : {};

           console.log('👨‍🏫 Obteniendo vista de docente...');

           const response = await window.api.get(this.baseURL + this.endpoints.VISTA_DOCENTE, params);

           if (response.data.success) {
               return {
                   success: true,
                   portafolios: response.data.portafolios,
                   progreso: response.data.progreso,
                   tareasPendientes: response.data.tareasPendientes,
                   observaciones: response.data.observaciones,
                   estadisticas: response.data.estadisticas
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener vista de docente');
           }

       } catch (error) {
           console.error('❌ Error al obtener vista de docente:', error);
           throw error;
       }
   }

   /**
    * 👨‍🔬 Obtener vista de verificador
    */
   async obtenerVistaVerificador(verificadorId = null) {
       try {
           const params = verificadorId ? { verificadorId: verificadorId } : {};

           console.log('👨‍🔬 Obteniendo vista de verificador...');

           const response = await window.api.get(this.baseURL + this.endpoints.VISTA_VERIFICADOR, params);

           if (response.data.success) {
               return {
                   success: true,
                   portafolios: response.data.portafolios,
                   pendientesRevision: response.data.pendientesRevision,
                   estadisticas: response.data.estadisticas,
                   asignados: response.data.asignados,
                   alertas: response.data.alertas
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener vista de verificador');
           }

       } catch (error) {
           console.error('❌ Error al obtener vista de verificador:', error);
           throw error;
       }
   }

   /**
    * 🎨 Personalizar estructura
    */
   async personalizarEstructura(portafolioId, personalizaciones) {
       try {
           if (!portafolioId) {
               throw new Error('ID de portafolio requerido');
           }

           console.log('🎨 Personalizando estructura del portafolio...');

           const response = await window.api.post(this.baseURL + this.endpoints.PERSONALIZAR, {
               portafolioId: portafolioId,
               personalizaciones: personalizaciones,
               timestamp: Date.now()
           });

           if (response.data.success) {
               console.log('✅ Estructura personalizada exitosamente');

               return {
                   success: true,
                   portafolio: response.data.portafolio,
                   estructura: response.data.estructura,
                   mensaje: response.data.message || 'Estructura personalizada exitosamente'
               };
           } else {
               throw new Error(response.data.message || 'Error al personalizar estructura');
           }

       } catch (error) {
           console.error('❌ Error al personalizar estructura:', error);
           throw error;
       }
   }

   // ==========================================
   // 📂 NAVEGACIÓN DE PORTAFOLIOS
   // ==========================================

   /**
    * 📋 Listar portafolios
    */
   async listar(filtros = {}, paginacion = {}) {
       try {
           const params = {
               // Filtros
               cicloId: filtros.cicloId,
               docenteId: filtros.docenteId,
               asignaturaId: filtros.asignaturaId,
               estado: filtros.estado,
               busqueda: filtros.busqueda,
               fechaDesde: filtros.fechaDesde,
               fechaHasta: filtros.fechaHasta,
               
               // Paginación
               pagina: paginacion.pagina || 1,
               limite: paginacion.limite || CONFIG.UI.TABLA_CONFIG.ITEMS_POR_PAGINA,
               ordenar: paginacion.ordenar || 'actualizado_en',
               direccion: paginacion.direccion || 'desc',
               
               // Opciones
               incluirArchivados: filtros.incluirArchivados || false,
               incluirProgreso: filtros.incluirProgreso !== false
           };

           console.log('📋 Listando portafolios...');

           const response = await window.api.get(this.baseURL, params);

           if (response.data.success) {
               return {
                   success: true,
                   portafolios: response.data.portafolios,
                   total: response.data.total,
                   paginas: response.data.paginas,
                   paginaActual: response.data.paginaActual,
                   estadisticas: response.data.estadisticas
               };
           } else {
               throw new Error(response.data.message || 'Error al listar portafolios');
           }

       } catch (error) {
           console.error('❌ Error al listar portafolios:', error);
           throw error;
       }
   }

   /**
    * 🌳 Obtener árbol de navegación
    */
   async obtenerArbol(portafolioId, opciones = {}) {
       try {
           if (!portafolioId) {
               throw new Error('ID de portafolio requerido');
           }

           const params = {
               expandir: opciones.expandir || 'todos',
               incluirArchivos: opciones.incluirArchivos !== false,
               incluirEstadisticas: opciones.incluirEstadisticas || false,
               nivelMaximo: opciones.nivelMaximo || 10
           };

           console.log('🌳 Obteniendo árbol de navegación...');

           const url = this.baseURL + this.endpoints.ARBOL.replace(':id', portafolioId);
           const response = await window.api.get(url, params);

           if (response.data.success) {
               return {
                   success: true,
                   portafolio: response.data.portafolio,
                   arbol: response.data.arbol,
                   estadisticas: response.data.estadisticas,
                   rutas: response.data.rutas
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener árbol de navegación');
           }

       } catch (error) {
           console.error('❌ Error al obtener árbol:', error);
           throw error;
       }
   }

   /**
    * 🔍 Buscar en portafolios
    */
   async buscar(termino, filtros = {}) {
       try {
           if (!termino || termino.trim().length < 2) {
               return { success: true, resultados: [] };
           }

           const params = {
               q: termino.trim(),
               portafolioId: filtros.portafolioId,
               tipo: filtros.tipo, // 'carpetas', 'archivos', 'ambos'
               extension: filtros.extension,
               fechaDesde: filtros.fechaDesde,
               fechaHasta: filtros.fechaHasta,
               limite: filtros.limite || 50,
               resaltar: filtros.resaltar !== false
           };

           console.log('🔍 Buscando en portafolios:', termino);

           const response = await window.api.get(this.baseURL + this.endpoints.BUSCAR, params);

           if (response.data.success) {
               return {
                   success: true,
                   resultados: response.data.resultados,
                   total: response.data.total,
                   termino: termino,
                   sugerencias: response.data.sugerencias
               };
           } else {
               throw new Error(response.data.message || 'Error en la búsqueda');
           }

       } catch (error) {
           console.error('❌ Error al buscar:', error);
           throw error;
       }
   }

   /**
    * 📁 Obtener contenido de carpeta
    */
   async obtenerCarpeta(carpetaId, opciones = {}) {
       try {
           if (!carpetaId) {
               throw new Error('ID de carpeta requerido');
           }

           const params = {
               ordenar: opciones.ordenar || 'nombre',
               direccion: opciones.direccion || 'asc',
               vista: opciones.vista || 'lista', // 'lista', 'grid', 'arbol'
               incluirOcultos: opciones.incluirOcultos || false
           };

           console.log('📁 Obteniendo contenido de carpeta...');

           const url = this.baseURL + this.endpoints.CARPETA.replace(':carpetaId', carpetaId);
           const response = await window.api.get(url, params);

           if (response.data.success) {
               return {
                   success: true,
                   carpeta: response.data.carpeta,
                   contenido: response.data.contenido,
                   breadcrumb: response.data.breadcrumb,
                   permisos: response.data.permisos
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener carpeta');
           }

       } catch (error) {
           console.error('❌ Error al obtener carpeta:', error);
           throw error;
       }
   }

   /**
    * ⭐ Gestionar favoritos
    */
   async gestionarFavoritos(accion, itemId, tipo = 'carpeta') {
       try {
           if (!['agregar', 'quitar', 'obtener'].includes(accion)) {
               throw new Error('Acción debe ser: agregar, quitar, obtener');
           }

           const datos = accion === 'obtener' ? {} : {
               accion: accion,
               itemId: itemId,
               tipo: tipo,
               timestamp: Date.now()
           };

           console.log(`⭐ ${Utils.Texto.capitalizar(accion)} favorito...`);

           const response = await window.api.post(this.baseURL + this.endpoints.FAVORITOS, datos);

           if (response.data.success) {
               return {
                   success: true,
                   favoritos: response.data.favoritos,
                   mensaje: response.data.message || `Favorito ${accion === 'agregar' ? 'agregado' : 'quitado'} exitosamente`
               };
           } else {
               throw new Error(response.data.message || 'Error al gestionar favoritos');
           }

       } catch (error) {
           console.error('❌ Error al gestionar favoritos:', error);
           throw error;
       }
   }

   /**
    * ⚡ Obtener accesos rápidos
    */
   async obtenerAccesosRapidos() {
       try {
           console.log('⚡ Obteniendo accesos rápidos...');

           const response = await window.api.get(this.baseURL + this.endpoints.ACCESOS_RAPIDOS);

           if (response.data.success) {
               return {
                   success: true,
                   accesos: response.data.accesos,
                   recientes: response.data.recientes,
                   frecuentes: response.data.frecuentes,
                   favoritos: response.data.favoritos
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener accesos rápidos');
           }

       } catch (error) {
           console.error('❌ Error al obtener accesos rápidos:', error);
           throw error;
       }
   }

   // ==========================================
   // 📊 PROGRESO DE PORTAFOLIOS
   // ==========================================

   /**
    * 📊 Obtener progreso específico
    */
   async obtenerProgreso(portafolioId) {
       try {
           if (!portafolioId) {
               throw new Error('ID de portafolio requerido');
           }

           console.log('📊 Obteniendo progreso del portafolio...');

           const url = this.baseURL + this.endpoints.PROGRESO_ESPECIFICO.replace(':id', portafolioId);
           const response = await window.api.get(url);

           if (response.data.success) {
               return {
                   success: true,
                   portafolio: response.data.portafolio,
                   progreso: response.data.progreso,
                   detalles: response.data.detalles,
                   hitos: response.data.hitos,
                   recomendaciones: response.data.recomendaciones
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener progreso');
           }

       } catch (error) {
           console.error('❌ Error al obtener progreso:', error);
           throw error;
       }
   }

   /**
    * 📈 Obtener resumen de progreso
    */
   async obtenerResumenProgreso(filtros = {}) {
       try {
           const params = {
               cicloId: filtros.cicloId,
               docenteId: filtros.docenteId,
               carrera: filtros.carrera,
               periodo: filtros.periodo || '30d'
           };

           console.log('📈 Obteniendo resumen de progreso...');

           const response = await window.api.get(this.baseURL + this.endpoints.RESUMEN_PROGRESO, params);

           if (response.data.success) {
               return {
                   success: true,
                   resumen: response.data.resumen,
                   estadisticas: response.data.estadisticas,
                   tendencias: response.data.tendencias,
                   alertas: response.data.alertas
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener resumen de progreso');
           }

       } catch (error) {
           console.error('❌ Error al obtener resumen de progreso:', error);
           throw error;
       }
   }

   /**
    * 📊 Obtener comparativa de progreso
    */
   async obtenerComparativa(portafoliosIds, criterio = 'completitud') {
       try {
           if (!Array.isArray(portafoliosIds) || portafoliosIds.length < 2) {
               throw new Error('Se requieren al menos 2 portafolios para comparar');
           }

           const params = {
               portafolios: portafoliosIds.join(','),
               criterio: criterio,
               incluirTendencias: true
           };

           console.log('📊 Obteniendo comparativa de progreso...');

           const response = await window.api.get(this.baseURL + this.endpoints.COMPARATIVA, params);

           if (response.data.success) {
               return {
                   success: true,
                   comparativa: response.data.comparativa,
                   ranking: response.data.ranking,
                   analisis: response.data.analisis
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener comparativa');
           }

       } catch (error) {
           console.error('❌ Error al obtener comparativa:', error);
           throw error;
       }
   }

   /**
    * 📈 Obtener tendencias temporales
    */
   async obtenerTendenciasTemporales(portafolioId, periodo = '30d') {
       try {
           if (!portafolioId) {
               throw new Error('ID de portafolio requerido');
           }

           const params = {
               periodo: periodo,
               granularidad: this.determinarGranularidad(periodo)
           };

           console.log('📈 Obteniendo tendencias temporales...');

           const response = await window.api.get(this.baseURL + this.endpoints.TEMPORAL, params);

           if (response.data.success) {
               return {
                   success: true,
                   tendencias: response.data.tendencias,
                   eventos: response.data.eventos,
                   prediccion: response.data.prediccion
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener tendencias');
           }

       } catch (error) {
           console.error('❌ Error al obtener tendencias temporales:', error);
           throw error;
       }
   }

   /**
    * 🎯 Configurar metas de progreso
    */
   async configurarMetas(portafolioId, metas) {
       try {
           if (!portafolioId) {
               throw new Error('ID de portafolio requerido');
           }

           console.log('🎯 Configurando metas de progreso...');

           const response = await window.api.post(this.baseURL + this.endpoints.METAS, {
               portafolioId: portafolioId,
               metas: metas,
               timestamp: Date.now()
           });

           if (response.data.success) {
               return {
                   success: true,
                   metas: response.data.metas,
                   mensaje: response.data.message || 'Metas configuradas exitosamente'
               };
           } else {
               throw new Error(response.data.message || 'Error al configurar metas');
           }

       } catch (error) {
           console.error('❌ Error al configurar metas:', error);
           throw error;
       }
   }

   // ==========================================
   // 📁 CRUD BÁSICO DE PORTAFOLIOS
   // ==========================================

   /**
    * 👁️ Obtener portafolio específico
    */
   async obtener(portafolioId, opciones = {}) {
       try {
           if (!portafolioId) {
               throw new Error('ID de portafolio requerido');
           }

           const params = {
               incluirEstructura: opciones.incluirEstructura !== false,
               incluirProgreso: opciones.incluirProgreso !== false,
               incluirEstadisticas: opciones.incluirEstadisticas || false
           };

           console.log('👁️ Obteniendo portafolio:', portafolioId);

           const url = this.baseURL + this.endpoints.OBTENER.replace(':id', portafolioId);
           const response = await window.api.get(url, params);

           if (response.data.success) {
               return {
                   success: true,
                   portafolio: response.data.portafolio,
                   estructura: response.data.estructura,
                   progreso: response.data.progreso,
                   estadisticas: response.data.estadisticas,
                   permisos: response.data.permisos
               };
           } else {
               throw new Error(response.data.message || 'Portafolio no encontrado');
           }

       } catch (error) {
           console.error('❌ Error al obtener portafolio:', error);
           throw error;
       }
   }

   /**
    * ➕ Crear nuevo portafolio
    */
   async crear(datosPortafolio) {
       try {
           this.validarDatosPortafolio(datosPortafolio);

           console.log('➕ Creando nuevo portafolio...');

           const response = await window.api.post(this.baseURL, {
               nombre: datosPortafolio.nombre.trim(),
               descripcion: datosPortafolio.descripcion?.trim(),
               docenteId: datosPortafolio.docenteId,
               asignaturaId: datosPortafolio.asignaturaId,
               semestreId: datosPortafolio.semestreId,
               cicloId: datosPortafolio.cicloId,
               plantilla: datosPortafolio.plantilla || 'estandar',
               configuracion: datosPortafolio.configuracion || {},
               timestamp: Date.now()
           });

           if (response.data.success) {
               console.log('✅ Portafolio creado exitosamente');

               return {
                   success: true,
                   portafolio: response.data.portafolio,
                   mensaje: response.data.message || 'Portafolio creado exitosamente'
               };
           } else {
               throw new Error(response.data.message || 'Error al crear portafolio');
           }

       } catch (error) {
           console.error('❌ Error al crear portafolio:', error);
           throw error;
       }
   }

   /**
    * ✏️ Actualizar portafolio
    */
   async actualizar(portafolioId, datosActualizacion) {
       try {
           if (!portafolioId) {
               throw new Error('ID de portafolio requerido');
           }

           console.log('✏️ Actualizando portafolio:', portafolioId);

           const url = this.baseURL + this.endpoints.ACTUALIZAR.replace(':id', portafolioId);
           const response = await window.api.put(url, {
               ...datosActualizacion,
               timestamp: Date.now()
           });

           if (response.data.success) {
               console.log('✅ Portafolio actualizado exitosamente');

               return {
                   success: true,
                   portafolio: response.data.portafolio,
                   mensaje: response.data.message || 'Portafolio actualizado exitosamente'
               };
           } else {
               throw new Error(response.data.message || 'Error al actualizar portafolio');
           }

       } catch (error) {
           console.error('❌ Error al actualizar portafolio:', error);
           throw error;
       }
   }

   /**
    * 📋 Duplicar portafolio
    */
   async duplicar(portafolioId, nuevoNombre, opciones = {}) {
       try {
           if (!portafolioId) {
               throw new Error('ID de portafolio requerido');
           }

           if (!nuevoNombre) {
               throw new Error('Nombre para el nuevo portafolio requerido');
           }

           console.log('📋 Duplicando portafolio:', portafolioId);

           const url = this.baseURL + this.endpoints.DUPLICAR.replace(':id', portafolioId);
           const response = await window.api.post(url, {
               nuevoNombre: nuevoNombre.trim(),
               incluirDocumentos: opciones.incluirDocumentos || false,
               incluirProgreso: opciones.incluirProgreso || false,
               docenteDestino: opciones.docenteDestino,
               timestamp: Date.now()
           });

           if (response.data.success) {
               console.log('✅ Portafolio duplicado exitosamente');

               return {
                   success: true,
                   portafolioOriginal: response.data.portafolioOriginal,
                   portafolioNuevo: response.data.portafolioNuevo,
                   mensaje: response.data.message || 'Portafolio duplicado exitosamente'
               };
           } else {
               throw new Error(response.data.message || 'Error al duplicar portafolio');
           }

       } catch (error) {
           console.error('❌ Error al duplicar portafolio:', error);
           throw error;
       }
   }

   // ==========================================
   // 🛠️ MÉTODOS AUXILIARES
   // ==========================================

   /**
    * ✅ Validar datos de generación
    */
   validarDatosGeneracion(datos) {
       if (!datos.docenteId) {
           throw new Error('ID de docente requerido');
       }

       if (!datos.asignaturaId) {
           throw new Error('ID de asignatura requerido');
       }

       if (!datos.semestreId) {
           throw new Error('ID de semestre requerido');
       }

       if (!datos.cicloId) {
           throw new Error('ID de ciclo académico requerido');
       }
   }

   /**
    * ✅ Validar datos de portafolio
    */
   validarDatosPortafolio(datos) {
       if (!datos.nombre || datos.nombre.trim().length < 3) {
           throw new Error('El nombre del portafolio es requerido (mínimo 3 caracteres)');
       }

       if (!datos.docenteId) {
           throw new Error('ID de docente requerido');
       }

       if (!datos.cicloId) {
           throw new Error('ID de ciclo académico requerido');
       }
   }

   /**
    * 📊 Determinar granularidad para tendencias
    */
   determinarGranularidad(periodo) {
       const mapeoGranularidad = {
           '7d': 'dia',
           '30d': 'dia',
           '90d': 'semana',
           '180d': 'semana',
           '365d': 'mes'
       };

       return mapeoGranularidad[periodo] || 'dia';
   }

   /**
    * 🎨 Obtener icono según estado
    */
   obtenerIconoEstado(estado) {
       const iconos = {
           'activo': 'fas fa-check-circle text-success',
           'bloqueado': 'fas fa-lock text-warning',
           'archivado': 'fas fa-archive text-secondary',
           'borrador': 'fas fa-edit text-info'
       };

       return iconos[estado] || 'fas fa-folder text-primary';
   }

   /**
    * 📊 Calcular porcentaje de progreso
    */
   calcularPorcentajeProgreso(completados, total) {
       if (total === 0) return 0;
       return Math.round((completados / total) * 100);
   }

   /**
    * 🏷️ Formatear estado de progreso
    */
   formatearEstadoProgreso(porcentaje) {
       if (porcentaje >= 90) return { texto: 'Completado', clase: 'success' };
       if (porcentaje >= 70) return { texto: 'Avanzado', clase: 'info' };
       if (porcentaje >= 40) return { texto: 'En progreso', clase: 'warning' };
       return { texto: 'Iniciado', clase: 'secondary' };
   }
}

// 🚀 Crear instancia global
window.ServicioPortafolios = new ServicioPortafolios();

// 📤 Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
   module.exports = ServicioPortafolios;
}

console.log('📁 Servicio de portafolios inicializado correctamente');