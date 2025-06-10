/**
 * ==========================================
 * 📜 JAVASCRIPT PRINCIPAL - DISTRIBUIDOR
 * Sistema Portafolio Docente UNSAAC
 * 
 * Este archivo organiza y carga todos los scripts
 * del sistema de manera optimizada y ordenada
 * ==========================================
 */

console.log('🚀 Iniciando Sistema Portafolio Docente UNSAAC v2.0');

// ===== CONFIGURACIÓN DE CARGA DE SCRIPTS =====
const RUTAS_SCRIPTS = {
  // 📚 Librerías externas
  librerias: [
    'assets/js/librerias/jquery.min.js',
    'assets/js/librerias/sweetalert2.min.js',
    'assets/js/librerias/bootstrap.bundle.min.js',
    'assets/js/librerias/chart.min.js',
    'assets/js/librerias/datatables.min.js'
  ],
  
  // 🔧 Núcleo del sistema
  nucleo: [
    'assets/js/nucleo/configuracion.js',
    'assets/js/nucleo/utilidades.js',
    'assets/js/nucleo/api.js',
    'assets/js/nucleo/autenticacion.js',
    'assets/js/nucleo/enrutador.js',
    'assets/js/nucleo/aplicacion.js'
  ],
  
  // 🛠️ Servicios de comunicación
  servicios: [
    'assets/js/servicios/servicio-autenticacion.js',
    'assets/js/servicios/servicio-usuarios.js',
    'assets/js/servicios/servicio-roles.js',
    'assets/js/servicios/servicio-ciclos.js',
    'assets/js/servicios/servicio-asignaturas.js',
    'assets/js/servicios/servicio-portafolios.js',
    'assets/js/servicios/servicio-documentos.js',
    'assets/js/servicios/servicio-observaciones.js',
    'assets/js/servicios/servicio-notificaciones.js',
    'assets/js/servicios/servicio-reportes.js'
  ],
  
  // 🧩 Componentes reutilizables
  componentes: [
    'assets/js/componentes/barra-superior.js',
    'assets/js/componentes/navegacion-lateral.js',
    'assets/js/componentes/sistema-modales.js',
    'assets/js/componentes/validador-formularios.js',
    'assets/js/componentes/centro-notificaciones.js',
    'assets/js/componentes/manejador-tablas.js',
    'assets/js/componentes/navegacion-migas.js',
    'assets/js/componentes/rastreador-progreso.js',
    'assets/js/componentes/subidor-archivos.js'
  ]
};

// ===== SISTEMA DE CARGA DINÁMICA =====
class CargadorScripts {
  constructor() {
    this.scriptsEsenciales = ['jquery', 'sweetalert2'];
    this.scriptsEspecificos = new Map();
    this.inicializar();
  }

  /**
   * Inicializa el sistema de carga
   */
  inicializar() {
    console.log('📦 Inicializando cargador de scripts...');
    this.detectarPagina();
    this.cargarScriptsEsenciales();
  }

  /**
   * Detecta la página actual para cargar scripts específicos
   */
  detectarPagina() {
    const ruta = window.location.pathname;
    const pagina = this.obtenerPaginaDesdeRuta(ruta);
    
    console.log(`📍 Página detectada: ${pagina}`);
    this.configurarScriptsPorPagina(pagina);
  }

  /**
   * Obtiene el nombre de la página desde la ruta
   */
  obtenerPaginaDesdeRuta(ruta) {
    if (ruta === '/' || ruta.endsWith('/index.html') || ruta.endsWith('/')) {
      return 'index';
    }
    
    const segmentos = ruta.split('/').filter(s => s);
    const archivo = segmentos[segmentos.length - 1];
    
    if (archivo.includes('.html')) {
      return archivo.replace('.html', '');
    }
    
    return segmentos[segmentos.length - 1] || 'index';
  }

