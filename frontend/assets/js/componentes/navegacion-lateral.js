/**
 * 📌 COMPONENTE NAVEGACIÓN LATERAL
 * Sistema Portafolio Docente UNSAAC
 * 
 * Componente para menú lateral dinámico según rol
 * Incluye navegación colapsable, búsqueda y estado persistente
 */

class ComponenteNavegacionLateral {
   constructor() {
       this.contenedor = null;
       this.elementosDOM = {};
       this.rolActual = null;
       this.menuItems = [];
       this.estado = {
           colapsado: false,
           itemsExpandidos: new Set(),
           rutaActiva: window.location.pathname,
           busquedaActiva: false
       };

       // Configuración del componente
       this.config = {
           animacionDuracion: 300,
           persistirEstado: true,
           busquedaMinCaracteres: 2,
           destacarRutaActiva: true
       };

       this.inicializar();
   }

   /**
    * 🚀 Inicializar componente
    */
   async inicializar() {
       try {
           console.log('📌 Inicializando navegación lateral...');

           // Encontrar contenedor
           this.contenedor = document.querySelector('.navegacion-lateral, #navegacion-lateral, .sidebar');
           
           if (!this.contenedor) {
               console.warn('⚠️ No se encontró contenedor para navegación lateral');
               return;
           }

           // Restaurar estado guardado
           this.restaurarEstado();

           // Renderizar estructura inicial
           await this.renderizar();

           // Configurar eventos
           this.configurarEventos();

           // Cargar menú según rol actual
           await this.cargarMenuPorRol();

           console.log('✅ Navegación lateral inicializada correctamente');

       } catch (error) {
           console.error('❌ Error al inicializar navegación lateral:', error);
       }
   }

   /**
    * 🎨 Renderizar estructura HTML
    */
   async renderizar() {
       const html = `
           <div class="sidebar bg-dark d-flex flex-column h-100" id="sidebar-principal">
               <!-- Header del sidebar -->
               <div class="sidebar-header p-3 border-bottom border-secondary">
                   <div class="d-flex align-items-center justify-content-between">
                       <div class="sidebar-brand d-flex align-items-center">
                           <img src="/assets/imagenes/logos/logo-unsaac.png" 
                                alt="UNSAAC" 
                                height="32" 
                                class="me-2 sidebar-logo">
                           <div class="sidebar-title">
                               <h6 class="mb-0 text-light">Portafolio</h6>
                               <small class="text-muted">UNSAAC</small>
                           </div>
                       </div>
                       <button class="btn btn-sm btn-outline-light d-lg-none" 
                               id="btn-toggle-sidebar"
                               title="Mostrar/Ocultar menú">
                           <i class="fas fa-bars"></i>
                       </button>
                   </div>
               </div>

               <!-- Búsqueda en el menú -->
               <div class="sidebar-search p-3 border-bottom border-secondary">
                   <div class="input-group input-group-sm">
                       <input type="text" 
                              class="form-control bg-secondary border-0 text-light" 
                              placeholder="Buscar en menú..." 
                              id="busqueda-menu">
                       <button class="btn btn-outline-light" type="button" id="btn-limpiar-busqueda">
                           <i class="fas fa-times"></i>
                       </button>
                   </div>
                   <div class="search-results mt-2 d-none" id="resultados-busqueda">
                       <!-- Resultados de búsqueda -->
                   </div>
               </div>

               <!-- Información del rol actual -->
               <div class="sidebar-role p-3 bg-primary bg-opacity-10 border-bottom border-secondary">
                   <div class="d-flex align-items-center">
                       <div class="role-icon me-2">
                           <i class="fas fa-user-tag text-primary"></i>
                       </div>
                       <div class="role-info">
                           <small class="text-muted d-block">Rol activo</small>
                           <span class="text-light fw-bold" id="rol-actual-sidebar">Cargando...</span>
                       </div>
                   </div>
               </div>

               <!-- Navegación principal -->
               <nav class="sidebar-nav flex-grow-1 p-0" id="navegacion-menu">
                   <ul class="nav nav-pills flex-column" id="menu-principal">
                       <!-- Items del menú se cargan dinámicamente -->
                       <li class="nav-item p-2">
                           <div class="text-center text-muted">
                               <div class="spinner-border spinner-border-sm" role="status">
                                   <span class="visually-hidden">Cargando...</span>
                               </div>
                               <p class="small mt-2 mb-0">Cargando menú...</p>
                           </div>
                       </li>
                   </ul>
               </nav>

               <!-- Acciones rápidas -->
               <div class="sidebar-quick-actions p-3 border-top border-secondary">
                   <h6 class="text-muted small mb-2">ACCESOS RÁPIDOS</h6>
                   <div class="d-flex gap-2" id="accesos-rapidos">
                       <!-- Se cargan dinámicamente -->
                   </div>
               </div>

               <!-- Footer del sidebar -->
               <div class="sidebar-footer p-3 border-top border-secondary">
                   <div class="d-flex justify-content-between align-items-center">
                       <small class="text-muted">
                           <i class="fas fa-clock me-1"></i>
                           <span id="ultima-actualizacion">Ahora</span>
                       </small>
                       <div class="sidebar-controls">
                           <button class="btn btn-sm btn-outline-light" 
                                   id="btn-colapsar-sidebar"
                                   title="Colapsar menú">
                               <i class="fas fa-chevron-left"></i>
                           </button>
                       </div>
                   </div>
               </div>

               <!-- Overlay para móvil -->
               <div class="sidebar-overlay d-lg-none" id="sidebar-overlay"></div>
           </div>
       `;

       this.contenedor.innerHTML = html;
       this.mapearElementosDOM();
   }

