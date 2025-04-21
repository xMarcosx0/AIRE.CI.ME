// Public/Js/admin.js - Funcionalidades para el panel de administración

// Add this at the beginning of the file to help with debugging
console.log("Admin.js loaded")

// Check if we're on the admin page
function isAdminPage() {
  return document.getElementById("projects-by-status-chart") !== null
}
console.log("Is admin page:", isAdminPage())

// admin.js - Funcionalidades para el panel de administración

// Variables globales
let currentUser = null
const charts = {}
const availableDates = {
  creacion: new Set(),
  inicio: new Set(),
  fin: new Set(),
}

// Inicialización cuando el DOM está cargado
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM cargado - Inicializando panel de administración")

  try {
    // Verificar que Storage está disponible
    if (typeof Storage === "undefined") {
      throw new Error("Storage object is not defined")
    }

    console.log("Storage object:", Storage)

    // Inicializar el almacenamiento
    if (Storage.init) {
      Storage.init()
      console.log("Storage inicializado correctamente")
    } else {
      console.error("Error: Storage no tiene método init")
      alert("Error crítico: No se pudo inicializar el almacenamiento. Por favor, contacte al administrador.")
      return
    }

    // Verificar si el usuario está logueado y tiene el rol correcto
    const loggedUser = Storage.getLoggedUser()
    console.log("Usuario logueado:", loggedUser)

    if (!loggedUser) {
      console.error("No hay usuario logueado, redirigiendo a login")
      window.location.href = "login.html"
      return
    } else if (loggedUser.rol !== "admin") {
      console.error(`Usuario con rol incorrecto: ${loggedUser.rol}, redirigiendo a dashboard`)
      window.location.href = "index.html"
      return
    }

    // Guardar el usuario actual en la variable global
    currentUser = loggedUser
    console.log("Usuario administrador autenticado:", currentUser)

    // Mostrar nombre del usuario en la barra de navegación
    const userNameElement = document.getElementById("user-name")
    if (userNameElement) {
      userNameElement.textContent = `${currentUser.nombre} ${currentUser.apellido || ""}`
    }

    // Inicializar componentes
    initializeComponents()

    // Cargar datos iniciales
    loadDashboardData()
    loadUsersTable()
    loadProjectsTable()
    loadNotifications()
    populatePRSTSelects()
    extractAvailableDates()
    populateDateSelectors()

    // Configurar botones de navegación
    setupBackToDashboard()

    // Configurar eventos
    setupEventListeners()

    console.log("Inicialización completada correctamente")
  } catch (error) {
    console.error("Error crítico durante la inicialización:", error)
    alert("Error crítico durante la inicialización. Por favor, recargue la página o contacte al administrador.")
  }
})

// Inicializar componentes de la interfaz
function initializeComponents() {
  console.log("Inicializando componentes de la interfaz")

  try {
    // Inicializar tooltips de Bootstrap
    if (typeof bootstrap !== "undefined" && bootstrap.Tooltip) {
      const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
      tooltipTriggerList.map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl))
      console.log("Tooltips inicializados")
    } else {
      console.warn("Bootstrap no está disponible o no tiene Tooltip")
    }

    // Inicializar popovers de Bootstrap
    if (typeof bootstrap !== "undefined" && bootstrap.Popover) {
      const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
      popoverTriggerList.map((popoverTriggerEl) => new bootstrap.Popover(popoverTriggerEl))
      console.log("Popovers inicializados")
    } else {
      console.warn("Bootstrap no está disponible o no tiene Popover")
    }

    // Inicializar nuevos componentes
    setupPasswordToggle()
    setupToggleUserStatus()
    setupDashboardCards()

    // Inicializar mapa cuando se muestre el tab
    const mapTabLink = document.querySelector('a[href="#map"]')
    if (mapTabLink) {
      mapTabLink.addEventListener("shown.bs.tab", () => {
        console.log("Pestaña de mapa activada, inicializando mapa...")
        // Esperar un breve momento para asegurar que el contenedor es visible
        setTimeout(() => {
          loadProjectsOnMap()

          // Forzar un resize del mapa para asegurar que se renderice correctamente
          if (window.projectsMap) {
            window.projectsMap.invalidateSize()
          }
        }, 200)
      })
    }

    // Agregar listeners para las pestañas
    const inProgressTab = document.getElementById("in-progress-tab")
    if (inProgressTab) {
      inProgressTab.addEventListener("shown.bs.tab", (e) => {
        loadInManagementProjects()
      })
    }

    const completedTab = document.getElementById("completed-tab")
    if (completedTab) {
      completedTab.addEventListener("shown.bs.tab", (e) => {
        loadCompletedProjects()
      })
    }

    console.log("Componentes adicionales inicializados")
  } catch (error) {
    console.error("Error al inicializar componentes:", error)
  }
}

// Configurar listeners de eventos
function setupEventListeners() {
  console.log("Configurando listeners de eventos")

  try {
    // 1. Cerrar sesión
    const logoutButton = document.getElementById("logout-button")
    if (logoutButton) {
      logoutButton.addEventListener("click", (e) => {
        e.preventDefault()
        console.log("Cerrando sesión")
        Storage.logout()
        window.location.href = "login.html"
      })
    }

    // 2. Mostrar perfil desde el navbar
    const profileButton = document.getElementById("profile-button")
    if (profileButton) {
      profileButton.addEventListener("click", (e) => {
        e.preventDefault()
        showProfileSection()
      })
    }

    // 3. Cambiar contraseña - SOLO si el usuario es admin
    const changePasswordBtn = document.getElementById("change-password-btn")
    if (changePasswordBtn) {
      if (currentUser.rol === "admin") {
        changePasswordBtn.addEventListener("click", () => {
          console.log("Mostrando modal de cambio de contraseña")
          showChangePasswordModal()
        })
      } else {
        changePasswordBtn.style.display = "none"
      }
    }

    // 5. Nuevo usuario - SOLO si el usuario es admin
    const newUserButton = document.getElementById("new-user-button")
    if (newUserButton) {
      if (currentUser.rol === "admin") {
        newUserButton.addEventListener("click", () => {
          console.log("Mostrando formulario de nuevo usuario")
          showUserModal()
        })
      } else {
        newUserButton.style.display = "none"
      }
    }

    // 6. Guardar usuario - SOLO si el usuario es admin
    const saveUserButton = document.getElementById("save-user-button")
    if (saveUserButton && currentUser.rol !== "admin") {
      saveUserButton.style.display = "none"
    }

    const clearHighlightButton = document.getElementById('clear-highlight-button');
    if (clearHighlightButton) {
        clearHighlightButton.addEventListener('click', clearHighlight);
    }

    // 10. Aplicar filtros
    const applyFiltersButton = document.getElementById("apply-filters")
    if (applyFiltersButton) {
      applyFiltersButton.addEventListener("click", () => {
        console.log("Aplicando filtros")
        filterProjects()
      })
    }

    // 11. Cambio en tipo de fecha para filtros
    const filterDateType = document.getElementById("filter-date-type")
    if (filterDateType) {
      filterDateType.addEventListener("change", () => {
        console.log("Cambiando tipo de fecha para filtros")
        populateDateSelectors()
      })
    }

    // 12. Botones de período de tiempo para gráficos
    const timePeriodButtons = document.querySelectorAll(".time-period-btn")
    timePeriodButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const period = this.getAttribute("data-period")
        const chartContainer = this.closest(".card").querySelector(".chart-container canvas")

        // Quitar clase activa de todos los botones del mismo grupo
        const buttonGroup = this.closest(".btn-group")
        if (buttonGroup) {
          buttonGroup.querySelectorAll(".time-period-btn").forEach((btn) => {
            btn.classList.remove("active")
          })
        }

        // Agregar clase activa al botón clickeado
        this.classList.add("active")

        // Actualizar el gráfico correspondiente
        if (chartContainer.id === "projects-flow-chart") {
          loadProjectsFlowChart(period)
        } else if (chartContainer.id === "projects-by-status-chart") {
          loadProjectsByStatusChart(period)
        }
      })
    })

    // 13. Refrescar gráfico de departamentos
    const refreshDepartmentChart = document.getElementById("refresh-department-chart")
    if (refreshDepartmentChart) {
      refreshDepartmentChart.addEventListener("click", () => {
        loadProjectsByDepartmentChart()
      })
    }

    // 14. Mostrar/ocultar contraseña en formulario de usuario
    const togglePassword = document.getElementById("toggle-password")
    if (togglePassword) {
      togglePassword.addEventListener("click", function () {
        const passwordInput = document.getElementById("user-password")
        if (passwordInput) {
          const type = passwordInput.getAttribute("type") === "password" ? "text" : "password"
          passwordInput.setAttribute("type", type)

          // Cambiar el icono
          const icon = this.querySelector("i")
          if (icon) {
            icon.classList.toggle("fa-eye")
            icon.classList.toggle("fa-eye-slash")
          }
        }
      })
    }

    // 15. Cambiar campos según rol de usuario
    const userRolSelect = document.getElementById("user-rol")
    if (userRolSelect) {
      userRolSelect.addEventListener("change", function () {
        const prstFields = document.getElementById("prst-fields")
        if (prstFields) {
          if (this.value === "prst") {
            prstFields.classList.remove("d-none")
          } else {
            prstFields.classList.add("d-none")
          }
        }
      })
    }

    // 16. Confirmar desactivación de usuario
    const confirmDeactivateBtn = document.getElementById("confirm-deactivate-btn")
    if (confirmDeactivateBtn) {
      confirmDeactivateBtn.addEventListener("click", () => {
        const reason = document.getElementById("deactivation-reason").value.trim()
        if (!reason) {
          alert("Por favor, escriba una razón para esta acción.")
          return
        }

        // Cambiar el estado del usuario
        const userId = document.getElementById("user-id").value
        const currentStatus = document.getElementById("user-activo").value === "true"
        document.getElementById("user-activo").value = (!currentStatus).toString()
        document.getElementById("user-activo-text").value = !currentStatus ? "Activo" : "Inactivo"

        // Actualizar texto del botón
        const toggleButton = document.getElementById("toggle-user-status-btn")
        const toggleText = document.getElementById("toggle-status-text")
        if (toggleButton && toggleText) {
          toggleText.textContent = !currentStatus ? "Desactivar Usuario" : "Activar Usuario"
          toggleButton.classList.toggle("btn-warning")
          toggleButton.classList.toggle("btn-success")
        }

        // Cerrar modal
        const deactivateModal = bootstrap.Modal.getInstance(document.getElementById("deactivateUserModal"))
        deactivateModal.hide()
      })
    }

    const notificationsDropdown = document.getElementById("notificationsDropdown")
    if (notificationsDropdown) {
      notificationsDropdown.addEventListener("click", (e) => {
        e.preventDefault()
        loadNotifications()
      })
    }

    console.log("Listeners de eventos configurados correctamente")
  } catch (error) {
    console.error("Error al configurar listeners de eventos:", error)
  }
}

