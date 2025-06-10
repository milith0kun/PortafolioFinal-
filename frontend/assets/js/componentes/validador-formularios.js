/**
 * ✅ VALIDADOR DE FORMULARIOS
 * Sistema Portafolio Docente UNSAAC
 * 
 * Sistema completo de validación de formularios en tiempo real
 * Incluye validaciones predefinidas, personalizadas y retroalimentación visual
 */

class ValidadorFormularios {
   constructor() {
       this.formularios = new Map();
       this.reglasPersonalizadas = new Map();
       this.mensajesPersonalizados = new Map();
       
       // Configuración por defecto
       this.configuracion = {
           validarEnTiempoReal: true,
           mostrarMensajesInmediatos: true,
           resaltarCamposValidos: true,
           debounceTime: 300,
           animarMensajes: true,
           validarEnEnvio: true
       };

       // Patrones de validación comunes
       this.patrones = {
           email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
           telefono: /^(\+51|51)?\s?9\d{8}$/,
           dni: /^\d{8}$/,
           ruc: /^\d{11}$/,
           soloLetras: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
           soloNumeros: /^\d+$/,
           alfanumerico: /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/,
           codigoAsignatura: /^[A-Z]{2}\d{3}$/,
           password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
       };

       // Mensajes de error por defecto
       this.mensajesDefault = {
           required: 'Este campo es obligatorio',
           email: 'Ingrese un correo electrónico válido',
           minlength: 'Debe tener al menos {min} caracteres',
           maxlength: 'No puede tener más de {max} caracteres',
           min: 'El valor mínimo es {min}',
           max: 'El valor máximo es {max}',
           pattern: 'El formato ingresado no es válido',
           telefono: 'Ingrese un número de teléfono válido (9 dígitos)',
           dni: 'El DNI debe tener 8 dígitos',
           ruc: 'El RUC debe tener 11 dígitos',
           password: 'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un símbolo',
           confirmarPassword: 'Las contraseñas no coinciden',
           fechaFutura: 'La fecha debe ser posterior a hoy',
           fechaPasada: 'La fecha debe ser anterior a hoy',
           archivoTamaño: 'El archivo es demasiado grande (máximo {max}MB)',
           archivoTipo: 'Tipo de archivo no permitido'
       };

       this.inicializar();
   }

   /**
    * 🚀 Inicializar validador
    */
   inicializar() {
       console.log('✅ Inicializando validador de formularios...');

       // Configurar validaciones automáticas en formularios existentes
       this.inicializarFormulariosExistentes();

       // Observar nuevos formularios dinámicos
       this.observarNuevosFormularios();

       // Configurar eventos globales
       this.configurarEventosGlobales();

       console.log('✅ Validador de formularios inicializado correctamente');
   }

   /**
    * 📋 Inicializar formularios existentes
    */
   inicializarFormulariosExistentes() {
       document.querySelectorAll('form[data-validar]').forEach(form => {
           this.registrarFormulario(form);
       });
   }

   /**
    * 👁️ Observar nuevos formularios dinámicos
    */
   observarNuevosFormularios() {
       if (typeof MutationObserver !== 'undefined') {
           const observer = new MutationObserver((mutations) => {
               mutations.forEach(mutation => {
                   mutation.addedNodes.forEach(node => {
                       if (node.nodeType === 1) { // Element node
                           // Buscar formularios en el nodo agregado
                           const formularios = node.querySelectorAll ? 
                               node.querySelectorAll('form[data-validar]') : [];
                           
                           formularios.forEach(form => {
                               this.registrarFormulario(form);
                           });

                           // Si el nodo mismo es un formulario
                           if (node.matches && node.matches('form[data-validar]')) {
                               this.registrarFormulario(node);
                           }
                       }
                   });
               });
           });

           observer.observe(document.body, {
               childList: true,
               subtree: true
           });
       }
   }

