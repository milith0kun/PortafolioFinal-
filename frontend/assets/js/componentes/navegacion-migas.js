/**
 * 🍞 COMPONENTE DE NAVEGACIÓN DE MIGAS (BREADCRUMBS)
 * Sistema Portafolio Docente UNSAAC
 * 
 * Componente para mostrar la ruta de navegación actual
 * Breadcrumbs dinámicos, clickeables y contextuales por rol
 */

class ComponenteNavegacionMigas {
   constructor(configuracion = {}) {
       this.configuracion = {
           contenedor: configuracion.contenedor || '#migas-pan',
           mostrarInicio: configuracion.mostrarInicio !== false,
           iconoInicio: configuracion.iconoInicio || 'fa-home',
           separador: configuracion.separador || '/',
           maxElementos: configuracion.maxElementos || 5,
           claseContenedor: configuracion.claseContenedor || 'breadcrumb',
           claseElemento: configuracion.claseElemento || 'breadcrumb-item',
           animaciones: configuracion.animaciones !== false,
           mostrarIconos: configuracion.mostrarIconos !== false
       };

       // Estado del componente
       this.estado = {
           rutaActual: [],
           historico: [],
           rolActual: null
       };

       // Mapeo de rutas para generar migas contextuales
       this.mapaRutas = {
           // Rutas de administrador
           '/': {
               etiqueta: 'Dashboard',
               icono: 'fa-tachometer-alt',
               roles: ['administrador']
           },
           '/admin/usuarios': {
               etiqueta: 'Gestión de Usuarios',
               icono: 'fa-users',
               padre: '/',
               roles: ['administrador']
           },
           '/admin/ciclos': {
               etiqueta: 'Ciclos Académicos',
               icono: 'fa-calendar',
               padre: '/',
               roles: ['administrador']
           },
           '/admin/asignaturas': {
               etiqueta: 'Gestión de Asignaturas',
               icono: 'fa-book',
               padre: '/',
               roles: ['administrador']
           },
           '/admin/carga-excel': {
               etiqueta: 'Carga Masiva Excel',
               icono: 'fa-file-excel',
               padre: '/',
               roles: ['administrador']
           },
           '/admin/reportes': {
               etiqueta: 'Generación de Reportes',
               icono: 'fa-chart-bar',
               padre: '/',
               roles: ['administrador']
           },
           '/admin/asignaciones': {
               etiqueta: 'Gestión de Asignaciones',
               icono: 'fa-user-plus',
               padre: '/',
               roles: ['administrador']
           },
           '/admin/configuracion': {
               etiqueta: 'Configuración del Sistema',
               icono: 'fa-cog',
               padre: '/',
               roles: ['administrador']
           },

           // Rutas de docente
           '/docente': {
               etiqueta: 'Dashboard Docente',
               icono: 'fa-tachometer-alt',
               roles: ['docente']
           },
           '/docente/portafolios': {
               etiqueta: 'Mis Portafolios',
               icono: 'fa-folder',
               padre: '/docente',
               roles: ['docente']
           },
           '/docente/explorador': {
               etiqueta: 'Explorador de Archivos',
               icono: 'fa-folder-open',
               padre: '/docente',
               roles: ['docente']
           },
           '/docente/subir': {
               etiqueta: 'Subir Documentos',
               icono: 'fa-upload',
               padre: '/docente',
               roles: ['docente']
           },
           '/docente/progreso': {
               etiqueta: 'Mi Progreso',
               icono: 'fa-chart-line',
               padre: '/docente',
               roles: ['docente']
           },
           '/docente/observaciones': {
               etiqueta: 'Mis Observaciones',
               icono: 'fa-comments',
               padre: '/docente',
               roles: ['docente']
           },

           // Rutas de verificador
           '/verificador': {
               etiqueta: 'Dashboard Verificador',
               icono: 'fa-tachometer-alt',
               roles: ['verificador']
           },
           '/verificador/cola': {
               etiqueta: 'Cola de Revisión',
               icono: 'fa-list',
               padre: '/verificador',
               roles: ['verificador']
           },
           '/verificador/revisar': {
               etiqueta: 'Revisar Documento',
               icono: 'fa-eye',
               padre: '/verificador/cola',
               roles: ['verificador']
           },
           '/verificador/observaciones': {
               etiqueta: 'Crear Observación',
               icono: 'fa-comment-alt',
               padre: '/verificador',
               roles: ['verificador']
           },
           '/verificador/estadisticas': {
               etiqueta: 'Estadísticas de Verificación',
               icono: 'fa-chart-pie',
               padre: '/verificador',
               roles: ['verificador']
           },

           // Rutas compartidas
           '/perfil': {
               etiqueta: 'Mi Perfil',
               icono: 'fa-user',
               roles: ['administrador', 'docente', 'verificador']
           },
           '/cambiar-clave': {
               etiqueta: 'Cambiar Contraseña',
               icono: 'fa-key',
               padre: '/perfil',
               roles: ['administrador', 'docente', 'verificador']
           },
           '/notificaciones': {
               etiqueta: 'Centro de Notificaciones',
               icono: 'fa-bell',
               roles: ['administrador', 'docente', 'verificador']
           }
       };

       // Referencias DOM
       this.elementos = {};
       
       // Bind methods
       this.manejarCambioRuta = this.manejarCambioRuta.bind(this);
       this.manejarClickMiga = this.manejarClickMiga.bind(this);
   }

