// Registro del service worker: es lo que hace que la app abra sin señal.
// Va antes que el resto porque no depende de que existan los botones de
// instalar (las tres paginas lo necesitan, tengan o no ese boton).
(function () {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  // Solo sobre https (o en localhost, para poder probarlo). En http comun el
  // navegador no lo permite y tirar el error no aporta nada.
  const origenSeguro =
    window.isSecureContext ||
    location.protocol === "https:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1";

  if (!origenSeguro) {
    return;
  }

  // Solo se recarga cuando cambia de un service worker a OTRO, es decir cuando
  // se publico una version nueva. En la primera visita no habia controlador
  // previo: si se recargara ahi, todo el que entra por primera vez veria la
  // pagina recargarse sola, y a alguien cargando un pedido se le cortaria la
  // pantalla en la mitad.
  const habiaControladorAntes =
    Boolean(navigator.serviceWorker.controller);
  let recargando = false;

  navigator.serviceWorker.addEventListener("controllerchange", function () {
    if (!habiaControladorAntes || recargando) {
      return;
    }

    recargando = true;
    window.location.reload();
  });

  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/sw.js", { scope: "/" })
      .catch(function (error) {
        console.warn("No se pudo registrar el service worker:", error);
      });
  });
})();

(function () {
  const botones = Array.from(document.querySelectorAll("[data-install-app]"));
  const ayudasIos = Array.from(document.querySelectorAll("[data-install-ios-help]"));
  let eventoInstalacion = null;

  if (botones.length === 0 && ayudasIos.length === 0) {
    return;
  }

  function estaInstalada() {
    return window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
  }

  function ocultarOpciones() {
    botones.forEach(function (boton) { boton.hidden = true; });
    ayudasIos.forEach(function (ayuda) { ayuda.hidden = true; });
  }

  function mostrarAyudaIosSiCorresponde() {
    const esIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    if (esIos && !estaInstalada()) {
      ayudasIos.forEach(function (ayuda) { ayuda.hidden = false; });
    }
  }

  botones.forEach(function (boton) {
    boton.addEventListener("click", async function () {
      if (!eventoInstalacion) {
        return;
      }
      eventoInstalacion.prompt();
      const eleccion = await eventoInstalacion.userChoice;
      eventoInstalacion = null;
      if (eleccion && eleccion.outcome === "accepted") {
        ocultarOpciones();
      } else {
        boton.hidden = true;
      }
    });
  });

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    eventoInstalacion = event;
    if (!estaInstalada()) {
      botones.forEach(function (boton) { boton.hidden = false; });
    }
  });

  window.addEventListener("appinstalled", ocultarOpciones);

  if (estaInstalada()) {
    ocultarOpciones();
  } else {
    mostrarAyudaIosSiCorresponde();
  }
})();
