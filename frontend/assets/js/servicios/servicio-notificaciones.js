/**
 * 🔔 SERVICIO DE NOTIFICACIONES
 * Sistema Portafolio Docente UNSAAC
 * 
 * Servicio especializado para gestión completa de notificaciones
 * Push notifications, email, sistema interno y tiempo real
 */

class ServicioNotificaciones {
   constructor() {
       this.baseURL = '/api/v1/notificaciones';
       this.clienteAPI = window.clienteAPI;
       
       // Estado de notificaciones
       this.estado = {
           conectado: false,
           subscripcionesPush: new Set(),
           configuracionUsuario: null,
           ultimaActualizacion: null
       };

       // Cache de notificaciones
       this.cache = {
           notificaciones: new Map(),
           noLeidas: 0,
           ttl: 2 * 60 * 1000 // 2 minutos
       };

       // Configuración
       this.config = {
           // Intervalo de polling cuando no hay WebSocket
           intervaloPolling: 30000, // 30 segundos
           
           // Configuración de push notifications
           vapidPublicKey: 'YOUR_VAPID_PUBLIC_KEY', // Debe venir del servidor
           
           // Configuración de sonidos
           sonidos: {
               'sistema': '/assets/sounds/notification.mp3',
               'documento': '/assets/sounds/document.mp3',
               'observacion': '/assets/sounds/message.mp3',
               'ciclo': '/assets/sounds/alert.mp3',
               'asignacion': '/assets/sounds/assignment.mp3'
           },
           
           // Tipos de notificación
           tipos: {
               'sistema': {
                   icono: 'fa-cog',
                   color: 'info',
                   titulo: 'Sistema'
               },
               'documento': {
                   icono: 'fa-file',
                   color: 'primary',
                   titulo: 'Documento'
               },
               'observacion': {
                   icono: 'fa-comment',
                   color: 'warning',
                   titulo: 'Observación'
               },
               'ciclo': {
                   icono: 'fa-calendar',
                   color: 'success',
                   titulo: 'Ciclo Académico'
               },
               'asignacion': {
                   icono: 'fa-user-plus',
                   color: 'secondary',
                   titulo: 'Asignación'
               }
           },

           // Prioridades
           prioridades: {
               'baja': {
                   etiqueta: 'Baja',
                   color: 'success',
                   icono: 'fa-arrow-down'
               },
               'media': {
                   etiqueta: 'Media',
                   color: 'warning',
                   icono: 'fa-minus'
               },
               'alta': {
                   etiqueta: 'Alta',
                   color: 'danger',
                   icono: 'fa-arrow-up'
               },
               'urgente': {
                   etiqueta: 'Urgente',
                   color: 'danger',
                   icono: 'fa-exclamation-triangle'
               }
           }
       };

       // WebSocket para tiempo real
       this.websocket = null;
       this.intentosReconexion = 0;
       this.maxIntentosReconexion = 5;

       // Bind methods
       this.manejarMensajeWebSocket = this.manejarMensajeWebSocket.bind(this);
       this.manejarErrorWebSocket = this.manejarErrorWebSocket.bind(this);
       this.manejarCierreWebSocket = this.manejarCierreWebSocket.bind(this);
       this.polling = this.polling.bind(this);
   }

   /**
    * 🚀 Inicializar el servicio de notificaciones
    */
   async inicializar() {
       try {
           console.log('🔔 Inicializando servicio de notificaciones');

           // Cargar configuración del usuario
           await this.cargarConfiguracionUsuario();

           // Inicializar conexión tiempo real
           await this.inicializarConexionTiempoReal();

           // Configurar push notifications si está habilitado
           if (this.estado.configuracionUsuario?.push_notifications) {
               await this.configurarPushNotifications();
           }

           // Cargar notificaciones iniciales
           await this.cargarNotificacionesIniciales();

           // Configurar listeners globales
           this.configurarListeners();

           console.log('✅ Servicio de notificaciones inicializado');
           
       } catch (error) {
           console.error('❌ Error inicializando servicio de notificaciones:', error);
           
           // Fallback a polling si falla la inicialización
           this.iniciarPolling();
       }
   }

