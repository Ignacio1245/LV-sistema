const SUPABASE_URL = "https://aofoacncvivxxwnusboi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_UiKyYc21zsktfi6Mc2t9Sg_2FUQU8_4";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

function supabaseEstaConfigurado() {
  return Boolean(
    window.supabase &&
    SUPABASE_URL &&
    SUPABASE_PUBLISHABLE_KEY
  );
}
