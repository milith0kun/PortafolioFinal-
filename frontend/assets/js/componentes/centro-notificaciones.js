/**
 * 🔔 CENTRO DE NOTIFICACIONES
 * Sistema Portafolio Docente UNSAAC
 * 
 * Componente UI para gestión visual de notificaciones
 * Panel deslizante, filtros, acciones masivas y tiempo real
 */

class ComponenteCentroNotificaciones {
   constructor(configuracion = {}) {
       this.configuracion = {
           contenedor: configuracion.contenedor || '#centro-notificaciones',
           icono: configuracion.icono || '#icono-notificaciones',
           contador: configuracion.contador || '#contador-notificaciones',
           posicion: configuracion.posicion || 'derecha', // 'derecha' o 'izquierda'
           ancho: configuracion.ancho || '400px',
           alto: configuracion.alto || '600px',
           autoOcultar: configuracion.autoOcultar !== false,
           mostrarFiltros: configuracion.mostrarFiltros !== false,
           mostrarBuscador: configuracion.mostrarBuscador !== false,
           animaciones: configuracion.animaciones !== false
       };

       // Estado del componente
       this.estado = {
           abierto: false,
           cargando: false,
           filtroActual: 'todas',
           terminoBusqueda: '',
           paginaActual: 1,
           notificacionesPorPagina: 20
       };

       // Referencias a elementos DOM
       this.elementos = {};
       
       // Servicios
       this.servicioNotificaciones = window.servicioNotificaciones;
       
       // Bind methods
       this.manejarClicIcono = this.manejarClicIcono.bind(this);
       this.manejarClicFuera = this.manejarClicFuera.bind(this);
       this.manejarNuevaNotificacion = this.manejarNuevaNotificacion.bind(this);
       this.manejarNotificacionLeida = this.manejarNotificacionLeida.bind(this);
       this.manejarScrollLista = this.manejarScrollLista.bind(this);
   }

   /**
    * 🚀 Inicializar el componente
    */
   async inicializar() {
       try {
           console.log('🔔 Inicializando centro de notificaciones');

           // Crear estructura HTML
           this.crearEstructura();
           
           // Configurar eventos
           this.configurarEventos();
           
           // Aplicar estilos
           this.aplicarEstilos();
           
           // Cargar notificaciones iniciales
           await this.cargarNotificaciones();
           
           // Configurar listeners del servicio
           this.configurarListenersServicio();
           
           console.log('✅ Centro de notificaciones inicializado');
           
       } catch (error) {
           console.error('❌ Error inicializando centro de notificaciones:', error);
           throw error;
       }
   }

   /**
    * 🏗️ Crear estructura HTML del componente
    */
   crearEstructura() {
       // Crear el icono de notificaciones si no existe
       this.crearIconoNotificaciones();
       
       // Crear el panel principal
       this.crearPanelPrincipal();
   }

   /**
    * 🔔 Crear icono de notificaciones
    */
   crearIconoNotificaciones() {
       let iconoContainer = document.querySelector(this.configuracion.icono);
       
       if (!iconoContainer) {
           // Buscar en la barra superior
           const barraSuperior = document.querySelector('.barra-superior') || 
                               document.querySelector('.navbar') ||
                               document.querySelector('header');
           
           if (barraSuperior) {
               iconoContainer = document.createElement('div');
               iconoContainer.id = this.configuracion.icono.replace('#', '');
               iconoContainer.className = 'icono-notificaciones-container';
               barraSuperior.appendChild(iconoContainer);
           }
       }

       if (iconoContainer) {
           iconoContainer.innerHTML = `
               <button type="button" class="btn-notificaciones" title="Notificaciones">
                   <i class="fas fa-bell"></i>
                   <span class="contador-notificaciones" id="${this.configuracion.contador.replace('#', '')}" style="display: none;">
                       0
                   </span>
               </button>
           `;
           
           this.elementos.icono = iconoContainer.querySelector('.btn-notificaciones');
           this.elementos.contador = iconoContainer.querySelector('.contador-notificaciones');
       }
   }

   /**
    * 📱 Crear panel principal de notificaciones
    */
   crearPanelPrincipal() {
       // Crear overlay
       const overlay = document.createElement('div');
       overlay.className = 'notificaciones-overlay';
       overlay.style.display = 'none';
       document.body.appendChild(overlay);
       this.elementos.overlay = overlay;

       // Crear panel principal
       const panel = document.createElement('div');
       panel.className = `centro-notificaciones panel-${this.configuracion.posicion}`;
       panel.style.display = 'none';
       panel.innerHTML = this.generarHTMLPanel();
       
       document.body.appendChild(panel);
       this.elementos.panel = panel;
       
       // Guardar referencias a elementos internos
       this.guardarReferenciasElementos();
   }

