/**
 * 📈 CALCULADOR DE PROGRESO
 * Sistema Portafolio Docente UNSAAC
 * 
 * Página para visualizar y calcular el progreso detallado de portafolios
 * Incluye métricas, tendencias, comparativas y proyecciones
 */

class CalculadorProgreso {
   constructor() {
       this.servicioPortafolios = new ServicioPortafolios();
       this.servicioDocumentos = new ServicioDocumentos();
       this.servicioCiclos = new ServicioCiclos();
       this.servicioReportes = new ServicioReportes();
       
       this.usuario = SistemaAutenticacion.obtenerUsuario();
       this.portafolios = [];
       this.portafolioSeleccionado = null;
       this.datosProgreso = {};
       this.graficos = {};
       this.configuracionVista = {
           mostrarDetallado: true,
           incluirComparativas: true,
           mostrarProyecciones: true
       };
       
       this.inicializar();
   }

   /**
    * Inicializa el calculador de progreso
    */
   async inicializar() {
       try {
           await this.verificarPermisos();
           await this.cargarDatos();
           this.configurarInterfaz();
           this.configurarEventos();
           this.procesarParametrosURL();
           
           Utilidades.mostrarNotificacion('Calculador de progreso cargado', 'success');
       } catch (error) {
           console.error('Error al inicializar calculador de progreso:', error);
           Utilidades.mostrarNotificacion('Error al cargar la página', 'error');
       }
   }

   /**
    * Verifica permisos de docente
    */
   async verificarPermisos() {
       if (!this.usuario || !this.usuario.rolesActivos.includes('docente')) {
           window.location.href = '/acceso-denegado.html';
           throw new Error('Sin permisos de docente');
       }
   }

   /**
    * Procesa parámetros de la URL
    */
   procesarParametrosURL() {
       const urlParams = new URLSearchParams(window.location.search);
       const portafolioId = urlParams.get('portafolio');
       
       if (portafolioId) {
           this.seleccionarPortafolio(portafolioId);
       } else if (this.portafolios.length > 0) {
           this.seleccionarPortafolio(this.portafolios[0].id);
       }
   }

   /**
    * Carga datos necesarios
    */
   async cargarDatos() {
       try {
           Utilidades.mostrarCargando('#contenedor-progreso');
           
           const [portafolios, cicloActual, configuracionProgreso] = await Promise.all([
               this.servicioPortafolios.obtenerMisPortafolios(),
               this.servicioCiclos.obtenerCicloActual(),
               this.servicioPortafolios.obtenerConfiguracionProgreso()
           ]);
           
           this.portafolios = portafolios;
           this.cicloActual = cicloActual;
           this.configuracionProgreso = configuracionProgreso;
           
       } catch (error) {
           console.error('Error al cargar datos:', error);
           throw error;
       } finally {
           Utilidades.ocultarCargando('#contenedor-progreso');
       }
   }

   /**
    * Configura la interfaz inicial
    */
   configurarInterfaz() {
       this.crearSelectorPortafolio();
       this.crearPanelConfiguracion();
       this.mostrarResumenGeneral();
       this.crearVisualizacionProgreso();
       this.crearPanelComparativas();
       this.crearPanelProyecciones();
       this.crearPanelRecomendaciones();
   }

