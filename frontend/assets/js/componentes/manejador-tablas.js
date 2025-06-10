/**
 * 📊 MANEJADOR DE TABLAS
 * Sistema Portafolio Docente UNSAAC
 * 
 * Componente reutilizable para tablas con DataTables
 * Funcionalidades: búsqueda, filtros, paginación, acciones masivas, exportación
 */

class ComponenteManejadorTablas {
   constructor(configuracion = {}) {
       this.configuracion = {
           // Configuración básica
           contenedor: configuracion.contenedor || '#tabla-container',
           id: configuracion.id || 'tabla-datos',
           
           // Configuración de DataTables
           dataTable: {
               pageLength: configuracion.pageLength || 25,
               lengthMenu: configuracion.lengthMenu || [[10, 25, 50, 100, -1], [10, 25, 50, 100, "Todos"]],
               searching: configuracion.searching !== false,
               ordering: configuracion.ordering !== false,
               paging: configuracion.paging !== false,
               info: configuracion.info !== false,
               responsive: configuracion.responsive !== false,
               stateSave: configuracion.stateSave !== false,
               language: this.obtenerIdiomaDT()
           },

           // Configuración de columnas
           columnas: configuracion.columnas || [],
           columnasVisibles: configuracion.columnasVisibles || [],
           columnasOrdenables: configuracion.columnasOrdenables || [],
           
           // Configuración de datos
           datosURL: configuracion.datosURL || null,
           datosLocales: configuracion.datosLocales || null,
           procesadoDatos: configuracion.procesadoDatos || null,
           
           // Configuración de acciones
           accionesFila: configuracion.accionesFila || [],
           accionesMasivas: configuracion.accionesMasivas || [],
           accionesGlobales: configuracion.accionesGlobales || [],
           
           // Configuración de filtros
           filtros: configuracion.filtros || [],
           filtrosAvanzados: configuracion.filtrosAvanzados || false,
           
           // Configuración de exportación
           exportacion: {
               habilitada: configuracion.exportacion !== false,
               formatos: configuracion.formatosExportacion || ['excel', 'pdf', 'csv'],
               nombre: configuracion.nombreArchivo || 'datos'
           },
           
           // Configuración visual
           tema: configuracion.tema || 'bootstrap4',
           claseTabla: configuracion.claseTabla || 'table table-striped table-bordered table-hover',
           
           // Callbacks
           onInit: configuracion.onInit || null,
           onRowClick: configuracion.onRowClick || null,
           onRowSelect: configuracion.onRowSelect || null,
           onFiltersChange: configuracion.onFiltersChange || null,
           onDataReload: configuracion.onDataReload || null
       };

       // Estado del componente
       this.estado = {
           inicializado: false,
           tabla: null,
           filasSeleccionadas: new Set(),
           filtrosActivos: new Map(),
           ultimaActualizacion: null,
           cargando: false
       };

       // Referencias a elementos DOM
       this.elementos = {};
       
       // Bind methods
       this.manejarSeleccionFila = this.manejarSeleccionFila.bind(this);
       this.manejarClickFila = this.manejarClickFila.bind(this);
       this.manejarCambioFiltro = this.manejarCambioFiltro.bind(this);
       this.actualizarContadorSeleccionadas = this.actualizarContadorSeleccionadas.bind(this);
   }

   /**
    * 🚀 Inicializar el componente
    */
   async inicializar() {
       try {
           console.log('📊 Inicializando manejador de tablas');

           // Obtener contenedor
           this.contenedor = typeof this.configuracion.contenedor === 'string' 
               ? document.querySelector(this.configuracion.contenedor)
               : this.configuracion.contenedor;

           if (!this.contenedor) {
               throw new Error('Contenedor no encontrado');
           }

           // Crear estructura HTML
           this.crearEstructura();
           
           // Configurar DataTable
           await this.configurarDataTable();
           
           // Configurar eventos
           this.configurarEventos();
           
           // Configurar filtros
           this.configurarFiltros();
           
           // Configurar acciones
           this.configurarAcciones();
           
           this.estado.inicializado = true;
           
           // Callback de inicialización
           if (this.configuracion.onInit) {
               this.configuracion.onInit(this);
           }
           
           console.log('✅ Manejador de tablas inicializado');
           
       } catch (error) {
           console.error('❌ Error inicializando manejador de tablas:', error);
           throw error;
       }
   }

