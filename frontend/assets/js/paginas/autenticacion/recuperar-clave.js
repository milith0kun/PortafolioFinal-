/**
 * 🔓 SISTEMA DE RECUPERACIÓN DE CONTRASEÑA
 * Sistema Portafolio Docente UNSAAC
 * 
 * Maneja el proceso completo de recuperación de contraseña:
 * 1. Solicitud de recuperación por correo
 * 2. Verificación de token
 * 3. Establecimiento de nueva contraseña
 */

class RecuperarClave {
   constructor() {
       this.servicioAuth = new ServicioAutenticacion();
       this.validador = new ValidadorFormularios();
       
       // Elementos del DOM
       this.elementos = {
           pasos: null,
           formularios: {
               solicitud: null,
               verificacion: null,
               nuevaClave: null
           },
           botones: {},
           contenedores: {}
       };
       
       // Estado del componente
       this.estado = {
           pasoActual: 1,
           correoSolicitado: '',
           tokenVerificacion: '',
           enviando: false,
           tiempoExpiracion: null,
           intentosRestantes: 3
       };
       
       // Configuración
       this.config = {
           tiempoEsperaReenvio: 60, // segundos
           longitudToken: 6,
           tiempoExpiracionToken: 15 * 60 * 1000, // 15 minutos
           patronCorreo: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
       };

       this.inicializar();
   }

   /**
    * Inicializa el sistema de recuperación
    */
   async inicializar() {
       try {
           await this.verificarRedireccionAutenticado();
           this.configurarElementos();
           this.configurarValidaciones();
           this.configurarEventos();
           this.verificarParametrosURL();
           this.aplicarTemas();
           
           console.log('✅ Sistema RecuperarClave inicializado correctamente');
       } catch (error) {
           console.error('❌ Error al inicializar RecuperarClave:', error);
           this.mostrarErrorSistema();
       }
   }

   /**
    * Verifica si el usuario ya está autenticado
    */
   async verificarRedireccionAutenticado() {
       if (SistemaAutenticacion.estaAutenticado()) {
           const usuario = SistemaAutenticacion.obtenerUsuario();
           const rol = SistemaAutenticacion.obtenerRolActual();
           
           await Utilidades.mostrarInfo(
               'Ya tienes una sesión activa',
               `Bienvenido ${usuario.nombres}, serás redirigido a tu dashboard`
           );
           
           setTimeout(() => {
               const rutaDashboard = this.obtenerRutaDashboard(rol);
               window.location.href = rutaDashboard;
           }, 2000);
           
           throw new Error('Usuario ya autenticado');
       }
   }

   /**
    * Obtiene la ruta del dashboard según el rol
    */
   obtenerRutaDashboard(rol) {
       const rutas = {
           'administrador': '/paginas/administrador/tablero.html',
           'verificador': '/paginas/verificador/tablero.html',
           'docente': '/paginas/docente/tablero.html'
       };
       return rutas[rol] || '/';
   }

   /**
    * Configura los elementos del DOM
    */
   configurarElementos() {
       // Contenedores principales
       this.elementos.contenedores = {
           pasos: document.getElementById('contenedor-pasos'),
           solicitud: document.getElementById('paso-solicitud'),
           verificacion: document.getElementById('paso-verificacion'),
           nuevaClave: document.getElementById('paso-nueva-clave'),
           exito: document.getElementById('paso-exito')
       };

       // Formularios
       this.elementos.formularios = {
           solicitud: document.getElementById('form-solicitar-recuperacion'),
           verificacion: document.getElementById('form-verificar-token'),
           nuevaClave: document.getElementById('form-nueva-clave')
       };

       // Botones principales
       this.elementos.botones = {
           solicitar: document.getElementById('btn-solicitar'),
           verificar: document.getElementById('btn-verificar'),
           establecer: document.getElementById('btn-establecer-clave'),
           reenviar: document.getElementById('btn-reenviar-codigo'),
           volver: document.getElementById('btn-volver-login')
       };

       this.validarElementosRequeridos();
   }

