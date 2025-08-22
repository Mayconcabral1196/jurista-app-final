import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import Card from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';

// --- Componente para uma única linha da tabela (agora completo) ---
function ClienteRow({ cliente, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCliente, setEditedCliente] = useState(cliente);

  useEffect(() => {
    setEditedCliente(cliente);
  }, [cliente]);

  const handleInputChange = (field, value) => {
    setEditedCliente({ ...editedCliente, [field]: value });
  };

  const handleSave = () => {
    onUpdate(editedCliente);
    setIsEditing(false);
  };

  const scoreTone = {
    'Excelente': 'green',
    'Bom': 'green',
    'Regular': 'amber',
    'Mau': 'red',
  }[cliente.score] || 'neutral';

  return (
    <tr className="border-t border-slate-800 align-top">
      {isEditing ? (
        <>
          <td className="p-2"><Input value={editedCliente.nome || ''} onChange={(e) => handleInputChange('nome', e.target.value)} /></td>
          <td className="p-2"><Input value={editedCliente.documento || ''} maxLength="11" onChange={(e) => handleInputChange('documento', e.target.value)} /></td>
          <td className="p-2"><Input type="date" value={editedCliente.nascimento || ''} onChange={(e) => handleInputChange('nascimento', e.target.value)} /></td>
          <td className="p-2"><Input value={editedCliente.rua || ''} onChange={(e) => handleInputChange('rua', e.target.value)} /></td>
          <td className="p-2"><Input value={editedCliente.numero || ''} onChange={(e) => handleInputChange('numero', e.target.value)} /></td>
          <td className="p-2"><Input value={editedCliente.bairro || ''} onChange={(e) => handleInputChange('bairro', e.target.value)} /></td>
          <td className="p-2"><Input value={editedCliente.cidade || ''} onChange={(e) => handleInputChange('cidade', e.target.value)} /></td>
          <td className="p-2 pt-3"><Badge tone={scoreTone}>{cliente.score}</Badge></td>
          <td className="p-2 text-right">
            <div className="flex gap-2 justify-end">
              <Button onClick={handleSave}>Salvar</Button>
              <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
            </div>
          </td>
        </>
      ) : (
        <>
          <td className="p-2 pt-3">{cliente.nome}</td>
          <td className="p-2 pt-3">{cliente.documento}</td>
          <td className="p-2 pt-3">{cliente.nascimento}</td>
          <td className="p-2 pt-3">{cliente.rua}</td>
          <td className="p-2 pt-3">{cliente.numero}</td>
          <td className="p-2 pt-3">{cliente.bairro}</td>
          <td className="p-2 pt-3">{cliente.cidade}</td>
          <td className="p-2 pt-3"><Badge tone={scoreTone}>{cliente.score}</Badge></td>
          <td className="p-2 text-right">
            <Button variant="ghost" onClick={() => setIsEditing(true)}>Editar</Button>
          </td>
        </>
      )}
    </tr>
  );
}

// --- Componente principal da página de Clientes ---
function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [draft, setDraft] = useState({ nome: '', documento: '', nascimento: '', rua: '', numero: '', bairro: '', cidade: '' });
  const [loading, setLoading] = useState(true);

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    const { data: clientsData, error: clientsError } = await supabase.from('clientes').select('*').order('created_at', { ascending: false });
    
    if (clientsError) {
      console.error("Erro ao buscar clientes:", clientsError);
      alert("Não foi possível carregar os clientes.");
      setLoading(false);
      return;
    }

    if (!clientsData) {
      setClientes([]);
      setLoading(false);
      return;
    }

    const clientsWithScores = await Promise.all(
      clientsData.map(async (client) => {
        const { data: scoreData, error: scoreError } = await supabase.rpc('calcular_score_cliente', {
          p_cliente_id: client.id
        });

        if (scoreError) {
          console.error(`Erro ao calcular score para ${client.nome}:`, scoreError);
          return { ...client, score: 'N/A' };
        }
        return { ...client, score: scoreData };
      })
    );

    setClientes(clientsWithScores);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const handleCreate = async () => {
    if (!draft.nome || !draft.documento) {
      alert("Nome e Documento são obrigatórios.");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const clienteParaSalvar = { ...draft, user_id: user.id };
    const { data, error } = await supabase.from('clientes').insert([clienteParaSalvar]).select();
    
    if (error) {
      alert("Erro ao criar cliente: " + error.message);
    } else {
      fetchClientes(); // Recarrega a lista para obter o score do novo cliente
      setDraft({ nome: '', documento: '', nascimento: '', rua: '', numero: '', bairro: '', cidade: '' });
      alert("Cliente criado com sucesso!");
    }
  };
  
  const handleUpdate = async (cliente) => {
    const { id, created_at, user_id, score, ...updates } = cliente;
    const { error } = await supabase.from('clientes').update(updates).eq('id', cliente.id);
    if (error) {
      alert("Erro ao atualizar cliente: " + error.message);
    } else {
      setClientes(clientes.map(c => c.id === id ? cliente : c));
      alert("Cliente atualizado com sucesso!");
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Novo Cliente">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 items-end">
          <div className="lg:col-span-2">
            <label className="block text-xs text-slate-300 mb-1">Nome Completo</label>
            <Input placeholder="Nome do Cliente" value={draft.nome} onChange={(e) => setDraft({ ...draft, nome: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">CPF (apenas números)</label>
            <Input placeholder="12345678901" maxLength="11" value={draft.documento} onChange={(e) => setDraft({ ...draft, documento: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Data de Nascimento</label>
            <Input type="date" value={draft.nascimento} onChange={(e) => setDraft({ ...draft, nascimento: e.target.value })} />
          </div>
          <div className="lg:col-span-3">
            <label className="block text-xs text-slate-300 mb-1">Rua</label>
            <Input placeholder="Ex: Rua Principal" value={draft.rua} onChange={(e) => setDraft({ ...draft, rua: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Número</label>
            <Input placeholder="123" value={draft.numero} onChange={(e) => setDraft({ ...draft, numero: e.target.value })} />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-xs text-slate-300 mb-1">Bairro</label>
            <Input placeholder="Centro" value={draft.bairro} onChange={(e) => setDraft({ ...draft, bairro: e.target.value })} />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-xs text-slate-300 mb-1">Cidade</label>
            <Input placeholder="Sua Cidade" value={draft.cidade} onChange={(e) => setDraft({ ...draft, cidade: e.target.value })} />
          </div>
          <div className="lg:col-span-2">
            <Button className="w-full" onClick={handleCreate}>Cadastrar Cliente</Button>
          </div>
        </div>
      </Card>

      <Card title="Lista de Clientes">
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="p-2">Nome</th>
                <th className="p-2">CPF</th>
                <th className="p-2">Nascimento</th>
                <th className="p-2">Rua</th>
                <th className="p-2">Número</th>
                <th className="p-2">Bairro</th>
                <th className="p-2">Cidade</th>
                <th className="p-2">Score</th>
                <th className="p-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="9" className="text-center p-4">Carregando...</td></tr>}
              {!loading && clientes.map(cliente => (
                <ClienteRow key={cliente.id} cliente={cliente} onUpdate={handleUpdate} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default Clientes;
