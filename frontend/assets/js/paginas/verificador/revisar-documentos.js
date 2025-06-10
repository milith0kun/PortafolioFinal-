/**
 * 📋 REVISAR DOCUMENTOS - VERIFICADOR
 * Sistema Portafolio Docente UNSAAC
 * 
 * Interface completa para revisión de documentos
 * Incluye visor, anotaciones, observaciones, aprobación/rechazo y historial
 */

class RevisarDocumentos {
   constructor() {
       this.servicioPortafolios = new ServicioPortafolios();
       this.servicioUsuarios = new ServicioUsuarios();
       this.validadorFormularios = new ValidadorFormularios();
       this.sistemaModales = new SistemaModales();
       
       // Estado del componente
       this.estado = {
           documento: null,
           documentoId: null,
           historialVersiones: [],
           observaciones: [],
           anotaciones: [],
           metadatos: {},
           estadoRevision: {
               iniciado: false,
               completado: false,
               decision: null // 'aprobado', 'rechazado', 'requiere_correccion'
           },
           visor: {
               escala: 1,
               pagina: 1,
               totalPaginas: 1,
               modoVista: 'ajustar' // 'ajustar', 'ancho', 'original'
           },
           configuracion: {
               autoGuardado: true,
               mostrarMiniaturas: true,
               resaltarCambios: true
           }
       };
       
       // Referencias DOM
       this.elementos = {
           visorDocumento: null,
           panelObservaciones: null,
           formularioRevision: null,
           controlesPagina: null
       };
       
       this.intervalos = {
           autoGuardado: null
       };
       
       this.init();
   }

   /**
    * 🚀 Inicialización del componente
    */
   async init() {
       try {
           // Verificar permisos de verificador
           if (!SistemaAutenticacion.verificarPermiso('verificador')) {
               window.location.href = '/paginas/errores/403.html';
               return;
           }

           // Obtener ID del documento desde URL
           this.estado.documentoId = this.obtenerDocumentoIdDesdeURL();
           if (!this.estado.documentoId) {
               Utilidades.mostrarNotificacion('No se especificó un documento para revisar', 'error');
               window.location.href = '/paginas/verificador/cola-revision.html';
               return;
           }

           await this.inicializarInterfaz();
           await this.cargarDatosDocumento();
           this.configurarEventos();
           this.configurarVisor();
           this.iniciarAutoGuardado();
           
           Utilidades.mostrarNotificacion('Documento cargado para revisión', 'success');
       } catch (error) {
           console.error('Error inicializando revisión de documentos:', error);
           Utilidades.mostrarNotificacion('Error cargando el documento', 'error');
       }
   }

   /**
    * 🎨 Inicializar interfaz de usuario
    */
   async inicializarInterfaz() {
       await this.renderizarInterfaz();
       this.configurarElementosDOM();
       this.actualizarBreadcrumb();
   }

   /**
    * 🎨 Renderizar interfaz completa
    */
   async renderizarInterfaz() {
       const container = document.querySelector('#revisar-content');
       if (!container) return;

       container.innerHTML = `
           <div class="row g-4">
               <!-- Header del documento -->
               <div class="col-12">
                   ${this.renderizarHeaderDocumento()}
               </div>
               
               <!-- Visor principal -->
               <div class="col-lg-9">
                   <div class="card h-100">
                       <div class="card-header d-flex justify-content-between align-items-center">
                           <div>
                               <h5 class="card-title mb-0">
                                   <i class="fas fa-file-pdf text-danger me-2"></i>
                                   <span id="nombre-documento">Cargando...</span>
                               </h5>
                           </div>
                           <div class="btn-group">
                               ${this.renderizarControlesVisor()}
                           </div>
                       </div>
                       <div class="card-body p-0 position-relative">
                           <div id="toolbar-visor" class="bg-light border-bottom p-2">
                               ${this.renderizarToolbarVisor()}
                           </div>
                           <div id="visor-documento" class="document-viewer">
                               ${this.renderizarCargandoVisor()}
                           </div>
                       </div>
                   </div>
               </div>
               
               <!-- Panel lateral -->
               <div class="col-lg-3">
                   <!-- Información del documento -->
                   <div class="card mb-3">
                       <div class="card-header">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-info-circle me-2"></i>Información
                           </h6>
                       </div>
                       <div class="card-body">
                           <div id="info-documento">
                               ${this.renderizarCargandoInfo()}
                           </div>
                       </div>
                   </div>
                   
                   <!-- Observaciones -->
                   <div class="card mb-3">
                       <div class="card-header d-flex justify-content-between align-items-center">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-comments me-2"></i>Observaciones
                               <span id="contador-observaciones" class="badge bg-primary ms-1">0</span>
                           </h6>
                           <button type="button" class="btn btn-sm btn-primary" onclick="revisarDocumentos.nuevaObservacion()">
                               <i class="fas fa-plus"></i>
                           </button>
                       </div>
                       <div class="card-body p-0">
                           <div id="lista-observaciones" style="max-height: 300px; overflow-y: auto;">
                               ${this.renderizarCargandoObservaciones()}
                           </div>
                       </div>
                   </div>
                   
                   <!-- Historial de versiones -->
                   <div class="card mb-3">
                       <div class="card-header">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-history me-2"></i>Historial
                           </h6>
                       </div>
                       <div class="card-body p-0">
                           <div id="historial-versiones" style="max-height: 200px; overflow-y: auto;">
                               ${this.renderizarCargandoHistorial()}
                           </div>
                       </div>
                   </div>
                   
                   <!-- Acciones de revisión -->
                   <div class="card">
                       <div class="card-header">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-gavel me-2"></i>Decisión de Revisión
                           </h6>
                       </div>
                       <div class="card-body">
                           ${this.renderizarFormularioDecision()}
                       </div>
                   </div>
               </div>
           </div>
           
           <!-- Modales -->
           ${this.renderizarModales()}
       `;
   }