// En admin.js, agregar al final de setupEventListeners()
document.getElementById("mark-all-read")?.addEventListener("click", async (e) => {
  e.preventDefault()
  await markAllNotificationsAsRead()
})

// Función para marcar todas como leídas
async function markAllNotificationsAsRead() {
  try {
    const notifications = Storage.getNotificationsByUser(currentUser.id).filter((n) => !n.leido)

    for (const notification of notifications) {
      Storage.markNotificationAsRead(notification.id)
    }

    // Recargar notificaciones
    loadNotifications()
  } catch (error) {
    console.error("Error al marcar todas las notificaciones como leídas:", error)
  }
}

// Función para mostrar/ocultar contraseña
function setupPasswordToggle() {
  const togglePasswordButton = document.getElementById("toggle-password")
  const passwordInput = document.getElementById("user-password")

  if (togglePasswordButton && passwordInput) {
    togglePasswordButton.addEventListener("click", function () {
      const type = passwordInput.getAttribute("type") === "password" ? "text" : "password"
      passwordInput.setAttribute("type", type)

      // Cambiar el icono
      const icon = this.querySelector("i")
      if (icon) {
        icon.classList.toggle("fa-eye")
        icon.classList.toggle("fa-eye-slash")
      }
    })
  }
}

// Función para configurar el botón de desactivar usuario
function setupToggleUserStatus() {
  const toggleButton = document.getElementById("toggle-user-status-btn")

  if (toggleButton) {
    toggleButton.addEventListener("click", () => {
      const userId = document.getElementById("user-id").value
      const userName =
        document.getElementById("user-nombre").value + " " + document.getElementById("user-apellido").value
      const isActive = document.getElementById("user-activo").value === "true"

      // Actualizar texto del modal
      document.getElementById("user-to-deactivate").textContent = userName
      document.getElementById("action-text").textContent = isActive ? "desactivar" : "activar"
      document.getElementById("deactivation-reason").value = ""

      // Mostrar modal
      const deactivateModal = new bootstrap.Modal(document.getElementById("deactivateUserModal"))
      deactivateModal.show()
    })
  }
}

// Función para configurar las tarjetas del dashboard
// Función para configurar las tarjetas del dashboard
function setupDashboardCards() {
  // Tarjeta de usuarios
  const usersCard = document.getElementById("show-users-card")
  if (usersCard) {
    usersCard.addEventListener("click", () => {
      // Activar la pestaña de usuarios
      const usersLink = document.querySelector('a[href="#users"]')
      if (usersLink) {
        usersLink.click()
      }
    })
  }

  // Tarjeta de proyectos
  const projectsCard = document.getElementById("show-projects-card")
  if (projectsCard) {
    projectsCard.addEventListener("click", () => {
      // Activar la pestaña de proyectos
      const projectsLink = document.querySelector('a[href="#projects"]')
      if (projectsLink) {
        projectsLink.click()

        // Limpiar filtros y mostrar todos los proyectos
        setTimeout(() => {
          document.getElementById("filter-status").value = ""
          document.getElementById("filter-department").value = ""
          document.getElementById("filter-prst").value = ""
          document.getElementById("filter-date-type").value = "creacion"
          document.getElementById("filter-date-from").value = ""
          document.getElementById("filter-date-to").value = ""
          filterProjects()
        }, 100)
      }
    })
  }

  // Tarjeta de proyectos en gestión
  const inProgressCard = document.getElementById("show-in-progress-card")
  if (inProgressCard) {
    inProgressCard.addEventListener("click", () => {
      // Activar la pestaña de proyectos
      const projectsLink = document.querySelector('a[href="#projects"]')
      if (projectsLink) {
        projectsLink.click()

        // Filtrar solo proyectos en gestión
        setTimeout(() => {
          document.getElementById("filter-status").value = ""
          document.getElementById("filter-department").value = ""
          document.getElementById("filter-prst").value = ""
          document.getElementById("filter-date-type").value = "creacion"
          document.getElementById("filter-date-from").value = ""
          document.getElementById("filter-date-to").value = ""

          // Aplicar filtro de estado para mostrar solo proyectos en gestión
          const projects = Storage.getProjects()
          const filteredProjects = projects.filter(
            (project) => project.estado !== "Finalizado" && project.estado !== "Completado",
          )

          // Actualizar tabla con proyectos filtrados
          updateProjectsTable(filteredProjects)
        }, 100)
      }
    })
  }

  // Tarjeta de proyectos finalizados
  const completedCard = document.getElementById("show-completed-card")
  if (completedCard) {
    completedCard.addEventListener("click", () => {
      // Activar la pestaña de proyectos
      const projectsLink = document.querySelector('a[href="#projects"]')
      if (projectsLink) {
        projectsLink.click()

        // Filtrar solo proyectos finalizados
        setTimeout(() => {
          document.getElementById("filter-status").value = ""
          document.getElementById("filter-department").value = ""
          document.getElementById("filter-prst").value = ""
          document.getElementById("filter-date-type").value = "creacion"
          document.getElementById("filter-date-from").value = ""
          document.getElementById("filter-date-to").value = ""

          // Aplicar filtro de estado para mostrar solo proyectos finalizados
          const projects = Storage.getProjects()
          const filteredProjects = projects.filter(
            (project) => project.estado === "Finalizado" || project.estado === "Completado",
          )

          // Actualizar tabla con proyectos filtrados
          updateProjectsTable(filteredProjects)
        }, 100)
      }
    })
  }
}

// Función auxiliar para actualizar la tabla de proyectos
function updateProjectsTable(projects) {
  const projectsTableBody = document.getElementById("projects-table-body")

  if (!projectsTableBody) {
    console.warn("Elemento projects-table-body no encontrado")
    return
  }

  // Limpiar tabla
  projectsTableBody.innerHTML = ""

  // Si no hay proyectos, mostrar mensaje
  if (projects.length === 0) {
    projectsTableBody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center">No hay proyectos para mostrar</td>
      </tr>
    `
    return
  }

  // Llenar tabla con proyectos
  projects.forEach((project) => {
    const row = document.createElement("tr")
    row.innerHTML = `
      <td>${project.id || "N/A"}</td>
      <td>${project.nombre || "Sin nombre"}</td>
      <td>${project.prstNombre || "N/A"}</td>
      <td>${project.departamento || "N/A"}</td>
      <td>${formatDate(project.fechaCreacion) || "N/A"}</td>
      <td>${formatDate(project.fechaInicio) || "N/A"}</td>
      <td>${formatDate(project.fechaFin) || "N/A"}</td>
      <td><span class="badge ${getBadgeClass(project.estado)}">${project.estado || "No definido"}</span></td>
      <td>
        <button class="btn btn-info btn-sm view-project" data-id="${project.id}" title="Ver Detalles">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn btn-secondary btn-sm history-project" data-id="${project.id}" title="Ver Historial">
          <i class="fas fa-history"></i>
        </button>
        ${project.estado !== "Finalizado" && project.estado !== "Completado" ? `` : ""}
      </td>
    `
    projectsTableBody.appendChild(row)
  })

  // Agregar eventos a los botones
  addProjectTableEventListeners(projectsTableBody)
}

// Cargar datos del dashboard
function loadDashboardData() {
  console.log("Cargando datos del dashboard")

  try {
    // Obtener datos
    const users = Storage.getUsers()
    const projects = Storage.getProjects()

    // Verificar que hay datos
    if (!users || !projects) {
      throw new Error("No se pudieron cargar los datos de usuarios o proyectos")
    }

    // Actualizar contadores
    updateCounters(users, projects)

    // Cargar gráficos
    loadCharts(projects)

    console.log("Datos del dashboard cargados correctamente")
  } catch (error) {
    console.error("Error al cargar datos del dashboard:", error)
    alert(`Error al cargar el dashboard: ${error.message}. Por favor, recargue la página.`)
  }
}

// Función para actualizar contadores
function updateCounters(users, projects) {
  console.log("Actualizando contadores")

  try {
    // Total de usuarios
    const totalUsersElement = document.getElementById("total-users")
    if (totalUsersElement) {
      totalUsersElement.textContent = users.length
    }

    // Total de proyectos
    const totalProjectsElement = document.getElementById("total-projects")
    if (totalProjectsElement) {
      totalProjectsElement.textContent = projects.length
    }

    // Proyectos en gestión
    const inProgressProjectsElement = document.getElementById("in-progress-projects")
    if (inProgressProjectsElement) {
      const inProgressCount = projects.filter(
        (project) => project.estado !== "Finalizado" && project.estado !== "Completado",
      ).length
      inProgressProjectsElement.textContent = inProgressCount
    }

    // Proyectos finalizados
    const completedProjectsElement = document.getElementById("completed-projects")
    if (completedProjectsElement) {
      const completedCount = projects.filter(
        (project) => project.estado === "Finalizado" || project.estado === "Completado",
      ).length
      completedProjectsElement.textContent = completedCount
    }

    console.log("Contadores actualizados correctamente")
  } catch (error) {
    console.error("Error al actualizar contadores:", error)
  }
}

// Función para cargar gráficos
// En admin.js, modificar la función loadCharts:
function loadCharts(projects) {
  console.log("Cargando gráficos")

  try {
    // Verificar que Chart está disponible
    if (typeof Chart === "undefined") {
      console.error("Chart.js no está disponible")
      return
    }

    // Cargar gráfico de proyectos por estado
    if (typeof loadProjectsByStatusChart === "function") {
      loadProjectsByStatusChart("month")
    } else {
      console.error("loadProjectsByStatusChart no es una función")
    }

    // Cargar gráfico de proyectos por departamento
    if (typeof loadProjectsByDepartmentChart === "function") {
      loadProjectsByDepartmentChart()
    }

    // Cargar gráfico de flujo de proyectos
    if (typeof loadProjectsFlowChart === "function") {
      loadProjectsFlowChart("month")
    }

    console.log("Gráficos cargados correctamente")
  } catch (error) {
    console.error("Error al cargar gráficos:", error)
  }
}

// Función para cargar la tabla de usuarios
function loadUsersTable() {
  console.log("Cargando tabla de usuarios")

  try {
    const users = Storage.getUsers()
    const usersTableBody = document.getElementById("users-table-body")

    if (!usersTableBody) {
      console.warn("Elemento users-table-body no encontrado")
      return
    }

    // Limpiar tabla
    usersTableBody.innerHTML = ""

    // Si no hay usuarios, mostrar mensaje
    if (users.length === 0) {
      usersTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">No hay usuarios para mostrar</td>
                </tr>
            `
      return
    }

    // Llenar tabla con usuarios
    users.forEach((user) => {
      const row = document.createElement("tr")
      row.innerHTML = `
                <td>${user.id || "N/A"}</td>
                <td>${user.nombre || ""} ${user.apellido || ""}</td>
                <td>${user.usuario || "N/A"}</td>
                <td>${user.correo || "N/A"}</td>
                <td>${user.rol || "N/A"}</td>
                <td><span class="badge ${user.activo ? "bg-success" : "bg-danger"}">${
                  user.activo ? "Activo" : "Inactivo"
                }</span></td>
                <td>
                    <button class="btn btn-info btn-sm view-user" data-id="${user.id}" title="Ver Detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-warning btn-sm edit-user" data-id="${user.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `
      usersTableBody.appendChild(row)
    })

    // Agregar eventos a los botones de ver y editar
    const viewButtons = usersTableBody.querySelectorAll(".view-user")
    viewButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const userId = this.getAttribute("data-id")
        viewUserDetails(userId)
      })
    })

    const editButtons = usersTableBody.querySelectorAll(".edit-user")
    editButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const userId = this.getAttribute("data-id")
        showUserModal(userId)
      })
    })

    console.log("Tabla de usuarios cargada correctamente")
  } catch (error) {
    console.error("Error al cargar tabla de usuarios:", error)
  }
}

