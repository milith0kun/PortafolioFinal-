/**
 * 🎭 ASIGNACIÓN DE ROLES
 * Sistema Portafolio Docente UNSAAC
 * 
 * Página para gestionar la asignación de roles a usuarios
 * Incluye asignación individual, masiva y gestión de permisos
 */

class AsignacionRoles {
   constructor() {
       this.servicioUsuarios = new ServicioUsuarios();
       this.servicioRoles = new ServicioRoles();
       this.servicioNotificaciones = new ServicioNotificaciones();
       
       this.usuariosSeleccionados = [];
       this.filtros = {
           busqueda: '',
           rolActual: '',
           estado: 'activo'
       };
       
       this.inicializar();
   }

   /**
    * Inicializa la página de asignación de roles
    */
   async inicializar() {
       try {
           await this.verificarPermisos();
           await this.cargarDatos();
           this.configurarInterfaz();
           this.configurarEventos();
           
           Utilidades.mostrarNotificacion('Gestión de roles cargada', 'success');
       } catch (error) {
           console.error('Error al inicializar asignación de roles:', error);
           Utilidades.mostrarNotificacion('Error al cargar la página', 'error');
       }
   }

   /**
    * Verifica permisos de administrador
    */
   async verificarPermisos() {
       const usuario = SistemaAutenticacion.obtenerUsuario();
       if (!usuario || !usuario.rolesActivos.includes('administrador')) {
           window.location.href = '/acceso-denegado.html';
           throw new Error('Sin permisos de administrador');
       }
   }

   /**
    * Carga datos iniciales
    */
   async cargarDatos() {
       try {
           Utilidades.mostrarCargando('#contenedor-principal');
           
           const [usuarios, estadisticasRoles, rolesDisponibles] = await Promise.all([
               this.servicioUsuarios.obtenerTodos(),
               this.servicioRoles.obtenerEstadisticas(),
               this.servicioRoles.obtenerRolesDisponibles()
           ]);
           
           this.usuarios = usuarios;
           this.estadisticasRoles = estadisticasRoles;
           this.rolesDisponibles = rolesDisponibles;
           
       } catch (error) {
           console.error('Error al cargar datos:', error);
           throw error;
       } finally {
           Utilidades.ocultarCargando('#contenedor-principal');
       }
   }

   /**
    * Configura la interfaz inicial
    */
   configurarInterfaz() {
       this.mostrarEstadisticasRoles();
       this.mostrarTablaUsuarios();
       this.configurarFiltros();
       this.configurarPanelAsignacion();
       this.mostrarHistorialAsignaciones();
   }

   /**
    * Muestra estadísticas de roles
    */
   mostrarEstadisticasRoles() {
       const stats = this.estadisticasRoles;
       
       const tarjetas = [
           {
               titulo: 'Total Administradores',
               valor: stats.administradores || 0,
               icono: 'fas fa-user-shield',
               color: 'danger',
               descripcion: 'Usuarios con rol admin'
           },
           {
               titulo: 'Total Verificadores',
               valor: stats.verificadores || 0,
               icono: 'fas fa-user-check',
               color: 'warning',
               descripcion: 'Usuarios verificadores'
           },
           {
               titulo: 'Total Docentes',
               valor: stats.docentes || 0,
               icono: 'fas fa-chalkboard-teacher',
               color: 'info',
               descripcion: 'Usuarios docentes'
           },
           {
               titulo: 'Multi-Rol',
               valor: stats.multiRol || 0,
               icono: 'fas fa-users-cog',
               color: 'success',
               descripcion: 'Usuarios con múltiples roles'
           }
       ];
       
       const contenedor = document.getElementById('estadisticas-roles');
       contenedor.innerHTML = tarjetas.map(tarjeta => `
           <div class="col-xl-3 col-md-6 mb-4">
               <div class="card border-left-${tarjeta.color} shadow h-100 py-2">
                   <div class="card-body">
                       <div class="row no-gutters align-items-center">
                           <div class="col mr-2">
                               <div class="text-xs font-weight-bold text-${tarjeta.color} text-uppercase mb-1">
                                   ${tarjeta.titulo}
                               </div>
                               <div class="h5 mb-0 font-weight-bold text-gray-800">
                                   ${tarjeta.valor}
                               </div>
                               <div class="text-xs text-muted">
                                   ${tarjeta.descripcion}
                               </div>
                           </div>
                           <div class="col-auto">
                               <i class="${tarjeta.icono} fa-2x text-gray-300"></i>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `).join('');
   }

