// coordinador.js - Funcionalidades para el rol de Coordinador

document.addEventListener("DOMContentLoaded", () => {
  // Verificar si el usuario está logueado y tiene el rol correcto
  const loggedUser = Storage.getLoggedUser()
  if (!loggedUser || loggedUser.rol !== "coordinador") {
    window.location.href = "login.html"
    return
  }

  // Inicializar variables globales
  let currentProject = null
  const currentAction = null

  // Cargar datos del usuario
  loadUserData()

  // Cargar proyectos según el tipo de coordinador
  loadProjects()

  // Cargar notificaciones
  loadNotifications()

  // Configurar eventos
  setupEventListeners()

  // Función para cargar datos del usuario
  function loadUserData() {
    // Mostrar nombre del usuario
    document.getElementById("nombreUsuario").textContent = loggedUser.nombre
    document.getElementById("nombreCoordinador").textContent = loggedUser.nombre

    // Mostrar tipo de coordinador
    const tipoCoordinador = loggedUser.tipoCoordinador || "No especificado"
    document.getElementById("tipoCoordinador").textContent = tipoCoordinador

    // Cargar datos en la sección de perfil
    document.getElementById("perfilNombre").textContent = `${loggedUser.nombre} ${loggedUser.apellido || ""}`
    document.getElementById("perfilRol").textContent = "Coordinador"
    document.getElementById("perfilTipo").textContent = `Tipo: ${tipoCoordinador}`
    document.getElementById("perfilUsuario").textContent = loggedUser.usuario || "-"
    document.getElementById("perfilCorreo").textContent = loggedUser.correo || "-"
    document.getElementById("perfilDepartamento").textContent = loggedUser.departamento || "-"
    document.getElementById("perfilCargo").textContent = loggedUser.cargo || "Coordinador"

    // Ocultar pestañas según el tipo de coordinador
    if (tipoCoordinador.toLowerCase() !== "operativo") {
      document.getElementById("porAsignar-tab").classList.add("d-none")
    }
  }

  // Función para cargar proyectos
  function loadProjects() {
    const tipoCoordinador = loggedUser.tipoCoordinador?.toLowerCase() || ""
    const allProjects = Storage.getProjects()

    // Filtrar proyectos según el tipo de coordinador
    let proyectosPorAsignar = []
    let proyectosEnGestion = []
    let proyectosVerificados = []
    let proyectosFinalizados = []

    if (tipoCoordinador === "operativo") {
      // Para Wadith (ID 9), mostrar todos los proyectos en estado "En Asignación"
      if (loggedUser.id === "9") {
        proyectosPorAsignar = allProjects.filter((project) => project.estado === "En Asignación")
      } else {
        // Para otros coordinadores operativos
        proyectosPorAsignar = allProjects.filter(
          (project) =>
            project.estado === "En Asignación" &&
            (project.coordinadorId === loggedUser.id || project.coordinadorNombre?.includes(loggedUser.nombre)),
        )
      }

      proyectosEnGestion = allProjects.filter(
        (project) =>
          (project.estado === "Asignado" ||
            project.estado === "En Gestion por Analista" ||
            project.estado === "En Gestion por Brigada") &&
          (project.coordinadorId === loggedUser.id || project.coordinadorNombre?.includes(loggedUser.nombre)),
      )

      proyectosVerificados = allProjects.filter(
        (project) =>
          project.estado === "En Revision de Verificacion" &&
          (project.coordinadorId === loggedUser.id || project.coordinadorNombre?.includes(loggedUser.nombre)),
      )

      proyectosFinalizados = allProjects.filter(
        (project) =>
          (project.estado === "Verificado" ||
            project.estado === "Finalizado" ||
            project.estado === "Generacion de Informe") &&
          (project.coordinadorId === loggedUser.id || project.coordinadorNombre?.includes(loggedUser.nombre)),
      )
    } else if (tipoCoordinador === "administrativo") {
      // Coordinador Administrativo: Solo ve proyectos, no asigna
      proyectosEnGestion = allProjects.filter(
        (project) =>
          (project.estado === "Asignado" ||
            project.estado === "En Gestion por Analista" ||
            project.estado === "En Gestion por Brigada") &&
          project.tipoCoordinacion === "administrativa",
      )

      proyectosVerificados = allProjects.filter(
        (project) =>
          (project.estado === "En Revision de Verificacion" || project.estado === "Verificado") &&
          project.tipoCoordinacion === "administrativa",
      )

      proyectosFinalizados = allProjects.filter(
        (project) =>
          (project.estado === "Finalizado" || project.estado === "Generacion de Informe") &&
          project.tipoCoordinacion === "administrativa",
      )
    } else if (tipoCoordinador === "censo") {
      // Coordinador de Censo: Solo ve proyectos, no asigna
      proyectosEnGestion = allProjects.filter(
        (project) =>
          (project.estado === "Asignado" ||
            project.estado === "En Gestion por Analista" ||
            project.estado === "En Gestion por Brigada") &&
          project.tipoCoordinacion === "censo",
      )

      proyectosVerificados = allProjects.filter(
        (project) =>
          (project.estado === "En Revision de Verificacion" || project.estado === "Verificado") &&
          project.tipoCoordinacion === "censo",
      )

      proyectosFinalizados = allProjects.filter(
        (project) =>
          (project.estado === "Finalizado" || project.estado === "Generacion de Informe") &&
          project.tipoCoordinacion === "censo",
      )
    }

    // Cargar proyectos en las tablas correspondientes
    loadProjectsTable("tablaProyectosPorAsignar", proyectosPorAsignar, "porAsignar")
    loadProjectsTable("tablaProyectosEnGestion", proyectosEnGestion, "enGestion")
    loadProjectsTable("tablaProyectosVerificados", proyectosVerificados, "verificados")
    loadProjectsTable("tablaProyectosFinalizados", proyectosFinalizados, "finalizados")

    // Poblar filtros de fecha
    populateDateFilters()
  }

  // Función para cargar proyectos en una tabla específica
  function loadProjectsTable(tableId, projects, type) {
    const table = document.getElementById(tableId)
    if (!table) {
      console.error(`Tabla con ID ${tableId} no encontrada`)
      return
    }

    if (projects.length === 0) {
      table.innerHTML = `
        <tr>
          <td colspan="8" class="text-center">No hay proyectos disponibles</td>
        </tr>
      `
      return
    }

    table.innerHTML = ""
    projects.forEach((project) => {
      const row = document.createElement("tr")

      if (type === "porAsignar") {
        row.innerHTML = `
          <td>${project.id}</td>
          <td>${project.nombre}</td>
          <td>${project.prstNombre || "No definido"}</td>
          <td>${project.municipio || "No definido"}</td>
          <td>${project.departamento || "No definido"}</td>
          <td>${formatDateTime(project.fechaAprobacion || project.fechaCreacion)}</td>
          <td><span class="badge bg-info">Por Asignar</span></td>
          <td>
            <button class="btn btn-sm btn-primary asignar-proyecto" data-id="${project.id}">
              <i class="bi bi-person-check"></i>
            </button>
            <button class="btn btn-sm btn-info ver-proyecto" data-id="${project.id}">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-sm btn-secondary ver-historial" data-id="${project.id}">
              <i class="bi bi-clock-history"></i>
            </button>
          </td>
        `
      } else if (type === "enGestion") {
        const asignadoA = project.analistaNombre || project.brigadaNombre || "No asignado"
        row.innerHTML = `
          <td>${project.id}</td>
          <td>${project.nombre}</td>
          <td>${project.prstNombre || "No definido"}</td>
          <td>${asignadoA}</td>
          <td>${project.municipio || "No definido"}</td>
          <td>${project.departamento || "No definido"}</td>
          <td>${formatDateTime(project.fechaAsignacion || project.fechaCreacion)}</td>
          <td><span class="badge ${getBadgeClass(project.estado)}">${project.estado}</span></td>
          <td>
            <div class="progress" style="height: 10px;">
              <div class="progress-bar bg-success" role="progressbar"
                   style="width: ${Storage.getProjectProgress(project.id).porcentaje}%;"
                   aria-valuenow="${Storage.getProjectProgress(project.id).porcentaje}"
                   aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <button class="btn btn-sm btn-info ver-proyecto" data-id="${project.id}">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-sm btn-secondary ver-historial" data-id="${project.id}">
              <i class="bi bi-clock-history"></i>
            </button>
          </td>
        `
      } else if (type === "verificados") {
        const verificadoPor = project.analistaNombre || project.brigadaNombre || "No definido"
        row.innerHTML = `
          <td>${project.id}</td>
          <td>${project.nombre}</td>
          <td>${project.prstNombre || "No definido"}</td>
          <td>${verificadoPor}</td>
          <td>${formatDateTime(project.fechaVerificacion || project.fechaCreacion)}</td>
          <td><span class="badge ${getBadgeClass(project.estado)}">${project.estado}</span></td>
          <td>
            ${
              loggedUser.tipoCoordinador?.toLowerCase() === "operativo"
                ? `<button class="btn btn-sm btn-primary revisar-verificacion" data-id="${project.id}">
                    <i class="bi bi-check-circle"></i> Revisar
                   </button>`
                : ""
            }
            <button class="btn btn-sm btn-info ver-proyecto" data-id="${project.id}">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-sm btn-secondary ver-historial" data-id="${project.id}">
              <i class="bi bi-clock-history"></i>
            </button>
          </td>
        `
      } else if (type === "finalizados") {
        row.innerHTML = `
          <td>${project.id}</td>
          <td>${project.nombre}</td>
          <td>${project.prstNombre || "No definido"}</td>
          <td>${formatDateTime(project.fechaFinalizacion || project.fechaCreacion)}</td>
          <td><span class="badge ${getBadgeClass(project.estado)}">${project.estado}</span></td>
          <td>
            <button class="btn btn-sm btn-info ver-proyecto" data-id="${project.id}">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-sm btn-secondary ver-historial" data-id="${project.id}">
              <i class="bi bi-clock-history"></i>
            </button>
          </td>
        `
      }

      table.appendChild(row)
    })
  }

  // Función para configurar los event listeners
  function setupEventListeners() {
    // Marcar todas las notificaciones como leídas
    document.getElementById("markAllAsRead").addEventListener("click", () => {
      Storage.markAllNotificationsAsRead(loggedUser.id)
      loadNotifications()
    })

    // Cerrar sesión
    document.getElementById("cerrarSesion").addEventListener("click", () => {
      Storage.logout()
      window.location.href = "login.html"
    })

    // Ver perfil
    document.getElementById("navPerfil").addEventListener("click", () => {
      document.querySelector(".tab-content").style.display = "none"
      document.getElementById("seccionPerfil").style.display = "block"
    })

    // Volver desde perfil
    document.getElementById("btnVolverDesdePerfil").addEventListener("click", () => {
      document.getElementById("seccionPerfil").style.display = "none"
      document.querySelector(".tab-content").style.display = "block"
    })

    // Cambiar contraseña
    document.getElementById("formCambiarPassword").addEventListener("submit", (e) => {
      e.preventDefault()
      cambiarPassword()
    })

    // Buscar proyectos
    document.getElementById("btnBuscarAsignar").addEventListener("click", () => {
      buscarProyectos("tablaProyectosPorAsignar", "buscarProyectoAsignar")
    })

    document.getElementById("btnBuscarGestion").addEventListener("click", () => {
      buscarProyectos("tablaProyectosEnGestion", "buscarProyectoGestion")
    })

    document.getElementById("btnBuscarVerificado").addEventListener("click", () => {
      buscarProyectos("tablaProyectosVerificados", "buscarProyectoVerificado")
    })

    document.getElementById("btnBuscarFinalizado").addEventListener("click", () => {
      buscarProyectos("tablaProyectosFinalizados", "buscarProyectoFinalizado")
    })

    // Cambiar tipo de asignación
    document.getElementById("tipoAsignacion").addEventListener("change", function () {
      const tipoSeleccionado = this.value
      if (tipoSeleccionado === "analista") {
        document.getElementById("contenedorAnalistas").style.display = "block"
        document.getElementById("contenedorBrigadas").style.display = "none"
      } else {
        document.getElementById("contenedorAnalistas").style.display = "none"
        document.getElementById("contenedorBrigadas").style.display = "block"
      }
    })

    // Asignar proyecto - Evento delegado para botones dinámicos
    document.addEventListener("click", (e) => {
      if (e.target.closest(".asignar-proyecto")) {
        const projectId = e.target.closest(".asignar-proyecto").dataset.id
        abrirModalAsignarProyecto(projectId)
      }
    })

    // Confirmar asignación
    document.getElementById("btnConfirmarAsignacion").addEventListener("click", asignarProyecto)

    // Revisar verificación
    document.addEventListener("click", (e) => {
      if (e.target.closest(".revisar-verificacion")) {
        const projectId = e.target.closest(".revisar-verificacion").dataset.id
        abrirModalRevisarVerificacion(projectId)
      }
    })

    // Ver proyecto
    document.addEventListener("click", (e) => {
      if (e.target.closest(".ver-proyecto")) {
        const projectId = e.target.closest(".ver-proyecto").dataset.id
        abrirModalDetalleProyecto(projectId)
      }
    })

    // Ver historial
    document.addEventListener("click", (e) => {
      if (e.target.closest(".ver-historial")) {
        const projectId = e.target.closest(".ver-historial").dataset.id
        abrirModalHistorialProyecto(projectId)
      }
    })

    // Configurar filtros
    setupFilterEventListeners()
  }

  // Función para abrir el modal de asignar proyecto (CORREGIDA)
  function abrirModalAsignarProyecto(projectId) {
    const project = Storage.getProjectById(projectId)
    if (!project) {
      mostrarMensaje("Error", "No se pudo encontrar el proyecto.")
      return
    }

    currentProject = project

    // Llenar datos del proyecto en el modal
    document.getElementById("proyectoIdAsignar").value = project.id
    document.getElementById("asignarProyectoId").textContent = project.id
    document.getElementById("asignarProyectoNombre").textContent = project.nombre
    document.getElementById("asignarProyectoPRST").textContent = project.prstNombre || "No definido"
    document.getElementById("asignarProyectoMunicipio").textContent = project.municipio || "No definido"
    document.getElementById("asignarProyectoDepartamento").textContent = project.departamento || "No definido"

    // Cargar analistas disponibles
    const analistas = Storage.getUsers().filter((user) => user.rol === "analista" && user.activo)
    const selectAnalistas = document.getElementById("analistaAsignado")
    selectAnalistas.innerHTML = '<option value="">Seleccione un analista</option>'

    analistas.forEach((analista) => {
      const option = document.createElement("option")
      option.value = analista.id
      option.textContent = `${analista.nombre} ${analista.apellido || ""} - ${analista.cargo || "Analista"}`
      selectAnalistas.appendChild(option)
    })

    // Cargar brigadas disponibles
    const brigadas = Storage.getUsers().filter((user) => user.rol === "brigada" && user.activo)
    const selectBrigadas = document.getElementById("brigadaAsignada")
    selectBrigadas.innerHTML = '<option value="">Seleccione una brigada</option>'

    brigadas.forEach((brigada) => {
      const option = document.createElement("option")
      option.value = brigada.id
      option.textContent = `${brigada.nombre} - ${brigada.departamento || "Sin departamento"}`
      selectBrigadas.appendChild(option)
    })

    // Resetear el formulario
    document.getElementById("tipoAsignacion").value = "analista"
    document.getElementById("contenedorAnalistas").style.display = "block"
    document.getElementById("contenedorBrigadas").style.display = "none"
    document.getElementById("comentarioAsignacion").value = ""

    // Mostrar el modal usando Bootstrap
    const modal = new bootstrap.Modal(document.getElementById("modalAsignarProyecto"))
    modal.show()
  }

  // Función para asignar proyecto (CORREGIDA)
  function asignarProyecto() {
    if (!currentProject) {
      mostrarMensaje("Error", "No hay proyecto seleccionado.")
      return
    }

    const tipoAsignacion = document.getElementById("tipoAsignacion").value
    let asignadoId, asignadoNombre, nuevoEstado

    // Validar y obtener datos según el tipo de asignación
    if (tipoAsignacion === "analista") {
      asignadoId = document.getElementById("analistaAsignado").value
      if (!asignadoId) {
        mostrarMensaje("Error", "Por favor seleccione un analista.")
        return
      }
      const analista = Storage.getUserById(asignadoId)
      asignadoNombre = `${analista.nombre} ${analista.apellido || ""}`
      nuevoEstado = "En Gestion por Analista"
    } else {
      asignadoId = document.getElementById("brigadaAsignada").value
      if (!asignadoId) {
        mostrarMensaje("Error", "Por favor seleccione una brigada.")
        return
      }
      const brigada = Storage.getUserById(asignadoId)
      asignadoNombre = brigada.nombre
      nuevoEstado = "En Gestion por Brigada"
    }

    const comentario = document.getElementById("comentarioAsignacion").value

    // Actualizar el proyecto
    currentProject.estado = nuevoEstado
    currentProject.fechaAsignacion = new Date().toISOString()

    if (tipoAsignacion === "analista") {
      currentProject.analistaId = asignadoId
      currentProject.analistaNombre = asignadoNombre
      currentProject.brigadaId = null
      currentProject.brigadaNombre = null
    } else {
      currentProject.brigadaId = asignadoId
      currentProject.brigadaNombre = asignadoNombre
      currentProject.analistaId = null
      currentProject.analistaNombre = null
    }

    // Asegurar que tenga la información del coordinador
    if (!currentProject.coordinadorId) {
      currentProject.coordinadorId = loggedUser.id
      currentProject.coordinadorNombre = `${loggedUser.nombre} ${loggedUser.apellido || ""}`
    }

    // Agregar al historial
    if (!currentProject.historial) {
      currentProject.historial = []
    }

    currentProject.historial.push({
      estado: nuevoEstado,
      fecha: new Date().toISOString(),
      usuario: `${loggedUser.nombre} ${loggedUser.apellido || ""}`,
      rol: "Coordinador",
      comentario: `Proyecto asignado a ${asignadoNombre}${comentario ? `. Comentario: ${comentario}` : ""}`,
    })

    // Guardar los cambios
    Storage.saveProject(currentProject)

    // Notificar al asignado
    Storage.createNotification({
      usuarioId: asignadoId,
      tipo: "proyecto_asignado",
      mensaje: `Se te ha asignado el proyecto "${currentProject.nombre}" (ID: ${currentProject.id}).`,
      fechaCreacion: new Date().toISOString(),
      leido: false,
    })

    // Cerrar el modal
    const modal = bootstrap.Modal.getInstance(document.getElementById("modalAsignarProyecto"))
    modal.hide()

    // Mostrar mensaje de éxito
    mostrarMensaje("Éxito", `Proyecto asignado correctamente a ${asignadoNombre}.`)

    // Recargar la lista de proyectos
    loadProjects()
  }

  // Función para mostrar mensajes
  function mostrarMensaje(titulo, mensaje) {
    document.getElementById("tituloModalMensaje").textContent = titulo
    document.getElementById("textoModalMensaje").textContent = mensaje

    const modalMensaje = new bootstrap.Modal(document.getElementById("modalMensaje"))
    modalMensaje.show()
  }

  // Función para formatear fecha y hora
  function formatDateTime(dateString) {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  // Función para obtener clase de badge según estado
  function getBadgeClass(estado) {
    switch (estado) {
      case "Nuevo":
        return "bg-secondary"
      case "En Revision por Ejecutiva":
        return "bg-warning text-dark"
      case "En Asignación":
        return "bg-info text-dark"
      case "Asignado":
        return "bg-primary"
      case "En Revision de Verificacion":
        return "bg-info"
      case "Opcion Mejorar":
        return "bg-warning"
      case "Generacion de Informe":
        return "bg-light text-dark"
      case "Finalizado":
        return "bg-success"
      case "Documentación Errada":
        return "bg-danger"
      default:
        return "bg-secondary"
    }
  }

  // Función para configurar los filtros
  function setupFilterEventListeners() {
    // Por Asignar tab filters
    document.getElementById("filterNombreAsignar").addEventListener("input", () => {
      filterProjects("tablaProyectosPorAsignar", "Asignar")
    })

    // En Gestión tab filters
    document.getElementById("filterNombreGestion").addEventListener("input", () => {
      filterProjects("tablaProyectosEnGestion", "Gestion")
    })

    // Verificados tab filters
    document.getElementById("filterNombreVerificados").addEventListener("input", () => {
      filterProjects("tablaProyectosVerificados", "Verificados")
    })

    // Finalizados tab filters
    document.getElementById("filterNombreFinalizados").addEventListener("input", () => {
      filterProjects("tablaProyectosFinalizados", "Finalizados")
    })
  }

  // Función para filtrar proyectos
  function filterProjects(tableId, suffix) {
    const table = document.getElementById(tableId)
    if (!table) return

    const rows = table.querySelectorAll("tr")
    if (rows.length <= 1) return // Only header row or no rows

    const nombreFilter = document.getElementById(`filterNombre${suffix}`).value.toLowerCase()

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      const cells = row.querySelectorAll("td")
      if (cells.length < 3) continue

      const nombre = cells[1].textContent.toLowerCase()

      if (!nombreFilter || nombre.includes(nombreFilter)) {
        row.style.display = ""
      } else {
        row.style.display = "none"
      }
    }
  }

  // Función para poblar filtros de fecha
  function populateDateFilters() {
    const allProjects = Storage.getProjects()
    const dates = new Set()

    allProjects.forEach((project) => {
      if (project.fechaCreacion) {
        const date = new Date(project.fechaCreacion).toLocaleDateString()
        dates.add(date)
      }
      if (project.fechaAsignacion) {
        const date = new Date(project.fechaAsignacion).toLocaleDateString()
        dates.add(date)
      }
    })

    const sortedDates = Array.from(dates).sort((a, b) => new Date(b) - new Date(a))

    const dateSelects = [
      document.getElementById("filterFechaAsignar"),
      document.getElementById("filterFechaGestion"),
      document.getElementById("filterFechaVerificados"),
      document.getElementById("filterFechaFinalizados"),
    ]

    dateSelects.forEach((select) => {
      if (select) {
        const firstOption = select.options[0]
        select.innerHTML = ""
        select.appendChild(firstOption)

        sortedDates.forEach((date) => {
          const option = document.createElement("option")
          option.value = date
          option.textContent = date
          select.appendChild(option)
        })
      }
    })
  }

  // Función para cargar notificaciones
  function loadNotifications() {
    const notifications = Storage.getNotificationsByUser(loggedUser.id)
    const notificationCount = document.getElementById("notificationCount")
    const notificationsList = document.getElementById("notificationsList")

    const noLeidas = notifications.filter((n) => !n.leido).length
    notificationCount.textContent = noLeidas

    if (notifications.length === 0) {
      notificationsList.innerHTML = `
        <div class="notification-empty">
          <i class="bi bi-bell-slash"></i>
          <p>No tienes notificaciones</p>
        </div>
      `
      return
    }

    notifications.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))

    let html = ""
    notifications.forEach((notif) => {
      const fecha = new Date(notif.fechaCreacion)
      const fechaFormateada = fecha.toLocaleDateString() + " " + fecha.toLocaleTimeString()

      let icono = "bi-bell"
      let titulo = "Notificación"

      switch (notif.tipo) {
        case "proyecto_asignado":
          icono = "bi-folder-check"
          titulo = "Proyecto Asignado"
          break
        case "proyecto_verificado":
          icono = "bi-clipboard-check"
          titulo = "Proyecto Verificado"
          break
        case "proyecto_rechazado":
          icono = "bi-x-circle"
          titulo = "Proyecto Rechazado"
          break
        case "inicio_sesion":
          icono = "bi-box-arrow-in-right"
          titulo = "Inicio de Sesión"
          break
      }

      html += `
        <div class="notification-item ${notif.leido ? "" : "unread"}" data-id="${notif.id}">
          <div class="d-flex align-items-center">
            <div class="me-2">
              <i class="bi ${icono}"></i>
            </div>
            <div class="flex-grow-1">
              <div class="notification-title">${titulo}</div>
              <div class="notification-message">${notif.mensaje}</div>
              <div class="notification-time">${fechaFormateada}</div>
            </div>
            ${!notif.leido ? '<div class="ms-2"><span class="badge bg-primary">Nueva</span></div>' : ""}
          </div>
        </div>
      `
    })

    notificationsList.innerHTML = html

    document.querySelectorAll(".notification-item").forEach((item) => {
      item.addEventListener("click", () => {
        const id = item.dataset.id
        Storage.markNotificationAsRead(id)
        item.classList.remove("unread")
        item.querySelector(".badge")?.remove()

        const noLeidasActualizadas = Storage.getUnreadNotificationsCount(loggedUser.id)
        notificationCount.textContent = noLeidasActualizadas
      })
    })
  }

  // Función para cambiar contraseña
  function cambiarPassword() {
    const passwordActual = document.getElementById("passwordActual").value
    const passwordNueva = document.getElementById("passwordNueva").value
    const passwordConfirmar = document.getElementById("passwordConfirmar").value

    if (!passwordActual || !passwordNueva || !passwordConfirmar) {
      mostrarMensaje("Error", "Por favor, complete todos los campos.")
      return
    }

    if (passwordNueva !== passwordConfirmar) {
      mostrarMensaje("Error", "Las contraseñas nuevas no coinciden.")
      return
    }

    if (passwordActual !== loggedUser.password) {
      mostrarMensaje("Error", "La contraseña actual es incorrecta.")
      return
    }

    loggedUser.password = passwordNueva
    Storage.saveUser(loggedUser)
    Storage.setLoggedUser(loggedUser)

    mostrarMensaje("Éxito", "Contraseña actualizada correctamente.")
    document.getElementById("formCambiarPassword").reset()
  }

  // Función para buscar proyectos
  function buscarProyectos(tablaId, inputId) {
    const searchText = document.getElementById(inputId).value.toLowerCase()
    const tabla = document.getElementById(tablaId)
    const filas = tabla.querySelectorAll("tr")

    filas.forEach((fila) => {
      if (fila.cells && fila.cells.length > 1) {
        const textoFila = Array.from(fila.cells)
          .map((cell) => cell.textContent.toLowerCase())
          .join(" ")

        if (textoFila.includes(searchText)) {
          fila.style.display = ""
        } else {
          fila.style.display = "none"
        }
      }
    })
  }

  // Fix the view project button functionality
  function abrirModalDetalleProyecto(projectId) {
    console.log(`Abriendo modal de detalle para proyecto: ${projectId}`)

    const project = Storage.getProjectById(projectId)
    if (!project) {
      mostrarMensaje("Error", "No se pudo encontrar el proyecto.")
      return
    }

    // Llenar datos del proyecto en el modal
    document.getElementById("detalleProyectoId").textContent = project.id || "N/A"
    document.getElementById("detalleProyectoNombre").textContent = project.nombre || "Sin nombre"
    document.getElementById("detalleProyectoPRST").textContent = project.prstNombre || "No definido"
    document.getElementById("detalleProyectoMunicipio").textContent = project.municipio || "No definido"
    document.getElementById("detalleProyectoDepartamento").textContent = project.departamento || "No definido"
    document.getElementById("detalleProyectoEstado").innerHTML =
      `<span class="badge ${getBadgeClass(project.estado)}">${project.estado}</span>`

    // Mostrar información de asignación
    let asignadoA = "No asignado"
    if (project.analistaId) {
      asignadoA = `Analista: ${project.analistaNombre || "No especificado"}`
    } else if (project.brigadaId) {
      asignadoA = `Brigada: ${project.brigadaNombre || "No especificado"}`
    }
    document.getElementById("detalleProyectoAsignado").textContent = asignadoA

    // Mostrar fechas
    document.getElementById("detalleProyectoFechaCreacion").textContent = project.fechaCreacion
      ? formatDateTime(project.fechaCreacion)
      : "N/A"
    document.getElementById("detalleProyectoFechaAsignacion").textContent = project.fechaAsignacion
      ? formatDateTime(project.fechaAsignacion)
      : "N/A"

    // Mostrar observaciones si existen
    const observacionesElement = document.getElementById("detalleProyectoObservaciones")
    if (project.observaciones) {
      observacionesElement.textContent = project.observaciones
    } else {
      observacionesElement.textContent = "No hay observaciones"
    }

    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById("modalDetalleProyecto"))
    modal.show()
  }

  // Fix the view history button functionality
  function abrirModalHistorialProyecto(projectId) {
    console.log(`Abriendo modal de historial para proyecto: ${projectId}`)

    const project = Storage.getProjectById(projectId)
    if (!project) {
      mostrarMensaje("Error", "No se pudo encontrar el proyecto.")
      return
    }

    // Obtener historial del proyecto
    const historial = project.historial || []

    // Llenar tabla de historial
    const historialTableBody = document.getElementById("historialProyectoTableBody")
    historialTableBody.innerHTML = ""

    if (historial.length === 0) {
      historialTableBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center">No hay registros en el historial</td>
        </tr>
      `
    } else {
      // Ordenar historial por fecha (más recientes primero)
      historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

      historial.forEach((item) => {
        const row = document.createElement("tr")
        row.innerHTML = `
          <td>${formatDateTime(item.fecha)}</td>
          <td><span class="badge ${getBadgeClass(item.estado)}">${item.estado}</span></td>
          <td>${item.usuario || "No especificado"}</td>
        <td>${item.descripcion || item.comentario || "No hay descripción"}</td>
      `
        historialTableBody.appendChild(row)
      })
    }

    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById("modalHistorialProyecto"))
    modal.show()
  }

  function abrirModalRevisarVerificacion(projectId) {
    console.log(`Abriendo modal de revisar verificación para proyecto: ${projectId}`)

    const project = Storage.getProjectById(projectId)
    if (!project) {
      mostrarMensaje("Error", "No se pudo encontrar el proyecto.")
      return
    }

    // Llenar datos del proyecto en el modal
    document.getElementById("revisarProyectoId").textContent = project.id || "N/A"
    document.getElementById("revisarProyectoNombre").textContent = project.nombre || "Sin nombre"
    document.getElementById("revisarProyectoPRST").textContent = project.prstNombre || "No definido"
    document.getElementById("revisarProyectoMunicipio").textContent = project.municipio || "No definido"
    document.getElementById("revisarProyectoDepartamento").textContent = project.departamento || "No definido"

    // Mostrar el modal
    const modalRevisar = new bootstrap.Modal(document.getElementById("modalRevisarVerificacion"))
    modalRevisar.show()

    // Configurar el botón de "Aprobar Verificación"
    const btnAprobarVerificacion = document.getElementById("btnAprobarVerificacion")
    btnAprobarVerificacion.onclick = () => aprobarVerificacion(project)

    // Configurar el botón de "Rechazar Verificación"
    const btnRechazarVerificacion = document.getElementById("btnRechazarVerificacion")
    btnRechazarVerificacion.onclick = () => rechazarVerificacion(project)
  }

  function aprobarVerificacion(project) {
    // Cambiar el estado del proyecto a "Verificado"
    project.estado = "Verificado"
    project.fechaVerificacion = new Date().toISOString()

    // Agregar al historial
    if (!project.historial) {
      project.historial = []
    }

    project.historial.push({
      estado: "Verificado",
      fecha: new Date().toISOString(),
      usuario: `${loggedUser.nombre} ${loggedUser.apellido || ""}`,
      rol: "Coordinador",
      comentario: "Verificación aprobada por el coordinador.",
    })

    // Guardar los cambios
    Storage.saveProject(project)

    // Cerrar el modal
    const modalRevisar = bootstrap.Modal.getInstance(document.getElementById("modalRevisarVerificacion"))
    modalRevisar.hide()

    // Mostrar mensaje de éxito
    mostrarMensaje("Éxito", "Verificación aprobada correctamente.")

    // Recargar la lista de proyectos
    loadProjects()
  }

  function rechazarVerificacion(project) {
    // Cambiar el estado del proyecto a "Opcion Mejorar"
    project.estado = "Opcion Mejorar"

    // Agregar al historial
    if (!project.historial) {
      project.historial = []
    }

    project.historial.push({
      estado: "Opcion Mejorar",
      fecha: new Date().toISOString(),
      usuario: `${loggedUser.nombre} ${loggedUser.apellido || ""}`,
      rol: "Coordinador",
      comentario: "Verificación rechazada por el coordinador. Se requiere mejorar.",
    })

    // Guardar los cambios
    Storage.saveProject(project)

    // Cerrar el modal
    const modalRevisar = bootstrap.Modal.getInstance(document.getElementById("modalRevisarVerificacion"))
    modalRevisar.hide()

    // Mostrar mensaje de éxito
    mostrarMensaje("Éxito", "Verificación rechazada correctamente.")

    // Recargar la lista de proyectos
    loadProjects()
  }

  // Inicializar Bootstrap tooltips
  document.addEventListener("DOMContentLoaded", () => {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl))
  })
})
