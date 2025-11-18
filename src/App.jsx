import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import AuthScreen from './pages/AuthScreen.jsx';
import Shell from './layout/Shell.jsx';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica a sessão inicial quando a aplicação carrega
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Ouve mudanças no estado de autenticação (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Limpa a subscrição quando o componente é desmontado
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center">Carregando...</div>;
  }

  
  return (
    // Adicionei 'min-h-screen' (altura total) e 'w-full' (largura total)
    // bg-slate-50 garante uma cor de fundo padrão para não ficar transparente
    <div className="min-h-screen w-full bg-slate-50">
      {!session ? <AuthScreen /> : <Shell key={session.user.id} session={session} />}
    </div>
  );
}

export default App;