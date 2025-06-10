/**
 * 📤 SUBIR DOCUMENTOS - DOCENTE
 * Sistema Portafolio Docente UNSAAC
 * 
 * Funcionalidad completa para subida de documentos
 * Incluye drag & drop, validación, preview, progreso y gestión de versiones
 */

class SubirDocumentos {
   constructor() {
       this.servicioPortafolios = new ServicioPortafolios();
       this.servicioAutenticacion = new ServicioAutenticacion();
       this.validadorFormularios = new ValidadorFormularios();
       this.sistemaModales = new SistemaModales();
       
       // Estado del componente
       this.estado = {
           portafolioActual: null,
           carpetaActual: null,
           archivosEnCola: [],
           archivosSubiendo: [],
           archivosCompletados: [],
           configuracion: {
               maxTamanoMB: 50,
               formatosPermitidos: ['pdf', 'docx', 'xlsx', 'pptx', 'jpg', 'png'],
               maxArchivosSimultaneos: 5,
               autoSubida: false
           }
       };
       
       // Referencias DOM
       this.elementos = {
           zonaSubida: null,
           inputArchivo: null,
           listaArchivos: null,
           barraProgreso: null,
           contenedorCarpetas: null,
           formularioMetadatos: null
       };
       
       this.init();
   }

   /**
    * 🚀 Inicialización del componente
    */
   async init() {
       try {
           // Verificar permisos de docente
           if (!SistemaAutenticacion.verificarPermiso('docente')) {
               window.location.href = '/paginas/errores/403.html';
               return;
           }

           await this.cargarConfiguracion();
           await this.cargarPortafolioActual();
           await this.inicializarInterfaz();
           this.configurarEventos();
           this.configurarDragAndDrop();
           
           Utilidades.mostrarNotificacion('Listo para subir documentos', 'success');
       } catch (error) {
           console.error('Error inicializando subir documentos:', error);
           Utilidades.mostrarNotificacion('Error al cargar la página', 'error');
       }
   }

   /**
    * ⚙️ Cargar configuración del sistema
    */
   async cargarConfiguracion() {
       try {
           const response = await ClienteAPI.get('/configuracion/subida-archivos');
           this.estado.configuracion = { ...this.estado.configuracion, ...response.data };
       } catch (error) {
           console.warn('Usando configuración por defecto para subida de archivos');
       }
   }

   /**
    * 📁 Cargar portafolio actual del docente
    */
   async cargarPortafolioActual() {
       try {
           // Obtener portafolio desde URL o localStorage
           const urlParams = new URLSearchParams(window.location.search);
           const portafolioId = urlParams.get('portafolio') || localStorage.getItem('portafolio_actual');
           
           if (!portafolioId) {
               throw new Error('No se especificó un portafolio');
           }

           const response = await this.servicioPortafolios.obtenerPorId(portafolioId);
           this.estado.portafolioActual = response.data;
           
           // Cargar carpeta específica si se especifica
           const carpetaId = urlParams.get('carpeta');
           if (carpetaId) {
               await this.cargarCarpeta(carpetaId);
           }
           
       } catch (error) {
           console.error('Error cargando portafolio:', error);
           this.mostrarErrorPortafolio();
       }
   }

   /**
    * 📂 Cargar carpeta específica
    */
   async cargarCarpeta(carpetaId) {
       try {
           const response = await this.servicioPortafolios.obtenerCarpeta(carpetaId);
           this.estado.carpetaActual = response.data;
       } catch (error) {
           console.error('Error cargando carpeta:', error);
           Utilidades.mostrarNotificacion('Error cargando la carpeta', 'error');
       }
   }

   /**
    * 🎨 Inicializar interfaz de usuario
    */
   async inicializarInterfaz() {
       await this.renderizarInterfaz();
       this.configurarElementosDOM();
       this.actualizarBreadcrumb();
       this.cargarEstructuraCarpetas();
   }

