/**
 * 📊 MANEJADOR DE CARGA EXCEL - ADMINISTRADOR
 * Sistema Portafolio Docente UNSAAC
 * 
 * Gestión completa de carga masiva desde archivos Excel
 * Incluye validación, procesamiento, previsualización y reportes de errores
 */

class ManejadorExcel {
   constructor() {
       this.servicioUsuarios = new ServicioUsuarios();
       this.validadorFormularios = new ValidadorFormularios();
       this.sistemaModales = new SistemaModales();
       
       // Estado del componente
       this.estado = {
           tiposCarga: [],
           tipoSeleccionado: null,
           archivo: null,
           datosPreview: [],
           datosValidados: [],
           erroresValidacion: [],
           procesamientoActivo: false,
           progreso: {
               porcentaje: 0,
               procesados: 0,
               exitosos: 0,
               errores: 0,
               total: 0
           },
           historialCargas: [],
           configuracion: {
               validarAntesDeProcesar: true,
               crearUsuariosFaltantes: false,
               actualizarExistentes: true,
               enviarNotificaciones: true
           }
       };
       
       // Referencias DOM
       this.elementos = {
           selectorTipo: null,
           zonaCarga: null,
           panelPreview: null,
           panelProgreso: null,
           panelResultados: null
       };
       
       this.intervalos = {
           progreso: null
       };
       
       this.init();
   }

