// dashboard.js - Panel de administración (R5, R15)

// ✅ API_BASE ya está definida en auth.js (global), no se vuelve a declarar

window.onload = () => {
  verificarSesion("administrador");
  cargarEstadisticas();
  cargarDocumentosRecientes();
};

// 📊 Cargar estadísticas generales del sistema
async function cargarEstadisticas() {
  const resumen = document.getElementById("resumen");
  resumen.innerHTML = '<div class="cargando">Cargando estadísticas...</div>';

  try {
    const usuariosResponse = await fetch(`${API_BASE}/usuarios/count`);
    const usuariosData = await usuariosResponse.json();

    const documentosResponse = await fetch(`${API_BASE}/documentos/count`);
    const documentosData = await documentosResponse.json();

    const asignaturasResponse = await fetch(`${API_BASE}/asignaturas/count`);
    const asignaturasData = await asignaturasResponse.json();

    resumen.innerHTML = `
      <div class="estadistica">
        <h3>Usuarios</h3>
        <p class="numero">${usuariosData.total}</p>
        <div class="desglose">
          <p>Docentes: ${usuariosData.docentes || 0}</p>
          <p>Verificadores: ${usuariosData.verificadores || 0}</p>
          <p>Administradores: ${usuariosData.administradores || 0}</p>
        </div>
      </div>

      <div class="estadistica">
        <h3>Documentos</h3>
        <p class="numero">${documentosData.total}</p>
        <div class="desglose">
          <p>Pendientes: ${documentosData.pendientes || 0}</p>
          <p>En revisión: ${documentosData.en_revision || 0}</p>
          <p>Verificados: ${documentosData.verificados || 0}</p>
          <p>Rechazados: ${documentosData.rechazados || 0}</p>
        </div>
      </div>

      <div class="estadistica">
        <h3>Asignaturas</h3>
        <p class="numero">${asignaturasData.total}</p>
        <div class="desglose">
          <p>Activas: ${asignaturasData.activas || 0}</p>
        </div>
      </div>
    `;
  } catch (error) {
    console.error("❌ Error cargando estadísticas:", error);
    resumen.innerHTML = `<div class="error">Error al cargar estadísticas: ${error.message}</div>`;
  }
}

// 📄 Cargar documentos recientes para mostrar en el dashboard
async function cargarDocumentosRecientes() {
  try {
    const response = await fetch(`${API_BASE}/documentos/recientes`);
    const documentos = await response.json();

    let seccionDocumentos = document.getElementById("documentos-recientes");
    if (!seccionDocumentos) {
      seccionDocumentos = document.createElement("section");
      seccionDocumentos.id = "documentos-recientes";
      seccionDocumentos.innerHTML = '<h2>Documentos Recientes</h2>';
      document.querySelector("main").appendChild(seccionDocumentos);
    }

    if (documentos.length > 0) {
      const listaHTML = documentos.map(doc => `
        <div class="documento">
          <p><strong>${doc.titulo}</strong> - ${doc.tipo}</p>
          <p>Subido por: ${doc.usuario_nombre} - ${new Date(doc.fecha_creacion).toLocaleDateString()}</p>
          <p>Estado: <span class="estado-${doc.estado}">${doc.estado}</span></p>
        </div>
      `).join('');

      seccionDocumentos.innerHTML += `<div class="documentos-lista">${listaHTML}</div>`;
    } else {
      seccionDocumentos.innerHTML += '<p>No hay documentos recientes</p>';
    }
  } catch (error) {
    console.error("❌ Error cargando documentos recientes:", error);
  }
}
