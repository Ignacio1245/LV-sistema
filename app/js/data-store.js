const DATA_STORE_MODE = "SUPABASE";
const dataStoreMemoria = {};

const dataStore = {
  guardarLista(nombreDeLista, lista) {
    dataStoreMemoria[nombreDeLista] =
      Array.isArray(lista)
        ? [...lista]
        : lista;
  },

  leerLista(nombreDeLista) {
    return dataStoreMemoria[nombreDeLista] || null;
  },

  borrarLista(nombreDeLista) {
    delete dataStoreMemoria[nombreDeLista];
  },

  usaBaseOnline() {
    return DATA_STORE_MODE === "SUPABASE";
  }
};
