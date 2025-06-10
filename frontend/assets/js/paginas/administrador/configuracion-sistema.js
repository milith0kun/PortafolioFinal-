/**
 * ⚙️ CONFIGURACIÓN DEL SISTEMA
 * Sistema Portafolio Docente UNSAAC
 * 
 * Página para gestionar todas las configuraciones del sistema
 * Incluye configuraciones generales, seguridad, notificaciones y módulos
 */

class ConfiguracionSistema {
   constructor() {
       this.servicioReportes = new ServicioReportes();
       this.servicioNotificaciones = new ServicioNotificaciones();
       this.servicioUsuarios = new ServicioUsuarios();
       this.servicioCiclos = new ServicioCiclos();
       
       this.configuracionesOriginales = {};
       this.configuracionesActuales = {};
       this.cambiosPendientes = {};
       
       this.inicializar();
   }

   /**
    * Inicializa la página de configuración
    */
   async inicializar() {
       try {
           await this.verificarPermisos();
           await this.cargarConfiguraciones();
           this.configurarInterfaz();
           this.configurarEventos();
           
           Utilidades.mostrarNotificacion('Configuración del sistema cargada', 'success');
       } catch (error) {
           console.error('Error al inicializar configuración:', error);
           Utilidades.mostrarNotificacion('Error al cargar configuraciones', 'error');
       }
   }

   /**
    * Verifica permisos de administrador
    */
   async verificarPermisos() {
       const usuario = SistemaAutenticacion.obtenerUsuario();
       if (!usuario || !usuario.rolesActivos.includes('administrador')) {
           window.location.href = '/acceso-denegado.html';
           throw new Error('Sin permisos de administrador');
       }
   }

   /**
    * Carga todas las configuraciones del sistema
    */
   async cargarConfiguraciones() {
       try {
           Utilidades.mostrarCargando('#contenedor-configuracion');
           
           // Simulando carga de configuraciones desde el backend
           const configuraciones = await this.obtenerConfiguracionesDelSistema();
           
           this.configuracionesOriginales = { ...configuraciones };
           this.configuracionesActuales = { ...configuraciones };
           this.cambiosPendientes = {};
           
       } catch (error) {
           console.error('Error al cargar configuraciones:', error);
           throw error;
       } finally {
           Utilidades.ocultarCargando('#contenedor-configuracion');
       }
   }

   /**
    * Obtiene configuraciones del sistema (simulado)
    */
   async obtenerConfiguracionesDelSistema() {
       // En un caso real, esto vendría del backend
       return {
           general: {
               nombreSistema: 'Sistema Portafolio Docente UNSAAC',
               descripcionSistema: 'Sistema para gestión de portafolios académicos',
               logoSistema: '/assets/imagenes/logos/logo-unsaac.png',
               colorPrimario: '#007bff',
               colorSecundario: '#6c757d',
               zonaHoraria: 'America/Lima',
               idiomaPredeterminado: 'es',
               formatoFecha: 'DD/MM/YYYY',
               formatoHora: '24h'
           },
           seguridad: {
               tiempoSesion: 480, // minutos
               intentosLoginMax: 5,
               tiempoBloqueo: 30, // minutos
               longitudPasswordMin: 8,
               requierePasswordCompleja: true,
               habilitarAutenticacion2FA: false,
               tiempoExpiracionToken: 60, // minutos
               habilitarLogAuditoria: true,
               nivelLogSeguridad: 'INFO'
           },
           notificaciones: {
               habilitarNotificaciones: true,
               habilitarEmail: true,
               servidorSMTP: 'smtp.unsaac.edu.pe',
               puertoSMTP: 587,
               usuarioSMTP: 'portafolio@unsaac.edu.pe',
               habilitarNotificacionesPush: false,
               frecuenciaNotificaciones: 'inmediata',
               plantillaEmailPredeterminada: 'unsaac-template'
           },
           archivos: {
               tamanoMaximoArchivo: 50, // MB
               formatosPermitidos: ['pdf', 'docx', 'xlsx', 'pptx', 'jpg', 'png'],
               rutaAlmacenamiento: '/uploads/',
               habilitarCompresion: true,
               calidadCompresion: 85,
               habilitarVersionado: true,
               tiempoRetencionVersiones: 365, // días
               escaneadorVirus: true
           },
           portafolios: {
               generacionAutomatica: true,
               estructuraPredeterminada: 'unsaac-estandar',
               habilitarPersonalizacion: true,
               requiereAprobacionEstructura: false,
               progresoMinimoAprobacion: 80,
               alertaProgresoMinimo: 50,
               diasLimiteSubida: 30,
               habilitarCalificaciones: false
           },
           reportes: {
               habilitarReportes: true,
               formatosExportacion: ['pdf', 'excel', 'csv'],
               habilitarProgramacion: true,
               retencionReportes: 90, // días
               habilitarDashboards: true,
               actualizacionDashboards: 'tiempo-real',
               habilitarCompartirReportes: true,
               marcaAguaReportes: 'UNSAAC - Confidencial'
           },
           mantenimiento: {
               modoMantenimiento: false,
               mensajeMantenimiento: 'Sistema en mantenimiento. Disculpe las molestias.',
               respaldoAutomatico: true,
               frecuenciaRespaldo: 'diario',
               horaRespaldo: '02:00',
               retencionRespaldos: 30, // días
               optimizacionBD: 'semanal',
               limpiezaLogsAutomatica: true
           }
       };
   }

   /**
    * Configura la interfaz de configuración
    */
   configurarInterfaz() {
       this.crearNavegacionTabs();
       this.mostrarConfiguracionGeneral();
       this.mostrarConfiguracionSeguridad();
       this.mostrarConfiguracionNotificaciones();
       this.mostrarConfiguracionArchivos();
       this.mostrarConfiguracionPortafolios();
       this.mostrarConfiguracionReportes();
       this.mostrarConfiguracionMantenimiento();
       this.crearPanelCambios();
   }

