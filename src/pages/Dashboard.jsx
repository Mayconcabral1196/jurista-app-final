import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { DollarSign, TrendingUp, Users, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { fmtBRL, num } from '../utils/helpers';
import Card from '../components/ui/Card';

// Cores para o gráfico de Pizza (Status)
const COLORS = {
  'PENDENTE': '#10b981', // Emerald 500
  'ATRASADO': '#ef4444', // Red 500
  'QUITADO':  '#3b82f6', // Blue 500
};

function Dashboard({ rows = [] }) {

  // --- 1. CÁLCULOS REAIS (KPIs) ---
  const kpis = useMemo(() => {
    const totalEmprestado = rows.reduce((acc, r) => acc + num(r.valorEmprestado), 0);
    const totalReceber = rows.reduce((acc, r) => acc + num(r.valorReceber), 0);
    
    const ativos = rows.filter(r => r.status !== 'QUITADO');
    const atrasados = rows.filter(r => r.status === 'ATRASADO');
    
    const taxaInadimplencia = ativos.length > 0 
      ? (atrasados.length / ativos.length) * 100 
      : 0;

    // Lucro estimado (simples)
    const lucro = totalReceber - totalEmprestado;

    return { totalEmprestado, totalReceber, qtdAtivos: ativos.length, taxaInadimplencia, lucro };
  }, [rows]);

  // --- 2. DADOS PARA GRÁFICO DE PIZZA ---
  const pieData = useMemo(() => {
    const counts = { 'PENDENTE': 0, 'ATRASADO': 0, 'QUITADO': 0 };
    rows.forEach(r => {
      if (counts[r.status] !== undefined) counts[r.status]++;
    });
    return [
      { name: 'Em dia', value: counts['PENDENTE'], color: COLORS.PENDENTE },
      { name: 'Atrasado', value: counts['ATRASADO'], color: COLORS.ATRASADO },
      { name: 'Quitado', value: counts['QUITADO'], color: COLORS.QUITADO },
    ].filter(i => i.value > 0);
  }, [rows]);

  // --- 3. DADOS PARA GRÁFICO DE ÁREA (Evolução) ---
  // Agrupa empréstimos por mês baseando-se na data de empréstimo
  const areaData = useMemo(() => {
    const groups = {};
    // Ordena por data
    const sorted = [...rows].sort((a, b) => new Date(a.dataEmprestimo) - new Date(b.dataEmprestimo));
    
    sorted.forEach(r => {
        if(!r.dataEmprestimo) return;
        // Pega "Mês/Ano" ex: "11/2025"
        const dateObj = new Date(r.dataEmprestimo);
        const key = dateObj.toLocaleDateString('pt-BR', { month: 'short' }); // ex: "nov"
        
        if (!groups[key]) groups[key] = 0;
        groups[key] += num(r.valorEmprestado);
    });

    return Object.keys(groups).map(key => ({
        name: key,
        valor: groups[key]
    }));
  }, [rows]);

  return (
    <div className="space-y-6 pb-20"> {/* pb-20 para não ficar atrás do menu mobile */}
      
      {/* === CABEÇALHO === */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
        <div>
            <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
            <p className="text-sm text-slate-400">Visão geral dos seus empréstimos e estatísticas</p>
        </div>
        <div className="text-xs text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800 self-start md:self-auto">
            Atualizado agora
        </div>
      </div>

      {/* === CARDS DE KPI (Topo) === */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Emprestado */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <DollarSign size={48} className="text-emerald-500" />
            </div>
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <DollarSign size={20} className="text-emerald-400" />
                </div>
                <span className="flex items-center text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                    <ArrowUpRight size={12} className="mr-1" /> Ativo
                </span>
            </div>
            <div className="text-slate-400 text-xs font-medium mb-1">Total Emprestado</div>
            <div className="text-2xl font-bold text-slate-100">{fmtBRL(kpis.totalEmprestado)}</div>
        </div>

        {/* Card 2: A Receber */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp size={48} className="text-blue-500" />
            </div>
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                    <TrendingUp size={20} className="text-blue-400" />
                </div>
                 <span className="flex items-center text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                    Lucro: {fmtBRL(kpis.lucro)}
                </span>
            </div>
            <div className="text-slate-400 text-xs font-medium mb-1">Previsão a Receber</div>
            <div className="text-2xl font-bold text-slate-100">{fmtBRL(kpis.totalReceber)}</div>
        </div>

        {/* Card 3: Ativos */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users size={48} className="text-violet-500" />
            </div>
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-violet-500/10 rounded-lg">
                    <Users size={20} className="text-violet-400" />
                </div>
            </div>
            <div className="text-slate-400 text-xs font-medium mb-1">Empréstimos Ativos</div>
            <div className="text-2xl font-bold text-slate-100">{kpis.qtdAtivos}</div>
        </div>

        {/* Card 4: Inadimplência */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <AlertCircle size={48} className="text-amber-500" />
            </div>
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                    <AlertCircle size={20} className="text-amber-400" />
                </div>
                <span className={`flex items-center text-xs font-medium px-2 py-1 rounded ${kpis.taxaInadimplencia > 10 ? 'text-red-400 bg-red-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>
                    {kpis.taxaInadimplencia > 0 ? <ArrowDownRight size={12} className="mr-1" /> : <ArrowUpRight size={12} className="mr-1" />}
                    {kpis.taxaInadimplencia.toFixed(1)}%
                </span>
            </div>
            <div className="text-slate-400 text-xs font-medium mb-1">Taxa de Inadimplência</div>
            <div className="text-2xl font-bold text-slate-100">{kpis.taxaInadimplencia.toFixed(1)}%</div>
        </div>
      </div>

      {/* === GRÁFICOS (Meio) === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Área (Evolução) - Ocupa 2 colunas */}
        <div className="lg:col-span-2 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
            <h3 className="text-sm font-bold text-slate-200 mb-4">Evolução Mensal (Valor Emprestado)</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={areaData}>
                        <defs>
                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value/1000}k`} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                            itemStyle={{ color: '#10b981' }}
                            formatter={(value) => [fmtBRL(value), 'Emprestado']}
                        />
                        <Area type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Gráfico de Pizza (Status) - Ocupa 1 coluna */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
             <h3 className="text-sm font-bold text-slate-200 mb-4">Status da Carteira</h3>
             <div className="h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
                {/* Texto no meio do Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-slate-100">{rows.length}</span>
                    <span className="text-xs text-slate-500">Total</span>
                </div>
             </div>
        </div>
      </div>

      {/* === TABELA RECENTES (Baixo) === */}
      <Card title="Empréstimos Recentes">
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
                <thead className="text-slate-400 border-b border-slate-800">
                    <tr>
                        <th className="pb-3 font-medium">Cliente</th>
                        <th className="pb-3 font-medium">Valor</th>
                        <th className="pb-3 font-medium">Lucro Previsto</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium text-right">Vencimento</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {rows.slice(0, 5).map((row) => {
                         const lucroVal = num(row.valorReceber) - num(row.valorEmprestado);
                         const statusColor = row.status === 'PENDENTE' ? 'text-emerald-400 bg-emerald-500/10' : row.status === 'ATRASADO' ? 'text-red-400 bg-red-500/10' : 'text-blue-400 bg-blue-500/10';
                         
                         return (
                            <tr key={row.id} className="group hover:bg-slate-800/50 transition-colors">
                                <td className="py-3 font-medium text-slate-200">{row.clienteNome}</td>
                                <td className="py-3 text-slate-300">{fmtBRL(row.valorEmprestado)}</td>
                                <td className="py-3 text-emerald-400">+{fmtBRL(lucroVal)}</td>
                                <td className="py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
                                        {row.status}
                                    </span>
                                </td>
                                <td className="py-3 text-right text-slate-400">{row.dataReceber}</td>
                            </tr>
                         );
                    })}
                    {rows.length === 0 && (
                        <tr><td colSpan={5} className="py-4 text-center text-slate-500">Nenhum dado recente.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </Card>

    </div>
  );
}

export default Dashboard;