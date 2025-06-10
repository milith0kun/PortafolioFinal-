/**
 * 🏠 LÓGICA ESPECÍFICA DEL INDEX.HTML
 * Sistema Portafolio Docente UNSAAC
 * 
 * Maneja toda la interactividad de la página principal
 */

class IndexController {
   constructor() {
       this.elementos = {};
       this.estadoCiclo = null;
       this.usuarioActual = null;
       this.init();
   }

   async init() {
       console.log('🏠 Inicializando lógica del index...');
       
       await this.esperarDependencias();
       this.obtenerElementos();
       this.configurarEventos();
       this.verificarAutenticacion();
       this.cargarEstadoCiclo();
       this.configurarAnimaciones();
       
       console.log('✅ Index inicializado correctamente');
   }

   // 🔄 Esperar a que las dependencias estén cargadas
   async esperarDependencias() {
       let intentos = 0;
       const maxIntentos = 50;
       
       while (!window.CONFIG && intentos < maxIntentos) {
           await new Promise(resolve => setTimeout(resolve, 100));
           intentos++;
       }
       
       if (!window.CONFIG) {
           throw new Error('Configuración no disponible');
       }
   }

   // 🎯 Obtener referencias a elementos DOM
   obtenerElementos() {
       this.elementos = {
           // Búsqueda
           searchInput: document.querySelector('.search-input'),
           searchBtn: document.querySelector('.search-btn'),
           
           // Usuario
           userMenu: document.getElementById('userMenu'),
           userName: document.getElementById('userName'),
           dropdownMenu: document.getElementById('dropdownMenu'),
           
           // Ciclo académico
           currentCycle: document.getElementById('currentCycle'),
           cycleStatus: document.getElementById('cycleStatus'),
           statusDescription: document.getElementById('statusDescription'),
           cycleStatusBanner: document.getElementById('cycleStatusBanner'),
           
           // Navegación
           menuToggle: document.getElementById('menuToggle'),
           mainNav: document.querySelector('.main-nav'),
           
           // Cards
           featureCards: document.querySelectorAll('.feature-card'),
           accessCards: document.querySelectorAll('.access-card'),
           
           // Animaciones
           processSteps: document.querySelectorAll('.process-step')
       };
   }

   // 🎮 Configurar eventos
   configurarEventos() {
       // Búsqueda
       if (this.elementos.searchInput) {
           this.elementos.searchInput.addEventListener('keypress', (e) => {
               if (e.key === 'Enter') this.ejecutarBusqueda();
           });
       }
       
       if (this.elementos.searchBtn) {
           this.elementos.searchBtn.addEventListener('click', () => this.ejecutarBusqueda());
       }

       // Menú de usuario
       if (this.elementos.userMenu) {
           this.elementos.userMenu.addEventListener('click', () => {
               this.elementos.dropdownMenu?.classList.toggle('show');
           });
       }

       // Menú móvil
       if (this.elementos.menuToggle) {
           this.elementos.menuToggle.addEventListener('click', () => this.toggleMenuMovil());
       }

       // Cards de roles
       this.elementos.featureCards.forEach(card => {
           card.addEventListener('click', () => this.manejarClickCard(card));
       });

       this.elementos.accessCards.forEach(card => {
           card.addEventListener('click', () => this.manejarClickCard(card));
       });

       // Eventos de resize
       window.addEventListener('resize', () => this.manejarResize());

       // Cerrar dropdown al hacer click fuera
       document.addEventListener('click', (e) => {
           if (!this.elementos.userMenu?.contains(e.target)) {
               this.elementos.dropdownMenu?.classList.remove('show');
           }
       });
   }

   // 🔐 Verificar estado de autenticación
   async verificarAutenticacion() {
       try {
           const token = localStorage.getItem(CONFIG.AUTH.TOKEN_KEY);
           
           if (token) {
               const response = await fetch(CONFIG.utils.endpoint('/auth/me'), {
                   headers: {
                       'Authorization': `Bearer ${token}`,
                       'Content-Type': 'application/json'
                   }
               });

               if (response.ok) {
                   this.usuarioActual = await response.json();
                   this.actualizarMenuUsuario();
               } else {
                   localStorage.removeItem(CONFIG.AUTH.TOKEN_KEY);
                   this.mostrarMenuGuestMode();
               }
           } else {
               this.mostrarMenuGuestMode();
           }
       } catch (error) {
           console.log('Usuario no autenticado');
           this.mostrarMenuGuestMode();
       }
   }

   // 👤 Actualizar menú de usuario autenticado
   actualizarMenuUsuario() {
       if (!this.usuarioActual || !this.elementos.userName) return;

       this.elementos.userName.textContent = this.usuarioActual.nombres;
       
       if (this.elementos.dropdownMenu) {
           const dashboardUrl = CONFIG.ROLES.RUTAS_POR_ROL[this.usuarioActual.rolActual] || 'paginas/autenticacion/login.html';
           
           this.elementos.dropdownMenu.innerHTML = `
               <a href="paginas/compartidas/perfil.html">
                   <i class="fas fa-user"></i> Mi Perfil
               </a>
               <a href="${dashboardUrl}">
                   <i class="fas fa-tachometer-alt"></i> Dashboard
               </a>
               <a href="#" onclick="window.indexController.cerrarSesion(); return false;">
                   <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
               </a>
           `;
       }
   }

