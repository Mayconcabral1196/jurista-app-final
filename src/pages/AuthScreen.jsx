import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import Card from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    
    if (isLogin) {
      // Lógica de Login
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    } else {
      // Lógica de Inscrição (Sign Up)
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        alert(error.message);
      } else {
        alert('Inscrição bem-sucedida! Verifique o seu e-mail para confirmação.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-2xl font-extrabold">Jurista</div>
          <div className="text-slate-400">Gestão de Empréstimos</div>
        </div>
        <Card title={isLogin ? 'Iniciar Sessão' : 'Criar Conta'}>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">E-mail</label>
              <Input type="email" placeholder="voce@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Palavra-passe</label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Inscrever-se')}
            </Button>
            <div className="text-center text-sm">
              <span className="text-slate-400">{isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}</span>
              <button type="button" className="font-medium text-emerald-400 hover:underline ml-1" onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? 'Inscreva-se' : 'Inicie Sessão'}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default AuthScreen;
