import { generateOTAirE, getPoleHeightsDistribution } from './adminUtils.js';
import Storage from './storage.js';

export function saveProject() {
  const project = {
    id: null,
    nombre: document.getElementById("project-name").value,
    otAire: generateOTAirE(),
    prstNombre: document.getElementById("project-prst").value,
    otPRST: document.getElementById("project-ot-prst").value,
    departamento: document.getElementById("project-department").value,
    municipio: document.getElementById("project-municipality").value,
    barrio: document.getElementById("project-neighborhood").value,
    fechaInicio: document.getElementById("project-start-date").value,
    numPostes: parseInt(document.getElementById("project-poles").value),
    distribucionPostes: getPoleHeightsDistribution(),
    observaciones: document.getElementById("project-observations").value,
    creadorId: Storage.getLoggedUser()?.id,
  };

  Storage.saveProject(project);
  bootstrap.Modal.getInstance(document.getElementById("createProjectModal"))?.hide();
  loadProjectsTable();
}

export function loadProjectsTable() {
  const tbody = document.getElementById("projects-table-body");
  if (!tbody) return;

  const projects = Storage.getProjects();
  tbody.innerHTML = "";

  for (const p of projects) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.otAire || ""}</td>
      <td>${p.nombre}</td>
      <td>${p.prstNombre}</td>
      <td>${p.departamento}</td>
      <td>${new Date(p.fechaCreacion).toLocaleDateString()}</td>
      <td>${p.estado}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="alert('Asignación no implementada')">Asignar</button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  document.getElementById("total-projects").textContent = projects.length;
  document.getElementById("in-progress-projects").textContent = projects.filter(p => p.estado === "En Gestión").length;
  document.getElementById("completed-projects").textContent = projects.filter(p => p.estado === "Finalizado").length;
}

export function showCreateProjectModal() {
  const modal = new bootstrap.Modal(document.getElementById("createProjectModal"));
  modal.show();
}

export function assignProject() {
  alert("Función de asignar proyecto aún no implementada");
}

export function showAssignProjectModal(id) {
  alert(`Mostrar modal de asignación para proyecto ID: ${id}`);
}

export function loadInManagementProjects() {}
export function loadCompletedProjects() {}
export function updateProjectsTable() {}
