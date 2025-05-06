// KML Handler - Utilidad para procesar archivos KML y KMZ
const KMLHandler = (() => {
  // Función para procesar un archivo KML o KMZ
  async function processFile(file) {
    console.log(`Procesando archivo: ${file.name}, tipo: ${file.type}, tamaño: ${file.size} bytes`)

    if (file.name.toLowerCase().endsWith(".kmz")) {
      return await processKMZ(file)
    } else if (file.name.toLowerCase().endsWith(".kml")) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const kmlData = procesarKML(e.target.result)
            console.log("KML procesado correctamente:", kmlData)
            resolve(kmlData)
          } catch (error) {
            console.error("Error al procesar KML:", error)
            reject(error)
          }
        }
        reader.onerror = (e) => {
          console.error("Error al leer el archivo KML:", e)
          reject(new Error("Error al leer el archivo KML"))
        }
        reader.readAsText(file)
      })
    } else {
      console.error("Formato de archivo no soportado:", file.name)
      throw new Error("Formato de archivo no soportado. Solo se aceptan archivos KML y KMZ.")
    }
  }

  // Función para procesar un archivo KMZ (ZIP que contiene un KML)
  async function processKMZ(file) {
    console.log(`Procesando archivo KMZ: ${file.name}`);
  
    try {
      // Verificar si JSZip está disponible
      if (typeof JSZip === "undefined") {
        console.error("JSZip no está disponible");
        throw new Error("JSZip library is required to process KMZ files. Please include it in your project.");
      }

      console.log("Cargando archivo KMZ con JSZip...")
      const zip = await JSZip.loadAsync(file)
      console.log("Archivo KMZ cargado correctamente")

      // Buscar el archivo KML dentro del ZIP
      let kmlFile = null
      let kmlContent = null

      // Primero buscar doc.kml (nombre estándar)
      if (zip.files["doc.kml"]) {
        console.log("Encontrado doc.kml en el archivo KMZ")
        kmlFile = zip.files["doc.kml"]
      } else {
        // Si no existe, buscar cualquier archivo .kml
        console.log("Buscando cualquier archivo KML en el KMZ...")
        for (const filename in zip.files) {
          if (filename.toLowerCase().endsWith(".kml")) {
            console.log(`Encontrado archivo KML: ${filename}`)
            kmlFile = zip.files[filename]
            break
          }
        }
      }

      if (!kmlFile) {
        console.error("No se encontró ningún archivo KML dentro del KMZ")
        throw new Error("No se encontró ningún archivo KML dentro del KMZ")
      }

      // Extraer el contenido del KML
      console.log("Extrayendo contenido del KML...")
      kmlContent = await kmlFile.async("text")
      console.log("Contenido KML extraído correctamente")

      // Procesar el KML
      console.log("Procesando contenido KML...")
      const kmlData = procesarKML(kmlContent)
      console.log("KML procesado correctamente:", kmlData)
      return kmlData
    } catch (error) {
      console.error("Error al procesar archivo KMZ:", error)
      throw error
    }
  }

  // Función mejorada para procesar KML con mejor extracción de datos
  function procesarKML(kmlContent) {
    try {
        // Crear un parser de XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(kmlContent, "text/xml");

        // Verificar si hay errores en el XML
        const parserError = xmlDoc.querySelector("parsererror");
        if (parserError) {
            throw new Error("Error al parsear el XML: " + parserError.textContent);
        }

        // Validar estructura básica del KML
        if (!xmlDoc.querySelector("kml")) {
            throw new Error("El archivo no es un KML válido");
        }

        // Estructura de resultado
        const resultado = {
            puntos: [],
            lineas: [],
            poligonos: [],
            estilos: {}
        };

        // Extraer Placemarks
        const placemarks = xmlDoc.querySelectorAll("Placemark");

        placemarks.forEach((placemark) => {
            // Extraer información básica
            const nombre = placemark.querySelector("name")?.textContent || "";
            const descripcion = placemark.querySelector("description")?.textContent || "";
            const styleUrl = placemark.querySelector("styleUrl")?.textContent || "";
            const style = styleUrl ? styleUrl.replace("#", "") : "";

            // Extraer información de carpeta
            let carpeta = "";
            let currentElement = placemark;
            while (currentElement.parentElement) {
                if (currentElement.parentElement.tagName === "Folder") {
                    const folderName = currentElement.parentElement.querySelector("name")?.textContent || "";
                    if (folderName) {
                        carpeta = folderName;
                        break;
                    }
                }
                currentElement = currentElement.parentElement;
            }

            // Extraer datos extendidos
            const extendedData = {};
            const dataElements = placemark.querySelectorAll("ExtendedData Data");
            dataElements.forEach((dataElement) => {
                const name = dataElement.getAttribute("name");
                const value = dataElement.querySelector("value")?.textContent || "";
                if (name) {
                    extendedData[name] = value;
                }
            });

            // Procesar Point (Puntos)
            const point = placemark.querySelector("Point");
            // En la función procesarKML, modifica la parte de puntos:
            if (point) {
              const coordsText = point.querySelector("coordinates")?.textContent;
              if (coordsText) {
                const coords = coordsText.trim().split(",");
                if (coords.length >= 2) {
                    const lng = parseFloat(coords[0]);
                    const lat = parseFloat(coords[1]);
                    
                    // Validar que sean coordenadas geográficas plausibles
                    if (!isNaN(lng) && !isNaN(lat) && 
                        lat >= -90 && lat <= 90 && 
                        lng >= -180 && lng <= 180) {
                        // Coordenadas válidas
                        resultado.puntos.push({
                              nombre: nombre,
                              descripcion: descripcion,
                              lng: lng,
                              lat: lat,
                              lon: lng,
                              alt: coords.length > 2 ? parseFloat(coords[2]) : 0,
                              carpeta: carpeta,
                              style: style,
                              extendedData: extendedData,
                              tipo: determinarTipoPunto(nombre, descripcion, carpeta, style, extendedData),
                          });
                      }
                  }
              }
            }

            // Procesar LineString (Líneas)
            const lineString = placemark.querySelector("LineString");
            if (lineString) {
                const coordsText = lineString.querySelector("coordinates")?.textContent;
                if (coordsText) {
                    const coordsArray = coordsText.trim().split(/\s+/);
                    const puntosRuta = coordsArray.map((coordStr) => {
                        const coords = coordStr.split(",");
                        if (coords.length >= 2) {
                            return {
                                lng: parseFloat(coords[0]),
                                lat: parseFloat(coords[1]),
                                lon: parseFloat(coords[0]),
                                alt: coords.length > 2 ? parseFloat(coords[2]) : 0,
                            };
                        }
                        return null;
                    }).filter(p => p !== null);

                    if (puntosRuta.length > 0) {
                        resultado.lineas.push({
                            nombre: nombre,
                            descripcion: descripcion,
                            puntos: puntosRuta,
                            carpeta: carpeta,
                            style: style,
                            extendedData: extendedData,
                            tipo: "linea",
                        });
                    }
                }
            }

            // Procesar Polygon (Polígonos)
            const polygon = placemark.querySelector("Polygon");
            if (polygon) {
                const outerBoundary = polygon.querySelector("outerBoundaryIs LinearRing coordinates");
                if (outerBoundary) {
                    const coordsText = outerBoundary.textContent;
                    const coordsArray = coordsText.trim().split(/\s+/);
                    const puntosPoligono = coordsArray.map((coordStr) => {
                        const coords = coordStr.split(",");
                        if (coords.length >= 2) {
                            return {
                                lng: parseFloat(coords[0]),
                                lat: parseFloat(coords[1]),
                                lon: parseFloat(coords[0]),
                                alt: coords.length > 2 ? parseFloat(coords[2]) : 0,
                            };
                        }
                        return null;
                    }).filter(p => p !== null);

                    if (puntosPoligono.length > 0) {
                        resultado.poligonos.push({
                            nombre: nombre,
                            descripcion: descripcion,
                            puntos: puntosPoligono,
                            carpeta: carpeta,
                            style: style,
                            extendedData: extendedData,
                            tipo: "poligono",
                        });
                    }
                }
            }
        });

        // Procesar estilos
        const styles = xmlDoc.querySelectorAll("Style");
        styles.forEach((style) => {
            const id = style.getAttribute("id");
            if (id) {
                const iconStyle = style.querySelector("IconStyle");
                const lineStyle = style.querySelector("LineStyle");
                const polyStyle = style.querySelector("PolyStyle");

                resultado.estilos[id] = {
                    icon: iconStyle ? {
                        scale: iconStyle.querySelector("scale")?.textContent || "1.0",
                        href: iconStyle.querySelector("Icon href")?.textContent || "",
                    } : null,
                    line: lineStyle ? {
                        color: lineStyle.querySelector("color")?.textContent || "ffffffff",
                        width: lineStyle.querySelector("width")?.textContent || "1.0",
                    } : null,
                    poly: polyStyle ? {
                        color: polyStyle.querySelector("color")?.textContent || "ffffffff",
                        fill: polyStyle.querySelector("fill")?.textContent !== "0",
                        outline: polyStyle.querySelector("outline")?.textContent !== "0",
                    } : null,
                };
            }
        });

        // Procesar LineStrings que no estén dentro de Placemarks
        const lineStrings = xmlDoc.querySelectorAll("LineString:not(Placemark LineString)");
        lineStrings.forEach((lineString) => {
            const coordsText = lineString.querySelector("coordinates")?.textContent;
            if (coordsText) {
                const coordsArray = coordsText.trim().split(/\s+/);
                const puntosRuta = coordsArray.map((coordStr) => {
                    const coords = coordStr.split(",");
                    if (coords.length >= 2) {
                        return {
                            lng: parseFloat(coords[0]),
                            lat: parseFloat(coords[1]),
                            lon: parseFloat(coords[0]),
                            alt: coords.length > 2 ? parseFloat(coords[2]) : 0,
                        };
                    }
                    return null;
                }).filter(p => p !== null);

                if (puntosRuta.length > 0) {
                    resultado.lineas.push({
                        nombre: "Línea sin nombre",
                        descripcion: "",
                        puntos: puntosRuta,
                        carpeta: "",
                        style: "",
                        tipo: "linea",
                    });
                }
            }
        });

        return resultado;
    } catch (error) {
        console.error("Error al procesar KML:", error);
        throw new Error("Error al procesar el archivo KML: " + error.message);
    }
}

  // Función mejorada para determinar el tipo de punto
  // Función mejorada para determinar el tipo de punto
