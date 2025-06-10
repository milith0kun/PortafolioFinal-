/**
 * 📁 GESTOR DE PORTAFOLIOS
 * Sistema Portafolio Docente UNSAAC
 * 
 * Página principal para gestionar portafolios del docente
 * Incluye creación, organización, seguimiento y configuración de portafolios
 */

class GestorPortafolios {
   constructor() {
       this.servicioPortafolios = new ServicioPortafolios();
       this.servicioDocumentos = new ServicioDocumentos();
       this.servicioAsignaturas = new ServicioAsignaturas();
       this.servicioCiclos = new ServicioCiclos();
       this.servicioObservaciones = new ServicioObservaciones();
       
       this.usuario = SistemaAutenticacion.obtenerUsuario();
       this.portafolios = [];
       this.portafolioSeleccionado = null;
       this.vistActual = 'tarjetas'; // tarjetas, lista, calendario
       this.filtros = {
           ciclo: '',
           estado: '',
           progreso: '',
           busqueda: ''
       };
       
       this.inicializar();
   }

   /**
    * Inicializa el gestor de portafolios
    */
   async inicializar() {
       try {
           await this.verificarPermisos();
           await this.cargarDatos();
           this.configurarInterfaz();
           this.configurarEventos();
           
           Utilidades.mostrarNotificacion('Gestor de portafolios cargado', 'success');
       } catch (error) {
           console.error('Error al inicializar gestor de portafolios:', error);
           Utilidades.mostrarNotificacion('Error al cargar la página', 'error');
       }
   }

   /**
    * Verifica permisos de docente
    */
   async verificarPermisos() {
       if (!this.usuario || !this.usuario.rolesActivos.includes('docente')) {
           window.location.href = '/acceso-denegado.html';
           throw new Error('Sin permisos de docente');
       }
   }

   /**
    * Carga datos necesarios
    */
   async cargarDatos() {
       try {
           Utilidades.mostrarCargando('#contenedor-portafolios');
           
           const [
               portafolios,
               asignaturas,
               ciclos,
               estadisticasGenerales,
               configuracionPortafolios
           ] = await Promise.all([
               this.servicioPortafolios.obtenerMisPortafolios(),
               this.servicioAsignaturas.obtenerMisAsignaturas(),
               this.servicioCiclos.obtenerTodos(),
               this.servicioPortafolios.obtenerEstadisticasGenerales(),
               this.servicioPortafolios.obtenerConfiguracion()
           ]);
           
           this.portafolios = portafolios;
           this.asignaturas = asignaturas;
           this.ciclos = ciclos;
           this.estadisticasGenerales = estadisticasGenerales;
           this.configuracionPortafolios = configuracionPortafolios;
           
       } catch (error) {
           console.error('Error al cargar datos:', error);
           throw error;
       } finally {
           Utilidades.ocultarCargando('#contenedor-portafolios');
       }
   }

   /**
    * Configura la interfaz inicial
    */
   configurarInterfaz() {
       this.crearBarraHerramientas();
       this.mostrarEstadisticasResumen();
       this.crearFiltrosYBusqueda();
       this.mostrarPortafolios();
       this.crearPanelAccionesRapidas();
   }