   /**
    * 📋 Renderizar header del documento
    */
   renderizarHeaderDocumento() {
       return `
           <div class="card bg-light" id="header-documento">
               <div class="card-body">
                   <div class="row align-items-center">
                       <div class="col-md-8">
                           <div class="d-flex align-items-center mb-2">
                               <button type="button" class="btn btn-outline-secondary me-3" 
                                       onclick="window.history.back()" title="Volver">
                                   <i class="fas fa-arrow-left"></i>
                               </button>
                               <div>
                                   <h4 class="card-title mb-1">
                                       <i class="fas fa-search me-2"></i>Revisando Documento
                                   </h4>
                                   <p class="card-text text-muted mb-0">
                                       Revisa el documento y proporciona observaciones constructivas
                                   </p>
                               </div>
                           </div>
                       </div>
                       <div class="col-md-4 text-end">
                           <div id="estado-revision" class="mb-2">
                               <span class="badge bg-warning">En Revisión</span>
                           </div>
                           <div class="btn-group">
                               <button type="button" class="btn btn-outline-info btn-sm" 
                                       onclick="revisarDocumentos.descargarDocumento()" title="Descargar">
                                   <i class="fas fa-download"></i>
                               </button>
                               <button type="button" class="btn btn-outline-secondary btn-sm" 
                                       onclick="revisarDocumentos.imprimirDocumento()" title="Imprimir">
                                   <i class="fas fa-print"></i>
                               </button>
                               <button type="button" class="btn btn-outline-primary btn-sm" 
                                       onclick="revisarDocumentos.compartirDocumento()" title="Compartir">
                                   <i class="fas fa-share"></i>
                               </button>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 🔧 Renderizar controles del visor
    */
   renderizarControlesVisor() {
       return `
           <button type="button" class="btn btn-outline-secondary btn-sm" 
                   onclick="revisarDocumentos.alternarPantallaCompleta()" title="Pantalla completa">
               <i class="fas fa-expand"></i>
           </button>
           <button type="button" class="btn btn-outline-secondary btn-sm" 
                   onclick="revisarDocumentos.alternarMiniaturas()" title="Miniaturas">
               <i class="fas fa-th-large"></i>
           </button>
           <button type="button" class="btn btn-outline-secondary btn-sm" 
                   onclick="revisarDocumentos.configurarVisor()" title="Configurar">
               <i class="fas fa-cog"></i>
           </button>
       `;
   }

   /**
    * 🛠️ Renderizar toolbar del visor
    */
   renderizarToolbarVisor() {
       return `
           <div class="d-flex justify-content-between align-items-center">
               <div class="d-flex align-items-center">
                   <!-- Navegación de páginas -->
                   <div class="btn-group me-3">
                       <button type="button" class="btn btn-sm btn-outline-secondary" 
                               onclick="revisarDocumentos.paginaAnterior()" id="btn-pagina-anterior">
                           <i class="fas fa-chevron-left"></i>
                       </button>
                       <span class="btn btn-sm btn-outline-secondary disabled">
                           <span id="pagina-actual">1</span> / <span id="total-paginas">1</span>
                       </span>
                       <button type="button" class="btn btn-sm btn-outline-secondary" 
                               onclick="revisarDocumentos.paginaSiguiente()" id="btn-pagina-siguiente">
                           <i class="fas fa-chevron-right"></i>
                       </button>
                   </div>
                   
                   <!-- Control de zoom -->
                   <div class="btn-group me-3">
                       <button type="button" class="btn btn-sm btn-outline-secondary" 
                               onclick="revisarDocumentos.zoomOut()">
                           <i class="fas fa-search-minus"></i>
                       </button>
                       <span class="btn btn-sm btn-outline-secondary disabled">
                           <span id="nivel-zoom">100%</span>
                       </span>
                       <button type="button" class="btn btn-sm btn-outline-secondary" 
                               onclick="revisarDocumentos.zoomIn()">
                           <i class="fas fa-search-plus"></i>
                       </button>
                   </div>
                   
                   <!-- Modos de vista -->
                   <div class="btn-group">
                       <button type="button" class="btn btn-sm btn-outline-secondary active" 
                               data-modo="ajustar" onclick="revisarDocumentos.cambiarModoVista('ajustar')">
                           <i class="fas fa-expand-arrows-alt"></i>
                       </button>
                       <button type="button" class="btn btn-sm btn-outline-secondary" 
                               data-modo="ancho" onclick="revisarDocumentos.cambiarModoVista('ancho')">
                           <i class="fas fa-arrows-alt-h"></i>
                       </button>
                       <button type="button" class="btn btn-sm btn-outline-secondary" 
                               data-modo="original" onclick="revisarDocumentos.cambiarModoVista('original')">
                           <i class="fas fa-crop"></i>
                       </button>
                   </div>
               </div>
               
               <div class="d-flex align-items-center">
                   <!-- Herramientas de anotación -->
                   <div class="btn-group">
                       <button type="button" class="btn btn-sm btn-outline-warning" 
                               onclick="revisarDocumentos.activarHerramientaAnotacion('resaltar')" 
                               title="Resaltar texto">
                           <i class="fas fa-highlighter"></i>
                       </button>
                       <button type="button" class="btn btn-sm btn-outline-info" 
                               onclick="revisarDocumentos.activarHerramientaAnotacion('comentario')" 
                               title="Agregar comentario">
                           <i class="fas fa-comment"></i>
                       </button>
                       <button type="button" class="btn btn-sm btn-outline-danger" 
                               onclick="revisarDocumentos.activarHerramientaAnotacion('correccion')" 
                               title="Marcar corrección">
                           <i class="fas fa-times-circle"></i>
                       </button>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 📄 Renderizar visor en estado de carga
    */
   renderizarCargandoVisor() {
       return `
           <div class="d-flex justify-content-center align-items-center" style="height: 600px;">
               <div class="text-center">
                   <div class="spinner-border text-primary mb-3" role="status">
                       <span class="visually-hidden">Cargando...</span>
                   </div>
                   <h5 class="text-muted">Cargando documento...</h5>
                   <p class="text-muted">Por favor espera mientras preparamos el visor</p>
               </div>
           </div>
       `;
   }

   /**
    * ℹ️ Renderizar información en estado de carga
    */
   renderizarCargandoInfo() {
       return `
           <div class="placeholder-glow">
               <div class="placeholder col-12 mb-2"></div>
               <div class="placeholder col-8 mb-2"></div>
               <div class="placeholder col-10"></div>
           </div>
       `;
   }

   /**
    * 💬 Renderizar observaciones en estado de carga
    */
   renderizarCargandoObservaciones() {
       return `
           <div class="text-center py-3">
               <div class="spinner-border spinner-border-sm text-muted" role="status"></div>
               <p class="text-muted small mb-0 mt-2">Cargando observaciones...</p>
           </div>
       `;
   }

   /**
    * 📝 Renderizar historial en estado de carga
    */
   renderizarCargandoHistorial() {
       return `
           <div class="text-center py-3">
               <div class="spinner-border spinner-border-sm text-muted" role="status"></div>
               <p class="text-muted small mb-0 mt-2">Cargando historial...</p>
           </div>
       `;
   }

   /**
    * ⚖️ Renderizar formulario de decisión
    */
   renderizarFormularioDecision() {
       return `
           <form id="form-decision" novalidate>
               <div class="mb-3">
                   <label class="form-label">Decisión de Revisión</label>
                   <div class="btn-group w-100" role="group">
                       <input type="radio" class="btn-check" name="decision" value="aprobado" id="decision-aprobado">
                       <label class="btn btn-outline-success" for="decision-aprobado">
                           <i class="fas fa-check me-1"></i>Aprobar
                       </label>
                       
                       <input type="radio" class="btn-check" name="decision" value="requiere_correccion" id="decision-correccion">
                       <label class="btn btn-outline-warning" for="decision-correccion">
                           <i class="fas fa-edit me-1"></i>Corregir
                       </label>
                       
                       <input type="radio" class="btn-check" name="decision" value="rechazado" id="decision-rechazado">
                       <label class="btn btn-outline-danger" for="decision-rechazado">
                           <i class="fas fa-times me-1"></i>Rechazar
                       </label>
                   </div>
               </div>
               
               <div class="mb-3">
                   <label class="form-label">Comentario de Revisión</label>
                   <textarea class="form-control" id="comentario-revision" name="comentario" rows="4" 
                             placeholder="Proporciona un comentario detallado sobre tu decisión..."></textarea>
                   <div class="form-text">Este comentario será visible para el docente</div>
               </div>
               
               <div class="mb-3" id="campos-adicionales" style="display: none;">
                   <!-- Se mostrarán campos adicionales según la decisión -->
               </div>
               
               <div class="mb-3">
                   <div class="form-check">
                       <input class="form-check-input" type="checkbox" id="notificar-docente" checked>
                       <label class="form-check-label" for="notificar-docente">
                           Notificar al docente por email
                       </label>
                   </div>
               </div>
               
               <div class="d-grid gap-2">
                   <button type="button" class="btn btn-primary" onclick="revisarDocumentos.completarRevision()" 
                           id="btn-completar-revision" disabled>
                       <i class="fas fa-gavel me-1"></i>Completar Revisión
                   </button>
                   <button type="button" class="btn btn-outline-secondary" onclick="revisarDocumentos.guardarBorrador()">
                       <i class="fas fa-save me-1"></i>Guardar Borrador
                   </button>
               </div>
           </form>
       `;
   }

   /**
    * 🎭 Renderizar modales del sistema
    */
   renderizarModales() {
       return `
           <!-- Modal Nueva Observación -->
           <div class="modal fade" id="modal-observacion" tabindex="-1">
               <div class="modal-dialog">
                   <div class="modal-content">
                       <div class="modal-header">
                           <h5 class="modal-title">
                               <i class="fas fa-comment me-2"></i>Nueva Observación
                           </h5>
                           <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                       </div>
                       <div class="modal-body">
                           <form id="form-observacion">
                               <div class="mb-3">
                                   <label class="form-label">Tipo de Observación</label>
                                   <select class="form-select" name="tipo" required>
                                       <option value="">Seleccionar tipo...</option>
                                       <option value="general">Observación General</option>
                                       <option value="correccion">Corrección Necesaria</option>
                                       <option value="sugerencia">Sugerencia</option>
                                       <option value="felicitacion">Felicitación</option>
                                   </select>
                               </div>
                               
                               <div class="mb-3">
                                   <label class="form-label">Contenido de la Observación</label>
                                   <textarea class="form-control" name="contenido" rows="4" required
                                             placeholder="Escribe tu observación aquí..."></textarea>
                               </div>
                               
                               <div class="mb-3">
                                   <label class="form-label">Prioridad</label>
                                   <select class="form-select" name="prioridad">
                                       <option value="baja">Baja</option>
                                       <option value="media" selected>Media</option>
                                       <option value="alta">Alta</option>
                                       <option value="critica">Crítica</option>
                                   </select>
                               </div>
                               
                               <div class="mb-3">
                                   <div class="form-check">
                                       <input class="form-check-input" type="checkbox" name="requiere_respuesta" id="requiere-respuesta">
                                       <label class="form-check-label" for="requiere-respuesta">
                                           Requiere respuesta del docente
                                       </label>
                                   </div>
                               </div>
                               
                               <div class="mb-3">
                                   <div class="form-check">
                                       <input class="form-check-input" type="checkbox" name="es_publica" id="es-publica" checked>
                                       <label class="form-check-label" for="es-publica">
                                           Observación pública (visible para el docente)
                                       </label>
                                   </div>
                               </div>
                           </form>
                       </div>
                       <div class="modal-footer">
                           <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                           <button type="button" class="btn btn-primary" onclick="revisarDocumentos.guardarObservacion()">
                               <i class="fas fa-save me-1"></i>Guardar Observación
                           </button>
                       </div>
                   </div>
               </div>
           </div>
           
           <!-- Modal Configuración del Visor -->
           <div class="modal fade" id="modal-configuracion-visor" tabindex="-1">
               <div class="modal-dialog">
                   <div class="modal-content">
                       <div class="modal-header">
                           <h5 class="modal-title">
                               <i class="fas fa-cog me-2"></i>Configuración del Visor
                           </h5>
                           <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                       </div>
                       <div class="modal-body">
                           <div class="mb-3">
                               <label class="form-label">Modo de Vista por Defecto</label>
                               <select class="form-select" id="config-modo-vista">
                                   <option value="ajustar">Ajustar a ventana</option>
                                   <option value="ancho">Ajustar ancho</option>
                                   <option value="original">Tamaño original</option>
                               </select>
                           </div>
                           
                           <div class="mb-3">
                               <div class="form-check form-switch">
                                   <input class="form-check-input" type="checkbox" id="config-autoguardado" checked>
                                   <label class="form-check-label" for="config-autoguardado">
                                       Auto-guardado de observaciones
                                   </label>
                               </div>
                           </div>
                           
                           <div class="mb-3">
                               <div class="form-check form-switch">
                                   <input class="form-check-input" type="checkbox" id="config-miniaturas" checked>
                                   <label class="form-check-label" for="config-miniaturas">
                                       Mostrar panel de miniaturas
                                   </label>
                               </div>
                           </div>
                           
                           <div class="mb-3">
                               <div class="form-check form-switch">
                                   <input class="form-check-input" type="checkbox" id="config-resaltar" checked>
                                   <label class="form-check-label" for="config-resaltar">
                                       Resaltar cambios y anotaciones
                                   </label>
                               </div>
                           </div>
                       </div>
                       <div class="modal-footer">
                           <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                           <button type="button" class="btn btn-primary" onclick="revisarDocumentos.guardarConfiguracion()">
                               <i class="fas fa-save me-1"></i>Guardar
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   // =====================================
   // MÉTODOS DE CARGA DE DATOS
   // =====================================

   /**
    * 📄 Cargar datos del documento
    */
   async cargarDatosDocumento() {
       await Promise.all([
           this.cargarDocumento(),
           this.cargarObservaciones(),
           this.cargarHistorialVersiones(),
           this.inicializarEstadoRevision()
       ]);
   }

   /**
    * 📋 Cargar documento principal
    */
   async cargarDocumento() {
       try {
           const response = await ClienteAPI.get(`/documentos/${this.estado.documentoId}/revisar`);
           this.estado.documento = response.data;
           this.estado.metadatos = response.data.metadatos || {};
           
           await this.renderizarInformacionDocumento();
           await this.cargarVisorDocumento();
           
       } catch (error) {
           console.error('Error cargando documento:', error);
           Utilidades.mostrarNotificacion('Error cargando el documento', 'error');
           window.location.href = '/paginas/verificador/cola-revision.html';
       }
   }

   /**
    * 💬 Cargar observaciones existentes
    */
   async cargarObservaciones() {
       try {
           const response = await ClienteAPI.get(`/observaciones/documento/${this.estado.documentoId}`);
           this.estado.observaciones = response.data || [];
           this.renderizarListaObservaciones();
       } catch (error) {
           console.error('Error cargando observaciones:', error);
       }
   }

   /**
    * 📜 Cargar historial de versiones
    */
   async cargarHistorialVersiones() {
       try {
           const response = await ClienteAPI.get(`/documentos/${this.estado.documentoId}/historial`);
           this.estado.historialVersiones = response.data || [];
           this.renderizarHistorialVersiones();
       } catch (error) {
           console.error('Error cargando historial:', error);
       }
   }

   /**
    * 🔄 Inicializar estado de revisión
    */
   async inicializarEstadoRevision() {
       try {
           const response = await ClienteAPI.get(`/verificacion/${this.estado.documentoId}/estado`);
           this.estado.estadoRevision = { ...this.estado.estadoRevision, ...response.data };
           this.actualizarEstadoEnInterfaz();
       } catch (error) {
           console.warn('Error cargando estado de revisión:', error);
       }
   }

   /**
    * 🎨 Renderizar información del documento
    */
   async renderizarInformacionDocumento() {
       const doc = this.estado.documento;
       if (!doc) return;
       
       // Actualizar nombre en header
       document.getElementById('nombre-documento').textContent = doc.nombre_archivo;
       
       // Actualizar información detallada
       const infoContainer = document.getElementById('info-documento');
       if (infoContainer) {
           infoContainer.innerHTML = `
               <div class="mb-3">
                   <h6 class="text-primary mb-2">
                       <i class="fas fa-file-alt me-1"></i>${doc.nombre_archivo}
                   </h6>
                   <small class="text-muted d-block">${doc.tipo_documento || 'Sin clasificar'}</small>
               </div>
               
               <div class="row g-2 mb-3">
                   <div class="col-6">
                       <small class="text-muted d-block">Tamaño</small>
                       <span class="fw-medium">${Utilidades.formatearTamanoArchivo(doc.tamaño_archivo)}</span>
                   </div>
                   <div class="col-6">
                       <small class="text-muted d-block">Formato</small>
                       <span class="fw-medium">${doc.formato?.toUpperCase() || 'N/A'}</span>
                   </div>
               </div>
               
               <div class="mb-3">
                   <small class="text-muted d-block">Docente</small>
                   <div class="d-flex align-items-center">
                       <div class="avatar-sm bg-light rounded-circle me-2 d-flex align-items-center justify-content-center">
                           <i class="fas fa-user text-muted"></i>
                       </div>
                       <div>
                           <div class="fw-medium">${doc.docente_nombre}</div>
                           <small class="text-muted">${doc.docente_email}</small>
                       </div>
                   </div>
               </div>
               
               <div class="mb-3">
                   <small class="text-muted d-block">Asignatura</small>
                   <span class="fw-medium">${doc.asignatura_nombre}</span>
               </div>
               
               <div class="mb-3">
                   <small class="text-muted d-block">Subido</small>
                   <span class="fw-medium">${Utilidades.formatearFechaCompleta(doc.fecha_subida)}</span>
               </div>
               
               ${doc.descripcion ? `
                   <div class="mb-3">
                       <small class="text-muted d-block">Descripción</small>
                       <p class="small mb-0">${doc.descripcion}</p>
                   </div>
               ` : ''}
               
               ${doc.etiquetas ? `
                   <div class="mb-3">
                       <small class="text-muted d-block">Etiquetas</small>
                       <div class="d-flex flex-wrap gap-1">
                           ${doc.etiquetas.split(',').map(tag => 
                               `<span class="badge bg-light text-dark">${tag.trim()}</span>`
                           ).join('')}
                       </div>
                   </div>
               ` : ''}
           `;
       }
   }

   /**
    * 🖥️ Cargar visor de documento
    */
   async cargarVisorDocumento() {
       const visorContainer = document.getElementById('visor-documento');
       if (!visorContainer) return;
       
       try {
           // Para PDFs, usamos PDF.js
           if (this.estado.documento.formato === 'pdf') {
               await this.cargarVisorPDF();
           } else if (['jpg', 'png'].includes(this.estado.documento.formato)) {
               await this.cargarVisorImagen();
           } else {
               await this.cargarVisorGenerico();
           }
       } catch (error) {
           console.error('Error cargando visor:', error);
           visorContainer.innerHTML = this.renderizarErrorVisor();
       }
   }

   /**
    * 📄 Cargar visor PDF
    */
   async cargarVisorPDF() {
       const visorContainer = document.getElementById('visor-documento');
       
       visorContainer.innerHTML = `
           <div class="pdf-viewer-container">
               <iframe src="/api/v1/documentos/${this.estado.documentoId}/preview" 
                       class="w-100 border-0" 
                       style="height: 600px;"
                       title="Visor de PDF">
               </iframe>
           </div>
       `;
       
       // Actualizar controles
       this.estado.visor.totalPaginas = this.estado.documento.paginas || 1;
       this.actualizarControlesPagina();
   }

   /**
    * 🖼️ Cargar visor de imagen
    */
   async cargarVisorImagen() {
       const visorContainer = document.getElementById('visor-documento');
       
       visorContainer.innerHTML = `
           <div class="image-viewer-container text-center">
               <img src="/api/v1/documentos/${this.estado.documentoId}/preview" 
                    class="img-fluid" 
                    style="max-height: 600px;"
                    alt="${this.estado.documento.nombre_archivo}">
           </div>
       `;
       
       this.estado.visor.totalPaginas = 1;
       this.actualizarControlesPagina();
   }

   /**
    * 📋 Cargar visor genérico
    */
   async cargarVisorGenerico() {
       const visorContainer = document.getElementById('visor-documento');
       
       visorContainer.innerHTML = `
           <div class="generic-viewer-container text-center py-5">
               <i class="fas fa-file-alt fa-4x text-muted mb-3"></i>
               <h5 class="text-muted">Vista previa no disponible</h5>
               <p class="text-muted">Este tipo de archivo no admite vista previa en el navegador</p>
               <button type="button" class="btn btn-primary" onclick="revisarDocumentos.descargarDocumento()">
                   <i class="fas fa-download me-1"></i>Descargar para revisar
               </button>
           </div>
       `;
   }

   /**
    * ❌ Renderizar error del visor
    */
   renderizarErrorVisor() {
       return `
           <div class="error-viewer-container text-center py-5">
               <i class="fas fa-exclamation-triangle fa-4x text-danger mb-3"></i>
               <h5 class="text-danger">Error cargando el visor</h5>
               <p class="text-muted">No se pudo cargar la vista previa del documento</p>
               <div class="btn-group">
                   <button type="button" class="btn btn-outline-primary" onclick="revisarDocumentos.recargarVisor()">
                       <i class="fas fa-sync-alt me-1"></i>Reintentar
                   </button>
                   <button type="button" class="btn btn-primary" onclick="revisarDocumentos.descargarDocumento()">
                       <i class="fas fa-download me-1"></i>Descargar
                   </button>
               </div>
           </div>
       `;
   }

   /**
    * 💬 Renderizar lista de observaciones
    */
   renderizarListaObservaciones() {
       const container = document.getElementById('lista-observaciones');
       if (!container) return;
       
       if (this.estado.observaciones.length === 0) {
           container.innerHTML = `
               <div class="text-center py-3">
                   <i class="fas fa-comments fa-2x text-muted mb-2"></i>
                   <p class="text-muted small mb-0">No hay observaciones</p>
                   <button type="button" class="btn btn-sm btn-outline-primary mt-2" 
                           onclick="revisarDocumentos.nuevaObservacion()">
                       <i class="fas fa-plus me-1"></i>Agregar primera observación
                   </button>
               </div>
           `;
           return;
       }
       
       container.innerHTML = `
           <div class="list-group list-group-flush">
               ${this.estado.observaciones.map(obs => this.renderizarItemObservacion(obs)).join('')}
           </div>
       `;
       
       // Actualizar contador
       document.getElementById('contador-observaciones').textContent = this.estado.observaciones.length;
   }

   /**
    * 💬 Renderizar item individual de observación
    */
   renderizarItemObservacion(observacion) {
       const tipoClass = this.obtenerClaseTipoObservacion(observacion.tipo);
       const prioridadClass = this.obtenerClasePrioridad(observacion.prioridad);
       
       return `
           <div class="list-group-item list-group-item-action border-start border-3 border-${tipoClass}">
               <div class="d-flex w-100 justify-content-between align-items-start">
                   <div class="flex-grow-1">
                       <div class="d-flex align-items-center mb-1">
                           <span class="badge bg-${tipoClass} me-2">${observacion.tipo}</span>
                           <span class="badge bg-${prioridadClass}">${observacion.prioridad}</span>
                           ${observacion.requiere_respuesta ? 
                               '<span class="badge bg-warning ms-1">Requiere respuesta</span>' : ''
                           }
                       </div>
                       <p class="mb-1 small">${observacion.contenido}</p>
                       <small class="text-muted">
                           <i class="fas fa-clock me-1"></i>
                           ${Utilidades.formatearFechaRelativa(observacion.creado_en)}
                       </small>
                   </div>
                   <div class="btn-group-vertical btn-group-sm">
                       <button type="button" class="btn btn-outline-info btn-sm" 
                               onclick="revisarDocumentos.editarObservacion('${observacion.id}')" 
                               title="Editar">
                           <i class="fas fa-edit"></i>
                       </button>
                       <button type="button" class="btn btn-outline-danger btn-sm" 
                               onclick="revisarDocumentos.eliminarObservacion('${observacion.id}')" 
                               title="Eliminar">
                           <i class="fas fa-trash"></i>
                       </button>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 📜 Renderizar historial de versiones
    */
   renderizarHistorialVersiones() {
       const container = document.getElementById('historial-versiones');
       if (!container) return;
       
       if (this.estado.historialVersiones.length === 0) {
           container.innerHTML = `
               <div class="text-center py-3">
                   <i class="fas fa-history fa-2x text-muted mb-2"></i>
                   <p class="text-muted small mb-0">Sin historial de versiones</p>
               </div>
           `;
           return;
       }
       
       container.innerHTML = `
           <div class="list-group list-group-flush">
               ${this.estado.historialVersiones.map((version, index) => 
                   this.renderizarItemHistorial(version, index === 0)
               ).join('')}
           </div>
       `;
   }

   /**
    * 📜 Renderizar item del historial
    */
   renderizarItemHistorial(version, esActual) {
       return `
           <div class="list-group-item ${esActual ? 'bg-light' : ''}">
               <div class="d-flex justify-content-between align-items-start">
                   <div>
                       <h6 class="mb-1 small">
                           Versión ${version.version}
                           ${esActual ? '<span class="badge bg-success ms-1">Actual</span>' : ''}
                       </h6>
                       <p class="mb-1 small text-muted">${version.descripcion || 'Sin comentarios'}</p>
                       <small class="text-muted">
                           ${Utilidades.formatearFechaRelativa(version.fecha_subida)}
                       </small>
                   </div>
                   ${!esActual ? `
                       <button type="button" class="btn btn-outline-info btn-sm" 
                               onclick="revisarDocumentos.compararVersiones('${version.id}')" 
                               title="Comparar">
                           <i class="fas fa-exchange-alt"></i>
                       </button>
                   ` : ''}
               </div>
           </div>
       `;
   }

   // =====================================
   // MÉTODOS DE ACCIONES PRINCIPALES
   // =====================================

   /**
    * 💬 Nueva observación
    */
   nuevaObservacion() {
       // Limpiar formulario
       const form = document.getElementById('form-observacion');
       if (form) {
           form.reset();
       }
       
       // Mostrar modal
       const modal = new bootstrap.Modal(document.getElementById('modal-observacion'));
       modal.show();
   }

   /**
    * 💾 Guardar observación
    */
   async guardarObservacion() {
       try {
           const form = document.getElementById('form-observacion');
           if (!form || !this.validarFormulario(form)) {
               return;
           }
           
           const formData = new FormData(form);
           const datosObservacion = Object.fromEntries(formData.entries());
           datosObservacion.archivo_id = this.estado.documentoId;
           
           const response = await ClienteAPI.post('/observaciones', datosObservacion);
           
           Utilidades.mostrarNotificacion('Observación guardada correctamente', 'success');
           
           // Cerrar modal y recargar observaciones
           const modal = bootstrap.Modal.getInstance(document.getElementById('modal-observacion'));
           modal.hide();
           
           await this.cargarObservaciones();
           
       } catch (error) {
           console.error('Error guardando observación:', error);
           Utilidades.mostrarNotificacion('Error al guardar la observación', 'error');
       }
   }

   /**
    * ⚖️ Completar revisión
    */
   async completarRevision() {
       try {
           const form = document.getElementById('form-decision');
           if (!form || !this.validarFormulario(form)) {
               return;
           }
           
           const formData = new FormData(form);
           const decision = formData.get('decision');
           const comentario = formData.get('comentario');
           const notificarDocente = formData.has('notificar-docente');
           
           if (!decision) {
               Utilidades.mostrarNotificacion('Debes seleccionar una decisión', 'warning');
               return;
           }
           
           const confirmar = await Utilidades.confirmar(
               'Completar Revisión',
               `¿Estás seguro de que deseas ${decision} este documento? Esta acción no se puede deshacer.`,
               'question'
           );
           
           if (!confirmar) return;
           
           const datosRevision = {
               decision,
               comentario,
               notificar_docente: notificarDocente,
               observaciones_ids: this.estado.observaciones.map(obs => obs.id)
           };
           
           await ClienteAPI.post(`/verificacion/${this.estado.documentoId}/completar`, datosRevision);
           
           Utilidades.mostrarNotificacion('Revisión completada correctamente', 'success');
           
           // Redirigir a la cola de revisión
           setTimeout(() => {
               window.location.href = '/paginas/verificador/cola-revision.html';
           }, 2000);
           
       } catch (error) {
           console.error('Error completando revisión:', error);
           Utilidades.mostrarNotificacion('Error al completar la revisión', 'error');
       }
   }

   /**
    * 💾 Guardar borrador
    */
   async guardarBorrador() {
       try {
           const form = document.getElementById('form-decision');
           const formData = new FormData(form);
           
           const borrador = {
               decision: formData.get('decision'),
               comentario: formData.get('comentario'),
               estado: 'borrador'
           };
           
           await ClienteAPI.post(`/verificacion/${this.estado.documentoId}/borrador`, borrador);
           Utilidades.mostrarNotificacion('Borrador guardado', 'info');
           
       } catch (error) {
           console.error('Error guardando borrador:', error);
           Utilidades.mostrarNotificacion('Error al guardar el borrador', 'error');
       }
   }

   /**
    * 📥 Descargar documento
    */
   async descargarDocumento() {
       try {
           const url = `/api/v1/documentos/${this.estado.documentoId}/descargar`;
           const link = document.createElement('a');
           link.href = url;
           link.download = this.estado.documento.nombre_archivo;
           document.body.appendChild(link);
           link.click();
           document.body.removeChild(link);
           
       } catch (error) {
           console.error('Error descargando documento:', error);
           Utilidades.mostrarNotificación('Error al descargar el documento', 'error');
       }
   }

   // =====================================
   // MÉTODOS DEL VISOR
   // =====================================

   /**
    * ➡️ Página siguiente
    */
   paginaSiguiente() {
       if (this.estado.visor.pagina < this.estado.visor.totalPaginas) {
           this.estado.visor.pagina++;
           this.actualizarControlesPagina();
           this.cargarPagina(this.estado.visor.pagina);
       }
   }

   /**
    * ⬅️ Página anterior
    */
   paginaAnterior() {
       if (this.estado.visor.pagina > 1) {
           this.estado.visor.pagina--;
           this.actualizarControlesPagina();
           this.cargarPagina(this.estado.visor.pagina);
       }
   }

   /**
    * 🔍 Zoom in
    */
   zoomIn() {
       this.estado.visor.escala = Math.min(3, this.estado.visor.escala + 0.1);
       this.aplicarZoom();
   }

   /**
    * 🔍 Zoom out
    */
   zoomOut() {
       this.estado.visor.escala = Math.max(0.1, this.estado.visor.escala - 0.1);
       this.aplicarZoom();
   }

   /**
    * 📐 Cambiar modo de vista
    */
   cambiarModoVista(modo) {
       this.estado.visor.modoVista = modo;
       
       // Actualizar botones
       document.querySelectorAll('[data-modo]').forEach(btn => {
           btn.classList.toggle('active', btn.dataset.modo === modo);
       });
       
       this.aplicarModoVista();
   }

   // =====================================
   // MÉTODOS AUXILIARES
   // =====================================

   /**
    * 🆔 Obtener ID del documento desde URL
    */
   obtenerDocumentoIdDesdeURL() {
       const urlParams = new URLSearchParams(window.location.search);
       return urlParams.get('documento');
   }

   /**
    * 🎨 Obtener clase para tipo de observación
    */
   obtenerClaseTipoObservacion(tipo) {
       const clases = {
           'general': 'info',
           'correccion': 'warning',
           'sugerencia': 'primary',
           'felicitacion': 'success'
       };
       return clases[tipo] || 'secondary';
   }

   /**
    * 🎨 Obtener clase para prioridad
    */
   obtenerClasePrioridad(prioridad) {
       const clases = {
           'baja': 'light',
           'media': 'info',
           'alta': 'warning',
           'critica': 'danger'
       };
       return clases[prioridad] || 'secondary';
   }

   /**
    * 🔧 Configurar elementos DOM
    */
   configurarElementosDOM() {
       this.elementos = {
           visorDocumento: document.getElementById('visor-documento'),
           panelObservaciones: document.getElementById('lista-observaciones'),
           formularioRevision: document.getElementById('form-decision'),
           controlesPagina: document.getElementById('toolbar-visor')
       };
   }

   /**
    * ⚙️ Configurar eventos
    */
   configurarEventos() {
       // Escuchar cambios en la decisión para habilitar/deshabilitar botón
       document.querySelectorAll('input[name="decision"]').forEach(radio => {
           radio.addEventListener('change', () => {
               const boton = document.getElementById('btn-completar-revision');
               if (boton) {
                   boton.disabled = false;
               }
               
               // Mostrar campos adicionales según la decisión
               this.mostrarCamposAdicionales(radio.value);
           });
       });
       
       // Auto-guardado del borrador
       const comentario = document.getElementById('comentario-revision');
       if (comentario) {
           comentario.addEventListener('input', Utilidades.debounce(() => {
               if (this.estado.configuracion.autoGuardado) {
                   this.guardarBorrador();
               }
           }, 2000));
       }
   }

   /**
    * 🔄 Actualizar controles de página
    */
   actualizarControlesPagina() {
       const paginaActual = document.getElementById('pagina-actual');
       const totalPaginas = document.getElementById('total-paginas');
       const btnAnterior = document.getElementById('btn-pagina-anterior');
       const btnSiguiente = document.getElementById('btn-pagina-siguiente');
       
       if (paginaActual) paginaActual.textContent = this.estado.visor.pagina;
       if (totalPaginas) totalPaginas.textContent = this.estado.visor.totalPaginas;
       
       if (btnAnterior) btnAnterior.disabled = this.estado.visor.pagina === 1;
       if (btnSiguiente) btnSiguiente.disabled = this.estado.visor.pagina === this.estado.visor.totalPaginas;
   }

   /**
    * 🔄 Iniciar auto-guardado
    */
   iniciarAutoGuardado() {
       if (!this.estado.configuracion.autoGuardado) return;
       
       this.intervalos.autoGuardado = setInterval(() => {
           this.guardarBorrador();
       }, 30000); // Cada 30 segundos
   }

   /**
    * 🔄 Actualizar breadcrumb
    */
   actualizarBreadcrumb() {
       const breadcrumb = document.querySelector('#breadcrumb');
       if (breadcrumb) {
           breadcrumb.innerHTML = `
               <li class="breadcrumb-item">
                   <i class="fas fa-shield-alt me-1"></i>Verificador
               </li>
               <li class="breadcrumb-item">
                   <a href="/paginas/verificador/cola-revision.html">Cola de Revisión</a>
               </li>
               <li class="breadcrumb-item active">Revisar Documento</li>
           `;
       }
   }

   /**
    * 🧹 Cleanup al destruir
    */
   destruir() {
       Object.values(this.intervalos).forEach(intervalo => {
           if (intervalo) clearInterval(intervalo);
       });
   }
}

// =====================================
// INICIALIZACIÓN GLOBAL
// =====================================

// Variable global para acceso desde HTML
let revisarDocumentos;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
   revisarDocumentos = new RevisarDocumentos();
});

// Cleanup al salir de la página
window.addEventListener('beforeunload', () => {
   if (revisarDocumentos) {
       revisarDocumentos.destruir();
   }
});