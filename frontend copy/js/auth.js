// auth.js (Frontend - Autenticación y gestión de sesión)
// auth.js (Frontend - Autenticación y gestión de sesión)
const API_BASE = window.API_BASE; // ✅ Usa la global definida en config.js

// Iniciar sesión
function loginUsuario(event) {
  event.preventDefault();

  const correo = document.getElementById("correo").value.trim();
  const contrasena = document.getElementById("contrasena").value;
  const mensaje = document.getElementById("mensaje");
  mensaje.textContent = "";

  fetch(`${API_BASE}/usuarios/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ correo, contrasena })
  })
    .then(res => res.json().then(data => ({ status: res.status, data })))
    .then(({ status, data }) => {
      if (status !== 200) {
        mensaje.textContent = data.error || "Correo o contraseña incorrectos";
        return;
      }

      if (!data.rol || !data.token) {
        mensaje.textContent = "Error inesperado. No se recibió token o rol.";
        return;
      }

      // Guardar datos del usuario con el token
      localStorage.setItem("usuario", JSON.stringify({
        id: data.id,
        nombres: data.nombres,
        rol: data.rol,
        token: data.token
      }));

      // Redirigir según el rol
      redirigirPorRol(data.rol);
    })
    .catch(err => {
      console.error("❌ Error en login:", err);
      mensaje.textContent = "Error de conexión con el servidor.";
    });
}

// Redirigir según el rol
function redirigirPorRol(rol) {
  switch (rol) {
    case "administrador":
      window.location.href = "dashboard.html";
      break;
    case "docente":
      window.location.href = "upload.html";
      break;
    case "verificador":
      window.location.href = "review.html";
      break;
    default:
      cerrarSesion(); // En caso de rol inválido
  }
}

// Verificar sesión activa y rol adecuado
function verificarSesion(rolEsperado) {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario || !usuario.token || (rolEsperado && usuario.rol !== rolEsperado)) {
    window.location.href = "error.html";
  }
}

// Cerrar sesión
function cerrarSesion() {
  localStorage.clear();
  window.location.href = "login.html";
}

// Redirección automática desde index.html
(function redireccionarIndex() {
  if (window.location.pathname.includes("index.html")) {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario || !usuario.rol || !usuario.token) {
      window.location.href = "login.html";
    } else {
      redirigirPorRol(usuario.rol);
    }
  }
})();
