/**
 * 🔐 MANEJADOR DE LOGIN
 * Sistema Portafolio Docente UNSAAC
 * 
 * Manejador para la página de inicio de sesión
 * Incluye validación, autenticación y redirección automática
 */

class ManejadorLogin {
    constructor() {
        this.formularioLogin = null;
        this.elementosDOM = {};
        this.intentosLogin = 0;
        this.maxIntentos = 5;
        this.tiempoBloqueo = 15 * 60 * 1000; // 15 minutos
        
        this.estado = {
            cargando: false,
            bloqueado: false,
            recordarSesion: false
        };

        this.init();
    }

    /**
     * 🚀 Inicializar manejador de login
     */
    async init() {
        try {
            console.log('🔐 Inicializando manejador de login...');

            // Esperar a que CONFIG esté disponible
            await this.esperarConfiguracion();

            // Verificar si ya está autenticado
            await this.verificarAutenticacionExistente();

            // Mapear elementos DOM
            this.mapearElementosDOM();

            // Configurar eventos
            this.configurarEventos();

            // Configurar estado inicial
            this.configurarEstadoInicial();

            // Restaurar datos guardados
            this.restaurarDatosGuardados();

            console.log('✅ Manejador de login inicializado correctamente');

        } catch (error) {
            console.error('❌ Error al inicializar manejador de login:', error);
            this.mostrarErrorInicializacion();
        }
    }

    /**
     * ⏳ Esperar a que la configuración esté disponible
     */
    async esperarConfiguracion() {
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

    /**
     * 🔍 Verificar autenticación existente
     */
    async verificarAutenticacionExistente() {
        const token = this.obtenerToken();
        
        if (token) {
            try {
                const response = await fetch(CONFIG.utils.endpoint('/auth/me'), {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const datosUsuario = await response.json();
                    console.log('✅ Usuario ya autenticado, redirigiendo...');
                    
                    const rutaDestino = this.obtenerRutaDestino(datosUsuario.rolActual);
                    
                    // Pequeño delay para evitar parpadeo
                    setTimeout(() => {
                        window.location.href = rutaDestino;
                    }, 500);
                    
                    return true;
                }
            } catch (error) {
                // Token inválido, continuar con login normal
                this.eliminarToken();
            }
        }
        
        return false;
    }

    /**
     * 🎯 Mapear elementos DOM
     */
    mapearElementosDOM() {
        this.elementosDOM = {
            // Formulario principal
            formularioLogin: document.getElementById('formulario-login'),
            
            // Campos del formulario
            inputCorreo: document.getElementById('correo'),
            inputPassword: document.getElementById('password'),
            checkboxRecordar: document.getElementById('recordar-sesion'),
            
            // Botones
            btnLogin: document.getElementById('btn-login'),
            btnMostrarPassword: document.getElementById('btn-mostrar-password'),
            btnRecuperar: document.getElementById('btn-recuperar-password'),
            
            // Mensajes y alertas
            alertaError: document.getElementById('alerta-error'),
            textoError: document.getElementById('texto-error'),
            alertaExito: document.getElementById('alerta-exito'),
            textoExito: document.getElementById('texto-exito'),
            
            // Carga y estado
            spinnerCarga: document.getElementById('spinner-carga'),
            contenedorFormulario: document.getElementById('contenedor-formulario'),
            
            // Información adicional
            infoIntentos: document.getElementById('info-intentos'),
            contadorBloqueo: document.getElementById('contador-bloqueo'),
            tiempoRestante: document.getElementById('tiempo-restante')
        };

        // Verificar elementos críticos
        if (!this.elementosDOM.formularioLogin) {
            throw new Error('Formulario de login no encontrado');
        }
    }

    /**
     * 🔧 Configurar eventos
     */
    configurarEventos() {
        // Evento submit del formulario
        if (this.elementosDOM.formularioLogin) {
            this.elementosDOM.formularioLogin.addEventListener('submit', (e) => {
                e.preventDefault();
                this.procesarLogin();
            });
        }

        // Mostrar/ocultar contraseña
        if (this.elementosDOM.btnMostrarPassword) {
            this.elementosDOM.btnMostrarPassword.addEventListener('click', () => {
                this.toggleMostrarPassword();
            });
        }

        // Recordar sesión
        if (this.elementosDOM.checkboxRecordar) {
            this.elementosDOM.checkboxRecordar.addEventListener('change', (e) => {
                this.estado.recordarSesion = e.target.checked;
                this.guardarPreferencias();
            });
        }

        // Enter en campos
        if (this.elementosDOM.inputCorreo) {
            this.elementosDOM.inputCorreo.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.elementosDOM.inputPassword?.focus();
                }
            });
        }

