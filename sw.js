// Service worker: que la app abra aunque no haya señal.
//
// El problema que resuelve
// ------------------------
// El sistema ofrecia "Instalar ventas en este celular" y el vendedor se llevaba
// el icono a la pantalla de inicio como si fuera una app nativa. Pero sin
// service worker, tocar ese icono sin datos mostraba el error del navegador
// (ERR_INTERNET_DISCONNECTED): pantalla en blanco. El borrador del pedido
// estaba guardado en el celular, pero el vendedor no podia llegar a el porque
// la pagina no cargaba.
//
// Con esto la app abre igual: se ve la pantalla, el borrador y los datos de la
// ultima vez. Lo que NO hace es tomar pedidos sin señal y sincronizarlos
// despues; eso es otra funcion, mas grande.
//
// Como no dejar a los vendedores pegados a una version vieja
// ----------------------------------------------------------
// Es el riesgo real de cualquier service worker. Tres medidas:
//
//   1. VERSION va atada al mismo numero que ya se cambia en los ?v= del HTML.
//      Al cambiarlo, se borra todo lo cacheado de la version anterior.
//   2. Las paginas (navegaciones) van primero a la red. Con señal, el vendedor
//      siempre recibe la version nueva; el cache solo entra cuando la red falla.
//   3. skipWaiting + clients.claim: el service worker nuevo toma el control en
//      cuanto se instala, sin esperar a que se cierren todas las pestañas.
//
// Si algo sale mal, desde el panel se puede ejecutar en la consola:
//   navigator.serviceWorker.getRegistrations().then(r => r.forEach(x => x.unregister()))

const VERSION = "20260908-ux1";
const CACHE = "lv-sistema-" + VERSION;

// Lo minimo para que las tres pantallas abran sin red.
const ARCHIVOS_BASE = [
  "./index.html",
  "./vendedores.html",
  "./catalogo.html",
  "./css/styles.css",
  "./css/catalogo.css",
  "./css/vendedores-mobile.css",
  "./css/instalacion-app.css",
  "./css/admin/01-base-layout.css",
  "./css/admin/02-pedidos-ventas.css",
  "./css/admin/03-tablas-formularios.css",
  "./css/admin/04-modulos-admin.css",
  "./css/admin/05-responsive-print.css",
  "./css/admin/06-tema-final.css",
  "./css/admin/07-catalogo-bandeja.css",
  "./css/admin/08-pedido-menu.css",
  "./js/supabase-config.js",
  "./js/supabase-auth.js",
  "./js/data.js",
  "./js/helpers.js",
  "./js/productos.js",
  "./js/database/supabase-mappers.js",
  "./js/database/supabase-repository.js",
  "./js/mobile/vendedores-mobile.js",
  "./js/public/catalogo-whatsapp.js",
  "./js/public/instalacion-app.js",
  "./js/public/estado-conexion.js",
  "./assets/icons/lv-icon.svg",
  "./manifest-admin.webmanifest",
  "./manifest-vendedores.webmanifest",
  "./manifest-catalogo.webmanifest"
];

// La libreria de Supabase vive en un CDN. Sin ella la app arranca igual (queda
// en modo sin conexion), pero cacheandola el arranque es identico con y sin
// señal.
const CDN_SUPABASE = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

function esLlamadaDeDatos(url) {
  // Nunca cachear las llamadas a la base: los datos tienen que venir frescos
  // siempre, y servir un pedido o un saldo viejo desde el cache seria peor que
  // no mostrar nada.
  return url.hostname.endsWith(".supabase.co") ||
    url.pathname.includes("/rest/v1/") ||
    url.pathname.includes("/auth/v1/") ||
    url.pathname.includes("/functions/v1/") ||
    url.pathname.includes("/realtime/v1/");
}

self.addEventListener("install", function (evento) {
  evento.waitUntil(
    caches.open(CACHE).then(function (cache) {
      // addAll falla entero si un solo archivo falla, asi que se agregan de a
      // uno: si manana se renombra un css, el service worker igual se instala.
      return Promise.all(
        ARCHIVOS_BASE.concat([CDN_SUPABASE]).map(function (archivo) {
          return cache.add(new Request(archivo, { cache: "reload" }))
            .catch(function (error) {
              console.warn("No se pudo cachear " + archivo, error);
            });
        })
      );
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (evento) {
  evento.waitUntil(
    caches.keys().then(function (nombres) {
      return Promise.all(
        nombres
          .filter(function (nombre) {
            return nombre.startsWith("lv-sistema-") && nombre !== CACHE;
          })
          .map(function (nombre) {
            return caches.delete(nombre);
          })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (evento) {
  const peticion = evento.request;

  if (peticion.method !== "GET") {
    return;
  }

  const url = new URL(peticion.url);

  if (esLlamadaDeDatos(url)) {
    return;   // que siga de largo a la red, sin tocarla
  }

  // Paginas: primero la red, para que con señal siempre llegue lo ultimo.
  if (peticion.mode === "navigate") {
    evento.respondWith(
      fetch(peticion)
        .then(function (respuesta) {
          const copia = respuesta.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(peticion, copia);
          });
          return respuesta;
        })
        .catch(function () {
          return caches.match(peticion)
            .then(function (guardada) {
              return guardada || caches.match("./vendedores.html") ||
                caches.match("./index.html");
            });
        })
    );
    return;
  }

  // Archivos del sistema (js, css, iconos): se responde del cache al toque y
  // se actualiza por atras, asi la proxima carga ya tiene lo nuevo.
  evento.respondWith(
    caches.match(peticion).then(function (guardada) {
      const desdeRed =
        fetch(peticion)
          .then(function (respuesta) {
            if (respuesta && respuesta.ok) {
              const copia = respuesta.clone();
              caches.open(CACHE).then(function (cache) {
                cache.put(peticion, copia);
              });
            }
            return respuesta;
          })
          .catch(function () {
            return guardada;
          });

      return guardada || desdeRed;
    })
  );
});
