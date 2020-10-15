export default async function start() {
	const startServer = require('../../server').start;

	await startServer();
}
