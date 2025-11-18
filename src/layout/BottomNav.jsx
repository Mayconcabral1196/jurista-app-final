import React from 'react';

function BottomNav({ active, setActive }) {
  const items = [
    { id: "dashboard", label: "Início", svgPath: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l-2 2m2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "emprestimos", label: "Empréstimos", svgPath: "M9 14l6-6m-6 0l6 6m-3 7H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-4" },
    { id: "clientes", label: "Clientes", svgPath: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4.418 0-7.854.43-9 2v1h18v-1c-1.146-1.57-4.582-2-9-2z" },
    { id: "contratos", label: "Novo", svgPath: "M12 4v16m8-8H4" }
  ];

  return (
    // Fixo na parte inferior, visível APENAS no mobile
    <div className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-700 z-50 flex justify-around items-center h-16 md:hidden shadow-2xl">
      {items.map((item) => {
        const isActive = active === item.id;
        const colorClass = isActive ? "text-emerald-400" : "text-slate-400 hover:text-slate-200";

        return (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`flex flex-col items-center justify-center p-2 transition-colors duration-200 ${colorClass}`}
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={item.svgPath} 
              />
            </svg>
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default BottomNav;