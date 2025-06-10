/**
 * 🔐 SERVICIO DE AUTENTICACIÓN
 * Sistema Portafolio Docente UNSAAC
 * 
 * Servicio especializado para todas las operaciones de autenticación
 * Interfaz entre el frontend y los endpoints de auth del backend
 */

class ServicioAutenticacion {
   constructor() {
       this.baseURL = '/auth';
       this.endpoints = {
           LOGIN: '/login',
           LOGOUT: '/logout',
           LOGOUT_ALL: '/logout-all',
           REFRESH: '/refresh',
           ME: '/me',
           FORGOT_PASSWORD: '/forgot-password',
           RESET_PASSWORD: '/reset-password',
           CHANGE_PASSWORD: '/change-password',
           VERIFY_PASSWORD: '/verify-password',
           SWITCH_ROLE: '/switch-role',
           SESSIONS: '/sessions',
           PERMISSIONS: '/permissions'
       };
   }

   // ==========================================
   // 🚪 OPERACIONES DE SESIÓN
   // ==========================================

   /**
    * 🔑 Iniciar sesión
    */
   async login(credenciales) {
       try {
           // Validaciones previas
           this.validarCredencialesLogin(credenciales);

           // Preparar datos
           const datosLogin = {
               correo: credenciales.correo.toLowerCase().trim(),
               contrasena: credenciales.contrasena,
               recordar: credenciales.recordar || false,
               dispositivoInfo: this.obtenerInfoDispositivo()
           };

           console.log('🔑 Iniciando sesión para:', datosLogin.correo);

           // Realizar petición
           const response = await window.api.post(this.baseURL + this.endpoints.LOGIN, datosLogin);

           if (response.data.success) {
               const { usuario, token, refreshToken, roles, permisos } = response.data;

               // Procesar respuesta exitosa
               const resultado = {
                   success: true,
                   usuario: usuario,
                   token: token,
                   refreshToken: refreshToken,
                   roles: roles || [],
                   permisos: permisos || [],
                   requiereSeleccionRol: roles && roles.length > 1,
                   mensaje: response.data.message || 'Inicio de sesión exitoso'
               };

               // Log de éxito
               console.log('✅ Inicio de sesión exitoso:', {
                   usuario: usuario.nombres + ' ' + usuario.apellidos,
                   roles: roles,
                   requiereSeleccion: resultado.requiereSeleccionRol
               });

               // Métricas
               this.enviarMetricaLogin('success', usuario.id);

               return resultado;

           } else {
               throw new Error(response.data.message || 'Credenciales inválidas');
           }

       } catch (error) {
           console.error('❌ Error en login:', error);
           
           // Métricas de error
           this.enviarMetricaLogin('failed', null, error.message);
           
           // Procesar error específico
           const errorProcesado = this.procesarErrorLogin(error);
           throw errorProcesado;
       }
   }

   /**
    * 🚪 Cerrar sesión
    */
   async logout(cerrarTodasLasSesiones = false) {
       try {
           const usuario = window.auth?.obtenerUsuario();
           const endpoint = cerrarTodasLasSesiones ? 
               this.endpoints.LOGOUT_ALL : 
               this.endpoints.LOGOUT;

           console.log(`🚪 Cerrando sesión${cerrarTodasLasSesiones ? ' (todas las sesiones)' : ''}...`);

           // Intentar notificar al servidor
           try {
               await window.api.post(this.baseURL + endpoint, {
                   timestamp: Date.now(),
                   dispositivo: this.obtenerInfoDispositivo()
               });
           } catch (error) {
               console.warn('⚠️ Error al notificar logout al servidor:', error);
               // Continuar con logout local aunque falle
           }

           // Métricas
           this.enviarMetricaLogout(usuario?.usuario?.id, cerrarTodasLasSesiones);

           console.log('✅ Sesión cerrada exitosamente');

           return {
               success: true,
               mensaje: 'Sesión cerrada exitosamente',
               cerrarTodas: cerrarTodasLasSesiones
           };

       } catch (error) {
           console.error('❌ Error en logout:', error);
           
           // Aún así devolver éxito para logout local
           return {
               success: true,
               mensaje: 'Sesión cerrada localmente',
               error: error.message
           };
       }
   }

