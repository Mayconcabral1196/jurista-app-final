import React, { useMemo } from 'react';
import { todayISO, toLocalDate, num, fmtBRL } from '../utils/helpers';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

function Dashboard({ rows }) {
  const today = todayISO();
  const dNow = new Date();
  const mesAtual = dNow.getMonth();
  const anoAtual = dNow.getFullYear();

  const ativos = useMemo(() => rows.filter(r => r.status !== 'QUITADO'), [rows]);
  const deHoje = useMemo(() => ativos.filter(r => r.dataReceber === today), [ativos, today]);
  const totalHoje = useMemo(() => deHoje.reduce((s, r) => s + num(r.valorReceber), 0), [deHoje]);
  const totalMes = useMemo(() => ativos.reduce((s, r) => { const d = toLocalDate(r.dataReceber); return (d.getMonth() === mesAtual && d.getFullYear() === anoAtual) ? s + num(r.valorReceber) : s; }, 0), [ativos, mesAtual, anoAtual]);
  const totalAno = useMemo(() => ativos.reduce((s, r) => { const d = toLocalDate(r.dataReceber); return d.getFullYear() === anoAtual ? s + num(r.valorReceber) : s; }, 0), [ativos, anoAtual]);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        <Card title="Hoje" right={<Badge tone="amber">{today}</Badge>}>
          <div className="text-3xl font-bold">{fmtBRL(totalHoje)}</div>
          <div className="mt-2 text-sm text-slate-300">Quem paga hoje</div>
          <ul className="text-slate-200 text-sm mt-1 list-disc list-inside">{deHoje.length === 0 && <li>Ninguém previsto</li>}{deHoje.map(r => <li key={r.id}>{r.nome}</li>)}</ul>
        </Card>
        <Card title="Este mês"><div className="text-3xl font-bold">{fmtBRL(totalMes)}</div><div className="text-sm text-slate-400">Previsto até o fim do mês</div></Card>
        <Card title="Este ano"><div className="text-3xl font-bold">{fmtBRL(totalAno)}</div><div className="text-sm text-slate-400">Previsto no ano</div></Card>
      </div>
    </div>
  );
}

export default Dashboard;