   /**
    * 🎯 Mapear elementos DOM
    */
   mapearElementosDOM() {
       this.elementosDOM = {
           // Contenedores principales
           sidebarPrincipal: $('#sidebar-principal'),
           
           // Header
           sidebarLogo: $('.sidebar-logo'),
           sidebarTitle: $('.sidebar-title'),
           btnToggleSidebar: $('#btn-toggle-sidebar'),
           
           // Búsqueda
           busquedaMenu: $('#busqueda-menu'),
           btnLimpiarBusqueda: $('#btn-limpiar-busqueda'),
           resultadosBusqueda: $('#resultados-busqueda'),
           
           // Información de rol
           rolActualSidebar: $('#rol-actual-sidebar'),
           
           // Navegación
           menuPrincipal: $('#menu-principal'),
           
           // Accesos rápidos
           accesosRapidos: $('#accesos-rapidos'),
           
           // Footer
           ultimaActualizacion: $('#ultima-actualizacion'),
           btnColapsarSidebar: $('#btn-colapsar-sidebar'),
           
           // Overlay
           sidebarOverlay: $('#sidebar-overlay')
       };
   }

   /**
    * 🔧 Configurar eventos
    */
   configurarEventos() {
       // Toggle del sidebar (móvil)
       if (this.elementosDOM.btnToggleSidebar) {
           this.elementosDOM.btnToggleSidebar.addEventListener('click', () => {
               this.toggleSidebar();
           });
       }

       // Colapsar sidebar (desktop)
       if (this.elementosDOM.btnColapsarSidebar) {
           this.elementosDOM.btnColapsarSidebar.addEventListener('click', () => {
               this.toggleColapsar();
           });
       }

       // Overlay para cerrar en móvil
       if (this.elementosDOM.sidebarOverlay) {
           this.elementosDOM.sidebarOverlay.addEventListener('click', () => {
               this.cerrarSidebar();
           });
       }

       // Búsqueda en el menú
       if (this.elementosDOM.busquedaMenu) {
           this.elementosDOM.busquedaMenu.addEventListener('input', 
               Utils.Performance.debounce((e) => this.buscarEnMenu(e.target.value), 300)
           );
       }

       // Limpiar búsqueda
       if (this.elementosDOM.btnLimpiarBusqueda) {
           this.elementosDOM.btnLimpiarBusqueda.addEventListener('click', () => {
               this.limpiarBusqueda();
           });
       }

       // Eventos del menú principal
       if (this.elementosDOM.menuPrincipal) {
           this.elementosDOM.menuPrincipal.addEventListener('click', (e) => {
               this.manejarClickMenu(e);
           });
       }

       // Eventos del sistema de autenticación
       if (window.auth) {
           window.auth.addEventListener('cambioRol', (data) => {
               this.onCambioRol(data);
           });
       }

       // Responsive - cambios de tamaño de pantalla
       window.addEventListener('resize', Utils.Performance.throttle(() => {
           this.ajustarResponsive();
       }, 100));

       // Teclas de acceso rápido
       document.addEventListener('keydown', (e) => {
           this.manejarTeclasRapidas(e);
       });
   }

