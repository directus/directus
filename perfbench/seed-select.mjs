const B = 'http://127.0.0.1:8155';
const T = (await (await fetch(B + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.com', password: 'benchpass' }) })).json()).data.access_token;
const choices = Array.from({ length: 200 }, (_, i) => ({ text: 'Option ' + String(i + 1).padStart(3, '0') + ' ' + ['alpha', 'bravo', 'charlie', 'delta'][i % 4], value: 'opt_' + (i + 1) }));
const r = await fetch(B + '/fields/bench_items', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + T }, body: JSON.stringify({ field: 'option', type: 'string', meta: { interface: 'select-dropdown', options: { choices }, sort: 1, width: 'full' } }) });
console.log(r.status);
