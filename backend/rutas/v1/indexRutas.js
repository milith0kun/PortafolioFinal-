// ============================================================
// 🔀 SISTEMA DE RUTAS COMPLETO - API v1
// Sistema Portafolio Docente UNSAAC
// ============================================================

// rutas/v1/index.js - Router principal que conecta todos los módulos
const express = require('express');
const router = express.Router();

// Middlewares de seguridad y autenticación
const { verificarToken, verificarRol, verificarPermisos } = require('../../middleware/autenticacion/jwt.middleware');
const { limitarVelocidad } = require('../../middleware/seguridad/limitador.middleware');
const { validarEsquema } = require('../../middleware/validacion/esquemas.middleware');

// ===================================================
// 🔐 RUTAS DE AUTENTICACIÓN
// ===================================================
const autenticacionRoutes = require('./autenticacion');
router.use('/auth', limitarVelocidad({ max: 10, windowMs: 15 * 60 * 1000 }), autenticacionRoutes);

// ===================================================
// 👥 RUTAS DE USUARIOS (Protegidas)
// ===================================================
const usuariosRoutes = require('./usuarios');
router.use('/usuarios', verificarToken, usuariosRoutes);

// ===================================================
// 🎭 RUTAS DE ROLES (Protegidas)
// ===================================================
const rolesRoutes = require('./roles');
router.use('/roles', verificarToken, rolesRoutes);

// ===================================================
// 📅 RUTAS DE CICLOS ACADÉMICOS (Protegidas)
// ===================================================
const ciclosRoutes = require('./ciclos-academicos');
router.use('/ciclos', verificarToken, ciclosRoutes);

// ===================================================
// 📚 RUTAS DE ASIGNATURAS (Protegidas)
// ===================================================
const asignaturasRoutes = require('./asignaturas');
router.use('/asignaturas', verificarToken, asignaturasRoutes);

// ===================================================
// 📁 RUTAS DE PORTAFOLIOS (Protegidas)
// ===================================================
const portafoliosRoutes = require('./portafolios');
router.use('/portafolios', verificarToken, portafoliosRoutes);

// ===================================================
// 📄 RUTAS DE DOCUMENTOS (Protegidas)
// ===================================================
const documentosRoutes = require('./documentos');
router.use('/documentos', verificarToken, documentosRoutes);

// ===================================================
// ✅ RUTAS DE VERIFICACIÓN (Protegidas)
// ===================================================
const verificacionRoutes = require('./verificacion');
router.use('/verificacion', verificarToken, verificacionRoutes);

// ===================================================
// 💬 RUTAS DE OBSERVACIONES (Protegidas)
// ===================================================
const observacionesRoutes = require('./observaciones');
router.use('/observaciones', verificarToken, observacionesRoutes);

// ===================================================
// 🔔 RUTAS DE NOTIFICACIONES (Protegidas)
// ===================================================
const notificacionesRoutes = require('./notificaciones');
router.use('/notificaciones', verificarToken, notificacionesRoutes);

// ===================================================
// 📊 RUTAS DE TABLEROS/DASHBOARDS (Protegidas)
// ===================================================
const tablerosRoutes = require('./tableros');
router.use('/tableros', verificarToken, tablerosRoutes);

// ===================================================
// 📈 RUTAS DE REPORTES (Protegidas)
// ===================================================
const reportesRoutes = require('./reportes');
router.use('/reportes', verificarToken, reportesRoutes);

// ===================================================
// 📤 RUTAS DE CARGA EXCEL (Protegidas - Solo Admin)
// ===================================================
const cargaExcelRoutes = require('./carga-excel');
router.use('/carga-excel', verificarToken, verificarRol(['administrador']), cargaExcelRoutes);

// ===================================================
// 🏥 RUTA DE HEALTH CHECK (Pública)
// ===================================================
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// ===================================================
// 📊 RUTA DE INFORMACIÓN DEL API (Pública)
// ===================================================
router.get('/info', (req, res) => {
    res.json({
        name: 'Sistema Portafolio Docente UNSAAC',
        version: '1.0.0',
        description: 'API para gestión de portafolios docentes',
        endpoints: {
            auth: '/api/v1/auth',
            usuarios: '/api/v1/usuarios',
            roles: '/api/v1/roles',
            ciclos: '/api/v1/ciclos',
            asignaturas: '/api/v1/asignaturas',
            portafolios: '/api/v1/portafolios',
            documentos: '/api/v1/documentos',
            verificacion: '/api/v1/verificacion',
            observaciones: '/api/v1/observaciones',
            notificaciones: '/api/v1/notificaciones',
            tableros: '/api/v1/tableros',
            reportes: '/api/v1/reportes',
            carga_excel: '/api/v1/carga-excel'
        },
        documentation: '/api/v1/docs'
    });
});

module.exports = router;    