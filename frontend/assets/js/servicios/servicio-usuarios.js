/**
 * 👥 SERVICIO DE USUARIOS
 * Sistema Portafolio Docente UNSAAC
 * 
 * Servicio especializado para todas las operaciones CRUD de usuarios
 * Gestión de perfiles, actividad y estadísticas de usuarios
 */

class ServicioUsuarios {
   constructor() {
       this.baseURL = '/usuarios';
       this.endpoints = {
           LISTAR: '',
           BUSCAR: '/buscar',
           OBTENER: '/:id',
           CREAR: '',
           ACTUALIZAR: '/:id',
           ELIMINAR: '/:id',
           CAMBIAR_ESTADO: '/:id/estado',
           
           // Actividad
           ACTIVIDAD: '/:id/actividad',
           MI_ACTIVIDAD: '/mi/actividad',
           ESTADISTICAS: '/:id/estadisticas',
           SESIONES: '/:id/sesiones',
           RESUMEN: '/:id/resumen',
           EXPORTAR: '/:id/exportar',
           
           // Perfil
           MI_PERFIL: '/mi/perfil',
           PERFIL_PUBLICO: '/:id/perfil-publico',
           AVATAR: '/mi/perfil/avatar',
           CONFIGURACION: '/mi/perfil/configuracion',
           NOTIFICACIONES: '/mi/perfil/notificaciones',
           PRIVACIDAD: '/mi/perfil/privacidad'
       };
   }

   // ==========================================
   // 👥 OPERACIONES CRUD
   // ==========================================

   /**
    * 📋 Listar usuarios con filtros y paginación
    */
   async listar(filtros = {}, paginacion = {}) {
       try {
           const params = {
               // Filtros
               rol: filtros.rol,
               estado: filtros.estado,
               carrera: filtros.carrera,
               departamento: filtros.departamento,
               busqueda: filtros.busqueda,
               fechaDesde: filtros.fechaDesde,
               fechaHasta: filtros.fechaHasta,
               
               // Paginación
               pagina: paginacion.pagina || 1,
               limite: paginacion.limite || CONFIG.UI.TABLA_CONFIG.ITEMS_POR_PAGINA,
               ordenar: paginacion.ordenar || 'nombres',
               direccion: paginacion.direccion || 'asc',
               
               // Opciones
               incluirEliminados: filtros.incluirEliminados || false,
               incluirEstadisticas: filtros.incluirEstadisticas || false
           };

           console.log('📋 Listando usuarios con filtros:', filtros);

           const response = await window.api.get(this.baseURL, params);

           if (response.data.success) {
               return {
                   success: true,
                   usuarios: response.data.usuarios,
                   total: response.data.total,
                   paginas: response.data.paginas,
                   paginaActual: response.data.paginaActual,
                   estadisticas: response.data.estadisticas
               };
           } else {
               throw new Error(response.data.message || 'Error al listar usuarios');
           }

       } catch (error) {
           console.error('❌ Error al listar usuarios:', error);
           throw error;
       }
   }

   /**
    * 🔍 Buscar usuarios
    */
   async buscar(termino, filtros = {}) {
       try {
           if (!termino || termino.trim().length < 2) {
               return { success: true, usuarios: [] };
           }

           const params = {
               q: termino.trim(),
               rol: filtros.rol,
               estado: filtros.estado,
               limite: filtros.limite || 10,
               exacto: filtros.exacto || false
           };

           console.log('🔍 Buscando usuarios:', termino);

           const response = await window.api.get(this.baseURL + this.endpoints.BUSCAR, params);

           if (response.data.success) {
               return {
                   success: true,
                   usuarios: response.data.usuarios,
                   total: response.data.total,
                   termino: termino
               };
           } else {
               throw new Error(response.data.message || 'Error en la búsqueda');
           }

       } catch (error) {
           console.error('❌ Error al buscar usuarios:', error);
           throw error;
       }
   }

   /**
    * 👤 Obtener usuario específico
    */
   async obtener(usuarioId, opciones = {}) {
       try {
           if (!usuarioId) {
               throw new Error('ID de usuario requerido');
           }

           const params = {
               incluirRoles: opciones.incluirRoles !== false,
               incluirEstadisticas: opciones.incluirEstadisticas || false,
               incluirActividad: opciones.incluirActividad || false
           };

           console.log('👤 Obteniendo usuario:', usuarioId);

           const url = this.baseURL + this.endpoints.OBTENER.replace(':id', usuarioId);
           const response = await window.api.get(url, params);

           if (response.data.success) {
               return {
                   success: true,
                   usuario: response.data.usuario,
                   roles: response.data.roles,
                   estadisticas: response.data.estadisticas,
                   actividad: response.data.actividad
               };
           } else {
               throw new Error(response.data.message || 'Usuario no encontrado');
           }

       } catch (error) {
           console.error('❌ Error al obtener usuario:', error);
           throw error;
       }
   }