   /**
    * 📋 Generar HTML del panel
    */
   generarHTMLPanel() {
       return `
           <div class="notificaciones-header">
               <div class="header-titulo">
                   <h3>
                       <i class="fas fa-bell"></i>
                       Notificaciones
                   </h3>
                   <span class="total-notificaciones">0 nuevas</span>
               </div>
               <div class="header-acciones">
                   <button type="button" class="btn-marcar-todas" title="Marcar todas como leídas">
                       <i class="fas fa-check-double"></i>
                   </button>
                   <button type="button" class="btn-configuracion" title="Configuración">
                       <i class="fas fa-cog"></i>
                   </button>
                   <button type="button" class="btn-cerrar" title="Cerrar">
                       <i class="fas fa-times"></i>
                   </button>
               </div>
           </div>

           ${this.configuracion.mostrarBuscador ? `
               <div class="notificaciones-buscador">
                   <div class="input-group">
                       <input type="text" class="form-control buscar-notificaciones" 
                              placeholder="Buscar notificaciones...">
                       <div class="input-group-append">
                           <button class="btn btn-outline-secondary" type="button">
                               <i class="fas fa-search"></i>
                           </button>
                       </div>
                   </div>
               </div>
           ` : ''}

           ${this.configuracion.mostrarFiltros ? `
               <div class="notificaciones-filtros">
                   <div class="filtros-tabs">
                       <button type="button" class="filtro-tab active" data-filtro="todas">
                           Todas <span class="badge">0</span>
                       </button>
                       <button type="button" class="filtro-tab" data-filtro="no_leidas">
                           No leídas <span class="badge">0</span>
                       </button>
                       <button type="button" class="filtro-tab" data-filtro="importantes">
                           Importantes <span class="badge">0</span>
                       </button>
                   </div>
                   
                   <div class="filtros-avanzados" style="display: none;">
                       <select class="form-control form-control-sm filtro-tipo">
                           <option value="">Todos los tipos</option>
                           <option value="sistema">Sistema</option>
                           <option value="documento">Documento</option>
                           <option value="observacion">Observación</option>
                           <option value="ciclo">Ciclo</option>
                           <option value="asignacion">Asignación</option>
                       </select>
                       
                       <select class="form-control form-control-sm filtro-prioridad">
                           <option value="">Todas las prioridades</option>
                           <option value="urgente">Urgente</option>
                           <option value="alta">Alta</option>
                           <option value="media">Media</option>
                           <option value="baja">Baja</option>
                       </select>
                   </div>
                   
                   <button type="button" class="btn-filtros-avanzados">
                       <i class="fas fa-filter"></i>
                       Filtros avanzados
                   </button>
               </div>
           ` : ''}

           <div class="notificaciones-lista-container">
               <div class="notificaciones-lista">
                   <!-- Las notificaciones se cargarán aquí dinámicamente -->
               </div>
               
               <div class="notificaciones-cargando" style="display: none;">
                   <div class="spinner-border" role="status">
                       <span class="sr-only">Cargando...</span>
                   </div>
                   <p>Cargando notificaciones...</p>
               </div>
               
               <div class="notificaciones-vacio" style="display: none;">
                   <div class="icono-vacio">
                       <i class="fas fa-bell-slash"></i>
                   </div>
                   <h4>No hay notificaciones</h4>
                   <p>Te mantendremos informado cuando tengas nuevas notificaciones.</p>
               </div>
               
               <div class="notificaciones-error" style="display: none;">
                   <div class="icono-error">
                       <i class="fas fa-exclamation-triangle"></i>
                   </div>
                   <h4>Error al cargar</h4>
                   <p>No se pudieron cargar las notificaciones.</p>
                   <button type="button" class="btn btn-primary btn-reintentar">
                       <i class="fas fa-redo"></i>
                       Reintentar
                   </button>
               </div>
           </div>

           <div class="notificaciones-footer">
               <div class="acciones-masivas">
                   <button type="button" class="btn btn-sm btn-outline-secondary btn-seleccionar-todas">
                       Seleccionar todas
                   </button>
                   <button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-seleccionadas" disabled>
                       <i class="fas fa-trash"></i>
                       Eliminar
                   </button>
                   <button type="button" class="btn btn-sm btn-outline-secondary btn-archivar-seleccionadas" disabled>
                       <i class="fas fa-archive"></i>
                       Archivar
                   </button>
               </div>
               
               <div class="paginacion">
                   <button type="button" class="btn btn-sm btn-outline-secondary btn-anterior" disabled>
                       <i class="fas fa-chevron-left"></i>
                   </button>
                   <span class="pagina-actual">1</span>
                   <button type="button" class="btn btn-sm btn-outline-secondary btn-siguiente" disabled>
                       <i class="fas fa-chevron-right"></i>
                   </button>
               </div>
           </div>
       `;
   }

