function renderizarObservacionesPedidoActual() {
    if (!dom.observacionesPedidoLista) {
        return;
    }

    dom.observacionesPedidoLista.innerHTML = "";

    if (pedidoActual.observaciones.length === 0) {
        dom.observacionesPedidoLista.innerHTML = "<p>No hay observaciones</p>";
        return;
    }

    pedidoActual.observaciones.forEach(function (observacion, indice) {
        const fila = document.createElement("div");
        fila.className = "observation-row";
        fila.innerHTML = `
      <span>${observacion}</span>
      <button type="button" onclick="quitarObservacionPedidoActual(${indice})">x</button>
    `;

        dom.observacionesPedidoLista.appendChild(fila);
    });
}

function agregarObservacionPedidoActual() {
    const observacion =
        prompt("Escribi la observacion del pedido:");

    if (!observacion || observacion.trim() === "") {
        return;
    }

    pedidoActual.observaciones.push(observacion.trim());
    renderizarObservacionesPedidoActual();
}

function quitarObservacionPedidoActual(indice) {
    pedidoActual.observaciones.splice(indice, 1);
    renderizarObservacionesPedidoActual();
}
