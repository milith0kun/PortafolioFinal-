/**
 * 🛠️ UTILIDADES DEL SISTEMA
 * Sistema Portafolio Docente UNSAAC
 * 
 * Funciones auxiliares y utilitarios para todo el frontend
 */

// ==========================================
// 📅 UTILIDADES DE FECHA Y HORA
// ==========================================

const FechaUtils = {
    /**
     * 📅 Formatear fecha según configuración local
     */
    formatear(fecha, formato = null) {
        if (!fecha) return '';
        
        // ✅ MEJORADO: Manejo seguro de CONFIG
        const formatoDefault = (window.CONFIG?.LOCALIZACION?.FORMATO_FECHA) || 'DD/MM/YYYY';
        formato = formato || formatoDefault;
        
        const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
        
        if (isNaN(fechaObj.getTime())) return '';

        const opciones = this.obtenerOpcionesFormato(formato);
        return fechaObj.toLocaleDateString('es-PE', opciones);
    },

    /**
     * 🕐 Formatear fecha y hora
     */
    formatearFechaHora(fecha, formato = null) {
        if (!fecha) return '';
        
        const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
        
        if (isNaN(fechaObj.getTime())) return '';

        return fechaObj.toLocaleString('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: (window.CONFIG?.LOCALIZACION?.TIMEZONE) || 'America/Lima'
        });
    },

    /**
     * ⏰ Formatear solo hora
     */
    formatearHora(fecha) {
        if (!fecha) return '';
        
        const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
        
        if (isNaN(fechaObj.getTime())) return '';

        return fechaObj.toLocaleTimeString('es-PE', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: (window.CONFIG?.LOCALIZACION?.TIMEZONE) || 'America/Lima'
        });
    },

    /**
     * 📊 Fecha relativa (hace X tiempo)
     */
    formatearRelativo(fecha) {
        if (!fecha) return '';
        
        const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
        const ahora = new Date();
        const diferencia = ahora - fechaObj;
        
        const segundos = Math.floor(diferencia / 1000);
        const minutos = Math.floor(segundos / 60);
        const horas = Math.floor(minutos / 60);
        const dias = Math.floor(horas / 24);
        const meses = Math.floor(dias / 30);
        const años = Math.floor(dias / 365);

        if (segundos < 60) return 'Hace unos segundos';
        if (minutos < 60) return `Hace ${minutos} minuto${minutos !== 1 ? 's' : ''}`;
        if (horas < 24) return `Hace ${horas} hora${horas !== 1 ? 's' : ''}`;
        if (dias < 30) return `Hace ${dias} día${dias !== 1 ? 's' : ''}`;
        if (meses < 12) return `Hace ${meses} mes${meses !== 1 ? 'es' : ''}`;
        return `Hace ${años} año${años !== 1 ? 's' : ''}`;
    },

    /**
     * ✅ NUEVO: Formatear duración (ej: 2h 30m)
     */
    formatearDuracion(segundos) {
        if (!segundos || segundos < 0) return '0s';
        
        const horas = Math.floor(segundos / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);
        const segs = segundos % 60;
        
        let resultado = '';
        if (horas > 0) resultado += `${horas}h `;
        if (minutos > 0) resultado += `${minutos}m `;
        if (segs > 0 && horas === 0) resultado += `${segs}s`;
        
        return resultado.trim() || '0s';
    },

    /**
     * ✅ NUEVO: Obtener tiempo restante hasta fecha
     */
    tiempoRestante(fechaFin) {
        const ahora = new Date();
        const fin = new Date(fechaFin);
        const diff = fin - ahora;
        
        if (diff <= 0) return { expirado: true, texto: 'Expirado' };
        
        const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        let texto = '';
        if (dias > 0) texto += `${dias}d `;
        if (horas > 0) texto += `${horas}h `;
        if (minutos > 0 && dias === 0) texto += `${minutos}m`;
        
        return { 
            expirado: false, 
            dias, 
            horas, 
            minutos, 
            texto: texto.trim() || 'Menos de 1 minuto'
        };
    },

    /**
     * 🔧 Obtener opciones de formato
     */
    obtenerOpcionesFormato(formato) {
        const mapeoFormatos = {
            'DD/MM/YYYY': { year: 'numeric', month: '2-digit', day: '2-digit' },
            'MM/DD/YYYY': { year: 'numeric', month: '2-digit', day: '2-digit' },
            'YYYY-MM-DD': { year: 'numeric', month: '2-digit', day: '2-digit' },
            'DD MMM YYYY': { year: 'numeric', month: 'short', day: '2-digit' },
            'completo': { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }
        };
        
        return mapeoFormatos[formato] || mapeoFormatos['DD/MM/YYYY'];
    },

    /**
     * 📆 Verificar si una fecha es válida
     */
    esValida(fecha) {
        const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
        return fechaObj instanceof Date && !isNaN(fechaObj.getTime());
    },

    /**
     * 🔄 Convertir a formato ISO
     */
    aISO(fecha) {
        if (!fecha) return null;
        const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
        return this.esValida(fechaObj) ? fechaObj.toISOString() : null;
    },

    /**
     * ✅ NUEVO: Verificar si es hoy
     */
    esHoy(fecha) {
        const fechaObj = new Date(fecha);
        const hoy = new Date();
        return fechaObj.toDateString() === hoy.toDateString();
    },

    /**
     * ✅ NUEVO: Verificar si es esta semana
     */
    esEstaSemana(fecha) {
        const fechaObj = new Date(fecha);
        const hoy = new Date();
        const inicioSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay()));
        const finSemana = new Date(inicioSemana.getTime() + 6 * 24 * 60 * 60 * 1000);
        
        return fechaObj >= inicioSemana && fechaObj <= finSemana;
    }
};

