// carga_excel.js – Carga académica desde archivo Excel
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formCargaExcel");
  const input = document.getElementById("archivoExcel");
  const mensaje = document.getElementById("resultado");
  const erroresDiv = document.getElementById("errores");
  const boton = form.querySelector("button");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    mensaje.textContent = "";
    erroresDiv.innerHTML = "";
    mensaje.className = "mensaje";

    const archivo = input.files[0];

    if (!archivo || !archivo.name.endsWith('.xlsx')) {
      mensaje.textContent = "❌ Por favor, seleccione un archivo Excel (.xlsx)";
      mensaje.classList.add("error");
      return;
    }

    // Desactivar botón mientras se procesa
    boton.disabled = true;
    boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';

    const formData = new FormData();
    formData.append("archivo", archivo);

    try {
      const res = await fetch(`${API_BASE}/carga-academica/upload`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

      const data = await res.json();

      if (data.success) {
        mensaje.textContent = `✅ Carga completada con éxito. Se insertaron ${data.insertados} registros.`;
        mensaje.classList.add("exito");
      } else {
        mensaje.textContent = `❌ Error: ${data.error || 'No se pudieron procesar algunos registros.'}`;
        mensaje.classList.add("error");
      }

      if (data.errores && data.errores.length > 0) {
        erroresDiv.innerHTML = "<strong>Errores:</strong><ul>" +
          data.errores.map(err => `<li>${err}</li>`).join('') +
          "</ul>";
      }

    } catch (err) {
      console.error("Error al subir Excel:", err);
      mensaje.textContent = "❌ Error de conexión al servidor.";
      mensaje.classList.add("error");
    }

    // Restaurar botón
    boton.disabled = false;
    boton.innerHTML = '<i class="fas fa-upload"></i> Subir archivo';
  });
});