   /**
    * Crea selector de portafolio
    */
   crearSelectorPortafolio() {
       const selectorHtml = `
           <div class="card mb-4">
               <div class="card-body">
                   <div class="row align-items-center">
                       <div class="col-md-4">
                           <label class="form-label">Seleccionar Portafolio</label>
                           <select class="form-select" id="selector-portafolio">
                               <option value="">Seleccione un portafolio...</option>
                               ${this.portafolios.map(p => `
                                   <option value="${p.id}" data-progreso="${p.progresoCompletado}">
                                       ${p.nombre} (${p.progresoCompletado}%)
                                   </option>
                               `).join('')}
                           </select>
                       </div>
                       <div class="col-md-4">
                           <label class="form-label">Vista</label>
                           <div class="btn-group w-100" role="group">
                               <input type="radio" class="btn-check" id="vista-general" name="tipo-vista" value="general" checked>
                               <label class="btn btn-outline-primary" for="vista-general">General</label>
                               
                               <input type="radio" class="btn-check" id="vista-detallada" name="tipo-vista" value="detallada">
                               <label class="btn btn-outline-primary" for="vista-detallada">Detallada</label>
                               
                               <input type="radio" class="btn-check" id="vista-temporal" name="tipo-vista" value="temporal">
                               <label class="btn btn-outline-primary" for="vista-temporal">Temporal</label>
                           </div>
                       </div>
                       <div class="col-md-4">
                           <label class="form-label">Acciones</label>
                           <div class="btn-group w-100">
                               <button class="btn btn-outline-primary" id="btn-actualizar-progreso">
                                   <i class="fas fa-sync me-1"></i>
                                   Actualizar
                               </button>
                               <button class="btn btn-outline-success" id="btn-exportar-progreso">
                                   <i class="fas fa-download me-1"></i>
                                   Exportar
                               </button>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('selector-portafolio-contenedor').innerHTML = selectorHtml;
   }

   /**
    * Crea panel de configuración de vista
    */
   crearPanelConfiguracion() {
       const panelHtml = `
           <div class="card mb-4">
               <div class="card-header">
                   <h6 class="m-0">
                       <i class="fas fa-cog me-2"></i>
                       Configuración de Vista
                   </h6>
               </div>
               <div class="card-body">
                   <div class="row">
                       <div class="col-md-4">
                           <div class="form-check">
                               <input class="form-check-input" type="checkbox" 
                                      id="mostrar-detallado" ${this.configuracionVista.mostrarDetallado ? 'checked' : ''}>
                               <label class="form-check-label" for="mostrar-detallado">
                                   Mostrar progreso detallado por sección
                               </label>
                           </div>
                       </div>
                       <div class="col-md-4">
                           <div class="form-check">
                               <input class="form-check-input" type="checkbox" 
                                      id="incluir-comparativas" ${this.configuracionVista.incluirComparativas ? 'checked' : ''}>
                               <label class="form-check-label" for="incluir-comparativas">
                                   Incluir comparativas con otros docentes
                               </label>
                           </div>
                       </div>
                       <div class="col-md-4">
                           <div class="form-check">
                               <input class="form-check-input" type="checkbox" 
                                      id="mostrar-proyecciones" ${this.configuracionVista.mostrarProyecciones ? 'checked' : ''}>
                               <label class="form-check-label" for="mostrar-proyecciones">
                                   Mostrar proyecciones y metas
                               </label>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('panel-configuracion').innerHTML = panelHtml;
   }

