/**
 * 📤 COMPONENTE SUBIDOR DE ARCHIVOS
 * Sistema Portafolio Docente UNSAAC
 * 
 * Componente reutilizable para subida de archivos
 * Drag & Drop, múltiples archivos, progreso, validación y preview
 */

class ComponenteSubidorArchivos {
   constructor(configuracion = {}) {
       this.configuracion = {
           // Configuración básica
           contenedor: configuracion.contenedor || '#subidor-archivos',
           multiples: configuracion.multiples !== false,
           dragDrop: configuracion.dragDrop !== false,
           preview: configuracion.preview !== false,
           progreso: configuracion.progreso !== false,
           
           // Configuración de archivos
           tiposPermitidos: configuracion.tiposPermitidos || ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'txt', 'jpg', 'jpeg', 'png'],
           tamañoMaximo: configuracion.tamañoMaximo || 50 * 1024 * 1024, // 50MB
           maxArchivos: configuracion.maxArchivos || 10,
           
           // Configuración de metadatos
           requiereDescripcion: configuracion.requiereDescripcion || false,
           tiposDocumento: configuracion.tiposDocumento || [],
           categorias: configuracion.categorias || [],
           
           // Callbacks
           onSelect: configuracion.onSelect || null,
           onUpload: configuracion.onUpload || null,
           onProgress: configuracion.onProgress || null,
           onComplete: configuracion.onComplete || null,
           onError: configuracion.onError || null,
           
           // Configuración visual
           tema: configuracion.tema || 'default',
           idioma: configuracion.idioma || 'es',
           mostrarTamaños: configuracion.mostrarTamaños !== false,
           mostrarTipos: configuracion.mostrarTipos !== false
       };

       // Estado interno
       this.archivos = new Map();
       this.subiendo = false;
       this.elementos = {};
       this.contadorArchivos = 0;
       
       // Servicio de documentos
       this.servicioDocumentos = window.servicioDocumentos;
       
