const TAMANO_PAGINA_SUPABASE = 1000;

// Postgres devuelve 42883 (o "does not exist" en el mensaje) cuando se llama a
// una funcion que todavia no se desplego. Sirve para poder subir el frontend
// antes que el SQL sin que el sistema quede sin funcionar.
function esErrorFuncionSupabaseFaltante(error) {
  if (!error) {
    return false;
  }

  const codigo =
    String(error.code || "");
  const mensaje =
    String(error.message || "").toLowerCase();

  return codigo === "42883" ||
    codigo === "PGRST202" ||
    mensaje.includes("could not find the function") ||
    (mensaje.includes("function") && mensaje.includes("does not exist"));
}

async function consultarTablaSupabase(nombreTabla, ordenCampo, opciones) {
  const opcionesConsulta = opciones || {};
  const seleccion = opcionesConsulta.seleccion || "*";
  const ascendente = opcionesConsulta.ascendente !== false;
  const limiteTotal = Number(opcionesConsulta.limite) || 0;
  const resultados = [];
  let pagina = 0;

  while (true) {
    const desde = pagina * TAMANO_PAGINA_SUPABASE;
    let hasta = desde + TAMANO_PAGINA_SUPABASE - 1;

    if (limiteTotal > 0) {
      const restantes = limiteTotal - resultados.length;

      if (restantes <= 0) {
        break;
      }

      hasta = desde + Math.min(restantes, TAMANO_PAGINA_SUPABASE) - 1;
    }

    let consulta =
      supabaseClient
        .from(nombreTabla)
        .select(seleccion)
        .range(desde, hasta);

    if (ordenCampo) {
      consulta = consulta.order(ordenCampo, { ascending: ascendente });
    }

    const { data, error } =
      await consulta;

    if (error) {
      throw error;
    }

    const filas = data || [];
    resultados.push(...filas);

    if (filas.length < (hasta - desde + 1)) {
      break;
    }

    pagina += 1;
  }

  return resultados;
}

async function obtenerProductosSupabase() {
  const productosSupabase =
    await consultarTablaSupabase("productos", "codigo");

  return productosSupabase
    .map(mapearProductoDesdeSupabase)
    .filter(Boolean);
}

async function obtenerProductosCatalogoPublicoSupabase() {
  // Esta consulta solo devuelve productos publicables, no datos de clientes.
  const { data, error } =
    await supabaseClient.rpc("obtener_catalogo_publico");

  if (error) {
    throw error;
  }

  return (data || [])
    .map(mapearProductoDesdeSupabase)
    .map(function (producto) {
      // El RPC publico ya descuenta reservas. No reconstruir bultos desde el stock fisico anterior.
      if (producto && producto.tipoStock === "bultos") {
        const unidades = Math.max(1, Number(producto.unidadesPorBulto) || 1);
        producto.stockBultos = Math.floor(producto.stock / unidades);
        producto.stockUnidades = producto.stock % unidades;
      }
      return producto;
    })
    .filter(Boolean);
}

async function crearPedidoCatalogoPublicoSupabase(pedidoCatalogo) {
  const { data, error } =
    await supabaseClient.rpc("crear_pedido_catalogo_vendedor", {
      pedido: pedidoCatalogo
    });

  if (error) {
    throw error;
  }

  return Array.isArray(data) && data.length > 0
    ? data[0]
    : null;
}

async function crearEnlaceCatalogoVendedorSupabase(codigoVendedor) {
  const { data, error } = await supabaseClient.rpc("crear_enlace_catalogo_vendedor", { vendedor_codigo: Number(codigoVendedor) });
  if (error) throw error;
  const fila = Array.isArray(data) && data.length ? data[0] : null;
  return fila ? {
    token: fila.token,
    vendedorNombre: fila.vendedor_nombre,
    whatsapp: fila.whatsapp
  } : null;
}