   /**
    * Muestra resumen general del progreso
    */
   mostrarResumenGeneral() {
       if (!this.portafolioSeleccionado) {
           document.getElementById('resumen-general').innerHTML = `
               <div class="alert alert-info">
                   <i class="fas fa-info-circle me-2"></i>
                   Seleccione un portafolio para ver el resumen de progreso
               </div>
           `;
           return;
       }
       
       const datos = this.datosProgreso;
       const portafolio = this.portafolioSeleccionado;
       
       const resumenHtml = `
           <div class="card bg-gradient-primary text-white mb-4">
               <div class="card-body">
                   <div class="row align-items-center">
                       <div class="col">
                           <h5 class="text-white mb-2">${portafolio.nombre}</h5>
                           <p class="text-white-75 mb-0">
                               ${portafolio.asignatura} - ${portafolio.ciclo}
                           </p>
                       </div>
                       <div class="col-auto">
                           <div class="text-center">
                               <div class="h1 text-white mb-0">${datos.progresoGeneral || 0}%</div>
                               <small class="text-white-75">Completado</small>
                           </div>
                       </div>
                   </div>
                   
                   <div class="progress mt-3 bg-white-25">
                       <div class="progress-bar bg-white" 
                            style="width: ${datos.progresoGeneral || 0}%" 
                            role="progressbar"></div>
                   </div>
                   
                   <div class="row mt-3">
                       <div class="col-md-3">
                           <div class="d-flex align-items-center">
                               <i class="fas fa-check-circle fa-2x me-3"></i>
                               <div>
                                   <div class="h4 text-white mb-0">${datos.seccionesCompletas || 0}</div>
                                   <small class="text-white-75">Secciones Completas</small>
                               </div>
                           </div>
                       </div>
                       <div class="col-md-3">
                           <div class="d-flex align-items-center">
                               <i class="fas fa-file-alt fa-2x me-3"></i>
                               <div>
                                   <div class="h4 text-white mb-0">${datos.documentosSubidos || 0}</div>
                                   <small class="text-white-75">Documentos Subidos</small>
                               </div>
                           </div>
                       </div>
                       <div class="col-md-3">
                           <div class="d-flex align-items-center">
                               <i class="fas fa-calendar fa-2x me-3"></i>
                               <div>
                                   <div class="h4 text-white mb-0">${datos.diasRestantes || 0}</div>
                                   <small class="text-white-75">Días Restantes</small>
                               </div>
                           </div>
                       </div>
                       <div class="col-md-3">
                           <div class="d-flex align-items-center">
                               <i class="fas fa-star fa-2x me-3"></i>
                               <div>
                                   <div class="h4 text-white mb-0">${datos.puntuacionCalidad || 0}</div>
                                   <small class="text-white-75">Puntuación Calidad</small>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('resumen-general').innerHTML = resumenHtml;
   }

   /**
    * Crea visualización principal del progreso
    */
   crearVisualizacionProgreso() {
       const visualizacionHtml = `
           <div class="row">
               <div class="col-md-8">
                   <div class="card">
                       <div class="card-header d-flex justify-content-between align-items-center">
                           <h6 class="m-0">Progreso por Secciones</h6>
                           <div class="btn-group btn-group-sm">
                               <button class="btn btn-outline-primary active" data-vista="barras">
                                   <i class="fas fa-chart-bar"></i>
                               </button>
                               <button class="btn btn-outline-primary" data-vista="circular">
                                   <i class="fas fa-chart-pie"></i>
                               </button>
                               <button class="btn btn-outline-primary" data-vista="lista">
                                   <i class="fas fa-list"></i>
                               </button>
                           </div>
                       </div>
                       <div class="card-body">
                           <div id="contenedor-grafico-progreso" style="height: 400px;">
                               <!-- Gráfico principal -->
                           </div>
                       </div>
                   </div>
               </div>
               
               <div class="col-md-4">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="m-0">Detalles de Progreso</h6>
                       </div>
                       <div class="card-body">
                           <div id="detalles-progreso">
                               <!-- Detalles específicos -->
                           </div>
                       </div>
                   </div>
                   
                   <div class="card mt-3">
                       <div class="card-header">
                           <h6 class="m-0">Alertas y Recomendaciones</h6>
                       </div>
                       <div class="card-body">
                           <div id="alertas-progreso">
                               <!-- Alertas y recomendaciones -->
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('visualizacion-progreso').innerHTML = visualizacionHtml;
   }

   /**
    * Crea panel de comparativas
    */
   crearPanelComparativas() {
       const comparativasHtml = `
           <div class="card mt-4">
               <div class="card-header">
                   <h6 class="m-0">
                       <i class="fas fa-balance-scale me-2"></i>
                       Comparativas
                   </h6>
               </div>
               <div class="card-body">
                   <div class="row">
                       <div class="col-md-6">
                           <div class="card border-left-primary">
                               <div class="card-body">
                                   <h6 class="text-primary">vs Promedio de la Carrera</h6>
                                   <div id="comparativa-carrera">
                                       <!-- Comparativa con carrera -->
                                   </div>
                               </div>
                           </div>
                       </div>
                       <div class="col-md-6">
                           <div class="card border-left-success">
                               <div class="card-body">
                                   <h6 class="text-success">vs Mis Otros Portafolios</h6>
                                   <div id="comparativa-personal">
                                       <!-- Comparativa personal -->
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('panel-comparativas').innerHTML = comparativasHtml;
   }

   /**
    * Crea panel de proyecciones
    */
   crearPanelProyecciones() {
       const proyeccionesHtml = `
           <div class="card mt-4">
               <div class="card-header">
                   <h6 class="m-0">
                       <i class="fas fa-chart-line me-2"></i>
                       Proyecciones y Metas
                   </h6>
               </div>
               <div class="card-body">
                   <div class="row">
                       <div class="col-md-4">
                           <div class="text-center">
                               <div class="circular-progress" data-percentage="85">
                                   <div class="circular-progress-inner">
                                       <div class="percentage">85%</div>
                                       <div class="label">Meta del Ciclo</div>
                                   </div>
                               </div>
                           </div>
                       </div>
                       <div class="col-md-8">
                           <div id="grafico-proyeccion" style="height: 250px;">
                               <!-- Gráfico de proyección -->
                           </div>
                       </div>
                   </div>
                   
                   <div class="row mt-3">
                       <div class="col-md-12">
                           <div class="timeline-projection">
                               <div id="cronograma-proyectado">
                                   <!-- Cronograma proyectado -->
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('panel-proyecciones').innerHTML = proyeccionesHtml;
   }

