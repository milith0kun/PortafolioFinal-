/**
 * 👤 EDITOR DE PERFIL - COMPARTIDO
 * Sistema Portafolio Docente UNSAAC
 * 
 * Editor completo de perfil de usuario para todos los roles
 * Incluye datos personales, avatar, configuraciones, seguridad y preferencias
 */

class EditorPerfil {
   constructor() {
       this.servicioUsuarios = new ServicioUsuarios();
       this.servicioAutenticacion = new ServicioAutenticacion();
       this.validadorFormularios = new ValidadorFormularios();
       this.sistemaModales = new SistemaModales();
       
       // Estado del componente
       this.estado = {
           usuario: null,
           datosOriginales: null,
           cambiosPendientes: false,
           avatarTemporal: null,
           configuraciones: {
               notificaciones: {},
               privacidad: {},
               preferencias: {}
           },
           tabs: {
               activo: 'personal' // personal, avatar, configuracion, seguridad, preferencias
           },
           validacion: {
               contrasenaActual: false,
               contrasenaNueva: false,
               confirmacionContrasena: false
           }
       };
       
       // Referencias DOM
       this.elementos = {
           formularioPrincipal: null,
           previewAvatar: null,
           inputAvatar: null,
           tabsContainer: null,
           botonesSalvar: null
       };
       
       this.init();
   }

   /**
    * 🚀 Inicialización del componente
    */
   async init() {
       try {
           // Verificar autenticación
           if (!SistemaAutenticacion.estaAutenticado()) {
               window.location.href = '/paginas/autenticacion/login.html';
               return;
           }

           await this.inicializarInterfaz();
           await this.cargarDatosUsuario();
           this.configurarEventos();
           this.configurarValidaciones();
           this.configurarCambiosEnTiempoReal();
           
           Utilidades.mostrarNotificacion('Perfil cargado correctamente', 'success');
       } catch (error) {
           console.error('Error inicializando editor de perfil:', error);
           Utilidades.mostrarNotificacion('Error cargando el perfil', 'error');
       }
   }

   /**
    * 🎨 Inicializar interfaz de usuario
    */
   async inicializarInterfaz() {
       await this.renderizarInterfaz();
       this.configurarElementosDOM();
       this.actualizarBreadcrumb();
   }

   /**
    * 🎨 Renderizar interfaz completa
    */
   async renderizarInterfaz() {
       const container = document.querySelector('#perfil-content');
       if (!container) return;

       container.innerHTML = `
           <div class="row g-4">
               <!-- Header del perfil -->
               <div class="col-12">
                   ${this.renderizarHeaderPerfil()}
               </div>
               
               <!-- Navegación por tabs -->
               <div class="col-12">
                   ${this.renderizarNavegacionTabs()}
               </div>
               
               <!-- Contenido principal -->
               <div class="col-lg-8">
                   <div class="card">
                       <div class="card-body">
                           <div id="contenido-tabs">
                               ${this.renderizarTabPersonal()}
                           </div>
                       </div>
                       <div class="card-footer">
                           ${this.renderizarBotonesAccion()}
                       </div>
                   </div>
               </div>
               
               <!-- Panel lateral -->
               <div class="col-lg-4">
                   <!-- Información del usuario -->
                   <div class="card mb-3">
                       <div class="card-body text-center">
                           <div id="avatar-preview" class="avatar-preview mb-3">
                               ${this.renderizarAvatarPreview()}
                           </div>
                           <h5 id="nombre-usuario" class="mb-1">Cargando...</h5>
                           <p id="email-usuario" class="text-muted mb-2">Cargando...</p>
                           <div id="roles-usuario" class="mb-3">
                               <!-- Se llenarán dinámicamente -->
                           </div>
                           <small id="ultimo-acceso" class="text-muted">Último acceso: Cargando...</small>
                       </div>
                   </div>
                   
                   <!-- Estadísticas del usuario -->
                   <div class="card mb-3">
                       <div class="card-header">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-chart-line me-2"></i>Estadísticas
                           </h6>
                       </div>
                       <div class="card-body">
                           <div id="estadisticas-usuario">
                               ${this.renderizarCargandoEstadisticas()}
                           </div>
                       </div>
                   </div>
                   
                   <!-- Actividad reciente -->
                   <div class="card">
                       <div class="card-header">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-clock me-2"></i>Actividad Reciente
                           </h6>
                       </div>
                       <div class="card-body p-0">
                           <div id="actividad-reciente" style="max-height: 250px; overflow-y: auto;">
                               ${this.renderizarCargandoActividad()}
                           </div>
                       </div>
                   </div>
               </div>
           </div>
           
           <!-- Modales -->
           ${this.renderizarModales()}
       `;
   }

