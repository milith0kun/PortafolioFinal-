/**
 * 🗺️ SISTEMA DE ENRUTAMIENTO
 * Sistema Portafolio Docente UNSAAC
 * 
 * Manejo de rutas, navegación y protección de páginas
 * Sistema SPA con validación de roles y permisos
 */

class Enrutador {
   constructor() {
       this.rutas = new Map();
       this.rutaActual = null;
       this.historial = [];
       this.maxHistorial = 50;
       this.transicionEnProceso = false;
       
       // Configuración del enrutador
       this.config = {
           basePath: '/',
           modoHistoria: true,
           scroll: true,
           cache: true,
           precargar: true
       };

       // Cache de páginas
       this.cachePages = new Map();
       
       // Bind methods
       this.manejarCambioRuta = this.manejarCambioRuta.bind(this);
       this.manejarClicEnlace = this.manejarClicEnlace.bind(this);
   }

   /**
    * 🚀 Inicializar el enrutador
    */
   async inicializar() {
       try {
           // Registrar rutas del sistema
           this.registrarRutas();
           
           // Configurar listeners
           this.configurarListeners();
           
           // Procesar ruta inicial
           await this.procesarRutaInicial();
           
           console.log('🗺️ Enrutador inicializado correctamente');
       } catch (error) {
           console.error('❌ Error inicializando enrutador:', error);
           throw error;
       }
   }

