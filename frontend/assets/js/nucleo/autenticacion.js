/**
 * 🔐 SISTEMA DE AUTENTICACIÓN
 * Sistema Portafolio Docente UNSAAC
 * 
 * Gestión completa de autenticación, sesiones y roles
 */

class SistemaAutenticacion {
   constructor() {
       this.usuario = null;
       this.rolActual = null;
       this.rolesDisponibles = [];
       this.permisos = [];
       this.sesionActiva = false;
       this.listeners = {
           login: [],
           logout: [],
           cambioRol: [],
           cambioPermisos: []
       };
       
       // Estado de autenticación reactivo
       this.estado = {
           autenticado: false,
           cargando: false,
           error: null,
           ultimaVerificacion: null
       };

       this.inicializar();
   }

   /**
    * 🚀 Inicializar sistema de autenticación
    */
   async inicializar() {
       console.log('🔐 Inicializando sistema de autenticación...');
       
       try {
           // Verificar si hay sesión guardada
           await this.verificarSesionGuardada();
           
           // Configurar verificación automática
           this.configurarVerificacionAutomatica();
           
           // Configurar event listeners
           this.configurarEventListeners();
           
       } catch (error) {
           console.error('Error al inicializar autenticación:', error);
           this.actualizarEstado({ error: error.message });
       }
   }

   /**
    * 🔍 Verificar sesión guardada en localStorage
    */
   async verificarSesionGuardada() {
       const token = localStorage.getItem(CONFIG.AUTH.TOKEN_KEY);
       const userData = localStorage.getItem(CONFIG.AUTH.USER_KEY);
       const rolActual = localStorage.getItem(CONFIG.AUTH.ROLE_KEY);

       if (token && userData) {
           try {
               // Verificar si el token sigue siendo válido
               if (this.validarToken(token)) {
                   const usuario = JSON.parse(userData);
                   await this.establecerSesion(usuario, token, rolActual);
                   console.log('✅ Sesión restaurada exitosamente');
               } else {
                   console.log('⚠️ Token expirado, limpiando sesión');
                   this.limpiarSesion();
               }
           } catch (error) {
               console.error('Error al restaurar sesión:', error);
               this.limpiarSesion();
           }
       }
   }

   /**
    * 🔑 Validar token JWT
    */
   validarToken(token) {
       try {
           const payload = JSON.parse(atob(token.split('.')[1]));
           const ahora = Date.now() / 1000;
           return payload.exp > ahora;
       } catch (error) {
           return false;
       }
   }

   /**
    * 🚪 Iniciar sesión
    */
   async iniciarSesion(credenciales) {
       this.actualizarEstado({ cargando: true, error: null });

       try {
           // Validar credenciales localmente
           this.validarCredenciales(credenciales);

           // Enviar petición de login
           const response = await window.api.post('/auth/login', credenciales);
           
           if (response.data.success) {
               const { usuario, token, refreshToken, roles } = response.data;
               
               // Establecer sesión
               await this.establecerSesion(usuario, token, null, refreshToken);
               
               // Si tiene múltiples roles, mostrar selector
               if (roles && roles.length > 1) {
                   this.rolesDisponibles = roles;
                   return { 
                       success: true, 
                       requiereSeleccionRol: true, 
                       roles: roles 
                   };
               } else if (roles && roles.length === 1) {
                   // Un solo rol, establecer automáticamente
                   await this.cambiarRol(roles[0]);
               }

               this.notificarListeners('login', { usuario: this.usuario, rol: this.rolActual });
               
               return { 
                   success: true, 
                   usuario: this.usuario, 
                   rol: this.rolActual,
                   redirectUrl: this.obtenerUrlRedireccion()
               };
           } else {
               throw new Error(response.data.message || 'Credenciales inválidas');
           }

       } catch (error) {
           this.actualizarEstado({ 
               cargando: false, 
               error: error.message || 'Error al iniciar sesión' 
           });
           throw error;
       }
   }

