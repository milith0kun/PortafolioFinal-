/**
 * 📊 DASHBOARD ADMINISTRADOR
 * Sistema Portafolio Docente UNSAAC
 * 
 * Panel principal para administradores del sistema
 * Incluye métricas, estadísticas, alertas y accesos rápidos
 */

class TableroAdministrador {
   constructor() {
       this.elementosDOM = {};
       this.datos = {
           metricas: {},
           estadisticas: {},
           alertas: [],
           actividadReciente: [],
           graficos: {}
       };
       
       this.intervalos = {};
       this.graficosInstancias = {};
       
       this.configuracion = {
           actualizacionAutomatica: true,
           intervaloActualizacion: 60000, // 1 minuto
           mostrarAnimaciones: true,
           cargarGraficosCompletos: true
       };

       this.inicializar();
   }

   /**
    * 🚀 Inicializar dashboard de administrador
    */
   async inicializar() {
       try {
           console.log('📊 Inicializando dashboard de administrador...');

           // Verificar permisos de administrador
           this.verificarPermisos();

           // Mapear elementos DOM
           this.mapearElementosDOM();

           // Mostrar estado de carga
           this.mostrarCarga(true);

           // Cargar datos iniciales
           await this.cargarDatosIniciales();

           // Renderizar componentes
           await this.renderizarComponentes();

           // Configurar eventos y actualizaciones
           this.configurarEventos();
           this.configurarActualizacionesAutomaticas();

           console.log('✅ Dashboard de administrador inicializado correctamente');

       } catch (error) {
           console.error('❌ Error al inicializar dashboard:', error);
           this.mostrarErrorInicializacion(error);
       } finally {
           this.mostrarCarga(false);
       }
   }

   /**
    * 🔒 Verificar permisos de administrador
    */
   verificarPermisos() {
       if (!window.auth || !window.auth.estaAutenticado()) {
           window.location.href = '/paginas/autenticacion/login.html';
           return;
       }

       const usuario = window.auth.obtenerUsuario();
       if (usuario.rolActual !== 'administrador') {
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
           contenedorPrincipal: $('#dashboard-administrador'),
           contenedorCarga: $('#contenedor-carga'),
           
           // Métricas principales
           totalUsuarios: $('#total-usuarios'),
           usuariosActivos: $('#usuarios-activos'),
           totalPortafolios: $('#total-portafolios'),
           documentosPendientes: $('#documentos-pendientes'),
           verificacionesHoy: $('#verificaciones-hoy'),
           cicloActivo: $('#ciclo-activo'),
           
           // Tarjetas de estadísticas
           tarjetaUsuarios: $('#tarjeta-usuarios'),
           tarjetaPortafolios: $('#tarjeta-portafolios'),
           tarjetaDocumentos: $('#tarjeta-documentos'),
           tarjetaVerificaciones: $('#tarjeta-verificaciones'),
           
           // Gráficos
           graficoActividad: $('#grafico-actividad'),
           graficoProgreso: $('#grafico-progreso'),
           graficoVerificaciones: $('#grafico-verificaciones'),
           graficoUsuarios: $('#grafico-usuarios'),
           
           // Alertas y notificaciones
           contenedorAlertas: $('#contenedor-alertas'),
           listaAlertas: $('#lista-alertas'),
           badgeAlertas: $('#badge-alertas'),
           
           // Actividad reciente
           listaActividad: $('#lista-actividad'),
           
           // Acciones rápidas
           accionesRapidas: $('#acciones-rapidas'),
           
           // Controles
           btnActualizar: $('#btn-actualizar'),
           btnConfiguracion: $('#btn-configuracion'),
           btnReportes: $('#btn-reportes'),
           selectorPeriodo: $('#selector-periodo'),
           
           // Información adicional
           ultimaActualizacion: $('#ultima-actualizacion'),
           estadoSistema: $('#estado-sistema')
       };
   }