async function obtenerEnlaceCatalogoVendedorSupabase(token) {
  const { data, error } = await supabaseClient.rpc("obtener_enlace_catalogo_vendedor", { enlace_token: token });
  if (error) throw error;
  const fila = Array.isArray(data) && data.length ? data[0] : null;
  return fila ? {
    vendedorNombre: fila.vendedor_nombre,
    whatsapp: fila.whatsapp
  } : null;
}

async function obtenerConfiguracionCatalogoPublicoSupabase() {
  const { data, error } = await supabaseClient.rpc("obtener_configuracion_catalogo_publico");
  if (error) throw error;
  return Array.isArray(data) && data.length ? data[0] : { whatsapp: "" };
}

async function obtenerClientesSupabase() {
  const clientesSupabase =
    await consultarTablaSupabase("clientes", "codigo");

  return clientesSupabase
    .map(mapearClienteDesdeSupabase)
    .filter(Boolean);
}

async function obtenerMayorCodigoClienteSupabase() {
  const { data, error } =
    await supabaseClient
      .from("clientes")
      .select("codigo")
      .order("codigo", { ascending: false })
      .limit(1);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return 0;
  }

  return Number(data[0].codigo) || 0;
}

async function guardarProductoSupabase(producto) {
  const productoSupabase =
    mapearProductoParaSupabase(producto);

  const consulta =
    producto.idSupabase
      ? supabaseClient.from("productos").update(productoSupabase).eq("id", producto.idSupabase)
      : supabaseClient.from("productos").upsert(productoSupabase, { onConflict: "codigo" });

  const { data, error } =
    await consulta.select().single();

  if (error) {
    throw error;
  }

  return data ? mapearProductoDesdeSupabase(data) : null;
}

async function guardarClienteSupabase(cliente) {
  const clienteSupabase =
    mapearClienteParaSupabase(cliente);

  const consulta =
    cliente.idSupabase
      ? supabaseClient.from("clientes").update(clienteSupabase).eq("id", cliente.idSupabase)
      : supabaseClient.from("clientes").upsert(clienteSupabase, { onConflict: "codigo" });

  const { data, error } =
    await consulta.select().single();

  if (error) {
    throw error;
  }

  return data ? mapearClienteDesdeSupabase(data) : null;
}

async function insertarClienteNuevoSupabase(cliente) {
  const clienteSupabase =
    mapearClienteParaSupabase(cliente);

  const { data, error } =
    await supabaseClient
      .from("clientes")
      .insert(clienteSupabase)
      .select()
      .single();

  if (error) {
    throw error;
  }

  return data ? mapearClienteDesdeSupabase(data) : null;
}

async function eliminarClienteSupabase(cliente) {
  if (!cliente) {
    return;
  }

  const consulta =
    cliente.idSupabase
      ? supabaseClient.from("clientes").delete().eq("id", cliente.idSupabase)
      : supabaseClient.from("clientes").delete().eq("codigo", cliente.codigo);

  const { error } =
    await consulta;

  if (error) {
    throw error;
  }
}

async function obtenerPedidosSupabase() {
  const pedidosSupabase =
    await consultarTablaSupabase("pedidos", "numero", {
      seleccion: `
        *,
        clientes(*),
        pedido_items(
          *,
          productos(*)
        )
      `
    });

  return pedidosSupabase
    .map(mapearPedidoDesdeSupabase)
    .filter(Boolean);
}

async function obtenerMayorNumeroPedidoSupabase() {
  const { data, error } =
    await supabaseClient
      .from("pedidos")
      .select("numero")
      .order("numero", { ascending: false })
      .limit(1);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return 0;
  }

  return Number(data[0].numero) || 0;
}

async function obtenerIdsItemsPedidoSupabase(pedidoIdSupabase) {
  const { data, error } =
    await supabaseClient
      .from("pedido_items")
      .select("id")
      .eq("pedido_id", pedidoIdSupabase);

  if (error) {
    throw error;
  }

  return (data || [])
    .map(function (itemPedido) {
      return itemPedido.id;
    })
    .filter(Boolean);
}

