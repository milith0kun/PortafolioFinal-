/**
 * ⚙️ CONFIGURACIÓN BASE DEL SISTEMA
 * Sistema Portafolio Docente UNSAAC
 * 
 * Configuraciones centralizadas para todo el frontend
 */

// 🌐 Configuración del entorno
const ENTORNO = {
    // Detección automática del entorno
    desarrollo: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    produccion: window.location.hostname.includes('unsaac.edu.pe'),
    pruebas: window.location.hostname.includes('test') || window.location.hostname.includes('staging'),
    
    // ✅ NUEVO: Debug mode
    debug: window.location.search.includes('debug=true') || localStorage.getItem('debug_mode') === 'true'
 };
 
 // 🔗 URLs base del sistema
 const CONFIGURACION_API = {
    // URL base según entorno
    BASE_URL: ENTORNO.desarrollo 
        ? 'http://localhost:3000' 
        : ENTORNO.pruebas 
        ? 'https://test-portafolio.unsaac.edu.pe'
        : 'https://portafolio.unsaac.edu.pe',
    
    // Versión del API
    VERSION: 'v1',
    
    // Prefijo completo
    get API_PREFIX() {
        return `${this.BASE_URL}/api/${this.VERSION}`;
    },
    
    // Timeout por defecto
    TIMEOUT: 30000,
    
    // Reintentos automáticos
    MAX_REINTENTOS: 3,
    
    // ✅ NUEVO: Delay entre reintentos (backoff exponencial)
    REINTENTO_DELAY: 1000,
    
    // ✅ NUEVO: Cache settings
    CACHE_ENABLED: true,
    CACHE_TTL: 300000 // 5 minutos
 };
 
 // ✅ NUEVO: Endpoints específicos del sistema
 const ENDPOINTS = {
    // Sistema y estado
    SISTEMA: {
        ESTADO: '/sistema/estado',
        ESTADISTICAS: '/sistema/estadisticas', 
        SALUD: '/sistema/salud',
        CICLO_ACTUAL: '/ciclos/actual'
    },
    
    // Autenticación
    AUTH: {
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        ME: '/auth/me',
        CAMBIAR_ROL: '/auth/switch-role',
        VERIFICAR_TOKEN: '/auth/verify'
    },
    
    // Usuarios
    USUARIOS: {
        LISTA: '/usuarios',
        CREAR: '/usuarios',
        PERFIL: '/usuarios/mi/perfil',
        ESTADISTICAS: '/usuarios/estadisticas',
        BUSCAR: '/usuarios/buscar'
    },
    
    // Ciclos académicos
    CICLOS: {
        LISTA: '/ciclos',
        ACTUAL: '/ciclos/actual',
        CREAR: '/ciclos',
        ESTADO: (id) => `/ciclos/${id}/estado`
    },
    
    // Portafolios
    PORTAFOLIOS: {
        LISTA: '/portafolios',
        ESTRUCTURA: '/portafolios/estructura',
        PROGRESO: (id) => `/portafolios/${id}/progreso`,
        ESTADISTICAS: '/portafolios/estadisticas'
    },
    
    // Documentos
    DOCUMENTOS: {
        SUBIR: '/documentos/subir',
        LISTA: '/documentos',
        DESCARGAR: (id) => `/documentos/${id}/descargar`,
        ELIMINAR: (id) => `/documentos/${id}`
    },
    
    // Notificaciones
    NOTIFICACIONES: {
        LISTA: '/notificaciones',
        MARCAR_LEIDA: (id) => `/notificaciones/${id}/leer`,
        CONTAR: '/notificaciones/count'
    }
 };
 
 // 🔐 Configuración de autenticación
 const CONFIGURACION_AUTH = {
    // Almacenamiento de tokens
    TOKEN_KEY: 'portafolio_token',
    REFRESH_TOKEN_KEY: 'portafolio_refresh_token',
    USER_KEY: 'portafolio_user',
    ROLE_KEY: 'portafolio_current_role',
    
    // Tiempo de expiración (en minutos)
    TOKEN_EXPIRE_TIME: 60,
    REFRESH_EXPIRE_TIME: 10080, // 7 días
    
    // Renovación automática
    AUTO_REFRESH: true,
    REFRESH_BEFORE_EXPIRE: 5, // minutos antes de expirar
    
    // ✅ MEJORADO: Rutas de autenticación con endpoints
    LOGIN_URL: ENDPOINTS.AUTH.LOGIN,
    LOGOUT_URL: ENDPOINTS.AUTH.LOGOUT,
    REFRESH_URL: ENDPOINTS.AUTH.REFRESH,
    ME_URL: ENDPOINTS.AUTH.ME,
    
    // ✅ NUEVO: Configuración de sesiones
    SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8 horas
    REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 días
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000 // 15 minutos
 };
 
 // 🎭 Configuración de roles
 const CONFIGURACION_ROLES = {
    // Roles disponibles
    ROLES: {
        ADMINISTRADOR: 'administrador',
        VERIFICADOR: 'verificador',
        DOCENTE: 'docente'
    },
    
    // ✅ CORREGIDO: Rutas relativas correctas
    RUTAS_POR_ROL: {
        administrador: 'paginas/administrador/tablero.html',
        verificador: 'paginas/verificador/tablero.html',
        docente: 'paginas/docente/tablero.html'
    },
    
    // Permisos base por rol
    PERMISOS_BASE: {
        administrador: ['*'], // Todos los permisos
        verificador: ['verificar', 'observar', 'reportes_verificacion'],
        docente: ['subir_documentos', 'ver_observaciones', 'mi_progreso']
    },
    
    // ✅ NUEVO: Colores y configuración visual por rol
    COLORES_ROL: {
        administrador: '#dc2626',
        verificador: '#7c3aed',
        docente: '#059669'
    },
    
    // ✅ NUEVO: Iconos por rol
    ICONOS_ROL: {
        administrador: 'fas fa-cogs',
        verificador: 'fas fa-check-circle',
        docente: 'fas fa-graduation-cap'
    }
 };
 
 // 📱 Configuración de interfaz
 const CONFIGURACION_UI = {
    // Tema por defecto
    TEMA_DEFAULT: 'tema-unsaac',
    
    // Idioma por defecto
    IDIOMA_DEFAULT: 'es',
    
    // ✅ NUEVO: Configuración de animaciones
    ANIMACIONES: {
        DURACION_DEFAULT: 300,
        DURACION_LENTA: 500,
        DURACION_RAPIDA: 150,
        EASING_DEFAULT: 'ease-in-out'
    },
    
    // Configuración de tablas
    TABLA_CONFIG: {
        ITEMS_POR_PAGINA: 25,
        ITEMS_OPCIONES: [10, 25, 50, 100],
        IDIOMA: 'es',
        RESPONSIVE: true,
        BUSQUEDA_DEBOUNCE: 300
    },
    
    // Configuración de modales
    MODAL_CONFIG: {
        BACKDROP: 'static',
        KEYBOARD: false,
        FOCUS: true,
        CERRAR_ESC: true
    },
    
    // ✅ MEJORADO: Configuración de notificaciones
    NOTIFICACION_CONFIG: {
        POSICION: 'top-end',
        TIEMPO_DEFAULT: 5000,
        MOSTRAR_PROGRESO: true,
        PERMITIR_HTML: false,
        STACK_LIMIT: 5,
        TIPOS: {
            SUCCESS: 'success',
            ERROR: 'error',
            WARNING: 'warning',
            INFO: 'info'
        }
    },
    
    // ✅ NUEVO: Configuración de loading
    LOADING: {
        SPINNER_DELAY: 200,
        MIN_LOADING_TIME: 500,
        OVERLAY_ENABLED: true,
        PROGRESS_BAR: true
    }
 };
 
 // 📁 Configuración de archivos
 const CONFIGURACION_ARCHIVOS = {
    // Tipos de archivo permitidos
    TIPOS_PERMITIDOS: {
        DOCUMENTOS: ['.pdf', '.docx', '.doc'],
        IMAGENES: ['.jpg', '.jpeg', '.png'],
        HOJAS_CALCULO: ['.xlsx', '.xls'],
        PRESENTACIONES: ['.pptx', '.ppt'],
        TEXTO: ['.txt']
    },
    
    // ✅ CORREGIDO: Tamaños máximos en bytes para mejor precisión
    TAMAÑO_MAXIMO: {
        DOCUMENTO: 10 * 1024 * 1024, // 10MB
        IMAGEN: 5 * 1024 * 1024,     // 5MB
        EXCEL: 15 * 1024 * 1024,     // 15MB
        GENERAL: 20 * 1024 * 1024    // 20MB
    },
    
    // Configuración de subida
    SUBIDA_CONFIG: {
        CHUNK_SIZE: 1024 * 1024, // 1MB
        MOSTRAR_PROGRESO: true,
        PERMITIR_MULTIPLE: true,
        MAX_ARCHIVOS_SIMULTANEOS: 5,
        AUTO_UPLOAD: false,
        RESUMABLE: true
    },
    
    // ✅ NUEVO: Validación de archivos
    VALIDACION: {
        VERIFICAR_TIPO_MIME: true,
        VERIFICAR_EXTENSION: true,
        VERIFICAR_CONTENIDO: ENTORNO.produccion,
        ESCANEAR_VIRUS: ENTORNO.produccion
    }
 };
 
 // 🔄 Configuración de sincronización
 const CONFIGURACION_SYNC = {
    // Intervalos de actualización (en segundos)
    INTERVALO_NOTIFICACIONES: 30,
    INTERVALO_PROGRESO: 60,
    INTERVALO_ESTADO_SISTEMA: 120,
    
    // ✅ NUEVO: Configuración de polling
    POLLING: {
        ENABLED: true,
        BASE_INTERVAL: 30000,
        MAX_INTERVAL: 300000,
        BACKOFF_MULTIPLIER: 1.5
    },
    
    // Configuración de reconexión
    RECONEXION_AUTOMATICA: true,
    TIEMPO_RECONEXION: 5000,
    MAX_INTENTOS_RECONEXION: 5,
    
    // ✅ NUEVO: WebSocket (para futuro)
    WEBSOCKET: {
        ENABLED: false,
        URL: null,
        RECONNECT_INTERVAL: 5000
    }
 };
 
 // 📊 Configuración de métricas
 const CONFIGURACION_METRICAS = {
    // Habilitar tracking
    TRACKING_HABILITADO: !ENTORNO.desarrollo,
    
    // Eventos a trackear
    EVENTOS: [
        'login',
        'logout',
        'cambio_rol',
        'subida_documento',
        'verificacion_documento',
        'creacion_observacion',
        'error_sistema'
    ],
    
    // ✅ MEJORADO: Configuración de analytics
    ANALYTICS: {
        GOOGLE_ANALYTICS_ID: ENTORNO.produccion ? 'GA_TRACKING_ID' : null,
        ENVIAR_ERRORES: true,
        ENVIAR_PERFORMANCE: true,
        SAMPLING_RATE: ENTORNO.desarrollo ? 100 : 10
    },
    
    // ✅ NUEVO: Métricas de performance
    PERFORMANCE: {
        TRACK_PAGE_LOAD: true,
        TRACK_API_CALLS: true,
        TRACK_USER_INTERACTIONS: true,
        BATCH_SIZE: 10,
        FLUSH_INTERVAL: 30000
    }
 };
 
 // 🚨 Configuración de manejo de errores
 const CONFIGURACION_ERRORES = {
    // Mostrar errores detallados en desarrollo
    MOSTRAR_DETALLES: ENTORNO.desarrollo,
    
    // Envío automático de errores
    ENVIO_AUTOMATICO: ENTORNO.produccion,
    
    // Tipos de error
    TIPOS: {
        NETWORK: 'network',
        AUTH: 'authentication',
        VALIDATION: 'validation',
        SERVER: 'server',
        CLIENT: 'client',
        TIMEOUT: 'timeout'
    },
    
    // ✅ MEJORADO: Mensajes por defecto más específicos
    MENSAJES_DEFAULT: {
        NETWORK: 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.',
        AUTH: 'Tu sesión ha expirado. Serás redirigido al login.',
        VALIDATION: 'Los datos ingresados no son válidos. Verifica la información.',
        SERVER: 'Error interno del servidor. El equipo técnico ha sido notificado.',
        CLIENT: 'Error inesperado del navegador. Intenta recargar la página.',
        TIMEOUT: 'La operación tardó demasiado tiempo. Intenta nuevamente.',
        GENERIC: 'Ha ocurrido un error. Si persiste, contacta al soporte técnico.'
    },
    
    // ✅ NUEVO: Configuración de reportes de error
    REPORTES: {
        INCLUIR_STACK_TRACE: ENTORNO.desarrollo,
        INCLUIR_USER_AGENT: true,
        INCLUIR_URL: true,
        INCLUIR_TIMESTAMP: true,
        MAX_REPORTES_POR_SESION: 10
    }
 };
 
 // 🎯 Configuración de validaciones
 const CONFIGURACION_VALIDACIONES = {
    // Reglas de contraseña
    PASSWORD: {
        MIN_LENGTH: 8,
        MAX_LENGTH: 128,
        REQUIRE_UPPERCASE: true,
        REQUIRE_LOWERCASE: true,
        REQUIRE_NUMBERS: true,
        REQUIRE_SYMBOLS: false, // Cambiado a false para facilitar uso
        PATRON: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
    },
    
    // ✅ CORREGIDO: Validaciones de email institucional
    EMAIL: {
        DOMINIOS_PERMITIDOS: ['unsaac.edu.pe', 'estudiante.unsaac.edu.pe'],
        PATRON: /^[a-zA-Z0-9._%+-]+@(unsaac\.edu\.pe|estudiante\.unsaac\.edu\.pe)$/,
        PATRON_GENERAL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    
    // Validaciones de archivos
    ARCHIVOS: {
        VALIDAR_EXTENSION: true,
        VALIDAR_TAMAÑO: true,
        VALIDAR_CONTENIDO: true,
        ESCANEAR_VIRUS: ENTORNO.produccion
    },
    
    // ✅ NUEVO: Validaciones de texto
    TEXTO: {
        MIN_SEARCH_LENGTH: 3,
        MAX_COMMENT_LENGTH: 1000,
        PATRON_NOMBRE: /^[a-zA-ZÀ-ÿ\s]{2,50}$/,
        PATRON_TELEFONO: /^[0-9]{9}$/
    }
 };
 
 // 🌍 Configuración de localización
 const CONFIGURACION_LOCALIZACION = {
    // Zona horaria
    TIMEZONE: 'America/Lima',
    LOCALE: 'es-PE',
    
    // Formato de fechas
    FORMATO_FECHA: 'DD/MM/YYYY',
    FORMATO_FECHA_HORA: 'DD/MM/YYYY HH:mm',
    FORMATO_HORA: 'HH:mm',
    FORMATO_FECHA_COMPLETA: 'dddd, DD [de] MMMM [de] YYYY',
    
    // Formato de números
    SEPARADOR_DECIMAL: '.',
    SEPARADOR_MILES: ',',
    MONEDA: 'PEN',
    SIMBOLO_MONEDA: 'S/',
    
    // ✅ NUEVO: Textos de la interfaz
    TEXTOS: {
        CARGANDO: 'Cargando...',
        GUARDANDO: 'Guardando...',
        PROCESANDO: 'Procesando...',
        SIN_DATOS: 'No hay información disponible',
        ERROR_GENERAL: 'Ha ocurrido un error',
        CONFIRMAR_ACCION: '¿Estás seguro de realizar esta acción?'
    }
 };
 
 // 📱 Configuración responsive
 const CONFIGURACION_RESPONSIVE = {
    // Breakpoints
    BREAKPOINTS: {
        XS: 0,
        SM: 576,
        MD: 768,
        LG: 992,
        XL: 1200,
        XXL: 1400
    },
    
    // ✅ RENOMBRADO para mayor claridad
    MOVIL: 576,
    TABLET: 768,
    ESCRITORIO_PEQUEÑO: 992,
    ESCRITORIO_GRANDE: 1200,
    
    // Configuración por dispositivo
    MOVIL_CONFIG: {
        ITEMS_POR_PAGINA: 10,
        MOSTRAR_SIDEBAR: false,
        NAVEGACION_CONDENSADA: true
    }
 };
 
 // 🔄 Estados de carga
 const ESTADOS_CARGA = {
    INACTIVO: 'idle',
    CARGANDO: 'loading',
    EXITO: 'success',
    ERROR: 'error',
    REINTENTAR: 'retry'
 };
 
 // 📈 Configuración de performance
 const CONFIGURACION_PERFORMANCE = {
    // Lazy loading
    LAZY_LOADING: true,
    INTERSECTION_THRESHOLD: 0.1,
    
    // Cache
    CACHE_DURATION: 300000, // 5 minutos
    CACHE_SIZE_LIMIT: 50, // Máximo 50 elementos
    
    // Debounce
    DEBOUNCE_SEARCH: 300,
    DEBOUNCE_RESIZE: 100,
    DEBOUNCE_INPUT: 300,
    
    // Throttle
    THROTTLE_SCROLL: 16, // 60fps
    THROTTLE_MOUSE: 100
 };
 
 // 🎨 Configuración de temas
 const CONFIGURACION_TEMAS = {
    DISPONIBLES: ['tema-claro', 'tema-oscuro', 'tema-unsaac'],
    DEFAULT: 'tema-unsaac',
    STORAGE_KEY: 'portafolio_tema',
    AUTO_DETECT: true // Detectar preferencia del sistema
 };
 
 // 🔐 Configuración de seguridad
 const CONFIGURACION_SEGURIDAD = {
    // CSP Headers que esperamos
    CSP_ENABLED: ENTORNO.produccion,
    
    // Sanitización
    SANITIZAR_HTML: true,
    ESCAPAR_SQL: true,
    
    // Rate limiting (frontend)
    RATE_LIMIT: {
        MAX_REQUESTS: 100,
        WINDOW_MS: 60000 // 1 minuto
    },
    
    // ✅ NUEVO: Configuración HTTPS
    HTTPS: {
        ENFORCE: ENTORNO.produccion,
        HSTS_ENABLED: ENTORNO.produccion
    }
 };
 
 // ✅ NUEVO: Configuración de eventos del sistema
 const EVENTOS_SISTEMA = {
    // Eventos de autenticación
    USER_LOGIN: 'user:login',
    USER_LOGOUT: 'user:logout',
    USER_TOKEN_REFRESH: 'user:token_refresh',
    USER_ROLE_CHANGE: 'user:role_change',
    
    // Eventos de UI
    PAGE_LOADED: 'page:loaded',
    MODAL_OPEN: 'modal:open',
    MODAL_CLOSE: 'modal:close',
    NOTIFICATION_SHOW: 'notification:show',
    
    // Eventos de datos
    DATA_LOADED: 'data:loaded',
    DATA_ERROR: 'data:error',
    SYNC_STATUS_CHANGE: 'sync:status_change',
    
    // Eventos del sistema
    SYSTEM_ERROR: 'system:error',
    NETWORK_STATUS_CHANGE: 'network:status_change',
    THEME_CHANGE: 'theme:change'
 };
 
 // ✅ NUEVO: Utilidades de configuración
 const UTILIDADES_CONFIG = {
    /**
     * Obtiene una configuración por ruta de punto
     */
    get(path, defaultValue = null) {
        const keys = path.split('.');
        let value = window.CONFIG;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    },
    
    /**
     * Establece una configuración
     */
    set(path, newValue) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let obj = window.CONFIG;
        
        for (const key of keys) {
            if (!(key in obj) || typeof obj[key] !== 'object') {
                obj[key] = {};
            }
            obj = obj[key];
        }
        
        obj[lastKey] = newValue;
    },
    
    /**
     * Obtiene endpoint completo
     */
    endpoint(path) {
        return CONFIGURACION_API.API_PREFIX + (ENDPOINTS[path] || path);
    },
    
    /**
     * Verifica si una funcionalidad está habilitada
     */
    isEnabled(feature) {
        return this.get(feature, false) === true;
    },
    
    /**
     * Obtiene configuración por rol actual
     */
    forRole(role = null) {
        const currentRole = role || Utilidades?.storage?.get(CONFIGURACION_AUTH.ROLE_KEY);
        return {
            route: CONFIGURACION_ROLES.RUTAS_POR_ROL[currentRole],
            color: CONFIGURACION_ROLES.COLORES_ROL[currentRole],
            icon: CONFIGURACION_ROLES.ICONOS_ROL[currentRole],
            permissions: CONFIGURACION_ROLES.PERMISOS_BASE[currentRole]
        };
    }
 };
 
 // 📋 Exportar configuración global
 window.CONFIG = {
    ENTORNO,
    API: CONFIGURACION_API,
    ENDPOINTS,
    AUTH: CONFIGURACION_AUTH,
    ROLES: CONFIGURACION_ROLES,
    UI: CONFIGURACION_UI,
    ARCHIVOS: CONFIGURACION_ARCHIVOS,
    SYNC: CONFIGURACION_SYNC,
    METRICAS: CONFIGURACION_METRICAS,
    ERRORES: CONFIGURACION_ERRORES,
    VALIDACIONES: CONFIGURACION_VALIDACIONES,
    LOCALIZACION: CONFIGURACION_LOCALIZACION,
    RESPONSIVE: CONFIGURACION_RESPONSIVE,
    ESTADOS_CARGA,
    PERFORMANCE: CONFIGURACION_PERFORMANCE,
    TEMAS: CONFIGURACION_TEMAS,
    SEGURIDAD: CONFIGURACION_SEGURIDAD,
    EVENTOS: EVENTOS_SISTEMA,
    utils: UTILIDADES_CONFIG
 };
 
 // 🚀 Inicialización inmediata
 (function inicializarConfiguracion() {
    // Configurar zona horaria
    try {
        Intl.DateTimeFormat.supportedLocalesOf(['es-PE']);
    } catch (e) {
        console.warn('Zona horaria no soportada, usando por defecto');
    }
    
    // Detectar características del dispositivo
    window.CONFIG.DISPOSITIVO = {
        ES_MOVIL: window.innerWidth <= CONFIG.RESPONSIVE.MOVIL,
        ES_TABLET: window.innerWidth <= CONFIG.RESPONSIVE.TABLET && window.innerWidth > CONFIG.RESPONSIVE.MOVIL,
        ES_ESCRITORIO: window.innerWidth > CONFIG.RESPONSIVE.TABLET,
        ES_TOUCH: 'ontouchstart' in window,
        ORIENTACION: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
        USER_AGENT: navigator.userAgent,
        IDIOMA: navigator.language || 'es'
    };
    
    // ✅ NUEVO: Detectar soporte de funcionalidades
    window.CONFIG.SOPORTE = {
        LOCAL_STORAGE: typeof Storage !== 'undefined',
        SESSION_STORAGE: typeof sessionStorage !== 'undefined',
        WEBSOCKETS: typeof WebSocket !== 'undefined',
        NOTIFICATIONS: 'Notification' in window,
        SERVICE_WORKER: 'serviceWorker' in navigator,
        INTERSECTION_OBSERVER: 'IntersectionObserver' in window
    };
    
    // Log de inicialización
    if (CONFIG.ENTORNO.desarrollo || CONFIG.ENTORNO.debug) {
        console.group('🚀 Sistema Portafolio Docente UNSAAC');
        console.log('📋 Configuración inicializada');
        console.log('🌐 Entorno:', CONFIG.ENTORNO.desarrollo ? 'Desarrollo' : 'Producción');
        console.log('📱 Dispositivo:', CONFIG.DISPOSITIVO);
        console.log('🛠️ Soporte:', CONFIG.SOPORTE);
        console.log('🔗 API URL:', CONFIG.API.API_PREFIX);
        console.groupEnd();
    }
    
    // ✅ NUEVO: Disparar evento de configuración lista
    document.dispatchEvent(new CustomEvent('config:ready', {
        detail: window.CONFIG
    }));
 })();
 
 // 🔄 Actualizar configuración en cambio de tamaño
 window.addEventListener('resize', Utilidades?.performance?.debounce(function() {
    window.CONFIG.DISPOSITIVO.ES_MOVIL = window.innerWidth <= CONFIG.RESPONSIVE.MOVIL;
    window.CONFIG.DISPOSITIVO.ES_TABLET = window.innerWidth <= CONFIG.RESPONSIVE.TABLET && window.innerWidth > CONFIG.RESPONSIVE.MOVIL;
    window.CONFIG.DISPOSITIVO.ES_ESCRITORIO = window.innerWidth > CONFIG.RESPONSIVE.TABLET;
    window.CONFIG.DISPOSITIVO.ORIENTACION = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    
    // Disparar evento de cambio de dispositivo
    document.dispatchEvent(new CustomEvent('device:change', {
        detail: window.CONFIG.DISPOSITIVO
    }));
 }, 100) || function() {
    // Fallback si Utilidades no está disponible aún
    setTimeout(() => {
        window.CONFIG.DISPOSITIVO.ES_MOVIL = window.innerWidth <= CONFIG.RESPONSIVE.MOVIL;
        window.CONFIG.DISPOSITIVO.ES_TABLET = window.innerWidth <= CONFIG.RESPONSIVE.TABLET && window.innerWidth > CONFIG.RESPONSIVE.MOVIL;
        window.CONFIG.DISPOSITIVO.ES_ESCRITORIO = window.innerWidth > CONFIG.RESPONSIVE.TABLET;
        window.CONFIG.DISPOSITIVO.ORIENTACION = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }, 100);
 });
 
 // 📤 Exportar para módulos ES6 (si se requiere)
 if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.CONFIG;
 }