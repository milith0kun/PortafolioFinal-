/**
 * 👨‍🏫 DASHBOARD DOCENTE
 * Sistema Portafolio Docente UNSAAC
 * 
 * Panel principal para docentes del sistema
 * Incluye progreso de portafolios, tareas pendientes, observaciones y accesos rápidos
 */

class TableroDocente {
   constructor() {
       this.elementosDOM = {};
       this.datos = {
           progreso: {},
           portafolios: [],
           tareasPendientes: [],
           observaciones: [],
           estadisticas: {},
           graficos: {}
       };
       
       this.intervalos = {};
       this.graficosInstancias = {};
       
       this.configuracion = {
           actualizacionAutomatica: true,
           intervaloActualizacion: 120000, // 2 minutos
           mostrarAnimaciones: true,
           cargarGraficosProgreso: true
       };

       this.inicializar();
   }

   /**
    * 🚀 Inicializar dashboard de docente
    */
   async inicializar() {
       try {
           console.log('👨‍🏫 Inicializando dashboard de docente...');

           // Verificar permisos de docente
           this.verificarPermisos();

           // Mapear elementos DOM
           this.mapearElementosDOM();

           // Mostrar saludo personalizado
           this.mostrarSaludoPersonalizado();

           // Mostrar estado de carga
           this.mostrarCarga(true);

           // Cargar datos iniciales
           await this.cargarDatosIniciales();

           // Renderizar componentes
           await this.renderizarComponentes();

           // Configurar eventos y actualizaciones
           this.configurarEventos();
           this.configurarActualizacionesAutomaticas();

           console.log('✅ Dashboard de docente inicializado correctamente');

       } catch (error) {
           console.error('❌ Error al inicializar dashboard:', error);
           this.mostrarErrorInicializacion(error);
       } finally {
           this.mostrarCarga(false);
       }
   }

   /**
    * 🔒 Verificar permisos de docente
    */
   verificarPermisos() {
       if (!window.auth || !window.auth.estaAutenticado()) {
           window.location.href = '/paginas/autenticacion/login.html';
           return;
       }

       const usuario = window.auth.obtenerUsuario();
       if (usuario.rolActual !== 'docente') {
           window.location.href = '/paginas/errores/403.html';
           return;
       }
   }

   /**
    * 🎯 Mapear elementos DOM
    */
   mapearElementosDOM() {
       this.elementosDOM = {
           // Contenedores principales
           contenedorPrincipal: $('#dashboard-docente'),
           contenedorCarga: $('#contenedor-carga'),
           
           // Saludo personalizado
           saludoPersonalizado: $('#saludo-personalizado'),
           nombreDocente: $('#nombre-docente'),
           
           // Progreso general
           progresoGeneral: $('#progreso-general'),
           porcentajeProgreso: $('#porcentaje-progreso'),
           barraProgreso: $('#barra-progreso'),
           metaProgreso: $('#meta-progreso'),
           
           // Métricas principales
           totalPortafolios: $('#total-portafolios'),
           portafoliosCompletos: $('#portafolios-completos'),
           documentosSubidos: $('#documentos-subidos'),
           observacionesPendientes: $('#observaciones-pendientes'),
           ultimaActividad: $('#ultima-actividad'),
           
           // Portafolios
           listaPortafolios: $('#lista-portafolios'),
           contenedorPortafolios: $('#contenedor-portafolios'),
           
           // Tareas pendientes
           listaTareasPendientes: $('#lista-tareas-pendientes'),
           contadorTareas: $('#contador-tareas'),
           
           // Observaciones recientes
           listaObservaciones: $('#lista-observaciones'),
           contadorObservaciones: $('#contador-observaciones'),
           
           // Gráficos
           graficoProgreso: $('#grafico-progreso'),
           graficoActividad: $('#grafico-actividad'),
           
           // Acciones rápidas
           accionesRapidas: $('#acciones-rapidas'),
           btnSubirDocumento: $('#btn-subir-documento'),
           btnVerPortafolios: $('#btn-ver-portafolios'),
           btnVerObservaciones: $('#btn-ver-observaciones'),
           
           // Calendario de entregas
           calendarioEntregas: $('#calendario-entregas'),
           
           // Consejos y tips
           consejosDia: $('#consejos-dia'),
           
           // Controles
           btnActualizar: $('#btn-actualizar'),
           selectorCiclo: $('#selector-ciclo'),
           ultimaActualizacion: $('#ultima-actualizacion')
       };
   }

