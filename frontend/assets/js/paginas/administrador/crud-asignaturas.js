/**
 * 👥 CRUD USUARIOS - ADMINISTRADOR
 * Sistema Portafolio Docente UNSAAC
 * 
 * Gestión completa de usuarios del sistema
 * Incluye CRUD, asignación de roles, importación masiva y reportes
 */

class CRUDUsuarios {
   constructor() {
       this.servicioUsuarios = new ServicioUsuarios();
       this.servicioRoles = new ServicioRoles();
       this.validadorFormularios = new ValidadorFormularios();
       this.sistemaModales = new SistemaModales();
       
       // Estado del componente
       this.estado = {
           usuarios: [],
           usuarioActual: null,
           filtros: {
               busqueda: '',
               rol: '',
               estado: '',
               ciclo: ''
           },
           paginacion: {
               pagina: 1,
               porPagina: 20,
               total: 0
           },
           ordenamiento: {
               campo: 'nombres',
               direccion: 'asc'
           },
           seleccionados: new Set(),
           modoEdicion: false
       };
       
       // Referencias DOM
       this.elementos = {
           tabla: null,
           formulario: null,
           filtros: null,
           paginacion: null,
           buscador: null,
           botonNuevo: null
       };
       
       this.init();
   }

   /**
    * 🚀 Inicialización del componente
    */
   async init() {
       try {
           // Verificar permisos de administrador
           if (!SistemaAutenticacion.verificarPermiso('administrador')) {
               window.location.href = '/paginas/errores/403.html';
               return;
           }

           await this.inicializarInterfaz();
           await this.cargarDatosIniciales();
           this.configurarEventos();
           this.configurarValidaciones();
           
           Utilidades.mostrarNotificacion('Gestión de usuarios cargada', 'success');
       } catch (error) {
           console.error('Error inicializando CRUD usuarios:', error);
           Utilidades.mostrarNotificacion('Error cargando la gestión de usuarios', 'error');
       }
   }

   /**
    * 🎨 Inicializar interfaz de usuario
    */
   async inicializarInterfaz() {
       await this.renderizarInterfaz();
       this.configurarElementosDOM();
       this.actualizarBreadcrumb();
   }

   /**
    * 🎨 Renderizar interfaz completa
    */
   async renderizarInterfaz() {
       const container = document.querySelector('#usuarios-content');
       if (!container) return;

       container.innerHTML = `
           <div class="row g-4">
               <!-- Header y filtros -->
               <div class="col-12">
                   ${this.renderizarHeader()}
               </div>
               
               <!-- Filtros avanzados -->
               <div class="col-12">
                   ${this.renderizarFiltros()}
               </div>
               
               <!-- Tabla de usuarios -->
               <div class="col-12">
                   <div class="card">
                       <div class="card-header d-flex justify-content-between align-items-center">
                           <div>
                               <h5 class="card-title mb-0">
                                   <i class="fas fa-users me-2"></i>Lista de Usuarios
                                   <span id="contador-usuarios" class="badge bg-primary ms-2">0</span>
                               </h5>
                           </div>
                           <div class="btn-group">
                               <button type="button" class="btn btn-success btn-sm" onclick="crudUsuarios.nuevoUsuario()">
                                   <i class="fas fa-plus me-1"></i>Nuevo Usuario
                               </button>
                               <button type="button" class="btn btn-info btn-sm" onclick="crudUsuarios.importarExcel()">
                                   <i class="fas fa-file-excel me-1"></i>Importar Excel
                               </button>
                               <button type="button" class="btn btn-outline-primary btn-sm" onclick="crudUsuarios.exportarUsuarios()">
                                   <i class="fas fa-download me-1"></i>Exportar
                               </button>
                           </div>
                       </div>
                       <div class="card-body p-0">
                           ${this.renderizarTablaUsuarios()}
                       </div>
                       <div class="card-footer">
                           ${this.renderizarPaginacion()}
                       </div>
                   </div>
               </div>
           </div>
           
           <!-- Modales -->
           ${this.renderizarModales()}
       `;
   }