  /**
   * Configura scripts específicos por página
   */
  configurarScriptsPorPagina(pagina) {
    const configuraciones = {
      // === PÁGINA PRINCIPAL ===
      'index': {
        especificos: ['assets/js/paginas/index.js'],
        componentes: ['barra-superior', 'centro-notificaciones']
      },
      
      // === AUTENTICACIÓN ===
      'login': {
        especificos: ['assets/js/paginas/autenticacion/manejador-login.js'],
        componentes: ['validador-formularios']
      },
      'selector-rol': {
        especificos: ['assets/js/paginas/autenticacion/selector-rol.js'],
        componentes: ['validador-formularios']
      },
      'recuperar': {
        especificos: ['assets/js/paginas/autenticacion/recuperar-clave.js'],
        componentes: ['validador-formularios']
      },
      
      // === ADMINISTRADOR ===
      'tablero': {
        especificos: this.obtenerScriptsPorRol('administrador', 'tablero'),
        componentes: ['barra-superior', 'navegacion-lateral', 'manejador-tablas']
      },
      'usuarios': {
        especificos: ['assets/js/paginas/administrador/crud-usuarios.js'],
        componentes: ['barra-superior', 'navegacion-lateral', 'sistema-modales', 'manejador-tablas']
      },
      'asignaturas': {
        especificos: ['assets/js/paginas/administrador/crud-asignaturas.js'],
        componentes: ['barra-superior', 'navegacion-lateral', 'sistema-modales', 'manejador-tablas']
      },
      'ciclos-academicos': {
        especificos: ['assets/js/paginas/administrador/gestion-ciclos.js'],
        componentes: ['barra-superior', 'navegacion-lateral', 'sistema-modales']
      },
      'carga-excel': {
        especificos: ['assets/js/paginas/administrador/manejador-excel.js'],
        componentes: ['barra-superior', 'navegacion-lateral', 'subidor-archivos']
      },
      'reportes': {
        especificos: ['assets/js/paginas/administrador/generador-reportes.js'],
        componentes: ['barra-superior', 'navegacion-lateral', 'manejador-tablas']
      },
      'asignaciones': {
        especificos: ['assets/js/paginas/administrador/asignaciones.js'],
        componentes: ['barra-superior', 'navegacion-lateral', 'sistema-modales']
      },
      'configuracion': {
        especificos: ['assets/js/paginas/administrador/configuracion-sistema.js'],
        componentes: ['barra-superior', 'navegacion-lateral', 'validador-formularios']
      },
      
      // === DOCENTE ===
      'mis-portafolios': {
        especificos: ['assets/js/paginas/docente/gestor-portafolios.js'],
        componentes: ['barra-superior', 'navegacion-lateral', 'rastreador-progreso']
      },
      'explorador': {
        especificos: ['assets/js/paginas/docente/explorador-archivos.js', 'assets/js/paginas/docente/arbol-portafolio.js'],
        componentes: ['barra-superior', 'navegacion-lateral', 'navegacion-migas']
      },
      'subir': {
        especificos: ['assets/js/paginas/docente/subir-documentos.js'],
        componentes: ['barra-superior', 'navegacion-lateral', 'subidor-archivos', 'validador-formularios']
      },
      'progreso': {
        especificos: ['assets/js/paginas/docente/calculador-progreso.js'],
        componentes: ['barra-superior', 'navegacion-lateral', 'rastreador-progreso']
      },
      'observaciones': {
        especificos: ['assets/js/paginas/docente/visor-observaciones.js'],
        componentes: ['barra-superior', 'navegacion-lateral', 'sistema-modales']
      },
      
      // === VERIFICADOR ===
      'cola-revision': {
        especificos: ['assets/js/paginas/verificador/cola-revision.js'],
        componentes: ['barra-superior', 'navegacion-lateral', 'manejador-tablas']
      },
      'revisar': {
        especificos: ['assets/js/paginas/verificador/revisar-documentos.js'],
        componentes: ['barra-superior', 'navegacion-lateral', 'sistema-modales']
      },
      'crear-observacion': {
        especificos: ['assets/js/paginas/verificador/creador-observaciones.js'],
        componentes: ['barra-superior', 'navegacion-lateral', 'validador-formularios']
      },
      'estadisticas': {
        especificos: ['assets/js/paginas/verificador/estadisticas.js'],
        componentes: ['barra-superior', 'navegacion-lateral', 'manejador-tablas']
      },
      
      // === COMPARTIDAS ===
      'perfil': {
        especificos: ['assets/js/paginas/compartidas/editor-perfil.js'],
        componentes: ['barra-superior', 'navegacion-lateral', 'validador-formularios']
      },
      'cambiar-clave': {
        especificos: ['assets/js/paginas/compartidas/cambiar-clave.js'],
        componentes: ['barra-superior', 'navegacion-lateral', 'validador-formularios']
      },
      'notificaciones': {
        especificos: ['assets/js/paginas/compartidas/gestor-notificaciones.js'],
        componentes: ['barra-superior', 'navegacion-lateral', 'centro-notificaciones']
      }
    };

    this.scriptsEspecificos.set(pagina, configuraciones[pagina] || { especificos: [], componentes: [] });
  }