   /**
    * 📊 Cargar datos iniciales
    */
   async cargarDatosIniciales() {
       try {
           console.log('📊 Cargando datos del dashboard...');

           // Cargar métricas principales
           await this.cargarMetricasPrincipales();

           // Cargar estadísticas detalladas
           await this.cargarEstadisticasDetalladas();

           // Cargar alertas del sistema
           await this.cargarAlertasSistema();

           // Cargar actividad reciente
           await this.cargarActividadReciente();

           // Cargar datos para gráficos
           await this.cargarDatosGraficos();

           console.log('✅ Datos del dashboard cargados');

       } catch (error) {
           console.error('❌ Error al cargar datos:', error);
           throw error;
       }
   }

   /**
    * 📈 Cargar métricas principales
    */
   async cargarMetricasPrincipales() {
       try {
           // Simular llamada al API (implementar con servicios reales)
           const response = await window.api.get('/tableros/administrador');
           
           if (response.data.success) {
               this.datos.metricas = response.data.metricas;
               console.log('📈 Métricas principales cargadas:', this.datos.metricas);
           } else {
               // Datos de prueba si falla el API
               this.datos.metricas = {
                   totalUsuarios: 156,
                   usuariosActivos: 89,
                   totalPortafolios: 234,
                   portafoliosCompletos: 187,
                   documentosPendientes: 23,
                   verificacionesHoy: 45,
                   cicloActivo: 'Semestre 2024-I',
                   sistemasOnline: 98.5
               };
           }
       } catch (error) {
           console.warn('⚠️ Error al cargar métricas, usando datos de prueba');
           // Datos de respaldo
           this.datos.metricas = {
               totalUsuarios: 156,
               usuariosActivos: 89,
               totalPortafolios: 234,
               portafoliosCompletos: 187,
               documentosPendientes: 23,
               verificacionesHoy: 45,
               cicloActivo: 'Semestre 2024-I',
               sistemasOnline: 98.5
           };
       }
   }

   /**
    * 📊 Cargar estadísticas detalladas
    */
   async cargarEstadisticasDetalladas() {
       try {
           const periodo = this.obtenerPeriodoSeleccionado();
           const response = await window.api.get('/tableros/administrador/estadisticas', { periodo });
           
           if (response.data.success) {
               this.datos.estadisticas = response.data.estadisticas;
           } else {
               // Datos de prueba
               this.datos.estadisticas = {
                   crecimientoUsuarios: 12.5,
                   eficienciaVerificacion: 87.3,
                   tiempoPromedioVerificacion: 2.4,
                   satisfaccionUsuarios: 4.2,
                   usoCategorias: {
                       syllabus: 45,
                       examenes: 32,
                       proyectos: 18,
                       otros: 5
                   }
               };
           }
       } catch (error) {
           console.warn('⚠️ Error al cargar estadísticas detalladas');
       }
   }

   /**
    * 🚨 Cargar alertas del sistema
    */
   async cargarAlertasSistema() {
       try {
           const response = await window.api.get('/tableros/administrador/alertas');
           
           if (response.data.success) {
               this.datos.alertas = response.data.alertas;
           } else {
               // Alertas de prueba
               this.datos.alertas = [
                   {
                       id: 1,
                       tipo: 'warning',
                       titulo: 'Espacio de almacenamiento',
                       mensaje: 'El almacenamiento está al 85% de su capacidad',
                       fecha: new Date(Date.now() - 2 * 60 * 60 * 1000),
                       accion: 'Ver detalles'
                   },
                   {
                       id: 2,
                       tipo: 'info',
                       titulo: 'Actualización disponible',
                       mensaje: 'Nueva versión del sistema disponible',
                       fecha: new Date(Date.now() - 24 * 60 * 60 * 1000),
                       accion: 'Actualizar'
                   },
                   {
                       id: 3,
                       tipo: 'success',
                       titulo: 'Backup completado',
                       mensaje: 'Backup automático completado exitosamente',
                       fecha: new Date(Date.now() - 6 * 60 * 60 * 1000),
                       accion: null
                   }
               ];
           }
       } catch (error) {
           console.warn('⚠️ Error al cargar alertas del sistema');
           this.datos.alertas = [];
       }
   }