   /**
    * 🏗️ Crear estructura HTML del componente
    */
   crearEstructura() {
       const html = `
           <div class="tabla-wrapper">
               <!-- Header con filtros y acciones -->
               <div class="tabla-header">
                   <div class="row align-items-center">
                       <div class="col-md-6">
                           <div class="tabla-filtros-rapidos">
                               ${this.crearFiltrosRapidos()}
                           </div>
                       </div>
                       <div class="col-md-6 text-right">
                           <div class="tabla-acciones-globales">
                               ${this.crearAccionesGlobales()}
                           </div>
                       </div>
                   </div>
                   
                   ${this.configuracion.filtrosAvanzados ? this.crearFiltrosAvanzados() : ''}
               </div>

               <!-- Acciones masivas -->
               <div class="tabla-acciones-masivas" style="display: none;">
                   <div class="alert alert-info">
                       <div class="row align-items-center">
                           <div class="col-md-6">
                               <span class="seleccionadas-texto">0 elementos seleccionados</span>
                           </div>
                           <div class="col-md-6 text-right">
                               <div class="btn-group">
                                   ${this.crearAccionesMasivas()}
                                   <button type="button" class="btn btn-sm btn-outline-secondary btn-deseleccionar-todas">
                                       <i class="fas fa-times"></i>
                                       Deseleccionar
                                   </button>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>

               <!-- Contenedor de la tabla -->
               <div class="tabla-contenedor">
                   <table id="${this.configuracion.id}" class="${this.configuracion.claseTabla}">
                       <thead>
                           ${this.crearEncabezadoTabla()}
                       </thead>
                       <tbody>
                           <!-- Los datos se cargarán dinámicamente -->
                       </tbody>
                   </table>
               </div>

               <!-- Footer con información y exportación -->
               <div class="tabla-footer">
                   <div class="row align-items-center">
                       <div class="col-md-6">
                           <div class="tabla-info">
                               <small class="text-muted">
                                   Última actualización: <span class="ultima-actualizacion">--</span>
                               </small>
                           </div>
                       </div>
                       <div class="col-md-6 text-right">
                           ${this.configuracion.exportacion.habilitada ? this.crearBotonesExportacion() : ''}
                       </div>
                   </div>
               </div>

               <!-- Overlay de carga -->
               <div class="tabla-cargando" style="display: none;">
                   <div class="overlay-contenido">
                       <div class="spinner-border text-primary" role="status">
                           <span class="sr-only">Cargando...</span>
                       </div>
                       <p class="mt-2">Cargando datos...</p>
                   </div>
               </div>
           </div>
       `;

       this.contenedor.innerHTML = html;
       
       // Guardar referencias a elementos importantes
       this.elementos = {
           wrapper: this.contenedor.querySelector('.tabla-wrapper'),
           header: this.contenedor.querySelector('.tabla-header'),
           tabla: this.contenedor.querySelector(`#${this.configuracion.id}`),
           accionesMasivas: this.contenedor.querySelector('.tabla-acciones-masivas'),
           seleccionadasTexto: this.contenedor.querySelector('.seleccionadas-texto'),
           footer: this.contenedor.querySelector('.tabla-footer'),
           ultimaActualizacion: this.contenedor.querySelector('.ultima-actualizacion'),
           cargando: this.contenedor.querySelector('.tabla-cargando')
       };
   }