   /**
    * 🔗 Guardar referencias a elementos
    */
   guardarReferenciasElementos() {
       const panel = this.elementos.panel;
       
       this.elementos.header = panel.querySelector('.notificaciones-header');
       this.elementos.totalNotificaciones = panel.querySelector('.total-notificaciones');
       this.elementos.btnMarcarTodas = panel.querySelector('.btn-marcar-todas');
       this.elementos.btnConfiguracion = panel.querySelector('.btn-configuracion');
       this.elementos.btnCerrar = panel.querySelector('.btn-cerrar');
       
       if (this.configuracion.mostrarBuscador) {
           this.elementos.buscador = panel.querySelector('.buscar-notificaciones');
       }
       
       if (this.configuracion.mostrarFiltros) {
           this.elementos.filtrosTabs = panel.querySelectorAll('.filtro-tab');
           this.elementos.filtrosAvanzados = panel.querySelector('.filtros-avanzados');
           this.elementos.btnFiltrosAvanzados = panel.querySelector('.btn-filtros-avanzados');
           this.elementos.filtroTipo = panel.querySelector('.filtro-tipo');
           this.elementos.filtroPrioridad = panel.querySelector('.filtro-prioridad');
       }
       
       this.elementos.listaContainer = panel.querySelector('.notificaciones-lista-container');
       this.elementos.lista = panel.querySelector('.notificaciones-lista');
       this.elementos.cargando = panel.querySelector('.notificaciones-cargando');
       this.elementos.vacio = panel.querySelector('.notificaciones-vacio');
       this.elementos.error = panel.querySelector('.notificaciones-error');
       this.elementos.btnReintentar = panel.querySelector('.btn-reintentar');
       
       this.elementos.footer = panel.querySelector('.notificaciones-footer');
       this.elementos.btnSeleccionarTodas = panel.querySelector('.btn-seleccionar-todas');
       this.elementos.btnEliminarSeleccionadas = panel.querySelector('.btn-eliminar-seleccionadas');
       this.elementos.btnArchivarSeleccionadas = panel.querySelector('.btn-archivar-seleccionadas');
       this.elementos.paginaActual = panel.querySelector('.pagina-actual');
       this.elementos.btnAnterior = panel.querySelector('.btn-anterior');
       this.elementos.btnSiguiente = panel.querySelector('.btn-siguiente');
   }

   /**
    * ⚙️ Configurar eventos del componente
    */
   configurarEventos() {
       // Evento para abrir/cerrar panel
       if (this.elementos.icono) {
           this.elementos.icono.addEventListener('click', this.manejarClicIcono);
       }

       // Evento para cerrar panel
       this.elementos.btnCerrar?.addEventListener('click', () => this.cerrar());
       this.elementos.overlay?.addEventListener('click', this.manejarClicFuera);

       // Eventos de header
       this.elementos.btnMarcarTodas?.addEventListener('click', () => this.marcarTodasComoLeidas());
       this.elementos.btnConfiguracion?.addEventListener('click', () => this.abrirConfiguracion());

       // Eventos de buscador
       if (this.elementos.buscador) {
           this.elementos.buscador.addEventListener('input', (e) => {
               this.estado.terminoBusqueda = e.target.value;
               this.filtrarNotificaciones();
           });
       }

       // Eventos de filtros
       if (this.elementos.filtrosTabs) {
           this.elementos.filtrosTabs.forEach(tab => {
               tab.addEventListener('click', (e) => {
                   this.cambiarFiltro(e.target.dataset.filtro);
               });
           });
       }

       if (this.elementos.btnFiltrosAvanzados) {
           this.elementos.btnFiltrosAvanzados.addEventListener('click', () => {
               this.toggleFiltrosAvanzados();
           });
       }

       // Eventos de lista
       this.elementos.lista?.addEventListener('scroll', this.manejarScrollLista);

       // Eventos de acciones masivas
       this.elementos.btnSeleccionarTodas?.addEventListener('click', () => this.seleccionarTodas());
       this.elementos.btnEliminarSeleccionadas?.addEventListener('click', () => this.eliminarSeleccionadas());
       this.elementos.btnArchivarSeleccionadas?.addEventListener('click', () => this.archivarSeleccionadas());

       // Eventos de paginación
       this.elementos.btnAnterior?.addEventListener('click', () => this.paginaAnterior());
       this.elementos.btnSiguiente?.addEventListener('click', () => this.paginaSiguiente());

       // Evento de reintentar
       this.elementos.btnReintentar?.addEventListener('click', () => this.cargarNotificaciones());

       // Evento de ESC para cerrar
       document.addEventListener('keydown', (e) => {
           if (e.key === 'Escape' && this.estado.abierto) {
               this.cerrar();
           }
       });
   }

