/**
 * 🎭 SERVICIO DE ROLES
 * Sistema Portafolio Docente UNSAAC
 * 
 * Servicio especializado para gestión de roles multi-usuario
 * Asignación, revocación, cambio dinámico y gestión de permisos
 */

class ServicioRoles {
   constructor() {
       this.baseURL = '/roles';
       this.endpoints = {
           // Gestión de roles
           DISPONIBLES: '/disponibles',
           USUARIO_ROLES: '/usuario/:userId',
           ASIGNAR: '/asignar',
           REVOCAR: '/revocar',
           ASIGNACIONES: '/asignaciones',
           ASIGNACION_MASIVA: '/asignacion-masiva',
           ESTADISTICAS: '/estadisticas',
           
           // Cambio de rol
           MIS_ROLES: '/mis-roles',
           CAMBIAR: '/cambiar',
           ROL_ACTUAL: '/rol-actual',
           HISTORIAL_CAMBIOS: '/historial-cambios',
           SOLICITAR_ROL: '/solicitar-rol',
           SOLICITUDES: '/solicitudes',
           PROCESAR_SOLICITUD: '/solicitudes/:solicitudId',
           
           // Permisos
           PERMISOS_DISPONIBLES: '/permisos/disponibles',
           PERMISOS_USUARIO: '/permisos/usuario/:userId',
           PERMISOS_ROL: '/permisos/rol/:rol',
           ASIGNAR_PERMISOS: '/permisos/asignar/:userId',
           REVOCAR_PERMISOS: '/permisos/revocar/:userId',
           VERIFICAR_PERMISO: '/permisos/verificar/:userId/:permiso',
           ESTADISTICAS_PERMISOS: '/permisos/estadisticas',
           HISTORIAL_PERMISOS: '/permisos/historial/:userId',
           SINCRONIZAR_PERMISOS: '/permisos/sincronizar'
       };
   }

   // ==========================================
   // 🎭 GESTIÓN BÁSICA DE ROLES
   // ==========================================