   /**
    * 🔄 Refrescar token
    */
   async refreshToken() {
       try {
           const refreshToken = localStorage.getItem(CONFIG.AUTH.REFRESH_TOKEN_KEY);
           
           if (!refreshToken) {
               throw new Error('No hay token de actualización disponible');
           }

           console.log('🔄 Refrescando token de autenticación...');

           const response = await window.api.post(this.baseURL + this.endpoints.REFRESH, {
               refreshToken: refreshToken
           });

           if (response.data.success) {
               const { token, refreshToken: newRefreshToken, usuario } = response.data;

               console.log('✅ Token refrescado exitosamente');

               return {
                   success: true,
                   token: token,
                   refreshToken: newRefreshToken,
                   usuario: usuario
               };

           } else {
               throw new Error(response.data.message || 'No se pudo refrescar el token');
           }

       } catch (error) {
           console.error('❌ Error al refrescar token:', error);
           throw new Error('Token de actualización inválido');
       }
   }

   /**
    * 👤 Obtener información del usuario actual
    */
   async me() {
       try {
           console.log('👤 Obteniendo información del usuario actual...');

           const response = await window.api.get(this.baseURL + this.endpoints.ME);

           if (response.data.success) {
               return {
                   success: true,
                   usuario: response.data.usuario,
                   rolActual: response.data.rolActual,
                   roles: response.data.roles,
                   permisos: response.data.permisos,
                   sesiones: response.data.sesiones
               };
           } else {
               throw new Error(response.data.message || 'No se pudo obtener información del usuario');
           }

       } catch (error) {
           console.error('❌ Error al obtener usuario actual:', error);
           throw error;
       }
   }

   // ==========================================
   // 🎭 GESTIÓN DE ROLES
   // ==========================================

   /**
    * 🎭 Cambiar rol activo
    */
   async cambiarRol(nuevoRol) {
       try {
           // Validar rol
           if (!nuevoRol) {
               throw new Error('Debe especificar un rol');
           }

           console.log(`🎭 Cambiando a rol: ${nuevoRol}`);

           const response = await window.api.post(this.baseURL + this.endpoints.SWITCH_ROLE, {
               rol: nuevoRol,
               timestamp: Date.now()
           });

           if (response.data.success) {
               const { usuario, rolActual, permisos, redirectUrl } = response.data;

               console.log(`✅ Rol cambiado exitosamente a: ${rolActual}`);

               // Métricas
               this.enviarMetricaCambioRol(usuario.id, rolActual);

               return {
                   success: true,
                   usuario: usuario,
                   rolActual: rolActual,
                   permisos: permisos,
                   redirectUrl: redirectUrl,
                   mensaje: `Cambiado a rol: ${this.formatearNombreRol(rolActual)}`
               };

           } else {
               throw new Error(response.data.message || 'No se pudo cambiar el rol');
           }

       } catch (error) {
           console.error('❌ Error al cambiar rol:', error);
           throw error;
       }
   }

   /**
    * 🔑 Obtener permisos actuales
    */
   async obtenerPermisos() {
       try {
           const response = await window.api.get(this.baseURL + this.endpoints.PERMISSIONS);

           if (response.data.success) {
               return {
                   success: true,
                   permisos: response.data.permisos,
                   rolActual: response.data.rolActual
               };
           } else {
               throw new Error(response.data.message || 'No se pudieron obtener los permisos');
           }

       } catch (error) {
           console.error('❌ Error al obtener permisos:', error);
           throw error;
       }
   }

   // ==========================================
   // 🔐 GESTIÓN DE CONTRASEÑAS
   // ==========================================

   /**
    * 📧 Solicitar recuperación de contraseña
    */
   async solicitarRecuperacion(correo) {
       try {
           // Validar email
           if (!Utils.Validacion.esEmailValido(correo)) {
               throw new Error('El formato del correo electrónico no es válido');
           }

           console.log('📧 Solicitando recuperación de contraseña para:', correo);

           const response = await window.api.post(this.baseURL + this.endpoints.FORGOT_PASSWORD, {
               correo: correo.toLowerCase().trim()
           });

           if (response.data.success) {
               console.log('✅ Solicitud de recuperación enviada');

               return {
                   success: true,
                   mensaje: response.data.message || 'Se ha enviado un correo con instrucciones para restablecer tu contraseña'
               };

           } else {
               throw new Error(response.data.message || 'No se pudo procesar la solicitud');
           }

       } catch (error) {
           console.error('❌ Error en recuperación de contraseña:', error);
           throw error;
       }
   }

   /**
    * 🔄 Restablecer contraseña
    */
   async restablecerContrasena(token, nuevaContrasena, confirmarContrasena) {
       try {
           // Validaciones
           this.validarRestablecimientoContrasena(token, nuevaContrasena, confirmarContrasena);

           console.log('🔄 Restableciendo contraseña...');

           const response = await window.api.post(this.baseURL + this.endpoints.RESET_PASSWORD, {
               token: token,
               nuevaContrasena: nuevaContrasena,
               confirmarContrasena: confirmarContrasena
           });

           if (response.data.success) {
               console.log('✅ Contraseña restablecida exitosamente');

               return {
                   success: true,
                   mensaje: response.data.message || 'Contraseña restablecida exitosamente'
               };

           } else {
               throw new Error(response.data.message || 'No se pudo restablecer la contraseña');
           }

       } catch (error) {
           console.error('❌ Error al restablecer contraseña:', error);
           throw error;
       }
   }