   // ==========================================
   // CONEXIÓN TIEMPO REAL
   // ==========================================

   /**
    * 🌐 Inicializar conexión WebSocket
    */
   async inicializarConexionTiempoReal() {
       try {
           const token = localStorage.getItem('token');
           const baseWS = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
           const host = window.location.host;
           const wsURL = `${baseWS}//${host}/ws/notificaciones?token=${token}`;

           this.websocket = new WebSocket(wsURL);

           this.websocket.onopen = () => {
               console.log('🔌 Conectado a WebSocket de notificaciones');
               this.estado.conectado = true;
               this.intentosReconexion = 0;
               this.detenerPolling();
           };

           this.websocket.onmessage = this.manejarMensajeWebSocket;
           this.websocket.onerror = this.manejarErrorWebSocket;
           this.websocket.onclose = this.manejarCierreWebSocket;

       } catch (error) {
           console.error('❌ Error configurando WebSocket:', error);
           this.iniciarPolling();
       }
   }

   /**
    * 📨 Manejar mensajes del WebSocket
    */
   manejarMensajeWebSocket(event) {
       try {
           const mensaje = JSON.parse(event.data);
           
           switch (mensaje.tipo) {
               case 'nueva_notificacion':
                   this.procesarNuevaNotificacion(mensaje.data);
                   break;
                   
               case 'notificacion_leida':
                   this.marcarComoLeida(mensaje.data.id, false);
                   break;
                   
               case 'notificaciones_masivas':
                   this.procesarNotificacionesMasivas(mensaje.data);
                   break;
                   
               case 'configuracion_actualizada':
                   this.actualizarConfiguracion(mensaje.data);
                   break;
                   
               default:
                   console.warn('⚠️ Tipo de mensaje no reconocido:', mensaje.tipo);
           }
           
       } catch (error) {
           console.error('❌ Error procesando mensaje WebSocket:', error);
       }
   }

   /**
    * ❌ Manejar error de WebSocket
    */
   manejarErrorWebSocket(error) {
       console.error('❌ Error en WebSocket:', error);
       this.estado.conectado = false;
   }

   /**
    * 🔌 Manejar cierre de WebSocket
    */
   manejarCierreWebSocket(event) {
       console.warn('🔌 WebSocket cerrado:', event.code, event.reason);
       this.estado.conectado = false;

       // Intentar reconexión si no fue intencional
       if (event.code !== 1000 && this.intentosReconexion < this.maxIntentosReconexion) {
           setTimeout(() => {
               this.intentosReconexion++;
               console.log(`🔄 Reintentando conexión (${this.intentosReconexion}/${this.maxIntentosReconexion})`);
               this.inicializarConexionTiempoReal();
           }, Math.pow(2, this.intentosReconexion) * 1000); // Backoff exponencial
       } else {
           // Fallback a polling
           this.iniciarPolling();
       }
   }

   // ==========================================
   // POLLING COMO FALLBACK
   // ==========================================

   /**
    * 🔄 Iniciar polling de notificaciones
    */
   iniciarPolling() {
       if (this.intervaloPolling) {
           clearInterval(this.intervaloPolling);
       }

       this.intervaloPolling = setInterval(this.polling, this.config.intervaloPolling);
       console.log('📡 Polling de notificaciones iniciado');
   }

   /**
    * ⏹️ Detener polling
    */
   detenerPolling() {
       if (this.intervaloPolling) {
           clearInterval(this.intervaloPolling);
           this.intervaloPolling = null;
           console.log('📡 Polling de notificaciones detenido');
       }
   }

