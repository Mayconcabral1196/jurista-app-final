import React, { useEffect, useState, useCallback } from "react";
import { num, todayISO, uid, save, load } from '../utils/helpers';
import { supabase } from '../supabaseClient';
import Card from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import MoneyInput from '../components/MoneyInput.jsx';

// Função auxiliar simples para somar dias/meses
const addDate = (dateString, amount, type) => {
  if (!dateString) return "";
  const date = new Date(dateString + "T12:00:00"); // T12 para evitar problemas de fuso
  if (type === 'days') {
    date.setDate(date.getDate() + amount);
  } else if (type === 'months') {
    date.setMonth(date.getMonth() + amount);
  }
  return date.toISOString().split('T')[0];
};

function Contracts({ rows, setRows, goTo = () => {} }) {
  const [clientes, setClientes] = useState([]);
  const [selectedClienteId, setSelectedClienteId] = useState('');

  const empty = { status: "PENDENTE", valorEmprestado: "", dataEmprestimo: todayISO(), valorReceber: "", dataReceber: "" };
  const [draft, setDraft] = useState(empty);
  // 1. Alteração: Padrão agora é 30%
  const [profitPct, setProfitPct] = useState(load("jurista_profit_pct", 30));
  const [autoCalc, setAutoCalc] = useState(load("jurista_auto", true));
  
  const [parcelas, setParcelas] = useState(1);
  // 2. Novo Estado: Frequência de pagamento
  const [frequencia, setFrequencia] = useState("MENSAL");
  
  // 4. Novo Estado: Lista de parcelas geradas para edição manual
  const [listaParcelas, setListaParcelas] = useState([]);

  useEffect(() => {
    async function fetchClientes() {
      const { data, error } = await supabase.from('clientes').select('id, nome');
      if (error) console.error("Erro ao buscar clientes:", error);
      else setClientes(data);
    }
    fetchClientes();
  }, []);

  // Lógica de Cálculo Automático do Valor a Receber
  useEffect(() => {
    if (!autoCalc) return;
    const ve = num(draft.valorEmprestado);
    if (ve > 0) {
      const vr = ve * (1 + Number(profitPct) / 100);
      setDraft(d => ({ ...d, valorReceber: String(vr.toFixed(2)) }));
    }
  }, [draft.valorEmprestado, profitPct, autoCalc]);

  // 3. Lógica Inteligente de Datas (Preenche data de recebimento baseada na frequência)
  useEffect(() => {
    if (!draft.dataEmprestimo) return;

    let novaDataReceber = "";
    // Se escolheu Diário, o primeiro pagamento é amanhã (+1 dia)
    if (frequencia === "DIARIO") novaDataReceber = addDate(draft.dataEmprestimo, 1, 'days');
    // Se Semanal, +7 dias
    if (frequencia === "SEMANAL") novaDataReceber = addDate(draft.dataEmprestimo, 7, 'days');
    // Se Quinzenal, +15 dias
    if (frequencia === "QUINZENAL") novaDataReceber = addDate(draft.dataEmprestimo, 15, 'days');
    // Se Mensal, +1 mês
    if (frequencia === "MENSAL") novaDataReceber = addDate(draft.dataEmprestimo, 1, 'months');

    setDraft(d => ({ ...d, dataReceber: novaDataReceber }));
  }, [frequencia, draft.dataEmprestimo]);

  // 4. Gerador Automático da Lista de Parcelas (O "Pop-up")
  useEffect(() => {
    const n = Math.max(1, Number(parcelas) || 1);
    const vrTotal = num(draft.valorReceber);
    const veTotal = num(draft.valorEmprestado);
    
    if (vrTotal <= 0 || !draft.dataReceber) return;

    const baseR = Math.round((vrTotal / n) * 100) / 100;
    const baseE = Math.round((veTotal / n) * 100) / 100;
    
    let accR = 0; 
    let accE = 0;
    
    const novas = Array.from({ length: n }).map((_, i) => {
      // Ajuste de centavos na última parcela
      const valorR = (i < n - 1) ? baseR : (vrTotal - accR).toFixed(2);
      const valorE = (i < n - 1) ? baseE : (veTotal - accE).toFixed(2);
      
      accR += Number(valorR);
      accE += Number(valorE);

      let dataVencimento = draft.dataReceber;
      
      // Calcula a data de cada parcela subsequente
      if (i > 0) {
        if (frequencia === "DIARIO") dataVencimento = addDate(draft.dataReceber, i * 1, 'days');
        if (frequencia === "SEMANAL") dataVencimento = addDate(draft.dataReceber, i * 7, 'days');
        if (frequencia === "QUINZENAL") dataVencimento = addDate(draft.dataReceber, i * 15, 'days');
        if (frequencia === "MENSAL") dataVencimento = addDate(draft.dataReceber, i * 1, 'months');
      }

      return {
        id: i, // ID temporário para a lista
        numero: i + 1,
        data: dataVencimento,
        valorReceber: String(valorR),
        valorEmprestado: String(valorE) // Proporcional
      };
    });

    setListaParcelas(novas);
  }, [parcelas, draft.valorReceber, draft.valorEmprestado, draft.dataReceber, frequencia]);

  // Permite editar uma parcela específica na lista
  const handleEditParcela = (index, field, value) => {
    const updated = [...listaParcelas];
    updated[index][field] = value;
    setListaParcelas(updated);
  };

  const addParcelado = useCallback(async () => {
    if (!selectedClienteId) return alert("Por favor, selecione um cliente.");
    if (listaParcelas.length === 0) return alert("Nenhuma parcela gerada.");
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Utilizador não autenticado.");

    const groupId = uid();

    // Prepara os dados baseados na Lista (que pode ter sido editada manualmente)
    const paraSalvar = listaParcelas.map(p => ({
        status: draft.status,
        valor_emprestado: p.valorEmprestado,
        data_emprestimo: draft.dataEmprestimo,
        valor_receber: p.valorReceber,
        data_receber: p.data, // Usa a data da lista (que pode ter sido editada)
        parcela: p.numero,
        total_parcelas: parcelas,
        group_id: groupId,
        cliente_id: selectedClienteId,
        user_id: user.id
    }));

    const { error } = await supabase.from('emprestimos').insert(paraSalvar);

    if (error) {
      alert('Erro ao salvar no banco de dados: ' + error.message);
    } else {
      alert('Contrato adicionado com sucesso!');
      save("jurista_profit_pct", profitPct);
      save("jurista_auto", autoCalc);
      goTo('emprestimos');
    }
  }, [listaParcelas, selectedClienteId, draft, parcelas, profitPct, autoCalc, goTo]);

  return (
    <div className="space-y-6">
      <Card title="Novo Contrato de Empréstimo" 
        right={
          <div className="flex items-center gap-3">
            <Badge tone="amber">Cadastro</Badge>
            <span className="text-xs text-slate-300">Lucro (%)</span>
            <Input type="number" className="w-20" value={profitPct} onChange={e=>setProfitPct(e.target.value)} />
            <label className="text-xs text-slate-300 flex items-center gap-1">
              <input type="checkbox" checked={autoCalc} onChange={e=>setAutoCalc(e.target.checked)} /> Auto
            </label>
          </div>
        }
      >
        {/* === FORMULÁRIO PRINCIPAL === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-300 mb-1">Cliente</label>
            <Select value={selectedClienteId} onChange={e => setSelectedClienteId(e.target.value)} required>
              <option value="" disabled>Selecione um cliente</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Valor Emprestado (R$)</label>
            <MoneyInput placeholder="0,00" value={draft.valorEmprestado} onChange={e=>setDraft({...draft, valorEmprestado:e.target.value})} />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Data do Empréstimo</label>
            <Input type="date" value={draft.dataEmprestimo} onChange={e=>setDraft({...draft, dataEmprestimo:e.target.value})} />
          </div>
          
          <div>
            <label className="block text-xs text-slate-300 mb-1">Total a Receber (R$)</label>
            <MoneyInput placeholder="0,00" value={draft.valorReceber} onChange={e=>setDraft({...draft, valorReceber:e.target.value})} />
          </div>

          {/* Novo Campo: Frequência */}
          <div>
            <label className="block text-xs text-slate-300 mb-1">Frequência de Pagamento</label>
            <Select value={frequencia} onChange={e => setFrequencia(e.target.value)}>
              <option value="DIARIO">Diário</option>
              <option value="SEMANAL">Semanal</option>
              <option value="QUINZENAL">Quinzenal</option>
              <option value="MENSAL">Mensal</option>
            </Select>
          </div>

          <div>
             <label className="block text-xs text-slate-300 mb-1">1ª Data de Recebimento</label>
             <Input type="date" value={draft.dataReceber} onChange={e=>setDraft({...draft, dataReceber:e.target.value})} />
          </div>

           <div>
            <label className="block text-xs text-slate-300 mb-1">Quantidade de Parcelas</label>
            <Input type="number" min="1" value={parcelas} onChange={e=>setParcelas(e.target.value)} />
          </div>
        </div>

        {/* === LISTA DE PREVISÃO (O "Pop-up" Integrado) === */}
        {listaParcelas.length > 0 && (
          <div className="mt-8 bg-slate-900/50 p-4 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-bold text-emerald-400">Previsão de Parcelas</h3>
               <span className="text-xs text-slate-400">Você pode editar as datas e valores individualmente abaixo</span>
            </div>
            
            <div className="space-y-2">
              {listaParcelas.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-2 md:col-span-1 text-xs text-slate-400 font-mono">
                    #{item.numero}
                  </div>
                  <div className="col-span-5 md:col-span-5">
                    <Input 
                      type="date" 
                      value={item.data} 
                      onChange={(e) => handleEditParcela(index, 'data', e.target.value)}
                    />
                  </div>
                  <div className="col-span-5 md:col-span-6">
                    <MoneyInput 
                      value={item.valorReceber} 
                      onChange={(e) => handleEditParcela(index, 'valorReceber', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-right mt-6">
            <Button onClick={addParcelado}>
              Adicionar Contrato ({parcelas}x)
            </Button>
        </div>
      </Card>
    </div>
  );
}

export default Contracts;