// Función para cargar la tabla de proyectos
function loadProjectsTable() {
  console.log("Cargando tabla de proyectos")

  try {
    const projects = Storage.getProjects()
    const projectsTableBody = document.getElementById("projects-table-body")

    if (!projectsTableBody) {
      console.warn("Elemento projects-table-body no encontrado")
      return
    }

    // Limpiar tabla
    projectsTableBody.innerHTML = ""

    // Si no hay proyectos, mostrar mensaje
    if (projects.length === 0) {
      projectsTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">No hay proyectos para mostrar</td>
                </tr>
            `
      return
    }

    // Llenar tabla con proyectos
    projects.forEach((project) => {
      const row = document.createElement("tr")
      row.innerHTML = `
                <td>${project.id || "N/A"}</td>
                <td>${project.nombre || "Sin nombre"}</td>
                <td>${project.prstNombre || "N/A"}</td>
                <td>${project.departamento || "N/A"}</td>
                <td>${formatDate(project.fechaCreacion) || "N/A"}</td>
                <td>${formatDate(project.fechaInicio) || "N/A"}</td>
                <td>${formatDate(project.fechaFin) || "N/A"}</td>
                <td><span class="badge ${getBadgeClass(project.estado)}">${project.estado || "No definido"}</span></td>
                <td>
                    <button class="btn btn-info btn-sm view-project" data-id="${project.id}" title="Ver Detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm history-project" data-id="${project.id}" title="Ver Historial">
                        <i class="fas fa-history"></i>
                    
                </td>
            `
      projectsTableBody.appendChild(row)
    })

    // Agregar eventos a los botones
    addProjectTableEventListeners(projectsTableBody)

    console.log("Tabla de proyectos cargada correctamente")
  } catch (error) {
    console.error("Error al cargar tabla de proyectos:", error)
  }
}

// Función para cargar proyectos en gestión
function loadInManagementProjects() {
  console.log("Cargando proyectos en gestión")

  try {
    // Definir los estados que se consideran "en gestión"
    const estadosEnGestion = [
      "Nuevo",
      "En Proceso de Viabilidad",
      "En Asignación",
      "En Gestión por Analista",
      "En Gestión por Brigada",
      "En Revisión de Verificación",
      "Generación de Informe",
      "Opción Mejorar",
      "Documentación Errada",
    ]

    // Obtener todos los proyectos con los estados especificados
    const projects = Storage.getProjects().filter(
      (project) =>
        estadosEnGestion.includes(project.estado) ||
        (project.estado !== "Finalizado" && project.estado !== "Completado"),
    )

    const tableBody = document.getElementById("in-progress-table-body")

    if (!tableBody) {
      console.warn("Elemento in-progress-table-body no encontrado")
      return
    }

    // Limpiar tabla
    tableBody.innerHTML = ""

    // Si no hay proyectos, mostrar mensaje
    if (projects.length === 0) {
      tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">No hay proyectos en gestión</td>
                </tr>
            `
      return
    }

    // Llenar tabla con proyectos
    projects.forEach((project) => {
      const row = document.createElement("tr")
      row.innerHTML = `
                <td>${project.id || "N/A"}</td>
                <td>${project.nombre || "Sin nombre"}</td>
                <td>${project.prstNombre || "N/A"}</td>
                <td>${project.departamento || "N/A"}</td>
                <td>${formatDate(project.fechaCreacion) || "N/A"}</td>
                <td>${formatDate(project.fechaInicio) || "N/A"}</td>
                <td>${formatDate(project.fechaFin) || "N/A"}</td>
                <td><span class="badge ${getBadgeClass(project.estado)}">${project.estado || "No definido"}</span></td>
                <td>
                    <button class="btn btn-info btn-sm view-project" data-id="${project.id}" title="Ver Detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm history-project" data-id="${project.id}" title="Ver Historial">
                        <i class="fas fa-history"></i>
                    </button>
                    <button class="btn btn-primary btn-sm change-status-project" data-id="${
                      project.id
                    }" title="Cambiar Estado">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                </td>
            `
      tableBody.appendChild(row)
    })

    // Agregar eventos a los botones
    addProjectTableEventListeners(tableBody)

    console.log("Proyectos en gestión cargados correctamente")
  } catch (error) {
    console.error("Error al cargar proyectos en gestión:", error)
  }
}