function determinarTipoPunto(nombre, descripcion, carpeta, style, extendedData) {
  // Normalizar textos
  const nombreLower = nombre ? nombre.toLowerCase() : '';
  const descripcionLower = descripcion ? descripcion.toLowerCase() : '';
  const carpetaLower = carpeta ? carpeta.toLowerCase() : '';
  const textoCompleto = `${nombreLower} ${descripcionLower} ${carpetaLower} ${JSON.stringify(extendedData)}`.toLowerCase();
  
  // Lista de patrones para identificar postes
  const patronesPoste = [
      /poste/i,
      /p\d+/i,       // P1, P2, etc.
      /\b\d+\b/,     // Números solos
      /apoyo/i,
      /estructura/i,
      /torre/i,
      /columna/i,
      /soporte/i,
      /pole/i,
      /post/i
  ];
  
  // Verificar si coincide con algún patrón de poste
  if (patronesPoste.some(patron => 
      patron.test(nombreLower) || 
      patron.test(descripcionLower) || 
      patron.test(carpetaLower)
  )) {
      return "poste";
  }

  // Verificar datos extendidos
  if (extendedData) {
      const valores = Object.values(extendedData).map((v) => String(v).toLowerCase());
      for (const valor of valores) {
          for (const patron of patronesPoste) {
              if (patron.test(valor)) {
                  return "poste";
              }
          }
      }
  }

  // Verificar si es un cliente
  if (textoCompleto.includes("cliente") || textoCompleto.includes("client")) {
      return "cliente";
  }

  // Verificar si es un nodo
  if (textoCompleto.includes("nodo") || textoCompleto.includes("node")) {
      return "nodo";
  }

  // Verificar si es un punto de referencia
  if (textoCompleto.includes("referencia") || textoCompleto.includes("landmark")) {
      return "referencia";
  }

  // Por defecto, considerar como punto genérico
  return "punto";
}

  // Exponer las funciones públicas
  return {
    processFile: processFile,
    procesarKML: procesarKML,
    determinarTipoPunto: determinarTipoPunto,
  }
})()

// Si estamos en un entorno de Node.js, exportar el módulo
if (typeof module !== "undefined" && module.exports) {
  module.exports = KMLHandler
}

export default KMLHandler;