   /**
    * 📊 Cargar menú por rol
    */
   async cargarMenuPorRol() {
       try {
           // Obtener rol actual
           if (window.auth && window.auth.estaAutenticado()) {
               const datosUsuario = window.auth.obtenerUsuario();
               this.rolActual = datosUsuario.rolActual;
               
               // Actualizar información del rol
               this.actualizarInformacionRol(this.rolActual);
               
               // Cargar estructura del menú
               this.menuItems = this.obtenerEstructuraMenu(this.rolActual);
               
               // Renderizar menú
               this.renderizarMenu();
               
               // Cargar accesos rápidos
               await this.cargarAccesosRapidos();
               
               // Destacar ruta activa
               this.destacarRutaActiva();
               
               // Actualizar timestamp
               this.actualizarTimestamp();
           }

       } catch (error) {
           console.error('❌ Error al cargar menú por rol:', error);
           this.mostrarErrorCarga();
       }
   }

   /**
    * 🎭 Actualizar información del rol
    */
   actualizarInformacionRol(rol) {
       if (!this.elementosDOM.rolActualSidebar) return;

       const nombreRol = this.formatearNombreRol(rol);
       this.elementosDOM.rolActualSidebar.textContent = nombreRol;
   }

   /**
    * 📋 Obtener estructura del menú por rol
    */
   obtenerEstructuraMenu(rol) {
       const estructuras = {
           administrador: [
               {
                   id: 'dashboard-admin',
                   titulo: 'Dashboard',
                   icono: 'fas fa-tachometer-alt',
                   url: '/paginas/administrador/tablero.html',
                   activo: this.esRutaActiva('/administrador/tablero'),
                   descripcion: 'Panel principal de administración'
               },
               {
                   id: 'gestion-usuarios',
                   titulo: 'Gestión de Usuarios',
                   icono: 'fas fa-users',
                   expandible: true,
                   items: [
                       {
                           titulo: 'Usuarios',
                           icono: 'fas fa-user',
                           url: '/paginas/administrador/usuarios.html',
                           activo: this.esRutaActiva('/administrador/usuarios')
                       },
                       {
                           titulo: 'Roles',
                           icono: 'fas fa-user-tag',
                           url: '/paginas/administrador/asignaciones.html',
                           activo: this.esRutaActiva('/administrador/asignaciones')
                       },
                       {
                           titulo: 'Verificadores',
                           icono: 'fas fa-user-check',
                           url: '/paginas/administrador/verificadores.html',
                           activo: this.esRutaActiva('/administrador/verificadores')
                       }
                   ]
               },
               {
                   id: 'gestion-academica',
                   titulo: 'Gestión Académica',
                   icono: 'fas fa-graduation-cap',
                   expandible: true,
                   items: [
                       {
                           titulo: 'Ciclos Académicos',
                           icono: 'fas fa-calendar-alt',
                           url: '/paginas/administrador/ciclos-academicos.html',
                           activo: this.esRutaActiva('/administrador/ciclos')
                       },
                       {
                           titulo: 'Asignaturas',
                           icono: 'fas fa-book',
                           url: '/paginas/administrador/asignaturas.html',
                           activo: this.esRutaActiva('/administrador/asignaturas')
                       },
                       {
                           titulo: 'Carga Excel',
                           icono: 'fas fa-file-excel',
                           url: '/paginas/administrador/carga-excel.html',
                           activo: this.esRutaActiva('/administrador/carga-excel')
                       }
                   ]
               },
               {
                   id: 'reportes-admin',
                   titulo: 'Reportes y Estadísticas',
                   icono: 'fas fa-chart-bar',
                   url: '/paginas/administrador/reportes.html',
                   activo: this.esRutaActiva('/administrador/reportes'),
                   badge: 'Nuevo'
               },
               {
                   id: 'configuracion-admin',
                   titulo: 'Configuración',
                   icono: 'fas fa-cogs',
                   url: '/paginas/administrador/configuracion.html',
                   activo: this.esRutaActiva('/administrador/configuracion')
               }
           ],
           verificador: [
               {
                   id: 'dashboard-verificador',
                   titulo: 'Dashboard',
                   icono: 'fas fa-tachometer-alt',
                   url: '/paginas/verificador/tablero.html',
                   activo: this.esRutaActiva('/verificador/tablero')
               },
               {
                   id: 'revision-documentos',
                   titulo: 'Revisión de Documentos',
                   icono: 'fas fa-clipboard-check',
                   expandible: true,
                   items: [
                       {
                           titulo: 'Cola de Revisión',
                           icono: 'fas fa-list-ul',
                           url: '/paginas/verificador/cola-revision.html',
                           activo: this.esRutaActiva('/verificador/cola'),
                           badge: this.obtenerPendientesRevision()
                       },
                       {
                           titulo: 'Revisar Documentos',
                           icono: 'fas fa-search',
                           url: '/paginas/verificador/revisar.html',
                           activo: this.esRutaActiva('/verificador/revisar')
                       },
                       {
                           titulo: 'Crear Observación',
                           icono: 'fas fa-comment-alt',
                           url: '/paginas/verificador/crear-observacion.html',
                           activo: this.esRutaActiva('/verificador/crear-observacion')
                       }
                   ]
               },
               {
                   id: 'estadisticas-verificador',
                   titulo: 'Estadísticas',
                   icono: 'fas fa-chart-line',
                   url: '/paginas/verificador/estadisticas.html',
                   activo: this.esRutaActiva('/verificador/estadisticas')
               }
           ],
           docente: [
               {
                   id: 'dashboard-docente',
                   titulo: 'Dashboard',
                   icono: 'fas fa-tachometer-alt',
                   url: '/paginas/docente/tablero.html',
                   activo: this.esRutaActiva('/docente/tablero')
               },
               {
                   id: 'portafolios-docente',
                   titulo: 'Mis Portafolios',
                   icono: 'fas fa-folder-open',
                   expandible: true,
                   items: [
                       {
                           titulo: 'Ver Portafolios',
                           icono: 'fas fa-eye',
                           url: '/paginas/docente/mis-portafolios.html',
                           activo: this.esRutaActiva('/docente/portafolios')
                       },
                       {
                           titulo: 'Explorador',
                           icono: 'fas fa-sitemap',
                           url: '/paginas/docente/explorador.html',
                           activo: this.esRutaActiva('/docente/explorador')
                       }
                   ]
               },
               {
                   id: 'documentos-docente',
                   titulo: 'Gestión de Documentos',
                   icono: 'fas fa-file-alt',
                   expandible: true,
                   items: [
                       {
                           titulo: 'Subir Documentos',
                           icono: 'fas fa-cloud-upload-alt',
                           url: '/paginas/docente/subir.html',
                           activo: this.esRutaActiva('/docente/subir')
                       },
                       {
                           titulo: 'Observaciones',
                           icono: 'fas fa-comments',
                           url: '/paginas/docente/observaciones.html',
                           activo: this.esRutaActiva('/docente/observaciones'),
                           badge: this.obtenerObservacionesPendientes()
                       }
                   ]
               },
               {
                   id: 'progreso-docente',
                   titulo: 'Mi Progreso',
                   icono: 'fas fa-chart-pie',
                   url: '/paginas/docente/progreso.html',
                   activo: this.esRutaActiva('/docente/progreso')
               }
           ]
       };

       return estructuras[rol] || [];
   }