        if (this.elementosDOM.inputPassword) {
            this.elementosDOM.inputPassword.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.procesarLogin();
                }
            });
        }

        // Recuperar contraseña
        if (this.elementosDOM.btnRecuperar) {
            this.elementosDOM.btnRecuperar.addEventListener('click', () => {
                this.iniciarRecuperacionPassword();
            });
        }

        // Limpiar mensajes al escribir
        [this.elementosDOM.inputCorreo, this.elementosDOM.inputPassword].forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    this.limpiarMensajes();
                });
            }
        });
    }

    /**
     * ⚙️ Configurar estado inicial
     */
    configurarEstadoInicial() {
        // Verificar si está bloqueado
        this.verificarBloqueoLogin();

        // Enfocar primer campo
        setTimeout(() => {
            this.elementosDOM.inputCorreo?.focus();
        }, 100);
    }

    /**
     * 📊 Restaurar datos guardados
     */
    restaurarDatosGuardados() {
        // Restaurar correo si está guardado
        const correoGuardado = this.obtenerDato('login_correo');
        if (correoGuardado && this.elementosDOM.inputCorreo) {
            this.elementosDOM.inputCorreo.value = correoGuardado;
        }

        // Restaurar preferencia de recordar sesión
        const recordarGuardado = this.obtenerDato('login_recordar');
        if (recordarGuardado && this.elementosDOM.checkboxRecordar) {
            this.elementosDOM.checkboxRecordar.checked = recordarGuardado;
            this.estado.recordarSesion = recordarGuardado;
        }
    }

    // ==========================================
    // 🔐 PROCESO DE LOGIN
    // ==========================================

    /**
     * 🔐 Procesar inicio de sesión
     */
    async procesarLogin() {
        if (this.estado.cargando || this.estado.bloqueado) {
            return;
        }

        try {
            // Limpiar mensajes previos
            this.limpiarMensajes();

            // Validar formulario
            if (!this.validarFormulario()) {
                return;
            }

            // Obtener datos del formulario
            const credenciales = this.obtenerDatosFormulario();

            // Iniciar proceso de carga
            this.iniciarCarga();

            // Realizar login
            const resultado = await this.realizarLogin(credenciales);

            // Procesar resultado
            await this.procesarResultadoLogin(resultado);

        } catch (error) {
            console.error('❌ Error en proceso de login:', error);
            this.mostrarError(error.message || 'Error al iniciar sesión');
            this.incrementarIntentos();
        } finally {
            this.finalizarCarga();
        }
    }

    /**
     * ✅ Validar formulario antes del envío
     */
    validarFormulario() {
        const correo = this.elementosDOM.inputCorreo?.value?.trim();
        const password = this.elementosDOM.inputPassword?.value;

        // Validaciones básicas
        if (!correo) {
            this.mostrarError('El correo electrónico es requerido');
            this.elementosDOM.inputCorreo?.focus();
            return false;
        }

        if (!password) {
            this.mostrarError('La contraseña es requerida');
            this.elementosDOM.inputPassword?.focus();
            return false;
        }

        // Validar formato de correo
        if (!this.esEmailValido(correo)) {
            this.mostrarError('El formato del correo electrónico no es válido');
            this.elementosDOM.inputCorreo?.focus();
            return false;
        }

        return true;
    }

    /**
     * 📊 Obtener datos del formulario
     */
    obtenerDatosFormulario() {
        return {
            correo: this.elementosDOM.inputCorreo?.value?.trim()?.toLowerCase(),
            contrasena: this.elementosDOM.inputPassword?.value,
            recordar: this.estado.recordarSesion
        };
    }

    /**
     * 🌐 Realizar login con el backend
     */
    async realizarLogin(credenciales) {
        console.log('🔐 Realizando login para:', credenciales.correo);

        const response = await fetch(CONFIG.utils.endpoint('/auth/login'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credenciales)
        });

        const resultado = await response.json();
        resultado.success = response.ok;

        console.log('✅ Resultado del login:', resultado.success ? 'EXITOSO' : 'FALLIDO');
        
        return resultado;
    }

    /**
     * 🔄 Procesar resultado del login
     */
    async procesarResultadoLogin(resultado) {
        if (resultado.success) {
            // Login exitoso
            await this.manejarLoginExitoso(resultado);
        } else {
            // Login fallido
            this.manejarLoginFallido(resultado);
        }
    }

    /**
     * ✅ Manejar login exitoso
     */
    async manejarLoginExitoso(resultado) {
        console.log('✅ Login exitoso');

        // Guardar token
        this.guardarToken(resultado.token);

        // Guardar datos del usuario si están disponibles
        if (resultado.usuario) {
            this.guardarUsuario(resultado.usuario);
        }

        // Mostrar mensaje de éxito
        this.mostrarExito('Inicio de sesión exitoso');

        // Guardar preferencias
        this.guardarDatosExitosos();

        // Resetear intentos
        this.resetearIntentos();

        // Determinar redirección
        let rutaDestino;

        if (resultado.requiereSeleccionRol || (resultado.roles && resultado.roles.length > 1)) {
            // Múltiples roles - ir a selector
            rutaDestino = 'selector-rol.html';
            
            // Guardar roles en sessionStorage para selector
            sessionStorage.setItem('roles_disponibles', JSON.stringify(resultado.roles || []));
        } else {
            // Un solo rol - ir directamente al dashboard
            const rol = resultado.rol || resultado.usuario?.rolActual;
            rutaDestino = this.obtenerRutaDestino(rol);
        }

        // Verificar si hay ruta de redirección guardada
        const rutaGuardada = sessionStorage.getItem('redirectAfterLogin');
        if (rutaGuardada) {
            rutaDestino = rutaGuardada;
            sessionStorage.removeItem('redirectAfterLogin');
        }

        console.log('🎯 Redirigiendo a:', rutaDestino);

        // Pequeño delay para mostrar el mensaje de éxito
        setTimeout(() => {
            window.location.href = rutaDestino;
        }, 1000);
    }

    /**
     * ❌ Manejar login fallido
     */
    manejarLoginFallido(resultado) {
        console.log('❌ Login fallido:', resultado.mensaje);

        // Mostrar error específico
        this.mostrarError(resultado.mensaje || 'Credenciales incorrectas');

        // Incrementar intentos
        this.incrementarIntentos();

        // Limpiar contraseña
        if (this.elementosDOM.inputPassword) {
            this.elementosDOM.inputPassword.value = '';
            this.elementosDOM.inputPassword.focus();
        }

        // Agregar animación de error
        this.animarError();
    }

    // ==========================================
    // 🎨 INTERFAZ DE USUARIO
    // ==========================================

    /**
     * ⏳ Iniciar estado de carga
     */
    iniciarCarga() {
        this.estado.cargando = true;

        // Deshabilitar formulario
        if (this.elementosDOM.btnLogin) {
            this.elementosDOM.btnLogin.disabled = true;
            this.elementosDOM.btnLogin.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                Iniciando sesión...
            `;
        }

        // Deshabilitar campos
        [this.elementosDOM.inputCorreo, this.elementosDOM.inputPassword].forEach(input => {
            if (input) input.disabled = true;
        });

        // Mostrar spinner general si existe
        if (this.elementosDOM.spinnerCarga) {
            this.elementosDOM.spinnerCarga.classList.remove('d-none');
        }
    }

    /**
     * ✅ Finalizar estado de carga
     */
    finalizarCarga() {
        this.estado.cargando = false;

        // Rehabilitar formulario
        if (this.elementosDOM.btnLogin) {
            this.elementosDOM.btnLogin.disabled = false;
            this.elementosDOM.btnLogin.innerHTML = `
                <i class="fas fa-sign-in-alt me-2"></i>
                Iniciar Sesión
            `;
        }

        // Rehabilitar campos
        [this.elementosDOM.inputCorreo, this.elementosDOM.inputPassword].forEach(input => {
            if (input) input.disabled = false;
        });

        // Ocultar spinner
        if (this.elementosDOM.spinnerCarga) {
            this.elementosDOM.spinnerCarga.classList.add('d-none');
        }
    }

    /**
     * 🚨 Mostrar mensaje de error
     */
    mostrarError(mensaje) {
        if (this.elementosDOM.alertaError && this.elementosDOM.textoError) {
            this.elementosDOM.textoError.textContent = mensaje;
            this.elementosDOM.alertaError.classList.remove('d-none');
            
            // Auto-ocultar después de 10 segundos
            setTimeout(() => {
                this.limpiarMensajes();
            }, 10000);
        }

        // También mostrar con SweetAlert si está disponible
        if (window.Swal) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: mensaje,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 5000
            });
        }
    }

    /**
     * ✅ Mostrar mensaje de éxito
     */
    mostrarExito(mensaje) {
        if (this.elementosDOM.alertaExito && this.elementosDOM.textoExito) {
            this.elementosDOM.textoExito.textContent = mensaje;
            this.elementosDOM.alertaExito.classList.remove('d-none');
        }

        if (window.Swal) {
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: mensaje,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        }
    }

    /**
     * 🧹 Limpiar mensajes
     */
    limpiarMensajes() {
        if (this.elementosDOM.alertaError) {
            this.elementosDOM.alertaError.classList.add('d-none');
        }
        
        if (this.elementosDOM.alertaExito) {
            this.elementosDOM.alertaExito.classList.add('d-none');
        }
    }

    /**
     * 👁️ Toggle mostrar/ocultar contraseña
     */
    toggleMostrarPassword() {
        const input = this.elementosDOM.inputPassword;
        const btn = this.elementosDOM.btnMostrarPassword;
        
        if (!input || !btn) return;

        const esTipoPassword = input.type === 'password';
        
        input.type = esTipoPassword ? 'text' : 'password';
        
        const icono = btn.querySelector('i');
        if (icono) {
            icono.className = esTipoPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
        }
        
        btn.title = esTipoPassword ? 'Ocultar contraseña' : 'Mostrar contraseña';
    }

    /**
     * 💫 Animar error en formulario
     */
    animarError() {
        if (this.elementosDOM.contenedorFormulario) {
            this.elementosDOM.contenedorFormulario.classList.add('shake');
            setTimeout(() => {
                this.elementosDOM.contenedorFormulario.classList.remove('shake');
            }, 600);
        }
    }

    // ==========================================
    // 🔒 CONTROL DE INTENTOS
    // ==========================================

    /**
     * ➕ Incrementar intentos de login
     */
    incrementarIntentos() {
        this.intentosLogin++;
        
        // Guardar en localStorage
        this.guardarDato('login_intentos', this.intentosLogin);
        this.guardarDato('login_ultimo_intento', Date.now());

        // Actualizar información de intentos
        this.actualizarInfoIntentos();

        // Verificar si debe bloquear
        if (this.intentosLogin >= this.maxIntentos) {
            this.bloquearLogin();
        }
    }

    /**
     * 🔒 Bloquear login por exceso de intentos
     */
    bloquearLogin() {
        this.estado.bloqueado = true;
        
        const tiempoBloqueo = Date.now() + this.tiempoBloqueo;
        this.guardarDato('login_bloqueado_hasta', tiempoBloqueo);

        // Deshabilitar formulario
        this.deshabilitarFormulario();

        // Mostrar contador regresivo
        this.iniciarContadorBloqueo(tiempoBloqueo);

        this.mostrarError(`Demasiados intentos fallidos. Login bloqueado por ${this.tiempoBloqueo / 60000} minutos.`);
    }

    /**
     * 🔄 Verificar bloqueo de login
     */
    verificarBloqueoLogin() {
        const bloqueadoHasta = this.obtenerDato('login_bloqueado_hasta');
        
        if (bloqueadoHasta && Date.now() < bloqueadoHasta) {
            this.estado.bloqueado = true;
            this.deshabilitarFormulario();
            this.iniciarContadorBloqueo(bloqueadoHasta);
            return true;
        }

        // Recuperar intentos guardados
        this.intentosLogin = this.obtenerDato('login_intentos') || 0;
        this.actualizarInfoIntentos();

        return false;
    }

    /**
     * ⏰ Iniciar contador regresivo de bloqueo
     */
    iniciarContadorBloqueo(tiempoLimite) {
        const actualizarContador = () => {
            const tiempoRestante = tiempoLimite - Date.now();
            
            if (tiempoRestante <= 0) {
                // Desbloquear
                this.desbloquearLogin();
                return;
            }

            // Mostrar tiempo restante
            const minutos = Math.floor(tiempoRestante / 60000);
            const segundos = Math.floor((tiempoRestante % 60000) / 1000);
            
            if (this.elementosDOM.tiempoRestante) {
                this.elementosDOM.tiempoRestante.textContent = 
                    `${minutos}:${segundos.toString().padStart(2, '0')}`;
            }
            
            if (this.elementosDOM.contadorBloqueo) {
                this.elementosDOM.contadorBloqueo.classList.remove('d-none');
            }

            setTimeout(actualizarContador, 1000);
        };

        actualizarContador();
    }

    /**
     * 🔓 Desbloquear login
     */
    desbloquearLogin() {
        this.estado.bloqueado = false;
        
        // Limpiar datos de bloqueo
        this.eliminarDato('login_bloqueado_hasta');
        
        // Rehabilitar formulario
        this.habilitarFormulario();
        
        // Ocultar contador
        if (this.elementosDOM.contadorBloqueo) {
            this.elementosDOM.contadorBloqueo.classList.add('d-none');
        }
        
        this.mostrarExito('Login desbloqueado. Puedes intentar de nuevo.');
    }

    /**
     * 🔄 Resetear intentos
     */
    resetearIntentos() {
        this.intentosLogin = 0;
        this.eliminarDato('login_intentos');
        this.eliminarDato('login_ultimo_intento');
        this.eliminarDato('login_bloqueado_hasta');
        
        this.actualizarInfoIntentos();
    }

    // ==========================================
    // 🛠️ MÉTODOS AUXILIARES
    // ==========================================

    /**
     * 📊 Actualizar información de intentos
     */
    actualizarInfoIntentos() {
        if (this.elementosDOM.infoIntentos) {
            const intentosRestantes = this.maxIntentos - this.intentosLogin;
            
            if (this.intentosLogin > 0) {
                this.elementosDOM.infoIntentos.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-1"></i>
                        Intentos restantes: ${intentosRestantes}
                    </div>
                `;
                this.elementosDOM.infoIntentos.classList.remove('d-none');
            } else {
                this.elementosDOM.infoIntentos.classList.add('d-none');
            }
        }
    }

    /**
     * 🔒 Deshabilitar formulario
     */
    deshabilitarFormulario() {
        [
            this.elementosDOM.inputCorreo,
            this.elementosDOM.inputPassword,
            this.elementosDOM.btnLogin,
            this.elementosDOM.checkboxRecordar
        ].forEach(elemento => {
            if (elemento) elemento.disabled = true;
        });
    }

    /**
     * 🔓 Habilitar formulario
     */
    habilitarFormulario() {
        [
            this.elementosDOM.inputCorreo,
            this.elementosDOM.inputPassword,
            this.elementosDOM.btnLogin,
            this.elementosDOM.checkboxRecordar
        ].forEach(elemento => {
            if (elemento) elemento.disabled = false;
        });
    }

    /**
     * 💾 Guardar datos exitosos
     */
    guardarDatosExitosos() {
        // Guardar correo si el usuario quiere recordar
        if (this.estado.recordarSesion) {
            this.guardarDato('login_correo', this.elementosDOM.inputCorreo?.value?.trim());
        } else {
            this.eliminarDato('login_correo');
        }

        // Guardar preferencia de recordar
        this.guardarDato('login_recordar', this.estado.recordarSesion);
    }

    /**
     * 💾 Guardar preferencias
     */
    guardarPreferencias() {
        this.guardarDato('login_recordar', this.estado.recordarSesion);
    }

    /**
     * 🎯 Obtener ruta de destino según rol
     */
    obtenerRutaDestino(rol) {
        if (CONFIG?.ROLES?.RUTAS_POR_ROL) {
            return CONFIG.ROLES.RUTAS_POR_ROL[rol] || '../compartidas/perfil.html';
        }
        
        // Fallback rutas
        const rutas = {
            'administrador': '../administrador/tablero.html',
            'docente': '../docente/tablero.html',
            'verificador': '../verificador/tablero.html'
        };
        
        return rutas[rol] || '../compartidas/perfil.html';
    }

    /**
     * 🔗 Iniciar recuperación de contraseña
     */
    async iniciarRecuperacionPassword() {
        const correo = this.elementosDOM.inputCorreo?.value?.trim();
        
        if (!correo) {
            this.mostrarError('Ingresa tu correo electrónico para recuperar la contraseña');
            this.elementosDOM.inputCorreo?.focus();
            return;
        }

        if (!this.esEmailValido(correo)) {
            this.mostrarError('Ingresa un correo electrónico válido');
            this.elementosDOM.inputCorreo?.focus();
            return;
        }

        // Redirigir a página de recuperación con el correo
        const url = `recuperar.html?correo=${encodeURIComponent(correo)}`;
        window.location.href = url;
    }

    /**
     * 🚨 Mostrar error de inicialización
     */
    mostrarErrorInicializacion() {
        document.body.innerHTML = `
            <div class="container-fluid vh-100 d-flex align-items-center justify-content-center">
                <div class="text-center">
                    <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                    <h4>Error de Inicialización</h4>
                    <p class="text-muted">No se pudo cargar la página de login correctamente.</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">
                        <i class="fas fa-redo me-2"></i>Reintentar
                    </button>
                </div>
            </div>
        `;
    }

    // ==========================================
    // 🗄️ UTILIDADES DE ALMACENAMIENTO
    // ==========================================

    guardarDato(clave, valor) {
        try {
            localStorage.setItem(clave, JSON.stringify(valor));
        } catch (error) {
            console.warn('Error guardando en localStorage:', error);
        }
    }

    obtenerDato(clave) {
        try {
            const valor = localStorage.getItem(clave);
            return valor ? JSON.parse(valor) : null;
        } catch (error) {
            console.warn('Error obteniendo de localStorage:', error);
            return null;
        }
    }

    eliminarDato(clave) {
        try {
            localStorage.removeItem(clave);
        } catch (error) {
            console.warn('Error eliminando de localStorage:', error);
        }
    }

    guardarToken(token) {
        const clave = CONFIG?.AUTH?.TOKEN_KEY || 'portafolio_token';
        this.guardarDato(clave, token);
    }

    obtenerToken() {
        const clave = CONFIG?.AUTH?.TOKEN_KEY || 'portafolio_token';
        return this.obtenerDato(clave);
    }

    eliminarToken() {
        const clave = CONFIG?.AUTH?.TOKEN_KEY || 'portafolio_token';
        this.eliminarDato(clave);
    }

    guardarUsuario(usuario) {
        const clave = CONFIG?.AUTH?.USER_KEY || 'portafolio_user';
        this.guardarDato(clave, usuario);
    }

    // ==========================================
    // ✅ UTILIDADES DE VALIDACIÓN
    // ==========================================

    esEmailValido(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
}

// 🚀 Inicializar cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
    window.ManejadorLogin = new ManejadorLogin();
});

console.log('🔐 Manejador de Login cargado correctamente');