/**
 * 📊 RASTREADOR DE PROGRESO
 * Sistema Portafolio Docente UNSAAC
 * 
 * Componente para mostrar progreso visual de portafolios
 * Barras de progreso, gráficos circulares, indicadores y métricas
 */

class ComponenteRastreadorProgreso {
   constructor(configuracion = {}) {
       this.configuracion = {
           // Configuración básica
           contenedor: configuracion.contenedor || '#progreso-container',
           tipo: configuracion.tipo || 'barra', // 'barra', 'circular', 'pasos', 'mixto'
           
           // Configuración de datos
           fuente: configuracion.fuente || 'local', // 'local', 'api', 'tiempo-real'
           url: configuracion.url || null,
           intervaloActualizacion: configuracion.intervaloActualizacion || 30000, // 30 segundos
           
           // Configuración visual
           mostrarPorcentaje: configuracion.mostrarPorcentaje !== false,
           mostrarEtiquetas: configuracion.mostrarEtiquetas !== false,
           mostrarMetricas: configuracion.mostrarMetricas !== false,
           animaciones: configuracion.animaciones !== false,
           tema: configuracion.tema || 'default',
           
           // Configuración de umbrales
           umbrales: configuracion.umbrales || {
               critico: 25,    // Rojo
               bajo: 50,       // Amarillo
               medio: 75,      // Azul
               alto: 90,       // Verde claro
               completo: 100   // Verde
           },
           
           // Configuración de colores
           colores: configuracion.colores || {
               critico: '#dc3545',
               bajo: '#ffc107',
               medio: '#17a2b8',
               alto: '#28a745',
               completo: '#155724',
               fondo: '#e9ecef'
           },
           
           // Configuración de métricas
           metricas: {
               mostrarTotalDocumentos: configuracion.mostrarTotalDocumentos !== false,
               mostrarDocumentosSubidos: configuracion.mostrarDocumentosSubidos !== false,
               mostrarDocumentosAprobados: configuracion.mostrarDocumentosAprobados !== false,
               mostrarTiempoRestante: configuracion.mostrarTiempoRestante !== false,
               mostrarUltimaActividad: configuracion.mostrarUltimaActividad !== false
           },
           
           // Callbacks
           onProgress: configuracion.onProgress || null,
           onMilestone: configuracion.onMilestone || null,
           onComplete: configuracion.onComplete || null,
           onClick: configuracion.onClick || null
       };

       // Estado del componente
       this.estado = {
           progreso: 0,
           datosProgreso: null,
           metricas: null,
           intervalos: new Set(),
           ultimaActualizacion: null,
           cargando: false,
           error: null
       };

       // Referencias DOM
       this.elementos = {};
       
       // Servicios
       this.servicioPortafolios = window.servicioPortafolios;
       
       // Bind methods
       this.actualizarProgreso = this.actualizarProgreso.bind(this);
       this.manejarClick = this.manejarClick.bind(this);
   }

   /**
    * 🚀 Inicializar el componente
    */
   async inicializar(datosIniciales = null) {
       try {
           console.log('📊 Inicializando rastreador de progreso');

           // Obtener contenedor
           this.contenedor = typeof this.configuracion.contenedor === 'string' 
               ? document.querySelector(this.configuracion.contenedor)
               : this.configuracion.contenedor;

           if (!this.contenedor) {
               throw new Error('Contenedor no encontrado');
           }

           // Crear estructura HTML
           this.crearEstructura();
           
           // Configurar eventos
           this.configurarEventos();
           
           // Cargar datos iniciales
           if (datosIniciales) {
               this.establecerProgreso(datosIniciales);
           } else {
               await this.cargarDatos();
           }
           
           // Configurar actualización automática
           this.configurarActualizacionAutomatica();
           
           console.log('✅ Rastreador de progreso inicializado');
           
       } catch (error) {
           console.error('❌ Error inicializando rastreador de progreso:', error);
           this.mostrarError(error.message);
       }
   }