   /**
    * 🎨 Aplicar estilos CSS
    */
   aplicarEstilos() {
       // Aplicar ancho y alto del panel
       this.elementos.panel.style.width = this.configuracion.ancho;
       this.elementos.panel.style.height = this.configuracion.alto;
       
       // Aplicar posición
       if (this.configuracion.posicion === 'izquierda') {
           this.elementos.panel.style.left = '0';
           this.elementos.panel.style.right = 'auto';
       } else {
           this.elementos.panel.style.right = '0';
           this.elementos.panel.style.left = 'auto';
       }
   }

   // ==========================================
   // GESTIÓN DE ESTADO DEL PANEL
   // ==========================================

   /**
    * 📱 Abrir panel de notificaciones
    */
   abrir() {
       if (this.estado.abierto) return;

       this.estado.abierto = true;
       
       // Mostrar overlay y panel
       this.elementos.overlay.style.display = 'block';
       this.elementos.panel.style.display = 'block';
       
       // Aplicar animaciones
       if (this.configuracion.animaciones) {
           this.elementos.overlay.classList.add('fade-in');
           this.elementos.panel.classList.add('slide-in');
       }
       
       // Cargar notificaciones si es necesario
       if (this.elementos.lista.children.length === 0) {
           this.cargarNotificaciones();
       }
       
       // Enfocar en el buscador si existe
       if (this.elementos.buscador) {
           setTimeout(() => this.elementos.buscador.focus(), 100);
       }

       // Emitir evento
       this.emitirEvento('panel:abierto');
   }

   /**
    * ❌ Cerrar panel de notificaciones
    */
   cerrar() {
       if (!this.estado.abierto) return;

       this.estado.abierto = false;
       
       // Aplicar animaciones de salida
       if (this.configuracion.animaciones) {
           this.elementos.panel.classList.add('slide-out');
           this.elementos.overlay.classList.add('fade-out');
           
           setTimeout(() => {
               this.elementos.overlay.style.display = 'none';
               this.elementos.panel.style.display = 'none';
               this.elementos.panel.classList.remove('slide-out');
               this.elementos.overlay.classList.remove('fade-out');
           }, 300);
       } else {
           this.elementos.overlay.style.display = 'none';
           this.elementos.panel.style.display = 'none';
       }

       // Emitir evento
       this.emitirEvento('panel:cerrado');
   }

   /**
    * 🔄 Toggle del panel
    */
   toggle() {
       if (this.estado.abierto) {
           this.cerrar();
       } else {
           this.abrir();
       }
   }

   // ==========================================
   // MANEJO DE EVENTOS
   // ==========================================

   /**
    * 🖱️ Manejar clic en icono
    */
   manejarClicIcono(e) {
       e.preventDefault();
       e.stopPropagation();
       this.toggle();
   }

   /**
    * 🖱️ Manejar clic fuera del panel
    */
   manejarClicFuera(e) {
       if (this.configuracion.autoOcultar) {
           this.cerrar();
       }
   }

   /**
    * 📜 Manejar scroll de la lista
    */
   manejarScrollLista(e) {
       const lista = e.target;
       const scrollTop = lista.scrollTop;
       const scrollHeight = lista.scrollHeight;
       const clientHeight = lista.clientHeight;
       
       // Cargar más notificaciones cuando se acerca al final
       if (scrollTop + clientHeight >= scrollHeight - 100) {
           this.cargarMasNotificaciones();
       }
   }

   // ==========================================
   // GESTIÓN DE NOTIFICACIONES
   // ==========================================

   /**
    * 📋 Cargar notificaciones
    */
   async cargarNotificaciones(reiniciar = false) {
       try {
           if (reiniciar) {
               this.estado.paginaActual = 1;
               this.elementos.lista.innerHTML = '';
           }

           this.mostrarCargando(true);
           this.ocultarEstados();

           const filtros = this.construirFiltros();
           const datos = await this.servicioNotificaciones.obtenerNotificaciones(filtros);
           
           if (datos.notificaciones && datos.notificaciones.length > 0) {
               this.renderizarNotificaciones(datos.notificaciones, reiniciar);
               this.actualizarContadores(datos);
           } else {
               this.mostrarVacio();
           }

           this.mostrarCargando(false);

       } catch (error) {
           console.error('❌ Error cargando notificaciones:', error);
           this.mostrarError();
           this.mostrarCargando(false);
       }
   }

