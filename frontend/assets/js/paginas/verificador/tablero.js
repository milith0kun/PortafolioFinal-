/**
 * 🔍 DASHBOARD VERIFICADOR
 * Sistema Portafolio Docente UNSAAC
 * 
 * Panel principal para verificadores del sistema
 * Incluye cola de revisión, estadísticas, docentes asignados y herramientas de verificación
 */

class TableroVerificador {
   constructor() {
       this.servicioPortafolios = new ServicioPortafolios();
       this.servicioRoles = new ServicioRoles();
       this.servicioUsuarios = new ServicioUsuarios();
       this.sistemaModales = new SistemaModales();
       
       // Estado del dashboard
       this.estado = {
           estadisticas: {},
           colaRevision: [],
           docentesAsignados: [],
           observacionesActivas: [],
           configuracionVista: {
               autoRefresh: true,
               intervaloRefresh: 30000, // 30 segundos
               mostrarNotificaciones: true,
               vista: 'compacta' // compacta | detallada
           }
       };
       
       this.intervalos = {
           estadisticas: null,
           colaRevision: null,
           notificaciones: null
       };
       
       this.init();
   }

   /**
    * 🚀 Inicialización del dashboard
    */
   async init() {
       try {
           // Verificar permisos de verificador
           if (!SistemaAutenticacion.verificarPermiso('verificador')) {
               window.location.href = '/paginas/errores/403.html';
               return;
           }

           await this.configurarInterfaz();
           await this.cargarDatosIniciales();
           this.configurarEventos();
           this.iniciarActualizacionAutomatica();
           
           Utilidades.mostrarNotificacion('Dashboard cargado correctamente', 'success');
       } catch (error) {
           console.error('Error inicializando dashboard verificador:', error);
           Utilidades.mostrarNotificacion('Error cargando el dashboard', 'error');
       }
   }

   /**
    * 🎨 Configurar interfaz del dashboard
    */
   async configurarInterfaz() {
       // Configurar header del verificador
       document.title = 'Dashboard Verificador - Sistema Portafolio UNSAAC';
       
       // Actualizar breadcrumb
       const breadcrumb = document.querySelector('#breadcrumb');
       if (breadcrumb) {
           breadcrumb.innerHTML = `
               <li class="breadcrumb-item">
                   <i class="fas fa-shield-alt me-1"></i>Verificador
               </li>
               <li class="breadcrumb-item active">Dashboard</li>
           `;
       }

       // Configurar vista según preferencias
       const configuracion = await this.cargarConfiguracionUsuario();
       this.estado.configuracionVista = { ...this.estado.configuracionVista, ...configuracion };
       
       // Aplicar tema y configuraciones
       this.aplicarConfiguracionVista();
   }

   /**
    * 📊 Cargar datos iniciales del dashboard
    */
   async cargarDatosIniciales() {
       await Promise.all([
           this.cargarEstadisticas(),
           this.cargarColaRevision(),
           this.cargarDocentesAsignados(),
           this.cargarObservacionesActivas()
       ]);
       
       this.renderizarDashboard();
   }

   /**
    * 📈 Cargar estadísticas del verificador
    */
   async cargarEstadisticas() {
       try {
           const response = await ClienteAPI.get('/verificacion/estadisticas/verificador/mi');
           this.estado.estadisticas = response.data;
           
           // Calcular métricas adicionales
           this.calcularMetricasAdicionales();
           
       } catch (error) {
           console.error('Error cargando estadísticas:', error);
           this.estado.estadisticas = this.obtenerEstadisticasDefault();
       }
   }

   /**
    * 📋 Cargar cola de revisión
    */
   async cargarColaRevision() {
       try {
           const response = await ClienteAPI.get('/verificacion/pendientes', {
               limit: 20,
               include_priority: true
           });
           
           this.estado.colaRevision = response.data.items;
           this.organizarColaPorPrioridad();
           
       } catch (error) {
           console.error('Error cargando cola de revisión:', error);
           this.estado.colaRevision = [];
       }
   }