   /**
    * Crea la navegación por pestañas
    */
   crearNavegacionTabs() {
       const tabsHtml = `
           <ul class="nav nav-tabs nav-justified" id="configTabs" role="tablist">
               <li class="nav-item" role="presentation">
                   <button class="nav-link active" id="general-tab" data-bs-toggle="tab" 
                           data-bs-target="#general-config" type="button" role="tab">
                       <i class="fas fa-cog me-1"></i>
                       General
                   </button>
               </li>
               <li class="nav-item" role="presentation">
                   <button class="nav-link" id="seguridad-tab" data-bs-toggle="tab" 
                           data-bs-target="#seguridad-config" type="button" role="tab">
                       <i class="fas fa-shield-alt me-1"></i>
                       Seguridad
                   </button>
               </li>
               <li class="nav-item" role="presentation">
                   <button class="nav-link" id="notificaciones-tab" data-bs-toggle="tab" 
                           data-bs-target="#notificaciones-config" type="button" role="tab">
                       <i class="fas fa-bell me-1"></i>
                       Notificaciones
                   </button>
               </li>
               <li class="nav-item" role="presentation">
                   <button class="nav-link" id="archivos-tab" data-bs-toggle="tab" 
                           data-bs-target="#archivos-config" type="button" role="tab">
                       <i class="fas fa-file me-1"></i>
                       Archivos
                   </button>
               </li>
               <li class="nav-item" role="presentation">
                   <button class="nav-link" id="portafolios-tab" data-bs-toggle="tab" 
                           data-bs-target="#portafolios-config" type="button" role="tab">
                       <i class="fas fa-folder me-1"></i>
                       Portafolios
                   </button>
               </li>
               <li class="nav-item" role="presentation">
                   <button class="nav-link" id="reportes-tab" data-bs-toggle="tab" 
                           data-bs-target="#reportes-config" type="button" role="tab">
                       <i class="fas fa-chart-bar me-1"></i>
                       Reportes
                   </button>
               </li>
               <li class="nav-item" role="presentation">
                   <button class="nav-link" id="mantenimiento-tab" data-bs-toggle="tab" 
                           data-bs-target="#mantenimiento-config" type="button" role="tab">
                       <i class="fas fa-tools me-1"></i>
                       Mantenimiento
                   </button>
               </li>
           </ul>
           
           <div class="tab-content mt-3" id="configTabContent">
               <div class="tab-pane fade show active" id="general-config" role="tabpanel"></div>
               <div class="tab-pane fade" id="seguridad-config" role="tabpanel"></div>
               <div class="tab-pane fade" id="notificaciones-config" role="tabpanel"></div>
               <div class="tab-pane fade" id="archivos-config" role="tabpanel"></div>
               <div class="tab-pane fade" id="portafolios-config" role="tabpanel"></div>
               <div class="tab-pane fade" id="reportes-config" role="tabpanel"></div>
               <div class="tab-pane fade" id="mantenimiento-config" role="tabpanel"></div>
           </div>
       `;
       
       document.getElementById('navegacion-configuracion').innerHTML = tabsHtml;
   }