   /**
    * 📋 Renderizar header principal
    */
   renderizarHeader() {
       return `
           <div class="card bg-light">
               <div class="card-body">
                   <div class="row align-items-center">
                       <div class="col-md-6">
                           <h4 class="card-title mb-1">
                               <i class="fas fa-users-cog me-2"></i>Gestión de Usuarios
                           </h4>
                           <p class="card-text text-muted mb-0">
                               Administrar usuarios, roles y permisos del sistema
                           </p>
                       </div>
                       <div class="col-md-6">
                           <div class="row text-center">
                               <div class="col-4">
                                   <div class="stat-item">
                                       <h5 id="stat-total" class="text-primary mb-0">0</h5>
                                       <small class="text-muted">Total</small>
                                   </div>
                               </div>
                               <div class="col-4">
                                   <div class="stat-item">
                                       <h5 id="stat-activos" class="text-success mb-0">0</h5>
                                       <small class="text-muted">Activos</small>
                                   </div>
                               </div>
                               <div class="col-4">
                                   <div class="stat-item">
                                       <h5 id="stat-inactivos" class="text-danger mb-0">0</h5>
                                       <small class="text-muted">Inactivos</small>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 🔍 Renderizar filtros de búsqueda
    */
   renderizarFiltros() {
       return `
           <div class="card">
               <div class="card-body">
                   <div class="row g-3">
                       <div class="col-md-4">
                           <label class="form-label">Búsqueda</label>
                           <div class="input-group">
                               <span class="input-group-text">
                                   <i class="fas fa-search"></i>
                               </span>
                               <input type="text" class="form-control" id="input-busqueda" 
                                      placeholder="Buscar por nombre, email, DNI...">
                               <button class="btn btn-outline-secondary" type="button" onclick="crudUsuarios.limpiarBusqueda()">
                                   <i class="fas fa-times"></i>
                               </button>
                           </div>
                       </div>
                       
                       <div class="col-md-2">
                           <label class="form-label">Rol</label>
                           <select class="form-select" id="filtro-rol">
                               <option value="">Todos los roles</option>
                               <option value="administrador">Administrador</option>
                               <option value="verificador">Verificador</option>
                               <option value="docente">Docente</option>
                           </select>
                       </div>
                       
                       <div class="col-md-2">
                           <label class="form-label">Estado</label>
                           <select class="form-select" id="filtro-estado">
                               <option value="">Todos</option>
                               <option value="1">Activos</option>
                               <option value="0">Inactivos</option>
                           </select>
                       </div>
                       
                       <div class="col-md-2">
                           <label class="form-label">Ciclo</label>
                           <select class="form-select" id="filtro-ciclo">
                               <option value="">Todos los ciclos</option>
                               <!-- Se llenarán dinámicamente -->
                           </select>
                       </div>
                       
                       <div class="col-md-2">
                           <label class="form-label">&nbsp;</label>
                           <div class="d-grid">
                               <button type="button" class="btn btn-primary" onclick="crudUsuarios.aplicarFiltros()">
                                   <i class="fas fa-filter me-1"></i>Filtrar
                               </button>
                           </div>
                       </div>
                   </div>
                   
                   <!-- Acciones masivas -->
                   <div id="acciones-masivas" class="mt-3 d-none">
                       <div class="alert alert-info d-flex align-items-center justify-content-between">
                           <div>
                               <i class="fas fa-info-circle me-2"></i>
                               <span id="seleccionados-count">0</span> usuario(s) seleccionado(s)
                           </div>
                           <div class="btn-group">
                               <button type="button" class="btn btn-sm btn-success" onclick="crudUsuarios.activarSeleccionados()">
                                   <i class="fas fa-check me-1"></i>Activar
                               </button>
                               <button type="button" class="btn btn-sm btn-warning" onclick="crudUsuarios.desactivarSeleccionados()">
                                   <i class="fas fa-pause me-1"></i>Desactivar
                               </button>
                               <button type="button" class="btn btn-sm btn-info" onclick="crudUsuarios.asignarRolMasivo()">
                                   <i class="fas fa-user-tag me-1"></i>Asignar Rol
                               </button>
                               <button type="button" class="btn btn-sm btn-danger" onclick="crudUsuarios.eliminarSeleccionados()">
                                   <i class="fas fa-trash me-1"></i>Eliminar
                               </button>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 📊 Renderizar tabla de usuarios
    */
   renderizarTablaUsuarios() {
       return `
           <div class="table-responsive">
               <table class="table table-hover mb-0" id="tabla-usuarios">
                   <thead class="table-light">
                       <tr>
                           <th width="40">
                               <div class="form-check">
                                   <input class="form-check-input" type="checkbox" id="check-todos" 
                                          onchange="crudUsuarios.toggleSeleccionTodos()">
                               </div>
                           </th>
                           <th width="50">Avatar</th>
                           <th class="sortable" onclick="crudUsuarios.ordenarPor('nombres')">
                               Nombre Completo
                               <i class="fas fa-sort ms-1"></i>
                           </th>
                           <th class="sortable" onclick="crudUsuarios.ordenarPor('correo')">
                               Email
                               <i class="fas fa-sort ms-1"></i>
                           </th>
                           <th>Roles</th>
                           <th class="sortable" onclick="crudUsuarios.ordenarPor('ultimo_acceso')">
                               Último Acceso
                               <i class="fas fa-sort ms-1"></i>
                           </th>
                           <th>Estado</th>
                           <th width="150">Acciones</th>
                       </tr>
                   </thead>
                   <tbody id="tbody-usuarios">
                       <tr>
                           <td colspan="8" class="text-center py-4">
                               <div class="spinner-border text-primary" role="status">
                                   <span class="visually-hidden">Cargando...</span>
                               </div>
                               <p class="mt-2 text-muted">Cargando usuarios...</p>
                           </td>
                       </tr>
                   </tbody>
               </table>
           </div>
       `;
   }

   /**
    * 📄 Renderizar item de usuario en tabla
    */
   renderizarItemUsuario(usuario) {
       const rolesUsuario = usuario.roles || [];
       const estadoClass = usuario.activo ? 'success' : 'danger';
       const estadoTexto = usuario.activo ? 'Activo' : 'Inactivo';
       const ultimoAcceso = usuario.ultimo_acceso ? 
           Utilidades.formatearFechaRelativa(usuario.ultimo_acceso) : 'Nunca';

       return `
           <tr data-usuario-id="${usuario.id}" class="${!usuario.activo ? 'table-warning' : ''}">
               <td>
                   <div class="form-check">
                       <input class="form-check-input checkbox-usuario" type="checkbox" 
                              value="${usuario.id}" onchange="crudUsuarios.toggleSeleccion()">
                   </div>
               </td>
               <td>
                   <div class="avatar-sm">
                       ${usuario.avatar ? 
                           `<img src="${usuario.avatar}" class="rounded-circle" width="32" height="32" alt="Avatar">` :
                           `<div class="bg-primary rounded-circle d-flex align-items-center justify-content-center text-white" style="width: 32px; height: 32px;">
                               ${usuario.nombres.charAt(0)}${usuario.apellidos.charAt(0)}
                            </div>`
                       }
                   </div>
               </td>
               <td>
                   <div>
                       <h6 class="mb-0">${usuario.nombres} ${usuario.apellidos}</h6>
                       <small class="text-muted">${usuario.dni || 'Sin DNI'}</small>
                   </div>
               </td>
               <td>
                   <span class="text-break">${usuario.correo}</span>
                   ${usuario.telefono ? `<br><small class="text-muted">${usuario.telefono}</small>` : ''}
               </td>
               <td>
                   <div class="d-flex flex-wrap gap-1">
                       ${rolesUsuario.map(rol => `
                           <span class="badge bg-${this.obtenerColorRol(rol.rol)} badge-rol">
                               ${this.obtenerNombreRol(rol.rol)}
                           </span>
                       `).join('')}
                       ${rolesUsuario.length === 0 ? '<span class="text-muted">Sin roles</span>' : ''}
                   </div>
               </td>
               <td>
                   <small class="text-muted">${ultimoAcceso}</small>
               </td>
               <td>
                   <span class="badge bg-${estadoClass}">${estadoTexto}</span>
               </td>
               <td>
                   <div class="btn-group btn-group-sm">
                       <button type="button" class="btn btn-outline-primary" 
                               onclick="crudUsuarios.verUsuario(${usuario.id})" 
                               title="Ver detalles">
                           <i class="fas fa-eye"></i>
                       </button>
                       <button type="button" class="btn btn-outline-success" 
                               onclick="crudUsuarios.editarUsuario(${usuario.id})" 
                               title="Editar">
                           <i class="fas fa-edit"></i>
                       </button>
                       <button type="button" class="btn btn-outline-info" 
                               onclick="crudUsuarios.gestionarRoles(${usuario.id})" 
                               title="Gestionar roles">
                           <i class="fas fa-user-tag"></i>
                       </button>
                       <button type="button" class="btn btn-outline-${usuario.activo ? 'warning' : 'success'}" 
                               onclick="crudUsuarios.toggleEstado(${usuario.id})" 
                               title="${usuario.activo ? 'Desactivar' : 'Activar'}">
                           <i class="fas fa-${usuario.activo ? 'pause' : 'play'}"></i>
                       </button>
                       <button type="button" class="btn btn-outline-danger" 
                               onclick="crudUsuarios.eliminarUsuario(${usuario.id})" 
                               title="Eliminar">
                           <i class="fas fa-trash"></i>
                       </button>
                   </div>
               </td>
           </tr>
       `;
   }

   /**
    * 📄 Renderizar paginación
    */
   renderizarPaginacion() {
       const { pagina, porPagina, total } = this.estado.paginacion;
       const totalPaginas = Math.ceil(total / porPagina);
       const inicio = ((pagina - 1) * porPagina) + 1;
       const fin = Math.min(pagina * porPagina, total);

       if (totalPaginas <= 1) {
           return `
               <div class="d-flex justify-content-between align-items-center">
                   <small class="text-muted">
                       Mostrando ${total} usuario(s)
                   </small>
               </div>
           `;
       }

       return `
           <div class="d-flex justify-content-between align-items-center">
               <small class="text-muted">
                   Mostrando ${inicio}-${fin} de ${total} usuario(s)
               </small>
               <nav>
                   <ul class="pagination pagination-sm mb-0">
                       <li class="page-item ${pagina === 1 ? 'disabled' : ''}">
                           <button class="page-link" onclick="crudUsuarios.irAPagina(${pagina - 1})">
                               <i class="fas fa-chevron-left"></i>
                           </button>
                       </li>
                       ${this.generarBotonesPaginacion(pagina, totalPaginas)}
                       <li class="page-item ${pagina === totalPaginas ? 'disabled' : ''}">
                           <button class="page-link" onclick="crudUsuarios.irAPagina(${pagina + 1})">
                               <i class="fas fa-chevron-right"></i>
                           </button>
                       </li>
                   </ul>
               </nav>
           </div>
       `;
   }

   /**
    * 🔘 Generar botones de paginación
    */
   generarBotonesPaginacion(paginaActual, totalPaginas) {
       let botones = '';
       const rango = 2; // Mostrar 2 páginas antes y después de la actual
       
       let inicio = Math.max(1, paginaActual - rango);
       let fin = Math.min(totalPaginas, paginaActual + rango);
       
       // Mostrar primera página si no está en el rango
       if (inicio > 1) {
           botones += `<li class="page-item"><button class="page-link" onclick="crudUsuarios.irAPagina(1)">1</button></li>`;
           if (inicio > 2) {
               botones += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
           }
       }
       
       // Páginas en el rango
       for (let i = inicio; i <= fin; i++) {
           botones += `
               <li class="page-item ${i === paginaActual ? 'active' : ''}">
                   <button class="page-link" onclick="crudUsuarios.irAPagina(${i})">${i}</button>
               </li>
           `;
       }
       
       // Mostrar última página si no está en el rango
       if (fin < totalPaginas) {
           if (fin < totalPaginas - 1) {
               botones += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
           }
           botones += `<li class="page-item"><button class="page-link" onclick="crudUsuarios.irAPagina(${totalPaginas})">${totalPaginas}</button></li>`;
       }
       
       return botones;
   }

   /**
    * 🎭 Renderizar modales del sistema
    */
   renderizarModales() {
       return `
           <!-- Modal Usuario -->
           <div class="modal fade" id="modal-usuario" tabindex="-1">
               <div class="modal-dialog modal-lg">
                   <div class="modal-content">
                       <div class="modal-header">
                           <h5 class="modal-title">
                               <i class="fas fa-user me-2"></i>
                               <span id="modal-usuario-titulo">Usuario</span>
                           </h5>
                           <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                       </div>
                       <div class="modal-body">
                           ${this.renderizarFormularioUsuario()}
                       </div>
                       <div class="modal-footer">
                           <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                           <button type="button" class="btn btn-primary" onclick="crudUsuarios.guardarUsuario()">
                               <i class="fas fa-save me-1"></i>Guardar
                           </button>
                       </div>
                   </div>
               </div>
           </div>
           
           <!-- Modal Roles -->
           <div class="modal fade" id="modal-roles" tabindex="-1">
               <div class="modal-dialog">
                   <div class="modal-content">
                       <div class="modal-header">
                           <h5 class="modal-title">
                               <i class="fas fa-user-tag me-2"></i>Gestionar Roles
                           </h5>
                           <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                       </div>
                       <div class="modal-body">
                           <div id="contenido-roles">
                               <!-- Se llenará dinámicamente -->
                           </div>
                       </div>
                       <div class="modal-footer">
                           <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                           <button type="button" class="btn btn-primary" onclick="crudUsuarios.guardarRoles()">
                               <i class="fas fa-save me-1"></i>Guardar Cambios
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   /**
    * 📝 Renderizar formulario de usuario
    */
   renderizarFormularioUsuario() {
       return `
           <form id="form-usuario" novalidate>
               <input type="hidden" id="usuario-id" name="id">
               
               <div class="row g-3">
                   <div class="col-md-6">
                       <label class="form-label">Nombres *</label>
                       <input type="text" class="form-control" id="usuario-nombres" name="nombres" required>
                       <div class="invalid-feedback"></div>
                   </div>
                   
                   <div class="col-md-6">
                       <label class="form-label">Apellidos *</label>
                       <input type="text" class="form-control" id="usuario-apellidos" name="apellidos" required>
                       <div class="invalid-feedback"></div>
                   </div>
                   
                   <div class="col-md-6">
                       <label class="form-label">Email *</label>
                       <input type="email" class="form-control" id="usuario-correo" name="correo" required>
                       <div class="invalid-feedback"></div>
                   </div>
                   
                   <div class="col-md-6">
                       <label class="form-label">DNI</label>
                       <input type="text" class="form-control" id="usuario-dni" name="dni">
                       <div class="invalid-feedback"></div>
                   </div>
                   
                   <div class="col-md-6">
                       <label class="form-label">Teléfono</label>
                       <input type="tel" class="form-control" id="usuario-telefono" name="telefono">
                       <div class="invalid-feedback"></div>
                   </div>
                   
                   <div class="col-md-6">
                       <label class="form-label">Estado</label>
                       <select class="form-select" id="usuario-activo" name="activo">
                           <option value="1">Activo</option>
                           <option value="0">Inactivo</option>
                       </select>
                   </div>
                   
                   <div class="col-12" id="campo-contrasena">
                       <label class="form-label">Contraseña *</label>
                       <div class="input-group">
                           <input type="password" class="form-control" id="usuario-contrasena" name="contrasena">
                           <button class="btn btn-outline-secondary" type="button" onclick="crudUsuarios.toggleContrasena()">
                               <i class="fas fa-eye"></i>
                           </button>
                       </div>
                       <div class="form-text">
                           Mínimo 8 caracteres, debe incluir mayúsculas, minúsculas y números
                       </div>
                       <div class="invalid-feedback"></div>
                   </div>
                   
                   <div class="col-12">
                       <label class="form-label">Roles Iniciales</label>
                       <div id="roles-iniciales">
                           <div class="form-check">
                               <input class="form-check-input" type="checkbox" value="docente" id="rol-docente">
                               <label class="form-check-label" for="rol-docente">Docente</label>
                           </div>
                           <div class="form-check">
                               <input class="form-check-input" type="checkbox" value="verificador" id="rol-verificador">
                               <label class="form-check-label" for="rol-verificador">Verificador</label>
                           </div>
                           <div class="form-check">
                               <input class="form-check-input" type="checkbox" value="administrador" id="rol-administrador">
                               <label class="form-check-label" for="rol-administrador">Administrador</label>
                           </div>
                       </div>
                       <div class="form-text">
                           Puedes modificar los roles después de crear el usuario
                       </div>
                   </div>
               </div>
           </form>
       `;
   }

   // =====================================
   // MÉTODOS DE CARGA DE DATOS
   // =====================================

   /**
    * 📊 Cargar datos iniciales
    */
   async cargarDatosIniciales() {
       await Promise.all([
           this.cargarUsuarios(),
           this.cargarEstadisticas(),
           this.cargarCiclosParaFiltro()
       ]);
   }

   /**
    * 👥 Cargar lista de usuarios
    */
   async cargarUsuarios() {
       try {
           const parametros = {
               pagina: this.estado.paginacion.pagina,
               limite: this.estado.paginacion.porPagina,
               orden: `${this.estado.ordenamiento.campo}_${this.estado.ordenamiento.direccion}`,
               ...this.estado.filtros
           };

           const response = await this.servicioUsuarios.listar(parametros);
           
           this.estado.usuarios = response.data.usuarios;
           this.estado.paginacion.total = response.data.total;
           
           this.renderizarTablaConDatos();
           this.actualizarEstadisticas();
           
       } catch (error) {
           console.error('Error cargando usuarios:', error);
           this.mostrarErrorCarga();
       }
   }

   /**
    * 📈 Cargar estadísticas de usuarios
    */
   async cargarEstadisticas() {
       try {
           const response = await this.servicioUsuarios.obtenerEstadisticas();
           this.actualizarEstadisticasEnHeader(response.data);
       } catch (error) {
           console.warn('Error cargando estadísticas:', error);
       }
   }

   /**
    * 📅 Cargar ciclos para filtro
    */
   async cargarCiclosParaFiltro() {
       try {
           const response = await ClienteAPI.get('/ciclos-academicos');
           const select = document.getElementById('filtro-ciclo');
           if (select && response.data) {
               response.data.forEach(ciclo => {
                   const option = document.createElement('option');
                   option.value = ciclo.id;
                   option.textContent = ciclo.nombre;
                   select.appendChild(option);
               });
           }
       } catch (error) {
           console.warn('Error cargando ciclos:', error);
       }
   }

   /**
    * 🎨 Renderizar tabla con datos cargados
    */
   renderizarTablaConDatos() {
       const tbody = document.getElementById('tbody-usuarios');
       if (!tbody) return;

       if (this.estado.usuarios.length === 0) {
           tbody.innerHTML = `
               <tr>
                   <td colspan="8" class="text-center py-4">
                       <i class="fas fa-user-slash fa-3x text-muted mb-3"></i>
                       <h5 class="text-muted">No se encontraron usuarios</h5>
                       <p class="text-muted">Intenta modificar los filtros de búsqueda</p>
                   </td>
               </tr>
           `;
           return;
       }

       tbody.innerHTML = this.estado.usuarios
           .map(usuario => this.renderizarItemUsuario(usuario))
           .join('');
       
       // Actualizar contador
       const contador = document.getElementById('contador-usuarios');
       if (contador) {
           contador.textContent = this.estado.paginacion.total;
       }
       
       // Actualizar paginación
       this.actualizarPaginacion();
   }

   /**
    * 📊 Actualizar estadísticas en header
    */
   actualizarEstadisticasEnHeader(estadisticas) {
       const elementos = {
           'stat-total': estadisticas.total || 0,
           'stat-activos': estadisticas.activos || 0,
           'stat-inactivos': estadisticas.inactivos || 0
       };

       Object.entries(elementos).forEach(([id, valor]) => {
           const elemento = document.getElementById(id);
           if (elemento) {
               elemento.textContent = valor;
           }
       });
   }

   // =====================================
   // MÉTODOS DE ACCIONES CRUD
   // =====================================

   /**
    * ➕ Crear nuevo usuario
    */
   nuevoUsuario() {
       this.estado.modoEdicion = false;
       this.estado.usuarioActual = null;
       
       // Limpiar formulario
       const form = document.getElementById('form-usuario');
       if (form) {
           form.reset();
           this.limpiarValidacionFormulario();
       }
       
       // Configurar modal para creación
       const titulo = document.getElementById('modal-usuario-titulo');
       if (titulo) {
           titulo.textContent = 'Nuevo Usuario';
       }
       
       // Mostrar campo de contraseña
       const campoContrasena = document.getElementById('campo-contrasena');
       if (campoContrasena) {
           campoContrasena.style.display = 'block';
           document.getElementById('usuario-contrasena').required = true;
       }
       
       // Mostrar modal
       const modal = new bootstrap.Modal(document.getElementById('modal-usuario'));
       modal.show();
   }

   /**
    * ✏️ Editar usuario existente
    */
   async editarUsuario(usuarioId) {
       try {
           this.estado.modoEdicion = true;
           
           // Cargar datos del usuario
           const response = await this.servicioUsuarios.obtenerPorId(usuarioId);
           this.estado.usuarioActual = response.data;
           
           // Llenar formulario
           this.llenarFormularioUsuario(this.estado.usuarioActual);
           
           // Configurar modal para edición
           const titulo = document.getElementById('modal-usuario-titulo');
           if (titulo) {
               titulo.textContent = 'Editar Usuario';
           }
           
           // Ocultar campo de contraseña
           const campoContrasena = document.getElementById('campo-contrasena');
           if (campoContrasena) {
               campoContrasena.style.display = 'none';
               document.getElementById('usuario-contrasena').required = false;
           }
           
           // Mostrar modal
           const modal = new bootstrap.Modal(document.getElementById('modal-usuario'));
           modal.show();
           
       } catch (error) {
           console.error('Error cargando usuario:', error);
           Utilidades.mostrarNotificacion('Error cargando los datos del usuario', 'error');
       }
   }

   /**
    * 👁️ Ver detalles del usuario
    */
   async verUsuario(usuarioId) {
       try {
           const response = await this.servicioUsuarios.obtenerPorId(usuarioId);
           const usuario = response.data;
           
           this.sistemaModales.mostrarModal({
               titulo: `Detalles: ${usuario.nombres} ${usuario.apellidos}`,
               contenido: this.renderizarDetallesUsuario(usuario),
               botones: [
                   {
                       texto: 'Editar',
                       clase: 'btn-primary',
                       accion: () => this.editarUsuario(usuarioId)
                   },
                   {
                       texto: 'Cerrar',
                       clase: 'btn-secondary'
                   }
               ]
           });
           
       } catch (error) {
           console.error('Error cargando detalles:', error);
           Utilidades.mostrarNotificacion('Error cargando los detalles', 'error');
       }
   }

   /**
    * 💾 Guardar usuario (crear o actualizar)
    */
   async guardarUsuario() {
       try {
           const form = document.getElementById('form-usuario');
           if (!form || !this.validarFormulario(form)) {
               return;
           }
           
           const formData = new FormData(form);
           const datosUsuario = Object.fromEntries(formData.entries());
           
           // Agregar roles seleccionados
           const rolesSeleccionados = Array.from(document.querySelectorAll('#roles-iniciales input:checked'))
               .map(input => input.value);
           datosUsuario.roles = rolesSeleccionados;
           
           let response;
           if (this.estado.modoEdicion) {
               response = await this.servicioUsuarios.actualizar(this.estado.usuarioActual.id, datosUsuario);
               Utilidades.mostrarNotificacion('Usuario actualizado correctamente', 'success');
           } else {
               response = await this.servicioUsuarios.crear(datosUsuario);
               Utilidades.mostrarNotificacion('Usuario creado correctamente', 'success');
           }
           
           // Cerrar modal y recargar datos
           const modal = bootstrap.Modal.getInstance(document.getElementById('modal-usuario'));
           modal.hide();
           
           await this.cargarUsuarios();
           
       } catch (error) {
           console.error('Error guardando usuario:', error);
           this.manejarErrorGuardado(error);
       }
   }

   /**
    * 🗑️ Eliminar usuario
    */
   async eliminarUsuario(usuarioId) {
       try {
           const usuario = this.estado.usuarios.find(u => u.id === usuarioId);
           if (!usuario) return;
           
           const confirmar = await Utilidades.confirmar(
               '¿Eliminar usuario?',
               `¿Estás seguro de que deseas eliminar a "${usuario.nombres} ${usuario.apellidos}"?`,
               'warning'
           );
           
           if (!confirmar) return;
           
           await this.servicioUsuarios.eliminar(usuarioId);
           Utilidades.mostrarNotificacion('Usuario eliminado correctamente', 'success');
           
           await this.cargarUsuarios();
           
       } catch (error) {
           console.error('Error eliminando usuario:', error);
           Utilidades.mostrarNotificacion('Error al eliminar el usuario', 'error');
       }
   }

   /**
    * 🔄 Toggle estado del usuario
    */
   async toggleEstado(usuarioId) {
       try {
           const usuario = this.estado.usuarios.find(u => u.id === usuarioId);
           if (!usuario) return;
           
           const nuevoEstado = !usuario.activo;
           const accion = nuevoEstado ? 'activar' : 'desactivar';
           
           const confirmar = await Utilidades.confirmar(
               `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario?`,
               `¿Estás seguro de que deseas ${accion} a "${usuario.nombres} ${usuario.apellidos}"?`,
               nuevoEstado ? 'success' : 'warning'
           );
           
           if (!confirmar) return;
           
           await this.servicioUsuarios.cambiarEstado(usuarioId, nuevoEstado);
           Utilidades.mostrarNotificacion(`Usuario ${accion}do correctamente`, 'success');
           
           await this.cargarUsuarios();
           
       } catch (error) {
           console.error('Error cambiando estado:', error);
           Utilidades.mostrarNotificacion('Error al cambiar el estado', 'error');
       }
   }

   // =====================================
   // MÉTODOS DE GESTIÓN DE ROLES
   // =====================================

   /**
    * 🎭 Gestionar roles del usuario
    */
   async gestionarRoles(usuarioId) {
       try {
           const response = await this.servicioUsuarios.obtenerPorId(usuarioId);
           const usuario = response.data;
           
           // Cargar formulario de roles
           document.getElementById('contenido-roles').innerHTML = this.renderizarFormularioRoles(usuario);
           
           // Mostrar modal
           const modal = new bootstrap.Modal(document.getElementById('modal-roles'));
           modal.show();
           
           // Guardar referencia del usuario actual
           this.estado.usuarioActual = usuario;
           
       } catch (error) {
           console.error('Error cargando roles:', error);
           Utilidades.mostrarNotificacion('Error cargando la gestión de roles', 'error');
       }
   }

   /**
    * 📝 Renderizar formulario de gestión de roles
    */
   renderizarFormularioRoles(usuario) {
       const rolesActuales = usuario.roles?.map(r => r.rol) || [];
       
       return `
           <div class="mb-3">
               <h6>Usuario: ${usuario.nombres} ${usuario.apellidos}</h6>
               <small class="text-muted">${usuario.correo}</small>
           </div>
           
           <div class="mb-3">
               <label class="form-label">Roles Disponibles</label>
               <div id="lista-roles">
                   <div class="form-check">
                       <input class="form-check-input" type="checkbox" value="docente" id="rol-modal-docente"
                              ${rolesActuales.includes('docente') ? 'checked' : ''}>
                       <label class="form-check-label" for="rol-modal-docente">
                           <i class="fas fa-chalkboard-teacher me-2"></i>Docente
                           <br><small class="text-muted">Puede gestionar sus portafolios y subir documentos</small>
                       </label>
                   </div>
                   
                   <div class="form-check mt-3">
                       <input class="form-check-input" type="checkbox" value="verificador" id="rol-modal-verificador"
                              ${rolesActuales.includes('verificador') ? 'checked' : ''}>
                       <label class="form-check-label" for="rol-modal-verificador">
                           <i class="fas fa-shield-alt me-2"></i>Verificador
                           <br><small class="text-muted">Puede revisar y aprobar documentos de docentes</small>
                       </label>
                   </div>
                   
                   <div class="form-check mt-3">
                       <input class="form-check-input" type="checkbox" value="administrador" id="rol-modal-administrador"
                              ${rolesActuales.includes('administrador') ? 'checked' : ''}>
                       <label class="form-check-label" for="rol-modal-administrador">
                           <i class="fas fa-crown me-2"></i>Administrador
                           <br><small class="text-muted">Acceso completo al sistema, gestión de usuarios y configuración</small>
                       </label>
                   </div>
               </div>
           </div>
           
           <div class="alert alert-info">
               <i class="fas fa-info-circle me-2"></i>
               <strong>Nota:</strong> Los cambios en los roles se aplicarán inmediatamente. 
               El usuario deberá iniciar sesión nuevamente para ver los cambios reflejados.
           </div>
       `;
   }

   /**
    * 💾 Guardar cambios en roles
    */
   async guardarRoles() {
       try {
           if (!this.estado.usuarioActual) return;
           
           const rolesSeleccionados = Array.from(document.querySelectorAll('#lista-roles input:checked'))
               .map(input => input.value);
           
           await this.servicioRoles.actualizarRolesUsuario(this.estado.usuarioActual.id, rolesSeleccionados);
           
           Utilidades.mostrarNotificacion('Roles actualizados correctamente', 'success');
           
           // Cerrar modal y recargar datos
           const modal = bootstrap.Modal.getInstance(document.getElementById('modal-roles'));
           modal.hide();
           
           await this.cargarUsuarios();
           
       } catch (error) {
           console.error('Error guardando roles:', error);
           Utilidades.mostrarNotificacion('Error al actualizar los roles', 'error');
       }
   }

   // =====================================
   // MÉTODOS DE FILTRADO Y BÚSQUEDA
   // =====================================

   /**
    * 🔍 Aplicar filtros de búsqueda
    */
   async aplicarFiltros() {
       // Recopilar filtros
       this.estado.filtros = {
           busqueda: document.getElementById('input-busqueda')?.value || '',
           rol: document.getElementById('filtro-rol')?.value || '',
           estado: document.getElementById('filtro-estado')?.value || '',
           ciclo: document.getElementById('filtro-ciclo')?.value || ''
       };
       
       // Resetear paginación
       this.estado.paginacion.pagina = 1;
       
       // Recargar datos
       await this.cargarUsuarios();
   }

   /**
    * 🧹 Limpiar búsqueda
    */
   async limpiarBusqueda() {
       document.getElementById('input-busqueda').value = '';
       await this.aplicarFiltros();
   }

   /**
    * 📊 Ordenar por campo
    */
   async ordenarPor(campo) {
       if (this.estado.ordenamiento.campo === campo) {
           // Cambiar dirección si es el mismo campo
           this.estado.ordenamiento.direccion = 
               this.estado.ordenamiento.direccion === 'asc' ? 'desc' : 'asc';
       } else {
           // Nuevo campo, ordenar ascendente
           this.estado.ordenamiento.campo = campo;
           this.estado.ordenamiento.direccion = 'asc';
       }
       
       await this.cargarUsuarios();
       this.actualizarIndicadoresOrdenamiento();
   }

   // =====================================
   // MÉTODOS AUXILIARES
   // =====================================

   /**
    * 🎨 Obtener color para rol
    */
   obtenerColorRol(rol) {
       const colores = {
           'administrador': 'danger',
           'verificador': 'warning',
           'docente': 'primary'
       };
       return colores[rol] || 'secondary';
   }

   /**
    * 📝 Obtener nombre display del rol
    */
   obtenerNombreRol(rol) {
       const nombres = {
           'administrador': 'Admin',
           'verificador': 'Verificador',
           'docente': 'Docente'
       };
       return nombres[rol] || rol;
   }

   /**
    * 🔧 Configurar elementos DOM
    */
   configurarElementosDOM() {
       this.elementos = {
           tabla: document.getElementById('tabla-usuarios'),
           formulario: document.getElementById('form-usuario'),
           filtros: document.querySelector('.card-body'),
           buscador: document.getElementById('input-busqueda')
       };
   }

   /**
    * ⚙️ Configurar eventos
    */
   configurarEventos() {
       // Búsqueda en tiempo real
       const buscador = document.getElementById('input-busqueda');
       if (buscador) {
           buscador.addEventListener('input', Utilidades.debounce(() => {
               this.aplicarFiltros();
           }, 500));
       }
       
       // Filtros automáticos
       ['filtro-rol', 'filtro-estado', 'filtro-ciclo'].forEach(id => {
           const elemento = document.getElementById(id);
           if (elemento) {
               elemento.addEventListener('change', () => this.aplicarFiltros());
           }
       });
   }

   /**
    * ✅ Configurar validaciones
    */
   configurarValidaciones() {
       this.validadorFormularios.configurarFormulario('form-usuario', {
           nombres: { required: true, minLength: 2 },
           apellidos: { required: true, minLength: 2 },
           correo: { required: true, email: true },
           dni: { pattern: /^\d{8}$/ },
           telefono: { pattern: /^[0-9+\-\s]+$/ },
           contrasena: { required: true, minLength: 8, pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/ }
       });
   }

   /**
    * 🔄 Actualizar breadcrumb
    */
   actualizarBreadcrumb() {
       const breadcrumb = document.querySelector('#breadcrumb');
       if (breadcrumb) {
           breadcrumb.innerHTML = `
               <li class="breadcrumb-item">
                   <i class="fas fa-crown me-1"></i>Administrador
               </li>
               <li class="breadcrumb-item active">Gestión de Usuarios</li>
           `;
       }
   }
}

// =====================================
// INICIALIZACIÓN GLOBAL
// =====================================

// Variable global para acceso desde HTML
let crudUsuarios;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
   crudUsuarios = new CRUDUsuarios();
});

// Cleanup al salir de la página
window.addEventListener('beforeunload', () => {
   if (crudUsuarios) {
       crudUsuarios = null;
   }
});