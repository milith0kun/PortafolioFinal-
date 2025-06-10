/**
 * 📊 ESTADÍSTICAS DEL VERIFICADOR
 * Sistema Portafolio Docente UNSAAC
 * 
 * Página para mostrar estadísticas detalladas del verificador
 * Incluye métricas de rendimiento, comparativas y reportes personalizados
 */

class EstadisticasVerificador {
   constructor() {
       this.servicioReportes = new ServicioReportes();
       this.servicioDocumentos = new ServicioDocumentos();
       this.servicioObservaciones = new ServicioObservaciones();
       this.servicioUsuarios = new ServicioUsuarios();
       
       this.usuario = SistemaAutenticacion.obtenerUsuario();
       this.rangoFechas = {
           inicio: this.obtenerFechaInicioPorDefecto(),
           fin: new Date().toISOString().split('T')[0]
       };
       this.graficos = {};
       this.intervalosActualizacion = [];
       
       this.inicializar();
   }

   /**
    * Inicializa la página de estadísticas
    */
   async inicializar() {
       try {
           await this.verificarPermisos();
           await this.cargarDatos();
           this.configurarInterfaz();
           this.configurarEventos();
           this.iniciarActualizacionAutomatica();
           
           Utilidades.mostrarNotificacion('Estadísticas cargadas correctamente', 'success');
       } catch (error) {
           console.error('Error al inicializar estadísticas:', error);
           Utilidades.mostrarNotificacion('Error al cargar estadísticas', 'error');
       }
   }

   /**
    * Verifica permisos de verificador
    */
   async verificarPermisos() {
       if (!this.usuario || !this.usuario.rolesActivos.includes('verificador')) {
           window.location.href = '/acceso-denegado.html';
           throw new Error('Sin permisos de verificador');
       }
   }

   /**
    * Obtiene fecha de inicio por defecto (último mes)
    */
   obtenerFechaInicioPorDefecto() {
       const fecha = new Date();
       fecha.setMonth(fecha.getMonth() - 1);
       return fecha.toISOString().split('T')[0];
   }

   /**
    * Carga todos los datos estadísticos
    */
   async cargarDatos() {
       try {
           Utilidades.mostrarCargando('#contenedor-estadisticas');
           
           const [
               estadisticasPersonales,
               estadisticasComparativas,
               rendimientoTemporal,
               distribucionTipos,
               tiemposVerificacion,
               satisfaccionDocentes,
               resumenMensual,
               ranking
           ] = await Promise.all([
               this.servicioReportes.obtenerEstadisticasPersonales(this.usuario.id, this.rangoFechas),
               this.servicioReportes.obtenerEstadisticasComparativas(this.usuario.id),
               this.servicioReportes.obtenerRendimientoTemporal(this.usuario.id, this.rangoFechas),
               this.servicioReportes.obtenerDistribucionTiposObservacion(this.usuario.id),
               this.servicioReportes.obtenerTiemposVerificacion(this.usuario.id),
               this.servicioReportes.obtenerSatisfaccionDocentes(this.usuario.id),
               this.servicioReportes.obtenerResumenMensual(this.usuario.id),
               this.servicioReportes.obtenerRankingVerificadores()
           ]);
           
           this.estadisticasPersonales = estadisticasPersonales;
           this.estadisticasComparativas = estadisticasComparativas;
           this.rendimientoTemporal = rendimientoTemporal;
           this.distribucionTipos = distribucionTipos;
           this.tiemposVerificacion = tiemposVerificacion;
           this.satisfaccionDocentes = satisfaccionDocentes;
           this.resumenMensual = resumenMensual;
           this.ranking = ranking;
           
       } catch (error) {
           console.error('Error al cargar datos estadísticos:', error);
           throw error;
       } finally {
           Utilidades.ocultarCargando('#contenedor-estadisticas');
       }
   }