   /**
    * 📋 Cargar actividad reciente
    */
   async cargarActividadReciente() {
       try {
           const response = await window.api.get('/tableros/administrador/actividad-reciente');
           
           if (response.data.success) {
               this.datos.actividadReciente = response.data.actividad;
           } else {
               // Actividad de prueba
               this.datos.actividadReciente = [
                   {
                       usuario: 'Juan Pérez',
                       accion: 'Subió documento',
                       detalle: 'Syllabus - Matemática Discreta',
                       fecha: new Date(Date.now() - 30 * 60 * 1000),
                       tipo: 'documento'
                   },
                   {
                       usuario: 'Ana García',
                       accion: 'Verificó documento',
                       detalle: 'Aprobó examen final',
                       fecha: new Date(Date.now() - 45 * 60 * 1000),
                       tipo: 'verificacion'
                   },
                   {
                       usuario: 'Sistema',
                       accion: 'Ciclo académico',
                       detalle: 'Inicio del período de evaluación',
                       fecha: new Date(Date.now() - 2 * 60 * 60 * 1000),
                       tipo: 'sistema'
                   }
               ];
           }
       } catch (error) {
           console.warn('⚠️ Error al cargar actividad reciente');
           this.datos.actividadReciente = [];
       }
   }

   /**
    * 📈 Cargar datos para gráficos
    */
   async cargarDatosGraficos() {
       try {
           const periodo = this.obtenerPeriodoSeleccionado();
           const response = await window.api.get('/tableros/administrador/graficos', { periodo });
           
           if (response.data.success) {
               this.datos.graficos = response.data.graficos;
           } else {
               // Datos de prueba para gráficos
               this.datos.graficos = {
                   actividad: {
                       labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                       datasets: [{
                           label: 'Documentos subidos',
                           data: [12, 19, 3, 5, 2, 3, 9],
                           borderColor: 'rgb(75, 192, 192)',
                           backgroundColor: 'rgba(75, 192, 192, 0.2)'
                       }]
                   },
                   progreso: {
                       labels: ['Completos', 'En progreso', 'Sin iniciar'],
                       datasets: [{
                           data: [65, 25, 10],
                           backgroundColor: ['#28a745', '#ffc107', '#dc3545']
                       }]
                   },
                   verificaciones: {
                       labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                       datasets: [{
                           label: 'Verificaciones',
                           data: [65, 59, 80, 81, 56, 55],
                           backgroundColor: 'rgba(54, 162, 235, 0.8)'
                       }]
                   }
               };
           }
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
       console.log('🎨 Renderizando componentes del dashboard...');

       // Renderizar métricas principales
       this.renderizarMetricasPrincipales();

       // Renderizar alertas
       this.renderizarAlertas();

       // Renderizar actividad reciente
       this.renderizarActividadReciente();

       // Renderizar gráficos
       await this.renderizarGraficos();

       // Renderizar acciones rápidas
       this.renderizarAccionesRapidas();

       // Actualizar información adicional
       this.actualizarInformacionAdicional();
   }

   /**
    * 📊 Renderizar métricas principales
    */
   renderizarMetricasPrincipales() {
       const metricas = this.datos.metricas;

       // Actualizar valores
       this.actualizarMetrica(this.elementosDOM.totalUsuarios, metricas.totalUsuarios, 'usuarios');
       this.actualizarMetrica(this.elementosDOM.usuariosActivos, metricas.usuariosActivos, 'activos');
       this.actualizarMetrica(this.elementosDOM.totalPortafolios, metricas.totalPortafolios, 'portafolios');
       this.actualizarMetrica(this.elementosDOM.documentosPendientes, metricas.documentosPendientes, 'pendientes');
       this.actualizarMetrica(this.elementosDOM.verificacionesHoy, metricas.verificacionesHoy, 'verificaciones');

       // Ciclo activo
       if (this.elementosDOM.cicloActivo) {
           this.elementosDOM.cicloActivo.textContent = metricas.cicloActivo;
       }

       // Calcular porcentajes y tendencias
       this.calcularTendencias();
   }

   /**
    * 📈 Actualizar métrica individual con animación
    */
   actualizarMetrica(elemento, valor, tipo) {
       if (!elemento) return;

       const valorAnterior = parseInt(elemento.textContent) || 0;
       
       if (this.configuracion.mostrarAnimaciones) {
           this.animarNumero(elemento, valorAnterior, valor);
       } else {
           elemento.textContent = valor;
       }

       // Agregar indicador de tendencia
       this.agregarIndicadorTendencia(elemento, valor, valorAnterior, tipo);
   }

   /**
    * 💫 Animar cambio de número
    */
   animarNumero(elemento, desde, hasta, duracion = 1000) {
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
    * 📊 Calcular tendencias
    */
   calcularTendencias() {
       // Implementar lógica de tendencias comparando con datos anteriores
       // Por ahora, mostrar indicadores estáticos
       const tendencias = {
           usuarios: 5.2,
           portafolios: -2.1,
           verificaciones: 8.7
       };

       this.mostrarTendencias(tendencias);
   }

   /**
    * 🚨 Renderizar alertas
    */
   renderizarAlertas() {
       if (!this.elementosDOM.listaAlertas) return;

       const alertas = this.datos.alertas;
       
       // Actualizar badge
       if (this.elementosDOM.badgeAlertas) {
           const alertasImportantes = alertas.filter(a => a.tipo === 'warning' || a.tipo === 'error').length;
           
           if (alertasImportantes > 0) {
               this.elementosDOM.badgeAlertas.textContent = alertasImportantes;
               this.elementosDOM.badgeAlertas.classList.remove('d-none');
           } else {
               this.elementosDOM.badgeAlertas.classList.add('d-none');
           }
       }

       // Renderizar lista de alertas
       let html = '';
       
       if (alertas.length === 0) {
           html = `
               <div class="text-center p-4">
                   <i class="fas fa-check-circle fa-2x text-success mb-2"></i>
                   <p class="text-muted mb-0">No hay alertas del sistema</p>
               </div>
           `;
       } else {
           alertas.forEach(alerta => {
               const iconos = {
                   success: 'fas fa-check-circle text-success',
                   info: 'fas fa-info-circle text-info',
                   warning: 'fas fa-exclamation-triangle text-warning',
                   error: 'fas fa-exclamation-circle text-danger'
               };

               html += `
                   <div class="alert alert-${alerta.tipo} alert-dismissible fade show" role="alert">
                       <div class="d-flex align-items-start">
                           <i class="${iconos[alerta.tipo]} me-2 mt-1"></i>
                           <div class="flex-grow-1">
                               <strong>${alerta.titulo}</strong>
                               <p class="mb-1 small">${alerta.mensaje}</p>
                               <small class="text-muted">
                                   ${Utils.Fecha.formatearRelativo(alerta.fecha)}
                               </small>
                               ${alerta.accion ? `
                                   <div class="mt-2">
                                       <button class="btn btn-sm btn-outline-${alerta.tipo}" 
                                               onclick="manejarAccionAlerta(${alerta.id})">
                                           ${alerta.accion}
                                       </button>
                                   </div>
                               ` : ''}
                           </div>
                       </div>
                       <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                   </div>
               `;
           });
       }

       this.elementosDOM.listaAlertas.innerHTML = html;
   }

   /**
    * 📋 Renderizar actividad reciente
    */
   renderizarActividadReciente() {
       if (!this.elementosDOM.listaActividad) return;

       const actividades = this.datos.actividadReciente;
       
       let html = '';
       
       if (actividades.length === 0) {
           html = `
               <div class="text-center p-4">
                   <i class="fas fa-history fa-2x text-muted mb-2"></i>
                   <p class="text-muted mb-0">No hay actividad reciente</p>
               </div>
           `;
       } else {
           actividades.forEach(actividad => {
               const iconos = {
                   documento: 'fas fa-file-alt text-primary',
                   verificacion: 'fas fa-check-circle text-success',
                   usuario: 'fas fa-user text-info',
                   sistema: 'fas fa-cog text-secondary'
               };

               html += `
                   <div class="d-flex align-items-start mb-3">
                       <div class="flex-shrink-0 me-3">
                           <i class="${iconos[actividad.tipo]} fa-lg"></i>
                       </div>
                       <div class="flex-grow-1">
                           <div class="fw-bold">${actividad.usuario}</div>
                           <div class="text-muted small">${actividad.accion}</div>
                           <div class="small">${actividad.detalle}</div>
                           <div class="text-muted smaller">
                               ${Utils.Fecha.formatearRelativo(actividad.fecha)}
                           </div>
                       </div>
                   </div>
               `;
           });
       }

       this.elementosDOM.listaActividad.innerHTML = html;
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
           // Gráfico de actividad
           await this.renderizarGraficoActividad();

           // Gráfico de progreso
           await this.renderizarGraficoProgreso();

           // Gráfico de verificaciones
           await this.renderizarGraficoVerificaciones();

       } catch (error) {
           console.error('❌ Error al renderizar gráficos:', error);
       }
   }

   /**
    * 📊 Renderizar gráfico de actividad
    */
   async renderizarGraficoActividad() {
       if (!this.elementosDOM.graficoActividad) return;

       const ctx = this.elementosDOM.graficoActividad.getContext('2d');
       
       // Destruir gráfico anterior si existe
       if (this.graficosInstancias.actividad) {
           this.graficosInstancias.actividad.destroy();
       }

       this.graficosInstancias.actividad = new Chart(ctx, {
           type: 'line',
           data: this.datos.graficos.actividad,
           options: {
               responsive: true,
               maintainAspectRatio: false,
               plugins: {
                   title: {
                       display: true,
                       text: 'Actividad Semanal'
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
    * 🥧 Renderizar gráfico de progreso
    */
   async renderizarGraficoProgreso() {
       if (!this.elementosDOM.graficoProgreso) return;

       const ctx = this.elementosDOM.graficoProgreso.getContext('2d');
       
       if (this.graficosInstancias.progreso) {
           this.graficosInstancias.progreso.destroy();
       }

       this.graficosInstancias.progreso = new Chart(ctx, {
           type: 'doughnut',
           data: this.datos.graficos.progreso,
           options: {
               responsive: true,
               maintainAspectRatio: false,
               plugins: {
                   title: {
                       display: true,
                       text: 'Estado de Portafolios'
                   }
               }
           }
       });
   }

   /**
    * 📊 Renderizar gráfico de verificaciones
    */
   async renderizarGraficoVerificaciones() {
       if (!this.elementosDOM.graficoVerificaciones) return;

       const ctx = this.elementosDOM.graficoVerificaciones.getContext('2d');
       
       if (this.graficosInstancias.verificaciones) {
           this.graficosInstancias.verificaciones.destroy();
       }

       this.graficosInstancias.verificaciones = new Chart(ctx, {
           type: 'bar',
           data: this.datos.graficos.verificaciones,
           options: {
               responsive: true,
               maintainAspectRatio: false,
               plugins: {
                   title: {
                       display: true,
                       text: 'Verificaciones por Mes'
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
               titulo: 'Crear Usuario',
               descripcion: 'Agregar nuevo usuario al sistema',
               icono: 'fas fa-user-plus',
               color: 'primary',
               url: '/paginas/administrador/usuarios.html?accion=crear'
           },
           {
               titulo: 'Cargar Excel',
               descripcion: 'Importar datos desde archivo Excel',
               icono: 'fas fa-file-excel',
               color: 'success',
               url: '/paginas/administrador/carga-excel.html'
           },
           {
               titulo: 'Generar Reporte',
               descripcion: 'Crear reporte del sistema',
               icono: 'fas fa-chart-bar',
               color: 'info',
               url: '/paginas/administrador/reportes.html'
           },
           {
               titulo: 'Configuración',
               descripcion: 'Ajustes del sistema',
               icono: 'fas fa-cogs',
               color: 'warning',
               url: '/paginas/administrador/configuracion.html'
           }
       ];

       let html = '';
       acciones.forEach(accion => {
           html += `
               <div class="col-md-6 col-lg-3 mb-3">
                   <div class="card h-100 border-0 shadow-sm accion-rapida" 
                        onclick="window.location.href='${accion.url}'">
                       <div class="card-body text-center">
                           <div class="mb-3">
                               <i class="${accion.icono} fa-2x text-${accion.color}"></i>
                           </div>
                           <h6 class="card-title">${accion.titulo}</h6>
                           <p class="card-text small text-muted">${accion.descripcion}</p>
                       </div>
                   </div>
               </div>
           `;
       });

       this.elementosDOM.accionesRapidas.innerHTML = html;
   }

   // ==========================================
   // 🔧 EVENTOS Y INTERACCIONES
   // ==========================================

   /**
    * 🔧 Configurar eventos
    */
   configurarEventos() {
       // Botón actualizar
       if (this.elementosDOM.btnActualizar) {
           this.elementosDOM.btnActualizar.addEventListener('click', () => {
               this.actualizarDashboard();
           });
       }

       // Selector de período
       if (this.elementosDOM.selectorPeriodo) {
           this.elementosDOM.selectorPeriodo.addEventListener('change', () => {
               this.cambiarPeriodo();
           });
       }

       // Botones de navegación rápida
       if (this.elementosDOM.btnReportes) {
           this.elementosDOM.btnReportes.addEventListener('click', () => {
               window.location.href = '/paginas/administrador/reportes.html';
           });
       }

       // Click en tarjetas de métricas
       this.configurarClicksMetricas();

       // Eventos de redimensionamiento para gráficos
       window.addEventListener('resize', Utils.Performance.throttle(() => {
           this.redimensionarGraficos();
       }, 250));
   }

   /**
    * 📊 Configurar clicks en métricas
    */
   configurarClicksMetricas() {
       // Click en usuarios
       if (this.elementosDOM.tarjetaUsuarios) {
           this.elementosDOM.tarjetaUsuarios.addEventListener('click', () => {
               window.location.href = '/paginas/administrador/usuarios.html';
           });
       }

       // Click en portafolios
       if (this.elementosDOM.tarjetaPortafolios) {
           this.elementosDOM.tarjetaPortafolios.addEventListener('click', () => {
               window.location.href = '/paginas/administrador/portafolios.html';
           });
       }

       // Click en documentos pendientes
       if (this.elementosDOM.tarjetaDocumentos) {
           this.elementosDOM.tarjetaDocumentos.addEventListener('click', () => {
               window.location.href = '/paginas/verificador/cola-revision.html';
           });
       }
   }

   /**
    * 🔄 Actualizar dashboard
    */
   async actualizarDashboard() {
       try {
           this.mostrarCargaActualizacion(true);
           
           await this.cargarDatosIniciales();
           await this.renderizarComponentes();
           
           this.actualizarTimestamp();
           
           Utils.Notificacion.exito('Dashboard actualizado');
           
       } catch (error) {
           console.error('❌ Error al actualizar dashboard:', error);
           Utils.Notificacion.error('Error al actualizar dashboard');
       } finally {
           this.mostrarCargaActualizacion(false);
       }
   }

   /**
    * 📅 Cambiar período de visualización
    */
   async cambiarPeriodo() {
       try {
           await this.cargarDatosGraficos();
           await this.renderizarGraficos();
           
           console.log('📅 Período cambiado:', this.obtenerPeriodoSeleccionado());
           
       } catch (error) {
           console.error('❌ Error al cambiar período:', error);
       }
   }

   /**
    * 🔄 Configurar actualizaciones automáticas
    */
   configurarActualizacionesAutomaticas() {
       if (!this.configuracion.actualizacionAutomatica) return;

       // Actualizar métricas cada minuto
       this.intervalos.metricas = setInterval(async () => {
           try {
               await this.cargarMetricasPrincipales();
               this.renderizarMetricasPrincipales();
           } catch (error) {
               console.error('Error en actualización automática:', error);
           }
       }, this.configuracion.intervaloActualizacion);

       // Actualizar alertas cada 2 minutos
       this.intervalos.alertas = setInterval(async () => {
           try {
               await this.cargarAlertasSistema();
               this.renderizarAlertas();
           } catch (error) {
               console.error('Error al actualizar alertas:', error);
           }
       }, 2 * 60 * 1000);
   }

   // ==========================================
   // 🛠️ MÉTODOS AUXILIARES
   // ==========================================

   /**
    * 📊 Obtener período seleccionado
    */
   obtenerPeriodoSeleccionado() {
       return this.elementosDOM.selectorPeriodo?.value || '7d';
   }

   /**
    * ⏰ Actualizar timestamp
    */
   actualizarTimestamp() {
       if (this.elementosDOM.ultimaActualizacion) {
           this.elementosDOM.ultimaActualizacion.textContent = 
               Utils.Fecha.formatearFechaHora(new Date());
       }
   }

   /**
    * 📱 Redimensionar gráficos
    */
   redimensionarGraficos() {
       Object.values(this.graficosInstancias).forEach(grafico => {
           if (grafico && typeof grafico.resize === 'function') {
               grafico.resize();
           }
       });
   }

   /**
    * ⏳ Mostrar carga general
    */
   mostrarCarga(mostrar) {
       if (this.elementosDOM.contenedorCarga) {
           this.elementosDOM.contenedorCarga.classList.toggle('d-none', !mostrar);
       }
       
       if (this.elementosDOM.contenedorPrincipal) {
           this.elementosDOM.contenedorPrincipal.classList.toggle('d-none', mostrar);
       }
   }

   /**
    * ⏳ Mostrar carga de actualización
    */
   mostrarCargaActualizacion(mostrar) {
       if (this.elementosDOM.btnActualizar) {
           if (mostrar) {
               this.elementosDOM.btnActualizar.disabled = true;
               this.elementosDOM.btnActualizar.innerHTML = `
                   <span class="spinner-border spinner-border-sm me-2"></span>
                   Actualizando...
               `;
           } else {
               this.elementosDOM.btnActualizar.disabled = false;
               this.elementosDOM.btnActualizar.innerHTML = `
                   <i class="fas fa-sync-alt me-2"></i>
                   Actualizar
               `;
           }
       }
   }

   /**
    * 🚨 Mostrar error de inicialización
    */
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
       
       console.log('🧹 Dashboard de administrador destruido');
   }
}

// 🌐 Funciones globales para eventos
window.manejarAccionAlerta = function(alertaId) {
   console.log('🚨 Manejando acción de alerta:', alertaId);
   // Implementar lógica específica por alerta
};

// 🚀 Inicializar cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
   window.TableroAdministrador = new TableroAdministrador();
});

// 📤 Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
   module.exports = TableroAdministrador;
}

console.log('📊 Dashboard Administrador cargado correctamente');