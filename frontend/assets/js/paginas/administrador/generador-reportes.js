/**
 * 📊 GENERADOR DE REPORTES
 * Sistema Portafolio Docente UNSAAC
 * 
 * Página para generar reportes ejecutivos y estadísticos
 * Incluye filtros avanzados, previsualización y múltiples formatos
 */

class GeneradorReportes {
   constructor() {
       this.servicioReportes = new ServicioReportes();
       this.servicioUsuarios = new ServicioUsuarios();
       this.servicioCiclos = new ServicioCiclos();
       this.reporteActual = null;
       this.filtrosAvanzados = {};
       
       this.inicializar();
   }

   /**
    * Inicializa el generador de reportes
    */
   async inicializar() {
       try {
           await this.verificarPermisos();
           await this.configurarInterfaz();
           await this.cargarDatosIniciales();
           this.configurarEventos();
           this.mostrarEstadisticasGenerales();
           
           Utilidades.mostrarNotificacion('Generador de reportes cargado', 'success');
       } catch (error) {
           console.error('Error al inicializar generador de reportes:', error);
           Utilidades.mostrarNotificacion('Error al cargar el generador de reportes', 'error');
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
    * Configura la interfaz inicial
    */
   async configurarInterfaz() {
       // Configurar fecha por defecto (último mes)
       const fechaFin = new Date();
       const fechaInicio = new Date();
       fechaInicio.setMonth(fechaInicio.getMonth() - 1);
       
       document.getElementById('fechaInicio').value = fechaInicio.toISOString().split('T')[0];
       document.getElementById('fechaFin').value = fechaFin.toISOString().split('T')[0];
       
       // Configurar componentes avanzados
       this.configurarSelectorTipoReporte();
       this.configurarFiltrosAvanzados();
       this.configurarPrevisualización();
   }

   /**
    * Carga datos iniciales necesarios
    */
   async cargarDatosIniciales() {
       try {
           Utilidades.mostrarCargando('#contenedor-datos-iniciales');
           
           const [ciclos, usuarios, estadisticasGenerales] = await Promise.all([
               this.servicioCiclos.obtenerTodos(),
               this.servicioUsuarios.obtenerListaCompleta(),
               this.servicioReportes.obtenerEstadisticasGenerales()
           ]);
           
           this.poblarSelectorCiclos(ciclos);
           this.poblarSelectorUsuarios(usuarios);
           this.mostrarResumenGeneral(estadisticasGenerales);
           
       } catch (error) {
           console.error('Error al cargar datos iniciales:', error);
           Utilidades.mostrarNotificacion('Error al cargar datos', 'error');
       } finally {
           Utilidades.ocultarCargando('#contenedor-datos-iniciales');
       }
   }

   /**
    * Configura el selector de tipo de reporte
    */
   configurarSelectorTipoReporte() {
       const tiposReporte = [
           {
               id: 'general',
               nombre: 'Reporte General del Sistema',
               descripcion: 'Estadísticas completas de todos los módulos',
               icono: 'fas fa-chart-bar',
               campos: ['usuarios', 'portafolios', 'documentos', 'verificaciones']
           },
           {
               id: 'docentes',
               nombre: 'Reporte de Docentes',
               descripcion: 'Actividad y progreso de docentes',
               icono: 'fas fa-users',
               campos: ['progreso', 'documentos_subidos', 'observaciones']
           },
           {
               id: 'verificadores',
               nombre: 'Reporte de Verificadores',
               descripcion: 'Rendimiento y estadísticas de verificación',
               icono: 'fas fa-check-circle',
               campos: ['documentos_revisados', 'tiempo_promedio', 'calidad']
           },
           {
               id: 'portafolios',
               nombre: 'Reporte de Portafolios',
               descripcion: 'Estado y completitud de portafolios',
               icono: 'fas fa-folder',
               campos: ['completitud', 'documentos', 'estructura']
           },
           {
               id: 'ciclo',
               nombre: 'Reporte por Ciclo Académico',
               descripcion: 'Análisis detallado de un ciclo específico',
               icono: 'fas fa-calendar',
               campos: ['comparativo', 'tendencias', 'metas']
           },
           {
               id: 'ejecutivo',
               nombre: 'Reporte Ejecutivo',
               descripcion: 'Resumen para dirección y gerencia',
               icono: 'fas fa-crown',
               campos: ['kpis', 'tendencias', 'recomendaciones']
           }
       ];
       
       const contenedor = document.getElementById('selector-tipo-reporte');
       contenedor.innerHTML = tiposReporte.map(tipo => `
           <div class="col-md-6 col-lg-4 mb-3">
               <div class="card tipo-reporte-card" data-tipo="${tipo.id}">
                   <div class="card-body text-center">
                       <i class="${tipo.icono} fa-2x text-primary mb-3"></i>
                       <h5 class="card-title">${tipo.nombre}</h5>
                       <p class="card-text small text-muted">${tipo.descripcion}</p>
                       <div class="campos-incluidos mt-2">
                           ${tipo.campos.map(campo => 
                               `<span class="badge badge-outline-primary me-1">${campo}</span>`
                           ).join('')}
                       </div>
                   </div>
               </div>
           </div>
       `).join('');
       
       // Eventos para selección
       contenedor.addEventListener('click', (e) => {
           const card = e.target.closest('.tipo-reporte-card');
           if (card) {
               this.seleccionarTipoReporte(card.dataset.tipo);
           }
       });
   }

   /**
    * Selecciona un tipo de reporte
    */
   seleccionarTipoReporte(tipo) {
       // Marcar tarjeta seleccionada
       document.querySelectorAll('.tipo-reporte-card').forEach(card => {
           card.classList.remove('border-primary', 'selected');
       });
       
       const cardSeleccionada = document.querySelector(`[data-tipo="${tipo}"]`);
       cardSeleccionada.classList.add('border-primary', 'selected');
       
       // Mostrar filtros específicos
       this.mostrarFiltrosEspecificos(tipo);
       
       // Habilitar botón de generar
       document.getElementById('btn-generar-reporte').disabled = false;
       
       this.tipoReporteSeleccionado = tipo;
       
       Utilidades.mostrarNotificacion(`Tipo de reporte "${tipo}" seleccionado`, 'info');
   }

   /**
    * Muestra filtros específicos según el tipo de reporte
    */
   mostrarFiltrosEspecificos(tipo) {
       const contenedorFiltros = document.getElementById('filtros-especificos');
       
       const filtrosPorTipo = {
           general: `
               <div class="row">
                   <div class="col-md-6">
                       <label class="form-label">Módulos a incluir</label>
                       <div class="form-check-group">
                           <div class="form-check">
                               <input class="form-check-input" type="checkbox" id="incluir-usuarios" checked>
                               <label class="form-check-label" for="incluir-usuarios">Usuarios</label>
                           </div>
                           <div class="form-check">
                               <input class="form-check-input" type="checkbox" id="incluir-portafolios" checked>
                               <label class="form-check-label" for="incluir-portafolios">Portafolios</label>
                           </div>
                           <div class="form-check">
                               <input class="form-check-input" type="checkbox" id="incluir-documentos" checked>
                               <label class="form-check-label" for="incluir-documentos">Documentos</label>
                           </div>
                       </div>
                   </div>
                   <div class="col-md-6">
                       <label class="form-label">Nivel de detalle</label>
                       <select class="form-select" id="nivel-detalle">
                           <option value="resumen">Resumen ejecutivo</option>
                           <option value="detallado">Detallado</option>
                           <option value="completo">Completo con gráficos</option>
                       </select>
                   </div>
               </div>
           `,
           docentes: `
               <div class="row">
                   <div class="col-md-6">
                       <label class="form-label">Docentes específicos</label>
                       <select class="form-select" id="filtro-docentes" multiple>
                           <option value="">Todos los docentes</option>
                       </select>
                   </div>
                   <div class="col-md-6">
                       <label class="form-label">Métricas a incluir</label>
                       <div class="form-check-group">
                           <div class="form-check">
                               <input class="form-check-input" type="checkbox" id="progreso-completitud" checked>
                               <label class="form-check-label" for="progreso-completitud">Progreso de completitud</label>
                           </div>
                           <div class="form-check">
                               <input class="form-check-input" type="checkbox" id="documentos-subidos" checked>
                               <label class="form-check-label" for="documentos-subidos">Documentos subidos</label>
                           </div>
                           <div class="form-check">
                               <input class="form-check-input" type="checkbox" id="observaciones-recibidas">
                               <label class="form-check-label" for="observaciones-recibidas">Observaciones recibidas</label>
                           </div>
                       </div>
                   </div>
               </div>
           `,
           verificadores: `
               <div class="row">
                   <div class="col-md-6">
                       <label class="form-label">Verificadores específicos</label>
                       <select class="form-select" id="filtro-verificadores" multiple>
                           <option value="">Todos los verificadores</option>
                       </select>
                   </div>
                   <div class="col-md-6">
                       <label class="form-label">Indicadores de rendimiento</label>
                       <div class="form-check-group">
                           <div class="form-check">
                               <input class="form-check-input" type="checkbox" id="documentos-revisados" checked>
                               <label class="form-check-label" for="documentos-revisados">Documentos revisados</label>
                           </div>
                           <div class="form-check">
                               <input class="form-check-input" type="checkbox" id="tiempo-promedio" checked>
                               <label class="form-check-label" for="tiempo-promedio">Tiempo promedio revisión</label>
                           </div>
                           <div class="form-check">
                               <input class="form-check-input" type="checkbox" id="calidad-revision">
                               <label class="form-check-label" for="calidad-revision">Calidad de revisión</label>
                           </div>
                       </div>
                   </div>
               </div>
           `,
           ejecutivo: `
               <div class="row">
                   <div class="col-md-12">
                       <div class="alert alert-info">
                           <i class="fas fa-info-circle me-2"></i>
                           <strong>Reporte Ejecutivo:</strong> Incluye KPIs principales, tendencias, 
                           comparativas con periodos anteriores y recomendaciones estratégicas.
                       </div>
                       <label class="form-label">Componentes del reporte</label>
                       <div class="form-check-group">
                           <div class="form-check">
                               <input class="form-check-input" type="checkbox" id="kpis-principales" checked disabled>
                               <label class="form-check-label" for="kpis-principales">KPIs principales</label>
                           </div>
                           <div class="form-check">
                               <input class="form-check-input" type="checkbox" id="tendencias" checked>
                               <label class="form-check-label" for="tendencias">Análisis de tendencias</label>
                           </div>
                           <div class="form-check">
                               <input class="form-check-input" type="checkbox" id="comparativas" checked>
                               <label class="form-check-label" for="comparativas">Comparativas temporales</label>
                           </div>
                           <div class="form-check">
                               <input class="form-check-input" type="checkbox" id="recomendaciones" checked>
                               <label class="form-check-label" for="recomendaciones">Recomendaciones</label>
                           </div>
                       </div>
                   </div>
               </div>
           `
       };
       
       contenedorFiltros.innerHTML = filtrosPorTipo[tipo] || '';
       contenedorFiltros.style.display = 'block';
       
       // Cargar datos específicos para los filtros
       if (tipo === 'docentes') {
           this.cargarDocentesParaFiltro();
       } else if (tipo === 'verificadores') {
           this.cargarVerificadoresParaFiltro();
       }
   }

   /**
    * Configura eventos de la página
    */
   configurarEventos() {
       // Botón generar reporte
       document.getElementById('btn-generar-reporte').addEventListener('click', () => {
           this.generarReporte();
       });
       
       // Botón vista previa
       document.getElementById('btn-vista-previa').addEventListener('click', () => {
           this.mostrarVistaPrevia();
       });
       
       // Botón programar reporte
       document.getElementById('btn-programar').addEventListener('click', () => {
           this.mostrarModalProgramacion();
       });
       
       // Selector de formato
       document.getElementById('formato-salida').addEventListener('change', (e) => {
           this.actualizarOpcionesFormato(e.target.value);
       });
       
       // Cambios en filtros
       document.addEventListener('change', (e) => {
           if (e.target.closest('#filtros-avanzados') || e.target.closest('#filtros-especificos')) {
               this.actualizarPrevisualización();
           }
       });
       
       // Botones de reportes rápidos
       document.querySelectorAll('.btn-reporte-rapido').forEach(btn => {
           btn.addEventListener('click', (e) => {
               this.generarReporteRapido(e.target.dataset.tipo);
           });
       });
   }

   /**
    * Genera el reporte según la configuración actual
    */
   async generarReporte() {
       try {
           if (!this.tipoReporteSeleccionado) {
               Utilidades.mostrarNotificacion('Selecciona un tipo de reporte', 'warning');
               return;
           }
           
           const configuracion = this.obtenerConfiguracionReporte();
           
           // Validar configuración
           if (!this.validarConfiguracion(configuracion)) {
               return;
           }
           
           Utilidades.mostrarCargando('#contenedor-generacion');
           document.getElementById('btn-generar-reporte').disabled = true;
           
           // Generar reporte
           const resultado = await this.servicioReportes.generarReporte(configuracion);
           
           if (resultado.exito) {
               this.reporteActual = resultado.datos;
               this.mostrarResultadoGeneracion(resultado);
               
               // Habilitar descarga
               this.habilitarDescarga(resultado.urlDescarga);
               
               Utilidades.mostrarNotificacion(
                   `Reporte ${configuracion.tipo} generado exitosamente`, 
                   'success'
               );
           } else {
               throw new Error(resultado.mensaje || 'Error al generar reporte');
           }
           
       } catch (error) {
           console.error('Error al generar reporte:', error);
           Utilidades.mostrarNotificacion(
               'Error al generar reporte: ' + error.message, 
               'error'
           );
       } finally {
           Utilidades.ocultarCargando('#contenedor-generacion');
           document.getElementById('btn-generar-reporte').disabled = false;
       }
   }

   /**
    * Obtiene la configuración actual del reporte
    */
   obtenerConfiguracionReporte() {
       const configuracion = {
           tipo: this.tipoReporteSeleccionado,
           formato: document.getElementById('formato-salida').value,
           fechaInicio: document.getElementById('fechaInicio').value,
           fechaFin: document.getElementById('fechaFin').value,
           cicloId: document.getElementById('filtro-ciclo').value || null,
           incluirGraficos: document.getElementById('incluir-graficos').checked,
           filtros: {},
           opciones: {}
       };
       
       // Filtros específicos según tipo
       switch (this.tipoReporteSeleccionado) {
           case 'general':
               configuracion.filtros.modulos = this.obtenerModulosSeleccionados();
               configuracion.opciones.nivelDetalle = document.getElementById('nivel-detalle').value;
               break;
               
           case 'docentes':
               configuracion.filtros.docentes = this.obtenerDocentesSeleccionados();
               configuracion.filtros.metricas = this.obtenerMetricasDocentes();
               break;
               
           case 'verificadores':
               configuracion.filtros.verificadores = this.obtenerVerificadoresSeleccionados();
               configuracion.filtros.indicadores = this.obtenerIndicadoresVerificadores();
               break;
               
           case 'ejecutivo':
               configuracion.filtros.componentes = this.obtenerComponentesEjecutivo();
               break;
       }
       
       return configuracion;
   }

   /**
    * Valida la configuración del reporte
    */
   validarConfiguracion(config) {
       if (!config.fechaInicio || !config.fechaFin) {
           Utilidades.mostrarNotificacion('Selecciona el rango de fechas', 'warning');
           return false;
       }
       
       if (new Date(config.fechaInicio) > new Date(config.fechaFin)) {
           Utilidades.mostrarNotificacion('La fecha de inicio debe ser anterior a la fecha fin', 'warning');
           return false;
       }
       
       return true;
   }

   /**
    * Muestra vista previa del reporte
    */
   async mostrarVistaPrevia() {
       try {
           if (!this.tipoReporteSeleccionado) {
               Utilidades.mostrarNotificacion('Selecciona un tipo de reporte', 'warning');
               return;
           }
           
           const configuracion = this.obtenerConfiguracionReporte();
           configuracion.vistaPrevia = true;
           
           Utilidades.mostrarCargando('#vista-previa-contenido');
           
           const preview = await this.servicioReportes.obtenerVistaPrevia(configuracion);
           
           if (preview.exito) {
               this.mostrarPreview(preview.datos);
               
               // Mostrar modal de vista previa
               const modal = new bootstrap.Modal(document.getElementById('modal-vista-previa'));
               modal.show();
           }
           
       } catch (error) {
           console.error('Error en vista previa:', error);
           Utilidades.mostrarNotificacion('Error al generar vista previa', 'error');
       } finally {
           Utilidades.ocultarCargando('#vista-previa-contenido');
       }
   }

   /**
    * Muestra el contenido de la vista previa
    */
   mostrarPreview(datos) {
       const contenedor = document.getElementById('vista-previa-contenido');
       
       const html = `
           <div class="preview-header mb-4">
               <h4>${datos.titulo}</h4>
               <p class="text-muted">${datos.descripcion}</p>
               <div class="row">
                   <div class="col-md-6">
                       <small><strong>Período:</strong> ${datos.periodo}</small>
                   </div>
                   <div class="col-md-6">
                       <small><strong>Registros:</strong> ${datos.totalRegistros}</small>
                   </div>
               </div>
           </div>
           
           <div class="preview-stats">
               <h5>Estadísticas principales:</h5>
               <div class="row">
                   ${datos.estadisticas.map(stat => `
                       <div class="col-md-3 mb-3">
                           <div class="stat-card text-center">
                               <div class="stat-value">${stat.valor}</div>
                               <div class="stat-label">${stat.etiqueta}</div>
                           </div>
                       </div>
                   `).join('')}
               </div>
           </div>
           
           ${datos.graficos && datos.graficos.length > 0 ? `
               <div class="preview-charts mt-4">
                   <h5>Gráficos incluidos:</h5>
                   <div class="row">
                       ${datos.graficos.map(grafico => `
                           <div class="col-md-6 mb-3">
                               <div class="chart-preview">
                                   <h6>${grafico.titulo}</h6>
                                   <div class="chart-placeholder">
                                       <i class="fas fa-chart-${grafico.tipo} fa-3x text-muted"></i>
                                       <p class="small mt-2">${grafico.descripcion}</p>
                                   </div>
                               </div>
                           </div>
                       `).join('')}
                   </div>
               </div>
           ` : ''}
       `;
       
       contenedor.innerHTML = html;
   }

   /**
    * Genera un reporte rápido predefinido
    */
   async generarReporteRapido(tipo) {
       try {
           Utilidades.mostrarCargando(`#btn-rapido-${tipo}`);
           
           const configuracion = {
               tipo: 'rapido',
               subtipo: tipo,
               fechaInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
               fechaFin: new Date().toISOString().split('T')[0],
               formato: 'pdf'
           };
           
           const resultado = await this.servicioReportes.generarReporte(configuracion);
           
           if (resultado.exito) {
               window.open(resultado.urlDescarga, '_blank');
               Utilidades.mostrarNotificacion(`Reporte ${tipo} generado`, 'success');
           }
           
       } catch (error) {
           console.error('Error en reporte rápido:', error);
           Utilidades.mostrarNotificacion('Error al generar reporte rápido', 'error');
       } finally {
           Utilidades.ocultarCargando(`#btn-rapido-${tipo}`);
       }
   }

   /**
    * Habilita la descarga del reporte generado
    */
   habilitarDescarga(url) {
       const btnDescargar = document.getElementById('btn-descargar-reporte');
       btnDescargar.disabled = false;
       btnDescargar.onclick = () => window.open(url, '_blank');
       
       // Mostrar información del archivo
       document.getElementById('info-archivo-generado').innerHTML = `
           <div class="alert alert-success">
               <i class="fas fa-check-circle me-2"></i>
               <strong>Reporte generado exitosamente</strong>
               <p class="mb-0">El archivo está listo para descargar.</p>
           </div>
       `;
   }

   /**
    * Muestra estadísticas generales del sistema
    */
   mostrarEstadisticasGenerales() {
       // Esta función mostraría un resumen de estadísticas clave
       // en la parte superior de la página para dar contexto
   }

   /**
    * Utilidades para obtener datos de los filtros
    */
   obtenerModulosSeleccionados() {
       const modulos = [];
       if (document.getElementById('incluir-usuarios')?.checked) modulos.push('usuarios');
       if (document.getElementById('incluir-portafolios')?.checked) modulos.push('portafolios');
       if (document.getElementById('incluir-documentos')?.checked) modulos.push('documentos');
       return modulos;
   }

   obtenerDocentesSeleccionados() {
       const select = document.getElementById('filtro-docentes');
       return Array.from(select.selectedOptions).map(option => option.value);
   }

   obtenerMetricasDocentes() {
       const metricas = [];
       if (document.getElementById('progreso-completitud')?.checked) metricas.push('progreso');
       if (document.getElementById('documentos-subidos')?.checked) metricas.push('documentos');
       if (document.getElementById('observaciones-recibidas')?.checked) metricas.push('observaciones');
       return metricas;
   }

   obtenerVerificadoresSeleccionados() {
       const select = document.getElementById('filtro-verificadores');
       return Array.from(select.selectedOptions).map(option => option.value);
   }

   obtenerIndicadoresVerificadores() {
       const indicadores = [];
       if (document.getElementById('documentos-revisados')?.checked) indicadores.push('revisados');
       if (document.getElementById('tiempo-promedio')?.checked) indicadores.push('tiempo');
       if (document.getElementById('calidad-revision')?.checked) indicadores.push('calidad');
       return indicadores;
   }

   obtenerComponentesEjecutivo() {
       const componentes = [];
       if (document.getElementById('kpis-principales')?.checked) componentes.push('kpis');
       if (document.getElementById('tendencias')?.checked) componentes.push('tendencias');
       if (document.getElementById('comparativas')?.checked) componentes.push('comparativas');
       if (document.getElementById('recomendaciones')?.checked) componentes.push('recomendaciones');
       return componentes;
   }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
   window.generadorReportes = new GeneradorReportes();
});

// Exportar para uso global
window.GeneradorReportes = GeneradorReportes;