// prst.js - Funcionalidades para el rol PRST

// Variables globales
let currentUser = null
const projectsData = []
const municipiosPorDepartamento = {
  Atlántico: [
    "Barranquilla",
    "Baranoa",
    "Campo de la Cruz",
    "Candelaria",
    "Galapa",
    "Juan de Acosta",
    "Luruaco",
    "Malambo",
    "Manati",
    "Palmar de varela",
    "Piojo",
    "Polonuevo",
    "Ponedera",
    "Puerto Colombia",
    "Repelon",
    "Sabanagrande",
    "Sabanalarga",
    "Santa Lucia",
    "Santo Tomas",
    "Soledad",
    "Suan",
    "Tubara",
    "Usiacuri",
  ],
  "La Guajira": [
    "Riohacha",
    "Albania",
    "Barrancas",
    "Dibulla",
    "Distraccion",
    "El Molino",
    "Fonseca",
    "Hatonuevo",
    "La Jagua del Pilar",
    "Maicao",
    "Manaure",
    "San Juan del Cesar",
    "Uribia",
    "Urumita",
    "Villanueva",
  ],
  Magdalena: [
    "Santa Marta",
    "Aracataca",
    "Cerro de San Antonio",
    "Chibolo",
    "Cienaga",
    "Concordia",
    "El Piñon",
    "El Reten",
    "Fundacion",
    "Pedraza",
    "Pivijay",
    "Plato",
    "Puebloviejo",
    "Remolino",
    "Salamina",
    "Sitionuevo",
    "Tenerife",
    "Zapayan",
    "Zona Bananera",
  ],
}

// Variables globales para fechas disponibles
const availableDates = {
  creacion: new Set(),
  inicio: new Set(),
  fin: new Set(),
}

// Tipos de solicitud
const tiposSolicitud = {
  SEV: "SEV: Nuevo Proyecto a Construir",
  SDR: "SDR: Desmonte de Proyecto Existente",
  SIPRST: "SIPRST: Mantenimiento a Red Existente",
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM cargado - Inicializando página PRST")

  try {
    // Inicializar el almacenamiento
    if (typeof Storage !== "undefined" && Storage.init) {
      Storage.init()
      console.log("Storage inicializado correctamente")
    } else {
      console.error("Error: Storage no está disponible o no tiene método init")
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
    } else if (loggedUser.rol !== "prst") {
      console.error(`Usuario con rol incorrecto: ${loggedUser.rol}, redirigiendo a dashboard`)
      window.location.href = "dashboard.html"
      return
    }

    // Guardar el usuario actual en la variable global
    currentUser = loggedUser
    console.log("Usuario PRST autenticado:", currentUser)

    // Inicializar componentes
    initializeComponents()

    // Cargar datos iniciales
    loadUserData()
    loadProjects()
    loadNotifications()

    // Manejar eventos
    setupEventListeners()

    // Extraer fechas disponibles al cargar
    extractAvailableDates()

    // Configurar eventos para los selectores de fecha
    const dateTypeSelect = document.getElementById("filter-date-type")
    if (dateTypeSelect) {
      dateTypeSelect.addEventListener("change", () => {
        populateDateSelectors()
        filterProjects()
      })
    } else {
      console.warn("Elemento filter-date-type no encontrado")
    }

    // Poblar selectores inicialmente
    populateDateSelectors()

    // Modificar el evento para el selector de tipo de solicitud
    const projectTypeSelect = document.getElementById("project-type")
    if (projectTypeSelect) {
      projectTypeSelect.addEventListener("change", (e) => {
        const selectedType = e.target.value
        if (selectedType && !e.target.hasAttribute("data-confirmed")) {
          e.preventDefault()
          e.stopPropagation()
          showTypeConfirmationModal(selectedType)
        }
      })
    }

    console.log("Inicialización completada correctamente")
  } catch (error) {
    console.error("Error crítico durante la inicialización:", error)
    alert("Error crítico durante la inicialización. Por favor, recargue la página o contacte al administrador.")
  }
})

// Función para mostrar el modal de confirmación del tipo de solicitud
function showTypeConfirmationModal(tipo) {
  try {
    // Eliminar modal anterior si existe
    const oldModal = document.getElementById("typeConfirmationModal")
    if (oldModal) {
      // Si hay un modal anterior, asegurarse de que se elimine correctamente
      if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
        const oldModalInstance = bootstrap.Modal.getInstance(oldModal)
        if (oldModalInstance) {
          oldModalInstance.dispose()
        }
      }
      oldModal.remove()
    }

    // Crear el HTML del modal
    const modalHtml = `
      <div class="modal fade" id="typeConfirmationModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title">Confirmar Tipo de Solicitud</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p>¿Está seguro que desea crear una solicitud de tipo <strong>${tiposSolicitud[tipo]}</strong>?</p>
              <p class="text-muted small">Por favor verifique que esta es la opción correcta antes de continuar.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="cancel-type-button">Cancelar</button>
              <button type="button" class="btn btn-primary" id="confirm-type-button">Confirmar</button>
            </div>
          </div>
        </div>
      </div>
    `

    // Agregar modal al DOM
    document.body.insertAdjacentHTML("beforeend", modalHtml)

    // Obtener referencia al modal
    const modalElement = document.getElementById("typeConfirmationModal")

    // Inicializar el modal manualmente
    let modal
    if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
      modal = new bootstrap.Modal(modalElement)
      modal.show()
    } else {
      console.error("Bootstrap no está disponible")
      alert("Error: No se puede mostrar el modal de confirmación. Por favor, recargue la página.")
      return
    }

    // Configurar evento para el botón de confirmar
    document.getElementById("confirm-type-button").addEventListener("click", () => {
      // Guardar el tipo seleccionado en el formulario
      const projectTypeSelect = document.getElementById("project-type")
      projectTypeSelect.value = tipo

      // Marcar el selector como confirmado para evitar que se muestre el modal nuevamente
      projectTypeSelect.setAttribute("data-confirmed", "true")

      // Cerrar el modal manualmente
      modal.hide()

      // Eliminar el modal del DOM después de cerrarlo
      modalElement.addEventListener(
        "hidden.bs.modal",
        () => {
          modalElement.remove()
        },
        { once: true },
      )

      console.log(`Tipo de solicitud confirmado: ${tipo} - ${tiposSolicitud[tipo]}`)
    })

    // Configurar evento para el botón de cancelar
    document.getElementById("cancel-type-button").addEventListener("click", () => {
      // Resetear el selector
      const projectTypeSelect = document.getElementById("project-type")
      projectTypeSelect.value = ""
      projectTypeSelect.removeAttribute("data-confirmed")

      // Cerrar el modal manualmente
      modal.hide()

      // Eliminar el modal del DOM después de cerrarlo
      modalElement.addEventListener(
        "hidden.bs.modal",
        () => {
          modalElement.remove()
        },
        { once: true },
      )
    })

    // Manejar cierre con el botón X o haciendo clic fuera del modal
    modalElement.addEventListener(
      "hidden.bs.modal",
      () => {
        // Resetear el selector si se cierra sin confirmar
        const projectTypeSelect = document.getElementById("project-type")
        if (!projectTypeSelect.hasAttribute("data-confirmed")) {
          projectTypeSelect.value = ""
        }

        // Eliminar el modal del DOM
        modalElement.remove()
      },
      { once: true },
    )
  } catch (error) {
    console.error("Error al mostrar el modal de confirmación:", error)
    alert("Error al mostrar el modal de confirmación. Por favor, intente nuevamente.")

    // Resetear el selector en caso de error
    const projectTypeSelect = document.getElementById("project-type")
    if (projectTypeSelect) {
      projectTypeSelect.value = ""
      projectTypeSelect.removeAttribute("data-confirmed")
    }
  }
}

// Inicializar componentes de la interfaz
function initializeComponents() {
  console.log("Inicializando componentes de la interfaz")

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

  // Inicializar selectores de fecha
  const dateInputs = document.querySelectorAll(".datepicker")
  dateInputs.forEach((input) => {
    input.type = "date"
  })
  console.log("Selectores de fecha inicializados")
}