   /**
    * 🔧 Configurar eventos globales
    */
   configurarEventosGlobales() {
       // Prevenir envío de formularios inválidos
       document.addEventListener('submit', (e) => {
           const form = e.target;
           if (form.hasAttribute('data-validar')) {
               if (!this.validarFormulario(form.id || this.generarIdFormulario(form))) {
                   e.preventDefault();
                   e.stopPropagation();
               }
           }
       });
   }

   // ==========================================
   // 📝 REGISTRO Y CONFIGURACIÓN
   // ==========================================

   /**
    * 📝 Registrar formulario para validación
    */
   registrarFormulario(formularioElement, opciones = {}) {
       // Generar ID si no tiene
       if (!formularioElement.id) {
           formularioElement.id = this.generarIdFormulario(formularioElement);
       }

       const formId = formularioElement.id;
       
       // Configuración del formulario
       const config = {
           elemento: formularioElement,
           campos: new Map(),
           reglas: new Map(),
           mensajes: new Map(),
           valido: false,
           tocado: false,
           ...this.configuracion,
           ...opciones
       };

       // Analizar campos del formulario
       this.analizarCamposFormulario(config);

       // Configurar eventos
       this.configurarEventosFormulario(config);

       // Guardar configuración
       this.formularios.set(formId, config);

       console.log(`📝 Formulario registrado: ${formId}`);
       
       return formId;
   }

   /**
    * 🔍 Analizar campos del formulario
    */
   analizarCamposFormulario(config) {
       const campos = config.elemento.querySelectorAll('input, select, textarea');
       
       campos.forEach(campo => {
           const campoConfig = this.extraerConfiguracionCampo(campo);
           config.campos.set(campo.name || campo.id, campoConfig);
           
           // Configurar eventos del campo
           this.configurarEventosCampo(campo, config);
       });
   }

   /**
    * ⚙️ Extraer configuración de campo
    */
   extraerConfiguracionCampo(campo) {
       const config = {
           elemento: campo,
           nombre: campo.name || campo.id,
           tipo: campo.type,
           requerido: campo.required,
           reglas: [],
           mensaje: null,
           valido: false,
           tocado: false,
           valor: campo.value
       };

       // Extraer reglas de validación de atributos HTML5
       if (campo.required) {
           config.reglas.push({ tipo: 'required' });
       }

       if (campo.minLength > 0) {
           config.reglas.push({ tipo: 'minlength', valor: campo.minLength });
       }

       if (campo.maxLength > 0) {
           config.reglas.push({ tipo: 'maxlength', valor: campo.maxLength });
       }

       if (campo.min) {
           config.reglas.push({ tipo: 'min', valor: campo.min });
       }

       if (campo.max) {
           config.reglas.push({ tipo: 'max', valor: campo.max });
       }

       if (campo.pattern) {
           config.reglas.push({ tipo: 'pattern', valor: new RegExp(campo.pattern) });
       }

       // Extraer reglas de atributos data-*
       this.extraerReglasDataAttributes(campo, config);

       return config;
   }

   /**
    * 📊 Extraer reglas de data attributes
    */
   extraerReglasDataAttributes(campo, config) {
       const dataset = campo.dataset;

       // Validaciones específicas
       if (dataset.validarEmail) {
           config.reglas.push({ tipo: 'email' });
       }

       if (dataset.validarTelefono) {
           config.reglas.push({ tipo: 'telefono' });
       }

       if (dataset.validarDni) {
           config.reglas.push({ tipo: 'dni' });
       }

       if (dataset.validarRuc) {
           config.reglas.push({ tipo: 'ruc' });
       }

       if (dataset.validarPassword) {
           config.reglas.push({ tipo: 'password' });
       }

       if (dataset.confirmarPassword) {
           config.reglas.push({ 
               tipo: 'confirmarPassword', 
               valor: dataset.confirmarPassword 
           });
       }

       if (dataset.fechaFutura) {
           config.reglas.push({ tipo: 'fechaFutura' });
       }

       if (dataset.fechaPasada) {
           config.reglas.push({ tipo: 'fechaPasada' });
       }

       if (dataset.soloLetras) {
           config.reglas.push({ tipo: 'soloLetras' });
       }

       if (dataset.soloNumeros) {
           config.reglas.push({ tipo: 'soloNumeros' });
       }

       if (dataset.alfanumerico) {
           config.reglas.push({ tipo: 'alfanumerico' });
       }

       // Validación personalizada
       if (dataset.validarPersonalizada) {
           config.reglas.push({ 
               tipo: 'personalizada', 
               valor: dataset.validarPersonalizada 
           });
       }

       // Mensaje personalizado
       if (dataset.mensajeError) {
           config.mensaje = dataset.mensajeError;
       }
   }