// ==========================================
// 🔤 UTILIDADES DE TEXTO
// ==========================================

const TextoUtils = {
    /**
     * 🔡 Capitalizar primera letra
     */
    capitalizar(texto) {
        if (!texto) return '';
        return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
    },

    /**
     * 📝 Capitalizar cada palabra
     */
    capitalizarPalabras(texto) {
        if (!texto) return '';
        return texto.split(' ')
            .map(palabra => this.capitalizar(palabra))
            .join(' ');
    },

    /**
     * 🔗 Convertir a slug
     */
    aSlug(texto) {
        if (!texto) return '';
        return texto
            .toLowerCase()
            .replace(/[áàäâ]/g, 'a')
            .replace(/[éèëê]/g, 'e')
            .replace(/[íìïî]/g, 'i')
            .replace(/[óòöô]/g, 'o')
            .replace(/[úùüû]/g, 'u')
            .replace(/[ñ]/g, 'n')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    },

    /**
     * ✂️ Truncar texto
     */
    truncar(texto, longitud = 100, sufijo = '...') {
        if (!texto || texto.length <= longitud) return texto;
        return texto.substring(0, longitud - sufijo.length).trim() + sufijo;
    },

    /**
     * ✅ MEJORADO: Truncar por palabras
     */
    truncarPorPalabras(texto, palabras = 10, sufijo = '...') {
        if (!texto) return '';
        const arrayPalabras = texto.split(' ');
        if (arrayPalabras.length <= palabras) return texto;
        return arrayPalabras.slice(0, palabras).join(' ') + sufijo;
    },

    /**
     * 🧹 Limpiar HTML
     */
    limpiarHTML(texto) {
        if (!texto) return '';
        const div = document.createElement('div');
        div.innerHTML = texto;
        return div.textContent || div.innerText || '';
    },

    /**
     * 🔍 Escapar HTML
     */
    escaparHTML(texto) {
        if (!texto) return '';
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    },

    /**
     * 📊 Contar palabras
     */
    contarPalabras(texto) {
        if (!texto) return 0;
        return texto.trim().split(/\s+/).filter(palabra => palabra.length > 0).length;
    },

    /**
     * 🎯 Resaltar texto
     */
    resaltar(texto, termino, claseCSS = 'highlight') {
        if (!texto || !termino) return texto;
        const regex = new RegExp(`(${this.escaparRegex(termino)})`, 'gi');
        return texto.replace(regex, `<span class="${claseCSS}">$1</span>`);
    },

    /**
     * ✅ NUEVO: Escapar caracteres especiales para regex
     */
    escaparRegex(texto) {
        return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    /**
     * ✅ NUEVO: Remover acentos
     */
    removerAcentos(texto) {
        if (!texto) return '';
        return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    },

    /**
     * ✅ NUEVO: Generar iniciales
     */
    generarIniciales(nombre, apellido = '') {
        const nombreInicial = nombre ? nombre.charAt(0).toUpperCase() : '';
        const apellidoInicial = apellido ? apellido.charAt(0).toUpperCase() : '';
        return nombreInicial + apellidoInicial;
    },

    /**
     * ✅ NUEVO: Verificar si contiene texto
     */
    contiene(texto, busqueda, ignorarCase = true) {
        if (!texto || !busqueda) return false;
        const textoComparar = ignorarCase ? texto.toLowerCase() : texto;
        const busquedaComparar = ignorarCase ? busqueda.toLowerCase() : busqueda;
        return textoComparar.includes(busquedaComparar);
    }
};

// ==========================================
// 🔢 UTILIDADES NUMÉRICAS
// ==========================================

const NumeroUtils = {
    /**
     * 💰 Formatear como moneda
     */
    formatearMoneda(numero, moneda = 'PEN') {
        if (isNaN(numero)) return 'S/ 0.00';
        
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: moneda,
            minimumFractionDigits: 2
        }).format(numero);
    },

    /**
     * 📊 Formatear número con separadores
     */
    formatear(numero, decimales = 0) {
        if (isNaN(numero)) return '0';
        
        return new Intl.NumberFormat('es-PE', {
            minimumFractionDigits: decimales,
            maximumFractionDigits: decimales
        }).format(numero);
    },

    /**
     * 📈 Formatear porcentaje
     */
    formatearPorcentaje(numero, decimales = 1) {
        if (isNaN(numero)) return '0%';
        
        return new Intl.NumberFormat('es-PE', {
            style: 'percent',
            minimumFractionDigits: decimales,
            maximumFractionDigits: decimales
        }).format(numero / 100);
    },

    /**
     * 📦 Formatear tamaño de archivo
     */
    formatearTamaño(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const tamaños = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tamaños[i];
    },

    /**
     * 🎲 Generar número aleatorio
     */
    aleatorio(min = 0, max = 100) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * 🔒 Limitar número a un rango
     */
    limitar(numero, min, max) {
        return Math.min(Math.max(numero, min), max);
    },

    /**
     * ✅ NUEVO: Redondear a decimales específicos
     */
    redondear(numero, decimales = 2) {
        return Math.round(numero * Math.pow(10, decimales)) / Math.pow(10, decimales);
    },

    /**
     * ✅ NUEVO: Calcular porcentaje entre dos números
     */
    calcularPorcentaje(valor, total) {
        if (total === 0) return 0;
        return (valor / total) * 100;
    },

    /**
     * ✅ NUEVO: Interpolar entre dos números
     */
    interpolar(inicio, fin, factor) {
        return inicio + (fin - inicio) * factor;
    },

    /**
     * ✅ NUEVO: Verificar si es número válido
     */
    esNumeroValido(valor) {
        return !isNaN(valor) && isFinite(valor);
    }
};