   /**
    * 🎨 Renderizar menú completo
    */
   renderizarMenu() {
       if (!this.elementosDOM.menuPrincipal) return;

       let html = '';

       this.menuItems.forEach(item => {
           html += this.renderizarItemMenu(item);
       });

       this.elementosDOM.menuPrincipal.innerHTML = html;
       
       // Expandir items que estaban abiertos
       this.restaurarItemsExpandidos();
   }

   /**
    * 🎨 Renderizar item individual del menú
    */
   renderizarItemMenu(item, nivel = 0) {
       const esExpandible = item.expandible && item.items && item.items.length > 0;
       const estaExpandido = this.estado.itemsExpandidos.has(item.id);
       const claseActivo = item.activo ? 'active' : '';
       const clasePadding = nivel > 0 ? `ps-${3 + nivel}` : 'ps-3';

       let html = `
           <li class="nav-item" data-item-id="${item.id}">
               <a class="nav-link d-flex align-items-center ${clasePadding} ${claseActivo} ${esExpandible ? 'expandible' : ''}" 
                  href="${item.url || '#'}" 
                  ${esExpandible ? 'data-bs-toggle="collapse" data-bs-target="#submenu-' + item.id + '"' : ''}
                  title="${item.descripcion || item.titulo}">
                   
                   <i class="${item.icono} me-2 nav-icon"></i>
                   
                   <span class="nav-text">${item.titulo}</span>
                   
                   ${item.badge ? `<span class="badge bg-primary ms-auto">${item.badge}</span>` : ''}
                   
                   ${esExpandible ? `<i class="fas fa-chevron-${estaExpandido ? 'down' : 'right'} ms-auto expand-icon"></i>` : ''}
               </a>
       `;

       // Agregar submenú si es expandible
       if (esExpandible) {
           html += `
               <div class="collapse ${estaExpandido ? 'show' : ''}" id="submenu-${item.id}">
                   <ul class="nav nav-pills flex-column">
           `;

           item.items.forEach(subItem => {
               html += this.renderizarItemMenu(subItem, nivel + 1);
           });

           html += `
                   </ul>
               </div>
           `;
       }

       html += '</li>';

       return html;
   }

