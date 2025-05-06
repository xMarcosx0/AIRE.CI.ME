import Storage from './storage.js';
import { setupEventListeners } from './adminListeners.js';
import { initializeComponents } from './adminUtils.js';
import { loadUsersTable } from './adminUsers.js';
import { loadProjectsTable } from './adminProjects.js';
import { loadCharts } from './adminCharts.js';
import { initMap, loadProjectsOnMap } from './adminMap.js';
import KMLHandler from './kml-handler.js';


document.addEventListener("DOMContentLoaded", () => {
  try {
    if (!Storage || !Storage.init) throw new Error("Storage no inicializado");
    Storage.init();

    const currentUser = Storage.getLoggedUser();
    if (!currentUser || currentUser.rol !== "admin") {
      location.href = "login.html";
      return;
    }

    document.getElementById("user-name").textContent = `${currentUser.nombre} ${currentUser.apellido || ""}`;

    initializeComponents();
    setupEventListeners();
    loadUsersTable();
    loadProjectsTable();
    loadCharts(Storage.getProjects());
    initMap();

  } catch (e) {
    console.error("Error en inicialización:", e);
    alert("Error crítico. Recargue la página.");
  }
});