async function borrarItemsPedidoPorIdsSupabase(idsItemsPedido) {
  if (!Array.isArray(idsItemsPedido) || idsItemsPedido.length === 0) {
    return;
  }

  const { error } =
    await supabaseClient
      .from("pedido_items")
      .delete()
      .in("id", idsItemsPedido);

  if (error) {
    throw error;
  }
}

// --- Operaciones atomicas (ver supabase/sql/operaciones-atomicas.sql) --------
// Estas llamadas resuelven todo el cambio dentro de una transaccion de
// Postgres, con la fila bloqueada. Son las que permiten que varias personas
// operen a la vez desde computadoras y celulares sin pisarse.

async function reemplazarItemsPedidoSupabase(pedidoIdSupabase, items) {
  const { data, error } =
    await supabaseClient.rpc("reemplazar_items_pedido", {
      pedido_id_param: pedidoIdSupabase,
      items: items
    });

  if (error) {
    throw error;
  }

  return Number(data) || 0;
}

async function atenderPedidoAtomicoSupabase(pedidoIdSupabase) {
  const { data, error } =
    await supabaseClient.rpc("atender_pedido_atomico", {
      pedido_id_param: pedidoIdSupabase
    });

  if (error) {
    throw error;
  }

  // [{ producto_codigo, stock_nuevo }] con el stock real que quedo.
  return (data || []).map(function (fila) {
    return {
      codigo: Number(fila.producto_codigo) || 0,
      stock: Number(fila.stock_nuevo) || 0
    };
  });
}

async function entregarPedidoAtomicoSupabase(pedidoIdSupabase, importePagado) {
  const { data, error } =
    await supabaseClient.rpc("entregar_pedido_atomico", {
      pedido_id_param: pedidoIdSupabase,
      importe_pagado: Number(importePagado) || 0
    });

  if (error) {
    throw error;
  }

  const fila =
    Array.isArray(data) && data.length > 0 ? data[0] : null;

  if (!fila) {
    throw new Error("Supabase no devolvio el resultado de la entrega.");
  }

  return {
    saldoCliente: Number(fila.saldo_cliente) || 0,
    saldoGenerado: Number(fila.saldo_generado) || 0,
    estadoCobro: fila.estado_cobro || "COBRADO",
    fechaEntrega: fila.fecha_entrega || null
  };
}

async function registrarMovimientoCuentaAtomicoSupabase(datos) {
  const { data, error } =
    await supabaseClient.rpc("registrar_movimiento_cuenta_atomico", {
      cliente_id_param: datos.clienteIdSupabase,
      delta_saldo: Number(datos.deltaSaldo) || 0,
      medio_pago_param: datos.medioPago || "",
      observacion_param: datos.observacion || "Movimiento de cuenta",
      codigo_pago_param: Number(datos.codigoPago) || null,
      pedido_id_param: datos.pedidoIdSupabase || null
    });

  if (error) {
    throw error;
  }

  const fila =
    Array.isArray(data) && data.length > 0 ? data[0] : null;

  return {
    saldoCliente: fila ? Number(fila.saldo_cliente) || 0 : 0,
    yaEstaba: Boolean(fila && fila.ya_estaba)
  };
}

// Historial completo de un producto, leido de la tabla movimientos_stock en
// lugar del array que viaja dentro de la fila del producto.
async function obtenerMovimientosStockProductoSupabase(productoIdSupabase, limite) {
  const { data, error } =
    await supabaseClient.rpc("obtener_movimientos_stock_producto", {
      producto_id_param: productoIdSupabase,
      limite: Number(limite) || 500
    });

  if (error) {
    throw error;
  }

  return (data || []).map(function (fila) {
    const fecha =
      fila.fecha ? new Date(fila.fecha) : null;

    return {
      fechaIso: fila.fecha || "",
      fecha: fecha ? fecha.toLocaleDateString("es-AR") : "-",
      hora: fecha
        ? fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
        : "",
      tipo: fila.tipo || "Movimiento",
      motivo: fila.referencia || "",
      referencia: fila.referencia || "",
      cantidad: Number(fila.cantidad) || 0,
      stockFinal: Number(fila.stock_final) || 0
    };
  });
}

