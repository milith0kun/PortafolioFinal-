/**
 * 📋 COLA DE REVISIÓN - VERIFICADOR
 * Sistema Portafolio Docente UNSAAC
 * 
 * Interface para gestionar cola de documentos pendientes de revisión
 * Incluye filtros avanzados, priorización, asignación automática y acciones masivas
 */

class ColaRevision {
   constructor() {
       this.servicioPortafolios = new ServicioPortafolios();
       this.servicioUsuarios = new ServicioUsuarios();
       this.validadorFormularios = new ValidadorFormularios();
       this.sistemaModales = new SistemaModales();
       
       // Estado del componente
       this.estado = {
           documentos: [],
           documentoSeleccionado: null,
           filtros: {
               busqueda: '',
               prioridad: '',
               fecha_desde: '',
               fecha_hasta: '',
               docente: '',
               asignatura: '',
               tipo_documento: '',
               tiempo_espera: ''
           },
           ordenamiento: {
               campo: 'fecha_subida',
               direccion: 'desc'
           },
           vista: 'lista', // lista | tarjetas | kanban
           seleccionados: new Set(),
           configuracion: {
               autoRefresh: true,
               intervaloRefresh: 30000,
               sonidoNotificacion: true,
               mostrarPreview: true
           },
           estadisticas: {
               total: 0,
               pendientes: 0,
               enRevision: 0,
               vencidos: 0
           }
       };
       
       // Referencias DOM
       this.elementos = {
           contenedorPrincipal: null,
           listaDatos: null,
           panelFiltros: null,
           estadisticas: null,
           selectorVista: null
       };
       
       this.intervalos = {
           autoRefresh: null,
           estadisticas: null
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

           await this.inicializarInterfaz();
           await this.cargarDatosIniciales();
           this.configurarEventos();
           this.iniciarActualizacionAutomatica();
           
           Utilidades.mostrarNotificacion('Cola de revisión cargada', 'success');
       } catch (error) {
           console.error('Error inicializando cola de revisión:', error);
           Utilidades.mostrarNotificacion('Error cargando la cola de revisión', 'error');
       }
   }

   /**
    * 🎨 Inicializar interfaz de usuario
    */
   async inicializarInterfaz() {
       await this.renderizarInterfaz();
       this.configurarElementosDOM();
       this.actualizarBreadcrumb();
       await this.cargarConfiguracionUsuario();
   }

   /**
    * 🎨 Renderizar interfaz completa
    */
   async renderizarInterfaz() {
       const container = document.querySelector('#cola-revision-content');
       if (!container) return;

       container.innerHTML = `
           <div class="row g-4">
               <!-- Header con estadísticas -->
               <div class="col-12">
                   ${this.renderizarHeaderEstadisticas()}
               </div>
               
               <!-- Panel de filtros -->
               <div class="col-12">
                   ${this.renderizarPanelFiltros()}
               </div>
               
               <!-- Controles de vista y acciones -->
               <div class="col-12">
                   ${this.renderizarControlesVista()}
               </div>
               
               <!-- Contenido principal -->
               <div class="col-12">
                   <div class="card">
                       <div class="card-header d-flex justify-content-between align-items-center">
                           <div>
                               <h5 class="card-title mb-0">
                                   <i class="fas fa-clock me-2"></i>Documentos Pendientes
                                   <span id="contador-documentos" class="badge bg-primary ms-2">0</span>
                               </h5>
                           </div>
                           <div class="btn-group" role="group">
                               <button type="button" class="btn btn-sm btn-outline-primary" data-vista="lista" 
                                       onclick="colaRevision.cambiarVista('lista')">
                                   <i class="fas fa-list"></i>
                               </button>
                               <button type="button" class="btn btn-sm btn-outline-primary" data-vista="tarjetas" 
                                       onclick="colaRevision.cambiarVista('tarjetas')">
                                   <i class="fas fa-th"></i>
                               </button>
                               <button type="button" class="btn btn-sm btn-outline-primary" data-vista="kanban" 
                                       onclick="colaRevision.cambiarVista('kanban')">
                                   <i class="fas fa-columns"></i>
                               </button>
                           </div>
                       </div>
                       <div class="card-body p-0">
                           <div id="contenido-documentos">
                               ${this.renderizarCargando()}
                           </div>
                       </div>
                   </div>
               </div>
           </div>
           
           <!-- Panel lateral flotante (opcional) -->
           <div id="panel-lateral" class="offcanvas offcanvas-end" tabindex="-1">
               <div class="offcanvas-header">
                   <h5 class="offcanvas-title">Acciones Rápidas</h5>
                   <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
               </div>
               <div class="offcanvas-body">
                   ${this.renderizarAccionesRapidas()}
               </div>
           </div>
       `;
   }

