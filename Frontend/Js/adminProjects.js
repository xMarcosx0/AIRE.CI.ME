let previewMap;
let previewLayer;

import { generateOTAirE, getPoleHeightsDistribution } from './adminUtils.js';
import Storage from './storage.js';
import KMLHandler from './kml-handler.js';
import { loadCharts } from './adminCharts.js';


export function saveProject() {
  // Validar campos obligatorios
  const requiredFields = [
    "project-name", "project-prst", "project-department", 
    "project-municipality", "project-neighborhood", 
    "project-poles"
  ];

  for (const fieldId of requiredFields) {
    const field = document.getElementById(fieldId);
    if (!field.value.trim()) {
      alert(`El campo ${field.labels[0].textContent} es obligatorio`);
      field.focus();
      return;
    }
  }

  // Validar distribución de postes
  const totalPoles = parseInt(document.getElementById("project-poles").value);
  const poleHeights = getPoleHeightsDistribution();
  const sumHeights = Object.values(poleHeights).reduce((a, b) => a + b, 0);
  
  if (sumHeights !== totalPoles) {
    alert("La suma de postes por altura no coincide con el total de postes");
    return;
  }

  // Obtener el archivo KMZ
  const kmzFile = document.getElementById("project-kmz").files[0];
  if (!kmzFile) {
    alert("Debe seleccionar un archivo KMZ");
    return;
  }

  // Procesar el KMZ y luego guardar el proyecto
  KMLHandler.processFile(kmzFile)
    .then(kmlData => {
      const project = {
        id: null,
        nombre: document.getElementById("project-name").value,
        otAire: generateOTAirE(document.getElementById("project-prst").value),
        prstNombre: document.getElementById("project-prst").value,
        otPRST: document.getElementById("project-ot-prst").value,
        departamento: document.getElementById("project-department").value,
        municipio: document.getElementById("project-municipality").value,
        barrio: document.getElementById("project-neighborhood").value,
        fechaInicio: document.getElementById("project-start-date").value,
        fechaCreacion: new Date().toISOString(), // Fecha actual de creación
        numPostes: parseInt(document.getElementById("project-poles").value),
        distribucionPostes: getPoleHeightsDistribution(),
        observaciones: document.getElementById("project-observations").value,
        creadorId: Storage.getLoggedUser()?.id,
        kmlData: kmlData,
        estado: "Nuevo"
      };

      Storage.saveProject(project);
      bootstrap.Modal.getInstance(document.getElementById("createProjectModal"))?.hide();
      loadProjectsTable();
      
      // Cargar gráficos si está disponible
      if (typeof loadCharts === 'function') {
        loadCharts(Storage.getProjects());
      }
    })
    .catch(error => {
      console.error("Error al procesar KMZ:", error);
      alert("Error al procesar el archivo KMZ: " + error.message);
    });
}