   /**
    * 🎭 Cambiar rol activo
    */
   async cambiarRol(nuevoRol) {
       if (!this.rolesDisponibles.includes(nuevoRol)) {
           throw new Error(`Rol '${nuevoRol}' no disponible para este usuario`);
       }

       try {
           // Verificar rol con el servidor
           const response = await window.api.post('/auth/switch-role', { rol: nuevoRol });
           
           if (response.data.success) {
               const rolAnterior = this.rolActual;
               this.rolActual = nuevoRol;
               this.permisos = response.data.permisos || [];

               // Guardar rol actual
               localStorage.setItem(CONFIG.AUTH.ROLE_KEY, nuevoRol);

               // Actualizar estado
               this.actualizarEstado({ 
                   autenticado: true, 
                   cargando: false, 
                   error: null 
               });

               // Notificar cambio
               this.notificarListeners('cambioRol', { 
                   rolAnterior, 
                   rolNuevo: nuevoRol,
                   permisos: this.permisos
               });

               console.log(`🎭 Rol cambiado a: ${nuevoRol}`);
               return true;
           } else {
               throw new Error(response.data.message || 'Error al cambiar rol');
           }

       } catch (error) {
           console.error('Error al cambiar rol:', error);
           throw error;
       }
   }

   /**
    * 🔄 Establecer sesión completa
    */
   async establecerSesion(usuario, token, rol = null, refreshToken = null) {
       this.usuario = usuario;
       this.sesionActiva = true;

       // Guardar en localStorage
       localStorage.setItem(CONFIG.AUTH.TOKEN_KEY, token);
       localStorage.setItem(CONFIG.AUTH.USER_KEY, JSON.stringify(usuario));
       
       if (refreshToken) {
           localStorage.setItem(CONFIG.AUTH.REFRESH_TOKEN_KEY, refreshToken);
       }

       // Obtener roles disponibles si no se proporcionaron
       if (!this.rolesDisponibles.length) {
           await this.cargarRolesDisponibles();
       }

       // Establecer rol si se proporciona
       if (rol && this.rolesDisponibles.includes(rol)) {
           await this.cambiarRol(rol);
       }

       // Actualizar estado
       this.actualizarEstado({ 
           autenticado: true, 
           cargando: false, 
           error: null,
           ultimaVerificacion: Date.now()
       });

       console.log('✅ Sesión establecida para:', usuario.nombres);
   }

   /**
    * 📋 Cargar roles disponibles del usuario
    */
   async cargarRolesDisponibles() {
       try {
           const response = await window.api.get('/roles/mis-roles');
           this.rolesDisponibles = response.data.roles || [];
           return this.rolesDisponibles;
       } catch (error) {
           console.error('Error al cargar roles:', error);
           this.rolesDisponibles = [];
           return [];
       }
   }

   /**
    * 🚪 Cerrar sesión
    */
   async cerrarSesion(cerrarTodasLasSesiones = false) {
       this.actualizarEstado({ cargando: true });

       try {
           // Notificar al servidor
           const endpoint = cerrarTodasLasSesiones ? '/auth/logout-all' : '/auth/logout';
           await window.api.post(endpoint);

       } catch (error) {
           console.warn('Error al cerrar sesión en servidor:', error);
           // Continuar con logout local aunque falle el servidor
       } finally {
           // Limpiar sesión local
           this.limpiarSesion();
           
           // Notificar listeners
           this.notificarListeners('logout', { 
               usuario: this.usuario,
               cerrarTodas: cerrarTodasLasSesiones
           });

           // Redirigir a login
           this.redirigirALogin();
       }
   }

   /**
    * 🧹 Limpiar sesión local
    */
   limpiarSesion() {
       this.usuario = null;
       this.rolActual = null;
       this.rolesDisponibles = [];
       this.permisos = [];
       this.sesionActiva = false;

       // Limpiar localStorage
       localStorage.removeItem(CONFIG.AUTH.TOKEN_KEY);
       localStorage.removeItem(CONFIG.AUTH.REFRESH_TOKEN_KEY);
       localStorage.removeItem(CONFIG.AUTH.USER_KEY);
       localStorage.removeItem(CONFIG.AUTH.ROLE_KEY);

       // Limpiar cache del API
       if (window.api) {
           window.api.limpiarCache();
       }

       // Actualizar estado
       this.actualizarEstado({ 
           autenticado: false, 
           cargando: false, 
           error: null 
       });

       console.log('🧹 Sesión limpiada');
   }

   /**
    * 🔍 Verificar permisos
    */
   tienePermiso(permiso) {
       if (!this.sesionActiva || !this.rolActual) {
           return false;
       }

       // Administrador tiene todos los permisos
       if (this.rolActual === CONFIG.ROLES.ROLES.ADMINISTRADOR) {
           return true;
       }

       // Verificar permiso específico
       return this.permisos.includes(permiso) || 
              CONFIG.ROLES.PERMISOS_BASE[this.rolActual]?.includes(permiso);
   }

