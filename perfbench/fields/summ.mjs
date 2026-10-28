import fs from 'node:fs';
const keys = ['inputMs', 'rowsMs', 'idleMs', 'loadTbt', 'heapMB', 'nodes', 'rowInp', 'allInp', 'resizeMed', 'resizeMax', 'resizeDelta', 'keyMed', 'keyMax', 'keyCount', 'keyLtSum', 'loadLtSum'];
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
for (const f of process.argv.slice(2)) {
	const rows = JSON.parse(fs.readFileSync(f, 'utf8'));
	for (const limit of [...new Set(rows.map((x) => x.limit))]) {
		const r = rows.filter((x) => x.limit === limit);
		const cells = keys.filter((k) => r[0][k] !== undefined).map((k) => { const v = r.map((x) => x[k]); return `${k}=${Math.round(med(v))}[${Math.round(Math.min(...v))}-${Math.round(Math.max(...v))}]`; });
		console.log(f.split('/').pop().replace('.json', ''), limit ?? 'form', cells.join(' '));
	}
}
