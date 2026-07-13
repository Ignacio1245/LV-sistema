const DATA_STORE_MODE = "SUPABASE";
const DATA_STORE_PREFIX = "lv_sistema_";
const dataStoreMemoria = {};

function clonarDatoDataStore(valor) {
  if (valor === undefined || valor === null) {
    return valor;
  }

  try {
    return JSON.parse(JSON.stringify(valor));
  } catch (_error) {
    return valor;
  }
}

function obtenerClaveDataStore(nombreDeLista) {
  return DATA_STORE_PREFIX + nombreDeLista;
}

const dataStore = {
  guardarLista(nombreDeLista, lista) {
    const copia = clonarDatoDataStore(lista);
    dataStoreMemoria[nombreDeLista] = copia;

    try {
      localStorage.setItem(
        obtenerClaveDataStore(nombreDeLista),
        JSON.stringify(copia)
      );
    } catch (error) {
      console.warn("No se pudo guardar copia local de " + nombreDeLista + ":", error);
    }
  },

  leerLista(nombreDeLista) {
    if (Object.prototype.hasOwnProperty.call(dataStoreMemoria, nombreDeLista)) {
      return clonarDatoDataStore(dataStoreMemoria[nombreDeLista]);
    }

    try {
      const textoGuardado =
        localStorage.getItem(obtenerClaveDataStore(nombreDeLista));

      if (!textoGuardado) {
        return null;
      }

      const dato = JSON.parse(textoGuardado);
      dataStoreMemoria[nombreDeLista] = dato;
      return clonarDatoDataStore(dato);
    } catch (error) {
      console.warn("No se pudo leer copia local de " + nombreDeLista + ":", error);
      return null;
    }
  },

  borrarLista(nombreDeLista) {
    delete dataStoreMemoria[nombreDeLista];

    try {
      localStorage.removeItem(obtenerClaveDataStore(nombreDeLista));
    } catch (error) {
      console.warn("No se pudo borrar copia local de " + nombreDeLista + ":", error);
    }
  },

  usaBaseOnline() {
    return DATA_STORE_MODE === "SUPABASE";
  }
};