/**
 * 🪟 SISTEMA DE MODALES
 * Sistema Portafolio Docente UNSAAC
 * 
 * Sistema unificado para gestión de modales reutilizables
 * Incluye confirmaciones, formularios, visualización de contenido y alertas
 */

class SistemaModales {
   constructor() {
       this.modalesActivos = new Map();
       this.contenedorModales = null;
       this.configuracionDefault = {
           backdrop: 'static',
           keyboard: true,
           focus: true,
           show: true
       };
       
       // Plantillas de modales predefinidas
       this.plantillas = {
           confirmacion: 'modal-confirmacion',
           alerta: 'modal-alerta',
           formulario: 'modal-formulario',
           informacion: 'modal-informacion',
           carga: 'modal-carga',
           visorArchivo: 'modal-visor-archivo',
           selector: 'modal-selector',
           progreso: 'modal-progreso'
       };

       this.inicializar();
   }

   /**
    * 🚀 Inicializar sistema de modales
    */
   inicializar() {
       console.log('🪟 Inicializando sistema de modales...');

       // Crear contenedor para modales dinámicos
       this.crearContenedorModales();

       // Precargar plantillas comunes
       this.precargarPlantillas();

       // Configurar eventos globales
       this.configurarEventosGlobales();

       console.log('✅ Sistema de modales inicializado correctamente');
   }

   /**
    * 📦 Crear contenedor para modales dinámicos
    */
   crearContenedorModales() {
       this.contenedorModales = document.createElement('div');
       this.contenedorModales.id = 'contenedor-modales-dinamicos';
       this.contenedorModales.className = 'modales-container';
       document.body.appendChild(this.contenedorModales);
   }

   /**
    * 📋 Precargar plantillas comunes
    */
   precargarPlantillas() {
       // Plantilla base para modales dinámicos
       const plantillaBase = `
           <div class="modal fade" tabindex="-1" role="dialog">
               <div class="modal-dialog modal-dialog-centered" role="document">
                   <div class="modal-content">
                       <div class="modal-header">
                           <h5 class="modal-title"></h5>
                           <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                       </div>
                       <div class="modal-body"></div>
                       <div class="modal-footer"></div>
                   </div>
               </div>
           </div>
       `;

       // Guardar plantilla base
       this.plantillaBase = plantillaBase;
   }

   /**
    * 🔧 Configurar eventos globales
    */
   configurarEventosGlobales() {
       // Limpiar modales cuando se ocultan
       document.addEventListener('hidden.bs.modal', (e) => {
           this.limpiarModalOculto(e.target);
       });

       // Manejar teclas de escape
       document.addEventListener('keydown', (e) => {
           if (e.key === 'Escape') {
               this.cerrarModalesTodos();
           }
       });

       // Prevenir cierre accidental con backdrop en modales críticos
       document.addEventListener('hide.bs.modal', (e) => {
           const modal = e.target;
           if (modal.dataset.critico === 'true') {
               e.preventDefault();
           }
       });
   }

   // ==========================================
   // ✅ MODAL DE CONFIRMACIÓN
   // ==========================================

   /**
    * ✅ Mostrar modal de confirmación
    */
   async mostrarConfirmacion(opciones = {}) {
       const configDefault = {
           titulo: '¿Estás seguro?',
           mensaje: '¿Deseas continuar con esta acción?',
           textoConfirmar: 'Confirmar',
           textoCancelar: 'Cancelar',
           tipoConfirmar: 'primary', // primary, danger, warning, success
           icono: 'fas fa-question-circle',
           mostrarCancelar: true,
           tamano: 'md' // sm, md, lg, xl
       };

       const config = { ...configDefault, ...opciones };

       return new Promise((resolve) => {
           const modalId = this.generarIdUnico('confirmacion');
           const html = this.generarHTMLConfirmacion(modalId, config);
           
           // Crear modal
           const modalElement = this.crearModalDinamico(modalId, html);
           
           // Configurar eventos
           const btnConfirmar = modalElement.querySelector('.btn-confirmar');
           const btnCancelar = modalElement.querySelector('.btn-cancelar');
           
           btnConfirmar?.addEventListener('click', () => {
               this.cerrarModal(modalId);
               resolve(true);
           });
           
           btnCancelar?.addEventListener('click', () => {
               this.cerrarModal(modalId);
               resolve(false);
           });

           // Mostrar modal
           this.mostrarModal(modalId, {
               backdrop: 'static',
               keyboard: false
           });
       });
   }