// ==========================================
// 📁 UTILIDADES DE ARCHIVOS
// ==========================================

const ArchivoUtils = {
    /**
     * 📄 Obtener extensión de archivo
     */
    obtenerExtension(nombreArchivo) {
        if (!nombreArchivo) return '';
        const ultimoPunto = nombreArchivo.lastIndexOf('.');
        return ultimoPunto > 0 ? nombreArchivo.substring(ultimoPunto).toLowerCase() : '';
    },

    /**
     * 🔍 Verificar tipo de archivo
     */
    esTipoPermitido(nombreArchivo, tiposPermitidos = []) {
        const extension = this.obtenerExtension(nombreArchivo);
        return tiposPermitidos.includes(extension);
    },

    /**
     * 📊 Verificar tamaño de archivo
     */
    verificarTamaño(archivo, tamañoMaximoMB) {
        if (!archivo) return false;
        const tamañoMaximoBytes = tamañoMaximoMB * 1024 * 1024;
        return archivo.size <= tamañoMaximoBytes;
    },

    /**
     * ✅ MEJORADO: Obtener icono según tipo de archivo con más tipos
     */
    obtenerIcono(nombreArchivo) {
        const extension = this.obtenerExtension(nombreArchivo);
        const iconos = {
            '.pdf': 'fas fa-file-pdf',
            '.doc': 'fas fa-file-word',
            '.docx': 'fas fa-file-word',
            '.xls': 'fas fa-file-excel',
            '.xlsx': 'fas fa-file-excel',
            '.ppt': 'fas fa-file-powerpoint',
            '.pptx': 'fas fa-file-powerpoint',
            '.jpg': 'fas fa-file-image',
            '.jpeg': 'fas fa-file-image',
            '.png': 'fas fa-file-image',
            '.gif': 'fas fa-file-image',
            '.svg': 'fas fa-file-image',
            '.txt': 'fas fa-file-alt',
            '.rtf': 'fas fa-file-alt',
            '.zip': 'fas fa-file-archive',
            '.rar': 'fas fa-file-archive',
            '.7z': 'fas fa-file-archive',
            '.mp4': 'fas fa-file-video',
            '.avi': 'fas fa-file-video',
            '.mov': 'fas fa-file-video',
            '.mp3': 'fas fa-file-audio',
            '.wav': 'fas fa-file-audio',
            '.csv': 'fas fa-file-csv'
        };
        
        return iconos[extension] || 'fas fa-file';
    },

    /**
     * 🏷️ Obtener clase CSS según tipo
     */
    obtenerClaseTipo(nombreArchivo) {
        const extension = this.obtenerExtension(nombreArchivo);
        const clases = {
            '.pdf': 'archivo-pdf',
            '.doc': 'archivo-word',
            '.docx': 'archivo-word',
            '.xls': 'archivo-excel',
            '.xlsx': 'archivo-excel',
            '.ppt': 'archivo-powerpoint',
            '.pptx': 'archivo-powerpoint',
            '.jpg': 'archivo-imagen',
            '.jpeg': 'archivo-imagen',
            '.png': 'archivo-imagen',
            '.gif': 'archivo-imagen',
            '.svg': 'archivo-imagen'
        };
        
        return clases[extension] || 'archivo-generico';
    },

    /**
     * 🔄 Convertir archivo a Base64
     */
    async aBase64(archivo) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(archivo);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },

    /**
     * ✅ NUEVO: Leer archivo como texto
     */
    async leerTexto(archivo) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsText(archivo);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },

    /**
     * ✅ NUEVO: Verificar archivo completo (tipo, tamaño, etc.)
     */
    verificarArchivo(archivo, configuracion = {}) {
        const errores = [];
        
        // Verificar que existe
        if (!archivo) {
            errores.push('No se ha seleccionado ningún archivo');
            return { valido: false, errores };
        }
        
        // Verificar extensión
        if (configuracion.tiposPermitidos && configuracion.tiposPermitidos.length > 0) {
            if (!this.esTipoPermitido(archivo.name, configuracion.tiposPermitidos)) {
                errores.push(`Tipo de archivo no permitido. Tipos permitidos: ${configuracion.tiposPermitidos.join(', ')}`);
            }
        }
        
        // Verificar tamaño
        if (configuracion.tamañoMaximo) {
            if (!this.verificarTamaño(archivo, configuracion.tamañoMaximo)) {
                errores.push(`El archivo es demasiado grande. Tamaño máximo: ${configuracion.tamañoMaximo}MB`);
            }
        }
        
        return {
            valido: errores.length === 0,
            errores,
            info: {
                nombre: archivo.name,
                tamaño: archivo.size,
                tipo: archivo.type,
                extension: this.obtenerExtension(archivo.name),
                tamañoFormateado: NumeroUtils.formatearTamaño(archivo.size)
            }
        };
    },

    /**
     * ✅ NUEVO: Generar nombre único para archivo
     */
    generarNombreUnico(nombreOriginal) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const extension = this.obtenerExtension(nombreOriginal);
        const nombreSinExtension = nombreOriginal.replace(extension, '');
        
        return `${TextoUtils.aSlug(nombreSinExtension)}_${timestamp}_${random}${extension}`;
    }
};

// ==========================================
// 🎨 UTILIDADES DE DOM
// ==========================================