   /**
    * Muestra configuración general
    */
   mostrarConfiguracionGeneral() {
       const config = this.configuracionesActuales.general;
       
       const contenidoHtml = `
           <div class="row">
               <div class="col-md-8">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="m-0">Configuración General del Sistema</h6>
                       </div>
                       <div class="card-body">
                           <div class="row">
                               <div class="col-md-6">
                                   <div class="mb-3">
                                       <label class="form-label">Nombre del Sistema</label>
                                       <input type="text" class="form-control config-input" 
                                              data-categoria="general" data-campo="nombreSistema"
                                              value="${config.nombreSistema}">
                                   </div>
                                   
                                   <div class="mb-3">
                                       <label class="form-label">Descripción</label>
                                       <textarea class="form-control config-input" rows="3"
                                                 data-categoria="general" data-campo="descripcionSistema">${config.descripcionSistema}</textarea>
                                   </div>
                                   
                                   <div class="mb-3">
                                       <label class="form-label">Zona Horaria</label>
                                       <select class="form-select config-input" 
                                               data-categoria="general" data-campo="zonaHoraria">
                                           <option value="America/Lima" ${config.zonaHoraria === 'America/Lima' ? 'selected' : ''}>América/Lima (UTC-5)</option>
                                           <option value="America/Bogota" ${config.zonaHoraria === 'America/Bogota' ? 'selected' : ''}>América/Bogotá (UTC-5)</option>
                                           <option value="UTC" ${config.zonaHoraria === 'UTC' ? 'selected' : ''}>UTC</option>
                                       </select>
                                   </div>
                                   
                                   <div class="mb-3">
                                       <label class="form-label">Idioma Predeterminado</label>
                                       <select class="form-select config-input" 
                                               data-categoria="general" data-campo="idiomaPredeterminado">
                                           <option value="es" ${config.idiomaPredeterminado === 'es' ? 'selected' : ''}>Español</option>
                                           <option value="en" ${config.idiomaPredeterminado === 'en' ? 'selected' : ''}>English</option>
                                       </select>
                                   </div>
                               </div>
                               
                               <div class="col-md-6">
                                   <div class="mb-3">
                                       <label class="form-label">Color Primario</label>
                                       <div class="input-group">
                                           <input type="color" class="form-control form-control-color config-input" 
                                                  data-categoria="general" data-campo="colorPrimario"
                                                  value="${config.colorPrimario}">
                                           <input type="text" class="form-control" 
                                                  value="${config.colorPrimario}" readonly>
                                       </div>
                                   </div>
                                   
                                   <div class="mb-3">
                                       <label class="form-label">Color Secundario</label>
                                       <div class="input-group">
                                           <input type="color" class="form-control form-control-color config-input" 
                                                  data-categoria="general" data-campo="colorSecundario"
                                                  value="${config.colorSecundario}">
                                           <input type="text" class="form-control" 
                                                  value="${config.colorSecundario}" readonly>
                                       </div>
                                   </div>
                                   
                                   <div class="mb-3">
                                       <label class="form-label">Formato de Fecha</label>
                                       <select class="form-select config-input" 
                                               data-categoria="general" data-campo="formatoFecha">
                                           <option value="DD/MM/YYYY" ${config.formatoFecha === 'DD/MM/YYYY' ? 'selected' : ''}>DD/MM/YYYY</option>
                                           <option value="MM/DD/YYYY" ${config.formatoFecha === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY</option>
                                           <option value="YYYY-MM-DD" ${config.formatoFecha === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option>
                                       </select>
                                   </div>
                                   
                                   <div class="mb-3">
                                       <label class="form-label">Formato de Hora</label>
                                       <select class="form-select config-input" 
                                               data-categoria="general" data-campo="formatoHora">
                                           <option value="24h" ${config.formatoHora === '24h' ? 'selected' : ''}>24 horas</option>
                                           <option value="12h" ${config.formatoHora === '12h' ? 'selected' : ''}>12 horas (AM/PM)</option>
                                       </select>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
               
               <div class="col-md-4">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="m-0">Logo del Sistema</h6>
                       </div>
                       <div class="card-body text-center">
                           <div class="mb-3">
                               <img src="${config.logoSistema}" alt="Logo Sistema" 
                                    class="img-fluid" style="max-height: 150px;" id="preview-logo">
                           </div>
                           <div class="mb-3">
                               <input type="file" class="form-control" id="input-logo" 
                                      accept="image/*">
                           </div>
                           <button class="btn btn-outline-primary btn-sm" id="btn-cambiar-logo">
                               <i class="fas fa-image me-1"></i>
                               Cambiar Logo
                           </button>
                       </div>
                   </div>
                   
                   <div class="card mt-3">
                       <div class="card-header">
                           <h6 class="m-0">Vista Previa</h6>
                       </div>
                       <div class="card-body">
                           <div class="preview-container p-3 border rounded" 
                                style="background-color: ${config.colorPrimario}; color: white;">
                               <h6>${config.nombreSistema}</h6>
                               <p class="mb-0 small opacity-75">${config.descripcionSistema}</p>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('general-config').innerHTML = contenidoHtml;
   }

   /**
    * Muestra configuración de seguridad
    */
   mostrarConfiguracionSeguridad() {
       const config = this.configuracionesActuales.seguridad;
       
       const contenidoHtml = `
           <div class="row">
               <div class="col-md-6">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="m-0">Configuración de Sesiones</h6>
                       </div>
                       <div class="card-body">
                           <div class="mb-3">
                               <label class="form-label">Tiempo de Sesión (minutos)</label>
                               <input type="number" class="form-control config-input" 
                                      data-categoria="seguridad" data-campo="tiempoSesion"
                                      value="${config.tiempoSesion}" min="30" max="1440">
                           </div>
                           
                           <div class="mb-3">
                               <label class="form-label">Tiempo de Expiración de Token (minutos)</label>
                               <input type="number" class="form-control config-input" 
                                      data-categoria="seguridad" data-campo="tiempoExpiracionToken"
                                      value="${config.tiempoExpiracionToken}" min="15" max="120">
                           </div>
                           
                           <div class="mb-3">
                               <div class="form-check">
                                   <input class="form-check-input config-input" type="checkbox" 
                                          data-categoria="seguridad" data-campo="habilitarAutenticacion2FA"
                                          ${config.habilitarAutenticacion2FA ? 'checked' : ''}>
                                   <label class="form-check-label">
                                       Habilitar Autenticación de Dos Factores (2FA)
                                   </label>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
               
               <div class="col-md-6">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="m-0">Configuración de Contraseñas</h6>
                       </div>
                       <div class="card-body">
                           <div class="mb-3">
                               <label class="form-label">Longitud Mínima de Contraseña</label>
                               <input type="number" class="form-control config-input" 
                                      data-categoria="seguridad" data-campo="longitudPasswordMin"
                                      value="${config.longitudPasswordMin}" min="6" max="20">
                           </div>
                           
                           <div class="mb-3">
                               <div class="form-check">
                                   <input class="form-check-input config-input" type="checkbox" 
                                          data-categoria="seguridad" data-campo="requierePasswordCompleja"
                                          ${config.requierePasswordCompleja ? 'checked' : ''}>
                                   <label class="form-check-label">
                                       Requerir Contraseña Compleja
                                       <small class="text-muted d-block">Mayúsculas, minúsculas, números y símbolos</small>
                                   </label>
                               </div>
                           </div>
                           
                           <div class="mb-3">
                               <label class="form-label">Máximo Intentos de Login</label>
                               <input type="number" class="form-control config-input" 
                                      data-categoria="seguridad" data-campo="intentosLoginMax"
                                      value="${config.intentosLoginMax}" min="3" max="10">
                           </div>
                           
                           <div class="mb-3">
                               <label class="form-label">Tiempo de Bloqueo (minutos)</label>
                               <input type="number" class="form-control config-input" 
                                      data-categoria="seguridad" data-campo="tiempoBloqueo"
                                      value="${config.tiempoBloqueo}" min="5" max="120">
                           </div>
                       </div>
                   </div>
               </div>
               
               <div class="col-12">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="m-0">Configuración de Auditoría y Logs</h6>
                       </div>
                       <div class="card-body">
                           <div class="row">
                               <div class="col-md-6">
                                   <div class="form-check">
                                       <input class="form-check-input config-input" type="checkbox" 
                                              data-categoria="seguridad" data-campo="habilitarLogAuditoria"
                                              ${config.habilitarLogAuditoria ? 'checked' : ''}>
                                       <label class="form-check-label">
                                           Habilitar Log de Auditoría
                                       </label>
                                   </div>
                               </div>
                               <div class="col-md-6">
                                   <label class="form-label">Nivel de Log de Seguridad</label>
                                   <select class="form-select config-input" 
                                           data-categoria="seguridad" data-campo="nivelLogSeguridad">
                                       <option value="ERROR" ${config.nivelLogSeguridad === 'ERROR' ? 'selected' : ''}>ERROR</option>
                                       <option value="WARN" ${config.nivelLogSeguridad === 'WARN' ? 'selected' : ''}>WARN</option>
                                       <option value="INFO" ${config.nivelLogSeguridad === 'INFO' ? 'selected' : ''}>INFO</option>
                                       <option value="DEBUG" ${config.nivelLogSeguridad === 'DEBUG' ? 'selected' : ''}>DEBUG</option>
                                   </select>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('seguridad-config').innerHTML = contenidoHtml;
   }

