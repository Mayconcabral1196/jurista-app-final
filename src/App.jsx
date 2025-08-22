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

  // Se não houver sessão, mostra o ecrã de login.
  // Se houver sessão, mostra o painel principal da aplicação.
  return (
    <div>
      {!session ? <AuthScreen /> : <Shell key={session.user.id} session={session} />}
    </div>
  );
}

export default App;