// Función para cargar proyectos finalizados
function loadCompletedProjects() {
  console.log("Cargando proyectos finalizados")

  try {
    const projects = Storage.getProjects().filter(
      (project) => project.estado === "Finalizado" || project.estado === "Completado",
    )

    const tableBody = document.getElementById("completed-table-body")

    if (!tableBody) {
      console.warn("Elemento completed-table-body no encontrado")
      return
    }

    // Limpiar tabla
    tableBody.innerHTML = ""

    // Si no hay proyectos, mostrar mensaje
    if (projects.length === 0) {
      tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">No hay proyectos finalizados para mostrar</td>
                </tr>
            `
      return
    }

    // Llenar tabla con proyectos
    projects.forEach((project) => {
      const row = document.createElement("tr")
      row.innerHTML = `
                <td>${project.id || "N/A"}</td>
                <td>${project.nombre || "Sin nombre"}</td>
                <td>${project.prstNombre || "N/A"}</td>
                <td>${project.departamento || "N/A"}</td>
                <td>${formatDate(project.fechaCreacion) || "N/A"}</td>
                <td>${formatDate(project.fechaInicio) || "N/A"}</td>
                <td>${formatDate(project.fechaFin) || "N/A"}</td>
                <td><span class="badge ${getBadgeClass(project.estado)}">${project.estado || "No definido"}</span></td>
                <td>
                    <button class="btn btn-info btn-sm view-project" data-id="${project.id}" title="Ver Detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm history-project" data-id="${project.id}" title="Ver Historial">
                        <i class="fas fa-history"></i>
                    </button>
                </td>
            `
      tableBody.appendChild(row)
    })

    // Agregar eventos a los botones
    addProjectTableEventListeners(tableBody)

    console.log("Proyectos finalizados cargados correctamente")
  } catch (error) {
    console.error("Error al cargar proyectos finalizados:", error)
  }
}

// Función para agregar eventos a los botones de las tablas de proyectos
function addProjectTableEventListeners(tableElement) {
  // Agregar eventos a los botones de ver detalles
  const viewButtons = tableElement.querySelectorAll(".view-project")
  viewButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const projectId = this.getAttribute("data-id")
      viewProjectDetails(projectId)
    })
  })

  // Agregar eventos a los botones de historial
  const historyButtons = tableElement.querySelectorAll(".history-project")
  historyButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const projectId = this.getAttribute("data-id")
      showProjectHistory(projectId)
    })
  })

  // Agregar eventos a los botones de cambio de estado - SOLO si el usuario es admin
  const changeStatusButtons = tableElement.querySelectorAll(".change-status-project")
  if (changeStatusButtons.length > 0) {
    changeStatusButtons.forEach((button) => {
      if (currentUser.rol === "admin") {
        button.addEventListener("click", function () {
          const projectId = this.getAttribute("data-id")
          showChangeStatusModal(projectId)
        })
      } else {
        button.style.display = "none"
      }
    })
  }
}
// Función para cargar las notificaciones
async function loadNotifications() {
  console.log("Cargando notificaciones mejoradas")

  try {
    const notifications = Storage.getNotificationsByUser(currentUser.id) || []
    const notificationsList = document.getElementById("notifications-list")
    const notificationBadge = document.getElementById("notification-badge")

    if (!notificationsList || !notificationBadge) {
      console.warn("Elementos de notificaciones no encontrados")
      return
    }

    // Limpiar lista
    notificationsList.innerHTML = ""

    // Contar notificaciones no leídas
    const unreadCount = notifications.filter((n) => !n.leido).length

    // Actualizar badge
    notificationBadge.textContent = unreadCount > 9 ? "9+" : unreadCount.toString()
    notificationBadge.classList.toggle("d-none", unreadCount === 0)

    // Si no hay notificaciones, mostrar mensaje
    if (notifications.length === 0) {
      notificationsList.innerHTML = `
        <li class="dropdown-item text-center py-3">No tienes notificaciones</li>
      `
      return
    }

    // Ordenar notificaciones por fecha (más recientes primero)
    notifications.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

    // Mostrar solo las 10 notificaciones más recientes
    const recentNotifications = notifications.slice(0, 10)

    // Llenar lista con notificaciones mejoradas
    recentNotifications.forEach((notification) => {
      const item = document.createElement("li")
      item.className = `dropdown-item notification-item ${notification.leido ? "" : "unread"}`

      let messageContent = `
        <div class="notification-header d-flex justify-content-between">
          <strong class="notification-title">${notification.titulo || "Notificación"}</strong>
          <small class="notification-time">${formatDateTime(notification.fecha)}</small>
        </div>
        <div class="notification-body">
          <p class="notification-message mb-1">${notification.mensaje}</p>
      `

      // Mostrar información de asignación si existe
      if (notification.asignadoA) {
        messageContent += `
          <div class="assignment-info small text-muted">
            <i class="fas fa-user-check me-1"></i>
            Asignado a: ${notification.asignadoA} (${notification.asignadoRol || "Sin rol"})
          </div>
        `
      }

      messageContent += `</div>`

      item.innerHTML = messageContent

      // Manejar el clic en la notificación
      item.addEventListener("click", async (e) => {
        e.preventDefault()
        e.stopPropagation()

        // Marcar como leída si no lo está
        if (!notification.leido) {
          await markNotificationAsRead(notification.id)
          item.classList.remove("unread")
        }

        // Si es una notificación de proyecto, mostrar el proyecto
        if (notification.projectId) {
          viewProjectDetails(notification.projectId)
        }
      })

      notificationsList.appendChild(item)
    })

    console.log("Notificaciones mejoradas cargadas correctamente")
  } catch (error) {
    console.error("Error al cargar notificaciones mejoradas:", error)
  }
}

// Función mejorada para marcar notificaciones como leídas
async function markNotificationAsRead(notificationId) {
  try {
    Storage.markNotificationAsRead(notificationId)

    // Actualizar el contador de notificaciones no leídas
    const unreadCount = Storage.getNotificationsByUser(currentUser.id).filter((n) => !n.leido).length

    const notificationBadge = document.getElementById("notification-badge")
    if (notificationBadge) {
      notificationBadge.textContent = unreadCount > 9 ? "9+" : unreadCount.toString()
      notificationBadge.classList.toggle("d-none", unreadCount === 0)
    }
  } catch (error) {
    console.error("Error al marcar notificación como leída:", error)
  }
}

// Función para popular los select de PRST
function populatePRSTSelects() {
  console.log("Populating PRST selects")

  try {
    const prstList = Storage.getPRSTList()
    const projectPrstSelect = document.getElementById("project-prst")
    const filterPrstSelect = document.getElementById("filter-prst")

    if (projectPrstSelect) {
      // Limpiar select
      projectPrstSelect.innerHTML = ""

      // Agregar opción por defecto
      const defaultOption = document.createElement("option")
      defaultOption.value = ""
      defaultOption.textContent = "Seleccione un PRST"
      projectPrstSelect.appendChild(defaultOption)

      // Llenar select con PRSTs
      prstList.forEach((prst) => {
        const option = document.createElement("option")
        option.value = prst.nombreCorto
        option.textContent = prst.nombreCorto
        projectPrstSelect.appendChild(option)
      })
    }

    if (filterPrstSelect) {
      // Limpiar select
      filterPrstSelect.innerHTML = ""

      // Agregar opción por defecto
      const defaultOption = document.createElement("option")
      defaultOption.value = ""
      defaultOption.textContent = "Todos"
      filterPrstSelect.appendChild(defaultOption)

      // Llenar select con PRSTs
      prstList.forEach((prst) => {
        const option = document.createElement("option")
        option.value = prst.nombreCorto
        option.textContent = prst.nombreCorto
        filterPrstSelect.appendChild(option)
      })
    }

    console.log("PRST selects populados correctamente")
  } catch (error) {
    console.error("Error al popular PRST selects:", error)
  }
}

// Función para extraer las fechas disponibles de los proyectos
function extractAvailableDates() {
  console.log("Extrayendo fechas disponibles de los proyectos")

  try {
    const projects = Storage.getProjects()
    const availableDates = {
      creacion: new Set(),
      inicio: new Set(),
      fin: new Set(),
    }

    // Extraer fechas
    projects.forEach((project) => {
      if (project.fechaCreacion) {
        availableDates.creacion.add(project.fechaCreacion)
      }
      if (project.fechaInicio) {
        availableDates.inicio.add(project.fechaInicio)
      }
      if (project.fechaFin) {
        availableDates.fin.add(project.fechaFin)
      }
    })

    // Guardar en variable global
    window.availableDates = availableDates

    console.log("Fechas disponibles extraídas correctamente")
  } catch (error) {
    console.error("Error al extraer fechas disponibles:", error)
  }
}

// Función para popular los select de fechas
function populateDateSelectors() {
  console.log("Populating date selectors")

  try {
    const filterDateType = document.getElementById("filter-date-type")
    const filterDateFrom = document.getElementById("filter-date-from")
    const filterDateTo = document.getElementById("filter-date-to")

    if (!filterDateType || !filterDateFrom || !filterDateTo) {
      console.warn("Uno o más elementos de filtro de fecha no encontrados")
      return
    }

    const dateType = filterDateType.value
    let dates = []

    if (!window.availableDates) {
      extractAvailableDates()
    }

    switch (dateType) {
      case "creacion":
        dates = Array.from(window.availableDates.creacion)
        break
      case "inicio":
        dates = Array.from(window.availableDates.inicio)
        break
      case "fin":
        dates = Array.from(window.availableDates.fin)
        break
      default:
        console.warn("Tipo de fecha no válido")
        return
    }

    // Ordenar fechas
    dates.sort()

    // Limpiar selectores
    filterDateFrom.innerHTML = ""
    filterDateTo.innerHTML = ""

    // Agregar opción por defecto
    const defaultOptionFrom = document.createElement("option")
    defaultOptionFrom.value = ""
    defaultOptionFrom.textContent = "Desde"
    filterDateFrom.appendChild(defaultOptionFrom)

    const defaultOptionTo = document.createElement("option")
    defaultOptionTo.value = ""
    defaultOptionTo.textContent = "Hasta"
    filterDateTo.appendChild(defaultOptionTo)

    // Llenar selectores con fechas
    dates.forEach((date) => {
      const optionFrom = document.createElement("option")
      optionFrom.value = date
      optionFrom.textContent = formatDate(date)
      filterDateFrom.appendChild(optionFrom)

      const optionTo = document.createElement("option")
      optionTo.value = date
      optionTo.textContent = formatDate(date)
      filterDateTo.appendChild(optionTo)
    })

    console.log("Selectores de fecha populados correctamente")
  } catch (error) {
    console.error("Error al popular selectores de fecha:", error)
  }
}

// Función para filtrar proyectos
function filterProjects() {
  console.log("Filtrando proyectos")

  try {
    const filterDateType = document.getElementById("filter-date-type")
    const filterDateFrom = document.getElementById("filter-date-from")
    const filterDateTo = document.getElementById("filter-date-to")
    const filterStatus = document.getElementById("filter-status")
    const filterPRST = document.getElementById("filter-prst")
    const filterDepartment = document.getElementById("filter-department")

    if (!filterDateType || !filterDateFrom || !filterDateTo || !filterStatus || !filterPRST || !filterDepartment) {
      console.warn("Elementos de filtro no encontrados")
      return
    }

    // Obtener todos los proyectos
    let projects = Storage.getProjects()

    // Filtrar por tipo de fecha
    const dateType = filterDateType.value
    const dateFrom = filterDateFrom.value
    const dateTo = filterDateTo.value

    if (dateType && dateFrom && dateTo) {
      projects = projects.filter((project) => {
        let projectDate = null

        switch (dateType) {
          case "creacion":
            projectDate = project.fechaCreacion
            break
          case "inicio":
            projectDate = project.fechaInicio
            break
          case "fin":
            projectDate = project.fechaFin
            break
          default:
            return true
        }

        if (!projectDate) return false
        return projectDate >= dateFrom && projectDate <= dateTo
      })
    }

    // Filtrar por estado si está seleccionado
    const status = filterStatus.value
    if (status) {
      projects = projects.filter((project) => project.estado === status)
    }

    // Filtrar por PRST si está seleccionado
    const prst = filterPRST.value
    if (prst) {
      projects = projects.filter((project) => project.prstNombre === prst)
    }

    // Filtrar por departamento si está seleccionado
    const department = filterDepartment.value
    if (department) {
      projects = projects.filter((project) => project.departamento === department)
    }

    // Actualizar tabla de proyectos con los resultados filtrados
    const projectsTableBody = document.getElementById("projects-table-body")

    if (!projectsTableBody) {
      console.warn("Elemento projects-table-body no encontrado")
      return
    }

    // Limpiar tabla
    projectsTableBody.innerHTML = ""

    // Si no hay proyectos, mostrar mensaje
    if (projects.length === 0) {
      projectsTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">No hay proyectos que coincidan con los filtros</td>
                </tr>
            `
      return
    }

    // Llenar tabla con proyectos filtrados
    projects.forEach((project) => {
      const row = document.createElement("tr")
      row.innerHTML = `
                <td>${project.id || "N/A"}</td>
                <td>${project.nombre || "Sin nombre"}</td>
                <td>${project.prstNombre || "N/A"}</td>
                <td>${project.departamento || "N/A"}</td>
                <td>${formatDate(project.fechaCreacion) || "N/A"}</td>
                <td>${formatDate(project.fechaInicio) || "N/A"}</td>
                <td>${formatDate(project.fechaFin) || "N/A"}</td>
                <td><span class="badge ${getBadgeClass(project.estado)}">${project.estado || "No definido"}</span></td>
                <td>
                    <button class="btn btn-info btn-sm view-project" data-id="${project.id}" title="Ver Detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm history-project" data-id="${project.id}" title="Ver Historial">
                        <i class="fas fa-history"></i>
                    </button>
                </td>
            `
      projectsTableBody.appendChild(row)
    })

    // Agregar eventos a los botones
    addProjectTableEventListeners(projectsTableBody)

    console.log("Proyectos filtrados correctamente")
  } catch (error) {
    console.error("Error al filtrar proyectos:", error)
    alert("Error al filtrar proyectos. Por favor, inténtelo de nuevo.")
  }
}

