/**
 * 🌳 ÁRBOL DE PORTAFOLIO - DOCENTE
 * Sistema Portafolio Docente UNSAAC
 * 
 * Navegación interactiva del portafolio docente
 * Incluye vista de árbol, gestión de carpetas, subida de archivos y progreso
 */

class ArbolPortafolio {
   constructor() {
       this.servicioPortafolios = new ServicioPortafolios();
       this.servicioAutenticacion = new ServicioAutenticacion();
       this.sistemaModales = new SistemaModales();
       
       // Estado del componente
       this.estado = {
           portafolioId: null,
           estructura: null,
           nodoActual: null,
           rutaActual: [],
           documentos: [],
           configuracionVista: {
               mostrarOcultos: false,
               vista: 'arbol', // arbol, lista, tarjetas
               ordenarPor: 'nombre',
               direccionOrden: 'asc'
           },
           filtros: {
               busqueda: '',
               tipo: '',
               estado: ''
           },
           seleccionados: new Set(),
           expandidos: new Set(),
           progreso: {
               total: 0,
               completados: 0,
               porcentaje: 0
           }
       };
       
       // Referencias DOM
       this.elementos = {
           arbolContainer: null,
           breadcrumb: null,
           contenidoContainer: null,
           panelProgreso: null,
           toolbar: null
       };
       
       this.init();
   }