   /**
    * Muestra tabla de usuarios con sus roles
    */
   mostrarTablaUsuarios() {
       const contenedor = document.getElementById('tabla-usuarios-roles');
       
       const usuariosFiltrados = this.filtrarUsuarios();
       
       const tablaHtml = `
           <div class="card shadow">
               <div class="card-header py-3 d-flex justify-content-between align-items-center">
                   <h6 class="m-0 font-weight-bold text-primary">Gestión de Roles por Usuario</h6>
                   <div class="btn-group">
                       <button class="btn btn-primary btn-sm" id="btn-asignacion-masiva">
                           <i class="fas fa-users me-1"></i>
                           Asignación Masiva
                       </button>
                       <button class="btn btn-outline-primary btn-sm" id="btn-exportar-roles">
                           <i class="fas fa-download me-1"></i>
                           Exportar
                       </button>
                   </div>
               </div>
               <div class="card-body">
                   <div class="table-responsive">
                       <table class="table table-bordered" id="tablaUsuarios">
                           <thead>
                               <tr>
                                   <th>
                                       <input type="checkbox" id="seleccionar-todos">
                                   </th>
                                   <th>Usuario</th>
                                   <th>Email</th>
                                   <th>Roles Actuales</th>
                                   <th>Estado</th>
                                   <th>Último Acceso</th>
                                   <th>Acciones</th>
                               </tr>
                           </thead>
                           <tbody>
                               ${usuariosFiltrados.map(usuario => this.generarFilaUsuario(usuario)).join('')}
                           </tbody>
                       </table>
                   </div>
               </div>
           </div>
       `;
       
       contenedor.innerHTML = tablaHtml;
       
       // Inicializar DataTable si está disponible
       if (typeof $.fn.DataTable !== 'undefined') {
           $('#tablaUsuarios').DataTable({
               language: {
                   url: '/assets/js/librerias/datatables-es.json'
               },
               pageLength: 25,
               order: [[1, 'asc']]
           });
       }
   }

   /**
    * Genera una fila de usuario para la tabla
    */
   generarFilaUsuario(usuario) {
       const rolesArray = usuario.roles || [];
       const rolesHtml = rolesArray.map(rol => {
           const colorClass = {
               'administrador': 'danger',
               'verificador': 'warning',
               'docente': 'info'
           };
           return `<span class="badge badge-${colorClass[rol] || 'secondary'} me-1">${rol}</span>`;
       }).join('');
       
       const estadoClass = usuario.activo ? 'success' : 'danger';
       const estadoTexto = usuario.activo ? 'Activo' : 'Inactivo';
       
       return `
           <tr data-usuario-id="${usuario.id}">
               <td>
                   <input type="checkbox" class="checkbox-usuario" value="${usuario.id}">
               </td>
               <td>
                   <div class="d-flex align-items-center">
                       <img src="${usuario.avatar || '/assets/imagenes/avatares/default.png'}" 
                            class="avatar avatar-sm rounded-circle me-2" alt="Avatar">
                       <div>
                           <div class="font-weight-bold">${usuario.nombres} ${usuario.apellidos}</div>
                       </div>
                   </div>
               </td>
               <td>${usuario.correo}</td>
               <td>
                   ${rolesHtml || '<span class="text-muted">Sin roles</span>'}
               </td>
               <td>
                   <span class="badge badge-${estadoClass}">${estadoTexto}</span>
               </td>
               <td>
                   ${usuario.ultimoAcceso ? 
                       Utilidades.formatearTiempoRelativo(usuario.ultimoAcceso) : 
                       '<span class="text-muted">Nunca</span>'}
               </td>
               <td>
                   <div class="btn-group btn-group-sm">
                       <button class="btn btn-outline-primary btn-asignar-rol" 
                               data-usuario-id="${usuario.id}">
                           <i class="fas fa-user-plus"></i>
                       </button>
                       <button class="btn btn-outline-warning btn-gestionar-roles" 
                               data-usuario-id="${usuario.id}">
                           <i class="fas fa-cog"></i>
                       </button>
                       <button class="btn btn-outline-info btn-historial" 
                               data-usuario-id="${usuario.id}">
                           <i class="fas fa-history"></i>
                       </button>
                   </div>
               </td>
           </tr>
       `;
   }

