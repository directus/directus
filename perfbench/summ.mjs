import fs from 'node:fs';
const files = process.argv.slice(2);
const keys = ['resizeDelta', 'resizeFrames', 'rowsMs', 'idleMs', 'loadTbt', 'heapMB', 'nodes', 'rowInp', 'rowLt', 'allInp', 'allLt', 'resizeMed', 'resizeMax', 'resizeLtSum'];
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
for (const f of files) {
	const rows = JSON.parse(fs.readFileSync(f, 'utf8'));
	for (const limit of [1000, 25]) {
		const r = rows.filter((x) => x.limit === limit);
		if (!r.length) continue;
		const cells = keys.filter((k) => r[0][k] !== undefined).map((k) => { const v = r.map((x) => x[k]); return `${k}=${Math.round(med(v))}[${Math.round(Math.min(...v))}-${Math.round(Math.max(...v))}]`; });
		console.log(f.split('/').pop().replace('.json', ''), limit, cells.join(' '));
	}
}
