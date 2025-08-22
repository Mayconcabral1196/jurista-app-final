import { createClient } from '@supabase/supabase-js'

// Busca a URL e a Chave das Variáveis de Ambiente do Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Verifica se as variáveis foram encontradas
if (!supabaseUrl || !supabaseKey) {
  throw new Error("As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_KEY são necessárias.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
