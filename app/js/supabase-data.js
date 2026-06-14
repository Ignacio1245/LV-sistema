let sincronizacionAutomaticaHabilitada = false;
let sincronizacionAutomaticaPausada = false;
const temporizadoresSincronizacion = {};

function pausarSincronizacionAutomatica(accion) {
  sincronizacionAutomaticaPausada = true;

  return Promise.resolve()
    .then(accion)
    .finally(function () {
      sincronizacionAutomaticaPausada = false;
    });
}

function programarSincronizacionAutomatica(tipo) {
  if (!sincronizacionAutomaticaHabilitada || sincronizacionAutomaticaPausada) {
    return;
  }

  clearTimeout(temporizadoresSincronizacion[tipo]);

  temporizadoresSincronizacion[tipo] = setTimeout(function () {
    ejecutarSincronizacionAutomatica(tipo);
  }, 700);
}

async function ejecutarSincronizacionAutomatica(tipo) {
  try {
    await pausarSincronizacionAutomatica(async function () {
      if (tipo === "datosBase") {
        await sincronizarDatosBaseLocalesConSupabase();
      }

      if (tipo === "clientes") {
        await sincronizarClientesLocalesConSupabase();
        await sincronizarCuentaCorrienteLocalConSupabase();
      }

      if (tipo === "productos") {
        await sincronizarProductosLocalesConSupabase();
      }

      if (tipo === "pedidos") {
        await sincronizarPedidosLocalesConSupabase();
      }

      if (tipo === "administracion") {
        await sincronizarAdministracionLocalConSupabase();
      }
    });
  } catch (error) {
    console.warn("No se pudo sincronizar automaticamente " + tipo + ":", error);
  }
}

function activarSincronizacionAutomaticaSupabase() {
  sincronizacionAutomaticaHabilitada = true;
}

async function cargarProductosDesdeSupabase() {
  try {
    productos =
      await obtenerProductosSupabase();
  } catch (error) {
    console.error("Error cargando productos desde Supabase:", error);
    alert("No se pudieron cargar productos desde Supabase.");
    return;
  }

  renderizarProductos();
  renderizarCatalogoProductosPedido();
  actualizarDashboard();
  actualizarStockTotal();
}

async function cargarClientesDesdeSupabase() {
  try {
    clientes =
      await obtenerClientesSupabase();
  } catch (error) {
    console.error("Error cargando clientes desde Supabase:", error);
    alert("No se pudieron cargar clientes desde Supabase.");
    return;
  }

  renderizarClientes();
  renderizarClientesConDeuda();
  actualizarDashboard();
}

async function sincronizarProductosLocalesConSupabase() {
  const productosSincronizados = [];

  for (const producto of productos) {
    const productoGuardado =
      await guardarProductoSupabase(producto);

    productosSincronizados.push({
      ...producto,
      idSupabase: productoGuardado.idSupabase
    });
  }

  productos = productosSincronizados;
  guardarProductos();
  renderizarProductos();
  renderizarCatalogoProductosPedido();
  actualizarDashboard();
  actualizarStockTotal();

  return productos.length;
}

async function sincronizarClientesLocalesConSupabase() {
  const clientesSincronizados = [];

  for (const cliente of clientes) {
    const clienteGuardado =
      await guardarClienteSupabase(cliente);

    clientesSincronizados.push({
      ...cliente,
      idSupabase: clienteGuardado.idSupabase
    });
  }

  clientes = clientesSincronizados;
  guardarClientes();
  renderizarClientes();
  renderizarClientesConDeuda();
  actualizarDashboard();

  return clientes.length;
}

async function cargarPedidosDesdeSupabase() {
  try {
    pedidos =
      await obtenerPedidosSupabase();
  } catch (error) {
    console.error("Error cargando pedidos desde Supabase:", error);
    alert("No se pudieron cargar pedidos desde Supabase.");
    return;
  }

  guardarPedidos();
  renderizarPedidos();
  actualizarMenuPedidos();
  actualizarDashboard();
}

async function sincronizarPedidosLocalesConSupabase() {
  const pedidosSincronizados = [];

  for (const pedido of pedidos) {
    const pedidoGuardado =
      await guardarPedidoSupabase(pedido);

    pedidosSincronizados.push({
      ...pedido,
      idSupabase: pedidoGuardado.idSupabase
    });
  }

  pedidos = pedidosSincronizados;
  guardarPedidos();
  renderizarPedidos();
  actualizarMenuPedidos();
  actualizarDashboard();

  return pedidos.length;
}