   // ==========================================
   // 🔧 CONFIGURACIÓN DE EVENTOS
   // ==========================================

   /**
    * 🔧 Configurar eventos del formulario
    */
   configurarEventosFormulario(config) {
       const form = config.elemento;

       // Evento submit
       form.addEventListener('submit', (e) => {
           if (!this.validarFormulario(form.id)) {
               e.preventDefault();
               e.stopPropagation();
           }
       });

       // Evento reset
       form.addEventListener('reset', () => {
           this.resetearValidacion(form.id);
       });
   }

   /**
    * 🔧 Configurar eventos del campo
    */
   configurarEventosCampo(campo, configFormulario) {
       if (!configFormulario.validarEnTiempoReal) return;

       // Validación en tiempo real con debounce
       const validarCampo = Utils.Performance.debounce(() => {
           this.validarCampo(configFormulario.elemento.id, campo.name || campo.id);
       }, configFormulario.debounceTime);

       // Eventos de input
       campo.addEventListener('input', validarCampo);
       campo.addEventListener('blur', validarCampo);

       // Para selects y checkboxes
       campo.addEventListener('change', validarCampo);
   }

   // ==========================================
   // ✅ VALIDACIÓN PRINCIPAL
   // ==========================================

   /**
    * ✅ Validar formulario completo
    */
   validarFormulario(formId) {
       const config = this.formularios.get(formId);
       if (!config) {
           console.warn(`⚠️ Formulario no registrado: ${formId}`);
           return false;
       }

       let formularioValido = true;
       const errores = [];

       // Validar cada campo
       config.campos.forEach((campoConfig, nombreCampo) => {
           const campoValido = this.validarCampo(formId, nombreCampo, false);
           if (!campoValido) {
               formularioValido = false;
               errores.push(nombreCampo);
           }
       });

       // Actualizar estado del formulario
       config.valido = formularioValido;
       config.tocado = true;

       // Aplicar clases CSS al formulario
       this.aplicarEstilosFormulario(config, formularioValido);

       // Emitir evento
       this.emitirEventoValidacion(config.elemento, {
           valido: formularioValido,
           errores: errores
       });

       console.log(`✅ Validación formulario ${formId}:`, formularioValido ? 'VÁLIDO' : 'INVÁLIDO');
       
       return formularioValido;
   }

   /**
    * ✅ Validar campo individual
    */
   validarCampo(formId, nombreCampo, mostrarMensaje = true) {
       const configFormulario = this.formularios.get(formId);
       if (!configFormulario) return false;

       const campoConfig = configFormulario.campos.get(nombreCampo);
       if (!campoConfig) return false;

       const campo = campoConfig.elemento;
       const valor = this.obtenerValorCampo(campo);
       
       // Actualizar valor en configuración
       campoConfig.valor = valor;
       campoConfig.tocado = true;

       // Ejecutar validaciones
       const resultadoValidacion = this.ejecutarValidacionesCampo(campoConfig, valor);
       
       // Actualizar estado
       campoConfig.valido = resultadoValidacion.valido;

       // Mostrar feedback visual
       this.mostrarFeedbackCampo(campo, resultadoValidacion, mostrarMensaje);

       return resultadoValidacion.valido;
   }