   /**
    * Crea panel de recomendaciones
    */
   crearPanelRecomendaciones() {
       const recomendacionesHtml = `
           <div class="card mt-4">
               <div class="card-header">
                   <h6 class="m-0">
                       <i class="fas fa-lightbulb me-2"></i>
                       Recomendaciones Inteligentes
                   </h6>
               </div>
               <div class="card-body">
                   <div id="lista-recomendaciones">
                       <!-- Lista de recomendaciones -->
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('panel-recomendaciones').innerHTML = recomendacionesHtml;
   }

   /**
    * Selecciona un portafolio específico
    */
   async seleccionarPortafolio(portafolioId) {
       try {
           if (!portafolioId) {
               this.portafolioSeleccionado = null;
               this.datosProgreso = {};
               this.actualizarVista();
               return;
           }
           
           Utilidades.mostrarCargando('#contenedor-grafico-progreso');
           
           // Buscar portafolio seleccionado
           this.portafolioSeleccionado = this.portafolios.find(p => p.id == portafolioId);
           
           // Cargar datos detallados del progreso
           this.datosProgreso = await this.servicioPortafolios.obtenerProgresoDetallado(portafolioId);
           
           // Actualizar selector
           document.getElementById('selector-portafolio').value = portafolioId;
           
           // Actualizar toda la vista
           this.actualizarVista();
           
       } catch (error) {
           console.error('Error al seleccionar portafolio:', error);
           Utilidades.mostrarNotificacion('Error al cargar progreso del portafolio', 'error');
       } finally {
           Utilidades.ocultarCargando('#contenedor-grafico-progreso');
       }
   }

   /**
    * Actualiza toda la vista según la selección actual
    */
   actualizarVista() {
       this.mostrarResumenGeneral();
       this.mostrarProgresoDetallado();
       this.mostrarComparativas();
       this.mostrarProyecciones();
       this.mostrarRecomendaciones();
       this.crearGraficoProgreso();
   }

   /**
    * Muestra progreso detallado por secciones
    */
   mostrarProgresoDetallado() {
       if (!this.datosProgreso.secciones) {
           document.getElementById('detalles-progreso').innerHTML = `
               <div class="text-center text-muted">
                   <i class="fas fa-folder-open fa-3x mb-3"></i>
                   <p>No hay datos de progreso disponibles</p>
               </div>
           `;
           return;
       }
       
       const seccionesHtml = this.datosProgreso.secciones.map(seccion => {
           const progreso = seccion.progreso || 0;
           const colorClass = progreso >= 80 ? 'success' : progreso >= 60 ? 'warning' : 'danger';
           
           return `
               <div class="mb-3">
                   <div class="d-flex justify-content-between align-items-center mb-1">
                       <span class="small font-weight-bold">${seccion.nombre}</span>
                       <span class="small text-${colorClass}">${progreso}%</span>
                   </div>
                   <div class="progress progress-sm">
                       <div class="progress-bar bg-${colorClass}" 
                            style="width: ${progreso}%"></div>
                   </div>
                   <div class="small text-muted">
                       ${seccion.documentosSubidos || 0} de ${seccion.documentosRequeridos || 0} documentos
                   </div>
               </div>
           `;
       }).join('');
       
       document.getElementById('detalles-progreso').innerHTML = seccionesHtml;
   }

   /**
    * Muestra comparativas con otros docentes
    */
   mostrarComparativas() {
       if (!this.configuracionVista.incluirComparativas) {
           document.getElementById('comparativa-carrera').innerHTML = `
               <p class="text-muted">Comparativas deshabilitadas</p>
           `;
           document.getElementById('comparativa-personal').innerHTML = `
               <p class="text-muted">Comparativas deshabilitadas</p>
           `;
           return;
       }
       
       const comp = this.datosProgreso.comparativas || {};
       
       // Comparativa con carrera
       const comparativaCarreraHtml = `
           <div class="row text-center">
               <div class="col-6">
                   <div class="h4 text-primary">${comp.progresoPropio || 0}%</div>
                   <small>Tu Progreso</small>
               </div>
               <div class="col-6">
                   <div class="h4 text-muted">${comp.promedioCarrera || 0}%</div>
                   <small>Promedio Carrera</small>
               </div>
           </div>
           <div class="mt-2">
               <div class="progress">
                   <div class="progress-bar bg-primary" 
                        style="width: ${(comp.progresoPropio / Math.max(comp.progresoPropio, comp.promedioCarrera)) * 100}%"></div>
               </div>
           </div>
           <div class="text-center mt-2">
               <span class="badge badge-${comp.posicionRanking <= 3 ? 'success' : comp.posicionRanking <= 10 ? 'warning' : 'secondary'}">
                   Posición #${comp.posicionRanking || 'N/A'} de ${comp.totalDocentes || 'N/A'}
               </span>
           </div>
       `;
       
       // Comparativa personal
       const comparativaPersonalHtml = `
           <div class="small">
               ${comp.misPortafolios && comp.misPortafolios.map(p => `
                   <div class="d-flex justify-content-between mb-1">
                       <span>${p.nombre}</span>
                       <span class="text-${p.progreso >= 80 ? 'success' : p.progreso >= 60 ? 'warning' : 'danger'}">
                           ${p.progreso}%
                       </span>
                   </div>
               `).join('') || '<p class="text-muted">No hay otros portafolios para comparar</p>'}
           </div>
       `;
       
       document.getElementById('comparativa-carrera').innerHTML = comparativaCarreraHtml;
       document.getElementById('comparativa-personal').innerHTML = comparativaPersonalHtml;
   }

   /**
    * Muestra proyecciones y metas
    */
   mostrarProyecciones() {
       if (!this.configuracionVista.mostrarProyecciones) {
           document.getElementById('cronograma-proyectado').innerHTML = `
               <p class="text-muted">Proyecciones deshabilitadas</p>
           `;
           return;
       }
       
       const proy = this.datosProgreso.proyecciones || {};
       
       // Cronograma proyectado
       const cronogramaHtml = `
           <div class="timeline">
               ${proy.hitos && proy.hitos.map(hito => {
                   const esPasado = new Date(hito.fecha) < new Date();
                   const esProximo = !esPasado && new Date(hito.fecha) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                   
                   return `
                       <div class="timeline-item ${esPasado ? 'completed' : esProximo ? 'upcoming' : 'future'}">
                           <div class="timeline-marker"></div>
                           <div class="timeline-content">
                               <div class="d-flex justify-content-between">
                                   <strong>${hito.nombre}</strong>
                                   <small>${Utilidades.formatearFecha(hito.fecha)}</small>
                               </div>
                               <div class="small text-muted">${hito.descripcion}</div>
                               ${hito.progreso !== undefined ? `
                                   <div class="progress progress-sm mt-1">
                                       <div class="progress-bar" style="width: ${hito.progreso}%"></div>
                                   </div>
                               ` : ''}
                           </div>
                       </div>
                   `;
               }).join('') || '<p class="text-muted">No hay hitos proyectados</p>'}
           </div>
       `;
       
       document.getElementById('cronograma-proyectado').innerHTML = cronogramaHtml;
   }

   /**
    * Muestra recomendaciones inteligentes
    */
   mostrarRecomendaciones() {
       const recomendaciones = this.generarRecomendaciones();
       
       const recomendacionesHtml = recomendaciones.map(rec => `
           <div class="alert alert-${rec.tipo} alert-dismissible">
               <div class="d-flex align-items-start">
                   <i class="fas fa-${rec.icono} me-2 mt-1"></i>
                   <div class="flex-grow-1">
                       <strong>${rec.titulo}</strong>
                       <p class="mb-0">${rec.descripcion}</p>
                       ${rec.accion ? `
                           <button class="btn btn-outline-${rec.tipo} btn-sm mt-2" 
                                   onclick="${rec.accion.funcion}">
                               ${rec.accion.texto}
                           </button>
                       ` : ''}
                   </div>
               </div>
           </div>
       `).join('');
       
       document.getElementById('lista-recomendaciones').innerHTML = recomendacionesHtml || `
           <div class="text-center text-muted">
               <i class="fas fa-thumbs-up fa-3x mb-3"></i>
               <p>¡Excelente trabajo! No hay recomendaciones en este momento.</p>
           </div>
       `;
   }

   /**
    * Genera recomendaciones basadas en el progreso
    */
   generarRecomendaciones() {
       const recomendaciones = [];
       const datos = this.datosProgreso;
       
       if (!datos.progresoGeneral) return recomendaciones;
       
       // Recomendación por progreso bajo
       if (datos.progresoGeneral < 50 && datos.diasRestantes < 30) {
           recomendaciones.push({
               tipo: 'warning',
               icono: 'exclamation-triangle',
               titulo: 'Progreso Bajo con Poco Tiempo',
               descripcion: 'Tu progreso está por debajo del 50% y quedan menos de 30 días. Considera priorizar las secciones más importantes.',
               accion: {
                   texto: 'Ver Plan de Acción',
                   funcion: 'window.calculadorProgreso.mostrarPlanAccion()'
               }
           });
       }
       
       // Recomendación por secciones incompletas
       if (datos.secciones) {
           const seccionesIncompletas = datos.secciones.filter(s => s.progreso < 100);
           if (seccionesIncompletas.length > 0) {
               recomendaciones.push({
                   tipo: 'info',
                   icono: 'tasks',
                   titulo: `${seccionesIncompletas.length} Secciones Pendientes`,
                   descripcion: 'Hay secciones que requieren atención para completar tu portafolio.',
                   accion: {
                       texto: 'Ver Secciones',
                       funcion: 'window.calculadorProgreso.mostrarSeccionesPendientes()'
                   }
               });
           }
       }
       
       // Recomendación por buen progreso
       if (datos.progresoGeneral >= 80) {
           recomendaciones.push({
               tipo: 'success',
               icono: 'check-circle',
               titulo: '¡Excelente Progreso!',
               descripcion: 'Estás muy cerca de completar tu portafolio. ¡Sigue así!'
           });
       }
       
       return recomendaciones;
   }

   /**
    * Crea gráfico principal de progreso
    */
   crearGraficoProgreso() {
       const vistaActiva = document.querySelector('[data-vista].active')?.dataset.vista || 'barras';
       
       switch (vistaActiva) {
           case 'barras':
               this.crearGraficoBarras();
               break;
           case 'circular':
               this.crearGraficoCircular();
               break;
           case 'lista':
               this.crearVistaLista();
               break;
       }
   }

   /**
    * Crea gráfico de barras
    */
   crearGraficoBarras() {
       const contenedor = document.getElementById('contenedor-grafico-progreso');
       
       if (!this.datosProgreso.secciones) {
           contenedor.innerHTML = '<p class="text-center text-muted">No hay datos para mostrar</p>';
           return;
       }
       
       contenedor.innerHTML = '<canvas id="grafico-barras-progreso"></canvas>';
       
       const ctx = document.getElementById('grafico-barras-progreso').getContext('2d');
       
       this.graficos.barras = new Chart(ctx, {
           type: 'bar',
           data: {
               labels: this.datosProgreso.secciones.map(s => s.nombre),
               datasets: [{
                   label: 'Progreso (%)',
                   data: this.datosProgreso.secciones.map(s => s.progreso || 0),
                   backgroundColor: this.datosProgreso.secciones.map(s => {
                       const progreso = s.progreso || 0;
                       return progreso >= 80 ? 'rgba(40, 167, 69, 0.8)' :
                              progreso >= 60 ? 'rgba(255, 193, 7, 0.8)' : 
                              'rgba(220, 53, 69, 0.8)';
                   }),
                   borderColor: this.datosProgreso.secciones.map(s => {
                       const progreso = s.progreso || 0;
                       return progreso >= 80 ? 'rgb(40, 167, 69)' :
                              progreso >= 60 ? 'rgb(255, 193, 7)' : 
                              'rgb(220, 53, 69)';
                   }),
                   borderWidth: 1
               }]
           },
           options: {
               responsive: true,
               maintainAspectRatio: false,
               scales: {
                   y: {
                       beginAtZero: true,
                       max: 100,
                       ticks: {
                           callback: function(value) {
                               return value + '%';
                           }
                       }
                   }
               },
               plugins: {
                   legend: {
                       display: false
                   },
                   tooltip: {
                       callbacks: {
                           label: function(context) {
                               return `Progreso: ${context.parsed.y}%`;
                           }
                       }
                   }
               }
           }
       });
   }

   /**
    * Crea gráfico circular
    */
   crearGraficoCircular() {
       const contenedor = document.getElementById('contenedor-grafico-progreso');
       
       if (!this.datosProgreso.secciones) {
           contenedor.innerHTML = '<p class="text-center text-muted">No hay datos para mostrar</p>';
           return;
       }
       
       contenedor.innerHTML = '<canvas id="grafico-circular-progreso"></canvas>';
       
       const ctx = document.getElementById('grafico-circular-progreso').getContext('2d');
       
       this.graficos.circular = new Chart(ctx, {
           type: 'doughnut',
           data: {
               labels: this.datosProgreso.secciones.map(s => s.nombre),
               datasets: [{
                   data: this.datosProgreso.secciones.map(s => s.progreso || 0),
                   backgroundColor: [
                       'rgba(255, 99, 132, 0.8)',
                       'rgba(54, 162, 235, 0.8)',
                       'rgba(255, 205, 86, 0.8)',
                       'rgba(75, 192, 192, 0.8)',
                       'rgba(153, 102, 255, 0.8)',
                       'rgba(255, 159, 64, 0.8)'
                   ],
                   borderWidth: 2
               }]
           },
           options: {
               responsive: true,
               maintainAspectRatio: false,
               plugins: {
                   legend: {
                       position: 'bottom'
                   },
                   tooltip: {
                       callbacks: {
                           label: function(context) {
                               return `${context.label}: ${context.parsed}%`;
                           }
                       }
                   }
               }
           }
       });
   }

   /**
    * Crea vista de lista detallada
    */
   crearVistaLista() {
       const contenedor = document.getElementById('contenedor-grafico-progreso');
       
       if (!this.datosProgreso.secciones) {
           contenedor.innerHTML = '<p class="text-center text-muted">No hay datos para mostrar</p>';
           return;
       }
       
       const listaHtml = `
           <div class="list-group">
               ${this.datosProgreso.secciones.map(seccion => {
                   const progreso = seccion.progreso || 0;
                   const colorClass = progreso >= 80 ? 'success' : progreso >= 60 ? 'warning' : 'danger';
                   
                   return `
                       <div class="list-group-item">
                           <div class="d-flex w-100 justify-content-between align-items-center">
                               <div class="flex-grow-1">
                                   <h6 class="mb-1">${seccion.nombre}</h6>
                                   <p class="mb-1 text-muted">${seccion.descripcion || 'Sin descripción'}</p>
                                   <div class="progress" style="height: 10px;">
                                       <div class="progress-bar bg-${colorClass}" 
                                            style="width: ${progreso}%"></div>
                                   </div>
                                   <small class="text-muted">
                                       ${seccion.documentosSubidos || 0} de ${seccion.documentosRequeridos || 0} documentos subidos
                                   </small>
                               </div>
                               <div class="text-center ms-3">
                                   <div class="h4 text-${colorClass} mb-0">${progreso}%</div>
                                   <small class="text-muted">Completado</small>
                               </div>
                           </div>
                       </div>
                   `;
               }).join('')}
           </div>
       `;
       
       contenedor.innerHTML = listaHtml;
   }

   /**
    * Configura eventos de la interfaz
    */
   configurarEventos() {
       // Selector de portafolio
       document.getElementById('selector-portafolio').addEventListener('change', (e) => {
           this.seleccionarPortafolio(e.target.value);
       });
       
       // Botones de vista
       document.querySelectorAll('[data-vista]').forEach(btn => {
           btn.addEventListener('click', (e) => {
               document.querySelectorAll('[data-vista]').forEach(b => b.classList.remove('active'));
               e.target.classList.add('active');
               this.crearGraficoProgreso();
           });
       });
       
       // Tipo de vista
       document.querySelectorAll('[name="tipo-vista"]').forEach(radio => {
           radio.addEventListener('change', (e) => {
               this.cambiarTipoVista(e.target.value);
           });
       });
       
       // Configuración de vista
       document.getElementById('mostrar-detallado').addEventListener('change', (e) => {
           this.configuracionVista.mostrarDetallado = e.target.checked;
           this.actualizarVista();
       });
       
       document.getElementById('incluir-comparativas').addEventListener('change', (e) => {
           this.configuracionVista.incluirComparativas = e.target.checked;
           this.mostrarComparativas();
       });
       
       document.getElementById('mostrar-proyecciones').addEventListener('change', (e) => {
           this.configuracionVista.mostrarProyecciones = e.target.checked;
           this.mostrarProyecciones();
       });
       
       // Botones de acción
       document.getElementById('btn-actualizar-progreso').addEventListener('click', () => {
           this.actualizarProgreso();
       });
       
       document.getElementById('btn-exportar-progreso').addEventListener('click', () => {
           this.exportarProgreso();
       });
   }

   /**
    * Actualiza el progreso recalculando datos
    */
   async actualizarProgreso() {
       if (!this.portafolioSeleccionado) return;
       
       try {
           Utilidades.mostrarCargando('#btn-actualizar-progreso');
           
           // Recalcular progreso en el servidor
           await this.servicioPortafolios.recalcularProgreso(this.portafolioSeleccionado.id);
           
           // Recargar datos
           await this.seleccionarPortafolio(this.portafolioSeleccionado.id);
           
           Utilidades.mostrarNotificacion('Progreso actualizado correctamente', 'success');
           
       } catch (error) {
           console.error('Error al actualizar progreso:', error);
           Utilidades.mostrarNotificacion('Error al actualizar progreso', 'error');
       } finally {
           Utilidades.ocultarCargando('#btn-actualizar-progreso');
       }
   }

   /**
    * Exporta el progreso a PDF
    */
   async exportarProgreso() {
       if (!this.portafolioSeleccionado) return;
       
       try {
           Utilidades.mostrarCargando('#btn-exportar-progreso');
           
           const configuracion = {
               portafolioId: this.portafolioSeleccionado.id,
               incluirGraficos: true,
               incluirComparativas: this.configuracionVista.incluirComparativas,
               incluirProyecciones: this.configuracionVista.mostrarProyecciones
           };
           
           const resultado = await this.servicioReportes.exportarProgreso(configuracion);
           
           if (resultado.exito) {
               window.open(resultado.urlDescarga, '_blank');
               Utilidades.mostrarNotificacion('Reporte de progreso exportado', 'success');
           }
           
       } catch (error) {
           console.error('Error al exportar progreso:', error);
           Utilidades.mostrarNotificacion('Error al exportar progreso', 'error');
       } finally {
           Utilidades.ocultarCargando('#btn-exportar-progreso');
       }
   }

   /**
    * Destruye gráficos para evitar memory leaks
    */
   destruirGraficos() {
       Object.values(this.graficos).forEach(grafico => {
           if (grafico && typeof grafico.destroy === 'function') {
               grafico.destroy();
           }
       });
       this.graficos = {};
   }

   /**
    * Limpia recursos al salir de la página
    */
   destruir() {
       this.destruirGraficos();
   }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
   window.calculadorProgreso = new CalculadorProgreso();
});

// Limpiar recursos al salir de la página
window.addEventListener('beforeunload', () => {
   if (window.calculadorProgreso) {
       window.calculadorProgreso.destruir();
   }
});

// Exportar para uso global
window.CalculadorProgreso = CalculadorProgreso;