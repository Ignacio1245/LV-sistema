// Prueba del codigo real en VM, sin red, ventanas ni base de datos.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root,"js/public/catalogo-whatsapp.js"),"utf8")
  .replace("const catalogoInicializacion = iniciarCatalogoWhatsapp();", "");
let checks=0;
function create(storage=new Map(), seed=true) {
  const elements=new Map();
  const element=id=>{
    if (!elements.has(id)) elements.set(id,{
      value:"",textContent:"",dataset:{},hidden:false,disabled:false,inert:false,
      classList:{add(){},remove(){},contains(){return false;},toggle(){}},
      addEventListener(){},setAttribute(){},removeAttribute(){},focus(){},
      appendChild(){},querySelectorAll(){return [];}
    });
    return elements.get(id);
  };
  const calls=[];
  const ctx=vm.createContext({
    URLSearchParams,crypto,console:{warn(){}},setTimeout(){return 1;},clearTimeout(){},
    window:{location:{search:""},addEventListener(){},open(){throw Error("No abrir ventanas automaticas");},
      setTimeout(){return 1;},clearTimeout(){}},
    document:{getElementById:element,addEventListener(){},createElement:element,hidden:false},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    navigator:{},alert(){},productos:[],supabaseEstaConfigurado:()=>true,
    obtenerConfiguracionCatalogoPublicoSupabase:async()=>({whatsapp:"5491112345678"}),
    productoEsPeso:p=>p.tipoStock==="peso",
    crearPedidoCatalogoPublicoSupabase:async p=>{calls.push(JSON.parse(JSON.stringify(p)));return {numero:123,total:200,cliente_codigo:15};},
    obtenerProductosCatalogoPublicoSupabase:async()=>[{codigo:1,nombre:"Unidad",stock:5,precio:100,activo:true,mostrarCatalogo:true}]
  });
  vm.runInContext(source,ctx);
  const run=s=>vm.runInContext(s,ctx);
  run(`
    renderizarProductosCatalogo=function(){};
    renderizarCarritoCatalogo=function(){};
    renderizarFiltrosRubrosCatalogo=function(){};
    abrirCarritoCatalogo=function(){};
    productosCatalogo=[{codigo:1,nombre:"Unidad",stock:5,precio:100,activo:true,mostrarCatalogo:true}];
    restaurarDatosClienteCatalogo();
    catalogoDom.nombreCliente.value="Cliente prueba";
    catalogoDom.direccionCliente.value="Direccion 123";
    catalogoDom.telefonoCliente.value="11 1234-5678";
    catalogoDom.telefonoDestino.value="5491112345678";
  `);
  if (seed) run("agregarProductoAlCarrito(productosCatalogo[0],2)");
  return {ctx,run,calls,storage,send:()=>run("enviarPedidoPorWhatsapp({preventDefault(){}})")};
}
(async()=>{
  const p=create();
  p.storage.set("lv_catalogo_telefono_destino", "5491199999999");
  p.ctx.window.location.search = "?wsp=5491199999999";
  assert.equal(await p.run("cargarConfiguracionPublicaCatalogo()"), "5491112345678"); checks++;
  assert.equal(p.run("crearDatosPedidoCatalogoParaAdmin().cliente.telefono"),"1112345678");
  assert.equal(p.run("crearDatosPedidoCatalogoParaAdmin().items[0].precio_unitario"),100); checks++;
  await p.send();
  assert.equal(p.calls.length,1);
  assert.equal(p.run("carritoCatalogo.length"),0);
  assert.equal(p.run("leerEnvioCatalogo().estado"),"confirmado");
  assert.equal(p.run("catalogoDom.resultadoWhatsapp.hidden"),false); checks++;
  await p.send(); assert.equal(p.calls.length,1); checks++;
  p.run("agregarProductoAlCarrito(productosCatalogo[0],2)");
  await p.send();
  assert.equal(p.calls.length,2);
  assert.notEqual(p.calls[0].solicitud_id,p.calls[1].solicitud_id); checks++;

  const q=create();
  q.ctx.crearPedidoCatalogoPublicoSupabase=async payload=>{
    q.calls.push(JSON.parse(JSON.stringify(payload)));throw new TypeError("Failed to fetch");
  };
  await q.send();
  assert.equal(q.run("pedidoCatalogoConfirmado"),false);
  assert.equal(q.run("leerPedidosPendientesCatalogo().length"),0);
  assert.equal(q.run("catalogoDom.nombreCliente.disabled"),true);
  assert.equal(q.run("catalogoDom.resultadoWhatsapp.hidden"),true);
  const attempt=q.run("JSON.stringify(leerEnvioCatalogo().pedido)"); checks++;
  const reloaded=create(q.storage, false);
  reloaded.run("restaurarDatosClienteCatalogo(); restaurarCarritoCatalogo(); restaurarEnvioCatalogo()");
  await reloaded.send();
  assert.equal(JSON.stringify(reloaded.calls[0]),attempt);
  assert.equal(reloaded.run("leerEnvioCatalogo().estado"),"confirmado"); checks++;
  // Ventana perdida justo despues de que el servidor confirmo, antes de vaciar el borrador.
  const crash=create();
  crash.run(`guardarBorradorCatalogo(); guardarEnvioCatalogo({
    estado:"confirmado",firma:crearFirmaPedidoCatalogo(),
    pedido:{solicitud_id:crypto.randomUUID()},resultado:{numero:77,total:200},enlace:"https://wa.me/5491112345678"
  });`);
  const recovered=create(crash.storage, false);
  recovered.run("restaurarDatosClienteCatalogo(); restaurarCarritoCatalogo(); restaurarEnvioCatalogo()");
  await recovered.send();
  assert.equal(recovered.calls.length,0); checks++;

  const reject=create();
  reject.ctx.crearPedidoCatalogoPublicoSupabase=async()=>{throw {code:"P0001",message:"Stock insuficiente"};};
  await reject.send();
  assert.equal(reject.run("leerEnvioCatalogo()"),null);
  assert.equal(reject.run("pedidoCatalogoConfirmado"),false);
  assert.equal(reject.run("catalogoDom.nombreCliente.disabled"),false);
  assert.ok(reject.run("catalogoDom.resultadoTexto.textContent").includes("Stock insuficiente")); checks++;
  const noStorage=create();
  noStorage.ctx.localStorage.setItem=()=>{throw Error("QuotaExceeded");};
  await noStorage.send(); assert.equal(noStorage.calls.length,0); checks++;
  const invalid=create();
  const sinWhatsapp=create();
  sinWhatsapp.ctx.obtenerConfiguracionCatalogoPublicoSupabase=async()=>({whatsapp:""});
  await sinWhatsapp.send();
  assert.equal(sinWhatsapp.calls.length,1);
  assert.equal(sinWhatsapp.run("leerEnvioCatalogo().estado"),"confirmado");
  assert.equal(sinWhatsapp.run("catalogoDom.resultadoWhatsapp.hidden"),true); checks++;
  invalid.run('catalogoDom.telefonoCliente.value="123"');
  await invalid.send(); assert.equal(invalid.calls.length,0); checks++;
  const empty=create();
  empty.run("carritoCatalogo=[]"); await empty.send(); assert.equal(empty.calls.length,0); checks++;
  const offline=create();
  offline.ctx.obtenerProductosCatalogoPublicoSupabase=async()=>{throw Error("offline");};
  await assert.rejects(()=>offline.run("cargarProductosCatalogo()"),/offline/);
  assert.ok(offline.run("catalogoDom.estadoConexion.textContent").includes("No se pudo")); checks++;
  const legacy=create();
  legacy.storage.set("lv_catalogo_pedidos_pendientes",JSON.stringify([{firma:"old",pedido:{items:[{codigo:1,cantidad:1}]}}]));
  await legacy.run("sincronizarPedidosPendientesCatalogo()");
  assert.equal(legacy.calls.length,0);
  assert.equal(legacy.run("leerPedidosPendientesCatalogo().length"),1); checks++;
  assert.equal(p.run("obtenerCantidadMaximaProducto({stock:0})"),0);
  assert.equal(p.run("obtenerCantidadMaximaProducto({stock:.125,tipoStock:'peso'})"),.125);
  assert.equal(p.run("obtenerCantidadMaximaProducto({stock:17,tipoStock:'bultos',unidadesPorBulto:6,ventaSoloBulto:true})"),12);
  assert.equal(p.run("obtenerIncrementoCantidadCatalogo({tipoStock:'bultos',unidadesPorBulto:6,ventaSoloBulto:true})"),6); checks++;
  assert.equal(p.run("filtrarProductosVisiblesCatalogo([{activo:true,mostrarCatalogo:false},{activo:false,mostrarCatalogo:true},{activo:true,mostrarCatalogo:true}]).length"),1); checks++;
  const pending=create();
  let finish;
  pending.ctx.crearPedidoCatalogoPublicoSupabase=p=>new Promise(resolve=>{finish=()=>resolve({numero:123,total:200});pending.calls.push(p);});
  const promise=pending.send();
  await pending.send(); await new Promise(setImmediate); assert.equal(pending.calls.length,1);
  finish(); await promise; checks++;
  vm.runInContext(fs.readFileSync(path.join(root,"js/database/supabase-mappers.js"),"utf8"),p.ctx);
  assert.equal(p.run("mapearConfiguracionDesdeSupabase({stock_minimo:0}).stockMinimo"),0);
  assert.equal(p.run("mapearConfiguracionDesdeSupabase({}).stockMinimo"),10); checks++;
  vm.runInContext(fs.readFileSync(path.join(root,"js/database/supabase-repository.js"),"utf8"),p.ctx);
  p.ctx.supabaseClient={rpc:async()=>({data:[{codigo:1,stock:7,precios_lista:{__stockConfig:{tipoStock:"bultos",unidadesPorBulto:6,stockBultos:9,stockUnidades:1}}}],error:null})};
  const mapped=await p.run("obtenerProductosCatalogoPublicoSupabase()");
  assert.equal(mapped[0].stockBultos,1); assert.equal(mapped[0].stockUnidades,1); checks++;
  console.log("Catalogo frontend: "+checks+" grupos de pruebas OK, sin red ni pedidos reales.");
})().catch(error=>{console.error(error);process.exitCode=1;});