   /**
    * 👋 Mostrar saludo personalizado
    */
   mostrarSaludoPersonalizado() {
       const usuario = window.auth.obtenerUsuario();
       if (!usuario.usuario) return;

       const hora = new Date().getHours();
       let saludo = '';
       
       if (hora < 12) {
           saludo = 'Buenos días';
       } else if (hora < 18) {
           saludo = 'Buenas tardes';
       } else {
           saludo = 'Buenas noches';
       }

       if (this.elementosDOM.saludoPersonalizado) {
           this.elementosDOM.saludoPersonalizado.textContent = saludo;
       }

       if (this.elementosDOM.nombreDocente) {
           this.elementosDOM.nombreDocente.textContent = 
               `${usuario.usuario.nombres} ${usuario.usuario.apellidos}`;
       }
   }

   /**
    * 📊 Cargar datos iniciales
    */
   async cargarDatosIniciales() {
       try {
           console.log('📊 Cargando datos del dashboard docente...');

           // Cargar progreso general
           await this.cargarProgresoGeneral();

           // Cargar portafolios del docente
           await this.cargarPortafoliosDocente();

           // Cargar tareas pendientes
           await this.cargarTareasPendientes();

           // Cargar observaciones recientes
           await this.cargarObservacionesRecientes();

           // Cargar estadísticas
           await this.cargarEstadisticasDocente();

           // Cargar datos para gráficos
           await this.cargarDatosGraficos();

           console.log('✅ Datos del dashboard docente cargados');

       } catch (error) {
           console.error('❌ Error al cargar datos:', error);
           throw error;
       }
   }

   /**
    * 📈 Cargar progreso general
    */
   async cargarProgresoGeneral() {
       try {
           const response = await window.ServicioPortafolios.obtenerResumenProgreso();
           
           if (response.success) {
               this.datos.progreso = response.resumen;
           } else {
               // Datos de prueba
               this.datos.progreso = {
                   porcentajeGeneral: 68,
                   meta: 80,
                   portafoliosCompletos: 3,
                   totalPortafolios: 5,
                   documentosSubidos: 45,
                   ultimaActividad: new Date(Date.now() - 2 * 60 * 60 * 1000),
                   tendencia: 'positiva',
                   diasParaEntrega: 15
               };
           }
       } catch (error) {
           console.warn('⚠️ Error al cargar progreso, usando datos de prueba');
           this.datos.progreso = {
               porcentajeGeneral: 68,
               meta: 80,
               portafoliosCompletos: 3,
               totalPortafolios: 5,
               documentosSubidos: 45,
               ultimaActividad: new Date(Date.now() - 2 * 60 * 60 * 1000),
               tendencia: 'positiva',
               diasParaEntrega: 15
           };
       }
   }

   /**
    * 📁 Cargar portafolios del docente
    */
   async cargarPortafoliosDocente() {
       try {
           const response = await window.ServicioPortafolios.obtenerVistaDocente();
           
           if (response.success) {
               this.datos.portafolios = response.portafolios;
           } else {
               // Datos de prueba
               this.datos.portafolios = [
                   {
                       id: 1,
                       nombre: 'Matemática Discreta',
                       codigo: 'IF-301',
                       progreso: 85,
                       estado: 'activo',
                       ultimaModificacion: new Date(Date.now() - 24 * 60 * 60 * 1000),
                       documentos: 12,
                       observacionesPendientes: 1
                   },
                   {
                       id: 2,
                       nombre: 'Algoritmos y Estructuras de Datos',
                       codigo: 'IF-302',
                       progreso: 60,
                       estado: 'en_progreso',
                       ultimaModificacion: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                       documentos: 8,
                       observacionesPendientes: 0
                   },
                   {
                       id: 3,
                       nombre: 'Base de Datos I',
                       codigo: 'IF-303',
                       progreso: 45,
                       estado: 'en_progreso',
                       ultimaModificacion: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                       documentos: 6,
                       observacionesPendientes: 2
                   }
               ];
           }
       } catch (error) {
           console.warn('⚠️ Error al cargar portafolios');
           this.datos.portafolios = [];
       }
   }

