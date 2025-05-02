import Storage from './storage.js';

export function loadCharts() {
  const projects = Storage.getProjects();
  loadProjectsByStatusChart(projects);
  loadProjectsByDepartmentChart(projects);
  loadProjectsFlowChart(projects);
  loadProjectsByPRSTChart(projects);
}

function loadProjectsByStatusChart(projects) {
  const ctx = document.getElementById("projects-by-status-chart").getContext("2d");
  const estados = {};
  projects.forEach(p => {
    estados[p.estado] = (estados[p.estado] || 0) + 1;
  });

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(estados),
      datasets: [{
        label: "Proyectos",
        data: Object.values(estados),
        backgroundColor: "rgba(54, 162, 235, 0.5)",
      }],
    },
    options: { responsive: true },
  });
}

function loadProjectsByDepartmentChart(projects) {
  const ctx = document.getElementById("projects-by-department-chart").getContext("2d");
  const deptos = {};
  projects.forEach(p => {
    deptos[p.departamento] = (deptos[p.departamento] || 0) + 1;
  });

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(deptos),
      datasets: [{
        label: "Departamentos",
        data: Object.values(deptos),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
      }],
    },
    options: { responsive: true },
  });
}

function loadProjectsFlowChart(projects) {
  const ctx = document.getElementById("projects-flow-chart").getContext("2d");
  const byMonth = {};

  projects.forEach(p => {
    const fecha = new Date(p.fechaCreacion);
    const mes = `${fecha.getFullYear()}-${fecha.getMonth() + 1}`.padStart(7, "0");
    byMonth[mes] = (byMonth[mes] || 0) + 1;
  });

  const labels = Object.keys(byMonth).sort();
  const data = labels.map(l => byMonth[l]);

  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Proyectos por mes",
        data,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      }],
    },
    options: { responsive: true },
  });
}

function loadProjectsByPRSTChart(projects) {
  const ctx = document.getElementById("projects-by-prst-chart").getContext("2d");
  const porPRST = {};

  projects.forEach(p => {
    porPRST[p.prstNombre] = (porPRST[p.prstNombre] || 0) + 1;
  });

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(porPRST),
      datasets: [{
        label: "Proyectos por PRST",
        data: Object.values(porPRST),
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      }],
    },
    options: { responsive: true },
  });
}
