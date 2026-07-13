async function consultarTablaSupabase(nombreTabla, ordenCampo) {
  const consulta =
    supabaseClient
      .from(nombreTabla)
      .select("*");

  const { data, error } =
    ordenCampo
      ? await consulta.order(ordenCampo, { ascending: true })
      : await consulta;

  if (error) {
    throw error;
  }

  return data || [];
}

async function obtenerProductosSupabase() {
  const productosSupabase =
    await consultarTablaSupabase("productos", "codigo");

  return productosSupabase
    .map(mapearProductoDesdeSupabase)
    .filter(Boolean);
}

async function obtenerProductosCatalogoPublicoSupabase() {
  const { data, error } =
    await supabaseClient.rpc("obtener_catalogo_publico");

  if (error) {
    throw error;
  }

  return (data || [])
    .map(mapearProductoDesdeSupabase)
    .filter(Boolean);
}

async function crearPedidoCatalogoPublicoSupabase(pedidoCatalogo) {
  const { data, error } =
    await supabaseClient.rpc("crear_pedido_catalogo_publico", {
      pedido: pedidoCatalogo
    });

  if (error) {
    throw error;
  }

  return Array.isArray(data) && data.length > 0
    ? data[0]
    : null;
}

async function obtenerClientesSupabase() {
  const clientesSupabase =
    await consultarTablaSupabase("clientes", "codigo");

  return clientesSupabase
    .map(mapearClienteDesdeSupabase)
    .filter(Boolean);
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
  const { data, error } =
    await supabaseClient
      .from("pedidos")
      .select(`
        *,
        clientes(*),
        pedido_items(
          *,
          productos(*)
        )
      `)
      .order("numero", { ascending: true });

  if (error) {
    throw error;
  }

  const pedidosSupabase =
    data || [];

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

async function guardarItemsPedidoSupabase(pedido, pedidoIdSupabase) {
  const idsItemsViejos =
    await obtenerIdsItemsPedidoSupabase(pedidoIdSupabase);

  if (!Array.isArray(pedido.items) || pedido.items.length === 0) {
    await borrarItemsPedidoPorIdsSupabase(idsItemsViejos);
    return [];
  }

  const itemsSupabase =
    pedido.items.map(function (item) {
      return mapearPedidoItemParaSupabase(item, pedidoIdSupabase);
    });

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

async function guardarPedidoSupabase(pedido) {
  const pedidoSupabase =
    mapearPedidoParaSupabase(pedido);

  const consulta =
    pedido.idSupabase
      ? supabaseClient.from("pedidos").update(pedidoSupabase).eq("id", pedido.idSupabase)
      : supabaseClient.from("pedidos").insert(pedidoSupabase);

  const { data, error } =
    await consulta.select().single();

  if (error) {
    throw error;
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
  const { data, error } =
    await supabaseClient
      .from("auditoria")
      .select("*")
      .order("fecha", { ascending: false })
      .limit(500);

  if (error) {
    throw error;
  }

  return (data || [])
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
  const { data, error } =
    await supabaseClient
      .from("usuarios")
      .select("*, roles(nombre)")
      .order("codigo", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || [])
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
  const { data, error } =
    await supabaseClient
      .from("roles")
      .select("id")
      .eq("nombre", nombreRol)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? data.id : null;
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
