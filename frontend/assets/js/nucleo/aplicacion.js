/**
 * 🚀 APLICACIÓN PRINCIPAL
 * Sistema Portafolio Docente UNSAAC
 * 
 * Controlador principal que inicializa toda la aplicación
 * Gestiona el estado global, rutas y coordinación entre módulos
 */

class Aplicacion {
   constructor() {
       this.inicializada = false;
       this.modulosCargados = new Set();
       this.estadoGlobal = {
           usuario: null,
           rolActual: null,
           cicloActivo: null,
           configuracion: null,
           notificaciones: []
       };
       
       // Configuración de la aplicación
       this.config = {
           version: '2.0.0',
           nombre: 'Sistema Portafolio Docente UNSAAC',
           debug: CONFIGURACION.ENTORNO.desarrollo,
           autoGuardado: true,
           intervaloAutoGuardado: 30000, // 30 segundos
           maxReintentos: 3
       };

       // Eventos globales
       this.eventos = new EventTarget();
       
       // Bind methods
       this.manejarError = this.manejarError.bind(this);
       this.manejarCambioRed = this.manejarCambioRed.bind(this);
       this.autoGuardar = this.autoGuardar.bind(this);
   }

   /**
    * 🚀 Inicializar la aplicación
    */
   async inicializar() {
       try {
           console.log(`🚀 Iniciando ${this.config.nombre} v${this.config.version}`);
           
           // 1. Verificar compatibilidad del navegador
           if (!this.verificarCompatibilidad()) {
               throw new Error('Navegador no compatible');
           }

           // 2. Configurar manejadores globales
           this.configurarManejadoresGlobales();

           // 3. Inicializar sistemas core
           await this.inicializarSistemasCore();

           // 4. Verificar autenticación
           await this.verificarAutenticacion();

           // 5. Cargar configuración inicial
           await this.cargarConfiguracionInicial();

           // 6. Inicializar interfaz
           await this.inicializarInterfaz();

           // 7. Configurar auto-guardado
           this.configurarAutoGuardado();

           // 8. Marcar como inicializada
           this.inicializada = true;
           
           console.log('✅ Aplicación inicializada correctamente');
           this.emitirEvento('aplicacion:inicializada');

       } catch (error) {
           console.error('❌ Error al inicializar aplicación:', error);
           await this.manejarErrorInicializacion(error);
       }
   }

   /**
    * 🔍 Verificar compatibilidad del navegador
    */
   verificarCompatibilidad() {
       const caracteristicasRequeridas = [
           'localStorage',
           'sessionStorage',
           'fetch',
           'Promise',
           'EventTarget'
       ];

       const faltantes = caracteristicasRequeridas.filter(caracteristica => 
           !(caracteristica in window)
       );

       if (faltantes.length > 0) {
           console.error('❌ Características faltantes:', faltantes);
           return false;
       }

       return true;
   }

   /**
    * ⚙️ Configurar manejadores globales
    */
   configurarManejadoresGlobales() {
       // Manejo de errores globales
       window.addEventListener('error', this.manejarError);
       window.addEventListener('unhandledrejection', this.manejarError);

       // Manejo de cambios de red
       window.addEventListener('online', this.manejarCambioRed);
       window.addEventListener('offline', this.manejarCambioRed);

       // Manejo de cambio de visibilidad
       document.addEventListener('visibilitychange', () => {
           if (document.hidden) {
               this.pausarOperaciones();
           } else {
               this.reanudarOperaciones();
           }
       });

       // Manejo de cierre de ventana
       window.addEventListener('beforeunload', (event) => {
           if (this.hayDatosSinGuardar()) {
               event.preventDefault();
               event.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro de salir?';
               return event.returnValue;
           }
       });
   }

   /**
    * 🏗️ Inicializar sistemas core
    */
   async inicializarSistemasCore() {
       try {
           // Inicializar cliente API
           if (window.clienteAPI) {
               await window.clienteAPI.inicializar();
               this.registrarModulo('clienteAPI');
           }

           // Inicializar sistema de autenticación
           if (window.sistemaAutenticacion) {
               await window.sistemaAutenticacion.inicializar();
               this.registrarModulo('sistemaAutenticacion');
           }

           // Inicializar enrutador
           if (window.enrutador) {
               await window.enrutador.inicializar();
               this.registrarModulo('enrutador');
           }

           console.log('✅ Sistemas core inicializados');
       } catch (error) {
           throw new Error(`Error inicializando sistemas core: ${error.message}`);
       }
   }

