import React, { useEffect, useMemo, useState, useCallback } from "react";
import { num, fmtBRL, todayISO, load, toLocalDate } from '../utils/helpers';
import { STATUS } from '../constants';
import { supabase } from '../supabaseClient';

import Card from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import MoneyInput from '../components/MoneyInput.jsx';

// Componente para uma única linha, agora com a função de apagar
function LoanRow({ loan, onSave, onStatusChange, onDelete, scope }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLoan, setEditedLoan] = useState(loan);

  useEffect(() => {
    setEditedLoan(loan);
  }, [loan]);

  const handleInputChange = (field, value) => {
    setEditedLoan({ ...editedLoan, [field]: value });
  };

  const handleSaveClick = () => {
    onSave(editedLoan);
    setIsEditing(false);
  };

  const handleCancelClick = () => {
    setEditedLoan(loan); // Restaura os dados originais
    setIsEditing(false);
  };

  const handleDeleteClick = () => {
    onDelete(loan.id);
    // Não precisa de mudar o estado de edição, pois o componente será removido da lista
  };

  const lucro = (r) => num(r.valorReceber) - num(r.valorEmprestado);
  const roi = (r) => { const ve = num(r.valorEmprestado); return ve > 0 ? (lucro(r) / ve) * 100 : 0; };
  const todayDate = toLocalDate(todayISO());

  return (
    <tr className="border-t border-slate-800 align-top">
      {isEditing ? (
        <>
          {/* MODO DE EDIÇÃO */}
          <td className="p-2 pt-3 font-medium">{loan.clienteNome}</td>
          <td className="p-2 pt-3">{loan.parcela ? `${loan.parcela}/${loan.totalParcelas || 1}` : '-'}</td>
          <td className="p-2"><Select value={editedLoan.status} onChange={(e) => handleInputChange('status', e.target.value)}>{STATUS.map(s => <option key={s} value={s}>{s}</option>)}</Select></td>
          <td className="p-2"><MoneyInput className="text-right" value={editedLoan.valorEmprestado} onChange={e => handleInputChange('valorEmprestado', e.target.value)} /></td>
          <td className="p-2"><Input type="date" value={editedLoan.dataEmprestimo} onChange={e => handleInputChange('dataEmprestimo', e.target.value)} /></td>
          <td className="p-2"><MoneyInput className="text-right" value={editedLoan.valorReceber} onChange={e => handleInputChange('valorReceber', e.target.value)} /></td>
          <td className="p-2"><Input type="date" value={editedLoan.dataReceber} onChange={e => handleInputChange('dataReceber', e.target.value)} /></td>
          <td className="p-2 text-right pt-3">{scope === 'atrasados' && (() => { const dias = Math.max(0, Math.floor((todayDate - toLocalDate(loan.dataReceber))/86400000)); const tone = dias>=30?'red':(dias>=8?'amber':'green'); return <Badge tone={tone}>{dias} d</Badge>; })()}</td>
          <td className="p-2 text-right pt-3"><div className="text-emerald-300">{fmtBRL(lucro(editedLoan))}</div><div className="text-xs text-slate-400">ROI {roi(editedLoan).toFixed(1)}%</div></td>
          <td className="p-2 text-right">
            {/* AQUI ESTÁ A MUDANÇA: Botão Excluir adicionado */}
            <div className="flex gap-2 justify-end">
              <Button type="button" onClick={handleSaveClick}>Salvar</Button>
              <Button type="button" variant="danger" onClick={handleDeleteClick}>Excluir</Button>
              <Button type="button" variant="ghost" onClick={handleCancelClick}>Cancelar</Button>
            </div>
          </td>
        </>
      ) : (
        <>
          {/* MODO DE VISUALIZAÇÃO */}
          <td className="p-2 pt-3 font-medium">{loan.clienteNome}</td>
          <td className="p-2 pt-3">{loan.parcela ? `${loan.parcela}/${loan.totalParcelas || 1}` : '-'}</td>
          <td className="p-2"><Select value={loan.status} onChange={(e) => onStatusChange(loan.id, e.target.value)}>{STATUS.map(s => <option key={s} value={s}>{s}</option>)}</Select></td>
          <td className="p-2 pt-3 text-right">{fmtBRL(loan.valorEmprestado)}</td>
          <td className="p-2 pt-3">{loan.dataEmprestimo}</td>
          <td className="p-2 pt-3 text-right">{fmtBRL(loan.valorReceber)}</td>
          <td className="p-2 pt-3">{loan.dataReceber}</td>
          <td className="p-2 text-right pt-3">{scope === 'atrasados' && (() => { const dias = Math.max(0, Math.floor((todayDate - toLocalDate(loan.dataReceber))/86400000)); const tone = dias>=30?'red':(dias>=8?'amber':'green'); return <Badge tone={tone}>{dias} d</Badge>; })()}</td>
          <td className="p-2 text-right pt-3"><div className="text-emerald-300">{fmtBRL(lucro(loan))}</div><div className="text-xs text-slate-400">ROI {roi(loan).toFixed(1)}%</div></td>
          <td className="p-2 text-right">
            <Button type="button" variant="ghost" onClick={() => setIsEditing(true)}>Editar</Button>
          </td>
        </>
      )}
    </tr>
  );
}