   /**
    * Muestra configuración de notificaciones
    */
   mostrarConfiguracionNotificaciones() {
       const config = this.configuracionesActuales.notificaciones;
       
       const contenidoHtml = `
           <div class="row">
               <div class="col-md-6">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="m-0">Configuración General</h6>
                       </div>
                       <div class="card-body">
                           <div class="mb-3">
                               <div class="form-check">
                                   <input class="form-check-input config-input" type="checkbox" 
                                          data-categoria="notificaciones" data-campo="habilitarNotificaciones"
                                          ${config.habilitarNotificaciones ? 'checked' : ''}>
                                   <label class="form-check-label">
                                       Habilitar Sistema de Notificaciones
                                   </label>
                               </div>
                           </div>
                           
                           <div class="mb-3">
                               <div class="form-check">
                                   <input class="form-check-input config-input" type="checkbox" 
                                          data-categoria="notificaciones" data-campo="habilitarEmail"
                                          ${config.habilitarEmail ? 'checked' : ''}>
                                   <label class="form-check-label">
                                       Habilitar Notificaciones por Email
                                   </label>
                               </div>
                           </div>
                           
                           <div class="mb-3">
                               <div class="form-check">
                                   <input class="form-check-input config-input" type="checkbox" 
                                          data-categoria="notificaciones" data-campo="habilitarNotificacionesPush"
                                          ${config.habilitarNotificacionesPush ? 'checked' : ''}>
                                   <label class="form-check-label">
                                       Habilitar Notificaciones Push
                                   </label>
                               </div>
                           </div>
                           
                           <div class="mb-3">
                               <label class="form-label">Frecuencia de Notificaciones</label>
                               <select class="form-select config-input" 
                                       data-categoria="notificaciones" data-campo="frecuenciaNotificaciones">
                                   <option value="inmediata" ${config.frecuenciaNotificaciones === 'inmediata' ? 'selected' : ''}>Inmediata</option>
                                   <option value="cada-hora" ${config.frecuenciaNotificaciones === 'cada-hora' ? 'selected' : ''}>Cada Hora</option>
                                   <option value="diaria" ${config.frecuenciaNotificaciones === 'diaria' ? 'selected' : ''}>Diaria</option>
                                   <option value="semanal" ${config.frecuenciaNotificaciones === 'semanal' ? 'selected' : ''}>Semanal</option>
                               </select>
                           </div>
                       </div>
                   </div>
               </div>
               
               <div class="col-md-6">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="m-0">Configuración SMTP</h6>
                       </div>
                       <div class="card-body">
                           <div class="mb-3">
                               <label class="form-label">Servidor SMTP</label>
                               <input type="text" class="form-control config-input" 
                                      data-categoria="notificaciones" data-campo="servidorSMTP"
                                      value="${config.servidorSMTP}">
                           </div>
                           
                           <div class="mb-3">
                               <label class="form-label">Puerto SMTP</label>
                               <input type="number" class="form-control config-input" 
                                      data-categoria="notificaciones" data-campo="puertoSMTP"
                                      value="${config.puertoSMTP}">
                           </div>
                           
                           <div class="mb-3">
                               <label class="form-label">Usuario SMTP</label>
                               <input type="email" class="form-control config-input" 
                                      data-categoria="notificaciones" data-campo="usuarioSMTP"
                                      value="${config.usuarioSMTP}">
                           </div>
                           
                           <div class="mb-3">
                               <label class="form-label">Plantilla de Email Predeterminada</label>
                               <select class="form-select config-input" 
                                       data-categoria="notificaciones" data-campo="plantillaEmailPredeterminada">
                                   <option value="unsaac-template" ${config.plantillaEmailPredeterminada === 'unsaac-template' ? 'selected' : ''}>UNSAAC Template</option>
                                   <option value="minimal" ${config.plantillaEmailPredeterminada === 'minimal' ? 'selected' : ''}>Minimal</option>
                                   <option value="professional" ${config.plantillaEmailPredeterminada === 'professional' ? 'selected' : ''}>Professional</option>
                               </select>
                           </div>
                           
                           <div class="d-grid">
                               <button class="btn btn-outline-primary" id="btn-probar-smtp">
                                   <i class="fas fa-paper-plane me-1"></i>
                                   Probar Configuración SMTP
                               </button>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('notificaciones-config').innerHTML = contenidoHtml;
   }

   /**
    * Muestra configuración de archivos
    */
   mostrarConfiguracionArchivos() {
       const config = this.configuracionesActuales.archivos;
       
       const contenidoHtml = `
           <div class="row">
               <div class="col-md-6">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="m-0">Configuración de Subida</h6>
                       </div>
                       <div class="card-body">
                           <div class="mb-3">
                               <label class="form-label">Tamaño Máximo de Archivo (MB)</label>
                               <input type="number" class="form-control config-input" 
                                      data-categoria="archivos" data-campo="tamanoMaximoArchivo"
                                      value="${config.tamanoMaximoArchivo}" min="1" max="500">
                           </div>
                           
                           <div class="mb-3">
                               <label class="form-label">Formatos Permitidos</label>
                               <div class="row">
                                   ${['pdf', 'docx', 'xlsx', 'pptx', 'jpg', 'png', 'txt', 'zip'].map(formato => `
                                       <div class="col-md-6">
                                           <div class="form-check">
                                               <input class="form-check-input formato-checkbox" type="checkbox" 
                                                      value="${formato}" ${config.formatosPermitidos.includes(formato) ? 'checked' : ''}>
                                               <label class="form-check-label">.${formato}</label>
                                           </div>
                                       </div>
                                   `).join('')}
                               </div>
                           </div>
                           
                           <div class="mb-3">
                               <label class="form-label">Ruta de Almacenamiento</label>
                               <input type="text" class="form-control config-input" 
                                      data-categoria="archivos" data-campo="rutaAlmacenamiento"
                                      value="${config.rutaAlmacenamiento}">
                           </div>
                       </div>
                   </div>
               </div>
               
               <div class="col-md-6">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="m-0">Configuración Avanzada</h6>
                       </div>
                       <div class="card-body">
                           <div class="mb-3">
                               <div class="form-check">
                                   <input class="form-check-input config-input" type="checkbox" 
                                          data-categoria="archivos" data-campo="habilitarCompresion"
                                          ${config.habilitarCompresion ? 'checked' : ''}>
                                   <label class="form-check-label">
                                       Habilitar Compresión de Imágenes
                                   </label>
                               </div>
                           </div>
                           
                           <div class="mb-3">
                               <label class="form-label">Calidad de Compresión (%)</label>
                               <input type="range" class="form-range config-input" 
                                      data-categoria="archivos" data-campo="calidadCompresion"
                                      value="${config.calidadCompresion}" min="50" max="100">
                               <div class="d-flex justify-content-between">
                                   <small>50%</small>
                                   <small id="calidad-display">${config.calidadCompresion}%</small>
                                   <small>100%</small>
                               </div>
                           </div>
                           
                           <div class="mb-3">
                               <div class="form-check">
                                   <input class="form-check-input config-input" type="checkbox" 
                                          data-categoria="archivos" data-campo="habilitarVersionado"
                                          ${config.habilitarVersionado ? 'checked' : ''}>
                                   <label class="form-check-label">
                                       Habilitar Versionado de Archivos
                                   </label>
                               </div>
                           </div>
                           
                           <div class="mb-3">
                               <label class="form-label">Tiempo de Retención de Versiones (días)</label>
                               <input type="number" class="form-control config-input" 
                                      data-categoria="archivos" data-campo="tiempoRetencionVersiones"
                                      value="${config.tiempoRetencionVersiones}" min="30" max="1095">
                           </div>
                           
                           <div class="mb-3">
                               <div class="form-check">
                                   <input class="form-check-input config-input" type="checkbox" 
                                          data-categoria="archivos" data-campo="escaneadorVirus"
                                          ${config.escaneadorVirus ? 'checked' : ''}>
                                   <label class="form-check-label">
                                       Habilitar Escaneador de Virus
                                   </label>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('archivos-config').innerHTML = contenidoHtml;
   }

