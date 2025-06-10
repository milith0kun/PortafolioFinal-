
// notificaciones.js
function cargarNotificaciones() {
    fetch(`${API_BASE}/notificaciones`)
      .then(res => res.json())
      .then(data => {
        const div = document.getElementById("notificaciones");
        div.innerHTML = data.map(n => `<div>${n.mensaje}</div>`).join("");
      });
  }
  window.onload = cargarNotificaciones;