   /**
    * 🔍 Ejecutar validaciones de campo
    */
   ejecutarValidacionesCampo(campoConfig, valor) {
       const resultado = {
           valido: true,
           errores: [],
           mensaje: null
       };

       // Ejecutar cada regla de validación
       for (const regla of campoConfig.reglas) {
           const validacion = this.ejecutarReglaValidacion(regla, valor, campoConfig);
           
           if (!validacion.valido) {
               resultado.valido = false;
               resultado.errores.push(regla.tipo);
               resultado.mensaje = validacion.mensaje;
               break; // Parar en el primer error
           }
       }

       return resultado;
   }

   /**
    * 🔧 Ejecutar regla de validación individual
    */
   ejecutarReglaValidacion(regla, valor, campoConfig) {
       const elemento = campoConfig.elemento;
       
       switch (regla.tipo) {
           case 'required':
               return this.validarRequerido(valor);
               
           case 'email':
               return this.validarEmail(valor);
               
           case 'minlength':
               return this.validarLongitudMinima(valor, regla.valor);
               
           case 'maxlength':
               return this.validarLongitudMaxima(valor, regla.valor);
               
           case 'min':
               return this.validarValorMinimo(valor, regla.valor);
               
           case 'max':
               return this.validarValorMaximo(valor, regla.valor);
               
           case 'pattern':
               return this.validarPatron(valor, regla.valor);
               
           case 'telefono':
               return this.validarTelefono(valor);
               
           case 'dni':
               return this.validarDNI(valor);
               
           case 'ruc':
               return this.validarRUC(valor);
               
           case 'password':
               return this.validarPassword(valor);
               
           case 'confirmarPassword':
               return this.validarConfirmarPassword(valor, regla.valor);
               
           case 'fechaFutura':
               return this.validarFechaFutura(valor);
               
           case 'fechaPasada':
               return this.validarFechaPasada(valor);
               
           case 'soloLetras':
               return this.validarSoloLetras(valor);
               
           case 'soloNumeros':
               return this.validarSoloNumeros(valor);
               
           case 'alfanumerico':
               return this.validarAlfanumerico(valor);
               
           case 'personalizada':
               return this.validarPersonalizada(valor, regla.valor, elemento);
               
           default:
               return { valido: true, mensaje: null };
       }
   }

   // ==========================================
   // 🔍 VALIDACIONES ESPECÍFICAS
   // ==========================================

   validarRequerido(valor) {
       const esValido = valor !== null && valor !== undefined && String(valor).trim() !== '';
       return {
           valido: esValido,
           mensaje: esValido ? null : this.mensajesDefault.required
       };
   }

   validarEmail(valor) {
       if (!valor) return { valido: true, mensaje: null }; // Campo opcional
       
       const esValido = this.patrones.email.test(valor);
       return {
           valido: esValido,
           mensaje: esValido ? null : this.mensajesDefault.email
       };
   }

   validarLongitudMinima(valor, min) {
       if (!valor) return { valido: true, mensaje: null };
       
       const esValido = String(valor).length >= min;
       return {
           valido: esValido,
           mensaje: esValido ? null : this.mensajesDefault.minlength.replace('{min}', min)
       };
   }

   validarLongitudMaxima(valor, max) {
       if (!valor) return { valido: true, mensaje: null };
       
       const esValido = String(valor).length <= max;
       return {
           valido: esValido,
           mensaje: esValido ? null : this.mensajesDefault.maxlength.replace('{max}', max)
       };
   }

   validarValorMinimo(valor, min) {
       if (!valor) return { valido: true, mensaje: null };
       
       const esValido = Number(valor) >= Number(min);
       return {
           valido: esValido,
           mensaje: esValido ? null : this.mensajesDefault.min.replace('{min}', min)
       };
   }