   /**
    * Muestra configuración de portafolios
    */
   mostrarConfiguracionPortafolios() {
       const config = this.configuracionesActuales.portafolios;
       
       const contenidoHtml = `
           <div class="row">
               <div class="col-md-6">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="m-0">Configuración de Generación</h6>
                       </div>
                       <div class="card-body">
                           <div class="mb-3">
                               <div class="form-check">
                                   <input class="form-check-input config-input" type="checkbox" 
                                          data-categoria="portafolios" data-campo="generacionAutomatica"
                                          ${config.generacionAutomatica ? 'checked' : ''}>
                                   <label class="form-check-label">
                                       Generación Automática de Portafolios
                                   </label>
                               </div>
                           </div>
                           
                           <div class="mb-3">
                               <label class="form-label">Estructura Predeterminada</label>
                               <select class="form-select config-input" 
                                       data-categoria="portafolios" data-campo="estructuraPredeterminada">
                                   <option value="unsaac-estandar" ${config.estructuraPredeterminada === 'unsaac-estandar' ? 'selected' : ''}>UNSAAC Estándar</option>
                                   <option value="basica" ${config.estructuraPredeterminada === 'basica' ? 'selected' : ''}>Básica</option>
                                   <option value="completa" ${config.estructuraPredeterminada === 'completa' ? 'selected' : ''}>Completa</option>
                                   <option value="personalizada" ${config.estructuraPredeterminada === 'personalizada' ? 'selected' : ''}>Personalizada</option>
                               </select>
                           </div>
                           
                           <div class="mb-3">
                               <div class="form-check">
                                   <input class="form-check-input config-input" type="checkbox" 
                                          data-categoria="portafolios" data-campo="habilitarPersonalizacion"
                                          ${config.habilitarPersonalizacion ? 'checked' : ''}>
                                   <label class="form-check-label">
                                       Permitir Personalización por Docente
                                   </label>
                               </div>
                           </div>
                           
                           <div class="mb-3">
                               <div class="form-check">
                                   <input class="form-check-input config-input" type="checkbox" 
                                          data-categoria="portafolios" data-campo="requiereAprobacionEstructura"
                                          ${config.requiereAprobacionEstructura ? 'checked' : ''}>
                                   <label class="form-check-label">
                                       Requerir Aprobación de Estructura Personalizada
                                   </label>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
               
               <div class="col-md-6">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="m-0">Configuración de Evaluación</h6>
                       </div>
                       <div class="card-body">
                           <div class="mb-3">
                               <label class="form-label">Progreso Mínimo para Aprobación (%)</label>
                               <input type="number" class="form-control config-input" 
                                      data-categoria="portafolios" data-campo="progresoMinimoAprobacion"
                                      value="${config.progresoMinimoAprobacion}" min="0" max="100">
                           </div>
                           
                           <div class="mb-3">
                               <label class="form-label">Alerta de Progreso Mínimo (%)</label>
                               <input type="number" class="form-control config-input" 
                                      data-categoria="portafolios" data-campo="alertaProgresoMinimo"
                                      value="${config.alertaProgresoMinimo}" min="0" max="100">
                           </div>
                           
                           <div class="mb-3">
                               <label class="form-label">Días Límite para Subida</label>
                               <input type="number" class="form-control config-input" 
                                      data-categoria="portafolios" data-campo="diasLimiteSubida"
                                      value="${config.diasLimiteSubida}" min="1" max="90">
                           </div>
                           
                           <div class="mb-3">
                               <div class="form-check">
                                   <input class="form-check-input config-input" type="checkbox" 
                                          data-categoria="portafolios" data-campo="habilitarCalificaciones"
                                          ${config.habilitarCalificaciones ? 'checked' : ''}>
                                   <label class="form-check-label">
                                       Habilitar Sistema de Calificaciones
                                   </label>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('portafolios-config').innerHTML = contenidoHtml;
   }

   /**
    * Muestra configuración de reportes
    */
   mostrarConfiguracionReportes() {
       const config = this.configuracionesActuales.reportes;
       
       const contenidoHtml = `
           <div class="row">
               <div class="col-md-6">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="m-0">Configuración General</h6>
                       </div>
                       <div class="card-body">
                           <div class="mb-3">
                               <div class="form-check">
                                   <input class="form-check-input config-input" type="checkbox" 
                                          data-categoria="reportes" data-campo="habilitarReportes"
                                          ${config.habilitarReportes ? 'checked' : ''}>
                                   <label class="form-check-label">
                                       Habilitar Sistema de Reportes
                                   </label>
                               </div>
                           </div>
                           
                           <div class="mb-3">
                               <label class="form-label">Formatos de Exportación</label>
                               <div class="row">
                                   ${['pdf', 'excel', 'csv', 'json'].map(formato => `
                                       <div class="col-md-6">
                                           <div class="form-check">
                                               <input class="form-check-input formato-reporte-checkbox" type="checkbox" 
                                                      value="${formato}" ${config.formatosExportacion.includes(formato) ? 'checked' : ''}>
                                               <label class="form-check-label">${formato.toUpperCase()}</label>
                                           </div>
                                       </div>
                                   `).join('')}
                               </div>
                           </div>
                           
                           <div class="mb-3">
                               <div class="form-check">
                                   <input class="form-check-input config-input" type="checkbox" 
                                          data-categoria="reportes" data-campo="habilitarProgramacion"
                                          ${config.habilitarProgramacion ? 'checked' : ''}>
                                   <label class="form-check-label">
                                       Habilitar Programación de Reportes
                                   </label>
                               </div>
                           </div>
                           
                           <div class="mb-3">
                               <label class="form-label">Retención de Reportes (días)</label>
                               <input type="number" class="form-control config-input" 
                                      data-categoria="reportes" data-campo="retencionReportes"
                                      value="${config.retencionReportes}" min="7" max="365">
                           </div>
                       </div>
                   </div>
               </div>
               
               <div class="col-md-6">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="m-0">Configuración de Dashboards</h6>
                       </div>
                       <div class="card-body">
                           <div class="mb-3">
                               <div class="form-check">
                                   <input class="form-check-input config-input" type="checkbox" 
                                          data-categoria="reportes" data-campo="habilitarDashboards"
                                          ${config.habilitarDashboards ? 'checked' : ''}>
                                   <label class="form-check-label">
                                       Habilitar Dashboards
                                   </label>
                               </div>
                           </div>
                           
                           <div class="mb-3">
                               <label class="form-label">Actualización de Dashboards</label>
                               <select class="form-select config-input" 
                                       data-categoria="reportes" data-campo="actualizacionDashboards">
                                   <option value="tiempo-real" ${config.actualizacionDashboards === 'tiempo-real' ? 'selected' : ''}>Tiempo Real</option>
                                   <option value="cada-minuto" ${config.actualizacionDashboards === 'cada-minuto' ? 'selected' : ''}>Cada Minuto</option>
                                   <option value="cada-5-minutos" ${config.actualizacionDashboards === 'cada-5-minutos' ? 'selected' : ''}>Cada 5 Minutos</option>
                                   <option value="cada-15-minutos" ${config.actualizacionDashboards === 'cada-15-minutos' ? 'selected' : ''}>Cada 15 Minutos</option>
                               </select>
                           </div>
                           
                           <div class="mb-3">
                               <div class="form-check">
                                   <input class="form-check-input config-input" type="checkbox" 
                                          data-categoria="reportes" data-campo="habilitarCompartirReportes"
                                          ${config.habilitarCompartirReportes ? 'checked' : ''}>
                                   <label class="form-check-label">
                                       Habilitar Compartir Reportes
                                   </label>
                               </div>
                           </div>
                           
                           <div class="mb-3">
                               <label class="form-label">Marca de Agua en Reportes</label>
                               <input type="text" class="form-control config-input" 
                                      data-categoria="reportes" data-campo="marcaAguaReportes"
                                      value="${config.marcaAguaReportes}">
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('reportes-config').innerHTML = contenidoHtml;
   }

