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

  return productosSupabase.map(mapearProductoDesdeSupabase);
}

async function obtenerClientesSupabase() {
  const clientesSupabase =
    await consultarTablaSupabase("clientes", "codigo");

  return clientesSupabase.map(mapearClienteDesdeSupabase);
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

  return mapearProductoDesdeSupabase(data);
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

  return mapearClienteDesdeSupabase(data);
}

async function obtenerPedidosSupabase() {
  const pedidosSupabase =
    await consultarTablaSupabase("pedidos", "numero");

  return pedidosSupabase.map(mapearPedidoDesdeSupabase);
}

async function guardarItemsPedidoSupabase(pedido, pedidoIdSupabase) {
  const { error: errorBorrado } =
    await supabaseClient
      .from("pedido_items")
      .delete()
      .eq("pedido_id", pedidoIdSupabase);

  if (errorBorrado) {
    throw errorBorrado;
  }

  if (!Array.isArray(pedido.items) || pedido.items.length === 0) {
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

  return data || [];
}

async function guardarPedidoSupabase(pedido) {
  const pedidoSupabase =
    mapearPedidoParaSupabase(pedido);

  const consulta =
    pedido.idSupabase
      ? supabaseClient.from("pedidos").update(pedidoSupabase).eq("id", pedido.idSupabase)
      : supabaseClient.from("pedidos").upsert(pedidoSupabase, { onConflict: "numero" });

  const { data, error } =
    await consulta.select().single();

  if (error) {
    throw error;
  }

  await guardarItemsPedidoSupabase(pedido, data.id);

  return mapearPedidoDesdeSupabase(data);
}

async function obtenerPagosClienteSupabase() {
  const pagosSupabase =
    await consultarTablaSupabase("pagos_cliente", "fecha");

  return pagosSupabase.map(mapearPagoDesdeSupabase);
}

async function guardarMovimientoCuentaSupabase(cliente, movimiento) {
  const movimientoSupabase =
    mapearMovimientoCuentaParaSupabase(cliente, movimiento);

  if (!movimientoSupabase.cliente_id) {
    throw new Error("El cliente no tiene idSupabase para guardar el movimiento de cuenta.");
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

  return mapearPagoDesdeSupabase(data);
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

  return (data || []).map(mapearAuditoriaDesdeSupabase);
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

  return mapearAuditoriaDesdeSupabase(data);
}

async function obtenerRolesSupabase() {
  const rolesSupabase =
    await consultarTablaSupabase("roles", "nombre");

  return rolesSupabase.map(mapearRolDesdeSupabase);
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

  return mapearRolDesdeSupabase(data);
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

  return (data || []).map(mapearUsuarioDesdeSupabase);
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

  const consulta =
    usuario.idSupabase
      ? supabaseClient.from("usuarios").update(usuarioSupabase).eq("id", usuario.idSupabase)
      : supabaseClient.from("usuarios").upsert(usuarioSupabase, { onConflict: "codigo" });

  const { data, error } =
    await consulta.select("*, roles(nombre)").single();

  if (error) {
    throw error;
  }

  return mapearUsuarioDesdeSupabase(data);
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

  return mapearConfiguracionDesdeSupabase(data);
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

  return zonasSupabase.map(mapearEntidadBaseDesdeSupabase);
}

async function guardarZonaSupabase(zona) {
  const data =
    await guardarEntidadPorCodigoSupabase("zonas", zona, mapearZonaParaSupabase);

  return mapearEntidadBaseDesdeSupabase(data);
}

async function obtenerRubrosSupabase() {
  const rubrosSupabase =
    await consultarTablaSupabase("rubros", "codigo");

  return rubrosSupabase.map(mapearEntidadBaseDesdeSupabase);
}

async function guardarRubroSupabase(rubro) {
  const data =
    await guardarEntidadPorCodigoSupabase("rubros", rubro, mapearRubroParaSupabase);

  return mapearEntidadBaseDesdeSupabase(data);
}

async function obtenerProveedoresSupabase() {
  const proveedoresSupabase =
    await consultarTablaSupabase("proveedores", "codigo");

  return proveedoresSupabase.map(mapearEntidadBaseDesdeSupabase);
}

async function guardarProveedorSupabase(proveedor) {
  const data =
    await guardarEntidadPorCodigoSupabase("proveedores", proveedor, mapearProveedorParaSupabase);

  return mapearEntidadBaseDesdeSupabase(data);
}

async function obtenerListasPreciosSupabase() {
  const listasSupabase =
    await consultarTablaSupabase("listas_precios", "codigo");

  return listasSupabase.map(mapearListaPrecioDesdeSupabase);
}

async function guardarListaPrecioSupabase(lista) {
  const data =
    await guardarEntidadPorCodigoSupabase("listas_precios", lista, mapearListaPrecioParaSupabase);

  return mapearListaPrecioDesdeSupabase(data);
}