   /**
    * ➕ Crear nuevo usuario
    */
   async crear(datosUsuario) {
       try {
           // Validar datos requeridos
           this.validarDatosUsuario(datosUsuario, true);

           console.log('➕ Creando nuevo usuario:', datosUsuario.correo);

           const response = await window.api.post(this.baseURL, {
               nombres: datosUsuario.nombres.trim(),
               apellidos: datosUsuario.apellidos.trim(),
               correo: datosUsuario.correo.toLowerCase().trim(),
               telefono: datosUsuario.telefono?.trim(),
               contrasena: datosUsuario.contrasena,
               roles: datosUsuario.roles || ['docente'],
               departamento: datosUsuario.departamento,
               carrera: datosUsuario.carrera,
               activo: datosUsuario.activo !== false,
               enviarNotificacion: datosUsuario.enviarNotificacion !== false
           });

           if (response.data.success) {
               console.log('✅ Usuario creado exitosamente:', response.data.usuario.id);

               return {
                   success: true,
                   usuario: response.data.usuario,
                   mensaje: response.data.message || 'Usuario creado exitosamente'
               };
           } else {
               throw new Error(response.data.message || 'Error al crear usuario');
           }

       } catch (error) {
           console.error('❌ Error al crear usuario:', error);
           throw error;
       }
   }

   /**
    * ✏️ Actualizar usuario
    */
   async actualizar(usuarioId, datosActualizacion) {
       try {
           if (!usuarioId) {
               throw new Error('ID de usuario requerido');
           }

           // Validar datos (sin contraseña obligatoria en actualización)
           this.validarDatosUsuario(datosActualizacion, false);

           console.log('✏️ Actualizando usuario:', usuarioId);

           const url = this.baseURL + this.endpoints.ACTUALIZAR.replace(':id', usuarioId);
           const response = await window.api.put(url, {
               nombres: datosActualizacion.nombres?.trim(),
               apellidos: datosActualizacion.apellidos?.trim(),
               correo: datosActualizacion.correo?.toLowerCase().trim(),
               telefono: datosActualizacion.telefono?.trim(),
               departamento: datosActualizacion.departamento,
               carrera: datosActualizacion.carrera,
               // Solo incluir contraseña si se proporciona
               ...(datosActualizacion.contrasena && { contrasena: datosActualizacion.contrasena })
           });

           if (response.data.success) {
               console.log('✅ Usuario actualizado exitosamente');

               return {
                   success: true,
                   usuario: response.data.usuario,
                   mensaje: response.data.message || 'Usuario actualizado exitosamente'
               };
           } else {
               throw new Error(response.data.message || 'Error al actualizar usuario');
           }

       } catch (error) {
           console.error('❌ Error al actualizar usuario:', error);
           throw error;
       }
   }

   /**
    * 🗑️ Eliminar usuario
    */
   async eliminar(usuarioId, forzar = false) {
       try {
           if (!usuarioId) {
               throw new Error('ID de usuario requerido');
           }

           console.log('🗑️ Eliminando usuario:', usuarioId);

           const url = this.baseURL + this.endpoints.ELIMINAR.replace(':id', usuarioId);
           const response = await window.api.delete(url, {
               data: { forzar: forzar }
           });

           if (response.data.success) {
               console.log('✅ Usuario eliminado exitosamente');

               return {
                   success: true,
                   mensaje: response.data.message || 'Usuario eliminado exitosamente'
               };
           } else {
               throw new Error(response.data.message || 'Error al eliminar usuario');
           }

       } catch (error) {
           console.error('❌ Error al eliminar usuario:', error);
           throw error;
       }
   }

   /**
    * 🔄 Cambiar estado de usuario (activar/desactivar)
    */
   async cambiarEstado(usuarioId, activo, razon = '') {
       try {
           if (!usuarioId) {
               throw new Error('ID de usuario requerido');
           }

           console.log(`🔄 ${activo ? 'Activando' : 'Desactivando'} usuario:`, usuarioId);

           const url = this.baseURL + this.endpoints.CAMBIAR_ESTADO.replace(':id', usuarioId);
           const response = await window.api.patch(url, {
               activo: activo,
               razon: razon.trim()
           });

           if (response.data.success) {
               console.log(`✅ Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`);

               return {
                   success: true,
                   usuario: response.data.usuario,
                   mensaje: response.data.message || `Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`
               };
           } else {
               throw new Error(response.data.message || 'Error al cambiar estado del usuario');
           }

       } catch (error) {
           console.error('❌ Error al cambiar estado:', error);
           throw error;
       }
   }

