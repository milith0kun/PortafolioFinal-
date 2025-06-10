
// observaciones.js
function cargarObservaciones() {
    fetch(`${API_BASE}/observaciones`)
      .then(res => res.json())
      .then(data => {
        const lista = document.getElementById("observaciones-list");
        lista.innerHTML = data.map(obs => `<div><strong>${obs.asunto}</strong><br>${obs.comentario}</div>`).join("");
      });
  }
  window.onload = cargarObservaciones;