// Adds ~2.2k fields (+ m2o relations) to a COPY of bench.db, to model a large project.
// The unlicensed API caps a project at 25 collections, so this is 22 collections x 100 fields rather than 150 x 15.
const B = process.env.BASE || 'http://127.0.0.1:8175';
const COLLECTIONS = Number(process.env.COLLECTIONS || 22);
const FIELDS = Number(process.env.FIELDS || 97);
const login = await (await fetch(B + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.com', password: 'benchpass' }) })).json();
const T = login.data.access_token;
async function api(method, path, body) {
	const r = await fetch(B + path, { method, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + T }, body: body ? JSON.stringify(body) : undefined });
	const t = await r.text();
	if (!r.ok) throw new Error(method + ' ' + path + ' ' + r.status + ' ' + t);
	return t ? JSON.parse(t) : null;
}
const pk = { field: 'id', type: 'integer', meta: { hidden: true }, schema: { is_primary_key: true, has_auto_increment: true } };
const types = [['string', 'input'], ['text', 'input-multiline'], ['integer', 'input'], ['float', 'input'], ['boolean', 'boolean'], ['dateTime', 'datetime']];
const name = (i) => 'ex_' + String(i).padStart(3, '0');
const existing = (await api('GET', '/collections')).data.map((c) => c.collection);
for (let i = COLLECTIONS - 1; i >= 0; i--) if (existing.includes(name(i))) await api('DELETE', '/collections/' + name(i));
for (let i = 0; i < COLLECTIONS; i++) {
	const fields = [pk];
	for (let k = 0; k < FIELDS; k++) {
		const [type, iface] = types[k % types.length];
		fields.push({ field: 'f_' + k, type, meta: { interface: iface, sort: k + 2 } });
	}
	fields.push({ field: 'parent', type: 'integer', meta: { interface: 'select-dropdown-m2o', special: ['m2o'], display: 'related-values', display_options: { template: '{{id}}' } }, schema: {} });
	fields.push({ field: 'item', type: 'integer', meta: { interface: 'select-dropdown-m2o', special: ['m2o'] }, schema: {} });
	await api('POST', '/collections', { collection: name(i), meta: { display_template: '{{f_0}}' }, schema: {}, fields });
	await api('POST', '/relations', { collection: name(i), field: 'parent', related_collection: i === 0 ? 'bench_categories' : name(i - 1) });
	// every 5th one points at bench_items, so bench_items also has more relations on its "one" side
	if (i % 5 === 0) await api('POST', '/relations', { collection: name(i), field: 'item', related_collection: 'bench_items' });
}
const f = await api('GET', '/fields');
const r = await api('GET', '/relations');
const c = await api('GET', '/collections');
console.log('fields', f.data.length, 'relations', r.data.length, 'collections', c.data.length);