const DOMUtils = {
    /**
     * 🔍 Selector seguro
     */
    $(selector, contexto = document) {
        try {
            return contexto.querySelector(selector);
        } catch (error) {
            console.warn(`Selector inválido: ${selector}`);
            return null;
        }
    },

    /**
     * 🔍 Selector múltiple
     */
    $$(selector, contexto = document) {
        try {
            return Array.from(contexto.querySelectorAll(selector));
        } catch (error) {
            console.warn(`Selector inválido: ${selector}`);
            return [];
        }
    },

    /**
     * ➕ Crear elemento con atributos
     */
    crear(tag, atributos = {}, contenido = '') {
        const elemento = document.createElement(tag);
        
        Object.keys(atributos).forEach(attr => {
            if (attr === 'className') {
                elemento.className = atributos[attr];
            } else if (attr === 'dataset') {
                Object.keys(atributos[attr]).forEach(dataKey => {
                    elemento.dataset[dataKey] = atributos[attr][dataKey];
                });
            } else if (attr === 'style' && typeof atributos[attr] === 'object') {
                Object.assign(elemento.style, atributos[attr]);
            } else {
                elemento.setAttribute(attr, atributos[attr]);
            }
        });
        
        if (contenido) {
            elemento.innerHTML = contenido;
        }
        
        return elemento;
    },

    /**
     * 👁️ Verificar si elemento está visible
     */
    esVisible(elemento) {
        if (!elemento) return false;
        
        const rect = elemento.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    /**
     * 📜 Scroll suave a elemento
     */
    scrollA(elemento, comportamiento = 'smooth') {
        if (!elemento) return;
        
        if (typeof elemento === 'string') {
            elemento = this.$(elemento);
        }
        
        if (elemento) {
            elemento.scrollIntoView({ 
                behavior: comportamiento,
                block: 'center',
                inline: 'nearest'
            });
        }
    },

    /**
     * 🎭 Toggle de clase
     */
    toggleClase(elemento, clase) {
        if (!elemento) return;
        elemento.classList.toggle(clase);
    },

    /**
     * ✅ NUEVO: Añadir clase con verificación
     */
    añadirClase(elemento, ...clases) {
        if (!elemento) return;
        elemento.classList.add(...clases);
    },

    /**
     * ✅ NUEVO: Remover clase con verificación
     */
    removerClase(elemento, ...clases) {
        if (!elemento) return;
        elemento.classList.remove(...clases);
    },

    /**
     * 🧹 Limpiar contenido
     */
    limpiar(elemento) {
        if (!elemento) return;
        elemento.innerHTML = '';
    },

    /**
     * ✅ NUEVO: Verificar si elemento tiene clase
     */
    tieneClase(elemento, clase) {
        if (!elemento) return false;
        return elemento.classList.contains(clase);
    },

    /**
     * ✅ NUEVO: Obtener posición del elemento
     */
    obtenerPosicion(elemento) {
        if (!elemento) return null;
        
        const rect = elemento.getBoundingClientRect();
        return {
            top: rect.top + window.pageYOffset,
            left: rect.left + window.pageXOffset,
            width: rect.width,
            height: rect.height,
            bottom: rect.top + window.pageYOffset + rect.height,
            right: rect.left + window.pageXOffset + rect.width
        };
    },

    /**
     * ✅ NUEVO: Verificar si elemento está en viewport
     */
    estaEnViewport(elemento, threshold = 0) {
        if (!elemento) return false;
        
        const rect = elemento.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        
        const verticalVisible = (rect.top <= windowHeight * (1 - threshold)) && ((rect.top + rect.height) >= windowHeight * threshold);
        const horizontalVisible = (rect.left <= windowWidth * (1 - threshold)) && ((rect.left + rect.width) >= windowWidth * threshold);
        
        return verticalVisible && horizontalVisible;
    },

    /**
     * 📱 Detectar dispositivo móvil
     */
    esMovil() {
        return window.innerWidth <= (window.CONFIG?.RESPONSIVE?.MOVIL || 576);
    },

    /**
     * 📱 Detectar tablet
     */
    esTablet() {
        const movil = window.CONFIG?.RESPONSIVE?.MOVIL || 576;
        const tablet = window.CONFIG?.RESPONSIVE?.TABLET || 768;
        return window.innerWidth <= tablet && window.innerWidth > movil;
    },

    /**
     * ✅ NUEVO: Detectar escritorio
     */
    esEscritorio() {
        return window.innerWidth > (window.CONFIG?.RESPONSIVE?.TABLET || 768);
    },

    /**
     * ✅ NUEVO: Animar elemento
     */
    animar(elemento, animacion, duracion = 300) {
        if (!elemento) return Promise.resolve();
        
        return new Promise(resolve => {
            const handleAnimationEnd = () => {
                elemento.classList.remove(animacion);
                elemento.removeEventListener('animationend', handleAnimationEnd);
                resolve();
            };
            
            elemento.addEventListener('animationend', handleAnimationEnd);
            elemento.style.animationDuration = `${duracion}ms`;
            elemento.classList.add(animacion);
        });
    },

    /**
     * ✅ NUEVO: Fade in/out
     */
    fadeIn(elemento, duracion = 300) {
        if (!elemento) return Promise.resolve();
        
        elemento.style.opacity = '0';
        elemento.style.display = 'block';
        
        return new Promise(resolve => {
            elemento.style.transition = `opacity ${duracion}ms`;
            elemento.style.opacity = '1';
            
            setTimeout(() => {
                elemento.style.transition = '';
                resolve();
            }, duracion);
        });
    },

    fadeOut(elemento, duracion = 300) {
        if (!elemento) return Promise.resolve();
        
        return new Promise(resolve => {
            elemento.style.transition = `opacity ${duracion}ms`;
            elemento.style.opacity = '0';
            
            setTimeout(() => {
                elemento.style.display = 'none';
                elemento.style.transition = '';
                resolve();
            }, duracion);
        });
    }
};

// ==========================================
// 📢 UTILIDADES DE NOTIFICACIONES
// ==========================================

const NotificacionUtils = {
    /**
     * ✅ Mostrar notificación de éxito
     */
    exito(mensaje, opciones = {}) {
        this.mostrar(mensaje, 'success', opciones);
    },

    /**
     * ⚠️ Mostrar notificación de advertencia
     */
    advertencia(mensaje, opciones = {}) {
        this.mostrar(mensaje, 'warning', opciones);
    },

    /**
     * ❌ Mostrar notificación de error
     */
    error(mensaje, opciones = {}) {
        this.mostrar(mensaje, 'error', opciones);
    },

    /**
     * ℹ️ Mostrar notificación informativa
     */
    info(mensaje, opciones = {}) {
        this.mostrar(mensaje, 'info', opciones);
    },

    /**
     * 📢 Mostrar notificación general
     */
    mostrar(mensaje, tipo = 'info', opciones = {}) {
        // Si SweetAlert2 está disponible
        if (window.Swal) {
            const iconos = {
                success: 'success',
                error: 'error',
                warning: 'warning',
                info: 'info'
            };

            const config = window.CONFIG?.UI?.NOTIFICACION_CONFIG || {};

            Swal.fire({
                icon: iconos[tipo] || 'info',
                title: opciones.titulo,
                text: mensaje,
                timer: opciones.tiempo || config.TIEMPO_DEFAULT || 5000,
                timerProgressBar: config.MOSTRAR_PROGRESO !== false,
                position: config.POSICION || 'top-end',
                toast: true,
                showConfirmButton: false,
                ...opciones
            });
        } else {
            // Fallback a notificación nativa
            this.notificacionNativa(mensaje, tipo, opciones);
        }
    },

    /**
     * ✅ NUEVO: Notificación nativa (fallback)
     */
    notificacionNativa(mensaje, tipo, opciones = {}) {
        const contenedor = this.obtenerContenedorNotificaciones();
        
        const notificacion = DOMUtils.crear('div', {
            className: `notificacion notificacion-${tipo}`,
            style: {
                padding: '12px 16px',
                margin: '8px 0',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                background: this.obtenerColorTipo(tipo),
                color: 'white',
                position: 'relative',
                animation: 'slideInRight 0.3s ease'
            }
        }, `
            <span class="notificacion-mensaje">${mensaje}</span>
            <button class="notificacion-cerrar" style="background:none;border:none;color:white;float:right;cursor:pointer;">&times;</button>
        `);
        
        // Evento de cierre
        const botonCerrar = notificacion.querySelector('.notificacion-cerrar');
        botonCerrar.addEventListener('click', () => {
            this.cerrarNotificacion(notificacion);
        });
        
        contenedor.appendChild(notificacion);
        
        // Auto-cierre
        const tiempo = opciones.tiempo || 5000;
        setTimeout(() => {
            this.cerrarNotificacion(notificacion);
        }, tiempo);
    },

    /**
     * ✅ NUEVO: Obtener contenedor de notificaciones
     */
    obtenerContenedorNotificaciones() {
        let contenedor = DOMUtils.$('#notificaciones-contenedor');
        
        if (!contenedor) {
            contenedor = DOMUtils.crear('div', {
                id: 'notificaciones-contenedor',
                style: {
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: '9999',
                    maxWidth: '400px'
                }
            });
            document.body.appendChild(contenedor);
        }
        
        return contenedor;
    },

    /**
     * ✅ NUEVO: Obtener color por tipo
     */
    obtenerColorTipo(tipo) {
        const colores = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colores[tipo] || colores.info;
    },

    /**
     * ✅ NUEVO: Cerrar notificación
     */
    cerrarNotificacion(notificacion) {
        notificacion.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notificacion.parentNode) {
                notificacion.parentNode.removeChild(notificacion);
            }
        }, 300);
    },

    /**
     * ❓ Mostrar confirmación
     */
    async confirmar(mensaje, opciones = {}) {
        if (window.Swal) {
            const resultado = await Swal.fire({
                title: opciones.titulo || '¿Estás seguro?',
                text: mensaje,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: opciones.textoConfirmar || 'Sí, confirmar',
                cancelButtonText: opciones.textoCancelar || 'Cancelar',
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                reverseButtons: true,
                ...opciones
            });
            
            return resultado.isConfirmed;
        } else {
            return confirm(`${opciones.titulo || '¿Estás seguro?'}\n\n${mensaje}`);
        }
    },

    /**
     * ✅ NUEVO: Modal de input
     */
    async input(titulo, opciones = {}) {
        if (window.Swal) {
            const resultado = await Swal.fire({
                title: titulo,
                input: opciones.tipo || 'text',
                inputLabel: opciones.etiqueta,
                inputPlaceholder: opciones.placeholder,
                inputValue: opciones.valorDefault || '',
                showCancelButton: true,
                confirmButtonText: opciones.textoConfirmar || 'Aceptar',
                cancelButtonText: opciones.textoCancelar || 'Cancelar',
                inputValidator: opciones.validador,
                ...opciones
            });
            
            return resultado.isConfirmed ? resultado.value : null;
        } else {
            return prompt(titulo, opciones.valorDefault || '');
        }
    }
};