   /**
    * Muestra configuración de mantenimiento
    */
   mostrarConfiguracionMantenimiento() {
       const config = this.configuracionesActuales.mantenimiento;
       
       const contenidoHtml = `
           <div class="row">
               <div class="col-md-6">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="m-0">Modo Mantenimiento</h6>
                       </div>
                       <div class="card-body">
                           <div class="mb-3">
                               <div class="form-check form-switch">
                                   <input class="form-check-input config-input" type="checkbox" 
                                          data-categoria="mantenimiento" data-campo="modoMantenimiento"
                                          ${config.modoMantenimiento ? 'checked' : ''}>
                                   <label class="form-check-label">
                                       <strong>Activar Modo Mantenimiento</strong>
                                   </label>
                               </div>
                               <small class="text-muted">
                                   El sistema será inaccesible para usuarios normales
                               </small>
                           </div>
                           
                           <div class="mb-3">
                               <label class="form-label">Mensaje de Mantenimiento</label>
                               <textarea class="form-control config-input" rows="3"
                                         data-categoria="mantenimiento" data-campo="mensajeMantenimiento">${config.mensajeMantenimiento}</textarea>
                           </div>
                       </div>
                   </div>
               </div>
               
               <div class="col-md-6">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="m-0">Respaldos Automáticos</h6>
                       </div>
                       <div class="card-body">
                           <div class="mb-3">
                               <div class="form-check">
                                   <input class="form-check-input config-input" type="checkbox" 
                                          data-categoria="mantenimiento" data-campo="respaldoAutomatico"
                                          ${config.respaldoAutomatico ? 'checked' : ''}>
                                   <label class="form-check-label">
                                       Habilitar Respaldo Automático
                                   </label>
                               </div>
                           </div>
                           
                           <div class="mb-3">
                               <label class="form-label">Frecuencia de Respaldo</label>
                               <select class="form-select config-input" 
                                       data-categoria="mantenimiento" data-campo="frecuenciaRespaldo">
                                   <option value="diario" ${config.frecuenciaRespaldo === 'diario' ? 'selected' : ''}>Diario</option>
                                   <option value="semanal" ${config.frecuenciaRespaldo === 'semanal' ? 'selected' : ''}>Semanal</option>
                                   <option value="mensual" ${config.frecuenciaRespaldo === 'mensual' ? 'selected' : ''}>Mensual</option>
                               </select>
                           </div>
                           
                           <div class="mb-3">
                               <label class="form-label">Hora de Respaldo</label>
                               <input type="time" class="form-control config-input" 
                                      data-categoria="mantenimiento" data-campo="horaRespaldo"
                                      value="${config.horaRespaldo}">
                           </div>
                           
                           <div class="mb-3">
                               <label class="form-label">Retención de Respaldos (días)</label>
                               <input type="number" class="form-control config-input" 
                                      data-categoria="mantenimiento" data-campo="retencionRespaldos"
                                      value="${config.retencionRespaldos}" min="7" max="365">
                           </div>
                       </div>
                   </div>
               </div>
               
               <div class="col-12">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="m-0">Tareas de Mantenimiento</h6>
                       </div>
                       <div class="card-body">
                           <div class="row">
                               <div class="col-md-4">
                                   <label class="form-label">Optimización de Base de Datos</label>
                                   <select class="form-select config-input" 
                                           data-categoria="mantenimiento" data-campo="optimizacionBD">
                                       <option value="nunca" ${config.optimizacionBD === 'nunca' ? 'selected' : ''}>Nunca</option>
                                       <option value="semanal" ${config.optimizacionBD === 'semanal' ? 'selected' : ''}>Semanal</option>
                                       <option value="mensual" ${config.optimizacionBD === 'mensual' ? 'selected' : ''}>Mensual</option>
                                   </select>
                               </div>
                               
                               <div class="col-md-4">
                                   <div class="form-check mt-4">
                                       <input class="form-check-input config-input" type="checkbox" 
                                              data-categoria="mantenimiento" data-campo="limpiezaLogsAutomatica"
                                              ${config.limpiezaLogsAutomatica ? 'checked' : ''}>
                                       <label class="form-check-label">
                                           Limpieza Automática de Logs
                                       </label>
                                   </div>
                               </div>
                               
                               <div class="col-md-4">
                                   <div class="d-grid mt-3">
                                       <button class="btn btn-outline-warning" id="btn-ejecutar-mantenimiento">
                                           <i class="fas fa-tools me-1"></i>
                                           Ejecutar Mantenimiento Ahora
                                       </button>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('mantenimiento-config').innerHTML = contenidoHtml;
   }

   /**
    * Crea panel de cambios pendientes
    */
   crearPanelCambios() {
       const panelHtml = `
           <div class="card border-warning" id="panel-cambios" style="display: none;">
               <div class="card-header bg-warning text-dark">
                   <h6 class="m-0">
                       <i class="fas fa-exclamation-triangle me-1"></i>
                       Cambios Pendientes
                   </h6>
               </div>
               <div class="card-body">
                   <div id="lista-cambios">
                       <!-- Se llena dinámicamente -->
                   </div>
                   <div class="mt-3">
                       <button class="btn btn-success me-2" id="btn-guardar-cambios">
                           <i class="fas fa-save me-1"></i>
                           Guardar Todos los Cambios
                       </button>
                       <button class="btn btn-outline-secondary" id="btn-descartar-cambios">
                           <i class="fas fa-times me-1"></i>
                           Descartar Cambios
                       </button>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('panel-cambios-pendientes').innerHTML = panelHtml;
   }