   /**
    * 🏗️ Crear estructura HTML del componente
    */
   crearEstructura() {
       const html = `
           <div class="rastreador-progreso ${this.configuracion.tema}">
               <!-- Header con título y controles -->
               <div class="progreso-header">
                   <h6 class="progreso-titulo">Progreso del Portafolio</h6>
                   <div class="progreso-controles">
                       <button type="button" class="btn btn-sm btn-outline-secondary btn-actualizar" title="Actualizar">
                           <i class="fas fa-sync-alt"></i>
                       </button>
                       <button type="button" class="btn btn-sm btn-outline-info btn-detalles" title="Ver detalles">
                           <i class="fas fa-info-circle"></i>
                       </button>
                   </div>
               </div>

               <!-- Indicador principal de progreso -->
               <div class="progreso-principal">
                   ${this.crearIndicadorPrincipal()}
               </div>

               <!-- Métricas detalladas -->
               ${this.configuracion.mostrarMetricas ? this.crearSeccionMetricas() : ''}

               <!-- Progreso por categorías -->
               <div class="progreso-categorias">
                   <!-- Se llenarán dinámicamente -->
               </div>

               <!-- Timeline de actividad reciente -->
               <div class="progreso-timeline" style="display: none;">
                   <h6>Actividad Reciente</h6>
                   <div class="timeline-items">
                       <!-- Se llenarán dinámicamente -->
                   </div>
               </div>

               <!-- Estado de carga/error -->
               <div class="progreso-estado">
                   <div class="cargando" style="display: none;">
                       <div class="spinner-border spinner-border-sm" role="status">
                           <span class="sr-only">Cargando...</span>
                       </div>
                       <span class="ml-2">Actualizando progreso...</span>
                   </div>
                   
                   <div class="error" style="display: none;">
                       <div class="alert alert-danger">
                           <i class="fas fa-exclamation-triangle"></i>
                           <span class="mensaje-error">Error al cargar progreso</span>
                           <button type="button" class="btn btn-sm btn-outline-danger ml-2 btn-reintentar">
                               Reintentar
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       `;

       this.contenedor.innerHTML = html;
       
       // Guardar referencias a elementos importantes
       this.elementos = {
           header: this.contenedor.querySelector('.progreso-header'),
           titulo: this.contenedor.querySelector('.progreso-titulo'),
           btnActualizar: this.contenedor.querySelector('.btn-actualizar'),
           btnDetalles: this.contenedor.querySelector('.btn-detalles'),
           principal: this.contenedor.querySelector('.progreso-principal'),
           metricas: this.contenedor.querySelector('.progreso-metricas'),
           categorias: this.contenedor.querySelector('.progreso-categorias'),
           timeline: this.contenedor.querySelector('.progreso-timeline'),
           timelineItems: this.contenedor.querySelector('.timeline-items'),
           cargando: this.contenedor.querySelector('.cargando'),
           error: this.contenedor.querySelector('.error'),
           mensajeError: this.contenedor.querySelector('.mensaje-error'),
           btnReintentar: this.contenedor.querySelector('.btn-reintentar')
       };
   }

   /**
    * 📊 Crear indicador principal según tipo
    */
   crearIndicadorPrincipal() {
       switch (this.configuracion.tipo) {
           case 'circular':
               return this.crearProgresoCircular();
           case 'pasos':
               return this.crearProgresoPasos();
           case 'mixto':
               return this.crearProgresoMixto();
           default:
               return this.crearProgresoBarra();
       }
   }

   /**
    * 📊 Crear progreso tipo barra
    */
   crearProgresoBarra() {
       return `
           <div class="progreso-barra-container">
               <div class="progreso-info">
                   <span class="progreso-etiqueta">Progreso General</span>
                   <span class="progreso-porcentaje">0%</span>
               </div>
               <div class="progress progreso-barra">
                   <div class="progress-bar progress-bar-animated" 
                        role="progressbar" 
                        style="width: 0%" 
                        aria-valuenow="0" 
                        aria-valuemin="0" 
                        aria-valuemax="100">
                   </div>
               </div>
               <div class="progreso-detalles">
                   <small class="text-muted">
                       <span class="documentos-completados">0</span> de 
                       <span class="documentos-totales">0</span> documentos completados
                   </small>
               </div>
           </div>
       `;
   }

