import React, { useEffect, useState, useCallback } from "react";
import { num, todayISO, uid, save, load, toLocalDate, addDaysISO } from '../utils/helpers';
import { supabase } from '../supabaseClient';
import Card from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import MoneyInput from '../components/MoneyInput.jsx';

function Contracts({ rows, setRows, goTo = () => {} }) {
  const [clientes, setClientes] = useState([]);
  const [selectedClienteId, setSelectedClienteId] = useState('');

  const empty = { status: "PENDENTE", valorEmprestado: "", dataEmprestimo: todayISO(), valorReceber: "", dataReceber: todayISO() };
  const [draft, setDraft] = useState(empty);
  const [profitPct, setProfitPct] = useState(load("jurista_profit_pct", 20));
  const [autoCalc, setAutoCalc] = useState(load("jurista_auto", true));
  const [parcelas, setParcelas] = useState(1);
  const [intervalo, setIntervalo] = useState(30);

  useEffect(() => {
    async function fetchClientes() {
      const { data, error } = await supabase.from('clientes').select('id, nome');
      if (error) console.error("Erro ao buscar clientes:", error);
      else setClientes(data);
    }
    fetchClientes();
  }, []);

  useEffect(() => {
    if (!autoCalc) return;
    const ve = num(draft.valorEmprestado);
    if (ve > 0) {
      const vr = ve * (1 + Number(profitPct) / 100);
      setDraft(d => ({ ...d, valorReceber: String(vr.toFixed(2)) }));
    }
  }, [draft.valorEmprestado, profitPct, autoCalc]);

  const addParcelado = useCallback(async () => {
    if (!selectedClienteId) return alert("Por favor, selecione um cliente.");
    const ve = num(draft.valorEmprestado), vr = num(draft.valorReceber);
    if (ve <= 0 || vr <= 0) return alert("Valores devem ser > 0");
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Utilizador não autenticado.");

    const groupId = uid();
    const n = Math.max(1, Number(parcelas) || 1);
    const gap = Math.max(1, Number(intervalo) || 30);
    const r2 = (x) => Math.round(x * 100) / 100;

    let novosEmprestimos = [];
    if (n === 1) {
      novosEmprestimos.push({ ...draft, groupId, parcela: 1, totalParcelas: 1, cliente_id: selectedClienteId, user_id: user.id });
    } else {
      const baseR = r2(vr / n);
      const baseE = r2(ve / n);
      let accR = 0, accE = 0;
      novosEmprestimos = Array.from({ length: n }).map((_, i) => {
        const valorR = (i < n - 1) ? baseR : r2(vr - accR);
        const valorE = (i < n - 1) ? baseE : r2(ve - accE);
        accR += baseR; accE += baseE;
        const data = addDaysISO(draft.dataReceber, i * gap);
        return { 
          status: draft.status, 
          valorEmprestado: String(valorE), 
          dataEmprestimo: draft.dataEmprestimo, 
          valorReceber: String(valorR), 
          dataReceber: data, 
          parcela: i + 1, 
          totalParcelas: n,
          groupId,
          cliente_id: selectedClienteId,
          user_id: user.id
        };
      });
    }

    const paraSalvar = novosEmprestimos.map(emp => ({
        status: emp.status,
        valor_emprestado: emp.valorEmprestado,
        data_emprestimo: emp.dataEmprestimo,
        valor_receber: emp.valorReceber,
        data_receber: emp.dataReceber,
        parcela: emp.parcela,
        total_parcelas: emp.totalParcelas,
        group_id: emp.groupId,
        cliente_id: emp.cliente_id,
        user_id: emp.user_id
    }));

    const { error } = await supabase.from('emprestimos').insert(paraSalvar);

    if (error) {
      alert('Erro ao salvar no banco de dados: ' + error.message);
    } else {
      alert('Contrato adicionado com sucesso!');
      goTo('emprestimos');
    }
  }, [draft, selectedClienteId, parcelas, intervalo, goTo]);

  return (
    <div className="space-y-4">
      <Card title="Novo Contrato de Empréstimo" right={<div className="flex items-center gap-3"><Badge tone="amber">Cadastro</Badge><span className="text-xs text-slate-300">Lucro padrão (%)</span><Input type="number" className="w-20" value={profitPct} onChange={e=>setProfitPct(e.target.value)} /><label className="text-xs text-slate-300 flex items-center gap-1"><input type="checkbox" checked={autoCalc} onChange={e=>setAutoCalc(e.target.checked)} /> Auto</label></div>}>
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
            <label className="block text-xs text-slate-300 mb-1">Valor Emprestado</label>
            <MoneyInput placeholder="Valor emprestado" value={draft.valorEmprestado} onChange={e=>setDraft({...draft, valorEmprestado:e.target.value})} />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Data do Empréstimo</label>
            <Input type="date" value={draft.dataEmprestimo} onChange={e=>setDraft({...draft, dataEmprestimo:e.target.value})} />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Valor a Receber</label>
            <MoneyInput placeholder="Valor a receber" value={draft.valorReceber} onChange={e=>setDraft({...draft, valorReceber:e.target.value})} />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Data de Recebimento</label>
            <Input type="date" value={draft.dataReceber} onChange={e=>setDraft({...draft, dataReceber:e.target.value})} />
          </div>
           <div>
            <label className="block text-xs text-slate-300 mb-1">Parcelas</label>
            <Input type="number" min="1" value={parcelas} onChange={e=>setParcelas(e.target.value)} />
          </div>
        </div>
        <div className="text-right mt-4">
            <Button onClick={addParcelado}>Adicionar Contrato</Button>
        </div>
      </Card>
    </div>
  );
}

export default Contracts;