   /**
    * 📋 Cargar más notificaciones (infinite scroll)
    */
   async cargarMasNotificaciones() {
       if (this.estado.cargando) return;

       try {
           this.estado.paginaActual++;
           this.estado.cargando = true;

           const filtros = this.construirFiltros();
           const datos = await this.servicioNotificaciones.obtenerNotificaciones(filtros);
           
           if (datos.notificaciones && datos.notificaciones.length > 0) {
               this.renderizarNotificaciones(datos.notificaciones, false);
           }

       } catch (error) {
           console.error('❌ Error cargando más notificaciones:', error);
           this.estado.paginaActual--;
       } finally {
           this.estado.cargando = false;
       }
   }

   /**
    * 🎨 Renderizar notificaciones en la lista
    */
   renderizarNotificaciones(notificaciones, reiniciar = false) {
       if (reiniciar) {
           this.elementos.lista.innerHTML = '';
       }

       notificaciones.forEach(notificacion => {
           const elemento = this.crearElementoNotificacion(notificacion);
           this.elementos.lista.appendChild(elemento);
       });

       // Configurar eventos de notificaciones individuales
       this.configurarEventosNotificaciones();
   }

   /**
    * 📄 Crear elemento HTML de notificación individual
    */
   crearElementoNotificacion(notificacion) {
       const div = document.createElement('div');
       div.className = `notificacion-item ${notificacion.visto ? 'leida' : 'no-leida'} prioridad-${notificacion.prioridad}`;
       div.dataset.notificacionId = notificacion.id;
       
       const tipoConfig = this.servicioNotificaciones.config.tipos[notificacion.tipo] || {};
       const fechaFormateada = this.formatearFecha(notificacion.creado_en);
       
       div.innerHTML = `
           <div class="notificacion-checkbox">
               <input type="checkbox" class="form-check-input">
           </div>
           
           <div class="notificacion-icono">
               <i class="fas ${tipoConfig.icono || 'fa-bell'} text-${tipoConfig.color || 'primary'}"></i>
               ${notificacion.prioridad === 'urgente' ? '<span class="badge-urgente"></span>' : ''}
           </div>
           
           <div class="notificacion-contenido">
               <div class="notificacion-header">
                   <h6 class="notificacion-titulo">${notificacion.titulo}</h6>
                   <small class="notificacion-fecha">${fechaFormateada}</small>
               </div>
               
               <p class="notificacion-mensaje">${notificacion.mensaje}</p>
               
               ${notificacion.enlace ? `
                   <a href="${notificacion.enlace}" class="notificacion-enlace">
                       <i class="fas fa-external-link-alt"></i>
                       Ver detalles
                   </a>
               ` : ''}
               
               <div class="notificacion-meta">
                   <span class="badge badge-${tipoConfig.color || 'secondary'} badge-sm">
                       ${tipoConfig.titulo || notificacion.tipo}
                   </span>
                   ${notificacion.prioridad !== 'media' ? `
                       <span class="badge badge-outline-${this.servicioNotificaciones.config.prioridades[notificacion.prioridad]?.color || 'secondary'} badge-sm">
                           ${this.servicioNotificaciones.config.prioridades[notificacion.prioridad]?.etiqueta || notificacion.prioridad}
                       </span>
                   ` : ''}
               </div>
           </div>
           
           <div class="notificacion-acciones">
               <button type="button" class="btn-accion btn-marcar-leida" 
                       title="${notificacion.visto ? 'Marcar como no leída' : 'Marcar como leída'}">
                   <i class="fas ${notificacion.visto ? 'fa-envelope' : 'fa-envelope-open'}"></i>
               </button>
               <button type="button" class="btn-accion btn-archivar" title="Archivar">
                   <i class="fas fa-archive"></i>
               </button>
               <button type="button" class="btn-accion btn-eliminar" title="Eliminar">
                   <i class="fas fa-trash"></i>
               </button>
           </div>
       `;
       
       return div;
   }