  /**
   * Obtiene scripts por rol y página
   */
  obtenerScriptsPorRol(rol, pagina) {
    const rutaBase = `assets/js/paginas/${rol}`;
    return [`${rutaBase}/${pagina}.js`];
  }

  /**
   * Carga scripts esenciales primero
   */
  async cargarScriptsEsenciales() {
    console.log('⚡ Cargando scripts esenciales...');
    
    try {
      // Cargar librerías críticas
      await this.cargarScript('assets/js/librerias/jquery.min.js');
      await this.cargarScript('assets/js/librerias/sweetalert2.min.js');
      
      // Cargar núcleo del sistema
      await this.cargarScriptsEnSerie(RUTAS_SCRIPTS.nucleo);
      
      // Cargar servicios
      await this.cargarScriptsEnSerie(RUTAS_SCRIPTS.servicios);
      
      console.log('✅ Scripts esenciales cargados');
      
      // Cargar scripts específicos de la página
      await this.cargarScriptsEspecificos();
      
    } catch (error) {
      console.error('❌ Error cargando scripts esenciales:', error);
      this.mostrarErrorCarga(error);
    }
  }

  /**
   * Carga scripts específicos de la página actual
   */
  async cargarScriptsEspecificos() {
    const ruta = window.location.pathname;
    const pagina = this.obtenerPaginaDesdeRuta(ruta);
    const config = this.scriptsEspecificos.get(pagina);
    
    if (!config) {
      console.log(`📋 No hay scripts específicos para: ${pagina}`);
      return;
    }

    console.log(`🎯 Cargando scripts específicos para: ${pagina}`);

    try {
      // Cargar componentes necesarios
      if (config.componentes && config.componentes.length > 0) {
        const rutasComponentes = config.componentes.map(comp => 
          `assets/js/componentes/${comp}.js`
        );
        await this.cargarScriptsEnParalelo(rutasComponentes);
      }

      // Cargar scripts específicos de la página
      if (config.especificos && config.especificos.length > 0) {
        await this.cargarScriptsEnSerie(config.especificos);
      }

      console.log(`✅ Scripts específicos cargados para: ${pagina}`);
      
      // Inicializar la página
      this.inicializarPagina(pagina);
      
    } catch (error) {
      console.error(`❌ Error cargando scripts específicos para ${pagina}:`, error);
    }
  }