   /**
    * 🎭 Verificar rol
    */
   tieneRol(rol) {
       return this.rolesDisponibles.includes(rol);
   }

   /**
    * 🎯 Verificar si es el rol actual
    */
   esRolActual(rol) {
       return this.rolActual === rol;
   }

   /**
    * 🌐 Obtener URL de redirección según rol
    */
   obtenerUrlRedireccion() {
       if (!this.rolActual) {
           return '/paginas/autenticacion/selector-rol.html';
       }
       
       return CONFIG.ROLES.RUTAS_POR_ROL[this.rolActual] || '/paginas/compartidas/perfil.html';
   }

   /**
    * 🔄 Redirigir a login
    */
   redirigirALogin() {
       const rutaActual = window.location.pathname;
       const rutasPublicas = [
           '/paginas/autenticacion/login.html',
           '/paginas/autenticacion/recuperar.html',
           '/paginas/autenticacion/restablecer-clave.html'
       ];

       if (!rutasPublicas.includes(rutaActual)) {
           // Guardar ruta actual para redirección después del login
           sessionStorage.setItem('redirectAfterLogin', window.location.href);
           window.location.href = '/paginas/autenticacion/login.html';
       }
   }

   /**
    * 🛡️ Proteger ruta
    */
   protegerRuta(rolesPermitidos = [], permisosRequeridos = []) {
       if (!this.sesionActiva) {
           this.redirigirALogin();
           return false;
       }

       // Verificar roles si se especifican
       if (rolesPermitidos.length > 0) {
           const tieneRolPermitido = rolesPermitidos.some(rol => this.esRolActual(rol));
           if (!tieneRolPermitido) {
               window.location.href = '/paginas/errores/403.html';
               return false;
           }
       }

       // Verificar permisos si se especifican
       if (permisosRequeridos.length > 0) {
           const tienePermisosRequeridos = permisosRequeridos.every(permiso => this.tienePermiso(permiso));
           if (!tienePermisosRequeridos) {
               window.location.href = '/paginas/errores/403.html';
               return false;
           }
       }

       return true;
   }

   /**
    * ✅ Validar credenciales localmente
    */
   validarCredenciales(credenciales) {
       if (!credenciales.correo || !credenciales.contrasena) {
           throw new Error('Correo y contraseña son requeridos');
       }

       if (!CONFIG.VALIDACIONES.EMAIL.PATRON.test(credenciales.correo)) {
           throw new Error('Formato de correo inválido');
       }

       if (credenciales.contrasena.length < CONFIG.VALIDACIONES.PASSWORD.MIN_LENGTH) {
           throw new Error(`La contraseña debe tener al menos ${CONFIG.VALIDACIONES.PASSWORD.MIN_LENGTH} caracteres`);
       }
   }

   /**
    * 🔄 Configurar verificación automática de sesión
    */
   configurarVerificacionAutomatica() {
       // Verificar sesión cada 5 minutos
       setInterval(async () => {
           if (this.sesionActiva) {
               await this.verificarSesion();
           }
       }, 5 * 60 * 1000);

       // Verificar al ganar foco la ventana
       window.addEventListener('focus', async () => {
           if (this.sesionActiva) {
               const tiempoDesdeUltimaVerificacion = Date.now() - (this.estado.ultimaVerificacion || 0);
               if (tiempoDesdeUltimaVerificacion > 2 * 60 * 1000) { // 2 minutos
                   await this.verificarSesion();
               }
           }
       });
   }

   /**
    * 🔍 Verificar estado de sesión con el servidor
    */
   async verificarSesion() {
       try {
           const response = await window.api.get('/auth/me');
           
           if (response.data.success) {
               // Actualizar datos del usuario si es necesario
               const usuarioServidor = response.data.usuario;
               if (JSON.stringify(this.usuario) !== JSON.stringify(usuarioServidor)) {
                   this.usuario = usuarioServidor;
                   localStorage.setItem(CONFIG.AUTH.USER_KEY, JSON.stringify(usuarioServidor));
               }

               this.actualizarEstado({ ultimaVerificacion: Date.now() });
           } else {
               throw new Error('Sesión no válida');
           }

       } catch (error) {
           console.warn('Sesión inválida, cerrando sesión local');
           this.limpiarSesion();
           this.redirigirALogin();
       }
   }

