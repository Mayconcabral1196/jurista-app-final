import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar.jsx';
import BottomNav from './BottomNav.jsx'; // NOVO: Importa a navegação inferior
import { supabase } from '../supabaseClient.js'; 

import Clientes from '../pages/Clientes.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import LoansTable from '../pages/LoansTable.jsx';
import Reports from '../pages/Reports.jsx';
import Contracts from '../pages/Contracts.jsx';

function Shell({ session }) {
  const [active, setActive] = useState("dashboard");
  const [rows, setRows] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  useEffect(() => {
    async function getEmprestimos() {
      // ... (Restante da lógica de fetch de dados permanece igual)
      const { data, error } = await supabase
        .from('emprestimos')
        .select('*, clientes(id, nome)');
      
      if (error) {
        console.error('Erro ao buscar empréstimos:', error);
        setRows([]); 
      } else {
        const formattedData = (data || []).map(item => ({
          id: item.id,
          clienteNome: item.clientes ? item.clientes.nome : 'Cliente Removido',
          clienteId: item.clientes ? item.clientes.id : null,
          status: item.status,
          valorEmprestado: item.valor_emprestado,
          dataEmprestimo: item.data_emprestimo,
          valorReceber: item.valor_receber,
          dataReceber: item.data_receber,
          parcela: item.parcela,
          totalParcelas: item.total_parcelas,
          dataQuitacao: item.data_quitacao
        }));
        setRows(formattedData);
      }
    }
    
    getEmprestimos();
  }, [active]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      
      {/* === HEADER MOBILE (Agora é apenas o topo com o botão de menu) === */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-20">
        
        {/* Ordem invertida para botão Esquerda / Título Direita */}
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-slate-200 hover:bg-slate-800 rounded-lg"
        >
          {/* Ícone de Menu Hambúrguer */}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <span className="text-lg font-bold text-emerald-400">Jurista App</span>
        
      </div>

      {/* Sidebar: Oculta no Mobile, Visível no Desktop */}
      <div className="hidden md:flex">
          <Sidebar 
            active={active} 
            setActive={setActive} 
            user={session.user} 
            isOpen={isSidebarOpen}            
            setIsOpen={setIsSidebarOpen}      
          />
      </div>

      {/* Conteúdo Principal: Altura ajustada para o Bottom Nav no Mobile */}
      <main className="flex-1 p-4 md:p-6 grid gap-4 overflow-auto 
                     h-[calc(100dvh - 56px - 64px)] md:h-[100dvh]">
        {/* A altura "56px" é o header mobile, e "64px" é o BottomNav */}
        
        {active === "dashboard" && <Dashboard rows={rows} />}
        {active === "emprestimos" && <LoansTable rows={rows} setRows={setRows} scope="ativos" />}
        {active === "atrasados" && <LoansTable rows={rows} setRows={setRows} scope="atrasados" />}
        {active === "arquivo" && <LoansTable rows={rows} setRows={setRows} scope="arquivo" />}
        {active === "clientes" && <Clientes />}
        {active === "relatorios" && <Reports rows={rows} setRows={setRows} />}
        {active === "contratos" && <Contracts rows={rows} setRows={setRows} goTo={setActive} />}
      </main>

      {/* NOVO: Navegação Inferior (Só visível no Mobile) */}
      <BottomNav active={active} setActive={setActive} />
    </div>
  );
}

export default Shell;