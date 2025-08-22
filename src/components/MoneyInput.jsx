import React, { useState, useEffect } from "react";
import Input from "./ui/Input";

function MoneyInput({ value, onChange, ...props }) {
  const [txt, setTxt] = useState(value ?? "");
  useEffect(() => setTxt(value ?? ""), [value]);
  const toNumber = (s) => { if (s === "") return ""; const clean = s.toString().replace(/\./g, "").replace(",", "."); const n = Number(clean); return isNaN(n) ? "" : n; };
  const emit = (n) => { if (n === "") onChange({ target: { value: "" } }); else onChange({ target: { value: String(n) } }); };

  return (
    <Input {...props} type="text" value={txt} inputMode="decimal"
      onChange={(e) => { const val = e.target.value; setTxt(val); emit(toNumber(val)); }}
      onBlur={() => { const n = toNumber(txt); if (n === "") { emit(""); return; } emit(n); setTxt(n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })); onChange({ target: { value: String(n.toFixed(2)) } }); }} />
  );
}

export default MoneyInput;