   // 🚪 Mostrar menú para usuarios no autenticados
   mostrarMenuGuestMode() {
       if (this.elementos.userName) {
           this.elementos.userName.textContent = 'Entrar';
       }
       
       if (this.elementos.dropdownMenu) {
           this.elementos.dropdownMenu.innerHTML = `
               <a href="paginas/autenticacion/login.html">
                   <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
               </a>
               <a href="paginas/compartidas/ayuda.html">
                   <i class="fas fa-question-circle"></i> Ayuda
               </a>
           `;
       }
   }

   // 📅 Cargar estado del ciclo académico
   async cargarEstadoCiclo() {
       try {
           const response = await fetch(CONFIG.utils.endpoint('/ciclos/actual'));
           
           if (response.ok) {
               this.estadoCiclo = await response.json();
               this.actualizarEstadoCiclo();
           } else {
               this.mostrarEstadoPorDefecto();
           }
       } catch (error) {
           console.error('Error cargando ciclo:', error);
           this.mostrarEstadoPorDefecto();
       }
   }

   // 🔄 Actualizar estado del ciclo en la UI
   actualizarEstadoCiclo() {
       if (!this.estadoCiclo) return;

       // Actualizar elementos del header
       if (this.elementos.currentCycle) {
           this.elementos.currentCycle.textContent = this.estadoCiclo.nombre;
       }
       
       if (this.elementos.cycleStatus) {
           this.elementos.cycleStatus.textContent = this.obtenerTextoEstado(this.estadoCiclo.estado);
       }

       // Actualizar banner de estado
       if (this.elementos.statusDescription) {
           const descripciones = {
               'preparacion': 'Sistema en configuración - Los administradores están configurando el ciclo académico',
               'activo': 'Período de subida de documentos activo - Los docentes pueden trabajar en sus portafolios',
               'revision': 'Período de verificación activo - Los verificadores están revisando documentos',
               'cerrado': 'Ciclo académico finalizado - Consulta de información disponible',
               'archivado': 'Ciclo archivado - Solo consulta histórica'
           };
           
           this.elementos.statusDescription.textContent = descripciones[this.estadoCiclo.estado] || 'Estado del sistema actualizado';
       }

       // Actualizar icono de estado
       const statusIcon = document.querySelector('.status-icon i');
       if (statusIcon) {
           const iconos = {
               'preparacion': 'fas fa-cog fa-spin',
               'activo': 'fas fa-play-circle',
               'revision': 'fas fa-search',
               'cerrado': 'fas fa-lock',
               'archivado': 'fas fa-archive'
           };
           
           statusIcon.className = iconos[this.estadoCiclo.estado] || 'fas fa-calendar-alt';
       }
   }

   // 📋 Mostrar estado por defecto
   mostrarEstadoPorDefecto() {
       if (this.elementos.currentCycle) {
           this.elementos.currentCycle.textContent = '2025-I';
       }
       
       if (this.elementos.cycleStatus) {
           this.elementos.cycleStatus.textContent = 'Configuración';
       }
       
       if (this.elementos.statusDescription) {
           this.elementos.statusDescription.textContent = 'Sistema en configuración inicial';
       }
   }

   obtenerTextoEstado(estado) {
       const estados = {
           'preparacion': 'En Configuración',
           'activo': 'Activo',
           'revision': 'En Revisión',
           'cerrado': 'Cerrado',
           'archivado': 'Archivado'
       };
       return estados[estado] || 'Desconocido';
   }

   // 🔍 Ejecutar búsqueda
   ejecutarBusqueda() {
       const termino = this.elementos.searchInput?.value?.trim();
       
       if (!termino || termino.length < 3) {
           this.mostrarMensaje('Ingresa al menos 3 caracteres para buscar', 'warning');
           return;
       }

       // Si no está autenticado, redirigir al login
       if (!this.usuarioActual) {
           this.mostrarMensaje('Debes iniciar sesión para buscar', 'info');
           setTimeout(() => {
               window.location.href = 'paginas/autenticacion/login.html';
           }, 1500);
           return;
       }

       console.log('🔍 Buscando:', termino);
       this.mostrarMensaje(`Buscando: "${termino}"...`, 'info');
       // Aquí conectar con servicio de búsqueda real
   }

   // 🎭 Manejar click en cards de roles
   manejarClickCard(card) {
       let rol = null;
       
       if (card.classList.contains('admin-card')) rol = 'administrador';
       else if (card.classList.contains('docente-card')) rol = 'docente';
       else if (card.classList.contains('verificador-card')) rol = 'verificador';

       if (rol) {
           this.mostrarInfoRol(rol);
       }
   }

