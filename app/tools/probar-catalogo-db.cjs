// Uso: node app/tools/probar-catalogo-db.cjs <ruta a node_modules de PGlite>
// PostgreSQL temporal EN MEMORIA. No lee credenciales ni se conecta a Supabase.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { PGlite } = require(path.join(process.argv[2], "@electric-sql/pglite"));
const root = path.resolve(__dirname, "../..");
let checks = 0;
(async () => {
  const db = new PGlite();
  try {
    await db.exec("create role anon; create role authenticated;");
    await db.exec(fs.readFileSync(path.join(root, "app/supabase/sql/schema-inicial.sql"), "utf8")
      .replace("create extension if not exists pgcrypto;", ""));
    const migration = fs.readFileSync(path.join(root, "supabase/migrations/20260904010000_catalogo_envios_seguros.sql"), "utf8");
    await db.exec(migration);
    await db.exec(migration); // Es repetible para instalaciones existentes.
    const bandeja = fs.readFileSync(path.join(root, "supabase/migrations/20260904020000_catalogo_bandeja_contacto.sql"), "utf8");
    await db.exec(bandeja);
    await db.exec(bandeja);
    await db.exec(`
      insert into configuracion_empresa(stock_minimo) values(0);
      insert into usuarios(codigo,nombre) values(7,'Vendedor prueba');
      insert into clientes(codigo,nombre,direccion,telefono,vendedor_asignado,vendedor_id,zona)
        values(15,'Kiosco El Sol','Av. San Martin 100','11 1234-5678','Vendedor prueba',(select id from usuarios where codigo=7),'Centro');
      insert into productos(codigo,nombre,precio_base,stock,stock_minimo,mostrar_catalogo,precios_lista) values
        (1,'Producto unidad',100,100,2,true,'{"Lista 1":100}'),
        (2,'Producto peso',10,10,0,true,'{"Lista 1":10,"__stockConfig":{"tipoStock":"peso"}}'),
        (3,'Producto bulto',20,24,0,true,'{"Lista 1":20,"__stockConfig":{"tipoStock":"bultos","unidadesPorBulto":6,"ventaSoloBulto":true}}'),
        (4,'Sin stock',10,0,0,true,'{}'),
        (5,'Privado',10,50,0,false,'{}');
    `);
    const pedido = changes => ({
      solicitud_id: randomUUID(),
      cliente: { nombre:"Cliente nuevo",direccion:"Calle 123",telefono:"1198765432",codigo:null },
      items:[{codigo:1,cantidad:2,precio_unitario:100}],
      comentario:"Prueba aislada", ...changes
    });
    const send = async p => (await db.query("select * from crear_pedido_catalogo_publico($1::jsonb)",[JSON.stringify(p)])).rows[0];
    const count = async table => Number((await db.query("select count(*) n from " + table)).rows[0].n);
    const reject = async (p, pattern) => {
      const before = await Promise.all(["pedidos","clientes","pedido_items","catalogo_solicitudes"].map(count));
      await assert.rejects(()=>send(p),pattern);
      assert.deepEqual(await Promise.all(["pedidos","clientes","pedido_items","catalogo_solicitudes"].map(count)),before);
      checks++;
    };
    const first = pedido();
    assert.equal(Number((await db.query(`select catalogo_precio_lista_uno('{"Lista 1":0}', 100) p`)).rows[0].p), 100);
    assert.equal(Number((await db.query(`select catalogo_precio_lista_uno('{"lista1":120}', 100) p`)).rows[0].p), 120); checks++;
    const result = await send(first);
    assert.equal((await db.query("select origen from pedidos where numero=$1",[result.numero])).rows[0].origen,"catalogo"); checks++;
    const again = await send(first);
    assert.deepEqual(again,result);
    assert.equal(await count("pedidos"),1);
    assert.equal(await count("clientes"),2);
    checks++;
    const pair=await Promise.all([send(first),send(first)]);
    assert.deepEqual(pair[0],pair[1]);
    assert.equal(await count("pedidos"),1); checks++;
    await reject({...first,comentario:"Distinto"},/identificador/);
    await reject(pedido({items:null}),/lista/);
    await reject(pedido({items:[]}),/entre 1 y 200/);
    const missing=pedido(); delete missing.items;
    await reject(missing,/lista/);
    await reject(pedido({items:[{codigo:1,cantidad:0,precio_unitario:100}]}),/Stock/);
    await reject(pedido({items:[{codigo:1,cantidad:99,precio_unitario:100}]}),/Stock/);
    await reject(pedido({items:[{codigo:1,cantidad:0.5,precio_unitario:100}]}),/enteras/);
    await reject(pedido({items:[{codigo:1,cantidad:1,precio_unitario:1}]}),/precio/);
    await reject(pedido({items:[{codigo:1,cantidad:1,precio_unitario:100},{codigo:1,cantidad:1,precio_unitario:100}]}),/repetidos/);
    await reject(pedido({items:[{codigo:4,cantidad:1,precio_unitario:10}]}),/Stock/);
    await reject(pedido({items:[{codigo:5,cantidad:1,precio_unitario:10}]}),/disponible/);
    await reject(pedido({items:[{codigo:3,cantidad:1,precio_unitario:20}]}),/bultos/);
    assert.equal(Number((await send(pedido({items:[{codigo:3,cantidad:6,precio_unitario:20}]}))).total),120); checks++;
    assert.equal(Number((await send(pedido({items:[{codigo:2,cantidad:0.125,precio_unitario:10}]}))).total),1.25); checks++;
    const publicRows = (await db.query("select * from obtener_catalogo_publico()")).rows;
    assert.equal(Number(publicRows.find(p=>p.codigo===1).stock),96);
    assert.ok(publicRows.some(p=>p.codigo===4 && Number(p.stock)===0));
    assert.ok(!publicRows.some(p=>p.codigo===5)); checks++;
    const customer = {nombre:"  KIOSCO ÉL SOL ",direccion:"Otra direccion 321",telefono:"+54 9 11 1234-5678",codigo:null};
    const existing = await send(pedido({cliente:customer}));
    assert.equal(existing.cliente_codigo,15);
    const pe=(await db.query("select * from pedidos where numero=$1",[existing.numero])).rows[0];
    assert.equal(pe.vendedor,"Vendedor prueba");
    assert.equal(pe.zona,"Centro");
    assert.ok(pe.vendedor_id); checks++;
    const registered=(await db.query("select direccion from clientes where codigo=15")).rows[0];
    assert.equal(registered.direccion,"Av. San Martin 100"); checks++;
    const byCode=await send(pedido({cliente:{...customer,codigo:"15",nombre:"Nombre escrito distinto"}}));
    assert.equal(byCode.cliente_codigo,15); checks++;
    await reject(pedido({cliente:{...customer,codigo:"15",telefono:"1199999999"}}),/vincular/);
    await db.exec("update clientes set activo=false where codigo=15");
    await reject(pedido({cliente:{...customer,codigo:"15"}}),/ficha/);
    await db.exec("update clientes set activo=true where codigo=15; insert into clientes(codigo,nombre,direccion,telefono) values(16,'Kiosco El Sol','Otra calle','1112345678')");
    await reject(pedido({cliente:customer}),/mas de una/);
    await reject(pedido({cliente:{nombre:"",direccion:"Calle 1",telefono:"123"}}),/Completa/);
    // Reintento tras stock/precio cambiados retorna el pedido ya confirmado, sin crear otro.
    await db.exec("update productos set stock=0, precio_base=999, precios_lista='{}' where codigo=1");
    assert.deepEqual(await send(first),result); checks++;
    await db.exec("set role anon");
    const contacto = (await db.query("select * from obtener_configuracion_catalogo_publico()")).rows[0];
    assert.deepEqual(Object.keys(contacto), ["whatsapp"]); checks++;
    assert.ok((await db.query("select * from obtener_catalogo_publico()")).rows.length);
    assert.deepEqual(await send(first),result);
    await assert.rejects(()=>db.query("select * from catalogo_solicitudes"),/permission denied/);
    await assert.rejects(()=>db.query("select * from clientes"),/permission denied/); checks++;
    await db.exec("reset role");
    console.log("Catalogo SQL: " + checks + " pruebas OK en PostgreSQL en memoria; sin conexiones externas.");
  } finally { await db.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
