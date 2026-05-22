const MAX = 5000;
const buffer = [];

function recordQuery(q) {
	const bindings = Array.isArray(q?.bindings) ? q.bindings.map((b) => (b === null ? '' : String(b))).join(' ') : '';

	buffer.push({ sql: q?.sql ?? '', bindings, t: Date.now() });

	if (buffer.length > MAX) {
		buffer.shift();
	}
}

export default (router, { database }) => {
	if (!database.__queryCounterAttached) {
		database.on('query', recordQuery);
		database.__queryCounterAttached = true;
	}

	router.get('/queries', (req, res) => {
		const containsBinding = typeof req.query.containsBinding === 'string' ? req.query.containsBinding : '';
		const containsSql = typeof req.query.containsSql === 'string' ? req.query.containsSql.toLowerCase() : '';

		const matches = buffer.filter((entry) => {
			if (containsBinding && !entry.bindings.includes(containsBinding)) return false;
			if (containsSql && !entry.sql.toLowerCase().includes(containsSql)) return false;
			return true;
		});

		res.json({ data: matches, total: buffer.length });
	});

	router.post('/reset', (_req, res) => {
		buffer.length = 0;
		res.json({ data: { reset: true } });
	});
};