   /**
    * 🔐 Cambiar contraseña (usuario autenticado)
    */
   async cambiarContrasena(contrasenaActual, nuevaContrasena, confirmarContrasena) {
       try {
           // Validaciones
           this.validarCambioContrasena(contrasenaActual, nuevaContrasena, confirmarContrasena);

           console.log('🔐 Cambiando contraseña...');

           const response = await window.api.post(this.baseURL + this.endpoints.CHANGE_PASSWORD, {
               contrasenaActual: contrasenaActual,
               nuevaContrasena: nuevaContrasena,
               confirmarContrasena: confirmarContrasena
           });

           if (response.data.success) {
               console.log('✅ Contraseña cambiada exitosamente');

               return {
                   success: true,
                   mensaje: response.data.message || 'Contraseña cambiada exitosamente'
               };

           } else {
               throw new Error(response.data.message || 'No se pudo cambiar la contraseña');
           }

       } catch (error) {
           console.error('❌ Error al cambiar contraseña:', error);
           throw error;
       }
   }

   /**
    * ✅ Verificar contraseña actual
    */
   async verificarContrasena(contrasena) {
       try {
           const response = await window.api.post(this.baseURL + this.endpoints.VERIFY_PASSWORD, {
               contrasena: contrasena
           });

           return {
               success: response.data.success,
               valida: response.data.valida || false
           };

       } catch (error) {
           console.error('❌ Error al verificar contraseña:', error);
           return { success: false, valida: false };
       }
   }

   // ==========================================
   // 📱 GESTIÓN DE SESIONES
   // ==========================================

   /**
    * 📋 Obtener sesiones activas
    */
   async obtenerSesiones() {
       try {
           const response = await window.api.get(this.baseURL + this.endpoints.SESSIONS);

           if (response.data.success) {
               return {
                   success: true,
                   sesiones: response.data.sesiones,
                   sesionActual: response.data.sesionActual
               };
           } else {
               throw new Error(response.data.message || 'No se pudieron obtener las sesiones');
           }

       } catch (error) {
           console.error('❌ Error al obtener sesiones:', error);
           throw error;
       }
   }

   /**
    * 🗑️ Cerrar sesión específica
    */
   async cerrarSesionEspecifica(sessionId) {
       try {
           const response = await window.api.delete(`${this.baseURL + this.endpoints.SESSIONS}/${sessionId}`);

           if (response.data.success) {
               console.log('✅ Sesión específica cerrada');

               return {
                   success: true,
                   mensaje: response.data.message || 'Sesión cerrada exitosamente'
               };

           } else {
               throw new Error(response.data.message || 'No se pudo cerrar la sesión');
           }

       } catch (error) {
           console.error('❌ Error al cerrar sesión específica:', error);
           throw error;
       }
   }

   // ==========================================
   // 🛠️ MÉTODOS AUXILIARES
   // ==========================================

   /**
    * ✅ Validar credenciales de login
    */
   validarCredencialesLogin(credenciales) {
       if (!credenciales.correo) {
           throw new Error('El correo electrónico es requerido');
       }

       if (!credenciales.contrasena) {
           throw new Error('La contraseña es requerida');
       }

       if (!Utils.Validacion.esEmailValido(credenciales.correo)) {
           throw new Error('El formato del correo electrónico no es válido');
       }

       if (credenciales.contrasena.length < 6) {
           throw new Error('La contraseña debe tener al menos 6 caracteres');
       }
   }

   /**
    * ✅ Validar restablecimiento de contraseña
    */
   validarRestablecimientoContrasena(token, nuevaContrasena, confirmarContrasena) {
       if (!token) {
           throw new Error('Token de recuperación requerido');
       }

       if (!nuevaContrasena) {
           throw new Error('La nueva contraseña es requerida');
       }

       if (!confirmarContrasena) {
           throw new Error('Debe confirmar la nueva contraseña');
       }

       if (nuevaContrasena !== confirmarContrasena) {
           throw new Error('Las contraseñas no coinciden');
       }

       if (!Utils.Validacion.esPasswordValida(nuevaContrasena)) {
           throw new Error('La contraseña no cumple con los requisitos de seguridad');
       }
   }

