import React from 'react';

const Button = ({ children, className = "", variant = "primary", disabled = false, ...props }) => (
  <button className={`${variant === "danger" ? "bg-rose-600 hover:bg-rose-500" : variant === "ghost" ? "bg-transparent hover:bg-slate-800/60" : "bg-emerald-600 hover:bg-emerald-500"} text-white px-3 py-2 rounded-xl font-medium shadow-sm transition ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""} ${className}`} disabled={disabled} {...props}>{children}</button>
);

export default Button;