   validarValorMaximo(valor, max) {
       if (!valor) return { valido: true, mensaje: null };
       
       const esValido = Number(valor) <= Number(max);
       return {
           valido: esValido,
           mensaje: esValido ? null : this.mensajesDefault.max.replace('{max}', max)
       };
   }

   validarPatron(valor, patron) {
       if (!valor) return { valido: true, mensaje: null };
       
       const esValido = patron.test(valor);
       return {
           valido: esValido,
           mensaje: esValido ? null : this.mensajesDefault.pattern
       };
   }

   validarTelefono(valor) {
       if (!valor) return { valido: true, mensaje: null };
       
       const esValido = this.patrones.telefono.test(valor);
       return {
           valido: esValido,
           mensaje: esValido ? null : this.mensajesDefault.telefono
       };
   }

   validarDNI(valor) {
       if (!valor) return { valido: true, mensaje: null };
       
       const esValido = this.patrones.dni.test(valor);
       return {
           valido: esValido,
           mensaje: esValido ? null : this.mensajesDefault.dni
       };
   }

   validarRUC(valor) {
       if (!valor) return { valido: true, mensaje: null };
       
       const esValido = this.patrones.ruc.test(valor) && this.validarDigitoVerificadorRUC(valor);
       return {
           valido: esValido,
           mensaje: esValido ? null : this.mensajesDefault.ruc
       };
   }

   validarPassword(valor) {
       if (!valor) return { valido: true, mensaje: null };
       
       const esValido = this.patrones.password.test(valor) && valor.length >= 8;
       return {
           valido: esValido,
           mensaje: esValido ? null : this.mensajesDefault.password
       };
   }

   validarConfirmarPassword(valor, campoPasswordId) {
       const campoPassword = document.getElementById(campoPasswordId) || 
                             document.querySelector(`[name="${campoPasswordId}"]`);
       
       if (!campoPassword) return { valido: true, mensaje: null };
       
       const esValido = valor === campoPassword.value;
       return {
           valido: esValido,
           mensaje: esValido ? null : this.mensajesDefault.confirmarPassword
       };
   }

   validarFechaFutura(valor) {
       if (!valor) return { valido: true, mensaje: null };
       
       const fecha = new Date(valor);
       const hoy = new Date();
       hoy.setHours(0, 0, 0, 0);
       
       const esValido = fecha > hoy;
       return {
           valido: esValido,
           mensaje: esValido ? null : this.mensajesDefault.fechaFutura
       };
   }

   validarFechaPasada(valor) {
       if (!valor) return { valido: true, mensaje: null };
       
       const fecha = new Date(valor);
       const hoy = new Date();
       hoy.setHours(23, 59, 59, 999);
       
       const esValido = fecha < hoy;
       return {
           valido: esValido,
           mensaje: esValido ? null : this.mensajesDefault.fechaPasada
       };
   }

   validarSoloLetras(valor) {
       if (!valor) return { valido: true, mensaje: null };
       
       const esValido = this.patrones.soloLetras.test(valor);
       return {
           valido: esValido,
           mensaje: esValido ? null : 'Solo se permiten letras'
       };
   }

   validarSoloNumeros(valor) {
       if (!valor) return { valido: true, mensaje: null };
       
       const esValido = this.patrones.soloNumeros.test(valor);
       return {
           valido: esValido,
           mensaje: esValido ? null : 'Solo se permiten números'
       };
   }

   validarAlfanumerico(valor) {
       if (!valor) return { valido: true, mensaje: null };
       
       const esValido = this.patrones.alfanumerico.test(valor);
       return {
           valido: esValido,
           mensaje: esValido ? null : 'Solo se permiten letras y números'
       };
   }

