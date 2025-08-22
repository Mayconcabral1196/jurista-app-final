import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar.jsx';
import { supabase } from '../supabaseClient.js'; 

import Clientes from '../pages/Clientes.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import LoansTable from '../pages/LoansTable.jsx';
import Reports from '../pages/Reports.jsx';
import Contracts from '../pages/Contracts.jsx';

function Shell({ session }) {
  const [active, setActive] = useState("dashboard");
  const [rows, setRows] = useState([]);
  
  // Adicionamos 'active' como dependência para forçar a recarga dos dados ao mudar de aba
  useEffect(() => {
    async function getEmprestimos() {
      // Usamos '*, clientes(id, nome)' para buscar o nome do cliente associado
      const { data, error } = await supabase
        .from('emprestimos')
        .select('*, clientes(id, nome)');
      
      if (error) {
        console.error('Erro ao buscar empréstimos:', error);
        setRows([]); // Em caso de erro, define como lista vazia
      } else {
        const formattedData = (data || []).map(item => ({
          id: item.id,
          // AQUI ESTÁ A CORREÇÃO: Verificamos se 'item.clientes' existe antes de tentar aceder ao nome
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
  }, [active]); // A busca de dados é reativada sempre que muda de aba

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex h-[100dvh]">
        <Sidebar active={active} setActive={setActive} user={session.user} />
        <main className="flex-1 p-6 grid gap-4 overflow-auto">
          {active === "dashboard" && <Dashboard rows={rows} />}
          {active === "emprestimos" && <LoansTable rows={rows} setRows={setRows} scope="ativos" />}
          {active === "atrasados" && <LoansTable rows={rows} setRows={setRows} scope="atrasados" />}
          {active === "arquivo" && <LoansTable rows={rows} setRows={setRows} scope="arquivo" />}
          {active === "clientes" && <Clientes />}
          {active === "relatorios" && <Reports rows={rows} setRows={setRows} />}
          {active === "contratos" && <Contracts rows={rows} setRows={setRows} goTo={setActive} />}
        </main>
      </div>
    </div>
  );
}

export default Shell;