async function registrarMovimientoStockAtomicoSupabase(productoIdSupabase, deltaCantidad, tipo, referencia) {
  const { data, error } =
    await supabaseClient.rpc("registrar_movimiento_stock_atomico", {
      producto_id_param: productoIdSupabase,
      delta_cantidad: Number(deltaCantidad) || 0,
      tipo_param: tipo || "Ajuste",
      referencia_param: referencia || ""
    });

  if (error) {
    throw error;
  }

  return Number(data) || 0;
}

// ---------------------------------------------------------------------------

async function guardarItemsPedidoSupabase(pedido, pedidoIdSupabase) {
  const itemsSupabase =
    Array.isArray(pedido.items)
      ? pedido.items.map(function (item) {
        return mapearPedidoItemParaSupabase(item, pedidoIdSupabase);
      })
      : [];

  // Un solo RPC que borra e inserta en la misma transaccion. Antes se
  // insertaban los nuevos y despues se borraban los viejos con dos llamadas
  // sueltas: si la segunda fallaba, el pedido quedaba con los items
  // duplicados y el total dejaba de coincidir con el detalle.
  try {
    await reemplazarItemsPedidoSupabase(pedidoIdSupabase, itemsSupabase);

    const { data: itemsGuardados, error: errorLectura } =
      await supabaseClient
        .from("pedido_items")
        .select()
        .eq("pedido_id", pedidoIdSupabase);

    if (errorLectura) {
      throw errorLectura;
    }

    return itemsGuardados || [];
  } catch (errorRpc) {
    // Si todavia no se corrio operaciones-atomicas.sql, se usa el camino
    // viejo para no dejar el sistema sin poder guardar pedidos.
    if (!esErrorFuncionSupabaseFaltante(errorRpc)) {
      throw errorRpc;
    }

    console.warn(
      "Falta desplegar reemplazar_items_pedido en Supabase. " +
      "Se guardan los items con el metodo anterior.",
      errorRpc
    );
  }

  const idsItemsViejos =
    await obtenerIdsItemsPedidoSupabase(pedidoIdSupabase);

  if (itemsSupabase.length === 0) {
    await borrarItemsPedidoPorIdsSupabase(idsItemsViejos);
    return [];
  }

  const { data, error } =
    await supabaseClient
      .from("pedido_items")
      .insert(itemsSupabase)
      .select();

  if (error) {
    throw error;
  }

  await borrarItemsPedidoPorIdsSupabase(idsItemsViejos);

  return data || [];
}

// Alta de pedido con el numero asignado por Postgres.
//
// El numero lo calculaba el navegador con max(pedidos en memoria) + 1, asi que
// dos vendedores guardando a la vez llegaban al mismo numero y el segundo
// chocaba contra el unique de pedidos.numero: se le caia el pedido con un error
// de base de datos. Ahora el numero se toma adentro de la transaccion, con lock
// y reintento (ver supabase/sql/numeracion-pedidos.sql).
async function insertarPedidoNumeradoSupabase(pedidoSupabase) {
  const { data, error } =
    await supabaseClient.rpc("crear_pedido_numerado", {
      pedido: pedidoSupabase
    });

  if (error) {
    throw error;
  }

  const fila =
    Array.isArray(data) && data.length > 0 ? data[0] : null;

  if (!fila) {
    throw new Error("Supabase no devolvio el numero del pedido.");
  }

  const { data: pedidoGuardado, error: errorLectura } =
    await supabaseClient
      .from("pedidos")
      .select()
      .eq("id", fila.id)
      .single();

  if (errorLectura) {
    throw errorLectura;
  }

  return pedidoGuardado;
}