   /**
    * 📊 Renderizar header con estadísticas
    */
   renderizarHeaderEstadisticas() {
       return `
           <div class="row g-3">
               <div class="col-md-3">
                   <div class="card bg-primary text-white">
                       <div class="card-body text-center">
                           <i class="fas fa-file-alt fa-2x mb-2 opacity-75"></i>
                           <h3 id="stat-total" class="mb-1">0</h3>
                           <p class="card-text mb-0">Total Asignados</p>
                       </div>
                   </div>
               </div>
               
               <div class="col-md-3">
                   <div class="card bg-warning text-white">
                       <div class="card-body text-center">
                           <i class="fas fa-clock fa-2x mb-2 opacity-75"></i>
                           <h3 id="stat-pendientes" class="mb-1">0</h3>
                           <p class="card-text mb-0">Pendientes</p>
                       </div>
                   </div>
               </div>
               
               <div class="col-md-3">
                   <div class="card bg-info text-white">
                       <div class="card-body text-center">
                           <i class="fas fa-eye fa-2x mb-2 opacity-75"></i>
                           <h3 id="stat-revision" class="mb-1">0</h3>
                           <p class="card-text mb-0">En Revisión</p>
                       </div>
                   </div>
               </div>
               
               <div class="col-md-3">
                   <div class="card bg-danger text-white">
                       <div class="card-body text-center">
                           <i class="fas fa-exclamation-triangle fa-2x mb-2 opacity-75"></i>
                           <h3 id="stat-vencidos" class="mb-1">0</h3>
                           <p class="card-text mb-0">Vencidos</p>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 🔍 Renderizar panel de filtros
    */
   renderizarPanelFiltros() {
       return `
           <div class="card">
               <div class="card-body">
                   <div class="row g-3">
                       <div class="col-md-3">
                           <label class="form-label">Búsqueda</label>
                           <div class="input-group">
                               <span class="input-group-text">
                                   <i class="fas fa-search"></i>
                               </span>
                               <input type="text" class="form-control" id="filtro-busqueda" 
                                      placeholder="Buscar por archivo, docente...">
                           </div>
                       </div>
                       
                       <div class="col-md-2">
                           <label class="form-label">Prioridad</label>
                           <select class="form-select" id="filtro-prioridad">
                               <option value="">Todas</option>
                               <option value="alta">Alta</option>
                               <option value="media">Media</option>
                               <option value="baja">Baja</option>
                           </select>
                       </div>
                       
                       <div class="col-md-2">
                           <label class="form-label">Tipo Documento</label>
                           <select class="form-select" id="filtro-tipo">
                               <option value="">Todos</option>
                               <option value="silabo">Sílabo</option>
                               <option value="plan_clase">Plan de Clase</option>
                               <option value="material_apoyo">Material de Apoyo</option>
                               <option value="evaluacion">Evaluación</option>
                               <option value="proyecto">Proyecto</option>
                               <option value="otro">Otro</option>
                           </select>
                       </div>
                       
                       <div class="col-md-2">
                           <label class="form-label">Tiempo Espera</label>
                           <select class="form-select" id="filtro-tiempo">
                               <option value="">Cualquiera</option>
                               <option value="1h">Última hora</option>
                               <option value="24h">Últimas 24h</option>
                               <option value="3d">Últimos 3 días</option>
                               <option value="7d">Última semana</option>
                               <option value="vencido">Vencidos</option>
                           </select>
                       </div>
                       
                       <div class="col-md-3">
                           <label class="form-label">Acciones</label>
                           <div class="btn-group w-100">
                               <button type="button" class="btn btn-primary" onclick="colaRevision.aplicarFiltros()">
                                   <i class="fas fa-filter me-1"></i>Filtrar
                               </button>
                               <button type="button" class="btn btn-outline-secondary" onclick="colaRevision.limpiarFiltros()">
                                   <i class="fas fa-times me-1"></i>Limpiar
                               </button>
                           </div>
                       </div>
                   </div>
                   
                   <!-- Filtros avanzados (colapsable) -->
                   <div class="mt-3">
                       <button class="btn btn-link p-0" type="button" data-bs-toggle="collapse" 
                               data-bs-target="#filtros-avanzados">
                           <i class="fas fa-chevron-down me-1"></i>Filtros Avanzados
                       </button>
                       
                       <div class="collapse" id="filtros-avanzados">
                           <div class="row g-3 mt-2">
                               <div class="col-md-3">
                                   <label class="form-label">Docente</label>
                                   <select class="form-select" id="filtro-docente">
                                       <option value="">Todos los docentes</option>
                                       <!-- Se llenarán dinámicamente -->
                                   </select>
                               </div>
                               
                               <div class="col-md-3">
                                   <label class="form-label">Asignatura</label>
                                   <select class="form-select" id="filtro-asignatura">
                                       <option value="">Todas las asignaturas</option>
                                       <!-- Se llenarán dinámicamente -->
                                   </select>
                               </div>
                               
                               <div class="col-md-3">
                                   <label class="form-label">Fecha Desde</label>
                                   <input type="date" class="form-control" id="filtro-fecha-desde">
                               </div>
                               
                               <div class="col-md-3">
                                   <label class="form-label">Fecha Hasta</label>
                                   <input type="date" class="form-control" id="filtro-fecha-hasta">
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 🎛️ Renderizar controles de vista
    */
   renderizarControlesVista() {
       return `
           <div class="card">
               <div class="card-body py-2">
                   <div class="d-flex justify-content-between align-items-center">
                       <div class="d-flex align-items-center">
                           <label class="form-label me-2 mb-0">Ordenar por:</label>
                           <select class="form-select form-select-sm me-2" id="orden-campo" style="width: auto;">
                               <option value="fecha_subida">Fecha de Subida</option>
                               <option value="prioridad">Prioridad</option>
                               <option value="docente_nombre">Docente</option>
                               <option value="tiempo_espera">Tiempo de Espera</option>
                               <option value="tamaño_archivo">Tamaño</option>
                           </select>
                           <button type="button" class="btn btn-sm btn-outline-secondary me-3" 
                                   onclick="colaRevision.toggleOrdenamiento()">
                               <i id="icono-orden" class="fas fa-sort-amount-down"></i>
                           </button>
                           
                           <div class="form-check form-switch me-3">
                               <input class="form-check-input" type="checkbox" id="auto-refresh" checked>
                               <label class="form-check-label" for="auto-refresh">Auto-actualizar</label>
                           </div>
                       </div>
                       
                       <div class="btn-group">
                           <button type="button" class="btn btn-sm btn-success" onclick="colaRevision.tomarSiguiente()" 
                                   title="Tomar siguiente documento">
                               <i class="fas fa-play me-1"></i>Siguiente
                           </button>
                           <button type="button" class="btn btn-sm btn-info" onclick="colaRevision.asignacionAutomatica()" 
                                   title="Asignación automática">
                               <i class="fas fa-magic me-1"></i>Auto-Asignar
                           </button>
                           <button type="button" class="btn btn-sm btn-warning" onclick="colaRevision.marcarLotePrioridad()" 
                                   title="Marcar como prioritario">
                               <i class="fas fa-exclamation me-1"></i>Priorizar
                           </button>
                       </div>
                   </div>
                   
                   <!-- Acciones masivas -->
                   <div id="acciones-masivas" class="mt-3 d-none">
                       <div class="alert alert-info d-flex align-items-center justify-content-between mb-0">
                           <div>
                               <i class="fas fa-info-circle me-2"></i>
                               <span id="seleccionados-count">0</span> documento(s) seleccionado(s)
                           </div>
                           <div class="btn-group">
                               <button type="button" class="btn btn-sm btn-success" onclick="colaRevision.tomarSeleccionados()">
                                   <i class="fas fa-hand-paper me-1"></i>Tomar
                               </button>
                               <button type="button" class="btn btn-sm btn-warning" onclick="colaRevision.priorizarSeleccionados()">
                                   <i class="fas fa-star me-1"></i>Priorizar
                               </button>
                               <button type="button" class="btn btn-sm btn-info" onclick="colaRevision.reasignarSeleccionados()">
                                   <i class="fas fa-exchange-alt me-1"></i>Reasignar
                               </button>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * ⏳ Renderizar indicador de carga
    */
   renderizarCargando() {
       return `
           <div class="text-center py-5">
               <div class="spinner-border text-primary mb-3" role="status">
                   <span class="visually-hidden">Cargando...</span>
               </div>
               <h5 class="text-muted">Cargando documentos pendientes...</h5>
               <p class="text-muted">Por favor espera mientras obtenemos la información</p>
           </div>
       `;
   }

   /**
    * ⚡ Renderizar acciones rápidas
    */
   renderizarAccionesRapidas() {
       return `
           <div class="d-grid gap-2">
               <button class="btn btn-primary" onclick="colaRevision.tomarSiguiente()">
                   <i class="fas fa-play me-2"></i>Revisar Siguiente
               </button>
               
               <button class="btn btn-info" onclick="colaRevision.verEstadisticasDetalladas()">
                   <i class="fas fa-chart-bar me-2"></i>Estadísticas Detalladas
               </button>
               
               <button class="btn btn-success" onclick="colaRevision.configurarPreferencias()">
                   <i class="fas fa-cog me-2"></i>Configurar Preferencias
               </button>
               
               <hr>
               
               <h6>Filtros Rápidos</h6>
               <button class="btn btn-outline-danger btn-sm" onclick="colaRevision.filtrarPorPrioridad('alta')">
                   <i class="fas fa-exclamation-triangle me-1"></i>Solo Alta Prioridad
               </button>
               
               <button class="btn btn-outline-warning btn-sm" onclick="colaRevision.filtrarVencidos()">
                   <i class="fas fa-clock me-1"></i>Solo Vencidos
               </button>
               
               <button class="btn btn-outline-info btn-sm" onclick="colaRevision.filtrarHoy()">
                   <i class="fas fa-calendar-day me-1"></i>Subidos Hoy
               </button>
           </div>
       `;
   }

   // =====================================
   // MÉTODOS DE RENDERIZADO POR VISTA
   // =====================================

   /**
    * 📋 Renderizar vista de lista
    */
   renderizarVistaLista() {
       if (this.estado.documentos.length === 0) {
           return this.renderizarVacio();
       }

       return `
           <div class="table-responsive">
               <table class="table table-hover mb-0">
                   <thead class="table-light">
                       <tr>
                           <th width="40">
                               <div class="form-check">
                                   <input class="form-check-input" type="checkbox" id="check-todos" 
                                          onchange="colaRevision.toggleSeleccionTodos()">
                               </div>
                           </th>
                           <th>Documento</th>
                           <th>Docente</th>
                           <th>Asignatura</th>
                           <th>Prioridad</th>
                           <th>Tiempo Espera</th>
                           <th>Tamaño</th>
                           <th width="120">Acciones</th>
                       </tr>
                   </thead>
                   <tbody>
                       ${this.estado.documentos.map(doc => this.renderizarFilaDocumento(doc)).join('')}
                   </tbody>
               </table>
           </div>
       `;
   }

   /**
    * 📄 Renderizar fila de documento en tabla
    */
   renderizarFilaDocumento(documento) {
       const tiempoEspera = this.calcularTiempoEspera(documento.fecha_subida);
       const esVencido = this.esDocumentoVencido(documento);
       const colorPrioridad = this.obtenerColorPrioridad(documento.prioridad);
       
       return `
           <tr data-documento-id="${documento.id}" class="${esVencido ? 'table-warning' : ''} ${documento.estado === 'en_revision' ? 'table-info' : ''}">
               <td>
                   <div class="form-check">
                       <input class="form-check-input checkbox-documento" type="checkbox" 
                              value="${documento.id}" onchange="colaRevision.toggleSeleccion()">
                   </div>
               </td>
               <td>
                   <div class="d-flex align-items-center">
                       <i class="fas fa-file-pdf text-danger me-2"></i>
                       <div>
                           <h6 class="mb-0 text-truncate" style="max-width: 200px;" title="${documento.nombre_archivo}">
                               ${documento.nombre_archivo}
                           </h6>
                           <small class="text-muted">${documento.tipo_documento || 'Sin clasificar'}</small>
                       </div>
                   </div>
               </td>
               <td>
                   <div>
                       <span class="fw-medium">${documento.docente_nombre}</span>
                       <br><small class="text-muted">${documento.docente_email}</small>
                   </div>
               </td>
               <td>
                   <span class="text-break" style="max-width: 150px;">${documento.asignatura_nombre}</span>
               </td>
               <td>
                   <span class="badge bg-${colorPrioridad}">
                       ${documento.prioridad?.toUpperCase() || 'NORMAL'}
                   </span>
               </td>
               <td>
                   <span class="${esVencido ? 'text-danger fw-bold' : 'text-muted'}">
                       ${tiempoEspera}
                       ${esVencido ? '<i class="fas fa-exclamation-triangle ms-1"></i>' : ''}
                   </span>
               </td>
               <td>
                   <small class="text-muted">${Utilidades.formatearTamanoArchivo(documento.tamaño_archivo)}</small>
               </td>
               <td>
                   <div class="btn-group btn-group-sm">
                       <button type="button" class="btn btn-outline-primary" 
                               onclick="colaRevision.verDocumento('${documento.id}')" 
                               title="Ver documento">
                           <i class="fas fa-eye"></i>
                       </button>
                       <button type="button" class="btn btn-outline-success" 
                               onclick="colaRevision.tomarDocumento('${documento.id}')" 
                               title="Tomar para revisión">
                           <i class="fas fa-hand-paper"></i>
                       </button>
                       <button type="button" class="btn btn-outline-info" 
                               onclick="colaRevision.verDetalles('${documento.id}')" 
                               title="Ver detalles">
                           <i class="fas fa-info-circle"></i>
                       </button>
                   </div>
               </td>
           </tr>
       `;
   }

   /**
    * 🎴 Renderizar vista de tarjetas
    */
   renderizarVistaTarjetas() {
       if (this.estado.documentos.length === 0) {
           return this.renderizarVacio();
       }

       return `
           <div class="row g-3 p-3">
               ${this.estado.documentos.map(doc => this.renderizarTarjetaDocumento(doc)).join('')}
           </div>
       `;
   }

   /**
    * 🎴 Renderizar tarjeta individual de documento
    */
   renderizarTarjetaDocumento(documento) {
       const tiempoEspera = this.calcularTiempoEspera(documento.fecha_subida);
       const esVencido = this.esDocumentoVencido(documento);
       const colorPrioridad = this.obtenerColorPrioridad(documento.prioridad);
       
       return `
           <div class="col-md-6 col-lg-4">
               <div class="card h-100 ${esVencido ? 'border-warning' : ''} ${documento.estado === 'en_revision' ? 'border-info' : ''}">
                   <div class="card-header d-flex justify-content-between align-items-start">
                       <div class="form-check">
                           <input class="form-check-input checkbox-documento" type="checkbox" 
                                  value="${documento.id}" onchange="colaRevision.toggleSeleccion()">
                       </div>
                       <span class="badge bg-${colorPrioridad}">
                           ${documento.prioridad?.toUpperCase() || 'NORMAL'}
                       </span>
                   </div>
                   
                   <div class="card-body">
                       <div class="d-flex align-items-center mb-2">
                           <i class="fas fa-file-pdf text-danger fa-2x me-3"></i>
                           <div class="flex-grow-1">
                               <h6 class="card-title mb-1 text-truncate" title="${documento.nombre_archivo}">
                                   ${documento.nombre_archivo}
                               </h6>
                               <small class="text-muted">${documento.tipo_documento || 'Sin clasificar'}</small>
                           </div>
                       </div>
                       
                       <div class="mb-2">
                           <strong>Docente:</strong><br>
                           <span class="text-muted">${documento.docente_nombre}</span>
                       </div>
                       
                       <div class="mb-2">
                           <strong>Asignatura:</strong><br>
                           <span class="text-muted text-truncate d-block">${documento.asignatura_nombre}</span>
                       </div>
                       
                       <div class="mb-3">
                           <strong>Tiempo de espera:</strong><br>
                           <span class="${esVencido ? 'text-danger fw-bold' : 'text-muted'}">
                               ${tiempoEspera}
                               ${esVencido ? '<i class="fas fa-exclamation-triangle ms-1"></i>' : ''}
                           </span>
                       </div>
                   </div>
                   
                   <div class="card-footer">
                       <div class="d-grid gap-2">
                           <button type="button" class="btn btn-primary btn-sm" 
                                   onclick="colaRevision.tomarDocumento('${documento.id}')">
                               <i class="fas fa-hand-paper me-1"></i>Tomar para Revisión
                           </button>
                           <div class="btn-group">
                               <button type="button" class="btn btn-outline-info btn-sm" 
                                       onclick="colaRevision.verDocumento('${documento.id}')">
                                   <i class="fas fa-eye me-1"></i>Ver
                               </button>
                               <button type="button" class="btn btn-outline-secondary btn-sm" 
                                       onclick="colaRevision.verDetalles('${documento.id}')">
                                   <i class="fas fa-info-circle me-1"></i>Detalles
                               </button>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 📋 Renderizar vista Kanban
    */
   renderizarVistaKanban() {
       const documentosPorEstado = this.agruparDocumentosPorEstado();
       
       return `
           <div class="row g-3 p-3">
               <div class="col-md-4">
                   <div class="card">
                       <div class="card-header bg-warning text-white">
                           <h6 class="mb-0">
                               <i class="fas fa-clock me-2"></i>Pendientes 
                               <span class="badge bg-light text-dark">${documentosPorEstado.pendiente?.length || 0}</span>
                           </h6>
                       </div>
                       <div class="card-body p-2" style="max-height: 600px; overflow-y: auto;">
                           ${documentosPorEstado.pendiente?.map(doc => this.renderizarTarjetaKanban(doc, 'pendiente')).join('') || 
                             '<p class="text-muted text-center py-3">No hay documentos pendientes</p>'}
                       </div>
                   </div>
               </div>
               
               <div class="col-md-4">
                   <div class="card">
                       <div class="card-header bg-info text-white">
                           <h6 class="mb-0">
                               <i class="fas fa-eye me-2"></i>En Revisión 
                               <span class="badge bg-light text-dark">${documentosPorEstado.en_revision?.length || 0}</span>
                           </h6>
                       </div>
                       <div class="card-body p-2" style="max-height: 600px; overflow-y: auto;">
                           ${documentosPorEstado.en_revision?.map(doc => this.renderizarTarjetaKanban(doc, 'en_revision')).join('') || 
                             '<p class="text-muted text-center py-3">No hay documentos en revisión</p>'}
                       </div>
                   </div>
               </div>
               
               <div class="col-md-4">
                   <div class="card">
                       <div class="card-header bg-danger text-white">
                           <h6 class="mb-0">
                               <i class="fas fa-exclamation-triangle me-2"></i>Vencidos 
                               <span class="badge bg-light text-dark">${documentosPorEstado.vencido?.length || 0}</span>
                           </h6>
                       </div>
                       <div class="card-body p-2" style="max-height: 600px; overflow-y: auto;">
                           ${documentosPorEstado.vencido?.map(doc => this.renderizarTarjetaKanban(doc, 'vencido')).join('') || 
                             '<p class="text-muted text-center py-3">No hay documentos vencidos</p>'}
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 🎴 Renderizar tarjeta para vista Kanban
    */
   renderizarTarjetaKanban(documento, columna) {
       const tiempoEspera = this.calcularTiempoEspera(documento.fecha_subida);
       const colorPrioridad = this.obtenerColorPrioridad(documento.prioridad);
       
       return `
           <div class="card mb-2 kanban-card" data-documento-id="${documento.id}">
               <div class="card-body p-2">
                   <div class="d-flex justify-content-between align-items-start mb-2">
                       <span class="badge bg-${colorPrioridad} text-white small">
                           ${documento.prioridad?.toUpperCase() || 'NORMAL'}
                       </span>
                       <button type="button" class="btn btn-sm btn-outline-primary" 
                               onclick="colaRevision.tomarDocumento('${documento.id}')" 
                               title="Tomar documento">
                           <i class="fas fa-hand-paper"></i>
                       </button>
                   </div>
                   
                   <h6 class="card-title small mb-1 text-truncate" title="${documento.nombre_archivo}">
                       ${documento.nombre_archivo}
                   </h6>
                   
                   <p class="card-text small text-muted mb-1">
                       <i class="fas fa-user me-1"></i>${documento.docente_nombre}
                   </p>
                   
                   <p class="card-text small text-muted mb-2">
                       <i class="fas fa-book me-1"></i>
                       <span class="text-truncate d-inline-block" style="max-width: 120px;">
                           ${documento.asignatura_nombre}
                       </span>
                   </p>
                   
                   <div class="d-flex justify-content-between align-items-center">
                       <small class="text-muted">
                           <i class="fas fa-clock me-1"></i>${tiempoEspera}
                       </small>
                       <div class="btn-group">
                           <button type="button" class="btn btn-sm btn-outline-info" 
                                   onclick="colaRevision.verDocumento('${documento.id}')" 
                                   title="Ver documento">
                               <i class="fas fa-eye"></i>
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 📭 Renderizar vista vacía
    */
   renderizarVacio() {
       return `
           <div class="text-center py-5">
               <i class="fas fa-inbox fa-4x text-muted mb-3"></i>
               <h4 class="text-muted">No hay documentos en la cola</h4>
               <p class="text-muted">
                   ¡Excelente trabajo! No tienes documentos pendientes de revisión en este momento.
               </p>
               <button type="button" class="btn btn-primary" onclick="colaRevision.actualizarDatos()">
                   <i class="fas fa-sync-alt me-1"></i>Actualizar
               </button>
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
           this.cargarDocumentosPendientes(),
           this.cargarEstadisticas(),
           this.cargarDocentesParaFiltro(),
           this.cargarAsignaturasParaFiltro()
       ]);
   }

   /**
    * 📄 Cargar documentos pendientes
    */
   async cargarDocumentosPendientes() {
       try {
           const parametros = {
               verificador_id: 'yo', // El backend resolverá al verificador actual
               ...this.estado.filtros,
               orden: `${this.estado.ordenamiento.campo}_${this.estado.ordenamiento.direccion}`
           };

           const response = await ClienteAPI.get('/verificacion/pendientes', { params: parametros });
           
           this.estado.documentos = response.data.documentos || [];
           this.estado.estadisticas = response.data.estadisticas || {};
           
           this.renderizarDocumentosPorVista();
           this.actualizarEstadisticas();
           
       } catch (error) {
           console.error('Error cargando documentos:', error);
           this.mostrarErrorCarga();
       }
   }

   /**
    * 📈 Cargar estadísticas
    */
   async cargarEstadisticas() {
       try {
           const response = await ClienteAPI.get('/verificacion/estadisticas/verificador/mi');
           this.estado.estadisticas = { ...this.estado.estadisticas, ...response.data };
           this.actualizarEstadisticas();
       } catch (error) {
           console.warn('Error cargando estadísticas:', error);
       }
   }

   /**
    * 👥 Cargar docentes para filtro
    */
   async cargarDocentesParaFiltro() {
       try {
           const response = await ClienteAPI.get('/verificacion/mis-asignaciones');
           const select = document.getElementById('filtro-docente');
           
           if (select && response.data) {
               response.data.forEach(asignacion => {
                   const option = document.createElement('option');
                   option.value = asignacion.docente_id;
                   option.textContent = asignacion.docente_nombre;
                   select.appendChild(option);
               });
           }
       } catch (error) {
           console.warn('Error cargando docentes:', error);
       }
   }

   /**
    * 📚 Cargar asignaturas para filtro
    */
   async cargarAsignaturasParaFiltro() {
       try {
           const response = await ClienteAPI.get('/asignaturas/verificador/mis');
           const select = document.getElementById('filtro-asignatura');
           
           if (select && response.data) {
               response.data.forEach(asignatura => {
                   const option = document.createElement('option');
                   option.value = asignatura.id;
                   option.textContent = asignatura.nombre;
                   select.appendChild(option);
               });
           }
       } catch (error) {
           console.warn('Error cargando asignaturas:', error);
       }
   }

   // =====================================
   // MÉTODOS DE ACCIONES PRINCIPALES
   // =====================================

   /**
    * 👀 Ver documento
    */
   async verDocumento(documentoId) {
       try {
           window.location.href = `/paginas/verificador/revisar.html?documento=${documentoId}`;
       } catch (error) {
           console.error('Error navegando a revisar documento:', error);
           Utilidades.mostrarNotificacion('Error al abrir el documento', 'error');
       }
   }

   /**
    * ✋ Tomar documento para revisión
    */
   async tomarDocumento(documentoId) {
       try {
           const confirmar = await Utilidades.confirmar(
               'Tomar documento',
               '¿Deseas tomar este documento para revisión?',
               'question'
           );
           
           if (!confirmar) return;
           
           await ClienteAPI.post(`/verificacion/${documentoId}/tomar`);
           Utilidades.mostrarNotificacion('Documento tomado para revisión', 'success');
           
           // Navegar directamente a la revisión
           window.location.href = `/paginas/verificador/revisar.html?documento=${documentoId}`;
           
       } catch (error) {
           console.error('Error tomando documento:', error);
           Utilidades.mostrarNotificacion('Error al tomar el documento', 'error');
       }
   }

   /**
    * ▶️ Tomar siguiente documento automáticamente
    */
   async tomarSiguiente() {
       try {
           if (this.estado.documentos.length === 0) {
               Utilidades.mostrarNotificacion('No hay documentos disponibles', 'warning');
               return;
           }
           
           // Tomar el primer documento de mayor prioridad
           const siguienteDocumento = this.estado.documentos[0];
           await this.tomarDocumento(siguienteDocumento.id);
           
       } catch (error) {
           console.error('Error tomando siguiente documento:', error);
           Utilidades.mostrarNotificacion('Error al tomar el siguiente documento', 'error');
       }
   }

   /**
    * ℹ️ Ver detalles del documento
    */
   async verDetalles(documentoId) {
       try {
           const response = await ClienteAPI.get(`/documentos/${documentoId}/detalles`);
           const documento = response.data;
           
           this.sistemaModales.mostrarModal({
               titulo: `Detalles: ${documento.nombre_archivo}`,
               contenido: this.renderizarDetallesDocumento(documento),
               botones: [
                   {
                       texto: 'Tomar para Revisión',
                       clase: 'btn-primary',
                       accion: () => this.tomarDocumento(documentoId)
                   },
                   {
                       texto: 'Cerrar',
                       clase: 'btn-secondary'
                   }
               ]
           });
           
       } catch (error) {
           console.error('Error cargando detalles:', error);
           Utilidades.mostrarNotificacion('Error cargando los detalles', 'error');
       }
   }

   // =====================================
   // MÉTODOS AUXILIARES
   // =====================================

   /**
    * ⏰ Calcular tiempo de espera
    */
   calcularTiempoEspera(fechaSubida) {
       return Utilidades.formatearFechaRelativa(fechaSubida);
   }

   /**
    * ⚠️ Verificar si documento está vencido
    */
   esDocumentoVencido(documento) {
       const ahora = new Date();
       const fechaSubida = new Date(documento.fecha_subida);
       const horasEspera = (ahora - fechaSubida) / (1000 * 60 * 60);
       
       // Considerar vencido después de 48 horas
       return horasEspera > 48;
   }

   /**
    * 🎨 Obtener color para prioridad
    */
   obtenerColorPrioridad(prioridad) {
       const colores = {
           'alta': 'danger',
           'media': 'warning',
           'baja': 'info'
       };
       return colores[prioridad] || 'secondary';
   }

   /**
    * 📊 Agrupar documentos por estado
    */
   agruparDocumentosPorEstado() {
       const grupos = {
           pendiente: [],
           en_revision: [],
           vencido: []
       };
       
       this.estado.documentos.forEach(doc => {
           if (this.esDocumentoVencido(doc)) {
               grupos.vencido.push(doc);
           } else if (doc.estado === 'en_revision') {
               grupos.en_revision.push(doc);
           } else {
               grupos.pendiente.push(doc);
           }
       });
       
       return grupos;
   }

   /**
    * 🎨 Renderizar documentos según vista actual
    */
   renderizarDocumentosPorVista() {
       const contenedor = document.getElementById('contenido-documentos');
       if (!contenedor) return;
       
       let contenido;
       switch (this.estado.vista) {
           case 'tarjetas':
               contenido = this.renderizarVistaTarjetas();
               break;
           case 'kanban':
               contenido = this.renderizarVistaKanban();
               break;
           default:
               contenido = this.renderizarVistaLista();
       }
       
       contenedor.innerHTML = contenido;
       this.actualizarContadorDocumentos();
   }

   /**
    * 📊 Actualizar estadísticas en header
    */
   actualizarEstadisticas() {
       const elementos = {
           'stat-total': this.estado.estadisticas.total || 0,
           'stat-pendientes': this.estado.estadisticas.pendientes || 0,
           'stat-revision': this.estado.estadisticas.en_revision || 0,
           'stat-vencidos': this.estado.estadisticas.vencidos || 0
       };

       Object.entries(elementos).forEach(([id, valor]) => {
           const elemento = document.getElementById(id);
           if (elemento) {
               elemento.textContent = valor;
           }
       });
   }

   /**
    * 🔢 Actualizar contador de documentos
    */
   actualizarContadorDocumentos() {
       const contador = document.getElementById('contador-documentos');
       if (contador) {
           contador.textContent = this.estado.documentos.length;
       }
   }

   // =====================================
   // MÉTODOS PÚBLICOS PARA INTERFAZ
   // =====================================

   /**
    * 🔄 Cambiar vista
    */
   cambiarVista(nuevaVista) {
       this.estado.vista = nuevaVista;
       
       // Actualizar botones de vista
       document.querySelectorAll('[data-vista]').forEach(btn => {
           btn.classList.toggle('active', btn.dataset.vista === nuevaVista);
       });
       
       this.renderizarDocumentosPorVista();
       this.guardarConfiguracionUsuario();
   }

   /**
    * 🔍 Aplicar filtros
    */
   async aplicarFiltros() {
       this.estado.filtros = {
           busqueda: document.getElementById('filtro-busqueda')?.value || '',
           prioridad: document.getElementById('filtro-prioridad')?.value || '',
           tipo_documento: document.getElementById('filtro-tipo')?.value || '',
           tiempo_espera: document.getElementById('filtro-tiempo')?.value || '',
           docente: document.getElementById('filtro-docente')?.value || '',
           asignatura: document.getElementById('filtro-asignatura')?.value || '',
           fecha_desde: document.getElementById('filtro-fecha-desde')?.value || '',
           fecha_hasta: document.getElementById('filtro-fecha-hasta')?.value || ''
       };
       
       await this.cargarDocumentosPendientes();
   }

   /**
    * 🧹 Limpiar filtros
    */
   async limpiarFiltros() {
       // Limpiar campos de filtro
       document.querySelectorAll('#filtro-busqueda, #filtro-prioridad, #filtro-tipo, #filtro-tiempo, #filtro-docente, #filtro-asignatura, #filtro-fecha-desde, #filtro-fecha-hasta').forEach(campo => {
           campo.value = '';
       });
       
       // Resetear estado
       this.estado.filtros = {
           busqueda: '', prioridad: '', fecha_desde: '', fecha_hasta: '',
           docente: '', asignatura: '', tipo_documento: '', tiempo_espera: ''
       };
       
       await this.cargarDocumentosPendientes();
   }

   /**
    * 🔄 Actualizar datos
    */
   async actualizarDatos() {
       await this.cargarDatosIniciales();
       Utilidades.mostrarNotificacion('Datos actualizados', 'success');
   }

   // =====================================
   // CONFIGURACIÓN Y EVENTOS
   // =====================================

   /**
    * 🔧 Configurar elementos DOM
    */
   configurarElementosDOM() {
       this.elementos = {
           contenedorPrincipal: document.querySelector('#cola-revision-content'),
           listaDatos: document.getElementById('contenido-documentos'),
           panelFiltros: document.querySelector('.card-body'),
           estadisticas: document.querySelector('.row.g-3')
       };
   }

   /**
    * ⚙️ Configurar eventos
    */
   configurarEventos() {
       // Búsqueda en tiempo real
       const buscador = document.getElementById('filtro-busqueda');
       if (buscador) {
           buscador.addEventListener('input', Utilidades.debounce(() => {
               this.aplicarFiltros();
           }, 500));
       }
       
       // Auto-refresh toggle
       const autoRefreshToggle = document.getElementById('auto-refresh');
       if (autoRefreshToggle) {
           autoRefreshToggle.addEventListener('change', (e) => {
               this.estado.configuracion.autoRefresh = e.target.checked;
               this.toggleActualizacionAutomatica();
               this.guardarConfiguracionUsuario();
           });
       }
   }

   /**
    * 🔄 Iniciar actualización automática
    */
   iniciarActualizacionAutomatica() {
       if (!this.estado.configuracion.autoRefresh) return;

       this.intervalos.autoRefresh = setInterval(() => {
           this.cargarDocumentosPendientes();
       }, this.estado.configuracion.intervaloRefresh);
       
       this.intervalos.estadisticas = setInterval(() => {
           this.cargarEstadisticas();
       }, 60000); // Estadísticas cada minuto
   }

   /**
    * 🔄 Toggle actualización automática
    */
   toggleActualizacionAutomatica() {
       if (this.estado.configuracion.autoRefresh) {
           this.iniciarActualizacionAutomatica();
       } else {
           Object.values(this.intervalos).forEach(intervalo => {
               if (intervalo) clearInterval(intervalo);
           });
       }
   }

   /**
    * 💾 Cargar configuración del usuario
    */
   async cargarConfiguracionUsuario() {
       try {
           const config = localStorage.getItem('cola_revision_config');
           if (config) {
               const configuracion = JSON.parse(config);
               this.estado.configuracion = { ...this.estado.configuracion, ...configuracion };
               this.estado.vista = configuracion.vista || 'lista';
           }
       } catch (error) {
           console.warn('Error cargando configuración:', error);
       }
   }

   /**
    * 💾 Guardar configuración del usuario
    */
   async guardarConfiguracionUsuario() {
       try {
           const config = {
               ...this.estado.configuracion,
               vista: this.estado.vista
           };
           localStorage.setItem('cola_revision_config', JSON.stringify(config));
       } catch (error) {
           console.warn('Error guardando configuración:', error);
       }
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
               <li class="breadcrumb-item active">Cola de Revisión</li>
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
let colaRevision;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
   colaRevision = new ColaRevision();
});

// Cleanup al salir de la página
window.addEventListener('beforeunload', () => {
   if (colaRevision) {
       colaRevision.destruir();
   }
});