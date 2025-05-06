import Storage from './storage.js';
import KMLHandler from './kml-handler.js';

let map;
let projectLayers = {};

// Función para convertir datos KML a GeoJSON válido
function convertKMLToGeoJSON(kmlData) {
  const geoJSON = {
    type: "FeatureCollection",
    features: []
  };

  // Procesar puntos
  if (kmlData.puntos && Array.isArray(kmlData.puntos)) {
    kmlData.puntos.forEach(punto => {
      if (punto.lat && punto.lng) {
        geoJSON.features.push({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [punto.lng, punto.lat]
          },
          properties: {
            name: punto.nombre || "Punto sin nombre",
            type: punto.tipo || "punto",
            description: punto.descripcion || ""
          }
        });
      }
    });
  }

  // Procesar líneas
  if (kmlData.lineas && Array.isArray(kmlData.lineas)) {
    kmlData.lineas.forEach(linea => {
      if (linea.puntos && Array.isArray(linea.puntos) && linea.puntos.length > 0) {
        const coordinates = linea.puntos.map(p => [p.lng, p.lat]);
        geoJSON.features.push({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: coordinates
          },
          properties: {
            name: linea.nombre || "Línea sin nombre",
            type: linea.tipo || "linea",
            description: linea.descripcion || ""
          }
        });
      }
    });
  }

  return geoJSON;
}

export function initMap() {
  try {
    map = L.map('projects-map').setView([10.9639, -74.7964], 10);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    loadProjectsOnMap();
  } catch (error) {
    console.error("Error al inicializar el mapa:", error);
    alert("Error al cargar el mapa. Por favor recargue la página.");
  }
}

export function loadProjectsOnMap() {
  try {
    // Limpiar capas existentes
    Object.values(projectLayers).forEach(layer => {
      if (layer && map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
    projectLayers = {};

    const projects = Storage.getProjects();
    
    projects.forEach(project => {
      if (project.kmlData) {
        try {
          // Convertir KML a GeoJSON válido
          const geoJSON = convertKMLToGeoJSON(project.kmlData);
          
          // Validar que el GeoJSON tenga features
          if (!geoJSON.features || geoJSON.features.length === 0) {
            console.warn(`Proyecto ${project.id} no tiene datos geográficos válidos`);
            return;
          }

          const layer = L.geoJSON(geoJSON, {
            pointToLayer: (feature, latlng) => {
              return L.circleMarker(latlng, {
                radius: 5,
                fillColor: "#ff7800",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
              }).bindPopup(`<b>${feature.properties.name}</b><br>Tipo: ${feature.properties.type}`);
            },
            style: (feature) => {
              if (feature.geometry.type === "LineString") {
                return {
                  color: '#3388ff',
                  weight: 3,
                  opacity: 0.7
                };
              }
            }
          }).addTo(map);
          
          layer.bindPopup(`<b>${project.nombre}</b><br>PRST: ${project.prstNombre}`);
          projectLayers[project.id] = layer;
          
          // Ajustar vista para mostrar todos los proyectos
          if (Object.keys(projectLayers).length > 0) {
            const group = new L.featureGroup(Object.values(projectLayers));
            map.fitBounds(group.getBounds());
          }
        } catch (error) {
          console.error(`Error al cargar proyecto ${project.id}:`, error);
        }
      }
    });
  } catch (error) {
    console.error("Error al cargar proyectos en el mapa:", error);
  }
}

export function processKMZ(file) {
  return KMLHandler.processFile(file)
    .then(kmlData => {
      // Convertir a GeoJSON válido antes de devolver
      return convertKMLToGeoJSON(kmlData);
    })
    .catch(error => {
      console.error("Error processing KMZ:", error);
      throw error;
    });
}