   // ℹ️ Mostrar información del rol
   mostrarInfoRol(rol) {
       const info = {
           administrador: {
               titulo: 'Acceso de Administrador',
               contenido: 'Gestiona usuarios, configura ciclos académicos y supervisa todo el sistema.',
               funciones: ['Configurar ciclos académicos', 'Gestionar usuarios y roles', 'Generar reportes ejecutivos', 'Cargar datos masivos']
           },
           docente: {
               titulo: 'Acceso de Docente',
               contenido: 'Gestiona tus portafolios académicos y sube documentos requeridos.',
               funciones: ['Gestionar portafolios', 'Subir documentos', 'Ver progreso', 'Revisar observaciones']
           },
           verificador: {
               titulo: 'Acceso de Verificador',
               contenido: 'Revisa y aprueba documentos académicos con observaciones detalladas.',
               funciones: ['Revisar documentos', 'Crear observaciones', 'Aprobar/rechazar contenido', 'Gestionar cola de revisión']
           }
       };

       const roleInfo = info[rol];
       const funcionesHTML = roleInfo.funciones.map(f => `<li>${f}</li>`).join('');

       if (window.Swal) {
           Swal.fire({
               title: roleInfo.titulo,
               html: `
                   <div style="text-align: left;">
                       <p style="margin-bottom: 15px;">${roleInfo.contenido}</p>
                       <strong>Funciones principales:</strong>
                       <ul style="margin-top: 10px;">${funcionesHTML}</ul>
                   </div>
               `,
               icon: 'info',
               confirmButtonText: 'Acceder al Sistema',
               showCancelButton: true,
               cancelButtonText: 'Cancelar'
           }).then((result) => {
               if (result.isConfirmed) {
                   window.location.href = 'paginas/autenticacion/login.html';
               }
           });
       } else {
           const acceder = confirm(`${roleInfo.titulo}\n\n${roleInfo.contenido}\n\n¿Deseas acceder al sistema?`);
           if (acceder) {
               window.location.href = 'paginas/autenticacion/login.html';
           }
       }
   }

   // 📱 Toggle menú móvil
   toggleMenuMovil() {
       if (!this.elementos.mainNav) return;
       
       this.elementos.mainNav.classList.toggle('active');
       this.elementos.menuToggle.classList.toggle('active');
   }

   // 📏 Manejar cambio de tamaño de ventana
   manejarResize() {
       // Cerrar menú móvil si se vuelve a escritorio
       if (window.innerWidth > 768) {
           this.elementos.mainNav?.classList.remove('active');
           this.elementos.menuToggle?.classList.remove('active');
       }
   }

   // 🎬 Configurar animaciones
   configurarAnimaciones() {
       if ('IntersectionObserver' in window) {
           const observer = new IntersectionObserver((entries) => {
               entries.forEach(entry => {
                   if (entry.isIntersecting) {
                       entry.target.classList.add('animate-in');
                   }
               });
           }, { threshold: 0.1 });

           // Observar elementos animables
           this.elementos.processSteps.forEach(step => observer.observe(step));
           this.elementos.featureCards.forEach(card => observer.observe(card));
           this.elementos.accessCards.forEach(card => observer.observe(card));
       }
   }

   // 🚪 Cerrar sesión
   async cerrarSesion() {
       try {
           const token = localStorage.getItem(CONFIG.AUTH.TOKEN_KEY);
           
           if (token) {
               await fetch(CONFIG.utils.endpoint('/auth/logout'), {
                   method: 'POST',
                   headers: {
                       'Authorization': `Bearer ${token}`,
                       'Content-Type': 'application/json'
                   }
               });
           }
       } catch (error) {
           console.error('Error al cerrar sesión:', error);
       } finally {
           // Limpiar almacenamiento local
           localStorage.removeItem(CONFIG.AUTH.TOKEN_KEY);
           localStorage.removeItem(CONFIG.AUTH.USER_KEY);
           localStorage.removeItem(CONFIG.AUTH.ROLE_KEY);
           
           // Actualizar UI
           this.usuarioActual = null;
           this.mostrarMenuGuestMode();
           this.mostrarMensaje('Sesión cerrada correctamente', 'success');
       }
   }

   // 💬 Mostrar mensaje al usuario
   mostrarMensaje(mensaje, tipo = 'info') {
       if (window.Swal) {
           const Toast = Swal.mixin({
               toast: true,
               position: 'top-end',
               showConfirmButton: false,
               timer: 3000,
               timerProgressBar: true
           });

           Toast.fire({
               icon: tipo,
               title: mensaje
           });
       } else {
           alert(mensaje);
       }
   }
}

// 🚀 Inicialización automática cuando se carga el script
(() => {
   // Esperar a que el DOM esté listo
   if (document.readyState === 'loading') {
       document.addEventListener('DOMContentLoaded', () => {
           window.indexController = new IndexController();
       });
   } else {
       window.indexController = new IndexController();
   }
})();

// 🔧 Funciones globales para uso en HTML
window.cerrarSesion = () => {
   if (window.indexController) {
       window.indexController.cerrarSesion();
   }
};