   /**
    * Crea la barra de herramientas superior
    */
   crearBarraHerramientas() {
       const barraHtml = `
           <div class="card mb-4">
               <div class="card-body py-3">
                   <div class="row align-items-center">
                       <div class="col-md-6">
                           <h5 class="m-0">
                               <i class="fas fa-folders me-2"></i>
                               Mis Portafolios
                           </h5>
                           <small class="text-muted">
                               Gestiona y organiza tus portafolios académicos
                           </small>
                       </div>
                       <div class="col-md-6 text-end">
                           <div class="btn-group me-2">
                               <button class="btn btn-outline-secondary btn-sm active" 
                                       data-vista="tarjetas" title="Vista de tarjetas">
                                   <i class="fas fa-th-large"></i>
                               </button>
                               <button class="btn btn-outline-secondary btn-sm" 
                                       data-vista="lista" title="Vista de lista">
                                   <i class="fas fa-list"></i>
                               </button>
                               <button class="btn btn-outline-secondary btn-sm" 
                                       data-vista="calendario" title="Vista de calendario">
                                   <i class="fas fa-calendar"></i>
                               </button>
                           </div>
                           
                           <div class="btn-group">
                               <button class="btn btn-primary btn-sm" id="btn-crear-portafolio">
                                   <i class="fas fa-plus me-1"></i>
                                   Nuevo Portafolio
                               </button>
                               <button class="btn btn-outline-primary btn-sm dropdown-toggle" 
                                       data-bs-toggle="dropdown">
                                   <i class="fas fa-cog"></i>
                               </button>
                               <ul class="dropdown-menu">
                                   <li><a class="dropdown-item" href="#" id="importar-portafolio">
                                       <i class="fas fa-file-import me-2"></i>Importar Portafolio
                                   </a></li>
                                   <li><a class="dropdown-item" href="#" id="exportar-portafolios">
                                       <i class="fas fa-file-export me-2"></i>Exportar Portafolios
                                   </a></li>
                                   <li><hr class="dropdown-divider"></li>
                                   <li><a class="dropdown-item" href="#" id="configurar-portafolios">
                                       <i class="fas fa-cog me-2"></i>Configuración
                                   </a></li>
                               </ul>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('barra-herramientas').innerHTML = barraHtml;
   }

   /**
    * Muestra estadísticas de resumen
    */
   mostrarEstadisticasResumen() {
       const stats = this.estadisticasGenerales;
       
       const estadisticasHtml = `
           <div class="row mb-4">
               <div class="col-xl-3 col-md-6">
                   <div class="card border-left-primary shadow h-100 py-2">
                       <div class="card-body">
                           <div class="row no-gutters align-items-center">
                               <div class="col mr-2">
                                   <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                       Total Portafolios
                                   </div>
                                   <div class="h5 mb-0 font-weight-bold text-gray-800">
                                       ${this.portafolios.length}
                                   </div>
                               </div>
                               <div class="col-auto">
                                   <i class="fas fa-folder fa-2x text-gray-300"></i>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
               
               <div class="col-xl-3 col-md-6">
                   <div class="card border-left-success shadow h-100 py-2">
                       <div class="card-body">
                           <div class="row no-gutters align-items-center">
                               <div class="col mr-2">
                                   <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                                       Completitud Promedio
                                   </div>
                                   <div class="row no-gutters align-items-center">
                                       <div class="col-auto">
                                           <div class="h5 mb-0 mr-3 font-weight-bold text-gray-800">
                                               ${stats.completitudPromedio || 0}%
                                           </div>
                                       </div>
                                       <div class="col">
                                           <div class="progress progress-sm mr-2">
                                               <div class="progress-bar bg-success" 
                                                    style="width: ${stats.completitudPromedio || 0}%"></div>
                                           </div>
                                       </div>
                                   </div>
                               </div>
                               <div class="col-auto">
                                   <i class="fas fa-chart-pie fa-2x text-gray-300"></i>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
               
               <div class="col-xl-3 col-md-6">
                   <div class="card border-left-info shadow h-100 py-2">
                       <div class="card-body">
                           <div class="row no-gutters align-items-center">
                               <div class="col mr-2">
                                   <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                                       Documentos Subidos
                                   </div>
                                   <div class="h5 mb-0 font-weight-bold text-gray-800">
                                       ${stats.documentosSubidos || 0}
                                   </div>
                               </div>
                               <div class="col-auto">
                                   <i class="fas fa-file-upload fa-2x text-gray-300"></i>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
               
               <div class="col-xl-3 col-md-6">
                   <div class="card border-left-warning shadow h-100 py-2">
                       <div class="card-body">
                           <div class="row no-gutters align-items-center">
                               <div class="col mr-2">
                                   <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                       Observaciones Pendientes
                                   </div>
                                   <div class="h5 mb-0 font-weight-bold text-gray-800">
                                       ${stats.observacionesPendientes || 0}
                                   </div>
                               </div>
                               <div class="col-auto">
                                   <i class="fas fa-comment fa-2x text-gray-300"></i>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('estadisticas-resumen').innerHTML = estadisticasHtml;
   }