   /**
    * Valida que todos los elementos requeridos existan
    */
   validarElementosRequeridos() {
       const elementosRequeridos = [
           this.elementos.formularios.solicitud,
           this.elementos.formularios.verificacion,
           this.elementos.formularios.nuevaClave
       ];

       const faltantes = elementosRequeridos.filter(elemento => !elemento);
       
       if (faltantes.length > 0) {
           throw new Error('Elementos del DOM faltantes para RecuperarClave');
       }
   }

   /**
    * Configura las validaciones de todos los formularios
    */
   configurarValidaciones() {
       // Validaciones para solicitud de recuperación
       const reglasSolicitud = {
           'correo': [
               { regla: 'requerido', mensaje: 'El correo electrónico es requerido' },
               { regla: 'correo', mensaje: 'Ingresa un correo electrónico válido' },
               { regla: 'correoInstitucional', mensaje: 'Debe ser un correo de UNSAAC (@unsaac.edu.pe)' }
           ]
       };

       // Validaciones para verificación de token
       const reglasVerificacion = {
           'token': [
               { regla: 'requerido', mensaje: 'El código de verificación es requerido' },
               { regla: 'longitud', valor: this.config.longitudToken, mensaje: `El código debe tener ${this.config.longitudToken} dígitos` },
               { regla: 'numerico', mensaje: 'El código solo debe contener números' }
           ]
       };

       // Validaciones para nueva contraseña
       const reglasNuevaClave = {
           'nueva-clave': [
               { regla: 'requerido', mensaje: 'La nueva contraseña es requerida' },
               { regla: 'longitudMinima', valor: 8, mensaje: 'Mínimo 8 caracteres' },
               { regla: 'contrasenaSegura', mensaje: 'Debe contener mayúsculas, minúsculas, números y símbolos' }
           ],
           'confirmar-clave': [
               { regla: 'requerido', mensaje: 'Confirma la nueva contraseña' },
               { regla: 'coincidir', campo: 'nueva-clave', mensaje: 'Las contraseñas no coinciden' }
           ]
       };

       // Aplicar validaciones
       this.validador.configurarValidaciones(this.elementos.formularios.solicitud, reglasSolicitud);
       this.validador.configurarValidaciones(this.elementos.formularios.verificacion, reglasVerificacion);
       this.validador.configurarValidaciones(this.elementos.formularios.nuevaClave, reglasNuevaClave);
   }

   /**
    * Configura todos los eventos del sistema
    */
   configurarEventos() {
       // Eventos de formularios
       this.configurarEventosFormularios();
       
       // Eventos de botones especiales
       this.configurarEventosBotones();
       
       // Eventos de teclado
       this.configurarEventosTeclado();
       
       // Eventos de validación en tiempo real
       this.configurarValidacionTiempoReal();
   }

   /**
    * Configura eventos de los formularios
    */
   configurarEventosFormularios() {
       // Formulario de solicitud
       this.elementos.formularios.solicitud.addEventListener('submit', (e) => {
           e.preventDefault();
           this.procesarSolicitudRecuperacion();
       });

       // Formulario de verificación
       this.elementos.formularios.verificacion.addEventListener('submit', (e) => {
           e.preventDefault();
           this.procesarVerificacionToken();
       });

       // Formulario de nueva contraseña
       this.elementos.formularios.nuevaClave.addEventListener('submit', (e) => {
           e.preventDefault();
           this.procesarNuevaClave();
       });
   }

   /**
    * Configura eventos de botones especiales
    */
   configurarEventosBotones() {
       // Botón reenviar código
       if (this.elementos.botones.reenviar) {
           this.elementos.botones.reenviar.addEventListener('click', () => {
               this.reenviarCodigo();
           });
       }

       // Botón volver al login
       if (this.elementos.botones.volver) {
           this.elementos.botones.volver.addEventListener('click', () => {
               window.location.href = '/paginas/autenticacion/login.html';
           });
       }

       // Botones para mostrar/ocultar contraseñas
       this.configurarBotonesVisibilidad();
   }