// Configurar listeners de eventos
function setupEventListeners() {
  console.log("Configurando listeners de eventos")

  try {
    // Cerrar sesión
    const logoutButton = document.getElementById("logout-button")
    if (logoutButton) {
      logoutButton.addEventListener("click", () => {
        console.log("Cerrando sesión")
        Storage.logout()
        window.location.href = "login.html"
      })
    } else {
      console.warn("Elemento logout-button no encontrado")
    }

    // Mostrar perfil
    const profileButton = document.getElementById("profile-button")
    if (profileButton) {
      profileButton.addEventListener("click", () => {
        console.log("Mostrando perfil")
        showView("profile-view")
      })
    } else {
      console.warn("Elemento profile-button no encontrado")
    }

    // Volver al panel principal desde perfil
    const backToMainButtonProfile = document.getElementById("back-to-main-button-profile")
    if (backToMainButtonProfile) {
      backToMainButtonProfile.addEventListener("click", () => {
        console.log("Volviendo al panel principal desde perfil")
        showView("main-view")
      })
    } else {
      console.warn("Elemento back-to-main-button-profile no encontrado")
    }

    // Mostrar modal de nuevo proyecto
    const newProjectButton = document.getElementById("new-project-button")
    if (newProjectButton) {
      newProjectButton.addEventListener("click", () => {
        console.log("Mostrando formulario de nuevo proyecto")
        // Limpiar formulario
        const projectForm = document.getElementById("project-form")
        if (projectForm) {
          projectForm.reset()
        }

        document.getElementById("project-id").value = ""
        document.getElementById("project-form-title").textContent = "Nuevo Proyecto"

        const neighborhoodsList = document.getElementById("neighborhoods-list")
        if (neighborhoodsList) {
          neighborhoodsList.innerHTML = ""
        }

        const ejecutivaObservationsAlert = document.getElementById("ejecutiva-observations-alert")
        if (ejecutivaObservationsAlert) {
          ejecutivaObservationsAlert.classList.add("d-none")
        }

        // Mostrar vista de formulario
        showView("project-form-view")
      })
    } else {
      console.warn("Elemento new-project-button no encontrado")
    }

    // Volver al panel principal desde formulario
    const backToMainButton = document.getElementById("back-to-main-button")
    if (backToMainButton) {
      backToMainButton.addEventListener("click", () => {
        console.log("Volviendo al panel principal desde formulario")
        showView("main-view")
      })
    } else {
      console.warn("Elemento back-to-main-button no encontrado")
    }

    // Cancelar creación/edición de proyecto
    const cancelProjectButton = document.getElementById("cancel-project-button")
    if (cancelProjectButton) {
      cancelProjectButton.addEventListener("click", () => {
        console.log("Cancelando creación/edición de proyecto")
        showView("main-view")
      })
    } else {
      console.warn("Elemento cancel-project-button no encontrado")
    }

    // Agregar barrio
    const addNeighborhoodButton = document.getElementById("add-neighborhood-button")
    if (addNeighborhoodButton) {
      addNeighborhoodButton.addEventListener("click", () => {
        const neighborhoodInput = document.getElementById("project-neighborhood")
        if (neighborhoodInput) {
          const neighborhood = neighborhoodInput.value.trim()
          if (neighborhood) {
            console.log(`Agregando barrio: ${neighborhood}`)
            addNeighborhood(neighborhood)
            neighborhoodInput.value = ""
            neighborhoodInput.focus()
          } else {
            console.warn("Intento de agregar barrio vacío")
          }
        } else {
          console.warn("Elemento project-neighborhood no encontrado")
        }
      })
    } else {
      console.warn("Elemento add-neighborhood-button no encontrado")
    }

    // Guardar proyecto
    const projectForm = document.getElementById("project-form")
    if (projectForm) {
      projectForm.addEventListener("submit", (e) => {
        e.preventDefault()
        console.log("Formulario de proyecto enviado")
        saveProject()
      })
    } else {
      console.warn("Elemento project-form no encontrado")
    }

    // Manejar cambio de departamento para actualizar municipios
    const departmentSelect = document.getElementById("project-department")
    if (departmentSelect) {
      departmentSelect.addEventListener("change", () => {
        console.log("Departamento cambiado, actualizando municipios")
        updateMunicipalityOptions()
      })
    } else {
      console.warn("Elemento project-department no encontrado")
    }

    // Notificaciones
    const notificationsButton = document.getElementById("notifications-button")
    if (notificationsButton) {
      notificationsButton.addEventListener("click", () => {
        console.log("Mostrando notificaciones")
        // Marcar notificaciones como leídas cuando se abren
        const notificationItems = document.querySelectorAll(".notification-item.unread")
        notificationItems.forEach((item) => {
          const notificationId = item.dataset.id
          if (notificationId) {
            console.log(`Marcando notificación como leída: ${notificationId}`)
            markNotificationAsRead(notificationId)
          }
        })
      })
    } else {
      console.warn("Elemento notifications-button no encontrado")
    }

    // Ver todas las notificaciones
    document.addEventListener("click", (e) => {
      if (e.target.id === "viewAllNotifications" || e.target.closest("#viewAllNotifications")) {
        console.log("Mostrando todas las notificaciones")
        if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
          const notificationsModal = new bootstrap.Modal(document.getElementById("notifications-modal"))
          notificationsModal.show()
          loadAllNotifications()
        } else {
          console.warn("Bootstrap no está disponible o no tiene Modal")
          alert("No se puede mostrar el modal de notificaciones. Por favor, recargue la página.")
        }
      }
    })

    // Marcar todas las notificaciones como leídas
    const markAllReadButton = document.getElementById("mark-all-read")
    if (markAllReadButton) {
      markAllReadButton.addEventListener("click", () => {
        console.log("Marcando todas las notificaciones como leídas")
        if (currentUser) {
          Storage.markAllNotificationsAsRead(currentUser.id)
          loadNotifications()
          loadAllNotifications()
        } else {
          console.warn("No hay usuario actual para marcar notificaciones como leídas")
        }
      })
    } else {
      console.warn("Elemento mark-all-read no encontrado")
    }

    // Ver detalles de proyecto
    document.addEventListener("click", (e) => {
      if (e.target.closest(".view-project")) {
        const projectId = e.target.closest(".view-project").dataset.id
        if (projectId) {
          console.log(`Viendo detalles del proyecto: ${projectId}`)
          viewProject(projectId)
        } else {
          console.warn("ID de proyecto no encontrado en el botón de ver detalles")
        }
      }
    })

    // Editar proyecto
    document.addEventListener("click", (e) => {
      if (e.target.closest(".edit-project")) {
        const projectId = e.target.closest(".edit-project").dataset.id
        if (projectId) {
          console.log(`Editando proyecto: ${projectId}`)
          editProject(projectId)
        } else {
          console.warn("ID de proyecto no encontrado en el botón de editar")
        }
      }
    })

    // Enviar proyecto a revisión
    document.addEventListener("click", (e) => {
      if (e.target.closest(".send-project")) {
        const projectId = e.target.closest(".send-project").dataset.id
        if (projectId) {
          console.log(`Enviando proyecto a revisión: ${projectId}`)
          sendProject(projectId)
        } else {
          console.warn("ID de proyecto no encontrado en el botón de enviar")
        }
      }
    })

    // Ver historial del proyecto
    document.addEventListener("click", (e) => {
      if (e.target.closest(".ver-historial")) {
        const projectId = e.target.closest(".ver-historial").dataset.id
        if (projectId) {
          console.log(`Viendo historial del proyecto: ${projectId}`)
          showProjectHistory(projectId)
        } else {
          console.warn("ID de proyecto no encontrado en el botón de ver historial")
        }
      }
    })

    // Validación de fechas
    const startDateInput = document.getElementById("project-start-date")
    const endDateInput = document.getElementById("project-end-date")
    const postsInput = document.getElementById("project-posts")

    if (startDateInput && endDateInput && postsInput) {
      // Validar al cambiar la fecha de inicio
      startDateInput.addEventListener("change", validateDates)

      // Validar al cambiar la fecha de fin
      endDateInput.addEventListener("change", validateDates)

      // Validar cuando cambia la cantidad de postes
      postsInput.addEventListener("input", validateDates)
    } else {
      console.warn("Algunos elementos de fecha o postes no encontrados")
    }

    // Configurar eventos para los selectores de día, mes y año
    document.getElementById("filter-day").addEventListener("change", filterProjects)
    document.getElementById("filter-month").addEventListener("change", filterProjects)
    document.getElementById("filter-year").addEventListener("change", filterProjects)

    console.log("Listeners de eventos configurados correctamente")
  } catch (error) {
    console.error("Error al configurar listeners de eventos:", error)
    alert("Error al configurar la página. Por favor, recargue la página.")
  }
}

