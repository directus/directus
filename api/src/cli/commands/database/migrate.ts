/* eslint-disable no-console */

import run from '../../../database/migrations/run';
import getDatabase from '../../../database';

export default async function migrate(direction: 'latest' | 'up' | 'down'): Promise<void> {
	const database = getDatabase();

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
