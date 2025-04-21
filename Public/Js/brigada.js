// brigada.js - Funcionalidad para el panel de brigada

document.addEventListener("DOMContentLoaded", () => {
  // Inicializar el almacenamiento
  Storage.init()
  console.log("Storage inicializado en brigada.js")

  // Verificar si hay un usuario logueado
  const loggedUser = Storage.getLoggedUser()
  if (!loggedUser || loggedUser.rol !== "brigada") {
    // Redirigir a la página de login si no hay usuario logueado o no es brigada
    window.location.href = "login.html"
    return
  }

  // Inicializar variables globales
  let map = null
  let mapCenso = null
  let currentProject = null
  let markers = []
  let censoMarkers = []
  let polylines = []
  let selectedPoste = null
  let allProjects = []

  // Inicializar la interfaz
  initUI()
  loadProjects()
  setupEventListeners()

  // Función para inicializar la interfaz de usuario
  function initUI() {
    // Mostrar información del usuario
    document.getElementById("userName").textContent = `${loggedUser.nombre}`
    document.getElementById("userInitials").textContent =
      loggedUser.nombre.charAt(0) + (loggedUser.apellido ? loggedUser.apellido.charAt(0) : "")

    // Cargar notificaciones
    loadNotifications()

    // Inicializar mapas
    setTimeout(() => {
      initMaps()
    }, 100)

    // Mostrar sección de proyectos por defecto
    showSection("seccionProyectos")

    // Cargar información del perfil
    loadProfileInfo()
  }

  // Función para inicializar los mapas
  function initMaps() {
    try {
      // Inicializar mapa principal
      if (!map) {
        map = L.map("map").setView([10.9878, -74.7889], 10) // Coordenadas de Barranquilla
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map)
        console.log("Mapa principal inicializado correctamente")
      }

      // Inicializar mapa de censo
      if (!mapCenso) {
        mapCenso = L.map("mapCenso").setView([10.9878, -74.7889], 10)
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapCenso)
        console.log("Mapa de censo inicializado correctamente")
      }
    } catch (error) {
      console.error("Error al inicializar los mapas:", error)
    }
  }

  // Función para configurar los event listeners
  function setupEventListeners() {
    // Event listeners para navegación
    document.querySelectorAll("[data-section]").forEach((element) => {
      element.addEventListener("click", (e) => {
        e.preventDefault()
        const section = e.target.getAttribute("data-section")
        showSection(section)
      })
    })

    // Event listener para cerrar sesión
    document.getElementById("btnLogout").addEventListener("click", (e) => {
      e.preventDefault()
      Storage.logout()
      window.location.href = "login.html"
    })

    // Event listener para mostrar/ocultar proyectos completados
    document.getElementById("mostrarCompletados").addEventListener("change", () => {
      loadProjects()
    })

    // Event listener para confirmar selección de poste
    document.getElementById("btnConfirmarPoste").addEventListener("click", () => {
      const modalElement = document.getElementById("modalConfirmacionPoste")
      const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement)
      modal.hide()
      showCensoForm()
    })

    // Event listener para ver detalle de censo
    document.getElementById("btnVerDetalleCenso").addEventListener("click", () => {
      const modalElement = document.getElementById("modalPosteCensado")
      const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement)
      modal.hide()
      showCensoDetail(selectedPoste.projectId, selectedPoste.id)
    })

    // Event listener para cancelar censo
    document.getElementById("btnCancelarCenso").addEventListener("click", () => {
      hideCensoForm()
    })

    // Event listener para el formulario de censo
    document.getElementById("formCenso").addEventListener("submit", (e) => {
      e.preventDefault()
      saveCenso()
    })

    // Event listener para el checkbox N/A en elementos existentes
    document.getElementById("elementoNA").addEventListener("change", (e) => {
      const isChecked = e.target.checked
      const otherCheckboxes = document.querySelectorAll("#elementosCheckboxes .elemento-checkbox")

      otherCheckboxes.forEach((checkbox) => {
        checkbox.disabled = isChecked
        if (isChecked) {
          checkbox.checked = false
        }
      })
    })

    // Event listener para los otros checkboxes de elementos
    document.querySelectorAll("#elementosCheckboxes .elemento-checkbox").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          document.getElementById("elementoNA").checked = false
        }
      })
    })

    // Event listener para la cantidad de PRST
    document.getElementById("cantidadPRST").addEventListener("change", (e) => {
      const cantidad = Number.parseInt(e.target.value)
      generatePRSTForms(cantidad)
    })

    // Event listener para agregar foto adicional
    document.getElementById("btnAgregarFoto").addEventListener("click", () => {
      addFotoAdicional()
    })

    // Event listeners para previsualizar fotos
    document.getElementById("fotoGeneral").addEventListener("change", (e) => {
      previewImage(e.target, "previewFotoGeneral")
    })

    document.getElementById("fotoPlaca").addEventListener("change", (e) => {
      previewImage(e.target, "previewFotoPlaca")
    })

    // Event listener para finalizar proyecto
    document.getElementById("btnFinalizarProyecto").addEventListener("click", () => {
      showFinalizarProyectoModal()
    })

    // Event listener para confirmar finalización de proyecto
    document.getElementById("btnConfirmarFinalizarProyecto").addEventListener("click", () => {
      finalizarProyecto()
    })

    // Event listener para cambio de contraseña
    document.getElementById("btnCambiarPassword").addEventListener("click", () => {
      showCambioPasswordModal()
    })

    // Event listener para enviar solicitud de cambio de contraseña
    document.getElementById("btnEnviarSolicitudPassword").addEventListener("click", () => {
      enviarSolicitudCambioPassword()
    })

    // Event listener para notificaciones
    document.getElementById("btnNotificaciones").addEventListener("click", () => {
      // Aquí puedes implementar la lógica para mostrar las notificaciones
      showToast("Función de notificaciones en desarrollo", "info")
    })
  }

  // Función para mostrar una sección específica
  function showSection(sectionId) {
    // Ocultar todas las secciones
    document.querySelectorAll(".section").forEach((section) => {
      section.classList.add("d-none")
    })

    // Mostrar la sección seleccionada
    document.getElementById(sectionId).classList.remove("d-none")

    // Actualizar navegación activa
    document.querySelectorAll("[data-section]").forEach((element) => {
      if (element.getAttribute("data-section") === sectionId) {
        element.classList.add("active")
      } else {
        element.classList.remove("active")
      }
    })

    // Acciones específicas para cada sección
    if (sectionId === "seccionProyectos") {
      // Actualizar mapa principal
      setTimeout(() => {
        if (map) {
          map.invalidateSize()
        } else {
          initMaps()
        }
      }, 100)
    } else if (sectionId === "seccionNuevoCenso") {
      // Verificar si hay un proyecto seleccionado
      if (!currentProject) {
        showToast("Debe seleccionar un proyecto primero", "warning")
        showSection("seccionProyectos")
        return
      }

      // Actualizar mapa de censo
      setTimeout(() => {
        if (mapCenso) {
          mapCenso.invalidateSize()
        } else {
          initMaps()
        }
      }, 100)
    } else if (sectionId === "seccionHistorial") {
      // Cargar historial de proyectos
      loadHistorial()
    }
  }

  // Función para cargar los proyectos asignados a la brigada
  function loadProjects() {
    const userId = loggedUser.id
    const mostrarCompletados = document.getElementById("mostrarCompletados").checked

    // Obtener proyectos asignados a la brigada
    allProjects = Storage.getProjectsByUserId(userId) || []

    // Filtrar proyectos según el estado de "mostrarCompletados"
    const filteredProjects = mostrarCompletados
      ? allProjects
      : allProjects.filter((p) => p.estado !== "completado" && p.estado !== "Finalizado")

    // Limpiar contenedor de proyectos
    const container = document.getElementById("proyectosContainer")
    container.innerHTML = ""

    // Limpiar marcadores del mapa
    clearMap()

    // Si no hay proyectos, mostrar mensaje
    if (filteredProjects.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="alert alert-info">
            <i class="bi bi-info-circle-fill me-2"></i>
            No tiene proyectos asignados actualmente.
          </div>
        </div>
      `
      return
    }

    // Crear tarjetas para cada proyecto
    filteredProjects.forEach((project) => {
      // Calcular progreso del proyecto
      const progress = Storage.getProjectProgress(project.id) || { porcentaje: 0, completados: 0, total: 0 }

      // Determinar estado para mostrar
      let estadoDisplay = ""
      let estadoClass = ""

      switch (project.estado) {
        case "Nuevo":
        case "En Asignación":
          estadoDisplay = "Nuevo proyecto"
          estadoClass = "estado-nuevo"
          break
        case "Asignado":
        case "En Gestion por Brigada":
          estadoDisplay = "Gestionado por Brigada"
          estadoClass = "estado-gestionado"
          break
        case "Documentación Errada":
        case "En Revision de Verificacion":
          estadoDisplay = "Gestionado por Brigada con Observación"
          estadoClass = "estado-observacion"
          break
        case "completado":
        case "Finalizado":
          estadoDisplay = "Completado"
          estadoClass = "estado-completado"
          break
        default:
          estadoDisplay = project.estado || "Nuevo proyecto"
          estadoClass = "bg-secondary"
      }

      // Crear tarjeta de proyecto
      const card = document.createElement("div")
      card.className = "col-md-4 mb-4"
      card.innerHTML = `
        <div class="card project-card" data-project-id="${project.id}">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">${project.prstNombre || "Proyecto sin nombre"}</h5>
            <span class="badge ${estadoClass} estado-badge">${estadoDisplay}</span>
          </div>
          <div class="card-body">
            <p><strong>ID:</strong> ${project.id}</p>
            <p><strong>Departamento:</strong> ${project.departamento || "No especificado"}</p>
            <p><strong>Municipio:</strong> ${project.municipio || "No especificado"}</p>
            <div class="progress mb-3">
              <div class="progress-bar bg-success" role="progressbar" style="width: ${progress.porcentaje}%" 
                aria-valuenow="${progress.porcentaje}" aria-valuemin="0" aria-valuemax="100">
                ${progress.porcentaje}%
              </div>
            </div>
            <div class="text-end">
              <button class="btn btn-primary btn-sm btn-realizar-censo" ${
                project.estado === "completado" || project.estado === "Finalizado" ? "disabled" : ""
              }>
                <i class="bi bi-clipboard-check me-1"></i> Realizar Censo
              </button>
            </div>
          </div>
        </div>
      `

      container.appendChild(card)

      // Agregar event listener para seleccionar proyecto
      const projectCard = card.querySelector(".project-card")
      projectCard.addEventListener("click", () => {
        selectProject(project)
      })

      const btnRealizarCenso = card.querySelector(".btn-realizar-censo")
      btnRealizarCenso.addEventListener("click", (e) => {
        e.stopPropagation() // Evitar que se propague al card
        selectProject(project)
        showSection("seccionNuevoCenso")
      })

      // Agregar marcadores al mapa principal si el proyecto tiene datos KML
      if (project.kmlData && project.kmlData.puntos) {
        addProjectToMap(project)
      }
    })

    // Ajustar vista del mapa para mostrar todos los marcadores
    if (markers.length > 0 && map) {
      try {
        const group = new L.featureGroup(markers)
        map.fitBounds(group.getBounds(), { padding: [50, 50] })
      } catch (error) {
        console.error("Error al ajustar la vista del mapa:", error)
      }
    }
  }

  // Función para agregar un proyecto al mapa principal
  function addProjectToMap(project) {
    if (!project.kmlData || !project.kmlData.puntos || !map) return

    try {
      // Obtener censos realizados para este proyecto
      const censos = Storage.getCensusByProject(project.id) || []
      const censadosIds = new Set(censos.map((c) => c.posteId))

      // Agregar marcadores para cada punto (poste)
      project.kmlData.puntos.forEach((punto) => {
        // Verificar si es un poste
        if (
          isPoste(punto.nombre) ||
          isPoste(punto.descripcion) ||
          /^p\d+$/i.test(punto.nombre) ||
          /^poste\s*\d+$/i.test(punto.nombre) ||
          /^\d+$/.test(punto.nombre)
        ) {
          // Determinar color del marcador según si está censado o no
          const isCensado = censadosIds.has(punto.id)
          const markerColor = isCensado ? "green" : "red"

          // Crear icono personalizado como un pin/marcador en lugar de un punto
          const icon = L.divIcon({
            className: "custom-div-icon",
            html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5); position: relative;">
                    <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 2px; height: 8px; background-color: ${markerColor};"></div>
                  </div>`,
            iconSize: [20, 28],
            iconAnchor: [10, 28],
            popupAnchor: [0, -28],
          })

          // Crear marcador
          const marker = L.marker([punto.lat, punto.lng], { icon: icon })

          // Agregar popup con información
          marker.bindPopup(`
            <h5>Poste: ${punto.nombre || "Sin nombre"}</h5>
            <p>${punto.descripcion || "Sin descripción"}</p>
            <p><strong>Estado:</strong> ${isCensado ? "Censado" : "Pendiente"}</p>
            <p><strong>Proyecto:</strong> ${project.prstNombre || "Sin nombre"}</p>
          `)

          // Agregar marcador al mapa y al array de marcadores
          marker.addTo(map)
          markers.push(marker)
        }
      })

      // Agregar líneas para las rutas si existen
      if (project.kmlData.rutas) {
        project.kmlData.rutas.forEach((ruta) => {
          const points = ruta.puntos.map((p) => [p.lat, p.lng])
          const polyline = L.polyline(points, { color: "blue", weight: 3, opacity: 0.7 })
          polyline.addTo(map)
          polylines.push(polyline)
        })
      }
    } catch (error) {
      console.error("Error al agregar proyecto al mapa:", error)
    }
  }

  // Función para limpiar el mapa principal
  function clearMap() {
    if (!map) return

    try {
      // Eliminar todos los marcadores
      markers.forEach((marker) => {
        map.removeLayer(marker)
      })
      markers = []

      // Eliminar todas las líneas
      polylines.forEach((polyline) => {
        map.removeLayer(polyline)
      })
      polylines = []
    } catch (error) {
      console.error("Error al limpiar el mapa:", error)
    }
  }

  // Función para limpiar el mapa de censo
  function clearCensoMap() {
    if (!mapCenso) return

    try {
      // Eliminar todos los marcadores
      censoMarkers.forEach((marker) => {
        mapCenso.removeLayer(marker)
      })
      censoMarkers = []

      // Eliminar todas las líneas
      polylines.forEach((polyline) => {
        if (mapCenso.hasLayer(polyline)) {
          mapCenso.removeLayer(polyline)
        }
      })
      polylines = []
    } catch (error) {
      console.error("Error al limpiar el mapa de censo:", error)
    }
  }

  // Función para seleccionar un proyecto
  function selectProject(project) {
    // Deseleccionar proyecto anterior si existe
    if (currentProject) {
      const prevProjectCard = document.querySelector(`.project-card[data-project-id="${currentProject.id}"]`)
      if (prevProjectCard) {
        prevProjectCard.classList.remove("selected")
      }
    }

    // Seleccionar nuevo proyecto
    currentProject = project
    const projectCard = document.querySelector(`.project-card[data-project-id="${project.id}"]`)
    if (projectCard) {
      projectCard.classList.add("selected")
    }

    // Actualizar título en sección de nuevo censo
    document.getElementById("proyectoTitulo").textContent = project.prstNombre || "Proyecto sin nombre"

    // Cargar mapa de censo con los datos del proyecto
    loadCensoMap(project)

    // Verificar si todos los postes están censados para mostrar botón de finalizar
    checkProjectCompletion()
  }

  // Función para cargar el mapa de censo con los datos del proyecto
  function loadCensoMap(project) {
    // Limpiar mapa anterior
    clearCensoMap()

    if (!project.kmlData || !project.kmlData.puntos || !mapCenso) {
      showToast("El proyecto no tiene datos de postes", "warning")
      return
    }

    try {
      // Obtener censos realizados para este proyecto
      const censos = Storage.getCensusByProject(project.id) || []
      const censadosIds = new Set(censos.map((c) => c.posteId))

      // Agregar marcadores para cada punto (poste)
      const posteMarkers = []
      project.kmlData.puntos.forEach((punto) => {
        // Verificar si es un poste
        if (
          isPoste(punto.nombre) ||
          isPoste(punto.descripcion) ||
          /^p\d+$/i.test(punto.nombre) ||
          /^poste\s*\d+$/i.test(punto.nombre) ||
          /^\d+$/.test(punto.nombre)
        ) {
          // Determinar color del marcador según si está censado o no
          const isCensado = censadosIds.has(punto.id)
          const markerColor = isCensado ? "green" : "red"

          // Crear icono personalizado como un pin/marcador en lugar de un punto
          const icon = L.divIcon({
            className: "custom-div-icon",
            html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5); position: relative;">
                  <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 2px; height: 8px; background-color: ${markerColor};</div>
                </div>`,
            iconSize: [20, 28],
            iconAnchor: [10, 28],
            popupAnchor: [0, -28],
          })

          // Crear marcador
          const marker = L.marker([punto.lat, punto.lng], { icon: icon })

          // Agregar datos del poste al marcador
          marker.posteData = {
            id: punto.id,
            nombre: punto.nombre || `Poste ${punto.id}`,
            descripcion: punto.descripcion || "",
            lat: punto.lat,
            lng: punto.lng,
            isCensado: isCensado,
            projectId: project.id,
          }

          // Agregar evento de clic al marcador
          marker.on("click", () => {
            onPosteClick(marker)
          })

          // Agregar popup con información
          marker.bindPopup(`
          <h5>Poste: ${punto.nombre || "Sin nombre"}</h5>
          <p>${punto.descripcion || "Sin descripción"}</p>
          <p><strong>Estado:</strong> ${isCensado ? "Censado" : "Pendiente"}</p>
        `)

          // Agregar marcador al mapa y al array de marcadores
          marker.addTo(mapCenso)
          censoMarkers.push(marker)
          posteMarkers.push(marker)
        }
      })

      // Agregar líneas para las rutas si existen
      if (project.kmlData.rutas) {
        project.kmlData.rutas.forEach((ruta) => {
          const points = ruta.puntos.map((p) => [p.lat, p.lng])
          const polyline = L.polyline(points, { color: "blue", weight: 3, opacity: 0.7 })
          polyline.addTo(mapCenso)
          polylines.push(polyline)
        })
      }

      // Ajustar vista del mapa para mostrar todos los marcadores
      if (posteMarkers.length > 0) {
        const group = new L.featureGroup(posteMarkers)
        mapCenso.fitBounds(group.getBounds(), { padding: [50, 50] })
      }
    } catch (error) {
      console.error("Error al cargar el mapa de censo:", error)
    }
  }

  // Función para manejar el clic en un poste
  function onPosteClick(marker) {
    const posteData = marker.posteData

    // Guardar poste seleccionado
    selectedPoste = posteData

    // Si el poste ya está censado, mostrar modal de advertencia
    if (posteData.isCensado) {
      document.getElementById("posteCensadoNombre").textContent = posteData.nombre
      const modal = new bootstrap.Modal(document.getElementById("modalPosteCensado"))
      modal.show()
      return
    }

    // Mostrar modal de confirmación
    document.getElementById("posteSeleccionadoNombre").textContent = posteData.nombre
    const modal = new bootstrap.Modal(document.getElementById("modalConfirmacionPoste"))
    modal.show()
  }

  // Función para mostrar el formulario de censo
  // Función para mostrar el formulario de censo
  function showCensoForm() {
    if (!selectedPoste) {
      showToast("Debe seleccionar un poste para realizar el censo", "warning")
      return
    }

    // Show form
    document.getElementById("formCensoContainer").classList.remove("d-none")
    document.getElementById("instruccionesCenso").classList.add("d-none")

    // Fill hidden fields with pole information
    document.getElementById("projectId").value = currentProject.id
    document.getElementById("posteId").value = selectedPoste.id
    document.getElementById("posteLat").value = selectedPoste.lat
    document.getElementById("posteLng").value = selectedPoste.lng

    // Fill base fields automatically
    const today = new Date()
    const formattedDate = today.toISOString().split("T")[0]
    document.getElementById("fechaCenso").value = formattedDate

    // Make sure the pole name is displayed
    document.getElementById("numeroPoste").value = selectedPoste.nombre || `Poste ${selectedPoste.id}`

    // Format coordinates properly
    document.getElementById("coordenadas").value =
      `${Number.parseFloat(selectedPoste.lat).toFixed(6)}, ${Number.parseFloat(selectedPoste.lng).toFixed(6)}`

    // Make sure the PRST name from the project is displayed
    document.getElementById("prstSolicitante").value = currentProject.prstNombre || "No especificado"

    // Highlight selected pole on the map
    highlightSelectedPoste()

    // Reset form (except automatic fields)
    document.getElementById("tipoPoste").value = ""
    document.getElementById("materialPoste").value = ""
    document.getElementById("alturaPoste").value = ""
    document.getElementById("cantidadPRST").value = ""
    document.getElementById("observacionesPoste").value = ""

    document.getElementById("prstFormsContainer").classList.add("d-none")
    document.getElementById("prstForms").innerHTML = ""

    // Reset checkboxes
    document.getElementById("elementoNA").checked = false
    document.querySelectorAll("#elementosCheckboxes .elemento-checkbox").forEach((checkbox) => {
      checkbox.disabled = false
      checkbox.checked = false
    })

    // Reset photo previews
    document.getElementById("previewFotoPanoramica").src = "./Images/placeholder-image.png"
    document.getElementById("previewFotoDetallada").src = "./Images/placeholder-image.png"
    document.getElementById("previewFotoPlaca").src = "./Images/placeholder-image.png"

    // Scroll to form
    document.getElementById("formCensoContainer").scrollIntoView({ behavior: "smooth" })
  }

  // Función para ocultar el formulario de censo
  function hideCensoForm() {
    document.getElementById("formCensoContainer").classList.add("d-none")
    document.getElementById("instruccionesCenso").classList.remove("d-none")
    selectedPoste = null

    // Quitar resaltado del poste
    unhighlightSelectedPoste()
  }

  // Función para resaltar el poste seleccionado en el mapa
  function highlightSelectedPoste() {
    if (!mapCenso) return

    // Quitar resaltado anterior
    unhighlightSelectedPoste()

    // Buscar marcador del poste seleccionado
    const marker = censoMarkers.find((m) => m.posteData && m.posteData.id === selectedPoste.id)
    if (marker) {
      // Cambiar icono a azul para resaltar
      const icon = L.divIcon({
        className: "custom-div-icon",
        html: `<div style="background-color: blue; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.7); position: relative;">
              <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 3px; height: 10px; background-color: blue;"></div>
            </div>`,
        iconSize: [24, 34],
        iconAnchor: [12, 34],
        popupAnchor: [0, -34],
      })
      marker.setIcon(icon)
    }
  }

  // Función para quitar el resaltado del poste seleccionado
  function unhighlightSelectedPoste() {
    if (!mapCenso) return

    censoMarkers.forEach((marker) => {
      if (marker.posteData) {
        const isCensado = marker.posteData.isCensado
        const markerColor = isCensado ? "green" : "red"
        const icon = L.divIcon({
          className: "custom-div-icon",
          html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5); position: relative;">
                <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 2px; height: 8px; background-color: ${markerColor};</div>
              </div>`,
          iconSize: [20, 28],
          iconAnchor: [10, 28],
          popupAnchor: [0, -28],
        })
        marker.setIcon(icon)
      }
    })
  }

  // Función para generar formularios de PRST
  function generatePRSTForms(cantidad) {
    const container = document.getElementById("prstForms")
    container.innerHTML = ""

    if (cantidad <= 0) {
      document.getElementById("prstFormsContainer").classList.add("d-none")
      return
    }

    document.getElementById("prstFormsContainer").classList.remove("d-none")

    // Lista de PRST para el datalist
    const prstList = [
      "AIRE",
      "AIRTEK CARRIER SERVICES",
      "MUNICIPAL DE MAICAO",
      "TOTAL CONEXION",
      "APC LINK",
      "AUDICOL",
      "AWATA WIRELESS",
      "AZTECA",
      "MEGATEL",
      "CABLE EXPRESS",
      "CABLE GUAJIRA LTDA",
      "CABLE HOGAR.NET",
      "CAFETEL COMMUNICATIONS GROUP",
      "CARIBE INTERCOMUNICACIONES",
      "CARIBETECH",
      "CIRION TECHNOLOGIES COLOMBIA",
      "MOVISTAR",
      "COMUNET TELECOMUNICACIONES",
      "CLARO",
      "CLARO-S",
      "COMUNICACIONES TERRESTRES DE COLOMBIA",
      "CONETTA",
      "CGVE",
      "DATA LAN",
      "Dialnet",
      "DIGITAL COAST",
      "DIGITVNET",
      "DRACO NET",
      "ECONEXION",
      "ELECNORTE SAS ESP",
      "EME INGENIERIA S.A.",
      "ETB",
      "COSTATEL",
      "ENERGIZANDO - INGENIERÍA Y CONSTRUCCIÓN",
      "FIBER FAST",
      "FIBERCOMM",
      "FIBERLINK COMUNICACIONES",
      "FIBRAXO",
      "ELECNORTE",
      "GTD",
      "GUAJIRANET ISP",
      "TVNET",
      "IMB INGENIERIA EN REDES",
      "INTEGRA MULTISOLUTIONS",
      "INTELEXA DE COLOMBIA",
      "INTER REDES DEL MAGDALENA",
      "INTERCABLE",
      "INTERCAR.NET",
      "CABLE EXITO",
      "ISA",
      "INTERCONEXIONES TECNOLOGICAS DEL CARIBE SAS (INTERCON)",
      "INTERCOSTA",
      "INTERNET Y TELECOMUNICACIONES DE COLOMBIA",
      "INTERNEXA",
      "INTERNEXT",
      "INTERTEL SATELITAL",
      "INVERSIONES ACOSTA VERGARA",
      "INVERSIONES RODRIGUEZ MEJIA",
      "IST INGENIERIA Y SOLUCIONES TECNOLOGICAS",
      "POLICIA NACIONAL",
      "ITELKOM",
      "JALU SOLUCIONES",
      "JHOSDY TELECOMUNICACIONES",
      "C&W Network",
      "LOGISTICA EN TELECOMUNICACIONES",
      "MACITEL",
      "MAOTECH TELECOMUNICACIONES",
      "MEDIA COMMERCE",
      "MEGA TV",
      "NOVACLICK",
      "O2 ONLINE",
      "ONNET",
      "WOM",
      "PLUSNET",
      "PRODATEL",
      "PROMO VISIÓN",
      "QUEST TELECOM",
      "R&R TELECOMUNICACIONES",
      "RAPILINK",
      "REDES TELECOMUNICACIONES DIGITALES DE COLOMBIA",
      "SAVASA SOLUCIONES INTEGRALES",
      "DATASET",
      "SERVICIOS INTEGRALES PERSONALIZADOS",
      "SERVICOM J&E",
      "SERVISOLUCIONES JM",
      "SIN IDENTIFICAR",
      "SMK DUO CONEXCION",
      "SOLUCIONES DANTEL",
      "E-VOLT TECK",
      "SEGITEL",
      "SOLUNET DIGITAL",
      "SPACE COMUNICACIONES",
      "STARCOM CARIBE",
      "SUPERCABLE TELECOMUNICACIONES",
      "TELECOMUNICACIONES ZONA BANANERA",
      "TIRIAN TELECOMUNICACIONES",
      "TOP LINK",
      "TUNORTETV TELECOMUNICACIONES",
      "TV COMUNICACIONES JL",
      "TV LINE",
      "TV ZONA BANANERA",
      "UFINET",
      "TIGO",
      "VENTELCO",
      "VYC NETWORKS",
      "WAYIRANET",
      "WIPA",
    ]

    // Crear datalist para autocompletado
    const datalistHtml = `
    <datalist id="prstOptions">
      ${prstList.map((prst) => `<option value="${prst}">`).join("")}
    </datalist>
  `
    container.insertAdjacentHTML("beforeend", datalistHtml)

    for (let i = 1; i <= cantidad; i++) {
      const formHtml = `
      <div class="prst-form mb-4">
        <h6 class="mb-3">PRST #${i}</h6>
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label required-field">Nombre del PRST</label>
            <input type="text" class="form-control prst-nombre" list="prstOptions" required>
            <div class="invalid-feedback">Campo obligatorio</div>
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label required-field">Cantidad de Cables</label>
            <input type="number" class="form-control prst-cantidad-cables" min="1" required>
            <div class="invalid-feedback">Campo obligatorio</div>
          </div>
        </div>
        
        <div class="row">
          <div class="col-md-3 mb-3">
            <label class="form-label required-field">Caja de empalme</label>
            <input type="number" class="form-control prst-caja-empaque" min="0" required>
            <div class="invalid-feedback">Campo obligatorio</div>
          </div>
          <div class="col-md-3 mb-3">
            <label class="form-label required-field">Reserva</label>
            <input type="number" class="form-control prst-reserva" min="0" required>
            <div class="invalid-feedback">Campo obligatorio</div>
          </div>
          <div class="col-md-3 mb-3">
            <label class="form-label required-field">NAP</label>
            <input type="number" class="form-control prst-nap" min="0" required>
            <div class="invalid-feedback">Campo obligatorio</div>
          </div>
          <div class="col-md-3 mb-3">
            <label class="form-label required-field">SPT</label>
            <input type="number" class="form-control prst-spt" min="0" required>
            <div class="invalid-feedback">Campo obligatorio</div>
          </div>
        </div>
        
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label required-field">Bajante</label>
            <input type="number" class="form-control prst-bajante" min="0" required>
            <div class="invalid-feedback">Campo obligatorio</div>
          </div>
        </div>
        
        <div class="row">
          <div class="col-md-12 mb-3">
            <label class="form-label">Observaciones</label>
            <textarea class="form-control prst-observaciones" rows="2"></textarea>
          </div>
        </div>
      </div>
    `
      container.insertAdjacentHTML("beforeend", formHtml)
    }
  }

  // Modificar la función getPRSTData para incluir los campos obligatorios
  function getPRSTData() {
    const cantidadPRST = Number.parseInt(document.getElementById("cantidadPRST").value)
    if (cantidadPRST <= 0) return []

    const prstData = []
    const prstForms = document.querySelectorAll(".prst-form")

    prstForms.forEach((form) => {
      prstData.push({
        nombre: form.querySelector(".prst-nombre").value,
        cantidadCables: form.querySelector(".prst-cantidad-cables").value,
        cajaEmpalme: form.querySelector(".prst-caja-empaque").value,
        reserva: form.querySelector(".prst-reserva").value,
        nap: form.querySelector(".prst-nap").value,
        spt: form.querySelector(".prst-spt").value,
        bajante: form.querySelector(".prst-bajante").value,
        observaciones: form.querySelector(".prst-observaciones")?.value || "",
      })
    })

    return prstData
  }

  // Función para previsualizar imagen
  function previewImage(input, previewId) {
    if (input.files && input.files[0]) {
      const reader = new FileReader()
      reader.onload = (e) => {
        document.getElementById(previewId).src = e.target.result
      }
      reader.readAsDataURL(input.files[0])
    }
  }

  // Función para previsualizar imagen adicional
  function previewAdditionalImage(input) {
    if (input.files && input.files[0]) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const container = input.closest(".foto-container")
        if (container) {
          const preview = container.querySelector(".foto-preview")
          const btnRemove = container.querySelector(".btn-remove")

          if (preview) preview.src = e.target.result
          if (btnRemove) btnRemove.classList.remove("d-none")

          // Agregar event listener para eliminar foto
          if (btnRemove) {
            btnRemove.addEventListener("click", () => {
              if (preview) preview.src = "./Images/placeholder-image.png"
              input.value = ""
              btnRemove.classList.add("d-none")
            })
          }

          // Agregar nueva foto adicional si es la última
          const allFotoContainers = document.querySelectorAll(".fotoAdicional")
          if (input === allFotoContainers[allFotoContainers.length - 1]) {
            addFotoAdicional()
          }
        }
      }
      reader.readAsDataURL(input.files[0])
    }
  }

  // Función para agregar campo de foto adicional
  function addFotoAdicional() {
    const container = document.getElementById("fotosAdicionalesContainer")
    if (!container) return

    const newFotoHtml = `
      <div class="col-md-3 mb-3">
        <div class="foto-container">
          <img src="./Images/placeholder-image.png" class="foto-preview">
          <label class="custom-file-upload w-100">
            <i class="bi bi-camera"></i> Seleccionar Foto
            <input type="file" class="fotoAdicional" accept="image/*" style="display: none;">
          </label>
          <button type="button" class="btn-remove d-none"><i class="bi bi-x"></i></button>
        </div>
      </div>
    `
    container.insertAdjacentHTML("beforeend", newFotoHtml)

    // Agregar event listener para la nueva foto
    const newInput = container.querySelector(".foto-container:last-child .fotoAdicional")
    if (newInput) {
      newInput.addEventListener("change", (e) => {
        previewAdditionalImage(e.target)
      })
    }
  }

  // Función para guardar el censo
  // Modificar la función saveCenso para corregir la subida de imágenes y agregar validación de campos adicionales
  function saveCenso() {
    // Resetear mensajes de error
    document.querySelectorAll(".is-invalid").forEach((el) => {
      el.classList.remove("is-invalid")
    })
    document.querySelectorAll(".invalid-feedback").forEach((el) => {
      el.style.display = "none"
    })

    // Validar campos obligatorios
    let isValid = true

    // Validar campos de características del poste
    const requiredFields = ["tipoPoste", "materialPoste", "alturaPoste", "cantidadPRST"]

    requiredFields.forEach((fieldId) => {
      const field = document.getElementById(fieldId)
      if (!field || field.value === "") {
        field.classList.add("is-invalid")
        const feedback = field.nextElementSibling
        if (feedback && feedback.classList.contains("invalid-feedback")) {
          feedback.style.display = "block"
        }
        isValid = false
      }
    })

    // Validar elementos existentes
    const elementoNA = document.getElementById("elementoNA")
    const elementosCheckboxes = document.querySelectorAll("#elementosCheckboxes .elemento-checkbox:checked")

    if (!elementoNA.checked && elementosCheckboxes.length === 0) {
      document.getElementById("elementosError").classList.remove("d-none")
      isValid = false
    } else {
      document.getElementById("elementosError").classList.add("d-none")
    }

    // Validar fotos
    const fotoFields = ["fotoPanoramica", "fotoDetallada", "fotoPlaca"]
    fotoFields.forEach((fieldId) => {
      const fileInput = document.getElementById(fieldId)
      if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        const container = fileInput.closest(".foto-container")
        if (container) {
          container.classList.add("is-invalid")
          const feedback = container.querySelector(".invalid-feedback")
          if (feedback) feedback.style.display = "block"
        }
        isValid = false
      } else {
        const container = fileInput.closest(".foto-container")
        if (container) {
          container.classList.remove("is-invalid")
        }
      }
    })

    // Validar PRST si cantidad > 0
    const cantidadPRST = Number.parseInt(document.getElementById("cantidadPRST").value)
    if (cantidadPRST > 0) {
      const prstForms = document.querySelectorAll(".prst-form")
      prstForms.forEach((form) => {
        const nombre = form.querySelector(".prst-nombre")
        const cables = form.querySelector(".prst-cantidad-cables")
        // Validar campos adicionales obligatorios
        const cajaEmpalme = form.querySelector(".prst-caja-empaque")
        const reserva = form.querySelector(".prst-reserva")
        const nap = form.querySelector(".prst-nap")
        const spt = form.querySelector(".prst-spt")
        const bajante = form.querySelector(".prst-bajante")

        if (!nombre || !nombre.value) {
          nombre.classList.add("is-invalid")
          isValid = false
        } else {
          nombre.classList.remove("is-invalid")
        }

        if (!cables || !cables.value) {
          cables.classList.add("is-invalid")
          isValid = false
        } else {
          cables.classList.remove("is-invalid")
        }

        // Validar campos adicionales
        if (!cajaEmpalme || cajaEmpalme.value === "") {
          cajaEmpalme.classList.add("is-invalid")
          isValid = false
        } else {
          cajaEmpalme.classList.remove("is-invalid")
        }

        if (!reserva || reserva.value === "") {
          reserva.classList.add("is-invalid")
          isValid = false
        } else {
          reserva.classList.remove("is-invalid")
        }

        if (!nap || nap.value === "") {
          nap.classList.add("is-invalid")
          isValid = false
        } else {
          nap.classList.remove("is-invalid")
        }

        if (!spt || spt.value === "") {
          spt.classList.add("is-invalid")
          isValid = false
        } else {
          spt.classList.remove("is-invalid")
        }

        if (!bajante || bajante.value === "") {
          bajante.classList.add("is-invalid")
          isValid = false
        } else {
          bajante.classList.remove("is-invalid")
        }
      })
    }

    if (!isValid) {
      showToast("Complete todos los campos obligatorios", "danger")
      return
    }

    // Procesar fotos como base64
    const processPhoto = (fileInput) => {
      return new Promise((resolve) => {
        if (fileInput.files && fileInput.files[0]) {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target.result)
          reader.readAsDataURL(fileInput.files[0])
        } else {
          resolve(null)
        }
      })
    }

    // Esperar a que todas las fotos se procesen
    Promise.all([
      processPhoto(document.getElementById("fotoPanoramica")),
      processPhoto(document.getElementById("fotoDetallada")),
      processPhoto(document.getElementById("fotoPlaca")),
    ])
      .then(([fotoPanoramica, fotoDetallada, fotoPlaca]) => {
        // Crear objeto de censo
        const censoData = {
          id: Date.now().toString(),
          projectId: document.getElementById("projectId").value,
          posteId: document.getElementById("posteId").value,
          posteNombre: document.getElementById("numeroPoste").value,
          posteLat: document.getElementById("posteLat").value,
          posteLng: document.getElementById("posteLng").value,
          fechaCenso: document.getElementById("fechaCenso").value,
          numeroPoste: document.getElementById("numeroPoste").value,
          coordenadas: document.getElementById("coordenadas").value,
          prstSolicitante: document.getElementById("prstSolicitante").value,
          tipoPoste: document.getElementById("tipoPoste").value,
          materialPoste: document.getElementById("materialPoste").value,
          alturaPoste: document.getElementById("alturaPoste").value,
          cantidadPRST: cantidadPRST,
          elementos: getSelectedElementos(),
          prst: getPRSTData(),
          fotos: {
            panoramica: fotoPanoramica,
            detallada: fotoDetallada,
            placa: fotoPlaca,
          },
          observaciones: document.getElementById("observacionesPoste").value,
          fechaRegistro: new Date().toISOString(),
          censadoPor: {
            id: loggedUser.id,
            nombre: loggedUser.nombre,
            apellido: loggedUser.apellido,
          },
          estado: "pendiente",
          revision: {
            requiereRevision: false,
            observaciones: "",
          },
        }

        // Mostrar modal para preguntar sobre el estado del poste
        mostrarModalEstadoPoste(censoData)
      })
      .catch((error) => {
        console.error("Error al procesar fotos:", error)
        showToast("Error al procesar las fotografías", "danger")
      })
  }

  // Función para mostrar modal preguntando por el estado del poste
  function mostrarModalEstadoPoste(censoData) {
    // Crear modal dinámicamente
    const modalHtml = `
    <div class="modal fade" id="modalEstadoPoste" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Estado del Poste</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>¿El poste ${censoData.numeroPoste} se encuentra en buen estado y cumple con todas las normativas técnicas requeridas?</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-danger" id="btnMalEstado">No, presenta problemas</button>
            <button type="button" class="btn btn-success" id="btnBuenEstado">Sí, está en buen estado</button>
          </div>
        </div>
      </div>
    </div>
  `

    // Agregar modal al DOM
    document.body.insertAdjacentHTML("beforeend", modalHtml)

    // Obtener referencia al modal
    const modalElement = document.getElementById("modalEstadoPoste")
    const modal = new bootstrap.Modal(modalElement)

    // Mostrar modal
    modal.show()

    // Manejar respuesta "Buen estado"
    document.getElementById("btnBuenEstado").addEventListener("click", () => {
      censoData.estadoPoste = "bueno"
      finalizarGuardadoCenso(censoData, false)
      modal.hide()
      // Eliminar modal del DOM después de ocultarlo
      modalElement.addEventListener("hidden.bs.modal", () => {
        modalElement.remove()
      })
    })

    // Manejar respuesta "Mal estado"
    document.getElementById("btnMalEstado").addEventListener("click", () => {
      censoData.estadoPoste = "malo"
      finalizarGuardadoCenso(censoData, true)
      modal.hide()
      // Eliminar modal del DOM después de ocultarlo
      modalElement.addEventListener("hidden.bs.modal", () => {
        modalElement.remove()
      })
    })
  }

  // Función para finalizar el guardado del censo después de determinar el estado del poste
  function finalizarGuardadoCenso(censoData, requiereObservacion) {
    // Guardar en localStorage
    const censos = JSON.parse(localStorage.getItem(Storage.KEYS.CENSUS) || "[]")
    censos.push(censoData)
    localStorage.setItem(Storage.KEYS.CENSUS, JSON.stringify(censos))

    // Actualizar estado del proyecto
    const project = Storage.getProjectById(censoData.projectId)
    if (project) {
      // Si requiere observación, cambiar estado a "Gestionado por Brigada con Observación"
      if (requiereObservacion) {
        project.estado = "Documentación Errada"
      } else {
        // Verificar si todos los postes están en buen estado
        const todosPostesBuenEstado = verificarTodosPostesBuenEstado(project.id)

        // Si todos los postes están en buen estado, cambiar a "Gestionado por Brigada"
        // Si no, mantener el estado actual
        if (todosPostesBuenEstado) {
          project.estado = "En Gestion por Brigada"
        }
      }

      Storage.saveProject(project)
    }

    // Crear notificación
    Storage.createNotification({
      usuarioId: loggedUser.id,
      tipo: "censo_completado",
      mensaje: `Censo completado para poste ${censoData.numeroPoste} (Proyecto: ${project?.prstNombre || "Sin nombre"})`,
      fechaCreacion: new Date().toISOString(),
      leido: false,
      metadata: {
        proyectoId: censoData.projectId,
        posteId: censoData.posteId,
        censoId: censoData.id,
      },
    })

    // Mostrar mensaje de éxito
    showToast("Censo guardado correctamente", "success")

    // Actualizar interfaz
    updateMapAfterCenso(censoData)
    hideCensoForm()
    checkProjectCompletion()
  }

  // Función para verificar si todos los postes censados están en buen estado
  function verificarTodosPostesBuenEstado(projectId) {
    const censos = Storage.getCensusByProject(projectId) || []

    // Si no hay censos, devolver true (no hay problemas)
    if (censos.length === 0) return true

    // Verificar si hay algún poste en mal estado
    const hayPosteMalEstado = censos.some((censo) => censo.estadoPoste === "malo")

    // Devolver true si todos están en buen estado (no hay ninguno en mal estado)
    return !hayPosteMalEstado
  }

  // Modificar la función generatePRSTForms para hacer obligatorios los campos adicionales

  // Modificar la función getPRSTData para incluir los campos obligatorios

  // Función para validar el formulario de censo
  function validateCensoForm2() {
    let isValid = true
    const requiredFields = [
      "tipoPoste",
      "materialPoste",
      "alturaPoste",
      "estadoPoste",
      "cantidadPRST",
      "propietarioPoste",
    ]

    // Validar campos requeridos
    requiredFields.forEach((field) => {
      const element = document.getElementById(field)
      if (element && !element.value) {
        element.classList.add("is-invalid")
        isValid = false
      } else if (element) {
        element.classList.remove("is-invalid")
      }
    })

    // Validar fotos requeridas
    const previewFotoGeneral = document.getElementById("previewFotoGeneral")
    const fotoGeneral = document.getElementById("fotoGeneral")
    if (previewFotoGeneral && previewFotoGeneral.src.includes("placeholder-image.png") && fotoGeneral) {
      fotoGeneral.classList.add("is-invalid")
      isValid = false
    } else if (fotoGeneral) {
      fotoGeneral.classList.remove("is-invalid")
    }

    const previewFotoPlaca = document.getElementById("previewFotoPlaca")
    const fotoPlaca = document.getElementById("fotoPlaca")
    if (previewFotoPlaca && previewFotoPlaca.src.includes("placeholder-image.png") && fotoPlaca) {
      fotoPlaca.classList.add("is-invalid")
      isValid = false
    } else if (fotoPlaca) {
      fotoPlaca.classList.remove("is-invalid")
    }

    // Validar formularios de PRST si hay cantidad > 0
    const cantidadPRSTElement = document.getElementById("cantidadPRST")
    if (cantidadPRSTElement) {
      const cantidadPRST = Number.parseInt(cantidadPRSTElement.value)
      if (cantidadPRST > 0) {
        const prstNombres = document.querySelectorAll(".prst-nombre")
        const prstTipoCables = document.querySelectorAll(".prst-tipo-cable")
        const prstCantidadCables = document.querySelectorAll(".prst-cantidad-cables")
        const prstEstados = document.querySelectorAll(".prst-estado")

        for (let i = 0; i < cantidadPRST; i++) {
          if (prstNombres[i] && !prstNombres[i].value) {
            prstNombres[i].classList.add("is-invalid")
            isValid = false
          } else if (prstNombres[i]) {
            prstNombres[i].classList.remove("is-invalid")
          }

          if (prstTipoCables[i] && !prstTipoCables[i].value) {
            prstTipoCables[i].classList.add("is-invalid")
            isValid = false
          } else if (prstTipoCables[i]) {
            prstTipoCables[i].classList.remove("is-invalid")
          }

          if (prstCantidadCables[i] && !prstCantidadCables[i].value) {
            prstCantidadCables[i].classList.add("is-invalid")
            isValid = false
          } else if (prstCantidadCables[i]) {
            prstCantidadCables[i].classList.remove("is-invalid")
          }

          if (prstEstados[i] && !prstEstados[i].value) {
            prstEstados[i].classList.add("is-invalid")
            isValid = false
          } else if (prstEstados[i]) {
            prstEstados[i].classList.remove("is-invalid")
          }
        }
      }
    }

    return isValid
  }

  // Función para obtener elementos seleccionados
  function getSelectedElementos() {
    const elementos = []
    const elementoNA = document.getElementById("elementoNA")

    // Si N/A está seleccionado, solo devolver N/A
    if (elementoNA && elementoNA.checked) {
      return ["N/A"]
    }

    // Obtener todos los checkboxes seleccionados
    document.querySelectorAll("#elementosCheckboxes .elemento-checkbox:checked").forEach((checkbox) => {
      elementos.push(checkbox.value)
    })

    return elementos
  }

  // Función para obtener datos de PRST
  function getPRSTData2() {
    const cantidadPRSTElement = document.getElementById("cantidadPRST")
    if (!cantidadPRSTElement) return []

    const cantidadPRST = Number.parseInt(cantidadPRSTElement.value)
    if (cantidadPRST <= 0) return []

    const prstData = []
    const prstNombres = document.querySelectorAll(".prst-nombre")
    const prstCantidadCables = document.querySelectorAll(".prst-cantidad-cables")
    const prstCajaEmpaque = document.querySelectorAll(".prst-caja-empaque")
    const prstReserva = document.querySelectorAll(".prst-reserva")
    const prstNap = document.querySelectorAll(".prst-nap")
    const prstSpt = document.querySelectorAll(".prst-spt")
    const prstBajante = document.querySelectorAll(".prst-bajante")
    const prstObservaciones = document.querySelectorAll(".prst-observaciones")

    for (let i = 0; i < cantidadPRST; i++) {
      if (prstNombres[i] && prstCantidadCables[i]) {
        prstData.push({
          nombre: prstNombres[i].value,
          cantidadCables: prstCantidadCables[i].value,
          cajaEmpaque: prstCajaEmpaque[i] ? prstCajaEmpaque[i].value : 0,
          reserva: prstReserva[i] ? prstReserva[i].value : 0,
          nap: prstNap[i] ? prstNap[i].value : 0,
          spt: prstSpt[i] ? prstSpt[i].value : 0,
          bajante: prstBajante[i] ? prstBajante[i].value : 0,
          observaciones: prstObservaciones[i] ? prstObservaciones[i].value : "",
        })
      }
    }

    return prstData
  }

  // Función para obtener fotos adicionales
  function getAdditionalPhotos() {
    const fotos = []
    const fotosPreview = document.querySelectorAll("#fotosAdicionalesContainer .foto-preview")

    fotosPreview.forEach((foto) => {
      if (foto && !foto.src.includes("placeholder-image.png")) {
        fotos.push(foto.src)
      }
    })

    return fotos
  }

  // Función para guardar censo en localStorage
  function saveCensoToStorage(censoData) {
    try {
      // Obtener censos existentes
      const censos = JSON.parse(localStorage.getItem(Storage.KEYS.CENSUS) || "[]")

      // Agregar nuevo censo
      censos.push(censoData)

      // Guardar en localStorage
      localStorage.setItem(Storage.KEYS.CENSUS, JSON.stringify(censos))

      // Actualizar estado del proyecto si es necesario
      const project = Storage.getProjectById(censoData.projectId)
      if (project && (project.estado === "Nuevo" || project.estado === "En Asignación")) {
        project.estado = "En Gestion por Brigada"
        Storage.saveProject(project)
      }

      // Crear notificación
      Storage.createNotification({
        usuarioId: loggedUser.id,
        tipo: "censo_completado",
        mensaje: `Ha completado el censo del poste ${censoData.posteNombre} en el proyecto ${project ? project.prstNombre : ""}`,
        fechaCreacion: new Date().toISOString(),
        leido: false,
      })
    } catch (error) {
      console.error("Error al guardar censo en localStorage:", error)
      showToast("Error al guardar el censo", "danger")
    }
  }

  // Función para actualizar mapa después de guardar censo
  function updateMapAfterCenso(censoData) {
    if (!mapCenso) return

    try {
      // Buscar marcador del poste censado
      const marker = censoMarkers.find((m) => m.posteData && m.posteData.id === censoData.posteId)
      if (marker) {
        // Actualizar datos del marcador
        marker.posteData.isCensado = true

        // Cambiar icono a verde
        const icon = L.divIcon({
          className: "custom-div-icon",
          html: `<div style="background-color: green; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        })
        marker.setIcon(icon)

        // Actualizar popup
        marker.bindPopup(`
          <h5>Poste: ${marker.posteData.nombre}</h5>
          <p>${marker.posteData.descripcion || "Sin descripción"}</p>
          <p><strong>Estado:</strong> Censado</p>
        `)
      }

      // Actualizar progreso en la tarjeta del proyecto
      const progress = Storage.getProjectProgress(censoData.projectId)
      const progressBar = document.querySelector(
        `.project-card[data-project-id="${censoData.projectId}"] .progress-bar`,
      )
      if (progressBar && progress) {
        progressBar.style.width = `${progress.porcentaje}%`
        progressBar.setAttribute("aria-valuenow", progress.porcentaje)
        progressBar.textContent = `${progress.porcentaje}%`
      }
    } catch (error) {
      console.error("Error al actualizar mapa después de guardar censo:", error)
    }
  }

  // Función para verificar si todos los postes están censados
  function checkProjectCompletion() {
    if (!currentProject) return

    try {
      const progress = Storage.getProjectProgress(currentProject.id)
      const finalizarContainer = document.getElementById("finalizarProyectoContainer")

      if (
        progress &&
        progress.porcentaje === 100 &&
        currentProject.estado !== "completado" &&
        currentProject.estado !== "Finalizado" &&
        finalizarContainer
      ) {
        finalizarContainer.style.display = "block"
      } else if (finalizarContainer) {
        finalizarContainer.style.display = "none"
      }
    } catch (error) {
      console.error("Error al verificar finalización del proyecto:", error)
    }
  }

  // Función para mostrar modal de finalizar proyecto
  function showFinalizarProyectoModal() {
    if (!currentProject) return

    const finalizarProyectoNombre = document.getElementById("finalizarProyectoNombre")
    if (finalizarProyectoNombre) {
      finalizarProyectoNombre.textContent = currentProject.prstNombre || "Proyecto sin nombre"
    }

    const modalElement = document.getElementById("modalFinalizarProyecto")
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement)
      modal.show()
    }
  }

  // Función para finalizar proyecto
  function finalizarProyecto() {
    if (!currentProject) return

    try {
      // Actualizar estado del proyecto
      currentProject.estado = "completado"
      currentProject.fechaFinalizacion = new Date().toISOString()
      Storage.saveProject(currentProject)

      // Crear notificación
      Storage.createNotification({
        usuarioId: loggedUser.id,
        tipo: "proyecto_finalizado",
        mensaje: `Ha finalizado el proyecto ${currentProject.prstNombre || ""}`,
        fechaCreacion: new Date().toISOString(),
        leido: false,
      })

      // Cerrar modal
      const modalElement = document.getElementById("modalFinalizarProyecto")
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement)
        if (modal) modal.hide()
      }

      // Mostrar mensaje de éxito
      showToast("Proyecto finalizado correctamente", "success")

      // Actualizar interfaz
      const finalizarContainer = document.getElementById("finalizarProyectoContainer")
      if (finalizarContainer) finalizarContainer.style.display = "none"

      const btnRealizarCenso = document.querySelector(
        `.project-card[data-project-id="${currentProject.id}"] .btn-realizar-censo`,
      )
      if (btnRealizarCenso) btnRealizarCenso.disabled = true

      const estadoBadge = document.querySelector(`.project-card[data-project-id="${currentProject.id}"] .estado-badge`)
      if (estadoBadge) {
        estadoBadge.textContent = "Completado"
        estadoBadge.className = "badge estado-badge estado-completado"
      }

      // Volver a la sección de proyectos
      showSection("seccionProyectos")
      loadProjects()
    } catch (error) {
      console.error("Error al finalizar proyecto:", error)
      showToast("Error al finalizar el proyecto", "danger")
    }
  }

  // Función para cargar historial de proyectos
  function loadHistorial() {
    const userId = loggedUser.id
    const projects = Storage.getProjectsByUserId(userId) || []

    // Limpiar tabla
    const tableBody = document.getElementById("historialProyectosBody")
    if (!tableBody) return

    tableBody.innerHTML = ""

    // Si no hay proyectos, mostrar mensaje
    if (projects.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center">No hay proyectos en el historial</td>
        </tr>
      `
      return
    }

    try {
      // Ordenar proyectos por fecha de asignación (más recientes primero)
      projects.sort((a, b) => {
        return new Date(b.fechaCreacion || 0) - new Date(a.fechaCreacion || 0)
      })

      // Crear filas para cada proyecto
      projects.forEach((project) => {
        // Calcular progreso
        const progress = Storage.getProjectProgress(project.id) || { porcentaje: 0 }

        // Determinar estado para mostrar
        let estadoDisplay = ""
        let estadoClass = ""

        switch (project.estado) {
          case "Nuevo":
          case "En Asignación":
            estadoDisplay = "Nuevo proyecto"
            estadoClass = "estado-nuevo"
            break
          case "Asignado":
          case "En Gestion por Brigada":
            estadoDisplay = "Gestionado por Brigada"
            estadoClass = "estado-gestionado"
            break
          case "Documentación Errada":
          case "En Revision de Verificacion":
            estadoDisplay = "Gestionado por Brigada con Observación"
            estadoClass = "estado-observacion"
            break
          case "completado":
          case "Finalizado":
            estadoDisplay = "Completado"
            estadoClass = "estado-completado"
            break
          default:
            estadoDisplay = project.estado || "Nuevo proyecto"
            estadoClass = "bg-secondary"
        }

        // Formatear fecha
        const fechaAsignacion = project.fechaCreacion
          ? new Date(project.fechaCreacion).toLocaleDateString("es-ES")
          : "No disponible"

        // Crear fila
        const row = document.createElement("tr")
        row.innerHTML = `
          <td>${project.id}</td>
          <td>${project.prstNombre || "Sin nombre"}</td>
          <td>${project.departamento || "No especificado"}</td>
          <td>${project.municipio || "No especificado"}</td>
          <td><span class="badge ${estadoClass} estado-badge">${estadoDisplay}</span></td>
          <td>
            <div class="progress" style="height: 10px;">
              <div class="progress-bar bg-success" role="progressbar" style="width: ${progress.porcentaje}%" 
                aria-valuenow="${progress.porcentaje}" aria-valuemin="0" aria-valuemax="100">
              </div>
            </div>
            <small class="text-muted">${progress.porcentaje}%</small>
          </td>
          <td>${fechaAsignacion}</td>
          <td>
            <button class="btn btn-sm btn-primary btn-ver-detalles" data-project-id="${project.id}">
              <i class="bi bi-eye"></i> Ver
            </button>
          </td>
        `

        tableBody.appendChild(row)

        // Agregar event listener para ver detalles
        const btnVerDetalles = row.querySelector(".btn-ver-detalles")
        if (btnVerDetalles) {
          btnVerDetalles.addEventListener("click", () => {
            showProjectDetails(project.id)
          })
        }
      })
    } catch (error) {
      console.error("Error al cargar historial de proyectos:", error)
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-danger">Error al cargar el historial de proyectos</td>
        </tr>
      `
    }
  }

  // Función para mostrar detalles de un proyecto
  function showProjectDetails(projectId) {
    const project = Storage.getProjectById(projectId)
    if (!project) return

    try {
      // Calcular progreso
      const progress = Storage.getProjectProgress(project.id) || { porcentaje: 0 }

      // Obtener censos del proyecto
      const censos = Storage.getCensusByProject(project.id) || []

      // Formatear fechas
      const fechaAsignacion = project.fechaCreacion
        ? new Date(project.fechaCreacion).toLocaleDateString("es-ES")
        : "No disponible"
      const fechaFinalizacion = project.fechaFinalizacion
        ? new Date(project.fechaFinalizacion).toLocaleDateString("es-ES")
        : "No finalizado"

      // Crear contenido del modal
      const modalBody = document.getElementById("detalleCensoBody")
      if (!modalBody) return

      modalBody.innerHTML = `
        <div class="mb-4">
          <h4 class="mb-3">Información del Proyecto</h4>
          <div class="row">
            <div class="col-md-6">
              <p><strong>ID:</strong> ${project.id}</p>
              <p><strong>PRST:</strong> ${project.prstNombre || "Sin nombre"}</p>
              <p><strong>Departamento:</strong> ${project.departamento || "No especificado"}</p>
              <p><strong>Municipio:</strong> ${project.municipio || "No especificado"}</p>
            </div>
            <div class="col-md-6">
              <p><strong>Estado:</strong> ${project.estado || "No especificado"}</p>
              <p><strong>Fecha de Asignación:</strong> ${fechaAsignacion}</p>
              <p><strong>Fecha de Finalización:</strong> ${fechaFinalizacion}</p>
              <p><strong>Progreso:</strong> ${progress.porcentaje}%</p>
            </div>
          </div>
          <div class="progress mb-3" style="height: 15px;">
            <div class="progress-bar bg-success" role="progressbar" style="width: ${progress.porcentaje}%" 
              aria-valuenow="${progress.porcentaje}" aria-valuemin="0" aria-valuemax="100">
              ${progress.porcentaje}%
            </div>
          </div>
        </div>
        
        <div>
          <h4 class="mb-3">Censos Realizados</h4>
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Poste</th>
                  <th>Tipo</th>
                  <th>Material</th>
                  <th>Altura</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="censosTableBody">
                ${censos.length === 0 ? '<tr><td colspan="6" class="text-center">No hay censos realizados</td></tr>' : ""}
              </tbody>
            </table>
          </div>
        </div>
      `

      // Agregar filas de censos
      const censosTableBody = document.getElementById("censosTableBody")
      if (censosTableBody && censos.length > 0) {
        censos.forEach((censo) => {
          const fechaCenso = new Date(censo.fechaCenso).toLocaleDateString("es-ES")
          const row = document.createElement("tr")
          row.innerHTML = `
            <td>${censo.posteNombre || "Sin nombre"}</td>
            <td>${censo.tipoPoste || "No especificado"}</td>
            <td>${censo.materialPoste || "No especificado"}</td>
            <td>${censo.alturaPoste || "0"} m</td>
            <td>${fechaCenso}</td>
            <td>
              <button class="btn btn-sm btn-primary btn-ver-censo" data-censo-id="${censo.id}" data-poste-id="${censo.posteId}">
                <i class="bi bi-eye"></i> Ver
              </button>
            </td>
          `
          censosTableBody.appendChild(row)

          // Agregar event listener para ver censo
          const btnVerCenso = row.querySelector(".btn-ver-censo")
          if (btnVerCenso) {
            btnVerCenso.addEventListener("click", (e) => {
              const posteId = e.target.closest(".btn-ver-censo").getAttribute("data-poste-id")
              showCensoDetail(project.id, posteId)
            })
          }
        })
      }

      // Mostrar modal
      const modalElement = document.getElementById("modalDetalleCenso")
      if (modalElement) {
        const modal = new bootstrap.Modal(modalElement)
        modal.show()
      }
    } catch (error) {
      console.error("Error al mostrar detalles del proyecto:", error)
      showToast("Error al cargar los detalles del proyecto", "danger")
    }
  }

  // Función para mostrar detalle de un censo
  function showCensoDetail(projectId, posteId) {
    try {
      // Obtener censos del proyecto
      const censos = Storage.getCensusByProject(projectId) || []
      const censo = censos.find((c) => c.posteId === posteId)

      if (!censo) {
        showToast("No se encontró información del censo", "warning")
        return
      }

      // Formatear fecha
      const fechaCenso = new Date(censo.fechaCenso).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })

      // Crear contenido del modal
      const modalBody = document.getElementById("detalleCensoBody")
      if (!modalBody) return

      modalBody.innerHTML = `
        <div class="mb-4">
          <h4 class="mb-3">Información del Poste</h4>
          <div class="row">
            <div class="col-md-6">
              <p><strong>Nombre:</strong> ${censo.posteNombre || "Sin nombre"}</p>
              <p><strong>Tipo:</strong> ${censo.tipoPoste || "No especificado"}</p>
              <p><strong>Material:</strong> ${censo.materialPoste || "No especificado"}</p>
              <p><strong>Altura:</strong> ${censo.alturaPoste || "0"} metros</p>
            </div>
            <div class="col-md-6">
              <p><strong>Estado:</strong> ${censo.estadoPoste || "No especificado"}</p>
              <p><strong>Propietario:</strong> ${censo.propietarioPoste || "No especificado"}</p>
              <p><strong>Cantidad de PRST:</strong> ${censo.cantidadPRST || "0"}</p>
              <p><strong>Fecha de Censo:</strong> ${fechaCenso}</p>
            </div>
          </div>
        </div>
        
        <div class="mb-4">
          <h4 class="mb-3">Elementos Existentes</h4>
          <div class="row">
            <div class="col-md-12">
              <p>${censo.elementos && censo.elementos.length > 0 ? censo.elementos.join(", ") : "Ninguno"}</p>
            </div>
          </div>
        </div>
        
        ${
          censo.prst && censo.prst.length > 0
            ? `
          <div class="mb-4">
            <h4 class="mb-3">Información de PRST</h4>
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Tipo de Cable</th>
                    <th>Cantidad</th>
                    <th>Estado</th>
                    <th>Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${censo.prst
                    .map(
                      (prst) => `
                    <tr>
                      <td>${prst.nombre || "Sin nombre"}</td>
                      <td>${prst.tipoCable || "No especificado"}</td>
                      <td>${prst.cantidadCables || "0"}</td>
                      <td>${prst.estado || "No especificado"}</td>
                      <td>${prst.observaciones || "-"}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
        `
            : ""
        }
        
        <div class="mb-4">
          <h4 class="mb-3">Fotografías</h4>
          <div class="row">
            <div class="col-md-6 mb-3">
              <p><strong>Foto General</strong></p>
              <img src="${censo.fotos.general}" class="img-fluid rounded" style="max-height: 200px;">
            </div>
            <div class="col-md-6 mb-3">
              <p><strong>Foto de Placa/Identificación</strong></p>
              <img src="${censo.fotos.placa}" class="img-fluid rounded" style="max-height: 200px;">
            </div>
          </div>
          
          ${
            censo.fotos.adicionales && censo.fotos.adicionales.length > 0
              ? `
            <div class="row mt-3">
              <div class="col-md-12">
                <p><strong>Fotos Adicionales</strong></p>
              </div>
              ${censo.fotos.adicionales
                .map(
                  (foto) => `
                <div class="col-md-3 mb-3">
                  <img src="${foto}" class="img-fluid rounded" style="max-height: 150px;">
                </div>
              `,
                )
                .join("")}
            </div>
          `
              : ""
          }
        </div>
        
        <div class="mb-4">
          <h4 class="mb-3">Observaciones</h4>
          <div class="row">
            <div class="col-md-12">
              <p>${censo.observaciones || "Sin observaciones"}</p>
            </div>
          </div>
        </div>
      `

      // Mostrar modal
      const modalElement = document.getElementById("modalDetalleCenso")
      if (modalElement) {
        const modal = new bootstrap.Modal(modalElement)
        modal.show()
      }
    } catch (error) {
      console.error("Error al mostrar detalles del censo:", error)
      showToast("Error al cargar los detalles del censo", "danger")
    }
  }

  // Función para cargar información del perfil
  function loadProfileInfo() {
    document.getElementById("perfilNombre").textContent = `${loggedUser.nombre} ${loggedUser.apellido}`
    document.getElementById("perfilUsuario").textContent = loggedUser.usuario
    document.getElementById("perfilCorreo").textContent = loggedUser.correo
    document.getElementById("perfilRol").textContent = "Brigada"
    document.getElementById("perfilDepartamento").textContent = loggedUser.departamento || "No asignado"
  }

  // Función para mostrar modal de cambio de contraseña
  function showCambioPasswordModal() {
    // Limpiar formulario
    document.getElementById("formCambioPassword").reset()

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById("modalCambioPassword"))
    modal.show()
  }

  // Función para enviar solicitud de cambio de contraseña
  function enviarSolicitudCambioPassword() {
    const passwordActual = document.getElementById("passwordActual").value
    const passwordNueva = document.getElementById("passwordNueva").value
    const passwordConfirmar = document.getElementById("passwordConfirmar").value

    // Validar campos
    if (!passwordActual || !passwordNueva || !passwordConfirmar) {
      showToast("Debe completar todos los campos", "warning")
      return
    }

    // Validar que la contraseña actual sea correcta
    if (passwordActual !== loggedUser.password) {
      showToast("La contraseña actual es incorrecta", "danger")
      return
    }

    // Validar que las contraseñas nuevas coincidan
    if (passwordNueva !== passwordConfirmar) {
      showToast("Las contraseñas nuevas no coinciden", "danger")
      return
    }

    // Obtener solicitudes existentes
    let solicitudes = []
    if (localStorage.getItem("air_e_password_requests")) {
      solicitudes = JSON.parse(localStorage.getItem("air_e_password_requests"))
    }

    // Crear nueva solicitud
    const solicitud = {
      id: Date.now().toString(),
      nombreUsuario: loggedUser.usuario,
      usuarioId: loggedUser.id,
      passwordActual: passwordActual,
      passwordNueva: passwordNueva,
      fechaSolicitud: new Date().toISOString(),
      estado: "pendiente",
    }

    // Agregar solicitud
    solicitudes.push(solicitud)
    localStorage.setItem("air_e_password_requests", JSON.stringify(solicitudes))

    // Crear notificación para el administrador
    Storage.createNotification({
      usuarioId: "1", // ID del administrador
      tipo: "solicitud_password",
      mensaje: `El usuario ${loggedUser.nombre} ${loggedUser.apellido} ha solicitado un cambio de contraseña`,
      fechaCreacion: new Date().toISOString(),
      leido: false,
    })

    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById("modalCambioPassword"))
    modal.hide()

    // Mostrar mensaje de éxito
    showToast("Solicitud enviada correctamente. El administrador revisará su solicitud.", "success")
  }

  // Función para cargar notificaciones
  function loadNotifications() {
    const userId = loggedUser.id
    const notifications = Storage.getNotificationsByUser(userId)
    const unreadCount = notifications.filter((n) => !n.leido).length

    // Actualizar contador de notificaciones
    document.getElementById("notificationCount").textContent = unreadCount
    document.getElementById("notificationCount").style.display = unreadCount > 0 ? "block" : "none"
  }

  // Función para mostrar toast
  function showToast(message, type = "info") {
    const toastContainer = document.querySelector(".toast-container")
    const toastId = `toast-${Date.now()}`
    const toastHtml = `
      <div class="toast" role="alert" aria-live="assertive" aria-atomic="true" id="${toastId}">
        <div class="toast-header">
          <strong class="me-auto">Air-e</strong>
          <small>Ahora</small>
          <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body ${type === "danger" ? "text-danger" : type === "success" ? "text-success" : ""}">
          ${type === "danger" ? '<i class="bi bi-exclamation-triangle-fill me-2"></i>' : ""}
          ${type === "success" ? '<i class="bi bi-check-circle-fill me-2"></i>' : ""}
          ${type === "warning" ? '<i class="bi bi-exclamation-circle-fill me-2"></i>' : ""}
          ${type === "info" ? '<i class="bi bi-info-circle-fill me-2"></i>' : ""}
          ${message}
        </div>
      </div>
    `
    toastContainer.insertAdjacentHTML("beforeend", toastHtml)
    const toastElement = document.getElementById(toastId)
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 5000 })
    toast.show()

    // Eliminar toast después de ocultarse
    toastElement.addEventListener("hidden.bs.toast", () => {
      toastElement.remove()
    })
  }

  // Función para verificar si un nombre o descripción corresponde a un poste
  function isPoste(text) {
    if (!text) return false
    text = text.toLowerCase()
    return text.includes("poste")
  }
})