async function guardarPedidoSupabase(pedido) {
  const pedidoSupabase =
    mapearPedidoParaSupabase(pedido);

  let data = null;

  if (pedido.idSupabase) {
    const { data: pedidoActualizado, error } =
      await supabaseClient
        .from("pedidos")
        .update(pedidoSupabase)
        .eq("id", pedido.idSupabase)
        .select()
        .single();

    if (error) {
      throw error;
    }

    data = pedidoActualizado;
  } else {
    try {
      data = await insertarPedidoNumeradoSupabase(pedidoSupabase);
    } catch (errorRpc) {
      // Si todavia no se desplego numeracion-pedidos.sql, se usa el alta
      // anterior para no dejar el sistema sin poder guardar pedidos.
      if (!esErrorFuncionSupabaseFaltante(errorRpc)) {
        throw errorRpc;
      }

      console.warn(
        "Falta desplegar crear_pedido_numerado en Supabase. " +
        "Se guarda el pedido con el numero calculado en el navegador.",
        errorRpc
      );

      const { data: pedidoInsertado, error } =
        await supabaseClient
          .from("pedidos")
          .insert(pedidoSupabase)
          .select()
          .single();

      if (error) {
        throw error;
      }

      data = pedidoInsertado;
    }
  }

  await guardarItemsPedidoSupabase(pedido, data.id);

  return data ? mapearPedidoDesdeSupabase(data) : null;
}

async function obtenerPagosClienteSupabase() {
  const pagosSupabase =
    await consultarTablaSupabase("pagos_cliente", "fecha");

  return pagosSupabase
    .map(mapearPagoDesdeSupabase)
    .filter(Boolean);
}

async function guardarMovimientoCuentaSupabase(cliente, movimiento) {
  const movimientoSupabase =
    mapearMovimientoCuentaParaSupabase(cliente, movimiento);

  if (!movimientoSupabase.cliente_id) {
    throw new Error("El cliente no tiene idSupabase para guardar el movimiento de cuenta.");
  }

  if (movimientoSupabase.codigo_pago) {
    const { data: movimientoPorCodigo, error: errorCodigo } =
      await supabaseClient
        .from("pagos_cliente")
        .select("*")
        .eq("cliente_id", movimientoSupabase.cliente_id)
        .eq("codigo_pago", movimientoSupabase.codigo_pago)
        .maybeSingle();

    if (errorCodigo) {
      throw errorCodigo;
    }

    if (movimientoPorCodigo) {
      const { data, error } =
        await supabaseClient
          .from("pagos_cliente")
          .update(movimientoSupabase)
          .eq("id", movimientoPorCodigo.id)
          .select()
          .single();

      if (error) {
        throw error;
      }

      return data ? mapearPagoDesdeSupabase(data) : null;
    }
  }

  const { data: movimientoExistente, error: errorBusqueda } =
    await supabaseClient
      .from("pagos_cliente")
      .select("*")
      .eq("cliente_id", movimientoSupabase.cliente_id)
      .eq("importe", movimientoSupabase.importe)
      .eq("medio_pago", movimientoSupabase.medio_pago)
      .eq("observacion", movimientoSupabase.observacion)
      .eq("fecha", movimientoSupabase.fecha)
      .maybeSingle();

  if (errorBusqueda) {
    throw errorBusqueda;
  }

  if (movimientoExistente) {
    return movimientoExistente
      ? mapearPagoDesdeSupabase(movimientoExistente)
      : null;
  }

  const { data, error } =
    await supabaseClient
      .from("pagos_cliente")
      .insert(movimientoSupabase)
      .select()
      .single();

  if (error) {
    throw error;
  }

  return data ? mapearPagoDesdeSupabase(data) : null;
}

async function actualizarPagoClienteSupabase(pago) {
  if (!pago || !pago.idSupabase) {
    throw new Error("El pago no tiene idSupabase para actualizar.");
  }

  const { data, error } =
    await supabaseClient
      .from("pagos_cliente")
      .update({
        medio_pago: pago.medioPago || "PAGO_CLIENTE",
        observacion: pago.observacion || ""
      })
      .eq("id", pago.idSupabase)
      .select()
      .single();

  if (error) {
    throw error;
  }

  return data ? mapearPagoDesdeSupabase(data) : null;
}