   /**
    * 📋 Registrar todas las rutas del sistema
    */
   registrarRutas() {
       // =====================================
       // RUTAS DE AUTENTICACIÓN
       // =====================================
       this.agregarRuta('/login', {
           titulo: 'Iniciar Sesión',
           archivo: '/paginas/autenticacion/login.html',
           script: '/assets/js/paginas/autenticacion/manejador-login.js',
           publico: true,
           cache: false
       });

       this.agregarRuta('/selector-rol', {
           titulo: 'Seleccionar Rol',
           archivo: '/paginas/autenticacion/selector-rol.html',
           script: '/assets/js/paginas/autenticacion/selector-rol.js',
           requiereAuth: true,
           cache: false
       });

       this.agregarRuta('/recuperar', {
           titulo: 'Recuperar Contraseña',
           archivo: '/paginas/autenticacion/recuperar.html',
           script: '/assets/js/paginas/autenticacion/recuperar-clave.js',
           publico: true
       });

       // =====================================
       // RUTAS COMPARTIDAS
       // =====================================
       this.agregarRuta('/perfil', {
           titulo: 'Mi Perfil',
           archivo: '/paginas/compartidas/perfil.html',
           script: '/assets/js/paginas/compartidas/editor-perfil.js',
           requiereAuth: true,
           roles: ['administrador', 'docente', 'verificador']
       });

       this.agregarRuta('/cambiar-clave', {
           titulo: 'Cambiar Contraseña',
           archivo: '/paginas/compartidas/cambiar-clave.html',
           script: '/assets/js/paginas/compartidas/cambiar-clave.js',
           requiereAuth: true,
           roles: ['administrador', 'docente', 'verificador']
       });

       this.agregarRuta('/notificaciones', {
           titulo: 'Centro de Notificaciones',
           archivo: '/paginas/compartidas/notificaciones.html',
           script: '/assets/js/paginas/compartidas/gestor-notificaciones.js',
           requiereAuth: true,
           roles: ['administrador', 'docente', 'verificador']
       });

       // =====================================
       // RUTAS DE ADMINISTRADOR
       // =====================================
       this.agregarRuta('/', {
           titulo: 'Dashboard Administrador',
           archivo: '/paginas/administrador/tablero.html',
           script: '/assets/js/paginas/administrador/tablero.js',
           requiereAuth: true,
           roles: ['administrador'],
           esDefault: true
       });

       this.agregarRuta('/admin/usuarios', {
           titulo: 'Gestión de Usuarios',
           archivo: '/paginas/administrador/usuarios.html',
           script: '/assets/js/paginas/administrador/crud-usuarios.js',
           requiereAuth: true,
           roles: ['administrador']
       });

       this.agregarRuta('/admin/ciclos', {
           titulo: 'Gestión de Ciclos Académicos',
           archivo: '/paginas/administrador/ciclos-academicos.html',
           script: '/assets/js/paginas/administrador/gestion-ciclos.js',
           requiereAuth: true,
           roles: ['administrador']
       });

       this.agregarRuta('/admin/asignaturas', {
           titulo: 'Gestión de Asignaturas',
           archivo: '/paginas/administrador/asignaturas.html',
           script: '/assets/js/paginas/administrador/crud-asignaturas.js',
           requiereAuth: true,
           roles: ['administrador']
       });

       this.agregarRuta('/admin/carga-excel', {
           titulo: 'Carga Masiva Excel',
           archivo: '/paginas/administrador/carga-excel.html',
           script: '/assets/js/paginas/administrador/manejador-excel.js',
           requiereAuth: true,
           roles: ['administrador']
       });

       this.agregarRuta('/admin/reportes', {
           titulo: 'Generación de Reportes',
           archivo: '/paginas/administrador/reportes.html',
           script: '/assets/js/paginas/administrador/generador-reportes.js',
           requiereAuth: true,
           roles: ['administrador']
       });

       this.agregarRuta('/admin/asignaciones', {
           titulo: 'Gestión de Asignaciones',
           archivo: '/paginas/administrador/asignaciones.html',
           script: '/assets/js/paginas/administrador/asignaciones.js',
           requiereAuth: true,
           roles: ['administrador']
       });

       this.agregarRuta('/admin/configuracion', {
           titulo: 'Configuración del Sistema',
           archivo: '/paginas/administrador/configuracion.html',
           script: '/assets/js/paginas/administrador/configuracion-sistema.js',
           requiereAuth: true,
           roles: ['administrador']
       });

       // =====================================
       // RUTAS DE DOCENTE
       // =====================================
       this.agregarRuta('/docente', {
           titulo: 'Dashboard Docente',
           archivo: '/paginas/docente/tablero.html',
           script: '/assets/js/paginas/docente/tablero.js',
           requiereAuth: true,
           roles: ['docente']
       });

       this.agregarRuta('/docente/portafolios', {
           titulo: 'Mis Portafolios',
           archivo: '/paginas/docente/mis-portafolios.html',
           script: '/assets/js/paginas/docente/gestor-portafolios.js',
           requiereAuth: true,
           roles: ['docente']
       });

       this.agregarRuta('/docente/explorador', {
           titulo: 'Explorador de Archivos',
           archivo: '/paginas/docente/explorador.html',
           script: '/assets/js/paginas/docente/explorador-archivos.js',
           requiereAuth: true,
           roles: ['docente']
       });

       this.agregarRuta('/docente/subir', {
           titulo: 'Subir Documentos',
           archivo: '/paginas/docente/subir.html',
           script: '/assets/js/paginas/docente/subir-documentos.js',
           requiereAuth: true,
           roles: ['docente']
       });

       this.agregarRuta('/docente/progreso', {
           titulo: 'Mi Progreso',
           archivo: '/paginas/docente/progreso.html',
           script: '/assets/js/paginas/docente/calculador-progreso.js',
           requiereAuth: true,
           roles: ['docente']
       });

       this.agregarRuta('/docente/observaciones', {
           titulo: 'Mis Observaciones',
           archivo: '/paginas/docente/observaciones.html',
           script: '/assets/js/paginas/docente/visor-observaciones.js',
           requiereAuth: true,
           roles: ['docente']
       });

       // =====================================
       // RUTAS DE VERIFICADOR
       // =====================================
       this.agregarRuta('/verificador', {
           titulo: 'Dashboard Verificador',
           archivo: '/paginas/verificador/tablero.html',
           script: '/assets/js/paginas/verificador/tablero.js',
           requiereAuth: true,
           roles: ['verificador']
       });

       this.agregarRuta('/verificador/cola', {
           titulo: 'Cola de Revisión',
           archivo: '/paginas/verificador/cola-revision.html',
           script: '/assets/js/paginas/verificador/cola-revision.js',
           requiereAuth: true,
           roles: ['verificador']
       });

       this.agregarRuta('/verificador/revisar/:id', {
           titulo: 'Revisar Documento',
           archivo: '/paginas/verificador/revisar.html',
           script: '/assets/js/paginas/verificador/revisar-documentos.js',
           requiereAuth: true,
           roles: ['verificador']
       });

       this.agregarRuta('/verificador/observaciones', {
           titulo: 'Crear Observación',
           archivo: '/paginas/verificador/crear-observacion.html',
           script: '/assets/js/paginas/verificador/creador-observaciones.js',
           requiereAuth: true,
           roles: ['verificador']
       });

       this.agregarRuta('/verificador/estadisticas', {
           titulo: 'Estadísticas de Verificación',
           archivo: '/paginas/verificador/estadisticas.html',
           script: '/assets/js/paginas/verificador/estadisticas.js',
           requiereAuth: true,
           roles: ['verificador']
       });

       // =====================================
       // RUTAS DE ERROR
       // =====================================
       this.agregarRuta('/403', {
           titulo: 'Acceso Denegado',
           archivo: '/paginas/errores/403.html',
           publico: true,
           cache: false
       });

       this.agregarRuta('/404', {
           titulo: 'Página No Encontrada',
           archivo: '/paginas/errores/404.html',
           publico: true,
           cache: false
       });

       this.agregarRuta('/500', {
           titulo: 'Error del Servidor',
           archivo: '/paginas/errores/500.html',
           publico: true,
           cache: false
       });
   }