// ==========================================
// 🔄 UTILIDADES DE PERFORMANCE
// ==========================================

const PerformanceUtils = {
    /**
     * ⏱️ Debounce
     */
    debounce(func, delay = null) {
        delay = delay || (window.CONFIG?.PERFORMANCE?.DEBOUNCE_SEARCH) || 300;
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    /**
     * 🚦 Throttle
     */
    throttle(func, limit = null) {
        limit = limit || (window.CONFIG?.PERFORMANCE?.THROTTLE_SCROLL) || 16;
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * ⏳ Lazy loading de imágenes
     */
    initLazyImages() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        img.classList.add('lazy-loaded');
                        imageObserver.unobserve(img);
                    }
                });
            }, {
                threshold: (window.CONFIG?.PERFORMANCE?.INTERSECTION_THRESHOLD) || 0.1
            });

            DOMUtils.$$('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        } else {
            // Fallback para navegadores sin IntersectionObserver
            DOMUtils.$$('img[data-src]').forEach(img => {
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                img.classList.add('lazy-loaded');
            });
        }
    },

    /**
     * ✅ NUEVO: Medir tiempo de ejecución
     */
    medirTiempo(nombre, funcion) {
        const inicio = performance.now();
        const resultado = funcion();
        const fin = performance.now();
        
        if (window.CONFIG?.ENTORNO?.debug) {
            console.log(`⏱️ ${nombre}: ${(fin - inicio).toFixed(2)}ms`);
        }
        
        return resultado;
    },

    /**
     * ✅ NUEVO: Async medir tiempo
     */
    async medirTiempoAsync(nombre, funcionAsync) {
        const inicio = performance.now();
        const resultado = await funcionAsync();
        const fin = performance.now();
        
        if (window.CONFIG?.ENTORNO?.debug) {
            console.log(`⏱️ ${nombre}: ${(fin - inicio).toFixed(2)}ms`);
        }
        
        return resultado;
    },

    /**
     * ✅ NUEVO: RequestAnimationFrame wrapper
     */
    enProximoFrame(callback) {
        return requestAnimationFrame(callback);
    },

    /**
     * ✅ NUEVO: Idle callback
     */
    enIdle(callback, timeout = 5000) {
        if ('requestIdleCallback' in window) {
            return requestIdleCallback(callback, { timeout });
        } else {
            return setTimeout(callback, 1);
        }
    }
};

