// Función para inicializar el mapa principal y mostrar postes cercanos
function initializeMap() {
  // Verificar si el mapa ya está inicializado
  if (map) {
    map.remove()
  }

  // Inicializar el mapa
  map = L.map("map").setView([10.9878, -74.7889], 10) // Coordenadas iniciales (Barranquilla)

  // Añadir capa de OpenStreetMap
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)

  // Cargar los proyectos y postes
  loadProjectsAndPosts()
}

// Función para inicializar el mapa de censo
function initializeCensoMap() {
  // Verificar si el mapa ya está inicializado
  if (mapCenso) {
    mapCenso.remove()
  }

  // Inicializar el mapa
  mapCenso = L.map("mapCenso").setView([10.9878, -74.7889], 10)

  // Añadir capa de OpenStreetMap
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(mapCenso)

  // Cargar los postes para el censo
  if (currentProject) {
    loadCensoPosts(currentProject.id)
  }
}

// Función para cargar proyectos y postes en el mapa principal
function loadProjectsAndPosts() {
  // Limpiar marcadores existentes
  if (markers) {
    markers.forEach((marker) => map.removeLayer(marker))
  }
  markers = []

  // Obtener todos los proyectos
  const projects = Storage.getProjects() || []

  // Contador para proyectos cercanos
  const projectsNearby = {}

  // Procesar cada proyecto
  projects.forEach((project) => {
    if (project.kmlData && project.kmlData.puntos) {
      // Obtener censos realizados para este proyecto
      const censos = Storage.getCensusByProject(project.id) || []
      const censadosIds = new Set(censos.map((c) => c.posteId))

      // Añadir marcadores para cada poste
      project.kmlData.puntos.forEach((punto) => {
        // Verificar si es un poste
        if (isPoste(punto.nombre) || isPoste(punto.descripcion)) {
          // Determinar color del marcador según si está censado o no
          const isCensado = censadosIds.has(punto.id)
          const markerColor = isCensado ? "green" : "red"

          // Crear icono personalizado
          const icon = L.divIcon({
            className: "custom-div-icon",
            html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5); position: relative;">
                  </div>`,
            iconSize: [20, 28],
            iconAnchor: [10, 28],
          })

          // Crear marcador
          const marker = L.marker([punto.lat, punto.lng], { icon: icon })

          // Añadir datos del poste al marcador
          marker.posteData = {
            id: punto.id,
            nombre: punto.nombre || `Poste ${punto.id}`,
            descripcion: punto.descripcion || "",
            lat: punto.lat,
            lng: punto.lng,
            isCensado: isCensado,
            projectId: project.id,
            projectName: project.prstNombre || "Proyecto sin nombre",
          }

          // Contar proyectos cercanos
          // Usamos una cuadrícula de 0.01 grados (aproximadamente 1km)
          const gridKey = `${Math.floor(punto.lat * 100) / 100},${Math.floor(punto.lng * 100) / 100}`
          if (!projectsNearby[gridKey]) {
            projectsNearby[gridKey] = new Set()
          }
          projectsNearby[gridKey].add(project.id)

          // Añadir popup con información
          marker.bindPopup(`
            <h5>Poste: ${punto.nombre || "Sin nombre"}</h5>
            <p>${punto.descripcion || "Sin descripción"}</p>
            <p><strong>Estado:</strong> ${isCensado ? "Censado" : "Pendiente"}</p>
            <p><strong>Proyecto:</strong> ${project.prstNombre || "Sin nombre"}</p>
            <p><strong>Proyectos cercanos:</strong> <span id="nearby-count-${punto.id}">Calculando...</span></p>
          `)

          // Evento al abrir el popup para mostrar proyectos cercanos
          marker.on("popupopen", () => {
            const gridKey = `${Math.floor(punto.lat * 100) / 100},${Math.floor(punto.lng * 100) / 100}`
            const nearbyCount = projectsNearby[gridKey] ? projectsNearby[gridKey].size : 0
            document.getElementById(`nearby-count-${punto.id}`).textContent = nearbyCount
          })

          // Añadir marcador al mapa
          marker.addTo(map)
          markers.push(marker)
        }
      })
    }
  })

  // Ajustar vista del mapa para mostrar todos los marcadores
  if (markers.length > 0) {
    const group = new L.featureGroup(markers)
    map.fitBounds(group.getBounds(), { padding: [50, 50] })
  }
}

// Función para cargar postes en el mapa de censo
function loadCensoPosts(projectId) {
  // Limpiar marcadores existentes
  if (censoMarkers) {
    censoMarkers.forEach((marker) => mapCenso.removeLayer(marker))
  }
  censoMarkers = []

  // Obtener el proyecto
  const project = Storage.getProjectById(projectId)
  if (!project || !project.kmlData || !project.kmlData.puntos) {
    console.error("No hay datos de postes para este proyecto")
    return
  }

  // Obtener censos realizados para este proyecto
  const censos = Storage.getCensusByProject(projectId) || []
  const censadosIds = new Set(censos.map((c) => c.posteId))

  // Añadir marcadores para cada poste
  project.kmlData.puntos.forEach((punto) => {
    // Verificar si es un poste
    if (isPoste(punto.nombre) || isPoste(punto.descripcion)) {
      // Determinar color del marcador según si está censado o no
      const isCensado = censadosIds.has(punto.id)
      const markerColor = isCensado ? "green" : "red"

      // Crear icono personalizado
      const icon = L.divIcon({
        className: "custom-div-icon",
        html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5); position: relative;">
              </div>`,
        iconSize: [20, 28],
        iconAnchor: [10, 28],
      })

      // Crear marcador
      const marker = L.marker([punto.lat, punto.lng], { icon: icon })

      // Añadir datos del poste al marcador
      marker.posteData = {
        id: punto.id,
        nombre: punto.nombre || `Poste ${punto.id}`,
        descripcion: punto.descripcion || "",
        lat: punto.lat,
        lng: punto.lng,
        isCensado: isCensado,
        projectId: project.id,
      }

      // Añadir evento de clic al marcador
      marker.on("click", () => {
        onPosteClick(marker)
      })

      // Añadir popup con información
      marker.bindPopup(`
        <h5>Poste: ${punto.nombre || "Sin nombre"}</h5>
        <p>${punto.descripcion || "Sin descripción"}</p>
        <p><strong>Estado:</strong> ${isCensado ? "Censado" : "Pendiente"}</p>
      `)

      // Añadir marcador al mapa
      marker.addTo(mapCenso)
      censoMarkers.push(marker)
    }
  })

  // Ajustar vista del mapa para mostrar todos los marcadores
  if (censoMarkers.length > 0) {
    const group = new L.featureGroup(censoMarkers)
    mapCenso.fitBounds(group.getBounds(), { padding: [50, 50] })
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

// Función para verificar si un nombre o descripción corresponde a un poste
function isPoste(text) {
  if (!text) return false
  text = text.toLowerCase()
  return text.includes("poste") || /^p\d+$/i.test(text) || /^poste\s*\d+$/i.test(text) || /^\d+$/.test(text)
}

// Función para guardar el estado del poste
function saveCenso() {
  // Validar formulario
  const form = document.getElementById("formCenso")
  if (!form.checkValidity()) {
    form.classList.add("was-validated")
    return
  }

  // Recopilar datos del formulario
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
    cantidadPRST: document.getElementById("cantidadPRST").value,
    elementos: getSelectedElementos(),
    prst: getPRSTData(),
    observaciones: document.getElementById("observacionesPoste").value,
    fechaRegistro: new Date().toISOString(),
    censadoPor: {
      id: loggedUser.id,
      nombre: loggedUser.nombre,
      apellido: loggedUser.apellido,
    },
    estado: "pendiente",
  }

  // Mostrar modal para preguntar sobre el estado del poste
  mostrarModalEstadoPoste(censoData)
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

// Función para actualizar mapa después de guardar censo
function updateMapAfterCenso(censoData) {
  if (!mapCenso) return

  // Buscar marcador del poste censado
  const marker = censoMarkers.find((m) => m.posteData && m.posteData.id === censoData.posteId)
  if (marker) {
    // Actualizar datos del marcador
    marker.posteData.isCensado = true

    // Cambiar icono a verde
    const icon = L.divIcon({
      className: "custom-div-icon",
      html: `<div style="background-color: green; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5); position: relative;">
            </div>`,
      iconSize: [20, 28],
      iconAnchor: [10, 28],
    })
    marker.setIcon(icon)

    // Actualizar popup
    marker.bindPopup(`
      <h5>Poste: ${marker.posteData.nombre}</h5>
      <p>${marker.posteData.descripcion || "Sin descripción"}</p>
      <p><strong>Estado:</strong> Censado</p>
    `)
  }

  // También actualizar el mapa principal si está visible
  if (map) {
    loadProjectsAndPosts()
  }
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

// Inicializar mapas cuando se carga la página
document.addEventListener("DOMContentLoaded", () => {
  // Inicializar el almacenamiento
  Storage.init()

  // Verificar si hay un usuario logueado
  loggedUser = Storage.getLoggedUser()
  if (!loggedUser || loggedUser.rol !== "brigada") {
    window.location.href = "login.html"
    return
  }

  // Inicializar variables globales
  const map = null
  const mapCenso = null
  const currentProject = null
  const markers = []
  const censoMarkers = []
  const selectedPoste = null

  // Inicializar mapas
  setTimeout(() => {
    initializeMap()
    initializeCensoMap()
  }, 100)

  // Configurar event listeners
  setupEventListeners()

  // Función para configurar los event listeners
  function setupEventListeners() {
    // Event listener para el botón "Sí, está en buen estado"
    document.getElementById("btnBuenEstado").addEventListener("click", () => {
      if (selectedPoste) {
        const censoData = {
          id: Date.now().toString(),
          projectId: currentProject.id,
          posteId: selectedPoste.id,
          posteNombre: selectedPoste.nombre,
          posteLat: selectedPoste.lat,
          posteLng: selectedPoste.lng,
          fechaCenso: new Date().toISOString().split("T")[0],
          estadoPoste: "bueno",
          censadoPor: {
            id: loggedUser.id,
            nombre: loggedUser.nombre,
            apellido: loggedUser.apellido,
          },
        }

        finalizarGuardadoCenso(censoData, false)
      }
    })
  }
})

let loggedUser
let selectedPoste
let censoMarkers

function hideCensoForm() {
  const censoForm = document.getElementById("censoForm")
  if (censoForm) {
    censoForm.style.display = "none"
  }
}

let checkProjectCompletion
