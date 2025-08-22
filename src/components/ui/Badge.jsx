import React from 'react';

const Badge = ({ children, tone = "neutral" }) => (
  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
      tone === "green" ? "bg-emerald-900/30 text-emerald-200 border-emerald-700/40"
    : tone === "red"   ? "bg-rose-900/30 text-rose-200 border-rose-700/40"
    : tone === "amber" ? "bg-amber-900/30 text-amber-100 border-amber-700/40"
                       : "bg-slate-800 text-slate-200 border-slate-700"}`}>{children}</span>
);

export default Badge;