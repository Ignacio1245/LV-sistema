const SUPABASE_URL = "https://aofoacncvivxxwnusboi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_UiKyYc21zsktfi6Mc2t9Sg_2FUQU8_4";

const supabaseClient = window.supabase
  ? window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    }
  )
  : null;

function supabaseEstaConfigurado() {
  return Boolean(
    window.supabase &&
    supabaseClient &&
    SUPABASE_URL &&
    SUPABASE_PUBLISHABLE_KEY
  );
}