   /**
    * Configura eventos de la interfaz
    */
   configurarEventos() {
       // Detectar cambios en configuraciones
       document.addEventListener('change', (e) => {
           if (e.target.classList.contains('config-input')) {
               this.registrarCambio(e.target);
           }
       });

       document.addEventListener('input', (e) => {
           if (e.target.classList.contains('config-input')) {
               this.registrarCambio(e.target);
           }
       });
       
       // Botones de acción
       document.getElementById('btn-guardar-cambios')?.addEventListener('click', () => {
           this.guardarCambios();
       });
       
       document.getElementById('btn-descartar-cambios')?.addEventListener('click', () => {
           this.descartarCambios();
       });
       
       document.getElementById('btn-probar-smtp')?.addEventListener('click', () => {
           this.probarConfiguracionSMTP();
       });
       
       document.getElementById('btn-ejecutar-mantenimiento')?.addEventListener('click', () => {
           this.ejecutarMantenimiento();
       });
       
       // Checkboxes especiales para arrays
       document.addEventListener('change', (e) => {
           if (e.target.classList.contains('formato-checkbox')) {
               this.actualizarFormatosPermitidos();
           }
           
           if (e.target.classList.contains('formato-reporte-checkbox')) {
               this.actualizarFormatosReportes();
           }
       });
       
       // Range slider para calidad de compresión
       document.querySelector('[data-campo="calidadCompresion"]')?.addEventListener('input', (e) => {
           document.getElementById('calidad-display').textContent = e.target.value + '%';
       });
   }