   /**
    * ⚡ Cargar accesos rápidos
    */
   async cargarAccesosRapidos() {
       if (!this.elementosDOM.accesosRapidos) return;

       const accesos = this.obtenerAccesosRapidosPorRol(this.rolActual);
       
       let html = '';
       accesos.forEach(acceso => {
           html += `
               <button class="btn btn-sm btn-outline-light flex-fill" 
                       onclick="window.location.href='${acceso.url}'"
                       title="${acceso.descripcion}">
                   <i class="${acceso.icono}"></i>
                   <span class="d-none d-md-inline ms-1">${acceso.texto}</span>
               </button>
           `;
       });

       this.elementosDOM.accesosRapidos.innerHTML = html;
   }

   /**
    * ⚡ Obtener accesos rápidos por rol
    */
   obtenerAccesosRapidosPorRol(rol) {
       const accesos = {
           administrador: [
               { texto: 'Usuarios', icono: 'fas fa-plus', url: '/paginas/administrador/usuarios.html', descripcion: 'Crear nuevo usuario' },
               { texto: 'Excel', icono: 'fas fa-file-excel', url: '/paginas/administrador/carga-excel.html', descripcion: 'Cargar datos desde Excel' }
           ],
           verificador: [
               { texto: 'Revisar', icono: 'fas fa-check', url: '/paginas/verificador/cola-revision.html', descripcion: 'Revisar documentos pendientes' },
               { texto: 'Observar', icono: 'fas fa-comment', url: '/paginas/verificador/crear-observacion.html', descripcion: 'Crear observación' }
           ],
           docente: [
               { texto: 'Subir', icono: 'fas fa-upload', url: '/paginas/docente/subir.html', descripcion: 'Subir documento' },
               { texto: 'Progreso', icono: 'fas fa-chart-line', url: '/paginas/docente/progreso.html', descripcion: 'Ver mi progreso' }
           ]
       };

       return accesos[rol] || [];
   }

   /**
    * 🔍 Buscar en el menú
    */
   buscarEnMenu(termino) {
       if (!termino || termino.length < this.config.busquedaMinCaracteres) {
           this.limpiarBusqueda();
           return;
       }

       const resultados = this.buscarItemsMenu(this.menuItems, termino.toLowerCase());
       this.mostrarResultadosBusqueda(resultados, termino);
   }

