/**
 * 📅 GESTIÓN DE CICLOS ACADÉMICOS - ADMINISTRADOR
 * Sistema Portafolio Docente UNSAAC
 * 
 * Gestión completa del ciclo de vida académico
 * Incluye creación, configuración, activación, cierre y archivado de ciclos
 */

class GestionCiclos {
   constructor() {
       this.servicioUsuarios = new ServicioUsuarios();
       this.validadorFormularios = new ValidadorFormularios();
       this.sistemaModales = new SistemaModales();
       
       // Estado del componente
       this.estado = {
           ciclos: [],
           cicloActual: null,
           cicloSeleccionado: null,
           configuracionSistema: {},
           estadisticas: {},
           filtros: {
               estado: '',
               anio: '',
               busqueda: ''
           }
       };
       
       // Referencias DOM
       this.elementos = {
           listaCiclos: null,
           formularioCiclo: null,
           panelConfiguracion: null,
           estadisticas: null
       };
       
       this.init();
   }

   /**
    * 🚀 Inicialización del componente
    */
   async init() {
       try {
           // Verificar permisos de administrador
           if (!SistemaAutenticacion.verificarPermiso('administrador')) {
               window.location.href = '/paginas/errores/403.html';
               return;
           }

           await this.inicializarInterfaz();
           await this.cargarDatosIniciales();
           this.configurarEventos();
           this.configurarValidaciones();
           
           Utilidades.mostrarNotificacion('Gestión de ciclos cargada', 'success');
       } catch (error) {
           console.error('Error inicializando gestión de ciclos:', error);
           Utilidades.mostrarNotificacion('Error cargando la gestión de ciclos', 'error');
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
       const container = document.querySelector('#ciclos-content');
       if (!container) return;

       container.innerHTML = `
           <div class="row g-4">
               <!-- Header con estadísticas -->
               <div class="col-12">
                   ${this.renderizarHeaderEstadisticas()}
               </div>
               
               <!-- Panel de filtros y acciones -->
               <div class="col-12">
                   ${this.renderizarPanelFiltros()}
               </div>
               
               <!-- Lista de ciclos -->
               <div class="col-lg-8">
                   <div class="card">
                       <div class="card-header d-flex justify-content-between align-items-center">
                           <h5 class="card-title mb-0">
                               <i class="fas fa-calendar-alt me-2"></i>Ciclos Académicos
                           </h5>
                           <button type="button" class="btn btn-primary" onclick="gestionCiclos.nuevoCiclo()">
                               <i class="fas fa-plus me-1"></i>Nuevo Ciclo
                           </button>
                       </div>
                       <div class="card-body p-0">
                           <div id="lista-ciclos">
                               ${this.renderizarCargando()}
                           </div>
                       </div>
                   </div>
               </div>
               
               <!-- Panel de configuración -->
               <div class="col-lg-4">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-cog me-2"></i>Configuración del Sistema
                           </h6>
                       </div>
                       <div class="card-body">
                           <div id="panel-configuracion">
                               ${this.renderizarPanelConfiguracion()}
                           </div>
                       </div>
                   </div>
                   
                   <!-- Acciones rápidas -->
                   <div class="card mt-3">
                       <div class="card-header">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-bolt me-2"></i>Acciones Rápidas
                           </h6>
                       </div>
                       <div class="card-body">
                           ${this.renderizarAccionesRapidas()}
                       </div>
                   </div>
                   
                   <!-- Información del ciclo seleccionado -->
                   <div class="card mt-3" id="info-ciclo-seleccionado" style="display: none;">
                       <div class="card-header">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-info-circle me-2"></i>Información del Ciclo
                           </h6>
                       </div>
                       <div class="card-body">
                           <div id="detalles-ciclo"></div>
                       </div>
                   </div>
               </div>
           </div>
           
           <!-- Modales -->
           ${this.renderizarModales()}
       `;
   }

   /**
    * 📊 Renderizar header con estadísticas
    */
   renderizarHeaderEstadisticas() {
       return `
           <div class="card bg-gradient-primary text-white">
               <div class="card-body">
                   <div class="row align-items-center">
                       <div class="col-md-8">
                           <h4 class="card-title mb-1">
                               <i class="fas fa-calendar-check me-2"></i>Gestión de Ciclos Académicos
                           </h4>
                           <p class="card-text mb-0 opacity-75">
                               Administrar el ciclo de vida completo de los períodos académicos
                           </p>
                       </div>
                       <div class="col-md-4">
                           <div class="row text-center">
                               <div class="col-4">
                                   <div class="stat-item">
                                       <h3 id="stat-total-ciclos" class="mb-0">0</h3>
                                       <small class="opacity-75">Total</small>
                                   </div>
                               </div>
                               <div class="col-4">
                                   <div class="stat-item">
                                       <h3 id="stat-ciclo-activo" class="mb-0">0</h3>
                                       <small class="opacity-75">Activo</small>
                                   </div>
                               </div>
                               <div class="col-4">
                                   <div class="stat-item">
                                       <h3 id="stat-ciclos-cerrados" class="mb-0">0</h3>
                                       <small class="opacity-75">Cerrados</small>
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
    * 🔍 Renderizar panel de filtros
    */
   renderizarPanelFiltros() {
       return `
           <div class="card">
               <div class="card-body">
                   <div class="row g-3 align-items-end">
                       <div class="col-md-4">
                           <label class="form-label">Buscar ciclo</label>
                           <div class="input-group">
                               <span class="input-group-text">
                                   <i class="fas fa-search"></i>
                               </span>
                               <input type="text" class="form-control" id="filtro-busqueda" 
                                      placeholder="Buscar por nombre...">
                           </div>
                       </div>
                       
                       <div class="col-md-3">
                           <label class="form-label">Estado</label>
                           <select class="form-select" id="filtro-estado">
                               <option value="">Todos los estados</option>
                               <option value="preparacion">Preparación</option>
                               <option value="activo">Activo</option>
                               <option value="cerrado">Cerrado</option>
                               <option value="archivado">Archivado</option>
                           </select>
                       </div>
                       
                       <div class="col-md-2">
                           <label class="form-label">Año</label>
                           <select class="form-select" id="filtro-anio">
                               <option value="">Todos</option>
                               <!-- Se llenarán dinámicamente -->
                           </select>
                       </div>
                       
                       <div class="col-md-3">
                           <div class="btn-group w-100">
                               <button type="button" class="btn btn-outline-primary" onclick="gestionCiclos.aplicarFiltros()">
                                   <i class="fas fa-filter me-1"></i>Filtrar
                               </button>
                               <button type="button" class="btn btn-outline-secondary" onclick="gestionCiclos.limpiarFiltros()">
                                   <i class="fas fa-times me-1"></i>Limpiar
                               </button>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 📋 Renderizar lista de ciclos
    */
   renderizarListaCiclos() {
       if (this.estado.ciclos.length === 0) {
           return this.renderizarVacio();
       }

       return `
           <div class="list-group list-group-flush">
               ${this.estado.ciclos.map(ciclo => this.renderizarItemCiclo(ciclo)).join('')}
           </div>
       `;
   }

   /**
    * 📋 Renderizar item individual de ciclo
    */
   renderizarItemCiclo(ciclo) {
       const estadoClass = this.obtenerClaseEstado(ciclo.estado);
       const estadoTexto = this.obtenerTextoEstado(ciclo.estado);
       const duracionDias = this.calcularDuracionCiclo(ciclo.fecha_inicio, ciclo.fecha_fin);
       const progreso = this.calcularProgresoCiclo(ciclo);
       
       return `
           <div class="list-group-item list-group-item-action ${ciclo.estado === 'activo' ? 'border-start border-success border-3' : ''}" 
                onclick="gestionCiclos.seleccionarCiclo('${ciclo.id}')">
               <div class="d-flex w-100 justify-content-between align-items-start">
                   <div class="flex-grow-1">
                       <div class="d-flex align-items-center mb-2">
                           <h5 class="mb-0 me-3">${ciclo.nombre}</h5>
                           <span class="badge bg-${estadoClass} me-2">${estadoTexto}</span>
                           ${ciclo.estado === 'activo' ? '<span class="badge bg-success">ACTUAL</span>' : ''}
                       </div>
                       
                       <p class="mb-2 text-muted">${ciclo.descripcion || 'Sin descripción'}</p>
                       
                       <div class="row text-muted small">
                           <div class="col-md-6">
                               <i class="fas fa-calendar-plus me-1"></i>
                               Inicio: ${Utilidades.formatearFecha(ciclo.fecha_inicio)}
                           </div>
                           <div class="col-md-6">
                               <i class="fas fa-calendar-minus me-1"></i>
                               Fin: ${Utilidades.formatearFecha(ciclo.fecha_fin)}
                           </div>
                       </div>
                       
                       <div class="row text-muted small mt-1">
                           <div class="col-md-6">
                               <i class="fas fa-clock me-1"></i>
                               Duración: ${duracionDias} días
                           </div>
                           <div class="col-md-6">
                               <i class="fas fa-user me-1"></i>
                               Creado por: ${ciclo.creado_por_nombre}
                           </div>
                       </div>
                       
                       <!-- Barra de progreso -->
                       ${ciclo.estado === 'activo' ? `
                           <div class="mt-2">
                               <div class="d-flex justify-content-between align-items-center mb-1">
                                   <small class="text-muted">Progreso del ciclo</small>
                                   <small class="text-muted">${Math.round(progreso)}%</small>
                               </div>
                               <div class="progress" style="height: 4px;">
                                   <div class="progress-bar bg-success" role="progressbar" style="width: ${progreso}%"></div>
                               </div>
                           </div>
                       ` : ''}
                   </div>
                   
                   <div class="text-end ms-3">
                       <div class="btn-group-vertical btn-group-sm">
                           ${this.renderizarBotonesCiclo(ciclo)}
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 🔘 Renderizar botones específicos por ciclo
    */
   renderizarBotonesCiclo(ciclo) {
       let botones = '';
       
       switch (ciclo.estado) {
           case 'preparacion':
               botones = `
                   <button type="button" class="btn btn-outline-primary btn-sm" 
                           onclick="event.stopPropagation(); gestionCiclos.editarCiclo('${ciclo.id}')" 
                           title="Editar">
                       <i class="fas fa-edit"></i>
                   </button>
                   <button type="button" class="btn btn-outline-success btn-sm" 
                           onclick="event.stopPropagation(); gestionCiclos.activarCiclo('${ciclo.id}')" 
                           title="Activar">
                       <i class="fas fa-play"></i>
                   </button>
                   <button type="button" class="btn btn-outline-danger btn-sm" 
                           onclick="event.stopPropagation(); gestionCiclos.eliminarCiclo('${ciclo.id}')" 
                           title="Eliminar">
                       <i class="fas fa-trash"></i>
                   </button>
               `;
               break;
               
           case 'activo':
               botones = `
                   <button type="button" class="btn btn-outline-info btn-sm" 
                           onclick="event.stopPropagation(); gestionCiclos.configurarCiclo('${ciclo.id}')" 
                           title="Configurar">
                       <i class="fas fa-cog"></i>
                   </button>
                   <button type="button" class="btn btn-outline-warning btn-sm" 
                           onclick="event.stopPropagation(); gestionCiclos.cerrarCiclo('${ciclo.id}')" 
                           title="Cerrar">
                       <i class="fas fa-stop"></i>
                   </button>
                   <button type="button" class="btn btn-outline-secondary btn-sm" 
                           onclick="event.stopPropagation(); gestionCiclos.generarReporte('${ciclo.id}')" 
                           title="Reporte">
                       <i class="fas fa-chart-bar"></i>
                   </button>
               `;
               break;
               
           case 'cerrado':
               botones = `
                   <button type="button" class="btn btn-outline-info btn-sm" 
                           onclick="event.stopPropagation(); gestionCiclos.verResumen('${ciclo.id}')" 
                           title="Ver resumen">
                       <i class="fas fa-eye"></i>
                   </button>
                   <button type="button" class="btn btn-outline-secondary btn-sm" 
                           onclick="event.stopPropagation(); gestionCiclos.archivarCiclo('${ciclo.id}')" 
                           title="Archivar">
                       <i class="fas fa-archive"></i>
                   </button>
                   <button type="button" class="btn btn-outline-primary btn-sm" 
                           onclick="event.stopPropagation(); gestionCiclos.exportarDatos('${ciclo.id}')" 
                           title="Exportar">
                       <i class="fas fa-download"></i>
                   </button>
               `;
               break;
               
           case 'archivado':
               botones = `
                   <button type="button" class="btn btn-outline-info btn-sm" 
                           onclick="event.stopPropagation(); gestionCiclos.verResumen('${ciclo.id}')" 
                           title="Ver resumen">
                       <i class="fas fa-eye"></i>
                   </button>
                   <button type="button" class="btn btn-outline-secondary btn-sm" 
                           onclick="event.stopPropagation(); gestionCiclos.restaurarCiclo('${ciclo.id}')" 
                           title="Restaurar">
                       <i class="fas fa-undo"></i>
                   </button>
               `;
               break;
       }
       
       return botones;
   }

   /**
    * ⚙️ Renderizar panel de configuración
    */
   renderizarPanelConfiguracion() {
       return `
           <div class="mb-3">
               <h6 class="mb-2">
                   <i class="fas fa-calendar-check me-1"></i>Ciclo Actual
               </h6>
               <div id="ciclo-actual-info">
                   <div class="text-center py-3">
                       <i class="fas fa-calendar-times fa-2x text-muted mb-2"></i>
                       <p class="text-muted mb-0">No hay ciclo activo</p>
                   </div>
               </div>
           </div>
           
           <hr>
           
           <div class="mb-3">
               <h6 class="mb-2">
                   <i class="fas fa-cog me-1"></i>Configuración Global
               </h6>
               <div class="form-check form-switch mb-2">
                   <input class="form-check-input" type="checkbox" id="permitir-multiples-activos">
                   <label class="form-check-label" for="permitir-multiples-activos">
                       Permitir múltiples ciclos activos
                   </label>
               </div>
               <div class="form-check form-switch mb-2">
                   <input class="form-check-input" type="checkbox" id="auto-cierre-ciclos">
                   <label class="form-check-label" for="auto-cierre-ciclos">
                       Auto-cierre de ciclos vencidos
                   </label>
               </div>
               <div class="form-check form-switch mb-2">
                   <input class="form-check-input" type="checkbox" id="notificaciones-ciclo">
                   <label class="form-check-label" for="notificaciones-ciclo">
                       Notificaciones de ciclo
                   </label>
               </div>
           </div>
           
           <hr>
           
           <div class="mb-3">
               <h6 class="mb-2">
                   <i class="fas fa-clock me-1"></i>Configuración de Tiempo
               </h6>
               <div class="mb-2">
                   <label class="form-label small">Días de aviso antes del cierre</label>
                   <input type="number" class="form-control form-control-sm" 
                          id="dias-aviso-cierre" value="7" min="1" max="30">
               </div>
               <div class="mb-2">
                   <label class="form-label small">Duración mínima del ciclo (días)</label>
                   <input type="number" class="form-control form-control-sm" 
                          id="duracion-minima" value="90" min="30" max="365">
               </div>
           </div>
           
           <div class="d-grid">
               <button type="button" class="btn btn-outline-primary btn-sm" 
                       onclick="gestionCiclos.guardarConfiguracion()">
                   <i class="fas fa-save me-1"></i>Guardar Configuración
               </button>
           </div>
       `;
   }

   /**
    * ⚡ Renderizar acciones rápidas
    */
   renderizarAccionesRapidas() {
       return `
           <div class="d-grid gap-2">
               <button type="button" class="btn btn-primary btn-sm" onclick="gestionCiclos.nuevoCiclo()">
                   <i class="fas fa-plus me-1"></i>Crear Nuevo Ciclo
               </button>
               
               <button type="button" class="btn btn-success btn-sm" onclick="gestionCiclos.duplicarUltimoCiclo()">
                   <i class="fas fa-copy me-1"></i>Duplicar Último Ciclo
               </button>
               
               <button type="button" class="btn btn-info btn-sm" onclick="gestionCiclos.plantillasCiclo()">
                   <i class="fas fa-file-alt me-1"></i>Usar Plantilla
               </button>
               
               <hr>
               
               <button type="button" class="btn btn-warning btn-sm" onclick="gestionCiclos.migrarDatos()">
                   <i class="fas fa-exchange-alt me-1"></i>Migrar Datos
               </button>
               
               <button type="button" class="btn btn-secondary btn-sm" onclick="gestionCiclos.exportarTodos()">
                   <i class="fas fa-download me-1"></i>Exportar Todos
               </button>
               
               <button type="button" class="btn btn-outline-danger btn-sm" onclick="gestionCiclos.limpiezaAutomatica()">
                   <i class="fas fa-broom me-1"></i>Limpieza Automática
               </button>
           </div>
       `;
   }

   /**
    * 🎭 Renderizar modales del sistema
    */
   renderizarModales() {
       return `
           <!-- Modal Ciclo -->
           <div class="modal fade" id="modal-ciclo" tabindex="-1">
               <div class="modal-dialog modal-lg">
                   <div class="modal-content">
                       <div class="modal-header">
                           <h5 class="modal-title">
                               <i class="fas fa-calendar-alt me-2"></i>
                               <span id="modal-ciclo-titulo">Ciclo Académico</span>
                           </h5>
                           <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                       </div>
                       <div class="modal-body">
                           ${this.renderizarFormularioCiclo()}
                       </div>
                       <div class="modal-footer">
                           <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                           <button type="button" class="btn btn-primary" onclick="gestionCiclos.guardarCiclo()">
                               <i class="fas fa-save me-1"></i>Guardar
                           </button>
                       </div>
                   </div>
               </div>
           </div>
           
           <!-- Modal Configuración Ciclo -->
           <div class="modal fade" id="modal-configuracion-ciclo" tabindex="-1">
               <div class="modal-dialog modal-xl">
                   <div class="modal-content">
                       <div class="modal-header">
                           <h5 class="modal-title">
                               <i class="fas fa-cogs me-2"></i>Configuración del Ciclo
                           </h5>
                           <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                       </div>
                       <div class="modal-body">
                           <div id="contenido-configuracion-ciclo">
                               <!-- Se llenará dinámicamente -->
                           </div>
                       </div>
                       <div class="modal-footer">
                           <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                           <button type="button" class="btn btn-primary" onclick="gestionCiclos.guardarConfiguracionCiclo()">
                               <i class="fas fa-save me-1"></i>Guardar Configuración
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 📝 Renderizar formulario de ciclo
    */
   renderizarFormularioCiclo() {
       return `
           <form id="form-ciclo" novalidate>
               <input type="hidden" id="ciclo-id" name="id">
               
               <div class="row g-3">
                   <div class="col-12">
                       <label class="form-label">Nombre del Ciclo *</label>
                       <input type="text" class="form-control" id="ciclo-nombre" name="nombre" required
                              placeholder="Ej: Semestre 2025-I">
                       <div class="invalid-feedback"></div>
                   </div>
                   
                   <div class="col-12">
                       <label class="form-label">Descripción</label>
                       <textarea class="form-control" id="ciclo-descripcion" name="descripcion" rows="3"
                                 placeholder="Descripción opcional del ciclo académico..."></textarea>
                   </div>
                   
                   <div class="col-md-6">
                       <label class="form-label">Fecha de Inicio *</label>
                       <input type="date" class="form-control" id="ciclo-fecha-inicio" name="fecha_inicio" required>
                       <div class="invalid-feedback"></div>
                   </div>
                   
                   <div class="col-md-6">
                       <label class="form-label">Fecha de Fin *</label>
                       <input type="date" class="form-control" id="ciclo-fecha-fin" name="fecha_fin" required>
                       <div class="invalid-feedback"></div>
                   </div>
                   
                   <div class="col-md-6">
                       <label class="form-label">Semestre *</label>
                       <select class="form-select" id="ciclo-semestre" name="semestre_actual" required>
                           <option value="">Seleccionar semestre...</option>
                           <option value="I">Primer Semestre (I)</option>
                           <option value="II">Segundo Semestre (II)</option>
                           <option value="VERANO">Semestre de Verano</option>
                           <option value="INTERSEMESTRAL">Intersemestral</option>
                       </select>
                       <div class="invalid-feedback"></div>
                   </div>
                   
                   <div class="col-md-6">
                       <label class="form-label">Año Académico *</label>
                       <input type="number" class="form-control" id="ciclo-anio" name="anio_actual" required
                              min="2020" max="2030" value="${new Date().getFullYear()}">
                       <div class="invalid-feedback"></div>
                   </div>
                   
                   <div class="col-12">
                       <label class="form-label">Estado Inicial</label>
                       <select class="form-select" id="ciclo-estado" name="estado">
                           <option value="preparacion">Preparación</option>
                           <option value="activo">Activo</option>
                       </select>
                       <div class="form-text">
                           Un ciclo en "Preparación" permite configuración antes de activarlo
                       </div>
                   </div>
                   
                   <div class="col-12">
                       <div class="card">
                           <div class="card-header">
                               <h6 class="card-title mb-0">
                                   <i class="fas fa-cog me-1"></i>Configuración Inicial
                               </h6>
                           </div>
                           <div class="card-body">
                               <div class="row g-3">
                                   <div class="col-md-6">
                                       <div class="form-check form-switch">
                                           <input class="form-check-input" type="checkbox" id="auto-generar-estructura">
                                           <label class="form-check-label" for="auto-generar-estructura">
                                               Auto-generar estructura de portafolios
                                           </label>
                                       </div>
                                   </div>
                                   
                                   <div class="col-md-6">
                                       <div class="form-check form-switch">
                                           <input class="form-check-input" type="checkbox" id="copiar-configuracion">
                                           <label class="form-check-label" for="copiar-configuracion">
                                               Copiar configuración del ciclo anterior
                                           </label>
                                       </div>
                                   </div>
                                   
                                   <div class="col-md-6">
                                       <div class="form-check form-switch">
                                           <input class="form-check-input" type="checkbox" id="notificar-docentes">
                                           <label class="form-check-label" for="notificar-docentes">
                                               Notificar a docentes al crear
                                           </label>
                                       </div>
                                   </div>
                                   
                                   <div class="col-md-6">
                                       <div class="form-check form-switch">
                                           <input class="form-check-input" type="checkbox" id="activar-inmediatamente">
                                           <label class="form-check-label" for="activar-inmediatamente">
                                               Activar inmediatamente
                                           </label>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           </form>
       `;
   }

   // =====================================
   // MÉTODOS DE CARGA DE DATOS
   // =====================================

   /**
    * 📊 Cargar datos iniciales
    */
   async cargarDatosIniciales() {
       await Promise.all([
           this.cargarCiclos(),
           this.cargarConfiguracionSistema(),
           this.cargarEstadisticas(),
           this.llenarFiltroAnios()
       ]);
   }

   /**
    * 📅 Cargar lista de ciclos
    */
   async cargarCiclos() {
       try {
           const parametros = {
               ...this.estado.filtros,
               incluir_estadisticas: true
           };

           const response = await ClienteAPI.get('/ciclos-academicos', { params: parametros });
           
           this.estado.ciclos = response.data.ciclos || [];
           this.estado.cicloActual = response.data.ciclo_actual || null;
           
           this.renderizarCiclosEnLista();
           this.actualizarInfoCicloActual();
           
       } catch (error) {
           console.error('Error cargando ciclos:', error);
           this.mostrarErrorCarga();
       }
   }

   /**
    * ⚙️ Cargar configuración del sistema
    */
   async cargarConfiguracionSistema() {
       try {
           const response = await ClienteAPI.get('/configuracion/ciclos');
           this.estado.configuracionSistema = response.data;
           this.aplicarConfiguracionEnInterfaz();
       } catch (error) {
           console.warn('Error cargando configuración:', error);
       }
   }

   /**
    * 📈 Cargar estadísticas
    */
   async cargarEstadisticas() {
       try {
           const response = await ClienteAPI.get('/ciclos-academicos/estadisticas');
           this.estado.estadisticas = response.data;
           this.actualizarEstadisticasEnHeader();
       } catch (error) {
           console.warn('Error cargando estadísticas:', error);
       }
   }

   /**
    * 📅 Llenar filtro de años
    */
   async llenarFiltroAnios() {
       const select = document.getElementById('filtro-anio');
       if (!select) return;
       
       const anioActual = new Date().getFullYear();
       for (let anio = anioActual + 1; anio >= anioActual - 5; anio--) {
           const option = document.createElement('option');
           option.value = anio;
           option.textContent = anio;
           select.appendChild(option);
       }
   }

   /**
    * 🎨 Renderizar ciclos en la lista
    */
   renderizarCiclosEnLista() {
       const contenedor = document.getElementById('lista-ciclos');
       if (!contenedor) return;
       
       if (this.estado.ciclos.length === 0) {
           contenedor.innerHTML = this.renderizarVacio();
           return;
       }
       
       contenedor.innerHTML = this.renderizarListaCiclos();
   }

   /**
    * 📭 Renderizar vista vacía
    */
   renderizarVacio() {
       return `
           <div class="text-center py-5">
               <i class="fas fa-calendar-times fa-4x text-muted mb-3"></i>
               <h4 class="text-muted">No hay ciclos académicos</h4>
               <p class="text-muted">Crea tu primer ciclo académico para comenzar</p>
               <button type="button" class="btn btn-primary" onclick="gestionCiclos.nuevoCiclo()">
                   <i class="fas fa-plus me-1"></i>Crear Primer Ciclo
               </button>
           </div>
       `;
   }

   /**
    * ⏳ Renderizar indicador de carga
    */
   renderizarCargando() {
       return `
           <div class="text-center py-4">
               <div class="spinner-border text-primary mb-3" role="status">
                   <span class="visually-hidden">Cargando...</span>
               </div>
               <p class="text-muted">Cargando ciclos académicos...</p>
           </div>
       `;
   }

   // =====================================
   // MÉTODOS DE ACCIONES CRUD
   // =====================================

   /**
    * ➕ Crear nuevo ciclo
    */
   nuevoCiclo() {
       this.estado.cicloSeleccionado = null;
       
       // Limpiar formulario
       const form = document.getElementById('form-ciclo');
       if (form) {
           form.reset();
           this.limpiarValidacionFormulario();
       }
       
       // Configurar modal para creación
       const titulo = document.getElementById('modal-ciclo-titulo');
       if (titulo) {
           titulo.textContent = 'Nuevo Ciclo Académico';
       }
       
       // Establecer fechas por defecto
       this.establecerFechasPorDefecto();
       
       // Mostrar modal
       const modal = new bootstrap.Modal(document.getElementById('modal-ciclo'));
       modal.show();
   }

   /**
    * ✏️ Editar ciclo existente
    */
   async editarCiclo(cicloId) {
       try {
           const response = await ClienteAPI.get(`/ciclos-academicos/${cicloId}`);
           this.estado.cicloSeleccionado = response.data;
           
           // Llenar formulario
           this.llenarFormularioCiclo(this.estado.cicloSeleccionado);
           
           // Configurar modal para edición
           const titulo = document.getElementById('modal-ciclo-titulo');
           if (titulo) {
               titulo.textContent = 'Editar Ciclo Académico';
           }
           
           // Mostrar modal
           const modal = new bootstrap.Modal(document.getElementById('modal-ciclo'));
           modal.show();
           
       } catch (error) {
           console.error('Error cargando ciclo:', error);
           Utilidades.mostrarNotificacion('Error cargando los datos del ciclo', 'error');
       }
   }

   /**
    * 💾 Guardar ciclo (crear o actualizar)
    */
   async guardarCiclo() {
       try {
           const form = document.getElementById('form-ciclo');
           if (!form || !this.validarFormulario(form)) {
               return;
           }
           
           const formData = new FormData(form);
           const datosCiclo = Object.fromEntries(formData.entries());
           
           // Agregar configuraciones especiales
           datosCiclo.configuracion = {
               auto_generar_estructura: document.getElementById('auto-generar-estructura').checked,
               copiar_configuracion: document.getElementById('copiar-configuracion').checked,
               notificar_docentes: document.getElementById('notificar-docentes').checked,
               activar_inmediatamente: document.getElementById('activar-inmediatamente').checked
           };
           
           let response;
           if (this.estado.cicloSeleccionado) {
               response = await ClienteAPI.put(`/ciclos-academicos/${this.estado.cicloSeleccionado.id}`, datosCiclo);
               Utilidades.mostrarNotificacion('Ciclo actualizado correctamente', 'success');
           } else {
               response = await ClienteAPI.post('/ciclos-academicos', datosCiclo);
               Utilidades.mostrarNotificacion('Ciclo creado correctamente', 'success');
           }
           
           // Cerrar modal y recargar datos
           const modal = bootstrap.Modal.getInstance(document.getElementById('modal-ciclo'));
           modal.hide();
           
           await this.cargarCiclos();
           
       } catch (error) {
           console.error('Error guardando ciclo:', error);
           this.manejarErrorGuardado(error);
       }
   }

   /**
    * ▶️ Activar ciclo
    */
   async activarCiclo(cicloId) {
       try {
           const confirmar = await Utilidades.confirmar(
               'Activar Ciclo',
               '¿Estás seguro de que deseas activar este ciclo académico? Esta acción desactivará cualquier otro ciclo activo.',
               'warning'
           );
           
           if (!confirmar) return;
           
           await ClienteAPI.post(`/ciclos-academicos/${cicloId}/activar`);
           Utilidades.mostrarNotificacion('Ciclo activado correctamente', 'success');
           
           await this.cargarCiclos();
           
       } catch (error) {
           console.error('Error activando ciclo:', error);
           Utilidades.mostrarNotificacion('Error al activar el ciclo', 'error');
       }
   }

   /**
    * ⏹️ Cerrar ciclo
    */
   async cerrarCiclo(cicloId) {
       try {
           const ciclo = this.estado.ciclos.find(c => c.id === cicloId);
           if (!ciclo) return;
           
           const confirmar = await Utilidades.confirmar(
               'Cerrar Ciclo',
               `¿Estás seguro de que deseas cerrar el ciclo "${ciclo.nombre}"? Esta acción no se puede deshacer y bloquea todas las modificaciones.`,
               'warning'
           );
           
           if (!confirmar) return;
           
           // Mostrar opciones adicionales para el cierre
           const opciones = await this.mostrarOpcionesCierre();
           if (!opciones) return;
           
           await ClienteAPI.post(`/ciclos-academicos/${cicloId}/cerrar`, opciones);
           Utilidades.mostrarNotificacion('Ciclo cerrado correctamente', 'success');
           
           await this.cargarCiclos();
           
       } catch (error) {
           console.error('Error cerrando ciclo:', error);
           Utilidades.mostrarNotificacion('Error al cerrar el ciclo', 'error');
       }
   }

   /**
    * 🗑️ Eliminar ciclo
    */
   async eliminarCiclo(cicloId) {
       try {
           const ciclo = this.estado.ciclos.find(c => c.id === cicloId);
           if (!ciclo) return;
           
           const confirmar = await Utilidades.confirmar(
               'Eliminar Ciclo',
               `¿Estás seguro de que deseas eliminar el ciclo "${ciclo.nombre}"? Esta acción eliminará todos los datos asociados y no se puede deshacer.`,
               'danger'
           );
           
           if (!confirmar) return;
           
           await ClienteAPI.delete(`/ciclos-academicos/${cicloId}`);
           Utilidades.mostrarNotificacion('Ciclo eliminado correctamente', 'success');
           
           await this.cargarCiclos();
           
       } catch (error) {
           console.error('Error eliminando ciclo:', error);
           Utilidades.mostrarNotificacion('Error al eliminar el ciclo', 'error');
       }
   }

   /**
    * 📦 Archivar ciclo
    */
   async archivarCiclo(cicloId) {
       try {
           const confirmar = await Utilidades.confirmar(
               'Archivar Ciclo',
               '¿Deseas archivar este ciclo? Los datos se mantendrán pero el ciclo ya no aparecerá en las listas principales.',
               'info'
           );
           
           if (!confirmar) return;
           
           await ClienteAPI.post(`/ciclos-academicos/${cicloId}/archivar`);
           Utilidades.mostrarNotificacion('Ciclo archivado correctamente', 'success');
           
           await this.cargarCiclos();
           
       } catch (error) {
           console.error('Error archivando ciclo:', error);
           Utilidades.mostrarNotificacion('Error al archivar el ciclo', 'error');
       }
   }

   // =====================================
   // MÉTODOS AUXILIARES
   // =====================================

   /**
    * 🎨 Obtener clase CSS para estado
    */
   obtenerClaseEstado(estado) {
       const clases = {
           'preparacion': 'warning',
           'activo': 'success',
           'cerrado': 'secondary',
           'archivado': 'dark'
       };
       return clases[estado] || 'secondary';
   }

   /**
    * 📝 Obtener texto display del estado
    */
   obtenerTextoEstado(estado) {
       const textos = {
           'preparacion': 'Preparación',
           'activo': 'Activo',
           'cerrado': 'Cerrado',
           'archivado': 'Archivado'
       };
       return textos[estado] || estado;
   }

   /**
    * 📊 Calcular duración del ciclo
    */
   calcularDuracionCiclo(fechaInicio, fechaFin) {
       const inicio = new Date(fechaInicio);
       const fin = new Date(fechaFin);
       const diferencia = fin - inicio;
       return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
   }

   /**
    * 📈 Calcular progreso del ciclo
    */
   calcularProgresoCiclo(ciclo) {
       if (ciclo.estado !== 'activo') return 0;
       
       const ahora = new Date();
       const inicio = new Date(ciclo.fecha_inicio);
       const fin = new Date(ciclo.fecha_fin);
       
       if (ahora < inicio) return 0;
       if (ahora > fin) return 100;
       
       const tiempoTotal = fin - inicio;
       const tiempoTranscurrido = ahora - inicio;
       
       return Math.min(100, Math.max(0, (tiempoTranscurrido / tiempoTotal) * 100));
   }

   /**
    * 📅 Establecer fechas por defecto
    */
   establecerFechasPorDefecto() {
       const hoy = new Date();
       const inicioSemestre = new Date(hoy.getFullYear(), 2, 1); // 1 de marzo
       const finSemestre = new Date(hoy.getFullYear(), 6, 31); // 31 de julio
       
       document.getElementById('ciclo-fecha-inicio').value = inicioSemestre.toISOString().split('T')[0];
       document.getElementById('ciclo-fecha-fin').value = finSemestre.toISOString().split('T')[0];
   }

   /**
    * 📝 Llenar formulario con datos del ciclo
    */
   llenarFormularioCiclo(ciclo) {
       document.getElementById('ciclo-id').value = ciclo.id;
       document.getElementById('ciclo-nombre').value = ciclo.nombre;
       document.getElementById('ciclo-descripcion').value = ciclo.descripcion || '';
       document.getElementById('ciclo-fecha-inicio').value = ciclo.fecha_inicio.split('T')[0];
       document.getElementById('ciclo-fecha-fin').value = ciclo.fecha_fin.split('T')[0];
       document.getElementById('ciclo-semestre').value = ciclo.semestre_actual;
       document.getElementById('ciclo-anio').value = ciclo.anio_actual;
       document.getElementById('ciclo-estado').value = ciclo.estado;
       
       // Configuraciones especiales
       const config = ciclo.configuracion || {};
       document.getElementById('auto-generar-estructura').checked = config.auto_generar_estructura || false;
       document.getElementById('copiar-configuracion').checked = config.copiar_configuracion || false;
       document.getElementById('notificar-docentes').checked = config.notificar_docentes || false;
       document.getElementById('activar-inmediatamente').checked = config.activar_inmediatamente || false;
   }

   /**
    * 📊 Actualizar estadísticas en header
    */
   actualizarEstadisticasEnHeader() {
       const elementos = {
           'stat-total-ciclos': this.estado.estadisticas.total || 0,
           'stat-ciclo-activo': this.estado.estadisticas.activos || 0,
           'stat-ciclos-cerrados': this.estado.estadisticas.cerrados || 0
       };

       Object.entries(elementos).forEach(([id, valor]) => {
           const elemento = document.getElementById(id);
           if (elemento) {
               elemento.textContent = valor;
           }
       });
   }

   /**
    * ℹ️ Actualizar información del ciclo actual
    */
   actualizarInfoCicloActual() {
       const contenedor = document.getElementById('ciclo-actual-info');
       if (!contenedor) return;
       
       if (!this.estado.cicloActual) {
           contenedor.innerHTML = `
               <div class="text-center py-3">
                   <i class="fas fa-calendar-times fa-2x text-muted mb-2"></i>
                   <p class="text-muted mb-0">No hay ciclo activo</p>
               </div>
           `;
           return;
       }
       
       const ciclo = this.estado.cicloActual;
       const progreso = this.calcularProgresoCiclo(ciclo);
       
       contenedor.innerHTML = `
           <div class="card border-success">
               <div class="card-body p-3">
                   <h6 class="card-title text-success mb-2">${ciclo.nombre}</h6>
                   <p class="card-text small text-muted mb-2">${ciclo.descripcion || 'Sin descripción'}</p>
                   
                   <div class="small text-muted mb-2">
                       <i class="fas fa-calendar me-1"></i>
                       ${Utilidades.formatearFecha(ciclo.fecha_inicio)} - ${Utilidades.formatearFecha(ciclo.fecha_fin)}
                   </div>
                   
                   <div class="progress mb-2" style="height: 6px;">
                       <div class="progress-bar bg-success" role="progressbar" style="width: ${progreso}%"></div>
                   </div>
                   
                   <div class="d-flex justify-content-between align-items-center">
                       <small class="text-muted">${Math.round(progreso)}% completado</small>
                       <button type="button" class="btn btn-outline-success btn-sm" 
                               onclick="gestionCiclos.configurarCiclo('${ciclo.id}')">
                           <i class="fas fa-cog"></i>
                       </button>
                   </div>
               </div>
           </div>
       `;
   }

   // =====================================
   // MÉTODOS PÚBLICOS PARA INTERFAZ
   // =====================================

   /**
    * 📋 Seleccionar ciclo para ver detalles
    */
   async seleccionarCiclo(cicloId) {
       try {
           const response = await ClienteAPI.get(`/ciclos-academicos/${cicloId}/detalles`);
           const ciclo = response.data;
           
           // Mostrar panel de información
           const panel = document.getElementById('info-ciclo-seleccionado');
           const contenido = document.getElementById('detalles-ciclo');
           
           if (panel && contenido) {
               contenido.innerHTML = this.renderizarDetallesCiclo(ciclo);
               panel.style.display = 'block';
           }
           
       } catch (error) {
           console.error('Error cargando detalles del ciclo:', error);
           Utilidades.mostrarNotificacion('Error cargando los detalles', 'error');
       }
   }

   /**
    * 🔍 Aplicar filtros
    */
   async aplicarFiltros() {
       this.estado.filtros = {
           estado: document.getElementById('filtro-estado')?.value || '',
           anio: document.getElementById('filtro-anio')?.value || '',
           busqueda: document.getElementById('filtro-busqueda')?.value || ''
       };
       
       await this.cargarCiclos();
   }

   /**
    * 🧹 Limpiar filtros
    */
   async limpiarFiltros() {
       document.querySelectorAll('#filtro-estado, #filtro-anio, #filtro-busqueda').forEach(campo => {
           campo.value = '';
       });
       
       this.estado.filtros = { estado: '', anio: '', busqueda: '' };
       await this.cargarCiclos();
   }

   /**
    * 🔧 Configurar elementos DOM
    */
   configurarElementosDOM() {
       this.elementos = {
           listaCiclos: document.getElementById('lista-ciclos'),
           formularioCiclo: document.getElementById('form-ciclo'),
           panelConfiguracion: document.getElementById('panel-configuracion'),
           estadisticas: document.querySelector('.row.g-3')
       };
   }

   /**
    * ⚙️ Configurar eventos
    */
   configurarEventos() {
       // Búsqueda en tiempo real
       const buscador = document.getElementById('filtro-busqueda');
       if (buscador) {
           buscador.addEventListener('input', Utilidades.debounce(() => {
               this.aplicarFiltros();
           }, 500));
       }
       
       // Filtros automáticos
       ['filtro-estado', 'filtro-anio'].forEach(id => {
           const elemento = document.getElementById(id);
           if (elemento) {
               elemento.addEventListener('change', () => this.aplicarFiltros());
           }
       });
   }

   /**
    * ✅ Configurar validaciones
    */
   configurarValidaciones() {
       this.validadorFormularios.configurarFormulario('form-ciclo', {
           nombre: { required: true, minLength: 3 },
           fecha_inicio: { required: true },
           fecha_fin: { required: true },
           semestre_actual: { required: true },
           anio_actual: { required: true, min: 2020, max: 2030 }
       });
       
       // Validación personalizada: fecha fin debe ser posterior a fecha inicio
       document.getElementById('ciclo-fecha-fin')?.addEventListener('change', (e) => {
           const fechaInicio = document.getElementById('ciclo-fecha-inicio').value;
           const fechaFin = e.target.value;
           
           if (fechaInicio && fechaFin && new Date(fechaFin) <= new Date(fechaInicio)) {
               e.target.setCustomValidity('La fecha de fin debe ser posterior a la fecha de inicio');
           } else {
               e.target.setCustomValidity('');
           }
       });
   }

   /**
    * 🔄 Actualizar breadcrumb
    */
   actualizarBreadcrumb() {
       const breadcrumb = document.querySelector('#breadcrumb');
       if (breadcrumb) {
           breadcrumb.innerHTML = `
               <li class="breadcrumb-item">
                   <i class="fas fa-crown me-1"></i>Administrador
               </li>
               <li class="breadcrumb-item active">Gestión de Ciclos</li>
           `;
       }
   }
}

// =====================================
// INICIALIZACIÓN GLOBAL
// =====================================

// Variable global para acceso desde HTML
let gestionCiclos;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
   gestionCiclos = new GestionCiclos();
});

// Cleanup al salir de la página
window.addEventListener('beforeunload', () => {
   if (gestionCiclos) {
       gestionCiclos = null;
   }
});