   /**
    * 📋 Cargar tareas pendientes
    */
   async cargarTareasPendientes() {
       try {
           // Simular llamada al API
           this.datos.tareasPendientes = [
               {
                   id: 1,
                   tipo: 'documento',
                   titulo: 'Subir syllabus actualizado',
                   descripcion: 'Matemática Discreta - Syllabus 2024-I',
                   fechaLimite: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                   prioridad: 'alta',
                   portafolio: 'Matemática Discreta'
               },
               {
                   id: 2,
                   tipo: 'observacion',
                   titulo: 'Responder observación',
                   descripcion: 'Corregir formato de examen parcial',
                   fechaLimite: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                   prioridad: 'media',
                   portafolio: 'Base de Datos I'
               },
               {
                   id: 3,
                   tipo: 'entrega',
                   titulo: 'Completar portafolio',
                   descripcion: 'Faltan 3 documentos por subir',
                   fechaLimite: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
                   prioridad: 'media',
                   portafolio: 'Algoritmos y Estructuras'
               }
           ];
       } catch (error) {
           console.warn('⚠️ Error al cargar tareas pendientes');
           this.datos.tareasPendientes = [];
       }
   }

   /**
    * 💬 Cargar observaciones recientes
    */
   async cargarObservacionesRecientes() {
       try {
           // Simular llamada al API
           this.datos.observaciones = [
               {
                   id: 1,
                   verificador: 'Ana García',
                   asunto: 'Formato de syllabus',
                   mensaje: 'El syllabus debe incluir la metodología de evaluación...',
                   fecha: new Date(Date.now() - 6 * 60 * 60 * 1000),
                   estado: 'pendiente',
                   portafolio: 'Matemática Discreta',
                   tipo: 'correccion'
               },
               {
                   id: 2,
                   verificador: 'Carlos López',
                   asunto: 'Documento aprobado',
                   mensaje: 'El examen final ha sido aprobado sin observaciones.',
                   fecha: new Date(Date.now() - 24 * 60 * 60 * 1000),
                   estado: 'aprobado',
                   portafolio: 'Base de Datos I',
                   tipo: 'aprobacion'
               }
           ];
       } catch (error) {
           console.warn('⚠️ Error al cargar observaciones');
           this.datos.observaciones = [];
       }
   }

   /**
    * 📊 Cargar estadísticas del docente
    */
   async cargarEstadisticasDocente() {
       try {
           this.datos.estadisticas = {
               documentosAprobados: 42,
               documentosRechazados: 3,
               tiempoPromedioAprobacion: 2.5,
               calificacionPromedio: 4.2,
               eficienciaSubida: 89
           };
       } catch (error) {
           console.warn('⚠️ Error al cargar estadísticas');
       }
   }

   /**
    * 📈 Cargar datos para gráficos
    */
   async cargarDatosGraficos() {
       try {
           this.datos.graficos = {
               progresoPorPortafolio: {
                   labels: this.datos.portafolios.map(p => p.nombre),
                   datasets: [{
                       label: 'Progreso (%)',
                       data: this.datos.portafolios.map(p => p.progreso),
                       backgroundColor: [
                           'rgba(54, 162, 235, 0.8)',
                           'rgba(255, 206, 86, 0.8)',
                           'rgba(255, 99, 132, 0.8)',
                           'rgba(75, 192, 192, 0.8)',
                           'rgba(153, 102, 255, 0.8)'
                       ]
                   }]
               },
               actividadSemanal: {
                   labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                   datasets: [{
                       label: 'Documentos subidos',
                       data: [2, 1, 3, 0, 4, 1, 0],
                       borderColor: 'rgb(75, 192, 192)',
                       backgroundColor: 'rgba(75, 192, 192, 0.2)',
                       tension: 0.4
                   }]
               }
           };
       } catch (error) {
           console.warn('⚠️ Error al cargar datos de gráficos');
       }
   }

   // ==========================================
   // 🎨 RENDERIZADO DE COMPONENTES
   // ==========================================

   /**
    * 🎨 Renderizar todos los componentes
    */
   async renderizarComponentes() {
       console.log('🎨 Renderizando componentes del dashboard docente...');

       // Renderizar progreso general
       this.renderizarProgresoGeneral();

       // Renderizar métricas principales
       this.renderizarMetricasPrincipales();

       // Renderizar portafolios
       this.renderizarPortafolios();

       // Renderizar tareas pendientes
       this.renderizarTareasPendientes();

       // Renderizar observaciones
       this.renderizarObservaciones();

       // Renderizar gráficos
       await this.renderizarGraficos();

       // Renderizar acciones rápidas
       this.renderizarAccionesRapidas();

       // Renderizar consejos del día
       this.renderizarConsejosDia();

       // Actualizar información adicional
       this.actualizarInformacionAdicional();
   }

