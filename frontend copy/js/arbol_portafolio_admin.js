document.addEventListener("DOMContentLoaded", async () => {
  const arbol = document.getElementById("arbol-portafolio");
  arbol.innerHTML = "⏳ Cargando estructura...";

  try {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const token = usuario?.token;

    if (!token) throw new Error("Token no disponible");

    const API = window.API_BASE || "http://localhost:3000/api";
    const respuesta = await fetch(`${API}/portafolios/admin`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await respuesta.json();

    if (!Array.isArray(data)) throw new Error("Estructura inválida");

    const estructuraHTML = generarArbolHTML(data);
    arbol.innerHTML = "";
    arbol.appendChild(estructuraHTML);
  } catch (error) {
    console.error("❌ Error al cargar árbol:", error);
    arbol.innerHTML = "❌ Error al cargar estructura del portafolio.";
  }
});

// 🔧 Generar árbol: Semestre → Docente → Presentación (nivel curso) + Cursos
function generarArbolHTML(datos) {
  const lista = document.createElement("ul");

  datos.forEach((semestre) => {
    const liSemestre = document.createElement("li");
    liSemestre.innerHTML = `<strong>📅 ${semestre.nombre_semestre}</strong>`;

    const listaDocentes = document.createElement("ul");

    (semestre.docentes || []).forEach((docente) => {
      const liDocente = document.createElement("li");
      liDocente.innerHTML = `<strong>👨‍🏫 ${docente.nombre_docente}</strong>`;

      const listaContenido = document.createElement("ul");

      // ✅ Mostrar la carpeta "PRESENTACIÓN DEL PORTAFOLIO" como carpeta principal
      if (Array.isArray(docente.carpeta_presentacion) && docente.carpeta_presentacion.length > 0) {
        const liPresentacion = document.createElement("li");
        liPresentacion.innerHTML = `📁 <strong>PRESENTACIÓN DEL PORTAFOLIO</strong>`;
        liPresentacion.appendChild(renderCarpetasRecursivas(docente.carpeta_presentacion));
        listaContenido.appendChild(liPresentacion);
      }

      // 📘 Cursos
      (docente.cursos || []).forEach((curso) => {
        const liCurso = document.createElement("li");
        liCurso.innerHTML = `📘 <strong>${curso.nombre_asignatura}</strong>`;

        if (Array.isArray(curso.carpetas)) {
          liCurso.appendChild(renderCarpetasRecursivas(curso.carpetas));
        }

        listaContenido.appendChild(liCurso);
      });

      liDocente.appendChild(listaContenido);
      listaDocentes.appendChild(liDocente);
    });

    liSemestre.appendChild(listaDocentes);
    lista.appendChild(liSemestre);
  });

  return lista;
}

// 📁 Renderiza carpetas y subcarpetas de forma recursiva
function renderCarpetasRecursivas(carpetas = []) {
  const ul = document.createElement("ul");

  carpetas.forEach((carpeta) => {
    const nombre = carpeta.nombre_carpeta || carpeta.nombre;
    if (!nombre) return;

    const li = document.createElement("li");
    li.innerHTML = `📁 ${nombre}`;

    if (Array.isArray(carpeta.hijos) && carpeta.hijos.length > 0) {
      li.appendChild(renderCarpetasRecursivas(carpeta.hijos));
    }

    ul.appendChild(li);
  });

  return ul;
}