   /**
    * Filtra usuarios según los criterios seleccionados
    */
   filtrarUsuarios() {
       return this.usuarios.filter(usuario => {
           // Filtro por búsqueda
           if (this.filtros.busqueda) {
               const busqueda = this.filtros.busqueda.toLowerCase();
               const nombre = `${usuario.nombres} ${usuario.apellidos}`.toLowerCase();
               const email = usuario.correo.toLowerCase();
               if (!nombre.includes(busqueda) && !email.includes(busqueda)) {
                   return false;
               }
           }
           
           // Filtro por rol actual
           if (this.filtros.rolActual) {
               if (!usuario.roles || !usuario.roles.includes(this.filtros.rolActual)) {
                   return false;
               }
           }
           
           // Filtro por estado
           if (this.filtros.estado === 'activo' && !usuario.activo) return false;
           if (this.filtros.estado === 'inactivo' && usuario.activo) return false;
           
           return true;
       });
   }

   /**
    * Configura filtros de búsqueda
    */
   configurarFiltros() {
       const filtrosHtml = `
           <div class="card mb-4">
               <div class="card-body">
                   <div class="row">
                       <div class="col-md-4">
                           <label class="form-label">Buscar Usuario</label>
                           <input type="text" class="form-control" id="filtro-busqueda" 
                                  placeholder="Nombre o email...">
                       </div>
                       <div class="col-md-3">
                           <label class="form-label">Filtrar por Rol</label>
                           <select class="form-select" id="filtro-rol">
                               <option value="">Todos los roles</option>
                               <option value="administrador">Administrador</option>
                               <option value="verificador">Verificador</option>
                               <option value="docente">Docente</option>
                           </select>
                       </div>
                       <div class="col-md-3">
                           <label class="form-label">Estado</label>
                           <select class="form-select" id="filtro-estado">
                               <option value="">Todos</option>
                               <option value="activo" selected>Activos</option>
                               <option value="inactivo">Inactivos</option>
                           </select>
                       </div>
                       <div class="col-md-2">
                           <label class="form-label">&nbsp;</label>
                           <div class="d-grid">
                               <button class="btn btn-outline-secondary" id="btn-limpiar-filtros">
                                   <i class="fas fa-times me-1"></i>
                                   Limpiar
                               </button>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('filtros-usuarios').innerHTML = filtrosHtml;
   }

   /**
    * Configura panel de asignación rápida
    */
   configurarPanelAsignacion() {
       const panelHtml = `
           <div class="card">
               <div class="card-header">
                   <h6 class="m-0">Asignación Rápida de Roles</h6>
               </div>
               <div class="card-body">
                   <div class="mb-3">
                       <label class="form-label">Seleccionar Rol</label>
                       <select class="form-select" id="rol-asignacion-rapida">
                           <option value="">Selecciona un rol...</option>
                           <option value="docente">Docente</option>
                           <option value="verificador">Verificador</option>
                           <option value="administrador">Administrador</option>
                       </select>
                   </div>
                   <div class="mb-3">
                       <label class="form-label">Usuarios Seleccionados</label>
                       <div id="usuarios-seleccionados-display" class="form-control" 
                            style="min-height: 100px; max-height: 150px; overflow-y: auto;">
                           <span class="text-muted">Selecciona usuarios de la tabla</span>
                       </div>
                   </div>
                   <div class="d-grid gap-2">
                       <button class="btn btn-primary" id="btn-asignar-seleccionados" disabled>
                           <i class="fas fa-user-plus me-1"></i>
                           Asignar Rol a Seleccionados
                       </button>
                       <button class="btn btn-outline-danger" id="btn-revocar-seleccionados" disabled>
                           <i class="fas fa-user-minus me-1"></i>
                           Revocar Rol de Seleccionados
                       </button>
                   </div>
               </div>
           </div>
       `;
       
       document.getElementById('panel-asignacion').innerHTML = panelHtml;
   }

   /**
    * Configura eventos de la interfaz
    */
   configurarEventos() {
       // Filtros
       document.getElementById('filtro-busqueda').addEventListener('input', (e) => {
           this.filtros.busqueda = e.target.value;
           this.aplicarFiltros();
       });
       
       document.getElementById('filtro-rol').addEventListener('change', (e) => {
           this.filtros.rolActual = e.target.value;
           this.aplicarFiltros();
       });
       
       document.getElementById('filtro-estado').addEventListener('change', (e) => {
           this.filtros.estado = e.target.value;
           this.aplicarFiltros();
       });
       
       document.getElementById('btn-limpiar-filtros').addEventListener('click', () => {
           this.limpiarFiltros();
       });
       
       // Selección de usuarios
       document.getElementById('seleccionar-todos').addEventListener('change', (e) => {
           this.seleccionarTodosUsuarios(e.target.checked);
       });
       
       document.addEventListener('change', (e) => {
           if (e.target.classList.contains('checkbox-usuario')) {
               this.actualizarSeleccionUsuarios();
           }
       });
       
       // Botones de acción
       document.addEventListener('click', (e) => {
           if (e.target.closest('.btn-asignar-rol')) {
               const usuarioId = e.target.closest('.btn-asignar-rol').dataset.usuarioId;
               this.mostrarModalAsignarRol(usuarioId);
           }
           
           if (e.target.closest('.btn-gestionar-roles')) {
               const usuarioId = e.target.closest('.btn-gestionar-roles').dataset.usuarioId;
               this.mostrarModalGestionarRoles(usuarioId);
           }
           
           if (e.target.closest('.btn-historial')) {
               const usuarioId = e.target.closest('.btn-historial').dataset.usuarioId;
               this.mostrarHistorialUsuario(usuarioId);
           }
       });
       
       // Asignación masiva
       document.getElementById('btn-asignacion-masiva').addEventListener('click', () => {
           this.mostrarModalAsignacionMasiva();
       });
       
       // Asignación rápida
       document.getElementById('btn-asignar-seleccionados').addEventListener('click', () => {
           this.asignarRolSeleccionados();
       });
       
       document.getElementById('btn-revocar-seleccionados').addEventListener('click', () => {
           this.revocarRolSeleccionados();
       });
   }

   /**
    * Aplica filtros y actualiza la tabla
    */
   aplicarFiltros() {
       this.mostrarTablaUsuarios();
   }

   /**
    * Limpia todos los filtros
    */
   limpiarFiltros() {
       this.filtros = {
           busqueda: '',
           rolActual: '',
           estado: 'activo'
       };
       
       document.getElementById('filtro-busqueda').value = '';
       document.getElementById('filtro-rol').value = '';
       document.getElementById('filtro-estado').value = 'activo';
       
       this.aplicarFiltros();
   }

   /**
    * Selecciona/deselecciona todos los usuarios
    */
   seleccionarTodosUsuarios(seleccionar) {
       const checkboxes = document.querySelectorAll('.checkbox-usuario');
       checkboxes.forEach(checkbox => {
           checkbox.checked = seleccionar;
       });
       this.actualizarSeleccionUsuarios();
   }

   /**
    * Actualiza la lista de usuarios seleccionados
    */
   actualizarSeleccionUsuarios() {
       const checkboxes = document.querySelectorAll('.checkbox-usuario:checked');
       this.usuariosSeleccionados = Array.from(checkboxes).map(cb => cb.value);
       
       // Actualizar display
       const display = document.getElementById('usuarios-seleccionados-display');
       
       if (this.usuariosSeleccionados.length === 0) {
           display.innerHTML = '<span class="text-muted">Selecciona usuarios de la tabla</span>';
       } else {
           const usuariosTexto = this.usuariosSeleccionados.map(id => {
               const usuario = this.usuarios.find(u => u.id == id);
               return usuario ? `${usuario.nombres} ${usuario.apellidos}` : `Usuario ${id}`;
           }).join(', ');
           
           display.innerHTML = `<strong>${this.usuariosSeleccionados.length} usuario(s) seleccionado(s):</strong><br>${usuariosTexto}`;
       }
       
       // Habilitar/deshabilitar botones
       const tieneSeleccion = this.usuariosSeleccionados.length > 0;
       document.getElementById('btn-asignar-seleccionados').disabled = !tieneSeleccion;
       document.getElementById('btn-revocar-seleccionados').disabled = !tieneSeleccion;
   }

   /**
    * Muestra modal para asignar rol individual
    */
   async mostrarModalAsignarRol(usuarioId) {
       const usuario = this.usuarios.find(u => u.id == usuarioId);
       if (!usuario) return;
       
       const modal = new SistemaModales();
       await modal.mostrarFormulario('Asignar Rol', {
           usuario: { 
               type: 'text', 
               label: 'Usuario', 
               value: `${usuario.nombres} ${usuario.apellidos}`,
               disabled: true 
           },
           rol: { 
               type: 'select', 
               label: 'Rol a Asignar', 
               options: this.rolesDisponibles,
               required: true 
           },
           observaciones: { 
               type: 'textarea', 
               label: 'Observaciones (opcional)', 
               rows: 3 
           }
       }, async (datos) => {
           await this.asignarRolUsuario(usuarioId, datos.rol, datos.observaciones);
       });
   }

   /**
    * Asigna un rol a un usuario específico
    */
   async asignarRolUsuario(usuarioId, rol, observaciones = '') {
       try {
           const resultado = await this.servicioRoles.asignar({
               usuarioId: usuarioId,
               rol: rol,
               observaciones: observaciones
           });
           
           if (resultado.exito) {
               Utilidades.mostrarNotificacion('Rol asignado exitosamente', 'success');
               await this.cargarDatos();
               this.mostrarTablaUsuarios();
           } else {
               throw new Error(resultado.mensaje || 'Error al asignar rol');
           }
       } catch (error) {
           console.error('Error al asignar rol:', error);
           Utilidades.mostrarNotificacion('Error al asignar rol: ' + error.message, 'error');
       }
   }

   /**
    * Asigna rol a usuarios seleccionados
    */
   async asignarRolSeleccionados() {
       const rol = document.getElementById('rol-asignacion-rapida').value;
       if (!rol) {
           Utilidades.mostrarNotificacion('Selecciona un rol primero', 'warning');
           return;
       }
       
       if (this.usuariosSeleccionados.length === 0) {
           Utilidades.mostrarNotificacion('Selecciona al menos un usuario', 'warning');
           return;
       }
       
       try {
           const resultado = await this.servicioRoles.asignarMasivo({
               usuariosIds: this.usuariosSeleccionados,
               rol: rol
           });
           
           if (resultado.exito) {
               Utilidades.mostrarNotificacion(
                   `Rol "${rol}" asignado a ${this.usuariosSeleccionados.length} usuarios`, 
                   'success'
               );
               await this.cargarDatos();
               this.mostrarTablaUsuarios();
               this.limpiarSeleccion();
           }
       } catch (error) {
           console.error('Error en asignación masiva:', error);
           Utilidades.mostrarNotificacion('Error en asignación masiva', 'error');
       }
   }

   /**
    * Limpia la selección actual
    */
   limpiarSeleccion() {
       this.usuariosSeleccionados = [];
       document.getElementById('seleccionar-todos').checked = false;
       document.querySelectorAll('.checkbox-usuario').forEach(cb => cb.checked = false);
       this.actualizarSeleccionUsuarios();
   }

   /**
    * Muestra historial de asignaciones
    */
   mostrarHistorialAsignaciones() {
       // Esta función mostraría el historial de todas las asignaciones de roles
       // Por ahora mostrar un placeholder
       const contenedor = document.getElementById('historial-asignaciones');
       if (contenedor) {
           contenedor.innerHTML = `
               <div class="card">
                   <div class="card-header">
                       <h6 class="m-0">Historial de Asignaciones Recientes</h6>
                   </div>
                   <div class="card-body">
                       <p class="text-muted">Cargando historial...</p>
                   </div>
               </div>
           `;
       }
   }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
   window.asignacionRoles = new AsignacionRoles();
});

// Exportar para uso global
window.AsignacionRoles = AsignacionRoles; 