   /**
    * ➕ Agregar ruta al sistema
    */
   agregarRuta(path, configuracion) {
       this.rutas.set(path, {
           path,
           titulo: configuracion.titulo || 'Sin título',
           archivo: configuracion.archivo,
           script: configuracion.script,
           requiereAuth: configuracion.requiereAuth || false,
           roles: configuracion.roles || [],
           publico: configuracion.publico || false,
           cache: configuracion.cache !== false,
           precargar: configuracion.precargar || false,
           esDefault: configuracion.esDefault || false,
           parametros: this.extraerParametros(path)
       });
   }

   /**
    * 🎯 Configurar listeners de navegación
    */
   configurarListeners() {
       // Listener para cambios en el historial
       window.addEventListener('popstate', this.manejarCambioRuta);
       
       // Listener para interceptar clics en enlaces
       document.addEventListener('click', this.manejarClicEnlace);
       
       // Listener para cambios de rol
       window.aplicacion.escucharEvento('aplicacion:rolCambiado', (event) => {
           this.verificarAccesoRutaActual();
       });
   }

   /**
    * 🚀 Procesar ruta inicial
    */
   async procesarRutaInicial() {
       const rutaInicial = window.location.pathname + window.location.search;
       await this.navegar(rutaInicial, false, false);
   }

   /**
    * 🧭 Navegar a una ruta
    */
   async navegar(ruta, agregarAlHistorial = true, scroll = true) {
       if (this.transicionEnProceso) {
           console.warn('⚠️ Transición en proceso, ignorando navegación');
           return false;
       }

       try {
           this.transicionEnProceso = true;

           // Normalizar ruta
           ruta = this.normalizarRuta(ruta);

           // Buscar configuración de ruta
           const configuracionRuta = this.encontrarRuta(ruta);
           
           if (!configuracionRuta) {
               console.warn(`⚠️ Ruta no encontrada: ${ruta}`);
               return await this.navegar('/404', agregarAlHistorial, scroll);
           }

           // Verificar autenticación y permisos
           const tieneAcceso = await this.verificarAcceso(configuracionRuta);
           if (!tieneAcceso) {
               return false;
           }

           // Cargar página
           const cargaExitosa = await this.cargarPagina(configuracionRuta, ruta);
           
           if (cargaExitosa) {
               // Actualizar estado
               this.rutaActual = configuracionRuta;
               
               // Actualizar URL
               if (agregarAlHistorial) {
                   history.pushState({ ruta }, configuracionRuta.titulo, ruta);
               }
               
               // Actualizar título
               document.title = `${configuracionRuta.titulo} - Sistema Portafolio UNSAAC`;
               
               // Agregar al historial interno
               this.agregarAlHistorial(ruta);
               
               // Scroll al top si es necesario
               if (scroll && this.config.scroll) {
                   window.scrollTo(0, 0);
               }

               // Emitir evento de navegación
               window.aplicacion.emitirEvento('enrutador:navegacion', {
                   ruta,
                   configuracion: configuracionRuta
               });

               console.log(`🧭 Navegado a: ${ruta}`);
               return true;
           }

           return false;

       } catch (error) {
           console.error('❌ Error en navegación:', error);
           return await this.navegar('/500', agregarAlHistorial, scroll);
       } finally {
           this.transicionEnProceso = false;
       }
   }