   /**
    * 📡 Función de polling
    */
   async polling() {
       try {
           const ultimaActualizacion = this.estado.ultimaActualizacion;
           const notificaciones = await this.obtenerNotificaciones({
               desde: ultimaActualizacion,
               solo_nuevas: true
           });

           if (notificaciones.length > 0) {
               notificaciones.forEach(notificacion => {
                   this.procesarNuevaNotificacion(notificacion);
               });
           }

       } catch (error) {
           console.error('❌ Error en polling:', error);
       }
   }

   // ==========================================
   // GESTIÓN DE NOTIFICACIONES
   // ==========================================

   /**
    * 📋 Obtener notificaciones del usuario
    */
   async obtenerNotificaciones(filtros = {}) {
       try {
           const parametros = this.construirParametrosFiltro(filtros);
           
           const respuesta = await this.clienteAPI.get(this.baseURL, {
               params: parametros
           });

           // Actualizar cache
           this.actualizarCache(respuesta.data.notificaciones);
           this.cache.noLeidas = respuesta.data.no_leidas || 0;

           // Actualizar estado
           this.estado.ultimaActualizacion = new Date().toISOString();

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo notificaciones:', error);
           throw error;
       }
   }

   /**
    * 📄 Obtener notificación específica
    */
   async obtenerNotificacion(notificacionId) {
       try {
           const respuesta = await this.clienteAPI.get(`${this.baseURL}/${notificacionId}`);
           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo notificación:', error);
           throw error;
       }
   }

   /**
    * ✅ Marcar notificación como leída
    */
   async marcarComoLeida(notificacionId, actualizarServidor = true) {
       try {
           if (actualizarServidor) {
               await this.clienteAPI.put(`${this.baseURL}/${notificacionId}/marcar-leida`);
           }

           // Actualizar cache local
           if (this.cache.notificaciones.has(notificacionId)) {
               const notificacion = this.cache.notificaciones.get(notificacionId);
               notificacion.visto = true;
               notificacion.fecha_lectura = new Date().toISOString();
           }

           // Actualizar contador
           this.cache.noLeidas = Math.max(0, this.cache.noLeidas - 1);

           // Emitir evento
           this.emitirEvento('notificacion:leida', { id: notificacionId });

       } catch (error) {
           console.error('❌ Error marcando como leída:', error);
           throw error;
       }
   }

   /**
    * ✅ Marcar todas como leídas
    */
   async marcarTodasComoLeidas() {
       try {
           await this.clienteAPI.put(`${this.baseURL}/marcar-todas-leidas`);

           // Actualizar cache
           for (const [id, notificacion] of this.cache.notificaciones) {
               if (!notificacion.visto) {
                   notificacion.visto = true;
                   notificacion.fecha_lectura = new Date().toISOString();
               }
           }

           this.cache.noLeidas = 0;

           // Emitir evento
           this.emitirEvento('notificaciones:todasLeidas');

       } catch (error) {
           console.error('❌ Error marcando todas como leídas:', error);
           throw error;
       }
   }

   /**
    * 🗑️ Eliminar notificación
    */
   async eliminarNotificacion(notificacionId) {
       try {
           await this.clienteAPI.delete(`${this.baseURL}/${notificacionId}`);

           // Actualizar cache
           this.cache.notificaciones.delete(notificacionId);

           // Emitir evento
           this.emitirEvento('notificacion:eliminada', { id: notificacionId });

       } catch (error) {
           console.error('❌ Error eliminando notificación:', error);
           throw error;
       }
   }

   /**
    * 📦 Archivar notificación
    */
   async archivarNotificacion(notificacionId) {
       try {
           await this.clienteAPI.put(`${this.baseURL}/${notificacionId}/archivar`);

           // Actualizar cache
           if (this.cache.notificaciones.has(notificacionId)) {
               this.cache.notificaciones.get(notificacionId).archivada = true;
           }

           // Emitir evento
           this.emitirEvento('notificacion:archivada', { id: notificacionId });

       } catch (error) {
           console.error('❌ Error archivando notificación:', error);
           throw error;
       }
   }

