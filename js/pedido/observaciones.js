function escaparTextoObservacionPedido(valor) {
    if (typeof escaparTextoHtml === "function") {
        return escaparTextoHtml(valor);
    }

    return String(valor === null || valor === undefined ? "" : valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function guardarObservacionesPedidoActualLocalSiExiste() {
    if (typeof guardarPedidoActualLocal === "function") {
        guardarPedidoActualLocal();
    }
}

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
      <span>${escaparTextoObservacionPedido(observacion)}</span>
      <button type="button" onclick="quitarObservacionPedidoActual(${indice})">x</button>
    `;

        dom.observacionesPedidoLista.appendChild(fila);
    });
}

function agregarObservacionPedidoActual() {
    const observacion =
        dom.observacionPedidoInput
            ? dom.observacionPedidoInput.value
            : "";

    if (!observacion || observacion.trim() === "") {
        if (dom.observacionPedidoInput) {
            dom.observacionPedidoInput.focus();
        }
        return;
    }

    pedidoActual.observaciones.push(observacion.trim());
    dom.observacionPedidoInput.value = "";
    dom.observacionPedidoInput.focus();
    renderizarObservacionesPedidoActual();
    guardarObservacionesPedidoActualLocalSiExiste();
}

function quitarObservacionPedidoActual(indice) {
    pedidoActual.observaciones.splice(indice, 1);
    renderizarObservacionesPedidoActual();
    guardarObservacionesPedidoActualLocalSiExiste();
}