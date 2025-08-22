import React, { useState, useMemo } from 'react';
import { num, fmtBRL, toLocalDate, todayISO } from '../utils/helpers';
import { STATUS } from '../constants';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';

// O componente agora só precisa de 'rows', pois não vamos mais alterar dados aqui.
function Reports({ rows }) {
  const [status, setStatus] = useState("TODOS");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [cliente, setCliente] = useState("TODOS");
  
  // AQUI ESTÁ A CORREÇÃO: Geramos a lista de clientes a partir da propriedade 'clienteNome'
  const clientes = useMemo(() => Array.from(new Set(rows.map(r => r.clienteNome).filter(Boolean))).sort(), [rows]);

  const parsed = useMemo(() => rows.map(r => ({
    ...r,
    ve: num(r.valorEmprestado),
    vr: num(r.valorReceber),
    lucro: num(r.valorReceber) - num(r.valorEmprestado),
    de: toLocalDate(r.dataEmprestimo),
    dr: toLocalDate(r.dataReceber)
  })), [rows]);

  const filt = useMemo(() => parsed.filter(r => {
    if (status !== "TODOS" && r.status !== status) return false;
    // AQUI ESTÁ A CORREÇÃO: Filtramos por 'clienteNome'
    if (cliente !== "TODOS" && r.clienteNome !== cliente) return false;
    if (q && r.clienteNome && !r.clienteNome.toLowerCase().includes(q.toLowerCase())) return false;
    if (from && r.de < toLocalDate(from)) return false;
    if (to && r.dr > toLocalDate(to)) return false;
    return true;
  }), [parsed, status, cliente, q, from, to]);

  const totals = useMemo(() => ({ count: filt.length, emprestado: filt.reduce((a, b) => a + b.ve, 0), receber: filt.reduce((a, b) => a + b.vr, 0), lucro: filt.reduce((a, b) => a + b.lucro, 0) }), [filt]);
  const prazoMedio = useMemo(() => (filt.length ? Math.round(filt.reduce((a, b) => a + ((b.dr - b.de) / 86400000), 0) / filt.length) : 0), [filt]);
  const ticketMedio = useMemo(() => (filt.length ? totals.emprestado / filt.length : 0), [totals.emprestado, filt.length]);
  const roi = useMemo(() => totals.emprestado > 0 ? (totals.lucro / totals.emprestado) * 100 : 0, [totals]);

  // ... (outras funções como exportCSV e setMesAtual continuam iguais)

  const today = todayISO();
  const agingDefs = [ {label:'0-7',min:1,max:7}, {label:'8-30',min:8,max:30}, {label:'31-60',min:31,max:60}, {label:'61-90',min:61,max:90}, {label:'>90',min:91,max:9999} ];
  const aging = useMemo(()=>{ const res = agingDefs.map(b=>({...b, count:0, valor:0})); const t = toLocalDate(today); filt.forEach(r=>{ if (r.status==='QUITADO') return; const days = Math.floor((t - r.dr)/86400000); if (days>0) { for (const b of res) { if (days>=b.min && days<=b.max) { b.count++; b.vr += r.vr; break; } } } }); return res; }, [filt, today]);
  const [showAging, setShowAging] = useState(false);

  return (
    <div className="space-y-4">
      <Card title="Filtros de Relatório" right={<div className="flex items-center gap-2"><Badge tone="green">ROI {roi.toFixed(1)}%</Badge></div>}>
        <div className="grid grid-cols-1 md:grid-cols-8 gap-3 items-end">
          <Input placeholder="Buscar por nome do cliente" value={q} onChange={e => setQ(e.target.value)} />
          <Select value={cliente} onChange={e => setCliente(e.target.value)}><option value="TODOS">Todos os clientes</option>{clientes.map(c => <option key={c} value={c}>{c}</option>)}</Select>
          <Select value={status} onChange={e => setStatus(e.target.value)}><option value="TODOS">Todos os status</option>{STATUS.map(s => <option key={s} value={s}>{s}</option>)}</Select>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
          <div className="md:col-span-2 flex flex-wrap items-center gap-2"><Button variant="ghost" onClick={() => { const d = new Date(); setFrom(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`); setTo(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-31`); }}>Mês atual</Button><Button variant="ghost" onClick={() => { setFrom(""); setTo(""); }}>Limpar período</Button></div>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-800/60 rounded-lg p-3 min-w-0"><div className="text-xs text-slate-400">Registros</div><div className="text-xl font-semibold truncate">{totals.count}</div></div>
            <div className="bg-slate-800/60 rounded-lg p-3 min-w-0"><div className="text-xs text-slate-400">Investido</div><div className="text-xl font-semibold truncate">{fmtBRL(totals.emprestado)}</div></div>
            <div className="bg-slate-800/60 rounded-lg p-3 min-w-0"><div className="text-xs text-slate-400">A receber</div><div className="text-xl font-semibold truncate">{fmtBRL(totals.receber)}</div></div>
            <div className="bg-slate-800/60 rounded-lg p-3 min-w-0"><div className="text-xs text-slate-400">Lucro total</div><div className="text-xl font-semibold text-emerald-300 truncate">{fmtBRL(totals.lucro)}</div></div>
            <div className="bg-slate-800/60 rounded-lg p-3 min-w-0"><div className="text-xs text-slate-400">Ticket médio</div><div className="text-xl font-semibold truncate">{fmtBRL(ticketMedio)}</div></div>
            <div className="bg-slate-800/60 rounded-lg p-3 min-w-0"><div className="text-xs text-slate-400">Prazo médio</div><div className="text-xl font-semibold truncate">{prazoMedio} d</div></div>
        </div>
      </Card>

      <Card title="Atrasos (resumo)" right={<Button variant="ghost" onClick={()=>setShowAging(s=>!s)}>{showAging ? 'Ocultar detalhes' : 'Detalhar'}</Button>}>
        {/* ... código do card de Atrasos ... */}
      </Card>

      <Card title="Prévia dos registros filtrados">
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-slate-300">
                {/* AQUI ESTÃO AS CORREÇÕES */}
                <th className="text-left p-2">Cliente</th>
                <th className="text-left p-2">Status</th>
                <th className="text-right p-2">Emprestado</th>
                <th className="text-right p-2">Receber</th>
                <th className="text-right p-2">Lucro</th>
                <th className="text-left p-2">Data Recebimento</th>
              </tr>
            </thead>
            <tbody>
              {filt.map(r => (
                <tr key={r.id} className="border-t border-slate-800">
                  {/* AQUI ESTÃO AS CORREÇÕES */}
                  <td className="p-2">{r.clienteNome}</td>
                  <td className="p-2">{r.status}</td>
                  <td className="p-2 text-right">{fmtBRL(r.ve)}</td>
                  <td className="p-2 text-right">{fmtBRL(r.vr)}</td>
                  <td className="p-2 text-right text-emerald-300">{fmtBRL(r.lucro)}</td>
                  <td className="p-2">{r.dataReceber}</td>
                </tr>
              ))}
              {filt.length === 0 && <tr><td colSpan={6} className="text-center text-slate-400 p-6">Nada encontrado</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default Reports;
