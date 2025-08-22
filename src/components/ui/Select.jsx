import React from 'react';

const Select = (p) => (<select {...p} className={`w-full rounded-lg bg-slate-800/70 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-600/40 text-slate-100 px-3 py-2 outline-none ${p.className || ""}`} />);

export default Select;