   /**
    * ⚙️ Configurar eventos de notificaciones individuales
    */
   configurarEventosNotificaciones() {
       // Eventos de marcar como leída
       this.elementos.lista.querySelectorAll('.btn-marcar-leida').forEach(btn => {
           btn.addEventListener('click', (e) => {
               e.stopPropagation();
               const notificacionId = e.target.closest('.notificacion-item').dataset.notificacionId;
               this.toggleLeidaNotificacion(notificacionId);
           });
       });

       // Eventos de archivar
       this.elementos.lista.querySelectorAll('.btn-archivar').forEach(btn => {
           btn.addEventListener('click', (e) => {
               e.stopPropagation();
               const notificacionId = e.target.closest('.notificacion-item').dataset.notificacionId;
               this.archivarNotificacion(notificacionId);
           });
       });

       // Eventos de eliminar
       this.elementos.lista.querySelectorAll('.btn-eliminar').forEach(btn => {
           btn.addEventListener('click', (e) => {
               e.stopPropagation();
               const notificacionId = e.target.closest('.notificacion-item').dataset.notificacionId;
               this.eliminarNotificacion(notificacionId);
           });
       });

       // Eventos de checkbox
       this.elementos.lista.querySelectorAll('.notificacion-checkbox input').forEach(checkbox => {
           checkbox.addEventListener('change', () => {
               this.actualizarAccionesMasivas();
           });
       });

       // Eventos de clic en notificación
       this.elementos.lista.querySelectorAll('.notificacion-item').forEach(item => {
           item.addEventListener('click', (e) => {
               if (!e.target.closest('.notificacion-acciones') && 
                   !e.target.closest('.notificacion-checkbox')) {
                   this.abrirNotificacion(item.dataset.notificacionId);
               }
           });
       });
   }

   // ==========================================
   // ACCIONES DE NOTIFICACIONES
   // ==========================================

   /**
    * ✅ Toggle estado leída/no leída
    */
   async toggleLeidaNotificacion(notificacionId) {
       try {
           await this.servicioNotificaciones.marcarComoLeida(notificacionId);
           
           const elemento = this.elementos.lista.querySelector(`[data-notificacion-id="${notificacionId}"]`);
           if (elemento) {
               elemento.classList.toggle('leida');
               elemento.classList.toggle('no-leida');
               
               const btn = elemento.querySelector('.btn-marcar-leida i');
               btn.className = elemento.classList.contains('leida') ? 
                   'fas fa-envelope' : 'fas fa-envelope-open';
           }

       } catch (error) {
           console.error('❌ Error cambiando estado de notificación:', error);
           Utilidades.mostrarNotificacion('error', 'Error al actualizar notificación');
       }
   }

   /**
    * ✅ Marcar todas como leídas
    */
   async marcarTodasComoLeidas() {
       try {
           await this.servicioNotificaciones.marcarTodasComoLeidas();
           
           // Actualizar UI
           this.elementos.lista.querySelectorAll('.notificacion-item').forEach(item => {
               item.classList.remove('no-leida');
               item.classList.add('leida');
               
               const btn = item.querySelector('.btn-marcar-leida i');
               btn.className = 'fas fa-envelope';
           });

           this.actualizarContador(0);
           Utilidades.mostrarNotificacion('success', 'Todas las notificaciones marcadas como leídas');

       } catch (error) {
           console.error('❌ Error marcando todas como leídas:', error);
           Utilidades.mostrarNotificacion('error', 'Error al marcar notificaciones');
       }
   }

   /**
    * 🗑️ Eliminar notificación
    */
   async eliminarNotificacion(notificacionId) {
       try {
           const confirmacion = await Swal.fire({
               title: '¿Eliminar notificación?',
               text: 'Esta acción no se puede deshacer',
               icon: 'warning',
               showCancelButton: true,
               confirmButtonText: 'Eliminar',
               cancelButtonText: 'Cancelar'
           });

           if (confirmacion.isConfirmed) {
               await this.servicioNotificaciones.eliminarNotificacion(notificacionId);
               
               const elemento = this.elementos.lista.querySelector(`[data-notificacion-id="${notificacionId}"]`);
               if (elemento) {
                   elemento.remove();
               }

               Utilidades.mostrarNotificacion('success', 'Notificación eliminada');
           }

       } catch (error) {
           console.error('❌ Error eliminando notificación:', error);
           Utilidades.mostrarNotificacion('error', 'Error al eliminar notificación');
       }
   }

   /**
    * 📦 Archivar notificación
    */
   async archivarNotificacion(notificacionId) {
       try {
           await this.servicioNotificaciones.archivarNotificacion(notificacionId);
           
           const elemento = this.elementos.lista.querySelector(`[data-notificacion-id="${notificacionId}"]`);
           if (elemento) {
               elemento.classList.add('archivada');
               setTimeout(() => elemento.remove(), 500);
           }

           Utilidades.mostrarNotificacion('success', 'Notificación archivada');

       } catch (error) {
           console.error('❌ Error archivando notificación:', error);
           Utilidades.mostrarNotificacion('error', 'Error al archivar notificación');
       }
   }

   // ==========================================
   // MÉTODOS AUXILIARES
   // ==========================================