   /**
    * 🚀 Inicializar el componente
    */
   async inicializar() {
       try {
           console.log('🍞 Inicializando navegación de migas');

           // Obtener contenedor
           this.contenedor = typeof this.configuracion.contenedor === 'string' 
               ? document.querySelector(this.configuracion.contenedor)
               : this.configuracion.contenedor;

           if (!this.contenedor) {
               // Crear contenedor si no existe
               this.crearContenedor();
           }

           // Configurar eventos
           this.configurarEventos();
           
           // Obtener rol actual
           this.estado.rolActual = window.aplicacion?.estadoGlobal?.rolActual;
           
           // Generar migas para la ruta actual
           this.actualizarMigas();
           
           console.log('✅ Navegación de migas inicializada');
           
       } catch (error) {
           console.error('❌ Error inicializando navegación de migas:', error);
           throw error;
       }
   }

   /**
    * 🏗️ Crear contenedor si no existe
    */
   crearContenedor() {
       // Buscar un lugar apropiado para las migas
       const header = document.querySelector('header') || 
                     document.querySelector('.header') ||
                     document.querySelector('.barra-superior');
       
       if (header) {
           const contenedor = document.createElement('nav');
           contenedor.id = this.configuracion.contenedor.replace('#', '');
           contenedor.setAttribute('aria-label', 'breadcrumb');
           contenedor.className = 'migas-pan-container';
           
           header.appendChild(contenedor);
           this.contenedor = contenedor;
       } else {
           console.warn('⚠️ No se encontró un lugar apropiado para las migas de pan');
       }
   }

   /**
    * ⚙️ Configurar eventos del componente
    */
   configurarEventos() {
       // Escuchar cambios de ruta del enrutador
       if (window.aplicacion) {
           window.aplicacion.escucharEvento('enrutador:navegacion', this.manejarCambioRuta);
           window.aplicacion.escucharEvento('aplicacion:rolCambiado', (event) => {
               this.estado.rolActual = event.detail.rol;
               this.actualizarMigas();
           });
       }

       // Eventos de clic en las migas
       this.contenedor.addEventListener('click', this.manejarClickMiga);
   }

   /**
    * 🔄 Manejar cambio de ruta
    */
   manejarCambioRuta(evento) {
       const { ruta } = evento.detail;
       this.establecerRutaActual(ruta);
   }

   /**
    * 🖱️ Manejar clic en miga
    */
   manejarClickMiga(evento) {
       const enlaceMiga = evento.target.closest('[data-ruta]');
       if (enlaceMiga && !enlaceMiga.classList.contains('disabled')) {
           evento.preventDefault();
           const ruta = enlaceMiga.dataset.ruta;
           
           // Navegar usando el enrutador
           if (window.enrutador) {
               window.enrutador.navegar(ruta);
           } else {
               // Fallback a navegación tradicional
               window.location.href = ruta;
           }
       }
   }

