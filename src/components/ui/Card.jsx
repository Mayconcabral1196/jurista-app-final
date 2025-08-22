import React from 'react';

const Card = ({ title, right, children }) => (
  <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-slate-100 font-semibold">{title}</h3>
      {right}
    </div>
    {children}
  </div>
);

export default Card;