   /**
    * 🔄 Actualizar contador de notificaciones
    */
   actualizarContador(cantidad) {
       if (this.elementos.contador) {
           this.elementos.contador.textContent = cantidad > 99 ? '99+' : cantidad.toString();
           this.elementos.contador.style.display = cantidad > 0 ? 'block' : 'none';
       }
   }

   /**
    * 📊 Actualizar contadores en tabs
    */
   actualizarContadores(datos) {
       if (this.elementos.filtrosTabs) {
           this.elementos.filtrosTabs.forEach(tab => {
               const badge = tab.querySelector('.badge');
               const filtro = tab.dataset.filtro;
               
               let cantidad = 0;
               switch (filtro) {
                   case 'todas':
                       cantidad = datos.total || 0;
                       break;
                   case 'no_leidas':
                       cantidad = datos.no_leidas || 0;
                       break;
                   case 'importantes':
                       cantidad = datos.importantes || 0;
                       break;
               }
               
               badge.textContent = cantidad;
           });
       }

       if (this.elementos.totalNotificaciones) {
           const noLeidas = datos.no_leidas || 0;
           this.elementos.totalNotificaciones.textContent = 
               noLeidas === 0 ? 'Todas leídas' : `${noLeidas} nueva${noLeidas === 1 ? '' : 's'}`;
       }
   }

   /**
    * 📅 Formatear fecha de notificación
    */
   formatearFecha(fecha) {
       return Utilidades.formatearFechaRelativa(fecha);
   }

   /**
    * 🔍 Construir filtros para la consulta
    */
   construirFiltros() {
       const filtros = {
           limit: this.estado.notificacionesPorPagina,
           offset: (this.estado.paginaActual - 1) * this.estado.notificacionesPorPagina
       };

       switch (this.estado.filtroActual) {
           case 'no_leidas':
               filtros.visto = false;
               break;
           case 'importantes':
               filtros.prioridad = ['alta', 'urgente'];
               break;
       }

       if (this.estado.terminoBusqueda) {
           filtros.busqueda = this.estado.terminoBusqueda;
       }

       return filtros;
   }

   /**
    * 📡 Emitir evento
    */
   emitirEvento(tipo, datos = {}) {
       if (window.aplicacion) {
           window.aplicacion.emitirEvento(`centroNotificaciones:${tipo}`, datos);
       }
   }

   /**
    * 🎯 Configurar listeners del servicio
    */
   configurarListenersServicio() {
       if (window.aplicacion) {
           window.aplicacion.escucharEvento('notificaciones:nueva', this.manejarNuevaNotificacion);
           window.aplicacion.escucharEvento('notificaciones:leida', this.manejarNotificacionLeida);
       }
   }

   /**
    * 🆕 Manejar nueva notificación
    */
   manejarNuevaNotificacion(event) {
       const notificacion = event.detail;
       
       // Agregar al inicio de la lista si el panel está abierto
       if (this.estado.abierto && this.estado.filtroActual === 'todas') {
           const elemento = this.crearElementoNotificacion(notificacion);
           this.elementos.lista.insertBefore(elemento, this.elementos.lista.firstChild);
           this.configurarEventosNotificaciones();
       }

       // Actualizar contador
       const noLeidas = this.servicioNotificaciones.obtenerContadorNoLeidas();
       this.actualizarContador(noLeidas);
   }

   /**
    * ✅ Manejar notificación leída
    */
   manejarNotificacionLeida(event) {
       const { id } = event.detail;
       
       const elemento = this.elementos.lista.querySelector(`[data-notificacion-id="${id}"]`);
       if (elemento) {
           elemento.classList.remove('no-leida');
           elemento.classList.add('leida');
       }

       // Actualizar contador
       const noLeidas = this.servicioNotificaciones.obtenerContadorNoLeidas();
       this.actualizarContador(noLeidas);
   }

   // Estados de UI
   mostrarCargando(mostrar) {
       this.elementos.cargando.style.display = mostrar ? 'block' : 'none';
   }

   mostrarVacio() {
       this.elementos.vacio.style.display = 'block';
       this.elementos.lista.style.display = 'none';
   }

   mostrarError() {
       this.elementos.error.style.display = 'block';
       this.elementos.lista.style.display = 'none';
   }

   ocultarEstados() {
       this.elementos.vacio.style.display = 'none';
       this.elementos.error.style.display = 'none';
       this.elementos.lista.style.display = 'block';
   }

   cambiarFiltro(filtro) {
       this.estado.filtroActual = filtro;
       this.estado.paginaActual = 1;
       
       // Actualizar UI de tabs
       this.elementos.filtrosTabs.forEach(tab => {
           tab.classList.toggle('active', tab.dataset.filtro === filtro);
       });
       
       this.cargarNotificaciones(true);
   }

