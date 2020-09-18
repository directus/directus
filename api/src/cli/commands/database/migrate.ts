import run from '../../../database/migrations/run';

export default async function migrate(direction: 'latest' | 'up' | 'down') {
	const database = require('../../../database').default;

	try {
		await run(database, direction);
	} catch(err) {
		console.log(err);
		process.exit(1);
	} finally {
		database.destroy();
	}
}