   // ==========================================
   // PROCESAMIENTO DE NOTIFICACIONES
   // ==========================================

   /**
    * 🆕 Procesar nueva notificación
    */
   procesarNuevaNotificacion(notificacion) {
       try {
           // Agregar al cache
           this.cache.notificaciones.set(notificacion.id, notificacion);
           
           if (!notificacion.visto) {
               this.cache.noLeidas++;
           }

           // Mostrar notificación visual
           this.mostrarNotificacionVisual(notificacion);

           // Reproducir sonido si está habilitado
           if (this.estado.configuracionUsuario?.sonidos) {
               this.reproducirSonido(notificacion.tipo);
           }

           // Enviar push notification si está habilitado
           if (this.estado.configuracionUsuario?.push_notifications) {
               this.enviarPushNotification(notificacion);
           }

           // Emitir evento
           this.emitirEvento('notificacion:nueva', notificacion);

           // Actualizar badge de contador
           this.actualizarContadorVisual();

       } catch (error) {
           console.error('❌ Error procesando nueva notificación:', error);
       }
   }

   /**
    * 👀 Mostrar notificación visual
    */
   mostrarNotificacionVisual(notificacion) {
       // Usar SweetAlert2 para notificaciones importantes
       if (notificacion.prioridad === 'urgente') {
           Swal.fire({
               icon: 'warning',
               title: notificacion.titulo,
               text: notificacion.mensaje,
               showConfirmButton: true,
               timer: 10000
           });
           return;
       }

       // Usar toast para notificaciones normales
       if (window.Utilidades) {
           const tipoToast = this.obtenerTipoToast(notificacion.prioridad);
           window.Utilidades.mostrarNotificacion(tipoToast, notificacion.titulo, {
               text: notificacion.mensaje,
               duration: this.obtenerDuracionToast(notificacion.prioridad)
           });
       }
   }

   /**
    * 🔊 Reproducir sonido de notificación
    */
   reproducirSonido(tipo) {
       try {
           const rutaSonido = this.config.sonidos[tipo] || this.config.sonidos['sistema'];
           const audio = new Audio(rutaSonido);
           audio.volume = 0.3; // Volumen moderado
           audio.play().catch(error => {
               console.warn('⚠️ No se pudo reproducir sonido de notificación:', error);
           });
       } catch (error) {
           console.warn('⚠️ Error reproduciendo sonido:', error);
       }
   }

   // ==========================================
   // PUSH NOTIFICATIONS
   // ==========================================