   /**
    * 🔔 Configurar event listeners del sistema
    */
   configurarEventListeners() {
       // Cerrar sesión al cerrar ventana/pestaña
       window.addEventListener('beforeunload', () => {
           if (this.sesionActiva) {
               navigator.sendBeacon(`${CONFIG.API.API_PREFIX}/auth/heartbeat`, JSON.stringify({
                   action: 'close_tab',
                   timestamp: Date.now()
               }));
           }
       });

       // Detectar cambios en localStorage (para múltiples pestañas)
       window.addEventListener('storage', (e) => {
           if (e.key === CONFIG.AUTH.TOKEN_KEY) {
               if (!e.newValue && this.sesionActiva) {
                   // Token removido en otra pestaña
                   this.limpiarSesion();
                   window.location.reload();
               }
           }
       });
   }

   /**
    * 🔄 Actualizar estado interno
    */
   actualizarEstado(nuevoEstado) {
       this.estado = { ...this.estado, ...nuevoEstado };
       
       // Notificar cambios de estado si hay listeners
       if (this.listeners.estadoCambiado) {
           this.notificarListeners('estadoCambiado', this.estado);
       }
   }

   // ==========================================
   // 🔔 SISTEMA DE EVENTOS
   // ==========================================

   /**
    * 📡 Agregar listener de eventos
    */
   addEventListener(evento, callback) {
       if (!this.listeners[evento]) {
           this.listeners[evento] = [];
       }
       this.listeners[evento].push(callback);
   }

   /**
    * 🔇 Remover listener de eventos
    */
   removeEventListener(evento, callback) {
       if (this.listeners[evento]) {
           this.listeners[evento] = this.listeners[evento].filter(cb => cb !== callback);
       }
   }

   /**
    * 📢 Notificar listeners
    */
   notificarListeners(evento, data) {
       if (this.listeners[evento]) {
           this.listeners[evento].forEach(callback => {
               try {
                   callback(data);
               } catch (error) {
                   console.error(`Error en listener de ${evento}:`, error);
               }
           });
       }
   }

   // ==========================================
   // 🛠️ MÉTODOS UTILITARIOS
   // ==========================================

   /**
    * 📊 Obtener información del usuario actual
    */
   obtenerUsuario() {
       return {
           usuario: this.usuario,
           rolActual: this.rolActual,
           rolesDisponibles: this.rolesDisponibles,
           permisos: this.permisos,
           sesionActiva: this.sesionActiva,
           estado: this.estado
       };
   }

   /**
    * 🎯 Obtener solo datos públicos del usuario
    */
   obtenerUsuarioPublico() {
       if (!this.usuario) return null;
       
       return {
           id: this.usuario.id,
           nombres: this.usuario.nombres,
           apellidos: this.usuario.apellidos,
           correo: this.usuario.correo,
           avatar: this.usuario.avatar,
           rolActual: this.rolActual
       };
   }

   /**
    * 🔍 Verificar si está autenticado
    */
   estaAutenticado() {
       return this.sesionActiva && !!this.usuario && !!this.rolActual;
   }

   /**
    * ⏱️ Obtener tiempo restante de sesión
    */
   obtenerTiempoRestanteSesion() {
       const token = localStorage.getItem(CONFIG.AUTH.TOKEN_KEY);
       if (!token) return 0;

       try {
           const payload = JSON.parse(atob(token.split('.')[1]));
           const expiracion = payload.exp * 1000;
           const ahora = Date.now();
           return Math.max(0, expiracion - ahora);
       } catch (error) {
           return 0;
       }
   }

   /**
    * 🚨 Verificar si la sesión expira pronto
    */
   sesionExpiraPronto() {
       const tiempoRestante = this.obtenerTiempoRestanteSesion();
       const limiteTiempo = CONFIG.AUTH.REFRESH_BEFORE_EXPIRE * 60 * 1000;
       return tiempoRestante <= limiteTiempo && tiempoRestante > 0;
   }
}

// 🚀 Crear instancia global
window.auth = new SistemaAutenticacion();

// 📤 Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
   module.exports = SistemaAutenticacion;
}

// 🔔 Eventos globales útiles
window.addEventListener('load', () => {
   console.log('🔐 Sistema de autenticación listo');
});

console.log('🔐 Módulo de autenticación cargado correctamente');