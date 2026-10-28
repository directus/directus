const items = Array.from({ length: 1000 }, (_, i) => ({ id: i + 1 }));
const sel = items.map((i) => ({ ...i }));
const old = (it) => sel.map((s) => s.id).includes(it.id);
const t = (f) => { for (let w = 0; w < 5; w++) items.forEach(f); const r = []; for (let k = 0; k < 20; k++) { const s = performance.now(); items.forEach(f); r.push(performance.now() - s); } r.sort((a, b) => a - b); return r[10].toFixed(2); };
console.log('old per render ms', t(old));
console.log('set per render ms (incl build)', t((() => { let set; return (it) => { if (it.id === 1) set = new Set(sel.map((s) => s.id)); return set.has(it.id); }; })()));