   /**
    * Crea filtros y búsqueda
    */
   crearFiltrosYBusqueda() {
       const filtrosHtml = `
           <div class="card mb-4">
               <div class="card-body">
                   <div class="row">
                       <div class="col-md-3">
                           <label class="form-label">Buscar</label>
                           <input type="text" class="form-control" id="busqueda-portafolios" 
                                  placeholder="Nombre, asignatura...">
                       </div>
                       <div class="col-md-2">
                           <label class="form-label">Ciclo</label>
                           <select class="form-select" id="filtro-ciclo">
                               <option value="">Todos</option>
                               ${this.ciclos.map(ciclo => `
                                   <option value="${ciclo.id}">${ciclo.nombre}</option>
                               `).join('')}
                           </select>
                       </div>
                       <div class="col-md-2">
                           <label class="form-label">Estado</label>
                           <select class="form-select" id="filtro-estado">
                               <option value="">Todos</option>
                               <option value="activo">Activo</option>
                               <option value="bloqueado">Bloqueado</option>
                               <option value="archivado">Archivado</option>
                           </select>
                       </div>
                       <div class="col-md-2">
                           <label class="form-label">Progreso</label>
                           <select class="form-select" id="filtro-progreso">
                               <option value="">Todos</option>
                               <option value="bajo">Menos del 30%</option>
                               <option value="medio">30% - 70%</option>
                               <option value="alto">Más del 70%</option>
                               <option value="completo">100%</option>
                           </select>
                       </div>
                       <div class="col-md-2">
                           <label class="form-label">Ordenar por</label>
                           <select class="form-select" id="ordenar-por">
                               <option value="nombre">Nombre</option>
                               <option value="progreso">Progreso</option>
                               <option value="fecha">Fecha</option>
                               <option value="estado">Estado</option>
                           </select>
                       </div>
                       <div class="col-md-1">
                           <label class="form-label">&nbsp;</label>
                           <div class="d-grid">
                               <button class="btn btn-outline-secondary" id="btn-limpiar-filtros">
                                   <i class="fas fa-times"></i>
                               </button>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('filtros-busqueda').innerHTML = filtrosHtml;
   }

   /**
    * Muestra portafolios según la vista seleccionada
    */
   mostrarPortafolios() {
       const portafoliosFiltrados = this.aplicarFiltros(this.portafolios);
       
       switch (this.vistActual) {
           case 'tarjetas':
               this.mostrarVistaTarjetas(portafoliosFiltrados);
               break;
           case 'lista':
               this.mostrarVistaLista(portafoliosFiltrados);
               break;
           case 'calendario':
               this.mostrarVistaCalendario(portafoliosFiltrados);
               break;
       }
   }

   /**
    * Muestra portafolios en vista de tarjetas
    */
   mostrarVistaTarjetas(portafolios) {
       if (portafolios.length === 0) {
           document.getElementById('contenido-portafolios').innerHTML = `
               <div class="text-center py-5">
                   <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
                   <h5>No hay portafolios</h5>
                   <p class="text-muted">
                       ${this.hayFiltrosActivos() ? 
                           'No se encontraron portafolios con los filtros aplicados' :
                           'Crea tu primer portafolio para comenzar'
                       }
                   </p>
                   <button class="btn btn-primary" onclick="document.getElementById('btn-crear-portafolio').click()">
                       <i class="fas fa-plus me-1"></i>
                       Crear Primer Portafolio
                   </button>
               </div>
           `;
           return;
       }
       
       const tarjetasHtml = `
           <div class="row">
               ${portafolios.map(portafolio => this.generarTarjetaPortafolio(portafolio)).join('')}
           </div>
       `;
       
       document.getElementById('contenido-portafolios').innerHTML = tarjetasHtml;
   }

   /**
    * Genera una tarjeta de portafolio
    */
   generarTarjetaPortafolio(portafolio) {
       const progreso = portafolio.progresoCompletado || 0;
       const colorProgreso = progreso >= 80 ? 'success' : progreso >= 60 ? 'warning' : 'danger';
       const estadoClass = {
           'activo': 'success',
           'bloqueado': 'warning',
           'archivado': 'secondary'
       };
       
       return `
           <div class="col-xl-4 col-lg-6 col-md-6 mb-4">
               <div class="card portafolio-card h-100 shadow-sm" data-portafolio-id="${portafolio.id}">
                   <div class="card-header d-flex justify-content-between align-items-center">
                       <h6 class="m-0 text-truncate" title="${portafolio.nombre}">
                           ${Utilidades.truncarTexto(portafolio.nombre, 25)}
                       </h6>
                       <div class="dropdown">
                           <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="dropdown">
                               <i class="fas fa-ellipsis-v"></i>
                           </button>
                           <ul class="dropdown-menu">
                               <li><a class="dropdown-item" href="#" onclick="window.gestorPortafolios.editarPortafolio('${portafolio.id}')">
                                   <i class="fas fa-edit me-2"></i>Editar
                               </a></li>
                               <li><a class="dropdown-item" href="#" onclick="window.gestorPortafolios.duplicarPortafolio('${portafolio.id}')">
                                   <i class="fas fa-copy me-2"></i>Duplicar
                               </a></li>
                               <li><a class="dropdown-item" href="#" onclick="window.gestorPortafolios.exportarPortafolio('${portafolio.id}')">
                                   <i class="fas fa-download me-2"></i>Exportar
                               </a></li>
                               <li><hr class="dropdown-divider"></li>
                               <li><a class="dropdown-item text-danger" href="#" onclick="window.gestorPortafolios.eliminarPortafolio('${portafolio.id}')">
                                   <i class="fas fa-trash me-2"></i>Eliminar
                               </a></li>
                           </ul>
                       </div>
                   </div>
                   
                   <div class="card-body">
                       <div class="mb-3">
                           <div class="d-flex justify-content-between align-items-center mb-1">
                               <span class="small text-muted">Progreso</span>
                               <span class="small font-weight-bold text-${colorProgreso}">${progreso}%</span>
                           </div>
                           <div class="progress progress-sm">
                               <div class="progress-bar bg-${colorProgreso}" 
                                    style="width: ${progreso}%" 
                                    role="progressbar"></div>
                           </div>
                       </div>
                       
                       <div class="mb-3">
                           <div class="small text-muted mb-1">Asignatura</div>
                           <div class="font-weight-bold">${portafolio.asignatura}</div>
                       </div>
                       
                       <div class="row text-center mb-3">
                           <div class="col-4">
                               <div class="small text-muted">Documentos</div>
                               <div class="font-weight-bold">${portafolio.documentosSubidos || 0}</div>
                           </div>
                           <div class="col-4">
                               <div class="small text-muted">Observaciones</div>
                               <div class="font-weight-bold text-warning">${portafolio.observacionesPendientes || 0}</div>
                           </div>
                           <div class="col-4">
                               <div class="small text-muted">Estado</div>
                               <span class="badge badge-${estadoClass[portafolio.estado] || 'secondary'} badge-sm">
                                   ${portafolio.estado}
                               </span>
                           </div>
                       </div>
                       
                       <div class="small text-muted mb-2">
                           <i class="fas fa-calendar me-1"></i>
                           ${portafolio.ciclo} • ${portafolio.semestre}
                       </div>
                       
                       <div class="small text-muted">
                           <i class="fas fa-clock me-1"></i>
                           Actualizado ${Utilidades.formatearTiempoRelativo(portafolio.ultimaModificacion)}
                       </div>
                   </div>
                   
                   <div class="card-footer bg-transparent">
                       <div class="btn-group w-100">
                           <a href="/docente/explorador.html?portafolio=${portafolio.id}" 
                              class="btn btn-primary btn-sm">
                               <i class="fas fa-folder-open me-1"></i>
                               Explorar
                           </a>
                           <a href="/docente/subir.html?portafolio=${portafolio.id}" 
                              class="btn btn-outline-primary btn-sm">
                               <i class="fas fa-upload me-1"></i>
                               Subir
                           </a>
                           <a href="/docente/progreso.html?portafolio=${portafolio.id}" 
                              class="btn btn-outline-info btn-sm">
                               <i class="fas fa-chart-pie me-1"></i>
                               Progreso
                           </a>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * Muestra portafolios en vista de lista
    */
   mostrarVistaLista(portafolios) {
       if (portafolios.length === 0) {
           document.getElementById('contenido-portafolios').innerHTML = `
               <div class="text-center py-5">
                   <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
                   <h5>No hay portafolios</h5>
                   <p class="text-muted">No se encontraron portafolios con los filtros aplicados</p>
               </div>
           `;
           return;
       }
       
       const listaHtml = `
           <div class="card">
               <div class="card-body p-0">
                   <div class="table-responsive">
                       <table class="table table-hover mb-0">
                           <thead>
                               <tr>
                                   <th>Portafolio</th>
                                   <th>Asignatura</th>
                                   <th>Ciclo</th>
                                   <th>Progreso</th>
                                   <th>Documentos</th>
                                   <th>Estado</th>
                                   <th>Última Modificación</th>
                                   <th>Acciones</th>
                               </tr>
                           </thead>
                           <tbody>
                               ${portafolios.map(portafolio => this.generarFilaPortafolio(portafolio)).join('')}
                           </tbody>
                       </table>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('contenido-portafolios').innerHTML = listaHtml;
   }

   /**
    * Genera una fila de portafolio para la vista de lista
    */
   generarFilaPortafolio(portafolio) {
       const progreso = portafolio.progresoCompletado || 0;
       const colorProgreso = progreso >= 80 ? 'success' : progreso >= 60 ? 'warning' : 'danger';
       const estadoClass = {
           'activo': 'success',
           'bloqueado': 'warning',
           'archivado': 'secondary'
       };
       
       return `
           <tr data-portafolio-id="${portafolio.id}">
               <td>
                   <div class="d-flex align-items-center">
                       <i class="fas fa-folder text-primary me-2"></i>
                       <div>
                           <div class="font-weight-bold">${portafolio.nombre}</div>
                           <small class="text-muted">${portafolio.descripcion || ''}</small>
                       </div>
                   </div>
               </td>
               <td>
                   <div class="font-weight-bold">${portafolio.asignatura}</div>
                   <small class="text-muted">${portafolio.codigo}</small>
               </td>
               <td>
                   <div>${portafolio.ciclo}</div>
                   <small class="text-muted">${portafolio.semestre}</small>
               </td>
               <td>
                   <div class="d-flex align-items-center">
                       <div class="progress flex-grow-1 me-2" style="height: 10px;">
                           <div class="progress-bar bg-${colorProgreso}" 
                                style="width: ${progreso}%"></div>
                       </div>
                       <span class="small font-weight-bold text-${colorProgreso}">${progreso}%</span>
                   </div>
               </td>
               <td>
                   <span class="badge badge-primary">${portafolio.documentosSubidos || 0}</span>
                   ${portafolio.observacionesPendientes ? `
                       <span class="badge badge-warning ms-1">${portafolio.observacionesPendientes} obs.</span>
                   ` : ''}
               </td>
               <td>
                   <span class="badge badge-${estadoClass[portafolio.estado] || 'secondary'}">
                       ${portafolio.estado}
                   </span>
               </td>
               <td>
                   <small title="${Utilidades.formatearFecha(portafolio.ultimaModificacion)}">
                       ${Utilidades.formatearTiempoRelativo(portafolio.ultimaModificacion)}
                   </small>
               </td>
               <td>
                   <div class="btn-group btn-group-sm">
                       <a href="/docente/explorador.html?portafolio=${portafolio.id}" 
                          class="btn btn-outline-primary" title="Explorar">
                           <i class="fas fa-folder-open"></i>
                       </a>
                       <a href="/docente/subir.html?portafolio=${portafolio.id}" 
                          class="btn btn-outline-success" title="Subir">
                           <i class="fas fa-upload"></i>
                       </a>
                       <button class="btn btn-outline-secondary" 
                               onclick="window.gestorPortafolios.editarPortafolio('${portafolio.id}')" 
                               title="Editar">
                           <i class="fas fa-edit"></i>
                       </button>
                   </div>
               </td>
           </tr>
       `;
   }

   /**
    * Muestra portafolios en vista de calendario
    */
   mostrarVistaCalendario(portafolios) {
       // Agrupar portafolios por fecha de vencimiento o última modificación
       const portafoliosPorFecha = this.agruparPortafoliosPorFecha(portafolios);
       
       const calendarioHtml = `
           <div class="card">
               <div class="card-header">
                   <h6 class="m-0">Cronograma de Portafolios</h6>
               </div>
               <div class="card-body">
                   <div id="calendario-portafolios">
                       ${this.generarCalendarioHTML(portafoliosPorFecha)}
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('contenido-portafolios').innerHTML = calendarioHtml;
   }

   /**
    * Agrupa portafolios por fecha
    */
   agruparPortafoliosPorFecha(portafolios) {
       const grupos = {};
       const ahora = new Date();
       
       portafolios.forEach(portafolio => {
           // Usar fecha de vencimiento si existe, sino última modificación
           const fecha = portafolio.fechaVencimiento || portafolio.ultimaModificacion;
           const fechaKey = new Date(fecha).toDateString();
           
           if (!grupos[fechaKey]) {
               grupos[fechaKey] = [];
           }
           grupos[fechaKey].push(portafolio);
       });
       
       return grupos;
   }

   /**
    * Genera HTML del calendario simplificado
    */
   generarCalendarioHTML(portafoliosPorFecha) {
       const fechasOrdenadas = Object.keys(portafoliosPorFecha).sort((a, b) => 
           new Date(a) - new Date(b)
       );
       
       return `
           <div class="timeline">
               ${fechasOrdenadas.map(fecha => {
                   const portafolios = portafoliosPorFecha[fecha];
                   const fechaObj = new Date(fecha);
                   const esPasado = fechaObj < new Date();
                   
                   return `
                       <div class="timeline-item">
                           <div class="timeline-marker ${esPasado ? 'bg-secondary' : 'bg-primary'}"></div>
                           <div class="timeline-content">
                               <div class="timeline-date">
                                   <strong>${Utilidades.formatearFecha(fechaObj)}</strong>
                               </div>
                               <div class="timeline-portafolios">
                                   ${portafolios.map(p => `
                                       <div class="timeline-portafolio d-flex justify-content-between align-items-center mb-2">
                                           <div>
                                               <strong>${p.nombre}</strong>
                                               <div class="small text-muted">${p.asignatura}</div>
                                           </div>
                                           <div class="text-end">
                                               <div class="progress" style="width: 100px; height: 8px;">
                                                   <div class="progress-bar" style="width: ${p.progresoCompletado || 0}%"></div>
                                               </div>
                                               <small class="text-muted">${p.progresoCompletado || 0}%</small>
                                           </div>
                                       </div>
                                   `).join('')}
                               </div>
                           </div>
                       </div>
                   `;
               }).join('')}
           </div>
       `;
   }

   /**
    * Crea panel de acciones rápidas
    */
   crearPanelAccionesRapidas() {
       const accionesHtml = `
           <div class="card">
               <div class="card-header">
                   <h6 class="m-0">
                       <i class="fas fa-bolt me-2"></i>
                       Acciones Rápidas
                   </h6>
               </div>
               <div class="card-body">
                   <div class="row">
                       <div class="col-md-6 mb-2">
                           <button class="btn btn-outline-primary btn-sm w-100" id="btn-subir-documento-rapido">
                               <i class="fas fa-upload me-1"></i>
                               Subir Documento
                           </button>
                       </div>
                       <div class="col-md-6 mb-2">
                           <button class="btn btn-outline-info btn-sm w-100" id="btn-ver-observaciones">
                               <i class="fas fa-comments me-1"></i>
                               Ver Observaciones
                           </button>
                       </div>
                       <div class="col-md-6 mb-2">
                           <button class="btn btn-outline-success btn-sm w-100" id="btn-generar-reporte">
                               <i class="fas fa-chart-bar me-1"></i>
                               Generar Reporte
                           </button>
                       </div>
                       <div class="col-md-6 mb-2">
                           <button class="btn btn-outline-warning btn-sm w-100" id="btn-respaldar-portafolios">
                               <i class="fas fa-shield-alt me-1"></i>
                               Respaldar Todo
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('panel-acciones-rapidas').innerHTML = accionesHtml;
   }

   /**
    * Aplica filtros a los portafolios
    */
   aplicarFiltros(portafolios) {
       return portafolios.filter(portafolio => {
           // Filtro de búsqueda
           if (this.filtros.busqueda) {
               const busqueda = this.filtros.busqueda.toLowerCase();
               const coincide = portafolio.nombre.toLowerCase().includes(busqueda) ||
                              portafolio.asignatura.toLowerCase().includes(busqueda) ||
                              portafolio.codigo.toLowerCase().includes(busqueda);
               if (!coincide) return false;
           }
           
           // Filtro de ciclo
           if (this.filtros.ciclo && portafolio.cicloId !== this.filtros.ciclo) {
               return false;
           }
           
           // Filtro de estado
           if (this.filtros.estado && portafolio.estado !== this.filtros.estado) {
               return false;
           }
           
           // Filtro de progreso
           if (this.filtros.progreso) {
               const progreso = portafolio.progresoCompletado || 0;
               switch (this.filtros.progreso) {
                   case 'bajo':
                       if (progreso >= 30) return false;
                       break;
                   case 'medio':
                       if (progreso < 30 || progreso > 70) return false;
                       break;
                   case 'alto':
                       if (progreso <= 70 || progreso >= 100) return false;
                       break;
                   case 'completo':
                       if (progreso !== 100) return false;
                       break;
               }
           }
           
           return true;
       });
   }

   /**
    * Verifica si hay filtros activos
    */
   hayFiltrosActivos() {
       return this.filtros.busqueda || this.filtros.ciclo || 
              this.filtros.estado || this.filtros.progreso;
   }

   /**
    * Configura eventos de la interfaz
    */
   configurarEventos() {
       // Cambio de vista
       document.querySelectorAll('[data-vista]').forEach(btn => {
           btn.addEventListener('click', (e) => {
               this.cambiarVista(e.target.dataset.vista);
           });
       });
       
       // Filtros
       document.getElementById('busqueda-portafolios').addEventListener('input', (e) => {
           this.filtros.busqueda = e.target.value;
           this.aplicarFiltrosConDebounce();
       });
       
       document.getElementById('filtro-ciclo').addEventListener('change', (e) => {
           this.filtros.ciclo = e.target.value;
           this.mostrarPortafolios();
       });
       
       document.getElementById('filtro-estado').addEventListener('change', (e) => {
           this.filtros.estado = e.target.value;
           this.mostrarPortafolios();
       });
       
       document.getElementById('filtro-progreso').addEventListener('change', (e) => {
           this.filtros.progreso = e.target.value;
           this.mostrarPortafolios();
       });
       
       document.getElementById('ordenar-por').addEventListener('change', (e) => {
           this.ordenarPortafolios(e.target.value);
       });
       
       document.getElementById('btn-limpiar-filtros').addEventListener('click', () => {
           this.limpiarFiltros();
       });
       
       // Botones de acción
       document.getElementById('btn-crear-portafolio').addEventListener('click', () => {
           this.mostrarModalCrearPortafolio();
       });
       
       document.getElementById('btn-subir-documento-rapido').addEventListener('click', () => {
           this.mostrarModalSubidaRapida();
       });
       
       document.getElementById('btn-ver-observaciones').addEventListener('click', () => {
           window.location.href = '/docente/observaciones.html';
       });
       
       document.getElementById('btn-generar-reporte').addEventListener('click', () => {
           this.generarReporteGeneral();
       });
       
       document.getElementById('btn-respaldar-portafolios').addEventListener('click', () => {
           this.respaldarPortafolios();
       });
   }

   /**
    * Cambia la vista de portafolios
    */
   cambiarVista(nuevaVista) {
       this.vistActual = nuevaVista;
       
       // Actualizar botones
       document.querySelectorAll('[data-vista]').forEach(btn => {
           btn.classList.remove('active');
       });
       document.querySelector(`[data-vista="${nuevaVista}"]`).classList.add('active');
       
       // Actualizar contenido
       this.mostrarPortafolios();
   }

   /**
    * Aplica filtros con debounce para búsqueda
    */
   aplicarFiltrosConDebounce() {
       clearTimeout(this.timeoutFiltros);
       this.timeoutFiltros = setTimeout(() => {
           this.mostrarPortafolios();
       }, 300);
   }

   /**
    * Limpia todos los filtros
    */
   limpiarFiltros() {
       this.filtros = {
           ciclo: '',
           estado: '',
           progreso: '',
           busqueda: ''
       };
       
       // Limpiar campos del formulario
       document.getElementById('busqueda-portafolios').value = '';
       document.getElementById('filtro-ciclo').value = '';
       document.getElementById('filtro-estado').value = '';
       document.getElementById('filtro-progreso').value = '';
       document.getElementById('ordenar-por').value = 'nombre';
       
       this.mostrarPortafolios();
   }

   /**
    * Ordena portafolios según criterio
    */
   ordenarPortafolios(criterio) {
       this.portafolios.sort((a, b) => {
           switch (criterio) {
               case 'nombre':
                   return a.nombre.localeCompare(b.nombre);
               case 'progreso':
                   return (b.progresoCompletado || 0) - (a.progresoCompletado || 0);
               case 'fecha':
                   return new Date(b.ultimaModificacion) - new Date(a.ultimaModificacion);
               case 'estado':
                   return a.estado.localeCompare(b.estado);
               default:
                   return 0;
           }
       });
       
       this.mostrarPortafolios();
   }

   /**
    * Muestra modal para crear nuevo portafolio
    */
   async mostrarModalCrearPortafolio() {
       const modal = new SistemaModales();
       
       const asignaturasOptions = this.asignaturas.map(a => ({
           value: a.id,
           text: `${a.codigo} - ${a.nombre}`
       }));
       
       await modal.mostrarFormulario('Crear Nuevo Portafolio', {
           asignatura: { 
               type: 'select', 
               label: 'Asignatura', 
               options: asignaturasOptions,
               required: true 
           },
           nombre: { 
               type: 'text', 
               label: 'Nombre del Portafolio', 
               required: true,
               placeholder: 'Ej: Portafolio 2025-I'
           },
           descripcion: { 
               type: 'textarea', 
               label: 'Descripción (opcional)', 
               rows: 3 
           },
           plantilla: { 
               type: 'select', 
               label: 'Plantilla Base', 
               options: [
                   { value: 'estandar', text: 'Estándar UNSAAC' },
                   { value: 'basica', text: 'Básica' },
                   { value: 'completa', text: 'Completa' },
                   { value: 'personalizada', text: 'Personalizada' }
               ]
           }
       }, async (datos) => {
           await this.crearPortafolio(datos);
       });
   }

   /**
    * Crea un nuevo portafolio
    */
   async crearPortafolio(datos) {
       try {
           Utilidades.mostrarCargando('#btn-crear-portafolio');
           
           const resultado = await this.servicioPortafolios.crear({
               ...datos,
               docenteId: this.usuario.id
           });
           
           if (resultado.exito) {
               Utilidades.mostrarNotificacion('Portafolio creado exitosamente', 'success');
               
               // Recargar datos
               await this.cargarDatos();
               this.mostrarPortafolios();
               
               // Navegar al nuevo portafolio
               setTimeout(() => {
                   window.location.href = `/docente/explorador.html?portafolio=${resultado.portafolio.id}`;
               }, 1000);
           } else {
               throw new Error(resultado.mensaje || 'Error al crear portafolio');
           }
           
       } catch (error) {
           console.error('Error al crear portafolio:', error);
           Utilidades.mostrarNotificacion('Error al crear portafolio: ' + error.message, 'error');
       } finally {
           Utilidades.ocultarCargando('#btn-crear-portafolio');
       }
   }

   /**
    * Edita un portafolio existente
    */
   async editarPortafolio(portafolioId) {
       try {
           const portafolio = this.portafolios.find(p => p.id == portafolioId);
           if (!portafolio) return;
           
           const modal = new SistemaModales();
           await modal.mostrarFormulario('Editar Portafolio', {
               nombre: { 
                   type: 'text', 
                   label: 'Nombre del Portafolio', 
                   value: portafolio.nombre,
                   required: true 
               },
               descripcion: { 
                   type: 'textarea', 
                   label: 'Descripción', 
                   value: portafolio.descripcion || '',
                   rows: 3 
               },
               estado: { 
                   type: 'select', 
                   label: 'Estado', 
                   value: portafolio.estado,
                   options: [
                       { value: 'activo', text: 'Activo' },
                       { value: 'bloqueado', text: 'Bloqueado' },
                       { value: 'archivado', text: 'Archivado' }
                   ]
               }
           }, async (datos) => {
               const resultado = await this.servicioPortafolios.actualizar(portafolioId, datos);
               
               if (resultado.exito) {
                   Utilidades.mostrarNotificacion('Portafolio actualizado', 'success');
                   await this.cargarDatos();
                   this.mostrarPortafolios();
               }
           });
           
       } catch (error) {
           console.error('Error al editar portafolio:', error);
           Utilidades.mostrarNotificacion('Error al editar portafolio', 'error');
       }
   }

   /**
    * Elimina un portafolio
    */
   async eliminarPortafolio(portafolioId) {
       try {
           const portafolio = this.portafolios.find(p => p.id == portafolioId);
           if (!portafolio) return;
           
           const confirmacion = await Utilidades.mostrarConfirmacion(
               '¿Eliminar Portafolio?',
               `Esta acción eliminará permanentemente "${portafolio.nombre}" y todos sus documentos.`,
               'danger'
           );
           
           if (!confirmacion) return;
           
           const resultado = await this.servicioPortafolios.eliminar(portafolioId);
           
           if (resultado.exito) {
               Utilidades.mostrarNotificacion('Portafolio eliminado', 'success');
               await this.cargarDatos();
               this.mostrarPortafolios();
           }
           
       } catch (error) {
           console.error('Error al eliminar portafolio:', error);
           Utilidades.mostrarNotificacion('Error al eliminar portafolio', 'error');
       }
   }

   /**
    * Genera reporte general de portafolios
    */
   async generarReporteGeneral() {
       try {
           Utilidades.mostrarCargando('#btn-generar-reporte');
           
           const configuracion = {
               docenteId: this.usuario.id,
               incluirProgreso: true,
               incluirEstadisticas: true,
               formato: 'pdf'
           };
           
           const resultado = await this.servicioPortafolios.generarReporte(configuracion);
           
           if (resultado.exito) {
               window.open(resultado.urlDescarga, '_blank');
               Utilidades.mostrarNotificacion('Reporte generado exitosamente', 'success');
           }
           
       } catch (error) {
           console.error('Error al generar reporte:', error);
           Utilidades.mostrarNotificacion('Error al generar reporte', 'error');
       } finally {
           Utilidades.ocultarCargando('#btn-generar-reporte');
       }
   }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
   window.gestorPortafolios = new GestorPortafolios();
});

// Exportar para uso global
window.GestorPortafolios = GestorPortafolios;