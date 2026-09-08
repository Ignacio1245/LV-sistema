// Aviso de "sin conexion".
//
// Desde que hay service worker la app abre sin señal, y eso solo puede
// confundir: el vendedor ve "CLIENTES 0 | PRODUCTOS 0" y piensa que no tiene
// clientes asignados, cuando en realidad no se pudieron traer los datos.
// Mostrar informacion vieja o vacia sin aclarar que se esta sin conexion es
// peor que no mostrar nada.
//
// Esta franja aparece arriba de todo cuando el celular se queda sin datos y
// desaparece sola al volver la señal.

(function () {
  const ID_FRANJA = "avisoSinConexion";

  function crearFranja() {
    let franja =
      document.getElementById(ID_FRANJA);

    if (franja) {
      return franja;
    }

    franja = document.createElement("div");
    franja.id = ID_FRANJA;
    franja.className = "aviso-sin-conexion";
    franja.setAttribute("role", "status");
    franja.setAttribute("aria-live", "polite");
    franja.hidden = true;
    franja.textContent =
      "Sin conexion. Podes ver lo ultimo cargado, pero no se guarda ni se actualiza hasta que vuelva la señal.";

    if (document.body) {
      document.body.insertBefore(franja, document.body.firstChild);
    }

    return franja;
  }

  function actualizarAviso() {
    const franja =
      crearFranja();

    if (!franja) {
      return;
    }

    const sinConexion =
      navigator.onLine === false;

    franja.hidden = !sinConexion;
    document.body.classList.toggle("hay-aviso-sin-conexion", sinConexion);
  }

  function iniciar() {
    actualizarAviso();
    window.addEventListener("online", actualizarAviso);
    window.addEventListener("offline", actualizarAviso);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