   /**
    * Configura eventos de teclado
    */
   configurarEventosTeclado() {
       document.addEventListener('keydown', (e) => {
           if (e.key === 'Escape') {
               this.volverAlLogin();
           }
       });

       // Auto-avance en campos de token
       const camposToken = document.querySelectorAll('.campo-token');
       camposToken.forEach((campo, index) => {
           campo.addEventListener('input', (e) => {
               if (e.target.value.length === 1 && index < camposToken.length - 1) {
                   camposToken[index + 1].focus();
               }
           });

           campo.addEventListener('keydown', (e) => {
               if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                   camposToken[index - 1].focus();
               }
           });
       });
   }

   /**
    * Configura validación en tiempo real
    */
   configurarValidacionTiempoReal() {
       // Validación de correo en tiempo real
       const campoCorreo = document.getElementById('correo');
       if (campoCorreo) {
           campoCorreo.addEventListener('input', 
               Utilidades.debounce(() => {
                   this.validarCorreoTiempoReal(campoCorreo);
               }, 500)
           );
       }

       // Validación de contraseñas en tiempo real
       const nuevaClave = document.getElementById('nueva-clave');
       const confirmarClave = document.getElementById('confirmar-clave');
       
       if (nuevaClave && confirmarClave) {
           [nuevaClave, confirmarClave].forEach(campo => {
               campo.addEventListener('input', () => {
                   this.validarCoincidenciaClaves();
               });
           });
       }
   }

   /**
    * Valida correo en tiempo real
    */
   validarCorreoTiempoReal(campo) {
       const correo = campo.value.trim();
       
       if (correo.length > 0) {
           const esValido = this.config.patronCorreo.test(correo);
           const esInstitucional = correo.endsWith('@unsaac.edu.pe');
           
           let mensaje = '';
           if (!esValido) {
               mensaje = 'Formato de correo inválido';
           } else if (!esInstitucional) {
               mensaje = 'Debe ser un correo institucional (@unsaac.edu.pe)';
           }
           
           this.validador.mostrarEstadoValidacion(campo, esValido && esInstitucional, mensaje);
       }
   }

   /**
    * Procesa la solicitud de recuperación
    */
   async procesarSolicitudRecuperacion() {
       try {
           if (!this.validador.validarFormulario(this.elementos.formularios.solicitud)) {
               return;
           }

           this.activarCarga(this.elementos.botones.solicitar, 'Enviando solicitud...');

           const formData = new FormData(this.elementos.formularios.solicitud);
           const correo = formData.get('correo').trim();
           
           this.estado.correoSolicitado = correo;

           const resultado = await this.servicioAuth.solicitarRecuperacion(correo);

           if (resultado.exito) {
               await this.procesarSolicitudExitosa(resultado);
           } else {
               this.procesarErrorSolicitud(resultado.mensaje);
           }

       } catch (error) {
           console.error('❌ Error en solicitud de recuperación:', error);
           Utilidades.mostrarError('Error del sistema. Intenta nuevamente.');
       } finally {
           this.desactivarCarga(this.elementos.botones.solicitar, 'Enviar solicitud');
       }
   }

   /**
    * Procesa solicitud exitosa
    */
   async procesarSolicitudExitosa(resultado) {
       await Utilidades.mostrarExito(
           'Código enviado',
           `Se ha enviado un código de verificación a ${this.estado.correoSolicitado}`
       );

       // Avanzar al siguiente paso
       this.avanzarPaso(2);
       
       // Configurar tiempo de expiración
       this.configurarTiempoExpiracion();
       
       // Mostrar información del paso
       this.mostrarInfoVerificacion();
   }

   /**
    * Procesa errores de solicitud
    */
   procesarErrorSolicitud(mensaje) {
       if (mensaje.includes('usuario no encontrado') || mensaje.includes('correo no registrado')) {
           Utilidades.mostrarAdvertencia(
               'Correo no encontrado',
               'El correo ingresado no está registrado en el sistema'
           );
       } else {
           Utilidades.mostrarError(mensaje || 'Error al procesar la solicitud');
       }
   }

   /**
    * Configura el tiempo de expiración del token
    */
   configurarTiempoExpiracion() {
       this.estado.tiempoExpiracion = Date.now() + this.config.tiempoExpiracionToken;
       this.iniciarContadorExpiracion();
   }

   /**
    * Inicia el contador de expiración
    */
   iniciarContadorExpiracion() {
       const actualizarContador = () => {
           const tiempoRestante = this.estado.tiempoExpiracion - Date.now();
           
           if (tiempoRestante <= 0) {
               this.procesarTokenExpirado();
               return;
           }
           
           const minutos = Math.floor(tiempoRestante / 60000);
           const segundos = Math.floor((tiempoRestante % 60000) / 1000);
           
           const elementoContador = document.getElementById('tiempo-expiracion');
           if (elementoContador) {
               elementoContador.textContent = `${minutos}:${segundos.toString().padStart(2, '0')}`;
           }
           
           setTimeout(actualizarContador, 1000);
       };
       
       actualizarContador();
   }

   /**
    * Procesa token expirado
    */
   async procesarTokenExpirado() {
       await Utilidades.mostrarAdvertencia(
           'Código expirado',
           'El código de verificación ha expirado. Solicita uno nuevo.'
       );
       
       this.retrocederPaso(1);
   }

   /**
    * Procesa la verificación del token
    */
   async procesarVerificacionToken() {
       try {
           if (!this.validador.validarFormulario(this.elementos.formularios.verificacion)) {
               return;
           }

           this.activarCarga(this.elementos.botones.verificar, 'Verificando...');

           const token = this.obtenerTokenCompleto();
           this.estado.tokenVerificacion = token;

           const resultado = await this.servicioAuth.verificarTokenRecuperacion({
               correo: this.estado.correoSolicitado,
               token: token
           });

           if (resultado.exito) {
               await this.procesarVerificacionExitosa();
           } else {
               this.procesarErrorVerificacion(resultado.mensaje);
           }

       } catch (error) {
           console.error('❌ Error en verificación:', error);
           Utilidades.mostrarError('Error del sistema. Intenta nuevamente.');
       } finally {
           this.desactivarCarga(this.elementos.botones.verificar, 'Verificar código');
       }
   }

   /**
    * Obtiene el token completo de los campos
    */
   obtenerTokenCompleto() {
       const camposToken = document.querySelectorAll('.campo-token');
       return Array.from(camposToken).map(campo => campo.value).join('');
   }

   /**
    * Procesa verificación exitosa
    */
   async procesarVerificacionExitosa() {
       await Utilidades.mostrarExito(
           'Código verificado',
           'Ahora puedes establecer tu nueva contraseña'
       );
       
       this.avanzarPaso(3);
   }

   /**
    * Procesa errores de verificación
    */
   procesarErrorVerificacion(mensaje) {
       this.estado.intentosRestantes--;
       
       if (this.estado.intentosRestantes <= 0) {
           Utilidades.mostrarError(
               'Demasiados intentos fallidos',
               'Por seguridad, debes solicitar un nuevo código'
           );
           setTimeout(() => {
               this.retrocederPaso(1);
           }, 3000);
       } else {
           Utilidades.mostrarAdvertencia(
               'Código incorrecto',
               `${mensaje}. Te quedan ${this.estado.intentosRestantes} intentos`
           );
           this.limpiarCamposToken();
       }
   }

   /**
    * Procesa el establecimiento de nueva contraseña
    */
   async procesarNuevaClave() {
       try {
           if (!this.validador.validarFormulario(this.elementos.formularios.nuevaClave)) {
               return;
           }

           this.activarCarga(this.elementos.botones.establecer, 'Guardando contraseña...');

           const formData = new FormData(this.elementos.formularios.nuevaClave);
           const datos = {
               correo: this.estado.correoSolicitado,
               token: this.estado.tokenVerificacion,
               nuevaClave: formData.get('nueva-clave'),
               confirmarClave: formData.get('confirmar-clave')
           };

           const resultado = await this.servicioAuth.restablecerContrasena(datos);

           if (resultado.exito) {
               await this.procesarRestablecimientoExitoso();
           } else {
               this.procesarErrorRestablecimiento(resultado.mensaje);
           }

       } catch (error) {
           console.error('❌ Error al restablecer contraseña:', error);
           Utilidades.mostrarError('Error del sistema. Intenta nuevamente.');
       } finally {
           this.desactivarCarga(this.elementos.botones.establecer, 'Establecer contraseña');
       }
   }

   /**
    * Procesa restablecimiento exitoso
    */
   async procesarRestablecimientoExitoso() {
       await Utilidades.mostrarExito(
           '¡Contraseña restablecida!',
           'Tu contraseña ha sido actualizada exitosamente'
       );
       
       this.avanzarPaso(4);
       
       // Auto-redirigir al login después de 5 segundos
       setTimeout(() => {
           window.location.href = '/paginas/autenticacion/login.html';
       }, 5000);
   }

   /**
    * Procesa errores de restablecimiento
    */
   procesarErrorRestablecimiento(mensaje) {
       if (mensaje.includes('token') || mensaje.includes('expirado')) {
           Utilidades.mostrarError(
               'Token expirado',
               'El proceso de recuperación ha expirado. Inicia nuevamente.'
           );
           setTimeout(() => {
               this.retrocederPaso(1);
           }, 3000);
       } else {
           Utilidades.mostrarError(mensaje || 'Error al restablecer la contraseña');
       }
   }

   /**
    * Reenvía el código de verificación
    */
   async reenviarCodigo() {
       try {
           this.activarCarga(this.elementos.botones.reenviar, 'Reenviando...');
           
           const resultado = await this.servicioAuth.solicitarRecuperacion(this.estado.correoSolicitado);
           
           if (resultado.exito) {
               await Utilidades.mostrarExito(
                   'Código reenviado',
                   'Se ha enviado un nuevo código a tu correo'
               );
               
               // Resetear intentos y tiempo
               this.estado.intentosRestantes = 3;
               this.configurarTiempoExpiracion();
               this.limpiarCamposToken();
               
           } else {
               Utilidades.mostrarError('Error al reenviar el código');
           }
           
       } catch (error) {
           console.error('❌ Error al reenviar código:', error);
           Utilidades.mostrarError('Error del sistema');
       } finally {
           this.desactivarCarga(this.elementos.botones.reenviar, 'Reenviar código');
       }
   }

   /**
    * Limpia los campos del token
    */
   limpiarCamposToken() {
       const camposToken = document.querySelectorAll('.campo-token');
       camposToken.forEach(campo => {
           campo.value = '';
       });
       if (camposToken[0]) {
           camposToken[0].focus();
       }
   }

   /**
    * Avanza al siguiente paso
    */
   avanzarPaso(numeroPaso) {
       this.estado.pasoActual = numeroPaso;
       this.actualizarVistaPasos();
   }

   /**
    * Retrocede a un paso anterior
    */
   retrocederPaso(numeroPaso) {
       this.estado.pasoActual = numeroPaso;
       this.actualizarVistaPasos();
       this.reiniciarEstado();
   }

   /**
    * Actualiza la vista según el paso actual
    */
   actualizarVistaPasos() {
       // Ocultar todos los pasos
       Object.values(this.elementos.contenedores).forEach(contenedor => {
           if (contenedor) {
               contenedor.style.display = 'none';
           }
       });

       // Mostrar paso actual
       const pasos = ['', 'solicitud', 'verificacion', 'nuevaClave', 'exito'];
       const pasoActual = pasos[this.estado.pasoActual];
       
       if (this.elementos.contenedores[pasoActual]) {
           this.elementos.contenedores[pasoActual].style.display = 'block';
       }

       // Actualizar indicador de progreso
       this.actualizarIndicadorProgreso();
   }

   /**
    * Actualiza el indicador de progreso
    */
   actualizarIndicadorProgreso() {
       const indicadores = document.querySelectorAll('.indicador-paso');
       indicadores.forEach((indicador, index) => {
           const numeroPaso = index + 1;
           
           if (numeroPaso < this.estado.pasoActual) {
               indicador.classList.add('completado');
               indicador.classList.remove('activo');
           } else if (numeroPaso === this.estado.pasoActual) {
               indicador.classList.add('activo');
               indicador.classList.remove('completado');
           } else {
               indicador.classList.remove('activo', 'completado');
           }
       });
   }

   /**
    * Reinicia el estado del componente
    */
   reiniciarEstado() {
       this.estado = {
           ...this.estado,
           correoSolicitado: '',
           tokenVerificacion: '',
           tiempoExpiracion: null,
           intentosRestantes: 3
       };
       
       // Limpiar formularios
       Object.values(this.elementos.formularios).forEach(form => {
           if (form) form.reset();
       });
   }

   /**
    * Verifica parámetros en la URL
    */
   verificarParametrosURL() {
       const params = new URLSearchParams(window.location.search);
       const token = params.get('token');
       const correo = params.get('correo');
       
       if (token && correo) {
           // Enlace directo desde email
           this.estado.correoSolicitado = correo;
           this.estado.tokenVerificacion = token;
           this.avanzarPaso(3); // Ir directamente a nueva contraseña
       }
   }

   /**
    * Muestra información del paso de verificación
    */
   mostrarInfoVerificacion() {
       const elementoCorreo = document.getElementById('correo-verificacion');
       if (elementoCorreo) {
           elementoCorreo.textContent = this.estado.correoSolicitado;
       }
   }

   /**
    * Configura botones de visibilidad de contraseñas
    */
   configurarBotonesVisibilidad() {
       const botones = document.querySelectorAll('.btn-mostrar-clave');
       botones.forEach(boton => {
           boton.addEventListener('click', () => {
               const input = boton.previousElementSibling;
               if (input) {
                   const mostrar = input.type === 'password';
                   input.type = mostrar ? 'text' : 'password';
                   
                   const icono = boton.querySelector('i');
                   if (icono) {
                       icono.className = mostrar ? 'fas fa-eye-slash' : 'fas fa-eye';
                   }
               }
           });
       });
   }

   /**
    * Valida coincidencia de contraseñas
    */
   validarCoincidenciaClaves() {
       const nuevaClave = document.getElementById('nueva-clave');
       const confirmarClave = document.getElementById('confirmar-clave');
       
       if (nuevaClave && confirmarClave && confirmarClave.value) {
           const coinciden = nuevaClave.value === confirmarClave.value;
           
           this.validador.mostrarEstadoValidacion(
               confirmarClave,
               coinciden,
               coinciden ? '' : 'Las contraseñas no coinciden'
           );
       }
   }

   /**
    * Activa estado de carga en un botón
    */
   activarCarga(boton, texto) {
       if (boton) {
           this.estado.enviando = true;
           boton.disabled = true;
           boton.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>${texto}`;
       }
   }

   /**
    * Desactiva estado de carga en un botón
    */
   desactivarCarga(boton, textoOriginal) {
       if (boton) {
           this.estado.enviando = false;
           boton.disabled = false;
           boton.innerHTML = textoOriginal;
       }
   }

   /**
    * Vuelve a la página de login
    */
   volverAlLogin() {
       window.location.href = '/paginas/autenticacion/login.html';
   }

   /**
    * Muestra error del sistema
    */
   mostrarErrorSistema() {
       Utilidades.mostrarError(
           'Error del sistema',
           'No se pudo cargar la página correctamente. Intenta recargar.'
       );
   }

   /**
    * Aplica temas y estilos
    */
   aplicarTemas() {
       const tema = localStorage.getItem('tema-preferido') || 'tema-unsaac';
       document.body.classList.add(tema);
   }

   /**
    * Destructor del componente
    */
   destruir() {
       // Limpiar timers
       if (this.contadorTimer) {
           clearTimeout(this.contadorTimer);
       }
       
       console.log('🧹 Componente RecuperarClave destruido');
   }
}

// 🚀 Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
   if (window.location.pathname.includes('recuperar')) {
       window.componenteRecuperarClave = new RecuperarClave();
   }
});

// 📤 Exportar para uso global
window.RecuperarClave = RecuperarClave;