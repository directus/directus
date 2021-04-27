import run from '../../../database/migrations/run';

export default async function migrate(direction: 'latest' | 'up' | 'down') {
	const database = require('../../../database').default;

	try {
		console.log('✨ Running migrations...');

		await run(database, direction);

		if (direction === 'down') {
			console.log('✨ Downgrade successful');
		} else {
			console.log('✨ Database up to date');
		}
		database.destroy();
		process.exit();
	} catch (err) {
		console.log(err);
		database.destroy();
		process.exit(1);
	}
}