   filtrarNotificaciones() {
       clearTimeout(this.timeoutBusqueda);
       this.timeoutBusqueda = setTimeout(() => {
           this.estado.paginaActual = 1;
           this.cargarNotificaciones(true);
       }, 500);
   }

   toggleFiltrosAvanzados() {
       const avanzados = this.elementos.filtrosAvanzados;
       const visible = avanzados.style.display !== 'none';
       avanzados.style.display = visible ? 'none' : 'block';
   }

   seleccionarTodas() {
       const checkboxes = this.elementos.lista.querySelectorAll('.notificacion-checkbox input');
       const seleccionar = this.elementos.btnSeleccionarTodas.textContent.includes('Seleccionar');
       
       checkboxes.forEach(checkbox => {
           checkbox.checked = seleccionar;
       });
       
       this.elementos.btnSeleccionarTodas.textContent = seleccionar ? 
           'Deseleccionar todas' : 'Seleccionar todas';
       
       this.actualizarAccionesMasivas();
   }

   actualizarAccionesMasivas() {
       const seleccionadas = this.elementos.lista.querySelectorAll('.notificacion-checkbox input:checked');
       const cantidad = seleccionadas.length;
       
       this.elementos.btnEliminarSeleccionadas.disabled = cantidad === 0;
       this.elementos.btnArchivarSeleccionadas.disabled = cantidad === 0;
   }

   async eliminarSeleccionadas() {
       const seleccionadas = Array.from(this.elementos.lista.querySelectorAll('.notificacion-checkbox input:checked'))
           .map(cb => cb.closest('.notificacion-item').dataset.notificacionId);
       
       if (seleccionadas.length === 0) return;

       const confirmacion = await Swal.fire({
           title: `¿Eliminar ${seleccionadas.length} notificaciones?`,
           text: 'Esta acción no se puede deshacer',
           icon: 'warning',
           showCancelButton: true,
           confirmButtonText: 'Eliminar',
           cancelButtonText: 'Cancelar'
       });

       if (confirmacion.isConfirmed) {
           for (const id of seleccionadas) {
               try {
                   await this.servicioNotificaciones.eliminarNotificacion(id);
                   const elemento = this.elementos.lista.querySelector(`[data-notificacion-id="${id}"]`);
                   if (elemento) elemento.remove();
               } catch (error) {
                   console.error('Error eliminando notificación:', id, error);
               }
           }
           
           Utilidades.mostrarNotificacion('success', `${seleccionadas.length} notificaciones eliminadas`);
       }
   }

   async archivarSeleccionadas() {
       const seleccionadas = Array.from(this.elementos.lista.querySelectorAll('.notificacion-checkbox input:checked'))
           .map(cb => cb.closest('.notificacion-item').dataset.notificacionId);
       
       if (seleccionadas.length === 0) return;

       for (const id of seleccionadas) {
           try {
               await this.servicioNotificaciones.archivarNotificacion(id);
               const elemento = this.elementos.lista.querySelector(`[data-notificacion-id="${id}"]`);
               if (elemento) {
                   elemento.classList.add('archivada');
                   setTimeout(() => elemento.remove(), 500);
               }
           } catch (error) {
               console.error('Error archivando notificación:', id, error);
           }
       }
       
       Utilidades.mostrarNotificacion('success', `${seleccionadas.length} notificaciones archivadas`);
   }

   paginaAnterior() {
       if (this.estado.paginaActual > 1) {
           this.estado.paginaActual--;
           this.cargarNotificaciones(true);
       }
   }

   paginaSiguiente() {
       this.estado.paginaActual++;
       this.cargarNotificaciones(true);
   }

   abrirNotificacion(notificacionId) {
       // Implementar navegación a la notificación específica
       console.log('Abrir notificación:', notificacionId);
   }

   abrirConfiguracion() {
       // Implementar modal de configuración
       console.log('Abrir configuración de notificaciones');
   }

   /**
    * 🧹 Destruir el componente
    */
   destruir() {
       // Remover listeners
       if (this.elementos.icono) {
           this.elementos.icono.removeEventListener('click', this.manejarClicIcono);
       }

       // Remover elementos del DOM
       if (this.elementos.panel) {
           this.elementos.panel.remove();
       }
       if (this.elementos.overlay) {
           this.elementos.overlay.remove();
       }

       // Limpiar referencias
       this.elementos = {};
       this.estado = {};
   }
}

// ==========================================
// INICIALIZACIÓN GLOBAL
// ==========================================

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
   module.exports = ComponenteCentroNotificaciones;
}