   /**
    * 🛤️ Establecer ruta actual y generar migas
    */
   establecerRutaActual(ruta) {
       this.estado.rutaActual = this.construirRutaCompleta(ruta);
       this.actualizarMigas();
       
       // Agregar al histórico
       this.agregarAlHistorico(ruta);
   }

   /**
    * 🏗️ Construir ruta completa con jerarquía
    */
   construirRutaCompleta(rutaActual) {
       const migas = [];
       let rutaTemporal = rutaActual;

       // Buscar la ruta actual en el mapa
       let configuracionRuta = this.mapaRutas[rutaActual];
       
       // Si la ruta tiene parámetros, buscar el patrón base
       if (!configuracionRuta) {
           configuracionRuta = this.buscarRutaConParametros(rutaActual);
           rutaTemporal = configuracionRuta?.rutaBase || rutaActual;
       }

       // Construir jerarquía hacia arriba
       while (rutaTemporal && this.mapaRutas[rutaTemporal]) {
           const config = this.mapaRutas[rutaTemporal];
           
           // Verificar si el rol actual tiene acceso a esta ruta
           if (!config.roles || config.roles.includes(this.estado.rolActual)) {
               migas.unshift({
                   ruta: rutaTemporal,
                   etiqueta: config.etiqueta,
                   icono: config.icono,
                   activa: rutaTemporal === rutaActual
               });
           }
           
           rutaTemporal = config.padre;
       }

       // Agregar miga de inicio si está configurado
       if (this.configuracion.mostrarInicio && migas.length > 0 && migas[0].ruta !== this.obtenerRutaInicio()) {
           migas.unshift({
               ruta: this.obtenerRutaInicio(),
               etiqueta: 'Inicio',
               icono: this.configuracion.iconoInicio,
               activa: false
           });
       }

       return migas;
   }

   /**
    * 🔍 Buscar ruta que coincida con parámetros
    */
   buscarRutaConParametros(rutaActual) {
       // Buscar rutas que tengan parámetros (contienen :)
       for (const [patron, config] of Object.entries(this.mapaRutas)) {
           if (patron.includes(':')) {
               const regex = new RegExp('^' + patron.replace(/:([^/]+)/g, '([^/]+)') + '$');
               if (regex.test(rutaActual)) {
                   // Extraer parámetros
                   const parametros = rutaActual.match(regex);
                   const etiquetaConParametros = this.procesarEtiquetaConParametros(config.etiqueta, parametros);
                   
                   return {
                       ...config,
                       rutaBase: patron,
                       etiqueta: etiquetaConParametros,
                       parametros
                   };
               }
           }
       }
       
       return null;
   }

   /**
    * 📝 Procesar etiqueta con parámetros
    */
   procesarEtiquetaConParametros(etiqueta, parametros) {
       // Para rutas como '/verificador/revisar/:id', mostrar "Revisar Documento #123"
       if (parametros && parametros.length > 1) {
           const id = parametros[1];
           if (etiqueta.includes('Revisar')) {
               return `${etiqueta} #${id}`;
           } else if (etiqueta.includes('Editar')) {
               return `${etiqueta} #${id}`;
           } else if (etiqueta.includes('Ver')) {
               return `${etiqueta} #${id}`;
           }
       }
       
       return etiqueta;
   }

   /**
    * 🏠 Obtener ruta de inicio según rol
    */
   obtenerRutaInicio() {
       switch (this.estado.rolActual) {
           case 'administrador':
               return '/';
           case 'docente':
               return '/docente';
           case 'verificador':
               return '/verificador';
           default:
               return '/';
       }
   }

   /**
    * 🎨 Actualizar migas en el DOM
    */
   actualizarMigas() {
       if (!this.contenedor) return;

       const migas = this.estado.rutaActual;
       
       // Limitar número de elementos si es necesario
       const migasVisibles = this.limitarMigas(migas);
       
       // Generar HTML
       const html = this.generarHTMLMigas(migasVisibles);
       
       // Actualizar contenedor con animación
       if (this.configuracion.animaciones) {
           this.contenedor.style.opacity = '0';
           setTimeout(() => {
               this.contenedor.innerHTML = html;
               this.contenedor.style.opacity = '1';
           }, 150);
       } else {
           this.contenedor.innerHTML = html;
       }

       // Emitir evento de actualización
       this.emitirEvento('migas:actualizadas', {
           ruta: window.location.pathname,
           migas: migasVisibles
       });
   }