   /**
    * 📋 Obtener roles disponibles
    */
   async obtenerRolesDisponibles() {
       try {
           console.log('📋 Obteniendo roles disponibles...');

           const response = await window.api.get(this.baseURL + this.endpoints.DISPONIBLES);

           if (response.data.success) {
               return {
                   success: true,
                   roles: response.data.roles,
                   descripcion: response.data.descripcion,
                   jerarquia: response.data.jerarquia
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener roles disponibles');
           }

       } catch (error) {
           console.error('❌ Error al obtener roles disponibles:', error);
           throw error;
       }
   }

   /**
    * 👤 Obtener roles de un usuario específico
    */
   async obtenerRolesUsuario(usuarioId) {
       try {
           if (!usuarioId) {
               throw new Error('ID de usuario requerido');
           }

           console.log('👤 Obteniendo roles del usuario:', usuarioId);

           const url = this.baseURL + this.endpoints.USUARIO_ROLES.replace(':userId', usuarioId);
           const response = await window.api.get(url);

           if (response.data.success) {
               return {
                   success: true,
                   usuario: response.data.usuario,
                   roles: response.data.roles,
                   rolActivo: response.data.rolActivo,
                   fechasAsignacion: response.data.fechasAsignacion,
                   asignadoPor: response.data.asignadoPor
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener roles del usuario');
           }

       } catch (error) {
           console.error('❌ Error al obtener roles del usuario:', error);
           throw error;
       }
   }

   /**
    * ➕ Asignar rol a usuario
    */
   async asignarRol(usuarioId, rol, observaciones = '') {
       try {
           // Validaciones
           if (!usuarioId) {
               throw new Error('ID de usuario requerido');
           }

           if (!rol) {
               throw new Error('Rol requerido');
           }

           this.validarRol(rol);

           console.log(`➕ Asignando rol '${rol}' al usuario:`, usuarioId);

           const response = await window.api.post(this.baseURL + this.endpoints.ASIGNAR, {
               usuarioId: usuarioId,
               rol: rol,
               observaciones: observaciones.trim(),
               timestamp: Date.now()
           });

           if (response.data.success) {
               console.log('✅ Rol asignado exitosamente');

               // Métricas
               this.enviarMetricaAsignacion('asignar', usuarioId, rol);

               return {
                   success: true,
                   usuario: response.data.usuario,
                   rol: rol,
                   mensaje: response.data.message || `Rol '${this.formatearNombreRol(rol)}' asignado exitosamente`
               };
           } else {
               throw new Error(response.data.message || 'Error al asignar rol');
           }

       } catch (error) {
           console.error('❌ Error al asignar rol:', error);
           throw error;
       }
   }

   /**
    * ➖ Revocar rol de usuario
    */
   async revocarRol(usuarioId, rol, observaciones = '') {
       try {
           // Validaciones
           if (!usuarioId) {
               throw new Error('ID de usuario requerido');
           }

           if (!rol) {
               throw new Error('Rol requerido');
           }

           console.log(`➖ Revocando rol '${rol}' del usuario:`, usuarioId);

           const response = await window.api.delete(this.baseURL + this.endpoints.REVOCAR, {
               data: {
                   usuarioId: usuarioId,
                   rol: rol,
                   observaciones: observaciones.trim(),
                   timestamp: Date.now()
               }
           });

           if (response.data.success) {
               console.log('✅ Rol revocado exitosamente');

               // Métricas
               this.enviarMetricaAsignacion('revocar', usuarioId, rol);

               return {
                   success: true,
                   usuario: response.data.usuario,
                   rol: rol,
                   mensaje: response.data.message || `Rol '${this.formatearNombreRol(rol)}' revocado exitosamente`
               };
           } else {
               throw new Error(response.data.message || 'Error al revocar rol');
           }

       } catch (error) {
           console.error('❌ Error al revocar rol:', error);
           throw error;
       }
   }

   /**
    * 📊 Obtener todas las asignaciones de roles
    */
   async obtenerAsignaciones(filtros = {}, paginacion = {}) {
       try {
           const params = {
               // Filtros
               usuario: filtros.usuario,
               rol: filtros.rol,
               estado: filtros.estado || 'activo',
               fechaDesde: filtros.fechaDesde,
               fechaHasta: filtros.fechaHasta,
               asignadoPor: filtros.asignadoPor,
               
               // Paginación
               pagina: paginacion.pagina || 1,
               limite: paginacion.limite || CONFIG.UI.TABLA_CONFIG.ITEMS_POR_PAGINA,
               ordenar: paginacion.ordenar || 'fecha_asignacion',
               direccion: paginacion.direccion || 'desc'
           };

           console.log('📊 Obteniendo asignaciones de roles...');

           const response = await window.api.get(this.baseURL + this.endpoints.ASIGNACIONES, params);

           if (response.data.success) {
               return {
                   success: true,
                   asignaciones: response.data.asignaciones,
                   total: response.data.total,
                   paginas: response.data.paginas,
                   paginaActual: response.data.paginaActual,
                   estadisticas: response.data.estadisticas
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener asignaciones');
           }

       } catch (error) {
           console.error('❌ Error al obtener asignaciones:', error);
           throw error;
       }
   }

   /**
    * 🔄 Asignación masiva de roles
    */
   async asignacionMasiva(asignaciones) {
       try {
           if (!Array.isArray(asignaciones) || asignaciones.length === 0) {
               throw new Error('Se requiere un array de asignaciones');
           }

           // Validar cada asignación
           asignaciones.forEach((asignacion, index) => {
               if (!asignacion.usuarioId || !asignacion.rol) {
                   throw new Error(`Asignación ${index + 1}: Usuario y rol son requeridos`);
               }
               this.validarRol(asignacion.rol);
           });

           console.log(`🔄 Realizando asignación masiva de ${asignaciones.length} roles...`);

           const response = await window.api.post(this.baseURL + this.endpoints.ASIGNACION_MASIVA, {
               asignaciones: asignaciones,
               timestamp: Date.now()
           });

           if (response.data.success) {
               console.log('✅ Asignación masiva completada');

               return {
                   success: true,
                   resultado: response.data.resultado,
                   exitosos: response.data.exitosos,
                   fallidos: response.data.fallidos,
                   mensaje: response.data.message || 'Asignación masiva completada'
               };
           } else {
               throw new Error(response.data.message || 'Error en asignación masiva');
           }

       } catch (error) {
           console.error('❌ Error en asignación masiva:', error);
           throw error;
       }
   }

   // ==========================================
   // 🔄 CAMBIO DINÁMICO DE ROLES
   // ==========================================

   /**
    * 🎭 Obtener mis roles disponibles
    */
   async obtenerMisRoles() {
       try {
           console.log('🎭 Obteniendo mis roles disponibles...');

           const response = await window.api.get(this.baseURL + this.endpoints.MIS_ROLES);

           if (response.data.success) {
               return {
                   success: true,
                   roles: response.data.roles,
                   rolActual: response.data.rolActual,
                   puedesCambiar: response.data.puedesCambiar
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener roles disponibles');
           }

       } catch (error) {
           console.error('❌ Error al obtener mis roles:', error);
           throw error;
       }
   }

   /**
    * 🔄 Cambiar rol activo
    */
   async cambiarRol(nuevoRol) {
       try {
           if (!nuevoRol) {
               throw new Error('Nuevo rol requerido');
           }

           this.validarRol(nuevoRol);

           console.log(`🔄 Cambiando a rol: ${nuevoRol}`);

           const response = await window.api.post(this.baseURL + this.endpoints.CAMBIAR, {
               rol: nuevoRol,
               timestamp: Date.now()
           });

           if (response.data.success) {
               console.log('✅ Rol cambiado exitosamente');

               // Métricas
               this.enviarMetricaCambioRol(nuevoRol);

               return {
                   success: true,
                   rolAnterior: response.data.rolAnterior,
                   rolNuevo: response.data.rolNuevo,
                   permisos: response.data.permisos,
                   redirectUrl: response.data.redirectUrl,
                   mensaje: response.data.message || `Cambiado a rol: ${this.formatearNombreRol(nuevoRol)}`
               };
           } else {
               throw new Error(response.data.message || 'Error al cambiar rol');
           }

       } catch (error) {
           console.error('❌ Error al cambiar rol:', error);
           throw error;
       }
   }

   /**
    * ℹ️ Obtener información del rol actual
    */
   async obtenerRolActual() {
       try {
           console.log('ℹ️ Obteniendo información del rol actual...');

           const response = await window.api.get(this.baseURL + this.endpoints.ROL_ACTUAL);

           if (response.data.success) {
               return {
                   success: true,
                   rolActual: response.data.rolActual,
                   permisos: response.data.permisos,
                   descripcion: response.data.descripcion,
                   cambiadoEn: response.data.cambiadoEn
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener rol actual');
           }

       } catch (error) {
           console.error('❌ Error al obtener rol actual:', error);
           throw error;
       }
   }

   /**
    * 📋 Obtener historial de cambios de rol
    */
   async obtenerHistorialCambios(limite = 50) {
       try {
           const params = { limite: limite };

           console.log('📋 Obteniendo historial de cambios de rol...');

           const response = await window.api.get(this.baseURL + this.endpoints.HISTORIAL_CAMBIOS, params);

           if (response.data.success) {
               return {
                   success: true,
                   historial: response.data.historial,
                   total: response.data.total
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener historial');
           }

       } catch (error) {
           console.error('❌ Error al obtener historial de cambios:', error);
           throw error;
       }
   }

   // ==========================================
   // 📝 SOLICITUDES DE ROLES
   // ==========================================

   /**
    * 📝 Solicitar nuevo rol
    */
   async solicitarRol(rol, justificacion = '') {
       try {
           if (!rol) {
               throw new Error('Rol solicitado requerido');
           }

           if (!justificacion.trim()) {
               throw new Error('Justificación requerida');
           }

           this.validarRol(rol);

           console.log(`📝 Solicitando rol: ${rol}`);

           const response = await window.api.post(this.baseURL + this.endpoints.SOLICITAR_ROL, {
               rol: rol,
               justificacion: justificacion.trim(),
               timestamp: Date.now()
           });

           if (response.data.success) {
               console.log('✅ Solicitud de rol enviada');

               return {
                   success: true,
                   solicitud: response.data.solicitud,
                   mensaje: response.data.message || 'Solicitud de rol enviada correctamente'
               };
           } else {
               throw new Error(response.data.message || 'Error al enviar solicitud');
           }

       } catch (error) {
           console.error('❌ Error al solicitar rol:', error);
           throw error;
       }
   }

   /**
    * 📋 Obtener solicitudes pendientes (Admin)
    */
   async obtenerSolicitudes(filtros = {}) {
       try {
           const params = {
               estado: filtros.estado || 'pendiente',
               rol: filtros.rol,
               usuario: filtros.usuario,
               fechaDesde: filtros.fechaDesde,
               fechaHasta: filtros.fechaHasta
           };

           console.log('📋 Obteniendo solicitudes de roles...');

           const response = await window.api.get(this.baseURL + this.endpoints.SOLICITUDES, params);

           if (response.data.success) {
               return {
                   success: true,
                   solicitudes: response.data.solicitudes,
                   total: response.data.total,
                   estadisticas: response.data.estadisticas
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener solicitudes');
           }

       } catch (error) {
           console.error('❌ Error al obtener solicitudes:', error);
           throw error;
       }
   }

   /**
    * ✅ Procesar solicitud de rol (Aprobar/Rechazar)
    */
   async procesarSolicitud(solicitudId, accion, observaciones = '') {
       try {
           if (!solicitudId) {
               throw new Error('ID de solicitud requerido');
           }

           if (!['aprobar', 'rechazar'].includes(accion)) {
               throw new Error('Acción debe ser "aprobar" o "rechazar"');
           }

           console.log(`${accion === 'aprobar' ? '✅' : '❌'} ${Utils.Texto.capitalizar(accion)}ando solicitud:`, solicitudId);

           const url = this.baseURL + this.endpoints.PROCESAR_SOLICITUD.replace(':solicitudId', solicitudId);
           const response = await window.api.put(url, {
               accion: accion,
               observaciones: observaciones.trim(),
               timestamp: Date.now()
           });

           if (response.data.success) {
               console.log(`✅ Solicitud ${accion === 'aprobar' ? 'aprobada' : 'rechazada'} exitosamente`);

               return {
                   success: true,
                   solicitud: response.data.solicitud,
                   mensaje: response.data.message || `Solicitud ${accion === 'aprobar' ? 'aprobada' : 'rechazada'} correctamente`
               };
           } else {
               throw new Error(response.data.message || 'Error al procesar solicitud');
           }

       } catch (error) {
           console.error('❌ Error al procesar solicitud:', error);
           throw error;
       }
   }

   // ==========================================
   // 🔐 GESTIÓN DE PERMISOS
   // ==========================================

   /**
    * 📋 Obtener permisos disponibles
    */
   async obtenerPermisosDisponibles() {
       try {
           console.log('📋 Obteniendo permisos disponibles...');

           const response = await window.api.get(this.baseURL + this.endpoints.PERMISOS_DISPONIBLES);

           if (response.data.success) {
               return {
                   success: true,
                   permisos: response.data.permisos,
                   categorias: response.data.categorias,
                   descripcion: response.data.descripcion
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener permisos');
           }

       } catch (error) {
           console.error('❌ Error al obtener permisos disponibles:', error);
           throw error;
       }
   }

   /**
    * 👤 Obtener permisos de usuario
    */
   async obtenerPermisosUsuario(usuarioId) {
       try {
           if (!usuarioId) {
               throw new Error('ID de usuario requerido');
           }

           const url = this.baseURL + this.endpoints.PERMISOS_USUARIO.replace(':userId', usuarioId);
           const response = await window.api.get(url);

           if (response.data.success) {
               return {
                   success: true,
                   usuario: response.data.usuario,
                   permisos: response.data.permisos,
                   permisosPorRol: response.data.permisosPorRol,
                   permisosEspeciales: response.data.permisosEspeciales
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener permisos del usuario');
           }

       } catch (error) {
           console.error('❌ Error al obtener permisos del usuario:', error);
           throw error;
       }
   }

   /**
    * 🎭 Obtener permisos por rol
    */
   async obtenerPermisosPorRol(rol) {
       try {
           if (!rol) {
               throw new Error('Rol requerido');
           }

           this.validarRol(rol);

           const url = this.baseURL + this.endpoints.PERMISOS_ROL.replace(':rol', rol);
           const response = await window.api.get(url);

           if (response.data.success) {
               return {
                   success: true,
                   rol: rol,
                   permisos: response.data.permisos,
                   descripcion: response.data.descripcion
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener permisos del rol');
           }

       } catch (error) {
           console.error('❌ Error al obtener permisos del rol:', error);
           throw error;
       }
   }

   /**
    * ✅ Verificar permiso específico
    */
   async verificarPermiso(usuarioId, permiso) {
       try {
           if (!usuarioId || !permiso) {
               throw new Error('Usuario y permiso requeridos');
           }

           const url = this.baseURL + this.endpoints.VERIFICAR_PERMISO
               .replace(':userId', usuarioId)
               .replace(':permiso', permiso);

           const response = await window.api.get(url);

           return {
               success: response.data.success,
               tienePermiso: response.data.tienePermiso,
               origen: response.data.origen // 'rol' o 'especial'
           };

       } catch (error) {
           console.error('❌ Error al verificar permiso:', error);
           return { success: false, tienePermiso: false };
       }
   }

   // ==========================================
   // 📊 ESTADÍSTICAS Y REPORTES
   // ==========================================

   /**
    * 📊 Obtener estadísticas de roles
    */
   async obtenerEstadisticas(periodo = '30d') {
       try {
           const params = { periodo: periodo };

           console.log('📊 Obteniendo estadísticas de roles...');

           const response = await window.api.get(this.baseURL + this.endpoints.ESTADISTICAS, params);

           if (response.data.success) {
               return {
                   success: true,
                   estadisticas: response.data.estadisticas,
                   distribucion: response.data.distribucion,
                   tendencias: response.data.tendencias,
                   cambiosRecientes: response.data.cambiosRecientes
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener estadísticas');
           }

       } catch (error) {
           console.error('❌ Error al obtener estadísticas:', error);
           throw error;
       }
   }

   /**
    * 📊 Obtener estadísticas de permisos
    */
   async obtenerEstadisticasPermisos() {
       try {
           console.log('📊 Obteniendo estadísticas de permisos...');

           const response = await window.api.get(this.baseURL + this.endpoints.ESTADISTICAS_PERMISOS);

           if (response.data.success) {
               return {
                   success: true,
                   estadisticas: response.data.estadisticas,
                   usoPermisos: response.data.usoPermisos,
                   permisosOrfanos: response.data.permisosOrfanos
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener estadísticas de permisos');
           }

       } catch (error) {
           console.error('❌ Error al obtener estadísticas de permisos:', error);
           throw error;
       }
   }

   // ==========================================
   // 🛠️ MÉTODOS AUXILIARES
   // ==========================================

   /**
    * ✅ Validar rol
    */
   validarRol(rol) {
       const rolesValidos = Object.values(CONFIG.ROLES.ROLES);
       if (!rolesValidos.includes(rol)) {
           throw new Error(`Rol inválido: ${rol}. Roles válidos: ${rolesValidos.join(', ')}`);
       }
   }

   /**
    * 🏷️ Formatear nombre de rol
    */
   formatearNombreRol(rol) {
       const nombres = {
           administrador: 'Administrador',
           verificador: 'Verificador',
           docente: 'Docente'
       };

       return nombres[rol] || Utils.Texto.capitalizarPalabras(rol);
   }

   /**
    * 🎨 Obtener color del rol
    */
   obtenerColorRol(rol) {
       const colores = {
           administrador: 'danger',
           verificador: 'warning',
           docente: 'primary'
       };

       return colores[rol] || 'secondary';
   }

   /**
    * 🔒 Verificar jerarquía de roles
    */
   puedeAsignarRol(rolActual, rolObjetivo) {
       const jerarquia = {
           administrador: 3,
           verificador: 2,
           docente: 1
       };

       return jerarquia[rolActual] >= jerarquia[rolObjetivo];
   }

   // ==========================================
   // 📊 MÉTRICAS
   // ==========================================

   /**
    * 📊 Enviar métrica de asignación
    */
   enviarMetricaAsignacion(accion, usuarioId, rol) {
       if (!CONFIG.METRICAS.TRACKING_HABILITADO) return;

       const evento = {
           tipo: 'asignacion_rol',
           accion: accion,
           usuarioId: usuarioId,
           rol: rol,
           timestamp: Date.now()
       };

       if (window.gtag) {
           window.gtag('event', 'role_assignment', {
               action: accion,
               role: rol,
               target_user: usuarioId
           });
       }

       console.log('📊 Métrica asignación rol:', evento);
   }

   /**
    * 📊 Enviar métrica de cambio de rol
    */
   enviarMetricaCambioRol(nuevoRol) {
       if (!CONFIG.METRICAS.TRACKING_HABILITADO) return;

       const evento = {
           tipo: 'cambio_rol',
           nuevoRol: nuevoRol,
           timestamp: Date.now()
       };

       if (window.gtag) {
           window.gtag('event', 'role_switch', {
               new_role: nuevoRol
           });
       }

       console.log('📊 Métrica cambio rol:', evento);
   }
}

// 🚀 Crear instancia global
window.ServicioRoles = new ServicioRoles();

// 📤 Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
   module.exports = ServicioRoles;
}

console.log('🎭 Servicio de roles inicializado correctamente');