   /**
    * 📊 Renderizar progreso general
    */
   renderizarProgresoGeneral() {
       const progreso = this.datos.progreso;

       // Porcentaje principal
       if (this.elementosDOM.porcentajeProgreso) {
           this.animarNumero(this.elementosDOM.porcentajeProgreso, 0, progreso.porcentajeGeneral);
       }

       // Barra de progreso
       if (this.elementosDOM.barraProgreso) {
           setTimeout(() => {
               this.elementosDOM.barraProgreso.style.width = `${progreso.porcentajeGeneral}%`;
               this.elementosDOM.barraProgreso.setAttribute('aria-valuenow', progreso.porcentajeGeneral);
           }, 500);
       }

       // Meta de progreso
       if (this.elementosDOM.metaProgreso) {
           this.elementosDOM.metaProgreso.textContent = `Meta: ${progreso.meta}%`;
           
           // Agregar indicador si está cerca de la meta
           if (progreso.porcentajeGeneral >= progreso.meta) {
               this.elementosDOM.metaProgreso.innerHTML += ' <i class="fas fa-check-circle text-success ms-1"></i>';
           }
       }
   }

   /**
    * 📈 Renderizar métricas principales
    */
   renderizarMetricasPrincipales() {
       const progreso = this.datos.progreso;

       // Total de portafolios
       if (this.elementosDOM.totalPortafolios) {
           this.animarNumero(this.elementosDOM.totalPortafolios, 0, progreso.totalPortafolios);
       }

       // Portafolios completos
       if (this.elementosDOM.portafoliosCompletos) {
           this.animarNumero(this.elementosDOM.portafoliosCompletos, 0, progreso.portafoliosCompletos);
       }

       // Documentos subidos
       if (this.elementosDOM.documentosSubidos) {
           this.animarNumero(this.elementosDOM.documentosSubidos, 0, progreso.documentosSubidos);
       }

       // Observaciones pendientes
       const observacionesPendientes = this.datos.observaciones.filter(o => o.estado === 'pendiente').length;
       if (this.elementosDOM.observacionesPendientes) {
           this.animarNumero(this.elementosDOM.observacionesPendientes, 0, observacionesPendientes);
       }

       // Última actividad
       if (this.elementosDOM.ultimaActividad) {
           this.elementosDOM.ultimaActividad.textContent = 
               Utils.Fecha.formatearRelativo(progreso.ultimaActividad);
       }
   }

   /**
    * 📁 Renderizar portafolios
    */
   renderizarPortafolios() {
       if (!this.elementosDOM.listaPortafolios) return;

       let html = '';

       if (this.datos.portafolios.length === 0) {
           html = `
               <div class="text-center p-4">
                   <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
                   <h5>No hay portafolios asignados</h5>
                   <p class="text-muted">Contacta al administrador para asignar materias.</p>
               </div>
           `;
       } else {
           this.datos.portafolios.forEach(portafolio => {
               const estadoClase = this.obtenerClaseEstado(portafolio.estado);
               const progresoColor = this.obtenerColorProgreso(portafolio.progreso);

               html += `
                   <div class="col-md-6 col-lg-4 mb-4">
                       <div class="card h-100 portafolio-card" data-portafolio-id="${portafolio.id}">
                           <div class="card-header d-flex justify-content-between align-items-center">
                               <div>
                                   <h6 class="mb-0">${portafolio.codigo}</h6>
                                   <small class="badge bg-${estadoClase}">${this.formatearEstado(portafolio.estado)}</small>
                               </div>
                               ${portafolio.observacionesPendientes > 0 ? 
                                   `<span class="badge bg-warning">${portafolio.observacionesPendientes} obs.</span>` : 
                                   ''}
                           </div>
                           
                           <div class="card-body">
                               <h6 class="card-title">${Utils.Texto.truncar(portafolio.nombre, 30)}</h6>
                               
                               <!-- Progreso -->
                               <div class="mb-3">
                                   <div class="d-flex justify-content-between align-items-center mb-1">
                                       <small class="text-muted">Progreso</small>
                                       <small class="fw-bold text-${progresoColor}">${portafolio.progreso}%</small>
                                   </div>
                                   <div class="progress" style="height: 6px;">
                                       <div class="progress-bar bg-${progresoColor}" 
                                            style="width: ${portafolio.progreso}%"></div>
                                   </div>
                               </div>

                               <!-- Información adicional -->
                               <div class="d-flex justify-content-between text-muted small">
                                   <span><i class="fas fa-file me-1"></i>${portafolio.documentos} docs</span>
                                   <span><i class="fas fa-clock me-1"></i>${Utils.Fecha.formatearRelativo(portafolio.ultimaModificacion)}</span>
                               </div>
                           </div>
                           
                           <div class="card-footer bg-transparent">
                               <div class="d-flex gap-2">
                                   <button class="btn btn-primary btn-sm flex-fill" 
                                           onclick="abrirPortafolio(${portafolio.id})">
                                       <i class="fas fa-eye me-1"></i>Ver
                                   </button>
                                   <button class="btn btn-outline-primary btn-sm" 
                                           onclick="subirDocumento(${portafolio.id})"
                                           title="Subir documento">
                                       <i class="fas fa-plus"></i>
                                   </button>
                               </div>
                           </div>
                       </div>
                   </div>
               `;
           });
       }

       this.elementosDOM.listaPortafolios.innerHTML = html;
   }

