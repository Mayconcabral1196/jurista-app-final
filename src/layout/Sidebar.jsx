import React from 'react';
import { supabase } from '../supabaseClient';

function Sidebar({ active, setActive, user }) {
  const items = [
    { id: "dashboard", label: "Dashboard" },
    { id: "emprestimos", label: "Empréstimos (Ativos)" },
    { id: "atrasados", label: "Atrasados" },
    { id: "arquivo", label: "Arquivo (Quitados)" },
    { id: "clientes", label: "Clientes" },
    { id: "relatorios", label: "Relatórios" },
    { id: "contratos", label: "Contratos" }
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside className="w-64 shrink-0 h-full bg-slate-950/70 border-r border-slate-900 p-4 flex flex-col">
      <div>
        <div className="text-lg font-bold mb-6">Jurista</div>
        <nav className="space-y-1">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => setActive(it.id)}
              className={`w-full text-left px-3 py-2 rounded-xl transition ${
                active === it.id
                  ? "bg-emerald-600/20 text-emerald-200 border border-emerald-700/40"
                  : "hover:bg-slate-800/60 text-slate-200 border border-transparent"
              }`}
            >
              {it.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-auto">
        <div className="text-xs text-slate-400">
          Conectado como<br />
          {/* Usamos 'user?.email' para evitar erros caso 'user' seja nulo */}
          <span className="text-slate-200">{user?.email}</span>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full text-left text-sm text-rose-300 hover:bg-rose-900/30 px-3 py-2 mt-2 rounded-xl transition"
        >
          Terminar Sessão
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