// ==========================================
// 💾 UTILIDADES DE ALMACENAMIENTO
// ==========================================

const AlmacenamientoUtils = {
    /**
     * 💾 Guardar en localStorage con expiración
     */
    guardar(clave, valor, expiracionMs = null) {
        if (!this.soportaLocalStorage()) {
            console.warn('localStorage no está disponible');
            return false;
        }
        
        try {
            const item = {
                valor: valor,
                timestamp: Date.now(),
                expiracion: expiracionMs ? Date.now() + expiracionMs : null
            };
            
            localStorage.setItem(clave, JSON.stringify(item));
            return true;
        } catch (error) {
            console.error('Error guardando en localStorage:', error);
            return false;
        }
    },

    /**
     * 📖 Obtener de localStorage
     */
    obtener(clave, valorDefault = null) {
        if (!this.soportaLocalStorage()) {
            return valorDefault;
        }
        
        try {
            const item = localStorage.getItem(clave);
            if (!item) return valorDefault;

            const datos = JSON.parse(item);
            
            // Verificar expiración
            if (datos.expiracion && Date.now() > datos.expiracion) {
                this.eliminar(clave);
                return valorDefault;
            }
            
            return datos.valor;
        } catch (error) {
            console.error('Error leyendo localStorage:', error);
            this.eliminar(clave);
            return valorDefault;
        }
    },

    /**
     * 🗑️ Eliminar de localStorage
     */
    eliminar(clave) {
        if (!this.soportaLocalStorage()) return false;
        
        try {
            localStorage.removeItem(clave);
            return true;
        } catch (error) {
            console.error('Error eliminando de localStorage:', error);
            return false;
        }
    },

    /**
     * 🧹 Limpiar localStorage expirado
     */
    limpiarExpirados() {
        if (!this.soportaLocalStorage()) return;
        
        const claves = [];
        for (let i = 0; i < localStorage.length; i++) {
            claves.push(localStorage.key(i));
        }
        
        claves.forEach(clave => {
            this.obtener(clave); // Esto eliminará automáticamente los expirados
        });
    },

    /**
     * ✅ NUEVO: Verificar soporte de localStorage
     */
    soportaLocalStorage() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    },

    /**
     * ✅ NUEVO: Obtener tamaño usado del localStorage
     */
    obtenerTamañoUsado() {
        if (!this.soportaLocalStorage()) return 0;
        
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage.getItem(key).length + key.length;
            }
        }
        return total;
    },

    /**
     * ✅ NUEVO: Guardar en sessionStorage
     */
    guardarSesion(clave, valor) {
        try {
            sessionStorage.setItem(clave, JSON.stringify(valor));
            return true;
        } catch (error) {
            console.error('Error guardando en sessionStorage:', error);
            return false;
        }
    },

    /**
     * ✅ NUEVO: Obtener de sessionStorage
     */
    obtenerSesion(clave, valorDefault = null) {
        try {
            const item = sessionStorage.getItem(clave);
            return item ? JSON.parse(item) : valorDefault;
        } catch (error) {
            console.error('Error leyendo sessionStorage:', error);
            return valorDefault;
        }
    }
};

// ==========================================
// 🔧 UTILIDADES DE VALIDACIÓN
// ==========================================