async function obtenerAuditoriaSupabase() {
  const auditoriaSupabase =
    await consultarTablaSupabase("auditoria", "fecha", {
      ascendente: false,
      limite: 500
    });

  return auditoriaSupabase
    .map(mapearAuditoriaDesdeSupabase)
    .filter(Boolean);
}

async function guardarAuditoriaSupabase(registro) {
  const registroSupabase =
    mapearAuditoriaParaSupabase(registro);

  const { data, error } =
    await supabaseClient
      .from("auditoria")
      .insert(registroSupabase)
      .select()
      .single();

  if (error) {
    throw error;
  }

  return data ? mapearAuditoriaDesdeSupabase(data) : null;
}

async function obtenerRolesSupabase() {
  const rolesSupabase =
    await consultarTablaSupabase("roles", "nombre");

  return rolesSupabase
    .map(mapearRolDesdeSupabase)
    .filter(Boolean);
}

async function guardarRolSupabase(nombreRol, permisos) {
  const rolSupabase =
    mapearRolParaSupabase(nombreRol, permisos);

  const { data, error } =
    await supabaseClient
      .from("roles")
      .upsert(rolSupabase, { onConflict: "nombre" })
      .select()
      .single();

  if (error) {
    throw error;
  }

  return data ? mapearRolDesdeSupabase(data) : null;
}

async function eliminarRolSupabase(nombreRol) {
  if (!nombreRol) {
    return;
  }

  const { error } =
    await supabaseClient
      .from("roles")
      .delete()
      .eq("nombre", nombreRol);

  if (error) {
    throw error;
  }
}

async function obtenerUsuariosSupabase() {
  const usuariosSupabase =
    await consultarTablaSupabase("usuarios", "codigo", {
      seleccion: "*, roles(nombre)"
    });

  return usuariosSupabase
    .map(mapearUsuarioDesdeSupabase)
    .filter(Boolean);
}

async function obtenerUsuarioSistemaPorEmailSupabase(email) {
  if (!email) {
    return null;
  }

  const { data, error } =
    await supabaseClient
      .from("usuarios")
      .select("*, roles(nombre)")
      .eq("email", email)
      .eq("activo", true)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapearUsuarioDesdeSupabase(data) : null;
}

async function obtenerRolIdSupabase(nombreRol) {
  const nombreRolNormalizado =
    typeof normalizarNombreRolSupabase === "function"
      ? normalizarNombreRolSupabase(nombreRol)
      : String(nombreRol || "").trim().toUpperCase();

  const { data, error } =
    await supabaseClient
      .from("roles")
      .select("id, nombre");

  if (error) {
    throw error;
  }

  const rolEncontrado =
    (data || []).find(function (rol) {
      const nombreGuardado =
        typeof normalizarNombreRolSupabase === "function"
          ? normalizarNombreRolSupabase(rol.nombre)
          : String(rol.nombre || "").trim().toUpperCase();

      return nombreGuardado === nombreRolNormalizado;
    });

  return rolEncontrado ? rolEncontrado.id : null;
}

