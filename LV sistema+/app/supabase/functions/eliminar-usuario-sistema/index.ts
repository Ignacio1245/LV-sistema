import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function responderJson(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return responderJson({ error: "Metodo no permitido." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return responderJson({ error: "Faltan variables seguras de Supabase." }, 500);
  }

  const authorizationHeader = request.headers.get("Authorization") || "";

  if (!authorizationHeader.startsWith("Bearer ")) {
    return responderJson({ error: "Falta sesion de administrador." }, 401);
  }

  const body = await request.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();

  if (!email.includes("@")) {
    return responderJson({ error: "Email invalido." }, 400);
  }

  const supabaseUsuario = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authorizationHeader
      }
    }
  });

  const { data: sesionUsuario, error: errorSesion } =
    await supabaseUsuario.auth.getUser();

  if (errorSesion || !sesionUsuario.user?.email) {
    return responderJson({ error: "Sesion invalida." }, 401);
  }

  if (sesionUsuario.user.email.toLowerCase() === email) {
    return responderJson({ error: "No podes eliminar tu propio acceso." }, 400);
  }

  const { data: usuarioSistema, error: errorUsuarioSistema } =
    await supabaseUsuario
      .from("usuarios")
      .select("email, activo, roles(nombre, permisos)")
      .eq("email", sesionUsuario.user.email)
      .eq("activo", true)
      .single();

  if (errorUsuarioSistema || !usuarioSistema) {
    return responderJson({ error: "Tu email no esta habilitado como usuario del sistema." }, 403);
  }

  const permisos = usuarioSistema.roles?.permisos || {};

  if (permisos.configuracion !== true) {
    return responderJson({ error: "No tenes permiso para eliminar accesos." }, 403);
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: usuariosAuth, error: errorListado } =
    await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

  if (errorListado) {
    return responderJson({ error: errorListado.message }, 400);
  }

  const usuarioAuth =
    usuariosAuth.users.find((usuario) => usuario.email?.toLowerCase() === email);

  if (!usuarioAuth) {
    return responderJson({
      ok: true,
      accesoExistente: false
    });
  }

  const { error } =
    await supabaseAdmin.auth.admin.deleteUser(usuarioAuth.id);

  if (error) {
    return responderJson({ error: error.message }, 400);
  }

  return responderJson({
    ok: true,
    accesoEliminado: true
  });
});
