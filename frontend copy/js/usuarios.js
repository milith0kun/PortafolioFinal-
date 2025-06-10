// usuarios.js

window.onload = () => {
  verificarSesion("administrador");
  cargarUsuarios();
};

async function cargarUsuarios() {
  const contenedor = document.getElementById("lista-usuarios");
  try {
    const res = await fetch(`${API_BASE}/usuarios`);
    const usuarios = await res.json();
    if (usuarios.length === 0) {
      contenedor.innerHTML = "<p>No hay usuarios registrados.</p>";
      return;
    }

    contenedor.innerHTML = usuarios.map(user => `
      <div class="usuario-card">
        <strong>${user.nombres} ${user.apellidos}</strong><br>
        ${user.correo} — Rol: ${user.rol}<br>
        <button onclick="eliminarUsuario(${user.id})">Eliminar</button>
        <button onclick="editarUsuario(${user.id}, '${user.nombres}', '${user.apellidos}', '${user.correo}', '${user.rol}')">Editar</button>
      </div>
    `).join('');
  } catch (error) {
    contenedor.innerHTML = `<p>Error al cargar usuarios.</p>`;
    console.error(error);
  }
}

async function crearUsuario(event) {
  event.preventDefault();
  const nombres = document.getElementById("nombres").value.trim();
  const apellidos = document.getElementById("apellidos").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const contrasena = document.getElementById("contrasena").value;
  const rol = document.getElementById("rol").value;
  const mensaje = document.getElementById("mensaje");

  if (!nombres || !apellidos || !correo || !contrasena || !rol) {
    mensaje.textContent = "Todos los campos son obligatorios.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombres, apellidos, correo, contrasena, rol })
    });

    const data = await res.json();
    if (res.status !== 201) {
      mensaje.textContent = data.error || "No se pudo registrar.";
    } else {
      mensaje.textContent = "Usuario creado correctamente.";
      document.getElementById("form-usuario").reset();
      cargarUsuarios();
    }
  } catch (error) {
    mensaje.textContent = "Error al registrar usuario.";
    console.error(error);
  }
}

async function eliminarUsuario(id) {
  if (!confirm("¿Estás seguro de eliminar este usuario?")) return;
  try {
    const res = await fetch(`${API_BASE}/usuarios/${id}`, {
      method: "DELETE"
    });
    const data = await res.json();
    if (res.ok) {
      alert("Usuario eliminado.");
      cargarUsuarios();
    } else {
      alert(data.error || "No se pudo eliminar.");
    }
  } catch (error) {
    alert("Error al eliminar usuario.");
    console.error(error);
  }
}

function editarUsuario(id, nombres, apellidos, correo, rol) {
  const nuevosDatos = prompt("Editar usuario (formato: nombres,apellidos,correo,rol)", `${nombres},${apellidos},${correo},${rol}`);
  if (!nuevosDatos) return;
  const [nuevosNombres, nuevosApellidos, nuevoCorreo, nuevoRol] = nuevosDatos.split(',');

  fetch(`${API_BASE}/usuarios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombres: nuevosNombres, apellidos: nuevosApellidos, correo: nuevoCorreo, rol: nuevoRol })
  })
    .then(res => res.json())
    .then(data => {
      alert("Usuario actualizado.");
      cargarUsuarios();
    })
    .catch(error => {
      alert("Error al editar usuario.");
      console.error(error);
    });
}