   /**
    * 📋 Renderizar header del perfil
    */
   renderizarHeaderPerfil() {
       return `
           <div class="card bg-light">
               <div class="card-body">
                   <div class="row align-items-center">
                       <div class="col-md-8">
                           <div class="d-flex align-items-center">
                               <button type="button" class="btn btn-outline-secondary me-3" 
                                       onclick="window.history.back()" title="Volver">
                                   <i class="fas fa-arrow-left"></i>
                               </button>
                               <div>
                                   <h4 class="card-title mb-1">
                                       <i class="fas fa-user-edit me-2"></i>Editar Perfil
                                   </h4>
                                   <p class="card-text text-muted mb-0">
                                       Actualiza tu información personal, configuraciones y preferencias
                                   </p>
                               </div>
                           </div>
                       </div>
                       <div class="col-md-4 text-end">
                           <div id="indicador-cambios" class="alert alert-warning py-2 mb-0" style="display: none;">
                               <i class="fas fa-exclamation-triangle me-2"></i>
                               <small>Tienes cambios sin guardar</small>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 📑 Renderizar navegación por tabs
    */
   renderizarNavegacionTabs() {
       return `
           <div class="card">
               <div class="card-body py-2">
                   <ul class="nav nav-pills nav-fill" id="tabs-perfil" role="tablist">
                       <li class="nav-item" role="presentation">
                           <button class="nav-link active" id="tab-personal-btn" data-tab="personal" 
                                   onclick="editorPerfil.cambiarTab('personal')">
                               <i class="fas fa-user me-2"></i>Datos Personales
                           </button>
                       </li>
                       <li class="nav-item" role="presentation">
                           <button class="nav-link" id="tab-avatar-btn" data-tab="avatar" 
                                   onclick="editorPerfil.cambiarTab('avatar')">
                               <i class="fas fa-image me-2"></i>Avatar
                           </button>
                       </li>
                       <li class="nav-item" role="presentation">
                           <button class="nav-link" id="tab-configuracion-btn" data-tab="configuracion" 
                                   onclick="editorPerfil.cambiarTab('configuracion')">
                               <i class="fas fa-cog me-2"></i>Configuración
                           </button>
                       </li>
                       <li class="nav-item" role="presentation">
                           <button class="nav-link" id="tab-seguridad-btn" data-tab="seguridad" 
                                   onclick="editorPerfil.cambiarTab('seguridad')">
                               <i class="fas fa-shield-alt me-2"></i>Seguridad
                           </button>
                       </li>
                       <li class="nav-item" role="presentation">
                           <button class="nav-link" id="tab-preferencias-btn" data-tab="preferencias" 
                                   onclick="editorPerfil.cambiarTab('preferencias')">
                               <i class="fas fa-sliders-h me-2"></i>Preferencias
                           </button>
                       </li>
                   </ul>
               </div>
           </div>
       `;
   }

   /**
    * 👤 Renderizar tab de datos personales
    */
   renderizarTabPersonal() {
       return `
           <form id="form-datos-personales" novalidate>
               <h5 class="mb-4">
                   <i class="fas fa-user me-2"></i>Información Personal
               </h5>
               
               <div class="row g-3">
                   <div class="col-md-6">
                       <label class="form-label">Nombres *</label>
                       <input type="text" class="form-control" id="nombres" name="nombres" required>
                       <div class="invalid-feedback"></div>
                   </div>
                   
                   <div class="col-md-6">
                       <label class="form-label">Apellidos *</label>
                       <input type="text" class="form-control" id="apellidos" name="apellidos" required>
                       <div class="invalid-feedback"></div>
                   </div>
                   
                   <div class="col-md-6">
                       <label class="form-label">Email *</label>
                       <input type="email" class="form-control" id="correo" name="correo" required>
                       <div class="form-text">El email es usado para iniciar sesión</div>
                       <div class="invalid-feedback"></div>
                   </div>
                   
                   <div class="col-md-6">
                       <label class="form-label">DNI</label>
                       <input type="text" class="form-control" id="dni" name="dni" maxlength="8">
                       <div class="invalid-feedback"></div>
                   </div>
                   
                   <div class="col-md-6">
                       <label class="form-label">Teléfono</label>
                       <input type="tel" class="form-control" id="telefono" name="telefono">
                       <div class="invalid-feedback"></div>
                   </div>
                   
                   <div class="col-md-6">
                       <label class="form-label">Fecha de Nacimiento</label>
                       <input type="date" class="form-control" id="fecha_nacimiento" name="fecha_nacimiento">
                   </div>
                   
                   <div class="col-12">
                       <label class="form-label">Biografía</label>
                       <textarea class="form-control" id="biografia" name="biografia" rows="4" 
                                 placeholder="Escribe una breve descripción sobre ti..."></textarea>
                       <div class="form-text">Máximo 500 caracteres</div>
                   </div>
                   
                   <div class="col-md-6">
                       <label class="form-label">Especialidad</label>
                       <input type="text" class="form-control" id="especialidad" name="especialidad" 
                              placeholder="Ej: Ingeniería de Software">
                   </div>
                   
                   <div class="col-md-6">
                       <label class="form-label">Departamento</label>
                       <input type="text" class="form-control" id="departamento" name="departamento" 
                              placeholder="Ej: Facultad de Ingeniería">
                   </div>
               </div>
           </form>
       `;
   }

   /**
    * 🖼️ Renderizar tab de avatar
    */
   renderizarTabAvatar() {
       return `
           <h5 class="mb-4">
               <i class="fas fa-image me-2"></i>Foto de Perfil
           </h5>
           
           <div class="row g-4">
               <div class="col-md-6">
                   <div class="avatar-upload-zone border rounded p-4 text-center">
                       <div id="current-avatar" class="mb-3">
                           <img id="preview-avatar-grande" src="" alt="Avatar actual" 
                                class="rounded-circle" style="width: 150px; height: 150px; object-fit: cover;">
                       </div>
                       
                       <input type="file" id="input-avatar" class="d-none" accept="image/*" 
                              onchange="editorPerfil.manejarCambioAvatar(event)">
                       
                       <div class="btn-group">
                           <button type="button" class="btn btn-primary" onclick="document.getElementById('input-avatar').click()">
                               <i class="fas fa-upload me-1"></i>Subir Nueva Foto
                           </button>
                           <button type="button" class="btn btn-outline-danger" onclick="editorPerfil.eliminarAvatar()">
                               <i class="fas fa-trash me-1"></i>Eliminar
                           </button>
                       </div>
                       
                       <div class="mt-3">
                           <small class="text-muted">
                               Formatos permitidos: JPG, PNG, GIF<br>
                               Tamaño máximo: 2MB<br>
                               Dimensiones recomendadas: 300x300px
                           </small>
                       </div>
                   </div>
               </div>
               
               <div class="col-md-6">
                   <h6 class="mb-3">Previsualización</h6>
                   
                   <div class="preview-sizes">
                       <div class="mb-3">
                           <label class="form-label small">Vista grande (perfil)</label>
                           <div class="d-flex align-items-center">
                               <img id="preview-grande" src="" alt="Preview grande" 
                                    class="rounded-circle me-3" style="width: 80px; height: 80px; object-fit: cover;">
                               <div>
                                   <h6 class="mb-0" id="preview-nombre">Tu Nombre</h6>
                                   <small class="text-muted">Vista en perfil</small>
                               </div>
                           </div>
                       </div>
                       
                       <div class="mb-3">
                           <label class="form-label small">Vista mediana (mensajes)</label>
                           <div class="d-flex align-items-center">
                               <img id="preview-mediano" src="" alt="Preview mediano" 
                                    class="rounded-circle me-2" style="width: 40px; height: 40px; object-fit: cover;">
                               <div>
                                   <small class="fw-medium" id="preview-nombre-mediano">Tu Nombre</small>
                                   <br><small class="text-muted">Vista en observaciones</small>
                               </div>
                           </div>
                       </div>
                       
                       <div class="mb-3">
                           <label class="form-label small">Vista pequeña (notificaciones)</label>
                           <div class="d-flex align-items-center">
                               <img id="preview-pequeno" src="" alt="Preview pequeño" 
                                    class="rounded-circle me-2" style="width: 24px; height: 24px; object-fit: cover;">
                               <small id="preview-nombre-pequeno">Tu Nombre</small>
                           </div>
                       </div>
                   </div>
                   
                   <div class="alert alert-info">
                       <i class="fas fa-lightbulb me-2"></i>
                       <strong>Consejo:</strong> Una foto clara y profesional ayuda a otros usuarios 
                       a identificarte fácilmente en el sistema.
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * ⚙️ Renderizar tab de configuración
    */
   renderizarTabConfiguracion() {
       return `
           <h5 class="mb-4">
               <i class="fas fa-cog me-2"></i>Configuración y Notificaciones
           </h5>
           
           <div class="row g-4">
               <div class="col-12">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-bell me-2"></i>Notificaciones por Email
                           </h6>
                       </div>
                       <div class="card-body">
                           <div class="row g-3">
                               <div class="col-md-6">
                                   <div class="form-check form-switch">
                                       <input class="form-check-input" type="checkbox" id="notif-documentos" checked>
                                       <label class="form-check-label" for="notif-documentos">
                                           <strong>Documentos</strong><br>
                                           <small class="text-muted">Subida, aprobación, rechazo</small>
                                       </label>
                                   </div>
                               </div>
                               
                               <div class="col-md-6">
                                   <div class="form-check form-switch">
                                       <input class="form-check-input" type="checkbox" id="notif-observaciones" checked>
                                       <label class="form-check-label" for="notif-observaciones">
                                           <strong>Observaciones</strong><br>
                                           <small class="text-muted">Nuevas observaciones y respuestas</small>
                                       </label>
                                   </div>
                               </div>
                               
                               <div class="col-md-6">
                                   <div class="form-check form-switch">
                                       <input class="form-check-input" type="checkbox" id="notif-ciclos">
                                       <label class="form-check-label" for="notif-ciclos">
                                           <strong>Ciclos Académicos</strong><br>
                                           <small class="text-muted">Inicio, cierre, cambios importantes</small>
                                       </label>
                                   </div>
                               </div>
                               
                               <div class="col-md-6">
                                   <div class="form-check form-switch">
                                       <input class="form-check-input" type="checkbox" id="notif-sistema">
                                       <label class="form-check-label" for="notif-sistema">
                                           <strong>Sistema</strong><br>
                                           <small class="text-muted">Mantenimiento, actualizaciones</small>
                                       </label>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
               
               <div class="col-12">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-eye me-2"></i>Privacidad
                           </h6>
                       </div>
                       <div class="card-body">
                           <div class="row g-3">
                               <div class="col-md-6">
                                   <div class="form-check form-switch">
                                       <input class="form-check-input" type="checkbox" id="privacidad-perfil" checked>
                                       <label class="form-check-label" for="privacidad-perfil">
                                           <strong>Perfil Público</strong><br>
                                           <small class="text-muted">Otros usuarios pueden ver tu perfil</small>
                                       </label>
                                   </div>
                               </div>
                               
                               <div class="col-md-6">
                                   <div class="form-check form-switch">
                                       <input class="form-check-input" type="checkbox" id="privacidad-actividad" checked>
                                       <label class="form-check-label" for="privacidad-actividad">
                                           <strong>Mostrar Actividad</strong><br>
                                           <small class="text-muted">Mostrar último acceso y actividad</small>
                                       </label>
                                   </div>
                               </div>
                               
                               <div class="col-md-6">
                                   <div class="form-check form-switch">
                                       <input class="form-check-input" type="checkbox" id="privacidad-contacto">
                                       <label class="form-check-label" for="privacidad-contacto">
                                           <strong>Información de Contacto</strong><br>
                                           <small class="text-muted">Mostrar teléfono y email a otros</small>
                                       </label>
                                   </div>
                               </div>
                               
                               <div class="col-md-6">
                                   <div class="form-check form-switch">
                                       <input class="form-check-input" type="checkbox" id="privacidad-estadisticas">
                                       <label class="form-check-label" for="privacidad-estadisticas">
                                           <strong>Estadísticas</strong><br>
                                           <small class="text-muted">Mostrar estadísticas de documentos</small>
                                       </label>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 🔐 Renderizar tab de seguridad
    */
   renderizarTabSeguridad() {
       return `
           <h5 class="mb-4">
               <i class="fas fa-shield-alt me-2"></i>Seguridad de la Cuenta
           </h5>
           
           <div class="row g-4">
               <div class="col-12">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-key me-2"></i>Cambiar Contraseña
                           </h6>
                       </div>
                       <div class="card-body">
                           <form id="form-cambiar-contrasena" novalidate>
                               <div class="row g-3">
                                   <div class="col-12">
                                       <label class="form-label">Contraseña Actual *</label>
                                       <div class="input-group">
                                           <input type="password" class="form-control" id="contrasena-actual" 
                                                  name="contrasena_actual" required>
                                           <button class="btn btn-outline-secondary" type="button" 
                                                   onclick="editorPerfil.togglePasswordVisibility('contrasena-actual')">
                                               <i class="fas fa-eye"></i>
                                           </button>
                                       </div>
                                       <div class="invalid-feedback"></div>
                                   </div>
                                   
                                   <div class="col-md-6">
                                       <label class="form-label">Nueva Contraseña *</label>
                                       <div class="input-group">
                                           <input type="password" class="form-control" id="contrasena-nueva" 
                                                  name="contrasena_nueva" required>
                                           <button class="btn btn-outline-secondary" type="button" 
                                                   onclick="editorPerfil.togglePasswordVisibility('contrasena-nueva')">
                                               <i class="fas fa-eye"></i>
                                           </button>
                                       </div>
                                       <div class="invalid-feedback"></div>
                                       <div class="form-text">
                                           Mínimo 8 caracteres, incluir mayúsculas, minúsculas y números
                                       </div>
                                   </div>
                                   
                                   <div class="col-md-6">
                                       <label class="form-label">Confirmar Nueva Contraseña *</label>
                                       <div class="input-group">
                                           <input type="password" class="form-control" id="confirmar-contrasena" 
                                                  name="confirmar_contrasena" required>
                                           <button class="btn btn-outline-secondary" type="button" 
                                                   onclick="editorPerfil.togglePasswordVisibility('confirmar-contrasena')">
                                               <i class="fas fa-eye"></i>
                                           </button>
                                       </div>
                                       <div class="invalid-feedback"></div>
                                   </div>
                                   
                                   <div class="col-12">
                                       <div id="password-strength" class="password-strength mt-2" style="display: none;">
                                           <div class="progress" style="height: 4px;">
                                               <div id="strength-bar" class="progress-bar" role="progressbar" style="width: 0%"></div>
                                           </div>
                                           <small id="strength-text" class="text-muted"></small>
                                       </div>
                                   </div>
                               </div>
                               
                               <div class="mt-3">
                                   <button type="button" class="btn btn-warning" onclick="editorPerfil.cambiarContrasena()">
                                       <i class="fas fa-key me-1"></i>Cambiar Contraseña
                                   </button>
                               </div>
                           </form>
                       </div>
                   </div>
               </div>
               
               <div class="col-12">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-history me-2"></i>Sesiones Activas
                           </h6>
                       </div>
                       <div class="card-body">
                           <div id="sesiones-activas">
                               ${this.renderizarCargandoSesiones()}
                           </div>
                       </div>
                   </div>
               </div>
               
               <div class="col-12">
                   <div class="card border-danger">
                       <div class="card-header bg-danger text-white">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-exclamation-triangle me-2"></i>Zona de Peligro
                           </h6>
                       </div>
                       <div class="card-body">
                           <div class="alert alert-warning">
                               <strong>¡Atención!</strong> Las siguientes acciones son irreversibles.
                           </div>
                           
                           <div class="d-grid gap-2">
                               <button type="button" class="btn btn-outline-warning" onclick="editorPerfil.cerrarTodasLasSesiones()">
                                   <i class="fas fa-sign-out-alt me-1"></i>Cerrar Todas las Sesiones
                               </button>
                               <button type="button" class="btn btn-outline-danger" onclick="editorPerfil.desactivarCuenta()">
                                   <i class="fas fa-user-times me-1"></i>Desactivar Cuenta
                               </button>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 🎛️ Renderizar tab de preferencias
    */
   renderizarTabPreferencias() {
       return `
           <h5 class="mb-4">
               <i class="fas fa-sliders-h me-2"></i>Preferencias de Usuario
           </h5>
           
           <div class="row g-4">
               <div class="col-12">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-paint-brush me-2"></i>Apariencia
                           </h6>
                       </div>
                       <div class="card-body">
                           <div class="row g-3">
                               <div class="col-md-6">
                                   <label class="form-label">Tema</label>
                                   <select class="form-select" id="preferencia-tema">
                                       <option value="auto">Automático (según sistema)</option>
                                       <option value="light">Claro</option>
                                       <option value="dark">Oscuro</option>
                                   </select>
                               </div>
                               
                               <div class="col-md-6">
                                   <label class="form-label">Idioma</label>
                                   <select class="form-select" id="preferencia-idioma">
                                       <option value="es">Español</option>
                                       <option value="en">English</option>
                                       <option value="qu">Quechua</option>
                                   </select>
                               </div>
                               
                               <div class="col-md-6">
                                   <label class="form-label">Tamaño de Fuente</label>
                                   <select class="form-select" id="preferencia-fuente">
                                       <option value="small">Pequeña</option>
                                       <option value="medium" selected>Mediana</option>
                                       <option value="large">Grande</option>
                                   </select>
                               </div>
                               
                               <div class="col-md-6">
                                   <label class="form-label">Densidad de Interfaz</label>
                                   <select class="form-select" id="preferencia-densidad">
                                       <option value="compact">Compacta</option>
                                       <option value="normal" selected>Normal</option>
                                       <option value="comfortable">Cómoda</option>
                                   </select>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
               
               <div class="col-12">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-cogs me-2"></i>Comportamiento
                           </h6>
                       </div>
                       <div class="card-body">
                           <div class="row g-3">
                               <div class="col-md-6">
                                   <div class="form-check form-switch">
                                       <input class="form-check-input" type="checkbox" id="pref-autoguardado" checked>
                                       <label class="form-check-label" for="pref-autoguardado">
                                           <strong>Auto-guardado</strong><br>
                                           <small class="text-muted">Guardar cambios automáticamente</small>
                                       </label>
                                   </div>
                               </div>
                               
                               <div class="col-md-6">
                                   <div class="form-check form-switch">
                                       <input class="form-check-input" type="checkbox" id="pref-confirmaciones" checked>
                                       <label class="form-check-label" for="pref-confirmaciones">
                                           <strong>Confirmaciones</strong><br>
                                           <small class="text-muted">Pedir confirmación para acciones importantes</small>
                                       </label>
                                   </div>
                               </div>
                               
                               <div class="col-md-6">
                                   <div class="form-check form-switch">
                                       <input class="form-check-input" type="checkbox" id="pref-tooltips" checked>
                                       <label class="form-check-label" for="pref-tooltips">
                                           <strong>Ayudas Emergentes</strong><br>
                                           <small class="text-muted">Mostrar tooltips y ayudas contextuales</small>
                                       </label>
                                   </div>
                               </div>
                               
                               <div class="col-md-6">
                                   <div class="form-check form-switch">
                                       <input class="form-check-input" type="checkbox" id="pref-sonidos">
                                       <label class="form-check-label" for="pref-sonidos">
                                           <strong>Sonidos</strong><br>
                                           <small class="text-muted">Reproducir sonidos para notificaciones</small>
                                       </label>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
               
               <div class="col-12">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-table me-2"></i>Tablas y Listas
                           </h6>
                       </div>
                       <div class="card-body">
                           <div class="row g-3">
                               <div class="col-md-6">
                                   <label class="form-label">Elementos por Página</label>
                                   <select class="form-select" id="preferencia-paginacion">
                                       <option value="10">10 elementos</option>
                                       <option value="20" selected>20 elementos</option>
                                       <option value="50">50 elementos</option>
                                       <option value="100">100 elementos</option>
                                   </select>
                               </div>
                               
                               <div class="col-md-6">
                                   <label class="form-label">Vista por Defecto</label>
                                   <select class="form-select" id="preferencia-vista">
                                       <option value="tabla" selected>Tabla</option>
                                       <option value="tarjetas">Tarjetas</option>
                                       <option value="lista">Lista</option>
                                   </select>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 🖼️ Renderizar avatar preview
    */
   renderizarAvatarPreview() {
       return `
           <div class="avatar-container position-relative d-inline-block">
               <img id="avatar-actual" src="" alt="Avatar" 
                    class="rounded-circle border" style="width: 80px; height: 80px; object-fit: cover;">
               <button type="button" class="btn btn-sm btn-primary position-absolute bottom-0 end-0 rounded-circle" 
                       onclick="editorPerfil.cambiarTab('avatar')" title="Cambiar avatar" 
                       style="width: 24px; height: 24px; padding: 0;">
                   <i class="fas fa-camera" style="font-size: 10px;"></i>
               </button>
           </div>
       `;
   }

   /**
    * 🔘 Renderizar botones de acción
    */
   renderizarBotonesAccion() {
       return `
           <div class="d-flex justify-content-between align-items-center">
               <div>
                   <button type="button" class="btn btn-outline-secondary" onclick="editorPerfil.cancelarCambios()">
                       <i class="fas fa-times me-1"></i>Cancelar
                   </button>
                   <button type="button" class="btn btn-outline-info" onclick="editorPerfil.previsualizarCambios()">
                       <i class="fas fa-eye me-1"></i>Previsualizar
                   </button>
               </div>
               <div>
                   <button type="button" class="btn btn-outline-primary" onclick="editorPerfil.guardarBorrador()">
                       <i class="fas fa-save me-1"></i>Guardar Borrador
                   </button>
                   <button type="button" class="btn btn-success" onclick="editorPerfil.guardarCambios()" id="btn-guardar-principal">
                       <i class="fas fa-check me-1"></i>Guardar Cambios
                   </button>
               </div>
           </div>
       `;
   }

   /**
    * 📊 Renderizar estadísticas en estado de carga
    */
   renderizarCargandoEstadisticas() {
       return `
           <div class="placeholder-glow">
               <div class="placeholder col-12 mb-2"></div>
               <div class="placeholder col-8 mb-2"></div>
               <div class="placeholder col-10"></div>
           </div>
       `;
   }

   /**
    * 📋 Renderizar actividad en estado de carga
    */
   renderizarCargandoActividad() {
       return `
           <div class="text-center py-3">
               <div class="spinner-border spinner-border-sm text-muted" role="status"></div>
               <p class="text-muted small mt-2 mb-0">Cargando actividad...</p>
           </div>
       `;
   }

   /**
    * 👥 Renderizar sesiones en estado de carga
    */
   renderizarCargandoSesiones() {
       return `
           <div class="text-center py-3">
               <div class="spinner-border spinner-border-sm text-muted" role="status"></div>
               <p class="text-muted small mt-2 mb-0">Cargando sesiones...</p>
           </div>
       `;
   }

   /**
    * 🎭 Renderizar modales del sistema
    */
   renderizarModales() {
       return `
           <!-- Modal Previsualización -->
           <div class="modal fade" id="modal-preview" tabindex="-1">
               <div class="modal-dialog modal-lg">
                   <div class="modal-content">
                       <div class="modal-header">
                           <h5 class="modal-title">
                               <i class="fas fa-eye me-2"></i>Previsualización del Perfil
                           </h5>
                           <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                       </div>
                       <div class="modal-body">
                           <div id="contenido-preview">
                               <!-- Se llenará dinámicamente -->
                           </div>
                       </div>
                       <div class="modal-footer">
                           <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                           <button type="button" class="btn btn-success" onclick="editorPerfil.guardarCambios()">
                               <i class="fas fa-save me-1"></i>Guardar Cambios
                           </button>
                       </div>
                   </div>
               </div>
           </div>
           
           <!-- Modal Confirmación -->
           <div class="modal fade" id="modal-confirmacion" tabindex="-1">
               <div class="modal-dialog">
                   <div class="modal-content">
                       <div class="modal-header">
                           <h5 class="modal-title">
                               <i class="fas fa-question-circle me-2"></i>Confirmar Acción
                           </h5>
                           <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                       </div>
                       <div class="modal-body">
                           <div id="contenido-confirmacion">
                               <!-- Se llenará dinámicamente -->
                           </div>
                       </div>
                       <div class="modal-footer">
                           <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                           <button type="button" class="btn btn-primary" id="btn-confirmar-accion">
                               Confirmar
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   // =====================================
   // MÉTODOS DE CARGA DE DATOS
   // =====================================

   /**
    * 👤 Cargar datos del usuario
    */
   async cargarDatosUsuario() {
       try {
           const response = await this.servicioUsuarios.obtenerPerfil();
           this.estado.usuario = response.data;
           this.estado.datosOriginales = JSON.parse(JSON.stringify(response.data));
           
           await Promise.all([
               this.llenarFormularios(),
               this.cargarEstadisticasUsuario(),
               this.cargarActividadReciente(),
               this.cargarSesionesActivas()
           ]);
           
       } catch (error) {
           console.error('Error cargando datos del usuario:', error);
           Utilidades.mostrarNotificacion('Error cargando el perfil', 'error');
       }
   }

   /**
    * 📝 Llenar formularios con datos
    */
   async llenarFormularios() {
       const usuario = this.estado.usuario;
       if (!usuario) return;
       
       // Datos personales
       document.getElementById('nombres').value = usuario.nombres || '';
       document.getElementById('apellidos').value = usuario.apellidos || '';
       document.getElementById('correo').value = usuario.correo || '';
       document.getElementById('dni').value = usuario.dni || '';
       document.getElementById('telefono').value = usuario.telefono || '';
       document.getElementById('fecha_nacimiento').value = usuario.fecha_nacimiento || '';
       document.getElementById('biografia').value = usuario.biografia || '';
       document.getElementById('especialidad').value = usuario.especialidad || '';
       document.getElementById('departamento').value = usuario.departamento || '';
       
       // Actualizar información del panel lateral
       this.actualizarPanelLateral();
       
       // Actualizar avatar
       this.actualizarAvatarEnInterfaz();
   }

   /**
    * 📊 Cargar estadísticas del usuario
    */
   async cargarEstadisticasUsuario() {
       try {
           const response = await this.servicioUsuarios.obtenerEstadisticas();
           this.renderizarEstadisticasUsuario(response.data);
       } catch (error) {
           console.warn('Error cargando estadísticas:', error);
       }
   }

   /**
    * 📋 Cargar actividad reciente
    */
   async cargarActividadReciente() {
       try {
           const response = await this.servicioUsuarios.obtenerActividad({ limite: 5 });
           this.renderizarActividadReciente(response.data);
       } catch (error) {
           console.warn('Error cargando actividad:', error);
       }
   }

   /**
    * 👥 Cargar sesiones activas
    */
   async cargarSesionesActivas() {
       try {
           const response = await this.servicioAutenticacion.obtenerSesionesActivas();
           this.renderizarSesionesActivas(response.data);
       } catch (error) {
           console.warn('Error cargando sesiones:', error);
       }
   }

   // =====================================
   // MÉTODOS DE NAVEGACIÓN
   // =====================================

   /**
    * 📑 Cambiar tab activo
    */
   cambiarTab(nombreTab) {
       // Actualizar estado
       this.estado.tabs.activo = nombreTab;
       
       // Actualizar botones
       document.querySelectorAll('#tabs-perfil .nav-link').forEach(btn => {
           btn.classList.remove('active');
       });
       document.getElementById(`tab-${nombreTab}-btn`).classList.add('active');
       
       // Renderizar contenido del tab
       const contenido = document.getElementById('contenido-tabs');
       if (contenido) {
           switch (nombreTab) {
               case 'personal':
                   contenido.innerHTML = this.renderizarTabPersonal();
                   this.llenarFormularios();
                   break;
               case 'avatar':
                   contenido.innerHTML = this.renderizarTabAvatar();
                   this.configurarAvatarTab();
                   break;
               case 'configuracion':
                   contenido.innerHTML = this.renderizarTabConfiguracion();
                   this.cargarConfiguraciones();
                   break;
               case 'seguridad':
                   contenido.innerHTML = this.renderizarTabSeguridad();
                   this.configurarTabSeguridad();
                   break;
               case 'preferencias':
                   contenido.innerHTML = this.renderizarTabPreferencias();
                   this.cargarPreferencias();
                   break;
           }
       }
   }

   // =====================================
   // MÉTODOS DE ACCIONES
   // =====================================

   /**
    * 💾 Guardar cambios
    */
   async guardarCambios() {
       try {
           if (!this.validarCambiosActuales()) {
               return;
           }
           
           const datosActualizados = this.recopilarDatosFormularios();
           
           const response = await this.servicioUsuarios.actualizarPerfil(datosActualizados);
           
           // Actualizar estado
           this.estado.usuario = response.data;
           this.estado.datosOriginales = JSON.parse(JSON.stringify(response.data));
           this.estado.cambiosPendientes = false;
           
           this.ocultarIndicadorCambios();
           Utilidades.mostrarNotificacion('Perfil actualizado correctamente', 'success');
           
       } catch (error) {
           console.error('Error guardando cambios:', error);
           this.manejarErrorGuardado(error);
       }
   }

   /**
    * 🖼️ Manejar cambio de avatar
    */
   async manejarCambioAvatar(event) {
       const archivo = event.target.files[0];
       if (!archivo) return;
       
       // Validar archivo
       if (!this.validarArchivoAvatar(archivo)) {
           return;
       }
       
       try {
           // Crear preview temporal
           const reader = new FileReader();
           reader.onload = (e) => {
               this.estado.avatarTemporal = e.target.result;
               this.actualizarPreviewAvatar(e.target.result);
               this.marcarCambiosPendientes();
           };
           reader.readAsDataURL(archivo);
           
           // Subir avatar al servidor
           const formData = new FormData();
           formData.append('avatar', archivo);
           
           const response = await this.servicioUsuarios.subirAvatar(formData);
           
           // Actualizar estado
           this.estado.usuario.avatar = response.data.avatar_url;
           this.actualizarAvatarEnInterfaz();
           
           Utilidades.mostrarNotificacion('Avatar actualizado correctamente', 'success');
           
       } catch (error) {
           console.error('Error subiendo avatar:', error);
           Utilidades.mostrarNotificacion('Error al subir el avatar', 'error');
       }
   }

   /**
    * 🔐 Cambiar contraseña
    */
   async cambiarContrasena() {
       try {
           const form = document.getElementById('form-cambiar-contrasena');
           if (!form || !this.validarFormulario(form)) {
               return;
           }
           
           const formData = new FormData(form);
           const datosContrasena = Object.fromEntries(formData.entries());
           
           // Validar que las contraseñas coincidan
           if (datosContrasena.contrasena_nueva !== datosContrasena.confirmar_contrasena) {
               Utilidades.mostrarNotificacion('Las contraseñas no coinciden', 'error');
               return;
           }
           
           const confirmar = await Utilidades.confirmar(
               'Cambiar Contraseña',
               '¿Estás seguro de que deseas cambiar tu contraseña?',
               'warning'
           );
           
           if (!confirmar) return;
           
           await this.servicioAutenticacion.cambiarContrasena(datosContrasena);
           
           // Limpiar formulario
           form.reset();
           
           Utilidades.mostrarNotificacion('Contraseña cambiada correctamente', 'success');
           
       } catch (error) {
           console.error('Error cambiando contraseña:', error);
           Utilidades.mostrarNotificacion('Error al cambiar la contraseña', 'error');
       }
   }

   // =====================================
   // MÉTODOS AUXILIARES
   // =====================================

   /**
    * ✅ Validar archivo de avatar
    */
   validarArchivoAvatar(archivo) {
       // Validar tipo
       const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif'];
       if (!tiposPermitidos.includes(archivo.type)) {
           Utilidades.mostrarNotificacion('Formato no válido. Solo se permiten JPG, PNG y GIF', 'error');
           return false;
       }
       
       // Validar tamaño (2MB máximo)
       const tamanoMaximo = 2 * 1024 * 1024; // 2MB
       if (archivo.size > tamanoMaximo) {
           Utilidades.mostrarNotificacion('El archivo es demasiado grande. Tamaño máximo: 2MB', 'error');
           return false;
       }
       
       return true;
   }

   /**
    * 📊 Recopilar datos de formularios
    */
   recopilarDatosFormularios() {
       const datos = {};
       
       // Datos personales
       const campos = ['nombres', 'apellidos', 'correo', 'dni', 'telefono', 'fecha_nacimiento', 'biografia', 'especialidad', 'departamento'];
       campos.forEach(campo => {
           const elemento = document.getElementById(campo);
           if (elemento) {
               datos[campo] = elemento.value;
           }
       });
       
       // Configuraciones según el tab activo
       switch (this.estado.tabs.activo) {
           case 'configuracion':
               datos.configuraciones = this.recopilarConfiguraciones();
               break;
           case 'preferencias':
               datos.preferencias = this.recopilarPreferencias();
               break;
       }
       
       return datos;
   }

   /**
    * 🔄 Marcar cambios pendientes
    */
   marcarCambiosPendientes() {
       this.estado.cambiosPendientes = true;
       this.mostrarIndicadorCambios();
   }

   /**
    * 👁️ Mostrar indicador de cambios
    */
   mostrarIndicadorCambios() {
       const indicador = document.getElementById('indicador-cambios');
       if (indicador) {
           indicador.style.display = 'block';
       }
   }

   /**
    * 🙈 Ocultar indicador de cambios
    */
   ocultarIndicadorCambios() {
       const indicador = document.getElementById('indicador-cambios');
       if (indicador) {
           indicador.style.display = 'none';
       }
   }

   /**
    * 🔧 Configurar elementos DOM
    */
   configurarElementosDOM() {
       this.elementos = {
           formularioPrincipal: document.getElementById('form-datos-personales'),
           previewAvatar: document.getElementById('avatar-actual'),
           inputAvatar: document.getElementById('input-avatar'),
           tabsContainer: document.getElementById('tabs-perfil'),
           botonesSalvar: document.getElementById('btn-guardar-principal')
       };
   }

   /**
    * ⚙️ Configurar eventos
    */
   configurarEventos() {
       // Detectar cambios en formularios
       document.addEventListener('input', (e) => {
           if (e.target.closest('form')) {
               this.marcarCambiosPendientes();
           }
       });
       
       // Detectar cambios en checkboxes y selects
       document.addEventListener('change', (e) => {
           if (e.target.closest('form')) {
               this.marcarCambiosPendientes();
           }
       });
       
       // Prevenir salida sin guardar
       window.addEventListener('beforeunload', (e) => {
           if (this.estado.cambiosPendientes) {
               e.preventDefault();
               e.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?';
           }
       });
   }

   /**
    * ✅ Configurar validaciones
    */
   configurarValidaciones() {
       this.validadorFormularios.configurarFormulario('form-datos-personales', {
           nombres: { required: true, minLength: 2 },
           apellidos: { required: true, minLength: 2 },
           correo: { required: true, email: true },
           dni: { pattern: /^\d{8}$/ },
           telefono: { pattern: /^[0-9+\-\s]+$/ },
           biografia: { maxLength: 500 }
       });
       
       this.validadorFormularios.configurarFormulario('form-cambiar-contrasena', {
           contrasena_actual: { required: true },
           contrasena_nueva: { required: true, minLength: 8, pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/ },
           confirmar_contrasena: { required: true }
       });
   }

   /**
    * 🔄 Actualizar breadcrumb
    */
   actualizarBreadcrumb() {
       const breadcrumb = document.querySelector('#breadcrumb');
       if (breadcrumb) {
           const rolActual = SistemaAutenticacion.obtenerRolActual();
           const iconoRol = {
               'administrador': 'fas fa-crown',
               'verificador': 'fas fa-shield-alt',
               'docente': 'fas fa-chalkboard-teacher'
           }[rolActual] || 'fas fa-user';
           
           breadcrumb.innerHTML = `
               <li class="breadcrumb-item">
                   <i class="${iconoRol} me-1"></i>${rolActual?.charAt(0).toUpperCase() + rolActual?.slice(1) || 'Usuario'}
               </li>
               <li class="breadcrumb-item active">Editar Perfil</li>
           `;
       }
   }

   // =====================================
   // MÉTODOS PÚBLICOS PARA INTERFAZ
   // =====================================

   /**
    * 🔄 Toggle visibilidad de contraseña
    */
   togglePasswordVisibility(inputId) {
       const input = document.getElementById(inputId);
       const button = input.nextElementSibling.querySelector('i');
       
       if (input.type === 'password') {
           input.type = 'text';
           button.classList.replace('fa-eye', 'fa-eye-slash');
       } else {
           input.type = 'password';
           button.classList.replace('fa-eye-slash', 'fa-eye');
       }
   }

   /**
    * ❌ Cancelar cambios
    */
   async cancelarCambios() {
       if (this.estado.cambiosPendientes) {
           const confirmar = await Utilidades.confirmar(
               'Cancelar Cambios',
               '¿Estás seguro de que deseas cancelar? Se perderán todos los cambios no guardados.',
               'warning'
           );
           
           if (!confirmar) return;
       }
       
       // Restaurar datos originales
       this.estado.usuario = JSON.parse(JSON.stringify(this.estado.datosOriginales));
       this.estado.cambiosPendientes = false;
       this.estado.avatarTemporal = null;
       
       // Recargar formularios
       await this.llenarFormularios();
       this.ocultarIndicadorCambios();
       
       Utilidades.mostrarNotificacion('Cambios cancelados', 'info');
   }

   /**
    * 👁️ Previsualizar cambios
    */
   previsualizarCambios() {
       const datosTemporales = this.recopilarDatosFormularios();
       
       this.sistemaModales.mostrarModal({
           titulo: 'Previsualización del Perfil',
           contenido: this.renderizarPreviewPerfil(datosTemporales),
           botones: [
               {
                   texto: 'Guardar Cambios',
                   clase: 'btn-success',
                   accion: () => this.guardarCambios()
               },
               {
                   texto: 'Cerrar',
                   clase: 'btn-secondary'
               }
           ]
       });
   }

   /**
    * 💾 Guardar borrador
    */
   async guardarBorrador() {
       try {
           const datosTemporales = this.recopilarDatosFormularios();
           localStorage.setItem('perfil_borrador', JSON.stringify(datosTemporales));
           Utilidades.mostrarNotificacion('Borrador guardado', 'info');
       } catch (error) {
           console.error('Error guardando borrador:', error);
       }
   }
}

// =====================================
// INICIALIZACIÓN GLOBAL
// =====================================

// Variable global para acceso desde HTML
let editorPerfil;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
   editorPerfil = new EditorPerfil();
});

// Cleanup al salir de la página
window.addEventListener('beforeunload', () => {
   if (editorPerfil) {
       editorPerfil = null;
   }
});