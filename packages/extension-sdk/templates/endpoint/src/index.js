module.exports = function registerEndpoint(router) {
	router.get('/', (req, res) => res.send('Hello, World!'));
};