   /**
    * ✂️ Limitar número de migas mostradas
    */
   limitarMigas(migas) {
       if (migas.length <= this.configuracion.maxElementos) {
           return migas;
       }

       // Mantener primera, última y algunas del medio
       const resultado = [];
       
       // Agregar primera miga
       resultado.push(migas[0]);
       
       // Agregar indicador de elementos omitidos
       if (migas.length > this.configuracion.maxElementos) {
           resultado.push({
               etiqueta: '...',
               icono: 'fa-ellipsis-h',
               omitido: true,
               activa: false
           });
       }
       
       // Agregar últimas migas
       const ultimasCount = Math.min(this.configuracion.maxElementos - 2, migas.length - 1);
       const ultimasMigas = migas.slice(-ultimasCount);
       resultado.push(...ultimasMigas);
       
       return resultado;
   }

   /**
    * 🏗️ Generar HTML de las migas
    */
   generarHTMLMigas(migas) {
       if (migas.length === 0) return '';

       let html = `<ol class="${this.configuracion.claseContenedor}">`;
       
       migas.forEach((miga, index) => {
           const esUltima = index === migas.length - 1;
           const claseActiva = miga.activa || esUltima ? 'active' : '';
           const claseOmitido = miga.omitido ? 'omitido' : '';
           
           html += `<li class="${this.configuracion.claseElemento} ${claseActiva} ${claseOmitido}">`;
           
           if (miga.omitido) {
               // Elemento omitido, no clickeable
               html += `
                   <span class="miga-omitida">
                       ${this.configuracion.mostrarIconos ? `<i class="${miga.icono}"></i>` : ''}
                       ${miga.etiqueta}
                   </span>
               `;
           } else if (esUltima || miga.activa) {
               // Último elemento o activo, no clickeable
               html += `
                   <span class="miga-activa">
                       ${this.configuracion.mostrarIconos ? `<i class="${miga.icono}"></i>` : ''}
                       ${miga.etiqueta}
                   </span>
               `;
           } else {
               // Elemento clickeable
               html += `
                   <a href="${miga.ruta}" class="miga-enlace" data-ruta="${miga.ruta}">
                       ${this.configuracion.mostrarIconos ? `<i class="${miga.icono}"></i>` : ''}
                       ${miga.etiqueta}
                   </a>
               `;
           }
           
           html += '</li>';
       });
       
       html += '</ol>';
       return html;
   }

   // ==========================================
   // MÉTODOS PÚBLICOS
   // ==========================================

   /**
    * ➕ Agregar miga personalizada
    */
   agregarMigaPersonalizada(ruta, etiqueta, icono = 'fa-link', padre = null) {
       this.mapaRutas[ruta] = {
           etiqueta,
           icono,
           padre,
           roles: [this.estado.rolActual],
           personalizada: true
       };
       
       // Actualizar si es la ruta actual
       if (window.location.pathname === ruta) {
           this.establecerRutaActual(ruta);
       }
   }

   /**
    * 🗑️ Eliminar miga personalizada
    */
   eliminarMigaPersonalizada(ruta) {
       if (this.mapaRutas[ruta]?.personalizada) {
           delete this.mapaRutas[ruta];
           this.actualizarMigas();
       }
   }

   /**
    * ✏️ Actualizar etiqueta de miga actual
    */
   actualizarEtiquetaActual(nuevaEtiqueta) {
       if (this.estado.rutaActual.length > 0) {
           const ultimaMiga = this.estado.rutaActual[this.estado.rutaActual.length - 1];
           ultimaMiga.etiqueta = nuevaEtiqueta;
           this.actualizarMigas();
       }
   }

   /**
    * 🔄 Forzar actualización
    */
   forzarActualizacion() {
       this.establecerRutaActual(window.location.pathname);
   }

