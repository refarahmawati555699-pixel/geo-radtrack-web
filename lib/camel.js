// snake_case -> camelCase untuk hasil query
export function camel(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = v;
  }
  return out;
}

export function camelRows(rows) {
  return rows.map(camel);
}