   /**
    * 🎨 Generar HTML para modal de confirmación
    */
   generarHTMLConfirmacion(modalId, config) {
       return `
           <div class="modal fade" id="${modalId}" tabindex="-1">
               <div class="modal-dialog modal-dialog-centered modal-${config.tamano}">
                   <div class="modal-content">
                       <div class="modal-header border-0 pb-0">
                           <div class="d-flex align-items-center">
                               <div class="modal-icon me-3">
                                   <i class="${config.icono} fa-2x text-${config.tipoConfirmar}"></i>
                               </div>
                               <h5 class="modal-title">${config.titulo}</h5>
                           </div>
                           <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                       </div>
                       <div class="modal-body pt-0">
                           <p class="mb-0">${config.mensaje}</p>
                       </div>
                       <div class="modal-footer border-0">
                           ${config.mostrarCancelar ? `
                               <button type="button" class="btn btn-secondary btn-cancelar">
                                   ${config.textoCancelar}
                               </button>
                           ` : ''}
                           <button type="button" class="btn btn-${config.tipoConfirmar} btn-confirmar">
                               ${config.textoConfirmar}
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   // ==========================================
   // ⚠️ MODAL DE ALERTA
   // ==========================================

   /**
    * ⚠️ Mostrar modal de alerta
    */
   async mostrarAlerta(opciones = {}) {
       const configDefault = {
           titulo: 'Atención',
           mensaje: 'Ha ocurrido algo que requiere tu atención.',
           tipo: 'info', // success, warning, danger, info
           textoBoton: 'Entendido',
           autoOcultar: false,
           tiempo: 5000
       };

       const config = { ...configDefault, ...opciones };

       return new Promise((resolve) => {
           const modalId = this.generarIdUnico('alerta');
           const html = this.generarHTMLAlerta(modalId, config);
           
           const modalElement = this.crearModalDinamico(modalId, html);
           
           // Configurar eventos
           const btnCerrar = modalElement.querySelector('.btn-cerrar-alerta');
           
           btnCerrar?.addEventListener('click', () => {
               this.cerrarModal(modalId);
               resolve(true);
           });

           // Auto ocultar si está configurado
           if (config.autoOcultar) {
               setTimeout(() => {
                   this.cerrarModal(modalId);
                   resolve(true);
               }, config.tiempo);
           }

           this.mostrarModal(modalId);
       });
   }

   /**
    * 🎨 Generar HTML para modal de alerta
    */
   generarHTMLAlerta(modalId, config) {
       const iconos = {
           success: 'fas fa-check-circle',
           warning: 'fas fa-exclamation-triangle',
           danger: 'fas fa-exclamation-circle',
           info: 'fas fa-info-circle'
       };

       return `
           <div class="modal fade" id="${modalId}" tabindex="-1">
               <div class="modal-dialog modal-dialog-centered">
                   <div class="modal-content border-0 shadow">
                       <div class="modal-body text-center p-4">
                           <div class="mb-3">
                               <i class="${iconos[config.tipo]} fa-3x text-${config.tipo}"></i>
                           </div>
                           <h5 class="modal-title mb-3">${config.titulo}</h5>
                           <p class="text-muted mb-4">${config.mensaje}</p>
                           <button type="button" class="btn btn-${config.tipo} btn-cerrar-alerta">
                               ${config.textoBoton}
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   // ==========================================
   // 📝 MODAL DE FORMULARIO
   // ==========================================

   /**
    * 📝 Mostrar modal con formulario
    */
   async mostrarFormulario(opciones = {}) {
       const configDefault = {
           titulo: 'Formulario',
           campos: [],
           textoEnviar: 'Guardar',
           textoCancelar: 'Cancelar',
           validar: true,
           resetearAlCerrar: true,
           tamano: 'lg'
       };

       const config = { ...configDefault, ...opciones };

       return new Promise((resolve) => {
           const modalId = this.generarIdUnico('formulario');
           const html = this.generarHTMLFormulario(modalId, config);
           
           const modalElement = this.crearModalDinamico(modalId, html);
           
           // Configurar formulario
           const form = modalElement.querySelector('form');
           const btnEnviar = modalElement.querySelector('.btn-enviar');
           const btnCancelar = modalElement.querySelector('.btn-cancelar');
           
           // Eventos del formulario
           form?.addEventListener('submit', (e) => {
               e.preventDefault();
               
               if (config.validar && !this.validarFormulario(form)) {
                   return;
               }
               
               const datos = this.obtenerDatosFormulario(form);
               this.cerrarModal(modalId);
               resolve({ enviado: true, datos: datos });
           });
           
           btnCancelar?.addEventListener('click', () => {
               if (config.resetearAlCerrar) {
                   form?.reset();
               }
               this.cerrarModal(modalId);
               resolve({ enviado: false, datos: null });
           });

           // Configurar validación en tiempo real si está habilitada
           if (config.validar) {
               this.configurarValidacionTiempoReal(form);
           }

           this.mostrarModal(modalId);
       });
   }

   /**
    * 🎨 Generar HTML para modal de formulario
    */
   generarHTMLFormulario(modalId, config) {
       let camposHTML = '';
       
       config.campos.forEach(campo => {
           camposHTML += this.generarCampoFormulario(campo);
       });

       return `
           <div class="modal fade" id="${modalId}" tabindex="-1">
               <div class="modal-dialog modal-dialog-centered modal-${config.tamano}">
                   <div class="modal-content">
                       <div class="modal-header">
                           <h5 class="modal-title">${config.titulo}</h5>
                           <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                       </div>
                       <div class="modal-body">
                           <form id="form-${modalId}" novalidate>
                               ${camposHTML}
                           </form>
                       </div>
                       <div class="modal-footer">
                           <button type="button" class="btn btn-secondary btn-cancelar">
                               ${config.textoCancelar}
                           </button>
                           <button type="submit" form="form-${modalId}" class="btn btn-primary btn-enviar">
                               ${config.textoEnviar}
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 🏗️ Generar campo individual del formulario
    */
   generarCampoFormulario(campo) {
       const requiredAttr = campo.requerido ? 'required' : '';
       const classValidation = campo.validacion ? 'needs-validation' : '';
       
       let input = '';
       
       switch (campo.tipo) {
           case 'text':
           case 'email':
           case 'password':
           case 'number':
               input = `
                   <input type="${campo.tipo}" 
                          class="form-control ${classValidation}" 
                          id="${campo.id}" 
                          name="${campo.nombre || campo.id}"
                          placeholder="${campo.placeholder || ''}"
                          value="${campo.valor || ''}"
                          ${requiredAttr}
                          ${campo.atributos || ''}>
               `;
               break;
               
           case 'textarea':
               input = `
                   <textarea class="form-control ${classValidation}" 
                             id="${campo.id}" 
                             name="${campo.nombre || campo.id}"
                             placeholder="${campo.placeholder || ''}"
                             rows="${campo.filas || 3}"
                             ${requiredAttr}
                             ${campo.atributos || ''}>${campo.valor || ''}</textarea>
               `;
               break;
               
           case 'select':
               let opciones = '';
               campo.opciones?.forEach(opcion => {
                   const selected = opcion.valor === campo.valor ? 'selected' : '';
                   opciones += `<option value="${opcion.valor}" ${selected}>${opcion.texto}</option>`;
               });
               
               input = `
                   <select class="form-select ${classValidation}" 
                           id="${campo.id}" 
                           name="${campo.nombre || campo.id}"
                           ${requiredAttr}
                           ${campo.atributos || ''}>
                       ${campo.placeholder ? `<option value="">${campo.placeholder}</option>` : ''}
                       ${opciones}
                   </select>
               `;
               break;
               
           case 'checkbox':
               input = `
                   <div class="form-check">
                       <input class="form-check-input" 
                              type="checkbox" 
                              id="${campo.id}" 
                              name="${campo.nombre || campo.id}"
                              value="${campo.valor || 'true'}"
                              ${campo.marcado ? 'checked' : ''}
                              ${requiredAttr}>
                       <label class="form-check-label" for="${campo.id}">
                           ${campo.etiqueta}
                       </label>
                   </div>
               `;
               return `<div class="mb-3">${input}</div>`;
               
           case 'file':
               input = `
                   <input type="file" 
                          class="form-control ${classValidation}" 
                          id="${campo.id}" 
                          name="${campo.nombre || campo.id}"
                          accept="${campo.aceptar || ''}"
                          ${campo.multiple ? 'multiple' : ''}
                          ${requiredAttr}
                          ${campo.atributos || ''}>
               `;
               break;
       }

       return `
           <div class="mb-3">
               ${campo.tipo !== 'checkbox' ? `<label for="${campo.id}" class="form-label">${campo.etiqueta}</label>` : ''}
               ${input}
               ${campo.ayuda ? `<div class="form-text">${campo.ayuda}</div>` : ''}
               <div class="invalid-feedback"></div>
           </div>
       `;
   }

   // ==========================================
   // 📄 MODAL DE INFORMACIÓN
   // ==========================================

   /**
    * 📄 Mostrar modal de información/contenido
    */
   async mostrarInformacion(opciones = {}) {
       const configDefault = {
           titulo: 'Información',
           contenido: '',
           textoBoton: 'Cerrar',
           tamano: 'lg',
           scrollable: true,
           centrado: true
       };

       const config = { ...configDefault, ...opciones };

       return new Promise((resolve) => {
           const modalId = this.generarIdUnico('informacion');
           const html = this.generarHTMLInformacion(modalId, config);
           
           const modalElement = this.crearModalDinamico(modalId, html);
           
           const btnCerrar = modalElement.querySelector('.btn-cerrar-info');
           
           btnCerrar?.addEventListener('click', () => {
               this.cerrarModal(modalId);
               resolve(true);
           });

           this.mostrarModal(modalId);
       });
   }

   /**
    * 🎨 Generar HTML para modal de información
    */
   generarHTMLInformacion(modalId, config) {
       const claseScrollable = config.scrollable ? 'modal-dialog-scrollable' : '';
       const claseCentrado = config.centrado ? 'modal-dialog-centered' : '';
       
       return `
           <div class="modal fade" id="${modalId}" tabindex="-1">
               <div class="modal-dialog modal-${config.tamano} ${claseScrollable} ${claseCentrado}">
                   <div class="modal-content">
                       <div class="modal-header">
                           <h5 class="modal-title">${config.titulo}</h5>
                           <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                       </div>
                       <div class="modal-body">
                           ${config.contenido}
                       </div>
                       <div class="modal-footer">
                           <button type="button" class="btn btn-primary btn-cerrar-info">
                               ${config.textoBoton}
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   // ==========================================
   // ⏳ MODAL DE CARGA/PROGRESO
   // ==========================================

   /**
    * ⏳ Mostrar modal de carga
    */
   mostrarCarga(opciones = {}) {
       const configDefault = {
           titulo: 'Procesando...',
           mensaje: 'Por favor espera mientras se procesa tu solicitud.',
           mostrarProgreso: false,
           progreso: 0,
           cancelable: false,
           textoCancelar: 'Cancelar'
       };

       const config = { ...configDefault, ...opciones };
       const modalId = this.generarIdUnico('carga');
       const html = this.generarHTMLCarga(modalId, config);
       
       const modalElement = this.crearModalDinamico(modalId, html);
       
       // Configurar cancelación si está habilitada
       if (config.cancelable) {
           const btnCancelar = modalElement.querySelector('.btn-cancelar-carga');
           btnCancelar?.addEventListener('click', () => {
               this.cerrarModal(modalId);
               if (config.onCancelar) {
                   config.onCancelar();
               }
           });
       }

       this.mostrarModal(modalId, {
           backdrop: 'static',
           keyboard: config.cancelable
       });

       // Retornar objeto para controlar el modal
       return {
           id: modalId,
           actualizar: (nuevoProgreso, nuevoMensaje) => {
               this.actualizarModalCarga(modalId, nuevoProgreso, nuevoMensaje);
           },
           cerrar: () => {
               this.cerrarModal(modalId);
           }
       };
   }

   /**
    * 🎨 Generar HTML para modal de carga
    */
   generarHTMLCarga(modalId, config) {
       const barraProgreso = config.mostrarProgreso ? `
           <div class="progress mb-3" style="height: 6px;">
               <div class="progress-bar progress-bar-striped progress-bar-animated" 
                    role="progressbar" 
                    style="width: ${config.progreso}%"
                    id="barra-progreso-${modalId}">
               </div>
           </div>
       ` : '';

       const spinner = !config.mostrarProgreso ? `
           <div class="text-center mb-3">
               <div class="spinner-border text-primary" role="status">
                   <span class="visually-hidden">Cargando...</span>
               </div>
           </div>
       ` : '';

       return `
           <div class="modal fade" id="${modalId}" tabindex="-1" data-critico="true">
               <div class="modal-dialog modal-dialog-centered">
                   <div class="modal-content">
                       <div class="modal-header border-0">
                           <h5 class="modal-title">${config.titulo}</h5>
                           ${config.cancelable ? '<button type="button" class="btn-close" data-bs-dismiss="modal"></button>' : ''}
                       </div>
                       <div class="modal-body text-center">
                           ${spinner}
                           ${barraProgreso}
                           <p class="mb-0" id="mensaje-carga-${modalId}">${config.mensaje}</p>
                       </div>
                       ${config.cancelable ? `
                           <div class="modal-footer border-0">
                               <button type="button" class="btn btn-secondary btn-cancelar-carga">
                                   ${config.textoCancelar}
                               </button>
                           </div>
                       ` : ''}
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 🔄 Actualizar modal de carga
    */
   actualizarModalCarga(modalId, progreso, mensaje) {
       const barraProgreso = document.querySelector(`#barra-progreso-${modalId}`);
       const mensajeCarga = document.querySelector(`#mensaje-carga-${modalId}`);
       
       if (barraProgreso && typeof progreso === 'number') {
           barraProgreso.style.width = `${progreso}%`;
           barraProgreso.setAttribute('aria-valuenow', progreso);
       }
       
       if (mensajeCarga && mensaje) {
           mensajeCarga.textContent = mensaje;
       }
   }

   // ==========================================
   // 🎯 MODAL SELECTOR
   // ==========================================

   /**
    * 🎯 Mostrar modal selector (lista de opciones)
    */
   async mostrarSelector(opciones = {}) {
       const configDefault = {
           titulo: 'Seleccionar opción',
           opciones: [],
           multiple: false,
           busqueda: false,
           textoBoton: 'Seleccionar',
           textoCancelar: 'Cancelar'
       };

       const config = { ...configDefault, ...opciones };

       return new Promise((resolve) => {
           const modalId = this.generarIdUnico('selector');
           const html = this.generarHTMLSelector(modalId, config);
           
           const modalElement = this.crearModalDinamico(modalId, html);
           
           // Configurar eventos
           const btnSeleccionar = modalElement.querySelector('.btn-seleccionar');
           const btnCancelar = modalElement.querySelector('.btn-cancelar');
           const busqueda = modalElement.querySelector('.busqueda-selector');
           
           // Configurar búsqueda si está habilitada
           if (config.busqueda && busqueda) {
               busqueda.addEventListener('input', (e) => {
                   this.filtrarOpcionesSelector(modalId, e.target.value);
               });
           }
           
           btnSeleccionar?.addEventListener('click', () => {
               const seleccionadas = this.obtenerOpcionesSeleccionadas(modalId, config.multiple);
               this.cerrarModal(modalId);
               resolve({ seleccionado: true, opciones: seleccionadas });
           });
           
           btnCancelar?.addEventListener('click', () => {
               this.cerrarModal(modalId);
               resolve({ seleccionado: false, opciones: [] });
           });

           this.mostrarModal(modalId);
       });
   }

   // ==========================================
   // 🛠️ MÉTODOS AUXILIARES
   // ==========================================

   /**
    * 🔢 Generar ID único
    */
   generarIdUnico(prefijo = 'modal') {
       return `${prefijo}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
   }

   /**
    * 🏗️ Crear modal dinámico
    */
   crearModalDinamico(modalId, html) {
       const wrapper = document.createElement('div');
       wrapper.innerHTML = html;
       const modalElement = wrapper.firstElementChild;
       
       this.contenedorModales.appendChild(modalElement);
       this.modalesActivos.set(modalId, modalElement);
       
       return modalElement;
   }

   /**
    * 🎭 Mostrar modal
    */
   mostrarModal(modalId, configuracion = {}) {
       const modalElement = this.modalesActivos.get(modalId);
       if (!modalElement) return;

       const config = { ...this.configuracionDefault, ...configuracion };
       const modalInstance = new bootstrap.Modal(modalElement, config);
       
       modalInstance.show();
       
       // Guardar instancia para control posterior
       modalElement._modalInstance = modalInstance;
   }

   /**
    * 🚪 Cerrar modal específico
    */
   cerrarModal(modalId) {
       const modalElement = this.modalesActivos.get(modalId);
       if (!modalElement) return;

       const modalInstance = modalElement._modalInstance;
       if (modalInstance) {
           modalInstance.hide();
       }
   }

   /**
    * 🚪 Cerrar todos los modales
    */
   cerrarModalesTodos() {
       this.modalesActivos.forEach((modalElement, modalId) => {
           this.cerrarModal(modalId);
       });
   }

   /**
    * 🧹 Limpiar modal oculto
    */
   limpiarModalOculto(modalElement) {
       // Encontrar y remover del registro
       for (const [modalId, element] of this.modalesActivos.entries()) {
           if (element === modalElement) {
               this.modalesActivos.delete(modalId);
               break;
           }
       }

       // Remover del DOM después de un delay para animaciones
       setTimeout(() => {
           if (modalElement.parentNode) {
               modalElement.parentNode.removeChild(modalElement);
           }
       }, 150);
   }

   /**
    * ✅ Validar formulario
    */
   validarFormulario(form) {
       const campos = form.querySelectorAll('input, select, textarea');
       let esValido = true;

       campos.forEach(campo => {
           if (!campo.checkValidity()) {
               campo.classList.add('is-invalid');
               esValido = false;
           } else {
               campo.classList.remove('is-invalid');
               campo.classList.add('is-valid');
           }
       });

       return esValido;
   }

   /**
    * 🔄 Configurar validación en tiempo real
    */
   configurarValidacionTiempoReal(form) {
       const campos = form.querySelectorAll('input, select, textarea');
       
       campos.forEach(campo => {
           campo.addEventListener('blur', () => {
               if (campo.checkValidity()) {
                   campo.classList.remove('is-invalid');
                   campo.classList.add('is-valid');
               } else {
                   campo.classList.remove('is-valid');
                   campo.classList.add('is-invalid');
               }
           });
       });
   }

   /**
    * 📊 Obtener datos del formulario
    */
   obtenerDatosFormulario(form) {
       const formData = new FormData(form);
       const datos = {};
       
       for (const [key, value] of formData.entries()) {
           if (datos[key]) {
               // Manejar múltiples valores (checkboxes, selects múltiples)
               if (Array.isArray(datos[key])) {
                   datos[key].push(value);
               } else {
                   datos[key] = [datos[key], value];
               }
           } else {
               datos[key] = value;
           }
       }
       
       return datos;
   }

   /**
    * 🎯 Obtener opciones seleccionadas del selector
    */
   obtenerOpcionesSeleccionadas(modalId, multiple) {
       const modalElement = this.modalesActivos.get(modalId);
       if (!modalElement) return [];

       const selector = multiple ? 'input[type="checkbox"]:checked' : 'input[type="radio"]:checked';
       const seleccionados = modalElement.querySelectorAll(selector);
       
       return Array.from(seleccionados).map(input => ({
           valor: input.value,
           texto: input.dataset.texto || input.value
       }));
   }

   /**
    * 🔍 Filtrar opciones del selector
    */
   filtrarOpcionesSelector(modalId, termino) {
       const modalElement = this.modalesActivos.get(modalId);
       if (!modalElement) return;

       const opciones = modalElement.querySelectorAll('.opcion-selector');
       
       opciones.forEach(opcion => {
           const texto = opcion.textContent.toLowerCase();
           if (texto.includes(termino.toLowerCase())) {
               opcion.style.display = 'block';
           } else {
               opcion.style.display = 'none';
           }
       });
   }

   // ==========================================
   // 🎨 MÉTODOS DE CONVENIENCIA
   // ==========================================

   /**
    * ✅ Confirmar acción rápida
    */
   async confirmar(mensaje, titulo = '¿Estás seguro?') {
       return this.mostrarConfirmacion({
           titulo: titulo,
           mensaje: mensaje
       });
   }

   /**
    * ⚠️ Mostrar alerta rápida
    */
   async alerta(mensaje, tipo = 'info', titulo = 'Atención') {
       return this.mostrarAlerta({
           titulo: titulo,
           mensaje: mensaje,
           tipo: tipo
       });
   }

   /**
    * ❌ Confirmar eliminación
    */
   async confirmarEliminacion(elemento = 'este elemento') {
       return this.mostrarConfirmacion({
           titulo: 'Confirmar eliminación',
           mensaje: `¿Estás seguro de que deseas eliminar ${elemento}? Esta acción no se puede deshacer.`,
           textoConfirmar: 'Sí, eliminar',
           tipoConfirmar: 'danger',
           icono: 'fas fa-trash-alt'
       });
   }

   /**
    * 📄 Mostrar contenido rápido
    */
   async mostrarContenido(titulo, contenido, tamano = 'lg') {
       return this.mostrarInformacion({
           titulo: titulo,
           contenido: contenido,
           tamano: tamano
       });
   }

   /**
    * 🔍 Obtener modal activo
    */
   obtenerModalActivo(modalId) {
       return this.modalesActivos.get(modalId);
   }

   /**
    * 🔢 Contar modales activos
    */
   contarModalesActivos() {
       return this.modalesActivos.size;
   }

   /**
    * 🧹 Destruir sistema
    */
   destruir() {
       this.cerrarModalesTodos();
       
       if (this.contenedorModales) {
           this.contenedorModales.remove();
       }
       
       this.modalesActivos.clear();
       
       console.log('🧹 Sistema de modales destruido');
   }
}

// 🚀 Crear instancia global
window.SistemaModales = new SistemaModales();

// 🎯 Alias para conveniencia
window.Modal = {
   confirmar: (mensaje, titulo) => window.SistemaModales.confirmar(mensaje, titulo),
   alerta: (mensaje, tipo, titulo) => window.SistemaModales.alerta(mensaje, tipo, titulo),
   confirmarEliminacion: (elemento) => window.SistemaModales.confirmarEliminacion(elemento),
   mostrarContenido: (titulo, contenido, tamano) => window.SistemaModales.mostrarContenido(titulo, contenido, tamano),
   mostrarFormulario: (opciones) => window.SistemaModales.mostrarFormulario(opciones),
   mostrarCarga: (opciones) => window.SistemaModales.mostrarCarga(opciones),
   mostrarSelector: (opciones) => window.SistemaModales.mostrarSelector(opciones),
   cerrarTodos: () => window.SistemaModales.cerrarModalesTodos()
};

// 📤 Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
   module.exports = SistemaModales;
}

console.log('🪟 Sistema de Modales cargado correctamente');