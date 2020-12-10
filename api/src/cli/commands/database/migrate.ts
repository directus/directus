import run from '../../../database/migrations/run';

import ora from 'ora';

export default async function migrate(direction: 'latest' | 'up' | 'down') {
	const database = require('../../../database').default;

	try {
		const spinnerDriver = ora('Running migrations...').start();
		await run(database, direction);
		spinnerDriver.stop();

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