// Función para mostrar el modal de usuario
function showUserModal(userId = null) {
  console.log(`Mostrando modal de usuario para el usuario con ID: ${userId}`)

  try {
    const userModal = document.getElementById("userModal")
    const userTitle = document.getElementById("user-title")
    const userIdInput = document.getElementById("user-id")
    const userNombreInput = document.getElementById("user-nombre")
    const userApellidoInput = document.getElementById("user-apellido")
    const userUsuarioInput = document.getElementById("user-usuario")
    const userEmailInput = document.getElementById("user-email")
    const userPasswordInput = document.getElementById("user-password")
    const userRolInput = document.getElementById("user-rol")
    const userActivoInput = document.getElementById("user-activo")
    const userActivoTextInput = document.getElementById("user-activo-text")
    const toggleUserStatusBtn = document.getElementById("toggle-user-status-btn")
    const toggleStatusText = document.getElementById("toggle-status-text")
    const prstFields = document.getElementById("prst-fields")

    // Limpiar campos
    userIdInput.value = ""
    userNombreInput.value = ""
    userApellidoInput.value = ""
    userUsuarioInput.value = ""
    userEmailInput.value = ""
    userPasswordInput.value = ""
    userRolInput.value = "admin"
    userActivoInput.value = "true"
    userActivoTextInput.value = "Activo"

    // Ocultar campos específicos de PRST
    prstFields.classList.add("d-none")

    // Si se está editando un usuario, cargar los datos
    if (userId) {
      const user = Storage.getUserById(userId)

      if (!user) {
        console.error(`No se encontró el usuario con ID: ${userId}`)
        alert("No se encontró el usuario. Por favor, recargue la página.")
        return
      }

      userTitle.textContent = "Editar Usuario"
      userIdInput.value = user.id
      userNombreInput.value = user.nombre
      userApellidoInput.value = user.apellido
      userUsuarioInput.value = user.usuario
      userEmailInput.value = user.correo
      userRolInput.value = user.rol
      userActivoInput.value = user.activo.toString()
      userActivoTextInput.value = user.activo ? "Activo" : "Inactivo"

      // Mostrar campos adicionales para PRST
      if (user.rol === "prst") {
        prstFields.classList.remove("d-none")
        document.getElementById("user-prst-nombre").value = user.nombrePRST || ""
        document.getElementById("user-cedula").value = user.cedula || ""
        document.getElementById("user-matricula").value = user.matriculaProfesional || ""
        document.getElementById("user-celular").value = user.celular || ""
        document.getElementById("user-direccion").value = user.direccion || ""
        document.getElementById("user-barrio").value = user.barrio || ""
        document.getElementById("user-ciudad").value = user.ciudad || ""
      }

      // Cambiar texto del botón
      if (toggleUserStatusBtn && toggleStatusText) {
        toggleStatusText.textContent = user.activo ? "Desactivar Usuario" : "Activar Usuario"
        if (user.activo) {
          toggleUserStatusBtn.classList.remove("btn-success")
          toggleUserStatusBtn.classList.add("btn-warning")
        } else {
          toggleUserStatusBtn.classList.remove("btn-warning")
          toggleUserStatusBtn.classList.add("btn-success")
        }
      }
    } else {
      userTitle.textContent = "Nuevo Usuario"
      if (toggleUserStatusBtn && toggleStatusText) {
        toggleStatusText.textContent = "Desactivar Usuario"
        toggleUserStatusBtn.classList.remove("btn-success")
        toggleUserStatusBtn.classList.add("btn-warning")
      }
    }

    // Mostrar modal
    const modal = new bootstrap.Modal(userModal)
    modal.show()

    console.log("Modal de usuario mostrado correctamente")
  } catch (error) {
    console.error("Error al mostrar modal de usuario:", error)
    alert("Error al mostrar el formulario. Por favor, recargue la página.")
  }
}

// Función para guardar un usuario
function saveUser() {
  console.log("Guardando usuario")

  try {
    const userIdInput = document.getElementById("user-id")
    const userNombreInput = document.getElementById("user-nombre")
    const userApellidoInput = document.getElementById("user-apellido")
    const userUsuarioInput = document.getElementById("user-usuario")
    const userEmailInput = document.getElementById("user-email")
    const userPasswordInput = document.getElementById("user-password")
    const userRolInput = document.getElementById("user-rol")
    const userActivoInput = document.getElementById("user-activo")

    const userId = userIdInput.value
    const userNombre = userNombreInput.value
    const userApellido = userApellidoInput.value
    const userUsuario = userUsuarioInput.value
    const userEmail = userEmailInput.value
    const userPassword = userPasswordInput.value
    const userRol = userRolInput.value
    const userActivo = userActivoInput.value === "true"

    // Validar campos
    if (!userNombre || !userApellido || !userUsuario || !userEmail || !userRol) {
      alert("Por favor, complete todos los campos obligatorios.")
      return
    }

    // Crear objeto usuario
    const user = {
      id: userId || generateId(),
      nombre: userNombre,
      apellido: userApellido,
      usuario: userUsuario,
      correo: userEmail,
      rol: userRol,
      activo: userActivo,
    }

    // Si es un nuevo usuario, agregar contraseña
    if (!userId) {
      if (!userPassword) {
        alert("Por favor, ingrese una contraseña para el nuevo usuario.")
        return
      }
      user.password = userPassword
    } else {
      // Si se está editando un usuario, mantener la contraseña existente si no se proporciona una nueva
      const existingUser = Storage.getUserById(userId)
      user.password = userPassword || existingUser.password
    }

    // Agregar campos específicos para PRST
    if (userRol === "prst") {
      user.nombrePRST = document.getElementById("user-prst-nombre").value
      user.cedula = document.getElementById("user-cedula").value
      user.matriculaProfesional = document.getElementById("user-matricula").value
      user.celular = document.getElementById("user-celular").value
      user.direccion = document.getElementById("user-direccion").value
      user.barrio = document.getElementById("user-barrio").value
      user.ciudad = document.getElementById("user-ciudad").value
    }

    // Guardar usuario
    Storage.saveUser(user)

    // Cerrar modal
    const userModal = bootstrap.Modal.getInstance(document.getElementById("userModal"))
    userModal.hide()

    // Recargar tabla de usuarios
    loadUsersTable()

    console.log("Usuario guardado correctamente")
    alert("Usuario guardado correctamente.")
  } catch (error) {
    console.error("Error al guardar usuario:", error)
    alert("Error al guardar el usuario. Por favor, inténtelo de nuevo.")
  }
}

// Función para ver detalles de un usuario
function viewUserDetails(userId) {
  console.log(`Mostrando detalles del usuario con ID: ${userId}`)

  try {
    const user = Storage.getUserById(userId)

    if (!user) {
      console.error(`No se encontró el usuario con ID: ${userId}`)
      alert("No se encontró el usuario. Por favor, recargue la página.")
      return
    }

    // Mostrar modal de perfil con los datos del usuario
    const profileModal = document.getElementById("profileModal")
    const profileNombre = document.getElementById("profile-nombre")
    const profileApellido = document.getElementById("profile-apellido")
    const profileUsuario = document.getElementById("profile-usuario")
    const profileCorreo = document.getElementById("profile-correo")
    const profileRol = document.getElementById("profile-rol")

    if (!profileModal || !profileNombre || !profileApellido || !profileUsuario || !profileCorreo || !profileRol) {
      console.error("Elementos del perfil no encontrados")
      return
    }

    // Llenar datos del perfil
    profileNombre.textContent = user.nombre || "No disponible"
    profileApellido.textContent = user.apellido || "No disponible"
    profileUsuario.textContent = user.usuario || "No disponible"
    profileCorreo.textContent = user.correo || "No disponible"
    profileRol.textContent = user.rol || "No disponible"

    // Mostrar modal
    const modal = new bootstrap.Modal(profileModal)
    modal.show()

    console.log("Detalles del usuario mostrados correctamente")
  } catch (error) {
    console.error("Error al mostrar detalles del usuario:", error)
    alert("Error al mostrar los detalles del usuario. Por favor, inténtelo de nuevo.")
  }
}


// Función para mostrar los detalles de un proyecto
function viewProjectDetails(projectId) {
  console.log(`Mostrando detalles del proyecto con ID: ${projectId}`)

  try {
    const project = Storage.getProjectById(projectId)

    if (!project) {
      console.error(`No se encontró el proyecto con ID: ${projectId}`)
      alert("No se encontró el proyecto. Por favor, recargue la página.")
      return
    }

    // Obtener referencias a los elementos del modal
    const projectDetailsModal = document.getElementById("modalDetalleProyecto")
    const detailProjectId = document.getElementById("detalleProyectoId")
    const detailProjectNombre = document.getElementById("detalleProyectoNombre")
    const detailProjectPrst = document.getElementById("detalleProyectoPrst")
    const detailProjectDepartamento = document.getElementById("detalleProyectoDepartamento")
    const detailProjectMunicipio = document.getElementById("detalleProyectoMunicipio")
    const detailProjectBarrios = document.getElementById("detalleProyectoBarrios")
    const detailProjectFechaCreacion = document.getElementById("detalleProyectoFechaCreacion")
    const detailProjectFechaInicio = document.getElementById("detalleProyectoFechaInicio")
    const detailProjectFechaFin = document.getElementById("detalleProyectoFechaFin")
    const detailProjectEstado = document.getElementById("detalleProyectoEstado")
    const detailProjectPostes = document.getElementById("detalleProyectoPostes")
    const detailProjectTipoSolicitud = document.getElementById("detalleProyectoTipoSolicitud")
    const detailProjectDocumentacion = document.getElementById("detalleProyectoDocumentacion")

    // Llenar datos básicos
    if (detailProjectId) detailProjectId.textContent = project.id || "N/A"
    if (detailProjectNombre) detailProjectNombre.textContent = project.nombre || "Sin nombre"
    if (detailProjectPrst) detailProjectPrst.textContent = project.prstNombre || "N/A"
    if (detailProjectDepartamento) detailProjectDepartamento.textContent = project.departamento || "N/A"
    if (detailProjectMunicipio) detailProjectMunicipio.textContent = project.municipio || "N/A"
    if (detailProjectBarrios) detailProjectBarrios.textContent = project.barrios ? project.barrios.join(", ") : "N/A"
    if (detailProjectFechaCreacion) detailProjectFechaCreacion.textContent = formatDate(project.fechaCreacion) || "N/A"
    if (detailProjectFechaInicio) detailProjectFechaInicio.textContent = formatDate(project.fechaInicio) || "N/A"
    if (detailProjectFechaFin) detailProjectFechaFin.textContent = formatDate(project.fechaFin) || "N/A"
    if (detailProjectEstado) detailProjectEstado.textContent = project.estado || "No definido"
    if (detailProjectPostes) detailProjectPostes.textContent = project.numPostes || "N/A"
    if (detailProjectTipoSolicitud) detailProjectTipoSolicitud.textContent = project.tipoSolicitud || "N/A"

    // Mostrar documentación si existe
    if (detailProjectDocumentacion) {
      if (project.documentacion && project.documentacion.length > 0) {
        let html = '<div class="documentacion-list">'
        project.documentacion.forEach((doc) => {
          html += `
            <div class="documento-item mb-2 p-2 border rounded">
              <strong>${doc.tipo || "Documento"}:</strong> 
              <a href="${doc.url || "#"}" target="_blank" class="ms-2">${doc.nombre || "Ver documento"}</a>
              ${doc.observaciones ? `<div class="text-muted small mt-1">${doc.observaciones}</div>` : ""}
            </div>
          `
        })
        html += "</div>"
        detailProjectDocumentacion.innerHTML = html
      } else {
        detailProjectDocumentacion.innerHTML = '<div class="text-muted">No hay documentación adjunta</div>'
      }
    }

    // Mostrar modal
    const modal = new bootstrap.Modal(projectDetailsModal)
    modal.show()

    console.log("Detalles del proyecto mostrados correctamente")
  } catch (error) {
    console.error("Error al mostrar detalles del proyecto:", error)
    alert("Error al mostrar los detalles del proyecto. Por favor, inténtelo de nuevo.")
  }
}