async function sincronizarCuentaCorrienteLocalConSupabase() {
  let movimientosSincronizados = 0;

  for (const cliente of clientes) {
    if (!cliente.idSupabase) {
      continue;
    }

    const historial =
      Array.isArray(cliente.historial) ? cliente.historial : [];

    for (const movimiento of historial) {
      await guardarMovimientoCuentaSupabase(cliente, movimiento);
      movimientosSincronizados += 1;
    }
  }

  return movimientosSincronizados;
}

async function cargarPagosClienteDesdeSupabase() {
  try {
    return await obtenerPagosClienteSupabase();
  } catch (error) {
    console.error("Error cargando pagos desde Supabase:", error);
    alert("No se pudieron cargar pagos desde Supabase.");
    return [];
  }
}

async function cargarAdministracionDesdeSupabase() {
  try {
    const rolesSupabase =
      await obtenerRolesSupabase();
    const usuariosSupabase =
      await obtenerUsuariosSupabase();
    const configuracionSupabase =
      await obtenerConfiguracionEmpresaSupabase();

    rolesSupabase.forEach(function (rol) {
      ROLES[rol.nombre] = rol.permisos || {};
    });

    if (usuariosSupabase.length > 0) {
      usuariosSistema = usuariosSupabase;
    }

    if (configuracionSupabase) {
      Object.assign(CONFIG, configuracionSupabase);
    }

    renderizarConfiguracion();
    renderizarUsuarioActual();
    renderizarUsuariosSistema();
    aplicarPermisosDeUsuario();
  } catch (error) {
    console.error("Error cargando administracion desde Supabase:", error);
    alert("No se pudo cargar administracion desde Supabase.");
  }
}

async function sincronizarAdministracionLocalConSupabase() {
  for (const nombreRol of Object.keys(ROLES)) {
    await guardarRolSupabase(nombreRol, ROLES[nombreRol]);
  }

  const usuariosSincronizados = [];

  for (const usuario of usuariosSistema) {
    const usuarioGuardado =
      await guardarUsuarioSupabase(usuario);

    usuariosSincronizados.push(usuarioGuardado);
  }

  const configuracionGuardada =
    await guardarConfiguracionEmpresaSupabase(CONFIG);

  usuariosSistema = usuariosSincronizados;
  Object.assign(CONFIG, configuracionGuardada);

  guardarUsuariosSistema();
  guardarConfiguracion();
  renderizarUsuarioActual();
  renderizarUsuariosSistema();
  renderizarConfiguracion();

  return {
    roles: Object.keys(ROLES).length,
    usuarios: usuariosSistema.length,
    configuracion: true
  };
}

async function cargarDatosBaseDesdeSupabase() {
  try {
    const [
      zonasSupabase,
      rubrosSupabase,
      proveedoresSupabase,
      listasSupabase
    ] = await Promise.all([
      obtenerZonasSupabase(),
      obtenerRubrosSupabase(),
      obtenerProveedoresSupabase(),
      obtenerListasPreciosSupabase()
    ]);

    zonas = zonasSupabase;
    rubros = rubrosSupabase;
    proveedores = proveedoresSupabase;
    listasPrecios = listasSupabase;

    guardarZonas();
    guardarRubros();
    guardarProveedores();
    guardarListasPrecios();
    renderizarZonas();
    renderizarRubros();
    renderizarProveedores();
    renderizarListasPrecios();
  } catch (error) {
    console.error("Error cargando datos base desde Supabase:", error);
    alert("No se pudieron cargar datos base desde Supabase.");
  }
}

async function sincronizarDatosBaseLocalesConSupabase() {
  const zonasSincronizadas = [];
  const rubrosSincronizados = [];
  const proveedoresSincronizados = [];
  const listasSincronizadas = [];

  for (const zona of zonas) {
    zonasSincronizadas.push(await guardarZonaSupabase(zona));
  }

  for (const rubro of rubros) {
    rubrosSincronizados.push(await guardarRubroSupabase(rubro));
  }

  for (const proveedor of proveedores) {
    proveedoresSincronizados.push(await guardarProveedorSupabase(proveedor));
  }

  for (const lista of listasPrecios) {
    listasSincronizadas.push(await guardarListaPrecioSupabase(lista));
  }

  zonas = zonasSincronizadas;
  rubros = rubrosSincronizados;
  proveedores = proveedoresSincronizados;
  listasPrecios = listasSincronizadas;

  guardarZonas();
  guardarRubros();
  guardarProveedores();
  guardarListasPrecios();
  renderizarZonas();
  renderizarRubros();
  renderizarProveedores();
  renderizarListasPrecios();

  return {
    zonas: zonas.length,
    rubros: rubros.length,
    proveedores: proveedores.length,
    listasPrecios: listasPrecios.length
  };
}