   /**
    * 🎨 Renderizar interfaz completa
    */
   async renderizarInterfaz() {
       const container = document.querySelector('#subir-content');
       if (!container) return;

       container.innerHTML = `
           <div class="row g-4">
               <!-- Header con información del portafolio -->
               <div class="col-12">
                   ${this.renderizarHeaderPortafolio()}
               </div>
               
               <!-- Navegación de carpetas -->
               <div class="col-12">
                   ${this.renderizarNavegacionCarpetas()}
               </div>
               
               <!-- Zona principal de subida -->
               <div class="col-lg-8">
                   <div class="card">
                       <div class="card-header">
                           <h5 class="card-title mb-0">
                               <i class="fas fa-cloud-upload-alt me-2"></i>Subir Documentos
                           </h5>
                       </div>
                       <div class="card-body">
                           ${this.renderizarZonaSubida()}
                           ${this.renderizarListaArchivos()}
                       </div>
                   </div>
                   
                   <!-- Progreso de subida -->
                   <div id="progreso-subida" class="mt-3" style="display: none;">
                       ${this.renderizarBarraProgreso()}
                   </div>
               </div>
               
               <!-- Panel lateral -->
               <div class="col-lg-4">
                   <!-- Metadatos del documento -->
                   <div class="card mb-3">
                       <div class="card-header">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-tags me-2"></i>Metadatos del Documento
                           </h6>
                       </div>
                       <div class="card-body">
                           ${this.renderizarFormularioMetadatos()}
                       </div>
                   </div>
                   
                   <!-- Información y ayuda -->
                   <div class="card">
                       <div class="card-header">
                           <h6 class="card-title mb-0">
                               <i class="fas fa-info-circle me-2"></i>Información
                           </h6>
                       </div>
                       <div class="card-body">
                           ${this.renderizarInformacionAyuda()}
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 📋 Renderizar header del portafolio
    */
   renderizarHeaderPortafolio() {
       const portafolio = this.estado.portafolioActual;
       if (!portafolio) return '<div class="alert alert-warning">Cargando información del portafolio...</div>';

       return `
           <div class="card bg-primary text-white">
               <div class="card-body">
                   <div class="row align-items-center">
                       <div class="col-md-8">
                           <h4 class="card-title mb-1">
                               <i class="fas fa-folder-open me-2"></i>
                               ${portafolio.nombre}
                           </h4>
                           <p class="card-text mb-0">
                               <i class="fas fa-book me-1"></i>${portafolio.asignatura_nombre} • 
                               <i class="fas fa-calendar me-1"></i>${portafolio.ciclo_nombre}
                           </p>
                       </div>
                       <div class="col-md-4 text-end">
                           <div class="d-flex align-items-center justify-content-end">
                               <div class="me-3">
                                   <small class="d-block opacity-75">Progreso</small>
                                   <h5 class="mb-0">${Math.round(portafolio.progreso_completado || 0)}%</h5>
                               </div>
                               <div class="progress" style="width: 80px; height: 8px;">
                                   <div class="progress-bar bg-light" role="progressbar" 
                                        style="width: ${portafolio.progreso_completado || 0}%"></div>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 🗂️ Renderizar navegación de carpetas
    */
   renderizarNavegacionCarpetas() {
       return `
           <div class="card">
               <div class="card-body">
                   <div class="d-flex align-items-center justify-content-between">
                       <div>
                           <h6 class="mb-1">Seleccionar Carpeta de Destino</h6>
                           <small class="text-muted">Elige dónde guardar los documentos</small>
                       </div>
                       <button class="btn btn-outline-primary btn-sm" onclick="subirDocumentos.verEstructuraCompleta()">
                           <i class="fas fa-sitemap me-1"></i>Ver Estructura
                       </button>
                   </div>
                   <div id="navegacion-carpetas" class="mt-3">
                       <div class="text-center py-3">
                           <i class="fas fa-spinner fa-spin me-2"></i>Cargando estructura de carpetas...
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * ☁️ Renderizar zona de subida
    */
   renderizarZonaSubida() {
       return `
           <div id="zona-subida" class="upload-zone border-dashed border-2 rounded p-4 text-center mb-3">
               <div class="upload-content">
                   <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                   <h5 class="mb-2">Arrastra archivos aquí o haz clic para seleccionar</h5>
                   <p class="text-muted mb-3">
                       Formatos permitidos: ${this.estado.configuracion.formatosPermitidos.join(', ').toUpperCase()}<br>
                       Tamaño máximo: ${this.estado.configuracion.maxTamanoMB}MB por archivo
                   </p>
                   <input type="file" id="input-archivo" class="d-none" 
                          multiple 
                          accept="${this.obtenerAcceptTypes()}">
                   <button type="button" class="btn btn-primary" onclick="document.getElementById('input-archivo').click()">
                       <i class="fas fa-plus me-2"></i>Seleccionar Archivos
                   </button>
               </div>
               <div class="upload-overlay" style="display: none;">
                   <div class="overlay-content">
                       <i class="fas fa-download fa-2x mb-2"></i>
                       <h5>Suelta los archivos aquí</h5>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 📄 Renderizar lista de archivos
    */
   renderizarListaArchivos() {
       return `
           <div id="lista-archivos" class="upload-files-list">
               <!-- Los archivos se mostrarán aquí dinámicamente -->
           </div>
           
           <!-- Botones de acción -->
           <div id="botones-accion" class="d-flex justify-content-between align-items-center mt-3" style="display: none !important;">
               <div>
                   <button type="button" class="btn btn-outline-danger btn-sm" onclick="subirDocumentos.limpiarLista()">
                       <i class="fas fa-trash me-1"></i>Limpiar Todo
                   </button>
                   <button type="button" class="btn btn-outline-info btn-sm" onclick="subirDocumentos.previsualizarArchivos()">
                       <i class="fas fa-eye me-1"></i>Previsualizar
                   </button>
               </div>
               <div>
                   <button type="button" class="btn btn-success" onclick="subirDocumentos.iniciarSubida()" id="btn-subir-archivos">
                       <i class="fas fa-upload me-2"></i>Subir <span id="contador-archivos">0</span> Archivo(s)
                   </button>
               </div>
           </div>
       `;
   }

   /**
    * 📊 Renderizar barra de progreso
    */
   renderizarBarraProgreso() {
       return `
           <div class="card">
               <div class="card-header">
                   <h6 class="card-title mb-0">
                       <i class="fas fa-tasks me-2"></i>Progreso de Subida
                   </h6>
               </div>
               <div class="card-body">
                   <!-- Progreso general -->
                   <div class="mb-3">
                       <div class="d-flex justify-content-between align-items-center mb-1">
                           <small class="text-muted">Progreso General</small>
                           <small id="progreso-porcentaje" class="text-muted">0%</small>
                       </div>
                       <div class="progress" style="height: 8px;">
                           <div id="barra-progreso-general" class="progress-bar" role="progressbar" style="width: 0%"></div>
                       </div>
                   </div>
                   
                   <!-- Estado de archivos -->
                   <div id="estado-archivos">
                       <!-- Se llenará dinámicamente -->
                   </div>
                   
                   <!-- Botones de control -->
                   <div class="d-flex justify-content-between mt-3">
                       <button type="button" class="btn btn-outline-warning btn-sm" onclick="subirDocumentos.pausarSubida()">
                           <i class="fas fa-pause me-1"></i>Pausar
                       </button>
                       <button type="button" class="btn btn-outline-danger btn-sm" onclick="subirDocumentos.cancelarSubida()">
                           <i class="fas fa-times me-1"></i>Cancelar
                       </button>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 🏷️ Renderizar formulario de metadatos
    */
   renderizarFormularioMetadatos() {
       return `
           <form id="formulario-metadatos">
               <div class="mb-3">
                   <label class="form-label">Tipo de Documento</label>
                   <select class="form-select" name="tipo_documento" required>
                       <option value="">Seleccionar tipo...</option>
                       <option value="silabo">Sílabo</option>
                       <option value="plan_clase">Plan de Clase</option>
                       <option value="material_apoyo">Material de Apoyo</option>
                       <option value="evaluacion">Evaluación</option>
                       <option value="proyecto">Proyecto</option>
                       <option value="investigacion">Investigación</option>
                       <option value="otro">Otro</option>
                   </select>
               </div>
               
               <div class="mb-3">
                   <label class="form-label">Descripción</label>
                   <textarea class="form-control" name="descripcion" rows="3" 
                             placeholder="Describe brevemente el contenido del documento..."></textarea>
               </div>
               
               <div class="mb-3">
                   <label class="form-label">Etiquetas</label>
                   <input type="text" class="form-control" name="etiquetas" 
                          placeholder="Separar con comas">
                   <small class="form-text text-muted">Ej: evaluación, parcial, matemáticas</small>
               </div>
               
               <div class="mb-3">
                   <div class="form-check">
                       <input class="form-check-input" type="checkbox" id="requiere-revision" name="requiere_revision" checked>
                       <label class="form-check-label" for="requiere-revision">
                           Requiere revisión del verificador
                       </label>
                   </div>
               </div>
               
               <div class="mb-3">
                   <div class="form-check">
                       <input class="form-check-input" type="checkbox" id="es-version-final" name="es_version_final">
                       <label class="form-check-label" for="es-version-final">
                           Es versión final
                       </label>
                   </div>
               </div>
           </form>
       `;
   }

   /**
    * ℹ️ Renderizar información y ayuda
    */
   renderizarInformacionAyuda() {
       return `
           <div class="d-flex align-items-center mb-3">
               <div class="flex-shrink-0">
                   <i class="fas fa-file-upload fa-2x text-primary"></i>
               </div>
               <div class="flex-grow-1 ms-3">
                   <h6 class="mb-1">Formatos Soportados</h6>
                   <small class="text-muted">
                       ${this.estado.configuracion.formatosPermitidos.map(formato => 
                           `<span class="badge bg-light text-dark me-1">.${formato}</span>`
                       ).join('')}
                   </small>
               </div>
           </div>
           
           <div class="d-flex align-items-center mb-3">
               <div class="flex-shrink-0">
                   <i class="fas fa-weight-hanging fa-2x text-info"></i>
               </div>
               <div class="flex-grow-1 ms-3">
                   <h6 class="mb-1">Tamaño Máximo</h6>
                   <small class="text-muted">${this.estado.configuracion.maxTamanoMB}MB por archivo</small>
               </div>
           </div>
           
           <div class="d-flex align-items-center mb-3">
               <div class="flex-shrink-0">
                   <i class="fas fa-layer-group fa-2x text-success"></i>
               </div>
               <div class="flex-grow-1 ms-3">
                   <h6 class="mb-1">Archivos Simultáneos</h6>
                   <small class="text-muted">Hasta ${this.estado.configuracion.maxArchivosSimultaneos} archivos</small>
               </div>
           </div>
           
           <hr>
           
           <div class="mb-3">
               <h6 class="mb-2">
                   <i class="fas fa-lightbulb me-1 text-warning"></i>Consejos
               </h6>
               <ul class="small text-muted mb-0">
                   <li>Usa nombres descriptivos para tus archivos</li>
                   <li>Agrupa documentos relacionados en la misma carpeta</li>
                   <li>Completa los metadatos para mejor organización</li>
                   <li>Revisa antes de subir para evitar correcciones</li>
               </ul>
           </div>
           
           <div class="d-grid">
               <button class="btn btn-outline-primary btn-sm" onclick="subirDocumentos.mostrarAyudaDetallada()">
                   <i class="fas fa-question-circle me-1"></i>Ayuda Detallada
               </button>
           </div>
       `;
   }

   /**
    * 🔧 Configurar elementos DOM
    */
   configurarElementosDOM() {
       this.elementos = {
           zonaSubida: document.getElementById('zona-subida'),
           inputArchivo: document.getElementById('input-archivo'),
           listaArchivos: document.getElementById('lista-archivos'),
           barraProgreso: document.getElementById('progreso-subida'),
           contenedorCarpetas: document.getElementById('navegacion-carpetas'),
           formularioMetadatos: document.getElementById('formulario-metadatos')
       };
   }

   /**
    * ⚙️ Configurar eventos
    */
   configurarEventos() {
       // Evento de selección de archivos
       if (this.elementos.inputArchivo) {
           this.elementos.inputArchivo.addEventListener('change', (e) => {
               this.manejarArchivosSeleccionados(e.target.files);
           });
       }

       // Evento de clic en zona de subida
       if (this.elementos.zonaSubida) {
           this.elementos.zonaSubida.addEventListener('click', (e) => {
               if (e.target.closest('.upload-content')) {
                   this.elementos.inputArchivo?.click();
               }
           });
       }

       // Prevenir comportamiento por defecto del navegador
       ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
           document.addEventListener(eventName, this.prevenirDefault, false);
       });
   }

   /**
    * 🎯 Configurar drag and drop
    */
   configurarDragAndDrop() {
       if (!this.elementos.zonaSubida) return;

       // Eventos de drag
       this.elementos.zonaSubida.addEventListener('dragenter', (e) => {
           this.mostrarOverlaySubida();
       });

       this.elementos.zonaSubida.addEventListener('dragover', (e) => {
           e.preventDefault();
           e.dataTransfer.dropEffect = 'copy';
       });

       this.elementos.zonaSubida.addEventListener('dragleave', (e) => {
           if (!this.elementos.zonaSubida.contains(e.relatedTarget)) {
               this.ocultarOverlaySubida();
           }
       });

       this.elementos.zonaSubida.addEventListener('drop', (e) => {
           e.preventDefault();
           this.ocultarOverlaySubida();
           this.manejarArchivosSeleccionados(e.dataTransfer.files);
       });
   }

   /**
    * 📁 Manejar archivos seleccionados
    */
   async manejarArchivosSeleccionados(archivos) {
       try {
           // Convertir FileList a Array
           const archivosArray = Array.from(archivos);
           
           // Validar archivos
           const archivosValidos = await this.validarArchivos(archivosArray);
           
           // Agregar a la cola
           this.agregarArchivosACola(archivosValidos);
           
           // Actualizar interfaz
           this.actualizarListaArchivos();
           this.mostrarBotonesAccion();
           
       } catch (error) {
           console.error('Error manejando archivos:', error);
           Utilidades.mostrarNotificacion('Error procesando archivos', 'error');
       }
   }

   /**
    * ✅ Validar archivos seleccionados
    */
   async validarArchivos(archivos) {
       const archivosValidos = [];
       const errores = [];
       
       for (const archivo of archivos) {
           try {
               // Validar extensión
               const extension = archivo.name.split('.').pop().toLowerCase();
               if (!this.estado.configuracion.formatosPermitidos.includes(extension)) {
                   errores.push(`${archivo.name}: Formato no permitido (.${extension})`);
                   continue;
               }
               
               // Validar tamaño
               const tamanoMB = archivo.size / (1024 * 1024);
               if (tamanoMB > this.estado.configuracion.maxTamanoMB) {
                   errores.push(`${archivo.name}: Tamaño excedido (${tamanoMB.toFixed(1)}MB)`);
                   continue;
               }
               
               // Validar duplicados
               if (this.estado.archivosEnCola.some(a => a.nombre === archivo.name)) {
                   errores.push(`${archivo.name}: Ya está en la cola`);
                   continue;
               }
               
               archivosValidos.push(archivo);
               
           } catch (error) {
               errores.push(`${archivo.name}: Error de validación`);
           }
       }
       
       // Mostrar errores si los hay
       if (errores.length > 0) {
           this.mostrarErroresValidacion(errores);
       }
       
       return archivosValidos;
   }

   /**
    * ➕ Agregar archivos a la cola
    */
   agregarArchivosACola(archivos) {
       archivos.forEach((archivo, index) => {
           const archivoEnCola = {
               id: `archivo_${Date.now()}_${index}`,
               archivo: archivo,
               nombre: archivo.name,
               tamano: archivo.size,
               tipo: archivo.type,
               extension: archivo.name.split('.').pop().toLowerCase(),
               estado: 'en_cola', // en_cola, subiendo, completado, error
               progreso: 0,
               metadatos: {},
               error: null,
               preview: null
           };
           
           this.estado.archivosEnCola.push(archivoEnCola);
           
           // Generar preview si es posible
           this.generarPreview(archivoEnCola);
       });
       
       // Actualizar contador
       this.actualizarContadorArchivos();
   }

   /**
    * 🖼️ Generar preview del archivo
    */
   async generarPreview(archivoEnCola) {
       if (archivoEnCola.archivo.type.startsWith('image/')) {
           try {
               const reader = new FileReader();
               reader.onload = (e) => {
                   archivoEnCola.preview = e.target.result;
                   this.actualizarItemArchivo(archivoEnCola.id);
               };
               reader.readAsDataURL(archivoEnCola.archivo);
           } catch (error) {
               console.warn('Error generando preview:', error);
           }
       }
   }

   /**
    * 📋 Actualizar lista de archivos en la interfaz
    */
   actualizarListaArchivos() {
       if (!this.elementos.listaArchivos) return;
       
       if (this.estado.archivosEnCola.length === 0) {
           this.elementos.listaArchivos.innerHTML = '';
           this.ocultarBotonesAccion();
           return;
       }
       
       this.elementos.listaArchivos.innerHTML = `
           <div class="upload-files-header mb-3">
               <h6 class="mb-0">Archivos Seleccionados (${this.estado.archivosEnCola.length})</h6>
           </div>
           <div class="upload-files-items">
               ${this.estado.archivosEnCola.map(archivo => this.renderizarItemArchivo(archivo)).join('')}
           </div>
       `;
   }

   /**
    * 📄 Renderizar item individual de archivo
    */
   renderizarItemArchivo(archivo) {
       const iconoArchivo = this.obtenerIconoArchivo(archivo.extension);
       const tamanoFormateado = Utilidades.formatearTamanoArchivo(archivo.tamano);
       const estadoClass = this.obtenerClaseEstado(archivo.estado);
       
       return `
           <div class="upload-file-item ${estadoClass}" data-archivo-id="${archivo.id}">
               <div class="file-icon">
                   ${archivo.preview ? 
                       `<img src="${archivo.preview}" alt="Preview" class="file-preview">` :
                       `<i class="${iconoArchivo} fa-2x"></i>`
                   }
               </div>
               <div class="file-info">
                   <div class="file-name">${archivo.nombre}</div>
                   <div class="file-details">
                       <span class="file-size">${tamanoFormateado}</span>
                       <span class="file-type">${archivo.extension.toUpperCase()}</span>
                       <span class="file-status">${this.obtenerTextoEstado(archivo.estado)}</span>
                   </div>
                   ${archivo.estado === 'subiendo' ? `
                       <div class="file-progress mt-2">
                           <div class="progress" style="height: 4px;">
                               <div class="progress-bar" role="progressbar" style="width: ${archivo.progreso}%"></div>
                           </div>
                           <small class="text-muted">${archivo.progreso}%</small>
                       </div>
                   ` : ''}
                   ${archivo.error ? `
                       <div class="file-error mt-2">
                           <small class="text-danger">
                               <i class="fas fa-exclamation-triangle me-1"></i>${archivo.error}
                           </small>
                       </div>
                   ` : ''}
               </div>
               <div class="file-actions">
                   ${archivo.estado === 'en_cola' ? `
                       <button type="button" class="btn btn-sm btn-outline-info" 
                               onclick="subirDocumentos.editarMetadatos('${archivo.id}')" 
                               title="Editar metadatos">
                           <i class="fas fa-edit"></i>
                       </button>
                       <button type="button" class="btn btn-sm btn-outline-danger" 
                               onclick="subirDocumentos.removerArchivo('${archivo.id}')" 
                               title="Remover">
                           <i class="fas fa-times"></i>
                       </button>
                   ` : ''}
                   ${archivo.estado === 'completado' ? `
                       <button type="button" class="btn btn-sm btn-outline-success" 
                               onclick="subirDocumentos.verDocumento('${archivo.id}')" 
                               title="Ver documento">
                           <i class="fas fa-eye"></i>
                       </button>
                   ` : ''}
               </div>
           </div>
       `;
   }

   // =====================================
   // MÉTODOS DE SUBIDA
   // =====================================

   /**
    * 🚀 Iniciar proceso de subida
    */
   async iniciarSubida() {
       try {
           // Validar que hay archivos
           if (this.estado.archivosEnCola.length === 0) {
               Utilidades.mostrarNotificacion('No hay archivos para subir', 'warning');
               return;
           }
           
           // Validar carpeta seleccionada
           if (!this.estado.carpetaActual) {
               Utilidades.mostrarNotificacion('Selecciona una carpeta de destino', 'warning');
               return;
           }
           
           // Obtener metadatos globales
           const metadatosGlobales = this.obtenerMetadatosFormulario();
           
           // Aplicar metadatos a archivos que no los tengan
           this.aplicarMetadatosGlobales(metadatosGlobales);
           
           // Mostrar progreso
           this.mostrarBarraProgreso();
           
           // Iniciar subida secuencial o paralela
           await this.procesarSubidaArchivos();
           
       } catch (error) {
           console.error('Error iniciando subida:', error);
           Utilidades.mostrarNotificacion('Error al iniciar la subida', 'error');
       }
   }

   /**
    * ⚡ Procesar subida de archivos
    */
   async procesarSubidaArchivos() {
       const archivosParaSubir = this.estado.archivosEnCola.filter(a => a.estado === 'en_cola');
       let completados = 0;
       let errores = 0;
       
       // Función para procesar un archivo
       const procesarArchivo = async (archivo) => {
           try {
               archivo.estado = 'subiendo';
               this.actualizarItemArchivo(archivo.id);
               
               const resultado = await this.subirArchivoIndividual(archivo);
               
               archivo.estado = 'completado';
               archivo.documentoId = resultado.id;
               completados++;
               
           } catch (error) {
               archivo.estado = 'error';
               archivo.error = error.message;
               errores++;
               console.error(`Error subiendo ${archivo.nombre}:`, error);
           }
           
           this.actualizarItemArchivo(archivo.id);
           this.actualizarProgresoGeneral(completados + errores, archivosParaSubir.length);
       };
       
       // Procesar archivos con límite de concurrencia
       const limite = this.estado.configuracion.maxArchivosSimultaneos;
       const grupos = this.dividirEnGrupos(archivosParaSubir, limite);
       
       for (const grupo of grupos) {
           await Promise.all(grupo.map(procesarArchivo));
       }
       
       // Finalizar proceso
       this.finalizarSubida(completados, errores);
   }

   /**
    * 📤 Subir archivo individual
    */
   async subirArchivoIndividual(archivo) {
       const formData = new FormData();
       formData.append('archivo', archivo.archivo);
       formData.append('portafolio_id', this.estado.portafolioActual.id);
       formData.append('carpeta_id', this.estado.carpetaActual.id);
       formData.append('metadatos', JSON.stringify(archivo.metadatos));
       
       // Configurar tracking de progreso
       const config = {
           onUploadProgress: (evento) => {
               const progreso = Math.round((evento.loaded * 100) / evento.total);
               archivo.progreso = progreso;
               this.actualizarItemArchivo(archivo.id);
           }
       };
       
       const response = await ClienteAPI.post('/documentos/subir', formData, config);
       return response.data;
   }

   // =====================================
   // MÉTODOS AUXILIARES
   // =====================================

   /**
    * 📊 Actualizar progreso general
    */
   actualizarProgresoGeneral(procesados, total) {
       const porcentaje = Math.round((procesados / total) * 100);
       
       const barraProgreso = document.getElementById('barra-progreso-general');
       const textoPorcentaje = document.getElementById('progreso-porcentaje');
       
       if (barraProgreso) barraProgreso.style.width = `${porcentaje}%`;
       if (textoPorcentaje) textoPorcentaje.textContent = `${porcentaje}%`;
   }

   /**
    * 🎉 Finalizar proceso de subida
    */
   finalizarSubida(completados, errores) {
       const total = completados + errores;
       
       if (errores === 0) {
           Utilidades.mostrarNotificacion(`✅ ${completados} archivo(s) subido(s) correctamente`, 'success');
       } else if (completados === 0) {
           Utilidades.mostrarNotificacion(`❌ Error subiendo todos los archivos`, 'error');
       } else {
           Utilidades.mostrarNotificacion(`⚠️ ${completados} subidos, ${errores} con errores`, 'warning');
       }
       
       // Opcional: Limpiar archivos completados después de un tiempo
       setTimeout(() => {
           this.limpiarArchivosCompletados();
       }, 5000);
   }

   /**
    * 🧹 Limpiar archivos completados
    */
   limpiarArchivosCompletados() {
       this.estado.archivosEnCola = this.estado.archivosEnCola.filter(a => 
           a.estado !== 'completado'
       );
       this.actualizarListaArchivos();
       
       if (this.estado.archivosEnCola.length === 0) {
           this.ocultarBarraProgreso();
       }
   }

   /**
    * 🗂️ Cargar estructura de carpetas
    */
   async cargarEstructuraCarpetas() {
       try {
           const response = await this.servicioPortafolios.obtenerEstructura(
               this.estado.portafolioActual.id
           );
           
           this.renderizarEstructuraCarpetas(response.data);
           
       } catch (error) {
           console.error('Error cargando estructura:', error);
           this.mostrarErrorEstructura();
       }
   }

   /**
    * 🌳 Renderizar estructura de carpetas
    */
   renderizarEstructuraCarpetas(estructura) {
       if (!this.elementos.contenedorCarpetas) return;
       
       this.elementos.contenedorCarpetas.innerHTML = `
           <div class="carpetas-tree">
               ${this.renderizarNodoCarpeta(estructura, 0)}
           </div>
       `;
   }

   /**
    * 📂 Renderizar nodo individual de carpeta
    */
   renderizarNodoCarpeta(nodo, nivel) {
       const identacion = 'margin-left: ' + (nivel * 20) + 'px';
       const activa = this.estado.carpetaActual?.id === nodo.id ? 'active' : '';
       
       let html = `
           <div class="carpeta-item ${activa}" style="${identacion}" 
                onclick="subirDocumentos.seleccionarCarpeta('${nodo.id}')">
               <i class="fas fa-folder${nodo.hijos?.length ? '-open' : ''} me-2"></i>
               ${nodo.nombre}
               ${nodo.requiere_credito ? '<i class="fas fa-star text-warning ms-1" title="Requiere crédito"></i>' : ''}
           </div>
       `;
       
       if (nodo.hijos && nodo.hijos.length > 0) {
           html += nodo.hijos.map(hijo => this.renderizarNodoCarpeta(hijo, nivel + 1)).join('');
       }
       
       return html;
   }

   /**
    * 📂 Seleccionar carpeta de destino
    */
   async seleccionarCarpeta(carpetaId) {
       try {
           await this.cargarCarpeta(carpetaId);
           
           // Actualizar interfaz
           document.querySelectorAll('.carpeta-item').forEach(item => {
               item.classList.remove('active');
           });
           
           document.querySelector(`[onclick="subirDocumentos.seleccionarCarpeta('${carpetaId}')"]`)
               ?.classList.add('active');
           
           Utilidades.mostrarNotificacion(`Carpeta seleccionada: ${this.estado.carpetaActual.nombre}`, 'info');
           
       } catch (error) {
           console.error('Error seleccionando carpeta:', error);
           Utilidades.mostrarNotificacion('Error seleccionando carpeta', 'error');
       }
   }

   // =====================================
   // MÉTODOS DE UTILIDAD
   // =====================================

   /**
    * 🎨 Obtener icono para tipo de archivo
    */
   obtenerIconoArchivo(extension) {
       const iconos = {
           pdf: 'fas fa-file-pdf text-danger',
           docx: 'fas fa-file-word text-primary',
           xlsx: 'fas fa-file-excel text-success',
           pptx: 'fas fa-file-powerpoint text-warning',
           jpg: 'fas fa-file-image text-info',
           png: 'fas fa-file-image text-info',
           txt: 'fas fa-file-alt text-secondary'
       };
       
       return iconos[extension] || 'fas fa-file text-muted';
   }

   /**
    * 📝 Obtener tipos MIME aceptados
    */
   obtenerAcceptTypes() {
       const mimeTypes = {
           pdf: 'application/pdf',
           docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
           xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
           pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
           jpg: 'image/jpeg',
           png: 'image/png',
           txt: 'text/plain'
       };
       
       return this.estado.configuracion.formatosPermitidos
           .map(ext => mimeTypes[ext])
           .filter(Boolean)
           .join(',');
   }

   /**
    * 🏷️ Obtener metadatos del formulario
    */
   obtenerMetadatosFormulario() {
       if (!this.elementos.formularioMetadatos) return {};
       
       const formData = new FormData(this.elementos.formularioMetadatos);
       return Object.fromEntries(formData.entries());
   }

   /**
    * 🏷️ Aplicar metadatos globales
    */
   aplicarMetadatosGlobales(metadatos) {
       this.estado.archivosEnCola.forEach(archivo => {
           if (Object.keys(archivo.metadatos).length === 0) {
               archivo.metadatos = { ...metadatos };
           }
       });
   }

   /**
    * 🔢 Dividir array en grupos
    */
   dividirEnGrupos(array, tamaño) {
       const grupos = [];
       for (let i = 0; i < array.length; i += tamaño) {
           grupos.push(array.slice(i, i + tamaño));
       }
       return grupos;
   }

   /**
    * 🎯 Prevenir comportamiento por defecto
    */
   prevenirDefault(e) {
       e.preventDefault();
       e.stopPropagation();
   }

   /**
    * 🔄 Actualizar breadcrumb
    */
   actualizarBreadcrumb() {
       const breadcrumb = document.querySelector('#breadcrumb');
       if (breadcrumb) {
           breadcrumb.innerHTML = `
               <li class="breadcrumb-item">
                   <i class="fas fa-chalkboard-teacher me-1"></i>Docente
               </li>
               <li class="breadcrumb-item">
                   <a href="/paginas/docente/mis-portafolios.html">Portafolios</a>
               </li>
               <li class="breadcrumb-item active">Subir Documentos</li>
           `;
       }
   }

   // =====================================
   // MÉTODOS DE INTERFAZ
   // =====================================

   mostrarOverlaySubida() {
       this.elementos.zonaSubida?.querySelector('.upload-overlay')?.style.setProperty('display', 'flex');
   }

   ocultarOverlaySubida() {
       this.elementos.zonaSubida?.querySelector('.upload-overlay')?.style.setProperty('display', 'none');
   }

   mostrarBotonesAccion() {
       document.getElementById('botones-accion')?.style.setProperty('display', 'flex', 'important');
   }

   ocultarBotonesAccion() {
       document.getElementById('botones-accion')?.style.setProperty('display', 'none', 'important');
   }

   mostrarBarraProgreso() {
       this.elementos.barraProgreso?.style.setProperty('display', 'block');
   }

   ocultarBarraProgreso() {
       this.elementos.barraProgreso?.style.setProperty('display', 'none');
   }

   actualizarContadorArchivos() {
       const contador = document.getElementById('contador-archivos');
       if (contador) {
           contador.textContent = this.estado.archivosEnCola.length;
       }
   }

   actualizarItemArchivo(archivoId) {
       const elemento = document.querySelector(`[data-archivo-id="${archivoId}"]`);
       if (elemento) {
           const archivo = this.estado.archivosEnCola.find(a => a.id === archivoId);
           if (archivo) {
               elemento.outerHTML = this.renderizarItemArchivo(archivo);
           }
       }
   }

   obtenerClaseEstado(estado) {
       const clases = {
           'en_cola': 'file-pending',
           'subiendo': 'file-uploading',
           'completado': 'file-completed',
           'error': 'file-error'
       };
       return clases[estado] || '';
   }

   obtenerTextoEstado(estado) {
       const textos = {
           'en_cola': 'En cola',
           'subiendo': 'Subiendo...',
           'completado': 'Completado',
           'error': 'Error'
       };
       return textos[estado] || 'Desconocido';
   }

   // =====================================
   // MÉTODOS PÚBLICOS PARA ACCIONES
   // =====================================

   /**
    * 🗑️ Remover archivo de la cola
    */
   removerArchivo(archivoId) {
       this.estado.archivosEnCola = this.estado.archivosEnCola.filter(a => a.id !== archivoId);
       this.actualizarListaArchivos();
       this.actualizarContadorArchivos();
       
       if (this.estado.archivosEnCola.length === 0) {
           this.ocultarBotonesAccion();
       }
   }

   /**
    * 🧹 Limpiar toda la lista
    */
   limpiarLista() {
       this.estado.archivosEnCola = [];
       this.actualizarListaArchivos();
       this.ocultarBotonesAccion();
       this.ocultarBarraProgreso();
   }

   /**
    * ✏️ Editar metadatos de archivo
    */
   editarMetadatos(archivoId) {
       const archivo = this.estado.archivosEnCola.find(a => a.id === archivoId);
       if (!archivo) return;
       
       // Mostrar modal de edición de metadatos
       this.sistemaModales.mostrarModal({
           titulo: `Metadatos: ${archivo.nombre}`,
           contenido: this.renderizarFormularioMetadatosArchivo(archivo),
           botones: [
               {
                   texto: 'Guardar',
                   clase: 'btn-primary',
                   accion: () => this.guardarMetadatosArchivo(archivoId)
               },
               {
                   texto: 'Cancelar',
                   clase: 'btn-secondary'
               }
           ]
       });
   }

   /**
    * 👁️ Previsualizar archivos seleccionados
    */
   previsualizarArchivos() {
       // Implementar previsualización de archivos
       Utilidades.mostrarNotificacion('Función de previsualización en desarrollo', 'info');
   }

   /**
    * ❓ Mostrar ayuda detallada
    */
   mostrarAyudaDetallada() {
       this.sistemaModales.mostrarModal({
           titulo: 'Ayuda - Subir Documentos',
           contenido: this.renderizarAyudaDetallada(),
           botones: [
               {
                   texto: 'Cerrar',
                   clase: 'btn-primary'
               }
           ]
       });
   }

   renderizarAyudaDetallada() {
       return `
           <div class="help-content">
               <h6>🚀 Cómo subir documentos</h6>
               <ol>
                   <li>Selecciona la carpeta de destino en el árbol de navegación</li>
                   <li>Arrastra archivos a la zona de subida o haz clic para seleccionar</li>
                   <li>Completa los metadatos del documento</li>
                   <li>Haz clic en "Subir" para iniciar el proceso</li>
               </ol>
               
               <h6 class="mt-4">📋 Tipos de documento recomendados</h6>
               <ul>
                   <li><strong>Sílabo:</strong> Plan académico de la asignatura</li>
                   <li><strong>Plan de Clase:</strong> Planificación detallada de sesiones</li>
                   <li><strong>Material de Apoyo:</strong> Recursos adicionales para estudiantes</li>
                   <li><strong>Evaluación:</strong> Exámenes, prácticas y rúbricas</li>
               </ul>
               
               <h6 class="mt-4">⚠️ Consideraciones importantes</h6>
               <ul>
                   <li>Los documentos serán revisados por un verificador</li>
                   <li>Puedes subir nuevas versiones si se requieren correcciones</li>
                   <li>Los archivos quedan organizados en tu portafolio automáticamente</li>
                   <li>Usa nombres descriptivos para facilitar la búsqueda</li>
               </ul>
           </div>
       `;
   }
}

// =====================================
// INICIALIZACIÓN GLOBAL
// =====================================

// Variable global para acceso desde HTML
let subirDocumentos;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
   subirDocumentos = new SubirDocumentos();
});

// Cleanup al salir de la página
window.addEventListener('beforeunload', () => {
   if (subirDocumentos) {
       // Limpiar recursos si es necesario
       subirDocumentos = null;
   }
});