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