export function loadProjectsTable() {
  const tbody = document.getElementById("projects-table-body");
  if (!tbody) return;

  const projects = Storage.getProjects();
  tbody.innerHTML = "";

  if (projects.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center">No se encontraron proyectos</td>
      </tr>
    `;
    return;
  }

  projects.forEach(project => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${project.id}</td>
      <td>${project.otAire || "N/A"}</td>
      <td>${project.nombre}</td>
      <td>${project.prstNombre}</td>
      <td>${project.departamento}</td>
      <td>${project.municipio || "N/A"}</td>
      <td>${project.fechaCreacion ? new Date(project.fechaCreacion).toLocaleDateString() : "N/A"}</td>
      <td>
        <span class="badge ${getStatusBadgeClass(project.estado)}">
          ${project.estado || "Nuevo"}
        </span>
      </td>
      <td>
        <div class="btn-group btn-group-sm" role="group">
          <button class="btn btn-info" onclick="showProjectDetails('${project.id}')" title="Ver detalles">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-primary" onclick="showAssignProjectModal('${project.id}')" 
            ${project.estado === "Finalizado" ? "disabled" : ""} title="Asignar">
            <i class="fas fa-user-plus"></i>
          </button>
          <button class="btn btn-secondary" onclick="showProjectHistory('${project.id}')" title="Historial">
            <i class="fas fa-history"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Función auxiliar para clases de badges según estado
function getStatusBadgeClass(status) {
  const statusClasses = {
    "Nuevo": "bg-secondary",
    "En Gestión": "bg-primary",
    "Finalizado": "bg-success",
    "Cancelado": "bg-danger",
    "En Revisión": "bg-warning text-dark"
  };
  return statusClasses[status] || "bg-light text-dark";
}

export function showCreateProjectModal() {
  const modal = new bootstrap.Modal(document.getElementById("createProjectModal"));
  
  // Limpiar formulario y mapa previo
  document.getElementById("project-form").reset();
  
  // Establecer fecha actual como fecha de inicio
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  document.getElementById("project-start-date").value = formattedDate;
  
  // Ocultar contenedor de distribución de alturas
  document.getElementById("pole-heights-container").classList.add("d-none");
  
  // Limpiar mapa de previsualización si existe
  if (previewMap) {
    previewMap.remove();
    previewMap = null;
    previewLayer = null;
  }
  
  // Inicializar mapa de previsualización
  const mapContainer = document.createElement('div');
  mapContainer.id = 'preview-map';
  mapContainer.style.height = '300px';
  mapContainer.style.marginBottom = '15px';
  mapContainer.style.borderRadius = '4px';
  mapContainer.style.border = '1px solid #ddd';
  
  const kmzInputContainer = document.getElementById('project-kmz').parentNode;
  kmzInputContainer.appendChild(mapContainer);
  
  previewMap = L.map('preview-map').setView([10.9639, -74.7964], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(previewMap);
  
  // Escuchar cambios en el input KMZ
  document.getElementById('project-kmz').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      // Mostrar loader
      const mapContainer = document.getElementById('preview-map');
      mapContainer.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div><p class="mt-2">Procesando archivo KMZ...</p></div>';
      
      const kmlData = await KMLHandler.processFile(file);
      
      // Limpiar capa anterior
      if (previewLayer) {
        previewMap.removeLayer(previewLayer);
      }
      
      // Verificar si hay datos geográficos
      if (kmlData.puntos.length > 0 || kmlData.lineas.length > 0) {
        try {
          // Filtrar solo postes (de carpetas llamadas POSTE, POSTES o similar)
          const postes = kmlData.puntos.filter(p => {
            const carpetaUpper = p.carpeta ? p.carpeta.toUpperCase() : '';
            return (
              carpetaUpper.includes('POSTE') || 
              carpetaUpper.includes('POSTES') ||
              carpetaUpper.includes('ESTRUCTURA') ||
              carpetaUpper.includes('TORRE') ||
              p.tipo === 'poste' ||
              (p.nombre && p.nombre.toUpperCase().includes('POSTE'))
            );
          });
          
          // Filtrar solo rutas (de carpetas llamadas RUTA, RUTAS o similar)
          const rutas = kmlData.lineas.filter(l => {
            const carpetaUpper = l.carpeta ? l.carpeta.toUpperCase() : '';
            return (
              carpetaUpper.includes('RUTA') ||
              carpetaUpper.includes('RUTAS') ||
              carpetaUpper.includes('LINEA') ||
              carpetaUpper.includes('TRAYECTO') ||
              l.tipo === 'linea' ||
              (l.nombre && l.nombre.toUpperCase().includes('RUTA'))
            );
          });
          
          // Crear un grupo de capas
          const featureGroup = L.featureGroup();
          
          // Añadir postes si existen
          if (postes.length > 0) {
            const puntosLayer = L.geoJSON(postes, {
              pointToLayer: (feature, latlng) => {
                return L.circleMarker(latlng, {
                  radius: 5,
                  fillColor: "#ff7800",
                  color: "#000",
                  weight: 1,
                  opacity: 1,
                  fillOpacity: 0.8
                }).bindPopup(`<b>Poste</b><br>Nombre: ${feature.nombre || 'Sin nombre'}`);
              }
            });
            featureGroup.addLayer(puntosLayer);
          }
          
          // Añadir rutas si existen
          if (rutas.length > 0) {
            rutas.forEach(linea => {
              const puntos = linea.puntos.map(p => [p.lat, p.lng]);
              const polyline = L.polyline(puntos, {
                color: '#3388ff',
                weight: 3,
                opacity: 0.7
              }).bindPopup(`<b>Ruta</b><br>${linea.nombre || 'Sin nombre'}`);
              featureGroup.addLayer(polyline);
            });
          }
          
          // Añadir el grupo al mapa
          featureGroup.addTo(previewMap);
          
          // Intentar ajustar la vista
          try {
            const bounds = featureGroup.getBounds();
            if (bounds.isValid() && !bounds.getNorthEast().equals(bounds.getSouthWest())) {
              previewMap.fitBounds(bounds, { 
                padding: [30, 30],
                maxZoom: 18
              });
            } else {
              console.warn("Bounds no válidos, usando vista por defecto");
              previewMap.setView([10.9639, -74.7964], 15);
            }
          } catch (e) {
            console.warn("Error al ajustar vista:", e);
            previewMap.setView([10.9639, -74.7964], 15);
          }
          
          console.log(`Procesado KMZ: ${postes.length} postes y ${rutas.length} rutas encontradas`);
          
        } catch (e) {
          console.error("Error al mostrar datos KML:", e);
          previewMap.setView([10.9639, -74.7964], 15);
          alert("Error al mostrar los datos geográficos: " + e.message);
        }
      } else {
        console.warn("No hay datos geográficos válidos en el KML");
        previewMap.setView([10.9639, -74.7964], 15);
        alert("El archivo no contiene postes o rutas identificables");
      }
      
    } catch (error) {
      console.error("Error al procesar KMZ:", error);
      alert("Error al procesar el archivo KMZ: " + error.message);
      e.target.value = '';
      const mapContainer = document.getElementById('preview-map');
      mapContainer.innerHTML = '<div class="alert alert-danger m-3">Error al procesar el archivo: ' + error.message + '</div>';
    }
  });
  
  // Escuchar cambios en el número de postes para mostrar distribución
  document.getElementById("project-poles").addEventListener("input", function() {
    const polesContainer = document.getElementById("pole-heights-container");
    if (this.value > 0) {
      polesContainer.classList.remove("d-none");
      getPoleHeightsDistribution(); // Actualizar el resumen
    } else {
      polesContainer.classList.add("d-none");
    }
  });
  
  // Generar OT AIR-E automáticamente al seleccionar PRST
  document.getElementById("project-prst").addEventListener("change", function() {
    if (this.value) {
      document.getElementById("project-ot").value = generateOTAirE(this.value);
    }
  });
  
  // Mostrar el modal
  modal.show();
}




export function showProjectDetails(projectId) {
  const project = Storage.getProjectById(projectId);
  if (!project) {
    alert("Proyecto no encontrado");
    return;
  }

  // Llenar información básica
  document.getElementById("detalleProyectoId").textContent = project.id;
  document.getElementById("detalleProyectoOtAirE").textContent = project.otAire || "N/A";
  document.getElementById("detalleProyectoOtPrst").textContent = project.otPRST || "N/A";
  document.getElementById("detalleProyectoNombre").textContent = project.nombre;
  document.getElementById("detalleProyectoPrst").textContent = project.prstNombre;
  document.getElementById("detalleProyectoDepartamento").textContent = project.departamento;
  document.getElementById("detalleProyectoMunicipio").textContent = project.municipio;
  document.getElementById("detalleProyectoBarrio").textContent = project.barrio;
  document.getElementById("detalleProyectoEstadoActual").textContent = project.estado || "Nuevo";
  document.getElementById("detalleProyectoTotalPostes").textContent = project.numPostes || 0;
  document.getElementById("detalleProyectoObservaciones").textContent = project.observaciones || "Sin observaciones";

  // Fechas
  document.getElementById("detalleProyectoFechaCreacion").textContent = 
    project.fechaCreacion ? new Date(project.fechaCreacion).toLocaleDateString() : "N/A";
  document.getElementById("detalleProyectoFechaInicio").textContent = 
    project.fechaInicio ? new Date(project.fechaInicio).toLocaleDateString() : "N/A";

  // Distribución de postes
  if (project.distribucionPostes) {
    document.getElementById("detalleProyectoAltura8").textContent = project.distribucionPostes["8"] || 0;
    document.getElementById("detalleProyectoAltura9").textContent = project.distribucionPostes["9"] || 0;
    document.getElementById("detalleProyectoAltura10").textContent = project.distribucionPostes["10"] || 0;
    document.getElementById("detalleProyectoAltura11").textContent = project.distribucionPostes["11"] || 0;
    document.getElementById("detalleProyectoAltura12").textContent = project.distribucionPostes["12"] || 0;
    document.getElementById("detalleProyectoAltura14").textContent = project.distribucionPostes["14"] || 0;
    document.getElementById("detalleProyectoAltura16").textContent = project.distribucionPostes["16"] || 0;
  }

  // Mostrar información de asignación si existe
  if (project.brigadaId) {
    const brigada = Storage.getUserById(project.brigadaId);
    document.getElementById("detalleProyectoInspector").textContent = 
      brigada ? `${brigada.nombre} ${brigada.apellido}` : "N/A";
  } else {
    document.getElementById("detalleProyectoInspector").textContent = "No asignado";
  }

  // Inicializar mapa si hay datos KML
  if (project.kmlData) {
    // Esperar a que el modal esté completamente visible
    const modal = new bootstrap.Modal(document.getElementById("modalDetalleProyecto"));
    modal.show();
    
    // Pequeño retraso para asegurar que el mapa tenga dimensiones
    setTimeout(() => {
      const map = L.map('project-detail-map').setView([10.9639, -74.7964], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      // Mostrar puntos del KML
      if (project.kmlData.puntos && project.kmlData.puntos.length > 0) {
        const puntosLayer = L.geoJSON(project.kmlData.puntos, {
            pointToLayer: (feature, latlng) => {
                return L.circleMarker(latlng, {
                    radius: 5,
                    fillColor: "#ff7800",
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                });
            }
        }).addTo(map);
        
        try {
            const bounds = puntosLayer.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds);
            } else {
                map.setView([10.9639, -74.7964], 13);
            }
        } catch (e) {
            console.error("Error al ajustar vista:", e);
            map.setView([10.9639, -74.7964], 13);
        }
    }

      // Mostrar líneas si existen
      if (project.kmlData.lineas && project.kmlData.lineas.length > 0) {
        project.kmlData.lineas.forEach(linea => {
          const puntos = linea.puntos.map(p => [p.lat, p.lng]);
          L.polyline(puntos, {color: 'blue'}).addTo(map);
        });
      }
    }, 300);
  } else {
    // Mostrar modal sin mapa si no hay datos KML
    const modal = new bootstrap.Modal(document.getElementById("modalDetalleProyecto"));
    modal.show();
  }

  // Mostrar el modal
  const modal = new bootstrap.Modal(document.getElementById("modalDetalleProyecto"));
  modal.show();
}

export function showAssignProjectModal(projectId) {
  const project = Storage.getProjectById(projectId);
  if (!project) {
    alert("Proyecto no encontrado");
    return;
  }

  // Llenar información del proyecto
  document.getElementById("assign-project-id").value = project.id;
  document.getElementById("assign-project-name").textContent = project.nombre;
  document.getElementById("assign-project-ot").textContent = project.otAire || "N/A";
  document.getElementById("assign-project-location").textContent = 
    `${project.municipio}, ${project.departamento}`;
  document.getElementById("assign-project-poles").textContent = project.numPostes || 0;
  document.getElementById("assign-project-prst").textContent = project.prstNombre;

  // Cargar brigadas disponibles
  const brigadas = Storage.getUsers().filter(u => u.rol === "brigada" && u.activo);
  const select = document.getElementById("assign-brigade-select");
  select.innerHTML = '<option value="">Seleccione una brigada</option>';
  
  brigadas.forEach(brigada => {
    const option = document.createElement("option");
    option.value = brigada.id;
    option.textContent = `${brigada.nombre} ${brigada.apellido} (${brigada.departamento})`;
    select.appendChild(option);
  });

  // Seleccionar brigada actual si ya está asignada
  if (project.brigadaId) {
    select.value = project.brigadaId;
  }

  // Mostrar el modal
  const modal = new bootstrap.Modal(document.getElementById("assignProjectModal"));
  modal.show();
}

// Función para asignar el proyecto (se llama desde el botón en el modal)
export function assignProject() {
  const projectId = document.getElementById("assign-project-id").value;
  const brigadaId = document.getElementById("assign-brigade-select").value;
  
  if (!brigadaId) {
    alert("Por favor seleccione una brigada");
    return;
  }

  const project = Storage.getProjectById(projectId);
  if (!project) {
    alert("Proyecto no encontrado");
    return;
  }

  const brigada = Storage.getUserById(brigadaId);
  if (!brigada) {
    alert("Brigada no encontrada");
    return;
  }

  // Actualizar proyecto
  project.brigadaId = brigadaId;
  project.asignadoA = `${brigada.nombre} ${brigada.apellido}`;
  project.asignadoRol = brigada.rol;
  project.estado = "En Proceso - Asignado a Inspector"; // Cambiado aquí
  
  // Registrar en el historial
  if (!project.historialEstados) {
    project.historialEstados = [];
  }
  
  project.historialEstados.push({
    fecha: new Date().toISOString(),
    estadoAnterior: project.estado,
    nuevoEstado: "En Proceso - Asignado a Inspector", // Cambiado aquí
    usuarioId: Storage.getLoggedUser().id,
    comentario: `Asignado a brigada: ${brigada.nombre} ${brigada.apellido}`
  });

  // Guardar cambios
  Storage.saveProject(project);
  
  // Cerrar modal y actualizar tabla
  bootstrap.Modal.getInstance(document.getElementById("assignProjectModal")).hide();
  loadProjectsTable();
  
  // Mostrar notificación
  alert(`Proyecto asignado exitosamente a ${brigada.nombre} ${brigada.apellido}`);
}

export function showProjectHistory(projectId) {
  const project = Storage.getProjectById(projectId);
  if (!project) {
    alert("Proyecto no encontrado");
    return;
  }

  const tbody = document.getElementById("project-history-body");
  tbody.innerHTML = "";

  // Si no hay historial, mostrar mensaje
  if (!project.historialEstados || project.historialEstados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">No hay historial registrado para este proyecto</td>
      </tr>
    `;
  } else {
    // Ordenar historial por fecha (más reciente primero)
    const historialOrdenado = [...project.historialEstados].sort((a, b) => 
      new Date(b.fecha) - new Date(a.fecha));

    // Llenar tabla con el historial
    historialOrdenado.forEach(item => {
      const usuario = Storage.getUserById(item.usuarioId);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${new Date(item.fecha).toLocaleString()}</td>
        <td>${project.otAire || "N/A"}</td>
        <td>
          <span class="badge bg-secondary">${item.estadoAnterior || "Nuevo"}</span> → 
          <span class="badge bg-primary">${item.nuevoEstado}</span>
        </td>
        <td>${usuario ? `${usuario.nombre} ${usuario.apellido}` : "Usuario desconocido"}</td>
        <td>${usuario ? usuario.rol : "N/A"}</td>
        <td>${item.comentario || "Sin comentarios"}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Mostrar el modal
  const modal = new bootstrap.Modal(document.getElementById("projectHistoryModal"));
  modal.show();
}

export function loadInManagementProjects() {}
export function loadCompletedProjects() {}
export function updateProjectsTable() {}

window.showProjectDetails = showProjectDetails;
window.showAssignProjectModal = showAssignProjectModal;
window.showProjectHistory = showProjectHistory;
window.assignProject = assignProject;