   // ==========================================
   // 📊 ACTIVIDAD Y ESTADÍSTICAS
   // ==========================================

   /**
    * 📊 Obtener actividad de usuario
    */
   async obtenerActividad(usuarioId, filtros = {}) {
       try {
           const params = {
               fechaDesde: filtros.fechaDesde,
               fechaHasta: filtros.fechaHasta,
               tipo: filtros.tipo,
               limite: filtros.limite || 50,
               pagina: filtros.pagina || 1
           };

           const url = usuarioId 
               ? this.baseURL + this.endpoints.ACTIVIDAD.replace(':id', usuarioId)
               : this.baseURL + this.endpoints.MI_ACTIVIDAD;

           console.log('📊 Obteniendo actividad del usuario...');

           const response = await window.api.get(url, params);

           if (response.data.success) {
               return {
                   success: true,
                   actividad: response.data.actividad,
                   resumen: response.data.resumen,
                   total: response.data.total,
                   paginas: response.data.paginas
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener actividad');
           }

       } catch (error) {
           console.error('❌ Error al obtener actividad:', error);
           throw error;
       }
   }

   /**
    * 📈 Obtener estadísticas de usuario
    */
   async obtenerEstadisticas(usuarioId, periodo = '30d') {
       try {
           const params = { periodo: periodo };

           const url = this.baseURL + this.endpoints.ESTADISTICAS.replace(':id', usuarioId);

           console.log('📈 Obteniendo estadísticas del usuario...');

           const response = await window.api.get(url, params);

           if (response.data.success) {
               return {
                   success: true,
                   estadisticas: response.data.estadisticas,
                   graficos: response.data.graficos,
                   comparacion: response.data.comparacion
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
    * 📱 Obtener sesiones activas
    */
   async obtenerSesiones(usuarioId) {
       try {
           const url = this.baseURL + this.endpoints.SESIONES.replace(':id', usuarioId);

           console.log('📱 Obteniendo sesiones del usuario...');

           const response = await window.api.get(url);

           if (response.data.success) {
               return {
                   success: true,
                   sesiones: response.data.sesiones,
                   sesionActual: response.data.sesionActual
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener sesiones');
           }

       } catch (error) {
           console.error('❌ Error al obtener sesiones:', error);
           throw error;
       }
   }

   /**
    * 📄 Obtener resumen de usuario
    */
   async obtenerResumen(usuarioId) {
       try {
           const url = this.baseURL + this.endpoints.RESUMEN.replace(':id', usuarioId);

           console.log('📄 Obteniendo resumen del usuario...');

           const response = await window.api.get(url);

           if (response.data.success) {
               return {
                   success: true,
                   resumen: response.data.resumen
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener resumen');
           }

       } catch (error) {
           console.error('❌ Error al obtener resumen:', error);
           throw error;
       }
   }

   // ==========================================
   // 👤 GESTIÓN DE PERFIL
   // ==========================================

   /**
    * 👤 Obtener mi perfil
    */
   async obtenerMiPerfil() {
       try {
           console.log('👤 Obteniendo mi perfil...');

           const response = await window.api.get(this.baseURL + this.endpoints.MI_PERFIL);

           if (response.data.success) {
               return {
                   success: true,
                   perfil: response.data.perfil,
                   configuracion: response.data.configuracion
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener perfil');
           }

       } catch (error) {
           console.error('❌ Error al obtener mi perfil:', error);
           throw error;
       }
   }

   /**
    * ✏️ Actualizar mi perfil
    */
   async actualizarMiPerfil(datosPerfil) {
       try {
           console.log('✏️ Actualizando mi perfil...');

           const response = await window.api.put(this.baseURL + this.endpoints.MI_PERFIL, {
               nombres: datosPerfil.nombres?.trim(),
               apellidos: datosPerfil.apellidos?.trim(),
               telefono: datosPerfil.telefono?.trim(),
               bio: datosPerfil.bio?.trim(),
               departamento: datosPerfil.departamento,
               carrera: datosPerfil.carrera,
               redesSociales: datosPerfil.redesSociales
           });

           if (response.data.success) {
               console.log('✅ Perfil actualizado exitosamente');

               return {
                   success: true,
                   perfil: response.data.perfil,
                   mensaje: response.data.message || 'Perfil actualizado exitosamente'
               };
           } else {
               throw new Error(response.data.message || 'Error al actualizar perfil');
           }

       } catch (error) {
           console.error('❌ Error al actualizar perfil:', error);
           throw error;
       }
   }

   /**
    * 🖼️ Subir avatar
    */
   async subirAvatar(archivo) {
       try {
           // Validar archivo
           this.validarAvatar(archivo);

           console.log('🖼️ Subiendo avatar...');

           const response = await window.api.subirArchivoConProgress(
               this.baseURL + this.endpoints.AVATAR,
               archivo,
               {},
               (progreso) => {
                   console.log(`📊 Progreso upload: ${progreso.percent}%`);
               }
           );

           if (response.data.success) {
               console.log('✅ Avatar subido exitosamente');

               return {
                   success: true,
                   avatar: response.data.avatar,
                   url: response.data.url,
                   mensaje: response.data.message || 'Avatar actualizado exitosamente'
               };
           } else {
               throw new Error(response.data.message || 'Error al subir avatar');
           }

       } catch (error) {
           console.error('❌ Error al subir avatar:', error);
           throw error;
       }
   }

   /**
    * 🗑️ Eliminar avatar
    */
   async eliminarAvatar() {
       try {
           console.log('🗑️ Eliminando avatar...');

           const response = await window.api.delete(this.baseURL + this.endpoints.AVATAR);

           if (response.data.success) {
               console.log('✅ Avatar eliminado exitosamente');

               return {
                   success: true,
                   mensaje: response.data.message || 'Avatar eliminado exitosamente'
               };
           } else {
               throw new Error(response.data.message || 'Error al eliminar avatar');
           }

       } catch (error) {
           console.error('❌ Error al eliminar avatar:', error);
           throw error;
       }
   }

   /**
    * 👁️ Obtener perfil público
    */
   async obtenerPerfilPublico(usuarioId) {
       try {
           const url = this.baseURL + this.endpoints.PERFIL_PUBLICO.replace(':id', usuarioId);

           console.log('👁️ Obteniendo perfil público...');

           const response = await window.api.get(url);

           if (response.data.success) {
               return {
                   success: true,
                   perfil: response.data.perfil
               };
           } else {
               throw new Error(response.data.message || 'Perfil no encontrado');
           }

       } catch (error) {
           console.error('❌ Error al obtener perfil público:', error);
           throw error;
       }
   }

   // ==========================================
   // ⚙️ CONFIGURACIONES
   // ==========================================

   /**
    * ⚙️ Obtener configuraciones de perfil
    */
   async obtenerConfiguracion() {
       try {
           const response = await window.api.get(this.baseURL + this.endpoints.CONFIGURACION);

           if (response.data.success) {
               return {
                   success: true,
                   configuracion: response.data.configuracion
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener configuración');
           }

       } catch (error) {
           console.error('❌ Error al obtener configuración:', error);
           throw error;
       }
   }

   /**
    * ⚙️ Actualizar configuraciones
    */
   async actualizarConfiguracion(configuracion) {
       try {
           const response = await window.api.put(this.baseURL + this.endpoints.CONFIGURACION, configuracion);

           if (response.data.success) {
               return {
                   success: true,
                   configuracion: response.data.configuracion,
                   mensaje: 'Configuración actualizada exitosamente'
               };
           } else {
               throw new Error(response.data.message || 'Error al actualizar configuración');
           }

       } catch (error) {
           console.error('❌ Error al actualizar configuración:', error);
           throw error;
       }
   }

   // ==========================================
   // 🔔 NOTIFICACIONES
   // ==========================================

   /**
    * 🔔 Obtener configuración de notificaciones
    */
   async obtenerConfiguracionNotificaciones() {
       try {
           const response = await window.api.get(this.baseURL + this.endpoints.NOTIFICACIONES);

           if (response.data.success) {
               return {
                   success: true,
                   configuracion: response.data.configuracion
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener configuración');
           }

       } catch (error) {
           console.error('❌ Error al obtener configuración notificaciones:', error);
           throw error;
       }
   }

   /**
    * 🔔 Actualizar configuración de notificaciones
    */
   async actualizarConfiguracionNotificaciones(configuracion) {
       try {
           const response = await window.api.put(this.baseURL + this.endpoints.NOTIFICACIONES, configuracion);

           if (response.data.success) {
               return {
                   success: true,
                   configuracion: response.data.configuracion,
                   mensaje: 'Configuración de notificaciones actualizada'
               };
           } else {
               throw new Error(response.data.message || 'Error al actualizar configuración');
           }

       } catch (error) {
           console.error('❌ Error al actualizar config notificaciones:', error);
           throw error;
       }
   }

   // ==========================================
   // 🛠️ MÉTODOS DE VALIDACIÓN
   // ==========================================

   /**
    * ✅ Validar datos de usuario
    */
   validarDatosUsuario(datos, esCreacion = false) {
       // Campos requeridos
       if (!datos.nombres || datos.nombres.trim().length < 2) {
           throw new Error('Los nombres son requeridos (mínimo 2 caracteres)');
       }

       if (!datos.apellidos || datos.apellidos.trim().length < 2) {
           throw new Error('Los apellidos son requeridos (mínimo 2 caracteres)');
       }

       if (!datos.correo) {
           throw new Error('El correo electrónico es requerido');
       }

       if (!Utils.Validacion.esEmailValido(datos.correo)) {
           throw new Error('El formato del correo electrónico no es válido');
       }

       // Contraseña solo requerida en creación
       if (esCreacion) {
           if (!datos.contrasena) {
               throw new Error('La contraseña es requerida');
           }

           if (!Utils.Validacion.esPasswordValida(datos.contrasena)) {
               throw new Error('La contraseña no cumple con los requisitos de seguridad');
           }
       }

       // Validar teléfono si se proporciona
       if (datos.telefono && !Utils.Validacion.esTelefonoValido(datos.telefono)) {
           throw new Error('El formato del teléfono no es válido');
       }

       // Validar roles si se proporcionan
       if (datos.roles && Array.isArray(datos.roles)) {
           const rolesValidos = Object.values(CONFIG.ROLES.ROLES);
           const rolesInvalidos = datos.roles.filter(rol => !rolesValidos.includes(rol));
           
           if (rolesInvalidos.length > 0) {
               throw new Error(`Roles inválidos: ${rolesInvalidos.join(', ')}`);
           }
       }
   }

   /**
    * ✅ Validar archivo de avatar
    */
   validarAvatar(archivo) {
       if (!archivo) {
           throw new Error('Archivo de avatar requerido');
       }

       const tiposPermitidos = CONFIG.ARCHIVOS.TIPOS_PERMITIDOS.IMAGENES;
       const extension = Utils.Archivo.obtenerExtension(archivo.name);

       if (!tiposPermitidos.includes(extension)) {
           throw new Error(`Tipo de archivo no permitido. Formatos aceptados: ${tiposPermitidos.join(', ')}`);
       }

       const tamañoMaximo = CONFIG.ARCHIVOS.TAMAÑO_MAXIMO.IMAGEN;
       if (!Utils.Archivo.verificarTamaño(archivo, tamañoMaximo)) {
           throw new Error(`El archivo es demasiado grande. Tamaño máximo: ${tamañoMaximo}MB`);
       }
   }

   // ==========================================
   // 📊 MÉTODOS UTILITARIOS
   // ==========================================

   /**
    * 📊 Exportar datos de usuario
    */
   async exportar(usuarioId, formato = 'pdf', opciones = {}) {
       try {
           const params = {
               formato: formato,
               incluirActividad: opciones.incluirActividad || false,
               incluirEstadisticas: opciones.incluirEstadisticas || false,
               fechaDesde: opciones.fechaDesde,
               fechaHasta: opciones.fechaHasta
           };

           const url = this.baseURL + this.endpoints.EXPORTAR.replace(':id', usuarioId);

           console.log(`📊 Exportando datos de usuario en formato ${formato}...`);

           await window.api.descargarArchivo(url + '?' + new URLSearchParams(params).toString(), 
               `usuario_${usuarioId}_${Utils.Fecha.formatear(new Date(), 'YYYY-MM-DD')}.${formato}`);

           return { success: true, mensaje: 'Exportación iniciada' };

       } catch (error) {
           console.error('❌ Error al exportar datos:', error);
           throw error;
       }
   }

   /**
    * 📊 Obtener estadísticas generales
    */
   async obtenerEstadisticasGenerales() {
       try {
           const response = await window.api.get(this.baseURL + '/estadisticas/generales');

           if (response.data.success) {
               return {
                   success: true,
                   estadisticas: response.data.estadisticas
               };
           } else {
               throw new Error(response.data.message || 'Error al obtener estadísticas');
           }

       } catch (error) {
           console.error('❌ Error al obtener estadísticas generales:', error);
           throw error;
       }
   }
}

// 🚀 Crear instancia global
window.ServicioUsuarios = new ServicioUsuarios();

// 📤 Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
   module.exports = ServicioUsuarios;
}

console.log('👥 Servicio de usuarios inicializado correctamente');