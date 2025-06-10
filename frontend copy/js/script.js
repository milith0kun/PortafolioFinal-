
// script.js
function fetchUsuarios() {
    fetch(`${API_BASE}/usuarios`)
      .then(res => res.json())
      .then(data => {
        const cont = document.getElementById("usuarios-list");
        cont.innerHTML = data.map(u => `
          <div>
            <strong>${u.nombres} ${u.apellidos}</strong> - ${u.rol} <br> ${u.correo}
          </div>`).join("");
      })
      .catch(err => console.error("Error cargando usuarios:", err));
  }
  window.onload = fetchUsuarios;
  
  // upload.js
  function cargarDocumentos() {
    fetch(`${API_BASE}/documentos`)
      .then(res => res.json())
      .then(data => {
        const lista = document.getElementById("lista-documentos");
        lista.innerHTML = data.map(doc => `<p>${doc.descripcion}</p>`).join("");
      });
  }
  
  document.getElementById("formUpload").addEventListener("submit", function(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    fetch(`${API_BASE}/documentos`, {
      method: "POST",
      body: formData
    })
    .then(res => res.json())
    .then(() => {
      form.reset();
      cargarDocumentos();
    });
  });
  
  window.onload = cargarDocumentos;
  