// Función para mostrar el historial del proyecto
function showProjectHistory(projectId) {
  console.log(`Mostrando historial del proyecto: ${projectId}`)

  try {
    const project = Storage.getProjectById(projectId)
    if (!project) {
      console.error(`Proyecto no encontrado: ${projectId}`)
      alert("No se encontró el proyecto solicitado")
      return
    }

    // Crear historial si no existe o está vacío
    if (!project.historial || project.historial.length === 0) {
      console.log("Creando historial para el proyecto")
      project.historial = []

      // Agregar estado inicial de creación
      project.historial.push({
        estado: "Nuevo",
        fecha: project.fechaCreacion,
        usuario: project.creadorNombre || "Sistema",
        rol: "PRST",
        descripcion: "Proyecto creado y enviado a revisión",
      })

      // Agregar otros estados según las fechas registradas
      if (project.fechaEnvio) {
        project.historial.push({
          estado: "En Proceso de Viabilidad",
          fecha: project.fechaEnvio,
          usuario: project.creadorNombre || "Sistema",
          rol: "PRST",
          descripcion: "Proyecto enviado a revisión",
        })
      }

      if (project.fechaRechazo) {
        project.historial.push({
          estado: "Documentación Errada",
          fecha: project.fechaRechazo,
          usuario: project.ejecutivaNombre || "Ejecutiva",
          rol: "Ejecutiva",
          descripcion: project.observacionesEjecutiva || "Proyecto rechazado por documentación incorrecta",
        })
      }

      if (project.fechaReenvio) {
        project.historial.push({
          estado: "En Proceso de Viabilidad",
          fecha: project.fechaReenvio,
          usuario: project.creadorNombre || "Sistema",
          rol: "PRST",
          descripcion: "Proyecto reenviado a revisión después de correcciones",
        })
      }

      if (project.fechaAprobacion) {
        project.historial.push({
          estado: "En Asignación",
          fecha: project.fechaAprobacion,
          usuario: project.ejecutivaNombre || "Ejecutiva",
          rol: "Ejecutiva",
          descripcion: "Proyecto aprobado y enviado a coordinación",
        })
      }

      // Guardar el historial
      Storage.saveProject(project)
    }

    // Ordenar historial por fecha (más recientes primero)
    const sortedHistory = [...project.historial].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

    // Crear modal para mostrar historial
    const projectHistoryModal = document.getElementById("projectHistoryModal")
    const projectHistoryBody = document.getElementById("project-history-body")

    if (!projectHistoryModal || !projectHistoryBody) {
      console.error("Elementos del modal de historial no encontrados")
      return
    }

    // Limpiar tabla
    projectHistoryBody.innerHTML = ""

    // Llenar tabla con historial
    sortedHistory.forEach((item) => {
      const row = document.createElement("tr")
      row.innerHTML = `
                <td>${formatDateTime(item.fecha)}</td>
                <td>${project.id}</td>
                <td><span class="badge ${getBadgeClass(item.estado)}">${item.estado}</span></td>
                <td>${item.usuario || "No especificado"}</td>
                <td>${item.rol || "No especificado"}</td>
                <td>${item.descripcion || "No hay descripción"}</td>
            `
      projectHistoryBody.appendChild(row)
    })

    // Mostrar modal
    const modal = new bootstrap.Modal(projectHistoryModal)
    modal.show()

    console.log("Historial del proyecto mostrado correctamente")
  } catch (error) {
    console.error("Error al mostrar historial del proyecto:", error)
    alert("Error al cargar el historial del proyecto. Por favor, intente nuevamente.")
  }
}

// Función para mostrar el modal de cambio de estado
function showChangeStatusModal(projectId) {
  console.log(`Mostrando modal de cambio de estado para el proyecto: ${projectId}`)

  try {
    const project = Storage.getProjectById(projectId)
    if (!project) {
      console.error(`Proyecto no encontrado: ${projectId}`)
      alert("No se encontró el proyecto solicitado")
      return
    }

    const changeStatusModal = document.getElementById("changeStatusModal")
    const projectIdStatus = document.getElementById("project-id-status")
    const projectStatus = document.getElementById("project-status")

    if (!changeStatusModal || !projectIdStatus || !projectStatus) {
      console.error("Elementos del modal de cambio de estado no encontrados")
      return
    }

    // Llenar campos
    projectIdStatus.value = projectId
    projectStatus.value = project.estado

    // Mostrar modal
    const modal = new bootstrap.Modal(changeStatusModal)
    modal.show()

    console.log("Modal de cambio de estado mostrado correctamente")
  } catch (error) {
    console.error("Error al mostrar modal de cambio de estado:", error)
    alert("Error al mostrar el formulario de cambio de estado. Por favor, inténtelo de nuevo.")
  }
}

// Función para guardar el cambio de estado
function saveProjectStatus() {
  console.log("Guardando cambio de estado")

  try {
    const projectIdStatus = document.getElementById("project-id-status")
    const projectStatus = document.getElementById("project-status")

    const projectId = projectIdStatus.value
    const newStatus = projectStatus.value

    if (!projectId || !newStatus) {
      alert("Por favor, seleccione un estado.")
      return
    }

    const project = Storage.getProjectById(projectId)
    if (!project) {
      console.error(`Proyecto no encontrado: ${projectId}`)
      alert("No se encontró el proyecto solicitado")
      return
    }

    // Guardar estado anterior para el historial
    const oldStatus = project.estado

    // Actualizar estado
    project.estado = newStatus
    project.comentarioCambioEstado = "Cambio de estado por administrador"

    // Guardar proyecto
    Storage.saveProject(project)

    // Cerrar modal
    const changeStatusModal = bootstrap.Modal.getInstance(document.getElementById("changeStatusModal"))
    changeStatusModal.hide()

    // Recargar tablas y gráficos
    loadProjectsTable()
    loadInManagementProjects()
    loadCompletedProjects()
    loadDashboardData()

    console.log("Cambio de estado guardado correctamente")
    alert("Estado del proyecto actualizado correctamente.")
  } catch (error) {
    console.error("Error al guardar cambio de estado:", error)
    alert("Error al actualizar el estado del proyecto. Por favor, inténtelo de nuevo.")
  }
}

// Función para inicializar el mapa
function initProjectsMap() {
  const map = L.map("projects-map").setView([10.9639, -74.7964], 10) // Centrado en Barranquilla

  // Capa base de OpenStreetMap
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)

  return map
}

// Función para cargar proyectos en el mapa
function loadProjectsOnMap() {
  console.log("Cargando proyectos en el mapa");

  const mapContainer = document.getElementById("projects-map");
  if (!mapContainer) {
    console.error("Contenedor del mapa no encontrado");
    return;
  }

  // Inicializar el mapa solo si no existe ya
  if (typeof window.projectsMap === "undefined") {
    window.projectsMap = L.map("projects-map").setView([10.9639, -74.7964], 10);

    // Capa base de OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(window.projectsMap);
  }

  // Limpiar marcadores existentes si hay
  if (window.projectMarkers) {
    window.projectMarkers.forEach((marker) => window.projectsMap.removeLayer(marker));
  }
  window.projectMarkers = [];

  const projects = Storage.getProjects();
  const points = [];
  const projectCoords = {};

  // Procesar cada proyecto
  projects.forEach((project) => {
    // Solo mostrar proyectos con coordenadas válidas en el KML
    if (project.kmlData && project.kmlData.puntos && project.kmlData.puntos.length > 0) {
      const primerPunto = project.kmlData.puntos[0];
      const point = [primerPunto.lat, primerPunto.lon];
      point.project = project;
      points.push(point);
      projectCoords[project.id] = point;

      // Agregar marcador individual
      const marker = L.marker([primerPunto.lat, primerPunto.lon]).addTo(window.projectsMap);
      window.projectMarkers.push(marker);

      // Tooltip con información del proyecto
      marker.bindTooltip(`
        <strong>${project.nombre || "Proyecto sin nombre"}</strong><br>
        PRST: ${project.prstNombre || "N/A"}<br>
        Estado: ${project.estado || "N/A"}
      `);

      // Al hacer clic en el marcador, resaltar en la tabla
      marker.on('click', function() {
        highlightProjectInTable(project.id);
      });
    }
  });

  // Configurar hexbin si hay puntos
  if (points.length > 0 && typeof L.hexbinLayer !== "undefined") {
    if (!window.hexLayer) {
      window.hexLayer = L.hexbinLayer({
        radius: 25,
        opacity: 0.7,
        duration: 500,
        colorRange: ["#f7fbff", "#4292c6", "#08306b"],
        radiusRange: [5, 25],
        pointerEvents: "all",
      }).addTo(window.projectsMap);

      // Configurar tooltips para hexbin
      window.hexLayer.hoverHandler(
        L.HexbinHoverHandler.tooltip({
          tooltipContent: (d) => {
            const projectNames = d
              .map((p) => p.o.project.nombre || "Proyecto sin nombre")
              .join("<br>");
            return `<div class="hexbin-tooltip">${projectNames}</div>`;
          },
        })
      );

      // Configurar evento de clic para hexbin
      window.hexLayer.clickHandler((d) => {
        if (d.length > 0) {
          const projectId = d[0].o.project.id;
          highlightProjectInTable(projectId);
        }
      });
    }

    // Actualizar datos del hexbin
    const hexbinData = points.map((p) => {
      return {
        x: p[1], // longitud
        y: p[0], // latitud
        o: { project: p.project },
      };
    });

    window.hexLayer.data(hexbinData);
  }

  // Ajustar el zoom para mostrar todos los marcadores
  if (points.length > 0) {
    window.projectsMap.fitBounds(L.latLngBounds(points));
  }

  console.log("Mapa cargado correctamente con", points.length, "puntos");
}

