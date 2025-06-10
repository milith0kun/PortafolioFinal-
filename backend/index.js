    /**
     * 🚀 INDEX PRINCIPAL - Sistema Portafolio Docente UNSAAC
     * 
     * PUNTO DE ENTRADA ÚNICO que inicializa TODO el backend:
     * - Importa y configura el servidor desde servidor.js
     * - Configura todas las rutas API del sistema
     * - Inicia el servidor completo
     * 
     * @author Sistema Portafolio Docente UNSAAC
     * @version 1.0.0
     */

    // ==========================================
    // 📦 IMPORTAR CONFIGURADOR DE SERVIDOR
    // ==========================================

    const { inicializarServidor, iniciarServidor } = require('./servidor');

    // ==========================================
    // 📥 IMPORTAR MIDDLEWARES DE AUTENTICACIÓN
    // ==========================================

    const middlewareJWT = require('./middleware/autenticacion/jwt.middleware');
    const middlewareRoles = require('./middleware/autorizacion/roles.middleware');
    const limitadorConfig = require('./configuracion/seguridad/limitador.config');

    // ==========================================
    // 📥 IMPORTAR TODAS LAS RUTAS DEL SISTEMA
    // ==========================================

    // 🔐 Rutas de Autenticación
    const rutasLogin = require('./rutas/v1/autenticacion/login.rutas');
    const rutasRecuperacion = require('./rutas/v1/autenticacion/recuperacion.rutas');
    const rutasSesion = require('./rutas/v1/autenticacion/sesion.rutas');

    // 👥 Rutas de Usuarios
    const rutasGestionUsuarios = require('./rutas/v1/usuarios/gestion.rutas');
    const rutasPerfiles = require('./rutas/v1/usuarios/perfiles.rutas');
    const rutasRolesUsuarios = require('./rutas/v1/usuarios/roles.rutas');

    // 🎓 Rutas Académicas
    const rutasCiclos = require('./rutas/v1/academico/ciclos.rutas');
    const rutasAsignaturas = require('./rutas/v1/academico/asignaturas.rutas');
    const rutasAsignaciones = require('./rutas/v1/academico/asignaciones.rutas');

    // 📁 Rutas de Portafolios
    const rutasEstructura = require('./rutas/v1/portafolios/estructura.rutas');
    const rutasNavegacion = require('./rutas/v1/portafolios/navegacion.rutas');
    const rutasProgreso = require('./rutas/v1/portafolios/progreso.rutas');

    // 📄 Rutas de Documentos
    const rutasGestionDocumentos = require('./rutas/v1/documentos/gestion.rutas');
    const rutasSubidaDocumentos = require('./rutas/v1/documentos/subida.rutas');
    const rutasDescargaDocumentos = require('./rutas/v1/documentos/descarga.rutas');

    // 🔍 Rutas de Verificación
    const rutasRevision = require('./rutas/v1/verificacion/revision.rutas');
    const rutasAsignacionesVerificacion = require('./rutas/v1/verificacion/asignaciones.rutas');
    const rutasEstadisticasVerificacion = require('./rutas/v1/verificacion/estadisticas.rutas');

    // 💬 Rutas de Observaciones
    const rutasGestionObservaciones = require('./rutas/v1/observaciones/gestion.rutas');
    const rutasRespuestasObservaciones = require('./rutas/v1/observaciones/respuestas.rutas');
    const rutasReportesObservaciones = require('./rutas/v1/observaciones/reportes.rutas');

    // 🔔 Rutas del Sistema
    const rutasNotificaciones = require('./rutas/v1/sistema/notificaciones.rutas');
    const rutasExcel = require('./rutas/v1/sistema/excel.rutas');
    const rutasReportes = require('./rutas/v1/sistema/reportes.rutas');

    // 📊 Rutas de Dashboards
    const rutasDashboardAdmin = require('./rutas/v1/dashboards/administrador.rutas');
    const rutasDashboardDocente = require('./rutas/v1/dashboards/docente.rutas');
    const rutasDashboardVerificador = require('./rutas/v1/dashboards/verificador.rutas');

    /**
     * 🏗️ Configurar todas las rutas API en la aplicación Express
     * 
     * @param {Express} app - Instancia de Express configurada desde servidor.js
     */
    function configurarRutasAPI(app) {
        
        console.log('🔀 Configurando rutas del sistema...');

        // ==========================================
        // 📋 RUTA DE INFORMACIÓN API
        // ==========================================

        /**
         * 📋 Info detallada del API
         */
        app.get('/api', (req, res) => {
            res.json({
                name: 'API Sistema Portafolio Docente UNSAAC',
                version: '1.0.0',
                description: 'Sistema de gestión de portafolios académicos para docentes',
                author: 'UNSAAC - Universidad Nacional de San Antonio Abad del Cusco',
                baseUrl: `${req.protocol}://${req.get('host')}/api/v1`,
                endpoints: {
                    // Monitoreo
                    health: '/health',
                    test_db: '/test-db',
                    metrics: '/metrics',
                    db_status: '/db-status',
                    system_info: '/system-info',
                    
                    // Documentación
                    documentation: '/api/v1/docs',
                    
                    // APIs principales
                    authentication: '/api/v1/auth/*',
                    users: '/api/v1/usuarios/*',
                    academic: '/api/v1/academico/*',
                    portfolios: '/api/v1/portafolios/*',
                    documents: '/api/v1/documentos/*',
                    verification: '/api/v1/verificacion/*',
                    observations: '/api/v1/observaciones/*',
                    system: '/api/v1/sistema/*',
                    dashboards: '/api/v1/dashboard/*'
                },
                features: [
                    'Multi-rol dinámico (Administrador, Docente, Verificador)',
                    'Gestión completa de portafolios académicos',
                    'Sistema de verificación de documentos',
                    'Observaciones y comunicación bidireccional',
                    'Carga masiva desde archivos Excel',
                    'Generación de reportes PDF y Excel',
                    'Sistema de notificaciones en tiempo real',
                    'Dashboards interactivos por rol'
                ],
                security: {
                    authentication: 'JWT Bearer Token',
                    rate_limiting: 'Habilitado',
                    cors: 'Configurado',
                    helmet: 'Headers de seguridad activos'
                },
                statistics: {
                    total_route_groups: 27,
                    auth_routes: 3,
                    user_routes: 3,
                    academic_routes: 3,
                    portfolio_routes: 3,
                    document_routes: 3,
                    verification_routes: 3,
                    observation_routes: 3,
                    system_routes: 3,
                    dashboard_routes: 3
                },
                timestamp: new Date().toISOString()
            });
        });

        // ==========================================
        // 🔐 RUTAS DE AUTENTICACIÓN (SIN JWT REQUERIDO)
        // ==========================================

        app.use('/api/v1/auth/login', 
            limitadorConfig.limitadorLogin, 
            rutasLogin
        );
        
        app.use('/api/v1/auth/recuperacion', 
            limitadorConfig.limitadorRecuperacion, 
            rutasRecuperacion
        );
        
        app.use('/api/v1/auth/sesion', 
            middlewareJWT.verificarToken, 
            rutasSesion
        );

        // ==========================================
        // 👥 RUTAS DE USUARIOS (CON AUTENTICACIÓN)
        // ==========================================

        app.use('/api/v1/usuarios/gestion', 
            middlewareJWT.verificarToken,
            middlewareRoles.requiereRol(['administrador']),
            rutasGestionUsuarios
        );

        app.use('/api/v1/usuarios/perfiles', 
            middlewareJWT.verificarToken,
            rutasPerfiles
        );

        app.use('/api/v1/usuarios/roles', 
            middlewareJWT.verificarToken,
            middlewareRoles.requiereRol(['administrador']),
            rutasRolesUsuarios
        );

        // ==========================================
        // 🎓 RUTAS ACADÉMICAS (SOLO ADMINISTRADOR)
        // ==========================================

        app.use('/api/v1/academico/ciclos', 
            middlewareJWT.verificarToken,
            middlewareRoles.requiereRol(['administrador']),
            rutasCiclos
        );

        app.use('/api/v1/academico/asignaturas', 
            middlewareJWT.verificarToken,
            middlewareRoles.requiereRol(['administrador']),
            rutasAsignaturas
        );

        app.use('/api/v1/academico/asignaciones', 
            middlewareJWT.verificarToken,
            middlewareRoles.requiereRol(['administrador']),
            rutasAsignaciones
        );

        // ==========================================
        // 📁 RUTAS DE PORTAFOLIOS (MULTI-ROL)
        // ==========================================

        app.use('/api/v1/portafolios/estructura', 
            middlewareJWT.verificarToken,
            middlewareRoles.requiereRol(['administrador', 'docente', 'verificador']),
            rutasEstructura
        );

        app.use('/api/v1/portafolios/navegacion', 
            middlewareJWT.verificarToken,
            middlewareRoles.requiereRol(['administrador', 'docente', 'verificador']),
            rutasNavegacion
        );

        app.use('/api/v1/portafolios/progreso', 
            middlewareJWT.verificarToken,
            middlewareRoles.requiereRol(['administrador', 'docente', 'verificador']),
            rutasProgreso
        );

        // ==========================================
        // 📄 RUTAS DE DOCUMENTOS
        // ==========================================

        app.use('/api/v1/documentos/gestion', 
            middlewareJWT.verificarToken,
            middlewareRoles.requiereRol(['administrador', 'docente', 'verificador']),
            rutasGestionDocumentos
        );

        app.use('/api/v1/documentos/subida', 
            middlewareJWT.verificarToken,
            middlewareRoles.requiereRol(['docente']),
            rutasSubidaDocumentos
        );

        app.use('/api/v1/documentos/descarga', 
            middlewareJWT.verificarToken,
            middlewareRoles.requiereRol(['administrador', 'docente', 'verificador']),
            rutasDescargaDocumentos
        );

        // ==========================================
        // 🔍 RUTAS DE VERIFICACIÓN
        // ==========================================

        app.use('/api/v1/verificacion/revision', 
            middlewareJWT.verificarToken,
            middlewareRoles.requiereRol(['administrador', 'verificador']),
            rutasRevision
        );

        app.use('/api/v1/verificacion/asignaciones', 
            middlewareJWT.verificarToken,
            middlewareRoles.requiereRol(['administrador']),
            rutasAsignacionesVerificacion
        );

        app.use('/api/v1/verificacion/estadisticas', 
            middlewareJWT.verificarToken,
            middlewareRoles.requiereRol(['administrador', 'verificador']),
            rutasEstadisticasVerificacion
        );

        // ==========================================
        // 💬 RUTAS DE OBSERVACIONES
        // ==========================================

        app.use('/api/v1/observaciones/gestion', 
            middlewareJWT.verificarToken,
            middlewareRoles.requiereRol(['administrador', 'docente', 'verificador']),
            rutasGestionObservaciones
        );

        app.use('/api/v1/observaciones/respuestas', 
            middlewareJWT.verificarToken,
            middlewareRoles.requiereRol(['docente', 'verificador']),
            rutasRespuestasObservaciones
        );

        app.use('/api/v1/observaciones/reportes', 
            middlewareJWT.verificarToken,
            middlewareRoles.requiereRol(['administrador', 'verificador']),
            rutasReportesObservaciones
        );

        // ==========================================
        // 🔔 RUTAS DEL SISTEMA
        // ==========================================

        app.use('/api/v1/sistema/notificaciones', 
            middlewareJWT.verificarToken,
            middlewareRoles.requiereRol(['administrador', 'docente', 'verificador']),
            rutasNotificaciones
        );

        app.use('/api/v1/sistema/excel', 
            middlewareJWT.verificarToken,
            middlewareRoles.requiereRol(['administrador']),
            rutasExcel
        );

        app.use('/api/v1/sistema/reportes', 
            middlewareJWT.verificarToken,
            middlewareRoles.requiereRol(['administrador', 'verificador']),
            rutasReportes
        );

        // ==========================================
        // 📊 RUTAS DE DASHBOARDS (POR ROL)
        // ==========================================

        app.use('/api/v1/dashboard/administrador', 
            middlewareJWT.verificarToken,
            middlewareRoles.requiereRol(['administrador']),
            rutasDashboardAdmin
        );

        app.use('/api/v1/dashboard/docente', 
            middlewareJWT.verificarToken,
            middlewareRoles.requiereRol(['docente']),
            rutasDashboardDocente
        );

        app.use('/api/v1/dashboard/verificador', 
            middlewareJWT.verificarToken,
            middlewareRoles.requiereRol(['verificador']),
            rutasDashboardVerificador
        );

        // ==========================================
        // 📚 DOCUMENTACIÓN COMPLETA DEL API
        // ==========================================

        app.get('/api/v1/docs', (req, res) => {
            res.json({
                title: 'Documentación API - Sistema Portafolio Docente UNSAAC',
                version: '1.0.0',
                description: 'API REST completa para gestión de portafolios académicos',
                baseUrl: `${req.protocol}://${req.get('host')}/api/v1`,
                
                authentication: {
                    type: 'JWT Bearer Token',
                    header: 'Authorization: Bearer <token>',
                    login_endpoint: '/api/v1/auth/login',
                    example: {
                        correo: 'docente@unsaac.edu.pe',
                        contrasena: 'password123'
                    }
                },
                
                roles: {
                    administrador: {
                        description: 'Control total del sistema',
                        permissions: ['CRUD usuarios', 'Gestión ciclos', 'Asignaciones', 'Reportes globales']
                    },
                    docente: {
                        description: 'Gestiona su portafolio y documentos',
                        permissions: ['Subir documentos', 'Ver portafolio', 'Responder observaciones']
                    },
                    verificador: {
                        description: 'Revisa y aprueba documentos',
                        permissions: ['Revisar documentos', 'Crear observaciones', 'Estadísticas']
                    }
                },
                
                endpoints: {
                    auth: {
                        login: {
                            method: 'POST',
                            url: '/api/v1/auth/login',
                            description: 'Iniciar sesión',
                            body: { correo: 'string', contrasena: 'string' }
                        },
                        logout: {
                            method: 'POST',
                            url: '/api/v1/auth/logout',
                            description: 'Cerrar sesión',
                            auth_required: true
                        },
                        recovery: {
                            method: 'POST',
                            url: '/api/v1/auth/recuperacion',
                            description: 'Recuperar contraseña',
                            body: { correo: 'string' }
                        },
                        session: {
                            method: 'GET',
                            url: '/api/v1/auth/sesion',
                            description: 'Información de sesión actual',
                            auth_required: true
                        }
                    },
                    
                    users: {
                        list: {
                            method: 'GET',
                            url: '/api/v1/usuarios/gestion',
                            description: 'Listar usuarios',
                            roles: ['administrador']
                        },
                        create: {
                            method: 'POST',
                            url: '/api/v1/usuarios/gestion',
                            description: 'Crear usuario',
                            roles: ['administrador']
                        },
                        profile: {
                            method: 'GET',
                            url: '/api/v1/usuarios/perfiles/mi-perfil',
                            description: 'Ver mi perfil',
                            roles: ['administrador', 'docente', 'verificador']
                        },
                        assign_role: {
                            method: 'POST',
                            url: '/api/v1/usuarios/roles/asignar',
                            description: 'Asignar rol a usuario',
                            roles: ['administrador']
                        }
                    },
                    
                    academic: {
                        cycles: {
                            method: 'GET',
                            url: '/api/v1/academico/ciclos',
                            description: 'Gestionar ciclos académicos',
                            roles: ['administrador']
                        },
                        subjects: {
                            method: 'GET',
                            url: '/api/v1/academico/asignaturas',
                            description: 'Gestionar asignaturas',
                            roles: ['administrador']
                        },
                        assignments: {
                            method: 'GET',
                            url: '/api/v1/academico/asignaciones',
                            description: 'Gestionar asignaciones docente-materia',
                            roles: ['administrador']
                        }
                    },
                    
                    portfolios: {
                        structure: {
                            method: 'GET',
                            url: '/api/v1/portafolios/estructura',
                            description: 'Obtener estructura de portafolio',
                            roles: ['administrador', 'docente', 'verificador']
                        },
                        navigation: {
                            method: 'GET',
                            url: '/api/v1/portafolios/navegacion',
                            description: 'Árbol de navegación',
                            roles: ['administrador', 'docente', 'verificador']
                        },
                        progress: {
                            method: 'GET',
                            url: '/api/v1/portafolios/progreso/:id',
                            description: 'Progreso de completitud',
                            roles: ['administrador', 'docente', 'verificador']
                        }
                    },
                    
                    documents: {
                        upload: {
                            method: 'POST',
                            url: '/api/v1/documentos/subida',
                            description: 'Subir documento',
                            content_type: 'multipart/form-data',
                            roles: ['docente']
                        },
                        manage: {
                            method: 'GET',
                            url: '/api/v1/documentos/gestion',
                            description: 'Gestionar documentos',
                            roles: ['administrador', 'docente', 'verificador']
                        },
                        download: {
                            method: 'GET',
                            url: '/api/v1/documentos/descarga/:id',
                            description: 'Descargar documento',
                            roles: ['administrador', 'docente', 'verificador']
                        }
                    },
                    
                    verification: {
                        review: {
                            method: 'POST',
                            url: '/api/v1/verificacion/revision',
                            description: 'Aprobar/rechazar documento',
                            roles: ['administrador', 'verificador']
                        },
                        assignments: {
                            method: 'GET',
                            url: '/api/v1/verificacion/asignaciones',
                            description: 'Asignaciones verificador-docente',
                            roles: ['administrador']
                        },
                        statistics: {
                            method: 'GET',
                            url: '/api/v1/verificacion/estadisticas',
                            description: 'Estadísticas de verificación',
                            roles: ['administrador', 'verificador']
                        }
                    },
                    
                    observations: {
                        manage: {
                            method: 'GET',
                            url: '/api/v1/observaciones/gestion',
                            description: 'CRUD de observaciones',
                            roles: ['administrador', 'docente', 'verificador']
                        },
                        responses: {
                            method: 'POST',
                            url: '/api/v1/observaciones/respuestas',
                            description: 'Responder observaciones',
                            roles: ['docente', 'verificador']
                        },
                        reports: {
                            method: 'GET',
                            url: '/api/v1/observaciones/reportes',
                            description: 'Reportes de observaciones',
                            roles: ['administrador', 'verificador']
                        }
                    },
                    
                    system: {
                        notifications: {
                            method: 'GET',
                            url: '/api/v1/sistema/notificaciones',
                            description: 'Sistema de notificaciones',
                            roles: ['administrador', 'docente', 'verificador']
                        },
                        excel_upload: {
                            method: 'POST',
                            url: '/api/v1/sistema/excel',
                            description: 'Carga masiva desde Excel',
                            content_type: 'multipart/form-data',
                            roles: ['administrador']
                        },
                        reports: {
                            method: 'GET',
                            url: '/api/v1/sistema/reportes',
                            description: 'Generación de reportes',
                            roles: ['administrador', 'verificador']
                        }
                    },
                    
                    dashboards: {
                        admin: {
                            method: 'GET',
                            url: '/api/v1/dashboard/administrador',
                            description: 'Dashboard de administrador',
                            roles: ['administrador']
                        },
                        teacher: {
                            method: 'GET',
                            url: '/api/v1/dashboard/docente',
                            description: 'Dashboard de docente',
                            roles: ['docente']
                        },
                        verifier: {
                            method: 'GET',
                            url: '/api/v1/dashboard/verificador',
                            description: 'Dashboard de verificador',
                            roles: ['verificador']
                        }
                    }
                },
                
                response_format: {
                    success: {
                        success: true,
                        data: "object",
                        message: "string",
                        timestamp: "ISO 8601"
                    },
                    error: {
                        success: false,
                        error: "string",
                        message: "string",
                        timestamp: "ISO 8601"
                    }
                },
                
                rate_limits: {
                    global: '100 requests per 15 minutes',
                    login: '5 requests per 15 minutes',
                    recovery: '3 requests per hour'
                },
                
                file_upload: {
                    max_size: '10MB',
                    allowed_formats: ['pdf', 'docx', 'xlsx', 'pptx', 'txt', 'jpg', 'png'],
                    endpoint: '/api/v1/documentos/subida'
                },
                
                timestamp: new Date().toISOString()
            });
        });

        // ==========================================
        // 🚫 MANEJO DE RUTAS API NO ENCONTRADAS
        // ==========================================

        app.use('/api/*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'Endpoint de API no encontrado',
                ruta_solicitada: req.originalUrl,
                metodo: req.method,
                sugerencias: {
                    documentation: '/api/v1/docs',
                    api_info: '/api',
                    health_check: '/health'
                },
                endpoints_disponibles: {
                    auth: '/api/v1/auth/*',
                    users: '/api/v1/usuarios/*',
                    academic: '/api/v1/academico/*',
                    portfolios: '/api/v1/portafolios/*',
                    documents: '/api/v1/documentos/*',
                    verification: '/api/v1/verificacion/*',
                    observations: '/api/v1/observaciones/*',
                    system: '/api/v1/sistema/*',
                    dashboards: '/api/v1/dashboard/*'
                },
                timestamp: new Date().toISOString()
            });
        });

        console.log('✅ Configuración de rutas completada');
        console.log('📊 Total de grupos de rutas configurados: 27');
        
        return {
            rutasConfiguradas: 27,
            mensaje: 'Todas las rutas API configuradas exitosamente'
        };
    }

    // ==========================================
    // 🚀 FUNCIÓN PRINCIPAL - INICIAR TODO EL BACKEND
    // ==========================================

    async function iniciarBackend() {
        try {
            console.clear();
            console.log('🚀 Iniciando Sistema Portafolio Docente UNSAAC...\n');
            
            // 1. Inicializar servidor (configuración base)
            const app = await inicializarServidor();
            
            // 2. Configurar todas las rutas API
            configurarRutasAPI(app);
            
            // 3. Configurar manejo de rutas no encontradas (después de todas las rutas)
            app.use('*', (req, res) => {
                res.status(404).json({
                    success: false,
                    message: 'Endpoint no encontrado',
                    ruta_solicitada: req.originalUrl,
                    metodo: req.method,
                    endpoints_disponibles: {
                        health: '/health',
                        test_db: '/test-db',
                        metrics: '/metrics',
                        db_status: '/db-status',
                        system_info: '/system-info',
                        api_info: '/api',
                        api_docs: '/api/v1/docs'
                    },
                    timestamp: new Date().toISOString()
                });
            });
            
            // 4. Iniciar servidor HTTP
            const servidor = await iniciarServidor(app);
            
            console.log('🎯 URLs Principales del Sistema:');
            console.log(`   • API Principal: http://localhost:3000/api`);
            console.log(`   • Documentación: http://localhost:3000/api/v1/docs`);
            console.log(`   • Login: POST http://localhost:3000/api/v1/auth/login`);
            
            return servidor;
            
        } catch (error) {
            console.error('❌ Error crítico al iniciar backend:', error);
            process.exit(1);
        }
    }

    // ==========================================
    // 📤 EXPORTAR CONFIGURACIÓN
    // ==========================================

    module.exports = {
        configurarRutasAPI,
        iniciarBackend
    };

    // ==========================================
    // 🚀 EJECUTAR SI ES EL ARCHIVO PRINCIPAL
    // ==========================================

    if (require.main === module) {
        iniciarBackend().catch(error => {
            console.error('❌ Error crítico:', error);
            process.exit(1);
        });
    }

    /**
     * 📋 RESUMEN DE RUTAS CONFIGURADAS:
     * 
     * 🔐 Autenticación: 3 grupos
     *   • Login (POST /api/v1/auth/login)
     *   • Recuperación (POST /api/v1/auth/recuperacion)  
     *   • Sesión (GET /api/v1/auth/sesion)
     * 
     * 👥 Usuarios: 3 grupos
     *   • Gestión (CRUD /api/v1/usuarios/gestion)
     *   • Perfiles (GET/PUT /api/v1/usuarios/perfiles)
     *   • Roles (POST /api/v1/usuarios/roles)
     * 
     * 🎓 Académico: 3 grupos  
     *   • Ciclos (CRUD /api/v1/academico/ciclos)
     *   • Asignaturas (CRUD /api/v1/academico/asignaturas)
     *   • Asignaciones (POST /api/v1/academico/asignaciones)
     * 
     * 📁 Portafolios: 3 grupos
     *   • Estructura (GET /api/v1/portafolios/estructura)
     *   • Navegación (GET /api/v1/portafolios/navegacion)
     *   • Progreso (GET /api/v1/portafolios/progreso)
     * 
     * 📄 Documentos: 3 grupos
     *   • Gestión (CRUD /api/v1/documentos/gestion)
     *   • Subida (POST /api/v1/documentos/subida)
     *   • Descarga (GET /api/v1/documentos/descarga)
     * 
     * 🔍 Verificación: 3 grupos
     *   • Revisión (POST /api/v1/verificacion/revision)
     *   • Asignaciones (GET /api/v1/verificacion/asignaciones)
     *   • Estadísticas (GET /api/v1/verificacion/estadisticas)
     * 
     * 💬 Observaciones: 3 grupos
     *   • Gestión (CRUD /api/v1/observaciones/gestion)
     *   • Respuestas (POST /api/v1/observaciones/respuestas)
     *   • Reportes (GET /api/v1/observaciones/reportes)
     * 
     * 🔔 Sistema: 3 grupos
     *   • Notificaciones (CRUD /api/v1/sistema/notificaciones)
     *   • Excel (POST /api/v1/sistema/excel)
     *   • Reportes (GET /api/v1/sistema/reportes)
     * 
     * 📊 Dashboards: 3 grupos
     *   • Administrador (GET /api/v1/dashboard/administrador)
     *   • Docente (GET /api/v1/dashboard/docente)
     *   • Verificador (GET /api/v1/dashboard/verificador)
     * 
     * 📚 Documentación: 2 rutas especiales
     *   • Info API (GET /api)
     *   • Docs completa (GET /api/v1/docs)
     * 
     * TOTAL: 27 grupos de rutas + 2 documentación = 29 configuraciones
     * 
     * 🔐 Seguridad:
     *   • JWT verificado en rutas protegidas
     *   • Control granular de roles por endpoint
     *   • Rate limiting diferenciado
     *   • Manejo de errores 404 específico para API
     */