   /**
    * 📋 Renderizar tareas pendientes
    */
   renderizarTareasPendientes() {
       if (!this.elementosDOM.listaTareasPendientes) return;

       // Actualizar contador
       if (this.elementosDOM.contadorTareas) {
           this.elementosDOM.contadorTareas.textContent = this.datos.tareasPendientes.length;
       }

       let html = '';

       if (this.datos.tareasPendientes.length === 0) {
           html = `
               <div class="text-center p-4">
                   <i class="fas fa-check-circle fa-2x text-success mb-2"></i>
                   <p class="text-muted mb-0">¡No hay tareas pendientes!</p>
               </div>
           `;
       } else {
           this.datos.tareasPendientes.forEach(tarea => {
               const prioridadClase = this.obtenerClasePrioridad(tarea.prioridad);
               const diasRestantes = Math.ceil((tarea.fechaLimite - new Date()) / (1000 * 60 * 60 * 24));
               const urgente = diasRestantes <= 2;

               html += `
                   <div class="d-flex align-items-start mb-3 tarea-pendiente ${urgente ? 'bg-warning bg-opacity-10 p-2 rounded' : ''}" 
                        data-tarea-id="${tarea.id}">
                       <div class="flex-shrink-0 me-3">
                           <i class="${this.obtenerIconoTarea(tarea.tipo)} fa-lg text-${prioridadClase}"></i>
                       </div>
                       <div class="flex-grow-1">
                           <div class="d-flex justify-content-between align-items-start">
                               <div>
                                   <h6 class="mb-1">${tarea.titulo}</h6>
                                   <p class="text-muted small mb-1">${tarea.descripcion}</p>
                                   <small class="text-muted">
                                       <i class="fas fa-folder me-1"></i>${tarea.portafolio}
                                   </small>
                               </div>
                               <div class="text-end">
                                   <small class="badge bg-${prioridadClase}">${tarea.prioridad}</small>
                                   <div class="small text-muted mt-1">
                                       ${urgente ? '<i class="fas fa-exclamation-triangle text-warning me-1"></i>' : ''}
                                       ${diasRestantes > 0 ? `${diasRestantes} días` : 'Vencido'}
                                   </div>
                               </div>
                           </div>
                           <div class="mt-2">
                               <button class="btn btn-sm btn-outline-primary" 
                                       onclick="completarTarea(${tarea.id})">
                                   <i class="fas fa-check me-1"></i>Completar
                               </button>
                           </div>
                       </div>
                   </div>
               `;
           });
       }

       this.elementosDOM.listaTareasPendientes.innerHTML = html;
   }