   /**
    * 📋 Crear encabezado de tabla
    */
   crearEncabezadoTabla() {
       let html = '<tr>';
       
       // Checkbox para seleccionar todas si hay acciones masivas
       if (this.configuracion.accionesMasivas.length > 0) {
           html += `
               <th class="text-center" style="width: 50px;">
                   <div class="form-check">
                       <input type="checkbox" class="form-check-input select-all" id="select-all">
                       <label class="form-check-label" for="select-all"></label>
                   </div>
               </th>
           `;
       }
       
       // Columnas de datos
       this.configuracion.columnas.forEach(columna => {
           const anchoStyle = columna.ancho ? `style="width: ${columna.ancho};"` : '';
           const claseOrdenable = columna.ordenable !== false ? 'sorting' : 'sorting_disabled';
           
           html += `
               <th class="${claseOrdenable}" ${anchoStyle}>
                   ${columna.titulo}
                   ${columna.descripcion ? `<i class="fas fa-info-circle ml-1" title="${columna.descripcion}"></i>` : ''}
               </th>
           `;
       });
       
       // Columna de acciones si hay acciones por fila
       if (this.configuracion.accionesFila.length > 0) {
           html += '<th class="text-center sorting_disabled" style="width: 120px;">Acciones</th>';
       }
       
       html += '</tr>';
       return html;
   }

   /**
    * 🔍 Crear filtros rápidos
    */
   crearFiltrosRapidos() {
       if (this.configuracion.filtros.length === 0) return '';
       
       let html = '<div class="filtros-rapidos">';
       
       this.configuracion.filtros.forEach(filtro => {
           if (filtro.tipo === 'select') {
               html += `
                   <select class="form-control form-control-sm filtro-rapido" 
                           data-filtro="${filtro.campo}" 
                           data-tipo="${filtro.tipo}">
                       <option value="">${filtro.placeholder || 'Todos'}</option>
                       ${filtro.opciones.map(opcion => 
                           `<option value="${opcion.valor}">${opcion.etiqueta}</option>`
                       ).join('')}
                   </select>
               `;
           } else if (filtro.tipo === 'text') {
               html += `
                   <input type="text" 
                          class="form-control form-control-sm filtro-rapido" 
                          data-filtro="${filtro.campo}" 
                          data-tipo="${filtro.tipo}"
                          placeholder="${filtro.placeholder || 'Buscar...'}" />
               `;
           }
       });
       
       html += '</div>';
       return html;
   }