   /**
    * 🔍 Encontrar configuración de ruta
    */
   encontrarRuta(ruta) {
       // Buscar ruta exacta
       if (this.rutas.has(ruta)) {
           return this.rutas.get(ruta);
       }

       // Buscar ruta con parámetros
       for (const [patron, configuracion] of this.rutas) {
           if (this.coincidePatron(patron, ruta)) {
               return {
                   ...configuracion,
                   parametros: this.extraerParametrosDeRuta(patron, ruta)
               };
           }
       }

       return null;
   }

   /**
    * 🔐 Verificar acceso a ruta
    */
   async verificarAcceso(configuracionRuta) {
       // Rutas públicas siempre tienen acceso
       if (configuracionRuta.publico) {
           return true;
       }

       // Verificar autenticación
       if (configuracionRuta.requiereAuth) {
           const estaAutenticado = window.sistemaAutenticacion?.estaAutenticado();
           
           if (!estaAutenticado) {
               console.log('🔐 Usuario no autenticado, redirigiendo a login');
               await this.navegar('/login');
               return false;
           }
       }

       // Verificar roles
       if (configuracionRuta.roles && configuracionRuta.roles.length > 0) {
           const usuario = window.aplicacion.estadoGlobal.usuario;
           const rolActual = window.aplicacion.estadoGlobal.rolActual;
           
           if (!usuario || !rolActual) {
               await this.navegar('/login');
               return false;
           }

           if (!configuracionRuta.roles.includes(rolActual)) {
               console.warn(`⚠️ Acceso denegado. Rol requerido: ${configuracionRuta.roles.join(', ')}`);
               await this.navegar('/403');
               return false;
           }
       }

       return true;
   }

   /**
    * 📄 Cargar página
    */
   async cargarPagina(configuracionRuta, ruta) {
       try {
           // Verificar cache
           const cacheKey = `${configuracionRuta.path}_${configuracionRuta.archivo}`;
           
           if (this.config.cache && this.cachePages.has(cacheKey)) {
               const contenidoCacheado = this.cachePages.get(cacheKey);
               this.renderizarContenido(contenidoCacheado);
           } else {
               // Cargar archivo HTML
               const respuesta = await fetch(configuracionRuta.archivo);
               
               if (!respuesta.ok) {
                   throw new Error(`Error cargando página: ${respuesta.status}`);
               }
               
               const contenidoHTML = await respuesta.text();
               
               // Guardar en cache si está habilitado
               if (this.config.cache && configuracionRuta.cache) {
                   this.cachePages.set(cacheKey, contenidoHTML);
               }
               
               this.renderizarContenido(contenidoHTML);
           }

           // Cargar script si existe
           if (configuracionRuta.script) {
               await this.cargarScript(configuracionRuta.script);
           }

           return true;

       } catch (error) {
           console.error('❌ Error cargando página:', error);
           return false;
       }
   }

   /**
    * 🎨 Renderizar contenido en el DOM
    */
   renderizarContenido(contenidoHTML) {
       const contenedor = document.getElementById('contenido-principal') || 
                         document.querySelector('main') || 
                         document.body;
       
       // Aplicar transición de salida
       contenedor.style.opacity = '0';
       
       setTimeout(() => {
           contenedor.innerHTML = contenidoHTML;
           
           // Aplicar transición de entrada
           contenedor.style.opacity = '1';
       }, 150);
   }

   /**
    * 📜 Cargar script dinámicamente
    */
   async cargarScript(rutaScript) {
       return new Promise((resolve, reject) => {
           // Verificar si ya está cargado
           const scriptExistente = document.querySelector(`script[src="${rutaScript}"]`);
           if (scriptExistente) {
               resolve();
               return;
           }

           const script = document.createElement('script');
           script.src = rutaScript;
           script.async = true;
           
           script.onload = () => {
               console.log(`📜 Script cargado: ${rutaScript}`);
               resolve();
           };
           
           script.onerror = () => {
               console.error(`❌ Error cargando script: ${rutaScript}`);
               reject(new Error(`Error cargando script: ${rutaScript}`));
           };
           
           document.head.appendChild(script);
       });
   }