   /**
    * 🔍 Buscar items en la estructura del menú
    */
   buscarItemsMenu(items, termino, resultados = []) {
       items.forEach(item => {
           // Buscar en el título y descripción
           if (item.titulo.toLowerCase().includes(termino) || 
               (item.descripcion && item.descripcion.toLowerCase().includes(termino))) {
               resultados.push({
                   ...item,
                   highlightedTitle: this.resaltarTermino(item.titulo, termino)
               });
           }

           // Buscar en subitems
           if (item.items && item.items.length > 0) {
               this.buscarItemsMenu(item.items, termino, resultados);
           }
       });

       return resultados;
   }

   /**
    * 🎨 Mostrar resultados de búsqueda
    */
   mostrarResultadosBusqueda(resultados, termino) {
       if (!this.elementosDOM.resultadosBusqueda) return;

       if (resultados.length === 0) {
           this.elementosDOM.resultadosBusqueda.innerHTML = `
               <div class="search-result p-2 text-center text-muted">
                   <small>No se encontraron resultados para "${termino}"</small>
               </div>
           `;
       } else {
           let html = '';
           resultados.slice(0, 5).forEach(resultado => {
               html += `
                   <a href="${resultado.url}" 
                      class="search-result d-block p-2 text-decoration-none text-light border-bottom border-secondary">
                       <i class="${resultado.icono} me-2"></i>
                       <span>${resultado.highlightedTitle}</span>
                       ${resultado.descripcion ? `<small class="d-block text-muted">${resultado.descripcion}</small>` : ''}
                   </a>
               `;
           });

           if (resultados.length > 5) {
               html += `
                   <div class="search-result p-2 text-center">
                       <small class="text-muted">y ${resultados.length - 5} resultados más...</small>
                   </div>
               `;
           }

           this.elementosDOM.resultadosBusqueda.innerHTML = html;
       }

       this.elementosDOM.resultadosBusqueda.classList.remove('d-none');
       this.estado.busquedaActiva = true;
   }

   /**
    * 🧹 Limpiar búsqueda
    */
   limpiarBusqueda() {
       if (this.elementosDOM.busquedaMenu) {
           this.elementosDOM.busquedaMenu.value = '';
       }
       
       if (this.elementosDOM.resultadosBusqueda) {
           this.elementosDOM.resultadosBusqueda.classList.add('d-none');
       }

       this.estado.busquedaActiva = false;
   }

   /**
    * 🖱️ Manejar clicks en el menú
    */
   manejarClickMenu(e) {
       const enlace = e.target.closest('.nav-link');
       if (!enlace) return;

       // Si es expandible, manejar expansión
       if (enlace.classList.contains('expandible')) {
           e.preventDefault();
           const itemId = enlace.closest('[data-item-id]').dataset.itemId;
           this.toggleExpandirItem(itemId);
           return;
       }

       // Si tiene URL, navegar
       const url = enlace.getAttribute('href');
       if (url && url !== '#') {
           // En móvil, cerrar sidebar después de navegar
           if (window.innerWidth < 992) {
               setTimeout(() => this.cerrarSidebar(), 100);
           }
       }
   }

   /**
    * 🔄 Toggle expandir/contraer item
    */
   toggleExpandirItem(itemId) {
       const submenu = document.querySelector(`#submenu-${itemId}`);
       const expandIcon = document.querySelector(`[data-item-id="${itemId}"] .expand-icon`);
       
       if (!submenu || !expandIcon) return;

       const estaExpandido = this.estado.itemsExpandidos.has(itemId);

       if (estaExpandido) {
           this.estado.itemsExpandidos.delete(itemId);
           expandIcon.className = expandIcon.className.replace('fa-chevron-down', 'fa-chevron-right');
       } else {
           this.estado.itemsExpandidos.add(itemId);
           expandIcon.className = expandIcon.className.replace('fa-chevron-right', 'fa-chevron-down');
       }

       // Usar Bootstrap collapse
       const bsCollapse = new bootstrap.Collapse(submenu, {
           toggle: true
       });

       // Guardar estado
       if (this.config.persistirEstado) {
           this.guardarEstado();
       }
   }

