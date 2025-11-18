import React from 'react';
import { supabase } from '../supabaseClient';

function Sidebar({ active, setActive, user, isOpen, setIsOpen }) {
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

  // Função para fechar o menu ao clicar em um item (só no mobile)
  const handleItemClick = (id) => {
    setActive(id);
    setIsOpen(false); // Fecha o menu ao selecionar
  };

  return (
    <>
      {/* === OVERLAY (Fundo escuro no mobile) === */}
      {/* Se estiver aberto (isOpen) e for mobile (md:hidden), mostra o fundo preto transparente */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)} // Fecha ao clicar fora
        />
      )}

      {/* === SIDEBAR === */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-64 bg-slate-950 border-r border-slate-900 p-4 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 
        `}
      >
        {/* Cabeçalho da Sidebar (com botão de fechar no mobile) */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-lg font-bold text-emerald-500">Jurista</div>
          
          {/* Botão X para fechar (só aparece no mobile) */}
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="space-y-1 overflow-y-auto flex-1">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => handleItemClick(it.id)}
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

        <div className="mt-auto pt-4 border-t border-slate-900">
          <div className="text-xs text-slate-400">
            Conectado como<br />
            <span className="text-slate-200 truncate block">{user?.email}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full text-left text-sm text-rose-300 hover:bg-rose-900/30 px-3 py-2 mt-2 rounded-xlQX transition"
          >
            Terminar Sessão
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;