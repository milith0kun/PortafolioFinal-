/**
 * 🔝 COMPONENTE BARRA SUPERIOR
 * Sistema Portafolio Docente UNSAAC
 * 
 * Componente para la barra de navegación superior
 * Incluye cambio de rol dinámico, notificaciones y menú de usuario
 */

class ComponenteBarraSuperior {
   constructor() {
       this.contenedor = null;
       this.elementosDOM = {};
       this.usuario = null;
       this.rolActual = null;
       this.rolesDisponibles = [];
       this.notificaciones = [];
       this.intervalos = {};
       
       // Estado del componente
       this.estado = {
           inicializado: false,
           cargandoRoles: false,
           cargandoNotificaciones: false,
           mostrandoSelectorRol: false
       };

       this.inicializar();
   }

   /**
    * 🚀 Inicializar componente
    */
   async inicializar() {
       try {
           console.log('🔝 Inicializando barra superior...');

           // Encontrar contenedor
           this.contenedor = document.querySelector('.barra-superior, #barra-superior, header');
           
           if (!this.contenedor) {
               console.warn('⚠️ No se encontró contenedor para barra superior');
               return;
           }

           // Renderizar estructura inicial
           await this.renderizar();

           // Configurar eventos
           this.configurarEventos();

           // Cargar datos iniciales
           await this.cargarDatosIniciales();

           // Configurar actualizaciones automáticas
           this.configurarActualizacionesAutomaticas();

           this.estado.inicializado = true;
           console.log('✅ Barra superior inicializada correctamente');

       } catch (error) {
           console.error('❌ Error al inicializar barra superior:', error);
       }
   }