   /**
    * 📱 Toggle sidebar (móvil)
    */
   toggleSidebar() {
       if (this.elementosDOM.sidebarPrincipal) {
           this.elementosDOM.sidebarPrincipal.classList.toggle('show');
           
           if (this.elementosDOM.sidebarOverlay) {
               this.elementosDOM.sidebarOverlay.classList.toggle('show');
           }
       }
   }

   /**
    * 🔄 Toggle colapsar (desktop)
    */
   toggleColapsar() {
       this.estado.colapsado = !this.estado.colapsado;
       
       if (this.elementosDOM.sidebarPrincipal) {
           this.elementosDOM.sidebarPrincipal.classList.toggle('collapsed', this.estado.colapsado);
       }

       // Actualizar icono del botón
       const icono = this.elementosDOM.btnColapsarSidebar?.querySelector('i');
       if (icono) {
           icono.className = this.estado.colapsado ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
       }

       // Guardar estado
       if (this.config.persistirEstado) {
           this.guardarEstado();
       }

       // Emitir evento para que otros componentes se ajusten
       window.dispatchEvent(new CustomEvent('sidebarToggle', {
           detail: { collapsed: this.estado.colapsado }
       }));
   }

   /**
    * 🚪 Cerrar sidebar
    */
   cerrarSidebar() {
       if (this.elementosDOM.sidebarPrincipal) {
           this.elementosDOM.sidebarPrincipal.classList.remove('show');
       }
       
       if (this.elementosDOM.sidebarOverlay) {
           this.elementosDOM.sidebarOverlay.classList.remove('show');
       }
   }

   /**
    * 🎯 Destacar ruta activa
    */
   destacarRutaActiva() {
       // Remover clases activas previas
       const enlacesActivos = this.elementosDOM.menuPrincipal?.querySelectorAll('.nav-link.active');
       enlacesActivos?.forEach(enlace => enlace.classList.remove('active'));

       // Encontrar y activar ruta actual
       const rutaActual = window.location.pathname;
       const enlaceActual = this.elementosDOM.menuPrincipal?.querySelector(`[href="${rutaActual}"]`);
       
       if (enlaceActual) {
           enlaceActual.classList.add('active');
           
           // Si está dentro de un submenu, expandirlo
           const submenu = enlaceActual.closest('.collapse');
           if (submenu) {
               const itemId = submenu.id.replace('submenu-', '');
               this.estado.itemsExpandidos.add(itemId);
               submenu.classList.add('show');
               
               // Actualizar icono
               const expandIcon = document.querySelector(`[data-item-id="${itemId}"] .expand-icon`);
               if (expandIcon) {
                   expandIcon.className = expandIcon.className.replace('fa-chevron-right', 'fa-chevron-down');
               }
           }
       }
   }

   // ==========================================
   // 🛠️ MÉTODOS AUXILIARES
   // ==========================================

   /**
    * 📍 Verificar si es ruta activa
    */
   esRutaActiva(ruta) {
       return window.location.pathname.includes(ruta);
   }

   /**
    * 🏷️ Formatear nombre de rol
    */
   formatearNombreRol(rol) {
       const nombres = {
           administrador: 'Administrador',
           verificador: 'Verificador',
           docente: 'Docente'
       };
       return nombres[rol] || Utils.Texto.capitalizarPalabras(rol);
   }

   /**
    * 🎨 Resaltar término en texto
    */
   resaltarTermino(texto, termino) {
       const regex = new RegExp(`(${termino})`, 'gi');
       return texto.replace(regex, '<mark>$1</mark>');
   }

   /**
    * 🔢 Obtener pendientes de revisión (temporal)
    */
   obtenerPendientesRevision() {
       // Implementar llamada real al servicio
       return '5'; // Ejemplo
   }

   /**
    * 🔢 Obtener observaciones pendientes (temporal)
    */
   obtenerObservacionesPendientes() {
       // Implementar llamada real al servicio
       return '2'; // Ejemplo
   }

