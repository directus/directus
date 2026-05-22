export default (router, { env }) => {
	router.post('/set', (req, res) => {
		if (!env) {
			return res.status(500).json({ errors: [{ message: 'env not provided in extension context' }] });
		}

		const { key, value } = req.body ?? {};

		if (typeof key !== 'string' || key.length === 0) {
			return res.status(400).json({ errors: [{ message: 'missing string "key"' }] });
		}

		env[key] = value;
		res.json({ data: { key, value } });
	});
};
