const API_URL = "https://script.google.com/macros/s/AKfycbzqXRsm-q8Bq2pZ5-ykFmKeHSk2f6elBAISDlXlKaMIjm1_-urQqw1XAKxkrJBaaQ3m-g/exec"

export const database = {
  // Para leer cualquier pestaña (proyectos, pendientes, gases, etc.)
  obtenerSeccion: async (seccion) => {
    try {
      const response = await fetch(`${API_URL}?accion=${seccion}`);
      return await response.json();
    } catch (error) {
      console.error("Error leyendo sección " + seccion, error);
      return [];
    }
  },
  
  // Para mandar escrituras o modificaciones
  guardarDatos: async (accion, datos) => {
    try {
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion, ...datos })
      });
      return true;
    } catch (error) {
      console.error("Error en ejecución POST:", error);
      return false;
    }
  }
};