   /**
    * ✅ Validar cambio de contraseña
    */
   validarCambioContrasena(contrasenaActual, nuevaContrasena, confirmarContrasena) {
       if (!contrasenaActual) {
           throw new Error('La contraseña actual es requerida');
       }

       this.validarRestablecimientoContrasena('dummy', nuevaContrasena, confirmarContrasena);

       if (contrasenaActual === nuevaContrasena) {
           throw new Error('La nueva contraseña debe ser diferente a la actual');
       }
   }

   /**
    * 🖥️ Obtener información del dispositivo
    */
   obtenerInfoDispositivo() {
       return {
           userAgent: navigator.userAgent,
           plataforma: navigator.platform,
           idioma: navigator.language,
           resolucion: `${screen.width}x${screen.height}`,
           timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
           esMovil: CONFIG.DISPOSITIVO?.ES_MOVIL || false,
           timestamp: Date.now()
       };
   }

   /**
    * 🚨 Procesar errores de login específicos
    */
   procesarErrorLogin(error) {
       const codigosError = {
           401: 'Credenciales incorrectas',
           423: 'Cuenta bloqueada temporalmente',
           429: 'Demasiados intentos. Intenta más tarde',
           500: 'Error del servidor. Intenta más tarde'
       };

       const mensaje = codigosError[error.status] || error.message || 'Error al iniciar sesión';

       return new Error(mensaje);
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

   // ==========================================
   // 📊 MÉTRICAS Y ANALYTICS
   // ==========================================

   /**
    * 📊 Enviar métrica de login
    */
   enviarMetricaLogin(resultado, usuarioId = null, error = null) {
       if (!CONFIG.METRICAS.TRACKING_HABILITADO) return;

       const evento = {
           tipo: 'login',
           resultado: resultado,
           usuarioId: usuarioId,
           timestamp: Date.now(),
           dispositivo: this.obtenerInfoDispositivo(),
           error: error
       };

       // Enviar a analytics
       if (window.gtag) {
           window.gtag('event', 'login', {
               method: 'password',
               success: resultado === 'success',
               user_id: usuarioId
           });
       }

       console.log('📊 Métrica login:', evento);
   }

   /**
    * 📊 Enviar métrica de logout
    */
   enviarMetricaLogout(usuarioId = null, cerrarTodas = false) {
       if (!CONFIG.METRICAS.TRACKING_HABILITADO) return;

       const evento = {
           tipo: 'logout',
           usuarioId: usuarioId,
           cerrarTodas: cerrarTodas,
           timestamp: Date.now()
       };

       if (window.gtag) {
           window.gtag('event', 'logout', {
               method: cerrarTodas ? 'logout_all' : 'single',
               user_id: usuarioId
           });
       }

       console.log('📊 Métrica logout:', evento);
   }

   /**
    * 📊 Enviar métrica de cambio de rol
    */
   enviarMetricaCambioRol(usuarioId, nuevoRol) {
       if (!CONFIG.METRICAS.TRACKING_HABILITADO) return;

       const evento = {
           tipo: 'cambio_rol',
           usuarioId: usuarioId,
           nuevoRol: nuevoRol,
           timestamp: Date.now()
       };

       if (window.gtag) {
           window.gtag('event', 'role_switch', {
               new_role: nuevoRol,
               user_id: usuarioId
           });
       }

       console.log('📊 Métrica cambio rol:', evento);
   }

   // ==========================================
   // 🔍 MÉTODOS DE VERIFICACIÓN
   // ==========================================

   /**
    * 🔍 Verificar estado del servicio de auth
    */
   async verificarEstado() {
       try {
           const response = await window.api.get('/health/auth');
           return {
               disponible: response.data.status === 'ok',
               mensaje: response.data.message,
               detalles: response.data
           };
       } catch (error) {
           return {
               disponible: false,
               mensaje: 'Servicio de autenticación no disponible',
               error: error.message
           };
       }
   }

   /**
    * 🧪 Probar conectividad
    */
   async probarConectividad() {
       try {
           const tiempoInicio = Date.now();
           await window.api.get('/health');
           const tiempoRespuesta = Date.now() - tiempoInicio;

           return {
               conectado: true,
               tiempoRespuesta: tiempoRespuesta,
               calidad: tiempoRespuesta < 1000 ? 'buena' : tiempoRespuesta < 3000 ? 'regular' : 'mala'
           };
       } catch (error) {
           return {
               conectado: false,
               error: error.message
           };
       }
   }
}

// 🚀 Crear instancia global
window.ServicioAuth = new ServicioAutenticacion();

// 📤 Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
   module.exports = ServicioAutenticacion;
}

console.log('🔐 Servicio de autenticación inicializado correctamente');