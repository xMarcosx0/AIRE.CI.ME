import Storage from './storage.js';


export function initializeComponents() {
  const prstSelect = document.getElementById("project-prst");
  const prstList = Storage.getPRSTList();
  if (prstSelect) {
    prstSelect.innerHTML = '<option value="">Seleccione un PRST</option>' + 
      prstList.map(p => `<option value="${p.nombreCorto}">${p.nombreCorto}</option>`).join('');
  }

  // Dinamismo municipio por departamento
  const deptSelect = document.getElementById("project-department");
  const munSelect = document.getElementById("project-municipality");

  if (deptSelect && munSelect) {
    const municipios = {
      "Atlántico": [
        "Barranquilla", "Baranoa", "Campo de la Cruz", "Candelaria", "Galapa",
        "Juan de Acosta", "Luruaco", "Malambo", "Manati", "Palmar de varela",
        "Piojo", "Polonuevo", "Ponedera", "Puerto Colombia", "Repelon",
        "Sabanagrande", "Sabanalarga", "Santa Lucia", "Santo Tomas", "Soledad",
        "Suan", "Tubara", "Usiacuri"
      ],
      "La Guajira": [
        "Riohacha", "Albania", "Barrancas", "Dibulla", "Distraccion",
        "El Molino", "Fonseca", "Hatonuevo", "La Jagua del Pilar", "Maicao",
        "Manaure", "San Juan del Cesar", "Uribia", "Urumita", "Villanueva"
      ],
      "Magdalena": [
        "Santa Marta", "Aracataca", "Cerro de San Antonio", "Chibolo", "Cienaga",
        "Concordia", "El Piñon", "El Reten", "Fundacion", "Pedraza",
        "Pivijay", "Plato", "Puebloviejo", "Remolino", "Salamina",
        "Sitionuevo", "Tenerife", "Zapayan", "Zona Bananera"
      ]
    };

    deptSelect.addEventListener("change", () => {
      const selected = deptSelect.value;
      munSelect.innerHTML = '<option value="">Seleccione un municipio</option>';
      if (municipios[selected]) {
        municipios[selected].forEach(m => {
          const opt = document.createElement("option");
          opt.value = m;
          opt.textContent = m;
          munSelect.appendChild(opt);
        });
      }
    });
  }

  document.getElementById("project-prst")?.addEventListener("change", function() {
    const prstNombre = this.value;
    if (prstNombre) {
      document.getElementById("project-ot").value = generateOTAirE(prstNombre);
    }
  });

  console.log("Componentes inicializados");
}

export function generateOTAirE(prstNombre) {
  const counter = Storage.getCounter();
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // Obtener el nombre corto del PRST
  const prstShortName = Storage.getPRSTShortName(prstNombre).replace(/\s+/g, '_');
  
  // Contar proyectos existentes de este PRST en el mes actual
  const projects = Storage.getProjects();
  const currentMonthProjects = projects.filter(p => {
    const projectDate = new Date(p.fechaCreacion);
    return p.prstNombre === prstNombre && 
           projectDate.getFullYear() === year && 
           projectDate.getMonth() === now.getMonth();
  });
  
  const consecutivo = currentMonthProjects.length + 1;
  
  return `${prstShortName}_${year}_${month}.${consecutivo}`;
}

export function getPoleHeightsDistribution() {
  const heights = {};
  const inputs = document.querySelectorAll(".pole-height");
  let total = 0;

  inputs.forEach(input => {
    const h = input.dataset.height;
    const v = parseInt(input.value) || 0;
    heights[h] = v;
    total += v;
  });

  const summary = document.getElementById("height-summary");
  const expected = parseInt(document.getElementById("project-poles").value) || 0;
  if (summary) summary.textContent = `Total: ${total} de ${expected} postes`;

  return heights;
}

export function togglePasswordVisibility() {
  const input = document.getElementById("user-password");
  const icon = this.querySelector("i");
  if (input) {
    const type = input.type === "password" ? "text" : "password";
    input.type = type;
    if (icon) icon.classList.toggle("fa-eye-slash");
  }
}

export function formatDateTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString();
}