   /**
    * 👥 Cargar docentes asignados
    */
   async cargarDocentesAsignados() {
       try {
           const response = await ClienteAPI.get('/verificacion/mis-asignaciones');
           this.estado.docentesAsignados = response.data;
           
       } catch (error) {
           console.error('Error cargando docentes asignados:', error);
           this.estado.docentesAsignados = [];
       }
   }

   /**
    * 💬 Cargar observaciones activas
    */
   async cargarObservacionesActivas() {
       try {
           const response = await ClienteAPI.get('/observaciones/activas');
           this.estado.observacionesActivas = response.data;
           
       } catch (error) {
           console.error('Error cargando observaciones:', error);
           this.estado.observacionesActivas = [];
       }
   }

   /**
    * 🎯 Calcular métricas adicionales
    */
   calcularMetricasAdicionales() {
       const stats = this.estado.estadisticas;
       
       // Calcular tasa de eficiencia
       const totalRevisados = stats.documentos_aprobados + stats.documentos_rechazados;
       stats.tasa_eficiencia = totalRevisados > 0 ? 
           Math.round((stats.documentos_aprobados / totalRevisados) * 100) : 0;
       
       // Calcular tiempo promedio de revisión
       stats.tiempo_promedio_revision = stats.tiempo_total_revision > 0 ? 
           Math.round(stats.tiempo_total_revision / totalRevisados) : 0;
       
       // Calcular productividad semanal
       const diasTrabajados = 5; // Lunes a viernes
       stats.productividad_diaria = Math.round(totalRevisados / diasTrabajados);
       
       // Determinar tendencia
       stats.tendencia = this.calcularTendencia(stats);
   }

   /**
    * 📈 Calcular tendencia de productividad
    */
   calcularTendencia(stats) {
       // Comparar con semana anterior (simplificado)
       const cambio = stats.cambio_semanal || 0;
       
       if (cambio > 5) return { tipo: 'up', clase: 'text-success', icono: 'fa-arrow-up' };
       if (cambio < -5) return { tipo: 'down', clase: 'text-danger', icono: 'fa-arrow-down' };
       return { tipo: 'stable', clase: 'text-info', icono: 'fa-minus' };
   }

   /**
    * 🔄 Organizar cola por prioridad
    */
   organizarColaPorPrioridad() {
       this.estado.colaRevision.sort((a, b) => {
           const prioridades = { 'alta': 3, 'media': 2, 'baja': 1 };
           const prioridadA = prioridades[a.prioridad] || 1;
           const prioridadB = prioridades[b.prioridad] || 1;
           
           if (prioridadA !== prioridadB) {
               return prioridadB - prioridadA; // Mayor prioridad primero
           }
           
           // Si tienen la misma prioridad, ordenar por fecha
           return new Date(a.fecha_subida) - new Date(b.fecha_subida);
       });
   }