// Función para resaltar un proyecto en la tabla
let currentlyHighlightedProject = null;

function highlightProjectInTable(projectId) {
    // Guardar el proyecto actualmente resaltado
    currentlyHighlightedProject = projectId;
    
    // Mostrar el botón de limpiar selección
    const clearButton = document.getElementById('clear-highlight-button');
    if (clearButton) {
        clearButton.style.display = 'inline-block';
    }

    // Primero quitar cualquier resaltado existente
    const rows = document.querySelectorAll('#projects-table-body tr');
    rows.forEach(row => {
        row.classList.remove('highlighted-project');
    });

    // Encontrar la fila correspondiente al proyecto
    const projectRow = document.querySelector(`#projects-table-body tr button[data-id="${projectId}"]`)?.closest('tr');
    
    if (projectRow) {
        // Resaltar la fila
        projectRow.classList.add('highlighted-project');
        
        // Hacer scroll a la fila
        projectRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Cambiar a la pestaña de proyectos si no está visible
        const projectsTab = document.querySelector('a[href="#projects"]');
        if (projectsTab && !projectsTab.classList.contains('active')) {
            projectsTab.click();
        }
    }
}

function clearHighlight() {
    // Quitar el resaltado de todas las filas
    const rows = document.querySelectorAll('#projects-table-body tr');
    rows.forEach(row => {
        row.classList.remove('highlighted-project');
    });
    
    // Ocultar el botón de limpiar selección
    const clearButton = document.getElementById('clear-highlight-button');
    if (clearButton) {
        clearButton.style.display = 'none';
    }
    
    // Limpiar la referencia al proyecto resaltado
    currentlyHighlightedProject = null;
}

// Mejorar la inicialización del mapa cuando se muestra la pestaña
document.addEventListener("DOMContentLoaded", () => {
  // Agregar listener para cuando se muestre la pestaña del mapa
  const mapTabLink = document.querySelector('a[href="#map"]')
  if (mapTabLink) {
    mapTabLink.addEventListener("shown.bs.tab", () => {
      console.log("Pestaña de mapa activada, inicializando mapa...")
      // Esperar un breve momento para asegurar que el contenedor es visible
      setTimeout(() => {
        loadProjectsOnMap()

        // Forzar un resize del mapa para asegurar que se renderice correctamente
        if (window.projectsMap) {
          window.projectsMap.invalidateSize()
        }
      }, 200)
    })
  }
})

// Agregar función para crear notificaciones de prueba (para desarrollo)
function createTestNotifications() {
  if (!currentUser) return

  const notificationTypes = [
    { titulo: "Nuevo proyecto asignado", mensaje: "Se le ha asignado un nuevo proyecto: Proyecto de prueba" },
    { titulo: "Cambio de estado", mensaje: "El proyecto 'Expansión Zona Norte' ha cambiado de estado a 'En Gestión'" },
    { titulo: "Recordatorio", mensaje: "Tiene documentos pendientes por revisar" },
    { titulo: "Alerta", mensaje: "Un proyecto está próximo a vencer su plazo" },
  ]

  for (let i = 0; i < 5; i++) {
    const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)]
    const notification = {
      usuarioId: currentUser.id,
      fecha: new Date().toISOString(),
      titulo: type.titulo,
      mensaje: type.mensaje,
      leido: Math.random() > 0.7, // 30% de probabilidad de estar leída
      tipo: "test",
      projectId: null,
    }

    Storage.createNotification(notification)
  }

  loadNotifications()
  console.log("Notificaciones de prueba creadas")
}

// Exponer la función para poder llamarla desde la consola
window.createTestNotifications = createTestNotifications

// Función para calcular el centro de un conjunto de coordenadas
function calculateCenter(coords) {
  const lats = coords.map((c) => c[0])
  const lngs = coords.map((c) => c[1])

  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lngs)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)

  return [minLat + (maxLat - minLat) / 2, minLng + (maxLng - minLng) / 2]
}

// Función para mostrar el perfil como sección
function showProfileSection() {
  console.log("Mostrando sección de perfil")

  // Ocultar el tab content
  document.querySelector(".tab-content").classList.add("d-none")

  // Mostrar la sección de perfil
  const profileSection = document.getElementById("profile-section")
  profileSection.classList.remove("d-none")

  // Llenar datos del perfil
  document.getElementById("profile-nombre").textContent = currentUser.nombre || "No disponible"
  document.getElementById("profile-apellido").textContent = currentUser.apellido || "No disponible"
  document.getElementById("profile-usuario").textContent = currentUser.usuario || "No disponible"
  document.getElementById("profile-correo").textContent = currentUser.correo || "No disponible"
  document.getElementById("profile-rol").textContent = currentUser.rol || "No disponible"

  // Datos adicionales
  document.getElementById("profile-last-login").textContent = currentUser.lastLogin
    ? formatDateTime(currentUser.lastLogin)
    : "No disponible"

  // Contar proyectos creados (solo para admin)
  if (currentUser.rol === "admin") {
    const projects = Storage.getProjects()
    const userProjects = projects.filter((p) => p.creadorId === currentUser.id).length
    document.getElementById("profile-projects-created").textContent = userProjects
  } else {
    document.querySelector('label[for="profile-projects-created"]').style.display = "none"
    document.getElementById("profile-projects-created").style.display = "none"
  }
}

// Función para volver al dashboard
function setupBackToDashboard() {
  const backButton = document.getElementById("back-to-dashboard")
  if (backButton) {
    backButton.addEventListener("click", () => {
      document.querySelector(".tab-content").classList.remove("d-none")
      document.getElementById("profile-section").classList.add("d-none")
    })
  }
}

// Función para mostrar el modal de cambio de contraseña
function showChangePasswordModal() {
  console.log("Mostrando modal de cambio de contraseña")

  try {
    const changePasswordModal = document.getElementById("changePasswordModal")
    const currentPasswordInput = document.getElementById("current-password")
    const newPasswordInput = document.getElementById("new-password")
    const confirmPasswordInput = document.getElementById("confirm-password")

    if (!changePasswordModal || !currentPasswordInput || !newPasswordInput || !confirmPasswordInput) {
      console.error("Elementos del cambio de contraseña no encontrados")
      return
    }

    // Limpiar campos
    currentPasswordInput.value = ""
    newPasswordInput.value = ""
    confirmPasswordInput.value = ""

    // Cerrar modal de perfil si está abierto
    const profileModal = bootstrap.Modal.getInstance(document.getElementById("profileModal"))
    if (profileModal) {
      profileModal.hide()
    }

    // Mostrar modal de cambio de contraseña
    const modal = new bootstrap.Modal(changePasswordModal)
    modal.show()

    console.log("Modal de cambio de contraseña mostrado correctamente")
  } catch (error) {
    console.error("Error al mostrar modal de cambio de contraseña:", error)
    alert("Error al mostrar el formulario de cambio de contraseña. Por favor, inténtelo de nuevo.")
  }
}

// Función para guardar la nueva contraseña
function saveNewPassword() {
  console.log("Guardando nueva contraseña")

  try {
    const currentPasswordInput = document.getElementById("current-password")
    const newPasswordInput = document.getElementById("new-password")
    const confirmPasswordInput = document.getElementById("confirm-password")

    const currentPassword = currentPasswordInput.value
    const newPassword = newPasswordInput.value
    const confirmPassword = confirmPasswordInput.value

    // Validar campos
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Por favor, complete todos los campos.")
      return
    }

    // Validar que la contraseña actual sea correcta
    if (currentPassword !== currentUser.password) {
      alert("La contraseña actual es incorrecta.")
      return
    }

    // Validar que las nuevas contraseñas coincidan
    if (newPassword !== confirmPassword) {
      alert("Las nuevas contraseñas no coinciden.")
      return
    }

    // Validar longitud mínima
    if (newPassword.length < 6) {
      alert("La nueva contraseña debe tener al menos 6 caracteres.")
      return
    }

    // Actualizar contraseña
    const updatedUser = { ...currentUser, password: newPassword }
    Storage.saveUser(updatedUser)
    currentUser = updatedUser

    // Cerrar modal
    const changePasswordModal = bootstrap.Modal.getInstance(document.getElementById("changePasswordModal"))
    changePasswordModal.hide()

    console.log("Contraseña actualizada correctamente")
    alert("Contraseña actualizada correctamente.")
  } catch (error) {
    console.error("Error al guardar nueva contraseña:", error)
    alert("Error al actualizar la contraseña. Por favor, inténtelo de nuevo.")
  }
}

// Función auxiliar para formatear fechas
function formatDate(dateString) {
  if (!dateString) return "N/A"

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Fecha inválida"

    return date.toLocaleDateString("es-ES")
  } catch (error) {
    console.error("Error al formatear fecha:", error)
    return "Fecha inválida"
  }
}

// Función auxiliar para formatear fecha y hora
function formatDateTime(dateString) {
  if (!dateString) return "N/A"

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Fecha inválida"

    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (error) {
    console.error("Error al formatear fecha y hora:", error)
    return "Fecha inválida"
  }
}

// Función auxiliar para obtener la clase de badge según el estado
function getBadgeClass(estado) {
  const statusClasses = {
    Nuevo: "bg-secondary",
    "En Proceso de Viabilidad": "bg-info",
    "En Asignación": "bg-primary",
    "En Gestión por Analista": "bg-warning",
    "En Gestión por Brigada": "bg-warning",
    "En Revisión de Verificación": "bg-info",
    "Generación de Informe": "bg-primary",
    "Opción Mejorar": "bg-warning",
    "Documentación Errada": "bg-danger",
    Finalizado: "bg-success",
    Completado: "bg-success",
  }

  return statusClasses[estado] || "bg-secondary"
}

