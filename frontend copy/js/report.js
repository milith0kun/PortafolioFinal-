
// report.js
function generarReporte(e) {
    e.preventDefault();
    const filtro = document.getElementById("filtro").value;
    fetch(`${API_BASE}/reportes?filtro=${filtro}`)
      .then(res => res.json())
      .then(data => {
        const cont = document.getElementById("resultadoReporte");
        cont.innerHTML = JSON.stringify(data, null, 2);
      });
  }
  
  document.getElementById("formReportes").addEventListener("submit", generarReporte);