   /**
    * 📋 Obtener ruta actual como texto
    */
   obtenerRutaTexto(separador = ' > ') {
       return this.estado.rutaActual
           .map(miga => miga.etiqueta)
           .join(separador);
   }

   /**
    * 🗂️ Obtener histórico de navegación
    */
   obtenerHistorico() {
       return [...this.estado.historico];
   }

   /**
    * 🧹 Limpiar histórico
    */
   limpiarHistorico() {
       this.estado.historico = [];
   }

   // ==========================================
   // MÉTODOS AUXILIARES
   // ==========================================

   /**
    * 📝 Agregar al histórico
    */
   agregarAlHistorico(ruta) {
       const ahora = new Date();
       const entrada = {
           ruta,
           timestamp: ahora,
           etiqueta: this.mapaRutas[ruta]?.etiqueta || ruta
       };

       // Evitar duplicados consecutivos
       const ultimo = this.estado.historico[this.estado.historico.length - 1];
       if (!ultimo || ultimo.ruta !== ruta) {
           this.estado.historico.push(entrada);
           
           // Limitar tamaño del histórico
           if (this.estado.historico.length > 50) {
               this.estado.historico.shift();
           }
       }
   }

   /**
    * 📡 Emitir evento
    */
   emitirEvento(tipo, datos = {}) {
       if (window.aplicacion) {
           window.aplicacion.emitirEvento(`navegacionMigas:${tipo}`, datos);
       }
   }

   /**
    * 🎨 Aplicar tema personalizado
    */
   aplicarTema(tema) {
       if (this.contenedor) {
           this.contenedor.className = `migas-pan-container tema-${tema}`;
       }
   }

   /**
    * 🔧 Configurar opciones en tiempo real
    */
   configurar(nuevasOpciones) {
       this.configuracion = {
           ...this.configuracion,
           ...nuevasOpciones
       };
       
       this.actualizarMigas();
   }

   /**
    * 📱 Adaptar para dispositivos móviles
    */
   adaptarMovil() {
       if (window.innerWidth < 768) {
           // En móviles, mostrar solo las últimas 2 migas
           this.configuracion.maxElementos = 2;
           this.configuracion.mostrarIconos = false;
       } else {
           // En desktop, restaurar configuración original
           this.configuracion.maxElementos = 5;
           this.configuracion.mostrarIconos = true;
       }
       
       this.actualizarMigas();
   }

   /**
    * 🔍 Buscar en histórico
    */
   buscarEnHistorico(termino) {
       return this.estado.historico.filter(entrada => 
           entrada.etiqueta.toLowerCase().includes(termino.toLowerCase()) ||
           entrada.ruta.toLowerCase().includes(termino.toLowerCase())
       );
   }

   /**
    * 📊 Obtener estadísticas de navegación
    */
   obtenerEstadisticas() {
       const rutas = this.estado.historico.map(h => h.ruta);
       const contador = {};
       
       rutas.forEach(ruta => {
           contador[ruta] = (contador[ruta] || 0) + 1;
       });
       
       return {
           totalNavegaciones: rutas.length,
           rutasUnicas: Object.keys(contador).length,
           rutaMasFrecuente: Object.keys(contador).reduce((a, b) => 
               contador[a] > contador[b] ? a : b, Object.keys(contador)[0]
           ),
           distribucion: contador
       };
   }

   /**
    * 🧹 Destruir el componente
    */
   destruir() {
       // Remover listeners
       if (window.aplicacion) {
           window.aplicacion.removeEventListener('enrutador:navegacion', this.manejarCambioRuta);
       }
       
       if (this.contenedor) {
           this.contenedor.removeEventListener('click', this.manejarClickMiga);
       }

       // Limpiar referencias
       this.elementos = {};
       this.estado = {};
       this.mapaRutas = {};
   }
}

// ==========================================
// INICIALIZACIÓN GLOBAL
// ==========================================

// Crear instancia global del componente
window.componenteNavegacionMigas = new ComponenteNavegacionMigas();

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', () => {
       window.componenteNavegacionMigas.inicializar();
   });
} else {
   window.componenteNavegacionMigas.inicializar();
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
   module.exports = ComponenteNavegacionMigas;
}