   /**
    * 🚀 Inicialización del componente
    */
   async init() {
       try {
           // Verificar permisos de administrador
           if (!SistemaAutenticacion.verificarPermiso('administrador')) {
               window.location.href = '/paginas/errores/403.html';
               return;
           }

           await this.inicializarInterfaz();
           await this.cargarDatosIniciales();
           this.configurarEventos();
           this.configurarDragAndDrop();
           
           Utilidades.mostrarNotificacion('Carga masiva Excel lista', 'success');
       } catch (error) {
           console.error('Error inicializando manejador Excel:', error);
           Utilidades.mostrarNotificacion('Error cargando el sistema de carga Excel', 'error');
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
       const container = document.querySelector('#excel-content');
       if (!container) return;

       container.innerHTML = `
           <div class="row g-4">
               <!-- Header principal -->
               <div class="col-12">
                   ${this.renderizarHeader()}
               </div>
               
               <!-- Selector de tipo de carga -->
               <div class="col-12">
                   ${this.renderizarSelectorTipo()}
               </div>
               
               <!-- Zona de carga de archivos -->
               <div class="col-lg-8">
                   <div class="card">
                       <div class="card-header">
                           <h5 class="card-title mb-0">
                               <i class="fas fa-file-excel me-2"></i>Cargar Archivo Excel
                           </h5>
                       </div>
                       <div class="card-body">
                           ${this.renderizarZonaCarga()}
                       </div>
                   </div>
                   
                   <!-- Panel de previsualización -->
                   <div class="card mt-3" id="panel-preview" style="display: none;">
                       <div class="card-header d-flex justify-content-between align-items-center">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-table me-2"></i>Previsualización de Datos
                               <span id="contador-filas" class="badge bg-primary ms-2">0 filas</span>
                           </h6>
                           <div class="btn-group">
                               <button type="button" class="btn btn-outline-success btn-sm" onclick="manejadorExcel.validarDatos()">
                                   <i class="fas fa-check-circle me-1"></i>Validar
                               </button>
                               <button type="button" class="btn btn-outline-primary btn-sm" onclick="manejadorExcel.procesarDatos()">
                                   <i class="fas fa-play me-1"></i>Procesar
                               </button>
                           </div>
                       </div>
                       <div class="card-body p-0">
                           <div id="contenido-preview" style="max-height: 400px; overflow: auto;">
                               <!-- Se llenará dinámicamente -->
                           </div>
                       </div>
                   </div>
                   
                   <!-- Panel de progreso -->
                   <div class="card mt-3" id="panel-progreso" style="display: none;">
                       <div class="card-header">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-tasks me-2"></i>Progreso del Procesamiento
                           </h6>
                       </div>
                       <div class="card-body">
                           ${this.renderizarPanelProgreso()}
                       </div>
                   </div>
                   
                   <!-- Panel de resultados -->
                   <div class="card mt-3" id="panel-resultados" style="display: none;">
                       <div class="card-header">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-chart-bar me-2"></i>Resultados del Procesamiento
                           </h6>
                       </div>
                       <div class="card-body">
                           <div id="contenido-resultados">
                               <!-- Se llenará dinámicamente -->
                           </div>
                       </div>
                   </div>
               </div>
               
               <!-- Panel lateral -->
               <div class="col-lg-4">
                   <!-- Configuración -->
                   <div class="card mb-3">
                       <div class="card-header">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-cog me-2"></i>Configuración
                           </h6>
                       </div>
                       <div class="card-body">
                           ${this.renderizarConfiguracion()}
                       </div>
                   </div>
                   
                   <!-- Plantillas y ayuda -->
                   <div class="card mb-3">
                       <div class="card-header">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-download me-2"></i>Plantillas
                           </h6>
                       </div>
                       <div class="card-body">
                           ${this.renderizarPlantillas()}
                       </div>
                   </div>
                   
                   <!-- Historial de cargas -->
                   <div class="card">
                       <div class="card-header">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-history me-2"></i>Historial Reciente
                           </h6>
                       </div>
                       <div class="card-body p-0">
                           <div id="historial-cargas" style="max-height: 300px; overflow-y: auto;">
                               ${this.renderizarCargandoHistorial()}
                           </div>
                       </div>
                   </div>
               </div>
           </div>
           
           <!-- Zona de drop -->
           <div id="drop-zone-overlay" class="drop-zone-overlay" style="display: none;">
               <div class="drop-zone-content">
                   <i class="fas fa-file-excel fa-4x mb-3 text-success"></i>
                   <h3>Suelta el archivo Excel aquí</h3>
                   <p class="text-muted">Formato soportado: .xlsx, .xls</p>
               </div>
           </div>
           
           <!-- Modales -->
           ${this.renderizarModales()}
       `;
   }

   /**
    * 📋 Renderizar header principal
    */
   renderizarHeader() {
       return `
           <div class="card bg-gradient-success text-white">
               <div class="card-body">
                   <div class="row align-items-center">
                       <div class="col-md-8">
                           <h4 class="card-title mb-1">
                               <i class="fas fa-file-excel me-2"></i>Carga Masiva desde Excel
                           </h4>
                           <p class="card-text mb-0 opacity-75">
                               Importa usuarios, asignaturas, asignaciones y más desde archivos Excel
                           </p>
                       </div>
                       <div class="col-md-4">
                           <div class="row text-center">
                               <div class="col-4">
                                   <div class="stat-item">
                                       <h3 id="stat-cargas-exitosas" class="mb-0">0</h3>
                                       <small class="opacity-75">Exitosas</small>
                                   </div>
                               </div>
                               <div class="col-4">
                                   <div class="stat-item">
                                       <h3 id="stat-registros-procesados" class="mb-0">0</h3>
                                       <small class="opacity-75">Registros</small>
                                   </div>
                               </div>
                               <div class="col-4">
                                   <div class="stat-item">
                                       <h3 id="stat-ultima-carga" class="mb-0">-</h3>
                                       <small class="opacity-75">Última</small>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 🎯 Renderizar selector de tipo de carga
    */
   renderizarSelectorTipo() {
       return `
           <div class="card">
               <div class="card-body">
                   <div class="row g-3 align-items-end">
                       <div class="col-md-6">
                           <label class="form-label">Tipo de Carga</label>
                           <select class="form-select" id="selector-tipo-carga" required>
                               <option value="">Selecciona el tipo de datos a cargar...</option>
                               <!-- Se llenarán dinámicamente -->
                           </select>
                       </div>
                       
                       <div class="col-md-3">
                           <label class="form-label">Ciclo Académico</label>
                           <select class="form-select" id="selector-ciclo">
                               <option value="">Ciclo actual</option>
                               <!-- Se llenarán dinámicamente -->
                           </select>
                       </div>
                       
                       <div class="col-md-3">
                           <button type="button" class="btn btn-outline-info w-100" 
                                   onclick="manejadorExcel.mostrarInformacionTipo()" id="btn-info-tipo" disabled>
                               <i class="fas fa-info-circle me-1"></i>Ver Información
                           </button>
                       </div>
                   </div>
                   
                   <!-- Información del tipo seleccionado -->
                   <div id="info-tipo-seleccionado" class="mt-3" style="display: none;">
                       <div class="alert alert-info">
                           <div id="contenido-info-tipo">
                               <!-- Se llenará dinámicamente -->
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * ☁️ Renderizar zona de carga
    */
   renderizarZonaCarga() {
       return `
           <div id="zona-carga" class="upload-zone border-dashed border-2 rounded p-4 text-center mb-3">
               <div class="upload-content" id="upload-content">
                   <i class="fas fa-file-excel fa-3x text-success mb-3"></i>
                   <h5 class="mb-2">Arrastra tu archivo Excel aquí o haz clic para seleccionar</h5>
                   <p class="text-muted mb-3">
                       Formatos soportados: .xlsx, .xls<br>
                       Tamaño máximo: 10MB
                   </p>
                   <input type="file" id="input-archivo-excel" class="d-none" 
                          accept=".xlsx,.xls" onchange="manejadorExcel.manejarArchivoSeleccionado(event)">
                   <button type="button" class="btn btn-success" onclick="document.getElementById('input-archivo-excel').click()">
                       <i class="fas fa-plus me-2"></i>Seleccionar Archivo Excel
                   </button>
               </div>
               
               <div class="upload-overlay" id="upload-overlay" style="display: none;">
                   <div class="overlay-content">
                       <i class="fas fa-download fa-2x mb-2"></i>
                       <h5>Suelta el archivo aquí</h5>
                   </div>
               </div>
           </div>
           
           <!-- Información del archivo seleccionado -->
           <div id="info-archivo" class="alert alert-success" style="display: none;">
               <div class="d-flex justify-content-between align-items-start">
                   <div>
                       <h6 class="alert-heading mb-1">
                           <i class="fas fa-file-excel me-2"></i>
                           <span id="nombre-archivo">archivo.xlsx</span>
                       </h6>
                       <div class="small">
                           <span class="me-3">
                               <i class="fas fa-weight-hanging me-1"></i>
                               <span id="tamano-archivo">0 KB</span>
                           </span>
                           <span class="me-3">
                               <i class="fas fa-table me-1"></i>
                               <span id="hojas-archivo">0 hojas</span>
                           </span>
                           <span>
                               <i class="fas fa-clock me-1"></i>
                               <span id="fecha-archivo">Hace un momento</span>
                           </span>
                       </div>
                   </div>
                   <div class="btn-group">
                       <button type="button" class="btn btn-outline-success btn-sm" onclick="manejadorExcel.analizarArchivo()">
                           <i class="fas fa-search me-1"></i>Analizar
                       </button>
                       <button type="button" class="btn btn-outline-danger btn-sm" onclick="manejadorExcel.limpiarArchivo()">
                           <i class="fas fa-times me-1"></i>Limpiar
                       </button>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 📊 Renderizar panel de progreso
    */
   renderizarPanelProgreso() {
       return `
           <div class="mb-3">
               <div class="d-flex justify-content-between align-items-center mb-1">
                   <small class="text-muted">Progreso General</small>
                   <small id="progreso-porcentaje" class="text-muted">0%</small>
               </div>
               <div class="progress mb-2" style="height: 8px;">
                   <div id="barra-progreso-general" class="progress-bar bg-success" role="progressbar" style="width: 0%"></div>
               </div>
               <div class="row text-center">
                   <div class="col-3">
                       <small class="text-muted d-block">Total</small>
                       <span id="progreso-total" class="fw-bold">0</span>
                   </div>
                   <div class="col-3">
                       <small class="text-muted d-block">Procesados</small>
                       <span id="progreso-procesados" class="fw-bold text-info">0</span>
                   </div>
                   <div class="col-3">
                       <small class="text-muted d-block">Exitosos</small>
                       <span id="progreso-exitosos" class="fw-bold text-success">0</span>
                   </div>
                   <div class="col-3">
                       <small class="text-muted d-block">Errores</small>
                       <span id="progreso-errores" class="fw-bold text-danger">0</span>
                   </div>
               </div>
           </div>
           
           <div class="d-flex justify-content-between">
               <button type="button" class="btn btn-warning btn-sm" onclick="manejadorExcel.pausarProcesamiento()" id="btn-pausar">
                   <i class="fas fa-pause me-1"></i>Pausar
               </button>
               <button type="button" class="btn btn-danger btn-sm" onclick="manejadorExcel.cancelarProcesamiento()" id="btn-cancelar">
                   <i class="fas fa-stop me-1"></i>Cancelar
               </button>
           </div>
       `;
   }

   /**
    * ⚙️ Renderizar configuración
    */
   renderizarConfiguracion() {
       return `
           <div class="mb-3">
               <div class="form-check form-switch">
                   <input class="form-check-input" type="checkbox" id="config-validar-antes" checked>
                   <label class="form-check-label" for="config-validar-antes">
                       Validar antes de procesar
                   </label>
               </div>
           </div>
           
           <div class="mb-3">
               <div class="form-check form-switch">
                   <input class="form-check-input" type="checkbox" id="config-crear-usuarios">
                   <label class="form-check-label" for="config-crear-usuarios">
                       Crear usuarios faltantes
                   </label>
               </div>
           </div>
           
           <div class="mb-3">
               <div class="form-check form-switch">
                   <input class="form-check-input" type="checkbox" id="config-actualizar-existentes" checked>
                   <label class="form-check-label" for="config-actualizar-existentes">
                       Actualizar registros existentes
                   </label>
               </div>
           </div>
           
           <div class="mb-3">
               <div class="form-check form-switch">
                   <input class="form-check-input" type="checkbox" id="config-enviar-notificaciones" checked>
                   <label class="form-check-label" for="config-enviar-notificaciones">
                       Enviar notificaciones
                   </label>
               </div>
           </div>
           
           <hr>
           
           <div class="mb-3">
               <label class="form-label small">Modo de procesamiento</label>
               <select class="form-select form-select-sm" id="config-modo-procesamiento">
                   <option value="lotes">Por lotes (recomendado)</option>
                   <option value="individual">Individual</option>
                   <option value="paralelo">Paralelo</option>
               </select>
           </div>
           
           <div class="mb-3">
               <label class="form-label small">Tamaño del lote</label>
               <input type="number" class="form-control form-control-sm" id="config-tamano-lote" 
                      value="50" min="10" max="500">
           </div>
       `;
   }

   /**
    * 📥 Renderizar plantillas
    */
   renderizarPlantillas() {
       return `
           <div class="d-grid gap-2" id="lista-plantillas">
               <p class="small text-muted mb-2">
                   Descarga las plantillas para cada tipo de carga:
               </p>
               
               <!-- Se llenarán dinámicamente según los tipos disponibles -->
               <div class="text-center py-3">
                   <div class="spinner-border spinner-border-sm text-muted" role="status"></div>
                   <p class="small text-muted mt-2 mb-0">Cargando plantillas...</p>
               </div>
           </div>
       `;
   }

   /**
    * 📜 Renderizar historial en estado de carga
    */
   renderizarCargandoHistorial() {
       return `
           <div class="text-center py-3">
               <div class="spinner-border spinner-border-sm text-muted" role="status"></div>
               <p class="small text-muted mt-2 mb-0">Cargando historial...</p>
           </div>
       `;
   }

   /**
    * 🎭 Renderizar modales del sistema
    */
   renderizarModales() {
       return `
           <!-- Modal Información del Tipo -->
           <div class="modal fade" id="modal-info-tipo" tabindex="-1">
               <div class="modal-dialog modal-lg">
                   <div class="modal-content">
                       <div class="modal-header">
                           <h5 class="modal-title">
                               <i class="fas fa-info-circle me-2"></i>Información del Tipo de Carga
                           </h5>
                           <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                       </div>
                       <div class="modal-body">
                           <div id="contenido-modal-info">
                               <!-- Se llenará dinámicamente -->
                           </div>
                       </div>
                       <div class="modal-footer">
                           <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                           <button type="button" class="btn btn-primary" onclick="manejadorExcel.descargarPlantilla()">
                               <i class="fas fa-download me-1"></i>Descargar Plantilla
                           </button>
                       </div>
                   </div>
               </div>
           </div>
           
           <!-- Modal Errores de Validación -->
           <div class="modal fade" id="modal-errores-validacion" tabindex="-1">
               <div class="modal-dialog modal-xl">
                   <div class="modal-content">
                       <div class="modal-header">
                           <h5 class="modal-title">
                               <i class="fas fa-exclamation-triangle me-2 text-warning"></i>Errores de Validación
                           </h5>
                           <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                       </div>
                       <div class="modal-body">
                           <div class="alert alert-warning">
                               <strong>Se encontraron errores en los datos:</strong>
                               <p class="mb-0">Revisa y corrige los errores antes de procesar los datos.</p>
                           </div>
                           <div id="contenido-errores-validacion">
                               <!-- Se llenará dinámicamente -->
                           </div>
                       </div>
                       <div class="modal-footer">
                           <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                           <button type="button" class="btn btn-warning" onclick="manejadorExcel.exportarErrores()">
                               <i class="fas fa-download me-1"></i>Exportar Errores
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
    * 📊 Cargar datos iniciales
    */
   async cargarDatosIniciales() {
       await Promise.all([
           this.cargarTiposCarga(),
           this.cargarCiclosAcademicos(),
           this.cargarHistorialCargas(),
           this.cargarEstadisticas()
       ]);
   }

   /**
    * 📋 Cargar tipos de carga disponibles
    */
   async cargarTiposCarga() {
       try {
           const response = await ClienteAPI.get('/carga-excel/tipos');
           this.estado.tiposCarga = response.data;
           
           this.renderizarSelectorTipos();
           this.renderizarPlantillasDisponibles();
           
       } catch (error) {
           console.error('Error cargando tipos de carga:', error);
           this.mostrarErrorTipos();
       }
   }

   /**
    * 📅 Cargar ciclos académicos
    */
   async cargarCiclosAcademicos() {
       try {
           const response = await ClienteAPI.get('/ciclos-academicos');
           const select = document.getElementById('selector-ciclo');
           
           if (select && response.data) {
               response.data.forEach(ciclo => {
                   const option = document.createElement('option');
                   option.value = ciclo.id;
                   option.textContent = ciclo.nombre;
                   if (ciclo.estado === 'activo') {
                       option.selected = true;
                   }
                   select.appendChild(option);
               });
           }
       } catch (error) {
           console.warn('Error cargando ciclos:', error);
       }
   }

   /**
    * 📜 Cargar historial de cargas
    */
   async cargarHistorialCargas() {
       try {
           const response = await ClienteAPI.get('/carga-excel/historial', {
               params: { limite: 10 }
           });
           
           this.estado.historialCargas = response.data;
           this.renderizarHistorialCargas();
           
       } catch (error) {
           console.error('Error cargando historial:', error);
       }
   }

   /**
    * 📈 Cargar estadísticas
    */
   async cargarEstadisticas() {
       try {
           const response = await ClienteAPI.get('/carga-excel/estadisticas');
           this.actualizarEstadisticasHeader(response.data);
       } catch (error) {
           console.warn('Error cargando estadísticas:', error);
       }
   }

   /**
    * 🎯 Renderizar selector de tipos
    */
   renderizarSelectorTipos() {
       const select = document.getElementById('selector-tipo-carga');
       if (!select) return;
       
       // Limpiar opciones existentes excepto la primera
       while (select.children.length > 1) {
           select.removeChild(select.lastChild);
       }
       
       this.estado.tiposCarga.forEach(tipo => {
           const option = document.createElement('option');
           option.value = tipo.id;
           option.textContent = tipo.nombre;
           option.dataset.descripcion = tipo.descripcion;
           select.appendChild(option);
       });
   }

   /**
    * 📥 Renderizar plantillas disponibles
    */
   renderizarPlantillasDisponibles() {
       const container = document.getElementById('lista-plantillas');
       if (!container) return;
       
       container.innerHTML = `
           <p class="small text-muted mb-2">
               Descarga las plantillas para cada tipo de carga:
           </p>
           ${this.estado.tiposCarga.map(tipo => `
               <button type="button" class="btn btn-outline-success btn-sm" 
                       onclick="manejadorExcel.descargarPlantillaTipo('${tipo.id}')">
                   <i class="fas fa-download me-2"></i>${tipo.nombre}
               </button>
           `).join('')}
       `;
   }

   /**
    * 📜 Renderizar historial de cargas
    */
   renderizarHistorialCargas() {
       const container = document.getElementById('historial-cargas');
       if (!container) return;
       
       if (this.estado.historialCargas.length === 0) {
           container.innerHTML = `
               <div class="text-center py-3">
                   <i class="fas fa-history fa-2x text-muted mb-2"></i>
                   <p class="text-muted small mb-0">No hay cargas recientes</p>
               </div>
           `;
           return;
       }
       
       container.innerHTML = `
           <div class="list-group list-group-flush">
               ${this.estado.historialCargas.map(carga => this.renderizarItemHistorial(carga)).join('')}
           </div>
       `;
   }

   /**
    * 📜 Renderizar item del historial
    */
   renderizarItemHistorial(carga) {
       const estadoClass = this.obtenerClaseEstado(carga.estado);
       const tipoNombre = this.obtenerNombreTipo(carga.tipo_carga_id);
       
       return `
           <div class="list-group-item list-group-item-action">
               <div class="d-flex justify-content-between align-items-start">
                   <div class="flex-grow-1">
                       <h6 class="mb-1 small">${tipoNombre}</h6>
                       <p class="mb-1 small text-muted">${carga.nombre_archivo}</p>
                       <small class="text-muted">
                           ${Utilidades.formatearFechaRelativa(carga.fecha_subida)} • 
                           ${carga.registros_procesados}/${carga.total_registros} registros
                       </small>
                   </div>
                   <div class="text-end">
                       <span class="badge bg-${estadoClass} mb-1">${this.obtenerTextoEstado(carga.estado)}</span>
                       <br>
                       <button type="button" class="btn btn-outline-info btn-sm" 
                               onclick="manejadorExcel.verDetalleCarga('${carga.id}')" 
                               title="Ver detalles">
                           <i class="fas fa-eye"></i>
                       </button>
                   </div>
               </div>
           </div>
       `;
   }

   // =====================================
   // MÉTODOS DE PROCESAMIENTO
   // =====================================

   /**
    * 📁 Manejar archivo seleccionado
    */
   async manejarArchivoSeleccionado(event) {
       const archivo = event.target.files[0];
       if (!archivo) return;
       
       // Validar tipo de archivo
       const extensionesValidas = ['.xlsx', '.xls'];
       const extension = '.' + archivo.name.split('.').pop().toLowerCase();
       
       if (!extensionesValidas.includes(extension)) {
           Utilidades.mostrarNotificacion('Formato de archivo no válido. Solo se permiten archivos Excel (.xlsx, .xls)', 'error');
           return;
       }
       
       // Validar tamaño (10MB máximo)
       const tamanoMaximo = 10 * 1024 * 1024; // 10MB
       if (archivo.size > tamanoMaximo) {
           Utilidades.mostrarNotificacion('El archivo es demasiado grande. Tamaño máximo: 10MB', 'error');
           return;
       }
       
       this.estado.archivo = archivo;
       this.mostrarInformacionArchivo();
   }

   /**
    * ℹ️ Mostrar información del archivo
    */
   mostrarInformacionArchivo() {
       if (!this.estado.archivo) return;
       
       const infoDiv = document.getElementById('info-archivo');
       if (infoDiv) {
           document.getElementById('nombre-archivo').textContent = this.estado.archivo.name;
           document.getElementById('tamano-archivo').textContent = Utilidades.formatearTamanoArchivo(this.estado.archivo.size);
           document.getElementById('fecha-archivo').textContent = 'Recién seleccionado';
           
           infoDiv.style.display = 'block';
       }
   }

   /**
    * 🔍 Analizar archivo Excel
    */
   async analizarArchivo() {
       if (!this.estado.archivo) {
           Utilidades.mostrarNotificacion('Selecciona un archivo primero', 'warning');
           return;
       }
       
       if (!this.estado.tipoSeleccionado) {
           Utilidades.mostrarNotificacion('Selecciona el tipo de carga primero', 'warning');
           return;
       }
       
       try {
           Utilidades.mostrarNotificacion('Analizando archivo...', 'info');
           
           const formData = new FormData();
           formData.append('archivo', this.estado.archivo);
           formData.append('tipo_carga_id', this.estado.tipoSeleccionado.id);
           
           const response = await ClienteAPI.post('/carga-excel/analizar', formData);
           
           this.estado.datosPreview = response.data.datos;
           this.estado.erroresValidacion = response.data.errores || [];
           
           this.mostrarPreview();
           
           Utilidades.mostrarNotificacion('Archivo analizado correctamente', 'success');
           
       } catch (error) {
           console.error('Error analizando archivo:', error);
           Utilidades.mostrarNotificacion('Error al analizar el archivo', 'error');
       }
   }

   /**
    * 👁️ Mostrar previsualización
    */
   mostrarPreview() {
       const panel = document.getElementById('panel-preview');
       const contenido = document.getElementById('contenido-preview');
       const contador = document.getElementById('contador-filas');
       
       if (!panel || !contenido) return;
       
       contador.textContent = `${this.estado.datosPreview.length} filas`;
       
       if (this.estado.datosPreview.length === 0) {
           contenido.innerHTML = `
               <div class="text-center py-4">
                   <i class="fas fa-table fa-3x text-muted mb-3"></i>
                   <h5 class="text-muted">No se encontraron datos</h5>
                   <p class="text-muted">El archivo no contiene datos válidos para procesar</p>
               </div>
           `;
       } else {
           contenido.innerHTML = this.renderizarTablaPreview();
       }
       
       panel.style.display = 'block';
       
       // Mostrar errores si los hay
       if (this.estado.erroresValidacion.length > 0) {
           this.mostrarErroresValidacion();
       }
   }

   /**
    * 📊 Renderizar tabla de previsualización
    */
   renderizarTablaPreview() {
       if (this.estado.datosPreview.length === 0) return '';
       
       const primeraFila = this.estado.datosPreview[0];
       const columnas = Object.keys(primeraFila);
       const filasMuestra = this.estado.datosPreview.slice(0, 10); // Mostrar primeras 10 filas
       
       return `
           <div class="table-responsive">
               <table class="table table-sm table-bordered">
                   <thead class="table-light">
                       <tr>
                           <th width="50">#</th>
                           ${columnas.map(col => `<th>${col}</th>`).join('')}
                           <th width="60">Estado</th>
                       </tr>
                   </thead>
                   <tbody>
                       ${filasMuestra.map((fila, index) => this.renderizarFilaPreview(fila, index, columnas)).join('')}
                       ${this.estado.datosPreview.length > 10 ? `
                           <tr>
                               <td colspan="${columnas.length + 2}" class="text-center text-muted">
                                   ... y ${this.estado.datosPreview.length - 10} filas más
                               </td>
                           </tr>
                       ` : ''}
                   </tbody>
               </table>
           </div>
       `;
   }

   /**
    * 📄 Renderizar fila de previsualización
    */
   renderizarFilaPreview(fila, index, columnas) {
       const erroresFila = this.estado.erroresValidacion.filter(error => error.fila === index + 2); // +2 porque incluye header
       const tieneErrores = erroresFila.length > 0;
       
       return `
           <tr class="${tieneErrores ? 'table-warning' : ''}">
               <td class="text-muted">${index + 1}</td>
               ${columnas.map(col => `
                   <td>${this.formatearCelda(fila[col])}</td>
               `).join('')}
               <td class="text-center">
                   ${tieneErrores ? 
                       `<i class="fas fa-exclamation-triangle text-warning" title="${erroresFila.length} error(es)"></i>` :
                       `<i class="fas fa-check text-success"></i>`
                   }
               </td>
           </tr>
       `;
   }

   /**
    * ✅ Validar datos
    */
   async validarDatos() {
       if (!this.estado.configuracion.validarAntesDeProcesar) {
           this.procesarDatos();
           return;
       }
       
       if (this.estado.erroresValidacion.length > 0) {
           this.mostrarModalErroresValidacion();
           return;
       }
       
       Utilidades.mostrarNotificacion('Datos validados correctamente. Listos para procesar.', 'success');
   }

   /**
    * ⚡ Procesar datos
    */
   async procesarDatos() {
       if (this.estado.erroresValidacion.length > 0 && this.estado.configuracion.validarAntesDeProcesar) {
           const confirmar = await Utilidades.confirmar(
               'Procesar con errores',
               '¿Deseas procesar los datos aunque haya errores de validación? Solo se procesarán las filas válidas.',
               'warning'
           );
           
           if (!confirmar) return;
       }
       
       try {
           this.estado.procesamientoActivo = true;
           this.mostrarPanelProgreso();
           
           const formData = new FormData();
           formData.append('archivo', this.estado.archivo);
           formData.append('tipo_carga_id', this.estado.tipoSeleccionado.id);
           formData.append('configuracion', JSON.stringify(this.estado.configuracion));
           
           const cicloId = document.getElementById('selector-ciclo').value;
           if (cicloId) {
               formData.append('ciclo_id', cicloId);
           }
           
           const response = await ClienteAPI.post('/carga-excel/procesar', formData);
           
           // Iniciar seguimiento del progreso
           this.iniciarSeguimientoProgreso(response.data.proceso_id);
           
       } catch (error) {
           console.error('Error procesando datos:', error);
           Utilidades.mostrarNotificacion('Error al procesar los datos', 'error');
           this.estado.procesamientoActivo = false;
       }
   }

   /**
    * 📊 Iniciar seguimiento del progreso
    */
   iniciarSeguimientoProgreso(procesoId) {
       this.intervalos.progreso = setInterval(async () => {
           try {
               const response = await ClienteAPI.get(`/carga-excel/progreso/${procesoId}`);
               const progreso = response.data;
               
               this.actualizarProgreso(progreso);
               
               if (progreso.completado) {
                   clearInterval(this.intervalos.progreso);
                   this.estado.procesamientoActivo = false;
                   this.mostrarResultados(progreso);
               }
               
           } catch (error) {
               console.error('Error obteniendo progreso:', error);
               clearInterval(this.intervalos.progreso);
               this.estado.procesamientoActivo = false;
           }
       }, 1000); // Actualizar cada segundo
   }

   /**
    * 📈 Actualizar progreso
    */
   actualizarProgreso(progreso) {
       this.estado.progreso = progreso;
       
       // Actualizar elementos DOM
       document.getElementById('progreso-porcentaje').textContent = `${Math.round(progreso.porcentaje)}%`;
       document.getElementById('barra-progreso-general').style.width = `${progreso.porcentaje}%`;
       document.getElementById('progreso-total').textContent = progreso.total;
       document.getElementById('progreso-procesados').textContent = progreso.procesados;
       document.getElementById('progreso-exitosos').textContent = progreso.exitosos;
       document.getElementById('progreso-errores').textContent = progreso.errores;
   }

   /**
    * 📊 Mostrar resultados
    */
   mostrarResultados(resultados) {
       const panel = document.getElementById('panel-resultados');
       const contenido = document.getElementById('contenido-resultados');
       
       if (!panel || !contenido) return;
       
       const porcentajeExito = resultados.total > 0 ? 
           Math.round((resultados.exitosos / resultados.total) * 100) : 0;
       
       contenido.innerHTML = `
           <div class="row g-3 mb-4">
               <div class="col-md-3">
                   <div class="text-center">
                       <h4 class="text-primary mb-1">${resultados.total}</h4>
                       <small class="text-muted">Total de registros</small>
                   </div>
               </div>
               <div class="col-md-3">
                   <div class="text-center">
                       <h4 class="text-success mb-1">${resultados.exitosos}</h4>
                       <small class="text-muted">Procesados exitosamente</small>
                   </div>
               </div>
               <div class="col-md-3">
                   <div class="text-center">
                       <h4 class="text-danger mb-1">${resultados.errores}</h4>
                       <small class="text-muted">Con errores</small>
                   </div>
               </div>
               <div class="col-md-3">
                   <div class="text-center">
                       <h4 class="text-info mb-1">${porcentajeExito}%</h4>
                       <small class="text-muted">Tasa de éxito</small>
                   </div>
               </div>
           </div>
           
           ${resultados.errores > 0 ? `
               <div class="alert alert-warning">
                   <h6 class="alert-heading">
                       <i class="fas fa-exclamation-triangle me-2"></i>Se encontraron errores
                   </h6>
                   <p class="mb-2">Algunos registros no pudieron ser procesados:</p>
                   <button type="button" class="btn btn-outline-warning btn-sm" 
                           onclick="manejadorExcel.verErroresProcesamiento('${resultados.proceso_id}')">
                       <i class="fas fa-list me-1"></i>Ver Errores Detallados
                   </button>
               </div>
           ` : ''}
           
           <div class="d-flex justify-content-between">
               <button type="button" class="btn btn-outline-primary" onclick="manejadorExcel.nuevaCarga()">
                   <i class="fas fa-plus me-1"></i>Nueva Carga
               </button>
               <div class="btn-group">
                   <button type="button" class="btn btn-outline-success" 
                           onclick="manejadorExcel.descargarReporte('${resultados.proceso_id}')">
                       <i class="fas fa-download me-1"></i>Descargar Reporte
                   </button>
                   <button type="button" class="btn btn-outline-info" 
                           onclick="manejadorExcel.verDetalleCarga('${resultados.proceso_id}')">
                       <i class="fas fa-eye me-1"></i>Ver Detalles
                   </button>
               </div>
           </div>
       `;
       
       panel.style.display = 'block';
       
       // Mostrar notificación de finalización
       if (resultados.errores === 0) {
           Utilidades.mostrarNotificacion(`✅ Carga completada exitosamente: ${resultados.exitosos} registros procesados`, 'success');
       } else {
           Utilidades.mostrarNotificacion(`⚠️ Carga completada con ${resultados.errores} errores de ${resultados.total} registros`, 'warning');
       }
       
       // Recargar historial
       this.cargarHistorialCargas();
   }

   // =====================================
   // MÉTODOS AUXILIARES
   // =====================================

   /**
    * 🎨 Obtener clase para estado
    */
   obtenerClaseEstado(estado) {
       const clases = {
           'procesando': 'warning',
           'completado': 'success',
           'fallido': 'danger',
           'parcial': 'info'
       };
       return clases[estado] || 'secondary';
   }

   /**
    * 📝 Obtener texto del estado
    */
   obtenerTextoEstado(estado) {
       const textos = {
           'procesando': 'Procesando',
           'completado': 'Completado',
           'fallido': 'Fallido',
           'parcial': 'Parcial'
       };
       return textos[estado] || estado;
   }

   /**
    * 🏷️ Obtener nombre del tipo
    */
   obtenerNombreTipo(tipoId) {
       const tipo = this.estado.tiposCarga.find(t => t.id === tipoId);
       return tipo ? tipo.nombre : 'Desconocido';
   }

   /**
    * 📋 Formatear celda para preview
    */
   formatearCelda(valor) {
       if (valor === null || valor === undefined || valor === '') {
           return '<span class="text-muted">-</span>';
       }
       
       // Truncar texto largo
       const texto = String(valor);
       return texto.length > 50 ? texto.substring(0, 47) + '...' : texto;
   }

   /**
    * 🔧 Configurar elementos DOM
    */
   configurarElementosDOM() {
       this.elementos = {
           selectorTipo: document.getElementById('selector-tipo-carga'),
           zonaCarga: document.getElementById('zona-carga'),
           panelPreview: document.getElementById('panel-preview'),
           panelProgreso: document.getElementById('panel-progreso'),
           panelResultados: document.getElementById('panel-resultados')
       };
   }

   /**
    * ⚙️ Configurar eventos
    */
   configurarEventos() {
       // Cambio de tipo de carga
       const selectorTipo = document.getElementById('selector-tipo-carga');
       if (selectorTipo) {
           selectorTipo.addEventListener('change', (e) => {
               const tipoId = e.target.value;
               if (tipoId) {
                   this.estado.tipoSeleccionado = this.estado.tiposCarga.find(t => t.id === tipoId);
                   this.mostrarInformacionTipoSeleccionado();
                   document.getElementById('btn-info-tipo').disabled = false;
               } else {
                   this.estado.tipoSeleccionado = null;
                   this.ocultarInformacionTipo();
                   document.getElementById('btn-info-tipo').disabled = true;
               }
           });
       }
       
       // Configuración
       ['config-validar-antes', 'config-crear-usuarios', 'config-actualizar-existentes', 'config-enviar-notificaciones'].forEach(id => {
           const elemento = document.getElementById(id);
           if (elemento) {
               elemento.addEventListener('change', () => {
                   this.actualizarConfiguracion();
               });
           }
       });
   }

   /**
    * 🎯 Configurar drag and drop
    */
   configurarDragAndDrop() {
       const zonaCarga = document.getElementById('zona-carga');
       const overlay = document.getElementById('drop-zone-overlay');
       
       if (!zonaCarga) return;
       
       // Prevenir comportamiento por defecto
       ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
           document.addEventListener(eventName, (e) => {
               e.preventDefault();
               e.stopPropagation();
           }, false);
       });
       
       // Mostrar overlay al arrastrar archivos
       document.addEventListener('dragenter', (e) => {
           if (e.dataTransfer.types.includes('Files')) {
               overlay.style.display = 'flex';
           }
       });
       
       overlay.addEventListener('dragleave', (e) => {
           if (!overlay.contains(e.relatedTarget)) {
               overlay.style.display = 'none';
           }
       });
       
       overlay.addEventListener('drop', (e) => {
           overlay.style.display = 'none';
           
           const archivos = Array.from(e.dataTransfer.files);
           const archivoExcel = archivos.find(archivo => 
               archivo.name.endsWith('.xlsx') || archivo.name.endsWith('.xls')
           );
           
           if (archivoExcel) {
               this.estado.archivo = archivoExcel;
               this.mostrarInformacionArchivo();
           } else {
               Utilidades.mostrarNotificacion('Por favor, suelta un archivo Excel (.xlsx o .xls)', 'warning');
           }
       });
   }

   /**
    * 🔄 Actualizar breadcrumb
    */
   actualizarBreadcrumb() {
       const breadcrumb = document.querySelector('#breadcrumb');
       if (breadcrumb) {
           breadcrumb.innerHTML = `
               <li class="breadcrumb-item">
                   <i class="fas fa-crown me-1"></i>Administrador
               </li>
               <li class="breadcrumb-item active">Carga Masiva Excel</li>
           `;
       }
   }

   // =====================================
   // MÉTODOS PÚBLICOS PARA INTERFAZ
   // =====================================

   /**
    * ℹ️ Mostrar información del tipo
    */
   mostrarInformacionTipo() {
       if (!this.estado.tipoSeleccionado) return;
       
       // Mostrar modal con información detallada
       this.sistemaModales.mostrarModal({
           titulo: `Información: ${this.estado.tipoSeleccionado.nombre}`,
           contenido: this.renderizarInformacionTipoDetallada(),
           botones: [
               {
                   texto: 'Descargar Plantilla',
                   clase: 'btn-primary',
                   accion: () => this.descargarPlantilla()
               },
               {
                   texto: 'Cerrar',
                   clase: 'btn-secondary'
               }
           ]
       });
   }

   /**
    * 🧹 Limpiar archivo
    */
   limpiarArchivo() {
       this.estado.archivo = null;
       document.getElementById('input-archivo-excel').value = '';
       document.getElementById('info-archivo').style.display = 'none';
       document.getElementById('panel-preview').style.display = 'none';
       document.getElementById('panel-progreso').style.display = 'none';
       document.getElementById('panel-resultados').style.display = 'none';
   }

   /**
    * 🆕 Nueva carga
    */
   nuevaCarga() {
       this.limpiarArchivo();
       this.estado.datosPreview = [];
       this.estado.erroresValidacion = [];
       this.estado.procesamientoActivo = false;
       
       // Limpiar intervalos
       if (this.intervalos.progreso) {
           clearInterval(this.intervalos.progreso);
       }
   }

   /**
    * 📥 Descargar plantilla
    */
   async descargarPlantilla() {
       if (!this.estado.tipoSeleccionado) {
           Utilidades.mostrarNotificacion('Selecciona un tipo de carga primero', 'warning');
           return;
       }
       
       try {
           const url = `/api/v1/carga-excel/plantilla/${this.estado.tipoSeleccionado.id}`;
           const link = document.createElement('a');
           link.href = url;
           link.download = `plantilla_${this.estado.tipoSeleccionado.nombre.toLowerCase().replace(/\s+/g, '_')}.xlsx`;
           document.body.appendChild(link);
           link.click();
           document.body.removeChild(link);
           
       } catch (error) {
           console.error('Error descargando plantilla:', error);
           Utilidades.mostrarNotificacion('Error al descargar la plantilla', 'error');
       }
   }

   mostrarPanelProgreso() {
       document.getElementById('panel-progreso').style.display = 'block';
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
let manejadorExcel;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
   manejadorExcel = new ManejadorExcel();
});

// Cleanup al salir de la página
window.addEventListener('beforeunload', () => {
   if (manejadorExcel) {
       manejadorExcel.destruir();
   }
});