   /**
    * 💬 Renderizar observaciones
    */
   renderizarObservaciones() {
       if (!this.elementosDOM.listaObservaciones) return;

       // Actualizar contador
       const observacionesPendientes = this.datos.observaciones.filter(o => o.estado === 'pendiente').length;
       if (this.elementosDOM.contadorObservaciones) {
           this.elementosDOM.contadorObservaciones.textContent = observacionesPendientes;
       }

       let html = '';

       if (this.datos.observaciones.length === 0) {
           html = `
               <div class="text-center p-4">
                   <i class="fas fa-comments fa-2x text-muted mb-2"></i>
                   <p class="text-muted mb-0">No hay observaciones recientes</p>
               </div>
           `;
       } else {
           this.datos.observaciones.slice(0, 5).forEach(observacion => {
               const estadoColor = observacion.estado === 'pendiente' ? 'warning' : 'success';
               const tipoIcono = this.obtenerIconoObservacion(observacion.tipo);

               html += `
                   <div class="d-flex align-items-start mb-3 observacion-item" 
                        data-observacion-id="${observacion.id}">
                       <div class="flex-shrink-0 me-3">
                           <i class="${tipoIcono} text-${estadoColor}"></i>
                       </div>
                       <div class="flex-grow-1">
                           <div class="d-flex justify-content-between align-items-start">
                               <div>
                                   <h6 class="mb-1">${observacion.asunto}</h6>
                                   <p class="text-muted small mb-1">${Utils.Texto.truncar(observacion.mensaje, 80)}</p>
                                   <div class="d-flex align-items-center gap-3 small text-muted">
                                       <span><i class="fas fa-user me-1"></i>${observacion.verificador}</span>
                                       <span><i class="fas fa-folder me-1"></i>${observacion.portafolio}</span>
                                       <span><i class="fas fa-clock me-1"></i>${Utils.Fecha.formatearRelativo(observacion.fecha)}</span>
                                   </div>
                               </div>
                               <span class="badge bg-${estadoColor}">${observacion.estado}</span>
                           </div>
                           
                           ${observacion.estado === 'pendiente' ? `
                               <div class="mt-2">
                                   <button class="btn btn-sm btn-outline-primary" 
                                           onclick="responderObservacion(${observacion.id})">
                                       <i class="fas fa-reply me-1"></i>Responder
                                   </button>
                               </div>
                           ` : ''}
                       </div>
                   </div>
               `;
           });

           // Enlace para ver todas las observaciones
           if (this.datos.observaciones.length > 5) {
               html += `
                   <div class="text-center mt-3">
                       <a href="/paginas/docente/observaciones.html" class="btn btn-sm btn-outline-primary">
                           Ver todas las observaciones (${this.datos.observaciones.length})
                       </a>
                   </div>
               `;
           }
       }

       this.elementosDOM.listaObservaciones.innerHTML = html;
   }

   /**
    * 📈 Renderizar gráficos
    */
   async renderizarGraficos() {
       if (!window.Chart) {
           console.warn('⚠️ Chart.js no disponible');
           return;
       }

       try {
           // Gráfico de progreso por portafolio
           await this.renderizarGraficoProgreso();

           // Gráfico de actividad semanal
           await this.renderizarGraficoActividad();

       } catch (error) {
           console.error('❌ Error al renderizar gráficos:', error);
       }
   }

