// upload.js – Para docentes: subir y gestionar archivos del portafolio

// 🎯 Elementos del DOM
const arbolContainer = document.getElementById("arbol-portafolio");
const formUpload = document.getElementById("formUpload");
const carpetaSeleccionada = document.getElementById("carpeta-seleccionada");
const seccionSubida = document.getElementById("seccion-subida");
const archivosSubidos = document.getElementById("archivos-subidos");
const tituloArchivos = document.getElementById("titulo-archivos");
const listaDocumentos = document.getElementById("lista-documentos");

// 🧾 Inputs ocultos
const inputPortafolioId = formUpload.querySelector("input[name='portafolio_id']");
const inputSemestre = formUpload.querySelector("input[name='semestre']");
const inputAsignatura = formUpload.querySelector("input[name='asignatura']");
const inputCarpeta = formUpload.querySelector("input[name='carpeta']");

// 🚀 Cargar árbol al iniciar
document.addEventListener("DOMContentLoaded", cargarArbol);

// ===============================
// 🔁 Cargar estructura del portafolio (con token)
// ===============================
function cargarArbol() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const token = usuario?.token;

  if (!token) {
    arbolContainer.innerHTML = "❌ No hay sesión activa.";
    return;
  }

  fetch(`${API_BASE}/portafolios/docente`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
    .then(res => res.ok ? res.json() : Promise.reject("Error al obtener datos"))
    .then(data => {
      arbolContainer.innerHTML = "";
      if (!Array.isArray(data) || data.length === 0) {
        arbolContainer.innerHTML = "📂 No tienes portafolios registrados. Consulta con el administrador.";
        return;
      }
      arbolContainer.appendChild(generarArbolHTML(data));
    })
    .catch(err => {
      console.error("❌ Error al cargar árbol:", err);
      arbolContainer.innerHTML = "❌ Error al cargar estructura.";
    });
}

// 🌳 Generar HTML recursivo del árbol
function generarArbolHTML(data) {
  const ul = document.createElement("ul");

  data.forEach(semestre => {
    const liSem = document.createElement("li");
    liSem.innerHTML = `<strong>📅 ${semestre.nombre_semestre}</strong>`;
    const ulCursos = document.createElement("ul");

    semestre.cursos.forEach(curso => {
      const liCurso = document.createElement("li");
      liCurso.innerHTML = `<strong>📘 ${curso.nombre_asignatura}</strong>`;
      const ulCarpetas = document.createElement("ul");

      curso.carpetas.forEach(carpeta => {
        const liCarpeta = document.createElement("li");
        liCarpeta.textContent = `📁 ${carpeta.nombre}`;
        liCarpeta.style.cursor = "pointer";
        liCarpeta.onclick = () =>
          seleccionarCarpeta({
            portafolio_id: carpeta.portafolio_id,
            semestre: semestre.nombre_semestre,
            asignatura: curso.nombre_asignatura,
            carpeta: carpeta.nombre
          });

        ulCarpetas.appendChild(liCarpeta);
      });

      liCurso.appendChild(ulCarpetas);
      ulCursos.appendChild(liCurso);
    });

    liSem.appendChild(ulCursos);
    ul.appendChild(liSem);
  });

  return ul;
}

// 📁 Al hacer clic en carpeta
function seleccionarCarpeta({ portafolio_id, semestre, asignatura, carpeta }) {
  seccionSubida.style.display = "block";
  archivosSubidos.style.display = "block";

  carpetaSeleccionada.textContent = `${semestre} / ${asignatura} / ${carpeta}`;
  inputPortafolioId.value = portafolio_id;
  inputSemestre.value = semestre;
  inputAsignatura.value = asignatura;
  inputCarpeta.value = carpeta;

  listarArchivos(portafolio_id);
}

// ⬆️ Subir archivo
formUpload.addEventListener("submit", function (e) {
  e.preventDefault();
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const token = usuario?.token;
  const formData = new FormData(formUpload);

  fetch(`${API_BASE}/documentos/subir`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: formData
  })
    .then(res => res.ok ? res.json() : Promise.reject("Error en la subida"))
    .then(() => {
      alert("✅ Archivo subido correctamente");
      listarArchivos(inputPortafolioId.value);
      formUpload.reset();
    })
    .catch(err => {
      console.error("❌ Error al subir archivo:", err);
      alert("❌ No se pudo subir el archivo");
    });
});

// 📜 Listar archivos
function listarArchivos(portafolio_id) {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const token = usuario?.token;

  tituloArchivos.textContent = carpetaSeleccionada.textContent;
  listaDocumentos.innerHTML = "⏳ Cargando archivos...";

  fetch(`${API_BASE}/documentos/listar?portafolio_id=${portafolio_id}`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
    .then(res => res.ok ? res.json() : Promise.reject("Error al obtener archivos"))
    .then(data => {
      listaDocumentos.innerHTML = "";

      if (!Array.isArray(data) || data.length === 0) {
        listaDocumentos.textContent = "📂 No hay archivos en esta carpeta.";
        return;
      }

      data.forEach(doc => {
        const div = document.createElement("div");
        div.classList.add("archivo-item");
        div.innerHTML = `
          📄 <strong>${doc.nombre_archivo}</strong> (${doc.formato})<br>
          <a href="${doc.ruta_archivo}" target="_blank">🔗 Ver archivo</a>
          <button onclick="eliminarArchivo(${doc.id}, ${portafolio_id})">🗑 Eliminar</button>
        `;
        listaDocumentos.appendChild(div);
      });
    })
    .catch(err => {
      console.error("❌ Error al listar archivos:", err);
      listaDocumentos.textContent = "❌ No se pudieron cargar los archivos.";
    });
}

// ❌ Eliminar archivo
function eliminarArchivo(id, portafolio_id) {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const token = usuario?.token;

  if (!confirm("¿Estás seguro de eliminar este archivo?")) return;

  fetch(`${API_BASE}/documentos/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  })
    .then(res => res.ok ? res.json() : Promise.reject("Error al eliminar"))
    .then(() => {
      alert("🗑 Archivo eliminado correctamente");
      listarArchivos(portafolio_id);
    })
    .catch(err => {
      console.error("❌ Error al eliminar archivo:", err);
      alert("❌ No se pudo eliminar el archivo");
    });
}