   /**
    * 🔐 Verificar autenticación
    */
   async verificarAutenticacion() {
       try {
           const token = localStorage.getItem('token');
           
           if (!token) {
               console.log('📝 No hay token, redirigiendo a login');
               this.redirigirALogin();
               return;
           }

           // Verificar token con el backend
           const usuario = await window.sistemaAutenticacion.verificarToken();
           
           if (usuario) {
               this.estadoGlobal.usuario = usuario;
               this.estadoGlobal.rolActual = usuario.rolActual;
               console.log('✅ Usuario autenticado:', usuario.nombres);
           } else {
               this.redirigirALogin();
           }

       } catch (error) {
           console.error('❌ Error verificando autenticación:', error);
           this.redirigirALogin();
       }
   }

   /**
    * ⚙️ Cargar configuración inicial
    */
   async cargarConfiguracionInicial() {
       try {
           // Cargar configuración del sistema
           if (this.estadoGlobal.usuario) {
               const configuracion = await this.obtenerConfiguracion();
               this.estadoGlobal.configuracion = configuracion;

               // Cargar ciclo activo
               const cicloActivo = await this.obtenerCicloActivo();
               this.estadoGlobal.cicloActivo = cicloActivo;
           }

           console.log('✅ Configuración inicial cargada');
       } catch (error) {
           console.warn('⚠️ Error cargando configuración inicial:', error);
       }
   }

   /**
    * 🎨 Inicializar interfaz
    */
   async inicializarInterfaz() {
       try {
           // Inicializar componentes globales
           if (window.componenteBarraSuperior) {
               await window.componenteBarraSuperior.inicializar();
               this.registrarModulo('componenteBarraSuperior');
           }

           if (window.componenteNavegacionLateral) {
               await window.componenteNavegacionLateral.inicializar();
               this.registrarModulo('componenteNavegacionLateral');
           }

           if (window.sistemaModales) {
               await window.sistemaModales.inicializar();
               this.registrarModulo('sistemaModales');
           }

           // Aplicar tema guardado
           this.aplicarTema();

           // Mostrar interfaz
           this.mostrarInterfaz();

           console.log('✅ Interfaz inicializada');
       } catch (error) {
           throw new Error(`Error inicializando interfaz: ${error.message}`);
       }
   }

   /**
    * 💾 Configurar auto-guardado
    */
   configurarAutoGuardado() {
       if (this.config.autoGuardado) {
           setInterval(this.autoGuardar, this.config.intervaloAutoGuardado);
       }
   }

   /**
    * 📝 Registrar módulo cargado
    */
   registrarModulo(nombreModulo) {
       this.modulosCargados.add(nombreModulo);
       console.log(`📦 Módulo registrado: ${nombreModulo}`);
   }

   /**
    * 🔄 Cambiar rol del usuario
    */
   async cambiarRol(nuevoRol) {
       try {
           const rolCambiado = await window.sistemaAutenticacion.cambiarRol(nuevoRol);
           
           if (rolCambiado) {
               this.estadoGlobal.rolActual = nuevoRol;
               this.emitirEvento('aplicacion:rolCambiado', { rol: nuevoRol });
               
               // Recargar interfaz según el nuevo rol
               await this.recargarInterfazPorRol();
               
               Utilidades.mostrarNotificacion('success', `Rol cambiado a ${nuevoRol}`);
           }
       } catch (error) {
           console.error('❌ Error cambiando rol:', error);
           Utilidades.mostrarNotificacion('error', 'Error al cambiar rol');
       }
   }

   /**
    * 🔄 Actualizar estado global
    */
   actualizarEstado(clave, valor) {
       const valorAnterior = this.estadoGlobal[clave];
       this.estadoGlobal[clave] = valor;
       
       this.emitirEvento('aplicacion:estadoCambiado', {
           clave,
           valorAnterior,
           valorNuevo: valor
       });
   }

   /**
    * 📡 Emitir evento global
    */
   emitirEvento(tipo, datos = {}) {
       const evento = new CustomEvent(tipo, { detail: datos });
       this.eventos.dispatchEvent(evento);
       
       if (this.config.debug) {
           console.log(`📡 Evento emitido: ${tipo}`, datos);
       }
   }

   /**
    * 👂 Escuchar evento global
    */
   escucharEvento(tipo, callback) {
       this.eventos.addEventListener(tipo, callback);
   }

   /**
    * ❌ Manejo de errores globales
    */
   manejarError(event) {
       const error = event.error || event.reason;
       
       console.error('❌ Error global capturado:', error);
       
       // Enviar error al sistema de logging
       this.registrarError(error);
       
       // Mostrar notificación al usuario si es crítico
       if (this.esErrorCritico(error)) {
           Utilidades.mostrarNotificacion('error', 
               'Ha ocurrido un error. El equipo técnico ha sido notificado.'
           );
       }
   }