   /**
    * ⏰ Actualizar timestamp
    */
   actualizarTimestamp() {
       if (this.elementosDOM.ultimaActualizacion) {
           this.elementosDOM.ultimaActualizacion.textContent = 
               Utils.Fecha.formatearHora(new Date());
       }
   }

   /**
    * 🔧 Ajustar para responsive
    */
   ajustarResponsive() {
       const esMovil = window.innerWidth < 992;
       
       if (esMovil && this.estado.colapsado) {
           // En móvil, no colapsar sino ocultar
           this.estado.colapsado = false;
           this.elementosDOM.sidebarPrincipal?.classList.remove('collapsed');
       }
   }

   /**
    * ⌨️ Manejar teclas de acceso rápido
    */
   manejarTeclasRapidas(e) {
       // Ctrl + B para toggle sidebar
       if (e.ctrlKey && e.key === 'b') {
           e.preventDefault();
           this.toggleColapsar();
       }

       // Escape para cerrar sidebar en móvil
       if (e.key === 'Escape' && window.innerWidth < 992) {
           this.cerrarSidebar();
       }

       // Ctrl + K para enfocar búsqueda
       if (e.ctrlKey && e.key === 'k') {
           e.preventDefault();
           this.elementosDOM.busquedaMenu?.focus();
       }
   }

   // ==========================================
   // 💾 PERSISTENCIA DE ESTADO
   // ==========================================

   /**
    * 💾 Guardar estado
    */
   guardarEstado() {
       if (!this.config.persistirEstado) return;

       const estado = {
           colapsado: this.estado.colapsado,
           itemsExpandidos: Array.from(this.estado.itemsExpandidos)
       };

       Utils.Almacenamiento.guardar('sidebar_estado', estado);
   }

   /**
    * 📖 Restaurar estado
    */
   restaurarEstado() {
       if (!this.config.persistirEstado) return;

       const estadoGuardado = Utils.Almacenamiento.obtener('sidebar_estado');
       
       if (estadoGuardado) {
           this.estado.colapsado = estadoGuardado.colapsado || false;
           this.estado.itemsExpandidos = new Set(estadoGuardado.itemsExpandidos || []);
       }
   }

   /**
    * 🔄 Restaurar items expandidos
    */
   restaurarItemsExpandidos() {
       this.estado.itemsExpandidos.forEach(itemId => {
           const submenu = document.querySelector(`#submenu-${itemId}`);
           const expandIcon = document.querySelector(`[data-item-id="${itemId}"] .expand-icon`);
           
           if (submenu && expandIcon) {
               submenu.classList.add('show');
               expandIcon.className = expandIcon.className.replace('fa-chevron-right', 'fa-chevron-down');
           }
       });
   }

   // ==========================================
   // 🔔 EVENTOS DEL SISTEMA
   // ==========================================

   /**
    * 🎭 Manejar cambio de rol
    */
   onCambioRol(data) {
       this.rolActual = data.rolNuevo;
       this.cargarMenuPorRol();
   }

   /**
    * 🚨 Mostrar error de carga
    */
   mostrarErrorCarga() {
       if (this.elementosDOM.menuPrincipal) {
           this.elementosDOM.menuPrincipal.innerHTML = `
               <li class="nav-item p-3">
                   <div class="text-center text-muted">
                       <i class="fas fa-exclamation-triangle fa-2x mb-2 d-block text-warning"></i>
                       <p class="small mb-2">Error al cargar menú</p>
                       <button class="btn btn-sm btn-outline-light" onclick="window.location.reload()">
                           <i class="fas fa-redo me-1"></i>Reintentar
                       </button>
                   </div>
               </li>
           `;
       }
   }

   /**
    * 🧹 Destruir componente
    */
   destruir() {
       // Guardar estado antes de destruir
       this.guardarEstado();
       
       // Remover event listeners
       if (window.auth) {
           window.auth.removeEventListener('cambioRol', this.onCambioRol);
       }

       console.log('🧹 Componente navegación lateral destruido');
   }
}

// 🚀 Inicializar automáticamente cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
   window.ComponenteNavegacionLateral = new ComponenteNavegacionLateral();
});

// 📤 Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
   module.exports = ComponenteNavegacionLateral;
}

console.log('📌 Componente Navegación Lateral cargado correctamente');