       // Bind methods
       this.manejarDragOver = this.manejarDragOver.bind(this);
       this.manejarDragLeave = this.manejarDragLeave.bind(this);
       this.manejarDrop = this.manejarDrop.bind(this);
       this.manejarSeleccionArchivos = this.manejarSeleccionArchivos.bind(this);
   }

   /**
    * 🚀 Inicializar el componente
    */
   async inicializar() {
       try {
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
           
           // Aplicar tema
           this.aplicarTema();
           
           console.log('📤 Componente subidor de archivos inicializado');
       } catch (error) {
           console.error('❌ Error inicializando subidor de archivos:', error);
           throw error;
       }
   }

   /**
    * 🏗️ Crear estructura HTML del componente
    */
   crearEstructura() {
       const html = `
           <div class="subidor-archivos" data-tema="${this.configuracion.tema}">
               <!-- Área de drop -->
               <div class="zona-drop ${this.configuracion.dragDrop ? 'drag-drop-enabled' : ''}">
                   <div class="contenido-zona-drop">
                       <div class="icono-subida">
                           <i class="fas fa-cloud-upload-alt"></i>
                       </div>
                       <div class="texto-principal">
                           ${this.configuracion.multiples ? 
                               'Arrastra archivos aquí o haz clic para seleccionar' : 
                               'Arrastra un archivo aquí o haz clic para seleccionar'
                           }
                       </div>
                       <div class="texto-secundario">
                           ${this.obtenerTextoTiposPermitidos()}
                       </div>
                       <button type="button" class="btn-seleccionar">
                           <i class="fas fa-folder-open"></i>
                           Seleccionar ${this.configuracion.multiples ? 'archivos' : 'archivo'}
                       </button>
                   </div>
                   
                   <!-- Input file oculto -->
                   <input 
                       type="file" 
                       class="input-archivo-oculto"
                       ${this.configuracion.multiples ? 'multiple' : ''}
                       accept="${this.obtenerAcceptString()}"
                       style="display: none;"
                   />
               </div>

               <!-- Lista de archivos seleccionados -->
               <div class="lista-archivos" style="display: none;">
                   <div class="header-lista">
                       <h4>Archivos seleccionados</h4>
                       <button type="button" class="btn-limpiar" title="Limpiar lista">
                           <i class="fas fa-trash"></i>
                       </button>
                   </div>
                   <div class="contenedor-archivos"></div>
               </div>

               <!-- Área de metadatos -->
               <div class="area-metadatos" style="display: none;">
                   ${this.crearFormularioMetadatos()}
               </div>

               <!-- Controles de subida -->
               <div class="controles-subida" style="display: none;">
                   <div class="progreso-global" style="display: none;">
                       <div class="barra-progreso">
                           <div class="progreso-fill"></div>
                           <div class="progreso-texto">0%</div>
                       </div>
                   </div>
                   
                   <div class="botones-accion">
                       <button type="button" class="btn btn-primary btn-subir">
                           <i class="fas fa-upload"></i>
                           Subir archivos
                       </button>
                       <button type="button" class="btn btn-secondary btn-cancelar">
                           <i class="fas fa-times"></i>
                           Cancelar
                       </button>
                   </div>
               </div>

               <!-- Área de resultados -->
               <div class="area-resultados" style="display: none;">
                   <div class="header-resultados">
                       <h4>Resultados de la subida</h4>
                   </div>
                   <div class="lista-resultados"></div>
               </div>
           </div>
       `;

       this.contenedor.innerHTML = html;
       
       // Guardar referencias a elementos importantes
       this.elementos = {
           zonaDrop: this.contenedor.querySelector('.zona-drop'),
           inputArchivo: this.contenedor.querySelector('.input-archivo-oculto'),
           btnSeleccionar: this.contenedor.querySelector('.btn-seleccionar'),
           listaArchivos: this.contenedor.querySelector('.lista-archivos'),
           contenedorArchivos: this.contenedor.querySelector('.contenedor-archivos'),
           areaMetadatos: this.contenedor.querySelector('.area-metadatos'),
           controlesSubida: this.contenedor.querySelector('.controles-subida'),
           progresoGlobal: this.contenedor.querySelector('.progreso-global'),
           barraProgreso: this.contenedor.querySelector('.progreso-fill'),
           textoProgreso: this.contenedor.querySelector('.progreso-texto'),
           btnSubir: this.contenedor.querySelector('.btn-subir'),
           btnCancelar: this.contenedor.querySelector('.btn-cancelar'),
           btnLimpiar: this.contenedor.querySelector('.btn-limpiar'),
           areaResultados: this.contenedor.querySelector('.area-resultados'),
           listaResultados: this.contenedor.querySelector('.lista-resultados')
       };
   }

   /**
    * 📝 Crear formulario de metadatos
    */
   crearFormularioMetadatos() {
       let html = '<div class="formulario-metadatos">';
       
       // Descripción (si es requerida)
       if (this.configuracion.requiereDescripcion) {
           html += `
               <div class="campo-metadato">
                   <label for="descripcion-archivos">Descripción</label>
                   <textarea 
                       id="descripcion-archivos" 
                       name="descripcion" 
                       placeholder="Descripción de los archivos..."
                       rows="3"
                   ></textarea>
               </div>
           `;
       }
       
       // Tipo de documento
       if (this.configuracion.tiposDocumento.length > 0) {
           html += `
               <div class="campo-metadato">
                   <label for="tipo-documento">Tipo de documento</label>
                   <select id="tipo-documento" name="tipo_documento">
                       <option value="">Seleccionar tipo...</option>
                       ${this.configuracion.tiposDocumento.map(tipo => 
                           `<option value="${tipo.valor}">${tipo.etiqueta}</option>`
                       ).join('')}
                   </select>
               </div>
           `;
       }
       
       // Categoría
       if (this.configuracion.categorias.length > 0) {
           html += `
               <div class="campo-metadato">
                   <label for="categoria">Categoría</label>
                   <select id="categoria" name="categoria">
                       <option value="">Seleccionar categoría...</option>
                       ${this.configuracion.categorias.map(categoria => 
                           `<option value="${categoria.valor}">${categoria.etiqueta}</option>`
                       ).join('')}
                   </select>
               </div>
           `;
       }
       
       // Tags
       html += `
           <div class="campo-metadato">
               <label for="tags">Etiquetas</label>
               <input 
                   type="text" 
                   id="tags" 
                   name="tags" 
                   placeholder="Separar con comas..."
               />
               <small>Etiquetas para facilitar la búsqueda</small>
           </div>
       `;
       
       html += '</div>';
       return html;
   }

   /**
    * ⚙️ Configurar eventos del componente
    */
   configurarEventos() {
       // Eventos de drag & drop
       if (this.configuracion.dragDrop) {
           this.elementos.zonaDrop.addEventListener('dragover', this.manejarDragOver);
           this.elementos.zonaDrop.addEventListener('dragleave', this.manejarDragLeave);
           this.elementos.zonaDrop.addEventListener('drop', this.manejarDrop);
       }

       // Eventos de selección de archivos
       this.elementos.btnSeleccionar.addEventListener('click', () => {
           this.elementos.inputArchivo.click();
       });

       this.elementos.zonaDrop.addEventListener('click', (e) => {
           if (e.target === this.elementos.zonaDrop || e.target.closest('.contenido-zona-drop')) {
               this.elementos.inputArchivo.click();
           }
       });

       this.elementos.inputArchivo.addEventListener('change', this.manejarSeleccionArchivos);

       // Eventos de controles
       this.elementos.btnSubir.addEventListener('click', () => {
           this.iniciarSubida();
       });

       this.elementos.btnCancelar.addEventListener('click', () => {
           this.cancelarSubida();
       });

       this.elementos.btnLimpiar.addEventListener('click', () => {
           this.limpiarArchivos();
       });
   }

   // ==========================================
   // MANEJO DE EVENTOS DRAG & DROP
   // ==========================================

   manejarDragOver(e) {
       e.preventDefault();
       e.stopPropagation();
       this.elementos.zonaDrop.classList.add('drag-over');
   }

   manejarDragLeave(e) {
       e.preventDefault();
       e.stopPropagation();
       
       // Solo quitar clase si realmente salimos del área
       const rect = this.elementos.zonaDrop.getBoundingClientRect();
       if (e.clientX < rect.left || e.clientX >= rect.right || 
           e.clientY < rect.top || e.clientY >= rect.bottom) {
           this.elementos.zonaDrop.classList.remove('drag-over');
       }
   }

   manejarDrop(e) {
       e.preventDefault();
       e.stopPropagation();
       this.elementos.zonaDrop.classList.remove('drag-over');

       const archivos = Array.from(e.dataTransfer.files);
       this.procesarArchivos(archivos);
   }

   // ==========================================
   // PROCESAMIENTO DE ARCHIVOS
   // ==========================================

   manejarSeleccionArchivos(e) {
       const archivos = Array.from(e.target.files);
       this.procesarArchivos(archivos);
   }

   /**
    * 🔄 Procesar archivos seleccionados
    */
   async procesarArchivos(archivos) {
       if (!archivos || archivos.length === 0) return;

       try {
           // Validar límite de archivos
           const totalArchivos = this.archivos.size + archivos.length;
           if (totalArchivos > this.configuracion.maxArchivos) {
               throw new Error(`Máximo ${this.configuracion.maxArchivos} archivos permitidos`);
           }

           // Procesar cada archivo
           const archivosValidos = [];
           const errores = [];

           for (const archivo of archivos) {
               try {
                   const validacion = this.validarArchivo(archivo);
                   if (validacion.valido) {
                       const archivoInfo = await this.crearInfoArchivo(archivo);
                       archivosValidos.push(archivoInfo);
                   } else {
                       errores.push({
                           archivo: archivo.name,
                           error: validacion.mensaje
                       });
                   }
               } catch (error) {
                   errores.push({
                       archivo: archivo.name,
                       error: error.message
                   });
               }
           }

           // Agregar archivos válidos
           archivosValidos.forEach(archivo => {
               this.archivos.set(archivo.id, archivo);
           });

           // Mostrar errores si los hay
           if (errores.length > 0) {
               this.mostrarErrores(errores);
           }

           // Actualizar interfaz
           this.actualizarInterfaz();

           // Callback de selección
           if (this.configuracion.onSelect) {
               this.configuracion.onSelect(archivosValidos, errores);
           }

       } catch (error) {
           console.error('❌ Error procesando archivos:', error);
           Utilidades.mostrarNotificacion('error', error.message);
       }
   }

   /**
    * ✅ Validar archivo individual
    */
   validarArchivo(archivo) {
       // Validar que existe
       if (!archivo) {
           return { valido: false, mensaje: 'Archivo no válido' };
       }

       // Validar extensión
       const extension = this.obtenerExtension(archivo.name).toLowerCase();
       if (!this.configuracion.tiposPermitidos.includes(extension)) {
           return { 
               valido: false, 
               mensaje: `Tipo de archivo no permitido: .${extension}` 
           };
       }

       // Validar tamaño
       if (archivo.size > this.configuracion.tamañoMaximo) {
           return { 
               valido: false, 
               mensaje: `Archivo muy grande. Máximo: ${Utilidades.formatearBytes(this.configuracion.tamañoMaximo)}` 
           };
       }

       // Validar nombre
       if (archivo.name.length > 255) {
           return { 
               valido: false, 
               mensaje: 'Nombre de archivo muy largo (máximo 255 caracteres)' 
           };
       }

       return { valido: true, mensaje: 'Archivo válido' };
   }

   /**
    * 📋 Crear información del archivo
    */
   async crearInfoArchivo(archivo) {
       const id = `archivo_${++this.contadorArchivos}_${Date.now()}`;
       const extension = this.obtenerExtension(archivo.name);
       
       const info = {
           id,
           archivo,
           nombre: archivo.name,
           tamaño: archivo.size,
           tipo: archivo.type,
           extension,
           estado: 'pendiente',
           progreso: 0,
           preview: null,
           metadatos: {}
       };

       // Generar preview si es posible
       if (this.configuracion.preview && this.puedeGenerarPreview(archivo)) {
           try {
               info.preview = await this.generarPreview(archivo);
           } catch (error) {
               console.warn('⚠️ Error generando preview:', error);
           }
       }

       return info;
   }

   /**
    * 🖼️ Generar preview del archivo
    */
   async generarPreview(archivo) {
       return new Promise((resolve, reject) => {
           if (!archivo.type.startsWith('image/')) {
               resolve(null);
               return;
           }

           const reader = new FileReader();
           reader.onload = (e) => resolve(e.target.result);
           reader.onerror = () => reject(new Error('Error leyendo archivo'));
           reader.readAsDataURL(archivo);
       });
   }

   // ==========================================
   // INTERFAZ Y VISUALIZACIÓN
   // ==========================================

   /**
    * 🔄 Actualizar interfaz según estado
    */
   actualizarInterfaz() {
       const tieneArchivos = this.archivos.size > 0;
       
       // Mostrar/ocultar secciones
       this.elementos.listaArchivos.style.display = tieneArchivos ? 'block' : 'none';
       this.elementos.areaMetadatos.style.display = tieneArchivos ? 'block' : 'none';
       this.elementos.controlesSubida.style.display = tieneArchivos ? 'block' : 'none';
       
       // Actualizar lista de archivos
       this.renderizarListaArchivos();
       
       // Actualizar botón de subida
       this.elementos.btnSubir.disabled = this.archivos.size === 0 || this.subiendo;
       this.elementos.btnSubir.innerHTML = this.subiendo ? 
           '<i class="fas fa-spinner fa-spin"></i> Subiendo...' : 
           '<i class="fas fa-upload"></i> Subir archivos';
   }

   /**
    * 📋 Renderizar lista de archivos
    */
   renderizarListaArchivos() {
       let html = '';
       
       for (const [id, archivo] of this.archivos) {
           html += this.crearElementoArchivo(archivo);
       }
       
       this.elementos.contenedorArchivos.innerHTML = html;
       
       // Configurar eventos de elementos individuales
       this.configurarEventosArchivos();
   }

   /**
    * 📄 Crear elemento HTML de archivo individual
    */
   crearElementoArchivo(archivo) {
       const iconoTipo = this.obtenerIconoTipo(archivo.extension);
       const estadoClase = `estado-${archivo.estado}`;
       
       return `
           <div class="elemento-archivo ${estadoClase}" data-archivo-id="${archivo.id}">
               <div class="archivo-info">
                   <div class="archivo-icono">
                       ${archivo.preview ? 
                           `<img src="${archivo.preview}" alt="Preview" class="archivo-preview">` :
                           `<i class="${iconoTipo}"></i>`
                       }
                   </div>
                   <div class="archivo-detalles">
                       <div class="archivo-nombre" title="${archivo.nombre}">
                           ${archivo.nombre}
                       </div>
                       <div class="archivo-meta">
                           <span class="archivo-tamaño">${Utilidades.formatearBytes(archivo.tamaño)}</span>
                           <span class="archivo-tipo">.${archivo.extension.toUpperCase()}</span>
                       </div>
                   </div>
               </div>
               
               <div class="archivo-estado">
                   ${this.crearElementoEstado(archivo)}
               </div>
               
               <div class="archivo-acciones">
                   <button type="button" class="btn-eliminar-archivo" data-archivo-id="${archivo.id}" title="Eliminar">
                       <i class="fas fa-times"></i>
                   </button>
               </div>
               
               ${archivo.estado === 'subiendo' ? `
                   <div class="progreso-archivo">
                       <div class="progreso-barra">
                           <div class="progreso-fill" style="width: ${archivo.progreso}%"></div>
                       </div>
                       <div class="progreso-porcentaje">${archivo.progreso}%</div>
                   </div>
               ` : ''}
               
               ${archivo.error ? `
                   <div class="archivo-error">
                       <i class="fas fa-exclamation-triangle"></i>
                       ${archivo.error}
                   </div>
               ` : ''}
           </div>
       `;
   }

   /**
    * ⚙️ Configurar eventos de archivos individuales
    */
   configurarEventosArchivos() {
       // Botones de eliminar
       this.elementos.contenedorArchivos.querySelectorAll('.btn-eliminar-archivo').forEach(boton => {
           boton.addEventListener('click', (e) => {
               const archivoId = e.target.closest('button').dataset.archivoId;
               this.eliminarArchivo(archivoId);
           });
       });
   }

   // ==========================================
   // SUBIDA DE ARCHIVOS
   // ==========================================

   /**
    * 🚀 Iniciar proceso de subida
    */
   async iniciarSubida() {
       if (this.archivos.size === 0 || this.subiendo) return;

       try {
           this.subiendo = true;
           this.actualizarInterfaz();
           
           // Mostrar progreso global
           this.elementos.progresoGlobal.style.display = 'block';
           
           // Obtener metadatos comunes
           const metadatosComunes = this.obtenerMetadatosFormulario();
           
           // Subir archivos
           const resultados = await this.subirArchivos(metadatosComunes);
           
           // Mostrar resultados
           this.mostrarResultados(resultados);
           
           // Callback de completado
           if (this.configuracion.onComplete) {
               this.configuracion.onComplete(resultados);
           }

       } catch (error) {
           console.error('❌ Error en subida:', error);
           if (this.configuracion.onError) {
               this.configuracion.onError(error);
           }
       } finally {
           this.subiendo = false;
           this.actualizarInterfaz();
       }
   }

   /**
    * 📤 Subir archivos al servidor
    */
   async subirArchivos(metadatosComunes) {
       const resultados = [];
       const archivosArray = Array.from(this.archivos.values());
       let archivosCompletados = 0;

       for (const archivo of archivosArray) {
           try {
               // Actualizar estado
               archivo.estado = 'subiendo';
               this.actualizarElementoArchivo(archivo);

               // Configurar progreso individual
               const configuracionSubida = {
                   ...metadatosComunes,
                   onProgress: (porcentaje) => {
                       archivo.progreso = porcentaje;
                       this.actualizarElementoArchivo(archivo);
                       this.actualizarProgresoGlobal(archivosCompletados, archivosArray.length, porcentaje);
                   }
               };

               // Subir archivo
               const resultado = await this.servicioDocumentos.subirDocumento(
                   archivo.archivo, 
                   configuracionSubida
               );

               // Marcar como completado
               archivo.estado = 'completado';
               archivo.progreso = 100;
               archivo.resultado = resultado;
               
               resultados.push({
                   archivo: archivo.nombre,
                   exito: true,
                   resultado
               });

           } catch (error) {
               console.error(`❌ Error subiendo ${archivo.nombre}:`, error);
               
               archivo.estado = 'error';
               archivo.error = error.message;
               
               resultados.push({
                   archivo: archivo.nombre,
                   exito: false,
                   error: error.message
               });
           }

           archivosCompletados++;
           this.actualizarElementoArchivo(archivo);
       }

       return resultados;
   }

   // ==========================================
   // MÉTODOS AUXILIARES
   // ==========================================

   obtenerExtension(nombreArchivo) {
       return nombreArchivo.split('.').pop() || '';
   }

   obtenerIconoTipo(extension) {
       const iconos = {
           'pdf': 'fas fa-file-pdf text-danger',
           'doc': 'fas fa-file-word text-primary',
           'docx': 'fas fa-file-word text-primary',
           'xls': 'fas fa-file-excel text-success',
           'xlsx': 'fas fa-file-excel text-success',
           'ppt': 'fas fa-file-powerpoint text-warning',
           'pptx': 'fas fa-file-powerpoint text-warning',
           'txt': 'fas fa-file-alt text-secondary',
           'jpg': 'fas fa-file-image text-info',
           'jpeg': 'fas fa-file-image text-info',
           'png': 'fas fa-file-image text-info',
           'gif': 'fas fa-file-image text-info'
       };
       
       return iconos[extension.toLowerCase()] || 'fas fa-file text-secondary';
   }

   puedeGenerarPreview(archivo) {
       return archivo.type.startsWith('image/') && archivo.size < 5 * 1024 * 1024; // 5MB max para preview
   }

   obtenerTextoTiposPermitidos() {
       const tipos = this.configuracion.tiposPermitidos.map(tipo => `.${tipo.toLowerCase()}`);
       const tamañoMax = Utilidades.formatearBytes(this.configuracion.tamañoMaximo);
       
       return `Tipos permitidos: ${tipos.join(', ')} | Tamaño máximo: ${tamañoMax}`;
   }

   obtenerAcceptString() {
       return this.configuracion.tiposPermitidos.map(tipo => {
           const mimeTypes = {
               'pdf': 'application/pdf',
               'doc': 'application/msword',
               'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
               'xls': 'application/vnd.ms-excel',
               'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
               'ppt': 'application/vnd.ms-powerpoint',
               'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
               'txt': 'text/plain',
               'jpg': 'image/jpeg',
               'jpeg': 'image/jpeg',
               'png': 'image/png',
               'gif': 'image/gif'
           };
           
           return mimeTypes[tipo.toLowerCase()] || `.${tipo}`;
       }).join(',');
   }

   obtenerMetadatosFormulario() {
       const metadatos = {};
       
       if (this.configuracion.requiereDescripcion) {
           const descripcion = this.contenedor.querySelector('#descripcion-archivos')?.value;
           if (descripcion) metadatos.descripcion = descripcion;
       }
       
       const tipoDocumento = this.contenedor.querySelector('#tipo-documento')?.value;
       if (tipoDocumento) metadatos.tipoDocumento = tipoDocumento;
       
       const categoria = this.contenedor.querySelector('#categoria')?.value;
       if (categoria) metadatos.categoria = categoria;
       
       const tags = this.contenedor.querySelector('#tags')?.value;
       if (tags) {
           metadatos.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
       }
       
       return metadatos;
   }

   crearElementoEstado(archivo) {
       const estados = {
           'pendiente': '<i class="fas fa-clock text-warning"></i> Pendiente',
           'subiendo': '<i class="fas fa-spinner fa-spin text-info"></i> Subiendo',
           'completado': '<i class="fas fa-check-circle text-success"></i> Completado',
           'error': '<i class="fas fa-exclamation-circle text-danger"></i> Error'
       };
       
       return estados[archivo.estado] || estados['pendiente'];
   }

   actualizarElementoArchivo(archivo) {
       const elemento = this.contenedor.querySelector(`[data-archivo-id="${archivo.id}"]`);
       if (elemento) {
           elemento.outerHTML = this.crearElementoArchivo(archivo);
           this.configurarEventosArchivos();
       }
   }

   actualizarProgresoGlobal(completados, total, progresoActual) {
       const progresoTotal = Math.round(((completados * 100) + progresoActual) / total);
       
       this.elementos.barraProgreso.style.width = `${progresoTotal}%`;
       this.elementos.textoProgreso.textContent = `${progresoTotal}%`;
   }

   eliminarArchivo(archivoId) {
       this.archivos.delete(archivoId);
       this.actualizarInterfaz();
   }

   limpiarArchivos() {
       this.archivos.clear();
       this.actualizarInterfaz();
       this.elementos.areaResultados.style.display = 'none';
   }

   cancelarSubida() {
       this.subiendo = false;
       this.limpiarArchivos();
   }

   mostrarErrores(errores) {
       const mensajes = errores.map(error => `${error.archivo}: ${error.error}`).join('\n');
       Utilidades.mostrarNotificacion('warning', `Algunos archivos no pudieron procesarse:\n${mensajes}`);
   }

   mostrarResultados(resultados) {
       let html = '';
       
       resultados.forEach(resultado => {
           const claseEstado = resultado.exito ? 'text-success' : 'text-danger';
           const icono = resultado.exito ? 'fa-check-circle' : 'fa-exclamation-circle';
           const mensaje = resultado.exito ? 'Subido correctamente' : resultado.error;
           
           html += `
               <div class="resultado-item">
                   <i class="fas ${icono} ${claseEstado}"></i>
                   <span class="archivo-nombre">${resultado.archivo}</span>
                   <span class="resultado-mensaje ${claseEstado}">${mensaje}</span>
               </div>
           `;
       });
       
       this.elementos.listaResultados.innerHTML = html;
       this.elementos.areaResultados.style.display = 'block';
   }

   aplicarTema() {
       this.contenedor.classList.add(`subidor-tema-${this.configuracion.tema}`);
   }

   /**
    * 🧹 Limpiar y destruir el componente
    */
   destruir() {
       if (this.elementos.zonaDrop) {
           this.elementos.zonaDrop.removeEventListener('dragover', this.manejarDragOver);
           this.elementos.zonaDrop.removeEventListener('dragleave', this.manejarDragLeave);
           this.elementos.zonaDrop.removeEventListener('drop', this.manejarDrop);
       }
       
       this.archivos.clear();
       this.elementos = {};
   }
}

// ==========================================
// INICIALIZACIÓN GLOBAL
// ==========================================

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
   module.exports = ComponenteSubidorArchivos;
}