   /**
    * 🔧 Crear filtros avanzados
    */
   crearFiltrosAvanzados() {
       return `
           <div class="filtros-avanzados mt-3" style="display: none;">
               <div class="card">
                   <div class="card-body">
                       <h6 class="card-title">Filtros Avanzados</h6>
                       <div class="row">
                           <!-- Los filtros avanzados se agregarán dinámicamente -->
                       </div>
                       <div class="mt-3">
                           <button type="button" class="btn btn-primary btn-sm btn-aplicar-filtros">
                               <i class="fas fa-filter"></i> Aplicar Filtros
                           </button>
                           <button type="button" class="btn btn-secondary btn-sm btn-limpiar-filtros">
                               <i class="fas fa-times"></i> Limpiar
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 🎯 Crear acciones globales
    */
   crearAccionesGlobales() {
       let html = '<div class="btn-group">';
       
       // Botón de recargar
       html += `
           <button type="button" class="btn btn-outline-secondary btn-sm btn-recargar" title="Recargar">
               <i class="fas fa-sync-alt"></i>
           </button>
       `;
       
       // Botón de filtros avanzados
       if (this.configuracion.filtrosAvanzados) {
           html += `
               <button type="button" class="btn btn-outline-secondary btn-sm btn-toggle-filtros" title="Filtros Avanzados">
                   <i class="fas fa-filter"></i>
               </button>
           `;
       }
       
       // Acciones personalizadas
       this.configuracion.accionesGlobales.forEach(accion => {
           html += `
               <button type="button" 
                       class="btn btn-${accion.clase || 'primary'} btn-sm accion-global" 
                       data-accion="${accion.id}"
                       title="${accion.descripcion || accion.etiqueta}">
                   <i class="${accion.icono}"></i>
                   ${accion.etiqueta}
               </button>
           `;
       });
       
       html += '</div>';
       return html;
   }

   /**
    * 📋 Crear acciones masivas
    */
   crearAccionesMasivas() {
       let html = '';
       
       this.configuracion.accionesMasivas.forEach(accion => {
           html += `
               <button type="button" 
                       class="btn btn-${accion.clase || 'secondary'} btn-sm accion-masiva" 
                       data-accion="${accion.id}"
                       title="${accion.descripcion || accion.etiqueta}">
                   <i class="${accion.icono}"></i>
                   ${accion.etiqueta}
               </button>
           `;
       });
       
       return html;
   }

   /**
    * 📤 Crear botones de exportación
    */
   crearBotonesExportacion() {
       let html = '<div class="btn-group">';
       
       if (this.configuracion.exportacion.formatos.includes('excel')) {
           html += `
               <button type="button" class="btn btn-outline-success btn-sm btn-exportar" data-formato="excel" title="Exportar a Excel">
                   <i class="fas fa-file-excel"></i>
               </button>
           `;
       }
       
       if (this.configuracion.exportacion.formatos.includes('pdf')) {
           html += `
               <button type="button" class="btn btn-outline-danger btn-sm btn-exportar" data-formato="pdf" title="Exportar a PDF">
                   <i class="fas fa-file-pdf"></i>
               </button>
           `;
       }
       
       if (this.configuracion.exportacion.formatos.includes('csv')) {
           html += `
               <button type="button" class="btn btn-outline-info btn-sm btn-exportar" data-formato="csv" title="Exportar a CSV">
                   <i class="fas fa-file-csv"></i>
               </button>
           `;
       }
       
       html += '</div>';
       return html;
   }

   /**
    * ⚙️ Configurar DataTable
    */
   async configurarDataTable() {
       try {
           // Configuración base de DataTable
           const configuracionDT = {
               ...this.configuracion.dataTable,
               columns: this.construirColumnasDataTable(),
               columnDefs: this.construirDefinicionesColumnas(),
               order: this.construirOrdenamiento(),
               dom: this.construirDOM(),
               buttons: this.construirBotones()
           };

           // Configurar fuente de datos
           if (this.configuracion.datosURL) {
               configuracionDT.ajax = {
                   url: this.configuracion.datosURL,
                   type: 'GET',
                   data: (d) => this.construirParametrosAjax(d),
                   dataSrc: this.configuracion.procesadoDatos || 'data'
               };
           } else if (this.configuracion.datosLocales) {
               configuracionDT.data = this.configuracion.datosLocales;
           }

           // Inicializar DataTable
           this.estado.tabla = $(this.elementos.tabla).DataTable(configuracionDT);

           // Configurar eventos de DataTable
           this.configurarEventosDataTable();

       } catch (error) {
           console.error('❌ Error configurando DataTable:', error);
           throw error;
       }
   }

   /**
    * 📊 Construir columnas para DataTable
    */
   construirColumnasDataTable() {
       const columnas = [];
       
       // Columna de checkbox si hay acciones masivas
       if (this.configuracion.accionesMasivas.length > 0) {
           columnas.push({
               data: null,
               orderable: false,
               searchable: false,
               render: (data, type, row, meta) => {
                   return `
                       <div class="form-check text-center">
                           <input type="checkbox" class="form-check-input select-row" value="${row.id || meta.row}">
                       </div>
                   `;
               }
           });
       }
       
       // Columnas de datos
       this.configuracion.columnas.forEach(columna => {
           const columnaDT = {
               data: columna.campo,
               name: columna.campo,
               orderable: columna.ordenable !== false,
               searchable: columna.buscable !== false,
               visible: columna.visible !== false
           };
           
           // Función de renderizado personalizada
           if (columna.render) {
               columnaDT.render = columna.render;
           } else if (columna.tipo) {
               columnaDT.render = this.obtenerRenderTipo(columna.tipo);
           }
           
           columnas.push(columnaDT);
       });
       
       // Columna de acciones si hay acciones por fila
       if (this.configuracion.accionesFila.length > 0) {
           columnas.push({
               data: null,
               orderable: false,
               searchable: false,
               render: (data, type, row) => this.renderizarAccionesFila(row)
           });
       }
       
       return columnas;
   }

   /**
    * 🎨 Renderizar acciones de fila
    */
   renderizarAccionesFila(fila) {
       let html = '<div class="btn-group btn-group-sm">';
       
       this.configuracion.accionesFila.forEach(accion => {
           // Verificar si la acción debe mostrarse para esta fila
           if (accion.condicion && !accion.condicion(fila)) {
               return;
           }
           
           html += `
               <button type="button" 
                       class="btn btn-${accion.clase || 'secondary'} btn-sm accion-fila" 
                       data-accion="${accion.id}"
                       data-id="${fila.id}"
                       title="${accion.descripcion || accion.etiqueta}">
                   <i class="${accion.icono}"></i>
               </button>
           `;
       });
       
       html += '</div>';
       return html;
   }

   /**
    * 🎯 Obtener función de render según tipo
    */
   obtenerRenderTipo(tipo) {
       const renders = {
           'fecha': (data) => {
               if (!data) return '--';
               return Utilidades.formatearFecha(data);
           },
           'fecha_relativa': (data) => {
               if (!data) return '--';
               return Utilidades.formatearFechaRelativa(data);
           },
           'boolean': (data) => {
               return data ? 
                   '<span class="badge badge-success">Sí</span>' : 
                   '<span class="badge badge-secondary">No</span>';
           },
           'badge': (data, type, row, meta) => {
               if (!data) return '--';
               const columna = this.configuracion.columnas[meta.col];
               const config = columna.badgeConfig || {};
               const clase = config[data] || 'secondary';
               return `<span class="badge badge-${clase}">${data}</span>`;
           },
           'numero': (data) => {
               if (data === null || data === undefined) return '--';
               return Number(data).toLocaleString();
           },
           'bytes': (data) => {
               if (!data) return '--';
               return Utilidades.formatearBytes(data);
           },
           'truncate': (data) => {
               if (!data) return '--';
               const limite = 50;
               return data.length > limite ? 
                   `<span title="${data}">${data.substring(0, limite)}...</span>` : 
                   data;
           }
       };
       
       return renders[tipo] || ((data) => data || '--');
   }

   /**
    * ⚙️ Configurar eventos del componente
    */
   configurarEventos() {
       // Eventos de selección
       this.elementos.tabla.addEventListener('change', '.select-all', (e) => {
           const checkboxes = this.elementos.tabla.querySelectorAll('.select-row');
           checkboxes.forEach(checkbox => {
               checkbox.checked = e.target.checked;
           });
           this.actualizarAccionesMasivas();
       });

       this.elementos.tabla.addEventListener('change', '.select-row', this.manejarSeleccionFila);

       // Eventos de acciones
       this.elementos.tabla.addEventListener('click', '.accion-fila', (e) => {
           e.stopPropagation();
           const accion = e.target.closest('button').dataset.accion;
           const id = e.target.closest('button').dataset.id;
           this.ejecutarAccionFila(accion, id);
       });

       // Eventos globales
       this.contenedor.addEventListener('click', '.btn-recargar', () => {
           this.recargarDatos();
       });

       this.contenedor.addEventListener('click', '.btn-toggle-filtros', () => {
           this.toggleFiltrosAvanzados();
       });

       this.contenedor.addEventListener('click', '.accion-global', (e) => {
           const accion = e.target.closest('button').dataset.accion;
           this.ejecutarAccionGlobal(accion);
       });

       // Eventos de exportación
       this.contenedor.addEventListener('click', '.btn-exportar', (e) => {
           const formato = e.target.closest('button').dataset.formato;
           this.exportar(formato);
       });

       // Eventos de filtros
       this.contenedor.addEventListener('change', '.filtro-rapido', this.manejarCambioFiltro);
       this.contenedor.addEventListener('input', '.filtro-rapido', 
           Utilidades.debounce(this.manejarCambioFiltro, 500));

       // Eventos de acciones masivas
       this.contenedor.addEventListener('click', '.accion-masiva', (e) => {
           const accion = e.target.closest('button').dataset.accion;
           this.ejecutarAccionMasiva(accion);
       });

       this.contenedor.addEventListener('click', '.btn-deseleccionar-todas', () => {
           this.deseleccionarTodas();
       });
   }

   /**
    * ⚙️ Configurar eventos de DataTable
    */
   configurarEventosDataTable() {
       // Evento después de cada dibujado
       this.estado.tabla.on('draw', () => {
           this.actualizarUltimaActualizacion();
           this.configurarEventosDinamicos();
       });

       // Evento de clic en fila
       this.elementos.tabla.addEventListener('click', 'tbody tr', this.manejarClickFila);

       // Evento de procesamiento (carga)
       this.estado.tabla.on('processing.dt', (e, settings, processing) => {
           this.mostrarCargando(processing);
       });
   }

   // ==========================================
   // MANEJO DE EVENTOS
   // ==========================================

   /**
    * ✅ Manejar selección de fila
    */
   manejarSeleccionFila(e) {
       const checkbox = e.target;
       const id = checkbox.value;
       
       if (checkbox.checked) {
           this.estado.filasSeleccionadas.add(id);
       } else {
           this.estado.filasSeleccionadas.delete(id);
       }
       
       this.actualizarAccionesMasivas();
       
       if (this.configuracion.onRowSelect) {
           this.configuracion.onRowSelect(id, checkbox.checked, this.estado.filasSeleccionadas);
       }
   }

   /**
    * 🖱️ Manejar clic en fila
    */
   manejarClickFila(e) {
       // Ignorar clics en checkboxes y botones
       if (e.target.closest('.form-check') || e.target.closest('.btn')) {
           return;
       }
       
       const fila = e.target.closest('tr');
       const datos = this.estado.tabla.row(fila).data();
       
       if (this.configuracion.onRowClick) {
           this.configuracion.onRowClick(datos, fila);
       }
   }

   /**
    * 🔍 Manejar cambio de filtro
    */
   manejarCambioFiltro(e) {
       const filtro = e.target.dataset.filtro;
       const valor = e.target.value;
       const tipo = e.target.dataset.tipo;
       
       if (valor) {
           this.estado.filtrosActivos.set(filtro, { valor, tipo });
       } else {
           this.estado.filtrosActivos.delete(filtro);
       }
       
       this.aplicarFiltros();
       
       if (this.configuracion.onFiltersChange) {
           this.configuracion.onFiltersChange(this.estado.filtrosActivos);
       }
   }

   // ==========================================
   // MÉTODOS PÚBLICOS
   // ==========================================

   /**
    * 🔄 Recargar datos de la tabla
    */
   recargarDatos() {
       if (this.estado.tabla) {
           this.estado.tabla.ajax.reload(null, false);
       }
       
       if (this.configuracion.onDataReload) {
           this.configuracion.onDataReload();
       }
   }

   /**
    * 🔍 Aplicar filtros a la tabla
    */
   aplicarFiltros() {
       if (!this.estado.tabla) return;
       
       this.estado.filtrosActivos.forEach((configuracion, campo) => {
           if (configuracion.tipo === 'text') {
               this.estado.tabla.column(`${campo}:name`).search(configuracion.valor);
           }
       });
       
       this.estado.tabla.draw();
   }

   /**
    * 🧹 Limpiar todos los filtros
    */
   limpiarFiltros() {
       // Limpiar filtros en UI
       this.contenedor.querySelectorAll('.filtro-rapido').forEach(filtro => {
           filtro.value = '';
       });
       
       // Limpiar estado interno
       this.estado.filtrosActivos.clear();
       
       // Limpiar filtros en DataTable
       if (this.estado.tabla) {
           this.estado.tabla.search('').columns().search('').draw();
       }
   }

   /**
    * 📤 Exportar datos de la tabla
    */
   async exportar(formato) {
       try {
           const datos = this.obtenerDatosVisibles();
           const nombreArchivo = `${this.configuracion.exportacion.nombre}_${new Date().toISOString().split('T')[0]}`;
           
           switch (formato) {
               case 'excel':
                   await this.exportarExcel(datos, nombreArchivo);
                   break;
               case 'pdf':
                   await this.exportarPDF(datos, nombreArchivo);
                   break;
               case 'csv':
                   await this.exportarCSV(datos, nombreArchivo);
                   break;
               default:
                   throw new Error('Formato de exportación no soportado');
           }
           
           Utilidades.mostrarNotificacion('success', `Datos exportados en formato ${formato.toUpperCase()}`);
           
       } catch (error) {
           console.error('❌ Error exportando datos:', error);
           Utilidades.mostrarNotificacion('error', 'Error al exportar datos');
       }
   }

   /**
    * 📊 Obtener datos visibles de la tabla
    */
   obtenerDatosVisibles() {
       if (!this.estado.tabla) return [];
       
       return this.estado.tabla.rows({ search: 'applied' }).data().toArray();
   }

   /**
    * 📋 Obtener filas seleccionadas
    */
   obtenerFilasSeleccionadas() {
       return Array.from(this.estado.filasSeleccionadas);
   }

   /**
    * ❌ Deseleccionar todas las filas
    */
   deseleccionarTodas() {
       this.estado.filasSeleccionadas.clear();
       
       // Desmarcar checkboxes
       this.contenedor.querySelectorAll('.select-row, .select-all').forEach(checkbox => {
           checkbox.checked = false;
       });
       
       this.actualizarAccionesMasivas();
   }

   /**
    * 🔄 Actualizar datos locales
    */
   actualizarDatos(nuevosDatos) {
       if (this.estado.tabla) {
           this.estado.tabla.clear();
           this.estado.tabla.rows.add(nuevosDatos);
           this.estado.tabla.draw();
       }
   }

   // ==========================================
   // MÉTODOS AUXILIARES
   // ==========================================

   /**
    * 🔄 Actualizar acciones masivas
    */
   actualizarAccionesMasivas() {
       const cantidad = this.estado.filasSeleccionadas.size;
       
       if (cantidad > 0) {
           this.elementos.accionesMasivas.style.display = 'block';
           this.elementos.seleccionadasTexto.textContent = 
               `${cantidad} elemento${cantidad === 1 ? '' : 's'} seleccionado${cantidad === 1 ? '' : 's'}`;
       } else {
           this.elementos.accionesMasivas.style.display = 'none';
       }
   }

   /**
    * ⏰ Actualizar timestamp de última actualización
    */
   actualizarUltimaActualizacion() {
       this.estado.ultimaActualizacion = new Date();
       if (this.elementos.ultimaActualizacion) {
           this.elementos.ultimaActualizacion.textContent = 
               Utilidades.formatearFechaRelativa(this.estado.ultimaActualizacion);
       }
   }

   /**
    * 🔄 Mostrar/ocultar indicador de carga
    */
   mostrarCargando(mostrar) {
       this.estado.cargando = mostrar;
       this.elementos.cargando.style.display = mostrar ? 'flex' : 'none';
   }

   /**
    * 🔧 Toggle filtros avanzados
    */
   toggleFiltrosAvanzados() {
       const filtros = this.contenedor.querySelector('.filtros-avanzados');
       if (filtros) {
           const visible = filtros.style.display !== 'none';
           filtros.style.display = visible ? 'none' : 'block';
       }
   }

   /**
    * ⚙️ Configurar eventos dinámicos
    */
   configurarEventosDinamicos() {
       // Re-configurar eventos para elementos que se crean dinámicamente
       // (esto se ejecuta después de cada redibujado de la tabla)
   }

   /**
    * 🚀 Ejecutar acción de fila
    */
   ejecutarAccionFila(accion, id) {
       const configuracionAccion = this.configuracion.accionesFila.find(a => a.id === accion);
       if (configuracionAccion && configuracionAccion.callback) {
           configuracionAccion.callback(id, this);
       }
   }

   /**
    * 🌐 Ejecutar acción global
    */
   ejecutarAccionGlobal(accion) {
       const configuracionAccion = this.configuracion.accionesGlobales.find(a => a.id === accion);
       if (configuracionAccion && configuracionAccion.callback) {
           configuracionAccion.callback(this);
       }
   }

   /**
    * 📋 Ejecutar acción masiva
    */
   ejecutarAccionMasiva(accion) {
       const filasSeleccionadas = this.obtenerFilasSeleccionadas();
       if (filasSeleccionadas.length === 0) {
           Utilidades.mostrarNotificacion('warning', 'Debe seleccionar al menos un elemento');
           return;
       }
       
       const configuracionAccion = this.configuracion.accionesMasivas.find(a => a.id === accion);
       if (configuracionAccion && configuracionAccion.callback) {
           configuracionAccion.callback(filasSeleccionadas, this);
       }
   }

   /**
    * 🗺️ Construir parámetros AJAX
    */
   construirParametrosAjax(parametrosDT) {
       const parametros = {
           draw: parametrosDT.draw,
           start: parametrosDT.start,
           length: parametrosDT.length,
           search: parametrosDT.search.value
       };
       
       // Agregar filtros activos
       this.estado.filtrosActivos.forEach((config, campo) => {
           parametros[`filtro_${campo}`] = config.valor;
       });
       
       // Agregar ordenamiento
       if (parametrosDT.order && parametrosDT.order.length > 0) {
           const orden = parametrosDT.order[0];
           parametros.order_column = parametrosDT.columns[orden.column].name;
           parametros.order_dir = orden.dir;
       }
       
       return parametros;
   }

   /**
    * 🌍 Obtener configuración de idioma para DataTables
    */
   obtenerIdiomaDT() {
       return {
           "sProcessing": "Procesando...",
           "sLengthMenu": "Mostrar _MENU_ registros",
           "sZeroRecords": "No se encontraron resultados",
           "sEmptyTable": "Ningún dato disponible en esta tabla",
           "sInfo": "Mostrando registros del _START_ al _END_ de un total de _TOTAL_ registros",
           "sInfoEmpty": "Mostrando registros del 0 al 0 de un total de 0 registros",
           "sInfoFiltered": "(filtrado de un total de _MAX_ registros)",
           "sInfoPostFix": "",
           "sSearch": "Buscar:",
           "sUrl": "",
           "sInfoThousands": ",",
           "sLoadingRecords": "Cargando...",
           "oPaginate": {
               "sFirst": "Primero",
               "sLast": "Último",
               "sNext": "Siguiente",
               "sPrevious": "Anterior"
           },
           "oAria": {
               "sSortAscending": ": Activar para ordenar la columna de manera ascendente",
               "sSortDescending": ": Activar para ordenar la columna de manera descendente"
           }
       };
   }

   /**
    * 🏗️ Construir DOM personalizado para DataTables
    */
   construirDOM() {
       return "<'row'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6'f>>" +
              "<'row'<'col-sm-12'tr>>" +
              "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>";
   }

   construirDefinicionesColumnas() {
       return [];
   }

   construirOrdenamiento() {
       return [[1, 'asc']]; // Ordenar por primera columna de datos por defecto
   }

   construirBotones() {
       return [];
   }

   async exportarExcel(datos, nombreArchivo) {
       // Implementar exportación a Excel usando SheetJS
       console.log('Exportando a Excel:', datos);
   }

   async exportarPDF(datos, nombreArchivo) {
       // Implementar exportación a PDF
       console.log('Exportando a PDF:', datos);
   }

   async exportarCSV(datos, nombreArchivo) {
       // Implementar exportación a CSV
       console.log('Exportando a CSV:', datos);
   }

   configurarFiltros() {
       // Configurar filtros avanzados específicos
   }

   configurarAcciones() {
       // Configurar acciones específicas
   }

   /**
    * 🧹 Destruir el componente
    */
   destruir() {
       if (this.estado.tabla) {
           this.estado.tabla.destroy();
       }
       
       this.estado = {};
       this.elementos = {};
       this.configuracion = {};
   }
}

// ==========================================
// INICIALIZACIÓN GLOBAL
// ==========================================

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
   module.exports = ComponenteManejadorTablas;
}