const ValidacionUtils = {
    /**
     * 📧 Validar email
     */
    esEmailValido(email) {
        const patron = window.CONFIG?.VALIDACIONES?.EMAIL?.PATRON || /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return patron.test(email);
    },

    /**
     * ✅ NUEVO: Validar email institucional
     */
    esEmailInstitucional(email) {
        const patron = window.CONFIG?.VALIDACIONES?.EMAIL?.PATRON || 
                     /^[a-zA-Z0-9._%+-]+@(unsaac\.edu\.pe|estudiante\.unsaac\.edu\.pe)$/;
        return patron.test(email);
    },

    /**
     * 🔐 Validar contraseña
     */
    esPasswordValida(password) {
        const config = window.CONFIG?.VALIDACIONES?.PASSWORD || {
            MIN_LENGTH: 8,
            REQUIRE_UPPERCASE: true,
            REQUIRE_LOWERCASE: true,
            REQUIRE_NUMBERS: true,
            REQUIRE_SYMBOLS: false
        };
        
        if (password.length < config.MIN_LENGTH) return false;
        if (config.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) return false;
        if (config.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) return false;
        if (config.REQUIRE_NUMBERS && !/\d/.test(password)) return false;
        if (config.REQUIRE_SYMBOLS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
        
        return true;
    },

    /**
     * ✅ MEJORADO: Obtener fuerza de contraseña
     */
    obtenerFuerzaPassword(password) {
        let puntuacion = 0;
        const criterios = [];
        
        if (password.length >= 8) {
            puntuacion += 1;
            criterios.push('Longitud suficiente');
        }
        if (/[a-z]/.test(password)) {
            puntuacion += 1;
            criterios.push('Minúsculas');
        }
        if (/[A-Z]/.test(password)) {
            puntuacion += 1;
            criterios.push('Mayúsculas');
        }
        if (/\d/.test(password)) {
            puntuacion += 1;
            criterios.push('Números');
        }
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            puntuacion += 1;
            criterios.push('Símbolos');
        }
        
        const niveles = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Muy fuerte'];
        return {
            puntuacion,
            nivel: niveles[Math.min(puntuacion, 4)],
            criterios
        };
    },

    /**
     * 📱 Validar teléfono
     */
    esTelefonoValido(telefono) {
        const patron = /^(\+51|51)?\s?9\d{8}$/;
        return patron.test(telefono.replace(/\s/g, ''));
    },

    /**
     * 🏢 Validar RUC
     */
    esRUCValido(ruc) {
        if (!/^\d{11}$/.test(ruc)) return false;
        
        // Algoritmo de validación de RUC
        const factores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
        let suma = 0;
        
        for (let i = 0; i < 10; i++) {
            suma += parseInt(ruc[i]) * factores[i];
        }
        
        const resto = suma % 11;
        const digitoVerificador = resto < 2 ? resto : 11 - resto;
        
        return digitoVerificador === parseInt(ruc[10]);
    },

    /**
     * 🆔 Validar DNI
     */
    esDNIValido(dni) {
        return /^\d{8}$/.test(dni);
    },

    /**
     * ✅ NUEVO: Validar campo requerido
     */
    esRequerido(valor) {
        return valor !== null && valor !== undefined && String(valor).trim() !== '';
    },

    /**
     * ✅ NUEVO: Validar longitud
     */
    validarLongitud(valor, min = 0, max = Infinity) {
        const longitud = String(valor).length;
        return longitud >= min && longitud <= max;
    },

    /**
     * ✅ NUEVO: Validar patrón
     */
    validarPatron(valor, patron) {
        return patron.test(String(valor));
    },

    /**
     * ✅ NUEVO: Validar rango numérico
     */
    validarRango(valor, min = -Infinity, max = Infinity) {
        const numero = Number(valor);
        return !isNaN(numero) && numero >= min && numero <= max;
    },

    /**
     * ✅ NUEVO: Validar URL
     */
    esURLValida(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
};

// ==========================================
// ✅ NUEVAS UTILIDADES ESPECÍFICAS
// ==========================================

/**
 * 🌐 Utilidades de URL y navegación
 */
const URLUtils = {
    /**
     * Obtener parámetros de URL
     */
    obtenerParametros() {
        const params = new URLSearchParams(window.location.search);
        const resultado = {};
        for (let [clave, valor] of params) {
            resultado[clave] = valor;
        }
        return resultado;
    },

    /**
     * Obtener parámetro específico
     */
    obtenerParametro(nombre, valorDefault = null) {
        const params = new URLSearchParams(window.location.search);
        return params.get(nombre) || valorDefault;
    },

    /**
     * Construir URL con parámetros
     */
    construir(base, parametros = {}) {
        const url = new URL(base, window.location.origin);
        Object.entries(parametros).forEach(([clave, valor]) => {
            if (valor !== null && valor !== undefined) {
                url.searchParams.set(clave, valor);
            }
        });
        return url.toString();
    },

    /**
     * Navegar a URL con parámetros
     */
    navegar(url, parametros = {}) {
        const urlCompleta = this.construir(url, parametros);
        window.location.href = urlCompleta;
    },

    /**
     * Verificar si estamos en cierta página
     */
    esPagina(nombrePagina) {
        return window.location.pathname.includes(nombrePagina);
    }
};

/**
 * 📋 Utilidades de portapapeles
 */
const PortapapelesUtils = {
    /**
     * Copiar texto al portapapeles
     */
    async copiar(texto) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(texto);
                return true;
            } else {
                return this.copiarFallback(texto);
            }
        } catch (error) {
            console.error('Error copiando al portapapeles:', error);
            return this.copiarFallback(texto);
        }
    },

    /**
     * Fallback para copiar (navegadores antiguos)
     */
    copiarFallback(texto) {
        const textarea = DOMUtils.crear('textarea', {
            style: {
                position: 'fixed',
                top: '-9999px',
                left: '-9999px'
            }
        });
        
        textarea.value = texto;
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            const exito = document.execCommand('copy');
            document.body.removeChild(textarea);
            return exito;
        } catch (error) {
            document.body.removeChild(textarea);
            return false;
        }
    },

    /**
     * Leer del portapapeles
     */
    async leer() {
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                return await navigator.clipboard.readText();
            }
        } catch (error) {
            console.error('Error leyendo del portapapeles:', error);
        }
        return null;
    }
};