// Función para cargar datos del usuario
function loadUserData() {
  console.log("Cargando datos del usuario")

  if (!currentUser) {
    console.error("No hay usuario actual para cargar datos")
    return
  }

  try {
    // Mostrar nombre del usuario en la barra de navegación
    const userNameElement = document.getElementById("user-name")
    if (userNameElement) {
      userNameElement.textContent = `${currentUser.nombre} ${currentUser.apellido || ""}`
    } else {
      console.warn("Elemento user-name no encontrado")
    }

    // Obtener la lista de PRST directamente desde Storage
    const prstList = Storage.PRST_LIST || []
    console.log("Lista de PRST obtenida:", prstList)

    // Variables para almacenar el nombre completo y corto del PRST
    let nombreCompletoPRST = "No especificado"
    let nombreCortoPRST = "No especificado"

    // Determinar el PRST del usuario según su ID o nombre de usuario
    if (currentUser.usuario === "jperez" || currentUser.id === "2") {
      // Buscar CLARO en la lista de PRST
      const claro = prstList.find((p) => p.nombreCorto === "CLARO")
      if (claro) {
        nombreCompletoPRST = claro.nombreCompleto
        nombreCortoPRST = claro.nombreCorto
        console.log("Usuario jperez identificado como CLARO:", { nombreCompletoPRST, nombreCortoPRST })
      }
    } else if (currentUser.usuario === "epacheco" || currentUser.id === "3") {
      // Buscar TIGO en la lista de PRST
      const tigo = prstList.find((p) => p.nombreCorto === "TIGO")
      if (tigo) {
        nombreCompletoPRST = tigo.nombreCompleto
        nombreCortoPRST = tigo.nombreCorto
        console.log("Usuario epacheco identificado como TIGO:", { nombreCompletoPRST, nombreCortoPRST })
      }
    } else if (currentUser.nombrePRST) {
      // Para otros usuarios, buscar por el nombrePRST asignado
      console.log(`Buscando PRST por nombre: ${currentUser.nombrePRST}`)

      // Buscar coincidencia por nombre completo o nombre corto
      const prstInfo = prstList.find(
        (p) =>
          p.nombreCompleto?.toLowerCase() === currentUser.nombrePRST.toLowerCase() ||
          p.nombreCorto?.toLowerCase() === currentUser.nombrePRST.toLowerCase(),
      )

      if (prstInfo) {
        nombreCompletoPRST = prstInfo.nombreCompleto
        nombreCortoPRST = prstInfo.nombreCorto
        console.log(`PRST encontrado en la lista: ${nombreCompletoPRST} (${nombreCortoPRST})`)
      }
    }

    console.log("Información PRST final:", { nombreCompletoPRST, nombreCortoPRST })

    // Mostrar datos del usuario en la sección de perfil
    const profileElements = {
      "profile-name": `${currentUser.nombre} ${currentUser.apellido || ""}`,
      "profile-email": currentUser.correo || "",
      "profile-role": "PRST",
      "profile-prst-name": nombreCompletoPRST,
      "profile-prst-short": nombreCortoPRST,
      "profile-id": currentUser.cedula || "No especificado",
      "profile-mp": currentUser.matriculaProfesional || "No especificado",
      "profile-address": currentUser.direccion || "No especificado",
      "profile-neighborhood": currentUser.barrio || "No especificado",
      "profile-city": currentUser.ciudad || "No especificado",
      "profile-phone": currentUser.celular || "No especificado",
    }

    // Actualizar elementos en el DOM con verificación de existencia
    for (const [id, value] of Object.entries(profileElements)) {
      const element = document.getElementById(id)
      if (element) {
        element.textContent = value
        console.log(`Elemento ${id} actualizado con valor: ${value}`)
      } else {
        console.warn(`Elemento ${id} no encontrado en el DOM`)
      }
    }

    console.log("Datos del usuario cargados correctamente")
  } catch (error) {
    console.error("Error al cargar datos del usuario:", error)
    alert("Hubo un problema al cargar los datos del perfil. Por favor, recargue la página.")
  }
}

