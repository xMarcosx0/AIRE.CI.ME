import {
  saveProject,
  showCreateProjectModal,
  assignProject,
  showAssignProjectModal
} from './adminProjects.js';
import { showUserModal, saveUser } from './adminUsers.js';
import { togglePasswordVisibility } from './adminUtils.js';
import Storage from './storage.js';


export function setupEventListeners() {
  const bind = (id, ev, fn) => document.getElementById(id)?.addEventListener(ev, fn);
  
  bind("logout-button", "click", () => { directLogout(); });
  bind("profile-button", "click", () => {
    showProfileSection();
    showProfileData();
  });
  bind("change-password-btn", "click", showChangePasswordModal);
  bind("create-project-button", "click", showCreateProjectModal);
  bind("save-project-button", "click", saveProject);
  bind("new-user-button", "click", showUserModal);
  bind("save-user-button", "click", saveUser);
  bind("assign-project-button", "click", assignProject);
  bind("back-to-dashboard", "click", () => {
    document.getElementById("profile-section").classList.add("d-none");
    document.querySelector(".tab-content").classList.remove("d-none");
  });

  // Mostrar distribución de alturas al cambiar número de postes
  document.getElementById("project-poles")?.addEventListener("input", () => {
    document.getElementById("pole-heights-container")?.classList.remove("d-none");
  });

  // Visibilidad de contraseña
  document.getElementById("toggle-password")?.addEventListener("click", togglePasswordVisibility);
}

function showChangePasswordModal() {
  alert("Funcionalidad para cambiar contraseña pendiente de implementar.");
}

function showProfileSection() {
  document.getElementById("profile-section").classList.remove("d-none");
  document.querySelector(".tab-content").classList.add("d-none");
}

function showProfileData() {
  const user = Storage.getLoggedUser();
  if (!user) return;
  document.getElementById("profile-nombre").textContent = user.nombre;
  document.getElementById("profile-apellido").textContent = user.apellido;
  document.getElementById("profile-usuario").textContent = user.usuario;
  document.getElementById("profile-correo").textContent = user.correo;
  document.getElementById("profile-rol").textContent = user.rol;
}

function directLogout() {
  Storage.logout();
  location.href = "login.html";
}