   validarPersonalizada(valor, nombreFuncion, elemento) {
       const funcionValidacion = this.reglasPersonalizadas.get(nombreFuncion);
       
       if (!funcionValidacion) {
           console.warn(`⚠️ Función de validación no encontrada: ${nombreFuncion}`);
           return { valido: true, mensaje: null };
       }
       
       return funcionValidacion(valor, elemento);
   }

   // ==========================================
   // 🎨 FEEDBACK VISUAL
   // ==========================================

   /**
    * 🎨 Mostrar feedback del campo
    */
   mostrarFeedbackCampo(campo, resultado, mostrarMensaje = true) {
       // Remover clases previas
       campo.classList.remove('is-valid', 'is-invalid');
       
       // Agregar clase según resultado
       if (resultado.valido) {
           campo.classList.add('is-valid');
       } else {
           campo.classList.add('is-invalid');
       }

       // Mostrar mensaje si está configurado
       if (mostrarMensaje && !resultado.valido) {
           this.mostrarMensajeError(campo, resultado.mensaje);
       } else {
           this.ocultarMensajeError(campo);
       }
   }

   /**
    * 🚨 Mostrar mensaje de error
    */
   mostrarMensajeError(campo, mensaje) {
       if (!mensaje) return;

       // Buscar contenedor de mensaje existente
       let contenedorMensaje = campo.parentNode.querySelector('.invalid-feedback');
       
       if (!contenedorMensaje) {
           // Crear contenedor si no existe
           contenedorMensaje = document.createElement('div');
           contenedorMensaje.className = 'invalid-feedback';
           campo.parentNode.appendChild(contenedorMensaje);
       }

       contenedorMensaje.textContent = mensaje;
       contenedorMensaje.style.display = 'block';

       // Animación si está habilitada
       if (this.configuracion.animarMensajes) {
           contenedorMensaje.style.opacity = '0';
           requestAnimationFrame(() => {
               contenedorMensaje.style.transition = 'opacity 0.3s ease';
               contenedorMensaje.style.opacity = '1';
           });
       }
   }

   /**
    * 🙈 Ocultar mensaje de error
    */
   ocultarMensajeError(campo) {
       const contenedorMensaje = campo.parentNode.querySelector('.invalid-feedback');
       
       if (contenedorMensaje) {
           if (this.configuracion.animarMensajes) {
               contenedorMensaje.style.transition = 'opacity 0.3s ease';
               contenedorMensaje.style.opacity = '0';
               setTimeout(() => {
                   contenedorMensaje.style.display = 'none';
               }, 300);
           } else {
               contenedorMensaje.style.display = 'none';
           }
       }
   }

   /**
    * 🎨 Aplicar estilos al formulario
    */
   aplicarEstilosFormulario(config, valido) {
       const form = config.elemento;
       
       form.classList.remove('was-validated');
       
       if (config.tocado) {
           form.classList.add('was-validated');
       }
       
       form.classList.toggle('form-valid', valido);
       form.classList.toggle('form-invalid', !valido);
   }

   // ==========================================
   // 🛠️ MÉTODOS AUXILIARES
   // ==========================================

   /**
    * 📊 Obtener valor del campo
    */
   obtenerValorCampo(campo) {
       switch (campo.type) {
           case 'checkbox':
               return campo.checked;
           case 'radio':
               const radioGroup = document.querySelectorAll(`[name="${campo.name}"]:checked`);
               return radioGroup.length > 0 ? radioGroup[0].value : null;
           case 'file':
               return campo.files;
           default:
               return campo.value;
       }
   }

