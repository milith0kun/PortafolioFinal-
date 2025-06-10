/**
 * 📋 CONSTANTES DEL SISTEMA
 * Sistema Portafolio Docente UNSAAC
 * 
 * Configuraciones centralizadas para todo el frontend
 */

// ==========================================
// 🌐 CONFIGURACIÓN DEL BACKEND
// ==========================================
export const API = {
   BASE_URL: 'http://localhost:3000/api/v1',
   TIMEOUT: 30000,
   RETRY_ATTEMPTS: 3,
   
   ENDPOINTS: {
     // Autenticación
     AUTH: {
       LOGIN: '/auth/login',
       LOGOUT: '/auth/logout',
       REFRESH: '/auth/refresh',
       ME: '/auth/me',
       SWITCH_ROLE: '/auth/switch-role',
       FORGOT_PASSWORD: '/auth/forgot-password',
       RESET_PASSWORD: '/auth/reset-password'
     },
     
     // Usuarios
     USUARIOS: {
       BASE: '/usuarios',
       BUSCAR: '/usuarios/buscar',
       PERFIL: '/usuarios/mi/perfil',
       ACTIVIDAD: '/usuarios/mi/actividad'
     },
     
     // Ciclos académicos
     CICLOS: {
       BASE: '/ciclos',
       ACTUAL: '/ciclos/actual',
       ESTADO: '/ciclos/estado'
     },
     
     // Portafolios
     PORTAFOLIOS: {
       BASE: '/portafolios',
       ESTRUCTURA: '/portafolios/estructura',
       PROGRESO: '/portafolios/progreso'
     },
     
     // Sistema
     SISTEMA: {
       ESTADO: '/sistema/estado',
       CONFIGURACION: '/sistema/configuracion'
     }
   }
 };
 
 // ==========================================
 // 🎭 CONFIGURACIÓN DE ROLES
 // ==========================================
 export const ROLES = {
   ADMINISTRADOR: {
     id: 'administrador',
     nombre: 'Administrador',
     descripcion: 'Control total del sistema',
     color: '#dc3545',
     icono: 'fas fa-cogs',
     dashboard: '/paginas/administrador/tablero.html',
     permisos: ['crear', 'editar', 'eliminar', 'configurar', 'reportes']
   },
   
   DOCENTE: {
     id: 'docente',
     nombre: 'Docente',
     descripcion: 'Gestión de portafolios',
     color: '#28a745',
     icono: 'fas fa-graduation-cap',
     dashboard: '/paginas/docente/tablero.html',
     permisos: ['subir', 'editar_propio', 'ver_progreso']
   },
   
   VERIFICADOR: {
     id: 'verificador',
     nombre: 'Verificador',
     descripcion: 'Control de calidad',
     color: '#007bff',
     icono: 'fas fa-check-circle',
     dashboard: '/paginas/verificador/tablero.html',
     permisos: ['revisar', 'aprobar', 'rechazar', 'observaciones']
   }
 };
 
 // ==========================================
 // 📊 ESTADOS DEL SISTEMA
 // ==========================================
 export const ESTADOS_CICLO = {
   PREPARACION: {
     id: 'preparacion',
     nombre: 'En Preparación',
     descripcion: 'Los administradores están configurando el ciclo académico',
     color: '#ffc107',
     icono: 'fas fa-cog fa-spin',
     acciones_permitidas: ['configurar', 'asignar']
   },
   
   ACTIVO: {
     id: 'activo',
     nombre: 'Activo',
     descripcion: 'Período de subida de documentos activo',
     color: '#28a745',
     icono: 'fas fa-play-circle',
     acciones_permitidas: ['subir', 'editar', 'revisar']
   },
   
   REVISION: {
     id: 'revision',
     nombre: 'En Revisión',
     descripcion: 'Período de verificación de documentos',
     color: '#17a2b8',
     icono: 'fas fa-search',
     acciones_permitidas: ['revisar', 'aprobar', 'observaciones']
   },
   
   CERRADO: {
     id: 'cerrado',
     nombre: 'Cerrado',
     descripcion: 'Ciclo académico finalizado',
     color: '#6c757d',
     icono: 'fas fa-lock',
     acciones_permitidas: ['reportes', 'consultar']
   },
   
   ARCHIVADO: {
     id: 'archivado',
     nombre: 'Archivado',
     descripcion: 'Ciclo archivado para consulta histórica',
     color: '#495057',
     icono: 'fas fa-archive',
     acciones_permitidas: ['consultar']
   }
 };
 
 // ==========================================
 // 📁 CONFIGURACIÓN DE ARCHIVOS
 // ==========================================
 export const ARCHIVOS = {
   TIPOS_PERMITIDOS: {
     DOCUMENTOS: ['pdf', 'docx', 'doc'],
     IMAGENES: ['jpg', 'jpeg', 'png'],
     HOJAS_CALCULO: ['xlsx', 'xls'],
     PRESENTACIONES: ['pptx', 'ppt']
   },
   
   TAMAÑO_MAXIMO: {
     DOCUMENTO: 10 * 1024 * 1024, // 10MB
     IMAGEN: 5 * 1024 * 1024,      // 5MB
     EXCEL: 25 * 1024 * 1024       // 25MB
   },
   
   ICONOS: {
     pdf: 'fas fa-file-pdf',
     docx: 'fas fa-file-word',
     xlsx: 'fas fa-file-excel',
     pptx: 'fas fa-file-powerpoint',
     jpg: 'fas fa-file-image',
     png: 'fas fa-file-image',
     default: 'fas fa-file'
   }
 };
 
 // ==========================================
 // 🎨 CONFIGURACIÓN DE UI
 // ==========================================
 export const UI = {
   TEMAS: {
     CLARO: 'tema-claro',
     OSCURO: 'tema-oscuro',
     UNSAAC: 'tema-unsaac'
   },
   
   DISPOSITIVOS: {
     MOVIL: 768,
     TABLET: 1024,
     ESCRITORIO: 1200
   },
   
   ANIMACIONES: {
     DURACION_CORTA: 200,
     DURACION_MEDIA: 400,
     DURACION_LARGA: 600
   },
   
   NOTIFICACIONES: {
     POSICION: 'top-end',
     TIEMPO_AUTO_CIERRE: 5000
   }
 };
 
 // ==========================================
 // 🔍 CONFIGURACIÓN DE BÚSQUEDA
 // ==========================================
 export const BUSQUEDA = {
   MIN_CARACTERES: 3,
   DELAY_BUSQUEDA: 500,
   MAX_RESULTADOS: 20,
   
   TIPOS: {
     USUARIOS: 'usuarios',
     DOCUMENTOS: 'documentos',
     ASIGNATURAS: 'asignaturas',
     PORTAFOLIOS: 'portafolios'
   },
   
   FILTROS: {
     ESTADO: ['activo', 'inactivo', 'pendiente', 'aprobado'],
     ROLES: ['administrador', 'docente', 'verificador'],
     FECHAS: ['hoy', 'semana', 'mes', 'año']
   }
 };
 
 // ==========================================
 // 📝 VALIDACIONES
 // ==========================================
 export const VALIDACIONES = {
   USUARIO: {
     NOMBRES_MIN: 2,
     NOMBRES_MAX: 50,
     CORREO_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
     PASSWORD_MIN: 8,
     PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
   },
   
   ARCHIVOS: {
     NOMBRE_MIN: 3,
     NOMBRE_MAX: 255,
     DESCRIPCION_MAX: 500
   },
   
   OBSERVACIONES: {
     CONTENIDO_MIN: 10,
     CONTENIDO_MAX: 1000
   }
 };
 
 // ==========================================
 // 💬 MENSAJES DEL SISTEMA
 // ==========================================
 export const MENSAJES = {
   EXITO: {
     LOGIN: '¡Bienvenido al sistema!',
     LOGOUT: 'Sesión cerrada correctamente',
     GUARDADO: 'Datos guardados correctamente',
     SUBIDA: 'Archivo subido exitosamente',
     ELIMINADO: 'Elemento eliminado correctamente'
   },
   
   ERROR: {
     LOGIN: 'Credenciales incorrectas',
     CONEXION: 'Error de conexión con el servidor',
     PERMISOS: 'No tienes permisos para esta acción',
     ARCHIVO_GRANDE: 'El archivo es demasiado grande',
     ARCHIVO_TIPO: 'Tipo de archivo no permitido',
     CAMPO_REQUERIDO: 'Este campo es requerido',
     SERVIDOR: 'Error interno del servidor'
   },
   
   CONFIRMACION: {
     ELIMINAR: '¿Estás seguro de eliminar este elemento?',
     SALIR: '¿Seguro que deseas cerrar sesión?',
     CAMBIOS: 'Tienes cambios sin guardar. ¿Deseas continuar?'
   }
 };
 
 // ==========================================
 // 🔧 CONFIGURACIÓN DE DESARROLLO
 // ==========================================
 export const DESARROLLO = {
   DEBUG: true,
   LOG_LEVEL: 'info',
   MOCK_DATA: false,
   CACHE_ENABLED: true,
   ANALYTICS_ENABLED: false
 };
 
 // ==========================================
 // 📱 CONFIGURACIÓN PWA
 // ==========================================
 export const PWA = {
   NOMBRE: 'Portafolio UNSAAC',
   NOMBRE_CORTO: 'PortafolioUNSAAC',
   DESCRIPCION: 'Sistema de Portafolio Docente UNSAAC',
   THEME_COLOR: '#1a237e',
   BACKGROUND_COLOR: '#ffffff',
   DISPLAY: 'standalone',
   ORIENTATION: 'portrait-primary'
 };
 
 // ==========================================
 // 🌍 CONFIGURACIÓN REGIONAL
 // ==========================================
 export const REGIONAL = {
   IDIOMA: 'es-PE',
   ZONA_HORARIA: 'America/Lima',
   MONEDA: 'PEN',
   FORMATO_FECHA: 'DD/MM/YYYY',
   FORMATO_HORA: 'HH:mm',
   FORMATO_FECHA_HORA: 'DD/MM/YYYY HH:mm'
 };
 
 // ==========================================
 // 🔐 CONFIGURACIÓN DE SEGURIDAD
 // ==========================================
 export const SEGURIDAD = {
   TOKEN_STORAGE_KEY: 'portafolio_token',
   USER_STORAGE_KEY: 'portafolio_user',
   REFRESH_TOKEN_KEY: 'portafolio_refresh',
   
   SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8 horas
   REFRESH_THRESHOLD: 15 * 60 * 1000,    // 15 minutos
   
   CSRF_HEADER: 'X-CSRF-Token',
   API_KEY_HEADER: 'X-API-Key'
 };
 
 // ==========================================
 // 📊 CONFIGURACIÓN DE REPORTES
 // ==========================================
 export const REPORTES = {
   FORMATOS: ['pdf', 'excel', 'csv'],
   
   TIPOS: {
     PROGRESO_DOCENTE: 'progreso-docente',
     ESTADISTICAS_GENERALES: 'estadisticas-generales',
     VERIFICACIONES: 'verificaciones',
     ACTIVIDAD_SISTEMA: 'actividad-sistema'
   },
   
   PERIODOS: {
     SEMANAL: 'semanal',
     MENSUAL: 'mensual',
     CICLO_COMPLETO: 'ciclo-completo',
     PERSONALIZADO: 'personalizado'
   }
 };
 
 // ==========================================
 // 🎯 EVENTOS PERSONALIZADOS
 // ==========================================
 export const EVENTOS = {
   USUARIO_LOGUEADO: 'usuario:logueado',
   USUARIO_DESLOGUEADO: 'usuario:deslogueado',
   ROL_CAMBIADO: 'rol:cambiado',
   CICLO_ACTUALIZADO: 'ciclo:actualizado',
   ARCHIVO_SUBIDO: 'archivo:subido',
   DOCUMENTO_VERIFICADO: 'documento:verificado',
   NOTIFICACION_RECIBIDA: 'notificacion:recibida',
   SISTEMA_ACTUALIZADO: 'sistema:actualizado'
 };
 
 // ==========================================
 // 🔄 EXPORTACIÓN POR DEFECTO
 // ==========================================
 export default {
   API,
   ROLES,
   ESTADOS_CICLO,
   ARCHIVOS,
   UI,
   BUSQUEDA,
   VALIDACIONES,
   MENSAJES,
   DESARROLLO,
   PWA,
   REGIONAL,
   SEGURIDAD,
   REPORTES,
   EVENTOS
 };