// Función auxiliar para generar un ID único
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Declarar las funciones de los gráficos
// Función para cargar gráfico de proyectos por estado
function loadProjectsByStatusChart(period = "month") {
  console.log("Cargando gráfico de proyectos por estado con periodo:", period);
  
  try {
    const projects = Storage.getProjects();
    const ctx = document.getElementById('projects-by-status-chart').getContext('2d');
    
    // Filtrar proyectos según el período seleccionado
    const filteredProjects = filterProjectsByPeriod(projects, period, 'fechaCreacion');
    
    // Contar proyectos por estado
    const statusCounts = {};
    filteredProjects.forEach(project => {
      const estado = project.estado || 'No definido';
      statusCounts[estado] = (statusCounts[estado] || 0) + 1;
    });
    
    // Ordenar estados por cantidad (de mayor a menor)
    const sortedStatuses = Object.keys(statusCounts).sort((a, b) => statusCounts[b] - statusCounts[a]);
    
    // Preparar datos para el gráfico
    const labels = sortedStatuses;
    const data = sortedStatuses.map(status => statusCounts[status]);
    
    // Definir colores para cada estado
    const backgroundColors = sortedStatuses.map(status => {
      // Mapeo de estados a colores específicos
      const statusColors = {
        'Nuevo': '#6c757d', // Gris
        'En Proceso de Viabilidad': '#17a2b8', // Cyan
        'En Asignación': '#007bff', // Azul
        'En Gestión por Analista': '#ffc107', // Amarillo
        'En Gestión por Brigada': '#fd7e14', // Naranja
        'En Revisión de Verificación': '#20c997', // Verde claro
        'Generación de Informe': '#6610f2', // Violeta
        'Opción Mejorar': '#e83e8c', // Rosa
        'Documentación Errada': '#dc3545', // Rojo
        'Finalizado': '#28a745', // Verde
        'Completado': '#28a745', // Verde
        'No definido': '#6c757d' // Gris
      };
      
      return statusColors[status] || '#6c757d'; // Color por defecto
    });
    
    // Destruir el gráfico anterior si existe
    if (charts['projects-by-status-chart']) {
      charts['projects-by-status-chart'].destroy();
    }
    
    // Crear nuevo gráfico
    charts['projects-by-status-chart'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Proyectos por Estado',
          data: data,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => darkenColor(color, 20)),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.parsed.y} proyectos (${((context.parsed.y / filteredProjects.length) * 100).toFixed(1)}%)`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Cantidad de Proyectos'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Estado del Proyecto'
            }
          }
        }
      }
    });
    
    console.log("Gráfico de proyectos por estado cargado correctamente");
  } catch (error) {
    console.error("Error al cargar gráfico de proyectos por estado:", error);
  }
}

// Función auxiliar para oscurecer colores (necesaria para los bordes)
function darkenColor(color, percent) {
  // Convert HEX to RGB
  let r = parseInt(color.substring(1, 3), 16);
  let g = parseInt(color.substring(3, 5), 16);
  let b = parseInt(color.substring(5, 7), 16);

  // Darken each component
  r = Math.floor(r * (100 - percent) / 100);
  g = Math.floor(g * (100 - percent) / 100);
  b = Math.floor(b * (100 - percent) / 100);

  // Convert back to HEX
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Función para cargar gráfico de proyectos por departamento
function loadProjectsByDepartmentChart() {
  console.log("Cargando gráfico de proyectos por departamento");
  
  try {
    const projects = Storage.getProjects();
    const ctx = document.getElementById('projects-by-department-chart').getContext('2d');
    
    // Contar proyectos por departamento
    const departmentCounts = {};
    projects.forEach(project => {
      const depto = project.departamento || 'No especificado';
      departmentCounts[depto] = (departmentCounts[depto] || 0) + 1;
    });
    
    // Preparar datos para el gráfico
    const labels = Object.keys(departmentCounts);
    const data = Object.values(departmentCounts);
    const backgroundColors = labels.map((_, index) => {
      const colors = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796', '#5a5c69'];
      return colors[index % colors.length];
    });
    
    // Destruir el gráfico anterior si existe
    if (charts['projects-by-department-chart']) {
      charts['projects-by-department-chart'].destroy();
    }
    
    // Crear nuevo gráfico
    charts['projects-by-department-chart'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors,
          hoverBackgroundColor: backgroundColors.map(color => darkenColor(color, 15)),
          hoverBorderColor: "rgba(234, 236, 244, 1)",
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} proyectos (${percentage}%)`;
              }
            }
          }
        },
        cutout: '70%',
      }
    });
    
    console.log("Gráfico de proyectos por departamento cargado correctamente");
  } catch (error) {
    console.error("Error al cargar gráfico de proyectos por departamento:", error);
  }
}

// Función para cargar gráfico de flujo de proyectos
function loadProjectsFlowChart(period = "month") {
  console.log("Cargando gráfico de flujo de proyectos con periodo:", period);
  
  try {
    const projects = Storage.getProjects();
    const ctx = document.getElementById('projects-flow-chart').getContext('2d');
    
    // Agrupar proyectos por período de tiempo
    let labels = [];
    let data = [];
    
    const now = new Date();
    const filteredProjects = projects.filter(p => p.fechaCreacion);
    
    if (period === "day") {
      // Últimos 7 días
      labels = Array.from({length: 7}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return formatDate(date.toISOString(), true);
      });
      
      data = labels.map(label => {
        const dateStr = label.split('/').reverse().join('-');
        return filteredProjects.filter(p => p.fechaCreacion.startsWith(dateStr)).length;
      });
    } else if (period === "week") {
      // Últimas 12 semanas
      labels = Array.from({length: 12}, (_, i) => `Semana ${12 - i}`);
      
      data = labels.map((_, i) => {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (12 - i - 1) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        return filteredProjects.filter(p => {
          const projectDate = new Date(p.fechaCreacion);
          return projectDate >= weekStart && projectDate <= weekEnd;
        }).length;
      });
    } else if (period === "month") {
      // Últimos 12 meses
      labels = Array.from({length: 12}, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i));
        return date.toLocaleString('es-ES', { month: 'short' });
      });
      
      data = labels.map((_, i) => {
        const month = new Date().getMonth() - (11 - i);
        const year = new Date().getFullYear();
        const adjustedMonth = month < 0 ? month + 12 : month;
        const adjustedYear = month < 0 ? year - 1 : year;
        
        return filteredProjects.filter(p => {
          const projectDate = new Date(p.fechaCreacion);
          return projectDate.getMonth() === adjustedMonth && 
                 projectDate.getFullYear() === adjustedYear;
        }).length;
      });
    } else if (period === "year") {
      // Últimos 5 años
      const currentYear = new Date().getFullYear();
      labels = Array.from({length: 5}, (_, i) => (currentYear - 4 + i).toString());
      
      data = labels.map(year => {
        return filteredProjects.filter(p => {
          const projectDate = new Date(p.fechaCreacion);
          return projectDate.getFullYear() === parseInt(year);
        }).length;
      });
    }
    
    // Destruir el gráfico anterior si existe
    if (charts['projects-flow-chart']) {
      charts['projects-flow-chart'].destroy();
    }
    
    // Crear nuevo gráfico
    charts['projects-flow-chart'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Proyectos creados',
          data: data,
          backgroundColor: 'rgba(78, 115, 223, 0.05)',
          borderColor: 'rgba(78, 115, 223, 1)',
          pointBackgroundColor: 'rgba(78, 115, 223, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(78, 115, 223, 1)',
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.parsed.y} proyectos creados`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Cantidad de Proyectos'
            },
            ticks: {
              precision: 0
            }
          },
          x: {
            title: {
              display: true,
              text: period === "day" ? 'Día' : 
                    period === "week" ? 'Semana' : 
                    period === "month" ? 'Mes' : 'Año'
            }
          }
        }
      }
    });
    
    console.log("Gráfico de flujo de proyectos cargado correctamente");
  } catch (error) {
    console.error("Error al cargar gráfico de flujo de proyectos:", error);
  }
}

// Funciones auxiliares para los gráficos

function filterProjectsByPeriod(projects, period, dateField) {
  const now = new Date();
  const filteredProjects = projects.filter(p => p[dateField]);
  
  if (period === "day") {
    const today = now.toISOString().split('T')[0];
    return filteredProjects.filter(p => p[dateField].startsWith(today));
  } else if (period === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return filteredProjects.filter(p => new Date(p[dateField]) >= weekAgo);
  } else if (period === "month") {
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return filteredProjects.filter(p => new Date(p[dateField]) >= monthAgo);
  } else if (period === "year") {
    const yearAgo = new Date(now);
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    return filteredProjects.filter(p => new Date(p[dateField]) >= yearAgo);
  }
  
  return filteredProjects;
}

function getStatusColor(status) {
  const statusColors = {
    'Nuevo': '#6c757d',
    'En Proceso de Viabilidad': '#17a2b8',
    'En Asignación': '#007bff',
    'En Gestión por Analista': '#ffc107',
    'En Gestión por Brigada': '#fd7e14',
    'En Revisión de Verificación': '#20c997',
    'Generación de Informe': '#6610f2',
    'Opción Mejorar': '#e83e8c',
    'Documentación Errada': '#dc3545',
    'Finalizado': '#28a745',
    'Completado': '#28a745',
    'No definido': '#6c757d'
  };
  
  return statusColors[status] || '#6c757d';
}

function darkenColor(color, percent) {
  // Convert HEX to RGB
  let r = parseInt(color.substring(1, 3), 16);
  let g = parseInt(color.substring(3, 5), 16);
  let b = parseInt(color.substring(5, 7), 16);

  // Darken each component
  r = Math.floor(r * (100 - percent) / 100);
  g = Math.floor(g * (100 - percent) / 100);
  b = Math.floor(b * (100 - percent) / 100);

  // Convert back to HEX
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function formatDate(dateString, short = false) {
  if (!dateString) return "N/A";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Fecha inválida";
    
    if (short) {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit'
      });
    }
    
    return date.toLocaleDateString('es-ES');
  } catch (error) {
    console.error("Error al formatear fecha:", error);
    return "Fecha inválida";
  }
}

// Exportar funciones para que puedan ser utilizadas por chart.js
window.loadProjectsByStatusChart = loadProjectsByStatusChart
window.loadProjectsByDepartmentChart = loadProjectsByDepartmentChart
window.loadProjectsFlowChart = loadProjectsFlowChart

// Fallback logout function in case Storage is not initialized
document.getElementById("logout-button")?.addEventListener("click", (e) => {
  console.log("Fallback logout clicked")
  e.preventDefault()
  localStorage.removeItem("air_e_logged_user")
  window.location.href = "login.html"
})

// Direct logout function
function directLogout() {
  console.log("Direct logout called")
  localStorage.removeItem("air_e_logged_user")
  window.location.href = "login.html"

}

// Add direct logout to window for access from HTML
window.directLogout = directLogout

// Add direct logout button event listener
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout-button")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault()
      directLogout()
    })
    console.log("Direct logout button listener added")
  } else {
    console.warn("Logout button not found")
  }
})