   /**
    * 🔄 Manejo de cambios de ruta (botón atrás/adelante)
    */
   async manejarCambioRuta(event) {
       const ruta = event.state?.ruta || window.location.pathname;
       await this.navegar(ruta, false, true);
   }

   /**
    * 🖱️ Manejo de clics en enlaces
    */
   manejarClicEnlace(event) {
       const enlace = event.target.closest('a[href]');
       
       if (!enlace) return;
       
       const href = enlace.getAttribute('href');
       
       // Ignorar enlaces externos o con target="_blank"
       if (href.startsWith('http') || 
           href.startsWith('mailto:') || 
           href.startsWith('tel:') ||
           enlace.target === '_blank') {
           return;
       }
       
       // Ignorar si tiene clase 'external'
       if (enlace.classList.contains('external')) {
           return;
       }
       
       event.preventDefault();
       this.navegar(href);
   }

   // ==========================================
   // MÉTODOS AUXILIARES
   // ==========================================

   normalizarRuta(ruta) {
       if (!ruta.startsWith('/')) {
           ruta = '/' + ruta;
       }
       return ruta.replace(/\/$/, '') || '/';
   }

   extraerParametros(patron) {
       const parametros = [];
       const regex = /:([^/]+)/g;
       let match;
       
       while ((match = regex.exec(patron)) !== null) {
           parametros.push(match[1]);
       }
       
       return parametros;
   }

   coincidePatron(patron, ruta) {
       const regexPatron = patron.replace(/:([^/]+)/g, '([^/]+)');
       const regex = new RegExp(`^${regexPatron}$`);
       return regex.test(ruta);
   }

   extraerParametrosDeRuta(patron, ruta) {
       const parametros = {};
       const nombresParametros = this.extraerParametros(patron);
       const regexPatron = patron.replace(/:([^/]+)/g, '([^/]+)');
       const regex = new RegExp(`^${regexPatron}$`);
       const matches = ruta.match(regex);
       
       if (matches) {
           nombresParametros.forEach((nombre, index) => {
               parametros[nombre] = matches[index + 1];
           });
       }
       
       return parametros;
   }

   agregarAlHistorial(ruta) {
       this.historial.push({
           ruta,
           timestamp: Date.now()
       });
       
       // Limitar tamaño del historial
       if (this.historial.length > this.maxHistorial) {
           this.historial.shift();
       }
   }

   async verificarAccesoRutaActual() {
       if (this.rutaActual) {
           const tieneAcceso = await this.verificarAcceso(this.rutaActual);
           if (!tieneAcceso) {
               // Redirigir a dashboard apropiado según rol
               const rolActual = window.aplicacion.estadoGlobal.rolActual;
               const rutaDefault = this.obtenerRutaDefaultPorRol(rolActual);
               await this.navegar(rutaDefault);
           }
       }
   }

   obtenerRutaDefaultPorRol(rol) {
       switch (rol) {
           case 'administrador': return '/';
           case 'docente': return '/docente';
           case 'verificador': return '/verificador';
           default: return '/login';
       }
   }

   /**
    * 🔄 Recargar página actual
    */
   async recargar() {
       if (this.rutaActual) {
           // Limpiar cache de la página actual
           const cacheKey = `${this.rutaActual.path}_${this.rutaActual.archivo}`;
           this.cachePages.delete(cacheKey);
           
           // Navegar nuevamente
           await this.navegar(window.location.pathname, false, false);
       }
   }

   /**
    * 🏠 Ir a página de inicio según rol
    */
   async irAInicio() {
       const rolActual = window.aplicacion.estadoGlobal.rolActual;
       const rutaInicio = this.obtenerRutaDefaultPorRol(rolActual);
       await this.navegar(rutaInicio);
   }

   /**
    * ⬅️ Ir atrás en el historial
    */
   irAtras() {
       if (this.historial.length > 1) {
           // Quitar la ruta actual
           this.historial.pop();
           // Obtener la ruta anterior
           const rutaAnterior = this.historial[this.historial.length - 1];
           this.navegar(rutaAnterior.ruta, false);
       } else {
           this.irAInicio();
       }
   }
}

// ==========================================
// INICIALIZACIÓN GLOBAL
// ==========================================

// Crear instancia global del enrutador
window.enrutador = new Enrutador();

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
   module.exports = Enrutador;
}