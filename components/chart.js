//components/chart.js

// Add this at the beginning of the file to help with debugging
console.log("Chart component loaded")
import { Chart } from "@/components/ui/chart"
// chart.js - Funcionalidades para los gráficos del panel de administración

// Ensure Storage is available
if (typeof Storage === "undefined") {
  console.error("Storage object is not defined in chart.js")
}

// Variables globales para controlar los gráficos
let chartStatus = null
let chartDept = null
let chartFlow = null

// Función para cargar gráfico de proyectos por estado
function loadProjectsByStatusChart(period = "month") {
  console.log("Cargando gráfico de proyectos por estado")

  try {
    const ctx = document.getElementById("projects-by-status-chart")
    if (!ctx) {
      console.warn("Elemento projects-by-status-chart no encontrado")
      return
    }

    // Obtener proyectos del almacenamiento
    const projects = typeof Storage !== "undefined" && Storage.getProjects ? Storage.getProjects() : []
    console.log("Projects loaded for status chart:", projects.length)

    // Filtrar proyectos según el período seleccionado
    let filteredProjects = projects
    const now = new Date()

    if (period === "month") {
      // Filtrar proyectos del último mes
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

      filteredProjects = projects.filter((project) => {
        if (!project.fechaCreacion) return false
        const creationDate = new Date(project.fechaCreacion)
        return creationDate >= oneMonthAgo && creationDate <= now
      })
    } else if (period === "year") {
      // Filtrar proyectos del último año
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

      filteredProjects = projects.filter((project) => {
        if (!project.fechaCreacion) return false
        const creationDate = new Date(project.fechaCreacion)
        return creationDate >= oneYearAgo && creationDate <= now
      })
    }

    // Contar proyectos por estado
    const statusCounts = {}
    filteredProjects.forEach((project) => {
      const status = project.estado || "No definido"
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    // Preparar datos para el gráfico
    const labels = Object.keys(statusCounts)
    const data = Object.values(statusCounts)

    // Asignar colores según el estado
    const backgroundColors = labels.map((status) => {
      switch (status) {
        case "Nuevo":
          return "#6c757d" // Gris
        case "En Proceso de Viabilidad":
          return "#17a2b8" // Cyan
        case "En Asignación":
          return "#007bff" // Azul
        case "En Gestión por Analista":
        case "En Gestión por Brigada":
          return "#ffc107" // Amarillo
        case "En Revisión de Verificación":
          return "#6610f2" // Violeta
        case "Generación de Informe":
          return "#20c997" // Verde agua
        case "Opción Mejorar":
          return "#fd7e14" // Naranja
        case "Documentación Errada":
          return "#dc3545" // Rojo
        case "Finalizado":
        case "Completado":
          return "#28a745" // Verde
        default:
          return "#6c757d" // Gris por defecto
      }
    })

    // Destruir gráfico existente si hay uno
    if (chartStatus) {
      chartStatus.destroy()
    }

    // Crear gráfico
    chartStatus = new Chart(ctx, {
      type: "pie",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: backgroundColors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "right",
          },
          title: {
            display: true,
            text: `Proyectos por Estado (${period === "month" ? "Último Mes" : "Último Año"})`,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || ""
                const value = context.raw || 0
                const total = context.dataset.data.reduce((a, b) => a + b, 0)
                const percentage = Math.round((value / total) * 100)
                return `${label}: ${value} (${percentage}%)`
              },
            },
          },
        },
      },
    })

    console.log("Gráfico de proyectos por estado cargado correctamente")
  } catch (error) {
    console.error("Error al cargar gráfico de proyectos por estado:", error)
  }
}

// Función para cargar gráfico de proyectos por departamento
function loadProjectsByDepartmentChart() {
  console.log("Cargando gráfico de proyectos por departamento")

  try {
    const ctx = document.getElementById("projects-by-department-chart")
    if (!ctx) {
      console.warn("Elemento projects-by-department-chart no encontrado")
      return
    }

    // Obtener proyectos del almacenamiento
    const projects = typeof Storage !== "undefined" && Storage.getProjects ? Storage.getProjects() : []
    console.log("Projects loaded for department chart:", projects.length)

    // Contar proyectos por departamento
    const departmentCounts = {}
    projects.forEach((project) => {
      const department = project.departamento || "No definido"
      departmentCounts[department] = (departmentCounts[department] || 0) + 1
    })

    // Preparar datos para el gráfico
    const labels = Object.keys(departmentCounts)
    const data = Object.values(departmentCounts)
    const backgroundColors = [
      "rgba(255, 99, 132, 0.7)",
      "rgba(54, 162, 235, 0.7)",
      "rgba(255, 206, 86, 0.7)",
      "rgba(75, 192, 192, 0.7)",
      "rgba(153, 102, 255, 0.7)",
      "rgba(255, 159, 64, 0.7)",
    ]

    // Destruir gráfico existente si hay uno
    if (chartDept) {
      chartDept.destroy()
    }

    // Crear gráfico
    chartDept = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: backgroundColors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "right",
          },
          title: {
            display: true,
            text: "Proyectos por Departamento",
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || ""
                const value = context.raw || 0
                const total = context.dataset.data.reduce((a, b) => a + b, 0)
                const percentage = Math.round((value / total) * 100)
                return `${label}: ${value} (${percentage}%)`
              },
            },
          },
        },
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index
            const department = labels[index]
            showDepartmentProjects(department, projects)
          }
        },
      },
    })

    console.log("Gráfico de proyectos por departamento cargado correctamente")
  } catch (error) {
    console.error("Error al cargar gráfico de proyectos por departamento:", error)
  }
}

