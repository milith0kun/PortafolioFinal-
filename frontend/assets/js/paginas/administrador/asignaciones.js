/**
 * 📋 GESTIÓN DE ASIGNACIONES
 * Sistema Portafolio Docente UNSAAC
 * 
 * Página para gestionar asignaciones docente-asignatura y verificador-docente
 * Incluye asignación automática, manual y gestión de cargas académicas
 */

class GestionAsignaciones {
   constructor() {
       this.servicioUsuarios = new ServicioUsuarios();
       this.servicioAsignaturas = new ServicioAsignaturas();
       this.servicioCiclos = new ServicioCiclos();
       this.servicioRoles = new ServicioRoles();
       this.servicioNotificaciones = new ServicioNotificaciones();
       
       this.asignacionesActuales = [];
       this.cicloActual = null;
       this.modoEdicion = false;
       
       this.inicializar();
   }

   /**
    * Inicializa la página de gestión de asignaciones
    */
   async inicializar() {
       try {
           await this.verificarPermisos();
           await this.cargarDatos();
           this.configurarInterfaz();
           this.configurarEventos();
           
           Utilidades.mostrarNotificacion('Gestión de asignaciones cargada', 'success');
       } catch (error) {
           console.error('Error al inicializar gestión de asignaciones:', error);
           Utilidades.mostrarNotificacion('Error al cargar la página', 'error');
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
    * Carga datos iniciales
    */
   async cargarDatos() {
       try {
           Utilidades.mostrarCargando('#contenedor-asignaciones');
           
           const [
               cicloActual,
               asignacionesDocente,
               asignacionesVerificador,
               docentes,
               verificadores,
               asignaturas,
               estadisticas
           ] = await Promise.all([
               this.servicioCiclos.obtenerCicloActual(),
               this.servicioAsignaturas.obtenerAsignacionesDocentes(),
               this.servicioUsuarios.obtenerAsignacionesVerificadores(),
               this.servicioUsuarios.obtenerPorRol('docente'),
               this.servicioUsuarios.obtenerPorRol('verificador'),
               this.servicioAsignaturas.obtenerTodas(),
               this.servicioAsignaturas.obtenerEstadisticasAsignaciones()
           ]);
           
           this.cicloActual = cicloActual;
           this.asignacionesDocente = asignacionesDocente;
           this.asignacionesVerificador = asignacionesVerificador;
           this.docentes = docentes;
           this.verificadores = verificadores;
           this.asignaturas = asignaturas;
           this.estadisticas = estadisticas;
           
       } catch (error) {
           console.error('Error al cargar datos:', error);
           throw error;
       } finally {
           Utilidades.ocultarCargando('#contenedor-asignaciones');
       }
   }

   /**
    * Configura la interfaz inicial
    */
   configurarInterfaz() {
       this.mostrarInformacionCiclo();
       this.mostrarEstadisticasAsignaciones();
       this.configurarTabs();
       this.mostrarAsignacionesDocentes();
       this.mostrarAsignacionesVerificadores();
       this.configurarPanelAsignacionRapida();
   }

   /**
    * Muestra información del ciclo actual
    */
   mostrarInformacionCiclo() {
       const contenedor = document.getElementById('info-ciclo-actual');
       
       if (!this.cicloActual) {
           contenedor.innerHTML = `
               <div class="alert alert-warning">
                   <i class="fas fa-exclamation-triangle me-2"></i>
                   <strong>No hay ciclo académico activo</strong>
                   <p class="mb-0">Debes activar un ciclo académico para gestionar asignaciones.</p>
                   <a href="/administrador/ciclos-academicos.html" class="btn btn-warning btn-sm mt-2">
                       Gestionar Ciclos
                   </a>
               </div>
           `;
           return;
       }
       
       const progresoCiclo = this.calcularProgresoCiclo();
       
       contenedor.innerHTML = `
           <div class="card bg-primary text-white">
               <div class="card-body">
                   <div class="row align-items-center">
                       <div class="col">
                           <h5 class="text-white mb-1">${this.cicloActual.nombre}</h5>
                           <p class="text-white-75 mb-0">${this.cicloActual.descripcion}</p>
                           <div class="mt-2">
                               <small class="text-white-75">
                                   ${Utilidades.formatearFecha(this.cicloActual.fechaInicio)} - 
                                   ${Utilidades.formatearFecha(this.cicloActual.fechaFin)}
                               </small>
                           </div>
                       </div>
                       <div class="col-auto">
                           <div class="text-center">
                               <div class="h3 text-white mb-0">${progresoCiclo}%</div>
                               <small class="text-white-75">Progreso</small>
                           </div>
                       </div>
                   </div>
                   <div class="progress mt-3" style="height: 5px;">
                       <div class="progress-bar bg-light" style="width: ${progresoCiclo}%"></div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * Calcula el progreso del ciclo actual
    */
   calcularProgresoCiclo() {
       if (!this.cicloActual) return 0;
       
       const fechaInicio = new Date(this.cicloActual.fechaInicio);
       const fechaFin = new Date(this.cicloActual.fechaFin);
       const fechaActual = new Date();
       
       const duracionTotal = fechaFin - fechaInicio;
       const tiempoTranscurrido = fechaActual - fechaInicio;
       
       const progreso = Math.max(0, Math.min(100, (tiempoTranscurrido / duracionTotal) * 100));
       return Math.round(progreso);
   }

   /**
    * Muestra estadísticas de asignaciones
    */
   mostrarEstadisticasAsignaciones() {
       const stats = this.estadisticas;
       
       const tarjetas = [
           {
               titulo: 'Docentes Asignados',
               valor: stats.docentesAsignados || 0,
               total: this.docentes.length,
               icono: 'fas fa-chalkboard-teacher',
               color: 'primary',
               porcentaje: this.calcularPorcentaje(stats.docentesAsignados, this.docentes.length)
           },
           {
               titulo: 'Asignaturas Cubiertas',
               valor: stats.asignaturasCubiertas || 0,
               total: this.asignaturas.length,
               icono: 'fas fa-book',
               color: 'success',
               porcentaje: this.calcularPorcentaje(stats.asignaturasCubiertas, this.asignaturas.length)
           },
           {
               titulo: 'Verificadores Activos',
               valor: stats.verificadoresActivos || 0,
               total: this.verificadores.length,
               icono: 'fas fa-user-check',
               color: 'info',
               porcentaje: this.calcularPorcentaje(stats.verificadoresActivos, this.verificadores.length)
           },
           {
               titulo: 'Portafolios Generados',
               valor: stats.portafoliosGenerados || 0,
               icono: 'fas fa-folder',
               color: 'warning'
           }
       ];
       
       const contenedor = document.getElementById('estadisticas-asignaciones');
       contenedor.innerHTML = tarjetas.map(tarjeta => `
           <div class="col-xl-3 col-md-6 mb-4">
               <div class="card border-left-${tarjeta.color} shadow h-100 py-2">
                   <div class="card-body">
                       <div class="row no-gutters align-items-center">
                           <div class="col mr-2">
                               <div class="text-xs font-weight-bold text-${tarjeta.color} text-uppercase mb-1">
                                   ${tarjeta.titulo}
                               </div>
                               <div class="h5 mb-0 font-weight-bold text-gray-800">
                                   ${tarjeta.valor}${tarjeta.total ? ` / ${tarjeta.total}` : ''}
                               </div>
                               ${tarjeta.porcentaje !== undefined ? `
                                   <div class="row no-gutters align-items-center mt-2">
                                       <div class="col-auto">
                                           <div class="text-xs font-weight-bold text-${tarjeta.color} mr-3">
                                               ${tarjeta.porcentaje}%
                                           </div>
                                       </div>
                                       <div class="col">
                                           <div class="progress progress-sm mr-2">
                                               <div class="progress-bar bg-${tarjeta.color}" 
                                                    style="width: ${tarjeta.porcentaje}%"></div>
                                           </div>
                                       </div>
                                   </div>
                               ` : ''}
                           </div>
                           <div class="col-auto">
                               <i class="${tarjeta.icono} fa-2x text-gray-300"></i>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `).join('');
   }

   /**
    * Calcula porcentaje
    */
   calcularPorcentaje(valor, total) {
       if (!total || total === 0) return 0;
       return Math.round((valor / total) * 100);
   }

   /**
    * Configura las pestañas principales
    */
   configurarTabs() {
       const tabsHtml = `
           <ul class="nav nav-tabs" id="asignacionesTabs" role="tablist">
               <li class="nav-item" role="presentation">
                   <button class="nav-link active" id="docentes-tab" data-bs-toggle="tab" 
                           data-bs-target="#docentes-content" type="button" role="tab">
                       <i class="fas fa-chalkboard-teacher me-1"></i>
                       Docentes - Asignaturas
                   </button>
               </li>
               <li class="nav-item" role="presentation">
                   <button class="nav-link" id="verificadores-tab" data-bs-toggle="tab" 
                           data-bs-target="#verificadores-content" type="button" role="tab">
                       <i class="fas fa-user-check me-1"></i>
                       Verificadores - Docentes
                   </button>
               </li>
               <li class="nav-item" role="presentation">
                   <button class="nav-link" id="automatica-tab" data-bs-toggle="tab" 
                           data-bs-target="#automatica-content" type="button" role="tab">
                       <i class="fas fa-magic me-1"></i>
                       Asignación Automática
                   </button>
               </li>
               <li class="nav-item" role="presentation">
                   <button class="nav-link" id="historial-tab" data-bs-toggle="tab" 
                           data-bs-target="#historial-content" type="button" role="tab">
                       <i class="fas fa-history me-1"></i>
                       Historial
                   </button>
               </li>
           </ul>
           
           <div class="tab-content" id="asignacionesTabContent">
               <div class="tab-pane fade show active" id="docentes-content" role="tabpanel">
                   <div id="contenido-docentes-asignaturas"></div>
               </div>
               <div class="tab-pane fade" id="verificadores-content" role="tabpanel">
                   <div id="contenido-verificadores-docentes"></div>
               </div>
               <div class="tab-pane fade" id="automatica-content" role="tabpanel">
                   <div id="contenido-asignacion-automatica"></div>
               </div>
               <div class="tab-pane fade" id="historial-content" role="tabpanel">
                   <div id="contenido-historial"></div>
               </div>
           </div>
       `;
       
       document.getElementById('tabs-asignaciones').innerHTML = tabsHtml;
   }

   /**
    * Muestra asignaciones docente-asignatura
    */
   mostrarAsignacionesDocentes() {
       const contenedor = document.getElementById('contenido-docentes-asignaturas');
       
       // Agrupar asignaciones por docente
       const asignacionesPorDocente = this.agruparAsignacionesPorDocente();
       
       const contenidoHtml = `
           <div class="row">
               <div class="col-md-8">
                   <div class="card">
                       <div class="card-header d-flex justify-content-between align-items-center">
                           <h6 class="m-0">Asignaciones Docente - Asignatura</h6>
                           <div class="btn-group">
                               <button class="btn btn-primary btn-sm" id="btn-nueva-asignacion-docente">
                                   <i class="fas fa-plus me-1"></i>
                                   Nueva Asignación
                               </button>
                               <button class="btn btn-outline-primary btn-sm" id="btn-importar-asignaciones">
                                   <i class="fas fa-file-excel me-1"></i>
                                   Importar Excel
                               </button>
                           </div>
                       </div>
                       <div class="card-body">
                           <div class="table-responsive">
                               <table class="table table-sm" id="tabla-asignaciones-docentes">
                                   <thead>
                                       <tr>
                                           <th>Docente</th>
                                           <th>Asignaturas</th>
                                           <th>Carga Académica</th>
                                           <th>Estado</th>
                                           <th>Acciones</th>
                                       </tr>
                                   </thead>
                                   <tbody>
                                       ${Object.values(asignacionesPorDocente).map(docente => 
                                           this.generarFilaDocenteAsignacion(docente)
                                       ).join('')}
                                   </tbody>
                               </table>
                           </div>
                       </div>
                   </div>
               </div>
               
               <div class="col-md-4">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="m-0">Asignaturas Sin Asignar</h6>
                       </div>
                       <div class="card-body">
                           <div id="asignaturas-sin-asignar">
                               ${this.generarListaAsignaturasSinAsignar()}
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       contenedor.innerHTML = contenidoHtml;
   }

   /**
    * Agrupa asignaciones por docente
    */
   agruparAsignacionesPorDocente() {
       const grupos = {};
       
       this.asignacionesDocente.forEach(asignacion => {
           const docenteId = asignacion.docenteId;
           if (!grupos[docenteId]) {
               const docente = this.docentes.find(d => d.id === docenteId);
               grupos[docenteId] = {
                   docente: docente,
                   asignaturas: [],
                   cargaTotal: 0
               };
           }
           
           grupos[docenteId].asignaturas.push(asignacion);
           grupos[docenteId].cargaTotal += asignacion.creditos || 0;
       });
       
       return grupos;
   }

   /**
    * Genera fila para asignación de docente
    */
   generarFilaDocenteAsignacion(docenteInfo) {
       const docente = docenteInfo.docente;
       const asignaturas = docenteInfo.asignaturas;
       const cargaTotal = docenteInfo.cargaTotal;
       
       if (!docente) return '';
       
       const asignaturasHtml = asignaturas.slice(0, 3).map(asig => 
           `<span class="badge badge-primary me-1" title="${asig.nombreCompleto}">${asig.codigo}</span>`
       ).join('');
       
       const masAsignaturas = asignaturas.length > 3 ? 
           `<span class="badge badge-secondary">+${asignaturas.length - 3}</span>` : '';
       
       const colorCarga = cargaTotal > 20 ? 'danger' : cargaTotal > 15 ? 'warning' : 'success';
       
       return `
           <tr data-docente-id="${docente.id}">
               <td>
                   <div class="d-flex align-items-center">
                       <img src="${docente.avatar || '/assets/imagenes/avatares/default.png'}" 
                            class="avatar avatar-xs rounded-circle me-2" alt="Avatar">
                       <div>
                           <div class="font-weight-bold">${docente.nombres} ${docente.apellidos}</div>
                           <small class="text-muted">${docente.correo}</small>
                       </div>
                   </div>
               </td>
               <td>
                   ${asignaturasHtml}${masAsignaturas}
               </td>
               <td>
                   <span class="badge badge-${colorCarga}">${cargaTotal} créditos</span>
               </td>
               <td>
                   <span class="badge badge-success">Activo</span>
               </td>
               <td>
                   <div class="btn-group btn-group-sm">
                       <button class="btn btn-outline-primary btn-ver-asignaciones" 
                               data-docente-id="${docente.id}">
                           <i class="fas fa-eye"></i>
                       </button>
                       <button class="btn btn-outline-warning btn-editar-asignaciones" 
                               data-docente-id="${docente.id}">
                           <i class="fas fa-edit"></i>
                       </button>
                       <button class="btn btn-outline-danger btn-remover-asignaciones" 
                               data-docente-id="${docente.id}">
                           <i class="fas fa-times"></i>
                       </button>
                   </div>
               </td>
           </tr>
       `;
   }

   /**
    * Genera lista de asignaturas sin asignar
    */
   generarListaAsignaturasSinAsignar() {
       const asignaturasAsignadas = this.asignacionesDocente.map(a => a.asignaturaId);
       const sinAsignar = this.asignaturas.filter(a => !asignaturasAsignadas.includes(a.id));
       
       if (sinAsignar.length === 0) {
           return `
               <div class="text-center text-success">
                   <i class="fas fa-check-circle fa-2x mb-2"></i>
                   <p class="mb-0">Todas las asignaturas están asignadas</p>
               </div>
           `;
       }
       
       return sinAsignar.map(asignatura => `
           <div class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
               <div>
                   <div class="font-weight-bold">${asignatura.codigo}</div>
                   <small class="text-muted">${asignatura.nombre}</small>
                   <br>
                   <small class="badge badge-info">${asignatura.creditos} créditos</small>
               </div>
               <button class="btn btn-sm btn-outline-primary btn-asignar-rapido" 
                       data-asignatura-id="${asignatura.id}">
                   <i class="fas fa-plus"></i>
               </button>
           </div>
       `).join('');
   }

   /**
    * Muestra asignaciones verificador-docente
    */
   mostrarAsignacionesVerificadores() {
       const contenedor = document.getElementById('contenido-verificadores-docentes');
       
       const contenidoHtml = `
           <div class="row">
               <div class="col-md-8">
                   <div class="card">
                       <div class="card-header d-flex justify-content-between align-items-center">
                           <h6 class="m-0">Asignaciones Verificador - Docente</h6>
                           <button class="btn btn-primary btn-sm" id="btn-nueva-asignacion-verificador">
                               <i class="fas fa-plus me-1"></i>
                               Nueva Asignación
                           </button>
                       </div>
                       <div class="card-body">
                           <div class="table-responsive">
                               <table class="table table-sm">
                                   <thead>
                                       <tr>
                                           <th>Verificador</th>
                                           <th>Docentes Asignados</th>
                                           <th>Carga de Trabajo</th>
                                           <th>Estado</th>
                                           <th>Acciones</th>
                                       </tr>
                                   </thead>
                                   <tbody>
                                       ${this.generarFilasVerificadores()}
                                   </tbody>
                               </table>
                           </div>
                       </div>
                   </div>
               </div>
               
               <div class="col-md-4">
                   <div class="card">
                       <div class="card-header">
                           <h6 class="m-0">Docentes Sin Verificador</h6>
                       </div>
                       <div class="card-body">
                           <div id="docentes-sin-verificador">
                               ${this.generarListaDocentesSinVerificador()}
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       contenedor.innerHTML = contenidoHtml;
   }

   /**
    * Genera filas de verificadores
    */
   generarFilasVerificadores() {
       const asignacionesPorVerificador = this.agruparAsignacionesPorVerificador();
       
       return Object.values(asignacionesPorVerificador).map(verificadorInfo => {
           const verificador = verificadorInfo.verificador;
           const docentes = verificadorInfo.docentes;
           
           if (!verificador) return '';
           
           const docentesHtml = docentes.slice(0, 3).map(docente => 
               `<span class="badge badge-secondary me-1">${docente.apellidos}</span>`
           ).join('');
           
           const masDocentes = docentes.length > 3 ? 
               `<span class="badge badge-dark">+${docentes.length - 3}</span>` : '';
           
           const colorCarga = docentes.length > 10 ? 'danger' : 
                             docentes.length > 5 ? 'warning' : 'success';
           
           return `
               <tr data-verificador-id="${verificador.id}">
                   <td>
                       <div class="d-flex align-items-center">
                           <img src="${verificador.avatar || '/assets/imagenes/avatares/default.png'}" 
                                class="avatar avatar-xs rounded-circle me-2" alt="Avatar">
                           <div>
                               <div class="font-weight-bold">${verificador.nombres} ${verificador.apellidos}</div>
                               <small class="text-muted">${verificador.correo}</small>
                           </div>
                       </div>
                   </td>
                   <td>
                       ${docentesHtml}${masDocentes}
                   </td>
                   <td>
                       <span class="badge badge-${colorCarga}">${docentes.length} docentes</span>
                   </td>
                   <td>
                       <span class="badge badge-success">Activo</span>
                   </td>
                   <td>
                       <div class="btn-group btn-group-sm">
                           <button class="btn btn-outline-primary btn-ver-verificacion" 
                                   data-verificador-id="${verificador.id}">
                               <i class="fas fa-eye"></i>
                           </button>
                           <button class="btn btn-outline-warning btn-editar-verificacion" 
                                   data-verificador-id="${verificador.id}">
                               <i class="fas fa-edit"></i>
                           </button>
                       </div>
                   </td>
               </tr>
           `;
       }).join('');
   }

   /**
    * Agrupa asignaciones por verificador
    */
   agruparAsignacionesPorVerificador() {
       const grupos = {};
       
       this.asignacionesVerificador.forEach(asignacion => {
           const verificadorId = asignacion.verificadorId;
           if (!grupos[verificadorId]) {
               const verificador = this.verificadores.find(v => v.id === verificadorId);
               grupos[verificadorId] = {
                   verificador: verificador,
                   docentes: []
               };
           }
           
           const docente = this.docentes.find(d => d.id === asignacion.docenteId);
           if (docente) {
               grupos[verificadorId].docentes.push(docente);
           }
       });
       
       return grupos;
   }

   /**
    * Genera lista de docentes sin verificador
    */
   generarListaDocentesSinVerificador() {
       const docentesConVerificador = this.asignacionesVerificador.map(a => a.docenteId);
       const sinVerificador = this.docentes.filter(d => !docentesConVerificador.includes(d.id));
       
       if (sinVerificador.length === 0) {
           return `
               <div class="text-center text-success">
                   <i class="fas fa-check-circle fa-2x mb-2"></i>
                   <p class="mb-0">Todos los docentes tienen verificador</p>
               </div>
           `;
       }
       
       return sinVerificador.map(docente => `
           <div class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
               <div>
                   <div class="font-weight-bold">${docente.nombres} ${docente.apellidos}</div>
                   <small class="text-muted">${docente.correo}</small>
               </div>
               <button class="btn btn-sm btn-outline-primary btn-asignar-verificador-rapido" 
                       data-docente-id="${docente.id}">
                   <i class="fas fa-plus"></i>
               </button>
           </div>
       `).join('');
   }

   /**
    * Configura panel de asignación rápida
    */
   configurarPanelAsignacionRapida() {
       const panelHtml = `
           <div class="card">
               <div class="card-header">
                   <h6 class="m-0">Asignación Rápida</h6>
               </div>
               <div class="card-body">
                   <div class="mb-3">
                       <label class="form-label">Tipo de Asignación</label>
                       <select class="form-select" id="tipo-asignacion-rapida">
                           <option value="docente-asignatura">Docente → Asignatura</option>
                           <option value="verificador-docente">Verificador → Docente</option>
                       </select>
                   </div>
                   <div id="campos-asignacion-rapida">
                       <!-- Se llena dinámicamente -->
                   </div>
                   <div class="d-grid">
                       <button class="btn btn-primary" id="btn-ejecutar-asignacion-rapida">
                           <i class="fas fa-bolt me-1"></i>
                           Asignar
                       </button>
                   </div>
               </div>
           </div>
       `;
       
       const contenedor = document.getElementById('panel-asignacion-rapida');
       if (contenedor) {
           contenedor.innerHTML = panelHtml;
       }
   }

   /**
    * Configura eventos de la interfaz
    */
   configurarEventos() {
       // Botones de nueva asignación
       document.getElementById('btn-nueva-asignacion-docente')?.addEventListener('click', () => {
           this.mostrarModalNuevaAsignacionDocente();
       });
       
       document.getElementById('btn-nueva-asignacion-verificador')?.addEventListener('click', () => {
           this.mostrarModalNuevaAsignacionVerificador();
       });
       
       // Eventos delegados para botones de tabla
       document.addEventListener('click', (e) => {
           if (e.target.closest('.btn-ver-asignaciones')) {
               const docenteId = e.target.closest('.btn-ver-asignaciones').dataset.docenteId;
               this.verDetalleAsignacionesDocente(docenteId);
           }
           
           if (e.target.closest('.btn-editar-asignaciones')) {
               const docenteId = e.target.closest('.btn-editar-asignaciones').dataset.docenteId;
               this.editarAsignacionesDocente(docenteId);
           }
           
           if (e.target.closest('.btn-asignar-rapido')) {
               const asignaturaId = e.target.closest('.btn-asignar-rapido').dataset.asignaturaId;
               this.mostrarModalAsignacionRapidaAsignatura(asignaturaId);
           }
           
           if (e.target.closest('.btn-asignar-verificador-rapido')) {
               const docenteId = e.target.closest('.btn-asignar-verificador-rapido').dataset.docenteId;
               this.mostrarModalAsignacionRapidaVerificador(docenteId);
           }
       });
       
       // Cambio de tipo de asignación rápida
       document.getElementById('tipo-asignacion-rapida')?.addEventListener('change', (e) => {
           this.actualizarCamposAsignacionRapida(e.target.value);
       });
   }

   /**
    * Muestra modal para nueva asignación docente-asignatura
    */
   async mostrarModalNuevaAsignacionDocente() {
       const modal = new SistemaModales();
       
       const docentesOptions = this.docentes.map(d => ({
           value: d.id,
           text: `${d.nombres} ${d.apellidos}`
       }));
       
       const asignaturasOptions = this.asignaturas.map(a => ({
           value: a.id,
           text: `${a.codigo} - ${a.nombre}`
       }));
       
       await modal.mostrarFormulario('Nueva Asignación Docente-Asignatura', {
           docente: { 
               type: 'select', 
               label: 'Docente', 
               options: docentesOptions,
               required: true 
           },
           asignaturas: { 
               type: 'multiselect', 
               label: 'Asignaturas', 
               options: asignaturasOptions,
               required: true 
           },
           observaciones: { 
               type: 'textarea', 
               label: 'Observaciones (opcional)', 
               rows: 3 
           }
       }, async (datos) => {
           await this.crearAsignacionDocente(datos);
       });
   }

   /**
    * Crea nueva asignación docente-asignatura
    */
   async crearAsignacionDocente(datos) {
       try {
           const resultado = await this.servicioAsignaturas.asignarDocente({
               docenteId: datos.docente,
               asignaturasIds: datos.asignaturas,
               cicloId: this.cicloActual.id,
               observaciones: datos.observaciones
           });
           
           if (resultado.exito) {
               Utilidades.mostrarNotificacion('Asignaciones creadas exitosamente', 'success');
               await this.cargarDatos();
               this.mostrarAsignacionesDocentes();
           } else {
               throw new Error(resultado.mensaje || 'Error al crear asignaciones');
           }
       } catch (error) {
           console.error('Error al crear asignación docente:', error);
           Utilidades.mostrarNotificacion('Error al crear asignación: ' + error.message, 'error');
       }
   }

   /**
    * Muestra modal para nueva asignación verificador-docente
    */
   async mostrarModalNuevaAsignacionVerificador() {
       const modal = new SistemaModales();
       
       const verificadoresOptions = this.verificadores.map(v => ({
           value: v.id,
           text: `${v.nombres} ${v.apellidos}`
       }));
       
       const docentesOptions = this.docentes.map(d => ({
           value: d.id,
           text: `${d.nombres} ${d.apellidos}`
       }));
       
       await modal.mostrarFormulario('Nueva Asignación Verificador-Docente', {
           verificador: { 
               type: 'select', 
               label: 'Verificador', 
               options: verificadoresOptions,
               required: true 
           },
           docentes: { 
               type: 'multiselect', 
               label: 'Docentes', 
               options: docentesOptions,
               required: true 
           },
           observaciones: { 
               type: 'textarea', 
               label: 'Observaciones (opcional)', 
               rows: 3 
           }
       }, async (datos) => {
           await this.crearAsignacionVerificador(datos);
       });
   }

   /**
    * Crea nueva asignación verificador-docente
    */
   async crearAsignacionVerificador(datos) {
       try {
           const resultado = await this.servicioUsuarios.asignarVerificador({
               verificadorId: datos.verificador,
               docentesIds: datos.docentes,
               cicloId: this.cicloActual.id,
               observaciones: datos.observaciones
           });
           
           if (resultado.exito) {
               Utilidades.mostrarNotificacion('Asignaciones de verificación creadas exitosamente', 'success');
               await this.cargarDatos();
               this.mostrarAsignacionesVerificadores();
           } else {
               throw new Error(resultado.mensaje || 'Error al crear asignaciones');
           }
       } catch (error) {
           console.error('Error al crear asignación verificador:', error);
           Utilidades.mostrarNotificacion('Error al crear asignación: ' + error.message, 'error');
       }
   }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
   window.gestionAsignaciones = new GestionAsignaciones();
});

// Exportar para uso global
window.GestionAsignaciones = GestionAsignaciones;