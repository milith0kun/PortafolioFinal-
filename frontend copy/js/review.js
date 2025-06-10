// review.js – Funcionalidad del verificador de portafolios

window.onload = () => {
  verificarSesion("verificador");
  cargarArbolVerificacion();
};

// 🔹 Cargar árbol de docentes y portafolios asignados al verificador
function cargarArbolVerificacion() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const token = usuario?.token;

  if (!token) {
    console.error("❌ Token no encontrado. Redirigiendo...");
    return;
  }

  fetch(`${API_BASE}/portafolios/verificador`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
    .then(res => res.ok ? res.json() : Promise.reject("Error al obtener datos"))
    .then(data => mostrarArbolVerificacion(data))
    .catch(err => {
      console.error("❌ Error al cargar árbol del verificador:", err);
      document.getElementById("arbol-verificacion").innerHTML = "❌ No se pudo cargar la información.";
    });
}

// 🔹 Mostrar estructura jerárquica recursiva
function mostrarArbolVerificacion(data) {
  const contenedor = document.getElementById("arbol-verificacion");
  contenedor.innerHTML = "";
  const ul = document.createElement("ul");

  data.forEach(semestre => {
    const liSem = document.createElement("li");
    liSem.innerHTML = `<strong>📅 ${semestre.nombre_semestre}</strong>`;
    const ulDocentes = document.createElement("ul");

    semestre.docentes.forEach(docente => {
      const liDocente = document.createElement("li");
      liDocente.innerHTML = `<strong>👨‍🏫 ${docente.nombre_docente}</strong>`;
      const ulCursos = document.createElement("ul");

      // Carpeta de presentación
      if (docente.carpeta_presentacion && docente.carpeta_presentacion.length > 0) {
        const liPresentacion = document.createElement("li");
        liPresentacion.innerHTML = `<strong>📁 PRESENTACIÓN DEL PORTAFOLIO</strong>`;
        const ulPresentacion = document.createElement("ul");
        renderCarpetas(docente.carpeta_presentacion, ulPresentacion);
        liPresentacion.appendChild(ulPresentacion);
        ulCursos.appendChild(liPresentacion);
      }

      // Cursos asignados
      docente.cursos.forEach(curso => {
        const liCurso = document.createElement("li");
        liCurso.innerHTML = `<strong>📘 ${curso.nombre_asignatura}</strong>`;
        const ulCarpetas = document.createElement("ul");

        if (curso.carpetas && curso.carpetas.length > 0) {
          renderCarpetas(curso.carpetas, ulCarpetas);
          liCurso.appendChild(ulCarpetas);
          ulCursos.appendChild(liCurso);
        }
      });

      liDocente.appendChild(ulCursos);
      ulDocentes.appendChild(liDocente);
    });

    liSem.appendChild(ulDocentes);
    ul.appendChild(liSem);
  });

  contenedor.appendChild(ul);
}

// 🔁 Función recursiva para construir carpetas/subcarpetas
function renderCarpetas(carpetas, contenedor) {
  carpetas.forEach(carpeta => {
    const nombre = carpeta.nombre?.trim();
    if (!nombre || nombre.toLowerCase().includes("sin nombre")) return;

    const li = document.createElement("li");
    const archivoId = carpeta.archivo_id;
    const estado = carpeta.estado || "sin archivo";
    const ruta = carpeta.ruta || null;
    const porcentaje = carpeta.porcentaje || 0;

    li.innerHTML = `
      <label>
        ${archivoId ? `<input type="checkbox" data-id="${archivoId}">` : "⬜"}
        📁 ${nombre} - <em>${estado}</em> (${porcentaje}%)
        ${ruta ? `<a href="${ruta}" target="_blank">🔗 Ver</a>` : ""}
      </label>
    `;

    if (carpeta.hijos && carpeta.hijos.length > 0) {
      const ulHijos = document.createElement("ul");
      renderCarpetas(carpeta.hijos, ulHijos);
      li.appendChild(ulHijos);
    }

    contenedor.appendChild(li);
  });
}

// 🔹 Verificar documentos seleccionados (Aprobar o Rechazar)
function verificarSeleccionados(estado) {
  const seleccionados = document.querySelectorAll("input[type='checkbox']:checked");
  const resultado = document.getElementById("resultado-verificacion");
  const observacion = document.getElementById("observacion").value.trim();
  resultado.textContent = "";

  if (seleccionados.length === 0) {
    resultado.textContent = "⚠️ Selecciona al menos un documento para verificar.";
    return;
  }

  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const token = usuario?.token;
  const ids = Array.from(seleccionados).map(input => input.dataset.id);

  if (!token || ids.length === 0) {
    resultado.textContent = "⚠️ Token inválido o datos incompletos.";
    return;
  }

  fetch(`${API_BASE}/documentos/verificar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ ids, estado, observacion })
  })
    .then(res => res.ok ? res.json() : Promise.reject("Error en verificación"))
    .then(() => {
      resultado.textContent = "✅ Documentos verificados correctamente.";
      cargarArbolVerificacion();
      document.getElementById("observacion").value = "";
    })
    .catch(err => {
      console.error("❌ Error al verificar:", err);
      resultado.textContent = "❌ No se pudo completar la verificación.";
    });
}

// 🔹 Mensaje informativo
function enviarObservacion() {
  const resultado = document.getElementById("resultado-observacion");
  resultado.textContent = "ℹ️ Las observaciones se envían junto con la verificación.";
}