// Función para mostrar proyectos de un departamento específico
function showDepartmentProjects(department, projects) {
  console.log(`Mostrando proyectos del departamento: ${department}`)

  // Filtrar proyectos por departamento
  const filteredProjects = projects.filter(
    (project) => project.departamento === department || (department === "No definido" && !project.departamento),
  )

  // Activar la pestaña de proyectos
  const projectsLink = document.querySelector('a[href="#projects"]')
  if (projectsLink) {
    projectsLink.click()

    // Esperar a que se active la pestaña y luego aplicar filtros
    setTimeout(() => {
      const filterDepartment = document.getElementById("filter-department")
      if (filterDepartment) {
        filterDepartment.value = department === "No definido" ? "" : department

        // Aplicar filtros
        const applyFiltersButton = document.getElementById("apply-filters")
        if (applyFiltersButton) {
          applyFiltersButton.click()
        }
      }
    }, 300)
  }
}

// Función para cargar gráfico de flujo de proyectos
function loadProjectsFlowChart(period = "month") {
  console.log(`Cargando gráfico de flujo de proyectos por ${period}`)

  try {
    const ctx = document.getElementById("projects-flow-chart")
    if (!ctx) {
      console.warn("Elemento projects-flow-chart no encontrado")
      return
    }

    // Obtener proyectos del almacenamiento
    const projects = typeof Storage !== "undefined" && Storage.getProjects ? Storage.getProjects() : []
    console.log("Projects loaded for flow chart:", projects.length)

    // Preparar datos según el período seleccionado
    const labels = []
    const data = []

    if (period === "day") {
      // Datos por día (últimos 7 días)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        labels.push(date.toLocaleDateString("es-ES", { day: "numeric", month: "short" }))
        data.push(0) // Inicializar contador
      }

      // Contar proyectos por día
      projects.forEach((project) => {
        if (project.fechaCreacion) {
          const projectDate = new Date(project.fechaCreacion)
          projectDate.setHours(0, 0, 0, 0)
          const diffDays = Math.floor((today - projectDate) / (1000 * 60 * 60 * 24))

          if (diffDays >= 0 && diffDays < 7) {
            data[6 - diffDays]++
          }
        }
      })
    } else if (period === "month") {
      // Datos por mes (últimos 12 meses)
      const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear()
      const currentMonth = currentDate.getMonth()

      for (let i = 11; i >= 0; i--) {
        const month = (currentMonth - i + 12) % 12
        const year = currentYear - Math.floor((i - currentMonth) / 12)
        labels.push(`${monthNames[month]} ${year}`)
        data.push(0) // Inicializar contador
      }

      // Contar proyectos por mes
      projects.forEach((project) => {
        if (project.fechaCreacion) {
          const projectDate = new Date(project.fechaCreacion)
          const projectYear = projectDate.getFullYear()
          const projectMonth = projectDate.getMonth()
          const monthDiff = currentMonth - projectMonth + 12 * (currentYear - projectYear)

          if (monthDiff >= 0 && monthDiff < 12) {
            data[11 - monthDiff]++
          }
        }
      })
    } else if (period === "year") {
      // Datos por año (últimos 5 años)
      const currentYear = new Date().getFullYear()

      for (let i = 4; i >= 0; i--) {
        const year = currentYear - i
        labels.push(year.toString())
        data.push(0) // Inicializar contador
      }

      // Contar proyectos por año
      projects.forEach((project) => {
        if (project.fechaCreacion) {
          const projectYear = new Date(project.fechaCreacion).getFullYear()
          const yearDiff = currentYear - projectYear

          if (yearDiff >= 0 && yearDiff < 5) {
            data[4 - yearDiff]++
          }
        }
      })
    }

    // Destruir gráfico existente si hay uno
    if (chartFlow) {
      chartFlow.destroy()
    }

    // Crear gráfico
    chartFlow = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Total de Proyectos",
            data: data,
            fill: false,
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            tension: 0.4,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
          title: {
            display: true,
            text: `Flujo de Proyectos (${period === "month" ? "Mensual" : period === "day" ? "Diario" : "Anual"})`,
          },
          tooltip: {
            callbacks: {
              label: (context) => `Proyectos: ${context.raw}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Cantidad de Proyectos",
            },
            ticks: {
              stepSize: 1,
              precision: 0,
            },
          },
          x: {
            title: {
              display: true,
              text: period === "month" ? "Meses" : period === "day" ? "Días" : "Años",
            },
          },
        },
      },
    })

    console.log("Gráfico de flujo de proyectos cargado correctamente")
  } catch (error) {
    console.error("Error al cargar gráfico de flujo de proyectos:", error)
  }
}

// Función para cargar todos los gráficos
function loadAllCharts() {
  loadProjectsByStatusChart()
  loadProjectsByDepartmentChart()
  loadProjectsFlowChart()
}

// Ejecutar al cargar el documento
document.addEventListener("DOMContentLoaded", () => {
  // Verificar si estamos en la página de administración
  if (document.getElementById("projects-by-status-chart")) {
    loadAllCharts()
  }
})

// Exportar funciones para que puedan ser utilizadas desde otros archivos
window.loadProjectsByStatusChart = loadProjectsByStatusChart
window.loadProjectsByDepartmentChart = loadProjectsByDepartmentChart
window.loadProjectsFlowChart = loadProjectsFlowChart
window.loadAllCharts = loadAllCharts
