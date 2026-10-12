"use client";

import { useEffect, useState } from "react";

// Input yang menyimpan ke database saat kursor keluar dari sel (blur) atau menekan Enter.
export function Cell({ value, onCommit, className = "cell", ...rest }) {
  const [v, setV] = useState(value ?? "");
  useEffect(() => {
    setV(value ?? "");
  }, [value]);
  return (
    <input
      className={className}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        if (String(v) !== String(value ?? "")) onCommit(v);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      {...rest}
    />
  );
}

// Versi textarea (Enter = baris baru, simpan saat blur)
export function CellArea({ value, onCommit, className = "cell", ...rest }) {
  const [v, setV] = useState(value ?? "");
  useEffect(() => {
    setV(value ?? "");
  }, [value]);
  return (
    <textarea
      className={className}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        if (String(v) !== String(value ?? "")) onCommit(v);
      }}
      {...rest}
    />
  );
}