  /**
   * Carga un script individual
   */
  cargarScript(src) {
    return new Promise((resolve, reject) => {
      // Verificar si ya está cargado
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve(src);
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      
      script.onload = () => {
        console.log(`✓ Cargado: ${src}`);
        resolve(src);
      };
      
      script.onerror = () => {
        console.error(`✗ Error cargando: ${src}`);
        reject(new Error(`Error cargando script: ${src}`));
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * Carga scripts en serie (uno después del otro)
   */
  async cargarScriptsEnSerie(scripts) {
    for (const script of scripts) {
      await this.cargarScript(script);
    }
  }

  /**
   * Carga scripts en paralelo (todos al mismo tiempo)
   */
  async cargarScriptsEnParalelo(scripts) {
    const promesas = scripts.map(script => this.cargarScript(script));
    await Promise.all(promesas);
  }

  /**
   * Inicializa la página después de cargar scripts
   */
  inicializarPagina(pagina) {
    console.log(`🎬 Inicializando página: ${pagina}`);
    
    // Disparar evento personalizado
    const evento = new CustomEvent('sistemaPortafolioCargado', {
      detail: { pagina, timestamp: Date.now() }
    });
    document.dispatchEvent(evento);
    
    // Inicializaciones específicas por página
    this.ejecutarInicializacionesPorPagina(pagina);
  }

  /**
   * Ejecuta inicializaciones específicas por página
   */
  ejecutarInicializacionesPorPagina(pagina) {
    const inicializaciones = {
      'index': () => {
        // El IndexController se inicializa automáticamente en index.js
        console.log('✅ Página index inicializada con IndexController');
      },
      'login': () => {
        // Inicializar página de login
        if (window.ManejadorLogin) {
          new window.ManejadorLogin();
        }
      },
      'tablero': () => {
        // Inicializar dashboard según rol
        this.inicializarDashboard();
      }
    };

    const inicializador = inicializaciones[pagina];
    if (inicializador) {
      try {
        inicializador();
      } catch (error) {
        console.error(`❌ Error inicializando ${pagina}:`, error);
      }
    }
  }

  /**
   * Inicializa dashboard según el rol del usuario
   */
  inicializarDashboard() {
    const usuario = window.SistemaAutenticacion?.obtenerUsuario();
    if (!usuario) return;

    const rol = usuario.rolActual;
    const dashboards = {
      'administrador': () => window.TableroAdministrador && new window.TableroAdministrador(),
      'docente': () => window.TableroDocente && new window.TableroDocente(),
      'verificador': () => window.TableroVerificador && new window.TableroVerificador()
    };

    const inicializador = dashboards[rol];
    if (inicializador) {
      inicializador();
    }
  }

  /**
   * Muestra error de carga al usuario
   */
  mostrarErrorCarga(error) {
    console.error('❌ Error crítico en la carga del sistema:', error);
    
    // Mostrar mensaje de error elegante
    if (window.Swal) {
      Swal.fire({
        icon: 'error',
        title: 'Error del Sistema',
        text: 'Hubo un problema cargando el sistema. Por favor, recarga la página.',
        confirmButtonText: 'Recargar Página',
        allowOutsideClick: false
      }).then(() => {
        window.location.reload();
      });
    } else {
      // Fallback si SweetAlert no está disponible
      alert('Error del sistema. La página se recargará automáticamente.');
      window.location.reload();
    }
  }
}

// ===== INICIALIZACIÓN AUTOMÁTICA =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM cargado, iniciando sistema...');
  
  // Crear instancia del cargador de scripts
  window.cargadorScripts = new CargadorScripts();
});

// ===== MANEJO DE ERRORES GLOBALES =====
window.addEventListener('error', (error) => {
  console.error('❌ Error global capturado:', error);
  
  // Reportar error (en producción enviar a servicio de logging)
  if (window.SistemaAutenticacion?.estaAutenticado()) {
    // Enviar error al sistema de logging
    console.log('📊 Reportando error al sistema...');
  }
});

// ===== EVENTOS PERSONALIZADOS =====
document.addEventListener('sistemaPortafolioCargado', (evento) => {
  console.log('🎉 Sistema completamente cargado:', evento.detail);
  
  // Ocultar loader si existe
  const loader = document.getElementById('sistema-loader');
  if (loader) {
    loader.style.display = 'none';
  }
  
  // Mostrar contenido principal
  const contenido = document.getElementById('main-content');
  if (contenido) {
    contenido.style.opacity = '1';
  }
});

console.log('✅ Distribuidor JavaScript configurado correctamente');