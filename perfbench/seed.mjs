const B = 'http://127.0.0.1:8155';
const login = await (await fetch(B + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.com', password: 'benchpass' }) })).json();
const T = login.data.access_token;
async function api(method, path, body) {
	const r = await fetch(B + path, { method, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + T }, body: body ? JSON.stringify(body) : undefined });
	const t = await r.text();
	if (!r.ok) throw new Error(method + ' ' + path + ' ' + r.status + ' ' + t);
	return t ? JSON.parse(t) : null;
}
const pk = { field: 'id', type: 'integer', meta: { hidden: true }, schema: { is_primary_key: true, has_auto_increment: true } };
await api('POST', '/collections', { collection: 'bench_categories', meta: { display_template: '{{name}}' }, schema: {}, fields: [pk, { field: 'name', type: 'string', meta: { interface: 'input' } }] });
await api('POST', '/collections', { collection: 'bench_items', meta: {}, schema: {}, fields: [
	pk,
	{ field: 'title', type: 'string', meta: { interface: 'input' } },
	{ field: 'subtitle', type: 'string', meta: { interface: 'input' } },
	{ field: 'sku', type: 'string', meta: { interface: 'input' } },
	{ field: 'description', type: 'text', meta: { interface: 'input-multiline' } },
	{ field: 'price', type: 'float', meta: { interface: 'input' } },
	{ field: 'quantity', type: 'integer', meta: { interface: 'input' } },
	{ field: 'published_at', type: 'dateTime', meta: { interface: 'datetime', display: 'datetime', display_options: { relative: false } } },
	{ field: 'active', type: 'boolean', meta: { interface: 'boolean', display: 'boolean' } },
	{ field: 'color', type: 'string', meta: { interface: 'select-color', display: 'color' } },
	{ field: 'category', type: 'integer', meta: { interface: 'select-dropdown-m2o', display: 'related-values', display_options: { template: '{{name}}' }, special: ['m2o'] }, schema: {} },
]});
await api('POST', '/relations', { collection: 'bench_items', field: 'category', related_collection: 'bench_categories' });
await api('POST', '/collections', { collection: 'bench_notes', meta: { display_template: '{{body}}' }, schema: {}, fields: [pk, { field: 'body', type: 'string', meta: { interface: 'input' } }, { field: 'item', type: 'integer', meta: { interface: 'select-dropdown-m2o' }, schema: {} }] });
await api('POST', '/fields/bench_items', { field: 'notes', type: 'alias', meta: { interface: 'list-o2m', special: ['o2m'], display: 'related-values', display_options: { template: '{{body}}' } } });
await api('POST', '/relations', { collection: 'bench_notes', field: 'item', related_collection: 'bench_items', meta: { one_field: 'notes' } });

await api('POST', '/items/bench_categories', Array.from({ length: 20 }, (_, i) => ({ name: 'Category ' + (i + 1) })));
const words = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet'];
const w = (i, n) => Array.from({ length: n }, (_, k) => words[(i * 7 + k * 3) % 10]).join(' ');
const items = Array.from({ length: 1000 }, (_, i) => ({
	title: 'Item ' + (i + 1) + ' ' + w(i, 3), subtitle: w(i + 1, 4), sku: 'SKU-' + String(100000 + i * 37),
	description: w(i, 12), price: Math.round((i * 13.37) % 1000 * 100) / 100, quantity: (i * 17) % 500,
	published_at: new Date(Date.UTC(2024, 0, 1) + i * 3600_000 * 7).toISOString(), active: i % 3 !== 0,
	color: '#' + ((i * 2654435761) >>> 8 & 0xffffff).toString(16).padStart(6, '0'), category: (i % 20) + 1,
}));
for (let i = 0; i < 1000; i += 250) await api('POST', '/items/bench_items', items.slice(i, i + 250));
const notes = []; for (let i = 1; i <= 1000; i++) for (let k = 0; k < 2; k++) notes.push({ body: 'Note ' + k + ' for ' + i, item: i });
for (let i = 0; i < notes.length; i += 500) await api('POST', '/items/bench_notes', notes.slice(i, i + 500));

const me = await api('GET', '/users/me');
const fields = ['title', 'subtitle', 'sku', 'description', 'price', 'quantity', 'published_at', 'active', 'color', 'category', 'notes'];
await api('POST', '/presets', { user: me.data.id, collection: 'bench_items', layout: 'tabular', layout_query: { tabular: { fields, limit: 1000, page: 1, sort: ['id'] } }, layout_options: { tabular: { spacing: 'cozy' } } });
console.log('seeded', (await api('GET', '/items/bench_items?aggregate[count]=*')).data);