// Función para cargar proyectos del usuario
function loadProjects() {
  console.log("Cargando proyectos del usuario")

  if (!currentUser) {
    console.error("No hay usuario actual para cargar proyectos")
    return
  }

  try {
    const projects = Storage.getProjects().filter((project) => project.creadorId === currentUser.id)
    console.log(`Se encontraron ${projects.length} proyectos para el usuario`)

    const projectsTableBody = document.getElementById("projects-table-body")
    if (!projectsTableBody) {
      console.error("Elemento projects-table-body no encontrado")
      return
    }

    if (projects.length === 0) {
      projectsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">No hay proyectos creados. Crea tu primer proyecto haciendo clic en "Nuevo Proyecto".</td>
        </tr>
      `
      return
    }

    projectsTableBody.innerHTML = ""

    projects.forEach((project) => {
      // Mapeo de estados
      const stateMap = {
        Nuevo: "Nuevo",
        "En Revisión por Ejecutiva": "En Proceso de Viabilidad",
        "En Asignación": "En Gestión",
        Asignado: "En Gestión",
        "En Gestión por Analista": "En Gestión",
        "En Gestión por Brigada": "En Gestión",
        "En Revisión de Verificación": "En Gestión",
        "En Verificación": "En Gestión",
        "Opción Mejorar": "Opción Mejorar",
        "Opcion Mejorar": "Opción Mejorar",
        "Generación de Informe": "En Gestión",
        Finalizado: "Finalizado",
        "Documentación Errada": "Documentación Errada",
      }

      const displayState = stateMap[project.estado] || project.estado
      const statusClass = getStatusClass(project.estado)

      // Determinar acciones disponibles basadas en el estado
      let actions = `
        <button class="btn btn-sm btn-info view-project" data-id="${project.id}" title="Ver Detalles">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn btn-sm btn-info ver-historial" data-id="${project.id}" title="Ver Historial">
          <i class="fas fa-clock"></i>
        </button>
      `

      if (project.estado === "Nuevo" || project.estado === "Documentación Errada") {
        actions += `
          <button class="btn btn-sm btn-primary edit-project" data-id="${project.id}" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
        `
      }

      const row = document.createElement("tr")
      row.className = statusClass
      row.innerHTML = `
        <td>${project.id || "N/A"}</td>
        <td>${project.nombre || "Sin nombre"}</td>
        <td>${(project.municipio || "N/A") + ", " + (project.departamento || "N/A")}</td>
        <td>${project.fechaCreacion ? formatDate(project.fechaCreacion) : "N/A"}</td>
        <td>
          <span class="badge ${getBadgeClass(displayState)}">${displayState}</span>
        </td>
        <td>${actions}</td>
      `

      projectsTableBody.appendChild(row)
    })

    console.log("Proyectos cargados correctamente")
  } catch (error) {
    console.error("Error al cargar proyectos:", error)
    alert("Error al cargar los proyectos. Por favor, recargue la página.")
  }
}

// Función auxiliar para obtener clase CSS según el estado
function getStatusClass(estado) {
  switch (estado) {
    case "Documentación Errada":
      return "table-danger"
    case "Finalizado":
      return "table-success"
    case "En Revisión por Ejecutiva":
      return "table-warning"
    default:
      return ""
  }
}

// Función para actualizar las opciones de municipio según el departamento seleccionado
function updateMunicipalityOptions() {
  console.log("Actualizando opciones de municipio")

  try {
    const departmentSelect = document.getElementById("project-department")
    const municipalitySelect = document.getElementById("project-municipality")

    if (!departmentSelect || !municipalitySelect) {
      console.warn("Elementos de departamento o municipio no encontrados")
      return
    }

    const department = departmentSelect.value
    console.log(`Departamento seleccionado: ${department}`)

    municipalitySelect.innerHTML = '<option value="">Seleccione un municipio</option>'

    if (department && municipiosPorDepartamento[department]) {
      municipiosPorDepartamento[department].forEach((municipio) => {
        const option = document.createElement("option")
        option.value = municipio
        option.textContent = municipio
        municipalitySelect.appendChild(option)
      })
      console.log(`Se cargaron ${municipiosPorDepartamento[department].length} municipios`)
    } else {
      console.warn(`No se encontraron municipios para el departamento: ${department}`)
    }
  } catch (error) {
    console.error("Error al actualizar opciones de municipio:", error)
    alert("Error al cargar los municipios. Por favor, seleccione el departamento nuevamente.")
  }
}

// Obtener clase para el badge según el estado
function getBadgeClass(estado) {
  switch (estado) {
    case "Nuevo":
      return "bg-secondary"
    case "En Proceso de Viabilidad":
    case "En Revisión":
      return "bg-warning text-dark"
    case "En Gestión":
    case "En Asignación":
      return "bg-info text-dark"
    case "En Verificación":
      return "bg-info"
    case "Por Mejorar":
    case "Opción Mejorar":
      return "bg-warning"
    case "En Informe":
    case "Generación de Informe":
      return "bg-light text-dark"
    case "Finalizado":
      return "bg-success"
    case "Documentación Errada":
      return "bg-danger"
    default:
      return "bg-secondary"
  }
}

// Mostrar vista específica
function showView(viewId) {
  console.log(`Mostrando vista: ${viewId}`)

  try {
    // Ocultar todas las vistas
    const views = document.querySelectorAll(".view")
    views.forEach((view) => {
      view.classList.add("d-none")
    })

    // Mostrar la vista seleccionada
    const selectedView = document.getElementById(viewId)
    if (selectedView) {
      selectedView.classList.remove("d-none")
    } else {
      console.warn(`Vista no encontrada: ${viewId}`)
    }
  } catch (error) {
    console.error("Error al mostrar vista:", error)
    alert("Error al cambiar de vista. Por favor, recargue la página.")
  }
}

// Agregar barrio a la lista
function addNeighborhood(neighborhood) {
  console.log(`Agregando barrio: ${neighborhood}`)

  try {
    const neighborhoodsList = document.getElementById("neighborhoods-list")
    if (!neighborhoodsList) {
      console.warn("Elemento neighborhoods-list no encontrado")
      return
    }

    // Crear elemento de barrio
    const neighborhoodItem = document.createElement("div")
    neighborhoodItem.className = "neighborhood-item"
    neighborhoodItem.innerHTML = `
        <span>${neighborhood}</span>
        <button type="button" class="btn btn-sm btn-danger remove-neighborhood">
            <i class="fas fa-times"></i>
        </button>
    `

    // Agregar evento para eliminar barrio
    const removeButton = neighborhoodItem.querySelector(".remove-neighborhood")
    if (removeButton) {
      removeButton.addEventListener("click", () => {
        console.log(`Eliminando barrio: ${neighborhood}`)
        neighborhoodItem.remove()
      })
    }

    // Agregar a la lista
    neighborhoodsList.appendChild(neighborhoodItem)
  } catch (error) {
    console.error("Error al agregar barrio:", error)
    alert("Error al agregar el barrio. Por favor, intente nuevamente.")
  }
}


// Función para guardar proyecto
const saveProject = async () => {
  console.log("Guardando proyecto");

  try {
    // Obtener datos del formulario
    const projectId = document.getElementById("project-id").value;
    const nombre = document.getElementById("project-name").value;
    const direccionInicial = document.getElementById("project-address-start").value;
    const direccionFinal = document.getElementById("project-address-end").value;
    const municipio = document.getElementById("project-municipality").value;
    const departamento = document.getElementById("project-department").value;
    const numPostes = document.getElementById("project-posts").value;
    const fechaInicio = document.getElementById("project-start-date").value;
    const fechaFin = document.getElementById("project-end-date").value;
    const puntoConexion = document.getElementById("project-connection").value;
    const observaciones = document.getElementById("project-observations").value;
    const tipoSolicitud = document.getElementById("project-type").value;

    // Validar campos obligatorios
    const requiredFields = [
      { field: nombre, name: "Nombre del proyecto", element: "project-name" },
      { field: direccionInicial, name: "Dirección inicial", element: "project-address-start" },
      { field: direccionFinal, name: "Dirección final", element: "project-address-end" },
      { field: municipio, name: "Municipio", element: "project-municipality" },
      { field: departamento, name: "Departamento", element: "project-department" },
      { field: numPostes, name: "Número de postes", element: "project-posts" },
      { field: fechaInicio, name: "Fecha de inicio", element: "project-start-date" },
      { field: fechaFin, name: "Fecha de fin", element: "project-end-date" },
      { field: puntoConexion, name: "Punto de conexión", element: "project-connection" },
      { field: tipoSolicitud, name: "Tipo de solicitud", element: "project-type" },
    ];

    let isValid = true;
    requiredFields.forEach(({ field, name, element }) => {
      if (!field) {
        const fieldElement = document.getElementById(element);
        fieldElement.classList.add("is-invalid");
        isValid = false;
        console.warn(`Campo requerido vacío: ${name}`);

        if (isValid === false) {
          fieldElement.focus();
          isValid = "scrolled";
        }
      }
    });

    if (isValid !== true) {
      if (isValid === "scrolled") {
        alert("Por favor complete todos los campos obligatorios marcados");
      }
      return;
    }

    // Validar fechas y postes
    if (!validateDates()) {
      return;
    }

    // Obtener barrios
    const neighborhoodItems = document.querySelectorAll("#neighborhoods-list .neighborhood-item");
    const barrios = Array.from(neighborhoodItems).map((item) => item.querySelector("span").textContent);

    // Obtener archivos
    const kmzFile = document.getElementById("project-kmz").files[0];
    const dwgFile = document.getElementById("project-dwg").files[0];
    const matriculaFile = document.getElementById("project-matricula").files[0];
    const ccFile = document.getElementById("project-cc").files[0];
    const formularioFile = document.getElementById("project-formulario").files[0];

    // Obtener usuario logueado
    const loggedUser = Storage.getLoggedUser();
    if (!loggedUser) {
      console.error("No hay usuario logueado");
      alert("Error: No hay usuario logueado. Por favor, inicie sesión nuevamente.");
      window.location.href = "login.html";
      return;
    }

    const prstName = loggedUser.nombrePRST || loggedUser.nombre;
    const isNewProject = !projectId;
    const isEditingRejected = projectId && Storage.getProjectById(projectId)?.estado === "Documentación Errada";

    // Crear objeto del proyecto
    const project = {
      nombre,
      direccionInicial,
      direccionFinal,
      barrios,
      municipio,
      departamento,
      numPostes: Number.parseInt(numPostes),
      fechaInicio,
      fechaFin,
      puntoConexion,
      observaciones: observaciones || "",
      creadorId: loggedUser.id,
      creadorNombre: `${loggedUser.nombre} ${loggedUser.apellido || ""}`,
      prstNombre: prstName,
      tipoSolicitud: tipoSolicitud,
      estado: isNewProject || isEditingRejected ? "En Revisión por Ejecutiva" : "Nuevo",
      documentos: {},
      fechaCreacion: new Date().toISOString(),
      historial: [],
    };

    // Si es edición, mantener datos existentes
    if (projectId) {
      const existingProject = Storage.getProjectById(projectId);
      if (existingProject) {
        project.documentos = { ...existingProject.documentos };
        project.fechaCreacion = existingProject.fechaCreacion;
        project.estado = isEditingRejected ? "En Revisión por Ejecutiva" : existingProject.estado;
        project.historial = existingProject.historial || [];
        project.kmlData = existingProject.kmlData; // Mantener datos KML existentes
      }
    }

    // Procesar archivo KMZ si existe
    if (kmzFile) {
      try {
        console.log("Procesando archivo KMZ...");
        const kmzData = await KMLHandler.processFile(kmzFile);
        project.kmlData = kmzData; // Guardar datos procesados directamente en el proyecto
        project.documentos.kmz = {
          nombre: kmzFile.name,
          tipo: kmzFile.type,
          tamaño: kmzFile.size,
          data: kmzData // Guardar copia en documentos para redundancia
        };
        console.log("Archivo KMZ procesado y guardado correctamente");
      } catch (error) {
        console.error("Error al procesar KMZ:", error);
        alert("Error al procesar el archivo KMZ. Por favor, verifique que el archivo sea válido.");
        return;
      }
    }

    // Actualizar documentos si se suben nuevos archivos
    if (dwgFile) {
      project.documentos.dwg = {
        nombre: dwgFile.name,
        tipo: dwgFile.type,
        tamaño: dwgFile.size
      };
    }

    if (matriculaFile) {
      project.documentos.matricula = {
        nombre: matriculaFile.name,
        tipo: matriculaFile.type,
        tamaño: matriculaFile.size
      };
    }

    if (ccFile) {
      project.documentos.cc = {
        nombre: ccFile.name,
        tipo: ccFile.type,
        tamaño: ccFile.size
      };
    }

    if (formularioFile) {
      project.documentos.formulario = {
        nombre: formularioFile.name,
        tipo: formularioFile.type,
        tamaño: formularioFile.size
      };
    }

    // Generar ID del proyecto si es nuevo
    if (!projectId) {
      const prstList = Storage.getPRSTList();
      const prstInfo = prstList.find(
        (p) =>
          p.nombreCompleto?.toLowerCase() === prstName.toLowerCase() ||
          p.nombreCorto?.toLowerCase() === prstName.toLowerCase()
      );

      const nombreCortoPRST = prstInfo ? prstInfo.nombreCorto.replace(/\s+/g, "_") : prstName.replace(/\s+/g, "_");
      const continuidad = calcularContinuidad(tipoSolicitud, nombreCortoPRST);
      project.id = `${tipoSolicitud}_${nombreCortoPRST}_${continuidad}`;
    } else {
      project.id = projectId;
      project.fechaActualizacion = new Date().toISOString();
    }

    // Obtener ejecutiva asignada al PRST
    const ejecutivaAsignada = getEjecutivaForPRST(prstName);

    // Mostrar confirmación con información de asignación
    if (isNewProject || isEditingRejected) {
      const accion = isNewProject ? "crear y enviar" : "reenviar";
      const confirmMessage =
        `¿Está seguro de ${accion} el proyecto para iniciar el proceso de viabilidad?\n\n` +
        `Este proyecto será enviado a: ${ejecutivaAsignada.nombre} ${ejecutivaAsignada.apellido || ""}\n` +
        `Tipo de solicitud: ${tiposSolicitud[tipoSolicitud]}\n` +
        `Número de postes: ${numPostes}`;

      if (!confirm(confirmMessage)) {
        console.log("Operación cancelada por el usuario");
        return;
      }

      // Registrar en el historial
      project.historial.push({
        estado: isNewProject ? "Creado" : "En Revisión por Ejecutiva",
        fecha: new Date().toISOString(),
        usuario: project.creadorNombre,
        rol: "PRST",
        descripcion: isNewProject
          ? `Proyecto creado y enviado a revisión (${tiposSolicitud[tipoSolicitud]})`
          : "Proyecto reenviado a revisión después de correcciones",
      });
    }

    // Guardar proyecto
    const savedProject = Storage.saveProject(project);
    if (!savedProject) {
      console.error("Error al guardar el proyecto en Storage");
      alert("Error al guardar el proyecto. Por favor, intente nuevamente.");
      return;
    }

    // Asignar a ejecutiva si es nuevo o reenvío
    if (isNewProject || isEditingRejected) {
      assignToExecutive(savedProject, ejecutivaAsignada);
    }

    // Mostrar mensaje de éxito
    const accion = projectId ? (isEditingRejected ? "actualizado y enviado" : "actualizado") : "creado y enviado";
    alert(
      `Proyecto ${accion} con OT AIR-E: ${savedProject.id}\n` +
        `Asignado a: ${ejecutivaAsignada.nombre} ${ejecutivaAsignada.apellido || ""}\n` +
        `Tipo: ${tiposSolicitud[tipoSolicitud]}`
    );

    // Recargar y volver al listado
    loadProjects();
    showView("main-view");
  } catch (error) {
    console.error("Error al guardar proyecto:", error);
    alert("Error al guardar el proyecto: " + error.message);
  }
};

// Función auxiliar para obtener ejecutiva asignada a un PRST
function getEjecutivaForPRST(prstName) {
  const users = Storage.getUsers()
  const prstList = Storage.getPRSTList()

  // Buscar el PRST en la lista para obtener el nombre exacto
  const prstInfo = prstList.find(
    (p) =>
      p.nombreCompleto.toLowerCase() === prstName.toLowerCase() ||
      p.nombreCorto.toLowerCase() === prstName.toLowerCase(),
  )

  const prstFullName = prstInfo ? prstInfo.nombreCompleto : prstName

  // Buscar la ejecutiva que tiene asignado este PRST
  const ejecutivas = users.filter(
    (user) =>
      user.rol === "ejecutiva" &&
      user.activo &&
      user.responsablePRST &&
      user.responsablePRST.some(
        (prst) =>
          prst.toLowerCase() === prstFullName.toLowerCase() ||
          prst.toLowerCase() === (prstInfo?.nombreCorto || "").toLowerCase(),
      ),
  )

  if (ejecutivas.length > 0) {
    return ejecutivas[0]
  }

  // Fallback: asignar a una ejecutiva aleatoria
  console.warn(`No se encontró ejecutiva asignada para PRST: ${prstName}, asignando aleatoriamente`)
  const todasEjecutivas = users.filter((user) => user.rol === "ejecutiva" && user.activo)
  return todasEjecutivas[Math.floor(Math.random() * todasEjecutivas.length)]
}

// Función para asignar proyecto a ejecutiva específica
function assignToExecutive(project, ejecutiva) {
  console.log(`Asignando proyecto ${project.id} a ejecutiva: ${ejecutiva.nombre}`)

  try {
    project.ejecutivaId = ejecutiva.id
    project.ejecutivaNombre = `${ejecutiva.nombre} ${ejecutiva.apellido || ""}`
    project.fechaEnvio = new Date().toISOString()
    project.estado = "En Revisión por Ejecutiva"

    // Registrar asignación en el historial
    project.historial.push({
      estado: "En Revisión por Ejecutiva",
      fecha: new Date().toISOString(),
      usuario: project.creadorNombre,
      rol: "PRST",
      descripcion: `Proyecto asignado a ${project.ejecutivaNombre} para revisión`,
    })

    // Guardar proyecto
    Storage.saveProject(project)

    // Crear notificaciones
    Storage.createNotification({
      usuarioId: project.creadorId,
      tipo: "proyecto_enviado",
      mensaje: `Has enviado el proyecto "${project.nombre}" con ID ${project.id} a revisión. Ha sido asignado a ${project.ejecutivaNombre}.`,
      fechaCreacion: new Date().toISOString(),
      leido: false,
    })

    Storage.createNotification({
      usuarioId: ejecutiva.id,
      tipo: "proyecto_asignado",
      mensaje: `Se te ha asignado un nuevo proyecto para revisar: "${project.nombre}" (OT AIR-E: ${project.id}) del PRST ${project.prstNombre}.`,
      fechaCreacion: new Date().toISOString(),
      leido: false,
    })

    loadNotifications()
  } catch (error) {
    console.error("Error al asignar proyecto a ejecutiva:", error)
  }
}

// Función para calcular la continuidad basada en proyectos existentes
function calcularContinuidad(tipoSolicitud, nombreCortoPRST) {
  console.log(`Calculando continuidad para ${tipoSolicitud}_${nombreCortoPRST}`)

  try {
    // Obtener todos los proyectos
    const allProjects = Storage.getProjects()

    // Filtrar proyectos que coincidan con el tipo de solicitud y PRST
    const matchingProjects = allProjects.filter((project) => {
      if (!project.id) return false

      const idParts = project.id.split("_")
      if (idParts.length !== 3) return false

      const projectTipoSolicitud = idParts[0]
      const projectPRST = idParts[1]

      return projectTipoSolicitud === tipoSolicitud && projectPRST === nombreCortoPRST
    })

    console.log(`Proyectos coincidentes encontrados: ${matchingProjects.length}`)

    // Si no hay proyectos coincidentes, comenzar con 1
    if (matchingProjects.length === 0) {
      return 1
    }

    // Encontrar el número de continuidad más alto
    let maxContinuidad = 0

    matchingProjects.forEach((project) => {
      const idParts = project.id.split("_")
      if (idParts.length === 3) {
        const continuidad = Number.parseInt(idParts[2], 10)
        if (!isNaN(continuidad)) {
          maxContinuidad = Math.max(maxContinuidad, continuidad)
        }
      }
    })

    // Incrementar en 1 para el nuevo proyecto
    return maxContinuidad + 1
  } catch (error) {
    console.error("Error al calcular continuidad:", error)
    return 1 // Valor por defecto en caso de error
  }
}

// Función para validar las fechas
const validateDates = () => {
  try {
    const startDateInput = document.getElementById("project-start-date")
    const endDateInput = document.getElementById("project-end-date")
    const postsInput = document.getElementById("project-posts")
    const prstName = currentUser?.nombrePRST || ""

    if (!startDateInput || !endDateInput || !postsInput) {
      console.warn("Algunos elementos de fecha o postes no encontrados")
      return false
    }

    // 1. Validación de cantidad de postes
    const postsCount = Number.parseInt(postsInput.value, 10) || 0

    // Validar que haya al menos 1 poste
    if (postsCount < 1) {
      alert("Debe ingresar al menos 1 poste")
      postsInput.focus()
      return false
    }

    // Validar máximo 100 postes (excepto para FIBRAZO)
    if (postsCount > 100 && !prstName.toLowerCase().includes("fibrazo")) {
      alert("La cantidad máxima de postes permitida es 100. Solo FIBRAZO puede crear proyectos con más de 100 postes.")
      postsInput.value = ""
      postsInput.focus()
      return false
    }

    // 2. Validación de fechas
    if (!startDateInput.value) {
      console.log("Fecha de inicio no seleccionada, no se valida")
      return true
    }

    const startDate = new Date(startDateInput.value)
    const endDate = endDateInput.value ? new Date(endDateInput.value) : null
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Normalizar la fecha actual

    // Validar que la fecha de inicio sea al menos 5 días después de hoy
    const minStartDate = new Date(today)
    minStartDate.setDate(today.getDate() + 5)

    if (startDate < minStartDate) {
      alert(
        `La fecha de inicio debe ser al menos 5 días después de la fecha actual (${minStartDate.toLocaleDateString("es-ES")})`,
      )
      startDateInput.value = ""
      startDateInput.focus()
      return false
    }

    // Validar que la fecha de inicio no sea más de 30 días en el futuro
    const maxStartDate = new Date(today)
    maxStartDate.setDate(today.getDate() + 30)

    if (startDate > maxStartDate) {
      alert(
        `La fecha de inicio no puede ser más de 30 días después de la fecha actual (${maxStartDate.toLocaleDateString("es-ES")})`,
      )
      startDateInput.value = ""
      startDateInput.focus()
      return false
    }

    // Validar fecha de fin si está presente
    if (endDate) {
      // Validar que la fecha de fin no sea anterior a la fecha de inicio
      if (endDate < startDate) {
        alert("La fecha de finalización no puede ser anterior a la fecha de inicio")
        endDateInput.value = ""
        endDateInput.focus()
        return false
      }

      // Validar duración máxima según cantidad de postes
      if (postsCount > 0) {
        const maxDuration = postsCount <= 50 ? 30 : 45 // 30 días para hasta 50 postes, 45 para más
        const maxEndDate = new Date(startDate)
        maxEndDate.setDate(startDate.getDate() + maxDuration)

        if (endDate > maxEndDate) {
          alert(
            `Para ${postsCount} postes, la duración máxima permitida es de ${maxDuration} días. ` +
              `La fecha de finalización no puede ser posterior a ${maxEndDate.toLocaleDateString("es-ES")}.`,
          )
          endDateInput.value = ""
          endDateInput.focus()
          return false
        }
      }
    }

    console.log("Validaciones de fechas y postes exitosas")
    return true
  } catch (error) {
    console.error("Error en validateDates:", error)
    alert("Ocurrió un error al validar las fechas. Por favor, intente nuevamente.")
    return false
  }
}

// Función para editar proyecto
const editProject = (projectId) => {
  console.log(`Editando proyecto: ${projectId}`)

  try {
    const project = Storage.getProjectById(projectId)
    if (!project) {
      console.error(`Proyecto no encontrado: ${projectId}`)
      alert("No se encontró el proyecto solicitado")
      return
    }

    // Llenar el formulario con los datos del proyecto
    document.getElementById("project-id").value = project.id
    document.getElementById("project-form-title").textContent = "Editar Proyecto"
    document.getElementById("project-name").value = project.nombre || ""
    document.getElementById("project-address-start").value = project.direccionInicial || ""
    document.getElementById("project-address-end").value = project.direccionFinal || ""
    document.getElementById("project-department").value = project.departamento || ""

    // Actualizar municipios después de seleccionar departamento
    updateMunicipalityOptions()
    setTimeout(() => {
      document.getElementById("project-municipality").value = project.municipio || ""
    }, 100)

    document.getElementById("project-posts").value = project.numPostes || ""
    document.getElementById("project-start-date").value = project.fechaInicio ? project.fechaInicio.split("T")[0] : ""
    document.getElementById("project-end-date").value = project.fechaFin ? project.fechaFin.split("T")[0] : ""
    document.getElementById("project-connection").value = project.puntoConexion || ""
    document.getElementById("project-observations").value = project.observaciones || ""
    document.getElementById("project-type").value = project.tipoSolicitud || ""

    // Cargar barrios
    const neighborhoodsList = document.getElementById("neighborhoods-list")
    if (neighborhoodsList) {
      neighborhoodsList.innerHTML = ""
      if (project.barrios && project.barrios.length > 0) {
        project.barrios.forEach((barrio) => {
          addNeighborhood(barrio)
        })
      }
    }

    // Mostrar observaciones de ejecutiva si el proyecto fue rechazado o tiene observaciones
    const ejecutivaObservationsAlert = document.getElementById("ejecutiva-observations-alert")
    if (ejecutivaObservationsAlert) {
      if (project.estado === "Documentación Errada" || project.observacionesEjecutiva) {
        ejecutivaObservationsAlert.classList.remove("d-none")
        ejecutivaObservationsAlert.innerHTML = `
          <strong>Observaciones de la Ejecutiva:</strong><br>
          ${project.observacionesEjecutiva || "Documentación incompleta o incorrecta"}
        `
      } else {
        ejecutivaObservationsAlert.classList.add("d-none")
      }
    }

    // Mostrar vista de formulario
    showView("project-form-view")
  } catch (error) {
    console.error("Error al editar proyecto:", error)
    alert("Error al cargar los datos del proyecto para edición. Por favor, intente nuevamente.")
  }
}

// Función para enviar proyecto a revisión
const sendProject = (projectId) => {
  console.log(`Enviando proyecto a revisión: ${projectId}`)

  try {
    const project = Storage.getProjectById(projectId)
    if (!project) {
      console.error(`Proyecto no encontrado: ${projectId}`)
      alert("No se encontró el proyecto solicitado")
      return
    }

    // Confirmar envío
    if (!confirm(`¿Está seguro de enviar el proyecto "${project.nombre}" a revisión?`)) {
      return
    }

    // Actualizar estado del proyecto
    project.estado = "En Revisión por Ejecutiva"
    project.fechaEnvio = new Date().toISOString()

    // Asignar a una ejecutiva
    const ejecutivaAsignada = getEjecutivaForPRST(project.prstNombre)
    assignToExecutive(project, ejecutivaAsignada)

    // Registrar en el historial
    if (!project.historial) {
      project.historial = []
    }
    project.historial.push({
      estado: "En Revisión por Ejecutiva",
      fecha: new Date().toISOString(),
      usuario: `${currentUser.nombre} ${currentUser.apellido || ""}`,
      rol: "PRST",
      descripcion: "Proyecto enviado a revisión",
    })

    // Guardar proyecto
    Storage.saveProject(project)

    // Mostrar mensaje de éxito
    alert(`Proyecto "${project.nombre}" enviado a revisión exitosamente.`)

    // Recargar proyectos
    loadProjects()
  } catch (error) {
    console.error("Error al enviar proyecto a revisión:", error)
    alert("Error al enviar el proyecto a revisión. Por favor, intente nuevamente.")
  }
}

// Función para mostrar historial del proyecto
const showProjectHistory = (projectId) => {
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
        estado: "Creado",
        fecha: project.fechaCreacion,
        usuario: project.creadorNombre,
        rol: "PRST",
        descripcion: "Proyecto creado y enviado a revisión",
      })

      // Agregar otros estados según las fechas registradas
      if (project.fechaEnvio) {
        project.historial.push({
          estado: "En Revisión por Ejecutiva",
          fecha: project.fechaEnvio,
          usuario: project.creadorNombre,
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
          estado: "En Revisión por Ejecutiva",
          fecha: project.fechaReenvio,
          usuario: project.creadorNombre,
          rol: "PRST",
          descripcion: "Proyecto reenviado a revisión después de correcciones",
        })
      }

      if (project.fechaAprobacion) {
        project.historial.push({
          estado: "En Gestión",
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
    console.log(`Entradas en el historial: ${sortedHistory.length}`)

    // Mapeo de estados para mostrar nombres consistentes
    const estadoMapping = {
      Creado: "Creado",
      "En Revisión por Ejecutiva": "En Revisión por Ejecutiva",
      "En Revision por Ejecutiva": "En Revisión por Ejecutiva",
      "Documentación Errada": "Documentación Errada",
      "En Gestión": "En Gestión",
      "En Gestión por Analista": "En Gestión por Analista",
      "En Gestión por Brigada": "En Gestión por Brigada",
      "Opción Mejorar": "Opción Mejorar",
      Finalizado: "Finalizado",
    }

    // Crear modal para mostrar historial
    const modalHtml = `
      <div class="modal fade" id="historialModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title">Historial del Proyecto: ${project.id}</h5>
              <button type="button" class="btn btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>Fecha y Hora</th>
                      <th>Estado</th>
                      <th>Usuario</th>
                      <th>Rol</th>
                      <th>Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${sortedHistory
                      .map(
                        (item) => `
                      <tr>
                        <td>${formatDate(item.fecha)}</td>
                        <td><span class="badge ${getBadgeClass(item.estado)}">${estadoMapping[item.estado] || item.estado}</span></td>
                        <td>${item.usuario || "No especificado"}</td>
                        <td>${item.rol || "No especificado"}</td>
                        <td>${item.descripcion || "No hay descripción"}</td>
                      </tr>
                    `,
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    `

    // Eliminar modal anterior si existe
    const oldModal = document.getElementById("historialModal")
    if (oldModal) {
      oldModal.remove()
    }

    // Agregar modal al DOM
    document.body.insertAdjacentHTML("beforeend", modalHtml)

    // Mostrar modal
    const historialModal = new bootstrap.Modal(document.getElementById("historialModal"))
    historialModal.show()
  } catch (error) {
    console.error("Error al mostrar historial del proyecto:", error)
    alert("Error al cargar el historial del proyecto. Por favor, intente nuevamente.")
  }
}

// Función para ver detalles de proyecto
const viewProject = (projectId) => {
  console.log(`Viendo detalles del proyecto: ${projectId}`)

  try {
    const project = Storage.getProjectById(projectId)
    if (!project) {
      console.error(`Proyecto no encontrado: ${projectId}`)
      alert("No se encontró el proyecto solicitado")
      return
    }

    console.log("Datos del proyecto a ver:", project)

    // Crear el modal dinámicamente para evitar problemas con elementos no encontrados
    const modalHtml = `
      <div class="modal fade" id="modalDetalleProyecto" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title">Detalles del Proyecto</h5>
              <button type="button" class="btn btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6">
                  <h6>Información General</h6>
                  <table class="table table-sm">
                    <tr>
                      <th>OT AIR-E:</th>
                      <td id="detalleProyectoId">${project.id || "N/A"}</td>
                    </tr>
                    <tr>
                      <th>Nombre del Proyecto:</th>
                      <td id="detalleProyectoNombre">${project.nombre || "Sin nombre"}</td>
                    </tr>
                    <tr>
                      <th>PRST:</th>
                      <td id="detalleProyectoPRST">${project.prstNombre || project.creadorNombre || "No definido"}</td>
                    </tr>
                    <tr>
                      <th>Dirección Inicial:</th>
                      <td id="detalleProyectoDireccionInicial">${project.direccionInicial || "No definido"}</td>
                    </tr>
                    <tr>
                      <th>Dirección Final:</th>
                      <td id="detalleProyectoDireccionFinal">${project.direccionFinal || "No definido"}</td>
                    </tr>
                    <tr>
                      <th>Barrios:</th>
                      <td id="detalleProyectoBarrios">${project.barrios?.join(", ") || "No definido"}</td>
                    </tr>
                  </table>
                </div>
                <div class="col-md-6">
                  <h6>Detalles Adicionales</h6>
                  <table class="table table-sm">
                    <tr>
                      <th>Municipio:</th>
                      <td id="detalleProyectoMunicipio">${project.municipio || "No definido"}</td>
                    </tr>
                    <tr>
                      <th>Departamento:</th>
                      <td id="detalleProyectoDepartamento">${project.departamento || "No definido"}</td>
                    </tr>
                    <tr>
                      <th>Número de Postes:</th>
                      <td id="detalleProyectoNumeroPostes">${project.numPostes || "No definido"}</td>
                    </tr>
                    <tr>
                      <th>Fecha Inicio:</th>
                      <td id="detalleProyectoFechaInicio">${project.fechaInicio ? formatDate(project.fechaInicio) : "N/A"}</td>
                    </tr>
                    <tr>
                      <th>Fecha Fin:</th>
                      <td id="detalleProyectoFechaFin">${project.fechaFin ? formatDate(project.fechaFin) : "N/A"}</td>
                    </tr>
                    <tr>
                      <th>Punto de Conexión Eléctrico:</th>
                      <td id="detalleProyectoPuntoConexion">${project.puntoConexion || "N/A"}</td>
                    </tr>
                  </table>
                </div>
              </div>
              
              <div class="row mt-3">
                <div class="col-md-12">
                  <h6>Estado del Proyecto</h6>
                  <table class="table table-sm">
                    <tr>
                      <th>Estado Actual:</th>
                      <td id="detalleProyectoEstado"><span class="badge ${getBadgeClass(project.estado)}">${project.estado || "No definido"}</span></td>
                    </tr>
                    <tr>
                      <th>Asignado a:</th>
                      <td id="detalleProyectoAsignado">${getAsignacionText(project)}</td>
                    </tr>
                    <tr>
                      <th>Fecha de Asignación:</th>
                      <td id="detalleProyectoFechaAsignacion">${getAsignacionDate(project)}</td>
                    </tr>
                    <tr>
                      <th>Observaciones de PRST:</th>
                      <td id="detalleProyectoObservaciones">${getObservacionesHTML(project)}</td>
                    </tr>
                  </table>
                </div>
              </div>
              
              <div class="row mt-3">
                <div class="col-md-12">
                  <h6>Documentos</h6>
                  <div class="table-responsive">
                    <table class="table table-bordered">
                      <thead>
                        <tr>
                          <th>Documento</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody id="tablaDocumentosDetalle">
                        ${getDocumentosHTML(project)}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    `

    // Eliminar modal anterior si existe
    const oldModal = document.getElementById("modalDetalleProyecto")
    if (oldModal) {
      oldModal.remove()
    }

    // Agregar modal al DOM
    document.body.insertAdjacentHTML("beforeend", modalHtml)

    // Mostrar modal
    const modalDetalleProyecto = new bootstrap.Modal(document.getElementById("modalDetalleProyecto"))
    modalDetalleProyecto.show()
  } catch (error) {
    console.error("Error al ver detalles del proyecto:", error)
    alert("Error al cargar los detalles del proyecto. Por favor, intente nuevamente.")
  }
}

// Función auxiliar para obtener el texto de asignación
const getAsignacionText = (project) => {
  if (project.ejecutivaNombre) {
    return `Ejecutiva: ${project.ejecutivaNombre}`
  } else if (project.analistaNombre) {
    return `Analista: ${project.analistaNombre}`
  } else if (project.brigadaNombre) {
    return `Brigada: ${project.brigadaNombre}`
  }
  return "No asignado"
}

// Función auxiliar para obtener la fecha de asignación
const getAsignacionDate = (project) => {
  let fechaAsignacion = "N/A"

  if (project.ejecutivaNombre && (project.fechaEnvio || project.fechaAsignacion)) {
    fechaAsignacion = formatDate(project.fechaEnvio || project.fechaAsignacion)
  } else if ((project.analistaNombre || project.brigadaNombre) && project.fechaAsignacion) {
    fechaAsignacion = formatDate(project.fechaAsignacion)
  }

  return fechaAsignacion
}

// Función auxiliar para obtener el HTML de las observaciones
function getObservacionesHTML(project) {
  // Priorizar observaciones en este orden: ejecutiva (si hay rechazo), verificador (si hay mejora), PRST
  let observaciones = ""

  if (project.estado === "Documentación Errada" && project.observacionesEjecutiva) {
    observaciones += `<div class="alert alert-danger mb-2">
      <strong>Observaciones de Ejecutiva (Rechazo):</strong><br>
      ${project.observacionesEjecutiva.replace(/\n/g, "<br>")}
    </div>`
  }

  if (project.estado === "Opción Mejorar" && project.observacionesVerificador) {
    observaciones += `<div class="alert alert-warning mb-2">
      <strong>Observaciones de Verificador (Mejoras):</strong><br>
      ${project.observacionesVerificador.replace(/\n/g, "<br>")}
    </div>`
  }

  if (project.observaciones) {
    observaciones += `<div class="mb-0">
      <strong>Observaciones del PRST:</strong><br>
      ${project.observaciones.replace(/\n/g, "<br>")}
    </div>`
  }

  return observaciones || "No hay observaciones"
}

// Función auxiliar para obtener el HTML de los documentos
function getDocumentosHTML(project) {
  if (!project.documentos || Object.keys(project.documentos).length === 0) {
    return `<tr><td colspan="3" class="text-center">No hay documentos disponibles</td></tr>`
  }

  const documentos = [
    { key: "kmz", name: "Archivo KMZ" },
    { key: "dwg", name: "Plano DWG" },
    { key: "plano", name: "Plano PDF" },
    { key: "matricula", name: "Matrícula Profesional" },
    { key: "cc", name: "Cédula de Ciudadanía" },
    { key: "formulario", name: "Formulario de Caracterización" },
  ]

  let html = ""

  documentos.forEach((doc) => {
    if (project.documentos[doc.key]) {
      let estadoDocumento = "Pendiente"
      let badgeClass = "bg-warning"

      if (project.documentosVerificados && project.documentosVerificados[doc.key]) {
        estadoDocumento = project.documentosVerificados[doc.key].aprobado ? "Aprobado" : "Rechazado"
        badgeClass = project.documentosVerificados[doc.key].aprobado ? "bg-success" : "bg-danger"
      }

      html += `
        <tr>
          <td>${doc.name}</td>
          <td><span class="badge ${badgeClass}">${estadoDocumento}</span></td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="descargarDocumento('${project.id}', '${doc.key}')">
              <i class="fas fa-download"></i> Descargar
            </button>
          </td>
        </tr>
      `
    }
  })

  return html || `<tr><td colspan="3" class="text-center">No hay documentos disponibles</td></tr>`
}

// Función para formatear el tipo de solicitud
function formatTipoSolicitud(tipo) {
  if (!tipo) return "N/A"

  const tiposSolicitud = {
    SEV: "(SEV): Nuevo Proyecto a Construir",
    SDR: "(SDR): Desmonte de Proyecto Existente",
    SIPRST: "(SIPRST): Mantenimiento a Red Existente",
  }

  return tiposSolicitud[tipo] || tipo
}

// Función para descargar documento (simulada)
function descargarDocumento(projectId, tipoDocumento) {
  alert(`Simulando descarga del documento ${tipoDocumento} del proyecto ${projectId}`)
  // Aquí iría la lógica real para descargar el documento
}

// Función para cargar las notificaciones del usuario
function loadNotifications() {
  console.log("Cargando notificaciones del usuario")

  if (!currentUser) {
    console.error("No hay usuario actual para cargar notificaciones")
    return
  }

  try {
    const notifications = Storage.getNotificationsByUser(currentUser.id)
    console.log(`Notificaciones encontradas: ${notifications.length}`)

    // Actualizar contador de notificaciones
    const notificationCount = notifications.filter((n) => !n.leido).length
    const notificationBadge = document.getElementById("notification-badge")
    if (notificationBadge) {
      notificationBadge.textContent = notificationCount
      notificationBadge.classList.toggle("d-none", notificationCount === 0)
    } else {
      console.warn("Elemento notification-badge no encontrado")
    }

    // Actualizar lista de notificaciones en el dropdown
    const notificationsList = document.getElementById("notifications-list")
    if (notificationsList) {
      if (notifications.length === 0) {
        notificationsList.innerHTML = `
          <div class="dropdown-item text-center">No tienes notificaciones</div>
        `
      } else {
        notificationsList.innerHTML = ""

        // Mostrar las 5 notificaciones más recientes
        const recentNotifications = notifications
          .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))
          .slice(0, 5)

        recentNotifications.forEach((notification) => {
          const item = document.createElement("div")
          item.className = `dropdown-item notification-item ${notification.leido ? "" : "unread"}`
          item.dataset.id = notification.id

          item.innerHTML = `
            <div class="d-flex align-items-center">
              <div class="notification-icon me-3">
                <i class="fas ${getNotificationIcon(notification.tipo)} text-primary"></i>
              </div>
              <div class="notification-content flex-grow-1">
                <div class="notification-text">${notification.mensaje}</div>
                <div class="notification-time text-muted small">${formatDate(notification.fechaCreacion)}</div>
              </div>
              ${notification.leido ? "" : '<div class="notification-badge"></div>'}
            </div>
          `

          notificationsList.appendChild(item)
        })

        // Agregar enlace para ver todas las notificaciones
        const viewAllLink = document.createElement("div")
        viewAllLink.className = "dropdown-item text-center text-primary"
        viewAllLink.textContent = "Ver todas las notificaciones"
        viewAllLink.id = "viewAllNotifications"
        viewAllLink.style.cursor = "pointer"
        notificationsList.appendChild(viewAllLink)
      }
    } else {
      console.warn("Elemento notifications-list no encontrado")
    }

    console.log("Notificaciones cargadas correctamente")
  } catch (error) {
    console.error("Error al cargar notificaciones:", error)
  }
}

// Obtener icono según el tipo de notificación
function getNotificationIcon(tipo) {
  switch (tipo) {
    case "proyecto_creado":
      return "fa-plus-circle"
    case "proyecto_actualizado":
      return "fa-edit"
    case "proyecto_enviado":
      return "fa-paper-plane"
    case "proyecto_revisado":
      return "fa-check-circle"
    case "proyecto_rechazado":
      return "fa-times-circle"
    case "proyecto_asignado":
      return "fa-user-check"
    case "proyecto_finalizado":
      return "fa-flag-checkered"
    default:
      return "fa-bell"
  }
}

// Marcar notificación como leída
const markNotificationAsRead = (notificationId) => {
  console.log(`Marcando notificación como leída: ${notificationId}`)

  try {
    Storage.markNotificationAsRead(notificationId)
    loadNotifications()
  } catch (error) {
    console.error("Error al marcar notificación como leída:", error)
  }
}

// Cargar todas las notificaciones en el modal
const loadAllNotifications = () => {
  console.log("Cargando todas las notificaciones")

  try {
    if (!currentUser) {
      console.warn("No hay usuario actual para cargar notificaciones")
      return
    }

    const notifications = Storage.getNotificationsByUser(currentUser.id)
    console.log(`Total de notificaciones: ${notifications.length}`)

    const notificationsModalBody = document.getElementById("notifications-modal-body")
    if (notificationsModalBody) {
      if (notifications.length === 0) {
        notificationsModalBody.innerHTML = `
          <p class="text-center">No tienes notificaciones</p>
        `
      } else {
        notificationsModalBody.innerHTML = ""

        // Ordenar notificaciones por fecha (más recientes primero)
        const sortedNotifications = notifications.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))

        sortedNotifications.forEach((notification) => {
          const item = document.createElement("div")
          item.className = `notification-item ${notification.leido ? "" : "unread"}`
          item.dataset.id = notification.id

          item.innerHTML = `
            <div class="d-flex align-items-center mb-3 p-2 border-bottom">
              <div class="notification-icon me-3">
                <i class="fas ${getNotificationIcon(notification.tipo)} text-primary"></i>
              </div>
              <div class="notification-content flex-grow-1">
                <div class="notification-text">${notification.mensaje}</div>
                <div class="notification-time text-muted small">${formatDate(notification.fechaCreacion)}</div>
              </div>
              ${notification.leido ? "" : '<div class="notification-badge"></div>'}
            </div>
          `

          notificationsModalBody.appendChild(item)
        })
      }
    } else {
      console.warn("Elemento notifications-modal-body no encontrado")
    }

    console.log("Todas las notificaciones cargadas correctamente")
  } catch (error) {
    console.error("Error al cargar todas las notificaciones:", error)
  }
}

// Función para formatear fecha
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return "Fecha inválida"
    }

    // Usar toLocaleDateString con opciones específicas para asegurar el formato correcto
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC", // Usar UTC para evitar problemas con zonas horarias
    })
  } catch (error) {
    console.error("Error al formatear fecha:", error)
    return dateString // Devuelve el valor original si no se puede formatear
  }
}

// Función para extraer fechas disponibles
function extractAvailableDates() {
  console.log("Extrayendo fechas disponibles de los proyectos")

  if (!currentUser) {
    console.warn("No hay usuario actual, no se pueden extraer fechas")
    return
  }

  // Obtener todos los proyectos del usuario actual
  const allProjects = Storage.getProjects().filter((project) => project.creadorId === currentUser.id)
  console.log(`Proyectos encontrados para extraer fechas: ${allProjects.length}`)

  // Limpiar conjuntos de fechas
  availableDates.creacion.clear()
  availableDates.inicio.clear()
  availableDates.fin.clear()

  // Extraer todas las fechas únicas de los proyectos
  allProjects.forEach((project) => {
    if (project.fechaCreacion) {
      const date = project.fechaCreacion.split("T")[0]
      availableDates.creacion.add(date)
    }

    if (project.fechaInicio) {
      const date = project.fechaInicio.split("T")[0]
      availableDates.inicio.add(date)
    }

    if (project.fechaFin) {
      const date = project.fechaFin.split("T")[0]
      availableDates.fin.add(date)
    }
  })

  console.log("Fechas disponibles extraídas:", {
    creacion: Array.from(availableDates.creacion),
    inicio: Array.from(availableDates.inicio),
    fin: Array.from(availableDates.fin),
  })
}

// Función para poblar selectores de fecha
function populateDateSelectors() {
  console.log("Poblando selectores de fecha con fechas disponibles")

  const dateType = document.getElementById("filter-date-type").value
  const daySelect = document.getElementById("filter-day")
  const monthSelect = document.getElementById("filter-month")
  const yearSelect = document.getElementById("filter-year")

  if (!daySelect || !monthSelect || !yearSelect) {
    console.warn("No se encontraron los selectores de fecha")
    return
  }

  // Limpiar selectores
  daySelect.innerHTML = '<option value="">Día</option>'
  monthSelect.innerHTML = '<option value="">Mes</option>'
  yearSelect.innerHTML = '<option value="">Año</option>'

  // Obtener fechas para el tipo seleccionado
  const dates = Array.from(availableDates[dateType])

  if (dates.length === 0) {
    console.log(`No hay fechas disponibles para el tipo: ${dateType}`)
    return
  }

  // Extraer días, meses y años únicos
  const uniqueDays = new Set()
  const uniqueMonths = new Set()
  const uniqueYears = new Set()

  dates.forEach((dateStr) => {
    const date = new Date(dateStr)
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()

    uniqueDays.add(day)
    uniqueMonths.add(month)
    uniqueYears.add(year)
  })

  // Poblar días disponibles
  Array.from(uniqueDays)
    .sort((a, b) => Number.parseInt(a) - Number.parseInt(b))
    .forEach((day) => {
      daySelect.innerHTML += `<option value="${day}">${day}</option>`
    })

  // Poblar meses disponibles con nombres
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  Array.from(uniqueMonths)
    .sort((a, b) => Number.parseInt(a) - Number.parseInt(b))
    .forEach((monthNum) => {
      const monthIndex = Number.parseInt(monthNum) - 1
      monthSelect.innerHTML += `<option value="${monthNum}">${monthNames[monthIndex]}</option>`
    })

  // Poblar años disponibles
  Array.from(uniqueYears)
    .sort((a, b) => b - a)
    .forEach((year) => {
      yearSelect.innerHTML += `<option value="${year}">${year}</option>`
    })

  console.log(
    `Selectores de fecha poblados para tipo: ${dateType} con ${uniqueDays.size} días, ${uniqueMonths.size} meses y ${uniqueYears.size} años`,
  )
}

// Función para filtrar proyectos
function filterProjects() {
  console.log("Filtrando proyectos por criterios seleccionados")

  const table = document.getElementById("projects-table-body")
  if (!table) {
    console.warn("Tabla de proyectos no encontrada")
    return
  }

  const rows = table.querySelectorAll("tr")
  if (rows.length === 0) {
    console.log("No hay filas para filtrar")
    return
  }

  // Eliminar mensaje anterior si existe
  const existingMessage = table.querySelector("tr.no-results")
  if (existingMessage) {
    existingMessage.remove()
  }

  // Obtener valores de los filtros
  const otFilter = document.getElementById("filterOT")?.value.toLowerCase() || ""
  const nombreFilter = document.getElementById("filterNombre")?.value.toLowerCase() || ""
  const dayFilter = document.getElementById("filter-day")?.value || ""
  const monthFilter = document.getElementById("filter-month")?.value || ""
  const yearFilter = document.getElementById("filter-year")?.value || ""
  const estadoFilter = document.getElementById("filterEstado")?.value || ""
  const dateType = document.getElementById("filter-date-type")?.value || "creacion"

  console.log("Filtros aplicados:", {
    ot: otFilter,
    nombre: nombreFilter,
    dia: dayFilter,
    mes: monthFilter,
    año: yearFilter,
    estado: estadoFilter,
    tipoFecha: dateType,
  })

  let anyRowVisible = false

  // Recorrer todas las filas
  rows.forEach((row) => {
    // Omitir filas de mensajes
    if (row.querySelector("td[colspan]") || row.classList.contains("no-results")) {
      row.remove()
      return
    }

    const cells = row.querySelectorAll("td")
    if (cells.length < 6) return

    // Obtener valores de las celdas
    const ot = cells[0].textContent.toLowerCase()
    const nombre = cells[1].textContent.toLowerCase()
    const estadoElement = cells[4].querySelector(".badge")
    const estado = estadoElement ? estadoElement.textContent.toLowerCase() : ""
    const projectId = cells[0].textContent

    // Verificar si la fila coincide con los filtros
    const matchesOT = !otFilter || ot.includes(otFilter)
    const matchesNombre = !nombreFilter || nombre.includes(nombreFilter)
    const matchesEstado = !estadoFilter || estado.includes(estadoFilter.toLowerCase())

    // Verificar filtro de fecha
    let matchesDate = true

    if (dayFilter || monthFilter || yearFilter) {
      // Obtener el proyecto completo para acceder a todas las fechas
      const project = Storage.getProjectById(projectId)
      if (!project) {
        matchesDate = false
      } else {
        // Determinar qué fecha usar según el tipo seleccionado
        let dateToCheck
        if (dateType === "creacion" && project.fechaCreacion) {
          dateToCheck = new Date(project.fechaCreacion)
        } else if (dateType === "inicio" && project.fechaInicio) {
          dateToCheck = new Date(project.fechaInicio)
        } else if (dateType === "fin" && project.fechaFin) {
          dateToCheck = new Date(project.fechaFin)
        } else {
          matchesDate = false
        }

        if (dateToCheck) {
          // Verificar día
          if (dayFilter) {
            const day = String(dateToCheck.getDate()).padStart(2, "0")
            matchesDate = matchesDate && day === dayFilter
          }

          // Verificar mes
          if (monthFilter) {
            const month = String(dateToCheck.getMonth() + 1).padStart(2, "0")
            matchesDate = matchesDate && month === monthFilter
          }

          // Verificar año
          if (yearFilter) {
            const year = dateToCheck.getFullYear().toString()
            matchesDate = matchesDate && year === yearFilter
          }
        } else {
          matchesDate = false
        }
      }
    }

    // Mostrar/ocultar fila según los filtros
    if (matchesOT && matchesNombre && matchesDate && matchesEstado) {
      row.style.display = ""
      anyRowVisible = true
    } else {
      row.style.display = "none"
    }
  })

  // Mostrar mensaje si no hay resultados
  if (!anyRowVisible) {
    const noResultsRow = document.createElement("tr")
    noResultsRow.className = "no-results"
    noResultsRow.innerHTML = `
      <td colspan="6" class="text-center">No se encontraron proyectos con los filtros aplicados</td>
    `
    table.appendChild(noResultsRow)
  }

  console.log(`Filtrado completado. Filas visibles: ${anyRowVisible ? "Sí" : "No"}`)
}