   /**
    * ⭕ Crear progreso circular
    */
   crearProgresoCircular() {
       return `
           <div class="progreso-circular-container">
               <div class="progreso-circular">
                   <svg class="progreso-svg" width="120" height="120">
                       <circle class="progreso-fondo" cx="60" cy="60" r="50" 
                               stroke="${this.configuracion.colores.fondo}" 
                               stroke-width="8" fill="none"></circle>
                       <circle class="progreso-barra-circular" cx="60" cy="60" r="50" 
                               stroke="#007bff" stroke-width="8" fill="none"
                               stroke-dasharray="314" stroke-dashoffset="314"
                               transform="rotate(-90 60 60)"></circle>
                   </svg>
                   <div class="progreso-texto-circular">
                       <span class="progreso-numero">0%</span>
                       <small class="progreso-label">Completado</small>
                   </div>
               </div>
               <div class="progreso-leyenda">
                   <div class="leyenda-item">
                       <span class="leyenda-color bg-success"></span>
                       <span class="leyenda-texto">Completados: <span class="completados">0</span></span>
                   </div>
                   <div class="leyenda-item">
                       <span class="leyenda-color bg-warning"></span>
                       <span class="leyenda-texto">Pendientes: <span class="pendientes">0</span></span>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 👣 Crear progreso por pasos
    */
   crearProgresoPasos() {
       return `
           <div class="progreso-pasos-container">
               <div class="pasos-timeline">
                   <!-- Los pasos se generarán dinámicamente -->
               </div>
               <div class="pasos-resumen">
                   <div class="resumen-item">
                       <span class="resumen-numero paso-actual">1</span>
                       <span class="resumen-texto">Paso Actual</span>
                   </div>
                   <div class="resumen-item">
                       <span class="resumen-numero pasos-totales">0</span>
                       <span class="resumen-texto">Total de Pasos</span>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 🎯 Crear progreso mixto
    */
   crearProgresoMixto() {
       return `
           <div class="progreso-mixto-container">
               <div class="row">
                   <div class="col-md-8">
                       ${this.crearProgresoBarra()}
                   </div>
                   <div class="col-md-4">
                       ${this.crearProgresoCircular()}
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 📈 Crear sección de métricas
    */
   crearSeccionMetricas() {
       return `
           <div class="progreso-metricas">
               <div class="row">
                   <div class="col-6 col-md-3">
                       <div class="metrica-card">
                           <div class="metrica-valor total-documentos">0</div>
                           <div class="metrica-label">Total Docs</div>
                       </div>
                   </div>
                   <div class="col-6 col-md-3">
                       <div class="metrica-card">
                           <div class="metrica-valor docs-subidos">0</div>
                           <div class="metrica-label">Subidos</div>
                       </div>
                   </div>
                   <div class="col-6 col-md-3">
                       <div class="metrica-card">
                           <div class="metrica-valor docs-aprobados">0</div>
                           <div class="metrica-label">Aprobados</div>
                       </div>
                   </div>
                   <div class="col-6 col-md-3">
                       <div class="metrica-card">
                           <div class="metrica-valor tiempo-restante">--</div>
                           <div class="metrica-label">Días Rest.</div>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * ⚙️ Configurar eventos del componente
    */
   configurarEventos() {
       // Botón de actualización manual
       this.elementos.btnActualizar?.addEventListener('click', () => {
           this.cargarDatos(true);
       });

       // Botón de detalles
       this.elementos.btnDetalles?.addEventListener('click', () => {
           this.mostrarDetalles();
       });

       // Botón de reintentar
       this.elementos.btnReintentar?.addEventListener('click', () => {
           this.cargarDatos(true);
       });

       // Click en el progreso principal
       this.elementos.principal?.addEventListener('click', this.manejarClick);

       // Eventos de visibilidad para pausar/reanudar actualizaciones
       document.addEventListener('visibilitychange', () => {
           if (document.hidden) {
               this.pausarActualizaciones();
           } else {
               this.reanudarActualizaciones();
           }
       });
   }

   // ==========================================
   // CARGA Y ACTUALIZACIÓN DE DATOS
   // ==========================================

   /**
    * 📥 Cargar datos de progreso
    */
   async cargarDatos(forzar = false) {
       if (this.estado.cargando && !forzar) return;

       try {
           this.estado.cargando = true;
           this.mostrarCargando(true);
           this.ocultarError();

           let datos;
           
           if (this.configuracion.fuente === 'api' && this.configuracion.url) {
               // Cargar desde API
               const respuesta = await fetch(this.configuracion.url);
               datos = await respuesta.json();
           } else if (this.servicioPortafolios) {
               // Cargar usando el servicio de portafolios
               datos = await this.servicioPortafolios.obtenerProgreso();
           } else {
               throw new Error('No se pudo determinar la fuente de datos');
           }

           this.estado.datosProgreso = datos;
           this.estado.ultimaActualizacion = new Date();
           this.estado.error = null;

           // Actualizar UI
           this.actualizarProgreso(datos);
           this.actualizarMetricas(datos);
           this.actualizarCategorias(datos);

       } catch (error) {
           console.error('❌ Error cargando datos de progreso:', error);
           this.estado.error = error.message;
           this.mostrarError(error.message);
       } finally {
           this.estado.cargando = false;
           this.mostrarCargando(false);
       }
   }

   /**
    * 🔄 Actualizar progreso visual
    */
   actualizarProgreso(datos) {
       const progreso = datos.progreso_general || 0;
       const progresoAnterior = this.estado.progreso;
       this.estado.progreso = progreso;

       // Obtener color según umbral
       const color = this.obtenerColorProgreso(progreso);

       // Actualizar según tipo
       switch (this.configuracion.tipo) {
           case 'circular':
               this.actualizarProgresoCircular(progreso, color);
               break;
           case 'pasos':
               this.actualizarProgresoPasos(datos);
               break;
           case 'mixto':
               this.actualizarProgresoBarra(progreso, color);
               this.actualizarProgresoCircular(progreso, color);
               break;
           default:
               this.actualizarProgresoBarra(progreso, color);
       }

       // Verificar hitos alcanzados
       this.verificarHitos(progresoAnterior, progreso);

       // Callback de progreso
       if (this.configuracion.onProgress) {
           this.configuracion.onProgress(progreso, datos);
       }
   }

   /**
    * 📊 Actualizar barra de progreso
    */
   actualizarProgresoBarra(progreso, color) {
       const barra = this.contenedor.querySelector('.progress-bar');
       const porcentaje = this.contenedor.querySelector('.progreso-porcentaje');
       const completados = this.contenedor.querySelector('.documentos-completados');
       const totales = this.contenedor.querySelector('.documentos-totales');

       if (barra) {
           if (this.configuracion.animaciones) {
               // Animación suave
               barra.style.transition = 'width 1s ease-in-out, background-color 0.3s ease';
           }
           
           barra.style.width = `${progreso}%`;
           barra.style.backgroundColor = color;
           barra.setAttribute('aria-valuenow', progreso);
       }

       if (porcentaje) {
           porcentaje.textContent = `${Math.round(progreso)}%`;
       }

       if (completados && this.estado.datosProgreso) {
           completados.textContent = this.estado.datosProgreso.documentos_completados || 0;
       }

       if (totales && this.estado.datosProgreso) {
           totales.textContent = this.estado.datosProgreso.documentos_totales || 0;
       }
   }

   /**
    * ⭕ Actualizar progreso circular
    */
   actualizarProgresoCircular(progreso, color) {
       const circulo = this.contenedor.querySelector('.progreso-barra-circular');
       const numero = this.contenedor.querySelector('.progreso-numero');
       const completados = this.contenedor.querySelector('.completados');
       const pendientes = this.contenedor.querySelector('.pendientes');

       if (circulo) {
           const circunferencia = 2 * Math.PI * 50; // radio = 50
           const offset = circunferencia - (progreso / 100) * circunferencia;
           
           if (this.configuracion.animaciones) {
               circulo.style.transition = 'stroke-dashoffset 1s ease-in-out, stroke 0.3s ease';
           }
           
           circulo.style.strokeDashoffset = offset;
           circulo.style.stroke = color;
       }

       if (numero) {
           numero.textContent = `${Math.round(progreso)}%`;
       }

       if (completados && this.estado.datosProgreso) {
           completados.textContent = this.estado.datosProgreso.documentos_completados || 0;
       }

       if (pendientes && this.estado.datosProgreso) {
           const total = this.estado.datosProgreso.documentos_totales || 0;
           const comp = this.estado.datosProgreso.documentos_completados || 0;
           pendientes.textContent = total - comp;
       }
   }

   /**
    * 👣 Actualizar progreso por pasos
    */
   actualizarProgresoPasos(datos) {
       const pasosContainer = this.contenedor.querySelector('.pasos-timeline');
       const pasoActual = this.contenedor.querySelector('.paso-actual');
       const pasosTotales = this.contenedor.querySelector('.pasos-totales');

       if (datos.pasos && pasosContainer) {
           let html = '';
           
           datos.pasos.forEach((paso, index) => {
               const completado = paso.completado;
               const actual = paso.actual;
               const claseEstado = completado ? 'completado' : (actual ? 'actual' : 'pendiente');
               
               html += `
                   <div class="paso-item ${claseEstado}">
                       <div class="paso-numero">
                           ${completado ? '<i class="fas fa-check"></i>' : index + 1}
                       </div>
                       <div class="paso-contenido">
                           <div class="paso-titulo">${paso.titulo}</div>
                           <div class="paso-descripcion">${paso.descripcion}</div>
                       </div>
                   </div>
               `;
           });
           
           pasosContainer.innerHTML = html;
       }

       if (pasoActual && datos.paso_actual) {
           pasoActual.textContent = datos.paso_actual;
       }

       if (pasosTotales && datos.pasos) {
           pasosTotales.textContent = datos.pasos.length;
       }
   }

   /**
    * 📊 Actualizar métricas
    */
   actualizarMetricas(datos) {
       if (!this.configuracion.mostrarMetricas || !this.elementos.metricas) return;

       const elementos = {
           totalDocumentos: this.elementos.metricas.querySelector('.total-documentos'),
           docsSubidos: this.elementos.metricas.querySelector('.docs-subidos'),
           docsAprobados: this.elementos.metricas.querySelector('.docs-aprobados'),
           tiempoRestante: this.elementos.metricas.querySelector('.tiempo-restante')
       };

       if (elementos.totalDocumentos) {
           elementos.totalDocumentos.textContent = datos.documentos_totales || 0;
       }

       if (elementos.docsSubidos) {
           elementos.docsSubidos.textContent = datos.documentos_subidos || 0;
       }

       if (elementos.docsAprobados) {
           elementos.docsAprobados.textContent = datos.documentos_aprobados || 0;
       }

       if (elementos.tiempoRestante && datos.fecha_limite) {
           const diasRestantes = this.calcularDiasRestantes(datos.fecha_limite);
           elementos.tiempoRestante.textContent = diasRestantes > 0 ? diasRestantes : 'Vencido';
       }
   }

   /**
    * 📋 Actualizar progreso por categorías
    */
   actualizarCategorias(datos) {
       if (!datos.categorias || !this.elementos.categorias) return;

       let html = '<h6>Progreso por Categoría</h6>';
       
       datos.categorias.forEach(categoria => {
           const color = this.obtenerColorProgreso(categoria.progreso);
           
           html += `
               <div class="categoria-progreso">
                   <div class="categoria-header">
                       <span class="categoria-nombre">${categoria.nombre}</span>
                       <span class="categoria-porcentaje">${Math.round(categoria.progreso)}%</span>
                   </div>
                   <div class="progress categoria-barra">
                       <div class="progress-bar" 
                            style="width: ${categoria.progreso}%; background-color: ${color}"
                            role="progressbar"
                            aria-valuenow="${categoria.progreso}"
                            aria-valuemin="0" 
                            aria-valuemax="100">
                       </div>
                   </div>
                   <div class="categoria-detalles">
                       <small class="text-muted">
                           ${categoria.completados} de ${categoria.total} documentos
                       </small>
                   </div>
               </div>
           `;
       });
       
       this.elementos.categorias.innerHTML = html;
   }

   // ==========================================
   // MÉTODOS AUXILIARES
   // ==========================================

   /**
    * 🎨 Obtener color según progreso
    */
   obtenerColorProgreso(progreso) {
       const umbrales = this.configuracion.umbrales;
       const colores = this.configuracion.colores;

       if (progreso >= umbrales.completo) return colores.completo;
       if (progreso >= umbrales.alto) return colores.alto;
       if (progreso >= umbrales.medio) return colores.medio;
       if (progreso >= umbrales.bajo) return colores.bajo;
       return colores.critico;
   }

   /**
    * 🏆 Verificar hitos alcanzados
    */
   verificarHitos(progresoAnterior, progresoActual) {
       const hitos = [25, 50, 75, 90, 100];
       
       hitos.forEach(hito => {
           if (progresoAnterior < hito && progresoActual >= hito) {
               this.celebrarHito(hito);
               
               if (this.configuracion.onMilestone) {
                   this.configuracion.onMilestone(hito, progresoActual);
               }
           }
       });

       // Verificar completitud
       if (progresoAnterior < 100 && progresoActual >= 100) {
           if (this.configuracion.onComplete) {
               this.configuracion.onComplete(progresoActual);
           }
       }
   }

   /**
    * 🎉 Celebrar hito alcanzado
    */
   celebrarHito(hito) {
       if (!this.configuracion.animaciones) return;

       // Crear efecto visual de celebración
       const celebracion = document.createElement('div');
       celebracion.className = 'hito-celebracion';
       celebracion.innerHTML = `
           <div class="hito-mensaje">
               <i class="fas fa-trophy"></i>
               ¡${hito}% Completado!
           </div>
       `;
       
       this.contenedor.appendChild(celebracion);
       
       // Remover después de la animación
       setTimeout(() => {
           if (celebracion.parentNode) {
               celebracion.parentNode.removeChild(celebracion);
           }
       }, 3000);
   }

   /**
    * 📅 Calcular días restantes
    */
   calcularDiasRestantes(fechaLimite) {
       const hoy = new Date();
       const limite = new Date(fechaLimite);
       const diferencia = limite.getTime() - hoy.getTime();
       return Math.ceil(diferencia / (1000 * 3600 * 24));
   }

   /**
    * 🖱️ Manejar clic en el componente
    */
   manejarClick(evento) {
       if (this.configuracion.onClick) {
           this.configuracion.onClick(this.estado.datosProgreso, evento);
       }
   }

   /**
    * ⏰ Configurar actualización automática
    */
   configurarActualizacionAutomatica() {
       if (this.configuracion.intervaloActualizacion > 0) {
           const intervalo = setInterval(() => {
               if (!document.hidden) {
                   this.cargarDatos();
               }
           }, this.configuracion.intervaloActualizacion);
           
           this.estado.intervalos.add(intervalo);
       }
   }

   /**
    * ⏸️ Pausar actualizaciones
    */
   pausarActualizaciones() {
       this.estado.intervalos.forEach(intervalo => {
           clearInterval(intervalo);
       });
       this.estado.intervalos.clear();
   }

   /**
    * ▶️ Reanudar actualizaciones
    */
   reanudarActualizaciones() {
       this.configurarActualizacionAutomatica();
   }

   // ==========================================
   // MÉTODOS PÚBLICOS
   // ==========================================

   /**
    * 🔄 Establecer progreso manualmente
    */
   establecerProgreso(datos) {
       this.estado.datosProgreso = datos;
       this.actualizarProgreso(datos);
       this.actualizarMetricas(datos);
       this.actualizarCategorias(datos);
   }

   /**
    * 📊 Obtener progreso actual
    */
   obtenerProgreso() {
       return {
           progreso: this.estado.progreso,
           datos: this.estado.datosProgreso,
           ultimaActualizacion: this.estado.ultimaActualizacion
       };
   }

   /**
    * 🔄 Forzar actualización
    */
   async forzarActualizacion() {
       await this.cargarDatos(true);
   }

   /**
    * ℹ️ Mostrar detalles del progreso
    */
   mostrarDetalles() {
       if (!this.estado.datosProgreso) return;

       // Crear modal con detalles
       const modal = document.createElement('div');
       modal.className = 'modal fade';
       modal.innerHTML = `
           <div class="modal-dialog modal-lg">
               <div class="modal-content">
                   <div class="modal-header">
                       <h5 class="modal-title">Detalles del Progreso</h5>
                       <button type="button" class="close" data-dismiss="modal">
                           <span>&times;</span>
                       </button>
                   </div>
                   <div class="modal-body">
                       ${this.generarHTMLDetalles()}
                   </div>
                   <div class="modal-footer">
                       <button type="button" class="btn btn-secondary" data-dismiss="modal">Cerrar</button>
                   </div>
               </div>
           </div>
       `;
       
       document.body.appendChild(modal);
       $(modal).modal('show');
       
       // Remover al cerrar
       $(modal).on('hidden.bs.modal', () => {
           document.body.removeChild(modal);
       });
   }

   /**
    * 📋 Generar HTML de detalles
    */
   generarHTMLDetalles() {
       const datos = this.estado.datosProgreso;
       
       return `
           <div class="progreso-detalles-completo">
               <div class="row">
                   <div class="col-md-6">
                       <h6>Estadísticas Generales</h6>
                       <ul class="list-unstyled">
                           <li><strong>Progreso Total:</strong> ${Math.round(datos.progreso_general || 0)}%</li>
                           <li><strong>Documentos Totales:</strong> ${datos.documentos_totales || 0}</li>
                           <li><strong>Documentos Subidos:</strong> ${datos.documentos_subidos || 0}</li>
                           <li><strong>Documentos Aprobados:</strong> ${datos.documentos_aprobados || 0}</li>
                           <li><strong>Documentos Pendientes:</strong> ${(datos.documentos_totales || 0) - (datos.documentos_subidos || 0)}</li>
                       </ul>
                   </div>
                   <div class="col-md-6">
                       <h6>Información Temporal</h6>
                       <ul class="list-unstyled">
                           <li><strong>Última Actualización:</strong> ${this.estado.ultimaActualizacion ? Utilidades.formatearFechaCompleta(this.estado.ultimaActualizacion) : 'No disponible'}</li>
                           <li><strong>Fecha Límite:</strong> ${datos.fecha_limite ? Utilidades.formatearFecha(datos.fecha_limite) : 'No establecida'}</li>
                           <li><strong>Días Restantes:</strong> ${datos.fecha_limite ? this.calcularDiasRestantes(datos.fecha_limite) : '--'}</li>
                       </ul>
                   </div>
               </div>
               
               ${datos.categorias ? `
                   <div class="mt-4">
                       <h6>Progreso por Categoría</h6>
                       <div class="table-responsive">
                           <table class="table table-sm">
                               <thead>
                                   <tr>
                                       <th>Categoría</th>
                                       <th>Progreso</th>
                                       <th>Completados</th>
                                       <th>Total</th>
                                   </tr>
                               </thead>
                               <tbody>
                                   ${datos.categorias.map(cat => `
                                       <tr>
                                           <td>${cat.nombre}</td>
                                           <td>
                                               <div class="progress" style="height: 20px;">
                                                   <div class="progress-bar" style="width: ${cat.progreso}%">${Math.round(cat.progreso)}%</div>
                                               </div>
                                           </td>
                                           <td>${cat.completados}</td>
                                           <td>${cat.total}</td>
                                       </tr>
                                   `).join('')}
                               </tbody>
                           </table>
                       </div>
                   </div>
               ` : ''}
           </div>
       `;
   }

   // Estados de UI
   mostrarCargando(mostrar) {
       if (this.elementos.cargando) {
           this.elementos.cargando.style.display = mostrar ? 'flex' : 'none';
       }
   }

   mostrarError(mensaje) {
       if (this.elementos.error && this.elementos.mensajeError) {
           this.elementos.mensajeError.textContent = mensaje;
           this.elementos.error.style.display = 'block';
       }
   }

   ocultarError() {
       if (this.elementos.error) {
           this.elementos.error.style.display = 'none';
       }
   }

   /**
    * 🧹 Destruir el componente
    */
   destruir() {
       // Limpiar intervalos
       this.pausarActualizaciones();
       
       // Remover eventos
       document.removeEventListener('visibilitychange', this.pausarActualizaciones);
       
       // Limpiar referencias
       this.elementos = {};
       this.estado = {};
   }
}

// ==========================================
// INICIALIZACIÓN GLOBAL
// ==========================================

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
   module.exports = ComponenteRastreadorProgreso;
}