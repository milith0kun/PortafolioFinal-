/**
 * 🎭 SELECTOR DE ROL
 * Sistema Portafolio Docente UNSAAC
 * 
 * Página para seleccionar rol activo cuando el usuario tiene múltiples roles
 * Incluye información detallada de cada rol y navegación fluida
 */

class SelectorRol {
    constructor() {
        this.elementosDOM = {};
        this.rolesDisponibles = [];
        this.rolSeleccionado = null;
        this.usuario = null;
        
        this.estado = {
            cargando: false,
            seleccionando: false,
            error: null
        };

        this.init();
    }

    /**
     * 🚀 Inicializar selector de rol
     */
    async init() {
        try {
            console.log('🎭 Inicializando selector de rol...');

            // Esperar a que CONFIG esté disponible
            await this.esperarConfiguracion();

            // Verificar autenticación
            await this.verificarAutenticacion();

            // Mapear elementos DOM
            this.mapearElementosDOM();

            // Cargar datos del usuario
            await this.cargarDatosUsuario();

            // Cargar roles disponibles
            await this.cargarRolesDisponibles();

            // Renderizar selector
            this.renderizarSelector();

            // Configurar eventos
            this.configurarEventos();

            // Mostrar contenedor principal
            this.mostrarContenedorPrincipal();

            console.log('✅ Selector de rol inicializado correctamente');

        } catch (error) {
            console.error('❌ Error al inicializar selector de rol:', error);
            this.mostrarErrorInicializacion(error);
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
     * 🔍 Verificar autenticación
     */
    async verificarAutenticacion() {
        const token = this.obtenerToken();
        
        if (!token) {
            console.warn('⚠️ Usuario no autenticado, redirigiendo a login...');
            window.location.href = 'login.html';
            throw new Error('Usuario no autenticado');
        }

        // Verificar si el token es válido
        try {
            const response = await fetch(CONFIG.utils.endpoint('/auth/me'), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Token inválido');
            }

            const datosUsuario = await response.json();
            
            // Verificar si ya tiene un rol seleccionado y no está en modo multi-rol
            if (datosUsuario.rolActual && !sessionStorage.getItem('roles_disponibles')) {
                console.log('✅ Usuario ya tiene rol activo, redirigiendo...');
                const rutaDestino = this.obtenerRutaDestino(datosUsuario.rolActual);
                window.location.href = rutaDestino;
                throw new Error('Usuario ya tiene rol activo');
            }

            this.usuario = datosUsuario;
        } catch (error) {
            console.error('Error verificando token:', error);
            this.eliminarToken();
            window.location.href = 'login.html';
            throw new Error('Sesión inválida');
        }
    }

    /**
     * 🎯 Mapear elementos DOM
     */
    mapearElementosDOM() {
        this.elementosDOM = {
            // Contenedores principales
            contenedorPrincipal: document.getElementById('contenedor-selector-rol'),
            contenedorCarga: document.getElementById('contenedor-carga'),
            contenedorError: document.getElementById('contenedor-error'),
            
            // Información del usuario
            nombreUsuario: document.getElementById('nombre-usuario'),
            nombreUsuarioCard: document.getElementById('nombre-usuario-card'),
            correoUsuario: document.getElementById('correo-usuario'),
            avatarUsuario: document.getElementById('avatar-usuario'),
            
            // Selector de roles
            listaRoles: document.getElementById('lista-roles'),
            
            // Información del rol seleccionado
            infoRolSeleccionado: document.getElementById('info-rol-seleccionado'),
            tituloRolSeleccionado: document.getElementById('titulo-rol-seleccionado'),
            descripcionRolSeleccionado: document.getElementById('descripcion-rol-seleccionado'),
            permisosRolSeleccionado: document.getElementById('permisos-rol-seleccionado'),
            
            // Controles
            btnContinuar: document.getElementById('btn-continuar'),
            btnCerrarSesion: document.getElementById('btn-cerrar-sesion'),
            btnVolver: document.getElementById('btn-volver'),
            
            // Mensajes
            alertaError: document.getElementById('alerta-error'),
            textoError: document.getElementById('texto-error')
        };

        // Verificar elementos críticos
        if (!this.elementosDOM.contenedorPrincipal) {
            throw new Error('Contenedor principal no encontrado');
        }
    }

    /**
     * 👤 Cargar datos del usuario
     */
    async cargarDatosUsuario() {
        try {
            if (!this.usuario) {
                throw new Error('Datos de usuario no disponibles');
            }

            // Actualizar información en la UI
            this.actualizarInfoUsuario();

        } catch (error) {
            console.error('❌ Error al cargar datos del usuario:', error);
            throw new Error('No se pudieron cargar los datos del usuario');
        }
    }

    /**
     * 🎭 Cargar roles disponibles
     */
    async cargarRolesDisponibles() {
        try {
            this.mostrarCarga(true);

            // Intentar obtener roles del sessionStorage primero
            const rolesGuardados = sessionStorage.getItem('roles_disponibles');
            
            if (rolesGuardados) {
                this.rolesDisponibles = JSON.parse(rolesGuardados);
                console.log('📋 Roles obtenidos del sessionStorage:', this.rolesDisponibles);
            } else {
                // Cargar desde el backend
                const response = await this.obtenerRolesDelBackend();
                
                if (response.success) {
                    this.rolesDisponibles = response.roles;
                    console.log('📋 Roles obtenidos del servicio:', this.rolesDisponibles);
                } else {
                    throw new Error(response.message || 'No se pudieron cargar los roles');
                }
            }

            // Validar que hay múltiples roles
            if (!this.rolesDisponibles || this.rolesDisponibles.length <= 1) {
                throw new Error('El usuario no tiene múltiples roles para seleccionar');
            }

        } catch (error) {
            console.error('❌ Error al cargar roles:', error);
            throw error;
        } finally {
            this.mostrarCarga(false);
        }
    }

    /**
     * 🌐 Obtener roles del backend
     */
    async obtenerRolesDelBackend() {
        try {
            const token = this.obtenerToken();
            const response = await fetch(CONFIG.utils.endpoint('/roles/mis-roles'), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const resultado = await response.json();
            resultado.success = response.ok;

            return resultado;
        } catch (error) {
            console.error('Error obteniendo roles:', error);
            return { success: false, message: 'Error de conexión' };
        }
    }

    /**
     * 🎨 Renderizar selector de roles
     */
    renderizarSelector() {
        if (!this.elementosDOM.listaRoles) return;

        let html = '';

        this.rolesDisponibles.forEach((rol, index) => {
            const infoRol = this.obtenerInformacionRol(rol);
            const esRolRecomendado = this.esRolRecomendado(rol);

            html += `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card rol-card h-100 shadow-sm ${esRolRecomendado ? 'border-primary' : ''}" 
                         data-rol="${rol}" 
                         data-index="${index}">
                        
                        ${esRolRecomendado ? '<div class="badge bg-primary position-absolute top-0 end-0 m-2">Recomendado</div>' : ''}
                        
                        <div class="card-body text-center d-flex flex-column">
                            <!-- Icono del rol -->
                            <div class="rol-icon mb-3">
                                <i class="${infoRol.icono} fa-3x text-${infoRol.color}"></i>
                            </div>
                            
                            <!-- Información básica -->
                            <h5 class="card-title">${infoRol.nombre}</h5>
                            <p class="card-text text-muted flex-grow-1">${infoRol.descripcion}</p>
                            
                            <!-- Características del rol -->
                            <div class="rol-features mb-3">
                                ${infoRol.caracteristicas.map(caracteristica => 
                                    `<small class="badge bg-light text-dark me-1 mb-1">${caracteristica}</small>`
                                ).join('')}
                            </div>
                            
                            <!-- Botón de selección -->
                            <button class="btn btn-outline-${infoRol.color} btn-seleccionar-rol mt-auto" 
                                    data-rol="${rol}">
                                <i class="fas fa-check me-2"></i>
                                Seleccionar ${infoRol.nombre}
                            </button>
                        </div>
                        
                        <!-- Footer con información adicional -->
                        <div class="card-footer bg-transparent">
                            <small class="text-muted">
                                <i class="fas fa-users me-1"></i>
                                Acceso: ${infoRol.nivelAcceso}
                            </small>
                        </div>
                    </div>
                </div>
            `;
        });

        this.elementosDOM.listaRoles.innerHTML = html;

        // Seleccionar automáticamente el primer rol recomendado
        const rolRecomendado = this.rolesDisponibles.find(rol => this.esRolRecomendado(rol));
        if (rolRecomendado) {
            this.seleccionarRol(rolRecomendado);
        }
    }

    /**
     * 🔧 Configurar eventos
     */
    configurarEventos() {
        // Click en tarjetas de rol
        if (this.elementosDOM.listaRoles) {
            this.elementosDOM.listaRoles.addEventListener('click', (e) => {
                // Click en tarjeta
                const tarjetaRol = e.target.closest('.rol-card');
                if (tarjetaRol) {
                    const rol = tarjetaRol.dataset.rol;
                    this.seleccionarRol(rol);
                }

                // Click en botón de seleccionar
                const btnSeleccionar = e.target.closest('.btn-seleccionar-rol');
                if (btnSeleccionar) {
                    e.stopPropagation();
                    const rol = btnSeleccionar.dataset.rol;
                    this.confirmarSeleccionRol(rol);
                }
            });
        }

        // Botón continuar
        if (this.elementosDOM.btnContinuar) {
            this.elementosDOM.btnContinuar.addEventListener('click', () => {
                if (this.rolSeleccionado) {
                    this.confirmarSeleccionRol(this.rolSeleccionado);
                }
            });
        }

        // Botón cerrar sesión
        if (this.elementosDOM.btnCerrarSesion) {
            this.elementosDOM.btnCerrarSesion.addEventListener('click', (e) => {
                e.preventDefault();
                this.cerrarSesion();
            });
        }

        // Botón volver
        if (this.elementosDOM.btnVolver) {
            this.elementosDOM.btnVolver.addEventListener('click', () => {
                window.history.back();
            });
        }

        // Teclas de acceso rápido
        document.addEventListener('keydown', (e) => {
            this.manejarTeclasRapidas(e);
        });
    }

    /**
     * 🎯 Seleccionar rol
     */
    seleccionarRol(rol) {
        if (this.estado.seleccionando) return;

        console.log(`🎭 Seleccionando rol: ${rol}`);
        
        this.rolSeleccionado = rol;

        // Actualizar UI
        this.actualizarSeleccionVisual(rol);
        this.mostrarInformacionRolSeleccionado(rol);
        this.habilitarBotonContinuar();
    }

    /**
     * ✅ Confirmar selección de rol
     */
    async confirmarSeleccionRol(rol) {
        if (this.estado.seleccionando) return;

        try {
            console.log(`✅ Confirmando selección de rol: ${rol}`);
            
            this.estado.seleccionando = true;
            this.mostrarCargaSeleccion(true);

            // Cambiar rol en el sistema
            const response = await this.cambiarRolEnBackend(rol);

            if (response.success) {
                // Éxito - mostrar mensaje y redirigir
                this.mostrarExitoSeleccion(response);
                
                // Actualizar token/usuario en localStorage
                if (response.token) {
                    this.guardarToken(response.token);
                }
                
                if (response.usuario) {
                    this.guardarUsuario(response.usuario);
                }
                
                // Limpiar datos temporales
                sessionStorage.removeItem('roles_disponibles');
                
                // Redirigir después de un breve delay
                setTimeout(() => {
                    const rutaDestino = response.redirectUrl || this.obtenerRutaDestino(rol);
                    window.location.href = rutaDestino;
                }, 1500);

            } else {
                throw new Error(response.message || 'Error al cambiar rol');
            }

        } catch (error) {
            console.error('❌ Error al confirmar selección:', error);
            this.mostrarError(error.message);
        } finally {
            this.estado.seleccionando = false;
            this.mostrarCargaSeleccion(false);
        }
    }

    /**
     * 🌐 Cambiar rol en el backend
     */
    async cambiarRolEnBackend(rol) {
        try {
            const token = this.obtenerToken();
            const response = await fetch(CONFIG.utils.endpoint('/auth/switch-role'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ rol })
            });

            const resultado = await response.json();
            resultado.success = response.ok;

            return resultado;
        } catch (error) {
            console.error('Error cambiando rol:', error);
            return { success: false, message: 'Error de conexión' };
        }
    }

    /**
     * 👤 Actualizar información del usuario en la UI
     */
    actualizarInfoUsuario() {
        if (!this.usuario) return;

        // Nombre completo en header
        if (this.elementosDOM.nombreUsuario) {
            this.elementosDOM.nombreUsuario.textContent = 
                `${this.usuario.nombres} ${this.usuario.apellidos}`;
        }

        // Nombre completo en card
        if (this.elementosDOM.nombreUsuarioCard) {
            this.elementosDOM.nombreUsuarioCard.textContent = 
                `${this.usuario.nombres} ${this.usuario.apellidos}`;
        }

        // Correo electrónico
        if (this.elementosDOM.correoUsuario) {
            this.elementosDOM.correoUsuario.textContent = this.usuario.correo;
        }

        // Avatar
        if (this.elementosDOM.avatarUsuario) {
            if (this.usuario.avatar) {
                this.elementosDOM.avatarUsuario.innerHTML = 
                    `<img src="${this.usuario.avatar}" alt="Avatar" class="rounded-circle" width="80" height="80">`;
            } else {
                const iniciales = this.obtenerIniciales(this.usuario.nombres, this.usuario.apellidos);
                this.elementosDOM.avatarUsuario.innerHTML = 
                    `<div class="avatar-iniciales rounded-circle d-flex align-items-center justify-content-center bg-primary text-white" style="width: 80px; height: 80px; font-size: 1.5rem;">
                        ${iniciales}
                    </div>`;
            }
        }
    }

    /**
     * 🎨 Actualizar selección visual
     */
    actualizarSeleccionVisual(rolSeleccionado) {
        // Remover selección previa
        document.querySelectorAll('.rol-card').forEach(card => {
            card.classList.remove('selected', 'border-success');
            const btn = card.querySelector('.btn-seleccionar-rol');
            if (btn) {
                btn.classList.remove('btn-success');
                btn.innerHTML = '<i class="fas fa-check me-2"></i>Seleccionar';
            }
        });

        // Marcar rol seleccionado
        const tarjetaSeleccionada = document.querySelector(`.rol-card[data-rol="${rolSeleccionado}"]`);
        if (tarjetaSeleccionada) {
            tarjetaSeleccionada.classList.add('selected', 'border-success');
            
            const btn = tarjetaSeleccionada.querySelector('.btn-seleccionar-rol');
            if (btn) {
                btn.classList.add('btn-success');
                btn.innerHTML = '<i class="fas fa-check-circle me-2"></i>Seleccionado';
            }

            // Scroll suave a la tarjeta
            tarjetaSeleccionada.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }
    }

    /**
     * 📊 Mostrar información del rol seleccionado
     */
    mostrarInformacionRolSeleccionado(rol) {
        if (!this.elementosDOM.infoRolSeleccionado) return;

        const infoRol = this.obtenerInformacionRol(rol);
        
        // Actualizar título
        if (this.elementosDOM.tituloRolSeleccionado) {
            this.elementosDOM.tituloRolSeleccionado.innerHTML = `
                <i class="${infoRol.icono} me-2 text-${infoRol.color}"></i>
                ${infoRol.nombre}
            `;
        }

        // Actualizar descripción
        if (this.elementosDOM.descripcionRolSeleccionado) {
            this.elementosDOM.descripcionRolSeleccionado.textContent = infoRol.descripcionDetallada;
        }

        // Actualizar permisos
        if (this.elementosDOM.permisosRolSeleccionado) {
            const permisosHTML = infoRol.permisos.map(permiso => 
                `<li class="list-group-item">
                    <i class="fas fa-check text-success me-2"></i>
                    ${permiso}
                </li>`
            ).join('');
            
            this.elementosDOM.permisosRolSeleccionado.innerHTML = permisosHTML;
        }

        // Mostrar panel de información
        this.elementosDOM.infoRolSeleccionado.classList.remove('d-none');
    }

    /**
     * ✅ Habilitar botón continuar
     */
    habilitarBotonContinuar() {
        if (this.elementosDOM.btnContinuar) {
            this.elementosDOM.btnContinuar.disabled = false;
            this.elementosDOM.btnContinuar.classList.remove('d-none');
        }
    }

    // ==========================================
    // 🛠️ MÉTODOS AUXILIARES
    // ==========================================

    /**
     * 📋 Obtener información detallada del rol
     */
    obtenerInformacionRol(rol) {
        const informacionRoles = {
            administrador: {
                nombre: 'Administrador',
                descripcion: 'Gestión completa del sistema y usuarios',
                descripcionDetallada: 'Como administrador tienes acceso completo al sistema. Puedes gestionar usuarios, configurar el sistema, generar reportes y supervisar todas las actividades.',
                icono: 'fas fa-user-shield',
                color: 'danger',
                nivelAcceso: 'Completo',
                caracteristicas: ['Gestión de usuarios', 'Configuración del sistema', 'Reportes avanzados', 'Supervisión general'],
                permisos: [
                    'Crear, editar y eliminar usuarios',
                    'Asignar y revocar roles',
                    'Configurar ciclos académicos',
                    'Gestionar asignaturas y verificadores',
                    'Generar reportes ejecutivos',
                    'Acceso a toda la información del sistema'
                ]
            },
            verificador: {
                nombre: 'Verificador',
                descripcion: 'Revisión y aprobación de documentos',
                descripcionDetallada: 'Como verificador eres responsable de revisar los documentos subidos por los docentes, crear observaciones y aprobar o rechazar contenido según los criterios establecidos.',
                icono: 'fas fa-user-check',
                color: 'warning',
                nivelAcceso: 'Verificación',
                caracteristicas: ['Revisión de documentos', 'Crear observaciones', 'Aprobar/Rechazar', 'Estadísticas de verificación'],
                permisos: [
                    'Revisar documentos asignados',
                    'Crear observaciones y comentarios',
                    'Aprobar o rechazar documentos',
                    'Ver estadísticas de verificación',
                    'Gestionar cola de revisión',
                    'Comunicarse con docentes'
                ]
            },
            docente: {
                nombre: 'Docente',
                descripcion: 'Gestión de portafolios y documentos',
                descripcionDetallada: 'Como docente puedes gestionar tus portafolios académicos, subir documentos, ver el progreso de tus materias y responder a las observaciones de los verificadores.',
                icono: 'fas fa-chalkboard-teacher',
                color: 'primary',
                nivelAcceso: 'Portafolios propios',
                caracteristicas: ['Mis portafolios', 'Subir documentos', 'Ver progreso', 'Responder observaciones'],
                permisos: [
                    'Gestionar mis portafolios',
                    'Subir y organizar documentos',
                    'Ver mi progreso académico',
                    'Responder a observaciones',
                    'Consultar mis estadísticas',
                    'Actualizar mi perfil'
                ]
            }
        };

        return informacionRoles[rol] || {
            nombre: this.capitalizarPalabras(rol),
            descripcion: 'Rol personalizado',
            descripcionDetallada: 'Información no disponible para este rol.',
            icono: 'fas fa-user',
            color: 'secondary',
            nivelAcceso: 'Personalizado',
            caracteristicas: ['Acceso personalizado'],
            permisos: ['Permisos según configuración']
        };
    }

    /**
     * ⭐ Determinar si es rol recomendado
     */
    esRolRecomendado(rol) {
        if (this.rolesDisponibles.length === 2) {
            // Si solo tiene 2 roles, recomendar docente
            return rol === 'docente';
        }

        // Si tiene los 3 roles, recomendar según prioridad
        const prioridad = ['docente', 'verificador', 'administrador'];
        const primerRolEnPrioridad = prioridad.find(r => this.rolesDisponibles.includes(r));
        
        return rol === primerRolEnPrioridad;
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
     * ⌨️ Manejar teclas de acceso rápido
     */
    manejarTeclasRapidas(e) {
        // Números 1-3 para seleccionar roles rápidamente
        if (e.key >= '1' && e.key <= '3') {
            const index = parseInt(e.key) - 1;
            if (index < this.rolesDisponibles.length) {
                this.seleccionarRol(this.rolesDisponibles[index]);
            }
        }

        // Enter para confirmar selección
        if (e.key === 'Enter' && this.rolSeleccionado) {
            this.confirmarSeleccionRol(this.rolSeleccionado);
        }

        // Escape para cerrar sesión
        if (e.key === 'Escape') {
            this.cerrarSesion();
        }
    }

    // ==========================================
    // 🎨 MANEJO DE ESTADOS VISUALES
    // ==========================================

    /**
     * 📺 Mostrar contenedor principal
     */
    mostrarContenedorPrincipal() {
        if (this.elementosDOM.contenedorCarga) {
            this.elementosDOM.contenedorCarga.classList.add('d-none');
        }
        
        if (this.elementosDOM.contenedorPrincipal) {
            this.elementosDOM.contenedorPrincipal.classList.remove('d-none');
        }
    }

    /**
     * ⏳ Mostrar/ocultar carga general
     */
    mostrarCarga(mostrar) {
        // Ya se maneja en mostrarContenedorPrincipal
    }

    /**
     * ⏳ Mostrar carga durante selección
     */
    mostrarCargaSeleccion(mostrar) {
        if (this.elementosDOM.btnContinuar) {
            if (mostrar) {
                this.elementosDOM.btnContinuar.disabled = true;
                this.elementosDOM.btnContinuar.innerHTML = `
                    <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                    Cambiando rol...
                `;
            } else {
                this.elementosDOM.btnContinuar.disabled = false;
                this.elementosDOM.btnContinuar.innerHTML = `
                    <i class="fas fa-arrow-right me-2"></i>
                    Continuar con este Rol
                `;
            }
        }

        // Deshabilitar tarjetas durante selección
        document.querySelectorAll('.rol-card').forEach(card => {
            card.style.pointerEvents = mostrar ? 'none' : 'auto';
            card.style.opacity = mostrar ? '0.6' : '1';
        });
    }

    /**
     * ✅ Mostrar éxito en selección
     */
    mostrarExitoSeleccion(response) {
        if (window.Swal) {
            Swal.fire({
                icon: 'success',
                title: 'Rol seleccionado',
                text: response.mensaje || 'Rol seleccionado exitosamente',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        }

        // Actualizar UI para mostrar éxito
        if (this.elementosDOM.btnContinuar) {
            this.elementosDOM.btnContinuar.innerHTML = `
                <i class="fas fa-check-circle me-2 text-success"></i>
                ¡Listo! Redirigiendo...
            `;
            this.elementosDOM.btnContinuar.classList.remove('btn-primary');
            this.elementosDOM.btnContinuar.classList.add('btn-success');
        }
    }

    /**
     * 🚨 Mostrar error
     */
    mostrarError(mensaje) {
        if (this.elementosDOM.alertaError && this.elementosDOM.textoError) {
            this.elementosDOM.textoError.textContent = mensaje;
            this.elementosDOM.alertaError.classList.remove('d-none');
            
            setTimeout(() => {
                this.elementosDOM.alertaError.classList.add('d-none');
            }, 5000);
        }

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
     * 🚨 Mostrar error de inicialización
     */
    mostrarErrorInicializacion(error) {
        if (this.elementosDOM.contenedorError) {
            this.elementosDOM.contenedorError.innerHTML = `
                <div class="container-fluid vh-100 d-flex align-items-center justify-content-center">
                    <div class="text-center">
                        <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                        <h4>Error al cargar selector de rol</h4>
                        <p class="text-muted">${error.message}</p>
                        <div class="d-flex gap-2 justify-content-center">
                            <button class="btn btn-primary" onclick="window.location.reload()">
                                <i class="fas fa-redo me-2"></i>Reintentar
                            </button>
                            <button class="btn btn-secondary" onclick="window.location.href='login.html'">
                                <i class="fas fa-sign-in-alt me-2"></i>Volver al Login
                            </button>
                        </div>
                    </div>
                </div>
            `;
            this.elementosDOM.contenedorError.classList.remove('d-none');
        }
        
        if (this.elementosDOM.contenedorCarga) {
            this.elementosDOM.contenedorCarga.classList.add('d-none');
        }
    }

    /**
     * 🚪 Cerrar sesión
     */
    async cerrarSesion() {
        const confirmar = window.confirm('¿Estás seguro de que deseas cerrar sesión?');

        if (confirmar) {
            try {
                const token = this.obtenerToken();
                
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
                // Limpiar almacenamiento
                this.eliminarToken();
                this.eliminarUsuario();
                sessionStorage.removeItem('roles_disponibles');
                
                window.location.href = 'login.html';
            }
        }
    }

    // ==========================================
    // 🗄️ UTILIDADES DE ALMACENAMIENTO
    // ==========================================

    obtenerToken() {
        const clave = CONFIG?.AUTH?.TOKEN_KEY || 'portafolio_token';
        return localStorage.getItem(clave);
    }

    guardarToken(token) {
        const clave = CONFIG?.AUTH?.TOKEN_KEY || 'portafolio_token';
        localStorage.setItem(clave, token);
    }

    eliminarToken() {
        const clave = CONFIG?.AUTH?.TOKEN_KEY || 'portafolio_token';
        localStorage.removeItem(clave);
    }

    guardarUsuario(usuario) {
        const clave = CONFIG?.AUTH?.USER_KEY || 'portafolio_user';
        localStorage.setItem(clave, JSON.stringify(usuario));
    }

    eliminarUsuario() {
        const clave = CONFIG?.AUTH?.USER_KEY || 'portafolio_user';
        localStorage.removeItem(clave);
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
     * 📝 Capitalizar palabras
     */
    capitalizarPalabras(texto) {
        return texto.replace(/\b\w/g, l => l.toUpperCase());
    }
}

// 🚀 Inicializar cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
    window.SelectorRol = new SelectorRol();
});

console.log('🎭 Selector de Rol cargado correctamente');