   /**
    * Configura la interfaz de estadísticas
    */
   configurarInterfaz() {
       this.crearSelectorFechas();
       this.mostrarResumenGeneral();
       this.mostrarMetricasPrincipales();
       this.crearGraficos();
       this.mostrarComparativas();
       this.mostrarRanking();
       this.crearPanelAccionesRapidas();
   }

   /**
    * Crea el selector de rango de fechas
    */
   crearSelectorFechas() {
       const selectorHtml = `
           <div class="card mb-4">
               <div class="card-body">
                   <div class="row align-items-center">
                       <div class="col-md-8">
                           <div class="row">
                               <div class="col-md-3">
                                   <label class="form-label">Fecha Inicio</label>
                                   <input type="date" class="form-control" id="fecha-inicio" 
                                          value="${this.rangoFechas.inicio}">
                               </div>
                               <div class="col-md-3">
                                   <label class="form-label">Fecha Fin</label>
                                   <input type="date" class="form-control" id="fecha-fin" 
                                          value="${this.rangoFechas.fin}">
                               </div>
                               <div class="col-md-3">
                                   <label class="form-label">Período Rápido</label>
                                   <select class="form-select" id="periodo-rapido">
                                       <option value="">Personalizado</option>
                                       <option value="7">Últimos 7 días</option>
                                       <option value="30" selected>Último mes</option>
                                       <option value="90">Últimos 3 meses</option>
                                       <option value="365">Último año</option>
                                   </select>
                               </div>
                               <div class="col-md-3">
                                   <label class="form-label">&nbsp;</label>
                                   <div class="d-grid">
                                       <button class="btn btn-primary" id="btn-actualizar-fechas">
                                           <i class="fas fa-sync me-1"></i>
                                           Actualizar
                                       </button>
                                   </div>
                               </div>
                           </div>
                       </div>
                       <div class="col-md-4 text-end">
                           <div class="btn-group">
                               <button class="btn btn-outline-primary" id="btn-exportar-estadisticas">
                                   <i class="fas fa-download me-1"></i>
                                   Exportar
                               </button>
                               <button class="btn btn-outline-secondary" id="btn-configurar-alertas">
                                   <i class="fas fa-bell me-1"></i>
                                   Alertas
                               </button>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('selector-fechas').innerHTML = selectorHtml;
   }

   /**
    * Muestra resumen general de estadísticas
    */
   mostrarResumenGeneral() {
       const stats = this.estadisticasPersonales;
       
       const resumenHtml = `
           <div class="card bg-gradient-primary text-white mb-4">
               <div class="card-body">
                   <div class="row align-items-center">
                       <div class="col">
                           <h5 class="text-white mb-2">Resumen de Verificación</h5>
                           <p class="text-white-75 mb-0">
                               Período: ${Utilidades.formatearFecha(this.rangoFechas.inicio)} - 
                               ${Utilidades.formatearFecha(this.rangoFechas.fin)}
                           </p>
                       </div>
                       <div class="col-auto">
                           <div class="text-center">
                               <div class="h2 text-white mb-0">${stats.documentosVerificados || 0}</div>
                               <small class="text-white-75">Documentos Verificados</small>
                           </div>
                       </div>
                   </div>
                   
                   <div class="row mt-3">
                       <div class="col-md-3">
                           <div class="d-flex align-items-center">
                               <i class="fas fa-check-circle fa-2x me-3"></i>
                               <div>
                                   <div class="h4 text-white mb-0">${stats.documentosAprobados || 0}</div>
                                   <small class="text-white-75">Aprobados</small>
                               </div>
                           </div>
                       </div>
                       <div class="col-md-3">
                           <div class="d-flex align-items-center">
                               <i class="fas fa-exclamation-triangle fa-2x me-3"></i>
                               <div>
                                   <div class="h4 text-white mb-0">${stats.documentosConObservaciones || 0}</div>
                                   <small class="text-white-75">Con Observaciones</small>
                               </div>
                           </div>
                       </div>
                       <div class="col-md-3">
                           <div class="d-flex align-items-center">
                               <i class="fas fa-clock fa-2x me-3"></i>
                               <div>
                                   <div class="h4 text-white mb-0">${stats.tiempoPromedioHoras || 0}h</div>
                                   <small class="text-white-75">Tiempo Promedio</small>
                               </div>
                           </div>
                       </div>
                       <div class="col-md-3">
                           <div class="d-flex align-items-center">
                               <i class="fas fa-users fa-2x me-3"></i>
                               <div>
                                   <div class="h4 text-white mb-0">${stats.docentesAtendidos || 0}</div>
                                   <small class="text-white-75">Docentes Atendidos</small>
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
    * Muestra métricas principales con indicadores
    */
   mostrarMetricasPrincipales() {
       const stats = this.estadisticasPersonales;
       const comp = this.estadisticasComparativas;
       
       const metricas = [
           {
               titulo: 'Productividad Diaria',
               valor: stats.productividadDiaria || 0,
               unidad: 'docs/día',
               icono: 'fas fa-chart-line',
               color: 'success',
               progreso: Math.min(100, (stats.productividadDiaria / 10) * 100),
               comparacion: comp.productividadDiaria,
               meta: 8
           },
           {
               titulo: 'Calidad de Verificación',
               valor: stats.calidadVerificacion || 0,
               unidad: '%',
               icono: 'fas fa-star',
               color: 'info',
               progreso: stats.calidadVerificacion || 0,
               comparacion: comp.calidadVerificacion,
               meta: 90
           },
           {
               titulo: 'Tiempo Promedio',
               valor: stats.tiempoPromedioMinutos || 0,
               unidad: 'min',
               icono: 'fas fa-stopwatch',
               color: 'warning',
               progreso: Math.max(0, 100 - ((stats.tiempoPromedioMinutos - 30) / 60) * 100),
               comparacion: comp.tiempoPromedio,
               meta: 45
           },
           {
               titulo: 'Satisfacción Docentes',
               valor: stats.satisfaccionDocentes || 0,
               unidad: '/5',
               icono: 'fas fa-heart',
               color: 'danger',
               progreso: (stats.satisfaccionDocentes / 5) * 100,
               comparacion: comp.satisfaccionDocentes,
               meta: 4.5
           }
       ];
       
       const metricasHtml = metricas.map(metrica => {
           const tendencia = metrica.comparacion > 0 ? 'up' : metrica.comparacion < 0 ? 'down' : 'stable';
           const tendenciaClass = tendencia === 'up' ? 'success' : tendencia === 'down' ? 'danger' : 'secondary';
           const tendenciaIcon = tendencia === 'up' ? 'arrow-up' : tendencia === 'down' ? 'arrow-down' : 'minus';
           
           return `
               <div class="col-xl-3 col-md-6 mb-4">
                   <div class="card border-left-${metrica.color} shadow h-100 py-2">
                       <div class="card-body">
                           <div class="row no-gutters align-items-center">
                               <div class="col mr-2">
                                   <div class="text-xs font-weight-bold text-${metrica.color} text-uppercase mb-1">
                                       ${metrica.titulo}
                                   </div>
                                   <div class="row no-gutters align-items-center">
                                       <div class="col-auto">
                                           <div class="h5 mb-0 mr-3 font-weight-bold text-gray-800">
                                               ${metrica.valor}${metrica.unidad}
                                           </div>
                                       </div>
                                       <div class="col">
                                           <div class="progress progress-sm mr-2">
                                               <div class="progress-bar bg-${metrica.color}" 
                                                    style="width: ${metrica.progreso}%"></div>
                                           </div>
                                       </div>
                                   </div>
                                   <div class="mt-2">
                                       <span class="text-${tendenciaClass} small">
                                           <i class="fas fa-${tendenciaIcon} me-1"></i>
                                           ${Math.abs(metrica.comparacion || 0)}% vs promedio
                                       </span>
                                   </div>
                                   <div class="text-xs text-muted">
                                       Meta: ${metrica.meta}${metrica.unidad}
                                   </div>
                               </div>
                               <div class="col-auto">
                                   <i class="${metrica.icono} fa-2x text-gray-300"></i>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           `;
       }).join('');
       
       document.getElementById('metricas-principales').innerHTML = metricasHtml;
   }

   /**
    * Crea todos los gráficos estadísticos
    */
   crearGraficos() {
       this.crearGraficoRendimientoTemporal();
       this.crearGraficoDistribucionTipos();
       this.crearGraficoTiemposVerificacion();
       this.crearGraficoSatisfaccionTemporal();
   }

   /**
    * Crea gráfico de rendimiento temporal
    */
   async crearGraficoRendimientoTemporal() {
       const ctx = document.getElementById('grafico-rendimiento-temporal')?.getContext('2d');
       if (!ctx) return;
       
       const datos = this.rendimientoTemporal;
       
       this.graficos.rendimientoTemporal = new Chart(ctx, {
           type: 'line',
           data: {
               labels: datos.etiquetas,
               datasets: [
                   {
                       label: 'Documentos Verificados',
                       data: datos.documentosVerificados,
                       borderColor: 'rgb(54, 162, 235)',
                       backgroundColor: 'rgba(54, 162, 235, 0.1)',
                       tension: 0.1,
                       fill: true
                   },
                   {
                       label: 'Observaciones Creadas',
                       data: datos.observacionesCreadas,
                       borderColor: 'rgb(255, 99, 132)',
                       backgroundColor: 'rgba(255, 99, 132, 0.1)',
                       tension: 0.1,
                       fill: true
                   }
               ]
           },
           options: {
               responsive: true,
               maintainAspectRatio: false,
               interaction: {
                   mode: 'index',
                   intersect: false,
               },
               scales: {
                   x: {
                       display: true,
                       title: {
                           display: true,
                           text: 'Fecha'
                       }
                   },
                   y: {
                       display: true,
                       title: {
                           display: true,
                           text: 'Cantidad'
                       },
                       beginAtZero: true
                   }
               },
               plugins: {
                   title: {
                       display: true,
                       text: 'Rendimiento Temporal'
                   },
                   legend: {
                       position: 'top',
                   }
               }
           }
       });
   }

   /**
    * Crea gráfico de distribución de tipos de observación
    */
   async crearGraficoDistribucionTipos() {
       const ctx = document.getElementById('grafico-distribucion-tipos')?.getContext('2d');
       if (!ctx) return;
       
       const datos = this.distribucionTipos;
       
       this.graficos.distribucionTipos = new Chart(ctx, {
           type: 'doughnut',
           data: {
               labels: datos.etiquetas,
               datasets: [{
                   data: datos.valores,
                   backgroundColor: [
                       'rgba(255, 99, 132, 0.8)',
                       'rgba(54, 162, 235, 0.8)',
                       'rgba(255, 205, 86, 0.8)',
                       'rgba(75, 192, 192, 0.8)',
                       'rgba(153, 102, 255, 0.8)'
                   ],
                   borderWidth: 2,
                   borderColor: '#fff'
               }]
           },
           options: {
               responsive: true,
               maintainAspectRatio: false,
               plugins: {
                   title: {
                       display: true,
                       text: 'Distribución de Tipos de Observación'
                   },
                   legend: {
                       position: 'bottom'
                   },
                   tooltip: {
                       callbacks: {
                           label: function(context) {
                               const total = context.dataset.data.reduce((a, b) => a + b, 0);
                               const percentage = ((context.parsed / total) * 100).toFixed(1);
                               return `${context.label}: ${context.parsed} (${percentage}%)`;
                           }
                       }
                   }
               }
           }
       });
   }

   /**
    * Crea gráfico de tiempos de verificación
    */
   async crearGraficoTiemposVerificacion() {
       const ctx = document.getElementById('grafico-tiempos-verificacion')?.getContext('2d');
       if (!ctx) return;
       
       const datos = this.tiemposVerificacion;
       
       this.graficos.tiemposVerificacion = new Chart(ctx, {
           type: 'bar',
           data: {
               labels: datos.rangos,
               datasets: [{
                   label: 'Documentos',
                   data: datos.cantidades,
                   backgroundColor: 'rgba(75, 192, 192, 0.8)',
                   borderColor: 'rgb(75, 192, 192)',
                   borderWidth: 1
               }]
           },
           options: {
               responsive: true,
               maintainAspectRatio: false,
               scales: {
                   y: {
                       beginAtZero: true,
                       title: {
                           display: true,
                           text: 'Cantidad de Documentos'
                       }
                   },
                   x: {
                       title: {
                           display: true,
                           text: 'Tiempo de Verificación (minutos)'
                       }
                   }
               },
               plugins: {
                   title: {
                       display: true,
                       text: 'Distribución de Tiempos de Verificación'
                   },
                   legend: {
                       display: false
                   }
               }
           }
       });
   }

   /**
    * Crea gráfico de satisfacción temporal
    */
   async crearGraficoSatisfaccionTemporal() {
       const ctx = document.getElementById('grafico-satisfaccion')?.getContext('2d');
       if (!ctx) return;
       
       const datos = this.satisfaccionDocentes;
       
       this.graficos.satisfaccion = new Chart(ctx, {
           type: 'line',
           data: {
               labels: datos.etiquetas,
               datasets: [{
                   label: 'Satisfacción Promedio',
                   data: datos.valores,
                   borderColor: 'rgb(255, 99, 132)',
                   backgroundColor: 'rgba(255, 99, 132, 0.1)',
                   tension: 0.1,
                   fill: true
               }]
           },
           options: {
               responsive: true,
               maintainAspectRatio: false,
               scales: {
                   y: {
                       min: 1,
                       max: 5,
                       title: {
                           display: true,
                           text: 'Puntuación (1-5)'
                       }
                   }
               },
               plugins: {
                   title: {
                       display: true,
                       text: 'Evolución de Satisfacción de Docentes'
                   },
                   legend: {
                       display: false
                   }
               }
           }
       });
   }

   /**
    * Muestra comparativas con otros verificadores
    */
   mostrarComparativas() {
       const comp = this.estadisticasComparativas;
       
       const comparativasHtml = `
           <div class="card">
               <div class="card-header">
                   <h6 class="m-0">
                       <i class="fas fa-balance-scale me-2"></i>
                       Comparativa con Otros Verificadores
                   </h6>
               </div>
               <div class="card-body">
                   <div class="row">
                       <div class="col-md-6">
                           <div class="mb-3">
                               <div class="d-flex justify-content-between mb-1">
                                   <span class="small">Productividad vs Promedio</span>
                                   <span class="small">${comp.productividadVsPromedio || 0}%</span>
                               </div>
                               <div class="progress">
                                   <div class="progress-bar ${comp.productividadVsPromedio >= 0 ? 'bg-success' : 'bg-danger'}" 
                                        style="width: ${Math.abs(comp.productividadVsPromedio || 0)}%"></div>
                               </div>
                           </div>
                           
                           <div class="mb-3">
                               <div class="d-flex justify-content-between mb-1">
                                   <span class="small">Calidad vs Promedio</span>
                                   <span class="small">${comp.calidadVsPromedio || 0}%</span>
                               </div>
                               <div class="progress">
                                   <div class="progress-bar ${comp.calidadVsPromedio >= 0 ? 'bg-success' : 'bg-danger'}" 
                                        style="width: ${Math.abs(comp.calidadVsPromedio || 0)}%"></div>
                               </div>
                           </div>
                       </div>
                       
                       <div class="col-md-6">
                           <div class="mb-3">
                               <div class="d-flex justify-content-between mb-1">
                                   <span class="small">Velocidad vs Promedio</span>
                                   <span class="small">${comp.velocidadVsPromedio || 0}%</span>
                               </div>
                               <div class="progress">
                                   <div class="progress-bar ${comp.velocidadVsPromedio >= 0 ? 'bg-success' : 'bg-danger'}" 
                                        style="width: ${Math.abs(comp.velocidadVsPromedio || 0)}%"></div>
                               </div>
                           </div>
                           
                           <div class="mb-3">
                               <div class="d-flex justify-content-between mb-1">
                                   <span class="small">Satisfacción vs Promedio</span>
                                   <span class="small">${comp.satisfaccionVsPromedio || 0}%</span>
                               </div>
                               <div class="progress">
                                   <div class="progress-bar ${comp.satisfaccionVsPromedio >= 0 ? 'bg-success' : 'bg-danger'}" 
                                        style="width: ${Math.abs(comp.satisfaccionVsPromedio || 0)}%"></div>
                               </div>
                           </div>
                       </div>
                   </div>
                   
                   <div class="alert alert-info">
                       <i class="fas fa-info-circle me-2"></i>
                       <strong>Interpretación:</strong> Los valores positivos indican rendimiento superior al promedio, 
                       los negativos indican áreas de mejora.
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('comparativas').innerHTML = comparativasHtml;
   }

   /**
    * Muestra ranking entre verificadores
    */
   mostrarRanking() {
       const rankingHtml = `
           <div class="card">
               <div class="card-header">
                   <h6 class="m-0">
                       <i class="fas fa-trophy me-2"></i>
                       Ranking de Verificadores
                   </h6>
               </div>
               <div class="card-body">
                   <div class="table-responsive">
                       <table class="table table-sm">
                           <thead>
                               <tr>
                                   <th>Posición</th>
                                   <th>Verificador</th>
                                   <th>Documentos</th>
                                   <th>Calidad</th>
                                   <th>Satisfacción</th>
                                   <th>Puntuación</th>
                               </tr>
                           </thead>
                           <tbody>
                               ${this.ranking.map((item, index) => {
                                   const esUsuarioActual = item.id === this.usuario.id;
                                   const medalla = index < 3 ? ['🥇', '🥈', '🥉'][index] : '';
                                   
                                   return `
                                       <tr class="${esUsuarioActual ? 'table-primary' : ''}">
                                           <td>
                                               ${medalla} 
                                               <strong>#${index + 1}</strong>
                                               ${esUsuarioActual ? '<span class="badge badge-primary badge-sm ms-1">TÚ</span>' : ''}
                                           </td>
                                           <td>
                                               <div class="d-flex align-items-center">
                                                   <img src="${item.avatar || '/assets/imagenes/avatares/default.png'}" 
                                                        class="avatar avatar-xs rounded-circle me-2" alt="Avatar">
                                                   ${item.nombres} ${item.apellidos}
                                               </div>
                                           </td>
                                           <td>${item.documentosVerificados}</td>
                                           <td>
                                               <span class="badge badge-${item.calidad >= 90 ? 'success' : item.calidad >= 70 ? 'warning' : 'danger'}">
                                                   ${item.calidad}%
                                               </span>
                                           </td>
                                           <td>
                                               <div class="d-flex align-items-center">
                                                   <div class="me-2">${item.satisfaccion.toFixed(1)}</div>
                                                   <div class="stars">
                                                       ${Array.from({length: 5}, (_, i) => 
                                                           `<i class="fas fa-star ${i < Math.round(item.satisfaccion) ? 'text-warning' : 'text-muted'}"></i>`
                                                       ).join('')}
                                                   </div>
                                               </div>
                                           </td>
                                           <td>
                                               <strong>${item.puntuacionTotal}</strong>
                                           </td>
                                       </tr>
                                   `;
                               }).join('')}
                           </tbody>
                       </table>
                   </div>
                   
                   <div class="mt-3">
                       <small class="text-muted">
                           <i class="fas fa-info-circle me-1"></i>
                           La puntuación se calcula considerando productividad, calidad, velocidad y satisfacción.
                       </small>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('ranking-verificadores').innerHTML = rankingHtml;
   }

   /**
    * Crea panel de acciones rápidas
    */
   crearPanelAccionesRapidas() {
       const accionesHtml = `
           <div class="card">
               <div class="card-header">
                   <h6 class="m-0">
                       <i class="fas fa-bolt me-2"></i>
                       Acciones Rápidas
                   </h6>
               </div>
               <div class="card-body">
                   <div class="row">
                       <div class="col-md-6 mb-2">
                           <button class="btn btn-outline-primary btn-sm w-100" id="btn-generar-reporte-personal">
                               <i class="fas fa-file-pdf me-1"></i>
                               Generar Reporte Personal
                           </button>
                       </div>
                       <div class="col-md-6 mb-2">
                           <button class="btn btn-outline-info btn-sm w-100" id="btn-comparar-periodo">
                               <i class="fas fa-chart-line me-1"></i>
                               Comparar con Período Anterior
                           </button>
                       </div>
                       <div class="col-md-6 mb-2">
                           <button class="btn btn-outline-success btn-sm w-100" id="btn-establecer-metas">
                               <i class="fas fa-target me-1"></i>
                               Establecer Metas
                           </button>
                       </div>
                       <div class="col-md-6 mb-2">
                           <button class="btn btn-outline-warning btn-sm w-100" id="btn-configurar-alertas-rendimiento">
                               <i class="fas fa-bell me-1"></i>
                               Configurar Alertas
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('acciones-rapidas').innerHTML = accionesHtml;
   }

   /**
    * Configura eventos de la interfaz
    */
   configurarEventos() {
       // Selector de fechas
       document.getElementById('periodo-rapido').addEventListener('change', (e) => {
           this.aplicarPeriodoRapido(e.target.value);
       });
       
       document.getElementById('btn-actualizar-fechas').addEventListener('click', () => {
           this.actualizarRangoFechas();
       });
       
       // Botones de acción
       document.getElementById('btn-exportar-estadisticas').addEventListener('click', () => {
           this.exportarEstadisticas();
       });
       
       document.getElementById('btn-configurar-alertas').addEventListener('click', () => {
           this.configurarAlertas();
       });
       
       document.getElementById('btn-generar-reporte-personal').addEventListener('click', () => {
           this.generarReportePersonal();
       });
       
       document.getElementById('btn-comparar-periodo').addEventListener('click', () => {
           this.compararConPeriodoAnterior();
       });
       
       document.getElementById('btn-establecer-metas').addEventListener('click', () => {
           this.establecerMetas();
       });
       
       document.getElementById('btn-configurar-alertas-rendimiento').addEventListener('click', () => {
           this.configurarAlertasRendimiento();
       });
   }

   /**
    * Aplica período rápido seleccionado
    */
   aplicarPeriodoRapido(dias) {
       if (!dias) return;
       
       const fechaFin = new Date();
       const fechaInicio = new Date();
       fechaInicio.setDate(fechaInicio.getDate() - parseInt(dias));
       
       document.getElementById('fecha-inicio').value = fechaInicio.toISOString().split('T')[0];
       document.getElementById('fecha-fin').value = fechaFin.toISOString().split('T')[0];
       
       this.actualizarRangoFechas();
   }

   /**
    * Actualiza el rango de fechas y recarga datos
    */
   async actualizarRangoFechas() {
       const fechaInicio = document.getElementById('fecha-inicio').value;
       const fechaFin = document.getElementById('fecha-fin').value;
       
       if (!fechaInicio || !fechaFin) {
           Utilidades.mostrarNotificacion('Seleccione ambas fechas', 'warning');
           return;
       }
       
       if (new Date(fechaInicio) > new Date(fechaFin)) {
           Utilidades.mostrarNotificacion('La fecha de inicio debe ser anterior a la fecha fin', 'warning');
           return;
       }
       
       this.rangoFechas = { inicio: fechaInicio, fin: fechaFin };
       
       // Recargar datos con nuevo rango
       await this.cargarDatos();
       
       // Actualizar interfaz
       this.mostrarResumenGeneral();
       this.mostrarMetricasPrincipales();
       
       // Recrear gráficos
       this.destruirGraficos();
       this.crearGraficos();
       
       Utilidades.mostrarNotificacion('Estadísticas actualizadas', 'success');
   }

   /**
    * Exporta estadísticas a PDF
    */
   async exportarEstadisticas() {
       try {
           Utilidades.mostrarCargando('#btn-exportar-estadisticas');
           
           const configuracion = {
               verificadorId: this.usuario.id,
               rangoFechas: this.rangoFechas,
               incluirGraficos: true,
               formato: 'pdf'
           };
           
           const resultado = await this.servicioReportes.exportarEstadisticasVerificador(configuracion);
           
           if (resultado.exito) {
               // Descargar archivo
               window.open(resultado.urlDescarga, '_blank');
               Utilidades.mostrarNotificacion('Reporte exportado exitosamente', 'success');
           }
           
       } catch (error) {
           console.error('Error al exportar estadísticas:', error);
           Utilidades.mostrarNotificacion('Error al exportar estadísticas', 'error');
       } finally {
           Utilidades.ocultarCargando('#btn-exportar-estadisticas');
       }
   }

   /**
    * Genera reporte personal detallado
    */
   async generarReportePersonal() {
       try {
           const modal = new SistemaModales();
           await modal.mostrarFormulario('Generar Reporte Personal', {
               formato: { 
                   type: 'select', 
                   label: 'Formato', 
                   options: [
                       { value: 'pdf', text: 'PDF' },
                       { value: 'excel', text: 'Excel' }
                   ],
                   required: true 
               },
               incluirComparativas: { 
                   type: 'checkbox', 
                   label: 'Incluir comparativas con otros verificadores',
                   checked: true
               },
               incluirRecomendaciones: { 
                   type: 'checkbox', 
                   label: 'Incluir recomendaciones de mejora',
                   checked: true
               }
           }, async (datos) => {
               const configuracion = {
                   ...datos,
                   verificadorId: this.usuario.id,
                   rangoFechas: this.rangoFechas
               };
               
               const resultado = await this.servicioReportes.generarReportePersonalVerificador(configuracion);
               
               if (resultado.exito) {
                   window.open(resultado.urlDescarga, '_blank');
                   Utilidades.mostrarNotificacion('Reporte personal generado', 'success');
               }
           });
           
       } catch (error) {
           console.error('Error al generar reporte personal:', error);
           Utilidades.mostrarNotificacion('Error al generar reporte', 'error');
       }
   }

   /**
    * Inicia actualización automática de datos
    */
   iniciarActualizacionAutomatica() {
       // Actualizar métricas en tiempo real cada 5 minutos
       this.intervalosActualizacion.push(
           setInterval(async () => {
               try {
                   const estadisticas = await this.servicioReportes.obtenerEstadisticasPersonales(
                       this.usuario.id, 
                       this.rangoFechas
                   );
                   this.estadisticasPersonales = estadisticas;
                   this.mostrarResumenGeneral();
               } catch (error) {
                   console.error('Error en actualización automática:', error);
               }
           }, 5 * 60 * 1000)
       );
   }

   /**
    * Destruye gráficos existentes
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
       // Limpiar intervalos
       this.intervalosActualizacion.forEach(intervalo => {
           clearInterval(intervalo);
       });
       
       // Destruir gráficos
       this.destruirGraficos();
       
       this.intervalosActualizacion = [];
   }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
   window.estadisticasVerificador = new EstadisticasVerificador();
});

// Limpiar recursos al salir de la página
window.addEventListener('beforeunload', () => {
   if (window.estadisticasVerificador) {
       window.estadisticasVerificador.destruir();
   }
});

// Exportar para uso global
window.EstadisticasVerificador = EstadisticasVerificador;