async function guardarUsuarioSupabase(usuario) {
  const rolIdSupabase =
    await obtenerRolIdSupabase(usuario.rol);
  const usuarioSupabase =
    mapearUsuarioParaSupabase(usuario, rolIdSupabase);
  let idUsuarioSupabase =
    usuario.idSupabase || null;

  if (!idUsuarioSupabase && usuario.email) {
    const { data: usuarioExistente, error: errorUsuarioExistente } =
      await supabaseClient
        .from("usuarios")
        .select("id")
        .eq("email", usuario.email)
        .order("codigo", { ascending: true })
        .limit(1)
        .maybeSingle();

    if (errorUsuarioExistente) {
      throw errorUsuarioExistente;
    }

    if (usuarioExistente) {
      idUsuarioSupabase = usuarioExistente.id;
      usuario.idSupabase = usuarioExistente.id;
    }
  }

  const consulta =
    idUsuarioSupabase
      ? supabaseClient.from("usuarios").update(usuarioSupabase).eq("id", idUsuarioSupabase)
      : supabaseClient.from("usuarios").upsert(usuarioSupabase, { onConflict: "codigo" });

  const { data, error } =
    await consulta.select("*, roles(nombre)").single();

  if (error) {
    throw error;
  }

  return data ? mapearUsuarioDesdeSupabase(data) : null;
}

async function eliminarUsuarioSupabase(usuario) {
  if (!usuario) {
    return;
  }

  const consulta =
    usuario.idSupabase
      ? supabaseClient.from("usuarios").delete().eq("id", usuario.idSupabase)
      : supabaseClient.from("usuarios").delete().eq("codigo", usuario.codigo);

  const { error } =
    await consulta;

  if (error) {
    throw error;
  }
}

async function obtenerConfiguracionEmpresaSupabase() {
  const { data, error } =
    await supabaseClient
      .from("configuracion_empresa")
      .select("*")
      .order("actualizado_en", { ascending: false })
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapearConfiguracionDesdeSupabase(data) : null;
}

async function guardarConfiguracionEmpresaSupabase(configuracion) {
  const configuracionSupabase =
    mapearConfiguracionParaSupabase(configuracion);
  configuracionSupabase.actualizado_en = new Date().toISOString();

  const consulta =
    configuracion.idSupabase
      ? supabaseClient.from("configuracion_empresa").update(configuracionSupabase).eq("id", configuracion.idSupabase)
      : supabaseClient.from("configuracion_empresa").insert(configuracionSupabase);

  const { data, error } =
    await consulta.select().single();

  if (error) {
    throw error;
  }

  return data ? mapearConfiguracionDesdeSupabase(data) : null;
}

async function guardarEntidadPorCodigoSupabase(nombreTabla, entidad, mapper) {
  const entidadSupabase =
    mapper(entidad);

  const consulta =
    entidad.idSupabase
      ? supabaseClient.from(nombreTabla).update(entidadSupabase).eq("id", entidad.idSupabase)
      : supabaseClient.from(nombreTabla).upsert(entidadSupabase, { onConflict: "codigo" });

  const { data, error } =
    await consulta.select().single();

  if (error) {
    throw error;
  }

  return data;
}

async function obtenerZonasSupabase() {
  const zonasSupabase =
    await consultarTablaSupabase("zonas", "codigo");

  return zonasSupabase
    .map(mapearEntidadBaseDesdeSupabase)
    .filter(Boolean);
}

async function guardarZonaSupabase(zona) {
  const data =
    await guardarEntidadPorCodigoSupabase("zonas", zona, mapearZonaParaSupabase);

  return data ? mapearEntidadBaseDesdeSupabase(data) : null;
}

async function eliminarZonaSupabase(zona) {
  if (!zona) {
    return;
  }

  const consulta =
    zona.idSupabase
      ? supabaseClient.from("zonas").delete().eq("id", zona.idSupabase)
      : supabaseClient.from("zonas").delete().eq("codigo", zona.codigo);

  const { error } =
    await consulta;

  if (error) {
    throw error;
  }
}

async function obtenerRubrosSupabase() {
  const rubrosSupabase =
    await consultarTablaSupabase("rubros", "codigo");

  return rubrosSupabase
    .map(mapearEntidadBaseDesdeSupabase)
    .filter(Boolean);
}

async function guardarRubroSupabase(rubro) {
  const data =
    await guardarEntidadPorCodigoSupabase("rubros", rubro, mapearRubroParaSupabase);

  return data ? mapearEntidadBaseDesdeSupabase(data) : null;
}