   /**
    * 📊 Renderizar gráfico de progreso
    */
   async renderizarGraficoProgreso() {
       if (!this.elementosDOM.graficoProgreso) return;

       const ctx = this.elementosDOM.graficoProgreso.getContext('2d');
       
       if (this.graficosInstancias.progreso) {
           this.graficosInstancias.progreso.destroy();
       }

       this.graficosInstancias.progreso = new Chart(ctx, {
           type: 'bar',
           data: this.datos.graficos.progresoPorPortafolio,
           options: {
               responsive: true,
               maintainAspectRatio: false,
               plugins: {
                   title: {
                       display: true,
                       text: 'Progreso por Portafolio'
                   }
               },
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
               }
           }
       });
   }

   /**
    * 📈 Renderizar gráfico de actividad
    */
   async renderizarGraficoActividad() {
       if (!this.elementosDOM.graficoActividad) return;

       const ctx = this.elementosDOM.graficoActividad.getContext('2d');
       
       if (this.graficosInstancias.actividad) {
           this.graficosInstancias.actividad.destroy();
       }

       this.graficosInstancias.actividad = new Chart(ctx, {
           type: 'line',
           data: this.datos.graficos.actividadSemanal,
           options: {
               responsive: true,
               maintainAspectRatio: false,
               plugins: {
                   title: {
                       display: true,
                       text: 'Actividad de la Semana'
                   }
               },
               scales: {
                   y: {
                       beginAtZero: true
                   }
               }
           }
       });
   }

   /**
    * ⚡ Renderizar acciones rápidas
    */
   renderizarAccionesRapidas() {
       if (!this.elementosDOM.accionesRapidas) return;

       const acciones = [
           {
               titulo: 'Subir Documento',
               descripcion: 'Agregar nuevo documento',
               icono: 'fas fa-cloud-upload-alt',
               color: 'primary',
               url: '/paginas/docente/subir.html'
           },
           {
               titulo: 'Mis Portafolios',
               descripcion: 'Ver todos mis portafolios',
               icono: 'fas fa-folder-open',
               color: 'info',
               url: '/paginas/docente/mis-portafolios.html'
           },
           {
               titulo: 'Ver Progreso',
               descripcion: 'Estadísticas detalladas',
               icono: 'fas fa-chart-line',
               color: 'success',
               url: '/paginas/docente/progreso.html'
           },
           {
               titulo: 'Observaciones',
               descripcion: 'Revisar comentarios',
               icono: 'fas fa-comments',
               color: 'warning',
               url: '/paginas/docente/observaciones.html',
               badge: this.datos.observaciones.filter(o => o.estado === 'pendiente').length
           }
       ];

       let html = '';
       acciones.forEach(accion => {
           html += `
               <div class="col-6 col-md-3 mb-3">
                   <div class="card h-100 border-0 shadow-sm accion-rapida text-center" 
                        onclick="window.location.href='${accion.url}'">
                       <div class="card-body d-flex flex-column justify-content-center">
                           <div class="position-relative mb-2">
                               <i class="${accion.icono} fa-2x text-${accion.color}"></i>
                               ${accion.badge > 0 ? `
                                   <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                       ${accion.badge}
                                   </span>
                               ` : ''}
                           </div>
                           <h6 class="card-title small">${accion.titulo}</h6>
                           <p class="card-text smaller text-muted mb-0">${accion.descripcion}</p>
                       </div>
                   </div>
               </div>
           `;
       });

       this.elementosDOM.accionesRapidas.innerHTML = html;
   }

   /**
    * 💡 Renderizar consejos del día
    */
   renderizarConsejosDia() {
       if (!this.elementosDOM.consejosDia) return;

       const consejos = [
           {
               titulo: 'Organización',
               texto: 'Sube tus documentos regularmente para mantener un progreso constante.',
               icono: 'fas fa-lightbulb'
           },
           {
               titulo: 'Nomenclatura',
               texto: 'Usa nombres descriptivos para tus archivos (ej: Syllabus_MDS_2024I.pdf).',
               icono: 'fas fa-tag'
           },
           {
               titulo: 'Revisión',
               texto: 'Revisa las observaciones frecuentemente para resolver dudas rápidamente.',
               icono: 'fas fa-search'
           }
       ];

       const consejoAleatorio = consejos[Math.floor(Math.random() * consejos.length)];

       const html = `
           <div class="card border-0 bg-light">
               <div class="card-body">
                   <div class="d-flex align-items-center">
                       <div class="flex-shrink-0 me-3">
                           <i class="${consejoAleatorio.icono} fa-2x text-warning"></i>
                       </div>
                       <div>
                           <h6 class="mb-1">💡 Consejo: ${consejoAleatorio.titulo}</h6>
                           <p class="mb-0 small text-muted">${consejoAleatorio.texto}</p>
                       </div>
                   </div>
               </div>
           </div>
       `;

       this.elementosDOM.consejosDia.innerHTML = html;
   }

   // ==========================================
   // 🛠️ MÉTODOS AUXILIARES
   // ==========================================

   /**
    * 💫 Animar número
    */
   animarNumero(elemento, desde, hasta, duracion = 1000) {
       if (!elemento || !this.configuracion.mostrarAnimaciones) {
           if (elemento) elemento.textContent = hasta;
           return;
       }

       const diferencia = hasta - desde;
       const incremento = diferencia / (duracion / 16);
       let valorActual = desde;

       const animar = () => {
           valorActual += incremento;
           
           if ((incremento > 0 && valorActual >= hasta) || 
               (incremento < 0 && valorActual <= hasta)) {
               elemento.textContent = hasta;
               return;
           }
           
           elemento.textContent = Math.round(valorActual);
           requestAnimationFrame(animar);
       };

       animar();
   }

   /**
    * 🎨 Obtener clase de estado
    */
   obtenerClaseEstado(estado) {
       const clases = {
           activo: 'success',
           en_progreso: 'warning',
           bloqueado: 'danger',
           completo: 'primary'
       };
       return clases[estado] || 'secondary';
   }

   /**
    * 🎨 Obtener color de progreso
    */
   obtenerColorProgreso(progreso) {
       if (progreso >= 80) return 'success';
       if (progreso >= 60) return 'info';
       if (progreso >= 40) return 'warning';
       return 'danger';
   }

   /**
    * 🏷️ Formatear estado
    */
   formatearEstado(estado) {
       const estados = {
           activo: 'Activo',
           en_progreso: 'En Progreso',
           bloqueado: 'Bloqueado',
           completo: 'Completo'
       };
       return estados[estado] || Utils.Texto.capitalizarPalabras(estado);
   }

   /**
    * 🚀 Configurar eventos
    */
   configurarEventos() {
       // Botón actualizar
       if (this.elementosDOM.btnActualizar) {
           this.elementosDOM.btnActualizar.addEventListener('click', () => {
               this.actualizarDashboard();
           });
       }

       // Selector de ciclo
       if (this.elementosDOM.selectorCiclo) {
           this.elementosDOM.selectorCiclo.addEventListener('change', () => {
               this.cambiarCiclo();
           });
       }

       // Botones de acceso rápido en header
       this.configurarBotonesAccesoRapido();
   }

   /**
    * 🔄 Configurar actualizaciones automáticas
    */
   configurarActualizacionesAutomaticas() {
       if (!this.configuracion.actualizacionAutomatica) return;

       this.intervalos.progreso = setInterval(async () => {
           try {
               await this.cargarProgresoGeneral();
               this.renderizarProgresoGeneral();
               this.renderizarMetricasPrincipales();
           } catch (error) {
               console.error('Error en actualización automática:', error);
           }
       }, this.configuracion.intervaloActualizacion);
   }

   /**
    * ⏰ Actualizar información adicional
    */
   actualizarInformacionAdicional() {
       if (this.elementosDOM.ultimaActualizacion) {
           this.elementosDOM.ultimaActualizacion.textContent = 
               Utils.Fecha.formatearFechaHora(new Date());
       }
   }

   /**
    * 🧹 Destruir dashboard
    */
   destruir() {
       // Limpiar intervalos
       Object.values(this.intervalos).forEach(clearInterval);
       
       // Destruir gráficos
       Object.values(this.graficosInstancias).forEach(grafico => {
           if (grafico && typeof grafico.destroy === 'function') {
               grafico.destroy();
           }
       });
       
       console.log('🧹 Dashboard de docente destruido');
   }

   // Métodos auxiliares adicionales...
   obtenerClasePrioridad(prioridad) {
       const clases = { alta: 'danger', media: 'warning', baja: 'info' };
       return clases[prioridad] || 'secondary';
   }

   obtenerIconoTarea(tipo) {
       const iconos = {
           documento: 'fas fa-file-upload',
           observacion: 'fas fa-comment-alt',
           entrega: 'fas fa-calendar-check'
       };
       return iconos[tipo] || 'fas fa-task';
   }

   obtenerIconoObservacion(tipo) {
       const iconos = {
           correccion: 'fas fa-edit',
           aprobacion: 'fas fa-check-circle',
           rechazo: 'fas fa-times-circle'
       };
       return iconos[tipo] || 'fas fa-comment';
   }

   mostrarCarga(mostrar) {
       if (this.elementosDOM.contenedorCarga) {
           this.elementosDOM.contenedorCarga.classList.toggle('d-none', !mostrar);
       }
       if (this.elementosDOM.contenedorPrincipal) {
           this.elementosDOM.contenedorPrincipal.classList.toggle('d-none', mostrar);
       }
   }

   mostrarErrorInicializacion(error) {
       document.body.innerHTML = `
           <div class="container-fluid vh-100 d-flex align-items-center justify-content-center">
               <div class="text-center">
                   <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                   <h4>Error al cargar Dashboard</h4>
                   <p class="text-muted">${error.message}</p>
                   <button class="btn btn-primary" onclick="window.location.reload()">
                       <i class="fas fa-redo me-2"></i>Reintentar
                   </button>
               </div>
           </div>
       `;
   }
}

// 🌐 Funciones globales para eventos
window.abrirPortafolio = function(portafolioId) {
   window.location.href = `/paginas/docente/explorador.html?portafolio=${portafolioId}`;
};

window.subirDocumento = function(portafolioId) {
   window.location.href = `/paginas/docente/subir.html?portafolio=${portafolioId}`;
};

window.completarTarea = function(tareaId) {
   console.log('✅ Completando tarea:', tareaId);
   // Implementar lógica específica
};

window.responderObservacion = function(observacionId) {
   window.location.href = `/paginas/docente/observaciones.html?observacion=${observacionId}`;
};

// 🚀 Inicializar cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
   window.TableroDocente = new TableroDocente();
});

// 📤 Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
   module.exports = TableroDocente;
}

console.log('👨‍🏫 Dashboard Docente cargado correctamente');