   /**
    * Registra un cambio en la configuración
    */
   registrarCambio(input) {
       const categoria = input.dataset.categoria;
       const campo = input.dataset.campo;
       let valor = input.type === 'checkbox' ? input.checked : input.value;
       
       // Convertir a número si es necesario
       if (input.type === 'number' || input.type === 'range') {
           valor = parseInt(valor) || 0;
       }
       
       // Registrar el cambio
       if (!this.cambiosPendientes[categoria]) {
           this.cambiosPendientes[categoria] = {};
       }
       
       this.cambiosPendientes[categoria][campo] = valor;
       this.configuracionesActuales[categoria][campo] = valor;
       
       this.actualizarPanelCambios();
   }

   /**
    * Actualiza formatos permitidos
    */
   actualizarFormatosPermitidos() {
       const checkboxes = document.querySelectorAll('.formato-checkbox:checked');
       const formatos = Array.from(checkboxes).map(cb => cb.value);
       
       this.configuracionesActuales.archivos.formatosPermitidos = formatos;
       
       if (!this.cambiosPendientes.archivos) {
           this.cambiosPendientes.archivos = {};
       }
       this.cambiosPendientes.archivos.formatosPermitidos = formatos;
       
       this.actualizarPanelCambios();
   }

   /**
    * Actualiza formatos de reportes
    */
   actualizarFormatosReportes() {
       const checkboxes = document.querySelectorAll('.formato-reporte-checkbox:checked');
       const formatos = Array.from(checkboxes).map(cb => cb.value);
       
       this.configuracionesActuales.reportes.formatosExportacion = formatos;
       
       if (!this.cambiosPendientes.reportes) {
           this.cambiosPendientes.reportes = {};
       }
       this.cambiosPendientes.reportes.formatosExportacion = formatos;
       
       this.actualizarPanelCambios();
   }

   /**
    * Actualiza el panel de cambios pendientes
    */
   actualizarPanelCambios() {
       const panel = document.getElementById('panel-cambios');
       const lista = document.getElementById('lista-cambios');
       
       const totalCambios = Object.keys(this.cambiosPendientes).length;
       
       if (totalCambios === 0) {
           panel.style.display = 'none';
           return;
       }
       
       panel.style.display = 'block';
       
       const cambiosHtml = Object.entries(this.cambiosPendientes).map(([categoria, cambios]) => {
           const cambiosTexto = Object.entries(cambios).map(([campo, valor]) => {
               return `<li><strong>${campo}:</strong> ${valor}</li>`;
           }).join('');
           
           return `
               <div class="mb-2">
                   <strong>${categoria.charAt(0).toUpperCase() + categoria.slice(1)}:</strong>
                   <ul class="mb-0 ms-3">
                       ${cambiosTexto}
                   </ul>
               </div>
           `;
       }).join('');
       
       lista.innerHTML = cambiosHtml;
   }

   /**
    * Guarda todos los cambios
    */
   async guardarCambios() {
       try {
           Utilidades.mostrarCargando('#btn-guardar-cambios');
           
           // Simular guardado en el backend
           await this.guardarConfiguracionesEnBackend(this.cambiosPendientes);
           
           // Actualizar configuraciones originales
           Object.keys(this.cambiosPendientes).forEach(categoria => {
               Object.assign(this.configuracionesOriginales[categoria], this.cambiosPendientes[categoria]);
           });
           
           // Limpiar cambios pendientes
           this.cambiosPendientes = {};
           this.actualizarPanelCambios();
           
           Utilidades.mostrarNotificacion('Configuraciones guardadas exitosamente', 'success');
           
       } catch (error) {
           console.error('Error al guardar configuraciones:', error);
           Utilidades.mostrarNotificacion('Error al guardar configuraciones', 'error');
       } finally {
           Utilidades.ocultarCargando('#btn-guardar-cambios');
       }
   }

   /**
    * Descarta todos los cambios
    */
   descartarCambios() {
       // Restaurar configuraciones originales
       this.configuracionesActuales = { ...this.configuracionesOriginales };
       this.cambiosPendientes = {};
       
       // Recargar interfaz
       this.configurarInterfaz();
       
       Utilidades.mostrarNotificacion('Cambios descartados', 'info');
   }

   /**
    * Guarda configuraciones en el backend (simulado)
    */
   async guardarConfiguracionesEnBackend(cambios) {
       // En un caso real, esto enviaría los cambios al backend
       return new Promise((resolve) => {
           setTimeout(resolve, 1000); // Simular latencia
       });
   }

   /**
    * Prueba la configuración SMTP
    */
   async probarConfiguracionSMTP() {
       try {
           Utilidades.mostrarCargando('#btn-probar-smtp');
           
           // Simular prueba SMTP
           await new Promise(resolve => setTimeout(resolve, 2000));
           
           Utilidades.mostrarNotificacion('Configuración SMTP válida', 'success');
           
       } catch (error) {
           Utilidades.mostrarNotificacion('Error en configuración SMTP', 'error');
       } finally {
           Utilidades.ocultarCargando('#btn-probar-smtp');
       }
   }

   /**
    * Ejecuta tareas de mantenimiento
    */
   async ejecutarMantenimiento() {
       const confirmacion = await Utilidades.mostrarConfirmacion(
           '¿Ejecutar mantenimiento del sistema?',
           'Esta operación puede tardar varios minutos y afectar el rendimiento.',
           'warning'
       );
       
       if (!confirmacion) return;
       
       try {
           Utilidades.mostrarCargando('#btn-ejecutar-mantenimiento');
           
           // Simular tareas de mantenimiento
           await new Promise(resolve => setTimeout(resolve, 5000));
           
           Utilidades.mostrarNotificacion('Mantenimiento ejecutado exitosamente', 'success');
           
       } catch (error) {
           Utilidades.mostrarNotificacion('Error en tareas de mantenimiento', 'error');
       } finally {
           Utilidades.ocultarCargando('#btn-ejecutar-mantenimiento');
       }
   }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
   window.configuracionSistema = new ConfiguracionSistema();
});

// Exportar para uso global
window.ConfiguracionSistema = ConfiguracionSistema;