   /**
    * 🔢 Generar ID para formulario
    */
   generarIdFormulario(form) {
       return `form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
   }

   /**
    * ✅ Validar dígito verificador RUC
    */
   validarDigitoVerificadorRUC(ruc) {
       if (ruc.length !== 11) return false;
       
       const factores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
       let suma = 0;
       
       for (let i = 0; i < 10; i++) {
           suma += parseInt(ruc[i]) * factores[i];
       }
       
       const resto = suma % 11;
       const digitoVerificador = resto < 2 ? resto : 11 - resto;
       
       return digitoVerificador === parseInt(ruc[10]);
   }

   /**
    * 📡 Emitir evento de validación
    */
   emitirEventoValidacion(form, detalle) {
       const evento = new CustomEvent('validacionFormulario', {
           detail: detalle,
           bubbles: true
       });
       
       form.dispatchEvent(evento);
   }

   // ==========================================
   // 🔧 API PÚBLICA
   // ==========================================

   /**
    * ➕ Agregar regla personalizada
    */
   agregarReglaPersonalizada(nombre, funcion) {
       this.reglasPersonalizadas.set(nombre, funcion);
       console.log(`✅ Regla personalizada agregada: ${nombre}`);
   }

   /**
    * 💬 Personalizar mensaje
    */
   personalizarMensaje(tipoRegla, mensaje) {
       this.mensajesPersonalizados.set(tipoRegla, mensaje);
   }

   /**
    * 🔄 Resetear validación
    */
   resetearValidacion(formId) {
       const config = this.formularios.get(formId);
       if (!config) return;

       // Resetear estado del formulario
       config.valido = false;
       config.tocado = false;

       // Resetear cada campo
       config.campos.forEach(campoConfig => {
           const campo = campoConfig.elemento;
           
           // Remover clases de validación
           campo.classList.remove('is-valid', 'is-invalid');
           
           // Ocultar mensajes
           this.ocultarMensajeError(campo);
           
           // Resetear estado del campo
           campoConfig.valido = false;
           campoConfig.tocado = false;
           campoConfig.valor = campo.value;
       });

       // Remover clases del formulario
       config.elemento.classList.remove('was-validated', 'form-valid', 'form-invalid');
   }

   /**
    * 📊 Obtener estado del formulario
    */
   obtenerEstadoFormulario(formId) {
       const config = this.formularios.get(formId);
       if (!config) return null;

       const estado = {
           valido: config.valido,
           tocado: config.tocado,
           campos: {}
       };

       config.campos.forEach((campoConfig, nombreCampo) => {
           estado.campos[nombreCampo] = {
               valido: campoConfig.valido,
               tocado: campoConfig.tocado,
               valor: campoConfig.valor
           };
       });

       return estado;
   }

   /**
    * ❌ Desregistrar formulario
    */
   desregistrarFormulario(formId) {
       if (this.formularios.has(formId)) {
           this.formularios.delete(formId);
           console.log(`❌ Formulario desregistrado: ${formId}`);
       }
   }

   /**
    * 📋 Obtener formularios registrados
    */
   obtenerFormulariosRegistrados() {
       return Array.from(this.formularios.keys());
   }

   /**
    * 🧹 Destruir validador
    */
   destruir() {
       this.formularios.clear();
       this.reglasPersonalizadas.clear();
       this.mensajesPersonalizados.clear();
       
       console.log('🧹 Validador de formularios destruido');
   }
}

// 🚀 Crear instancia global
window.ValidadorFormularios = new ValidadorFormularios();

// 🎯 Alias para conveniencia
window.Validar = {
   formulario: (formId) => window.ValidadorFormularios.validarFormulario(formId),
   campo: (formId, campo) => window.ValidadorFormularios.validarCampo(formId, campo),
   registrar: (form, opciones) => window.ValidadorFormularios.registrarFormulario(form, opciones),
   resetear: (formId) => window.ValidadorFormularios.resetearValidacion(formId),
   estado: (formId) => window.ValidadorFormularios.obtenerEstadoFormulario(formId),
   reglaPersonalizada: (nombre, funcion) => window.ValidadorFormularios.agregarReglaPersonalizada(nombre, funcion)
};

// 📤 Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
   module.exports = ValidadorFormularios;
}

console.log('✅ Validador de Formularios cargado correctamente');