/**
 * 🎨 Utilidades de colores y temas
 */
const ColorUtils = {
    /**
     * Convertir hex a RGB
     */
    hexARgb(hex) {
        const resultado = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return resultado ? {
            r: parseInt(resultado[1], 16),
            g: parseInt(resultado[2], 16),
            b: parseInt(resultado[3], 16)
        } : null;
    },

    /**
     * Convertir RGB a hex
     */
    rgbAHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },

    /**
     * Obtener color por rol
     */
    obtenerColorRol(rol) {
        const colores = window.CONFIG?.ROLES?.COLORES_ROL || {
            administrador: '#dc2626',
            verificador: '#7c3aed',
            docente: '#059669'
        };
        return colores[rol] || '#6b7280';
    },

    /**
     * Verificar si color es claro u oscuro
     */
    esColorClaro(hex) {
        const rgb = this.hexARgb(hex);
        if (!rgb) return true;
        
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        return brightness > 128;
    }
};

/**
 * 🔢 Utilidades diversas
 */
const MiscUtils = {
    /**
     * Generar ID único
     */
    generarId(prefijo = 'id') {
        return `${prefijo}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Esperar tiempo determinado
     */
    esperar(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Clonar objeto profundamente
     */
    clonar(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.clonar(item));
        
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this.clonar(obj[key]);
            });
            return cloned;
        }
    },

    /**
     * Detectar capacidades del navegador
     */
    obtenerCapacidades() {
        return {
            localStorage: AlmacenamientoUtils.soportaLocalStorage(),
            sessionStorage: typeof sessionStorage !== 'undefined',
            webWorkers: typeof Worker !== 'undefined',
            webSockets: typeof WebSocket !== 'undefined',
            intersectionObserver: 'IntersectionObserver' in window,
            clipboard: navigator.clipboard !== undefined,
            notifications: 'Notification' in window,
            geolocation: 'geolocation' in navigator,
            camera: navigator.mediaDevices !== undefined
        };
    },

    /**
     * Obtener información del dispositivo
     */
    obtenerInfoDispositivo() {
        return {
            userAgent: navigator.userAgent,
            idioma: navigator.language,
            idiomas: navigator.languages,
            plataforma: navigator.platform,
            cookiesHabilitadas: navigator.cookieEnabled,
            enLinea: navigator.onLine,
            pantalla: {
                ancho: screen.width,
                alto: screen.height,
                profundidadColor: screen.colorDepth
            },
            ventana: {
                ancho: window.innerWidth,
                alto: window.innerHeight
            }
        };
    }
};

// ==========================================
// 🌐 EXPORTACIÓN GLOBAL
// ==========================================

// Hacer disponibles globalmente las utilidades
window.Utilidades = {
    Fecha: FechaUtils,
    Texto: TextoUtils,
    Numero: NumeroUtils,
    Archivo: ArchivoUtils,
    DOM: DOMUtils,
    Notificacion: NotificacionUtils,
    Performance: PerformanceUtils,
    Almacenamiento: AlmacenamientoUtils,
    Validacion: ValidacionUtils,
    URL: URLUtils,
    Portapapeles: PortapapelesUtils,
    Color: ColorUtils,
    Misc: MiscUtils
};

// ✅ NUEVO: Alias para compatibilidad
window.Utils = window.Utilidades;

// Funciones de conveniencia globales
window.mostrarNotificacion = NotificacionUtils.mostrar.bind(NotificacionUtils);
window.mostrarExito = NotificacionUtils.exito.bind(NotificacionUtils);
window.mostrarError = NotificacionUtils.error.bind(NotificacionUtils);
window.mostrarAdvertencia = NotificacionUtils.advertencia.bind(NotificacionUtils);
window.mostrarInfo = NotificacionUtils.info.bind(NotificacionUtils);
window.confirmar = NotificacionUtils.confirmar.bind(NotificacionUtils);
window.$ = DOMUtils.$;
window.$$ = DOMUtils.$$;

// ==========================================
// 🚀 INICIALIZACIÓN
// ==========================================

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar lazy loading
    const lazyEnabled = window.CONFIG?.PERFORMANCE?.LAZY_LOADING;
    if (lazyEnabled !== false) {
        PerformanceUtils.initLazyImages();
    }
    
    // Limpiar localStorage expirado
    AlmacenamientoUtils.limpiarExpirados();
    
    // ✅ NUEVO: Configurar observer de conectividad
    window.addEventListener('online', () => {
        document.dispatchEvent(new CustomEvent('network:online'));
    });
    
    window.addEventListener('offline', () => {
        document.dispatchEvent(new CustomEvent('network:offline'));
    });
    
    // ✅ NUEVO: Log de inicialización
    if (window.CONFIG?.ENTORNO?.debug) {
        console.group('🛠️ Utilidades del Sistema');
        console.log('✅ Utilidades inicializadas');
        console.log('📊 Capacidades del navegador:', MiscUtils.obtenerCapacidades());
        console.log('📱 Información del dispositivo:', MiscUtils.obtenerInfoDispositivo());
        console.groupEnd();
    }
});

// ✅ NUEVO: Evento personalizado de utilidades listas
document.dispatchEvent(new CustomEvent('utilidades:listas', {
    detail: window.Utilidades
}));

// 📤 Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FechaUtils,
        TextoUtils,
        NumeroUtils,
        ArchivoUtils,
        DOMUtils,
        NotificacionUtils,
        PerformanceUtils,
        AlmacenamientoUtils,
        ValidacionUtils,
        URLUtils,
        PortapapelesUtils,
        ColorUtils,
        MiscUtils
    };
}

console.log('🛠️ Módulo de utilidades cargado correctamente');