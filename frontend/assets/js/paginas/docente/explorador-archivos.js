/**
 * 📂 EXPLORADOR DE ARCHIVOS
 * Sistema Portafolio Docente UNSAAC
 * 
 * Página para explorar, gestionar y organizar archivos del portafolio
 * Incluye navegación de árbol, vista previa, versiones y operaciones masivas
 */

class ExploradorArchivos {
   constructor() {
       this.servicioPortafolios = new ServicioPortafolios();
       this.servicioDocumentos = new ServicioDocumentos();
       this.servicioObservaciones = new ServicioObservaciones();
       
       this.usuario = SistemaAutenticacion.obtenerUsuario();
       this.portafolioActual = null;
       this.carpetaActual = null;
       this.archivosSeleccionados = [];
       this.modoVista = 'lista'; // lista, cuadricula, arbol
       this.filtros = {
           tipo: '',
           estado: '',
           busqueda: ''
       };
       this.historialNavegacion = [];
       
       this.inicializar();
   }

   /**
    * Inicializa el explorador de archivos
    */
   async inicializar() {
       try {
           await this.verificarPermisos();
           await this.cargarDatos();
           this.configurarInterfaz();
           this.configurarEventos();
           this.procesarParametrosURL();
           
           Utilidades.mostrarNotificacion('Explorador de archivos cargado', 'success');
       } catch (error) {
           console.error('Error al inicializar explorador:', error);
           Utilidades.mostrarNotificacion('Error al cargar el explorador', 'error');
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
    * Procesa parámetros de la URL
    */
   procesarParametrosURL() {
       const urlParams = new URLSearchParams(window.location.search);
       const portafolioId = urlParams.get('portafolio');
       const carpetaId = urlParams.get('carpeta');
       
       if (portafolioId) {
           this.cargarPortafolio(portafolioId, carpetaId);
       }
   }

   /**
    * Carga datos iniciales
    */
   async cargarDatos() {
       try {
           Utilidades.mostrarCargando('#contenedor-explorador');
           
           const [portafolios, configuracionExplorador] = await Promise.all([
               this.servicioPortafolios.obtenerMisPortafolios(),
               this.servicioPortafolios.obtenerConfiguracionExplorador()
           ]);
           
           this.portafolios = portafolios;
           this.configuracionExplorador = configuracionExplorador;
           
       } catch (error) {
           console.error('Error al cargar datos:', error);
           throw error;
       } finally {
           Utilidades.ocultarCargando('#contenedor-explorador');
       }
   }

   /**
    * Configura la interfaz inicial
    */
   configurarInterfaz() {
       this.crearBarraHerramientas();
       this.crearPanelNavegacion();
       this.crearAreaPrincipal();
       this.crearPanelPropiedades();
       this.configurarArrastrarYSoltar();
   }

   /**
    * Crea la barra de herramientas superior
    */
   crearBarraHerramientas() {
       const barraHtml = `
           <div class="card mb-3">
               <div class="card-body py-2">
                   <div class="row align-items-center">
                       <div class="col-md-4">
                           <div class="btn-group">
                               <button class="btn btn-outline-secondary btn-sm" id="btn-volver" disabled>
                                   <i class="fas fa-arrow-left"></i>
                               </button>
                               <button class="btn btn-outline-secondary btn-sm" id="btn-adelante" disabled>
                                   <i class="fas fa-arrow-right"></i>
                               </button>
                               <button class="btn btn-outline-secondary btn-sm" id="btn-arriba" disabled>
                                   <i class="fas fa-arrow-up"></i>
                               </button>
                               <button class="btn btn-outline-primary btn-sm" id="btn-actualizar">
                                   <i class="fas fa-sync"></i>
                               </button>
                           </div>
                       </div>
                       
                       <div class="col-md-4">
                           <div class="input-group">
                               <input type="text" class="form-control form-control-sm" 
                                      id="busqueda-archivos" placeholder="Buscar archivos...">
                               <button class="btn btn-outline-secondary btn-sm" type="button" id="btn-buscar">
                                   <i class="fas fa-search"></i>
                               </button>
                           </div>
                       </div>
                       
                       <div class="col-md-4 text-end">
                           <div class="btn-group me-2">
                               <button class="btn btn-outline-secondary btn-sm active" 
                                       data-vista="lista" id="vista-lista">
                                   <i class="fas fa-list"></i>
                               </button>
                               <button class="btn btn-outline-secondary btn-sm" 
                                       data-vista="cuadricula" id="vista-cuadricula">
                                   <i class="fas fa-th"></i>
                               </button>
                               <button class="btn btn-outline-secondary btn-sm" 
                                       data-vista="arbol" id="vista-arbol">
                                   <i class="fas fa-sitemap"></i>
                               </button>
                           </div>
                           
                           <div class="btn-group">
                               <button class="btn btn-primary btn-sm" id="btn-subir-archivo">
                                   <i class="fas fa-upload me-1"></i>
                                   Subir
                               </button>
                               <button class="btn btn-outline-primary btn-sm dropdown-toggle" 
                                       data-bs-toggle="dropdown">
                                   <i class="fas fa-plus"></i>
                               </button>
                               <ul class="dropdown-menu">
                                   <li><a class="dropdown-item" href="#" id="crear-carpeta">
                                       <i class="fas fa-folder-plus me-2"></i>Nueva Carpeta
                                   </a></li>
                                   <li><a class="dropdown-item" href="#" id="subir-multiple">
                                       <i class="fas fa-files me-2"></i>Subir Múltiples
                                   </a></li>
                                   <li><hr class="dropdown-divider"></li>
                                   <li><a class="dropdown-item" href="#" id="importar-desde-drive">
                                       <i class="fab fa-google-drive me-2"></i>Desde Google Drive
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
    * Crea panel de navegación lateral
    */
   crearPanelNavegacion() {
       const navegacionHtml = `
           <div class="card h-100">
               <div class="card-header">
                   <h6 class="m-0">
                       <i class="fas fa-sitemap me-2"></i>
                       Estructura del Portafolio
                   </h6>
               </div>
               <div class="card-body p-0">
                   <div id="arbol-navegacion" class="tree-container">
                       <!-- Árbol de navegación -->
                   </div>
               </div>
               <div class="card-footer">
                   <div class="row text-center">
                       <div class="col-6">
                           <small class="text-muted">Archivos</small>
                           <div class="font-weight-bold" id="contador-archivos">0</div>
                       </div>
                       <div class="col-6">
                           <small class="text-muted">Tamaño</small>
                           <div class="font-weight-bold" id="tamaño-total">0 MB</div>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('panel-navegacion').innerHTML = navegacionHtml;
   }

   /**
    * Crea área principal de contenido
    */
   crearAreaPrincipal() {
       const areaPrincipalHtml = `
           <div class="card h-100">
               <div class="card-header d-flex justify-content-between align-items-center">
                   <div>
                       <h6 class="m-0" id="titulo-carpeta-actual">Seleccione un portafolio</h6>
                       <nav aria-label="breadcrumb">
                           <ol class="breadcrumb breadcrumb-sm m-0" id="breadcrumb-navegacion">
                               <li class="breadcrumb-item">Inicio</li>
                           </ol>
                       </nav>
                   </div>
                   <div class="btn-group btn-group-sm">
                       <button class="btn btn-outline-secondary" id="btn-seleccionar-todo">
                           Seleccionar Todo
                       </button>
                       <button class="btn btn-outline-warning" id="btn-operaciones-masivas" disabled>
                           Operaciones
                       </button>
                   </div>
               </div>
               
               <div class="card-body p-0">
                   <!-- Filtros rápidos -->
                   <div class="border-bottom p-2" id="filtros-rapidos">
                       <div class="row">
                           <div class="col-md-3">
                               <select class="form-select form-select-sm" id="filtro-tipo">
                                   <option value="">Todos los tipos</option>
                                   <option value="pdf">PDF</option>
                                   <option value="docx">Word</option>
                                   <option value="xlsx">Excel</option>
                                   <option value="pptx">PowerPoint</option>
                                   <option value="imagen">Imágenes</option>
                               </select>
                           </div>
                           <div class="col-md-3">
                               <select class="form-select form-select-sm" id="filtro-estado">
                                   <option value="">Todos los estados</option>
                                   <option value="pendiente">Pendiente</option>
                                   <option value="en_revision">En Revisión</option>
                                   <option value="aprobado">Aprobado</option>
                                   <option value="rechazado">Rechazado</option>
                               </select>
                           </div>
                           <div class="col-md-3">
                               <select class="form-select form-select-sm" id="ordenar-por">
                                   <option value="nombre">Nombre</option>
                                   <option value="fecha">Fecha</option>
                                   <option value="tamaño">Tamaño</option>
                                   <option value="tipo">Tipo</option>
                               </select>
                           </div>
                           <div class="col-md-3">
                               <button class="btn btn-outline-secondary btn-sm w-100" id="btn-limpiar-filtros">
                                   <i class="fas fa-times me-1"></i>
                                   Limpiar
                               </button>
                           </div>
                       </div>
                   </div>
                   
                   <!-- Contenido principal -->
                   <div id="contenido-archivos" class="file-explorer-content">
                       <!-- Aquí se cargan los archivos -->
                   </div>
               </div>
               
               <div class="card-footer">
                   <div class="d-flex justify-content-between align-items-center">
                       <small class="text-muted" id="info-seleccion">
                           No hay elementos seleccionados
                       </small>
                       <div class="btn-group btn-group-sm">
                           <button class="btn btn-outline-primary" id="btn-propiedades" disabled>
                               <i class="fas fa-info-circle me-1"></i>
                               Propiedades
                           </button>
                           <button class="btn btn-outline-warning" id="btn-descargar-seleccionados" disabled>
                               <i class="fas fa-download me-1"></i>
                               Descargar
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('area-principal').innerHTML = areaPrincipalHtml;
   }

   /**
    * Crea panel de propiedades lateral
    */
   crearPanelPropiedades() {
       const propiedadesHtml = `
           <div class="card h-100">
               <div class="card-header">
                   <h6 class="m-0">
                       <i class="fas fa-info-circle me-2"></i>
                       Propiedades
                   </h6>
               </div>
               <div class="card-body" id="contenido-propiedades">
                   <div class="text-center text-muted py-5">
                       <i class="fas fa-mouse-pointer fa-3x mb-3"></i>
                       <p>Seleccione un archivo para ver sus propiedades</p>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('panel-propiedades').innerHTML = propiedadesHtml;
   }

   /**
    * Carga un portafolio específico
    */
   async cargarPortafolio(portafolioId, carpetaId = null) {
       try {
           Utilidades.mostrarCargando('#contenido-archivos');
           
           // Cargar estructura del portafolio
           const [estructura, archivos] = await Promise.all([
               this.servicioPortafolios.obtenerEstructura(portafolioId),
               this.servicioDocumentos.obtenerPorPortafolio(portafolioId, carpetaId)
           ]);
           
           this.portafolioActual = this.portafolios.find(p => p.id == portafolioId);
           this.estructura = estructura;
           this.archivosActuales = archivos;
           
           // Actualizar interfaz
           this.actualizarArbolNavegacion();
           this.navegarACarpeta(carpetaId || estructura.id);
           this.actualizarContadores();
           
       } catch (error) {
           console.error('Error al cargar portafolio:', error);
           Utilidades.mostrarNotificacion('Error al cargar portafolio', 'error');
       } finally {
           Utilidades.ocultarCargando('#contenido-archivos');
       }
   }

   /**
    * Actualiza el árbol de navegación
    */
   actualizarArbolNavegacion() {
       if (!this.estructura) {
           document.getElementById('arbol-navegacion').innerHTML = `
               <div class="p-3 text-center text-muted">
                   <p>No hay estructura disponible</p>
               </div>
           `;
           return;
       }
       
       const arbolHtml = this.generarArbolHTML(this.estructura);
       document.getElementById('arbol-navegacion').innerHTML = arbolHtml;
       
       // Configurar eventos del árbol
       this.configurarEventosArbol();
   }

   /**
    * Genera HTML del árbol de carpetas
    */
   generarArbolHTML(nodo, nivel = 0) {
       const indent = nivel * 20;
       const tieneHijos = nodo.hijos && nodo.hijos.length > 0;
       const esExpandido = nivel < 2; // Expandir primeros 2 niveles por defecto
       
       let html = `
           <div class="tree-item" data-carpeta-id="${nodo.id}" style="padding-left: ${indent}px;">
               <div class="tree-node d-flex align-items-center py-1 px-2 ${this.carpetaActual?.id === nodo.id ? 'active' : ''}">
                   ${tieneHijos ? `
                       <i class="fas fa-chevron-${esExpandido ? 'down' : 'right'} tree-toggle me-2" 
                          data-carpeta-id="${nodo.id}"></i>
                   ` : '<span class="tree-spacer me-2"></span>'}
                   <i class="fas fa-folder text-warning me-2"></i>
                   <span class="tree-label">${nodo.nombre}</span>
                   ${nodo.documentosCount ? `
                       <span class="badge badge-secondary badge-sm ms-auto">${nodo.documentosCount}</span>
                   ` : ''}
               </div>
           </div>
       `;
       
       if (tieneHijos && esExpandido) {
           html += `<div class="tree-children" data-parent="${nodo.id}">`;
           nodo.hijos.forEach(hijo => {
               html += this.generarArbolHTML(hijo, nivel + 1);
           });
           html += '</div>';
       } else if (tieneHijos) {
           html += `<div class="tree-children d-none" data-parent="${nodo.id}">`;
           nodo.hijos.forEach(hijo => {
               html += this.generarArbolHTML(hijo, nivel + 1);
           });
           html += '</div>';
       }
       
       return html;
   }

   /**
    * Configura eventos del árbol de navegación
    */
   configurarEventosArbol() {
       // Expandir/colapsar carpetas
       document.querySelectorAll('.tree-toggle').forEach(toggle => {
           toggle.addEventListener('click', (e) => {
               e.stopPropagation();
               const carpetaId = toggle.dataset.carpetaId;
               const children = document.querySelector(`[data-parent="${carpetaId}"]`);
               
               if (children.classList.contains('d-none')) {
                   children.classList.remove('d-none');
                   toggle.classList.remove('fa-chevron-right');
                   toggle.classList.add('fa-chevron-down');
               } else {
                   children.classList.add('d-none');
                   toggle.classList.remove('fa-chevron-down');
                   toggle.classList.add('fa-chevron-right');
               }
           });
       });
       
       // Navegar a carpeta
       document.querySelectorAll('.tree-node').forEach(node => {
           node.addEventListener('click', (e) => {
               const carpetaId = node.closest('.tree-item').dataset.carpetaId;
               this.navegarACarpeta(carpetaId);
           });
       });
   }

   /**
    * Navega a una carpeta específica
    */
   async navegarACarpeta(carpetaId) {
       try {
           // Buscar carpeta en la estructura
           this.carpetaActual = this.buscarCarpetaEnEstructura(this.estructura, carpetaId);
           
           if (!this.carpetaActual) {
               console.error('Carpeta no encontrada:', carpetaId);
               return;
           }
           
           // Agregar al historial
           this.historialNavegacion.push(carpetaId);
           
           // Cargar archivos de la carpeta
           const archivos = await this.servicioDocumentos.obtenerPorCarpeta(carpetaId);
           this.archivosActuales = archivos;
           
           // Actualizar interfaz
           this.actualizarTituloCarpeta();
           this.actualizarBreadcrumb();
           this.mostrarArchivos();
           this.actualizarEstadoNavegacion();
           this.limpiarSeleccion();
           
           // Actualizar árbol (marcar carpeta activa)
           document.querySelectorAll('.tree-node').forEach(node => {
               node.classList.remove('active');
           });
           document.querySelector(`[data-carpeta-id="${carpetaId}"] .tree-node`)?.classList.add('active');
           
       } catch (error) {
           console.error('Error al navegar a carpeta:', error);
           Utilidades.mostrarNotificacion('Error al cargar carpeta', 'error');
       }
   }

   /**
    * Busca una carpeta en la estructura recursivamente
    */
   buscarCarpetaEnEstructura(nodo, id) {
       if (nodo.id === id) return nodo;
       
       if (nodo.hijos) {
           for (const hijo of nodo.hijos) {
               const resultado = this.buscarCarpetaEnEstructura(hijo, id);
               if (resultado) return resultado;
           }
       }
       
       return null;
   }

   /**
    * Actualiza el título de la carpeta actual
    */
   actualizarTituloCarpeta() {
       const titulo = this.carpetaActual ? this.carpetaActual.nombre : 'Portafolio';
       document.getElementById('titulo-carpeta-actual').textContent = titulo;
   }

   /**
    * Actualiza el breadcrumb de navegación
    */
   actualizarBreadcrumb() {
       const breadcrumb = document.getElementById('breadcrumb-navegacion');
       
       if (!this.carpetaActual) {
           breadcrumb.innerHTML = '<li class="breadcrumb-item active">Inicio</li>';
           return;
       }
       
       // Construir ruta desde la raíz
       const ruta = this.construirRutaCarpeta(this.carpetaActual);
       
       const breadcrumbHtml = ruta.map((carpeta, index) => {
           if (index === ruta.length - 1) {
               return `<li class="breadcrumb-item active">${carpeta.nombre}</li>`;
           } else {
               return `<li class="breadcrumb-item">
                   <a href="#" onclick="window.exploradorArchivos.navegarACarpeta('${carpeta.id}')">
                       ${carpeta.nombre}
                   </a>
               </li>`;
           }
       }).join('');
       
       breadcrumb.innerHTML = breadcrumbHtml;
   }

   /**
    * Construye la ruta completa de una carpeta
    */
   construirRutaCarpeta(carpeta) {
       const ruta = [carpeta];
       let actual = carpeta;
       
       while (actual.padre) {
           actual = this.buscarCarpetaEnEstructura(this.estructura, actual.padre);
           if (actual) {
               ruta.unshift(actual);
           } else {
               break;
           }
       }
       
       return ruta;
   }

   /**
    * Muestra los archivos según el modo de vista seleccionado
    */
   mostrarArchivos() {
       const contenedor = document.getElementById('contenido-archivos');
       
       if (!this.archivosActuales || this.archivosActuales.length === 0) {
           contenedor.innerHTML = `
               <div class="text-center text-muted py-5">
                   <i class="fas fa-folder-open fa-3x mb-3"></i>
                   <h5>Carpeta vacía</h5>
                   <p>No hay archivos en esta carpeta</p>
                   <button class="btn btn-primary" onclick="document.getElementById('btn-subir-archivo').click()">
                       <i class="fas fa-upload me-1"></i>
                       Subir primer archivo
                   </button>
               </div>
           `;
           return;
       }
       
       const archivosFiltrados = this.aplicarFiltros(this.archivosActuales);
       
       switch (this.modoVista) {
           case 'lista':
               this.mostrarVistaLista(archivosFiltrados);
               break;
           case 'cuadricula':
               this.mostrarVistaCuadricula(archivosFiltrados);
               break;
           case 'arbol':
               this.mostrarVistaArbol(archivosFiltrados);
               break;
       }
   }

   /**
    * Muestra archivos en vista de lista
    */
   mostrarVistaLista(archivos) {
       const listaHtml = `
           <div class="table-responsive">
               <table class="table table-hover table-sm">
                   <thead>
                       <tr>
                           <th width="30">
                               <input type="checkbox" id="seleccionar-todos-archivos">
                           </th>
                           <th>Nombre</th>
                           <th>Tipo</th>
                           <th>Tamaño</th>
                           <th>Estado</th>
                           <th>Fecha</th>
                           <th>Acciones</th>
                       </tr>
                   </thead>
                   <tbody>
                       ${archivos.map(archivo => this.generarFilaArchivo(archivo)).join('')}
                   </tbody>
               </table>
           </div>
       `;
       
       document.getElementById('contenido-archivos').innerHTML = listaHtml;
   }

   /**
    * Genera una fila de archivo para la vista de lista
    */
   generarFilaArchivo(archivo) {
       const estadoClass = {
           'pendiente': 'warning',
           'en_revision': 'info',
           'aprobado': 'success',
           'rechazado': 'danger',
           'requiere_correccion': 'secondary'
       };
       
       const icono = this.obtenerIconoArchivo(archivo.formato);
       
       return `
           <tr class="archivo-fila" data-archivo-id="${archivo.id}">
               <td>
                   <input type="checkbox" class="checkbox-archivo" value="${archivo.id}">
               </td>
               <td>
                   <div class="d-flex align-items-center">
                       <i class="${icono} text-${this.obtenerColorTipo(archivo.formato)} me-2"></i>
                       <div>
                           <div class="font-weight-bold archivo-nombre" title="${archivo.nombreOriginal}">
                               ${Utilidades.truncarTexto(archivo.nombreOriginal, 30)}
                           </div>
                           ${archivo.version > 1 ? `
                               <small class="text-muted">v${archivo.version}</small>
                           ` : ''}
                       </div>
                   </div>
               </td>
               <td>
                   <span class="badge badge-outline-${this.obtenerColorTipo(archivo.formato)}">
                       ${archivo.formato.toUpperCase()}
                   </span>
               </td>
               <td>${Utilidades.formatearTamaño(archivo.tamañoArchivo)}</td>
               <td>
                   <span class="badge badge-${estadoClass[archivo.estado] || 'secondary'}">
                       ${archivo.estado.replace('_', ' ')}
                   </span>
               </td>
               <td>
                   <small title="${Utilidades.formatearFecha(archivo.fechaSubida)}">
                       ${Utilidades.formatearTiempoRelativo(archivo.fechaSubida)}
                   </small>
               </td>
               <td>
                   <div class="btn-group btn-group-sm">
                       <button class="btn btn-outline-primary btn-ver" 
                               data-archivo-id="${archivo.id}" title="Ver">
                           <i class="fas fa-eye"></i>
                       </button>
                       <button class="btn btn-outline-secondary btn-descargar" 
                               data-archivo-id="${archivo.id}" title="Descargar">
                           <i class="fas fa-download"></i>
                       </button>
                       <button class="btn btn-outline-warning btn-editar" 
                               data-archivo-id="${archivo.id}" title="Editar">
                           <i class="fas fa-edit"></i>
                       </button>
                       <button class="btn btn-outline-danger btn-eliminar" 
                               data-archivo-id="${archivo.id}" title="Eliminar">
                           <i class="fas fa-trash"></i>
                       </button>
                   </div>
               </td>
           </tr>
       `;
   }

   /**
    * Muestra archivos en vista de cuadrícula
    */
   mostrarVistaCuadricula(archivos) {
       const cuadriculaHtml = `
           <div class="row p-3">
               ${archivos.map(archivo => `
                   <div class="col-xl-2 col-lg-3 col-md-4 col-sm-6 mb-3">
                       <div class="card archivo-card h-100" data-archivo-id="${archivo.id}">
                           <div class="card-body text-center p-2">
                               <div class="mb-2">
                                   <input type="checkbox" class="checkbox-archivo position-absolute top-0 start-0 m-2" 
                                          value="${archivo.id}">
                                   <i class="${this.obtenerIconoArchivo(archivo.formato)} fa-3x text-${this.obtenerColorTipo(archivo.formato)}"></i>
                               </div>
                               <h6 class="card-title small" title="${archivo.nombreOriginal}">
                                   ${Utilidades.truncarTexto(archivo.nombreOriginal, 20)}
                               </h6>
                               <div class="small text-muted mb-2">
                                   ${Utilidades.formatearTamaño(archivo.tamañoArchivo)}
                               </div>
                               <span class="badge badge-${this.obtenerEstadoClass(archivo.estado)} badge-sm">
                                   ${archivo.estado}
                               </span>
                           </div>
                           <div class="card-footer p-1">
                               <div class="btn-group w-100" role="group">
                                   <button class="btn btn-outline-primary btn-sm btn-ver" 
                                           data-archivo-id="${archivo.id}">
                                       <i class="fas fa-eye"></i>
                                   </button>
                                   <button class="btn btn-outline-secondary btn-sm btn-descargar" 
                                           data-archivo-id="${archivo.id}">
                                       <i class="fas fa-download"></i>
                                   </button>
                                   <button class="btn btn-outline-warning btn-sm btn-editar" 
                                           data-archivo-id="${archivo.id}">
                                       <i class="fas fa-edit"></i>
                                   </button>
                               </div>
                           </div>
                       </div>
                   </div>
               `).join('')}
           </div>
       `;
       
       document.getElementById('contenido-archivos').innerHTML = cuadriculaHtml;
   }

   /**
    * Aplica filtros a la lista de archivos
    */
   aplicarFiltros(archivos) {
       return archivos.filter(archivo => {
           // Filtro por tipo
           if (this.filtros.tipo && !this.coincideTipoArchivo(archivo.formato, this.filtros.tipo)) {
               return false;
           }
           
           // Filtro por estado
           if (this.filtros.estado && archivo.estado !== this.filtros.estado) {
               return false;
           }
           
           // Filtro por búsqueda
           if (this.filtros.busqueda) {
               const busqueda = this.filtros.busqueda.toLowerCase();
               if (!archivo.nombreOriginal.toLowerCase().includes(busqueda)) {
                   return false;
               }
           }
           
           return true;
       });
   }

   /**
    * Verifica si un formato coincide con un tipo de filtro
    */
   coincideTipoArchivo(formato, tipoFiltro) {
       const tipos = {
           'imagen': ['jpg', 'jpeg', 'png', 'gif', 'bmp'],
           'documento': ['pdf', 'docx', 'doc', 'txt'],
           'hoja_calculo': ['xlsx', 'xls', 'csv'],
           'presentacion': ['pptx', 'ppt']
       };
       
       if (tipos[tipoFiltro]) {
           return tipos[tipoFiltro].includes(formato.toLowerCase());
       }
       
       return formato.toLowerCase() === tipoFiltro.toLowerCase();
   }

   /**
    * Obtiene el icono para un tipo de archivo
    */
   obtenerIconoArchivo(formato) {
       const iconos = {
           'pdf': 'fas fa-file-pdf',
           'docx': 'fas fa-file-word',
           'doc': 'fas fa-file-word',
           'xlsx': 'fas fa-file-excel',
           'xls': 'fas fa-file-excel',
           'pptx': 'fas fa-file-powerpoint',
           'ppt': 'fas fa-file-powerpoint',
           'jpg': 'fas fa-file-image',
           'jpeg': 'fas fa-file-image',
           'png': 'fas fa-file-image',
           'gif': 'fas fa-file-image',
           'txt': 'fas fa-file-alt',
           'zip': 'fas fa-file-archive',
           'rar': 'fas fa-file-archive'
       };
       
       return iconos[formato.toLowerCase()] || 'fas fa-file';
   }

   /**
    * Obtiene el color para un tipo de archivo
    */
   obtenerColorTipo(formato) {
       const colores = {
           'pdf': 'danger',
           'docx': 'primary',
           'doc': 'primary',
           'xlsx': 'success',
           'xls': 'success',
           'pptx': 'warning',
           'ppt': 'warning',
           'jpg': 'info',
           'jpeg': 'info',
           'png': 'info',
           'gif': 'info'
       };
       
       return colores[formato.toLowerCase()] || 'secondary';
   }

   /**
    * Obtiene la clase CSS para un estado
    */
   obtenerEstadoClass(estado) {
       const clases = {
           'pendiente': 'warning',
           'en_revision': 'info',
           'aprobado': 'success',
           'rechazado': 'danger',
           'requiere_correccion': 'secondary'
       };
       
       return clases[estado] || 'secondary';
   }

   /**
    * Configura eventos de la interfaz
    */
   configurarEventos() {
       // Botones de navegación
       document.getElementById('btn-volver').addEventListener('click', () => {
           this.volverAtras();
       });
       
       document.getElementById('btn-actualizar').addEventListener('click', () => {
           this.actualizarVista();
       });
       
       // Cambio de vista
       document.querySelectorAll('[data-vista]').forEach(btn => {
           btn.addEventListener('click', (e) => {
               this.cambiarModoVista(e.target.dataset.vista);
           });
       });
       
       // Búsqueda
       document.getElementById('busqueda-archivos').addEventListener('input', (e) => {
           this.filtros.busqueda = e.target.value;
           this.aplicarFiltrosYMostrar();
       });
       
       // Filtros
       document.getElementById('filtro-tipo').addEventListener('change', (e) => {
           this.filtros.tipo = e.target.value;
           this.aplicarFiltrosYMostrar();
       });
       
       document.getElementById('filtro-estado').addEventListener('change', (e) => {
           this.filtros.estado = e.target.value;
           this.aplicarFiltrosYMostrar();
       });
       
       // Botones de acción
       document.getElementById('btn-subir-archivo').addEventListener('click', () => {
           this.mostrarModalSubirArchivo();
       });
       
       // Eventos delegados para archivos
       document.addEventListener('click', (e) => {
           if (e.target.closest('.btn-ver')) {
               const archivoId = e.target.closest('.btn-ver').dataset.archivoId;
               this.verArchivo(archivoId);
           }
           
           if (e.target.closest('.btn-descargar')) {
               const archivoId = e.target.closest('.btn-descargar').dataset.archivoId;
               this.descargarArchivo(archivoId);
           }
           
           if (e.target.closest('.btn-eliminar')) {
               const archivoId = e.target.closest('.btn-eliminar').dataset.archivoId;
               this.eliminarArchivo(archivoId);
           }
       });
       
       // Selección de archivos
       document.addEventListener('change', (e) => {
           if (e.target.classList.contains('checkbox-archivo')) {
               this.actualizarSeleccion();
           }
       });
       
       // Seleccionar todos
       document.addEventListener('change', (e) => {
           if (e.target.id === 'seleccionar-todos-archivos') {
               this.seleccionarTodosArchivos(e.target.checked);
           }
       });
   }

   /**
    * Configura funcionalidad de arrastrar y soltar
    */
   configurarArrastrarYSoltar() {
       const area = document.getElementById('contenido-archivos');
       
       area.addEventListener('dragover', (e) => {
           e.preventDefault();
           area.classList.add('drag-over');
       });
       
       area.addEventListener('dragleave', (e) => {
           e.preventDefault();
           area.classList.remove('drag-over');
       });
       
       area.addEventListener('drop', (e) => {
           e.preventDefault();
           area.classList.remove('drag-over');
           
           const archivos = Array.from(e.dataTransfer.files);
           if (archivos.length > 0) {
               this.procesarArchivosArrastrados(archivos);
           }
       });
   }

   /**
    * Procesa archivos arrastrados al explorador
    */
   async procesarArchivosArrastrados(archivos) {
       try {
           if (!this.carpetaActual) {
               Utilidades.mostrarNotificacion('Seleccione una carpeta primero', 'warning');
               return;
           }
           
           // Validar archivos
           const archivosValidos = archivos.filter(archivo => {
               return this.validarArchivo(archivo);
           });
           
           if (archivosValidos.length === 0) {
               Utilidades.mostrarNotificacion('No hay archivos válidos para subir', 'warning');
               return;
           }
           
           // Subir archivos
           for (const archivo of archivosValidos) {
               await this.subirArchivo(archivo);
           }
           
           // Actualizar vista
           this.actualizarVista();
           
       } catch (error) {
           console.error('Error al procesar archivos arrastrados:', error);
           Utilidades.mostrarNotificacion('Error al procesar archivos', 'error');
       }
   }

   /**
    * Valida un archivo antes de subirlo
    */
   validarArchivo(archivo) {
       const formatosPermitidos = this.configuracionExplorador.formatosPermitidos || 
                                ['pdf', 'docx', 'xlsx', 'pptx', 'jpg', 'png'];
       const tamañoMaximo = this.configuracionExplorador.tamañoMaximo || 50 * 1024 * 1024; // 50MB
       
       // Validar formato
       const extension = archivo.name.split('.').pop().toLowerCase();
       if (!formatosPermitidos.includes(extension)) {
           Utilidades.mostrarNotificacion(`Formato ${extension} no permitido`, 'error');
           return false;
       }
       
       // Validar tamaño
       if (archivo.size > tamañoMaximo) {
           Utilidades.mostrarNotificacion(`Archivo muy grande: ${Utilidades.formatearTamaño(archivo.size)}`, 'error');
           return false;
       }
       
       return true;
   }

   /**
    * Cambia el modo de vista
    */
   cambiarModoVista(nuevaVista) {
       this.modoVista = nuevaVista;
       
       // Actualizar botones
       document.querySelectorAll('[data-vista]').forEach(btn => {
           btn.classList.remove('active');
       });
       document.querySelector(`[data-vista="${nuevaVista}"]`).classList.add('active');
       
       // Actualizar contenido
       this.mostrarArchivos();
   }

   /**
    * Aplica filtros y actualiza la vista
    */
   aplicarFiltrosYMostrar() {
       // Debounce para evitar demasiadas actualizaciones
       clearTimeout(this.timeoutFiltros);
       this.timeoutFiltros = setTimeout(() => {
           this.mostrarArchivos();
       }, 300);
   }

   /**
    * Actualiza la selección de archivos
    */
   actualizarSeleccion() {
       const checkboxes = document.querySelectorAll('.checkbox-archivo:checked');
       this.archivosSeleccionados = Array.from(checkboxes).map(cb => cb.value);
       
       // Actualizar info de selección
       const info = document.getElementById('info-seleccion');
       if (this.archivosSeleccionados.length === 0) {
           info.textContent = 'No hay elementos seleccionados';
       } else {
           info.textContent = `${this.archivosSeleccionados.length} elemento(s) seleccionado(s)`;
       }
       
       // Habilitar/deshabilitar botones
       const tieneSeleccion = this.archivosSeleccionados.length > 0;
       document.getElementById('btn-propiedades').disabled = !tieneSeleccion;
       document.getElementById('btn-descargar-seleccionados').disabled = !tieneSeleccion;
       document.getElementById('btn-operaciones-masivas').disabled = !tieneSeleccion;
   }

   /**
    * Selecciona o deselecciona todos los archivos
    */
   seleccionarTodosArchivos(seleccionar) {
       const checkboxes = document.querySelectorAll('.checkbox-archivo');
       checkboxes.forEach(checkbox => {
           checkbox.checked = seleccionar;
       });
       this.actualizarSeleccion();
   }

   /**
    * Limpia la selección actual
    */
   limpiarSeleccion() {
       this.archivosSeleccionados = [];
       this.actualizarSeleccion();
       
       // Desmarcar checkboxes
       document.querySelectorAll('.checkbox-archivo').forEach(cb => {
           cb.checked = false;
       });
       
       const selectAll = document.getElementById('seleccionar-todos-archivos');
       if (selectAll) selectAll.checked = false;
   }

   /**
    * Ver archivo en modal o nueva ventana
    */
   async verArchivo(archivoId) {
       try {
           const archivo = this.archivosActuales.find(a => a.id == archivoId);
           if (!archivo) return;
           
           // Abrir en nueva ventana para formatos compatibles
           if (['pdf', 'jpg', 'jpeg', 'png', 'gif'].includes(archivo.formato.toLowerCase())) {
               window.open(archivo.urlVisualizacion, '_blank');
           } else {
               // Descargar para otros formatos
               this.descargarArchivo(archivoId);
           }
           
       } catch (error) {
           console.error('Error al ver archivo:', error);
           Utilidades.mostrarNotificacion('Error al abrir archivo', 'error');
       }
   }

   /**
    * Descarga un archivo
    */
   async descargarArchivo(archivoId) {
       try {
           const archivo = this.archivosActuales.find(a => a.id == archivoId);
           if (!archivo) return;
           
           // Crear enlace de descarga temporal
           const enlace = document.createElement('a');
           enlace.href = archivo.urlDescarga;
           enlace.download = archivo.nombreOriginal;
           enlace.style.display = 'none';
           
           document.body.appendChild(enlace);
           enlace.click();
           document.body.removeChild(enlace);
           
           Utilidades.mostrarNotificacion('Descarga iniciada', 'success');
           
       } catch (error) {
           console.error('Error al descargar archivo:', error);
           Utilidades.mostrarNotificacion('Error al descargar archivo', 'error');
       }
   }

   /**
    * Actualiza contadores de archivos y tamaño
    */
   actualizarContadores() {
       if (!this.archivosActuales) return;
       
       const totalArchivos = this.archivosActuales.length;
       const tamañoTotal = this.archivosActuales.reduce((sum, archivo) => sum + (archivo.tamañoArchivo || 0), 0);
       
       document.getElementById('contador-archivos').textContent = totalArchivos;
       document.getElementById('tamaño-total').textContent = Utilidades.formatearTamaño(tamañoTotal);
   }

   /**
    * Actualiza la vista completa
    */
   async actualizarVista() {
       if (this.portafolioActual && this.carpetaActual) {
           await this.navegarACarpeta(this.carpetaActual.id);
       }
   }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
   window.exploradorArchivos = new ExploradorArchivos();
});

// Exportar para uso global
window.ExploradorArchivos = ExploradorArchivos;