   /**
    * 🎨 Renderizar dashboard completo
    */
   renderizarDashboard() {
       const container = document.querySelector('#dashboard-content');
       if (!container) return;

       container.innerHTML = `
           <div class="row g-3">
               <!-- Estadísticas principales -->
               <div class="col-12">
                   ${this.renderizarEstadisticas()}
               </div>
               
               <!-- Fila principal de contenido -->
               <div class="col-lg-8">
                   <!-- Cola de revisión -->
                   <div class="card h-100">
                       <div class="card-header d-flex justify-content-between align-items-center">
                           <h5 class="card-title mb-0">
                               <i class="fas fa-list-check me-2"></i>Cola de Revisión
                               <span class="badge bg-primary ms-2">${this.estado.colaRevision.length}</span>
                           </h5>
                           <div class="btn-group" role="group">
                               <button type="button" class="btn btn-sm btn-outline-primary" 
                                       onclick="tableroVerificador.cambiarVistaLista('compacta')">
                                   <i class="fas fa-list"></i>
                               </button>
                               <button type="button" class="btn btn-sm btn-outline-primary" 
                                       onclick="tableroVerificador.cambiarVistaLista('detallada')">
                                   <i class="fas fa-th-large"></i>
                               </button>
                           </div>
                       </div>
                       <div class="card-body p-0">
                           ${this.renderizarColaRevision()}
                       </div>
                   </div>
               </div>
               
               <!-- Panel lateral -->
               <div class="col-lg-4">
                   <!-- Docentes asignados -->
                   <div class="card mb-3">
                       <div class="card-header">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-users me-2"></i>Docentes Asignados
                           </h6>
                       </div>
                       <div class="card-body">
                           ${this.renderizarDocentesAsignados()}
                       </div>
                   </div>
                   
                   <!-- Herramientas rápidas -->
                   <div class="card mb-3">
                       <div class="card-header">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-tools me-2"></i>Herramientas Rápidas
                           </h6>
                       </div>
                       <div class="card-body">
                           ${this.renderizarHerramientasRapidas()}
                       </div>
                   </div>
                   
                   <!-- Observaciones activas -->
                   <div class="card">
                       <div class="card-header">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-comments me-2"></i>Observaciones Activas
                               <span class="badge bg-warning ms-2">${this.estado.observacionesActivas.length}</span>
                           </h6>
                       </div>
                       <div class="card-body">
                           ${this.renderizarObservacionesActivas()}
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 📊 Renderizar estadísticas principales
    */
   renderizarEstadisticas() {
       const stats = this.estado.estadisticas;
       
       return `
           <div class="row g-3">
               <div class="col-md-3">
                   <div class="card bg-primary text-white">
                       <div class="card-body text-center">
                           <i class="fas fa-clock fa-2x mb-2 opacity-75"></i>
                           <h3 class="mb-1">${stats.documentos_pendientes || 0}</h3>
                           <p class="card-text mb-0">Pendientes de Revisión</p>
                       </div>
                   </div>
               </div>
               
               <div class="col-md-3">
                   <div class="card bg-success text-white">
                       <div class="card-body text-center">
                           <i class="fas fa-check-circle fa-2x mb-2 opacity-75"></i>
                           <h3 class="mb-1">${stats.documentos_aprobados || 0}</h3>
                           <p class="card-text mb-0">Aprobados Esta Semana</p>
                       </div>
                   </div>
               </div>
               
               <div class="col-md-3">
                   <div class="card bg-info text-white">
                       <div class="card-body text-center">
                           <i class="fas fa-tachometer-alt fa-2x mb-2 opacity-75"></i>
                           <h3 class="mb-1">${stats.tasa_eficiencia || 0}%</h3>
                           <p class="card-text mb-0">Tasa de Eficiencia</p>
                           <small class="d-block">
                               <i class="fas ${stats.tendencia?.icono} ${stats.tendencia?.clase}"></i>
                               ${stats.cambio_semanal || 0}% vs semana anterior
                           </small>
                       </div>
                   </div>
               </div>
               
               <div class="col-md-3">
                   <div class="card bg-warning text-white">
                       <div class="card-body text-center">
                           <i class="fas fa-user-clock fa-2x mb-2 opacity-75"></i>
                           <h3 class="mb-1">${stats.tiempo_promedio_revision || 0}min</h3>
                           <p class="card-text mb-0">Tiempo Promedio</p>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 📋 Renderizar cola de revisión
    */
   renderizarColaRevision() {
       if (this.estado.colaRevision.length === 0) {
           return `
               <div class="text-center py-5">
                   <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                   <h5 class="text-muted">No hay documentos pendientes</h5>
                   <p class="text-muted">¡Excelente trabajo! Tu cola de revisión está vacía.</p>
               </div>
           `;
       }

       const documentos = this.estado.colaRevision.slice(0, 10); // Mostrar primeros 10
       
       return `
           <div class="list-group list-group-flush">
               ${documentos.map(doc => this.renderizarItemColaRevision(doc)).join('')}
               ${this.estado.colaRevision.length > 10 ? `
                   <div class="list-group-item text-center py-3">
                       <button class="btn btn-outline-primary btn-sm" 
                               onclick="tableroVerificador.verColaCompleta()">
                           Ver todos los ${this.estado.colaRevision.length} documentos
                           <i class="fas fa-arrow-right ms-1"></i>
                       </button>
                   </div>
               ` : ''}
           </div>
       `;
   }

   /**
    * 📄 Renderizar item individual de cola
    */
   renderizarItemColaRevision(documento) {
       const prioridadClass = {
           'alta': 'border-danger',
           'media': 'border-warning', 
           'baja': 'border-info'
       };

       const tiempoEspera = this.calcularTiempoEspera(documento.fecha_subida);
       
       return `
           <div class="list-group-item list-group-item-action ${prioridadClass[documento.prioridad] || ''}" 
                onclick="tableroVerificador.revisarDocumento('${documento.id}')">
               <div class="d-flex w-100 justify-content-between align-items-start">
                   <div class="flex-grow-1">
                       <h6 class="mb-1">
                           <i class="fas fa-file-pdf text-danger me-2"></i>
                           ${documento.nombre_archivo}
                       </h6>
                       <p class="mb-1 text-muted small">
                           <i class="fas fa-user me-1"></i>${documento.docente_nombre}
                           <span class="mx-2">•</span>
                           <i class="fas fa-book me-1"></i>${documento.asignatura_nombre}
                       </p>
                       <small class="text-muted">
                           <i class="fas fa-clock me-1"></i>Subido ${tiempoEspera}
                       </small>
                   </div>
                   <div class="text-end">
                       <span class="badge bg-${this.obtenerColorPrioridad(documento.prioridad)} mb-2">
                           ${documento.prioridad?.toUpperCase() || 'NORMAL'}
                       </span>
                       <br>
                       <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); tableroVerificador.revisarDocumento('${documento.id}')">
                           <i class="fas fa-eye me-1"></i>Revisar
                       </button>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 👥 Renderizar docentes asignados
    */
   renderizarDocentesAsignados() {
       if (this.estado.docentesAsignados.length === 0) {
           return `
               <div class="text-center py-3">
                   <i class="fas fa-user-slash text-muted mb-2"></i>
                   <p class="text-muted mb-0">No tienes docentes asignados</p>
               </div>
           `;
       }

       return `
           <div class="list-group list-group-flush">
               ${this.estado.docentesAsignados.slice(0, 5).map(docente => `
                   <div class="list-group-item d-flex justify-content-between align-items-center py-2">
                       <div class="d-flex align-items-center">
                           <div class="avatar-sm bg-light rounded-circle me-2 d-flex align-items-center justify-content-center">
                               ${docente.avatar ? 
                                   `<img src="${docente.avatar}" class="rounded-circle" width="32" height="32">` :
                                   `<i class="fas fa-user text-muted"></i>`
                               }
                           </div>
                           <div>
                               <h6 class="mb-0">${docente.nombres} ${docente.apellidos}</h6>
                               <small class="text-muted">
                                   ${docente.documentos_pendientes || 0} pendientes
                               </small>
                           </div>
                       </div>
                       <span class="badge bg-${docente.documentos_pendientes > 0 ? 'warning' : 'success'}">
                           ${docente.documentos_pendientes || 0}
                       </span>
                   </div>
               `).join('')}
               ${this.estado.docentesAsignados.length > 5 ? `
                   <div class="list-group-item text-center py-2">
                       <small>
                           <a href="/paginas/verificador/mis-docentes.html" class="text-decoration-none">
                               Ver todos (${this.estado.docentesAsignados.length})
                           </a>
                       </small>
                   </div>
               ` : ''}
           </div>
       `;
   }

   /**
    * 🛠️ Renderizar herramientas rápidas
    */
   renderizarHerramientasRapidas() {
       return `
           <div class="d-grid gap-2">
               <button class="btn btn-outline-primary btn-sm" onclick="tableroVerificador.verColaCompleta()">
                   <i class="fas fa-list-check me-2"></i>Cola Completa
               </button>
               <button class="btn btn-outline-info btn-sm" onclick="tableroVerificador.generarReporte()">
                   <i class="fas fa-chart-bar me-2"></i>Generar Reporte
               </button>
               <button class="btn btn-outline-success btn-sm" onclick="tableroVerificador.configurarPreferencias()">
                   <i class="fas fa-cog me-2"></i>Configuración
               </button>
               <button class="btn btn-outline-warning btn-sm" onclick="tableroVerificador.planificarTiempo()">
                   <i class="fas fa-calendar-alt me-2"></i>Planificar Tiempo
               </button>
           </div>
       `;
   }

   /**
    * 💬 Renderizar observaciones activas
    */
   renderizarObservacionesActivas() {
       if (this.estado.observacionesActivas.length === 0) {
           return `
               <div class="text-center py-3">
                   <i class="fas fa-comment-slash text-muted mb-2"></i>
                   <p class="text-muted mb-0">No hay observaciones activas</p>
               </div>
           `;
       }

       return `
           <div class="list-group list-group-flush">
               ${this.estado.observacionesActivas.slice(0, 5).map(obs => `
                   <div class="list-group-item py-2">
                       <div class="d-flex justify-content-between align-items-start">
                           <div class="flex-grow-1">
                               <h6 class="mb-1 small">${obs.documento_nombre}</h6>
                               <p class="mb-1 small text-muted">${obs.contenido.substring(0, 80)}...</p>
                               <small class="text-muted">
                                   ${obs.docente_nombre} • ${Utilidades.formatearFechaRelativa(obs.fecha_creacion)}
                               </small>
                           </div>
                           <span class="badge bg-${obs.requiere_respuesta ? 'warning' : 'info'} ms-2">
                               ${obs.requiere_respuesta ? 'Respuesta' : 'Info'}
                           </span>
                       </div>
                   </div>
               `).join('')}
               ${this.estado.observacionesActivas.length > 5 ? `
                   <div class="list-group-item text-center py-2">
                       <small>
                           <a href="/paginas/verificador/observaciones.html" class="text-decoration-none">
                               Ver todas (${this.estado.observacionesActivas.length})
                           </a>
                       </small>
                   </div>
               ` : ''}
           </div>
       `;
   }

   /**
    * ⚙️ Configurar eventos del dashboard
    */
   configurarEventos() {
       // Auto-refresh toggle
       const autoRefreshToggle = document.querySelector('#auto-refresh-toggle');
       if (autoRefreshToggle) {
           autoRefreshToggle.addEventListener('change', (e) => {
               this.estado.configuracionVista.autoRefresh = e.target.checked;
               this.toggleActualizacionAutomatica();
               this.guardarConfiguracionUsuario();
           });
       }

       // Configurar shortcuts de teclado
       document.addEventListener('keydown', (e) => {
           if (e.ctrlKey || e.metaKey) {
               switch(e.key) {
                   case 'r':
                       e.preventDefault();
                       this.actualizarDatos();
                       break;
                   case '1':
                       e.preventDefault();
                       this.verColaCompleta();
                       break;
                   case '2':
                       e.preventDefault();
                       this.generarReporte();
                       break;
               }
           }
       });

       // Eventos de visibilidad para pausar updates
       document.addEventListener('visibilitychange', () => {
           if (document.hidden) {
               this.pausarActualizacionAutomatica();
           } else {
               this.reanudarActualizacionAutomatica();
           }
       });
   }

   /**
    * 🔄 Iniciar actualización automática
    */
   iniciarActualizacionAutomatica() {
       if (!this.estado.configuracionVista.autoRefresh) return;

       // Actualizar estadísticas cada 1 minuto
       this.intervalos.estadisticas = setInterval(() => {
           this.cargarEstadisticas();
       }, 60000);

       // Actualizar cola cada 30 segundos
       this.intervalos.colaRevision = setInterval(() => {
           this.cargarColaRevision();
           this.cargarObservacionesActivas();
       }, this.estado.configuracionVista.intervaloRefresh);
   }

   /**
    * ⏸️ Pausar actualización automática
    */
   pausarActualizacionAutomatica() {
       Object.values(this.intervalos).forEach(intervalo => {
           if (intervalo) clearInterval(intervalo);
       });
   }

   /**
    * ▶️ Reanudar actualización automática
    */
   reanudarActualizacionAutomatica() {
       if (this.estado.configuracionVista.autoRefresh) {
           this.iniciarActualizacionAutomatica();
       }
   }

   /**
    * 🔄 Toggle actualización automática
    */
   toggleActualizacionAutomatica() {
       if (this.estado.configuracionVista.autoRefresh) {
           this.iniciarActualizacionAutomatica();
       } else {
           this.pausarActualizacionAutomatica();
       }
   }

   // =====================================
   // MÉTODOS DE ACCIÓN
   // =====================================

   /**
    * 👁️ Revisar documento específico
    */
   async revisarDocumento(documentoId) {
       try {
           window.location.href = `/paginas/verificador/revisar.html?documento=${documentoId}`;
       } catch (error) {
           console.error('Error navegando a revisar documento:', error);
           Utilidades.mostrarNotificacion('Error al abrir el documento', 'error');
       }
   }

   /**
    * 📋 Ver cola completa de revisión
    */
   verColaCompleta() {
       window.location.href = '/paginas/verificador/cola-revision.html';
   }

   /**
    * 📊 Generar reporte de verificación
    */
   async generarReporte() {
       try {
           const modal = this.sistemaModales.mostrarModal({
               titulo: 'Generar Reporte de Verificación',
               contenido: `
                   <form id="form-generar-reporte">
                       <div class="mb-3">
                           <label class="form-label">Período del Reporte</label>
                           <select class="form-select" name="periodo" required>
                               <option value="semana_actual">Esta Semana</option>
                               <option value="mes_actual">Este Mes</option>
                               <option value="personalizado">Período Personalizado</option>
                           </select>
                       </div>
                       <div id="fechas-personalizadas" class="mb-3" style="display: none;">
                           <div class="row">
                               <div class="col-md-6">
                                   <label class="form-label">Fecha Inicio</label>
                                   <input type="date" class="form-control" name="fecha_inicio">
                               </div>
                               <div class="col-md-6">
                                   <label class="form-label">Fecha Fin</label>
                                   <input type="date" class="form-control" name="fecha_fin">
                               </div>
                           </div>
                       </div>
                       <div class="mb-3">
                           <label class="form-label">Formato</label>
                           <select class="form-select" name="formato" required>
                               <option value="pdf">PDF</option>
                               <option value="excel">Excel</option>
                           </select>
                       </div>
                   </form>
               `,
               botones: [
                   {
                       texto: 'Generar',
                       clase: 'btn-primary',
                       accion: () => this.procesarGeneracionReporte()
                   },
                   {
                       texto: 'Cancelar',
                       clase: 'btn-secondary',
                       accion: () => modal.cerrar()
                   }
               ]
           });

           // Manejar cambio de período
           modal.elemento.querySelector('select[name="periodo"]').addEventListener('change', (e) => {
               const fechasDiv = modal.elemento.querySelector('#fechas-personalizadas');
               fechasDiv.style.display = e.target.value === 'personalizado' ? 'block' : 'none';
           });

       } catch (error) {
           console.error('Error mostrando modal de reporte:', error);
           Utilidades.mostrarNotificacion('Error al abrir el formulario', 'error');
       }
   }

   /**
    * ⚙️ Configurar preferencias del verificador
    */
   async configurarPreferencias() {
       try {
           const modal = this.sistemaModales.mostrarModal({
               titulo: 'Configuración de Preferencias',
               contenido: `
                   <form id="form-configuracion">
                       <div class="mb-3">
                           <div class="form-check form-switch">
                               <input class="form-check-input" type="checkbox" id="auto-refresh" 
                                      ${this.estado.configuracionVista.autoRefresh ? 'checked' : ''}>
                               <label class="form-check-label" for="auto-refresh">
                                   Actualización Automática
                               </label>
                           </div>
                       </div>
                       <div class="mb-3">
                           <label class="form-label">Intervalo de Actualización</label>
                           <select class="form-select" name="intervalo">
                               <option value="15000" ${this.estado.configuracionVista.intervaloRefresh === 15000 ? 'selected' : ''}>15 segundos</option>
                               <option value="30000" ${this.estado.configuracionVista.intervaloRefresh === 30000 ? 'selected' : ''}>30 segundos</option>
                               <option value="60000" ${this.estado.configuracionVista.intervaloRefresh === 60000 ? 'selected' : ''}>1 minuto</option>
                           </select>
                       </div>
                       <div class="mb-3">
                           <label class="form-label">Vista de Lista</label>
                           <select class="form-select" name="vista">
                               <option value="compacta" ${this.estado.configuracionVista.vista === 'compacta' ? 'selected' : ''}>Compacta</option>
                               <option value="detallada" ${this.estado.configuracionVista.vista === 'detallada' ? 'selected' : ''}>Detallada</option>
                           </select>
                       </div>
                       <div class="mb-3">
                           <div class="form-check form-switch">
                               <input class="form-check-input" type="checkbox" id="mostrar-notificaciones" 
                                      ${this.estado.configuracionVista.mostrarNotificaciones ? 'checked' : ''}>
                               <label class="form-check-label" for="mostrar-notificaciones">
                                   Mostrar Notificaciones
                               </label>
                           </div>
                       </div>
                   </form>
               `,
               botones: [
                   {
                       texto: 'Guardar',
                       clase: 'btn-primary',
                       accion: () => this.guardarConfiguracion()
                   },
                   {
                       texto: 'Cancelar',
                       clase: 'btn-secondary',
                       accion: () => modal.cerrar()
                   }
               ]
           });

       } catch (error) {
           console.error('Error mostrando configuración:', error);
           Utilidades.mostrarNotificacion('Error al abrir configuración', 'error');
       }
   }

   // =====================================
   // MÉTODOS AUXILIARES
   // =====================================

   /**
    * ⏰ Calcular tiempo de espera
    */
   calcularTiempoEspera(fechaSubida) {
       return Utilidades.formatearFechaRelativa(fechaSubida);
   }

   /**
    * 🎨 Obtener color para prioridad
    */
   obtenerColorPrioridad(prioridad) {
       const colores = {
           'alta': 'danger',
           'media': 'warning',
           'baja': 'info'
       };
       return colores[prioridad] || 'secondary';
   }

   /**
    * 🔢 Obtener estadísticas por defecto
    */
   obtenerEstadisticasDefault() {
       return {
           documentos_pendientes: 0,
           documentos_aprobados: 0,
           documentos_rechazados: 0,
           tasa_eficiencia: 0,
           tiempo_promedio_revision: 0,
           cambio_semanal: 0
       };
   }

   /**
    * 💾 Cargar configuración del usuario
    */
   async cargarConfiguracionUsuario() {
       try {
           const config = localStorage.getItem('verificador_dashboard_config');
           return config ? JSON.parse(config) : {};
       } catch (error) {
           console.error('Error cargando configuración:', error);
           return {};
       }
   }

   /**
    * 💾 Guardar configuración del usuario
    */
   async guardarConfiguracionUsuario() {
       try {
           localStorage.setItem('verificador_dashboard_config', 
               JSON.stringify(this.estado.configuracionVista));
       } catch (error) {
           console.error('Error guardando configuración:', error);
       }
   }

   /**
    * 🎨 Aplicar configuración de vista
    */
   aplicarConfiguracionVista() {
       // Aplicar tema y otras configuraciones visuales
       document.body.classList.toggle('dashboard-compacto', 
           this.estado.configuracionVista.vista === 'compacta');
   }

   /**
    * 🔄 Actualizar todos los datos
    */
   async actualizarDatos() {
       Utilidades.mostrarNotificacion('Actualizando datos...', 'info');
       await this.cargarDatosIniciales();
       Utilidades.mostrarNotificacion('Datos actualizados', 'success');
   }

   /**
    * 🧹 Cleanup al destruir el dashboard
    */
   destruir() {
       this.pausarActualizacionAutomatica();
       
       // Remover event listeners
       document.removeEventListener('keydown', this.manejadorTeclado);
       document.removeEventListener('visibilitychange', this.manejadorVisibilidad);
   }
}

// =====================================
// INICIALIZACIÓN GLOBAL
// =====================================

// Variable global para acceso desde HTML
let tableroVerificador;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
   tableroVerificador = new TableroVerificador();
});

// Cleanup al salir de la página
window.addEventListener('beforeunload', () => {
   if (tableroVerificador) {
       tableroVerificador.destruir();
   }
});