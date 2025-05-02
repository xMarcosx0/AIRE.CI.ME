import Storage from './storage.js';

export function loadUsersTable() {
  const users = Storage.getUsers();
  const tbody = document.getElementById("users-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";
  for (const user of users) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${user.id}</td>
      <td>${user.nombre} ${user.apellido}</td>
      <td>${user.usuario}</td>
      <td>${user.correo}</td>
      <td>${user.rol}</td>
      <td>${user.activo ? "Activo" : "Inactivo"}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="showUserModal('${user.id}')">Editar</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

export function showUserModal(id = null) {
  const modal = new bootstrap.Modal(document.getElementById("userModal"));
  const user = id ? Storage.getUserById(id) : null;

  document.getElementById("user-title").textContent = user ? "Editar Usuario" : "Nuevo Usuario";

  document.getElementById("user-id").value = user?.id || "";
  document.getElementById("user-nombre").value = user?.nombre || "";
  document.getElementById("user-apellido").value = user?.apellido || "";
  document.getElementById("user-usuario").value = user?.usuario || "";
  document.getElementById("user-email").value = user?.correo || "";
  document.getElementById("user-password").value = user?.password || "";
  document.getElementById("user-rol").value = user?.rol || "prst";

  const isPRST = user?.rol === "prst";
  document.getElementById("prst-fields").classList.toggle("d-none", !isPRST);

  document.getElementById("user-prst-nombre").value = user?.nombrePRST || "";
  document.getElementById("user-cedula").value = user?.cedula || "";
  document.getElementById("user-matricula").value = user?.matriculaProfesional || "";
  document.getElementById("user-celular").value = user?.celular || "";
  document.getElementById("user-direccion").value = user?.direccion || "";
  document.getElementById("user-barrio").value = user?.barrio || "";
  document.getElementById("user-ciudad").value = user?.ciudad || "";

  document.getElementById("user-activo").value = user?.activo ? "true" : "false";
  document.getElementById("user-activo-text").value = user?.activo ? "Activo" : "Inactivo";

  modal.show();
}

export function saveUser() {
  const id = document.getElementById("user-id").value;
  const user = {
    id: id || null,
    nombre: document.getElementById("user-nombre").value,
    apellido: document.getElementById("user-apellido").value,
    usuario: document.getElementById("user-usuario").value,
    correo: document.getElementById("user-email").value,
    password: document.getElementById("user-password").value,
    rol: document.getElementById("user-rol").value,
    activo: document.getElementById("user-activo").value === "true"
  };

  if (user.rol === "prst") {
    user.nombrePRST = document.getElementById("user-prst-nombre").value;
    user.cedula = document.getElementById("user-cedula").value;
    user.matriculaProfesional = document.getElementById("user-matricula").value;
    user.celular = document.getElementById("user-celular").value;
    user.direccion = document.getElementById("user-direccion").value;
    user.barrio = document.getElementById("user-barrio").value;
    user.ciudad = document.getElementById("user-ciudad").value;
  }

  Storage.saveUser(user);
  bootstrap.Modal.getInstance(document.getElementById("userModal"))?.hide();
  loadUsersTable();
}