async function eliminarRubroSupabase(rubro) {
  if (!rubro) {
    return;
  }

  const consulta =
    rubro.idSupabase
      ? supabaseClient.from("rubros").delete().eq("id", rubro.idSupabase)
      : supabaseClient.from("rubros").delete().eq("codigo", rubro.codigo);

  const { error } =
    await consulta;

  if (error) {
    throw error;
  }
}

async function obtenerProveedoresSupabase() {
  const proveedoresSupabase =
    await consultarTablaSupabase("proveedores", "codigo");

  return proveedoresSupabase
    .map(mapearEntidadBaseDesdeSupabase)
    .filter(Boolean);
}

async function guardarProveedorSupabase(proveedor) {
  const data =
    await guardarEntidadPorCodigoSupabase("proveedores", proveedor, mapearProveedorParaSupabase);

  return data ? mapearEntidadBaseDesdeSupabase(data) : null;
}

async function eliminarProveedorSupabase(proveedor) {
  if (!proveedor) {
    return;
  }

  const consulta =
    proveedor.idSupabase
      ? supabaseClient.from("proveedores").delete().eq("id", proveedor.idSupabase)
      : supabaseClient.from("proveedores").delete().eq("codigo", proveedor.codigo);

  const { error } =
    await consulta;

  if (error) {
    throw error;
  }
}

async function obtenerVendedoresSupabase() {
  const vendedoresSupabase =
    await consultarTablaSupabase("vendedores", "codigo");

  return vendedoresSupabase
    .map(mapearVendedorDesdeSupabase)
    .filter(Boolean);
}

async function guardarVendedorSupabase(vendedor) {
  const data =
    await guardarEntidadPorCodigoSupabase("vendedores", vendedor, mapearVendedorParaSupabase);

  return data ? mapearVendedorDesdeSupabase(data) : null;
}

async function eliminarVendedorSupabase(vendedor) {
  if (!vendedor) {
    return;
  }

  const consulta =
    vendedor.idSupabase
      ? supabaseClient.from("vendedores").delete().eq("id", vendedor.idSupabase)
      : supabaseClient.from("vendedores").delete().eq("codigo", vendedor.codigo);

  const { error } =
    await consulta;

  if (error) {
    throw error;
  }
}

async function obtenerListasPreciosSupabase() {
  const listasSupabase =
    await consultarTablaSupabase("listas_precios", "codigo");

  return listasSupabase
    .map(mapearListaPrecioDesdeSupabase)
    .filter(Boolean);
}

async function guardarListaPrecioSupabase(lista) {
  const data =
    await guardarEntidadPorCodigoSupabase("listas_precios", lista, mapearListaPrecioParaSupabase);

  return data ? mapearListaPrecioDesdeSupabase(data) : null;
}

async function obtenerProveedorPagosSupabase() {
  const pagosSupabase =
    await consultarTablaSupabase("proveedor_pagos", "fecha");

  return pagosSupabase
    .map(mapearProveedorPagoDesdeSupabase)
    .filter(Boolean)
    .sort(function (primero, segundo) {
      return new Date(segundo.fechaIso) - new Date(primero.fechaIso);
    });
}

async function guardarProveedorPagoSupabase(pago) {
  const data =
    await guardarEntidadPorCodigoSupabase("proveedor_pagos", pago, mapearProveedorPagoParaSupabase);

  return data ? mapearProveedorPagoDesdeSupabase(data) : null;
}

async function obtenerComprasSupabase() {
  const comprasSupabase =
    await consultarTablaSupabase("compras", "fecha");

  return comprasSupabase
    .map(mapearCompraDesdeSupabase)
    .filter(Boolean)
    .sort(function (primero, segundo) {
      return new Date(segundo.fechaIso) - new Date(primero.fechaIso);
    });
}

async function guardarCompraSupabase(compra) {
  const data =
    await guardarEntidadPorCodigoSupabase("compras", compra, mapearCompraParaSupabase);

  return data ? mapearCompraDesdeSupabase(data) : null;
}