   /**
    * 🌐 Manejo de cambios de red
    */
   manejarCambioRed(event) {
       if (event.type === 'offline') {
           this.emitirEvento('aplicacion:desconectado');
           Utilidades.mostrarNotificacion('warning', 
               'Sin conexión a internet. Trabajando en modo offline.'
           );
       } else {
           this.emitirEvento('aplicacion:conectado');
           Utilidades.mostrarNotificacion('success', 'Conexión restablecida');
           this.sincronizarDatos();
       }
   }

   /**
    * 💾 Auto-guardar datos
    */
   async autoGuardar() {
       if (!this.inicializada || !navigator.onLine) return;

       try {
           const datosParaGuardar = this.obtenerDatosParaAutoGuardar();
           
           if (datosParaGuardar && Object.keys(datosParaGuardar).length > 0) {
               await this.guardarDatosLocalmente(datosParaGuardar);
               
               if (this.config.debug) {
                   console.log('💾 Auto-guardado realizado');
               }
           }
       } catch (error) {
           console.error('❌ Error en auto-guardado:', error);
       }
   }

   /**
    * 🔄 Reiniciar aplicación
    */
   async reiniciar() {
       try {
           console.log('🔄 Reiniciando aplicación...');
           
           // Limpiar datos temporales
           this.limpiarDatosTemporales();
           
           // Reinicializar
           this.inicializada = false;
           this.modulosCargados.clear();
           
           await this.inicializar();
           
       } catch (error) {
           console.error('❌ Error reiniciando aplicación:', error);
           location.reload(); // Fallback
       }
   }

   /**
    * 🚪 Cerrar sesión
    */
   async cerrarSesion() {
       try {
           // Guardar datos pendientes
           await this.guardarDatosPendientes();
           
           // Cerrar sesión en el sistema de autenticación
           await window.sistemaAutenticacion.cerrarSesion();
           
           // Limpiar estado
           this.estadoGlobal.usuario = null;
           this.estadoGlobal.rolActual = null;
           
           // Redirigir a login
           this.redirigirALogin();
           
       } catch (error) {
           console.error('❌ Error cerrando sesión:', error);
           // Forzar limpieza local
           localStorage.clear();
           sessionStorage.clear();
           location.href = '/login.html';
       }
   }

   // ==========================================
   // MÉTODOS AUXILIARES
   // ==========================================

   async obtenerConfiguracion() {
       // Implementar llamada al servicio de configuración
       return {};
   }

   async obtenerCicloActivo() {
       // Implementar llamada al servicio de ciclos
       return null;
   }

   redirigirALogin() {
       if (location.pathname !== '/login.html') {
           sessionStorage.setItem('urlAnterior', location.href);
           location.href = '/login.html';
       }
   }

   aplicarTema() {
       const tema = localStorage.getItem('tema') || 'tema-unsaac';
       document.body.className = tema;
   }

   mostrarInterfaz() {
       document.body.style.visibility = 'visible';
       document.body.style.opacity = '1';
   }

   async recargarInterfazPorRol() {
       // Implementar recarga de menús y componentes según rol
       if (window.componenteNavegacionLateral) {
           await window.componenteNavegacionLateral.actualizarMenuPorRol();
       }
   }

   pausarOperaciones() {
       // Pausar operaciones automáticas cuando la ventana no está visible
   }

   reanudarOperaciones() {
       // Reanudar operaciones cuando la ventana vuelve a estar visible
   }

   hayDatosSinGuardar() {
       // Verificar si hay datos sin guardar
       return false;
   }

   obtenerDatosParaAutoGuardar() {
       // Obtener datos que necesitan auto-guardado
       return {};
   }

   async guardarDatosLocalmente(datos) {
       localStorage.setItem('autoGuardado', JSON.stringify({
           datos,
           timestamp: Date.now()
       }));
   }

   registrarError(error) {
       // Enviar error al sistema de logging
       console.error('Error registrado:', error);
   }

   esErrorCritico(error) {
       return error.message.includes('TypeError') || 
              error.message.includes('ReferenceError');
   }

   async sincronizarDatos() {
       // Sincronizar datos cuando se restablece la conexión
   }

   limpiarDatosTemporales() {
       sessionStorage.clear();
   }

   async guardarDatosPendientes() {
       // Guardar cualquier dato pendiente antes de cerrar sesión
   }

   async manejarErrorInicializacion(error) {
       // Mostrar página de error de inicialización
       document.body.innerHTML = `
           <div class="error-inicializacion">
               <h1>Error al inicializar la aplicación</h1>
               <p>${error.message}</p>
               <button onclick="location.reload()">Reintentar</button>
           </div>
       `;
   }
}

// ==========================================
// INICIALIZACIÓN GLOBAL
// ==========================================

// Crear instancia global de la aplicación
window.aplicacion = new Aplicacion();

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', () => {
       window.aplicacion.inicializar();
   });
} else {
   window.aplicacion.inicializar();
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
   module.exports = Aplicacion;
}