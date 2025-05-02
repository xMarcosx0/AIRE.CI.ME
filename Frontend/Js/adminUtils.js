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
      "Atlántico": ["Barranquilla", "Soledad", "Malambo", "Puerto Colombia"],
      "La Guajira": ["Riohacha", "Maicao", "Uribia", "Fonseca"],
      "Magdalena": ["Santa Marta", "Ciénaga", "Fundación", "Aracataca"]
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

  console.log("Componentes inicializados");
}

export function generateOTAirE() {
  const counter = Storage.getCounter();
  const ot = `OT-${++counter.projects}`;
  Storage.saveCounter(counter);
  return ot;
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
