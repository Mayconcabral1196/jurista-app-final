import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar.jsx';
import BottomNav from './BottomNav.jsx'; 
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
      
      {/* === HEADER MOBILE === */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-center sticky top-0 z-20 h-14">
        <span className="text-lg font-bold text-emerald-400 tracking-wide">Jurista App</span>
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

      {/* === CONTEÚDO PRINCIPAL === */}
      {/* MUDANÇA AQUI: Aumentei de pb-24 para pb-40 para garantir espaço extra no iPhone */}
      <main className="flex-1 p-4 md:p-6 grid gap-4 overflow-auto h-[calc(100dvh-56px)] md:h-[100dvh] pb-40 md:pb-6">
        
        {active === "dashboard" && <Dashboard rows={rows} />}
        {active === "emprestimos" && <LoansTable rows={rows} setRows={setRows} scope="ativos" />}
        {active === "atrasados" && <LoansTable rows={rows} setRows={setRows} scope="atrasados" />}
        {active === "arquivo" && <LoansTable rows={rows} setRows={setRows} scope="arquivo" />}
        {active === "clientes" && <Clientes />}
        {active === "relatorios" && <Reports rows={rows} setRows={setRows} />}
        {active === "contratos" && <Contracts rows={rows} setRows={setRows} goTo={setActive} />}

        {/* Div espaçadora extra para garantir que o scroll desça até o fim no mobile */}
        <div className="h-12 md:hidden w-full block"></div>

      </main>

      {/* Navegação Inferior (Só visível no Mobile) */}
      <BottomNav active={active} setActive={setActive} />
    </div>
  );
}

export default Shell;