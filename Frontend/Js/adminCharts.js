import Storage from './storage.js';

export function loadCharts(projects = []) {
  try {
    // Validar y obtener proyectos si no se proporcionan
    if (!Array.isArray(projects) || projects.length === 0) {
      projects = Storage.getProjects() || [];
    }

    // Actualizar estadísticas
    updateStats(projects);

    // Cargar gráficos solo si hay datos
    if (projects.length > 0) {
      loadProjectsByStatusChart(projects);
      loadProjectsByDepartmentChart(projects);
      loadProjectsFlowChart(projects);
      loadProjectsByPRSTChart(projects);
      loadProjectsByRequestTypeChart(projects);
    }
  } catch (error) {
    console.error("Error en loadCharts:", error);
  }
}

function updateStats(projects) {
  const totalUsers = Storage.getUsers().length;
  const totalProjects = projects.length;
  const inProgress = projects.filter(p => 
    p.estado === "En Gestión" || p.estado === "En Proceso de Viabilidad"
  ).length;
  const completed = projects.filter(p => p.estado === "Finalizado").length;

  // Actualizar elementos del DOM de forma segura
  safeUpdateElement("total-users", totalUsers);
  safeUpdateElement("total-projects", totalProjects);
  safeUpdateElement("in-progress-projects", inProgress);
  safeUpdateElement("completed-projects", completed);
}

function safeUpdateElement(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function loadProjectsByStatusChart(projects) {
  const ctx = document.getElementById("projects-by-status-chart");
  if (!ctx) return;

  const estados = {};
  projects.forEach(p => {
    if (p.estado) {
      estados[p.estado] = (estados[p.estado] || 0) + 1;
    }
  });

  destroyChartIfExists(ctx);

  ctx.chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(estados),
      datasets: [{
        label: "Proyectos por Estado",
        data: Object.values(estados),
        backgroundColor: "rgba(54, 162, 235, 0.7)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function loadProjectsByDepartmentChart(projects) {
  const ctx = document.getElementById("projects-by-department-chart");
  if (!ctx) return;

  const deptos = {};
  projects.forEach(p => {
    if (p.departamento) {
      deptos[p.departamento] = (deptos[p.departamento] || 0) + 1;
    }
  });

  destroyChartIfExists(ctx);

  ctx.chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(deptos),
      datasets: [{
        label: "Proyectos por Departamento",
        data: Object.values(deptos),
        backgroundColor: [
          "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", 
          "#9966FF", "#FF9F40", "#8AC24A", "#607D8B"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'right' }
      }
    }
  });
}

function loadProjectsFlowChart(projects) {
  const ctx = document.getElementById("projects-flow-chart");
  if (!ctx) return;

  const byMonth = {};
  projects.forEach(p => {
    if (p.fechaCreacion) {
      const fecha = new Date(p.fechaCreacion);
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      byMonth[mes] = (byMonth[mes] || 0) + 1;
    }
  });

  const labels = Object.keys(byMonth).sort();
  const data = labels.map(l => byMonth[l]);

  destroyChartIfExists(ctx);

  ctx.chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Proyectos por Mes",
        data,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.1,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function loadProjectsByPRSTChart(projects) {
  const ctx = document.getElementById("projects-by-prst-chart");
  if (!ctx) return;

  const porPRST = {};
  projects.forEach(p => {
    if (p.prstNombre) {
      porPRST[p.prstNombre] = (porPRST[p.prstNombre] || 0) + 1;
    }
  });

  destroyChartIfExists(ctx);

  ctx.chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(porPRST),
      datasets: [{
        label: "Proyectos por PRST",
        data: Object.values(porPRST),
        backgroundColor: "rgba(255, 99, 132, 0.7)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function loadProjectsByRequestTypeChart(projects) {
  const ctx = document.getElementById("projects-by-request-type-chart");
  if (!ctx) return;

  const tipos = {
    "SEV": 0,
    "SDR": 0,
    "SIPRST": 0,
    "Otros": 0
  };

  projects.forEach(p => {
    if (p.tipoSolicitud) {
      if (tipos.hasOwnProperty(p.tipoSolicitud)) {
        tipos[p.tipoSolicitud]++;
      } else {
        tipos["Otros"]++;
      }
    } else {
      tipos["Otros"]++;
    }
  });

  destroyChartIfExists(ctx);

  ctx.chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(tipos),
      datasets: [{
        label: "Proyectos por Tipo de Solicitud",
        data: Object.values(tipos),
        backgroundColor: [
          "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'right' }
      }
    }
  });
}

function destroyChartIfExists(ctx) {
  if (ctx.chart) {
    ctx.chart.destroy();
    ctx.chart = null;
  }
}

// Event listeners para botones de período de tiempo
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".time-period-btn").forEach(btn => {
    btn.addEventListener("click", function() {
      this.closest(".btn-group").querySelectorAll(".time-period-btn").forEach(b => {
        b.classList.remove("active");
      });
      this.classList.add("active");
      loadCharts(Storage.getProjects());
    });
  });
});