   /**
    * 🚀 Inicialización del componente
    */
   async init() {
       try {
           // Verificar permisos de docente
           if (!SistemaAutenticacion.verificarPermiso('docente')) {
               window.location.href = '/paginas/errores/403.html';
               return;
           }

           // Obtener ID del portafolio
           this.estado.portafolioId = this.obtenerPortafolioIdDesdeURL();
           if (!this.estado.portafolioId) {
               Utilidades.mostrarNotificacion('No se especificó un portafolio', 'error');
               window.location.href = '/paginas/docente/mis-portafolios.html';
               return;
           }

           await this.inicializarInterfaz();
           await this.cargarDatosIniciales();
           this.configurarEventos();
           this.configurarDragAndDrop();
           
           Utilidades.mostrarNotificacion('Portafolio cargado correctamente', 'success');
       } catch (error) {
           console.error('Error inicializando árbol de portafolio:', error);
           Utilidades.mostrarNotificacion('Error cargando el portafolio', 'error');
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
       const container = document.querySelector('#arbol-content');
       if (!container) return;

       container.innerHTML = `
           <div class="row g-4">
               <!-- Header del portafolio -->
               <div class="col-12">
                   ${this.renderizarHeaderPortafolio()}
               </div>
               
               <!-- Toolbar de acciones -->
               <div class="col-12">
                   ${this.renderizarToolbar()}
               </div>
               
               <!-- Contenido principal -->
               <div class="col-lg-3">
                   <!-- Árbol de navegación -->
                   <div class="card h-100">
                       <div class="card-header d-flex justify-content-between align-items-center">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-sitemap me-2"></i>Estructura
                           </h6>
                           <div class="btn-group" role="group">
                               <button type="button" class="btn btn-sm btn-outline-secondary" 
                                       onclick="arbolPortafolio.expandirTodo()" title="Expandir todo">
                                   <i class="fas fa-plus-square"></i>
                               </button>
                               <button type="button" class="btn btn-sm btn-outline-secondary" 
                                       onclick="arbolPortafolio.contraerTodo()" title="Contraer todo">
                                   <i class="fas fa-minus-square"></i>
                               </button>
                           </div>
                       </div>
                       <div class="card-body p-0">
                           <div id="arbol-navegacion" class="tree-container">
                               ${this.renderizarCargandoArbol()}
                           </div>
                       </div>
                   </div>
               </div>
               
               <div class="col-lg-9">
                   <!-- Breadcrumb de navegación -->
                   <div class="card mb-3">
                       <div class="card-body py-2">
                           <nav id="breadcrumb-navegacion">
                               ${this.renderizarBreadcrumbNavegacion()}
                           </nav>
                       </div>
                   </div>
                   
                   <!-- Contenido de la carpeta actual -->
                   <div class="card">
                       <div class="card-header d-flex justify-content-between align-items-center">
                           <div>
                               <h5 class="card-title mb-0">
                                   <i id="icono-carpeta-actual" class="fas fa-folder me-2"></i>
                                   <span id="nombre-carpeta-actual">Cargando...</span>
                               </h5>
                               <small id="descripcion-carpeta-actual" class="text-muted"></small>
                           </div>
                           <div class="btn-group">
                               <button type="button" class="btn btn-primary btn-sm" 
                                       onclick="arbolPortafolio.subirArchivos()" id="btn-subir-archivos">
                                   <i class="fas fa-upload me-1"></i>Subir Archivos
                               </button>
                               <button type="button" class="btn btn-outline-secondary btn-sm dropdown-toggle" 
                                       data-bs-toggle="dropdown">
                                   <i class="fas fa-cog"></i>
                               </button>
                               <ul class="dropdown-menu">
                                   <li><a class="dropdown-item" href="#" onclick="arbolPortafolio.nuevaCarpeta()">
                                       <i class="fas fa-folder-plus me-2"></i>Nueva Carpeta
                                   </a></li>
                                   <li><a class="dropdown-item" href="#" onclick="arbolPortafolio.organizarArchivos()">
                                       <i class="fas fa-sort me-2"></i>Organizar
                                   </a></li>
                                   <li><hr class="dropdown-divider"></li>
                                   <li><a class="dropdown-item" href="#" onclick="arbolPortafolio.exportarCarpeta()">
                                       <i class="fas fa-download me-2"></i>Exportar Carpeta
                                   </a></li>
                               </ul>
                           </div>
                       </div>
                       <div class="card-body p-0">
                           <div id="contenido-carpeta">
                               ${this.renderizarCargandoContenido()}
                           </div>
                       </div>
                   </div>
               </div>
               
               <!-- Panel lateral flotante para progreso -->
               <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 1000;">
                   <div class="card shadow" id="panel-progreso" style="width: 300px; display: none;">
                       <div class="card-header d-flex justify-content-between align-items-center">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-chart-pie me-2"></i>Progreso del Portafolio
                           </h6>
                           <button type="button" class="btn-close btn-sm" onclick="arbolPortafolio.ocultarPanelProgreso()"></button>
                       </div>
                       <div class="card-body">
                           <div id="contenido-progreso">
                               <!-- Se llenará dinámicamente -->
                           </div>
                       </div>
                   </div>
               </div>
           </div>
           
           <!-- Zona de drop para archivos -->
           <div id="drop-zone" class="drop-zone" style="display: none;">
               <div class="drop-zone-content">
                   <i class="fas fa-cloud-upload-alt fa-3x mb-3"></i>
                   <h4>Suelta los archivos aquí</h4>
                   <p>Para subirlos a <span id="drop-target-folder">esta carpeta</span></p>
               </div>
           </div>
           
           <!-- Modales -->
           ${this.renderizarModales()}
       `;
   }

   /**
    * 📋 Renderizar header del portafolio
    */
   renderizarHeaderPortafolio() {
       return `
           <div class="card bg-primary text-white" id="header-portafolio">
               <div class="card-body">
                   <div class="row align-items-center">
                       <div class="col-md-8">
                           <div class="d-flex align-items-center mb-2">
                               <button type="button" class="btn btn-outline-light me-3" 
                                       onclick="window.history.back()" title="Volver">
                                   <i class="fas fa-arrow-left"></i>
                               </button>
                               <div>
                                   <h4 class="card-title mb-1">
                                       <i class="fas fa-folder-open me-2"></i>
                                       <span id="titulo-portafolio">Cargando portafolio...</span>
                                   </h4>
                                   <p class="card-text mb-0 opacity-75" id="subtitulo-portafolio">
                                       Gestiona y organiza tu portafolio académico
                                   </p>
                               </div>
                           </div>
                       </div>
                       <div class="col-md-4">
                           <div class="row text-center">
                               <div class="col-4">
                                   <div class="stat-item">
                                       <h5 id="stat-archivos" class="mb-0">0</h5>
                                       <small class="opacity-75">Archivos</small>
                                   </div>
                               </div>
                               <div class="col-4">
                                   <div class="stat-item">
                                       <h5 id="stat-carpetas" class="mb-0">0</h5>
                                       <small class="opacity-75">Carpetas</small>
                                   </div>
                               </div>
                               <div class="col-4">
                                   <div class="stat-item">
                                       <h5 id="stat-progreso" class="mb-0">0%</h5>
                                       <small class="opacity-75">Progreso</small>
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
    * 🔧 Renderizar toolbar de acciones
    */
   renderizarToolbar() {
       return `
           <div class="card">
               <div class="card-body py-2">
                   <div class="row g-3 align-items-center">
                       <div class="col-md-4">
                           <div class="input-group input-group-sm">
                               <span class="input-group-text">
                                   <i class="fas fa-search"></i>
                               </span>
                               <input type="text" class="form-control" id="busqueda-archivos" 
                                      placeholder="Buscar archivos y carpetas...">
                           </div>
                       </div>
                       
                       <div class="col-md-2">
                           <select class="form-select form-select-sm" id="filtro-tipo">
                               <option value="">Todos los tipos</option>
                               <option value="carpeta">Carpetas</option>
                               <option value="pdf">PDF</option>
                               <option value="docx">Word</option>
                               <option value="xlsx">Excel</option>
                               <option value="imagen">Imágenes</option>
                           </select>
                       </div>
                       
                       <div class="col-md-2">
                           <select class="form-select form-select-sm" id="filtro-estado">
                               <option value="">Todos los estados</option>
                               <option value="pendiente">Pendiente</option>
                               <option value="en_revision">En Revisión</option>
                               <option value="aprobado">Aprobado</option>
                               <option value="rechazado">Rechazado</option>
                           </select>
                       </div>
                       
                       <div class="col-md-2">
                           <div class="btn-group w-100" role="group">
                               <button type="button" class="btn btn-outline-secondary btn-sm active" 
                                       data-vista="arbol" onclick="arbolPortafolio.cambiarVista('arbol')">
                                   <i class="fas fa-sitemap"></i>
                               </button>
                               <button type="button" class="btn btn-outline-secondary btn-sm" 
                                       data-vista="lista" onclick="arbolPortafolio.cambiarVista('lista')">
                                   <i class="fas fa-list"></i>
                               </button>
                               <button type="button" class="btn btn-outline-secondary btn-sm" 
                                       data-vista="tarjetas" onclick="arbolPortafolio.cambiarVista('tarjetas')">
                                   <i class="fas fa-th"></i>
                               </button>
                           </div>
                       </div>
                       
                       <div class="col-md-2">
                           <div class="btn-group w-100">
                               <button type="button" class="btn btn-success btn-sm" 
                                       onclick="arbolPortafolio.mostrarPanelProgreso()">
                                   <i class="fas fa-chart-pie me-1"></i>Progreso
                               </button>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 🌳 Renderizar árbol en estado de carga
    */
   renderizarCargandoArbol() {
       return `
           <div class="text-center py-4">
               <div class="spinner-border text-primary mb-3" role="status">
                   <span class="visually-hidden">Cargando...</span>
               </div>
               <p class="text-muted small">Cargando estructura del portafolio...</p>
           </div>
       `;
   }

   /**
    * 📄 Renderizar contenido en estado de carga
    */
   renderizarCargandoContenido() {
       return `
           <div class="text-center py-5">
               <div class="spinner-border text-primary mb-3" role="status">
                   <span class="visually-hidden">Cargando...</span>
               </div>
               <h5 class="text-muted">Cargando contenido...</h5>
               <p class="text-muted">Por favor espera mientras obtenemos los archivos</p>
           </div>
       `;
   }

   /**
    * 🧭 Renderizar breadcrumb de navegación
    */
   renderizarBreadcrumbNavegacion() {
       if (!this.estado.rutaActual.length) {
           return `
               <ol class="breadcrumb mb-0">
                   <li class="breadcrumb-item active">
                       <i class="fas fa-home me-1"></i>Raíz
                   </li>
               </ol>
           `;
       }
       
       let breadcrumb = `
           <ol class="breadcrumb mb-0">
               <li class="breadcrumb-item">
                   <a href="#" onclick="arbolPortafolio.navegarA(null)" class="text-decoration-none">
                       <i class="fas fa-home me-1"></i>Raíz
                   </a>
               </li>
       `;
       
       this.estado.rutaActual.forEach((nodo, index) => {
           const esUltimo = index === this.estado.rutaActual.length - 1;
           if (esUltimo) {
               breadcrumb += `
                   <li class="breadcrumb-item active">
                       <i class="fas fa-folder me-1"></i>${nodo.nombre}
                   </li>
               `;
           } else {
               breadcrumb += `
                   <li class="breadcrumb-item">
                       <a href="#" onclick="arbolPortafolio.navegarA('${nodo.id}')" class="text-decoration-none">
                           <i class="fas fa-folder me-1"></i>${nodo.nombre}
                       </a>
                   </li>
               `;
           }
       });
       
       breadcrumb += '</ol>';
       return breadcrumb;
   }

   /**
    * 🎭 Renderizar modales del sistema
    */
   renderizarModales() {
       return `
           <!-- Modal Nueva Carpeta -->
           <div class="modal fade" id="modal-nueva-carpeta" tabindex="-1">
               <div class="modal-dialog">
                   <div class="modal-content">
                       <div class="modal-header">
                           <h5 class="modal-title">
                               <i class="fas fa-folder-plus me-2"></i>Nueva Carpeta
                           </h5>
                           <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                       </div>
                       <div class="modal-body">
                           <form id="form-nueva-carpeta">
                               <div class="mb-3">
                                   <label class="form-label">Nombre de la Carpeta</label>
                                   <input type="text" class="form-control" name="nombre" required
                                          placeholder="Ej: Evaluaciones Parciales">
                               </div>
                               
                               <div class="mb-3">
                                   <label class="form-label">Descripción (Opcional)</label>
                                   <textarea class="form-control" name="descripcion" rows="3"
                                             placeholder="Describe el contenido de esta carpeta..."></textarea>
                               </div>
                               
                               <div class="mb-3">
                                   <div class="form-check">
                                       <input class="form-check-input" type="checkbox" name="requiere_credito" id="requiere-credito">
                                       <label class="form-check-label" for="requiere-credito">
                                           Requiere crédito académico
                                       </label>
                                   </div>
                               </div>
                           </form>
                       </div>
                       <div class="modal-footer">
                           <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                           <button type="button" class="btn btn-primary" onclick="arbolPortafolio.crearCarpeta()">
                               <i class="fas fa-save me-1"></i>Crear Carpeta
                           </button>
                       </div>
                   </div>
               </div>
           </div>
           
           <!-- Modal Propiedades -->
           <div class="modal fade" id="modal-propiedades" tabindex="-1">
               <div class="modal-dialog modal-lg">
                   <div class="modal-content">
                       <div class="modal-header">
                           <h5 class="modal-title">
                               <i class="fas fa-info-circle me-2"></i>Propiedades
                           </h5>
                           <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                       </div>
                       <div class="modal-body">
                           <div id="contenido-propiedades">
                               <!-- Se llenará dinámicamente -->
                           </div>
                       </div>
                       <div class="modal-footer">
                           <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
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
           this.cargarEstructuraPortafolio(),
           this.cargarInformacionPortafolio(),
           this.cargarProgreso()
       ]);
       
       // Navegar al nodo raíz por defecto
       await this.navegarA(null);
   }

   /**
    * 🌳 Cargar estructura del portafolio
    */
   async cargarEstructuraPortafolio() {
       try {
           const response = await this.servicioPortafolios.obtenerEstructura(this.estado.portafolioId);
           this.estado.estructura = response.data;
           
           this.renderizarArbolNavegacion();
           
       } catch (error) {
           console.error('Error cargando estructura:', error);
           this.mostrarErrorEstructura();
       }
   }

   /**
    * ℹ️ Cargar información del portafolio
    */
   async cargarInformacionPortafolio() {
       try {
           const response = await this.servicioPortafolios.obtenerPorId(this.estado.portafolioId);
           const portafolio = response.data;
           
           // Actualizar header
           document.getElementById('titulo-portafolio').textContent = portafolio.nombre;
           document.getElementById('subtitulo-portafolio').textContent = 
               `${portafolio.asignatura_nombre} - ${portafolio.ciclo_nombre}`;
           
       } catch (error) {
           console.error('Error cargando información del portafolio:', error);
       }
   }

   /**
    * 📊 Cargar progreso del portafolio
    */
   async cargarProgreso() {
       try {
           const response = await this.servicioPortafolios.obtenerProgreso(this.estado.portafolioId);
           this.estado.progreso = response.data;
           
           this.actualizarEstadisticasHeader();
           this.actualizarPanelProgreso();
           
       } catch (error) {
           console.error('Error cargando progreso:', error);
       }
   }

   /**
    * 📁 Cargar contenido de carpeta
    */
   async cargarContenidoCarpeta(nodoId = null) {
       try {
           const parametros = {
               portafolio_id: this.estado.portafolioId,
               nodo_id: nodoId,
               ...this.estado.filtros
           };

           const response = await this.servicioPortafolios.obtenerContenidoCarpeta(parametros);
           this.estado.documentos = response.data.archivos || [];
           
           this.renderizarContenidoCarpeta();
           this.actualizarInformacionCarpeta(response.data.carpeta);
           
       } catch (error) {
           console.error('Error cargando contenido:', error);
           this.mostrarErrorContenido();
       }
   }

   /**
    * 🌳 Renderizar árbol de navegación
    */
   renderizarArbolNavegacion() {
       const container = document.getElementById('arbol-navegacion');
       if (!container) return;
       
       if (!this.estado.estructura) {
           container.innerHTML = this.renderizarErrorEstructura();
           return;
       }
       
       container.innerHTML = `
           <div class="tree-view">
               ${this.renderizarNodoArbol(this.estado.estructura, 0)}
           </div>
       `;
   }

   /**
    * 🌿 Renderizar nodo individual del árbol
    */
   renderizarNodoArbol(nodo, nivel) {
       const identacion = nivel * 20;
       const expandido = this.estado.expandidos.has(nodo.id);
       const esActual = this.estado.nodoActual?.id === nodo.id;
       const tieneHijos = nodo.hijos && nodo.hijos.length > 0;
       
       let html = `
           <div class="tree-node ${esActual ? 'active' : ''}" style="padding-left: ${identacion}px;">
               <div class="node-content d-flex align-items-center" onclick="arbolPortafolio.navegarA('${nodo.id}')">
                   ${tieneHijos ? `
                       <button type="button" class="btn btn-sm btn-link p-0 me-1 toggle-btn" 
                               onclick="event.stopPropagation(); arbolPortafolio.toggleExpansion('${nodo.id}')">
                           <i class="fas fa-${expandido ? 'minus' : 'plus'}-square text-muted"></i>
                       </button>
                   ` : '<span class="me-3"></span>'}
                   
                   <i class="fas fa-${nodo.icono || 'folder'} me-2 ${nodo.color || 'text-primary'}"></i>
                   
                   <span class="node-label flex-grow-1">${nodo.nombre}</span>
                   
                   ${nodo.requiere_credito ? '<i class="fas fa-star text-warning ms-1" title="Requiere crédito"></i>' : ''}
                   
                   <div class="node-actions ms-2" onclick="event.stopPropagation();">
                       <button type="button" class="btn btn-sm btn-outline-secondary" 
                               onclick="arbolPortafolio.verPropiedadesNodo('${nodo.id}')" 
                               title="Propiedades">
                           <i class="fas fa-info-circle"></i>
                       </button>
                   </div>
               </div>
           </div>
       `;
       
       // Renderizar hijos si está expandido
       if (tieneHijos && expandido) {
           html += nodo.hijos.map(hijo => this.renderizarNodoArbol(hijo, nivel + 1)).join('');
       }
       
       return html;
   }

   /**
    * 📄 Renderizar contenido de la carpeta actual
    */
   renderizarContenidoCarpeta() {
       const container = document.getElementById('contenido-carpeta');
       if (!container) return;
       
       if (this.estado.documentos.length === 0) {
           container.innerHTML = this.renderizarCarpetaVacia();
           return;
       }
       
       switch (this.estado.configuracionVista.vista) {
           case 'lista':
               container.innerHTML = this.renderizarVistaLista();
               break;
           case 'tarjetas':
               container.innerHTML = this.renderizarVistaTarjetas();
               break;
           default:
               container.innerHTML = this.renderizarVistaArbol();
       }
   }

   /**
    * 📋 Renderizar vista de lista
    */
   renderizarVistaLista() {
       return `
           <div class="table-responsive">
               <table class="table table-hover mb-0">
                   <thead class="table-light">
                       <tr>
                           <th width="40">
                               <div class="form-check">
                                   <input class="form-check-input" type="checkbox" id="check-todos" 
                                          onchange="arbolPortafolio.toggleSeleccionTodos()">
                               </div>
                           </th>
                           <th>Nombre</th>
                           <th>Tipo</th>
                           <th>Tamaño</th>
                           <th>Estado</th>
                           <th>Modificado</th>
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
       const iconoArchivo = this.obtenerIconoArchivo(documento);
       const estadoClass = this.obtenerClaseEstado(documento.estado);
       const tamano = documento.tamaño_archivo ? Utilidades.formatearTamanoArchivo(documento.tamaño_archivo) : '-';
       
       return `
           <tr data-documento-id="${documento.id}">
               <td>
                   <div class="form-check">
                       <input class="form-check-input checkbox-documento" type="checkbox" 
                              value="${documento.id}" onchange="arbolPortafolio.toggleSeleccion()">
                   </div>
               </td>
               <td>
                   <div class="d-flex align-items-center">
                       <i class="${iconoArchivo.clase} fa-lg me-2"></i>
                       <div>
                           <h6 class="mb-0">${documento.nombre_archivo || documento.nombre}</h6>
                           ${documento.descripcion ? `<small class="text-muted">${documento.descripcion}</small>` : ''}
                       </div>
                   </div>
               </td>
               <td>
                   <span class="badge bg-light text-dark">${documento.tipo_documento || documento.formato || 'Carpeta'}</span>
               </td>
               <td>
                   <small class="text-muted">${tamano}</small>
               </td>
               <td>
                   <span class="badge bg-${estadoClass}">${this.obtenerTextoEstado(documento.estado)}</span>
               </td>
               <td>
                   <small class="text-muted">${Utilidades.formatearFechaRelativa(documento.actualizado_en)}</small>
               </td>
               <td>
                   <div class="btn-group btn-group-sm">
                       ${this.renderizarBotonesAccionDocumento(documento)}
                   </div>
               </td>
           </tr>
       `;
   }

   /**
    * 🎴 Renderizar vista de tarjetas
    */
   renderizarVistaTarjetas() {
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
       const iconoArchivo = this.obtenerIconoArchivo(documento);
       const estadoClass = this.obtenerClaseEstado(documento.estado);
       
       return `
           <div class="col-md-6 col-lg-4 col-xl-3">
               <div class="card h-100 ${estadoClass === 'danger' ? 'border-danger' : ''}" data-documento-id="${documento.id}">
                   <div class="card-body text-center">
                       <div class="mb-3">
                           <i class="${iconoArchivo.clase} fa-3x ${iconoArchivo.color}"></i>
                       </div>
                       
                       <h6 class="card-title text-truncate" title="${documento.nombre_archivo || documento.nombre}">
                           ${documento.nombre_archivo || documento.nombre}
                       </h6>
                       
                       <p class="card-text small text-muted">
                           ${documento.tipo_documento || documento.formato || 'Carpeta'}
                       </p>
                       
                       <div class="mb-2">
                           <span class="badge bg-${estadoClass}">${this.obtenerTextoEstado(documento.estado)}</span>
                       </div>
                       
                       ${documento.tamaño_archivo ? `
                           <small class="text-muted d-block mb-2">
                               ${Utilidades.formatearTamanoArchivo(documento.tamaño_archivo)}
                           </small>
                       ` : ''}
                   </div>
                   
                   <div class="card-footer">
                       <div class="d-grid gap-2">
                           ${this.renderizarBotonesAccionDocumento(documento, true)}
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 📁 Renderizar carpeta vacía
    */
   renderizarCarpetaVacia() {
       return `
           <div class="text-center py-5">
               <i class="fas fa-folder-open fa-4x text-muted mb-3"></i>
               <h4 class="text-muted">Carpeta vacía</h4>
               <p class="text-muted">Esta carpeta no contiene archivos aún</p>
               <div class="btn-group">
                   <button type="button" class="btn btn-primary" onclick="arbolPortafolio.subirArchivos()">
                       <i class="fas fa-upload me-1"></i>Subir Archivos
                   </button>
                   <button type="button" class="btn btn-outline-secondary" onclick="arbolPortafolio.nuevaCarpeta()">
                       <i class="fas fa-folder-plus me-1"></i>Nueva Carpeta
                   </button>
               </div>
           </div>
       `;
   }

   /**
    * 🔘 Renderizar botones de acción para documento
    */
   renderizarBotonesAccionDocumento(documento, esVistaTarjeta = false) {
       const esArchivo = documento.tipo === 'archivo' || documento.nombre_archivo;
       const claseBoton = esVistaTarjeta ? 'btn-sm' : 'btn-sm';
       
       if (esArchivo) {
           return `
               <button type="button" class="btn btn-outline-primary ${claseBoton}" 
                       onclick="arbolPortafolio.verDocumento('${documento.id}')" title="Ver">
                   <i class="fas fa-eye"></i>
               </button>
               <button type="button" class="btn btn-outline-success ${claseBoton}" 
                       onclick="arbolPortafolio.descargarDocumento('${documento.id}')" title="Descargar">
                   <i class="fas fa-download"></i>
               </button>
               <button type="button" class="btn btn-outline-info ${claseBoton}" 
                       onclick="arbolPortafolio.editarDocumento('${documento.id}')" title="Editar">
                   <i class="fas fa-edit"></i>
               </button>
               <button type="button" class="btn btn-outline-danger ${claseBoton}" 
                       onclick="arbolPortafolio.eliminarDocumento('${documento.id}')" title="Eliminar">
                   <i class="fas fa-trash"></i>
               </button>
           `;
       } else {
           return `
               <button type="button" class="btn btn-outline-primary ${claseBoton}" 
                       onclick="arbolPortafolio.navegarA('${documento.id}')" title="Abrir">
                   <i class="fas fa-folder-open"></i>
               </button>
               <button type="button" class="btn btn-outline-info ${claseBoton}" 
                       onclick="arbolPortafolio.editarCarpeta('${documento.id}')" title="Editar">
                   <i class="fas fa-edit"></i>
               </button>
               <button type="button" class="btn btn-outline-danger ${claseBoton}" 
                       onclick="arbolPortafolio.eliminarCarpeta('${documento.id}')" title="Eliminar">
                   <i class="fas fa-trash"></i>
               </button>
           `;
       }
   }

   // =====================================
   // MÉTODOS DE NAVEGACIÓN
   // =====================================

   /**
    * 🧭 Navegar a un nodo específico
    */
   async navegarA(nodoId) {
       try {
           // Actualizar estado
           this.estado.nodoActual = nodoId ? this.encontrarNodoPorId(nodoId) : null;
           this.estado.rutaActual = this.construirRutaHacia(nodoId);
           
           // Cargar contenido
           await this.cargarContenidoCarpeta(nodoId);
           
           // Actualizar interfaz
           this.actualizarBreadcrumbNavegacion();
           this.actualizarArbolNavegacion();
           this.limpiarSelecciones();
           
       } catch (error) {
           console.error('Error navegando:', error);
           Utilidades.mostrarNotificacion('Error al navegar a la carpeta', 'error');
       }
   }

   /**
    * 🔄 Toggle expansión de nodo
    */
   toggleExpansion(nodoId) {
       if (this.estado.expandidos.has(nodoId)) {
           this.estado.expandidos.delete(nodoId);
       } else {
           this.estado.expandidos.add(nodoId);
       }
       
       this.renderizarArbolNavegacion();
   }

   /**
    * ➕ Expandir todo el árbol
    */
   expandirTodo() {
       this.expandirNodosRecursivo(this.estado.estructura);
       this.renderizarArbolNavegacion();
   }

   /**
    * ➖ Contraer todo el árbol
    */
   contraerTodo() {
       this.estado.expandidos.clear();
       this.renderizarArbolNavegacion();
   }

   /**
    * 🔍 Expandir nodos recursivamente
    */
   expandirNodosRecursivo(nodo) {
       if (nodo.hijos && nodo.hijos.length > 0) {
           this.estado.expandidos.add(nodo.id);
           nodo.hijos.forEach(hijo => this.expandirNodosRecursivo(hijo));
       }
   }

   // =====================================
   // MÉTODOS DE ACCIONES
   // =====================================

   /**
    * 📤 Subir archivos
    */
   subirArchivos() {
       const nodoId = this.estado.nodoActual?.id || null;
       const url = `/paginas/docente/subir.html?portafolio=${this.estado.portafolioId}&carpeta=${nodoId || ''}`;
       window.location.href = url;
   }

   /**
    * 📁 Nueva carpeta
    */
   nuevaCarpeta() {
       // Limpiar formulario
       const form = document.getElementById('form-nueva-carpeta');
       if (form) {
           form.reset();
       }
       
       // Mostrar modal
       const modal = new bootstrap.Modal(document.getElementById('modal-nueva-carpeta'));
       modal.show();
   }

   /**
    * 💾 Crear carpeta
    */
   async crearCarpeta() {
       try {
           const form = document.getElementById('form-nueva-carpeta');
           if (!form || !this.validarFormulario(form)) {
               return;
           }
           
           const formData = new FormData(form);
           const datosCarpeta = Object.fromEntries(formData.entries());
           datosCarpeta.portafolio_id = this.estado.portafolioId;
           datosCarpeta.carpeta_padre_id = this.estado.nodoActual?.id || null;
           
           await this.servicioPortafolios.crearCarpeta(datosCarpeta);
           
           Utilidades.mostrarNotificacion('Carpeta creada correctamente', 'success');
           
           // Cerrar modal y recargar
           const modal = bootstrap.Modal.getInstance(document.getElementById('modal-nueva-carpeta'));
           modal.hide();
           
           await this.cargarEstructuraPortafolio();
           await this.cargarContenidoCarpeta(this.estado.nodoActual?.id);
           
       } catch (error) {
           console.error('Error creando carpeta:', error);
           Utilidades.mostrarNotificacion('Error al crear la carpeta', 'error');
       }
   }

   /**
    * 👁️ Ver documento
    */
   async verDocumento(documentoId) {
       try {
           const url = `/api/v1/documentos/${documentoId}/preview`;
           window.open(url, '_blank');
       } catch (error) {
           console.error('Error abriendo documento:', error);
           Utilidades.mostrarNotificacion('Error al abrir el documento', 'error');
       }
   }

   /**
    * 📥 Descargar documento
    */
   async descargarDocumento(documentoId) {
       try {
           const url = `/api/v1/documentos/${documentoId}/descargar`;
           const link = document.createElement('a');
           link.href = url;
           link.download = '';
           document.body.appendChild(link);
           link.click();
           document.body.removeChild(link);
       } catch (error) {
           console.error('Error descargando documento:', error);
           Utilidades.mostrarNotificacion('Error al descargar el documento', 'error');
       }
   }

   // =====================================
   // MÉTODOS AUXILIARES
   // =====================================

   /**
    * 🆔 Obtener ID del portafolio desde URL
    */
   obtenerPortafolioIdDesdeURL() {
       const urlParams = new URLSearchParams(window.location.search);
       return urlParams.get('portafolio') || localStorage.getItem('portafolio_actual');
   }

   /**
    * 🔍 Encontrar nodo por ID
    */
   encontrarNodoPorId(nodoId, nodo = null) {
       if (!nodo) nodo = this.estado.estructura;
       if (!nodo) return null;
       
       if (nodo.id === nodoId) return nodo;
       
       if (nodo.hijos) {
           for (const hijo of nodo.hijos) {
               const encontrado = this.encontrarNodoPorId(nodoId, hijo);
               if (encontrado) return encontrado;
           }
       }
       
       return null;
   }

   /**
    * 🛤️ Construir ruta hacia un nodo
    */
   construirRutaHacia(nodoId) {
       if (!nodoId) return [];
       
       const ruta = [];
       let nodoActual = this.encontrarNodoPorId(nodoId);
       
       while (nodoActual && nodoActual.carpeta_padre_id) {
           ruta.unshift(nodoActual);
           nodoActual = this.encontrarNodoPorId(nodoActual.carpeta_padre_id);
       }
       
       if (nodoActual && !nodoActual.carpeta_padre_id) {
           ruta.unshift(nodoActual);
       }
       
       return ruta;
   }

   /**
    * 🎨 Obtener icono y clase para archivo
    */
   obtenerIconoArchivo(documento) {
       if (documento.tipo === 'carpeta' || !documento.nombre_archivo) {
           return { clase: 'fas fa-folder', color: 'text-primary' };
       }
       
       const extension = documento.formato || documento.nombre_archivo?.split('.').pop()?.toLowerCase();
       
       const iconos = {
           pdf: { clase: 'fas fa-file-pdf', color: 'text-danger' },
           docx: { clase: 'fas fa-file-word', color: 'text-primary' },
           xlsx: { clase: 'fas fa-file-excel', color: 'text-success' },
           pptx: { clase: 'fas fa-file-powerpoint', color: 'text-warning' },
           jpg: { clase: 'fas fa-file-image', color: 'text-info' },
           png: { clase: 'fas fa-file-image', color: 'text-info' },
           txt: { clase: 'fas fa-file-alt', color: 'text-secondary' }
       };
       
       return iconos[extension] || { clase: 'fas fa-file', color: 'text-muted' };
   }

   /**
    * 🎨 Obtener clase para estado
    */
   obtenerClaseEstado(estado) {
       const clases = {
           'pendiente': 'warning',
           'en_revision': 'info',
           'aprobado': 'success',
           'rechazado': 'danger',
           'requiere_correccion': 'warning'
       };
       return clases[estado] || 'secondary';
   }

   /**
    * 📝 Obtener texto del estado
    */
   obtenerTextoEstado(estado) {
       const textos = {
           'pendiente': 'Pendiente',
           'en_revision': 'En Revisión',
           'aprobado': 'Aprobado',
           'rechazado': 'Rechazado',
           'requiere_correccion': 'Requiere Corrección'
       };
       return textos[estado] || 'Sin Estado';
   }

   /**
    * 🔧 Configurar elementos DOM
    */
   configurarElementosDOM() {
       this.elementos = {
           arbolContainer: document.getElementById('arbol-navegacion'),
           breadcrumb: document.getElementById('breadcrumb-navegacion'),
           contenidoContainer: document.getElementById('contenido-carpeta'),
           panelProgreso: document.getElementById('panel-progreso'),
           toolbar: document.querySelector('.card-body.py-2')
       };
   }

   /**
    * ⚙️ Configurar eventos
    */
   configurarEventos() {
       // Búsqueda en tiempo real
       const buscador = document.getElementById('busqueda-archivos');
       if (buscador) {
           buscador.addEventListener('input', Utilidades.debounce(() => {
               this.aplicarFiltros();
           }, 500));
       }
       
       // Filtros automáticos
       ['filtro-tipo', 'filtro-estado'].forEach(id => {
           const elemento = document.getElementById(id);
           if (elemento) {
               elemento.addEventListener('change', () => this.aplicarFiltros());
           }
       });
   }

   /**
    * 🎯 Configurar drag and drop
    */
   configurarDragAndDrop() {
       // Prevenir comportamiento por defecto del navegador
       ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
           document.addEventListener(eventName, this.prevenirDefault, false);
       });
       
       // Mostrar zona de drop al arrastrar archivos
       document.addEventListener('dragenter', (e) => {
           if (e.dataTransfer.types.includes('Files')) {
               this.mostrarZonaDrop();
           }
       });
       
       // Ocultar zona de drop al salir
       document.addEventListener('dragleave', (e) => {
           if (!document.contains(e.relatedTarget)) {
               this.ocultarZonaDrop();
           }
       });
       
       // Manejar drop de archivos
       document.addEventListener('drop', (e) => {
           this.ocultarZonaDrop();
           
           if (e.dataTransfer.files.length > 0) {
               this.manejarArchivosDropeados(e.dataTransfer.files);
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
                   <i class="fas fa-chalkboard-teacher me-1"></i>Docente
               </li>
               <li class="breadcrumb-item">
                   <a href="/paginas/docente/mis-portafolios.html">Portafolios</a>
               </li>
               <li class="breadcrumb-item active">Árbol de Portafolio</li>
           `;
       }
   }

   // =====================================
   // MÉTODOS PÚBLICOS PARA INTERFAZ
   // =====================================

   /**
    * 🔄 Cambiar vista
    */
   cambiarVista(nuevaVista) {
       this.estado.configuracionVista.vista = nuevaVista;
       
       // Actualizar botones
       document.querySelectorAll('[data-vista]').forEach(btn => {
           btn.classList.toggle('active', btn.dataset.vista === nuevaVista);
       });
       
       this.renderizarContenidoCarpeta();
   }

   /**
    * 🔍 Aplicar filtros
    */
   async aplicarFiltros() {
       this.estado.filtros = {
           busqueda: document.getElementById('busqueda-archivos')?.value || '',
           tipo: document.getElementById('filtro-tipo')?.value || '',
           estado: document.getElementById('filtro-estado')?.value || ''
       };
       
       await this.cargarContenidoCarpeta(this.estado.nodoActual?.id);
   }

   /**
    * 📊 Mostrar panel de progreso
    */
   mostrarPanelProgreso() {
       const panel = document.getElementById('panel-progreso');
       if (panel) {
           panel.style.display = 'block';
       }
   }

   /**
    * 🙈 Ocultar panel de progreso
    */
   ocultarPanelProgreso() {
       const panel = document.getElementById('panel-progreso');
       if (panel) {
           panel.style.display = 'none';
       }
   }
}

// =====================================
// INICIALIZACIÓN GLOBAL
// =====================================

// Variable global para acceso desde HTML
let arbolPortafolio;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
   arbolPortafolio = new ArbolPortafolio();
});

// Cleanup al salir de la página
window.addEventListener('beforeunload', () => {
   if (arbolPortafolio) {
       arbolPortafolio = null;
   }
});