   /**
    * 🔔 Configurar push notifications
    */
   async configurarPushNotifications() {
       try {
           if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
               console.warn('⚠️ Push notifications no soportadas');
               return false;
           }

           // Registrar service worker
           const registration = await navigator.serviceWorker.register('/sw.js');
           
           // Verificar permisos
           const permission = await Notification.requestPermission();
           
           if (permission !== 'granted') {
               console.warn('⚠️ Permisos de notificación denegados');
               return false;
           }

           // Subscribirse a push notifications
           const subscription = await registration.pushManager.subscribe({
               userVisibleOnly: true,
               applicationServerKey: this.urlBase64ToUint8Array(this.config.vapidPublicKey)
           });

           // Enviar subscription al servidor
           await this.enviarSubscripcionAlServidor(subscription);

           console.log('✅ Push notifications configuradas');
           return true;

       } catch (error) {
           console.error('❌ Error configurando push notifications:', error);
           return false;
       }
   }

   /**
    * 📤 Enviar push notification
    */
   async enviarPushNotification(notificacion) {
       try {
           if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
               const registration = await navigator.serviceWorker.ready;
               
               await registration.showNotification(notificacion.titulo, {
                   body: notificacion.mensaje,
                   icon: '/assets/imagenes/iconos/logo.png',
                   badge: '/assets/imagenes/iconos/badge.png',
                   tag: `notificacion-${notificacion.id}`,
                   data: {
                       notificacionId: notificacion.id,
                       enlace: notificacion.enlace
                   },
                   actions: [
                       {
                           action: 'abrir',
                           title: 'Abrir'
                       },
                       {
                           action: 'marcar_leida',
                           title: 'Marcar como leída'
                       }
                   ]
               });
           }
       } catch (error) {
           console.error('❌ Error enviando push notification:', error);
       }
   }

   // ==========================================
   // CONFIGURACIÓN DE USUARIO
   // ==========================================

   /**
    * ⚙️ Cargar configuración del usuario
    */
   async cargarConfiguracionUsuario() {
       try {
           const respuesta = await this.clienteAPI.get(`${this.baseURL}/configuracion`);
           this.estado.configuracionUsuario = respuesta.data;
           return respuesta.data;
       } catch (error) {
           console.error('❌ Error cargando configuración:', error);
           
           // Configuración por defecto
           this.estado.configuracionUsuario = {
               email_notifications: true,
               push_notifications: false,
               sonidos: true,
               solo_importantes: false
           };
       }
   }

   /**
    * 🔧 Actualizar configuración del usuario
    */
   async actualizarConfiguracionUsuario(configuracion) {
       try {
           const respuesta = await this.clienteAPI.put(
               `${this.baseURL}/configuracion`,
               configuracion
           );

           this.estado.configuracionUsuario = respuesta.data;

           // Emitir evento
           this.emitirEvento('configuracion:actualizada', respuesta.data);

           return respuesta.data;
       } catch (error) {
           console.error('❌ Error actualizando configuración:', error);
           throw error;
       }
   }

   // ==========================================
   // MÉTODOS AUXILIARES
   // ==========================================

   /**
    * 📊 Obtener estadísticas de notificaciones
    */
   async obtenerEstadisticas() {
       try {
           const respuesta = await this.clienteAPI.get(`${this.baseURL}/estadisticas`);
           return respuesta.data;
       } catch (error) {
           console.error('❌ Error obteniendo estadísticas:', error);
           throw error;
       }
   }

   /**
    * 🔢 Obtener contador de no leídas
    */
   obtenerContadorNoLeidas() {
       return this.cache.noLeidas;
   }

   /**
    * 📋 Obtener notificaciones desde cache
    */
   obtenerNotificacionesCache() {
       return Array.from(this.cache.notificaciones.values())
           .sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));
   }

   /**
    * 🎯 Construir parámetros de filtro
    */
   construirParametrosFiltro(filtros) {
       const parametros = {};

       if (filtros.tipo) parametros.tipo = filtros.tipo;
       if (filtros.prioridad) parametros.prioridad = filtros.prioridad;
       if (filtros.visto !== undefined) parametros.visto = filtros.visto;
       if (filtros.archivada !== undefined) parametros.archivada = filtros.archivada;
       if (filtros.desde) parametros.desde = filtros.desde;
       if (filtros.hasta) parametros.hasta = filtros.hasta;
       if (filtros.solo_nuevas) parametros.solo_nuevas = filtros.solo_nuevas;
       if (filtros.limit) parametros.limit = filtros.limit;
       if (filtros.offset) parametros.offset = filtros.offset;

       return parametros;
   }

   /**
    * 🔄 Actualizar cache de notificaciones
    */
   actualizarCache(notificaciones) {
       notificaciones.forEach(notificacion => {
           this.cache.notificaciones.set(notificacion.id, {
               ...notificacion,
               timestamp: Date.now()
           });
       });
   }

   /**
    * 📡 Emitir evento global
    */
   emitirEvento(tipo, datos = {}) {
       if (window.aplicacion) {
           window.aplicacion.emitirEvento(`notificaciones:${tipo}`, datos);
       }
   }

   /**
    * 🔊 Obtener tipo de toast según prioridad
    */
   obtenerTipoToast(prioridad) {
       const tipos = {
           'baja': 'info',
           'media': 'warning',
           'alta': 'error',
           'urgente': 'error'
       };
       return tipos[prioridad] || 'info';
   }

   /**
    * ⏱️ Obtener duración de toast según prioridad
    */
   obtenerDuracionToast(prioridad) {
       const duraciones = {
           'baja': 3000,
           'media': 5000,
           'alta': 8000,
           'urgente': 0 // No se auto-oculta
       };
       return duraciones[prioridad] || 5000;
   }

   /**
    * 🔢 Actualizar contador visual
    */
   actualizarContadorVisual() {
       // Actualizar badge en el icono de notificaciones
       const badge = document.querySelector('.contador-notificaciones');
       if (badge) {
           const count = this.cache.noLeidas;
           badge.textContent = count > 99 ? '99+' : count.toString();
           badge.style.display = count > 0 ? 'block' : 'none';
       }

       // Actualizar título del documento
       if (this.cache.noLeidas > 0) {
           document.title = `(${this.cache.noLeidas}) Sistema Portafolio UNSAAC`;
       } else {
           document.title = 'Sistema Portafolio UNSAAC';
       }
   }

   /**
    * 🔧 Configurar listeners globales
    */
   configurarListeners() {
       // Escuchar cuando la página se vuelve visible
       document.addEventListener('visibilitychange', () => {
           if (!document.hidden && this.estado.conectado) {
               // Marcar notificaciones como vistas si el usuario está viendo la página
               this.marcarNotificacionesComoVistas();
           }
       });

       // Escuchar cambios de conexión
       window.addEventListener('online', () => {
           if (!this.estado.conectado) {
               this.inicializarConexionTiempoReal();
           }
       });

       window.addEventListener('offline', () => {
           this.estado.conectado = false;
       });
   }

   /**
    * 👀 Marcar notificaciones como vistas
    */
   async marcarNotificacionesComoVistas() {
       // Implementar lógica para marcar como vistas las notificaciones
       // que el usuario ha podido ver en pantalla
   }

   /**
    * 🧹 Limpiar cache
    */
   limpiarCache() {
       this.cache.notificaciones.clear();
       this.cache.noLeidas = 0;
   }

   /**
    * 🔄 Cargar notificaciones iniciales
    */
   async cargarNotificacionesIniciales() {
       try {
           const datos = await this.obtenerNotificaciones({
               limit: 50,
               visto: false
           });
           
           this.actualizarContadorVisual();
           
       } catch (error) {
           console.error('❌ Error cargando notificaciones iniciales:', error);
       }
   }

   /**
    * 📤 Enviar subscripción al servidor
    */
   async enviarSubscripcionAlServidor(subscription) {
       try {
           await this.clienteAPI.post(`${this.baseURL}/push-subscription`, {
               subscription: subscription.toJSON()
           });
       } catch (error) {
           console.error('❌ Error enviando subscripción:', error);
       }
   }

   /**
    * 🔧 Convertir VAPID key
    */
   urlBase64ToUint8Array(base64String) {
       const padding = '='.repeat((4 - base64String.length % 4) % 4);
       const base64 = (base64String + padding)
           .replace(/-/g, '+')
           .replace(/_/g, '/');

       const rawData = window.atob(base64);
       const outputArray = new Uint8Array(rawData.length);

       for (let i = 0; i < rawData.length; ++i) {
           outputArray[i] = rawData.charCodeAt(i);
       }
       return outputArray;
   }

   /**
    * 🔌 Desconectar servicio
    */
   desconectar() {
       if (this.websocket) {
           this.websocket.close(1000, 'Desconexión manual');
       }
       
       this.detenerPolling();
       this.limpiarCache();
       this.estado.conectado = false;
   }
}

// ==========================================
// INICIALIZACIÓN GLOBAL
// ==========================================

// Crear instancia global del servicio
window.servicioNotificaciones = new ServicioNotificaciones();

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
   module.exports = ServicioNotificaciones;
}