   /**
    * 🎨 Renderizar estructura HTML
    */
   async renderizar() {
       const html = `
           <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
               <div class="container-fluid">
                   <!-- Logo y título -->
                   <div class="navbar-brand d-flex align-items-center">
                       <img src="/assets/imagenes/logos/logo-unsaac.png" 
                            alt="UNSAAC" 
                            height="40" 
                            class="me-2">
                       <div class="d-flex flex-column">
                           <span class="fw-bold">Portafolio Docente</span>
                           <small class="text-light opacity-75">UNSAAC</small>
                       </div>
                   </div>

                   <!-- Toggle para móvil -->
                   <button class="navbar-toggler" 
                           type="button" 
                           data-bs-toggle="collapse" 
                           data-bs-target="#navbarNav">
                       <span class="navbar-toggler-icon"></span>
                   </button>

                   <div class="collapse navbar-collapse" id="navbarNav">
                       <!-- Navegación principal -->
                       <ul class="navbar-nav me-auto" id="navegacion-principal">
                           <!-- Se carga dinámicamente según rol -->
                       </ul>

                       <!-- Controles del usuario -->
                       <div class="navbar-nav ms-auto d-flex align-items-center">
                           
                           <!-- Búsqueda rápida -->
                           <div class="nav-item me-3 d-none d-md-block" id="busqueda-container">
                               <div class="input-group input-group-sm">
                                   <input type="text" 
                                          class="form-control form-control-sm bg-light border-0" 
                                          placeholder="Buscar..." 
                                          id="busqueda-rapida"
                                          style="width: 200px;">
                                   <button class="btn btn-outline-light btn-sm" type="button">
                                       <i class="fas fa-search"></i>
                                   </button>
                               </div>
                           </div>

                           <!-- Selector de rol -->
                           <div class="nav-item dropdown me-3" id="selector-rol" style="display: none;">
                               <button class="btn btn-outline-light btn-sm dropdown-toggle d-flex align-items-center" 
                                       type="button" 
                                       data-bs-toggle="dropdown">
                                   <i class="fas fa-user-tag me-2"></i>
                                   <span id="rol-actual-texto">Cargando...</span>
                                   <span class="badge bg-light text-primary ms-2" id="contador-roles">0</span>
                               </button>
                               <ul class="dropdown-menu dropdown-menu-end" id="lista-roles">
                                   <li class="dropdown-header">Cambiar rol activo</li>
                                   <li><hr class="dropdown-divider"></li>
                                   <!-- Roles se cargan dinámicamente -->
                               </ul>
                           </div>

                           <!-- Notificaciones -->
                           <div class="nav-item dropdown me-3" id="notificaciones-dropdown">
                               <button class="btn btn-outline-light btn-sm position-relative" 
                                       type="button" 
                                       data-bs-toggle="dropdown"
                                       id="btn-notificaciones">
                                   <i class="fas fa-bell"></i>
                                   <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" 
                                         id="contador-notificaciones" 
                                         style="display: none;">
                                       0
                                   </span>
                               </button>
                               <div class="dropdown-menu dropdown-menu-end p-0" 
                                    style="width: 350px; max-height: 400px;">
                                   <div class="dropdown-header d-flex justify-content-between align-items-center">
                                       <span>Notificaciones</span>
                                       <button class="btn btn-sm btn-outline-primary" id="marcar-todas-leidas">
                                           <i class="fas fa-check-double"></i>
                                       </button>
                                   </div>
                                   <hr class="dropdown-divider m-0">
                                   <div class="overflow-auto" style="max-height: 300px;" id="lista-notificaciones">
                                       <div class="p-3 text-center text-muted">
                                           <i class="fas fa-bell-slash fa-2x mb-2 d-block"></i>
                                           No hay notificaciones
                                       </div>
                                   </div>
                                   <hr class="dropdown-divider m-0">
                                   <div class="dropdown-footer p-2">
                                       <a href="/paginas/compartidas/notificaciones.html" 
                                          class="btn btn-sm btn-primary w-100">
                                           Ver todas las notificaciones
                                       </a>
                                   </div>
                               </div>
                           </div>

                           <!-- Menú de usuario -->
                           <div class="nav-item dropdown" id="menu-usuario">
                               <button class="btn btn-outline-light btn-sm dropdown-toggle d-flex align-items-center" 
                                       type="button" 
                                       data-bs-toggle="dropdown">
                                   <div class="avatar-pequeño me-2" id="avatar-usuario">
                                       <i class="fas fa-user"></i>
                                   </div>
                                   <div class="d-flex flex-column align-items-start d-none d-md-block">
                                       <small id="nombre-usuario">Cargando...</small>
                                       <small class="text-light opacity-75" id="correo-usuario"></small>
                                   </div>
                               </button>
                               <ul class="dropdown-menu dropdown-menu-end">
                                   <li class="dropdown-header" id="header-usuario">Usuario</li>
                                   <li><hr class="dropdown-divider"></li>
                                   <li>
                                       <a class="dropdown-item" href="/paginas/compartidas/perfil.html">
                                           <i class="fas fa-user-circle me-2"></i>Mi Perfil
                                       </a>
                                   </li>
                                   <li>
                                       <a class="dropdown-item" href="/paginas/compartidas/cambiar-clave.html">
                                           <i class="fas fa-key me-2"></i>Cambiar Contraseña
                                       </a>
                                   </li>
                                   <li>
                                       <a class="dropdown-item" href="#" id="configuracion-cuenta">
                                           <i class="fas fa-cog me-2"></i>Configuración
                                       </a>
                                   </li>
                                   <li><hr class="dropdown-divider"></li>
                                   <li>
                                       <a class="dropdown-item" href="/paginas/compartidas/ayuda.html">
                                           <i class="fas fa-question-circle me-2"></i>Ayuda
                                       </a>
                                   </li>
                                   <li><hr class="dropdown-divider"></li>
                                   <li>
                                       <a class="dropdown-item text-danger" href="#" id="btn-cerrar-sesion">
                                           <i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión
                                       </a>
                                   </li>
                               </ul>
                           </div>
                       </div>
                   </div>
               </div>
           </nav>

           <!-- Indicador de conexión -->
           <div class="alert alert-warning alert-dismissible fade show m-0 rounded-0 d-none" 
                id="alerta-conexion" 
                role="alert">
               <i class="fas fa-wifi me-2"></i>
               <span id="mensaje-conexion">Verificando conexión...</span>
               <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
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
           // Navegación
           navegacionPrincipal: $('#navegacion-principal'),
           
           // Búsqueda
           busquedaRapida: $('#busqueda-rapida'),
           
           // Selector de rol
           selectorRol: $('#selector-rol'),
           rolActualTexto: $('#rol-actual-texto'),
           contadorRoles: $('#contador-roles'),
           listaRoles: $('#lista-roles'),
           
           // Notificaciones
           btnNotificaciones: $('#btn-notificaciones'),
           contadorNotificaciones: $('#contador-notificaciones'),
           listaNotificaciones: $('#lista-notificaciones'),
           marcarTodasLeidas: $('#marcar-todas-leidas'),
           
           // Usuario
           avatarUsuario: $('#avatar-usuario'),
           nombreUsuario: $('#nombre-usuario'),
           correoUsuario: $('#correo-usuario'),
           headerUsuario: $('#header-usuario'),
           btnCerrarSesion: $('#btn-cerrar-sesion'),
           configuracionCuenta: $('#configuracion-cuenta'),
           
           // Alertas
           alertaConexion: $('#alerta-conexion'),
           mensajeConexion: $('#mensaje-conexion')
       };
   }

   /**
    * 🔧 Configurar eventos
    */
   configurarEventos() {
       // Búsqueda rápida
       if (this.elementosDOM.busquedaRapida) {
           this.elementosDOM.busquedaRapida.addEventListener('input', 
               Utils.Performance.debounce((e) => this.realizarBusqueda(e.target.value), 300)
           );

           this.elementosDOM.busquedaRapida.addEventListener('keypress', (e) => {
               if (e.key === 'Enter') {
                   this.realizarBusquedaCompleta(e.target.value);
               }
           });
       }

       // Cambio de rol
       if (this.elementosDOM.listaRoles) {
           this.elementosDOM.listaRoles.addEventListener('click', (e) => {
               if (e.target.classList.contains('rol-opcion')) {
                   const nuevoRol = e.target.dataset.rol;
                   this.cambiarRol(nuevoRol);
               }
           });
       }

       // Notificaciones
       if (this.elementosDOM.marcarTodasLeidas) {
           this.elementosDOM.marcarTodasLeidas.addEventListener('click', 
               () => this.marcarTodasNotificacionesLeidas()
           );
       }

       if (this.elementosDOM.listaNotificaciones) {
           this.elementosDOM.listaNotificaciones.addEventListener('click', (e) => {
               if (e.target.classList.contains('notificacion-item')) {
                   this.marcarNotificacionLeida(e.target.dataset.notificacionId);
               }
           });
       }

       // Cerrar sesión
       if (this.elementosDOM.btnCerrarSesion) {
           this.elementosDOM.btnCerrarSesion.addEventListener('click', (e) => {
               e.preventDefault();
               this.mostrarModalCerrarSesion();
           });
       }

       // Configuración de cuenta
       if (this.elementosDOM.configuracionCuenta) {
           this.elementosDOM.configuracionCuenta.addEventListener('click', (e) => {
               e.preventDefault();
               this.abrirConfiguracion();
           });
       }

       // Eventos del sistema de autenticación
       if (window.auth) {
           window.auth.addEventListener('login', (data) => this.onUsuarioLogin(data));
           window.auth.addEventListener('logout', () => this.onUsuarioLogout());
           window.auth.addEventListener('cambioRol', (data) => this.onCambioRol(data));
       }

       // Eventos de conexión
       window.addEventListener('online', () => this.onEstadoConexion(true));
       window.addEventListener('offline', () => this.onEstadoConexion(false));
   }

   /**
    * 📊 Cargar datos iniciales
    */
   async cargarDatosIniciales() {
       try {
           // Verificar si hay usuario autenticado
           if (window.auth && window.auth.estaAutenticado()) {
               const datosUsuario = window.auth.obtenerUsuario();
               await this.actualizarDatosUsuario(datosUsuario);
               await this.cargarRolesDisponibles();
               await this.cargarNotificaciones();
               await this.cargarNavegacionPrincipal();
           }

       } catch (error) {
           console.error('❌ Error al cargar datos iniciales:', error);
       }
   }

   /**
    * 👤 Actualizar datos del usuario
    */
   async actualizarDatosUsuario(datosUsuario) {
       if (!datosUsuario || !datosUsuario.usuario) return;

       const usuario = datosUsuario.usuario;

       // Actualizar nombre y correo
       if (this.elementosDOM.nombreUsuario) {
           this.elementosDOM.nombreUsuario.textContent = 
               `${usuario.nombres} ${usuario.apellidos}`;
       }

       if (this.elementosDOM.correoUsuario) {
           this.elementosDOM.correoUsuario.textContent = usuario.correo;
       }

       if (this.elementosDOM.headerUsuario) {
           this.elementosDOM.headerUsuario.textContent = 
               `${usuario.nombres} ${usuario.apellidos}`;
       }

       // Actualizar avatar
       if (this.elementosDOM.avatarUsuario) {
           if (usuario.avatar) {
               this.elementosDOM.avatarUsuario.innerHTML = 
                   `<img src="${usuario.avatar}" alt="Avatar" class="rounded-circle" width="24" height="24">`;
           } else {
               const iniciales = this.obtenerIniciales(usuario.nombres, usuario.apellidos);
               this.elementosDOM.avatarUsuario.innerHTML = 
                   `<span class="avatar-iniciales">${iniciales}</span>`;
           }
       }

       // Actualizar rol actual
       if (datosUsuario.rolActual) {
           this.actualizarRolActual(datosUsuario.rolActual);
       }

       this.usuario = usuario;
   }

   /**
    * 🎭 Cargar roles disponibles
    */
   async cargarRolesDisponibles() {
       try {
           this.estado.cargandoRoles = true;

           const response = await window.ServicioRoles.obtenerMisRoles();
           
           if (response.success) {
               this.rolesDisponibles = response.roles;
               this.rolActual = response.rolActual;
               
               this.renderizarSelectorRoles();
               this.actualizarRolActual(this.rolActual);
               
               // Mostrar selector solo si hay múltiples roles
               if (this.rolesDisponibles.length > 1) {
                   this.elementosDOM.selectorRol.style.display = 'block';
               }
           }

       } catch (error) {
           console.error('❌ Error al cargar roles:', error);
       } finally {
           this.estado.cargandoRoles = false;
       }
   }

   /**
    * 🎨 Renderizar selector de roles
    */
   renderizarSelectorRoles() {
       if (!this.elementosDOM.listaRoles || !this.rolesDisponibles.length) return;

       let html = `
           <li class="dropdown-header">Cambiar rol activo</li>
           <li><hr class="dropdown-divider"></li>
       `;

       this.rolesDisponibles.forEach(rol => {
           const esActivo = rol === this.rolActual;
           const icono = this.obtenerIconoRol(rol);
           const nombre = this.formatearNombreRol(rol);
           
           html += `
               <li>
                   <a class="dropdown-item rol-opcion ${esActivo ? 'active' : ''}" 
                      href="#" 
                      data-rol="${rol}">
                       <i class="${icono} me-2"></i>
                       ${nombre}
                       ${esActivo ? '<i class="fas fa-check ms-auto text-success"></i>' : ''}
                   </a>
               </li>
           `;
       });

       this.elementosDOM.listaRoles.innerHTML = html;
       
       // Actualizar contador
       if (this.elementosDOM.contadorRoles) {
           this.elementosDOM.contadorRoles.textContent = this.rolesDisponibles.length;
       }
   }

   /**
    * 🔄 Cambiar rol activo
    */
   async cambiarRol(nuevoRol) {
       if (nuevoRol === this.rolActual) return;

       try {
           console.log(`🔄 Cambiando a rol: ${nuevoRol}`);

           // Mostrar indicador de carga
           this.mostrarCargandoRol(true);

           // Cambiar rol
           const response = await window.ServicioRoles.cambiarRol(nuevoRol);

           if (response.success) {
               // Actualizar estado local
               this.rolActual = nuevoRol;
               
               // Actualizar UI
               this.actualizarRolActual(nuevoRol);
               this.renderizarSelectorRoles();
               await this.cargarNavegacionPrincipal();

               // Mostrar notificación
               Utils.Notificacion.exito(response.mensaje);

               // Redirigir si es necesario
               if (response.redirectUrl && response.redirectUrl !== window.location.pathname) {
                   setTimeout(() => {
                       window.location.href = response.redirectUrl;
                   }, 1000);
               }

           } else {
               throw new Error(response.message || 'Error al cambiar rol');
           }

       } catch (error) {
           console.error('❌ Error al cambiar rol:', error);
           Utils.Notificacion.error(error.message);
       } finally {
           this.mostrarCargandoRol(false);
       }
   }

   /**
    * 🎭 Actualizar rol actual en UI
    */
   actualizarRolActual(rol) {
       if (!this.elementosDOM.rolActualTexto) return;

       const nombre = this.formatearNombreRol(rol);
       const icono = this.obtenerIconoRol(rol);
       
       this.elementosDOM.rolActualTexto.innerHTML = `
           <i class="${icono} me-1"></i>
           ${nombre}
       `;
   }

   /**
    * 📂 Cargar navegación principal según rol
    */
   async cargarNavegacionPrincipal() {
       if (!this.elementosDOM.navegacionPrincipal || !this.rolActual) return;

       const menuItems = this.obtenerMenuItemsPorRol(this.rolActual);
       
       let html = '';
       menuItems.forEach(item => {
           html += `
               <li class="nav-item ${item.dropdown ? 'dropdown' : ''}">
                   <a class="nav-link ${item.activo ? 'active' : ''} ${item.dropdown ? 'dropdown-toggle' : ''}" 
                      href="${item.url}" 
                      ${item.dropdown ? 'data-bs-toggle="dropdown"' : ''}>
                       <i class="${item.icono} me-1"></i>
                       ${item.texto}
                   </a>
                   ${item.dropdown ? this.renderizarSubmenu(item.submenu) : ''}
               </li>
           `;
       });

       this.elementosDOM.navegacionPrincipal.innerHTML = html;
   }

   /**
    * 📱 Cargar notificaciones
    */
   async cargarNotificaciones() {
       try {
           this.estado.cargandoNotificaciones = true;

           // Simular carga de notificaciones (implementar servicio real)
           const notificaciones = await this.obtenerNotificacionesUsuario();
           
           this.notificaciones = notificaciones;
           this.renderizarNotificaciones();
           this.actualizarContadorNotificaciones();

       } catch (error) {
           console.error('❌ Error al cargar notificaciones:', error);
       } finally {
           this.estado.cargandoNotificaciones = false;
       }
   }

   /**
    * 🔔 Renderizar notificaciones
    */
   renderizarNotificaciones() {
       if (!this.elementosDOM.listaNotificaciones) return;

       if (this.notificaciones.length === 0) {
           this.elementosDOM.listaNotificaciones.innerHTML = `
               <div class="p-3 text-center text-muted">
                   <i class="fas fa-bell-slash fa-2x mb-2 d-block"></i>
                   No hay notificaciones
               </div>
           `;
           return;
       }

       let html = '';
       this.notificaciones.slice(0, 10).forEach(notif => {
           html += `
               <div class="dropdown-item notificacion-item ${!notif.leida ? 'bg-light' : ''}" 
                    data-notificacion-id="${notif.id}">
                   <div class="d-flex">
                       <div class="flex-shrink-0">
                           <i class="${this.obtenerIconoNotificacion(notif.tipo)} text-${this.obtenerColorNotificacion(notif.tipo)}"></i>
                       </div>
                       <div class="flex-grow-1 ms-2">
                           <div class="fw-bold small">${notif.titulo}</div>
                           <div class="text-muted small">${Utils.Texto.truncar(notif.mensaje, 60)}</div>
                           <div class="text-muted smaller">
                               ${Utils.Fecha.formatearRelativo(notif.creado_en)}
                           </div>
                       </div>
                       ${!notif.leida ? '<div class="badge bg-primary rounded-pill ms-1">•</div>' : ''}
                   </div>
               </div>
           `;
       });

       this.elementosDOM.listaNotificaciones.innerHTML = html;
   }

   /**
    * 🔢 Actualizar contador de notificaciones
    */
   actualizarContadorNotificaciones() {
       const noLeidas = this.notificaciones.filter(n => !n.leida).length;
       
       if (this.elementosDOM.contadorNotificaciones) {
           if (noLeidas > 0) {
               this.elementosDOM.contadorNotificaciones.textContent = 
                   noLeidas > 99 ? '99+' : noLeidas;
               this.elementosDOM.contadorNotificaciones.style.display = 'block';
           } else {
               this.elementosDOM.contadorNotificaciones.style.display = 'none';
           }
       }
   }

   // ==========================================
   // 🛠️ MÉTODOS AUXILIARES
   // ==========================================

   /**
    * 📊 Obtener menú items por rol
    */
   obtenerMenuItemsPorRol(rol) {
       const menus = {
           administrador: [
               { texto: 'Dashboard', url: '/paginas/administrador/tablero.html', icono: 'fas fa-tachometer-alt', activo: this.esRutaActiva('/administrador/tablero') },
               { texto: 'Usuarios', url: '/paginas/administrador/usuarios.html', icono: 'fas fa-users', activo: this.esRutaActiva('/administrador/usuarios') },
               { texto: 'Asignaturas', url: '/paginas/administrador/asignaturas.html', icono: 'fas fa-book', activo: this.esRutaActiva('/administrador/asignaturas') },
               { texto: 'Ciclos', url: '/paginas/administrador/ciclos-academicos.html', icono: 'fas fa-calendar-alt', activo: this.esRutaActiva('/administrador/ciclos') },
               { texto: 'Reportes', url: '/paginas/administrador/reportes.html', icono: 'fas fa-chart-bar', activo: this.esRutaActiva('/administrador/reportes') }
           ],
           verificador: [
               { texto: 'Dashboard', url: '/paginas/verificador/tablero.html', icono: 'fas fa-tachometer-alt', activo: this.esRutaActiva('/verificador/tablero') },
               { texto: 'Cola de Revisión', url: '/paginas/verificador/cola-revision.html', icono: 'fas fa-clipboard-check', activo: this.esRutaActiva('/verificador/cola') },
               { texto: 'Estadísticas', url: '/paginas/verificador/estadisticas.html', icono: 'fas fa-chart-line', activo: this.esRutaActiva('/verificador/estadisticas') }
           ],
           docente: [
               { texto: 'Dashboard', url: '/paginas/docente/tablero.html', icono: 'fas fa-tachometer-alt', activo: this.esRutaActiva('/docente/tablero') },
               { texto: 'Mis Portafolios', url: '/paginas/docente/mis-portafolios.html', icono: 'fas fa-folder-open', activo: this.esRutaActiva('/docente/portafolios') },
               { texto: 'Subir Documentos', url: '/paginas/docente/subir.html', icono: 'fas fa-cloud-upload-alt', activo: this.esRutaActiva('/docente/subir') },
               { texto: 'Observaciones', url: '/paginas/docente/observaciones.html', icono: 'fas fa-comments', activo: this.esRutaActiva('/docente/observaciones') },
               { texto: 'Progreso', url: '/paginas/docente/progreso.html', icono: 'fas fa-chart-pie', activo: this.esRutaActiva('/docente/progreso') }
           ]
       };

       return menus[rol] || [];
   }

   /**
    * 🎨 Obtener icono de rol
    */
   obtenerIconoRol(rol) {
       const iconos = {
           administrador: 'fas fa-user-shield',
           verificador: 'fas fa-user-check',
           docente: 'fas fa-chalkboard-teacher'
       };
       return iconos[rol] || 'fas fa-user';
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
    * 🔤 Obtener iniciales del usuario
    */
   obtenerIniciales(nombres, apellidos) {
       const inicial1 = nombres ? nombres.charAt(0).toUpperCase() : '';
       const inicial2 = apellidos ? apellidos.charAt(0).toUpperCase() : '';
       return inicial1 + inicial2;
   }

   /**
    * 📍 Verificar si es ruta activa
    */
   esRutaActiva(ruta) {
       return window.location.pathname.includes(ruta);
   }

   /**
    * 🔔 Obtener notificaciones del usuario (temporal)
    */
   async obtenerNotificacionesUsuario() {
       // Implementar llamada real al servicio
       return [
           {
               id: 1,
               tipo: 'documento',
               titulo: 'Documento aprobado',
               mensaje: 'Su documento "Syllabus MDS" ha sido aprobado',
               leida: false,
               creado_en: new Date(Date.now() - 30 * 60 * 1000) // Hace 30 minutos
           },
           {
               id: 2,
               tipo: 'observacion',
               titulo: 'Nueva observación',
               mensaje: 'Tiene una nueva observación en su portafolio',
               leida: false,
               creado_en: new Date(Date.now() - 2 * 60 * 60 * 1000) // Hace 2 horas
           }
       ];
   }

   /**
    * 🔄 Configurar actualizaciones automáticas
    */
   configurarActualizacionesAutomaticas() {
       // Actualizar notificaciones cada 30 segundos
       this.intervalos.notificaciones = setInterval(() => {
           if (!this.estado.cargandoNotificaciones) {
               this.cargarNotificaciones();
           }
       }, CONFIG.SYNC.INTERVALO_NOTIFICACIONES * 1000);

       // Verificar conexión cada 2 minutos
       this.intervalos.conexion = setInterval(() => {
           this.verificarConexion();
       }, 2 * 60 * 1000);
   }

   /**
    * 🌐 Verificar estado de conexión
    */
   async verificarConexion() {
       try {
           const conectividad = await window.ServicioAuth.probarConectividad();
           this.onEstadoConexion(conectividad.conectado);
       } catch (error) {
           this.onEstadoConexion(false);
       }
   }

   /**
    * 📶 Manejar cambio de estado de conexión
    */
   onEstadoConexion(conectado) {
       if (!this.elementosDOM.alertaConexion) return;

       if (conectado) {
           this.elementosDOM.alertaConexion.classList.add('d-none');
       } else {
           this.elementosDOM.mensajeConexion.textContent = 
               'Sin conexión a internet. Algunos datos pueden no estar actualizados.';
           this.elementosDOM.alertaConexion.classList.remove('d-none');
       }
   }

   /**
    * 🚪 Mostrar modal de cerrar sesión
    */
   async mostrarModalCerrarSesion() {
       const confirmar = await Utils.Notificacion.confirmar(
           '¿Estás seguro de que deseas cerrar sesión?',
           {
               titulo: 'Cerrar Sesión',
               textoConfirmar: 'Sí, cerrar sesión',
               textoCancelar: 'Cancelar'
           }
       );

       if (confirmar) {
           await this.cerrarSesion();
       }
   }

   /**
    * 🚪 Cerrar sesión
    */
   async cerrarSesion() {
       try {
           console.log('🚪 Cerrando sesión...');

           await window.ServicioAuth.logout();
           
           // Limpiar intervalos
           Object.values(this.intervalos).forEach(clearInterval);
           
           // Redirigir a login
           window.location.href = '/paginas/autenticacion/login.html';

       } catch (error) {
           console.error('❌ Error al cerrar sesión:', error);
           Utils.Notificacion.error('Error al cerrar sesión');
       }
   }

   // ==========================================
   // 🔔 EVENTOS DEL SISTEMA
   // ==========================================

   onUsuarioLogin(data) {
       this.actualizarDatosUsuario(data);
       this.cargarRolesDisponibles();
       this.cargarNotificaciones();
   }

   onUsuarioLogout() {
       this.usuario = null;
       this.rolActual = null;
       this.rolesDisponibles = [];
       this.notificaciones = [];
       
       // Limpiar intervalos
       Object.values(this.intervalos).forEach(clearInterval);
   }

   onCambioRol(data) {
       this.rolActual = data.rolNuevo;
       this.actualizarRolActual(data.rolNuevo);
       this.cargarNavegacionPrincipal();
   }

   /**
    * 🧹 Destruir componente
    */
   destruir() {
       // Limpiar intervalos
       Object.values(this.intervalos).forEach(clearInterval);
       
       // Remover event listeners
       if (window.auth) {
           window.auth.removeEventListener('login', this.onUsuarioLogin);
           window.auth.removeEventListener('logout', this.onUsuarioLogout);
           window.auth.removeEventListener('cambioRol', this.onCambioRol);
       }

       console.log('🧹 Componente barra superior destruido');
   }
}

// 🚀 Inicializar automáticamente cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
   window.ComponenteBarraSuperior = new ComponenteBarraSuperior();
});

// 📤 Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
   module.exports = ComponenteBarraSuperior;
}

console.log('🔝 Componente Barra Superior cargado correctamente');