function LoansTable({ rows, setRows, scope = 'ativos' }) {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const updateLocal = useCallback((id, patch) => setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r)), [setRows]);

  // AQUI ESTÁ A MUDANÇA: Função para apagar um empréstimo
  const handleDelete = async (loanId) => {
    if (window.confirm("Tem a certeza de que deseja excluir este registo? Esta ação não pode ser desfeita.")) {
      const { error } = await supabase.from('emprestimos').delete().eq('id', loanId);
      if (error) {
        alert("Erro ao excluir: " + error.message);
      } else {
        setRows(prevRows => prevRows.filter(row => row.id !== loanId));
        alert("Registo excluído com sucesso!");
      }
    }
  };

  const handleSave = async (loanToSave) => {
    const updates = {
      status: loanToSave.status,
      valor_emprestado: loanToSave.valorEmprestado,
      data_emprestimo: loanToSave.dataEmprestimo,
      valor_receber: loanToSave.valorReceber,
      data_receber: loanToSave.dataReceber
    };
    const { error } = await supabase.from('emprestimos').update(updates).eq('id', loanToSave.id);
    if (error) {
      alert("Erro ao salvar: " + error.message);
    } else {
      setRows(prevRows => prevRows.map(row => row.id === loanToSave.id ? loanToSave : row));
      alert("Alterações salvas com sucesso!");
    }
  };

  const handleStatusChange = useCallback(async (loanId, newStatus) => {
    let updates = { status: newStatus };
    if (newStatus === 'QUITADO') {
      updates.data_quitacao = todayISO();
    }
    const { error } = await supabase.from('emprestimos').update(updates).eq('id', loanId);
    if (error) {
      alert("Erro ao atualizar o status: " + error.message);
    } else {
      updateLocal(loanId, { status: newStatus });
    }
  }, [updateLocal]);

  const scoped = useMemo(() => rows.filter(r => (scope === 'ativos' ? r.status === 'PENDENTE' : scope === 'atrasados' ? r.status === 'ATRASADO' : scope === 'arquivo' ? r.status === 'QUITADO' : true)), [rows, scope]);

  const filtered = useMemo(() => {
    return scoped.filter(r => {
      const nameMatch = r.clienteNome && r.clienteNome.toLowerCase().includes(search.toLowerCase());
      if (!nameMatch) return false;
      if (dateFrom || dateTo) {
        const dueDate = toLocalDate(r.dataReceber);
        if (dateFrom && dueDate < toLocalDate(dateFrom)) return false;
        if (dateTo && dueDate > toLocalDate(dateTo)) return false;
      }
      return true;
    });
  }, [scoped, search, dateFrom, dateTo]);

  const ordered = useMemo(() => [...filtered].sort((a, b) => { 
      const da = toLocalDate(a.dataReceber);
      const db = toLocalDate(b.dataReceber);
      if (da - db !== 0) return da - db;
      return (a.clienteNome || '').localeCompare(b.clienteNome || '');
  }), [filtered]);

  return (
    <div className="space-y-4">
      <Card title="Lista de empréstimos" right={
        <div className="flex gap-4 items-center">
          <Input placeholder="Buscar por nome de cliente" value={search} onChange={e => setSearch(e.target.value)} className="w-56" />
          {scope === 'atrasados' && (
            <>
              <div className="flex gap-2 items-center">
                <label className="text-xs text-slate-300">De:</label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" />
              </div>
              <div className="flex gap-2 items-center">
                <label className="text-xs text-slate-300">Até:</label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" />
              </div>
              <Button variant="ghost" onClick={() => { setDateFrom(''); setDateTo(''); }}>Limpar Datas</Button>
            </>
          )}
        </div>
      }>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left">Cliente</th>
                <th className="p-2 text-left">Parcela</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-right">Valor Emprestado</th>
                <th className="p-2 text-left">Data Empréstimo</th>
                <th className="p-2 text-right">Valor a Receber</th>
                <th className="p-2 text-left">Data Recebimento</th>
                <th className="p-2 text-right">Atraso</th>
                <th className="p-2 text-right">Lucro / ROI</th>
                <th className="p-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {ordered.length === 0 && <tr><td colSpan={10} className="text-center text-slate-400 p-6">Nenhum registro encontrado.</td></tr>}
              {ordered.map(r => (
                // AQUI ESTÁ A MUDANÇA: Passamos a função onDelete para cada linha
                <LoanRow key={r.id} loan={r} onSave={handleSave} onStatusChange={handleStatusChange} onDelete={handleDelete} scope={scope} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default LoansTable;
